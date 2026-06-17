"use client";

import { useI18n } from "@/lib/i18n";
import { GlowButton, NoticePanel } from "./ui";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return <NoticePanel>{label ?? t("commonUi.loading")}</NoticePanel>;
}

export function ErrorState({
  onRetry,
  message
}: {
  onRetry?: () => void;
  message?: string;
}) {
  const { t } = useI18n();

  return (
    <NoticePanel tone="error" className="space-y-4">
      <p className="text-base text-white">{message ?? t("system.errorText")}</p>
      {onRetry ? <GlowButton onClick={onRetry}>{t("commonUi.retry")}</GlowButton> : null}
    </NoticePanel>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <NoticePanel tone="empty">{message}</NoticePanel>;
}
