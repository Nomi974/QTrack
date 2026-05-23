import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABEL, type AssetStatus, type Condition, CONDITION_COLORS } from "@/lib/types";

export function StatusBadge({ status, className }: { status: AssetStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_COLORS[status],
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ConditionPill({ condition }: { condition: Condition }) {
  return (
    <span className={cn("inline-flex text-[11px] font-medium uppercase tracking-wider", CONDITION_COLORS[condition])}>
      {condition}
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--color-panel-2)] border border-[var(--color-border)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
