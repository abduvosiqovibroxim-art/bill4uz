"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <section className="dashboard-shell">
        <div className="dashboard-page">{children}</div>
      </section>
    </ProtectedRoute>
  );
}
