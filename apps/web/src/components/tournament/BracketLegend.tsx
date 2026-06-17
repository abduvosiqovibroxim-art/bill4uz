"use client";

import { useI18n } from "@/lib/i18n";
import { MatchStatus } from "@/lib/types";

const statuses: MatchStatus[] = ["pending", "ready", "live", "finished"];

export function BracketLegend() {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="pill">{t("tournamentCenter.bracket.legend")}</span>
      {statuses.map((status) => (
        <span key={status} className={`bracket-status bracket-status-${status}`}>
          {t(`tournamentCenter.bracket.${status}`)}
        </span>
      ))}
      <span className="pill pill-bye">{t("tournamentCenter.bracket.bye")}</span>
    </div>
  );
}
