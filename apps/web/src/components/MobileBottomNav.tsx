"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { dashboardPathForRole } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const { user, status } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const profileHref = isAuthenticated && user ? dashboardPathForRole(user.role) : "/auth/signin";

  const ratingLabel = locale === "ru" ? "Рейтинг" : locale === "uz" ? "Reyting" : "Rating";
  const bookingLabel = locale === "ru" ? "Бронь" : locale === "uz" ? "Bron" : "Book";
  const profileLabel = locale === "ru" ? "Профиль" : locale === "uz" ? "Profil" : "Profile";

  const items = [
    { href: "/", label: t("nav.home"), key: "home", icon: "⌂" },
    { href: "/tournaments", label: t("nav.tournaments"), key: "tournaments", icon: "▦" },
    { href: "/rating", label: ratingLabel, key: "rating", icon: "★" },
    { href: "/booking", label: bookingLabel, key: "booking", icon: "◎" },
    { href: profileHref, label: profileLabel, key: "profile", icon: "◍" }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const isActive =
          item.key === "profile"
            ? pathname.startsWith("/dashboard") || pathname.startsWith("/account") || pathname === item.href
            : item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`mobile-bottom-link ${isActive ? "mobile-bottom-link-active" : ""}`}
          >
            <span className="mobile-bottom-icon" aria-hidden="true">{item.icon}</span>
            <span className="mobile-bottom-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
