"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { StatusBadge } from "@/components/Badge";
import { ago } from "@/lib/utils";
import type { LogRow } from "@/lib/queries";
import type { AssetStatus } from "@/lib/types";

const CATEGORIES = ["All", "Chair", "Table", "Whiteboard"] as const;

export function LogTable({ rows }: { rows: LogRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (!q) return true;
      return (
        r.serialNo.toLowerCase().includes(q) ||
        r.currentLocation.toLowerCase().includes(q) ||
        (r.lastMoveFrom ?? "").toLowerCase().includes(q) ||
        (r.lastMoveTo ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search serial or location…"
            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex gap-1 rounded-full border border-[var(--color-border)] p-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                category === c
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-panel-2)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--color-muted)] ml-auto tabular-nums">
          {filtered.length} of {rows.length} items
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-panel-2)]">
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              <th className="px-3 py-2 font-medium">Serial</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Currently at</th>
              <th className="px-3 py-2 font-medium">Last move</th>
              <th className="px-3 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--color-panel-2)]">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link href={`/assets/${r.serialNo}`} className="text-[var(--color-accent)] hover:underline">
                    {r.serialNo}
                  </Link>
                </td>
                <td className="px-3 py-2 text-[var(--color-muted)]">{r.category}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status as AssetStatus} />
                </td>
                <td className="px-3 py-2">{r.currentLocation}</td>
                <td className="px-3 py-2 text-xs">
                  {r.lastMoveFrom && r.lastMoveTo ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[var(--color-muted)]">{r.lastMoveFrom}</span>
                      <ArrowRight className="w-3 h-3 opacity-50" />
                      <span>{r.lastMoveTo}</span>
                    </span>
                  ) : (
                    <span className="text-[var(--color-muted)]">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--color-muted)] whitespace-nowrap">
                  {ago(r.lastMoveAt)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-sm text-[var(--color-muted)]">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
