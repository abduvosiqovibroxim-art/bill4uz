export type Locale = "ru" | "uz" | "en";
export type LocalizedText = Record<Locale, string>;

export type TournamentStatus = "draft" | "registration" | "live" | "finished";
export type DisciplineKey =
  | "freePyramid"
  | "russianPyramid"
  | "combinedPyramid"
  | "dynamicPyramid"
  | "moscowPyramid"
  | "pool8"
  | "pool9"
  | "pool10"
  | "pool141"
  | "snooker"
  | "chineseBilliards";
export type CategoryKey = "platform" | "tournament" | "product" | "media";
export type BilliardKindKey = "pyramid" | "pool" | "snooker";
export type TournamentCategoryKey =
  | "men"
  | "women"
  | "juniors"
  | "girls"
  | "amateurs"
  | "professionals"
  | "open"
  | "team"
  | "personal";
export type TournamentLevelKey =
  | "openTournament"
  | "championship"
  | "cup"
  | "league"
  | "ratedTournament"
  | "friendlyTournament"
  | "clubTournament";
export type TournamentEventFormatKey = "individual" | "team" | "team2x2" | "team3x3";
export type TournamentBracketSystemKey =
  | "singleElimination"
  | "doubleElimination"
  | "roundRobin"
  | "swiss"
  | "groupPlayoff";
export type ParticipantSelectionModeKey = "applications" | "direct" | "manualDraw";
export type TournamentTypeKey = "visitor" | "amateur" | "pro";
export type PlayerLevelKey = "novice" | "amateur" | "strongAmateur" | "semiPro" | "pro";
export type BracketType = TournamentBracketSystemKey;
export type MatchStatus = "pending" | "ready" | "live" | "finished";
export type BracketPhase = "upper" | "lower" | "final";
export type TournamentParticipantStatus = "active" | "eliminated" | "winner" | "finalist" | "semifinalist";
export type ClubTableStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type BookingStatus = "CONFIRMED" | "CANCELLED" | "FINISHED" | "ACTIVE" | "PENDING" | "COMPLETED" | "NO_SHOW";

export interface ClubPreview {
  id: string;
  name: LocalizedText;
  cityKey: string;
  address: LocalizedText;
}

export interface ClubImage {
  id: string;
  clubId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface Club {
  id: string;
  userId?: string | null;
  countryId?: string | null;
  countryCode: string | null;
  cityId?: string | null;
  name: LocalizedText;
  cityKey: string;
  districtKey: string | null;
  address: LocalizedText;
  description: LocalizedText | null;
  region: string | null;
  district: string | null;
  rating: number | null;
  tables: number;
  tableCount: number;
  disciplines: string[];
  services: string[];
  phone: string;
  telegram: string;
  source: string | null;
  sourceId: string | null;
  coverUrl: string | null;
  coverImageUrl: string | null;
  lat: number;
  lng: number;
  latitude: number | null;
  longitude: number | null;
  workHours: LocalizedText | null;
  isActive: boolean;
  isOnboarded: boolean;
  vipTableCount: number;
  regularMorningPriceMinor: number | null;
  regularEveningPriceMinor: number | null;
  vipMorningPriceMinor: number | null;
  vipEveningPriceMinor: number | null;
  tournamentsCount: number;
  playersCount: number;
  reviewsCount: number;
  amenities: string[];
  isVerified: boolean;
  gallery?: ClubImage[];
}

export interface Tournament {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText | null;
  cityKey: string;
  clubId: string;
  disciplineId?: string;
  organizerId: string;
  disciplineKey: DisciplineKey;
  disciplineName: string;
  billiardKind: BilliardKindKey;
  category: TournamentCategoryKey;
  tournamentLevel: TournamentLevelKey;
  eventFormat: TournamentEventFormatKey;
  bracketSystem: TournamentBracketSystemKey;
  participantSelectionMode: ParticipantSelectionModeKey;
  tournamentType: TournamentTypeKey;
  minPlayerLevel: PlayerLevelKey;
  maxPlayerLevel: PlayerLevelKey;
  repeatEveryDays: number | null;
  billiardKindLabel: LocalizedText;
  categoryLabel: LocalizedText;
  tournamentLevelLabel: LocalizedText;
  eventFormatLabel: LocalizedText;
  bracketSystemLabel: LocalizedText;
  participantSelectionModeLabel: LocalizedText;
  tournamentTypeLabel: LocalizedText;
  minPlayerLevelLabel: LocalizedText;
  maxPlayerLevelLabel: LocalizedText;
  startsAt: string;
  prizePool: number;
  participants: number;
  bracketSize: number | null;
  status: TournamentStatus;
  organizer: LocalizedText | null;
  registrationLabel: LocalizedText | null;
  format: LocalizedText | null;
  schedule: LocalizedText[] | null;
  applicationsCount: number;
  approvedApplicationsCount: number;
  pendingApplicationsCount: number;
  bracketParticipantsCount: number;
  bracketMatchesCount: number;
  bracketGenerated: boolean;
  club?: ClubPreview | null;
}

export interface Player {
  id: string;
  userId?: string;
  fullName: string;
  cityKey: string;
  countryKey: string;
  clubId: string | null;
  elo: number;
  wins: number;
  losses: number;
  levelPoints: number;
  tournamentsPlayed: number;
  tournamentWins: number;
  mmr: number;
  winStreak: number;
  bestWinStreak: number;
  winPercentage: number;
  currentLevel: PlayerLevelKey;
  currentLevelLabel: LocalizedText;
  nextLevel: PlayerLevelKey | null;
  nextLevelLabel: LocalizedText | null;
  pointsToNextLevel: number;
  achievements: LocalizedText[];
  bio: LocalizedText | null;
  disciplines: string[];
  club?: ClubPreview | null;
}

export type CoachQualificationKey = "INSTRUCTOR" | "MASTER" | "INTERNATIONAL_MASTER" | "HONORED_COACH";

export interface Coach {
  id: string;
  fullName: string;
  photoUrl: string | null;
  region: string | null;
  cityId: string;
  cityName: string | null;
  countryId: string;
  countryName: string | null;
  clubId: string | null;
  clubName: string | null;
  qualification: CoachQualificationKey;
  specialization: string;
  disciplines: string[];
  experienceYears: number;
  studentsCount: number;
  personalPriceMinor: number;
  groupPriceMinor: number;
  bio: string | null;
  rating: number | null;
}

export interface CoachReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface CoachStudent {
  id: string;
  name: string;
  achievement: string | null;
}

export interface CoachDetail extends Coach {
  achievements: string[];
  phone: string | null;
  telegram: string | null;
  gallery: Array<{ id: string; url: string }>;
  reviews: CoachReview[];
  students: CoachStudent[];
}

export interface NewsItem {
  id: string;
  slug?: string;
  title: LocalizedText;
  categoryKey: CategoryKey;
  publishedAt: string;
  excerpt: LocalizedText;
  content: LocalizedText;
}

export interface TournamentMatchPlayer {
  id: string;
  fullName: string;
  clubId: string | null;
  clubName: string | null;
  cityKey: string;
  countryKey: string;
  seed: number | null;
}

export interface TournamentMatch {
  id: string;
  matchNumber: number;
  roundNumber: number;
  roundKey: string;
  phase: BracketPhase;
  scheduledAt: string;
  tableNumber: number | null;
  bestOf: number;
  status: MatchStatus;
  isBye: boolean;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  winnerTo: string | null;
  loserTo: string | null;
  isThirdPlace: boolean;
  isFinalReset: boolean;
  groupIndex: number | null;
  playerA: TournamentMatchPlayer | null;
  playerB: TournamentMatchPlayer | null;
}

export interface TournamentStandingEntry {
  position: number;
  participantId: string;
  name: string;
  seed: number;
  played: number;
  wins: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
}

export interface TournamentStandings {
  tournamentId: string;
  system: string;
  finished: boolean;
  standings: TournamentStandingEntry[];
}

export type DisputeStatus = "PENDING" | "UPHELD" | "REJECTED";

export interface DisputeEntry {
  id: string;
  matchId: string;
  tournamentId: string;
  filedByUserId: string;
  filedBy: { id: string; email: string } | null;
  match: { id: string; round: number; matchNumber: number } | null;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface TournamentBracketRound {
  id: string;
  label: LocalizedText;
  phase: BracketPhase;
  roundNumber: number;
  placeRange: string | null;
  matches: TournamentMatch[];
}

export interface TournamentParticipant extends TournamentMatchPlayer {
  seed: number;
  rating: number;
  wins: number;
  losses: number;
  status: TournamentParticipantStatus;
  placement: number | null;
}

export interface BracketPoolParticipant {
  id: string;
  playerId: string | null;
  seed: number;
  fullName: string;
  clubName: string | null;
  cityName: string | null;
  countryName: string | null;
  rating: number;
  wins: number;
  losses: number;
}

export interface TournamentResultEntry {
  placement: number;
  placeLabel: string;
  label: string;
  rating: number;
  player: TournamentMatchPlayer;
}

export interface TournamentRegulation {
  format: LocalizedText;
  entryFee: LocalizedText;
  participationTerms: LocalizedText[];
  restrictions: LocalizedText[];
  notes: LocalizedText[];
  discipline: LocalizedText;
}

export interface TournamentDetail extends Tournament {
  description: LocalizedText | null;
  bracketType: BracketType;
  rounds: TournamentBracketRound[];
  participantsList: TournamentParticipant[];
  matches: TournamentMatch[];
  results: TournamentResultEntry[];
  regulation: TournamentRegulation;
}

export interface PlayerRecentMatch {
  id: string;
  tournamentId: string;
  tournamentTitle: string | null;
  opponentId: string | null;
  opponentName: string;
  scoreFor: number | null;
  scoreAgainst: number | null;
  isWin: boolean;
  playedAt: string | null;
}

export interface PlayerDetail extends Player {
  worldRank: number | null;
  recentMatches: PlayerRecentMatch[];
  tournamentHistory: Tournament[];
  applications: PlayerApplicationSummary[];
}

export interface PlayerApplicationSummary {
  id: string;
  tournamentId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  tournament: Tournament | null;
}

export interface ClubTournamentSummary {
  id: string;
  title: LocalizedText;
}

export interface ClubDetail extends Club {
  tournaments: ClubTournamentSummary[];
  players: Player[];
}

export interface ClubTable {
  id: string;
  clubId: string;
  name: string;
  kind: string;
  status: ClubTableStatus;
  sortOrder: number;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSlot {
  startAt: string;
  endAt: string;
  priceMinor: number | null;
  pricePerHourMinor: number | null;
}

export interface ClubAvailability {
  tableId: string;
  tableNumber: number;
  tableName: string;
  kind: string;
  kindLabel: string;
  slots: BookingSlot[];
}

export interface BookingEntry {
  id: string;
  status: BookingStatus;
  tableNumber: number | null;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  priceMinor: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  noShowAt: string | null;
  club: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    phone: string | null;
    telegram: string | null;
  };
  table: {
    id: string;
    name: string;
    kind: string;
    kindLabel?: string;
  };
  user: {
    id: string;
    email: string;
    phone: string | null;
    role: "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN";
  };
  player: {
    id: string;
    fullName: string;
  } | null;
}

export interface RankingEntry {
  id: string;
  playerId: string;
  disciplineKey: DisciplineKey;
  cityKey: string;
  points: number;
  position: number;
  updatedAt: string;
  player: Player;
}

export interface MediaEntry {
  id: string;
  title: LocalizedText;
  description: LocalizedText | null;
  typeKey: string;
  assetsCount: number;
  coverUrl: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN";
  isVerified: boolean;
  createdAt: string;
}

export interface ApplicationEntry {
  id: string;
  playerId: string;
  tournamentId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  player: Player;
  tournament: Tournament;
}

export interface CountryOption {
  id: string;
  code: string;
  name: string;
}

export interface CityOption {
  id: string;
  name: string;
  countryId: string;
}

export interface DisciplineOption {
  id: string;
  name: string;
}
