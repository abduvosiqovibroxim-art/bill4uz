"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const ratingLabel = locale === "ru" ? "Рейтинг" : locale === "uz" ? "Reyting" : "Rating";
  const bookingLabel = locale === "ru" ? "Бронь" : locale === "uz" ? "Bron" : "Book";

  const items = [
    { href: "/", label: t("nav.home"), key: "home" },
    { href: "/tournaments", label: t("nav.tournaments"), key: "tournaments" },
    { href: "/rating", label: ratingLabel, key: "rating" },
    { href: "/booking", label: bookingLabel, key: "booking" }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link key={item.key} href={item.href} className={`mobile-bottom-link ${isActive ? "mobile-bottom-link-active" : ""}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
