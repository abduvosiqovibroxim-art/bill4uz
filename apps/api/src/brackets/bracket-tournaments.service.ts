import { randomInt } from "node:crypto";
import { ForbiddenException, HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, Role, TeamMemberStatus, TournamentStatus } from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { AuditService } from "../platform/audit.service";
import { BracketHttpException } from "./bracket.exception";
import { BracketParticipantInput } from "./bracket.types";
import {
  assertSupportedBracketSize,
  assertTournamentMutable,
  getSeedOrder,
  getRoundLabel
} from "./bracket.utils";
import { BracketGenerationService } from "./bracket-generation.service";
import { isTeamComplete, isTeamFormat } from "../teams/teams.util";

const bracketParticipantInclude = Prisma.validator<Prisma.BracketParticipantInclude>()({
  player: {
    include: {
      city: true,
      country: true,
      club: true
    }
  }
});

const bracketMatchInclude = Prisma.validator<Prisma.BracketMatchInclude>()({
  player1: {
    include: bracketParticipantInclude
  },
  player2: {
    include: bracketParticipantInclude
  },
  winner: {
    include: bracketParticipantInclude
  },
  loser: {
    include: bracketParticipantInclude
  },
  nextMatch: {
    select: {
      id: true,
      round: true,
      matchNumber: true
    }
  }
});

@Injectable()
export class BracketTournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bracketGenerationService: BracketGenerationService,
    private readonly auditService: AuditService
  ) {}

  async addParticipants(tournamentId: string, input: BracketParticipantInput[], actor: RequestUser) {
    const tournament = await this.getTournamentForMutation(tournamentId);
    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    this.assertCanManageTournament(actor, tournament.organizerId);
    assertTournamentMutable(tournament.status);
    assertSupportedBracketSize(tournament.bracketSize);

    const matchCount = await this.prisma.bracketMatch.count({
      where: { tournamentId }
    });
    if (matchCount > 0) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Cannot add participants after bracket generation.");
    }

    const existingParticipants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      orderBy: { seed: "asc" }
    });

    if (existingParticipants.length + input.length > tournament.bracketSize!) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Participant count exceeds bracket size.");
    }

    const existingPlayerIds = new Set(
      existingParticipants.map((participant) => participant.playerId).filter((playerId): playerId is string => Boolean(playerId))
    );
    const occupiedSeeds = new Set(existingParticipants.map((participant) => participant.seed));
    const explicitSeeds = new Set<number>();
    const inputPlayerIds = new Set<string>();

    for (const participant of input) {
      if (existingPlayerIds.has(participant.playerId) || inputPlayerIds.has(participant.playerId)) {
        throw new BracketHttpException(HttpStatus.CONFLICT, "Player is already in the tournament bracket pool.");
      }

      inputPlayerIds.add(participant.playerId);

      if (participant.seed === undefined) {
        continue;
      }

      if (participant.seed < 1 || participant.seed > tournament.bracketSize!) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Seed must be between 1 and bracket size.");
      }

      if (occupiedSeeds.has(participant.seed) || explicitSeeds.has(participant.seed)) {
        throw new BracketHttpException(HttpStatus.CONFLICT, "Seed must be unique within the tournament.");
      }

      explicitSeeds.add(participant.seed);
    }

    const availableSeeds = Array.from({ length: tournament.bracketSize! }, (_, index) => index + 1).filter(
      (seed) => !occupiedSeeds.has(seed) && !explicitSeeds.has(seed)
    );

    const players = await this.prisma.player.findMany({
      where: {
        id: {
          in: [...inputPlayerIds]
        }
      },
      select: {
        id: true,
        fullName: true
      }
    });
    const playersById = new Map(players.map((player) => [player.id, player]));

    if (playersById.size !== inputPlayerIds.size) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Only existing players can be added to the bracket.");
    }

    await this.prisma.bracketParticipant.createMany({
      data: input.map((participant) => ({
        tournamentId,
        name: playersById.get(participant.playerId)!.fullName,
        seed: participant.seed ?? availableSeeds.shift()!,
        playerId: participant.playerId
      }))
    });

    return this.listParticipants(tournamentId);
  }

  /** Register complete teams into a team-format tournament bracket. */
  async addTeamParticipants(tournamentId: string, teamIds: string[], actor: RequestUser) {
    const tournament = await this.getTournamentForMutation(tournamentId);
    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    this.assertCanManageTournament(actor, tournament.organizerId);
    assertTournamentMutable(tournament.status);
    assertSupportedBracketSize(tournament.bracketSize);

    if (!isTeamFormat(tournament.eventFormat)) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "This tournament is not a team event.");
    }

    const matchCount = await this.prisma.bracketMatch.count({ where: { tournamentId } });
    if (matchCount > 0) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Cannot add participants after bracket generation.");
    }

    const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))];
    if (uniqueTeamIds.length === 0) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "At least one team is required.");
    }

    const existingParticipants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      orderBy: { seed: "asc" }
    });
    if (existingParticipants.length + uniqueTeamIds.length > tournament.bracketSize!) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Participant count exceeds bracket size.");
    }

    const existingTeamIds = new Set(
      existingParticipants.map((participant) => participant.teamId).filter((id): id is string => Boolean(id))
    );

    const teams = await this.prisma.team.findMany({
      where: { id: { in: uniqueTeamIds }, deletedAt: null },
      include: { members: { where: { status: TeamMemberStatus.ACTIVE } } }
    });
    const teamsById = new Map(teams.map((team) => [team.id, team]));

    for (const teamId of uniqueTeamIds) {
      if (existingTeamIds.has(teamId)) {
        throw new BracketHttpException(HttpStatus.CONFLICT, "Team is already in the tournament bracket.");
      }
      const team = teamsById.get(teamId);
      if (!team) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Only existing teams can be added.");
      }
      if (team.eventFormat !== tournament.eventFormat) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, `Team "${team.name}" format does not match the tournament.`);
      }
      if (!isTeamComplete(team.eventFormat, team.members.length)) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, `Team "${team.name}" roster is incomplete.`);
      }
    }

    const occupiedSeeds = new Set(existingParticipants.map((participant) => participant.seed));
    const availableSeeds = Array.from({ length: tournament.bracketSize! }, (_, index) => index + 1).filter(
      (seed) => !occupiedSeeds.has(seed)
    );

    await this.prisma.bracketParticipant.createMany({
      data: uniqueTeamIds.map((teamId) => ({
        tournamentId,
        name: teamsById.get(teamId)!.name,
        seed: availableSeeds.shift()!,
        teamId
      }))
    });

    await this.auditService.log({
      actor,
      action: "bracket.team-participants.add",
      entityType: "tournament",
      entityId: tournamentId,
      metadata: { teamIds: uniqueTeamIds }
    });

    return this.listParticipants(tournamentId);
  }

  /** Standings table for round-robin / swiss / group tournaments. */
  async getStandings(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, bracketSystem: true, status: true }
    });
    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    const participants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      select: { id: true, name: true, seed: true, teamId: true, playerId: true }
    });
    const matches = await this.prisma.bracketMatch.findMany({
      where: { tournamentId },
      select: {
        player1Id: true,
        player2Id: true,
        winnerId: true,
        status: true,
        isBye: true,
        player1Score: true,
        player2Score: true
      }
    });

    interface StandingRow {
      participantId: string;
      name: string;
      seed: number;
      played: number;
      wins: number;
      losses: number;
      points: number;
      scoreFor: number;
      scoreAgainst: number;
    }

    const rows = new Map<string, StandingRow>();
    for (const participant of participants) {
      rows.set(participant.id, {
        participantId: participant.id,
        name: participant.name,
        seed: participant.seed,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        scoreFor: 0,
        scoreAgainst: 0
      });
    }

    for (const match of matches) {
      if (match.status !== "FINISHED" || !match.winnerId) {
        continue;
      }
      // A Swiss bye counts as a free win for the player who received it.
      if (match.isBye) {
        const byeRow = rows.get(match.winnerId);
        if (byeRow) {
          byeRow.played += 1;
          byeRow.wins += 1;
          byeRow.points += 3;
        }
        continue;
      }
      if (!match.player1Id || !match.player2Id) {
        continue;
      }
      const home = rows.get(match.player1Id);
      const away = rows.get(match.player2Id);
      if (!home || !away) {
        continue;
      }
      const homeScore = match.player1Score ?? 0;
      const awayScore = match.player2Score ?? 0;
      home.played += 1;
      away.played += 1;
      home.scoreFor += homeScore;
      home.scoreAgainst += awayScore;
      away.scoreFor += awayScore;
      away.scoreAgainst += homeScore;

      if (match.winnerId === match.player1Id) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (match.winnerId === match.player2Id) {
        away.wins += 1;
        away.points += 3;
        home.losses += 1;
      }
    }

    const standings = [...rows.values()]
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.scoreFor - b.scoreAgainst - (a.scoreFor - a.scoreAgainst) ||
          b.wins - a.wins ||
          a.seed - b.seed
      )
      .map((row, index) => ({ position: index + 1, ...row, scoreDiff: row.scoreFor - row.scoreAgainst }));

    return {
      tournamentId,
      system: tournament.bracketSystem,
      finished: tournament.status === "FINISHED",
      standings
    };
  }

  async removeParticipant(tournamentId: string, participantId: string, actor: RequestUser) {
    const tournament = await this.getTournamentForMutation(tournamentId);
    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    this.assertCanManageTournament(actor, tournament.organizerId);
    assertTournamentMutable(tournament.status);

    const matchCount = await this.prisma.bracketMatch.count({
      where: { tournamentId }
    });
    if (matchCount > 0) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Cannot remove participants after bracket generation.");
    }

    const participant = await this.prisma.bracketParticipant.findFirst({
      where: {
        id: participantId,
        tournamentId
      },
      select: {
        id: true
      }
    });

    if (!participant) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Participant not found in this tournament.");
    }

    await this.prisma.bracketParticipant.delete({
      where: { id: participant.id }
    });

    return this.listParticipants(tournamentId);
  }

  async listParticipants(tournamentId: string) {
    await this.ensureTournamentExists(tournamentId);

    const participants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      include: bracketParticipantInclude,
      orderBy: { seed: "asc" }
    });

    return participants.map((participant) => ({
      id: participant.id,
      playerId: participant.playerId,
      seed: participant.seed,
      fullName: participant.player?.fullName ?? participant.name,
      clubName: participant.player?.club?.name ?? null,
      cityName: participant.player?.city?.name ?? null,
      countryName: participant.player?.country?.name ?? null,
      rating: participant.player?.elo ?? 0,
      wins: participant.player?.wins ?? 0,
      losses: participant.player?.losses ?? 0
    }));
  }

  async generateBracket(tournamentId: string, actor: RequestUser) {
    const tournament = await this.ensureTournamentExists(tournamentId);
    this.assertCanManageTournament(actor, tournament.organizerId);
    const result = await this.bracketGenerationService.generate(tournamentId);
    await this.auditService.log({
      actor,
      action: "bracket.generate",
      entityType: "tournament",
      entityId: tournamentId
    });
    return result;
  }

  async manualDraw(tournamentId: string, names: string[], actor: RequestUser) {
    const tournament = await this.getTournamentForMutation(tournamentId);
    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    this.assertCanManageTournament(actor, tournament.organizerId);
    assertTournamentMutable(tournament.status);
    assertSupportedBracketSize(tournament.bracketSize);

    const normalizedNames = names.map((name) => name.trim()).filter(Boolean);
    if (normalizedNames.length < 2) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "At least two participant names are required.");
    }

    if (normalizedNames.length > tournament.bracketSize!) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Participant count exceeds bracket size.");
    }

    const uniqueNames = new Set(normalizedNames.map((name) => name.toLocaleLowerCase()));
    if (uniqueNames.size !== normalizedNames.length) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Participant names must be unique.");
    }

    const matchCount = await this.prisma.bracketMatch.count({
      where: { tournamentId }
    });
    if (matchCount > 0) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Bracket already generated for this tournament.");
    }

    const participantCount = await this.prisma.bracketParticipant.count({
      where: { tournamentId }
    });
    if (participantCount > 0) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Manual draw requires an empty participant pool.");
    }

    const seedOrder = getSeedOrder(tournament.bracketSize!);
    const shuffledNames = shuffle(normalizedNames);

    await this.prisma.bracketParticipant.createMany({
      data: shuffledNames.map((name, index) => ({
        tournamentId,
        name,
        seed: seedOrder[index],
        playerId: null
      }))
    });

    const result = await this.bracketGenerationService.generate(tournamentId);
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: TournamentStatus.LIVE,
        participants: normalizedNames.length
      }
    });

    await this.auditService.log({
      actor,
      action: "bracket.manual_draw",
      entityType: "tournament",
      entityId: tournamentId,
      metadata: {
        participantCount: normalizedNames.length,
        bracketSize: tournament.bracketSize
      }
    });

    return {
      ...result,
      status: TournamentStatus.LIVE,
      participants: shuffledNames.map((name, index) => ({
        name,
        slot: index + 1,
        seed: seedOrder[index]
      }))
    };
  }

  async getBracket(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        bracketParticipants: {
          include: bracketParticipantInclude,
          orderBy: { seed: "asc" }
        },
        bracketMatches: {
          include: bracketMatchInclude,
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
        }
      }
    });

    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    const roundsMap = new Map<number, typeof tournament.bracketMatches>();

    for (const match of tournament.bracketMatches) {
      const group = roundsMap.get(match.round) ?? [];
      group.push(match);
      roundsMap.set(match.round, group);
    }

    const rounds = [...roundsMap.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([round, matches]) => ({
        round,
        phase: matches[0]?.phase ?? "UPPER",
        label: getRoundLabel(tournament.bracketSize ?? 0, round),
        matches
      }));

    return {
      tournament: this.mapTournamentSummary(tournament),
      rounds
    };
  }

  async listMatches(tournamentId: string) {
    await this.ensureTournamentExists(tournamentId);

    return this.prisma.bracketMatch.findMany({
      where: { tournamentId },
      include: bracketMatchInclude,
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
    });
  }

  async getChampion(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        bracketMatches: {
          include: bracketMatchInclude,
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
        }
      }
    });

    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    if (tournament.bracketMatches.length === 0) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Bracket has not been generated yet.");
    }

    const finalRound = Math.max(...tournament.bracketMatches.map((match) => match.round));
    const finalMatch = tournament.bracketMatches.find((match) => match.round === finalRound);

    if (!finalMatch?.winner) {
      throw new BracketHttpException(
        HttpStatus.BAD_REQUEST,
        "Champion is not defined until the final match is finished."
      );
    }

    return {
      tournamentId,
      champion: finalMatch.winner
    };
  }

  private async ensureTournamentExists(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        organizerId: true
      }
    });

    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    return tournament;
  }

  private getTournamentForMutation(tournamentId: string) {
    return this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        status: true,
        bracketSize: true,
        bracketFormat: true,
        eventFormat: true,
        createdAt: true
      }
    });
  }

  private mapTournamentSummary(tournament: {
    id: string;
    title: string;
    bracketFormat: string;
    bracketSize: number | null;
    status: string;
    createdAt: Date;
    bracketParticipants: unknown[];
    bracketMatches: unknown[];
  }) {
    return {
      id: tournament.id,
      name: tournament.title,
      format: tournament.bracketFormat,
      bracketSize: tournament.bracketSize,
      status: tournament.status,
      createdAt: tournament.createdAt,
      participantCount: tournament.bracketParticipants.length,
      matchCount: tournament.bracketMatches.length
    };
  }

  private assertCanManageTournament(actor: RequestUser, organizerId: string) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (actor.role === Role.ORGANIZER && actor.sub === organizerId) {
      return;
    }

    throw new ForbiddenException("Forbidden");
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }

  return copy;
}
