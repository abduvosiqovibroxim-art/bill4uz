import * as assert from "node:assert/strict";
import { DisputesService } from "../src/disputes/disputes.service";

type Dispute = {
  id: string;
  matchId: string;
  tournamentId: string;
  filedByUserId: string;
  reason: string;
  status: string;
  resolution: string | null;
  resolvedByUserId: string | null;
  resolvedAt: Date | null;
};

class StubAuditService {
  async log() {
    /* no-op */
  }
}

class StubNotificationsService {
  async notifyDisputeFiled() {
    /* no-op */
  }
  async notifyDisputeResolved() {
    /* no-op */
  }
}

class StubPrisma {
  // userId -> playerId
  public playersByUser = new Map<string, string>([
    ["user-p1", "p1"],
    ["user-p2", "p2"],
    ["user-out", "outsider"]
  ]);
  public match: Record<string, unknown> = {
    id: "m1",
    tournamentId: "t1",
    status: "FINISHED",
    player1: { playerId: "p1", teamId: null, team: null },
    player2: { playerId: "p2", teamId: null, team: null }
  };
  public tournaments = new Map<string, { organizerId: string }>([["t1", { organizerId: "org-1" }]]);
  public disputes: Dispute[] = [];
  private seq = 0;

  player = {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      const id = this.playersByUser.get(where.userId);
      return id ? { id } : null;
    }
  };

  bracketMatch = {
    findUnique: async ({ where }: { where: { id: string } }) =>
      (this.match as { id: string }).id === where.id ? this.match : null
  };

  tournament = {
    findUnique: async ({ where }: { where: { id: string } }) => this.tournaments.get(where.id) ?? null
  };

  matchDispute = {
    findFirst: async ({ where }: { where: { matchId: string; filedByUserId: string; status: string } }) =>
      this.disputes.find(
        (d) => d.matchId === where.matchId && d.filedByUserId === where.filedByUserId && d.status === where.status
      ) ?? null,
    findUnique: async ({ where }: { where: { id: string } }) => this.disputes.find((d) => d.id === where.id) ?? null,
    findMany: async () => this.disputes,
    create: async ({ data }: { data: Omit<Dispute, "id" | "status" | "resolution" | "resolvedByUserId" | "resolvedAt"> }) => {
      const dispute: Dispute = {
        id: `d${++this.seq}`,
        status: "PENDING",
        resolution: null,
        resolvedByUserId: null,
        resolvedAt: null,
        ...data
      };
      this.disputes.push(dispute);
      return dispute;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<Dispute> }) => {
      const dispute = this.disputes.find((d) => d.id === where.id)!;
      Object.assign(dispute, data);
      return dispute;
    }
  };
}

const player1 = { sub: "user-p1", email: "p1@e.com", role: "PLAYER", type: "access" as const };
const outsider = { sub: "user-out", email: "out@e.com", role: "PLAYER", type: "access" as const };
const admin = { sub: "admin-1", email: "a@e.com", role: "ADMIN", type: "access" as const };

async function testFileHappyPath() {
  const prisma = new StubPrisma();
  const service = new DisputesService(prisma as never, new StubAuditService() as never, new StubNotificationsService() as never);
  const dispute = await service.fileDispute(player1 as never, "m1", { reason: "Score was wrong, I won 5-3" });
  assert.equal(dispute.status, "PENDING");
  assert.equal(prisma.disputes.length, 1);
}

async function testRejectsBeforeFinish() {
  const prisma = new StubPrisma();
  (prisma.match as { status: string }).status = "READY";
  const service = new DisputesService(prisma as never, new StubAuditService() as never, new StubNotificationsService() as never);
  await assert.rejects(service.fileDispute(player1 as never, "m1", { reason: "too early dispute" }), /finished/i);
}

async function testRejectsNonParticipant() {
  const prisma = new StubPrisma();
  const service = new DisputesService(prisma as never, new StubAuditService() as never, new StubNotificationsService() as never);
  await assert.rejects(
    service.fileDispute(outsider as never, "m1", { reason: "not my match but complaining" }),
    /only dispute a match you played/i
  );
}

async function testRejectsDuplicate() {
  const prisma = new StubPrisma();
  const service = new DisputesService(prisma as never, new StubAuditService() as never, new StubNotificationsService() as never);
  await service.fileDispute(player1 as never, "m1", { reason: "first complaint here" });
  await assert.rejects(
    service.fileDispute(player1 as never, "m1", { reason: "second complaint here" }),
    /already have a pending dispute/i
  );
}

async function testResolveByAdmin() {
  const prisma = new StubPrisma();
  const service = new DisputesService(prisma as never, new StubAuditService() as never, new StubNotificationsService() as never);
  const dispute = await service.fileDispute(player1 as never, "m1", { reason: "please review the score" });
  const resolved = await service.resolve(admin as never, dispute.id, { status: "UPHELD" as never, resolution: "corrected" });
  assert.equal(resolved.status, "UPHELD");
  assert.ok(resolved.resolvedAt);
  // resolving again must fail
  await assert.rejects(service.resolve(admin as never, dispute.id, { status: "REJECTED" as never }), /already resolved/i);
}

async function main() {
  await testFileHappyPath();
  await testRejectsBeforeFinish();
  await testRejectsNonParticipant();
  await testRejectsDuplicate();
  await testResolveByAdmin();
  console.log("Disputes tests passed.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
