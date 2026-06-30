"use client";

import { useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardKit";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { usePlayersQuery, useUpdatePlayerAdminMutation } from "@/lib/api/hooks";
import { FormInput, FormSelect, GlowButton, SurfaceCard } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { playerLevelOptions } from "@/lib/tournamentTaxonomy";
import type { Player, PlayerLevelKey } from "@/lib/types";

// Web uses lowercase level keys; the API expects the Prisma enum (uppercase).
const KEY_TO_ENUM: Record<PlayerLevelKey, string> = {
  novice: "NOVICE",
  amateur: "AMATEUR",
  strongAmateur: "STRONG_AMATEUR",
  semiPro: "SEMI_PRO",
  pro: "PRO"
};

const subtitleByLocale: Record<"ru" | "uz" | "en", string> = {
  ru: "Ручная коррекция ELO и уровня игроков. Уровень задаётся напрямую, очки выравниваются автоматически.",
  uz: "O'yinchilarning ELO va darajasini qo'lda tuzatish. Daraja to'g'ridan-to'g'ri tanlanadi.",
  en: "Manually adjust player ELO and level. The level is set directly and points are aligned automatically."
};

const searchPlaceholderByLocale: Record<"ru" | "uz" | "en", string> = {
  ru: "Поиск игрока по имени…",
  uz: "O'yinchini ism bo'yicha qidirish…",
  en: "Search player by name…"
};

export default function AdminPlayersPage() {
  const { t, locale } = useI18n();
  const playersQuery = usePlayersQuery();
  const updateMutation = useUpdatePlayerAdminMutation();
  const [search, setSearch] = useState("");

  if (playersQuery.isPending) {
    return <LoadingState />;
  }

  if (playersQuery.isError) {
    return <ErrorState onRetry={() => playersQuery.refetch()} />;
  }

  const players = playersQuery.data ?? [];
  const query = search.trim().toLowerCase();
  const filtered = query
    ? players.filter((player) => player.fullName.toLowerCase().includes(query))
    : players;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow={t("dashboard.admin.title")}
        title={t("admin.nav.players")}
        subtitle={subtitleByLocale[locale]}
      />

      <SurfaceCard>
        <FormInput
          placeholder={searchPlaceholderByLocale[locale]}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="mt-2 text-sm text-muted">
          {filtered.length} / {players.length}
        </p>
      </SurfaceCard>

      {filtered.length === 0 ? <EmptyState message={t("common.noResults")} /> : null}
      {filtered.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          onSave={(input) => updateMutation.mutateAsync({ id: player.id, input })}
          isUpdating={updateMutation.isPending}
        />
      ))}
    </div>
  );
}

function PlayerRow({
  player,
  onSave,
  isUpdating
}: {
  player: Player;
  onSave: (input: { elo?: number; level?: string }) => Promise<unknown>;
  isUpdating: boolean;
}) {
  const { t, locale, text } = useI18n();
  const [levelKey, setLevelKey] = useState<PlayerLevelKey>(player.currentLevel);
  const [elo, setElo] = useState(String(player.elo));

  async function handleSave() {
    const input: { elo?: number; level?: string } = { level: KEY_TO_ENUM[levelKey] };
    const eloNum = Number(elo);
    if (elo.trim() !== "" && Number.isFinite(eloNum)) {
      input.elo = Math.max(0, Math.trunc(eloNum));
    }
    try {
      await onSave(input);
    } catch {
      window.alert(t("common.errorText"));
    }
  }

  return (
    <SurfaceCard className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{player.fullName}</p>
          <p className="text-sm text-muted">
            ELO: {player.elo} · {text(player.currentLevelLabel)} · {player.levelPoints} pts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FormInput
            type="number"
            value={elo}
            onChange={(event) => setElo(event.target.value)}
            className="w-28"
            aria-label="ELO"
          />
          <FormSelect value={levelKey} onChange={(event) => setLevelKey(event.target.value as PlayerLevelKey)}>
            {playerLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label[locale]}
              </option>
            ))}
          </FormSelect>
          <GlowButton variant="secondary" onClick={() => void handleSave()} disabled={isUpdating}>
            {isUpdating ? "..." : t("admin.actions.save")}
          </GlowButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
