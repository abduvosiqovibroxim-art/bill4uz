import type { Metadata } from "next";
import type { RawTournament } from "@/lib/api/contracts";
import {
  buildMetadata,
  buildTitle,
  buildTournamentDescription,
  dictionaryText,
  fetchPublicSeo,
  getCurrentLocale,
  pickSeoText
} from "@/lib/seo";
import { TournamentDetailPageClient } from "./TournamentDetailPageClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const tournament = await fetchPublicSeo<RawTournament>(`/tournaments/${id}`);

  if (!tournament) {
    return buildMetadata({
      title: buildTitle(dictionaryText(locale, "tournaments.title")),
      description: dictionaryText(locale, "system.notFoundText"),
      path: `/tournaments/${id}`
    });
  }

  return buildMetadata({
    title: buildTitle(pickSeoText(tournament.title, locale)),
    description:
      pickSeoText(tournament.description, locale) ||
      buildTournamentDescription({
        title: pickSeoText(tournament.title, locale),
        club: pickSeoText(tournament.clubPreview?.name ?? tournament.club?.name, locale) || dictionaryText(locale, "common.stats.club"),
        city: dictionaryText(locale, `common.cities.${tournament.cityKey}`),
        status: dictionaryText(locale, `common.statuses.${String(tournament.status).toLowerCase()}`),
        discipline: tournament.disciplineName ?? dictionaryText(locale, `common.disciplines.${tournament.disciplineKey}`),
        prizePool: tournament.prizePool
      }),
    path: `/tournaments/${id}`,
    imagePath: `/tournaments/${id}/opengraph-image`,
    imageAlt: pickSeoText(tournament.title, locale)
  });
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <TournamentDetailPageClient id={id} />;
}
