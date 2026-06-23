"use client";

import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { RankingTable } from "@/components/RankingTable";
import { SectionHeader } from "@/components/SectionHeader";
import { FormInput, FormSelect, SectionShell, SurfaceCard } from "@/components/ui";
import { useRankingsQuery } from "@/lib/api/hooks";
import { uzbekCities } from "@/lib/constants";
import { disciplineOptions } from "@/lib/tournamentTaxonomy";
import { useI18n } from "@/lib/i18n";

export default function RankingsPage() {
  const { locale, t } = useI18n();
  const [discipline, setDiscipline] = useState("overall");
  const [city, setCity] = useState("all");
  const [level, setLevel] = useState("all");
  const [period, setPeriod] = useState("all");
  const [sortBy, setSortBy] = useState("points");
  const [search, setSearch] = useState("");
  const rankingsQuery = useRankingsQuery();

  const rankings = [...(rankingsQuery.data ?? [])]
    .filter((entry) => {
      if (discipline !== "overall" && entry.disciplineKey !== discipline) return false;
      if (city !== "all" && entry.cityKey !== city) return false;
      if (level !== "all" && entry.player.currentLevel !== level) return false;
      if (period !== "all" && !matchesPeriod(entry.updatedAt, period)) return false;
      if (search.trim() && !entry.player.fullName.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    })
    .sort((left, right) => {
      if (sortBy === "wins") {
        return right.player.wins - left.player.wins;
      }

      return right.points - left.points;
    });

  return (
    <div className="portal-wrap">
      <div className="portal">
      {/* Compact hero */}
      <section className="portal-hero portal-hero-solo" style={{ padding: "clamp(1.2rem, 3vw, 2rem)" }}>
        <div className="portal-hero-copy">
          <span className="portal-eyebrow">{t("nav.rankings")}</span>
          <h1 className="portal-hero-title" style={{ fontSize: "clamp(1.8rem, 1.2rem + 2.4vw, 2.6rem)" }}>{t("rankings.title")}</h1>
          <p className="portal-hero-lead">{t("rankings.subtitle")}</p>
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="portal-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{locale === "ru" ? "Дисциплина" : locale === "uz" ? "Yo'nalish" : "Discipline"}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
              <option value="overall">{t("rankings.disciplinesAll")}</option>
              {disciplineOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label[locale]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{locale === "ru" ? "Город" : locale === "uz" ? "Shahar" : "City"}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="all">{t("rankings.regionsAll")}</option>
              {uzbekCities.map((cityItem) => (
                <option key={cityItem} value={cityItem}>
                  {t(`common.cities.${cityItem}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{locale === "ru" ? "Уровень" : locale === "uz" ? "Daraja" : "Level"}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="all">{levelCopy("all", locale)}</option>
              <option value="novice">{levelCopy("novice", locale)}</option>
              <option value="amateur">{levelCopy("amateur", locale)}</option>
              <option value="strongAmateur">{levelCopy("strongAmateur", locale)}</option>
              <option value="semiPro">{levelCopy("semiPro", locale)}</option>
              <option value="pro">{levelCopy("pro", locale)}</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{locale === "ru" ? "Период" : locale === "uz" ? "Muddat" : "Period"}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="all">{periodCopy("all", locale)}</option>
              <option value="month">{periodCopy("month", locale)}</option>
              <option value="year">{periodCopy("year", locale)}</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{locale === "ru" ? "Сортировка" : locale === "uz" ? "Saralash" : "Sort"}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="points">{t("rankings.sortByPoints")}</option>
              <option value="wins">{t("rankings.sortByWins")}</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{locale === "ru" ? "Поиск" : locale === "uz" ? "Qidirish" : "Search"}</span>
            <input className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} placeholder={t("rankings.searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>
      </section>

      {/* Content */}
      <section>
        {rankingsQuery.isPending ? <LoadingState /> : null}
        {rankingsQuery.isError ? <ErrorState onRetry={() => rankingsQuery.refetch()} /> : null}
        {!rankingsQuery.isPending && !rankingsQuery.isError && rankings.length === 0 ? (
          <EmptyState icon="★" title={emptyCopy(locale)} />
        ) : null}
        {!rankingsQuery.isPending && !rankingsQuery.isError && rankings.length > 0 ? (
          <RankingTable entries={rankings} />
        ) : null}
      </section>
      </div>
    </div>
  );
}

function levelCopy(key: string, locale: "ru" | "uz" | "en") {
  const labels = {
    ru: {
      all: "Все уровни",
      novice: "Новичок",
      amateur: "Любитель",
      strongAmateur: "Сильный любитель",
      semiPro: "Полупрофи",
      pro: "Профи"
    },
    uz: {
      all: "Barcha darajalar",
      novice: "Yangi boshlovchi",
      amateur: "Havaskor",
      strongAmateur: "Kuchli havaskor",
      semiPro: "Yarim professional",
      pro: "Professional"
    },
    en: {
      all: "All levels",
      novice: "Novice",
      amateur: "Amateur",
      strongAmateur: "Strong amateur",
      semiPro: "Semi-pro",
      pro: "Pro"
    }
  } as const;

  return labels[locale][key as keyof typeof labels.ru];
}

function periodCopy(key: string, locale: "ru" | "uz" | "en") {
  const labels = {
    ru: { all: "Всё время", month: "Месяц", year: "Год" },
    uz: { all: "Barcha vaqt", month: "Oy", year: "Yil" },
    en: { all: "All time", month: "Month", year: "Year" }
  } as const;

  return labels[locale][key as keyof typeof labels.ru];
}

function emptyCopy(locale: "ru" | "uz" | "en") {
  const labels = {
    ru: "Рейтинг пока пустой",
    uz: "Reyting hozircha bo'sh",
    en: "Rating is empty"
  } as const;

  return labels[locale];
}

function matchesPeriod(updatedAt: string, period: string) {
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const now = Date.now();
  const month = 31 * 24 * 60 * 60 * 1000;
  const year = 366 * 24 * 60 * 60 * 1000;

  if (period === "month") {
    return now - timestamp <= month;
  }

  if (period === "year") {
    return now - timestamp <= year;
  }

  return true;
}
