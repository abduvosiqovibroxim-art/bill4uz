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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <section className="container-shell py-12">
        <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight" style={{ color: "var(--text)" }}>{c.title}</h1>
        <p className="text-xl" style={{ color: "var(--muted)" }}>
          {locale === "ru" ? "Найдите бильярдную рядом с вами" : locale === "uz" ? "Yaqinroq bilyard joyini toping" : "Find a billiard place near you"}
        </p>
      </section>

      <section className="container-shell pb-12">
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
                  cityLabel={t(`common.cities.${club.cityKey}`)}
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
  cityLabel,
  text,
  onSelect
}: {
  club: Club;
  isSelected: boolean;
  labels: BookingLabels;
  cityLabel: string;
  text: TextFn;
  onSelect: () => void;
}) {
  const status = resolveStatus(text(club.workHours), labels);
  const callHref = phoneHref(club.phone);
  const isOpen = isOpenNow(text(club.workHours));
  const coverImage = club.coverImageUrl || club.coverUrl;

  return (
    <article className="rounded-xl transition-all cursor-pointer overflow-hidden hover:scale-[1.02]" style={{ background: isSelected ? "var(--surface-selected)" : "var(--surface)", border: isSelected ? "2px solid var(--accent)" : "1px solid var(--card-border)", boxShadow: isSelected ? "var(--shadow-glow)" : "var(--shadow-soft)" }} onClick={onSelect}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative w-full h-40 overflow-hidden">
          <img
            src={coverImage}
            alt={text(club.name)}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Rating badge */}
          {club.rating && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(10, 15, 20, 0.95)", backdropFilter: "blur(8px)", border: "1px solid var(--accent)" }}>
              <span className="text-base">⭐</span>
              <span className="text-base font-black" style={{ color: "var(--accent)" }}>{club.rating.toFixed(1)}</span>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-3 left-3 px-3 py-1.5 text-xs font-black uppercase rounded-lg" style={{ background: isOpen ? "var(--danger)" : "rgba(10, 15, 20, 0.95)", color: isOpen ? "#fff" : "var(--muted)" }}>
            {status}
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-black leading-tight" style={{ color: "var(--text)" }}>{text(club.name)}</h2>
          {club.isVerified && (
            <span className="px-2.5 py-1 text-xs font-black rounded-lg" style={{ background: "var(--emerald)", color: "var(--bg)" }}>
              ✓
            </span>
          )}
        </div>
        <p className="text-sm mb-1 font-medium" style={{ color: "var(--muted)" }}>{cityLabel}</p>
        {isOpen !== null && (
          <p className="text-sm mb-1 font-bold flex items-center gap-1.5" style={{ color: isOpen ? "var(--danger)" : "var(--muted)" }}>
            <span style={{ fontSize: "10px" }}>●</span>
            <span>{status}</span>
          </p>
        )}
        <div className="flex items-center gap-3 mb-1">
          {club.rating !== null && (
            <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <span>⭐</span>
              <span>{club.rating.toFixed(1)}</span>
              {club.reviewsCount > 0 && (
                <span className="font-medium" style={{ color: "var(--muted)" }}>({club.reviewsCount})</span>
              )}
            </span>
          )}
          {club.tableCount > 0 && (
            <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
              <span>🎱</span>
              <span>{club.tableCount}</span>
            </span>
          )}
        </div>
        {(() => {
          const phones = splitPhones(club.phone);
          if (phones.length === 0) {
            return <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>{labels.phoneMissing}</p>;
          }
          return (
            <div className="flex flex-col gap-1 mb-4">
              {phones.map((p) => (
                <a
                  key={p}
                  href={phoneHref(p) ?? undefined}
                  className="text-sm font-semibold hover:underline w-fit"
                  style={{ color: "var(--text)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  📞 {p}
                </a>
              ))}
            </div>
          );
        })()}
        <div className="flex gap-2">
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

  return (
    <article className="absolute bottom-0 left-0 right-0 p-6 rounded-t-lg" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", borderBottom: "none" }}>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>{text(club.name)}</h2>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{text(club.address) || "-"}</p>
      {(() => {
        const photos = [club.coverImageUrl, club.coverUrl].filter((src): src is string => Boolean(src));
        if (photos.length === 0) {
          return (
            <div className="mb-4 h-28 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--surface-soft)", color: "var(--muted)", border: "1px dashed var(--card-border)" }}>
              📷 Фото пока нет
            </div>
          );
        }
        return (
          <div className="mb-4 flex gap-2 overflow-x-auto booking-scroll">
            {photos.map((src, i) => (
              <img key={i} src={src} alt={text(club.name)} className="h-28 rounded-lg object-cover" style={{ minWidth: "10rem" }} />
            ))}
          </div>
        );
      })()}
      <div className="grid gap-2 text-sm mb-4">
        {club.rating !== null && (
          <p style={{ color: "var(--muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>⭐ {club.rating.toFixed(1)}</span>
            {club.reviewsCount > 0 ? ` (${club.reviewsCount})` : ""}
          </p>
        )}
        {club.tableCount > 0 && (
          <p style={{ color: "var(--muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>🎱 {labels.tables}:</span> {club.tableCount}
          </p>
        )}
        <p style={{ color: "var(--muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>{labels.workingHours}:</span> {text(club.workHours) || "-"}
        </p>
        <div style={{ color: "var(--muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>{labels.phone}:</span>{" "}
          {(() => {
            const phones = splitPhones(club.phone);
            if (phones.length === 0) {
              return <span>{labels.phoneMissing}</span>;
            }
            return (
              <span className="inline-flex flex-col gap-0.5 align-top">
                {phones.map((p) => (
                  <a key={p} href={phoneHref(p) ?? undefined} className="hover:underline" style={{ color: "var(--text)" }}>
                    {p}
                  </a>
                ))}
              </span>
            );
          })()}
        </div>
        <p style={{ color: "var(--muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>{labels.telegram}:</span> {club.telegram || "-"}
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
