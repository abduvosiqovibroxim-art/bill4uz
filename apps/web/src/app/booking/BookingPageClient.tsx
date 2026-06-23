"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClubMap } from "@/components/ClubMap";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useAuth } from "@/components/AuthProvider";
import { useClubsQuery, useImportClubsFromMapAdminMutation } from "@/lib/api/hooks";
import { getApiPayloadMessage, getUserFacingApiError } from "@/lib/api/errors";
import { isOpenNow, phoneHref, routeHref, splitPhones, telegramHref } from "@/lib/clubContact";
import { useI18n } from "@/lib/i18n";
import type { Club, LocalizedText } from "@/lib/types";

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
    tables: "Столы"
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
    tables: "Stollar"
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
    tables: "Tables"
  }
} as const;

type BookingLabels = { [K in keyof (typeof copy)["ru"]]: string };
type TextFn = (input: string | LocalizedText | null | undefined) => string;

export function BookingPageClient() {
  const { locale, t, text } = useI18n();
  const { user } = useAuth();
  const clubsQuery = useClubsQuery();
  const importMutation = useImportClubsFromMapAdminMutation();
  const clubs = clubsQuery.data ?? [];
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Clubs list */}
          <div className="lg:col-span-1 space-y-4 lg:h-[600px] lg:overflow-y-auto lg:pr-2 booking-scroll">
            {clubs.length === 0 ? (
              <BookingEmptyPanel
                isAdmin={user?.role === "ADMIN"}
                labels={c}
                feedback={feedback}
                isImporting={importMutation.isPending}
                onImport={runImport}
              />
            ) : (
              clubs.map((club) => (
                <ClubListCard
                  key={club.id}
                  club={club}
                  isSelected={club.id === selectedClub?.id}
                  labels={c}
                  text={text}
                  onSelect={() => setSelectedClubId(club.id)}
                />
              ))
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2 relative rounded-lg overflow-hidden lg:sticky lg:top-6 lg:h-[600px]" style={{ border: "1px solid var(--card-border)", minHeight: "600px" }}>
            <ClubMap
              clubs={clubs}
              selectedClubId={selectedClub?.id}
              emptyMessage={clubs.length === 0 ? c.empty : undefined}
              onSelectClub={(club) => setSelectedClubId(club.id)}
            />
            {selectedClub ? <SelectedClubSheet club={selectedClub} labels={c} text={text} /> : null}
          </div>
        </div>
      </section>
      </div>
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

function ClubListCard({
  club,
  isSelected,
  labels,
  text,
  onSelect
}: {
  club: Club;
  isSelected: boolean;
  labels: BookingLabels;
  text: TextFn;
  onSelect: () => void;
}) {
  const status = resolveStatus(text(club.workHours), labels);
  const callHref = phoneHref(club.phone);
  const isOpen = isOpenNow(text(club.workHours));
  const logo = club.coverImageUrl || club.coverUrl;
  const phones = splitPhones(club.phone);
  const addressText = text(club.address);
  const flag = club.countryCode && /^[a-z]{2}$/.test(club.countryCode) ? club.countryCode : null;

  return (
    <article className="rounded-xl transition-all cursor-pointer overflow-hidden hover:scale-[1.01]" style={{ background: isSelected ? "var(--surface-selected)" : "var(--surface)", border: isSelected ? "2px solid var(--accent)" : "1px solid var(--card-border)", boxShadow: isSelected ? "var(--shadow-glow)" : "var(--shadow-soft)" }} onClick={onSelect}>
      <div className="p-5 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="h-24 w-24 mb-3 rounded-2xl flex items-center justify-center overflow-hidden" style={{ background: "var(--surface-soft)", border: "1px solid var(--card-border)" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={text(club.name)} className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="text-3xl" aria-hidden="true">🎱</span>
          )}
        </div>

        {/* Flag + name */}
        <h2 className="flex items-center justify-center gap-2 text-lg font-black leading-tight" style={{ color: "var(--text)" }}>
          {flag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://flagcdn.com/24x18/${flag}.png`} alt="" width={20} height={15} className="shrink-0 rounded-sm" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
          ) : null}
          <span>{text(club.name)}</span>
          {club.isVerified ? <span style={{ color: "var(--emerald)" }}>✓</span> : null}
        </h2>

        {/* Status + rating + tables */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-bold">
          {isOpen !== null ? (
            <span className="flex items-center gap-1.5" style={{ color: isOpen ? "var(--danger)" : "var(--muted)" }}>
              <span style={{ fontSize: "9px" }}>●</span>{status}
            </span>
          ) : null}
          {club.rating !== null ? (
            <span style={{ color: "var(--accent)" }}>⭐ {club.rating.toFixed(1)}</span>
          ) : null}
          {club.tableCount > 0 ? (
            <span style={{ color: "var(--text)" }}>🎱 {club.tableCount}</span>
          ) : null}
        </div>

        {/* Address */}
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>{labels.address}:</span> {addressText || "—"}
        </p>

        {/* Phone */}
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>{labels.phone}:</span>{" "}
          {phones.length === 0 ? (
            <span>{labels.phoneMissing}</span>
          ) : (
            phones.map((p, index) => (
              <span key={p}>
                {index > 0 ? ", " : ""}
                <a href={phoneHref(p) ?? undefined} className="font-semibold hover:underline" style={{ color: "var(--text)" }} onClick={(e) => e.stopPropagation()}>{p}</a>
              </span>
            ))
          )}
        </p>

        {/* Actions */}
        <div className="mt-4 flex w-full gap-2">
          {callHref ? (
            <a href={callHref} className="flex-1 px-4 py-2.5 text-center text-sm font-bold rounded-lg transition-all hover:scale-105" style={{ background: "var(--accent)", color: "var(--bg)" }} onClick={(e) => e.stopPropagation()}>
              {labels.call}
            </a>
          ) : null}
          <button type="button" className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all hover:scale-105" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
            {labels.onMap}
          </button>
        </div>
      </div>
    </article>
  );
}

function SelectedClubSheet({
  club,
  labels,
  text
}: {
  club: Club;
  labels: BookingLabels;
  text: TextFn;
}) {
  const callHref = phoneHref(club.phone);
  const tgHref = telegramHref(club.telegram);
  const directionsHref = routeHref(club, text(club.name));

  const logo = club.coverImageUrl || club.coverUrl;
  const flag = club.countryCode && /^[a-z]{2}$/.test(club.countryCode) ? club.countryCode : null;
  const addressText = text(club.address);

  return (
    <article className="absolute bottom-0 left-0 right-0 p-6 rounded-t-lg" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderBottom: "none" }}>
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
        <p style={{ color: "var(--muted)" }}>
          <span className="font-bold" style={{ color: "var(--text)" }}>{labels.telegram}:</span> {club.telegram || "-"}
        </p>
      </div>
      <div className="flex gap-2">
        {callHref ? (
          <a href={callHref} className="flex-1 px-4 py-2 text-center font-semibold rounded-lg" style={{ background: "var(--accent)", color: "var(--bg)" }}>
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

function formatImportResult(labels: BookingLabels, result: { added: number; updated: number; skipped: number }) {
  return labels.importResult
    .replace("{added}", String(result.added))
    .replace("{updated}", String(result.updated))
    .replace("{skipped}", String(result.skipped));
}

function resolveStatus(workingHours: string, labels: BookingLabels) {
  const status = isOpenNow(workingHours);
  if (status === null) {
    return labels.unknownStatus;
  }

  return status ? labels.openNow : labels.closedNow;
}
