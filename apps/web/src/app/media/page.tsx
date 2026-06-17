import type { Metadata } from "next";
import { MediaPageClient } from "./MediaPageClient";
import { buildMetadata, dictionaryText, getCurrentLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildMetadata({
    title: dictionaryText(locale, "media.title"),
    description: dictionaryText(locale, "media.subtitle"),
    path: "/media"
  });
}

export default function MediaPage() {
  return <MediaPageClient />;
}
