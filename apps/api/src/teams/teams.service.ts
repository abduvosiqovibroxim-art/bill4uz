import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, TeamMemberRole, TeamMemberStatus, TournamentStatus } from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { AuditService } from "../platform/audit.service";
import { CreateTeamDto, InviteTeamMemberDto, RespondInviteDto, SubstituteMemberDto } from "./dto";
import { isTeamFormat, requiredTeamSize } from "./teams.util";

const teamInclude = Prisma.validator<Prisma.TeamInclude>()({
  captain: { select: { id: true, fullName: true, elo: true } },
  members: {
    where: { status: { not: TeamMemberStatus.REMOVED } },
    include: {
      player: { select: { id: true, fullName: true, elo: true, mmr: true } }
    },
    orderBy: { invitedAt: "asc" }
  }
});

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createTeam(actor: RequestUser, dto: CreateTeamDto) {
    const captain = await this.resolvePlayer(actor);
    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException("Team name is required.");
    }
    if (!isTeamFormat(dto.eventFormat)) {
      throw new BadRequestException("Team event format must be TEAM, TEAM_2X2 or TEAM_3X3.");
    }

    const team = await this.prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name,
          eventFormat: dto.eventFormat,
          captainId: captain.id
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: created.id,
          playerId: captain.id,
          role: TeamMemberRole.CAPTAIN,
          status: TeamMemberStatus.ACTIVE,
          joinedAt: new Date()
        }
      });

      return created;
    });

    await this.auditService.log({
      actor,
      action: "team.create",
      entityType: "team",
      entityId: team.id,
      metadata: { name, eventFormat: dto.eventFormat }
    });

    return this.getTeam(team.id);
  }

  async listMine(actor: RequestUser) {
    const player = await this.resolvePlayer(actor);
    const teams = await this.prisma.team.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            playerId: player.id,
            status: { in: [TeamMemberStatus.ACTIVE, TeamMemberStatus.INVITED] }
          }
        }
      },
      include: teamInclude,
      orderBy: { createdAt: "desc" }
    });

    return teams.map((team) => this.serialize(team, player.id));
  }

  async getTeam(teamId: string, viewerPlayerId?: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      include: teamInclude
    });

    if (!team) {
      throw new NotFoundException("Team not found.");
    }

    return this.serialize(team, viewerPlayerId);
  }

  async invite(actor: RequestUser, teamId: string, dto: InviteTeamMemberDto) {
    const captain = await this.resolvePlayer(actor);
    const team = await this.loadManageableTeam(teamId, captain.id);

    if (dto.playerId === captain.id) {
      throw new BadRequestException("Captain is already on the team.");
    }

    const target = await this.prisma.player.findUnique({ where: { id: dto.playerId }, select: { id: true } });
    if (!target) {
      throw new NotFoundException("Player to invite not found.");
    }

    const activeCount = team.members.filter((member) => member.status === TeamMemberStatus.ACTIVE).length;
    const pendingCount = team.members.filter((member) => member.status === TeamMemberStatus.INVITED).length;
    if (activeCount + pendingCount >= requiredTeamSize(team.eventFormat)) {
      throw new ConflictException("Team roster is already full.");
    }

    const existing = team.members.find((member) => member.playerId === dto.playerId);
    if (existing && existing.status !== TeamMemberStatus.REMOVED && existing.status !== TeamMemberStatus.DECLINED) {
      throw new ConflictException("Player already invited or on the team.");
    }

    await this.prisma.teamMember.upsert({
      where: { teamId_playerId: { teamId, playerId: dto.playerId } },
      update: { status: TeamMemberStatus.INVITED, role: TeamMemberRole.MEMBER, invitedAt: new Date(), joinedAt: null },
      create: { teamId, playerId: dto.playerId, role: TeamMemberRole.MEMBER, status: TeamMemberStatus.INVITED }
    });

    await this.auditService.log({
      actor,
      action: "team.invite",
      entityType: "team",
      entityId: teamId,
      metadata: { playerId: dto.playerId }
    });

    return this.getTeam(teamId, captain.id);
  }

  async respondToInvite(actor: RequestUser, teamId: string, dto: RespondInviteDto) {
    const player = await this.resolvePlayer(actor);
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      include: teamInclude
    });
    if (!team) {
      throw new NotFoundException("Team not found.");
    }

    const membership = team.members.find((member) => member.playerId === player.id);
    if (!membership || membership.status !== TeamMemberStatus.INVITED) {
      throw new NotFoundException("No pending invitation for this team.");
    }

    if (!dto.accept) {
      await this.prisma.teamMember.update({
        where: { teamId_playerId: { teamId, playerId: player.id } },
        data: { status: TeamMemberStatus.DECLINED }
      });
      return this.getTeam(teamId, player.id);
    }

    const activeCount = team.members.filter((member) => member.status === TeamMemberStatus.ACTIVE).length;
    if (activeCount >= requiredTeamSize(team.eventFormat)) {
      throw new ConflictException("Team roster is already full.");
    }

    await this.prisma.teamMember.update({
      where: { teamId_playerId: { teamId, playerId: player.id } },
      data: { status: TeamMemberStatus.ACTIVE, joinedAt: new Date() }
    });

    await this.auditService.log({
      actor,
      action: "team.invite.accept",
      entityType: "team",
      entityId: teamId,
      metadata: { playerId: player.id }
    });

    return this.getTeam(teamId, player.id);
  }

  async substitute(actor: RequestUser, teamId: string, dto: SubstituteMemberDto) {
    const captain = await this.resolvePlayer(actor);
    const team = await this.loadManageableTeam(teamId, captain.id);
    await this.assertTeamNotLocked(teamId);

    if (dto.outPlayerId === team.captainId) {
      throw new BadRequestException("Captain cannot be substituted out.");
    }

    const outMember = team.members.find(
      (member) => member.playerId === dto.outPlayerId && member.status === TeamMemberStatus.ACTIVE
    );
    if (!outMember) {
      throw new NotFoundException("Active member to substitute not found.");
    }

    const incoming = await this.prisma.player.findUnique({ where: { id: dto.inPlayerId }, select: { id: true } });
    if (!incoming) {
      throw new NotFoundException("Incoming player not found.");
    }

    const incomingExisting = team.members.find(
      (member) => member.playerId === dto.inPlayerId && member.status === TeamMemberStatus.ACTIVE
    );
    if (incomingExisting) {
      throw new ConflictException("Incoming player is already an active member.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { teamId_playerId: { teamId, playerId: dto.outPlayerId } },
        data: { status: TeamMemberStatus.REMOVED }
      });
      await tx.teamMember.upsert({
        where: { teamId_playerId: { teamId, playerId: dto.inPlayerId } },
        update: { status: TeamMemberStatus.ACTIVE, role: TeamMemberRole.MEMBER, joinedAt: new Date() },
        create: {
          teamId,
          playerId: dto.inPlayerId,
          role: TeamMemberRole.MEMBER,
          status: TeamMemberStatus.ACTIVE,
          joinedAt: new Date()
        }
      });
    });

    await this.auditService.log({
      actor,
      action: "team.substitute",
      entityType: "team",
      entityId: teamId,
      metadata: { out: dto.outPlayerId, in: dto.inPlayerId }
    });

    return this.getTeam(teamId, captain.id);
  }

  async removeMember(actor: RequestUser, teamId: string, playerId: string) {
    const captain = await this.resolvePlayer(actor);
    const team = await this.loadManageableTeam(teamId, captain.id);
    await this.assertTeamNotLocked(teamId);

    if (playerId === team.captainId) {
      throw new BadRequestException("Captain cannot be removed. Disband the team instead.");
    }

    const member = team.members.find((item) => item.playerId === playerId && item.status !== TeamMemberStatus.REMOVED);
    if (!member) {
      throw new NotFoundException("Member not found.");
    }

    await this.prisma.teamMember.update({
      where: { teamId_playerId: { teamId, playerId } },
      data: { status: TeamMemberStatus.REMOVED }
    });

    await this.auditService.log({
      actor,
      action: "team.member.remove",
      entityType: "team",
      entityId: teamId,
      metadata: { playerId }
    });

    return this.getTeam(teamId, captain.id);
  }

  async disband(actor: RequestUser, teamId: string) {
    const captain = await this.resolvePlayer(actor);
    const team = await this.loadManageableTeam(teamId, captain.id);
    await this.assertTeamNotLocked(teamId);

    await this.prisma.team.update({ where: { id: team.id }, data: { deletedAt: new Date() } });

    await this.auditService.log({ actor, action: "team.disband", entityType: "team", entityId: teamId });

    return { id: teamId, disbanded: true };
  }

  private async resolvePlayer(actor: RequestUser) {
    const player = await this.prisma.player.findUnique({ where: { userId: actor.sub }, select: { id: true } });
    if (!player) {
      throw new NotFoundException("Player profile not found.");
    }
    return player;
  }

  private async loadManageableTeam(teamId: string, captainPlayerId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      include: teamInclude
    });
    if (!team) {
      throw new NotFoundException("Team not found.");
    }
    if (team.captainId !== captainPlayerId) {
      throw new ForbiddenException("Only the team captain can manage the roster.");
    }
    return team;
  }

  /** Roster changes are blocked once the team is locked into a tournament that has started. */
  private async assertTeamNotLocked(teamId: string) {
    const lockedParticipant = await this.prisma.bracketParticipant.findFirst({
      where: {
        teamId,
        tournament: { status: { in: [TournamentStatus.LIVE, TournamentStatus.FINISHED] } }
      },
      select: { id: true }
    });

    if (lockedParticipant) {
      throw new ConflictException("Roster is locked: the team is in a tournament that has already started.");
    }
  }

  private serialize(
    team: Prisma.TeamGetPayload<{ include: typeof teamInclude }>,
    viewerPlayerId?: string
  ) {
    const activeMembers = team.members.filter((member) => member.status === TeamMemberStatus.ACTIVE);
    const pendingMembers = team.members.filter((member) => member.status === TeamMemberStatus.INVITED);
    const required = requiredTeamSize(team.eventFormat);

    return {
      id: team.id,
      name: team.name,
      eventFormat: team.eventFormat,
      captainId: team.captainId,
      captain: team.captain,
      requiredSize: required,
      isComplete: activeMembers.length === required,
      isCaptain: viewerPlayerId ? team.captainId === viewerPlayerId : false,
      members: team.members.map((member) => ({
        playerId: member.playerId,
        fullName: member.player?.fullName ?? null,
        elo: member.player?.elo ?? null,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt
      })),
      activeMemberCount: activeMembers.length,
      pendingInviteCount: pendingMembers.length,
      createdAt: team.createdAt
    };
  }
}
