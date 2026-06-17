import { Injectable } from "@nestjs/common";
import { PlayerLevel, Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import type { LocalizedTextDto } from "../tournaments/dto";
import { tournamentDisciplineKeyFromName } from "../tournaments/disciplines";
import { nextPlayerLevel, pointsToNextLevel } from "./player-levels";
import { winPercentage } from "../rating/rating.util";
import { PlayerComputedFields, PlayerDetailComputedFields, PlayerLocalizedFields, PlayerTournamentHistoryItemDto } from "./dto";

const playerListInclude = Prisma.validator<Prisma.PlayerInclude>()({
  city: true,
  country: true,
  club: {
    include: {
      city: true,
      country: true
    }
  }
});

const playerDetailInclude = Prisma.validator<Prisma.PlayerInclude>()({
  city: true,
  country: true,
  club: {
    include: {
      city: true,
      country: true
    }
  },
  applications: {
    include: {
      tournament: {
        include: {
          discipline: true,
          club: {
            include: {
              city: true,
              country: true
            }
          }
        }
      }
    }
  }
});

type PlayerListRecord = Prisma.PlayerGetPayload<{ include: typeof playerListInclude }>;
type PlayerDetailRecord = Prisma.PlayerGetPayload<{ include: typeof playerDetailInclude }>;
type PlayerListResponse = Omit<PlayerListRecord, "achievements"> & PlayerLocalizedFields & PlayerComputedFields;
type PlayerDetailResponse = Omit<PlayerDetailRecord, "achievements"> & PlayerLocalizedFields & PlayerDetailComputedFields;
type PlayerTournamentRecord = NonNullable<PlayerDetailRecord["applications"][number]["tournament"]>;

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
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PlayerListResponse[]> {
    const players = await this.prisma.player.findMany({
      include: playerListInclude,
      orderBy: { elo: "desc" }
    });

    return players.map((player) => this.serializePlayer(player));
  }

  async findOne(id: string): Promise<PlayerDetailResponse | null> {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        ...playerDetailInclude,
        applications: {
          ...playerDetailInclude.applications,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!player) {
      return null;
    }

    return this.serializePlayerDetail(player);
  }

  private serializePlayer(player: PlayerListRecord): PlayerListResponse {
    return {
      ...player,
      achievements: player.achievements.map((achievement) => this.localizeAchievement(achievement)),
      ...this.getComputedFields(player)
    };
  }

  private serializePlayerDetail(player: PlayerDetailRecord): PlayerDetailResponse {
    return {
      ...player,
      achievements: player.achievements.map((achievement) => this.localizeAchievement(achievement)),
      ...this.getComputedFields(player),
      tournamentHistory: player.applications
        .map((application) => application.tournament)
        .filter((tournament): tournament is PlayerTournamentRecord => Boolean(tournament))
        .map((tournament) => this.serializeTournamentHistoryItem(tournament))
    };
  }

  private getComputedFields(player: PlayerListRecord | PlayerDetailRecord): PlayerComputedFields {
    const currentLevel = player.level;
    const nextLevel = nextPlayerLevel(currentLevel);

    return {
      cityKey: this.cityKeyFromName(player.city?.name),
      countryKey: this.countryKeyFromCountry(player.country),
      bio: null,
      currentLevel,
      currentLevelLabel: this.playerLevelLabel(currentLevel),
      nextLevel,
      nextLevelLabel: nextLevel ? this.playerLevelLabel(nextLevel) : null,
      pointsToNextLevel: pointsToNextLevel(player.levelPoints),
      winPercentage: winPercentage(player.wins, player.losses)
    };
  }

  private serializeTournamentHistoryItem(tournament: PlayerTournamentRecord): PlayerTournamentHistoryItemDto {
    return {
      id: tournament.id,
      title: tournament.title,
      clubId: tournament.clubId,
      disciplineId: tournament.disciplineId,
      organizerId: tournament.organizerId,
      startsAt: tournament.startsAt,
      prizePool: tournament.prizePool,
      status: tournament.status,
      participants: tournament.participants,
      createdAt: tournament.createdAt,
      cityKey: this.cityKeyFromName(tournament.club?.city?.name),
      disciplineKey: this.disciplineKeyFromName(tournament.discipline?.name),
      subtitle: null,
      organizer: tournament.club?.name ?? null,
      registrationLabel: null,
      format: null,
      schedule: null
    };
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

  private localizeAchievement(achievement: string): LocalizedTextDto {
    return this.localizedText(achievement, achievement, achievement);
  }

  private localizedText(ru: string, uz: string, en: string): LocalizedTextDto {
    return { ru, uz, en };
  }

  private playerLevelLabel(level: PlayerLevel): LocalizedTextDto {
    switch (level) {
      case PlayerLevel.AMATEUR:
        return this.localizedText("Любитель", "Havaskor", "Amateur");
      case PlayerLevel.STRONG_AMATEUR:
        return this.localizedText("Сильный любитель", "Kuchli havaskor", "Strong amateur");
      case PlayerLevel.SEMI_PRO:
        return this.localizedText("Полупрофи", "Yarim professional", "Semi-pro");
      case PlayerLevel.PRO:
        return this.localizedText("Профи", "Professional", "Pro");
      default:
        return this.localizedText("Новичок", "Yangi boshlovchi", "Novice");
    }
  }
}
