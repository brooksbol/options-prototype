# TT1 Opportunities — daily trade-selection report

**Invocation name:** `TT1 Opportunities`
**Status:** Principal-accepted presentation / bounded TT1 experimental workflow, October 29, 2026. This is a report contract, not an automated trading policy, approval, or order authority.
**Input:** latest attached `ww export tt1-cadence` ZIP containing market-and-verticals, evidence coverage, v1 liquidity CSV, positions/orders and account BP.

## Cold-start behavior

On **TT1 Opportunities** (case-insensitive), optionally preceded by “bootstrap,” read this report specification and analyze the **latest attached TT1 ZIP**. If absent, request the ZIP; never recycle a historical shortlist as today's market. No preliminary generic portfolio report. No duplication of the TT1 Positions dashboard.

## Presentation contract

Render **TT1 — Trade Opportunities**, with session date and compact scope `38–45 DTE · short put credit spreads`. Show **20 genuinely computed, ranked candidates** if supported by evidence; fewer only when fewer are supported, stating the actual count. Do not invent rows to make 20.

One dense, scannable table:

| Rank | Symbol | DTE | Short / long | Δ | Credit | BP | P50 | Profit | Profit / BP | Status |
|---:|---|---:|---|---:|---:|---:|---:|---:|---:|---|

- Rank: comparative order based on actual economics, execution quality and portfolio concentration; do not present simple profit/BP sorting as a validated expected-value model.
- Symbol, DTE, strikes: actual observed same-expiry put contracts, short strike higher than protective long strike.
- Δ: signed **short-put** delta.
- Credit: indicative midpoint credit in dollar units for one spread; compare natural credit in analysis and reject nonsensical/non-positive-natural-credit cases as immediately viable candidates.
- BP: incremental broker dry-run BP when available, otherwise clearly distinguished **estimated** theoretical defined-risk BP from midpoint credit. Do not call a proxy broker-reported; do not subtract held BP from available BP.
- P50: broker's modeled probability when verified; otherwise `—`. Do not mistake a 50%-profit closing target for P50 probability or estimate P50 from delta.
- Profit: gross 50%-of-credit target in dollars, based on stated indicative opening credit assumption.
- Profit / BP: target profit divided by the applicable BP denominator, with BP provenance indicated compactly.
- Status: compact evidence qualifier such as `Qualified`, `Stale` or `Inadmissible`, grounded in acquisition/source admissibility. **Never label a hypothetical leg-derived combo 'executable' or 'ready' without broker execution evidence.**
- A compact portfolio-exposure distinction can be shown in the ordering/status or terse note; avoid ranking all broad-equity exposure as independent risk.

**No logos, stock photography, candidate essays, repeated disclaimers, additional tables, or extensive closing interpretation.** After the table, at most one concise line naming the top candidate, runner-up and WAIT if appropriate. Keep the tactical numbers prominent.

## Calculation and evidence coverage

- Default screening: expiration 38–45 calendar DTE measured from the NY session date, preference near 45; short put absolute delta ~0.20–0.30 as *provisional screening*, not immutable eligibility. Compare adjacent short strikes where retained contract evidence allows.
- Enumerate every valid observed same-expiry lower-strike long put, no preset width menu or hard maximum width. Do not restrict long-put delta.
- Evaluate all relevant observed contracts, not just previously selected vertical-pair rows, if the export carries adjacent contracts. Report source coverage limitations rather than guessing missing strikes.
- Calculate natural credit = short bid − long ask; midpoint credit = short mid − long mid; theoretical max loss = (strike width − opening credit) × verified multiplier (or qualified 100-share assumption). Preserve fees/terms qualifications in source metadata, not boilerplate.
- Current account BP, held group BP, working orders and existing correlated exposures inform ranking. $250 BP is an illustrative planning benchmark, **not** a fixed target, maximum or minimum. One new entry per session at most; WAIT acceptable.
- After hours and weekends: preserve constructed candidates and annotate source admissibility; do not discard evidence merely for being outside trading hours. Distinguish test-only from currently actionable. Never claim refreshed quotes just because a ZIP is newly generated.
- The ZIP may contain far fewer source-admissible than constructed pairs; show real counts when useful, and do not invent 20 qualified rows. Favor actual candidate diversity over filling the table with nearly identical widths of one symbol.
- Trading is operator-controlled in Tastytrade, with live verification/screenshots as needed. This report must not issue trades, change orders, or represent midpoint economics as confirmed fills.

## October 30 execution-learning checkpoint — operator-observed, not ratified eligibility policy

The Principal's live Tastytrade verification established that a candidate can have appealing midpoint Profit/BP and modeled P50 yet fail to fill. Preserve the following operational evidence when building subsequent shortlists:

- **Independent Greek freshness:** GLD 357 and IBIT 43 were selected from previous-day Greeks despite fresh chain receipts. The October 30 corrected exporter collects independently timestamped DXLink Greeks and qualifies short-put delta separately from spot/quote/chain receipt. Use those independent clocks, not merely the ZIP creation time or v1 liquidity CSV's chain-age column; exclude or qualify stale/missing short Greeks for current-session selection.
- **Execution quality before midpoint yield:** USO 153/148 ($2.19 displayed midpoint credit) was submitted but did not fill and was canceled. Extremely wide leg markets can inflate midpoint-derived Profit/BP. Compare natural versus midpoint credit and quoted leg widths; retain broker fill/no-fill feedback as evidence, not a universal guarantee.
- **Both-leg liquidity:** TLT 79.5/76.5 did not fill; the long put showed zero OI. IBIT 41/38 had short/long OI 1/0. Neither proves causality or means zero OI universally prevents fills, especially for new weeklies. Nonetheless display **OI S/L** and **Vol S/L** in the tactical table when observed, flag zeros and missing values distinctly (BUG-055: normalized missing OI may be coerced to zero), and prioritize better-supported quoted markets rather than selecting solely by Profit/BP. Do not invent a hard minimum OI rule without a separate decision.
- **Breadth:** A 20-row shortlist concentrated into just three symbols did not meet the Principal's discovery intent. Rank promising underlyings first, then show one or two distinct constructions per symbol by default, expanding only when real alternatives justify it. Do not pad to 20 or pretend underlying diversity is equivalent to uncorrelated exposure.
- **Confirmed pricing specimen:** On October 30, IWM Dec 11 268/265 opened by selling the 268 put at $3.71 and buying the 265 put at $3.13; actual opening credit **$0.58 / $58** (broker order #520298010, two fills at 12:22:03 PM EDT). This was close to the earlier indicative $57.50 midpoint and is **one positive fill observation**, not evidence that other spreads' midpoint prices are fillable. At that fill, theoretical maximum loss $242 and 50%-profit target $29, BTC target $0.29 if using exact half-credit; 21-DTE date November 20. Working closing orders are not confirmed by the notification.
- **No additional same-session entry assumption:** Account for the newly filled IWM spread when considering further entries; distinguish historical completed attempts, submitted/canceled tickets and actual fills. Never claim an order is working merely from a screenshot or fill notification.

### Updated dense report presentation

For the **TT1 Opportunities** table, retain the established Rank, Symbol, DTE, Short / long, Δ, Credit, BP, P50, Profit, Profit / BP and Status concepts, and **include compact OI S/L and Vol S/L columns** (both legs). If the Principal asks to sort by Profit/BP descending, actually sort numerically; preserve prior filters and candidate exclusions across follow-up requests unless explicitly changed. Cap default output at 20 real candidates with broader underlying coverage. Do not introduce multiple tables or verbose trading commentary.

P50 Profit/BP always means **half of the opening credit divided by BP**, **not** maximum profit/BP and **not** probability-weighted profit/BP. Treat quoted midpoint, real fill, and broker dry-run BP as different evidence classes.

**Standing:** Accepted report-presentation refinements plus observed experimental lessons. These are not a ratified trading strategy, fixed liquidity policy, order submission authority, or authorization to alter v1/v2/Talk code.

## Expected operator usage

Run `ww export tt1-cadence`, attach the ZIP, and say **TT1 Opportunities**. The response is the 20-row ranked table, not a narrative research report.

This accepted experimental reporting experience is a candidate precedent for future Wheelwright Talk; **no Talk/v2 implementation is authorized by this record**.
