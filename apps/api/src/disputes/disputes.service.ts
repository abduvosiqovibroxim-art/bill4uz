import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { DisputeStatus, Role, TeamMemberStatus } from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { AuditService } from "../platform/audit.service";
import { FileDisputeDto, ResolveDisputeDto } from "./dto";

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async fileDispute(actor: RequestUser, matchId: string, dto: FileDisputeDto) {
    const reason = dto.reason?.trim();
    if (!reason || reason.length < 5) {
      throw new BadRequestException("Please describe the issue (at least 5 characters).");
    }

    const player = await this.prisma.player.findUnique({ where: { userId: actor.sub }, select: { id: true } });
    if (!player) {
      throw new NotFoundException("Player profile not found.");
    }

    const match = await this.prisma.bracketMatch.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        tournamentId: true,
        status: true,
        player1: this.participantSelect(),
        player2: this.participantSelect()
      }
    });
    if (!match) {
      throw new NotFoundException("Match not found.");
    }
    if (match.status !== "FINISHED") {
      throw new BadRequestException("Only a played (finished) match can be disputed.");
    }

    const participantPlayerIds = new Set([
      ...this.playerIdsOf(match.player1),
      ...this.playerIdsOf(match.player2)
    ]);
    if (!participantPlayerIds.has(player.id)) {
      throw new ForbiddenException("You can only dispute a match you played in.");
    }

    const existing = await this.prisma.matchDispute.findFirst({
      where: { matchId, filedByUserId: actor.sub, status: DisputeStatus.PENDING },
      select: { id: true }
    });
    if (existing) {
      throw new ConflictException("You already have a pending dispute for this match.");
    }

    const dispute = await this.prisma.matchDispute.create({
      data: {
        matchId,
        tournamentId: match.tournamentId,
        filedByUserId: actor.sub,
        reason
      }
    });

    await this.auditService.log({
      actor,
      action: "match.dispute.file",
      entityType: "match",
      entityId: matchId,
      metadata: { disputeId: dispute.id, tournamentId: match.tournamentId }
    });

    return dispute;
  }

  async listForTournament(actor: RequestUser, tournamentId: string) {
    await this.assertCanModerate(actor, tournamentId);
    return this.prisma.matchDispute.findMany({
      where: { tournamentId },
      include: {
        filedBy: { select: { id: true, email: true } },
        match: { select: { id: true, round: true, matchNumber: true } }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
  }

  async resolve(actor: RequestUser, disputeId: string, dto: ResolveDisputeDto) {
    if (dto.status !== DisputeStatus.UPHELD && dto.status !== DisputeStatus.REJECTED) {
      throw new BadRequestException("Resolution status must be UPHELD or REJECTED.");
    }

    const dispute = await this.prisma.matchDispute.findUnique({
      where: { id: disputeId },
      select: { id: true, tournamentId: true, status: true, matchId: true }
    });
    if (!dispute) {
      throw new NotFoundException("Dispute not found.");
    }
    await this.assertCanModerate(actor, dispute.tournamentId);
    if (dispute.status !== DisputeStatus.PENDING) {
      throw new ConflictException("Dispute is already resolved.");
    }

    const updated = await this.prisma.matchDispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        resolution: dto.resolution?.trim() || null,
        resolvedByUserId: actor.sub,
        resolvedAt: new Date()
      }
    });

    await this.auditService.log({
      actor,
      action: "match.dispute.resolve",
      entityType: "match",
      entityId: dispute.matchId,
      metadata: { disputeId, status: dto.status }
    });

    return updated;
  }

  private async assertCanModerate(actor: RequestUser, tournamentId: string) {
    if (actor.role === Role.ADMIN) {
      return;
    }
    if (actor.role !== Role.ORGANIZER) {
      throw new ForbiddenException("Forbidden.");
    }
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true }
    });
    if (!tournament || tournament.organizerId !== actor.sub) {
      throw new ForbiddenException("You can only manage disputes for your own tournaments.");
    }
  }

  private participantSelect() {
    return {
      select: {
        playerId: true,
        teamId: true,
        team: {
          select: {
            members: {
              where: { status: TeamMemberStatus.ACTIVE },
              select: { playerId: true }
            }
          }
        }
      }
    } as const;
  }

  private playerIdsOf(
    participant: {
      playerId: string | null;
      teamId: string | null;
      team: { members: Array<{ playerId: string }> } | null;
    } | null
  ): string[] {
    if (!participant) {
      return [];
    }
    if (participant.teamId && participant.team?.members?.length) {
      return participant.team.members.map((member) => member.playerId);
    }
    return participant.playerId ? [participant.playerId] : [];
  }
}
