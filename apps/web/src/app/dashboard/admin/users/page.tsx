"use client";

import { useState, type FormEvent } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import {
  useCreateUserAdminMutation,
  useDeleteUserAdminMutation,
  useUpdateUserAdminMutation,
  useUsersAdminQuery
} from "@/lib/api/hooks";
import { FormCheckbox, FormInput, FormSelect, GlowButton, SurfaceCard } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { AdminUser } from "@/lib/types";

export default function AdminUsersPage() {
  const { t } = useI18n();
  const usersQuery = useUsersAdminQuery();
  const createMutation = useCreateUserAdminMutation();
  const updateMutation = useUpdateUserAdminMutation();
  const deleteMutation = useDeleteUserAdminMutation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "PLAYER" as AdminUser["role"],
    isVerified: true
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createMutation.mutateAsync(form);
    setForm({ email: "", password: "", role: "PLAYER", isVerified: true });
  }

  if (usersQuery.isPending) {
    return <LoadingState />;
  }

  if (usersQuery.isError) {
    return <ErrorState onRetry={() => usersQuery.refetch()} />;
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader titleKey="admin.users.title" subtitleKey="admin.users.subtitle" />

      <SurfaceCard>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleCreate}>
          <FormInput placeholder={t("admin.users.emailPlaceholder")} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <FormInput
            placeholder={t("admin.users.passwordPlaceholder")}
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <FormSelect value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminUser["role"] }))}>
            <option value="PLAYER">{t("roles.player")}</option>
            <option value="CLUB">{t("roles.club")}</option>
            <option value="ORGANIZER">{t("roles.organizer")}</option>
            <option value="ADMIN">{t("roles.admin")}</option>
          </FormSelect>
          <FormCheckbox
            checked={form.isVerified}
            onChange={(event) => setForm((current) => ({ ...current, isVerified: event.target.checked }))}
            label={t("admin.common.verified")}
          />
          <GlowButton className="md:col-span-4" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "..." : `${t("admin.actions.create")} ${t("admin.nav.users").toLowerCase()}`}
          </GlowButton>
        </form>
      </SurfaceCard>

      {users.length === 0 ? <EmptyState message={t("admin.users.empty")} /> : null}
      {users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          onSave={(input) => updateMutation.mutateAsync({ id: user.id, input })}
          onDelete={async () => {
            if (window.confirm(`${t("admin.users.deleteConfirm")} ${user.email}?`)) {
              await deleteMutation.mutateAsync(user.id);
            }
          }}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      ))}
    </div>
  );
}

function UserRow({
  user,
  onSave,
  onDelete,
  isUpdating,
  isDeleting
}: {
  user: AdminUser;
  onSave: (input: { role: AdminUser["role"]; isVerified: boolean }) => Promise<unknown>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const { t } = useI18n();
  const [role, setRole] = useState<AdminUser["role"]>(user.role);
  const [isVerified, setIsVerified] = useState(user.isVerified);

  return (
    <SurfaceCard className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{user.email}</p>
          <p className="text-sm text-muted">{new Date(user.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FormSelect value={role} onChange={(event) => setRole(event.target.value as AdminUser["role"])}>
            <option value="PLAYER">{t("roles.player")}</option>
            <option value="CLUB">{t("roles.club")}</option>
            <option value="ORGANIZER">{t("roles.organizer")}</option>
            <option value="ADMIN">{t("roles.admin")}</option>
          </FormSelect>
          <FormCheckbox checked={isVerified} onChange={(event) => setIsVerified(event.target.checked)} label={t("admin.common.verified")} />
          <GlowButton variant="secondary" onClick={() => void onSave({ role, isVerified })} disabled={isUpdating}>
            {isUpdating ? "..." : t("admin.actions.save")}
          </GlowButton>
          <GlowButton variant="secondary" onClick={() => void onDelete()} disabled={isDeleting}>
            {isDeleting ? "..." : t("admin.actions.delete")}
          </GlowButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
