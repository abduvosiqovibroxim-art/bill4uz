"use client";

import { ApiError, buildApiUrl } from "@/lib/api/client";
import type {
  AuthActionResult,
  AuthRole,
  AuthSession,
  AuthUser,
  ChangePasswordInput,
  SignInInput,
  SignUpInput
} from "./types";

export type SocialAuthProvider = "google" | "apple" | "facebook";

export function dashboardPathForRole(role: AuthRole) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "ORGANIZER":
      return "/dashboard/organizer";
    case "CLUB":
      return "/booking";
    default:
      return "/dashboard";
  }
}

export const DASHBOARD_ROLE_ORDER: AuthRole[] = ["PLAYER", "ORGANIZER", "ADMIN"];

export function hasCapability(user: AuthUser | null | undefined, capability: NonNullable<AuthUser["capabilities"]>[number]) {
  return Boolean(user?.capabilities?.includes(capability));
}

export function canAccessDashboardRole(user: AuthUser | null | undefined, role: AuthRole) {
  if (!user) {
    return false;
  }

  if (user.role === role) {
    if (role === "CLUB") {
      return false;
    }
    return true;
  }

  if (role === "ADMIN" && hasCapability(user, "ADMIN_PANEL")) {
    return true;
  }

  if (role === "PLAYER" && hasCapability(user, "PLAYER_VIEW")) {
    return true;
  }

  return false;
}

export function availableDashboardRoles(user: AuthUser | null | undefined): AuthRole[] {
  if (!user) {
    return [];
  }

  return DASHBOARD_ROLE_ORDER.filter((role) => canAccessDashboardRole(user, role));
}

export function profilePathForUser(user: AuthUser | null | undefined) {
  if (!user) {
    return null;
  }

  const roles = availableDashboardRoles(user);

  if (roles.length <= 1) {
    return dashboardPathForRole(roles[0] ?? user.role);
  }

  return "/account";
}

export function dashboardLabelForRole(role: AuthRole) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "ORGANIZER":
      return "Organizer";
    case "CLUB":
      return "Club";
    default:
      return "Player";
  }
}

const dashboardRoleBySegment: Record<string, AuthRole> = {
  admin: "ADMIN",
  organizer: "ORGANIZER",
  club: "CLUB",
  player: "PLAYER"
};

export function resolvePostAuthPath(user: AuthUser, nextPath: string | null | undefined) {
  const fallback = dashboardPathForRole(user.role);
  const safePath = normalizeInternalPath(nextPath);

  if (!safePath || safePath.startsWith("/auth")) {
    return fallback;
  }

  const requiredRole = requiredDashboardRoleForPath(safePath);
  const isDashboardPath = safePath === "/dashboard" || safePath.startsWith("/dashboard/");

  if (isDashboardPath && !requiredRole) {
    return fallback;
  }

  if (requiredRole && !canAccessDashboardRole(user, requiredRole)) {
    return fallback;
  }

  return safePath;
}

function requiredDashboardRoleForPath(pathname: string): AuthRole | null {
  const [, dashboardSegment, roleSegment] = pathname.split("/");
  if (dashboardSegment !== "dashboard" || !roleSegment) {
    return null;
  }

  return dashboardRoleBySegment[roleSegment] ?? null;
}

function normalizeInternalPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return null;
  }

  const value = nextPath.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.includes("\n") || value.includes("\r")) {
    return null;
  }

  return value;
}

export async function signInRequest(input: SignInInput): Promise<AuthSession> {
  return authRequest<AuthSession>("/auth/signin", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function signUpRequest(input: SignUpInput): Promise<AuthSession> {
  return authRequest<AuthSession>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function verifyEmailRequest(token: string): Promise<AuthSession> {
  return authRequest<AuthSession>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function resendVerificationRequest(email: string): Promise<AuthActionResult> {
  return authRequest<AuthActionResult>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function forgotPasswordRequest(email: string): Promise<AuthActionResult> {
  return authRequest<AuthActionResult>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPasswordRequest(token: string, password: string): Promise<{ success: boolean }> {
  return authRequest<{ success: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
}

export async function changePasswordRequest(input: ChangePasswordInput): Promise<AuthSession> {
  return authRequest<AuthSession>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function refreshSessionRequest(): Promise<AuthSession> {
  return authRequest<AuthSession>("/auth/refresh", {
    method: "POST"
  });
}

export async function logoutRequest(): Promise<{ success: boolean }> {
  return authRequest<{ success: boolean }>("/auth/logout", {
    method: "POST"
  });
}

export async function meRequest(accessToken: string): Promise<AuthUser> {
  return authRequest<AuthUser>("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getSocialAuthStartUrl(provider: SocialAuthProvider, next?: string | null) {
  const url = new URL(buildApiUrl(`/auth/oauth/${provider}/start`));

  if (next) {
    url.searchParams.set("next", next);
  }

  return url.toString();
}

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });

  const rawBody = await response.text();
  const payload = rawBody ? safeParse(rawBody) : null;

  if (!response.ok) {
    throw new ApiError("Authentication request failed.", response.status, payload);
  }

  return payload as T;
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
