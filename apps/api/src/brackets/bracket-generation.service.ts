import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { BracketHttpException } from "./bracket.exception";
import { BracketFormats } from "./bracket.types";
import {
  assertSupportedBracketSize,
  assertTournamentMutable,
  buildDoubleEliminationBlueprints,
  buildMatchBlueprints,
  buildRoundRobinBlueprints,
  buildSwissRoundBlueprints,
  swissRoundOnePairings,
  SWISS_MAX,
  SWISS_MIN,
  assignGroups,
  buildGroupStageBlueprints,
  GROUP_PLAYOFF_MAX,
  GROUP_PLAYOFF_MIN
} from "./bracket.utils";
import { BracketMatchProgressionService } from "./match-progression.service";

@Injectable()
export class BracketGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: BracketMatchProgressionService
  ) {}

  async generate(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        status: true,
        bracketSize: true,
        bracketFormat: true,
        bracketSystem: true,
        startsAt: true,
        club: {
          select: {
            tables: true
          }
        }
      }
    });

    if (!tournament) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Tournament not found.");
    }

    assertTournamentMutable(tournament.status);
    const bracketFormat = tournament.bracketFormat ?? BracketFormats.SINGLE_ELIMINATION;
    const bracketSystem = tournament.bracketSystem;

    const existingMatches = await this.prisma.bracketMatch.count({
      where: { tournamentId }
    });
    if (existingMatches > 0) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Bracket already generated for this tournament.");
    }

    const participants = await this.prisma.bracketParticipant.findMany({
      where: { tournamentId },
      orderBy: { seed: "asc" }
    });
    if (participants.length < 2) {
      throw new BracketHttpException(
        HttpStatus.BAD_REQUEST,
        "At least two participants are required to generate a bracket."
      );
    }

    const duplicateSeed = findDuplicateSeed(participants.map((participant) => participant.seed));
    if (duplicateSeed !== null) {
      throw new BracketHttpException(HttpStatus.CONFLICT, `Duplicate participant seed detected: ${duplicateSeed}.`);
    }

    const blueprintOptions = {
      startsAt: tournament.startsAt,
      tableCount: Math.max(tournament.club?.tables ?? 1, 1)
    };

    let matchBlueprints;
    if (bracketSystem === "ROUND_ROBIN") {
      // Round robin: every participant meets every other; no power-of-two bracket size needed.
      matchBlueprints = buildRoundRobinBlueprints(
        tournamentId,
        participants.map((participant) => participant.id),
        blueprintOptions
      );
    } else if (bracketSystem === "SWISS") {
      // Swiss: only the first round is generated now; later rounds are paired as each round finishes.
      const ids = participants.map((participant) => participant.id);
      if (ids.length < SWISS_MIN) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, `Swiss needs at least ${SWISS_MIN} participants.`);
      }
      if (ids.length > SWISS_MAX) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, `Swiss supports up to ${SWISS_MAX} participants.`);
      }
      matchBlueprints = buildSwissRoundBlueprints(tournamentId, 1, swissRoundOnePairings(ids), {
        ...blueprintOptions,
        startMatchNumber: 1
      });
    } else if (bracketSystem === "GROUP_PLAYOFF") {
      // Group stage now (round robin per group); the knockout playoff is generated once groups finish.
      const ids = participants.map((participant) => participant.id);
      if (ids.length < GROUP_PLAYOFF_MIN) {
        throw new BracketHttpException(
          HttpStatus.BAD_REQUEST,
          `Group + playoff needs at least ${GROUP_PLAYOFF_MIN} participants.`
        );
      }
      if (ids.length > GROUP_PLAYOFF_MAX) {
        throw new BracketHttpException(
          HttpStatus.BAD_REQUEST,
          `Group + playoff supports up to ${GROUP_PLAYOFF_MAX} participants.`
        );
      }
      const groups = assignGroups(ids);
      if (groups.length < 2) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Group + playoff requires at least two groups.");
      }
      matchBlueprints = buildGroupStageBlueprints(tournamentId, groups, blueprintOptions);
    } else {
      assertSupportedBracketSize(tournament.bracketSize);
      if (participants.length > tournament.bracketSize!) {
        throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Participant count exceeds tournament bracket size.");
      }
      const participantIdsBySeed = new Map(participants.map((participant) => [participant.seed, participant.id]));
      matchBlueprints =
        bracketFormat === BracketFormats.DOUBLE_ELIMINATION
          ? buildDoubleEliminationBlueprints(tournamentId, tournament.bracketSize!, participantIdsBySeed, blueprintOptions)
          : buildMatchBlueprints(tournamentId, tournament.bracketSize!, participantIdsBySeed, blueprintOptions);
    }

    await this.prisma.bracketMatch.createMany({
      data: matchBlueprints
    });
    await this.progressionService.resolveTournamentProgression(tournamentId);

    return {
      tournamentId,
      matchesCreated: matchBlueprints.length,
      bracketSize: tournament.bracketSize,
      participantCount: participants.length
    };
  }
}

function findDuplicateSeed(seeds: number[]) {
  const seen = new Set<number>();

  for (const seed of seeds) {
    if (seen.has(seed)) {
      return seed;
    }

    seen.add(seed);
  }

  return null;
}
