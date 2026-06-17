"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MetricTile, SurfaceCard } from "@/components/ui";

export interface DashboardNavItem {
  href: string;
  label: string;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  actions
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dashboard-page-header">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="section-title mt-4 text-white">{title}</h1>
      </div>
      {actions ? <div className="dashboard-header-actions">{actions}</div> : null}
    </div>
  );
}

export function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <SurfaceCard className="dashboard-nav-card">
      <nav className="dashboard-nav" aria-label="Dashboard">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard/admin" && pathname.startsWith(`${item.href}/`));

          return (
            <Link key={item.href} href={item.href} className={`dashboard-nav-link ${active ? "dashboard-nav-link-active" : ""}`.trim()}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </SurfaceCard>
  );
}

export function DashboardMetricGrid({
  children,
  columns = "md:grid-cols-4"
}: {
  children: ReactNode;
  columns?: string;
}) {
  return <div className={`dashboard-metric-grid grid gap-4 ${columns}`.trim()}>{children}</div>;
}

export function DashboardMetric({
  label,
  value,
  accent = false,
  meta
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  meta?: string;
}) {
  return (
    <MetricTile
      label={label}
      value={String(value)}
      accent={accent}
      valueClassName="metric-value-hero"
      className={meta ? "dashboard-metric-with-meta" : ""}
    >
      {meta ? <p className="dashboard-metric-meta">{meta}</p> : null}
    </MetricTile>
  );
}

export function DashboardSection({
  id,
  title,
  action,
  children,
  className = ""
}: {
  id?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={`dashboard-section ${className}`.trim()} id={id}>
      <div className="dashboard-section-header">
        <div className="min-w-0">
          <h2 className="dashboard-section-title">{title}</h2>
        </div>
        {action ? <div className="dashboard-section-action">{action}</div> : null}
      </div>
      {children}
    </SurfaceCard>
  );
}

export function DashboardActionGrid({ children }: { children: ReactNode }) {
  return <div className="dashboard-action-grid">{children}</div>;
}

export function DashboardActionCard({
  href,
  title,
  description,
  meta
}: {
  href: string;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="dashboard-action-card">
      <span className="dashboard-action-title">{title}</span>
      <span className="dashboard-action-description">{description}</span>
      {meta ? <span className="dashboard-action-meta">{meta}</span> : null}
    </Link>
  );
}

export function DashboardList({ children }: { children: ReactNode }) {
  return <div className="dashboard-list">{children}</div>;
}

export function DashboardListItem({
  title,
  meta,
  aside,
  href,
  children
}: {
  title: string;
  meta?: string;
  aside?: ReactNode;
  href?: string;
  children?: ReactNode;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="dashboard-list-title">{title}</p>
        {meta ? <p className="dashboard-list-meta">{meta}</p> : null}
        {children ? <div className="dashboard-list-body">{children}</div> : null}
      </div>
      {aside ? <div className="dashboard-list-aside">{aside}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="dashboard-list-item dashboard-list-item-link">
        {content}
      </Link>
    );
  }

  return <div className="dashboard-list-item">{content}</div>;
}

export function DashboardSplit({ children }: { children: ReactNode }) {
  return <div className="dashboard-split">{children}</div>;
}
