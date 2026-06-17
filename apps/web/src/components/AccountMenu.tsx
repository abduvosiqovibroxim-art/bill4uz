"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hasCapability } from "@/lib/auth/client";
import { usePlayersQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";

function initialsFromName(value: string | null | undefined) {
  const parts = (value ?? "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "AI";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function nameFromEmail(email: string) {
  return email.split("@")[0]?.trim() || email;
}

export function AccountMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, dashboardPathForRole } = useAuth();
  const playersQuery = usePlayersQuery();
  const currentPlayer = useMemo(
    () => (playersQuery.data ?? []).find((player) => player.userId === user?.id) ?? null,
    [playersQuery.data, user?.id]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const displayName = currentPlayer?.fullName || nameFromEmail(user.email) || t("account.defaultName");
  const contactLine = user.phone ?? user.email;
  const initials = initialsFromName(currentPlayer?.fullName || user.email || user.phone);
  const dashboardHref = dashboardPathForRole(user.role);
  const profileHref = user.role === "PLAYER" && currentPlayer ? `/players/${currentPlayer.id}` : "/auth/change-password";
  const dashboardLabel = dashboardMenuLabel(user.role, t);
  const canOpenAdminPanel = hasCapability(user, "ADMIN_PANEL");
  const canOpenPlayerView = hasCapability(user, "PLAYER_VIEW");

  async function handleLogout() {
    await logout();
    setIsOpen(false);
    router.replace("/auth/signin");
    router.refresh();
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className="account-menu-root">
      {isOpen ? (
        <button
          type="button"
          className="account-overlay"
          onClick={handleClose}
          aria-label={t("account.closeLabel")}
        />
      ) : null}

      <button
        type="button"
        className={`account-button ${isOpen ? "account-button-open" : ""}`.trim()}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("account.panelLabel")}
      >
        <span className="account-avatar">{initials}</span>
      </button>

      {isOpen ? (
        <div className="account-panel account-panel-menu" role="menu" aria-label={t("account.panelLabel")}>
          <div className="account-menu-summary">
            <div className="account-avatar account-avatar-large">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="account-menu-name">{displayName}</p>
              <p className="account-menu-meta">{contactLine}</p>
            </div>
            <span className="pill account-role-pill">{dashboardLabel}</span>
          </div>

          <div className="account-menu-links">
            {canOpenPlayerView ? (
              <Link href={currentPlayer ? `/players/${currentPlayer.id}` : "/dashboard"} className="account-menu-link" role="menuitem" onClick={handleClose}>
                <span className="account-menu-link-title">Профиль игрока</span>
                <span className="account-menu-link-meta">{currentPlayer ? `/players/${currentPlayer.id}` : "/dashboard"}</span>
              </Link>
            ) : (
              <Link href={profileHref} className="account-menu-link" role="menuitem" onClick={handleClose}>
                <span className="account-menu-link-title">{t("account.actions.profile")}</span>
                <span className="account-menu-link-meta">{profileHref}</span>
              </Link>
            )}

            {canOpenAdminPanel ? (
              <Link href="/dashboard/admin" className="account-menu-link" role="menuitem" onClick={handleClose}>
                <span className="account-menu-link-title">Админ-панель</span>
                <span className="account-menu-link-meta">/dashboard/admin</span>
              </Link>
            ) : (
              <Link href={dashboardHref} className="account-menu-link" role="menuitem" onClick={handleClose}>
                <span className="account-menu-link-title">{dashboardLabel}</span>
                <span className="account-menu-link-meta">{dashboardHref}</span>
              </Link>
            )}

            <Link href="/dashboard/telegram" className="account-menu-link" role="menuitem" onClick={handleClose}>
              <span className="account-menu-link-title">Telegram</span>
              <span className="account-menu-link-meta">/dashboard/telegram</span>
            </Link>

            <button
              type="button"
              className="account-menu-link account-menu-link-button"
              role="menuitem"
              onClick={() => void handleLogout()}
            >
              <span className="account-menu-link-title">{t("account.actions.logout")}</span>
              <span className="account-menu-link-meta">{user.email}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function dashboardMenuLabel(role: "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN", t: (path: string) => string) {
  switch (role) {
    case "ADMIN":
      return t("dashboard.admin.title");
    case "ORGANIZER":
      return t("dashboard.organizer.title");
    case "CLUB":
      return "Booking";
    default:
      return t("dashboard.player.title");
  }
}
