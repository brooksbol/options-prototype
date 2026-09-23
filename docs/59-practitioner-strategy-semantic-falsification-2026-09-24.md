# Practitioner-Strategy Semantic Falsification — 2026-09-24

**Status:** Category E falsification artifact under `PL-SEM-01`; not architecture or implementation authority  
**Semantic target:** `docs/58-wheelwright-semantic-model-v1.md` (v1.3)  
**Principal direction:** Option D — continue semantic falsification before implementation  
**Purpose:** test whether the Semantic Model can represent the dimensions practitioners legitimately bundle under the word “strategy” without creating a universal canonical `Strategy` type.

## 1. Source identity and evidence boundary

Principal-supplied source:

- platform: YouTube;
- video ID: `5BMMrfBtA_c`;
- canonical title established from current YouTube metadata: **Every Options Trading Strategy Explained**;
- channel/publisher established from current YouTube metadata: **The Cashflow Academy**;
- publication date established from current YouTube metadata: **June 30, 2026**;
- source description: “I explain the 11 most popular options strategies, how they work, and when to use them.”

The source description exposes this chapter sequence:

| Time | Conventional label |
|---|---|
| 00:00 | Long Call |
| 05:42 | Long Put |
| 07:02 | Covered Call |
| 08:52 | Cash Secured Put |
| 11:50 | Protective Put |
| 15:58 | Bull Call Spread |
| 19:33 | Bear Put Spread |
| 22:27 | Iron Condor |
| 24:25 | Straddle |
| 27:10 | Strangle |
| 28:52 | Calendar Spread |

A machine-indexed transcript/summary was available through third-party search surfaces during this pass. It is useful as **secondary extraction evidence**, not as a substitute for primary-source mechanics authority. Claims below distinguish source framing from Wheelwright mechanics. Exact wording, formulas, probabilities, and segment-level claims must not be promoted to semantic authority without reproducible primary transcript/video context.

## 2. Source claim classification

The practitioner treatment bundles several claim kinds that Wheelwright must keep separate:

- **[VOCAB]** conventional strategy label;
- **[MECH]** leg/construction/opening cash-flow/payoff mechanics;
- **[THEORY]** option-theory exposure or terminal-payoff consequence;
- **[HEURISTIC]** practitioner rule of thumb or strategy-selection criterion;
- **[EMPIRICAL]** claimed probability/win-rate/performance observation requiring evidence;
- **[PEDAGOGY]** source-specific teaching framework;
- **[NORMATIVE]** recommendation/preference supplied by the practitioner, not mechanically implied.

The source’s “five directions” framework — `-2, -1, 0, +1, +2`, with a one-standard-deviation band used to separate “normal” from “extreme” moves — is **[PEDAGOGY]/[HEURISTIC]**, not an options primitive and not Wheelwright Intent. The model/distribution/horizon/volatility input behind the standard-deviation band must be established before treating the band as quantitative evidence.

Likewise, opening debit/credit is **formation cash flow**, not realized profit, economic quality, risk quality, Objective/Purpose, or Outcome Stance.

## 3. Corpus decomposition

The table records what the conventional label can safely establish and what remains separate. Mechanics are interpreted under Wheelwright’s Options Domain Reference; source-specific use criteria are retained as practitioner framing rather than silently promoted to policy.

| Label | Construction / formation | Payoff / exposure family | Practitioner applicability/thesis pressure | Lifecycle / resolution pressure | Semantic result |
|---|---|---|---|---|---|
| Long Call | long call; opening debit | convex upside right; premium at risk; time/volatility sensitive before expiry | source frames strongly bullish / large upside and “stock replacement” for deep-ITM use | sell/close, exercise, expiry; evidence time matters | label establishes construction family, not purpose, Decision Subject, holding period, or Outcome Stance |
| Long Put | long put; opening debit | convex downside right; premium at risk; time/volatility sensitive | source frames strongly bearish and alternative to short stock | close, exercise, expiry | bearish use criterion is scenario thesis, not Intent |
| Covered Call | long shares/inventory + short call; usually call-sale credit against existing or acquired shares | upside capped by short-call obligation; downside remains materially share-like less premium | source frames income and roughly neutral-to-moderately-bullish use | expiry, close/roll, assignment/call-away; coverage association is load-bearing | label does not establish formation provenance, inventory role, assignment desirability, mandate, or program |
| Cash-Secured Put | short put + governed cash/collateral sufficient for assignment under applicable regime; opening option credit | assignment obligation below strike; downside economic exposure if underlying falls | source frames bullish but less aggressive / acquisition-or-income style use | close/roll, expiry, assignment into shares | label does not establish whether assignment is desired, tolerated, or prohibited |
| Protective Put | shares + long put | downside floor from put right with retained upside less hedge cost | source frames insurance/hedging | put expiry/close/exercise plus continuing share lifecycle | “protection” does not establish mandate, hedge horizon, acceptable cost, or disposition plan |
| Bull Call Spread | long lower-strike call + short higher-strike call, same expiry; net debit in conventional form | bounded downside and capped upside | source maps to bullish but more moderate/normal upside than outright long call | close, expiry, assignment/exercise interactions | directional thesis and bounded payoff are separable from Objective/Purpose and policy |
| Bear Put Spread | long higher-strike put + short lower-strike put, same expiry; net debit in conventional form | bounded downside and capped bearish payoff | source maps to bearish but more moderate/normal downside than outright long put | close, expiry, exercise/assignment interactions | same construction can be selected under different governed purposes; label is not Intent |
| Iron Condor | four-leg bounded-risk range construction, conventionally short inner spread pair with long wings | bounded range payoff; short-volatility/time-decay exposure in common construction | source frames neutral/range-bound use and volatility contraction | multi-leg close/expiry; legwise assignment/exercise and support capability matter | label bundles construction + common thesis, but thesis is not mechanically entailed Intent |
| Straddle | same-strike call + put, commonly both long in the source’s volatility-expansion treatment | two-sided convexity; premium/time-decay cost; volatility sensitive | source frames large move / volatility expansion without requiring direction | close/expiry/exercise; two rights may resolve differently | control specimen survives: label ≠ purpose ≠ market belief ≠ Outcome Stance |
| Strangle | different-strike call + put, commonly both long in source treatment | two-sided convexity with wider breakeven region and lower typical debit than comparable straddle | source frames large move / volatility expansion | close/expiry/exercise | “large move” is scenario criterion, not operator belief or policy |
| Calendar Spread | same option type/strike with different expirations in conventional form | explicitly path/time/volatility-sensitive; terminal payoff alone is insufficient | source frames time/volatility relationship rather than simple terminal direction | near-leg expiry/close/roll and far-leg residual state make lifecycle identity important | strongest corpus pressure against reducing a strategy to terminal payoff geometry |

## 4. Cross-corpus falsification results

### 4.1 Universal `Strategy` type remains falsified

The corpus does not reveal one semantic thing called Strategy.

The conventional labels variously carry:

- construction identity (long call, long put);
- inventory relationship (covered call, protective put);
- collateral condition (cash-secured put);
- multi-leg payoff construction (verticals, iron condor);
- volatility/magnitude pedagogy (straddle/strangle);
- cross-expiry temporal structure (calendar);
- common practitioner use criteria.

No single label consistently establishes formation provenance, Decision Subject, Objective/Purpose, Outcome Stance, Policy, capability, or lifecycle identity. v1.3 §9 survives.

### 4.2 Scenario thesis is a missing explicit semantic pressure

The pass strengthens a distinction only implicit in v1.3:

> a **Scenario Thesis / Market Thesis** is a claim or assumption about possible market evolution used to evaluate consequences; it is not Objective/Purpose, Outcome Stance, Preference, Policy, or realized state.

The source’s `-2/-1/0/+1/+2` framework makes the pressure visible. “Expect a normal bullish move” is neither a desire that the move occur nor an operator mandate. It is an evaluative scenario assumption.

**Disposition:** add Scenario/Market Thesis to the candidate semantic decomposition workspace, provisionally. Do not yet claim it is a primitive or persistent entity.

### 4.3 Applicability/use criterion is not Intent

“When would I use this?” repeatedly combines mechanics, scenario assumptions, volatility expectations, risk budget, capital efficiency, and practitioner preference.

The model survives only if “applicability” remains a derived/multi-dimensional evaluation rather than a synonym for Intent or Strategy.

### 4.4 Opening cash flow is not economic outcome

Debit/credit is a formation fact. It does not establish:

- profitability;
- expected return;
- realized Production;
- maximum economic loss of the Complete Position;
- desirability;
- capital efficiency;
- whether proceeds are deployable.

The corpus strongly supports retaining formation cash flow separately from Counterfactual Consequence, Reconciled Outcome, and Economic Attribution.

### 4.5 Terminal payoff is insufficient

Calendar spreads provide the strongest falsifier. Their meaning depends materially on time, volatility, and the residual far-dated leg when the near leg resolves. A semantic model that stores only terminal payoff geometry cannot represent the practitioner treatment.

Straddles/strangles and long options also reinforce path/time/volatility dependence.

### 4.6 Conventional labels do not establish polarity unless qualified

“Straddle,” “strangle,” “calendar,” “iron condor,” and even “spread” can be underspecified without long/short orientation, strike ordering, expiration relationships, and quantity.

A source may use a conventional default. Wheelwright must preserve the source mapping rather than silently universalize that default.

### 4.7 Capability remains orthogonal

Multi-leg construction validity does not establish:

- broker/account permission;
- collateral treatment;
- quote completeness/liquidity;
- ability to stage as one order;
- Wheelwright representation/recommendation/staging/execution/lifecycle support.

The corpus does not falsify v1.3’s Capability ≠ current feasibility ≠ Wheelwright support separation.

## 5. Pressure on v1.3

### Survives without change

The pass supports:

- Position is not one canonical identity;
- construction ≠ formation mechanism/provenance ≠ Operating Program;
- conventional strategy vocabulary is an external/practitioner mapping, not one universal canonical machine type;
- Objective/Purpose ≠ Outcome Stance ≠ Constraint ≠ Preference;
- mechanics do not establish desirability;
- Alternative/Consequence semantics must be distinct from realized history;
- capability/current feasibility/Wheelwright support remain separate;
- Complete Position is conclusion-relative;
- lifecycle and temporal semantics are load-bearing.

### Candidate refinement

Add a provisional semantic concept:

**Scenario / Market Thesis** — a scoped, time-bounded claim or assumption about possible market evolution used in counterfactual evaluation. It may concern direction, magnitude, volatility, path, correlation, rates, or other market variables. It is neither a desired outcome nor policy. Its authority/evidence class may range from operator assertion to governed model output.

This concept earns further pressure because the practitioner corpus repeatedly supplies scenario criteria that cannot safely be placed in Intent, Objective, Preference, or mechanics.

### Remains unresolved

The corpus does not settle:

- whether Scenario/Market Thesis deserves durable identity or can remain an assertion predicate/class;
- final Intent versus Outcome Stance naming;
- Lifecycle Subject/Episode identity;
- Candidate durability;
- Recommendation identity/version;
- association authority matrices;
- Capital Pool overlap/partition;
- commitment boundary;
- DDD boundaries.

## 6. Source-specific caution: standard deviation

The source’s one-standard-deviation framework must not be stored as “68% probability” without the model assumptions that make that statement meaningful.

Before Wheelwright could consume such a criterion as evidence, it would need at minimum:

- underlying variable;
- horizon;
- volatility estimate/source;
- distribution/model assumption;
- timestamp/effective interval;
- whether the band is risk-neutral, historical, broker-implied, or pedagogical;
- whether the criterion is used as scenario generation, screening, ranking, or a probability claim.

Therefore `±|σ|` is not a strategy property. It is at most a source-specific scenario/applicability criterion until those dependencies are established.

## 7. Verdict

**SEMANTIC MODEL SURVIVES THE PRACTITIONER-STRATEGY CORPUS: YES, WITH ONE MATERIAL REFINEMENT PRESSURE.**

The corpus does not force a universal Strategy type and does not collapse the distinctions established in v1.3. It instead validates the decomposition approach.

The material new pressure is **Scenario / Market Thesis**. Practitioner strategy explanations routinely pair a construction with assumptions about direction, magnitude, volatility, and path. Those assumptions are not Intent. Without an explicit home for them, future reasoning is likely to misfile them as Outcome Stance, Preference, or strategy identity.

This is semantic refinement, not implementation authority.

## 8. Next pressure

Before ratification or DDD:

1. adversarially test Scenario/Market Thesis against at least covered-call, CSP, long-straddle, iron-condor, and calendar specimens;
2. determine whether thesis is a durable semantic identity or a governed Assertion family;
3. pressure-test source polarity/default assumptions (long vs short straddle/strangle, calendar variants);
4. acquire primary segment/transcript evidence before promoting source-specific quantitative claims;
5. then return to the remaining v1.3 blockers.

No code/schema/UI/recommendation migration is authorized by this artifact.
