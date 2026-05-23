import { prisma } from "@/lib/prisma";
import { FloorPlan } from "@/components/FloorPlan";
import { Card } from "@/components/Card";
import { MapPin, Armchair, Square, Presentation } from "lucide-react";

const CATEGORIES = ["Chair", "Table", "Whiteboard"] as const;

export default async function RoomsPage() {
  const [locations, assets] = await Promise.all([
    prisma.location.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.asset.findMany({
      select: { id: true, serialNo: true, category: true, status: true, isFixed: true, currentLocationId: true },
    }),
  ]);

  // Per-location category breakdown
  const breakdown = new Map<string, { Chair: number; Table: number; Whiteboard: number; total: number }>();
  for (const a of assets) {
    if (!a.currentLocationId) continue;
    const b = breakdown.get(a.currentLocationId) ?? { Chair: 0, Table: 0, Whiteboard: 0, total: 0 };
    if (a.category === "Chair") b.Chair++;
    else if (a.category === "Table") b.Table++;
    else if (a.category === "Whiteboard") b.Whiteboard++;
    b.total++;
    breakdown.set(a.currentLocationId, b);
  }

  const visibleLocations = locations.filter((l) => l.type !== "OUTSIDE");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Floor plan</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Rooms & storage</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Every asset currently sitting in a room or in transit. Hover a space for details.
          </p>
        </div>
      </header>

      <FloorPlan
        locations={locations}
        assets={assets}
      />

      <Card title="Per-room inventory" subtitle="Counts roll up from the live asset table.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleLocations.map((loc) => {
            const b = breakdown.get(loc.id) ?? { Chair: 0, Table: 0, Whiteboard: 0, total: 0 };
            return (
              <div
                key={loc.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 opacity-60" />
                      {loc.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">
                      {loc.type.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums">{b.total}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <CatStat icon={Armchair} label="Chairs" value={b.Chair} />
                  <CatStat icon={Square} label="Tables" value={b.Table} />
                  <CatStat icon={Presentation} label="Whiteboards" value={b.Whiteboard} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function CatStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        <Icon className="w-3 h-3 opacity-70" />
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
