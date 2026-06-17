"use client";

import { useState } from "react";
import {
  DashboardActionCard,
  DashboardActionGrid,
  DashboardList,
  DashboardListItem,
  DashboardMetric,
  DashboardMetricGrid,
  DashboardPageHeader,
  DashboardSection,
  DashboardSplit
} from "@/components/dashboard/DashboardKit";
import { dashboardCopy } from "@/components/dashboard/dashboardCopy";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useAuth } from "@/components/AuthProvider";
import { GlowButton, NoticePanel } from "@/components/ui";
import { useCancelBookingMutation, useMyBookingsQuery, usePlayerQuery, usePlayersQuery } from "@/lib/api/hooks";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import type { BookingEntry, Tournament } from "@/lib/types";

export default function PlayerDashboardPage() {
  const { locale, t, text } = useI18n();
  const c = dashboardCopy(locale);
  const { user } = useAuth();
  const playersQuery = usePlayersQuery();
  const bookingsQuery = useMyBookingsQuery(Boolean(user));
  const cancelBookingMutation = useCancelBookingMutation();
  const [feedback, setFeedback] = useState<{ tone: "default" | "error"; message: string } | null>(null);
  const currentPlayer = (playersQuery.data ?? []).find((player) => player.userId === user?.id) ?? null;
  const playerDetailQuery = usePlayerQuery(currentPlayer?.id ?? "");

  if (playersQuery.isPending || bookingsQuery.isPending || (currentPlayer && playerDetailQuery.isPending)) {
    return <LoadingState label={c.common.loading} />;
  }

  if (playersQuery.isError || bookingsQuery.isError || playerDetailQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void playersQuery.refetch();
          void bookingsQuery.refetch();
          if (currentPlayer) {
            void playerDetailQuery.refetch();
          }
        }}
      />
    );
  }

  const player = playerDetailQuery.data ?? currentPlayer;
  const bookings = bookingsQuery.data ?? [];
  const activeBookings = bookings.filter(isActiveBooking).length;
  const tournaments = playerDetailQuery.data?.tournamentHistory ?? [];
  const applications = playerDetailQuery.data?.applications ?? [];
  const results = tournaments.filter((tournament) => tournament.status === "finished");
  const hasActivity = tournaments.length > 0 || bookings.length > 0 || applications.length > 0;
  const showProfileEmpty = !player;
  const showActivityEmpty = !showProfileEmpty && !hasActivity;

  return (
    <div className="space-y-5">
      <DashboardPageHeader eyebrow={c.player.eyebrow} title={c.player.title} subtitle={c.player.subtitle} />

      <DashboardMetricGrid columns="md:grid-cols-6">
        <DashboardMetric label={c.player.tournaments} value={tournaments.length} />
        <DashboardMetric label={c.player.applications} value={applications.length} />
        <DashboardMetric label={c.player.activeBookings} value={activeBookings} accent />
        <DashboardMetric label={locale === "uz" ? "Daraja" : locale === "en" ? "Level" : "Уровень"} value={player ? text(player.currentLevelLabel) : "-"} />
        <DashboardMetric label={locale === "uz" ? "Ochko" : locale === "en" ? "Points" : "Очки"} value={player?.levelPoints ?? 0} />
        <DashboardMetric label={c.player.winsLosses} value={player ? `${player.wins}/${player.losses}` : "0/0"} />
      </DashboardMetricGrid>

      {feedback ? <NoticePanel tone={feedback.tone}>{feedback.message}</NoticePanel> : null}

      {player ? (
        <DashboardSection title={locale === "uz" ? "Mening darajam" : locale === "en" ? "My level" : "Мой уровень"}>
          <DashboardList>
            <DashboardListItem title={text(player.currentLevelLabel)} meta={`${locale === "uz" ? "Ochko" : locale === "en" ? "Points" : "Очки"}: ${player.levelPoints}`}>
              <div className="dashboard-chip-row">
                <span className="pill">{c.player.winsLosses}: {player.wins}/{player.losses}</span>
                <span className="pill">{c.player.tournaments}: {player.tournamentsPlayed}</span>
                <span className="pill">{locale === "uz" ? "Keyingi darajagacha" : locale === "en" ? "To next level" : "До следующего уровня"}: {player.pointsToNextLevel}</span>
              </div>
            </DashboardListItem>
          </DashboardList>
        </DashboardSection>
      ) : null}

      {showProfileEmpty ? <EmptyState message={c.player.noProfile} /> : null}
      {showActivityEmpty ? <EmptyState message={c.player.noActivity} /> : null}

      <DashboardSection title={c.common.quickActions}>
        <DashboardActionGrid>
          <DashboardActionCard href="/tournaments" title={c.player.findTournament} description={c.player.tournaments} />
          <DashboardActionCard href="/booking" title={c.player.findClub} description={c.player.bookings} />
          <DashboardActionCard href="#player-bookings" title={c.player.viewBookings} description={c.player.activeBookings} meta={String(activeBookings)} />
        </DashboardActionGrid>
      </DashboardSection>

      <DashboardSplit>
        <DashboardSection title={c.player.profileTitle} subtitle={c.player.profileSubtitle}>
          {player ? (
            <DashboardList>
              <DashboardListItem title={player.fullName} meta={`${c.player.elo}: ${player.elo}`} href={`/players/${player.id}`}>
                <div className="dashboard-chip-row">
                  <span className="pill">{c.player.winsLosses}: {player.wins}/{player.losses}</span>
                  {player.club ? <span className="pill">{c.common.club}: {text(player.club.name)}</span> : null}
                </div>
              </DashboardListItem>
            </DashboardList>
          ) : (
            <EmptyState message={c.player.noProfile} />
          )}
        </DashboardSection>

        <DashboardSection title={c.player.applications}>
          {applications.length === 0 ? (
            <EmptyState message={c.player.noApplications} />
          ) : (
            <DashboardList>
              {applications.slice(0, 5).map((application) => (
                <DashboardListItem
                  key={application.id}
                  href={application.tournament ? `/tournaments/${application.tournament.id}` : undefined}
                  title={application.tournament ? text(application.tournament.title) : application.tournamentId}
                  meta={`${application.status} / ${formatDateTime(application.createdAt, locale)}`}
                  aside={<span className={`bracket-status bracket-status-${application.status === "APPROVED" ? "live" : application.status === "REJECTED" ? "finished" : "pending"}`}>{application.status}</span>}
                />
              ))}
            </DashboardList>
          )}
        </DashboardSection>
      </DashboardSplit>

      <DashboardSection title={c.player.tournaments}>
        {tournaments.length === 0 ? (
          <EmptyState message={c.common.noData} />
        ) : (
          <DashboardList>
            {tournaments.map((tournament) => (
              <TournamentItem key={tournament.id} tournament={tournament} title={text(tournament.title)} locale={locale} statusLabel={(status) => t(`common.statuses.${status}`)} />
            ))}
          </DashboardList>
        )}
      </DashboardSection>

      <DashboardSplit>
        <DashboardSection id="player-bookings" title={c.player.bookings}>
          {bookings.length === 0 ? (
            <EmptyState message={c.player.noBookings} />
          ) : (
            <DashboardList>
              {bookings.map((booking) => (
                <DashboardListItem
                  key={booking.id}
                  title={booking.club.name}
                  meta={`${booking.table.name} / ${formatTimeRange(booking.startAt, booking.endAt, locale)} / ${booking.durationMinutes} min / ${statusLabel(booking.status, locale)} / ${formatMoney(booking.priceMinor)}`}
                  aside={
                    isUpcomingBooking(booking) ? (
                      <GlowButton variant="secondary" disabled={cancelBookingMutation.isPending} onClick={() => void cancelBooking(booking.id)}>
                        {cancelBookingMutation.isPending ? t("commonUi.loading") : locale === "uz" ? "Bekor qilish" : locale === "en" ? "Cancel" : "Отменить"}
                      </GlowButton>
                    ) : (
                      <span className={`bracket-status bracket-status-${booking.status === "CANCELLED" ? "finished" : isActiveBooking(booking) ? "live" : "pending"}`}>{statusLabel(booking.status, locale)}</span>
                    )
                  }
                />
              ))}
            </DashboardList>
          )}
        </DashboardSection>

        <DashboardSection title={c.player.results}>
          {results.length === 0 ? (
            <EmptyState message={c.common.noData} />
          ) : (
            <DashboardList>
              {results.slice(0, 6).map((tournament) => (
                <DashboardListItem key={tournament.id} href={`/tournaments/${tournament.id}`} title={text(tournament.title)} meta={formatTournamentMeta(tournament, locale, (status) => t(`common.statuses.${status}`))} />
              ))}
            </DashboardList>
          )}
        </DashboardSection>
      </DashboardSplit>

    </div>
  );

  async function cancelBooking(id: string) {
    setFeedback(null);

    try {
      await cancelBookingMutation.mutateAsync(id);
      setFeedback({ tone: "default", message: c.player.bookingCancelled });
    } catch (error) {
      setFeedback({ tone: "error", message: getUserFacingApiError(error, { locale, t, debugLabel: "player-cancel-booking" }) });
    }
  }
}

function TournamentItem({
  tournament,
  title,
  locale,
  statusLabel
}: {
  tournament: Tournament;
  title: string;
  locale: "ru" | "uz" | "en";
  statusLabel: (status: string) => string;
}) {
  return (
    <DashboardListItem
      href={`/tournaments/${tournament.id}`}
      title={title}
      meta={formatTournamentMeta(tournament, locale, statusLabel)}
      aside={<span className={`bracket-status bracket-status-${tournament.status}`}>{statusLabel(tournament.status)}</span>}
    />
  );
}

function isActiveBooking(booking: BookingEntry) {
  return ["ACTIVE", "PENDING", "CONFIRMED"].includes(booking.status);
}

function isUpcomingBooking(booking: BookingEntry) {
  return isActiveBooking(booking) && new Date(booking.startAt).getTime() > Date.now();
}

function formatDateTime(value: string, locale: "ru" | "uz" | "en") {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTimeRange(startAt: string, endAt: string, locale: "ru" | "uz" | "en") {
  const formatLocale = locale === "en" ? "en-US" : "ru-RU";
  const start = new Date(startAt).toLocaleString(formatLocale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
  const end = new Date(endAt).toLocaleTimeString(formatLocale, {
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${start} - ${end}`;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${new Intl.NumberFormat("ru-RU").format(value)} UZS`;
}

function statusLabel(status: string, locale: "ru" | "uz" | "en") {
  const labels: Record<string, Record<"ru" | "uz" | "en", string>> = {
    CONFIRMED: { ru: "Подтверждено", uz: "Tasdiqlangan", en: "Confirmed" },
    CANCELLED: { ru: "Отменено", uz: "Bekor qilingan", en: "Cancelled" },
    FINISHED: { ru: "Завершено", uz: "Tugagan", en: "Finished" },
    ACTIVE: { ru: "Подтверждено", uz: "Tasdiqlangan", en: "Confirmed" },
    PENDING: { ru: "Подтверждено", uz: "Tasdiqlangan", en: "Confirmed" },
    COMPLETED: { ru: "Завершено", uz: "Tugagan", en: "Finished" },
    NO_SHOW: { ru: "Завершено", uz: "Tugagan", en: "Finished" }
  };
  return labels[status]?.[locale] ?? status;
}

function formatTournamentMeta(tournament: Tournament, locale: "ru" | "uz" | "en", statusLabelFn: (status: string) => string) {
  return `${formatDateTime(tournament.startsAt, locale)} / ${statusLabelFn(tournament.status)}`;
}
