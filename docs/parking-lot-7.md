# Project Parking Lot — Continuation 7

> This file is a physical continuation of `docs/parking-lot.md` through `docs/parking-lot-6.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 8, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace. Stable IDs remain global across the complete parking-lot sequence; row/file position is not priority; new material is reconciled against existing canonical concerns before a new identity is created.

---

## `PL-DEPLOY` Refinement — Share-Capital Release Cost and Recovery-Time Decision

**Date:** September 8, 2026 (live regular-session operator reasoning)  
**State:** RECONCILED exploration under existing `PL-DEPLOY`; no new `PL-*` identity created  
**Rich discovery record:** `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`

### Intake

Live operator reasoning over the real GDX share position sharpened the existing `PL-DEPLOY` capital-state-management thread into a concrete decision problem. The operator compared immediate sale, short covered-call recovery attempts, and collars after observing three different post-short-call outcomes in BNO, COPX, and GDX.

Canonical mapping:

> **Underwater share-capital release cost / recovery-time decision → merged/refined into `PL-DEPLOY`**

Secondary pressure remains with `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`, and the Cash-Flow Operating Regime's capital-velocity objective.

No new parking-lot identity is created.

### What was discovered

The three positions happened to originate as buy-writes, but the BW entry mechanism was incidental. All three could have been ordinary owned shares followed by covered calls. The relevant structure is:

> **Shares → short call → resolution → next capital state**

The observed outcomes were:

- **BNO — automatic cash conversion:** shares were called away; capital returned directly to cash and was immediately redeployed.
- **COPX — low-cost voluntary cash conversion:** the call expired OTM and shares remained, but weekend appreciation carried COPX through basis; the operator sold at a small profit and immediately redeployed the cash.
- **GDX — costly-or-delayed cash conversion:** the call expired OTM and shares remained below basis. Converting to cash now requires realizing a loss; attempting to recover basis requires keeping the capital unavailable for additional time while accepting market risk.

GDX therefore exposed two distinct release costs:

1. **Monetary release cost:** realize erosion now to make the capital fungible immediately.
2. **Time release cost:** keep the capital encumbered for a bounded recovery attempt, with compensation and/or downside protection, while accepting that the next decision boundary may arrive with the shares still underwater.

The live GDX position was approximately 100 shares at $103.77 stock basis and ~$99.2–$99.3 spot — roughly $9.9k of current share capital and roughly $450 underwater. The Principal constructed real Fidelity examples including a 3-DTE $104 covered call (~$45 proceeds), a 3-DTE $95/$104 collar (roughly $5 debit, ~$95 floor), a 10-DTE $104 covered call (~$144 proceeds), and a near-zero-cost 10-DTE $95/$104 collar.

The important decision is not which contract has the highest premium. It is whether realizing roughly the current loss is cheaper than keeping roughly $9.9k unavailable for another 3, 10, or more days while attempting a better exit — with explicit visibility into compensation, downside, recovery room, next state, and next decision date.

A recovery attempt buys another **decision boundary**, not a guaranteed recovery. At that boundary the shares may have recovered/called away into cash, or may remain underwater and present substantially the same decision again.

### Operator-decision-support implication

This strengthens the hypothesis that future Share/Capital Deployment decision support needs to expose consequences that `Prod v0` alone cannot express. For an underwater share block, useful observable dimensions include:

- money sacrificed to release capital now;
- time sacrificed by waiting;
- compensation received while waiting;
- downside accepted or bounded;
- recovery / participation retained;
- resulting capital state;
- next natural decision date.

This does **not** imply a universal scalar score. The smallest useful design question is how to put these competing consequences in front of the operator without prematurely collapsing them into one recommendation metric or predicting the underlying's future price.

### Reconciliation Completion Record

#### Intake

Canonical identity: **`PL-DEPLOY`**. No new parking-lot ID is created.

Rich why/evidence record: `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`.

Secondary mappings: `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`, Cash-Flow Operating Regime / capital velocity.

#### Strategic disposition

**Strengthens existing strategic direction; no roadmap change required.**

The finding directly supports the existing cash-flow mission's simultaneous requirements to maintain capital velocity and avoid consuming the capital base. It supplies concrete live evidence for the tradeoff between those objectives when owned shares remain underwater after a short-call cycle.

#### Architectural disposition

**Sharpens existing Deployment Opportunity / capital-state-management pressure; no new architecture direction is authorized.**

The future operator question is increasingly concrete:

> **What does releasing or retaining this capital cost in money, time, and risk, and what state will I own next?**

This is exploration/design evidence. It does not ratify Share Deployment, Capital Deployment, a release-cost object, a state machine, a path optimizer, or a new ranking model.

#### Parking-lot disposition / mapping

**Retained and refined under `PL-DEPLOY`.**

The discovery is a direct continuation of docs 47 and 48 rather than a separate concern. Existing secondary owners remain distinct:

- `PL-POL-01` owns cash-flow-safe recovery and erosion-policy questions;
- `PL-PORT-01` owns portfolio-state and basis maturity;
- `PL-DEC-BEH` owns behavioral discipline around basis/reference-point effects.

#### Why-state

Durable why-state is preserved in:

- `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`

The rich record preserves the BNO/COPX/GDX comparison, the correction that BW was incidental provenance, the real GDX numbers and Fidelity CC/collar examples, monetary-vs-temporal release cost, the possibility of unresolved underwater shares at the next boundary, and the operator-facing consequence dimensions.

No separate journal entry is required because the rich discovery record preserves the unfinished intellectual state and this canonical record exposes its disposition.

#### Next authorized mode

**Further exploration / design only.**

Useful next work is to determine the smallest operator-facing representation of monetary release cost, temporal release cost, compensation, downside envelope, recovery room, resulting state, and next decision date; then test that representation against additional real owned-share outcomes before considering any generalized scoring or implementation.

**Not authorized:** Share Deployment implementation, Capital Deployment implementation, release-cost scoring, recovery-probability prediction, generalized state/path framework, `Prod v0` replacement, automatic selling/redeployment, direct broker execution, policy promotion, or roadmap reprioritization.

---

## `PL-OPS-08` — Observation Continuity / Gap Recovery

**Date:** September 9, 2026 (live operator incident)  
**State:** INTAKE — new canonical identity created; broader problem deferred, bounded forced one-shot acquisition recovery control implemented (nudge-based first attempt falsified and replaced)  
**Concept home:** `foundations/evidence-appliance.md`, `PL-OPS-01`, `PL-OPS-03`, `PL-OPS-04`, `PL-ARCH-06`

### Intake

A local development-machine incident exposed a durable operational gap in the evidence appliance's always-on promise. Concrete evidence:

- Kiro (the IDE) was restarted around midday.
- The backend evidence service and frontend dev server were **not** restarted, and — separately — nothing re-started acquisition after the operator's environment churned.
- Observation effectively **stopped for roughly half the trading day**.
- Consequently, temporal surfaces such as Operator Console sparklines and The Field terminate mid-session: the evidence model has a hole where continuous observation should exist.

This is the first durable record of the general concern: **the appliance's continuity depends on a process actually running, and today it silently did not.** The appliance identity (`foundations/evidence-appliance.md`) asserts always-on, browser-independent, restart-durable observation. Today's incident is evidence that, in the current local topology, that identity is only partially realized — a running process is assumed, gaps are neither detected nor surfaced nor recovered, and the operator discovered the gap by noticing a truncated sparkline rather than by any appliance signal.

This is a genuinely new unresolved concern. It is adjacent to but distinct from existing items:

- `PL-OPS-01` (Cloud Deployment / always-on) would **prevent most** forgotten-restart gaps by removing the laptop-bound process, but does not itself detect, surface, or recover a gap that occurs.
- `PL-OPS-03` (Prior-Epoch Failed Scheduler Gap / recovery-probe) recovers **per-symbol lifecycle** failures within the scheduler; it is not observation-timeline continuity or whole-appliance downtime recovery.
- `PL-OPS-04` (Notification / Background Awareness) is a plausible **channel** for surfacing a detected continuity gap, but owns decision-state transitions, not evidence-continuity semantics.
- `PL-ARCH-06` (transitional recommendation-engine placement) and the broader topology remain the backdrop; this concern does not authorize topology change.

### What is deferred (the broader problem)

`PL-OPS-08` durably preserves the broader **Observation Continuity / Gap Recovery** problem for later work. Candidate later directions (none authorized here):

- **Gap detection / visibility** — the appliance recognizes and reports a break in its own observation timeline (a continuity form of Secondary Observation) rather than relying on the operator to notice a truncated sparkline.
- **Historical recovery where authoritative evidence exists** — bounded backfill of missed observations only where a provider can supply authoritative point-in-time evidence, consistent with session semantics and "failed refresh preserves evidence."
- **Provenance distinguishing recovered history from live observation** — recovered points must be labeled as recovered, never silently presented as continuous live observation (persist facts; derive trust).
- **Stronger always-on / process-recovery behavior** — supervision/auto-restart of acquisition and, ultimately, `PL-OPS-01` cloud always-on so a forgotten local restart cannot silently halt observation.

### What was implemented now (bounded operational repair)

A **forced one-shot acquisition** control was implemented against the **existing** acquisition machinery, under explicit Principal authorization, as a bounded operational repair — explicitly **not** a solution to the broader problem.

**Rejected first attempt (preserved why-state).** The first implementation wired the control to the pre-existing `POST /api/evidence/refresh` → `AcquisitionWorker.nudge()`. Operator testing (Sep 9, after close) falsified it: `nudge()` only pulls **due** work forward **within an already-valid session** and is a **deterministic no-op once the session gate is closed**. For the actual recovery scenario ("I forgot to restart the servers; get Wheelwright caught up, including after hours"), the session gate is exactly what's closed, so the button could never accomplish its job. Diagnostic status confirmed the mechanism: `scheduler.state: session_blocked`, `cycleCount: 0`, `symbolsAcquiredTotal: 0`. Merely improving the control's observability (e.g. reporting "market closed") was explicitly rejected as polishing a control that still cannot do its intended work. The nudge capability itself remains valid but is only "run due work sooner during an already-valid session" — a different, smaller problem.

**Shipped control (forced one-shot).** `POST /api/evidence/refresh` was **re-implemented** to call a new `AcquisitionWorker.forceAcquireOnce()`:

- Runs exactly **one full acquisition cycle now** over the currently relevant work queue (the existing prioritized A/B/C/D universe), through the existing provider/cache/persistence paths, **bypassing the scheduler's due-time and market-session gating** for that single operator-requested cycle.
- Serializes on the worker's single acquisition thread (Single Acquisition Authority — no split-brain); does **not** call `scheduleCycle()`, so the automatic scheduler's own timer/cadence is untouched.
- Still respects the **provider-availability safety gate** (an UNVERIFIED/SUSPENDED provider returns `PROVIDER_UNAVAILABLE` rather than forcing a broken acquisition). Provider safety is not session policy.
- Returns an honest disposition: `outcome` (`ACQUIRED` / `NOT_RUNNING` / `PROVIDER_UNAVAILABLE` / `INTERRUPTED`), `symbolsAcquired`, `workQueueDepth`, `generation`, the real (bypassed) `sessionPosture`, and `recoversHistory: false`.
- Frontend `forceEvidenceAcquisition()` (`src/evidence/nudge-acquisition.ts`) + Operator Console `ForceAcquisitionButton` (`src/operator-console/ForceAcquisitionButton.tsx`, group-by bar) invoke it and report the outcome ("Refresh evidence now" → "Acquired N" / "Acquired (up to date)" / "Provider unavailable" / "Appliance offline" / "Acquisition failed").

**Provenance invariant preserved.** Acquired evidence keeps its real `retrievedAt` timestamp and actual provider/environment provenance (via the unchanged `setChain`/`setExpirations` paths). An after-hours acquisition is written with its true (possibly delayed) timestamp and posture, so it can **never** masquerade as an observation captured during the missing interval.

> **Explicit limitation (unchanged):** this control does **not** solve historical gaps. It acquires evidence **forward from now**; it cannot reconstruct the observations missed during a prior outage. Gap detection, historical recovery, recovered-vs-live provenance, and always-on process recovery remain the deferred `PL-OPS-08` work above.

This item deliberately does **not** derail the active constraint-identification campaign (Docs 39/40 / the `A`/`4AM` cycle): the broader continuity problem is recorded, today's bounded recovery control is shipped, and consequence work resumes.

### Reconciliation Completion Record — `PL-OPS-08`

#### Intake

Canonical identity: **`PL-OPS-08`** (new). Concept home: `foundations/evidence-appliance.md`. Related: `PL-OPS-01`, `PL-OPS-03`, `PL-OPS-04`, `PL-ARCH-06`.

#### Strategic disposition

**Strengthens existing strategic direction; no roadmap change required.** The incident is concrete evidence for the already-accepted always-on appliance direction (of which `PL-OPS-01` cloud deployment is the primary enabler). It does not open a new strategic Bet; it sharpens the reliability/continuity dimension of the existing appliance identity.

#### Architectural disposition

**New operational pressure recorded under the existing appliance identity; no architecture change authorized now.** The bounded recovery control is an implementation-convenience wiring of an existing endpoint to an existing surface — it is **not** new architecture and does not ratify gap detection, backfill, recovered-evidence provenance, or process supervision. Those remain design/exploration pressure against `foundations/evidence-appliance.md` and `PL-OPS-01`.

#### Parking-lot disposition / mapping

**New identity `PL-OPS-08` created and retained.** Not merged into `PL-OPS-01` (prevention ≠ detection/recovery), `PL-OPS-03` (per-symbol lifecycle ≠ timeline continuity), or `PL-OPS-04` (notification channel ≠ continuity semantics). Cross-references those items and `PL-ARCH-06`.

#### Why-state

Durable why-state is preserved in this record. No separate journal entry or standalone discovery document is required: the incident, its evidence, the deferred broader problem, the bounded repair, and the explicit limitation are all captured here. If later exploration develops the gap-detection/backfill design, a richer artifact should be created and linked from this item.

#### Next authorized mode

- **Implemented / shippable now:** the bounded forced one-shot acquisition recovery control described above (`forceAcquireOnce()` + `ForceAcquisitionButton`, already built and tested). The superseded nudge-based control was falsified by operator testing and replaced.
- **Further exploration / design only** for the broader `PL-OPS-08` problem (gap detection, historical recovery, recovered-vs-live provenance, always-on process recovery).
- **Not authorized:** scheduler redesign, historical backfill, new provider capability, cloud/topology change, or any change to freshness horizons, cache TTLs, concurrency, provider profile, or session semantics merely to improve visible continuity metrics.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 8, 2026 | Share-capital release-cost / recovery-time decision reconciled into existing `PL-DEPLOY`. BNO, COPX, and GDX provide three real post-short-call resolution paths; GDX exposes the operator choice between monetary erosion now and temporal encumbrance/risk while attempting basis recovery. Rich snapshot: `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`. No Share/Capital Deployment implementation or scoring model authorized. |
| Sep 9, 2026 | `PL-OPS-08` (Observation Continuity / Gap Recovery) created after a live incident: Kiro restarted midday, backend/frontend not restarted, observation stopped ~half the trading day, sparklines/The Field terminate mid-session. Broader problem (gap detection, historical recovery, recovered-vs-live provenance, always-on process recovery) deferred. |
| Sep 9, 2026 | First recovery control (nudge-based) **falsified by operator testing**: `worker.nudge()` only advances due work within an already-valid session and is a deterministic no-op once the session gate is closed — useless for the after-hours recovery scenario. **Replaced** with a forced one-shot acquisition: `AcquisitionWorker.forceAcquireOnce()` runs one full cycle now over the relevant universe via existing provider/cache/persistence paths, bypassing due-time and session gating for that single cycle, while preserving real timestamps/provenance, respecting the provider-availability safety gate, and leaving the scheduler cadence untouched. `POST /api/evidence/refresh` re-implemented; frontend `forceEvidenceAcquisition()` + Operator Console `ForceAcquisitionButton`. Still explicitly does **not** reconstruct historical gaps. No scheduler/backfill/provider/cloud/topology change authorized. |
