"use client";

import Link from "next/link";
import { EmptyState } from "@/components/DataState";
import { useI18n } from "@/lib/i18n";
import { TournamentResultEntry } from "@/lib/types";

export function ResultsTable({ results }: { results: TournamentResultEntry[] }) {
  const { t } = useI18n();

  if (results.length === 0) {
    return <EmptyState message={t("tournamentCenter.results.empty")} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        {results.map((entry) => (
          <div key={`${entry.player.id}-${entry.placement}`} className="surface-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="pill">
                {t("tournamentCenter.results.place")} #{entry.placement}
              </span>
              <span className="bracket-status bracket-status-finished">
                {t(`tournamentCenter.resultLabels.${entry.label}`)}
              </span>
            </div>
            <div>
              <Link href={`/players/${entry.player.id}`} className="text-base font-semibold text-white transition hover:text-accent">
                {entry.player.fullName}
              </Link>
              <p className="mt-1 text-sm text-muted">{entry.player.clubName ?? "-"}</p>
            </div>
            <p className="text-sm text-accent">{entry.rating}</p>
          </div>
        ))}
      </div>

      <div className="table-panel hidden overflow-x-auto md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("tournamentCenter.results.place")}</th>
              <th>{t("tournamentCenter.results.player")}</th>
              <th>{t("tournamentCenter.results.club")}</th>
              <th>{t("tournamentCenter.results.rating")}</th>
              <th>{t("tournamentCenter.results.label")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((entry) => (
              <tr key={`${entry.player.id}-${entry.placement}`}>
                <td>{entry.placement}</td>
                <td>
                  <Link href={`/players/${entry.player.id}`} className="font-medium text-white transition hover:text-accent">
                    {entry.player.fullName}
                  </Link>
                </td>
                <td>{entry.player.clubName ?? "-"}</td>
                <td className="text-accent">{entry.rating}</td>
                <td>{t(`tournamentCenter.resultLabels.${entry.label}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
