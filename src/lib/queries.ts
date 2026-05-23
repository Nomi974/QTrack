// Common read-side queries used across server components.
//
// Two layers of caching:
//   - React `cache()` memoizes within a single request (sibling components
//     calling `summary()` twice only run it once).
//   - `unstable_cache` keeps results between requests for a short TTL so back-
//     to-back navigations skip Prisma entirely. Mutations call
//     `revalidateTag("assets")` / `revalidateTag("events-feed")` to bust.

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

const ASSET_TAGS = ["assets"];
const EVENT_TAGS = ["events-feed"];
const ALL_TAGS = ["assets", "events-feed"];

export const summary = cache(
  unstable_cache(
    async () => {
      const [total, damagedCount, inTransitCount, byCategory, byLocation, latestEvents] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { OR: [{ status: "DAMAGED" }, { condition: "BROKEN" }] } }),
        prisma.asset.count({ where: { status: "IN_TRANSIT" } }),
        prisma.asset.groupBy({
          by: ["category", "status"],
          _count: { _all: true },
          orderBy: { category: "asc" },
        }),
        prisma.asset.groupBy({
          by: ["currentLocationId", "category"],
          _count: { _all: true },
        }),
        prisma.assetEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { asset: true, location: true },
        }),
      ]);
      return { total, damagedCount, inTransitCount, byCategory, byLocation, latestEvents };
    },
    ["summary"],
    { tags: ALL_TAGS, revalidate: 60 },
  ),
);

export const getLocations = cache(
  unstable_cache(
    async () => {
      return prisma.location.findMany({
        orderBy: [{ type: "asc" }, { name: "asc" }],
        include: { _count: { select: { currentAssets: true } } },
      });
    },
    ["getLocations"],
    { tags: ASSET_TAGS, revalidate: 300 },
  ),
);

export const getUsers = cache(
  unstable_cache(
    async () => prisma.user.findMany({ orderBy: { name: "asc" } }),
    ["getUsers"],
    { tags: ["users"], revalidate: 600 },
  ),
);

export const getEventRequests = cache(
  unstable_cache(
    async () => {
      return prisma.eventRequest.findMany({
        orderBy: { startsAt: "desc" },
        include: {
          requester: true,
          approver: true,
          location: true,
          allocations: {
            include: { asset: { include: { currentLocation: true } } },
          },
        },
      });
    },
    ["getEventRequests"],
    { tags: EVENT_TAGS, revalidate: 60 },
  ),
);

// Per-id event lookup — cached per id, invalidated by event-feed tag.
export const getEventRequest = cache(async (id: string) => {
  const inner = unstable_cache(
    async (eventId: string) => {
      return prisma.eventRequest.findUnique({
        where: { id: eventId },
        include: {
          requester: true,
          approver: true,
          location: true,
          allocations: {
            include: { asset: { include: { currentLocation: true } } },
            orderBy: { status: "asc" },
          },
        },
      });
    },
    ["getEventRequest", id],
    { tags: EVENT_TAGS, revalidate: 60 },
  );
  return inner(id);
});

/**
 * IN_TRANSIT items plus their derived "from → to" path.
 * - `to`   = asset.currentLocation (the destination it's heading toward)
 * - `from` = the location stamped on the most recent AssetEvent whose status
 *            was NOT IN_TRANSIT (i.e. where the item actually was last).
 */
export const transitItems = cache(
  unstable_cache(
    async () => {
      const assets = await prisma.asset.findMany({
        where: { status: "IN_TRANSIT" },
        include: { currentLocation: true },
        orderBy: { updatedAt: "desc" },
      });
      if (assets.length === 0) return [];

      const events = await prisma.assetEvent.findMany({
        where: {
          assetId: { in: assets.map((a) => a.id) },
          NOT: { statusAfter: "IN_TRANSIT" },
        },
        orderBy: { createdAt: "desc" },
        include: { location: true },
      });
      const lastNonTransitByAsset = new Map<string, (typeof events)[number]>();
      for (const ev of events) {
        if (!lastNonTransitByAsset.has(ev.assetId)) {
          lastNonTransitByAsset.set(ev.assetId, ev);
        }
      }

      return assets.map((a) => {
        const last = lastNonTransitByAsset.get(a.id);
        return {
          id: a.id,
          serialNo: a.serialNo,
          category: a.category,
          condition: a.condition,
          fromName: last?.location?.name ?? "Unknown",
          toName: a.currentLocation?.name ?? "Unknown",
          toId: a.currentLocation?.id ?? null,
        };
      });
    },
    ["transitItems"],
    { tags: ASSET_TAGS, revalidate: 30 },
  ),
);

/**
 * Every asset with current location + last move (previous→current).
 * Walks the AssetEvent log for each asset and finds two distinct locations.
 */
export type LogRow = {
  id: string;
  serialNo: string;
  category: string;
  status: string;
  condition: string;
  currentLocation: string;
  lastMoveFrom: string | null;
  lastMoveTo: string | null;
  lastMoveAt: Date | null;
};

export const assetLog = cache(
  unstable_cache(
    async (): Promise<LogRow[]> => {
      const assets = await prisma.asset.findMany({
        orderBy: [{ category: "asc" }, { serialNo: "asc" }],
        include: { currentLocation: true },
      });
      const events = await prisma.assetEvent.findMany({
        where: { assetId: { in: assets.map((a) => a.id) } },
        orderBy: { createdAt: "desc" },
        include: { location: true },
      });

      const eventsByAsset = new Map<string, typeof events>();
      for (const ev of events) {
        const arr = eventsByAsset.get(ev.assetId) ?? [];
        arr.push(ev);
        eventsByAsset.set(ev.assetId, arr);
      }

      return assets.map((a) => {
        const evs = eventsByAsset.get(a.id) ?? [];
        const latest = evs[0];
        let prevDifferent: (typeof evs)[number] | undefined;
        for (let i = 1; i < evs.length; i++) {
          if (evs[i].locationId && latest?.locationId && evs[i].locationId !== latest.locationId) {
            prevDifferent = evs[i];
            break;
          }
        }
        return {
          id: a.id,
          serialNo: a.serialNo,
          category: a.category,
          status: a.status,
          condition: a.condition,
          currentLocation: a.currentLocation?.name ?? "—",
          lastMoveFrom: prevDifferent?.location?.name ?? null,
          lastMoveTo: prevDifferent ? latest?.location?.name ?? null : null,
          lastMoveAt: prevDifferent ? latest?.createdAt ?? null : null,
        };
      });
    },
    ["assetLog"],
    { tags: ASSET_TAGS, revalidate: 60 },
  ),
);

/**
 * Inventory bucket per category for Finance.
 */
export const procurementMap = cache(
  unstable_cache(
    async () => {
      const rows = await prisma.asset.groupBy({
        by: ["category", "status"],
        _count: { _all: true },
      });
      type Bucket = { category: string; total: number; inStorage: number; inTransit: number; atEvent: number; damaged: number };
      const buckets = new Map<string, Bucket>();
      for (const r of rows) {
        const b = buckets.get(r.category) ?? {
          category: r.category, total: 0, inStorage: 0, inTransit: 0, atEvent: 0, damaged: 0,
        };
        b.total += r._count._all;
        if (r.status === "IN_STORAGE") b.inStorage += r._count._all;
        if (r.status === "IN_TRANSIT") b.inTransit += r._count._all;
        if (r.status === "AT_EVENT" || r.status === "IN_USE") b.atEvent += r._count._all;
        if (r.status === "DAMAGED") b.damaged += r._count._all;
        buckets.set(r.category, b);
      }
      return [...buckets.values()].sort((a, b) => b.total - a.total);
    },
    ["procurementMap"],
    { tags: ASSET_TAGS, revalidate: 60 },
  ),
);

export const getAssetBySerial = cache(async (serialNo: string) => {
  return prisma.asset.findUnique({
    where: { serialNo },
    include: {
      currentLocation: true,
      homeLocation: true,
      responsibleUser: true,
      events: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { location: true, actor: true, eventRequest: true },
      },
      allocations: { include: { eventRequest: true } },
    },
  });
});
