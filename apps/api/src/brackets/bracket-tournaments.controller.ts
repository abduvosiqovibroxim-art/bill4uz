import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import {
  AddBracketParticipantsDto,
  AddTeamParticipantsDto,
  BracketTournamentParticipantParamDto,
  BracketTournamentIdParamDto,
  ManualDrawDto
} from "./dto";
import { sendBracketSuccess } from "./bracket.response";
import { BracketTournamentsService } from "./bracket-tournaments.service";

@Controller("tournaments")
export class BracketTournamentsController {
  constructor(private readonly bracketTournamentsService: BracketTournamentsService) {}

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post(":id/participants")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-participants-add", limit: 20, windowMs: 60_000 })
  async addParticipants(
    @Param() params: BracketTournamentIdParamDto,
    @Req() request: { user: RequestUser },
    @Body() dto: AddBracketParticipantsDto
  ) {
    const participants = await this.bracketTournamentsService.addParticipants(params.id, dto.participants, request.user);
    return sendBracketSuccess("Participants added successfully.", participants);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post(":id/team-participants")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-team-participants-add", limit: 20, windowMs: 60_000 })
  async addTeamParticipants(
    @Param() params: BracketTournamentIdParamDto,
    @Req() request: { user: RequestUser },
    @Body() dto: AddTeamParticipantsDto
  ) {
    const participants = await this.bracketTournamentsService.addTeamParticipants(params.id, dto.teamIds, request.user);
    return sendBracketSuccess("Team participants added successfully.", participants);
  }

  @Get(":id/participants")
  async listParticipants(@Param() params: BracketTournamentIdParamDto) {
    const participants = await this.bracketTournamentsService.listParticipants(params.id);
    return sendBracketSuccess("Participant list loaded.", participants);
  }

  @Get(":id/standings")
  async standings(@Param() params: BracketTournamentIdParamDto) {
    const standings = await this.bracketTournamentsService.getStandings(params.id);
    return sendBracketSuccess("Standings loaded.", standings);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Delete(":id/participants/:participantId")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-participants-remove", limit: 20, windowMs: 60_000 })
  async removeParticipant(
    @Param() params: BracketTournamentParticipantParamDto,
    @Req() request: { user: RequestUser }
  ) {
    const participants = await this.bracketTournamentsService.removeParticipant(params.id, params.participantId, request.user);
    return sendBracketSuccess("Participant removed successfully.", participants);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post(":id/generate-bracket")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-generate", limit: 5, windowMs: 60_000 })
  async generateBracket(
    @Param() params: BracketTournamentIdParamDto,
    @Req() request: { user: RequestUser }
  ) {
    const result = await this.bracketTournamentsService.generateBracket(params.id, request.user);
    return sendBracketSuccess("Bracket generated successfully.", result);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post(":id/manual-draw")
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @RateLimit({ bucket: "bracket-manual-draw", limit: 5, windowMs: 60_000 })
  async manualDraw(
    @Param() params: BracketTournamentIdParamDto,
    @Req() request: { user: RequestUser },
    @Body() dto: ManualDrawDto
  ) {
    const result = await this.bracketTournamentsService.manualDraw(params.id, dto.names, request.user);
    return sendBracketSuccess("Manual draw completed successfully.", result);
  }

  @Get(":id/bracket")
  async getBracket(@Param() params: BracketTournamentIdParamDto) {
    const bracket = await this.bracketTournamentsService.getBracket(params.id);
    return sendBracketSuccess("Bracket loaded.", bracket);
  }

  @Get(":id/matches")
  async listMatches(@Param() params: BracketTournamentIdParamDto) {
    const matches = await this.bracketTournamentsService.listMatches(params.id);
    return sendBracketSuccess("Tournament matches loaded.", matches);
  }

  @Get(":id/champion")
  async getChampion(@Param() params: BracketTournamentIdParamDto) {
    const champion = await this.bracketTournamentsService.getChampion(params.id);
    return sendBracketSuccess("Tournament champion loaded.", champion);
  }
}
