# Dividend Aristocrats — 45-DTE Liquidity: Interpretation for the Income Portfolio

**Date:** 2026-11-01  
**Standing:** Independent research interpretation / working hypotheses only. Not Wheelwright Product authority, investment selection, or implementation approval.  
**Primary evidence:** [Muse completed study](external-artifacts/aristocrats-45d-options-liquidity-20261031.md), §7–8. The linked study is preserved verbatim; this memo does not amend its metrics.

## What the completed study establishes

The frozen 70-name universe (69 confirmed Aristocrats plus RGLD) was studied over 2025-10-31 through 2026-10-30 using the expiry closest to 45 DTE within a 28–70-day window. The analyzer examined model-estimated ±16-delta puts/calls and ±5-delta wings, using historical EOD quotes. Muse reports 17,567 day-files, 13,346,514 contract-day rows, three identified source-gap dates, and a single crossed CAT quote filtered out.

Top median relative bid/ask spreads at 16-delta shorts: CLX 27.9%; O 28.6%; CVX 29.2%; NUE 29.5%; ADM 34.3%; MCD 35.9%; IBM 37.4%; XOM 38.1%; CAT 38.2%; TGT 39.3%. The median name was about 65%; the bottom ten 100–158%. Both-sided quotability was much lower for some names: KVUE 39/251 days, ATO 13/251, FRT 15/251. Most 16-delta short legs had median reported daily volume zero.

Nineteen names have median relative spread below 0.50 and both-short quote availability above 0.80, but this is a *post-hoc illustrative cut*, not an empirically validated eligibility threshold. Availability of a listed chain does not establish a two-sided executable market.

## Analysis — deliberately separate from Muse measurements

1. The measured 45-DTE far-OTM quote costs are unfavorable for a frequently managed short-volatility construction, especially multi-leg condors. They do **not** yet establish the realized economics of infrequently written, single-leg covered calls held to expiration.
2. A relative spread is not the same as effective dollar execution drag. For a covered-call program measure selling at bid, realistic roll/close costs, expiry frequency, and available net premium. Never treat midpoint as a fill.
3. The analyzer uses model-estimated deltas with fixed `r=0.04` and `q=0.0`; the latter is a material sensitivity for dividend-paying stocks. Recheck delta strike classification, ex-dividend timing, and early-assignment incentives before applying the ranking to dividend ownership.
4. This liquidity ranking does not select equities. Wheelwright is an options decision/evidence system, **not** a stock picker. The ownership universe and diversification policy are external. The 52-week spot range, market capitalization, dividend yield, and 100-share capital quantization are portfolio descriptors and constraints, not inherent buy signals.
5. The target architecture under discussion is *layered*: a $1M **benchmark** income portfolio, $120K moving 12-month Treasury-bill income pipeline (one $10K monthly maturity), ~$500K long-duration illiquid/non-options investment layers, and ~$380K tactical options/equity sleeve. A possible 60/40 SPY / individual-Aristocrats sleeve and roughly nine positions is exploratory. These are not adopted Wheelwright Product semantics or fixed current holdings.
6. The pipeline absorbs timing pressure and preserves the choice to decline an unattractive trade; it does not require minimizing day-to-day trading. **Time is invariant**; capital transitions are event-driven and continuous, with no permanent end state.
7. The tactical portfolio's residual income burden depends on interest and liquidity released by *other* layers. A 45-DTE options-liquidity table by itself cannot project sustainable Treasury-rung replenishment.

## Follow-on falsifiable research

Using the cached chains if available, test calls at target 5/10/15/20 delta and closest-to-45 DTE; bid-side premiums and availability; dividends actually captured; ex-dividend/early-assignment handling; accept-assignment versus roll versus hold-to-expiry; sensitivity to dividend-adjusted deltas; and net portfolio-level total return compared to buy-and-hold and liquid SPY overlays. Use whole 100-share lots and realistic position concentration. Do not retrofit liquidity gates without explicitly marking them as newly chosen policy.

## Boundaries / missing evidence

No observed historical fills or full historical open interest (ThetaData Free restriction). Source has survivorship bias from applying October 2026 membership backward; point-in-time earnings overlap and early assignment were not modeled. Relative spreads are EOD snapshots, not guaranteed intraday executions. The report points to local Muse CSV/Parquet caches, which are **not contained** in the committed Markdown study. Research interpretation is not evidence of a profitable covered-call strategy or a Wheelwright capability.
