"use client";

import { useI18n } from "@/lib/i18n";
import { GlowButton, SurfaceCard } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();

  return (
    <SurfaceCard className="my-8 max-w-xl space-y-3">
      <h2 className="text-2xl font-semibold text-white">{t("system.errorTitle")}</h2>
      <p className="text-sm text-muted">{t("system.errorText")}</p>
      <GlowButton onClick={() => reset()}>{t("commonUi.retry")}</GlowButton>
    </SurfaceCard>
  );
}
