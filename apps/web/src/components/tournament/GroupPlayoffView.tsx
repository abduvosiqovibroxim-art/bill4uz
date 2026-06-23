"use client";

import { useI18n } from "@/lib/i18n";
import type { LocalizedText, TournamentBracketRound, TournamentDetail, TournamentMatch, TournamentStandingEntry } from "@/lib/types";
import { StandingsList } from "./StandingsTable";
import { TournamentBracket } from "./TournamentBracket";

type Locale = "ru" | "uz" | "en";

const labels = {
  groups: { ru: "Групповой этап", uz: "Guruh bosqichi", en: "Group stage" },
  group: { ru: "Группа", uz: "Guruh", en: "Group" },
  playoff: { ru: "Плей-офф", uz: "Pley-off", en: "Playoff" },
  playoffPending: {
    ru: "Плей-офф начнётся после завершения групп",
    uz: "Pley-off guruhlar tugagach boshlanadi",
    en: "Playoff starts once the groups finish"
  }
} as const;

function pick(locale: Locale, value: { ru: string; uz: string; en: string }) {
  return value[locale] ?? value.en;
}

const GROUP_LETTERS = "ABCDEFGHIJKL";

function computeGroupStandings(matches: TournamentMatch[]): Map<number, TournamentStandingEntry[]> {
  interface Row {
    name: string;
    seed: number;
    played: number;
    wins: number;
    losses: number;
    points: number;
    scoreFor: number;
    scoreAgainst: number;
  }
  const groups = new Map<number, Map<string, Row>>();

  const ensure = (groupIndex: number, id: string, name: string, seed: number) => {
    const table = groups.get(groupIndex) ?? new Map<string, Row>();
    groups.set(groupIndex, table);
    if (!table.has(id)) {
      table.set(id, { name, seed, played: 0, wins: 0, losses: 0, points: 0, scoreFor: 0, scoreAgainst: 0 });
    }
    return table.get(id)!;
  };

  for (const match of matches) {
    if (match.groupIndex === null) {
      continue;
    }
    if (match.playerA) {
      ensure(match.groupIndex, match.playerA.id, match.playerA.fullName, match.playerA.seed ?? 9999);
    }
    if (match.playerB) {
      ensure(match.groupIndex, match.playerB.id, match.playerB.fullName, match.playerB.seed ?? 9999);
    }
    if (match.status !== "finished" || !match.winnerId || !match.playerA || !match.playerB) {
      continue;
    }
    const table = groups.get(match.groupIndex)!;
    const home = table.get(match.playerA.id)!;
    const away = table.get(match.playerB.id)!;
    const homeScore = match.scoreA ?? 0;
    const awayScore = match.scoreB ?? 0;
    home.played += 1;
    away.played += 1;
    home.scoreFor += homeScore;
    home.scoreAgainst += awayScore;
    away.scoreFor += awayScore;
    away.scoreAgainst += homeScore;
    if (match.winnerId === match.playerA.id) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.winnerId === match.playerB.id) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    }
  }

  const result = new Map<number, TournamentStandingEntry[]>();
  for (const [groupIndex, table] of groups) {
    const rows = [...table.entries()]
      .map(([participantId, row]) => ({
        participantId,
        name: row.name,
        seed: row.seed,
        played: row.played,
        wins: row.wins,
        losses: row.losses,
        points: row.points,
        scoreFor: row.scoreFor,
        scoreAgainst: row.scoreAgainst,
        scoreDiff: row.scoreFor - row.scoreAgainst
      }))
      .sort((a, b) => b.points - a.points || b.scoreDiff - a.scoreDiff || b.wins - a.wins || a.seed - b.seed)
      .map((row, index) => ({ ...row, position: index + 1 }));
    result.set(groupIndex, rows);
  }
  return result;
}

function buildPlayoffRounds(matches: TournamentMatch[]): TournamentBracketRound[] {
  const playoff = matches.filter((match) => match.groupIndex === null);
  const byKey = new Map<string, TournamentBracketRound>();
  for (const match of playoff) {
    const existing = byKey.get(match.roundKey);
    const label: LocalizedText = { ru: match.roundKey, uz: match.roundKey, en: match.roundKey };
    if (existing) {
      existing.matches.push(match);
    } else {
      byKey.set(match.roundKey, {
        id: match.roundKey,
        label,
        phase: match.phase,
        roundNumber: match.roundNumber,
        placeRange: null,
        matches: [match]
      });
    }
  }
  return [...byKey.values()];
}

export function GroupPlayoffView({ tournament }: { tournament: TournamentDetail }) {
  const { locale } = useI18n();
  const loc = locale as Locale;
  const groupStandings = computeGroupStandings(tournament.matches);
  const playoffRounds = buildPlayoffRounds(tournament.matches);
  const sortedGroups = [...groupStandings.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>{pick(loc, labels.groups)}</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedGroups.map(([groupIndex, rows]) => (
            <div key={groupIndex} className="space-y-2">
              <h4 className="text-sm font-bold" style={{ color: "var(--muted)" }}>
                {pick(loc, labels.group)} {GROUP_LETTERS[groupIndex] ?? groupIndex + 1}
              </h4>
              <StandingsList rows={rows} locale={loc} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>{pick(loc, labels.playoff)}</h3>
        {playoffRounds.length > 0 ? (
          <div className="tournament-grid-fullwidth">
            <TournamentBracket rounds={playoffRounds} />
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>{pick(loc, labels.playoffPending)}</p>
        )}
      </section>
    </div>
  );
}
