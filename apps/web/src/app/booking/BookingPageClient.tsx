"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClubMap } from "@/components/ClubMap";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useAuth } from "@/components/AuthProvider";
import {
  useClubBookingSlotsQuery,
  useClubsQuery,
  useCreateBookingMutation,
  useImportClubsFromMapAdminMutation
} from "@/lib/api/hooks";
import { getApiPayloadMessage, getUserFacingApiError } from "@/lib/api/errors";
import { phoneHref, routeHref, splitPhones, telegramHref } from "@/lib/clubContact";
import { useI18n } from "@/lib/i18n";
import type { BookingEntry, Club, LocalizedText } from "@/lib/types";

const copy = {
  ru: {
    title: "Забронировать",
    empty: "Бильярдные пока не добавлены",
    importMap: "Обновить с карты",
    importResult: "Добавлено {added}, обновлено {updated}, пропущено {skipped}",
    call: "Позвонить",
    write: "Написать",
    route: "Маршрут",
    open: "Открыть место",
    onMap: "На карте",
    openNow: "Открыто",
    closedNow: "Закрыто",
    unknownStatus: "График не указан",
    phone: "Телефон",
    address: "Адрес",
    telegram: "Telegram",
    workingHours: "Рабочее время",
    phoneMissing: "Телефон не указан",
    tables: "Столы",
    book: "Забронировать стол",
    bookCta: "Забронировать",
    loginToBook: "Войдите, чтобы забронировать стол",
    login: "Войти",
    date: "Дата",
    duration: "Длительность",
    chooseTime: "Свободное время",
    noSlots: "На эту дату нет свободных слотов",
    selectSlot: "Выберите время",
    note: "Комментарий (необязательно)",
    notePlaceholder: "Например: нужен хороший кий",
    total: "К оплате в клубе",
    confirm: "Подтвердить бронь",
    booking: "Бронируем…",
    success: "Стол забронирован!",
    successMsg: "Покажите номер брони администратору клуба при входе.",
    bookingNumber: "Номер брони",
    myBookings: "Мои брони",
    close: "Закрыть",
    currency: "сум",
    hourShort: "ч"
  },
  uz: {
    title: "Bron qilish",
    empty: "Bilyard zallari hali qo'shilmagan",
    importMap: "Xaritadan yangilash",
    importResult: "Qo'shildi {added}, yangilandi {updated}, o'tkazib yuborildi {skipped}",
    call: "Qo'ng'iroq",
    write: "Yozish",
    route: "Yo'nalish",
    open: "Joyni ochish",
    onMap: "Xaritada",
    openNow: "Ochiq",
    closedNow: "Yopiq",
    unknownStatus: "Ish vaqti kiritilmagan",
    phone: "Telefon",
    address: "Manzil",
    telegram: "Telegram",
    workingHours: "Ish vaqti",
    phoneMissing: "Telefon kiritilmagan",
    tables: "Stollar",
    book: "Stol bron qilish",
    bookCta: "Bron qilish",
    loginToBook: "Stol bron qilish uchun tizimga kiring",
    login: "Kirish",
    date: "Sana",
    duration: "Davomiyligi",
    chooseTime: "Bo'sh vaqt",
    noSlots: "Bu sanada bo'sh vaqt yo'q",
    selectSlot: "Vaqtni tanlang",
    note: "Izoh (ixtiyoriy)",
    notePlaceholder: "Masalan: yaxshi kiy kerak",
    total: "Klubda to'lov",
    confirm: "Bronni tasdiqlash",
    booking: "Bron qilinmoqda…",
    success: "Stol bron qilindi!",
    successMsg: "Kirishda bron raqamini klub ma'muriga ko'rsating.",
    bookingNumber: "Bron raqami",
    myBookings: "Mening bronlarim",
    close: "Yopish",
    currency: "so'm",
    hourShort: "soat"
  },
  en: {
    title: "Book",
    empty: "No billiard venues added yet",
    importMap: "Update from map",
    importResult: "Added {added}, updated {updated}, skipped {skipped}",
    call: "Call",
    write: "Message",
    route: "Route",
    open: "Open place",
    onMap: "On map",
    openNow: "Open",
    closedNow: "Closed",
    unknownStatus: "Hours not set",
    phone: "Phone",
    address: "Address",
    telegram: "Telegram",
    workingHours: "Working hours",
    phoneMissing: "Phone not specified",
    tables: "Tables",
    book: "Book a table",
    bookCta: "Book",
    loginToBook: "Sign in to book a table",
    login: "Sign in",
    date: "Date",
    duration: "Duration",
    chooseTime: "Available time",
    noSlots: "No free slots for this date",
    selectSlot: "Select a time",
    note: "Note (optional)",
    notePlaceholder: "e.g. need a good cue",
    total: "Pay at the club",
    confirm: "Confirm booking",
    booking: "Booking…",
    success: "Table booked!",
    successMsg: "Show the booking number to the club admin on arrival.",
    bookingNumber: "Booking number",
    myBookings: "My bookings",
    close: "Close",
    currency: "UZS",
    hourShort: "h"
  }
} as const;

type BookingLabels = { [K in keyof (typeof copy)["ru"]]: string };
type TextFn = (input: string | LocalizedText | null | undefined) => string;
type Locale = keyof typeof copy;

const DURATION_OPTIONS = [60, 90, 120, 180] as const;

type SelectedSlot = {
  tableId: string;
  tableName: string;
  startAt: string;
  endAt: string;
  priceMinor: number | null;
};

function localeTag(locale: Locale) {
  return locale === "en" ? "en-GB" : "ru-RU";
}

function tashkentToday() {
  // en-CA yields YYYY-MM-DD, which is what <input type="date"> expects.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function formatSlotTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleTimeString(localeTag(locale), {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatMoney(value: number | null | undefined, currency: string) {
  if (typeof value !== "number") {
    return "—";
  }
  return `${new Intl.NumberFormat("ru-RU").format(value)} ${currency}`;
}

function formatDuration(minutes: number, hourShort: string) {
  const hours = minutes / 60;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${text} ${hourShort}`;
}

function makeRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function BookingPageClient() {
  const { locale, t, text } = useI18n();
  const { user } = useAuth();
  const clubsQuery = useClubsQuery();
  const importMutation = useImportClubsFromMapAdminMutation();
  const clubs = clubsQuery.data ?? [];
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bookingClub, setBookingClub] = useState<Club | null>(null);
  const c = copy[locale];

  useEffect(() => {
    if (!selectedClubId && clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) ?? clubs[0] ?? null,
    [clubs, selectedClubId]
  );

  if (clubsQuery.isPending) {
    return <LoadingState />;
  }

  if (clubsQuery.isError) {
    return <ErrorState onRetry={() => clubsQuery.refetch()} />;
  }

  const runImport = () =>
    void (async () => {
      setFeedback(null);
      try {
        const result = await importMutation.mutateAsync();
        setFeedback(formatImportResult(c, result));
        void clubsQuery.refetch();
      } catch (error) {
        setFeedback(
          getApiPayloadMessage(error instanceof Error && "payload" in error ? (error as { payload: unknown }).payload : null) ??
            getUserFacingApiError(error, { locale, t, debugLabel: "booking-import-clubs-map" })
        );
      }
    })();

  return (
    <div className="portal-wrap">
      <div className="portal">
      {/* Compact hero */}
      <section className="portal-hero portal-hero-solo" style={{ padding: "clamp(1.2rem, 3vw, 2rem)" }}>
        <div className="portal-hero-copy">
          <span className="portal-eyebrow">{c.title}</span>
          <h1 className="portal-hero-title" style={{ fontSize: "clamp(1.8rem, 1.2rem + 2.4vw, 2.6rem)" }}>{c.title}</h1>
          <p className="portal-hero-lead">
            {locale === "ru" ? "Найдите бильярдную рядом с вами — адреса, телефоны и маршруты на карте." : locale === "uz" ? "Yaqinroq bilyard joyini toping — manzil, telefon va yo'nalishlar xaritada." : "Find a billiard place near you — addresses, phones and routes on the map."}
          </p>
        </div>
      </section>

      <section>
        {clubs.length === 0 ? (
          <BookingEmptyPanel
            isAdmin={user?.role === "ADMIN"}
            labels={c}
            feedback={feedback}
            isImporting={importMutation.isPending}
            onImport={runImport}
          />
        ) : (
          <div className="relative rounded-lg overflow-hidden h-[70vh] lg:h-[600px]" style={{ border: "1px solid var(--card-border)", minHeight: "420px" }}>
            <ClubMap
              clubs={clubs}
              selectedClubId={selectedClub?.id}
              className="!h-full !min-h-full"
              onSelectClub={(club) => setSelectedClubId(club.id)}
            />
            {selectedClub ? (
              <SelectedClubSheet club={selectedClub} labels={c} text={text} onBook={() => setBookingClub(selectedClub)} />
            ) : null}
          </div>
        )}
      </section>
      </div>

      {bookingClub ? (
        <BookingModal club={bookingClub} labels={c} locale={locale} user={user} onClose={() => setBookingClub(null)} />
      ) : null}
    </div>
  );
}

function BookingEmptyPanel({
  isAdmin,
  labels,
  feedback,
  isImporting,
  onImport
}: {
  isAdmin: boolean;
  labels: BookingLabels;
  feedback: string | null;
  isImporting: boolean;
  onImport: () => void;
}) {
  return (
    <article className="p-6 rounded-lg text-center" style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>{labels.empty}</h2>
      {isAdmin ? (
        <div className="flex flex-col gap-2">
          <button type="button" className="px-4 py-2 font-semibold rounded-lg" style={{ background: "var(--accent)", color: "var(--bg)" }} disabled={isImporting} onClick={onImport}>
            {isImporting ? "..." : labels.importMap}
          </button>
          <Link href="/dashboard/admin/clubs" className="px-4 py-2 font-semibold rounded-lg" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
            Admin
          </Link>
        </div>
      ) : null}
      {feedback ? <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>{feedback}</p> : null}
    </article>
  );
}

function SelectedClubSheet({
  club,
  labels,
  text,
  onBook
}: {
  club: Club;
  labels: BookingLabels;
  text: TextFn;
  onBook: () => void;
}) {
  const callHref = phoneHref(club.phone);
  const tgHref = telegramHref(club.telegram);
  const directionsHref = routeHref(club, text(club.name));

  const logo = club.coverImageUrl || club.coverUrl;
  const flag = club.countryCode && /^[a-z]{2}$/.test(club.countryCode) ? club.countryCode : null;
  const addressText = text(club.address);

  return (
    <article className="absolute bottom-4 left-4 z-[1200] w-[min(340px,calc(100%-2rem))] max-h-[calc(100%-2rem)] overflow-y-auto p-5 rounded-xl booking-scroll" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-glow)" }}>
      {/* Header: logo + flag + name + rating */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="h-20 w-20 mb-3 rounded-2xl flex items-center justify-center overflow-hidden" style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={text(club.name)} className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="text-2xl" aria-hidden="true">🎱</span>
          )}
        </div>
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold" style={{ color: "var(--text)" }}>
          {flag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://flagcdn.com/24x18/${flag}.png`} alt="" width={22} height={16} className="shrink-0 rounded-sm" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
          ) : null}
          <span>{text(club.name)}</span>
        </h2>
        {club.rating !== null ? (
          <p className="mt-1 text-sm font-bold" style={{ color: "var(--accent)" }}>
            ⭐ {club.rating.toFixed(1)}{club.reviewsCount > 0 ? ` (${club.reviewsCount})` : ""}
          </p>
        ) : null}
      </div>

      {/* Details */}
      <div className="grid gap-2 text-sm mb-4">
        <p style={{ color: "var(--muted)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>{labels.address}:</span> {addressText || "-"}
        </p>
        {club.tableCount > 0 ? (
          <p style={{ color: "var(--muted)" }}>
            <span className="font-bold" style={{ color: "var(--text)" }}>🎱 {labels.tables}:</span> {club.tableCount}
          </p>
        ) : null}
        <p style={{ color: "var(--muted)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>{labels.workingHours}:</span> {text(club.workHours) || "-"}
        </p>
        <div style={{ color: "var(--muted)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>{labels.phone}:</span>{" "}
          {(() => {
            const phones = splitPhones(club.phone);
            if (phones.length === 0) {
              return <span>{labels.phoneMissing}</span>;
            }
            return phones.map((p, index) => (
              <span key={p}>
                {index > 0 ? ", " : ""}
                <a href={phoneHref(p) ?? undefined} className="hover:underline" style={{ color: "var(--text)" }}>{p}</a>
              </span>
            ));
          })()}
        </div>
      </div>

      {/* Primary booking CTA */}
      <button
        type="button"
        onClick={onBook}
        className="w-full mb-2 px-4 py-2.5 text-center font-bold rounded-lg"
        style={{ background: "var(--accent)", color: "var(--bg)" }}
      >
        🎱 {labels.book}
      </button>

      <div className="flex gap-2">
        {callHref ? (
          <a href={callHref} className="flex-1 px-4 py-2 text-center font-semibold rounded-lg" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
            {labels.call}
          </a>
        ) : null}
        {tgHref ? (
          <a href={tgHref} className="flex-1 px-4 py-2 text-center font-semibold rounded-lg" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} target="_blank" rel="noreferrer">
            {labels.write}
          </a>
        ) : null}
        {directionsHref ? (
          <a href={directionsHref} className="flex-1 px-4 py-2 text-center font-semibold rounded-lg" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} target="_blank" rel="noreferrer">
            {labels.route}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function BookingModal({
  club,
  labels,
  locale,
  user,
  onClose
}: {
  club: Club;
  labels: BookingLabels;
  locale: Locale;
  user: ReturnType<typeof useAuth>["user"];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [date, setDate] = useState(() => tashkentToday());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const [note, setNote] = useState("");
  const [requestId] = useState(makeRequestId);
  const [created, setCreated] = useState<BookingEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const slotsQuery = useClubBookingSlotsQuery(club.id, { date, durationMinutes });
  const createMutation = useCreateBookingMutation(club.id);

  // Reset the chosen slot whenever the search window changes.
  useEffect(() => {
    setSelected(null);
  }, [date, durationMinutes]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const availability = slotsQuery.data ?? [];
  const hasAnySlot = availability.some((table) => table.slots.length > 0);

  const submit = () => {
    if (!selected) {
      return;
    }
    setErrorMsg(null);
    createMutation.mutate(
      {
        clubId: club.id,
        tableId: selected.tableId,
        startTime: selected.startAt,
        endTime: selected.endAt,
        note: note.trim() || undefined,
        clientRequestId: requestId
      },
      {
        onSuccess: (booking) => setCreated(booking),
        onError: (error) =>
          setErrorMsg(
            getApiPayloadMessage(error instanceof Error && "payload" in error ? (error as { payload: unknown }).payload : null) ??
              getUserFacingApiError(error, { locale, t, debugLabel: "booking-create" })
          )
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-[480px] max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 booking-scroll"
        style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-glow)" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="portal-eyebrow">{labels.book}</span>
            <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>{labels.bookCta}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={labels.close} className="text-2xl leading-none" style={{ color: "var(--muted)" }}>
            ×
          </button>
        </div>

        {created ? (
          <BookingSuccess booking={created} labels={labels} locale={locale} onClose={onClose} />
        ) : !user ? (
          <div className="text-center py-6">
            <p className="mb-4" style={{ color: "var(--muted)" }}>{labels.loginToBook}</p>
            <Link
              href="/auth/signin?next=/booking"
              className="inline-block px-5 py-2.5 font-bold rounded-lg"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              {labels.login}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Date */}
            <label className="grid gap-1.5">
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{labels.date}</span>
              <input
                type="date"
                value={date}
                min={tashkentToday()}
                onChange={(event) => setDate(event.target.value)}
                className="px-3 py-2 rounded-lg"
                style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)", color: "var(--text)" }}
              />
            </label>

            {/* Duration */}
            <div className="grid gap-1.5">
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{labels.duration}</span>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((option) => {
                  const active = option === durationMinutes;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDurationMinutes(option)}
                      className="px-3 py-1.5 rounded-lg text-sm font-bold"
                      style={active
                        ? { background: "var(--accent)", color: "var(--bg)" }
                        : { border: "1px solid var(--card-border)", color: "var(--text)" }}
                    >
                      {formatDuration(option, labels.hourShort)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots */}
            <div className="grid gap-1.5">
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{labels.chooseTime}</span>
              {slotsQuery.isPending ? (
                <LoadingState />
              ) : slotsQuery.isError ? (
                <ErrorState onRetry={() => slotsQuery.refetch()} />
              ) : !hasAnySlot ? (
                <p className="py-3 text-sm" style={{ color: "var(--muted)" }}>{labels.noSlots}</p>
              ) : (
                <div className="grid gap-3">
                  {availability
                    .filter((table) => table.slots.length > 0)
                    .map((table) => (
                      <div key={table.tableId}>
                        <div className="mb-1 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                          {table.kind === "VIP" ? "⭐ " : ""}{table.tableName}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {table.slots.map((slot) => {
                            const isSelected =
                              selected?.tableId === table.tableId && selected?.startAt === slot.startAt;
                            return (
                              <button
                                key={`${table.tableId}-${slot.startAt}`}
                                type="button"
                                onClick={() =>
                                  setSelected({
                                    tableId: table.tableId,
                                    tableName: table.tableName,
                                    startAt: slot.startAt,
                                    endAt: slot.endAt,
                                    priceMinor: slot.priceMinor
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg text-sm font-bold"
                                style={isSelected
                                  ? { background: "var(--accent)", color: "var(--bg)" }
                                  : { border: "1px solid var(--card-border)", color: "var(--text)" }}
                              >
                                {formatSlotTime(slot.startAt, locale)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Note */}
            <label className="grid gap-1.5">
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{labels.note}</span>
              <input
                type="text"
                value={note}
                maxLength={500}
                placeholder={labels.notePlaceholder}
                onChange={(event) => setNote(event.target.value)}
                className="px-3 py-2 rounded-lg"
                style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)", color: "var(--text)" }}
              />
            </label>

            {/* Summary + submit */}
            {selected ? (
              <div className="rounded-lg p-3 text-sm" style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--muted)" }}>{selected.tableName}</span>
                  <span className="font-bold" style={{ color: "var(--text)" }}>
                    {formatSlotTime(selected.startAt, locale)}–{formatSlotTime(selected.endAt, locale)}
                  </span>
                </div>
                {typeof selected.priceMinor === "number" ? (
                  <div className="mt-1 flex items-center justify-between">
                    <span style={{ color: "var(--muted)" }}>{labels.total}</span>
                    <span className="font-black" style={{ color: "var(--accent)" }}>{formatMoney(selected.priceMinor, labels.currency)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {errorMsg ? (
              <p className="text-sm" style={{ color: "var(--danger)" }}>{errorMsg}</p>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={!selected || createMutation.isPending}
              className="w-full px-4 py-3 rounded-lg font-black"
              style={{
                background: !selected || createMutation.isPending ? "var(--surface-soft)" : "var(--accent)",
                color: !selected || createMutation.isPending ? "var(--muted)" : "var(--bg)",
                cursor: !selected || createMutation.isPending ? "not-allowed" : "pointer"
              }}
            >
              {createMutation.isPending ? labels.booking : selected ? labels.confirm : labels.selectSlot}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingSuccess({
  booking,
  labels,
  locale,
  onClose
}: {
  booking: BookingEntry;
  labels: BookingLabels;
  locale: Locale;
  onClose: () => void;
}) {
  const code = booking.id.slice(0, 8).toUpperCase();
  const when = `${new Date(booking.startAt).toLocaleDateString(localeTag(locale), { timeZone: "Asia/Tashkent", day: "2-digit", month: "long" })}, ${formatSlotTime(booking.startAt, locale)}`;

  return (
    <div className="text-center py-4">
      <div className="text-4xl mb-3" aria-hidden="true">✅</div>
      <h3 className="text-lg font-black mb-1" style={{ color: "var(--text)" }}>{labels.success}</h3>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{labels.successMsg}</p>

      <div className="rounded-lg p-4 mb-4 text-left" style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>{labels.bookingNumber}</span>
          <span className="font-mono text-lg font-black tracking-wider" style={{ color: "var(--accent)" }}>{code}</span>
        </div>
        <div className="text-sm" style={{ color: "var(--text)" }}>
          <div>{booking.table.name}</div>
          <div style={{ color: "var(--muted)" }}>{when} · {formatDuration(booking.durationMinutes, labels.hourShort)}</div>
          {typeof booking.priceMinor === "number" ? (
            <div className="mt-1 font-bold" style={{ color: "var(--accent)" }}>{formatMoney(booking.priceMinor, labels.currency)}</div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href="/dashboard/player"
          className="flex-1 px-4 py-2.5 text-center font-bold rounded-lg"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
        >
          {labels.myBookings}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 font-bold rounded-lg"
          style={{ border: "1px solid var(--card-border)", color: "var(--text)" }}
        >
          {labels.close}
        </button>
      </div>
    </div>
  );
}

function formatImportResult(labels: BookingLabels, result: { added: number; updated: number; skipped: number }) {
  return labels.importResult
    .replace("{added}", String(result.added))
    .replace("{updated}", String(result.updated))
    .replace("{skipped}", String(result.skipped));
}
