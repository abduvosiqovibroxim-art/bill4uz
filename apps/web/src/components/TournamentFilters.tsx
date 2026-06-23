"use client";

import { useState } from "react";
import { useTournamentsQuery } from "@/lib/api/hooks";
import { uzbekCities } from "@/lib/constants";
import { disciplineOptions } from "@/lib/tournamentTaxonomy";
import { useI18n } from "@/lib/i18n";
import { EmptyState, ErrorState, LoadingState } from "./DataState";
import { TournamentCard } from "./cards";
import { FormSelect, SurfaceCard } from "./ui";

export function TournamentFilters() {
  const { t, locale } = useI18n();
  const [city, setCity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [discipline, setDiscipline] = useState<string>("all");
  const tournamentsQuery = useTournamentsQuery({
    city: city !== "all" ? city : undefined,
    status: status !== "all" ? status : undefined,
    discipline: discipline !== "all" ? discipline : undefined
  });
  const tournaments = tournamentsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <SurfaceCard className="grid gap-3 md:grid-cols-3">
        <FormSelect value={city} onChange={(event) => setCity(event.target.value)}>
          <option value="all">{t("tournaments.cityPlaceholder")}</option>
          {uzbekCities.map((item) => (
            <option key={item} value={item}>
              {t(`common.cities.${item}`)}
            </option>
          ))}
        </FormSelect>

        <FormSelect value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t("tournaments.statusPlaceholder")}</option>
          <option value="draft">{t("common.statuses.draft")}</option>
          <option value="registration">{t("common.statuses.registration")}</option>
          <option value="live">{t("common.statuses.live")}</option>
          <option value="finished">{t("common.statuses.finished")}</option>
        </FormSelect>

        <FormSelect value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
          <option value="all">{t("tournaments.disciplinePlaceholder")}</option>
          {disciplineOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label[locale]}
            </option>
          ))}
        </FormSelect>
      </SurfaceCard>

      {tournamentsQuery.isPending ? <LoadingState /> : null}
      {tournamentsQuery.isError ? <ErrorState onRetry={() => tournamentsQuery.refetch()} /> : null}
      {!tournamentsQuery.isPending && !tournamentsQuery.isError && tournaments.length === 0 ? (
        <EmptyState
          message={
            t("tournaments.empty") === "tournaments.empty"
              ? "No tournaments yet"
              : t("tournaments.empty")
          }
        />
      ) : null}
      {!tournamentsQuery.isPending && !tournamentsQuery.isError && tournaments.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {tournaments.map((item) => (
            <TournamentCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
