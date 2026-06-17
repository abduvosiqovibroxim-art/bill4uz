"use client";

import Link from "next/link";
import { EmptyState } from "@/components/DataState";
import { useI18n } from "@/lib/i18n";
import { TournamentParticipant } from "@/lib/types";

type ParticipantBadge = {
  label: string;
  className: string;
};

export function ParticipantsTable({ participants }: { participants: TournamentParticipant[] }) {
  const { t, locale } = useI18n();

  if (participants.length === 0) {
    return <EmptyState message={locale === "ru" ? "Нет участников" : locale === "uz" ? "Ishtirokchilar yo'q" : "No participants"} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        {participants.map((participant) => {
          const badge = participantStatusBadge(participant.status, locale);

          return (
            <div key={participant.id} className="surface-card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="pill">
                  {t("tournamentCenter.participants.seed")} #{participant.seed}
                </span>
                <span className={badge.className}>{badge.label}</span>
              </div>
              <div>
                <Link href={`/players/${participant.id}`} className="text-base font-semibold text-white transition hover:text-accent">
                  {participant.fullName}
                </Link>
                <p className="mt-1 text-sm text-muted">{participant.clubName ?? "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted">
                <p>{t(`common.cities.${participant.cityKey}`)}</p>
                <p className="text-accent">{participant.rating}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="table-panel hidden overflow-x-auto md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("tournamentCenter.participants.seed")}</th>
              <th>{t("tournamentCenter.participants.player")}</th>
              <th>{t("tournamentCenter.participants.club")}</th>
              <th>{t("tournamentCenter.participants.city")}</th>
              <th>{t("tournamentCenter.participants.rating")}</th>
              <th>{t("tournamentCenter.participants.status")}</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => {
              const badge = participantStatusBadge(participant.status, locale);

              return (
                <tr key={participant.id}>
                  <td>{participant.seed}</td>
                  <td>
                    <Link href={`/players/${participant.id}`} className="font-medium text-white transition hover:text-accent">
                      {participant.fullName}
                    </Link>
                  </td>
                  <td>{participant.clubName ?? "-"}</td>
                  <td>{t(`common.cities.${participant.cityKey}`)}</td>
                  <td className="text-accent">{participant.rating}</td>
                  <td>
                    <span className={badge.className}>{badge.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function participantStatusBadge(status: TournamentParticipant["status"], locale: "ru" | "uz" | "en"): ParticipantBadge {
  const map: Record<TournamentParticipant["status"], ParticipantBadge> = {
    active: {
      label: locale === "ru" ? "Участник" : locale === "uz" ? "Ishtirokchi" : "Participant",
      className: "bracket-status bracket-status-ready"
    },
    eliminated: {
      label: locale === "ru" ? "Выбыл" : locale === "uz" ? "Eliminatsiya" : "Eliminated",
      className: "bracket-status bracket-status-pending"
    },
    winner: {
      label: locale === "ru" ? "Чемпион" : locale === "uz" ? "Chempion" : "Champion",
      className: "bracket-status bracket-status-finished"
    },
    finalist: {
      label: locale === "ru" ? "Финалист" : locale === "uz" ? "Finalchi" : "Finalist",
      className: "bracket-status bracket-status-finished"
    },
    semifinalist: {
      label: locale === "ru" ? "Полуфиналист" : locale === "uz" ? "Yarim finalchi" : "Semifinalist",
      className: "bracket-status bracket-status-finished"
    }
  };

  return map[status];
}
