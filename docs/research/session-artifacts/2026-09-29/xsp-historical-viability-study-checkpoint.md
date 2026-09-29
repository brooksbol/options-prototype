# XSP Put-Credit-Spread Systematic Strategy: Historical Viability Study — checkpoint copy

**Status:** Principal-provided research artifact captured 2026-09-29 while historical acquisition was still running.

**Research question.** What actually happens when a mechanical XSP put-credit-spread program — new $20-wide spread every trading day at ~45 DTE, short strike chosen for ≈$5.00 premium, closed at 50% of credit or mandatorily at 21 DTE — is run against historical option prices? In particular: do the losing forced 21-DTE exits consume the stream of small winners?

## Checkpoint methodology

- Product: XSP (Mini-SPX).
- Historical source: ThetaData free-tier EOD chains; actual usable coverage is being empirically probed.
- Entry expiry: calendar DTE in [40,50], minimizing distance from 45; nearer expiry breaks ties. If none, skip.
- Short put: visible midpoint closest to $5.00, subject to valid executable quote.
- Long put: exactly 20 index points below the short strike.
- Canonical opening credit: bid(short) − ask(long).
- Management closing debit: ask(short) − bid(long).
- 50% target: when sampled debit is at or below 50% of entry credit, fill is modeled at exactly the 50% limit price; sampled debit retained separately.
- Mandatory exit: first trading day with calendar DTE <=21, at sampled executable closing debit.
- Missing management quote: carry and log; no interpolation.
- End-of-sample open position: mark incomplete and exclude from realized-P&L statistics.
- Capital: $92,000; every entry attempt is blocked if aggregate open BPR plus new BPR would exceed account capital.
- BPR per one-contract spread: (20 − credit points) × $100.
- Scenarios: optimistic midpoint reference; canonical reasonable pays quoted spread; conservative adds 2 cents per leg per side adverse slippage.
- Canonical run does not optimize the $5 target, $20 width, DTE window, 50% target, or 21-DTE exit.
- 1/day and 2/day are both capital constrained; 2/day is not treated as simple 2x scaling.

## Report state

Sections defining research question, data/limitations, and methodology were complete in the supplied artifact. Results sections remained intentionally TBD pending completion of the historical pull. No result was estimated or proxied.

Planned result sections:
1. Canonical one-spread-per-day results.
2. Winner versus forced-exit loss analysis.
3. Monthly income distribution.
4. Drawdown and clustered-loss analysis.
5. Capital utilization on a $92,000 account.
6. Two-spreads-per-day scaling case.
7. Execution-cost sensitivity.
8. Limitations and conclusions.

Central outputs include average/median winners erased per losing forced exit and fraction of gross target profits consumed by forced exits.

## Acquisition checkpoint

At capture time the first pull chunk was probing July 2024 and all tested months were returning data. A 72-month scan was intended to establish the true earliest date before completing the remaining pull. Therefore any previously expected “approximately September 2024” start date is provisional and must be replaced by empirical coverage evidence.

## Test checkpoint

The research actor reported 13 passing unit tests, including six newly added tests for target-price execution, strict-DTE skip, incomplete-trade exclusion, capital-ceiling blocking, clustered same-day exits, and order-insensitive live-shape parser validation.

This file is a durable checkpoint summary of the Principal-provided study artifact, not a completed study and not strategy authority.
