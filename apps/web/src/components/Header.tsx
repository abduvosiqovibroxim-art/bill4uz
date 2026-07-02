"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { dashboardPathForRole } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";

const headerCopy: Record<
  "ru" | "uz" | "en",
  {
    profile: string;
    signIn: string;
    signOut: string;
    tournaments: string;
    players: string;
    coaches: string;
    rating: string;
    booking: string;
    navLabel: string;
  }
> = {
  ru: {
    profile: "Профиль",
    signIn: "Войти",
    signOut: "Выйти",
    tournaments: "Турниры",
    players: "Игроки",
    coaches: "Тренеры",
    rating: "Рейтинг",
    booking: "Забронировать",
    navLabel: "Основная навигация"
  },
  uz: {
    profile: "Profil",
    signIn: "Kirish",
    signOut: "Chiqish",
    tournaments: "Turnirlar",
    players: "O'yinchilar",
    coaches: "Murabbiylar",
    rating: "Reyting",
    booking: "Bron qilish",
    navLabel: "Asosiy navigatsiya"
  },
  en: {
    profile: "Profile",
    signIn: "Sign in",
    signOut: "Log out",
    tournaments: "Tournaments",
    players: "Players",
    coaches: "Coaches",
    rating: "Rating",
    booking: "Book",
    navLabel: "Primary navigation"
  }
};

type HeaderNavKey = "tournaments" | "players" | "coaches" | "rating" | "booking";

type HeaderNavItem = {
  href: string;
  key: HeaderNavKey;
  label: string;
};

function isNavActivePath(pathname: string, key: HeaderNavKey) {
  if (!pathname) {
    return false;
  }

  switch (key) {
    case "tournaments":
      return pathname === "/tournaments" || pathname.startsWith("/tournaments/");
    case "players":
      return pathname === "/players" || pathname.startsWith("/players/");
    case "coaches":
      return pathname === "/coaches" || pathname.startsWith("/coaches/");
    case "rating":
      return pathname === "/rating" || pathname === "/rankings";
    case "booking":
      return pathname === "/booking" || pathname.startsWith("/booking/");
  }
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useI18n();
  const { user, status, logout } = useAuth();
  const c = headerCopy[locale];
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const profileInitial = isAuthenticated ? resolveProfileInitial(user) : null;
  const profileHref = isAuthenticated && user ? dashboardPathForRole(user.role) : "/auth/signin";
  const navItems: HeaderNavItem[] = [
    { href: "/tournaments", key: "tournaments", label: c.tournaments },
    { href: "/players", key: "players", label: c.players },
    { href: "/coaches", key: "coaches", label: c.coaches },
    { href: "/rating", key: "rating", label: c.rating },
    { href: "/booking", key: "booking", label: c.booking }
  ];

  async function handleLogout() {
    await logout();
    router.replace("/auth/signin");
    router.refresh();
  }

  return (
    <header className="topbar site-header">
      <div className="container-shell">
        <div className="site-header-inner">
          <Link href="/" className="site-logo header-brand" aria-label="Bill4">
            <Image
              src="/brand/bill4-logo.png"
              alt="Bill4"
              width={424}
              height={374}
              priority
              className="brand-logo brand-logo-light"
            />
            <Image
              src="/brand/bill4-logo-dark.png"
              alt=""
              aria-hidden="true"
              width={424}
              height={374}
              priority
              className="brand-logo brand-logo-dark"
            />
          </Link>

          <nav className="site-nav" aria-label={c.navLabel}>
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`site-nav-link${isNavActivePath(pathname, item.key) ? " site-nav-link-active" : ""}`}
                aria-current={isNavActivePath(pathname, item.key) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-actions">
            {!isAuthenticated ? (
              <Link href={profileHref} className="header-link header-link-mobile-primary">
                {c.signIn}
              </Link>
            ) : (
              <>
                <Link
                  href={profileHref}
                  className="header-profile-circle header-link-mobile-primary"
                  aria-label={c.profile}
                  title={c.profile}
                >
                  {profileInitial ? (
                    <span className="header-profile-circle-initial" aria-hidden="true">
                      {profileInitial}
                    </span>
                  ) : (
                    <span className="header-profile-circle-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" role="presentation">
                        <path
                          d="M18.2 19.5C16.7 17.5 14.5 16.4 12 16.4C9.5 16.4 7.3 17.5 5.8 19.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="9.3" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </span>
                  )}
                </Link>
                <button type="button" className="header-link header-action-button" onClick={() => void handleLogout()}>
                  {c.signOut}
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

function resolveProfileInitial(user: unknown) {
  if (!user || typeof user !== "object" || !("firstName" in user)) {
    return null;
  }

  const firstName = (user as { firstName?: unknown }).firstName;
  if (typeof firstName !== "string") {
    return null;
  }

  const normalized = firstName.trim();
  if (!normalized) {
    return null;
  }

  return normalized[0]?.toUpperCase() ?? null;
}
