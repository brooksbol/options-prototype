# Project Parking Lot — Continuation 5

> This file is a physical continuation of `docs/parking-lot.md`, `docs/parking-lot-2.md`, `docs/parking-lot-3.md`, and `docs/parking-lot-4.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 7, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace.

- All stable IDs are globally unique across the complete `docs/parking-lot*.md` sequence.
- New material ideas enter through the standard pipeline in `docs/foundations/idea-intake-reconciliation.md`.
- New intake is recorded in the latest continuation after checking the complete parking-lot sequence for an existing concept.
- Row order is not priority.
- Merge, split, supersession, promotion, rejection, and resolution preserve explicit disposition/mapping.
- A Principal decision to work on an item next changes sequencing, not its reconciliation/design state.

---

## `PL-STRAT-01` Refinement — Hedged Broken-Wing Butterfly (HBWB)

**Date:** September 7, 2026  
**State:** RECONCILED exploration under existing `PL-STRAT-01`; no new `PL-*` identity created  
**Rich discovery record:** `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`

### Intake

The September 7 HBWB discussion crossed the durability threshold but does **not** create a genuinely new backlog concern. It refines existing **`PL-STRAT-01` Strategy Expansion Governance**, whose purpose is to evaluate candidate strategies beyond the current CSP / covered-call / buy-write set and whose existing scope explicitly includes reconsideration of butterflies when new reasoning warrants it.

Canonical mapping:

> **HBWB discovery → merged/refined into `PL-STRAT-01`**

No separate `PL-HBWB-*` item is created. The commercial strategy name is a candidate instance inside the existing strategy-admission concern, not a new project namespace.

### What was discovered

A commercially presented strategy called the **Hedged Broken-Wing Butterfly (HBWB)** appears to use a put `+1 / -2 / +2` quantity shape rather than a conventional `+1 / -2 / +1` butterfly. The extra far-OTM long put may create net long downside tail exposure once all strikes are in the money, giving a plausible mechanical basis for the presenter's crash-protection claim.

The presenter also claims the structure can be delta/gamma neutral, long vomma, forgiving on T+0, and unlike many short-premium strategies is not harmed by volatility in the same way. Because the presenter is selling a masterclass, these claims are treated as **hypotheses requiring independent verification**, not as evidence.

An unresolved source discrepancy remains around the lower-leg delta. The screenshots visually appear to show `-03`, while the Principal stated that it should be `-30`. The `-03` reading is mechanically consistent with both farther-OTM strike ordering and an approximately delta-neutral `30/18/3` recipe; the `-30` reading is not obviously consistent with those same assumptions. **Do not encode either recipe as authoritative until primary-source verification.**

### Why it may matter

The HBWB may represent a materially different risk-engineering idea from a simple vertical spread:

- vertical spread: surrender premium to buy a finite adverse boundary;
- HBWB hypothesis: sell intermediate option exposure to help finance additional far-tail convexity that may become more valuable during severe price/volatility stress.

If that hypothesis survives mechanical and empirical testing, it could deepen Wheelwright's understanding of compensation relative to consequence and of when paying for defined/tail risk improves portfolio-level deployment quality.

The discussion also reaffirmed an existing Wheelwright research discipline:

> **Investigate failure modes first. Do not begin with the advertised upside case.**

The initial failure-mode map is preserved in the rich discovery record and includes: intermediate-loss valley, adverse spot move without expected IV response, skew-shape risk, hostile theta states, hedge drag, execution/slippage, locally true but globally misleading Greeks, discretionary-management dependence, and correlated portfolio exposure.

---

## Reconciliation Completion Record — `PL-STRAT-01` / HBWB refinement

### Intake

Canonical identity: **`PL-STRAT-01`**. The HBWB is a refinement/candidate instance under that existing strategy-expansion concern, not a new parking-lot item.

Rich why/evidence record: `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`.

### Strategic disposition

**Strengthens existing strategic Bets; no roadmap change required.**

Relevant existing roadmap homes already express the useful intent:

- **C2 — Broader governed trade-shape repertoire:** HBWB is a possible future candidate trade shape, not yet an admitted strategy.
- **K1 — Consequence envelopes:** HBWB pressures the need to understand the entire consequence surface rather than premium alone.
- **K2 — Compensation relative to consequence:** the research question is what risk is sold to finance the hedge and whether compensation is adequate for the resulting state-dependent consequence.
- **L3 — Risk-profile performance can be learned empirically:** HBWB is another candidate risk profile whose hedge cost, drawdown behavior, capital efficiency, and realized downside could eventually be compared against simpler strategies.

No new Bet is warranted merely because a commercially named structure exists. No roadmap edit is made.

### Architectural disposition

**Refines existing architecture pressure; no new architectural direction required.**

The discovery maps cleanly to:

- **AR3 — Governed Alternatives / reusable economic primitives:** HBWB adds concrete multi-leg pressure, but the existing roadmap explicitly requires strategy extensibility abstractions to be **earned through concrete strategy pressure**. This discovery does **not** authorize a generic arbitrary-trade-shape framework.
- **AR4 — Consequence semantics before explanation:** HBWB reinforces the need for structured spot/time/volatility-sensitive consequence semantics if such a strategy ever advances.

No new engine, service, registry, DSL, trade-shape taxonomy, or generalized payoff framework is authorized by this reconciliation.

### Parking-lot disposition / mapping

**Retained and refined under `PL-STRAT-01`.**

The prior broad treatment of butterflies as prediction-dependent remains a hypothesis subject to the same correction learned from credit spreads: payoff geometry alone does not prove that the **decision process** is predictive. HBWB must independently pass the existing Architectural Admission Test.

This record does **not** reopen all butterflies, admit HBWB, or change the operational strategy set.

### Why-state

Durable why-state is preserved in:

- `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`

That record distinguishes presenter claims from derived mechanics, preserves the commercial-source incentive, records the unresolved delta discrepancy, and captures the failure-mode-first research posture.

No additional journal entry is required for this reconciliation because the rich discovery record preserves the material unfinished intellectual state and this canonical parking-lot record exposes the complete disposition.

### Next authorized mode

**Further exploration / research only.**

Next useful work, if selected by the Principal, is to obtain the exact primary-source recipe and mechanically test failure modes before evaluating profitability:

1. verify DTE, strike/delta selection, quantities, debit/credit target, and management/exit rules;
2. map terminal and intermediate-time P/L;
3. shock spot, IV, skew, and time independently and jointly;
4. inspect delta/gamma/theta/vega/vomma across the state space;
5. model realistic execution and hedge drag;
6. evaluate portfolio aggregation/correlation;
7. only then compare production and risk-profile outcomes against simpler governed alternatives.

**Not authorized:** strategy admission, recommendation-engine implementation, Deployment UI work, broker integration, generalized multi-leg framework work, policy promotion, or roadmap reprioritization.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 7, 2026 | `docs/parking-lot-5.md` created as a physical continuation of the single logical parking lot. The HBWB/masterclass discussion was reconciled into existing `PL-STRAT-01`, with full failure-mode-first discovery preserved in `docs/43-hedged-broken-wing-butterfly-discovery-2026-09-07.md`. Strategic disposition: strengthens C2/K1/K2/L3 with no roadmap change. Architectural disposition: refines AR3/AR4 with no new architecture. Next mode: further research only. |
