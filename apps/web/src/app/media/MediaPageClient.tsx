"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { SectionHeader } from "@/components/SectionHeader";
import { useMediaGalleriesQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { SectionShell, SurfaceCard } from "@/components/ui";
import type { MediaEntry } from "@/lib/types";

export function MediaPageClient() {
  const { t, text } = useI18n();
  const mediaQuery = useMediaGalleriesQuery();
  const mediaEntries = mediaQuery.data ?? [];
  const [active, setActive] = useState<MediaEntry | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  function visualStyle(url: string | null) {
    return url
      ? {
          backgroundImage: `linear-gradient(180deg, rgba(15,26,23,0.18), rgba(15,26,23,0.74)), url(${url})`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }
      : {
          background:
            "radial-gradient(circle_at_20%_20%,rgba(76,157,123,0.24),transparent_35%),linear-gradient(160deg,rgba(20,40,32,0.92),rgba(10,18,15,0.88))"
        };
  }

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
              <button
                type="button"
                className="media-gallery-trigger"
                onClick={() => setActive(item)}
                aria-label={text(item.title)}
              >
                <div className="showcase-media-visual" style={visualStyle(item.coverUrl)} />
              </button>
              <p className="pill mt-4">{t(`common.mediaTypes.${item.typeKey}`)}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{text(item.title)}</h3>
              <p className="mt-2 text-sm text-muted">{text(item.description) || "-"}</p>
              <p className="text-sm font-semibold text-accent">
                {item.assetsCount} {t("home.showcase.assets")}
              </p>
            </SurfaceCard>
          ))}
        </div>
      ) : null}

      {active ? (
        <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={text(active.title)} onClick={() => setActive(null)}>
          <div className="media-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <div className="media-lightbox-head">
              <div>
                <p className="pill">{t(`common.mediaTypes.${active.typeKey}`)}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{text(active.title)}</h3>
              </div>
              <button type="button" className="media-lightbox-close" onClick={() => setActive(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="media-lightbox-grid">
              {active.assets.map((asset) => (
                <div key={asset.id} className="media-lightbox-item" style={visualStyle(asset.url)} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SectionShell>
  );
}
