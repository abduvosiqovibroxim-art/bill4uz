"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { GlowButton, SurfaceCard } from "@/components/ui";

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <SurfaceCard className="my-8 max-w-xl space-y-3">
      <h1 className="text-2xl font-semibold text-white">{t("system.notFoundTitle")}</h1>
      <p className="text-sm text-muted">{t("system.notFoundText")}</p>
      <Link href="/">
        <GlowButton>{t("commonUi.backHome")}</GlowButton>
      </Link>
    </SurfaceCard>
  );
}
