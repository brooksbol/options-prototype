# Project Parking Lot

> The unprioritized roadmap. Every unfinished idea has a stable ID and explicit disposition. Nothing silently disappears.

**Last reviewed:** August 11, 2026 (holistic reconciliation per `docs/32-parking-lot-reconciliation.md`)

---

## Intake Discipline

1. New ideas receive a stable ID immediately.
2. Merges preserve explicit mapping from the original concept.
3. Nothing is removed without a recorded disposition.
4. No priority field. Sequence is determined by active project threads, not by row order.

---

## Active Items

### Principal Decisions (Unresolved)

| ID | Name | Summary |
|---|---|---|
| `PL-ARCH-06` | Recommendation Engine Ownership | Whether recommendation logic moves to backend or remains browser-local. Transitional per Retooling Charter. Evaluate against: determinism, reproducibility, auditability, policy authority, multi-user, latency, operational simplicity. Dead-pipeline drift risk and Deployment Opportunity composition add pressure but do not force the answer. |
| `PL-GOV-EXPR` | Governance Operator Expression | Does the operator need direct inspection, intervention, override, or audit of governance decisions? Possible expressions: invisible policy, explanation in rejected opportunities, progressive disclosure, audit tooling, or a true workflow. Resolve when observed operator need demonstrates it. |

### Accepted Direction (Design/Implementation Needed)

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-SHELL` | Application Coherence / Shell | Shared operating context, navigation, consistent evidence/session presentation, reactive recommendation trigger, context-preserving transitions, route topology (3 operational + engineering), vocabulary cleanup, Lab retirement. See `docs/32` §Application Coherence Initiative for sub-concerns. | Reconciliation F-12, ADR-011, ADR-012 |
| `PL-DEPLOY` | Deployment Opportunity / Unified Surface | Domain/composition concept within Decision: normalize strategy-specific candidates into mission-aware portfolio actions. Remaining work: normalized representation, cross-strategy comparability, generalized collateral, "wait" semantics, unified surface design. Buy-write mechanism is the next concrete implementation step. | Reconciliation F-13, Situation Architecture, Regime Objective Function |
| `PL-CLEANUP` | Active Holistic Cleanup | Remove vestigial scaffolding, dead pipelines, obsolete vocabulary. Implement reconciled surface topology. Align documentation with architecture. Sequenced after Application Shell design establishes the target. Absorbs former PL-OPS-02, PL-OPS-05, and Lab retirement implementation. | `docs/31`, `docs/32` |

### Implementation Work (Ratified Architecture)

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-UX-01` | Console: Decision Pressure | Implement ADR-013 dimension 2 — resolution proximity as operational interpretation of approaching decision points. Threshold calibration and visual encoding remain design decisions. | `26-operator-console-architecture.md`, ADR-013 |
| `PL-UX-04` | Console: Progressive Hydration | Treemap tiles should color progressively per-symbol as evidence arrives rather than batch-appearing after full coverage. Console implementation detail. | `26-operator-console-architecture.md` |
| `PL-ELIG` | Deployment Eligibility / Capacity Explanation | Transparency of why actions are available or unavailable: held/encumbered/free shares, executable contracts, collateral, exclusion reasons. General capability; call inventory observability is one case. | Evolved from PL-CALL-04 |
| `PL-EVID-03` | Conditioned Operating Opportunity: EP2 | Second entry point (existing open short puts) for conditioned call-environment evaluation. Receives the "existing-position PCS" child from retired PL-CALL-01. | `foundations/conditioned-operating-opportunity.md` |
| `PL-PORT-01` | Portfolio-State Maturity | Assignment transitions, richer encumbrance state, multi-account support (depends on PL-ARCH-03), aggregation, stale-balance warnings. Economics slice implemented; broader maturity remains. | `07-architecture-current.md` |
| `PL-PORT-02` | Production Accounting (remaining) | Distribution-character resolution, transferred-asset basis, persistence/multi-month, full audit-trail drill-down, lifecycle reconstruction. | `/app/production`, engineering-spikes |
| `PL-EXEC-01` | Trade Lifecycle Evolution | Full lifecycle beyond URL handoff: intended → submitted → working → filled → assigned → closed/rolled. Receives "call execution handoff" from retired PL-CALL-01. Connects to overlay strategy (roll/take-profit). | `src/execution/`, ADR-004 |
| `PL-GOV-01` | Governance Catalog Gap | Live catalog covers only 12 instruments. Name heuristic doesn't gate commodity/futures structure. Suspected gaps: UGA, DBC, CPER. Needs pipeline from 105-ticker validation to live catalog. Correctness defect in golden data. | `catalog-seed.json`, Governance correctness family |
| `PL-POL-04` | Policy Evolution / Governance Provenance | Full policy versioning, attribution, replay, inspectability, testability as complexity grows. Absorbs former PL-ARCH-04. | `07-architecture-current.md`, ADR-003, Governance provenance family |
| `PL-OPS-06` | Dead Pipeline Retirement | Remove `scanPuts()`, `scanCalls()`, `scanUniversePuts()` — zero runtime callers, duplicating live paths, creating drift risk. Active conformance/technical-debt work within the holistic cleanup. | Labs reconciliation |

### Unresolved Architectural Work

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-EVID-01` | Historical Evidence / Observation Architecture | Architecture for accumulating, storing, and analyzing observations over time. Must distinguish: market evidence history (Evidence Engine), portfolio observation history, Decision/recommendation history (ownership unresolved per reconciliation D-04), reconstructed lifecycle evidence, simulation artifacts. Foundational dependency for lifecycle assessment, opportunity observation, Level 3 models. | `foundations/policy-over-prediction.md` (guardrail), Historical/Observational family |
| `PL-EVID-02` | Lifecycle Assessment Evidence Domain | Formal domain for lifecycle quality: ingress, operating, egress. Partially implemented (PCS EP1). Depends on PL-EVID-01. Absorbs former PL-EVID-06 (score vs classification sub-question). | `foundations/conditioned-operating-opportunity.md` |

### Infrastructure Prerequisites

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-OPS-01` | Cloud Deployment | Always-on backend (Render or equivalent). Persistent SQLite. GitHub CI/CD. Independent of workstation. Prerequisite for PL-ARCH-03, PL-OPS-04, always-on observation. | `docs/24-cloud-deployment.md` |
| `PL-ARCH-03` | Security and User Accounts | Application-managed users, sessions, ownership boundaries. Depends on cloud deployment. | `10-backend-implementation-preferences.md` §5 |

### Blocked on External Dependencies

| ID | Name | Blocker | Concept Home |
|---|---|---|---|
| `PL-EVID-04` | Market-Priced Risk | Needs IV data source (Tradier sandbox lacks IV) | `foundations/market-priced-risk.md` |
| `PL-EVID-05` | Recommendation Set Analysis | Needs enrichment data (sector, industry classification) | `foundations/recommendation-set-analysis.md` |
| `PL-RESEARCH-01` | Universe Discovery | Needs paid provider tier for enumeration | `universe/`, `engineering-spikes/` |

### Exploratory / Far-Future Seeds

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-ARCH-02` | Situation-Governed Deployment Strategy | Temporal distribution, concentration limits, lifecycle management (roll/take-profit/hold), rung renewal cadence. Distinct from per-contract recommendation policy. A Situation/Mission concern. | Journal entries, Situation Architecture |
| `PL-ARCH-01` | Instrument Governance Modes | Per-instrument authorized operating modes beyond binary admission. Part of the Governance policy family. | `velvet-rope/` docs |
| `PL-POL-01` | Cash-Flow-Safe Recovery | Premium production may defer/mitigate NAV erosion while preserving recovery potential. Exploratory thesis for a future situation. | None |
| `PL-CALL-03` | Familiarity vs Favorites | Familiarity: inferred from history. Favorites: explicit designation. Separate concepts. Both depend on historical evidence and user accounts. | None |
| `PL-OPS-04` | Notification / Background Awareness | Push notifications or indicators when evidence state changes significantly. Depends on cloud deployment. | None |
| `PL-DEPLOY-02` | Opportunity Surface Observation | Temporal observation of recommendation surface output. Cross-cutting history capability with unresolved architectural ownership. Depends on PL-EVID-01 and likely cloud deployment. | Journal entry 2026-08-10 |

### Research Instruments (Engineering Boundary)

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-RESEARCH-03` | Scenario Replay | Activity document → state transitions → overlay implications. Engineering research instrument behind subordinate boundary. Not a product surface. | Journal entries |
| `PL-RESEARCH-04` | Instrument Catalog Evolution | Programmatic enrichment: sector, issuer, structural classification. Prerequisite for set analysis grouping and richer governance. Part of Governance golden-data family. | Code + catalog generation scripts |

---

## Capability Families

### Governance Family

| Responsibility | Description | Items |
|---|---|---|
| Governance policy | What instruments/actions are admissible or authorized? | PL-ARCH-01, automatic batch evaluation |
| Governance golden data | What do we know about instrument structure/classification? | PL-RESEARCH-04 |
| Governance provenance/scaling | How are decisions versioned, attributable, inspectable? | PL-POL-04 |
| Governance correctness | Where is the live catalog incomplete or wrong? | PL-GOV-01 |
| Governance operator expression | Does the operator need direct inspection/intervention? | PL-GOV-EXPR (unresolved) |

### Historical / Observational Family

| Domain | Source | Owner |
|---|---|---|
| Market evidence history | Provider acquisition | Evidence Engine (clear) |
| Portfolio observation history | Fidelity imports, lifecycle events | Portfolio Context / Production (clear) |
| Decision/recommendation history | Wheelwright's Decision output | **Unresolved** |
| Reconstructed lifecycle evidence | Combined market + portfolio + execution | PL-EVID-02, depends on PL-EVID-01 |
| Simulation/replay artifacts | Hypothetical state transitions | Engineering/research (PL-RESEARCH-03) |

---

## Strategy-Specific Semantics (Within Unified Deployment)

Puts, covered calls, and buy-writes serve one unified operator workflow but retain distinct:

- Evidence requirements
- Consequence math (collateral, assignment economics, appreciation geometry)
- Ranking considerations
- Explanation content
- Interaction patterns

This is the surviving concern from the retired desk-asymmetry question (formerly PL-UX-02). Resolution emerges through Deployment Opportunity implementation.

---

## Graduated / Closed Index

Items that have been implemented, superseded, or promoted to authoritative architecture.

| Former ID | Name | Disposition | Destination |
|---|---|---|---|
| #7 | PendingIntent vs Open-Order | Implemented | `src/execution/pending-intent.ts` |
| #8 | Backend Evidence Service | Implemented (Java) | `evidence-service-java/` |
| #9 | Backend Implementation Preferences | Followed | Implemented as specified |
| #11 | Continuous Acquisition | Implemented | Java acquisition worker |
| #12 | Canonical Session Validity | Implemented | Session gate (Java + TS) |
| #18 | Fidelity Broker Handoff | Implemented | `src/execution/fidelity-trade-link.ts` |
| #19 | Recommendation Brief | Implemented | `src/components/RecommendationBrief.tsx` |
| #20 | Progressive Disclosure | Implemented | Architecture doc ADR-005 |
| #24 | Wheelwright Naming | Implemented (convention) | ADR-002 |
| #29 | Midpoint Yield Convention | Implemented | `07-architecture-current.md` §Midpoint Economics |
| #31 | Four-Engine Decomposition | Promoted to ratified architecture | `07-architecture-current.md` §Conceptual Architecture |
| #17 | Product-Structure (umbrella) | Split | Heuristic/governance: implemented. Catalog: PL-RESEARCH-04. Strategy auth: PL-ARCH-01. |
| `PL-OPS-03` | Prior-Epoch Failed Scheduler Gap | Implemented (Java) | Recovery-probe mechanism, 8 tests |
| `PL-CALL-05` | Buy-Write Recommendation Board | **Promoted** (Aug 2026) | Buy-Write Deployment Mechanism — accepted direction within Decision domain. Board topology is implementation; concept is architecture. |
| `PL-DEPLOY-01` | Unified Capital Deployment Surface | **Promoted** (Aug 2026) | Deployment Opportunity — accepted architectural direction (reconciliation F-13). Implementation work retained as PL-DEPLOY. |
| `PL-POL-02` | Monthly Production Regime | **Promoted** (Aug 2026) | Graduated → Situation Architecture, Bridge Income, Regime Objective Function |
| `PL-API-01` | API Testability and Cacheability | **Promoted** (Aug 2026) | Principles graduated → Publication invariants, `contracts/evidence-snapshot-v1.md` |
| `PL-CALL-01` | Calls Horizon B | **Superseded** (Aug 2026) | Historical container closed. Children: existing-put PCS → PL-EVID-03; appreciation geometry → ADR-013 dim 3; call handoff → PL-EXEC-01 |
| `PL-CALL-02` | Calls Horizon C | **Superseded** (Aug 2026) | Historical container closed. Children: lifecycle linkage → PL-EVID-01/02; call discovery → Deployment Opportunity; longitudinal → Level 3 (far future); user state → PL-ARCH-03; lifecycle quality → PL-EVID-02 |
| `PL-UX-02` | Put/Call Desk Asymmetry (topology) | **Superseded** (Aug 2026) | Desk topology resolved by Deployment Opportunity. Strategy-specific semantics survive as §Strategy-Specific Semantics above. |
| `PL-DEPLOY-03` | Cross-Entry Multi-Path | **Superseded** (Aug 2026) | Emergent property of Deployment Opportunity model. Current implementation already handles it. |
| `PL-POL-03` | Portfolio Optimization Layer | **Superseded** (Aug 2026) | Situation Architecture + Deployment Opportunity provide the composition. |
| `PL-OPS-02` | Post-Retooling Craftsmanship Review | **Superseded** (Aug 2026) | Absorbed into active holistic cleanup (PL-CLEANUP). The trigger arrived. |
| `PL-OPS-05` | ADR Coverage Review | **Merged** (Aug 2026) | → Documentation Topology cleanup within PL-CLEANUP |
| `PL-ARCH-04` | Policy-Governance Scaling | **Merged** (Aug 2026) | → PL-POL-04 (same concern) |
| `PL-EVID-06` | Score vs Classification | **Merged** (Aug 2026) | → PL-EVID-02 (design sub-question) |
| `PL-REC-STATE` | Client-Local Recommendation State | **Merged** (Aug 2026) | → PL-ARCH-06 + PL-DEPLOY-02 (symptom of two tracked concerns) |
| `PL-CALL-04` | Call Inventory/Eligibility Observability | **Reframed** (Aug 2026) | → PL-ELIG (Deployment Eligibility / Capacity Explanation — broader concept) |
| `PL-RESEARCH-02` | Velvet Rope Evolution | **Dissolved** (Aug 2026) | Lab container retired. Surviving capabilities distributed into Governance family. |

---

## Merge / Split / Supersession History

| Source | Action | Destination(s) | Rationale | Date |
|---|---|---|---|---|
| Old #13 (Historical Analytics) | Expanded | `PL-EVID-01` | Now includes provenance/backfill distinction | Jul 2026 |
| Old #23 (Call Contract Quality) | Merged into | `PL-CALL-01` | Subsumed by Horizon B | Jul 2026 |
| Old #27 (Cloud deployment) | Stabilized as | `PL-OPS-01` | Constraints documented | Jul 2026 |
| Old #28 (Prior-epoch failed gap) | Renamed | `PL-OPS-03` | Clarity | Jul 2026 |
| `PL-OPS-03` | Graduated | Closed Index | Java recovery-probe implementation | Jul 2026 |
| Old #30 (Calls execution handoff) | Merged into | `PL-CALL-01` | Part of same milestone | Jul 2026 |
| Old #17 (Product-Structure) | Split | Graduated + PL-RESEARCH-04 + PL-ARCH-01 | Jul 2026 |
| Old #21 (Portfolio-State Maturity) | Retained | `PL-PORT-01` | Economics done; broader maturity remains | Jul 2026 |
| Old #6 (Write Intent / Lifecycle) | Retained | `PL-EXEC-01` | Handoff done; lifecycle incomplete | Jul 2026 |
| Old #4 (Put/Call Asymmetry) | Retained | `PL-UX-02` | Then superseded Aug 2026 | Jul 2026 |
| `PL-ARCH-04` | Merged | `PL-POL-04` | Same concern: policy governance at scale | Aug 2026 |
| `PL-EVID-06` | Merged | `PL-EVID-02` | Design sub-question of lifecycle assessment | Aug 2026 |
| `PL-REC-STATE` | Merged | `PL-ARCH-06` + `PL-DEPLOY-02` | Symptom of two tracked concerns | Aug 2026 |
| `PL-OPS-05` | Merged | `PL-CLEANUP` (doc topology) | Part of broader documentation authority reconciliation | Aug 2026 |
| `PL-OPS-02` | Superseded | `PL-CLEANUP` | Holistic cleanup IS this item's trigger | Aug 2026 |
| `PL-CALL-01` | Superseded | Children mapped to PL-EVID-03, ADR-013, PL-EXEC-01 | Historical container overtaken by architecture | Aug 2026 |
| `PL-CALL-02` | Superseded | Children mapped to PL-EVID-01/02, Deployment, PL-ARCH-03 | Historical container overtaken by architecture | Aug 2026 |
| `PL-UX-02` (topology) | Superseded | Deployment Opportunity | Desk question resolved; strategy semantics survive separately | Aug 2026 |
| `PL-DEPLOY-03` | Superseded | Deployment Opportunity model | Emergent property, already implemented | Aug 2026 |
| `PL-POL-03` | Superseded | Situation Architecture + Deployment Opportunity | Speculative layer not needed | Aug 2026 |
| `PL-RESEARCH-02` | Dissolved | Governance capability family | Lab container retired; capabilities survive | Aug 2026 |
| `PL-CALL-04` | Reframed/replaced | `PL-ELIG` | Broader Deployment Eligibility concept | Aug 2026 |
| `PL-CALL-05` | Promoted | Graduated/Closed | Buy-Write Deployment Mechanism accepted | Aug 2026 |
| `PL-DEPLOY-01` | Promoted | Graduated/Closed + `PL-DEPLOY` | Concept graduated; implementation work retained | Aug 2026 |
| `PL-POL-02` | Promoted | Graduated/Closed | Concept graduated into Situation/Bridge Income | Aug 2026 |
| `PL-API-01` | Promoted | Graduated/Closed | Principles graduated into publication invariants | Aug 2026 |

---

## Historical Context

The original July 2026 reconciliation audit is preserved at `docs/11-parking-lot-reconciliation.md`.

The August 2026 holistic reconciliation is documented at:
- `docs/30-architectural-baseline-inventory.md` — extracted architectural state
- `docs/31-architectural-reconciliation.md` — ratified architecture reconciliation
- `docs/32-parking-lot-reconciliation.md` — ratified parking-lot dispositions and capability families

---

## Source Integrity Note

The pre-reconciliation parking lot contained a duplicate ID: a row labeled `PL-ARCH-01` with content "Client-Local Recommendation State" appeared in the Historical Context section, colliding with the formal PL-ARCH-01 (Instrument Governance). During reconciliation this was given temporary identity `PL-REC-STATE` and merged into PL-ARCH-06 + PL-DEPLOY-02 as a symptom of those two tracked concerns.
