import { Card } from "@/components/Card";
import { EventCreateForm } from "@/components/EventCreateForm";
import { prisma } from "@/lib/prisma";

export default async function NewEventRequestPage() {
  const [users, locations, byCategory] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({
      where: { type: { in: ["EVENT_SPACE", "ROOM"] } },
      orderBy: { name: "asc" },
    }),
    prisma.asset.groupBy({
      by: ["category"],
      where: { status: "IN_STORAGE" },
      _count: { _all: true },
    }),
  ]);

  const available = {
    Chair: byCategory.find((r) => r.category === "Chair")?._count._all ?? 0,
    Table: byCategory.find((r) => r.category === "Table")?._count._all ?? 0,
    Whiteboard: byCategory.find((r) => r.category === "Whiteboard")?._count._all ?? 0,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">New request</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Reserve furniture for an event</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Pick a room, choose how many of each item, and we'll reserve them from storage.
        </p>
      </header>

      <Card>
        <EventCreateForm
          users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
          locations={locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
          available={available}
        />
      </Card>
    </div>
  );
}
