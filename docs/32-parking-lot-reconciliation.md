# Parking-Lot Reconciliation

**Purpose:** Test every active parking-lot item against the ratified architectural reconciliation (`docs/31-architectural-reconciliation.md`). Determine what the backlog actually is.

**Governing frame:** `docs/31-architectural-reconciliation.md` (ratified August 2026)
**Source:** `docs/parking-lot.md` (last reviewed July 26, 2026)
**Date:** August 11, 2026
**Status:** Amended per Principal review — awaiting ratification

---

## Source Integrity Note

The parking-lot source contains 44 semantic items, but only 42 appear within the formal Active Items taxonomy tables. Two additional items appear after the "Historical Context" heading:

- A row labeled `PL-ARCH-01` with content "Client-Local Recommendation State" — this **collides** with the formal PL-ARCH-01 (Instrument Governance). It is a distinct concern about recommendation reproducibility/durability.
- `PL-GOV-01` "Governance Catalog Coverage Gap" — correctly identified but positioned outside the formal taxonomy.

The duplicate `PL-ARCH-01` ID is a parking-lot drift defect. For this reconciliation, the recommendation-state concern is referenced as **PL-REC-STATE** (temporary reconciliation identity) to avoid confusion. When parking-lot.md is rewritten, this item must receive a proper unique ID.

---

## Disposition Key

| Disposition | Definition |
|-------------|-----------|
| **Retain** | Still valid substantially as written |
| **Reframe** | Concern is valid but current articulation is wrong or too narrow |
| **Merge** | Concern survives but belongs with another item |
| **Supersede** | Newer architecture/discovery has absorbed it; the historical container closes |
| **Promote** | No longer backlog; graduated to architecture, invariant, or accepted direction |
| **Delete** | No longer represents a real requirement |

---

## Complete Inventory and Dispositions

### Architecture

#### PL-ARCH-01: Instrument Governance

**Disposition: Retain.** Per-instrument authorized operating modes beyond binary admission. Valid, low urgency. Sits within the Governance capability family. Relevant when governance matures beyond current heuristic + catalog.

---

#### PL-ARCH-02: Overlay Policy

**Disposition: Reframe.** The concern is valid but the framing is too implementation-specific. The real question: "How does the system support portfolio-level deployment strategy (temporal distribution, concentration, lifecycle management) as distinct from per-contract selection?" This is a Situation/Mission concern.

**Reframed as:** "Situation-governed portfolio deployment strategy — temporal distribution, concentration limits, lifecycle management (roll/take-profit/hold), rung renewal cadence."

---

#### PL-ARCH-03: Security and User Accounts

**Disposition: Retain.** Still valid, still deferred, correctly sequenced after cloud deployment (PL-OPS-01).

---

#### PL-ARCH-04: Policy-Governance Scaling

**Disposition: Merge → PL-POL-04.** Same concern as Recommendation Policy Evolution: how does policy remain versioned, attributable, inspectable, testable at scale? One item, not two.

---

#### PL-ARCH-05: Cache-Based Recommendation Trigger

**Disposition: Reframe.** The concern is valid but articulation is implementation-specific ("forced ETag reset"). Reconciled framing: "Application-state changes (portfolio update, policy change, pending intent) trigger recommendation recomputation independently of evidence acquisition cycles." This is a reactive-state concern within the Application Shell.

---

#### PL-ARCH-06: Recommendation Engine Ownership

**Disposition: Retain.** Genuine unresolved architectural question (baseline §10, question #1). The reconciliation confirmed the architecture accommodates either placement. Dead-pipeline risk (PL-OPS-06) and Deployment Opportunity composition both add pressure but do not force the answer.

---

### UX / Operator Experience

#### PL-UX-01: State-Oriented Operator Console

**Disposition: Reframe.** The item conflates concerns with different owners:
- Decision Pressure → Console-owned ADR-013 implementation work
- Situation rendering → Application Shell cross-cutting context
- NAV/mission progress → blocked on historical NAV acquisition (unresolved dependency)
- Action transitions → Application Shell navigation (F-19)

**Reframed as:** "Console: implement Decision Pressure (ADR-013 dim 2). Other items migrated to Application Shell or blocked."

---

#### PL-UX-02: Put/Call Desk Asymmetry

**Disposition: Reframe.** The desk-topology question ("separate desks?") is superseded by Deployment Opportunity. But the deeper asymmetry question survives: puts, covered calls, and buy-writes have different evidence, economics, consequence math, collateral, ranking, and explanation requirements even within a unified operator workflow.

**Reframed as:** "Strategy-specific semantics within unified Deployment — determine which evidence, consequence math, ranking, explanation, and interaction patterns remain specific to each deployment mechanism while preserving one unified operator workflow."

**Superseded portion:** The old "should we have separate desks?" topology question.

---

#### PL-UX-03: Evidence Freshness and Provenance Language

**Disposition: Reframe.** Valid concern but no longer standalone — it's part of the Application Shell's responsibility to present evidence/session state consistently across all surfaces. Becomes a sub-concern within Application Coherence.

---

#### PL-UX-04: Progressive Treemap Health Hydration

**Disposition: Retain.** Valid Console implementation work. Low architectural significance.

---

### Calls

#### PL-CALL-01: Calls Horizon B

**Disposition: Supersede (historical container).** Most of Horizon B has delivered. The unfinished pieces have specific homes in the mature architecture:
- Existing-position PCS entry point → PL-EVID-03 (Conditioned Operating Opportunity, entry point 2)
- Appreciation/consequence geometry → Economic Consequence / Explanation (ADR-013 dim 3)
- Call execution handoff → Broker Handoff extension (PL-EXEC-01)

Close the historical Horizon B container. Its children are mapped.

---

#### PL-CALL-02: Calls Horizon C

**Disposition: Supersede (historical container).** This umbrella has been overtaken by architecture. Its components already have canonical homes:
- Historical lifecycle linkage → PL-EVID-01/02 (Historical Analysis)
- Independent call discovery → Deployment Opportunity / Buy-Write mechanism
- Longitudinal intelligence → Level 3 learned model (Regime Objective Function, far future)
- User-specific state → PL-ARCH-03 (multi-user, far future)
- Lifecycle quality in ranking → PL-EVID-02 (Lifecycle Assessment)

Explicit mappings preserve the learning without preserving obsolete decomposition.

---

#### PL-CALL-03: Familiarity vs Favorites

**Disposition: Retain.** Valid conceptual distinction. Both depend on capabilities that don't exist yet (historical evidence, user accounts). Low urgency.

---

#### PL-CALL-04: Call Inventory and Eligibility Observability

**Disposition: Reframe.** The concern is real but broader than calls. Held shares, encumbered shares, free shares, executable contracts, collateral, available cash, and exclusion reasons are part of: Portfolio Context → Deployment eligibility → Explanation. The operator needs to understand "why is this action available or unavailable?" across all deployment mechanisms.

**Reframed as:** "Deployment Eligibility / Capacity Explanation — transparency of why actions are available or unavailable. Call inventory observability is one concrete case of this general capability."

---

#### PL-CALL-05: Buy-Write Recommendation Board

**Disposition: Promote (concept, not topology).** What is architecturally validated: buy-write as a legitimate deployment mechanism within the Decision domain (F-09, F-15). What is NOT promoted: a permanent standalone Buy-Write Board as product topology. The board is current implementation; the unified Deployment surface may absorb it.

**Promoted as:** "Buy-Write Deployment Mechanism — accepted architectural direction. Implementation work occurs within Deployment Opportunity."

---

### Capital Deployment

#### PL-DEPLOY-01: Unified Capital Deployment Surface

**Disposition: Promote (direction); retain (implementation work).** The concept is accepted architectural direction (reconciliation Synthesis 2, F-13). What remains as backlog:
- Normalized opportunity representation
- Cross-strategy comparability model
- Generalized capital/collateral semantics
- "Wait" as explicit recommendation semantics
- Unified Deployment surface design

Promotion must not make the implementation work disappear.

**Promoted concept:** "Deployment Opportunity — domain/composition concept within Decision. Multiple strategy mechanisms serving one mission."

**Retained implementation:** Design and build the unified surface.

---

#### PL-DEPLOY-02: Opportunity Surface Observation

**Disposition: Retain.** Valid concern. Unresolved architectural ownership (per reconciliation D-04 amendment). Depends on Historical Analysis architecture and likely cloud deployment.

---

#### PL-DEPLOY-03: Cross-Entry Multi-Path Opportunity Awareness

**Disposition: Supersede.** Emergent property of running multiple recommendation paths (F-10). Current implementation already handles it. The observation has graduated into the Deployment Opportunity model as a semantic property: the same underlying may produce multiple distinct economic actions.

---

### Evidence and Research

#### PL-EVID-01: Historical Analysis and Evidence Provenance

**Disposition: Retain.** Foundational dependency for multiple items. One of the largest unresolved architectural dependencies. Urgency increases as operational history accumulates without capture.

---

#### PL-EVID-02: Lifecycle Assessment Evidence Domain

**Disposition: Retain (absorbs PL-EVID-06).** Valid. Partially implemented (PCS entry point 1). Full realization depends on historical evidence. The score-vs-classification question (PL-EVID-06) is a design sub-question resolved when this is designed.

---

#### PL-EVID-03: Conditioned Operating Opportunity

**Disposition: Retain.** Entry point 2 (existing-position) is clearly scoped implementation work. Also receives the "existing-put PCS" child from retired PL-CALL-01.

---

#### PL-EVID-04: Market-Priced Risk

**Disposition: Retain.** Valid research direction. Blocked on IV data source.

---

#### PL-EVID-05: Recommendation Set Analysis

**Disposition: Retain.** Valid concept. Blocked on enrichment data.

---

#### PL-EVID-06: Score vs Classification

**Disposition: Merge → PL-EVID-02.** Design sub-question of lifecycle assessment.

---

### Portfolio

#### PL-PORT-01: Portfolio-State Maturity

**Disposition: Retain.** Valid progressive maturation. Multi-account depends on PL-ARCH-03.

---

#### PL-PORT-02: Portfolio Production Accounting

**Disposition: Retain.** Valid remaining implementation tasks for the Production surface.

---

### Execution

#### PL-EXEC-01: Write Intent and Trade Lifecycle Evolution

**Disposition: Retain.** Valid, growing importance. Also receives "call execution handoff" child from retired PL-CALL-01.

---

### Operations

#### PL-OPS-01: Cloud Deployment

**Disposition: Retain.** Valid infrastructure prerequisite.

---

#### PL-OPS-02: Post-Retooling Craftsmanship Review

**Disposition: Supersede into active holistic cleanup.** The trigger has arrived. The current holistic Wheelwright cleanup IS the moment this item anticipated, with expanded scope: structural cleanup, dead code, naming, duplication, stale route topology, architectural conformance, documentation/code alignment. This is no longer a future parked item — it is the active work.

---

#### PL-OPS-04: Notification and Background Awareness

**Disposition: Retain.** Valid, far-future, gated behind cloud deployment.

---

#### PL-OPS-05: ADR Coverage Review

**Disposition: Merge → Documentation Topology cleanup.** The reconciliation exposed a broader documentation-authority problem (charter authority, architecture-current, foundations, ADRs, historical vs current, Lab-era documents). ADR coverage is one workstream inside that broader reconciliation, not a standalone review.

---

#### PL-OPS-06: Dead Recommendation Pipeline Retirement

**Disposition: Retain (elevated relevance).** Dead pipelines are conformance/technical-debt work resulting from architecture. The architecture says recommendation semantics must not drift and Labs should retire — therefore remove dead duplicates. But "remove these dead functions" is implementation work, not architectural principle. Retains as active cleanup work with high relevance, not a promoted architectural concept.

---

#### PL-OPS-07: Retire WriteDesk / write-desk / wd-* Vocabulary

**Disposition: Reframe.** The prescribed mechanical migration (wd-* → ww-*, WriteDesk.tsx → Wheelwright.tsx) may already be stale. Wheelwright is the whole application; the old Write Desk functionality is evolving toward a Deployment surface. Do not perform a giant rename before the target module/surface structure is decided.

**Reframed as:** "Retire obsolete Write Desk vocabulary as part of Application Shell / Deployment restructuring. Not a standalone mechanical rename."

---

### Policy

#### PL-POL-01: Cash-Flow-Safe Recovery

**Disposition: Retain.** Valid exploratory seed for a future situation.

---

#### PL-POL-02: Monthly Production Regime

**Disposition: Promote.** This parking-lot seed graduated into accepted architecture: Regime Objective Function, Situation/Mission, Bridge Income, monthly production as mission constraint. This is what Promote means — the concept matured into architecture rather than merely being swallowed by something newer.

**Promoted into:** `25-situation-architecture.md` §Bridge Income, `foundations/regime-objective-function.md`.

---

#### PL-POL-03: Portfolio Optimization Layer

**Disposition: Supersede.** The speculative optimization tier is not needed. Situation/Mission + Decision + Deployment Opportunity provide the cleaner composition. Do not preserve a hypothetical layer without evidence it is needed.

**Superseded by:** Situation Architecture + Deployment Opportunity concept.

---

#### PL-POL-04: Recommendation Policy Evolution

**Disposition: Retain (absorbs PL-ARCH-04).** Valid. Grows in importance as situation-specific parameters, per-instrument governance, and overlay rules accumulate.

---

### Research / Discovery

#### PL-RESEARCH-01: Universe Discovery

**Disposition: Retain.** Valid future capability. Spikes retired integration risk. Needs paid provider.

---

#### PL-RESEARCH-02: Velvet Rope Evolution

**Disposition: Reframe (dissolve Lab container).** Velvet Rope was the Lab where we learned governance. The Lab framing retires. Surviving governance capabilities migrate into the Governance capability family:
- Batch evaluation → automatic governance (cross-cutting policy)
- Stale detection → governance freshness/maintenance
- Operator overrides, audit, comparison → governance operator expression (unresolved)

**Reframed as:** Surviving capabilities distributed into the Governance family. "Velvet Rope" retires as a canonical product/backlog container.

---

#### PL-RESEARCH-03: Scenario Replay

**Disposition: Reframe.** Engineering research instrument retained behind subordinate boundary. Not a product surface.

---

#### PL-RESEARCH-04: Instrument Catalog Evolution

**Disposition: Retain.** Valid. Enrichment prerequisite for set analysis and richer governance. Part of the Governance golden-data family.

---

### API

#### PL-API-01: API Testability and Cacheability

**Disposition: Promote (principles graduated).** Deterministic semantics, explicit contracts, cache-friendly reads, ETags, and read/write separation have become architectural characteristics of Wheelwright (INV-PUB-01 through INV-PUB-05, snapshot contract v1). The principles graduated. If future APIs need contracts, that's part of their design — not a standalone backlog item.

**Promoted into:** Publication invariants, `contracts/evidence-snapshot-v1.md`.

---

### Standalone Items

#### PL-GOV-01: Governance Catalog Coverage Gap

**Disposition: Retain.** Valid correctness defect in golden data. Part of the Governance correctness family.

---

#### PL-REC-STATE (formerly unlabeled duplicate PL-ARCH-01): Client-Local Recommendation State

**Disposition: Merge → PL-ARCH-06 + PL-DEPLOY-02.** The "recommendations are transient" smell is a symptom of: (1) recommendation engine's transitional browser placement (PL-ARCH-06), and (2) absence of historical recommendation observation (PL-DEPLOY-02). Resolving either addresses this.

---

## Corrected Summary of Dispositions

| ID | Name | Disposition | Notes |
|----|------|-------------|-------|
| PL-ARCH-01 | Instrument Governance | **Retain** | Governance family: policy |
| PL-ARCH-02 | Overlay Policy | **Reframe** | → Situation-governed deployment strategy |
| PL-ARCH-03 | Security and User Accounts | **Retain** | Gated behind cloud deployment |
| PL-ARCH-04 | Policy-Governance Scaling | **Merge** | → into PL-POL-04 |
| PL-ARCH-05 | Cache-Based Recommendation Trigger | **Reframe** | → Application Shell reactive-state |
| PL-ARCH-06 | Recommendation Engine Ownership | **Retain** | Genuine Principal decision |
| PL-UX-01 | Operator Console (remaining) | **Reframe** | → Console owns Decision Pressure only |
| PL-UX-02 | Put/Call Desk Asymmetry | **Reframe** | Topology superseded; strategy-specific semantics survive |
| PL-UX-03 | Evidence Freshness Language | **Reframe** | → Application Shell sub-concern |
| PL-UX-04 | Progressive Treemap Hydration | **Retain** | Console implementation work |
| PL-CALL-01 | Calls Horizon B | **Supersede** | Close container; map children to homes |
| PL-CALL-02 | Calls Horizon C | **Supersede** | Close container; map children to homes |
| PL-CALL-03 | Familiarity vs Favorites | **Retain** | Far future, valid distinction |
| PL-CALL-04 | Call Eligibility Observability | **Reframe** | → Deployment Eligibility / Capacity Explanation |
| PL-CALL-05 | Buy-Write Board | **Promote** | → Buy-Write Deployment Mechanism (concept, not Board topology) |
| PL-DEPLOY-01 | Unified Deployment Surface | **Promote** | → Deployment Opportunity direction + retained implementation work |
| PL-DEPLOY-02 | Opportunity Surface Observation | **Retain** | Unresolved ownership; history architecture dependency |
| PL-DEPLOY-03 | Cross-Entry Multi-Path | **Supersede** | → Emergent property within Deployment Opportunity |
| PL-EVID-01 | Historical Analysis | **Retain** | Foundational unresolved dependency |
| PL-EVID-02 | Lifecycle Assessment | **Retain** | Absorbs PL-EVID-06 |
| PL-EVID-03 | Conditioned Operating Opportunity | **Retain** | EP2 implementation + receives PL-CALL-01 child |
| PL-EVID-04 | Market-Priced Risk | **Retain** | Blocked on IV data source |
| PL-EVID-05 | Recommendation Set Analysis | **Retain** | Blocked on enrichment data |
| PL-EVID-06 | Score vs Classification | **Merge** | → into PL-EVID-02 |
| PL-PORT-01 | Portfolio-State Maturity | **Retain** | Progressive maturation |
| PL-PORT-02 | Production Accounting | **Retain** | Remaining implementation tasks |
| PL-EXEC-01 | Trade Lifecycle Evolution | **Retain** | Growing importance; receives PL-CALL-01 child |
| PL-OPS-01 | Cloud Deployment | **Retain** | Infrastructure prerequisite |
| PL-OPS-02 | Craftsmanship Review | **Supersede** | → absorbed into active holistic cleanup |
| PL-OPS-04 | Notification/Background | **Retain** | Far future, gated |
| PL-OPS-05 | ADR Coverage Review | **Merge** | → Documentation Topology cleanup |
| PL-OPS-06 | Dead Pipeline Retirement | **Retain** | Elevated relevance; active conformance work |
| PL-OPS-07 | WriteDesk Vocabulary | **Reframe** | → Execute with Shell/Deployment restructuring |
| PL-POL-01 | Cash-Flow-Safe Recovery | **Retain** | Exploratory seed |
| PL-POL-02 | Monthly Production Regime | **Promote** | → Graduated into Situation/Bridge Income architecture |
| PL-POL-03 | Portfolio Optimization Layer | **Supersede** | → Situation + Deployment Opportunity |
| PL-POL-04 | Policy Evolution | **Retain** | Absorbs PL-ARCH-04 |
| PL-RESEARCH-01 | Universe Discovery | **Retain** | Needs paid provider |
| PL-RESEARCH-02 | Velvet Rope Evolution | **Reframe** | → Dissolve; capabilities → Governance family |
| PL-RESEARCH-03 | Scenario Replay | **Reframe** | → Engineering instrument, subordinate boundary |
| PL-RESEARCH-04 | Instrument Catalog Evolution | **Retain** | Governance golden-data family |
| PL-API-01 | API Testability/Cacheability | **Promote** | → Principles graduated into publication invariants |
| PL-GOV-01 | Governance Catalog Gap | **Retain** | Governance correctness family |
| PL-REC-STATE | Client-Local Recommendation State | **Merge** | → PL-ARCH-06 + PL-DEPLOY-02 |

---

## Revised Disposition Counts

| Disposition | Count |
|-------------|-------|
| **Retain** | 17 |
| **Reframe** | 10 |
| **Merge** | 4 |
| **Supersede** | 7 |
| **Promote** | 5 |
| **Delete** | 0 |
| **Total** | 43 (44 semantic items minus PL-ARCH-04 merge target = 43 dispositions on source items) |

---

## Superseded Historical Containers with Destination Mappings

| Container | Children | Destination |
|-----------|----------|-------------|
| PL-CALL-01 (Horizon B) | Existing-position PCS | → PL-EVID-03 |
| | Appreciation/consequence geometry | → Economic Consequence (ADR-013 dim 3) |
| | Call execution handoff | → PL-EXEC-01 |
| PL-CALL-02 (Horizon C) | Historical lifecycle linkage | → PL-EVID-01/02 |
| | Independent call discovery | → Deployment Opportunity (buy-write) |
| | Longitudinal intelligence | → Level 3 learned model (far future) |
| | User-specific state | → PL-ARCH-03 |
| | Lifecycle quality in ranking | → PL-EVID-02 |
| PL-OPS-02 (Craftsmanship Review) | Backend quality | → Active holistic cleanup |
| | Frontend structural debt | → Active holistic cleanup |
| PL-POL-03 (Optimization Layer) | Capital allocation | → Situation Architecture |
| | Production targets | → Bridge Income / mission |
| | Diversification constraints | → Deployment Opportunity policy |

---

## Promoted Architectural Concepts

| Source | Promoted Concept | Destination |
|--------|-----------------|-------------|
| PL-CALL-05 | Buy-Write Deployment Mechanism | Accepted direction within Decision domain |
| PL-DEPLOY-01 | Deployment Opportunity | Accepted architectural direction (F-13) |
| PL-POL-02 | Monthly Production / Cash-Flow Mission | Graduated → Situation Architecture, Bridge Income |
| PL-API-01 | API contract design principles | Graduated → Publication invariants, snapshot contract v1 |
| PL-OPS-06 | (not promoted — see Retain) | — |

Note: PL-OPS-06 is retained as active implementation/conformance work, not promoted as architectural concept. "Remove dead functions" is an action, not a principle.

---

## Proposed Application Coherence Initiative

The reconciliation (F-12) and multiple parking-lot items identify the same missing implementation:

**Application Coherence / Application Shell** — a canonical implementation initiative, not ten separate parking-lot rows.

**Sub-concerns:**

| Sub-concern | Source items |
|-------------|-------------|
| Common application header/shell | Reconciliation D-08 |
| Navigation between operational surfaces | Reconciliation D-09 |
| Shared portfolio context/provenance visibility | ADR-011, PL-UX-01 (situation rendering) |
| Shared evidence/session/freshness presentation | PL-UX-03 |
| Shared Situation/Mission context | Reconciliation Synthesis 3 |
| Context-preserving transitions | Reconciliation F-19, PL-UX-01 (action transitions) |
| Reactive recommendation recomputation | PL-ARCH-05 |
| Route topology (3 operational + engineering) | Reconciliation F-25 |
| Common interaction/layout grammar | Reconciliation D-12 |
| Vocabulary cleanup (Write Desk retirement) | PL-OPS-07 |
| Lab retirement (surface removal) | PL-OPS-06, reconciliation Category C |

This initiative does NOT become a single backlog row. It becomes the **organizing structure** for the structural cleanup phase that follows this reconciliation.

---

## Governance Capability Family

Governance is not one item. It is a coherent family of related concerns:

| Responsibility | Description | Current items |
|---------------|-------------|---------------|
| **Governance policy** | What instruments/actions are admissible or authorized? | PL-ARCH-01 (modes), PL-RESEARCH-02 (batch evaluation) |
| **Governance golden data** | What do we know about instrument structure/classification? | PL-RESEARCH-04 (catalog enrichment) |
| **Governance provenance/scaling** | How are policy decisions versioned, attributable, inspectable? | PL-POL-04 (absorbs PL-ARCH-04) |
| **Governance correctness** | Where is the live catalog incomplete or wrong? | PL-GOV-01 |
| **Governance operator expression** | Does the operator need direct inspection/intervention/override? | Unresolved (reconciliation amendment 1) |

**Key principle:** Velvet Rope is NOT the canonical product home for governance. Velvet Rope was the Lab where we learned the capability. Its surviving capabilities are distributed into this family. The Lab-era framing ("Velvet Rope Evolution") retires.

---

## Historical / Observational Capability Family

Historical and observational work requires explicit boundary discipline to preserve Evidence ≠ Recommendation:

| Domain | Source | Examples | Owner |
|--------|--------|----------|-------|
| Market evidence history | Provider acquisition | Chain snapshots over time, IV trends | Evidence Engine (clear) |
| Portfolio observation history | Fidelity imports, lifecycle events | NAV trajectory, production history | Portfolio Context / Production (clear) |
| Decision/recommendation history | Wheelwright's own Decision output | Recommendation snapshots, deployment records | **Unresolved** (explicitly per D-04 amendment) |
| Reconstructed lifecycle evidence | Combined market + portfolio + execution | Full overlay paths (entry → operation → exit) | PL-EVID-02, depends on PL-EVID-01 |
| Simulation/replay artifacts | Hypothetical state transitions | Scenario replay outputs | Engineering/research (subordinate) |

**Key principle:** Do not collapse all persisted observations into the Evidence Engine. The sources differ. Ownership of recommendation-history observation remains the most important unresolved architectural question in this family.

**Items in this family:** PL-EVID-01, PL-EVID-02, PL-DEPLOY-02, PL-REC-STATE (merged), PL-RESEARCH-03, and components of retired PL-CALL-02.

---

## Genuine Remaining Principal Decisions

### 1. Recommendation Engine Ownership (PL-ARCH-06)

**Nature:** Genuine architectural decision.

**Evaluate against:** determinism, reproducibility, auditability, policy authority, multi-user needs, latency, operational simplicity.

**Pressure sources:** dead-pipeline drift risk, Deployment Opportunity composition, future multi-user.

**Current disposition:** Leave unresolved until deliberately decided. Do not move browser → backend merely because backend sounds architecturally cleaner.

---

### 2. Governance Operator Expression

**Nature:** Genuine product decision.

**Question:** Does the operator ever need direct inspection, intervention, override, or audit of governance decisions?

**Possible expressions:** invisible policy, explanation in rejected opportunities, progressive disclosure, audit tooling, or a true workflow.

**Current disposition:** Unresolved. Design minimal expression (e.g., "why was this symbol excluded?" in the recommendation brief) only when observed operator need demonstrates it.

---

### 3. Historical Evidence Architecture Priority

**Nature:** Partially misframed. The question is not merely scheduling priority.

**First resolve:** historical observation domains and provenance/ownership model (what kinds of observations, from what sources, with what boundary discipline).

**Then sequence:** which domains to implement first, in what order, with what persistence substrate.

**Current disposition:** Remains future until domain model is designed. Cloud deployment likely provides the always-on substrate, but domain design should precede infrastructure.

---

### 4. Lab Retirement Sequencing — Delegatable

**Nature:** Not a Principal product decision. The product direction is ratified: zero Labs retain as operator topology.

**Remaining question:** Implementation sequencing (what order, what diagnostics survive, how to preserve useful engineering capabilities).

**Current disposition:** Delegatable to implementation once Application Shell design establishes the target surface topology. Ensure useful diagnostics survive behind the engineering boundary.

---

## Revised Cluster Map

### Cluster 1: Historical Evidence / Observation Architecture

**Items:** PL-EVID-01, PL-EVID-02, PL-DEPLOY-02, PL-REC-STATE (merged), children of PL-CALL-02 (lifecycle linkage)

**Core need:** An architecture for accumulating, storing, and analyzing observations over time. Must distinguish market observations, portfolio observations, Decision/recommendation observations, and reconstructed lifecycle evidence — with explicit provenance and ownership boundaries.

**Status:** Unresolved. One of the largest architectural dependencies. Multiple items block on it.

---

### Cluster 2: Application Coherence / Application Shell

**Items:** PL-ARCH-05, PL-UX-01 (situation/transition children), PL-UX-03, PL-OPS-06, PL-OPS-07

**Core need:** The Application Shell identified by reconciliation F-12 — shared operating context, navigation, consistent presentation, reactive state, surface topology, vocabulary.

**Status:** Architecturally accepted. Design and implementation are the next active work after this reconciliation.

---

### Cluster 3: Deployment Opportunity / Unified Surface

**Items:** PL-DEPLOY-01 (promoted), PL-CALL-05 (promoted), PL-UX-02 (strategy-specific semantics), PL-CALL-04 (reframed as eligibility/capacity)

**Core need:** Deployment Opportunity as domain concept — normalizing strategy-specific candidates into mission-aware portfolio actions, with strategy-specific economics/explanation preserved within the unified model.

**Status:** Concept accepted. Implementation emerges from building buy-write + situation awareness into the existing recommendation surface, then designing the unified Deployment surface.

---

### Cluster 4: Governance Capability Family

**Items:** PL-ARCH-01, PL-RESEARCH-02 (dissolved), PL-GOV-01, PL-RESEARCH-04, PL-POL-04 (provenance/scaling facet)

**Core need:** Governance operating as cross-cutting automatic policy. Includes policy, golden data, provenance, correctness, and unresolved operator expression.

**Status:** Capability validated. Lab framing retired. User-facing expression unresolved. Catalog enrichment depends on data sources.

---

### Cluster 5: Active Holistic Cleanup

**Items:** PL-OPS-02 (superseded into this), PL-OPS-06, PL-OPS-07, PL-OPS-05 (merged into doc topology)

**Core need:** Remove vestigial scaffolding, dead pipelines, obsolete vocabulary. Implement reconciled surface topology. Align documentation with architecture.

**Status:** Active. This IS the current work. Should be sequenced after Application Shell design establishes the target.

---

## Resulting Proposed Active-Backlog Taxonomy

After reconciliation, the parking lot organizes into:

**Principal decisions (2):**
- Recommendation engine permanent home (PL-ARCH-06)
- Governance operator expression (from governance family)

**Accepted direction with remaining design/implementation (3 initiatives):**
- Application Coherence / Shell (cluster 2)
- Deployment Opportunity / unified surface (cluster 3)
- Active holistic cleanup (cluster 5)

**Implementation work within ratified architecture (8):**
- Console: Decision Pressure (PL-UX-01 reframed)
- Console: Progressive hydration (PL-UX-04)
- Deployment Eligibility / Capacity Explanation (PL-CALL-04 reframed)
- Conditioned Operating Opportunity EP2 (PL-EVID-03)
- Portfolio state maturity (PL-PORT-01)
- Production accounting remaining (PL-PORT-02)
- Trade lifecycle evolution (PL-EXEC-01)
- Governance catalog gap (PL-GOV-01)

**Unresolved architectural work (1):**
- Historical evidence/observation architecture (PL-EVID-01 + family)

**Infrastructure prerequisites (2):**
- Cloud deployment (PL-OPS-01)
- Security/authentication (PL-ARCH-03)

**Blocked on external dependencies (3):**
- Market-Priced Risk (PL-EVID-04) — IV data source
- Recommendation Set Analysis (PL-EVID-05) — enrichment data
- Universe Discovery (PL-RESEARCH-01) — paid provider

**Exploratory / far-future seeds (5):**
- Situation-governed deployment strategy (PL-ARCH-02)
- Instrument governance modes (PL-ARCH-01)
- Cash-Flow-Safe Recovery thesis (PL-POL-01)
- Familiarity vs Favorites (PL-CALL-03)
- Notification/background awareness (PL-OPS-04)

**Engineering instruments behind subordinate boundary (1):**
- Scenario Replay (PL-RESEARCH-03)

**Policy maturation (1):**
- Policy evolution / governance provenance (PL-POL-04)

**Total active canonical concerns: ~26** (down from 44 semantic source items)

---

## Governing Principle

> Do not clean up the backlog as an isolated artifact. Use the backlog reconciliation to make the backlog, documentation, product topology, Application Shell, navigation, shared context, and implementation structure converge on the same mature Wheelwright model.

The mature operator topology remains three established workflows:

1. **Console** — Where am I? What is committed? What requires attention? What capacity exists?
2. **Deployment** — Given portfolio, available capital, evidence, and mission, what productive actions are available now?
3. **Production** — What did I produce, what happened economically, and how does that reconcile to the mission?

Cross-cutting capabilities (governance, evidence/session state, portfolio ingestion, Situation/Mission, explanation) do not automatically become navigation destinations. Everything outside these three workflows must justify why it deserves operator-facing topology.

---

*This document is analysis. It does not edit parking-lot.md or propose implementation sequencing. Next step: Principal ratification, then parking-lot.md rewrite and documentation-topology reconciliation.*
