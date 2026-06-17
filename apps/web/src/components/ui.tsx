import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export { FormSelect } from "./FormSelect";

export function normalizeMetricText(value: string) {
  return value.replace(/[\u00A0\u202F]/g, " ");
}

export function SectionShell({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "hero";
}) {
  const toneClass = tone === "hero" ? "section-shell hero-shell" : "section-shell";
  return <section className={toneClass}>{children}</section>;
}

export function SurfaceCard({
  children,
  className = "",
  id
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <article id={id} className={`surface-card ${className}`.trim()}>{children}</article>;
}

export function GlowButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  const variantClass =
    variant === "primary"
      ? "button-primary"
      : variant === "secondary"
        ? "button-secondary"
        : "button-ghost";
  return (
    <button {...props} type={type} className={`${variantClass} ${className}`.trim()}>
      {children}
    </button>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field ${props.className ?? ""}`.trim()} />;
}

export function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`field ${props.className ?? ""}`.trim()} />;
}

export function FormCheckbox({
  checked,
  className = "",
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  className?: string;
}) {
  return (
    <label className={`checkbox-field ${className}`.trim()}>
      <input {...props} checked={checked} type="checkbox" className="checkbox-input" />
      <span className={`checkbox-box ${checked ? "checkbox-box-checked" : ""}`.trim()} aria-hidden="true">
        {"\u2713"}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function NoticePanel({
  children,
  tone = "default",
  className = ""
}: {
  children: ReactNode;
  tone?: "default" | "error" | "empty";
  className?: string;
}) {
  const toneClass =
    tone === "error"
      ? "ui-note ui-note-error"
      : tone === "empty"
        ? "ui-note ui-note-empty empty-state"
        : "ui-note";

  return <div className={`${toneClass} ${className}`.trim()}>{children}</div>;
}

export function MetricTile({
  label,
  value,
  accent = false,
  className = "",
  labelClassName = "",
  valueClassName = "",
  children
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  children?: ReactNode;
}) {
  const resolvedLabel = normalizeMetricText(label);
  const resolvedValue = normalizeMetricText(value);

  return (
    <div className={`metric-tile ${className}`.trim()}>
      <p className={`metric-label ${labelClassName}`.trim()}>{resolvedLabel}</p>
      <p className={`metric-value ${accent ? "text-accent" : "text-white"} ${valueClassName}`.trim()}>{resolvedValue}</p>
      {children}
    </div>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className="status-badge">{children}</span>;
}
