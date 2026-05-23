import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssetBySerial } from "@/lib/queries";
import { Card } from "@/components/Card";
import { StatusBadge, ConditionPill, Tag } from "@/components/Badge";
import { QRTag } from "@/components/QRTag";
import { PrintButton } from "@/components/PrintButton";
import { ago, fmtDate, fmtMoney } from "@/lib/utils";
import type { AssetStatus, Condition } from "@/lib/types";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ serialNo: string }>;
}) {
  const { serialNo } = await params;
  const asset = await getAssetBySerial(serialNo);
  if (!asset) return notFound();

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-xs text-[var(--color-muted)]">{asset.serialNo}</div>
              <h1 className="text-2xl font-semibold tracking-tight mt-0.5">{asset.category}</h1>
              <div className="text-sm text-[var(--color-muted)]">
                {asset.brand} {asset.model} {asset.subcategory && `· ${asset.subcategory}`}
              </div>
              <div className="flex gap-2 mt-3 items-center">
                <StatusBadge status={asset.status as AssetStatus} />
                <ConditionPill condition={asset.condition as Condition} />
                {asset.isFixed && <Tag>Fixed asset</Tag>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--color-muted)]">Current location</div>
              <div className="text-lg font-medium">{asset.currentLocation?.name ?? "Unknown"}</div>
              {asset.homeLocation && asset.homeLocation.id !== asset.currentLocationId && (
                <div className="text-xs text-rose-300 mt-1">
                  ⚠ Home: {asset.homeLocation.name}
                </div>
              )}
            </div>
          </div>
          <dl className="mt-4 grid sm:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase text-[var(--color-muted)] tracking-wider">Purchase price</dt>
              <dd className="font-medium tabular-nums">{fmtMoney(asset.purchasePrice)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-[var(--color-muted)] tracking-wider">Purchased</dt>
              <dd className="font-medium">{asset.purchaseDate ? fmtDate(asset.purchaseDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-[var(--color-muted)] tracking-wider">Created</dt>
              <dd className="font-medium">{ago(asset.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-[var(--color-muted)] tracking-wider">Last update</dt>
              <dd className="font-medium">{ago(asset.updatedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Event ledger" subtitle="Every scan, every move. Immutable.">
          <ol className="relative ml-2">
            {asset.events.map((e, i) => (
              <li key={e.id} className="pl-6 pb-4 border-l border-[var(--color-border)] last:border-l-transparent">
                <span className="absolute -ml-[5px] mt-1 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider">{e.eventType.replace(/_/g, " ")}</span>
                  <Tag>{e.source}</Tag>
                  {e.statusAfter && <Tag>→ {e.statusAfter.replace(/_/g, " ")}</Tag>}
                </div>
                <div className="text-sm mt-0.5">
                  {e.location ? `at ${e.location.name}` : "—"}
                  {e.actor && <span className="text-[var(--color-muted)]"> · by {e.actor.name}</span>}
                </div>
                {e.notes && <div className="text-xs text-[var(--color-muted)] italic mt-0.5">{e.notes}</div>}
                <div className="text-[11px] text-[var(--color-muted)] mt-0.5">{fmtDate(e.createdAt)} ({ago(e.createdAt)})</div>
              </li>
            ))}
            {asset.events.length === 0 && (
              <li className="text-sm text-[var(--color-muted)] italic">No events recorded.</li>
            )}
          </ol>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="QSTP Tag" subtitle="Print at 50mm × 70mm on metal/epoxy.">
          <div className="flex justify-center">
            <QRTag serialNo={asset.serialNo} size={260} />
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href={`/scan?prefill=${asset.serialNo}`}
              className="flex-1 text-center px-3 py-2 text-sm rounded-full bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90"
            >
              Test scan
            </Link>
            <PrintButton />
          </div>
        </Card>

        <Card title="Active allocations" subtitle="Outstanding event commitments">
          {asset.allocations.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] italic">None.</p>
          ) : (
            <ul className="space-y-2">
              {asset.allocations.map((a) => (
                <li key={a.id} className="text-sm flex justify-between">
                  <span>{a.eventRequest?.title}</span>
                  <Tag>{a.status}</Tag>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
