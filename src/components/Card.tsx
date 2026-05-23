import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[var(--color-border)]">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-[var(--color-good)]" :
    tone === "warn" ? "text-[var(--color-warn)]" :
    tone === "bad"  ? "text-[var(--color-bad)]" : "text-[var(--color-fg)]";
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</div>
      {hint && <div className="text-xs text-[var(--color-muted)] mt-1">{hint}</div>}
    </div>
  );
}
