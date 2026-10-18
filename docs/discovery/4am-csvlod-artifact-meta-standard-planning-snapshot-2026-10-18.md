# Wheelwright — 4AM CSVLOD Artifact Meta-Standard and Reconstruction Activity Snapshot

**Date:** October 18, 2026
**Status:** Historical planning/reconciliation snapshot — **NOT a ratified Standard, implementation grant, migration authorization, or amendment to ADR-023**.
**Verified source baseline before this snapshot:** `bef03dd5db7cfa770023fd0a46af30d315734023`.
**Ratified architectural authority:** `docs/07c-adrs.md`, ADR-023 (D1–D5), with reconciled Codex/Kiro qualifications.
**Related historical checkpoints:**
- `docs/discovery/4am-knowledge-architecture-learning-loop-snapshot-2026-10-18.md`.
- `docs/discovery/4am-successor-knowledge-architecture-preratification-2026-10-18.md`.
- `docs/discovery/4am-round6-api-reconciliation-2026-10-18.md` — preserved separate API workstream, not reopened.

## 1. Principal direction added since ADR-023

The Principal has now directed that the complete Kotusev CSVLOD set of **24 specific artifact types** form a *menu of useful artifact purposes* in Wheelwright's successor **documentation design and documentation operating model**. This does **not** mean 24 documents, a mandated package for every initiative, or adoption of enterprise architecture bureaucracy. The six categories — Considerations, Standards, Visions, Landscapes, Outlines and Designs — retain their artifact-purpose meaning; authority, subject, scope, realization state and time remain separate.

The Principal further directed that an early, foundational **meta-standard** determine deterministically:
- which artifact is warranted for each kind of learning/change/knowledge;
- what information each artifact owns and contains;
- how an existing artifact is selected over creation of a new one;
- what events trigger updates, version/applicability qualifications, consolidation, supersession and retirement;
- how artifact contents connect to the learning-feedback and assimilation model;
- how every artifact earns continued existence through identifiable use and value.

Exact Principal wording of the new request:
> "one of the first things we need to do is derive a deterministic set of rules for choosing artifacts and determining what information goes in which artifact, and how they get updated and how the fit into the feedback model and how the have to earn their existence through value. this will be one of our first standards. a meta-standard. i want no room for interpretation by agents as to how to work with these."

**This is an explicit requirement to design and independently challenge the meta-standard, not ratification of the candidate rules below.** Semantic ratification/architectural judgment itself cannot be invented by a classification algorithm; where inputs are insufficient or competing authority exists, deterministic handling should be **UNRESOLVED / escalate to rightful authority**, never actor guesswork.

## 2. Complete 24-artifact menu as considered in this session

**Considerations (business-focused rules):**
1. Principles.
2. Policies.
3. Conceptual Data Models.
4. Analytical Reports.
5. Direction Statements.

**Standards (IT-focused rules):**
6. Technology Reference Models.
7. Guidelines.
8. Patterns.
9. IT Principles.
10. Logical Data Models.

**Visions (business-focused structures):**
11. Business Capability Models.
12. Roadmaps.
13. Target States.
14. Value Chains.
15. Context Diagrams.

**Landscapes (IT-focused structures):**
16. Landscape Diagrams.
17. Inventories.
18. Enterprise System Portfolios.
19. IT Roadmaps.

**Outlines (business-focused changes):**
20. Solution Overviews.
21. Options Assessments.
22. Initiative Proposals.

**Designs (IT-focused changes):**
23. Solution Designs.
24. Preliminary Solution Designs.

The mapping above is the 24-item set discussed and proposed in this thread. The meta-standard design must verify subtype names and adaptations against Kotusev's source and the ratified Wheelwright architecture before accepting exact routing. The taxonomy must not override ADR-023's subject ownership or turn an artifact-type label into an authority status.

## 3. Provisional use/lifecycle groupings (not final routing rules)

- **Maintain as core, when meaningful:** Product/engineering principles, conceptual domain model, business capabilities, Product/external context, source and operational Landscapes, narrowly evidenced inventories and capability-to-realization mapping.
- **Maintain only where an established need exists:** governing policies, standards, selected technologies, reusable guidelines/patterns, logical data models, appropriate strategic and technical roadmaps.
- **Create for bounded decisions or consequential changes:** Solution Overviews, actual options comparisons, initiative proposals, Preliminary Designs and Solution Designs when uncertainty/reach requires them; not compulsory per-feature output.
- **Produce as evidence on demand:** analysis, experiments and research. Retain historical report; assimilate only justified surviving meaning.
- **Embed or project where preferable:** direction statements and operator-value/value-chain views, avoiding a second maintained strategy or duplicated domain definition.
- **Target states:** may be bounded change artifacts or maintained multi-initiative target references if they continue to serve a genuine consumer; do not overconstrain by label.

No artifact is intrinsically obligatory merely because it appears on the 24-item menu.

CSVLOD artifacts do **not** absorb or replace the EDGE/LVT strategy authority; canonical Domain Model and Product capability semantics; ADR/decision history; chronological journals; lightweight idea funnel; source provenance; end-of-session protocols; root `AGENTS.md`, `docs/AGENTS.md` and actor-specific cold starts. They are complementary, purpose-specific representations. Avoid separate manually maintained definitions in diagrams, inventories, portfolios, subject explanations and API documents.

## 4. Meta-standard: expected determinism and acceptance properties

**Provisional working name:** *Wheelwright Architectural Artifact Selection and Lifecycle Standard* (an application-scale CSVLOD **Standards** artifact with cross-framework applicability).

The intended standard must be precise enough that independent Codex, Kiro and ChatGPT instances resolve the same well-specified knowledge event to the same disposition or the same explicitly unresolved boundary.

Required sections/outputs to design:

1. **Input event types:** Principal statement or ratification; domain finding; Product capability/acceptance; ADR/architectural decision; research result; new initiative/idea; implementation/release; deployment/migration/config/retirement; external-contract or reference-data change; detected contradiction; defect finding.
2. **Canonical ownership classifier:** given subject, concern, status, applicability, version, authority and consumers, locate the existing maintained owner. One semantic definition, with architectural views referencing it.
3. **Routing matrix for all 24 CSVLOD artifact purposes** plus preserved non-CSVLOD structures. Specify when each is used, mandatory/prohibited/optional content, and where its authoritative claims originate.
4. **Selection precedence:** RECOVER → REUSE → COMPOSE → EXTEND → INVENT; update an existing suitable artifact or derive a view before creating a competing authority. Do not equate source event record and canonical assimilation destination.
5. **Creation value test:** explicit unique purpose, real consumer and question, failure of existing views to meet the need, maintenance/retirement ownership, defensible update trigger, proportionate information cost. If the test fails, don't create.
6. **Amendment/event triggers:** accepted semantic changes, Product acceptance, implemented/released capability, deployment/install/migration/config/retirement, change to external evidence validity, newly found uncertainty, authoritative reversal, and reconciled conflicts.
7. **Content contract per type:** required subject/scope, expected question answered, appropriate audience, evidence/authority and applicability, relationships to canonical subjects, current versus proposed versus installed, update source/triggers, provenance; prohibit private data replication without approved protection.
8. **Lifecycle and terminal states:** candidate, accepted maintained reference, on-demand work artifact, completed historical provenance, explicitly superseded or retired view; avoid treating accepted design as proof of installation.
9. **Assimilation disposition:** named affected canonical subject(s), justified change or no-change rationale, source provenance, downstream capability/contract/code/data/runtime/test implications; a learning or state-changing event need not create a new principle.
10. **Precedence/conflict/tie-breaking:** explicit exhaustive decision-tree branches; insufficient, mixed or contradictory evidence results in `UNRESOLVED`, with correct decision authority identified. No autonomous promotion from journal, code, experiment or extraction catalog to ratified architecture.
11. **Verifiable subset:** source link integrity, declared subject ownership, type selection attributes, active/superseded state, version/validity markers, missing context, competing authority references, completeness checks and known enforced-versus-merely-documented obligations, using existing tooling where possible.
12. **Adversarial case suite:** multiple independently cold-started actors apply the rules to the same ordinary and deliberately ambiguous real Wheelwright specimens. Must demonstrate identical choices or identical unresolved outcomes; count inconsistencies and operator interruptions.

**Value means engineering usefulness**, not maximum artifact inventory, governance compliance, word count or methodological purity. A correct but useless pile of artifacts fails the Principal's intent. The meta-standard must prevent the exact old pattern of every learning event producing another historical document while maintained understanding remains unchanged.

## 5. How this changes the planned concurrent activities

At baseline `bef03dd5db7cfa770023fd0a46af30d315734023`, ADR-023 has been ratified. Codex Workstream A's eight-part **candidate** packet (README/evidence inventory plus A1–A7) was supplied to ChatGPT as `wheelwright-workstream-a-2026-10-18-bef03dd5.zip`, reviewed as non-authoritative, and reported consistent with ADR-023. The package proposes maintained subjects, decision threads, assimilation, Position/governed-quantity exemplar and cold-start paths. It has not been accepted or migrated. Kiro Workstream B's comprehensive source-ledger/Principal knowledge catalog/decision inventory remains to be received for cross-workstream reconciliation.

**Priority addition — Meta-standard before broad assimilation or migration:**

**Codex Workstream A8 — Normative meta-standard candidate and deterministic specification.**
- Read ADR-023, existing A1–A7 candidate packet, existing closeout/idea/ADR mechanisms and authoritative CSVLOD reference.
- Design the unambiguous routing/ownership/content/lifecycle/value rules for the full 24-purpose menu and preserved non-CSVLOD artifacts.
- Define exhaustive input/output schema as editorial specification (not a code/DSL requirement), tie-breaking and explicit unknown/conflict dispositions.
- Cover subject-wise cutover, concern-specific authority, Meaning/State/Time, operational changes, protected disclosures, source-to-canonical assimilation and realization consequences.
- Include a small, realistic case suite with expected dispositions and counterexamples; provide enough information for an independent reviewer to falsify decisions.
- **Own the draft**, not Kiro's validation evidence or a parallel extraction task.

**Kiro Workstream B — Continue source excavation, plus independent rule falsification and specimens.**
- Preserve and safely classify its prior eight surveyor ledgers before they disappear, subject to actual mutation/disclosure authority; do not copy sensitive material into a general artifact.
- Continue Doc 61, Doc 81, full journal/backlog/ADR/research/source witnesses and prepare source-segment coverage ledger, complete Principal Knowledge Review Catalog, retrospective decision candidates and accepted Product precedents.
- Independently harvest representative knowledge events and lifecycle transitions for **meta-standard regression cases**: original Principal quote, ratified principle, provisional research, domain invariant, accepted capability, implemented-but-not-accepted surface, release/install change, legacy contract, time-limited provider fact, contradiction, idea intake and expired/superseded design.
- Once Codex's A8 candidate is available, **falsify** its routing, creation/value and lifecycle rules with the specimens; report divergent or ambiguous outputs without silently rewriting the Codex-owned standard.
- **Own evidence and challenges**, not the canonical meta-standard text.

**ChatGPT 4AM facilitator:**
- Reconcile A8 against B's real specimens and ADR-023; protect verbatim Principal meanings and artifact-purpose fidelity.
- Present only material ambiguities for Principal decision.
- Run or commission a bounded independent fresh-context cross-actor routing matrix test before proposed adoption.
- Prepare a later bounded ratification decision for the meta-standard; do not assume this snapshot ratifies it.
- Evaluate migration and context-injection/operating-model changes only afterward, under separately granted authorization.

**Dependency:** Codex can author A8 while Kiro continues extraction and prepares case evidence; neither actor should wait idly for the other. Formal adoption of artifact-selection rules and any historical migration should wait for evidence-backed rule falsification and Principal disposition. Both actors should remain aware of one another's specific ownership and avoid conflicting writes.

## 6. Preservation and explicit authorization boundary

This snapshot **updates the work plan and preserves Principal requirements**. It does NOT:
- ratify the artifact-selection meta-standard or make its candidate routing matrix normative;
- require every initiative to produce multiple CSVLOD artifacts;
- create, move, change or supersede canonical Product, domain, architecture or principle documents;
- rewrite ADR-023 or pre-existing snapshots;
- amend established end-of-session, idea-funnel or actor bootstrap protocols;
- alter application code, API, tests, data, installations, operations or brokerage state;
- authorize full historical migration, new tooling, independent enforcement/CI changes or actor operating-model redesign;
- override current repository mutation gates or authorize shared-file collisions;
- reopen PL-CLEANUP or the separate API Round 6 design.

**Current status:** Additional Principal requirements and concurrent workplan update preserved as a historical checkpoint, awaiting a separately reviewed and ratified meta-standard design. Workstream B and the remaining source survey are unfinished in this context.

**Next permitted planning step:** extend Codex A to A8; let Kiro B continue survey and supply independently sourced stress cases; reconcile, falsify, and seek explicit Principal ratification before artifact-rule adoption or migration.


---

## 7. Principal-designated canonical CSVLOD artifact reference — October 18, 2026

**Principal instruction:** "this is the canonical reference. persist it:" followed by the PDF URL below.

**Canonical external reference for the artifact taxonomy and its exact labels:**
https://eaonapage.com/Enterprise%20Architecture%20Artifacts%20on%20a%20Page.pdf

**Publication as retrieved:** *Enterprise Architecture Artifacts on a Page*, version 3.0, © 2026 Svyatoslav Kotusev, one-page PDF at eaonapage.com. The PDF was directly opened and visually inspected during this session. Preserve the canonical URL unchanged; do not treat older summaries or assistant-generated enumerations as more authoritative than the source diagram.

**Important correction for Workstream A8 and Kiro validation:** The 24-item list transcribed in §2 of this *earlier historical planning snapshot* was a **provisional conversation inventory** and is **not an independently verified transcription of the now-designated v3.0 diagram**. The actual PDF visibly includes artifact names such as **Technology Strategies, Architecture Strategies, Process Maps, Technology Inventories, System Portfolio Models, Asset Roadmaps, Product Roadmaps, Increment Overviews, Solution Briefs, Solution Options, and Increment Designs**, some of which are absent from the earlier list. The PDF also includes **Policies** and **IT Principles** as distinct named types; do not invent an additional official artifact type merely from an informal phrase such as "IT Policies."

**Required next handling:** Codex A8 must use the exact v3.0 PDF as the reference for the candidate artifact-type selection standard, perform and cite a full source-faithful taxonomy transcription, separate official subtype names from Wheelwright-specific adaptations, and explicitly reconcile every discrepancy with the earlier 24-item approximation. Kiro must independently verify the extracted names and stress-test routing from the original diagram. Neither may silently normalize conflicting lists. The Principal's choice of this canonical source governs the *reference selection*, not ratification of particular artifact routes, a new Standard, or implementation/migration permission.

**Security and lifecycle boundary:** Link to the public external PDF as source rather than indiscriminately committing a copy. The original URL is persistent source provenance, and changes to the externally maintained diagram require explicit version comparison before replacing this reference. All other ADR-023 protections remain in force.
