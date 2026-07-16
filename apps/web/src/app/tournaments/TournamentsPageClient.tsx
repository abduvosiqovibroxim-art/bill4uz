"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { TournamentCard } from "@/components/cards";
import { useAuth } from "@/components/AuthProvider";
import { useTournamentsQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import type { BilliardKindKey, Tournament } from "@/lib/types";

const KIND_LABELS: Record<BilliardKindKey, { ru: string; uz: string; en: string }> = {
  pyramid: { ru: "Пирамида", uz: "Piramida", en: "Pyramid" },
  pool: { ru: "Пул", uz: "Pul", en: "Pool" },
  snooker: { ru: "Снукер", uz: "Snuker", en: "Snooker" }
};

function normalizeKind(value?: string | null): BilliardKindKey | null {
  const normalized = value?.toLowerCase();
  return normalized === "pyramid" || normalized === "pool" || normalized === "snooker" ? normalized : null;
}

type TournamentsCopy = {
  title: string;
  subtitle: string;
  eyebrow: string;
  createTournament: string;
  found: string;
  empty: string;
  emptySub: string;
  noResult: string;
  noResultSub: string;
  open: string;
  date: string;
  city: string;
  discipline: string;
  category: string;
  status: string;
  participants: string;
  bracketFormat: string;
  filters: string;
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
    subtitle: "Все турниры платформы: статусы, сетки, участники и результаты в одном разделе.",
    eyebrow: "События",
    createTournament: "Создать турнир",
    found: "найдено",
    empty: "Турниры пока не добавлены",
    emptySub: "Организаторы скоро добавят новые события — загляни позже.",
    noResult: "Ничего не найдено",
    noResultSub: "Попробуйте изменить фильтры.",
    open: "Открыть",
    date: "Дата",
    city: "Город",
    discipline: "Дисциплина",
    category: "Категория",
    status: "Статус",
    participants: "Участники",
    bracketFormat: "Формат сетки",
    filters: "Фильтры",
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
    subtitle: "Platformaning barcha turnirlari: holatlar, setkalar, ishtirokchilar va natijalar bitta bo'limda.",
    eyebrow: "Tadbirlar",
    createTournament: "Turnir yaratish",
    found: "topildi",
    empty: "Turnirlar hali qo'shilmagan",
    emptySub: "Tashkilotchilar tez orada yangi tadbirlar qo'shadi.",
    noResult: "Hech narsa topilmadi",
    noResultSub: "Filtrlarni o'zgartirib ko'ring.",
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
    filters: "Filtrlar",
    loadError: "Turnirlarni yuklab bo'lmadi"
  },
  en: {
    title: "Tournaments",
    subtitle: "Every tournament on the platform: statuses, brackets, participants and results in one place.",
    eyebrow: "Events",
    createTournament: "Create tournament",
    found: "found",
    empty: "No tournaments yet",
    emptySub: "Organizers will add new events soon — check back later.",
    noResult: "Nothing found",
    noResultSub: "Try adjusting the filters.",
    open: "Open",
    date: "Date",
    city: "City",
    discipline: "Discipline",
    category: "Category",
    status: "Status",
    participants: "Participants",
    bracketFormat: "Bracket format",
    filters: "Filters",
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
  const { locale, t, formatNumber } = useI18n();
  const c = copy[locale];
  const { user } = useAuth();
  const canCreate = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const tournamentsQuery = useTournamentsQuery();
  const searchParams = useSearchParams();
  const [kindFilter, setKindFilter] = useState<BilliardKindKey | null>(() => normalizeKind(searchParams.get("kind")));
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
    const kindMatch = !kindFilter ? true : item.billiardKind === kindFilter;
    const cityMatch = cityFilter === "all" ? true : item.cityKey === cityFilter;
    const disciplineMatch = disciplineFilter === "all" ? true : disciplineName(item, c) === disciplineFilter;
    const categoryMatch = categoryFilter === "all" ? true : item.category === categoryFilter;
    const statusMatch = statusFilter === "all" ? true : item.status === statusFilter;
    const dateMatch = dateFilter === "all" ? true : matchesDateFilter(item.startsAt, dateFilter);
    const formatMatch = formatFilter === "all" ? true : item.bracketSystem === formatFilter;

    return kindMatch && cityMatch && disciplineMatch && categoryMatch && statusMatch && dateMatch && formatMatch;
  });

  return (
    <div className="portal-wrap">
      <div className="portal">
      {/* Compact hero */}
      <section className="portal-hero portal-hero-solo" style={{ padding: "clamp(1.2rem, 3vw, 2rem)" }}>
        <div className="portal-hero-copy">
          <span className="portal-eyebrow">{c.eyebrow}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              aria-hidden="true"
              style={{
                width: "clamp(44px, 8vw, 60px)",
                height: "clamp(44px, 8vw, 60px)",
                flexShrink: 0,
                borderRadius: "16px",
                backgroundImage: "url(/disciplines/pyramid.webp)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid var(--card-border)",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)"
              }}
            />
            <h1 className="portal-hero-title" style={{ fontSize: "clamp(1.8rem, 1.2rem + 2.4vw, 2.6rem)" }}>{c.title}</h1>
          </div>
          <p className="portal-hero-lead">{c.subtitle}</p>
          <div className="portal-hero-chips">
            <span className="portal-chip"><span className="tick" aria-hidden="true">●</span>{formatNumber(filtered.length)} {c.found}</span>
            {kindFilter ? (
              <button type="button" className="portal-chip" onClick={() => setKindFilter(null)} style={{ cursor: "pointer" }}>
                {KIND_LABELS[kindFilter][locale]} ✕
              </button>
            ) : null}
          </div>
          {canCreate ? (
            <div className="portal-hero-actions">
              <Link href="/dashboard/organizer" className="button-primary">{c.createTournament}</Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="portal-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      {/* Content */}
      {tournaments.length === 0 ? (
        <EmptyState
          icon="▦"
          title={c.empty}
          description={c.emptySub}
          action={canCreate ? <Link href="/dashboard/organizer" className="button-primary">{c.createTournament}</Link> : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="⊘" title={c.noResult} description={c.noResultSub} />
      ) : (
        <section>
          <div className="portal-info-grid">
            {filtered.map((tournament) => (
              <TournamentCard key={tournament.id} item={tournament} />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
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

  const labels: Record<string, string> = {
    doubleElimination: "Double Elimination",
    roundRobin: "Round Robin",
    swiss: "Swiss",
    groupPlayoff: "Group + Playoff"
  };

  return labels[format] ?? format;
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
