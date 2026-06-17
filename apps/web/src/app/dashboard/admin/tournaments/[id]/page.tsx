"use client";

import { use } from "react";
import { TournamentBracketManager } from "@/components/tournament/TournamentBracketManager";

export default function AdminTournamentBracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <TournamentBracketManager tournamentId={id} backHref="/dashboard/admin/tournaments" />;
}
