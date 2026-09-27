# Options-Trading Research Program — State Transition After Q0 Lead Inspection

**Date:** 2026-09-27  
**Status:** Active research-program control state  
**Authority class:** Research-process authority only  
**Does not authorize:** Product policy, Wheelwright semantics, architecture, implementation, trading policy, an Operating Program, strategy backtesting, execution rules, or trade recommendations.

## Prior state

The prior research-control state is preserved unchanged in:

`docs/research/options-trading-research-state-transition-q0-execution-calibration-2026-09-27.md`

The completed Q0 evidence artifact is:

`docs/research/q0-executable-retail-friction-options-trading-2026-09-27.md`

Its separate interpretation is:

`docs/research/q0-executable-retail-friction-analysis-2026-09-27.md`

The bounded primary-lead inspection is:

`docs/research/q0-primary-lead-inspection-longer-tenor-complex-execution-2026-09-27.md`

Historical states and evidence are not rewritten by this transition.

## Completed authorized action

The prior next authorized action was to primary-inspect three identified longer-tenor / complex-execution leads before deciding whether direct data collection is necessary.

That action is complete.

The three leads were:

1. Garcia-Ares et al. (2026);
2. Li–Musto–Pearson complex-order execution work;
3. Huang–Jorion–Schwarz expanded retail execution experiment.

## Result

**The target 30–60 DTE retail SPX execution cell remains empty.**

The inspections establish:

- Garcia-Ares is SPX but 0DTE, so it cannot populate the target tenor.
- Li–Musto–Pearson strengthens the requirement to treat complex-package execution as a distinct measurement object, but does not provide a verified retail-SPX-30–60-DTE cell.
- Huang–Jorion–Schwarz confirms an expanded direct retail experiment of more than 20,000 trades across nine brokers, but the inspected primary disclosure says full analysis was unfinished and does not publish the target-tenor SPX cell. Its disclosed order population is market and marketable-limit orders, not patient resting-limit execution with non-fill/cancellation.

No inspected source licenses a scalar replacement.

## State transition

**FROM:** Q0 / EXECUTION-CALIBRATION — PRIMARY-LEAD INSPECTION PENDING

**TO:** Q0 / EXECUTION-CALIBRATION — PUBLIC-EVIDENCE CELL EMPTY / DATA-PATH DECISION

The research program has exhausted the specifically authorized primary leads.

## Decision now required

If the program requires an empirically calibrated 30–60 DTE retail SPX execution cell, additional primary data are necessary.

Three research paths remain legitimate:

### A — Controlled retail execution experiment

Collect new primary observations using real small retail orders with a preregistered design stratified by SPX/SPXW tenor and order behavior.

The design must distinguish contemporaneous market movement from execution concession and preserve non-fill/cancellation rather than conditioning only on successful executions.

### B — Restricted data access

Seek an existing nonpublic source that joins the required fields, such as broker TCA/order-lifecycle data or academic/regulatory access.

This path could avoid generating trades solely for measurement but may fail on access.

### C — Formal public-evidence ceiling

Declare the target cell uncalibrated from available public evidence.

Any later empirical work must carry the execution-price leg as an explicit assumption/bound rather than a measured calibration. This does not authorize Q1 by itself; exact treatment specification and preregistration requirements remain.

## No automatic default

This transition does not select among A, B, or C.

It records that another generic public-literature sweep is not the authorized next step. A new source should be inspected if specifically identified, but the research state has reached a genuine data-access/design decision.

No Q1 strategy backtest or parameter optimization is authorized until the research program explicitly resolves or bounds this prerequisite and separately resolves the treatment-specification blocker.
