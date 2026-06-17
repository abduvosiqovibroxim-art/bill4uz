"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useApplicationsAdminQuery, useModerateApplicationAdminMutation } from "@/lib/api/hooks";
import { FormSelect, GlowButton, NoticePanel, SurfaceCard } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function AdminApplicationsPage() {
  const { locale, t, text } = useI18n();
  const [status, setStatus] = useState("all");
  const [feedback, setFeedback] = useState<{ message: string; tone: "default" | "error" } | null>(null);
  const applicationsQuery = useApplicationsAdminQuery({ status: status !== "all" ? status : undefined });
  const moderateMutation = useModerateApplicationAdminMutation();

  async function handleModeration(applicationId: string, nextStatus: "APPROVED" | "REJECTED") {
    setFeedback(null);

    try {
      await moderateMutation.mutateAsync({ id: applicationId, status: nextStatus });
      setFeedback({
        message: nextStatus === "APPROVED" ? getApplicationSuccessMessage(locale, "approved") : getApplicationSuccessMessage(locale, "rejected"),
        tone: "default"
      });
    } catch (error) {
      setFeedback({
        message: getUserFacingApiError(error, {
          locale,
          t,
          payloadMessageKeys: {
            "Applications cannot be moderated after bracket generation.":
              "tournamentCenter.management.errors.applicationModerationLocked"
          },
          debugLabel: "admin-moderate-application"
        }),
        tone: "error"
      });
    }
  }

  if (applicationsQuery.isPending) {
    return <LoadingState />;
  }

  if (applicationsQuery.isError) {
    return <ErrorState onRetry={() => applicationsQuery.refetch()} />;
  }

  const applications = applicationsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader titleKey="admin.applications.title" subtitleKey="admin.applications.subtitle" />

      <SurfaceCard>
        {feedback ? <NoticePanel tone={feedback.tone === "error" ? "error" : "default"} className="mb-4">{feedback.message}</NoticePanel> : null}
        <FormSelect value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t("admin.common.allStatuses")}</option>
          <option value="PENDING">{t("admin.applications.pending")}</option>
          <option value="APPROVED">{t("admin.applications.approved")}</option>
          <option value="REJECTED">{t("admin.applications.rejected")}</option>
        </FormSelect>
      </SurfaceCard>

      {applications.length === 0 ? <EmptyState message={t("admin.applications.empty")} /> : null}
      {applications.map((application) => (
        <SurfaceCard key={application.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-white">
                {application.player.fullName} {"->"} {text(application.tournament.title)}
              </p>
              <p className="text-sm text-muted">
                {t(`admin.applications.${application.status.toLowerCase()}`)} / {new Date(application.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GlowButton
                variant="secondary"
                onClick={() => void handleModeration(application.id, "APPROVED")}
                disabled={moderateMutation.isPending}
              >
                {t("admin.actions.approve")}
              </GlowButton>
              <GlowButton
                variant="secondary"
                onClick={() => void handleModeration(application.id, "REJECTED")}
                disabled={moderateMutation.isPending}
              >
                {t("admin.actions.reject")}
              </GlowButton>
            </div>
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}

function getApplicationSuccessMessage(locale: "ru" | "uz" | "en", key: "approved" | "rejected") {
  const messages = {
    ru: {
      approved: "\u0417\u0430\u044f\u0432\u043a\u0430 \u043e\u0434\u043e\u0431\u0440\u0435\u043d\u0430.",
      rejected: "\u0417\u0430\u044f\u0432\u043a\u0430 \u043e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0430."
    },
    uz: {
      approved: "Ariza tasdiqlandi.",
      rejected: "Ariza rad etildi."
    },
    en: {
      approved: "Application approved.",
      rejected: "Application rejected."
    }
  } as const;

  return messages[locale][key];
}
