# Q0 Follow-on — Primary Inspection of Longer-Tenor / Complex-Execution Leads

**Date:** 2026-09-27  
**Status:** Completed bounded follow-on research inspection  
**Authority class:** Research evidence only  
**Does not authorize:** Product policy, Wheelwright semantics, architecture, implementation, trading policy, an Operating Program, strategy backtesting, execution rules, or trade recommendations.

## Research question

After Q0 returned **STRUCTURALLY INCOMPLETE — EVIDENCE GAP**, inspect the three specifically identified leads before deciding whether direct data collection is necessary:

1. Garcia-Ares et al. (2026), *The Rise of Algorithmic Retail Option Traders*;
2. Li–Musto–Pearson, *Costs of Executing Complex Options Trades* and directly related primary DERA work;
3. Huang–Jorion–Schwarz, *Some Anonymous Options Trades Are More Equal than Others*, including the expanded-sample disclosure.

The target remains narrow:

> Does any inspected lead directly populate or materially calibrate retail SPX execution at approximately 30–60 DTE, with order type and/or complex-package execution observed well enough to replace the Q0 empty cell?

## Verdict

**NO. The 30–60 DTE retail SPX execution cell remains empty.**

The three inspections improve boundary knowledge but do not provide a direct empirical calibration for the target cell.

## Lead 1 — Garcia-Ares et al. (2026)

### Primary source

Pedro Angel Garcia-Ares, Diego Amaya, Neil D. Pearson, Aurelio Vasquez, *The Rise of Algorithmic Retail Option Traders*, SSRN 6480379, posted 2026-04-17, revised 2026-08-13.

Primary URL:

https://papers.ssrn.com/sol3/Delivery.cfm/6480379.pdf?abstractid=6480379&mirid=1

### What the source establishes

The paper studies **SPX 0DTE options** using OPRA transaction records from May 2022 through January 2026.

Its object is synchronized algorithmic retail-proxy activity at fixed intraday times. The identified strategies are defined-risk packages whose characteristics resemble retail automation templates.

The paper reports a microstructure result at the synchronized spikes: quoted spreads narrow while effective spreads widen.

### Target-cell disposition

**DOES NOT FILL THE CELL.**

Reason: the paper is explicitly 0DTE. It provides newer SPX evidence and useful evidence about algorithmic/complex retail-proxy execution, but it does not observe the required 30–60 DTE population.

Q0's 0DTE → non-0DTE transfer prohibition therefore remains controlling.

Evidence state for target use: **VERIFIED source / OUT-OF-POPULATION for 30–60 DTE calibration.**

## Lead 2 — Li–Musto–Pearson complex-order execution work

### Primary sources

Su Li, David K. Musto, Neil D. Pearson, *Costs of Executing Complex Options Trades*, SSRN 4389665, March 2023.

Primary record:

https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4389665

Directly inspected related DERA primary paper:

Su Li, David K. Musto, Neil D. Pearson, *Simple Roles for Complex Options*, DERA Working Paper, March 4, 2024:

https://www.sec.gov/files/dera-simp-rule-complx-opt-2503.pdf

### What is directly established

The *Costs* primary record establishes that complex execution protocols allow multi-leg packages to execute at a single net price and reports that complex-order execution costs are significantly lower than simple-order execution costs, with a residual difference after controlling for observable trade characteristics.

The directly inspected DERA companion paper establishes the underlying complex-trade identification design and population used in this research program. Its sample is 2016–2018 and consists of options on 30 high-volume listed firms and 30 high-volume exchange-traded products. It identifies package legs from OPRA complex-condition codes and millisecond timing and studies verticals, calendars, diagonals, ratios, and related packages.

That paper is useful evidence that complex packages are a genuinely different execution object and that many complex trades adjust existing simple positions, including changing strike and/or expiration.

### Access limitation

The complete 61-page *Costs of Executing Complex Options Trades* text was not retrievable from the inspected primary endpoints in this pass; the SSRN primary record and abstract were available, while the directly related SEC DERA paper was fully inspectable.

Accordingly, claims about the *Costs* paper beyond its primary abstract are not upgraded here.

### Target-cell disposition

**DOES NOT FILL THE CELL.**

Nothing directly inspected establishes:

- retail identity;
- SPX/SPXW as the target instrument;
- a 30–60 DTE SPX stratum;
- retail passive-limit fill probability;
- package-level SPX retail execution at the target tenor.

The work is important for the **simple → complex transfer boundary**: package execution is its own measurement object and should not be reconstructed by naively summing single-leg retail spread estimates.

Evidence state for target use: **VERIFIED for complex-order mechanism and bounded cost finding; ABSENCE-OF-EVIDENCE for the required retail-SPX-30–60-DTE cell.**

## Lead 3 — Huang–Jorion–Schwarz expanded retail execution experiment

### Primary sources

Xing Huang, Philippe Jorion, Christopher Schwarz, *Some Anonymous Options Trades Are More Equal than Others*, SSRN 4951825, revised June 10, 2025.

Primary record:

https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4951825

Primary SEC comment letter by Xing Huang and Christopher Schwarz, April 16, 2026, File 4-887:

https://www.sec.gov/comments/4-887/4887-753447-2321514.pdf

### What the primary record establishes

The published working-paper record describes simultaneous retail option market orders across six brokers and finds large broker-dependent differences in execution cost.

The April 2026 SEC letter clarifies the original experimental population:

- approximately 7,000 **market and marketable limit orders**;
- various trade sizes;
- roughly two dozen symbols;
- six retail brokers;
- March–June 2024.

It also states that market and marketable-limit orders were compared at multiple brokers with similar execution-quality findings.

Most importantly for the proposed lead, the authors disclose that they continued trading and expanded the sample to **more than 20,000 trades across nine brokers**.

But the same primary letter states that they **had not finished their full analyses of those additional trades**. The expanded sample was being used for selected issues, including unbundling multi-contract trades.

### Target-cell disposition

**DOES NOT FILL THE CELL.**

The expanded sample is real, but the inspected primary disclosure does not publish a 30–60 DTE SPX execution stratum.

It also does not solve the passive-limit/non-fill problem. The disclosed experiment is market and **marketable** limit execution. That is materially different from a nonmarketable or midpoint-seeking limit order that may rest, be repriced, or be cancelled.

The expanded sample therefore strengthens the evidence that broker/execution mechanism matter, but it does not calibrate the target workflow.

Evidence state: **VERIFIED expanded-sample existence; ABSENCE-OF-EVIDENCE for a published 30–60 DTE SPX retail cell; ABSENCE-OF-EVIDENCE for patient midpoint/nonmarketable-limit fill and cancellation behavior.**

## Cross-lead reconciliation

The three leads close possible escape routes rather than filling the target cell:

| Lead | What it adds | Why target remains empty |
|---|---|---|
| Garcia-Ares et al. | New SPX retail-proxy / algorithmic complex evidence | 0DTE only |
| Li–Musto–Pearson | Complex-package execution is a distinct cost/mechanism object | no verified retail SPX 30–60 DTE target population |
| Huang–Jorion–Schwarz expanded sample | >20,000 real retail experimental trades, nine brokers | no published target-tenor SPX stratum; market/marketable-limit design does not measure patient resting-limit non-fills |

Therefore no inspected source licenses a scalar calibration for the missing cell.

## Newly sharpened measurement requirement

The target is now more precise than "SPX spread at 30–60 DTE."

For the execution behavior relevant to the open question, a direct measurement would ideally preserve:

- SPX/SPXW identity;
- approximately 30–60 DTE, with 30–45 DTE separately recoverable;
- small retail order size;
- buy/sell direction;
- contemporaneous NBBO and timestamp;
- order type and marketability;
- initial limit;
- modifications/reprices with timestamps;
- cancellation/non-fill;
- eventual execution price if filled;
- broker and routing/execution mechanism where observable;
- explicit fees;
- package identity for complex orders;
- enough quote history to separate **market movement while working the order** from **price concession relative to the contemporaneous market**.

Without those fields, a later model risks misclassifying a moving market as slippage or conditioning only on successful fills.

## Decision on direct data collection

The three named primary leads have now been inspected to the extent primary access permits.

**Result: existing inspected evidence does not fill the cell.**

The research program may now legitimately evaluate direct-data paths rather than conducting another generic literature sweep.

The bounded alternatives are:

1. **Controlled retail execution experiment** — Huang-style direct orders, but preregistered for SPX/SPXW, DTE strata including 30–45/60, and order-type paths including patient limits, repricing, cancellation, and marketable controls.
2. **Restricted data access** — obtain a broker-partnered TCA extract, academic proprietary retail data, CAT-like restricted access, or another source joining retail identity, order lifecycle, quotes, and execution.
3. **Formal unmeasurable-from-public-sources declaration** — preserve the spread/execution leg as an explicit assumption range in any later work rather than claiming calibration.

## Research disposition

**FOLLOW-ON STATUS: THREE IDENTIFIED LEADS INSPECTED — TARGET CELL STILL EMPTY**

No strategy-level Q1 backtest, parameter optimization, or invented execution scalar is authorized by this result.
