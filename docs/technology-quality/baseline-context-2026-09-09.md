# Technology Quality Baseline — Context Capture (2026-09-09)

**Status:** Baseline context capture — **smallest legitimate baseline-freeze activity** under the mandated Technology Quality Program v1 (Workstreams 3–4). This records the immutable subject and measurement context. **It is NOT a full baseline run, NOT a scorecard, NOT remediation authorization.**
**Authority:** Category C — Canonical Project / Operational State for the technology-quality program.
**Governing docs:** `foundations/technology-quality-constitution-v1.md`, `technology-quality-program-v1.md`, `technology-quality-fitness-controls-v1.md`.
**Produced:** 2026-09-09, authorized 3AM execution cycle (Principal + ChatGPT + Kiro), Kiro as invoked actor. Parallel governance lane — did not displace product-learning work.

---

## 1. Immutable baseline subject SHA

**Baseline subject = `200f02243d27709f687383d3b56febe11041a28d`** (local `main` HEAD at capture; = ratified `addd498` + this cycle's two doc-only commits `2d4928c`, `200f022`).

Rationale for this checkpoint (per the constitution's "sensible checkpoint" guidance): captured at a clean point immediately after a truth-preflight established that `PL-DEPLOY-02-DEF01` is remediated and before any `LVT-INIT-CONSEQUENCE-RELEASE-COST` implementation exists. The subject is doc-only ahead of accepted `main` (`addd498`); the **code** under measurement is identical to `addd498`. If the Principal prefers the baseline pinned to accepted `main`, re-pin to `addd498` — the measured source tree is equivalent (the two intervening commits touch only `docs/`).

**Snapshot rule:** once chosen, this subject is frozen. Ongoing development does not silently mutate it. Re-baselining is deliberate and creates a new baseline identity.

## 2. Measurement context

| Field | Value |
|-------|-------|
| Subject SHA | `200f022` (code-equivalent to accepted `addd498`) |
| Repository | `brooksbol/options-prototype` |
| Capture date/time | 2026-09-09 (session), machine time skew known on this dev host — treat SHA as authoritative, not wall clock |
| Backend language/toolchain | Java 21 (Temurin 21.0.11+10-LTS); Gradle 9.6.1 (Kotlin DSL 2.3.21); JUnit Platform |
| Frontend toolchain | TypeScript ~6.0.2; Vite ^8.1.1; Vitest ^4.1.9; React ^19.2.7 |
| Backend test result (measured this capture) | **441 tests, 1 skipped, 0 failures, 0 errors — green** (`./gradlew test`) |
| Frontend test result | **NOT measured this capture** — node/npm not on this shell's PATH (nvm-managed). Journal reports ~1350+ frontend tests green at recent SHAs; treat as unverified-here. |
| Existing SCA tooling | SonarQube **25.9.0.112764** (local `http://localhost:9000`), run previously — two projects: `wheelwright` (root/frontend) and `wheelwright-java-clean-code-experimental` (backend). Evidence in `.scannerwork/` (git-ignored). |
| Sonar config | No committed `sonar-project.properties`; scanner invoked externally. Ruleset/profile identity is therefore **not reproducible from the repo alone** — a comparability limitation (see §5). |
| ArchUnit | Referenced as "approved mechanism" in `technology-quality-fitness-controls-v1.md`, but **not present** as a `build.gradle.kts` dependency and **no ArchUnit tests exist** in `src/test`. Doc-vs-implementation gap (see §4). |
| Included paths (intended) | `evidence-service-java/src/main`, `evidence-service-java/src/test`, `options-prototype/src`, `options-prototype/tests` |
| Excluded / generated / vendor | `node_modules/`, `dist/`, `coverage/`, `.vite/`, `build/`, `.scannerwork/`, `.env`, `data/*.sqlite3` (per `.gitignore`) |
| Raw-results custody | `.scannerwork/report-task.txt` (git-ignored, local only) at root and `evidence-service-java/`. Not committed. Prior SonarQube task IDs recorded there. |

## 3. What this capture is and is not

- **Is:** an immutable subject SHA + reproducibility context, so a future comparable measurement is possible and a tool/ruleset change cannot masquerade as architectural change.
- **Is not:** a full multi-stream baseline (static/topology/coherence/test-quality/dependency/coupling), a scorecard, a composite score, or any remediation. Those are later mandated Program workstreams (5–8), each requiring their own execution.
- **No composite quality score is produced** (constitution Article V; program §7 "No metric gaming").
- **No remediation performed or authorized.**

## 4. Findings surfaced during capture (recorded, not remediated)

Per the authorization, material correctness/safety/coherence/delivery constraints are surfaced because they could legitimately preempt product work. None of the below rises to that bar; all are recorded for the eventual baseline reconciliation:

1. **ArchUnit doc-vs-implementation gap (coherence, low urgency):** `technology-quality-fitness-controls-v1.md` graduates ArchUnit as an approved architectural-invariant mechanism, but no ArchUnit dependency or test exists in the backend. This is *approved ≠ installed* drift, not a correctness defect. Disposition candidate: clarify the fitness-controls doc (approved-but-not-yet-adopted) or adopt ArchUnit — a later Program decision, not this cycle.
2. **Sonar ruleset not repo-reproducible (measurement reproducibility):** no committed `sonar-project.properties`; the profile lives on the external SonarQube server. Comparable re-measurement depends on server state. Disposition candidate: commit the scanner config/profile identity so the baseline is reproducible from the repo — a Program §"Measurement reproducibility" concern.
3. **Frontend test suite not runnable in this environment (tooling):** node/npm absent from PATH here (nvm). Not a defect; a capture-environment limitation. Frontend evidence must be gathered in an environment with the toolchain loaded.

**None of these is a material constraint that should preempt `LVT-INIT-CONSEQUENCE-RELEASE-COST`.** The parallel TQ lane therefore does not displace the product-learning slot this cycle (consistent with the ratified sequencing).

## 5. Comparability limitations (record before trend)

- Trend exists only after a **second comparable measurement**. This is a first context capture, not a trend point.
- Sonar profile/ruleset is server-side and not pinned in-repo → cross-time comparability is currently weak for the SCA stream until the profile is captured reproducibly.
- Frontend static/test evidence not captured here → the baseline is backend-biased until completed in a toolchain-loaded environment.
- Backend test count (441/1 skipped/0 fail) is a point-in-time measured fact at `200f022`.

## 6. Next Program steps (not performed here; not authorized by this record)

Per Technology Quality Program v1 Workstreams 4–8, in a later authorized activity:
- complete the untouched multi-stream baseline (static/mechanical, topology, coherence, test-quality, dependency/security, coupling) in a toolchain-complete environment;
- pin the Sonar profile / scanner config reproducibly;
- produce the Architecture & Quality Balanced Scorecard (no composite score);
- reconcile findings to explicit dispositions;
- only then consider bounded interventions and earned fitness-function promotion.

This record freezes the subject and context so those steps remain comparable. No remediation, no scorecard, no score, no cleanup campaign is authorized by it.
