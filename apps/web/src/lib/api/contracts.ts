import type { CategoryKey, DisciplineKey } from "@/lib/types";

export interface RawCity {
  id: string;
  name: string;
  countryId: string;
}

export interface RawCountry {
  id: string;
  code: string;
  name: string;
}

export interface RawDiscipline {
  id: string;
  name: string;
}

export interface RawClubPreview {
  id: string;
  name: string;
  address: string;
  cityKey: string;
  countryKey: string;
}

export interface RawClub {
  id: string;
  userId?: string | null;
  name: string;
  description?: string | { ru: string; uz: string; en: string } | null;
  countryId: string;
  cityId: string;
  cityKey: string;
  countryKey: string;
  districtKey?: string | null;
  address: string;
  region?: string | null;
  district?: string | null;
  phone?: string | null;
  telegram?: string | null;
  source?: string | null;
  sourceId?: string | null;
  tables?: number | null;
  tableCount?: number | null;
  disciplines: string[];
  services?: string[];
  rating?: number | null;
  workHours?: string | { ru: string; uz: string; en: string } | null;
  coverUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  isActive?: boolean;
  isOnboarded?: boolean;
  vipTableCount?: number | null;
  regularMorningPriceMinor?: number | null;
  regularEveningPriceMinor?: number | null;
  vipMorningPriceMinor?: number | null;
  vipEveningPriceMinor?: number | null;
  city?: RawCity;
  country?: RawCountry;
  tournaments?: RawTournament[];
  players?: RawPlayer[];
}

export interface RawClubTable {
  id: string;
  clubId: string;
  name: string;
  kind: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  sortOrder: number;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface RawBookingSlot {
  startAt: string;
  endAt: string;
  priceMinor?: number;
  pricePerHourMinor?: number;
  hourlyRateMinor?: number;
}

export interface RawClubAvailability {
  tableId: string;
  tableNumber: number;
  tableName: string;
  kind: string;
  kindLabel?: string;
  slots: RawBookingSlot[];
}

export interface RawBooking {
  id: string;
  status: "ACTIVE" | "FINISHED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  tableNumber?: number;
  startTime?: string;
  endTime?: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  priceMinor?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  noShowAt?: string | null;
  club: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone: string | null;
    telegram: string | null;
  };
  table: {
    id: string;
    name: string;
    tableNumber?: number;
    kind: string;
    kindLabel?: string;
  };
  user: {
    id: string;
    email: string;
    phone: string | null;
    role: "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN";
  };
  player?: {
    id: string;
    fullName: string;
  } | null;
}

export interface RawPlayer {
  id: string;
  userId: string;
  fullName: string;
  countryId: string;
  cityId: string;
  cityKey: string;
  countryKey: string;
  clubId?: string | null;
  elo: number;
  wins: number;
  losses: number;
  levelPoints: number;
  tournamentsPlayed: number;
  tournamentWins: number;
  level: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
  currentLevel?: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
  currentLevelLabel?: { ru: string; uz: string; en: string };
  nextLevel?: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO" | null;
  nextLevelLabel?: { ru: string; uz: string; en: string } | null;
  pointsToNextLevel?: number;
  achievements?: Array<string | { ru: string; uz: string; en: string }>;
  bio?: string | { ru: string; uz: string; en: string } | null;
  city?: RawCity;
  country?: RawCountry;
  club?: RawClub | RawClubPreview | null;
  applications?: RawApplication[];
  tournamentHistory?: RawTournament[];
}

export interface RawUser {
  id: string;
  email: string;
  role: "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN";
  isVerified: boolean;
  createdAt: string;
}

export interface RawMatch {
  id: string;
  matchNumber: number;
  roundNumber: number;
  roundKey: string;
  phase: "upper" | "lower" | "final";
  scheduledAt: string;
  tableNumber?: number | null;
  bestOf: number;
  status: "pending" | "ready" | "live" | "finished";
  isBye: boolean;
  score: {
    a?: number | null;
    b?: number | null;
  };
  winnerId?: string | null;
  winnerTo?: string | null;
  loserTo?: string | null;
  playerA?: RawPlayer;
  playerB?: RawPlayer;
}

export interface RawTournamentParticipant {
  id: string;
  seed: number;
  fullName: string;
  clubId?: string | null;
  clubName?: string | null;
  cityKey: string;
  countryKey: string;
  rating: number;
  wins: number;
  losses: number;
  status: "active" | "eliminated" | "winner" | "finalist" | "semifinalist";
  placement?: number | null;
}

export interface RawBracketRound {
  id: string;
  label: string;
  phase: "upper" | "lower" | "final";
  roundNumber: number;
  matches: RawMatch[];
}

export interface RawTournamentResult {
  placement: number;
  label: string;
  rating: number;
  player: {
    id: string;
    fullName: string;
    clubId?: string | null;
    clubName?: string | null;
    cityKey: string;
    countryKey: string;
    seed?: number | null;
  };
}

export interface RawTournamentRegulation {
  format: { ru: string; uz: string; en: string };
  entryFee: { ru: string; uz: string; en: string };
  participationTerms: Array<{ ru: string; uz: string; en: string }>;
  restrictions: Array<{ ru: string; uz: string; en: string }>;
  notes: Array<{ ru: string; uz: string; en: string }>;
  discipline: { ru: string; uz: string; en: string };
}

export interface RawApplication {
  id: string;
  playerId: string;
  tournamentId: string;
  status: string;
  createdAt: string;
  player?: RawPlayer;
  tournament?: RawTournament;
}

export interface RawTournament {
  id: string;
  title: string;
  clubId: string;
  disciplineId: string;
  disciplineKey: DisciplineKey;
  disciplineName?: string;
  billiardKind?: "PYRAMID" | "POOL" | "SNOOKER";
  category?: "MEN" | "WOMEN" | "JUNIORS" | "GIRLS" | "AMATEURS" | "PROFESSIONALS" | "OPEN" | "TEAM" | "PERSONAL";
  tournamentLevel?:
    | "OPEN_TOURNAMENT"
    | "CHAMPIONSHIP"
    | "CUP"
    | "LEAGUE"
    | "RATED_TOURNAMENT"
    | "FRIENDLY_TOURNAMENT"
    | "CLUB_TOURNAMENT";
  eventFormat?: "INDIVIDUAL" | "TEAM" | "TEAM_2X2" | "TEAM_3X3";
  bracketSystem?: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS" | "GROUP_PLAYOFF";
  participantSelectionMode?: "APPLICATIONS" | "DIRECT" | "MANUAL_DRAW";
  tournamentType?: "VISITOR" | "AMATEUR" | "PRO";
  minPlayerLevel?: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
  maxPlayerLevel?: "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";
  repeatEveryDays?: number | null;
  billiardKindLabel?: { ru: string; uz: string; en: string };
  categoryLabel?: { ru: string; uz: string; en: string };
  tournamentLevelLabel?: { ru: string; uz: string; en: string };
  eventFormatLabel?: { ru: string; uz: string; en: string };
  bracketSystemLabel?: { ru: string; uz: string; en: string };
  participantSelectionModeLabel?: { ru: string; uz: string; en: string };
  tournamentTypeLabel?: { ru: string; uz: string; en: string };
  minPlayerLevelLabel?: { ru: string; uz: string; en: string };
  maxPlayerLevelLabel?: { ru: string; uz: string; en: string };
  cityKey: string;
  organizerId: string;
  organizer?: string | null;
  startsAt: string;
  prizePool: number;
  status: string;
  participants: number;
  participantsCount?: number;
  bracketSize?: number | null;
  subtitle?: string | { ru: string; uz: string; en: string } | null;
  description?: string | { ru: string; uz: string; en: string } | null;
  bracketType?: "singleElimination" | "doubleElimination" | "roundRobin" | "swiss" | "groupPlayoff";
  registrationLabel?: string | { ru: string; uz: string; en: string } | null;
  format?: string | { ru: string; uz: string; en: string } | null;
  schedule?: Array<string | { ru: string; uz: string; en: string }> | null;
  createdAt: string;
  club?: RawClub;
  clubPreview?: RawClubPreview | null;
  discipline?: RawDiscipline;
  matches?: RawMatch[];
  applications?: Array<RawApplication | { id: string; status: string; createdAt?: string }>;
  bracketParticipants?: Array<{ id: string }>;
  bracketMatches?: Array<{ id: string; scheduledAt?: string | null }>;
  participantsList?: RawTournamentParticipant[];
  rounds?: RawBracketRound[];
  results?: RawTournamentResult[];
  regulation?: RawTournamentRegulation;
}

export interface RawNews {
  id: string;
  title: string | { ru: string; uz: string; en: string };
  slug: string;
  category: string;
  categoryKey: CategoryKey;
  excerpt: string | { ru: string; uz: string; en: string };
  content: string | { ru: string; uz: string; en: string };
  publishedAt: string;
}

export interface RawMediaAsset {
  id: string;
  type: string;
  url: string;
  playerId?: string | null;
  galleryId?: string | null;
}

export interface RawGallery {
  id: string;
  title: string;
  description?: string | { ru: string; uz: string; en: string } | null;
  typeKey: string;
  assets: RawMediaAsset[];
}

export interface RawRanking {
  id: string;
  playerId: string;
  disciplineId: string;
  disciplineKey: DisciplineKey;
  cityId: string;
  cityKey: string;
  points: number;
  position: number;
  updatedAt: string;
  player: RawPlayer;
  discipline: RawDiscipline;
  city: RawCity;
}
