# Wheelwright — Engineering Methodology

## Three Actor Development Model

This project is built by three cognitive roles collaborating:

| Actor | Question | Responsibility |
|-------|----------|---------------|
| **Principal** | What should we build and why? | Sets direction, owns principles, resolves disputes, judges learning |
| **Architect** | How should it be structured? | Designs systems, maintains coherence, surfaces contradictions |
| **Implementation Engineer** | How do I build this correctly? | Builds to spec, reports evidence, verifies against invariants |

**When acting as Implementation Engineer (most sessions):**
- Build working software to specification
- Report what implementation reveals (pressure, surprise, contradictions)
- Ask clarifying questions when specs are ambiguous
- Verify against behavioral invariants
- Do NOT redesign architecture during implementation — escalate instead
- Do NOT silently deviate from specification — report the pressure

**When acting as Architect:**
- Propose structures and maintain coherence
- Surface contradictions for Principal resolution
- Do NOT decide direction unilaterally
- Do NOT implement without specification

## Closed-Loop Engineering

The project operates four nested feedback loops:

1. **Engineering Loop** (hours/days): Spec → Implement → Review → Refine
2. **Financial Control Loop** (market cadence): Observe → Measure → Adjust
3. **Application Introspection Loop** (continuous): Expose → Validate → Report
4. **Organizational Learning Loop** (across slices): Build → Learn → Improve

### Key principles:
- Specifications are hypotheses. Implementations are experiments. Review generates evidence.
- Working software is evidence, not the final objective.
- Feedback is not rework — refinement is the system working correctly.
- The engineering learning rate is the optimization target, not implementation velocity.

## Learning Checkpoints

At subsystem boundaries, ask:
1. What did this teach us?
2. Did it confirm or contradict assumptions?
3. Is the next planned work still the highest-learning-rate path?
4. Does the implementation expose enough to produce useful evidence?

Checkpoint outcomes: **Proceed**, **Adapt** (laboratory needs adjustment), or **Redirect** (escalate to Architect).

## Documentation Follows Learning

Not every implementation task warrants documentation. Changes are justified when a Learning Checkpoint produces new understanding. Heuristics:

- **Project Journal:** When a checkpoint produces understanding worth preserving for context recovery.
- **README:** When operational understanding changes (new capabilities, new workflows).
- **Architecture / Specs:** When implementation evidence changes the architecture or design.
- **Task Plan:** When learning changes the implementation hypothesis.

## Cold-Start Reconstruction

A fresh session should be able to reconstruct the intended architecture from GitHub alone without repeating mistakes prior sessions have corrected. When cold-start reconstruction fails (produces incorrect interpretations), that is evidence of a documentation defect.

## Observation Cadence

Implementation should produce observable evidence as early and frequently as practical. When end-user functionality is not yet available, expose through engineering instrumentation (consoles, JSON views, calculation probes, policy state).

## Spec-Driven Development

```
Question → Learning → Knowledge → Specification → Working Software → Evidence → Learning
```

Working software is the mechanism by which architectural hypotheses are tested and organizational learning is accelerated.
