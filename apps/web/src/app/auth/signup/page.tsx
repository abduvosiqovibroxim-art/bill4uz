"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/DataState";
import { useAuth } from "@/components/AuthProvider";
import { FormInput, FormSelect, GlowButton, NoticePanel } from "@/components/ui";
import { useCitiesQuery } from "@/lib/api/hooks";
import { ApiError } from "@/lib/api/client";
import { getApiPayloadMessage, getUserFacingApiError } from "@/lib/api/errors";
import { resolvePostAuthPath } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";

type SignUpRole = "PLAYER" | "ORGANIZER";

const roleDescriptions: Record<SignUpRole, Record<"ru" | "uz" | "en", string>> = {
  PLAYER: {
    ru: "Игрок: участвует в турнирах",
    uz: "O'yinchi: turnirlarda qatnashadi",
    en: "Player: joins tournaments"
  },
  ORGANIZER: {
    ru: "Организатор: создаёт и ведёт турниры",
    uz: "Tashkilotchi: turnir yaratadi va boshqaradi",
    en: "Organizer: creates and runs tournaments"
  }
};

const signupConflictCopy: Record<"ru" | "uz" | "en", { generic: string; phone: string; email: string }> = {
  ru: {
    generic: "Такой пользователь уже зарегистрирован",
    phone: "Этот телефон уже зарегистрирован",
    email: "Этот email уже зарегистрирован"
  },
  uz: {
    generic: "Bunday foydalanuvchi allaqachon ro'yxatdan o'tgan",
    phone: "Bu telefon raqami allaqachon ro'yxatdan o'tgan",
    email: "Bu email allaqachon ro'yxatdan o'tgan"
  },
  en: {
    generic: "This user is already registered",
    phone: "This phone is already registered",
    email: "This email is already registered"
  }
};

export default function SignUpPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, signUp } = useAuth();
  const citiesQuery = useCitiesQuery();
  const next = searchParams.get("next");
  const [role, setRole] = useState<SignUpRole>("PLAYER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const signedUpUser = await signUp({
        role,
        firstName,
        lastName,
        phone,
        cityId,
        password
      });

      const target = resolvePostAuthPath(signedUpUser, next);
      startTransition(() => {
        router.replace(target);
        router.refresh();
      });
    } catch (cause) {
      const conflictMessage = resolveSignupConflictMessage(cause, locale);
      if (conflictMessage) {
        setError(conflictMessage);
      } else {
        setError(
          getUserFacingApiError(cause, {
            locale,
            t,
            fallbackKey: "auth.signupSimple.failed",
            statusKeys: {
              400: "auth.signupSimple.failed",
              401: "auth.signupSimple.failed",
              403: "auth.signupSimple.failed"
            },
            debugLabel: "auth-signup"
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card space-y-5">
        <div className="space-y-3">
          <div className="auth-brand">
            <Image
              src="/brand/bill4-logo.png"
              alt="Bill4"
              width={1007}
              height={230}
              priority
              className="brand-logo brand-logo-light"
            />
            <Image
              src="/brand/bill4-logo-dark.png"
              alt=""
              aria-hidden="true"
              width={1007}
              height={230}
              priority
              className="brand-logo brand-logo-dark"
            />
          </div>
          <p className="eyebrow">{t("auth.signupSimple.eyebrow")}</p>
          <h1 className="section-title" style={{ color: "var(--color-text, var(--text))" }}>{t("auth.signupSimple.title")}</h1>
          <p className="text-sm" style={{ color: "var(--color-muted, var(--muted))" }}>{t("auth.signupSimple.subtitle")}</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <FormSelect value={role} onChange={(event) => setRole(event.target.value as SignUpRole)}>
            <option value="PLAYER">{t("roles.player")}</option>
            <option value="ORGANIZER">{t("roles.organizer")}</option>
          </FormSelect>
          <p className="text-xs leading-5 text-muted">{roleDescriptions[role][locale]}</p>
          <FormInput placeholder={t("auth.signupSimple.firstNamePlaceholder")} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          <FormInput placeholder={t("auth.signupSimple.lastNamePlaceholder")} value={lastName} onChange={(event) => setLastName(event.target.value)} />
          <FormInput placeholder={t("auth.signupSimple.phonePlaceholder")} value={phone} onChange={(event) => setPhone(event.target.value)} />
          <FormSelect value={cityId} onChange={(event) => setCityId(event.target.value)} disabled={citiesQuery.isPending || citiesQuery.isError}>
            <option value="">{t("admin.common.selectCity")}</option>
            {(citiesQuery.data ?? []).map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </FormSelect>
          <FormInput placeholder={t("auth.signupSimple.passwordPlaceholder")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {citiesQuery.isError ? <ErrorState onRetry={() => citiesQuery.refetch()} /> : null}
          {error ? <ErrorState message={error} /> : null}
          <GlowButton
            className="w-full"
            type="submit"
            disabled={isSubmitting || citiesQuery.isPending || citiesQuery.isError || !cityId || !firstName.trim() || !lastName.trim()}
          >
            {isSubmitting ? "..." : t("auth.signupSimple.action")}
          </GlowButton>
        </form>

        <NoticePanel>
          <Link className="text-sm text-muted transition hover:text-white" href="/auth/signin">
            {t("auth.signupSimple.signinLink")}
          </Link>
        </NoticePanel>
      </div>
    </div>
  );
}

function resolveSignupConflictMessage(cause: unknown, locale: "ru" | "uz" | "en") {
  if (!(cause instanceof ApiError) || cause.status !== 409) {
    return null;
  }

  const payloadMessage = getApiPayloadMessage(cause.payload)?.toLowerCase() ?? "";
  const copy = signupConflictCopy[locale];

  if (!payloadMessage) {
    return copy.generic;
  }

  if (containsAny(payloadMessage, ["телефон", "номер", "phone", "telefon", "raqam"])) {
    return copy.phone;
  }

  if (containsAny(payloadMessage, ["email", "e-mail", "почт"])) {
    return copy.email;
  }

  return copy.generic;
}

function containsAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}
