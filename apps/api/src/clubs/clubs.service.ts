import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { BookingStatus, Prisma, Role } from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { AuditService } from "../platform/audit.service";
import type { LocalizedTextDto } from "../tournaments/dto";
import { ClubComputedFields, CreateClubDto, UpdateClubDto } from "./dto";
import { buildClubTableBlueprints, clampVipTableCount, createClubTables } from "./table-inventory";

const clubListInclude = Prisma.validator<Prisma.ClubInclude>()({
  city: true,
  country: true,
  tournaments: {
    include: { discipline: true }
  },
  players: true,
  tableItems: {
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      kind: true,
      sortOrder: true
    }
  }
});

const clubDetailInclude = Prisma.validator<Prisma.ClubInclude>()({
  city: true,
  country: true,
  tournaments: {
    include: { discipline: true }
  },
  players: {
    include: {
      city: true,
      country: true
    }
  },
  tableItems: {
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      kind: true,
      sortOrder: true
    }
  },
  gallery: {
    orderBy: {
      order: 'asc'
    }
  }
});

type ClubListRecord = Prisma.ClubGetPayload<{ include: typeof clubListInclude }>;
type ClubDetailRecord = Prisma.ClubGetPayload<{ include: typeof clubDetailInclude }>;
type ClubResponse<T> = Omit<T, "description"> & ClubComputedFields & { description: string | LocalizedTextDto | null };

const cityKeyMap: Record<string, string> = {
  tashkent: "tashkent",
  samarkand: "samarkand",
  bukhara: "bukhara",
  andijan: "andijan",
  namangan: "namangan",
  fergana: "fergana",
  nukus: "nukus"
};

const countryKeyMap: Record<string, string> = {
  uz: "uzbekistan",
  uzbekistan: "uzbekistan"
};

@Injectable()
export class ClubsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async findAll(city?: string): Promise<Array<ClubResponse<ClubListRecord>>> {
    const clubs = await this.prisma.club.findMany({
      where: {
        deletedAt: null,
        onboardingCompletedAt: {
          not: null
        },
        ...(city ? { city: { is: { name: city } } } : {})
      },
      include: clubListInclude,
      orderBy: [
        { rating: { sort: "desc", nulls: "last" } },
        { reviewsCount: "desc" },
        { phone: { sort: "asc", nulls: "last" } },
        { name: "asc" }
      ]
    });

    return clubs.map((club) => this.serializeClub(club));
  }

  async findOne(id: string): Promise<ClubResponse<ClubDetailRecord> | null> {
    const club = await this.prisma.club.findFirst({
      where: {
        id,
        deletedAt: null,
        onboardingCompletedAt: {
          not: null
        }
      },
      include: {
        ...clubDetailInclude,
        tournaments: {
          ...clubDetailInclude.tournaments,
          orderBy: { startsAt: "desc" }
        },
        players: {
          ...clubDetailInclude.players,
          orderBy: { elo: "desc" }
        }
      }
    });

    if (!club) {
      return null;
    }

    return this.serializeClub(club);
  }

  async findMine(actor: RequestUser): Promise<ClubResponse<ClubDetailRecord> | null> {
    if (actor.role !== Role.CLUB) {
      throw new ForbiddenException("Forbidden");
    }

    const club = await this.prisma.club.findFirst({
      where: {
        userId: actor.sub,
        deletedAt: null
      },
      include: {
        ...clubDetailInclude,
        tournaments: {
          ...clubDetailInclude.tournaments,
          orderBy: { startsAt: "desc" }
        },
        players: {
          ...clubDetailInclude.players,
          orderBy: { elo: "desc" }
        }
      }
    });

    return club ? this.serializeClub(club) : null;
  }

  async create(dto: CreateClubDto, actor: RequestUser) {
    const userId = actor.role === Role.CLUB ? actor.sub : undefined;

    if (actor.role === Role.CLUB) {
      const existingClub = await this.prisma.club.findFirst({
        where: { userId: actor.sub, deletedAt: null },
        select: { id: true }
      });

      if (existingClub) {
        throw new ConflictException("Club user already has a club profile.");
      }
    }

    const city = await this.ensureLocation(dto.countryId, dto.cityId);
    const tableCount = Math.max(dto.tables ?? 0, 0);
    const vipTableCount = clampVipTableCount(tableCount, dto.vipTables ?? 0);
    const workingHours = resolveWorkingHoursInput(dto.openTime, dto.closeTime, dto.workingHours);
    const onboardingCompletedAt = isClubOnboardingComplete({
      tableCount,
      workingHours,
      regularMorningPriceMinor: dto.regularMorningPriceMinor ?? null,
      regularEveningPriceMinor: dto.regularEveningPriceMinor ?? null,
      vipMorningPriceMinor: dto.vipMorningPriceMinor ?? null,
      vipEveningPriceMinor: dto.vipEveningPriceMinor ?? null
    })
      ? new Date()
      : null;

    const created = await this.prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          userId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          countryId: city.countryId,
          cityId: city.id,
          address: dto.address.trim(),
          region: dto.region?.trim() || null,
          district: dto.district?.trim() || null,
          phone: dto.phone.trim(),
          telegram: dto.telegram.trim(),
          workingHours,
          tables: tableCount,
          disciplines: normalizeStringList(dto.disciplines),
          services: normalizeStringList(dto.services ?? []),
          coverUrl: dto.coverUrl?.trim() || null,
          regularMorningPriceMinor: dto.regularMorningPriceMinor ?? null,
          regularEveningPriceMinor: dto.regularEveningPriceMinor ?? null,
          vipMorningPriceMinor: dto.vipMorningPriceMinor ?? null,
          vipEveningPriceMinor: dto.vipEveningPriceMinor ?? null,
          onboardingCompletedAt,
          latitude: dto.latitude ?? dto.lat ?? null,
          longitude: dto.longitude ?? dto.lng ?? null,
          lat: dto.lat ?? null,
          lng: dto.lng ?? null
        }
      });

      if (tableCount > 0) {
        await tx.clubTable.createMany({
          data: createClubTables(club.id, tableCount, vipTableCount)
        });
      }

      return club;
    });

    await this.auditService.log({
      actor,
      action: "club.create",
      entityType: "club",
      entityId: created.id,
      metadata: {
        name: created.name,
        cityId: created.cityId,
        tables: created.tables,
        onboardingCompletedAt: created.onboardingCompletedAt
      }
    });

    return created;
  }

  async update(id: string, dto: UpdateClubDto, actor: RequestUser) {
    const club = await this.prisma.club.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        tableItems: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            kind: true,
            sortOrder: true
          }
        }
      }
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    this.assertCanManageClub(actor, club.userId);

    const cityId = dto.cityId ?? club.cityId;
    const countryId = dto.countryId ?? club.countryId;
    const city = await this.ensureLocation(countryId, cityId);
    const nextTableCount = Math.max(typeof dto.tables === "number" ? dto.tables : club.tables, 0);
    const currentVipTableCount = club.tableItems.filter((item) => normalizeTableKind(item.kind) === "VIP").length;
    const nextVipTableCount = clampVipTableCount(nextTableCount, typeof dto.vipTables === "number" ? dto.vipTables : currentVipTableCount);
    const workingHours = resolveWorkingHoursInput(dto.openTime, dto.closeTime, dto.workingHours ?? club.workingHours ?? undefined);

    const nextRegularMorningPriceMinor = dto.regularMorningPriceMinor ?? club.regularMorningPriceMinor;
    const nextRegularEveningPriceMinor = dto.regularEveningPriceMinor ?? club.regularEveningPriceMinor;
    const nextVipMorningPriceMinor = dto.vipMorningPriceMinor ?? club.vipMorningPriceMinor;
    const nextVipEveningPriceMinor = dto.vipEveningPriceMinor ?? club.vipEveningPriceMinor;
    const nextOnboardingCompletedAt = isClubOnboardingComplete({
      tableCount: nextTableCount,
      workingHours,
      regularMorningPriceMinor: nextRegularMorningPriceMinor,
      regularEveningPriceMinor: nextRegularEveningPriceMinor,
      vipMorningPriceMinor: nextVipMorningPriceMinor,
      vipEveningPriceMinor: nextVipEveningPriceMinor
    })
      ? club.onboardingCompletedAt ?? new Date()
      : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (typeof dto.tables === "number" || typeof dto.vipTables === "number") {
        await this.syncTableInventory(tx, club.id, nextTableCount, nextVipTableCount);
      }

      return tx.club.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description !== undefined ? dto.description.trim() || null : undefined,
          countryId: city.countryId,
          cityId: city.id,
          address: dto.address?.trim(),
          region: dto.region !== undefined ? dto.region.trim() || null : undefined,
          district: dto.district !== undefined ? dto.district.trim() || null : undefined,
          phone: dto.phone?.trim(),
          telegram: dto.telegram?.trim(),
          workingHours,
          tables: nextTableCount,
          disciplines: dto.disciplines ? normalizeStringList(dto.disciplines) : undefined,
          services: dto.services ? normalizeStringList(dto.services) : undefined,
          coverUrl: dto.coverUrl !== undefined ? dto.coverUrl.trim() || null : undefined,
          regularMorningPriceMinor: dto.regularMorningPriceMinor ?? undefined,
          regularEveningPriceMinor: dto.regularEveningPriceMinor ?? undefined,
          vipMorningPriceMinor: dto.vipMorningPriceMinor ?? undefined,
          vipEveningPriceMinor: dto.vipEveningPriceMinor ?? undefined,
          onboardingCompletedAt: nextOnboardingCompletedAt,
          latitude: dto.latitude ?? dto.lat ?? undefined,
          longitude: dto.longitude ?? dto.lng ?? undefined,
          lat: dto.lat ?? undefined,
          lng: dto.lng ?? undefined
        }
      });
    });

    await this.auditService.log({
      actor,
      action: nextOnboardingCompletedAt ? (club.onboardingCompletedAt ? "club.update" : "club.onboarding-complete") : "club.update",
      entityType: "club",
      entityId: updated.id,
      metadata: {
        changedFields: Object.keys(dto),
        onboardingCompletedAt: updated.onboardingCompletedAt
      }
    });

    return updated;
  }

  async remove(id: string, actor?: RequestUser) {
    const club = await this.prisma.club.findFirst({
      where: {
        id,
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

    if (actor) {
      this.assertCanManageClub(actor, club.userId);
    }

    const activeBookings = await this.prisma.booking.count({
      where: {
        clubId: id,
        status: {
          in: [BookingStatus.ACTIVE, BookingStatus.PENDING, BookingStatus.CONFIRMED]
        },
        endAt: {
          gt: new Date()
        }
      }
    });

    if (activeBookings > 0) {
      throw new ConflictException("Club has active bookings and cannot be deleted.");
    }

    const deletedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.clubTable.updateMany({
        where: {
          clubId: id,
          deletedAt: null
        },
        data: {
          deletedAt
        }
      });

      await tx.club.update({
        where: { id },
        data: {
          deletedAt
        }
      });
    });

    if (actor) {
      await this.auditService.log({
        actor,
        action: "club.delete",
        entityType: "club",
        entityId: id
      });
    }

    return { id };
  }

  private serializeClub<T extends ClubListRecord | ClubDetailRecord>(club: T): ClubResponse<T> {
    return {
      ...club,
      description: this.localizedDescription(club),
      ...this.getComputedFields(club)
    } as unknown as ClubResponse<T>;
  }

  private getComputedFields(club: ClubListRecord | ClubDetailRecord): ClubComputedFields {
    const players = "players" in club ? club.players : [];
    const averageRating =
      players.length > 0
        ? Number((players.reduce((sum, item) => sum + item.elo, 0) / players.length).toFixed(1))
        : null;
    // Показываем рейтинг из внешнего источника (Yandex/2GIS), если он есть; иначе — средний по игрокам
    const displayRating = club.rating ?? averageRating;
    const vipTableCount = "tableItems" in club ? club.tableItems.filter((item) => normalizeTableKind(item.kind) === "VIP").length : 0;

    return {
      cityKey: this.cityKeyFromName(club.city?.name),
      countryKey: this.countryKeyFromCountry(club.country),
      districtKey: slugify(club.district),
      rating: displayRating,
      services: club.services ?? [],
      workHours: club.workingHours ? club.workingHours : null,
      tableCount: club.tables,
      latitude: club.latitude ?? club.lat ?? null,
      longitude: club.longitude ?? club.lng ?? null,
      isActive: Boolean(club.onboardingCompletedAt && !club.deletedAt),
      isOnboarded: Boolean(club.onboardingCompletedAt),
      vipTableCount,
      regularMorningPriceMinor: club.regularMorningPriceMinor ?? null,
      regularEveningPriceMinor: club.regularEveningPriceMinor ?? null,
      vipMorningPriceMinor: club.vipMorningPriceMinor ?? null,
      vipEveningPriceMinor: club.vipEveningPriceMinor ?? null
    };
  }

  private async ensureLocation(countryId: string, cityId: string) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        countryId: true
      }
    });

    if (!city || city.countryId !== countryId) {
      throw new ConflictException("City does not belong to the selected country.");
    }

    return city;
  }

  private async syncTableInventory(
    tx: Prisma.TransactionClient,
    clubId: string,
    nextCount: number,
    vipTableCount: number
  ) {
    const activeTables = await tx.clubTable.findMany({
      where: {
        clubId,
        deletedAt: null
      },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }]
    });

    if (nextCount < activeTables.length) {
      const toRemoveCount = activeTables.length - nextCount;
      const removableTables = [];

      for (const table of activeTables) {
        const blockingBookings = await tx.booking.count({
          where: {
            tableId: table.id,
            status: {
              in: [BookingStatus.ACTIVE, BookingStatus.PENDING, BookingStatus.CONFIRMED]
            },
            endAt: {
              gt: new Date()
            }
          }
        });

        if (blockingBookings === 0) {
          removableTables.push(table.id);
        }

        if (removableTables.length === toRemoveCount) {
          break;
        }
      }

      if (removableTables.length !== toRemoveCount) {
        throw new ConflictException("Cannot reduce table count while selected tables still have active bookings.");
      }

      await tx.clubTable.updateMany({
        where: {
          id: {
            in: removableTables
          }
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    if (nextCount > activeTables.length) {
      await tx.clubTable.createMany({
        data: createClubTables(clubId, nextCount - activeTables.length, 0).map((table, index) => ({
          ...table,
          sortOrder: activeTables.length + index + 1
        }))
      });
    }

    const finalTables = await tx.clubTable.findMany({
      where: {
        clubId,
        deletedAt: null
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    const blueprints = buildClubTableBlueprints(nextCount, vipTableCount);

    await Promise.all(
      finalTables.map((table, index) =>
        tx.clubTable.update({
          where: { id: table.id },
          data: {
            name: blueprints[index]?.name ?? table.name,
            kind: blueprints[index]?.kind ?? table.kind,
            sortOrder: blueprints[index]?.sortOrder ?? table.sortOrder
          }
        })
      )
    );
  }

  private cityKeyFromName(cityName?: string | null): string {
    return cityKeyMap[this.normalizeValue(cityName)] ?? "tashkent";
  }

  private countryKeyFromCountry(country?: { code?: string | null; name?: string | null } | null): string {
    const codeKey = countryKeyMap[this.normalizeValue(country?.code)];
    const nameKey = countryKeyMap[this.normalizeValue(country?.name)];
    return codeKey ?? nameKey ?? "uzbekistan";
  }

  private normalizeValue(value?: string | null): string {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  private localizedDescription(club: ClubListRecord | ClubDetailRecord): LocalizedTextDto | null {
    if (!club.description?.trim()) {
      return null;
    }

    return {
      ru: club.description,
      uz: club.description,
      en: club.description
    };
  }

  private assertCanManageClub(actor: RequestUser, clubUserId?: string | null) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (actor.role === Role.CLUB && clubUserId && actor.sub === clubUserId) {
      return;
    }

    throw new ForbiddenException("Forbidden");
  }
}

function normalizeStringList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function slugify(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTableKind(value?: string | null) {
  return (value ?? "").trim().toUpperCase() === "VIP" ? "VIP" : "REGULAR";
}

function resolveWorkingHoursInput(openTime?: string, closeTime?: string, workingHours?: string) {
  if (openTime && closeTime) {
    return `${openTime}-${closeTime}`;
  }

  if (workingHours !== undefined) {
    return workingHours.trim() || null;
  }

  return null;
}

function isClubOnboardingComplete(input: {
  tableCount: number;
  workingHours: string | null;
  regularMorningPriceMinor: number | null;
  regularEveningPriceMinor: number | null;
  vipMorningPriceMinor: number | null;
  vipEveningPriceMinor: number | null;
}) {
  return (
    input.tableCount > 0 &&
    Boolean(input.workingHours) &&
    typeof input.regularMorningPriceMinor === "number" &&
    typeof input.regularEveningPriceMinor === "number" &&
    typeof input.vipMorningPriceMinor === "number" &&
    typeof input.vipEveningPriceMinor === "number"
  );
}
