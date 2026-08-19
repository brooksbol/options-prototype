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
- Canonical project state (parking lot, journal where relevant)
- Specialized references relevant to the current scope
- Implementation and tests when implementation truth matters
- Recent commits when reconciliation may lag documentation

The depth of retrieval should be proportional to the scope and risk of the work.

---

## Reconcile While Learning

At natural boundaries during substantive work, ask:

> **What did the project just learn that the repository does not yet know?**

But also:

> **Is this durable yet?**

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
| Journal entry | Why-state worth preserving for context recovery |
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

### Follow the Minimum Safe Bootstrap

Before any Wheelwright work, follow the current Minimum Safe Bootstrap defined in `docs/README.md`. Do not duplicate a frozen file list here — the reading path is owned by `docs/README.md` and evolves.

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

Before adding parking-lot material, inspect related existing items. Determine whether they:

- Remain valid
- Need reframing
- Became more important
- Were absorbed by other work
- Were superseded
- Conflict with current architecture
- Should be promoted
- Should be removed

Avoid backlog accretion. The parking lot is canonical unresolved project state, not an append-only wish list.

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
- Is parking-lot state current?
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
