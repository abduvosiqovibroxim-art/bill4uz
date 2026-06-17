"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { ApiError, registerApiAuthHandlers } from "@/lib/api/client";
import {
  changePasswordRequest,
  dashboardPathForRole,
  logoutRequest,
  meRequest,
  refreshSessionRequest,
  signInRequest,
  signUpRequest
} from "@/lib/auth/client";
import { useAuthStore } from "@/lib/auth/store";
import type { AuthRole, AuthStatus, AuthUser, ChangePasswordInput, SignInInput, SignUpInput } from "@/lib/auth/types";

interface AuthContextValue {
  status: AuthStatus;
  hydrated: boolean;
  user: AuthUser | null;
  signIn: (input: SignInInput) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<AuthUser>;
  changePassword: (input: ChangePasswordInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  dashboardPathForRole: (role: AuthRole) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const roleCookieName = "billard_role";
const capabilitiesCookieName = "billard_capabilities";
const roleCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

function isAuthFailure(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function syncAuthCookies(user: AuthUser | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!user) {
    document.cookie = `${roleCookieName}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${capabilitiesCookieName}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${roleCookieName}=${encodeURIComponent(user.role)}; path=/; max-age=${roleCookieMaxAgeSeconds}; SameSite=Lax`;
  const capabilities = (user.capabilities ?? []).join(",");

  if (capabilities) {
    document.cookie = `${capabilitiesCookieName}=${encodeURIComponent(capabilities)}; path=/; max-age=${roleCookieMaxAgeSeconds}; SameSite=Lax`;
  } else {
    document.cookie = `${capabilitiesCookieName}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const bootstrapStartedRef = useRef(false);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const clearSession = useAuthStore((state) => state.clearSession);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refreshSession = useCallback(async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        try {
          const session = await refreshSessionRequest();
          useAuthStore.getState().setSession(session);
          syncAuthCookies(session.user);
          return session.accessToken;
        } catch (error) {
          const state = useAuthStore.getState();

          if (isAuthFailure(error)) {
            state.clearSession();
            syncAuthCookies(null);
          } else if (state.user) {
            state.setStatus("authenticated");
            syncAuthCookies(state.user);
          } else {
            state.setStatus("anonymous");
          }

          return null;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();
    }

    return refreshPromiseRef.current;
  }, []);

  const restoreSession = useCallback(async () => {
    const state = useAuthStore.getState();

    state.setStatus("loading");

    if (state.accessToken) {
      try {
        const currentUser = await meRequest(state.accessToken);
        state.setUser(currentUser);
        state.setStatus("authenticated");
        syncAuthCookies(currentUser);
        return;
      } catch {
        // fall through to refresh flow
      }
    }

    const nextAccessToken = await refreshSession();
    if (!nextAccessToken) {
      return;
    }

    try {
      const currentUser = await meRequest(nextAccessToken);
      useAuthStore.getState().setUser(currentUser);
      useAuthStore.getState().setStatus("authenticated");
      syncAuthCookies(currentUser);
    } catch (error) {
      if (isAuthFailure(error)) {
        useAuthStore.getState().clearSession();
        syncAuthCookies(null);
      }
    }
  }, [refreshSession]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      setStatus("loading");
      try {
        const session = await signInRequest(input);
        setSession(session);
        syncAuthCookies(session.user);
        queryClient.clear();
        return session.user;
      } catch (error) {
        useAuthStore.getState().setStatus("anonymous");
        syncAuthCookies(null);
        throw error;
      }
    },
    [queryClient, setSession, setStatus]
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      setStatus("loading");
      try {
        const session = await signUpRequest(input);
        setSession(session);
        syncAuthCookies(session.user);
        queryClient.clear();
        return session.user;
      } catch (error) {
        useAuthStore.getState().setStatus("anonymous");
        syncAuthCookies(null);
        throw error;
      }
    },
    [queryClient, setSession, setStatus]
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      setStatus("loading");
      try {
        const session = await changePasswordRequest(input);
        setSession(session);
        syncAuthCookies(session.user);
        queryClient.clear();
        return session.user;
      } catch (error) {
        useAuthStore.getState().setStatus("authenticated");
        throw error;
      }
    },
    [queryClient, setSession, setStatus]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      syncAuthCookies(null);
      queryClient.clear();
    }
  }, [clearSession, queryClient]);

  useEffect(() => {
    registerApiAuthHandlers({
      getAccessToken: () => useAuthStore.getState().accessToken,
      refreshSession,
      clearSession: () => {
        useAuthStore.getState().clearSession();
        syncAuthCookies(null);
      }
    });
  }, [refreshSession]);

  useEffect(() => {
    if (!hydrated || bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;
    void restoreSession();
  }, [hydrated, restoreSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      hydrated,
      user,
      signIn,
      signUp,
      changePassword,
      logout,
      refreshSession,
      dashboardPathForRole
    }),
    [changePassword, hydrated, logout, refreshSession, signIn, signUp, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
