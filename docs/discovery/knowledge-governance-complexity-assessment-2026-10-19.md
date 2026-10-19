# Knowledge Governance Complexity Assessment — 2026-10-19

**Status:** Principal-requested assessment / open evaluation; not ratified architectural authority.  
**Authority:** Category D — assessment and decision provenance only.  
**Scope:** Wheelwright documentation architecture, maintained knowledge, assimilation obligations, agent cold starts, and enforcement proportionality.  
**Related:** `docs/knowledge/README.md`, `docs/assimilation-obligations.md`, `docs/AGENTS.md`, `docs/README.md`, `docs/07c-adrs.md`, `docs/technology-quality-fitness-controls-v1.md`, `docs/discovery/4am-first-knowledge-slice-verification.md`.  
**Principal direction:** Preserve these observations and proceed to a bounded, genuinely independent cold-start recovery test before expanding the knowledge-governance machinery.

## 1. Bottom line

The architectural direction is sound and tackles a real agent-specific problem: session-to-session loss of implicit organizational memory. The current complexity is elevated but defensible; over-engineering risk is moderate and increasing. The first Account / Operating Regime knowledge-assimilation slice is promising, **not yet independently demonstrated across actor boundaries**.

Agent-oriented development reasonably needs more explicit discovery, authority, temporal context, and verification than a human-only engineering organization. This should translate into **less repeated Principal intervention and less rework**, not more procedural ceremonies.

**Working design test:** Make correct engineering behavior the easiest behavior for an actor. Every new governance mechanism should either prevent an evidenced class of failure or measurably reduce the cost of recovering and applying authoritative knowledge.

## 2. Preserve mechanisms with distinct responsibilities

- **A–F authority model:** what governs and with what precedence; preserve.
- **ADRs:** decisions and rationale; preserve the existing register pending demonstrated deficiencies.
- **Maintained subject pages:** current bounded meaning and open questions, with standing/provenance visible.
- **Agent bootstrap routing:** find applicable authority with bounded retrieval, not exhaustive history loading.
- **Source provenance:** justify claims and distinguish ratified facts from candidates and historical discovery.
- **Assimilation obligations:** useful when consequential knowledge is recognized but has not been incorporated into maintained authority, or when a consequential semantic decision is explicitly unresolved; avoid treating every ordinary question as an obligation.
- **Mechanical checks:** useful for broken links, identity fields, closure witnesses, and similar structural properties; do not claim they establish semantic correctness.
- **Independent fresh-actor tests:** the crucial evidence that retrieval and correct interpretation actually work across sessions and actors.

One canonical owner should state each current meaning. ADRs preserve why; indexes and bootstraps point to it; verifications record tests. None should independently rewrite that meaning.

## 3. Specific over-engineering risks

### Governance about governance

A–F classification, ADRs, maintained pages, ledger states, witnesses, protocols, checkers, and multi-actor review are individually plausible but collectively expensive. An architectural insight should not routinely demand five synchronized documents, several lifecycle transitions, multiple reviews, and a checker merely to become usable.

### Treating every uncertainty as a governed object

`ASSIM-0002` is a genuine consequential open Product/architecture question (Position identity). Less consequential uncertainties can remain plainly marked on the subject page. Formal assimilation obligations should be reserved for cross-boundary, repeated, consequential, or otherwise at-risk knowledge; do not create a second parking lot.

### Verification exceeding the failure

Use a simple link check for links, a structural validator for structure, and architectural judgment for semantic contradiction. Require fresh-actor trials when testing discovery. Avoid universal ceremony or new hard gates absent demonstrated failure and authorization.

### Too many maintained versions of one truth

Account identity or Operating Regime must not be independently defined by a knowledge page, an ADR, bootstrap summaries, steering, and verification records. All secondary representations must route to the owning meaning and original authority, or clearly identify themselves as historical.

## 4. Actual success measures

Evaluate changes on **outcomes**, not counts of obligations, documents, checkboxes, or test cases:

1. **Cold-start reliability:** Can an unfamiliar actor find, cite, and correctly apply task-relevant ratified knowledge without hints?
2. **Principal intervention:** Does the Principal need to reconstruct fewer decisions or correct fewer misunderstandings?
3. **Maintenance burden:** How many authoritative and routed edits are actually necessary per legitimate architectural change?
4. **Engineering throughput / rework:** Does the path from Product question to independently verified operator behavior become faster and less error-prone?
5. **Context efficiency:** How much irrelevant material was loaded in recovery?

These are hypotheses to measure, not claims that improvement has already been demonstrated.

## 5. Reported first-slice evidence and limits

Claude Opus 5.5 medium reported the first assimilation slice committed on remote main at `c66e1811ce2d567c12da594c5f5a3a46ba139f0c`: `ASSIM-0001` VERIFIED for Account / Operating Regime; `ASSIM-0002` PENDING for Position identity. It also reported checker passing and two fresh-reader successes, but both were Kiro sub-agents with preloaded workspace steering; no independent Codex or ChatGPT cold start and no independent domain semantic review were conducted. Credit consumption was not measured by the actor. Treat these as **reported results** until independently verified; VERIFIED is a scoped assimilation status, not a blanket Product ratification or proof of runtime correctness.

Separate unresolved questions include Operating Regime versus Operating Program and the universal identity/lifecycle of Position. Do not promote candidate Position URLs to contracts, infer Operating Regime from Account, or resolve `ASSIM-0002` by implication.

## 6. Next bounded falsification — no machinery expansion

**Objective:** Test whether the maintained knowledge architecture works in practice before modifying the governance design.

- Give one genuinely fresh **Codex** session and one genuinely fresh **ChatGPT** session only the repository locator and a normal engineering/domain question about Account and Operating Regime. Do **not** supply document numbers, knowledge page paths, the correct answer, or a priming summary.
- Each actor must independently follow its canonical cold start and discover current sources, cite actual authority, distinguish ratified meaning from open questions, and describe its permission boundary.
- Use the same neutral question for both: *“For v2, if an Account contains cash or shares managed under different trading approaches, does the Account decide their Operating Regime? Explain the relevant identities, what is settled, what remains open, and any implementation implications.”*
- Record the actual traversal, source paths/lines, relevant versus irrelevant reads, elapsed time if observable, approximate context/token or credit consumption if observable (otherwise UNKNOWN), substantive errors, invented authority, and Principal assistance required.
- Inspect whether each actor relies on a preloaded steering summary rather than independently retrieving a cited governing source. A session with hidden preloaded domain answers is not a clean blind trial; record contamination rather than reporting a pass.
- Independently review the maintained subject page against Doc 82 and applicable ratified decisions for semantic correctness.
- Compare outcomes with maintenance overhead; if tests fail, diagnose the smallest concrete routing or meaning error rather than adding new layers.

**Boundary:** Read-only test and report. No code, API contract, ADR, steering, governance, assimilation-ledger, checker, CI, or roadmap changes; do not resume `ASSIM-0002`, activate staged execution gates, or interfere with the separate `ww live` workstream.

## 7. Decision discipline

The current recommendation is to **pause expansion of governance mechanisms**, not to abandon documentation governance or freeze ordinary authorized engineering. Keep the existing ownership/routing/ledger/checker architecture stable during independent tests. Reassess proportionality using evidence rather than document aesthetics or inferred rigor.

**CURRENT STATE:** Assessment preserved as a bounded, non-governing evaluation; independent cross-actor testing remains outstanding.

**DECISION REQUIRED:** NO for the bounded read-only test requested by the Principal.

**NEXT AUTHORIZED ACTION:** Run independent cold-start recovery and semantic falsification against current accepted remote main; return results and their limits without changing repository files.
