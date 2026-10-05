# BUG-028 — Backend `gradlew clean test` exceeds the 60-second feedback-loop SLO (~5× over)

- **Status:** Open
- **Severity:** S3
- **Area:** Engineering / backend test suite (`evidence-service-java`)
- **Provenance:** Discovered 2026-10-05 (measurement during SLO-BUILD-01 ratification)

## Observed failure
A full backend `./gradlew clean test` on the reference development machine
(`docs/development-machine.md`: MacBook Air, Apple M1, 8 GB RAM) completes in
**`real 301.12`** (~5 min 1 s), measured with `/usr/bin/time -p` under JDK 21
(Temurin 21.0.11). `BUILD SUCCESSFUL`. This is ~5× the ratified objective.

## Intended semantics violated
`SLO-BUILD-01` (`technology-quality-slo-build-test-v1.md`) ratifies that a clean
backend `gradlew clean test` completes in **≤ 60 seconds** wall-clock on the reference
machine. The observed 301 s violates that objective. The SLO exists to keep the inner
Engineering Loop (`foundations/closed-loop-engineering.md`) cheap; a multi-minute clean
suite degrades the engineering learning rate the methodology optimizes for.

## Evidence
- Timed clean run (observed, 2026-10-05): `./gradlew clean test` → `real 301.12`,
  `user 1.07`, `sys 0.30`. The near-zero CPU time relative to wall-clock confirms the
  suite is sleep/I/O-bound, not compute-bound.
- Static measurement (observed): **63 `Thread.sleep(...)` calls totaling 232,007 ms
  (~232 s, 77% of wall-clock)** across the wall-clock-based acquisition/provider
  lifecycle integration tests.
- Per-class attribution from JUnit XML reports (observed):
  - `DegradedRecoveryWhileBlockedTest` — 149.76 s (19 tests)
  - `AcquisitionWorkerTest` forced-acquisition cases — ~68 s
  - `DegradedModeIntegrationTest` — 22.04 s (2 tests)
  - remainder (~250 tests) — ~60 s combined
- Configuration (observed): no `gradle.properties`; `build.gradle.kts` sets no
  `maxParallelForks`. Tests therefore run **serially in a single JVM fork**, so the 232 s
  of sleeps is additive and does not overlap.

## Consequence
Every clean verification cycle costs ~5 minutes, discouraging frequent full-suite runs
and lengthening the Spec → Implement → Review → Refine loop. Severity **S3 (moderate)**:
it degrades engineering feedback latency and the stated learning-rate target, but does
not corrupt evidence, accounting, or operator-facing correctness. No market/domain
semantics are wrong — only the feedback loop is slow.

## Diagnosis / root cause
The suite is slow **by construction**: the acquisition/provider state-machine tests assert
on background-scheduler behavior over real wall-clock time and wait for it with fixed
`Thread.sleep(...)` calls (up to 8,000–10,000 ms each). Two amplifiers:
1. **No test parallelism** — single serial JVM fork makes all sleep time additive, even
   though the tests are nearly idle on CPU and would parallelize well on the 8-core M1.
2. **`@SpringBootTest` context loads** in several controller tests add fixed per-context
   startup overhead on top of the sleeps (small relative to the sleeps).

## Scope / non-goals
This record documents the SLO breach and its measured root cause. It does **not** author
or authorize any remediation. Candidate directions exist (enable `maxParallelForks` after
verifying SQLite/static-state fork-safety; replace wall-clock waits with an injectable
clock / Awaitility polling; tag the time-based lifecycle tests and exclude them from the
inner loop) but **filing does not authorize remediation** — that is a separate explicit
Principal decision. Priority/sequencing is also a separate Principal decision; S3 is a
consequence classification only.

## Acceptance criteria
A fix is complete when a clean `./gradlew clean test` on the reference machine completes
in **≤ 60 s** wall-clock (per SLO-BUILD-01 measurement discipline: cold task graph,
`/usr/bin/time -p` `real`, JDK 21), while the suite still verifies the same
acquisition/provider-lifecycle semantics it does today (no loss of coverage or
determinism, no newly flaky tests).

## Remediation history
_Empty while Open._

## Verification
_Empty while Open._

## Related
- `technology-quality-slo-build-test-v1.md` — `SLO-BUILD-01`, the objective this defect is
  filed against (authority for the 60 s target and its measurement).
- `technology-quality-fitness-controls-v1.md` §3 — trend/visibility operating principle
  (why this is an objective, not a hard build gate).
- `foundations/closed-loop-engineering.md` — Engineering Loop / learning-rate rationale.
- `docs/development-machine.md` — reference environment the SLO and this measurement are
  stated against.
