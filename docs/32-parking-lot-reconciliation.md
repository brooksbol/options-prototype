# Parking-Lot Reconciliation

**Purpose:** Test every active parking-lot item against the ratified architectural reconciliation (`docs/31-architectural-reconciliation.md`). Determine what the backlog actually is.

**Governing frame:** `docs/31-architectural-reconciliation.md` (ratified August 2026)
**Source:** `docs/parking-lot.md` (last reviewed July 26, 2026)
**Date:** August 11, 2026
**Status:** Analysis — parking-lot.md not yet edited

---

## Disposition Key

| Disposition | Definition |
|-------------|-----------|
| **Retain** | Still valid substantially as written |
| **Reframe** | Concern is valid but current articulation is wrong or too narrow |
| **Merge** | Concern survives but belongs with another item |
| **Supersede** | Newer architecture/discovery has absorbed it |
| **Promote** | No longer backlog; is now architecture, invariant, or accepted design direction |
| **Delete** | No longer represents a real requirement |

---

## Complete Inventory and Dispositions

### Architecture

#### PL-ARCH-01: Instrument Governance

**Current articulation:** Per-instrument authorized operating modes (Standard Wheel, Tactical Premium, etc.) beyond binary admission.

**Underlying concern:** Instruments may require different operating constraints beyond simple admit/reject. Some ETFs might be suitable for conservative covered-call-only operation but not aggressive put-selling.

**Reconciled ownership:** Policy Engine (governance facet). This is a refinement of the existing product-structure governance and admission policy — additional policy dimensions applied per-instrument.

**Disposition: Retain.** The concern is real and not yet addressed. It sits within the Policy Engine and is a natural extension of governance capabilities. However, its urgency is low — the current binary governance (admit/reject via product-structure heuristic + catalog) serves the present operational need. This becomes relevant when the governance capability matures beyond its current Lab-era prototype.

---

#### PL-ARCH-02: Overlay Policy

**Current articulation:** DTE laddering, simultaneous rungs, roll policy, take-profit — facets beyond current RecommendationPolicy.

**Underlying concern:** The current RecommendationPolicy handles contract selection and ranking but does not address portfolio-level overlay strategy: how many simultaneous positions, how DTE is distributed, when to roll, when to take profit early.

**Reconciled ownership:** This sits at the intersection of Policy Engine and Situation/Mission. Under Bridge Income, the situation's mission (monthly target, capital preservation) would naturally govern overlay decisions. DTE laddering is visible on the Console. Roll policy and take-profit are lifecycle decisions that connect to PL-EXEC-01 (trade lifecycle).

**Disposition: Reframe.** The concern is valid but the framing ("facets beyond current RecommendationPolicy") is too implementation-specific. The real question is: "How does the system support portfolio-level deployment strategy (concentration, temporal distribution, lifecycle management) as distinct from individual contract selection?" This is a Situation/Mission concern — the overlay shape emerges from the mission's constraints and objectives, not from standalone policy parameters.

**Reframed as:** "Situation-governed portfolio deployment strategy — temporal distribution, concentration limits, lifecycle management (roll/take-profit/hold), rung renewal cadence. Distinct from per-contract recommendation policy."

---

#### PL-ARCH-03: Security and User Accounts

**Current articulation:** Application-managed users, password hashing, session cookies, user-ownership boundaries.

**Underlying concern:** Multi-user access requires authentication and authorization.

**Reconciled ownership:** Infrastructure concern. Explicitly deferred in the Retooling Charter. Depends on cloud deployment (PL-OPS-01).

**Disposition: Retain.** Still valid, still deferred, correctly sequenced after cloud deployment. No change from reconciliation.

---

#### PL-ARCH-04: Policy-Governance Scaling

**Current articulation:** How policy remains versioned, attributable, inspectable, testable as complexity grows.

**Underlying concern:** As policy complexity increases (per-instrument governance, situation-specific parameters, overlay rules), the governance infrastructure must scale.

**Reconciled ownership:** This is a cross-cutting architectural concern touching the Policy Engine, Principles Governance Model, and the future situation-aware policy configuration. The foundations/principles-governance-model.md already describes principles as first-class entities with versioning and attribution.

**Disposition: Merge into PL-POL-04 (Recommendation Policy Evolution).** Both items address the same underlying question: how does policy remain auditable and traceable as it grows? PL-POL-04 already names "full policy versioning, attribution, replay." PL-ARCH-04 names "versioned, attributable, inspectable, testable." These are the same concern from different angles.

**Surviving item:** PL-POL-04 (reframed to include governance scaling).

---

#### PL-ARCH-05: Cache-Based Recommendation Trigger

**Current articulation:** Portfolio-dependent recommendation recomputation should be independently triggerable from cached evidence. Currently works only via forced ETag reset.

**Underlying concern:** When portfolio state changes (new CSV import, pending intent created), recommendations should recompute without waiting for new backend evidence.

**Reconciled ownership:** Application Shell concern. Under ADR-011 (application-scoped portfolio), a portfolio change is immediately visible to all surfaces. Recommendation recomputation triggered by portfolio change is a reactive application-state concern within the shared operating context.

**Disposition: Reframe.** The concern is valid but the articulation is implementation-specific ("forced ETag reset"). The reconciled framing is: "Application-state changes (portfolio update, policy change, pending intent) should trigger recommendation recomputation independently of evidence acquisition cycles." This is a reactive-state concern within the Application Shell, not an evidence-layer problem.

---

#### PL-ARCH-06: Recommendation Engine Ownership

**Current articulation:** Whether recommendation logic moves to the backend or remains browser-local.

**Underlying concern:** The recommendation engine's browser-local placement is documented as "transitional" per the Retooling Charter. No durable ownership decision exists. The yield-suppression bug demonstrated the cost of duplicated frontend pipelines.

**Reconciled ownership:** Explicitly listed in the baseline inventory §9 as a transitional boundary and in §10 as unresolved question #1. The reconciliation did not resolve this — it confirmed the architecture accommodates either placement.

**Disposition: Retain.** The concern remains real and unresolved. The reconciliation explicitly preserves this as an open architectural question. However, the Labs reconciliation (dead pipelines in PL-OPS-06, drift risk) adds urgency: if the recommendation engine stays browser-local, the dead parallel pipelines must be removed; if it moves to backend, the migration path needs definition.

---

### UX / Operator Experience

#### PL-UX-01: State-Oriented Operator Console

**Current articulation:** Remaining work: Decision Pressure, situation rendering, NAV/mission progress, action transitions with context preservation.

**Underlying concern:** The Console needs to complete its architectural mandate (ADR-012, ADR-013).

**Reconciled ownership:** Operator Surfaces (Console) + Application Shell (action transitions with context preservation is F-19 in the reconciliation — transition state). Decision Pressure is ADR-013 dimension 2. Situation rendering is the cross-cutting operating context becoming visible on the Console. NAV/mission progress depends on unresolved data acquisition (baseline §10, question #16).

**Disposition: Reframe.** The item conflates several distinct concerns that now have different owners:
- Decision Pressure → ADR-013 implementation work (Console-owned)
- Situation rendering → Application Shell cross-cutting context (not Console-specific)
- NAV/mission progress → unresolved data dependency (blocked on historical NAV acquisition)
- Action transitions → Application Shell navigation concern (F-19, recognized requirement)

The Console's remaining *owned* work is primarily Decision Pressure. The other items belong to the Application Shell or are blocked on unresolved dependencies.

**Reframed as:** "Console: implement Decision Pressure (ADR-013 dim 2). Other items previously bundled here have migrated to Application Shell concerns or remain blocked on unresolved dependencies."

---

#### PL-UX-02: Put/Call Desk Asymmetry

**Current articulation:** Whether puts and calls ultimately require different evidence, ranking, presentation, workflows, or desk structures.

**Underlying concern:** Are puts and calls fundamentally different operator workflows, or are they both deployment actions in service of the same mission?

**Reconciled ownership:** This is directly addressed by Synthesis 2 in the reconciliation: "The operator's question is deployment, not strategy." The Deployment Opportunity concept and the Situation Architecture's Unified Recommendation Surface both anticipate convergence. The reconciliation finding F-23 explicitly classifies the separate puts/calls structure as "an artifact of the recommendation engine's structure, not an inherent operator-model requirement."

**Disposition: Supersede.** The reconciliation resolves this question: puts and calls are both deployment actions. They may have different economics, different collateral models, and different implementation mechanics — but they serve the same mission and belong on the same deployment surface. The "asymmetry" question is answered: the operator model is unified; the implementation mechanics differ.

**Superseded by:** Deployment Opportunity concept (reconciliation Synthesis 2, F-13), Situation Architecture §Unified Recommendation Surface.

---

#### PL-UX-03: Evidence Freshness and Provenance Language

**Current articulation:** Consistent operator-facing language for observation time, session validity, provenance across all surfaces.

**Underlying concern:** Evidence state must be communicated consistently and truthfully across all operator surfaces.

**Reconciled ownership:** Application Shell cross-cutting concern. Discovery D-11 in the reconciliation identifies "consistent evidence/session/freshness across surfaces" as an application-shell responsibility. This is not a per-surface concern — it's shared operating context.

**Disposition: Reframe.** The concern is valid but it's no longer a standalone UX item — it's part of the Application Shell's responsibility to present evidence/session state consistently. The language design question remains real but belongs within the Application Shell design work, not as an independent backlog item.

**Reframed as:** Part of Application Shell — evidence/session state presentation. Retain as a sub-concern within that work rather than an independent item.

---

#### PL-UX-04: Progressive Treemap Health Hydration

**Current articulation:** Investigate progressive per-symbol evidence hydration rather than batch appearance.

**Underlying concern:** UX polish for the Console's DTE ladder — tiles should color progressively as evidence arrives rather than all at once.

**Reconciled ownership:** Console implementation detail. This is a behavior refinement of the implemented DTE ladder, not an architectural concern.

**Disposition: Retain.** Valid implementation work. Correctly scoped. Low architectural significance but real operator-experience improvement.

---

### Calls

#### PL-CALL-01: Calls Horizon B (remaining)

**Current articulation:** Remaining: existing-put PCS entry point, appreciation geometry, Fidelity call execution handoff.

**Underlying concern:** Complete the call recommendation and explanation capabilities.

**Reconciled ownership:** Decision Engine (call recommendations) + Explanation Engine (PCS, appreciation geometry) + Broker Handoff (call execution). All within existing architectural primitives.

**Disposition: Reframe.** The concern remains valid but should be reframed under Deployment Opportunity thinking. "Appreciation geometry" is assignment economics (ADR-013 dim 3). "Existing-put PCS entry point" is Conditioned Operating Opportunity (second entry point). "Fidelity call execution handoff" is broker handoff extension. These are all implementation work within ratified architecture.

The "Horizon B" framing was meaningful when calls were a separate workstream. Under unified deployment, these are just remaining implementation tasks for call-side capabilities.

---

#### PL-CALL-02: Calls Horizon C

**Current articulation:** Historical lifecycle linkage, independent call discovery, longitudinal call intelligence, user-specific state, lifecycle quality in ranking.

**Underlying concern:** Deep lifecycle analysis and learning from accumulated call operation history.

**Reconciled ownership:** This is Level 3 learned-model territory (per Regime Objective Function). Historical lifecycle linkage depends on PL-EVID-01 (historical evidence). Independent call discovery is the buy-write concept (already addressed via PL-CALL-05). Lifecycle quality in ranking is PL-EVID-02.

**Disposition: Reframe.** "Calls Horizon C" conflates several independent concerns that now have distinct homes:
- Historical lifecycle linkage → PL-EVID-01/02 (historical analysis)
- Independent call discovery → PL-CALL-05 / Deployment Opportunity (buy-write is this)
- Longitudinal intelligence → Level 3 learned model (Regime Objective Function, far future)
- User-specific state → PL-ARCH-03 dependency (multi-user)
- Lifecycle quality in ranking → PL-EVID-02/06

The umbrella "Horizon C" item should be decomposed — its components already have homes elsewhere.

**Reframed as:** Decompose into constituent concerns. Most are already captured by other items. The "Calls Horizon C" umbrella can be deleted once its children are confirmed present elsewhere.

---

#### PL-CALL-03: Familiarity vs Favorites

**Current articulation:** Familiarity is inferred from history/interaction. Favorites are explicit operator designation.

**Underlying concern:** Two distinct instrument-affinity concepts that must not collapse.

**Reconciled ownership:** This is a future application-state/personalization concern. Familiarity requires accumulated interaction history (Level 3 / PL-EVID-01 dependency). Favorites require user-specific durable state (PL-ARCH-03 dependency).

**Disposition: Retain.** The conceptual distinction is real and correctly articulated. Both concepts depend on capabilities that don't exist yet (historical evidence, user accounts). Low urgency but the vocabulary distinction is worth preserving.

---

#### PL-CALL-04: Call Inventory and Eligibility Observability

**Current articulation:** The operator cannot fully inspect why certain inventory is/isn't eligible for call writing.

**Underlying concern:** Transparency of the recommendation engine's internal eligibility logic for calls.

**Reconciled ownership:** Explanation Engine / Operator Surfaces. The operator should understand why capacity exists or doesn't. This is progressive disclosure of the Decision Engine's internal reasoning applied to calls specifically.

**Disposition: Retain.** Valid implementation work. The Console's capacity sidebar partially addresses this (call-writing capacity per symbol), but full eligibility explanation (why a symbol is excluded) is not yet implemented. This is Explanation Engine work for the call side.

---

#### PL-CALL-05: Buy-Write Recommendation Board

**Current articulation:** Universe-wide buy-write discovery with composite economics.

**Underlying concern:** Buy-write as a third deployment mechanism.

**Reconciled ownership:** Decision Engine (per reconciliation D-01, F-09, F-15). Architecturally parallel to recommendPuts(). Part of the emerging Deployment Opportunity concept.

**Disposition: Promote.** Buy-write is no longer merely a parking-lot idea — it is analyzed as feasible, architecturally validated by the reconciliation (F-09: "architecturally parallel to existing recommendation engines"), and acknowledged as a recognized recommendation path that `07-architecture-current.md` should reflect (F-15). The implementation analysis is complete. This should graduate from backlog to "accepted implementation direction" alongside the existing put and call recommendation paths.

---

### Capital Deployment

#### PL-DEPLOY-01: Unified Capital Deployment Surface

**Current articulation:** Higher-level Deployable Opportunity primitive where puts, buy-writes, and covered calls are deployment strategies evaluated against a common policy surface.

**Underlying concern:** The operator's question is "where should capital go?" not "what put should I write?"

**Reconciled ownership:** This IS the Deployment Opportunity concept (reconciliation Synthesis 2, F-13). The reconciliation validates it as a legitimate domain/composition concept within the Decision Engine. The Situation Architecture already anticipates it.

**Disposition: Promote.** This is no longer backlog — it is accepted architectural direction per the ratified reconciliation. The concept is confirmed; its structural realization within the Decision Engine should emerge from implementation.

---

#### PL-DEPLOY-02: Opportunity Surface Observation

**Current articulation:** Periodically observe the recommendation surface throughout the trading day.

**Underlying concern:** Temporal observation of what the Decision Engine produces, enabling pattern recognition and intelligent timing.

**Reconciled ownership:** Cross-cutting observational/history capability with unresolved architectural ownership (per reconciliation amendment 2, D-04). Not Evidence Engine, not Decision Engine — a history/observation concern that awaits the Historical Analysis architecture.

**Disposition: Retain.** Valid concern, correctly placed as unresolved. It depends on the Historical Analysis architecture (which doesn't exist yet) and likely on cloud deployment (PL-OPS-01) for always-on observation.

---

#### PL-DEPLOY-03: Cross-Entry Multi-Path Opportunity Awareness

**Current articulation:** Same underlying surfaced through multiple entry mechanisms simultaneously.

**Underlying concern:** The operator should see that REMX is available as both CSP and buy-write without treating these as duplicates.

**Reconciled ownership:** Emergent property of running multiple recommendation paths (per reconciliation D-02, F-10: "requires no architectural response"). The current behavior already exposes this via the cross-entry table.

**Disposition: Supersede.** The reconciliation explicitly classifies this as "an emergent phenomenon, not architectural pressure" (F-10). The current implementation already handles it. No backlog action needed. If future UX enhancement makes multi-path eligibility more explicit, that's a refinement of the Deployment surface, not an independent concern.

**Superseded by:** Existing implementation + Deployment Opportunity concept subsumes this naturally.

---

### Evidence and Research

#### PL-EVID-01: Historical Analysis and Evidence Provenance

**Current articulation:** Native prospective observation + selective backfill. Explicit provenance, methodology, lineage.

**Underlying concern:** The system needs a historical evidence architecture — how to accumulate, store, distinguish, and analyze observations over time.

**Reconciled ownership:** Cross-cutting observational/history capability (per reconciliation D-04 amendment). This is the foundational architecture that PL-DEPLOY-02, PL-CALL-02 (lifecycle linkage), and Level 3 learned models all depend on. Its ownership is explicitly unresolved in the reconciliation.

**Disposition: Retain.** This is the foundational dependency for multiple other items. It remains an open architectural question whose resolution enables substantial downstream work. Its urgency increases as operational history accumulates without a capture mechanism.

---

#### PL-EVID-02: Lifecycle Assessment Evidence Domain

**Current articulation:** Formal domain for lifecycle quality: ingress, operating, egress.

**Underlying concern:** Evaluating the quality of the full overlay lifecycle (put entry → ownership → call exit) as a first-class domain concept.

**Reconciled ownership:** Conditioned Operating Opportunity foundation (partially implemented — PCS). Depends on PL-EVID-01 (historical evidence) for actual lifecycle measurement. The concept is well-defined; the data dependency is unresolved.

**Disposition: Retain.** The domain concept is articulated in `foundations/conditioned-operating-opportunity.md`. Implementation is partially delivered (PCS entry point 1). Full realization depends on historical evidence accumulation.

---

#### PL-EVID-03: Conditioned Operating Opportunity

**Current articulation:** Evaluating call environment conditioned on specific ownership basis. Entry point 1 (proposed-put PCS) implemented. Entry point 2 (existing-put) planned.

**Underlying concern:** Complete the second entry point for conditioned call evaluation.

**Reconciled ownership:** Explanation Engine + Decision Engine. Entry point 2 is remaining implementation work within ratified architecture.

**Disposition: Retain.** Valid implementation work. Entry point 2 is clearly scoped and architecturally sound.

---

#### PL-EVID-04: Market-Priced Risk

**Current articulation:** Read what the market communicates via IV, skew, OI depth.

**Underlying concern:** Can Wheelwright explain *why* premium exists, not just *how much* premium exists?

**Reconciled ownership:** Explanation Engine enrichment. Depends on data source (Tradier sandbox lacks IV). Foundation document exists with research directions.

**Disposition: Retain.** Valid research direction. Blocked on provider data (baseline §10, question #14). No architectural change required — it's Explanation Engine enrichment.

---

#### PL-EVID-05: Recommendation Set Analysis

**Current articulation:** Population-level observation of the ranked set (concentration, diversity, clustering).

**Underlying concern:** Does the recommendation population have characteristics the operator should know about?

**Reconciled ownership:** Decision Engine output analysis / Explanation. The foundation document describes pluggable grouping heuristics. Depends on classification metadata (sector, industry) not yet available.

**Disposition: Retain.** Valid concept with clear architectural fit. Blocked on enrichment data (baseline §10, question #15). The concept is well-documented in its foundation document.

---

#### PL-EVID-06: Score vs Classification

**Current articulation:** Whether lifecycle quality should produce a single numeric score or multi-dimensional classification.

**Underlying concern:** Representation model for lifecycle quality assessment.

**Reconciled ownership:** Open design question within Conditioned Operating Opportunity. Listed in baseline §10 as unresolved question #12.

**Disposition: Merge into PL-EVID-02 (Lifecycle Assessment).** This is a design sub-question of lifecycle assessment, not an independent concern. When lifecycle assessment is designed, this question gets resolved as part of that design.

---

### Portfolio

#### PL-PORT-01: Portfolio-State Maturity

**Current articulation:** Assignment transitions, richer encumbrance state, multi-account support, aggregation, stale-balance warnings.

**Underlying concern:** The portfolio model needs to mature beyond its current snapshot to handle lifecycle transitions, multiple accounts, and richer state.

**Reconciled ownership:** Portfolio Context primitive. ADR-011 established application-scoped portfolio. The Console implements position monitoring (ADR-013). This item represents the gap between current portfolio model fidelity and full lifecycle representation.

**Disposition: Retain.** Valid. The portfolio model will need these refinements as the system matures. Multi-account and user-specific state depend on PL-ARCH-03 (authentication). Assignment transitions connect to PL-EXEC-01 (trade lifecycle).

---

#### PL-PORT-02: Portfolio Production Accounting

**Current articulation:** Remaining: distribution-character resolution, transferred-asset basis, persistence/multi-month, full audit-trail drill-down, lifecycle reconstruction.

**Underlying concern:** Complete the production accounting surface's capabilities.

**Reconciled ownership:** Production surface (one of the 3 established operational surfaces). Implementation work within the existing delivered slice.

**Disposition: Retain.** Valid implementation work for the Production surface. Clearly scoped remaining tasks.

---

### Execution

#### PL-EXEC-01: Write Intent and Trade Lifecycle Evolution

**Current articulation:** Full lifecycle beyond URL handoff.

**Underlying concern:** The system currently only supports intent construction → broker handoff. Real portfolio operations have lifecycle: submitted → working → filled → assigned → closed/rolled.

**Reconciled ownership:** Broker Handoff primitive extension. This is the natural next maturation of the execution boundary. Also connects to PL-ARCH-02 (overlay policy — roll/take-profit are lifecycle decisions).

**Disposition: Retain.** Valid. The concern is real and grows in importance as the system moves toward production accounting reconciliation (lifecycle events are what production accounting measures).

---

### Operations

#### PL-OPS-01: Cloud Deployment

**Current articulation:** Always-on backend on Render.

**Underlying concern:** The Evidence Appliance should be location-independent and always-on.

**Reconciled ownership:** Infrastructure. Explicitly documented in `docs/24-cloud-deployment.md`. Prerequisite for PL-ARCH-03, PL-OPS-04, and always-on opportunity observation.

**Disposition: Retain.** Valid and correctly sequenced.

---

#### PL-OPS-02: Post-Retooling Craftsmanship Review

**Current articulation:** Clean Code, maintainability, structural cleanup. After behavioral parity.

**Underlying concern:** Code quality review of the Java backend after retooling.

**Reconciled ownership:** Operations concern. Java retooling is accepted (August 3, 2026). The review is now unblocked.

**Disposition: Reframe.** The concern is valid but the scope should expand. The reconciliation reveals that the *frontend* has more structural debt than the backend: dead pipelines (PL-OPS-06), Lab scaffolding (12 surfaces to retire), WriteDesk vocabulary (PL-OPS-07), duplicated state patterns pre-ADR-011. A craftsmanship review should address both backend quality and frontend structural debt.

**Reframed as:** "Structural cleanup review — both backend (post-retooling quality) and frontend (dead pipelines, Lab retirement, vocabulary, duplicated patterns)."

---

#### PL-OPS-04: Notification and Background Awareness

**Current articulation:** Push notifications when evidence state changes significantly.

**Underlying concern:** Operator awareness without active polling/observation.

**Reconciled ownership:** Future Application Shell capability. Depends on cloud deployment. Connects to PL-DEPLOY-02 (opportunity surface observation — alerts are the action-oriented complement to passive observation).

**Disposition: Retain.** Valid, far-future, correctly gated behind cloud deployment.

---

#### PL-OPS-05: ADR Coverage Review

**Current articulation:** Identify major architectural decisions lacking ADR documentation.

**Underlying concern:** Some important decisions are only implicitly documented.

**Reconciled ownership:** Documentation topology concern. The reconciliation itself has exposed that the architecture has outrun its documentation. This item is part of the documentation cleanup that follows reconciliation.

**Disposition: Reframe.** The reconciliation's Documentation Consequences section (items 1-8) subsumes this concern. The ADR review is now part of the broader documentation-topology reconciliation rather than an isolated review exercise.

**Reframed as:** Part of the documentation-topology cleanup phase that follows this reconciliation. Not a standalone task.

---

#### PL-OPS-06: Dead Recommendation Pipeline Retirement

**Current articulation:** `scanPuts()`, `scanCalls()`, `scanUniversePuts()` have zero runtime callers.

**Underlying concern:** Dead code that duplicates live policy and creates drift risk.

**Reconciled ownership:** Labs reconciliation finding. The reconciliation explicitly identifies the Recommendation Lab and Opportunity Lab as superseded. These dead pipelines are the implementation artifact of those Labs. The Labs principle applies: "Mature Wheelwright should simply know and do those things" — the dead Labs code should be removed.

**Disposition: Promote.** This is no longer a "maybe" — the reconciliation ratifies that these are vestigial Lab implementations whose concepts have been absorbed by the live `recommendPuts()`/`recommendCalls()` paths. Removal is part of Lab retirement, which is accepted architectural direction.

---

#### PL-OPS-07: Retire WriteDesk / write-desk / wd-* Vocabulary

**Current articulation:** Mechanical rename to Wheelwright vocabulary.

**Underlying concern:** Implementation terminology doesn't match product identity.

**Reconciled ownership:** Part of the broader surface-topology cleanup identified by the reconciliation (F-25, documentation consequence #1). However, the reconciliation also establishes that the surface topology itself is changing (3 operational surfaces, not the current layout). Renaming to "Wheelwright" vocabulary is correct, but the specific file structure (`src/wheelwright/`) should reflect the final surface topology, not the current one.

**Disposition: Reframe.** The vocabulary rename is valid but should be sequenced *after* the surface topology is finalized. Renaming WriteDesk.tsx to Wheelwright.tsx only to later restructure it into a Deployment surface would be wasted motion. The rename should happen as part of the structural cleanup that implements the reconciled product model, not as a standalone mechanical refactor.

**Reframed as:** "Vocabulary and structural cleanup — execute as part of the surface-topology implementation, not as a standalone rename."

---

### Policy

#### PL-POL-01: Cash-Flow-Safe Recovery

**Current articulation:** Premium production may defer/mitigate NAV erosion while preserving recovery potential.

**Underlying concern:** An exploratory thesis about whether premium income can offset capital loss.

**Reconciled ownership:** This is a future Situation concept. Under the Situation Architecture, "Liquidity Repair" and "Capital Recovery" are listed as illustrative future situations. This thesis would inform such a situation's operating rules.

**Disposition: Retain.** Valid exploratory seed. It's a potential future situation's operating hypothesis, not a current implementation need.

---

#### PL-POL-02: Monthly Production Regime

**Current articulation:** Explicit invariant: $X must be produced each month.

**Underlying concern:** Bridge Income's monthly cash-flow target as a governing constraint.

**Reconciled ownership:** This IS Bridge Income (Situation Architecture's first explicit situation). The monthly production target, mission gap, and related concepts are fully specified in `25-situation-architecture.md` and `foundations/regime-objective-function.md`.

**Disposition: Supersede.** This parking-lot seed has become the Bridge Income situation — a fully designed architectural direction. The concern has been absorbed into authoritative architecture.

**Superseded by:** `25-situation-architecture.md` §Bridge Income, `foundations/regime-objective-function.md`.

---

#### PL-POL-03: Portfolio Optimization Layer

**Current articulation:** Future layer above evidence/recommendation. Capital allocation, production targets, diversification constraints.

**Underlying concern:** Optimization above the recommendation engine.

**Reconciled ownership:** This is what Situation/Mission *is*. The Situation provides the optimization context (mission, constraints, priorities) that shapes how the Decision Engine's output is interpreted and prioritized. The reconciliation reframes Situation as cross-cutting operating context — it IS the "layer above" that governs deployment decisions.

**Disposition: Supersede.** The Situation Architecture and Deployment Opportunity concept together address what this item was reaching for. The "optimization layer" is the situation-aware composition that assembles deployment recommendations in service of a mission.

**Superseded by:** Situation Architecture + Deployment Opportunity concept.

---

#### PL-POL-04: Recommendation Policy Evolution

**Current articulation:** Full policy versioning, attribution, replay.

**Underlying concern:** Policy must remain auditable, traceable, and replayable as complexity grows.

**Reconciled ownership:** Policy Engine maturation + Principles Governance Model. This item absorbs PL-ARCH-04 (policy-governance scaling) per the merge disposition above.

**Disposition: Retain (absorbs PL-ARCH-04).** Valid. The concern is real and becomes more important as situation-specific policy parameters, per-instrument governance, and overlay strategy rules accumulate.

**Expanded scope:** Now includes the governance-scaling concern from PL-ARCH-04.

---

### Research / Discovery

#### PL-RESEARCH-01: Universe Discovery

**Current articulation:** Automated ETF discovery via multi-provider catalog.

**Underlying concern:** The system needs a way to discover new candidate ETFs beyond the static Yahoo 1,286 list.

**Reconciled ownership:** Evidence Engine concern (broader universe population). Depends on paid provider tiers. Spikes complete (API Ninjas, FMP). The Labs for these providers are being retired but the research findings remain valid.

**Disposition: Retain.** Valid future capability. The research spikes retired integration risk. Implementation requires paid provider subscription. Not blocked by architectural questions.

---

#### PL-RESEARCH-02: Velvet Rope Evolution

**Current articulation:** Multi-symbol batch evaluation, operator overrides, comparison view, stale detection.

**Underlying concern:** Maturing the governance/admission capability beyond single-symbol Lab prototype.

**Reconciled ownership:** Governance capability (per reconciliation amendment 1). The Lab framing is removed. The governance capability survives but its user-facing expression is unresolved. Multi-symbol batch evaluation is how governance would operate automatically (evaluating the universe). Operator overrides and audit are the potential user-facing expressions if an operator workflow demonstrates the need.

**Disposition: Reframe.** The "Velvet Rope Evolution" framing assumes the Lab persists and evolves. Under the reconciled architecture, the question is: "How does governance operate within normal Wheelwright? Does it need a user-facing expression, or does it simply run as cross-cutting policy?" The design features (batch evaluation, stale detection) are implementation details of automatic governance. Operator overrides may require a UI — but that's unresolved per the reconciliation.

**Reframed as:** "Governance maturation — automatic admission evaluation as cross-cutting policy. User-facing expression (overrides, audit, comparison) is a design question to be resolved by observed operator need."

---

#### PL-RESEARCH-03: Scenario Replay

**Current articulation:** Activity document → canonical events → state transitions → overlay implications.

**Underlying concern:** Understanding overlay lifecycle through state-transition replay.

**Reconciled ownership:** Labs reconciliation classifies Scenario Replay as "engineering/debug — research instrument for lifecycle simulation." The concept has value for understanding lifecycle dynamics but is not an operational surface.

**Disposition: Reframe.** The concern remains valid as a research/engineering capability but the "Research" framing is more accurate than "Product feature." This is a development-time learning instrument, not an operator workflow. It belongs behind the engineering boundary.

**Reframed as:** "Engineering research instrument — retained behind subordinate boundary. Not a product surface."

---

#### PL-RESEARCH-04: Instrument Catalog Evolution

**Current articulation:** Programmatic enrichment with sector, issuer, structural classification.

**Underlying concern:** The catalog needs richer metadata for governance, recommendation-set analysis, and explanation.

**Reconciled ownership:** Golden Data (GOV-PRODUCT invariant). Enrichment enables PL-EVID-05 (set analysis grouping) and PL-ARCH-01 (per-instrument governance). Part of the broader data-quality concern.

**Disposition: Retain.** Valid. Enrichment is a prerequisite for recommendation-set analysis grouping heuristics and richer governance. Implementation blocked on data source selection (baseline §10, question #15).

---

### API

#### PL-API-01: API Testability and Cacheability

**Current articulation:** Canonical request representations, deterministic semantics, ETag-friendly reads.

**Underlying concern:** The backend API should be well-designed for testing and caching.

**Reconciled ownership:** Publication invariants (INV-PUB-01 through INV-PUB-05). The evidence snapshot contract is already frozen (v1). ETag semantics are implemented. The concern was largely addressed by the retooling.

**Disposition: Supersede.** The evidence snapshot contract (v1, frozen, 12 contract tests) already provides canonical representation, deterministic semantics, ETag-friendly reads, and read/write separation. The concern has been resolved by the retooling implementation. If future APIs (production, governance) need similar contracts, that's part of their design — not a standalone backlog item.

**Superseded by:** `contracts/evidence-snapshot-v1.md`, INV-PUB-01 through INV-PUB-05.

---

### Standalone Items (outside category tables)

#### PL-GOV-01: Governance Catalog Coverage Gap

**Current articulation:** Live catalog only 12 instruments. Name heuristic doesn't gate commodity/futures. Suspected gaps in UGA, DBC, CPER.

**Underlying concern:** Correctness defect — governance has holes.

**Reconciled ownership:** Policy Engine (governance) + Golden Data invariant. Reconciliation D-05 classifies this as "correctness defect in golden data, not architectural pressure" (F-11).

**Disposition: Retain.** Valid correctness defect. Not architectural. Needs the pipeline from the 105-ticker validation to the live catalog established.

---

#### Client-Local Recommendation State (unlabeled)

**Current articulation:** Recommendation output has no durable/introspectable representation outside the running browser.

**Underlying concern:** Recommendations are transient. Cannot replay, inspect, compare across sessions, or accumulate outcome evidence.

**Reconciled ownership:** This is the intersection of PL-ARCH-06 (recommendation engine ownership) and PL-DEPLOY-02 (opportunity surface observation). If recommendations move to backend, durability follows naturally. If they stay browser-local, a snapshot/export mechanism is needed.

**Disposition: Merge into PL-ARCH-06 + PL-DEPLOY-02.** The "client-local recommendation state" smell is a symptom of two already-tracked concerns: (1) the recommendation engine's transitional browser placement, and (2) the absence of historical recommendation observation. Resolving either would address this.

---

## Summary of Dispositions

| ID | Name | Disposition | Notes |
|----|------|-------------|-------|
| PL-ARCH-01 | Instrument Governance | **Retain** | Valid, low urgency |
| PL-ARCH-02 | Overlay Policy | **Reframe** | → Situation-governed portfolio deployment strategy |
| PL-ARCH-03 | Security and User Accounts | **Retain** | Gated behind cloud deployment |
| PL-ARCH-04 | Policy-Governance Scaling | **Merge** | → into PL-POL-04 |
| PL-ARCH-05 | Cache-Based Recommendation Trigger | **Reframe** | → Application Shell reactive-state concern |
| PL-ARCH-06 | Recommendation Engine Ownership | **Retain** | Unresolved architectural question |
| PL-UX-01 | State-Oriented Operator Console | **Reframe** | → Console owns Decision Pressure only; other items migrated to Shell or blocked |
| PL-UX-02 | Put/Call Desk Asymmetry | **Supersede** | → Deployment Opportunity resolves this |
| PL-UX-03 | Evidence Freshness Language | **Reframe** | → Part of Application Shell evidence/session presentation |
| PL-UX-04 | Progressive Treemap Hydration | **Retain** | Valid implementation work |
| PL-CALL-01 | Calls Horizon B (remaining) | **Reframe** | → Implementation tasks within ratified architecture |
| PL-CALL-02 | Calls Horizon C | **Reframe** | → Decompose; components live in EVID-01/02, CALL-05, ARCH-03 |
| PL-CALL-03 | Familiarity vs Favorites | **Retain** | Valid conceptual distinction, far future |
| PL-CALL-04 | Call Eligibility Observability | **Retain** | Valid implementation work |
| PL-CALL-05 | Buy-Write Recommendation Board | **Promote** | → Accepted implementation direction |
| PL-DEPLOY-01 | Unified Capital Deployment Surface | **Promote** | → Accepted architectural direction (Deployment Opportunity) |
| PL-DEPLOY-02 | Opportunity Surface Observation | **Retain** | Unresolved ownership; depends on history architecture |
| PL-DEPLOY-03 | Cross-Entry Multi-Path | **Supersede** | → Emergent property; already works; no action needed |
| PL-EVID-01 | Historical Analysis | **Retain** | Foundational dependency for multiple items |
| PL-EVID-02 | Lifecycle Assessment | **Retain** | Valid, depends on EVID-01 |
| PL-EVID-03 | Conditioned Operating Opportunity | **Retain** | Entry point 2 is remaining implementation work |
| PL-EVID-04 | Market-Priced Risk | **Retain** | Valid research, blocked on provider data |
| PL-EVID-05 | Recommendation Set Analysis | **Retain** | Valid, blocked on enrichment data |
| PL-EVID-06 | Score vs Classification | **Merge** | → into PL-EVID-02 |
| PL-PORT-01 | Portfolio-State Maturity | **Retain** | Valid, progressive maturation |
| PL-PORT-02 | Production Accounting | **Retain** | Valid remaining implementation tasks |
| PL-EXEC-01 | Trade Lifecycle Evolution | **Retain** | Valid, growing importance |
| PL-OPS-01 | Cloud Deployment | **Retain** | Valid infrastructure prerequisite |
| PL-OPS-02 | Craftsmanship Review | **Reframe** | → Structural cleanup (backend + frontend) |
| PL-OPS-04 | Notification/Background | **Retain** | Valid, far future |
| PL-OPS-05 | ADR Coverage Review | **Reframe** | → Part of documentation-topology cleanup |
| PL-OPS-06 | Dead Pipeline Retirement | **Promote** | → Accepted direction (Lab retirement) |
| PL-OPS-07 | WriteDesk Vocabulary | **Reframe** | → Execute with surface-topology implementation, not standalone |
| PL-POL-01 | Cash-Flow-Safe Recovery | **Retain** | Exploratory seed, future situation |
| PL-POL-02 | Monthly Production Regime | **Supersede** | → Bridge Income situation |
| PL-POL-03 | Portfolio Optimization Layer | **Supersede** | → Situation Architecture + Deployment Opportunity |
| PL-POL-04 | Policy Evolution | **Retain** | Absorbs PL-ARCH-04 |
| PL-RESEARCH-01 | Universe Discovery | **Retain** | Valid, needs paid provider |
| PL-RESEARCH-02 | Velvet Rope Evolution | **Reframe** | → Governance maturation; user-facing expression unresolved |
| PL-RESEARCH-03 | Scenario Replay | **Reframe** | → Engineering research instrument behind subordinate boundary |
| PL-RESEARCH-04 | Instrument Catalog Evolution | **Retain** | Valid, enrichment prerequisite |
| PL-API-01 | API Testability/Cacheability | **Supersede** | → Already resolved by snapshot contract |
| PL-GOV-01 | Governance Catalog Gap | **Retain** | Valid correctness defect |
| (unlabeled) | Client-Local Recommendation State | **Merge** | → into PL-ARCH-06 + PL-DEPLOY-02 |

---

## Disposition Counts

| Disposition | Count | Items |
|-------------|-------|-------|
| **Retain** | 18 | ARCH-01, ARCH-03, ARCH-06, UX-04, CALL-03, CALL-04, DEPLOY-02, EVID-01, EVID-02, EVID-03, EVID-04, EVID-05, PORT-01, PORT-02, EXEC-01, OPS-01, OPS-04, POL-01, POL-04, RESEARCH-01, RESEARCH-04, GOV-01 |
| **Reframe** | 11 | ARCH-02, ARCH-05, UX-01, UX-03, CALL-01, CALL-02, OPS-02, OPS-05, OPS-07, RESEARCH-02, RESEARCH-03 |
| **Merge** | 3 | ARCH-04→POL-04, EVID-06→EVID-02, unlabeled→ARCH-06+DEPLOY-02 |
| **Supersede** | 5 | UX-02, DEPLOY-03, POL-02, POL-03, API-01 |
| **Promote** | 3 | CALL-05, DEPLOY-01, OPS-06 |
| **Delete** | 0 | — |

---

## Proposed Merges and Supersessions

| Source | Action | Destination | Rationale |
|--------|--------|-------------|-----------|
| PL-ARCH-04 | Merge into | PL-POL-04 | Same concern: policy governance at scale |
| PL-EVID-06 | Merge into | PL-EVID-02 | Sub-question of lifecycle assessment design |
| Client-Local Rec State | Merge into | PL-ARCH-06 + PL-DEPLOY-02 | Symptom of two tracked concerns |
| PL-UX-02 | Superseded by | Deployment Opportunity (reconciliation F-13) | Asymmetry question resolved: unified deployment model |
| PL-DEPLOY-03 | Superseded by | Existing implementation + Deployment Opportunity | Already works; no action needed |
| PL-POL-02 | Superseded by | Situation Architecture (Bridge Income) | Seed grew into authoritative architecture |
| PL-POL-03 | Superseded by | Situation Architecture + Deployment Opportunity | "Layer above" is what Situation provides |
| PL-API-01 | Superseded by | Evidence Snapshot Contract v1 | Already resolved by implementation |

---

## Promoted Architectural Items

| ID | Promoted to | Rationale |
|----|-------------|-----------|
| PL-CALL-05 | Accepted implementation direction | Analyzed as feasible, architecturally validated (F-09), recognized path (F-15) |
| PL-DEPLOY-01 | Accepted architectural direction | Validated as Deployment Opportunity concept (Synthesis 2, F-13) |
| PL-OPS-06 | Accepted direction (Lab retirement) | Dead pipelines are vestigial Lab implementations; removal ratified |

---

## Clusters Identified

Several parking-lot items are symptoms of the same missing capability or implementation increment:

### Cluster 1: Historical Evidence / Observation Architecture

**Items:** PL-EVID-01, PL-EVID-02, PL-DEPLOY-02, PL-CALL-02 (lifecycle linkage component), Client-Local Recommendation State

**Core need:** An architecture for accumulating, storing, and analyzing observations over time — including both market evidence history and recommendation/deployment history.

**Unblocks:** Lifecycle assessment, opportunity surface observation, Level 3 learned models, temporal pattern recognition, policy calibration.

**Status:** Unresolved. The reconciliation explicitly leaves ownership of historical observation unresolved (D-04 amendment). This is the single largest unresolved architectural question that multiple backlog items depend on.

---

### Cluster 2: Application Shell / Shared Operating Context

**Items:** PL-ARCH-05 (reactive trigger), PL-UX-01 (situation rendering, action transitions), PL-UX-03 (evidence language across surfaces), PL-OPS-07 (vocabulary/structure)

**Core need:** The Application Shell concept identified by the reconciliation (F-12). These items are all consequences of the shell not yet existing as a named, implemented concept.

**Unblocks:** Consistent evidence/session presentation, situation rendering, context-preserving navigation, vocabulary cleanup (happens as part of topology implementation).

**Status:** Architecturally accepted (reconciliation F-12). Design and implementation are the next step.

---

### Cluster 3: Deployment Opportunity / Unified Surface

**Items:** PL-DEPLOY-01, PL-UX-02, PL-CALL-05, PL-DEPLOY-03

**Core need:** The Deployment Opportunity concept — normalizing strategy-specific candidates into mission-aware portfolio actions.

**Unblocks:** Unified deployment surface, put/call convergence, buy-write integration, cross-entry comparison.

**Status:** Architecturally accepted (reconciliation F-13). Concept validated. Implementation emerges from building buy-write + situation awareness into the existing recommendation surface.

---

### Cluster 4: Governance Maturation

**Items:** PL-ARCH-01, PL-RESEARCH-02, PL-GOV-01, PL-RESEARCH-04

**Core need:** Governance operating as cross-cutting automatic policy within Wheelwright rather than as a separate Lab/page. Includes catalog completeness, enrichment, per-instrument rules, and batch evaluation.

**Unblocks:** Full universe governance (not just 12 instruments), richer admission criteria, potentially operator-visible governance explanations.

**Status:** Capability concept validated. User-facing expression unresolved. Implementation requires catalog enrichment (PL-RESEARCH-04) and potentially paid data sources.

---

### Cluster 5: Lab Retirement / Structural Cleanup

**Items:** PL-OPS-06, PL-OPS-07, PL-OPS-02

**Core need:** Remove vestigial Lab scaffolding, dead pipelines, and obsolete vocabulary. Implement the reconciled surface topology.

**Unblocks:** Cleaner codebase, reduced drift risk, coherent product identity, foundation for Application Shell implementation.

**Status:** Direction accepted. Can proceed as implementation work. Should be sequenced *after* Application Shell design so the cleanup targets the right end state.

---

## Resulting Simplified Backlog Shape

After reconciliation, the active backlog organizes into:

**Architectural decisions still needed (3):**
- PL-ARCH-06: Recommendation engine permanent home
- PL-EVID-01: Historical evidence/observation architecture
- Governance user-facing expression (from PL-RESEARCH-02 reframe)

**Accepted direction, ready for design/implementation (3):**
- Application Shell (reconciliation F-12)
- Deployment Opportunity (reconciliation F-13, absorbs PL-DEPLOY-01, PL-CALL-05)
- Lab retirement + structural cleanup (PL-OPS-06, PL-OPS-07, PL-OPS-02)

**Implementation work within ratified architecture (10):**
- Console: Decision Pressure (PL-UX-01 reframed)
- Console: Progressive hydration (PL-UX-04)
- Calls: remaining Horizon B tasks (PL-CALL-01 reframed)
- Calls: eligibility observability (PL-CALL-04)
- Conditioned Operating Opportunity: entry point 2 (PL-EVID-03)
- Portfolio: state maturity (PL-PORT-01)
- Production: remaining accounting tasks (PL-PORT-02)
- Trade lifecycle (PL-EXEC-01)
- Governance catalog gap (PL-GOV-01)
- Policy evolution / governance scaling (PL-POL-04 + PL-ARCH-04)

**Infrastructure prerequisites (2):**
- Cloud deployment (PL-OPS-01)
- Security/authentication (PL-ARCH-03)

**Blocked on external dependencies (3):**
- Market-Priced Risk — needs IV data source (PL-EVID-04)
- Recommendation Set Analysis — needs enrichment data (PL-EVID-05)
- Universe Discovery — needs paid provider (PL-RESEARCH-01)

**Exploratory / far-future seeds (5):**
- Overlay policy as situation-governed strategy (PL-ARCH-02 reframed)
- Instrument governance modes (PL-ARCH-01)
- Cash-Flow-Safe Recovery thesis (PL-POL-01)
- Familiarity vs Favorites (PL-CALL-03)
- Notification/background awareness (PL-OPS-04)

**Research instruments retained behind engineering boundary (2):**
- Scenario Replay (PL-RESEARCH-03)
- Instrument Catalog Evolution (PL-RESEARCH-04)

---

## Unresolved Cases Requiring Principal Judgment

1. **PL-ARCH-06 (Recommendation Engine Ownership):** The reconciliation preserves this as unresolved. However, the Labs reconciliation (dead pipelines, drift risk) and the Deployment Opportunity concept (cross-strategy composition) both add pressure toward resolution. Should the Principal force a decision, or continue deferring until cloud deployment makes the answer obvious?

2. **Governance user-facing expression:** The reconciliation says "resolved by observed operator need." But the GOV-01 catalog gap and the PL-ARCH-01 instrument governance concept both suggest governance will eventually need *some* operator visibility. Should we design the minimal governance expression now (e.g., "why was this symbol excluded?" in the recommendation brief), or continue deferring until an operator explicitly asks?

3. **PL-EVID-01 (Historical Evidence Architecture) priority:** This is the single largest unresolved dependency that multiple items block on. Should it be elevated to an architectural design exercise (like the Situation Architecture was), or does it remain a future concern until cloud deployment provides the always-on substrate?

4. **Lab retirement sequencing:** Should dead-pipeline removal (PL-OPS-06) proceed immediately as a mechanical cleanup, or should it wait for the Application Shell / surface-topology design so that all structural changes happen coherently?

---

*This document is analysis. It does not edit parking-lot.md or propose implementation sequencing. The next step is Principal review, followed by parking-lot.md update and documentation-topology reconciliation.*
