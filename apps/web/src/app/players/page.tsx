import type { Metadata } from "next";
import { PlayersPageClient } from "./PlayersPageClient";
import { buildMetadata, dictionaryText, getCurrentLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildMetadata({
    title: dictionaryText(locale, "players.title"),
    description: dictionaryText(locale, "players.subtitle"),
    path: "/players"
  });
}

export default function PlayersPage() {
  return <PlayersPageClient />;
}
