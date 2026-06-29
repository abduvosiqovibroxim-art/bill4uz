"use client";

import { useState } from "react";
import Link from "next/link";
import { coachQualificationKey } from "@/components/cards";
import { ErrorState, LoadingState } from "@/components/DataState";
import { MetricTile, SurfaceCard } from "@/components/ui";
import { useCoachQuery } from "@/lib/api/hooks";
import { useI18n } from "@/lib/i18n";
import { gradientFromString } from "@/lib/visuals";
import { initialsFromName } from "@/lib/visuals";

export function CoachProfilePageClient({ id }: { id: string }) {
  const { t, formatDate } = useI18n();
  const coachQuery = useCoachQuery(id);
  const coach = coachQuery.data;

  if (coachQuery.isPending) {
    return (
      <div className="container-shell py-16">
        <LoadingState />
      </div>
    );
  }

  if (coachQuery.isError || !coach) {
    return (
      <div className="container-shell py-16">
        <ErrorState onRetry={() => coachQuery.refetch()} />
      </div>
    );
  }

  const location = [coach.countryName, coach.region, coach.cityName].filter(Boolean).join(" · ");
  const qualificationLabel = t(`coaches.qualifications.${coachQualificationKey(coach.qualification)}`);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="container-shell space-y-6 py-10">
        <Link href="/coaches" className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
          ← {t("coaches.title")}
        </Link>

        {/* Header */}
        <SurfaceCard className="flex flex-col gap-6 md:flex-row md:items-center">
          {coach.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.photoUrl} alt={coach.fullName} className="h-28 w-28 shrink-0 rounded-3xl object-cover md:h-32 md:w-32" />
          ) : (
            <span
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl text-4xl font-black text-white md:h-32 md:w-32"
              style={{ backgroundImage: gradientFromString(coach.fullName) }}
            >
              {initialsFromName(coach.fullName)}
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black md:text-4xl" style={{ color: "var(--text)" }}>
                {coach.fullName}
              </h1>
              {coach.rating !== null ? (
                <span className="text-lg font-bold text-accent">★ {coach.rating.toFixed(1)}</span>
              ) : null}
            </div>
            <span className="pill inline-flex">{qualificationLabel}</span>
            {location ? <p className="text-sm text-muted">{location}</p> : null}
            <p className="text-base text-white/85">{coach.specialization}</p>
            {coach.clubName ? (
              <p className="text-sm text-muted">
                {t("coaches.club")}: {coach.clubName}
              </p>
            ) : null}
          </div>
        </SurfaceCard>

        {/* Key metrics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SurfaceCard>
            <MetricTile label={t("coaches.experience")} value={`25+ ${t("coaches.yearsShort")}`} />
          </SurfaceCard>
          <SurfaceCard>
            <MetricTile label={t("coaches.students")} value="15+" />
          </SurfaceCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            {coach.bio ? (
              <SurfaceCard className="space-y-3">
                <h2 className="text-xl font-semibold text-white">{t("coaches.about")}</h2>
                <p className="text-sm leading-7 text-muted">{coach.bio}</p>
                {coach.disciplines.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {coach.disciplines.map((discipline) => (
                      <span key={discipline} className="pill">
                        {discipline}
                      </span>
                    ))}
                  </div>
                ) : null}
              </SurfaceCard>
            ) : null}

            {/* Gallery */}
            {coach.gallery.length > 0 ? (
              <SurfaceCard className="space-y-4">
                <h2 className="text-xl font-semibold text-white">{t("coaches.gallery")}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {coach.gallery.map((image, index) => (
                    <GalleryImage key={image.id} url={image.url} seed={`${coach.fullName}-${index}`} alt={coach.fullName} />
                  ))}
                </div>
              </SurfaceCard>
            ) : null}

            {/* Reviews */}
            {coach.reviews.length > 0 ? (
              <SurfaceCard className="space-y-4">
                <h2 className="text-xl font-semibold text-white">{t("coaches.reviews")}</h2>
                <div className="space-y-3">
                  {coach.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl p-4"
                      style={{ background: "var(--surface-strong)", border: "1px solid var(--card-border)" }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{review.authorName}</p>
                        <span className="text-sm font-bold text-accent">{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">{review.text}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{formatDate(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            ) : null}
          </div>

          <div className="space-y-6">
            {/* Achievements */}
            {coach.achievements.length > 0 ? (
              <SurfaceCard className="space-y-3">
                <h2 className="text-xl font-semibold text-white">{t("coaches.achievements")}</h2>
                <ul className="space-y-2">
                  {coach.achievements.map((achievement) => (
                    <li key={achievement} className="flex gap-2 text-sm text-muted">
                      <span className="text-accent">▹</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            ) : null}

            {/* Students */}
            {coach.students.length > 0 ? (
              <SurfaceCard className="space-y-3">
                <h2 className="text-xl font-semibold text-white">{t("coaches.studentsList")}</h2>
                <ul className="space-y-2">
                  {coach.students.map((student) => (
                    <li key={student.id} className="text-sm">
                      <span className="font-semibold text-white">{student.name}</span>
                      {student.achievement ? <span className="text-muted"> — {student.achievement}</span> : null}
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            ) : null}

            {/* Contacts */}
            {coach.phone || coach.telegram ? (
              <SurfaceCard className="space-y-3">
                <h2 className="text-xl font-semibold text-white">{t("coaches.contacts")}</h2>
                <div className="space-y-2 text-sm">
                  {coach.phone ? (
                    <a href={`tel:${coach.phone}`} className="block text-white/85 hover:text-accent">
                      {coach.phone}
                    </a>
                  ) : null}
                  {coach.telegram ? (
                    <a
                      href={`https://t.me/${coach.telegram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-white/85 hover:text-accent"
                    >
                      {coach.telegram}
                    </a>
                  ) : null}
                </div>
              </SurfaceCard>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryImage({ url, seed, alt }: { url: string; seed: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="aspect-video w-full rounded-xl" style={{ backgroundImage: gradientFromString(seed) }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-xl object-cover"
    />
  );
}
