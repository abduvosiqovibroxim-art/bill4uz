"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { FormInput, FormTextarea, GlowButton, SectionShell, SurfaceCard } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function ContactsPage() {
  const { t } = useI18n();

  return (
    <SectionShell>
      <SectionHeader eyebrow={t("nav.contacts")} title={t("contacts.title")} subtitle={t("contacts.subtitle")} />
      <SurfaceCard className="grid gap-3 md:grid-cols-2">
        <FormInput placeholder={t("forms.name")} />
        <FormInput placeholder={t("forms.phone")} />
        <FormInput className="md:col-span-2" placeholder={t("forms.email")} />
        <FormTextarea className="md:col-span-2 min-h-32" placeholder={t("forms.request")} />
        <GlowButton className="md:col-span-2" type="submit">
          {t("forms.send")}
        </GlowButton>
      </SurfaceCard>
    </SectionShell>
  );
}
