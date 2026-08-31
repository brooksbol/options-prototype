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

### Quality and differentiation cut across both roadmaps

Not every important concern belongs exclusively to product strategy or architecture.

For a capability, Wheelwright may need to reason explicitly about:

- which qualities determine whether the capability is useful;
- what **good enough for the current operating context** means;
- what **good** looks like beyond that stopping point;
- whether excellence in a particular quality contributes to Wheelwright's differentiation or is merely enabling/commoditized;
- what evidence establishes current adequacy;
- what condition would justify returning later to close more of the gap.

Relevant quality dimensions are capability-specific. Examples may include reliability, accuracy, freshness, completeness, accessibility, reproducibility, explainability, provenance, observability, latency, or efficiency. Wheelwright does not maintain a universal scorecard merely for symmetry.

This quality/differentiation lens is a **cross-cutting working view**, not a third roadmap hierarchy and not a new artifact bureaucracy. It may pressure product direction and architecture simultaneously.

### Good enough is a legitimate stopping condition

A Bet or Initiative does not need to be false, complete, or exhausted for current work to stop.

A capability may be intentionally left at **good enough for now** when:

- it is fit for the current operating context;
- additional improvement remains possible;
- the remaining gap is understood well enough;
- another area offers greater strategic, learning, or enabling value now.

Stopping at good enough should preserve the remaining gap and, when material, the conditions that would cause Wheelwright to revisit it.

This is not abandonment. It is deliberate allocation of attention over time.

### Differentiation determines where excellence matters

Wheelwright should not seek excellence uniformly.

Some capabilities are enabling or commoditized and should become sufficiently reliable, maintainable, and fit for purpose without absorbing disproportionate investment.

Other capabilities may be intentionally differentiating. For those, repeated movement from good enough → good → excellent may be strategically valuable.

The Principal owns the strategic judgment about where Wheelwright intends to differentiate. The Architect helps expose the structural and quality consequences of that choice.

### Trustability is an emerging cross-cutting differentiator

Wheelwright increasingly treats the operator's question

> **Can I trust what I'm seeing?**

as a system-wide quality concern.

Trustability is not owned by one feature, component, roadmap, or quality attribute. Depending on the capability, it may be supported by combinations of accuracy, freshness, completeness, explicit uncertainty, provenance, determinism, reproducibility, explainability, operational reliability, and trustworthy attention or silence.

Trustability therefore blurs the product/architecture boundary by design:

- product direction determines what trustworthy operator understanding requires;
- architecture must make those promises true;
- implementation and operating evidence reveal where trust breaks down;
- those findings may pressure either roadmap.

Trustability should not be reduced to a generic checklist or forced into a new Goal merely because it is important.

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
- determines where Wheelwright intends merely to be fit for purpose and where it intends to differentiate;
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
- identifies relevant capability-quality dimensions and evidence of adequacy when useful;
- distinguishes current fit-for-purpose gaps from differentiating opportunities;
- surfaces strategic feedback to the Principal rather than changing direction unilaterally;
- preserves architectural coherence and durable reasoning.

The Architect may conclude that an exploration is valuable but presently directionless. That is a legitimate result.

### Implementation Engineer

Owns correct implementation and implementation evidence.

The Implementation Engineer:
- implements only after the appropriate design and decision boundary has been crossed;
- verifies conformance with ratified architecture, policy, and invariants;
- reports surprises, constraints, performance evidence, quality evidence, and architectural pressure;
- escalates architectural pressure rather than silently redesigning during implementation.

Implementation evidence feeds back through the Architect to the Principal and may cause either roadmap to change.

---

## The Operating Loops

### 1. Discovery Loop — Principal ↔ Architect

This is intentionally low-friction architectural exploration.

The Principal's continuous idea stream is a primary input, not an interruption to roadmap planning.

A new idea is not immediately forced into a Bet, architectural transition, quality target, or backlog item. Principal and Architect explore it long enough to understand what it may mean.

Capture should occur **late enough to understand, early enough not to lose**.

Exploration may:
- fizzle without durable consequence;
- produce learning worth journaling;
- expose unresolved work worth parking;
- strengthen or weaken an existing Bet;
- reveal a candidate Bet;
- expose architectural pressure;
- reveal a missing strategic choice;
- reveal a relevant quality or differentiation question;
- produce a candidate architectural transition.

One idea may legitimately produce several of these outcomes.

### 2. Reconciliation Loop — Strategy ↔ Quality/Fitness ↔ Architecture

When exploration becomes materially interesting, the Architect evaluates it against current strategic direction, current architecture, and—where relevant—the quality/fitness expectations that make the capability valuable.

Useful questions include:
- Which Goal or Bet, if any, does this advance or challenge?
- Does this reveal a missing Bet or strategic opportunity?
- What does good look like for this capability?
- What does good enough look like in the current operating context?
- Which quality dimensions actually matter here?
- Is this capability enabling/commoditized or potentially differentiating?
- Are we seeking excellence in a quality that does not warrant it?
- Does current evidence justify continuing, stopping for now, or revisiting later?
- What decision are we waiting to make, and what evidence are we waiting for before making it?
- What does this work unlock, depend on, or delay?
- Does current architecture already support it?
- Does it extend, pressure, or conflict with current architecture?
- Does it reveal an architectural prerequisite or constraint?
- Is it interesting but presently directionless?

The Architect surfaces findings. The Principal decides whether strategic direction, quality ambition, current work, or architecture direction changes.

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
Architect interprets conformance, pressure, quality, and surprise
    ↓
Principal evaluates whether direction or current investment should change
```

Evidence may change the Product/Strategic Roadmap, the Architecture Roadmap, quality/fitness expectations, current work, or none of them.

---

## Choosing What to Work on Next

The roadmap is not itself the answer to "what next?" It is one input to that decision.

A useful next-work discussion considers, as appropriate:

- current strategic direction;
- active Bets and the decisions they are trying to inform;
- experiments and what they are expected to teach;
- current capability adequacy relative to good enough and good;
- differentiation intent;
- architectural readiness and pressure;
- dependencies and unlocking value;
- implementation and operating evidence;
- opportunity cost of continuing current work;
- conditions under which intentionally deferred improvement should be revisited.

The relevant question is often not "Is this work valuable?" but:

> **Is the next increment of effort here more valuable than the next increment somewhere else, given what we now know?**

A valid answer may be to continue, stop at good enough, redirect, defer, gather more operating evidence, or return later.

---

## Course Correction

Roadmap change is triggered by material evidence, not by calendar ceremony.

A material finding may originate from:
- working software;
- operator experience;
- empirical experiment;
- architectural discovery;
- implementation pressure;
- quality/fitness evidence;
- market or provider behavior;
- a newly explored idea;
- contradiction between roadmap direction and architectural reality.

The normal course-correction flow is:

```text
Evidence or insight
    ↓
Architect interprets significance
    ↓
Architect surfaces roadmap / quality / architecture pressure
    ↓
Principal decides whether direction or current investment changes
    ↓
Current authoritative view is updated
    ↓
Consequential reasoning is preserved in the journal / decision record
```

The current roadmap should describe what is believed now. It should not accumulate obsolete direction merely to preserve history. Consequential changes preserve their reasoning in durable project memory.

Bets are expected to be more fluid than Goals; Goals are expected to be more fluid than Vision. None is immutable merely because it is higher in the tree.

A Bet may be Candidate, Pursuing, Supported, Weakened, Rejected, Superseded, or Retired as learning accumulates. These states describe current strategic understanding, not delivery status.

A capability may also be judged good enough for the current context even while its associated Bet remains supported and further improvement remains possible.

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

### Quality / Differentiation View

A lightweight cross-cutting view used when useful to answer:

- which qualities matter for a capability;
- what good enough means now;
- what good or excellent could mean later;
- whether excellence is strategically differentiating or merely polish;
- what evidence supports the current assessment;
- what would cause intentional deferred improvement to be revisited.

This view does **not** require a standalone document, universal maturity scale, or quality scorecard. It may be expressed in roadmap notes, experiment framing, reconciliation records, architecture reasoning, or another lightweight durable form appropriate to the decision.

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
- **GOOD-ENOUGH-NOW** — current capability fitness is sufficient for the present operating context; further improvement remains intentionally deferred.
- **DIFFERENTIATING** — excellence in this capability or quality is believed to contribute materially to what makes Wheelwright distinctive.
- **ENABLING** — the capability is necessary but is not presently a chosen area of differentiation.

These are analytical labels, not mandatory lifecycle states or a scoring system.

Reconciliation may cause a Bet to be reframed, combined, decomposed, weakened, rejected, or moved downward into initiatives. It may also cause architecture to expose a missing Bet or strategic option, or cause current work to stop intentionally at good enough.

---

## Discipline

The methodology intentionally rejects several failure modes.

### Roadmap as permission system

A strategic roadmap must not prevent exploration simply because an idea cannot yet be traced to an existing Bet.

Unmapped exploration is allowed. Some future strategic direction will originate there.

### Roadmap as prescription

A roadmap must not become a delivery contract that survives contrary evidence.

Direction is maintained strongly enough to prevent aimless architectural drift and lightly enough to permit evidence-driven course correction.

### Uniform excellence

Wheelwright must not treat every capability as deserving the same level of refinement.

Engineering energy should follow strategic importance, current adequacy, differentiation intent, dependencies, and evidence—not the local availability of further polish.

### Quality bureaucracy

Wheelwright must not replace judgment with a universal quality taxonomy, maturity matrix, or mandatory scorecard.

Quality dimensions exist to improve strategic and architectural reasoning, not to create clerical completeness.

The desired property remains **direction without rigidity**, now coupled with deliberate fitness and differentiation judgment.
