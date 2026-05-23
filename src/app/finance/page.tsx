import { Card } from "@/components/Card";
import { procurementMap } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { fmtMoney } from "@/lib/utils";
import { Banknote, TrendingDown, ShieldAlert, Package } from "lucide-react";

export default async function FinancePage() {
  const [buckets, totals, damaged] = await Promise.all([
    procurementMap(),
    prisma.asset.aggregate({ _sum: { purchasePrice: true }, _count: { _all: true } }),
    prisma.asset.findMany({
      where: { OR: [{ status: "DAMAGED" }, { condition: "BROKEN" }] },
      orderBy: { updatedAt: "desc" },
      include: { currentLocation: true },
      take: 50,
    }),
  ]);

  const damagedValue = damaged.reduce((s, a) => s + (a.purchasePrice ?? 0), 0);
  const totalValue = totals._sum.purchasePrice ?? 0;
  const healthyValue = totalValue - damagedValue;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Finance</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Inventory value & procurement</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1 max-w-2xl">
          A live ledger of the furniture inventory, valued at purchase cost. Damaged items show up as write-down candidates.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigStat
          icon={Banknote}
          label="Registered value"
          value={fmtMoney(totalValue)}
          hint="Purchase-cost basis"
          tone="neutral"
        />
        <BigStat
          icon={Package}
          label="Items on register"
          value={totals._count._all.toString()}
          hint="Active inventory"
          tone="neutral"
        />
        <BigStat
          icon={ShieldAlert}
          label="Healthy value"
          value={fmtMoney(healthyValue)}
          hint="Usable equipment"
          tone="good"
        />
        <BigStat
          icon={TrendingDown}
          label="Damaged value"
          value={fmtMoney(damagedValue)}
          hint="Write-down candidate"
          tone={damagedValue > 0 ? "bad" : "good"}
        />
      </div>

      <Card title="Inventory by category" subtitle="Where every category lives — useful before procurement decisions.">
        <ul className="space-y-3">
          {buckets.map((b) => {
            const total = b.total || 1;
            const seg = (n: number, color: string) =>
              n > 0 && <span className={`block h-full ${color}`} style={{ width: `${(n / total) * 100}%` }} />;
            return (
              <li key={b.category} className="space-y-1.5">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium">{b.category}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    {b.total} units
                  </span>
                  <span className="ml-auto text-xs text-[var(--color-muted)] tabular-nums">
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

      <Card title="Procurement recommendations" subtitle="Before ordering more, look at what's already in storage.">
        <ul className="divide-y divide-[var(--color-border)] -my-1">
          {buckets.map((b) => {
            const surplus = b.inStorage > 10;
            const shortage = b.inStorage === 0;
            const tight = b.inStorage > 0 && b.inStorage <= 5;
            const tone = surplus
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-300"
              : shortage
              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-300"
              : tight
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300"
              : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/5 dark:text-sky-300";
            const msg = surplus
              ? `Surplus — ${b.inStorage} ready to deploy. Do not procure.`
              : shortage
              ? "Out of stock. Consider order."
              : tight
              ? `Tight stock — only ${b.inStorage} ready.`
              : `Healthy — ${b.inStorage} in storage.`;
            return (
              <li key={b.category} className="py-3 flex items-center gap-3 flex-wrap">
                <span className="font-medium flex-1 min-w-[180px]">{b.category}</span>
                <span className="text-xs text-[var(--color-muted)]">
                  Total <strong className="text-[var(--color-fg)] tabular-nums">{b.total}</strong>
                </span>
                <span className="text-xs text-sky-700 dark:text-sky-300">
                  Storage <strong className="tabular-nums">{b.inStorage}</strong>
                </span>
                <span className="text-xs text-violet-700 dark:text-violet-300">
                  On event <strong className="tabular-nums">{b.atEvent}</strong>
                </span>
                <div className={`ml-auto text-xs px-2 py-1 rounded-md border ${tone}`}>{msg}</div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Damaged inventory" subtitle="Items currently flagged DAMAGED — write-down candidates.">
        {damaged.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">No damaged items. Healthy ledger.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] -my-1">
            {damaged.map((a) => (
              <li key={a.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="font-mono text-xs w-44 shrink-0">{a.serialNo}</span>
                <span className="text-[var(--color-muted)] w-24 shrink-0 text-xs">{a.category}</span>
                <span className="text-xs text-[var(--color-muted)] truncate flex-1">
                  {a.currentLocation?.name ?? "—"}
                </span>
                <span className="tabular-nums text-rose-700 dark:text-rose-300">{fmtMoney(a.purchasePrice)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone: "neutral" | "good" | "warn" | "bad";
}) {
  const toneText =
    tone === "good" ? "text-emerald-700 dark:text-emerald-300" :
    tone === "warn" ? "text-amber-700 dark:text-amber-300" :
    tone === "bad"  ? "text-rose-700 dark:text-rose-300" : "text-[var(--color-fg)]";
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{label}</span>
        <Icon className={`w-4 h-4 ${toneText} opacity-80`} />
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneText}`}>{value}</div>
      {hint && <div className="text-[11px] text-[var(--color-muted)] mt-1">{hint}</div>}
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
