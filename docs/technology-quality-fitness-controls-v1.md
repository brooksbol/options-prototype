# Wheelwright Technology Quality — Fitness Controls v1

**Ratified:** September 3, 2026
**Status:** Principal-ratified fitness-control set (graduation record)
**Authority:** Category C — Canonical Project / Operational State (technology-quality fitness controls)
**Governing authority:** `foundations/technology-quality-constitution-v1.md` (Article VI fitness-function lifecycle; Article VIII authority), `technology-quality-program-v1.md` (Workstream 9; deliverable #11)
**Related:** `parking-lot.md` `PL-COHERE-01`, `foundations/multi-actor-repeatability-temporal-synchronization.md`, `docs/README.md`

---

## 1. Purpose

This document records the Principal's September 3, 2026 decision to **graduate** two technology-quality mechanisms from experiment into Wheelwright's durable Technology Quality Program, and the exact authority boundaries of that graduation.

It is the durable form of Technology Quality Program v1 **deliverable #11 (CI/CD fitness-control set)** and executes the Constitution's Article VI promotion lifecycle. It is not a new authority: the Constitution and Program already govern how controls earn a role. This document records *which* controls earned *which* role, at *which* lifecycle stage, and *what remains unratified*.

This is graduation/design/documentation. **No findings were remediated. No production code was refactored.** `DatabaseManager`, `AcquisitionWorker`, `MultiExpirationSurfaceAnalysis`, and `SchedulerConfig` are unchanged.

---

## 2. The three-layer quality model (ratified)

The experiments established a crisp division of labor. Each layer is authoritative only for its band.

| Layer | Mechanism | What it can make boring (commoditize) | What it is NOT |
|-------|-----------|----------------------------------------|----------------|
| **Local / structural code quality** | Strict Sonar profile | complexity, size, nesting, field/method pressure, ordinary code smells, structural proxies | Not an architectural or design-quality authority |
| **Ratified architectural invariants** | ArchUnit | dependency direction, cycles, boundary crossings, confinement of infrastructure construction | Not architectural *judgment*; only propositions we defend independently |
| **Design quality** | Human / AI review | SRP in substance, quality of abstractions, IoC/seams within legitimate boundaries, implicit state machines, semantic contracts, whether the architecture itself is right | Not reducible to mechanical rules |

**Discriminator preserved — `DatabaseManager`:** neither strict Sonar nor the ArchUnit probe detected its deeper concerns (weak IoC, concealed infrastructure dependencies, `DriverManager`/classloader resource discovery, `Instant.now()` time coupling, absent substitution seam). ArchUnit correctly said "you are in the `db` package using JDBC — permitted." Those concerns are **not automated** and remain in the design-judgment layer. Do not claim otherwise.

**Complementarity demonstrated — `AcquisitionWorker`:** strict Sonar found size/complexity/state pressure (58 fields, 53 methods, cognitive complexity 54, brain method); the ArchUnit probe independently found a qualitatively different thing Sonar cannot see — orchestration constructs its own executor (`Executors.newSingleThreadScheduledExecutor` in the constructor).

**Anti-hypothesis-fitting evidence — `MultiExpirationSurfaceAnalysis`:** a *general* JDBC-boundary invariant found a violation in a class we never nominated as a specimen. This is the strongest evidence that a well-formed invariant discovers rather than confirms.

---

## 3. Governing operating principle — trend/visibility over build-killers

These mechanisms exist to make quality **visible, measurable, and directionally improvable** — not to convert every detected smell or architectural concern into an immediate build failure.

Prefer, in order:

- baselines and trends over absolute purity;
- detecting whether quality is improving or degrading;
- preventing substantial **new** debt where that can be done reliably;
- surfacing meaningful regressions to the operator;
- distinguishing **legacy** debt from **newly introduced** debt;
- evidence that supports engineering judgment rather than mechanically replacing it.

The machinery should let Wheelwright answer:

- Is the codebase getting structurally better or worse?
- Are we introducing new high-confidence smells faster than we remove old ones?
- Is architectural debt increasing?
- Are particular areas accumulating disproportionate quality pressure?
- Did a change materially worsen an established quality dimension?

**Build-breaking enforcement is reserved** for a small class of high-confidence invariants where violation is clearly unacceptable and the proposition has been explicitly ratified at the appropriate authority level. This restates the Constitution: *"No control becomes a hard gate merely because a tool ships with that rule enabled."*

Explicitly:

- Graduating the strict Sonar profile does **not** make its ~559 active rules build gates.
- A ratified ArchUnit invariant does **not** automatically become an immediate hard build failure; ratification of the *proposition* and ratification of *hard-gate enforcement* are two separate decisions.

The objective is sustained quality pressure and early visibility, not a brittle process that incentivizes gaming metrics.

---

## 4. Layer 1 — Strict Sonar profile (GRADUATED as quality policy)

**Decision:** Wheelwright's Java quality standard is intentionally stricter than Sonar Way. The lessons of the experimental `Wheelwright Clean Code Experimental` profile are preserved as durable, reproducible configuration rather than mutable state inside the current disposable SonarQube instance.

**Role:** commodity/local structural layer only. Sonar is **not** represented as an architectural or design-quality authority.

**Reproducible configuration (profile-as-code):** the durable artifact is the delta over Sonar Way — the design-signal rules Wheelwright adds and the thresholds it tightens. This delta, not a full 559-rule dump, is the reviewable policy (a full dump would silently drift as Sonar Way evolves across Sonar versions). Recorded in `reference-data/sonar/wheelwright-clean-code-profile-delta-v1.md`.

Delta summary (rules activated beyond Sonar Way, with tuned thresholds):

| Rule | Concept (commodity band) | Threshold vs Sonar Way default |
|------|--------------------------|-------------------------------|
| `java:S1200` | coupling to other classes | 20 → **15** |
| `java:S1448` | too many methods (SRP proxy) | 35 → **20** |
| `java:S1820` | too many fields (state/SRP proxy) | 20 → **12** |
| `java:S138`  | method too many lines | 75 → **60** |
| `java:S1541` | cyclomatic complexity | activated (10) |
| `java:S104`  | file too many lines | 750 → **500** |
| `java:S134`  | nesting depth | activated (3) |
| `java:S1142` | too many return statements | activated (3) |
| `java:S2972` | inner classes too many lines | activated |
| `java:S2384` | private mutable members exposed | activated |
| `java:S2325` | method not using instance data should be static (cohesion signal) | activated |
| `java:S2693` | threads started in constructors | activated |
| `java:S3366` | `this` exposed from constructors | activated |
| `java:S2156`, `java:S1610`, `java:S1694`, `java:S1258` | OO/inheritance hygiene | activated |
| `java:S1160`, `java:S2221`, `java:S3242`, `java:S3553`, `java:S2301` | contracts/exceptions | activated |

**Threshold values are Principal-ratified provisional parameters** (per project-memory protocol numeric-authority rule): defensible for design signal, revisable with evidence.

**Baseline evidence (informational, not a gate):** at subject `a6a4465`, Java scope `src/main`+`src/test`, JaCoCo coverage 70.8%: Sonar Way = 299 violations; strict profile = 462 (+163, all code smells; same 5 bugs). The +163 is dominated by the design-signal rules above.

**Lifecycle stage:** promoted to **standing observational quality policy with trend intent** (baseline + trend), NOT to hard gates. Any future promotion of a specific rule to a warning-with-teeth or hard gate is a separate ratified step.

---

## 5. Layer 2 — ArchUnit (GRADUATED as an approved mechanism; individual invariants ratified separately)

**Decision:** ArchUnit graduates as an **approved architectural-quality mechanism**, not as the experimental rule set wholesale. Its role is enforcing **ratified architectural invariants**: dependency direction, cycles, boundary crossings, confinement of infrastructure construction, and similar propositions where appropriate.

**Authority standard (stronger than ordinary Sonar rules):**

> **Only automate architectural propositions we are prepared to defend independently of the code that happens to violate them.**

An ArchUnit rule is **executable architecture policy**, not merely another lint. Therefore ArchUnit rules carry stronger authority requirements than Sonar quality rules, and are not accumulated casually.

**Disposition of the experimental probe rules:**

| Rule | Proposition | Status |
|------|-------------|--------|
| **R4** | JDBC connection construction belongs within the persistence boundary (`db`) | **Strong candidate invariant.** Defensible independently; found `MultiExpirationSurfaceAnalysis` unprompted. Ratify as an invariant (enforcement mode TBD per §3). |
| **R5** | Direct scheduler/executor construction confined to the composition boundary | **Strong candidate, blocked on prerequisite.** Requires the actual Wheelwright **composition boundary** to be established/ratified before the invariant can be stated cleanly. |
| **R2a** | `db` must not depend on the root orchestration package | **NOT ratified.** The `db → root` observation via `SchedulerConfig` demonstrated that **package topology does not necessarily equal conceptual architecture.** The machine correctly observed a real dependency; we have not established that the dependency is *wrong*. |
| R1, R2b, R2c, R3, R3b | cycles, other direction rules | Passed in the probe (no violations); not yet ratified as durable invariants — held as candidates. |

**No experimental harness is copied into the production build.** ArchUnit is not permanently added to `evidence-service-java` by this graduation. The durable implementation approach is specified in §6; actual introduction of ArchUnit into the build is a subsequent authorized step.

---

## 6. Durable / reproducible implementation required (design, not yet built)

What graduation *requires* to become durable, and what remains a further decision:

**Strict Sonar profile:**
- Store the profile-as-code delta (`reference-data/sonar/…`, this commit) as the source of truth.
- A reproducible provisioning step (script or documented API sequence) that recreates the `Wheelwright Clean Code Experimental` profile on any SonarQube instance from the delta — so the policy does not depend on the current disposable instance. **(Not built by this change; specified here.)**
- Trend capture: periodic scans of a stable subject with results retained over time (baseline → trend), distinguishing new vs legacy findings (Sonar "new code" period / leak period is the natural mechanism). **(Design; not configured by this change.)**

**ArchUnit:**
- A minimal, non-invasive way to run ratified invariants (isolated module or test source set) that does not entangle production build unless/until hard-gate enforcement is ratified. The experiment used an isolated off-repo harness (`~/wheelwright-archunit-probe/`); the durable form is TBD and requires a Principal decision on enforcement mode (§3).
- Only R4 (and R5 after the composition boundary is set) are candidates for first durable rules.

**Repository hygiene (done by this change):** `.scannerwork/` added to `.gitignore` (SonarScanner scratch output; SonarScanner is now standing tooling).

---

## 7. What became durable vs what remains experimental

**Durable (this change):**
- The three-layer quality model and the trend-over-gates operating principle.
- The strict Sonar profile *policy* (delta + thresholds) as reproducible config-as-code.
- ArchUnit graduated as an *approved mechanism* with the "defend independently" authority standard.
- Dispositions: R4 strong candidate; R5 candidate pending composition boundary; **R2a explicitly not ratified**.
- The `DatabaseManager` discriminator and the automation-boundary claim.

**Remains experimental / not yet built:**
- The live `Wheelwright Clean Code Experimental` Sonar profile and the experimental Sonar/ArchUnit projects in the disposable instance (kept intact until the durable mechanism can reproduce the evidence).
- Actual ArchUnit integration into the build; trend-capture wiring; any hard-gate enforcement.

---

## 8. Further Principal decisions actually required

1. **Composition boundary definition** — what is Wheelwright's ratified composition/wiring boundary (currently informally: `*Config` classes + `EvidenceServiceApplication`)? Required before R5 can be ratified as an invariant.
2. **Enforcement mode per control** — for R4 (and later R5): observational/trend, warning, or hard gate? Default per §3 is *not* a hard gate.
3. **Durable ArchUnit vehicle** — isolated test source set in `evidence-service-java`, a separate module, or a delivery-pipeline step. Introducing it touches build files, so it is a separate authorized change.
4. **Trend infrastructure** — whether to stand up periodic scans / new-code period now or defer.

None of these are resolved by this document; it records the graduation and its boundaries so a cold-start actor can reconstruct the decision and the open questions.

---

## 9. Reconciliation with existing authority

- **Constitution Article VI (fitness-function lifecycle):** this graduation *is* that lifecycle applied — observation → characteristic → operational definition → candidate → exemplar validation (`AcquisitionWorker`/`DatabaseManager`/`MultiExpirationSurfaceAnalysis`) → (shadow/observational) → deliberate promotion. No conflict.
- **Constitution Article VIII / "no hard gate merely because a tool enables a rule":** honored by §3. No conflict.
- **Program Workstream 9 + deliverable #11:** this is the durable expression. No conflict.
- **Program constraint "do not create a Sonar-specific parking-lot item":** honored — no `PL-SONAR`; this is a Program fitness-control record cross-referenced to `PL-COHERE-01`.
- **`PL-COHERE-01`:** architecture-to-code coherence remains the owning backlog identity; the ratified/candidate invariants feed it. No conflict.
- **Document-authority model:** filed as Category C (operational state), subordinate to the Category B Constitution and Category A system definition.

No part of this decision was found to conflict with existing ratified authority. Where it constrains future action (enforcement mode, composition boundary), it defers to the Principal rather than deciding unilaterally.
