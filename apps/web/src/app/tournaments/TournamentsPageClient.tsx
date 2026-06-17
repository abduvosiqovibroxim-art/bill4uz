"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useTournamentsQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { getTournamentParticipantsProgress } from "@/lib/tournamentParticipants";
import type { Tournament } from "@/lib/types";

type TournamentsCopy = {
  title: string;
  empty: string;
  noResult: string;
  open: string;
  date: string;
  city: string;
  discipline: string;
  category: string;
  status: string;
  participants: string;
  bracketFormat: string;
  allCities: string;
  allDisciplines: string;
  allCategories: string;
  allStatuses: string;
  allDates: string;
  allFormats: string;
  today: string;
  thisWeek: string;
  later: string;
  missingDate: string;
  missingDiscipline: string;
  missingCity: string;
  loadError: string;
};

const copy: Record<"ru" | "uz" | "en", TournamentsCopy> = {
  ru: {
    title: "Турниры",
    empty: "Нет турниров",
    noResult: "Нет турниров",
    open: "Открыть",
    date: "Дата",
    city: "Город",
    discipline: "Дисциплина",
    category: "Категория",
    status: "Статус",
    participants: "Участники",
    bracketFormat: "Формат сетки",
    allCities: "Все города",
    allDisciplines: "Все дисциплины",
    allCategories: "Все категории",
    allStatuses: "Все статусы",
    allDates: "Любая дата",
    allFormats: "Все форматы",
    today: "Сегодня",
    thisWeek: "Эта неделя",
    later: "Позже",
    missingDate: "Дата не указана",
    missingDiscipline: "Не указана",
    missingCity: "Город не указан",
    loadError: "Не удалось загрузить турниры"
  },
  uz: {
    title: "Turnirlar",
    empty: "Turnirlar yo'q",
    noResult: "Turnirlar yo'q",
    open: "Ochish",
    date: "Sana",
    city: "Shahar",
    discipline: "Yo'nalish",
    category: "Kategoriya",
    status: "Holat",
    participants: "Ishtirokchilar",
    bracketFormat: "Setka formati",
    allCities: "Barcha shaharlar",
    allDisciplines: "Barcha yo'nalishlar",
    allCategories: "Barcha kategoriyalar",
    allStatuses: "Barcha holatlar",
    allDates: "Har qanday sana",
    allFormats: "Barcha formatlar",
    today: "Bugun",
    thisWeek: "Bu hafta",
    later: "Keyinroq",
    missingDate: "Sana ko'rsatilmagan",
    missingDiscipline: "Ko'rsatilmagan",
    missingCity: "Shahar ko'rsatilmagan",
    loadError: "Turnirlarni yuklab bo'lmadi"
  },
  en: {
    title: "Tournaments",
    empty: "No tournaments",
    noResult: "No tournaments",
    open: "Open",
    date: "Date",
    city: "City",
    discipline: "Discipline",
    category: "Category",
    status: "Status",
    participants: "Participants",
    bracketFormat: "Bracket format",
    allCities: "All cities",
    allDisciplines: "All disciplines",
    allCategories: "All categories",
    allStatuses: "All statuses",
    allDates: "Any date",
    allFormats: "All formats",
    today: "Today",
    thisWeek: "This week",
    later: "Later",
    missingDate: "Date is not set",
    missingDiscipline: "Not set",
    missingCity: "City not set",
    loadError: "Could not load tournaments"
  }
};

export function TournamentsPageClient() {
  const { locale, text, t } = useI18n();
  const c = copy[locale];
  const tournamentsQuery = useTournamentsQuery();
  const [cityFilter, setCityFilter] = useState("all");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  if (tournamentsQuery.isPending) {
    return <LoadingState />;
  }

  if (tournamentsQuery.isError) {
    return <ErrorState message={c.loadError} onRetry={() => tournamentsQuery.refetch()} />;
  }

  const tournaments = (tournamentsQuery.data ?? [])
    .slice()
    .sort((a, b) => safeTimestamp(a.startsAt) - safeTimestamp(b.startsAt));

  const disciplines = Array.from(new Set(tournaments.map((item) => disciplineName(item, c)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const cities = Array.from(new Set(tournaments.map((item) => item.cityKey).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const categories = Array.from(new Set(tournaments.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const statuses = Array.from(new Set(tournaments.map((item) => item.status).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const formats = Array.from(new Set(tournaments.map((item) => item.bracketSystem).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const filtered = tournaments.filter((item) => {
    const cityMatch = cityFilter === "all" ? true : item.cityKey === cityFilter;
    const disciplineMatch = disciplineFilter === "all" ? true : disciplineName(item, c) === disciplineFilter;
    const categoryMatch = categoryFilter === "all" ? true : item.category === categoryFilter;
    const statusMatch = statusFilter === "all" ? true : item.status === statusFilter;
    const dateMatch = dateFilter === "all" ? true : matchesDateFilter(item.startsAt, dateFilter);
    const formatMatch = formatFilter === "all" ? true : item.bracketSystem === formatFilter;

    return cityMatch && disciplineMatch && categoryMatch && statusMatch && dateMatch && formatMatch;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <section className="container-shell py-12">
        <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight" style={{ color: "var(--text)" }}>{c.title}</h1>
        <p className="text-xl" style={{ color: "var(--muted)" }}>
          {locale === "ru" ? "Все турниры на одной платформе" : locale === "uz" ? "Barcha turnirlar bir platformada" : "All tournaments in one place"}
        </p>
      </section>

      {/* Filters */}
      <section className="container-shell pb-6">
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3 p-8 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{c.city}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
              <option value="all">{c.allCities}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {cityLabel(city, t, c)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{c.discipline}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={disciplineFilter} onChange={(event) => setDisciplineFilter(event.target.value)}>
              <option value="all">{c.allDisciplines}</option>
              {disciplines.map((discipline) => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{c.category}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">{c.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{c.status}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{c.allStatuses}</option>
              {statuses.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusLabel(statusValue, t)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{c.date}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
              <option value="all">{c.allDates}</option>
              <option value="today">{c.today}</option>
              <option value="week">{c.thisWeek}</option>
              <option value="later">{c.later}</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{c.bracketFormat}</span>
            <select className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)", color: "var(--text)" }} value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}>
              <option value="all">{c.allFormats}</option>
              {formats.map((format) => (
                <option key={format} value={format}>
                  {formatLabel(format, t)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Empty states */}
      {tournaments.length === 0 ? (
        <section className="container-shell py-12">
          <div className="text-center p-12 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--muted)" }}>{c.empty}</p>
          </div>
        </section>
      ) : null}

      {tournaments.length > 0 && filtered.length === 0 ? (
        <section className="container-shell py-12">
          <div className="text-center p-12 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--muted)" }}>{c.noResult}</p>
          </div>
        </section>
      ) : null}

      {/* Tournament Cards */}
      {filtered.length > 0 ? (
        <section className="container-shell pb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tournament) => (
              <article key={tournament.id} className="p-8 rounded-xl transition-all hover:scale-[1.02]" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1.5 text-xs font-black uppercase rounded-lg" style={{ background: "var(--emerald)", color: "var(--bg)" }}>
                    {statusLabel(tournament.status, t)}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                    {participantsText(tournament)}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black mb-4 leading-tight" style={{ color: "var(--text)" }}>{text(tournament.title) || "-"}</h2>

                {/* Meta info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{c.date}:</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{formatTournamentDate(tournament.startsAt, locale, c.missingDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{c.city}:</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{cityLabel(tournament.cityKey, t, c)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{c.discipline}:</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{disciplineName(tournament, c)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{c.category}:</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{categoryLabel(tournament.category, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{c.bracketFormat}:</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{formatLabel(tournament.bracketSystem, t)}</span>
                  </div>
                </div>

                {/* CTA button */}
                {tournament.id ? (
                  <Link href={`/tournaments/${tournament.id}`} className="block w-full px-5 py-3 text-center font-bold rounded-lg transition-all hover:scale-105" style={{ background: "var(--accent)", color: "var(--bg)" }}>
                    {c.open} →
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatTournamentDate(value: string, locale: "ru" | "uz" | "en", fallback: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function participantsText(tournament: Tournament) {
  const progress = getTournamentParticipantsProgress(tournament);
  return progress.capacity ? `${progress.registered} / ${progress.capacity}` : String(progress.registered);
}

function statusLabel(status: string, t: (path: string) => string) {
  return t(`common.statuses.${status}`);
}

function categoryLabel(category: string, locale: "ru" | "uz" | "en") {
  const labels: Record<string, Record<"ru" | "uz" | "en", string>> = {
    men: { ru: "Мужчины", uz: "Erkaklar", en: "Men" },
    women: { ru: "Женщины", uz: "Ayollar", en: "Women" },
    juniors: { ru: "Юниоры", uz: "Yuniorlar", en: "Juniors" },
    girls: { ru: "Девушки", uz: "Qizlar", en: "Girls" },
    amateurs: { ru: "Любители", uz: "Havaskorlar", en: "Amateurs" },
    professionals: { ru: "Профессионалы", uz: "Professionallar", en: "Professionals" },
    open: { ru: "Open", uz: "Open", en: "Open" },
    team: { ru: "Командный", uz: "Jamoaviy", en: "Team" },
    personal: { ru: "Личный", uz: "Shaxsiy", en: "Personal" }
  };

  return labels[category]?.[locale] ?? category;
}

function formatLabel(format: string, t: (path: string) => string) {
  if (format === "singleElimination") {
    return t("tournamentCenter.formats.singleElimination");
  }

  return `${format} soon`;
}

function cityLabel(cityKey: string, t: (path: string) => string, c: TournamentsCopy) {
  return cityKey ? t(`common.cities.${cityKey}`) : c.missingCity;
}

function disciplineName(tournament: Tournament, c: TournamentsCopy) {
  return tournament.disciplineName?.trim() || c.missingDiscipline;
}

function matchesDateFilter(value: string, filter: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;

  if (filter === "today") {
    return timestamp >= todayStart && timestamp < tomorrowStart;
  }

  if (filter === "week") {
    return timestamp >= todayStart && timestamp < weekEnd;
  }

  if (filter === "later") {
    return timestamp >= weekEnd;
  }

  return true;
}

function safeTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}
