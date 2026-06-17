"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LoadingState } from "@/components/DataState";
import { availableDashboardRoles, dashboardPathForRole } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";
import type { AuthRole } from "@/lib/auth/types";

type AccountCopy = {
  title: string;
  subtitle: string;
  signIn: string;
  loading: string;
};

const copy: Record<"ru" | "uz" | "en", AccountCopy> = {
  ru: {
    title: "Выберите кабинет",
    subtitle: "Доступные разделы вашего аккаунта",
    signIn: "Войти",
    loading: "Загрузка..."
  },
  uz: {
    title: "Kabinetni tanlang",
    subtitle: "Hisobingizdagi mavjud bo'limlar",
    signIn: "Kirish",
    loading: "Yuklanmoqda..."
  },
  en: {
    title: "Choose dashboard",
    subtitle: "Available sections for your account",
    signIn: "Sign in",
    loading: "Loading..."
  }
};

export default function AccountPage() {
  const { locale, t } = useI18n();
  const c = copy[locale];
  const router = useRouter();
  const { user, status } = useAuth();

  const roles = availableDashboardRoles(user);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/auth/signin?next=%2Faccount");
      return;
    }

    if (status === "authenticated" && user && roles.length <= 1) {
      router.replace(dashboardPathForRole(roles[0] ?? user.role));
    }
  }, [roles, router, status, user]);

  if (status === "loading") {
    return <LoadingState label={c.loading} />;
  }

  if (status === "anonymous" || !user) {
    return (
      <div className="page-shell">
        <section className="page-header-card">
          <h1 className="section-title">{c.title}</h1>
          <p className="page-subtitle">{c.subtitle}</p>
          <Link href="/auth/signin?next=%2Faccount" className="button-primary mt-3 inline-flex">
            {c.signIn}
          </Link>
        </section>
      </div>
    );
  }

  if (roles.length <= 1) {
    return <LoadingState label={c.loading} />;
  }

  return (
    <div className="page-shell">
      <section className="page-header-card">
        <h1 className="section-title">{c.title}</h1>
        <p className="page-subtitle">{c.subtitle}</p>
      </section>

      <section className="entity-grid">
        {roles.map((role) => (
          <article key={role} className="entity-card">
            <h2 className="text-lg font-semibold text-white">{roleLabel(role, t)}</h2>
            <p className="mt-1 text-sm text-muted">{dashboardPathForRole(role)}</p>
            <Link href={dashboardPathForRole(role)} className="button-secondary mt-3">
              {t("common.open")}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

function roleLabel(role: AuthRole, t: (path: string) => string) {
  if (role === "ADMIN") return t("dashboard.admin.title");
  if (role === "ORGANIZER") return t("dashboard.organizer.title");
  if (role === "CLUB") return t("dashboard.club.title");
  return t("dashboard.player.title");
}
