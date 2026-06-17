"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useAdminBookingsQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";

type BookingCopy = {
  title: string;
  subtitle: string;
  empty: string;
  club: string;
  table: string;
  player: string;
  period: string;
  status: string;
  amount: string;
};

const copy: Record<"ru" | "uz" | "en", BookingCopy> = {
  ru: {
    title: "Брони",
    subtitle: "Все реальные брони по клубам",
    empty: "Брони пока не найдены",
    club: "Клуб",
    table: "Стол",
    player: "Игрок",
    period: "Время",
    status: "Статус",
    amount: "Сумма"
  },
  uz: {
    title: "Bronlar",
    subtitle: "Klublar bo'yicha barcha haqiqiy bronlar",
    empty: "Hozircha bronlar topilmadi",
    club: "Klub",
    table: "Stol",
    player: "O'yinchi",
    period: "Vaqt",
    status: "Holat",
    amount: "Summa"
  },
  en: {
    title: "Bookings",
    subtitle: "All real bookings across clubs",
    empty: "No bookings found yet",
    club: "Club",
    table: "Table",
    player: "Player",
    period: "Time",
    status: "Status",
    amount: "Amount"
  }
};

export default function AdminBookingsPage() {
  const { locale } = useI18n();
  const c = copy[locale];
  const bookingsQuery = useAdminBookingsQuery();

  if (bookingsQuery.isPending) {
    return <LoadingState label={c.title} />;
  }

  if (bookingsQuery.isError) {
    return <ErrorState onRetry={() => bookingsQuery.refetch()} />;
  }

  const bookings = bookingsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <section className="page-header-card">
        <h1 className="section-title">{c.title}</h1>
        <p className="page-subtitle">{c.subtitle}</p>
      </section>

      {bookings.length === 0 ? (
        <EmptyState message={c.empty} />
      ) : (
        <section className="entity-grid">
          {bookings.map((booking) => (
            <article key={booking.id} className="entity-card">
              <div className="entity-meta-grid sm:grid-cols-2">
                <MetaCell label={c.club} value={booking.club.name} />
                <MetaCell label={c.table} value={`${booking.table.name}${booking.table.kind === "VIP" ? " VIP" : ""}`} />
                <MetaCell label={c.player} value={booking.player?.fullName ?? booking.user.phone ?? booking.user.email} />
                <MetaCell label={c.status} value={statusLabel(booking.status, locale)} />
                <MetaCell label={c.period} value={formatDateRange(booking.startAt, booking.endAt, locale)} />
                <MetaCell label={c.amount} value={formatMoney(booking.priceMinor)} />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="entity-meta-cell">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDateRange(startAt: string, endAt: string, locale: "ru" | "uz" | "en") {
  const formatLocale = locale === "en" ? "en-US" : "ru-RU";
  const start = new Date(startAt).toLocaleString(formatLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const end = new Date(endAt).toLocaleTimeString(formatLocale, { hour: "2-digit", minute: "2-digit" });
  return `${start} - ${end}`;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${new Intl.NumberFormat("ru-RU").format(value)} UZS`;
}

function statusLabel(status: string, locale: "ru" | "uz" | "en") {
  const labels: Record<string, Record<"ru" | "uz" | "en", string>> = {
    CONFIRMED: { ru: "Подтверждено", uz: "Tasdiqlangan", en: "Confirmed" },
    CANCELLED: { ru: "Отменено", uz: "Bekor qilingan", en: "Cancelled" },
    FINISHED: { ru: "Завершено", uz: "Tugagan", en: "Finished" },
    ACTIVE: { ru: "Подтверждено", uz: "Tasdiqlangan", en: "Confirmed" },
    PENDING: { ru: "Подтверждено", uz: "Tasdiqlangan", en: "Confirmed" },
    COMPLETED: { ru: "Завершено", uz: "Tugagan", en: "Finished" },
    NO_SHOW: { ru: "Завершено", uz: "Tugagan", en: "Finished" }
  };
  return labels[status]?.[locale] ?? status;
}
