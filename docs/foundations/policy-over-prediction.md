# Policy over Prediction

## Purpose

This document describes the principle of governing behavior through explicit policy rather than attempting to predict outcomes. Instead of asking "What will happen?" the system asks "Given current evidence, what policy should govern our behavior?"

---

## Core Insight

Prediction is fragile. Policy is robust.

A system that tries to predict outcomes must be right about the future. A system that applies policy to current evidence only needs to be right about what it observes now and what rules it has agreed to follow.

Prediction fails silently — you don't know it was wrong until after the consequence. Policy fails explicitly — you know exactly which rule was triggered and why.

---

## The Distinction

### Predictive Thinking

```
Current state → Model of future → Predicted outcome → Action
```

Failure mode: The model is wrong. The action was based on a future that didn't materialize. The error is invisible until too late.

### Policy Thinking

```
Current evidence → Explicit policy → Governed action
```

Failure mode: The policy is wrong. But the policy is explicit, reviewable, and adjustable. The error is visible and correctable.

---

## Why Policy Wins

1. **Transparency** — Policy is readable. "Maximum spread: 15%" is something a human can evaluate. "The model predicts this trade will be profitable" is not auditable.

2. **Stability** — Policy doesn't change with each new data point. It provides consistent governance across varying conditions.

3. **Debuggability** — When a policy-governed system produces a surprising result, you can trace exactly which rules fired and why. When a predictive system surprises you, the explanation is "the model was wrong."

4. **Institutional trust** — Institutions don't trust predictions. They trust policies. An investment committee wants to know "what rules are protecting us?" not "what does the model think will happen?"

5. **Composability** — Policies compose cleanly. You can add a new policy without invalidating existing ones. Adding a new prediction to a model may destabilize the entire output.

---

## The Hierarchy

Policy does not eliminate measurement or interpretation. It sits atop them:

```
Evidence (observed facts)
      ↓
Interpretation (what the facts mean)
      ↓
Policy (what rules govern our response)
      ↓
Outcome (what we do)
```

Each layer is distinct and auditable.

---

## Manifestations in This Project

Velvet Rope is fundamentally a policy engine, not a prediction engine.

It does not predict whether a trade will be profitable.

It asks: "Given current market evidence, does this opportunity satisfy institutional policy for deployment?"

Examples:
- Spread exceeds 15% → Policy says: do not deploy (execution risk too high).
- Open interest below 50 → Policy says: do not deploy (insufficient participation).
- Premium below target → Policy says: compensation is insufficient.

None of these predict the future. All of them apply explicit rules to current evidence.

---

## When Prediction Is Appropriate

Policy over prediction is not "never predict." It's "don't use prediction where policy would suffice."

Prediction is appropriate when:
- The decision genuinely requires forecasting (weather, demand planning).
- Historical patterns are the only available evidence.
- The cost of being wrong is low and recoverable.

Policy is appropriate when:
- The decision is about risk management or governance.
- Explicit rules can be articulated and agreed upon.
- Institutional trust requires auditability.
- The cost of being wrong is high or irreversible.

---

## The Policy Lifecycle

Policies are not static. They evolve through evidence:

1. **Articulate** — State the policy explicitly.
2. **Apply** — Use the policy to govern decisions.
3. **Observe** — Collect evidence about the policy's effectiveness.
4. **Refine** — Adjust thresholds, add nuance, or retire policies that don't serve their purpose.

This is itself a closed feedback loop — the policy improves through use, but it improves *explicitly* rather than through opaque model retraining.

---

## Relationship to Other Principles

**Three Actor Model** — Policy is the governor's primary tool. The explorer discovers; the governor applies policy; the operator executes within governed constraints.

**Secondary Observation** — Policy should account for evidence quality. A policy that ignores mechanism health is applying rules to potentially unreliable evidence.

**Closed Feedback Loops** — Policy outcomes feed the organizational learning loop. Patterns of policy hits reveal whether thresholds are well-calibrated.

---

## Domain Independence

This principle survives the removal of all domain nouns.

It applies in any system where:
- Decisions must be made under uncertainty.
- Auditability matters more than optimality.
- Institutional trust requires explicit reasoning.
- The cost of unpredictable behavior exceeds the cost of conservative rules.

That describes regulatory compliance, access control, content moderation, medical protocols, quality assurance, and financial governance — among many others.
