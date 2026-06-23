"use client";

import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useResolveDisputeMutation, useTournamentDisputesQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import type { DisputeEntry } from "@/lib/types";
import { GlowButton, NoticePanel, SurfaceCard } from "../ui";

type Locale = "ru" | "uz" | "en";

const L = {
  title: { ru: "Жалобы на результаты", uz: "Natija shikoyatlari", en: "Result disputes" },
  hint: {
    ru: "Игроки могут оспорить результат сыгранного матча. Рассмотрите и примите решение.",
    uz: "O'yinchilar natijani e'tiroz qilishi mumkin. Ko'rib chiqing.",
    en: "Players can dispute a played match result. Review and decide."
  },
  empty: { ru: "Жалоб нет.", uz: "Shikoyatlar yo'q.", en: "No disputes." },
  match: { ru: "Матч", uz: "Match", en: "Match" },
  pending: { ru: "На рассмотрении", uz: "Ko'rib chiqilmoqda", en: "Pending" },
  upheld: { ru: "Удовлетворена", uz: "Qondirildi", en: "Upheld" },
  rejected: { ru: "Отклонена", uz: "Rad etildi", en: "Rejected" },
  uphold: { ru: "Удовлетворить", uz: "Qondirish", en: "Uphold" },
  reject: { ru: "Отклонить", uz: "Rad etish", en: "Reject" },
  resolved: { ru: "Жалоба рассмотрена.", uz: "Shikoyat ko'rib chiqildi.", en: "Dispute resolved." },
  error: { ru: "Не удалось выполнить действие.", uz: "Amal bajarilmadi.", en: "Action failed." }
} as const;

function pick(locale: Locale, value: { ru: string; uz: string; en: string }) {
  return value[locale] ?? value.en;
}

function statusLabel(locale: Locale, status: DisputeEntry["status"]) {
  if (status === "UPHELD") return pick(locale, L.upheld);
  if (status === "REJECTED") return pick(locale, L.rejected);
  return pick(locale, L.pending);
}

export function DisputesPanel({ tournamentId }: { tournamentId: string }) {
  const { locale } = useI18n();
  const loc = locale as Locale;
  const query = useTournamentDisputesQuery(tournamentId);
  const resolveMutation = useResolveDisputeMutation(tournamentId);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function resolve(disputeId: string, status: "UPHELD" | "REJECTED") {
    try {
      await resolveMutation.mutateAsync({ disputeId, status });
      setFeedback(pick(loc, L.resolved));
    } catch {
      setFeedback(pick(loc, L.error));
    }
  }

  const disputes = query.data ?? [];

  return (
    <SurfaceCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black" style={{ color: "var(--text)" }}>{pick(loc, L.title)}</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{pick(loc, L.hint)}</p>
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : disputes.length === 0 ? (
          <EmptyState message={pick(loc, L.empty)} />
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => {
              const isPending = dispute.status === "PENDING";
              return (
                <div
                  key={dispute.id}
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      {pick(loc, L.match)} #{dispute.match?.matchNumber ?? "?"}
                    </span>
                    <span
                      className="text-xs font-black px-2 py-1 rounded-lg"
                      style={{
                        color: isPending ? "var(--danger)" : "var(--muted)",
                        border: "1px solid var(--card-border)"
                      }}
                    >
                      {statusLabel(loc, dispute.status)}
                    </span>
                  </div>
                  <p className="text-sm mb-1" style={{ color: "var(--text)" }}>{dispute.reason}</p>
                  {dispute.filedBy?.email ? (
                    <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{dispute.filedBy.email}</p>
                  ) : null}
                  {isPending ? (
                    <div className="flex gap-2">
                      <GlowButton variant="primary" onClick={() => resolve(dispute.id, "UPHELD")} disabled={resolveMutation.isPending}>
                        {pick(loc, L.uphold)}
                      </GlowButton>
                      <GlowButton variant="secondary" onClick={() => resolve(dispute.id, "REJECTED")} disabled={resolveMutation.isPending}>
                        {pick(loc, L.reject)}
                      </GlowButton>
                    </div>
                  ) : dispute.resolution ? (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{dispute.resolution}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {feedback ? <NoticePanel tone="default">{feedback}</NoticePanel> : null}
      </div>
    </SurfaceCard>
  );
}
