# Recommendation Funnel Architecture

**Date:** July 3, 2026
**Status:** Design documentation — verified against implementation
**Source:** `options-prototype/src/write-desk/recommend.ts`

---

## 1. Complete Funnel Stages

```
┌─────────────────────────────────────────────────────────────────┐
│  MONITORED UNIVERSE                                    496      │
│  All symbols in the candidate universe (Yahoo Top ETFs)         │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  ACQUISITION STATE             │
                    │                                │
                    │  Resolved ──┬── Optionable     │
                    │             └── Non-optionable │
                    │  Pending (not yet evaluated)   │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  GOVERNANCE                    │
                    │  (hard exclusion — binary)     │
                    │                                │
                    │  Product structure filter      │
                    │  DTE range gate                │
                    │  Delta range gate              │
                    │  Zero-bid exclusion            │
                    │  Greeks requirement            │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  EXECUTION QUALITY             │
                    │  (hard-no then continuous)     │
                    │                                │
                    │  Hard-no: spread > 80%         │
                    │  Hard-no: zero OI              │
                    │  Continuous scoring 0-100      │
                    │  Posture bucketing             │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  RANKING                       │
                    │  (sort + cap)                  │
                    │                                │
                    │  Sort by policy mode           │
                    │  Cap at maxResults (100)       │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  PRESENTATION                  │
                    │  (display slice)               │
                    │                                │
                    │  Show limit (10/20/50/100)     │
                    │  Affordable-only filter        │
                    └───────────────────────────────┘
```

---

## 2. Stage Classification

| Stage | Type | Nature | Population Effect |
|-------|------|--------|-------------------|
| Confirmed Absent | Hard exclusion | Binary | Removes ~131 symbols |
| Product Structure | Governance | Binary | Removes 0 (currently inert — empty names) |
| No Expirations in Cache | Acquisition state | Temporary | Reduces during bootstrap, reaches 0 |
| No Expiration in DTE Range | Governance | Binary | Removes symbols with only distant options |
| No Chain in Cache | Acquisition state | Temporary | Reduces during bootstrap |
| No Contract in Delta Range | Governance | Binary | Removes symbols without target-risk puts |
| Zero Bid (admissible filter) | Governance | Binary | Pre-filters before scoring |
| Missing Greeks | Governance | Binary | Pre-filters before scoring |
| Hard-No: Spread > 80% | Execution quality | Binary | Removes truly unusable markets |
| Hard-No: Zero OI | Execution quality | Binary | Removes zero-participation markets |
| Score < 35 (WAIT) | Execution quality | Threshold on continuous | Largest single reducer |
| Score < 65 but ≥ 35 (EDGE) | Execution quality | Threshold on continuous | Admits into eligible |
| Score ≥ 65 (ACTIONABLE) | Execution quality | Threshold on continuous | Admits into eligible |
| maxResults = 100 | Ranking | Cap | Not currently reached |
| Show limit | Presentation | Display slice | Does not alter engine |
| Affordable only | Presentation | Display filter | Does not alter engine |

---

## 3. Arithmetic Reconciliation

For the observed completed run:

```
496  Monitored
  0  Pending (all resolved)
───
496  Resolved
131  Confirmed absent (non-optionable)
  0  Product structure excluded
───
365  Optionable (have expirations)
 ~X  No expiration in 7-45 DTE range
 ~Y  No chain in cache
───
~320 Evaluable (have chain data for eligible expiration)
 ~Z  No contract in delta 0.15-0.50
 ~W  All contracts hard-no (spread>80% or zero OI)
───
~200 Scored (passed governance + hard-no)
~150 Score < 35 (WAIT posture)
───
 49  Eligible (ACTIONABLE + EDGE, one per symbol)
 49  Ranked (maxResults = 100, not reached)
 49  Displayed (Show = 100, not reached)
```

**Invariant:** `monitored = resolved + pending`
**Invariant:** `resolved = optionable + nonOptionable`
**Invariant:** `eligible ≤ evaluable ≤ optionable ≤ resolved ≤ monitored`

---

## 4. Stage Ownership

| Stage | Owner | Can Operator Adjust? |
|-------|-------|---------------------|
| Monitored Universe | Universe configuration | No (static Yahoo 496) |
| Acquisition State | Backend worker | No (automatic) |
| Product Structure | Velvet Rope | No (governance rule) |
| DTE Range | Policy: `eligibleDteRange` | Yes (future) |
| Delta Range | Policy: `admissibleDeltaRange` | Yes (UI control) |
| Hard-No Thresholds | Policy: `executionAssessment` | No (governance rule) |
| Posture Thresholds | Policy: `actionableFloor`, `edgeFloor` | No (governance rule) |
| Ranking Mode | Policy: `ranking.mode` | Yes (UI control) |
| maxResults | Policy: `ranking.maxResults` | No (hardcoded at 100) |
| Show Limit | UI state | Yes (UI control) |
| Affordable Only | UI state | Yes (UI checkbox) |

---

## 5. Key Distinctions

### Absent vs Non-Optionable

| Term | Meaning | Stage |
|------|---------|-------|
| Absent (backend) | Backend acquisition confirmed no expirations | Acquisition |
| Non-optionable (operator) | ETF has no listed options | Operator presentation |

Same concept, different audiences. Backend uses "absent" as an acquisition state. Operator sees "non-optionable" as an instrument characteristic.

### Evaluable vs Eligible

| Term | Meaning | Gate |
|------|---------|------|
| Evaluable | Has chain data in DTE range; enters contract evaluation | Governance gates passed |
| Eligible | Produced ACTIONABLE or EDGE candidate | Execution quality threshold passed |

An evaluable symbol may not be eligible if all its contracts score below EDGE (35).

### Admissible vs Eligible

| Term | Meaning | Scope |
|------|---------|-------|
| Admissible | Contract delta is within configured range | Per-contract governance |
| Eligible | Symbol produced at least one ACTIONABLE/EDGE candidate | Per-symbol result |

A symbol may have admissible contracts that all fail execution scoring → symbol is not eligible.

---

## 6. One Contract Per Symbol Rule

At the bottom of the per-symbol evaluation:

```
Best ACTIONABLE contract (highest score) → candidate
  OR Best EDGE contract (if no ACTIONABLE)  → candidate
  OR Best WAIT contract                      → waitCandidate only
```

This is intentional: one recommendation per underlying. The engine picks the best-execution contract available within governance bounds.

Multiple contracts from the same symbol are evaluated, but only one surfaces.

---

## 7. Presentation vs Engine

| Concept | Engine or Presentation? | Affects eligible count? |
|---------|------------------------|------------------------|
| Ranking sort order | Engine | No |
| maxResults cap | Engine | Potentially (if eligible > 100) |
| Show limit | Presentation | No |
| Affordable only | Presentation | No |
| Sort column in table | Presentation | No |

The engine always produces the full eligible population. Presentation layers slice and sort for display without altering the underlying population.

---

## 8. Known Limitations

1. **Product structure filter is inert** — `inferProductStructure(symbol, "")` receives no instrument name, so leveraged/inverse ETFs pass undetected in the `recommendPuts` path. This is documented as a parking-lot item.

2. **`includeEdge` / `includeWait` policy fields are declared but not enforced** — EDGE is always included in eligible. WAIT is always excluded. The policy fields exist but the code doesn't branch on them.

3. **`preferredDeltaBand` is declared but unused** — Neither scoring nor selection uses this band. Contract selection sorts by distance from `targetDelta` but doesn't score preference match.

4. **Yield suppression at 30% is hardcoded relative to `preferredSpreadPercent`** — The 2× multiplier is embedded in the recommend function, not configurable separately.

5. **No per-symbol exclusion reason is surfaced to the operator** — The engine tracks aggregate exclusion counts but doesn't store per-symbol "why excluded" for drill-down.

---

## 9. Operator-Facing Summary

For the operator, the funnel reduces to:

```
496 ETFs in universe
365 have options
 49 have tradeable opportunities matching your criteria

Why only 49?
  131 No options listed
  ~30 No match in your timeframe/risk range
  ~90 Poor market quality (thin, wide spreads)
  ~95 Below recommendation threshold
```

This is the version that belongs in the primary UI. The full pipeline-stage breakdown belongs in developer diagnostics.
