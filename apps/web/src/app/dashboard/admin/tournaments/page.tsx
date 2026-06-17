"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import {
  useClubsQuery,
  useCreateTournamentAdminMutation,
  useDeleteTournamentAdminMutation,
  useDisciplinesQuery,
  useTournamentsQuery,
  useUpdateTournamentAdminMutation
} from "@/lib/api/hooks";
import { getUserFacingApiError } from "@/lib/api/errors";
import { FormInput, FormSelect, GlowButton, NoticePanel, SurfaceCard } from "@/components/ui";
import type { Tournament } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { getTournamentDisciplineSelectOptions } from "@/lib/activeTournamentDisciplines";

type TournamentStatusValue = "DRAFT" | "REGISTRATION" | "LIVE" | "FINISHED";

export default function AdminTournamentsPage() {
  const { locale, t, text } = useI18n();
  const tournamentsQuery = useTournamentsQuery();
  const clubsQuery = useClubsQuery();
  const disciplinesQuery = useDisciplinesQuery();
  const createMutation = useCreateTournamentAdminMutation();
  const updateMutation = useUpdateTournamentAdminMutation();
  const deleteMutation = useDeleteTournamentAdminMutation();
  const [feedback, setFeedback] = useState<{ message: string; tone: "default" | "error" } | null>(null);
  const [form, setForm] = useState<{
    title: string;
    clubId: string;
    disciplineId: string;
    startsAt: string;
    prizePool: string;
    bracketSize: string;
    bracketFormat: "SINGLE_ELIMINATION";
    status: TournamentStatusValue;
  }>({
    title: "",
    clubId: "",
    disciplineId: "",
    startsAt: "",
    prizePool: "0",
    bracketSize: "8",
    bracketFormat: "SINGLE_ELIMINATION",
    status: "DRAFT"
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const validationErrors = getTournamentCreateErrors(form, locale);
    if (validationErrors.length > 0) {
      setFeedback({
        message: validationErrors.join(" "),
        tone: "error"
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: form.title,
        clubId: form.clubId,
        disciplineId: form.disciplineId,
        startsAt: new Date(form.startsAt).toISOString(),
        prizePool: Number(form.prizePool),
        bracketSize: Number(form.bracketSize),
        bracketFormat: form.bracketFormat as "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION",
        status: form.status as "DRAFT" | "REGISTRATION" | "LIVE" | "FINISHED"
      });
      setForm({
        title: "",
        clubId: "",
        disciplineId: "",
        startsAt: "",
        prizePool: "0",
        bracketSize: "8",
        bracketFormat: "SINGLE_ELIMINATION",
        status: "DRAFT"
      });
      setFeedback({ message: getTournamentSuccessMessage(locale, "created"), tone: "default" });
    } catch (error) {
      setFeedback({
        message: getUserFacingApiError(error, { locale, t, debugLabel: "admin-create-tournament" }),
        tone: "error"
      });
    }
  }

  if (tournamentsQuery.isPending || clubsQuery.isPending || disciplinesQuery.isPending) {
    return <LoadingState />;
  }

  if (tournamentsQuery.isError || clubsQuery.isError || disciplinesQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void tournamentsQuery.refetch();
          void clubsQuery.refetch();
          void disciplinesQuery.refetch();
        }}
      />
    );
  }

  const tournaments = tournamentsQuery.data ?? [];
  const clubs = clubsQuery.data ?? [];
  const allDisciplines = disciplinesQuery.data ?? [];
  const disciplines = getTournamentDisciplineSelectOptions(allDisciplines, locale);

  return (
    <div className="space-y-5">
      <AdminPageHeader titleKey="admin.tournaments.title" subtitleKey="admin.tournaments.subtitle" />

      <SurfaceCard>
        {feedback ? <NoticePanel tone={feedback.tone === "error" ? "error" : "default"} className="mb-4">{feedback.message}</NoticePanel> : null}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
          <FormInput
            placeholder={t("admin.tournaments.titlePlaceholder")}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <FormInput
            placeholder={t("admin.tournaments.startsAtPlaceholder")}
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
          />
          <FormSelect value={form.clubId} onChange={(event) => setForm((current) => ({ ...current, clubId: event.target.value }))}>
            <option value="">{t("admin.common.selectClub")}</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {text(club.name)}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={form.disciplineId} onChange={(event) => setForm((current) => ({ ...current, disciplineId: event.target.value }))}>
            <option value="">{t("admin.common.selectDiscipline")}</option>
            {disciplines.map((discipline) => (
              <option key={discipline.key} value={discipline.id} disabled={discipline.disabled}>
                {discipline.label}
              </option>
            ))}
          </FormSelect>
          <FormInput
            placeholder={t("admin.tournaments.prizePoolPlaceholder")}
            type="number"
            value={form.prizePool}
            onChange={(event) => setForm((current) => ({ ...current, prizePool: event.target.value }))}
          />
          <FormSelect
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TournamentStatusValue }))}
          >
            <option value="DRAFT">{t("common.statuses.draft")}</option>
            <option value="REGISTRATION">{t("common.statuses.registration")}</option>
            <option value="LIVE">{t("common.statuses.live")}</option>
            <option value="FINISHED">{t("common.statuses.finished")}</option>
          </FormSelect>
          <FormSelect value={form.bracketSize} onChange={(event) => setForm((current) => ({ ...current, bracketSize: event.target.value }))}>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </FormSelect>
          <FormSelect
            value={form.bracketFormat}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                bracketFormat: event.target.value as "SINGLE_ELIMINATION"
              }))
            }
          >
            <option value="SINGLE_ELIMINATION">{t("tournamentCenter.formats.singleElimination")}</option>
          </FormSelect>
          <GlowButton className="md:col-span-2" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t("commonUi.loading") : t("admin.tournaments.createAction")}
          </GlowButton>
        </form>
      </SurfaceCard>

      {tournaments.length === 0 ? <EmptyState message={t("admin.tournaments.empty")} /> : null}
      {tournaments.map((tournament) => (
        <TournamentRow
          key={tournament.id}
          tournament={tournament}
          onSave={(input) => updateMutation.mutateAsync({ id: tournament.id, input })}
          onDelete={async () => {
            if (window.confirm(`${t("admin.tournaments.deleteConfirm")} ${text(tournament.title)}?`)) {
              await deleteMutation.mutateAsync(tournament.id);
            }
          }}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          locale={locale}
        />
      ))}
    </div>
  );
}

function getTournamentCreateErrors(
  form: {
    title: string;
    clubId: string;
    disciplineId: string;
    startsAt: string;
    prizePool: string;
    bracketSize: string;
  },
  locale: "ru" | "uz" | "en"
) {
  const errors: string[] = [];
  const prizePool = Number(form.prizePool);

  if (!form.title.trim()) {
    errors.push(createTournamentError(locale, "title"));
  }

  if (!form.clubId) {
    errors.push(createTournamentError(locale, "club"));
  }

  if (!form.disciplineId) {
    errors.push(createTournamentError(locale, "discipline"));
  }

  if (!form.startsAt || Number.isNaN(new Date(form.startsAt).getTime())) {
    errors.push(createTournamentError(locale, "startsAt"));
  }

  if (!Number.isFinite(prizePool) || prizePool < 0) {
    errors.push(createTournamentError(locale, "prizePool"));
  }

  if (!["8", "16", "32", "64"].includes(form.bracketSize)) {
    errors.push(createTournamentError(locale, "bracketSize"));
  }

  return errors;
}

function createTournamentError(
  locale: "ru" | "uz" | "en",
  key: "title" | "club" | "discipline" | "startsAt" | "prizePool" | "bracketSize"
) {
  const messages = {
    ru: {
      title: "Укажите название турнира.",
      club: "Выберите клуб.",
      discipline: "Выберите дисциплину.",
      startsAt: "Укажите дату и время старта.",
      prizePool: "Призовой фонд должен быть числом не меньше 0.",
      bracketSize: "Выберите размер сетки: 8, 16, 32 или 64."
    },
    uz: {
      title: "Turnir nomini kiriting.",
      club: "Klubni tanlang.",
      discipline: "Intizomni tanlang.",
      startsAt: "Boshlanish sanasi va vaqtini kiriting.",
      prizePool: "Mukofot jamg'armasi 0 dan kichik bo'lmagan son bo'lishi kerak.",
      bracketSize: "Setka hajmini tanlang: 8, 16, 32 yoki 64."
    },
    en: {
      title: "Enter the tournament title.",
      club: "Choose a club.",
      discipline: "Choose a discipline.",
      startsAt: "Enter the start date and time.",
      prizePool: "Prize pool must be a number greater than or equal to 0.",
      bracketSize: "Choose a bracket size: 8, 16, 32, or 64."
    }
  } as const;

  return messages[locale][key];
}

function TournamentRow({
  tournament,
  onSave,
  onDelete,
  isUpdating,
  isDeleting,
  locale
}: {
  tournament: Tournament;
  onSave: (input: { title: string; prizePool: number; participants: number; status: TournamentStatusValue; bracketSize: number }) => Promise<unknown>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  locale: "ru" | "uz" | "en";
}) {
  const { t, text } = useI18n();
  const [feedback, setFeedback] = useState<{ message: string; tone: "default" | "error" } | null>(null);
  const [title, setTitle] = useState(text(tournament.title));
  const [prizePool, setPrizePool] = useState(String(tournament.prizePool));
  const [participants, setParticipants] = useState(String(tournament.participants));
  const [status, setStatus] = useState<TournamentStatusValue>(tournament.status.toUpperCase() as TournamentStatusValue);
  const [bracketSize, setBracketSize] = useState(String(tournament.bracketSize ?? 8));

  return (
    <SurfaceCard className="space-y-3">
      {feedback ? <NoticePanel tone={feedback.tone === "error" ? "error" : "default"}>{feedback.message}</NoticePanel> : null}
      <div className="grid gap-3 md:grid-cols-5">
        <FormInput value={title} onChange={(event) => setTitle(event.target.value)} />
        <FormInput value={prizePool} type="number" onChange={(event) => setPrizePool(event.target.value)} />
        <FormInput
          placeholder={t("admin.tournaments.participantsPlaceholder")}
          value={participants}
          type="number"
          onChange={(event) => setParticipants(event.target.value)}
        />
        <FormSelect value={bracketSize} onChange={(event) => setBracketSize(event.target.value)}>
          <option value="8">8</option>
          <option value="16">16</option>
          <option value="32">32</option>
          <option value="64">64</option>
        </FormSelect>
        <FormSelect value={status} onChange={(event) => setStatus(event.target.value as TournamentStatusValue)}>
          <option value="DRAFT">{t("common.statuses.draft")}</option>
          <option value="REGISTRATION">{t("common.statuses.registration")}</option>
          <option value="LIVE">{t("common.statuses.live")}</option>
          <option value="FINISHED">{t("common.statuses.finished")}</option>
        </FormSelect>
      </div>
      <div className="flex flex-wrap gap-2">
        <GlowButton
          variant="secondary"
          onClick={() =>
            void (async () => {
              setFeedback(null);

              try {
                await onSave({
                  title,
                  prizePool: Number(prizePool),
                  participants: Number(participants),
                  status,
                  bracketSize: Number(bracketSize)
                });
                setFeedback({ message: getTournamentSuccessMessage(locale, "updated"), tone: "default" });
              } catch (error) {
                setFeedback({
                  message: getUserFacingApiError(error, { locale, t, debugLabel: "admin-update-tournament" }),
                  tone: "error"
                });
              }
            })()
          }
          disabled={isUpdating}
        >
          {isUpdating ? t("commonUi.loading") : t("admin.actions.save")}
        </GlowButton>
        <Link href={`/dashboard/admin/tournaments/${tournament.id}`} className="button-secondary">
          {t("tournamentCenter.management.manage")}
        </Link>
        <GlowButton
          variant="secondary"
          onClick={() =>
            void (async () => {
              setFeedback(null);

              try {
                await onDelete();
                setFeedback({ message: getTournamentSuccessMessage(locale, "deleted"), tone: "default" });
              } catch (error) {
                setFeedback({
                  message: getUserFacingApiError(error, { locale, t, debugLabel: "admin-delete-tournament" }),
                  tone: "error"
                });
              }
            })()
          }
          disabled={isDeleting}
        >
          {isDeleting ? t("commonUi.loading") : t("admin.actions.delete")}
        </GlowButton>
      </div>
    </SurfaceCard>
  );
}

function getTournamentSuccessMessage(locale: "ru" | "uz" | "en", key: "created" | "updated" | "deleted") {
  const messages = {
    ru: {
      created: "\u0422\u0443\u0440\u043d\u0438\u0440 \u0441\u043e\u0437\u0434\u0430\u043d.",
      updated: "\u0422\u0443\u0440\u043d\u0438\u0440 \u043e\u0431\u043d\u043e\u0432\u043b\u0451\u043d.",
      deleted: "\u0422\u0443\u0440\u043d\u0438\u0440 \u0443\u0434\u0430\u043b\u0451\u043d."
    },
    uz: {
      created: "Turnir yaratildi.",
      updated: "Turnir yangilandi.",
      deleted: "Turnir o'chirildi."
    },
    en: {
      created: "Tournament created.",
      updated: "Tournament updated.",
      deleted: "Tournament deleted."
    }
  } as const;

  return messages[locale][key];
}
