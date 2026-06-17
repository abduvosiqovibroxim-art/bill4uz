"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useAuth } from "@/components/AuthProvider";
import { GlowButton, NoticePanel, SectionShell, SurfaceCard } from "@/components/ui";
import { apiFetch } from "@/lib/api/client";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

interface TelegramLinkStatus {
  linked: boolean;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramLinkedAt: string | null;
  botUsername: string | null;
}

interface TelegramLinkRequest {
  code: string;
  token: string;
  deepLink: string | null;
  botUsername: string | null;
  expiresAt: string;
}

const copy = {
  ru: {
    title: "Telegram",
    subtitle: "Привяжите Telegram к существующему аккаунту сайта. Бот будет работать поверх текущего backend и тех же турниров.",
    linked: "Telegram уже привязан",
    notLinked: "Telegram пока не привязан",
    username: "Username",
    telegramId: "Telegram ID",
    linkedAt: "Привязан",
    openBot: "Открыть бота",
    generate: "Сгенерировать код",
    regenerate: "Сгенерировать заново",
    unlink: "Отвязать Telegram",
    codeTitle: "Код привязки",
    codeHint: "Откройте бота по deep-link или отправьте ему этот код через /start.",
    expiresAt: "Код действует до",
    successUnlink: "Telegram отвязан.",
    fallbackBot: "Укажите TELEGRAM_BOT_USERNAME, чтобы deep-link появился автоматически.",
    back: "Назад в dashboard"
  },
  uz: {
    title: "Telegram",
    subtitle: "Telegram'ni mavjud sayt akkauntingizga ulang. Bot aynan shu backend va shu turnirlar ustida ishlaydi.",
    linked: "Telegram allaqachon ulangan",
    notLinked: "Telegram hali ulanmagan",
    username: "Username",
    telegramId: "Telegram ID",
    linkedAt: "Ulangan vaqt",
    openBot: "Botni ochish",
    generate: "Kod yaratish",
    regenerate: "Qayta yaratish",
    unlink: "Telegram'ni uzish",
    codeTitle: "Ulash kodi",
    codeHint: "Botni deep-link orqali oching yoki unga bu kodni /start bilan yuboring.",
    expiresAt: "Kod amal qiladi",
    successUnlink: "Telegram uzildi.",
    fallbackBot: "Deep-link avtomatik chiqishi uchun TELEGRAM_BOT_USERNAME ni sozlang.",
    back: "Dashboard'ga qaytish"
  },
  en: {
    title: "Telegram",
    subtitle: "Link Telegram to your existing site account. The bot will work on top of the same backend and tournament data.",
    linked: "Telegram is linked",
    notLinked: "Telegram is not linked yet",
    username: "Username",
    telegramId: "Telegram ID",
    linkedAt: "Linked at",
    openBot: "Open bot",
    generate: "Generate code",
    regenerate: "Generate again",
    unlink: "Unlink Telegram",
    codeTitle: "Link code",
    codeHint: "Open the bot with the deep link or send this code through /start.",
    expiresAt: "Code expires at",
    successUnlink: "Telegram unlinked.",
    fallbackBot: "Set TELEGRAM_BOT_USERNAME to generate a deep link automatically.",
    back: "Back to dashboard"
  }
} as const;

export default function DashboardTelegramPage() {
  const { locale, formatDate, t } = useI18n();
  const { user, dashboardPathForRole } = useAuth();
  const ui = copy[locale];
  const [status, setStatus] = useState<TelegramLinkStatus | null>(null);
  const [linkRequest, setLinkRequest] = useState<TelegramLinkRequest | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: "default" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  async function loadStatus() {
    setIsLoading(true);

    try {
      const nextStatus = await apiFetch<TelegramLinkStatus>("/bot/link/status");
      setStatus(nextStatus);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function handleGenerate() {
    setIsPending(true);
    setFeedback(null);

    try {
      const request = await apiFetch<TelegramLinkRequest>("/bot/link/request", {
        method: "POST"
      });
      setLinkRequest(request);
      await loadStatus();
    } catch (error) {
      setFeedback({
        message: getUserFacingApiError(error, { locale, t, debugLabel: "web-telegram-link-create" }),
        tone: "error"
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleUnlink() {
    setIsPending(true);
    setFeedback(null);

    try {
      await apiFetch("/bot/link", {
        method: "DELETE"
      });
      setLinkRequest(null);
      setFeedback({ message: ui.successUnlink, tone: "default" });
      await loadStatus();
    } catch (error) {
      setFeedback({
        message: getUserFacingApiError(error, { locale, t, debugLabel: "web-telegram-link-unlink" }),
        tone: "error"
      });
    } finally {
      setIsPending(false);
    }
  }

  if (isLoading) {
    return (
      <SectionShell>
        <LoadingState />
      </SectionShell>
    );
  }

  if (!status) {
    return (
      <SectionShell>
        <ErrorState onRetry={() => void loadStatus()} />
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-title text-white">{ui.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">{ui.subtitle}</p>
          </div>
          <Link href={dashboardPathForRole(user?.role ?? "PLAYER")} className="button-secondary">
            {ui.back}
          </Link>
        </div>

        {feedback ? <NoticePanel tone={feedback.tone === "error" ? "error" : "default"}>{feedback.message}</NoticePanel> : null}

        <SurfaceCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{status.linked ? ui.linked : ui.notLinked}</p>
              <p className="mt-1 text-sm text-muted">
                {status.telegramUsername ? `${ui.username}: @${status.telegramUsername}` : `${ui.username}: -`}
              </p>
              <p className="mt-1 text-sm text-muted">{`${ui.telegramId}: ${status.telegramId ?? "-"}`}</p>
              <p className="mt-1 text-sm text-muted">
                {`${ui.linkedAt}: ${status.telegramLinkedAt ? formatDate(status.telegramLinkedAt) : "-"}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GlowButton onClick={() => void handleGenerate()} disabled={isPending}>
                {isPending ? "..." : linkRequest ? ui.regenerate : ui.generate}
              </GlowButton>
              {status.linked ? (
                <GlowButton variant="secondary" onClick={() => void handleUnlink()} disabled={isPending}>
                  {ui.unlink}
                </GlowButton>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        {linkRequest ? (
          <SurfaceCard className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">{ui.codeTitle}</p>
              <p className="mt-2 text-sm text-muted">{ui.codeHint}</p>
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-[#12201b] px-4 py-3 font-mono text-lg text-white">
              {linkRequest.code}
            </div>
            <p className="text-sm text-muted">
              {ui.expiresAt}: {formatDate(linkRequest.expiresAt)}
            </p>
            {linkRequest.deepLink ? (
              <a href={linkRequest.deepLink} className="button-secondary inline-flex" target="_blank" rel="noreferrer">
                {ui.openBot}
              </a>
            ) : (
              <NoticePanel tone="empty">{ui.fallbackBot}</NoticePanel>
            )}
          </SurfaceCard>
        ) : null}
      </div>
    </SectionShell>
  );
}
