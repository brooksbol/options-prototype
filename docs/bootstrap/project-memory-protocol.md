# Documentation Diligence / Project-Memory Protocol

**Date:** August 2026
**Status:** Ratified methodology
**Authority:** Category B — Ratified Methodology (same classification as `foundations/three-actor-model.md`, `foundations/closed-loop-engineering.md`)
**Related:** `docs/README.md` (authority root), `foundations/closed-loop-engineering.md`, `foundations/three-actor-model.md`, `foundations/architectural-evolution-methodology.md`

---

## Central Invariant

Wheelwright treats GitHub as durable project memory.

The governing question:

> **What if there were no conversation history?**

If a future actor cannot reconstruct important state, reasoning, authority, unresolved questions, and relevant history from the repository, project memory is incomplete.

Conversely, if the repository already contains that knowledge but the actor does not retrieve it, bootstrap is incomplete.

---

## Two Symmetrical Obligations

> **Write what must be remembered.**

> **Read what has already been remembered.**

The Principal is not the project's sole rememberer or synchronization mechanism.

---

## The Memory Loop

```
Observe
    → Learn
    → Decide what is durable
    → Reconcile
    → Persist
    → Retrieve
    → Reason
    → Observe
```

Every actor participates in this loop. Persistence without retrieval is useless. Retrieval without persistence is impossible.

---

## Start with the Authority Model

Always begin documentation orientation at:

**`docs/README.md`**

This is the documentation authority root. It defines:

- The A–F Document Authority Model (what type of authority each document carries)
- The Minimum Safe Bootstrap (reading path for safe operating competence)
- The Comprehensive Architectural Orientation (deeper reading path)
- The Complete Document Index with per-document classification and status

Do not hard-code the authority model from memory. Reacquire it from the repository — it evolves.

Do not freeze file lists into actor bootstraps or protocol documents when `docs/README.md` already owns those relationships.

---

## Read Before Reasoning

Before substantive work, retrieve relevant:

- Current authority model (`docs/README.md`)
- Governing architecture (Category A documents)
- Ratified decisions and accepted designs (Category B, especially ADRs)
- Canonical project state (the complete parking-lot continuation sequence, journal where relevant)
- Specialized references relevant to the current scope
- Implementation and tests when implementation truth matters
- Recent commits when reconciliation may lag documentation

**Parking-lot continuation rule:** `docs/parking-lot.md`, `docs/parking-lot-2.md`, and any later numbered continuation files are physical pages of **one logical canonical parking lot**. Any cold start, backlog scan, reconciliation, or search for related parking-lot material must inspect the complete `docs/parking-lot*.md` sequence. File boundaries do not create separate authority, governance, priority, or ID namespaces.

The depth of retrieval should be proportional to the scope and risk of the work.

### Topical journal retrieval

In addition to recent journal entries (for chronological context), search the journal **topically** for prior observations, unfinished reasoning, rejected approaches, and unresolved questions relevant to the current work.

An unfinished observation from weeks ago may be more relevant to today's exploration than yesterday's implementation work. The journal is intellectual history, not merely a recent-activity log.

Do not read journal entries as authority. Read them as potentially relevant prior thinking whose epistemic status must be preserved. Prior journal hypotheses may inform current reasoning but do not dictate it.

---

## Reconcile While Learning

At natural boundaries during substantive work, ask:

> **What did the project just learn that the repository does not yet know?**

But also:

> **Is this durable yet?**

**Durable does not mean authoritative or ratified.** An unresolved thought can deserve durable preservation if losing it would cause future actors to repeat meaningful reasoning, miss important evidence, rediscover an attractive rejected approach, confidently reconstruct an understanding the project had already learned to question, or lose useful context needed to resume an unfinished exploration. The journal exists precisely to hold durable-but-unratified intellectual state.

Not every observation deserves promotion into authority. Work states are:

| State | Meaning |
|-------|---------|
| **Exploration** | Investigating, questioning, hypothesizing |
| **Design** | Proposing structure, evaluating alternatives |
| **Decision** | Ratifying direction, accepting design |
| **Implementation** | Building authorized working software |

Do not silently promote one state into another. Exploration does not become architecture merely because it was discussed.

---

## Persistence Discipline

### Determine the correct durable home

When project learning crosses a durability threshold, determine where it belongs:

| Possible Home | When Appropriate |
|---------------|-----------------|
| Governing architecture update (Category A) | System definition changed |
| New or amended ADR (Category B) | Decision was made |
| Ratified design update (Category B) | Accepted design evolved |
| Foundation update (Category B) | Methodology or principle refined |
| Canonical project state (Category C) | Parking-lot, journal, or contract changed |
| Reconciliation artifact (Category D) | Checkpoint needed for provenance |
| Specialized reference (Category E) | Bounded topic documented |
| Journal entry | Why-state worth preserving for context recovery — including unfinished reasoning, unresolved questions, and hypotheses whose epistemic status is accurately labeled |
| No documentation yet | Learning is too immature to persist |

Do not create documents merely because documentation is possible. Documentation has a cost — future actors must distinguish active authority from accumulated reference.

### Journal discipline

The journal (`docs/journal/project-journal.md`) is:

- Append-only
- Chronological
- Raw project memory (why-state, not polished prose)
- Not a formal specification
- Not an ADR log
- Not a routine implementation changelog

Use the journal when understanding changed in ways worth preserving for future context recovery. Do not journal routine implementation progress.

Do not rewrite old entries to make history appear linear.

#### The journal preserves unfinished intellectual state

"Why-state" includes not only "why did we decide this?" but also:

- Why are we uncertain?
- What have we already considered?
- What interesting hypothesis did we notice but not resolve?
- What explanation looked plausible?
- What did we try that changed our thinking?
- What question remains unfinished?

The journal can legitimately contain:

- Hypotheses that later prove wrong
- Competing explanations
- Unresolved tensions
- Operator intuitions awaiting evidence
- Observations whose significance is unknown
- Rejected reasoning worth remembering
- Ideas that never become architecture

The requirement is not that journal entries be correct. The requirement is that their **epistemic status be accurate**. "We suspect X" must remain a recorded suspicion, not silently become "X is true" because it appears in GitHub. Append-only history is valuable precisely because later entries can show observation → hypothesis → experiment → contradiction → revised understanding without rewriting the earlier thought.

#### Durability threshold

A useful test for journal inclusion:

> Would losing this unfinished thought cause a future actor to repeat meaningful reasoning, miss important evidence, or confidently reconstruct an understanding the project has already learned to question?

If yes, it is a strong candidate for journal preservation — regardless of whether the thought is finished, correct, or ever becomes architecture.

Do not turn the journal into a transcript archive. Not every conversational thought deserves preservation. The threshold is meaningful intellectual work that would otherwise be lost.

### Reconciliation artifacts

Category D artifacts preserve provenance — how we arrived at the current state.

Their ratified consequences should be absorbed into the appropriate A/B/C artifacts. Do not make future actors synthesize a growing stack of checkpoint documents to determine current truth.

### Historical documents

Category F documents are retained for project memory. They **never govern**. Each carries an inline `⚠️ HISTORICAL` marker with a successor pointer.

Do not resurrect historical documents as governing sources merely because their filenames sound foundational.

---

## Retrieval Discipline

### Persistence is not recall

Writing knowledge into GitHub does not help if a new actor does not know that it must retrieve those things before reasoning forward.

Two complementary failure modes exist:

- **Failure A — Persistence without recall.** The repository already contains relevant knowledge, but the cold actor fails to retrieve it. The cold-start bootstrap infrastructure addresses this.
- **Failure B — Recall without persistence.** The cold actor diligently searches the repository, but important prior thinking was never persisted there. No bootstrap procedure can retrieve knowledge that was left only in conversation history.

Both actors share responsibility for preventing Failure B (persist what matters) and Failure A (retrieve what was persisted).

### Follow the Minimum Safe Bootstrap

Before any Wheelwright work, follow the current Minimum Safe Bootstrap defined in `docs/README.md`. Do not duplicate a frozen file list here — the reading path is owned by `docs/README.md` and evolves. Where that path refers to the parking lot, it means the complete continuation sequence, not only the original file.

### Retrospective sweeps

Continuous reconciliation is preferred. Retrospective sweeps are repair.

For a time-bounded sweep, define scope from actual project activity and commits rather than conversation salience. This protects against recency bias.

The test is: *Could a future actor reconstruct why the project is this way without today's conversation?*

---

## Epistemic Integrity

### Distinguish evidence types

| Type | Example |
|------|---------|
| Observed evidence | "The system returns X when Y" |
| Derived fact | "Therefore Z must be true" |
| Interpretation | "This probably means..." |
| Policy | "We require..." |
| Recommendation | "Consider..." |
| Prediction | "This will likely..." |
| Operator-declared objective | "I want..." |
| Inferred semantics | "This implies the domain concept is..." |
| Implementation artifact | "The code currently does..." |

Implementation is evidence, not automatic authority. Code may reveal defects, hidden assumptions, drift, missing provenance, emerging concepts, or architectural pressure. It does not become architecture merely by existing.

### Evidence before abstraction

Before inventing a new primitive, registry, taxonomy, framework, policy DSL, or domain object, ask whether an existing concept already owns the semantics.

Prefer:

```
concrete observation → repeated evidence → extracted abstraction
```

over:

```
interesting idea → generalized framework
```

### Numeric parameters require authority

When a numeric parameter affects analytical behavior, classify it:

- Domain/physical constraint
- Externally defined
- Empirically derived
- Principal-ratified provisional parameter
- Experimental parameter
- Implementation convenience
- Unknown

Do not silently promote plausible numbers into institutional truth.

---

## Contradictions Are Findings

Surface disagreement among architecture, implementation, tests, operator experience, documentation, and current reasoning. Do not manufacture premature consistency.

Useful classifications include:

- Already supported by current architecture
- Implementation defect
- Presentation defect
- Unsupported inference
- Documentation drift
- Existing concept needing clarification
- Architectural pressure (candidate evolution)
- Candidate extension
- Experimental / parking-lot material
- Premature / speculative
- Reject / out of scope

---

## Parking-Lot Discipline

Before adding parking-lot material, inspect related existing items across the **complete `docs/parking-lot*.md` continuation sequence**. Determine whether they:

- Remain valid
- Need reframing
- Became more important
- Were absorbed by other work
- Were superseded
- Conflict with current architecture
- Should be promoted
- Should be removed

Avoid backlog accretion. The parking lot is canonical unresolved project state, not an append-only wish list.

### Physical continuation

The parking lot may be split across numbered Markdown files solely for maintainability. This does not create multiple parking lots.

- `docs/parking-lot.md` is the first physical page.
- `docs/parking-lot-2.md` and later numbered files continue it.
- Stable IDs are global across all pages.
- Governance and disposition semantics are unchanged across pages.
- New intake belongs in the latest continuation unless an existing item's original record must be reconciled.
- Searches, cold starts, backlog reviews, and reconciliation sweeps must scan all pages.

---

## Commit Governance

Documentation follows the same commit gate as code.

"Just documentation" is not an exception to the commit discipline.

Do not commit without explicit Principal authorization. Requests to investigate, analyze, reconcile, inspect, propose, explore, or review are not permission to commit.

---

## End-of-Workstream Memory Check

Before substantial work is declared complete, ask:

- What did we learn?
- What became durable?
- What remains provisional?
- What was rejected?
- What changed architecturally?
- What changed operationally?
- Is the correct authority layer current?
- Is journal why-state preserved where needed?
- Is the complete parking-lot continuation sequence current?
- Are checkpoint conclusions absorbed into A/B/C?
- Are implementation-only invariants missing from architecture?
- Are historical documents accidentally being treated as active?
- If docs were added/superseded/reclassified, is `docs/README.md` still accurate?
- Could a cold actor reconstruct where to resume?

---

## Preserve Significant Rejected Approaches

Record rejected approaches when forgetting them would cause likely future rediscovery and rework. Preserve:

- The proposal
- Why it was plausible
- Challenging evidence
- Rejection reason
- Remaining uncertainty

Do not turn GitHub into a transcript archive. Preserve only what prevents costly repetition.

---

## Actor-Specific Responsibilities

This protocol applies to all actors. Each actor bootstrap defines its specific obligations:

- **ChatGPT** (`bootstrap/chatgpt-cold-start.md`): Notice documentation checkpoints during reasoning. Identify when important learning would otherwise remain trapped in conversation. Include documentation-reconciliation obligations in Kiro prompts.

- **Kiro** (`bootstrap/kiro-cold-start.md`): Actively inspect whether affected durable artifacts remain truthful during authorized work. Identify documentation checkpoints naturally rather than waiting to be asked.

- **Principal**: Determine when learning crosses the durability threshold. Authorize persistence. Reduce dependency on human memory by improving durable artifacts when repeated reminders are needed.

Both AI actors must respect mode and authorization boundaries. Noticing that documentation needs reconciliation is not permission to edit during Exploration.

---

## The Remembering Rule

> **Read before reasoning.**
> **Reconcile while learning.**
> **Stop before committing.**
