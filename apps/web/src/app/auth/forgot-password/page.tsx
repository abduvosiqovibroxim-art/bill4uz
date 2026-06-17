"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ErrorState } from "@/components/DataState";
import { FormInput, GlowButton, NoticePanel } from "@/components/ui";
import { forgotPasswordRequest } from "@/lib/auth/client";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await forgotPasswordRequest(email);
      setMessage(t("auth.forgotSent"));
    } catch (cause) {
      setError(
        getUserFacingApiError(cause, {
          locale,
          t,
          fallbackKey: "auth.forgotFailed",
          statusKeys: {
            400: "auth.forgotFailed",
            401: "auth.forgotFailed",
            403: "auth.forgotFailed",
            409: "auth.forgotFailed"
          },
          debugLabel: "auth-forgot-password"
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card space-y-4">
          <p className="eyebrow">{t("auth.forgotTitle")}</p>
          <h1 className="section-title text-white">{t("auth.forgotTitle")}</h1>
          <p className="text-sm text-muted">{t("auth.forgotSubtitle")}</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("forms.email")} />
            {error ? <ErrorState message={error} /> : null}
            {message ? <NoticePanel>{message}</NoticePanel> : null}
            <GlowButton className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "..." : t("auth.forgotAction")}
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
