"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/DataState";
import { useAuth } from "@/components/AuthProvider";
import { FormInput, GlowButton, NoticePanel } from "@/components/ui";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

export default function ChangePasswordPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { hydrated, status, user, changePassword, dashboardPathForRole } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated || status === "loading") {
      return;
    }

    if (status !== "authenticated" || !user) {
      startTransition(() => {
        router.replace("/auth/signin?next=%2Fauth%2Fchange-password&reason=auth_required");
      });
    }
  }, [hydrated, router, status, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsMismatch"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await changePassword({ currentPassword, newPassword });
      setMessage(t("auth.changePasswordSuccess"));
      startTransition(() => {
        router.replace(dashboardPathForRole(updatedUser.role));
      });
    } catch (cause) {
      setError(
        getUserFacingApiError(cause, {
          locale,
          t,
          fallbackKey: "auth.changePasswordFailed",
          statusKeys: {
            400: "auth.changePasswordFailed",
            401: "auth.changePasswordFailed",
            403: "auth.changePasswordFailed",
            409: "auth.changePasswordFailed"
          },
          debugLabel: "auth-change-password"
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card space-y-4">
          <p className="eyebrow">{t("auth.changePasswordTitle")}</p>
          <h1 className="section-title text-white">{t("auth.changePasswordTitle")}</h1>
          <p className="text-sm text-muted">{t("auth.changePasswordSubtitle")}</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormInput
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder={t("auth.currentPasswordPlaceholder")}
            />
            <FormInput type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={t("auth.newPasswordPlaceholder")} />
            <FormInput
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("auth.confirmPasswordPlaceholder")}
            />
            {error ? <ErrorState message={error} /> : null}
            {message ? <NoticePanel>{message}</NoticePanel> : null}
            <GlowButton className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "..." : t("auth.changePasswordAction")}
            </GlowButton>
          </form>
      </div>
    </div>
  );
}
