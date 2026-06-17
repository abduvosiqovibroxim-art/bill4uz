import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { BotInternalGuard } from "./bot.guard";
import { BotService } from "./bot.service";
import {
  ConsumeTelegramLinkDto,
  CreateTelegramGroupMatchDto,
  LinkExistingTelegramPlayerDto,
  RegisterTelegramPlayerDto,
  SetTelegramLanguageDto,
  TelegramGroupMatchActionDto,
  TelegramGroupMatchPointDto,
  UpdateTelegramGroupMatchMessageDto
} from "./dto";

@Controller("bot")
export class BotController {
  constructor(private readonly botService: BotService) {}

  @UseGuards(JwtAccessGuard)
  @Get("link/status")
  getLinkStatus(@Req() request: { user: RequestUser }) {
    return this.botService.getLinkStatus(request.user.sub);
  }

  @UseGuards(JwtAccessGuard)
  @Post("link/request")
  createLinkRequest(@Req() request: { user: RequestUser }) {
    return this.botService.createLinkRequest(request.user.sub);
  }

  @UseGuards(JwtAccessGuard)
  @Delete("link")
  unlink(@Req() request: { user: RequestUser }) {
    return this.botService.unlink(request.user.sub);
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/link/consume")
  consumeLink(@Body() dto: ConsumeTelegramLinkDto) {
    return this.botService.consumeLink(dto);
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/session/:telegramId")
  getLinkedSession(@Param("telegramId") telegramId: string) {
    return this.botService.getLinkedSession(telegramId);
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/language")
  setLanguage(@Body() dto: SetTelegramLanguageDto) {
    return this.botService.setLanguage(dto);
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/register/player")
  registerPlayer(@Body() dto: RegisterTelegramPlayerDto) {
    return this.botService.registerTelegramPlayer(dto);
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/register/link-existing")
  linkExistingPlayer(@Body() dto: LinkExistingTelegramPlayerDto) {
    return this.botService.linkExistingTelegramPlayer(dto);
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/tournaments/upcoming")
  getUpcomingTournaments() {
    return this.botService.getUpcomingTournaments();
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/tournaments/:tournamentId/join")
  joinTournament(@Param("tournamentId") tournamentId: string, @Body("telegramId") telegramId: string) {
    return this.botService.joinTournament(telegramId, tournamentId);
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/player/:telegramId/tournaments")
  getMyTournaments(@Param("telegramId") telegramId: string) {
    return this.botService.getMyTournaments(telegramId);
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/players/by-username/:username")
  findPlayerByTelegramUsername(@Param("username") username: string) {
    return this.botService.findPlayerByTelegramUsername(username);
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/notifications/sweep-reminders")
  sweepTelegramReminders() {
    return this.botService.sweepTelegramReminders();
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/notifications/pending")
  getPendingNotifications(@Query("limit", new ParseIntPipe({ optional: true })) limit = 50) {
    return this.botService.getPendingTelegramNotifications(limit);
  }

  @UseGuards(BotInternalGuard)
  @Patch("internal/notifications/:id/delivered")
  markDelivered(@Param("id") id: string) {
    return this.botService.markTelegramNotificationDelivered(id);
  }

  @UseGuards(BotInternalGuard)
  @Post("internal/group-matches")
  createGroupMatch(@Body() dto: CreateTelegramGroupMatchDto) {
    return this.botService.createGroupMatch(dto);
  }

  @UseGuards(BotInternalGuard)
  @Patch("internal/group-matches/:id/message")
  setGroupMatchMessage(@Param("id") id: string, @Body() dto: UpdateTelegramGroupMatchMessageDto) {
    return this.botService.setGroupMatchMessage(id, dto);
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/group-matches/active/:chatId")
  listActiveGroupMatches(@Param("chatId") chatId: string) {
    return this.botService.listActiveGroupMatches(chatId);
  }

  @UseGuards(BotInternalGuard)
  @Get("internal/group-matches/mine/:telegramId")
  listMyGroupMatches(@Param("telegramId") telegramId: string) {
    return this.botService.listMyGroupMatches(telegramId);
  }

  @UseGuards(BotInternalGuard)
  @Patch("internal/group-matches/:id/point")
  addGroupMatchPoint(@Param("id") id: string, @Body() dto: TelegramGroupMatchPointDto) {
    return this.botService.addGroupMatchPoint(id, dto);
  }

  @UseGuards(BotInternalGuard)
  @Patch("internal/group-matches/:id/undo")
  undoGroupMatchPoint(@Param("id") id: string, @Body() dto: TelegramGroupMatchActionDto) {
    return this.botService.undoGroupMatchPoint(id, dto);
  }

  @UseGuards(BotInternalGuard)
  @Patch("internal/group-matches/:id/finish")
  finishGroupMatch(@Param("id") id: string, @Body() dto: TelegramGroupMatchActionDto) {
    return this.botService.finishGroupMatch(id, dto);
  }

  @UseGuards(BotInternalGuard)
  @Patch("internal/group-matches/:id/cancel")
  cancelGroupMatch(@Param("id") id: string, @Body() dto: TelegramGroupMatchActionDto) {
    return this.botService.cancelGroupMatch(id, dto);
  }
}
