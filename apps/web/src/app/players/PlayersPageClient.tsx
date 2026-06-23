"use client";

import { useMemo, useState } from "react";
import { PlayerPodium, PlayerRankRow } from "@/components/cards";
import { ErrorState, LoadingState } from "@/components/DataState";
import { usePlayersQuery } from "@/lib/api/hooks";
import { uzbekCities } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { FormInput, FormSelect, GlowButton } from "@/components/ui";

const ALL = "all";

export function PlayersPageClient() {
  const { t, text, formatNumber } = useI18n();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [ratingLevel, setRatingLevel] = useState(ALL);
  const [discipline, setDiscipline] = useState(ALL);
  const [sortBy, setSortBy] = useState("elo");
  const playersQuery = usePlayersQuery();

  const allPlayers = playersQuery.data ?? [];

  const heroStats = useMemo(() => {
    if (allPlayers.length === 0) return { total: 0, topElo: 0 };
    return {
      total: allPlayers.length,
      topElo: allPlayers.reduce((max, item) => Math.max(max, item.elo), 0)
    };
  }, [allPlayers]);

  const options = useMemo(() => {
    const countries = new Set<string>();
    const levels = new Map<string, string>();
    const disciplines = new Set<string>();
    for (const player of allPlayers) {
      if (player.countryKey) countries.add(player.countryKey);
      if (player.currentLevel) levels.set(player.currentLevel, text(player.currentLevelLabel));
      player.disciplines.forEach((item) => disciplines.add(item));
    }
    return {
      countries: [...countries].sort(),
      levels: [...levels.entries()],
      disciplines: [...disciplines].sort()
    };
  }, [allPlayers, text]);

  const ranked = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...allPlayers]
      .filter((item) => {
        if (country !== ALL && item.countryKey !== country) return false;
        if (city !== ALL && item.cityKey !== city) return false;
        if (ratingLevel !== ALL && item.currentLevel !== ratingLevel) return false;
        if (discipline !== ALL && !item.disciplines.includes(discipline)) return false;
        if (query && !item.fullName.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((left, right) => (sortBy === "wins" ? right.wins - left.wins : right.elo - left.elo));
  }, [allPlayers, country, city, ratingLevel, discipline, search, sortBy]);

  const hasFilters = Boolean(search) || country !== ALL || city !== ALL || ratingLevel !== ALL || discipline !== ALL;

  function clearFilters() {
    setSearch("");
    setCountry(ALL);
    setCity(ALL);
    setRatingLevel(ALL);
    setDiscipline(ALL);
  }

  const hasPodium = ranked.length >= 3;
  const podium = hasPodium ? ranked.slice(0, 3) : [];
  const rest = hasPodium ? ranked.slice(3) : ranked;
  const restRankOffset = hasPodium ? 3 : 0;

  const isReady = !playersQuery.isPending && !playersQuery.isError;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="container-shell pt-12 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {t("nav.players")}
            </span>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-6xl" style={{ color: "var(--text)" }}>
              {t("home.playersTitle")}
            </h1>
            <p className="mt-3 text-xl" style={{ color: "var(--muted)" }}>{t("home.playersSubtitle")}</p>
          </div>

          {heroStats.total > 0 ? (
            <div className="flex gap-3">
              <div className="rounded-xl px-5 py-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
                <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{formatNumber(heroStats.total)}</p>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{t("nav.players")}</p>
              </div>
              <div className="rounded-xl px-5 py-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
                <p className="text-2xl font-black" style={{ color: "var(--accent)" }}>{formatNumber(heroStats.topElo)}</p>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{t("common.stats.elo")}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Filters */}
      <section className="container-shell pb-8">
        <div className="grid items-center gap-3 rounded-xl p-4 md:grid-cols-3 md:p-5 xl:grid-cols-6" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
          <FormInput placeholder={t("players.searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} />
          <FormSelect value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value={ALL}>{t("players.countryPlaceholder")}</option>
            {options.countries.map((countryKey) => (
              <option key={countryKey} value={countryKey}>
                {t(`common.countries.${countryKey}`)}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={city} onChange={(event) => setCity(event.target.value)}>
            <option value={ALL}>{t("players.cityPlaceholder")}</option>
            {uzbekCities.map((cityKey) => (
              <option key={cityKey} value={cityKey}>
                {t(`common.cities.${cityKey}`)}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={ratingLevel} onChange={(event) => setRatingLevel(event.target.value)}>
            <option value={ALL}>{t("players.ratingPlaceholder")}</option>
            {options.levels.map(([levelKey, label]) => (
              <option key={levelKey} value={levelKey}>
                {label}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
            <option value={ALL}>{t("players.disciplinePlaceholder")}</option>
            {options.disciplines.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="elo">{t("players.sortByElo")}</option>
            <option value="wins">{t("players.sortByWins")}</option>
          </FormSelect>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            {formatNumber(ranked.length)}
          </span>
          <GlowButton variant="ghost" onClick={clearFilters} disabled={!hasFilters}>
            {t("players.clearFilters")}
          </GlowButton>
        </div>
      </section>

      {/* Content */}
      <section className="container-shell pb-16">
        {playersQuery.isPending ? <LoadingState /> : null}
        {playersQuery.isError ? <ErrorState onRetry={() => playersQuery.refetch()} /> : null}

        {isReady && ranked.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--muted)" }}>{t("common.noResults")}</p>
          </div>
        ) : null}

        {isReady && podium.length > 0 ? (
          <div className="mb-10">
            <PlayerPodium players={podium} />
          </div>
        ) : null}

        {isReady && rest.length > 0 ? (
          <div className="flex flex-col gap-3">
            {rest.map((item, index) => (
              <PlayerRankRow key={item.id} item={item} rank={restRankOffset + index + 1} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
