# Wheelwright — Successor Knowledge Architecture: Consolidated Proposal and Bounded Ratification Surface
**Date:** October 18, 2026
**Status:** 4AM pre-ratification design proposal and historical reconciliation checkpoint. **NOT RATIFIED**. This record does not modify existing Product, domain or architectural authority, authorize migration/implementation, or authorize brokerage/operational changes.
**Source baseline:** accepted main `f2f9022592d9280ae8666ad25d84e3300a107604` verified before writing.
**Prior knowledge checkpoint:** `docs/discovery/4am-knowledge-architecture-learning-loop-snapshot-2026-10-18.md`.
**Separate preserved API boundary:** `docs/discovery/4am-round6-api-reconciliation-2026-10-18.md`; unchanged and out of scope.
**Inputs:** Principal discussion in this October 18 documentation-architecture thread; Codex independent product-maturity blind-spot assessment supplied in conversation; Kiro independent product-maturity blind-spot assessment supplied in conversation; preceding independent knowledge surveys and structural-remediation reviews preserved in previous snapshot. The latest Codex and Kiro reviews are conversation-provided findings; their full review artifacts are not being represented as repository files.

## 1. Why a successor is required

The Principal describes a foundational learning-loop failure, not a backlog of documentation bugs:
> "we learn something, we leave it where it is"

The intended cumulative loop was observation → learning → reconciliation → maintained understanding → recovery and application → more learning. In practice, repository archives and checkpoint records grew without reliably updating an integrated account of what Wheelwright currently knows. Fresh actors need the Principal to point to numbered documents or reconstruct meaning from historical discussion. The objective:
> "i want every new thread to know what's important. i never want to have to say \"it's in the repo\" again."

A second new Principal architectural premise for this review:
> "with the transition to v2, we are no longer building a prototype."

The target is an enduring, evolving software Product. Therefore it needs durable knowledge not only of meaning, but also **state** (what is actually built, installed and running) and **time** (versions, historical applicability and validity of observations).

## 2. Proposed architecture — core separation

**Maintain an authoritative and navigable account of current knowledge, distinct from the historical record of learning.** EDGE and application-scale CSVLOD are useful *views and organizing vocabularies*, not sufficient substitutes for canonical semantic ownership.

The integrated design has three orthogonal dimensions:
- **Meaning:** Product purpose, Principal philosophy, LVT strategy, canonical domain semantics, business capabilities, accepted Product behavior, architecture, contracts and engineering understanding.
- **State:** proposed/accepted/engineered/released/installed/running/verified realizations, which may coexist for the same capability. Source, tests and release/deployment/asset evidence differ. No timestamp-free assertion of live operation.
- **Time:** applicability of domain semantics, policy, supported contracts, releases, retained historical records, external evidence and configuration, including effective and observation times, version identities, validity horizons and supersession.

**Do not turn these dimensions into three disconnected trees or assume a single linear lifecycle.** A capability identity persists while realizations and their acceptance/evidence states vary.

### 2.1 Product / EDGE

Preserve the existing canonical LVT Vision and Goals unchanged. EDGE organizes Vision → Goals → Bets → Initiatives, with measures, hypotheses, experiments, outcomes and feedback. The original LVT Vision in `docs/roadmap.md` is:
> Wheelwright is a continuously operating options-income decision system that connects evidence, choices, and consequences—helping the operator understand what is happening, what can be done, what could happen, and what actually happened.

Product philosophy, Principal exact words, enduring capabilities, operator experiences and accepted precedents must remain discoverable without being nested under an ephemeral initiative. The Principal's six personal motivations are distinct from formal LVT Goals; their existing durable record is `docs/foundations/principal-personal-objectives-2026-10-14.md`.

### 2.2 Canonical domain and capability subjects

Maintain one technology-independent canonical domain-semantic collection describing Wheelwright's economic/decision world: Contracts, Positions, Accounts, capital, obligations, Constructions, governed quantities, operating regimes, evidence, provenance, identity/time, decisions, execution and outcomes. Use coherent subject explanations rather than huge numbered encyclopedias or a normative claim-card database. Particular assertions may require explicit distinct standing/scope/source/effective dates. This collection owns meaning; code, REST API and broker dialects represent it but do not independently redefine it.

Business capabilities describe operator outcomes and actions; they are derived from required Product behavior and operator questions, not enumerated from ontology nouns or current endpoints. Capabilities and domain knowledge have reciprocal relationships. One capability may span several subjects/components and one component may implement parts of multiple capabilities.

An **application-scale capability-to-realization map** may put business and system views in one maintained capability record provided business meaning does not collapse into source inventory. Preserve Product acceptance, engineering acceptance, implementation, released, installed and operationally verified evidence as independently qualified dimensions.

### 2.3 Architecture / adapted CSVLOD

Use Kotusev's categories proportionately:
- **Considerations** — business-facing rules, constraints and conceptual models.
- **Standards** — reusable technical direction, contracts and architectural constraints where appropriate.
- **Visions** — business-facing structural/capability views.
- **Landscapes** — actual technical structures and relationships.
- **Outlines** — bounded business-facing solution changes (reuse existing Solution Overview concept).
- **Designs** — technical realizations of changes (reuse existing Solution Design concept).

CSVLOD is an artifact-purpose taxonomy, **not** an authority ladder, a rigid folder prescription or an obligation to create six documents per initiative. Preserve a concise strategy–architecture pressure/transition bridge.

At application scale, Landscapes need at least distinguishable:
- **Source/system Landscape:** components, repositories, clients, APIs, storage structures, dependencies, responsibility and capability coverage.
- **Installed/operational Landscape:** source/release lineage, actual executable/artifact, installed instance/environment/config, retained data/migration status, external dependencies, recovery assets and time-qualified running observations.

An Enterprise System Portfolio is not needed as enterprise bureaucracy; a compact capability-to-component/release/instance map is useful because Wheelwright contains distinct runtimes, clients and durable data.

### 2.4 Concern-specific authority rather than one document outranking all reality

A maintained explanation integrates, qualifies and routes to authoritative expressions without automatically replacing them:
- **Product intent/accepted behavior:** applicable Principal-ratified Product authority and acceptance specimens.
- **Domain meaning/policy:** accepted canonical semantics and their applicable revisions.
- **External mechanics/provider observation:** authoritative external rules and qualified, dated broker/provider evidence.
- **Wire contracts:** accepted machine-readable OAS and other frozen contract artifacts where they own the transport surface.
- **Implemented behavior:** identifiable source/test evidence, including limits of actual enforcement.
- **Installed/running state:** actual release, configuration, data and time-specific operational evidence.

Subject, artifact purpose, authority, lifecycle, applicability, implementation and installed state remain distinguishable. Neither a later source commit nor a later paragraph automatically overrides historical or still-supported contracts.

### 2.5 Versioned applicability and compatibility

A mature Product may simultaneously have a target semantic model, a still-supported v1 contract, implemented v2 semantics, and historical records whose meaning is pinned to older policies/evaluators. Maintain a single owner with version/scope qualifications sufficient to interpret each correctly. Do not automatically reinterpret historical records using today's definitions; do not version every paragraph unless compatibility requires it.

Record external evidence and reference data with observation period, applicable environment, currency/validity horizon and revalidation conditions. A stable concept is not the same as a permanently valid provider-specific mapping.

### 2.6 Learning assimilation **with consequences**

Preserving new evidence and a decision checkpoint is not sufficient. For consequential learning, identify the surviving implication for a **named maintained subject**, including a deliberately bounded non-generalization when appropriate.

Possible dispositions: add/refine/narrow/refute a claim; record explicit uncertainty; affirm without change; retain local observation without promoting it.

In addition to a proposed `Canonical Delta` (new/changed/superseded maintained meaning, or reason for no change), represent the **impact on Product realization**:
- editorial clarification only;
- newly discovered divergence between canonical meaning and implementation;
- accepted change not yet realized;
- contract/data/compatibility migration required;
- evidence or authority insufficient to decide.

Connect affected capabilities, contracts, tests, release/deployment/state/verification. A knowledge edit is **never** silent authorization for code, deployments or migrations. The Canonical Delta is a design proposal for reusing existing closeout/intake/defect/acceptance mechanisms, not a newly ratified process or approval gate.

### 2.7 Historical decision threads and preserved provenance

Retrospectively survey consequential Product, domain and architectural decisions, beyond ADR-001–022. Reconstruct decision threads including the original question, then-available evidence/alternatives, recorded Principal wording and authority, rationale, expected consequences, later observations, amendments and scoped supersession. Distinguish decision date from reconstruction date and never manufacture ratification or retrospective hindsight.

Preserve complete journals as a linear story; the spontaneous idea funnel and periodic roadmap review; end-of-session protocols; original numbered/discovery/research/checkpoint evidence; root `AGENTS.md` and `docs/AGENTS.md` as canonical entry points; and actor-specific cold starts (Codex, Kiro, ChatGPT, Muse, etc.).

### 2.8 Context assembly and audiences

Root `AGENTS.md` → `docs/AGENTS.md` → actor-specific cold start remain entry points, dispatching to compact always-relevant Product/philosophy/domain/architecture context and task-specific maintained subjects, with historical evidence on demand. Bootstrap must demonstrate recovery and **application**, not merely report that files were read. Do not blindly load all historical documents.

Actors and readers do not all get the same disclosure: operator/integrator/maintainer/architect/independent researcher contexts have different needs. Do not inject protected financial/device or credential information or desired research conclusions into contexts that should not receive them. Derived manuals and presentations retain traceability to authoritative sources.

## 3. Independent product-maturity findings — precise attribution and limits

**Codex (independent conceptual review, verified main `f2f9022592d9280ae8666ad25d84e3300a107604`):**
1. Versioned meaning and applicability beyond simple supersession — fundamental.
2. Concern-specific contractual authority: canonical prose must not compete with OAS, external financial rules, implementation or operational evidence — fundamental.
3. Operational Landscape: capabilities → implementation → release → installed instance/config → retained data/dependencies — fundamental.
4. Assimilation consequence tracking beyond editorial change — fundamental.
5. Support/recovery knowledge (symptoms, diagnostics, verified recovery) — important.
6. Time-bound external and provider evidence — important.
7. Audience/research independence and disclosure boundary — important.
It explicitly advises against enterprise portfolio tooling, broad knowledge graph, invented multi-region commitments or extra governance for its own sake. These findings concern the **proposed documentation architecture**, not claims that the corresponding Product mechanisms are entirely absent.

**Kiro (independent local engineering review, same verified main; some assertions observed on one machine and may be time-limited):**
1. Reported v1 on :3100 via `gradlew bootRun` from editable working tree, v2 installed JAR on :3101, `ww`/backend separate release lineages, and no component-reported version. Source/installed/running identities are different. **Observation as-of this review; not a perpetual runtime claim.**
2. Several implementations of Positions, capital calculations and market calendar; Product, engineering and installed acceptance stages diverge.
3. v1 and v2 databases reportedly share migration chain; a v1 applied `002_priorities.sql` was not found in Git history; historical policy/evaluator versions matter to replay. Requires verification before remediation.
4. Reported launchers/backups/recovery assets outside Git and an 8 GB M1 MacBook Air host; no documented backup policy found in review. No secret paths/values required in the new canonical description.
5. Reported `TradingCalendar.KNOWN_YEARS = Set.of(2026)` and copied calendars, with suspected 2027 holiday misclassification **inferred from code, not operationally observed**. This is separately actionable operational risk, not taxonomy scope.
6. CLI TSV/JSONL formats may serve scripts but lack an explicit compatibility commitment comparable to HTTP and frozen v1 snapshot.
7. Tests named for invariants do not by themselves establish CI enforcement; report witnesses and execution modes accurately.
8. Reported 14 tracked documents containing 21 full Fidelity-style account identifiers and a machine-document containing device identifiers. **Counts are Kiro-reported and not independently confirmed here. Do not reproduce the values.** Any retrospective survey/assimilation must limit sensitive data propagation and determine protective treatment before bulk migration.
9. Transitional v1, `tt`, CSV, authorization, host and migration arrangements reportedly lack explicit exit criteria.
10. Capability-level operational expectations and v2 health behavior need better representation; a reported missing health endpoint should be confirmed before technical action.

These operational findings are evidence that the information architecture must model real running state, time and disclosure; they are **not** permission to file/fix those defects or modify the runtime.

## 4. Consolidated pre-ratification design choices

The Principal has already selected EDGE/LVT and application-proportional CSVLOD as direction and preserved the LVT vision, journals, idea funnel, closeout protocols and AGENTS entry points. This checkpoint asks only about the **successor architecture's foundational relationships**.

**D1 — Canonical knowledge ownership and views.** Accept coherent maintained subject knowledge (especially one domain-semantic collection) as current meaning; EDGE and CSVLOD are linked strategic/architectural views, not competing definitions; historic originals remain provenance.

**D2 — Meaning/State/Time and concern-specific authority.** Require versioned applicability, distinct Product/contract/implemented/installed/running truth, concern-specific authoritative artifacts, a system/operational Landscape, and time-qualified observation/evidence. No demand for enterprise portfolio software.

**D3 — Learning assimilation and Product consequences.** Adopt an explicit, lightweight relation from accepted learning to affected maintained subject, and explicitly classify whether the impact is editorial, implementation divergence, accepted-unrealized change, compatibility/migration, or still uncertain. Reuse established protocols later; do not authorize changes now.

**D4 — Retrospective provenance and Principal review.** Reconstruct decision threads with historical fidelity, retain complete journals, and prepare a source-grounded Principal Knowledge Review Catalog preserving exact wording, variants, status and proposed canonical placement. Review catalog and source-segment ledger are **non-normative survey products**.

**D5 — Context delivery and safe disclosure.** Keep root/docs AGENTS and actor-specific bootstraps; require foundational and task-relevant context delivery, applied-recovery falsification, and a protective information-classification boundary before bulk historical extraction/migration. Propose rather than assume exact control/tooling.

These are five **architectural decisions**, not five new committees, registries or documents. Avoid bundling acceptance of an abstraction with authorization to change code or infrastructure. Physical directory names, strict page lengths, every claim ID, automatically generated freshness checks, probe design, release version endpoints, new workflow enforcement and pilot subject choice remain later design decisions.

## 5. Candidate information architecture (conceptual, not ratified paths)

- Entry: `AGENTS.md`, `docs/AGENTS.md`, actor-specific bootstraps; question/topic navigation.
- Canonical subjects: Product purpose/philosophy; LVT strategy; economic/domain semantics; business capabilities and accepted behavior; system realization; standards/engineering and research understanding.
- Architectural views: CSVLOD Considerations, Standards, Visions, Landscapes (source + operational), Outlines, Designs; architecture evolution / pressure bridge.
- Contracts and external evidence: machine-readable API and other supported interface contracts; provider dialects/assumptions/validity; security and disclosures.
- History: Product/domain/architecture decision threads; chronological journal; idea intake; original research/discovery/experiments/checkpoints.
- Supporting non-normative products: Principal statement/knowledge review catalog; source-segment coverage ledger; contradiction/uncertainty review index.
- Cross-cutting qualifiers: authority by concern, semantic version/applicability, Product acceptance, engineering acceptance, source/release/installed/running identities, observation/validity dates, subject→implementation impact and assurance witnesses.

This is an information relationship architecture, **not** a direction to create all these directories or migrate existing files now.

## 6. Verification and future staged work (not authorized by this record)

Before claiming the successor successful, test fresh Codex/Kiro/ChatGPT contexts with only standard entry points and unfamiliar tasks, without hidden document-number hints:
- Explain why Wheelwright exists without confusing personal objectives and formal LVT Goals.
- Recover original Principal quotations without paraphrasing variants.
- Handle separately governed quantity in one Account without treating candidate resource identity as ratified.
- Trace an accepted-but-uninstalled capability and identify verified installed lineage.
- Explain an older supported contract under its recorded semantics alongside a newer design.
- Distinguish current provider fact from stale/out-of-date observed assumption.
- Infer affected Product contract/implementation obligations when a domain subject changes, without mistaking the doc update for implementation authorization.
- Recover a decision's historical alternatives without rewriting history.
- Identify protected/private evidence that must not enter a general actor context.
- Report insufficient evidence or unknown live state when appropriate.

Measure unassisted correct application, Principal interruptions, time to relevant meaning, history/contract confusion, and false live-state assertions. This is a falsification program proposal, not a claim that such tests already pass.

Potential post-ratification **separate, noncolliding work**: Codex conceptual subject/authority/version/assimilation templates, historical decision structure, representative architecture; Kiro historical source-coverage ledger, knowledge catalog, decision-candidate inventory and repository/runtime witnesses. The first subject pilot should be chosen after reviewing source coverage and sensitivity. Kiro originally nominated Position/governed quantity; Product philosophy or backend authority may offer different falsifiers. No silent grant for bulk migration.

## 7. Preservation, boundaries and unresolved details

- **Do not change** `docs/roadmap.md` vision/goals, `docs/principles.md`, `docs/README.md` authority rules, API Round 6 reconciliation or original journals in this checkpoint.
- Preserve PL-CLEANUP closure, stopped tasks, idea intake, current end-of-session procedures and specialized actor cold starts.
- Do not treat a quote recovered into this checkpoint as automatically ratified. Preserve exact wording and provenance separately from actor-derived interpretations.
- Do not expose reported account numbers, personal device identifiers, financial balances, credentials or paths unnecessarily.
- No changes to source, API, data, runtime, releases, installation, tests, providers or brokerage operations.
- Existing Kiro local surveyor ledgers and code-only evidence may not be accessible to other actors: future work must verify artifacts and completeness rather than claiming they are in GitHub.
- Do not treat a timestamped observation as current merely because it is in a maintained page.
- No implementation, migration, automation or enforcement mechanism is authorized by this design checkpoint.

**Current status:** Proposed successor architecture is consolidated and ready for bounded Principal ratification; no architectural decision above is ratified by this file itself.
