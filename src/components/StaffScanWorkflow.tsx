"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRight, ScanLine, Check, AlertTriangle, X, QrCode, Search } from "lucide-react";
import { Scanner } from "./Scanner";
import { staffScan, type StaffScanResult } from "@/app/actions";

type Item = {
  id: string;
  serialNo: string;
  category: string;
  condition: string;
  fromName: string;
  toName: string;
  toId: string | null;
};

type Flash = {
  kind: "ok" | "err";
  serialNo: string;
  message: string;
  damaged: boolean;
};

export function StaffScanWorkflow({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [query, setQuery] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [manual, setManual] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [pending, startTransition] = useTransition();

  // Keep local list in sync if server data changes (e.g. after dispatch)
  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.serialNo.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.fromName.toLowerCase().includes(q) ||
        i.toName.toLowerCase().includes(q),
    );
  }, [items, query]);

  function submit(serialNo: string, isDamaged: boolean) {
    const sn = serialNo.trim();
    if (!sn) return;
    startTransition(async () => {
      const res: StaffScanResult = await staffScan({ serialNo: sn, damaged: isDamaged });
      if (res.ok) {
        setFlash({
          kind: "ok",
          serialNo: res.serialNo,
          damaged: res.damaged,
          message: res.damaged
            ? `Flagged damaged at ${res.toName}`
            : `${res.fromName} → ${res.toName}`,
        });
        setItems((cur) => cur.filter((i) => i.serialNo !== res.serialNo));
        setManual("");
        setDamaged(false);
      } else {
        setFlash({ kind: "err", serialNo: sn, damaged: isDamaged, message: res.error });
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Flash */}
      {flash && (
        <div
          className={`rounded-md border px-4 py-3 text-sm flex items-start gap-3 ${
            flash.kind === "ok"
              ? flash.damaged
                ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
          }`}
        >
          {flash.kind === "ok" ? (
            flash.damaged ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <Check className="w-4 h-4 mt-0.5" />
          ) : (
            <X className="w-4 h-4 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-medium font-mono text-xs">{flash.serialNo}</div>
            <div className="opacity-90">{flash.message}</div>
          </div>
          <button onClick={() => setFlash(null)} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual + scanner controls */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Scan to confirm arrival
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(manual, damaged);
          }}
          className="flex flex-wrap gap-2 items-center"
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Enter or scan serial (e.g. QSTP-CHR-0001)"
            className="flex-1 min-w-[240px] bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-[var(--color-accent)]"
          />
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-panel-2)]">
            <input
              type="checkbox"
              checked={damaged}
              onChange={(e) => setDamaged(e.target.checked)}
              className="accent-amber-500"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
            Damaged
          </label>
          <button
            type="submit"
            disabled={pending || !manual.trim()}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50 hover:bg-[var(--color-accent)]/90 shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
          >
            {pending ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setScannerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-panel-2)]"
          >
            <QrCode className="w-3.5 h-3.5" />
            {scannerOpen ? "Hide camera" : "Use camera"}
          </button>
        </form>

        {scannerOpen && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <Scanner
              onResult={(decoded) => {
                // Accept full QR (URL or text) — extract last path segment if URL
                let sn = decoded.trim();
                try {
                  const u = new URL(decoded);
                  const parts = u.pathname.split("/").filter(Boolean);
                  if (parts.length) sn = parts[parts.length - 1];
                } catch {}
                setManual(sn);
                submit(sn, damaged);
              }}
              paused={!scannerOpen}
            />
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by serial, category, or room"
            className="w-full bg-transparent border border-[var(--color-border)] rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <span className="text-xs text-[var(--color-muted)] ml-auto">
          {filtered.length} in transit
        </span>
      </div>

      {/* Transit list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-muted)]">
          <ScanLine className="w-8 h-8 mx-auto opacity-40" />
          <p className="mt-3">Nothing in transit right now.</p>
          <p className="text-xs opacity-70">Dispatch an event from the Events tab to see items here.</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 space-y-2 hover:border-[var(--color-accent)]/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{it.serialNo}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  {it.category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 truncate">{it.fromName}</span>
                <ArrowRight className="w-3 h-3 text-[var(--color-muted)] shrink-0" />
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 truncate">{it.toName}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => submit(it.serialNo, false)}
                  disabled={pending}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> OK
                </button>
                <button
                  onClick={() => submit(it.serialNo, true)}
                  disabled={pending}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-500/25 disabled:opacity-50"
                >
                  <AlertTriangle className="w-3 h-3" /> Damaged
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
