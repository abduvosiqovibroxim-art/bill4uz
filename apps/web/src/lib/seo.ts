import { cookies } from "next/headers";
import type { Metadata } from "next";
import { defaultLocale, dictionaries, LOCALE_COOKIE, type DictionaryNode } from "./dictionaries";
import { isLocale } from "./locale";
import type { Locale, LocalizedText } from "./types";

const SITE_NAME = "Billard.uz Pro";
const DEFAULT_DESCRIPTION =
  "Live tournaments, premium clubs, player rankings, and tournament centers for Uzbekistan billiards.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api";

export const metadataBaseUrl = new URL(APP_URL);

export function absoluteUrl(path = "/") {
  return new URL(path, metadataBaseUrl).toString();
}

export function pickSeoText(value?: LocalizedText | string | null, locale: Locale = "ru") {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return hasBrokenText(value) ? "" : value;
  }

  const localized = value[locale];
  if (localized && !hasBrokenText(localized)) {
    return localized;
  }

  const fallback = value.en ?? value.ru ?? "";
  return hasBrokenText(fallback) ? "" : fallback;
}

export function trimDescription(value: string, maxLength = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function buildMetadata({
  title,
  description,
  path,
  imagePath,
  imageAlt,
  type = "website"
}: {
  title: string;
  description?: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const canonical = absoluteUrl(path);
  const resolvedDescription = trimDescription(description || DEFAULT_DESCRIPTION);
  const resolvedImage = absoluteUrl(imagePath || "/opengraph-image");

  return {
    title: {
      absolute: title
    },
    description: resolvedDescription,
    alternates: {
      canonical
    },
    openGraph: {
      type,
      url: canonical,
      title,
      description: resolvedDescription,
      siteName: SITE_NAME,
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resolvedDescription,
      images: [resolvedImage]
    }
  };
}

export async function fetchPublicSeo<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${INTERNAL_API_URL.replace(/\/$/, "")}${path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function buildTitle(label: string) {
  return `${label} | ${SITE_NAME}`;
}

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export function dictionaryText(locale: Locale, path: string) {
  const segments = path.split(".");
  let cursor: DictionaryNode | undefined = dictionaries[locale];

  for (const segment of segments) {
    if (!cursor || typeof cursor === "string") {
      return path;
    }

    cursor = cursor[segment];
  }

  if (typeof cursor === "string" && !hasBrokenText(cursor)) {
    return cursor;
  }

  let fallbackCursor: DictionaryNode | undefined = dictionaries.en;
  for (const segment of segments) {
    if (!fallbackCursor || typeof fallbackCursor === "string") {
      return path;
    }

    fallbackCursor = fallbackCursor[segment];
  }

  return typeof fallbackCursor === "string" && !hasBrokenText(fallbackCursor) ? fallbackCursor : path;
}

function hasBrokenText(value: string) {
  return value.includes("\uFFFD");
}

export function buildTournamentDescription({
  title,
  club,
  city,
  status,
  discipline,
  prizePool
}: {
  title: string;
  club: string;
  city: string;
  status: string;
  discipline: string;
  prizePool: number;
}) {
  return `${title} at ${club} in ${city}. ${status} ${discipline} tournament with a ${new Intl.NumberFormat(
    "en-US"
  ).format(prizePool)} UZS prize pool, live bracket, participants, schedule, and results.`;
}

export function buildPlayerDescription({
  name,
  club,
  city,
  elo,
  bio
}: {
  name: string;
  club: string;
  city: string;
  elo: number;
  bio?: string;
}) {
  if (bio) {
    return bio;
  }

  if (elo > 0) {
    return `${name} from ${city} represents ${club}. Current ELO ${elo} with recorded tournament history on Billard.uz Pro.`;
  }

  return `${name} from ${city} represents ${club} on Billard.uz Pro. Rating and statistics appear after verified play or a controlled external update.`;
}

export function buildClubDescription({
  name,
  city,
  description
}: {
  name: string;
  city: string;
  description?: string;
}) {
  return description || `${name} in ${city}. Club profile on Billard.uz Pro.`;
}

export function buildNewsDescription({
  excerpt,
  content
}: {
  excerpt?: string;
  content?: string;
}) {
  return trimDescription(excerpt || content || DEFAULT_DESCRIPTION);
}
