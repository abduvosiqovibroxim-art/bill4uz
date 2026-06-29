"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ErrorState } from "@/components/DataState";
import { usePlayerQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { gradientFromString } from "@/lib/visuals";
import type { Locale, PlayerDetail, PlayerRecentMatch } from "@/lib/types";

const copy: Record<Locale, {
  back: string;
  id: string;
  worldRank: string;
  noRank: string;
  elo: string;
  mmr: string;
  winRate: string;
  winStreak: string;
  bestStreak: string;
  tournaments: string;
  tournamentWins: string;
  matches: string;
  wins: string;
  losses: string;
  favoriteFormat: string;
  level: string;
  form: string;
  recentMatches: string;
  achievements: string;
  history: string;
  empty: string;
  win: string;
  loss: string;
  allTime: string;
  vs: string;
}> = {
  ru: {
    back: "← Рейтинг", id: "ID игрока", worldRank: "Место в рейтинге", noRank: "Без рейтинга",
    elo: "ELO", mmr: "MMR", winRate: "Винрейт", winStreak: "Серия побед", bestStreak: "Лучшая серия",
    tournaments: "Турниры", tournamentWins: "Победы в турнирах", matches: "Матчи", wins: "Победы", losses: "Поражения",
    favoriteFormat: "Любимый формат", level: "Уровень", form: "Форма", recentMatches: "Последние матчи",
    achievements: "Достижения", history: "История турниров", empty: "Пока нет данных", win: "В", loss: "П",
    allTime: "За всё время", vs: "против"
  },
  uz: {
    back: "← Reyting", id: "O'yinchi ID", worldRank: "Reyting o'rni", noRank: "Reytingsiz",
    elo: "ELO", mmr: "MMR", winRate: "G'alaba %", winStreak: "G'alaba seriyasi", bestStreak: "Eng yaxshi seriya",
    tournaments: "Turnirlar", tournamentWins: "Turnir g'alabalari", matches: "Matchlar", wins: "G'alabalar", losses: "Mag'lubiyatlar",
    favoriteFormat: "Sevimli format", level: "Daraja", form: "Forma", recentMatches: "So'nggi matchlar",
    achievements: "Yutuqlar", history: "Turnirlar tarixi", empty: "Hozircha ma'lumot yo'q", win: "G", loss: "M",
    allTime: "Butun vaqt", vs: "qarshi"
  },
  en: {
    back: "← Rating", id: "Player ID", worldRank: "World rank", noRank: "Unranked",
    elo: "ELO", mmr: "MMR", winRate: "Win rate", winStreak: "Win streak", bestStreak: "Best streak",
    tournaments: "Tournaments", tournamentWins: "Tournament wins", matches: "Matches", wins: "Wins", losses: "Losses",
    favoriteFormat: "Favorite format", level: "Level", form: "Form", recentMatches: "Recent matches",
    achievements: "Achievements", history: "Tournament history", empty: "No data yet", win: "W", loss: "L",
    allTime: "All time", vs: "vs"
  }
};

export function PlayerProfilePageClient({ id }: { id: string }) {
  const { locale } = useI18n();
  const playerQuery = usePlayerQuery(id);

  if (playerQuery.isPending) {
    return <PlayerProfileSkeleton />;
  }

  if (playerQuery.isError) {
    return (
      <div className="container-shell py-16">
        <ErrorState onRetry={() => playerQuery.refetch()} />
      </div>
    );
  }

  if (!playerQuery.data) {
    return <PlayerNotFound locale={locale} />;
  }

  return <PlayerProfile player={playerQuery.data} />;
}

function PlayerProfile({ player }: { player: PlayerDetail }) {
  const { locale, t, text, formatNumber, formatPercent } = useI18n();
  const c = copy[locale];

  const matches = player.wins + player.losses;
  const handle = "@" + player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "@player";
  const favoriteFormat = player.disciplines[0] ?? "—";
  const avatar = player.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={player.avatarUrl}
      alt={player.fullName}
      className="h-28 w-28 shrink-0 rounded-3xl object-cover md:h-32 md:w-32"
    />
  ) : (
    <span
      className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl text-white md:h-32 md:w-32"
      style={{ backgroundImage: gradientFromString(player.fullName) }}
      aria-label={player.fullName}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2 opacity-90" aria-hidden="true">
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-3.31-3.58-6-8-6Z" />
      </svg>
    </span>
  );

  return (
    <div className="container-shell space-y-5 py-8 pb-16">
      <Link href="/rating" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
        {c.back}
      </Link>

      {/* Hero */}
      <section className="rounded-2xl p-6 md:p-8" style={surface}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {avatar}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black md:text-4xl" style={{ color: "var(--text)" }}>{player.fullName}</h1>
              <span className="pill inline-flex">{text(player.currentLevelLabel)}</span>
              {player.worldRank ? (
                <span className="pill inline-flex" style={{ color: "var(--accent)" }}>#{player.worldRank} {c.worldRank}</span>
              ) : null}
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{handle}</p>
            <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{c.id}: {player.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:text-right">
            <HeroStat label={c.elo} value={formatNumber(player.elo)} accent />
            <HeroStat label={c.winRate} value={formatPercent(player.winPercentage)} />
          </div>
        </div>
      </section>

      {/* Stat grid */}
      <section className="rounded-2xl p-5 md:p-6" style={surface}>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{c.allTime}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label={c.worldRank} value={player.worldRank ? `#${player.worldRank}` : c.noRank} />
          <StatCard label={c.mmr} value={formatNumber(player.mmr)} />
          <StatCard label={c.matches} value={formatNumber(matches)} />
          <StatCard label={c.wins} value={formatNumber(player.wins)} tone="win" />
          <StatCard label={c.losses} value={formatNumber(player.losses)} tone="loss" />
          <StatCard label={c.winStreak} value={`🔥 ${player.winStreak}`} />
          <StatCard label={c.bestStreak} value={String(player.bestWinStreak)} />
          <StatCard label={c.tournaments} value={formatNumber(player.tournamentsPlayed)} />
          <StatCard label={c.tournamentWins} value={`🏆 ${player.tournamentWins}`} />
          <StatCard label={c.favoriteFormat} value={favoriteFormat} />
        </div>
      </section>

      {/* Recent form */}
      {player.recentMatches.length > 0 ? (
        <section className="rounded-2xl p-5 md:p-6" style={surface}>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>{c.form}</h2>
          <div className="flex flex-wrap gap-2">
            {player.recentMatches.map((match) => (
              <span
                key={match.id}
                title={`${match.opponentName} · ${match.scoreFor ?? "-"}:${match.scoreAgainst ?? "-"}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
                style={{ background: match.isWin ? "var(--accent)" : "var(--danger, #d64545)" }}
              >
                {match.isWin ? c.win : c.loss}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent matches */}
        <section className="rounded-2xl p-5 md:p-6" style={surface}>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>{c.recentMatches}</h2>
          {player.recentMatches.length === 0 ? (
            <Empty text={c.empty} />
          ) : (
            <div className="space-y-2">
              {player.recentMatches.map((match) => (
                <RecentMatchRow key={match.id} match={match} vs={c.vs} winLabel={c.win} lossLabel={c.loss} />
              ))}
            </div>
          )}
        </section>

        {/* Achievements + history */}
        <section className="space-y-5">
          <div className="rounded-2xl p-5 md:p-6" style={surface}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>{c.achievements}</h2>
            {player.achievements.length === 0 ? (
              <Empty text={c.empty} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {player.achievements.map((achievement, index) => (
                  <span key={index} className="pill">🏅 {text(achievement)}</span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5 md:p-6" style={surface}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>{c.history}</h2>
            {player.tournamentHistory.length === 0 ? (
              <Empty text={c.empty} />
            ) : (
              <div className="space-y-2">
                {player.tournamentHistory.slice(0, 8).map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
                    className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    style={{ color: "var(--muted)", border: "1px solid var(--card-border)" }}
                  >
                    <span style={{ color: "var(--text)" }}>{text(tournament.title)}</span>
                    {" · "}{t(`common.disciplines.${tournament.disciplineKey}`)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RecentMatchRow({ match, vs, winLabel, lossLabel }: { match: PlayerRecentMatch; vs: string; winLabel: string; lossLabel: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ border: "1px solid var(--card-border)" }}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-black text-white"
        style={{ background: match.isWin ? "var(--accent)" : "var(--danger, #d64545)" }}
      >
        {match.isWin ? winLabel : lossLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm" style={{ color: "var(--muted)" }}>
          {vs}{" "}
          {match.opponentId ? (
            <Link href={`/players/${match.opponentId}`} className="font-semibold hover:underline" style={{ color: "var(--text)" }}>
              {match.opponentName}
            </Link>
          ) : (
            <span className="font-semibold" style={{ color: "var(--text)" }}>{match.opponentName}</span>
          )}
        </p>
        {match.tournamentTitle ? <p className="truncate text-xs" style={{ color: "var(--muted)" }}>{match.tournamentTitle}</p> : null}
      </div>
      <span className="shrink-0 font-mono text-sm font-bold" style={{ color: "var(--text)" }}>
        {match.scoreFor ?? "-"}:{match.scoreAgainst ?? "-"}
      </span>
    </div>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-2xl font-black md:text-3xl" style={{ color: accent ? "var(--accent)" : "var(--text)" }}>{value}</p>
      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  const color = tone === "win" ? "var(--accent)" : tone === "loss" ? "var(--danger, #d64545)" : "var(--text)";
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)" }}>
      <p className="truncate text-lg font-black" style={{ color }}>{value}</p>
      <p className="mt-0.5 truncate text-xs" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm" style={{ color: "var(--muted)" }}>{text}</p>;
}

function PlayerProfileSkeleton() {
  const block = (style?: CSSProperties): ReactNode => (
    <div className="animate-pulse rounded-xl" style={{ background: "var(--surface-soft)", ...style }} />
  );
  return (
    <div className="container-shell space-y-5 py-8 pb-16">
      <div className="h-4 w-24 animate-pulse rounded" style={{ background: "var(--surface-soft)" }} />
      <section className="rounded-2xl p-6 md:p-8" style={surface}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="h-28 w-28 shrink-0 animate-pulse rounded-3xl md:h-32 md:w-32" style={{ background: "var(--surface-soft)" }} />
          <div className="flex-1 space-y-3">
            {block({ height: "2rem", width: "16rem" })}
            {block({ height: "1rem", width: "8rem" })}
            {block({ height: "0.8rem", width: "12rem" })}
          </div>
          <div className="space-y-3">{block({ height: "3rem", width: "8rem" })}</div>
        </div>
      </section>
      <section className="rounded-2xl p-5 md:p-6" style={surface}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl" style={{ background: "var(--surface-soft)" }} />
          ))}
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl" style={{ background: "var(--surface-soft)" }} />
        <div className="h-64 animate-pulse rounded-2xl" style={{ background: "var(--surface-soft)" }} />
      </div>
    </div>
  );
}

function PlayerNotFound({ locale }: { locale: Locale }) {
  const labels = {
    ru: { code: "404", title: "Игрок не найден", text: "Такого игрока не существует или он был удалён.", action: "К рейтингу" },
    uz: { code: "404", title: "O'yinchi topilmadi", text: "Bunday o'yinchi mavjud emas yoki o'chirilgan.", action: "Reytingga" },
    en: { code: "404", title: "Player not found", text: "This player does not exist or was removed.", action: "To rating" }
  }[locale];
  return (
    <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-7xl font-black md:text-8xl" style={{ color: "var(--accent)" }}>{labels.code}</p>
      <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--text)" }}>{labels.title}</h1>
      <p className="mt-2 max-w-md text-sm" style={{ color: "var(--muted)" }}>{labels.text}</p>
      <Link
        href="/rating"
        className="mt-6 rounded-lg px-5 py-2.5 text-sm font-bold transition-all hover:scale-105"
        style={{ background: "var(--accent)", color: "var(--bg)" }}
      >
        {labels.action}
      </Link>
    </div>
  );
}

const surface: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-soft)"
};
