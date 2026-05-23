# QTrack — Pitch Deck

> Format: one slide per `---` block. Operational audience. Lead with the
> chair problem, land with the savings. Don't say "event sourcing" out loud.

---

## SLIDE 1 — Title

# **QTrack**
### Every chair knows where it is.

*Smart asset & furniture management for QSTP*

QSTP Hackathon · 2026

---

## SLIDE 2 — The 8pm phone call

It's 8pm. There's an investor reception at 9.

**Maryam from Events** needs 50 chairs in the Auditorium. Now.

She has no system to ask. So she does what everyone does:

1. Walks to Storage A. Counts what she can find.
2. Pulls a few chairs out of Conference Room 2.
3. Asks a colleague to grab more from the Office Wing.

By 9pm, the event starts. By 11pm, the chairs scatter.

By Monday morning, **she does not know where any of them are.**

---

## SLIDE 3 — This happens every week

| What goes wrong | What it costs QSTP |
| --- | --- |
| Chairs don't come back after events | Replacement orders, every quarter |
| Procurement re-buys items already in storage | Capital tied up in duplicate inventory |
| Damaged chairs stay in circulation | Embarrassment in front of visitors |
| Audits take a full week, double-count, miss items | Days of staff time, every year |
| Built-in furniture is invisible on the register | Compliance and depreciation gaps |
| No one knows the true count, location, or condition | Decisions made on guesswork |

---

## SLIDE 4 — The current "system" is a spreadsheet

A spreadsheet is *last-write-wins*.

If two staff are auditing at the same time, one overwrites the other silently.

If a tag falls off, that asset effectively disappears from existence.

If a chair leaves for an event and never returns, the spreadsheet **never knows.**

The spreadsheet was always going to lose this fight.

---

## SLIDE 5 — The insight

> Audits are the wrong shape of the problem.

The campus is too big to count in a day.
Items move while you count.
So **stop counting in a day.**

**Count continuously, as a side-effect of normal operations.**

Every doorway is a sensor. Every scan is a permanent record. Audits become a *replay*.

---

## SLIDE 6 — QTrack, in three layers

```
1. The tag    →    Riveted, branded, tamper-evident.
                   QR for phones. UHF RFID inlay for doorways.
                   Fixed items get stamped metal plates locked to coords.

2. The ledger →    Every scan, every gateway pulse, every event movement
                   is appended to a permanent log. No deletes. No overwrites.
                   Current status is always the latest event.

3. The views  →    One database, three dashboards.
                   Facilities sees a live floor plan.
                   Events sees the request-to-return workflow.
                   Finance sees procurement signals and disposal register.
```

---

## SLIDE 7 — The 50-chair demo

Watch what happens when Maryam files her request through QTrack.

1. She types "Investor Showcase", picks "Chair", quantity 50.
2. The system says: *"✓ 80 already in storage — no procurement needed."*
3. She approves. Bulk checkout. 50 chairs move to Auditorium on the live floor plan.
4. After the event, returns are scanned in. Two chairs are missing.
5. The system flags **exactly which two**, by serial number, who checked them out, when, and the last gateway that saw them.

Old workflow: 4 hours of follow-up. New workflow: 30 seconds of action.

---

## SLIDE 8 — The numbers (one event)

| Step | Old | QTrack |
| --- | --- | --- |
| Find 50 chairs | 90 minutes walking | 5 seconds search |
| Check what's available | "I think we have enough?" | Exact live count |
| Track checkout | Verbal, on paper | Auto-logged with QR scan |
| Reconcile after event | 2–3 hours, often Monday | Real-time, ends with event |
| Find missing items | Days, sometimes never | Flagged within seconds |
| Catch procurement waste | Never | Recommendation banner before order |

**Per event saving: ~5 staff hours. Per year, across all QSTP events: hundreds.**

Plus the procurement waste avoided, which dwarfs the time savings.

---

## SLIDE 9 — The fixed-asset problem, solved

QSTP has built-in items that have never been on a register:

- Reception counters
- Wall-mounted projectors
- Fixed audio systems
- Built-in workbenches

QTrack tags these too — with stamped metal plates locked to GPS + floor coordinates.

If a "fixed" item is ever scanned somewhere else, QTrack raises a **critical alert**. That's theft detection out of the box.

For the first time, QSTP has a real fixed-asset register.

---

## SLIDE 10 — One source of truth, three views

```
                  ┌─── Facilities  ───  Live floor plan, maintenance queue
The Ledger  ──────┼─── Events      ───  Request → approve → return loop
                  └─── Finance     ───  Depreciation, procurement, disposal
```

No data sync. No "which spreadsheet is right." No reconciliation.

Same data. Three windows.

---

## SLIDE 11 — What it took to build this

Built in a single hackathon sprint.

- Working web app
- Mobile camera QR scanning
- Live floor plan with real-time updates
- Full event workflow (request → return → reconcile)
- Anomaly engine catching missed returns and fixed-asset moves
- Procurement recommendation engine
- 158 seeded assets across a realistic QSTP campus layout

All deployable today on a single Raspberry Pi. Scales to thousands of items without architectural change.

---

## SLIDE 12 — Roadmap

| Phase | What ships | Time |
| --- | --- | --- |
| **0 — Today** | Hackathon prototype with simulated RFID | done |
| **1 — Pilot** | Real UHF readers at 4 doorways, 500 assets tagged | 6 weeks |
| **2 — Campus-wide** | All buildings, all departments live | 4 months |
| **3 — Intelligence** | Photo damage assessment (AI vision), predictive procurement | 6 months |
| **4 — Beyond QSTP** | License to other research parks in Qatar and the GCC | 12 months |

---

## SLIDE 13 — Why this wins

> The brief told us: *"Build something where every asset knows where it is, what condition it's in, who has it — and raises a flag the moment something doesn't come back."*

QTrack does exactly that.

Not a smarter spreadsheet.
A campus that audits itself.

---

## SLIDE 14 — Ask

We're asking QSTP to:

1. Run a 6-week pilot in one building (cost: ~30,000 QAR for 4 RFID gateways + 500 tags).
2. Let us measure the savings.
3. If the pilot returns its cost in one quarter (which it will), go campus-wide.

The chairs are already lost. The question is whether we keep losing them.

**Thank you.**
