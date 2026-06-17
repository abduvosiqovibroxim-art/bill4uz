"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { usePlayerQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { MetricTile, SectionShell, SurfaceCard } from "@/components/ui";

export function PlayerProfilePageClient({ id }: { id: string }) {
  const { t, text, formatPercent } = useI18n();
  const playerQuery = usePlayerQuery(id);

  if (playerQuery.isPending) {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  if (playerQuery.isError) {
    return (
      <SectionShell>
        <ErrorState onRetry={() => playerQuery.refetch()} />
      </SectionShell>
    );
  }

  const player = playerQuery.data;
  if (!player) {
    return (
      <SectionShell>
        <EmptyState message={t("system.notFoundText")} />
      </SectionShell>
    );
  }

  const total = player.wins + player.losses;
  const winRate = total > 0 ? (player.wins / total) * 100 : 0;
  const bio = text(player.bio);

  return (
    <div className="space-y-5 pb-12">
      <SectionShell tone="hero">
        <h1 className="section-title text-white">{player.fullName}</h1>
        <p className="metric-copy mt-3 max-w-3xl text-base text-muted">{bio || "-"}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <MetricTile label={t("common.stats.elo")} value={String(player.elo)} accent valueClassName="metric-value-hero" />
          <MetricTile label={t("common.stats.wins")} value={String(player.wins)} valueClassName="metric-value-hero" />
          <MetricTile label={t("common.stats.losses")} value={String(player.losses)} valueClassName="metric-value-hero" />
          <MetricTile label={t("common.stats.winRate")} value={formatPercent(winRate)} valueClassName="metric-value-hero" />
        </div>
      </SectionShell>

      <SectionShell>
        <h2 className="text-2xl font-semibold text-white">{t("players.achievements")}</h2>
        <div className="mt-4 grid gap-3">
          {player.achievements.length === 0 ? <EmptyState message={t("common.noResults")} /> : null}
          {player.achievements.map((achievement, index) => (
            <SurfaceCard key={`${player.id}-${index}`}>{text(achievement)}</SurfaceCard>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <h2 className="text-2xl font-semibold text-white">{t("players.history")}</h2>
        <div className="mt-4 grid gap-3">
          {player.tournamentHistory.length === 0 ? <EmptyState message={t("common.noResults")} /> : null}
          {player.tournamentHistory.map((tournament) => (
            <SurfaceCard key={tournament.id}>
              {text(tournament.title)} / {t(`common.disciplines.${tournament.disciplineKey}`)} / {t(`common.cities.${tournament.cityKey}`)}
            </SurfaceCard>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
