# Covered-Call Architecture

**Status:** Horizon A implemented; Horizon B in progress (call drawer + Projected Call Surface delivered; existing-put entry point planned)
**Date:** July 2026

---

## System Context

Wheelwright supports two option-writing strategies:

| Strategy | Evidence Source | Portfolio Requirement | Collateral |
|----------|---------------|---------------------|------------|
| Cash-secured puts | Universe-wide chain evidence | Deployable cash | strike × 100 |
| Covered calls | Inventory-specific chain evidence | Held shares ≥ 100 (free) | Share ownership |

Both strategies consume the same backend-maintained evidence and apply the same shared policy controls. They differ in eligibility: puts require cash, calls require shares.

### Backend Independence

The Calls recommendation path is backend-independent at the recommendation layer. `recommendCalls()` reads exclusively from the IndexedDB durable cache — it never makes provider calls. The backend (Java Evidence Appliance) is responsible for acquiring and publishing evidence into that cache. Backend replacement (e.g., TypeScript → Java retooling) affects evidence acquisition and freshness, but does not change the Calls recommendation contract or behavior.

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
- Call inspection drawer with position context, execution evidence, strike neighborhood, provenance
- Evidence-based empty state when no executable calls exist

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

- No call-specific execution handoff (Fidelity trade link)
- No appreciation geometry
- No Projected Call Surface
- No historical lifecycle linkage
- No favorites or instrument affinity

### Scope boundary

The Calls table remains scoped to **executable covered-call recommendations** for currently held, unencumbered inventory. It does not expand to include projected, contingent, or non-executable rows. Lifecycle evidence for contingent ownership states (from existing or proposed puts) is presented through dedicated evidence sections, not by expanding the executable table.

---

## Horizon B (In Progress)

**Scope:** Richer intelligence, execution, and lifecycle transition evidence.

### Call Drawer (Delivered)

A right-side drawer for call inspection, analogous to the put Recommendation Brief.

Delivered sections:
- Identity (symbol, instrument name, contract details)
- Decision summary (sell to open, mid, premium per contract, annualized yield, max contracts, policy fit, strike vs price)
- Position context (available shares, max contracts, underlying price, average cost per share, unrealized gain/loss — graceful null when economics unavailable)
- Execution evidence (delta fit with deviation, spread, OI, volume, bid/mid/ask)
- Strike neighborhood (5 calls around selected, with policy tags)
- Evidence provenance (provider, session date, session state, evidence status)

Implementation:
- `call-brief-builder.ts` — pure view model builder (reads cached call chains)
- `CallBrief.tsx` — drawer component
- `CallCandidate.economics` — position economics propagated from inventory
- Row click on `CallCandidateTable` opens drawer; Escape closes
- Put and call drawers are mutually exclusive (selecting one deselects the other)

Not included in this increment:
- No Fidelity execution handoff (deferred)
- No appreciation geometry visualization (deferred)

### Projected Call Surface (Delivered — Entry Point 1)

A reusable conditioned-ownership computation that evaluates the covered-call landscape from a specific hypothetical or actual ownership state.

This is the first implementation slice of the Conditioned Operating Opportunity concept (`docs/foundations/conditioned-operating-opportunity.md`). The foundation document defines the broader domain model and open design questions; this section describes the concrete delivered behavior.

#### Implementation (proposed-put entry point)

The selected-put drawer includes a Projected Call Surface section after Position Impact. It answers: "If this put assigns, what covered-call opportunities currently exist from the projected basis?"

Delivered behavior:
- Integrated into `buildWheelwrightBrief` lifecycle — computes atomically with the rest of the brief
- Uses the canonical `effectiveCostBasis` from Position Impact (single source of truth)
- Failure-contained: PCS exceptions do not prevent the ordinary put brief from rendering
- Displays projected basis with derivation (strike − premium), policy-admissible call count, representative contracts table (max 5, sorted by delta proximity to target), bid/ask/mid yield from basis, strike distance above basis, evidence freshness
- Labeled "Representative policy-admissible contracts above projected basis" — no recommendation posture, ranking, or execution affordances
- "IF ASSIGNED" conditional framing makes the hypothetical nature explicit
- Graceful states: unavailable (no evidence), partial (missing chains), empty (no qualifying calls above basis)
- Snapshot-at-open semantics: assessed from evidence loaded with the brief, not continuously updating

Implementation:
- `conditioned-call-surface.ts` — shared domain: `loadConditionedCallEvidence()` + `assessConditionedCallSurface()`
- `brief-builder.ts` — integrates PCS into `WheelwrightBriefViewModel`
- `RecommendationBrief.tsx` — `ProjectedCallSurfaceSection` renders the evidence

#### Remaining (existing-put entry point — Planned)

The same conditioned-ownership computation exposed from existing open short puts in the imported portfolio. Uses `strike` as conservative basis assumption (original premium unavailable). Explicit provenance labeling. UI surface to be designed before implementation.

### Put/Call Symmetry (Evidence)

Put/Call Symmetry is **transition-quality evidence**, not an executable recommendation.

It answers: "Does this instrument support a coherent recurring Wheel lifecycle from the proposed entry point?"

Observable dimensions:
- Are there liquid calls above the put-created basis?
- Do qualifying calls exist within the same DTE cadence?
- Is the call surface comparable in quality to the put surface?
- Can the operator expect to write covered calls at an acceptable yield after assignment?

This evidence is derived from the Projected Call Surface computation. It may eventually inform recommendation ranking (Horizon C), but initially appears only as operator-visible evidence in the put drawer.

### Appreciation Geometry (Planned)

Displays the relationship between:
- Current price
- Strike (assignment price)
- Average cost per share (basis)
- Effective sale price (strike + premium)
- Upside retained vs surrendered

This is payoff geometry — not a forecast. It answers: "If assigned at this strike, what are the economic consequences relative to my basis?"

### Call Execution Handoff (Planned)

Fidelity trade link construction for covered calls. Similar to put handoff but with call-specific parameters.

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

### Lifecycle Quality in Ranking

Projected Call Surface evidence may eventually influence put recommendation ranking — preferring instruments that transition gracefully into covered calls. This requires accumulated operational experience before introducing as a policy input.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Shared policy controls | Split later when evidence warrants divergence |
| Yield = mid / underlyingPrice | Describes the option; basis describes the position (separate concerns) |
| Call drawer as first Horizon B increment | Enables inspection before execution handoff; minimal standalone value |
| `PositionEconomics` nested object | Anticipates future fields without repeated type expansion |
| Call table = held executable inventory only | Puts scan the full universe; calls scan what you own. Projected/contingent rows stay as evidence, not table rows. |
| Projected Call Surface = one computation, two entry points | Proposed puts (known basis) and existing puts (conservative basis) share the same function signature. No duplicate implementations. |
| PCS is evidence, not recommendation | The output describes the call landscape; it does not authorize or execute trades. Actual call execution requires held shares. |
| Basis confidence must be explicit | When premium is unavailable (existing puts), label the approximation. Unknown Cannot Authorize. |
| No user identity yet | PortfolioSnapshot suffices until history requires persistence |
| Recommendations are backend-independent | Cache-only reads; backend replacement affects freshness, not behavior |
