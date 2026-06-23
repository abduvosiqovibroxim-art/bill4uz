import type { Metadata } from "next";
import { CoachesPageClient } from "./CoachesPageClient";
import { buildMetadata, dictionaryText, getCurrentLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildMetadata({
    title: dictionaryText(locale, "coaches.title"),
    description: dictionaryText(locale, "coaches.subtitle"),
    path: "/coaches"
  });
}

export default function CoachesPage() {
  return <CoachesPageClient />;
}
