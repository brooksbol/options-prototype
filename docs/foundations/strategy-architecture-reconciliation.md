# Strategy–Architecture Reconciliation

**Date:** August 31, 2026
**Status:** Ratified methodology — governs strategic and architectural evolution
**Related:** `three-actor-model.md`, `closed-loop-engineering.md`, `architectural-evolution-methodology.md`, `../07-architecture-current.md`, `../parking-lot.md`

---

## Purpose

Wheelwright maintains product/strategic direction and architectural direction as distinct but continuously reconciled views of intended evolution.

This methodology exists to provide enough direction and governance to preserve coherence without suppressing architectural exploration, innovation, or learning.

It is intentionally lightweight. It does not establish an enterprise-style artifact taxonomy or a roadmap bureaucracy.

---

## Core Principles

### Explore freely; reconcile before committing

Architectural exploration does not require prior roadmap authorization.

The Principal may introduce observations, intuitions, operator experiences, hypotheses, analogies, annoyances, possibilities, and speculative ideas at any time. The Architect may pursue those threads freely to discover structure, consequences, contradictions, or opportunities.

The strategic roadmap provides direction, not an exploration boundary.

Before exploratory architecture becomes intended architectural direction or implementation commitment, it must be reconciled with current strategic direction and current architecture.

### Govern commitment, not curiosity

Governance increases with consequence.

```text
Idea → Exploration → Emerging Insight → Reconciliation → Decision → Implementation
```

Freedom is intentionally highest during exploration. Stronger governance applies when an idea becomes strategic direction, architectural commitment, policy, invariant, or implementation work.

An idea may remain interesting and durable without becoming roadmap direction.

### Strategy and architecture are distinct but continuously reconciled

The Product/Strategic Roadmap answers:

> Where are we trying to go, and what do we currently believe will get us there?

The Architecture Roadmap answers:

> How must the system structurally evolve to enable that direction?

Neither is subordinate clerical documentation for the other.

Strategic change creates architectural implications. Architectural constraints, discoveries, and opportunities create strategic feedback. Changes in either view should trigger consideration of the other.

The relationship is bidirectional:

```text
Product / Strategic Roadmap
          ⇅
   Reconciliation
          ⇅
  Architecture Roadmap
```

Architecture must not invent an independent modernization agenda detached from strategic intent. Strategy must not prescribe desired capability while ignoring architectural reality.

### The roadmap records current direction, not promised destination

A roadmap is a versioned statement of current direction under current knowledge.

It is not a promise to preserve that direction when evidence changes.

Working-software evidence, operator experience, experiments, architectural discoveries, market observations, implementation pressure, and new ideas may strengthen, weaken, reject, supersede, or reshape current Bets and architectural direction.

Course correction is evidence of learning, not roadmap failure.

---

## Three Actor Model Responsibilities

This methodology operates within the Three Actor Development Model.

### Principal

Owns strategic direction and the decision to change it.

The Principal:
- introduces strategic intent, ideas, experiential evidence, and questions;
- decides what matters and why;
- determines whether reconciliation findings justify changing direction;
- authorizes architectural evolution and implementation commitment;
- evaluates whether delivered behavior produces the intended learning.

The Principal does not need to formulate architectural mechanisms before introducing an idea.

### Architect

Owns structural reasoning and reconciliation analysis.

The Architect:
- explores ideas without requiring premature roadmap classification;
- identifies architectural implications, constraints, opportunities, and contradictions;
- reconciles emerging architecture against current strategic direction;
- reconciles strategic Bets against current architecture;
- surfaces strategic feedback to the Principal rather than changing direction unilaterally;
- preserves architectural coherence and durable reasoning.

The Architect may conclude that an exploration is valuable but presently directionless. That is a legitimate result.

### Implementation Engineer

Owns correct implementation and implementation evidence.

The Implementation Engineer:
- implements only after the appropriate design and decision boundary has been crossed;
- verifies conformance with ratified architecture, policy, and invariants;
- reports surprises, constraints, performance evidence, and architectural pressure;
- escalates architectural pressure rather than silently redesigning during implementation.

Implementation evidence feeds back through the Architect to the Principal and may cause either roadmap to change.

---

## The Operating Loops

### 1. Discovery Loop — Principal ↔ Architect

This is intentionally low-friction architectural exploration.

The Principal's continuous idea stream is a primary input, not an interruption to roadmap planning.

A new idea is not immediately forced into a Bet, architectural transition, or backlog item. Principal and Architect explore it long enough to understand what it may mean.

Capture should occur **late enough to understand, early enough not to lose**.

Exploration may:
- fizzle without durable consequence;
- produce learning worth journaling;
- expose unresolved work worth parking;
- strengthen or weaken an existing Bet;
- reveal a candidate Bet;
- expose architectural pressure;
- reveal a missing strategic choice;
- produce a candidate architectural transition.

One idea may legitimately produce several of these outcomes.

### 2. Reconciliation Loop — Strategy ↔ Architecture

When exploration becomes materially interesting, the Architect evaluates it against both current strategic direction and current architecture.

Useful questions include:
- Which Goal or Bet, if any, does this advance or challenge?
- Does this reveal a missing Bet or strategic opportunity?
- Does current architecture already support it?
- Does it extend, pressure, or conflict with current architecture?
- Does it reveal an architectural prerequisite or constraint?
- Is it interesting but presently directionless?

The Architect surfaces findings. The Principal decides whether strategic direction changes.

Reconciliation does not itself authorize implementation.

### 3. Delivery-Learning Loop — Principal → Architect → Implementation Engineer → Evidence

After design and decision, implementation produces evidence.

```text
Principal sets direction
    ↓
Architect proposes structure
    ↓
Implementation Engineer builds and verifies
    ↓
Working software produces evidence
    ↓
Architect interprets conformance, pressure, and surprise
    ↓
Principal evaluates whether direction should change
```

Evidence may change the Product/Strategic Roadmap, the Architecture Roadmap, both, or neither.

---

## Course Correction

Roadmap change is triggered by material evidence, not by calendar ceremony.

A material finding may originate from:
- working software;
- operator experience;
- empirical experiment;
- architectural discovery;
- implementation pressure;
- market or provider behavior;
- a newly explored idea;
- contradiction between roadmap direction and architectural reality.

The normal course-correction flow is:

```text
Evidence or insight
    ↓
Architect interprets significance
    ↓
Architect surfaces roadmap pressure
    ↓
Principal decides whether direction changes
    ↓
Current roadmap is updated
    ↓
Consequential reasoning is preserved in the journal / decision record
```

The current roadmap should describe what is believed now. It should not accumulate obsolete direction merely to preserve history. Consequential changes preserve their reasoning in durable project memory.

Bets are expected to be more fluid than Goals; Goals are expected to be more fluid than Vision. None is immutable merely because it is higher in the tree.

A Bet may be Candidate, Pursuing, Supported, Weakened, Rejected, Superseded, or Retired as learning accumulates. These states describe current strategic understanding, not delivery status.

---

## Durable Working Views

This methodology uses a deliberately small set of views.

### Product / Strategic Roadmap

Owns:
- Vision;
- Goals;
- Bets / hypotheses;
- measures and relevant evidence;
- current strategic state;
- references to architectural implications and relevant unresolved work.

It does not prescribe target architecture.

### Architecture Roadmap

Owns:
- current-to-intended architectural transitions;
- strategic pressures that motivate those transitions;
- architectural constraints and opportunities;
- unresolved architectural questions;
- relationships to strategic Bets and current architecture.

Its unit is an architectural transition, not a feature or technology project.

It does not override `07-architecture-current.md`. The architecture roadmap may contain intended or emerging direction; `07-architecture-current.md`, governing foundations, and ratified ADRs describe what governs now.

### Parking Lot

Owns unresolved state:
- questions;
- experiments;
- implementation opportunities;
- technical debt;
- research;
- ideas not mature enough for either roadmap;
- concrete unresolved manifestations of roadmap concerns.

The parking lot is not the strategic roadmap and is not the architecture roadmap.

### Project Journal

Preserves consequential learning and course corrections: what changed, what evidence caused the change, and why the new direction was adopted.

---

## Reconciliation Vocabulary

During deliberate reconciliation, the following labels may be used as analytical vocabulary. They are not governance states.

- **ALIGNED** — current architecture already supports the strategic direction.
- **ALREADY-RATIFIED** — the apparent Bet is substantially an established architectural direction rather than an unresolved strategic hypothesis.
- **EXTENDS** — the direction is a natural extension of current architecture.
- **PRESSURES** — the direction is plausible but exposes material architectural change.
- **ARCH-GAP** — the required capability lacks an adequate architectural home or model.
- **CONFLICTS** — the direction contradicts an existing governing decision, principle, or invariant.

Reconciliation may cause a Bet to be reframed, combined, decomposed, weakened, rejected, or moved downward into initiatives. It may also cause architecture to expose a missing Bet or strategic option.

---

## Discipline

The methodology intentionally rejects two failure modes.

### Roadmap as permission system

A strategic roadmap must not prevent exploration simply because an idea cannot yet be traced to an existing Bet.

Unmapped exploration is allowed. Some future strategic direction will originate there.

### Roadmap as prescription

A roadmap must not become a delivery contract that survives contrary evidence.

Direction is maintained strongly enough to prevent aimless architectural drift and lightly enough to permit evidence-driven course correction.

The desired property is **direction without rigidity**.
