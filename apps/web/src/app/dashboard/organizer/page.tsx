"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DashboardActionCard,
  DashboardActionGrid,
  DashboardList,
  DashboardListItem,
  DashboardMetric,
  DashboardMetricGrid,
  DashboardPageHeader,
  DashboardSection,
  DashboardSplit
} from "@/components/dashboard/DashboardKit";
import { dashboardCopy } from "@/components/dashboard/dashboardCopy";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { FormInput, FormSelect, FormTextarea, GlowButton, NoticePanel } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import {
  useClubsQuery,
  useCreateManualDrawTournamentMutation,
  useCreateTournamentAdminMutation,
  useDisciplinesQuery,
  useTournamentDetailsQuery,
  useTournamentsQuery
} from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { getApiPayloadMessage, getUserFacingApiError } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import { getTournamentDisciplineSelectOptions } from "@/lib/activeTournamentDisciplines";
import {
  bracketSystemOptions,
  participantSelectionModeOptions,
  playerLevelOptions,
  tournamentTypeOptions,
  tournamentCategoryOptions,
  tournamentFormatOptions,
  tournamentLevelOptions
} from "@/lib/tournamentTaxonomy";
import type {
  ParticipantSelectionModeKey,
  PlayerLevelKey,
  Tournament,
  TournamentBracketSystemKey,
  TournamentCategoryKey,
  TournamentDetail,
  TournamentEventFormatKey,
  TournamentLevelKey,
  TournamentTypeKey
} from "@/lib/types";

type OrganizerTournamentStatus = "DRAFT" | "REGISTRATION";
type ParticipantMode = ParticipantSelectionModeKey;
type ApiTournamentCategory =
  | "MEN"
  | "WOMEN"
  | "JUNIORS"
  | "GIRLS"
  | "AMATEURS"
  | "PROFESSIONALS"
  | "OPEN"
  | "TEAM"
  | "PERSONAL";
type ApiTournamentLevel =
  | "OPEN_TOURNAMENT"
  | "CHAMPIONSHIP"
  | "CUP"
  | "LEAGUE"
  | "RATED_TOURNAMENT"
  | "FRIENDLY_TOURNAMENT"
  | "CLUB_TOURNAMENT";
type ApiTournamentFormat = "INDIVIDUAL" | "TEAM" | "TEAM_2X2" | "TEAM_3X3";
type ApiBracketSystem = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS" | "GROUP_PLAYOFF";
type ApiParticipantSelectionMode = "APPLICATIONS" | "DIRECT" | "MANUAL_DRAW";
type ApiTournamentType = "VISITOR" | "AMATEUR" | "PRO";
type ApiPlayerLevel = "NOVICE" | "AMATEUR" | "STRONG_AMATEUR" | "SEMI_PRO" | "PRO";

const categoryToApiValue: Record<TournamentCategoryKey, ApiTournamentCategory> = {
  men: "MEN",
  women: "WOMEN",
  juniors: "JUNIORS",
  girls: "GIRLS",
  amateurs: "AMATEURS",
  professionals: "PROFESSIONALS",
  open: "OPEN",
  team: "TEAM",
  personal: "PERSONAL"
};

const levelToApiValue: Record<TournamentLevelKey, ApiTournamentLevel> = {
  openTournament: "OPEN_TOURNAMENT",
  championship: "CHAMPIONSHIP",
  cup: "CUP",
  league: "LEAGUE",
  ratedTournament: "RATED_TOURNAMENT",
  friendlyTournament: "FRIENDLY_TOURNAMENT",
  clubTournament: "CLUB_TOURNAMENT"
};

const formatToApiValue: Record<TournamentEventFormatKey, ApiTournamentFormat> = {
  individual: "INDIVIDUAL",
  team: "TEAM",
  team2x2: "TEAM_2X2",
  team3x3: "TEAM_3X3"
};

const bracketSystemToApiValue: Record<TournamentBracketSystemKey, ApiBracketSystem> = {
  singleElimination: "SINGLE_ELIMINATION",
  doubleElimination: "DOUBLE_ELIMINATION",
  roundRobin: "ROUND_ROBIN",
  swiss: "SWISS",
  groupPlayoff: "GROUP_PLAYOFF"
};

const participantModeToApiValue: Record<ParticipantMode, ApiParticipantSelectionMode> = {
  applications: "APPLICATIONS",
  direct: "DIRECT",
  manualDraw: "MANUAL_DRAW"
};

const tournamentTypeToApiValue: Record<TournamentTypeKey, ApiTournamentType> = {
  visitor: "VISITOR",
  amateur: "AMATEUR",
  pro: "PRO"
};

const playerLevelToApiValue: Record<PlayerLevelKey, ApiPlayerLevel> = {
  novice: "NOVICE",
  amateur: "AMATEUR",
  strongAmateur: "STRONG_AMATEUR",
  semiPro: "SEMI_PRO",
  pro: "PRO"
};

function buildOptionalLocalizedValue(value: string) {
  const trimmed = value.trim();
  return trimmed
    ? {
        ru: trimmed,
        uz: trimmed,
        en: trimmed
      }
    : undefined;
}

export default function OrganizerDashboardPage() {
  const { locale, t, text } = useI18n();
  const c = dashboardCopy(locale);
  const router = useRouter();
  const { user } = useAuth();
  const tournamentsQuery = useTournamentsQuery();
  const clubsQuery = useClubsQuery();
  const disciplinesQuery = useDisciplinesQuery();
  const createTournamentMutation = useCreateTournamentAdminMutation();
  const createManualDrawTournamentMutation = useCreateManualDrawTournamentMutation();
  const [feedback, setFeedback] = useState<{ tone: "default" | "error"; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [participantMode, setParticipantMode] = useState<ParticipantMode>("direct");
  const [participantName, setParticipantName] = useState("");
  const [manualParticipants, setManualParticipants] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    clubId: "",
    disciplineId: "",
    category: "open" as TournamentCategoryKey,
    tournamentLevel: "openTournament" as TournamentLevelKey,
    tournamentType: "visitor" as TournamentTypeKey,
    eventFormat: "individual" as TournamentEventFormatKey,
    bracketSystem: "singleElimination" as TournamentBracketSystemKey,
    minPlayerLevel: "novice" as PlayerLevelKey,
    maxPlayerLevel: "pro" as PlayerLevelKey,
    repeatEveryDays: "" as "" | "2" | "3" | "7",
    startsAt: "",
    prizePool: "0",
    bracketSize: "8",
    status: "DRAFT" as OrganizerTournamentStatus,
    registrationLabel: "",
    description: ""
  });

  const ownTournaments = (tournamentsQuery.data ?? []).filter((tournament) => tournament.organizerId === user?.id);
  const tournamentDetailsQuery = useTournamentDetailsQuery(
    ownTournaments.map((tournament) => tournament.id),
    tournamentsQuery.isSuccess && ownTournaments.length > 0
  );

  useEffect(() => {
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
  }, [form, formErrors.length, manualParticipants, participantMode]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setFormErrors([]);

    const errors = getCreateTournamentValidationErrors(form, c, participantMode, manualParticipants);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const participantSelectionMode: ApiParticipantSelectionMode = participantModeToApiValue[participantMode];

      const tournamentPayload = {
        title: form.title.trim(),
        clubId: form.clubId,
        disciplineId: form.disciplineId,
        category: categoryToApiValue[form.category],
        tournamentLevel: levelToApiValue[form.tournamentLevel],
        tournamentType: tournamentTypeToApiValue[form.tournamentType],
        eventFormat: formatToApiValue[form.eventFormat],
        bracketSystem: bracketSystemToApiValue[form.bracketSystem],
        participantSelectionMode,
        minPlayerLevel: playerLevelToApiValue[form.minPlayerLevel],
        maxPlayerLevel: playerLevelToApiValue[form.maxPlayerLevel],
        repeatEveryDays: form.repeatEveryDays ? Number(form.repeatEveryDays) as 2 | 3 | 7 : null,
        startsAt: new Date(form.startsAt).toISOString(),
        prizePool: Number(form.prizePool),
        bracketSize: Number(form.bracketSize),
        bracketFormat: "SINGLE_ELIMINATION",
        status: form.status,
        registrationLabel: buildOptionalLocalizedValue(form.registrationLabel),
        description: buildOptionalLocalizedValue(form.description)
      } as const;

      if (participantMode === "manualDraw") {
        const created = await createManualDrawTournamentMutation.mutateAsync({
          tournament: tournamentPayload,
          names: manualParticipants.map((name) => name.trim()).filter(Boolean)
        });

        setFeedback({ tone: "default", message: c.organizer.drawCompleted });
        router.push(`/dashboard/organizer/tournaments/${created.id}`);
        return;
      }

      await createTournamentMutation.mutateAsync(tournamentPayload);
      await tournamentsQuery.refetch();

      setForm({
        title: "",
        clubId: "",
        disciplineId: "",
        category: "open",
        tournamentLevel: "openTournament",
        tournamentType: "visitor",
        eventFormat: "individual",
        bracketSystem: "singleElimination",
        minPlayerLevel: "novice",
        maxPlayerLevel: "pro",
        repeatEveryDays: "",
        startsAt: "",
        prizePool: "0",
        bracketSize: "8",
        status: "DRAFT",
        registrationLabel: "",
        description: ""
      });
      setManualParticipants([]);
      setParticipantName("");
      setParticipantMode("direct");
      setFeedback({ tone: "default", message: c.organizer.successCreated });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getOrganizerCreateErrorMessage(error, { locale, t, copy: c })
      });
    }
  }

  const loading =
    tournamentsQuery.isPending ||
    clubsQuery.isPending ||
    disciplinesQuery.isPending ||
    (ownTournaments.length > 0 && tournamentDetailsQuery.isPending);

  if (loading) {
    return <LoadingState label={c.common.loading} />;
  }

  if (tournamentsQuery.isError || clubsQuery.isError || disciplinesQuery.isError || tournamentDetailsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void tournamentsQuery.refetch();
          void clubsQuery.refetch();
          void disciplinesQuery.refetch();
          void tournamentDetailsQuery.refetch();
        }}
      />
    );
  }

  const clubs = clubsQuery.data ?? [];
  const allDisciplines = disciplinesQuery.data ?? [];
  const disciplines = getTournamentDisciplineSelectOptions(allDisciplines, locale);
  const categoryOptions = tournamentCategoryOptions.filter((option) => option.active);
  const tournamentTypeSelectOptions = tournamentTypeOptions.filter((option) => option.active);
  const participantModeSelectOptions = participantSelectionModeOptions.filter((option) => option.active);
  const playerLevelSelectOptions = playerLevelOptions.filter((option) => option.active);
  const formatOptions = tournamentFormatOptions.filter((option) => option.active);
  const bracketTypeOptions = bracketSystemOptions.filter((option) => option.active);
  const createValidationErrors = getCreateTournamentValidationErrors(form, c, participantMode, manualParticipants);
  const isSubmitting = createTournamentMutation.isPending || createManualDrawTournamentMutation.isPending;
  const canCreateTournament = createValidationErrors.length === 0 && clubs.length > 0 && !isSubmitting;
  const details = tournamentDetailsQuery.data ?? [];
  const detailById = new Map(details.map((tournament) => [tournament.id, tournament]));
  const enrichedTournaments = ownTournaments.map((tournament) => detailById.get(tournament.id) ?? tournament);
  const pendingApplications = enrichedTournaments.reduce((total, tournament) => total + tournament.pendingApplicationsCount, 0);
  const participantPool = enrichedTournaments.reduce((total, tournament) => total + tournament.bracketParticipantsCount, 0);
  const bracketReady = enrichedTournaments.filter((tournament) => tournament.bracketGenerated).length;
  const resultAttention = details.reduce(
    (total, tournament) => total + tournament.matches.filter((match) => match.status === "ready" || match.status === "live").length,
    0
  );
  const upcoming = enrichedTournaments
    .filter((tournament) => tournament.status !== "finished" && new Date(tournament.startsAt).getTime() >= Date.now())
    .slice(0, 5);
  const liveOrFinished = enrichedTournaments.filter((tournament) => tournament.status === "live" || tournament.status === "finished").slice(0, 5);
  const attentionItems = enrichedTournaments
    .map((tournament) => ({ tournament, action: nextOrganizerAction(tournament, c) }))
    .filter((item) => Boolean(item.action))
    .slice(0, 6);
  const firstPendingTournament = enrichedTournaments.find((tournament) => tournament.pendingApplicationsCount > 0 && !tournament.bracketGenerated);
  const moderationHref = firstPendingTournament ? `/dashboard/organizer/tournaments/${firstPendingTournament.id}` : "/dashboard/organizer";
  const showTournamentBuckets = upcoming.length > 0 || liveOrFinished.length > 0;
  const createClubHref = "/booking";

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow={c.organizer.eyebrow}
        title={c.organizer.title}
        subtitle={c.organizer.subtitle}
        actions={
          <Link href="#organizer-create-tournament" className="button-primary">
            {c.organizer.create}
          </Link>
        }
      />

      <DashboardMetricGrid columns="md:grid-cols-5">
        <DashboardMetric label={c.organizer.myTournaments} value={ownTournaments.length} />
        <DashboardMetric label={c.organizer.pendingApplications} value={pendingApplications} accent={pendingApplications > 0} />
        <DashboardMetric label={c.organizer.participantPool} value={participantPool} />
        <DashboardMetric label={c.organizer.bracketStatus} value={`${bracketReady}/${ownTournaments.length}`} />
        <DashboardMetric label={c.organizer.needsResult} value={resultAttention} accent={resultAttention > 0} />
      </DashboardMetricGrid>

      <DashboardSplit>
        <DashboardSection title={c.common.quickActions}>
          <DashboardActionGrid>
            <DashboardActionCard href="/tournaments" title={c.organizer.openTournament} description={c.organizer.myTournamentsSubtitle} />
            <DashboardActionCard href={moderationHref} title={c.organizer.moderate} description={c.organizer.pendingApplications} meta={String(pendingApplications)} />
          </DashboardActionGrid>
        </DashboardSection>

        <DashboardSection title={c.common.latestActivity} subtitle={c.organizer.noAttention}>
          {attentionItems.length === 0 ? (
            <EmptyState message={c.organizer.noAttention} />
          ) : (
            <DashboardList>
              {attentionItems.map(({ tournament, action }) => (
                <DashboardListItem
                  key={tournament.id}
                  href={`/dashboard/organizer/tournaments/${tournament.id}`}
                  title={text(tournament.title)}
                  meta={formatTournamentMeta(tournament, locale, t)}
                  aside={<span className="bracket-status bracket-status-live">{action}</span>}
                />
              ))}
            </DashboardList>
          )}
        </DashboardSection>
      </DashboardSplit>

      <DashboardSection id="organizer-create-tournament" title={c.organizer.createTitle} subtitle={c.organizer.createSubtitle}>
        {feedback ? <NoticePanel tone={feedback.tone}>{feedback.message}</NoticePanel> : null}
        {clubs.length === 0 ? (
          <NoticePanel tone="empty" className="space-y-3">
            <p className="text-sm text-white">{c.organizer.noClubForTournament}</p>
            <Link href={createClubHref} className="button-secondary">
              {c.organizer.createClub}
            </Link>
          </NoticePanel>
        ) : null}
        {formErrors.length > 0 ? (
          <NoticePanel tone="error">
            <ul className="m-0 list-disc space-y-1 pl-5 text-sm">
              {formErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </NoticePanel>
        ) : null}
        <form className="dashboard-form-grid" onSubmit={handleCreate}>
          <TournamentFormBlock title={c.organizer.form.mainBlock} help={c.organizer.form.mainBlockHelp}>
            <TournamentFormField label={c.organizer.form.participantMode} help={c.organizer.form.participantModeHelp}>
              <FormSelect value={participantMode} onChange={(event) => setParticipantMode(event.target.value as ParticipantMode)}>
                {participantModeSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.title}>
              <FormInput
                placeholder={c.organizer.form.titlePlaceholder}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.startsAt} help={c.organizer.form.startsAtPlaceholder}>
              <FormInput
                type="datetime-local"
                placeholder={c.organizer.form.startsAtPlaceholder}
                value={form.startsAt}
                onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
              />
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.club}>
              <FormSelect
                value={form.clubId}
                disabled={clubs.length === 0}
                onChange={(event) => setForm((current) => ({ ...current, clubId: event.target.value }))}
              >
                <option value="">{clubs.length === 0 ? c.organizer.form.clubEmptyOption : c.organizer.form.club}</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {text(club.name)}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.discipline}>
              <FormSelect value={form.disciplineId} onChange={(event) => setForm((current) => ({ ...current, disciplineId: event.target.value }))}>
                <option value="">{c.organizer.form.discipline}</option>
                {disciplines.map((discipline) => (
                  <option key={discipline.key} value={discipline.id} disabled={discipline.disabled}>
                    {discipline.label}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.category}>
              <FormSelect
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as TournamentCategoryKey }))}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.tournamentType}>
              <FormSelect
                value={form.tournamentType}
                onChange={(event) => {
                  const nextType = event.target.value as TournamentTypeKey;
                  setForm((current) => ({ ...current, tournamentType: nextType }));
                  setParticipantMode((current) => {
                    if (current === "manualDraw") {
                      return current;
                    }

                    return nextType === "pro" ? "applications" : "direct";
                  });
                }}
              >
                {tournamentTypeSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>
          </TournamentFormBlock>

          <TournamentFormBlock title={c.organizer.form.paramsBlock} help={c.organizer.form.paramsBlockHelp}>
            <TournamentFormField label={c.organizer.form.format}>
              <FormSelect
                value={form.eventFormat}
                onChange={(event) => setForm((current) => ({ ...current, eventFormat: event.target.value as TournamentEventFormatKey }))}
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.bracketType}>
              <FormSelect
                value={form.bracketSystem}
                onChange={(event) => setForm((current) => ({ ...current, bracketSystem: event.target.value as TournamentBracketSystemKey }))}
              >
                {bracketTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.bracketSize} help={c.organizer.form.bracketSizeHelp}>
              <FormSelect value={form.bracketSize} onChange={(event) => setForm((current) => ({ ...current, bracketSize: event.target.value }))}>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={locale === "ru" ? "Мин. уровень игрока" : locale === "uz" ? "O'yinchi min. darajasi" : "Min player level"}>
              <FormSelect
                value={form.minPlayerLevel}
                onChange={(event) => setForm((current) => ({ ...current, minPlayerLevel: event.target.value as PlayerLevelKey }))}
              >
                {playerLevelSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={locale === "ru" ? "Макс. уровень игрока" : locale === "uz" ? "O'yinchi maks. darajasi" : "Max player level"}>
              <FormSelect
                value={form.maxPlayerLevel}
                onChange={(event) => setForm((current) => ({ ...current, maxPlayerLevel: event.target.value as PlayerLevelKey }))}
              >
                {playerLevelSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={locale === "ru" ? "Повторять турнир" : locale === "uz" ? "Turnirni takrorlash" : "Repeat tournament"}>
              <FormSelect
                value={form.repeatEveryDays}
                onChange={(event) => setForm((current) => ({ ...current, repeatEveryDays: event.target.value as "" | "2" | "3" | "7" }))}
              >
                <option value="">{locale === "ru" ? "Не повторять" : locale === "uz" ? "Takrorlamaslik" : "No repeat"}</option>
                <option value="2">{locale === "ru" ? "Каждые 2 дня" : locale === "uz" ? "Har 2 kunda" : "Every 2 days"}</option>
                <option value="3">{locale === "ru" ? "Каждые 3 дня" : locale === "uz" ? "Har 3 kunda" : "Every 3 days"}</option>
                <option value="7">{locale === "ru" ? "Каждую неделю" : locale === "uz" ? "Har hafta" : "Every week"}</option>
              </FormSelect>
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.prizePool} help={c.organizer.form.prizePoolHelp}>
              <FormInput
                type="number"
                min={0}
                placeholder={c.organizer.form.prizePoolPlaceholder}
                value={form.prizePool}
                onChange={(event) => setForm((current) => ({ ...current, prizePool: event.target.value }))}
              />
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.status} help={c.organizer.form.statusHelp}>
              <FormSelect value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as OrganizerTournamentStatus }))}>
                <option value="DRAFT">{t("common.statuses.draft")}</option>
                <option value="REGISTRATION">{t("common.statuses.registration")}</option>
              </FormSelect>
            </TournamentFormField>
          </TournamentFormBlock>

          <TournamentFormBlock title={c.organizer.form.publicBlock} help={c.organizer.form.publicBlockHelp}>
            <TournamentFormField label={c.organizer.form.registrationLabel}>
              <FormInput
                placeholder={c.organizer.form.registrationLabelPlaceholder}
                value={form.registrationLabel}
                onChange={(event) => setForm((current) => ({ ...current, registrationLabel: event.target.value }))}
              />
            </TournamentFormField>

            <TournamentFormField label={c.organizer.form.description}>
              <FormTextarea
                className="min-h-32"
                placeholder={c.organizer.form.descriptionPlaceholder}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </TournamentFormField>
          </TournamentFormBlock>

          {participantMode === "manualDraw" ? (
            <TournamentFormBlock title={c.organizer.form.manualListTitle} help={c.organizer.form.manualListHelp}>
              <div className="dashboard-manual-draw-entry">
                <TournamentFormField label={c.organizer.form.participantNameLabel}>
                  <FormInput
                    placeholder={c.organizer.form.participantNamePlaceholder}
                    value={participantName}
                    onChange={(event) => setParticipantName(event.target.value)}
                  />
                </TournamentFormField>
                <GlowButton type="button" variant="secondary" onClick={() => addManualParticipant()}>
                  {c.organizer.form.addParticipant}
                </GlowButton>
              </div>

              <NoticePanel tone="empty">
                {c.organizer.form.manualCount}: {manualParticipants.length}/{form.bracketSize}. {c.organizer.form.drawHelp}
              </NoticePanel>

              {manualParticipants.length === 0 ? (
                <EmptyState message={c.organizer.form.manualEmpty} />
              ) : (
                <div className="dashboard-manual-participant-list">
                  {manualParticipants.map((name, index) => (
                    <div key={`${name}-${index}`} className="dashboard-manual-participant-row">
                      <FormInput
                        value={name}
                        onChange={(event) => editManualParticipant(index, event.target.value)}
                        aria-label={`${c.organizer.form.participantNameLabel} ${index + 1}`}
                      />
                      <GlowButton type="button" variant="secondary" onClick={() => removeManualParticipant(index)}>
                        {c.organizer.form.removeParticipant}
                      </GlowButton>
                    </div>
                  ))}
                </div>
              )}
            </TournamentFormBlock>
          ) : null}

          <GlowButton className="justify-self-start" type="submit" disabled={!canCreateTournament}>
            {isSubmitting ? t("commonUi.loading") : participantMode === "manualDraw" ? c.organizer.form.runDraw : c.organizer.create}
          </GlowButton>
        </form>
      </DashboardSection>

      <DashboardSection title={c.organizer.myTournaments} subtitle={c.organizer.myTournamentsSubtitle}>
        {enrichedTournaments.length === 0 ? (
          <EmptyState message={c.organizer.noTournaments} />
        ) : (
          <DashboardList>
            {enrichedTournaments.map((tournament) => (
              <TournamentWorkItem key={tournament.id} tournament={tournament} locale={locale} statusLabel={(status) => t(`common.statuses.${status}`)} title={text(tournament.title)} copy={c} />
            ))}
          </DashboardList>
        )}
      </DashboardSection>

      {showTournamentBuckets ? (
        <DashboardSplit>
          <DashboardSection title={c.organizer.upcoming}>
            {upcoming.length === 0 ? (
              <EmptyState message={c.common.noData} />
            ) : (
              <DashboardList>
                {upcoming.map((tournament) => (
                  <DashboardListItem key={tournament.id} href={`/dashboard/organizer/tournaments/${tournament.id}`} title={text(tournament.title)} meta={formatTournamentMeta(tournament, locale, (status) => t(`common.statuses.${status}`))} />
                ))}
              </DashboardList>
            )}
          </DashboardSection>

          <DashboardSection title={c.organizer.liveFinished}>
            {liveOrFinished.length === 0 ? (
              <EmptyState message={c.common.noData} />
            ) : (
              <DashboardList>
                {liveOrFinished.map((tournament) => (
                  <DashboardListItem key={tournament.id} href={`/dashboard/organizer/tournaments/${tournament.id}`} title={text(tournament.title)} meta={formatTournamentMeta(tournament, locale, (status) => t(`common.statuses.${status}`))} />
                ))}
              </DashboardList>
            )}
          </DashboardSection>
        </DashboardSplit>
      ) : null}
    </div>
  );

  function addManualParticipant() {
    const nextName = participantName.trim();
    if (!nextName) {
      setFeedback({ tone: "error", message: c.organizer.form.errors.manualEmptyName });
      return;
    }

    if (manualParticipants.length >= Number(form.bracketSize)) {
      setFeedback({ tone: "error", message: c.organizer.form.errors.manualTooMany });
      return;
    }

    if (manualParticipants.some((name) => normalizeParticipantName(name) === normalizeParticipantName(nextName))) {
      setFeedback({ tone: "error", message: c.organizer.form.errors.manualDuplicate });
      return;
    }

    setManualParticipants((current) => [...current, nextName]);
    setParticipantName("");
    setFormErrors([]);
    setFeedback(null);
  }

  function editManualParticipant(index: number, value: string) {
    setManualParticipants((current) => current.map((name, currentIndex) => (currentIndex === index ? value : name)));
  }

  function removeManualParticipant(index: number) {
    setManualParticipants((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }
}

function TournamentFormBlock({
  title,
  help,
  children
}: {
  title: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="dashboard-tournament-form-block">
      <legend className="dashboard-tournament-form-legend">{title}</legend>
      <p className="dashboard-tournament-form-help">{help}</p>
      <div className="dashboard-tournament-form-grid">{children}</div>
    </fieldset>
  );
}

function TournamentFormField({
  label,
  help,
  children
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="dashboard-tournament-form-field">
      <span className="dashboard-tournament-form-label">{label}</span>
      {children}
      {help ? <span className="dashboard-tournament-form-field-help">{help}</span> : null}
    </label>
  );
}

function getCreateTournamentValidationErrors(
  form: {
    title: string;
    clubId: string;
    disciplineId: string;
    category: TournamentCategoryKey;
    tournamentLevel: TournamentLevelKey;
    tournamentType: TournamentTypeKey;
    eventFormat: TournamentEventFormatKey;
    bracketSystem: TournamentBracketSystemKey;
    minPlayerLevel: PlayerLevelKey;
    maxPlayerLevel: PlayerLevelKey;
    repeatEveryDays: "" | "2" | "3" | "7";
    startsAt: string;
    prizePool: string;
    bracketSize: string;
  },
  copy: ReturnType<typeof dashboardCopy>,
  participantMode: ParticipantMode,
  manualParticipants: string[]
) {
  const errors: string[] = [];

  if (!form.title.trim()) {
    errors.push(copy.organizer.form.errors.title);
  }

  if (!form.clubId) {
    errors.push(copy.organizer.form.errors.club);
  }

  if (!form.startsAt || Number.isNaN(new Date(form.startsAt).getTime())) {
    errors.push(copy.organizer.form.errors.startsAt);
  }

  if (!form.disciplineId) {
    errors.push(copy.organizer.form.errors.discipline);
  }

  if (!categoryToApiValue[form.category]) {
    errors.push(copy.organizer.form.errors.category);
  }

  if (!levelToApiValue[form.tournamentLevel]) {
    errors.push(copy.organizer.form.errors.tournamentType);
  }

  if (!tournamentTypeToApiValue[form.tournamentType]) {
    errors.push(copy.organizer.form.errors.tournamentType);
  }

  if (!playerLevelToApiValue[form.minPlayerLevel] || !playerLevelToApiValue[form.maxPlayerLevel]) {
    errors.push(copy.organizer.form.errors.tournamentType);
  }

  const levelOrder: Record<PlayerLevelKey, number> = {
    novice: 0,
    amateur: 1,
    strongAmateur: 2,
    semiPro: 3,
    pro: 4
  };

  if (levelOrder[form.minPlayerLevel] > levelOrder[form.maxPlayerLevel]) {
    errors.push(copy.organizer.form.errors.tournamentType);
  }

  if (!formatToApiValue[form.eventFormat] || form.eventFormat !== "individual") {
    errors.push(copy.organizer.form.errors.format);
  }

  if (!bracketSystemToApiValue[form.bracketSystem] || form.bracketSystem !== "singleElimination") {
    errors.push(copy.organizer.form.errors.bracketType);
  }

  const prizePool = Number(form.prizePool);
  if (!Number.isFinite(prizePool) || prizePool < 0) {
    errors.push(copy.organizer.form.errors.prizePool);
  }

  if (!["8", "16", "32", "64"].includes(form.bracketSize)) {
    errors.push(copy.organizer.form.errors.bracketSize);
  }

  if (!["", "2", "3", "7"].includes(form.repeatEveryDays)) {
    errors.push(copy.organizer.form.errors.tournamentType);
  }

  if (participantMode === "manualDraw") {
    const normalizedNames = manualParticipants.map((name) => name.trim()).filter(Boolean);
    const uniqueNames = new Set(normalizedNames.map(normalizeParticipantName));

    if (normalizedNames.length < 2) {
      errors.push(copy.organizer.form.errors.manualMinimum);
    }

    if (normalizedNames.length > Number(form.bracketSize)) {
      errors.push(copy.organizer.form.errors.manualTooMany);
    }

    if (uniqueNames.size !== normalizedNames.length) {
      errors.push(copy.organizer.form.errors.manualDuplicate);
    }
  }

  return errors;
}

function getOrganizerCreateErrorMessage(
  error: unknown,
  {
    locale,
    t,
    copy
  }: {
    locale: "ru" | "uz" | "en";
    t: (path: string) => string;
    copy: ReturnType<typeof dashboardCopy>;
  }
) {
  if (error instanceof ApiError) {
    const payloadMessage = getApiPayloadMessage(error.payload);

    if (payloadMessage) {
      const normalizedMessage = payloadMessage.toLowerCase();

      if (normalizedMessage.includes("title")) {
        return copy.organizer.form.errors.title;
      }

      if (normalizedMessage.includes("club")) {
        return copy.organizer.form.errors.club;
      }

      if (normalizedMessage.includes("discipline")) {
        return copy.organizer.form.errors.discipline;
      }

      if (normalizedMessage.includes("start")) {
        return copy.organizer.form.errors.startsAt;
      }

      if (normalizedMessage.includes("bracket size")) {
        return copy.organizer.form.errors.bracketSize;
      }

      if (payloadMessage.includes("Club not found")) {
        return copy.organizer.form.errors.club;
      }

      if (payloadMessage.includes("Only free pyramid and Russian pyramid tournaments are allowed")) {
        return copy.organizer.form.errors.discipline;
      }

      if (payloadMessage.includes("Only single elimination bracket is currently available")) {
        return copy.organizer.form.errors.bracketType;
      }

      if (payloadMessage.includes("Only individual tournament format is currently available")) {
        return copy.organizer.form.errors.format;
      }

      if (payloadMessage.includes("Tournament min level must not exceed max level")) {
        return copy.organizer.form.errors.tournamentType;
      }
    }
  }

  return getUserFacingApiError(error, {
    locale,
    t,
    fallbackKey: "system.errorText",
    debugLabel: "organizer-create-tournament"
  });
}

function normalizeParticipantName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function TournamentWorkItem({
  tournament,
  title,
  locale,
  statusLabel,
  copy
}: {
  tournament: Tournament | TournamentDetail;
  title: string;
  locale: "ru" | "uz" | "en";
  statusLabel: (status: string) => string;
  copy: ReturnType<typeof dashboardCopy>;
}) {
  const action = nextOrganizerAction(tournament, copy) ?? copy.common.manage;

  return (
    <DashboardListItem
      title={title}
      meta={formatTournamentMeta(tournament, locale, statusLabel)}
      aside={<Link href={`/dashboard/organizer/tournaments/${tournament.id}`} className="button-secondary">{action}</Link>}
    >
      <div className="dashboard-chip-row">
        <span className={`bracket-status bracket-status-${tournament.status}`}>{statusLabel(tournament.status)}</span>
        <span className="pill">{copy.organizer.pendingApplications}: {tournament.pendingApplicationsCount}</span>
        <span className="pill">{copy.organizer.participantPool}: {tournament.bracketParticipantsCount}/{tournament.bracketSize ?? "-"}</span>
        <span className={tournament.bracketGenerated ? "pill pill-bye" : "pill"}>{tournament.bracketGenerated ? copy.common.bracketReady : copy.common.noBracket}</span>
      </div>
    </DashboardListItem>
  );
}

function nextOrganizerAction(tournament: Tournament | TournamentDetail, copy: ReturnType<typeof dashboardCopy>) {
  if (tournament.pendingApplicationsCount > 0 && !tournament.bracketGenerated) {
    return copy.organizer.moderate;
  }

  if (!tournament.bracketGenerated && tournament.bracketParticipantsCount >= 2) {
    return copy.organizer.generateBracket;
  }

  if ("matches" in tournament && tournament.matches.some((match) => match.status === "ready" || match.status === "live")) {
    return copy.organizer.needsResult;
  }

  return null;
}

function formatTournamentMeta(
  tournament: Tournament | TournamentDetail,
  locale: "ru" | "uz" | "en",
  statusLabel: (status: string) => string
) {
  const date = new Date(tournament.startsAt).toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${date} / ${statusLabel(tournament.status)}`;
}
