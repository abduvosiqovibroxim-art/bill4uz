"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type SettingsCopy = {
  title: string;
  subtitle: string;
  hint: string;
  users: string;
  clubs: string;
  tournaments: string;
};

const copy: Record<"ru" | "uz" | "en", SettingsCopy> = {
  ru: {
    title: "Настройки",
    subtitle: "Быстрые переходы для базовой админ-настройки",
    hint: "Сложная CRM не используется. Только базовые разделы запуска.",
    users: "Пользователи",
    clubs: "Бильярдные",
    tournaments: "Турниры"
  },
  uz: {
    title: "Sozlamalar",
    subtitle: "Asosiy admin sozlamalari uchun tezkor havolalar",
    hint: "Murakkab CRM ishlatilmaydi. Faqat ishga tushirish uchun asosiy bo'limlar.",
    users: "Foydalanuvchilar",
    clubs: "Bilyard joylari",
    tournaments: "Turnirlar"
  },
  en: {
    title: "Settings",
    subtitle: "Quick links for core admin setup",
    hint: "No heavy CRM. Only core launch sections.",
    users: "Users",
    clubs: "Billiard places",
    tournaments: "Tournaments"
  }
};

export default function AdminSettingsPage() {
  const { locale } = useI18n();
  const c = copy[locale];

  return (
    <div className="space-y-4">
      <section className="page-header-card">
        <h1 className="section-title">{c.title}</h1>
        <p className="page-subtitle">{c.subtitle}</p>
      </section>

      <section className="filter-panel">
        <p className="text-sm text-muted">{c.hint}</p>
      </section>

      <section className="action-grid">
        <Link href="/dashboard/admin/users" className="action-card">
          <p className="text-base font-semibold text-white">{c.users}</p>
        </Link>
        <Link href="/dashboard/admin/clubs" className="action-card">
          <p className="text-base font-semibold text-white">{c.clubs}</p>
        </Link>
        <Link href="/dashboard/admin/tournaments" className="action-card">
          <p className="text-base font-semibold text-white">{c.tournaments}</p>
        </Link>
      </section>
    </div>
  );
}
