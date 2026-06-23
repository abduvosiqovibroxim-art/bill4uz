"use client";

import { useMemo, useState } from "react";
import { CoachCard, coachQualificationKey } from "@/components/cards";
import { ErrorState, LoadingState } from "@/components/DataState";
import { GlowButton, FormInput, FormSelect } from "@/components/ui";
import { useCoachesQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import type { CoachQualificationKey } from "@/lib/types";

const ALL = "all";

export function CoachesPageClient() {
  const { t, formatNumber } = useI18n();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState(ALL);
  const [cityId, setCityId] = useState(ALL);
  const [discipline, setDiscipline] = useState(ALL);
  const [qualification, setQualification] = useState(ALL);

  const coachesQuery = useCoachesQuery();
  const allCoaches = coachesQuery.data ?? [];

  const options = useMemo(() => {
    const regions = new Set<string>();
    const cities = new Map<string, string>();
    const disciplines = new Set<string>();
    const qualifications = new Set<CoachQualificationKey>();
    for (const coach of allCoaches) {
      if (coach.region) regions.add(coach.region);
      if (coach.cityName) cities.set(coach.cityId, coach.cityName);
      coach.disciplines.forEach((item) => disciplines.add(item));
      qualifications.add(coach.qualification);
    }
    return {
      regions: [...regions].sort(),
      cities: [...cities.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      disciplines: [...disciplines].sort(),
      qualifications: [...qualifications]
    };
  }, [allCoaches]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allCoaches.filter((coach) => {
      if (query && !coach.fullName.toLowerCase().includes(query)) return false;
      if (region !== ALL && coach.region !== region) return false;
      if (cityId !== ALL && coach.cityId !== cityId) return false;
      if (discipline !== ALL && !coach.disciplines.includes(discipline)) return false;
      if (qualification !== ALL && coach.qualification !== qualification) return false;
      return true;
    });
  }, [allCoaches, search, region, cityId, discipline, qualification]);

  const hasFilters = Boolean(search) || region !== ALL || cityId !== ALL || discipline !== ALL || qualification !== ALL;

  function clearFilters() {
    setSearch("");
    setRegion(ALL);
    setCityId(ALL);
    setDiscipline(ALL);
    setQualification(ALL);
  }

  const isReady = !coachesQuery.isPending && !coachesQuery.isError;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="container-shell pt-12 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {t("nav.coaches")}
            </span>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-6xl" style={{ color: "var(--text)" }}>
              {t("coaches.title")}
            </h1>
            <p className="mt-3 text-xl" style={{ color: "var(--muted)" }}>
              {t("coaches.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container-shell pb-8">
        <div
          className="grid items-center gap-3 rounded-xl p-4 md:grid-cols-3 md:p-5 xl:grid-cols-6"
          style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}
        >
          <FormInput
            placeholder={t("coaches.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <FormSelect value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value={ALL}>{t("coaches.regionPlaceholder")}</option>
            {options.regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={cityId} onChange={(event) => setCityId(event.target.value)}>
            <option value={ALL}>{t("coaches.cityPlaceholder")}</option>
            {options.cities.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
            <option value={ALL}>{t("coaches.disciplinePlaceholder")}</option>
            {options.disciplines.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={qualification} onChange={(event) => setQualification(event.target.value)}>
            <option value={ALL}>{t("coaches.qualificationPlaceholder")}</option>
            {options.qualifications.map((item) => (
              <option key={item} value={item}>
                {t(`coaches.qualifications.${coachQualificationKey(item)}`)}
              </option>
            ))}
          </FormSelect>
          <GlowButton variant="ghost" onClick={clearFilters} disabled={!hasFilters}>
            {t("coaches.clearFilters")}
          </GlowButton>
        </div>
        {isReady ? (
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--muted)" }}>
            {formatNumber(filtered.length)}
          </p>
        ) : null}
      </section>

      {/* Content */}
      <section className="container-shell pb-16">
        {coachesQuery.isPending ? <LoadingState /> : null}
        {coachesQuery.isError ? <ErrorState onRetry={() => coachesQuery.refetch()} /> : null}

        {isReady && filtered.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}
          >
            <p className="text-lg font-semibold" style={{ color: "var(--muted)" }}>
              {t("common.noResults")}
            </p>
          </div>
        ) : null}

        {isReady && filtered.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((coach) => (
              <CoachCard key={coach.id} item={coach} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
