# Wheelwright — 4AM Knowledge Architecture and Learning-Loop Reconciliation Snapshot
**Date:** October 18, 2026
**Session:** Documentation / knowledge architecture reconstruction
**Status:** Historical reconciliation and handoff checkpoint; **not** taxonomy ratification, Product-goal amendment, implementation authorization, or operating-model change
**Repository baseline independently checked before persistence:** `bcbc29174fb62f1b3f90b7c9f39a01ff39e8a769`
**Earlier handoff boundary:** `docs/discovery/4am-round6-api-reconciliation-2026-10-18.md` (commit `bcbc29174fb62f1b3f90b7c9f39a01ff39e8a769`), preserved unchanged. That file belongs to the separate API workstream.

## 1. Why this snapshot exists and its exact boundary

The Principal expressly requested a durable snapshot of the knowledge-architecture conversation **since the last preserved Round 6 API reconciliation** after receipt of both independent structural-remediation assessments. This document preserves observations, original Principal formulations, competing actor proposals, design constraints, disagreements, and outstanding decisions. It does **not** promote proposals into ratified canonical knowledge, alter `docs/roadmap.md`, change the current A–F precedence model, reopen PL-CLEANUP, resume the v2 API design, or authorize implementation.

The Principal described the fundamental failure:
> "we started this project with the notion of a learning cycle. as we learn, it should feed back into our knowledge base. what it's turned into is \"we learn something, we leave it where it is\""

And:
> "this is a major failure in the way we've operated. one of our fundamental assumptions as a learning operation has failed to manifest. the feedback mechanism is fundamentally broken."

The Principal emphasized the distinction between architectural flaws and localized defects:
> "i'm not looking for bugs. i'm looking for flaws"
> "these are not bugs to be fixed. these are structural flaws that must be re-thought"

The intended cold-start outcome:
> "i want every new thread to know what's important. i never want to have to say \"it's in the repo\" again."

The central distinction established in the discussion is **historical preservation is not assimilation**. A project can have abundant recorded learning and still lack a maintained, directly recoverable account of what it currently knows.

## 2. Explicit Principal direction — scope and selected frameworks

The Principal directed:
> "we need two things:
> 1) a new documentation taxonomy
> 2) a survey of all of the goodness sprinkled throughout the repo  --> new taxonomy"

Then specified the organizing frameworks:
> "1) Product taxonomy based on LVT and the Edge method
> 2) Arch taxonomy based on Kotusev CSVLOD"

The Principal separately noted that CSVLOD was developed for enterprise architecture, whereas Wheelwright is one application: use its useful distinctions **without** importing unnecessary enterprise-scale apparatus.

**Product:** Thoughtworks EDGE / Lean Value Tree, with the established Vision → Goals → Bets → Initiatives relationship, hypotheses, experiments, evidence and learning. Do not invent Product Goals or equate experiments and initiatives automatically. The existing LVT Vision is retained unchanged:
> "Wheelwright is a continuously operating options-income decision system that connects evidence, choices, and consequences—helping the operator understand what is happening, what can be done, what could happen, and what actually happened."

Authority for this vision: `docs/roadmap.md`, `LVT-VISION-WHEELWRIGHT`.

**Architecture:** application-scale Kotusev CSVLOD: Considerations (business-focused rules), Standards (technical rules), Visions (business-facing structures), Landscapes (technical structures), Outlines (business-facing change proposals) and Designs (technical change designs). These are artifact purposes, **not** an authority ladder, universal file structure, mandatory work phases, or a demand to author all six for each initiative.

A discussed conceptual navigation relationship:
**Product purpose / outcomes ↔ canonical Domain Model ↔ Business Capability Model ↔ capability-to-component / application realization map ↔ Standards, Landscapes, Outlines, Designs and actual Product.**
The arrows are reciprocal relationships, not a prescribed waterfall or derivation algorithm. Domain meaning does not derive from REST endpoints, database schema or brokerage transport. Business capabilities should be derived from required operator behavior, not mere enumeration of domain nouns. The application-scale equivalent of Kotusev's Enterprise System Portfolio can be a concise capability-to-component map rather than enterprise portfolio bureaucracy.

The earlier `docs/33-strategy-roadmap-checkpoint.md` already described combining EDGE/LVT strategy with Kotusev-style strategy–architecture reconciliation. That is historical evidence of prior direction, not proof that today's successor structure is already ratified.

**Current scope:** Knowledge taxonomy, comprehensive recovery and assimilation of important repository knowledge, retrospective decisions, and reliable actor context. **Out of scope for now:** redesigning the multi-actor operating model, fixing the old taxonomy's individual bugs, restarting v2 API design, changing brokerage operations, revising Product goals, or reopening PL-CLEANUP (COMPLETE/ACCEPTED).

## 3. Preservation constraints explicitly stated by Principal

The successor architecture must retain these complementary systems, each with distinct purpose:

1. **Linear chronological journals**: preserve the story of how Wheelwright learned. Do not cannibalize or replace them in constructing canonical subject knowledge.
2. **End-of-session protocols**: preserve consistent closing of work items.
3. **Lightweight idea influx funnel**: ideas may be captured spontaneously without derailing current work; periodically reviewed during roadmap review; Principal can browse/recall the complete idea inventory without forcing ideas into active Bets or implementations.
4. **Context-rich retrospective decisions / ADR-like records**: recover the entire history, including original problem, alternatives, then-available evidence, explicit decision and Principal wording, why, consequences, later outcomes, amendments and supersession. Product, domain, architecture and mixed decisions may share one navigable history. Decision date differs from reconstruction date. Do not fabricate Principal ratification or retrospectively import later knowledge.
5. **Canonical entry points**: root `AGENTS.md` and `docs/AGENTS.md` must remain standard starting artifacts.
6. **Actor-specific cold starts**: retain Codex, Kiro, ChatGPT, Muse, and future specializations.
7. **Original discovery, research, numbered records, journal, experiments and checkpoints**: retain as attributable provenance even after their surviving meaning has been assimilated.

The Principal wants agents to find **all the important accumulated ideas, principles, axioms, judgments, rejected alternatives, Product learnings and engineering insights**, including those the Principal has not thought to ask about. A future **Principal Knowledge Review Catalog**, grounded in original wording and references with proposed classifications, should be available for Principal review. It is a survey/review product, not a second principles authority.

## 4. Concrete Principal-language and missed-assimilation specimens

### 4.1 Technically correct

Principal's current exact formulation:
> "Technically correct is the worst kind of correct."

Independent repository searches did not find this exact sentence in tracked GitHub files; similar statements are present in prior observations. Actors must not replace the quotation with their interpretation. Whether and how it is ratified and incorporated in subject authority remains separate from accurately preserving its wording in this checkpoint.

### 4.2 API URI shape

Principal's current formulation:
> "The principal can find design flaws in your API just by looking at the URI patterns"

A differently worded earlier statement is preserved at `docs/foundations/principal-rest-uri-design-review-intent-2026-10-18.md`:
> "The principal can detect design flaws in a rest api just by looking at the uri patterns."

Related ratified architecture principle `PRIN-ARCH-HOLISTIC-DOMAIN-API` appears in `docs/principles.md` with provenance in `docs/foundations/holistic-domain-first-api-design-principle-2026-10-18.md`. Do not silently normalize the two quoted variants, infer identical standing, or resume the separate API design workstream.

### 4.3 Make the right thing easy

Principal's exact formulation in this session:
> "make the right thing to do the easy thing to do."

Located across source material:
- `docs/foundations/principal-decision-surface.md`: "Make the right thing to do the easy thing to do."
- `docs/journal/project-journal-2.md`: "Make the right thing easy to do. Make what is right easy to know." — identified there as a Principal governing axiom.
- `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md`: "Make the right thing to do the easiest thing to do." — identified there as a Product principle, next to an actor/system formulation.
- None was found in the current `docs/principles.md` register at the time of survey.

This is a particularly strong specimen: several formulations, different historical locations and labels, but no reliably recovered common canonical representation. Preserve all variants with provenance.

### 4.4 Six personal objectives

Principal provided/recovered the list from the October 14 conversation and explicitly mandated its persistence on October 18:
1. More profit
2. Less risk
3. Eliminate the need to be Nostradamus
4. Learn about options
5. Build cool stuff
6. Smoother, more reliable trading experience

Now preserved in `docs/foundations/principal-personal-objectives-2026-10-14.md`. The recovery and persistence depended on **Principal conversation archaeology and explicit intervention**. These are personal motivations for trading/building Wheelwright, **not** the formal LVT Product Goals. Normal documentation navigation did not independently surface them in the review.

### 4.5 Docs 77, 82 and other numbered records

`docs/77-api-v2-architectural-guardrails.md` aggregates many ratified constraints across different subjects. `docs/82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md` contains ratified scope semantics, resource-design candidates and unresolved identity questions in one file. `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md` and Doc 81 have substantial Principal and Product meaning deep inside very long historical narratives. Cold actors should not need to know "Doc 77" or "Doc 82" to find the applicable meaning. Do not wholesale promote mixed-status files.

## 5. Independent survey evidence — what is actually established

Both actors independently checked baseline `bcbc29174fb62f1b3f90b7c9f39a01ff39e8a769`, performed read-only reviews, and explicitly acknowledged **incomplete** substantive survey coverage.

**Codex intellectual survey**:
- Inventoried 563 tracked files under `docs/`, including 397 Markdown documents; indexed 10,235 headings.
- Sampled major roots, foundations, journals, design, research, discovery, defects, contracts and supporting artifacts, but did not read all substantive content.
- Identified subject clusters: purpose/philosophy, trading/economics and governance, operator questions/capabilities, system design, engineering and empirical learning.
- Particularly valuable progressions include Docs 47, 49, 50 and 81 concerning capital-state alternatives, release costs and governed purpose.
- Identified remaining large gaps: Doc 61 (~7,115 lines), Doc 81 (~2,293 lines), journal bodies, practitioner research, original conversations and visual evidence.

**Kiro knowledge survey**:
- One direct pass plus eight read-only surveyors (foundations, docs 00–40, docs 41–82, journals, parking lots, design/CLI/contracts, defects/research, code).
- Approximately 380 extracted observations consolidated into 88 stable survey entries with source-ledger identifiers; 24 potential contradictions.
- Surveyor raw ledgers reportedly remain in Kiro's local session files, **not** in GitHub; later actors must not assume they can retrieve them from the repository.
- Major gaps: Doc 61 §§25–34 (roughly 3,000 lines of Principal surveys), Doc 81, journal entry bodies, selected parking-lot continuation files, ADR bodies and practitioner research.
- High-value discoveries: consequential engineering axioms only in journals; some domain invariants only in historical records; accepted Product precedents scattered; code/test-only semantics; roughly 20 of 31 extracted defect lessons not generalized (which does **not** imply they all warrant generalization).
- Some noteworthy unresolved contradictions include old backend recommendation prohibitions versus later backend authority, Doc 82 candidate nested URIs versus Doc 77 nesting discipline, disputed PL-ARCH-06 disposition, DTE-window differences, competing Herbie meanings, and strict policy-over-prediction versus forecasting research. These are **leads**, not permission to settle conflicting semantics.

**Kiro structural diagnosis**:
- Reports 45 reconciliation completion records in parking-lot history, 35 ending "no roadmap or architecture-roadmap change"; some contained newly ratified invariants which stayed inside local work records. This supports a systemic destination failure, although the need for any specific promotion must still be established.
- Diagnosis: knowledge filed by events rather than subjects; file-level mixed authority; absent maintained current-description ownership/trigger; code disconnected from knowledge; Principal wording absorbed into narrative; bootstrap routes to historical reading lists rather than current meaning.

**Correction of earlier evidence:** Kiro's later review explicitly corrected an earlier mistaken claim that the Sonar profile delta file was missing. `docs/reference-data/sonar/wheelwright-clean-code-profile-delta-v1.md` does exist. Do not perpetuate that error.

## 6. Independent structural-remediation proposals and reconciliation

**Codex recommendation:**
- Maintain coherent, concise **subject explanations** as the unit of current knowledge; normally a section or small document.
- Different individual assertions may have different status, scope, source and confidence within one subject, without requiring one file or database card per assertion.
- EDGE and CSVLOD are interconnected strategic/architectural views, not substitutes for maintained subject meaning.
- Distinguish Product purpose, Product strategy, canonical domain model, capability/experience, application realization, architecture, and engineering learning.
- One canonical domain semantic owner: Accounts, Positions, Contracts, economic construction, capital, regimes, governed quantities, evidence, identity, time, recommendations, decisions, execution, outcomes. API and code represent, rather than define, those meanings.
- One shared decision-history mechanism that reconstructs **decision threads**, not an ADR per conversation or commit.
- One-way historical provenance does not establish normative status; maintain current meaning with traceability back to original sources.
- Assimilation may add, amend, narrow, refute, mark uncertainty, confirm, or preserve local evidence without unjustified generalization.
- Migrate by **bounded subject**, avoid two simultaneously authoritative homes; use fresh-agent unfamiliar-task falsifiers before scaling.

**Kiro recommendation:**
- Small canonical pages by concept/capability/standard (suggested around 300 lines max) with individually numbered claims/status/provenance; separate historical/provenance layer.
- Explicit Principal Statement Register for wording and variants; decision log; conflicts register.
- An explicit **Canonical Delta** in existing closeouts: affected canonical claims added/amended/superseded, or reason for no canonical change; canonical content updated in same commit as historical record.
- Coverage ledger at heading / journal entry / backlog block / commit segment level to prevent silent omissions.
- Keep domain as its own top-level intellectual body (options mechanics, ontology, tunable domain policy), not sliced into CSVLOD categories.
- Domain and capabilities cross-link in both directions, since capability needs expose missing domain meaning and ontology should not enumerate Product functions.
- At application scale, consider **one capability record with business and implementation views** to avoid drifting duplicate registries.
- Reuse existing Solution Overview and Solution Design forms for CSVLOD Outlines/Designs.
- Treat principle phrasing, history, contradiction, ratification and source confidence separately.
- Recommends Position/governed quantity as an initial subject pilot.

**Reconciliation (ChatGPT analytical recommendation; NOT Principal ratification):**
- Prefer Codex's coherent subject-level maintenance to universal atomized numbered claims and rigid page-length limits. Use attributable assertion-level qualification where stakes justify it.
- Prefer Kiro's precise source-segment coverage ledger for complete historical survey.
- Preserve ability to enumerate every original Principal statement and unresolved contradiction in review catalogs, **without defaulting to new competing normative registers**.
- Retain the Canonical Delta as a strong design candidate for making assimilation explicit; do not conflate its proposal with newly authorized governance or tooling.
- Prefer one canonical domain semantic collection; capability views may combine business and application realization at Wheelwright scale if clear distinctions and source fidelity survive.
- The successor is NOT accomplished by moving numbered files into folders, indexing all files, adding semantic search over an archive, or building a large claim graph first.
- Reject automatic promotion of every defect lesson and every interesting quote into ratified principles; at the same time, exact Principal language must never be silently paraphrased or lost.

## 7. Intended knowledge relationships and boundary rules

- **Maintained subject knowledge:** What Wheelwright currently knows, including accepted meanings and explicit uncertainties.
- **EDGE/LVT:** Why Product outcomes matter, which Bets/initiatives pursue them, and what experiments taught us. The canonical LVT Vision and Goals remain unchanged.
- **Domain model:** Stable technology-independent semantics; not derived from API path names or implementation tables.
- **Capability model:** What operators/clients must be able to accomplish and what accepted behavioral precedents establish; not a list of endpoints.
- **Application capability map / simplified technology portfolio:** Which actual Wheelwright components currently implement each capability, including gaps and limits; distinct from accepted design or desired future state.
- **CSVLOD:** Considerations, Standards, Visions, Landscapes, Outlines and Designs as application-proportional architectural artifact functions. Do not infer authority from category names.
- **Decision record:** Why a choice was made at the time, what was known, what followed; label scope and supersession, and never invent alternative histories.
- **Journals and original evidence:** How knowledge was produced, including failed hypotheses and unfinished discussion. Preserve intact.
- **Idea funnel:** Record spontaneous possibilities without forced immediate reconciliation; periodic strategic review and full browseability.
- **Bootstrap/context assembly:** Standard root `AGENTS.md` and `docs/AGENTS.md`, then actor-specific cold starts. Every actor gets compact foundational context and independently retrieves task-specific semantic/architectural context and historical evidence as needed; blindly injecting the complete archive does not establish comprehension.
- **Verification:** A fresh actor given an unfamiliar task and standard entry points alone should recover applicable meaning without Principal-provided document numbers, apply it correctly, distinguish accepted/speculative/installed, and reconstruct decisions without hindsight. After a new learning event, repeat recovery to test feedback.

## 8. Retrospective decision-history reconstruction requirement

The Principal expressly wants agents to survey the entire project history and reconstruct consequential choices with full context. Existing `docs/07c-adrs.md` contains ADR-001–ADR-022 but is not sufficient coverage. Reconstruct Product, domain, architecture and mixed decisions from original ADRs, numbered docs, journals, parking-lot dispositions, research, design, commits and available conversations. A common record should capture:
- Decision subject/type, original decision date and separately dated reconstruction.
- Original problem, context, then-available evidence, assumptions and constraints.
- Actual considered alternatives and recorded rejection reasons.
- Verbatim Principal decision, if verifiable; otherwise qualify absence/actor interpretation.
- Rationale and anticipated consequences *at decision time*.
- Later implementation, observation, amendments, reversal and present scope.
- Links to affected canonical subjects and to original evidence.
Do not treat historical implementation as retroactive Principal ratification, invent reasons, or recast a rejected bounded proposal as a timeless rule.

## 9. Principal Knowledge Review Catalog — a specific expected deliverable

The Principal wants a **reviewable, source-grounded list of valuable insights**, not merely editorially synthesized canonical content. Agents should independently identify high-salience Principal principles/axioms, Product philosophy, architectural insight, engineering philosophy, consequential decisions, hard-earned experiments, rejected alternatives, repeated themes and useful distinctions, including those the Principal has not named.

Inventory entries should preserve exact original wording where available, document and section, source speaker/authority and date confidence, current standing, variants, subject connections, and proposed canonical placement. Consolidate duplicates for Principal review without erasing alternative wording or failing to record open contradictions. This is a work product for review, **not** a competing principles register.

## 10. Remaining unresolved architectural choices — do not silently ratify

1. Exact subject/page granularity and how much claim-level metadata is actually justified.
2. How to designate and transfer canonical semantic ownership subject by subject without a period of competing current definitions.
3. Whether one combined capability record or separate model and capability-to-component view best survives the representative pilot.
4. How to preserve original Principal statements as directly discoverable without building a second normative register.
5. How a Canonical Delta becomes a dependable assimilation relation while keeping existing end-of-session procedures intact and avoiding extra governance ceremony.
6. Which source regions must be substantively exhausted before declaring the survey complete; how to preserve surveyor evidence and a coverage ledger.
7. Initial reconstruction pilot (Kiro proposes Position/governed quantity; competing worthwhile specimens include Product purpose/principles and backend authority).
8. Decision-history stable IDs and the boundaries of reconstructed decision threads.
9. How to measure actual cold-start context delivery and application without relying on self-attestation.
10. Actual final taxonomy/document layout and authoritative source-to-successor navigation; no bulk file relocation authorized.

These are **proposed design questions**, not immediate permission to amend the existing A–F rules or make Product/implementation changes.

## 11. Parallel actor assignments to prepare after persistence

Principal requested concurrent, noncolliding Codex/Kiro efforts, each aware of the other's scope.

**Codex intended ownership:** Target intellectual/semantic architecture and adjudication *proposals*: subject boundaries, Product/domain/capability relations, calibrated CSVLOD usage, historical decision-record model, prospective assimilation contract, fresh-actor falsification. Challenge historical interpretations but do not silently promote them.

**Kiro intended ownership:** Repository-wide extraction and source coverage: retrieve/reuse the eight existing local surveyor ledgers if available; complete Doc 61, Doc 81, journal bodies, parking-lot continuations, ADR bodies, research; create source-segment disposition ledger; compile Principal Knowledge Review Catalog and retrospective decision *candidate* inventory, exact source citations and raw wording; identify implementation/test witnesses.

These are proposed task boundaries; separate actor prompts are to be generated after a shared verified snapshot. Until specifically authorized, both tasks are read-only and actors must not mutate shared canonical files or each other's artifacts. On later implementation, use isolated branches/workspaces and a single owner for each target canonical artifact. Independent findings may challenge one another; they should not assume agreement.

## 12. Explicit out-of-scope and safety constraints

- Do not continue Round 6 v2 API work; preserved API reconciliation remains unchanged.
- Do not treat this snapshot as ratification of successor EDGE/CSVLOD details, domain authority transfer, ADR reconstruction, or new operating procedures.
- Do not confuse six personal objectives with formal Product goals.
- Do not reopen PL-CLEANUP (COMPLETE/ACCEPTED) or reactivate stopped work.
- Do not modify brokerage operations, production state, permissions, or financial domain behavior.
- Preserve linear project journals, idea funnel, end-of-session protocol, root/doc AGENTS and specialized actor cold starts.
- A survey/catalog is not canonical authority by itself; no historical discovery gains ratification from being quoted here.

**Snapshot state:** Both independent structural analyses received and reconciled provisionally. The Principal has not yet ratified the disputed successor-design details. Ready for separately scoped, concurrent read-only Codex/Kiro continuation tasks.
