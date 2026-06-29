import type { Metadata } from "next";
import { getCurrentLocale } from "@/lib/seo";
import { AdvertisePageClient } from "./AdvertisePageClient";

const meta = {
  ru: {
    title: "Реклама на Billard.uz",
    description: "Разместите рекламу на платформе и привлеките внимание спортсменов и болельщиков."
  },
  uz: {
    title: "Billard.uz'da reklama",
    description: "Platformada reklama joylashtiring va sportchilar hamda muxlislar e'tiborini jalb qiling."
  },
  en: {
    title: "Advertising on Billard.uz",
    description: "Place an ad on the platform and draw the attention of athletes and fans."
  }
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const copy = meta[locale] ?? meta.ru;
  return { title: copy.title, description: copy.description };
}

export default function AdvertisePage() {
  return <AdvertisePageClient />;
}
