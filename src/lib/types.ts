// QTrack shared types — these mirror the string fields in schema.prisma.
// Centralised here so any change is felt across UI, API, and seed.

export const ASSET_STATUSES = [
  "IN_USE",
  "IN_STORAGE",
  "AT_EVENT",
  "IN_TRANSIT",
  "DAMAGED",
  "MISSING",
  "DISPOSED",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR", "BROKEN"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const LOCATION_TYPES = [
  "ROOM",
  "STORAGE",
  "EVENT_SPACE",
  "GATEWAY",
  "OUTSIDE",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const ASSET_EVENT_TYPES = [
  "ADOPTED",
  "SCAN",
  "CHECKOUT",
  "CHECKIN",
  "GATEWAY_PASS",
  "CONDITION_REPORT",
  "STATUS_CHANGE",
  "MOVED",
  "DISPOSAL",
  "MAINTENANCE",
] as const;
export type AssetEventType = (typeof ASSET_EVENT_TYPES)[number];

export const EVENT_SOURCES = [
  "QR_SCAN",
  "RFID_GATEWAY",
  "MANUAL",
  "SYSTEM",
  "CAMERA_AI",
] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

export const USER_ROLES = ["FACILITIES", "EVENTS", "FINANCE", "WORKER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ALLOCATION_STATUSES = [
  "ALLOCATED",
  "CHECKED_OUT",
  "RETURNED",
  "MISSING",
] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const ALERT_TYPES = [
  "MISSED_RETURN",
  "FIXED_MOVED",
  "CONDITION_REGRESSION",
  "UNSCANNED_TIMEOUT",
  "MISSING_AFTER_EVENT",
  "WRONG_LOCATION",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const STATUS_COLORS: Record<AssetStatus, string> = {
  IN_USE:     "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  IN_STORAGE: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  AT_EVENT:   "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
  IN_TRANSIT: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  DAMAGED:    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  MISSING:    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  DISPOSED:   "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30",
};

export const CONDITION_COLORS: Record<Condition, string> = {
  EXCELLENT: "text-emerald-700 dark:text-emerald-300",
  GOOD:      "text-sky-700 dark:text-sky-300",
  FAIR:      "text-amber-700 dark:text-amber-300",
  POOR:      "text-orange-700 dark:text-orange-300",
  BROKEN:    "text-rose-700 dark:text-rose-300",
};

export const STATUS_LABEL: Record<AssetStatus, string> = {
  IN_USE: "In Use",
  IN_STORAGE: "In Storage",
  AT_EVENT: "At Event",
  IN_TRANSIT: "In Transit",
  DAMAGED: "Damaged",
  MISSING: "Missing",
  DISPOSED: "Disposed",
};
