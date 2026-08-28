# Entry Mechanisms: Production, Risk Compensation, and Capital Consequence

> **Status:** Discovery finding — external research interpreted against current Wheelwright architecture and current operating evidence. Not policy. Not an implementation authorization.
>
> **Date:** August 27, 2026
>
> **External source:** Goldman Sachs Options Research, *The Art of Put Selling: A 10 Year Study*, April 4, 2013 (study period January 2003–January 2013).
>
> **Parking-lot home:** `PL-EVID-01` Historical Evidence / Observation Architecture, with direct relevance to `PL-DEPLOY`, `foundations/market-priced-risk.md`, Policy over Prediction, and the Regime Objective Function.

---

## Why This Artifact Exists

Wheelwright currently supports two entry mechanisms into productive exposure:

1. **Cash-secured put (CSP)** — contingent entry. Capital remains collateral until the obligation resolves; assignment may create share ownership.
2. **Buy-write (BW)** — immediate entry. Shares are acquired now while a call is sold against them, exchanging some future disposition/upside freedom for premium.

The Goldman paper provides unusually strong external evidence about the CSP / put-selling side. It does **not** define Wheelwright's strategy and it does not directly validate buy-writes.

Wheelwright's own operating evidence has so far shown a material asymmetry:

> **Buy-writes have exhibited a higher production rate than CSPs in current Wheelwright operation.**

That observation is discovery evidence, not a ratified universal rule. It creates a more valuable question than "are puts good?":

> **Why is one entry mechanism producing more than another, and what additional risk, constraint, or capital consequence is Wheelwright accepting in exchange for that production?**

The corrected governing research frame is therefore not put-specific:

> **Risk is not failure. Uncompensated or misunderstood risk is failure.**

And the broader success hypothesis is:

```text
Successful governed entry
    = compensated risk
    + acceptable capital consequences
    + honest evidence
```

---

## Entry-Mechanism Model

Every supported entry mechanism can be examined through the same three-part structure:

```text
Entry mechanism
    -> production received
    -> risk / obligation accepted
    -> capital state created
```

### CSP

- **Entry:** contingent
- **Production:** put premium
- **Obligation:** buy shares at the strike if assigned
- **Initial capital state:** cash / collateral remains until resolution
- **Adverse but potentially acceptable consequence:** ownership after underlying decline
- **Primary underwriting question:** was the premium adequate for accepting contingent ownership at this strike?

### Buy-write

- **Entry:** immediate
- **Production:** call premium, plus any realized appreciation if called above basis
- **Obligation:** sell owned shares at the call strike if exercised
- **Initial capital state:** cash becomes shares immediately; shares are encumbered by the short call
- **Adverse but potentially acceptable consequence:** immediate equity exposure, capped disposition/upside, and possible deterministic capital erosion if acquisition economics are poor relative to strike
- **Primary underwriting question:** is the additional production adequate for immediate ownership plus the call constraint and its capital consequences?

These mechanisms can converge toward related expiration economics in matched synthetic cases, but Wheelwright does not necessarily operate synthetically matched CSP and BW positions. Actual policy, strike choice, DTE, entry price, liquidity, execution, and lifecycle differ. Therefore observed production differences must be measured rather than explained away by parity.

---

## Current Empirical Asymmetry

Wheelwright's current operating evidence indicates:

```text
BW production rate > CSP production rate
```

This is important precisely because it may represent a **success mode**, not a defect.

The higher production could be compensation for one or more of the following:

- immediate equity ownership rather than contingent ownership;
- different strike / delta regions of the surface;
- different DTE or capital-commitment duration;
- surrender of upside or disposition flexibility through the short call;
- different execution conditions;
- different underlying opportunity sets reaching the two entry paths;
- different capital velocity after resolution;
- other market-priced burdens not yet isolated.

The present evidence does not establish which explanation dominates.

The correct response is therefore **not** to suppress buy-write production until it resembles CSP production. It is to preserve enough evidence to determine what Wheelwright is being paid for and whether the resulting capital states remain acceptable.

---

## What Goldman Contributes

Goldman studied put selling, so its evidence applies directly only to the CSP side of this comparison. Its architectural value is in demonstrating several principles Wheelwright can test across entry mechanisms.

### 1. Premium is compensation, not free production

Goldman's gross monthly put premium was much larger than the strategy's realized investment return because downside losses consumed much of the premium.

**Wheelwright implication:** production cannot be interpreted independently from the obligation and capital consequence that generated it.

### 2. Higher compensation can accompany higher realized risk

High-IV stocks produced higher absolute put-selling returns but also materially higher volatility. High compensation was not automatically superior compensation.

**Wheelwright implication:** the fact that BW currently produces more than CSP is useful evidence, but not yet proof that BW is the better entry mechanism. The additional production must be interpreted relative to what BW makes the portfolio bear.

### 3. Underwriting the resulting ownership state matters

Goldman's strongest fundamental result came from free-cash-flow yield in individual companies. The result does not transfer directly to ETF FCF, but it demonstrates that the economic quality of contingent ownership can materially affect put-selling outcomes.

**Wheelwright implication:** both CSP and BW ultimately create or can create owned-asset states. The acceptability of those states matters separately from premium rate.

### 4. Risk choice is not a single universal setting

Goldman's delta results represented tradeoffs among return, volatility, and assignment frequency rather than a universally optimal delta.

**Wheelwright implication:** entry mechanism, delta, DTE, strike, and capital commitment should remain observable dimensions whose usefulness is learned from history, not presumed constants.

### 5. Portfolio construction is separate from contract quality

Goldman improved risk-adjusted results through portfolio weighting independent of contract selection.

**Wheelwright implication:** a high-producing entry opportunity may still be inappropriate for the current portfolio even when its standalone economics are attractive.

---

## Corrected Failure / Success Model

The broad catalogue of option risks collapses into three fundamental failure classes that apply to both current entry mechanisms.

### F1 — Inadequate Compensation

**Failure:** Wheelwright accepts a burden whose compensation is inadequate for the risk or constraint assumed.

For CSP this may mean insufficient premium for contingent ownership risk.

For BW this may mean apparently strong premium that fails to compensate for immediate equity exposure, constrained disposition, execution economics, or deterministic erosion near/through the call strike boundary.

**Success mode:**

> **Accept well-compensated uncertainty and constraint.**

High premium, high IV, meaningful assignment probability, immediate ownership, or capped upside are not failures by themselves.

### F2 — Unacceptable Capital Consequence

**Failure:** an entry mechanism creates a mechanically possible capital state that the portfolio cannot productively absorb under Mission.

For CSP, assignment is not intrinsically failure.

For BW, immediate ownership or call-away is not intrinsically failure.

The relevant test is whether the resulting state remains useful within productive-capital, concentration, liquidity, and lifecycle constraints.

**Success mode:**

> **Accept consequences that remain useful capital states.**

### F3 — Epistemic Self-Deception

**Failure:** Wheelwright mistakes incomplete, selected, stale, or interpretation-contaminated evidence for knowledge.

Examples now include cross-entry-mechanism errors:

- comparing BW and CSP production without normalizing capital and time;
- comparing only executed trades and ignoring rejected / unobserved opportunity sets;
- learning from one mechanism under a richer or fresher evidence surface than the other;
- treating recommendation-time midpoint economics as realized execution economics;
- failing to preserve acquisition price relative to call strike for BW;
- failing to preserve strike / premium / delta / DTE / spot relationships for CSP;
- treating policy-created selection effects as market facts;
- promoting the current `BW > CSP` production observation into universal policy before enough history exists to explain it.

**Success mode:**

> **Know what Wheelwright actually knew at the time, preserve the facts, and allow later policy to be tested against them.**

---

## The More Useful Comparative Question

The architectural question for `PL-DEPLOY` is not:

> Which strategy is better, puts or buy-writes?

It is closer to:

> **For a unit of productive capital, which currently available entry mechanism offers the best production for a set of capital consequences the portfolio is willing and able to accept?**

That question preserves room for both mechanisms to succeed.

A higher-producing BW can legitimately dominate a CSP when the additional burden is acceptable and adequately compensated.

A lower-producing CSP can legitimately dominate a BW when preserving cash state, delaying ownership, avoiding immediate equity exposure, maintaining upside flexibility, or other consequences are more valuable to the current portfolio.

WAIT remains a valid third result when neither entry mechanism offers adequate compensation for acceptable consequences.

---

## Why `PL-EVID-01` Remains the Primary Home

This finding is directly relevant to `PL-DEPLOY`, but its immediate architectural consequence is evidence retention.

Wheelwright cannot later determine why BW produced more than CSP if it retains only realized premium or only selected trades.

Historical observation should make it possible to reconstruct, at minimum conceptually, the contemporaneous bargain presented by each mechanism:

### Common facts

- observation moment and provenance;
- symbol / instrument identity;
- spot price;
- expiration / DTE;
- strike;
- bid / ask / midpoint convention;
- premium and production-rate representation;
- delta and available Greeks;
- OI / volume / spread;
- whether the opportunity was actually evaluated;
- policy version that interpreted it;
- whether it survived, was recommended, was executed, or was not evaluated;
- realized execution where applicable;
- lifecycle resolution;
- capital committed and time committed;
- productive-capital consequence.

### BW-specific facts that may be irreconstructible later

- contemporaneous share acquisition price / executable stock price;
- call strike relative to acquisition price;
- maximum capital-preserving acquisition boundary as understood at the time;
- simultaneous stock + option execution relationship;
- resulting encumbrance state.

### CSP-specific facts that may be irreconstructible later

- strike relative to contemporaneous spot;
- collateral requirement;
- premium relative to contingent acquisition obligation;
- assignment economics as understood at the time.

This list is a **design test**, not a schema specification.

The rule remains:

> **Persist policy-neutral facts when they are cheap and irreconstructible; derive usefulness later.**

---

## Relationship to Existing Concepts

### Deployment Opportunity (`PL-DEPLOY`)

This finding materially sharpens the accepted unified-surface direction. CSP and BW should eventually be comparable as alternative capital actions, not merely displayed as unrelated premium generators.

The comparison must not collapse to premium rate alone. Production, capital commitment, consequences, and portfolio admissibility all matter.

### Market-Priced Risk as Evidence

Goldman strengthens the hypothesis that option compensation contains useful information about the burden being transferred. IV, realized volatility, skew, liquidity, and structure may help explain why two superficially similar opportunities pay differently.

The existing prohibition on arbitrary composite risk scores remains appropriate.

### Policy over Prediction

No directional forecast is required. Wheelwright can choose among CSP, BW, and WAIT by governing acceptable consequences against observable compensation.

### Regime Objective Function

The objective is not maximum premium. It is sustainable production while preserving productive capacity. Entry mechanisms are means to that objective, not objectives themselves.

### Kreature and Evidence

- **Kreature watches:** current opportunity and change.
- **Evidence remembers:** policy-neutral contemporaneous facts and provenance.
- **Decision governs:** which entry mechanism, if any, is acceptable now.
- **Production / lifecycle evidence:** tells us what actually happened so future policy can be calibrated.

---

## What This Finding Does NOT Authorize

This artifact does not authorize:

- declaring buy-writes universally superior to CSPs;
- changing entry-mechanism preference or ranking;
- forcing equal production rates between mechanisms;
- adding synthetic ETF FCF measures;
- changing current delta or DTE policy;
- adding Sharpe or `IV × delta` to ranking;
- adding a composite risk score;
- changing ACTIONABLE / EDGE / WAIT semantics in code;
- changing execution behavior;
- expanding providers solely on the basis of this finding.

The observed BW production advantage is a research fact to explain and test, not a policy conclusion.

---

## Observation-Architecture Design Test

Before `PL-EVID-01`'s opportunity-history representation is treated as sufficiently durable, apply this test:

> **If Wheelwright operates for twelve months and buy-writes continue to produce more than CSPs, will the retained facts let us determine whether that difference came from better compensation, greater risk acceptance, different capital-state consequences, different capital velocity, policy selection effects, execution, or incomplete observation?**

And the converse:

> **If the apparent BW advantage disappears or reverses, will Wheelwright have enough contemporaneous evidence to explain why without rewriting history through today's policy assumptions?**

If yes, the evidence plane is doing its job.

If no, irreconstructible observations should be identified before policy-neutral history accumulates at scale.

That is the actionable contribution of the Goldman put-selling evidence **and** Wheelwright's current BW-vs-CSP operating observation to the historical-evidence architecture.
