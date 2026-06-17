import type { LocalizedTextDto } from "../tournaments/dto";
import { PlayerLevel } from "@prisma/client";

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

export interface PlayerDetailComputedFields extends PlayerComputedFields {
  tournamentHistory: PlayerTournamentHistoryItemDto[];
}
