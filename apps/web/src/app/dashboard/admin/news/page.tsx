"use client";

import { useState, type FormEvent } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import {
  useCreateNewsAdminMutation,
  useDeleteNewsAdminMutation,
  useNewsQuery,
  useUpdateNewsAdminMutation
} from "@/lib/api/hooks";
import { FormInput, FormSelect, FormTextarea, GlowButton, SurfaceCard } from "@/components/ui";
import type { NewsItem } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export default function AdminNewsPage() {
  const { t, text } = useI18n();
  const newsQuery = useNewsQuery();
  const createMutation = useCreateNewsAdminMutation();
  const updateMutation = useUpdateNewsAdminMutation();
  const deleteMutation = useDeleteNewsAdminMutation();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "platform",
    content: "",
    publishedAt: ""
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createMutation.mutateAsync({
      title: form.title,
      slug: form.slug,
      category: form.category,
      content: form.content,
      publishedAt: new Date(form.publishedAt).toISOString()
    });
    setForm({ title: "", slug: "", category: "platform", content: "", publishedAt: "" });
  }

  if (newsQuery.isPending) {
    return <LoadingState />;
  }

  if (newsQuery.isError) {
    return <ErrorState onRetry={() => newsQuery.refetch()} />;
  }

  const items = newsQuery.data ?? [];
  const categoryOptions = [
    { value: "platform", label: t("common.categories.platform") },
    { value: "tournament", label: t("common.categories.tournament") },
    { value: "product", label: t("common.categories.product") },
    { value: "media", label: t("common.categories.media") }
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader titleKey="admin.news.title" subtitleKey="admin.news.subtitle" />

      <SurfaceCard>
        <form className="grid gap-3" onSubmit={handleCreate}>
          <FormInput placeholder={t("admin.news.titlePlaceholder")} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <FormInput placeholder={t("admin.news.slugPlaceholder")} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
          <FormSelect value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
          <FormInput
            placeholder={t("admin.news.publishedAtPlaceholder")}
            inputMode="numeric"
            value={form.publishedAt}
            onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
          />
          <FormTextarea placeholder={t("admin.news.contentPlaceholder")} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
          <GlowButton type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "..." : `${t("admin.actions.create")} ${t("admin.nav.news").toLowerCase()}`}
          </GlowButton>
        </form>
      </SurfaceCard>

      {items.length === 0 ? <EmptyState message={t("admin.news.empty")} /> : null}
      {items.map((item) => (
        <NewsRow
          key={item.id}
          item={item}
          onSave={(input) => updateMutation.mutateAsync({ id: item.id, input })}
          onDelete={async () => {
            if (window.confirm(`${t("admin.news.deleteConfirm")} ${text(item.title)}?`)) {
              await deleteMutation.mutateAsync(item.id);
            }
          }}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      ))}
    </div>
  );
}

function NewsRow({
  item,
  onSave,
  onDelete,
  isUpdating,
  isDeleting
}: {
  item: NewsItem;
  onSave: (input: { title: string; slug?: string; category: string; content: string }) => Promise<unknown>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const { t, text } = useI18n();
  const [title, setTitle] = useState(text(item.title));
  const [slug, setSlug] = useState(item.slug ?? "");
  const [category, setCategory] = useState<string>(item.categoryKey);
  const [content, setContent] = useState(text(item.content));
  const categoryOptions = [
    { value: "platform", label: t("common.categories.platform") },
    { value: "tournament", label: t("common.categories.tournament") },
    { value: "product", label: t("common.categories.product") },
    { value: "media", label: t("common.categories.media") }
  ];

  return (
    <SurfaceCard className="space-y-3">
      <div className="grid gap-3">
        <FormInput value={title} onChange={(event) => setTitle(event.target.value)} />
        <FormInput value={slug} onChange={(event) => setSlug(event.target.value)} />
        <FormSelect value={category} onChange={(event) => setCategory(event.target.value)}>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
        <FormTextarea value={content} onChange={(event) => setContent(event.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <GlowButton variant="secondary" onClick={() => void onSave({ title, slug, category, content })} disabled={isUpdating}>
          {isUpdating ? "..." : t("admin.actions.save")}
        </GlowButton>
        <GlowButton variant="secondary" onClick={() => void onDelete()} disabled={isDeleting}>
          {isDeleting ? "..." : t("admin.actions.delete")}
        </GlowButton>
      </div>
    </SurfaceCard>
  );
}
