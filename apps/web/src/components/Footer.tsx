"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const PHONE_DISPLAY = "+998 99 866 68 09";
const PHONE_HREF = "tel:+998998666809";
const TELEGRAM_HANDLE = "@Billuzpro_bot";
const TELEGRAM_HREF = "https://t.me/Billuzpro_bot";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

type FooterCopy = {
  tagline: string;
  meta: FooterLink[];
  columns: FooterColumn[];
  rights: string;
};

const footerCopy: Record<"ru" | "uz" | "en", FooterCopy> = {
  ru: {
    tagline: "Официальная платформа для проведения турниров по бильярдному спорту в Узбекистане",
    meta: [
      { label: "Пользовательское соглашение", href: "/about" },
      { label: "Поддержать проект", href: "/contacts" },
      { label: "Рекламодателям", href: "/advertise" },
      { label: "Техническая поддержка", href: "/contacts" }
    ],
    columns: [
      {
        title: "Навигация",
        links: [
          { label: "Главная страница", href: "/" },
          { label: "Личный кабинет", href: "/account" },
          { label: "Помощь", href: "/contacts" },
          { label: "Новости", href: "/news" }
        ]
      },
      { title: "Пул", links: disciplineLinks() },
      { title: "Пирамида", links: disciplineLinks() },
      { title: "Снукер", links: disciplineLinks() },
      { title: "Китайский бильярд", links: disciplineLinks() }
    ],
    rights: "Bill4. Все права защищены."
  },
  uz: {
    tagline: "O'zbekistonda bilyard sport bo'yicha turnirlar o'tkazish uchun rasmiy platforma",
    meta: [
      { label: "Foydalanuvchi shartnomasi", href: "/about" },
      { label: "Loyihani qo'llab-quvvatlash", href: "/contacts" },
      { label: "Reklama beruvchilarga", href: "/advertise" },
      { label: "Texnik yordam", href: "/contacts" }
    ],
    columns: [
      {
        title: "Navigatsiya",
        links: [
          { label: "Bosh sahifa", href: "/" },
          { label: "Shaxsiy kabinet", href: "/account" },
          { label: "Yordam", href: "/contacts" },
          { label: "Yangiliklar", href: "/news" }
        ]
      },
      { title: "Pul", links: disciplineLinks("uz") },
      { title: "Piramida", links: disciplineLinks("uz") },
      { title: "Snuker", links: disciplineLinks("uz") },
      { title: "Xitoy bilyardi", links: disciplineLinks("uz") }
    ],
    rights: "Bill4. Barcha huquqlar himoyalangan."
  },
  en: {
    tagline: "The official platform for running billiard sport tournaments in Uzbekistan",
    meta: [
      { label: "Terms of use", href: "/about" },
      { label: "Support the project", href: "/contacts" },
      { label: "For advertisers", href: "/advertise" },
      { label: "Technical support", href: "/contacts" }
    ],
    columns: [
      {
        title: "Navigation",
        links: [
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Help", href: "/contacts" },
          { label: "News", href: "/news" }
        ]
      },
      { title: "Pool", links: disciplineLinks("en") },
      { title: "Pyramid", links: disciplineLinks("en") },
      { title: "Snooker", links: disciplineLinks("en") },
      { title: "Chinese billiards", links: disciplineLinks("en") }
    ],
    rights: "Bill4. All rights reserved."
  }
};

function disciplineLinks(locale: "ru" | "uz" | "en" = "ru"): FooterLink[] {
  const labels = {
    ru: ["Список турниров", "Рейтинг", "Фотографии", "Видео"],
    uz: ["Turnirlar ro'yxati", "Reyting", "Suratlar", "Video"],
    en: ["Tournaments", "Rating", "Photos", "Video"]
  }[locale];
  const hrefs = ["/tournaments", "/rankings", "/media", "/reels"];
  return labels.map((label, index) => ({ label, href: hrefs[index] }));
}

export function Footer() {
  const { locale } = useI18n();
  const c = footerCopy[locale] ?? footerCopy.ru;

  return (
    <footer className="site-footer mt-16">
      <div className="container-shell">
        <div className="site-footer-top">
          <Link href="/" className="site-footer-logo" aria-label="Bill4">
            <Image
              src="/brand/bill4-logo-v4-dark.png"
              alt="Bill4"
              width={1200}
              height={282}
              unoptimized
              className="site-footer-logo-img"
            />
          </Link>
          <p className="site-footer-tagline">{c.tagline}</p>
        </div>

        <div className="site-footer-grid">
          <div className="site-footer-meta">
            <ul className="site-footer-meta-links">
              {c.meta.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="site-footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a href={PHONE_HREF} className="site-footer-phone">
              {PHONE_DISPLAY}
            </a>
            <div className="site-footer-socials">
              <a href={PHONE_HREF} className="site-footer-social" aria-label={PHONE_DISPLAY}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path
                    d="M6.6 3h3.2l1.5 4-2 1.5a12 12 0 0 0 5.7 5.7l1.5-2 4 1.5v3.2c0 .9-.7 1.6-1.6 1.6C11.7 20 4 12.3 4 4.6 4 3.7 4.7 3 5.6 3h1Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href={TELEGRAM_HREF}
                target="_blank"
                rel="noreferrer"
                className="site-footer-social"
                aria-label={`Telegram ${TELEGRAM_HANDLE}`}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path
                    d="M21 4.5 2.8 11.4c-.9.3-.9 1.6 0 1.9l4.5 1.4 1.7 5.1c.2.7 1.1.9 1.6.3l2.4-2.6 4.5 3.3c.6.4 1.5.1 1.7-.7L22 5.6c.2-.9-.6-1.4-1-1.1Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="m9 14.7 8.2-6.3-6.5 7.2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          {c.columns.map((column) => (
            <nav key={column.title} className="site-footer-col" aria-label={column.title}>
              <p className="site-footer-col-title">{column.title}</p>
              <ul className="site-footer-col-links">
                {column.links.map((item) => (
                  <li key={`${column.title}-${item.label}`}>
                    <Link href={item.href} className="site-footer-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="site-footer-bottom">
          <p>{c.rights}</p>
        </div>
      </div>
    </footer>
  );
}
