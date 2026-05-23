// The event-sourced state engine.
//
// Every state change to an asset is an immutable AssetEvent. The Asset row
// itself is a denormalized "current state" projection — updated in the same
// transaction so reads are fast, but the AssetEvent log is the source of truth.
//
// Audits = walk the AssetEvent log. The campus never has to stop.

import { prisma } from "./prisma";
import { publish } from "./events-bus";
import type {
  AssetEventType,
  AssetStatus,
  Condition,
  EventSource,
} from "./types";

export type ScanInput = {
  serialNo?: string;
  assetId?: string;
  locationId?: string | null;
  actorId?: string | null;
  source: EventSource;
  eventType?: AssetEventType;       // default SCAN
  conditionAfter?: Condition | null;
  statusAfter?: AssetStatus | null; // optional override
  eventRequestId?: string | null;
  notes?: string | null;
};

export type ScanResult =
  | {
      ok: true;
      assetId: string;
      serialNo: string;
      previousStatus: AssetStatus;
      previousLocationId: string | null;
      newStatus: AssetStatus;
      newLocationId: string | null;
      eventId: string;
      anomalies: { type: string; message: string }[];
    }
  | { ok: false; error: string };

const CONDITION_RANK: Record<Condition, number> = {
  EXCELLENT: 4,
  GOOD: 3,
  FAIR: 2,
  POOR: 1,
  BROKEN: 0,
};

/**
 * Decide the asset's new status based on the event and location context.
 * Rules favour caller-provided overrides; otherwise derive sensibly.
 */
function deriveStatus(args: {
  previous: AssetStatus;
  eventType: AssetEventType;
  newLocationType: string | null;
  conditionAfter: Condition | null | undefined;
  statusOverride: AssetStatus | null | undefined;
  isFixed: boolean;
  hasOpenAllocation: boolean;
}): AssetStatus {
  const { previous, eventType, newLocationType, conditionAfter, statusOverride, isFixed, hasOpenAllocation } = args;

  if (statusOverride) return statusOverride;

  // Fixed items always stay IN_USE (they don't move under normal rules)
  if (isFixed && eventType !== "DISPOSAL" && eventType !== "MAINTENANCE") return "IN_USE";

  // Disposal is terminal
  if (eventType === "DISPOSAL") return "DISPOSED";

  // Damage trumps everything if condition is BROKEN
  if (conditionAfter === "BROKEN") return "DAMAGED";

  if (eventType === "CHECKOUT") return "AT_EVENT";
  if (eventType === "CHECKIN") {
    return newLocationType === "STORAGE" ? "IN_STORAGE" : "IN_USE";
  }

  // Plain scan / gateway pass: derive from location, but preserve special states
  if (previous === "DISPOSED") return previous;
  if (previous === "DAMAGED" && conditionAfter) {
    // Repair: scanned with non-broken condition → back to circulation
    return newLocationType === "STORAGE" ? "IN_STORAGE" : "IN_USE";
  }
  if (previous === "MISSING") {
    // Reappeared
    return newLocationType === "STORAGE" ? "IN_STORAGE" : "IN_USE";
  }
  if (hasOpenAllocation && eventType !== "CHECKIN") return "AT_EVENT";

  if (!newLocationType) return previous;
  if (newLocationType === "STORAGE") return "IN_STORAGE";
  if (newLocationType === "OUTSIDE") return "IN_TRANSIT";
  if (newLocationType === "EVENT_SPACE") return hasOpenAllocation ? "AT_EVENT" : "IN_USE";
  if (newLocationType === "GATEWAY") return previous; // passing through
  return "IN_USE";
}

export async function recordScan(input: ScanInput): Promise<ScanResult> {
  const eventType: AssetEventType = input.eventType ?? "SCAN";

  // Resolve asset
  const asset = await prisma.asset.findFirst({
    where: input.assetId
      ? { id: input.assetId }
      : input.serialNo
      ? { serialNo: input.serialNo }
      : { id: "__none__" },
    include: {
      currentLocation: true,
      allocations: {
        where: { status: { in: ["ALLOCATED", "CHECKED_OUT"] } },
      },
    },
  });
  if (!asset) return { ok: false, error: "Unknown asset" };

  // Resolve location if provided
  let newLocation = null as { id: string; type: string } | null;
  if (input.locationId) {
    const loc = await prisma.location.findUnique({ where: { id: input.locationId } });
    if (!loc) return { ok: false, error: "Unknown location" };
    newLocation = { id: loc.id, type: loc.type };
  }

  const previousStatus = asset.status as AssetStatus;
  const previousLocationId = asset.currentLocationId;
  const newStatus = deriveStatus({
    previous: previousStatus,
    eventType,
    newLocationType: newLocation?.type ?? asset.currentLocation?.type ?? null,
    conditionAfter: input.conditionAfter,
    statusOverride: input.statusAfter ?? null,
    isFixed: asset.isFixed,
    hasOpenAllocation: asset.allocations.length > 0,
  });
  const newCondition = (input.conditionAfter ?? asset.condition) as Condition;

  const anomalies: { type: string; message: string }[] = [];

  // ── Anomaly: fixed asset moved away from its home location ────────────
  if (asset.isFixed && newLocation && asset.homeLocationId && newLocation.id !== asset.homeLocationId) {
    anomalies.push({
      type: "FIXED_MOVED",
      message: `Fixed asset ${asset.serialNo} scanned at a non-home location.`,
    });
  }

  // ── Anomaly: condition regression ─────────────────────────────────────
  if (
    input.conditionAfter &&
    CONDITION_RANK[input.conditionAfter] < CONDITION_RANK[asset.condition as Condition]
  ) {
    anomalies.push({
      type: "CONDITION_REGRESSION",
      message: `${asset.serialNo} condition regressed: ${asset.condition} → ${input.conditionAfter}.`,
    });
  }

  // ── Persist in one transaction ────────────────────────────────────────
  const result = await prisma.$transaction(async (tx) => {
    // Determine where to record the location on the event
    const eventLocationId = newLocation?.id ?? asset.currentLocationId;

    // For gateway passes, don't move the asset's current location; the gateway
    // just witnessed it passing. But for plain SCAN/CHECKOUT/CHECKIN, update.
    const updateCurrentLocation =
      eventType !== "GATEWAY_PASS" && newLocation ? newLocation.id : asset.currentLocationId;

    const ev = await tx.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType,
        locationId: eventLocationId,
        actorId: input.actorId ?? null,
        conditionAfter: newCondition,
        statusAfter: newStatus,
        source: input.source,
        eventRequestId: input.eventRequestId ?? null,
        notes: input.notes ?? null,
      },
    });

    await tx.asset.update({
      where: { id: asset.id },
      data: {
        currentLocationId: updateCurrentLocation,
        status: newStatus,
        condition: newCondition,
      },
    });

    // Persist alerts
    for (const a of anomalies) {
      await tx.alert.create({
        data: {
          type: a.type,
          severity: a.type === "FIXED_MOVED" ? "CRITICAL" : "WARNING",
          message: a.message,
          assetId: asset.id,
        },
      });
    }

    return ev;
  });

  // Notify SSE listeners
  publish({
    kind: "asset.scanned",
    assetId: asset.id,
    locationId: newLocation?.id ?? null,
    source: input.source,
  });
  publish({ kind: "asset.updated", assetId: asset.id });

  return {
    ok: true,
    assetId: asset.id,
    serialNo: asset.serialNo,
    previousStatus,
    previousLocationId,
    newStatus,
    newLocationId: newLocation?.id ?? asset.currentLocationId ?? null,
    eventId: result.id,
    anomalies,
  };
}
