"use client";

import { EmptyState } from "@/components/DataState";
import { useI18n } from "@/lib/i18n";
import { TournamentBracketRound } from "@/lib/types";
import { BracketRound } from "./BracketRound";
import { CSSProperties } from "react";

export function TournamentBracket({
  rounds,
  onMatchSelect,
  selectedMatchId
}: {
  rounds: TournamentBracketRound[];
  onMatchSelect?: (matchId: string) => void;
  selectedMatchId?: string | null;
}) {
  const { t } = useI18n();

  if (rounds.length === 0) {
    return <EmptyState message={t("tournamentCenter.bracket.empty")} />;
  }

  const orderedRounds = [...rounds].sort((left, right) => {
    const phaseDelta = phaseWeight(left.phase) - phaseWeight(right.phase);
    if (phaseDelta !== 0) {
      return phaseDelta;
    }

    return left.roundNumber - right.roundNumber;
  });
  const baseMatches = Math.max(orderedRounds[0]?.matches.length ?? 0, 1);
  const boardStyle = {
    "--round-base-matches": String(baseMatches)
  } as CSSProperties;

  return (
    <div className="bracket-board" style={boardStyle}>
      <div className="bracket-scroll">
        {orderedRounds.map((round, index) => (
          <BracketRound
            key={round.id}
            round={round}
            roundIndex={index}
            totalRounds={orderedRounds.length}
            baseMatches={baseMatches}
            onMatchSelect={onMatchSelect}
            selectedMatchId={selectedMatchId ?? null}
          />
        ))}
      </div>
    </div>
  );
}

function phaseWeight(phase: TournamentBracketRound["phase"]) {
  switch (phase) {
    case "upper":
      return 0;
    case "lower":
      return 1;
    default:
      return 2;
  }
}
