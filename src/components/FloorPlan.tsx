"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Loc = {
  id: string;
  name: string;
  type: string;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
};

type BasicAsset = {
  id: string;
  serialNo: string;
  category: string;
  status: string;
  isFixed: boolean;
  currentLocationId: string | null;
};

const TYPE_STYLE: Record<string, { fill: string; stroke: string; label: string }> = {
  ROOM:        { fill: "rgba(110,168,255,0.05)", stroke: "rgba(110,168,255,0.40)", label: "rgba(255,255,255,0.85)" },
  STORAGE:     { fill: "rgba(177,139,255,0.06)", stroke: "rgba(177,139,255,0.45)", label: "rgba(255,255,255,0.85)" },
  EVENT_SPACE: { fill: "rgba(244,114,182,0.05)", stroke: "rgba(244,114,182,0.45)", label: "rgba(255,255,255,0.85)" },
  GATEWAY:     { fill: "rgba(251,191,36,0.20)",  stroke: "rgba(251,191,36,0.70)",  label: "rgba(255,255,255,0.85)" },
  OUTSIDE:     { fill: "rgba(255,255,255,0.02)", stroke: "rgba(255,255,255,0.10)", label: "rgba(255,255,255,0.50)" },
};

const STATUS_DOT: Record<string, string> = {
  IN_USE: "#34d399",
  IN_STORAGE: "#38bdf8",
  AT_EVENT: "#a78bfa",
  IN_TRANSIT: "#fbbf24",
  DAMAGED: "#fb923c",
  MISSING: "#fb7185",
  DISPOSED: "#71717a",
};

export function FloorPlan({
  locations,
  assets: initialAssets,
}: {
  locations: Loc[];
  assets: BasicAsset[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulses, setPulses] = useState<{ x: number; y: number; key: number }[]>([]);

  // Live update via SSE
  useEffect(() => {
    const es = new EventSource("/api/stream");
    const onMsg = async (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.kind === "asset.scanned" || data?.kind === "asset.updated") {
          // refetch this specific asset
          const id = data.assetId;
          if (!id) return;
          const res = await fetch(`/api/assets/${id}/state`, { cache: "no-store" });
          if (!res.ok) return;
          const fresh = await res.json();
          setAssets((cur) => cur.map((a) => (a.id === id ? { ...a, ...fresh } : a)));
          // ripple pulse at the location
          const loc = locations.find((l) => l.id === fresh.currentLocationId);
          if (loc && loc.x != null && loc.y != null && loc.width && loc.height) {
            setPulses((p) => [
              ...p.slice(-10),
              { x: loc.x! + loc.width! / 2, y: loc.y! + loc.height! / 2, key: Date.now() + Math.random() },
            ]);
          }
        }
      } catch {}
    };
    es.addEventListener("message", onMsg);
    return () => { es.removeEventListener("message", onMsg); es.close(); };
  }, [locations]);

  // Per-room aggregation for the right-hand summary
  const byLoc = new Map<string, BasicAsset[]>();
  for (const a of assets) {
    if (!a.currentLocationId) continue;
    const arr = byLoc.get(a.currentLocationId) ?? [];
    arr.push(a);
    byLoc.set(a.currentLocationId, arr);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden">
        <svg viewBox="0 0 820 980" className="w-full h-auto block">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="820" height="980" fill="url(#grid)" />

          {locations.map((loc) => {
            if (loc.x == null || loc.y == null || !loc.width || !loc.height) return null;
            const t = TYPE_STYLE[loc.type] ?? TYPE_STYLE.ROOM;
            const count = byLoc.get(loc.id)?.length ?? 0;
            const isHovered = hovered === loc.id;
            return (
              <g key={loc.id} onMouseEnter={() => setHovered(loc.id)} onMouseLeave={() => setHovered((h) => (h === loc.id ? null : h))}>
                <rect
                  x={loc.x}
                  y={loc.y}
                  width={loc.width}
                  height={loc.height}
                  fill={t.fill}
                  stroke={isHovered ? "white" : t.stroke}
                  strokeWidth={isHovered ? 2 : 1}
                  rx={loc.type === "GATEWAY" ? 4 : 8}
                />
                <text
                  x={loc.x + 8}
                  y={loc.y + 18}
                  fill={t.label}
                  fontSize={11}
                  fontWeight={600}
                  className="select-none pointer-events-none"
                >
                  {loc.name}
                </text>
                {loc.type !== "GATEWAY" && loc.type !== "OUTSIDE" && (
                  <text
                    x={loc.x + 8}
                    y={loc.y + 32}
                    fill="rgba(255,255,255,0.55)"
                    fontSize={10}
                    className="select-none pointer-events-none"
                  >
                    {count} item{count === 1 ? "" : "s"}
                  </text>
                )}
                {/* Asset pins, scattered inside the rect */}
                {(byLoc.get(loc.id) ?? []).slice(0, 50).map((a, i) => {
                  const cols = Math.max(1, Math.floor(loc.width! / 14));
                  const cx = loc.x! + 10 + (i % cols) * 12;
                  const cy = loc.y! + 44 + Math.floor(i / cols) * 12;
                  return (
                    <circle
                      key={a.id}
                      cx={cx}
                      cy={cy}
                      r={3.2}
                      fill={STATUS_DOT[a.status] ?? "#aaa"}
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth={0.5}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Live pulse rings */}
          {pulses.map((p) => (
            <circle
              key={p.key}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="none"
              stroke="rgba(110,168,255,0.7)"
              strokeWidth={2}
              filter="url(#glow)"
            >
              <animate attributeName="r" from="6" to="80" dur="1.6s" fill="freeze" />
              <animate attributeName="opacity" from="0.9" to="0" dur="1.6s" fill="freeze" />
            </circle>
          ))}
        </svg>
      </div>

      <aside className="space-y-2 text-sm">
        <div className="rounded-md border border-[var(--color-border)] p-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-2">Legend</div>
          <ul className="grid grid-cols-2 gap-1.5 text-xs">
            {Object.entries(STATUS_DOT).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2">
                <span style={{ background: v }} className="w-2 h-2 rounded-full" />
                <span className="text-[var(--color-muted)]">{k.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-[var(--color-border)] p-3 max-h-[600px] overflow-y-auto">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-2">Rooms</div>
          <ul className="space-y-1">
            {locations.filter((l) => l.type !== "GATEWAY").map((l) => {
              const items = byLoc.get(l.id) ?? [];
              return (
                <li
                  key={l.id}
                  onMouseEnter={() => setHovered(l.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn("px-2 py-1.5 rounded text-xs flex justify-between items-center transition", hovered === l.id && "bg-white/5")}
                >
                  <span className="truncate">{l.name}</span>
                  <span className="text-[var(--color-muted)] tabular-nums">{items.length}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
