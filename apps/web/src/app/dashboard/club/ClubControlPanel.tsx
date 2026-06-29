"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useI18n } from "@/lib/i18n";
import { useClubBookingsQuery, useClubTablesQuery, useMyClubQuery, useUpdateBookingStatusMutation } from "@/lib/api/hooks";
import {
  useActiveSessionsQuery,
  useAddOrderItemMutation,
  useClubMenuQuery,
  useClubStaffQuery,
  useCloseSessionMutation,
  useCloseShiftMutation,
  useCurrentShiftQuery,
  useDailyReportQuery,
  useOpenShiftMutation,
  useStartSessionMutation,
  type ActiveSession,
  type MenuCategory,
  type MenuItem,
  type PaymentMethod
} from "@/lib/api/club-ops";
import type { BookingEntry } from "@/lib/types";

const CATEGORY_LABEL: Record<MenuCategory, string> = {
  DRINKS: "Напитки",
  HOT_DRINKS: "Кафе",
  FOOD: "Еда",
  SNACKS: "Снеки",
  DESSERTS: "Десерты",
  ALCOHOL: "Алкоголь",
  HOOKAH: "Кальян",
  OTHER: "Прочее"
};

const CATEGORY_ORDER: MenuCategory[] = ["DRINKS", "HOT_DRINKS", "SNACKS", "FOOD", "DESSERTS", "ALCOHOL", "HOOKAH", "OTHER"];

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }
  return `${new Intl.NumberFormat("ru-RU").format(value)} сум`;
}

function formatClock(startedAtIso: string, now: number) {
  const elapsedSec = Math.max(0, Math.floor((now - new Date(startedAtIso).getTime()) / 1000));
  const h = Math.floor(elapsedSec / 3600);
  const m = Math.floor((elapsedSec % 3600) / 60);
  const s = elapsedSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function isVip(kind: string) {
  return kind.trim().toUpperCase() === "VIP";
}

export function ClubControlPanel() {
  const { user } = useAuth();
  const clubQuery = useMyClubQuery(Boolean(user));
  const club = clubQuery.data ?? null;
  const clubId = club?.id;

  if (clubQuery.isPending) {
    return <LoadingState />;
  }
  if (clubQuery.isError) {
    return <ErrorState onRetry={() => clubQuery.refetch()} />;
  }
  if (!club || !clubId) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--muted)" }}>
        Панель управления доступна только для аккаунта клуба.
      </div>
    );
  }

  return <PanelBody clubId={clubId} clubName={typeof club.name === "string" ? club.name : ""} club={club} />;
}

function PanelBody({ clubId, club }: { clubId: string; clubName: string; club: NonNullable<ReturnType<typeof useMyClubQuery>["data"]> }) {
  const { text } = useI18n();

  const tablesQuery = useClubTablesQuery(clubId);
  const sessionsQuery = useActiveSessionsQuery(clubId);
  const menuQuery = useClubMenuQuery(clubId);
  const staffQuery = useClubStaffQuery(clubId);
  const bookingsQuery = useClubBookingsQuery(clubId);
  const dailyQuery = useDailyReportQuery(clubId);

  const cashier = useMemo(() => {
    const staff = staffQuery.data ?? [];
    return staff.find((member) => member.role === "CASHIER" && member.isActive) ?? staff.find((member) => member.isActive) ?? null;
  }, [staffQuery.data]);

  const shiftQuery = useCurrentShiftQuery(clubId, cashier?.id, Boolean(cashier));
  const shift = shiftQuery.data ?? null;

  const startSession = useStartSessionMutation(clubId);
  const addItem = useAddOrderItemMutation(clubId);
  const closeSession = useCloseSessionMutation(clubId);
  const openShift = useOpenShiftMutation(clubId);
  const closeShift = useCloseShiftMutation(clubId);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Live ticking clock for active table timers.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sessions = sessionsQuery.data ?? [];
  const sessionByTable = useMemo(() => {
    const map = new Map<string, ActiveSession>();
    sessions.forEach((session) => map.set(session.table.id, session));
    return map;
  }, [sessions]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const tables = (tablesQuery.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const handleStart = (tableId: string) => {
    const customerName = window.prompt("Имя клиента (необязательно):") ?? undefined;
    startSession.mutate({ tableId, customerName: customerName?.trim() || undefined });
  };

  const handleClose = (session: ActiveSession, paymentMethod: PaymentMethod) => {
    const label = paymentMethod === "CASH" ? "наличными" : "картой";
    if (!window.confirm(`Закрыть ${session.table.name} и принять оплату ${label}: ${formatMoney(session.totalMinor)}?`)) {
      return;
    }
    closeSession.mutate(
      { sessionId: session.id, paymentMethod, shiftId: shift?.id },
      {
        onSuccess: (result) => {
          if (selectedSessionId === session.id) {
            setSelectedSessionId(null);
          }
          if (!result.recorded) {
            window.alert("Сессия закрыта, но не записана в кассу — нет открытой смены. Откройте смену, чтобы фиксировать выручку.");
          }
        }
      }
    );
  };

  const handleOpenShift = () => {
    if (!cashier) {
      window.alert("Не найден сотрудник-кассир. Добавьте кассира в разделе персонала.");
      return;
    }
    openShift.mutate({ staffId: cashier.id, openingCashMinor: 0 });
  };

  const handleCloseShift = () => {
    if (!shift) return;
    if (!window.confirm("Закрыть смену? Дальнейшие продажи не будут записаны до открытия новой смены.")) {
      return;
    }
    closeShift.mutate({ shiftId: shift.id, closingCashMinor: shift.totalCashMinor });
  };

  const handleAddItem = (item: MenuItem) => {
    if (!selectedSession) {
      window.alert("Сначала выберите занятый стол (кнопка «Бар» на столе).");
      return;
    }
    addItem.mutate({ sessionId: selectedSession.id, menuItemId: item.id });
  };

  const daily = dailyQuery.data?.summary ?? null;

  return (
    <div className="portal-wrap">
      <div className="portal" style={{ display: "grid", gap: "1.25rem" }}>
        {/* Header / shift bar */}
        <section
          className="rounded-xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="portal-eyebrow">Панель клуба</span>
              <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>{text(club.name)}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>Касса за сегодня</div>
                <div className="text-xl font-black" style={{ color: "var(--accent)" }}>{formatMoney(daily?.totalSalesMinor ?? 0)}</div>
              </div>
              {shift ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: "var(--surface-soft)", color: "var(--emerald)" }}>
                    ● Смена открыта
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseShift}
                    disabled={closeShift.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-bold"
                    style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
                  >
                    Закрыть смену
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenShift}
                  disabled={openShift.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-bold"
                  style={{ background: "var(--accent)", color: "var(--bg)" }}
                >
                  {openShift.isPending ? "..." : "Открыть смену"}
                </button>
              )}
            </div>
          </div>
          {shift ? (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: "var(--muted)" }}>
              <span>Наличные: <b style={{ color: "var(--text)" }}>{formatMoney(shift.totalCashMinor)}</b></span>
              <span>Карта: <b style={{ color: "var(--text)" }}>{formatMoney(shift.totalCardMinor)}</b></span>
              <span>Онлайн: <b style={{ color: "var(--text)" }}>{formatMoney(shift.totalOnlineMinor)}</b></span>
              <span>Кассир: <b style={{ color: "var(--text)" }}>{cashier?.fullName ?? "—"}</b></span>
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
              Смена закрыта. Откройте смену, чтобы выручка со столов и бара записывалась в кассу.
            </p>
          )}
        </section>

        {/* Tables grid */}
        <section>
          <h2 className="text-lg font-black mb-3" style={{ color: "var(--text)" }}>Столы</h2>
          {tablesQuery.isPending ? (
            <LoadingState />
          ) : tables.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Столы не добавлены.</p>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {tables.map((table) => {
                const session = sessionByTable.get(table.id) ?? null;
                const busy = Boolean(session);
                const selected = session && session.id === selectedSessionId;
                const vip = isVip(table.kind);
                return (
                  <article
                    key={table.id}
                    className="rounded-xl p-4 flex flex-col gap-2"
                    style={{
                      background: "var(--surface)",
                      borderLeft: `5px solid ${busy ? "var(--emerald)" : vip ? "#d5b36a" : "var(--danger)"}`,
                      border: "1px solid var(--card-border)",
                      boxShadow: selected ? "var(--shadow-glow)" : "var(--shadow-soft)",
                      outline: selected ? "2px solid var(--accent)" : "none"
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-black" style={{ color: "var(--text)" }}>
                        {vip ? "⭐ " : ""}{table.name}
                      </h3>
                      <span className="text-xs font-bold" style={{ color: busy ? "var(--emerald)" : "var(--muted)" }}>
                        {busy ? "🟢 Играют" : "🔴 Свободен"}
                      </span>
                    </div>

                    {session ? (
                      <>
                        <div className="font-mono text-2xl font-black" style={{ color: "var(--text)" }}>
                          {formatClock(session.startedAt, now)}
                        </div>
                        {session.customerName ? (
                          <div className="text-xs" style={{ color: "var(--muted)" }}>{session.customerName}</div>
                        ) : null}
                        <div className="text-sm" style={{ color: "var(--muted)" }}>
                          Время: <b style={{ color: "var(--text)" }}>{formatMoney(session.timePriceMinor)}</b>
                          {!session.pricingConfigured ? <span title="Тариф клуба не настроен"> ⚠️</span> : null}
                        </div>
                        <div className="text-sm" style={{ color: "var(--muted)" }}>
                          Бар: <b style={{ color: "var(--text)" }}>{formatMoney(session.barTotalMinor)}</b>
                        </div>
                        <div className="text-base font-black" style={{ color: "var(--accent)" }}>
                          Итого: {formatMoney(session.totalMinor)}
                        </div>
                        {session.order && session.order.items.length > 0 ? (
                          <ul className="text-xs" style={{ color: "var(--muted)" }}>
                            {session.order.items.map((line) => (
                              <li key={line.id}>{line.name} ×{line.quantity}</li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSessionId(selected ? null : session.id)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-bold"
                            style={selected
                              ? { background: "var(--accent)", color: "var(--bg)" }
                              : { border: "1px solid var(--accent)", color: "var(--accent)" }}
                          >
                            {selected ? "Выбран ✓" : "🍹 Бар"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClose(session, "CASH")}
                            disabled={closeSession.isPending}
                            className="px-3 py-2 rounded-lg text-sm font-bold"
                            style={{ background: "var(--emerald)", color: "var(--bg)" }}
                          >
                            💵
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClose(session, "CARD")}
                            disabled={closeSession.isPending}
                            className="px-3 py-2 rounded-lg text-sm font-bold"
                            style={{ border: "1px solid var(--card-border)", color: "var(--text)" }}
                          >
                            💳
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStart(table.id)}
                        disabled={startSession.isPending}
                        className="mt-1 px-3 py-2.5 rounded-lg text-sm font-black"
                        style={{ background: "var(--accent)", color: "var(--bg)" }}
                      >
                        ▶ Старт
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bar POS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black" style={{ color: "var(--text)" }}>Бар</h2>
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {selectedSession ? `Заказ на: ${selectedSession.table.name}` : "Выберите занятый стол"}
            </span>
          </div>
          <MenuBoard menu={menuQuery.data ?? []} loading={menuQuery.isPending} disabled={!selectedSession || addItem.isPending} onPick={handleAddItem} />
        </section>

        {/* Bookings */}
        <section>
          <h2 className="text-lg font-black mb-3" style={{ color: "var(--text)" }}>Брони</h2>
          <BookingsList clubId={clubId} bookings={bookingsQuery.data ?? []} loading={bookingsQuery.isPending} />
        </section>
      </div>
    </div>
  );
}

function MenuBoard({
  menu,
  loading,
  disabled,
  onPick
}: {
  menu: MenuItem[];
  loading: boolean;
  disabled: boolean;
  onPick: (item: MenuItem) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<MenuCategory, MenuItem[]>();
    menu.filter((item) => item.isAvailable).forEach((item) => {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    });
    return CATEGORY_ORDER.filter((category) => map.has(category)).map((category) => ({
      category,
      items: (map.get(category) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
    }));
  }, [menu]);

  if (loading) {
    return <LoadingState />;
  }
  if (menu.length === 0) {
    return <p style={{ color: "var(--muted)" }}>Меню пустое. Добавьте позиции бара.</p>;
  }

  return (
    <div className="grid gap-4">
      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-black uppercase mb-2" style={{ color: "var(--muted)" }}>{CATEGORY_LABEL[group.category]}</h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onPick(item)}
                className="rounded-lg px-3 py-2 text-left transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--card-border)",
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "not-allowed" : "pointer"
                }}
              >
                <div className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{item.name}</div>
                <div className="text-xs" style={{ color: "var(--accent)" }}>{formatMoney(item.priceMinor)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активна",
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  CANCELLED: "Отменена",
  FINISHED: "Завершена",
  COMPLETED: "Завершена",
  NO_SHOW: "Не пришёл"
};

function BookingsList({ clubId, bookings, loading }: { clubId: string; bookings: BookingEntry[]; loading: boolean }) {
  const updateStatus = useUpdateBookingStatusMutation(clubId);

  const sorted = useMemo(
    () => bookings.slice().sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [bookings]
  );

  if (loading) {
    return <LoadingState />;
  }
  if (sorted.length === 0) {
    return <p style={{ color: "var(--muted)" }}>Броней пока нет.</p>;
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="grid gap-2">
      {sorted.slice(0, 20).map((booking) => {
        const active = booking.status === "PENDING" || booking.status === "CONFIRMED" || booking.status === "ACTIVE";
        return (
          <article
            key={booking.id}
            className="rounded-lg p-3 flex flex-wrap items-center justify-between gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}
          >
            <div>
              <div className="font-bold" style={{ color: "var(--text)" }}>
                {booking.table.name}
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--muted)" }}>
                  {fmtTime(booking.startAt)} · {booking.durationMinutes} мин
                </span>
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {(booking.player?.fullName ?? booking.user.phone ?? booking.user.email)} · {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
                {typeof booking.priceMinor === "number" ? ` · ${formatMoney(booking.priceMinor)}` : ""}
              </div>
            </div>
            {active ? (
              <div className="flex gap-2">
                {booking.status !== "CONFIRMED" ? (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ bookingId: booking.id, input: { status: "CONFIRMED" } })}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: "var(--accent)", color: "var(--bg)" }}
                  >
                    Подтвердить
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ bookingId: booking.id, input: { status: "FINISHED" } })}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: "var(--emerald)", color: "var(--bg)" }}
                  >
                    Завершить
                  </button>
                )}
                <button
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ bookingId: booking.id, input: { status: "CANCELLED" } })}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}
                >
                  Отменить
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
