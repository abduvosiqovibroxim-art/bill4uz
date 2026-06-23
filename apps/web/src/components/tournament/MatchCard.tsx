"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { TournamentMatch } from "@/lib/types";

export function MatchCard({
  match,
  onSelect,
  isSelected,
  placeRange
}: {
  match: TournamentMatch;
  onSelect?: (matchId: string) => void;
  isSelected?: boolean;
  placeRange?: string | null;
}) {
  const { locale, t } = useI18n();
  const statusTone = compactStatusTone(match.status);
  const hasAction = Boolean(onSelect);
  const rows = resolveRows(match, t("tournamentCenter.placeholders.tbd"));

  const title = match.isThirdPlace
    ? thirdPlaceLabel(locale)
    : match.isFinalReset
      ? finalResetLabel(locale)
      : `#${match.matchNumber}`;

  const metaLeft = [
    typeof match.tableNumber === "number" ? `${tableLabel(locale)} ${match.tableNumber}` : null,
    formatMeta(match.scheduledAt)
  ]
    .filter(Boolean)
    .join(" · ");

  const showFoot = Boolean(placeRange) || Boolean(match.loserTo);

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
      <div className="bm-head">
        <span className="bm-meta" title={metaLeft}>{metaLeft}</span>
        <span className="bm-num">{title}</span>
      </div>
      <div className="bm-rows">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`bm-row${row.isWinner ? " bm-row-winner" : ""}${row.isBye ? " bm-row-bye" : ""}`}
            title={row.name}
          >
            {flagCode(row.countryKey) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="bm-flag"
                src={`https://flagcdn.com/32x24/${flagCode(row.countryKey)}.png`}
                alt=""
                width={16}
                height={12}
                loading="lazy"
              />
            ) : (
              <span className="bm-flag bm-flag-empty" aria-hidden="true" />
            )}
            {row.playerId && !row.isBye ? (
              <Link
                href={`/players/${row.playerId}`}
                className="bm-name bm-name-link"
                title={openProfileLabel(locale)}
                aria-label={`${openProfileLabel(locale)}: ${row.name}`}
                onClick={(event) => event.stopPropagation()}
              >
                {row.name}
              </Link>
            ) : (
              <span className="bm-name">{row.name}</span>
            )}
            <span className="bm-score">{row.isBye ? "" : row.score ?? "—"}</span>
          </div>
        ))}
      </div>
      {showFoot ? (
        <div className="bm-foot">
          {placeRange ? <span className="bm-place">{placeLabel(locale)} {placeRange}</span> : <span />}
          {match.loserTo ? <span className="bm-loser-inline">{loserToLabel(locale)} {match.loserTo}</span> : null}
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
        playerId: match.playerA?.id ?? match.playerB?.id ?? null,
        seed: match.playerA?.seed ?? match.playerB?.seed ?? null,
        countryKey: match.playerA?.countryKey ?? match.playerB?.countryKey ?? null,
        score: null as number | null,
        isWinner: true,
        isBye: false
      },
      {
        key: "playerB",
        name: "BYE",
        playerId: null as string | null,
        seed: null,
        countryKey: null,
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
      playerId: match.playerA?.id ?? null,
      seed: match.playerA?.seed ?? null,
      countryKey: match.playerA?.countryKey ?? null,
      score: match.scoreA,
      isWinner: Boolean(match.playerA?.id && match.winnerId === match.playerA.id),
      isBye: false
    },
    {
      key: "playerB",
      name: match.playerB?.fullName ?? emptyLabel,
      playerId: match.playerB?.id ?? null,
      seed: match.playerB?.seed ?? null,
      countryKey: match.playerB?.countryKey ?? null,
      score: match.scoreB,
      isWinner: Boolean(match.playerB?.id && match.winnerId === match.playerB.id),
      isBye: false
    }
  ] as const;
}

function flagCode(countryKey?: string | null) {
  if (!countryKey) {
    return "";
  }
  const code = countryKey.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 2);
  return code.length === 2 ? code : "";
}

function formatMeta(scheduledAt: string) {
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(2)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function tableLabel(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "Стол" : locale === "uz" ? "Stol" : "Table";
}

function openProfileLabel(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "Открыть профиль игрока" : locale === "uz" ? "O'yinchi profilini ochish" : "Open player profile";
}

function placeLabel(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "место" : locale === "uz" ? "o'rin" : "place";
}

function thirdPlaceLabel(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "3-е место" : locale === "uz" ? "3-oʼrin" : "3rd place";
}

function finalResetLabel(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "Реванш" : locale === "uz" ? "Revansh" : "Reset";
}

function loserToLabel(locale: "ru" | "uz" | "en") {
  return locale === "ru" ? "проиграл на" : locale === "uz" ? "yutqazdi" : "lost at";
}
