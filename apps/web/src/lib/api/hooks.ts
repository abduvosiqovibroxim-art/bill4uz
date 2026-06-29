"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBooking,
  createClubAdmin,
  createClubTable,
  createBooking,
  createNewsAdmin,
  createTournamentAdmin,
  createTournamentApplication,
  createUserAdmin,
  deleteClubAdmin,
  deleteNewsAdmin,
  deleteTournamentAdmin,
  deleteUserAdmin,
  addBracketParticipants,
  fetchBracketParticipants,
  fetchTournamentStandings,
  fetchTournamentDisputes,
  resolveDispute,
  disqualifyBracketParticipant,
  fetchClubBookingSlots,
  fetchClubBookings,
  fetchTournamentApplications,
  fetchMyTournamentApplication,
  fetchApplicationsAdmin,
  fetchAdminBookings,
  fetchCities,
  fetchClub,
  fetchClubTables,
  fetchClubs,
  fetchMyClub,
  fetchCountries,
  fetchDisciplines,
  fetchMediaGalleries,
  fetchNews,
  fetchNewsItem,
  fetchPlayer,
  fetchCoach,
  fetchCoaches,
  fetchMyBookings,
  fetchPlayers,
  fetchRankings,
  fetchTournament,
  fetchTournaments,
  fetchUsersAdmin,
  generateBracket,
  importClubsFromMapAdmin,
  manualDrawTournament,
  moderateApplicationAdmin,
  removeBracketParticipant,
  rollbackBracketMatch,
  overrideBracketMatchResult,
  updateBracketMatchResult,
  updateBracketMatchStatus,
  updateClubAdmin,
  updateClubTable,
  updateBookingStatus,
  updateNewsAdmin,
  updateTournamentAdmin,
  updateUserAdmin,
  updateMyPlayerAvatar
} from "./fetchers";
import { queryKeys, type ApplicationListFilters, type BookingSlotsFilters, type ClubListFilters, type TournamentListFilters } from "./queryKeys";

export function usePlayersQuery() {
  return useQuery({
    queryKey: queryKeys.players.list(),
    queryFn: fetchPlayers
  });
}

export function useUpdateMyAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarUrl: string | null) => updateMyPlayerAvatar(avatarUrl),
    onSuccess: (player) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.players.list() });
      if (player) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(player.id) });
      }
    }
  });
}

export function usePlayerQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.players.detail(id),
    queryFn: () => fetchPlayer(id),
    enabled: Boolean(id),
    // Cache the profile so reopening it (or returning to the bracket) is instant
    // and does not trigger a refetch.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });
}

export function useCoachesQuery() {
  return useQuery({
    queryKey: queryKeys.coaches.list(),
    queryFn: fetchCoaches
  });
}

export function useCoachQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.coaches.detail(id),
    queryFn: () => fetchCoach(id),
    enabled: Boolean(id)
  });
}

export function useClubsQuery(filters: ClubListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clubs.list(filters),
    queryFn: () => fetchClubs(filters)
  });
}

export function useClubQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clubs.detail(id),
    queryFn: () => fetchClub(id),
    enabled: Boolean(id)
  });
}

export function useMyClubQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubs.mine(),
    queryFn: fetchMyClub,
    enabled
  });
}

export function useClubTablesQuery(clubId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubs.tables(clubId),
    queryFn: () => fetchClubTables(clubId),
    enabled: Boolean(clubId) && enabled
  });
}

export function useClubBookingSlotsQuery(clubId: string, filters: BookingSlotsFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubs.bookingSlots(clubId, filters),
    queryFn: () => fetchClubBookingSlots(clubId, filters),
    enabled: Boolean(clubId) && Boolean(filters.date) && enabled
  });
}

export function useClubBookingsQuery(clubId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubs.bookings(clubId),
    queryFn: () => fetchClubBookings(clubId),
    enabled: Boolean(clubId) && enabled,
    refetchInterval: 30000
  });
}

export function useClubBookingsByClubIdsQuery(clubIds: string[], enabled = true) {
  const uniqueClubIds = Array.from(new Set(clubIds)).sort();

  return useQuery({
    queryKey: [...queryKeys.bookings.all, "clubs", uniqueClubIds] as const,
    queryFn: async () => {
      const groups = await Promise.all(
        uniqueClubIds.map(async (clubId) => ({
          clubId,
          bookings: await fetchClubBookings(clubId)
        }))
      );

      return groups.flatMap((group) => group.bookings);
    },
    enabled: enabled && uniqueClubIds.length > 0,
    refetchInterval: 30000
  });
}

export function useAdminBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.bookings.all, "admin"] as const,
    queryFn: fetchAdminBookings,
    enabled,
    refetchInterval: 30000
  });
}

export function useMyBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.bookings.mine(),
    queryFn: fetchMyBookings,
    enabled,
    refetchInterval: 30000
  });
}

export function useTournamentsQuery(filters: TournamentListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tournaments.list(filters),
    queryFn: () => fetchTournaments(filters),
    refetchInterval: 30000
  });
}

export function useTournamentQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.detail(id),
    queryFn: () => fetchTournament(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const tournament = query.state.data;

      if (!tournament) {
        return 30000;
      }

      if (tournament.status === "live") {
        return 15000;
      }

      if ((tournament.status === "registration" || tournament.status === "draft") && tournament.matches.length > 0) {
        return 45000;
      }

      return false;
    }
  });
}

export function useTournamentDetailsQuery(ids: string[], enabled = true) {
  const uniqueIds = Array.from(new Set(ids)).sort();

  return useQuery({
    queryKey: [...queryKeys.tournaments.all, "details", uniqueIds] as const,
    queryFn: async () => {
      const tournaments = await Promise.all(uniqueIds.map((id) => fetchTournament(id)));
      return tournaments.filter(
        (tournament): tournament is Exclude<Awaited<ReturnType<typeof fetchTournament>>, null> => Boolean(tournament)
      );
    },
    enabled: enabled && uniqueIds.length > 0,
    refetchInterval: 30000
  });
}

export function useBracketParticipantsQuery(tournamentId: string) {
  return useQuery({
    queryKey: queryKeys.brackets.participants(tournamentId),
    queryFn: () => fetchBracketParticipants(tournamentId),
    enabled: Boolean(tournamentId)
  });
}

export function useTournamentStandingsQuery(tournamentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.brackets.standings(tournamentId),
    queryFn: () => fetchTournamentStandings(tournamentId),
    enabled: Boolean(tournamentId) && enabled
  });
}

export function useTournamentDisputesQuery(tournamentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.brackets.disputes(tournamentId),
    queryFn: () => fetchTournamentDisputes(tournamentId),
    enabled: Boolean(tournamentId) && enabled
  });
}

export function useResolveDisputeMutation(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, status, resolution }: { disputeId: string; status: "UPHELD" | "REJECTED"; resolution?: string }) =>
      resolveDispute(disputeId, { status, resolution }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.disputes(tournamentId) });
    }
  });
}

export function useDisqualifyParticipantMutation(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => disqualifyBracketParticipant(tournamentId, participantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(tournamentId) });
    }
  });
}

export function useTournamentApplicationsQuery(tournamentId: string) {
  return useQuery({
    queryKey: queryKeys.applications.tournament(tournamentId),
    queryFn: () => fetchTournamentApplications(tournamentId),
    enabled: Boolean(tournamentId)
  });
}

export function useMyTournamentApplicationQuery(tournamentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.applications.mine(tournamentId),
    queryFn: () => fetchMyTournamentApplication(tournamentId),
    enabled: Boolean(tournamentId) && enabled
  });
}

export function useRankingsQuery() {
  return useQuery({
    queryKey: queryKeys.rankings.list(),
    queryFn: fetchRankings
  });
}

export function useNewsQuery() {
  return useQuery({
    queryKey: queryKeys.news.list(),
    queryFn: fetchNews
  });
}

export function useNewsItemQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.news.detail(id),
    queryFn: () => fetchNewsItem(id),
    enabled: Boolean(id)
  });
}

export function useMediaGalleriesQuery() {
  return useQuery({
    queryKey: queryKeys.media.galleries(),
    queryFn: fetchMediaGalleries
  });
}

export function useUsersAdminQuery() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: fetchUsersAdmin
  });
}

export function useApplicationsAdminQuery(filters: ApplicationListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.applications.list(filters),
    queryFn: () => fetchApplicationsAdmin(filters)
  });
}

export function useCountriesQuery() {
  return useQuery({
    queryKey: queryKeys.meta.countries(),
    queryFn: fetchCountries
  });
}

export function useCitiesQuery() {
  return useQuery({
    queryKey: queryKeys.meta.cities(),
    queryFn: fetchCities
  });
}

export function useDisciplinesQuery() {
  return useQuery({
    queryKey: queryKeys.meta.disciplines(),
    queryFn: fetchDisciplines
  });
}

export function useCreateUserAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUserAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    }
  });
}

export function useUpdateUserAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUserAdmin>[1] }) => updateUserAdmin(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    }
  });
}

export function useDeleteUserAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    }
  });
}

export function useCreateClubAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClubAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    }
  });
}

export function useCreateClubTableMutation(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof createClubTable>[1]) => createClubTable(clubId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.tables(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.mine() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    }
  });
}

export function useUpdateClubTableMutation(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tableId,
      input
    }: {
      tableId: string;
      input: Parameters<typeof updateClubTable>[2];
    }) => updateClubTable(clubId, tableId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.tables(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.mine() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.bookings(clubId) });
    }
  });
}

export function useCreateBookingMutation(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.bookings(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    }
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: (booking) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.bookings(booking.club.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(booking.club.id) });
    }
  });
}

export function useUpdateBookingStatusMutation(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, input }: { bookingId: string; input: Parameters<typeof updateBookingStatus>[1] }) =>
      updateBookingStatus(bookingId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.bookings(clubId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(clubId) });
    }
  });
}

export function useUpdateClubAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateClubAdmin>[1] }) => updateClubAdmin(id, input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.mine() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.tables(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.bookings(variables.id) });
    }
  });
}

export function useDeleteClubAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClubAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    }
  });
}

export function useImportClubsFromMapAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importClubsFromMapAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    }
  });
}

export function useCreateTournamentAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTournamentAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useUpdateTournamentAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateTournamentAdmin>[1] }) =>
      updateTournamentAdmin(id, input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(variables.id) });
    }
  });
}

export function useDeleteTournamentAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTournamentAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useAddBracketParticipantsMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participants: Array<{ playerId: string; seed?: number }>) =>
      addBracketParticipants(tournamentId, participants),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    }
  });
}

export function useRemoveBracketParticipantMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => removeBracketParticipant(tournamentId, participantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    }
  });
}

export function useGenerateBracketMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateBracket(tournamentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useManualDrawTournamentMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (names: string[]) => manualDrawTournament(tournamentId, names),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useCreateManualDrawTournamentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournament,
      names
    }: {
      tournament: Parameters<typeof createTournamentAdmin>[0];
      names: string[];
    }) => {
      const created = await createTournamentAdmin(tournament);
      await manualDrawTournament(created.id, names);
      return created;
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(created.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(created.id) });
    }
  });
}

export function useCreateTournamentApplicationMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createTournamentApplication(tournamentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications.mine(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brackets.participants(tournamentId) });
    }
  });
}

export function useUpdateBracketMatchResultMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      input
    }: {
      matchId: string;
      input: { winnerId: string; player1Score?: number; player2Score?: number };
    }) => updateBracketMatchResult(matchId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useRollbackBracketMatchMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => rollbackBracketMatch(matchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useOverrideBracketMatchResultMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      input
    }: {
      matchId: string;
      input: { winnerId: string; player1Score?: number; player2Score?: number };
    }) => overrideBracketMatchResult(matchId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useUpdateBracketMatchStatusMutation(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, status }: { matchId: string; status: "PENDING" | "READY" | "LIVE" }) =>
      updateBracketMatchStatus(matchId, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export function useCreateNewsAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNewsAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    }
  });
}

export function useUpdateNewsAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateNewsAdmin>[1] }) => updateNewsAdmin(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    }
  });
}

export function useDeleteNewsAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNewsAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    }
  });
}

export function useModerateApplicationAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => moderateApplicationAdmin(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    }
  });
}

export const useModerateApplicationMutation = useModerateApplicationAdminMutation;
