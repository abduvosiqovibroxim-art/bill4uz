"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { GlowButton, NoticePanel } from "./ui";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return <NoticePanel>{label ?? t("commonUi.loading")}</NoticePanel>;
}

export function ErrorState({
  onRetry,
  message,
  title,
  description,
  action
}: {
  onRetry?: () => void;
  message?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? message ?? t("system.errorText");
  const resolvedText = description ?? (title ? message : undefined);

  return (
    <div className="state-block is-error" role="alert">
      <span className="state-icon" aria-hidden="true">!</span>
      <p className="state-title">{resolvedTitle}</p>
      {resolvedText ? <p className="state-text">{resolvedText}</p> : null}
      {(onRetry || action) && (
        <div className="state-actions">
          {onRetry ? <GlowButton onClick={onRetry}>{t("commonUi.retry")}</GlowButton> : null}
          {action}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  title,
  description,
  icon = "○",
  action
}: {
  message?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const resolvedTitle = title ?? message ?? "";
  const resolvedText = description ?? (title ? message : undefined);

  return (
    <div className="state-block">
      <span className="state-icon" aria-hidden="true">{icon}</span>
      {resolvedTitle ? <p className="state-title">{resolvedTitle}</p> : null}
      {resolvedText ? <p className="state-text">{resolvedText}</p> : null}
      {action ? <div className="state-actions">{action}</div> : null}
    </div>
  );
}
