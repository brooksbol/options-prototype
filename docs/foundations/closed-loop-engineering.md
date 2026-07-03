# Closed-Loop Engineering

## Purpose

This document describes the engineering philosophy that underpins the Options Prototype and, more broadly, the spec-driven development methodology this project is helping establish.

This is not an implementation specification. It does not describe what to build or how to build it. It explains *why* the project is structured the way it is — and specifically, why it is structured as a system of nested feedback loops rather than a linear pipeline from specification to delivery.

---

## Core Insight

Traditional software development is open-loop: a specification is written, software is built, and the specification is never revisited. Errors in understanding compound silently.

This project operates as a closed-loop system. Every layer of the process generates evidence that feeds back into every other layer. The goal is not merely to produce software — it is to produce *understanding* that improves the software, the process, and the team's engineering judgment over time.

---

## Four Nested Loops

The project operates four feedback loops, each nested inside the next. Inner loops cycle faster. Outer loops learn from the accumulated evidence of inner loops.

```
┌─────────────────────────────────────────────────────────────┐
│                 4. Organizational Learning Loop              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              3. Application Introspection Loop         │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           2. Financial Control Loop              │  │  │
│  │  │                                                 │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │        1. Engineering Loop                │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  │    Spec → Implement → Review → Refine    │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  │                                                 │  │  │
│  │  │         Observe → Measure → Adjust              │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │     Running software validates its own state          │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Working software generates evidence that improves          │
│  future specs, architecture, and engineering understanding  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Loop 1: Engineering Loop

**Spec → Implement → Review → Refine**

The innermost loop. Cycles within hours or days.

### How it works

1. A specification is written (domain, requirements, architecture, design).
2. Working software is built to realize the specification.
3. The implementation is reviewed against the specification.
4. Discrepancies are resolved — sometimes by fixing the implementation, sometimes by refining the specification.

### Key principle

The specification is a hypothesis. The implementation is an experiment. Review generates evidence. Refinement integrates that evidence back into the shared understanding.

### What feeds outward

Every refinement cycle produces two outputs:
- Better software (immediate value).
- Better understanding of the domain (compounding value).

---

## Loop 2: Financial Control Loop

**Observe → Measure → Adjust**

The domain loop. Cycles at the cadence of market observation.

### How it works

1. **Observe** — The system presents options chain data, contract characteristics, and income metrics to the user.
2. **Measure** — The user evaluates contracts against explicit policies (target delta, yield thresholds, moneyness preferences).
3. **Adjust** — The user changes screening criteria, selects different underlyings or expirations, or refines their mental model of the income opportunity.

### Key principle

The system makes the decision process observable — it does not automate it. The user remains the decision-maker. The software provides clarity, not answers.

### What feeds outward

Each observation cycle teaches the user (and the development team) which metrics matter, which policies are useful, and where the domain model is incomplete or misleading. These insights feed back into the Engineering Loop as specification refinements.

### Relationship to software architecture

The software's architecture mirrors this loop directly:
- **Observe** → MarketDataProvider + UI tables
- **Measure** → Domain calculations + policy evaluation
- **Adjust** → Policy inputs (target delta, future screening criteria)

This is intentional. The architecture is isomorphic to the control loop it serves.

---

## Loop 3: Application Introspection Loop

**The running application exposes and validates its own implementation state.**

The self-awareness loop. Continuous while the application is running.

### How it works

The application contains knowledge of its own structure:
- Which domain modules exist and their implementation status.
- Which providers are active and which are planned.
- Which calculations are implemented and tested.
- Which policies are active and which are configurable.
- Which components are wired and which are stubbed.
- References back to the specifications that define expected behavior.

### Key principle

A system that can describe itself is easier to debug, easier to extend, and easier to hand off. The running application is its own best documentation — not in the sense of generating docs from code, but in the sense of exposing its implementation state as a first-class observable.

### What feeds outward

Introspection makes the gap between specification and implementation visible to anyone interacting with the system. It converts "I think this is done" into "the system confirms this is done." This evidence feeds the Organizational Learning Loop by making progress concrete rather than anecdotal.

### Relationship to the Engineering Loop

The Engineering Laboratory is a feedback mechanism for the Engineering Loop itself. When a developer completes a task, the laboratory confirms (or contradicts) that claim through live experiments. When a developer changes a policy parameter, the laboratory produces observable evidence of the consequence. This reduces the cost of review and makes refinement decisions data-driven.

---

## Loop 4: Organizational Learning Loop

**Working software generates evidence that improves future specifications, architecture, and engineering understanding.**

The outermost loop. Cycles across slices, projects, and time.

### How it works

1. Each completed slice produces working software.
2. Working software validates (or invalidates) the specifications that produced it.
3. Validated patterns become reusable methodology.
4. Invalidated assumptions become documented lessons that prevent future errors.

### Key principle

The goal of the project is not only to build the Options Prototype. It is to establish a repeatable, domain-first, spec-driven methodology that improves with each application. The Options Prototype is evidence — it proves (or disproves) that the methodology works.

### What it accumulates

- Which document structures work well (charter, environment, domain, requirements, architecture, design, tasks).
- Which sequencing produces the least rework (domain before architecture, architecture before implementation).
- Which actor boundaries prevent scope creep (Principal, Architect, Implementation Engineer).
- Which policies minimize wasted agent credits (environment contracts, tool verification, no speculative code).
- Which feedback mechanisms catch errors earliest (domain tests before UI, introspection dashboards, traceability matrices).

### Relationship to future projects

Every future Kiro project benefits from the organizational learning accumulated here. The methodology documents, the project structure conventions, and the feedback loop architecture are all reusable assets — not just the code.

---

## How the Loops Feed Each Other

```
Engineering Loop
    produces → working software + refined understanding
    feeds → Financial Control Loop (better tools for observation)
    feeds → Introspection Loop (more state to expose)
    feeds → Organizational Learning Loop (evidence of what works)

Financial Control Loop
    produces → domain insight
    feeds → Engineering Loop (specification refinements)
    feeds → Organizational Learning Loop (domain clarity patterns)

Application Introspection Loop
    produces → implementation visibility
    feeds → Engineering Loop (verification without manual review)
    feeds → Organizational Learning Loop (progress evidence)

Organizational Learning Loop
    produces → methodology improvements
    feeds → Engineering Loop (better starting specs, better architecture patterns)
    feeds → all future projects (accumulated engineering judgment)
```

---

## The Mirror Principle

The project intentionally mirrors its own architecture at every level:

| Level | Control Loop Pattern |
|-------|---------------------|
| Domain (options income) | Observe → Measure → Adjust |
| Engineering process | Spec → Implement → Review → Refine |
| Application runtime | Expose → Validate → Report |
| Organization | Build → Learn → Improve |

This is not a coincidence. Systems that mirror their own structure are easier to reason about, easier to extend, and more resilient to change. When the architecture of the process matches the architecture of the software matches the architecture of the domain, cognitive load is minimized and alignment is maintained naturally.

---

## Implications for Contributors

1. **Specifications are living documents.** Expect them to change. Implementation teaches us things that specification alone cannot.

2. **Working software is evidence.** It does not merely fulfill requirements — it validates or invalidates the thinking that produced those requirements.

3. **Feedback is not rework.** Refinement is the system working correctly. A specification that never changes was either perfect (unlikely) or never tested against reality.

4. **Observability is a first-class concern.** If you cannot observe it, you cannot control it. This applies equally to market data, implementation state, and engineering process.

5. **The project is its own best argument.** If the methodology works, the software will demonstrate it. If it doesn't, the software will reveal that too. Either outcome is valuable.
## Observation Cadence

Closed-loop engineering is optimized for **observation cadence**, not merely implementation cadence.

Working software is necessary but not sufficient. The system should produce observable evidence as early and as frequently as practical.

When end-user functionality is not yet available, implementation should be exposed through engineering-facing instrumentation such as:

- Engineering consoles
- Raw domain objects
- JSON views
- Calculation probes
- Policy state
- Traceability views
- Implementation status dashboards

These are not temporary debugging aids. They are instruments that shorten the time between implementation and learning.

The goal is that every meaningful implementation slice produces observable evidence, allowing humans and AI to review reality rather than assumptions.