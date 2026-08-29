# Credit Spreads, Deployment Consequences, and Behavioral Decision Discipline

**Date:** August 29, 2026  
**Status:** Discovery record. Preserves the complete design/research state reached in the August 29 discussion. This is not implementation authorization and does not by itself admit credit spreads into the operational strategy set.

**Related:** `PL-STRAT-01`, `PL-DEPLOY`, `PL-DEC-BEH`, `PL-EXEC-01`, Policy over Prediction, Market-Priced Risk, Entry Mechanisms / Risk Compensation.

---

## Why This Artifact Exists

A discussion that began with additional observable decision criteria (support levels and volatility movement), moved through defined-risk credit spreads and cash-deployment alternatives, and ended in prospect theory and accountable human-in-the-loop design produced a connected architectural discovery.

The important result is not merely "add credit spreads." The discussion challenged an existing premise in Strategy Expansion Governance, sharpened the Deployment Opportunity model, exposed a new consequence-comparison primitive, produced a novel cash-entry structure worth evaluating, and revealed a behavioral-design responsibility that Wheelwright did not previously name.

The conversation should therefore survive independently of chat history.

---

## 1. Additional Observable Decision Evidence

### Support / resistance as decision criteria

Support levels were proposed as a possible Wheelwright criterion. The relevant architectural posture is evidence rather than forecast: support/resistance may describe where current market structure has repeatedly expressed buying/selling behavior, but should not be promoted into a prediction that the level will hold.

For put-side structures, distance from support may be useful context below the short strike. For call-side structures, distance from resistance may be analogous context above the short strike. The usefulness, source, definition, and empirical stability remain unresolved.

Tradier was identified as a plausible source for the underlying market data needed to derive support locally rather than requiring a separate support-level vendor. Wheelwright should prefer fetching reusable market evidence once, persisting it, and deriving policy-neutral metrics locally.

### Volatility movement

Current volatility level may be insufficient. Direction/movement of volatility was proposed as useful evidence, including a possible preference for **high volatility that is falling**. This remains a hypothesis, not policy.

The important distinction is level versus trajectory:

- high IV can mean rich compensation;
- falling IV may indicate that the compensation environment is normalizing;
- the combination could potentially identify attractive premium conditions without requiring directional price prediction.

Historical/temporal evidence is required to evaluate whether this has operating value.

### Execution quality

Execution quality remains a legitimate comparison dimension. High displayed premium is not enough if liquidity and fill quality are poor. Mid-price orders often fill quickly in actual operation, but execution quality should remain observable and may serve as a ranking input or tiebreak rather than being silently conflated with premium quality.

---

## 2. Lifecycle Mechanics: Predetermined Buy-to-Close Limits

A lifecycle idea emerged: after a short-premium contract fills, Wheelwright could support a configurable buy-to-close limit order at a predetermined percentage of premium capture.

Example policy shape:

- entry fills;
- within minutes, a BTC limit order is created;
- target may be configurable (for example 50%, 75%, or another policy-defined fraction of premium captured);
- tables/drawers should expose the relevant lifecycle state so the operator can execute/verify it.

The initial implementation could potentially be operationally simple, including CSV-assisted execution, before deeper broker integration.

The expectation is **not** that the entry and BTC order must be one compound transaction. The BTC order can be created after entry fill, potentially minutes later.

Fidelity's ability to express the desired compound/contingent behavior remains an empirical question and should be tested rather than assumed.

This lifecycle idea later became an important example of behavioral discipline: establish the exit mechanic while calm rather than renegotiating the target after the position becomes emotionally salient.

---

## 3. Credit Spreads: The Prediction Premise Was Challenged

The current Strategy Expansion Governance document excludes bull put and bear call credit spreads on the premise that profitability depends on predicting a price range and that entry therefore requires a directional/range-bound view.

The August 29 discussion found that premise too strong.

A credit spread **can** be used predictively, but prediction is not inherent to the structure.

Example bull put spread:

- sell 95 put;
- buy 90 put;
- receive $1.20 net credit.

Predictive framing:

> I think the underlying will remain above 95.

Consequence-governance framing:

> For $1.20 of compensation, I accept the mechanically bounded consequence of this 95/90 structure, including its $380 maximum loss.

The second framing does not require the operator to forecast that the underlying will stay above 95. It requires the operator to decide whether the complete consequence set is acceptable for the compensation offered.

This matters because CSPs also have favorable and unfavorable future price regions. Yet CSPs are already admissible because assignment/ownership can be governed as an acceptable consequence rather than justified by a forecast.

The existence of a future payoff boundary is therefore **not equivalent to a predictive decision process**.

### Defined-risk consequence

For a vertical credit spread:

- maximum profit is known at entry;
- maximum loss is known at entry;
- breakeven is known at entry;
- collateral/risk capital is bounded;
- terminal payoff states are mechanically enumerable.

The long leg is the price paid for certainty about the adverse boundary.

For a put credit spread:

`max profit = net credit × 100`

`max loss = (spread width − net credit) × 100`

`breakeven = short put strike − net credit`

For a call credit spread:

`breakeven = short call strike + net credit`

The relevant architectural question is therefore:

> **Can Wheelwright define an acceptable credit spread without relying on a directional forecast?**

The answer appears plausibly yes, but requires the full four-lens evaluation before admission.

### Credit spreads are not automatically equivalent to condors/butterflies

The prior exclusion grouped simple vertical credit spreads with structures whose thesis more directly depends on terminal location.

The discussion distinguished them:

- a butterfly explicitly rewards a relatively narrow terminal region;
- an iron condor explicitly monetizes remaining within a range;
- a simple vertical credit spread is a one-sided threshold with a bounded consequence.

That makes a vertical conceptually closer to a bounded CSP/short-option obligation than the existing document suggests.

This does **not** admit verticals. It reopens them for analysis.

---

## 4. Controlled Aggression and the Long Leg

Defined risk may allow Wheelwright to consider structures that are more aggressive on the short strike while bounding severity.

Example conceptual comparison:

CSP:
- sell 90 put for $2.00;
- maximum premium $200;
- breakeven $88;
- approximately $9,000 secured;
- large downside exposure if the underlying collapses, though assignment produces inventory.

Bull put spread:
- sell 90 put / buy 80 put for $1.60;
- maximum premium $160;
- maximum loss $840;
- breakeven $88.40.

The long put sacrifices some premium to bound the adverse consequence.

This creates an empirical hypothesis:

> Can defined-risk structures permit Wheelwright to operate closer to ATM / at higher delta, harvest more premium per unit of risk capital, and improve risk-adjusted cash-flow production relative to CSPs while remaining within governed consequence limits?

Important qualification: defined maximum loss does **not** reduce the probability of loss. A more aggressive short strike may increase loss frequency even while reducing loss severity. "Controlled aggression" is therefore a governance hypothesis, not a synonym for safety.

The structure separates two decisions:

- **short strike** chooses the aggressiveness / compensation region;
- **long strike / width** chooses how much premium is spent bounding the adverse outcome.

Protection cost can be made explicit as the compensation sacrificed to acquire the long leg.

---

## 5. Comparable Opportunities Across Predetermined-Quality Symbols

A central insight was that Wheelwright need not answer "where will this symbol go?" to compare credit spreads.

Wheelwright already governs a universe of instruments considered acceptable for exposure. Within that predetermined-quality universe, it can compare similar structures using observable present evidence.

The question becomes:

> **Given things we are already willing to expose capital to, what is the market paying us now for comparable bounded risks?**

Possible normalization dimensions include:

- similar DTE;
- similar short-leg delta;
- similar spread width;
- similar maximum-loss budget;
- same percentage distance from spot (a different normalization from same delta);
- liquidity / execution quality;
- current IV and IV movement;
- support/resistance relationship where empirically justified.

This is relative opportunity comparison over governed instruments, not directional forecasting.

Comparisons can occur:

1. across symbols for similar spread geometry;
2. within a symbol across different protection widths;
3. within a symbol across CSP versus spread;
4. eventually across different cash-entry mechanisms if consequence semantics can be normalized honestly.

---

## 6. Consequence Envelope: A New Comparison Primitive

Credit spreads exposed a particularly legible three-point consequence surface:

> **Best case → shallow adverse case → worst case**

For a one-contract vertical, a useful candidate presentation is:

- **Max Profit**
- **1-Point Adverse P/L** (for a put spread: short strike breached by $1; for a call spread: short strike breached by $1 in the adverse direction)
- **Max Loss**

For a $5-wide put spread:

| Net credit | Max Profit | 1-point ITM P/L | Max Loss |
|---:|---:|---:|---:|
| $0.85 | +$85 | -$15 | -$415 |
| $1.10 | +$110 | +$10 | -$390 |
| $1.35 | +$135 | +$35 | -$365 |

For exactly $1 intrinsic loss on the short leg:

`1-point adverse P/L = (credit − $1.00) × 100`

This makes an economically meaningful property immediately visible: a sufficiently rich initial credit can leave the position profitable even after the short strike is breached modestly.

"ATM" should not be used for this column because it is ambiguous (ATM at entry versus finishing at the short strike). At exactly the short strike at expiration, a credit spread retains the full credit.

The deeper architectural discovery is that **consequence envelope** may be useful beyond spreads. It could become a PL-DEPLOY primitive if comparable reference outcomes can be defined honestly across strategy types.

---

## 7. Put/Call Spread Symmetry and Asymmetry

Put and call verticals can be compared using the same contractual consequence math when geometry and credit are normalized.

For equal width and equal credit, contractual maximum loss is equal.

But market and lifecycle risks are not identical:

- downside moves can be faster and accompanied by IV expansion;
- upside moves may be more persistent because of positive equity drift;
- put skew may cause comparable put structures to receive different credit than call structures;
- call spreads can introduce early-assignment/ex-dividend considerations;
- same percentage distance from spot is not the same comparison as same delta.

A prior observation that a one-point adverse call spread could show a small gain while a put spread showed a small loss is not structural if geometry/credit differ. For equal credit and symmetric geometry, the one-point adverse P/L is identical. The difference must be explained by credit, placement, skew, or another market input.

This should be tested empirically against real chains rather than promoted into a call-versus-put rule.

---

## 8. Fitness Profiles: Operator Chooses the Objective, Wheelwright Applies It

The consequence envelope led to a candidate **profile dropdown** for opportunities that survive governance.

Profiles change the **fitness objective**, not eligibility or acceptability.

Candidate profiles discussed:

- **Max Income** — favor maximum credit / best-case production;
- **Shallow-Loss Resilience** — favor economics under modest adverse movement;
- **Capital Protection** — favor smaller maximum loss;
- **Balanced** — trade off multiple consequence dimensions;
- execution quality may be a tiebreak/penalty, but no profile semantics are ratified.

The governing sequence remains:

`Governance → eligibility → consequence acceptability → selected fitness profile → ranking → absolute deployment threshold → DEPLOY or WAIT`

Critical invariant:

> **Profiles rank survivors. They cannot make an unacceptable opportunity acceptable.**

The absolute deployment threshold and WAIT remain essential. A profile cannot force deployment merely because one opportunity ranks first.

This is potentially strategy-agnostic eventually, but spreads are the cleanest proving ground.

---

## 9. Cash Deployment: Four Candidate Entry Shapes

The discussion converged on preserving Wheelwright's existing Cash Deployment mechanisms and adding two additional structures for evaluation.

### Put-side cash entry

1. **CSP** — short put, cash secured.
2. **Put Credit Spread** — short put + farther OTM long put.

### Share/call-side cash entry

3. **Buy-Write** — buy shares + short call.
4. **Custom Buy-Write + Call Credit Spread** — buy 100 shares + sell lower-strike call + buy higher-strike call.

The working name "Buy-Write + Call Credit Spread" is retained deliberately. Do not prematurely rename the structure before design analysis.

These are four candidate ways of putting cash to work in predetermined-quality symbols. They should eventually be comparable on the unified Deployment surface only if their different consequence geometries remain explicit.

---

## 10. Mechanics of Buy-Write + Call Credit Spread

Example:

- underlying = $100;
- buy 100 shares;
- sell 105 call;
- buy 110 call.

The option component is a bear-call credit spread, but the entire position is **not** a standalone bear-call spread because the operator also owns 100 shares.

Payoff behavior:

### Below / through $105

The position behaves primarily like long shares plus the net option credit. Share downside remains present.

### Between $105 and $110

The short call progressively offsets share appreciation. The position has an upside **dead/flat zone** between the two call strikes (subject to the initial option credit and exact entry basis).

### Above $110

The long call begins offsetting the short call. The two option legs have reached their bounded spread loss while the 100 owned shares continue appreciating.

Therefore **share upside resumes dollar-for-dollar above the long-call strike**.

This is the crucial distinction from an ordinary buy-write:

- ordinary BW caps upside at the short-call strike;
- BW + call credit spread sells a band of upside between the strikes but retains/resumes upside beyond the long-call strike.

Consequences:

- there is **no finite maximum profit**, because the shares can continue appreciating;
- the structure does **not** bound stock downside;
- the long higher-strike call is not downside protection;
- maximum option-spread loss is bounded, but the share component can still decline toward zero;
- the operator receives option credit in exchange for surrendering the intermediate upside band.

Useful future calculations may include:

- initial cash requirement;
- net option credit;
- effective stock basis;
- P/L at short-call strike;
- P/L at long-call strike;
- shallow downside P/L;
- downside breakeven;
- loss at defined reference declines;
- value/cost of the surrendered upside band;
- resumed-upside threshold;
- return on deployed cash.

Because this structure has neither a finite maximum profit nor spread-like bounded stock downside, the spread-specific `Max Profit / 1-point adverse / Max Loss` columns cannot simply be copied across all four cash-entry mechanisms.

This is evidence that a generalized consequence envelope must be **strategy-aware**.

---

## 11. Data / Provider Implications

Tradier was confirmed during the broader investigation as capable of supplying much of the raw evidence needed for spread analysis:

- production market-data limits are materially higher than sandbox;
- option-chain requests provide strikes, bid/ask, and (in production) Greeks/IV;
- quotes can be batched and streaming can cover many symbols;
- Tradier supports multileg/combo orders;
- sandbox Greek limitations should not be mistaken for production capability.

A spread-analysis pipeline need not multiply provider traffic dramatically if Wheelwright already retrieves the complete option chain. Pairings, width alternatives, net credits, max loss, breakeven, protection cost, and consequence envelopes can be derived locally from the fetched chain.

Preferred pattern:

`fetch expensive evidence once → persist policy-neutral facts → derive many candidate structures locally`

Potential pipeline:

`underlying quote/history → support + realized movement`  
`option chain → strikes + bid/ask + Greeks + IV`  
`temporal history → IV movement / persistence`  
`local Wheelwright derivation → CSP + spreads + protection cost + consequence envelopes + fitness comparisons`

---

## 12. Prospect Theory: The Discussion Broke Into New Ground

Explicit bounded outcomes exposed a psychological effect that the existing architecture did not own.

Example framing contrast:

**CSP**
- collect premium;
- very large theoretical downside;
- adverse resolution is often framed as "assignment" and results in ownership of an instrument already governed as acceptable.

**Credit spread**
- collect smaller premium;
- explicitly bounded maximum loss displayed as a concrete dollar amount.

A spread can be mathematically far more bounded while the visible `-$390` maximum loss feels more threatening than the much larger but psychologically softened CSP consequence.

The reverse effect also exists: a hard maximum-loss boundary can create psychological license for greater aggression — "I can only lose $390, so why not move closer to ATM and collect more?"

Therefore bounded risk can change operator behavior independently of its economic effect.

Relevant behavioral concepts to investigate include:

- **loss aversion** — realized bounded loss may feel worse than larger unrealized inventory decline;
- **reference dependence** — spread P/L may be evaluated against zero/credit while assigned shares are evaluated against basis/ownership;
- **probability weighting** — rare max-loss outcomes may be overweighted or underweighted;
- **certainty effect** — hard loss bounds may be disproportionately valued;
- **break-even effect / risk seeking in losses** — losing positions may induce attempts to get back to the reference point;
- **disposition / realization effects** — operator may resist closing a losing spread because doing so crystallizes the loss;
- **house-money / mental accounting effects** — prior premiums may be treated as permission to accept larger subsequent risk;
- **endowment effect** — assigned/owned ETFs may become privileged because they are already held;
- **myopic loss aversion** — excessive mark-to-market salience/cadence can alter behavior;
- **anchoring, recency, sunk-cost behavior, overconfidence**;
- **choice architecture** — ranking, ordering, defaults, labels, colors, and "best" badges can change choices.

A particularly important distinction emerged:

> **Wheelwright should distinguish economic consequence from psychological presentation of consequence.**

A $500 realized spread loss, $500 of stock erosion after assignment, $500 of buy-write capital erosion, and $500 spent on protection may have different lifecycle meanings, but the UI must not accidentally make one economically disappear merely because its label is psychologically softer.

Potential design aspiration:

> **Behavioral invariance:** economically equivalent consequences should be interpreted similarly regardless of strategy label or presentation unless their lifecycle consequences genuinely differ.

This is a hypothesis to test, not a claim that perfect behavioral invariance is possible.

---

## 13. Mechanics over Impulse

The discussion produced a new Wheelwright design principle:

> **Decide the rules when calm. Apply the rules when capital is at stake.**

More formally:

> **Mechanics over Impulse:** move consequential discretion upstream into explicit policy, objective/profile selection, acceptable-consequence definitions, and lifecycle rules established outside the emotional pressure of a specific trade; apply those choices transparently and mechanically at decision/execution time.

This is distinct from Policy over Prediction.

- **Policy over Prediction** addresses epistemic overreach: do not pretend to know the future when policy can govern uncertainty.
- **Mechanics over Impulse** addresses behavioral inconsistency: do not repeatedly renegotiate risk and lifecycle choices under gain/loss salience when previously considered mechanics can apply them consistently.
- **Evidence over Assumption** addresses factual self-deception: preserve what is actually known and its provenance.

Together they form a coherent decision philosophy.

Examples:

- select an income/protection/balanced profile before staring at individual premiums;
- establish acceptable max-loss rules before seeing a tempting spread;
- establish BTC/take-profit mechanics at entry rather than when a position is green;
- make assignment/roll/close alternatives mechanically legible rather than improvising from current P/L emotion;
- preserve WAIT as a mechanically valid outcome when nothing clears the absolute floor.

---

## 14. Accountable Human in the Loop

The summary thesis was sharpened explicitly:

> **We want human-in-the-loop, not idiot-in-the-loop. Wheelwright's job is to keep the operator closer to the former.**

"Idiot" here is not an intelligence judgment. It describes the same competent human under conditions where cognition becomes predictably less reliable: fear, greed, fatigue, loss aversion, recency, anchoring, sunk cost, overconfidence, or unusually salient gain/loss framing.

The boundary is equally important:

> **It is the human's money and the human's accountability.**

Therefore Wheelwright must not use behavioral discipline as a justification for removing meaningful human agency.

The resulting responsibility split is:

### Human

- owns the money;
- owns the objectives;
- decides what consequences are acceptable;
- establishes/authorizes policy;
- authorizes deployment;
- remains accountable for the decision and outcome.

### Wheelwright

- observes;
- remembers;
- calculates;
- normalizes;
- compares;
- applies authorized policy consistently;
- exposes consequences;
- recommends;
- monitors lifecycle state;
- helps prevent momentary cognitive state from silently rewriting durable policy.

The desired loop is:

`human judgment → policy → mechanics → evidence → human judgment`

not:

`human judgment → every individual decision → more ad-hoc human judgment → execution`

Nor should HITL degrade into:

`opaque algorithm → recommendation → ceremonial human rubber stamp`

That leaves accountability with the human while meaningful reasoning has moved somewhere opaque — precisely the wrong form of HITL.

The governing constraint is therefore:

> **Mechanization should reduce behavioral variance without reducing meaningful human agency.**

Wheelwright may say:

> Under the rules you established, this is the best surviving opportunity; here are its consequences; here is why it outranks the alternatives; WAIT remains available.

But final deployment authorization remains meaningful human action.

---

## 15. Architectural Reconciliation

### `PL-STRAT-01`

Credit spreads should be **reopened for four-lens evaluation**. The prior exclusion reason (prediction is inherently required) no longer stands as a settled conclusion. Reopening is not admission and does not authorize implementation.

The four-lens work should include:

- role relative to CSP/BW/current regime;
- vertical mechanics and protection cost;
- collateral and bounded-loss semantics;
- composition with existing cash/inventory/obligations;
- observable criteria and consequence acceptability;
- lifecycle and broker execution;
- put/call asymmetry;
- empirical comparison under normalized geometry.

The custom BW + call credit spread should also be evaluated as a candidate composed cash-entry mechanism, with its nonstandard payoff geometry preserved explicitly.

### `PL-DEPLOY`

Deployment Opportunity now has additional design pressure:

- compare similar structures across already-governed symbols;
- preserve strategy-specific consequence math;
- investigate a normalized **consequence envelope** abstraction;
- investigate operator-selected **fitness profiles** that rank survivors only;
- preserve the absolute deployment threshold and WAIT;
- distinguish strategy eligibility, consequence acceptability, fitness, and execution quality;
- avoid collapsing contradictory evidence into one opaque universal score.

### `PL-DEC-BEH`

The newly accepted Behavioral Decision Discipline / Accountable HITL item owns the broader behavioral concern:

- Mechanics over Impulse;
- prospect-theory research;
- reference-point and framing effects;
- behavioral impact of bounded loss;
- choice architecture;
- meaningful human agency and accountability;
- lifecycle precommitment mechanics;
- avoiding algorithmic rubber-stamping.

Credit spreads are the motivating case, not the scope boundary.

### `PL-EXEC-01`

Predetermined post-fill BTC/take-profit orders are a lifecycle-mechanics candidate. Exact broker support, timing, execution semantics, and whether WW merely instructs or eventually automates order construction remain unresolved.

### Evidence / observation

Support/resistance and volatility movement require historical evidence and should be evaluated empirically. They should remain policy-neutral derived facts/hypotheses until operating evidence establishes usefulness.

---

## 16. What Is Accepted vs Still Exploratory

### Accepted direction

- Behavioral Decision Discipline / Accountable HITL is accepted as a Wheelwright design concern (`PL-DEC-BEH`).
- The human owns the money, decision, and accountability.
- Wheelwright should reduce behavioral inconsistency without removing meaningful agency.
- Mechanics over Impulse is the working design principle.
- The existing claim that credit spreads inherently require prediction is no longer sufficient to keep them conceptually closed; they should be reopened for proper four-lens analysis.

### Still exploratory / not implementation authorization

- actual admission of put or call credit spreads;
- exact spread width/delta/DTE policy;
- controlled-aggression policy;
- consequence-envelope schema;
- exact fitness profiles or weights;
- support/resistance definitions;
- high-and-falling-IV preference;
- BTC percentage targets;
- Fidelity compound/contingent order behavior;
- production UI/table/drawer design;
- custom BW + call credit spread admission;
- strategy-agnostic normalization of consequences.

---

## 17. Questions to Carry Forward

1. Can credit spreads pass the full four-lens admission test under consequence governance rather than prediction?
2. What normalization produces genuinely comparable spread opportunities: delta, percentage distance, max-loss budget, width, or multiple views?
3. Does defined risk improve sustainable production per unit of governed risk capital, or merely encourage more frequent losses?
4. What does the operator rationally pay for the long leg, and when is protection too expensive?
5. Are put/call asymmetries persistent enough to govern, or merely chain-specific observations?
6. Can support/resistance improve consequence selection without becoming disguised prediction?
7. Does high-and-falling volatility identify useful premium conditions in actual WW history?
8. What generalized consequence-envelope representation can compare CSP, BW, put spreads, and BW + call credit spread without erasing their distinct lifecycle consequences?
9. Which fitness profiles are economically coherent and sufficiently explainable to avoid opaque scoring?
10. How should WW test whether presentation framing changes operator choice for economically equivalent consequences?
11. Which lifecycle decisions benefit from precommitment mechanics, and which must remain situational human judgment?
12. How can WW keep final authorization substantively human rather than a rubber stamp while still reducing impulse-driven variance?
13. What exact Fidelity workflows are possible for multileg entry and post-fill BTC limits?
14. Which facts must be persisted now so future policy can be tested rather than reconstructed from hindsight?

---

## Closing Thesis

The August 29 discussion began as strategy mechanics and ended by clarifying Wheelwright's role in human decision-making.

Credit spreads matter because defined-risk structures make consequences unusually explicit. That explicitness challenged the assumption that verticals necessarily require prediction, created a clean laboratory for cross-symbol consequence comparison, and exposed how presentation of gain/loss boundaries can alter human behavior.

The resulting architectural direction is broader:

> **Wheelwright should make observable compensation and mechanically possible consequences legible, apply the operator's durable policy consistently, preserve WAIT, and keep meaningful authorization with the human who owns the money and the accountability.**

That is the bridge from Policy over Prediction to Mechanics over Impulse and accountable human-in-the-loop operation.
