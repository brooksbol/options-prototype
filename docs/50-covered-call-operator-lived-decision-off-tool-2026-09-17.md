# Covered-Call Lived Decision — Operator Left Wheelwright for the Fidelity Chain Tool

**Date:** September 17, 2026
**Status:** Discovery / lived-trade confirmation under existing `PL-DEPLOY`; NOT implementation authorization and NOT a strike-selection policy change
**Trigger:** A real trade the operator executed today on shares already held, for which Wheelwright's Covered-Call surface could not express the choice the operator actually faced — so the operator used **Fidelity's option-chain tool instead of Wheelwright**.
**Observed at:** SYNC `3d98999` (bid/ask console columns just shipped; unrelated).
**Related:** `docs/48-covered-call-basis-positive-optionality-discovery-2026-09-08.md` (the anticipating discovery), `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`, `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`, `docs/23-calls-architecture.md`, `PL-DEPLOY`, `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`, `PL-ARCH-06`
**Artifact:** operator-supplied Write Desk calls export `wheelwright-calls-2026-09-17` (pasted in session; all rows delta 0.26–0.40, all OTM, no ATM/basis-anchored rows).

---

## Why this snapshot exists

Doc 48 (Sep 8) recorded, from exploratory instrumentation, that single-objective **target-delta** covered-call selection structurally hides materially different bargains against the same owned shares — specifically **basis-anchored** strikes and **higher-delta / near-ATM** strikes — and hypothesized that a covered-call surface may need to express a *plurality* of bargains rather than collapse to one "best" contract.

Today converts that hypothesis's core case from *instrumented exploration* into a **lived operational failure with a real trade behind it.** This is the strongest class of closed-loop evidence: the operator had a live decision, the evidence appliance built to support it could not, and the operator went off-tool.

> **Central finding: Wheelwright's Covered-Call surface did not express the decision the operator actually faced today, and the operator executed the trade using Fidelity's chain tool instead of Wheelwright. The recommendation model, not the data, was the gap — bid/ask/greeks/chain evidence were all present; the missing thing was the *set of postures* the surface offers.**

This authorizes nothing. It is lived-trade why-state feeding `PL-DEPLOY`.

---

## 1. The lived decision (operator, today)

The operator held shares (basis established) and faced three genuine, non-dominating choices for that capital:

1. **Sell shares and redeploy the cash.** Exit entirely; the freed capital re-enters the deployment universe (CSP / buy-write). — This is the capital-release / affordability-frontier path already recorded in doc 48 §8 and doc 49.
2. **Sell ATM calls and wait for another turn later in September.** Hold the shares, write a ~0.50-delta call for maximum premium, accept a roughly even-odds call-away near spot. Income-now, retention-neutral.
3. **Sell basis-recovery calls and hope for the best.** Hold, write a call struck so that *if assigned* the shares are sold without a realized loss (strike anchored to cost basis, not to spot or to a fixed delta), collecting premium meanwhile. The underwater / recovery posture.

**The operator chose and traded scenario 2 (ATM calls).**

Wheelwright's Covered-Call surface offered none of these cleanly:

- It applies an admissible **delta band 0.15–0.50 centered on target 0.30** as the strike-selection objective, biasing OTM. It therefore **does not surface ATM (~0.50-delta) calls** (scenario 2) and does not anchor to basis (scenario 3).
- The exploratory `basis-positive` tag from doc 48 is a hint of scenario 3 but is not a first-class, live recommendation posture on the surface.

So the surface most weakly served exactly the scenario the operator picked, and did not represent the other two as comparable alternatives.

## 2. Corroboration in today's export (observed, not asserted)

The operator-supplied `wheelwright-calls-2026-09-17` export shows **every** row at delta **0.26–0.40**, every strike **above spot** (e.g. COPX spot 87.1, strikes 89–95; SMH spot 559.87, strikes 567.5–585), postures `ACTIONABLE`/`EDGE`, `Select` reasons `target-delta` / `basis-positive`. There is **no ~0.50-delta (ATM) row and no basis-anchored recovery row**. This is the delta-band selection doing exactly what it is configured to do — and it is exactly why scenario 2 and scenario 3 were not on the surface. (Mechanically confirmed: `recommend.ts` covered-call selection uses `admissibleDeltaRange {0.15,0.50}`, `targetDelta 0.30`; the buy-write engine `recommend-buy-writes.ts` deliberately applies **no** delta gate and selects by Production v0, which is why the BW surface *does* show near-ATM strikes — the BW/CC asymmetry doc 48 §7 identified.)

## 3. What is new vs doc 48

Doc 48 established the structure as a hypothesis from instrumentation on stale sealed evidence. Today adds:

- **A lived trade.** Not instrumentation — an executed position.
- **An off-tool event.** The operator used Fidelity's chain tool, which is the sharpest possible signal that the appliance failed at its stated job for a real case ("support — but do not perform — execution"; here it could not even *support* the choice).
- **A concrete three-way framing from the operator's own chair** (sell/redeploy · ATM-and-wait · basis-recovery), matching doc 48's plural-bargains hypothesis and doc 47/49's capital-state direction — now grounded in a decision that actually happened.

## 4. The two kinds of calls the surface appears to owe the operator

Stated in the operator's terms, for shares already held with a basis, the Covered-Call surface should be able to present (alongside the existing target-delta income call) at least two additional, distinct posture-anchored kinds:

1. **ATM harvest call** — strike near spot (~0.50 delta). Objective: maximum current premium; accept ~even-odds call-away near spot. The scenario 2 the operator traded today.
2. **Basis-recovery call** — strike anchored to **cost basis** so that assignment realizes no loss. Objective: get out whole if called, collect premium meanwhile. The scenario 3 underwater/recovery posture. (Definition seam carried from doc 48 §4: **strict** `strike >= stock-basis` vs **effective-sale** `strike + premium >= basis`; and stock basis vs capital-cycle basis. Unresolved — a reconciliation input, not decided here.)

These answer *different questions* about the same shares; a single delta band collapses both into neither. This is doc 48's "there may be no single best covered call" made concrete by a lived choice.

## 5. Deliberate limits and open seams (reconciliation inputs, not decisions)

1. **Basis definition unresolved** — strict `strike >= basis` vs effective-sale `strike + premium >= basis`; stock/broker basis vs capital-cycle basis (nets prior premium). Doc 48 §4 already parked this; today does not resolve it.
2. **Plurality vs recommendation** — these are *different bargains*, not a re-ranking. Doc 48 warns against prematurely recompressing the opportunity set into one "best" answer; the Sep-9 `PL-DEPLOY` decision-surface work (expanded-row-vs-drawer) is the relevant interaction-surface pressure for *how* plurality is shown. Do not conflate discovery axis with policy input.
3. **BW/CC asymmetry** — the buy-write engine already surfaces near-ATM (no delta gate, Pv0 selection); the covered-call engine does not (delta band). Whether these two entry points over the same option leg should share one strike-selection posture is a `PL-DEPLOY` reconciliation question, not a bug to patch.
4. **Whose authority** — basis lives in portfolio/Activity evidence; a covered-call posture keyed to held-share basis touches the recommendation model (`PL-ARCH-06` browser-side recommendation placement is the backdrop). Any change routes through idea-intake → reconciliation.
5. **Not a defect ticket.** Nothing here is a code repair. The delta band is doing what it is configured to do; the gap is a *missing posture*, which is model/policy territory.

## 6. Disposition

- **Canonical identity:** `PL-DEPLOY` (no new `PL-*` id). Secondary pressure: `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`, `PL-ARCH-06` (backdrop).
- **Strategic disposition:** Strengthens the existing capital-state-management / plural-bargains direction with the strongest evidence to date (a lived trade + off-tool event); no roadmap change; no new Bet.
- **Architectural disposition:** Corroborates the multi-posture covered-call / Deployment-surface pressure; authorizes nothing (no strike-selection policy change, no ATM/basis-recovery posture implementation, no BW/CC merge, no admissibility-band change).
- **Next authorized mode:** Reconciliation / design only — decide the basis definition (strict vs effective-sale; stock vs cycle basis), whether ATM-harvest and basis-recovery are policy postures or discovery axes, and how the plurality is expressed (ties to the Sep-9 expanded-row work) — then normal decompose/authorize gates.
- **Not authorized:** covered-call strike-selection policy change, ATM/basis-recovery posture implementation, BW/CC engine merge, admissibility-band change, Prod v0 change, Share/Capital Deployment implementation, automatic selling/redeployment, broker execution, or roadmap reprioritization.

Durable why-state for the underlying capital-state model remains in docs 47–49; this record adds the **lived-trade / off-tool confirmation** that the anticipated covered-call plurality gap is real and operationally material.
