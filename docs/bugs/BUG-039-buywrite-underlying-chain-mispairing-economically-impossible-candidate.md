# BUG-039 — Buy-Write table admits an economically impossible candidate: underlying price paired with a chain whose contracts cannot belong to it; no coherence/moneyness guard

- **Status:** Open
- **Severity:** S2
- **Area:** Write Desk (Deployment) / buy-write recommendation evidence coherence; upstream price↔chain binding (TradierAdapter)
- **Provenance:** Principal observation 2026-10-12, DXJ row in the Deployment buy-write table (export `wheelwright-buy-writes-2026-10-12`).

## Observed failure

The Deployment page buy-write table presented a DXJ candidate that is internally impossible for a covered-call / buy-write and was nonetheless ranked **ACTIONABLE**:

| Field | Value |
|-------|-------|
| Symbol | DXJ |
| Price (underlying) | 60.78 |
| Strike | 170 |
| Delta | 0.8032 |
| Bid / Ask | 11.5 / 14.5 |
| Spread% | 23.08 |
| Yield% | 200.18 |
| Apprec | 109.22 |
| If Called% | 201.09 |
| Posture | ACTIONABLE |

A 170 strike against a $60.78 underlying is ≈180% out of the money. A call that far OTM cannot carry ~$13 of premium and cannot have ~0.80 delta — those three option attributes (strike, premium, delta) describe a deep-in-the-money contract on a materially higher-priced instrument, not a DXJ call. The row is internally contradictory in three independent places: strike vs underlying price, premium vs strike, and delta vs strike.

This is an **observed Deployment surface defect** (operator-visible row + CSV export), reproduced from the running recommendation path on 2026-10-12. No live brokerage order resulted; this is a decision-support-integrity defect.

## Intended semantics violated

Precisely scoped:

- **Not the defect:** the economics arithmetic. The derived numbers are faithful computations over the inputs the engine was given — `appreciation = 170 − 60.78 = 109.22`; `mid = 13.0`; `If Called% = (13.0 + 109.22)/60.78 × 100 = 201.09`; `Yield% = 13.0/60.78 × 365/39 × 100 = 200.18`. All match the displayed values exactly. `computeBuyWriteEconomics` did its job.
- **Not the defect:** retention or eligibility of individual evidence records.
- **The actual defect:** the recommendation path composes an underlying price with an option chain **without establishing that the chain's contracts describe the same instrument/price as the stamped underlying**, and no sanity guard rejects an economically impossible pairing. An incoherent (underlyingPrice, strike, delta, premium) tuple is presented as a confident, actionable buy-write candidate. This is the same evidence-coherence failure class as **BUG-004** (temporally/semantically incompatible evidence composed into an apparently-coherent view), here as a price↔chain subject-coherence failure rather than a temporal one.

## Evidence / diagnosis

Forensic trace of the recommendation path (read-only; no fix applied):

### 1. The price↔chain join (frontend)
`options-prototype/src/write-desk/recommend-buy-writes.ts` (~lines 420–422): both the underlying price and the contracts are read from a single cached chain record selected only by cache key `(provider, environment, "chain", symbol, expiration)`:

```ts
const calls = chainRecord.payload.calls ?? [];
const underlyingPrice = chainRecord.payload.underlying?.price ?? 0;
```

There is **no check** that `chainRecord.payload.underlying.symbol` equals the symbol the record was fetched under, and no check that the contracts' strikes/deltas are economically consistent with that price. The strike is read directly (`c.strike`); there is no OCC parsing and no integer-thousandths scaling on this path, so a strike-scaling decode bug is **not** the mechanism — `170` is a literal value in the chain payload.

### 2. The upstream authority that binds price to chain (backend)
`evidence-service-java/.../provider/TradierAdapter.java`, `getOptionsChain(symbol, expiration)` (~lines 109–157): fetches the chain for `symbol`, then reads a **separately cached** quote keyed by `symbol.toUpperCase()` and stamps that quote's `price` onto the chain's `underlying` via `normalizeChain(...)`. `normalizeChain` reads `strike` as a raw provider decimal. Neither call validates that the stamped price and the contract set describe the same instrument. This is the authoritative pairing point and is where the mispairing must be diagnosed (either a wrong/stale symbol-keyed quote stamped onto the DXJ chain, or the DXJ chain payload itself carrying another instrument's contracts).

### 3. Why the validity filters did not reject it
`recommend-buy-writes.ts` (~lines 448–450) carries only two contract-validity guards:

```ts
c.delta <= 1.0 &&                                 // reject corrupt delta
!(c.strike > underlyingPrice && c.delta > 0.95)   // reject OTM call w/ delta > 0.95
```

The DXJ contract slips between them: delta 0.8032 ≤ 1.0, and 0.8032 is not > 0.95 — so the OTM-high-delta rejector does not fire, even though a 0.80-delta call struck ≈180% above spot is precisely the contradiction that rejector exists to catch. There is **no moneyness / strike-distance sanity guard**. `moneyness()` exists in `domain/calculations.ts` but is not consulted here. The strategy-fitness filter (`strike > underlyingPrice`, ~line 537) *requires* the strike above price, so a 170 strike is not merely tolerated — it is actively selected as "positive appreciation."

### 4. Why posture is ACTIONABLE, not WIDE_SPREAD
Posture (`execution-assessment.ts`, `execution-policy.ts`) is a pure execution-quality verdict and encodes no economic-coherence check. Spread = (14.5 − 11.5)/13.0 = 23%, far below the `hardExcludeSpreadPercent = 80` hard-no floor, so the row is not WIDE_SPREAD. `assessExecution` then weights spread at only 0.40 (gentle linear degradation), while the $11.5 bid scores 100 on the premium component and OI/volume are adequate; the weighted composite clears `actionableFloor = 65` → **ACTIONABLE**. (WIDE_SPREAD rows elsewhere in the same export genuinely exceed 80% spread; they are not "similar" to this 23% row.)

## Consequence

An operator assessing deployment candidates was shown a confident, top-posture buy-write whose underlying and option legs cannot belong to the same instrument, with yield and if-called figures (~200%) that are artifacts of the mispairing. Because the Deployment surface is decision support that feeds Broker Handoff, a plausibly-rendered but economically impossible ACTIONABLE candidate is a materially misleading operator-facing consequence (S2). No prediction or execution occurred; the integrity failure is in presenting incoherent composed evidence as actionable.

## Scope / non-goals

Diagnosis only. Remediation is **not** authorized or prescribed here. The authoritative question — whether DXJ's chain record carries a wrong/stale symbol-keyed quote price (backend quote↔chain binding) or the chain payload itself contains another instrument's contracts (normalization/provider mispairing) — must be answered at the upstream authority before any guard is designed. Per "Authority Before Consumers," a frontend moneyness/coherence guard would mask the symptom and must not substitute for repairing the incorrect authoritative pairing. Candidate approaches (subject-equality validation at the join, a moneyness sanity gate, backend symbol-coherence assertion in `normalizeChain`/`getOptionsChain`) are design decisions for later.

## Acceptance criteria

Not separately enumerated beyond the scoped defect statement (remediation deferred). A correction is complete only when the authoritative price↔chain pairing is proven correct in the live appliance for the specimen, not merely when a downstream guard hides the row.

## Remediation history

None.

## Verification

None. Reproduction is from the operator-observed Deployment buy-write table and its CSV export (`wheelwright-buy-writes-2026-10-12`), 2026-10-12.

## Related

- **BUG-004** — same evidence-coherence failure class (incompatible evidence composed into an apparently-coherent, confident view); BUG-004 is temporal, this is price↔chain subject coherence.
- **BUG-011** — provider greek evidence integrity (zero vs absent delta); adjacent evidence-validity context.
- **BUG-033** — stale held-expiration chain Greeks beside fresh underlying; adjacent composition-coherence context.
- Development workflow rule "Authority Before Consumers" (`.kiro/steering`): repair the incorrect authoritative fact rather than compensating in the consumer.
