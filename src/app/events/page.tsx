import Link from "next/link";
import { Card } from "@/components/Card";
import { Tag } from "@/components/Badge";
import { getEventRequests } from "@/lib/queries";
import { fmtDate, ago } from "@/lib/utils";
import { Calendar, Plus, MapPin } from "lucide-react";

export default async function EventsPage() {
  const requests = await getEventRequests();
  const pending = requests.filter((r) => r.status === "PENDING");
  const inProg = requests.filter((r) => r.status === "APPROVED" || r.status === "IN_PROGRESS");
  const overdue = requests.filter((r) => r.status === "OVERDUE");
  const done = requests.filter((r) => r.status === "COMPLETED" || r.status === "REJECTED");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Events</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Reservations & dispatch</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Request furniture, dispatch to a room, scan to confirm, return when done.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent)]/90 shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
        >
          <Plus className="w-4 h-4" /> New event
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Pending" value={pending.length} tone={pending.length > 0 ? "warn" : "neutral"} />
        <MiniStat label="In progress" value={inProg.length} tone="neutral" />
        <MiniStat label="Overdue" value={overdue.length} tone={overdue.length > 0 ? "bad" : "good"} />
        <MiniStat label="Completed" value={done.filter((r) => r.status === "COMPLETED").length} tone="good" />
      </div>

      {pending.length > 0 && (
        <Card title="Pending approval" subtitle="Allocate, then dispatch.">
          <RequestRows rows={pending} />
        </Card>
      )}
      {inProg.length > 0 && (
        <Card title="In progress" subtitle="Items dispatched or being used.">
          <RequestRows rows={inProg} />
        </Card>
      )}
      {overdue.length > 0 && (
        <Card title="Overdue" subtitle="Event ended, items not returned">
          <RequestRows rows={overdue} />
        </Card>
      )}
      {done.length > 0 && (
        <Card title="History" subtitle="Closed or rejected.">
          <RequestRows rows={done} />
        </Card>
      )}
      {requests.length === 0 && (
        <Card>
          <div className="py-12 text-center">
            <Calendar className="w-8 h-8 mx-auto text-[var(--color-muted)] opacity-50" />
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              No event requests yet.{" "}
              <Link href="/events/new" className="text-[var(--color-accent)] underline">
                Create the first one.
              </Link>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-emerald-700 dark:text-emerald-300" :
    tone === "warn" ? "text-amber-700 dark:text-amber-300" :
    tone === "bad"  ? "text-rose-700 dark:text-rose-300" : "text-[var(--color-fg)]";
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

function RequestRows({ rows }: { rows: Awaited<ReturnType<typeof getEventRequests>> }) {
  return (
    <ul className="divide-y divide-[var(--color-border)] -my-1">
      {rows.map((r) => {
        const chairs = r.allocations.filter((a) => a.asset.category === "Chair").length;
        const tables = r.allocations.filter((a) => a.asset.category === "Table").length;
        const wbs = r.allocations.filter((a) => a.asset.category === "Whiteboard").length;
        return (
          <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
            <Link href={`/events/${r.id}`} className="font-medium hover:underline">
              {r.title}
            </Link>
            <Tag>{r.status.replace(/_/g, " ")}</Tag>
            <span className="text-xs text-[var(--color-muted)] flex items-center gap-1">
              <Calendar className="w-3 h-3 opacity-60" />
              {fmtDate(r.startsAt)}
            </span>
            <span className="text-xs text-[var(--color-muted)] flex items-center gap-1">
              <MapPin className="w-3 h-3 opacity-60" />
              {r.location?.name ?? "—"}
            </span>
            <span className="ml-auto text-xs text-[var(--color-muted)] tabular-nums">
              {chairs > 0 && <span className="mr-2">{chairs} chair{chairs === 1 ? "" : "s"}</span>}
              {tables > 0 && <span className="mr-2">{tables} table{tables === 1 ? "" : "s"}</span>}
              {wbs > 0 && <span className="mr-2">{wbs} board{wbs === 1 ? "" : "s"}</span>}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] w-20 text-right">
              {ago(r.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
