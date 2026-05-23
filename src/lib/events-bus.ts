// In-process pub/sub for live updates across SSE clients.
// Survives HMR by attaching to globalThis. Single-process — fine for hackathon
// and any small deployment. For multi-instance, swap to Redis pub/sub.

import { EventEmitter } from "node:events";

declare global {
  // eslint-disable-next-line no-var
  var __qtrackBus: EventEmitter | undefined;
}

export const bus: EventEmitter =
  globalThis.__qtrackBus ?? new EventEmitter().setMaxListeners(200);

if (!globalThis.__qtrackBus) globalThis.__qtrackBus = bus;

export type BusEvent =
  | { kind: "asset.updated"; assetId: string }
  | { kind: "asset.scanned"; assetId: string; locationId: string | null; source: string }
  | { kind: "alert.created"; alertId: string }
  | { kind: "request.updated"; requestId: string }
  | { kind: "tick" };

export function publish(ev: BusEvent) {
  bus.emit("event", ev);
}
