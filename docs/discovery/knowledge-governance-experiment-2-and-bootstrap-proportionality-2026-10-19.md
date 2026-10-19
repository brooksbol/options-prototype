# Knowledge Governance — Experiment 2 and Bootstrap Proportionality Review

**Date:** October 19, 2026  
**Status:** Read-only experiment evidence and preliminary proportionality assessment; not ratified architectural or Product authority.  
**Authority:** Category D — experiment/reconciliation provenance only.  
**Principal direction:** Preserve the cross-actor findings, proceed to a bounded bootstrap proportionality review, and do not change existing bootstrap, steering, knowledge, or enforcement mechanisms on these observations alone.  
**Scope:** Agent knowledge discovery and verification; excludes changes to `ww live`, backend/API, operating-regime semantics, and the unresolved `ASSIM-0002` Position model.  
**Related:** `docs/discovery/knowledge-governance-complexity-assessment-2026-10-19.md`, `docs/AGENTS.md`, `docs/bootstrap/{chatgpt,codex,kiro}-cold-start.md`, `docs/knowledge/README.md`, `docs/assimilation-obligations.md`, `docs/technology-quality-fitness-controls-v1.md`.

## 1. Scope and exact test

After the Account / Operating Regime test (Experiment 1), the Principal commissioned a second indirect, cross-domain question to test recovery beyond an exact question in the maintained knowledge index:

> An operator opens a historical portfolio view in Wheelwright. The view contains retained account information, but some market evidence needed to explain that historical state is incomplete. The operator wants a trustworthy answer and may request fresher evidence. Determine how Wheelwright should handle this situation. Identify the relevant Product and architectural rules, distinguish established behavior from candidate or unresolved behavior, and explain the implications for API v2 and its clients.

Three fresh actor-session results were supplied: ChatGPT, Codex and normal Kiro. A fourth unprimed Kiro scratch configuration was considered but not conducted. This is a three-actor experiment, not a four-configuration result.

All three used remote `main` revision `e74b5670b4636c3795ea72327bd49e280952459c` (with different verification strength) and reported **no repository modifications and no Principal intervention**. The actor reports are the evidence for behavioral observations below; they are not runtime conformance tests.

## 2. Substantive convergence — confirmed from the supplied three reviews

All three actors concluded:

1. Retained historical account/portfolio observations remain visible as evidenced, not overwritten or deleted because supporting market evidence is missing.
2. Missing historical evidence stays unknown; it is not zero, interpolated, nearest-time paired, or retroactively imputed from today's market data.
3. Source, receipt, persistence, effective and inspection clocks must retain their actual distinct meanings. A contemporary acquisition is not historical knowledge replay.
4. Backend v2 owns authoritative evidence, reconciliation, trust/admissibility and business conclusions. Clients present qualified results.
5. Acquiring fresher evidence is a separate, policy-bounded action; held/inspection reads and ordinary read-through direction differ by accepted capability. No new acquisition or historical backfill authorization follows from the scenario.
6. General historical reconstruction/market-gap backfill remains candidate or unresolved; no generalized capability or installed/runtime conformance was verified.
7. Accepted history precedent was recovered: the Portfolio Capital graph exposed **44 supported composites and 29 explicit gaps**, without inventing missing matches. The historical Position observation capability uses qualified inspection-time semantics rather than complete past-knowledge replay.

Recovered sources (example source ranges, as reported):
- `docs/principles.md:59-71` — backend authority, provenance/trust, precision, failed-refresh preservation.
- `docs/77-api-v2-architectural-guardrails.md:26-44,140-176,262-280` — backend, clocks, partial outcomes, read/acquisition boundaries.
- `docs/07c-adrs.md:298-308,490-505,614-636,716-740` — partial knowledge, provenance, consumer reliance, historical replay boundaries.
- `docs/contracts/api-v2-held-quotes-read.md:15-32`; `docs/contracts/api-v2-subject-show-held-quote.md:30-52` — bounded pure-held reads.
- `docs/design/pl-cli-01-historical-position-candidate.md:5-19` — accepted snapshot inspection.
- `docs/design/pl-cli-01-portfolio-capital-history.md:3-30` — accepted partial history, explicit gaps.
- `docs/parking-lot-7.md:152-177` — one-shot acquisition cannot recover missed historical observations.

## 3. Comparative retrieval evidence

| Dimension | ChatGPT | Codex | Kiro (normal steering) |
|---|---|---|---|
| Substantive conclusion | Correct | Correct | Correct |
| Ratified/candidate/unresolved standing | Distinguished | Distinguished | Distinguished |
| Provenance + time distinction | Yes | Yes | Yes |
| Accepted partial-history precedent | Found | Found | Found |
| Principal intervention | None | None | None |
| Complete mandatory bootstrap demonstrated | No | No | No |
| Context-independent recovery | Qualified by prior project context | Stronger reported; root instructions were injected | Not blind: steering injected substantial answer-relevant rules |
| Clock interval | UNKNOWN | 3m25s, excludes final response | ~4m54s, excludes final response |
| Tokens/credits | UNKNOWN | UNKNOWN | UNKNOWN |

**Limitations:** Tool output truncation and narrower rereads occurred. Codex reported an archive-based recovery after a local object was missing. Kiro reported retries/recloning and skipped some mandatory protocols. ChatGPT acknowledged incomplete continuation-heading inspection and shared protocol traversal. No time estimate above represents full end-to-end cost; absent consumption values are UNKNOWN. Kiro steering is intentionally always-included in normal use; its score measures operational use with supplied context, not independent discovery.

**First experiment context:** Three actors also answered Account/Regime correctly; Kiro's tracked `.kiro/steering/domain-vocabulary.md` provided the key conclusion before retrieval. Thus across both experiments there are six successful answers, but not six unprimed discovery demonstrations.

## 4. Candidate drift reported by Kiro — not adjudicated here

- `docs/foundations/backend-behavioral-invariants.md` NEG-03 and older Evidence Appliance material may still put recommendation work in clients; Doc 77 and later backend-authority principles govern v2. This may be a scoped v1/v2 distinction plus stale presentation, not a live same-scope contradiction.
- Older refresh/nudge descriptions may be stale relative to accepted explicit fetch/refresh behavior.
- Bounded pure-held read contracts and newer ordinary GET read-through direction require capability/scope reconciliation, not blanket replacement.
- The meaning of “historical portfolio view” is not a single settled Product surface.
- `docs/foundations/secondary-observation.md` appears in Category A navigation without a same-name entry in the ratified principles register; its Category A identity may nonetheless be independently valid.

These are **candidates for targeted future checking**, not findings authorizing edits or new `ASSIM-*` obligations.

## 5. Bootstrap proportionality review — existing rules

Current root `AGENTS.md:11-26` routes actors to `docs/AGENTS.md`, the A–F model, actor-specific bootstrap, task state, and maintained knowledge. It expressly calls for bounded indexing rather than exhaustive history loading.

`docs/AGENTS.md:7-19` names seven safe-orientation references. It explicitly says **scan/index large registries, read in full only task-relevant sections**, and covers all parking-lot continuations by enumeration/targeted retrieval. `docs/AGENTS.md:21-29` adds maintained-owner routing, open-obligation scanning and mandatory Product-first/fitness documents. `docs/AGENTS.md:33-47` adds failure-mode, suspended execution-contract, Principal decision-surface and actor-specific paths; task/experiment state and continuation relevance govern consequential work.

Actor-level specialization:
- `docs/bootstrap/chatgpt-cold-start.md:25-40` distinguishes untasked bounded orientation from subsequent task-specific retrieval. `:44-50` governs authority/context recovery; `:53-61` adds v2 Doc 77.
- `docs/bootstrap/codex-cold-start.md:18-29` requires proof-carrying review, remote main, decision-surface, experiment state, task-state and maintained knowledge; `:31-39` adds v2 Doc 77; `:116-125` requires an attestation.
- `docs/bootstrap/kiro-cold-start.md:17-25` similarly requires proof, remote main and task-state; `:30-38` adds v2 Doc 77; `:126-150` adds mutation/roadmap closeout and attestation controls.

**Confirmed strength:** Routing is already conditional in important places (task-relevant reads, indexing versus reading, untasked bootstrap, active execution state, API v2 boundary, implementation closeout). It is inaccurate to describe all source documents as universally required in full for every read-only question.

**Confirmed friction hypothesis:** Some requirements are worded as “read during bootstrap” even when the bounded read-only investigation does not use their detailed contents; identical cross-cutting obligations appear in root, docs and actor-specific routing. These two experiments did not demonstrate complete compliance, yet answer correctness and authority classification were high. This suggests potential retrieval overhead and actor ambiguity, but **does not establish that the mandatory requirements are dispensable**.

## 6. Proportionality matrix — analytical recommendation only

| Work mode | Universal orientation to preserve | Conditional deeper recovery |
|---|---|---|
| Untasked cold start | Root/docs authority, actor role, remote state, safe routing, index of continuation sets, staged experiment distinction | No full historical backlog or broad tests |
| Read-only bounded architectural question | Above plus failure-mode and proof obligations as specified, task-relevant maintained owners, original ratified sources, scoped active-state check | Domain-specific ADRs, contracts, accepted Product specimen, history matches; avoid unrelated engineering details |
| Material architecture/design proposal | Universal controls plus closest accepted Product precedent, full applicable principles/invariants/decisions and falsifiers | Full relevant cross-domain conflicts, fitness mechanisms and lifecycle consequences |
| Implementation or deployment | All applicable authority, immutable candidate, authorization, in-flight protection, independent verification, relevant closeout controls | CI/fitness/runtime evidence tied to affected capabilities and actual transition |

This is a **classification of candidate review effort**, not a rewritten bootstrap rule. Existing mandatory reads remain mandatory until ratified change.

## 7. Candidate simplifications and falsifiers

1. **Clarify “read” vs “index” vs “verify.”** Do not change an invariant; make actor attestations explicit about what was actually inspected. Falsifier: an actor misses an essential failure mode when the document is merely indexed.
2. **Minimize repeated prose while retaining pointers.** Root and actor files should route to one governing explanation, not independently define it. Falsifier: an actor loses the correct authority boundary with a shorter pointer.
3. **Consider a bounded read-only inquiry path only after evaluating mandatory safety losses.** Falsifier: a read-only review omits a transition/ratification limit or invents Product meaning under the lighter path.
4. **Measure actual workload before imposing a cost target.** Track documents opened, indexed, unnecessary/repeated reads, truncated retrievals, intervention and total effort where available. Avoid turning UNKNOWN token/credit consumption into numerical claims.
5. **Treat always-injected Kiro steering as an operational feature, not a defect.** A scratch unprimed configuration is a separate experiment, not a reason to change tracked steering.

**Counterargument:** The current “universal” documents also defend against rare consequential failures. Successful low-risk reviews do not measure that protective value. Therefore no deletion, waiver, new gate, or change to `docs/AGENTS.md` is justified by this evidence alone.

## 8. Disposition and boundaries

- The knowledge-assimilation/ADR/A–F/maintained-owner architecture is **held constant**.
- Do not add another workflow, ledger or enforcement layer.
- Do not shorten existing mandated reads yet.
- Defer precise bootstrap-edit proposals until independently challenged against failure scenarios and concrete cost evidence.
- The `ww live` workstream remains separate and untouched.
- This record must not be used as Product ratification or execution permission.

**CURRENT STATE:** Experiment 2 complete (three actors); bounded bootstrap proportionality review documented. Cross-domain authority recovery succeeded, universal bootstrap compliance and cost benefits remain unproven.

**DECISION REQUIRED:** NO for preserving this read-only result.

**NEXT AUTHORIZED ACTION:** NONE. Any bootstrap instruction change requires a separate bounded proposal and Principal review.
