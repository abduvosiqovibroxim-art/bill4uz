import { ClubPageClient } from "./ClubPageClient";

interface ClubPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { id } = await params;
  return <ClubPageClient clubId={id} />;
}
