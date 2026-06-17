import * as assert from "node:assert/strict";
import {
  ApplicationStatus,
  ParticipantSelectionMode,
  PlayerLevel,
  TournamentStatus,
  TournamentType
} from "@prisma/client";
import { ApplicationsService } from "../src/applications/applications.service";

type PlayerState = {
  id: string;
  userId: string;
  fullName: string;
  levelPoints: number;
  tournamentsPlayed: number;
  level: PlayerLevel;
};

type TournamentState = {
  id: string;
  status: TournamentStatus;
  bracketSize: number;
  tournamentType: TournamentType;
  participantSelectionMode: ParticipantSelectionMode;
  minPlayerLevel: PlayerLevel;
  maxPlayerLevel: PlayerLevel;
  bracketMatchCount: number;
};

type ApplicationState = {
  id: string;
  playerId: string;
  tournamentId: string;
  status: ApplicationStatus;
  createdAt: Date;
};

type BracketParticipantState = {
  id: string;
  tournamentId: string;
  playerId: string;
  name: string;
  seed: number;
};

class InMemoryApplicationPrisma {
  public playerState: PlayerState = {
    id: "player-1",
    userId: "user-1",
    fullName: "Ali Valiyev",
    levelPoints: 0,
    tournamentsPlayed: 0,
    level: PlayerLevel.NOVICE
  };

  public tournamentState: TournamentState = {
    id: "tournament-1",
    status: TournamentStatus.REGISTRATION,
    bracketSize: 8,
    tournamentType: TournamentType.VISITOR,
    participantSelectionMode: ParticipantSelectionMode.DIRECT,
    minPlayerLevel: PlayerLevel.NOVICE,
    maxPlayerLevel: PlayerLevel.PRO,
    bracketMatchCount: 0
  };

  public applications: ApplicationState[] = [];
  public participants: BracketParticipantState[] = [];

  async $transaction<T>(handler: (tx: InMemoryApplicationPrisma) => Promise<T>) {
    return handler(this);
  }

  playerDelegate = {
    findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
      if (where.userId && where.userId !== this.playerState.userId) {
        return null;
      }

      if (where.id && where.id !== this.playerState.id) {
        return null;
      }

      return { ...this.playerState };
    },
    update: async ({
      where,
      data
    }: {
      where: { id: string };
      data: { levelPoints?: number; tournamentsPlayed?: { increment: number }; level?: PlayerLevel };
    }) => {
      assert.equal(where.id, this.playerState.id);

      if (typeof data.levelPoints === "number") {
        this.playerState.levelPoints = data.levelPoints;
      }

      if (data.tournamentsPlayed) {
        this.playerState.tournamentsPlayed += data.tournamentsPlayed.increment;
      }

      if (data.level) {
        this.playerState.level = data.level;
      }

      return { ...this.playerState };
    }
  };

  tournamentDelegate = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (where.id !== this.tournamentState.id) {
        return null;
      }

      return {
        id: this.tournamentState.id,
        status: this.tournamentState.status,
        bracketSize: this.tournamentState.bracketSize,
        tournamentType: this.tournamentState.tournamentType,
        participantSelectionMode: this.tournamentState.participantSelectionMode,
        minPlayerLevel: this.tournamentState.minPlayerLevel,
        maxPlayerLevel: this.tournamentState.maxPlayerLevel,
        _count: {
          bracketMatches: this.tournamentState.bracketMatchCount
        }
      };
    }
  };

  applicationDelegate = {
    findUnique: async ({
      where
    }: {
      where: { id?: string; playerId_tournamentId?: { playerId: string; tournamentId: string } };
    }) => {
      const application = where.id
        ? this.applications.find((item) => item.id === where.id)
        : this.applications.find(
            (item) =>
              item.playerId === where.playerId_tournamentId?.playerId &&
              item.tournamentId === where.playerId_tournamentId.tournamentId
          );

      return application ? this.hydrateApplication(application) : null;
    },
    create: async ({ data }: { data: { playerId: string; tournamentId: string; status: ApplicationStatus } }) => {
      const application = {
        id: `application-${this.applications.length + 1}`,
        playerId: data.playerId,
        tournamentId: data.tournamentId,
        status: data.status,
        createdAt: new Date("2026-05-29T00:00:00.000Z")
      };
      this.applications.push(application);
      return this.hydrateApplication(application);
    },
    update: async ({ where, data }: { where: { id: string }; data: { status: ApplicationStatus } }) => {
      const application = this.applications.find((item) => item.id === where.id);
      assert.ok(application);
      application.status = data.status;
      return this.hydrateApplication(application);
    }
  };

  bracketParticipantDelegate = {
    findFirst: async ({ where }: { where: { tournamentId: string; playerId: string } }) =>
      this.participants.find(
        (participant) => participant.tournamentId === where.tournamentId && participant.playerId === where.playerId
      ) ?? null,
    findMany: async ({ where }: { where: { tournamentId: string } }) =>
      this.participants
        .filter((participant) => participant.tournamentId === where.tournamentId)
        .sort((left, right) => left.seed - right.seed)
        .map((participant) => ({ seed: participant.seed })),
    create: async ({ data }: { data: { tournamentId: string; playerId: string; name: string; seed: number } }) => {
      this.participants.push({
        id: `participant-${this.participants.length + 1}`,
        tournamentId: data.tournamentId,
        playerId: data.playerId,
        name: data.name,
        seed: data.seed
      });
      return this.participants.at(-1);
    }
  };

  get playerModel() {
    return this.playerDelegate;
  }

  get tournamentModel() {
    return this.tournamentDelegate;
  }

  get applicationModel() {
    return this.applicationDelegate;
  }

  get bracketParticipantModel() {
    return this.bracketParticipantDelegate;
  }

  player = this.playerModel;
  tournament = this.tournamentModel;
  application = this.applicationModel;
  bracketParticipant = this.bracketParticipantModel;

  private hydrateApplication(application: ApplicationState) {
    return {
      ...application,
      player: {
        ...this.playerState,
        city: null,
        country: null,
        club: null
      },
      tournament: {
        ...this.tournamentState,
        organizerId: "organizer-1",
        club: null,
        discipline: { name: "Свободная пирамида" }
      }
    };
  }
}

class StubNotificationsService {
  public moderated: string[] = [];
  public submitted: string[] = [];

  async notifyApplicationModerated(id: string) {
    this.moderated.push(id);
  }

  async notifyApplicationSubmitted(id: string) {
    this.submitted.push(id);
  }
}

class StubAuditService {
  async log() {}
}

const actor = {
  sub: "user-1",
  email: "player@example.com",
  role: "PLAYER",
  type: "access" as const
};

function createService(prisma: InMemoryApplicationPrisma, notifications: StubNotificationsService) {
  return new ApplicationsService(prisma as never, notifications as never, new StubAuditService() as never);
}

async function testDirectTournamentAutoJoin() {
  const prisma = new InMemoryApplicationPrisma();
  const notifications = new StubNotificationsService();
  const service = createService(prisma, notifications);

  const result = await service.create(actor as never, prisma.tournamentState.id);

  assert.equal(result.status, ApplicationStatus.APPROVED);
  assert.equal(prisma.applications.length, 1);
  assert.equal(prisma.participants.length, 1);
  assert.equal(prisma.participants[0].seed, 1);
  assert.equal(prisma.playerState.tournamentsPlayed, 1);
  assert.deepEqual(notifications.moderated, ["application-1"]);
  assert.deepEqual(notifications.submitted, []);
}

async function testAutoJoinUpgradesExistingPendingApplication() {
  const prisma = new InMemoryApplicationPrisma();
  prisma.tournamentState.participantSelectionMode = ParticipantSelectionMode.APPLICATIONS;
  prisma.tournamentState.tournamentType = TournamentType.VISITOR;
  prisma.applications.push({
    id: "application-pending",
    playerId: prisma.playerState.id,
    tournamentId: prisma.tournamentState.id,
    status: ApplicationStatus.PENDING,
    createdAt: new Date("2026-05-29T00:00:00.000Z")
  });
  const notifications = new StubNotificationsService();
  const service = createService(prisma, notifications);

  const result = await service.create(actor as never, prisma.tournamentState.id);

  assert.equal(result.status, ApplicationStatus.APPROVED);
  assert.equal(prisma.applications.length, 1);
  assert.equal(prisma.applications[0].status, ApplicationStatus.APPROVED);
  assert.equal(prisma.participants.length, 1);
  assert.deepEqual(notifications.moderated, ["application-pending"]);
}

async function testRepeatAutoJoinDoesNotDuplicateParticipant() {
  const prisma = new InMemoryApplicationPrisma();
  const notifications = new StubNotificationsService();
  const service = createService(prisma, notifications);

  await service.create(actor as never, prisma.tournamentState.id);
  const second = await service.create(actor as never, prisma.tournamentState.id);

  assert.equal(second.status, ApplicationStatus.APPROVED);
  assert.equal(prisma.applications.length, 1);
  assert.equal(prisma.participants.length, 1);
  assert.equal(prisma.playerState.tournamentsPlayed, 1);
}

async function testProfessionalApplicationsStayPending() {
  const prisma = new InMemoryApplicationPrisma();
  prisma.tournamentState.tournamentType = TournamentType.PRO;
  prisma.tournamentState.participantSelectionMode = ParticipantSelectionMode.APPLICATIONS;
  const notifications = new StubNotificationsService();
  const service = createService(prisma, notifications);

  const result = await service.create(actor as never, prisma.tournamentState.id);

  assert.equal(result.status, ApplicationStatus.PENDING);
  assert.equal(prisma.applications.length, 1);
  assert.equal(prisma.participants.length, 0);
  assert.deepEqual(notifications.submitted, ["application-1"]);
  assert.deepEqual(notifications.moderated, []);
}

async function main() {
  await testDirectTournamentAutoJoin();
  await testAutoJoinUpgradesExistingPendingApplication();
  await testRepeatAutoJoinDoesNotDuplicateParticipant();
  await testProfessionalApplicationsStayPending();
  console.log("Application auto-join tests passed.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
