import type { LocalizedTextDto } from "../tournaments/dto";
import { PlayerLevel } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from "class-validator";

export class UpdatePlayerAvatarDto {
  // Allow null to remove the avatar; otherwise require an image data URL or http(s) URL.
  @ValidateIf((object: UpdatePlayerAvatarDto) => object.avatarUrl !== null)
  @IsString()
  @MaxLength(2_000_000)
  @Matches(/^(data:image\/(png|jpe?g|webp);base64,|https?:\/\/)/, {
    message: "avatarUrl must be an image data URL or an http(s) URL"
  })
  avatarUrl!: string | null;
}

// Admin-only manual override of a player's rating/level.
export class AdminUpdatePlayerDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  elo?: number;

  // When set, level points are aligned to this level's threshold so the
  // derived level stays stable (otherwise the next match would recompute it).
  @IsOptional()
  @IsEnum(PlayerLevel)
  level?: PlayerLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  levelPoints?: number;
}

export interface PlayerComputedFields {
  cityKey: string;
  countryKey: string;
  // TODO(next migration): persist player bio in DB-backed profile fields.
  bio: string | LocalizedTextDto | null;
  currentLevel: PlayerLevel;
  currentLevelLabel: LocalizedTextDto;
  nextLevel: PlayerLevel | null;
  nextLevelLabel: LocalizedTextDto | null;
  pointsToNextLevel: number;
  winPercentage: number;
  disciplines: string[];
}

export interface PlayerLocalizedFields {
  achievements: Array<string | LocalizedTextDto>;
}

export interface PlayerTournamentHistoryItemDto {
  id: string;
  title: string;
  clubId: string;
  disciplineId: string;
  organizerId: string;
  startsAt: Date;
  prizePool: number;
  status: string;
  participants: number;
  createdAt: Date;
  cityKey: string;
  disciplineKey: string;
  subtitle: string | null;
  organizer: string | null;
  registrationLabel: string | null;
  format: string | null;
  schedule: string[] | null;
}

export interface PlayerRecentMatchDto {
  id: string;
  tournamentId: string;
  tournamentTitle: string | null;
  opponentId: string | null;
  opponentName: string;
  scoreFor: number | null;
  scoreAgainst: number | null;
  isWin: boolean;
  playedAt: Date | null;
}

export interface PlayerDetailComputedFields extends PlayerComputedFields {
  tournamentHistory: PlayerTournamentHistoryItemDto[];
  worldRank: number | null;
  recentMatches: PlayerRecentMatchDto[];
}
