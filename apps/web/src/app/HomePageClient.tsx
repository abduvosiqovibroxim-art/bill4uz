"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import {
  useClubsQuery,
  useNewsQuery,
  usePlayersQuery,
  useRankingsQuery,
  useTournamentsQuery
} from "@/lib/api/hooks";
import { NewsPreviewCard } from "@/components/cards";
import type { Locale, Tournament, TournamentStatus } from "@/lib/types";

type Copy = {
  badge: string;
  heroTitleA: string;
  heroAccent: string;
  heroLead: string;
  ctaTournaments: string;
  ctaBooking: string;
  chips: string[];
  previewLabel: string;
  previewLive: string;
  previewFinal: string;
  previewChampion: string;
  previewPlayers: string;
  previewRating: string;
  catsEyebrow: string;
  catsTitle: string;
  cats: { title: string; sub: string; cls: string; img: string; href: string }[];
  statsEyebrow: string;
  statsTitle: string;
  statsSub: string;
  statTournaments: string;
  statPlayers: string;
  statMatches: string;
  statClubs: string;
  scheduleTitle: string;
  scheduleEmpty: string;
  scheduleEmptySub: string;
  scheduleAll: string;
  open: string;
  topTitle: string;
  topEmpty: string;
  topAll: string;
  pts: string;
  winRate: string;
  infoEyebrow: string;
  infoTitle: string;
  info: { icon: string; title: string; text: string; more: string; href: string }[];
  newsTitle: string;
  newsAll: string;
  bookingCtaTitle: string;
  bookingCtaText: string;
  bookingCtaButton: string;
  sponsorLabel: string;
  sponsorSub: string;
  months: string[];
};

const copy: Record<Locale, Copy> = {
  ru: {
    badge: "Платформа бильярда · Узбекистан",
    heroTitleA: "Бильярдные турниры",
    heroAccent: "без хаоса",
    heroLead: "Следи за турнирами, записывайся, смотри сетки, результаты и рейтинг игроков — всё в одном месте.",
    ctaTournaments: "Смотреть турниры",
    ctaBooking: "Забронировать",
    chips: ["Live сетки", "Рейтинг игроков", "Онлайн запись", "Mobile-first"],
    previewLabel: "Пример интерфейса",
    previewLive: "Live bracket",
    previewFinal: "Финал",
    previewChampion: "Чемпион",
    previewPlayers: "8 игроков",
    previewRating: "Рейтинг",
    catsEyebrow: "Дисциплины",
    catsTitle: "Выбери свою игру",
    cats: [
      { title: "Пирамида", sub: "Русский бильярд", cls: "grad-pyramid", img: "/disciplines/pyramid.webp", href: "/tournaments?kind=pyramid" },
      { title: "Пул", sub: "8 / 9 / 10", cls: "grad-pool", img: "/disciplines/pool.webp", href: "/tournaments?kind=pool" },
      { title: "Снукер", sub: "Классика на большом столе", cls: "grad-snooker", img: "/disciplines/snooker.webp", href: "/tournaments?kind=snooker" },
      { title: "Калхоз", sub: "Народная игра", cls: "grad-kalhoz", img: "/disciplines/kalhoz.webp", href: "/tournaments" }
    ],
    statsEyebrow: "Платформа в цифрах",
    statsTitle: "Сообщество растёт каждый день",
    statsSub: "Данные обновляются автоматически по мере добавления событий и игроков.",
    statTournaments: "Турниры",
    statPlayers: "Игроки",
    statMatches: "Матчи",
    statClubs: "Бильярдные",
    scheduleTitle: "Расписание турниров",
    scheduleEmpty: "Турниры пока не добавлены",
    scheduleEmptySub: "Организаторы скоро добавят новые события — загляни позже.",
    scheduleAll: "Все турниры",
    open: "Открыть",
    topTitle: "Топ игроков",
    topEmpty: "Рейтинг пока пустой",
    topAll: "Весь рейтинг",
    pts: "очков",
    winRate: "винрейт",
    infoEyebrow: "Возможности",
    infoTitle: "Всё для турнира",
    info: [
      { icon: "▦", title: "Турниры и сетки", text: "Регистрация, участники, расписание и результаты в одном центре управления.", more: "Открыть турниры", href: "/tournaments" },
      { icon: "★", title: "Рейтинг игроков", text: "Очки, победы, матчи и прогресс — прозрачная таблица лидеров.", more: "Открыть рейтинг", href: "/rating" },
      { icon: "◎", title: "Бронирование", text: "Бильярдные на карте, телефоны и маршруты рядом с тобой.", more: "Найти место", href: "/booking" }
    ],
    newsTitle: "Новости и анонсы",
    newsAll: "Все новости",
    bookingCtaTitle: "Найди стол и записывайся онлайн",
    bookingCtaText: "Бильярдные клубы на карте: адреса, телефоны и маршруты. Бронируй удобное время в пару касаний.",
    bookingCtaButton: "Открыть карту",
    sponsorLabel: "Место для партнёра",
    sponsorSub: "Рекламный блок платформы",
    months: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
  },
  uz: {
    badge: "Bilyard platformasi · O'zbekiston",
    heroTitleA: "Bilyard turnirlari",
    heroAccent: "tartibli",
    heroLead: "Turnirlarni kuzating, yoziling, setkalar, natijalar va o'yinchilar reytingini bir joyda ko'ring.",
    ctaTournaments: "Turnirlarni ko'rish",
    ctaBooking: "Bron qilish",
    chips: ["Live setkalar", "O'yinchilar reytingi", "Onlayn yozilish", "Mobile-first"],
    previewLabel: "Interfeys namunasi",
    previewLive: "Live bracket",
    previewFinal: "Final",
    previewChampion: "Chempion",
    previewPlayers: "8 o'yinchi",
    previewRating: "Reyting",
    catsEyebrow: "Yo'nalishlar",
    catsTitle: "O'yiningni tanla",
    cats: [
      { title: "Piramida", sub: "Rus bilyardi", cls: "grad-pyramid", img: "/disciplines/pyramid.webp", href: "/tournaments?kind=pyramid" },
      { title: "Pul", sub: "8 / 9 / 10", cls: "grad-pool", img: "/disciplines/pool.webp", href: "/tournaments?kind=pool" },
      { title: "Snooker", sub: "Katta stol klassikasi", cls: "grad-snooker", img: "/disciplines/snooker.webp", href: "/tournaments?kind=snooker" },
      { title: "Kalxoz", sub: "Xalq o'yini", cls: "grad-kalhoz", img: "/disciplines/kalhoz.webp", href: "/tournaments" }
    ],
    statsEyebrow: "Raqamlarda",
    statsTitle: "Hamjamiyat har kuni o'smoqda",
    statsSub: "Ma'lumotlar tadbirlar va o'yinchilar qo'shilishi bilan avtomatik yangilanadi.",
    statTournaments: "Turnirlar",
    statPlayers: "O'yinchilar",
    statMatches: "Matchlar",
    statClubs: "Bilyardxonalar",
    scheduleTitle: "Turnirlar jadvali",
    scheduleEmpty: "Turnirlar hali qo'shilmagan",
    scheduleEmptySub: "Tashkilotchilar tez orada yangi tadbirlar qo'shadi.",
    scheduleAll: "Barcha turnirlar",
    open: "Ochish",
    topTitle: "Top o'yinchilar",
    topEmpty: "Reyting hali bo'sh",
    topAll: "To'liq reyting",
    pts: "ochko",
    winRate: "g'alaba %",
    infoEyebrow: "Imkoniyatlar",
    infoTitle: "Turnir uchun hammasi",
    info: [
      { icon: "▦", title: "Turnir va setkalar", text: "Ro'yxat, ishtirokchilar, jadval va natijalar yagona markazda.", more: "Turnirlarni ochish", href: "/tournaments" },
      { icon: "★", title: "O'yinchilar reytingi", text: "Ochko, g'alaba, matchlar va rivoj — shaffof jadval.", more: "Reytingni ochish", href: "/rating" },
      { icon: "◎", title: "Bron qilish", text: "Bilyardxonalar xaritada: manzil, telefon va yo'nalishlar.", more: "Joy topish", href: "/booking" }
    ],
    newsTitle: "Yangiliklar",
    newsAll: "Barcha yangiliklar",
    bookingCtaTitle: "Stol toping va onlayn yoziling",
    bookingCtaText: "Bilyard klublari xaritada: manzil, telefon va yo'nalishlar. Qulay vaqtni bir necha bosishda bron qiling.",
    bookingCtaButton: "Xaritani ochish",
    sponsorLabel: "Hamkor uchun joy",
    sponsorSub: "Platforma reklama bloki",
    months: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"]
  },
  en: {
    badge: "Billiards platform · Uzbekistan",
    heroTitleA: "Billiard tournaments",
    heroAccent: "without chaos",
    heroLead: "Follow tournaments, register, watch brackets, results and the player rating — all in one place.",
    ctaTournaments: "View tournaments",
    ctaBooking: "Book a table",
    chips: ["Live brackets", "Player rating", "Online booking", "Mobile-first"],
    previewLabel: "Interface preview",
    previewLive: "Live bracket",
    previewFinal: "Final",
    previewChampion: "Champion",
    previewPlayers: "8 players",
    previewRating: "Rating",
    catsEyebrow: "Disciplines",
    catsTitle: "Pick your game",
    cats: [
      { title: "Pyramid", sub: "Russian billiards", cls: "grad-pyramid", img: "/disciplines/pyramid.webp", href: "/tournaments?kind=pyramid" },
      { title: "Pool", sub: "8 / 9 / 10", cls: "grad-pool", img: "/disciplines/pool.webp", href: "/tournaments?kind=pool" },
      { title: "Snooker", sub: "Classic big-table game", cls: "grad-snooker", img: "/disciplines/snooker.webp", href: "/tournaments?kind=snooker" },
      { title: "Kalhoz", sub: "Folk game", cls: "grad-kalhoz", img: "/disciplines/kalhoz.webp", href: "/tournaments" }
    ],
    statsEyebrow: "Platform in numbers",
    statsTitle: "The community grows every day",
    statsSub: "Numbers update automatically as events and players are added.",
    statTournaments: "Tournaments",
    statPlayers: "Players",
    statMatches: "Matches",
    statClubs: "Venues",
    scheduleTitle: "Tournament schedule",
    scheduleEmpty: "No tournaments yet",
    scheduleEmptySub: "Organizers will add new events soon — check back later.",
    scheduleAll: "All tournaments",
    open: "Open",
    topTitle: "Top players",
    topEmpty: "The rating is empty",
    topAll: "Full rating",
    pts: "pts",
    winRate: "win rate",
    infoEyebrow: "Features",
    infoTitle: "Everything for a tournament",
    info: [
      { icon: "▦", title: "Tournaments & brackets", text: "Registration, participants, schedule and results in one control center.", more: "Open tournaments", href: "/tournaments" },
      { icon: "★", title: "Player rating", text: "Points, wins, matches and progress — a transparent leaderboard.", more: "Open rating", href: "/rating" },
      { icon: "◎", title: "Booking", text: "Billiard venues on the map: addresses, phones and routes near you.", more: "Find a place", href: "/booking" }
    ],
    newsTitle: "News & announcements",
    newsAll: "All news",
    bookingCtaTitle: "Find a table and book online",
    bookingCtaText: "Billiard clubs on the map: addresses, phones and routes. Book a convenient time in a couple of taps.",
    bookingCtaButton: "Open the map",
    sponsorLabel: "Partner placement",
    sponsorSub: "Platform ad slot",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  }
};

const STATUS_ORDER: Record<TournamentStatus, number> = {
  live: 0,
  registration: 1,
  draft: 2,
  finished: 3
};

export function HomePageClient() {
  const { locale, t, formatNumber } = useI18n();
  const c = copy[locale];

  const tournamentsQuery = useTournamentsQuery();
  const playersQuery = usePlayersQuery();
  const rankingsQuery = useRankingsQuery();
  const clubsQuery = useClubsQuery();

  const tournaments = tournamentsQuery.data ?? [];
  const players = playersQuery.data ?? [];
  const rankings = rankingsQuery.data ?? [];
  const clubs = clubsQuery.data ?? [];

  const matchesCount = tournaments.reduce((sum, item) => sum + (item.bracketMatchesCount ?? 0), 0);

  const upcoming = [...tournaments]
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    })
    .slice(0, 5);

  const topPlayers = rankings.length
    ? rankings
        .slice()
        .sort((a, b) => a.position - b.position || b.points - a.points)
        .slice(0, 5)
        .map((entry) => ({
          id: entry.player.id,
          name: entry.player.fullName,
          points: entry.points,
          cityKey: entry.player.cityKey,
          winRate: winRateOf(entry.player.wins, entry.player.losses)
        }))
    : players
        .slice()
        .sort((a, b) => b.elo - a.elo)
        .slice(0, 5)
        .map((player) => ({
          id: player.id,
          name: player.fullName,
          points: player.elo,
          cityKey: player.cityKey,
          winRate: winRateOf(player.wins, player.losses)
        }));

  return (
    <div className="portal-wrap">
      <div className="portal">
        {/* 1. HERO */}
        <section className="portal-hero">
          <div className="portal-hero-copy">
            <span className="portal-hero-badge">
              <span className="dot" aria-hidden="true" />
              {c.badge}
            </span>
            <h1 className="portal-hero-title">
              {c.heroTitleA} <span className="accent">{c.heroAccent}</span>
            </h1>
            <p className="portal-hero-lead">{c.heroLead}</p>
            <div className="portal-hero-actions">
              <Link href="/tournaments" className="button-primary">{c.ctaTournaments}</Link>
              <Link href="/booking" className="button-secondary">{c.ctaBooking}</Link>
            </div>
            <div className="portal-hero-chips">
              {c.chips.map((chip) => (
                <span key={chip} className="portal-chip">
                  <span className="tick" aria-hidden="true">✓</span>
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <HeroPreview c={c} />
        </section>

        {/* 2. CATEGORY TILES */}
        <section>
          <PortalHead eyebrow={c.catsEyebrow} title={c.catsTitle} />
          <div className="portal-cats">
            {c.cats.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className={`portal-cat ${cat.cls}`}
                style={{ ["--tile-bg" as string]: `url(${cat.img})` } as CSSProperties}
              >
                <h3 className="portal-cat-title">{cat.title}</h3>
                <p className="portal-cat-sub">{cat.sub}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. STATS STRIP */}
        <section>
          <PortalHead eyebrow={c.statsEyebrow} title={c.statsTitle} subtitle={c.statsSub} />
          <div className="portal-stats">
            <StatTile value={tournaments.length} label={c.statTournaments} loading={tournamentsQuery.isLoading} format={formatNumber} icon="🏆" />
            <StatTile value={players.length} label={c.statPlayers} loading={playersQuery.isLoading} format={formatNumber} icon="👥" />
            <StatTile value={matchesCount} label={c.statMatches} loading={tournamentsQuery.isLoading} format={formatNumber} icon="🎱" />
            <StatTile value={clubs.length} label={c.statClubs} loading={clubsQuery.isLoading} format={formatNumber} icon="📍" />
          </div>
        </section>

        {/* 4. SCHEDULE + TOP PLAYERS */}
        <section className="portal-duo">
          <div className="portal-panel">
            <div className="portal-panel-head">
              <h2 className="portal-panel-title">{c.scheduleTitle}</h2>
              <Link href="/tournaments" className="portal-link">{c.scheduleAll} →</Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="state-block">
                <span className="state-icon" aria-hidden="true">▦</span>
                <p className="state-title">{c.scheduleEmpty}</p>
                <p className="state-text">{c.scheduleEmptySub}</p>
              </div>
            ) : (
              <div className="portal-sched">
                {upcoming.map((item) => (
                  <ScheduleRow key={item.id} item={item} c={c} />
                ))}
              </div>
            )}
          </div>

          <div className="portal-panel">
            <div className="portal-panel-head">
              <h2 className="portal-panel-title">{c.topTitle}</h2>
              <Link href="/rating" className="portal-link">{c.topAll} →</Link>
            </div>
            {topPlayers.length === 0 ? (
              <div className="state-block">
                <span className="state-icon" aria-hidden="true">★</span>
                <p className="state-title">{c.topEmpty}</p>
              </div>
            ) : (
              <div className="portal-board">
                {topPlayers.map((player, index) => (
                  <Link key={player.id} href={`/players/${player.id}`} className="portal-board-row">
                    <span className={`portal-rank${index < 3 ? ` top${index + 1}` : ""}`}>{index + 1}</span>
                    <div className="portal-board-main">
                      <p className="portal-board-name">{player.name}</p>
                      <p className="portal-board-sub">
                        {t(`common.cities.${player.cityKey || "tashkent"}`)} · {player.winRate}% {c.winRate}
                      </p>
                    </div>
                    <div className="portal-board-pts">
                      <span className="n">{formatNumber(player.points)}</span>
                      <span className="u">{c.pts}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. INFO / FEATURE CARDS */}
        <section>
          <PortalHead eyebrow={c.infoEyebrow} title={c.infoTitle} />
          <div className="portal-info-grid">
            {c.info.map((card) => (
              <Link key={card.title} href={card.href} className="portal-info-card">
                <span className="portal-info-icon" aria-hidden="true">{card.icon}</span>
                <h3 className="portal-info-title">{card.title}</h3>
                <p className="portal-info-text">{card.text}</p>
                <span className="portal-info-more">{card.more} →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. NEWS (only when real items exist) */}
        <HomeNews c={c} />

        {/* 7. SPONSOR PLACEHOLDER */}
        <section className="portal-sponsor" aria-hidden="true">
          <span className="portal-sponsor-label">{c.sponsorLabel}</span>
          <span className="portal-sponsor-sub">{c.sponsorSub}</span>
        </section>
      </div>
    </div>
  );
}

function PortalHead({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="portal-head">
      <div>
        <span className="portal-eyebrow">{eyebrow}</span>
        <h2 className="portal-title">{title}</h2>
        {subtitle ? <p className="portal-sub">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function StatTile({
  value,
  label,
  loading,
  format,
  icon
}: {
  value: number;
  label: string;
  loading?: boolean;
  format: (value: number) => string;
  icon: ReactNode;
}) {
  const { ref, display } = useCountUp(value, !loading);

  return (
    <div className="portal-stat" ref={ref}>
      <span className="portal-stat-icon" aria-hidden="true">{icon}</span>
      <span className="portal-stat-value">{loading ? "—" : format(display)}</span>
      <span className="portal-stat-label">{label}</span>
    </div>
  );
}

function useCountUp(target: number, enabled: boolean, duration = 1100) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) {
      return;
    }
    const element = ref.current;
    if (!element) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      started.current = true;
      setDisplay(target);
      return;
    }

    let cancelled = false;
    const run = () => {
      started.current = true;
      let startTime: number | null = null;
      const tick = (now: number) => {
        if (cancelled) {
          return;
        }
        if (startTime === null) {
          startTime = now;
        }
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(target * eased));
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [enabled, target, duration]);

  return { ref, display };
}

function ScheduleRow({ item, c }: { item: Tournament; c: Copy }) {
  const { t, text } = useI18n();
  const date = new Date(item.startsAt);
  const valid = !Number.isNaN(date.getTime());
  const day = valid ? String(date.getDate()) : "—";
  const month = valid ? c.months[date.getMonth()] : "";
  const cityLabel = t(`common.cities.${item.cityKey || "tashkent"}`);
  const capacity = item.bracketSize ?? null;
  const statusClass = item.status === "live"
    ? "is-live"
    : item.status === "registration"
      ? "is-registration"
      : item.status === "finished"
        ? "is-finished"
        : "is-draft";

  return (
    <Link href={`/tournaments/${item.id}`} className="portal-sched-row">
      <span className="portal-date">
        <span className="day">{day}</span>
        <span className="mon">{month}</span>
      </span>
      <span className="portal-sched-main">
        <span className="portal-sched-name">{text(item.title)}</span>
        <span className="portal-sched-meta">
          <span>{cityLabel}</span>
          <span className="sep">·</span>
          <span>{item.disciplineName}</span>
        </span>
      </span>
      <span className="portal-sched-side">
        <span className={`portal-badge ${statusClass}`}>
          {item.status === "live" ? <span className="pulse" aria-hidden="true" /> : null}
          {t(`common.statuses.${item.status}`)}
        </span>
        <span className="portal-count">
          {item.participants}
          {capacity ? <span className="cap"> / {capacity}</span> : null}
        </span>
      </span>
    </Link>
  );
}

function HeroPreview({ c }: { c: Copy }) {
  return (
    <div className="portal-preview" aria-hidden="true">
      <div className="portal-preview-label">
        <span>{c.previewLabel}</span>
        <span className="portal-preview-live">{c.previewLive}</span>
      </div>
      <div className="portal-preview-board">
        <div className="portal-preview-match is-final">
          <div className="portal-preview-row">
            <span className="portal-preview-name">
              <span className="portal-preview-seed">1</span>
              Player A
            </span>
            <span className="portal-preview-score is-win">3</span>
          </div>
          <div className="portal-preview-row">
            <span className="portal-preview-name is-muted">
              <span className="portal-preview-seed">4</span>
              Player B
            </span>
            <span className="portal-preview-score">1</span>
          </div>
        </div>
        <div className="portal-preview-foot">
          <span>{c.previewFinal} · {c.previewPlayers}</span>
          <span className="champion">{c.previewChampion} · {c.previewRating} <span className="delta">+25</span></span>
        </div>
      </div>
    </div>
  );
}

function HomeNews({ c }: { c: Copy }) {
  const newsQuery = useNewsQuery();
  const items = [...(newsQuery.data ?? [])]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="portal-head">
        <div>
          <span className="portal-eyebrow">{c.newsAll}</span>
          <h2 className="portal-title">{c.newsTitle}</h2>
        </div>
        <Link href="/news" className="portal-link">{c.newsAll} →</Link>
      </div>
      <div className="portal-info-grid">
        {items.map((item) => (
          <NewsPreviewCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function winRateOf(wins: number, losses: number) {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
}
