"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthSession, AuthStatus, AuthUser } from "./types";

interface AuthState {
  status: AuthStatus;
  hydrated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setHydrated: (hydrated: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: "loading",
      hydrated: false,
      accessToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          user: session.user,
          status: "authenticated"
        }),
      setUser: (user) => set({ user }),
      setStatus: (status) => set({ status }),
      setHydrated: (hydrated) => set({ hydrated }),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
          status: "anonymous"
        })
    }),
    {
      name: "billard-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
