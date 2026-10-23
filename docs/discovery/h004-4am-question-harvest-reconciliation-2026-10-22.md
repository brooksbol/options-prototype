# H-004 — 4AM independent question-harvest reconciliation

**Date:** October 22, 2026  
**Evidence pin for actor reports:** `10f12ea516d0b0dec860f633be416f8ab52673bf` (Codex); Kiro's primary pin `855a152903ca18e16b592ad63553315a758f7aaa`, with a few later reads at `81094d8`/`10f12ea`.  
**Standing:** Category D bounded Principal-facing evidence reconciliation, **not** a Product decision, revised authoritative questions register, Herbie assignment, H-004 authorization or Reconciliation Completion Record.  
**Actor evidence sources:** Principal supplied Kiro's 218-line independent read-only report and Codex's 158-line independent read-only report as conversation attachments. The raw actor reports are **not** archived verbatim by this document; preserve their attributed distinction.

## Principal intent and scope

The Principal instructed the actors to recover operator questions outside the initial 62, independently propose useful starting points, and reconcile through 4AM. The Principal said **“basic questions are good. especially early on”**, rejected an iron condor as the default first question, and differentiated **Current State Understanding** from Decision Support. Context determines whether movement is helpful, harmful or ambiguous: what subject, metric, comparison time, evidence and governance apply. **Herbie** is a Theory of Constraints metaphor for an evidenced bottleneck; do not classify each question as one.

## Evidence from independent actors

**Kiro:** about **30** questions absent from the first 62, with roughly five verbatim/explicit Principal prompts. Recovered especially margin debt, total portfolio value, portfolio-value history, option expiration, account type, capital encumbrance, transaction history, previous-observation deltas, zero-versus-unknown, synchronization times, source truth, working protective exits and P/L movement. Kiro independently nominated: (1) authorized Account discovery, (2) holdings in a named Account, (3) last received evidence for an Account, (4) options expiring this week, (5) missing/unknown Holdings evidence. Kiro reported defects in existing 62-item provenance/locators and correctly qualified its older API version pin and later-read differences.

**Codex:** **43 source-grounded formulations** (33 initial, 10 additional) and explicit warning that these are *not 43 authenticated Principal quotations*. Recovered the nine-to-twelve historical CLI question probes and significant neglected **Production and withdrawal** questions, strategy-attributed realized result versus whole-deployment economics, capital release, basis/date purpose, Portfolio Capital, source-clock trust, market orientation and new-evidence effects. Nominated: (1) authorized Account discovery, (2) latest broker-reported Holdings and when, (3) difference between two identified Holdings observations, (4) established Portfolio Capital from a retained observation, (5) source/observation time behind a prior answer. Codex did not consult Kiro's work.

**Independence/limits:** Both report independent repository discovery; neither is an exhaustive authenticated chat-history export. Codex's report is pinned to `10f12ea`, Kiro's principally to `855a1529` with explicitly noted drift; current release corrections can affect answerability. Agreement is evidence, not independent Product acceptance.

## Reconciled, non-duplicative missing question families

1. **Orientation and access:** Which Accounts can I inspect? What is in a named Account? Count reported holdings; separate authorized visibility from ownership or exhaustive coverage.
2. **Production/withdrawal:** How much *cash production* occurred over a stated month and can be withdrawn without consuming principal? What fraction is attributable to each production engine? How does that differ from realized options contribution or a deployment's economic outcome? **Genuinely missing explicit family.**
3. **Capital meaning:** What Portfolio Capital is established? What is a total Account value, NAV, cash, buying power, encumbrance or margin debt? These are different concepts; a missing balance domain is not permission to compute substitutes.
4. **Source and time:** When did the broker report the Holdings, when were they received, and what did the latest admitted cut contain? “Previous observation” is not necessarily “yesterday”; a partial/missing cut is not a zero or trade.
5. **Qualified changes:** What differs between two identified observations? What can a new document/evidence item legitimately change? A quantity difference is not proof of execution, assignment or complete lifecycle history.
6. **Existing attention/triggers:** Expiring short options, working closing instructions, coverage conflicts and missing evidence. Do not invent a policy-ranked portfolio “health” score.
7. **Decision/governance questions:** Permissible moves, capital release, action alternatives and no-action outcomes; maintain the boundary from Current State Understanding to Decision Support.
8. **Epistemic questions:** What is known versus unavailable/redacted/incomplete? Which evidence and clocks support the stated answer? Why is the answer qualified?

Do **not** add the counts 62 + 30 + 43 as independent requirements: overlapping formulations, temporal variants and actor-written search questions would make that false.

## Shared candidates and actual trade-offs

| Candidate | Evidence | Value for first H-004 specimen | Important limitation |
|---|---|---|---|
| **“Which Accounts can I inspect?”** | Both independently nominated; accepted Accounts API | Minimal useful orientation and explicit per-User grant scope; easy positive/negative synthetic fixture | An Account returned under a grant is not necessarily owned; OAS may contain full account numbers, so model-bound disclosure must be curated |
| **“What did the broker last report in this Account, and when?”** | Codex; Kiro's named-Account holdings and evidence-time candidates | Richer Current State Understanding without option or valuation model | Latest retained/admitted cut is not live custody; incomplete source and multiple clocks require exact qualification |
| **“What changed between these two observations?”** | Both independently recover a historical delta family | Falsifies unauthorized lifecycle attribution | Two coherent snapshots, coverage, and absent-vs-zero semantics make this a later-than-minimum specimen |
| **“What source/time supports that answer?”** | Both recover provenance importance | Strong follow-up for conversational referent + traceable evidence | Requires a preceding answer; cannot stand alone as a first single-turn demonstration |
| **“What Portfolio Capital is established?”** | Codex's broader financial semantics | Tests authoritative domain composite, not generic account worth | Wider evidence/coverage complexity and implementation-scope qualifications |
| **“Which options expire this week?”** | Both recover CLI probe | Practical operator question; time semantics | Date filters and role of agent vs backend arithmetic need scope reconciliation |
| **“What doesn't Wheelwright know about this Account?”** | Kiro candidate; Codex provenance/qualification themes | Tests honesty and uncertainty | Strong second question; benefits from a previously established Holdings referent |

**Provisional assessment for Principal consideration, NOT selection:** The two independent reports support beginning with **authorized Account visibility** because it is foundational, understandable and falsifiable, followed by last reported Holdings/evidence time. However, the first user utterance may be “What accounts do I have?” only if the answer explicitly frames what Wheelwright is authorized to show, rather than all legal/economic ownership. The Principal explicitly favored basic questions early, but has not selected or authorized an H-004 specimen.

## Critical answer/authorization constraints

- Synthetic fixture only for any first domain-bearing experiment. H-001/H-002/H-003 acceptance does not authorize H-004 data integration.
- New MCP tool/agent API v2 access is **not currently implemented/authorized**; endpoint existence and running local backend do not establish suitability of exposing all response fields to model inference.
- The API's full account-number disclosure and missing masking policy cannot simply be ignored by an LLM tool adapter. A synthetic instance avoids real disclosure for experiment, not the future design boundary.
- Account != User grant != ownership != Operating Regime. Position != unqualified inventory row. Do not invent capital, lifecycle, fees, completeness or source freshness.
- Successful v2 Product-conformance release at `10f12ea` is later than some Kiro reads. It remains qualified by locally observed release state, installed empty projection and open BUG-048; a potential first synthetic Account question is materially independent of that defect, subject to direct confirmation.
- No financial-domain reasoning should be placed in the model to bridge missing backend semantics. Outputs should preserve unknowns and explicit temporal/evidence qualifications.
- No Herbie identity without evidence of a throughput-limiting constraint under actual Theory of Constraints reasoning.

## Inventory maintenance / assimilation observations

The [original 62](operator-question-inventory-2026-10-22.md) is a Category D *first harvest*, not a maintained source of accepted Product requirements. Both actors found provenance problems: Q03 is an assistant-proposed specimen, Q36's Doc 80 locator should cite §9/§12, Q43 is not operator-friendly, Q51 loses a qualifier, and Q62 is a technical falsifier rather than a recorded operator question. Some candidate items in 62 are explicitly not Principal quotations.

**Disposition:** Preserve recovered sources and question families here first. The next bounded documentation pass may update the existing inventory with deduplicated additions, corrected quotation standing and locators, retaining the raw provenance; avoid silently renumbering or inventing another register. Determine whether a maintained subject owner is warranted through existing 4AM assimilation rules, not by creating a parallel unratified source of authority.

## Still open

1. Principal selection of the first H-004 *operator question* and whether to pair it with one follow-up question.
2. Exact synthetic subject/data and what answer content may reach model inference; whether to allow model-visible Account numbers at all even when synthetic.
3. Verification of direct backend response-versus-agent claim equivalence, unauthorized Account omission and no-call hallucination.
4. Applicable scope and documented authorization before any new MCP tool, API client or domain fixture implementation.
5. Broader PL-MCP-01 architectural reconciliation remains INTAKE; neither reports nor this digest constitute its mandatory Reconciliation Completion Record.

**CURRENT STATE:** Kiro and Codex H-004 independent question recoveries received and reconciled; new Production/withdrawal and other source-bound families identified; no first question selected, no H-004 implementation authorization.

**DECISION REQUIRED:** NO for evidence assimilation; the Principal retains future selection.  
**NEXT AUTHORIZED ACTION:** Review the consolidated candidate set with the Principal; separately request authorization if an H-004 specimen is selected.
