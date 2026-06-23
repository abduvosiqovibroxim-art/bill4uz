import * as assert from "node:assert/strict";
import { TournamentStatus } from "@prisma/client";
import { BracketTournamentsService } from "../src/brackets/bracket-tournaments.service";
import { BracketFormats } from "../src/brackets/bracket.types";

type TournamentState = {
  id: string;
  title: string;
  organizerId: string;
  status: TournamentStatus;
  bracketSize: number;
  bracketFormat: string;
  createdAt: Date;
  participants: number;
};

class ManualDrawPrismaService {
  public tournamentState: TournamentState | null = null;
  public bracketParticipants: Array<{
    tournamentId: string;
    name: string;
    seed: number;
    playerId: string | null;
  }> = [];
  public matchCount = 0;

  tournament = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (!this.tournamentState || this.tournamentState.id !== where.id) {
        return null;
      }

      return {
        ...this.tournamentState
      };
    },
    update: async ({
      where,
      data
    }: {
      where: { id: string };
      data: { status?: TournamentStatus; participants?: number };
    }) => {
      if (!this.tournamentState || this.tournamentState.id !== where.id) {
        return null;
      }

      if (data.status) {
        this.tournamentState.status = data.status;
      }

      if (typeof data.participants === "number") {
        this.tournamentState.participants = data.participants;
      }

      return { ...this.tournamentState };
    }
  };

  bracketMatch = {
    count: async ({ where }: { where: { tournamentId: string } }) =>
      where.tournamentId === this.tournamentState?.id ? this.matchCount : 0
  };

  bracketParticipant = {
    count: async ({ where }: { where: { tournamentId: string } }) =>
      this.bracketParticipants.filter((participant) => participant.tournamentId === where.tournamentId).length,
    createMany: async ({
      data
    }: {
      data: Array<{ tournamentId: string; name: string; seed: number; playerId: string | null }>;
    }) => {
      this.bracketParticipants.push(...data);
      return { count: data.length };
    }
  };
}

class StubBracketGenerationService {
  public calls: string[] = [];

  async generate(tournamentId: string) {
    this.calls.push(tournamentId);
    return {
      tournamentId,
      matchesCreated: 0,
      bracketSize: 8,
      participantCount: 0
    };
  }
}

class StubAuditService {
  async log() {}
}

const organizerActor = {
  sub: "organizer-1",
  email: "organizer@example.com",
  role: "ORGANIZER",
  type: "access" as const
};

class StubProgressionService {
  async resolveTournamentProgression() {
    /* no-op for manual draw tests */
  }
}

function createService(prisma: ManualDrawPrismaService, generation: StubBracketGenerationService) {
  return new BracketTournamentsService(
    prisma as never,
    generation as never,
    new StubProgressionService() as never,
    new StubAuditService() as never
  );
}

function createTournamentState(overrides: Partial<TournamentState> = {}): TournamentState {
  return {
    id: "t-manual",
    title: "Manual draw tournament",
    organizerId: "organizer-1",
    status: TournamentStatus.REGISTRATION,
    bracketSize: 8,
    bracketFormat: BracketFormats.SINGLE_ELIMINATION,
    createdAt: new Date("2026-03-31T12:00:00.000Z"),
    participants: 0,
    ...overrides
  };
}

async function testManualDrawFlow() {
  const prisma = new ManualDrawPrismaService();
  prisma.tournamentState = createTournamentState();
  const generation = new StubBracketGenerationService();
  const service = createService(prisma, generation);
  const input = [" Ali ", "Bek", "Said", "Timur"];

  const result = await service.manualDraw("t-manual", input, organizerActor as never);
  const createdNames = prisma.bracketParticipants.map((participant) => participant.name);
  const createdSeeds = prisma.bracketParticipants.map((participant) => participant.seed).sort((left, right) => left - right);

  assert.equal(generation.calls.length, 1);
  assert.equal(generation.calls[0], "t-manual");
  assert.equal(prisma.bracketParticipants.length, 4);
  assert.equal(prisma.bracketParticipants.every((participant) => participant.playerId === null), true);
  assert.equal(prisma.tournamentState.status, TournamentStatus.LIVE);
  assert.equal(prisma.tournamentState.participants, 4);
  assert.equal(result.status, TournamentStatus.LIVE);
  assert.equal(result.participants.length, 4);
  assert.deepEqual(createdSeeds, [1, 4, 5, 8]);
  assert.deepEqual([...new Set(createdNames)].sort(), ["Ali", "Bek", "Said", "Timur"].sort());
}

async function testDuplicateManualNamesRejected() {
  const prisma = new ManualDrawPrismaService();
  prisma.tournamentState = createTournamentState();
  const service = createService(prisma, new StubBracketGenerationService());

  await assert.rejects(
    service.manualDraw("t-manual", ["Ali", "ali"], organizerActor as never),
    /Participant names must be unique\./
  );
}

async function testTooManyManualParticipantsRejected() {
  const prisma = new ManualDrawPrismaService();
  prisma.tournamentState = createTournamentState({ bracketSize: 8 });
  const service = createService(prisma, new StubBracketGenerationService());

  await assert.rejects(
    service.manualDraw(
      "t-manual",
      Array.from({ length: 9 }, (_, index) => `Player ${index + 1}`),
      organizerActor as never
    ),
    /Participant count exceeds bracket size\./
  );
}

async function testDoubleEliminationManualDrawAllowed() {
  const prisma = new ManualDrawPrismaService();
  prisma.tournamentState = createTournamentState({ bracketFormat: BracketFormats.DOUBLE_ELIMINATION });
  const generation = new StubBracketGenerationService();
  const service = createService(prisma, generation);

  // Double elimination is now supported — manual draw should succeed and trigger generation.
  const result = await service.manualDraw("t-manual", ["Ali", "Bek", "Dan", "Eli"], organizerActor as never);
  assert.equal(result.participants.length, 4);
  assert.equal(prisma.bracketParticipants.length, 4);
  assert.equal(generation.calls.length, 1);
}

async function main() {
  await testManualDrawFlow();
  await testDuplicateManualNamesRejected();
  await testTooManyManualParticipantsRejected();
  await testDoubleEliminationManualDrawAllowed();
  console.log("Tournament manual draw tests passed.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
