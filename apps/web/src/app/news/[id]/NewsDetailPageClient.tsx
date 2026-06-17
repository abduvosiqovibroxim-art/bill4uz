"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useNewsItemQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { SectionShell, SurfaceCard } from "@/components/ui";

export function NewsDetailPageClient({ id }: { id: string }) {
  const { t, text, formatDate } = useI18n();
  const newsQuery = useNewsItemQuery(id);

  if (newsQuery.isPending) {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  if (newsQuery.isError) {
    return (
      <SectionShell>
        <ErrorState onRetry={() => newsQuery.refetch()} />
      </SectionShell>
    );
  }

  const item = newsQuery.data;
  if (!item) {
    return (
      <SectionShell>
        <EmptyState message={t("system.notFoundText")} />
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <SurfaceCard className="space-y-4">
        <span className="pill">{t(`common.categories.${item.categoryKey}`)}</span>
        <h1 className="section-title text-white">{text(item.title)}</h1>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">{formatDate(item.publishedAt)}</p>
        <p className="text-base leading-7 text-muted">{text(item.content)}</p>
      </SurfaceCard>
    </SectionShell>
  );
}
