# Wheelwright Technology Quality Constitution — Version 1

**Ratified:** September 3, 2026  
**Status:** Ratified methodology  
**Authority:** Category B — Ratified Decision / Accepted Methodology  
**Principal:** Ratified for use as Wheelwright's version-one technology-quality and implementation-architecture governance model  
**Related:** `evidence-appliance.md`, `closed-loop-engineering.md`, `architectural-evolution-methodology.md`, `backend-behavioral-invariants.md`, `strategy-architecture-reconciliation.md`, `idea-intake-reconciliation.md`, `../architecture-roadmap.md`, complete `../parking-lot*.md` sequence

---

## 1. Purpose and authority boundary

This constitution governs the engineering realization and evolution of Wheelwright's technology architecture.

It does **not** redefine product meaning, behavioral invariants, policy semantics, or previously ratified architectural decisions. Category A system definitions remain authoritative for what Wheelwright is. Ratified ADRs, behavioral invariants, and other Category B decisions remain authoritative within their subjects. Apparent conflicts require explicit reconciliation; this document must not silently supersede them.

The constitution is intentionally stack-neutral. It must remain useful if Wheelwright changes language, framework, static-analysis tooling, CI provider, deployment topology, or repository organization.

Quality rigor is proportional to **consequence, expected lifespan, and architectural reach**. Production code, tests, migrations, build logic, operational scripts, experiments, generated artifacts, and other supporting assets may therefore require different controls without becoming automatically exempt from quality governance.

Version 1 is expected to evolve. Amendments require explicit Principal ratification and a new version or clearly recorded revision. Prior versions remain why-state; they do not silently disappear.

---

# Constitutional principles

## Article I — Architecture must be explicit and transmissible

Architectural intent must be discoverable from durable repository artifacts and expressed clearly enough in implementation structure that capable actors do not need repeated historical archaeology to determine where responsibility, authority, state, and dependencies belong.

Conceptual and application architecture are incomplete if ordinary source code obscures their consequences. Implementation architecture is the bridge between architectural intent and code shape.

The repository is part of the architecture. Foundations, ADRs, implementation standards, package/module topology, interfaces, tests, examples, fitness functions, and project-memory routing should make the intended architecture progressively easier to know and follow.

## Article II — Responsibility, authority, and state must be intentional

Consequential behavior must have an intelligible owner. Components should have coherent primary responsibilities and understandable reasons to change.

Stateful behavior is legitimate when the state model is intentional: states, transitions, invariants, and transition ownership are explicit enough to reason about and test.

An emergent state machine is an architectural smell: flags, counters, modes, timestamps, ordering assumptions, and procedural branches collectively create lifecycle behavior without an intentional model.

Mutable state should exist because an invariant requires remembered information, not merely because mutation is convenient. Prefer authoritative state over duplicated mutable representations. Independent concerns should remain independently modeled unless a shared invariant genuinely requires them to be coupled.

Useful review heuristic: **Workers execute. Control planes control. Persistence persists. Presentation projects.** This is a responsibility test, not a rigid class taxonomy.

## Article III — Complexity must be earned and change must remain economical

Complexity is a cost that requires demonstrated architectural pressure.

Patterns, abstractions, frameworks, services, state machines, registries, infrastructure, and topology should be introduced because the system needs the capability they provide, not because they are fashionable or theoretically elegant.

Simplicity must not become an excuse for procedural accumulation, hidden authority, or unclear ownership.

A healthy architecture remains economically changeable: valuable changes should not routinely require disproportionate modification of unrelated components, repeated rediscovery of intent, or duplicated implementation paths.

Quality governance is subject to the same rule. A control, metric, report, fitness function, or process whose maintenance cost exceeds its demonstrated protective value should be simplified or retired. Every promoted control must have a review condition or review date so retirement is an actual lifecycle path, not an aspiration.

## Article IV — Architecture evolves through evidence and deliberate change

Wheelwright uses guided, incremental, multidimensional architectural evolution.

Architectural characteristics arise from both directions:

- top-down from Wheelwright's mission, operating model, foundations, ADRs, and behavioral invariants; and
- bottom-up from observed implementation condition and operational evidence.

The implementation is evidence; it is not authority merely because it exists or passes tests.

The operating loop is:

**Intent → architectural characteristics → implementation → evidence → fitness evaluation → deliberate intervention → revised understanding.**

Incremental evolution does not prohibit structural correction. When evidence shows that a boundary itself is misplaced, a bounded extraction or restructuring may be the correct evolutionary move.

Consequential structural change must preserve a credible verification, migration, compatibility, observability, and recovery path proportionate to its risk.

## Article V — Technology quality is multidimensional

There is no meaningful single architecture-quality score.

Wheelwright should evaluate technology condition across multiple architectural characteristics. Candidate dimensions may include architectural coherence, responsibility clarity, state integrity, boundary integrity, dependency integrity, changeability, structural quality, test/evidence quality, security/dependency health, operational/data sustainability, and deletion hygiene.

Dimensions are management lenses, not a formula. A serious weakness in one dimension must not disappear inside strengths elsewhere.

A first baseline establishes condition. Trend exists only after comparable repeated measurements.

## Article VI — Important characteristics may receive earned fitness functions

Not every architectural characteristic should be mechanically enforced.

A fitness function is a deliberately selected mechanism for observing or protecting a characteristic. It may be static or dynamic, automated or periodic, quantitative or structured human assessment.

A measure does not acquire authority because a tool can calculate it.

Promotion follows a deliberate lifecycle:

**Observation → architectural characteristic → operational definition → candidate fitness function → positive/negative exemplar validation → shadow measurement → reliability and consequence review → warning or gate → periodic recalibration or retirement.**

A candidate fitness function must represent the characteristic it claims to protect. Where practical, it must be validated against known positive and negative Wheelwright exemplars before promotion. A proxy that cannot distinguish coherent from incoherent implementations is not adequate merely because it is easy to measure.

Static analysis, dependency/security analysis, architecture fitness checks, coverage enforcement, and similar engineering controls belong in the delivery system. Wheelwright runtime should not acquire application behavior merely to satisfy delivery tooling.

## Article VII — Existence and correct boundaries precede remediation

Before improving code, determine whether the code should continue to exist and whether its responsibility lives in the correct place.

Dead, obsolete, dormant, duplicated, or superseded structures should be reconciled before their individual warnings become remediation work. A module scheduled for deletion may contribute evidence about estate condition, but its warnings do not automatically become a backlog of local fixes.

Meaningful findings should distinguish at least two architectural natures:

- **Drift:** the intended boundary remains sound, but implementation quality or conformance has deteriorated.
- **Misplaced boundary:** responsibility, authority, state, or dependency is structurally located in the wrong place.

Drift is generally amenable to incremental correction. Misplaced-boundary findings may require deliberate bounded restructuring. Incrementalism must not become an excuse to preserve a demonstrably incorrect boundary.

Finding disposition should normally be explicit: **delete, retain, repair locally, restructure, accept explicitly, investigate, or defer for a named reason/dependency.**

## Article VIII — Evidence informs; explicit authority governs change

Behavioral correctness does not prove structural correctness, and structural elegance does not compensate for behavioral defects.

Mechanical quality, architectural coherence, tests, runtime observations, security evidence, and human review are separate evidence systems. None substitutes for the others.

Tools do not authorize change. Scores do not authorize change. Assistant agreement does not authorize change.

The Principal retains consequential architectural and implementation authority under Wheelwright's actor model. Exploration discovers. Verification challenges. Evidence informs. The Principal authorizes.

---

# Technology Quality Operating Model

The constitution is the stable **why**. The operating model below is the day-to-day **how** and may evolve more frequently without changing the constitutional principles.

Wheelwright combines three complementary modes of architectural leadership:

1. **Operational, artifact-based architecture:** architecture participates in strategic planning, initiative delivery, and technology optimization through durable artifacts and explicit decisions rather than detached ceremony.
2. **Evolutionary architecture:** important characteristics are protected through guided incremental change and fitness feedback rather than frozen target-state design.
3. **Wheelwright closed-loop engineering:** working software and operational behavior produce evidence; evidence changes understanding; authority and uncertainty remain explicit.

## Standing technology-optimization loop

Technology optimization is a standing management responsibility. Cleanup is not.

The loop is:

**Measure → understand → identify material constraint/risk → choose bounded intervention → change → evaluate → repeat.**

This does not create a permanent technical-debt bucket. Imperfections become work only when evidence shows that they materially constrain correctness, safety, adaptability, architectural coherence, or economical delivery.

`PL-CLEANUP` remains a bounded intervention. It is not the technology-optimization program itself.

## Architecture & Quality Balanced Scorecard

The scorecard is a management instrument, not a grade and not a CI gate.

Each adopted dimension should report, as appropriate:

- current condition;
- evidence source and confidence;
- trend, only when comparable history exists;
- material risk or constraint;
- desired direction;
- candidate intervention;
- whether the assessment is mechanical, judgment-based, or mixed;
- owner for interpretation.

Do not average dimensions into one number.

Scorecard measures begin observationally. A specific characteristic may later acquire a fitness function and, after deliberate promotion, warning or gate authority.

## Measurement reproducibility

Comparable evidence requires preservation of measurement context. Baselines and repeated measurements should record at least:

- exact commit SHA;
- tool and ruleset versions;
- included and excluded paths;
- generated/vendor policy;
- measurement date/time;
- material configuration changes;
- raw results retained separately from interpretation;
- any baseline reset or metric-definition change.

A tool or ruleset change must not masquerade as architectural deterioration or improvement.

## Exceptions and retirement

Temporary exceptions are allowed when consequence warrants them, including urgent correctness or recovery work. An exception must not become precedent automatically.

A durable exception should identify:

- the rule or control being excepted;
- rationale;
- approving authority;
- owner;
- scope;
- expiration condition or review date;
- evidence required to close, renew, or convert it into a ratified rule change.

Promoted fitness functions and governance controls must also have a review date or review condition and an explicit retirement path.

---

# Day-to-day architecture practice

Use the following flow for ordinary architecture and implementation decisions.

## Before changing code

1. **Restore intent.** Identify the relevant Category A system definition, ADR/invariant, roadmap or parking-lot concern, and current implementation boundary.
2. **State the characteristic under pressure.** Examples: authority clarity, state integrity, provider-abstraction integrity, changeability, testability, security, deletion hygiene.
3. **Classify the problem.** Is it ordinary drift, a misplaced boundary, an unknown requiring evidence, or a capability gap?
4. **Check whether the code should exist.** Do not invest in remediation before live/dead/redundant topology is understood.
5. **Choose proportionate rigor.** Consequence, lifespan, and architectural reach determine how much design, evidence, testing, review, and migration planning are warranted.

## While designing

Ask:

- What responsibility is being introduced or changed?
- Who owns the authoritative state?
- Is any state machine intentional, with explicit invariants and transition ownership?
- Are independent concerns being collapsed accidentally?
- Does dependency direction remain deliberate?
- Does provider/infrastructure identity remain below the proper boundary?
- Does the design reduce or expand change blast radius?
- Is new complexity demonstrably earned?
- What evidence will distinguish success from merely successful compilation?
- If the boundary is wrong, what is the smallest bounded structural correction?
- What is the verification, migration, compatibility, and recovery path?

State/behavior/creation may be used as a Java review heuristic, but it is not a constitutional ontology. A future DDD, modular-monolith, or service-boundary decision must be earned by actual architectural pressure.

## Before acceptance

Confirm:

- behavioral correctness is demonstrated with proportionate evidence;
- structural conformance has been considered separately from behavior;
- consequential state transitions and invariants are testable or otherwise evidenced;
- static/security/dependency findings are understood in context rather than blindly remediated;
- obsolete code exposed by the change has an explicit disposition;
- new fitness rules, if any, were deliberately authorized rather than inherited from tool defaults;
- repository artifacts communicate any architectural learning that a future actor would otherwise need to rediscover.

---

# Version-one baseline authorization

The Principal authorizes a read-only **Technology Quality Baseline & Characteristic Discovery** phase under `PL-COHERE-01`.

## Objective

> Establish a reproducible untouched technology baseline for Wheelwright and discover the architectural characteristics that materially affect correctness, safety, adaptability, architectural coherence, and economical change. No remediation is authorized by the baseline itself.

## Snapshot rule

The baseline belongs to one exact `main` commit SHA. Ongoing development does not silently mutate the baseline. Re-baselining is deliberate and creates a new baseline identity.

If practical, choose the baseline SHA at a sensible checkpoint in the active provider investigation, but once chosen it remains frozen.

## Evidence streams

Capture, with frontend/backend separation where useful:

1. static/mechanical quality;
2. live/dead/redundant topology;
3. architecture-to-code coherence;
4. test and behavioral-evidence quality;
5. dependency and security health;
6. coupling/changeability evidence.

Persistence/data sustainability may be added when evidence indicates material pressure; it need not block the first baseline.

Static analysis leads temporally: capture untouched mechanical evidence before remediation. It does not lead epistemically. Record top-down architectural characteristics already required by Wheelwright authority so scanner capabilities do not define quality.

Tool selection should use the smallest combination that yields reproducible evidence. Existing tooling plus minimal additional analyzers is acceptable. SonarQube/SonarCloud is not required merely because "Sonar" motivated the investigation.

## Scope and exclusions

Explicitly record included/excluded paths and generated/vendor policy. Typical exclusions may include `node_modules`, build output, vendored dependencies, and intentionally generated artifacts where their inclusion would distort the result.

Tests, migrations, build scripts, and operational tooling are not automatically excluded; include them according to consequence and architectural reach.

## Coherence discipline

Every substantive architecture-to-code finding should:

- cite concrete code evidence;
- identify the relevant architectural characteristic or authority;
- label the claim **fact**, **evidence-supported hypothesis**, or **unresolved question**;
- distinguish drift from misplaced boundary when evidence permits;
- propose no remediation authority merely by being observed.

The first baseline must include at least:

- one evidence-grounded positive assessment of `ProviderAuthorityManager`; and
- one evidence-grounded negative assessment of `AcquisitionWorker`.

`AcquisitionWorker` is **analysis-only** while the active provider-admission / Docs 39–40 investigation remains open. This baseline does not authorize restructuring it.

## Finding disposition

Significant findings should be reconciled to one of:

**delete / retain / repair locally / restructure / explicitly accept / investigate / defer with named dependency.**

No scanner finding becomes a remediation task automatically.

## Exit criteria

The baseline phase is complete when:

1. one immutable SHA has complete reproducibility metadata;
2. each agreed evidence stream has produced usable evidence or an explicit documented limitation;
3. live/dead/redundant topology is reconciled enough to prevent obvious deletion candidates from becoming remediation noise;
4. the required positive and negative coherence exemplars are assessed with code evidence;
5. significant findings have dispositions and drift/boundary classifications where evidence permits;
6. candidate architectural characteristics are supported by existing Wheelwright authority, implementation evidence, or both;
7. candidate scorecard dimensions and candidate fitness functions can be proposed with stated confidence and evidence sources;
8. no remediation has contaminated the untouched baseline; and
9. the resulting package is reviewable by the Principal through the Four-Actor verification/reconciliation loop.

If the phase cannot produce a reproducible or sufficiently interpretable baseline, the next step is to improve measurement. Baseline failure does not itself authorize cleanup.

---

# Actor model for technology-quality work

For this program, the Four-Actor Model operates as follows:

- **Principal** — owns intent, ratification, authorization, acceptance/rejection, and consequential decisions.
- **Kiro** — repository-native architectural participant; reconstructs durable authority, performs architecture-to-code analysis, and implements when explicitly designated.
- **Codex** — adversarial engineering reviewer/falsifier; challenges overstatement, ambiguity, enforceability, mechanical evidence, and implementation risk.
- **ChatGPT** — independent synthesizer/challenger; reconciles readings, exposes decision points, and frames Principal decisions.

Assistant convergence is evidence of review, not authority. The Principal decides what becomes governing architecture, implementation work, a fitness function, or a gate.

---

# Immediate next actions after ratification

1. Treat this document as **Technology Quality Constitution v1** and the initial operating model.
2. Reconcile `PL-COHERE-01` and `PL-CLEANUP` so the canonical backlog expresses: technology optimization is a standing management loop; cleanup remains bounded; present reconciliation still restricts premature structural expansion.
3. Repair project-journal routing so `project-journal.md` and numbered continuations are unambiguously one logical Category C chronology discoverable from `docs/README.md`.
4. Prepare the reproducible baseline against an explicitly selected immutable SHA.
5. Execute the read-only evidence streams without remediation.
6. Review the baseline through Kiro → Codex → ChatGPT → Principal reconciliation.
7. Only after Principal review: adopt scorecard dimensions, implementation standards, bounded optimization interventions, and selected fitness functions that the evidence has earned.

---

## Governing summary

Wheelwright technology should be:

- **principled, not ideological;**
- **explicit, not archaeological;**
- **stateful intentionally, not accidentally;**
- **simple where simplicity preserves required characteristics;**
- **measured multidimensionally, not reduced to a grade;**
- **protected selectively through earned and validated fitness functions;**
- **improved through evidence-driven evolutionary change;**
- **restructured deliberately when the boundary itself is wrong;**
- **continuously optimized without becoming a permanent debt queue;**
- **safe to change and economically changeable;** and
- **governed by explicit Principal authority.**
