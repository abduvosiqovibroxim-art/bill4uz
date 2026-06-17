import * as assert from "node:assert/strict";
import { TournamentStatus } from "@prisma/client";
import { BracketGenerationService } from "../src/brackets/bracket-generation.service";
import { BracketMatchesService } from "../src/brackets/bracket-matches.service";
import { BracketMatchProgressionService } from "../src/brackets/match-progression.service";
import { BracketFormats, BracketMatchBlueprint, BracketMatchStatuses } from "../src/brackets/bracket.types";
import {
  buildDoubleEliminationBlueprints,
  buildMatchBlueprints,
  buildRoundRobinBlueprints
} from "../src/brackets/bracket.utils";

type MatchRecord = BracketMatchBlueprint & {
  player1: { id: string } | null;
  player2: { id: string } | null;
  winner: { id: string } | null;
  loser: { id: string } | null;
  nextMatch: { id: string; round: number; matchNumber: number } | null;
};

class InMemoryPrismaService {
  public tournamentState: {
    id: string;
    status: TournamentStatus;
    bracketSize: number;
    bracketFormat: string;
    bracketSystem?: string;
    startsAt: Date;
    club: { tables: number };
  } | null = null;

  public bracketParticipants: Array<{
    id: string;
    tournamentId: string;
    name: string;
    seed: number;
  }> = [];

  public bracketMatches: BracketMatchBlueprint[] = [];

  public players = new Map<string, {
    id: string;
    levelPoints: number;
    level: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
    wins: number;
    losses: number;
    tournamentWins: number;
  }>();

  async $transaction<T>(input: ((tx: InMemoryPrismaService) => Promise<T>) | Promise<T>[]) {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    return input(this);
  }

  tournament = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (!this.tournamentState || this.tournamentState.id !== where.id) {
        return null;
      }

      return this.tournamentState;
    },
    update: async ({ where, data }: { where: { id: string }; data: { status?: TournamentStatus } }) => {
      if (this.tournamentState && this.tournamentState.id === where.id && data.status) {
        this.tournamentState.status = data.status;
      }
      return this.tournamentState;
    }
  };

  bracketParticipant = {
    findMany: async ({ where }: { where: { tournamentId: string } }) =>
      this.bracketParticipants
        .filter((participant) => participant.tournamentId === where.tournamentId)
        .sort((left, right) => left.seed - right.seed)
  };

  bracketMatch = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const match = this.bracketMatches.find((candidate) => candidate.id === where.id);
      if (!match) {
        return null;
      }

      const nextMatch = match.nextMatchId
        ? this.bracketMatches.find((candidate) => candidate.id === match.nextMatchId) ?? null
        : null;

      return {
        ...match,
        player1: match.player1Id
          ? { id: match.player1Id, playerId: match.player1Id, player: { id: match.player1Id, fullName: match.player1Id } }
          : null,
        player2: match.player2Id
          ? { id: match.player2Id, playerId: match.player2Id, player: { id: match.player2Id, fullName: match.player2Id } }
          : null,
        winner: match.winnerId ? { id: match.winnerId } : null,
        loser: match.loserId ? { id: match.loserId } : null,
        nextMatch: nextMatch
          ? {
              id: nextMatch.id,
              round: nextMatch.round,
              matchNumber: nextMatch.matchNumber,
              phase: nextMatch.phase
            }
          : null,
        previousMatches: [],
        tournament: {
          id: match.tournamentId,
          organizerId: "organizer-1",
          status: this.tournamentState?.status ?? TournamentStatus.REGISTRATION
        }
      };
    },
    findMany: async ({ where }: { where: { tournamentId: string } }) =>
      this.bracketMatches
        .filter((match) => match.tournamentId === where.tournamentId)
        .sort((left, right) => left.round - right.round || left.matchNumber - right.matchNumber)
        .map((match) => {
          const nextMatch = match.nextMatchId
            ? this.bracketMatches.find((candidate) => candidate.id === match.nextMatchId) ?? null
            : null;

          return {
            ...match,
            player1: match.player1Id ? { id: match.player1Id } : null,
            player2: match.player2Id ? { id: match.player2Id } : null,
            winner: match.winnerId ? { id: match.winnerId } : null,
            loser: match.loserId ? { id: match.loserId } : null,
            nextMatch: nextMatch
              ? {
                  id: nextMatch.id,
                  round: nextMatch.round,
                  matchNumber: nextMatch.matchNumber
                }
              : null
          };
        }),
    update: async ({ where, data }: { where: { id: string }; data: Partial<BracketMatchBlueprint> }) => {
      const index = this.bracketMatches.findIndex((match) => match.id === where.id);
      this.bracketMatches[index] = {
        ...this.bracketMatches[index],
        ...data
      };
      return this.bracketMatches[index];
    },
    count: async ({ where }: { where: { tournamentId: string } }) =>
      this.bracketMatches.filter((match) => match.tournamentId === where.tournamentId).length,
    createMany: async ({ data }: { data: BracketMatchBlueprint[] }) => {
      this.bracketMatches.push(...data);
      return { count: data.length };
    }
  };

  player = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const player = this.players.get(where.id);
      return player
        ? {
            ...player
          }
        : null;
    },
    update: async ({
      where,
      data
    }: {
      where: { id: string };
      data: {
        levelPoints?: number;
        level?: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
        wins?: { increment: number };
        losses?: { increment: number };
        tournamentWins?: { increment: number };
      };
    }) => {
      const player = this.players.get(where.id);
      if (!player) {
        throw new Error(`Player ${where.id} not found`);
      }

      if (typeof data.levelPoints === "number") {
        player.levelPoints = data.levelPoints;
      }

      if (data.level) {
        player.level = data.level;
      }

      if (data.wins) {
        player.wins += data.wins.increment;
      }

      if (data.losses) {
        player.losses += data.losses.increment;
      }

      if (data.tournamentWins) {
        player.tournamentWins += data.tournamentWins.increment;
      }

      this.players.set(where.id, player);
      return { ...player };
    },
    updateMany: async ({
      where,
      data
    }: {
      where: { id: string };
      data: { losses?: { increment: number } };
    }) => {
      const player = this.players.get(where.id);
      if (!player) {
        return { count: 0 };
      }

      if (data.losses) {
        player.losses += data.losses.increment;
      }

      this.players.set(where.id, player);
      return { count: 1 };
    }
  };
}

class StubProgressionService {
  public calls: string[] = [];

  async resolveTournamentProgression(tournamentId: string) {
    this.calls.push(tournamentId);
  }
}

class StubNotificationsService {
  async notifyMatchResult() {}
  async notifyTournamentCompletion() {}
}

class StubAuditService {
  async log() {}
}

function createSeeds(count: number) {
  return new Map<number, string>(
    Array.from({ length: count }, (_, index) => [index + 1, `player-${index + 1}`])
  );
}

async function testTenPlayersInSixteenBracket() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-10-16",
    status: TournamentStatus.REGISTRATION,
    bracketSize: 16,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 4 }
  };
  prisma.bracketMatches = buildMatchBlueprints("t-10-16", 16, createSeeds(10), {
    startsAt: prisma.tournamentState.startsAt,
    tableCount: prisma.tournamentState.club.tables
  });

  const progressionService = new BracketMatchProgressionService(prisma as never);
  await progressionService.resolveTournamentProgression("t-10-16");

  const resolvedMatches = (await prisma.bracketMatch.findMany({
    where: { tournamentId: "t-10-16" }
  })) as MatchRecord[];
  const firstRound = resolvedMatches.filter((match) => match.round === 1);
  const byeMatches = firstRound.filter(
    (match) => match.status === "FINISHED" && Boolean(match.winnerId) && (!match.player1Id || !match.player2Id)
  );
  const invalidOpenMatch = resolvedMatches.find(
    (match) => (match.status === "READY" || match.status === "LIVE") && (!match.player1Id || !match.player2Id)
  );
  const roundTwoMatch = resolvedMatches.find((match) => match.matchNumber === 10);

  assert.equal(firstRound.length, 8);
  assert.equal(
    firstRound.reduce((count, match) => count + Number(match.player1Id === null) + Number(match.player2Id === null), 0),
    6
  );
  assert.equal(byeMatches.length, 6);
  assert.equal(invalidOpenMatch, undefined);
  assert.equal(roundTwoMatch?.player1Id, "player-4");
  assert.equal(roundTwoMatch?.player2Id, "player-5");
  assert.equal(roundTwoMatch?.status, "READY");
  assert.equal(byeMatches.every((match) => match.isBye), true);
  assert.equal(firstRound.every((match) => match.bestOf === 3), true);
  assert.equal(prisma.tournamentState.status, TournamentStatus.LIVE);
}

async function testTwoPlayersInSixteenBracket() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-2-16",
    status: TournamentStatus.REGISTRATION,
    bracketSize: 16,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 2 }
  };
  prisma.bracketMatches = buildMatchBlueprints("t-2-16", 16, createSeeds(2), {
    startsAt: prisma.tournamentState.startsAt,
    tableCount: prisma.tournamentState.club.tables
  });

  const progressionService = new BracketMatchProgressionService(prisma as never);
  await progressionService.resolveTournamentProgression("t-2-16");

  const resolvedMatches = (await prisma.bracketMatch.findMany({
    where: { tournamentId: "t-2-16" }
  })) as MatchRecord[];
  const finalRound = Math.max(...resolvedMatches.map((match) => match.round));
  const finalMatch = resolvedMatches.find((match) => match.round === finalRound && !match.isThirdPlace);
  const pendingMatches = resolvedMatches.filter((match) => match.status === "PENDING");

  assert.equal(pendingMatches.length, 0);
  assert.equal(finalMatch?.status, "READY");
  assert.equal(finalMatch?.player1Id, "player-1");
  assert.equal(finalMatch?.player2Id, "player-2");
  assert.equal(finalMatch?.bestOf, 7);
  assert.equal(prisma.tournamentState.status, TournamentStatus.LIVE);
}

async function testOneParticipantValidation() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-1-16",
    status: TournamentStatus.REGISTRATION,
    bracketSize: 16,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 2 }
  };
  prisma.bracketParticipants = [
    {
      id: "player-1",
      tournamentId: "t-1-16",
      name: "Player 1",
      seed: 1
    }
  ];

  const progressionService = new StubProgressionService();
  const service = new BracketGenerationService(prisma as never, progressionService as never);

  await assert.rejects(
    service.generate("t-1-16"),
    /At least two participants are required to generate a bracket\./
  );
  assert.equal(progressionService.calls.length, 0);
}

async function testSixtyFourBracketBlueprint() {
  const matches = buildMatchBlueprints("t-64", 64, createSeeds(64), {
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    tableCount: 8
  });

  const rounds = matches.reduce<Record<number, number>>((accumulator, match) => {
    accumulator[match.round] = (accumulator[match.round] ?? 0) + 1;
    return accumulator;
  }, {});
  const firstRound = matches.filter((match) => match.round === 1);

  // 63 elimination matches + 1 third-place (bronze) match in the final round.
  assert.equal(matches.length, 64);
  assert.deepEqual(rounds, { 1: 32, 2: 16, 3: 8, 4: 4, 5: 2, 6: 2 });
  assert.equal(firstRound.every((match) => Boolean(match.player1Id) && Boolean(match.player2Id)), true);
  assert.equal(firstRound.every((match) => match.status === "READY" && match.isBye === false), true);
  const championshipFinal = matches.find((match) => match.round === 6 && !match.isThirdPlace);
  const bronzeMatch = matches.find((match) => match.isThirdPlace);
  assert.equal(championshipFinal?.bestOf, 7);
  assert.ok(bronzeMatch, "third-place match should be generated");
  assert.equal(bronzeMatch?.round, 6);
}

async function testEightBracketBlueprint() {
  const matches = buildMatchBlueprints("t-8-blueprint", 8, createSeeds(8), {
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    tableCount: 4
  });

  const rounds = matches.reduce<Record<number, number>>((accumulator, match) => {
    accumulator[match.round] = (accumulator[match.round] ?? 0) + 1;
    return accumulator;
  }, {});
  const firstRound = matches.filter((match) => match.round === 1);

  assert.equal(matches.length, 8);
  assert.deepEqual(rounds, { 1: 4, 2: 2, 3: 2 });
  assert.equal(firstRound.every((match) => Boolean(match.player1Id) && Boolean(match.player2Id)), true);
  assert.equal(firstRound.every((match) => match.status === "READY" && match.isBye === false), true);
}

async function testSixteenBracketBlueprint() {
  const matches = buildMatchBlueprints("t-16-blueprint", 16, createSeeds(16), {
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    tableCount: 4
  });

  const rounds = matches.reduce<Record<number, number>>((accumulator, match) => {
    accumulator[match.round] = (accumulator[match.round] ?? 0) + 1;
    return accumulator;
  }, {});
  const firstRound = matches.filter((match) => match.round === 1);

  assert.equal(matches.length, 16);
  assert.deepEqual(rounds, { 1: 8, 2: 4, 3: 2, 4: 2 });
  assert.equal(firstRound.every((match) => Boolean(match.player1Id) && Boolean(match.player2Id)), true);
  assert.equal(firstRound.every((match) => match.status === "READY" && match.isBye === false), true);
}

async function testWinnerProgressionAndFinalChampion() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-8",
    status: TournamentStatus.LIVE,
    bracketSize: 8,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 2 }
  };
  prisma.bracketMatches = buildMatchBlueprints("t-8", 8, createSeeds(8), {
    startsAt: prisma.tournamentState.startsAt,
    tableCount: prisma.tournamentState.club.tables
  });
  for (let index = 1; index <= 8; index += 1) {
    prisma.players.set(`player-${index}`, {
      id: `player-${index}`,
      levelPoints: 0,
      level: "NOVICE",
      wins: 0,
      losses: 0,
      tournamentWins: 0
    });
  }

  const progressionService = new BracketMatchProgressionService(prisma as never);
  const service = new BracketMatchesService(
    prisma as never,
    progressionService,
    new StubNotificationsService() as never,
    new StubAuditService() as never
  );
  const actor = {
    sub: "organizer-1",
    email: "organizer@example.com",
    role: "ORGANIZER",
    type: "access" as const
  };

  const firstRound = prisma.bracketMatches.filter((match) => match.round === 1);
  assert.equal(firstRound.length, 4);

  for (const match of firstRound) {
    await service.updateMatchResult(match.id, { winnerId: match.player1Id!, player1Score: 3, player2Score: 1 }, actor as never);
  }

  const semifinals = prisma.bracketMatches.filter((match) => match.round === 2);
  assert.equal(semifinals.length, 2);
  assert.equal(semifinals.every((match) => match.player1Id && match.player2Id), true);
  assert.equal(semifinals.every((match) => match.status === BracketMatchStatuses.READY), true);

  for (const match of semifinals) {
    await service.updateMatchResult(match.id, { winnerId: match.player1Id!, player1Score: 3, player2Score: 1 }, actor as never);
  }

  const finalMatch = prisma.bracketMatches.find((match) => match.round === 3 && !match.isThirdPlace);
  assert.ok(finalMatch);
  assert.equal(Boolean(finalMatch.player1Id), true);
  assert.equal(Boolean(finalMatch.player2Id), true);
  assert.equal(finalMatch.status, BracketMatchStatuses.READY);

  await service.updateMatchResult(finalMatch.id, {
    winnerId: finalMatch.player1Id!,
    player1Score: 5,
    player2Score: 3
  }, actor as never);

  assert.equal(prisma.tournamentState.status, TournamentStatus.FINISHED);
  assert.equal(prisma.bracketMatches.find((match) => match.id === finalMatch.id)?.winnerId, finalMatch.player1Id);
  const champion = prisma.players.get(finalMatch.player1Id!);
  const finalist = prisma.players.get(finalMatch.player2Id!);
  assert.equal(champion?.wins, 3);
  assert.equal(champion?.losses, 0);
  assert.equal(champion?.levelPoints, 24);
  assert.equal(champion?.tournamentWins, 1);
  assert.equal(finalist?.wins, 2);
  assert.equal(finalist?.losses, 1);
  assert.equal(finalist?.levelPoints, 11);
}

async function testInvalidScoreValidation() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-invalid-score",
    status: TournamentStatus.LIVE,
    bracketSize: 8,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 2 }
  };
  prisma.bracketMatches = buildMatchBlueprints("t-invalid-score", 8, createSeeds(8), {
    startsAt: prisma.tournamentState.startsAt,
    tableCount: prisma.tournamentState.club.tables
  });

  const progressionService = new BracketMatchProgressionService(prisma as never);
  const service = new BracketMatchesService(
    prisma as never,
    progressionService,
    new StubNotificationsService() as never,
    new StubAuditService() as never
  );
  const actor = {
    sub: "organizer-1",
    email: "organizer@example.com",
    role: "ORGANIZER",
    type: "access" as const
  };
  const firstMatch = prisma.bracketMatches.find((match) => match.round === 1);
  assert.ok(firstMatch);

  await assert.rejects(
    service.updateMatchResult(
      firstMatch.id,
      { winnerId: firstMatch.player1Id!, player1Score: 3 },
      actor as never
    ),
    /Both player scores must be provided together\./
  );

  await assert.rejects(
    service.updateMatchResult(
      firstMatch.id,
      { winnerId: firstMatch.player1Id!, player1Score: 3, player2Score: 3 },
      actor as never
    ),
    /Match scores cannot be equal\./
  );
}

async function testDoubleEliminationBlueprint() {
  const matches = buildDoubleEliminationBlueprints("t-de-8", 8, createSeeds(8), {
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    tableCount: 4
  });
  const upper = matches.filter((match) => match.phase === "UPPER");
  const lower = matches.filter((match) => match.phase === "LOWER");
  const final = matches.filter((match) => match.phase === "FINAL");

  // N=8: winners bracket 7, losers bracket N-2=6, grand final 1 -> total 2N-2=14.
  assert.equal(matches.length, 14);
  assert.equal(upper.length, 7);
  assert.equal(lower.length, 6);
  assert.equal(final.length, 1);
  // Every winners-bracket match drops its loser into the losers bracket.
  assert.equal(upper.every((match) => Boolean(match.loserNextMatchId)), true);
  // Double elimination has no separate third-place match.
  assert.equal(matches.some((match) => match.isThirdPlace), false);
  // Grand final is fed by the winners-bracket final and the losers-bracket final.
  const grandFinal = final[0];
  const feeders = matches.filter((match) => match.nextMatchId === grandFinal.id);
  assert.equal(feeders.length, 2);
  assert.equal(feeders.some((match) => match.phase === "UPPER"), true);
  assert.equal(feeders.some((match) => match.phase === "LOWER"), true);
}

async function testDoubleEliminationFourPlayers() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-de-4",
    status: TournamentStatus.LIVE,
    bracketSize: 4,
    bracketFormat: BracketFormats.DOUBLE_ELIMINATION,
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 2 }
  };
  prisma.bracketMatches = buildDoubleEliminationBlueprints("t-de-4", 4, createSeeds(4), {
    startsAt: prisma.tournamentState.startsAt,
    tableCount: 2
  });
  for (let index = 1; index <= 4; index += 1) {
    prisma.players.set(`player-${index}`, {
      id: `player-${index}`,
      levelPoints: 0,
      level: "NOVICE",
      wins: 0,
      losses: 0,
      tournamentWins: 0
    });
  }

  const progressionService = new BracketMatchProgressionService(prisma as never);
  const service = new BracketMatchesService(
    prisma as never,
    progressionService,
    new StubNotificationsService() as never,
    new StubAuditService() as never
  );
  const actor = { sub: "organizer-1", email: "organizer@example.com", role: "ORGANIZER", type: "access" as const };

  await progressionService.resolveTournamentProgression("t-de-4");

  // Play every match (the higher seed / player1 always wins) until the grand final resolves.
  for (let guard = 0; guard < 32; guard += 1) {
    const ready = prisma.bracketMatches.find(
      (match) => match.status === BracketMatchStatuses.READY && match.player1Id && match.player2Id
    );
    if (!ready) {
      break;
    }
    await service.updateMatchResult(
      ready.id,
      { winnerId: ready.player1Id!, player1Score: 3, player2Score: 1 },
      actor as never
    );
  }

  const grandFinal = prisma.bracketMatches.find((match) => match.phase === "FINAL");
  assert.ok(grandFinal, "grand final should exist");
  assert.equal(grandFinal!.status, BracketMatchStatuses.FINISHED);
  assert.ok(grandFinal!.winnerId, "grand final should have a winner");
  assert.equal(prisma.bracketMatches.filter((match) => match.status === "PENDING").length, 0);
  assert.equal(prisma.tournamentState.status, TournamentStatus.FINISHED);
}

function testRoundRobinBlueprint() {
  const even = buildRoundRobinBlueprints("t-rr-4", ["p1", "p2", "p3", "p4"], {
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    tableCount: 2
  });
  // 4 participants -> C(4,2) = 6 matches, all immediately playable, no progression links.
  assert.equal(even.length, 6);
  assert.equal(even.every((match) => match.status === "READY"), true);
  assert.equal(even.every((match) => Boolean(match.player1Id) && Boolean(match.player2Id)), true);
  assert.equal(even.every((match) => match.nextMatchId === null && match.loserNextMatchId === null), true);
  // Each participant plays every other exactly once (3 games each).
  for (const id of ["p1", "p2", "p3", "p4"]) {
    const games = even.filter((match) => match.player1Id === id || match.player2Id === id).length;
    assert.equal(games, 3);
  }

  // Odd roster -> rotating BYE; 5 participants -> C(5,2) = 10 matches.
  const odd = buildRoundRobinBlueprints("t-rr-5", ["a", "b", "c", "d", "e"], {
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    tableCount: 2
  });
  assert.equal(odd.length, 10);
}

async function testRoundRobinFinishes() {
  const prisma = new InMemoryPrismaService();
  prisma.tournamentState = {
    id: "t-rr",
    status: TournamentStatus.LIVE,
    bracketSize: 0,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    bracketSystem: "ROUND_ROBIN",
    startsAt: new Date("2026-03-31T12:00:00.000Z"),
    club: { tables: 2 }
  };
  prisma.bracketMatches = buildRoundRobinBlueprints("t-rr", ["player-1", "player-2", "player-3", "player-4"], {
    startsAt: prisma.tournamentState.startsAt,
    tableCount: 2
  });
  for (let index = 1; index <= 4; index += 1) {
    prisma.players.set(`player-${index}`, {
      id: `player-${index}`,
      levelPoints: 0,
      level: "NOVICE",
      wins: 0,
      losses: 0,
      tournamentWins: 0
    });
  }

  const progressionService = new BracketMatchProgressionService(prisma as never);
  const service = new BracketMatchesService(
    prisma as never,
    progressionService,
    new StubNotificationsService() as never,
    new StubAuditService() as never
  );
  const actor = { sub: "organizer-1", email: "o@e.com", role: "ORGANIZER", type: "access" as const };

  // Tournament stays live until every round-robin match has a result.
  await progressionService.resolveTournamentProgression("t-rr");
  assert.equal(prisma.tournamentState.status, TournamentStatus.LIVE);

  for (const match of [...prisma.bracketMatches]) {
    await service.updateMatchResult(
      match.id,
      { winnerId: match.player1Id!, player1Score: 3, player2Score: 1 },
      actor as never
    );
  }

  assert.equal(prisma.tournamentState.status, TournamentStatus.FINISHED);
  // Every one of the 6 matches produced exactly one win across the field.
  const totalWins = [...prisma.players.values()].reduce((sum, player) => sum + player.wins, 0);
  assert.equal(totalWins, 6);
}

async function main() {
  testRoundRobinBlueprint();
  await testRoundRobinFinishes();
  await testDoubleEliminationBlueprint();
  await testDoubleEliminationFourPlayers();
  await testTenPlayersInSixteenBracket();
  await testTwoPlayersInSixteenBracket();
  await testOneParticipantValidation();
  await testEightBracketBlueprint();
  await testSixteenBracketBlueprint();
  await testSixtyFourBracketBlueprint();
  await testWinnerProgressionAndFinalChampion();
  await testInvalidScoreValidation();
  console.log("Bracket BYE tests passed.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
