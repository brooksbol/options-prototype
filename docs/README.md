# Documentation Guide

> For project overview, development setup, and current status, see the [root README](../README.md).

This directory contains the architectural documentation for the Wheelwright Evidence Appliance.

## Parking-Lot Continuation Rule — August 29, 2026

The canonical parking lot may span physical continuation files. `docs/parking-lot.md`, `docs/parking-lot-2.md`, and any later numbered continuations are **one logical Category C backlog**. Every cold start, scan, search, backlog review, and reconciliation must inspect the complete `docs/parking-lot*.md` sequence. File boundaries are pagination only; stable IDs, governance, and dispositions are global.

> **Authority note:** This continuation rule amends all references below that say only `parking-lot.md`; they mean the complete continuation sequence.

## Project-Journal Continuation Rule — September 3, 2026

The canonical project journal may span physical continuation files. `docs/journal/project-journal.md`, `docs/journal/project-journal-2.md`, and any later numbered continuations are **one logical Category C chronology**. Topical journal retrieval, context reconstruction, and chronological review must inspect the complete `docs/journal/project-journal*.md` sequence. File boundaries are pagination only; later continuations do not have lesser authority or durability.

> **Authority note:** References below to the project journal mean the complete continuation sequence.

## Material Idea Intake Rule — September 1, 2026

All material new ideas use one canonical intake/reconciliation pipeline governed by `foundations/idea-intake-reconciliation.md`:

> **Explore → Intake (`PL-*`) → Reconcile Strategy → Reconcile Architecture → Preserve Why → Decompose → Authorize/Implement**

The complete `docs/parking-lot*.md` sequence is the system of record for unresolved idea identity and disposition. GitHub issues, standalone discovery documents, prompts, and conversations may support an idea but do not replace its canonical `PL-*` identity. A Principal decision that an item is next establishes sequencing; it does not bypass reconciliation or design gates.

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

---

## Reading Paths

### Minimum Safe Bootstrap (5 documents)

Read these before doing any Wheelwright work. Produces safe operating competence in 30–60 minutes.

| # | Document | Why |
|---|----------|-----|
| 1 | `docs/README.md` (this file) | Orientation. Document index. Authority model. |
| 2 | `foundations/evidence-appliance.md` | What Wheelwright is. System identity. |
| 3 | `07-architecture-current.md` | Current system. Four Engines. Boundaries. Surfaces. |
| 4 | `07c-adrs.md` | Decisions that constrain changes. ADR-001 through ADR-013. |
| 5 | Complete `parking-lot*.md` sequence | What is active, deferred, and resolved. Read the original plus every numbered continuation. |

**When this is insufficient:** If you're touching architecture, designing a new subsystem, or need to understand *why* something is the way it is — continue to the comprehensive path.

### Comprehensive Architectural Orientation (13 documents)

Everything in the bootstrap, plus:

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

### Technology Quality / Day-to-Day Architecture

Read these when designing or reviewing implementation structure, evaluating technology condition, selecting engineering quality controls, planning a technology-optimization intervention, or executing the Principal-mandated quality program:

| Document | Why |
|----------|-----|
| `foundations/technology-quality-constitution-v1.md` | Ratified technology-quality principles, day-to-day architecture practice, operating model, and version-one baseline authorization |
| `technology-quality-program-v1.md` | Principal-ratified and mandated execution program: backlog/journal reconciliation, untouched baseline, balanced scorecard, technology-optimization roadmap, interventions, fitness controls, and steady-state operation |

### AI Actor Cold-Start Bootstrap

For a completely new ChatGPT thread or Kiro session starting from scratch. A one-line instruction such as "Bootstrap yourself for Wheelwright from GitHub" should lead an actor here.

| Document | Actor | Role |
|----------|-------|------|
| `bootstrap/chatgpt-cold-start.md` | ChatGPT | Reasoning partner bootstrap — role, authority retrieval, epistemic discipline |
| `bootstrap/kiro-cold-start.md` | Kiro | Repository-resident architect/implementation partner bootstrap |
| `bootstrap/project-memory-protocol.md` | Shared | Documentation diligence / project-memory synchronization protocol |
| `foundations/multi-actor-repeatability-temporal-synchronization.md` | Shared | Ratified temporal synchronization, convergence, and scoped execution-ownership methodology |
| `foundations/idea-intake-reconciliation.md` | Shared | Mandatory methodology whenever a material new idea is being considered or handed off |

**Lookup path:** Actor finds `docs/README.md` → reads this section → follows actor-specific bootstrap → follows shared protocol → follows the multi-actor repeatability methodology → follows Minimum Safe Bootstrap reading path above → begins substantive work. For a material new idea, the actor must also follow `foundations/idea-intake-reconciliation.md`.

---

## Complete Document Index

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
| `foundations/regime-objective-function.md` | Operating regime definition |
| `foundations/acquisition-scheduler-policy.md` | Current acquisition behavior |

### B. Ratified Decision / Accepted Design

Constrain future evolution. Describe what was decided and why. May be ahead of implementation.

| Document | Substatus |
|----------|-----------|
| `07c-adrs.md` | Ratified decisions (ADR-001 through ADR-013, append-only) |
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
| `foundations/three-actor-model.md` | Ratified methodology |
| `foundations/architectural-evolution-methodology.md` | Ratified methodology |
| `foundations/strategy-architecture-reconciliation.md` | Ratified methodology (strategic roadmap ↔ architecture roadmap reconciliation, exploration freedom, and evidence-driven course correction) |
| `foundations/idea-intake-reconciliation.md` | Ratified methodology (material idea discovery → canonical intake → strategic/architectural reconciliation → why-state → decomposition/authorization) |
| `foundations/technology-quality-constitution-v1.md` | Ratified methodology (technology-quality constitution, operating model, day-to-day architecture practice, and baseline authorization) |
| `foundations/multi-actor-repeatability-temporal-synchronization.md` | Ratified methodology (temporal synchronization, convergence, and scoped execution ownership extending project memory) |
| `foundations/conditioned-operating-opportunity.md` | Accepted direction (partially realized) |
| `bootstrap/project-memory-protocol.md` | Ratified methodology (documentation diligence / project memory) |
| `foundations/parking-lot-continuation-governance.md` | Ratified methodology (one logical parking lot across physical continuation files) |

### C. Canonical Project / Operational State

Authoritative for their specific project concern. Not system-definition documents.

| Document | Domain |
|----------|--------|
| `roadmap.md` | Current strategic roadmap (Vision → Goals → Bets → Initiatives) |
| `architecture-roadmap.md` | Current architecture-roadmap pressure and intended structural evolution |
| `technology-quality-program-v1.md` | Principal-ratified and mandated technology-quality program state and execution plan |
| `parking-lot.md` + numbered continuations | One canonical backlog and material-idea intake registry expressed across physical pages |
| `journal/project-journal.md` + numbered continuations | One canonical chronology expressed across physical continuation files |
| `contracts/evidence-snapshot-v1.md` | Frozen API contract (v1) |

### D. Reconciliation / Checkpoint Artifacts

Durable evidence of how we arrived at the current state. Ratified and important — but their consequences should be absorbed into A/B/C, not continuously synthesized alongside them.

| Document | Role |
|----------|------|
| `30-architectural-baseline-inventory.md` | Extracted baseline checkpoint (August 2026) |
| `31-architectural-reconciliation.md` | Ratified reconciliation record |
| `32-parking-lot-reconciliation.md` | Ratified parking-lot disposition record |
| `33-strategy-roadmap-checkpoint.md` | Ratified roadmap/operating-model baseline and normalization provenance (August 31, 2026) |
| `foundations/step4-conformance-assessment.md` | Retooling conformance checkpoint |

### E. Current Specialized Reference

Useful and correct within their bounded subject. Non-governing outside that scope.

| Document | Subject |
|----------|---------|
| `01-environment.md` | Development environment contract |
| `02-domain.md` | Core domain model (partially incomplete) |
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
| `development-machine.md` | Hardware spec |
| `velvet-rope/*` | Universe admission domain model (dormant) |
| `universe/*` | Candidate universe design (dormant) |
| `engineering-spikes/*` | API feasibility assessments |
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
