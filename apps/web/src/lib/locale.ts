import type { Locale, LocalizedText } from "./types";

export function isLocale(value: string | undefined): value is Locale {
  return value === "ru" || value === "uz" || value === "en";
}

export function getLocalizedText(value: LocalizedText | string | null | undefined, locale: Locale): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  const fallbackOrder: Locale[] = [locale, "ru", "en", "uz"];
  for (const key of fallbackOrder) {
    const localizedValue = value[key]?.trim();
    if (localizedValue) {
      return localizedValue;
    }
  }

  for (const localizedValue of Object.values(value)) {
    const normalized = localizedValue?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}
