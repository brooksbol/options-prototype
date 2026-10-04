# Fixed-population Pass 0 chain-geometry probe — 2026-10-01

This is a read-only cross-root research convention, not Wheelwright strategy authority, an underlying recommendation, a trade selector, or an Exit Reliability result. `ELIGIBLE` means only that the declared chain geometry could be described. `NO_SPECIMEN` means that this declared construction could not be formed. `EVIDENCE_FAILURE` means acquisition did not support a reliable determination. The result retains every requested root and its original order.

## Documented broker surface and acquisition rule

The [detailed option-chain endpoint](https://developer.tastytrade.com/reference/instruments/getOptionChainsSymbol/) returns equity option instruments with expiration, put/call right, strike, contract symbol, root, and pagination metadata. The [market-data-by-type endpoint](https://developer.tastytrade.com/reference/market-data/getMarketDataByType/) returns an underlying quote with `mark` and `updated-at` where supplied. The production REST host is fixed; the only POST is OAuth exchange. Pass 0 uses no Greeks, option quotes, orders, or market-quality thresholds.

Run `node scripts/tastytrade-pass0.mjs > /private/path/pass0.json`. The fixed population of 30 roots is in the script. It asks for `index[]=XSP` and `equity[]=ROOT` for each other declared root; it does not retry another instrument type. The only anchor field is broker `mark`; it does not fall back to bid, ask, mid, or last. Missing, malformed, future-dated, or more than 15-minute-old broker `updated-at` makes that root `EVIDENCE_FAILURE`. This age bound is a technical acquisition convention for a contemporaneous geometry anchor, not a liquidity or strategy threshold. A few seconds of source/local clock skew are tolerated and reported as signed source age.

The as-of date is the run's **UTC calendar date**. Active contracts at each root's exact requested chain path are considered. Eligible expirations are 40–50 UTC calendar DTE inclusive. The chosen expiration minimizes distance from 45 DTE; a tie selects the earlier date. No expiration outside the window is used. For that expiration, the result preserves each listed active put contract's identity and strike, distinct strike count and range, nearest put strike below and at/above the mark, three local gaps, and up to five neighbors on each side. The two-sided bracket requirement exists only to describe geometry around the anchor; it does not choose a short put or spread.

Chain 404 is `NO_SPECIMEN` only when an underlying anchor was also acquired, matching the endpoint's documented “no option chain” meaning. Other HTTP errors, truncated pagination, malformed responses, or unusable anchors are `EVIDENCE_FAILURE`; API failures are never relabeled as structural attrition. JSON is stdout and a short count summary is stderr. A run with any evidence failures exits nonzero while preserving all 30 results.

## One bounded live observation

The final read-only production run began `2026-10-01T17:35:14.410Z` and ended `2026-10-01T17:35:25.565Z`. All 30 declared roots were `ELIGIBLE`; none were `NO_SPECIMEN` or `EVIDENCE_FAILURE`. Every root exposed both 2026-11-13 (43 DTE) and 2026-11-20 (50 DTE) within the window. The deterministic rule chose 2026-11-13 for all 30. The selected expirations contained 936 listed put contracts in total; the per-root distinct-strike counts ranged from 21 to 102. These observations describe this population at this time. They do not establish a useful strike-density threshold or a ranking.

The complete timestamped JSON observation is kept outside the public repository at `/tmp/tt-pass0/pass0-2026-10-01.json`; it is not a committed research dataset. The command can regenerate a new observation, but a later run is a new observation and may have different dates or geometry.

For this population, Pass 0 was **mostly descriptive**, not an attrition gate. The experiment does not answer whether DXLink delta coverage, quote quality, executable complex orders, or eventual Exit Reliability are adequate. It does not advance to Pass 1.
