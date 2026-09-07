# Hedged Broken-Wing Butterfly (HBWB) — Failure-Mode-First Discovery

**Date:** September 7, 2026  
**Status:** Discovery / reconciled exploration under existing `PL-STRAT-01`; not strategy admission, not implementation authorization  
**Related:** `PL-STRAT-01`, `PL-DEPLOY`, `PL-DEC-BEH`, `PL-EXEC-01`, roadmap C2/K1/K2/L3, architecture-roadmap AR3/AR4, Policy over Prediction, Strategy Expansion Governance, August 29 credit-spread discovery

---

## Why this artifact exists

A September 7 discussion examined a commercially presented options structure called the **Hedged Broken-Wing Butterfly (HBWB)**. The presenter is also selling a paid masterclass, so the presentation is treated as a source of hypotheses and mechanics to verify, not as evidence that the strategy is safe, profitable, robust, or superior.

The durable learning is not "add HBWB." The useful discovery is that the structure may represent a different way to combine premium selling with deliberately purchased crash convexity, and therefore pressures Wheelwright's existing strategy-expansion, consequence-envelope, and risk-profile research. The discussion also reinforced the project's existing research discipline: **begin with failure modes before asking how much a strategy makes.**

This artifact preserves the reasoning so a future cold actor does not have to reconstruct it from the commercial claims or rediscover the same mechanical questions.

---

## 1. Triggering presentation and claims

The commercial presentation described an OTM broken-wing-butterfly-like structure using language including:

- single OTM structure;
- delta / gamma neutral;
- long vomma protection;
- flat T+0 line / forgiving position;
- built-in crash protection;
- hedge plus premium selling for income;
- "safe through chaos, consistent through calm";
- the broader claim that volatility is the enemy of many options strategies but is **not the enemy** of this strategy.

These are presenter claims, not Wheelwright findings.

The Principal explicitly noted the commercial context: the presenter is selling a masterclass. That materially lowers the evidentiary weight of broad claims while leaving independently verifiable mechanics available for investigation.

Working rule from the discussion:

> **Treat the sales pitch as a hypothesis generator. Verify the mechanics and try to break the strategy before considering the upside case.**

---

## 2. Apparent leg recipe and an unresolved source discrepancy

The screenshots appear to describe a put structure with quantities approximately:

- buy 1 higher-strike put;
- sell 2 middle-strike puts;
- buy 2 farther-OTM lower-strike puts.

This is a **`+1 / -2 / +2`** quantity shape, not the conventional `+1 / -2 / +1` butterfly quantity shape.

The presentation frames the legs by approximate delta. The screenshots visually appear consistent with something like:

- upper long near `-30 delta`;
- two shorts near `-18 delta`;
- two lower longs near `-03 delta`.

However, the Principal stated during the discussion that the displayed `-03` should actually be **`-30`**.

That creates an unresolved mechanical discrepancy that must not be silently normalized:

- if the lower long is truly farther OTM than a `-18 delta` put at the same expiration, a `-30 delta` reading is inconsistent with ordinary same-expiration put strike/delta ordering;
- `-30 + 2(+18) - 2(3) ≈ 0` delta if the lower puts are near `-03`, which neatly matches the presenter's delta-neutral claim;
- using `-30` for both upper and lower long legs would instead imply roughly `-0.54` net entry delta under the same simplified arithmetic and would not match the stated delta-neutral recipe.

**Disposition:** the exact lower-hedge delta is **unverified primary-source detail**. Do not encode `30/18/3`, `30/18/30`, or any other recipe as authoritative until the source is checked directly. The quantity shape and broader mechanical hypotheses can still be investigated independently.

---

## 3. Why the extra lower long matters

If the structure is genuinely `+1 / -2 / +2` puts at one expiration, the extra lower-wing long changes the deep-downside slope relative to an ordinary butterfly.

Once all three strikes are in the money, the net put quantity is:

`+1 - 2 + 2 = +1`

So the extreme downside tail behaves like a net long put rather than flattening into the terminal payoff of a conventional `+1 / -2 / +1` butterfly.

This provides a plausible mechanical basis for the presenter's **crash-protection** story: the structure is not merely capping a finite loss with a long wing; it may deliberately own an additional far-downside convex exposure.

This does **not** establish that the overall strategy is safe, profitable, or robust. It establishes only that the extra long put can materially alter extreme-tail behavior.

---

## 4. Volatility claim — useful hypothesis, not accepted property

The presenter's strongest conceptual claim is that volatility is not the enemy of the HBWB in the way it is for many short-premium strategies.

The discussion interpreted the plausible intended mechanism as follows:

- the position sells intermediate downside option exposure through the short puts;
- some of that compensation is spent on additional far-OTM long-put convexity;
- under a sufficiently large downside move accompanied by volatility expansion and skew change, the far-OTM longs may become materially more valuable;
- positive convexity / volatility sensitivity in the tail could make a severe volatility event less hostile than it is to a conventional net-short-volatility structure.

The "long vomma" language is potentially relevant because vomma describes how vega changes as implied volatility changes. But **long vomma is not equivalent to "volatility cannot hurt."** Delta, gamma, vega, vomma, theta, skew sensitivity, and P/L are state-dependent. Their signs and magnitudes can change with spot, time, strike placement, and the volatility surface.

Wheelwright must therefore reject the stronger marketing interpretation:

> "volatility is never the enemy" or "safe through chaos"

until the complete state space is independently mapped.

A more defensible research question is:

> **Does the HBWB materially improve portfolio behavior during severe price/volatility shocks by purchasing convex tail exposure with part of the premium-selling proceeds, and what risk is sold in exchange for that protection?**

---

## 5. Relationship to the August 29 credit-spread discovery

The August 29 credit-spread work asked whether Wheelwright can exchange part of the premium for a mechanically known adverse boundary. The HBWB appears to pose a related but more complex question:

> **Can Wheelwright sell one region of market risk to finance ownership of another region of risk — especially extreme downside convexity — that the portfolio deliberately wants?**

That is not the same as a vertical spread:

- a vertical primarily buys a static finite-loss boundary;
- the HBWB may create a state-dependent protective response in which tail convexity becomes more important as spot and volatility move into stressed regions.

This is potentially relevant to roadmap **K1 consequence envelopes**, **K2 compensation relative to consequence**, and **L3 learning across risk profiles**. It does not displace or outrank the already-better-developed vertical-spread investigation.

---

## 6. Policy over Prediction remains the admission test

The fact that a structure has a narrow high-payoff region does not by itself prove that its **decision process** requires prediction; the credit-spread investigation already corrected that overly simple inference.

But the HBWB must still answer the harder admission question:

> **Can entry be justified entirely by acceptable mechanical consequences, current observable compensation, and portfolio policy — without requiring the operator to forecast terminal price, volatility path, or a particular adjustment path?**

If the economic thesis is fundamentally "the underlying should finish near this body" or "volatility should evolve this way," then the structure remains inconsistent with Wheelwright's Policy-over-Prediction deployment discipline.

If instead the complete consequence surface is acceptable under policy and the crash hedge is purchased because the portfolio explicitly values that tail behavior regardless of forecast, the structure may deserve further evaluation.

No conclusion has been reached.

---

## 7. Failure modes to investigate first

The Principal explicitly reaffirmed Wheelwright's established approach: **look for failure modes before evaluating the upside case.** The initial HBWB failure-mode map is:

### A. The intermediate-loss valley

The strategy may behave well in calm conditions and very well in an extreme crash while performing poorly in an ordinary correction that moves spot into the region dominated by the two short puts before the extra tail hedge becomes powerful.

This is currently the leading suspected failure mode.

### B. Price decline without the expected volatility response

Do not assume every adverse price path arrives with the volatility expansion that makes the tail hedge valuable. Spot and IV must be shocked independently.

### C. Volatility moves in the wrong part of the surface

A parallel IV shock is insufficient. The upper long, short body, and far-OTM hedge occupy different skew regions. Test steepening, flattening, and localized skew changes.

### D. Time decay is hostile in important states

The structure has more long options than short options by count, but option count does not determine theta. Map theta through spot/time states rather than assuming the structure is benign to time decay.

### E. Hedge drag destroys ordinary-period economics

The tail hedge may work exactly as intended and still be economically unattractive if repeated hedge expenditure consumes too much recurring production. This is directly relevant to roadmap L3: when does paying for defined risk improve total deployment quality?

### F. Theoretical economics are not executable

A four-leg structure that depends on far-OTM options can have poor bid/ask quality and fill behavior. Midpoint-marked edge may disappear after entry/exit slippage and commissions/fees where applicable.

### G. Entry Greeks are locally true but globally misleading

Even if the position is delta-neutral at entry, that is a point-in-time condition. Spot, time, and IV movement can change delta and gamma rapidly. "Delta/gamma neutral" must not be treated as a persistent strategy property without mapping.

### H. Management is secretly the strategy

Determine whether attractive results require discretionary adjustments, rolls, leg additions/removals, volatility calls, or path-dependent intervention.

A mechanically opened and mechanically managed structure may be compatible with Wheelwright. A structure whose success depends on discretionary forecasts or expert pattern recognition may not be.

### I. Portfolio correlation defeats trade-level hedging

Even if each trade has attractive crash-tail behavior, many HBWB positions across correlated ETFs can share the same intermediate-loss valley. Portfolio aggregation may therefore remain dangerous even when every individual position appears "hedged."

Wheelwright must evaluate portfolio-level consequence, not merely trade-level max loss or crash payoff.

---

## 8. Minimum empirical characterization before any admission work

Before considering HBWB strategy admission, independently reconstruct the exact recipe and map at least:

- entry debit/credit and protection cost;
- DTE selection rule;
- strike/delta selection rule;
- exact quantity geometry;
- terminal payoff across spot;
- T+0 and intermediate-time P/L surfaces;
- delta, gamma, theta, vega, and vomma across spot/IV/time states;
- independent spot shocks (including moderate and severe declines);
- independent IV shocks;
- combined spot + IV shocks;
- skew steepening/flattening scenarios;
- execution sensitivity and realistic bid/ask fills;
- early assignment / expiration mechanics where relevant;
- any adjustment, exit, or rolling rules;
- repeated-position hedge drag through quiet periods;
- portfolio aggregation across correlated underlyings.

The immediate question is not "what is the historical CAGR?" It is:

> **Where does the strategy break, what does it sell to finance the hedge, and are those consequences acceptable under Wheelwright's portfolio mission?**

Only after that failure-mode map exists should profitability or comparative production become a primary research question.

---

## 9. Epistemic discipline for commercial strategy sources

The masterclass context is a durable part of the source assessment.

Classify claims as follows:

**Potentially independently verifiable mechanics**
- option quantities;
- strike ordering;
- entry Greeks at a stated market snapshot;
- payoff geometry;
- defined terminal outcomes;
- executable market prices at a point in time.

**Hypotheses requiring independent evidence**
- "forgiving";
- "volatility is not the enemy";
- "long vomma protection" as an economically beneficial portfolio property;
- "built-in crash protection" as sufficient protection;
- "safe through chaos";
- consistency of income through quiet markets;
- superiority over simpler defined-risk structures;
- robustness across regimes.

Commercial incentives do not make a claim false. They make independent verification more important.

---

## 10. Reconciliation result

This discovery **does not create a new strategy architecture or a new generalized trade-shape framework**.

It refines the existing `PL-STRAT-01` Strategy Expansion Governance concern and strengthens existing roadmap/architecture pressure already present in:

- roadmap C2 — broader governed trade-shape repertoire;
- roadmap K1/K2 — consequence envelopes and compensation relative to consequence;
- roadmap L3 — empirical comparison of defined-risk/risk-profile outcomes;
- architecture roadmap AR3 — governed Alternatives / reusable economic primitives, with the explicit warning that generalization must be earned through concrete strategy pressure;
- architecture roadmap AR4 — structured consequence semantics before explanation.

No roadmap or architecture-roadmap edit is warranted at this stage because those artifacts already express the relevant strategic and structural intent.

The HBWB remains a **research candidate under `PL-STRAT-01`**, not an admitted strategy and not an implementation target.

---

## Next authorized mode

**Further exploration / research only.**

Useful next evidence would be the primary-source recipe (DTE, exact delta/strike rules, quantity geometry, debit/credit target, and management/exit rules) followed by a mechanical failure-mode analysis. No recommendation-engine work, generalized trade-shape abstraction, UI work, broker work, or strategy admission is authorized by this record.
