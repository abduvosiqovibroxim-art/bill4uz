export interface TournamentListFilters {
  city?: string;
  status?: string;
  discipline?: string;
}

export interface ClubListFilters {
  city?: string;
}

export interface BookingSlotsFilters {
  date: string;
  durationMinutes?: number;
}

export interface ApplicationListFilters {
  tournamentId?: string;
  status?: string;
}

function normalizeTournamentFilters(filters: TournamentListFilters = {}) {
  return {
    city: filters.city ?? "all",
    status: filters.status ?? "all",
    discipline: filters.discipline ?? "all"
  };
}

function normalizeClubFilters(filters: ClubListFilters = {}) {
  return {
    city: filters.city ?? "all"
  };
}

function normalizeApplicationFilters(filters: ApplicationListFilters = {}) {
  return {
    tournamentId: filters.tournamentId ?? "all",
    status: filters.status ?? "all"
  };
}

function normalizeBookingSlotsFilters(filters: BookingSlotsFilters) {
  return {
    date: filters.date,
    durationMinutes: filters.durationMinutes ?? 60
  };
}

export const queryKeys = {
  players: {
    all: ["players"] as const,
    list: () => [...queryKeys.players.all, "list"] as const,
    detail: (id: string) => [...queryKeys.players.all, "detail", id] as const
  },
  users: {
    all: ["users"] as const,
    list: () => [...queryKeys.users.all, "list"] as const
  },
  clubs: {
    all: ["clubs"] as const,
    list: (filters: ClubListFilters = {}) => [...queryKeys.clubs.all, "list", normalizeClubFilters(filters)] as const,
    mine: () => [...queryKeys.clubs.all, "mine"] as const,
    detail: (id: string) => [...queryKeys.clubs.all, "detail", id] as const,
    tables: (id: string) => [...queryKeys.clubs.all, "tables", id] as const,
    bookingSlots: (id: string, filters: BookingSlotsFilters) =>
      [...queryKeys.clubs.all, "booking-slots", id, normalizeBookingSlotsFilters(filters)] as const,
    bookings: (id: string) => [...queryKeys.clubs.all, "bookings", id] as const
  },
  tournaments: {
    all: ["tournaments"] as const,
    list: (filters: TournamentListFilters = {}) =>
      [...queryKeys.tournaments.all, "list", normalizeTournamentFilters(filters)] as const,
    detail: (id: string) => [...queryKeys.tournaments.all, "detail", id] as const
  },
  brackets: {
    all: ["brackets"] as const,
    participants: (tournamentId: string) => [...queryKeys.brackets.all, "participants", tournamentId] as const,
    matches: (tournamentId: string) => [...queryKeys.brackets.all, "matches", tournamentId] as const,
    champion: (tournamentId: string) => [...queryKeys.brackets.all, "champion", tournamentId] as const
  },
  applications: {
    all: ["applications"] as const,
    list: (filters: ApplicationListFilters = {}) =>
      [...queryKeys.applications.all, "list", normalizeApplicationFilters(filters)] as const,
    tournament: (tournamentId: string) => [...queryKeys.applications.all, "tournament", tournamentId] as const,
    mine: (tournamentId: string) => [...queryKeys.applications.all, "mine", tournamentId] as const
  },
  bookings: {
    all: ["bookings"] as const,
    mine: () => [...queryKeys.bookings.all, "mine"] as const
  },
  rankings: {
    all: ["rankings"] as const,
    list: () => [...queryKeys.rankings.all, "list"] as const
  },
  news: {
    all: ["news"] as const,
    list: () => [...queryKeys.news.all, "list"] as const,
    detail: (id: string) => [...queryKeys.news.all, "detail", id] as const
  },
  media: {
    all: ["media"] as const,
    galleries: () => [...queryKeys.media.all, "galleries"] as const
  },
  meta: {
    all: ["meta"] as const,
    countries: () => [...queryKeys.meta.all, "countries"] as const,
    cities: () => [...queryKeys.meta.all, "cities"] as const,
    disciplines: () => [...queryKeys.meta.all, "disciplines"] as const
  }
};
