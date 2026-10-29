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

## Expected operator usage

Run `ww export tt1-cadence`, attach the ZIP, and say **TT1 Opportunities**. The response is the 20-row ranked table, not a narrative research report.

This accepted experimental reporting experience is a candidate precedent for future Wheelwright Talk; **no Talk/v2 implementation is authorized by this record**.
