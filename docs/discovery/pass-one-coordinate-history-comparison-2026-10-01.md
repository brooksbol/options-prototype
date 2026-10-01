# Pass 1 bounded coordinate and history comparison

**Status:** Exploratory research evidence (Category E). No specimen selector, historical lookback, eligibility rule, or full-population crawl is adopted.

**Canonical intake:** `PL-RESEARCH-01`. Follows the [Pass 0 v1 method](pass-zero-v1-class-geometry-method-2026-10-01.md) and [first bounded specimen pilot](pass-one-specimen-selection-bounded-pilot-2026-10-01.md).

**Raw evidence:** [`data/research/specimen-coordinate-comparison-2026-10-01/artifact-manifest.json`](../../data/research/specimen-coordinate-comparison-2026-10-01/artifact-manifest.json) identifies a SHA-256-verified archive containing the **pre-acquisition protocol**, capture/analysis scripts, all 40 raw Tradier responses, and row-level selection results.

## Question and predeclared comparison

The pilot tested whether a simple option-price-blind coordinate selects comparable put-credit-spread geometry across the same eight-underlying contrast panel, and whether 20/40/60 trading-return histories materially change selection. The exact panel was `SPY`, `QQQ`, `XSP`, `SPX`, `TSLL`, `BRK/B`, `DRAM`, and `TLT`. Exact OCC option-class roots remained separate, including `SPX`/`SPXW` and `TSLL`/`TSLL1`; `SPX9` retained its Pass −1 identity-unresolved state.

The protocol was written **before these new requests or inspection of their deltas**. The earlier pilot had already exposed provisional 50-DTE RV60 behavior, so this is not an independent holdout for that coordinate. The protocol declared two exact expirations, 2026-11-13 (43 DTE) and 2026-11-20 (50 DTE), and two selector families:

1. **Price-relative:** short target `K/S = 0.95`; long target `K/S = 0.90`.
2. **Realized-volatility-normalized:** short target `z = −0.5`; long target `z = −1.0`, where `z = ln(K/S) / (RV × sqrt(DTE/365))`. `RV` is sample standard deviation of the last 20, 40, or 60 available close-to-close daily log returns, multiplied by `sqrt(252)`.

`S` was the positive underlying quote `last`. For each exact class root and expiration, each target selected its nearest put strike, with the lower strike winning an exact distance tie. Both selected strikes had to lie within one quarter of the declared short-to-long target-coordinate distance, and short strike had to exceed long strike; otherwise the result was **unmatched**, with no fallback. This is a predeclared geometric tolerance for the experiment, not an accepted Pass 1 tolerance. A hybrid was deliberately not introduced because the pilot had no independent rationale for a blend or floor before inspecting outcomes.

Contract selection never read spread, bid/ask size or age, open interest, volume, Greek value, or broker liquidity labels. Provider delta was read **after** selection only as a diagnostic. Delta is a sensitivity, not a probability or a complete position-risk measure. The comparison makes no adjusted-class economic assertion from `contract_size`.

## Acquisition and denominators

On 2026-10-01, the pilot made five read-only production requests per underlying: quote, daily history, all-root expirations, and one chain for each declared expiration. All **40/40 requests returned HTTP 200**, and all 40 raw bodies and the pre-acquisition protocol hash were verified from the archived evidence. Each history response held 65 daily bars through October 1, enough for all three return windows on this panel. Price-history adjustment semantics and a general quote/history freshness rule remain unverified.

The fixed panel contains **11 OCC class rows**: nine exact-root rows in the ordinary comparison, `TSLL1` as a separate adjusted class, and `SPX9` with unresolved provider-class identity. `TSLL1` had no exact-root put at either sampled expiration, although the first pilot observed it in January 2027; it is not normalized into `TSLL`. `SPX9` is reported as identity unresolved, not as proven absent. Aggregate diagnostics below describe the nine exact-root comparison rows; they are class-level, so `SPX` and `SPXW` both appear when observed.

## Results

| Expiration | Selector | Matched / 9 | Short-delta span | Long-delta span | Net-spread-delta span |
| --- | --- | ---: | ---: | ---: | ---: |
| Nov 13, 43 DTE | Price-relative | 5 | 0.2020 | 0.2311 | 0.0412 |
| Nov 13, 43 DTE | RV20 | 6 | 0.0895 | 0.1001 | 0.0382 |
| Nov 13, 43 DTE | RV40 | 6 | 0.0895 | 0.1001 | 0.0548 |
| Nov 13, 43 DTE | RV60 | 6 | 0.1532 | 0.1493 | 0.0525 |
| Nov 20, 50 DTE | Price-relative | 8 | 0.1792 | 0.2109 | 0.0507 |
| Nov 20, 50 DTE | RV20 | 8 | 0.0672 | 0.1207 | 0.0535 |
| Nov 20, 50 DTE | RV40 | 8 | 0.0746 | 0.1393 | 0.0721 |
| Nov 20, 50 DTE | RV60 | 8 | 0.1190 | 0.1985 | 0.0795 |

Each span is maximum minus minimum provider-reported delta among **matched** rows only. For one short put and one long put, net position delta is long-put delta minus short-put delta; the table reports its cross-class span, not a payoff or executable-risk estimate. On November 20, all four selectors matched the same eight class rows, making that date's comparison paired. Removing the duplicate-underlying `SPXW` row leaves all four reported November 20 spans unchanged. `TSLL` is the ninth row: it is unmatched under every selector on that date because its strike grid misses the predeclared tolerance. Thus narrower dispersion among matches does **not** imply the rule covers the whole panel.

The RV20 coordinate had the narrowest November 20 **short-leg** delta span (0.0672 versus 0.1792 for price-relative), but its long-leg span remained 0.1207 and its net-spread span 0.0535, slightly wider than price-relative's 0.0507. This does not establish comparable full-position risk or justify choosing RV20 from one panel. The hourly Tradier Greek surface and the raw update strings were retained as diagnostics, not qualified as synchronous or fresh by this pilot. [Tradier market-data documentation](https://docs.tradier.com/docs/market-data).

## History and expiration sensitivity

At November 20, **seven of the eight** class rows matched under all RV windows selected a different short/long contract pair under at least one of 20, 40, or 60 returns; only `TLT` kept the same pair. Examples of short-strike changes from RV20 to RV60 were `QQQ` 722→717, `DRAM` 56→54, and the unmatched `TSLL` nearest candidate 8→7. The last example remains unmatched and is not included in the seven-of-eight count. The measured annualized RV also moved materially: `QQQ` 0.1511→0.1885, `DRAM` 0.5409→0.7855, and `TSLL` 0.7990→1.0412. A 60-return choice is therefore not interchangeable with 20 returns, and choosing whichever minimizes this panel's delta spread would tune the rule to the diagnostic.

Expiration phase also changed exact-class geometry. On November 13, `SPXW` exposed 122 puts while `SPX` exposed none; on November 20, both roots exposed puts (420 and 472 respectively). All-root expiration availability is not evidence of an expiration for every class. Match counts changed 5→8 for price-relative and 6→8 for each RV window across the two dates. Among five exact classes matched by RV20 on **both** dates, short-delta shifts were 0.0003 (`XSP`), 0.0006 (`SPXW`), 0.0047 (`BRKB`), 0.0079 (`SPY`), and 0.0356 (`TLT`) in absolute value. These dates also differ in DTE and weekly/monthly character, so the pilot does not isolate a pure calendar-phase causal effect.

## Conclusion and remaining design work

The two predeclared families answer the narrow comparison question: fixed price-relative moneyness produced broader short-delta dispersion on this panel; RV normalization, especially RV20, narrowed the short-leg diagnostic among matched rows. Neither family established a unique comparable spread specimen. Long-leg and net-spread diagnostics, `TSLL` unmatched geometry, large contract-identity sensitivity to the history window, index-root phase differences, and nonstandard deliverables remain material.

The next bounded design step should specify an **independent position-level risk criterion** and a reference-history adjustment/freshness protocol before choosing any lookback or coordinate. It should test a holdout panel or later date under frozen candidate rules, rather than tuning targets or tolerances to these Tradier deltas. The adopted Pass 0 method remains descriptive, and no full-population crawl is justified by this result.
