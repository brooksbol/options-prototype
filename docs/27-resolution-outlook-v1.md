# Resolution Outlook V1 — Implementation Design Note

**Date:** August 2026
**Status:** Provisional operating experiment
**Architecture home:** ADR-013 amendment (Resolution Outlook), ADR-014 amendment (Forecast semantics)

---

## Purpose

This document records the V1 Resolution Outlook classification policy. It is an intentionally crude starting rule chosen for its simplicity and observability, not for theoretical validity.

The system can teach us more by running than we can learn by arguing about starting parameters.

---

## What We're Trying to Learn

1. Is a coarse directional classification useful for Bridge Income cash-flow planning?
2. Are the provisional parameters (5 DTE / 3% moneyness) adequate for ~$1K planning accuracy?
3. How early can the system make a useful directional call versus staying Uncertain?
4. Which positions tend to surprise the classification, and what additional evidence might help?

---

## The Policy

### Classification categories

| Category | Meaning | Production Outlook treatment |
|----------|---------|------------------------------|
| **Likely expires OTM** | Evidence suggests position will be OTM at expiration | No additional production (premium already recognized at receipt) |
| **Likely assigned** | Evidence suggests position will be ITM at expiration | Economic Consequence (appreciation for calls/buy-writes; form change for puts) included in outlook |
| **Uncertain** | Evidence does not support a directional claim | Excluded from point estimate; may contribute to bounded range |

### Classification logic

```
IF position does not expire within current month:
    → not applicable (outside forecast scope)

ELSE IF moneyness is null (no price observation):
    → Uncertain

ELSE IF DTE > temporalWindow:
    → Uncertain

ELSE IF abs(moneyness) <= moneynessBuffer:
    → Uncertain

ELSE IF moneyness > 0 (ITM):
    → Likely assigned

ELSE (moneyness < 0, OTM):
    → Likely expires OTM
```

### Provisional parameters

| Parameter | V1 Value | Rationale |
|-----------|----------|-----------|
| `temporalWindow` | 5 DTE | Conservative: only classify when resolution is temporally imminent |
| `moneynessBuffer` | 3% (0.03) | Moderate: willing to make a directional call when position is meaningfully separated from strike, but not so conservative that everything stays Uncertain |

These are **Principal-selected conservative starting parameters for the first operating experiment.** They are not derived from volatility models, historical calibration, or theoretical analysis. They will be evaluated against actual outcomes and refined if needed.

### Why both gates are required

- High DTE + deep OTM: the underlying has time to move. Cannot classify.
- Low DTE + near ATM: small moves can change the outcome. Cannot classify.
- Low DTE + far from strike: the market would need to move significantly in very little time. Directional classification is reasonable for planning purposes.

---

## Observability Requirements

### Record successive classifications

A position's Resolution Outlook classification should be observable over time, not just at the moment of resolution. Record:

- Classification as of each Evidence observation (when underlying price refreshes)
- The evidence that produced it (DTE, moneyness, underlying price at observation time)
- Timestamp of observation

This allows future evaluation of questions like:
- "Did this position stay classified consistently, or did it oscillate?"
- "Is 5 DTE the right temporal gate, or would 3 DTE produce fewer surprises?"
- "Which positions were classified 'Likely assigned' but actually expired OTM?"

### Compare with outcomes

After each month closes, the reconciled production (from ProductionAssessor) provides ground truth. We can then ask:
- For positions classified as "Likely assigned" — were they actually assigned?
- For positions classified as "Likely expires OTM" — did they actually expire?
- What was the dollar impact of any misclassification on the forecast?

If the answer is "misclassifications cost less than $1K in forecast error per month," the policy is adequate for its purpose.

---

## What This Policy Does NOT Do

- Does not consume delta, IV, expected move, or any market-implied evidence (those may enter later if needed)
- Does not apply to positions resolving beyond month-end
- Does not authorize any deployment action
- Does not claim the parameters are optimal or even good — only that they are explicit, observable, and worth operating
- Does not produce a probability — only a coarse directional category

---

## ADR-014 Invariants Preserved

- Premium recognized at receipt is never re-counted at expiration
- "Likely expires OTM" for a put does NOT produce additional forecast production (the premium was already counted)
- "Likely assigned" for a covered call/buy-write includes only the appreciation consequence, not the premium
- Resolving capital is context, not production
- No assumed redeployment, no extrapolation, no fabricated income

---

## Relationship to Forecast Composition

Production Outlook (the planning-grade estimate) composes:

```
Recognized Production (factual floor, from ProductionAssessor)
    +
Likely Additional Production (Economic Consequence amounts
    from positions classified as "Likely assigned" where
    assignment produces additional production — primarily
    covered call / buy-write appreciation)
    =
Base Estimate (rounded per Epistemic Precision)

Bounded Range (optional):
    Economic Consequence amounts from "Uncertain" positions
    presented as possible additional production, not included
    in the base estimate
```

This structure preserves ADR-014: premium is never double-counted. Only appreciation from call/buy-write assignment constitutes *additional* production beyond what's already recognized.
