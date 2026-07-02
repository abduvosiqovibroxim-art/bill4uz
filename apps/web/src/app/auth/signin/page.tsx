"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/DataState";
import { FormInput, GlowButton } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { getUserFacingApiError } from "@/lib/api/errors";
import { getSocialAuthStartUrl, resolvePostAuthPath, type SocialAuthProvider } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";

export default function SignInPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const next = searchParams.get("next");
  const providerError = searchParams.get("error");
  const providerErrorMessage = providerError ? t("auth.signInFailed") : null;

  const socialLinks = useMemo(
    () =>
      ([
        { id: "google", label: t("auth.socialGoogle"), badge: "G" },
        { id: "apple", label: t("auth.socialApple"), badge: "A" },
        { id: "facebook", label: t("auth.socialFacebook"), badge: "f" }
      ] as Array<{ id: SocialAuthProvider; label: string; badge: string }>).map((provider) => ({
        ...provider,
        href: getSocialAuthStartUrl(provider.id, next)
      })),
    [next, t]
  );

  useEffect(() => {
    if (status === "authenticated" && user) {
      const target = resolvePostAuthPath(user, next);
      startTransition(() => {
        router.replace(target);
        router.refresh();
      });
    }
  }, [next, router, status, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const signedInUser = await signIn({ identifier, password });
      const target = resolvePostAuthPath(signedInUser, next);
      startTransition(() => {
        router.replace(target);
        router.refresh();
      });
    } catch (cause) {
      setError(
        getUserFacingApiError(cause, {
          locale,
          t,
          fallbackKey: "auth.signInFailed",
          statusKeys: {
            400: "auth.signInFailed",
            401: "auth.signInFailed",
            403: "auth.signInFailed",
            409: "auth.signInFailed"
          },
          debugLabel: "auth-signin"
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="mb-6 space-y-3 text-center">
          <div className="auth-brand">
            <Image
              src="/brand/bill4-logo.png"
              alt="Bill4"
              width={424}
              height={374}
              priority
              className="brand-logo brand-logo-light"
            />
            <Image
              src="/brand/bill4-logo-dark.png"
              alt=""
              aria-hidden="true"
              width={424}
              height={374}
              priority
              className="brand-logo brand-logo-dark"
            />
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text, var(--text))" }}>{t("auth.signinTitle")}</h1>
          <p className="text-sm" style={{ color: "var(--color-muted, var(--muted))" }}>{t("auth.signinSubtitle")}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            placeholder={t("auth.identifierPlaceholder")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
          />
          <FormInput
            placeholder={t("auth.passwordPlaceholder")}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          {error || providerErrorMessage ? <ErrorState message={error ?? providerErrorMessage ?? ""} /> : null}
          <GlowButton className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : t("auth.signinAction")}
          </GlowButton>
        </form>

        <div className="my-5 auth-divider">{t("auth.orDivider")}</div>

        <div className="space-y-3">
          {socialLinks.map((provider) => (
            <a key={provider.id} href={provider.href} className="social-auth-link">
              <span className="social-auth-badge">{provider.badge}</span>
              <span>{provider.label}</span>
            </a>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted">
          <Link className="transition hover:text-white" href="/auth/forgot-password">
            {t("auth.forgotLink")}
          </Link>
          <Link className="transition hover:text-white" href="/auth/signup">
            {t("auth.createAccountLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
