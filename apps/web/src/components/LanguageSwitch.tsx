"use client";

import { useI18n } from "@/lib/i18n";
import { Locale } from "@/lib/types";

const locales: Locale[] = ["ru", "uz", "en"];

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="toggle-group">
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          aria-label={`${t("common.language")}: ${item}`}
          className={`toggle-button ${
            locale === item ? "toggle-button-active" : ""
          }`}
        >
          {t(`common.localeNames.${item}`)}
        </button>
      ))}
    </div>
  );
}
