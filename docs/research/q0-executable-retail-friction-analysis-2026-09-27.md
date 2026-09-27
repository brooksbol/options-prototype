# Q0 Executable Retail Friction — Analysis

**Date:** 2026-09-27  
**Status:** Research analysis / interpretation  
**Authority class:** Research evidence interpretation only  
**Does not authorize:** Product policy, Wheelwright semantics, architecture, implementation, trading policy, an Operating Program, execution rules, or trade recommendations.

## Source

Primary research artifact:

`docs/research/q0-executable-retail-friction-options-trading-2026-09-27.md`

Formal source disposition:

**Q0 STATUS: STRUCTURALLY INCOMPLETE — EVIDENCE GAP**

## Plain-English conclusion

Q0 learned enough to establish that a single generic options "slippage" or friction number would be false precision, but not enough to calibrate the downstream 30–45 DTE retail SPX execution cell.

The SPX cell is partially populated only for 0DTE retail-proxy flow. Beckmeyer, Branger & Gayda provide a genuine SPX estimate for auction-identified small retail-proxy orders, but the source report explicitly forbids transferring that 0DTE estimate into the 30–45/60 DTE cell.

Therefore the scientifically correct result is not a guessed number. The required longer-tenor SPX cell remains empty.

## What Q0 established

### 1. Broker and order type are first-order dimensions

Execution friction is not adequately represented by instrument and contract alone.

The inspected evidence shows large cross-broker variation for otherwise comparable one-contract market orders and materially different conditional execution results for market versus executed limit orders.

Any later empirical model that collapses broker and order type into one scalar would contradict the inspected evidence.

### 2. Limit-order evidence has a selection problem

Executed limit orders can look extremely favorable when measured only conditional on execution.

That does not answer the economically relevant question for a patient retail trader because non-fills matter. The source report found no empirical midpoint-limit fill probability and no complete measure of limit-order opportunity cost net of non-execution.

A later model must not silently convert "executed limit orders were cheap" into "limit orders are cheap overall."

### 3. Public data create the binding gap

Available public/commercial datasets split the fields required for the desired measurement:

- trade-price datasets do not identify retail participants;
- origin-coded datasets do not provide per-origin execution prices;
- "customer" mixes retail and institutional activity;
- public trade data do not expose the needed order-type identity;
- CAT contains the needed lifecycle fields but is regulator-only;
- academic proprietary retail data are not publicly accessible.

The empty longer-tenor SPX cell is therefore at least partly a data-architecture problem, not merely a literature-search problem.

### 4. Explicit fees are substantially better identified

The explicit-fee leg can be frozen from dated primary schedules: exchange fees and surcharges, broker commissions/pass-throughs, OCC, ORF, TAF, Section 31, and related dated changes.

This does not solve execution spread. It means a future preregistration can separate a relatively well-calibrated explicit-fee component from an unresolved execution-price component.

### 5. Transfer shortcuts are not licensed

Q0 specifically rejects silent level transfers from:

- SPX 0DTE to 30–45 DTE;
- SPY to SPX;
- single-name options to SPX;
- single-leg execution to complex-package execution.

The relevant market structures differ enough that these may be bounding or hypothesis evidence only when explicitly labeled, not calibrated replacements.

## Relationship to observed operator execution behavior

Separate from the research evidence, recent operator observation describes a patient/adaptive sell-limit workflow:

1. choose a trade whose current economics are acceptable;
2. enter a sell-to-open limit near the desired/current price, commonly around the observed midpoint;
3. if it fills, stop;
4. if the market moves down and the order does not fill, refresh the economics;
5. if the trade remains acceptable at the current price, reprice and retry;
6. otherwise cancel and choose another opportunity;
7. unusually rich premiums may motivate repeated re-evaluation over a larger price move.

This observation is **not empirical authority** and must not be converted into a fixed retry amount, midpoint-fill probability, or slippage parameter.

It does, however, expose an important measurement distinction for later research:

- movement of the market while an order is being worked;
- execution concession relative to the contemporaneous market;
- cancellation/non-execution when economics cease to qualify;
- possible foregone improvement when a resting sell limit fills after the market improves.

A stale earlier midpoint must not automatically be treated as the execution benchmark. For example, if a premium moves from $4.00 to $3.50 before execution, the $0.50 difference is not by itself a $0.50 execution loss. The relevant execution-quality comparison requires contemporaneous market state and order timing.

This suggests a later empirical question, without authorizing it as policy:

> For a small retail limit order worked near the contemporaneous midpoint, how much price concession is required before execution, how often does it execute without concession, and how often is the trade abandoned instead?

## Consequence for downstream strategy research

Q1 must not assume that every qualifying candidate eventually executes after sufficient repricing.

A truthful future execution model may require at least two terminal outcomes:

- filled at a measured/assumed execution price;
- not executed / cancelled.

If dynamic repricing is modeled, market movement must be separated from execution concession.

No numerical values for those behaviors are established here.

## Remaining evidence gap

The binding cell remains:

**Retail SPX execution at approximately 30–60 DTE, with order type and execution mechanism observed or credibly identified.**

The source report identifies three primary leads for immediate inspection:

1. Garcia-Ares et al. (2026), SPX/SPXW algorithmic retail traders, May 2022–January 2026;
2. Li–Musto–Pearson work on complex-order execution;
3. the expanded Huang–Jorion–Schwarz retail execution sample.

These should be directly inspected before deciding that new primary data collection is necessary.

## Research-state implication

Q0 has answered its calibration question with a structural evidence gap rather than a fabricated scalar.

The next research action is therefore bounded:

**Primary-inspect the three identified longer-tenor / complex-execution leads.**

Only after those inspections should the program choose among:

- existing evidence fills or materially bounds the cell;
- controlled DTE-stratified retail execution experiment;
- restricted/proprietary data access;
- formal declaration that public evidence cannot calibrate the cell and later analysis must carry an explicit assumption range.

No Q1 strategy backtest or parameter optimization is authorized by this analysis.
