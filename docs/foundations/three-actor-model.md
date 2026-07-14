# Three Actor Model

## Purpose

This document describes the principle of separating fundamentally different cognitive roles in any system that observes, decides, and acts. It is the most foundational architectural principle in this project because many other principles (including attenuation, policy governance, and feedback loops) derive from understanding *who* the system is serving at a given moment.

This is not specific to options, diamonds, or software. It applies wherever a system must balance exploration, governance, and execution.

---

## Core Insight

Different actors optimize for different things.

Conflating them creates poor systems.

An explorer optimizes for discovery and breadth. A governor optimizes for safety and policy compliance. An operator optimizes for reliable execution within constraints.

When a single interface, a single workflow, or a single mental model tries to serve all three simultaneously, it serves none of them well. The explorer is burdened with governance concerns. The governor is distracted by operational details. The operator is overwhelmed by exploratory breadth.

---

## The Three Actors

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

**Every system should make explicit which actor it is serving at any given moment.**

When the system knows who it is talking to, it can:
- Present information at the right density.
- Surface the right controls.
- Hide irrelevant complexity.
- Optimize the cognitive experience for the task at hand.

When the system does not know (or pretends all actors are one), it produces interfaces that are simultaneously too noisy for operators, too restrictive for explorers, and too shallow for governors.

---

## Manifestations in This Project

| Actor | System | Role |
|---|---|---|
| Explorer | Opportunity Lab | Scan the universe of possibilities |
| Governor | Velvet Rope | Evaluate against institutional policy |
| Operator | Deployment (future) | Execute the admitted opportunity |

Each system has different:
- Information density requirements
- Decision support needs
- Temporal characteristics
- Success criteria

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

To determine whether a system properly separates actors, ask:

1. Can the explorer explore without triggering governance?
2. Can the governor evaluate without being influenced by the explorer's enthusiasm?
3. Can the operator execute without re-evaluating governance?
4. Does each actor have exactly the information they need — no more, no less?
5. Are handoffs between actors explicit and observable?

If any answer is no, the actors are conflated.

---

## Relationship to Other Principles

**Secondary Observation** — The governor needs to trust the evidence before trusting the conclusion. Secondary observation is a governance concern.

**Policy over Prediction** — Policy is the governor's tool. The explorer predicts; the governor governs; the operator executes within governed constraints.

**Closed Feedback Loops** — Each actor produces evidence that feeds the others. The operator's execution results feed the governor's future evaluations. The governor's admissions feed the explorer's understanding of what passes policy.

**Progressive Attenuation** — The same information, presented differently depending on which actor is currently being served. Nothing is hidden; density is adjusted.

---

## The Naming Is Flexible

The three actors have been expressed in many ways:

| Domain | Explorer | Governor | Operator |
|---|---|---|---|
| Generic | Explorer | Governor | Operator |
| Scientific | Scientist | Reviewer | Technician |
| Corporate | Strategist | Executive | Manager |
| Military | Intelligence | Command | Operations |
| This project | Opportunity Lab | Velvet Rope | Deployment |

The names change. The separation does not.

---

## Domain Independence

This principle survives the removal of all domain nouns.

It does not require options, diamonds, ETFs, AI, or any specific technology. It applies wherever systems must balance the tension between discovering what is possible, deciding what is permissible, and executing what has been decided.

That domain independence is what makes it foundational.
