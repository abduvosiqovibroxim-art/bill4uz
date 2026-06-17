import type { Metadata } from "next";
import { NewsPageClient } from "./NewsPageClient";
import { buildMetadata, dictionaryText, getCurrentLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildMetadata({
    title: dictionaryText(locale, "news.title"),
    description: dictionaryText(locale, "news.subtitle"),
    path: "/news"
  });
}

export default function NewsPage() {
  return <NewsPageClient />;
}
