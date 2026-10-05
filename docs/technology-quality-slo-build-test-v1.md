# Wheelwright Technology Quality — Build/Test SLO: `gradlew clean test` v1

**Ratified:** October 5, 2026 (Principal decision — build/test feedback-loop SLO)
**Status:** Principal-ratified Service Level Objective (SLO)
**Authority:** Category C — Canonical Project / Operational State (technology-quality fitness control)
**Governing authority:** `foundations/technology-quality-constitution-v1.md`, `technology-quality-program-v1.md`, `technology-quality-fitness-controls-v1.md` (§3 trend/visibility operating principle)
**Related:** `docs/bugs/BUG-028-gradlew-clean-test-exceeds-slo.md`, `foundations/closed-loop-engineering.md` (Engineering Loop)

---

## SLO-BUILD-01 — Backend `gradlew clean test` wall-clock

| Field | Value |
|-------|-------|
| **Identity** | `SLO-BUILD-01` (permanent; never reused) |
| **Objective** | A full backend `./gradlew clean test` completes in **≤ 60 seconds** wall-clock. |
| **Subject** | `evidence-service-java` backend test suite (JUnit 5), clean build (no incremental cache). |
| **Measurement** | Wall-clock of `./gradlew clean test` from a cold task graph, measured with `/usr/bin/time -p` (the `real` value). JDK 21 toolchain, `JAVA_HOME` set to a valid JDK 21. |
| **Reference environment** | The current development machine of record (`docs/development-machine.md`): MacBook Air, Apple M1, 8 GB RAM, 8 cores (4P/4E). The SLO is stated against this machine so the number is reconstructable; it is not a claim about arbitrary CI hardware. |
| **Enforcement mode** | Observational / trend target (per fitness-controls §3). It is **not** a hard build gate. It is a ratified objective the engineering loop is expected to move toward. |

---

## 1. Why this SLO exists

The backend test suite is the inner feedback loop of the Engineering Loop
(`foundations/closed-loop-engineering.md`): Spec → Implement → **Review** → Refine.
Review latency is dominated by how fast working software can be exercised. A clean
`gradlew clean test` that takes minutes degrades the engineering learning rate — the
project's stated optimization target — because every verification cycle pays that cost.

A one-minute objective is chosen as the threshold below which the clean suite is a
cheap, routine, inner-loop action rather than a context-switch-forcing interruption.

## 2. Current baseline (informational, not the objective)

Measured October 5, 2026 on the reference machine, JDK 21 (Temurin 21.0.11):

- `./gradlew clean test` → **`real 301.12`** (~5 min 1 s). `BUILD SUCCESSFUL`.

Decomposition of the baseline:

- **232 s (77%) is deliberate `Thread.sleep`** — 63 fixed sleep calls across the
  wall-clock-based acquisition/provider-lifecycle integration tests.
- Three classes dominate: `DegradedRecoveryWhileBlockedTest` (~150 s),
  `AcquisitionWorkerTest` forced-acquisition cases (~68 s),
  `DegradedModeIntegrationTest` (~22 s).
- Tests run **serially in a single JVM fork** — there is no `gradle.properties` and no
  `maxParallelForks`, so sleep time is additive and does not overlap.

The baseline is **≈ 5× the objective**. The gap between this baseline and the SLO is
tracked as a defect: `BUG-028`.

## 3. Measurement discipline

- Measure a **clean** run (`clean test`), not an incremental one, so the number reflects
  the worst-case inner-loop cost rather than a warm cache.
- Use the `real` (wall-clock) figure, not `user`/`sys` — the suite is sleep/I/O-bound, so
  CPU time understates the operator-perceived cost.
- Ensure `JAVA_HOME` points at a valid JDK 21 before measuring. On the reference machine
  the shell default `JAVA_HOME` was observed pointing at the dead Apple
  `JavaVM.framework` stub; measure with `JAVA_HOME="$(/usr/libexec/java_home -v 21)"`.

## 4. Authority boundaries

- This SLO ratifies an **objective and its measurement**. It does **not** authorize any
  specific remediation (enabling parallel forks, replacing wall-clock waits with an
  injectable clock, retagging slow tests, etc.). Remediation requires separate explicit
  Principal authorization, consistent with the mode/authorization discipline in
  `bootstrap/project-memory-protocol.md`.
- Per fitness-controls §3, this is a trend/visibility target, not a hard gate. A future
  decision to make SLO breach a build failure would be a separate ratified step.
- The 60 s threshold is a **Principal-ratified provisional parameter** (project-memory
  numeric-authority rule): defensible as an inner-loop target, revisable with evidence.
