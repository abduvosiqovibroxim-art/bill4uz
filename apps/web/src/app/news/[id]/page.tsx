import type { Metadata } from "next";
import type { RawNews } from "@/lib/api/contracts";
import {
  buildMetadata,
  buildNewsDescription,
  buildTitle,
  dictionaryText,
  fetchPublicSeo,
  getCurrentLocale,
  pickSeoText
} from "@/lib/seo";
import { NewsDetailPageClient } from "./NewsDetailPageClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const article = await fetchPublicSeo<RawNews>(`/news/${id}`);

  if (!article) {
    return buildMetadata({
      title: buildTitle(dictionaryText(locale, "news.title")),
      description: dictionaryText(locale, "system.notFoundText"),
      path: `/news/${id}`
    });
  }

  return buildMetadata({
    title: buildTitle(pickSeoText(article.title, locale)),
    description: buildNewsDescription({
      excerpt: pickSeoText(article.excerpt, locale),
      content: pickSeoText(article.content, locale)
    }),
    path: `/news/${id}`,
    type: "article",
    imageAlt: pickSeoText(article.title, locale)
  });
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <NewsDetailPageClient id={id} />;
}
