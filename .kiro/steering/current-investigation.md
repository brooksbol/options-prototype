# ACTIVE INVESTIGATION — Constraint Identification

**Status:** ACTIVE until superseded by a newer explicit repository authority record.

When resuming Wheelwright investigation work, follow repository bootstrap authority, then read these active records in order:

1. `docs/39-constraint-identification-restart-plan.md` — governing TOC discipline and original restart prescription.
2. `docs/40-provider-admission-controller-findings-2026-08-31.md` — latest August 31 measurement findings and Kiro handoff.

Current governing epistemic position:

- Herbie has **not** been identified.
- August 31 direct measurement established that the old provider path materially underutilized the documented Tradier Production market-data allowance while due WIP persisted.
- The old approximately 75/min behavior was mechanically decomposed into provider callable time, a fixed post-completion pacing wait, and recurrent scheduler-cycle handoff delay.
- The old `96/min` figure was only the reciprocal of the configured 625 ms sleep, not an achievable envelope under the old implementation.
- A bounded after-hours experiment exercised a 119-entry trailing-60-second, strictly single-flight, no-fixed-sleep controller through the real provider path while normal acquisition remained session-blocked.
- That experiment sustained 119.72 actual HTTP starts/minute for one hour: 7,200/7,200 HTTP 200, zero 429s, stable latency, zero durable evidence/cache/scheduler interference.
- Tradier returned `X-Ratelimit-Allowed: 120` consistently. `Used`/`Available` remained non-monotonic/incoherent as a cumulative control ledger and should remain evidence rather than normal admission control.
- The next discriminating question is what the new admission behavior does to **regular-session evidence flow**: WIP depth/age, Decision coverage, freshness, publication cadence, quota waits, and scheduler handoff behavior.
- Provider-path utilization improvement is not itself proof of whole-system improvement and does not identify Herbie.
- Keep the separate approximately 1.2-second scheduler-cycle handoff phenomenon distinct from provider admission-control behavior.
- Use Kiro for architecture/hypothesis/interpretation; use Codex for bounded mechanical measurement work wherever practical.
- Do not change scheduler, universe, freshness horizons, cache TTLs, concurrency, provider profile, topology, or session semantics merely to improve visible metrics without explicit operator authorization.

Latest evidence checkpoint:

`docs/40-provider-admission-controller-findings-2026-08-31.md`

Canonical restart plan:

`docs/39-constraint-identification-restart-plan.md`

Canonical Kiro prompt:

`docs/prompts/kiro-constraint-identification.md`

Canonical Codex measurement prompt:

`docs/prompts/codex-factory-floor-measurement.md`

`docs/38-herbie-evidence-renewal-constraint.md` remains historical context. Where it overstates a candidate Herbie, Doc 39 supplies the current conservative interpretation; Doc 40 supplies the latest measured evidence.
