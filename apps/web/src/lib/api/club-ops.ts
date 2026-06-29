"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "./client";

export type MenuCategory =
  | "DRINKS"
  | "HOT_DRINKS"
  | "FOOD"
  | "SNACKS"
  | "DESSERTS"
  | "ALCOHOL"
  | "HOOKAH"
  | "OTHER";

export type PaymentMethod = "CASH" | "CARD" | "ONLINE" | "TERMINAL" | "TRANSFER";

export interface MenuItem {
  id: string;
  clubId: string;
  name: string;
  nameEn: string | null;
  nameUz: string | null;
  category: MenuCategory;
  priceMinor: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface SessionOrderItem {
  id: string;
  name: string;
  quantity: number;
  priceMinor: number;
  lineTotalMinor: number;
}

export interface SessionOrder {
  id: string;
  orderNumber: number;
  totalMinor: number;
  items: SessionOrderItem[];
}

export interface ActiveSession {
  id: string;
  status: "ACTIVE" | "PAUSED" | "FINISHED" | "CANCELLED";
  startedAt: string;
  customerName: string | null;
  elapsedMinutes: number;
  timePriceMinor: number;
  barTotalMinor: number;
  totalMinor: number;
  pricingConfigured: boolean;
  table: { id: string; name: string; kind: string };
  order: SessionOrder | null;
}

export interface CloseSessionResult {
  minutes: number;
  timePriceMinor: number;
  barTotalMinor: number;
  totalMinor: number;
  paymentMethod: PaymentMethod;
  recorded: boolean;
  pricingConfigured: boolean;
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: string;
  phone: string | null;
  isActive: boolean;
}

export interface ShiftInfo {
  id: string;
  status: "OPEN" | "CLOSED" | "SUSPENDED";
  startedAt: string;
  endedAt: string | null;
  openingCashMinor: number | null;
  closingCashMinor: number | null;
  totalSalesMinor: number;
  totalCashMinor: number;
  totalCardMinor: number;
  totalOnlineMinor: number;
  staff?: { id: string; fullName: string; role: string };
}

export interface DailyReport {
  date: string;
  summary: {
    totalSalesMinor: number;
    totalCashMinor: number;
    totalCardMinor: number;
    totalOnlineMinor: number;
    shiftsCount: number;
  };
  shifts: ShiftInfo[];
}

const keys = {
  menu: (clubId: string) => ["club-ops", "menu", clubId] as const,
  sessions: (clubId: string) => ["club-ops", "sessions", clubId] as const,
  staff: (clubId: string) => ["club-ops", "staff", clubId] as const,
  shift: (clubId: string) => ["club-ops", "shift", clubId] as const,
  daily: (clubId: string) => ["club-ops", "daily", clubId] as const
};

function postJson<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
}

// === Queries ===

export function useClubMenuQuery(clubId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.menu(clubId ?? ""),
    queryFn: () => apiFetch<MenuItem[]>(`/clubs/${clubId}/menu`),
    enabled: enabled && Boolean(clubId)
  });
}

export function useActiveSessionsQuery(clubId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.sessions(clubId ?? ""),
    queryFn: () => apiFetch<ActiveSession[]>(`/clubs/${clubId}/sessions/active`),
    enabled: enabled && Boolean(clubId),
    refetchInterval: 20_000
  });
}

export function useClubStaffQuery(clubId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.staff(clubId ?? ""),
    queryFn: () => apiFetch<StaffMember[]>(`/clubs/${clubId}/staff`),
    enabled: enabled && Boolean(clubId)
  });
}

export function useDailyReportQuery(clubId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.daily(clubId ?? ""),
    queryFn: () => apiFetch<DailyReport>(`/clubs/${clubId}/cashier/reports/daily`),
    enabled: enabled && Boolean(clubId),
    refetchInterval: 30_000
  });
}

export function useCurrentShiftQuery(clubId: string | undefined, staffId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...keys.shift(clubId ?? ""), staffId ?? ""] as const,
    queryFn: async (): Promise<ShiftInfo | null> => {
      try {
        return await apiFetch<ShiftInfo>(`/clubs/${clubId}/cashier/shifts/current`, { query: { staffId } });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && Boolean(clubId) && Boolean(staffId),
    refetchInterval: 30_000
  });
}

// === Mutations ===

export function useStartSessionMutation(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tableId: string; customerName?: string }) =>
      postJson<ActiveSession>(`/clubs/${clubId}/tables/${input.tableId}/session`, {
        customerName: input.customerName
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sessions(clubId) });
    }
  });
}

export function useAddOrderItemMutation(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sessionId: string; menuItemId: string; quantity?: number }) =>
      postJson<SessionOrder>(`/clubs/${clubId}/sessions/${input.sessionId}/order-items`, {
        menuItemId: input.menuItemId,
        quantity: input.quantity ?? 1
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sessions(clubId) });
    }
  });
}

export function useCloseSessionMutation(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sessionId: string; paymentMethod: PaymentMethod; shiftId?: string }) =>
      postJson<CloseSessionResult>(`/clubs/${clubId}/sessions/${input.sessionId}/close`, {
        paymentMethod: input.paymentMethod,
        shiftId: input.shiftId
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sessions(clubId) });
      void queryClient.invalidateQueries({ queryKey: keys.daily(clubId) });
      void queryClient.invalidateQueries({ queryKey: keys.shift(clubId) });
    }
  });
}

export function useOpenShiftMutation(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { staffId: string; openingCashMinor?: number }) =>
      postJson<ShiftInfo>(`/clubs/${clubId}/cashier/shifts/open`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.shift(clubId) });
      void queryClient.invalidateQueries({ queryKey: keys.daily(clubId) });
    }
  });
}

export function useCloseShiftMutation(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shiftId: string; closingCashMinor?: number }) =>
      postJson<ShiftInfo>(`/clubs/${clubId}/cashier/shifts/${input.shiftId}/close`, {
        closingCashMinor: input.closingCashMinor
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.shift(clubId) });
      void queryClient.invalidateQueries({ queryKey: keys.daily(clubId) });
    }
  });
}
