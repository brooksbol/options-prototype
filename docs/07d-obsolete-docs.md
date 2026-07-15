# Obsolete Documentation Assessment

**Date:** July 2026

This document identifies which existing documentation is now partially or fully superseded by the current system architecture.

---

## Fully Superseded (Historical Value Only)

These documents describe an earlier system that no longer exists in its original form. They should be retained for historical context but are no longer architecturally authoritative.

| Document | Original Purpose | Status |
|----------|-----------------|--------|
| `04-architecture.md` (Slice 1 sections) | Original single-page chain viewer architecture | **Superseded** by `07-architecture-current.md`. The "Architecture Evolution" appendix was a bridge; it is now replaced by a complete document. |
| `05-design.md` | Slice 1 implementation design (types, folder structure, component contracts) | **Superseded.** Describes MockMarketDataProvider, static JSON, synchronous interfaces. Current system uses async Tradier + IndexedDB. |
| `05a-component-map.md` | Slice 1 component responsibility map | **Superseded** by `07a-component-map-current.md`. Lists components that no longer exist in their original form (DeltaInput, MetricsPanel, OptionsTable as described). |

**Recommendation:** Add a header to each file: `> ⚠️ HISTORICAL — Superseded by 07-architecture-current.md. Retained for project learning history.`

---

## Partially Superseded

These documents contain valid concepts alongside outdated specifics.

| Document | Valid Portions | Outdated Portions |
|----------|---------------|-------------------|
| `04-architecture.md` "Bounded Contexts" section | The bounded-context identification (Options Evaluation, Opportunity Analysis, Universe Management, CSV Import) remains conceptually valid | Specific context relationships diagram is outdated — Velvet Rope and Opportunity Lab are dormant while Write Desk is operational |
| `03-requirements.md` | US-1 through US-6 are historically valid as Slice 1 requirements | Does not describe current Write Desk requirements (top-20 puts, policy controls, broker handoff, session governance) |
| `02-domain.md` | Core domain types (Underlying, Expiration, OptionContract) remain valid | Missing: PutCandidate, WriteIntent, RecommendationPolicy, MarketSessionClassification, WheelwrightBriefViewModel |

**Recommendation:** Leave as-is with a note that `07-*` documents are now authoritative for current architecture.

---

## Still Valid (No Changes Needed)

| Document | Reason |
|----------|--------|
| `00-project-charter.md` | Describes project intent — still accurate |
| `01-environment.md` | Development environment setup — still accurate |
| `foundations/policy-over-prediction.md` | Philosophical foundation — actively implemented in Wheelwright |
| `foundations/closed-loop-engineering.md` | Engineering methodology — actively practiced |
| `foundations/three-actor-model.md` | Conceptual model — still informing design |
| `foundations/secondary-observation.md` | Observation philosophy — still valid |
| `journal/project-journal.md` | Append-only history — always valid |
| `discovery/00-design-notes.md` | Discovery notes — reference material |
| `engineering-spikes/*` | Spike documentation — reference material |
| `universe/*` | Universe documentation — current |
| `velvet-rope/*` | Velvet Rope design — dormant but valid for future |
| `development-machine.md` | Machine setup — current |
| `reference-data/*` | Reference data — current |

---

## Recommended Actions

1. **Do not delete** any historical documents. They contain project learning context.
2. **Add deprecation headers** to `04-architecture.md` (Slice 1 sections), `05-design.md`, and `05a-component-map.md`.
3. **Point readers** to `07-architecture-current.md` as the authoritative source.
4. **Consider** writing a `03a-requirements-current.md` in a future pass to document Write Desk requirements formally (not in scope for this consolidation).

---

## Document Hierarchy (Current)

```
Authoritative (current system):
  07-architecture-current.md     ← Start here
  07a-component-map-current.md
  07b-diagrams.md
  07c-adrs.md

Still valid (foundations):
  00-project-charter.md
  01-environment.md
  02-domain.md (partially — types layer)
  foundations/*

Historical (Slice 1, retained for context):
  04-architecture.md
  05-design.md
  05a-component-map.md
  06-tasks.md

Reference:
  journal/project-journal.md
  discovery/*
  engineering-spikes/*
  universe/*
  velvet-rope/*
  reference-data/*
```
