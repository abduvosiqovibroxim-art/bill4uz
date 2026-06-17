import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { BookingStatus, ClubTableStatus, Prisma, Role } from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../platform/audit.service";
import {
  BookingSlotsQueryDto,
  CreateBookingDto,
  CreateClubTableDto,
  UpdateBookingStatusDto,
  UpdateClubTableDto
} from "./dto";
import { calculateBookingPrice, normalizeTableKind, resolveClubPricingConfig, tableKindLabel, type ClubPricingConfig } from "./pricing";

const clubTableSelect = Prisma.validator<Prisma.ClubTableSelect>()({
  id: true,
  clubId: true,
  name: true,
  kind: true,
  status: true,
  sortOrder: true,
  minBookingMinutes: true,
  maxBookingMinutes: true,
  createdAt: true,
  updatedAt: true
});

const bookingInclude = Prisma.validator<Prisma.BookingInclude>()({
  club: {
    include: {
      city: true,
      country: true
    }
  },
  table: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      role: true
    }
  },
  player: {
    select: {
      id: true,
      fullName: true
    }
  }
});

type BookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

const activeBookingStatuses: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING];
const closedBookingStatuses: BookingStatus[] = [BookingStatus.FINISHED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW];
const manualBookingStatuses: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.FINISHED];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService
  ) {}

  async listClubTables(clubId: string) {
    await this.ensureClubExists(clubId);

    return this.prisma.clubTable.findMany({
      where: {
        clubId,
        deletedAt: null
      },
      select: clubTableSelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
  }

  async createClubTable(clubId: string, dto: CreateClubTableDto, actor: RequestUser) {
    const club = await this.requireManageableClub(clubId, actor);
    const created = await this.prisma.$transaction(async (tx) => {
      const table = await tx.clubTable.create({
        data: {
          clubId,
          name: dto.name.trim(),
          kind: normalizeTableKind(dto.kind),
          status: dto.status ?? ClubTableStatus.ACTIVE,
          sortOrder: dto.sortOrder ?? (await nextSortOrder(tx, clubId)),
          minBookingMinutes: dto.minBookingMinutes ?? 60,
          maxBookingMinutes: dto.maxBookingMinutes ?? 240
        },
        select: clubTableSelect
      });

      await syncClubTableCount(tx, clubId);
      return table;
    });

    await this.auditService.log({
      actor,
      action: "club-table.create",
      entityType: "clubTable",
      entityId: created.id,
      metadata: {
        clubId,
        name: created.name
      }
    });

    return created;
  }

  async updateClubTable(clubId: string, tableId: string, dto: UpdateClubTableDto, actor: RequestUser) {
    await this.requireManageableClub(clubId, actor);
    const table = await this.prisma.clubTable.findFirst({
      where: {
        id: tableId,
        clubId,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    if (!table) {
      throw new NotFoundException("Table not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.status && dto.status !== ClubTableStatus.ACTIVE) {
        const conflictingBookings = await tx.booking.count({
          where: {
            tableId,
            status: { in: activeBookingStatuses },
            endAt: {
              gt: new Date()
            }
          }
        });

        if (conflictingBookings > 0) {
          throw new ConflictException("Cannot disable a table with active bookings.");
        }
      }

      const next = await tx.clubTable.update({
        where: { id: tableId },
        data: {
          name: dto.name?.trim(),
          kind: dto.kind ? normalizeTableKind(dto.kind) : undefined,
          status: dto.status,
          sortOrder: dto.sortOrder,
          minBookingMinutes: dto.minBookingMinutes,
          maxBookingMinutes: dto.maxBookingMinutes
        },
        select: clubTableSelect
      });

      await syncClubTableCount(tx, clubId);
      return next;
    });

    await this.auditService.log({
      actor,
      action: "club-table.update",
      entityType: "clubTable",
      entityId: updated.id,
      metadata: {
        clubId,
        changedFields: Object.keys(dto)
      }
    });

    return updated;
  }

  async getBookingSlots(clubId: string, query: BookingSlotsQueryDto) {
    const club = await this.prisma.club.findFirst({
      where: {
        id: clubId,
        deletedAt: null
      },
      include: {
        tableItems: {
          where: {
            deletedAt: null,
            status: ClubTableStatus.ACTIVE
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        }
      }
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    this.assertClubBookingEnabled(club);

    const hours = parseWorkingHours(club.workingHours);
    if (!hours) {
      return [];
    }

    const pricing = resolveClubPricingConfig(club);

    const durationMinutes = query.durationMinutes ?? 60;
    const dayStartIso = `${query.date}T00:00:00+05:00`;
    const dayEndIso = `${query.date}T23:59:59+05:00`;
    const bookings = await this.prisma.booking.findMany({
      where: {
        clubId,
        tableId: {
          in: club.tableItems.map((item) => item.id)
        },
        status: { in: activeBookingStatuses },
        startAt: {
          lt: new Date(dayEndIso)
        },
        endAt: {
          gt: new Date(dayStartIso)
        }
      },
      select: {
        tableId: true,
        startAt: true,
        endAt: true
      }
    });

    return club.tableItems.map((table) => {
      const tableKind = normalizeTableKind(table.kind);
      return {
        tableId: table.id,
        tableNumber: table.sortOrder,
        tableName: table.name,
        kind: tableKind,
        kindLabel: tableKindLabel(tableKind),
        slots: buildSlots(query.date, hours.startMinutes, hours.endMinutes, durationMinutes)
          .filter((slot) =>
            !bookings.some(
              (booking) =>
                booking.tableId === table.id &&
                booking.startAt.getTime() < slot.endAt.getTime() &&
                booking.endAt.getTime() > slot.startAt.getTime()
            )
          )
          .filter((slot) => durationMinutes >= table.minBookingMinutes && durationMinutes <= table.maxBookingMinutes)
          .map((slot) => quoteSlot(tableKind, slot.startAt, slot.endAt, pricing))
          .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot))
      };
    });
  }

  async listMine(actor: RequestUser) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId: actor.sub
      },
      include: bookingInclude,
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }]
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async listAll(actor: RequestUser) {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException("Forbidden");
    }

    const bookings = await this.prisma.booking.findMany({
      include: bookingInclude,
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }]
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async createBooking(actor: RequestUser, dto: CreateBookingDto) {
    const club = await this.prisma.club.findFirst({
      where: {
        id: dto.clubId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        onboardingCompletedAt: true,
        workingHours: true,
        regularMorningPriceMinor: true,
        regularEveningPriceMinor: true,
        vipMorningPriceMinor: true,
        vipEveningPriceMinor: true,
        userId: true,
        tables: true
      }
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    this.assertClubBookingEnabled(club);

    if (!dto.tableId && typeof dto.tableNumber !== "number") {
      throw new BadRequestException("Either tableId or tableNumber is required.");
    }

    if (typeof dto.tableNumber === "number" && typeof club.tables === "number" && dto.tableNumber > club.tables) {
      throw new BadRequestException("Selected table number does not exist in this club.");
    }

    const table = await this.prisma.clubTable.findFirst({
      where: {
        clubId: dto.clubId,
        deletedAt: null,
        ...(dto.tableId ? { id: dto.tableId } : { sortOrder: dto.tableNumber })
      },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        status: true,
        kind: true,
        minBookingMinutes: true,
        maxBookingMinutes: true
      }
    });

    if (!table) {
      throw new NotFoundException("Table not found");
    }

    if (table.status !== ClubTableStatus.ACTIVE) {
      throw new ConflictException("Club is not configured yet.");
    }

    const { startAt, endAt, durationMinutes } = resolveBookingWindow(dto);

    if (durationMinutes < table.minBookingMinutes || durationMinutes > table.maxBookingMinutes) {
      throw new BadRequestException("Selected duration is not allowed for this table.");
    }

    if (startAt.getTime() <= Date.now()) {
      throw new BadRequestException("Booking start time must be in the future.");
    }

    const hours = parseWorkingHours(club.workingHours);
    if (!hours) {
      throw new ConflictException("Club is not configured yet.");
    }

    const { startMinutes, endMinutes } = getWindowMinutesInTashkent(startAt, endAt, hours.endMinutes > 24 * 60);
    if (startMinutes < hours.startMinutes || endMinutes > hours.endMinutes || endMinutes <= startMinutes) {
      throw new BadRequestException("Selected time is outside club booking hours.");
    }

    const pricing = resolveClubPricingConfig(club);
    const priceQuote = calculateBookingPrice(table.kind, startAt, endAt, pricing);

    const player = await this.prisma.player.findUnique({
      where: { userId: actor.sub },
      select: {
        id: true
      }
    });

    const booking = await this.prisma.$transaction(async (tx) => {
      if (dto.clientRequestId) {
        const existing = await tx.booking.findUnique({
          where: {
            userId_clientRequestId: {
              userId: actor.sub,
              clientRequestId: dto.clientRequestId
            }
          },
          include: bookingInclude
        });

        if (existing) {
          return existing;
        }
      }

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          tableId: table.id,
          status: { in: activeBookingStatuses },
          startTime: { lt: endAt },
          endTime: { gt: startAt }
        },
        select: {
          id: true
        }
      });

      if (conflictingBooking) {
        throw new ConflictException("Все заняты");
      }

      return tx.booking.create({
        data: {
          clubId: club.id,
          tableId: table.id,
          tableNumber: table.sortOrder,
          userId: actor.sub,
          playerId: player?.id ?? null,
          status: BookingStatus.CONFIRMED,
          startTime: startAt,
          endTime: endAt,
          startAt,
          endAt,
          durationMinutes,
          priceMinor: priceQuote.priceMinor,
          note: dto.note?.trim() || null,
          contactPhone: await this.resolveContactPhone(actor.sub),
          clientRequestId: dto.clientRequestId ?? null,
          confirmedAt: new Date()
        },
        include: bookingInclude
      });
    });

    await this.notificationsService.notifyBookingCreated(booking.id);
    await this.auditService.log({
      actor,
      action: "booking.create",
      entityType: "booking",
      entityId: booking.id,
      metadata: {
        clubId: club.id,
        tableId: table.id,
        startAt: booking.startAt,
        endAt: booking.endAt,
        status: booking.status
      }
    });

    return this.serializeBooking(booking);
  }

  async cancelBooking(id: string, actor: RequestUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.userId !== actor.sub && !canManageClub(actor, booking.club.userId)) {
      throw new ForbiddenException("Forbidden");
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return this.serializeBooking(booking);
    }

    if (closedBookingStatuses.includes(booking.status)) {
      throw new ConflictException("Booking is already closed.");
    }

    if (booking.startAt.getTime() <= Date.now()) {
      throw new ConflictException("Booking can no longer be cancelled.");
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date()
      },
      include: bookingInclude
    });

    await this.notificationsService.notifyBookingStatus(updated.id);
    await this.auditService.log({
      actor,
      action: "booking.cancel",
      entityType: "booking",
      entityId: updated.id,
      metadata: {
        byClubManager: booking.userId !== actor.sub
      }
    });

    return this.serializeBooking(updated);
  }

  async listClubBookings(clubId: string, actor: RequestUser) {
    await this.requireManageableClub(clubId, actor);
    const bookings = await this.prisma.booking.findMany({
      where: {
        clubId
      },
      include: bookingInclude,
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }]
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async updateBookingStatus(id: string, dto: UpdateBookingStatusDto, actor: RequestUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (!canManageClub(actor, booking.club.userId)) {
      throw new ForbiddenException("Forbidden");
    }

    if (booking.status === dto.status) {
      return this.serializeBooking(booking);
    }

    if (!manualBookingStatuses.includes(dto.status)) {
      throw new BadRequestException("Unsupported booking status.");
    }

    if (booking.status === BookingStatus.CANCELLED || closedBookingStatuses.includes(booking.status)) {
      throw new ConflictException("Booking is already closed.");
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status,
        confirmedAt: dto.status === BookingStatus.CONFIRMED ? new Date() : booking.confirmedAt,
        cancelledAt: dto.status === BookingStatus.CANCELLED ? new Date() : booking.cancelledAt,
        completedAt: dto.status === BookingStatus.FINISHED ? new Date() : booking.completedAt
      },
      include: bookingInclude
    });

    await this.notificationsService.notifyBookingStatus(updated.id);
    await this.auditService.log({
      actor,
      action: "booking.update-status",
      entityType: "booking",
      entityId: updated.id,
      metadata: {
        nextStatus: updated.status
      }
    });

    return this.serializeBooking(updated);
  }

  private async ensureClubExists(clubId: string) {
    const club = await this.prisma.club.findFirst({
      where: {
        id: clubId,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    return club;
  }

  private async requireManageableClub(clubId: string, actor: RequestUser) {
    const club = await this.prisma.club.findFirst({
      where: {
        id: clubId,
        deletedAt: null
      },
      select: {
        id: true,
        userId: true
      }
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    if (!canManageClub(actor, club.userId)) {
      throw new ForbiddenException("Forbidden");
    }

    return club;
  }

  private async resolveContactPhone(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true
      }
    });

    return user?.phone ?? null;
  }

  private serializeBooking(booking: BookingRecord) {
    const pricing = (() => {
      if (booking.priceMinor === null) {
        return null;
      }

      try {
        return resolveClubPricingConfig({
          regularMorningPriceMinor: booking.club.regularMorningPriceMinor,
          regularEveningPriceMinor: booking.club.regularEveningPriceMinor,
          vipMorningPriceMinor: booking.club.vipMorningPriceMinor,
          vipEveningPriceMinor: booking.club.vipEveningPriceMinor
        });
      } catch {
        return null;
      }
    })();

    return {
      id: booking.id,
      status: booking.status,
      tableNumber: booking.tableNumber,
      startTime: booking.startTime,
      endTime: booking.endTime,
      startAt: booking.startAt,
      endAt: booking.endAt,
      durationMinutes: booking.durationMinutes,
      priceMinor: booking.priceMinor,
      pricing: booking.priceMinor === null || !pricing
        ? null
        : calculateBookingPrice(booking.table.kind, booking.startAt, booking.endAt, pricing),
      note: booking.note,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      completedAt: booking.completedAt,
      noShowAt: booking.noShowAt,
      club: {
        id: booking.club.id,
        name: booking.club.name,
        address: booking.club.address,
        city: booking.club.city?.name ?? null,
        latitude: booking.club.latitude ?? booking.club.lat,
        longitude: booking.club.longitude ?? booking.club.lng,
        phone: booking.club.phone ?? null,
        telegram: booking.club.telegram ?? null
      },
      table: {
        id: booking.table.id,
        name: booking.table.name,
        tableNumber: booking.tableNumber,
        kind: normalizeTableKind(booking.table.kind),
        kindLabel: tableKindLabel(booking.table.kind)
      },
      user: booking.user,
      player: booking.player
    };
  }

  private assertClubBookingEnabled(club: { onboardingCompletedAt: Date | null }) {
    if (!club.onboardingCompletedAt) {
      throw new ConflictException("Club is not configured yet.");
    }
  }
}

function canManageClub(actor: RequestUser, clubUserId?: string | null) {
  if (actor.role === Role.ADMIN) {
    return true;
  }

  return actor.role === Role.CLUB && Boolean(clubUserId) && clubUserId === actor.sub;
}

async function syncClubTableCount(tx: Prisma.TransactionClient, clubId: string) {
  const count = await tx.clubTable.count({
    where: {
      clubId,
      deletedAt: null
    }
  });

  await tx.club.update({
    where: { id: clubId },
    data: {
      tables: count
    }
  });
}

async function nextSortOrder(tx: Prisma.TransactionClient, clubId: string) {
  const table = await tx.clubTable.findFirst({
    where: {
      clubId,
      deletedAt: null
    },
    orderBy: {
      sortOrder: "desc"
    },
    select: {
      sortOrder: true
    }
  });

  return (table?.sortOrder ?? 0) + 1;
}

function parseWorkingHours(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const match = value.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  let endMinutes = Number(match[3]) * 60 + Number(match[4]);
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return { startMinutes, endMinutes };
}

function quoteSlot(kind: string, startAt: Date, endAt: Date, pricing: ClubPricingConfig) {
  try {
    const quote = calculateBookingPrice(kind, startAt, endAt, pricing);
    return {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      priceMinor: quote.priceMinor,
      pricePerHourMinor: quote.hourlyRateMinor,
      hourlyRateMinor: quote.hourlyRateMinor,
      pricingSegments: quote.segments
    };
  } catch {
    return null;
  }
}

function buildSlots(date: string, startMinutes: number, endMinutes: number, durationMinutes: number) {
  const slots: Array<{ startAt: Date; endAt: Date }> = [];

  for (let current = startMinutes; current + durationMinutes <= endMinutes; current += 60) {
    const startAt = buildTashkentDate(date, current);
    const endAt = buildTashkentDate(date, current + durationMinutes);
    if (startAt.getTime() > Date.now()) {
      slots.push({ startAt, endAt });
    }
  }

  return slots;
}

function buildTashkentDate(date: string, totalMinutes: number) {
  const dayOffset = Math.floor(totalMinutes / (24 * 60));
  const minutesInDay = totalMinutes % (24 * 60);
  const hours = String(Math.floor(minutesInDay / 60)).padStart(2, "0");
  const minutes = String(minutesInDay % 60).padStart(2, "0");
  const base = new Date(`${date}T${hours}:${minutes}:00+05:00`);
  return new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

function resolveBookingWindow(dto: CreateBookingDto) {
  const startValue = dto.startTime ?? dto.startAt;
  if (!startValue) {
    throw new BadRequestException("Booking startTime is required.");
  }

  const startAt = new Date(startValue);
  if (!Number.isFinite(startAt.getTime())) {
    throw new BadRequestException("Invalid booking startTime.");
  }

  if (dto.endTime) {
    const endAt = new Date(dto.endTime);
    if (!Number.isFinite(endAt.getTime())) {
      throw new BadRequestException("Invalid booking endTime.");
    }

    const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);
    if (durationMinutes < 60) {
      throw new BadRequestException("Booking endTime must be after startTime.");
    }

    return { startAt, endAt, durationMinutes };
  }

  if (!dto.durationMinutes) {
    throw new BadRequestException("Either endTime or durationMinutes is required.");
  }

  const endAt = new Date(startAt.getTime() + dto.durationMinutes * 60_000);
  if (!Number.isFinite(endAt.getTime())) {
    throw new BadRequestException("Invalid booking endTime.");
  }

  return { startAt, endAt, durationMinutes: dto.durationMinutes };
}

function getMinutesInTashkent(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function getWindowMinutesInTashkent(startAt: Date, endAt: Date, overnight: boolean) {
  let startMinutes = getMinutesInTashkent(startAt);
  let endMinutes = getMinutesInTashkent(endAt);

  if (overnight) {
    if (startMinutes < 10 * 60) {
      startMinutes += 24 * 60;
    }

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
  }

  return { startMinutes, endMinutes };
}
