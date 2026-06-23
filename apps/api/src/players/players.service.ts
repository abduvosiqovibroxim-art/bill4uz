import { Injectable } from "@nestjs/common";
import { PlayerLevel, Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import type { LocalizedTextDto } from "../tournaments/dto";
import { tournamentDisciplineKeyFromName } from "../tournaments/disciplines";
import { nextPlayerLevel, pointsToNextLevel } from "./player-levels";
import { winPercentage } from "../rating/rating.util";
import { PlayerComputedFields, PlayerDetailComputedFields, PlayerLocalizedFields, PlayerRecentMatchDto, PlayerTournamentHistoryItemDto } from "./dto";

const playerListInclude = Prisma.validator<Prisma.PlayerInclude>()({
  city: true,
  country: true,
  club: {
    include: {
      city: true,
      country: true
    }
  },
  applications: {
    select: {
      tournament: {
        select: {
          discipline: { select: { name: true } }
        }
      }
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
  rankings: {
    orderBy: { position: "asc" },
    take: 1
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

    const recentMatches = await this.loadRecentMatches(id);
    return this.serializePlayerDetail(player, recentMatches);
  }

  private serializePlayer(player: PlayerListRecord): PlayerListResponse {
    const { applications, ...rest } = player;
    return {
      ...rest,
      achievements: player.achievements.map((achievement) => this.localizeAchievement(achievement)),
      ...this.getComputedFields(player)
    } as PlayerListResponse;
  }

  private async loadRecentMatches(playerId: string): Promise<PlayerRecentMatchDto[]> {
    const matches = await this.prisma.bracketMatch.findMany({
      where: {
        status: "FINISHED",
        OR: [{ player1: { is: { playerId } } }, { player2: { is: { playerId } } }]
      },
      orderBy: [{ scheduledAt: "desc" }, { updatedAt: "desc" }],
      take: 8,
      include: {
        tournament: { select: { id: true, title: true } },
        player1: { include: { player: { select: { id: true, fullName: true } } } },
        player2: { include: { player: { select: { id: true, fullName: true } } } },
        winner: { select: { playerId: true } }
      }
    });

    return matches.map((match) => {
      const isPlayerOne = match.player1?.playerId === playerId;
      const opponent = isPlayerOne ? match.player2 : match.player1;
      return {
        id: match.id,
        tournamentId: match.tournamentId,
        tournamentTitle: match.tournament?.title ?? null,
        opponentId: opponent?.player?.id ?? opponent?.playerId ?? null,
        opponentName: opponent?.player?.fullName ?? opponent?.name ?? "—",
        scoreFor: (isPlayerOne ? match.player1Score : match.player2Score) ?? null,
        scoreAgainst: (isPlayerOne ? match.player2Score : match.player1Score) ?? null,
        isWin: match.winner?.playerId === playerId,
        playedAt: match.scheduledAt ?? match.updatedAt ?? null
      };
    });
  }

  private serializePlayerDetail(player: PlayerDetailRecord, recentMatches: PlayerRecentMatchDto[]): PlayerDetailResponse {
    return {
      ...player,
      achievements: player.achievements.map((achievement) => this.localizeAchievement(achievement)),
      ...this.getComputedFields(player),
      worldRank: player.rankings[0]?.position ?? null,
      recentMatches,
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
      winPercentage: winPercentage(player.wins, player.losses),
      disciplines: this.extractDisciplines(player)
    };
  }

  private extractDisciplines(player: PlayerListRecord | PlayerDetailRecord): string[] {
    const applications = (player as { applications?: Array<{ tournament?: { discipline?: { name?: string | null } | null } | null }> }).applications;
    if (!applications) {
      return [];
    }
    const names = new Set<string>();
    for (const application of applications) {
      const name = application.tournament?.discipline?.name;
      if (name) {
        names.add(name);
      }
    }
    return [...names];
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
