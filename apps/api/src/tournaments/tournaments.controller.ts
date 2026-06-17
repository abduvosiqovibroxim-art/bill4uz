import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { TournamentsService } from "./tournaments.service";
import { CreateTournamentDto, UpdateTournamentDto } from "./dto";

@Controller("tournaments")
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  findAll(
    @Query("city") city?: string,
    @Query("status") status?: string,
    @Query("disciplineId") disciplineId?: string,
    @Query("discipline") discipline?: string
  ) {
    return this.tournamentsService.findAll({ city, status, disciplineId, discipline });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tournamentsService.findOne(id);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post()
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "tournaments-create", limit: 10, windowMs: 60_000 })
  create(@Req() request: { user: RequestUser }, @Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(dto, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch(":id")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "tournaments-update", limit: 20, windowMs: 60_000 })
  update(@Param("id") id: string, @Req() request: { user: RequestUser }, @Body() dto: UpdateTournamentDto) {
    return this.tournamentsService.update(id, dto, request.user);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(":id")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  remove(@Param("id") id: string, @Req() request: { user: RequestUser }) {
    return this.tournamentsService.remove(id, request.user);
  }
}
