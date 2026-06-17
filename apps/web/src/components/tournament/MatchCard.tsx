"use client";

import { useI18n } from "@/lib/i18n";
import { TournamentMatch } from "@/lib/types";

export function MatchCard({
  match,
  onSelect,
  isSelected
}: {
  match: TournamentMatch;
  onSelect?: (matchId: string) => void;
  isSelected?: boolean;
}) {
  const { locale, t } = useI18n();
  const statusTone = compactStatusTone(match.status);
  const statusLabel = compactStatusLabel(match.status, locale);
  const hasAction = Boolean(onSelect);

  const rows = resolveRows(match, t("tournamentCenter.placeholders.tbd"));

  return (
    <article
      className={`bracket-match bracket-match-${statusTone}${match.isBye ? " bracket-match-bye" : ""}${isSelected ? " bracket-match-active" : ""}${hasAction ? " bracket-match-clickable" : ""}`}
      onClick={() => onSelect?.(match.id)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && onSelect) {
          event.preventDefault();
          onSelect(match.id);
        }
      }}
      role={hasAction ? "button" : undefined}
      tabIndex={hasAction ? 0 : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {t("tournamentCenter.bracket.match")} {match.matchNumber}
        </p>
        <span className={`bracket-status bracket-status-${statusTone}`}>{statusLabel}</span>
      </div>

      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`bracket-player-row${row.isWinner ? " bracket-player-row-winner" : ""}${row.isBye ? " bracket-player-row-bye" : ""}`}
            title={row.name}
          >
            <span className="bracket-player-name">{row.name}</span>
            {!row.isBye ? <span className="bracket-score">{row.score ?? "\u2014"}</span> : null}
          </div>
        ))}
      </div>

      {hasAction ? (
        <div className="mt-2">
          <button
            type="button"
            className="bracket-match-action"
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(match.id);
            }}
          >
            {resultActionLabel(locale)}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function resolveRows(match: TournamentMatch, emptyLabel: string) {
  if (match.isBye) {
    return [
      {
        key: "playerA",
        name: match.playerA?.fullName ?? match.playerB?.fullName ?? emptyLabel,
        score: null as number | null,
        isWinner: true,
        isBye: false
      },
      {
        key: "playerB",
        name: "BYE",
        score: null as number | null,
        isWinner: false,
        isBye: true
      }
    ] as const;
  }

  return [
    {
      key: "playerA",
      name: match.playerA?.fullName ?? emptyLabel,
      score: match.scoreA,
      isWinner: Boolean(match.playerA?.id && match.winnerId === match.playerA.id),
      isBye: false
    },
    {
      key: "playerB",
      name: match.playerB?.fullName ?? emptyLabel,
      score: match.scoreB,
      isWinner: Boolean(match.playerB?.id && match.winnerId === match.playerB.id),
      isBye: false
    }
  ] as const;
}

function compactStatusTone(status: TournamentMatch["status"]) {
  if (status === "finished") {
    return "finished";
  }

  if (status === "pending") {
    return "pending";
  }

  if (status === "live") {
    return "live";
  }

  return "ready";
}

function compactStatusLabel(status: TournamentMatch["status"], locale: "ru" | "uz" | "en") {
  const labels = {
    ru: {
      pending: "\u041e\u0436\u0438\u0434\u0430\u0435\u0442",
      ready: "\u0413\u043e\u0442\u043e\u0432",
      live: "\u0418\u0434\u0451\u0442",
      finished: "\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043d"
    },
    uz: {
      pending: "Kutilmoqda",
      ready: "Tayyor",
      live: "Jarayonda",
      finished: "Yakunlangan"
    },
    en: {
      pending: "Pending",
      ready: "Ready",
      live: "Live",
      finished: "Finished"
    }
  } as const;

  return labels[locale][status];
}

function resultActionLabel(locale: "ru" | "uz" | "en") {
  if (locale === "ru") {
    return "\u0412\u043d\u0435\u0441\u0442\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442";
  }

  if (locale === "uz") {
    return "Natijani kiritish";
  }

  return "Enter result";
}
