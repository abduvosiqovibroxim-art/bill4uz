import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { TOURNAMENT_DISCIPLINE_NAMES } from "../tournaments/disciplines";

@Injectable()
export class MetaService {
  constructor(private readonly prisma: PrismaService) {}

  countries() {
    return this.prisma.country.findMany({
      orderBy: { name: "asc" }
    });
  }

  cities() {
    return this.prisma.city.findMany({
      orderBy: { name: "asc" }
    });
  }

  async disciplines() {
    const disciplines = await this.prisma.discipline.findMany({
      where: {
        name: {
          in: TOURNAMENT_DISCIPLINE_NAMES
        }
      }
    });

    return TOURNAMENT_DISCIPLINE_NAMES
      .map((name) => disciplines.find((discipline) => discipline.name === name))
      .filter((discipline): discipline is NonNullable<typeof discipline> => Boolean(discipline));
  }
}
