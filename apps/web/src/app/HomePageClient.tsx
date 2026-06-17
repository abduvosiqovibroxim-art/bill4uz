"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type HomeFeature = {
  icon: string;
  title: string;
  text: string;
  action: string;
  href?: string;
};

type HomeCopy = {
  badge: string;
  heroTitle: string;
  heroTitleLines: string[];
  heroLead: string;
  tournamentsAction: string;
  bookingAction: string;
  stats: string[];
  features: HomeFeature[];
  stepsTitle: string;
  steps: string[];
};

const copy: Record<"ru" | "uz" | "en", HomeCopy> = {
  ru: {
    badge: "Billuz MVP",
    heroTitle: "Бильярдные турниры без хаоса",
    heroTitleLines: ["Бильярдные", "турниры", "без хаоса"],
    heroLead: "Создавай турниры, веди сетку, смотри результаты и находи бильярдные рядом.",
    tournamentsAction: "Смотреть турниры",
    bookingAction: "Забронировать",
    stats: ["Single Elimination", "Рейтинг игроков", "Mobile friendly"],
    features: [
      {
        icon: "1",
        title: "Турниры",
        text: "Регистрация, участники, расписание и результаты",
        action: "Открыть турниры",
        href: "/tournaments"
      },
      {
        icon: "2",
        title: "Сетки",
        text: "Single Elimination уже работает, остальные форматы скоро",
        action: "Смотреть пример",
        href: "/tournaments"
      },
      {
        icon: "3",
        title: "Рейтинг",
        text: "Очки, победы, матчи и прогресс игроков",
        action: "Открыть рейтинг",
        href: "/rating"
      },
      {
        icon: "4",
        title: "Карта",
        text: "Бильярдные, телефоны и маршруты",
        action: "Найти место",
        href: "/booking"
      }
    ],
    stepsTitle: "Как работает Billuz",
    steps: ["Игрок записывается", "Организатор запускает сетку", "Результаты и рейтинг обновляются"]
  },
  uz: {
    badge: "Billuz MVP",
    heroTitle: "Bilyard turnirlari tartibli boshqariladi",
    heroTitleLines: ["Bilyard turnirlari", "tartibli boshqariladi"],
    heroLead: "Turnir yarating, setkani yuriting, natijalarni kuzating va yaqin bilyard joylarini toping.",
    tournamentsAction: "Turnirlarni ko'rish",
    bookingAction: "Bron qilish",
    stats: ["Single Elimination", "O'yinchilar reytingi", "Mobile friendly"],
    features: [
      {
        icon: "1",
        title: "Turnirlar",
        text: "Ro'yxatdan o'tish, ishtirokchilar, jadval va natijalar",
        action: "Turnirlarni ochish",
        href: "/tournaments"
      },
      {
        icon: "2",
        title: "Setkalar",
        text: "Single Elimination ishlaydi, boshqa formatlar tez orada",
        action: "Misolni ko'rish",
        href: "/tournaments"
      },
      {
        icon: "3",
        title: "Reyting",
        text: "Ochko, g'alaba, matchlar va o'yinchi rivoji",
        action: "Reytingni ochish",
        href: "/rating"
      },
      {
        icon: "4",
        title: "Xarita",
        text: "Bilyard joylari, telefonlar va yo'nalishlar",
        action: "Joy topish",
        href: "/booking"
      }
    ],
    stepsTitle: "Billuz qanday ishlaydi",
    steps: ["O'yinchi yoziladi", "Tashkilotchi setkani boshlaydi", "Natija va reyting yangilanadi"]
  },
  en: {
    badge: "Billuz MVP",
    heroTitle: "Billiards tournaments without chaos",
    heroTitleLines: ["Billiards tournaments", "without chaos"],
    heroLead: "Create tournaments, run brackets, track results, and find billiard places nearby.",
    tournamentsAction: "View tournaments",
    bookingAction: "Book",
    stats: ["Single Elimination", "Player rating", "Mobile friendly"],
    features: [
      {
        icon: "1",
        title: "Tournaments",
        text: "Registration, participants, schedule, and results",
        action: "Open tournaments",
        href: "/tournaments"
      },
      {
        icon: "2",
        title: "Brackets",
        text: "Single Elimination works now, more formats are coming soon",
        action: "View example",
        href: "/tournaments"
      },
      {
        icon: "3",
        title: "Rating",
        text: "Points, wins, matches, and player progress",
        action: "Open rating",
        href: "/rating"
      },
      {
        icon: "4",
        title: "Map",
        text: "Billiard places, phones, and routes",
        action: "Find a place",
        href: "/booking"
      }
    ],
    stepsTitle: "How Billuz works",
    steps: ["Player joins", "Organizer starts the bracket", "Results and rating update"]
  }
};

export function HomePageClient() {
  const { locale } = useI18n();
  const c = copy[locale];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero Section - bill4you style */}
      <section className="container-shell py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center" style={{
          border: "1px solid var(--card-border-strong)",
          borderRadius: "var(--radius-md)",
          padding: "clamp(2rem, 3vw, 3rem)",
          background: "var(--surface)"
        }}>
          {/* Left: Hero Copy */}
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full"
                  style={{ background: "var(--emerald)", color: "var(--bg)" }}>
              {c.badge}
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight" style={{ color: "var(--text)" }}>
              {c.heroTitleLines.map((line, idx) => (
                <span key={idx} className="block">{line}</span>
              ))}
            </h1>
            <p className="text-lg md:text-xl" style={{ color: "var(--muted)" }}>
              {c.heroLead}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/tournaments"
                className="px-6 py-3 font-semibold rounded-lg transition-all hover:scale-105"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                {c.tournamentsAction}
              </Link>
              <Link
                href="/booking"
                className="px-6 py-3 font-semibold rounded-lg transition-all hover:scale-105"
                style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
              >
                {c.bookingAction}
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {c.stats.map((stat) => (
                <span
                  key={stat}
                  className="px-3 py-1 text-sm rounded-full"
                  style={{ background: "var(--accent-soft)", color: "var(--text)" }}
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live Bracket Preview */}
          <HeroBracketPreview />
        </div>
      </section>

      {/* Feature Cards Grid - bill4you style */}
      <section className="container-shell py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {c.features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* How It Works Steps */}
      <HowItWorksSteps title={c.stepsTitle} steps={c.steps} />
    </div>
  );
}

function HeroBracketPreview() {
  return (
    <div className="relative p-6 rounded-lg" style={{ background: "var(--deep-green)", border: "1px solid var(--card-border)" }}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold uppercase" style={{ color: "var(--muted)" }}>8 игроков</span>
        <span className="px-2 py-1 text-xs font-bold uppercase rounded" style={{ background: "var(--emerald)", color: "var(--bg)" }}>
          Live bracket
        </span>
      </div>
      <div className="space-y-2 p-4 rounded-lg" style={{ background: "var(--surface-strong)", border: "1px solid var(--accent)" }}>
        <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px solid var(--card-border)" }}>
          <span className="text-sm" style={{ color: "var(--muted)" }}>Финал</span>
          <strong className="text-sm" style={{ color: "var(--accent)" }}>Champion</strong>
        </div>
        <div className="flex justify-between items-center py-2 px-3 rounded" style={{ background: "var(--accent-soft)" }}>
          <span style={{ color: "var(--text)" }}>Игрок 1</span>
          <strong className="text-lg" style={{ color: "var(--accent)" }}>3</strong>
        </div>
        <div className="flex justify-between items-center py-2 px-3 rounded" style={{ background: "var(--surface-soft)" }}>
          <span style={{ color: "var(--muted)" }}>Игрок 2</span>
          <strong className="text-lg" style={{ color: "var(--text)" }}>1</strong>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: HomeFeature }) {
  const content = (
    <>
      {/* Icon in green circle - bill4you style */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full text-2xl font-black mb-4"
           style={{ background: "var(--emerald)", color: "var(--bg)" }}>
        {feature.icon}
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
        {feature.title}
      </h2>
      <p className="mb-4" style={{ color: "var(--muted)" }}>
        {feature.text}
      </p>
      <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
        {feature.action} →
      </span>
    </>
  );

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-md)",
    padding: "2rem",
    transition: "all 0.3s ease"
  };

  if (feature.href) {
    return (
      <Link
        href={feature.href}
        className="block hover:scale-[1.02]"
        style={cardStyle}
      >
        {content}
      </Link>
    );
  }

  return <article style={cardStyle}>{content}</article>;
}

function HowItWorksSteps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section className="container-shell py-12">
      <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div
            key={step}
            className="p-6 rounded-lg"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--card-border)"
            }}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full text-xl font-black mb-4"
                 style={{ background: "var(--emerald)", color: "var(--bg)" }}>
              {index + 1}
            </div>
            <p className="text-lg" style={{ color: "var(--text)" }}>
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
