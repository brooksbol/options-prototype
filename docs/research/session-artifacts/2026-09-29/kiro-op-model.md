# Development Operating Model

This document defines how development work is conducted on the Wheelwright project.

It supplements the architectural documentation by describing the collaboration process rather than the software architecture.

---

# Principles

## GitHub is the source of project truth

Conversation context is ephemeral.

Architecture decisions, implementation status, roadmaps, parking-lot items, journals, and acceptance criteria must be reconstructible from GitHub alone.

When in doubt ask:

> What if there were no conversation history?

---

## Evidence over assumption

Do not infer implementation status.

Verify.

Examples:

- implementation complete?
- tests passing?
- Java parity?
- documentation synchronized?

Repository evidence wins over conversational memory.

---

# Discussion Modes

There are several distinct conversation modes.

The assistant should recognize which mode is occurring.

## Exploration

Questions like:

- What about...
- Have you considered...
- Could we...

Purpose:

Generate ideas.

Do not immediately begin implementation planning.

Do not assume the idea has been accepted.

---

## Design

Purpose:

Refine a proposed design.

Challenge assumptions.

Discuss tradeoffs.

Seek architectural clarity before implementation.

---

## Decision

When the user explicitly ratifies a design:

- capture the decision;
- identify durable documentation required;
- determine whether an ADR, journal entry, or architecture update is needed.

---

## Implementation

When instructed to implement:

Focus on execution.

Avoid reopening settled architectural questions unless implementation uncovers a genuine conflict.

---

# Proposal Style

Prefer:

"This could..."

"This would imply..."

"This tradeoff exists..."

Avoid presenting speculative ideas as completed architectural direction.

---

# Journal Discipline

The assistant should proactively identify when journal updates are appropriate.

Typical triggers:

- architecture ratified;
- parking-lot item accepted;
- milestone completed;
- principle discovered;
- workflow changed;
- major implementation completed.

Ask:

> Should this be journaled?

rather than silently omitting it.

---

# Documentation Discipline

After significant work ask:

Have we updated:

- architecture documents?
- parking lot?
- README?
- project journal?
- ADRs?

Documentation should remain synchronized with implementation.

---

# Commit Discipline

Never create commits without explicit approval.

Instead:

1. propose commit boundary;
2. summarize files;
3. propose commit message;
4. wait.

---

# Implementation Reviews

After implementation report:

- files changed;
- tests added;
- test results;
- known limitations;
- remaining work;
- suggested commit boundary.

---

# UI Acceptance

Passing tests are not sufficient.

User-facing changes require:

- running application;
- screenshots;
- operator workflow validation.

---

# Priority Changes

Before beginning a new architectural direction:

Determine whether the current increment has reached a natural stopping point.

Prefer finishing coherent operator capabilities before changing priorities.

---

# Architectural Escalation

Do not generalize abstractions prematurely.

Solve today's operator problem cleanly.

Extract broader abstractions only after multiple concrete implementations demonstrate the pattern.

---

# Reminder Behavior

Rather than interrupting implementation repeatedly, provide lightweight reminders when appropriate.

Examples:

"After this increment we should update the journal."

"This probably deserves an ADR."

"This changes the README."

Avoid excessive interruptions.

---

# End-of-Increment Checklist

Before considering an increment complete:

- implementation complete
- tests passing
- UI validated
- documentation synchronized
- commit boundary proposed
- user approval obtained before commit
