"use client";

import { useMemo, useState } from "react";
import { PlayerPodium, PlayerRankRow } from "@/components/cards";
import { ErrorState, LoadingState } from "@/components/DataState";
import { usePlayersQuery } from "@/lib/api/hooks";
import { uzbekCities } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { FormInput, FormSelect } from "@/components/ui";

export function PlayersPageClient() {
  const { t, formatNumber } = useI18n();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
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

  const ranked = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...allPlayers]
      .filter((item) => {
        if (city !== "all" && item.cityKey !== city) return false;
        if (query && !item.fullName.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((left, right) => (sortBy === "wins" ? right.wins - left.wins : right.elo - left.elo));
  }, [allPlayers, city, search, sortBy]);

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
        <div className="grid items-center gap-3 rounded-xl p-4 md:grid-cols-[1fr_auto_auto_auto] md:p-5" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
          <FormInput placeholder={t("players.searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} />
          <FormSelect value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="all">{t("players.cityPlaceholder")}</option>
            {uzbekCities.map((cityKey) => (
              <option key={cityKey} value={cityKey}>
                {t(`common.cities.${cityKey}`)}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="elo">{t("players.sortByElo")}</option>
            <option value="wins">{t("players.sortByWins")}</option>
          </FormSelect>
          <span className="whitespace-nowrap text-center text-sm font-semibold md:px-2" style={{ color: "var(--muted)" }}>
            {formatNumber(ranked.length)}
          </span>
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
