# Documentation Guide

> For project overview, development setup, and current status, see the [root README](../README.md).

This directory contains the architectural documentation for the Wheelwright Evidence Appliance.

---

## Reading Order

### System Identity and Governance

| Document | Purpose |
|----------|---------|
| `foundations/evidence-appliance.md` | What Wheelwright is — governing architectural concept |
| `foundations/retooling-charter.md` | Governance for the TypeScript → Java migration |
| `foundations/backend-behavioral-invariants.md` | 18 ratified invariants the system must satisfy |
| `foundations/closed-loop-engineering.md` | Engineering methodology (four nested feedback loops) |
| `foundations/policy-over-prediction.md` | Core design principle |

### Current Architecture

| Document | Purpose |
|----------|---------|
| `07-architecture-current.md` | Authoritative system architecture |
| `07a-component-map-current.md` | Module responsibilities |
| `07b-diagrams.md` | System data-flow diagrams |
| `07c-adrs.md` | 10 Architecture Decision Records |
| `contracts/evidence-snapshot-v1.md` | Frozen v1 API contract |

### Backend Design

| Document | Purpose |
|----------|---------|
| `08-adr-backend-evidence-service.md` | ADR: move acquisition to backend |
| `09-backend-evidence-service-design.md` | Backend design (16 sections) |
| `10-backend-implementation-preferences.md` | Technology choices (Java, SQLite, cloud) |
| `14-background-acquisition-design.md` | Acquisition worker architecture |
| `20-session-aware-acquisition.md` | Session gate design |
| `22-sqlite-persistence-design.md` | SQLite schema and persistence semantics |
| `foundations/acquisition-scheduler-policy.md` | Tiered A/B/C/D freshness scheduling |

### Scheduler and Evidence Semantics

| Document | Purpose |
|----------|---------|
| `15-evidence-state-semantics.md` | Trust, freshness, and validity vocabulary |
| `19-funnel-architecture.md` | Recommendation funnel stages |
| `21-write-desk-recomposition.md` | Evidence validity model and page architecture |

### Domain and Recommendation

| Document | Purpose |
|----------|---------|
| `00-project-charter.md` | Original vision and guiding principles |
| `02-domain.md` | Core domain model and glossary |
| `17-recommendation-funnel-analysis.md` | Why 49 of 496 — funnel behavior analysis |
| `18-recommendation-vocabulary-review.md` | Vocabulary dimensional analysis |

### Conceptual Foundations (not yet implemented)

| Document | Purpose |
|----------|---------|
| `foundations/conditioned-operating-opportunity.md` | Lifecycle quality concept |
| `foundations/market-priced-risk.md` | Research topic: market pricing as evidence |
| `foundations/recommendation-set-analysis.md` | Population-level observation concept |
| `foundations/three-actor-model.md` | Development methodology: Principal / Architect / Implementation Engineer |
| `foundations/cognitive-role-separation.md` | Product design principle: Explorer / Governor / Operator separation |
| `foundations/state-oriented-console.md` | Observable vs operational state |
| `foundations/principles-governance-model.md` | Principles as domain model |
| `foundations/secondary-observation.md` | Measurement reliability philosophy |

### Universe and Velvet Rope (dormant, architecturally valid)

| Document | Purpose |
|----------|---------|
| `universe/01-requirements.md` | Candidate universe requirements |
| `universe/02-design.md` | Candidate universe design |
| `velvet-rope/00-domain-model.md` | Admission domain model |
| `velvet-rope/01-requirements.md` | Admission requirements |
| `velvet-rope/02-design.md` | Admission design |
| `velvet-rope/03-product-structure-requirements.md` | Structural classification |
| `velvet-rope/04-product-structure-design.md` | Structural classification design |

### Engineering Spikes (reference)

| Document | Purpose |
|----------|---------|
| `engineering-spikes/api-ninjas-etf-catalog.md` | API Ninjas viability assessment |
| `engineering-spikes/fmp-etf-reference-data.md` | FMP ETF data assessment |

### Historical (superseded, retained for learning context)

| Document | Purpose | Successor |
|----------|---------|-----------|
| `03-requirements.md` | Slice 1 user stories | Write Desk (undocumented requirements) |
| `04-architecture.md` | Slice 1 architecture | `07-architecture-current.md` |
| `05-design.md` | Slice 1 implementation design | Current implementation |
| `05a-component-map.md` | Slice 1 component map | `07a-component-map-current.md` |
| `06-tasks.md` | Slice 1 implementation tasks | Completed |
| `09b-migration-and-impact.md` | TS→TS migration phases | Java retooling superseded this |
| `12-backend-thin-slice-proposal.md` | First backend extraction | Full Java backend |
| `13-proxy-efficiency-analysis.md` | Legacy proxy performance | Proxy retired |
| `16-bootstrap-throughput-design.md` | Cold-start throughput analysis | Redundant delays removed |
| `16a-bootstrap-throughput-completion.md` | Throughput fix report | Completed |

### Operational Reference

| Document | Purpose |
|----------|---------|
| `parking-lot.md` | **Canonical unprioritized roadmap** — all deferred ideas with stable IDs |
| `11-parking-lot-reconciliation.md` | Historical: July 2026 reconciliation audit |
| `07d-obsolete-docs.md` | Obsolescence assessment |
| `journal/project-journal.md` | Append-only chronological memory |
| `reference-data/xle-fidelity-2026-07-02.md` | Real options chain fixture |
| `discovery/00-design-notes.md` | Discovery architectural learning |

---

## Document Status Conventions

| Marker | Meaning |
|--------|---------|
| **Authoritative** | Describes the system as it currently exists |
| **Ratified** | Accepted architectural decision or principle |
| **Frozen** | Published contract — changes require versioning |
| **Design** | Accepted design not yet fully implemented |
| **Dormant** | Architecturally valid, not actively being built |
| **Historical** | Superseded — retained for project learning history |
| **Exploratory** | Concept under investigation, no implementation planned |
