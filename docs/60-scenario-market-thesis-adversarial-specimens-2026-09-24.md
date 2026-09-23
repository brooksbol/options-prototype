# Scenario / Market Thesis Adversarial Specimens — 2026-09-24

**Status:** Category E semantic-reconciliation artifact under `PL-SEM-01`; not implementation authority  
**Predecessor pressure:** `docs/59-practitioner-strategy-semantic-falsification-2026-09-24.md`  
**Question:** Does Scenario / Market Thesis deserve durable entity identity, or is it better represented as a governed semantic Assertion family?

## 1. Candidate distinction

A practitioner strategy treatment often states or assumes something about future market evolution: direction, magnitude, volatility, path, correlation, rates, or term structure.

The candidate must not collapse into:

- Objective/Purpose — what the governed program/mandate seeks;
- Outcome Stance — desirability/acceptability toward a specified outcome;
- Preference — ordering among admissible alternatives/outcomes;
- Policy — governed rules/constraints;
- Alternative — a path available for decision;
- realized market state — what actually happened.

## 2. Adversarial specimens

### Covered call

The same shares + short-call construction can support:

- disposition/call-away, where upside through the strike may be welcome;
- strategic overwrite, where retention may be preferred;
- premium harvest, where the operator may have no strong directional forecast.

A “neutral to moderately bullish” practitioner thesis therefore cannot be inferred from the construction and is not required for the construction to exist. It may be an input to evaluation, but it does not own the position, mandate, or Outcome Stance.

**Result:** thesis is an assertion used by reasoning, not construction identity or Intent.

### Cash-secured put

A CSP may be used for desired acquisition, premium production, or a mixture. An operator can desire assignment at a governed price while simultaneously holding a cautious or even mildly bearish near-term market thesis.

**Result:** market expectation and assignment desirability are independent axes. Thesis cannot be Outcome Stance.

### Long straddle

A long straddle may be selected because the operator/model expects a large move or volatility expansion. But it may also be held as event insurance/hedging where the operator does not claim that a large move is likely; the purpose can be protection against a possible tail.

**Result:** scenario thesis may be absent while Objective/Purpose still justifies an Alternative. Thesis is not universally required and cannot define the strategy.

### Iron condor

A common practitioner explanation maps the iron condor to range-bound/short-volatility conditions. A systematic volatility-risk-premium program, however, may deploy a condor without an operator-specific point forecast that the underlying “will stay here.” The governing rationale can be distributional/model-based and repeated across many underlyings.

**Result:** thesis may be model-derived, probabilistic, or distributional rather than a human belief. It needs authority/provenance and horizon, not durable entity identity.

### Calendar spread

Calendar economics are materially sensitive to time, volatility term structure, path, and residual-leg state. A thesis may concern relative implied volatility or expected path rather than simple direction.

**Result:** a scalar bullish/bearish/neutral field is insufficient. Thesis is naturally a structured assertion over specified market variables and horizon.

## 3. Identity test

A durable entity identity would need to survive meaningful changes and be referred to independently across decisions.

The specimens do not establish that requirement.

Instead, theses naturally behave like assertions:

- subject: underlying, volatility surface, rate, correlation, or other market variable;
- predicate: expected direction/magnitude/range/volatility/path/relationship;
- value/distribution/scenario set;
- horizon/effective interval;
- evidence/provenance;
- assertion authority;
- model/derivation when applicable;
- confidence/uncertainty;
- applicability to a Decision Subject or Alternative evaluation;
- supersession/conflict/revocation.

Multiple theses may coexist, conflict, or be scenario branches. A later thesis can supersede an earlier one without changing the identity of the inventory, construction, program, mandate, or decision episode.

## 4. Falsification result

**Scenario / Market Thesis does not currently earn durable entity identity.**

The stronger fit is:

> **Scenario / Market Thesis Assertion** — a governed semantic Assertion about possible market evolution, scoped to subject(s) and horizon, carrying evidence/authority/derivation and uncertainty as applicable, used as an input to counterfactual consequence evaluation.

It may express direction, magnitude, range, volatility, path, correlation, rates, term structure, or a governed scenario/distribution.

It is explicitly **not**:

- Objective/Purpose;
- Outcome Stance / Intent;
- Preference;
- Policy;
- strategy identity;
- realized state;
- a requirement that every decision possess a point forecast.

## 5. Consequence for decision semantics

A clean reasoning shape is:

```text
Reconciled State + Evidence
        │
        ├── Scenario / Market Thesis Assertion(s)
        │       (optional; possibly model-derived or branched)
        │
        ▼
Alternative → Counterfactual Consequence(s)
        │
        ▼
Objective/Purpose + Outcome Stance + Policy/Constraints/Preferences
        │
        ▼
Admissibility / comparison / Recommendation
```

The thesis helps generate or weight counterfactual worlds. Normative semantics determine whether those consequences are acceptable/desirable. The two must not be collapsed.

## 6. Standard-deviation criterion

A `±σ` criterion, if used, belongs inside a Scenario/Market Thesis Assertion only when its dependencies are explicit: subject, horizon, volatility source, model/distribution, timestamp, units, and interpretation. Otherwise it remains source-specific pedagogy/heuristic.

## 7. Disposition

The practitioner-corpus refinement pressure is resolved provisionally:

- retain Scenario / Market Thesis;
- represent it as an Assertion family, not a durable entity;
- keep it optional;
- permit operator-authored, model-derived, or externally sourced authority classes;
- require explicit horizon and semantic subject;
- do not infer it from conventional strategy labels;
- do not infer Intent from it.

This is sufficient to integrate the distinction into the Semantic Model draft. It does not authorize implementation or DDD decomposition.
