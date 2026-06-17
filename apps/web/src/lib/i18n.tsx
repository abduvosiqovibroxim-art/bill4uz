"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type DictionaryNode, LOCALE_COOKIE } from "./dictionaries";
import { LocalizedText, Locale } from "./types";
import { getLocalizedText } from "./locale";

const LOCALE_STORAGE_KEY = "billard-locale";

const localeFormats: Record<Locale, string> = {
  ru: "ru-RU",
  uz: "uz-UZ",
  en: "en-US"
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
  text: (value: LocalizedText | string | null | undefined) => string;
  formatDate: (value: string) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercent: (value: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getValueByPath(locale: Locale, path: string): string {
  const localized = resolveValueByPath(locale, path);
  if (localized && !hasBrokenText(localized)) {
    return localized;
  }

  const fallback = resolveValueByPath("en", path);
  return fallback && !hasBrokenText(fallback) ? fallback : path;
}

function resolveValueByPath(locale: Locale, path: string): string | null {
  const segments = path.split(".");
  let cursor: DictionaryNode | undefined = dictionaries[locale];

  for (const segment of segments) {
    if (!cursor || typeof cursor === "string") {
      return null;
    }

    cursor = cursor[segment];
  }

  return typeof cursor === "string" ? cursor : null;
}

function hasBrokenText(value: string) {
  if (value.includes("\uFFFD") || value.includes("пїЅ")) {
    return true;
  }

  if (
    value.includes("вЂ") ||
    value.includes("в€™") ||
    value.includes("вЂњ") ||
    value.includes("вЂќ") ||
    value.includes("вЂ¦")
  ) {
    return true;
  }

  const compact = value.replace(/\s+/g, "");
  if (compact.length < 6) {
    return false;
  }

  // Detect common UTF-8/CP1251 mojibake like "РџСЂРё..." by pair density.
  const mojibakePairCount = (compact.match(/[РС][\u0400-\u04FF]/g) ?? []).length;
  return mojibakePairCount >= 3 && mojibakePairCount * 2 >= compact.length * 0.45;
}

export function I18nProvider({
  children,
  initialLocale
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale: (nextLocale) => setLocaleState(nextLocale),
      t: (path) => getValueByPath(locale, path),
      text: (value) => {
        if (!value) {
          return "";
        }

        return getLocalizedText(value, locale);
      },
      formatDate: (value) =>
        new Intl.DateTimeFormat(localeFormats[locale], {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }).format(new Date(value)),
      formatNumber: (value) => new Intl.NumberFormat(localeFormats[locale]).format(value),
      formatCurrency: (value, currency = "UZS") =>
        new Intl.NumberFormat(localeFormats[locale], {
          style: "currency",
          currency,
          maximumFractionDigits: 0
        }).format(value),
      formatPercent: (value) =>
        `${new Intl.NumberFormat(localeFormats[locale], {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(value)}%`
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
