"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { SectionShell, SurfaceCard } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <SectionShell>
      <SectionHeader eyebrow={t("nav.about")} title={t("about.title")} subtitle={t("about.mission")} />
      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard>
          <h3 className="text-xl font-semibold text-white">{t("about.players")}</h3>
          <p className="mt-3 text-sm text-muted">{t("about.playersText")}</p>
        </SurfaceCard>
        <SurfaceCard>
          <h3 className="text-xl font-semibold text-white">{t("about.clubs")}</h3>
          <p className="mt-3 text-sm text-muted">{t("about.clubsText")}</p>
        </SurfaceCard>
        <SurfaceCard>
          <h3 className="text-xl font-semibold text-white">{t("about.organizers")}</h3>
          <p className="mt-3 text-sm text-muted">{t("about.organizersText")}</p>
        </SurfaceCard>
      </div>
    </SectionShell>
  );
}
