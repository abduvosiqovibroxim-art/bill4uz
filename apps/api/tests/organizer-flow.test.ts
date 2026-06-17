import * as assert from "node:assert/strict";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import {
  BracketFormat,
  BilliardKind,
  ParticipantSelectionMode,
  PlayerLevel,
  Role,
  TournamentBracketSystem,
  TournamentCategory,
  TournamentFormat,
  TournamentLevel,
  TournamentStatus,
  TournamentType
} from "@prisma/client";
import { AuthService } from "../src/auth/auth.service";
import { SignUpDto } from "../src/auth/dto";
import { TournamentsService } from "../src/tournaments/tournaments.service";
import { TOURNAMENT_DISCIPLINES } from "../src/tournaments/disciplines";

const ownerActor = {
  sub: "organizer-owner",
  email: "owner@example.com",
  role: Role.ORGANIZER,
  capabilities: [],
  type: "access" as const
};

const otherOrganizerActor = {
  sub: "organizer-other",
  email: "other@example.com",
  role: Role.ORGANIZER,
  capabilities: [],
  type: "access" as const
};

const adminActor = {
  sub: "admin-1",
  email: "admin@example.com",
  role: Role.ADMIN,
  capabilities: ["ADMIN_PANEL" as const],
  type: "access" as const
};

class StubAuditService {
  logs: unknown[] = [];

  async log(input: unknown) {
    this.logs.push(input);
  }
}

class TournamentPrismaStub {
  public createdTournament: Record<string, unknown> | null = null;
  public tournamentState = {
    id: "t-owned",
    organizerId: ownerActor.sub,
    status: TournamentStatus.DRAFT,
    bracketSize: 8,
    bracketFormat: BracketFormat.SINGLE_ELIMINATION,
    bracketSystem: TournamentBracketSystem.SINGLE_ELIMINATION,
    tournamentType: TournamentType.VISITOR,
    participantSelectionMode: ParticipantSelectionMode.DIRECT,
    minPlayerLevel: PlayerLevel.NOVICE,
    maxPlayerLevel: PlayerLevel.PRO,
    _count: {
      bracketMatches: 0,
      bracketParticipants: 0
    }
  };

  club = {
    findUnique: async () => ({
      id: "club-1",
      userId: null,
      deletedAt: null
    })
  };

  discipline = {
    findUnique: async () => ({
      id: "discipline-1",
      name: TOURNAMENT_DISCIPLINES[0].name
    })
  };

  application = {
    count: async () => 0
  };

  tournament = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      this.createdTournament = {
        id: "t-created",
        ...data
      };
      return this.createdTournament;
    },
    findUnique: async () => this.tournamentState,
    update: async ({ data }: { data: Record<string, unknown> }) => ({
      ...this.tournamentState,
      ...data
    })
  };
}

class AuthPrismaStub {
  public createdUsers: Array<Record<string, unknown>> = [];
  public playerCreated = false;

  user = {
    findUnique: async () => null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const user = {
        id: `user-${this.createdUsers.length + 1}`,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        ...data
      };
      this.createdUsers.push(user);
      return user;
    }
  };

  city = {
    findUnique: async () => ({
      id: "city-1",
      countryId: "country-1"
    })
  };

  player = {
    create: async () => {
      this.playerCreated = true;
    }
  };

  refreshToken = {
    create: async () => ({})
  };

  async $transaction<T>(callback: (tx: AuthPrismaStub) => Promise<T>) {
    return callback(this);
  }
}

function createTournamentDto() {
  return {
    title: "Organizer Cup",
    clubId: "club-1",
    disciplineId: "discipline-1",
    startsAt: "2026-07-01T10:00:00.000Z",
    prizePool: 0,
    bracketSize: 8,
    billiardKind: BilliardKind.PYRAMID,
    category: TournamentCategory.OPEN,
    tournamentLevel: TournamentLevel.OPEN_TOURNAMENT,
    eventFormat: TournamentFormat.INDIVIDUAL,
    bracketSystem: TournamentBracketSystem.SINGLE_ELIMINATION,
    bracketFormat: BracketFormat.SINGLE_ELIMINATION,
    participantSelectionMode: ParticipantSelectionMode.DIRECT,
    tournamentType: TournamentType.VISITOR,
    minPlayerLevel: PlayerLevel.NOVICE,
    maxPlayerLevel: PlayerLevel.PRO,
    status: TournamentStatus.DRAFT
  };
}

async function testOrganizerCreatesOwnedTournament() {
  const prisma = new TournamentPrismaStub();
  const service = new TournamentsService(prisma as never, new StubAuditService() as never);

  const created = await service.create(createTournamentDto() as never, ownerActor);

  assert.equal(created.organizerId, ownerActor.sub);
  assert.equal(prisma.createdTournament?.organizerId, ownerActor.sub);
  assert.equal(prisma.createdTournament?.bracketSystem, TournamentBracketSystem.SINGLE_ELIMINATION);
}

async function testOrganizerCanUpdateOnlyOwnTournament() {
  const prisma = new TournamentPrismaStub();
  const service = new TournamentsService(prisma as never, new StubAuditService() as never);

  const updated = await service.update("t-owned", { title: "Updated Cup" } as never, ownerActor);
  assert.equal(updated.title, "Updated Cup");

  await assert.rejects(
    service.update("t-owned", { title: "Hijacked Cup" } as never, otherOrganizerActor),
    ForbiddenException
  );
}

async function testAdminCanUpdateAnyTournament() {
  const prisma = new TournamentPrismaStub();
  const service = new TournamentsService(prisma as never, new StubAuditService() as never);

  const updated = await service.update("t-owned", { title: "Admin Updated Cup" } as never, adminActor);
  assert.equal(updated.title, "Admin Updated Cup");
}

async function testUnsupportedBracketFormatsRejected() {
  // Double elimination is now supported and must be accepted on creation.
  const dePrisma = new TournamentPrismaStub();
  const deService = new TournamentsService(dePrisma as never, new StubAuditService() as never);
  const created = await deService.create(
    {
      ...createTournamentDto(),
      bracketSystem: TournamentBracketSystem.DOUBLE_ELIMINATION,
      bracketFormat: BracketFormat.DOUBLE_ELIMINATION
    } as never,
    ownerActor
  );
  assert.equal(created.organizerId, ownerActor.sub);
  assert.equal(dePrisma.createdTournament?.bracketSystem, TournamentBracketSystem.DOUBLE_ELIMINATION);
  assert.equal(dePrisma.createdTournament?.bracketFormat, BracketFormat.DOUBLE_ELIMINATION);

  // All bracket systems (incl. Round Robin / Swiss / Group + Playoff) are now supported.
  for (const system of [
    TournamentBracketSystem.ROUND_ROBIN,
    TournamentBracketSystem.SWISS,
    TournamentBracketSystem.GROUP_PLAYOFF
  ]) {
    const stub = new TournamentPrismaStub();
    const service = new TournamentsService(stub as never, new StubAuditService() as never);
    const result = await service.create({ ...createTournamentDto(), bracketSystem: system } as never, ownerActor);
    assert.equal(result.organizerId, ownerActor.sub);
    assert.equal(stub.createdTournament?.bracketSystem, system);
  }
}

async function testOrganizerSignupCreatesOrganizerRole() {
  const prisma = new AuthPrismaStub();
  const jwtService = {
    signAsync: async (payload: { type: string }) => `${payload.type}-token`,
    decode: () => null
  };
  const configService = {
    get: <T,>(_: string, fallback?: T) => fallback ?? ("" as T)
  };
  const authService = new AuthService(prisma as never, jwtService as never, {} as never, configService as never);

  const session = await authService.signUp({
    role: Role.ORGANIZER,
    firstName: "Organizer",
    lastName: "One",
    phone: "+998 90 123 45 67",
    cityId: "city-1",
    password: "secret1"
  } as SignUpDto);

  assert.equal(session.user.role, Role.ORGANIZER);
  assert.equal(prisma.playerCreated, false);
  assert.equal(prisma.createdUsers[0]?.role, Role.ORGANIZER);
}

async function testClubSignupRejected() {
  const authService = new AuthService(
    new AuthPrismaStub() as never,
    { signAsync: async () => "token", decode: () => null } as never,
    {} as never,
    { get: <T,>(_: string, fallback?: T) => fallback ?? ("" as T) } as never
  );

  await assert.rejects(
    authService.signUp({
      role: Role.CLUB,
      firstName: "Club",
      lastName: "Owner",
      phone: "+998 90 111 22 33",
      cityId: "city-1",
      password: "secret1"
    } as SignUpDto),
    BadRequestException
  );

  await assert.rejects(
    authService.signUp({
      role: Role.ADMIN,
      firstName: "Admin",
      lastName: "User",
      phone: "+998 90 111 22 44",
      cityId: "city-1",
      password: "secret1"
    } as SignUpDto),
    BadRequestException
  );
}

async function main() {
  await testOrganizerCreatesOwnedTournament();
  await testOrganizerCanUpdateOnlyOwnTournament();
  await testAdminCanUpdateAnyTournament();
  await testUnsupportedBracketFormatsRejected();
  await testOrganizerSignupCreatesOrganizerRole();
  await testClubSignupRejected();
  console.log("Organizer flow tests passed.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
