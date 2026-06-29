import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { SessionsService } from "./sessions.service";
import { AddOrderItemDto, CloseSessionDto, StartSessionDto } from "./dto";

@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.CLUB, Role.ADMIN)
@Controller("clubs/:clubId")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get("sessions/active")
  listActive(@Param("clubId") clubId: string, @Req() request: { user: RequestUser }) {
    return this.sessionsService.listActive(clubId, request.user);
  }

  @Post("tables/:tableId/session")
  start(
    @Param("clubId") clubId: string,
    @Param("tableId") tableId: string,
    @Body() dto: StartSessionDto,
    @Req() request: { user: RequestUser }
  ) {
    return this.sessionsService.startSession(clubId, tableId, dto, request.user);
  }

  @Post("sessions/:sessionId/order-items")
  addOrderItem(
    @Param("clubId") clubId: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: AddOrderItemDto,
    @Req() request: { user: RequestUser }
  ) {
    return this.sessionsService.addOrderItem(clubId, sessionId, dto, request.user);
  }

  @Post("sessions/:sessionId/close")
  close(
    @Param("clubId") clubId: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: CloseSessionDto,
    @Req() request: { user: RequestUser }
  ) {
    return this.sessionsService.closeSession(clubId, sessionId, dto, request.user);
  }
}
