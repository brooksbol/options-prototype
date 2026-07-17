# Principles as Domain Model

**Date:** July 16, 2026
**Status:** Governing architectural foundation

---

## Core Claim

Principles are not documentation. They are the top layer of the domain model.

The system does not merely enforce policies and then explain them with prose. The system reasons in terms of:

```
Principles → Policies → Evidence → Recommendations → Execution → Learning → Refinement
```

A Principle is a first-class architectural entity. Policies are operationalizations of Principles. Evidence is evaluated against Policies. Recommendations are explained by Policies which are justified by Principles. Outcomes are measured against Principles.

This is not an investing-specific model. It is a model for how humans make decisions under uncertainty while managing finite resources. Options income is the first operational proving ground for this governance model.

---

## The Distinction That Matters

### Principle as documentation (rejected)

```
Policy: admissibleDeltaRange = { min: 0.15, max: 0.50 }
Documentation: "We chose this range because of Respect Uncertainty."
```

The principle is a comment. The system doesn't know about it. It cannot reference it, trace to it, measure outcomes against it, or explain itself in terms of it.

### Principle as domain model (adopted)

```
Principle: Respect Uncertainty
  → Policy: admissibleDeltaRange = { min: 0.15, max: 0.50 }
  → Evidence: contract delta = 0.30 (within range)
  → Recommendation: eligible (passes Respect Uncertainty governance)
  → Explanation: "Admitted because delta 0.30 is within the uncertainty-respecting range."
```

The principle is a semantic entity. The system can:
- Reference it when explaining exclusions
- Attribute policies to it
- Measure historical outcomes per principle
- Detect when a principle is poorly operationalized
- Guide the operator toward principled decisions

---

## The Layered Architecture

```
┌─────────────────────────────────────────────────┐
│  PRINCIPLES                                      │
│  Enduring operating philosophy.                  │
│  Rarely change. Govern everything below.         │
│  Answer: "What kind of operator do we want to    │
│  be?"                                            │
└──────────────────────┬──────────────────────────┘
                       │ operationalizes
┌──────────────────────▼──────────────────────────┐
│  POLICIES                                        │
│  Specific rules. Measurable thresholds.          │
│  Configurable. Versioned. Traceable to           │
│  principles.                                     │
│  Answer: "Given our principles, what do we       │
│  permit?"                                        │
└──────────────────────┬──────────────────────────┘
                       │ applied to
┌──────────────────────▼──────────────────────────┐
│  EVIDENCE                                        │
│  Observed market state. Maintained by the        │
│  appliance. Session-aware. Sealed when           │
│  canonical.                                      │
│  Answer: "What is the current environment?"      │
└──────────────────────┬──────────────────────────┘
                       │ produces
┌──────────────────────▼──────────────────────────┐
│  RECOMMENDATIONS                                 │
│  Policy-assessed candidates. Ranked.             │
│  Explainable in terms of the policies and        │
│  principles that admitted or excluded them.       │
│  Answer: "What should the operator consider?"    │
└──────────────────────┬──────────────────────────┘
                       │ acted upon via
┌──────────────────────▼──────────────────────────┐
│  EXECUTION                                       │
│  Operator decision. Broker handoff. Intent       │
│  capture. Outcome recording.                     │
│  Answer: "What did the operator do?"             │
└──────────────────────┬──────────────────────────┘
                       │ generates
┌──────────────────────▼──────────────────────────┐
│  LEARNING                                        │
│  Outcome observation. Principle-level            │
│  effectiveness. Policy calibration evidence.     │
│  Answer: "Did our principles produce good        │
│  institutional outcomes?"                        │
└──────────────────────┬──────────────────────────┘
                       │ refines
                       └──────→ POLICIES (calibration)
                       └──────→ PRINCIPLES (rare, deliberate)
```

---

## Candidate Operating Principles

These are the initial hypotheses. They are stated as enduring commitments about how the operator manages capital under uncertainty. They are domain-general principles applied to options income.

### Preserve Optionality

> Never take an action that permanently forecloses future decisions.

Operationalizations:
- Maintain minimum deployable cash (don't fully commit)
- Prefer defined-risk positions (collateral is bounded)
- Avoid concentration that creates forced-liquidation risk
- Prefer short duration (preserve the right to reassess)

### Respect Uncertainty

> The future is unknowable. Act only where evidence supports the action and risk is bounded.

Operationalizations:
- Require evidence before recommendation (no prediction)
- Exclude products with unobservable embedded risks (leveraged, inverse, daily-reset)
- Require minimum liquidity (OI, volume) before considering a market trustworthy
- Prefer positions where the worst-case is asset ownership at a known price
- Wait is a valid recommendation

### Execute with Discipline

> When acting, act only where the market structure supports reliable execution.

Operationalizations:
- Require minimum bid-ask quality (spread thresholds)
- Require non-zero participation (open interest floor)
- Score and communicate execution quality separately from yield
- Do not enter markets where the midpoint is meaningless

### Earn Proportional Compensation

> Accept risk only when compensated proportionally. Do not reach for yield beyond what uncertainty warrants.

Operationalizations:
- Yield is meaningful only when execution quality supports it
- Suppress unreliable yield calculations (spread > threshold)
- Rank by risk-adjusted return, not nominal premium
- Capital efficiency matters (don't over-collateralize marginal yield)

### Avoid Concentration

> Diversify exposures. No single position, sector, or thesis should dominate.

Operationalizations:
- One recommendation per underlying (current behavior)
- Sector exposure awareness (future)
- Maximum position sizing (future)
- Portfolio-level risk aggregation (future)

### Observe Before Acting

> Maintain continuous awareness of the opportunity environment. The system observes; the operator decides.

Operationalizations:
- Evidence appliance maintains state continuously
- The operator is never required to initiate scanning
- Evidence freshness and session state are always visible
- Historical observation enables pattern recognition over time

### Sustain Institutional Behavior

> The system exists to help a human consistently make better decisions — not to automate decision-making. The system reduces cognitive load, not agency.

Principles are intended to optimize institutional outcomes over long time horizons, not individual transaction outcomes. A principle that "underperformed this month" is not invalidated. The governance question is whether the principle produces better institutional outcomes over the full operating horizon — not whether it maximized the last trade.

Operationalizations:
- The operator remains in the loop for every execution decision
- Recommendations are transparent (principle → policy → evidence → candidate)
- Policy changes are deliberate, versioned, and auditable
- The system reduces cognitive load, not agency
- Learning is structural (principles), not reactive (chasing last trade)

---

## How Principles Relate to Current Implementation

| Current System Element | Principle It Serves | Currently Explicit? |
|------------------------|--------------------|--------------------|
| `admissibleDeltaRange` | Respect Uncertainty | No — threshold without rationale |
| `hardExcludeSpreadPercent: 80` | Execute with Discipline | No — magic number |
| `hardExcludeZeroOI` | Execute with Discipline | No — implied |
| `preferredSpreadPercent: 15` | Execute with Discipline | Partially — named "preferred" |
| `actionableFloor: 65` | Execute with Discipline | No — arbitrary-seeming threshold |
| Yield suppression at 30% spread | Earn Proportional Compensation | Partially — documented as reliability guard |
| One candidate per symbol | Avoid Concentration | No — implementation detail |
| `deployableCash` requirement | Preserve Optionality | Partially — named "deployable" |
| Session-aware acquisition | Observe Before Acting | Yes — documented in evidence-appliance |
| Product structure filter | Respect Uncertainty | No — governance without principle link |
| Operator confirms orders | Sustain Institutional Behavior | Implicit — architectural decision |
| Sealed evidence validity | Observe Before Acting | Yes — documented in validity model |
| Evidence over Prediction | Respect Uncertainty | Yes — existing foundation document |
| Policy over Prediction | Respect Uncertainty | Yes — existing foundation document |

---

## What Changes When Principles Become First-Class

### Explainability

Every recommendation can trace its admission or exclusion to a principle:

```
XLE $88 put, Jul 18, delta 0.28:
  ✓ Respect Uncertainty — delta within evidence-supported range
  ✓ Execute with Discipline — spread 12%, OI 520, score 72
  ✓ Preserve Optionality — cash remaining $500 after collateral
  ✓ Earn Proportional Compensation — 29.8% annualized yield
  → ACTIONABLE (all governance principles satisfied)
```

```
THIN ETF $30 put:
  ✓ Respect Uncertainty — delta 0.25 within range
  ✗ Execute with Discipline — OI 5, volume 0, score 22
  → WAIT (Execution Discipline not satisfied)
```

### Historical Analysis

The highest-value question becomes:

> "Did Preserve Optionality produce better institutional outcomes than a more aggressive capital deployment strategy would have?"

Not:

> "Did delta 0.30 outperform delta 0.25?"

The first is governance. The second is calibration. Both matter, but they are fundamentally different activities:

**Calibration** — Is 15% still the right spread threshold? Are the policy parameters well-tuned for current market conditions? This adjusts parameters within a fixed governance frame.

**Governance** — Is Execute with Discipline actually improving institutional outcomes? Are the principles themselves producing the institutional behavior we intend? This evaluates whether the governance frame itself is sound.

The historical subsystem must support both, but they operate on different time horizons and produce different kinds of learning.

### Policy Calibration

When a threshold changes, it's traceable:

```
Change: actionableFloor 65 → 55
Principle: Execute with Discipline
Rationale: Historical observation shows score 55-64 contracts had acceptable fill rates.
Evidence: 23 executed contracts in the 55-64 range, 91% fill within limit price.
Decision: Lower threshold reflects accumulated evidence, not weakened discipline.
```

### Operator Guidance

The system can eventually communicate:

> "You're about to deploy 80% of available cash into one position. This conflicts with Preserve Optionality. Proceed?"

Not as a hard block — the operator has agency — but as principled transparency.

---

## What This Is Not

### Not a rules engine

Principles don't execute. Policies execute. Principles explain and justify policies. The runtime enforcement mechanism remains policies and thresholds.

### Not a constraint system

Principles don't reject recommendations. Policies reject recommendations because of principles. The distinction matters for override: an operator can override a policy in an exceptional case, but the override is logged against the principle it violated.

### Not investing-specific

The principles are domain-general:
- Preserve Optionality (resource management under uncertainty)
- Respect Uncertainty (epistemics)
- Execute with Discipline (operational excellence)
- Earn Proportional Compensation (risk-adjusted value)
- Avoid Concentration (diversification)
- Observe Before Acting (evidence-based operation)
- Sustain Institutional Behavior (human-in-the-loop governance)

These apply to any domain where a human manages resources under uncertainty. Options income is the first application.

### Not philosophy

This document defines a domain model. Principles are architectural entities with:
- An identifier
- A statement
- Zero or more operationalizing policies
- Traceability to recommendations
- Measurable outcomes

They are as concrete as a Policy or an EvidenceRecord — they just operate at a different layer of abstraction.

---

## Implementation Maturity

### Currently implicit

- Principles exist in the developer's heads and design documents
- Policies reference principles only in comments
- No recommendation carries principle attribution
- No historical record connects outcomes to principles
- The operator sees policies and evidence but not the principles that justify them

### Near-term (pre-SQLite)

- This document captures the principle set
- Existing policies are mapped to principles (documentation)
- The architecture acknowledges principles as a first-class layer
- Future feature design considers principle traceability from the start

### Medium-term (with persistence)

- Policy records carry `principleId` attribution
- Recommendation explanations reference principles
- The "Why N?" disclosure can be organized by principle
- Outcome records carry principle context for later analysis

### Long-term

- Historical learning measured at the principle level
- Policy calibration explicitly references principle effectiveness
- Operator guidance references principles
- The system can answer: "This principle produced these outcomes over N sessions"

---

## Relationship to Existing Foundations

| Foundation | Relationship |
|-----------|-------------|
| **Policy over Prediction** | A consequence of Respect Uncertainty. The foundation document explains *that* we prefer policy. This model explains *why*: because uncertainty is the governing condition. |
| **Evidence Appliance** | An operationalization of Observe Before Acting. The appliance exists because continuous observation is a principle. |
| **State-Oriented Console** | A UI consequence of Observe Before Acting + Sustain Institutional Behavior. The console shows state because the operator needs awareness to make principled decisions. |
| **Closed-Loop Engineering** | The engineering process mirrors the governance model. Both are feedback loops. The engineering loop refines methodology; the governance loop refines policies. |
| **Secondary Observation** | A consequence of Respect Uncertainty. We observe the observation mechanism because uncalibrated evidence violates epistemic discipline. |

---

## Open Questions

1. **Should principles be represented in the runtime type system?** (e.g., `principleId: "preserve_optionality"` on policy records). Likely yes, eventually. Not required immediately.

2. **Can principles conflict?** Yes. Preserve Optionality (hold cash) can conflict with Earn Proportional Compensation (deploy capital). Conflict resolution is the operator's decision, informed by the system's transparency about which principles each action serves or violates.

3. **Who authors principles?** The Principal (in Three Actor Model terms). Principles change rarely and only through deliberate governance review, not through threshold tuning or implementation convenience.

4. **How many principles should exist?** Fewer is better. Each principle should be genuinely load-bearing. The current list of 7 may be correct or may contain consolidatable overlaps. Time and usage will reveal which are distinct.

5. **Should the operator see principle names?** Eventually, probably. The "Why 49?" disclosure could group exclusions by principle rather than by mechanism. But the terminology should feel natural to a practitioner, not academic.

6. **Future common object: PrincipleAssessment.** The architecture naturally suggests a common entity that becomes the shared vocabulary between recommendations, explanations, history, analytics, and operator coaching:

    ```
    PrincipleAssessment {
      principle: PrincipleId
      evidence: reference
      satisfied: boolean
      confidence: high | medium | low
      explanation: string
      outcome: reference (if known, post-execution)
    }
    ```

    Not needed today. Worth noting because it becomes the lingua franca of the governance layer once principles are first-class runtime entities.

---

## Provenance

This governance model draws on institutional stewardship thinking — particularly the observation that effective institutional systems optimize the institution over long time horizons rather than individual transactions. The architecture is intentionally reusable beyond options income because the underlying problem — humans making decisions under uncertainty with finite resources — is domain-general.
