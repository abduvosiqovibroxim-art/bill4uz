"use client";

import { RankingEntry } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { SurfaceCard } from "./ui";

export function RankingTable({ entries }: { entries: RankingEntry[] }) {
  const { locale, t, formatPercent } = useI18n();

  return (
    <div className="overflow-x-auto rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{t("rankings.headers.place")}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{t("rankings.headers.player")}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{t("rankings.headers.city")}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{t("rankings.headers.points")}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{headerLabel("matches", locale)}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{headerLabel("wins", locale)}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{headerLabel("losses", locale)}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{t("rankings.headers.winRate")}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{headerLabel("prizes", locale)}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const player = entry.player;
            const total = player.wins + player.losses;
            const winRate = total > 0 ? (player.wins / total) * 100 : 0;
            const position = entry.position || index + 1;
            const isTopThree = position <= 3;

            return (
              <tr key={entry.id} className="transition-all hover:bg-opacity-50" style={{ borderBottom: "1px solid var(--card-border)", background: isTopThree ? "var(--emerald-soft)" : "transparent" }}>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm" style={{ background: isTopThree ? "var(--emerald)" : "var(--surface-strong)", color: isTopThree ? "var(--bg)" : "var(--text)" }}>
                    {position}
                  </div>
                </td>
                <td className="px-4 py-4 font-semibold" style={{ color: "var(--text)" }}>{player.fullName}</td>
                <td className="px-4 py-4" style={{ color: "var(--muted)" }}>{t(`common.cities.${player.cityKey || entry.cityKey}`)}</td>
                <td className="px-4 py-4 font-bold text-lg" style={{ color: "var(--accent)" }}>{entry.points}</td>
                <td className="px-4 py-4" style={{ color: "var(--text)" }}>{total}</td>
                <td className="px-4 py-4" style={{ color: "var(--emerald)" }}>{player.wins}</td>
                <td className="px-4 py-4" style={{ color: "var(--muted)" }}>{player.losses}</td>
                <td className="px-4 py-4 font-semibold" style={{ color: "var(--text)" }}>{formatPercent(winRate)}</td>
                <td className="px-4 py-4" style={{ color: "var(--accent)" }}>{player.tournamentWins}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function headerLabel(key: "matches" | "wins" | "losses" | "prizes", locale: "ru" | "uz" | "en") {
  const labels = {
    ru: {
      matches: "Матчи",
      wins: "Победы",
      losses: "Поражения",
      prizes: "Призовые места"
    },
    uz: {
      matches: "Matchlar",
      wins: "G'alabalar",
      losses: "Mag'lubiyatlar",
      prizes: "Sovrinli joylar"
    },
    en: {
      matches: "Matches",
      wins: "Wins",
      losses: "Losses",
      prizes: "Prize places"
    }
  } as const;

  return labels[locale][key];
}
