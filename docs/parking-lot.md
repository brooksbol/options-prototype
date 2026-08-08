# Project Parking Lot

> The unprioritized roadmap. Every unfinished idea has a stable ID and explicit disposition. Nothing silently disappears.

**Last reviewed:** July 26, 2026

---

## Intake Discipline

1. New ideas receive a stable ID immediately.
2. Merges preserve explicit mapping from the original concept.
3. Nothing is removed without a recorded disposition.
4. No priority field. Sequence is determined by active project threads, not by row order.

---

## Active Items

### Architecture

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-ARCH-01` | Instrument Governance | Exploratory | Per-instrument authorized operating modes (Standard Wheel, Tactical Premium, etc.) beyond binary admission. | `velvet-rope/` docs |
| `PL-ARCH-02` | Overlay Policy | Exploratory | DTE laddering, simultaneous rungs, roll policy, take-profit — facets beyond current RecommendationPolicy. | Journal entries |
| `PL-ARCH-03` | Security and User Accounts | Seed | Application-managed users, password hashing, session cookies, user-ownership boundaries. Depends on cloud deployment. | `10-backend-implementation-preferences.md` §5 |
| `PL-ARCH-04` | Policy-Governance Scaling | Seed | How policy remains versioned, attributable, inspectable, testable as complexity grows. The architectural concern is scaling governance if rule complexity outgrows the current model. No technology selected. | None |
| `PL-ARCH-05` | Cache-Based Recommendation Trigger | Identified | Portfolio-dependent recommendation recomputation should be independently triggerable from cached evidence (IndexedDB). Must not depend on a changed backend ETag or new acquisition cycle. Currently works only via forced ETag reset. | None |
| `PL-ARCH-06` | Recommendation Engine Ownership | Identified | Recommendation generation, policy application, ranking, posture, and economic interpretation are currently browser-local (documented as transitional per Retooling Charter). No concrete migration path or durable ownership decision exists. Additionally, `src/imports/fidelity/parseActivity.ts` contains browser-owned Fidelity Activity History parsing with action classification — a separate instance of domain logic in the frontend that was explicitly bypassed for production accounting (backend authority). Goal: determine whether recommendation logic moves to the backend (likely for multi-user, auditability, single-source-of-truth) or remains browser-local with explicit architectural rationale. Exposed by the yield-suppression bug fix: a policy rule needed correction in multiple independent frontend pipelines. | `foundations/retooling-charter.md` (transitional boundary) |

### UX / Operator Experience

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-UX-01` | State-Oriented Operator Console | Partially implemented | First slice delivered (August 2026): DTE ladder, moneyness visualization, position-detail modal, application-scoped portfolio store, observation store, home route. Remaining: capacity/exposure summary, situation rendering, NAV/mission progress, action transitions with context preservation. | `foundations/state-oriented-console.md`, `26-operator-console-architecture.md` |
| `PL-UX-02` | Put/Call Desk Asymmetry | Active design question | Whether puts and calls ultimately require different evidence, ranking, presentation, workflows, or desk structures. Horizon A introduced shared-policy collapsible sections; deeper asymmetry unresolved. | `23-calls-architecture.md` |
| `PL-UX-03` | Evidence Freshness and Provenance Language | Identified | "Current" is misleading for sealed prior-session evidence. Needs consistent operator-facing language distinguishing observation time, session validity, provenance, and usability across badges, banners, and drawers. No change to evidence-validity policy. | None |

### Calls

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-CALL-01` | Calls Horizon B | Partially Delivered | Call drawer (identity, decision summary, position context, execution evidence, strike neighborhood, provenance) + Projected Call Surface (proposed-put entry point with representative contracts table) delivered. Remaining: existing-put PCS entry point, appreciation geometry, Fidelity call execution handoff. | `23-calls-architecture.md` |
| `PL-CALL-02` | Calls Horizon C | Exploratory | Historical lifecycle linkage, independent call discovery (instruments not yet owned), longitudinal call intelligence, user-specific state, lifecycle quality in ranking. | `23-calls-architecture.md` |
| `PL-CALL-03` | Familiarity vs Favorites | Seed | Familiarity is inferred from history/interaction. Favorites are explicit operator designation. Separate concepts that must not silently collapse. | None |
| `PL-CALL-04` | Call Inventory and Eligibility Observability | Near-term queued | The system computes portfolio capacity and exclusion state that the operator cannot fully inspect: existing short calls encumbering shares, per-symbol eligibility reasons, the relationship between held/encumbered/free shares and executable contracts, and truthful empty-state diagnostics. Does not include recommendation-policy changes, independent call discovery, or trade lifecycle. | `23-calls-architecture.md` |

### Evidence and Research

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-EVID-01` | Historical Analysis and Evidence Provenance | Exploratory | Native prospective observation + selective backfill. Explicit source type, provenance, methodology, lineage, confidence. No silent mixing of native and backfilled evidence. | `foundations/policy-over-prediction.md` (guardrail) |
| `PL-EVID-02` | Lifecycle Assessment Evidence Domain | Exploratory | Formal domain for lifecycle quality: ingress, operating, egress. Requires historical market evidence, execution evidence, and stable instrument/catalog identity. | Temporary home: `11-parking-lot-reconciliation.md` |
| `PL-EVID-03` | Conditioned Operating Opportunity | Partially Implemented | Evaluating call environment conditioned on a specific ownership basis. One computation, two entry points. Entry point 1 (proposed-put PCS) implemented in put drawer. Entry point 2 (existing-put) planned. | `foundations/conditioned-operating-opportunity.md` |
| `PL-EVID-04` | Market-Priced Risk | Exploratory | Read what the market communicates via IV, skew, OI depth. Translation, not prediction. Requires data source with IV (Tradier sandbox lacks this). | `foundations/market-priced-risk.md` |
| `PL-EVID-05` | Recommendation Set Analysis | Documented | Population-level observation of the ranked set (concentration, diversity, clustering). Pluggable grouping heuristics. | `foundations/recommendation-set-analysis.md` |
| `PL-EVID-06` | Score vs Classification | Open question | Whether lifecycle quality should produce a single numeric score or a multi-dimensional classification. | `foundations/conditioned-operating-opportunity.md` §Open Questions |

### Portfolio

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-PORT-01` | Portfolio-State Maturity | Partially implemented | Assignment transitions, richer encumbrance state, multi-account support, aggregation, stale-balance warnings, user-specific ownership state. Economics slice implemented; broader maturity remains. | `07-architecture-current.md`, `types.ts` |
| `PL-PORT-02` | Portfolio Production Accounting | First vertical slice delivered | Backend-authoritative monthly cash production assessment from Fidelity Activity History, with operator-facing frontend at `/app/production`. Backend: parsing, classification, economic decomposition, Treasury basis resolution, asymmetric realization, reconciliation, API. Frontend: CSV upload with localStorage persistence, hero production display, source breakdown, unresolved potential presentation, erosion, reconciliation issues, transaction summary. Validated against complete 183-row export. Remaining: distribution-character resolution, transferred-asset basis, persistence/multi-month, full audit-trail drill-down, lifecycle reconstruction. | `discovery/01-temporal-capability-vocabulary.md`, `engineering-spikes/fidelity-activity-history.md` |

### Execution

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-EXEC-01` | Write Intent and Trade Lifecycle Evolution | Partially implemented | Full lifecycle beyond URL handoff: intended → submitted → working → partially filled → filled → canceled → expired → assigned → closed/rolled. Fidelity handoff + PendingIntent implemented; deeper lifecycle incomplete. | `src/execution/`, ADR-004 |

### Operations

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-OPS-01` | Cloud Deployment (Evidence Appliance v1) | Accepted direction | Always-on backend on Render. Persistent SQLite. GitHub CI/CD. Independent of workstation. Sequenced after Java retooling acceptance. | `docs/24-cloud-deployment.md` |
| `PL-OPS-02` | Post-Retooling Craftsmanship Review | Parked | Clean Code, maintainability, structural cleanup. After behavioral parity, not during. Must not cause premature stylistic refactoring during parity work. | None |
| `PL-OPS-04` | Notification and Background Awareness | Far future | Push notifications or indicators when evidence state changes significantly. Depends on cloud deployment. | None |
| `PL-OPS-05` | ADR Coverage Review | Deferred | Repository-wide review to determine which major architectural decisions lack durable ADR rationale. Distinguish intentional decisions from incidental implementation evolution. Not exhaustive ADR production — identify gaps where retrospective ADRs would materially improve comprehension for future human and machine readers. After current Operator Console architecture work. | `07c-adrs.md` |
| `PL-OPS-06` | Dead Recommendation Pipeline Retirement | Identified | `scanPuts()`, `scanCalls()` (scan-orchestrator.ts) and `scanUniversePuts()` (universe-scanner.ts) have zero runtime callers — exercised only by tests. They independently implement recommendation/policy semantics duplicating the live `recommendPuts`/`recommendCalls` paths. Duplicated policy increases change blast radius and risks drift (demonstrated by the yield-suppression bug requiring correction in 5 places). Goal: remove dead paths or prove a concrete future use before retaining them. | None |

### Policy

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-POL-01` | Cash-Flow-Safe Recovery | Seed | Premium production may defer/mitigate NAV erosion while preserving recovery potential. Exploratory thesis, not established fact. | None |
| `PL-POL-02` | Monthly Production Regime | Seed | Explicit invariant: $X must be produced each month. May shape capital allocation, rung renewal, risk budget, income shortfall handling. Distinct from Cash-Flow-Safe Recovery. | None |
| `PL-POL-03` | Portfolio Optimization Layer | Seed | Future layer above evidence/recommendation. Wheelwright remains evidence+policy engine; optimization is separate. Capital allocation, production targets, diversification constraints. | None |
| `PL-POL-04` | Recommendation Policy Evolution | Partially implemented | Full policy versioning, attribution, replay. Current: version string + contract selection + ranking. Future: complete evidence snapshot + portfolio state → traceable recommendation. | `07-architecture-current.md`, ADR-003 |

### Research / Discovery

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-RESEARCH-01` | Universe Discovery | Exploratory (spikes done) | Automated ETF discovery via multi-provider catalog. API Ninjas + FMP spikes complete. Requires paid provider tier for enumeration. | `universe/`, `engineering-spikes/` |
| `PL-RESEARCH-02` | Velvet Rope Evolution | Designed | Multi-symbol batch evaluation, operator overrides, comparison view, stale detection. Design complete. | `velvet-rope/` docs |
| `PL-RESEARCH-03` | Scenario Replay | Exploratory | Activity document → canonical events → state transitions → overlay implications. Journal prototype exists. | Journal entries |
| `PL-RESEARCH-04` | Instrument Catalog Evolution | Partially implemented | Current: 1,280 descriptions from generation. Future: programmatic enrichment, sector, issuer, structural classification from providers. | Code + catalog generation scripts |

### API

| ID | Name | Maturity | Summary | Concept Home |
|---|---|---|---|---|
| `PL-API-01` | API Testability and Cacheability | Seed | Canonical request representations; deterministic semantics; ETag-friendly reads; read/write separation; explicit contracts. Design for both testability and cacheability. | `contracts/evidence-snapshot-v1.md` (partial) |

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
| #17 | Product-Structure (umbrella) | Split | Heuristic/governance: implemented. Catalog: `PL-RESEARCH-04`. Strategy auth: `PL-ARCH-01`. Workflow: `PL-RESEARCH-02`. |
| `PL-OPS-03` | Prior-Epoch Failed Scheduler Gap | Implemented (Java) | `evidence-service-java/.../SqliteEvidenceStore.java` (recovery-probe clause in `getPrioritizedWorkQueue`), `RecoveryProbeTest.java` (8 tests) |

---

## Merge / Split History

| Source | Action | Destination(s) | Rationale |
|---|---|---|---|
| Old #13 (Historical Analytics) | Expanded | `PL-EVID-01` | Now includes provenance/backfill distinction and evidence-type separation |
| Old #23 (Call Contract Quality) | Merged into | `PL-CALL-01` | Subsumed by broader Calls Horizon B |
| Old #27 (Cloud deployment) | Stabilized as | `PL-OPS-01` | Constraints documented |
| Old #28 (Prior-epoch failed gap) | Renamed | `PL-OPS-03` | Clarity |
| `PL-OPS-03` | Graduated | Graduated/Closed Index | Java implementation includes recovery-probe mechanism with 8 tests. Foundation doc updated. |
| Old #30 (Calls execution handoff) | Merged into | `PL-CALL-01` | Part of same milestone |
| Old #17 (Product-Structure) | Split | Heuristic: graduated. Catalog: `PL-RESEARCH-04`. Strategy auth: `PL-ARCH-01`. Workflow: `PL-RESEARCH-02`. |
| Old #21 (Portfolio-State Maturity) | Retained | `PL-PORT-01` | Economics implemented; broader maturity remains |
| Old #6 (Write Intent / Trade Lifecycle) | Retained | `PL-EXEC-01` | Handoff done; deeper lifecycle incomplete |
| Old #4 (Put/Call Desk Asymmetry) | Retained | `PL-UX-02` | Only UI sections implemented; deeper question unresolved |

---

## Historical Context

The original July 2026 reconciliation audit is preserved at `docs/11-parking-lot-reconciliation.md`. That document is a historical snapshot of the first comprehensive parking-lot inventory. It contains detailed per-item analysis and concept descriptions that informed this restructuring.
