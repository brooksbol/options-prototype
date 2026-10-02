# 2026-10-02 regular-session live market qualification

**Research status:** bounded observation on `research/iron-condor-etf-index-ledger`, based on `6c96b30` and accepted-main baseline `4177ee6`. No Deployment, frozen TypeScript table, PR #33 score, or accepted-main mutation. No complex-order fill or production admission is inferred.

## Method and provenance

- Declared U.S. regular market session: **2026-10-02, 14:29:28.138–14:30:15.606 UTC** (10:29:28–10:30:15 ET). Tradier production `/markets/quotes`, 85 bulk GET requests, all HTTP 200. Each request body, UTC times, exact symbols, response hash, and selected provider headers are retained in `capture-manifest.jsonl` and `raw/`.
- Frozen Pass −1 archive hash and per-class raw hashes select exact roots and listed contract strings. PR #33's 1,641 ordinary ETF classes are excluded from new quote requests by the already reconciled cohort join. No score is recalculated.
- Before options quotes, 106 ETF classes with a different OCC class root from the underlying were held for adjustment/deliverable terms. This is a term uncertainty, not structural incompatibility. Forty frozen classes lacked exact-root identity; SMCF lacked a listed four-leg shape on the snapshot.
- For remaining classes, one provider reference quote was requested per underlying. A positive `last` or `close` with matching product type and trade timestamp no more than 60 minutes old was required in the audit. Timestamp-free derived NDX/RUT levels and stale prior-session ETF trades do not satisfy the reference gate. The capture's pre-audit quote observations remain separately preserved.
- The archived exact-root lattice supplied 21–100 DTE candidate expirations. Select nearest to 45 DTE, then 75 DTE; choose put strikes near 95%/90% and call strikes near 105%/110% of the pre-option-quote reference, with ordered wings. Selection used no option spread, OI, volume, or quote quality. A second predeclared expiration was quoted only after the first did not show four usable legs. Lack of a date or price-relative geometry is dated, not permanent.
- Four-leg usability requires the same Tradier bulk response to show exact root, expiration, right and strike for each leg, positive uncrossed bid/ask, positive displayed sizes, and both side timestamps no more than 60 minutes old at response receipt. `audited-results.json` retains per-leg quotes, reasons, expiration, geometry, reference evidence, and request IDs; `audit_live_qualification.py` rehashes every raw body and independently rechecks each reported four-leg positive.

## Funnel (mutually exclusive final states for the 632 newly unprobed classes)

| Stage or outcome | Classes | Meaning |
| --- | ---: | --- |
| Qualification population | 2,273 | 2,128 underlyings; ETF + index ledger |
| PR #33 ordinary ETF quote observations | 1,641 | 524 had at least one four-leg positive; 256 had two; 1,117 had no positive at fixed coordinates |
| Newly unprobed | 632 | 453 OCC-name ETF candidates; 125 other Cboe ETF classes; 54 index classes |
| Frozen identity unresolved | 40 | No exact provider root; no market verdict |
| Frozen listed shape absent | 1 | SMCF dated geometry miss |
| Exact-root/shape first-pass ceiling | 591 | Before term and reference checks |
| Adjusted ETF term unresolved | 106 | Different class root; current deliverable not proven |
| Newly eligible for bounded reference/quote pass | 485 | 591 ceiling less 106 unresolved ETF adjustment terms; 476 distinct underlyings |
| Reference requests | 476 underlyings | One batched reference observation per underlying |
| Reference unavailable in final audit | 96 | 20 no price; 72 stale/future timestamp; 4 no trade timestamp |
| No relevant geometry after current reference | 36 | 35 price-relative wing misses; NANOS no 21–100 DTE date |
| Classes with option markets observed | 424 | Provider returned option markets; 71 of these lack a valid reference |
| Complete gate observations | 353 | Current reference, relevant geometry and usable option response |
| Qualified by this observation | **59** | 49 OCC-name ETF candidates; 10 Cboe index classes |
| Observed, insufficient four-leg evidence | **294** | One or two predeclared structures lacked four usable displayed markets |
| Provider/data unavailable | **0** | All requests succeeded; absent individual quotes are classified in the observed market result |
| Structurally incompatible proven | **0** | No permanent structural veto established |

The exclusive final-state sum is **40 identity unresolved + 106 term unevaluable + 96 reference unavailable + 37 dated geometry unavailable (including SMCF) + 294 insufficient + 59 qualified = 632**. One observation at these coordinates cannot permanently reject any of the 294. The 72 stale/future references include quiet ETFs with a positive but old `last`; they are missing current reference evidence, not bad options markets. Five classes had four usable option quotes but failed the reference audit (FDRS, NDX, NDXP, RUT, RUTW). The option-leg evidence stays available for follow-up.

The 59 four-leg positives span a wide displayed-cost range. Among them, **7** had half the sum of four displayed spreads no greater than 25% of the narrower wing and minimum displayed size at least one; **12** met 50%; **20** met 100%. These are descriptive bands, not adopted cutoffs or execution estimates. Full nine-band counts are in `summary.json`.

## Exact index classes

OCC class identity is retained. The archived OCC names and Cboe product records establish the index cohort; the live quote response establishes market evidence only for the exact probed contracts. `SPX` is the standard AM-settled root, `SPXW` the PM-settled weekly root, and `XSP` a separately scaled PM-settled Mini-SPX class per [Cboe's comparison](https://www.cboe.com/tradable_products/sp_500/spx_weekly_options/specifications). `SPX9` remains unresolved. Cboe lists [NANOS with a $1 multiplier and short dated expirations](https://www.cboe.com/tradable_products/sp_500/nanos_index_options/specifications); its absence from this 21–100 DTE geometry window is expected, not incompatibility. [VIX/VIXW settle from a special opening quotation](https://www.cboe.com/tradable-products/vix/vix-options/specifications), so spot VIX is an incomplete economic reference for a representative risk comparison even when four option quotes are displayed. Other index multiplier/settlement and broker workflow terms still need exact-class confirmation before an Exit Reliability comparison.

| Underlying | Exact class | Outcome | Expiration quoted (usable legs) | Specific reason |
| --- | --- | --- | --- | --- |
| CBTX | CBTX | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| CBTX | CBTXW | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| DJX | DJX | four usable legs | 2026-11-20 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| DJX | DJX9 | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| DJX | DJXW | observed, insufficient | 2026-11-30 (1/4); 2026-10-30 (0/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| MBTX | MBTX | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| MBTX | MBTXW | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| MGTN | MGTN | reference unavailable | — | NO_PRICE |
| MGTN | MGTNW | reference unavailable | — | NO_PRICE |
| MRUT | MRUT | reference unavailable | — | NO_PRICE |
| NANOS | NANOS | no relevant geometry | — | NO_21_TO_100_DTE_FOUR_LEG_EXPIRATION |
| NDX | NDX | reference unavailable | 2026-11-20 (4/4) | NO_TRADE_TIMESTAMP |
| NDX | NDXP | reference unavailable | 2026-11-13 (4/4) | NO_TRADE_TIMESTAMP |
| OEX | OEX | observed, insufficient | 2026-11-13 (3/4); 2026-12-18 (3/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| RLV | RLV | reference unavailable | — | NO_PRICE |
| RUI | RUI | reference unavailable | — | NO_PRICE |
| RUT | RUT | reference unavailable | 2026-11-20 (4/4) | NO_TRADE_TIMESTAMP |
| RUT | RUT9 | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| RUT | RUTW | reference unavailable | 2026-11-13 (4/4) | NO_TRADE_TIMESTAMP |
| SIXB | SIXB | observed, insufficient | 2026-11-20 (2/4); 2026-12-18 (2/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| SIXI | SIXI | four usable legs | 2026-11-20 (2/4); 2026-12-18 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| SIXM | SIXM | observed, insufficient | 2026-11-20 (0/4); 2026-12-18 (0/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| SIXRE | SIXRE | observed, insufficient | 2026-11-20 (0/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| SIXU | SIXU | observed, insufficient | 2026-11-20 (0/4); 2026-12-18 (2/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| SIXV | SIXV | observed, insufficient | 2026-11-20 (2/4); 2026-12-18 (2/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| SPEQX | SPEQW | four usable legs | 2026-11-30 (3/4); 2026-12-31 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| SPEQX | SPEQX | four usable legs | 2026-11-20 (3/4); 2026-12-18 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| SPESG | SPESG | four usable legs | 2026-11-20 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| SPX | SPX | four usable legs | 2026-11-20 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| SPX | SPX9 | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| SPX | SPXW | four usable legs | 2026-11-13 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| VIX | VIX | four usable legs | 2026-11-18 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| VIX | VIXW | observed, insufficient | 2026-11-04 (2/4); 2026-10-28 (3/4) | ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT |
| XEO | XEO | four usable legs | 2026-11-13 (3/4); 2026-12-18 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| XND | XND | reference unavailable | — | NO_PRICE |
| XSP | XSP | four usable legs | 2026-11-13 (4/4) | FOUR_USABLE_DISPLAYED_LEG_MARKETS |
| BKX | BKX | reference unavailable | — | NO_PRICE |
| BKX | BKXPM | reference unavailable | — | NO_PRICE |
| HGX | HGX | reference unavailable | — | NO_PRICE |
| MXACW | MXACW | reference unavailable | — | NO_PRICE |
| MXEA | MXEA | reference unavailable | — | NO_PRICE |
| MXEF | MXEF | reference unavailable | — | NO_PRICE |
| MXUSA | MXUSA | reference unavailable | — | NO_PRICE |
| MXWLD | MXWLD | reference unavailable | — | NO_PRICE |
| OSX | OSX | reference unavailable | — | NO_PRICE |
| OSX | OSXPM | reference unavailable | — | NO_PRICE |
| RLG | RLG | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| SIXC | SIXC | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| SIXE | SIXE | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| SIXR | SIXR | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| SIXT | SIXT | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| SIXY | SIXY | identity unresolved | — | FROZEN_EXACT_ROOT_UNRESOLVED |
| UTY | UTY | reference unavailable | — | NO_PRICE |
| XAU | XAU | reference unavailable | — | NO_PRICE |

## Next evidence boundary

**583 distinct exact classes** now have a dated four-leg displayed-market positive across the two separate sessions: 524 ordinary ETF classes from PR #33 and 59 new classes here. This union is a **market-evidence queue for representative-position and contract-term qualification**, not a finished Iron Condors list. The 1,641 existing ETF Exit Reliability scores remain reusable dated evidence. The 49 new ETF and 10 index positives warrant selective representative-structure work; VIX needs forward/settlement-aware reference handling, and all index classes need class-specific term and broker-workflow checks before comparable Exit Reliability capture. The 5 raw four-leg positives with unavailable reference deserve a cheap reference repair. The 294 fixed-coordinate insufficiencies remain discoverable, not permanently rejected. Broad Exit Reliability capture is not justified yet.
