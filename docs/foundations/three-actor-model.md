# Three Actor Development Model

**Date:** August 2026
**Status:** Active development methodology
**Related:** `cognitive-role-separation.md` (the domain-independent design principle this methodology applies)

---

## Purpose

This document describes the development methodology by which Wheelwright is built: three cognitive roles collaborating to produce architectural learning and working software.

This is the specific meaning of "Three Actor Model" in Wheelwright project discussions, journal entries, and architectural sessions. It refers to the human + AI development relationship, not to runtime product surfaces or user personas.

---

## The Three Actors

### Principal

**Question:** What should we build and why?

**Responsibilities:**
- Sets direction and priorities
- Owns principles and operating philosophy
- Resolves architectural disputes when the Architect surfaces them
- Makes governance decisions about what enters the architecture vs remains experimental
- Evaluates whether working software produces the intended learning
- Determines when to change direction at coherent stopping points

**In this project:** Brooks. Human. The decision-maker who authorizes architectural evolution and judges whether the system serves its intended purpose.

### Architect

**Question:** How should the system be structured to serve those goals?

**Responsibilities:**
- Designs systems and maintains architectural coherence
- Proposes structures, boundaries, and abstractions
- Identifies consequences of design choices
- Surfaces contradictions for Principal resolution
- Maintains the relationship between principles, invariants, and implementation
- Produces durable documentation of architectural decisions

**In this project:** AI partner in architectural/design sessions. Proposes, analyzes, and documents but does not unilaterally decide.

### Implementation Engineer

**Question:** How do I build this correctly?

**Responsibilities:**
- Builds working software to specification
- Reports evidence about what the implementation reveals
- Asks clarifying questions when specifications are ambiguous
- Verifies behavioral conformance against invariants
- Produces tests that lock intended behavior
- Identifies when implementation creates architectural pressure

**In this project:** AI partner in implementation sessions. Executes, verifies, and reports but does not redesign without escalation.

---

## The Development Learning Loop

The Three Actor Model is not a hierarchy. It is a learning loop:

```
Principal sets direction
    ↓
Architect proposes structure
    ↓
Implementation Engineer builds working software
    ↓
Working software produces evidence
    ↓
Evidence surfaces to Architect (conformance, pressure, surprise)
    ↓
Architect surfaces findings to Principal (contradictions, opportunities, stopping points)
    ↓
Principal decides next direction
```

Each cycle produces:
- Working software (immediate)
- Architectural understanding (compounding)
- Methodology refinement (long-term)

---

## Why Three Roles, Not Two or One

### Without the Principal

The Architect and Engineer produce technically coherent software that may not serve any purpose. Direction drifts. Principles accumulate without governance review. The system becomes internally consistent but externally irrelevant.

### Without the Architect

The Principal and Engineer produce working software without coherent structure. Each feature is implemented correctly in isolation but the system does not compose. Architectural debt accumulates invisibly.

### Without the Implementation Engineer

The Principal and Architect produce beautifully documented architecture that has never been tested against reality. Assumptions go unchallenged. The system exists only in documents.

---

## Relationship to Cognitive Role Separation

This development methodology applies the same underlying insight as the Cognitive Role Separation principle (`cognitive-role-separation.md`):

> Different cognitive roles optimize for different things. Conflating them produces poor outcomes.

The design principle says: product surfaces should separate Explorer, Governor, and Operator concerns.

The development methodology says: the system-building process should separate Principal, Architect, and Implementation Engineer concerns.

Same insight, different application. They share a foundation but are not the same thing.

---

## Relationship to Closed-Loop Engineering

The Three Actor Development Model is the governance structure within which Closed-Loop Engineering operates:

- **Loop 1 (Engineering):** Implementation Engineer's domain — spec → implement → review → refine.
- **Loop 4 (Organizational Learning):** Principal's domain — working software generates evidence that improves future decisions.
- **Architectural review and evolution:** Architect's domain — surfaces findings, proposes structural changes, maintains coherence.

The loops describe what happens. The actors describe who is responsible for each kind of decision within those loops.

---

## Disciplines

### The Principal must not

- Implement (even when it seems faster)
- Design the mechanism (that's the Architect's job)
- Ignore evidence from implementation that contradicts direction

### The Architect must not

- Decide direction unilaterally (that's the Principal's job)
- Implement without specification (that's conflation)
- Suppress findings that create inconvenient pressure

### The Implementation Engineer must not

- Redesign architecture during implementation (escalate instead)
- Silently deviate from specification (report the pressure)
- Treat working software as sufficient without verification against invariants

---

## The Cold-Start Test

The Three Actor Model produces durable artifacts (documents, code, tests) that should allow any of the three roles to be replaced without catastrophic knowledge loss.

A fresh Architect (new Kiro session) should be able to reconstruct the intended architecture from GitHub alone without repeating mistakes that prior sessions have already corrected.

A fresh Implementation Engineer should be able to build the next task from existing specifications without needing conversational context.

The Principal carries intent that may not be fully documented — but the discipline of explicit stopping points, journal entries, and parking-lot items reduces even that dependency.

When a cold-start reconstruction fails (produces incorrect interpretations), that failure is evidence of a documentation defect, not a methodology failure. The methodology's response is to improve the durable artifacts.

---

## Domain Independence

This methodology does not require options, AI, or any specific technology. It applies wherever:

- A human decision-maker (Principal) sets direction
- A design intelligence (Architect) maintains structural coherence
- A building capability (Engineer) produces working artifacts
- The artifacts generate evidence that feeds back into all three roles

The roles need not be filled by different people. They describe different cognitive modes. The discipline is in not conflating them — particularly in not allowing implementation urgency to override architectural coherence or architectural elegance to override Principal-determined direction.
