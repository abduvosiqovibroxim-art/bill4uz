import type { AdminUser, ApplicationEntry, BookingEntry, BracketPoolParticipant, CityOption, Club, ClubAvailability, ClubDetail, ClubTable, CountryOption, DisciplineOption, MediaEntry, NewsItem, PlayerDetail, RankingEntry, Tournament, TournamentDetail } from "@/lib/types";
import { adaptAdminUser, adaptApplication, adaptBooking, adaptCity, adaptClub, adaptClubAvailability, adaptClubDetail, adaptClubTable, adaptCountry, adaptDiscipline, adaptGallery, adaptNews, adaptPlayer, adaptPlayerDetail, adaptRanking, adaptTournament, adaptTournamentDetail } from "./adapters";
import { apiFetch } from "./client";
import type { RawApplication, RawBooking, RawCity, RawClub, RawClubAvailability, RawClubTable, RawCountry, RawDiscipline, RawGallery, RawNews, RawPlayer, RawRanking, RawTournament, RawUser } from "./contracts";
import type { ApplicationListFilters, BookingSlotsFilters, ClubListFilters, TournamentListFilters } from "./queryKeys";

interface BracketEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const cityQueryMap: Record<string, string> = {
  tashkent: "Tashkent",
  samarkand: "Samarkand",
  bukhara: "Bukhara",
  andijan: "Andijan",
  namangan: "Namangan",
  fergana: "Fergana",
  nukus: "Nukus"
};

function cityQueryValue(city?: string) {
  if (!city || city === "all") {
    return undefined;
  }

  return cityQueryMap[city] ?? city;
}

export async function fetchPlayers() {
  const response = await apiFetch<RawPlayer[]>("/players");
  return response.map(adaptPlayer);
}

export async function fetchPlayer(id: string): Promise<PlayerDetail | null> {
  const response = await apiFetch<RawPlayer | null>(`/players/${id}`);
  return response ? adaptPlayerDetail(response) : null;
}

export async function fetchClubs(filters: ClubListFilters = {}) {
  const response = await apiFetch<RawClub[]>("/clubs", {
    query: {
      city: cityQueryValue(filters.city)
    }
  });

  return response.map(adaptClub);
}

export async function fetchClub(id: string): Promise<ClubDetail | null> {
  const response = await apiFetch<RawClub | null>(`/clubs/${id}`);
  return response ? adaptClubDetail(response) : null;
}

export async function fetchMyClub(): Promise<ClubDetail | null> {
  const response = await apiFetch<RawClub | null>("/clubs/me");
  return response ? adaptClubDetail(response) : null;
}

export async function fetchClubTables(clubId: string): Promise<ClubTable[]> {
  const response = await apiFetch<RawClubTable[]>(`/clubs/${clubId}/tables`);
  return response.map(adaptClubTable);
}

export async function fetchClubBookingSlots(clubId: string, filters: BookingSlotsFilters): Promise<ClubAvailability[]> {
  const response = await apiFetch<RawClubAvailability[]>(`/clubs/${clubId}/booking-slots`, {
    query: {
      date: filters.date,
      durationMinutes: filters.durationMinutes
    }
  });

  return response.map(adaptClubAvailability);
}

export async function fetchMyBookings(): Promise<BookingEntry[]> {
  const response = await apiFetch<RawBooking[]>("/bookings/me");
  return response.map(adaptBooking);
}

export async function fetchClubBookings(clubId: string): Promise<BookingEntry[]> {
  const response = await apiFetch<RawBooking[]>(`/clubs/${clubId}/bookings`);
  return response.map(adaptBooking);
}

export async function fetchAdminBookings(): Promise<BookingEntry[]> {
  const response = await apiFetch<RawBooking[]>("/bookings");
  return response.map(adaptBooking);
}

export async function fetchTournaments(filters: TournamentListFilters = {}) {
  const response = await apiFetch<RawTournament[]>("/tournaments", {
    query: {
      city: cityQueryValue(filters.city),
      status: filters.status,
      discipline: filters.discipline
    }
  });

  return response.map(adaptTournament);
}

export async function fetchTournament(id: string): Promise<TournamentDetail | null> {
  const response = await apiFetch<RawTournament | null>(`/tournaments/${id}`);
  return response ? adaptTournamentDetail(response) : null;
}

async function bracketFetch<T>(path: string, options: Parameters<typeof apiFetch<BracketEnvelope<T>>>[1] = {}) {
  const response = await apiFetch<BracketEnvelope<T>>(path, options);
  return response.data;
}

export async function fetchBracketParticipants(tournamentId: string): Promise<BracketPoolParticipant[]> {
  return bracketFetch<BracketPoolParticipant[]>(`/tournaments/${tournamentId}/participants`);
}

export async function fetchTournamentApplications(tournamentId: string): Promise<ApplicationEntry[]> {
  const response = await apiFetch<RawApplication[]>(`/applications/tournament/${tournamentId}`);
  return response.map(adaptApplication);
}

export async function fetchMyTournamentApplication(tournamentId: string): Promise<ApplicationEntry | null> {
  const response = await apiFetch<RawApplication | null>(`/applications/tournament/${tournamentId}/mine`);
  return response ? adaptApplication(response) : null;
}

export async function createTournamentApplication(tournamentId: string): Promise<ApplicationEntry> {
  const response = await apiFetch<RawApplication>("/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tournamentId })
  });

  return adaptApplication(response);
}

export async function fetchRankings(): Promise<RankingEntry[]> {
  const response = await apiFetch<RawRanking[]>("/rankings");
  return response.map(adaptRanking);
}

export async function fetchNews(): Promise<NewsItem[]> {
  const response = await apiFetch<RawNews[]>("/news");
  return response.map(adaptNews);
}

export async function fetchNewsItem(id: string): Promise<NewsItem | null> {
  const response = await apiFetch<RawNews | null>(`/news/${id}`);
  return response ? adaptNews(response) : null;
}

export async function fetchMediaGalleries(): Promise<MediaEntry[]> {
  const response = await apiFetch<RawGallery[]>("/media/galleries");
  return response.map(adaptGallery);
}

export async function fetchUsersAdmin(): Promise<AdminUser[]> {
  const response = await apiFetch<RawUser[]>("/users");
  return response.map(adaptAdminUser);
}

export async function createUserAdmin(input: { email: string; password: string; role: AdminUser["role"]; isVerified: boolean }) {
  const response = await apiFetch<RawUser>("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptAdminUser(response);
}

export async function updateUserAdmin(id: string, input: { role?: AdminUser["role"]; isVerified?: boolean }) {
  const response = await apiFetch<RawUser>(`/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptAdminUser(response);
}

export async function deleteUserAdmin(id: string) {
  return apiFetch<{ id: string }>(`/users/${id}`, {
    method: "DELETE"
  });
}

export async function createClubAdmin(input: {
  name: string;
  description?: string;
  countryId: string;
  cityId: string;
  address: string;
  region?: string;
  district?: string;
  phone?: string;
  telegram?: string;
  openTime?: string;
  closeTime?: string;
  workingHours?: string;
  tables?: number;
  vipTables?: number;
  regularMorningPriceMinor?: number;
  regularEveningPriceMinor?: number;
  vipMorningPriceMinor?: number;
  vipEveningPriceMinor?: number;
  disciplines: string[];
  services?: string[];
  coverUrl?: string;
  lat?: number;
  lng?: number;
}) {
  const response = await apiFetch<RawClub>("/clubs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptClub(response);
}

export async function updateClubAdmin(
  id: string,
  input: {
    name?: string;
    description?: string;
    countryId?: string;
    cityId?: string;
    address?: string;
    region?: string;
    district?: string;
    phone?: string;
    telegram?: string;
    openTime?: string;
    closeTime?: string;
    workingHours?: string;
    tables?: number;
    vipTables?: number;
    regularMorningPriceMinor?: number;
    regularEveningPriceMinor?: number;
    vipMorningPriceMinor?: number;
    vipEveningPriceMinor?: number;
    disciplines?: string[];
    services?: string[];
    coverUrl?: string;
    lat?: number;
    lng?: number;
  }
) {
  const response = await apiFetch<RawClub>(`/clubs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptClub(response);
}

export async function deleteClubAdmin(id: string) {
  return apiFetch<{ id: string }>(`/clubs/${id}`, {
    method: "DELETE"
  });
}

export async function importClubsFromMapAdmin() {
  return apiFetch<{ added: number; updated: number; skipped: number }>("/admin/clubs/import-map", {
    method: "POST"
  });
}

export async function createClubTable(
  clubId: string,
  input: {
    name: string;
    kind: string;
    status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
    sortOrder?: number;
    minBookingMinutes?: number;
    maxBookingMinutes?: number;
  }
) {
  const response = await apiFetch<RawClubTable>(`/clubs/${clubId}/tables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptClubTable(response);
}

export async function updateClubTable(
  clubId: string,
  tableId: string,
  input: {
    name?: string;
    kind?: string;
    status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
    sortOrder?: number;
    minBookingMinutes?: number;
    maxBookingMinutes?: number;
  }
) {
  const response = await apiFetch<RawClubTable>(`/clubs/${clubId}/tables/${tableId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptClubTable(response);
}

export async function createBooking(input: {
  clubId: string;
  tableId?: string;
  tableNumber?: number;
  startAt?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  note?: string;
  clientRequestId?: string;
}) {
  const response = await apiFetch<RawBooking>("/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptBooking(response);
}

export async function cancelBooking(id: string) {
  const response = await apiFetch<RawBooking>(`/bookings/${id}/cancel`, {
    method: "PATCH"
  });

  return adaptBooking(response);
}

export async function updateBookingStatus(
  id: string,
  input: {
    status: "CONFIRMED" | "CANCELLED" | "FINISHED";
  }
) {
  const response = await apiFetch<RawBooking>(`/bookings/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptBooking(response);
}

export async function createTournamentAdmin(input: {
  title: string;
  description?: { ru: string; uz: string; en: string } | null;
  registrationLabel?: { ru: string; uz: string; en: string } | null;
  clubId: string;
  disciplineId: string;
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
  repeatEveryDays?: 2 | 3 | 7 | null;
  startsAt: string;
  prizePool: number;
  status?: "DRAFT" | "REGISTRATION" | "LIVE" | "FINISHED";
  bracketSize?: number;
  bracketFormat?: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  regulation?: {
    format: { ru: string; uz: string; en: string };
    entryFee: { ru: string; uz: string; en: string };
    participationTerms: Array<{ ru: string; uz: string; en: string }>;
    restrictions: Array<{ ru: string; uz: string; en: string }>;
    notes: Array<{ ru: string; uz: string; en: string }>;
  };
}) {
  const response = await apiFetch<RawTournament>("/tournaments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptTournament(response);
}

export async function updateTournamentAdmin(
  id: string,
  input: {
    title?: string;
    description?: { ru: string; uz: string; en: string } | null;
    registrationLabel?: { ru: string; uz: string; en: string } | null;
    clubId?: string;
    disciplineId?: string;
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
    repeatEveryDays?: 2 | 3 | 7 | null;
    startsAt?: string;
    prizePool?: number;
    participants?: number;
    status?: "DRAFT" | "REGISTRATION" | "LIVE" | "FINISHED";
    bracketSize?: number;
    bracketFormat?: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
    regulation?: {
      format: { ru: string; uz: string; en: string };
      entryFee: { ru: string; uz: string; en: string };
      participationTerms: Array<{ ru: string; uz: string; en: string }>;
      restrictions: Array<{ ru: string; uz: string; en: string }>;
      notes: Array<{ ru: string; uz: string; en: string }>;
    };
  }
) {
  const response = await apiFetch<RawTournament>(`/tournaments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptTournament(response);
}

export async function deleteTournamentAdmin(id: string) {
  return apiFetch<{ id: string }>(`/tournaments/${id}`, {
    method: "DELETE"
  });
}

export async function addBracketParticipants(
  tournamentId: string,
  participants: Array<{ playerId: string; seed?: number }>
) {
  return bracketFetch(`/tournaments/${tournamentId}/participants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ participants })
  });
}

export async function removeBracketParticipant(tournamentId: string, participantId: string) {
  return bracketFetch(`/tournaments/${tournamentId}/participants/${participantId}`, {
    method: "DELETE"
  });
}

export async function generateBracket(tournamentId: string) {
  return bracketFetch(`/tournaments/${tournamentId}/generate-bracket`, {
    method: "POST"
  });
}

export async function manualDrawTournament(tournamentId: string, names: string[]) {
  return bracketFetch(`/tournaments/${tournamentId}/manual-draw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ names })
  });
}

export async function updateBracketMatchResult(
  matchId: string,
  input: { winnerId: string; player1Score?: number; player2Score?: number }
) {
  return bracketFetch(`/matches/${matchId}/result`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
}

export async function updateBracketMatchStatus(
  matchId: string,
  input: { status: "PENDING" | "READY" | "LIVE" }
) {
  return bracketFetch(`/matches/${matchId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
}

export async function createNewsAdmin(input: { title: string; slug: string; category: string; content: string; publishedAt: string }) {
  const response = await apiFetch<RawNews>("/news", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptNews(response);
}

export async function updateNewsAdmin(
  id: string,
  input: { title?: string; slug?: string; category?: string; content?: string; publishedAt?: string }
) {
  const response = await apiFetch<RawNews>(`/news/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return adaptNews(response);
}

export async function deleteNewsAdmin(id: string) {
  return apiFetch<{ id: string }>(`/news/${id}`, {
    method: "DELETE"
  });
}

export async function fetchApplicationsAdmin(filters: ApplicationListFilters = {}): Promise<ApplicationEntry[]> {
  const response = await apiFetch<RawApplication[]>("/applications", {
    query: {
      tournamentId: filters.tournamentId,
      status: filters.status
    }
  });

  return response.map(adaptApplication);
}

export async function moderateApplicationAdmin(id: string, status: string) {
  const response = await apiFetch<RawApplication>(`/applications/${id}/moderate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  return adaptApplication(response);
}

export async function fetchCountries(): Promise<CountryOption[]> {
  const response = await apiFetch<RawCountry[]>("/meta/countries");
  return response.map(adaptCountry);
}

export async function fetchCities(): Promise<CityOption[]> {
  const response = await apiFetch<RawCity[]>("/meta/cities");
  return response.map(adaptCity);
}

export async function fetchDisciplines(): Promise<DisciplineOption[]> {
  const response = await apiFetch<RawDiscipline[]>("/meta/disciplines");
  return response.map(adaptDiscipline);
}
