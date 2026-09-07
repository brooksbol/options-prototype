# Operator Strategy Policy and Governed Strategy Matching — Discovery

**Date:** September 7, 2026  
**Status:** Discovery / reconciled exploration under existing `PL-STRAT-01`; not strategy admission, not implementation authorization  
**Related:** `PL-STRAT-01`, `docs/44-options-strategy-surface-discovery-2026-09-07.md`, roadmap C2/K1/K2/L3, architecture-roadmap AR3/AR4, Policy over Prediction, Strategy Expansion Governance

---

## Why this artifact exists

A September 7 discussion explored a questionnaire for an experienced options trader who wants Wheelwright to recommend strategies from the comparative strategy surface.

The important discovery is larger than “add a questionnaire.” The questionnaire is only an **elicitation mechanism**. The deeper model is:

> **operator policy × strategy characteristics × current evidence × portfolio state → governed alternatives**

The questionnaire should therefore produce an **Operator Strategy Policy**, not directly name a strategy.

The strategy surface and the questionnaire are duals:

> **The strategy surface describes what a strategy is willing to do to the portfolio. The operator policy describes what the operator is willing to let a strategy do to the portfolio.**

Recommendation is the governed matching of those two things, conditioned by evidence and portfolio state.

A second invariant emerged:

> **Recommendation cardinality is 0..N, not 1..N.**

Wheelwright must be able to conclude that no admitted strategy satisfies current operator policy and current conditions. It must not weaken a hard constraint merely because the product wants to return a trade.

---

## 1. Experienced-trader questionnaire — candidate elicitation surface

The questionnaire should not waste questions establishing basic options literacy. It should expose preferences and constraints that materially discriminate among strategies.

| Question | Example answers | What Wheelwright learns |
|---|---|---|
| **1. What is your primary objective?** | Recurring income / capital appreciation / downside protection / tail protection / volatility exposure / efficient entry into an underlying / financing | Establishes economic purpose |
| **2. Do you currently own the underlying?** | Yes / No / Willing to own it | Separates stock-overlay structures from standalone option structures |
| **3. Are you willing to be assigned shares?** | Yes, desirable / Acceptable / Prefer not / Never | Strong discriminator for CSPs and related structures |
| **4. Are you willing to have shares called away?** | Yes / At selected price / Prefer not / Never | Determines covered-call/collar compatibility |
| **5. What adverse consequence is acceptable?** | Stock-like downside / fixed dollar loss / fixed % loss / premium loss only / tail loss acceptable / no uncapped exposure | One of the most important filters |
| **6. Must maximum loss be mechanically bounded at entry?** | Always / Preferably / No | Immediately excludes many structures |
| **7. How important is recurring premium production?** | Primary objective / important / secondary / irrelevant | Separates income structures from debit/convexity structures |
| **8. How much upside are you willing to surrender for current compensation?** | None / some / substantial | Distinguishes protective/long structures from covered-call/collar approaches |
| **9. How much ongoing hedge cost are you willing to pay?** | None / modest / substantial for strong tail protection | Protective puts, collars, HBWB-like structures |
| **10. Which reward surface do you prefer?** | Broad/modest / narrow/high / convex tails / linear / asymmetric / no preference | Maps directly onto strategy-surface geometry |
| **11. Would you rather have a high probability of modest reward or lower probability of much larger reward?** | Strongly first → strongly second | Separates short-premium from long-convexity families |
| **12. Is an intermediate loss acceptable if extreme adverse outcomes improve again?** | Yes / Depends on depth / No | Particularly important for backspreads and HBWB-like surfaces |
| **13. How dependent may the strategy be on your directional forecast?** | Not at all / weakly / moderately / strongly | Direct prediction-dependence preference |
| **14. How dependent may it be on predicting magnitude of movement?** | Same scale | Separates directional prediction from volatility prediction |
| **15. How dependent may it be on predicting volatility behavior?** | None / IV level okay / skew okay / term structure okay / comfortable with all | Important for calendars, diagonals, volatility structures |
| **16. How dependent may it be on terminal price being in a particular region?** | Avoid / tolerate / comfortable | Strong discriminator for butterflies/condors |
| **17. Do you have an actual directional view right now?** | Bullish / bearish / neutral / uncertain / deliberately don't forecast | Evidence, but not automatically an instruction |
| **18. What is your acceptable holding period?** | Intraday / days / weeks / months / LEAPS | Constrains strategy universe |
| **19. Are multiple expirations acceptable?** | Yes / No / Prefer same expiry | Calendar/diagonal discriminator |
| **20. How much lifecycle management do you want?** | Open-and-wait / mechanical exits / occasional adjustment / actively managed | Operational complexity |
| **21. Are discretionary adjustments acceptable?** | No / mechanical only / yes | Important to Policy over Prediction |
| **22. Maximum acceptable leg count?** | 1 / 2 / 3 / 4+ / irrelevant | Execution complexity |
| **23. How sensitive are you to execution friction?** | Very / moderately / little | Eliminates theoretically attractive but practically expensive structures |
| **24. How should capital efficiency trade against robustness?** | Robustness first / balanced / capital efficiency first | Collateral/risk tradeoff |
| **25. What role should this position play in the portfolio?** | Income producer / equity acquisition / hedge / convex tail protection / directional exposure / diversification | Portfolio rather than trade-level reasoning |

The eventual questionnaire should probably be **adaptive**, not a fixed 25-question form. Once enough policy dimensions are known to eliminate or rank most strategy families, subsequent questions should discriminate only among survivors.

---

## 2. Normalize answers into an Operator Strategy Policy

A complete mapping does not require enumerating every Cartesian permutation of 20–25 questions. Instead, questionnaire answers can be normalized into a smaller policy signature.

| Dimension | Normalized values |
|---|---|
| **Objective** | Income / Directional appreciation / Protection / Convexity-volatility / Financing-exposure |
| **Underlying relationship** | Own / Willing to own / Do not want to own |
| **Direction** | Bullish / Bearish / Neutral-range / Direction agnostic |
| **Prediction tolerance** | Low / Moderate / High |
| **Loss character** | Stock-like acceptable / Must be bounded / Premium-only loss preferred / Unbounded acceptable |
| **Reward preference** | Broad-modest / Linear / Concentrated-high / Tail-convex / Asymmetric |
| **Premium orientation** | Prefer credit / Neutral / Prefer debit |
| **Volatility dependence** | Avoid / Accept / Deliberately seek |
| **Lifecycle complexity** | Low / Moderate / High |
| **Time structure** | Single expiry preferred / Multiple expiries acceptable |

Assignment, call-away, naked-option tolerance, leg count, hedge cost, and discretionary-management answers can act as hard gates or refinements to those dimensions.

---

## 3. Three-stage strategy matching model

The discussion produced a foundational separation:

> **Admission constraints → policy fitness → current opportunity selection**

These are distinct stages.

1. **Admission constraints** are hard requirements. A violating strategy is ineligible, not merely lower-ranked.
2. **Policy fitness** compares the survivors against softer operator preferences.
3. **Current opportunity selection** uses current market evidence, executable compensation, consequence envelopes, and portfolio state to decide whether any eligible strategy is attractive now.

This prevents one giant weighted score from silently trading away requirements the operator intended as absolute.

---

## 4. Hard gates

These are not scores.

| Questionnaire answer | Strategies automatically excluded |
|---|---|
| **Must have bounded max loss** | CSP, covered call as standalone downside protection, short straddle, short strangle, reverse jade lizard where call is naked, synthetic long/short stock, other uncapped/stock-like structures |
| **No assignment / no stock ownership** | CSP; stock-acquisition implementations |
| **No call-away** | Covered call; collars with short call unless call-away can be tolerated |
| **No naked options** | Short straddle, short strangle, many ratio spreads, reverse jade lizard, naked synthetic constructions where applicable |
| **Premium loss only** | Long call, long put, long straddle, long strangle and suitably debit-defined structures survive; most short-premium structures fail |
| **No multi-expiration positions** | Calendar, diagonal, PMCC |
| **Mechanical management only** | Any candidate requiring discretionary rescue/adjustment is rejected, regardless of theoretical attractiveness |
| **≤2 option legs** | Butterflies, iron structures, jade lizards, HBWB, etc. excluded |
| **Avoid material volatility-path dependence** | Calendars, diagonals, many long-volatility structures, HBWB pending characterization generally fall in rank or fail policy |
| **Low prediction tolerance** | Conventional long call/put, butterflies and other narrow-target structures generally fail unless their justification can be reformulated consequence-first |

A candidate that violates a hard requirement never reaches ranking.

---

## 5. Core answer-combination map — income / premium production

| Answer combination | Candidate strategies |
|---|---|
| Own stock + call-away acceptable + stock downside acceptable + broad reward preferred + low/moderate prediction | **Covered Call** |
| Own stock + wants downside floor + willing to cap upside + low prediction | **Collar** |
| Don't own stock + willing to own + assignment desirable/acceptable + stock downside acceptable + credit preferred + low/moderate prediction | **Cash-Secured Put** |
| Don't want stock ownership + bounded loss required + bullish/neutral + broad reward + credit preferred + low/moderate prediction | **Bull Put Credit Spread** |
| Don't want stock ownership + bounded loss required + bearish/neutral + broad reward + credit preferred + low/moderate prediction | **Bear Call Credit Spread** |
| Bounded loss + neutral/range view + willing to depend moderately on range + credit preferred | **Iron Condor** |
| Bounded loss + strongly range-focused + concentrated reward acceptable + high prediction tolerance | **Iron Butterfly**, **Butterfly** |
| Bullish/neutral + willing to accept stock-like downside + richer premium desired + asymmetric surface acceptable | **Jade Lizard**, possibly **CSP** |
| Bearish/neutral + uncapped upside exposure explicitly acceptable | **Reverse Jade Lizard** |
| Income + capital efficiency + longer bullish exposure + multiple expirations acceptable | **PMCC**, **Diagonal Spread** |
| Income + tail protection deliberately desired + intermediate adverse valley acceptable + complex structure acceptable | **HBWB candidate — research only**, not currently recommendable by Wheelwright |

The mapping is deliberately 1-to-N. A policy signature may produce several eligible strategy families before current evidence selects among them.

---

## 6. Directional appreciation objective

| Answer combination | Candidate strategies |
|---|---|
| Bullish + premium-only loss preferred + large upside desired + high prediction tolerance | **Long Call** |
| Bullish + bounded loss + willing to cap upside + capital efficiency important | **Bull Call Spread** |
| Bullish + wants approximately linear exposure + stock-like downside acceptable | **Synthetic Long Stock** |
| Bullish + willing to own stock + wants entry compensation rather than leveraged upside | **CSP** |
| Bullish but forecast confidence limited + bounded loss + broad reward preferred | **Bull Put Credit Spread** |
| Bearish + premium-only loss preferred + convex downside desired | **Long Put** |
| Bearish + bounded risk + willing to cap downside profit | **Bear Put Spread** |
| Bearish + approximately linear exposure + stock-like/unbounded adverse exposure acceptable | **Synthetic Short Stock** |
| Bearish but forecast dependence should remain modest + bounded loss preferred | **Bear Call Credit Spread** |

A bullish view does not uniquely imply a long call. The desired consequence and prediction dependence matter independently.

---

## 7. Protection objective

| Answer combination | Candidate strategies |
|---|---|
| Own stock + wants hard downside floor + unwilling to cap upside | **Protective Put** |
| Own stock + wants downside floor + willing to finance hedge by surrendering upside | **Collar** |
| Wants severe-downside convexity without owning stock + accepts premium drag | **Long Put** |
| Wants downside hedge but willing to cap hedge payoff | **Bear Put Spread** |
| Wants portfolio crash convexity + accepts ongoing premium expense + direction otherwise irrelevant | **Long Put**, potentially **Long Strangle/Straddle** depending on the risk being hedged |
| Wants tail protection financed partly by premium selling + intermediate-region risk acceptable | **HBWB research candidate**, subject to unresolved failure-mode analysis |

---

## 8. Volatility / convexity objective

| Answer combination | Candidate strategies |
|---|---|
| Expect large move + direction unknown + willing to pay substantial premium | **Long Straddle** |
| Expect very large move + direction unknown + lower entry cost preferred | **Long Strangle** |
| Expect large directional move + wants increasingly favorable extreme-tail payoff | **Backspread** |
| Wants convexity but accepts adverse middle region | **Backspread**, potentially **HBWB research candidate** |
| Expects low movement + accepts uncapped tail risk | **Short Straddle** |
| Expects low/moderate movement + wants wider profitable region + accepts uncapped tail risk | **Short Strangle** |
| Expects range behavior + bounded tail risk mandatory | **Iron Condor**, **Iron Butterfly** |
| Wants volatility/time-structure relative value rather than simple terminal payoff | **Calendar**, **Diagonal** |

Direction-agnostic does not mean prediction-free. “I don't know direction but expect a very large move” is still a strong magnitude forecast.

---

## 9. Reward-surface-first mapping

| Desired reward surface | Candidate strategies |
|---|---|
| **Broad modest reward** | Covered Call, CSP, Bull Put Spread, Bear Call Spread, Iron Condor |
| **Broad but bounded both directions** | Collar |
| **Linear** | Synthetic Long Stock, Synthetic Short Stock |
| **One-sided convex tail** | Long Call, Long Put |
| **Two-sided convex tails** | Long Straddle, Long Strangle |
| **Concentrated central peak** | Butterfly, Iron Butterfly |
| **Wide central plateau** | Iron Condor |
| **Asymmetric central/side payoff** | BWB, Jade Lizard, Reverse Jade Lizard, Ratio Spread |
| **Tail-heavy convexity after an adverse middle** | Backspread; possibly HBWB |
| **State/time-dependent peak** | Calendar, Diagonal |
| **Essentially fixed payoff** | Box Spread |

For an experienced trader, Wheelwright could eventually show simplified consequence archetypes and ask which geometry the operator is willing to own, rather than asking whether the operator “likes butterflies” or another named strategy.

---

## 10. Prediction-tolerance mapping

| Prediction tolerance | Normally compatible strategies |
|---|---|
| **Very low / consequence-first** | Protective Put, Collar, Box Spread, appropriately justified CSP, Covered Call, Bull Put Spread, Bear Call Spread |
| **Low–Moderate** | CSP, Covered Call, credit verticals, some asymmetric premium structures |
| **Moderate** | Jade Lizard, BWB, Iron Condor depending on justification |
| **Moderate–High** | Iron Condor, BWB, Reverse Jade Lizard |
| **High** | Long Call, Long Put, Bull Call Spread, Bear Put Spread, Long Straddle, Long Strangle, Calendar, Diagonal, Butterfly, Iron Butterfly, Backspread |
| **Very High** | Short Straddle, Short Strangle, many Ratio Spread implementations |

Prediction dependence should be interpreted through the **decision justification**, not simply the option geometry.

A CSP can be predictive:

> “SPY will not fall below 500.”

or consequence-first:

> “I am willing to own SPY at an effective basis of 495 and current compensation is sufficient.”

Same legs, different policy.

---

## 11. Strategy-by-policy admission signatures

The model can be inverted so every strategy exposes the policy characteristics it strongly requires or fits.

| Strategy | Required / strongly compatible answer signature |
|---|---|
| **Covered Call** | Own underlying + call-away acceptable + downside ownership acceptable + income desired + broad/capped reward acceptable |
| **CSP** | Willing to own underlying + assignment acceptable + stock-like downside acceptable + income/entry objective |
| **Protective Put** | Own underlying + downside floor desired + hedge cost acceptable + upside preservation valued |
| **Collar** | Own underlying + downside floor desired + upside cap acceptable + low prediction dependence |
| **Long Call** | Bullish + high prediction tolerance + premium loss acceptable + convex upside desired |
| **Long Put** | Bearish/protective + premium loss acceptable + convex downside desired |
| **Bull Call Spread** | Bullish + bounded loss + capped upside acceptable + directional forecast accepted |
| **Bear Put Spread** | Bearish + bounded loss + capped downside reward acceptable |
| **Bull Put Spread** | Neutral/bullish + bounded risk + credit desired + broad reward + low/moderate prediction dependence |
| **Bear Call Spread** | Neutral/bearish + bounded risk + credit desired + broad reward |
| **Iron Condor** | Neutral/range + bounded risk + credit desired + two-sided range dependence acceptable |
| **Iron Butterfly** | Strongly range-focused + bounded risk + concentrated central reward preferred |
| **Long Straddle** | Large move expected + direction uncertain + premium expense acceptable + long vol desired |
| **Short Straddle** | Small move expected + uncapped risk accepted + strong short-vol thesis |
| **Long Strangle** | Very large move expected + direction uncertain + cheaper convexity preferred |
| **Short Strangle** | Broad range expected + uncapped tail risk accepted + short-vol objective |
| **Butterfly** | Specific terminal region acceptable/desired + bounded risk + narrow high reward preferred |
| **BWB** | Asymmetric target/consequence desired + defined/asymmetric risk accepted + moderate/high prediction dependence |
| **HBWB** | Tail convexity desired + premium-financed hedge concept attractive + intermediate valley acceptable + complex/state-dependent risk acceptable — **research only** |
| **Calendar** | Time/IV opportunity + multi-expiry acceptable + high path/volatility dependence acceptable |
| **Diagonal** | Direction + time/IV exposure + multi-expiry and active lifecycle acceptable |
| **PMCC** | Bullish + income + capital efficiency + multi-expiry acceptable + covered-call-like surface desired |
| **Ratio Spread** | Asymmetric payoff desired + sophisticated tail-risk acceptance + high prediction tolerance |
| **Backspread** | Extreme movement/convexity desired + moderate-move valley acceptable |
| **Jade Lizard** | Premium income + bullish/neutral + asymmetric downside acceptable + one side engineered favorably |
| **Reverse Jade Lizard** | Premium income + bearish/neutral + uncapped upside explicitly acceptable |
| **Box Spread** | Financing objective + direction irrelevant + fixed payoff desired |
| **Synthetic Long** | Linear bullish exposure desired + stock-equivalent downside acceptable |
| **Synthetic Short** | Linear bearish exposure desired + stock-equivalent adverse exposure acceptable |

This inverted view is useful because the model can be tested from both directions:

- questionnaire → policy → strategies;
- strategy → required/compatible policy characteristics.

---

## 12. When several strategies survive

1-to-N output should be expected rather than treated as ambiguity.

Example policy signature:

- objective: income;
- direction: mildly bullish;
- own stock: no;
- willing to own: yes;
- assignment: yes;
- bounded loss: preferred, not mandatory;
- reward: broad/modest;
- prediction dependence: low;
- premium: credit preferred;
- complexity: moderate.

Policy-stage result might be:

**Eligible**
- Cash-Secured Put
- Bull Put Credit Spread

**Conditionally eligible**
- Jade Lizard

**Rejected**
- Long Call — excessive prediction dependence
- Bull Call Spread — directional/debit profile poorly aligned
- Iron Condor — introduces unnecessary upside risk/range dependency
- Butterfly — reward surface too concentrated
- Short Strangle — tail consequences violate preference

Then **current market evidence** decides among survivors.

A future Wheelwright explanation might say:

> **Bull Put Credit Spread — preferred now.** It satisfies the operator's bounded-loss preference while preserving attractive current compensation.
>
> **Cash-Secured Put — acceptable alternative.** It produces greater nominal premium but exposes more capital to stock-like downside.
>
> **Jade Lizard — not preferred.** Additional structural complexity does not currently purchase enough incremental compensation.

The questionnaire itself should not decide which trade to open today.

---

## 13. Null recommendation is a first-class outcome

Some combinations should produce:

> **Recommended strategy set = ∅**

For example, an operator might demand recurring high premium while simultaneously refusing stock ownership, assignment, directional dependence, volatility dependence, range dependence, hedge cost, more than one option leg, and any meaningful loss.

There may be no coherent options strategy satisfying that policy.

Wheelwright should say:

> **No admitted strategy satisfies the current policy.**

It must never weaken a hard constraint merely to produce a recommendation.

---

## 14. Conceptual algorithm

The strategy-matching flow is:

> **Questionnaire answers**
>
> → normalize into **Operator Strategy Policy**
>
> → apply **hard constraints**
>
> → produce **Eligible Strategy Set**
>
> → compare **policy fitness**
>
> → combine with **current Evidence**
>
> → construct actual **Alternatives**
>
> → evaluate **Consequence Envelopes**
>
> → compare **Compensation relative to Consequence**
>
> → check **portfolio state**
>
> → return **0..N recommended alternatives + exclusions + reasons**

A conceptual normalized policy might look like:

```text
risk.max_loss = bounded
assignment = prohibited
reward_surface = broad
prediction_dependence <= moderate
objective = income
direction = neutral_to_bullish
volatility_dependence <= moderate
management = mechanical
complexity.max_legs = 4
multi_expiry = false
```

The strategy characterization layer can then produce a mechanically inspectable eligibility result:

```text
Bull Put Spread       ELIGIBLE
Bear Call Spread      ELIGIBLE depending on direction
Iron Condor           ELIGIBLE but lower policy fit
Butterfly             INELIGIBLE: prediction dependence
Short Strangle        INELIGIBLE: unbounded loss
Calendar              INELIGIBLE: multiple expirations
Long Call             INELIGIBLE: objective/reward mismatch
...
```

Current evidence and portfolio context then determine whether any eligible strategy is actually attractive now.

---

## 15. Architectural significance

The strategy surface answers:

> **What properties does each strategy have?**

The Operator Strategy Policy answers:

> **What properties does this operator want, tolerate, or prohibit?**

Recommendation becomes a matching operation between those two surfaces, followed by evidence and portfolio evaluation.

This is cleaner than encoding every named strategy into a large decision tree. A future strategy does not require rewriting the questionnaire. Wheelwright can characterize the new strategy against established dimensions, and existing policy matching can determine which operator policies could admit it.

This suggests a significant refinement of `PL-STRAT-01`:

> The important abstraction may not ultimately be “support many option strategies.” It may be **governed matching between operator policy, strategy consequence characteristics, and current opportunities**.

The questionnaire is therefore one possible Policy-surface UI, not the architecture itself.

---

## 16. Relationship to Wheelwright engines and existing architecture

Conceptually:

- **Policy** owns the durable operator constraints/preferences elicited by the questionnaire;
- **Evidence** owns current observable market and portfolio facts;
- **Decision** matches admitted strategy characteristics and current executable alternatives against Policy and Evidence;
- **Explanation** communicates why alternatives were included, excluded, preferred, or rejected.

This strengthens existing architecture-roadmap pressure rather than authorizing new architecture:

- **AR3 — Governed Alternatives:** strategy matching requires comparing alternatives through shared economic semantics rather than hard-coded named-strategy branches;
- **AR4 — Consequence Semantics Before Explanation:** hard constraints, prediction dependence, reward-surface geometry, and exclusion reasons need structured semantics before explanation can reliably expose them.

The existing warning still applies: do not prematurely build a generalized arbitrary-trade-shape DSL or strategy engine. Reusable semantics must be earned through concrete strategy pressure.

---

## Reconciliation result

This discovery does **not** create a new parking-lot identity. It materially refines existing **`PL-STRAT-01` Strategy Expansion Governance** and directly builds on the comparative strategy surface preserved in `docs/44-options-strategy-surface-discovery-2026-09-07.md`.

### Strategic reconciliation

**Strengthens existing strategic direction; no roadmap change required at this stage.**

Relevant homes remain:

- **C2 — Broader governed trade-shape repertoire:** the useful outcome is not a flat catalog but a governed way to determine which admitted strategy families fit operator policy;
- **K1 — Consequence envelopes:** operator policy can express which adverse/favorable consequence geometries are acceptable;
- **K2 — Compensation relative to consequence:** current compensation should be compared only after unacceptable consequences are excluded;
- **L3 — Risk-profile performance can be learned empirically:** strategy-policy matching provides a future frame for comparing how different admitted risk profiles perform for different operator policies.

No new Bet is required yet.

### Architectural reconciliation

**Refines AR3/AR4; no new architectural direction is authorized.**

The central architectural pressure is the separation of:

> **admission constraints → policy fitness → current opportunity selection**

and the recognition that recommendation cardinality is **0..N**.

No generalized strategy engine, arbitrary trade-shape DSL, recommendation implementation, or questionnaire UI is authorized by this record.

### Parking-lot disposition

**Retained and refined under `PL-STRAT-01`.** No new `PL-*` identity is created.

### Why-state

This rich discovery record preserves the questionnaire, normalization model, hard gates, complete 1-to-N mapping surfaces, strategy-by-policy inversion, null recommendation invariant, conceptual algorithm, and the strategy-surface/operator-policy duality.

No additional journal entry is required because this artifact preserves the material unfinished intellectual state and the canonical parking-lot refinement exposes the disposition.

### Next authorized mode

**Further exploration / design research only.**

Useful next work, if selected by the Principal, would be to:

1. validate the questionnaire dimensions against the full strategy surface;
2. identify which policy attributes are truly hard constraints versus preferences;
3. refine strategy characterization fields needed to support deterministic eligibility/exclusion;
4. test representative policy signatures, including contradictory and null-result cases;
5. determine where portfolio-level constraints belong relative to operator strategy policy;
6. only after that, consider a formal domain model or operator-facing elicitation design.

**Not authorized:** implementation, questionnaire UI, strategy admission, recommendation-engine changes, broker integration, generalized strategy framework work, or roadmap reprioritization.
