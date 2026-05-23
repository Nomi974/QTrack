"use server";

import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/events-bus";
import { revalidateTag } from "next/cache";

// Tag bag — matches the tags applied in src/lib/queries.ts. Mutations call
// `bustAssets()` / `bustEvents()` after touching state so unstable_cache
// entries get marked stale on next nav.
function bustAssets() {
  revalidateTag("assets", "max");
}
function bustEvents() {
  revalidateTag("events-feed", "max");
}
function bustAll() {
  bustAssets();
  bustEvents();
}

// ─── Event Requests ──────────────────────────────────────────────────────

export async function createEventRequest(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsAt = new Date(String(formData.get("startsAt") ?? Date.now()));
  const endsAt = new Date(String(formData.get("endsAt") ?? Date.now() + 3600_000));
  const requesterId = String(formData.get("requesterId") ?? "");
  const locationId = String(formData.get("locationId") ?? "") || null;
  const chairs = Number(formData.get("chairs") ?? 0);
  const tables = Number(formData.get("tables") ?? 0);
  const whiteboards = Number(formData.get("whiteboards") ?? 0);

  if (!title) throw new Error("Title is required.");
  if (!requesterId) throw new Error("Requester is required.");
  if (chairs + tables + whiteboards === 0) throw new Error("Pick at least one item.");

  const need: Array<{ category: string; n: number }> = [
    { category: "Chair", n: chairs },
    { category: "Table", n: tables },
    { category: "Whiteboard", n: whiteboards },
  ];

  // Reserve items from storage, oldest serial first.
  const picked: string[] = [];
  for (const { category, n } of need) {
    if (n <= 0) continue;
    const found = await prisma.asset.findMany({
      where: { category, status: "IN_STORAGE" },
      orderBy: { serialNo: "asc" },
      select: { id: true },
      take: n,
    });
    if (found.length < n) {
      throw new Error(`Only ${found.length} ${category}(s) available — needed ${n}.`);
    }
    for (const a of found) picked.push(a.id);
  }

  const req = await prisma.eventRequest.create({
    data: {
      title,
      description,
      startsAt,
      endsAt,
      requesterId,
      locationId,
      status: "PENDING",
      allocations: { create: picked.map((assetId) => ({ assetId, status: "ALLOCATED" })) },
    },
  });
  publish({ kind: "request.updated", requestId: req.id });
  bustEvents();
  return req.id;
}

export async function approveEventRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const approverId = String(formData.get("approverId") ?? "") || null;
  await prisma.eventRequest.update({
    where: { id },
    data: { status: "APPROVED", approverId },
  });
  publish({ kind: "request.updated", requestId: id });
  bustEvents();
}

export async function rejectEventRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await prisma.eventRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  publish({ kind: "request.updated", requestId: id });
  bustEvents();
}

// ─── Dispatch / Return ───────────────────────────────────────────────────

/**
 * Mark all allocated items as IN_TRANSIT toward the event room.
 * The asset's `currentLocationId` becomes the *destination* — source is the
 * prior event in the ledger. Staff scans at the destination flip status to
 * AT_EVENT and confirm arrival.
 */
export async function dispatchEvent(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const req = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    include: { allocations: { include: { asset: true } } },
  });
  if (!req) throw new Error("Request not found");
  if (!req.locationId) throw new Error("Event has no destination room");

  const destination = await prisma.location.findUnique({ where: { id: req.locationId } });
  if (!destination) throw new Error("Destination room missing");

  for (const alloc of req.allocations) {
    if (alloc.status !== "ALLOCATED") continue;
    const sourceLocationId = alloc.asset.currentLocationId;
    await prisma.$transaction([
      prisma.asset.update({
        where: { id: alloc.assetId },
        data: { status: "IN_TRANSIT", currentLocationId: destination.id },
      }),
      prisma.eventAllocation.update({
        where: { id: alloc.id },
        data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
      }),
      prisma.assetEvent.create({
        data: {
          assetId: alloc.assetId,
          eventType: "CHECKOUT",
          locationId: sourceLocationId,
          actorId: req.approverId ?? req.requesterId,
          statusAfter: "IN_TRANSIT",
          source: "MANUAL",
          eventRequestId: req.id,
          notes: `→ ${destination.name}`,
        },
      }),
    ]);
    publish({ kind: "asset.scanned", assetId: alloc.assetId, locationId: sourceLocationId, source: "MANUAL" });
    publish({ kind: "asset.updated", assetId: alloc.assetId });
  }

  await prisma.eventRequest.update({
    where: { id: requestId },
    data: { status: "IN_PROGRESS" },
  });
  publish({ kind: "request.updated", requestId });
  bustAll();
}

// ─── Staff scan (transit arrival) ────────────────────────────────────────

export type StaffScanResult =
  | { ok: true; serialNo: string; newStatus: string; fromName: string; toName: string; damaged: boolean }
  | { ok: false; error: string };

/**
 * A staff member scans an IN_TRANSIT item to confirm it arrived at its
 * destination. If `damaged` is true the item lands in DAMAGED at the
 * destination and waits for repair (allocation stays CHECKED_OUT so the
 * event detail page still shows it).
 *
 * Otherwise, status flips based on destination type:
 *   STORAGE → IN_STORAGE (allocation marked RETURNED; request completes if all back)
 *   ROOM / EVENT_SPACE → AT_EVENT (allocation stays CHECKED_OUT until return trip)
 */
export async function staffScan(input: { serialNo: string; damaged: boolean }): Promise<StaffScanResult> {
  const serialNo = input.serialNo.trim();
  if (!serialNo) return { ok: false, error: "Serial required" };

  const asset = await prisma.asset.findUnique({
    where: { serialNo },
    include: {
      currentLocation: true,
      allocations: {
        where: { status: { in: ["ALLOCATED", "CHECKED_OUT"] } },
        include: { eventRequest: true },
        orderBy: { checkedOutAt: "desc" },
      },
    },
  });
  if (!asset) return { ok: false, error: `Unknown serial ${serialNo}` };
  if (asset.status !== "IN_TRANSIT") {
    return { ok: false, error: `${serialNo} is not in transit (current: ${asset.status.replace(/_/g, " ")})` };
  }

  const destination = asset.currentLocation;
  if (!destination) return { ok: false, error: "No destination set" };

  const lastSettled = await prisma.assetEvent.findFirst({
    where: { assetId: asset.id, NOT: { statusAfter: "IN_TRANSIT" } },
    orderBy: { createdAt: "desc" },
    include: { location: true },
  });
  const fromName = lastSettled?.location?.name ?? "Unknown";

  const arrivingAtStorage = destination.type === "STORAGE";
  const newStatus = input.damaged ? "DAMAGED" : arrivingAtStorage ? "IN_STORAGE" : "AT_EVENT";
  const newCondition = input.damaged ? "BROKEN" : asset.condition;

  await prisma.asset.update({
    where: { id: asset.id },
    data: { status: newStatus, condition: newCondition },
  });
  await prisma.assetEvent.create({
    data: {
      assetId: asset.id,
      eventType: "SCAN",
      locationId: destination.id,
      statusAfter: newStatus,
      conditionAfter: newCondition,
      source: "QR_SCAN",
      eventRequestId: asset.allocations[0]?.eventRequestId ?? null,
      notes: input.damaged
        ? `Arrived damaged at ${destination.name}`
        : `Arrived at ${destination.name}`,
    },
  });

  if (arrivingAtStorage && asset.allocations[0]) {
    const alloc = asset.allocations[0];
    await prisma.eventAllocation.update({
      where: { id: alloc.id },
      data: { status: "RETURNED", returnedAt: new Date(), returnedCondition: newCondition },
    });
    if (alloc.eventRequestId) {
      const remaining = await prisma.eventAllocation.count({
        where: { eventRequestId: alloc.eventRequestId, status: { in: ["ALLOCATED", "CHECKED_OUT"] } },
      });
      if (remaining === 0) {
        await prisma.eventRequest.update({
          where: { id: alloc.eventRequestId },
          data: { status: "COMPLETED" },
        });
      }
    }
  }

  publish({ kind: "asset.scanned", assetId: asset.id, locationId: destination.id, source: "QR_SCAN" });
  publish({ kind: "asset.updated", assetId: asset.id });

  bustAll();

  return {
    ok: true,
    serialNo: asset.serialNo,
    newStatus,
    fromName,
    toName: destination.name,
    damaged: input.damaged,
  };
}

/**
 * Flip all checked-out, undamaged items back into IN_TRANSIT — destination is
 * Lobby Storage. Damaged items stay where they are for repair.
 */
export async function returnEventToStorage(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const req = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    include: { allocations: { include: { asset: true } } },
  });
  if (!req) throw new Error("Request not found");

  const storage = await prisma.location.findFirst({ where: { type: "STORAGE" } });
  if (!storage) throw new Error("No storage location configured");

  for (const alloc of req.allocations) {
    if (alloc.status !== "CHECKED_OUT") continue;
    if (alloc.asset.status === "DAMAGED") continue;
    const sourceLocationId = alloc.asset.currentLocationId;
    await prisma.$transaction([
      prisma.asset.update({
        where: { id: alloc.assetId },
        data: { status: "IN_TRANSIT", currentLocationId: storage.id },
      }),
      prisma.assetEvent.create({
        data: {
          assetId: alloc.assetId,
          eventType: "CHECKIN",
          locationId: sourceLocationId,
          actorId: req.approverId ?? req.requesterId,
          statusAfter: "IN_TRANSIT",
          source: "MANUAL",
          eventRequestId: req.id,
          notes: `→ ${storage.name}`,
        },
      }),
    ]);
    publish({ kind: "asset.scanned", assetId: alloc.assetId, locationId: sourceLocationId, source: "MANUAL" });
    publish({ kind: "asset.updated", assetId: alloc.assetId });
  }

  publish({ kind: "request.updated", requestId });
  bustAll();
}

/**
 * Close an in-progress event instantly: every still-checked-out, non-damaged
 * item is teleported back to the location it was dispatched FROM (read off
 * the original CHECKOUT AssetEvent), with the matching resting status. No
 * scan trip required — the event flips to COMPLETED in one click.
 *
 * Damaged items are left where they are for repair; they keep their
 * CHECKED_OUT allocation so they still show on the event detail.
 */
export async function closeEvent(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const req = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    include: { allocations: { include: { asset: true } } },
  });
  if (!req) throw new Error("Request not found");

  for (const alloc of req.allocations) {
    if (alloc.status !== "CHECKED_OUT") continue;
    if (alloc.asset.status === "DAMAGED") continue;

    // The CHECKOUT event was created at dispatch time with
    // locationId = the pre-dispatch source location. Use it as the return target.
    const checkout = await prisma.assetEvent.findFirst({
      where: { assetId: alloc.assetId, eventRequestId: req.id, eventType: "CHECKOUT" },
      include: { location: true },
      orderBy: { createdAt: "desc" },
    });
    const origin = checkout?.location;
    if (!origin) continue;

    const restingStatus =
      origin.type === "STORAGE"
        ? "IN_STORAGE"
        : origin.type === "ROOM" || origin.type === "EVENT_SPACE"
          ? "AT_EVENT"
          : "IN_STORAGE";

    await prisma.$transaction([
      prisma.asset.update({
        where: { id: alloc.assetId },
        data: { status: restingStatus, currentLocationId: origin.id },
      }),
      prisma.eventAllocation.update({
        where: { id: alloc.id },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          returnedCondition: alloc.asset.condition,
        },
      }),
      prisma.assetEvent.create({
        data: {
          assetId: alloc.assetId,
          eventType: "CHECKIN",
          locationId: origin.id,
          actorId: req.approverId ?? req.requesterId,
          statusAfter: restingStatus,
          source: "MANUAL",
          eventRequestId: req.id,
          notes: `Auto-returned to ${origin.name} on event close`,
        },
      }),
    ]);
    publish({ kind: "asset.updated", assetId: alloc.assetId });
  }

  await prisma.eventRequest.update({
    where: { id: requestId },
    data: { status: "COMPLETED" },
  });
  publish({ kind: "request.updated", requestId });
  bustAll();
}
