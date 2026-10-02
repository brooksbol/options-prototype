#!/usr/bin/env python3
"""Render the operator-facing research list from the audited candidate CSV."""
import csv,json
from pathlib import Path
P=Path(__file__).resolve().parent/'working-candidates-2026-10-02'
rows=list(csv.DictReader((P/'candidate-universe.csv').open()));s=json.loads((P/'summary.json').read_text())
assert len(rows)==s['count']==92
head='''# Iron Condors durable underlying watchlist — working v1

**Principal-sized output:** **92 underlying symbols** (88 ETFs, 4 indexes), ranked within three practical tiers. This is the list to watch routinely for iron-condor opportunities; it is a research candidate input for later Deployment integration, **not a list of today's trades or a mutation of Deployment**. Every ETF here had at least one four-leg displayed-market positive in PR #33 on 2026-10-01. SPXW and XSP passed the complete 2026-10-02 gate. NDXP and RUTW had four usable option legs but lacked a timestamped Tradier index reference, so their `DATA_METHOD_GAP` state is explicit.

## Selection method

1. Begin with the 524 PR #33 ordinary ETF classes and 59 October 2 classes that showed four usable displayed option legs. Keep exact class identity internally and project to one operator symbol. Add **NDX and RUT** as two documented exceptions: their option markets passed the four-leg quote predicate, while Tradier's derived index reference had no trade timestamp. Both are supported index products in [tastytrade's index list](https://tastytrade.com/learn/trading-products/other-products/indices/).
2. Prefer repeated positive PR #33 expirations, tighter displayed half-spread relative to narrower wing, useful 21–100 DTE listing breadth, near-spot strike density, option size/activity, and underlying trading volume. These are **dated descriptive evidence**, not a future trade threshold or fill probability. Exit Reliability v0 is retained verbatim; its fixed two-slot score can favor a thin fund with two positives over a benchmark with one. SPY, QQQ, IWM, DIA and other deep benchmarks are judged on the full evidence vector.
3. Exclude daily leveraged/inverse, single-stock leveraged, volatility futures and distribution-engineered income products from this ordinary neutral-structure watchlist unless a separate product-specific thesis justifies them. Do not mistake their high proxy scores for durable fit. Keep a few distinct crypto, commodity and theme exposures with explicit caveats. The family tag and overlap notes limit redundant S&P, Nasdaq, sector, metals, and crypto choices without imposing artificial equal-family quotas.
4. Favor straightforward exact ETF roots. No adjusted ETF root entered the list. For indexes, prefer **SPXW** under operator symbol **SPX** (PM-settled versus standard SPX AM-settled), **XSP**, **NDXP** under NDX, and **RUTW** under RUT. Cboe and Nasdaq publish the [SPX/SPXW/XSP distinctions](https://www.cboe.com/tradable_products/sp_500/spx_weekly_options/specifications/), [NDXP PM settlement](https://www.nasdaq.com/NDXP-factsheet), and [RUT/RUTW terms](https://www.cboe.com/tradable_products/ftse_russell/russell_2000_index_options/rut_specifications/). Preferred exact roots and alternatives are in the CSV; broker support for the index family is documented, while the exact four-leg bracket workflow still needs Product observation.
5. IV Rank, VIX level, volatility regime, peak volatility, and volatility crush are **current-opportunity** inputs. They did not admit or rank an underlying for this durable list. No row asserts that opening a condor today is attractive.

The 88 selected ETFs include **50 with two** passing PR #33 slots and **38 with one**. All have at least one listed 21–100 DTE four-leg expiration in the frozen geometry archive; **83/88** had best displayed half-spread at most the narrower wing, **57/88** at most half the wing, and **30/88** at most a quarter. **87/88** had at least 100,000 underlying shares of volume in the dated PR #33 quote. These statistics describe the selected evidence, not admission cutoffs. The CSV includes expiration and near-ATM symmetric strike counts, coarse OI/volume, source hashes and exact roots.

## Core names

The **15 CORE** symbols are the strongest default watch anchors: SPY, QQQ, IWM, DIA, TLT, IEF, GLD, SLV, XLF, XLE, XLK, SMH, GDX, SPX and XSP. They cover broad U.S. equity, rates, metals and major liquid sectors. SPX uses SPXW as preferred root; XSP supplies smaller cash-settled sizing. Core membership is durable-universe judgment, not an instruction to open a position in every regime.

## Full working list

`Exit Reliability` is the unchanged PR #33 v0 ETF score; an em dash means no comparable index score. `Spread/wing` is the best dated positive's half-sum of displayed leg spreads divided by its narrower wing. `DTE dates` counts archived exact-root 21–100 DTE four-leg expirations. The CSV contains each row's fuller inclusion basis, activity metrics and source identity.
'''
parts=[head]
for tier,title in [('CORE','Core — routine anchors'),('ESTABLISHED','Established — broad and distinct satellites'),('BREADTH','Breadth — useful but more evidence sensitive')]:
 parts.append(f'\n### {title}\n\n| Rank | Symbol | Type / preferred root | Exit Reliability | Basis | Important caveat |\n| ---: | --- | --- | ---: | --- | --- |')
 for x in rows:
  if x['tier']!=tier:continue
  typ=f"{x['product_type']} / {x['preferred_exact_class_root']}"
  er=x['exit_reliability_v0'] or '—'
  slots=f"{x['pr33_four_leg_positive_slots']}/2 probes" if x['product_type']=='ETF' else '4/4 live legs'
  basis=f"{x['family'].replace('_',' ').lower()}; {slots}; {round(float(x['best_half_spread_sum_over_min_wing'])*100,1):g}% spread/wing; {x['four_leg_expirations_21_100_dte']} DTE dates"
  if x['product_type']=='ETF':basis+=f"; {x['near_atm_min_side_strikes_best_expiry']} strike pairs"
  caveat=x['caveat'] or '—'
  caveat=caveat.replace('|','/')
  parts.append(f"| {x['rank']} | **{x['symbol']}** | {typ} | {er} | {basis} | {caveat} |")
parts.append('''
## Why the larger evidence queue did not become the list

The 583 dated four-leg-positive classes reduce to **90 preferred classes for 90 selected symbols**: 88 PR #33 ETF roots plus SPXW and XSP. The other **493** four-leg-positive classes remain dated evidence, not permanent rejects. NDXP and RUTW bring the operator list to **92 symbols** through their separate raw four-leg positives and explicit reference-method gap; neither is misreported as part of the 583 reported four-leg positives.

The 49 October 2 ETF positives were not carried forward merely to enlarge the list. None had best half-spread/wing at or below 25%, only two were at or below 50%, and only three had positive minimum OI across all four legs in the observed structure. Their source population contains many very new, leveraged or highly concentrated products. Several may improve with time or a different specimen. The 10 October 2 fully qualified index classes are also reduced to operator choices: SPX and SPXW share the SPX operator symbol; XSP adds smaller index sizing; DJX, XEO, SIXI, SPEQX/SPEQW and SPESG remain evidence-backed alternatives with overlap, narrower product use or unconfirmed workflow terms. VIX is excluded from this ordinary neutral watchlist because [its special opening settlement](https://www.cboe.com/tradable-products/vix/vix-options/specifications) needs a different reference and risk method. NDXP/RUTW are retained despite the Tradier reference gap because their exact-root option quotes were usable and their broker/product terms are documented. No fixed-probe failure is treated as permanent illiquidity.

The **first names to review out** when better breadth evidence arrives are: ARKW, REMX, PALL, BUG, XES, MLPX, VXF, VOT, IWO, IWC, BSOL, XHB, HACK, FTEC, EEM, SIVR and IBB. Reasons include one-slot evidence, low volume, comparatively wide displayed markets, sparse near-ATM strikes, narrow product behavior, or overlap with a stronger row. Their explicit caveats appear above and in the CSV. The boundary between roughly 85 and 100 is judgmental; these breadth names are not equivalent in evidence strength to the core.

## Evidence and limits

- PR #33: frozen 2026-10-01 score CSV and 2,529 probe details; hashes in `summary.json` and every CSV row. The existing Exit Reliability values were read only.
- October 2: `../live-market-2026-10-02/audited-results.json`, raw manifest, and provider bodies; per-row CSV provenance refers to the manifest hash. Four-leg quote predicates are displayed-market observations, never complex-order fills.
- Pass −1: frozen exact-root identity and class geometry archive. The best symmetric near-ATM strike-pair count uses the same dated archive and PR #33 reference price; it is listing density, not current OI or executable depth.
- Operational boundary: the operator symbol is the routine watch choice. Preferred class/root controls the index contract family. Actual strike/expiration selection, risk size, current IV/volatility regime, complex-order pricing and broker bracket behavior remain **opportunity and execution checks** before a trade.
''')
(P/'report.md').write_text('\n'.join(parts).rstrip()+'\n')
print('rendered',len(rows),'rows')
