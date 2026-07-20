# Acquisition Scheduler Policy

**Date:** July 2026
**Status:** Implemented — pending active-session validation
**Authority:** Retooling Charter, Repair Unit 2B

---

## Governing Principle

> Appropriate freshness with bounded neglect.

The scheduler balances freshness of evidence the user is likely to see against starvation of evidence the user is unlikely to see.

---

## Service Classes

| Class | Definition | Target | Age semantics |
|-------|-----------|--------|---------------|
| A | Ready symbol with qualifying puts (DTE 7-45, \|delta\| 0.15-0.50, bid > 0, OI > 0) | ≤ 15 min chain age | Hard target: scheduler prioritizes these continuously |
| B | Ready symbol without qualifying puts, or classification stale | Best-effort | Soft urgency threshold at 120 min: increases priority but does not preempt overdue A. Minimum guaranteed via floor. |
| C | Pending, partial, failed lifecycle work | Epoch retry policy | 3 failures/epoch |
| D | Absent symbols from prior epoch | Once per epoch | 24 hours |

---

## Ordering (Strict Priority Cascade)

1. Class A symbols past 15-min target — oldest chain first
2. Class B symbols past 120-min urgency threshold — oldest chain first
3. Class A symbols approaching target — oldest first
4. Class B symbols — oldest chain first (when anti-starvation floor is due)
5. Class C/D lifecycle work

Overdue Class A always precedes over-age Class B, except when the explicit B floor is due.

---

## Anti-Starvation Floors

Based on dispatched provider jobs with service-debt tracking:

| Class | Guarantee | Mechanism |
|-------|-----------|-----------|
| B | At least 1 symbol per 10 dispatched jobs | Service debt: owed until satisfied |
| C/D | At least 1 symbol per 20 dispatched jobs | Service debt: owed until satisfied |

Simultaneous obligations are both eventually satisfied. Satisfying one class does not erase the other's debt.

Under sustained Class A pressure at observed populations:
- ~405 total symbol jobs / 15 min
- ~40 guaranteed B jobs / 15 min (floor)
- ~20 guaranteed C/D jobs / 15 min (floor)
- ~345 A jobs / 15 min (remainder)

Unused capacity flows freely to lower classes when A is within target.

---

## Capacity

| Metric | Value |
|--------|-------|
| Provider rate | 0.9 req/sec (54/min, 810/15min) |
| Observed Class A population | 324 symbols |
| Observed Class B population | 616 symbols |
| Class A provider calls | 648 (324 × 2) |
| Total floor reservation | ~120 calls/15min (40 B + 20 C/D × 2 calls each) |
| Available for A after floors | ~690 calls/15min |
| Sustainable A cadence | 648 / (690/15) ≈ 14.1 minutes ✓ |
| Uncommitted surplus after A + floors | ~42 calls/15min |

### Class B cadence by operating condition

| Condition | Approximate Class B full-pass cadence |
|-----------|--------------------------------------|
| Class A temporarily satisfied; most capacity spills to B | ~23 minutes (theoretical minimum: 1232/810 × 15) |
| Steady Class A maintenance with floor plus surplus | ~150–230 minutes |
| Sustained A pressure; guaranteed B floor only | ~231 minutes (1232 / 80 × 15) |

---

## Background Age Semantics

The 120-minute `chainMaxAgeMs` is a **soft urgency threshold**, not a hard maximum or a guarantee.

- When Class A has spare capacity: Class B receives surplus and achieves much better cadence
- Under sustained Class A maintenance: B is served primarily via floors (~80 calls/15 min guaranteed). Worst-case full B pass: ~231 minutes.
- The threshold increases B priority within the queue ordering (Priority 2 in cascade), but overdue Class A (Priority 1) always precedes it except via the explicit floor guarantee.

Class B receives at least one service opportunity per ten dispatched symbol jobs, producing an estimated worst-case full-pass cadence of approximately 231 minutes under the current population and normal two-call refresh cost.

This is provider-capacity saturation, not a software defect. The scheduler truthfully serves the most important evidence first while guaranteeing bounded background service.

---

## Independent Freshness Domains

| Domain | Target | Refresh trigger |
|--------|--------|----------------|
| Chain | 15 min (Class A) / soft urgency at 120 min (Class B) | `chain.retrieved_at` age exceeds target |
| Expirations | 6 hours | `expirations.retrieved_at` age exceeds 6h |
| Quote | Included in chain refresh (2 calls) | Same as chain |

When expirations are fresh (< 6h), ready-symbol refresh uses 2 provider calls (chain + quote).
When expirations are stale (> 6h), refresh uses 3 calls (expirations + chain + quote).

---

## Session-Opening Behavior

1. Prior-session classification used for bootstrap ordering (provisional)
2. Prior Class A symbols refreshed first
3. Reclassification from new chain evidence after each refresh
4. Background and lifecycle work receive minimum floors from start

---

## Publication Coalescing

- Publish when evidence changes AND ≥ 5 seconds since last publication
- Publish before worker transitions to idle
- No heartbeat publication when no evidence changes
- `generatedAt` = publication time (NOT aggregate evidence freshness)

---

## Configuration Defaults

| Parameter | Default | Unit |
|-----------|---------|------|
| chainFreshnessTargetMs | 900,000 | 15 minutes |
| chainMaxAgeMs | 7,200,000 | 120 minutes |
| expirationFreshnessMs | 21,600,000 | 6 hours |
| classBMinServiceInterval | 10 | dispatched jobs |
| classCDMinServiceInterval | 20 | dispatched jobs |
| publicationCoalesceMs | 5,000 | 5 seconds |

---

## Key Invariants Preserved

- Re-publication does not renew evidence freshness
- Backend owns acquisition and scheduling policy
- Expiration and chain freshness are independent domains
- Plausibly visible evidence receives strongest freshness protection
- Background evidence is maintained slower, not abandoned
- Failed refresh preserves prior successful evidence (INV-PERSIST-01)
- Starvation prevention is bounded and deterministic
