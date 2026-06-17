"use client";

import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="footer-shell mt-16 py-12">
      <div className="container-shell grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <p className="brand-title text-2xl text-accent">{t("common.brand")}</p>
          <p className="text-sm text-muted">{t("footer.tagline")}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">{t("footer.contact")}</p>
          <p className="text-sm text-muted">Tel: +998 99 866 68 09</p>
          <p className="text-sm text-muted">Telegram: +998 99 866 68 09</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">{t("footer.telegram")}</p>
          <p className="text-sm text-muted">@Billuzpro_bot</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">{t("footer.address")}</p>
          <p className="break-words text-sm leading-6 text-muted">
            Город Ташкент; Шайхонтохурский район, улица Коча Дарбоса 3425
          </p>
        </div>
      </div>

      <div className="container-shell mt-8 border-t border-white/10 pt-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{t("footer.rights")}</p>
      </div>
    </footer>
  );
}
