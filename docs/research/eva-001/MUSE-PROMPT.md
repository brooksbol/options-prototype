# Muse Research Assignment — EVA-001 Evidence Feasibility

The Principal will relay this prompt and return your research. This is a primary-source research assignment, not implementation, strategy optimization or a request to endorse a predetermined model. No repository write, paid purchase, account changes, brokerage access or backtest is requested.

## Research question

We are designing a bounded study: can historical option-market information improve estimates of net expected P/L for 30–60 calendar-DTE liquid-ETF iron condors relative to simple historical/IV-based baselines, and does any forecast improvement translate into better net economic outcomes? Forecast quality and economic usefulness are separate tests. Positive expectancy, risk compensation and alpha are separate findings. No full probability-distribution reconstruction is presumed necessary.

Research population proposed: SPY first, XLE/EWZ secondary subject to the same evidence requirements. Standard 100-share physically settled American options, one-unit equal-quantity single-expiration iron condors. Candidate draft: Wednesday 10:05 ET entry, nearest 45 DTE within 30–60, 20-delta OTM shorts, wings nearest 1% spot width. These are experimental parameters, not accepted brokerage or Wheelwright policy, and may be challenged before preregistration.

Management draft: gross 50% opening-credit capture target, five-minute observation, trigger followed by pricing at the next observation, time exit on first trading session <=21 DTE. Ordinary complete paths close before expiration; missing/unfilled/assignment exceptions must remain explicit. A periodically observed trigger does not represent a continuously working limit order. Four-leg NBBO does not establish a simultaneous package fill. Midpoint is an optimistic diagnostic, not an executable fact.

## What Codex has actually verified

- Retained October 8 Theta files: 841 IWM EOD rows June 2023–October 2026; 692 RVX rows January 2024–October 2026; older sampled dates returned HTTP 403. These were stock/index requests, not options entitlement proof.
- Three archived research packages match their manifests. Two October 1 Tradier specimen packages contain point-in-time chains; some bodies duplicate across packages. SPY has November 13 and November 20 chains with quote/Greek/IV fields. They are not subsequent quote paths, and XLE/EWZ are not in these particular specimens.
- Existing Theta Terminal is not listening on the documented local port, so current stock/options tier and historical quote access remain unverified. Do not infer our paid subscription from public product documentation.
- TT Live's P50 is a verified profit-capture target, not a probability forecast. No contemporaneous historical brokerage POP/target-probability panel has been located in the audited sources.
- A prior research program parked the missing **retail SPX 30–60 DTE execution calibration** cell as locally inconclusive. Do not transfer a scalar from that cell, 0DTE, single-leg market orders or another instrument to these ETF condors.

The audit has not downloaded an option panel, fitted models or computed trade outcomes. You need not repeat local inventory or repository architecture research.

## Your research tasks

1. **Historical data sufficiency.** Inspect current official ThetaData documentation for historical contract enumeration, underlying/option NBBO, quote timestamps versus sampling/report timestamps, sizes/conditions, IV/Greeks methodology and tier/date limitations. Identify whether a small outcome-blind pilot can establish four-leg reconstruction. Flag documentation contradictions. Distinguish documented vendor capability from our unverified account access. Treat ORATS/Tradier history as alternatives only if primary evidence establishes the actual product/fields; do not assume a direct ORATS subscription.
2. **Execution evidence.** Find load-bearing primary evidence for ETF multi-leg option execution costs and fill/target assumptions at approximately 30–60 DTE. Separate complex-order executions from summed leg markets, quoted sides, midpoints and broker fills. Preserve instrument, date, tenor, order type, participant and market-regime boundaries. Research dated commission/fee source availability; identify what must remain a sensitivity range. Stop at a documented evidence ceiling rather than inventing a precise fill scalar.
3. **Benchmarks and identification.** Find a small set of credible primary empirical methods for comparing direct conditional option-P/L forecasts with simple historical/IV-based baselines. Explain how to avoid circular risk-neutral valuation claims, leakage, overlapping-label pseudoreplication and favorable-regime selection. Identify whether a two-leg credit vertical would offer a materially cleaner first feasibility test and precisely what condor conclusions it would not establish. No literature survey for its own sake.
4. **American lifecycle and missingness.** Identify exercise/assignment, ex-dividend, settlement, contract-adjustment and quote-gap requirements that can invalidate an apparent managed-return label. Propose a bounded empirical check or explicit sensitivity for each load-bearing gap; do not demand unavailable perfect execution history as a universal stop.

## Required return

Return one concise report with:

- Evidence table: claim; primary URL and section/page; population/period; directly inspected fact; relevance; limitation; classification (`VERIFIED`, `IDENTIFIED-TRACEABLE`, `INFERENCE`, `ABSENCE-OF-EVIDENCE`).
- Dataset-by-question matrix separating terminal payoff, once-daily management, five-minute management and continuously working profit orders.
- Smallest defensible research design and the three strongest attempts to falsify its identification/execution assumptions.
- Proposed benchmark/cost scenarios with reasons, and explicit unresolved cells. Do not call an assumption empirically calibrated.
- Any material change to the draft population/management/model framing, with the evidence causing it.
- A clear stop/continue/narrow recommendation for **data feasibility**, separate from any statement about trading advantage.

Prioritize source depth over count; aim for 6–10 load-bearing primary sources, stop expanding when additional sources do not change the design. Source absence or inaccessible restricted data is a valid result. Preserve conflicts and shared evidence ancestry. Do not make a profitability claim, recommend trades or interpret practitioner repetition as independent replication.

Wheelwright context is a downstream boundary only: future authoritative calculations would belong to its v2 backend, and forecasts do not automatically become deployment authority. This assignment must not invent architecture, Product requirements or a roadmap commitment. EVA-001 is research; no production or experiment-execution permission follows from your report.
