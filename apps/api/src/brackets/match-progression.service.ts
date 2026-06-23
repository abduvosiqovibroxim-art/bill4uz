import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, TournamentStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { playerLevelFromPoints } from "../players/player-levels";
import { BracketHttpException } from "./bracket.exception";
import { BracketMatchPhases, BracketMatchStatuses, BracketNextSlots } from "./bracket.types";
import {
  buildMatchBlueprints,
  buildSwissRoundBlueprints,
  pairSwissRound,
  swissPairKey,
  swissRoundTarget,
  selectPlayoffSeedOrder,
  nextPlayoffSize,
  GROUP_PLAYOFF_ADVANCE,
  type SwissStanding
} from "./bracket.utils";

type TournamentBracketMatchRecord = Awaited<ReturnType<BracketMatchProgressionService["findMatchesByTournament"]>>[number];

type TournamentStatusRecord = {
  id: string;
  status: TournamentStatus;
  startsAt: Date;
  title: string;
  clubId: string;
  disciplineId: string;
  organizerId: string;
  billiardKind: "PYRAMID" | "POOL" | "SNOOKER";
  category: "MEN" | "WOMEN" | "JUNIORS" | "GIRLS" | "AMATEURS" | "PROFESSIONALS" | "OPEN" | "TEAM" | "PERSONAL";
  tournamentLevel:
    | "OPEN_TOURNAMENT"
    | "CHAMPIONSHIP"
    | "CUP"
    | "LEAGUE"
    | "RATED_TOURNAMENT"
    | "FRIENDLY_TOURNAMENT"
    | "CLUB_TOURNAMENT";
  eventFormat: "INDIVIDUAL" | "TEAM" | "TEAM_2X2" | "TEAM_3X3";
  bracketSystem: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS" | "GROUP_PLAYOFF";
  participantSelectionMode: "APPLICATIONS" | "DIRECT" | "MANUAL_DRAW";
  tournamentType: "VISITOR" | "AMATEUR" | "PRO";
  minPlayerLevel: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
  maxPlayerLevel: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
  repeatEveryDays: number | null;
  repeatSpawnedAt: Date | null;
  prizePool: number;
  participants: number;
  bracketSize: number | null;
  bracketFormat: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  descriptionText: unknown;
  registrationLabelText: unknown;
  regulationFormat: unknown;
  regulationEntryFee: unknown;
  regulationParticipationTerms: unknown;
  regulationRestrictions: unknown;
  regulationNotes: unknown;
};

@Injectable()
export class BracketMatchProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveTournamentProgression(tournamentId: string) {
    const maxIterations = 256;
    let iteration = 0;
    let hasChanges = true;

    while (hasChanges && iteration < maxIterations) {
      iteration += 1;
      hasChanges = false;

      const matches = await this.findMatchesByTournament(tournamentId);
      const matchMap = new Map<string, TournamentBracketMatchRecord>(matches.map((match) => [match.id, match]));
      const sourceMap = new Map<string, TournamentBracketMatchRecord>();

      for (const match of matches) {
        if (match.nextMatchId && match.nextSlot) {
          sourceMap.set(`${match.nextMatchId}:${match.nextSlot}`, match);
        }
        // Loser routing feeds the 3rd-place match and (for double elimination) the lower bracket.
        if (match.loserNextMatchId && match.loserNextSlot) {
          sourceMap.set(`${match.loserNextMatchId}:${match.loserNextSlot}`, match);
        }
      }

      for (const match of matches) {
        if (match.status === BracketMatchStatuses.FINISHED && match.winnerId && match.nextMatchId && match.nextSlot) {
          const nextMatch = matchMap.get(match.nextMatchId);
          if (!nextMatch) {
            continue;
          }

          if (match.nextSlot === BracketNextSlots.PLAYER1 && nextMatch.player1Id !== match.winnerId) {
            await this.prisma.bracketMatch.update({
              where: { id: nextMatch.id },
              data: {
                player1Id: match.winnerId
              }
            });
            hasChanges = true;
            break;
          }

          if (match.nextSlot === BracketNextSlots.PLAYER2 && nextMatch.player2Id !== match.winnerId) {
            await this.prisma.bracketMatch.update({
              where: { id: nextMatch.id },
              data: {
                player2Id: match.winnerId
              }
            });
            hasChanges = true;
            break;
          }
        }
      }

      if (hasChanges) {
        continue;
      }

      // Route losers into their destination match (3rd-place match / lower bracket).
      for (const match of matches) {
        if (
          match.status === BracketMatchStatuses.FINISHED &&
          match.loserId &&
          match.loserNextMatchId &&
          match.loserNextSlot
        ) {
          const loserNextMatch = matchMap.get(match.loserNextMatchId);
          if (!loserNextMatch) {
            continue;
          }

          if (match.loserNextSlot === BracketNextSlots.PLAYER1 && loserNextMatch.player1Id !== match.loserId) {
            await this.prisma.bracketMatch.update({
              where: { id: loserNextMatch.id },
              data: { player1Id: match.loserId }
            });
            hasChanges = true;
            break;
          }

          if (match.loserNextSlot === BracketNextSlots.PLAYER2 && loserNextMatch.player2Id !== match.loserId) {
            await this.prisma.bracketMatch.update({
              where: { id: loserNextMatch.id },
              data: { player2Id: match.loserId }
            });
            hasChanges = true;
            break;
          }
        }
      }

      if (hasChanges) {
        continue;
      }

      // Grand-final reset (double elimination): when the lower-bracket player wins the
      // first final, stage the decisive second final between the same two players.
      const resetFinal = matches.find((candidate) => candidate.isFinalReset);
      if (resetFinal) {
        const primaryFinal = matches.find(
          (candidate) =>
            candidate.phase === BracketMatchPhases.FINAL && !candidate.isThirdPlace && !candidate.isFinalReset
        );
        if (
          primaryFinal &&
          primaryFinal.status === BracketMatchStatuses.FINISHED &&
          primaryFinal.winnerId &&
          primaryFinal.loserId &&
          primaryFinal.winnerId === primaryFinal.player2Id && // lower-bracket player won the first final
          (resetFinal.player1Id !== primaryFinal.winnerId || resetFinal.player2Id !== primaryFinal.loserId)
        ) {
          await this.prisma.bracketMatch.update({
            where: { id: resetFinal.id },
            data: {
              player1Id: primaryFinal.winnerId,
              player2Id: primaryFinal.loserId,
              status: BracketMatchStatuses.READY,
              winnerId: null,
              loserId: null,
              isBye: false
            }
          });
          hasChanges = true;
        }
      }

      if (hasChanges) {
        continue;
      }

      for (const match of matches) {
        if (match.status === BracketMatchStatuses.FINISHED) {
          continue;
        }

        const sourceForPlayer1 = sourceMap.get(`${match.id}:${BracketNextSlots.PLAYER1}`) ?? null;
        const sourceForPlayer2 = sourceMap.get(`${match.id}:${BracketNextSlots.PLAYER2}`) ?? null;

        const player1Resolved =
          Boolean(match.player1Id) || sourceForPlayer1 === null || sourceForPlayer1.status === BracketMatchStatuses.FINISHED;
        const player2Resolved =
          Boolean(match.player2Id) || sourceForPlayer2 === null || sourceForPlayer2.status === BracketMatchStatuses.FINISHED;

        if (match.player1Id && match.player2Id) {
          if (match.status === BracketMatchStatuses.PENDING) {
            await this.prisma.bracketMatch.update({
              where: { id: match.id },
              data: {
                status: BracketMatchStatuses.READY,
                isBye: false,
                winnerId: null,
                loserId: null
              }
            });
            hasChanges = true;
            break;
          }

          continue;
        }

        if (match.player1Id && player2Resolved) {
          await this.prisma.bracketMatch.update({
            where: { id: match.id },
            data: {
              winnerId: match.player1Id,
              loserId: null,
              status: BracketMatchStatuses.FINISHED,
              isBye: true
            }
          });
          hasChanges = true;
          break;
        }

        if (match.player2Id && player1Resolved) {
          await this.prisma.bracketMatch.update({
            where: { id: match.id },
            data: {
              winnerId: match.player2Id,
              loserId: null,
              status: BracketMatchStatuses.FINISHED,
              isBye: true
            }
          });
          hasChanges = true;
          break;
        }

        if (!match.player1Id && !match.player2Id && player1Resolved && player2Resolved) {
          await this.prisma.bracketMatch.update({
            where: { id: match.id },
            data: {
              winnerId: null,
              loserId: null,
              status: BracketMatchStatuses.FINISHED,
              isBye: true
            }
          });
          hasChanges = true;
          break;
        }
      }
    }

    if (iteration >= maxIterations) {
      throw new BracketHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Bracket progression exceeded safe iteration limit."
      );
    }

    await this.refreshTournamentStatus(tournamentId);
  }

  async refreshTournamentStatus(tournamentId: string) {
    const matches = await this.findMatchesByTournament(tournamentId);
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        status: true,
        startsAt: true,
        title: true,
        clubId: true,
        disciplineId: true,
        organizerId: true,
        billiardKind: true,
        category: true,
        tournamentLevel: true,
        eventFormat: true,
        bracketSystem: true,
        participantSelectionMode: true,
        tournamentType: true,
        minPlayerLevel: true,
        maxPlayerLevel: true,
        repeatEveryDays: true,
        repeatSpawnedAt: true,
        prizePool: true,
        participants: true,
        bracketSize: true,
        bracketFormat: true,
        descriptionText: true,
        registrationLabelText: true,
        regulationFormat: true,
        regulationEntryFee: true,
        regulationParticipationTerms: true,
        regulationRestrictions: true,
        regulationNotes: true
      }
    });

    if (!tournament) {
      return;
    }

    if (matches.length === 0) {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: tournament.status === TournamentStatus.DRAFT ? TournamentStatus.DRAFT : TournamentStatus.REGISTRATION
        }
      });
      return;
    }

    // Non-knockout systems (round robin / swiss / group) finish when every match is played;
    // placement comes from the standings table rather than a single final. Anything that is
    // not an explicit non-knockout system (including unset) is treated as a knockout bracket.
    const nonKnockoutSystems = ["ROUND_ROBIN", "SWISS", "GROUP_PLAYOFF"];
    if (nonKnockoutSystems.includes(tournament.bracketSystem)) {
      await this.refreshNonKnockoutStatus(
        tournamentId,
        tournament.bracketSystem,
        tournament.status,
        tournament.startsAt,
        matches
      );
      return;
    }

    // Determine the decisive championship final.
    // - Single elimination: the highest-round non-third-place match (round-based, phase-agnostic).
    // - Double elimination: the grand final, unless the lower-bracket player won it — then the
    //   decisive match is the grand-final reset (second final).
    const resetFinal = matches.find((match) => match.isFinalReset) ?? null;
    const nonResetMatches = matches.filter((match) => !match.isFinalReset);
    const primaryFinalRound = Math.max(...nonResetMatches.map((match) => match.round));
    const primaryFinal =
      nonResetMatches.find((match) => match.round === primaryFinalRound && !match.isThirdPlace) ??
      nonResetMatches.find((match) => match.round === primaryFinalRound) ??
      null;

    let finalMatch: TournamentBracketMatchRecord | null = null;
    if (
      resetFinal &&
      resetFinal.status === BracketMatchStatuses.FINISHED &&
      resetFinal.winnerId &&
      resetFinal.player1Id &&
      resetFinal.player2Id
    ) {
      // The reset was triggered and played out — it decides the title.
      finalMatch = resetFinal;
    } else if (primaryFinal && primaryFinal.status === BracketMatchStatuses.FINISHED && primaryFinal.winnerId) {
      // The primary final decides the title unless a reset is pending (lower-bracket player
      // won the first final but the second final has not been played yet).
      const resetPending = Boolean(resetFinal) && primaryFinal.winnerId === primaryFinal.player2Id;
      if (!resetPending) {
        finalMatch = primaryFinal;
      }
    }

    if (finalMatch?.status === BracketMatchStatuses.FINISHED && finalMatch.winnerId) {
      const wasFinished = tournament.status === TournamentStatus.FINISHED;

      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.FINISHED }
      });

      if (!wasFinished) {
        await this.finalizeCompletedTournament(tournament as TournamentStatusRecord, finalMatch);
      }

      return;
    }

    const now = Date.now();
    const hasLiveMatch = matches.some((match) => match.status === BracketMatchStatuses.LIVE);
    const hasPlayedNonByeMatch = matches.some(
      (match) => match.status === BracketMatchStatuses.FINISHED && !match.isBye && Boolean(match.winnerId)
    );
    const hasStartedBySchedule = matches.some(
      (match) =>
        Boolean(match.scheduledAt) &&
        match.scheduledAt!.getTime() <= now &&
        match.status !== BracketMatchStatuses.FINISHED
    );

    if (!hasLiveMatch && !hasPlayedNonByeMatch && !hasStartedBySchedule && (tournament.startsAt.getTime() ?? 0) > now) {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: tournament.status === TournamentStatus.DRAFT ? TournamentStatus.DRAFT : TournamentStatus.REGISTRATION
        }
      });
      return;
    }

    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.LIVE }
    });
  }

  private async refreshNonKnockoutStatus(
    tournamentId: string,
    system: string,
    currentStatus: TournamentStatus,
    startsAt: Date,
    matches: TournamentBracketMatchRecord[]
  ) {
    if (system === "SWISS") {
      await this.refreshSwissStatus(tournamentId, currentStatus, startsAt, matches);
      return;
    }

    if (system === "GROUP_PLAYOFF") {
      await this.refreshGroupPlayoffStatus(tournamentId, currentStatus, startsAt, matches);
      return;
    }

    const allFinished = matches.every((match) => match.status === BracketMatchStatuses.FINISHED);
    if (allFinished) {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.FINISHED }
      });
      return;
    }

    const now = Date.now();
    const hasLiveMatch = matches.some((match) => match.status === BracketMatchStatuses.LIVE);
    const hasPlayedNonByeMatch = matches.some(
      (match) => match.status === BracketMatchStatuses.FINISHED && !match.isBye && Boolean(match.winnerId)
    );
    const hasStartedBySchedule = matches.some(
      (match) =>
        Boolean(match.scheduledAt) &&
        match.scheduledAt!.getTime() <= now &&
        match.status !== BracketMatchStatuses.FINISHED
    );

    if (!hasLiveMatch && !hasPlayedNonByeMatch && !hasStartedBySchedule && startsAt.getTime() > now) {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: currentStatus === TournamentStatus.DRAFT ? TournamentStatus.DRAFT : TournamentStatus.REGISTRATION
        }
      });
      return;
    }

    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.LIVE }
    });
  }

  private async refreshSwissStatus(
    tournamentId: string,
    currentStatus: TournamentStatus,
    startsAt: Date,
    matches: TournamentBracketMatchRecord[]
  ) {
    const participantCount = await this.prisma.bracketParticipant.count({ where: { tournamentId } });
    const target = swissRoundTarget(participantCount);
    const currentRound = Math.max(...matches.map((match) => match.round));
    const currentRoundDone = matches
      .filter((match) => match.round === currentRound)
      .every((match) => match.status === BracketMatchStatuses.FINISHED);

    if (!currentRoundDone) {
      const now = Date.now();
      const started =
        matches.some((match) => match.status === BracketMatchStatuses.LIVE) ||
        matches.some((match) => match.status === BracketMatchStatuses.FINISHED && !match.isBye && Boolean(match.winnerId)) ||
        startsAt.getTime() <= now;
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: started
            ? TournamentStatus.LIVE
            : currentStatus === TournamentStatus.DRAFT
              ? TournamentStatus.DRAFT
              : TournamentStatus.REGISTRATION
        }
      });
      return;
    }

    if (currentRound >= target) {
      await this.prisma.tournament.update({ where: { id: tournamentId }, data: { status: TournamentStatus.FINISHED } });
      return;
    }

    await this.generateSwissNextRound(tournamentId, currentRound + 1, startsAt);
    await this.prisma.tournament.update({ where: { id: tournamentId }, data: { status: TournamentStatus.LIVE } });
  }

  private async generateSwissNextRound(tournamentId: string, round: number, startsAt: Date) {
    const participants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      select: { id: true, seed: true }
    });
    const finished = await this.prisma.bracketMatch.findMany({
      where: { tournamentId, status: BracketMatchStatuses.FINISHED },
      select: { player1Id: true, player2Id: true, winnerId: true, isBye: true }
    });

    const score = new Map<string, number>(participants.map((participant) => [participant.id, 0]));
    const playedPairs = new Set<string>();
    const hadBye = new Set<string>();

    for (const match of finished) {
      if (match.isBye && match.winnerId) {
        score.set(match.winnerId, (score.get(match.winnerId) ?? 0) + 1);
        if (match.player1Id) {
          hadBye.add(match.player1Id);
        }
        continue;
      }
      if (match.player1Id && match.player2Id) {
        playedPairs.add(swissPairKey(match.player1Id, match.player2Id));
        if (match.winnerId) {
          score.set(match.winnerId, (score.get(match.winnerId) ?? 0) + 1);
        }
      }
    }

    const standings: SwissStanding[] = participants.map((participant) => ({
      participantId: participant.id,
      seed: participant.seed,
      score: score.get(participant.id) ?? 0
    }));
    const pairings = pairSwissRound(standings, playedPairs, hadBye);

    const aggregate = await this.prisma.bracketMatch.aggregate({
      where: { tournamentId },
      _max: { matchNumber: true }
    });
    const tournamentClub = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { club: { select: { tables: true } } }
    });

    const blueprints = buildSwissRoundBlueprints(tournamentId, round, pairings, {
      startsAt,
      tableCount: Math.max(tournamentClub?.club?.tables ?? 4, 1),
      startMatchNumber: (aggregate._max.matchNumber ?? 0) + 1
    });

    await this.prisma.bracketMatch.createMany({ data: blueprints });
  }

  private async refreshGroupPlayoffStatus(
    tournamentId: string,
    currentStatus: TournamentStatus,
    startsAt: Date,
    matches: TournamentBracketMatchRecord[]
  ) {
    const playoffMatches = matches.filter((match) => match.groupIndex === null);
    const groupMatches = matches.filter((match) => match.groupIndex !== null);

    if (playoffMatches.length === 0) {
      const groupsDone = groupMatches.length > 0 && groupMatches.every((m) => m.status === BracketMatchStatuses.FINISHED);
      if (groupsDone) {
        await this.generateGroupPlayoff(tournamentId, startsAt);
        // Settle any first-round playoff byes and refresh status for the new stage.
        await this.resolveTournamentProgression(tournamentId);
        return;
      }
      await this.setRunningStatus(tournamentId, currentStatus, startsAt, matches);
      return;
    }

    const playoffFinalRound = Math.max(...playoffMatches.map((match) => match.round));
    const finalMatch =
      playoffMatches.find((match) => match.round === playoffFinalRound && !match.isThirdPlace) ??
      playoffMatches.find((match) => match.round === playoffFinalRound);

    if (finalMatch?.status === BracketMatchStatuses.FINISHED && finalMatch.winnerId) {
      await this.prisma.tournament.update({ where: { id: tournamentId }, data: { status: TournamentStatus.FINISHED } });
      return;
    }

    await this.prisma.tournament.update({ where: { id: tournamentId }, data: { status: TournamentStatus.LIVE } });
  }

  private async setRunningStatus(
    tournamentId: string,
    currentStatus: TournamentStatus,
    startsAt: Date,
    matches: TournamentBracketMatchRecord[]
  ) {
    const now = Date.now();
    const started =
      matches.some((match) => match.status === BracketMatchStatuses.LIVE) ||
      matches.some((match) => match.status === BracketMatchStatuses.FINISHED && !match.isBye && Boolean(match.winnerId)) ||
      startsAt.getTime() <= now;
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: started
          ? TournamentStatus.LIVE
          : currentStatus === TournamentStatus.DRAFT
            ? TournamentStatus.DRAFT
            : TournamentStatus.REGISTRATION
      }
    });
  }

  private async generateGroupPlayoff(tournamentId: string, startsAt: Date) {
    const groupMatches = await this.prisma.bracketMatch.findMany({
      where: { tournamentId, groupIndex: { not: null } },
      select: {
        groupIndex: true,
        player1Id: true,
        player2Id: true,
        winnerId: true,
        isBye: true,
        player1Score: true,
        player2Score: true
      }
    });
    const participants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      select: { id: true, seed: true }
    });
    const seedById = new Map(participants.map((participant) => [participant.id, participant.seed]));

    interface GroupRow {
      wins: number;
      diff: number;
    }
    const groupTables = new Map<number, Map<string, GroupRow>>();
    const ensureRow = (groupIndex: number, participantId: string) => {
      const table = groupTables.get(groupIndex) ?? new Map<string, GroupRow>();
      groupTables.set(groupIndex, table);
      if (!table.has(participantId)) {
        table.set(participantId, { wins: 0, diff: 0 });
      }
      return table.get(participantId)!;
    };

    for (const match of groupMatches) {
      if (match.groupIndex === null || !match.player1Id || !match.player2Id) {
        continue;
      }
      const home = ensureRow(match.groupIndex, match.player1Id);
      const away = ensureRow(match.groupIndex, match.player2Id);
      const homeScore = match.player1Score ?? 0;
      const awayScore = match.player2Score ?? 0;
      home.diff += homeScore - awayScore;
      away.diff += awayScore - homeScore;
      if (match.winnerId === match.player1Id) {
        home.wins += 1;
      } else if (match.winnerId === match.player2Id) {
        away.wins += 1;
      }
    }

    const groupRankings: string[][] = [];
    for (const groupIndex of [...groupTables.keys()].sort((a, b) => a - b)) {
      const ranked = [...groupTables.get(groupIndex)!.entries()].sort(
        ([aId, a], [bId, b]) =>
          b.wins - a.wins || b.diff - a.diff || (seedById.get(aId) ?? 9999) - (seedById.get(bId) ?? 9999)
      );
      groupRankings.push(ranked.slice(0, GROUP_PLAYOFF_ADVANCE).map(([id]) => id));
    }

    const seedOrder = selectPlayoffSeedOrder(groupRankings, GROUP_PLAYOFF_ADVANCE);
    if (seedOrder.length < 2) {
      return;
    }
    const playoffSize = nextPlayoffSize(seedOrder.length);
    const participantIdsBySeed = new Map(seedOrder.map((id, index) => [index + 1, id]));

    const tournamentClub = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { club: { select: { tables: true } } }
    });
    const aggregate = await this.prisma.bracketMatch.aggregate({
      where: { tournamentId },
      _max: { matchNumber: true }
    });
    const offset = aggregate._max.matchNumber ?? 0;

    const blueprints = buildMatchBlueprints(tournamentId, playoffSize, participantIdsBySeed, {
      startsAt,
      tableCount: Math.max(tournamentClub?.club?.tables ?? 4, 1)
    }).map((blueprint) => ({ ...blueprint, matchNumber: blueprint.matchNumber + offset }));

    await this.prisma.bracketMatch.createMany({ data: blueprints });
  }

  private async finalizeCompletedTournament(
    tournament: TournamentStatusRecord,
    finalMatch: TournamentBracketMatchRecord
  ) {
    await this.applyFinalBonuses(tournament.disciplineId, finalMatch);
    await this.spawnRepeatTournament(tournament);
  }

  private async applyFinalBonuses(disciplineId: string, finalMatch: TournamentBracketMatchRecord) {
    const prismaWithPlayer = this.prisma as unknown as {
      player?: {
        findUnique: (...args: unknown[]) => Promise<unknown>;
      };
    };

    if (!prismaWithPlayer.player?.findUnique) {
      return;
    }

    const finalistAId = finalMatch.player1?.playerId ?? finalMatch.player1Id ?? null;
    const finalistBId = finalMatch.player2?.playerId ?? finalMatch.player2Id ?? null;
    const finalists = [finalistAId, finalistBId].filter(
      (value): value is string => Boolean(value)
    );
    const championId =
      finalMatch.winner?.playerId ??
      (finalMatch.winnerId && finalMatch.winnerId === finalMatch.player1Id
        ? finalistAId
        : finalMatch.winnerId && finalMatch.winnerId === finalMatch.player2Id
          ? finalistBId
          : null);

    if (finalists.length === 0 || !championId) {
      return;
    }

    const bonuses = new Map<string, { points: number; tournamentWins: number }>();

    for (const playerId of finalists) {
      const current = bonuses.get(playerId) ?? { points: 0, tournamentWins: 0 };
      current.points += 5;
      bonuses.set(playerId, current);
    }

    const championBonus = bonuses.get(championId) ?? { points: 0, tournamentWins: 0 };
    championBonus.points += 10;
    championBonus.tournamentWins += 1;
    bonuses.set(championId, championBonus);

    await this.prisma.$transaction(async (tx) => {
      for (const [playerId, bonus] of bonuses.entries()) {
        const player = await tx.player.findUnique({
          where: { id: playerId },
          select: { id: true, levelPoints: true, cityId: true }
        });

        if (!player) {
          continue;
        }

        const nextPoints = player.levelPoints + bonus.points;

        await tx.player.update({
          where: { id: playerId },
          data: {
            levelPoints: nextPoints,
            level: playerLevelFromPoints(nextPoints),
            tournamentWins: { increment: bonus.tournamentWins }
          }
        });
        await this.upsertRanking(tx, playerId, disciplineId, player.cityId, nextPoints);
      }
    });
  }

  private async upsertRanking(
    tx: Prisma.TransactionClient,
    playerId: string,
    disciplineId: string,
    cityId: string,
    points: number
  ) {
    if (!("ranking" in tx) || !tx.ranking?.upsert) {
      return;
    }

    await tx.ranking.upsert({
      where: {
        playerId_disciplineId_cityId: {
          playerId,
          disciplineId,
          cityId
        }
      },
      update: { points },
      create: {
        playerId,
        disciplineId,
        cityId,
        points,
        position: 0
      }
    });
  }

  private async spawnRepeatTournament(tournament: TournamentStatusRecord) {
    if (!this.isRepeatInterval(tournament.repeatEveryDays) || tournament.repeatSpawnedAt) {
      return;
    }
    const repeatEveryDays = tournament.repeatEveryDays;

    const prismaWithCreate = this.prisma as unknown as {
      tournament?: {
        create: (...args: unknown[]) => Promise<unknown>;
      };
    };

    if (!prismaWithCreate.tournament?.create) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.tournament.findUnique({
        where: { id: tournament.id },
        select: { repeatSpawnedAt: true }
      });

      if (!fresh || fresh.repeatSpawnedAt) {
        return;
      }

      const nextStartsAt = new Date(tournament.startsAt.getTime() + repeatEveryDays * 24 * 60 * 60 * 1000);

      await tx.tournament.create({
        data: {
          title: tournament.title,
          clubId: tournament.clubId,
          disciplineId: tournament.disciplineId,
          organizerId: tournament.organizerId,
          billiardKind: tournament.billiardKind,
          category: tournament.category,
          tournamentLevel: tournament.tournamentLevel,
          eventFormat: tournament.eventFormat,
          bracketSystem: tournament.bracketSystem,
          participantSelectionMode: tournament.participantSelectionMode,
          tournamentType: tournament.tournamentType,
          minPlayerLevel: tournament.minPlayerLevel,
          maxPlayerLevel: tournament.maxPlayerLevel,
          repeatEveryDays,
          startsAt: nextStartsAt,
          prizePool: tournament.prizePool,
          status: TournamentStatus.REGISTRATION,
          participants: 0,
          bracketSize: tournament.bracketSize,
          bracketFormat: tournament.bracketFormat,
          descriptionText: tournament.descriptionText as never,
          registrationLabelText: tournament.registrationLabelText as never,
          regulationFormat: tournament.regulationFormat as never,
          regulationEntryFee: tournament.regulationEntryFee as never,
          regulationParticipationTerms: tournament.regulationParticipationTerms as never,
          regulationRestrictions: tournament.regulationRestrictions as never,
          regulationNotes: tournament.regulationNotes as never
        }
      });

      await tx.tournament.update({
        where: { id: tournament.id },
        data: { repeatSpawnedAt: new Date() }
      });
    });
  }

  private isRepeatInterval(value: number | null): value is 2 | 3 | 7 {
    return value === 2 || value === 3 || value === 7;
  }

  private findMatchesByTournament(tournamentId: string) {
    return this.prisma.bracketMatch.findMany({
      where: { tournamentId },
      include: {
        player1: true,
        player2: true,
        winner: true,
        loser: true,
        nextMatch: {
          select: {
            id: true,
            round: true,
            matchNumber: true
          }
        }
      },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
    });
  }
}
