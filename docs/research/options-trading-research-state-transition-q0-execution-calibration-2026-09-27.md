# Options-Trading Research Program — State Transition to Q0 Execution Calibration

**Date:** 2026-09-27  
**Status:** Active research-program control state  
**Authority class:** Research-process authority only  
**Does not authorize:** Product policy, Wheelwright semantics, architecture, implementation, trading policy, an Operating Program, or a trading recommendation.

## 1. Prior durable state

The prior control state is preserved unchanged in:

`docs/research/options-trading-research-program-control-2026-09-27.md`

That state placed the program at:

**PRE-WAVE-0 / PRIMARY-EVIDENCE UPGRADE**

and authorized primary verification of the load-bearing evidence underlying Q1 before preregistration or execution.

The prior state is historical research-control evidence. It is not rewritten by this transition.

## 2. Evidence satisfying the gate

The completed evidence-upgrade report is preserved unchanged in:

`docs/research/primary-evidence-upgrade-canonical-short-premium-retail-execution-2026-09-27.md`

It reports eight independent evidence tracks and records that the hard stop was honored: no Q1 backtest, parameter optimization, trade recommendation, or product/software design.

Its formal disposition is:

**Q1 STATUS: REDIRECT — BETTER QUESTION IDENTIFIED**

## 3. Findings controlling the transition

Three findings materially change the prior research state.

### 3.1 The pooled canonical gross baseline is contradicted as stated

The evidence upgrade found that purported independent replications pool incompatible structures, deltas, loss rules, cadences, denominators, fill assumptions, and friction assumptions. Several circulating annual figures are arithmetic extrapolations rather than sequential portfolio returns.

The bounded replacement is:

> Some index short-premium studies report positive gross per-trade expectancy; transparent sequential-account results range from negative/flat to low-single-digit depending on specification and assumptions.

This does not establish a net executable retail result.

### 3.2 The reverse-boundary correlation claim was mis-signed

The previous formulation that a diversified single-name short-volatility book is structurally long correlation is contradicted as stated.

Long dispersion is short correlation. A short-single-name-volatility book without an index leg is not itself a correlation position.

The replacement hypothesis is **common-downside-factor concentration in stress**. It remains an **INFERENCE** supported by adjacent evidence; the exact target portfolio test has not been run.

### 3.3 Regulatory evidence has hard access ceilings

Primary SEBI studies provide unusually useful population-level calibration but do not expose analyzable public microdata. US regulatory sources do not provide a comparable retail-options P&L panel. Enforcement evidence can illuminate mechanisms but does not supply a counterparty-linked premium-incidence ledger.

Therefore regulatory evidence remains valuable calibration evidence but cannot substitute for missing retail net-execution evidence.

## 4. Why Q1 cannot yet be preregistered

Q1 remains:

> What does the canonical short-premium trade net at actual retail execution?

Q1 is **deferred, not abandoned**.

It cannot yet be preregistered because at least two load-bearing prerequisites remain unresolved.

### Blocker 1 — exact treatment specification

The primary record does not establish one canonical 45/50/21 composite.

The evidence upgrade found a practitioner composite assembled from separately tested components. Approximate 30-delta selection appears as a later guideline. No inspected primary study establishes the complete composite as one canonical tested specification.

A future Q1 preregistration must therefore **stipulate and freeze** its exact treatment rather than claim to recover a uniquely canonical trade.

At minimum this includes DTE, delta and delta definition, profit target, exit rule, underlying, cadence, overlap, sizing/margin denominator, and any IV gate.

### Blocker 2 — executable retail friction

Retail execution friction cannot be represented by one universal scalar.

The evidence supports a matrix varying by:

- instrument;
- order type / execution assumption;
- size;
- DTE;
- period;
- and, where evidence permits, liquidity and time of day.

The most important empty cell for an SPX implementation is:

**SPX retail effective spread by order type / size / time.**

No directly inspected primary empirical estimate currently fills that cell.

Using an invented scalar in Q1 would violate the evidence discipline that caused this upgrade.

## 5. Research-state transition

**FROM:** PRE-WAVE-0 / PRIMARY-EVIDENCE UPGRADE

**TO:** Q0 / EXECUTION-CALIBRATION

This is a redirect of the immediate research question, not an abandonment of Q1.

Q0 is a prerequisite whose result determines whether Q1's execution assumptions can be preregistered without inventing evidence.

## 6. Q0

### Question

> **What is executable retail friction for short-premium execution, specified as an instrument × order type × size × DTE × period matrix — and, in particular, what is the SPX retail effective spread?**

### Why Q0 has priority

Q0 is the binding prerequisite for Q1's execution model.

It is finite and falsifiable.

It can be investigated from primary evidence without running Q1's strategy backtest.

Each matrix cell can be assigned:

- a value or bounded range when supported;
- source and date;
- population/instrument/order boundaries;
- evidence status;
- or an explicit empty-cell finding.

Q0 also tests whether common backtest execution assumptions such as midpoint, quoted-side, bid/ask, or fixed commissions are too favorable, too punitive, or simply unsupported for the relevant instrument and period.

## 7. Q0 evidence targets

Priority work includes:

1. directly inspect the full Bryzgalova–Pavlova–Sikorskaya retail execution study;
2. directly inspect Barardehi et al., `Unpacking Retail Trading Costs`;
3. search for and inspect SPX-specific retail execution/effective-spread studies, including 0DTE evidence where population boundaries are preserved;
4. directly inspect current broker options fee schedules needed for relevant retail executions;
5. inspect Rule 606 reports where they inform routing/PFOF/order-type context without overclaiming execution quality;
6. confirm time-varying mandatory fees and side asymmetries;
7. preserve empty cells rather than filling them by analogy from SPY or single-name options.

## 8. Q0 deliverable

Produce a dated friction matrix whose dimensions include, where evidence permits:

**instrument × order type / execution assumption × size × DTE × period**

For every populated cell preserve:

- exact source;
- evidence status;
- source population;
- observation period;
- measurement definition;
- quoted versus effective spread distinction;
- fees included/excluded;
- participant classification;
- transfer limitations.

For every unpopulated material cell record an explicit evidence gap.

Also produce a fill-model evidence ladder distinguishing at minimum:

1. midpoint diagnostic;
2. midpoint plus dated fees;
3. empirically supported retail effective-spread execution;
4. quoted-side / marketable conservative execution;
5. stress / illiquid execution.

The ladder must state what is measured versus assumed. It must not manufacture a midpoint-fill probability if none is evidenced.

## 9. Q0 completion gate

Q0 completes when either:

### A — calibration sufficient

The friction evidence is sufficient to write Q1's execution assumptions without relying on an unexamined universal scalar, with all material transfer assumptions explicit.

or:

### B — calibration structurally incomplete

The investigation establishes that one or more load-bearing cells, especially SPX retail effective spread, cannot be directly measured from available primary evidence.

If B occurs, that absence is itself the result. The next state must decide whether a bounded conservative assumption, new data acquisition, a different instrument, or another research question is justified. Q0 must not silently convert an evidence gap into a number.

## 10. Q1 re-entry gate

Completion of Q0 does **not by itself** authorize Q1 execution.

Before Q1 becomes ready for preregistration, both blockers must be resolved:

1. exact composite specification must be explicitly stipulated and frozen;
2. execution/friction assumptions must be sourced or explicitly bounded from Q0.

The later Q1 preregistration must also define sequential portfolio accounting, margin/collateral, overlap/reinvestment, survival treatment, assignment/exercise mechanics where relevant, benchmark adjustments, regime coverage, and applicable boundary declarations.

Only after preregistration and adversarial review may a Q1 empirical run be considered.

## 11. Evidence-state discipline

Continue using:

- **VERIFIED**
- **IDENTIFIED-TRACEABLE**
- **INFERENCE**
- **ABSENCE-OF-EVIDENCE**
- **CONTRADICTED**

A research transition may upgrade, downgrade, falsify, or leave a claim unresolved. Repetition does not upgrade evidence.

Primary-source inspection is required for load-bearing calibration inputs wherever feasible.

## 12. Independence firewall

Q0 remains options-domain research.

Do not inject product architecture, software requirements, application ontology, portfolio-specific desired answers, or downstream implementation assumptions into the domain investigation.

Research results may later be reconciled with product authority in a separate process.

## 13. Current authorized research action

**Execute Q0: build and primary-verify the executable-retail-friction matrix and fill-model evidence ladder, with particular emphasis on the missing SPX retail effective-spread cell.**

Do not run Q1.

Do not optimize 45/50/21.

Do not convert unresolved execution evidence into a convenient scalar.
