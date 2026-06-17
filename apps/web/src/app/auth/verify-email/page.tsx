"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/DataState";
import { FormInput, GlowButton, NoticePanel } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { verifyEmailRequest } from "@/lib/auth/client";
import { useAuthStore } from "@/lib/auth/store";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dashboardPathForRole } = useAuth();
  const autoSubmitRef = useRef(false);
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify(nextToken = token) {
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await verifyEmailRequest(nextToken);
      useAuthStore.getState().setSession(session);
      startTransition(() => {
        router.replace(dashboardPathForRole(session.user.role));
      });
    } catch (cause) {
      setError(
        getUserFacingApiError(cause, {
          locale,
          t,
          fallbackKey: "auth.verifyFailed",
          statusKeys: {
            400: "auth.verifyFailed",
            401: "auth.verifyFailed",
            403: "auth.verifyFailed",
            409: "auth.verifyFailed"
          },
          debugLabel: "auth-verify-email"
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const searchToken = searchParams.get("token") ?? "";

    if (!searchToken || autoSubmitRef.current) {
      return;
    }

    autoSubmitRef.current = true;
    void handleVerify(searchToken);
  }, [searchParams]);

  return (
    <div className="auth-screen">
      <div className="auth-card space-y-4">
          <p className="eyebrow">{t("auth.verifyTitle")}</p>
          <h1 className="section-title text-white">{t("auth.verifyTitle")}</h1>
          <p className="text-sm text-muted">{t("auth.verifySubtitle")}</p>
          <FormInput value={token} onChange={(event) => setToken(event.target.value)} placeholder={t("auth.verifyTokenPlaceholder")} />
          {error ? <ErrorState message={error} /> : null}
          <GlowButton className="w-full" onClick={() => void handleVerify()} disabled={isSubmitting || !token.trim()}>
            {isSubmitting ? "..." : t("auth.verifyAction")}
          </GlowButton>
          <NoticePanel>
            <Link className="text-sm text-muted transition hover:text-white" href="/auth/signin">
              {t("auth.backToSignin")}
            </Link>
          </NoticePanel>
      </div>
    </div>
  );
}
