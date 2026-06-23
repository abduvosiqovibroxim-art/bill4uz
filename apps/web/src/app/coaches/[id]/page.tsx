import type { Metadata } from "next";
import type { RawCoach } from "@/lib/api/contracts";
import { buildMetadata, buildTitle, dictionaryText, fetchPublicSeo, getCurrentLocale } from "@/lib/seo";
import { CoachProfilePageClient } from "./CoachProfilePageClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const coach = await fetchPublicSeo<RawCoach>(`/coaches/${id}`);

  if (!coach) {
    return buildMetadata({
      title: buildTitle(dictionaryText(locale, "coaches.title")),
      description: dictionaryText(locale, "system.notFoundText"),
      path: `/coaches/${id}`
    });
  }

  return buildMetadata({
    title: buildTitle(coach.fullName),
    description: coach.bio || coach.specialization,
    path: `/coaches/${id}`,
    type: "profile",
    imageAlt: coach.fullName
  });
}

export default async function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CoachProfilePageClient id={id} />;
}
