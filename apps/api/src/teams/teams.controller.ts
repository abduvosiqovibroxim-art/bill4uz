import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { CreateTeamDto, InviteTeamMemberDto, RespondInviteDto, SubstituteMemberDto } from "./dto";
import { TeamsService } from "./teams.service";

@Controller("teams")
@UseGuards(JwtAccessGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get("mine")
  @Roles(Role.PLAYER)
  mine(@Req() request: { user: RequestUser }) {
    return this.teamsService.listMine(request.user);
  }

  @Get(":id")
  @Roles(Role.PLAYER, Role.ORGANIZER, Role.ADMIN)
  getOne(@Param("id") id: string) {
    return this.teamsService.getTeam(id);
  }

  @UseGuards(RateLimitGuard)
  @Post()
  @Roles(Role.PLAYER)
  @RateLimit({ bucket: "teams-create", limit: 10, windowMs: 60_000 })
  create(@Req() request: { user: RequestUser }, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(request.user, dto);
  }

  @UseGuards(RateLimitGuard)
  @Post(":id/invite")
  @Roles(Role.PLAYER)
  @RateLimit({ bucket: "teams-invite", limit: 30, windowMs: 60_000 })
  invite(@Param("id") id: string, @Req() request: { user: RequestUser }, @Body() dto: InviteTeamMemberDto) {
    return this.teamsService.invite(request.user, id, dto);
  }

  @Post(":id/respond")
  @Roles(Role.PLAYER)
  respond(@Param("id") id: string, @Req() request: { user: RequestUser }, @Body() dto: RespondInviteDto) {
    return this.teamsService.respondToInvite(request.user, id, dto);
  }

  @UseGuards(RateLimitGuard)
  @Post(":id/substitute")
  @Roles(Role.PLAYER)
  @RateLimit({ bucket: "teams-substitute", limit: 20, windowMs: 60_000 })
  substitute(@Param("id") id: string, @Req() request: { user: RequestUser }, @Body() dto: SubstituteMemberDto) {
    return this.teamsService.substitute(request.user, id, dto);
  }

  @Delete(":id/members/:playerId")
  @Roles(Role.PLAYER)
  removeMember(@Param("id") id: string, @Param("playerId") playerId: string, @Req() request: { user: RequestUser }) {
    return this.teamsService.removeMember(request.user, id, playerId);
  }

  @Delete(":id")
  @Roles(Role.PLAYER)
  disband(@Param("id") id: string, @Req() request: { user: RequestUser }) {
    return this.teamsService.disband(request.user, id);
  }
}
