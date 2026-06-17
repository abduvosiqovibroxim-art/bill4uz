"use client";

import { useI18n } from "@/lib/i18n";
import { DashboardPageHeader } from "@/components/dashboard/DashboardKit";

export function AdminPageHeader({
  titleKey,
  subtitleKey
}: {
  titleKey: string;
  subtitleKey: string;
}) {
  const { t } = useI18n();

  return (
    <DashboardPageHeader
      eyebrow={t("dashboard.admin.title")}
      title={t(titleKey)}
      subtitle={t(subtitleKey)}
    />
  );
}
