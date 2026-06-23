import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { FileDisputeDto, ResolveDisputeDto } from "./dto";
import { DisputesService } from "./disputes.service";

@Controller()
@UseGuards(JwtAccessGuard, RolesGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @UseGuards(RateLimitGuard)
  @Post("matches/:id/dispute")
  @Roles(Role.PLAYER)
  @RateLimit({ bucket: "match-dispute-file", limit: 10, windowMs: 60_000 })
  file(@Param("id") matchId: string, @Req() request: { user: RequestUser }, @Body() dto: FileDisputeDto) {
    return this.disputesService.fileDispute(request.user, matchId, dto);
  }

  @Get("tournaments/:id/disputes")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  list(@Param("id") tournamentId: string, @Req() request: { user: RequestUser }) {
    return this.disputesService.listForTournament(request.user, tournamentId);
  }

  @UseGuards(RateLimitGuard)
  @Patch("disputes/:id/resolve")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "match-dispute-resolve", limit: 30, windowMs: 60_000 })
  resolve(@Param("id") disputeId: string, @Req() request: { user: RequestUser }, @Body() dto: ResolveDisputeDto) {
    return this.disputesService.resolve(request.user, disputeId, dto);
  }
}
