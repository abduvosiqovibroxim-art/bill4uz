"use client";

import Link from "next/link";
import { Club, NewsItem, Player, Tournament } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { MetricTile, StatusBadge, SurfaceCard, normalizeMetricText } from "./ui";
import { getTournamentParticipantsProgress } from "@/lib/tournamentParticipants";

export function TournamentCard({ item }: { item: Tournament }) {
  const { t, text, formatDate, formatCurrency, formatNumber } = useI18n();
  const subtitle = text(item.subtitle);
  const centerHref = `/tournaments/${item.id}`;
  const actionLabel = item.status === "live" ? t("commonUi.followLive") : t("commonUi.openTournamentCenter");
  const prizePool = makeBreakableText(formatCurrency(item.prizePool));
  const participantsProgress = getTournamentParticipantsProgress(item);
  const participantsValue = participantsProgress.capacity
    ? `${formatNumber(participantsProgress.registered)} / ${formatNumber(participantsProgress.capacity)}`
    : formatNumber(participantsProgress.registered);
  const registrationLabel = makeBreakableText(text(item.registrationLabel) || text(item.format) || t("common.stats.format"));
  const disciplineLabel = makeBreakableText(item.disciplineName);
  const clubLabel = makeBreakableText(item.club ? text(item.club.name) : "-");
  const categoryLabel = makeBreakableText(text(item.categoryLabel));
  const typeLabel = makeBreakableText(text(item.tournamentLevelLabel));
  const startsAtLabel = makeBreakableText(safeFormattedDate(item.startsAt, formatDate));
  const cityLabel = makeBreakableText(t(`common.cities.${item.cityKey || "tashkent"}`));

  return (
    <SurfaceCard className="showcase-card tournament-card space-y-4">
      <div className="tournament-card-header">
        <div className="tournament-card-heading space-y-2">
          <StatusBadge>{makeBreakableText(t(`common.statuses.${item.status}`))}</StatusBadge>
          <h3 className="showcase-card-title text-xl font-semibold text-white">{text(item.title)}</h3>
          {subtitle ? <p className="showcase-card-subtitle text-sm leading-6 text-muted">{subtitle}</p> : null}
        </div>
        <span className="pill tournament-card-city">{cityLabel}</span>
      </div>

      <div className="showcase-card-metrics">
        <MetricTile
          className="tournament-card-metric"
          label={t("common.stats.participants")}
          labelClassName="tournament-card-metric-label"
          value={participantsValue}
          valueClassName="tournament-card-metric-value text-white"
        />
        <MetricTile
          className="tournament-card-metric"
          label={t("common.stats.prizePool")}
          labelClassName="tournament-card-metric-label"
          value={prizePool}
          accent
          valueClassName="tournament-card-metric-value tournament-card-money"
        />
      </div>

      <div className="tournament-card-meta text-sm text-muted">
        <p>{disciplineLabel}</p>
        <p>{categoryLabel}</p>
        <p>{typeLabel}</p>
        <p>{clubLabel}</p>
        <p>{startsAtLabel}</p>
      </div>

      <div className="tournament-card-footer border-t border-white/10 pt-4">
        <p className="tournament-card-registration metric-copy text-sm text-white/80">
          {registrationLabel}
        </p>
        <Link
          className="button-secondary tournament-card-cta inline-flex w-full max-w-full text-center sm:w-auto sm:max-w-[13rem]"
          href={centerHref}
        >
          {actionLabel}
        </Link>
      </div>
    </SurfaceCard>
  );
}

const PODIUM_MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_RINGS = ["#d5b36a", "#c7ccd6", "#cd7f4f"];

function playerInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function winRateOf(item: Player) {
  const total = item.wins + item.losses;
  return total > 0 ? (item.wins / total) * 100 : 0;
}

/** Top-3 leaderboard podium. `players` must already be ordered (index 0 = 1st place). */
export function PlayerPodium({ players }: { players: Player[] }) {
  const { t, text } = useI18n();
  if (players.length === 0) return null;

  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-3 md:items-end">
      {players.map((player, index) => {
        const isFirst = index === 0;
        const ring = PODIUM_RINGS[index] ?? "var(--muted)";
        const winRate = winRateOf(player);
        const levelLabel = text(player.currentLevelLabel);
        const clubLabel = player.club?.name ? text(player.club.name) : null;
        const mdOrder = index === 0 ? "md:order-2" : index === 1 ? "md:order-1" : "md:order-3";
        const avatarSize = isFirst ? 88 : 72;

        return (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className={`group relative flex flex-col items-center gap-3 rounded-2xl px-6 text-center transition-transform duration-200 hover:-translate-y-1 ${mdOrder} ${isFirst ? "pt-10 pb-9 md:pt-12 md:pb-11" : "pt-8 pb-7"}`}
            style={{
              background: "var(--surface)",
              border: `1px solid ${isFirst ? "var(--card-border-strong)" : "var(--card-border)"}`,
              boxShadow: isFirst ? "0 20px 48px rgba(0, 255, 136, 0.16)" : "var(--shadow-soft)"
            }}
          >
            <span
              className="absolute -top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "var(--bg)", border: `1px solid ${ring}`, color: ring }}
            >
              <span aria-hidden="true">{PODIUM_MEDALS[index]}</span># {index + 1}
            </span>

            <span
              className="flex items-center justify-center rounded-full font-black"
              style={{
                width: avatarSize,
                height: avatarSize,
                fontSize: isFirst ? 30 : 24,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                border: `2px solid ${ring}`
              }}
            >
              {playerInitials(player.fullName)}
            </span>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-black leading-tight" style={{ color: "var(--text)" }}>
                {player.fullName}
              </h3>
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {t(`common.cities.${player.cityKey}`)}
                {clubLabel ? ` · ${clubLabel}` : ""}
              </p>
            </div>

            {levelLabel ? (
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {levelLabel}
              </span>
            ) : null}

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black" style={{ color: "var(--accent)" }}>{player.elo}</span>
              <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{t("common.stats.elo")}</span>
            </div>

            <div className="flex w-full items-center justify-center gap-5 border-t pt-3 text-sm" style={{ borderColor: "var(--card-border)" }}>
              <span style={{ color: "var(--muted)" }}>
                <span className="font-black" style={{ color: "var(--text)" }}>{player.wins}</span> {t("common.stats.wins")}
              </span>
              <span style={{ color: "var(--muted)" }}>
                <span className="font-black" style={{ color: "var(--text)" }}>{Math.round(winRate)}%</span> {t("common.stats.winRate")}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function PlayerRankRow({ item, rank }: { item: Player; rank: number }) {
  const { t, text, formatPercent } = useI18n();
  const winRate = winRateOf(item);
  const rankColor = rank <= 3 ? PODIUM_RINGS[rank - 1] : "var(--muted)";
  const clubLabel = item.club?.name ? text(item.club.name) : null;
  const levelLabel = text(item.currentLevelLabel);

  return (
    <Link
      href={`/players/${item.id}`}
      className="group flex items-center gap-3 rounded-xl p-3 transition-transform duration-150 hover:-translate-y-0.5 sm:gap-4 sm:p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}
    >
      <span className="w-7 shrink-0 text-center text-xl font-black sm:w-10 sm:text-2xl" style={{ color: rankColor }}>
        {rank}
      </span>

      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        {playerInitials(item.fullName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold" style={{ color: "var(--text)" }}>{item.fullName}</p>
        <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
          {t(`common.cities.${item.cityKey}`)}
          {clubLabel ? ` · ${clubLabel}` : ""}
        </p>
      </div>

      {levelLabel ? (
        <span
          className="hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide md:inline-flex"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {levelLabel}
        </span>
      ) : null}

      <div className="shrink-0 text-right">
        <p className="text-lg font-black leading-none" style={{ color: "var(--accent)" }}>{item.elo}</p>
        <p className="mt-1 hidden text-[10px] font-semibold uppercase sm:block" style={{ color: "var(--muted)" }}>
          {t("common.stats.elo")}
        </p>
      </div>

      <div className="hidden w-24 shrink-0 flex-col gap-1 sm:flex">
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--card-border)" }}>
          <div style={{ width: `${winRate}%`, height: "100%", background: "var(--accent)" }} />
        </div>
        <span className="text-right text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
          {formatPercent(winRate)}
        </span>
      </div>
    </Link>
  );
}

export function ClubCard({ item }: { item: Club }) {
  const { locale, t, text } = useI18n();
  const description = text(item.description);

  return (
    <SurfaceCard className="showcase-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">{t(`common.cities.${item.cityKey}`)}</span>
        <span className="text-sm font-semibold text-accent">{item.rating !== null ? item.rating.toFixed(1) : "-"}</span>
      </div>
      <div className="min-w-0">
        <h3 className="showcase-card-title text-xl font-semibold text-white">{text(item.name)}</h3>
        <p className="metric-copy mt-2 text-sm leading-6 text-muted">{description || "-"}</p>
      </div>
      <div className="showcase-card-metrics">
        <MetricTile label={t("common.stats.tables")} value={String(item.tables)} valueClassName="metric-value-compact" />
        <MetricTile label={t("nav.players")} value={String(item.playersCount)} valueClassName="metric-value-compact" />
        <MetricTile label={t("nav.tournaments")} value={String(item.tournamentsCount)} accent valueClassName="metric-value-compact" />
      </div>
      <div className="grid gap-2 text-sm text-muted">
        <p className="metric-meta-line">{normalizeMetricText(`${t("common.stats.address")}: ${text(item.address)}`)}</p>
        <p className="metric-meta-line">{normalizeMetricText(`${t("common.stats.workHours")}: ${text(item.workHours) || "-"}`)}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
        <Link className="button-primary inline-flex" href="/booking">
          {locale === "ru" ? "Забронировать" : locale === "uz" ? "Bron qilish" : "Book"}
        </Link>
        <Link className="button-secondary inline-flex" href={`/clubs/${item.id}`}>
          {t("commonUi.seeClub")}
        </Link>
      </div>
    </SurfaceCard>
  );
}

export function NewsCard({ item }: { item: NewsItem }) {
  const { t, text, formatDate } = useI18n();
  const excerpt = text(item.excerpt);

  return (
    <SurfaceCard className="showcase-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">{t(`common.categories.${item.categoryKey}`)}</span>
        <span className="text-xs uppercase tracking-[0.16em] text-muted">{formatDate(item.publishedAt)}</span>
      </div>
      <div>
        <h3 className="showcase-card-title text-xl font-semibold text-white">{text(item.title)}</h3>
        <p className="metric-copy mt-2 text-sm leading-6 text-muted">{excerpt || "-"}</p>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
        <p className="text-sm text-white/80">{t(`common.categories.${item.categoryKey}`)}</p>
        <Link className="button-secondary inline-flex" href={`/news/${item.id}`}>
          {t("commonUi.readArticle")}
        </Link>
      </div>
    </SurfaceCard>
  );
}

function makeBreakableText(value?: string | null) {
  return String(value || "-").replace(/[\u00A0\u202F]/g, " ");
}

function safeFormattedDate(value: string, formatDate: (value: string) => string) {
  if (Number.isNaN(new Date(value).getTime())) {
    return "Дата не указана";
  }

  return formatDate(value);
}
