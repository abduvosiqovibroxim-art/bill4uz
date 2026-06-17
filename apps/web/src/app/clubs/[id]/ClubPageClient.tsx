"use client";

import Link from "next/link";
import { ClubGallery } from "@/components/clubs/ClubGallery";
import { ClubCoverImage } from "@/components/clubs/ClubCoverImage";
import { ClubAmenities } from "@/components/clubs/ClubAmenities";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useClubQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { phoneHref, routeHref, telegramHref } from "@/lib/clubContact";

interface ClubPageClientProps {
  clubId: string;
}

export function ClubPageClient({ clubId }: ClubPageClientProps) {
  const { locale, text } = useI18n();
  const clubQuery = useClubQuery(clubId);

  if (clubQuery.isPending) {
    return <LoadingState />;
  }

  if (clubQuery.isError || !clubQuery.data) {
    return <ErrorState onRetry={() => clubQuery.refetch()} />;
  }

  const club = clubQuery.data;
  const callHref = phoneHref(club.phone);
  const tgHref = telegramHref(club.telegram);
  const directionsHref = routeHref(club, text(club.name));

  const copy = {
    phone: locale === "ru" ? "Телефон" : locale === "uz" ? "Telefon" : "Phone",
    telegram: locale === "ru" ? "Telegram" : locale === "uz" ? "Telegram" : "Telegram",
    address: locale === "ru" ? "Адрес" : locale === "uz" ? "Manzil" : "Address",
    workingHours: locale === "ru" ? "Рабочее время" : locale === "uz" ? "Ish vaqti" : "Working hours",
    tables: locale === "ru" ? "Столов" : locale === "uz" ? "Stollar" : "Tables",
    disciplines: locale === "ru" ? "Дисциплины" : locale === "uz" ? "Yo'nalishlar" : "Disciplines",
    call: locale === "ru" ? "Позвонить" : locale === "uz" ? "Qo'ng'iroq" : "Call",
    message: locale === "ru" ? "Написать" : locale === "uz" ? "Yozish" : "Message",
    route: locale === "ru" ? "Маршрут" : locale === "uz" ? "Yo'nalish" : "Route",
    gallery: locale === "ru" ? "Фотогалерея" : locale === "uz" ? "Fotogalereya" : "Photo gallery",
    description: locale === "ru" ? "Описание" : locale === "uz" ? "Tavsif" : "Description",
    backToMap: locale === "ru" ? "← Вернуться к карте" : locale === "uz" ? "← Xaritaga qaytish" : "← Back to map",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <section className="container-shell py-8">
        <Link href="/booking" className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition-all hover:gap-3" style={{ color: "var(--accent)" }}>
          {copy.backToMap}
        </Link>

        <div className="flex items-start justify-between mb-6">
          <h1 className="text-5xl md:text-6xl font-black leading-tight" style={{ color: "var(--text)" }}>{text(club.name)}</h1>
        </div>
      </section>

      {/* Cover Image */}
      <section className="container-shell pb-6">
        <ClubCoverImage
          coverImageUrl={club.coverImageUrl || club.coverUrl}
          clubName={text(club.name)}
          rating={club.rating}
          reviewsCount={club.reviewsCount}
          isVerified={club.isVerified}
        />
      </section>

      {/* Info Grid */}
      <section className="container-shell pb-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {club.description && text(club.description) && (
              <div className="p-8 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>{copy.description}</h2>
                <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
                  {text(club.description)}
                </p>
              </div>
            )}

            {/* Gallery */}
            {club.gallery && club.gallery.length > 0 && (
              <div className="p-8 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
                <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>{copy.gallery}</h2>
                <ClubGallery images={club.gallery} clubName={text(club.name)} />
              </div>
            )}

            {/* Amenities */}
            {club.amenities && club.amenities.length > 0 && (
              <div className="p-8 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
                <ClubAmenities amenities={club.amenities} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="p-8 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Контакты</h2>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{copy.phone}</div>
                  <div className="text-base" style={{ color: "var(--text)" }}>{club.phone || "-"}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{copy.telegram}</div>
                  <div className="text-base" style={{ color: "var(--text)" }}>{club.telegram || "-"}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{copy.address}</div>
                  <div className="text-base" style={{ color: "var(--text)" }}>{text(club.address)}</div>
                </div>

                {club.workHours && text(club.workHours) && (
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>{copy.workingHours}</div>
                    <div className="text-base" style={{ color: "var(--text)" }}>{text(club.workHours)}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {callHref && (
                  <a href={callHref} className="px-5 py-3.5 text-center font-bold rounded-lg transition-all hover:scale-105" style={{ background: "var(--accent)", color: "var(--bg)" }}>
                    {copy.call}
                  </a>
                )}
                {tgHref && (
                  <a href={tgHref} className="px-5 py-3.5 text-center font-bold rounded-lg transition-all hover:scale-105" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} target="_blank" rel="noreferrer">
                    {copy.message}
                  </a>
                )}
                {directionsHref && (
                  <a href={directionsHref} className="px-5 py-3.5 text-center font-bold rounded-lg transition-all hover:scale-105" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} target="_blank" rel="noreferrer">
                    {copy.route}
                  </a>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="p-8 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-soft)" }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Информация</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--muted)" }}>{copy.tables}:</span>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{club.tables}</span>
                </div>

                {club.disciplines && club.disciplines.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--muted)" }}>{copy.disciplines}:</div>
                    <div className="flex flex-wrap gap-2">
                      {club.disciplines.map((discipline) => (
                        <span key={discipline} className="px-2 py-1 text-xs rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                          {discipline}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
