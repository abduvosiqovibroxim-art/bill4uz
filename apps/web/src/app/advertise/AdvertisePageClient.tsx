"use client";

import { FormEvent, useState } from "react";
import { FormInput, FormTextarea, GlowButton, NoticePanel, SurfaceCard } from "@/components/ui";
import { submitAdvertisingRequest } from "@/lib/api/fetchers";
import { getUserFacingApiError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  perksTitle: string;
  perks: { icon: string; title: string; text: string }[];
  formTitle: string;
  formLead: string;
  name: string;
  contact: string;
  contactHint: string;
  company: string;
  budget: string;
  message: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successText: string;
  validation: string;
};

const copy: Record<"ru" | "uz" | "en", Copy> = {
  ru: {
    eyebrow: "Партнёрство",
    title: "Реклама на Bill4",
    lead: "Размещение рекламы на платформе гарантированно привлечёт внимание спортсменов и болельщиков. Оставьте заявку — мы свяжемся и подберём формат под вашу задачу.",
    perksTitle: "Что мы предлагаем",
    perks: [
      { icon: "🎯", title: "Целевая аудитория", text: "Игроки, организаторы и болельщики бильярда по всему Узбекистану — точное попадание в нишу." },
      { icon: "📐", title: "Форматы размещения", text: "Баннеры на главной, в разделах турниров и рейтинга, спонсорство турниров и упоминания в новостях." },
      { icon: "💬", title: "Гибкие условия", text: "Подберём пакет под ваш бюджет и цели — от разового баннера до постоянного партнёрства." }
    ],
    formTitle: "Оставить заявку",
    formLead: "Заполните форму — заявка попадёт к команде платформы, и мы свяжемся с вами по указанному контакту.",
    name: "Ваше имя",
    contact: "Контакт (телефон, Telegram или e-mail)",
    contactHint: "Как с вами связаться",
    company: "Компания или бренд (необязательно)",
    budget: "Ориентировочный бюджет (необязательно)",
    message: "Сообщение",
    messagePlaceholder: "Расскажите, что хотите рекламировать и какие форматы интересны",
    submit: "Отправить заявку",
    submitting: "Отправляем…",
    successTitle: "Заявка отправлена!",
    successText: "Спасибо! Мы получили вашу заявку и свяжемся с вами в ближайшее время.",
    validation: "Заполните имя, контакт и сообщение."
  },
  uz: {
    eyebrow: "Hamkorlik",
    title: "Bill4'da reklama",
    lead: "Platformada reklama joylashtirish sportchilar va muxlislar e'tiborini kafolatli jalb qiladi. So'rov qoldiring — biz bog'lanib, vazifangizga mos format tanlaymiz.",
    perksTitle: "Biz nimani taklif qilamiz",
    perks: [
      { icon: "🎯", title: "Maqsadli auditoriya", text: "Butun O'zbekiston bo'ylab bilyard o'yinchilari, tashkilotchilari va muxlislari — aniq nishonga tegish." },
      { icon: "📐", title: "Joylashtirish formatlari", text: "Bosh sahifa, turnirlar va reyting bo'limlaridagi bannerlar, turnir homiyligi va yangiliklardagi eslatmalar." },
      { icon: "💬", title: "Moslashuvchan shartlar", text: "Byudjet va maqsadingizga mos paket — bir martalik bannerdan doimiy hamkorlikkacha." }
    ],
    formTitle: "So'rov qoldirish",
    formLead: "Formani to'ldiring — so'rov platforma jamoasiga tushadi va biz ko'rsatilgan kontakt orqali bog'lanamiz.",
    name: "Ismingiz",
    contact: "Kontakt (telefon, Telegram yoki e-mail)",
    contactHint: "Siz bilan qanday bog'lanish",
    company: "Kompaniya yoki brend (ixtiyoriy)",
    budget: "Taxminiy byudjet (ixtiyoriy)",
    message: "Xabar",
    messagePlaceholder: "Nimani reklama qilmoqchisiz va qaysi formatlar qiziq ekanini yozing",
    submit: "So'rov yuborish",
    submitting: "Yuborilmoqda…",
    successTitle: "So'rov yuborildi!",
    successText: "Rahmat! So'rovingizni qabul qildik va tez orada siz bilan bog'lanamiz.",
    validation: "Ism, kontakt va xabarni to'ldiring."
  },
  en: {
    eyebrow: "Partnership",
    title: "Advertising on Bill4",
    lead: "Advertising on the platform is guaranteed to draw the attention of athletes and fans. Leave a request — we will reach out and find the right format for your goal.",
    perksTitle: "What we offer",
    perks: [
      { icon: "🎯", title: "Targeted audience", text: "Billiard players, organizers and fans across Uzbekistan — a precise niche hit." },
      { icon: "📐", title: "Placement formats", text: "Banners on the home page, in the tournaments and rating sections, tournament sponsorship and news mentions." },
      { icon: "💬", title: "Flexible terms", text: "We tailor a package to your budget and goals — from a single banner to an ongoing partnership." }
    ],
    formTitle: "Leave a request",
    formLead: "Fill in the form — your request reaches the platform team and we'll contact you via the details you provide.",
    name: "Your name",
    contact: "Contact (phone, Telegram or e-mail)",
    contactHint: "How to reach you",
    company: "Company or brand (optional)",
    budget: "Approximate budget (optional)",
    message: "Message",
    messagePlaceholder: "Tell us what you want to advertise and which formats interest you",
    submit: "Send request",
    submitting: "Sending…",
    successTitle: "Request sent!",
    successText: "Thank you! We've received your request and will get in touch shortly.",
    validation: "Please fill in name, contact and message."
  }
};

export function AdvertisePageClient() {
  const { locale, t } = useI18n();
  const c = copy[locale];

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError(c.validation);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAdvertisingRequest({
        name: name.trim(),
        contact: contact.trim(),
        company: company.trim() || undefined,
        budget: budget.trim() || undefined,
        message: message.trim()
      });
      setSuccess(true);
    } catch (cause) {
      setError(getUserFacingApiError(cause, { locale, t, debugLabel: "advertising-request" }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="portal-wrap">
      <div className="portal">
        {/* Hero */}
        <section className="portal-hero portal-hero-solo" style={{ padding: "clamp(1.2rem, 3vw, 2rem)" }}>
          <div className="portal-hero-copy">
            <span className="portal-eyebrow">{c.eyebrow}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "clamp(44px, 8vw, 60px)",
                  height: "clamp(44px, 8vw, 60px)",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  borderRadius: "16px",
                  background: "var(--surface-strong)",
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)"
                }}
              >
                📢
              </span>
              <h1 className="portal-hero-title" style={{ fontSize: "clamp(1.8rem, 1.2rem + 2.4vw, 2.6rem)" }}>{c.title}</h1>
            </div>
            <p className="portal-hero-lead">{c.lead}</p>
          </div>
        </section>

        {/* Perks / conditions */}
        <section>
          <div className="portal-head">
            <div>
              <h2 className="portal-title">{c.perksTitle}</h2>
            </div>
          </div>
          <div className="portal-info-grid">
            {c.perks.map((perk) => (
              <div key={perk.title} className="portal-info-card" style={{ cursor: "default" }}>
                <span className="portal-info-icon" aria-hidden="true">{perk.icon}</span>
                <h3 className="portal-info-title">{perk.title}</h3>
                <p className="portal-info-text">{perk.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Request form */}
        <section>
          <div className="portal-head">
            <div>
              <h2 className="portal-title">{c.formTitle}</h2>
              <p className="portal-sub">{c.formLead}</p>
            </div>
          </div>

          {success ? (
            <SurfaceCard>
              <h3 className="portal-info-title" style={{ marginBottom: "0.5rem" }}>{c.successTitle}</h3>
              <p className="portal-info-text">{c.successText}</p>
            </SurfaceCard>
          ) : (
            <SurfaceCard>
              <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
                <FormInput
                  placeholder={c.name}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={120}
                  required
                />
                <FormInput
                  placeholder={c.contact}
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  maxLength={160}
                  required
                />
                <FormInput
                  placeholder={c.company}
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  maxLength={160}
                />
                <FormInput
                  placeholder={c.budget}
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  maxLength={120}
                />
                <FormTextarea
                  className="md:col-span-2 min-h-32"
                  placeholder={c.messagePlaceholder}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={2000}
                  required
                />
                {error ? <NoticePanel tone="error" className="md:col-span-2">{error}</NoticePanel> : null}
                <GlowButton className="md:col-span-2" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? c.submitting : c.submit}
                </GlowButton>
              </form>
            </SurfaceCard>
          )}
        </section>
      </div>
    </div>
  );
}
