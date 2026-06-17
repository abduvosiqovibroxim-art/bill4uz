"use client";

import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { SectionShell } from "@/components/ui";

export default function AdminSectionLayout({ children }: { children: ReactNode }) {
  return (
    <SectionShell>
      <AdminNav />
      {children}
    </SectionShell>
  );
}
