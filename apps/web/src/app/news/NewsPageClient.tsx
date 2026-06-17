"use client";

import { useState } from "react";
import { NewsCard } from "@/components/cards";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { SectionHeader } from "@/components/SectionHeader";
import { useNewsQuery } from "@/lib/api/hooks";
import { newsCategories } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { FormInput, FormSelect, SectionShell, SurfaceCard } from "@/components/ui";

export function NewsPageClient() {
  const { t } = useI18n();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const newsQuery = useNewsQuery();

  const news = (newsQuery.data ?? []).filter((item) => {
    if (category !== "all" && item.categoryKey !== category) return false;
    if (
      search.trim() &&
      !item.title.ru.toLowerCase().includes(search.trim().toLowerCase()) &&
      !item.title.uz.toLowerCase().includes(search.trim().toLowerCase()) &&
      !item.title.en.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <SectionShell>
      <SectionHeader eyebrow={t("nav.news")} title={t("news.title")} subtitle={t("news.subtitle")} />
      <SurfaceCard className="grid gap-3 md:grid-cols-3">
        <FormSelect value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">{t("news.categoryPlaceholder")}</option>
          {newsCategories.map((item) => (
            <option key={item} value={item}>
              {t(`common.categories.${item}`)}
            </option>
          ))}
        </FormSelect>
        <FormInput
          className="md:col-span-2"
          placeholder={t("news.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </SurfaceCard>
      <div className="mt-5">
        {newsQuery.isPending ? <LoadingState /> : null}
        {newsQuery.isError ? <ErrorState onRetry={() => newsQuery.refetch()} /> : null}
        {!newsQuery.isPending && !newsQuery.isError && news.length === 0 ? (
          <EmptyState message={t("common.noResults")} />
        ) : null}
        {!newsQuery.isPending && !newsQuery.isError && news.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
