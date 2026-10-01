# tastytrade one-shot option evidence scout — 2026-10-01

**Status:** scoped exploratory tooling note; not Wheelwright Product, strategy, or trading authority.

Exit Reliability is the research concept of whether a complete option position can be closed, when required, at a price reasonably represented by observable market evidence. The scout captures candidate broker evidence. It does not calculate or rank Exit Reliability, select an underlying universe, or claim that any spread can be executed at a synthetic price.

## API reconnaissance

Current official tastytrade documentation describes:

- [Detailed option chains](https://developer.tastytrade.com/reference/instruments/getOptionChainsSymbol/): one instrument per contract with symbol, root, expiration, strike, put/call, and shares per contract. The implementation uses this flat form for exact contract selection.
- [Quotes by instrument type](https://developer.tastytrade.com/reference/market-data/getMarketDataByType/): option and underlying quote reads, bid, ask, bid/ask size, mark/mid/last, and update timestamp. The combined request cap is 100 symbols. REST quotes require a funded account and are not a continuous feed.
- [Market metrics](https://developer.tastytrade.com/reference/market-metrics/getMarketMetricsIndex/): underlying broker liquidity rating/rank when returned. These are broker metrics, not an Exit Reliability result.
- [Multi-leg spreads](https://developer.tastytrade.com/docs/guides/multi-leg-spreads/): an order can have a net price and multiple legs. A one-shot leg quote response is not a documented executable complex-package quote. No genuine package-level market quote was found in the documented REST reads used here.

The command uses only the existing production OAuth token exchange plus allowlisted GET reads. It does not ask tastytrade for an order preview or submit any order.

## Selection and evidence semantics

Invocation: tt scout ROOT --expiration YYYY-MM-DD --short-put-strike PRICE --widths W1,W2 --underlying-type equity|index

Exactly one uppercase root is accepted per invocation. The supplied expiration and short put strike must match an option-chain put. For each supplied width W, the long put must exist at short strike minus W in that same expiration. All widths must be distinct and positive. No delta, moneyness, premium, DTE, or root-specific width policy is inferred. UTC calendar DTE is reported as a local derivation, not an expiry selector. The example XSP and TLT commands in the root README are explicit feasibility specimens, not accepted research sampling policy.

The JSON has separate selection, broker, observation, and derived sections. Broker quote values remain decimal strings or null; missing values are never replaced by zero. The quote timestamp span is the maximum minus minimum timestamp across unique selected option legs. Request start/receipt times are local UTC timestamps and do not make the reads atomic. An option quote older than 900 seconds at observation time is flagged. This 15-minute window is a disclosed completeness convention for the scout, not a trading threshold. Missing quote, bid/ask side, size, timestamp, or broker market metric is explicit and makes the observation incomplete with exit status 1. Missing underlying bid/ask can coexist with a broker mark/last (as observed for XSP); the price source remains explicit.

An exact-contract selection failure produces no JSON observation and exits nonzero. A quote/data gap produces an incomplete JSON observation and exits nonzero. Preserve such incomplete files if useful for research; do not treat them as complete. This first slice has no derived synthetic package bid, ask, or midpoint.

## Bounded live feasibility, 2026-10-01

One XSP and one TLT invocation used explicit November 20, 2026 expirations and operator-specified strikes/widths. Both returned complete JSON observations under the 15-minute quote convention. XSP selected 750 short put with widths 5, 10, 15, 20; TLT selected 77 short put with widths 1, 2, 3, 5. All selected contracts had bid, ask, bid size, ask size, and update timestamp. XSP option-leg timestamp span was 4.578 seconds; TLT was 1.257 seconds. The XSP underlying index quote had mark/last but no bid/ask. TLT underlying quote had bid/ask and mark/last. Market metrics returned broker liquidity ratings of 0 for XSP and 4 for TLT. These are merely reported broker facts, not a ranking or interpretation. Neither read returned a package-level quote.

The observation is enough to start testing one-shot quote coverage, quoted width, size, and freshness across explicitly selected specimens. It cannot measure actual exit reliability: package fill/no-fill, time-to-fill, and concession are absent. The sample parameters were chosen for API feasibility and must not be treated as a canonical XSP or TLT study rule.
