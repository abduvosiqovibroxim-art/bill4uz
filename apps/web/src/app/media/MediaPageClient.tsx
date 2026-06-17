"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { SectionHeader } from "@/components/SectionHeader";
import { useMediaGalleriesQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { SectionShell, SurfaceCard } from "@/components/ui";

export function MediaPageClient() {
  const { t, text } = useI18n();
  const mediaQuery = useMediaGalleriesQuery();
  const mediaEntries = mediaQuery.data ?? [];

  return (
    <SectionShell>
      <SectionHeader eyebrow={t("nav.media")} title={t("media.title")} subtitle={t("media.subtitle")} />
      {mediaQuery.isPending ? <LoadingState /> : null}
      {mediaQuery.isError ? <ErrorState onRetry={() => mediaQuery.refetch()} /> : null}
      {!mediaQuery.isPending && !mediaQuery.isError && mediaEntries.length === 0 ? (
        <EmptyState message={t("common.noResults")} />
      ) : null}
      {!mediaQuery.isPending && !mediaQuery.isError && mediaEntries.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {mediaEntries.map((item) => (
            <SurfaceCard key={item.id} className="space-y-4">
              <div
                className="showcase-media-visual"
                style={
                  item.coverUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(15,26,23,0.18), rgba(15,26,23,0.74)), url(${item.coverUrl})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover"
                      }
                    : {
                        background:
                          "radial-gradient(circle_at_20%_20%,rgba(76,157,123,0.24),transparent_35%),linear-gradient(160deg,rgba(20,40,32,0.92),rgba(10,18,15,0.88))"
                      }
                }
              />
              <p className="pill mt-4">{t(`common.mediaTypes.${item.typeKey}`)}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{text(item.title)}</h3>
              <p className="mt-2 text-sm text-muted">{text(item.description) || "-"}</p>
              <p className="text-sm font-semibold text-accent">{item.assetsCount} {t("home.showcase.assets")}</p>
            </SurfaceCard>
          ))}
        </div>
      ) : null}
    </SectionShell>
  );
}
