# Iron Condors durable underlying watchlist — working v1

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


### Core — routine anchors

| Rank | Symbol | Type / preferred root | Exit Reliability | Basis | Important caveat |
| ---: | --- | --- | ---: | --- | --- |
| 1 | **SPY** | ETF / SPY | 95.5 | us large; 2/2 probes; 0.2% spread/wing; 8 DTE dates; 76 strike pairs | — |
| 2 | **QQQ** | ETF / QQQ | 45.3 | us nasdaq; 1/2 probes; 1.1% spread/wing; 8 DTE dates; 74 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 3 | **IWM** | ETF / IWM | 83.3 | us small mid; 2/2 probes; 1% spread/wing; 7 DTE dates; 31 strike pairs | — |
| 4 | **DIA** | ETF / DIA | 90.2 | us large; 2/2 probes; 2.9% spread/wing; 7 DTE dates; 51 strike pairs | — |
| 5 | **TLT** | ETF / TLT | 94.7 | treasury rates; 2/2 probes; 1.3% spread/wing; 8 DTE dates; 12 strike pairs | — |
| 6 | **IEF** | ETF / IEF | 82.0 | treasury rates; 2/2 probes; 1.6% spread/wing; 6 DTE dates; 14 strike pairs | — |
| 7 | **GLD** | ETF / GLD | 46.4 | precious metal; 1/2 probes; 2.2% spread/wing; 7 DTE dates; 34 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 8 | **SLV** | ETF / SLV | 87.9 | precious metal; 2/2 probes; 4.8% spread/wing; 7 DTE dates; 11 strike pairs | — |
| 9 | **XLF** | ETF / XLF | 44.5 | us sector; 1/2 probes; 11.8% spread/wing; 7 DTE dates; 10 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 10 | **XLE** | ETF / XLE | 45.1 | energy equity; 1/2 probes; 18.2% spread/wing; 7 DTE dates; 12 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 11 | **XLK** | ETF / XLK | 60.2 | us sector; 2/2 probes; 45.6% spread/wing; 6 DTE dates; 10 strike pairs | — |
| 12 | **SMH** | ETF / SMH | 37.3 | semiconductor tech; 1/2 probes; 16.6% spread/wing; 6 DTE dates; 15 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 13 | **GDX** | ETF / GDX | 68.4 | precious metal; 2/2 probes; 11.8% spread/wing; 6 DTE dates; 10 strike pairs | — |
| 14 | **SPX** | INDEX / SPXW | — | index us; 4/4 live legs; 0.2% spread/wing; 19 DTE dates | Prefer SPXW PM-settled root; SPX AM-settled root remains distinct. Large contract notional; confirm intended tastytrade bracket workflow. SPY exposure overlap; cash-settled index and large notional |
| 15 | **XSP** | INDEX / XSP | — | index us; 4/4 live legs; 0.9% spread/wing; 17 DTE dates | Separate cash-settled Mini-SPX class; confirm intended tastytrade bracket workflow. SPY/SPX exposure overlap; smaller cash-settled index |

### Established — broad and distinct satellites

| Rank | Symbol | Type / preferred root | Exit Reliability | Basis | Important caveat |
| ---: | --- | --- | ---: | --- | --- |
| 16 | **XLI** | ETF / XLI | 35.0 | us sector; 1/2 probes; 22.1% spread/wing; 6 DTE dates; 19 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 17 | **XLU** | ETF / XLU | 41.8 | us sector; 1/2 probes; 21.5% spread/wing; 6 DTE dates; 8 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 18 | **XBI** | ETF / XBI | 58.0 | biotech health; 2/2 probes; 40.1% spread/wing; 6 DTE dates; 18 strike pairs | — |
| 19 | **USO** | ETF / USO | 61.4 | energy commodity; 2/2 probes; 16.1% spread/wing; 6 DTE dates; 17 strike pairs | Commodity futures fund with roll effects; reference is ETF shares. |
| 20 | **UNG** | ETF / UNG | 60.8 | energy commodity; 2/2 probes; 16.5% spread/wing; 5 DTE dates; 2 strike pairs | Natural-gas futures fund with roll effects and large moves. |
| 21 | **MDY** | ETF / MDY | 32.1 | us small mid; 1/2 probes; 26% spread/wing; 2 DTE dates; 13 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 22 | **IJR** | ETF / IJR | 28.2 | us small mid; 1/2 probes; 43.5% spread/wing; 1 DTE dates; 5 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 23 | **IEMG** | ETF / IEMG | 54.0 | international; 2/2 probes; 53.1% spread/wing; 2 DTE dates; 8 strike pairs | — |
| 24 | **VEA** | ETF / VEA | 38.7 | international; 1/2 probes; 75% spread/wing; 2 DTE dates; 7 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 25 | **EWG** | ETF / EWG | 71.7 | international; 2/2 probes; 12.5% spread/wing; 2 DTE dates; 4 strike pairs | — |
| 26 | **EWZ** | ETF / EWZ | 38.8 | international; 1/2 probes; 38% spread/wing; 7 DTE dates; 7 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 27 | **EWT** | ETF / EWT | 54.0 | international; 2/2 probes; 93% spread/wing; 2 DTE dates; 9 strike pairs | — |
| 28 | **EWY** | ETF / EWY | 56.6 | international; 2/2 probes; 83.2% spread/wing; 6 DTE dates; 18 strike pairs | — |
| 29 | **ASHR** | ETF / ASHR | 44.9 | international; 1/2 probes; 15% spread/wing; 6 DTE dates; 7 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 30 | **FEZ** | ETF / FEZ | 40.9 | international; 1/2 probes; 6.9% spread/wing; 5 DTE dates; 11 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 31 | **ILF** | ETF / ILF | 55.7 | international; 2/2 probes; 62.5% spread/wing; 2 DTE dates; 3 strike pairs | — |
| 32 | **KWEB** | ETF / KWEB | 31.8 | international; 1/2 probes; 74.5% spread/wing; 6 DTE dates; 5 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 33 | **VNQ** | ETF / VNQ | 56.9 | us sector; 2/2 probes; 31.7% spread/wing; 2 DTE dates; 8 strike pairs | — |
| 34 | **KRE** | ETF / KRE | 33.7 | us sector; 1/2 probes; 88.8% spread/wing; 7 DTE dates; 12 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 35 | **XOP** | ETF / XOP | 53.8 | energy equity; 2/2 probes; 29.2% spread/wing; 6 DTE dates; 20 strike pairs | — |
| 36 | **IGV** | ETF / IGV | 59.9 | semiconductor tech; 2/2 probes; 32.4% spread/wing; 6 DTE dates; 15 strike pairs | — |
| 37 | **GDXJ** | ETF / GDXJ | 58.3 | precious metal; 2/2 probes; 77.1% spread/wing; 6 DTE dates; 13 strike pairs | GDX miners overlap; junior-miner exposure |
| 38 | **SIL** | ETF / SIL | 58.7 | precious metal; 2/2 probes; 38% spread/wing; 2 DTE dates; 6 strike pairs | — |
| 39 | **IBIT** | ETF / IBIT | 86.6 | crypto asset; 2/2 probes; 2.5% spread/wing; 7 DTE dates; 9 strike pairs | Spot Bitcoin trust; gap and weekend reference risk; neutral structure still needs opportunity gate. |
| 40 | **ETHA** | ETF / ETHA | 77.7 | crypto asset; 2/2 probes; 9.5% spread/wing; 6 DTE dates; 4 strike pairs | Spot Ethereum trust; gap and weekend reference risk; neutral structure still needs opportunity gate. |
| 41 | **VUG** | ETF / VUG | 58.5 | us large; 2/2 probes; 23.8% spread/wing; 2 DTE dates; 11 strike pairs | — |
| 42 | **MTUM** | ETF / MTUM | 55.6 | us large; 2/2 probes; 32.7% spread/wing; 5 DTE dates; 11 strike pairs | — |
| 43 | **SPMO** | ETF / SPMO | 65.6 | us large; 2/2 probes; 17.8% spread/wing; 2 DTE dates; 9 strike pairs | — |
| 44 | **XLY** | ETF / XLY | 37.4 | us sector; 1/2 probes; 38.3% spread/wing; 6 DTE dates; 15 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 45 | **XLP** | ETF / XLP | 27.6 | us sector; 1/2 probes; 65.9% spread/wing; 6 DTE dates; 10 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 46 | **PAVE** | ETF / PAVE | 57.0 | us sector; 2/2 probes; 73.8% spread/wing; 2 DTE dates; 5 strike pairs | — |
| 47 | **URA** | ETF / URA | 59.2 | resource theme; 2/2 probes; 43.8% spread/wing; 6 DTE dates; 8 strike pairs | — |
| 48 | **JETS** | ETF / JETS | 33.4 | us sector; 1/2 probes; 26% spread/wing; 6 DTE dates; 5 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 49 | **ITB** | ETF / ITB | 29.2 | us sector; 1/2 probes; 50.6% spread/wing; 1 DTE dates; 9 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 50 | **CIBR** | ETF / CIBR | 29.7 | semiconductor tech; 1/2 probes; 28% spread/wing; 1 DTE dates; 2 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 51 | **RUT** | INDEX / RUTW | — | index us; 4/4 live legs; 1.3% spread/wing; 7 DTE dates | DATA METHOD GAP: Tradier derived RUT reference lacked trade timestamp; RUT/RUTW four-leg markets were usable. Prefer RUTW PM settlement subject to exact-class workflow confirmation; large index contract granularity. IWM exposure overlap; cash-settled index |
| 52 | **NDX** | INDEX / NDXP | — | index us; 4/4 live legs; 1.9% spread/wing; 18 DTE dates | DATA METHOD GAP: Tradier derived NDX reference lacked trade timestamp; NDX/NDXP four-leg markets were usable. Prefer NDXP PM settlement subject to exact-class workflow confirmation; large index contract granularity. QQQ exposure overlap; cash-settled index |

### Breadth — useful but more evidence sensitive

| Rank | Symbol | Type / preferred root | Exit Reliability | Basis | Important caveat |
| ---: | --- | --- | ---: | --- | --- |
| 53 | **EWW** | ETF / EWW | 33.1 | international; 1/2 probes; 93.3% spread/wing; 2 DTE dates; 7 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 54 | **SILJ** | ETF / SILJ | 44.8 | precious metal; 1/2 probes; 17% spread/wing; 5 DTE dates; 5 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 55 | **REMX** | ETF / REMX | 58.0 | resource theme; 2/2 probes; 28% spread/wing; 2 DTE dates; 1 strike pairs | First to review as better breadth evidence arrives. |
| 56 | **COPX** | ETF / COPX | 29.9 | resource theme; 1/2 probes; 19.5% spread/wing; 6 DTE dates; 9 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 57 | **CPER** | ETF / CPER | 25.5 | resource theme; 1/2 probes; 25% spread/wing; 1 DTE dates; 4 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 58 | **BNO** | ETF / BNO | 30.4 | energy commodity; 1/2 probes; 49.2% spread/wing; 5 DTE dates; 10 strike pairs | Commodity futures fund with roll effects; one passing probe. Only one of two fixed PR #33 expiration slots had four usable legs. |
| 59 | **UGA** | ETF / UGA | 55.5 | energy commodity; 2/2 probes; 68.9% spread/wing; 2 DTE dates; 5 strike pairs | Gasoline futures fund with roll effects and narrower product. |
| 60 | **URNM** | ETF / URNM | 23.7 | resource theme; 1/2 probes; 52.5% spread/wing; 1 DTE dates; 4 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 61 | **TAN** | ETF / TAN | 29.2 | resource theme; 1/2 probes; 43.8% spread/wing; 1 DTE dates; 4 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 62 | **ARKK** | ETF / ARKK | 30.7 | innovation theme; 1/2 probes; 89.2% spread/wing; 6 DTE dates; 14 strike pairs | Concentrated growth theme; one passing probe. Only one of two fixed PR #33 expiration slots had four usable legs. |
| 63 | **ARKG** | ETF / ARKG | 56.6 | biotech health; 2/2 probes; 92.5% spread/wing; 6 DTE dates; 9 strike pairs | — |
| 64 | **ARKQ** | ETF / ARKQ | 55.3 | innovation theme; 2/2 probes; 48.8% spread/wing; 2 DTE dates; 10 strike pairs | — |
| 65 | **ARKW** | ETF / ARKW | 57.3 | innovation theme; 2/2 probes; 76.7% spread/wing; 2 DTE dates; 11 strike pairs | First to review as better breadth evidence arrives. |
| 66 | **DRAM** | ETF / DRAM | 61.6 | semiconductor tech; 2/2 probes; 28.3% spread/wing; 6 DTE dates; 12 strike pairs | Narrow memory theme despite two passing probes. |
| 67 | **CHAT** | ETF / CHAT | 56.4 | semiconductor tech; 2/2 probes; 45% spread/wing; 2 DTE dates; 5 strike pairs | — |
| 68 | **QTUM** | ETF / QTUM | 56.8 | semiconductor tech; 2/2 probes; 40.6% spread/wing; 2 DTE dates; 6 strike pairs | — |
| 69 | **BUG** | ETF / BUG | 57.1 | semiconductor tech; 2/2 probes; 115% spread/wing; 2 DTE dates; 5 strike pairs | First to review as better breadth evidence arrives. |
| 70 | **PALL** | ETF / PALL | 36.6 | precious metal; 1/2 probes; 92.5% spread/wing; 2 DTE dates; 2 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. First to review as better breadth evidence arrives. |
| 71 | **MAGS** | ETF / MAGS | 30.1 | us large; 1/2 probes; 23.1% spread/wing; 6 DTE dates; 12 strike pairs | Concentrated mega-cap basket; one passing probe. Only one of two fixed PR #33 expiration slots had four usable legs. |
| 72 | **VIG** | ETF / VIG | 41.2 | us large; 1/2 probes; 16% spread/wing; 2 DTE dates; 4 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. |
| 73 | **SPHB** | ETF / SPHB | 55.1 | us large; 2/2 probes; 57.9% spread/wing; 2 DTE dates; 6 strike pairs | — |
| 74 | **XES** | ETF / XES | 56.3 | energy equity; 2/2 probes; 103% spread/wing; 2 DTE dates; 6 strike pairs | First to review as better breadth evidence arrives. |
| 75 | **MLPX** | ETF / MLPX | 53.5 | energy equity; 2/2 probes; 120% spread/wing; 2 DTE dates; 7 strike pairs | First to review as better breadth evidence arrives. |
| 76 | **VXF** | ETF / VXF | 36.4 | us small mid; 1/2 probes; 77.2% spread/wing; 2 DTE dates; 5 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. First to review as better breadth evidence arrives. |
| 77 | **VOT** | ETF / VOT | 31.3 | us small mid; 1/2 probes; 54.2% spread/wing; 2 DTE dates; 5 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. First to review as better breadth evidence arrives. |
| 78 | **IWO** | ETF / IWO | 26.9 | us small mid; 1/2 probes; 31.1% spread/wing; 1 DTE dates; 7 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. First to review as better breadth evidence arrives. |
| 79 | **IWC** | ETF / IWC | 36.0 | us small mid; 1/2 probes; 101.9% spread/wing; 2 DTE dates; 10 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. First to review as better breadth evidence arrives. |
| 80 | **BSOL** | ETF / BSOL | 29.9 | crypto asset; 1/2 probes; 35% spread/wing; 1 DTE dates; 1 strike pairs | Single crypto-asset fund; one passing probe and short evidence history. Only one of two fixed PR #33 expiration slots had four usable legs. First to review as better breadth evidence arrives. |
| 81 | **XHB** | ETF / XHB | 37.3 | us sector; 1/2 probes; 102.8% spread/wing; 6 DTE dates; 12 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. ITB homebuilding overlap; alternative basket First to review as better breadth evidence arrives. |
| 82 | **XSD** | ETF / XSD | 55.5 | semiconductor tech; 2/2 probes; 28.2% spread/wing; 2 DTE dates; 10 strike pairs | — |
| 83 | **IYW** | ETF / IYW | 57.0 | us sector; 2/2 probes; 27.3% spread/wing; 2 DTE dates; 5 strike pairs | XLK technology overlap; alternative exposure |
| 84 | **VGT** | ETF / VGT | 60.3 | us sector; 2/2 probes; 20% spread/wing; 2 DTE dates; 20 strike pairs | XLK technology overlap; alternative broad tech fund |
| 85 | **VDE** | ETF / VDE | 56.6 | energy equity; 2/2 probes; 53.1% spread/wing; 2 DTE dates; 6 strike pairs | XLE energy overlap; alternative exposure |
| 86 | **IEO** | ETF / IEO | 55.9 | energy equity; 2/2 probes; 87.5% spread/wing; 2 DTE dates; 7 strike pairs | XOP energy exploration overlap; alternative exposure |
| 87 | **HACK** | ETF / HACK | 56.6 | semiconductor tech; 2/2 probes; 62.1% spread/wing; 2 DTE dates; 10 strike pairs | CIBR cybersecurity overlap; alternative exposure First to review as better breadth evidence arrives. |
| 88 | **FTEC** | ETF / FTEC | 56.1 | us sector; 2/2 probes; 48% spread/wing; 2 DTE dates; 6 strike pairs | XLK technology overlap; alternative exposure First to review as better breadth evidence arrives. |
| 89 | **EEM** | ETF / EEM | 30.0 | international; 1/2 probes; 72.7% spread/wing; 7 DTE dates; 13 strike pairs | Only one of two fixed PR #33 expiration slots had four usable legs. IEMG emerging-market overlap; retained for alternative option market First to review as better breadth evidence arrives. |
| 90 | **QQQM** | ETF / QQQM | 82.8 | us nasdaq; 2/2 probes; 6.2% spread/wing; 2 DTE dates; 6 strike pairs | QQQ overlap; smaller ETF has two passing PR #33 slots |
| 91 | **SIVR** | ETF / SIVR | 56.9 | precious metal; 2/2 probes; 80% spread/wing; 2 DTE dates; 5 strike pairs | SLV silver overlap; alternative trust First to review as better breadth evidence arrives. |
| 92 | **IBB** | ETF / IBB | 54.6 | biotech health; 2/2 probes; 49% spread/wing; 2 DTE dates; 4 strike pairs | XBI biotech overlap; different weighting First to review as better breadth evidence arrives. |

## Why the larger evidence queue did not become the list

The 583 dated four-leg-positive classes reduce to **90 preferred classes for 90 selected symbols**: 88 PR #33 ETF roots plus SPXW and XSP. The other **493** four-leg-positive classes remain dated evidence, not permanent rejects. NDXP and RUTW bring the operator list to **92 symbols** through their separate raw four-leg positives and explicit reference-method gap; neither is misreported as part of the 583 reported four-leg positives.

The 49 October 2 ETF positives were not carried forward merely to enlarge the list. None had best half-spread/wing at or below 25%, only two were at or below 50%, and only three had positive minimum OI across all four legs in the observed structure. Their source population contains many very new, leveraged or highly concentrated products. Several may improve with time or a different specimen. The 10 October 2 fully qualified index classes are also reduced to operator choices: SPX and SPXW share the SPX operator symbol; XSP adds smaller index sizing; DJX, XEO, SIXI, SPEQX/SPEQW and SPESG remain evidence-backed alternatives with overlap, narrower product use or unconfirmed workflow terms. VIX is excluded from this ordinary neutral watchlist because [its special opening settlement](https://www.cboe.com/tradable-products/vix/vix-options/specifications) needs a different reference and risk method. NDXP/RUTW are retained despite the Tradier reference gap because their exact-root option quotes were usable and their broker/product terms are documented. No fixed-probe failure is treated as permanent illiquidity.

The **first names to review out** when better breadth evidence arrives are: ARKW, REMX, PALL, BUG, XES, MLPX, VXF, VOT, IWO, IWC, BSOL, XHB, HACK, FTEC, EEM, SIVR and IBB. Reasons include one-slot evidence, low volume, comparatively wide displayed markets, sparse near-ATM strikes, narrow product behavior, or overlap with a stronger row. Their explicit caveats appear above and in the CSV. The boundary between roughly 85 and 100 is judgmental; these breadth names are not equivalent in evidence strength to the core.

## Evidence and limits

- PR #33: frozen 2026-10-01 score CSV and 2,529 probe details; hashes in `summary.json` and every CSV row. The existing Exit Reliability values were read only.
- October 2: `../live-market-2026-10-02/audited-results.json`, raw manifest, and provider bodies; per-row CSV provenance refers to the manifest hash. Four-leg quote predicates are displayed-market observations, never complex-order fills.
- Pass −1: frozen exact-root identity and class geometry archive. The best symmetric near-ATM strike-pair count uses the same dated archive and PR #33 reference price; it is listing density, not current OI or executable depth.
- Operational boundary: the operator symbol is the routine watch choice. Preferred class/root controls the index contract family. Actual strike/expiration selection, risk size, current IV/volatility regime, complex-order pricing and broker bracket behavior remain **opportunity and execution checks** before a trade.
