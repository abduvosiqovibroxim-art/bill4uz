import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";
import { buildMetadata, dictionaryText, getCurrentLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildMetadata({
    title: dictionaryText(locale, "common.brand"),
    description: dictionaryText(locale, "common.appDescription"),
    path: "/",
    imageAlt: "Billard.uz Pro"
  });
}

export default function HomePage() {
  return <HomePageClient />;
}
