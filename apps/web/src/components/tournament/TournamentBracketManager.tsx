"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import {
  useAddBracketParticipantsMutation,
  useBracketParticipantsQuery,
  useDisqualifyParticipantMutation,
  useClubsQuery,
  useDisciplinesQuery,
  useGenerateBracketMutation,
  useModerateApplicationMutation,
  usePlayersQuery,
  useRemoveBracketParticipantMutation,
  useTournamentApplicationsQuery,
  useTournamentQuery,
  useUpdateBracketMatchResultMutation,
  useRollbackBracketMatchMutation,
  useUpdateBracketMatchStatusMutation,
  useUpdateTournamentAdminMutation
} from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { isSupportedTournamentDisciplineName } from "@/lib/activeTournamentDisciplines";
import type {
  ApplicationEntry,
  BracketPoolParticipant,
  TournamentDetail,
  TournamentMatch
} from "@/lib/types";
import { getUserFacingApiError } from "@/lib/api/errors";
import { FormInput, FormSelect, FormTextarea, GlowButton, MetricTile, NoticePanel, SurfaceCard } from "../ui";
import { TournamentBracket } from "./TournamentBracket";
import { DisputesPanel } from "./DisputesPanel";

type TournamentStatusValue = "DRAFT" | "REGISTRATION" | "LIVE" | "FINISHED";
type TournamentFormatValue = "SINGLE_ELIMINATION";

interface TournamentManagementForm {
  id: string;
  title: string;
  descriptionRu: string;
  descriptionUz: string;
  descriptionEn: string;
  registrationLabelRu: string;
  registrationLabelUz: string;
  registrationLabelEn: string;
  clubId: string;
  disciplineId: string;
  startsAt: string;
  prizePool: string;
  participants: string;
  status: TournamentStatusValue;
  bracketSize: "8" | "16" | "32" | "64";
  bracketFormat: TournamentFormatValue;
  regulationFormatRu: string;
  regulationFormatUz: string;
  regulationFormatEn: string;
  regulationEntryFeeRu: string;
  regulationEntryFeeUz: string;
  regulationEntryFeeEn: string;
  participationTermsRu: string;
  participationTermsUz: string;
  participationTermsEn: string;
  restrictionsRu: string;
  restrictionsUz: string;
  restrictionsEn: string;
  notesRu: string;
  notesUz: string;
  notesEn: string;
}

export function TournamentBracketManager({
  tournamentId,
  backHref
}: {
  tournamentId: string;
  backHref: string;
}) {
  const { locale, t, text, formatCurrency, formatDate } = useI18n();
  const tournamentQuery = useTournamentQuery(tournamentId);
  const playersQuery = usePlayersQuery();
  const clubsQuery = useClubsQuery();
  const disciplinesQuery = useDisciplinesQuery();
  const poolParticipantsQuery = useBracketParticipantsQuery(tournamentId);
  const applicationsQuery = useTournamentApplicationsQuery(tournamentId);
  const addParticipantsMutation = useAddBracketParticipantsMutation(tournamentId);
  const removeParticipantMutation = useRemoveBracketParticipantMutation(tournamentId);
  const disqualifyParticipantMutation = useDisqualifyParticipantMutation(tournamentId);
  const generateBracketMutation = useGenerateBracketMutation(tournamentId);
  const updateMatchResultMutation = useUpdateBracketMatchResultMutation(tournamentId);
  const rollbackMatchMutation = useRollbackBracketMatchMutation(tournamentId);
  const updateMatchStatusMutation = useUpdateBracketMatchStatusMutation(tournamentId);
  const updateTournamentMutation = useUpdateTournamentAdminMutation();
  const moderateApplicationMutation = useModerateApplicationMutation();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedSeed, setSelectedSeed] = useState("");
  const [form, setForm] = useState<TournamentManagementForm | null>(null);
  const [matchForms, setMatchForms] = useState<Record<string, { winnerId: string; player1Score: string; player2Score: string }>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const tournament = tournamentQuery.data;
    if (!tournament) {
      return;
    }

    setForm((current) => (current && current.id === tournament.id ? current : buildManagementForm(tournament, text)));
  }, [text, tournamentQuery.data]);

  if (
    tournamentQuery.isPending ||
    playersQuery.isPending ||
    clubsQuery.isPending ||
    disciplinesQuery.isPending ||
    poolParticipantsQuery.isPending ||
    applicationsQuery.isPending
  ) {
    return <LoadingState />;
  }

  if (
    tournamentQuery.isError ||
    playersQuery.isError ||
    clubsQuery.isError ||
    disciplinesQuery.isError ||
    poolParticipantsQuery.isError ||
    applicationsQuery.isError
  ) {
    return (
      <ErrorState
        onRetry={() => {
          void tournamentQuery.refetch();
          void playersQuery.refetch();
          void clubsQuery.refetch();
          void disciplinesQuery.refetch();
          void poolParticipantsQuery.refetch();
          void applicationsQuery.refetch();
        }}
      />
    );
  }

  const tournament = tournamentQuery.data;
  if (!tournament || !form) {
    return <EmptyState message={t("system.notFoundText")} />;
  }

  const clubs = clubsQuery.data ?? [];
  const allDisciplines = disciplinesQuery.data ?? [];
  const activeDisciplines = allDisciplines.filter((discipline) => isSupportedTournamentDisciplineName(discipline.name));
  const disciplines = activeDisciplines.length > 0 ? activeDisciplines : allDisciplines;
  const allPlayers = playersQuery.data ?? [];
  const poolParticipants = poolParticipantsQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const champion = tournament.results.find((entry) => entry.placement === 1) ?? null;
  const poolLocked = tournament.rounds.length > 0;
  const currentPoolPlayerIds = new Set(poolParticipants.map((participant) => participant.playerId).filter((value): value is string => Boolean(value)));
  const availablePlayers = allPlayers.filter((player) => !currentPoolPlayerIds.has(player.id));
  const pendingApplications = applications.filter((application) => application.status === "PENDING");
  const approvedApplications = applications.filter((application) => application.status === "APPROVED");
  const approvedApplicationsOutsidePool = approvedApplications.filter((application) => !currentPoolPlayerIds.has(application.player.id));
  const remainingPoolSlots = Math.max((tournament.bracketSize ?? 0) - poolParticipants.length, 0);
  const formDisabled = updateTournamentMutation.isPending || tournament.status === "finished";
  const structureLocked = formDisabled || poolLocked;

  async function handleSaveTournament() {
    if (!form) {
      return;
    }

    try {
      await updateTournamentMutation.mutateAsync({
        id: tournamentId,
        input: buildManagementPayload(form)
      });
      setFeedback(t("tournamentCenter.management.tournamentSaved"));
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleAddParticipant(participants: Array<{ playerId: string; seed?: number }>) {
    try {
      await addParticipantsMutation.mutateAsync(participants);
      setSelectedPlayerId("");
      setSelectedSeed("");
      setFeedback(
        participants.length > 1
          ? t("tournamentCenter.management.approvedParticipantsAdded")
          : t("tournamentCenter.management.participantAdded")
      );
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleAddSelectedParticipant() {
    if (!selectedPlayerId) {
      setFeedback(t("tournamentCenter.management.selectPlayer"));
      return;
    }

    await handleAddParticipant([
      {
        playerId: selectedPlayerId,
        seed: selectedSeed.trim() ? Number(selectedSeed) : undefined
      }
    ]);
  }

  async function handleAddApprovedParticipants() {
    if (approvedApplicationsOutsidePool.length === 0) {
      setFeedback(t("tournamentCenter.management.noApprovedParticipantsToAdd"));
      return;
    }

    if (remainingPoolSlots === 0) {
      setFeedback(t("tournamentCenter.management.errors.poolFull"));
      return;
    }

    await handleAddParticipant(
      approvedApplicationsOutsidePool.slice(0, remainingPoolSlots).map((application) => ({
        playerId: application.player.id
      }))
    );
  }

  async function handleRemoveParticipant(participant: BracketPoolParticipant) {
    if (!window.confirm(`${t("tournamentCenter.management.removeParticipantConfirm")} ${participant.fullName}?`)) {
      return;
    }

    try {
      await removeParticipantMutation.mutateAsync(participant.id);
      setFeedback(t("tournamentCenter.management.participantRemoved"));
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  const disqualifyText = locale === "ru" ? "Дисквалифицировать" : locale === "uz" ? "Diskvalifikatsiya" : "Disqualify";

  async function handleDisqualifyParticipant(participant: BracketPoolParticipant) {
    const confirmText =
      locale === "ru"
        ? "Дисквалифицировать участника"
        : locale === "uz"
          ? "Ishtirokchini diskvalifikatsiya qilish"
          : "Disqualify participant";
    if (!window.confirm(`${confirmText}: ${participant.fullName}?`)) {
      return;
    }

    try {
      await disqualifyParticipantMutation.mutateAsync(participant.id);
      setFeedback(
        locale === "ru"
          ? "Участник дисквалифицирован."
          : locale === "uz"
            ? "Ishtirokchi diskvalifikatsiya qilindi."
            : "Participant disqualified."
      );
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleModerateApplication(application: ApplicationEntry, status: "APPROVED" | "REJECTED") {
    try {
      await moderateApplicationMutation.mutateAsync({ id: application.id, status });
      setFeedback(
        status === "APPROVED"
          ? t("tournamentCenter.management.applicationApproved")
          : t("tournamentCenter.management.applicationRejected")
      );
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleGenerateBracket() {
    try {
      await generateBracketMutation.mutateAsync();
      setFeedback(t("tournamentCenter.management.bracketGenerated"));
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleSetMatchStatus(matchId: string, status: "PENDING" | "READY" | "LIVE") {
    try {
      await updateMatchStatusMutation.mutateAsync({ matchId, status });
      setFeedback(t("tournamentCenter.management.statusSaved"));
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleSubmitResult(match: TournamentMatch) {
    const formState = matchForms[match.id];
    if (!formState || !formState.winnerId) {
      setFeedback(t("tournamentCenter.management.selectWinner"));
      return;
    }

    const player1Score = parseOptionalMatchScore(formState.player1Score);
    const player2Score = parseOptionalMatchScore(formState.player2Score);
    const hasPlayer1Score = typeof player1Score === "number";
    const hasPlayer2Score = typeof player2Score === "number";

    if (hasPlayer1Score !== hasPlayer2Score) {
      setFeedback(t("tournamentCenter.management.errors.scoresRequired"));
      return;
    }

    try {
      await updateMatchResultMutation.mutateAsync({
        matchId: match.id,
        input: {
          winnerId: formState.winnerId,
          player1Score,
          player2Score
        }
      });
      setMatchForms((current) => ({
        ...current,
        [match.id]: { winnerId: "", player1Score: "", player2Score: "" }
      }));
      setFeedback(t("tournamentCenter.management.resultSaved"));
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  async function handleRollbackMatch(match: TournamentMatch) {
    const confirmed = typeof window === "undefined" || window.confirm(t("tournamentCenter.management.rollbackConfirm"));
    if (!confirmed) {
      return;
    }
    try {
      await rollbackMatchMutation.mutateAsync(match.id);
      setMatchForms((current) => ({
        ...current,
        [match.id]: { winnerId: "", player1Score: "", player2Score: "" }
      }));
      setFeedback(t("tournamentCenter.management.rollbackDone"));
    } catch (error) {
      setFeedback(toErrorMessage(error, locale, t, t("system.errorText")));
    }
  }

  function handleSelectMatch(matchId: string) {
    setSelectedMatchId(matchId);
    const target = document.getElementById(`match-management-${matchId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{t("tournamentCenter.management.title")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{text(tournament.title)}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">{t("tournamentCenter.management.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={backHref} className="button-secondary">
            {t("tournamentCenter.management.back")}
          </Link>
          <Link href={`/tournaments/${tournament.id}`} className="button-secondary">
            {t("tournamentCenter.management.openPublicPage")}
          </Link>
        </div>
      </div>

      {feedback ? <NoticePanel>{feedback}</NoticePanel> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label={t("tournamentCenter.management.poolMetric")} value={String(poolParticipants.length)} />
        <MetricCard label={t("tournamentCenter.management.approvedApplications")} value={String(approvedApplications.length)} />
        <MetricCard label={t("tournamentCenter.management.pendingApplications")} value={String(pendingApplications.length)} />
        <MetricCard label={t("tournamentCenter.management.prizePool")} value={formatCurrency(tournament.prizePool)} />
      </div>

      {champion ? (
        <SurfaceCard className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{t("tournamentCenter.management.champion")}</p>
          <p className="text-xl font-semibold text-white">{champion.player.fullName}</p>
          <p className="text-sm text-muted">{champion.player.clubName ?? "-"}</p>
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("tournamentCenter.management.tournamentSettings")}</h2>
            <p className="mt-1 text-sm text-muted">{t("tournamentCenter.management.tournamentSettingsHint")}</p>
          </div>
          <GlowButton onClick={() => void handleSaveTournament()} disabled={formDisabled}>
            {updateTournamentMutation.isPending ? t("commonUi.loading") : t("admin.actions.save")}
          </GlowButton>
        </div>

        <NoticePanel tone="empty">
          {poolLocked
            ? t("tournamentCenter.management.structureLockedHint")
            : t("tournamentCenter.management.publicSyncHint")}
        </NoticePanel>

        <div className="grid gap-3 xl:grid-cols-2">
          <FormInput
            value={form.title}
            placeholder={t("admin.tournaments.titlePlaceholder")}
            onChange={(event) => setForm((current) => current ? { ...current, title: event.target.value } : current)}
            disabled={formDisabled}
          />
          <FormInput
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm((current) => current ? { ...current, startsAt: event.target.value } : current)}
            disabled={formDisabled}
          />
          <FormSelect
            value={form.clubId}
            onChange={(event) => setForm((current) => current ? { ...current, clubId: event.target.value } : current)}
            disabled={formDisabled}
          >
            <option value="">{t("admin.common.selectClub")}</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {text(club.name)}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            value={form.disciplineId}
            onChange={(event) => setForm((current) => current ? { ...current, disciplineId: event.target.value } : current)}
            disabled={formDisabled}
          >
            <option value="">{t("admin.common.selectDiscipline")}</option>
            {disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.name}
              </option>
            ))}
          </FormSelect>
          <FormInput
            type="number"
            min={0}
            value={form.prizePool}
            placeholder={t("admin.tournaments.prizePoolPlaceholder")}
            onChange={(event) => setForm((current) => current ? { ...current, prizePool: event.target.value } : current)}
            disabled={formDisabled}
          />
          <FormSelect
            value={form.bracketSize}
            onChange={(event) => setForm((current) => current ? { ...current, bracketSize: event.target.value as TournamentManagementForm["bracketSize"] } : current)}
            disabled={structureLocked}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </FormSelect>
          <FormSelect
            value={form.bracketFormat}
            onChange={(event) => setForm((current) => current ? { ...current, bracketFormat: event.target.value as TournamentFormatValue } : current)}
            disabled={structureLocked}
          >
            <option value="SINGLE_ELIMINATION">{t("tournamentCenter.formats.singleElimination")}</option>
          </FormSelect>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <label className="dashboard-tournament-form-field xl:col-span-2">
            <span className="dashboard-tournament-form-label">{t("tournamentCenter.management.publicDescriptionTitle")}</span>
            <FormTextarea
              value={form.descriptionRu}
              rows={4}
              className="min-h-[8rem]"
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        descriptionRu: event.target.value,
                        descriptionUz: "",
                        descriptionEn: ""
                      }
                    : current
                )
              }
              disabled={formDisabled}
            />
          </label>

          <label className="dashboard-tournament-form-field xl:col-span-2">
            <span className="dashboard-tournament-form-label">{t("tournamentCenter.management.regulationFormat")}</span>
            <FormTextarea
              value={form.regulationFormatRu}
              rows={6}
              className="min-h-[10rem]"
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        regulationFormatRu: event.target.value,
                        regulationFormatUz: "",
                        regulationFormatEn: "",
                        regulationEntryFeeRu: "",
                        regulationEntryFeeUz: "",
                        regulationEntryFeeEn: "",
                        participationTermsRu: "",
                        participationTermsUz: "",
                        participationTermsEn: "",
                        restrictionsRu: "",
                        restrictionsUz: "",
                        restrictionsEn: "",
                        notesRu: "",
                        notesUz: "",
                        notesEn: ""
                      }
                    : current
                )
              }
              disabled={formDisabled}
            />
          </label>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("tournamentCenter.management.applicationsTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("tournamentCenter.management.applicationsHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill">
              {t("tournamentCenter.management.pendingApplications")}: {pendingApplications.length}
            </span>
            <span className="pill">
              {t("tournamentCenter.management.approvedApplications")}: {approvedApplications.length}
            </span>
          </div>
        </div>

        {applications.length === 0 ? <EmptyState message={t("tournamentCenter.management.noApplications")} /> : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {applications.map((application) => {
            const inPool = currentPoolPlayerIds.has(application.player.id);
            const statusTone =
              application.status === "APPROVED" ? "finished" : application.status === "PENDING" ? "pending" : "ready";

            return (
              <div key={application.id} className="rounded-[1rem] border border-white/10 bg-[#12201b] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{application.player.fullName}</p>
                    <p className="mt-1 text-sm text-muted">
                      {application.player.club?.name ? text(application.player.club.name) : "-"} / {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <span className={`bracket-status bracket-status-${statusTone}`}>
                    {t(`admin.applications.${application.status.toLowerCase()}`)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {application.status === "PENDING" ? (
                    <>
                      <GlowButton
                        variant="secondary"
                        onClick={() => void handleModerateApplication(application, "APPROVED")}
                        disabled={moderateApplicationMutation.isPending}
                      >
                        {t("admin.actions.approve")}
                      </GlowButton>
                      <GlowButton
                        variant="secondary"
                        onClick={() => void handleModerateApplication(application, "REJECTED")}
                        disabled={moderateApplicationMutation.isPending}
                      >
                        {t("admin.actions.reject")}
                      </GlowButton>
                    </>
                  ) : null}

                  {application.status === "APPROVED" ? (
                    <GlowButton
                      variant="secondary"
                      onClick={() => void handleAddParticipant([{ playerId: application.player.id }])}
                      disabled={poolLocked || addParticipantsMutation.isPending || inPool}
                    >
                      {inPool ? t("tournamentCenter.management.alreadyInPool") : t("tournamentCenter.management.addApprovedToPool")}
                    </GlowButton>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("tournamentCenter.management.poolTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("tournamentCenter.management.poolHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GlowButton
              variant="secondary"
              onClick={() => void handleAddApprovedParticipants()}
              disabled={poolLocked || addParticipantsMutation.isPending || approvedApplicationsOutsidePool.length === 0 || remainingPoolSlots === 0}
            >
              {t("tournamentCenter.management.addApprovedBatch")}
            </GlowButton>
            <GlowButton
              onClick={() => void handleAddSelectedParticipant()}
              disabled={poolLocked || addParticipantsMutation.isPending || !selectedPlayerId || availablePlayers.length === 0}
            >
              {t("tournamentCenter.management.addParticipant")}
            </GlowButton>
          </div>
        </div>

        {poolLocked ? <NoticePanel tone="empty">{t("tournamentCenter.management.alreadyGenerated")}</NoticePanel> : null}
        {!poolLocked && availablePlayers.length === 0 ? (
          <NoticePanel tone="empty">{t("tournamentCenter.management.noAvailablePlayers")}</NoticePanel>
        ) : null}

        <div className="grid gap-3 md:grid-cols-[1fr_140px]">
          <FormSelect value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)} disabled={poolLocked}>
            <option value="">{t("tournamentCenter.management.playerPlaceholder")}</option>
            {availablePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.fullName}
              </option>
            ))}
          </FormSelect>
          <FormInput
            type="number"
            min={1}
            max={tournament.bracketSize ?? 64}
            value={selectedSeed}
            placeholder={t("tournamentCenter.management.seedPlaceholder")}
            onChange={(event) => setSelectedSeed(event.target.value)}
            disabled={poolLocked}
          />
        </div>

        <PoolParticipantsTable
          participants={poolParticipants}
          canRemove={!poolLocked}
          isRemoving={removeParticipantMutation.isPending}
          onRemove={(participant) => void handleRemoveParticipant(participant)}
          canDisqualify={poolLocked}
          isDisqualifying={disqualifyParticipantMutation.isPending}
          onDisqualify={(participant) => void handleDisqualifyParticipant(participant)}
          disqualifyLabel={disqualifyText}
          t={t}
        />
      </SurfaceCard>

      <DisputesPanel tournamentId={tournamentId} />

      <SurfaceCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("tournamentCenter.management.bracketActions")}</h2>
            <p className="mt-1 text-sm text-muted">
              {poolParticipants.length < 2
                ? t("tournamentCenter.management.minimumParticipants")
                : poolLocked
                  ? t("tournamentCenter.management.alreadyGenerated")
                  : t("tournamentCenter.management.generateHint")}
            </p>
          </div>
          <GlowButton
            onClick={() => void handleGenerateBracket()}
            disabled={generateBracketMutation.isPending || poolLocked || poolParticipants.length < 2}
          >
            {t("tournamentCenter.management.generate")}
          </GlowButton>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-white">{t("tournamentCenter.bracket.title")}</h2>
          <span className="text-xs text-muted">{resultActionHint(locale)}</span>
        </div>
        <TournamentBracket rounds={tournament.rounds} onMatchSelect={handleSelectMatch} selectedMatchId={selectedMatchId} />
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{t("tournamentCenter.management.matchesTitle")}</h2>
        {tournament.matches.length === 0 ? <EmptyState message={t("tournamentCenter.management.noMatches")} /> : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {tournament.matches.map((match) => {
            const formState = matchForms[match.id] ?? { winnerId: "", player1Score: "", player2Score: "" };
            const hasPlayableMatch = Boolean(match.playerA && match.playerB && !match.isBye && match.status !== "finished");
            const hasPartialScores = Boolean(formState.player1Score.trim()) !== Boolean(formState.player2Score.trim());
            const canSubmitResult = Boolean(formState.winnerId) && !hasPartialScores && !updateMatchResultMutation.isPending;

            return (
              <div
                key={match.id}
                id={`match-management-${match.id}`}
                className={`match-card match-card-${match.status} match-management-card${match.isBye ? " match-card-bye match-management-card-bye" : ""}${selectedMatchId === match.id ? " match-management-card-active" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {t("tournamentCenter.bracket.match")} {match.matchNumber}
                    </p>
                    <p className="mt-1 text-white">{formatMatchPairing(match, t)}</p>
                  </div>
                  <span className={`bracket-status bracket-status-${match.status}`}>
                    {t(`tournamentCenter.bracket.${match.status}`)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-4">
                  <p>
                    {t("tournamentCenter.bracket.table")}: {match.tableNumber ?? "-"}
                  </p>
                  <p>{formatDate(match.scheduledAt)}</p>
                  <p>
                    {t("tournamentCenter.bracket.bestOf")} {match.bestOf}
                  </p>
                  <p>{t(`tournamentCenter.bracket.${match.phase}`)}</p>
                </div>

                {match.status !== "finished" && !match.isBye ? (
                  <div className="match-status-actions">
                    <GlowButton
                      variant="secondary"
                      className="button-status button-status-pending"
                      onClick={() => void handleSetMatchStatus(match.id, "PENDING")}
                      disabled={updateMatchStatusMutation.isPending || match.status === "pending"}
                    >
                      {t("tournamentCenter.bracket.pending")}
                    </GlowButton>
                    <GlowButton
                      variant="secondary"
                      className="button-status button-status-ready"
                      onClick={() => void handleSetMatchStatus(match.id, "READY")}
                      disabled={updateMatchStatusMutation.isPending || match.status === "ready" || !match.playerA || !match.playerB}
                    >
                      {t("tournamentCenter.bracket.ready")}
                    </GlowButton>
                    <GlowButton
                      variant="secondary"
                      className="button-status button-status-live"
                      onClick={() => void handleSetMatchStatus(match.id, "LIVE")}
                      disabled={updateMatchStatusMutation.isPending || match.status === "live" || !match.playerA || !match.playerB}
                    >
                      {t("tournamentCenter.bracket.live")}
                    </GlowButton>
                  </div>
                ) : null}

                {match.isBye ? (
                  <div className="mt-4">
                    <NoticePanel tone="empty" className="pill-bye">
                      {t("tournamentCenter.bracket.byeWin")}
                    </NoticePanel>
                  </div>
                ) : null}

                {match.status === "finished" && !match.isBye && tournament.status !== "finished" ? (
                  <div className="match-status-actions mt-4">
                    <GlowButton
                      variant="secondary"
                      className="button-status button-status-pending"
                      onClick={() => void handleRollbackMatch(match)}
                      disabled={rollbackMatchMutation.isPending}
                    >
                      {t("tournamentCenter.management.rollback")}
                    </GlowButton>
                  </div>
                ) : null}

                {hasPlayableMatch ? (
                  <div className="mt-4 grid gap-3">
                    <FormSelect
                      value={formState.winnerId}
                      placeholder={t("tournamentCenter.management.winner")}
                      onChange={(event) =>
                        setMatchForms((current) => ({
                          ...current,
                          [match.id]: { ...formState, winnerId: event.target.value }
                        }))
                      }
                    >
                      <option value="">{t("tournamentCenter.management.winner")}</option>
                      <option value={match.playerA!.id}>{match.playerA!.fullName}</option>
                      <option value={match.playerB!.id}>{match.playerB!.fullName}</option>
                    </FormSelect>
                    <div className="grid gap-3 md:grid-cols-2">
                      <FormInput
                        type="number"
                        min={0}
                        value={formState.player1Score}
                        placeholder={t("tournamentCenter.management.player1Score")}
                        onChange={(event) =>
                          setMatchForms((current) => ({
                            ...current,
                            [match.id]: { ...formState, player1Score: event.target.value }
                          }))
                        }
                      />
                      <FormInput
                        type="number"
                        min={0}
                        value={formState.player2Score}
                        placeholder={t("tournamentCenter.management.player2Score")}
                        onChange={(event) =>
                          setMatchForms((current) => ({
                            ...current,
                            [match.id]: { ...formState, player2Score: event.target.value }
                          }))
                        }
                      />
                    </div>
                    <GlowButton disabled={!canSubmitResult} onClick={() => void handleSubmitResult(match)}>
                      {t("tournamentCenter.management.submitResult")}
                    </GlowButton>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </SurfaceCard>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <MetricTile label={label} value={value} valueClassName="metric-value-hero" />;
}

function PoolParticipantsTable({
  participants,
  canRemove,
  isRemoving,
  onRemove,
  canDisqualify,
  isDisqualifying,
  onDisqualify,
  disqualifyLabel,
  t
}: {
  participants: BracketPoolParticipant[];
  canRemove: boolean;
  isRemoving: boolean;
  onRemove: (participant: BracketPoolParticipant) => void;
  canDisqualify: boolean;
  isDisqualifying: boolean;
  onDisqualify: (participant: BracketPoolParticipant) => void;
  disqualifyLabel: string;
  t: (path: string) => string;
}) {
  if (participants.length === 0) {
    return <EmptyState message={t("tournamentCenter.participants.empty")} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        {participants.map((participant) => (
          <div key={participant.id} className="surface-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="pill">
                {t("tournamentCenter.participants.seed")} #{participant.seed}
              </span>
              <span className="text-sm text-accent">{participant.rating}</span>
            </div>
            <div>
              <p className="text-base font-semibold text-white">{participant.fullName}</p>
              <p className="mt-1 text-sm text-muted">{participant.clubName ?? "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted">
              <p>{participant.cityName ?? "-"}</p>
              <p>
                {t("common.stats.wins")}/{t("common.stats.losses")}: {participant.wins}/{participant.losses}
              </p>
            </div>
            {canRemove ? (
              <GlowButton variant="secondary" onClick={() => onRemove(participant)} disabled={isRemoving}>
                {t("tournamentCenter.management.removeParticipant")}
              </GlowButton>
            ) : null}
            {canDisqualify ? (
              <GlowButton variant="secondary" onClick={() => onDisqualify(participant)} disabled={isDisqualifying}>
                {disqualifyLabel}
              </GlowButton>
            ) : null}
          </div>
        ))}
      </div>

      <div className="table-panel hidden overflow-x-auto md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("tournamentCenter.participants.seed")}</th>
              <th>{t("tournamentCenter.participants.player")}</th>
              <th>{t("tournamentCenter.participants.club")}</th>
              <th>{t("tournamentCenter.participants.city")}</th>
              <th>{t("tournamentCenter.participants.rating")}</th>
              <th>{t("tournamentCenter.management.record")}</th>
              {canRemove || canDisqualify ? <th>{t("tournamentCenter.management.actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.seed}</td>
                <td>
                  {participant.playerId ? (
                    <Link href={`/players/${participant.playerId}`} className="font-medium text-white transition hover:text-accent">
                      {participant.fullName}
                    </Link>
                  ) : (
                    <span className="font-medium text-white">{participant.fullName}</span>
                  )}
                </td>
                <td>{participant.clubName ?? "-"}</td>
                <td>{participant.cityName ?? "-"}</td>
                <td className="text-accent">{participant.rating}</td>
                <td>
                  {participant.wins}/{participant.losses}
                </td>
                {canRemove || canDisqualify ? (
                  <td>
                    <div className="flex gap-2">
                      {canRemove ? (
                        <GlowButton variant="secondary" onClick={() => onRemove(participant)} disabled={isRemoving}>
                          {t("tournamentCenter.management.removeParticipant")}
                        </GlowButton>
                      ) : null}
                      {canDisqualify ? (
                        <GlowButton variant="secondary" onClick={() => onDisqualify(participant)} disabled={isDisqualifying}>
                          {disqualifyLabel}
                        </GlowButton>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildManagementForm(tournament: TournamentDetail, text: (value: TournamentDetail["title"] | string | null | undefined) => string): TournamentManagementForm {
  return {
    id: tournament.id,
    title: text(tournament.title),
    descriptionRu: resolvePrimaryLocalizedValue(tournament.description),
    descriptionUz: "",
    descriptionEn: "",
    registrationLabelRu: tournament.registrationLabel?.ru ?? "",
    registrationLabelUz: tournament.registrationLabel?.uz ?? "",
    registrationLabelEn: tournament.registrationLabel?.en ?? "",
    clubId: tournament.clubId,
    disciplineId: tournament.disciplineId ?? "",
    startsAt: toDateTimeLocalValue(tournament.startsAt),
    prizePool: String(tournament.prizePool),
    participants: String(tournament.participants),
    status:
      tournament.status === "live"
        ? "LIVE"
        : tournament.status === "finished"
          ? "FINISHED"
          : tournament.status === "draft"
            ? "DRAFT"
            : "REGISTRATION",
    bracketSize: String(tournament.bracketSize ?? 16) as TournamentManagementForm["bracketSize"],
    bracketFormat: "SINGLE_ELIMINATION",
    regulationFormatRu: resolveRegulationText(tournament),
    regulationFormatUz: "",
    regulationFormatEn: "",
    regulationEntryFeeRu: "",
    regulationEntryFeeUz: "",
    regulationEntryFeeEn: "",
    participationTermsRu: "",
    participationTermsUz: "",
    participationTermsEn: "",
    restrictionsRu: "",
    restrictionsUz: "",
    restrictionsEn: "",
    notesRu: "",
    notesUz: "",
    notesEn: ""
  };
}

function buildManagementPayload(form: TournamentManagementForm) {
  return {
    title: form.title.trim(),
    description: buildOptionalLocalizedValue(form.descriptionRu, "", ""),
    clubId: form.clubId,
    disciplineId: form.disciplineId,
    startsAt: new Date(form.startsAt).toISOString(),
    prizePool: Number(form.prizePool),
    bracketSize: Number(form.bracketSize),
    bracketFormat: form.bracketFormat,
    regulation: {
      format: buildLocalizedValue(form.regulationFormatRu, "", ""),
      entryFee: buildLocalizedValue("", "", ""),
      participationTerms: [],
      restrictions: [],
      notes: []
    }
  };
}

function resolvePrimaryLocalizedValue(value: { ru: string; uz: string; en: string } | null | undefined) {
  const candidates = [value?.ru, value?.en, value?.uz];
  for (const candidate of candidates) {
    const normalized = candidate?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function resolveRegulationText(tournament: TournamentDetail) {
  const candidates = [
    resolvePrimaryLocalizedValue(tournament.regulation.format),
    resolvePrimaryLocalizedValue(tournament.regulation.entryFee),
    ...tournament.regulation.participationTerms.map((item) => resolvePrimaryLocalizedValue(item)),
    ...tournament.regulation.restrictions.map((item) => resolvePrimaryLocalizedValue(item)),
    ...tournament.regulation.notes.map((item) => resolvePrimaryLocalizedValue(item))
  ];

  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (normalized && normalized !== "-") {
      return normalized;
    }
  }

  return "";
}

function buildLocalizedValue(ru: string, uz: string, en: string) {
  const fallback = ru.trim() || uz.trim() || en.trim() || "-";
  return {
    ru: ru.trim() || fallback,
    uz: uz.trim() || fallback,
    en: en.trim() || fallback
  };
}

function buildOptionalLocalizedValue(ru: string, uz: string, en: string) {
  if (!ru.trim() && !uz.trim() && !en.trim()) {
    return null;
  }

  return buildLocalizedValue(ru, uz, en);
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function parseOptionalMatchScore(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return Number(trimmed);
}

function formatMatchPairing(match: TournamentMatch, t: (path: string) => string) {
  const fallback = match.isBye ? t("tournamentCenter.bracket.bye") : t("tournamentCenter.placeholders.tbd");
  return `${match.playerA?.fullName ?? fallback} / ${match.playerB?.fullName ?? fallback}`;
}

function resultActionHint(locale: "ru" | "uz" | "en") {
  if (locale === "ru") {
    return "\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0430 \u043c\u0430\u0442\u0447, \u0447\u0442\u043e\u0431\u044b \u0432\u043d\u0435\u0441\u0442\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442";
  }

  if (locale === "uz") {
    return "Natijani kiritish uchun matchni tanlang";
  }

  return "Select a match to enter result";
}

function toErrorMessage(
  error: unknown,
  locale: "ru" | "uz" | "en",
  t: (path: string) => string,
  fallback: string
) {
  return getUserFacingApiError(error, {
    locale,
    t,
    fallbackKey: fallback === t("system.errorText") ? "system.errorText" : undefined,
    payloadMessageKeys: BRACKET_ERROR_KEYS,
    debugLabel: "tournament-bracket-management"
  });
}

const BRACKET_ERROR_KEYS: Record<string, string> = {
  "Bracket already generated for this tournament.": "tournamentCenter.management.alreadyGenerated",
  "Applications cannot be moderated after bracket generation.": "tournamentCenter.management.errors.applicationModerationLocked",
  "Tournament participant pool is already full.": "tournamentCenter.management.errors.poolFull",
  "At least two participants are required to generate a bracket.": "tournamentCenter.management.errors.minimumParticipants",
  "Manual result entry is not allowed for BYE matches.": "tournamentCenter.management.errors.byeResultLocked",
  "Winner must be one of the match participants.": "tournamentCenter.management.errors.invalidWinner",
  "Both player scores must be provided together.": "tournamentCenter.management.errors.scoresRequired",
  "Scores cannot be tied.": "tournamentCenter.management.errors.tieNotAllowed",
  "Match scores cannot be equal.": "tournamentCenter.management.errors.tieNotAllowed",
  "Winner must correspond to the higher score.": "tournamentCenter.management.errors.winnerScoreMismatch",
  "Winner does not match the provided scores.": "tournamentCenter.management.errors.winnerScoreMismatch",
  "Seed must be unique within the tournament.": "tournamentCenter.management.errors.duplicateSeed",
  "Seed must be between 1 and bracket size.": "tournamentCenter.management.errors.seedOutOfRange",
  "Cannot remove participants after bracket generation.": "tournamentCenter.management.errors.removeLocked",
  "Bracket size cannot be changed after bracket generation.": "tournamentCenter.management.errors.structureLocked",
  "Bracket format cannot be changed after bracket generation.": "tournamentCenter.management.errors.structureLocked",
  "Bracket system cannot be changed after bracket generation.": "tournamentCenter.management.errors.structureLocked",
  "Bracket size cannot be smaller than the current tournament pool.": "tournamentCenter.management.errors.bracketTooSmall",
  "Only single elimination bracket is currently available.": "tournamentCenter.management.errors.structureLocked",
  "Finished tournament cannot be modified.": "tournamentCenter.management.errors.finishedLocked"
};
