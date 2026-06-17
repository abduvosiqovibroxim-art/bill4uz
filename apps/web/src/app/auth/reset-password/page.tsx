"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/DataState";
import { FormInput, GlowButton, NoticePanel } from "@/components/ui";
import { resetPasswordRequest } from "@/lib/auth/client";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("auth.passwordsMismatch"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await resetPasswordRequest(token, password);
      setMessage(t("auth.resetSuccess"));
      router.prefetch("/auth/signin");
    } catch (cause) {
      setError(
        getUserFacingApiError(cause, {
          locale,
          t,
          fallbackKey: "auth.resetFailed",
          statusKeys: {
            400: "auth.resetFailed",
            401: "auth.resetFailed",
            403: "auth.resetFailed",
            409: "auth.resetFailed"
          },
          debugLabel: "auth-reset-password"
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card space-y-4">
          <p className="eyebrow">{t("auth.resetTitle")}</p>
          <h1 className="section-title text-white">{t("auth.resetTitle")}</h1>
          <p className="text-sm text-muted">{t("auth.resetSubtitle")}</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormInput value={token} onChange={(event) => setToken(event.target.value)} placeholder={t("auth.resetTokenPlaceholder")} />
            <FormInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("auth.newPasswordPlaceholder")} />
            <FormInput
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("auth.confirmPasswordPlaceholder")}
            />
            {error ? <ErrorState message={error} /> : null}
            {message ? <NoticePanel>{message}</NoticePanel> : null}
            <GlowButton className="w-full" type="submit" disabled={isSubmitting || !token.trim()}>
              {isSubmitting ? "..." : t("auth.resetAction")}
            </GlowButton>
          </form>
          <NoticePanel>
            <Link className="text-sm text-muted transition hover:text-white" href="/auth/signin">
              {t("auth.backToSignin")}
            </Link>
          </NoticePanel>
      </div>
    </div>
  );
}
