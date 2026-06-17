"use client";

import { use } from "react";
import { SectionShell } from "@/components/ui";
import { TournamentBracketManager } from "@/components/tournament/TournamentBracketManager";

export default function OrganizerTournamentBracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <SectionShell>
      <TournamentBracketManager tournamentId={id} backHref="/dashboard/organizer" />
    </SectionShell>
  );
}
