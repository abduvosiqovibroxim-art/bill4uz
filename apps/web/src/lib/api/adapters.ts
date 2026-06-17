import type {
  AdminUser,
  ApplicationEntry,
  BracketPhase,
  BookingEntry,
  BookingSlot,
  CityOption,
  Club,
  ClubDetail,
  ClubAvailability,
  ClubTable,
  ClubPreview,
  ClubTournamentSummary,
  CountryOption,
  DisciplineOption,
  LocalizedText,
  MediaEntry,
  NewsItem,
  Player,
  PlayerApplicationSummary,
  PlayerDetail,
  RankingEntry,
  TournamentBracketRound,
  Tournament,
  TournamentDetail,
  TournamentMatch,
  TournamentMatchPlayer,
  TournamentParticipant,
  TournamentRegulation,
  TournamentResultEntry,
  TournamentStatus
} from "@/lib/types";
import { disciplineKeyFromName } from "@/lib/tournamentTaxonomy";
import type {
  RawApplication,
  RawBracketRound,
  RawBooking,
  RawCity,
  RawClub,
  RawClubAvailability,
  RawClubTable,
  RawClubPreview,
  RawCountry,
  RawDiscipline,
  RawGallery,
  RawMatch,
  RawNews,
  RawPlayer,
  RawRanking,
  RawTournament,
  RawTournamentParticipant,
  RawTournamentRegulation,
  RawTournamentResult,
  RawUser
} from "./contracts";

function localized(value?: string | { ru: string; uz: string; en: string } | null, fallback = "-"): LocalizedText {
  if (value && typeof value === "object") {
    return {
      ru: value.ru ?? fallback,
      uz: value.uz ?? fallback,
      en: value.en ?? fallback
    };
  }

  const resolved = value?.trim() ? value : fallback;
  return { ru: resolved, uz: resolved, en: resolved };
}

function localizedOptional(value?: string | { ru: string; uz: string; en: string } | null): LocalizedText | null {
  if (value && typeof value === "object") {
    return localized(value);
  }

  if (!value?.trim()) {
    return null;
  }

  return localized(value);
}

function asArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : [];
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function requiredString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function cityKeyFromName(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "tashkent" || normalized === "ташкент") {
    return "tashkent";
  }

  if (normalized === "samarkand" || normalized === "самарканд") {
    return "samarkand";
  }

  if (normalized === "bukhara" || normalized === "бухара") {
    return "bukhara";
  }

  return null;
}

function statusFrom(value?: string | null): TournamentStatus {
  switch ((value ?? "").toUpperCase()) {
    case "DRAFT":
      return "draft";
    case "REGISTRATION":
      return "registration";
    case "LIVE":
      return "live";
    case "FINISHED":
      return "finished";
    default:
      return "registration";
  }
}

function billiardKindFrom(value?: string | null) {
  switch (value) {
    case "POOL":
      return "pool" as const;
    case "SNOOKER":
      return "snooker" as const;
    default:
      return "pyramid" as const;
  }
}

function tournamentCategoryFrom(value?: string | null) {
  switch (value) {
    case "MEN":
      return "men" as const;
    case "WOMEN":
      return "women" as const;
    case "JUNIORS":
      return "juniors" as const;
    case "GIRLS":
      return "girls" as const;
    case "AMATEURS":
      return "amateurs" as const;
    case "PROFESSIONALS":
      return "professionals" as const;
    case "TEAM":
      return "team" as const;
    case "PERSONAL":
      return "personal" as const;
    default:
      return "open" as const;
  }
}

function tournamentLevelFrom(value?: string | null) {
  switch (value) {
    case "CHAMPIONSHIP":
      return "championship" as const;
    case "CUP":
      return "cup" as const;
    case "LEAGUE":
      return "league" as const;
    case "RATED_TOURNAMENT":
      return "ratedTournament" as const;
    case "FRIENDLY_TOURNAMENT":
      return "friendlyTournament" as const;
    case "CLUB_TOURNAMENT":
      return "clubTournament" as const;
    default:
      return "openTournament" as const;
  }
}

function tournamentFormatFrom(value?: string | null) {
  switch (value) {
    case "TEAM":
      return "team" as const;
    case "TEAM_2X2":
      return "team2x2" as const;
    case "TEAM_3X3":
      return "team3x3" as const;
    default:
      return "individual" as const;
  }
}

function bracketSystemFrom(value?: string | null) {
  switch (value) {
    case "DOUBLE_ELIMINATION":
      return "doubleElimination" as const;
    case "ROUND_ROBIN":
      return "roundRobin" as const;
    case "SWISS":
      return "swiss" as const;
    case "GROUP_PLAYOFF":
      return "groupPlayoff" as const;
    default:
      return "singleElimination" as const;
  }
}

function participantSelectionModeFrom(value?: string | null) {
  switch (value) {
    case "DIRECT":
      return "direct" as const;
    case "MANUAL_DRAW":
      return "manualDraw" as const;
    default:
      return "applications" as const;
  }
}

function tournamentTypeFrom(value?: string | null) {
  switch (value) {
    case "AMATEUR":
      return "amateur" as const;
    case "PRO":
      return "pro" as const;
    default:
      return "visitor" as const;
  }
}

function playerLevelFrom(value?: string | null) {
  switch (value) {
    case "AMATEUR":
      return "amateur" as const;
    case "STRONG_AMATEUR":
      return "strongAmateur" as const;
    case "SEMI_PRO":
      return "semiPro" as const;
    case "PRO":
      return "pro" as const;
    default:
      return "novice" as const;
  }
}

function clubPreview(raw?: RawClubPreview | RawClub | null): ClubPreview | null {
  if (!raw) {
    return null;
  }

  const cityKey =
    requiredString("cityKey" in raw ? raw.cityKey : null) ||
    cityKeyFromName("city" in raw ? raw.city?.name : null);

  if (!cityKey) {
    return null;
  }

  return {
    id: requiredString(raw.id),
    name: localized(raw.name, "Без клуба"),
    cityKey,
    address: localized(raw.address, "-")
  };
}

function adaptParticipant(raw: RawPlayer): Player {
  return {
    id: raw.id,
    userId: raw.userId,
    fullName: raw.fullName,
    cityKey: raw.cityKey,
    countryKey: raw.countryKey,
    clubId: raw.clubId ?? null,
    elo: raw.elo,
    wins: raw.wins,
    losses: raw.losses,
    levelPoints: raw.levelPoints ?? 0,
    tournamentsPlayed: raw.tournamentsPlayed ?? 0,
    tournamentWins: raw.tournamentWins ?? 0,
    currentLevel: playerLevelFrom(raw.currentLevel ?? raw.level),
    currentLevelLabel: localized(raw.currentLevelLabel, raw.currentLevel ?? raw.level ?? "NOVICE"),
    nextLevel: raw.nextLevel ? playerLevelFrom(raw.nextLevel) : null,
    nextLevelLabel: raw.nextLevelLabel ? localized(raw.nextLevelLabel) : null,
    pointsToNextLevel: raw.pointsToNextLevel ?? 0,
    achievements: (raw.achievements ?? []).map((achievement) => localized(achievement)),
    bio: localizedOptional(raw.bio),
    club: clubPreview(raw.club)
  };
}

function adaptClubTournament(raw: RawTournament): ClubTournamentSummary {
  return {
    id: raw.id,
    title: localized(raw.title)
  };
}

export function adaptClub(raw: RawClub): Club {
  return {
    id: raw.id,
    userId: raw.userId ?? null,
    countryId: raw.countryId ?? raw.country?.id ?? null,
    cityId: raw.cityId ?? raw.city?.id ?? null,
    name: localized(raw.name),
    cityKey: raw.cityKey,
    districtKey: raw.districtKey ?? null,
    address: localized(raw.address),
    description: localizedOptional(raw.description),
    region: raw.region ?? null,
    district: raw.district ?? null,
    rating: raw.rating ?? null,
    tables: typeof raw.tables === "number" ? raw.tables : 0,
    tableCount: typeof raw.tableCount === "number" ? raw.tableCount : typeof raw.tables === "number" ? raw.tables : 0,
    disciplines: raw.disciplines,
    services: raw.services ?? [],
    phone: raw.phone ?? "",
    telegram: raw.telegram ?? "",
    source: raw.source ?? null,
    sourceId: raw.sourceId ?? null,
    coverUrl: raw.coverUrl ?? null,
    coverImageUrl: (raw as any).coverImageUrl ?? null,
    lat: raw.latitude ?? raw.lat ?? 41.2995,
    lng: raw.longitude ?? raw.lng ?? 69.2401,
    latitude: raw.latitude ?? raw.lat ?? null,
    longitude: raw.longitude ?? raw.lng ?? null,
    workHours: localizedOptional(raw.workHours),
    isActive: raw.isActive ?? raw.isOnboarded ?? false,
    isOnboarded: raw.isOnboarded ?? false,
    vipTableCount: typeof raw.vipTableCount === "number" ? raw.vipTableCount : 0,
    regularMorningPriceMinor: raw.regularMorningPriceMinor ?? null,
    regularEveningPriceMinor: raw.regularEveningPriceMinor ?? null,
    vipMorningPriceMinor: raw.vipMorningPriceMinor ?? null,
    vipEveningPriceMinor: raw.vipEveningPriceMinor ?? null,
    reviewsCount: (raw as any).reviewsCount ?? 0,
    amenities: (raw as any).amenities ?? [],
    isVerified: (raw as any).isVerified ?? false,
    tournamentsCount: raw.tournaments?.length ?? 0,
    playersCount: raw.players?.length ?? 0
  };
}

export function adaptTournament(raw: RawTournament): Tournament {
  const applications = asArray(raw.applications);
  const approvedApplicationsCount = applications.filter((application) => (application.status ?? "").toUpperCase() === "APPROVED").length;
  const pendingApplicationsCount = applications.filter((application) => (application.status ?? "").toUpperCase() === "PENDING").length;
  const bracketParticipantsCount = asArray(raw.bracketParticipants).length || asArray(raw.participantsList).length;
  const bracketMatchesCount = asArray(raw.bracketMatches).length || asArray(raw.matches).length;
  const participantCount = finiteNumber(raw.participantsCount, finiteNumber(raw.participants, bracketParticipantsCount || approvedApplicationsCount));
  const disciplineKey = raw.disciplineKey ?? disciplineKeyFromName(raw.disciplineName ?? raw.discipline?.name) ?? "freePyramid";
  const cityKey =
    requiredString(raw.cityKey) ||
    requiredString(raw.clubPreview?.cityKey) ||
    requiredString(raw.club?.cityKey) ||
    cityKeyFromName(raw.club?.city?.name) ||
    "tashkent";

  return {
    id: requiredString(raw.id),
    title: localized(raw.title, "Без названия"),
    subtitle: localizedOptional(raw.subtitle),
    cityKey,
    clubId: requiredString(raw.clubId, raw.club?.id ?? ""),
    disciplineId: requiredString(raw.disciplineId, raw.discipline?.id ?? ""),
    organizerId: requiredString(raw.organizerId),
    disciplineKey,
    disciplineName: requiredString(raw.disciplineName, requiredString(raw.discipline?.name, "Не указана")),
    billiardKind: billiardKindFrom(raw.billiardKind),
    category: tournamentCategoryFrom(raw.category),
    tournamentLevel: tournamentLevelFrom(raw.tournamentLevel),
    eventFormat: tournamentFormatFrom(raw.eventFormat),
    bracketSystem: bracketSystemFrom(raw.bracketSystem),
    participantSelectionMode: participantSelectionModeFrom(raw.participantSelectionMode),
    tournamentType: tournamentTypeFrom(raw.tournamentType),
    minPlayerLevel: playerLevelFrom(raw.minPlayerLevel),
    maxPlayerLevel: playerLevelFrom(raw.maxPlayerLevel),
    repeatEveryDays: typeof raw.repeatEveryDays === "number" ? raw.repeatEveryDays : null,
    billiardKindLabel: localized(raw.billiardKindLabel, raw.billiardKind ?? "PYRAMID"),
    categoryLabel: localized(raw.categoryLabel, raw.category ?? "OPEN"),
    tournamentLevelLabel: localized(raw.tournamentLevelLabel, raw.tournamentLevel ?? "OPEN_TOURNAMENT"),
    eventFormatLabel: localized(raw.eventFormatLabel, raw.eventFormat ?? "INDIVIDUAL"),
    bracketSystemLabel: localized(raw.bracketSystemLabel, raw.bracketSystem ?? "SINGLE_ELIMINATION"),
    participantSelectionModeLabel: localized(raw.participantSelectionModeLabel, raw.participantSelectionMode ?? "APPLICATIONS"),
    tournamentTypeLabel: localized(raw.tournamentTypeLabel, raw.tournamentType ?? "VISITOR"),
    minPlayerLevelLabel: localized(raw.minPlayerLevelLabel, raw.minPlayerLevel ?? "NOVICE"),
    maxPlayerLevelLabel: localized(raw.maxPlayerLevelLabel, raw.maxPlayerLevel ?? "PRO"),
    startsAt: requiredString(raw.startsAt),
    prizePool: finiteNumber(raw.prizePool),
    participants: participantCount,
    bracketSize: typeof raw.bracketSize === "number" && Number.isFinite(raw.bracketSize) ? raw.bracketSize : null,
    status: statusFrom(raw.status),
    organizer: localizedOptional(raw.organizer),
    registrationLabel: localizedOptional(raw.registrationLabel),
    format: localizedOptional(raw.format),
    schedule: raw.schedule ? asArray(raw.schedule).map((item) => localized(item)) : null,
    applicationsCount: applications.length,
    approvedApplicationsCount,
    pendingApplicationsCount,
    bracketParticipantsCount,
    bracketMatchesCount,
    bracketGenerated: bracketMatchesCount > 0,
    club: raw.clubPreview ? clubPreview(raw.clubPreview) : clubPreview(raw.club)
  };
}

export function adaptPlayer(raw: RawPlayer): Player {
  return {
    id: raw.id,
    userId: raw.userId,
    fullName: raw.fullName,
    cityKey: raw.cityKey,
    countryKey: raw.countryKey,
    clubId: raw.clubId ?? null,
    elo: raw.elo,
    wins: raw.wins,
    losses: raw.losses,
    levelPoints: raw.levelPoints ?? 0,
    tournamentsPlayed: raw.tournamentsPlayed ?? 0,
    tournamentWins: raw.tournamentWins ?? 0,
    currentLevel: playerLevelFrom(raw.currentLevel ?? raw.level),
    currentLevelLabel: localized(raw.currentLevelLabel, raw.currentLevel ?? raw.level ?? "NOVICE"),
    nextLevel: raw.nextLevel ? playerLevelFrom(raw.nextLevel) : null,
    nextLevelLabel: raw.nextLevelLabel ? localized(raw.nextLevelLabel) : null,
    pointsToNextLevel: raw.pointsToNextLevel ?? 0,
    achievements: (raw.achievements ?? []).map((achievement) => localized(achievement)),
    bio: localizedOptional(raw.bio),
    club: clubPreview(raw.club)
  };
}

export function adaptNews(raw: RawNews): NewsItem {
  return {
    id: raw.id,
    slug: raw.slug,
    title: localized(raw.title),
    categoryKey: raw.categoryKey,
    publishedAt: raw.publishedAt,
    excerpt: localized(raw.excerpt),
    content: localized(raw.content)
  };
}

export function adaptGallery(raw: RawGallery): MediaEntry {
  return {
    id: raw.id,
    title: localized(raw.title),
    description: localizedOptional(raw.description),
    typeKey: raw.typeKey,
    assetsCount: raw.assets.length,
    coverUrl: raw.assets[0]?.url ?? null
  };
}

export function adaptRanking(raw: RawRanking): RankingEntry {
  return {
    id: raw.id,
    playerId: raw.playerId,
    disciplineKey: raw.disciplineKey,
    cityKey: raw.cityKey,
    points: raw.points,
    position: raw.position,
    updatedAt: raw.updatedAt,
    player: adaptPlayer(raw.player)
  };
}

export function adaptTournamentDetail(raw: RawTournament): TournamentDetail {
  return {
    ...adaptTournament(raw),
    description: localizedOptional(raw.description),
    bracketType: raw.bracketType ?? bracketSystemFrom(raw.bracketSystem),
    rounds: (raw.rounds ?? []).map(adaptBracketRound),
    participantsList: (raw.participantsList ?? []).map(adaptTournamentParticipant),
    matches: (raw.matches ?? []).map(adaptTournamentMatch),
    results: (raw.results ?? []).map(adaptTournamentResult),
    regulation: adaptTournamentRegulation(raw.regulation)
  };
}

export function adaptPlayerDetail(raw: RawPlayer): PlayerDetail {
  return {
    ...adaptPlayer(raw),
    tournamentHistory: (raw.tournamentHistory ?? []).map(adaptTournament),
    applications: (raw.applications ?? []).map(adaptPlayerApplication)
  };
}

function adaptPlayerApplication(raw: RawApplication): PlayerApplicationSummary {
  return {
    id: raw.id,
    tournamentId: raw.tournamentId,
    status: raw.status as PlayerApplicationSummary["status"],
    createdAt: raw.createdAt,
    tournament: raw.tournament ? adaptTournament(raw.tournament) : null
  };
}

export function adaptClubDetail(raw: RawClub): ClubDetail {
  return {
    ...adaptClub(raw),
    tournaments: (raw.tournaments ?? []).map(adaptClubTournament),
    players: (raw.players ?? []).map(adaptPlayer)
  };
}

export function adaptAdminUser(raw: RawUser): AdminUser {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    isVerified: raw.isVerified,
    createdAt: raw.createdAt
  };
}

export function adaptApplication(raw: RawApplication): ApplicationEntry {
  if (!raw.player || !raw.tournament) {
    throw new Error("Application payload is incomplete");
  }

  return {
    id: raw.id,
    playerId: raw.playerId,
    tournamentId: raw.tournamentId,
    status: (raw.status as ApplicationEntry["status"]) ?? "PENDING",
    createdAt: raw.createdAt,
    player: adaptPlayer(raw.player),
    tournament: adaptTournament(raw.tournament)
  };
}

export function adaptCountry(raw: RawCountry): CountryOption {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name
  };
}

export function adaptCity(raw: RawCity): CityOption {
  return {
    id: raw.id,
    name: raw.name,
    countryId: raw.countryId
  };
}

export function adaptDiscipline(raw: RawDiscipline): DisciplineOption {
  return {
    id: raw.id,
    name: raw.name
  };
}

export function adaptClubTable(raw: RawClubTable): ClubTable {
  return {
    id: raw.id,
    clubId: raw.clubId,
    name: raw.name,
    kind: raw.kind,
    status: raw.status,
    sortOrder: raw.sortOrder,
    minBookingMinutes: raw.minBookingMinutes,
    maxBookingMinutes: raw.maxBookingMinutes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

export function adaptClubAvailability(raw: RawClubAvailability): ClubAvailability {
  return {
    tableId: raw.tableId,
    tableNumber: raw.tableNumber,
    tableName: raw.tableName,
    kind: raw.kind,
    kindLabel: raw.kindLabel ?? tableKindLabel(raw.kind),
    slots: raw.slots.map(adaptBookingSlot)
  };
}

export function adaptBooking(raw: RawBooking): BookingEntry {
  return {
    id: raw.id,
    status: raw.status,
    tableNumber: raw.tableNumber ?? raw.table.tableNumber ?? null,
    startTime: raw.startTime ?? raw.startAt,
    endTime: raw.endTime ?? raw.endAt,
    startAt: raw.startAt,
    endAt: raw.endAt,
    durationMinutes: raw.durationMinutes,
    priceMinor: raw.priceMinor ?? null,
    note: raw.note ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    confirmedAt: raw.confirmedAt ?? null,
    cancelledAt: raw.cancelledAt ?? null,
    completedAt: raw.completedAt ?? null,
    noShowAt: raw.noShowAt ?? null,
    club: raw.club,
    table: raw.table,
    user: raw.user,
    player: raw.player ?? null
  };
}

function adaptTournamentMatch(raw: RawMatch): TournamentMatch {
  return {
    id: raw.id,
    matchNumber: raw.matchNumber,
    roundNumber: raw.roundNumber,
    roundKey: raw.roundKey,
    phase: raw.phase,
    scheduledAt: raw.scheduledAt,
    tableNumber: raw.tableNumber ?? null,
    bestOf: raw.bestOf,
    status: raw.status,
    isBye: raw.isBye,
    scoreA: raw.score?.a ?? null,
    scoreB: raw.score?.b ?? null,
    winnerId: raw.winnerId ?? null,
    winnerTo: raw.winnerTo ?? null,
    loserTo: raw.loserTo ?? null,
    playerA: raw.playerA ? adaptTournamentMatchPlayer(raw.playerA) : null,
    playerB: raw.playerB ? adaptTournamentMatchPlayer(raw.playerB) : null
  };
}

function adaptBookingSlot(raw: { startAt: string; endAt: string; priceMinor?: number; pricePerHourMinor?: number; hourlyRateMinor?: number }): BookingSlot {
  return {
    startAt: raw.startAt,
    endAt: raw.endAt,
    priceMinor: "priceMinor" in raw && typeof raw.priceMinor === "number" ? raw.priceMinor : null,
    pricePerHourMinor:
      "pricePerHourMinor" in raw && typeof raw.pricePerHourMinor === "number"
        ? raw.pricePerHourMinor
        : "hourlyRateMinor" in raw && typeof raw.hourlyRateMinor === "number"
          ? raw.hourlyRateMinor
          : null
  };
}

function tableKindLabel(kind: string) {
  return kind === "VIP" ? "VIP стол" : "Обычный стол";
}

function adaptTournamentMatchPlayer(
  raw:
    | RawPlayer
    | {
        id: string;
        fullName: string;
        clubId?: string | null;
        clubName?: string | null;
        cityKey: string;
        countryKey: string;
        seed?: number | null;
      }
): TournamentMatchPlayer {
  const clubName = "clubName" in raw ? raw.clubName ?? null : "club" in raw ? raw.club?.name ?? null : null;

  return {
    id: raw.id,
    fullName: raw.fullName,
    clubId: raw.clubId ?? null,
    clubName,
    cityKey: raw.cityKey,
    countryKey: raw.countryKey,
    seed: "seed" in raw ? raw.seed ?? null : null
  };
}

function adaptTournamentParticipant(raw: RawTournamentParticipant): TournamentParticipant {
  return {
    ...adaptTournamentMatchPlayer(raw),
    seed: raw.seed,
    rating: raw.rating,
    wins: raw.wins,
    losses: raw.losses,
    status: raw.status,
    placement: raw.placement ?? null
  };
}

function adaptBracketRound(raw: RawBracketRound): TournamentBracketRound {
  return {
    id: raw.id,
    label: roundLabel(raw.phase, raw.roundNumber, raw.label),
    phase: raw.phase as BracketPhase,
    roundNumber: raw.roundNumber,
    matches: raw.matches.map(adaptTournamentMatch)
  };
}

function adaptTournamentResult(raw: RawTournamentResult): TournamentResultEntry {
  return {
    placement: raw.placement,
    label: raw.label,
    rating: raw.rating,
    player: adaptTournamentMatchPlayer(raw.player)
  };
}

function adaptTournamentRegulation(raw?: RawTournamentRegulation): TournamentRegulation {
  return {
    format: raw?.format ?? localized("-"),
    entryFee: raw?.entryFee ?? localized("-"),
    participationTerms: raw?.participationTerms ?? [],
    restrictions: raw?.restrictions ?? [],
    notes: raw?.notes ?? [],
    discipline: raw?.discipline ?? localized("-")
  };
}

function roundLabel(phase: BracketPhase, roundNumber: number, fallback: string): LocalizedText {
  if (phase === "final") {
    return localized({
      ru: "Финал",
      uz: "Final",
      en: "Final"
    });
  }

  if (phase === "lower") {
    return localized({
      ru: `Нижний раунд ${roundNumber}`,
      uz: `Pastki raund ${roundNumber}`,
      en: `Lower Round ${roundNumber}`
    });
  }

  const normalized = fallback.trim().toLowerCase();

  if (normalized === "quarterfinal") {
    return localized({
      ru: "Четвертьфинал",
      uz: "Chorak final",
      en: "Quarterfinal"
    });
  }

  if (normalized === "semifinal") {
    return localized({
      ru: "Полуфинал",
      uz: "Yarim final",
      en: "Semifinal"
    });
  }

  if (/^\d+\/\d+$/.test(normalized)) {
    return localized({
      ru: fallback,
      uz: fallback,
      en: fallback
    });
  }

  return localized({
    ru: `Раунд ${roundNumber}`,
    uz: `Raund ${roundNumber}`,
    en: fallback || `Round ${roundNumber}`
  });
}

