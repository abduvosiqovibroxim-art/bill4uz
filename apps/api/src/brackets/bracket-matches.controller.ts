import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import {
  BracketMatchIdParamDto,
  UpdateBracketResultDto,
  UpdateBracketStatusDto
} from "./dto";
import { sendBracketSuccess } from "./bracket.response";
import { BracketMatchesService } from "./bracket-matches.service";

@Controller("matches")
export class BracketMatchesController {
  constructor(private readonly bracketMatchesService: BracketMatchesService) {}

  @Get(":id")
  async getMatchById(@Param() params: BracketMatchIdParamDto) {
    const match = await this.bracketMatchesService.getMatchById(params.id);
    return sendBracketSuccess("Match details loaded.", match);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch(":id/result")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-match-result", limit: 20, windowMs: 60_000 })
  async updateResult(
    @Param() params: BracketMatchIdParamDto,
    @Req() request: { user: RequestUser },
    @Body() dto: UpdateBracketResultDto
  ) {
    const match = await this.bracketMatchesService.updateMatchResult(params.id, dto, request.user);
    return sendBracketSuccess("Match result recorded successfully.", match);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch(":id/status")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-match-status", limit: 30, windowMs: 60_000 })
  async updateStatus(
    @Param() params: BracketMatchIdParamDto,
    @Req() request: { user: RequestUser },
    @Body() dto: UpdateBracketStatusDto
  ) {
    const match = await this.bracketMatchesService.updateMatchStatus(params.id, dto, request.user);
    return sendBracketSuccess("Match status updated successfully.", match);
  }
}
