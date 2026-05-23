import Link from "next/link";
import { Package, AlertTriangle, Truck, ArrowRight } from "lucide-react";
import { Card } from "@/components/Card";
import { Tag } from "@/components/Badge";
import { summary } from "@/lib/queries";
import { ago } from "@/lib/utils";

const CATEGORY_ORDER = ["Chair", "Table", "Whiteboard"];

export default async function DashboardPage() {
  const s = await summary();

  const byCategory = new Map<string, { total: number; inStorage: number; inTransit: number; atEvent: number; damaged: number }>();
  for (const r of s.byCategory) {
    const b = byCategory.get(r.category) ?? { total: 0, inStorage: 0, inTransit: 0, atEvent: 0, damaged: 0 };
    b.total += r._count._all;
    if (r.status === "IN_STORAGE") b.inStorage += r._count._all;
    if (r.status === "IN_TRANSIT") b.inTransit += r._count._all;
    if (r.status === "AT_EVENT" || r.status === "IN_USE") b.atEvent += r._count._all;
    if (r.status === "DAMAGED") b.damaged += r._count._all;
    byCategory.set(r.category, b);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-panel)] to-[var(--color-panel-2)] p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Logistics Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
              QSTP Furniture Operations
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
              Live counts of every chair, table, and whiteboard — sourced from the event ledger. No manual audits.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/events/new"
              className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent)]/90 shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
            >
              + New event
            </Link>
            <Link
              href="/scan"
              className="px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-panel-2)] text-sm font-medium"
            >
              Open scan
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <BigStat icon={Package} label="Total furniture" value={s.total} tone="neutral" />
          <BigStat icon={AlertTriangle} label="Damaged" value={s.damagedCount} tone={s.damagedCount > 0 ? "bad" : "good"} />
          <BigStat icon={Truck} label="In transit" value={s.inTransitCount} tone={s.inTransitCount > 0 ? "warn" : "neutral"} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Inventory by category" subtitle="Each row breaks down where the category currently is.">
          <ul className="space-y-4">
            {CATEGORY_ORDER.map((cat) => {
              const b = byCategory.get(cat) ?? { total: 0, inStorage: 0, inTransit: 0, atEvent: 0, damaged: 0 };
              const total = b.total || 1;
              const seg = (n: number, color: string) =>
                n > 0 && <span className={`block h-full ${color}`} style={{ width: `${(n / total) * 100}%` }} />;
              return (
                <li key={cat} className="space-y-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-medium">{cat}</span>
                    <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                      {b.total} units
                    </span>
                    <span className="ml-auto text-xs text-[var(--color-muted)]">
                      {b.inStorage} storage · {b.inTransit} transit · {b.atEvent} on event · {b.damaged} damaged
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full bg-[var(--color-panel-2)] overflow-hidden">
                    {seg(b.inStorage, "bg-sky-400/80")}
                    {seg(b.inTransit, "bg-amber-400/80")}
                    {seg(b.atEvent, "bg-violet-400/80")}
                    {seg(b.damaged, "bg-rose-400/80")}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex gap-4 text-[11px] text-[var(--color-muted)] flex-wrap">
            <Legend color="bg-sky-400/80" label="Storage" />
            <Legend color="bg-amber-400/80" label="Transit" />
            <Legend color="bg-violet-400/80" label="On event" />
            <Legend color="bg-rose-400/80" label="Damaged" />
          </div>
        </Card>

        <Card title="Recent movements" subtitle="Every scan, dispatch, and arrival in chronological order.">
          {s.latestEvents.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] italic">No movement yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {s.latestEvents.map((e) => (
                <li key={e.id} className="text-sm flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] w-20 shrink-0">
                    {ago(e.createdAt)}
                  </span>
                  <span className="font-mono text-xs">{e.asset.serialNo}</span>
                  <Tag>{e.eventType.replace(/_/g, " ")}</Tag>
                  {e.location && (
                    <span className="text-[var(--color-muted)] text-xs truncate">
                      <ArrowRight className="inline w-3 h-3 mr-1 opacity-60" />
                      {e.location.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "neutral" | "good" | "warn" | "bad";
}) {
  const toneText =
    tone === "good" ? "text-emerald-700 dark:text-emerald-300" :
    tone === "warn" ? "text-amber-700 dark:text-amber-300" :
    tone === "bad"  ? "text-rose-700 dark:text-rose-300" : "text-[var(--color-fg)]";
  const toneBg =
    tone === "good" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-400/10 dark:border-emerald-400/30" :
    tone === "warn" ? "bg-amber-50 border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/30" :
    tone === "bad"  ? "bg-rose-50 border-rose-200 dark:bg-rose-400/10 dark:border-rose-400/30" :
    "bg-[var(--color-panel)] border-[var(--color-border)]";
  return (
    <div className={`rounded-xl border p-5 shadow-[var(--shadow-card)] ${toneBg}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{label}</span>
        <Icon className={`w-4 h-4 ${toneText} opacity-80`} />
      </div>
      <div className={`mt-2 text-5xl font-semibold tabular-nums ${toneText}`}>{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}
