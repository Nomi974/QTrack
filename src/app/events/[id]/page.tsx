import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { Tag, StatusBadge } from "@/components/Badge";
import { getEventRequest } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { fmtDate, ago } from "@/lib/utils";
import {
  approveEventRequest,
  rejectEventRequest,
  dispatchEvent,
  returnEventToStorage,
  closeEvent,
} from "@/app/actions";
import type { AssetStatus } from "@/lib/types";
import { ArrowLeft, Truck, RotateCcw, Check, X, MapPin, Calendar, User, FlagOff } from "lucide-react";

export default async function EventRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await getEventRequest(id);
  if (!r) return notFound();
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  const totalChairs = r.allocations.filter((a) => a.asset.category === "Chair").length;
  const totalTables = r.allocations.filter((a) => a.asset.category === "Table").length;
  const totalBoards = r.allocations.filter((a) => a.asset.category === "Whiteboard").length;

  const allocated = r.allocations.filter((a) => a.status === "ALLOCATED");
  const out = r.allocations.filter((a) => a.status === "CHECKED_OUT");
  const returned = r.allocations.filter((a) => a.status === "RETURNED");
  const damaged = r.allocations.filter((a) => a.asset.status === "DAMAGED");

  const canDispatch = r.status === "PENDING" || r.status === "APPROVED";
  const canReturn = r.status === "IN_PROGRESS" && out.length > 0;
  const canClose = r.status === "IN_PROGRESS" && out.length > 0;
  const nonDamagedOut = out.filter((a) => a.asset.status !== "DAMAGED").length;

  return (
    <div className="space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="w-3 h-3" /> all events
      </Link>

      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag>{r.status.replace(/_/g, " ")}</Tag>
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              created {ago(r.createdAt)}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1.5">{r.title}</h1>
          <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {fmtDate(r.startsAt)} → {fmtDate(r.endsAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {r.location?.name ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3 h-3" />
              {r.requester.name}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {r.status === "PENDING" && (
            <>
              <form action={approveEventRequest}>
                <input type="hidden" name="id" value={r.id} />
                <input
                  type="hidden"
                  name="approverId"
                  value={users.find((u) => u.role === "ADMIN")?.id ?? users[0]?.id ?? ""}
                />
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              </form>
              <form action={rejectEventRequest}>
                <input type="hidden" name="id" value={r.id} />
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CountTile label="Chairs" value={totalChairs} />
        <CountTile label="Tables" value={totalTables} />
        <CountTile label="Whiteboards" value={totalBoards} />
        <CountTile label="Total items" value={r.allocations.length} highlight />
      </div>

      {r.description && (
        <Card>
          <p className="text-sm text-[var(--color-muted)]">{r.description}</p>
        </Card>
      )}

      {canDispatch && allocated.length > 0 && (
        <Card
          title="Dispatch to event"
          subtitle={`Move all ${allocated.length} items into transit toward ${r.location?.name ?? "the event room"}.`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[var(--color-muted)]">
              Once dispatched, staff scan each item on arrival to confirm — damaged items get flagged at scan time.
            </p>
            <form action={dispatchEvent}>
              <input type="hidden" name="requestId" value={r.id} />
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent)]/90 shadow-[0_4px_12px_rgba(124,58,237,0.25)]">
                <Truck className="w-4 h-4" />
                Dispatch {allocated.length} items
              </button>
            </form>
          </div>
        </Card>
      )}

      {canClose && (
        <Card
          title="Close event"
          subtitle="Instantly send every item back to where it was dispatched from and mark this event complete. No second scan trip."
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[var(--color-muted)]">
              {nonDamagedOut} item{nonDamagedOut === 1 ? "" : "s"} will jump back to their pre-dispatch locations
              {damaged.length > 0 && (
                <span className="text-amber-700 dark:text-amber-300">
                  {" "}
                  · {damaged.length} damaged item{damaged.length === 1 ? " stays" : "s stay"} for repair
                </span>
              )}
              .
            </p>
            <form action={closeEvent}>
              <input type="hidden" name="requestId" value={r.id} />
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent)]/90 shadow-[0_4px_12px_rgba(124,58,237,0.25)]">
                <FlagOff className="w-4 h-4" />
                Close event
              </button>
            </form>
          </div>
        </Card>
      )}

      {canReturn && (
        <Card
          title="Return via storage scan"
          subtitle="Alternate flow: flag items as returning and have staff scan them at Lobby Storage on arrival."
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[var(--color-muted)]">
              {out.length} item{out.length === 1 ? "" : "s"} at the event will start the return trip to Lobby Storage.
              {damaged.length > 0 && (
                <span className="text-amber-700 dark:text-amber-300">
                  {" "}
                  {damaged.length} damaged item{damaged.length === 1 ? " stays" : "s stay"} in place for repair.
                </span>
              )}
            </p>
            <form action={returnEventToStorage}>
              <input type="hidden" name="requestId" value={r.id} />
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-panel-2)]">
                <RotateCcw className="w-4 h-4" />
                Send back to storage
              </button>
            </form>
          </div>
        </Card>
      )}

      <Card title="Allocations" subtitle={`${r.allocations.length} item${r.allocations.length === 1 ? "" : "s"} reserved.`}>
        <ul className="divide-y divide-[var(--color-border)] -my-1">
          {r.allocations.map((a) => (
            <li key={a.id} className="py-2 flex items-center gap-3 text-sm">
              <span className="font-mono text-xs w-44 shrink-0">{a.asset.serialNo}</span>
              <span className="text-[var(--color-muted)] w-24 shrink-0 text-xs">{a.asset.category}</span>
              <span className="text-xs text-[var(--color-muted)] truncate flex-1">
                {a.asset.currentLocation?.name ?? "—"}
              </span>
              <StatusBadge status={a.asset.status as AssetStatus} />
              <Tag>{a.status.replace(/_/g, " ")}</Tag>
            </li>
          ))}
        </ul>
        {returned.length > 0 && (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            {returned.length} item{returned.length === 1 ? "" : "s"} already returned to storage.
          </p>
        )}
      </Card>
    </div>
  );
}

function CountTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent-2)]/5 border-[var(--color-accent)]/30"
          : "bg-[var(--color-panel)] border-[var(--color-border)]"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
