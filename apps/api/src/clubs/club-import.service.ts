import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/prisma.service";
import { AuditService } from "../platform/audit.service";
import type { RequestUser } from "../auth/dto";

const YANDEX_SEARCH_URL = "https://search-maps.yandex.ru/v1/";
const PROVIDER_SOURCE = "YANDEX";
const DEFAULT_COUNTRY_CODE = "UZ";
const DEFAULT_CITY = "Tashkent";
const DEFAULT_QUERY = "бильярд Ташкент";

interface YandexSearchResponse {
  features?: YandexFeature[];
}

interface YandexFeature {
  id?: string;
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    description?: string;
    CompanyMetaData?: {
      id?: string;
      name?: string;
      address?: string;
      url?: string;
      Phones?: Array<{
        formatted?: string;
        type?: string;
      }>;
      Hours?: {
        text?: string;
      };
      Categories?: Array<{
        name?: string;
      }>;
    };
  };
}

interface ProviderClub {
  sourceId: string | null;
  name: string;
  address: string;
  phone: string | null;
  telegram: string | null;
  latitude: number;
  longitude: number;
  workingHours: string | null;
}

@Injectable()
export class ClubImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService
  ) {}

  async syncRealBilliardClubsFromYandex(actor?: RequestUser) {
    const apiKey = this.configService.get<string>("YANDEX_MAPS_API_KEY")?.trim();
    if (!apiKey) {
      throw new BadRequestException("Yandex API key не настроен");
    }

    if (this.configService.get<string>("YANDEX_ORG_SEARCH_ENABLED") !== "true") {
      throw new BadRequestException("Yandex organization search не включён");
    }

    const cityName = this.configService.get<string>("YANDEX_SEARCH_CITY")?.trim() || DEFAULT_CITY;
    const query = this.configService.get<string>("YANDEX_SEARCH_QUERY")?.trim() || DEFAULT_QUERY;
    const city = await this.ensureCity(cityName);
    const response = await this.fetchYandexOrganizations(apiKey, cityName, query);
    const providerClubs = this.extractProviderClubs(response);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const providerClub of providerClubs) {
      if (!this.isValidProviderClub(providerClub)) {
        skipped += 1;
        continue;
      }

      const existing = await this.findExistingClub(providerClub);

      if (existing) {
        await this.prisma.club.update({
          where: { id: existing.id },
          data: this.toUpdateData(providerClub, city)
        });
        updated += 1;
        continue;
      }

      await this.prisma.club.create({
        data: {
          ...this.toCreateData(providerClub, city),
          disciplines: [],
          services: [],
          tables: 0
        }
      });
      added += 1;
    }

    if (actor) {
      await this.auditService.log({
        actor,
        action: "club.import-map",
        entityType: "club",
        entityId: "yandex",
        metadata: { added, updated, skipped, city: cityName, query }
      });
    }

    return { added, updated, skipped };
  }

  async syncRealBilliardClubsFromProvider(actor?: RequestUser) {
    return this.syncRealBilliardClubsFromYandex(actor);
  }

  private async fetchYandexOrganizations(apiKey: string, city: string, query: string): Promise<YandexSearchResponse> {
    const url = new URL(YANDEX_SEARCH_URL);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("text", this.buildSearchText(city, query));
    url.searchParams.set("type", "biz");
    url.searchParams.set("lang", "ru_RU");
    url.searchParams.set("results", "50");

    const response = await fetch(url);
    const payload = await response.text();

    if (!response.ok) {
      throw new ServiceUnavailableException(`Yandex organization search failed: ${payload.slice(0, 180)}`);
    }

    try {
      return JSON.parse(payload) as YandexSearchResponse;
    } catch {
      throw new ServiceUnavailableException("Yandex organization search returned invalid JSON");
    }
  }

  private buildSearchText(city: string, query: string) {
    return query.toLowerCase().includes(city.toLowerCase()) ? query : `${query} ${city}`;
  }

  private extractProviderClubs(response: YandexSearchResponse): ProviderClub[] {
    return (response.features ?? []).map((feature) => {
      const meta = feature.properties?.CompanyMetaData;
      const coordinates = feature.geometry?.coordinates;
      const phone = meta?.Phones?.find((item) => item.formatted)?.formatted?.trim() || null;
      const url = meta?.url?.trim() ?? "";

      return {
        sourceId: meta?.id ?? feature.id ?? null,
        name: (meta?.name ?? feature.properties?.name ?? "").trim(),
        address: (meta?.address ?? feature.properties?.description ?? "").trim(),
        phone,
        telegram: this.extractTelegram(url),
        latitude: Number(coordinates?.[1]),
        longitude: Number(coordinates?.[0]),
        workingHours: meta?.Hours?.text?.trim() || null
      };
    });
  }

  private isValidProviderClub(club: ProviderClub) {
    if (!club.name || !Number.isFinite(club.latitude) || !Number.isFinite(club.longitude)) {
      return false;
    }

    const haystack = `${club.name} ${club.address}`.toLowerCase();
    return containsAny(haystack, ["бильярд", "billiard", "bilyard", "pool", "пирамида", "snooker"]);
  }

  private async findExistingClub(club: ProviderClub) {
    if (club.sourceId) {
      const bySource = await this.prisma.club.findFirst({
        where: {
          source: PROVIDER_SOURCE,
          sourceId: club.sourceId
        },
        select: { id: true }
      });

      if (bySource) {
        return bySource;
      }
    }

    return this.prisma.club.findFirst({
      where: {
        source: PROVIDER_SOURCE,
        name: { equals: club.name, mode: "insensitive" },
        address: { equals: club.address, mode: "insensitive" },
        phone: club.phone
      },
      select: { id: true }
    });
  }

  private toCreateData(club: ProviderClub, city: { id: string; countryId: string }) {
    return {
      source: PROVIDER_SOURCE,
      sourceId: club.sourceId,
      name: club.name,
      countryId: city.countryId,
      cityId: city.id,
      address: club.address || "-",
      phone: club.phone,
      telegram: club.telegram ?? "",
      workingHours: club.workingHours,
      latitude: club.latitude,
      longitude: club.longitude,
      lat: club.latitude,
      lng: club.longitude,
      onboardingCompletedAt: new Date()
    };
  }

  private toUpdateData(club: ProviderClub, city: { id: string; countryId: string }) {
    return {
      source: PROVIDER_SOURCE,
      sourceId: club.sourceId,
      name: club.name,
      countryId: city.countryId,
      cityId: city.id,
      address: club.address || "-",
      phone: club.phone,
      telegram: club.telegram ?? "",
      workingHours: club.workingHours,
      latitude: club.latitude,
      longitude: club.longitude,
      lat: club.latitude,
      lng: club.longitude,
      onboardingCompletedAt: new Date(),
      deletedAt: null
    };
  }

  private async ensureCity(cityName: string) {
    const country = await this.prisma.country.upsert({
      where: { code: DEFAULT_COUNTRY_CODE },
      update: { name: "Uzbekistan" },
      create: { code: DEFAULT_COUNTRY_CODE, name: "Uzbekistan" }
    });

    return this.prisma.city.upsert({
      where: {
        countryId_name: {
          countryId: country.id,
          name: cityName
        }
      },
      update: {},
      create: {
        countryId: country.id,
        name: cityName
      }
    });
  }

  private extractTelegram(value: string) {
    const match = value.match(/(?:https?:\/\/)?t\.me\/([^/?#]+)/i);
    return match?.[1]?.replace(/^@+/, "").trim() || null;
  }
}

function containsAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}
