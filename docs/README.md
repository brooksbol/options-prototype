# Documentation Guide

> For project overview, development setup, and current status, see the [root README](../README.md).

This directory contains the architectural documentation for the Wheelwright Evidence Appliance.

## Parking-Lot Continuation Rule — August 29, 2026

The canonical parking lot may span physical continuation files. `docs/parking-lot.md`, `docs/parking-lot-2.md`, and any later numbered continuations are **one logical Category C backlog**. Every cold start, scan, search, backlog review, and reconciliation must cover the complete `docs/parking-lot*.md` sequence through enumeration/index or targeted search; full reading is required only for relevant entries. An untasked cold start must not load the entire backlog. File boundaries are pagination only; stable IDs, governance, and dispositions are global.

> **Authority note:** This continuation rule amends all references below that say only `parking-lot.md`; they mean the complete continuation sequence.

## Project-Journal Continuation Rule — September 3, 2026

The canonical project journal may span physical continuation files. `docs/journal/project-journal.md`, `docs/journal/project-journal-2.md`, `docs/journal/project-journal-3.md`, `docs/journal/project-journal-4.md`, and any later numbered continuations are **one logical Category C chronology**. Topical journal retrieval, context reconstruction, and chronological review must cover the complete `docs/journal/project-journal*.md` sequence through enumeration/index or targeted search and read relevant spans, not automatically load every page. File boundaries are pagination only; later continuations do not have lesser authority or durability.

> **Authority note:** References below to the project journal mean the complete continuation sequence.

## Material Idea Intake Rule — September 1, 2026

All material new ideas use one canonical intake/reconciliation pipeline governed by `foundations/idea-intake-reconciliation.md`:

> **Explore → Intake (`PL-*`) → Reconcile Strategy → Reconcile Architecture → Preserve Why → Decompose → Authorize/Implement**

The complete `docs/parking-lot*.md` sequence is the system of record for unresolved idea identity and disposition. GitHub issues, standalone discovery documents, prompts, and conversations may support an idea but do not replace its canonical `PL-*` identity. A Principal decision that an item is next establishes sequencing; it does not bypass reconciliation or design gates.

## Defect Tracking Rule — September 11, 2026

**`docs/bugs/` is the one and only authoritative defect-tracking mechanism for Wheelwright.** Each defect has one durable identity (`BUG-NNN`, sequential, permanent, never reused) → one authoritative record (`docs/bugs/BUG-NNN-*.md`) → one lifecycle. The parking lot / roadmap remain authoritative for ideas, capabilities, discovery, and product direction. Related defects and `PL-*` items may cross-link but are not double-booked as the same authoritative item. Filing a defect does not authorize remediation. Severity describes consequence; priority/sequencing is a separate Principal decision. The governing methodology, record format, lifecycle rules, and classification (`area` / `severity` `S1`–`S4`) live in `docs/bugs/README.md`; the discovery index is `docs/bugs/INDEX.md`.

> **Authority note (knife-edge migration, September 11, 2026):** This **replaces** the September 4, 2026 rule that made GitHub Issues the defect system of record. GitHub Issues are **no longer** a defect registry; new defects must not be filed as Issues, and repository bug records must not be mirrored by parallel defect Issues. Historical defect Issues (#2, #3, #8, #9, #10, #11, #12, #14, #15, #16) were migrated into `BUG-001`–`BUG-010`, preserving their original Issue identity as provenance only. See `docs/bugs/INDEX.md`.

---

## Document Authority Model

Documents are classified by the *type* of authority they carry, not merely by importance. When two documents describe the same concern and conflict, the precedence rule applies.

| Type | Question It Answers | Precedence |
|------|--------------------|-----------:|
| **A. Governing / Current System Definition** | What is Wheelwright now? | 1 (wins all conflicts) |
| **B. Ratified Decision / Accepted Design** | What was decided or designed, and why? | 2 (constrains evolution; yields to A when A has absorbed the consequence) |
| **C. Canonical Project / Operational State** | What is the current state of this project concern? | Scoped — authoritative only for its project/operational concern |
| **D. Reconciliation / Checkpoint Artifact** | How did we arrive at the current state? | Provenance only — never overrides A/B/C |
| **E. Current Specialized Reference** | What does this bounded subsystem or topic look like? | 3 (informative; does not govern outside its scope) |
| **F. Historical / Superseded** | What did we used to think? | None (never governs; learning context only) |

**Precedence rule:** Category A describes what Wheelwright *is*. Category B records what Wheelwright *decided*. Category C records current project/operational state. Category D explains how we arrived here. Category E is bounded reference. Category F is historical provenance.

## Execution-Control Transition — September 17, 2026

`foundations/shared-execution-contract.md` is **suspended as a runtime execution-control mechanism**. Its useful semantic guidance remains available, but actor-readable prose is not proof of consequential execution authority.

For outcome-bearing work, current repository authority, applicable task/experiment state, and the applicable authoritative transition mechanism govern whether a consequential action is permitted. Conversation, technical reasoning, recommendations, prompts, and review dispositions are not authoritative execution state.

`foundations/principal-decision-surface.md` is the ratified human-factors and presentation convention for Principal-facing outcome-bearing replies. Its fixed decision surface makes authority state conspicuous; it does **not** itself grant or enforce authority.

Gate Experiment 001 remains a staged capability-boundary experiment until its durable state says otherwise. Observed BUG-021 conversational-containment failures must not be represented as failure of an activated Gate experiment.

Agent cold-start routing and mandatory reading obligations are maintained in `AGENTS.md` in this directory, reached from the repository-root `AGENTS.md`.

## Product and Architectural Principles Routing — September 27, 2026

`principles.md` is the single canonical register of Wheelwright's ratified enduring principles. Consequential Product work must retrieve and test against applicable ratified **Product Principles**; consequential architecture work must do the same for applicable **Architectural / build** principles; cross-cutting work must check both. Candidate/discovered principle-like statements remain non-authoritative until explicit Principal ratification adds them to the register with provenance.

The register also owns the lightweight meanings of **Solution Overview** (Product/architecture reconciliation of what must become true) and **Solution Design** (technical realization of an accepted Overview). Neither replaces an ADR, and lower-level findings may require upward reconciliation rather than imposing a rigid waterfall.

---

## Reading Paths

### Foundational Reading Path (7 references)

A foundational orientation to the system and its documentation authority. For agents, the seven orientation sources are covered through bounded reading/indexing under the **Minimum Safe Bootstrap** in [AGENTS.md](AGENTS.md#minimum-safe-bootstrap--bounded-orientation), which also owns cold-start routing and additional requirements.

| # | Document | Why |
|---|----------|-----|
| 1 | `docs/README.md` (this file) | Orientation. Document index. Authority model. |
| 2 | `KNOWN-FAILURE-MODES.md` | **Failure checksum. Mistakes Wheelwright has already paid for; do not repeat them.** |
| 3 | `foundations/evidence-appliance.md` | What Wheelwright is. System identity. |
| 4 | `07-architecture-current.md` | Current system. Four Engines. Boundaries. Surfaces. |
| 5 | `07c-adrs.md` | Decisions that constrain changes. ADR-001 through ADR-022 (append-only). |
| 6 | Complete `parking-lot*.md` sequence | What is active, deferred, and resolved. Index all continuations; read matching entries when relevant. |
| 7 | `principles.md` | Canonical register of ratified Product, Architectural/build, and Epistemic principles; candidate boundary and solution-artifact meanings. |

**When this is insufficient:** If you're touching architecture, designing a new subsystem, or need to understand *why* something is the way it is — continue to the comprehensive path.

### Comprehensive Architectural Orientation

Additional architecture references beyond the foundational reading path:

| # | Document | Why |
|---|----------|-----|
| 6 | `foundations/policy-over-prediction.md` | Core design principle governing all recommendation logic |
| 7 | `foundations/principles-governance-model.md` | Principles as architectural entities |
| 8 | `foundations/regime-objective-function.md` | Operating regime (cash-flow production, entry mechanisms) |
| 9 | `foundations/acquisition-scheduler-policy.md` | How the backend acquires evidence (tiered A/B/C/D) |
| 10 | `foundations/backend-behavioral-invariants.md` | 18 ratified invariants the system must satisfy |
| 11 | `foundations/retooling-charter.md` | Migration governance (durable principles, boundaries) |
| 12 | `25-situation-architecture.md` | Accepted direction for multi-situation operation |
| 13 | `31-architectural-reconciliation.md` | Most recent architectural checkpoint |

### Strategic Roadmap / Operating Model

Read these when evaluating strategic direction, proposing a material product capability, or reconciling strategy with architecture:

| Document | Why |
|----------|-----|
| `roadmap.md` | Current Vision → Goals → Bets → Initiatives strategic roadmap |
| `architecture-roadmap.md` | Current structural pressures and intended architectural evolution |
| `foundations/strategy-architecture-reconciliation.md` | Governing method for exploration, reconciliation, and evidence-driven course correction |
| `foundations/idea-intake-reconciliation.md` | Governing pipeline for durable idea identity, strategic/architectural reconciliation, why-state preservation, and implementation decomposition |
| `33-strategy-roadmap-checkpoint.md` | Provenance: how the first roadmap/operating-model baseline was derived and blessed |
| `foundations/roadmap-self-documenting-meta-state.md` | Why the Roadmap operator surface exists: it projects Wheelwright's governed meta-state so freshness is a side effect of doing the work. Read before working on any Roadmap lens. |

### Technology Quality / Day-to-Day Architecture

Read these when designing or reviewing implementation structure, evaluating technology condition, selecting engineering quality controls, planning a technology-optimization intervention, or executing the Principal-mandated quality program:

| Document | Why |
|----------|-----|
| `foundations/technology-quality-constitution-v1.md` | Ratified technology-quality principles, day-to-day architecture practice, operating model, and version-one baseline authorization |
| `technology-quality-program-v1.md` | Principal-ratified and mandated technology-quality program: backlog/journal reconciliation, untouched baseline, balanced scorecard, technology-optimization roadmap, interventions, fitness controls, and steady-state operation |
| `technology-quality-fitness-controls-v1.md` | Ratified fitness-control set: three-layer quality model, strict Sonar profile, ArchUnit invariant mechanism, trend-over-gates principle, and open Principal decisions |

## Complete Document Index

**Navigation only:** Entries identify document authority and purpose, not live acceptance or execution permission. For current milestone and defect disposition, consult the complete parking-lot, journal and bug records. Historical acceptance checkpoints retain their original scope; do not read their snapshot statuses as today's operational state. For v2 work, start with the ratified `principles.md` and `77-api-v2-architectural-guardrails.md`, then the current v2 OAS/Account/Position references and relevant canonical intake.

### A. Governing / Current System Definition

Documents a reader should use to answer: *What is Wheelwright now?* This is a deliberately small set. These win when other documents conflict with them.

| Document | Role |
|----------|------|
| `07-architecture-current.md` | Primary system architecture |
| `07a-component-map-current.md` | Module responsibilities |
| `07b-diagrams.md` | System data-flow diagrams |
| `foundations/evidence-appliance.md` | System identity definition |
| `foundations/policy-over-prediction.md` | Governing principle |
| `foundations/cognitive-role-separation.md` | Governing principle (product surface design) |
| `foundations/principles-governance-model.md` | Governing foundation (principles as domain model) |
| `foundations/secondary-observation.md` | Governing principle (evidence trust) |
| `foundations/state-oriented-console.md` | Governing principle (UI philosophy) |
| `foundations/roadmap-self-documenting-meta-state.md` | Governing concept (why the Roadmap exists: self-documenting project meta-state) |
| `foundations/regime-objective-function.md` | Operating regime definition |
| `foundations/acquisition-scheduler-policy.md` | Current acquisition behavior |

### B. Ratified Decision / Accepted Design

Constrain future evolution. Describe what was decided and why. May be ahead of implementation.

| Document | Substatus |
|----------|-----------|
| `07c-adrs.md` | Ratified architectural decisions (append-only; see current register) |
| `08-adr-backend-evidence-service.md` | Ratified decision (backend extraction) |
| `09-backend-evidence-service-design.md` | Ratified design; §3 and §10 are Historical |
| `09a-backend-diagrams.md` | Ratified design; diagram 6 is Historical |
| `14-background-acquisition-design.md` | Ratified design (acquisition architecture transition) |
| `15-evidence-state-semantics.md` | Design specification (evidence vocabulary) |
| `20-session-aware-acquisition.md` | Ratified design (session gate) |
| `21-write-desk-recomposition.md` | Ratified design (evidence validity model) |
| `22-sqlite-persistence-design.md` | Approved design (persistence schema) |
| `23-calls-architecture.md` | Active design (Horizon A implemented, Horizon B in progress) |
| `24-cloud-deployment.md` | Accepted direction |
| `25-situation-architecture.md` | Accepted direction (Bridge Income first target) |
| `26-operator-console-architecture.md` | Active design (partially implemented) |
| `foundations/retooling-charter.md` | Ratified migration governance |
| `foundations/backend-behavioral-invariants.md` | Ratified invariant catalog |
| `foundations/closed-loop-engineering.md` | Ratified methodology |
| `foundations/shared-execution-contract.md` | Historical execution semantics; runtime control suspended; compatibility bridge only |
| `foundations/principal-decision-surface.md` | Ratified Principal-facing decision format; does not grant execution authority |
| `foundations/options-domain-competence-contract.md` | Ratified options-domain competence methodology |
| `discovery/pass-zero-v1-class-geometry-method-2026-10-01.md` | Principal-adopted Pass 0 research method; no specimen eligibility decision |
| `foundations/three-actor-model.md` | Ratified methodology |
| `foundations/architectural-evolution-methodology.md` | Ratified methodology |
| `foundations/strategy-architecture-reconciliation.md` | Ratified strategy/architecture reconciliation method |
| `foundations/idea-intake-reconciliation.md` | Ratified material-idea intake and reconciliation pipeline |
| `foundations/technology-quality-constitution-v1.md` | Ratified engineering-quality and architecture practice |
| `foundations/multi-actor-repeatability-temporal-synchronization.md` | Ratified actor synchronization and scoped execution methodology |
| `foundations/death-spiral-avoidance-protocol.md` | Ratified repeat-work and escalation discipline |
| `foundations/conditioned-operating-opportunity.md` | Accepted direction (partially realized) |
| `67-unresolved-predicate-resolution-model-architecture-reconciliation-2026-09-26.md` | Ratified bounded `UNRESOLVED` predicate semantics (ADR-021) |
| `69-assignment-centric-wheel-v1-operating-program.md` | Ratified first Wheel Operating Program/configuration |
| `77-api-v2-architectural-guardrails.md` | Ratified API v2 authority, OAS, security, evidence and acquisition/read boundaries |
| `contracts/api-v2-held-quotes-read.md` | Ratified held-quote discovery and pure-read contract |
| `contracts/api-v2-subject-show-held-quote.md` | Ratified held-quote inspection and query contract; see source for amendment history |
| `cli/ww-ls-acceptance-2026-10-05.md` | October 5 held-quote CLI verification and Principal acceptance evidence |
| `07c-adrs.md` — ADR-022 | Bounded opening-anchored short-option continuity precedent; see decision for scope |
| `bootstrap/end-of-session-protocol.md` | Ratified methodology (containing session-closeout process; canonical invocation: “execute end of session protocol”) |
| `bootstrap/project-memory-protocol.md` | Ratified methodology (documentation diligence / project memory) |
| `foundations/parking-lot-continuation-governance.md` | Ratified methodology (one logical parking lot across physical continuation files) |
| `bugs/README.md` | Ratified methodology (repository-native defect tracking: `BUG-NNN` identity, record format, lifecycle — the sole defect system of record) |

### C. Canonical Project / Operational State

Authoritative for their specific project concern. Not system-definition documents.

| Document | Domain |
|----------|--------|
| `principles.md` | Canonical register of ratified Product, architectural/build and epistemic principles, including backend authority |
| `roadmap.md` | Current strategic roadmap (Vision → Goals → Bets → Initiatives) |
| `architecture-roadmap.md` | Current architecture-roadmap pressure and intended structural evolution |
| `technology-quality-program-v1.md` | Principal-ratified and mandated technology-quality program state and execution plan |
| `technology-quality-fitness-controls-v1.md` | Ratified fitness-control set: three-layer quality model, strict Sonar profile, ArchUnit invariant mechanism, trend-over-gates principle |
| `parking-lot.md` + numbered continuations | One canonical backlog and material-idea intake registry expressed across physical pages |
| `journal/project-journal.md` + numbered continuations (`-2`, `-3`, `-4`, …) | One canonical chronology expressed across physical continuation files |
| `bugs/INDEX.md` + `bugs/BUG-*.md` records | The one canonical defect corpus and discovery index (`BUG-NNN` records) — sole defect system of record |
| `contracts/evidence-snapshot-v1.md` | Frozen v1 snapshot contract; v1 Web remains operational |

### D. Reconciliation / Checkpoint Artifacts

Durable evidence of how we arrived at the current state. A checkpoint is not automatically ratified; any ratified consequence belongs in A/B/C rather than being continuously synthesized from provenance.

| Document | Role |
|----------|------|
| `30-architectural-baseline-inventory.md` | Extracted baseline checkpoint (August 2026) |
| `31-architectural-reconciliation.md` | Ratified reconciliation record |
| `32-parking-lot-reconciliation.md` | Ratified parking-lot disposition record |
| `33-strategy-roadmap-checkpoint.md` | Ratified roadmap/operating-model baseline and normalization provenance (August 31, 2026) |
| `70-bounded-option-obligation-continuity-checkpoint-2026-09-28.md` | Actual History evidence, rejected series-key claim, synthesis/falsification trail, ADR-022 ratification provenance, and independently rejected unratified Solution Design candidate; exact read-only resume state |
| `74-pl-cli-bare-fetch-experimental-acceptance-2026-10-04.md` | Historical bare-fetch experiment acceptance; not a production default |
| `78-api-v2-design-implementation-handoff-checkpoint-2026-10-05.md` | Historical v2 design/implementation handoff and candidate principles |
| `79-api-v2-direct-quote-reject-invariant-reconciliation-2026-10-05.md` | Rejected quote candidate and corrective invariant evidence; no retry authority |
| `80-v2-question-driven-lifecycle-product-architecture-milestone-2026-10-06.md` | V2 lifecycle Product/architecture discovery; no implementation authority |
| `81-v2-operator-journey-action-surface-discovery-checkpoint-2026-10-06.md` | Operator-journey discovery and unresolved management semantics |
| `72-pl-cli-bare-fetch-pre-implementation-checkpoint-2026-10-04.md` | Historical bare-fetch implementation checkpoint |
| `foundations/step4-conformance-assessment.md` | Retooling conformance checkpoint |

### E. Current Specialized Reference

For currently accepted v2 behavior, consult the v2 OAS and implementation-linked CLI references below. An October 5 candidate's historical status does not supersede later Principal acceptance; check canonical closeout records for the latest disposition.

Useful and correct within their bounded subject. Non-governing outside that scope.

| Document | Subject |
|----------|---------|
| `cli/tt-live-panel.md` | Qualified Principal-accepted TT Live economic-state baseline; experimental movement/provisional stop semantics excluded |
| `design/tt-live-economic-story/README.md` | Current economic-state visual contract, acceptance scope, evidence/unknowns, specimens, open investigations and WW reuse boundary |
| `design/ww-position-scan-v2-capability-gaps-2026-10-13.md` | Unaccepted fresh WW Position capability checkpoint; runtime draft now inactive recovery material |
| `design/ww-show-positions-v2-architectural-proposal-2026-10-13.md` | Revised WW Position v2 proposal awaiting Principal architectural review; no implementation acceptance |
| `design/ww-position-scan-draft-recovery-2026-10-14/README.md` | Inactive orphaned draft source patch, reconstruction/hash evidence and cleanup disposition |
| `cli/ww-man.txt` | Current top-level `ww` command reference and terminal conventions |
| `cli/ww-show-man.txt` | Current `ww show` command reference (quotes and Positions) |
| `cli/ww-account-evidence.md` | Fidelity Account sync and Position evidence operator reference; later multi-broker acceptance is recorded separately |
| `contracts/api-v2-account-evidence.json` | Current v2 Account, User, artifact and Position OpenAPI fragment |
| `cli/ww-show-query-acceptance-2026-10-05.md` | Held-quote query/table verification and accepted visual amendments |
| `cli/ww-show-acceptance-2026-10-05.md` | Historical held-quote candidate verification; check later closeout for current acceptance |
| `cli/ww-fetch-man.txt` | Current v2-native explicit-symbol and backend-selected default `ww fetch(1)` behavior, ORDINARY/FORCE intent, Bearer configuration, and truthful fulfillment; available through `ww fetch --man` |
| `cli/ww-sync-man.txt` | Current authorized Account synchronization and retained transaction update reference |
| `cli/ww-pull-man.txt` | Current routine update workflow, Git-style report, ordering and partial-failure status |
| `cli/ww-history-man.txt` | Current Account-scoped/all-authorized transaction history and table/TSV/CSV/JSONL reference |
| `cli/ww-fetch-acceptance-2026-10-04.md` | Bounded deterministic and real-backend `ww fetch` acceptance evidence; candidate, not Product acceptance |
| `cli/ww-composition-friction-acceptance.md` | **Explicit CF01–CF12 composition-friction acceptance specimens**: numeric sort, cut, awk, state counts, grep/rg, tee, head, command substitution, redirection, absence semantics, explicit rich serialization, and no generic-utility reinvention; records correctness separately from adapter friction so actors do not infer the Unix gauntlet |
| `cli/ww-prices-man.txt` | Current read-only `ww prices(1)` behavior and evidence limits; available through `ww prices --man` |
| `cli/ww-sort-man.txt` | Current bounded record-preserving `ww sort(1)` behavior; available through `ww sort --man` |
| `01-environment.md` | Development environment contract |
| `foundations/options-domain-reference.md` | **Options domain reference** — durable operational options economics (economic model, lifecycle/structure matrices, semantic specimens, focused depth, external grounding). Companion to the Category B options competence contract; authoritative for externally-grounded mechanics, non-authoritative for policy. `02-domain.md` is subordinate to it for lifecycle economics. |
| `discovery/pass-one-specimen-selection-bounded-pilot-2026-10-01.md` | Bounded Tradier contrast pilot testing specimen inputs and exact-root geometry; exploratory evidence, no specimen rule |
| `discovery/pass-one-coordinate-history-comparison-2026-10-01.md` | Predeclared price-relative versus RV20/40/60 specimen-coordinate comparison across two expirations; exploratory evidence, no selector rule |
| `cli/ww-bare-fetch-experiment-2026-10-04.md` | Historical bare-fetch experiment; not a ratified default |
| `02-domain.md` | **Early-slice mixed domain-knowledge / calculation / data-contract artifact** (historically named “domain”; not the canonical integrated Wheelwright domain model). Subordinate to `foundations/options-domain-reference.md` for options lifecycle economics; A-5 "held to expiration / no early close" is superseded by shipped BTS/HOLD-CLOSE behavior. |
| `58-wheelwright-semantic-model-v1.md` | **Wheelwright Semantic Model v1.4 draft** — bounded Category E integration/review target for ontology + operational domain-model semantics (identity/scope, portfolio topology, state/event/transition/program, assertions/authority/provenance, time, intent/policy, Alternatives/consequences, capability/executability, decision semantics, accounting relationships). Canonical intake `PL-SEM-01`; not ratified architecture or implementation authority. |
| `73-bare-fetch-architecture-api-bug-survey-2026-10-04.md` | **Bare `ww fetch` architecture / API / bug survey** — companion to the `PL-CLI-01` bare-fetch experiment; classifies findings into architecture/authority gaps, API/capability gaps, and demonstrated bugs/contract defects, each with evidence and smallest correction. Investigative reference, not defect authority (defects belong in `docs/bugs/`). |
| `75-pl-api-02-http-boundary-classification-2026-10-05.md` | **PL-API-02 HTTP boundary classification** — read-only survey of all 30 backend HTTP handlers (Java return type, actual response shape, serialization mechanism, tests, reason for weak typing, classification contract-required / justified / incidental debt / uncertain / already-typed, and observable-semantics impact). Establishes that weak typing is heterogeneous (four legitimate representation patterns), not one defect; preserves the `POST /api/evidence/observe` omitted/`[]`/present request contract and the absence-vs-null uncertain endpoints. Input to `PL-API-02` reconciliation; not OAS design, not implementation authority. |
| `76-ww-fetch-api-v2-investigation-snapshot-2026-10-05.md` | **`ww fetch` / API v2 investigation snapshot** — 14-symbol acquisition measurements, v1 boundary findings, Principal-selected fetch and canonical direct-quote semantics, initial configurable session-aware quote-reuse policy, and Principal-selected first subject-scoped direct-quote capability boundary. Product authority is under `PL-CLI-01` and `PL-API-03`. |
| `contracts/api-v2-direct-quote-acquisition-proposal.md` and `.yaml` | **Ratified POST direct-quote acquisition contract and authoritative common v2 OAS** — accepted quote semantics unchanged; OAS additionally references implemented account evidence and Position capabilities. Historical filenames retained. |
| `cli/tradier-market-data-capabilities-2026-10-05.md` | **Tradier capability sheet** — concise official-provider inventory of quote, option quote, expiration, chain, timesales, clock, calendar, and option-symbol lookup units and batching; input to `PL-API-03`, not Product or implementation authority. |
| `59-practitioner-strategy-semantic-falsification-2026-09-24.md` | **Practitioner-strategy semantic falsification corpus** — Category E pressure test of Semantic Model v1.3/v1.4 against 11 conventional strategy treatments; establishes source metadata, preserves claim/evidence classes, rejects a universal `Strategy` type, and introduces provisional Scenario / Market Thesis pressure without authorizing implementation. |
| `60-scenario-market-thesis-adversarial-specimens-2026-09-24.md` | **Scenario / Market Thesis adversarial specimens** — resolves practitioner-corpus refinement pressure across covered-call, CSP, long-straddle, iron-condor, and calendar specimens; treats thesis as an optional governed Assertion family rather than durable entity, Intent, or strategy identity. |
| `61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md` | **Inner Game / Governed Prescriptive Decision Discipline** — Category E high-resolution capture and intake reconciliation under `PL-DEC-BEH`; preserves the GDXJ and PTS/Sawdust specimens, locked decision-journey semantic spine, practitioner heuristic inventory, process-change/departure distinction, cognitive-load thesis, sell-side-bias falsification question, contrastive specimen method, roadmap mapping, and explicit non-goals. Not implementation authority. |
| `10-backend-implementation-preferences.md` | Technology choices (adopted) |
| `17-recommendation-funnel-analysis.md` | Funnel behavior explanation |
| `18-recommendation-vocabulary-review.md` | Vocabulary dimensional analysis |
| `19-funnel-architecture.md` | Funnel stage documentation |
| `41-operator-intent-evidence-age-intake.md` | Supporting discovery record for canonical intake `PL-EVID-AGE`; not a parallel backlog |
| `foundations/market-priced-risk.md` | Exploratory research topic |
| `foundations/recommendation-set-analysis.md` | Exploratory architectural concept |
| `foundations/strategy-expansion-governance.md` | Exploratory strategy scope boundary and evaluation framework |
| `bootstrap/chatgpt-cold-start.md` | AI actor cold-start instructions (ChatGPT reasoning partner) |
| `bootstrap/kiro-cold-start.md` | AI actor cold-start instructions (Kiro implementation partner) |
| `bootstrap/codex-cold-start.md` | AI actor cold-start instructions (Codex independent reviewer/falsifier) |
| `development-machine.md` | Hardware spec |
| `velvet-rope/*` | Universe admission domain model (dormant) |
| `universe/*` | Candidate universe design (dormant) |
| `engineering-spikes/*` | API feasibility assessments |
| `design/pl-cli-01-historical-position-candidate.md` | Accepted historical Position catalog/selection, compact CLI, verification/deployment/recovery and provenance of the later bounded Portfolio Capital delivery |
| `design/pl-cli-01-portfolio-capital-history.md` | Principal-accepted isolated PTS Portfolio Capital Unicode graph: retained source coverage, 44 composites/29 gaps, public read/Unix composition, frozen verification and unperformed deployment |
| `design/ww-history-product-and-technical-proposal-2026-10-15.md` | Revised Account-nested transaction history proposal: one scoped history grant, bounded backend read-through, essential/deferred scope, seven-item review disposition and complete sanitized 21-record design specimens; approved checkpoint and implementation candidate are linked separately |
| `design/ww-history-candidate-2026-10-15/README.md` | Historical transaction-history component verification; subsequent integrated operational delivery and Principal acceptance are recorded in the update/history delivery below. |
| `design/ww-integrated-update-candidate-2026-10-15/README.md` | Principal-accepted installed `ww pull && ww history`: ordered synchronization/backend subject selection/acquisition, scoped history, verification, operational recovery and closeout limits |
| `design/pl-conv-01-step5-candidate.md` | Accepted/deployed API-first tastytrade holdings R2; independent verification, Principal functional/visual acceptance and recovery provenance |
| `design/pl-conv-01-step3-candidate.md` | Accepted multi-broker Account and BUG-035 delivery, recovery and closeout evidence |
| `design/ww-show-held-quote-solution-design.md` | Bounded Solution Design for multi-subject show/local field discovery and the authorized collection/filter/order/horizontal-table extension (§15); accepted reversible path-symbol codec preserved; linked verification evidence. |
| `design/ww-show-held-quote-transport-reconciliation.md` | Bounded HTTP/OAS reconciliation: unchanged instance-resource route with a canonical reversible path-symbol codec, unchanged container/old operations, exact additive OAS delta and passing accepted-implementation transport preservation proof. |
| `research/partial-collar-test1/` | Principal-commissioned Partial Collar Protected Growth Test 1 research harness, candidate state resolutions, IWM/RVX provenance, matrix/chronology/stress/cost evidence and falsification report under `PL-STRAT-01`; no strategy admission, options pricing or live execution authority. |
| `research/eva-001/` | EVA-001 bounded historical-data feasibility audit, draft expected-value experimental protocol and Principal-relayed Muse research assignment under `PL-EVID-04`; data sufficiency unresolved, no backtest or production implementation commissioned. |
| `discovery/*` | Design notes and vocabulary exploration |
| `reference-data/*` | Real options chain fixture |

### F. Historical / Superseded

Retained for project memory. Never governs. Each carries an inline `⚠️ HISTORICAL` marker with successor pointer.

| Document | Superseded By |
|----------|---------------|
| `00-project-charter.md` | `foundations/evidence-appliance.md` + `07-architecture-current.md` |
| `03-requirements.md` | Write Desk (requirements not separately documented) |
| `04-architecture.md` | `07-architecture-current.md` |
| `05-design.md` | Current implementation |
| `05a-component-map.md` | `07a-component-map-current.md` |
| `06-tasks.md` | Completed |
| `07d-obsolete-docs.md` | Reconciliation docs 30–32 |
| `09b-migration-and-impact.md` | Java retooling superseded this |
| `11-parking-lot-reconciliation.md` | `32-parking-lot-reconciliation.md` |
| `12-backend-thin-slice-proposal.md` | Full Java backend |
| `13-proxy-efficiency-analysis.md` | Proxy retired |
| `16-bootstrap-throughput-design.md` | Problem resolved |
| `16a-bootstrap-throughput-completion.md` | Completed |

---

## Document Status Conventions

Use explicit status markers. Avoid relying on file age or numbering to infer authority.

- **Governing / Current System Definition** — Category A
- **Ratified Decision / Accepted Design** — Category B
- **Canonical Project / Operational State** — Category C
- **Reconciliation / Checkpoint Artifact** — Category D
- **Current Specialized Reference** — Category E
- **Historical / Superseded** — Category F
