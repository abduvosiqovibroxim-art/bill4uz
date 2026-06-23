import type { Metadata } from "next";
import { Suspense } from "react";
import { TournamentsPageClient } from "./TournamentsPageClient";
import { buildMetadata, dictionaryText, getCurrentLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildMetadata({
    title: dictionaryText(locale, "tournaments.title"),
    description: dictionaryText(locale, "tournaments.subtitle"),
    path: "/tournaments"
  });
}

export default function TournamentsPage() {
  return (
    <Suspense>
      <TournamentsPageClient />
    </Suspense>
  );
}
