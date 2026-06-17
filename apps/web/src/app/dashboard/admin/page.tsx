"use client";

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
import { useApplicationsAdminQuery, useClubBookingsByClubIdsQuery, useClubsQuery, useTournamentsQuery, useUsersAdminQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import type { LocalizedText } from "@/lib/types";

const quickLinks = [
  { href: "/dashboard/admin/tournaments", key: "tournaments" },
  { href: "/dashboard/admin/clubs", key: "clubs" },
  { href: "/dashboard/admin/applications", key: "applications" },
  { href: "/dashboard/admin/users", key: "users" }
] as const;

type ActivityItem = {
  at: string;
  title: string;
  meta: string;
  href?: string;
};

export default function AdminDashboardPage() {
  const { locale, t, text } = useI18n();
  const c = dashboardCopy(locale);
  const usersQuery = useUsersAdminQuery();
  const clubsQuery = useClubsQuery();
  const tournamentsQuery = useTournamentsQuery();
  const applicationsQuery = useApplicationsAdminQuery();
  const clubIds = (clubsQuery.data ?? []).map((club) => club.id);
  const bookingsQuery = useClubBookingsByClubIdsQuery(clubIds, clubsQuery.isSuccess && clubIds.length > 0);

  const loading =
    usersQuery.isPending ||
    clubsQuery.isPending ||
    tournamentsQuery.isPending ||
    applicationsQuery.isPending ||
    (clubIds.length > 0 && bookingsQuery.isPending);

  const error =
    usersQuery.isError ||
    clubsQuery.isError ||
    tournamentsQuery.isError ||
    applicationsQuery.isError ||
    bookingsQuery.isError;

  if (loading) {
    return <LoadingState label={c.common.loading} />;
  }

  if (error) {
    return (
      <ErrorState
        onRetry={() => {
          void usersQuery.refetch();
          void clubsQuery.refetch();
          void tournamentsQuery.refetch();
          void applicationsQuery.refetch();
          void bookingsQuery.refetch();
        }}
      />
    );
  }

  const users = usersQuery.data ?? [];
  const clubs = clubsQuery.data ?? [];
  const tournaments = tournamentsQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const pendingApplications = applications.filter((application) => application.status === "PENDING");
  const activity = buildAdminActivity({
    users,
    tournaments,
    applications,
    bookings,
    locale,
    statusLabel: (status) => t(`common.statuses.${status}`),
    text,
    copy: c
  });

  return (
    <div className="space-y-5">
      <DashboardPageHeader eyebrow={c.admin.eyebrow} title={c.admin.title} subtitle={c.admin.subtitle} />

      <DashboardMetricGrid columns="md:grid-cols-5">
        <DashboardMetric label={c.admin.users} value={users.length} />
        <DashboardMetric label={c.admin.clubs} value={clubs.length} />
        <DashboardMetric label={c.admin.tournaments} value={tournaments.length} />
        <DashboardMetric label={c.admin.bookings} value={bookings.length} />
        <DashboardMetric label={c.admin.pendingApplications} value={pendingApplications.length} accent />
      </DashboardMetricGrid>

      <DashboardSplit>
        <DashboardSection title={c.admin.actionsTitle} subtitle={t("admin.overview.subtitle")}>
          <DashboardActionGrid>
            {quickLinks.map((item) => (
              <DashboardActionCard
                key={item.href}
                href={item.href}
                title={c.admin.actions[item.key]}
                description={c.admin.actionDescriptions[item.key]}
              />
            ))}
          </DashboardActionGrid>
        </DashboardSection>

        <DashboardSection title={c.admin.activityTitle} subtitle={c.admin.activitySubtitle}>
          {activity.length === 0 ? (
            <EmptyState message={c.common.emptyActivity} />
          ) : (
            <DashboardList>
              {activity.map((item) => (
                <DashboardListItem key={`${item.title}-${item.at}`} title={item.title} meta={item.meta} href={item.href}>
                  <span>{formatDate(item.at, locale)}</span>
                </DashboardListItem>
              ))}
            </DashboardList>
          )}
        </DashboardSection>
      </DashboardSplit>
    </div>
  );
}

function buildAdminActivity({
  users,
  tournaments,
  applications,
  bookings,
  locale,
  statusLabel,
  text,
  copy
}: {
  users: Array<{ email: string; createdAt: string }>;
  tournaments: Array<{ id: string; title: LocalizedText; status: string; createdAt?: string; startsAt: string }>;
  applications: Array<{ id: string; status: string; createdAt: string; player: { fullName: string }; tournament: { title: LocalizedText } }>;
  bookings: Array<{ id: string; status: string; createdAt: string; startAt: string; club: { name: string }; table: { name: string }; player?: { fullName: string } | null; user: { email: string } }>;
  locale: "ru" | "uz" | "en";
  statusLabel: (status: string) => string;
  text: (value?: LocalizedText | null) => string;
  copy: ReturnType<typeof dashboardCopy>;
}): ActivityItem[] {
  return [
    ...users.slice(0, 8).map((user) => ({
      at: user.createdAt,
      title: `${copy.admin.users}: ${user.email}`,
      meta: copy.common.profile,
      href: "/dashboard/admin/users"
    })),
    ...tournaments.slice(0, 8).map((tournament) => ({
      at: tournament.createdAt ?? tournament.startsAt,
      title: `${copy.common.tournament}: ${text(tournament.title)}`,
      meta: statusLabel(tournament.status),
      href: `/dashboard/admin/tournaments/${tournament.id}`
    })),
    ...applications.slice(0, 8).map((application) => ({
      at: application.createdAt,
      title: `${copy.common.application}: ${application.player.fullName}`,
      meta: `${text(application.tournament.title)} / ${application.status}`,
      href: "/dashboard/admin/applications"
    })),
    ...bookings.slice(0, 8).map((booking) => ({
      at: booking.createdAt,
      title: `${copy.common.booking}: ${booking.player?.fullName ?? booking.user.email}`,
      meta: `${booking.club.name} / ${booking.table.name} / ${booking.status}`,
      href: "/dashboard/admin/clubs"
    }))
  ]
    .filter((item) => Boolean(item.at))
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 8);
}

function formatDate(value: string, locale: "ru" | "uz" | "en") {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}
