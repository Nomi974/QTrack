import { Card } from "@/components/Card";
import { StaffScanWorkflow } from "@/components/StaffScanWorkflow";
import { transitItems } from "@/lib/queries";

export default async function ScanPage() {
  const items = await transitItems();

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Staff scan</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Confirm arrivals</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1 max-w-2xl">
          Items currently in transit. Scan each one when it arrives at its destination — flag damage if you see it.
        </p>
      </header>

      <Card>
        <StaffScanWorkflow items={items} />
      </Card>
    </div>
  );
}
