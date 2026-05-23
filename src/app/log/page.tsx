import { Card } from "@/components/Card";
import { LogTable } from "@/components/LogTable";
import { assetLog } from "@/lib/queries";

export default async function LogPage() {
  const rows = await assetLog();

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Asset log</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Every item, where it is, where it came from</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Sourced from the AssetEvent ledger. Click any serial to open the full history.
        </p>
      </header>

      <Card>
        <LogTable rows={rows} />
      </Card>
    </div>
  );
}
