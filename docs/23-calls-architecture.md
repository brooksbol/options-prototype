# Covered-Call Architecture

**Status:** Horizon A implemented; Horizon B/C planned
**Date:** July 2026

---

## System Context

Wheelwright supports two option-writing strategies:

| Strategy | Evidence Source | Portfolio Requirement | Collateral |
|----------|---------------|---------------------|------------|
| Cash-secured puts | Universe-wide chain evidence | Deployable cash | strike × 100 |
| Covered calls | Inventory-specific chain evidence | Held shares ≥ 100 (free) | Share ownership |

Both strategies consume the same backend-maintained evidence and apply the same shared policy controls. They differ in eligibility: puts require cash, calls require shares.

---

## Horizon A (Implemented)

**Scope:** Restore actionable covered-call candidates for held, unencumbered, quantized shares.

### What exists

- `recommendCalls()` — cache-based call recommendation engine
- `CallCandidate` type — ranked output with posture, yield, execution score
- Collapsible "Covered-Call Candidates" section in Write Desk
- Sortable table with symbol, expiration, DTE, strike, delta, bid/ask, spread, OI, yield, shares, contracts, exec, posture
- `PositionEconomics` on `InventoryPosition` (averageCostPerShare, costBasis, marketValue)
- Workspace-persisted collapse state

### Eligibility

A position qualifies for call recommendations when:
- `maxAdditionalContracts > 0` (derived from `Math.floor(sharesFree / 100)`)
- `sharesFree = sharesOwned - sharesEncumbered`
- Encumbrance is determined by counting open short call contracts × 100

### Contract selection

- Same delta range as puts (admissible: 0.15–0.50, target: 0.30)
- Same DTE range (eligible: 7–45, target: 21)
- Same execution quality thresholds
- Closest-to-target-delta selection
- Calls use raw positive delta (puts use absolute value of negative delta)

### Yield convention

- Call yield denominator: `underlyingPrice` (describes the option's return on the underlying asset)
- NOT `averageCostPerShare` (that would describe the position's economics — a separate concept)
- Midpoint valuation: `(bid + ask) / 2`

### What is NOT in Horizon A

- No call drawer (clicking a call row does nothing)
- No call-specific execution handoff (Fidelity trade link)
- No appreciation geometry
- No Projected Call Surface in the put drawer
- No historical lifecycle linkage
- No favorites or instrument affinity

---

## Horizon B (Planned)

**Scope:** Make calls good — richer intelligence, drawer, execution.

### Call Drawer

A right-side drawer for call inspection, analogous to the put Recommendation Brief. Expected sections:

- Decision summary (sell to open, premium, yield, max contracts)
- Position context (owned shares, basis, unrealized gain, effective sale price if assigned)
- Execution evidence (spread, OI, delta fit)
- Strike neighborhood (calls around the selected strike)
- Appreciation geometry (see below)

### Appreciation Geometry

Displays the relationship between:
- Current price
- Strike (assignment price)
- Average cost per share (basis)
- Effective sale price (strike + premium)
- Upside retained vs surrendered

This is payoff geometry — not a forecast. It answers: "If assigned at this strike, what are the economic consequences relative to my basis?"

### Projected Call Surface

A section in the **put** drawer showing the egress opportunity for a hypothetical assignment:

> "If this put assigns you shares at $55 basis, here are the observable covered-call opportunities from that basis."

This is the first implementation of the Conditioned Operating Opportunity concept (`docs/foundations/conditioned-operating-opportunity.md`).

### Call Execution Handoff

Fidelity trade link construction for covered calls. Similar to put handoff but with call-specific parameters.

### Put/Call Symmetry (Evidence)

Observable evidence about whether an instrument supports a coherent recurring lifecycle:
- Are there liquid calls above the put assignment basis?
- Do qualifying calls exist at the same expiration cadence?
- Is the call surface comparable in quality to the put surface?

This is structured evidence, not a single score.

---

## Horizon C (Future)

**Scope:** Longitudinal intelligence and user-specific state.

### Historical Lifecycle Linkage

Connect: put → assignment → shares → call → expiration/assignment/close. Requires transaction history import (Fidelity Activity CSV).

### Familiarity / Instrument Affinity

Inferred from repeated interactions: prior puts, prior calls, assignments, reviews, deployments. Distinct from explicit favorites.

### User-Specific Durable State

When history requires persistence beyond a single session/CSV upload, the system will need explicit user scope. Current assessment: `PortfolioSnapshot` IS the user context today. History forces durable identity.

### Independent Call Discovery

Calls currently derive from held inventory. Future: discover call opportunities on instruments the operator doesn't yet own but might want to acquire for income purposes.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Shared policy controls | Split later when evidence warrants divergence |
| Yield = mid / underlyingPrice | Describes the option; basis describes the position (separate concerns) |
| No call drawer in Horizon A | Drawer can evolve from use; calls ship first |
| `PositionEconomics` nested object | Anticipates future fields without repeated type expansion |
| Call universe = held inventory | Puts scan the full universe; calls scan what you own |
| No user identity yet | PortfolioSnapshot suffices until history requires persistence |
