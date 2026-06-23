"use client";

import { useI18n } from "@/lib/i18n";
import { TournamentBracketRound } from "@/lib/types";
import { CSSProperties } from "react";
import { MatchCard } from "./MatchCard";

export function BracketRound({
  round,
  roundIndex,
  totalRounds,
  baseMatches,
  onMatchSelect,
  selectedMatchId
}: {
  round: TournamentBracketRound;
  roundIndex: number;
  totalRounds: number;
  baseMatches: number;
  onMatchSelect?: (matchId: string) => void;
  selectedMatchId: string | null;
}) {
  const { locale, text } = useI18n();
  const matches = [...round.matches].sort((left, right) => left.matchNumber - right.matchNumber);
  const multiplier = resolveRoundMultiplier(baseMatches, matches.length);
  const slotOffset = (multiplier - 1) / 2;
  const isFirstRound = roundIndex === 0;
  const isLastRound = roundIndex === totalRounds - 1;
  const roundStyle = {
    "--round-index": String(roundIndex),
    "--round-multiplier": String(multiplier)
  } as CSSProperties;

  return (
    <section className="bracket-round" style={roundStyle}>
      <div className="bracket-round-head">
        <h3 className="text-sm font-semibold text-white">{toCompactRoundTitle(round, locale, text(round.label))}</h3>
        {round.placeRange ? (
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
            {locale === "ru" ? "Места" : locale === "uz" ? "O'rinlar" : "Places"} {round.placeRange}
          </span>
        ) : null}
      </div>

      <div className="bracket-round-content">
        {matches.map((match, matchIndex) => {
          const slotStyle = {
            "--match-index": String(matchIndex),
            "--slot-offset": String(slotOffset)
          } as CSSProperties;
          const slotClasses = [
            "bracket-match-slot",
            isFirstRound ? "" : "bracket-match-slot-has-prev",
            isLastRound ? "" : "bracket-match-slot-has-next"
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={match.id} className={slotClasses} style={slotStyle}>
              {!isFirstRound ? <span className="bracket-connector bracket-connector-left-h" aria-hidden="true" /> : null}
              {!isFirstRound ? <span className="bracket-connector bracket-connector-left-v" aria-hidden="true" /> : null}
              {!isLastRound ? <span className="bracket-connector bracket-connector-right-h" aria-hidden="true" /> : null}
              <MatchCard match={match} onSelect={onMatchSelect} isSelected={selectedMatchId === match.id} placeRange={round.placeRange} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function resolveRoundMultiplier(baseMatches: number, roundMatches: number) {
  if (roundMatches <= 0) {
    return 1;
  }

  const ratio = baseMatches / roundMatches;
  if (!Number.isFinite(ratio) || ratio < 1) {
    return 1;
  }

  return Math.max(1, Math.round(ratio));
}

function toCompactRoundTitle(
  round: TournamentBracketRound,
  locale: "ru" | "uz" | "en",
  fallback: string
) {
  const roundWord = locale === "ru" ? "Раунд" : locale === "uz" ? "Raund" : "Round";

  // Lower bracket: never use single-elimination "semifinal/final" heuristics — those
  // depend on match counts and mislabel losers-bracket rounds. Number them plainly.
  if (round.phase === "lower") {
    return `${roundWord} ${round.roundNumber}`;
  }

  // Finals section groups the grand final, reset and 3rd-place match together.
  if (round.phase === "final") {
    return locale === "ru" ? "Финал" : "Final";
  }

  const normalized = fallback.trim().toLowerCase();

  if (/^\d+\s*\/\s*\d+$/.test(normalized)) {
    return normalized.replace(/\s+/g, "");
  }

  if (
    normalized.includes("semi") ||
    normalized.includes("\u043f\u043e\u043b\u0443\u0444\u0438\u043d") ||
    normalized.includes("yarim")
  ) {
    return locale === "ru" ? "\u041f\u043e\u043b\u0443\u0444\u0438\u043d\u0430\u043b" : locale === "uz" ? "Yarim final" : "Semifinal";
  }

  if (
    normalized.includes("quarter") ||
    normalized.includes("\u0447\u0435\u0442\u0432\u0435\u0440\u0442\u044c") ||
    normalized.includes("chorak")
  ) {
    return "1/4";
  }

  if (
    normalized === "final" ||
    normalized.includes("\u0444\u0438\u043d\u0430\u043b")
  ) {
    return locale === "ru" ? "\u0424\u0438\u043d\u0430\u043b" : "Final";
  }

  if (round.matches.length === 1) {
    return locale === "ru" ? "\u0424\u0438\u043d\u0430\u043b" : "Final";
  }

  if (round.matches.length === 2) {
    return locale === "ru" ? "\u041f\u043e\u043b\u0443\u0444\u0438\u043d\u0430\u043b" : locale === "uz" ? "Yarim final" : "Semifinal";
  }

  if (round.matches.length >= 4) {
    return `1/${round.matches.length * 2}`;
  }

  return fallback.trim() || `${locale === "ru" ? "\u0420\u0430\u0443\u043d\u0434" : locale === "uz" ? "Raund" : "Round"} ${round.roundNumber}`;
}
