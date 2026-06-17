"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import {
  useCitiesQuery,
  useClubsQuery,
  useCountriesQuery,
  useCreateClubAdminMutation,
  useDeleteClubAdminMutation,
  useImportClubsFromMapAdminMutation,
  useUpdateClubAdminMutation
} from "@/lib/api/hooks";
import { getApiPayloadMessage, getUserFacingApiError } from "@/lib/api/errors";
import { FormInput, FormSelect, FormTextarea, GlowButton, NoticePanel, SurfaceCard } from "@/components/ui";
import type { Club } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export default function AdminClubsPage() {
  const { locale, t, text } = useI18n();
  const clubsQuery = useClubsQuery();
  const countriesQuery = useCountriesQuery();
  const citiesQuery = useCitiesQuery();
  const createMutation = useCreateClubAdminMutation();
  const updateMutation = useUpdateClubAdminMutation();
  const deleteMutation = useDeleteClubAdminMutation();
  const importMutation = useImportClubsFromMapAdminMutation();
  const [feedback, setFeedback] = useState<{ message: string; tone: "default" | "error" } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    countryId: "",
    cityId: "",
    address: "",
    region: "",
    district: "",
    phone: "",
    telegram: "",
    workingHours: "10:00-23:00",
    tables: "0",
    vipTables: "0",
    regularMorningPriceMinor: "",
    regularEveningPriceMinor: "",
    vipMorningPriceMinor: "",
    vipEveningPriceMinor: "",
    disciplines: "Свободная пирамида",
    services: "",
    coverUrl: "",
    lat: "",
    lng: ""
  });

  const availableCities = useMemo(
    () => (citiesQuery.data ?? []).filter((city) => !form.countryId || city.countryId === form.countryId),
    [citiesQuery.data, form.countryId]
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    try {
      await createMutation.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        countryId: form.countryId,
        cityId: form.cityId,
        address: form.address,
        region: form.region || undefined,
        district: form.district || undefined,
        phone: form.phone,
        telegram: form.telegram,
        workingHours: form.workingHours,
        tables: Number(form.tables),
        vipTables: Number(form.vipTables),
        regularMorningPriceMinor: optionalNumber(form.regularMorningPriceMinor),
        regularEveningPriceMinor: optionalNumber(form.regularEveningPriceMinor),
        vipMorningPriceMinor: optionalNumber(form.vipMorningPriceMinor),
        vipEveningPriceMinor: optionalNumber(form.vipEveningPriceMinor),
        disciplines: splitList(form.disciplines),
        services: splitList(form.services),
        coverUrl: form.coverUrl || undefined,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined
      });
      setForm({
        name: "",
        description: "",
        countryId: "",
        cityId: "",
        address: "",
        region: "",
        district: "",
        phone: "",
        telegram: "",
        workingHours: "10:00-23:00",
        tables: "0",
        vipTables: "0",
        regularMorningPriceMinor: "",
        regularEveningPriceMinor: "",
        vipMorningPriceMinor: "",
        vipEveningPriceMinor: "",
        disciplines: "Свободная пирамида",
        services: "",
        coverUrl: "",
        lat: "",
        lng: ""
      });
      setFeedback({ message: getAdminSuccessMessage(locale, "clubCreated"), tone: "default" });
    } catch (error) {
      setFeedback({
        message: getUserFacingApiError(error, { locale, t, debugLabel: "admin-create-club" }),
        tone: "error"
      });
    }
  }

  if (clubsQuery.isPending || countriesQuery.isPending || citiesQuery.isPending) {
    return <LoadingState />;
  }

  if (clubsQuery.isError || countriesQuery.isError || citiesQuery.isError) {
    return <ErrorState onRetry={() => {
      void clubsQuery.refetch();
      void countriesQuery.refetch();
      void citiesQuery.refetch();
    }} />;
  }

  const clubs = clubsQuery.data ?? [];
  const countries = countriesQuery.data ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader titleKey="admin.clubs.title" subtitleKey="admin.clubs.subtitle" />

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Обновить бильярдные с карты</h2>
            <p className="mt-1 text-sm text-muted">Импорт из Yandex Organization Search API.</p>
          </div>
          <GlowButton
            variant="secondary"
            disabled={importMutation.isPending}
            onClick={() =>
              void (async () => {
                setFeedback(null);
                try {
                  const result = await importMutation.mutateAsync();
                  setFeedback({
                    tone: "default",
                    message: `Добавлено ${result.added}, обновлено ${result.updated}, пропущено ${result.skipped}`
                  });
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getApiPayloadMessage(error instanceof Error && "payload" in error ? (error as { payload: unknown }).payload : null) ??
                      getUserFacingApiError(error, { locale, t, debugLabel: "admin-import-clubs-map" })
                  });
                }
              })()
            }
          >
            {importMutation.isPending ? "..." : "Обновить бильярдные с карты"}
          </GlowButton>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        {feedback ? <NoticePanel tone={feedback.tone === "error" ? "error" : "default"} className="mb-4">{feedback.message}</NoticePanel> : null}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
          <FormInput placeholder={t("admin.clubs.namePlaceholder")} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <FormInput placeholder={t("admin.clubs.addressPlaceholder")} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
          <FormInput placeholder={locale === "ru" ? "Регион" : locale === "uz" ? "Hudud" : "Region"} value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} />
          <FormInput placeholder={locale === "ru" ? "Район" : locale === "uz" ? "Tuman" : "District"} value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} />
          <FormSelect value={form.countryId} onChange={(event) => setForm((current) => ({ ...current, countryId: event.target.value, cityId: "" }))}>
            <option value="">{t("admin.common.selectCountry")}</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </FormSelect>
          <FormSelect value={form.cityId} onChange={(event) => setForm((current) => ({ ...current, cityId: event.target.value }))}>
            <option value="">{t("admin.common.selectCity")}</option>
            {availableCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </FormSelect>
          <FormInput placeholder={t("admin.clubs.phonePlaceholder")} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <FormInput placeholder={t("admin.clubs.telegramPlaceholder")} value={form.telegram} onChange={(event) => setForm((current) => ({ ...current, telegram: event.target.value }))} />
          <FormInput placeholder="10:00-23:00" value={form.workingHours} onChange={(event) => setForm((current) => ({ ...current, workingHours: event.target.value }))} />
          <FormInput placeholder={t("admin.clubs.tablesPlaceholder")} type="number" value={form.tables} onChange={(event) => setForm((current) => ({ ...current, tables: event.target.value }))} />
          <FormInput placeholder="VIP tables" type="number" value={form.vipTables} onChange={(event) => setForm((current) => ({ ...current, vipTables: event.target.value }))} />
          <FormInput placeholder="Regular morning price" type="number" value={form.regularMorningPriceMinor} onChange={(event) => setForm((current) => ({ ...current, regularMorningPriceMinor: event.target.value }))} />
          <FormInput placeholder="Regular evening price" type="number" value={form.regularEveningPriceMinor} onChange={(event) => setForm((current) => ({ ...current, regularEveningPriceMinor: event.target.value }))} />
          <FormInput placeholder="VIP morning price" type="number" value={form.vipMorningPriceMinor} onChange={(event) => setForm((current) => ({ ...current, vipMorningPriceMinor: event.target.value }))} />
          <FormInput placeholder="VIP evening price" type="number" value={form.vipEveningPriceMinor} onChange={(event) => setForm((current) => ({ ...current, vipEveningPriceMinor: event.target.value }))} />
          <FormInput
            placeholder={t("admin.clubs.disciplinesPlaceholder")}
            value={form.disciplines}
            onChange={(event) => setForm((current) => ({ ...current, disciplines: event.target.value }))}
          />
          <FormInput
            placeholder={locale === "ru" ? "Услуги через запятую" : locale === "uz" ? "Xizmatlar, vergul bilan" : "Services, comma-separated"}
            value={form.services}
            onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))}
          />
          <FormInput
            placeholder={locale === "ru" ? "Ссылка на обложку" : locale === "uz" ? "Muqova havolasi" : "Cover URL"}
            value={form.coverUrl}
            onChange={(event) => setForm((current) => ({ ...current, coverUrl: event.target.value }))}
          />
          <FormInput placeholder={t("admin.clubs.latPlaceholder")} value={form.lat} onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))} />
          <FormInput placeholder={t("admin.clubs.lngPlaceholder")} value={form.lng} onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))} />
          <FormTextarea
            className="md:col-span-2"
            placeholder={t("admin.clubs.descriptionPlaceholder")}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <GlowButton className="md:col-span-2" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "..." : `${t("admin.actions.create")} ${t("admin.nav.clubs").toLowerCase()}`}
          </GlowButton>
        </form>
      </SurfaceCard>

      {clubs.length === 0 ? <EmptyState message={t("admin.clubs.empty")} /> : null}
      {clubs.map((club) => (
        <ClubRow
          key={club.id}
          club={club}
          onSave={(input) => updateMutation.mutateAsync({ id: club.id, input })}
          onDelete={async () => {
            if (window.confirm(`${t("admin.clubs.deleteConfirm")} ${text(club.name)}?`)) {
              await deleteMutation.mutateAsync(club.id);
            }
          }}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          locale={locale}
        />
      ))}
    </div>
  );
}

function ClubRow({
  club,
  onSave,
  onDelete,
  isUpdating,
  isDeleting,
  locale
}: {
  club: Club;
  onSave: (input: {
    name: string;
    description?: string;
    address: string;
    region?: string;
    district?: string;
    phone: string;
    telegram: string;
    workingHours?: string;
    tables: number;
    vipTables?: number;
    regularMorningPriceMinor?: number;
    regularEveningPriceMinor?: number;
    vipMorningPriceMinor?: number;
    vipEveningPriceMinor?: number;
    disciplines: string[];
    services?: string[];
    coverUrl?: string;
    lat?: number;
    lng?: number;
  }) => Promise<unknown>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  locale: "ru" | "uz" | "en";
}) {
  const { t, text } = useI18n();
  const [feedback, setFeedback] = useState<{ message: string; tone: "default" | "error" } | null>(null);
  const [name, setName] = useState(text(club.name));
  const [description, setDescription] = useState(text(club.description));
  const [address, setAddress] = useState(text(club.address));
  const [region, setRegion] = useState(club.region ?? "");
  const [district, setDistrict] = useState(club.district ?? "");
  const [phone, setPhone] = useState(club.phone);
  const [telegram, setTelegram] = useState(club.telegram);
  const [workingHours, setWorkingHours] = useState(text(club.workHours));
  const [tables, setTables] = useState(String(club.tables));
  const [vipTables, setVipTables] = useState(String(club.vipTableCount ?? 0));
  const [regularMorningPriceMinor, setRegularMorningPriceMinor] = useState(numberInputValue(club.regularMorningPriceMinor));
  const [regularEveningPriceMinor, setRegularEveningPriceMinor] = useState(numberInputValue(club.regularEveningPriceMinor));
  const [vipMorningPriceMinor, setVipMorningPriceMinor] = useState(numberInputValue(club.vipMorningPriceMinor));
  const [vipEveningPriceMinor, setVipEveningPriceMinor] = useState(numberInputValue(club.vipEveningPriceMinor));
  const [lat, setLat] = useState(numberInputValue(club.latitude ?? club.lat));
  const [lng, setLng] = useState(numberInputValue(club.longitude ?? club.lng));
  const [disciplines, setDisciplines] = useState(club.disciplines.join(", "));
  const [services, setServices] = useState(club.services.join(", "));
  const [coverUrl, setCoverUrl] = useState(club.coverUrl ?? "");

  return (
    <SurfaceCard className="space-y-3">
      {feedback ? <NoticePanel tone={feedback.tone === "error" ? "error" : "default"}>{feedback.message}</NoticePanel> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput value={name} onChange={(event) => setName(event.target.value)} />
        <FormInput value={address} onChange={(event) => setAddress(event.target.value)} />
        <FormInput value={region} onChange={(event) => setRegion(event.target.value)} placeholder={locale === "ru" ? "Регион" : locale === "uz" ? "Hudud" : "Region"} />
        <FormInput value={district} onChange={(event) => setDistrict(event.target.value)} placeholder={locale === "ru" ? "Район" : locale === "uz" ? "Tuman" : "District"} />
        <FormInput value={phone} onChange={(event) => setPhone(event.target.value)} />
        <FormInput value={telegram} onChange={(event) => setTelegram(event.target.value)} />
        <FormInput value={workingHours} onChange={(event) => setWorkingHours(event.target.value)} placeholder="10:00-23:00" />
        <FormInput value={tables} type="number" onChange={(event) => setTables(event.target.value)} />
        <FormInput value={vipTables} type="number" onChange={(event) => setVipTables(event.target.value)} placeholder="VIP tables" />
        <FormInput value={regularMorningPriceMinor} type="number" onChange={(event) => setRegularMorningPriceMinor(event.target.value)} placeholder="Regular morning price" />
        <FormInput value={regularEveningPriceMinor} type="number" onChange={(event) => setRegularEveningPriceMinor(event.target.value)} placeholder="Regular evening price" />
        <FormInput value={vipMorningPriceMinor} type="number" onChange={(event) => setVipMorningPriceMinor(event.target.value)} placeholder="VIP morning price" />
        <FormInput value={vipEveningPriceMinor} type="number" onChange={(event) => setVipEveningPriceMinor(event.target.value)} placeholder="VIP evening price" />
        <FormInput value={lat} onChange={(event) => setLat(event.target.value)} placeholder="Latitude" />
        <FormInput value={lng} onChange={(event) => setLng(event.target.value)} placeholder="Longitude" />
        <FormInput value={disciplines} onChange={(event) => setDisciplines(event.target.value)} />
        <FormInput value={services} onChange={(event) => setServices(event.target.value)} placeholder={locale === "ru" ? "Услуги через запятую" : locale === "uz" ? "Xizmatlar, vergul bilan" : "Services, comma-separated"} />
        <FormInput value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder={locale === "ru" ? "Ссылка на обложку" : locale === "uz" ? "Muqova havolasi" : "Cover URL"} />
        <FormTextarea className="md:col-span-2" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <GlowButton
          variant="secondary"
          onClick={() =>
            void (async () => {
              setFeedback(null);

              try {
                await onSave({
                  name,
                  description: description || undefined,
                  address,
                  region,
                  district,
                  phone,
                  telegram,
                  workingHours,
                  tables: Number(tables),
                  vipTables: optionalNumber(vipTables),
                  regularMorningPriceMinor: optionalNumber(regularMorningPriceMinor),
                  regularEveningPriceMinor: optionalNumber(regularEveningPriceMinor),
                  vipMorningPriceMinor: optionalNumber(vipMorningPriceMinor),
                  vipEveningPriceMinor: optionalNumber(vipEveningPriceMinor),
                  disciplines: splitList(disciplines),
                  services: splitList(services),
                  coverUrl: coverUrl || undefined,
                  lat: optionalNumber(lat),
                  lng: optionalNumber(lng)
                });
                setFeedback({ message: getAdminSuccessMessage(locale, "clubUpdated"), tone: "default" });
              } catch (error) {
                setFeedback({
                  message: getUserFacingApiError(error, { locale, t, debugLabel: "admin-update-club" }),
                  tone: "error"
                });
              }
            })()
          }
          disabled={isUpdating}
        >
          {isUpdating ? "..." : t("admin.actions.save")}
        </GlowButton>
        <GlowButton
          variant="secondary"
          onClick={() =>
            void (async () => {
              setFeedback(null);

              try {
                await onDelete();
                setFeedback({ message: getAdminSuccessMessage(locale, "clubDeleted"), tone: "default" });
              } catch (error) {
                setFeedback({
                  message: getUserFacingApiError(error, { locale, t, debugLabel: "admin-delete-club" }),
                  tone: "error"
                });
              }
            })()
          }
          disabled={isDeleting}
        >
          {isDeleting ? "..." : t("admin.actions.delete")}
        </GlowButton>
      </div>
    </SurfaceCard>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberInputValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function getAdminSuccessMessage(
  locale: "ru" | "uz" | "en",
  key: "clubCreated" | "clubUpdated" | "clubDeleted"
) {
  const messages = {
    ru: {
      clubCreated: "Бильярдная создана.",
      clubUpdated: "Бильярдная обновлена.",
      clubDeleted: "Бильярдная удалена."
    },
    uz: {
      clubCreated: "Bilyard joyi yaratildi.",
      clubUpdated: "Bilyard joyi yangilandi.",
      clubDeleted: "Bilyard joyi o'chirildi."
    },
    en: {
      clubCreated: "Billiard place created.",
      clubUpdated: "Billiard place updated.",
      clubDeleted: "Billiard place deleted."
    }
  } as const;

  return messages[locale][key];
}
