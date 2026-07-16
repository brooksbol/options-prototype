# Project Parking Lot — Reconciliation Report

**Date:** July 2026
**Purpose:** Reconcile 25 parking-lot items against existing documentation. Identify status, overlaps, contradictions, and authoritative homes.

---

## Reconciliation Table

| # | Item | Existing Doc(s) | Status | Authoritative Home | Update Needed? |
|---|------|----------------|--------|-------------------|----------------|
| 1 | Instrument Governance | `velvet-rope/00-domain-model.md`, `velvet-rope/03-product-structure-requirements.md` | Exploratory | Velvet Rope docs | No — expand when implemented |
| 2 | Overlay Policy | None (journal references only) | Exploratory | New concept — needs home | Create stub when ready |
| 3 | Conditioned Operating Opportunity | `foundations/conditioned-operating-opportunity.md` | Documented (this session) | That document | No |
| 4 | Put Desk / Call Desk Asymmetry | None formal | Exploratory | Future design concept | No — record in this file |
| 5 | Recommendation Policy (versioned) | `07-architecture-current.md`, `07c-adrs.md` ADR-003 | Partially implemented | Architecture doc | No |
| 6 | Write Intent / Trade Lifecycle | `src/execution/write-intent.ts`, `07-architecture-current.md` | Partially implemented | Architecture doc | No |
| 7 | Pending Intent vs Open-Order | `src/execution/pending-intent.ts` | Implemented (this session) | Code + architecture doc | No |
| 8 | Backend Evidence Service | `08-adr-backend-evidence-service.md`, `09-backend-evidence-service-design.md` | Accepted, not implemented | Those documents | No |
| 9 | Backend Implementation Preferences | `10-backend-implementation-preferences.md` | Recorded (this session) | That document | No |
| 10 | Security and User Accounts | `10-backend-implementation-preferences.md` §5 | Recorded (this session) | That document | No |
| 11 | Continuous Acquisition | `09-backend-evidence-service-design.md` §2, §5 | Accepted; bridge implemented | Design doc + WriteDesk loop | No |
| 12 | Canonical Session Validity | `src/market-session/session-policy.ts`, `07-architecture-current.md` | Implemented (6-state model) | Architecture doc + code | No |
| 13 | Historical Analytics | `foundations/policy-over-prediction.md` (principle) | Exploratory | New concept — needs home when ready | No |
| 14 | Scenario Replay | Journal entries only | Exploratory | Future design concept | No |
| 15 | Universe Discovery | `docs/universe/`, `engineering-spikes/api-ninjas-etf-catalog.md` | Exploratory (spikes done) | Universe docs | No |
| 16 | Velvet Rope Evolution | `velvet-rope/00-domain-model.md` through `04-product-structure-design.md` | Designed, not implemented | Velvet Rope docs | No |
| 17 | Product-Structure Experiments | `velvet-rope/03-product-structure-requirements.md`, `04-product-structure-design.md` | Designed, not implemented | Velvet Rope docs | No |
| 18 | Fidelity Broker Handoff | `src/execution/fidelity-trade-link.ts`, `07-architecture-current.md` | Implemented | Architecture doc + code | No |
| 19 | Recommendation Brief | `src/components/RecommendationBrief.tsx`, `07-architecture-current.md` | Implemented | Architecture doc + code | No |
| 20 | Progressive Disclosure | `07-architecture-current.md`, `07c-adrs.md` ADR-005 | Implemented | Architecture doc | No |
| 21 | Portfolio-State Maturity | `src/write-desk/types.ts`, `07-architecture-current.md` | Partially implemented | Architecture doc + types | No |
| 22 | Notification and Background Awareness | None | Exploratory (far future) | Not yet — depends on backend | No |
| 23 | Call Contract Quality | None formal | Exploratory | Adjacent to item 3 (COO) | No |
| 24 | Wheelwright Naming | `07-architecture-current.md`, `07c-adrs.md` ADR-002 | Implemented (convention) | Architecture doc | No |
| 25 | Score vs Classification | `foundations/conditioned-operating-opportunity.md` §Open Questions | Open design question | COO document | No |

---

## Detailed Assessment

### Item 1: Instrument Governance Beyond Universal Wheel

**Existing documents:**
- `velvet-rope/00-domain-model.md` — defines UniverseMember, admission, operator dispositions
- `velvet-rope/03-product-structure-requirements.md` — defines ProductStructure value object, structural cautions
- `velvet-rope/04-product-structure-design.md` — design for product-structure inference

**Status:** Designed but not implemented. The Velvet Rope documents are architecturally valid and anticipated the need for structural classification. They correctly scoped "Strategy Authorization / Operating Modes" as out-of-scope for the first slice.

**Contradictions:** None. The parking lot expands the concept (authorized strategies per instrument) but doesn't contradict the existing design.

**Decision needed:** Whether "Instrument Governance" is a layer above Velvet Rope admission or a facet within it. The parking lot suggests they may be separate concepts. The existing design treats operating-mode authorization as future scope.

**Recommended action:** No document update now. When instrument governance moves from exploratory to design, extend or supersede the Velvet Rope documents.

---

### Item 2: Overlay Policy

**Existing documents:** None formal. Referenced in journal entries discussing DTE preferences.

**Status:** Exploratory. Not yet designed.

**Contradictions with existing:** The current `RecommendationPolicy.contractSelection` already contains `targetDte`, `eligibleDteRange`, `targetDelta`, and `preferredDeltaBand`. The parking lot asks whether additional facets (ladder spacing, simultaneous rungs, take-profit, roll policy) belong in RecommendationPolicy or in a separate Overlay Policy.

**Decision needed:** Is Overlay Policy a superset of Recommendation Policy? A sibling? Or a higher-level concept that decomposes into multiple recommendation policies?

**Recommended action:** No document yet. Record in this file. Create a design concept when the operator's preferred operating rhythm stabilizes.

---

### Item 3: Conditioned Operating Opportunity

**Existing documents:** `foundations/conditioned-operating-opportunity.md` (created this session)

**Status:** Documented. Design concept complete. Not implemented.

**Overlaps:** None. This is the authoritative document.

**Recommended action:** None needed.

---

### Item 4: Put Desk / Call Desk Asymmetry

**Existing documents:** None formal. The current `WriteDesk.tsx` has Put Candidates and Call Candidates sections but they share the same table structure.

**Status:** Exploratory. The current implementation treats puts and calls similarly in the UI but the domain logic is already asymmetric (puts use Wheelwright ranking; calls use inventory-driven scan).

**Decision needed:** When call coverage becomes richer, should Call Candidates become a separate "Call Desk" view or remain a section within the Write Desk?

**Recommended action:** No document yet. Record here. Revisit when call-side Wheelwright is designed.

---

### Item 5: Recommendation Policy (Versioned, Attributable)

**Existing documents:**
- `07-architecture-current.md` — documents policy as first-class object with current facets
- `07c-adrs.md` ADR-003 — rank independence from sort
- `src/write-desk/recommend.ts` — `RecommendationPolicy` type with `version`, `contractSelection`, `ranking`

**Status:** Partially implemented. Policy exists as a domain object with version string, contract selection, and ranking. Deployment, governance constraints, and full attribution (evidence snapshot + portfolio state → recommendation) are not yet implemented.

**Contradictions:** None. The parking lot extends the concept forward.

**Recommended action:** No update needed. The existing architecture doc correctly describes current state. Attribution and replay are future concerns.

---

### Item 6: Write Intent / Trade Lifecycle

**Existing documents:**
- `src/execution/write-intent.ts` — WriteIntent type and builder
- `src/execution/fidelity-trade-link.ts` — broker adapter
- `07-architecture-current.md` §Broker Handoff

**Status:** Partially implemented. WriteIntent → Fidelity URL works. Lifecycle beyond that (Working Order → Filled Position) is represented only as lightweight PendingIntent.

**Contradictions:** The earlier OpenOrder system (heavier, with cash computation) was replaced by PendingIntent. The parking lot correctly reflects the current lighter model.

**Recommended action:** None. Current architecture doc is accurate.

---

### Item 7: Pending Intent vs Open-Order Accounting

**Existing documents:**
- `src/execution/pending-intent.ts` — implementation
- `tests/execution/pending-intent.test.ts` — tests

**Status:** Implemented (this session). Fidelity balances CSV is authoritative for cash. PendingIntent exists for governance/duplicate-symbol only.

**Contradictions:** This **supersedes** the earlier OpenOrder system (deleted this session). The parking lot correctly reflects the corrected model.

**Recommended action:** None. Code and tests are current.

---

### Item 8: Backend Evidence Service

**Existing documents:**
- `08-adr-backend-evidence-service.md` — ADR
- `09-backend-evidence-service-design.md` — full 16-section design
- `09a-backend-diagrams.md` — diagrams
- `09b-migration-and-impact.md` — migration plan

**Status:** Accepted architectural direction. Not implemented.

**Contradictions:** `09-backend-evidence-service-design.md` §3 proposes TypeScript/Node. `10-backend-implementation-preferences.md` updates preference to Java/Spring Boot. Noted in §Relationship at end of preferences doc.

**Recommended action:** None needed — the contradiction is documented and intentional (preference update).

---

### Item 9: Backend Implementation Preferences

**Existing documents:** `10-backend-implementation-preferences.md` (created this session)

**Status:** Recorded as working assumptions.

**Recommended action:** None.

---

### Item 10: Security and User Accounts

**Existing documents:** `10-backend-implementation-preferences.md` §5

**Status:** Recorded as working assumption.

**Recommended action:** None.

---

### Item 11: Continuous Acquisition

**Existing documents:**
- `09-backend-evidence-service-design.md` §2 (product behavior shift), §5 (acquisition model)
- `src/components/WriteDesk.tsx` `handleScan` (bridge: single-click loop)

**Status:** Bridge implemented (single-click acquisition loop). Backend destination is designed but not built.

**Contradictions:** None. The bridge and destination are explicitly complementary.

**Recommended action:** None.

---

### Item 12: Canonical Session Validity

**Existing documents:**
- `src/market-session/session-policy.ts` — 6-state model, implemented
- `src/market-session/evidence-provenance.ts` — defined but not enforced in write path
- `07-architecture-current.md` §Market Session Model
- Journal entries on technical debt (provenance enforcement deferred)

**Status:** Implemented (6-state classification, session gating). Technical debt: provenance not enforced in provider write path.

**Decision needed:** When (if ever) to enforce full canonical provenance. The backend extraction may make this moot — the backend's transactional store provides natural provenance.

**Recommended action:** None. Debt is documented. Backend may resolve naturally.

---

### Item 13: Historical Analytics

**Existing documents:** `foundations/policy-over-prediction.md` establishes the principle that historical data should inform policy, not predict outcomes.

**Status:** Exploratory. No design.

**Recommended action:** No document yet. The principle doc provides the philosophical guardrail.

---

### Item 14: Scenario Replay

**Existing documents:** `04-architecture.md` mentions "Scenario Replay (State Transition Laboratory)" as a bounded context. Journal entries reference it.

**Status:** Exploratory. The bounded-context identification in the older architecture doc is historically valid but predates the current system.

**Decision needed:** Whether scenario replay operates on evidence snapshots (new model) or the older state-transition concept.

**Recommended action:** No update. Revisit when immutable evidence snapshots exist (backend Phase 3+).

---

### Item 15: Universe Discovery

**Existing documents:**
- `docs/universe/01-requirements.md`, `02-design.md`
- `engineering-spikes/api-ninjas-etf-catalog.md`, `fmp-etf-reference-data.md`
- `src/universe/sources/yahoo.ts` — current implementation (static 496)

**Status:** Requirements and design exist. Spikes explored external sources. Current implementation uses a static list.

**Contradictions:** None. The parking lot correctly positions this as future expansion of a working foundation.

**Recommended action:** None.

---

### Item 16: Velvet Rope Evolution

**Existing documents:** `velvet-rope/00` through `04` — comprehensive requirements and design.

**Status:** Designed, not implemented. The design is architecturally valid and forward-looking.

**Contradictions:** None with current system. The Write Desk currently bypasses Velvet Rope (uses Yahoo 496 directly). This is intentional prototype behavior, not a contradiction.

**Recommended action:** None.

---

### Item 17: Product-Structure Experiments

**Existing documents:** `velvet-rope/03-product-structure-requirements.md`, `04-product-structure-design.md`

**Status:** Designed. The ProductStructure type and inference logic are designed. The "controlled experiment" operating mode is called out as future scope.

**Contradictions:** None.

**Recommended action:** None.

---

### Item 18: Fidelity Broker Handoff

**Existing documents:** Code (`write-intent.ts`, `fidelity-trade-link.ts`), `07-architecture-current.md` §Broker Handoff, `07c-adrs.md` ADR-004

**Status:** Implemented and working. Empirically verified with live Fidelity.

**Recommended action:** None.

---

### Item 19: Recommendation Brief

**Existing documents:** Code (`RecommendationBrief.tsx`, `brief-builder.ts`), `07-architecture-current.md`

**Status:** Implemented. 5 sections + broker handoff + pending-intent warning.

**Recommended action:** None. COO (item 3) will eventually add an "If Assigned" section.

---

### Item 20: Progressive Disclosure

**Existing documents:** `07c-adrs.md` ADR-005, code (WriteDesk 3-band layout)

**Status:** Implemented.

**Recommended action:** None.

---

### Item 21: Portfolio-State Maturity

**Existing documents:** `src/write-desk/types.ts`, `src/write-desk/fidelity-snapshot.ts`, `07-architecture-current.md` §Portfolio Context

**Status:** Partially implemented. Current: demo + Fidelity CSV (positions + balances). Missing: assignment transitions, multi-account, aggregation, stale-balance warnings.

**Decision needed:** How much portfolio-state richness to build before the backend exists.

**Recommended action:** None now. The types are extensible.

---

### Item 22: Notification and Background Awareness

**Existing documents:** None.

**Status:** Exploratory (far future). Depends on backend service existing.

**Recommended action:** None. Record in this file only.

---

### Item 23: Call Contract Quality for Existing Holdings

**Existing documents:** None formal. Adjacent to `foundations/conditioned-operating-opportunity.md` but distinct (actual basis vs hypothetical basis).

**Status:** Exploratory. The current call scan (`scanCalls`) produces basic candidates but does not apply Wheelwright-style ranking or quality assessment.

**Decision needed:** Whether call quality uses the same Wheelwright engine with different parameters, or a fundamentally different model.

**Recommended action:** No document yet. When call-side Wheelwright is designed, it should reference COO (item 3) for the symmetry concept.

---

### Item 24: Wheelwright Naming

**Existing documents:** `07c-adrs.md` ADR-002, `07-architecture-current.md`

**Status:** Implemented convention. Domain classes use Wheelwright where it clarifies responsibility. Precise domain terms (RecommendationPolicy, WriteIntent) are preferred where they're clearer.

**Contradictions:** None.

**Recommended action:** None.

---

### Item 25: Score vs Classification

**Existing documents:** `foundations/conditioned-operating-opportunity.md` §Open Design Questions item 1

**Status:** Open design question. Applies to lifecycle quality, structural suitability, and symmetry.

**Decision needed:** When the first concept is ready for implementation.

**Recommended action:** None now. The question is well-framed in the COO document.

---

## Contradictions Identified

| Area | Older thinking | Newer thinking | Resolution |
|------|---------------|----------------|------------|
| Backend technology | `09-backend-evidence-service-design.md` proposes TypeScript/Node | `10-backend-implementation-preferences.md` prefers Java/Spring Boot | Documented as preference update. API contract is language-neutral. |
| Open orders | Earlier session implemented full OpenOrder system with cash reservation | Current session replaced with lightweight PendingIntent (no cash computation) | Resolved. Old code deleted. Fidelity balances are authoritative for cash. |
| Architecture doc generation telemetry | `07-architecture-current.md` mentions crawl cursor as a concern | Backend design eliminates cursor concept | No contradiction — backend supersedes frontend crawl. |
| Velvet Rope and Write Desk | Velvet Rope designed as admission gate before evaluation | Write Desk currently bypasses Velvet Rope (uses Yahoo 496 directly) | Intentional prototype behavior. Velvet Rope activates when implemented. |

---

## Items Requiring No Existing Document (First Appearance)

These items appear in the parking lot but have no prior formal document. They are correctly recorded here as their first written home:

| # | Item | Maturity | Suggested future home |
|---|------|----------|----------------------|
| 2 | Overlay Policy | Exploratory | `foundations/overlay-policy.md` when ready |
| 4 | Put/Call Desk Asymmetry | Exploratory | Future design concept doc |
| 13 | Historical Analytics | Exploratory | `foundations/` when principles are clear |
| 14 | Scenario Replay | Exploratory | Design doc when evidence snapshots exist |
| 22 | Notification | Far future | Design doc when backend is operational |
| 23 | Call Contract Quality | Exploratory | Adjacent to COO; design doc when call Wheelwright is planned |
| 26 | Recommendation Set Analysis | Documented concept | `foundations/recommendation-set-analysis.md` ✅ |

---

## Documentation Inventory (Current State)

### Authoritative (describes the system as it exists)

| Document | Covers |
|----------|--------|
| `07-architecture-current.md` | Full system architecture |
| `07a-component-map-current.md` | Per-module responsibilities |
| `07b-diagrams.md` | System diagrams |
| `07c-adrs.md` | 10 architecture decisions |
| `08-adr-backend-evidence-service.md` | Backend extraction decision |
| `09-backend-evidence-service-design.md` | Backend design (16 sections) |
| `09a-backend-diagrams.md` | Backend diagrams |
| `09b-migration-and-impact.md` | Migration plan |
| `10-backend-implementation-preferences.md` | Technology preferences |
| `11-parking-lot-reconciliation.md` | This document |

### Conceptual foundations (valid, inform design)

| Document | Covers |
|----------|--------|
| `foundations/policy-over-prediction.md` | Core principle |
| `foundations/closed-loop-engineering.md` | Engineering methodology |
| `foundations/three-actor-model.md` | Conceptual model |
| `foundations/secondary-observation.md` | Observation philosophy |
| `foundations/conditioned-operating-opportunity.md` | Lifecycle quality concept |
| `foundations/market-priced-risk.md` | Market pricing as evidence |
| `foundations/recommendation-set-analysis.md` | Population-level observation of ranked recommendations |

### Designed but not implemented

| Document | Covers |
|----------|--------|
| `velvet-rope/00` through `04` | Universe admission and product structure |
| `universe/01-requirements.md`, `02-design.md` | Universe management |

### Historical (Slice 1, retained for context)

| Document | Covers |
|----------|--------|
| `04-architecture.md` | Original Slice 1 + evolution appendix |
| `05-design.md` | Slice 1 implementation design |
| `05a-component-map.md` | Slice 1 components |
| `06-tasks.md` | Slice 1 task list |

### Reference

| Document | Covers |
|----------|--------|
| `00-project-charter.md` | Project intent |
| `01-environment.md` | Dev environment |
| `02-domain.md` | Original domain types |
| `03-requirements.md` | Slice 1 requirements |
| `discovery/00-design-notes.md` | Discovery thinking |
| `engineering-spikes/*` | Provider exploration |
| `reference-data/*` | Captured broker data |
| `development-machine.md` | Machine setup |
| `journal/project-journal.md` | Chronological memory |

---

## Summary

- **25 items** assessed
- **Fully implemented:** items 7, 12, 18, 19, 20, 24 (6 items)
- **Partially implemented:** items 5, 6, 11, 21 (4 items)
- **Documented concept, not yet implemented:** item 3 (1 item)
- **Accepted, deferred to backend extraction:** items 8, 9, 10, 11-destination (4 items)
- **Exploratory (no implementation planned yet):** items 1, 2, 4, 13, 14, 15-expansion, 16, 17, 22, 23 (10 items)
- **Open design questions:** items 25 (1 item — applies across multiple concepts)
- **1 contradiction resolved this session** (item 7 — OpenOrder replaced by PendingIntent)
- **1 contradiction documented** (TypeScript vs Java preference — intentional update)
- **0 duplicates created** — all items mapped to existing or new-this-session documents
- **1 architecture doc update recommended** — document Pending Intent as governance-only and Fidelity balances as authoritative cash

**Note on temporary homes:** Six items (2, 4, 13, 14, 22, 23) are recorded in this file as their first written appearance. This document is an **index and status ledger**, not a permanent concept home. When any of these items crosses from exploratory to active design, it should move to a focused concept document and this report should link to it rather than contain the explanation.
