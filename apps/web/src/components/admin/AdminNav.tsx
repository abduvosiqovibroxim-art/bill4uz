"use client";

import { DashboardNav } from "@/components/dashboard/DashboardKit";
import { useI18n } from "@/lib/i18n";

const adminItems = [
  { href: "/dashboard/admin", labelKey: "admin.nav.overview" },
  { href: "/dashboard/admin/tournaments", labelKey: "admin.nav.tournaments" },
  { href: "/dashboard/admin/news", labelKey: "admin.nav.news" },
  { href: "/dashboard/admin/clubs", labelKey: "admin.nav.clubs" },
  { href: "/dashboard/admin/users", labelKey: "admin.nav.users" },
  { href: "/dashboard/admin/applications", labelKey: "admin.nav.applications" }
] as const;

export function AdminNav() {
  const { t } = useI18n();

  return <DashboardNav items={adminItems.map((item) => ({ href: item.href, label: t(item.labelKey) }))} />;
}
