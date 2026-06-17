import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { tournamentDisciplineKeyFromName } from "../tournaments/disciplines";
import { RankingComputedFields, RankingPlayerComputedFields } from "./dto";

const rankingInclude = Prisma.validator<Prisma.RankingInclude>()({
  player: {
    include: {
      city: true,
      country: true
    }
  },
  discipline: true,
  city: true
});

type RankingRecord = Prisma.RankingGetPayload<{ include: typeof rankingInclude }>;
type RankingResponse = RankingRecord &
  RankingComputedFields & {
    player: RankingRecord["player"] & RankingPlayerComputedFields;
  };

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
export class RankingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverall(): Promise<RankingResponse[]> {
    const rankings = await this.prisma.ranking.findMany({
      include: rankingInclude,
      orderBy: { points: "desc" }
    });

    return rankings.map((ranking) => ({
      ...ranking,
      disciplineKey: this.disciplineKeyFromName(ranking.discipline.name),
      cityKey: this.cityKeyFromName(ranking.city.name),
      player: {
        ...ranking.player,
        cityKey: this.cityKeyFromName(ranking.player.city?.name),
        countryKey: this.countryKeyFromCountry(ranking.player.country),
        bio: null
      }
    }));
  }

  private cityKeyFromName(cityName?: string | null): string {
    return cityKeyMap[this.normalizeValue(cityName)] ?? "tashkent";
  }

  private countryKeyFromCountry(country?: { code?: string | null; name?: string | null } | null): string {
    const codeKey = countryKeyMap[this.normalizeValue(country?.code)];
    const nameKey = countryKeyMap[this.normalizeValue(country?.name)];
    return codeKey ?? nameKey ?? "uzbekistan";
  }

  private disciplineKeyFromName(disciplineName?: string | null): string {
    return tournamentDisciplineKeyFromName(disciplineName);
  }

  private normalizeValue(value?: string | null): string {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
}
