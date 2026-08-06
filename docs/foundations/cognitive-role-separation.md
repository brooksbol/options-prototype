# Cognitive Role Separation

**Date:** July 2026 (original); August 2026 (separated from Three Actor Model)
**Status:** Governing architectural principle — guides product surface design
**Related:** `three-actor-model.md` (the development methodology that applies this same insight)

---

## Purpose

This document describes the principle of separating fundamentally different cognitive roles in any system that observes, decides, and acts.

This is a product design principle. It guides how Wheelwright's runtime surfaces are structured — which concerns each surface serves, and why conflating them produces poor operator experiences.

This is distinct from the Three Actor Development Model (`three-actor-model.md`), which applies the same underlying insight to the system-building process rather than to the system's product surfaces.

---

## Core Insight

Different cognitive roles optimize for different things.

Conflating them creates poor systems.

An explorer optimizes for discovery and breadth. A governor optimizes for safety and policy compliance. An operator optimizes for reliable execution within constraints.

When a single interface, a single workflow, or a single mental model tries to serve all three simultaneously, it serves none of them well. The explorer is burdened with governance concerns. The governor is distracted by operational details. The operator is overwhelmed by exploratory breadth.

---

## The Three Roles

### Explorer

**Question:** What is possible?

**Optimizes for:** Discovery, breadth, optionality, learning rate.

**Characteristics:**
- Wants to see many candidates.
- Tolerates noise and ambiguity.
- Values surprise and serendipity.
- Does not need operational precision.
- Cares about potential, not deployability.

### Governor

**Question:** Should we proceed?

**Optimizes for:** Safety, policy compliance, institutional reasoning, risk characterization.

**Characteristics:**
- Evaluates candidates against explicit policy.
- Cares deeply about evidence quality and provenance.
- Produces reasoned judgments, not mere pass/fail.
- Operates independently of the explorer's enthusiasm.
- Must explain *why*, not just *whether*.

### Operator

**Question:** How do I execute?

**Optimizes for:** Reliability, precision, efficiency, repeatability.

**Characteristics:**
- Needs exactly the information required for action.
- Values clarity and brevity.
- Assumes governance has already occurred.
- Cares about operational details (timing, mechanics, confirmation).
- Tolerates no ambiguity in execution path.

---

## The Principle

**Every system surface should make explicit which cognitive role it is serving at any given moment.**

When the system knows which role it is serving, it can:
- Present information at the right density.
- Surface the right controls.
- Hide irrelevant complexity.
- Optimize the cognitive experience for the task at hand.

When the system does not know (or pretends all roles are one), it produces interfaces that are simultaneously too noisy for operators, too restrictive for explorers, and too shallow for governors.

---

## Current Manifestations in Wheelwright

| Role | Surface | Status | Purpose |
|---|---|---|---|
| Explorer | Write Desk (recommendation discovery) | Implemented | Scan universe, assess candidates, compare options |
| Governor | Velvet Rope | Designed, not live | Evaluate instruments against institutional admission policy |
| Operator | Operator Console + Broker Handoff | Implemented | Monitor portfolio state, execute admitted opportunities |

These mappings are approximate. In practice, the Write Desk currently blends exploration and operational execution (the operator discovers AND acts from the same surface). Future evolution may sharpen these boundaries as the system matures.

---

## Why Conflation Fails

### Explorer + Governor (conflated)

The screening system tries to both discover opportunities and evaluate them simultaneously. Result: either the explorer is constrained by premature governance, or the governor is overwhelmed by unfiltered candidates.

### Governor + Operator (conflated)

The governance system tries to also be the execution interface. Result: the operator sees institutional reasoning they don't need at execution time, and the governor's careful evaluation is rushed by operational urgency.

### Explorer + Operator (conflated)

The discovery system tries to also be the action interface. Result: the operator acts on insufficiently governed candidates, or the explorer is constrained to only actionable opportunities.

---

## The Separation Test

To determine whether a system properly separates cognitive roles, ask:

1. Can the explorer explore without triggering governance?
2. Can the governor evaluate without being influenced by the explorer's enthusiasm?
3. Can the operator execute without re-evaluating governance?
4. Does each role have exactly the information they need — no more, no less?
5. Are handoffs between roles explicit and observable?

If any answer is no, the roles are conflated.

---

## Relationship to Other Principles

**Secondary Observation** — The governor needs to trust the evidence before trusting the conclusion. Secondary observation is a governance concern.

**Policy over Prediction** — Policy is the governor's primary tool. The explorer discovers; the governor applies policy; the operator executes within governed constraints.

**Closed Feedback Loops** — Each role produces evidence that feeds the others. The operator's execution results feed the governor's future evaluations. The governor's admissions feed the explorer's understanding of what passes policy.

**State-Oriented Console** — The Operator Console embodies this principle: it serves the operator role specifically, showing "what is" rather than discovery or governance concerns.

---

## The Naming Is Flexible

The three roles have been expressed in many domains:

| Domain | Explorer | Governor | Operator |
|---|---|---|---|
| Generic | Explorer | Governor | Operator |
| Scientific | Scientist | Reviewer | Technician |
| Corporate | Strategist | Executive | Manager |
| Military | Intelligence | Command | Operations |

The names change. The separation does not.

---

## Domain Independence

This principle survives the removal of all domain nouns.

It does not require options, diamonds, ETFs, AI, or any specific technology. It applies wherever systems must balance the tension between discovering what is possible, deciding what is permissible, and executing what has been decided.

That domain independence is what makes it foundational.

---

## Historical Note

This document was originally published as "Three Actor Model" and contained both:
- The domain-independent product design principle (this document)
- The development methodology (Principal / Architect / Implementation Engineer)

These were separated in August 2026 after cold-start reconstruction tests demonstrated that combining both meanings under one name reliably caused confusion. The development methodology is now documented separately in `three-actor-model.md`. The underlying insight — that different cognitive roles should not be conflated — is shared between both documents.
