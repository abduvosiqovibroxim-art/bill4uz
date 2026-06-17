"use client";

import { EmptyState } from "@/components/DataState";
import { useI18n } from "@/lib/i18n";
import { TournamentMatch } from "@/lib/types";

export function ScheduleTable({ matches }: { matches: TournamentMatch[] }) {
  const { locale, t, formatDate } = useI18n();

  if (matches.length === 0) {
    return <EmptyState message={t("tournamentCenter.schedule.empty")} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        {matches.map((match) => (
          <div key={match.id} className={`surface-card space-y-3 ${match.isBye ? "match-card-bye" : ""}`.trim()}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {t("tournamentCenter.bracket.match")} {match.matchNumber}
              </p>
              <span className={`bracket-status bracket-status-${match.status}`}>
                {t(`tournamentCenter.bracket.${match.status}`)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {formatPairing(match, t)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {roundLabel(match.roundNumber, locale)} / {t("tournamentCenter.schedule.tableLabel")} {match.tableNumber ?? "-"}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-muted">
              <span>{formatDate(match.scheduledAt)}</span>
              <span className="text-accent">{match.isBye ? t("tournamentCenter.bracket.byeWin") : formatScore(match.scoreA, match.scoreB)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="table-panel hidden overflow-x-auto md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("tournamentCenter.bracket.match")}</th>
              <th>{roundHeader(locale)}</th>
              <th>{t("tournamentCenter.participants.player")}</th>
              <th>{t("tournamentCenter.schedule.tableLabel")}</th>
              <th>{t("tournamentCenter.info.dateTime")}</th>
              <th>{t("tournamentCenter.schedule.statusLabel")}</th>
              <th>{t("tournamentCenter.results.label")}</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id}>
                <td>#{match.matchNumber}</td>
                <td>{roundLabel(match.roundNumber, locale)}</td>
                <td>{formatPairing(match, t)}</td>
                <td>{match.tableNumber ?? "-"}</td>
                <td>{formatDate(match.scheduledAt)}</td>
                <td>
                  <span className={`bracket-status bracket-status-${match.status}`}>
                    {t(`tournamentCenter.bracket.${match.status}`)}
                  </span>
                </td>
                <td className="text-accent">{match.isBye ? t("tournamentCenter.bracket.byeWin") : formatScore(match.scoreA, match.scoreB)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatPairing(match: TournamentMatch, t: (path: string) => string) {
  const fallback = match.isBye ? t("tournamentCenter.bracket.bye") : t("tournamentCenter.placeholders.tbd");
  return `${match.playerA?.fullName ?? fallback} / ${match.playerB?.fullName ?? fallback}`;
}

function roundHeader(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "Раунд" : locale === "uz" ? "Raund" : "Round";
}

function roundLabel(roundNumber: number, locale: "ru" | "uz" | "en") {
  return `${roundHeader(locale)} ${roundNumber}`;
}

function formatScore(scoreA: number | null, scoreB: number | null) {
  if (typeof scoreA !== "number" || typeof scoreB !== "number") {
    return "-";
  }

  return `${scoreA}:${scoreB}`;
}
