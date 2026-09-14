# DTE Window Discrepancy — Follow-up (recorded, NOT resolved)

**Status:** Open observation / follow-up. **Not** part of the generation-29066 servicing-policy work.
**Recorded:** during gen-29066 weekly-seam implementation. **SYNC:** `55b7a525f3d8db78b94c4a8cc8f33cba32377150`.

## Observation

Wheelwright's current **normal acquisition path uses a 7–45 DTE eligibility window**, while the Principal
believes the intended governed window **may be 0–45 DTE**.

## Implementation truth (where 7–45 lives today)

- `SqliteEvidenceStore.getEligibleExpirations(expirationsJson)` — `MIN_DTE = 7`, `MAX_DTE = 45`. This is the
  sole production definition of "which chains the appliance fetches for a symbol," consumed by
  `AcquisitionWorker.acquireAllEligibleChains`.
- The same 7–45 bound is independently repeated in: `selectPrimaryExpiration`; `classifyFromChain`
  (`dte < 7 || dte > 45`); `getMultiDteSurfaceCoverage`; `getDecisionCoverage`; the
  `getPrioritizedWorkQueue` oldest-eligible SQL; `MultiExpirationSurfaceAnalysis` (`MIN_DTE=7`).
- The held-expiration overlay (`getHeldExpirations` ∩ `getAllExpirationDates`) can add sub-7-DTE dates for
  operator-held positions, but ordinary eligibility is 7–45.

## Why it was not resolved in gen-29066

Changing the shared 7–45 lower bound to 0–45 would broaden **acquisition and Decision semantics for the
entire universe** (more provider calls per symbol; 0–6 DTE near-expiry chains entering the multi-DTE
surface, Decision coverage, and candidate generation). The generation-29066 servicing-policy experiment is
explicitly scoped to **cadence only** and must not change Decision DTE eligibility or ordinary acquisition
scope. The Principal's simplification removed the 0–45 requirement from the weekly experiment for exactly
this reason.

## If pursued later (not authorized here)

Treat as a separate governed change with its own reconciliation: decide whether 0–45 is the intended
Decision/acquisition window universe-wide; assess provider-capacity and candidate-generation impact of
admitting 0–6 DTE; update the shared bound(s) coherently (not just one call site); re-baseline. This is a
Decision/acquisition-policy question, not a servicing-cadence question.
