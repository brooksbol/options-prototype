# Put Selling: Risk, Compensation, and Wheelwright Failure Boundaries

> **Status:** Discovery finding — external research interpreted against current Wheelwright architecture. Not policy. Not an implementation authorization.
>
> **Date:** August 27, 2026
>
> **Source:** Goldman Sachs Options Research, *The Art of Put Selling: A 10 Year Study*, April 4, 2013 (study period January 2003–January 2013).
>
> **Parking-lot home:** `PL-EVID-01` Historical Evidence / Observation Architecture, with direct relevance to `foundations/market-priced-risk.md`, `PL-DEPLOY`, and the Regime Objective Function.

---

## Why This Artifact Exists

The Goldman paper is useful to Wheelwright less as a strategy prescription than as an external empirical test of the system's reasoning boundaries.

The first pass at applying the paper produced an overly broad catalogue of "failure modes": high implied volatility, assignment, drawdown, concentration, tail exposure, and imperfect execution could all be described as risks to avoid. Taken literally, that framing leaves too little room for Wheelwright to succeed. Put selling is economically meaningful precisely because the operator accepts uncertainty and downside exposure in exchange for compensation.

The corrected distinction is:

> **Risk is not failure. Uncompensated or misunderstood risk is failure.**

Wheelwright should not become a risk-avoidance machine. Its job in the current cash-flow regime is to govern which risks are worth accepting, which consequences remain useful capital states, and whether the evidence supporting that judgment is honest enough to trust.

This finding sharpens the purpose of historical evidence. History should help Wheelwright distinguish successful risk acceptance from actual system failure without converting historical correlations into predictive authority.

---

## External Evidence That Matters

### 1. Put selling was compensated risk-taking, not risk elimination

Goldman's fully collateralized baseline sold one-month ATM puts on optionable S&P 500 constituents. Over the study period it produced approximately 7.1% annualized return at 12% volatility versus approximately 7.3% at 18% volatility for the S&P 500 total return index.

The gross premium collected was much larger than the resulting investment return. The strategy collected roughly 3.4% premium per month on average, while realized downside losses consumed much of that gross premium.

**Interpretation for Wheelwright:** premium is payment for accepting an obligation. Gross premium is neither free production nor proof that an opportunity is attractive.

### 2. Higher compensation could accompany higher realized risk

Goldman found that high-implied-volatility stocks generated higher absolute put-selling returns, but their volatility increased enough that risk-adjusted results did not dominate. Free-cash-flow yield was the strongest and most consistent of the fundamental selection variables Goldman tested.

**Interpretation for Wheelwright:** a large premium may be correctly communicating a large burden. The question is not whether risk exists; it is whether compensation is proportional to the risk and whether the resulting capital state is acceptable.

### 3. Different deltas represented legitimate risk/return choices

Goldman's fixed-delta results did not identify one universally correct delta. Moving farther OTM generally reduced absolute return and exercise frequency while improving Sharpe in the sample. Goldman explicitly found no standard strike-targeting methodology among moneyness, delta, and premium targeting that universally dominated.

**Interpretation for Wheelwright:** delta is a tradeoff control and observable dimension, not a discovered natural constant. A higher-assignment or lower-assignment operating posture can both be coherent if the compensation and consequences fit the Mission.

### 4. The market appeared to pay a volatility risk premium, but did not overprice every risk

For one-month ATM options, Goldman measured average implied volatility of approximately 20.1% versus subsequent realized volatility of approximately 17.1%. The paper also found downside skew somewhat richer than subsequently realized outcomes. At the same time, realized kurtosis exceeded implied kurtosis, with the discrepancy particularly associated with upside extremes.

**Interpretation for Wheelwright:** there is empirical support for the proposition that downside insurance can be richly priced, but no support for the proposition that all option risk is systematically overpriced. The object of underwriting is compensation relative to the burden accepted.

### 5. Underlying economics affected the quality of contingent ownership

Goldman's strongest fundamental result came from free-cash-flow yield on individual companies. High-FCF-yield names produced substantially better risk-adjusted put-selling results than low-FCF-yield names in the sample. Goldman also used FCF yield to set premium targets and thereby strikes.

**Important scope boundary:** Wheelwright currently operates primarily on ETFs. Corporate FCF yield does not transfer directly to an ETF as the same economic object. This paper therefore establishes that *underwriting the thing one may own matters*; it does not establish an ETF underwriting variable. Inventing an ETF "FCF score" from this paper would outrun the evidence.

### 6. Portfolio construction was separate from contract selection

Goldman improved risk-adjusted results in one portfolio experiment by weighting positions according to a simple `IV × |delta|` risk proxy rather than allocating equally.

**Interpretation for Wheelwright:** contract fitness and portfolio fitness are distinct. An individually acceptable contract can still participate in an unacceptable aggregate exposure. The paper does not establish `IV × delta` as Wheelwright policy; it demonstrates the category error in treating candidate ranking as sufficient portfolio governance.

---

## Corrected Wheelwright Failure Model

The broad list of possible risks collapses into three fundamental failure classes.

### F1 — Inadequate Compensation

**Failure:** Wheelwright accepts an obligation whose compensation is inadequate for the burden being assumed.

This includes the specific error of allowing high premium or high annualized yield to stand in for opportunity quality.

This does **not** mean high IV, high premium, meaningful assignment probability, or downside exposure are failures. They can be success conditions when the market pays proportionately for them.

**Success mode:**

> **Accept well-compensated uncertainty.**

Wheelwright's existing `Market-Priced Risk as Evidence` research topic is the natural explanatory context. IV, realized volatility, skew, liquidity, structure, and related observations may help explain *what the market is paying the operator to bear*. They remain evidence, not a proprietary risk score or forecast.

### F2 — Unacceptable Capital Consequence

**Failure:** Wheelwright accepts an obligation whose mechanically possible resolution leaves the portfolio in a capital state that is not useful or absorbable under the current Mission.

For a CSP, assignment itself is not failure. The policy-over-prediction framing already requires the operator to accept the acquisition consequence before deployment. The failure occurs when that consequence was never genuinely acceptable, or when portfolio composition makes an individually acceptable consequence collectively unacceptable.

Goldman's FCF result is relevant here as evidence that the economics of contingent ownership matter. It does not tell ETF Wheelwright what the correct underwriting variable is.

**Success mode:**

> **Accept consequences that remain useful capital states.**

Temporary drawdown, assignment, concentrated deployment, or tail exposure can all exist inside a successful operation if they remain within governed capacity and preserve the productive capacity required by the Regime Objective Function.

### F3 — Epistemic Self-Deception

**Failure:** Wheelwright mistakes incomplete, censored, stale, or interpretation-contaminated evidence for knowledge.

Examples include:

- treating "not evaluated" as "evaluated and failed";
- learning only from executed or recommended opportunities and thereby introducing survivorship/selection bias;
- mistaking a sampled DTE surface for the opportunity surface;
- using recommendation-time indicative economics as though they were realized execution economics;
- persisting a derived usefulness score and later treating it as historical fact;
- promoting a relationship observed over insufficient history into policy without preserving the observations needed to falsify it.

**Success mode:**

> **Know what Wheelwright actually knew at the time, preserve the facts, and allow later policy to be tested against them.**

This is the direct connection to `PL-EVID-01` and the August 27 direction: **persist opportunity facts; derive usefulness**. The distinction between evaluated failure and not-evaluated is load-bearing because otherwise future learning can confidently optimize against a censored history.

---

## Success Envelope

The finding can be expressed compactly as:

```text
Successful governed put selling
    = compensated risk
    + acceptable capital consequences
    + honest evidence
```

This is intentionally permissive.

Wheelwright is allowed to recommend opportunities with:

- high implied volatility;
- meaningful assignment probability;
- substantial downside exposure;
- temporary unrealized drawdown potential;
- nontrivial concentration;
- imperfect but acceptable execution;
- exposure to rare adverse outcomes.

Those characteristics are not defects merely because they are risks. They become defects when compensation is insufficient, consequences exceed governed capacity, or Wheelwright does not possess trustworthy evidence about what it is doing.

The corresponding WAIT semantics become sharper:

> **WAIT is appropriate when no adequately observed opportunity offers sufficient compensation for consequences the portfolio is willing and able to accept.**

WAIT should not mean "meaningful risk exists." Meaningful risk is the economic reason premium exists.

---

## Why `PL-EVID-01` Is the Parking-Lot Home

This finding touches `PL-DEPLOY`, Market-Priced Risk, portfolio construction, and policy calibration, but none is the correct primary home.

The immediate architectural consequence is not a new recommendation rule. It is a requirement on what historical observation must make possible later.

The opportunity-history evidence plane should preserve enough policy-neutral contemporaneous facts that future analysis can distinguish F1, F2, and F3 without having encoded today's theory into storage.

In particular, future analysis should be able to ask questions such as:

- What compensation was observable at the decision moment?
- What delta, DTE, moneyness, spread, OI, volume, and underlying price were observable?
- What contemporaneous volatility evidence was observable, where provider evidence permits it?
- Was the opportunity actually evaluated, and if so, what evidence caused it to survive or fail?
- What policy version interpreted those facts?
- Was the opportunity recommended, ignored, or executed?
- If executed, what was the actual fill versus indicative economics?
- What resolution occurred?
- What happened to capital after assignment, expiration, or call-away?
- How long was capital committed before returning to a new decision point?
- Did productive capital erode, recover, or grow across the full lifecycle?

These questions do **not** imply that every answer belongs in one table or that all data must be acquired immediately. They are a design test for the observation architecture: facts that are cheap and impossible to reconstruct later deserve special scrutiny before the schema is frozen.

A particularly important distinction is between data that can be derived later and data that disappears:

- realized volatility can potentially be derived later from durable price history;
- contemporaneous implied volatility/skew and the exact opportunity surface may be impossible to reconstruct if raw option observations are discarded;
- interpretation such as "good compensation" should generally be derived later rather than persisted as historical fact.

This is a question for `PL-EVID-01`, not an authorization to expand the schema blindly.

---

## Relationship to Existing Concepts

### Market-Priced Risk as Evidence

This paper materially strengthens the existing research question. The market's premium is evidence of a priced burden. Historical IV versus subsequent realized volatility is one way to examine whether that burden was systematically richly priced. The existing prohibition on arbitrary composite risk scores remains appropriate.

### Deployment Opportunity (`PL-DEPLOY`)

The finding sharpens the distinction between compensation and fitness. Eligibility/acceptability should prune; fitness ranks survivors; relative superiority remains insufficient. However, the paper does not supply Wheelwright's absolute deployment threshold.

### Policy over Prediction

Nothing here requires a price forecast. The relevant question is whether the operator accepts the enumerated consequences for the compensation currently observable. Historical evidence calibrates policy; it does not become opaque predictive authority.

### Regime Objective Function

The success criterion is not premium maximization. Production must remain sustainable while preserving productive capacity. Therefore temporary adverse states are permissible; permanent or inadequately compensated consumption of the production machine is the concern.

### Kreature and Evidence

The responsibility separation remains coherent:

- **Kreature watches:** derives current temporal observations and makes change legible.
- **Evidence remembers:** retains policy-neutral historical facts and provenance.
- **Decision governs:** applies explicit policy to current evidence.
- **Production/lifecycle evidence tells us what happened:** enabling later calibration of whether accepted risks actually served the Mission.

This paper increases the value of that separation because learning requires reconstructing what was known before the outcome without contaminating the historical facts with later interpretation.

---

## What This Finding Does NOT Authorize

This artifact does not authorize:

- adding FCF yield or a synthetic ETF FCF score;
- changing the current delta target or preferred band;
- changing the 7–45 DTE operating surface;
- adding Sharpe to recommendation ranking;
- adding `IV × delta` position sizing;
- adding a market-risk composite score;
- changing ACTIONABLE / EDGE / WAIT semantics in code;
- implementing a new provider solely to obtain IV history;
- turning Goldman's 2003–2013 relationships into current Wheelwright policy.

Those would require separate evidence, architectural reasoning, and explicit authorization.

---

## Observation-Architecture Design Test

Before `PL-EVID-01`'s opportunity-history representation is treated as sufficiently durable, apply this test:

> **If Wheelwright operates for twelve months under today's policies and we later discover that premium yield was a poor proxy for successful deployment, will the retained facts let us determine what observable dimensions actually separated successful compensated risk from inadequate compensation, unacceptable capital consequences, and simple non-observation?**

If yes, the evidence plane is doing its job even if today's theories are wrong.

If no, the missing irreconstructible observations should be identified before policy-neutral history begins accumulating at scale.

That is the actionable contribution of the Goldman paper to current Wheelwright architecture.
