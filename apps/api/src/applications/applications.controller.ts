import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto, ModerateApplicationDto } from "./dto";

@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query("tournamentId") tournamentId?: string, @Query("status") status?: string) {
    return this.applicationsService.findAll({ tournamentId, status });
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post()
  @Roles(Role.PLAYER)
  @RateLimit({ bucket: "applications-create", limit: 10, windowMs: 60_000 })
  apply(@Req() request: { user: RequestUser }, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(request.user, dto.tournamentId);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get("tournament/:id/mine")
  @Roles(Role.PLAYER)
  mine(@Param("id") tournamentId: string, @Req() request: { user: RequestUser }) {
    return this.applicationsService.mine(tournamentId, request.user);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get("tournament/:id")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  byTournament(@Param("id") tournamentId: string, @Req() request: { user: RequestUser }) {
    return this.applicationsService.forTournament(tournamentId, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch(":id/moderate")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "applications-moderate", limit: 20, windowMs: 60_000 })
  moderate(@Param("id") id: string, @Req() request: { user: RequestUser }, @Body() dto: ModerateApplicationDto) {
    return this.applicationsService.moderate(id, dto.status, request.user);
  }
}
