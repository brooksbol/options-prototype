# Forecast V2 — Design Exploration

**Date:** August 18, 2026
**Status:** Exploration complete; implementation not yet begun
**Depends on:** ADR-014, Operating Forecast scope (143a075), Resolution Outlook V1 (c6191db)

---

## Purpose

This document records the architectural exploration that followed V1 Production Forecast. V1 correctly forecasts production from the *current position set* using Resolution Outlook + Economic Consequence. Live operation immediately revealed that this scope is too narrow for Bridge Income cash-flow planning because it terminates at the current-position lifecycle boundary.

The operator's planning question is: "Roughly how much will this month produce?" — not merely "What will the positions I already hold produce?"

---

## The Problem V1 Exposed

V1 showed approximately:
- Produced: ~$3K
- Resolving this month: ~$52K
- Forecast: ~$3K

The operator immediately observed: "I've got $50K cycling next week. How can the forecast still just be $3K?"

The gap: V1 cannot see past the current-position boundary. It has no concept of what happens after positions resolve but before month-end.

---

## Key Architectural Discoveries

### 1. Strategy production is temporally quantized

**Status: Confirmed by existing authority (ADR-014, regime objective function, operator observation)**

Option premium is recognized at the sell-to-open event — not accrued over contract life. Production arrives in discrete deployment events, not as a continuous flow. The regime doc's native unit is "per deployment cycle," not "per day."

Structural income (SPAXX money-market) genuinely accrues daily and can be forecast with rate × time. But strategy production (premium + appreciation) is event-driven.

### 2. The dual-clock model

**Status: Confirmed as operationally real; not yet explicit in architecture**

Two temporal structures coexist:

**Operating clock:** deployments → expirations/assignments → capital-form changes → redeployments. Natural cycle length: 14–37 days (from empirical data). Does not respect calendar month boundaries.

**Planning clock:** calendar month → Mission target → household cash-flow period. Monthly boundary is economically arbitrary to the strategy but operationally real to the Principal (mortgage, expenses, withdrawals).

**Forecast bridges these:** it projects cycle-quantized production events onto the monthly planning window.

### 3. Capital continuity vs. deployment productivity are separable

**Status: Confirmed by regime doc (velocity vs. per-cycle production) and Principal evidence**

- **Capital continuity:** Will this capital remain in the production process? For the current Principal in Bridge Income: strong evidence says yes. Extended non-participation is not the expected operating posture.

- **Deployment productivity:** When capital redeploys, how much premium will it produce? Genuinely uncertain — depends on opportunity surface, operator posture, delta/DTE selection, IV environment.

These are independent uncertainties. Continuity is relatively confident; productivity is the primary uncertainty source.

### 4. WAIT is locally first-class without being regime-terminal

**Status: Useful clarification; parallel to the Decision Prediction / Operating Forecast scope split**

At the individual deployment-decision scope: WAIT is absolutely first-class. A bad board can correctly result in no trade.

At the operating-regime scope: repeated WAIT decisions coexist with an expectation that capital eventually returns to production — because the Principal would adopt a more conservative posture (lower delta) rather than leave substantial capital indefinitely idle.

These are not contradictory. They operate at different temporal scopes — exactly as "Policy over Prediction" governs deployment decisions while "Operating Forecast" permits planning-grade forward-looking interpretation.

### 5. ADR-014 recognition-at-receipt simplifies the forecast question

**Status: Direct consequence of existing authority**

If capital resolves on August 21 and the operator redeploys on August 24 into September-expiring contracts, the *entire* new premium belongs to August production. No time-proration is needed.

Therefore the forecast question is NOT "how much yield accrues over the remaining 10 days." It is: "Will another deployment event occur before the planning boundary? And if so, what might it produce?"

This is a binary feasibility question (is there time?) combined with a rough productivity estimate — not a rate × time calculation.

---

## Rejected Approaches

### Continuous rate × time (rejected)

**Formula:** `production_so_far / days_elapsed × days_remaining`

**Why rejected:** This is exactly the "linear extrapolation of month-to-date premium" that ADR-014 explicitly excludes. It treats production as continuously accruing with time — which is descriptively wrong (production is event-driven) and architecturally prohibited.

### Annualized productivity rate (rejected)

**Formula:** Compute annualized yield per deployment, average across deployments, apply to cycling capital.

**Why rejected:** Annualization amplifies DTE differences into wildly heterogeneous rates (22%–132% across 14 observed deployments). The resulting "average" represents no actual deployment well. DTE normalization creates artifacts that obscure rather than illuminate.

### Cycling capital × yield (partially rejected)

**Formula:** `$52K × observed_yield_rate × remaining_time`

**Why rejected:** (a) Collapses to linear extrapolation for synchronized portfolios; (b) the denominator is unstable (today's deployed capital ≠ the capital that generated earlier production); (c) empirical heterogeneity undermines the "rate" concept.

### Average deployment batch as architectural primitive (rejected per Principal)

**Concept:** Observe that historical batches averaged ~$20K, use that as deployment-size estimate.

**Why rejected:** A "batch" may be an observational artifact of what happened to be on the board that day. Encoding accidental historical grouping into an architectural constant is not evidence-grounded.

### Arbitrary participation fraction (rejected per Principal)

**Concept:** Apply a 50% or 70% "participation discount" to cycling capital.

**Why rejected:** A fabricated coefficient hiding inside the calculation is not epistemically better than a fabricated yield. Uncertainty should be communicated through rounding, ranges, and explicit conditionality — not buried in unexplained parameters.

---

## What Survived Falsification

### The event-based forecast model

Rather than forecasting continuous production over remaining time, forecast the possibility of another deployment *event* before month-end:

1. Is capital approaching resolution? (Resolution Outlook — already implemented)
2. Is there sufficient calendar time between resolution and month-end for the operator to act?
3. Given operator continuity evidence: is another deployment event a reasonable pro-forma assumption?
4. If yes: what does recent comparable deployment experience suggest about immediate premium?

This is distinguishable from prohibited "assumed redeployment" because:
- It doesn't invent a specific future trade
- It assumes continuity of an observed operating pattern, not a particular deployment
- The assumption is stated explicitly, not hidden
- It can be evaluated against outcomes (observability)
- The operator can override it mentally

### Per-deployment immediate yield is more stable than annualized rates

Empirical finding: when measured as `premium / capital_deployed` per event (without annualizing), recent deployments showed 3.9%–5.5% yield — much tighter than the 22%–132% annualized spread.

This suggests per-event productivity is a more natural unit than annualized rate for this operating pattern. But 3 observations is not enough to establish stability — it's a promising signal, not a calibrated model.

### The pro-forma framing works

Pro forma methodology: state assumptions, compute arithmetic consequences, present as conditional.

"If deployment continues at roughly recent productivity, another ~$X is plausible" is exactly a pro forma — not a prediction, not a guarantee, not an opaque model. Every input is traceable and every assumption is stated.

---

## Remaining Open Questions (Unresolved)

### The productivity estimate

> "Given that another deployment is a reasonable assumption, what does Wheelwright use as the rough immediate-premium estimate?"

Candidates:
- Most recent deployment batch productivity
- Average of last 2-3 deployments
- Capital-weighted yield across recent period
- Simply show the ingredients and let the operator estimate

**Not yet decided.** Insufficient evidence to choose between these. The answer may emerge from operating V2 with any of them and observing whether it's useful.

### Capital participation

> "How much of the resolving capital actually gets deployed in the next event?"

Empirical evidence: the operator deploys a fraction (historical batches: $15K–$25K when $60K+ was available). But we cannot encode this as a fixed percentage without manufacturing a number.

**Not yet resolved.** May be addressable through range-based presentation or through simply rounding aggressively.

### Range vs. qualified point estimate

> "Should the prospective component be a range ($1K–$2K) or a rounded point (~$2K)?"

The Principal says "Does this month look more like $3K, $5K, or $7K?" — suggesting coarse categories might be the right granularity.

**Not yet decided.** A qualified point with aggressive rounding may be sufficient; a range adds epistemic honesty but also complexity.

### Opportunity continuity

> "Because opportunities existed recently, will they exist next week?"

This is the weakest link in the persistence assumption. The pro forma can simply state it as an assumption. The system cannot observe the future opportunity surface.

**Not resolvable in advance.** Accepted as a stated pro-forma assumption; the operator knows their opportunity environment better than the system does.

---

## Experiential Evidence (Principal, August 2026)

Captured for future architectural reference:

1. "I don't see myself leaving substantial cash idle for an entire month." — Capital continuity.
2. Redeployment latency "varies substantially" — from within an hour to roughly a week. Determined by opportunity surface quality.
3. Even in a persistently terrible environment, the Principal would accept more conservative deployment (~0.10 delta) rather than total inactivity. — Continuity is strong; productivity is uncertain.
4. "Does this month look more like $3K, $5K, or $7K?" — The planning question is inherently coarse.
5. The operator's intuitive model: capital resolves → board appears → deploy → premium is produced right then. — Confirms event-based mental model.

---

## Relationship to Architecture

### What exists and supports this work
- Operating Forecast scope (Policy over Prediction, 143a075) — permits evidence-grounded planning outlook
- ADR-014 recognition-at-receipt — establishes event-driven production semantics
- Regime objective function — separates velocity (continuity) from per-cycle production (productivity)
- Resolution Outlook (ADR-013 amendment) — provides the "capital approaching resolution" signal

### What needs evolution before V2 implementation
- ADR-014 Forecast semantics: a clarifying note explaining that a stated capital-continuity assumption (pro-forma) is architecturally distinct from prohibited "assumed redeployment"
- Dual-clock framing should become explicit in the Forecast design

### What is explicitly NOT needed
- No new ADR
- No changes to Policy over Prediction beyond what's already committed
- No changes to the Resolution Outlook layer
- No changes to Production recognition invariants

---

## Design Constraint: Explainability

The forecast algorithm must be explainable in a ⓘ popup titled something like "Wheelwright's Simple Forecast":

> Wheelwright starts with what you've already produced this month. It adds likely gains or losses from positions nearing resolution. If capital is expected to become available again before month-end, it also allows for another deployment using the productivity of recent actual trades as a rough guide. The result is deliberately rounded because it's a cash-flow planning estimate, not an accounting number.

If the eventual V2 algorithm cannot be explained at approximately this level, it is probably over-engineered.

---

## Next Steps (After Documentation Reconciliation)

1. Resolve the productivity-estimate question (simplest defensible arithmetic)
2. Determine presentation form (range vs. qualified point)
3. Brief ADR-014 clarification re: capital-continuity assumption
4. Implement V2
5. Operate and observe: does the forecast actually help plan household cash flow?
