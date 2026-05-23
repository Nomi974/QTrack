# QTrack — Smart Asset & Furniture Management for QSTP

> Every chair knows where it is.
> Every event leaves a paper trail.
> Audits stop being events — they become **replays**.

QTrack is a continuous-tracking asset management system built for the
operational reality of Qatar Science & Technology Park. It replaces
year-end spreadsheet audits with an immutable event ledger that updates
itself as people, scanners, and RFID gateways move through the campus.

This repository was built in a single hackathon sprint.

## What it solves

| QSTP pain point | What QTrack does |
| --- | --- |
| **Counting** — audits exceed one day; items move mid-count | Continuous tracking via RFID gateways at choke points + mobile QR scans. Audit = replay the event ledger. |
| **Tagging** — tags fall off / become unreadable | Tiered tagging strategy: riveted epoxy QR + UHF RFID inlay (tamper-evident), BLE for high-value items, stamped metal plates for fixed assets. |
| **Status** — no one knows the live status | Asset state is *derived* from the event ledger, never self-reported. `IN_USE ⇄ IN_STORAGE ⇄ AT_EVENT ⇄ IN_TRANSIT ⇄ DAMAGED → DISPOSED`. |
| **Events** — 50 chairs leave, who knows when they come back? | Request → approve → bulk checkout → return → reconcile. Items that don't return raise alerts within seconds. |
| **Fixed vs Mobile** — built-in furniture is invisible | `isFixed` + locked `homeLocation`. Any scan elsewhere is a critical alert. |
| **Cross-department views** | One database. Three dashboards: Facilities, Events, Finance — each tuned to its workflow. |

## Architecture in one diagram

```
                                                      ┌─────────────┐
   ┌───────────┐                                      │  Facilities │
   │ Mobile QR │ ─┐                                   │  Dashboard  │
   └───────────┘  │                                   │  (live map) │
                  │     ┌──────────────────────────┐  └─────────────┘
   ┌───────────┐  │     │   Event-Sourced Engine   │  ┌─────────────┐
   │ RFID Gate │ ─┼──►  │   recordScan() →         │ ►│   Events    │
   └───────────┘  │     │   • append AssetEvent    │  │  Dashboard  │
                  │     │   • derive new status    │  └─────────────┘
   ┌───────────┐  │     │   • detect anomalies     │  ┌─────────────┐
   │ Manual UI │ ─┘     │   • broadcast over SSE   │ ►│   Finance   │
   └───────────┘        └──────────────────────────┘  │  Dashboard  │
                                                      └─────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   Anomaly Engine   │
                        │  • missed return   │
                        │  • fixed moved     │
                        │  • condition drop  │
                        │  • unscanned 90d   │
                        └────────────────────┘
```

## Run it locally

```bash
cd qtrack
npm install
npx prisma migrate dev     # create SQLite database
npx tsx prisma/seed.ts     # 13 locations, 158 assets, demo users
npm run dev                # http://localhost:3000
```

The seed creates one full QSTP-flavoured campus floor with:
- 80 stackable event chairs
- 30 office chairs (Aeron)
- 20 sit-stand desks
- 6 conference tables
- 12 high-value AV / laptop items
- 10 built-in / fixed items with locked home locations
- 5 users (Events, Facilities, Finance, Worker, Admin)
- 13 locations including 3 RFID gateways

## Demo flow (judge-facing)

See [DEMO.md](./DEMO.md) for the timed walkthrough.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **React 19** (Server Components + Client Components for interactive bits)
- **Prisma 7** with `better-sqlite3` driver adapter
- **Tailwind CSS 4** for styling
- **Server-Sent Events** for live floor-plan updates (single-process bus → swap in Redis for multi-instance)
- **html5-qrcode** for browser-camera QR scanning
- **qrcode** for printable SVG tag generation

## Production roadmap (what we'd ship next)

1. **Real RFID readers** — replace the simulator with Impinj / Zebra UHF gateways at every doorway and loading bay.
2. **Auth + audit log** — SSO via Microsoft 365 for QSTP, every Server Action is already auditable (the `actor` field is in the schema).
3. **Mobile app shell** — React Native wrapper for offline-resilient scanning by facilities staff.
4. **Vision-based condition reporting** — phone-camera upload of damaged item → Claude vision call estimates severity and repair cost (prompt-cached).
5. **Predictive procurement** — feed monthly category demand into a small forecast to pre-empt shortages before they happen.
6. **Multi-floor / multi-building** — locations already have `floor` and `building` fields. Just need the floor switcher in the UI.
