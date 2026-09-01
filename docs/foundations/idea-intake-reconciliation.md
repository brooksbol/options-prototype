# Idea Intake and Reconciliation Pipeline

**Date:** September 1, 2026  
**Status:** Ratified methodology  
**Authority:** Category B — Ratified Methodology  
**Related:** `docs/roadmap.md`, `docs/architecture-roadmap.md`, complete `docs/parking-lot*.md` sequence, `docs/journal/project-journal.md`, `docs/bootstrap/project-memory-protocol.md`, `foundations/strategy-architecture-reconciliation.md`, `foundations/three-actor-model.md`

---

## Purpose

Wheelwright needs one standard path for turning a newly discovered idea into durable project state without confusing curiosity, strategic direction, architectural consequence, implementation scope, or priority.

The canonical pipeline is:

> **discovery → durable intake → strategic reconciliation → architectural reconciliation → why-state preservation → implementation decomposition / commitment**

This sequence is mandatory for material new ideas unless an earlier stage is genuinely inapplicable and that fact is explicit.

The governing rule remains:

> **Explore freely; reconcile before committing. Govern commitment, not curiosity.**

---

## 1. Discovery Does Not Modify the Roadmap

Conversation, operator observation, experiments, incidents, implementation discoveries, and research may produce ideas freely.

Discovery should distinguish, where possible:

- the observed fact or operator experience;
- the interpretation or hypothesis derived from it;
- the proposed capability or change;
- the evidence/example that triggered the idea from the broader concept itself.

A discovery is not automatically a roadmap Bet, architectural decision, requirement, or implementation authorization.

When a discovery is still too immature to survive outside the conversation, continue exploring. When losing it would force meaningful rediscovery or risk reconstructing the project incorrectly, it has crossed the durability threshold and enters intake.

---

## 2. Durable Intake Gives the Idea a Stable Identity

Every material idea crossing the durability threshold must be reconciled against the **complete `docs/parking-lot*.md` sequence** before a new item is created.

The intake actor must determine whether the idea:

- already exists;
- refines an existing item;
- should merge into an existing item;
- is a genuinely new unresolved concern;
- conflicts with, supersedes, or is superseded by existing work.

If genuinely new, assign a globally unique stable `PL-*` ID immediately and record it in the latest parking-lot continuation file.

The canonical parking lot is the **system of record for unresolved idea identity and disposition**. GitHub issues, standalone discovery documents, chat transcripts, prompts, and journal entries may provide supporting evidence or workflow convenience, but they do **not** replace the parking-lot identity.

If a richer discovery record is useful, the parking-lot item should link to it. The richer artifact does not become a parallel intake registry.

### Intake invariants

1. Stable identity is created before deciding final roadmap or architecture placement.
2. Merges preserve explicit mappings from original concepts/IDs.
3. Nothing disappears without a recorded disposition.
4. Parking-lot row order does not imply priority.
5. A Principal decision to work on an item next changes **commitment/sequence**, not its epistemic or architectural state.
6. Intake does not authorize implementation.

---

## 3. Strategic Reconciliation

For every material intake item, reconcile against `docs/roadmap.md`.

Ask:

- Is this evidence for, refinement of, or pressure on an existing Vision / Goal / Bet / Initiative?
- Does it expose a genuinely new strategic Bet?
- Is it primarily an experiment or implementation idea beneath existing strategy?
- Does it weaken, contradict, or supersede existing strategic direction?

Prefer strengthening or refining existing roadmap structure when it already expresses the intent. Do not manufacture a new Bet merely because a new implementation idea exists.

If current strategic direction changes materially, update `docs/roadmap.md`. If no roadmap change is warranted, record that conclusion in the intake disposition/reconciliation so future actors do not repeat the question.

Strategic reconciliation answers **what outcome/capability is worth pursuing and why**. It does not prescribe architecture.

---

## 4. Architectural Reconciliation

After strategic meaning is understood, reconcile the resulting pressure against `docs/architecture-roadmap.md`, governing architecture, ADRs, foundations, and related parking-lot items.

Ask:

- What must become structurally true for the strategic intent to be provided coherently?
- Which existing architectural concepts already own these semantics?
- Does this create new architectural pressure, refine an existing pressure, or require no architectural change?
- Does implementation evidence reveal a defect rather than an architectural gap?
- What boundaries, provenance, state, invariants, or contracts would be affected?

Prefer connection to existing architecture over parallel abstractions.

If architectural direction changes materially, update the appropriate Category A/B/C artifact according to authority. If no architectural change is warranted, record that conclusion rather than silently skipping the stage.

Strategic Bets may create architectural pressure; they do not automatically authorize implementation.

---

## 5. Preserve Why-State

When reconciliation materially changes or clarifies Wheelwright's understanding, preserve the reason in the appropriate provenance home.

Use:

- `docs/journal/project-journal.md` for chronological why-state, important operator observations, hypotheses, and unfinished intellectual state;
- a reconciliation/checkpoint artifact when a bounded, structured provenance record is justified;
- the intake/discovery artifact as supporting detail when appropriate.

Preserve concrete triggering examples without allowing the example to collapse the broader concept into one special case.

The record should make clear what was observed, what was inferred, what changed, what was rejected, and what remains unresolved.

---

## 6. Implementation Decomposition and Commitment Come Last

Only after the idea has durable identity and has been reconciled strategically and architecturally should Wheelwright determine implementation units.

Implementation work may:

- attach to existing `PL-*` items;
- split into child implementation items;
- produce an ADR/design artifact when needed;
- require an experiment before implementation;
- be rejected or deferred despite strategic validity.

Do not create implementation work merely to satisfy the existence of an intake item.

A Principal statement such as **"work on this next"** establishes sequencing/commitment. It does not waive truthful semantics, strategic reconciliation, architectural reconciliation, design work, or other required gates.

---

## State Model

The following state model is descriptive and should be inferable from the item's disposition and linked artifacts; it is not a requirement to add a new status field to every table.

> **DISCOVERED → INTAKE → RECONCILED → DECOMPOSED → IMPLEMENTABLE / EXPERIMENTAL / DEFERRED / REJECTED / MERGED / SUPERSEDED**

Important distinctions:

- **DISCOVERED**: meaningful idea exists, not yet durably normalized.
- **INTAKE**: stable parking-lot identity exists; placement unresolved or under reconciliation.
- **RECONCILED**: strategic and architectural relationships are explicit.
- **DECOMPOSED**: concrete implementation/experiment units and dependencies are understood.
- **IMPLEMENTABLE**: authorized work has sufficiently resolved design/authority to build.

Priority is orthogonal to these states.

---

## Required Intake Record

A new material parking-lot intake should contain enough information for a cold actor to answer:

1. **What was discovered?**
2. **What triggered it?** Distinguish evidence/example from the general concept.
3. **Why might it matter?**
4. **What existing concepts/items are related?**
5. **What is unresolved?**
6. **What is explicitly not authorized yet?**
7. **Where is the richer evidence/why-state, if any?**

Do not force speculative answers merely to fill a template.

---

## Reconciliation Completion Record

When reconciliation is complete, the durable project state must make explicit:

- strategic disposition: new Bet / strengthens existing Bet(s) / no roadmap change / rejected / other;
- architectural disposition: new pressure / refines existing pressure / implementation defect / no architecture change / other;
- parking-lot mapping: retained / merged / split / promoted / superseded / resolved / deferred;
- why-state location when material;
- next authorized mode: further exploration / experiment / design / implementation / no work.

A future actor should not have to infer these mappings from a conversation.

---

## GitHub Issues and Standalone Intake Documents

GitHub Issues may be used for coordination, discussion, or external workflow, but they are not the canonical Wheelwright idea-intake registry.

Standalone discovery/intake documents may be created when the reasoning is too rich for a parking-lot row, but:

- the idea still receives a `PL-*` identity in the canonical parking lot;
- the parking-lot item links to the richer document;
- the richer document clearly states its epistemic/authority status;
- roadmap and architecture remain authoritative in their own domains.

This prevents multiple competing backlogs.

---

## Actor Responsibilities

### Principal

- Decides strategic direction and work sequencing.
- Determines when an idea is important enough to pursue.
- Ratifies material changes in direction/design according to existing governance.

### Kiro

- Reconstructs existing concepts before proposing new ones.
- Performs strategic and architectural reconciliation.
- Identifies mappings, contradictions, pressure, and required design work.
- Does not treat implementation convenience as architecture.

### ChatGPT

- Preserves discovery distinctions during discussion.
- Notices when a durable intake boundary has been crossed.
- Ensures new work enters through the canonical parking-lot identity before handing off to Kiro.
- Includes relevant intake IDs/artifacts in cold-start prompts.

### Codex

- Implements or performs mechanical experiments only after the relevant work has been decomposed/authorized.
- Does not invent roadmap or architectural placement from implementation mechanics.

---

## Cold-Start Rule

Any actor handling a material new idea must retrieve this methodology together with:

- `docs/roadmap.md`;
- `docs/architecture-roadmap.md`;
- the complete `docs/parking-lot*.md` sequence;
- `foundations/strategy-architecture-reconciliation.md`;
- relevant journal/project-memory evidence.

The actor must not substitute conversation memory for this repository state.

---

## Canonical Short Form

When brevity is useful, the Wheelwright idea pipeline is:

> **Explore → Intake (`PL-*`) → Reconcile Strategy → Reconcile Architecture → Preserve Why → Decompose → Authorize/Implement**

If a future thread proposes a different intake path, this document governs unless explicitly superseded by a later ratified methodology.
