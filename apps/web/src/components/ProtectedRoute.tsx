"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "./DataState";
import { SectionShell } from "./ui";
import { useAuth } from "./AuthProvider";
import { canAccessDashboardRole } from "@/lib/auth/client";
import type { AuthRole } from "@/lib/auth/types";

const dashboardRoleBySegment: Record<string, AuthRole> = {
  admin: "ADMIN",
  organizer: "ORGANIZER",
  club: "CLUB",
  player: "PLAYER"
};

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hydrated, status, user, dashboardPathForRole } = useAuth();
  const requiredRole = getRequiredRole(pathname);
  const nextPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  useEffect(() => {
    if (!hydrated || status === "loading") {
      return;
    }

    if (status === "anonymous" || !user) {
      router.replace(`/auth/signin?next=${encodeURIComponent(nextPath)}&reason=auth_required`);
      return;
    }

    if (requiredRole && !canAccessDashboardRole(user, requiredRole)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [dashboardPathForRole, hydrated, nextPath, requiredRole, router, status, user]);

  if (!hydrated || status === "loading") {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  if (requiredRole && !canAccessDashboardRole(user, requiredRole)) {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  return <>{children}</>;
}

function getRequiredRole(pathname: string): AuthRole | null {
  const segment = pathname.split("/")[2];
  return segment ? dashboardRoleBySegment[segment] ?? null : null;
}
