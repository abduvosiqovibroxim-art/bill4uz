"use client";

import Link from "next/link";
import { useClubsQuery, usePlayersQuery, useTournamentQuery, useTournamentsQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { GlowButton, MetricTile, SectionShell, SurfaceCard } from "./ui";

export function TopGameSection() {
  const { t, text, formatCurrency, formatDate } = useI18n();
  const tournamentsQuery = useTournamentsQuery();
  const playersQuery = usePlayersQuery();
  const clubsQuery = useClubsQuery();

  const tournaments = tournamentsQuery.data ?? [];
  const featured =
    tournaments.find((item) => item.status === "live") ??
    tournaments.find((item) => item.status === "registration") ??
    tournaments.find((item) => item.status === "draft") ??
    tournaments[0] ??
    null;
  const archive = tournaments.find((item) => item.status === "finished") ?? tournaments[1] ?? null;
  const liveCount = tournaments.filter((item) => item.status === "live").length;
  const liveDetailQuery = useTournamentQuery(featured?.id ?? "");
  const archiveDetailQuery = useTournamentQuery(archive?.id ?? "");
  const players = playersQuery.data ?? [];
  const clubs = clubsQuery.data ?? [];
  const featuredPlayer = [...players].sort((left, right) => right.elo - left.elo)[0] ?? null;
  const featuredClub = [...clubs].sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0))[0] ?? null;

  const currentStage = liveDetailQuery.data ? stageLabel(liveDetailQuery.data.rounds.length, t) : t("commonUi.loading");
  const playedMatches = liveDetailQuery.data?.matches.filter((match) => match.status === "finished").length ?? 0;
  const remainingMatches =
    liveDetailQuery.data?.matches.filter((match) => match.status !== "finished" && !match.isBye).length ?? 0;
  const champion = archiveDetailQuery.data?.results.find((item) => item.placement === 1) ?? null;

  return (
    <SectionShell tone="hero">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SurfaceCard className="showcase-hero-card">
          <div className="space-y-4">
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <div className="space-y-3">
              <h1 className="section-title text-white">{t("home.showcase.heroTitle")}</h1>
              <p className="max-w-3xl text-base leading-7 text-muted">{t("home.showcase.heroSubtitle")}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label={t("home.metrics.tournaments")} value={String(tournaments.length)} accent />
            <MetricCard label={t("home.showcase.liveNow")} value={String(liveCount)} />
            <MetricCard label={t("home.metrics.players")} value={String(players.length)} />
            <MetricCard label={t("home.metrics.clubs")} value={String(clubs.length)} />
          </div>

          <div className="showcase-live-panel">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`bracket-status bracket-status-${featured?.status ?? "pending"}`}>
                  {featured ? t(`common.statuses.${featured.status}`) : t("commonUi.loading")}
                </span>
                {featured ? <span className="pill">{t(`common.cities.${featured.cityKey}`)}</span> : null}
                {featured?.club ? <span className="pill">{text(featured.club.name)}</span> : null}
              </div>
              <div className="space-y-2">
                <h2 className="showcase-card-title text-3xl font-semibold text-white">
                  {featured ? text(featured.title) : t("commonUi.loading")}
                </h2>
                <p className="metric-copy max-w-2xl text-sm leading-6 text-muted">
                  {featured ? text(featured.subtitle) || text(featured.registrationLabel) || t("home.sections.tournamentsSubtitle") : t("commonUi.loading")}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard label={t("tournamentCenter.info.dateTime")} value={featured ? formatDate(featured.startsAt) : "-"} compact />
              <MetricCard label={t("common.stats.prizePool")} value={featured ? formatCurrency(featured.prizePool) : "-"} accent money />
              <MetricCard label={t("home.showcase.stage")} value={currentStage} compact />
              <MetricCard label={t("home.showcase.matchesPlayed")} value={String(playedMatches)} />
              <MetricCard label={t("home.showcase.matchesRemaining")} value={String(remainingMatches)} />
              <MetricCard label={t("common.stats.participants")} value={featured ? String(featured.participants) : "-"} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={featured ? `/tournaments/${featured.id}` : "/tournaments"}>
                <GlowButton>{featured?.status === "live" ? t("commonUi.followLive") : t("commonUi.openTournamentCenter")}</GlowButton>
              </Link>
              <Link href="/tournaments">
                <GlowButton variant="secondary">{t("commonUi.exploreTournaments")}</GlowButton>
              </Link>
              <Link href="/auth/signup">
                <GlowButton variant="secondary">{t("nav.signup")}</GlowButton>
              </Link>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4">
          <SurfaceCard className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("home.showcase.latestChampion")}</p>
            <div className="space-y-2">
              <h3 className="showcase-card-title text-2xl font-semibold text-white">{champion?.player.fullName ?? t("home.showcase.awaitingFinal")}</h3>
              <p className="metric-meta-line text-sm text-muted">
                {archive ? `${text(archive.title)} • ${formatDate(archive.startsAt)}` : t("commonUi.loading")}
              </p>
            </div>
            <p className="metric-copy text-sm leading-6 text-muted">
              {champion
                ? `${t("common.stats.participants")}: ${archive?.participants ?? "-"} • ${champion.player.clubName ?? t("common.stats.club")}`
                : t("home.showcase.championFallback")}
            </p>
            <Link href={archive ? `/tournaments/${archive.id}` : "/tournaments"} className="button-secondary inline-flex w-full justify-center">
              {t("commonUi.openTournamentCenter")}
            </Link>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("home.showcase.featuredPlayerTitle")}</p>
            <div className="space-y-2">
              <h3 className="showcase-card-title text-2xl font-semibold text-white">{featuredPlayer?.fullName ?? t("nav.players")}</h3>
              <p className="metric-meta-line text-sm text-muted">
                {featuredPlayer ? `${t(`common.cities.${featuredPlayer.cityKey}`)} • ELO ${featuredPlayer.elo}` : t("commonUi.loading")}
              </p>
            </div>
            <p className="metric-copy text-sm leading-6 text-muted">{featuredPlayer ? text(featuredPlayer.bio) || t("home.sections.playersSubtitle") : t("home.sections.playersSubtitle")}</p>
            <Link href={featuredPlayer ? `/players/${featuredPlayer.id}` : "/players"} className="button-secondary inline-flex w-full justify-center">
              {t("commonUi.seeProfile")}
            </Link>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("home.showcase.featuredClubTitle")}</p>
            <div className="space-y-2">
              <h3 className="showcase-card-title text-2xl font-semibold text-white">{featuredClub ? text(featuredClub.name) : t("nav.clubs")}</h3>
              <p className="metric-meta-line text-sm text-muted">
                {featuredClub ? `${t(`common.cities.${featuredClub.cityKey}`)} • ${featuredClub.tables} ${t("common.stats.tables")}` : t("commonUi.loading")}
              </p>
            </div>
            <p className="metric-copy text-sm leading-6 text-muted">{featuredClub ? text(featuredClub.description) || t("home.sections.clubsSubtitle") : t("home.sections.clubsSubtitle")}</p>
            <Link href={featuredClub ? `/clubs/${featuredClub.id}` : "/clubs"} className="button-secondary inline-flex w-full justify-center">
              {t("commonUi.seeClub")}
            </Link>
          </SurfaceCard>
        </div>
      </div>
    </SectionShell>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
  money = false,
  compact = false
}: {
  label: string;
  value: string;
  accent?: boolean;
  money?: boolean;
  compact?: boolean;
}) {
  return (
    <MetricTile
      label={label}
      value={value}
      accent={accent}
      valueClassName={money ? "metric-value-money" : compact ? "metric-value-compact" : "metric-value-hero"}
    />
  );
}

function stageLabel(roundCount: number, t: (path: string) => string) {
  if (roundCount <= 1) {
    return t("tournamentCenter.bracket.final");
  }

  if (roundCount === 2) {
    return t("home.showcase.semifinalStage");
  }

  if (roundCount === 3) {
    return t("home.showcase.quarterfinalStage");
  }

  return t("home.showcase.mainBracketStage");
}
