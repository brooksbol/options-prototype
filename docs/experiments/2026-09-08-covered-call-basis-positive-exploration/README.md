# Covered-Call Basis-Positive Exploration — Artifact (2026-09-08)

Stale (81h, sealed) evidence snapshot of the Covered-Call Candidates surface after exploratory
instrumentation that (a) emits one row per eligible expiration and (b) surfaces a `basis-positive`
strike (lowest admissible strike at or above cost basis) alongside the target-delta pick.

- `wheelwright-calls-2026-09-08-basis-positive.csv` — the exact 16-row covered-call export the operator reasoned over (basis-positive finding, doc 48 §2–§5).
- `wheelwright-cross-entry-2026-09-08.csv` — Cash Deployment — Prod v0 export whose top row (COPX 42-DTE ~$91 BW, Δ0.53) is economically equivalent to selling a $91 covered call against owned COPX — a bargain the delta-banded Calls surface hid (doc 48 §7).

Full interpretation, disposition, and caveats: `docs/48-covered-call-basis-positive-optionality-discovery-2026-09-08.md`.

Reconciled under `PL-DEPLOY` (see `docs/parking-lot-6.md`). Exploration only — not implementation
authorization, and the basis shown is the raw broker stock basis, not the capital-cycle basis.
