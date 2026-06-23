"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useTournamentStandingsQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import type { TournamentStandingEntry } from "@/lib/types";

type Locale = "ru" | "uz" | "en";

const labels = {
  title: { ru: "Турнирная таблица", uz: "Turnir jadvali", en: "Standings" },
  empty: { ru: "Результатов пока нет", uz: "Natijalar hali yo'q", en: "No results yet" },
  player: { ru: "Игрок", uz: "O'yinchi", en: "Player" },
  played: { ru: "И", uz: "O", en: "P" },
  wins: { ru: "В", uz: "G'", en: "W" },
  losses: { ru: "П", uz: "M", en: "L" },
  diff: { ru: "±", uz: "±", en: "±" },
  points: { ru: "Очки", uz: "Ochko", en: "Pts" }
} as const;

function pick(locale: Locale, value: { ru: string; uz: string; en: string }) {
  return value[locale] ?? value.en;
}

/** Standings rows can be supplied directly (group view) or fetched (round robin / swiss). */
export function StandingsList({ rows, locale }: { rows: TournamentStandingEntry[]; locale: Locale }) {
  const th = "px-3 py-2 text-xs font-bold uppercase";
  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}>
      <table className="w-full text-sm" style={{ color: "var(--text)" }}>
        <thead style={{ color: "var(--muted)" }}>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className={`${th} text-left`}>#</th>
            <th className={`${th} text-left`}>{pick(locale, labels.player)}</th>
            <th className={`${th} text-center`}>{pick(locale, labels.played)}</th>
            <th className={`${th} text-center`}>{pick(locale, labels.wins)}</th>
            <th className={`${th} text-center`}>{pick(locale, labels.losses)}</th>
            <th className={`${th} text-center`}>{pick(locale, labels.diff)}</th>
            <th className={`${th} text-center`}>{pick(locale, labels.points)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.participantId} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td className="px-3 py-2 font-bold" style={{ color: "var(--accent)" }}>{row.position}</td>
              <td className="px-3 py-2 font-medium">{row.name}</td>
              <td className="px-3 py-2 text-center" style={{ color: "var(--muted)" }}>{row.played}</td>
              <td className="px-3 py-2 text-center">{row.wins}</td>
              <td className="px-3 py-2 text-center" style={{ color: "var(--muted)" }}>{row.losses}</td>
              <td className="px-3 py-2 text-center" style={{ color: "var(--muted)" }}>
                {row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}
              </td>
              <td className="px-3 py-2 text-center font-black">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StandingsTable({ tournamentId }: { tournamentId: string }) {
  const { locale } = useI18n();
  const query = useTournamentStandingsQuery(tournamentId);

  if (query.isPending) {
    return <LoadingState />;
  }
  if (query.isError) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const rows = query.data?.standings ?? [];
  if (rows.length === 0) {
    return <EmptyState message={pick(locale as Locale, labels.empty)} />;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>{pick(locale as Locale, labels.title)}</h3>
      <StandingsList rows={rows} locale={locale as Locale} />
    </div>
  );
}
