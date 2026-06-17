import type { Tournament } from "@/lib/types";

export type TournamentParticipantsProgress = {
  registered: number;
  capacity: number | null;
};

export function getTournamentParticipantsProgress(tournament: Tournament): TournamentParticipantsProgress {
  const participants = safeCount(tournament.participants);
  const applicationsCount = safeCount(tournament.applicationsCount);
  const pendingApplicationsCount = safeCount(tournament.pendingApplicationsCount);
  const approvedApplicationsCount =
    typeof tournament.approvedApplicationsCount === "number"
      ? safeCount(tournament.approvedApplicationsCount)
      : Math.max(0, applicationsCount - pendingApplicationsCount);
  const bracketParticipantsCount = safeCount(tournament.bracketParticipantsCount);

  const capacity =
    typeof tournament.bracketSize === "number" && tournament.bracketSize > 0
      ? tournament.bracketSize
      : participants > 0
        ? participants
        : null;

  const approved = Math.max(0, approvedApplicationsCount);
  const bracketPool = Math.max(0, bracketParticipantsCount);
  const fallback = Math.max(0, participants);

  const registered =
    tournament.bracketGenerated || tournament.status === "live" || tournament.status === "finished"
      ? Math.max(bracketPool, approved, fallback)
      : Math.max(approved, bracketPool);

  return { registered, capacity };
}

function safeCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
