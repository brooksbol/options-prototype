# Temporal Capability Vocabulary

**Date:** August 2026
**Status:** Active hypothesis — descriptive vocabulary, not ratified architecture
**Origin:** Three-actor reconciliation discussion (two Kiro sessions, August 2026)

---

## Purpose

This document records a vocabulary for describing where Wheelwright's capabilities currently exist along a temporal axis. It emerged from a reconciliation exercise that assessed the system's architectural strengths and gaps.

This is **descriptive vocabulary** — it says where capabilities are concentrated today. It is NOT:

- A domain decomposition
- An architectural prescription
- A mandate to build "a history system"
- A ratified foundation or principle

---

## The Three Temporal Positions

### NOW — What is the current state?

Wheelwright is strong here.

**Capabilities:**
- Market evidence (chains, quotes, expirations) maintained continuously
- Portfolio state (positions, cash, encumbrances) from Fidelity import
- Moneyness, DTE, capital exposure (Operator Console)
- Evidence freshness, session validity, provenance metadata
- Trust derivation from session context

**Governing architecture:** Evidence Appliance, State-Oriented Console, Secondary Observation, 18 behavioral invariants focused on evidence correctness.

### MIGHT HAPPEN — What could occur from here?

Wheelwright has emerging capability here.

**Capabilities:**
- Recommendations (policy-governed assessment of what the operator could do)
- Projected Call Surface (if put assigns, what calls are available)
- Posture classifications (ACTIONABLE / EDGE / WAIT)
- Decision Pressure (ADR-013: resolution proximity approaching)
- Situation Architecture (Bridge Income: what trajectory are we on, what mission serves)

**Governing architecture:** Policy over Prediction, Conditioned Operating Opportunity, Situation Architecture, Recommendation Policy as first-class domain object.

### HAS HAPPENED — What actually occurred?

Wheelwright is weak here.

**Capabilities:**
- PendingIntent (records that an order was opened; not its outcome)
- PositionEconomics (current cost basis from Fidelity; not how it got there)
- Sealed evidence from prior sessions (market state, not operator actions)
- **Transaction Evidence ingestion** (Fidelity Activity History parser — first slice delivered August 2026)
- **Production Accounting** (monthly cash-basis production assessment — first backend slice delivered August 2026)

**Remaining gaps:**
- Lifecycle completion (which wheel cycles resolved and how)
- Longitudinal learning (did our principles produce good outcomes)
- Persistence / multi-month trend
- Frontend presentation of production results

---

## HAS HAPPENED Is Not One Domain

The reconciliation exercise identified that "HAS HAPPENED" is a temporal umbrella over at least four independent domains:

### 1. Transaction Evidence

What trades were executed, at what prices, with what fees.

- Source: Fidelity Activity History export
- Domain model: accounting/ledger ontology (established prior art in Sharesight, Portfolio Performance)
- Scope: all transaction types — options, equities, dividends, interest, Treasury events, deposits, withdrawals
- **Status (August 2026):** First slice delivered. `FidelityActivityParser` + `TransactionClassifier` + `FidelityTransactionKind` enum parse and classify all 19 observed action patterns. Validated against complete 183-row export with zero unclassified July actions.

### 2. Lifecycle Reconstruction

Which wheel cycles completed: put → assignment → shares → call → resolution.

- Requires: transaction evidence (above) + linking logic
- Domain model: semantic sequences built on top of raw transactions
- Scope: wheel-specific (this is NOT strategy-agnostic)
- **Status:** Not yet implemented. Transaction evidence now exists; linking logic is the next layer.

### 3. Production Accounting

How much cash was the portfolio produced in a period, decomposed by source.

- Requires: transaction evidence + period boundaries + principal-movement exclusion
- Scope: all production sources (option premium, dividends, interest, Treasury income) — explicitly broader than options
- Key distinction: production (income generated) vs principal (capital movements, market appreciation/depreciation)
- This is the domain that answers: "How much can I withdraw this month without depleting capital?"
- **Status (August 2026):** First backend slice delivered. `ProductionAssessor` + API endpoint + asymmetric realization + reconciliation. Validated against complete Fidelity export: July 2026 known production $3,686.93. Frontend presentation not yet built.

### 4. Longitudinal Learning

Did our principles produce good institutional outcomes over time?

- Requires: all three above + principle/policy attribution from decision time
- Scope: governance effectiveness, policy calibration, behavioral patterns
- The most demanding consumer — needs decision-environment provenance (what was visible, what was chosen, what was rejected)

### Dependencies

```
Transaction Evidence (Fidelity gate)
    ↑ required by
Lifecycle Reconstruction + Production Accounting
    ↑ required by
Longitudinal Learning
```

All four share a dependency on Fidelity Activity History, but their implementation can proceed independently. Transaction evidence and production accounting now have first slices (August 2026). Lifecycle reconstruction and longitudinal learning remain unimplemented.

---

## Why Not One Architecture?

These four domains share a data source (Fidelity exports) but serve different consumers:

- Transaction evidence serves accounting and audit
- Lifecycle serves operational pattern recognition
- Production serves mission/situation assessment (Bridge Income monthly target)
- Longitudinal learning serves principle governance

Premature unification risks creating an overly complex "history engine" that serves no single consumer well.

**Recommended approach:** Define the transaction import layer first (raw Fidelity evidence), then let consumption needs reveal whether the analytical layers share useful abstractions or should remain independent consumers of the same transaction substrate.

---

## Relationship to Existing Architecture

| Existing Element | Relationship |
|---|---|
| Evidence Appliance | Maintains NOW. Does not own HAS HAPPENED — that comes from broker records, not market data. |
| Principles Governance Model (§Learning) | Anticipates longitudinal learning but provides no implementation substrate. |
| Closed-Loop Engineering (Loop 4) | Describes the organizational learning process that longitudinal evidence would feed. |
| PL-EVID-01 (Historical Analysis) | Parking-lot item acknowledging this gap. |
| PL-EVID-02 (Lifecycle Assessment) | Parking-lot item for lifecycle quality domain. |
| PL-POL-02 (Monthly Production Regime) | The policy/mandate side of production accounting. |
| PL-PORT-02 (Portfolio Production Accounting) | The measurement/evidence side of production accounting. |
| Situation Architecture (Bridge Income) | The first consumer that would need production measurement. |

---

## Next Action

The Fidelity evidence gate has been passed (August 2026). Transaction evidence and production accounting have first backend slices validated against the complete 183-row export.

Next directions (unordered, pending Principal decision):
- Frontend presentation of the production assessment
- Lifecycle reconstruction using the transaction evidence now available
- Distribution-character resolution (requires Section 19 / 1099-DIV data)
- Multi-month production trend (requires persistence or repeated upload)

---

## Maturity

| Aspect | Status |
|---|---|
| Vocabulary | Established and validated through implementation |
| Temporal framing | Descriptive — accurately reflects repository capability distribution |
| Four-domain decomposition | Validated — transaction evidence and production now implemented independently |
| Architectural authority | None — this is discovery documentation, not a ratified principle |
| Transaction evidence | First slice implemented (August 2026) |
| Production accounting | First backend slice implemented (August 2026) |
| Lifecycle reconstruction | Not yet implemented |
| Longitudinal learning | Not yet implemented |
