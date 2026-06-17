import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { BookingsService } from "./bookings.service";
import {
  BookingSlotsQueryDto,
  CreateBookingDto,
  CreateClubTableDto,
  UpdateBookingStatusDto,
  UpdateClubTableDto
} from "./dto";

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get("clubs/:id/tables")
  listClubTables(@Param("id") clubId: string) {
    return this.bookingsService.listClubTables(clubId);
  }

  @Get("clubs/:id/booking-slots")
  getBookingSlots(@Param("id") clubId: string, @Query() query: BookingSlotsQueryDto) {
    return this.bookingsService.getBookingSlots(clubId, query);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post("clubs/:id/tables")
  @Roles(Role.CLUB, Role.ADMIN)
  @RateLimit({ bucket: "club-tables-create", limit: 20, windowMs: 60_000 })
  createClubTable(@Param("id") clubId: string, @Body() dto: CreateClubTableDto, @Req() request: { user: RequestUser }) {
    return this.bookingsService.createClubTable(clubId, dto, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch("clubs/:id/tables/:tableId")
  @Roles(Role.CLUB, Role.ADMIN)
  @RateLimit({ bucket: "club-tables-update", limit: 30, windowMs: 60_000 })
  updateClubTable(
    @Param("id") clubId: string,
    @Param("tableId") tableId: string,
    @Body() dto: UpdateClubTableDto,
    @Req() request: { user: RequestUser }
  ) {
    return this.bookingsService.updateClubTable(clubId, tableId, dto, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Get("clubs/:id/bookings")
  @Roles(Role.CLUB, Role.ADMIN)
  listClubBookings(@Param("id") clubId: string, @Req() request: { user: RequestUser }) {
    return this.bookingsService.listClubBookings(clubId, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard)
  @Get("bookings/me")
  listMine(@Req() request: { user: RequestUser }) {
    return this.bookingsService.listMine(request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Get("bookings")
  @Roles(Role.ADMIN)
  listAll(@Req() request: { user: RequestUser }) {
    return this.bookingsService.listAll(request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard)
  @Post("bookings")
  @RateLimit({ bucket: "bookings-create", limit: 10, windowMs: 60_000 })
  createBooking(@Req() request: { user: RequestUser }, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(request.user, dto);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard)
  @Patch("bookings/:id/cancel")
  @RateLimit({ bucket: "bookings-cancel", limit: 10, windowMs: 60_000 })
  cancelBooking(@Param("id") id: string, @Req() request: { user: RequestUser }) {
    return this.bookingsService.cancelBooking(id, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch("bookings/:id/status")
  @Roles(Role.CLUB, Role.ADMIN)
  @RateLimit({ bucket: "bookings-status", limit: 20, windowMs: 60_000 })
  updateBookingStatus(
    @Param("id") id: string,
    @Body() dto: UpdateBookingStatusDto,
    @Req() request: { user: RequestUser }
  ) {
    return this.bookingsService.updateBookingStatus(id, dto, request.user);
  }
}
