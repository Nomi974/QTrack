# QTrack — Judge-Facing Demo Script

**Total time: ~6 minutes.** Practiced once, run it cold.

The story arc is one sentence: *"Maryam from QSTP Events needs 50 chairs for tonight."*
Everything else hangs off that.

---

## Setup (before judges arrive)

1. `npm run dev` → open three browser windows side-by-side at `localhost:3001`:
   - Left: `/facilities` (the floor plan)
   - Middle: `/events` (the workflow)
   - Right: `/simulator` (the gateway control panel)
2. Open a fourth tab on your phone: `/scan` (real QR scan).
3. Have one printed QR tag in your hand (`/assets/QSTP-CHR-0001` → print).

---

## Beat 1 — The problem (45 sec)

> *"QSTP owns thousands of furniture items. Right now, no one knows where any of them are. Audits take a week. Chairs leave for events and never come back. Procurement re-buys things that are already in storage."*

Open `/` (the overview). Point at:
- **158 assets on register** (live count)
- **Open alerts** widget
- **Recent activity** stream

> *"This is not a spreadsheet. Every line you see here is the result of a scan, a gateway pulse, or an event movement. The system never sleeps and it never double-counts."*

---

## Beat 2 — The tag and the scan (45 sec)

Switch to `/assets/QSTP-CHR-0001`.

> *"Every asset wears a QSTP-branded tag. Riveted onto metal, epoxy-coated. You can't peel it off without leaving a mark. The dark code is a QR for phones, but the same plate carries an RFID inlay underneath that doorway readers see."*

Pick up your phone, open the camera. Scan the printed tag.

> *"That scan landed in the ledger. Watch the dashboards."*

(They will already have updated by the time you say this.)

---

## Beat 3 — The killer demo (90 sec)

Switch to `/events/new`.

> *"Maryam needs 50 chairs for tonight's investor showcase. Watch this."*

- Type "Investor Showcase" as title.
- Set destination → Auditorium.
- Pick category → "Stackable Chair" → quantity 50 → click **Add**.
- Notice the **green recommendation banner**: *"✓ 80 in storage — no procurement needed."* This is the punchline. Say it out loud:

> *"Procurement was about to order 50 more chairs. We already have 80 in storage. That alone is the system paying for itself."*

Click **Create request (50 items)**. You land on `/events/[id]`.

Click **Approve**. Click **Check out selected**.

Watch the Facilities floor plan: 50 chairs visibly shift from Storage A to the Auditorium with live pulses.

---

## Beat 4 — Something doesn't come back (60 sec)

In the event detail, **uncheck two chairs** before returning the rest. Click **Mark selected as returned** with condition `GOOD`.

Now click `Run sweep` on `/alerts`.

Two alerts appear:
- ⚠ "Event ended but 2 items have not returned"
- The two missing chairs flip to `MISSING` status

> *"In the old world, those two chairs disappear. Maryam spends Friday afternoon walking the building. Here, they were flagged the moment we tried to close the event. The ledger names exactly which two — by serial number, by who checked them out, by where they were last seen."*

---

## Beat 5 — Continuous tracking (60 sec)

Switch to `/simulator`.

> *"This panel stands in for the real UHF RFID readers at QSTP doorways. In production, this is invisible — every doorway is a sensor."*

- Click **Start continuous traffic**. Assets pulse through gateways in real time. Floor plan dots ripple.
- After ~10 seconds, click **Stop**.

> *"What I just showed you is the answer to the counting problem. The campus never stops. Audit becomes a SQL query against a log. No one carries a clipboard."*

---

## Beat 6 — Fixed assets + Finance (45 sec)

Switch back to `/facilities`.

> *"Built-in items — wall projectors, fixed audio, reception counter — are tagged but locked to a home location."*

Point at any fixed asset on the floor plan. Then jump to `/finance`.

> *"And because every department draws from the same ledger, Finance sees this same data through a different lens. Procurement recommendations, damaged-item write-down candidates, the disposal register — all live."*

Point at the "Surplus" green banners.

---

## Beat 7 — The pitch landing (15 sec)

> *"QTrack replaces the spreadsheet, replaces the annual audit, replaces the lost chair. One system, one ledger, three departments. Every asset, every event, every moment."*

Stop. Don't keep talking. Take questions.

---

## Things judges will probe — answers ready

- **"What about real RFID?"** → The simulator is hot-swappable with a real Impinj reader pushing the same JSON to `/api/events`. We didn't have hardware in the room.
- **"Cost per tag?"** → ~3 QAR for the QR plate, ~8 QAR for the UHF RFID variant. Compare to the cost of one re-bought chair.
- **"Offline?"** → The PWA shell queues scans locally and replays them when reconnected. The ledger is append-only so order doesn't matter.
- **"Why event sourcing if a spreadsheet 'works'?"** → Spreadsheets are last-write-wins. Two staff editing during an audit silently overwrite each other. The ledger is append-only — no one can erase a scan, and audit is just `SELECT *`.
- **"Scale?"** → SQLite handles QSTP's scale (~10–100k items) easily. The Prisma adapter pattern lets us switch to Postgres in production without touching the application code.
