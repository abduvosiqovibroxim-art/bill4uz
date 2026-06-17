import type { Metadata } from "next";
import type { RawPlayer } from "@/lib/api/contracts";
import {
  buildMetadata,
  buildPlayerDescription,
  buildTitle,
  dictionaryText,
  fetchPublicSeo,
  getCurrentLocale,
  pickSeoText
} from "@/lib/seo";
import { PlayerProfilePageClient } from "./PlayerProfilePageClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const player = await fetchPublicSeo<RawPlayer>(`/players/${id}`);

  if (!player) {
    return buildMetadata({
      title: buildTitle(dictionaryText(locale, "players.title")),
      description: dictionaryText(locale, "system.notFoundText"),
      path: `/players/${id}`
    });
  }

  return buildMetadata({
    title: buildTitle(player.fullName),
    description: buildPlayerDescription({
      name: player.fullName,
      club: pickSeoText(player.club?.name, locale) || dictionaryText(locale, "common.stats.club"),
      city: dictionaryText(locale, `common.cities.${player.cityKey}`),
      elo: player.elo,
      bio: pickSeoText(player.bio, locale)
    }),
    path: `/players/${id}`,
    type: "profile",
    imageAlt: player.fullName
  });
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <PlayerProfilePageClient id={id} />;
}
