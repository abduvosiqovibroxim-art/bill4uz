"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { ParticipantsTable } from "@/components/tournament/ParticipantsTable";
import { ResultsTable } from "@/components/tournament/ResultsTable";
import { ScheduleTable } from "@/components/tournament/ScheduleTable";
import { TournamentBracket } from "@/components/tournament/TournamentBracket";
import { useCreateTournamentApplicationMutation, useMyTournamentApplicationQuery, usePlayersQuery, useTournamentQuery } from "@/lib/api/hooks";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import { getLocalizedText } from "@/lib/locale";
import { PlayerLevelKey, TournamentDetail, TournamentMatch } from "@/lib/types";
import { FormSelect, GlowButton, NoticePanel, SectionShell, SurfaceCard } from "@/components/ui";

const baseTabs = ["info", "participants", "grid", "matches", "results", "regulation"] as const;
type TournamentTab = (typeof baseTabs)[number];
type ScheduleFilterStatus = "all" | TournamentMatch["status"];

export function TournamentDetailPageClient({ id }: { id: string }) {
  const { locale, t, text, formatDate } = useI18n();
  const { status: authStatus, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TournamentTab>("info");
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleFilterStatus>("all");
  const [scheduleTable, setScheduleTable] = useState("all");
  const playersQuery = usePlayersQuery();
  const tournamentQuery = useTournamentQuery(id);
  const myApplicationQuery = useMyTournamentApplicationQuery(id, authStatus === "authenticated" && user?.role === "PLAYER");
  const createApplicationMutation = useCreateTournamentApplicationMutation(id);
  const currentPlayer =
    authStatus === "authenticated" && user?.role === "PLAYER"
      ? (playersQuery.data ?? []).find((player) => player.userId === user.id) ?? null
      : null;

  if (tournamentQuery.isPending) {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  if (tournamentQuery.isError) {
    return (
      <SectionShell>
        <ErrorState onRetry={() => tournamentQuery.refetch()} />
      </SectionShell>
    );
  }

  const tournament = tournamentQuery.data;
  if (!tournament) {
    return (
      <SectionShell>
        <EmptyState message={t("system.notFoundText")} />
      </SectionShell>
    );
  }

  const tableOptions = [...new Set(tournament.matches.map((match) => match.tableNumber).filter((value): value is number => typeof value === "number"))];
  const description = localizedDescription(tournament, locale);
  const regulation = localizedRegulation(tournament, locale);
  const tabs = regulation ? baseTabs : baseTabs.filter((tab) => tab !== "regulation");
  const filteredSchedule = tournament.matches
    .filter((match) => (scheduleStatus === "all" ? true : match.status === scheduleStatus))
    .filter((match) => (scheduleTable === "all" ? true : String(match.tableNumber ?? "") === scheduleTable))
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());
  const mutationApplicationStatus = createApplicationMutation.data?.status ?? null;
  const storedApplicationStatus = myApplicationQuery.data?.status ?? null;
  const applicationStatus =
    mutationApplicationStatus ??
    (isAutoJoinTournament(tournament) && storedApplicationStatus === "PENDING" ? null : storedApplicationStatus);

  useEffect(() => {
    if (activeTab === "regulation" && !regulation) {
      setActiveTab("grid");
    }
  }, [activeTab, regulation]);

  return (
    <div className="space-y-6 pb-12 tournament-detail-page">
      <SectionShell tone="hero">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1.5 text-xs font-black uppercase rounded-lg" style={{ background: "var(--emerald)", color: "var(--bg)" }}>
              {t(`common.statuses.${tournament.status}`)}
            </span>
            <span className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {t(`common.disciplines.${tournament.disciplineKey}`)}
            </span>
            <span className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {formatLabel(tournament, locale, t)}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-black leading-tight" style={{ color: "var(--text)" }}>{text(tournament.title)}</h1>
            {description ? <p className="text-lg" style={{ color: "var(--muted)" }}>{description}</p> : null}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{t("tournamentCenter.info.dateTime")}</p>
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>{formatDate(tournament.startsAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{t("tournamentCenter.info.club")}</p>
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>{tournament.club ? text(tournament.club.name) : "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{t("tournamentCenter.info.format")}</p>
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>{formatLabel(tournament, locale, t)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{t("tournamentCenter.info.participants")}</p>
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>{participantsProgress(tournament)}</p>
            </div>
          </div>

          <ApplicationCta
            tournament={tournament}
            authStatus={authStatus}
            userRole={user?.role}
            playerLevel={currentPlayer?.currentLevel ?? null}
            applicationStatus={applicationStatus}
            isSubmitting={createApplicationMutation.isPending}
            feedback={toApplicationErrorMessage(createApplicationMutation.error, locale, t)}
            onApply={() => createApplicationMutation.mutate()}
          />
        </div>
      </SectionShell>

      <SectionShell>
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-bold rounded-lg transition-all hover:scale-105"
              style={{
                background: activeTab === tab ? "var(--accent)" : "var(--surface)",
                color: activeTab === tab ? "var(--bg)" : "var(--text)",
                border: activeTab === tab ? "1px solid var(--accent)" : "1px solid var(--card-border)"
              }}
            >
              {tabLabel(tab, locale, t)}
            </button>
          ))}
        </div>
      </SectionShell>

      {activeTab === "info" ? <InfoTab tournament={tournament} /> : null}

      {activeTab === "participants" ? (
        <SectionShell>
          <ParticipantsTable participants={tournament.participantsList} />
        </SectionShell>
      ) : null}

      {activeTab === "grid" ? (
        <div className="tournament-grid-fullwidth">
          <SectionShell>
            {tournament.bracketSystem === "singleElimination" ? (
              <TournamentBracket rounds={tournament.rounds} />
            ) : (
              <EmptyState message={unsupportedFormatMessage(locale)} />
            )}
          </SectionShell>
        </div>
      ) : null}

      {activeTab === "matches" ? (
        <SectionShell>
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
              <FormSelect value={scheduleStatus} onChange={(event) => setScheduleStatus(event.target.value as ScheduleFilterStatus)}>
                <option value="all">{t("tournamentCenter.schedule.allStatuses")}</option>
                <option value="pending">{t("tournamentCenter.bracket.pending")}</option>
                <option value="ready">{t("tournamentCenter.bracket.ready")}</option>
                <option value="live">{t("tournamentCenter.bracket.live")}</option>
                <option value="finished">{t("tournamentCenter.bracket.finished")}</option>
              </FormSelect>
              <FormSelect value={scheduleTable} onChange={(event) => setScheduleTable(event.target.value)}>
                <option value="all">{t("tournamentCenter.schedule.allTables")}</option>
                {tableOptions.map((tableNumber) => (
                  <option key={tableNumber} value={String(tableNumber)}>
                    {t("tournamentCenter.schedule.tableLabel")} {tableNumber}
                  </option>
                ))}
              </FormSelect>
            </div>

            <ScheduleTable matches={filteredSchedule} />
          </div>
        </SectionShell>
      ) : null}

      {activeTab === "results" ? (
        <SectionShell>
          <ResultsTable results={tournament.results} />
        </SectionShell>
      ) : null}

      {activeTab === "regulation" && regulation ? <RegulationTab regulation={regulation} /> : null}
    </div>
  );
}

function InfoTab({ tournament }: { tournament: TournamentDetail }) {
  const { locale, t, text, formatDate, formatCurrency } = useI18n();
  const rows = [
    { label: t("tournamentCenter.info.dateTime"), value: formatDate(tournament.startsAt) },
    { label: t("tournamentCenter.info.club"), value: tournament.club ? text(tournament.club.name) : "-" },
    { label: t("tournamentCenter.info.format"), value: formatLabel(tournament, locale, t) },
    { label: t("tournamentCenter.info.prizePool"), value: formatCurrency(tournament.prizePool) },
    { label: t("tournamentCenter.info.participants"), value: String(tournament.participants) }
  ];

  return (
    <SectionShell>
      <div className="p-8 rounded-xl space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2">
            <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>{row.label}</span>
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function RegulationTab({ regulation }: { regulation: string }) {
  const { t } = useI18n();

  return (
    <SectionShell>
      <div className="p-8 rounded-xl space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
        <h2 className="text-xl font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>{t("tournamentCenter.regulation.title")}</h2>
        <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "var(--text)" }}>{regulation}</p>
      </div>
    </SectionShell>
  );
}

function ApplicationCta({
  tournament,
  authStatus,
  userRole,
  playerLevel,
  applicationStatus,
  isSubmitting,
  feedback,
  onApply
}: {
  tournament: TournamentDetail;
  authStatus: "loading" | "authenticated" | "anonymous";
  userRole: string | undefined;
  playerLevel: PlayerLevelKey | null;
  applicationStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  isSubmitting: boolean;
  feedback: string | null;
  onApply: () => void;
}) {
  const { locale, t } = useI18n();

  if (authStatus === "loading") {
    return null;
  }

  if (applicationStatus) {
    const statusLabel = applicationStatusLabel(applicationStatus, locale);
    const statusColor = applicationStatus === "APPROVED" ? "var(--emerald)" : applicationStatus === "PENDING" ? "var(--accent)" : "var(--muted)";

    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="px-3 py-1.5 text-sm font-black uppercase rounded-lg" style={{ background: statusColor, color: "var(--bg)" }}>
          {statusLabel}
        </span>
        {feedback ? <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>{feedback}</span> : null}
      </div>
    );
  }

  if (authStatus === "anonymous") {
    return (
      <Link href={`/auth/signin?next=${encodeURIComponent(`/tournaments/${tournament.id}`)}`}>
        <GlowButton variant="secondary">{t("tournamentCenter.actions.participate")}</GlowButton>
      </Link>
    );
  }

  if (userRole !== "PLAYER") {
    return <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>{t("tournamentCenter.actions.playersOnly")}</span>;
  }

  if (tournament.status !== "registration") {
    return <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>{t("tournamentCenter.actions.registrationClosed")}</span>;
  }

  if (isTournamentFull(tournament)) {
    return <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>{joinStatusLabel("full", locale)}</span>;
  }

  if (playerLevel && !isLevelAllowed(playerLevel, tournament.minPlayerLevel, tournament.maxPlayerLevel)) {
    return <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>{joinStatusLabel("level", locale)}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <GlowButton variant="secondary" onClick={onApply} disabled={isSubmitting}>
        {isSubmitting ? t("commonUi.loading") : t("tournamentCenter.actions.participate")}
      </GlowButton>
      {feedback ? <NoticePanel tone="error" className="py-2 text-sm">{feedback}</NoticePanel> : null}
    </div>
  );
}

function tabLabel(tab: TournamentTab, locale: "ru" | "uz" | "en", t: (path: string) => string) {
  if (tab === "info") {
    return locale === "ru" ? "Обзор" : locale === "uz" ? "Umumiy" : "Overview";
  }

  if (tab === "grid") {
    return locale === "ru" ? "Сетка" : locale === "uz" ? "Setka" : "Bracket";
  }

  if (tab === "matches") {
    if (locale === "ru") {
      return "Матчи";
    }

    if (locale === "uz") {
      return "Matchlar";
    }

    return "Matches";
  }

  if (tab === "results") {
    return locale === "ru" ? "Результаты" : locale === "uz" ? "Natijalar" : "Results";
  }

  return t(`tournamentCenter.tabs.${tab}`);
}

function formatLabel(tournament: TournamentDetail, locale: "ru" | "uz" | "en", t: (path: string) => string) {
  const formatKey = tournament.bracketSystem === "singleElimination"
    ? "tournamentCenter.formats.singleElimination"
    : null;
  const participantLabel = tournament.bracketSize ?? tournament.participants;

  if (!formatKey) {
    return `${soonFormatLabel(tournament.bracketSystem, locale)} / ${participantLabel} ${t("tournamentCenter.formats.playersSuffix")}`;
  }

  return `${t(formatKey)} / ${participantLabel} ${t("tournamentCenter.formats.playersSuffix")}`;
}

function localizedDescription(tournament: TournamentDetail, locale: "ru" | "uz" | "en") {
  return normalizeRegulationText(getLocalizedText(tournament.description, locale));
}

function toApplicationErrorMessage(error: unknown, locale: "ru" | "uz" | "en", t: (path: string) => string) {
  if (!error) {
    return null;
  }

  return getUserFacingApiError(error, {
    locale,
    t,
    payloadMessageKeys: {
      "Applications are only available while tournament registration is open.": "tournamentCenter.actions.registrationClosed",
      "Applications are closed after bracket generation.": "tournamentCenter.actions.registrationClosed",
      "You have already applied to this tournament.": "tournamentCenter.actions.alreadyApplied",
      "Tournament participant pool is already full.": "tournamentCenter.actions.noSpots",
      "Tournament is not available for your level.": "tournamentCenter.actions.levelRestricted",
      "Tournament registration is managed manually.": "tournamentCenter.actions.registrationClosed"
    },
    debugLabel: "tournament-application"
  });
}

function applicationStatusLabel(status: "PENDING" | "APPROVED" | "REJECTED", locale: "ru" | "uz" | "en") {
  const labels = {
    ru: {
      PENDING: "На рассмотрении",
      APPROVED: "Вы участник",
      REJECTED: "Регистрация закрыта"
    },
    uz: {
      PENDING: "Ko'rib chiqilmoqda",
      APPROVED: "Siz ishtirokchisiz",
      REJECTED: "Ro'yxat yopilgan"
    },
    en: {
      PENDING: "Under review",
      APPROVED: "You are a participant",
      REJECTED: "Registration closed"
    }
  } as const;

  return labels[locale][status];
}

function localizedRegulation(tournament: TournamentDetail, locale: "ru" | "uz" | "en") {
  const candidates = [
    getLocalizedText(tournament.regulation.format, locale),
    getLocalizedText(tournament.regulation.entryFee, locale),
    ...tournament.regulation.participationTerms.map((item) => getLocalizedText(item, locale)),
    ...tournament.regulation.restrictions.map((item) => getLocalizedText(item, locale)),
    ...tournament.regulation.notes.map((item) => getLocalizedText(item, locale))
  ];

  for (const candidate of candidates) {
    const normalized = normalizeRegulationText(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeRegulationText(value: string) {
  const normalized = value.trim();
  return normalized === "-" ? "" : normalized;
}

function isTournamentFull(tournament: TournamentDetail) {
  if (!tournament.bracketSize) {
    return false;
  }

  return tournament.participants >= tournament.bracketSize;
}

function participantsProgress(tournament: TournamentDetail) {
  return tournament.bracketSize ? `${tournament.participants} / ${tournament.bracketSize}` : String(tournament.participants);
}

function unsupportedFormatMessage(locale: "ru" | "uz" | "en") {
  if (locale === "ru") {
    return "Этот формат сетки пока недоступен";
  }

  if (locale === "uz") {
    return "Bu setka formati hozircha mavjud emas";
  }

  return "This bracket format is not available yet";
}

function soonFormatLabel(format: string, locale: "ru" | "uz" | "en") {
  const labels: Record<string, string> = {
    doubleElimination: "Double Elimination",
    roundRobin: "Round Robin",
    swiss: "Swiss",
    groupPlayoff: "Group + Playoff"
  };
  const suffix = locale === "ru" ? "скоро" : locale === "uz" ? "tez orada" : "soon";
  return `${labels[format] ?? format} - ${suffix}`;
}

function isLevelAllowed(playerLevel: PlayerLevelKey, minLevel: PlayerLevelKey, maxLevel: PlayerLevelKey) {
  const order: Record<PlayerLevelKey, number> = {
    novice: 0,
    amateur: 1,
    strongAmateur: 2,
    semiPro: 3,
    pro: 4
  };

  const value = order[playerLevel];
  return value >= order[minLevel] && value <= order[maxLevel];
}

function isAutoJoinTournament(tournament: TournamentDetail) {
  return tournament.participantSelectionMode === "direct" || tournament.tournamentType === "visitor" || tournament.tournamentType === "amateur";
}

function joinStatusLabel(key: "full" | "level", locale: "ru" | "uz" | "en") {
  const labels = {
    ru: {
      full: "Мест нет",
      level: "Недоступно по уровню"
    },
    uz: {
      full: "Joy qolmagan",
      level: "Daraja bo'yicha mavjud emas"
    },
    en: {
      full: "No spots left",
      level: "Level restricted"
    }
  } as const;

  return labels[locale][key];
}
