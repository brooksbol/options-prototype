# Strategy Expansion Governance — August 29, 2026 Amendment

**Status:** Accepted scope correction to the exploratory strategy-expansion boundary.  
**Applies to:** `foundations/strategy-expansion-governance.md`  
**Detailed evidence/discovery record:** `docs/39-credit-spreads-deployment-behavioral-discipline-discovery.md`

## Credit-Spread Scope Correction

The existing Strategy Expansion Governance document currently places bull put and bear call credit spreads in "Currently Out of Scope" because it states that profitability depends on predicting a price range and that entry requires a directional/range-bound view.

The August 29, 2026 design investigation materially challenged that premise.

**Correction:** simple vertical credit spreads are **reopened for four-lens evaluation**. They are no longer to be treated as conceptually excluded merely because their payoff has a favorable future-price region.

This is **not strategy admission and not implementation authorization**.

## Why the Premise Changed

A vertical credit spread can be framed predictively, but it can also be framed as consequence governance:

> For the compensation currently offered, is the complete mechanically bounded consequence set acceptable under current policy and portfolio state?

That framing is structurally consistent with the admission test already stated in the parent foundation:

1. terminal/resolution states are enumerable;
2. maximum profit, maximum loss, breakeven, and collateral/risk capital are known at entry;
3. the long leg bounds the adverse financial consequence;
4. the operator can evaluate compensation against acceptable consequences without asserting where the underlying will finish;
5. observable present evidence can be used to compare similar structures across already-governed symbols.

The existence of a favorable payoff region does not by itself prove that the **decision process** requires prediction. CSPs also have favorable/adverse future-price regions while remaining governable through policy and consequence reasoning.

## Vertical Spreads Remain Distinct From Narrow-Range Structures

This amendment does not automatically reopen every previously excluded structure.

A simple vertical is a one-sided threshold plus a bounded consequence. That is materially different from structures whose economic thesis more directly depends on a narrow terminal region, such as butterflies, or remaining inside a range, such as iron condors.

Each strategy remains subject to the Architectural Admission Test on its own mechanics.

## Required Four-Lens Work Before Any Admission

Credit-spread evaluation must address at least:

- role relative to CSP, CC, and buy-write;
- put versus call vertical mechanics;
- spread width and long-leg protection cost;
- short-strike aggressiveness / delta;
- bounded max-loss semantics versus probability/frequency of loss;
- collateral and capital-state consequences;
- lifecycle and early-assignment/ex-dividend considerations;
- execution/liquidity and broker workflow;
- empirical put/call skew and asymmetry;
- normalized cross-symbol comparison (delta, percent distance, width, max-loss budget, DTE);
- observable support/resistance and volatility-movement evidence where justified;
- consequence-envelope presentation;
- relationship to Deployment fitness profiles and WAIT;
- behavioral effects of explicit bounded loss.

## Additional Composed Candidate

The August 29 investigation also identified a composed cash-entry structure for future four-lens analysis:

**Buy-Write + Call Credit Spread** = buy 100 shares + sell a lower-strike call + buy a higher-strike call.

Working name retained pending analysis.

Important mechanical facts:

- it is long stock plus a bear-call credit-spread option component;
- stock downside remains present;
- upside is flattened between the short and long call strikes;
- above the long-call strike, share upside resumes dollar-for-dollar;
- therefore the whole structure has no finite maximum profit;
- the higher-strike long call is not stock-downside protection.

This geometry prevents naive reuse of a vertical-spread `Max Profit / shallow adverse / Max Loss` display across all cash-entry mechanisms.

## Relationship to Deployment

The investigation strengthens the existing PL-DEPLOY narrowing sequence:

`Governance → strategy eligibility → consequence acceptability → fitness objective/profile → ranking → absolute deployment threshold → DEPLOY or WAIT`

Fitness profiles may rank acceptable survivors but may never bypass governance or consequence acceptability.

A candidate generalized primitive is the **consequence envelope**: make best-case, shallow-adverse, and worst-case consequences legible where those reference points are economically valid. Any generalized representation must remain strategy-aware.

## Relationship to Behavioral Decision Discipline

The explicit gain/loss boundaries of spreads exposed a separate Wheelwright concern now tracked as `PL-DEC-BEH`: the presentation of economically meaningful consequences can change operator behavior.

Strategy evaluation should therefore distinguish:

1. economic consequence;
2. lifecycle/capital-state consequence;
3. behavioral salience created by presentation.

Bounded risk must not be presented as synonymous with small, safe, probable, or attractive risk.

## Governing Disposition

Until the parent foundation is next consolidated, this amendment is authoritative for the narrow scope question it corrects:

> **Credit spreads are reopened for analysis, not admitted for operation. The admission test governs; the former prediction-based exclusion does not.**
