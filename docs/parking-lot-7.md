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

## Continuation History

| Date | Event |
|---|---|
| Sep 8, 2026 | Share-capital release-cost / recovery-time decision reconciled into existing `PL-DEPLOY`. BNO, COPX, and GDX provide three real post-short-call resolution paths; GDX exposes the operator choice between monetary erosion now and temporal encumbrance/risk while attempting basis recovery. Rich snapshot: `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`. No Share/Capital Deployment implementation or scoring model authorized. |
