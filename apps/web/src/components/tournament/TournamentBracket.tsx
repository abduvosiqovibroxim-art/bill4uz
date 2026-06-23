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

  const sortByRound = (list: TournamentBracketRound[]) =>
    [...list].sort((left, right) => left.roundNumber - right.roundNumber);

  const upper = sortByRound(rounds.filter((round) => round.phase === "upper"));
  const lower = sortByRound(rounds.filter((round) => round.phase === "lower"));
  const final = sortByRound(rounds.filter((round) => round.phase === "final"));

  // Double elimination: render the winners bracket, losers bracket and finals as
  // separate stacked sections so the structure reads top-to-bottom like a real bracket.
  if (lower.length > 0) {
    return (
      <div className="bracket-sections">
        <BracketSection title={t("tournamentCenter.bracket.upper")} rounds={upper} onMatchSelect={onMatchSelect} selectedMatchId={selectedMatchId ?? null} />
        <BracketSection title={t("tournamentCenter.bracket.lower")} rounds={lower} onMatchSelect={onMatchSelect} selectedMatchId={selectedMatchId ?? null} />
        {final.length > 0 ? (
          <BracketSection title={t("tournamentCenter.bracket.final")} rounds={final} onMatchSelect={onMatchSelect} selectedMatchId={selectedMatchId ?? null} />
        ) : null}
      </div>
    );
  }

  // Single elimination / other systems: one continuous board.
  const orderedRounds = [...upper, ...lower, ...final];
  return <BracketBoard rounds={orderedRounds} onMatchSelect={onMatchSelect} selectedMatchId={selectedMatchId ?? null} />;
}

function BracketSection({
  title,
  rounds,
  onMatchSelect,
  selectedMatchId
}: {
  title: string;
  rounds: TournamentBracketRound[];
  onMatchSelect?: (matchId: string) => void;
  selectedMatchId: string | null;
}) {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <section className="bracket-section">
      <h3 className="bracket-section-title">{title}</h3>
      <BracketBoard rounds={rounds} onMatchSelect={onMatchSelect} selectedMatchId={selectedMatchId} />
    </section>
  );
}

function BracketBoard({
  rounds,
  onMatchSelect,
  selectedMatchId
}: {
  rounds: TournamentBracketRound[];
  onMatchSelect?: (matchId: string) => void;
  selectedMatchId: string | null;
}) {
  const baseMatches = Math.max(rounds[0]?.matches.length ?? 0, 1);
  const boardStyle = {
    "--round-base-matches": String(baseMatches)
  } as CSSProperties;

  return (
    <div className="bracket-board" style={boardStyle}>
      <div className="bracket-scroll">
        {rounds.map((round, index) => (
          <BracketRound
            key={round.id}
            round={round}
            roundIndex={index}
            totalRounds={rounds.length}
            baseMatches={baseMatches}
            onMatchSelect={onMatchSelect}
            selectedMatchId={selectedMatchId}
          />
        ))}
      </div>
    </div>
  );
}
