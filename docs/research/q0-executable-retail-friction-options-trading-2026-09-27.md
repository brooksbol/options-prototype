# Q0 — Executable Retail Friction for Options Trading
## Instrument × Order Type × Size × DTE × Period Matrix (Primary-Evidence Calibration)

**Assignment:** What is executable retail friction for options trading, represented as an instrument × order type × size × DTE × period matrix?
**Date:** 2026-09-27. **Author:** Q0 synthesis (eight independent research tracks A–H, integrated 2026-09-27).
**Method:** primary-source inspection only; truth-status taxonomy (VERIFIED / IDENTIFIED-TRACEABLE / INFERENCE / ABSENCE-OF-EVIDENCE / CONTRADICTED). No backtests run, no parameters optimized, no trades recommended, no brokers ranked, no numbers invented. Empty cells are reported, not filled.

**Stop conditions honored:** no later-strategy backtest; no DTE/delta/profit-target/exit optimization; no parameter search for profitability; no options-strategy or trade recommendations; no broker ranking; no software/product requirements; no application architecture; no invented fill probabilities or friction parameters; no silent SPY→SPX, 0DTE→30–45-DTE, or simple→complex transfers.

---

## 1. Executive verdict

The Q0 matrix is **sparse, not scalable**. A truthful calibration yields a handful of directly populated cells and a large, explicitly enumerated set of empty ones. The single highest-priority cell — primary empirical evidence for the effective spread (or equivalent realized execution cost) experienced by retail customers trading **SPX options** — is **partially filled, but not where the downstream work needs it**:

- **Filled:** retail-proxy (Cboe AIM price-improvement-auction identified, ≤10 contracts) effective spread for SPX **0DTE only**, February 2021–September 2023 — calls 6.0%, puts 5.0% (Beckmeyer, Branger & Gayda 2023, **VERIFIED**).
- **Empty:** retail SPX effective spread at 1–45 DTE, specifically the 30–60 DTE band; package-level complex-order execution; observed marketable vs passive order outcomes; opening vs closing; post-September 2023; >10 contracts.

Three consequences follow for any later use of this work:

1. **The spread leg cannot be empirically calibrated from primary evidence at 30–45 DTE.** It can only be *bounded* (see the fill-model ladder, §22). Borrowing the 0DTE number, the SPY number, or a single-name number into a 30–45 DTE SPX cell is unsupported — three dedicated transfer audits (§§19–21) close those doors with named structural reasons.
2. **The explicit-fee leg CAN be calibrated** from dated primary schedules: the Cboe customer fee stack for SPX/SPXW (Sept 15, 2026 schedule), broker pass-through tables, and the 2026 regulatory fee chain (Section 31, TAF, ORF, OCC, CAT) are ledgered with effective dates in §5 and §15–16. Fees are regressive in premium and dominate the all-in bill for cheap contracts.
3. **Broker and order type are first-order friction dimensions**, comparable to or larger than contract-characteristic variation: identical one-contract market calls show round-trip execution costs from ≈0 to ~700 bps across six brokers (Huang, Jorion & Schwarz 2024, **VERIFIED**); retail market orders pay ≈2.44% true effective spread while executed limit orders earn ≈−1.01% conditional on a ≈30% fill rate (Barardehi et al., **VERIFIED** as working-paper findings). Any scalar that ignores broker and order type is contradicted by inspected evidence.

## 2. Q0 answer

**The executable-retail-friction matrix, as of 2026-09-27, from directly inspected primary sources:**

The matrix is populated only at isolated coordinates. Population map (each number source-native; do not pool across rows):

| # | Cell (instrument × order type × size × DTE × period) | Metric (source-native) | Value | Evidence state |
|---|---|---|---|---|
| M1 | SPX, auction-identified retail proxy, ≤10 contracts, **0DTE**, Feb 2021–Sep 2023 | Relative effective spread (2×\|price−mid\|/mid) | Calls **6.0%**; puts **5.0%**; quoted 11.8%/10.5% | **VERIFIED** (Beckmeyer et al.) |
| M2 | Same cell, size split | Relative effective spread | 1 ct: **5.4%**; 2–5: **5.7%**; 6–10: **7.4%** | **VERIFIED** |
| M3 | Same cell, direction split | Relative effective spread | Buys **8.4%**; sells **5.2%** | **VERIFIED** |
| M4 | Same cell, time-to-expiry split | Relative effective spread | ≤1h: **10.5%**; 1–3h: **5.9%**; 3–24h: **4.5%** | **VERIFIED** |
| M5 | Same cell, moneyness | Relative effective spread | ATM calls **3.0%** / puts **2.7%**; deep-OTM % spreads explode as premium denominator collapses | **VERIFIED** |
| M6 | Retail (single-name + ETF, 18 liquid symbols), one-contract call **market** orders, 1–7 DTE, Mar–Jun 2024 | Round-trip execution cost vs midpoint | All-broker avg **392 bps**; broker range ≈ **0–700 bps** (Vanguard −28; Robinhood 678) | **VERIFIED** (Huang et al.) |
| M7 | Same cell | Price improvement (vs NBBO) | 7%–52% of NBBO across brokers; 26¢–207¢/contract; 13.9%–71.7% of trades improved | **VERIFIED** |
| M8 | Retail options (journal sample), all order types, 2020–2022 | True effective spread (verified direction, NBBO adjusted) | Market orders **2.44% avg / 1.33% median**; limit orders **−1.01% avg / −0.68% median** (executed only); quoted 3.62%; conventional effective 2.59% | **VERIFIED** (Barardehi et al., Nov 2025 draft; working paper) |
| M9 | Retail proxy (SLIM), equity + ETF options, Nov 2019–Jun 2021 | Relative effective spread | All: **6.7%** (quoted 13.7%); ETF pooled 4.4% (quoted 8.4%); non-ETF 7.2% (quoted 14.9%) | **VERIFIED** (Bryzgalova et al., JF 2023) |
| M10 | Same cell, DTE marginals | Relative effective spread | <1wk **6.6%**; 1–2wk **6.0%**; 2–4wk **7.1%**; 1–3mo **6.2%**; 3–12mo **7.8%**; >1yr **9.3%** | **VERIFIED** |
| M11 | Same cell, size marginals | Relative effective spread | 1 ct **6.4%**; 2–5 **6.2%**; 6–10 **7.3%**; 11–100 **8.4%**; >100 **11.9%**; dollar <$250 **11.6%** | **VERIFIED** |
| M12 | Single-leg S&P 500-constituent options, Aug–Dec 2020 | Auction price improvement | PI ≈ **67% of quoted spread**; E/Q 0.38 auctions vs 0.74 LOB; <10% of auctions have >1 bidder | **VERIFIED** (Hendershott et al., working paper) |
| M13 | Highly liquid equity options, Apr 2003–Oct 2006 | Conventional vs timing-adjusted effective spread | Conventional 6.2¢; adjusted ≈67% of conventional for all trades, ≈21% for timing trades | **VERIFIED** (Muravyev & Pearson 2015 WP; published RFS 2020) |
| M14 | SPX/SPXW, ETF options — explicit exchange + regulatory fees | Per-contract fees | See §5 fee matrix; e.g., SPX customer $0.36/$0.45 + $0.21/$0.14 surcharges (Cboe, Sep 2026) | **VERIFIED** (schedules) |
| M15 | Retail options — broker commissions | Per-contract charges | $0 base since Oct 2019; $0.65/ct typical; index-option pass-throughs $0.18–$0.75/ct | **VERIFIED/IDENTIFIED-TRACEABLE** (broker schedules) |

**Everything not in this table is empty.** Specifically: no cell at 30–45 DTE retail SPX; no package-level complex-order cell; no midpoint limit-order fill probability; no current-2026 spread cell for any instrument; no retail limit-order price-improvement series; no time-of-day cost curve.

## 3. SPX retail-effective-spread verdict

**B. PRIMARY EMPIRICAL CELL PARTIALLY FILLED.**

The bounded finding: retail-proxy effective spreads for **SPX 0DTE** (Cboe AIM price-improvement-auction identified, ≤10 contracts, Feb 2021–Sep 2023): calls 6.0%, puts 5.0%; strongly conditional on size (5.4%→7.4%), direction (buys 8.4% vs sells 5.2%), time remaining (10.5% ≤1h), and moneyness (ATM 3.0%/2.7%). Identification is mechanism-based (OPRA SLAN/MLAT auction codes), not merely small-size inference. The sample is AIM-conditional and likely selects executions receiving price improvement; commissions and explicit fees are excluded; multileg observations are averaged leg spreads, not package friction.

**The 30–60 DTE cell — the one the downstream 45/50/21 work would need — is entirely empty.** No inspected primary source measures retail SPX execution at 1–45 DTE. The 0DTE estimate must not be transferred to 30–45 DTE (see §20).

## 4. Friction matrix

Source-native matrices only. Rows are not comparable across studies (different formulas, identification, periods); the matrix is presented as cells with their native metric, not as a pooled estimate.

### 4.1 Retail-proxy SPX (Beckmeyer, Branger & Gayda 2023; 0DTE; Feb 2021–Sep 2023) — VERIFIED

Relative effective spread `ES = 2 × |TradePrice − Midpoint| / Midpoint`, auction-identified retail (SLAN/MLAT), ≤10 contracts.

| Side | Contracts | Quoted spread | Effective spread |
|---|---|---|---|
| Calls | 5.4% (1 ct) / 5.7% (2–5) / 7.4% (6–10) | 11.8% | **6.0%** |
| Puts | same size gradient | 10.5% | **5.0%** |
| Buys | — | — | **8.4%** |
| Sells | — | — | **5.2%** |
| Midpoint-prints | — | — | 0% (by construction) |
| ≤1h to expiry | — | 19.0% | **10.5%** |
| 1–3h | — | 11.4% | **5.9%** |
| 3–24h | — | 9.6% | **4.5%** |
| ATM calls / puts | — | — | **3.0% / 2.7%** |

74.2% of identified orders were one contract. Commissions/fees excluded.

### 4.2 Controlled cross-broker experiment (Huang, Jorion & Schwarz, Nov 2024; 6,926 one-contract call market orders; 18 liquid symbols; Mar–Jun 2024) — VERIFIED

| Broker | % trades improved | Mean PI (% NBBO) | Mean PI (¢/contract) | Round-trip cost (bps) |
|---|---|---|---|---|
| Vanguard | 71.7 | 51.5 | 207.99 | −28 |
| Fidelity | 65.1 | 40.5 | 169.39 | 179 |
| Schwab | 60.8 | 33.2 | 135.48 | 275 |
| TD Ameritrade | 35.2 | 19.0 | 73.44 | 415 |
| E*Trade | 34.4 | 18.8 | 61.51 | 590 |
| Robinhood | 13.9 | 7.2 | 26.50 | 678 |
| All brokers | 44.6 | 26.8 | 107.87 | 392 |

Avg option price ≈$1.00; avg spread $0.04. Mechanism: ~50% of orders via PIM auctions (auction PI 45% vs autoexecution 5.6%); broker fixed effects explain 16.5% of PI variation; PI–PFOF correlation ≈ −0.90/−0.91 (correlation, not established causality). Lee–Ready mis-signs 22% of these trades; Lee–Ready-estimated PI% = 7% vs actual 27%.

### 4.3 Retail journal sample, all order types (Barardehi, Bogousslavsky & Muravyev; 451,299 trades; 2020–2022; SPX excluded) — VERIFIED (working paper, Nov 17 2025 draft)

| Measure | Mean | Median |
|---|---|---|
| Quoted spread | 3.62% | 1.91% |
| Conventional effective spread | 2.59% | 1.38% |
| True effective spread | **1.07%** | 0.66% |
| Market orders (inferred) | **2.44%** | 1.33% |
| Limit orders (executed only) | **−1.01%** | −0.68% |

30.25% of retail effective spreads are negative. 67.6% of market orders execute at NBBO. Limit fill rate ≈30% estimated from Form 606; opportunity cost of non-fills unobserved. 0DTE flag: +0.67pp effective spread (regression coefficient, mixed order-type sample).

### 4.4 Retail proxy SLIM (Bryzgalova, Pavlova & Sikorskaya, JF 2023; Nov 2019–Jun 2021; equity + ETF) — VERIFIED

Quoted / effective, frequency-weighted. Full marginals in §3 of the track file; headline cuts: all 13.7%/6.7%; DTE <1wk 12.6%/6.6%, 1–3mo 14.0%/6.2%; 1 contract 13.9%/6.4%; dollar <$250 23.5%/11.6%; ETF 8.4%/4.4% vs non-ETF 14.9%/7.2%; >$20k notional effective > quoted (author retail-cutoff judgment: institutional contamination). Multileg MLIM table (different population/mechanism): DTE <1wk 23.2%/12.7%; 1–3mo 10.3%/3.2%.

### 4.5 Auction vs LOB (Hendershott, Khan & Riordan, May 2024; S&P 500 single-names; Aug–Dec 2020) — VERIFIED (working paper)

Auctions >20% of volume; auction PI ≈67% of quoted spread (saving >$47M/day); quoted 11.75¢ vs LOB 10.07¢; PI 7.62¢ vs 2.2¢; E/Q 0.38 vs 0.74; MM revenue negative on average in auctions, large positive in LOB; <10% of auctions have >1 bidder at winning price.

### 4.6 Empty rows (explicit)

SPX retail at 1–45 DTE (all metrics); retail SPX >10 contracts; current (post-2023) SPX; package-level complex orders (any instrument); observed passive-limit fill and opportunity cost; time-of-day cost curves; midpoint limit-order fill probability; SPY/QQQ/IWM spreads by order type × size × DTE (all empty — see §8).

## 5. Explicit-fee matrix

Dated, per contract unless noted. Evidence state per row. "Retail pass-through" = UNKNOWN wherever the fee bills a member/clearing firm and no broker source states the customer treatment.

### 5.1 Cboe Options (C1) customer fees — Fees Schedule dated 2026-09-15 (VERIFIED, full schedule read)

| Instrument | Customer transaction fee | Customer surcharges |
|---|---|---|
| Equity options | $0.00 | — |
| ETF/ETN options | $0.00 | — |
| **SPX (incl. SPXW)** | **$0.36** (premium $0.00–$0.10); **$0.45** ($0.11+) | **Execution surcharge $0.21** (SPX) / **$0.14** (SPXW, electronic); AIM Agency/Primary $0.10; AIM Hybrid originator $0.10; AIM response $0.05; AIM contra $0.10 (floor-inoperable sessions) |
| RUT | $0.30 (sector-index row); $0.18 in List A customer row — schedule conflict unresolved | — |
| VIX | $0.10–$0.45 by premium | — |
| NANOS | $0.00 | — |

Index license surcharge $0.20 (SPX) lists capacities F J L M B N U — **customer applicability unresolved**; LEAPS and $0.12 complex surcharges do not apply to customers per printed capacities.

### 5.2 Broker commissions and SPX pass-throughs

| Broker | Equity/ETF options | Index options | Exercise/assignment | Evidence state |
|---|---|---|---|---|
| tastytrade | $1 open / $0 close + $0.10 clearing; $10/leg cap | $1 open + $0.10 clearing + single-listed pass-through: **SPX $0.60**; RUT $0.18; VIX $0.35 | $0.02/contract | **VERIFIED** (schedule read 2026-09-27, stamped Jul 30 2026) |
| Fidelity | $0 + $0.65/contract; buy-to-close ≤$0.65 free | Additional "Options Fee" for proprietary index options | $0 | **VERIFIED** (BrokerageLink schedule PDF) |
| Schwab | $0 + $0.65/contract; BTC ≤$0.05 waived | — | $0 | IDENTIFIED-TRACEABLE |
| E*TRADE | $0 + $0.65/contract ($0.50 active); Dime Buyback (≤$0.10 closes free) | — | $0 | IDENTIFIED-TRACEABLE |
| Robinhood | $0 / $0 | **$0.50/contract** ($0.35 Gold) + tiered SPX pass-through **$0.57/$0.66**; SPXW $0.50/$0.59 | — | IDENTIFIED-TRACEABLE |
| Webull | $0 / $0 | **$0.50/contract** | — | IDENTIFIED-TRACEABLE |
| IBKR Lite/Pro | $0.65 Lite; Pro tiered $0.25–$0.65 | — | $0 | IDENTIFIED-TRACEABLE |

### 5.3 Regulatory/exchange pass-through chain (2026)

| Fee | Amount | Side | Effective | Evidence state |
|---|---|---|---|---|
| FINRA TAF (option sells) | **$0.00329/contract** | Sell only | Jan 1, 2026; **$0.00 pause for Oct–Dec 2026 transactions** (SR-FINRA-2026-021); normal rates resume 2027 | VERIFIED as broker pass-through (three broker schedules); FINRA pause IDENTIFIED-TRACEABLE |
| SEC Section 31 | **$20.60 per $1M of sales** | Sell only | Charge dates on/after 2026-04-04 ($0.00 for 2025-05-13–2026-04-03) | IDENTIFIED-TRACEABLE (SEC advisory + OCC memo) |
| Options Regulatory Fee (ORF) | **$0.0013–$0.0240/contract/side by venue** (e.g., Cboe C1 $0.01248 from 2026-08-13; MIAX Pearl $0.0240; BOX $0.0220) | Both | Per-exchange regime from **2026-07-01** (assessed on executions at that venue; multi-venue executions stack multiple ORFs) | VERIFIED for C1 (filing read); other venues IDENTIFIED-TRACEABLE |
| OCC clearing fee | **$0.025/contract** | Both | 2026-01-01 (raised from $0.02; $55/trade cap removed); $0.00 holiday Dec 1–31, 2025 | IDENTIFIED-TRACEABLE |
| CAT fee | $0.0003/contract | — | 2026 | IDENTIFIED-TRACEABLE (US rendering) |

**Worked fee arithmetic (INFERENCE, arithmetic on verified inputs):** SPXW buyer-open, premium $0.50 ($50): C1 fee $0.45 + execution surcharge $0.14 + ORF $0.01248 + OCC $0.025 = **$0.6275 ≈ 1.26% of premium** per side, before any broker commission or spread. At premium $0.10: ≈6.1%; at $0.05: ≈12.2%. Fees are regressive in premium and dominate precisely the cheap, short-DTE contracts.

## 6. Measurement glossary

Source-native definitions preserved; do not mix without showing the transformation.

| Metric | Definition | Source |
|---|---|---|
| Relative quoted spread | (best ask − best bid) / midpoint | Bryzgalova et al. |
| Relative effective spread | 2 × \|trade price − midpoint\| / midpoint; direction inferred vs midpoint | Bryzgalova et al.; Beckmeyer et al. |
| Half effective spread | D × (p − m), D = signed direction | Hendershott et al. Eq. 1 |
| Price improvement (Hendershott) | QS − ES = trade price vs relevant best quote | Hendershott et al. Eq. 2 |
| Price improvement (Huang) | PI_buy = NBO − P; PI_sell = P − NBB; PI% = PI / NBBO spread; E/Q = ES / NBBO spread | Huang et al. Eqs. 1–4 |
| Round-trip execution cost | (P_sell − P_buy) / P_buy, adjusted for midprice move, averaged over buy/sell pairs | Huang et al. Eq. 5 |
| Conventional effective spread (SEC) | Execution cost vs midpoint at trade time | SEC 2000 |
| Realized spread | Execution price vs midpoint at a later time (informational impact) | SEC 2000 |
| Adjusted effective spread | Midpoint replaced by expected future option value from public high-frequency information | Muravyev & Pearson |
| True effective spread | 2 × signed % deviation from pre-trade midquote with verified direction; midquote adjusted when trader's own aggressive limit sets the NBBO | Barardehi et al. |
| E/Q | Effective spread / quoted spread | Hendershott; Huang; Barardehi |
| MM revenue | Quoted spread − hedge costs − price improvement | Hendershott et al. |

**No-double-counting rules:** effective spread already nets price improvement; realized spread is a decomposition of effective spread, not an additional cost; fees are additive to the half-spread per side; executed limit-order "negative spreads" belong to a different order-type cell and 70% of limit orders do not fill.

## 7. SPX/SPXW evidence

The complete inspected SPX evidence base is Beckmeyer, Branger & Gayda (2023), "Retail Traders Love 0DTE Options… But Should They?" (Dec 22, 2023 working paper) — **VERIFIED**. See §3 and §4.1 for the matrix.

Bounding details: SPX Feb 2021–Sep 2023; retail proxy = OPRA SLAN/MLAT codes corresponding to Cboe AIM price-improvement auctions, ≤10 contracts — a mechanism-based proxy; effective-spread formula as in §4.1; commissions and explicit fees excluded; AIM-conditional sample likely selects executions receiving price improvement; multileg observations are averaged leg spreads, **not** package-level complex-order friction; no retail orders >10 contracts by identification design.

Best traceable lead for further SPX evidence: Garcia-Ares et al. (2026), *The Rise of Algorithmic Retail Option Traders*, SPX/SPXW May 2022–January 2026 — **IDENTIFIED-TRACEABLE**, not inspected; potentially useful for small complex short-premium orders.

**Empty SPX cells (ABSENCE-OF-EVIDENCE):** retail effective spread at 1–45 DTE (specifically 30–60/≈45 DTE); package-level complex orders; observed marketable vs passive limit outcomes; opening vs closing; post-Sep 2023; >10 contracts; current SPX/SPXW retail effective spread.

## 8. SPY/ETF evidence

**Instrument-specific SPY/QQQ/IWM execution-friction matrix is mostly empty.** No inspected primary source gave complete SPY, QQQ, or IWM execution spreads by order type × size × DTE.

What is **VERIFIED**:

- Cboe SR-CBOE-2023-019 Exhibit 3 (2022, Jan–Jul): SPY/SPXW quoted- and effective-spread *co-movement* in matched moneyness/DTE cells (strikes ±3% of spot; DTE bins 0–3 through 24–27; calls/puts separately). Quoted-spread correlations strongest near ATM and short DTE; effective-spread correlations materially less uniform, several longer-DTE/deeper-ITM cells weak or near zero. **All participants; no retail identification; no size; no fees.** It is a market-design finding about Tuesday/Thursday expirations, not a friction estimate.
- Tick regime: all SPY, QQQ, IWM series quote $0.01 (permanent Penny Pilot; NYSE Arca filing SR-NYSEArca-2013-95).
- Customer exchange fees: Cboe transaction fees waived for public-customer ETF/ETN option orders ≤99 contracts, both sides (Cboe Fees Schedule Aug 2026, footnotes 8–9).
- Cboe 2026 0DTE report (Xu, Mar 2026): IWM 0DTE share of volume 15%→39%; estimated retail share 60–65% of IWM 0DTE flow (**"educated guess,"** not clean identification); IWM 0DTE flow 80–90%+ outright (only 4% of retail IWM 0DTE in vertical spreads); retail IWM 0DTE closing surge ~3:30 p.m. (auto-liquidation / assignment/pin risk); tenors ≥3 months ≈90% institutional. **Volumes, strategy shares, timing — not spreads, not price improvement, not fees.**
- Barardehi et al. text search: no "SPY" matches; Huang et al. 18-symbol sample pools equities and ETFs with no SPY-only cut.

**SPY → SPX transfer: unsupported for level estimates** (see §19).

## 9. Single-name evidence

Eight primary sources directly inspected (see §34). Headlines:

- **Bryzgalova et al. (2023, JF):** SLIM retail-proxy effective spreads by size/DTE/moneyness/instrument (§4.4); non-ETF 14.9%/7.2% vs ETF 8.4%/4.4% (quoted/effective) — the cleanest in-sample transfer warning (~1.8× ratio).
- **Huang, Jorion & Schwarz (2024):** controlled broker experiment (§4.2); the only inspected source with known trade direction, broker, and venue; broker fixed effects 16.5% R²; PI–PFOF ≈ −0.90/−0.91 (correlation, not causality); Lee–Ready mis-signs 22%.
- **Barardehi, Bogousslavsky & Muravyev (Nov 2025 draft):** all-order-type true effective spreads with market/limit split (§4.3); trader FE explain 71% of E/Q variation, broker FE <1% — individual order-type choice, not broker defaults, drives execution quality; SPX deliberately excluded.
- **Hendershott, Khan & Riordan (2024):** auction vs LOB PI and wholesaler economics (§4.5); S&P 500 single-names only.
- **SEC Staff (Dec 2000):** historical regime baseline — effective spreads fell $0.26→$0.17 (≤50-contract, <$20 options) with multiple listing, then held flat despite PFOF growth; auto-executed drove the decline; regime-bound (1999–2000 specialist market), does not contradict Huang 2024 (different mechanism/margin).
- **Muravyev & Pearson (2015 WP / 2020 RFS):** conventional ES overstates cost for execution timers (adjusted ≈67% of conventional all-trades, ≈21% for timers); authors state non-timer retail pays ≈ conventional ES — timing-adjustment results must not be transferred universally to retail.
- **Cao & Wei (2010):** liquidity-state evidence (proportional quoted spreads, 1996–2004, DTE<9 excluded) — supports instrument/liquidity dependence; no execution, no retail, no short-DTE.
- **Bogousslavsky & Muravyev (2025):** composition (not cost) — top-10 underlyings 60% of option trades; median maturity 4 days (2020) → <1 day (2022); returns, not execution costs.

**Verdict on the scalar question:** one scalar across size and DTE is **CONTRADICTED** (see §23).

## 10. Retail execution literature

Retail identification methods in the inspected literature, with their error structure:

- **SLIM/SLAN (Bryzgalova; Beckmeyer):** OPRA price-improvement-auction trade codes as retail proxy. Mechanism-based; two-sided errors — misses non-auction retail (Huang: only ~50% of known retail trades via PIM auctions; Barardehi: SLAN = 27% of journal sample) and admits small professional flow (MLIM "protail"). Not a verified universal retail flag.
- **Journal provider (Barardehi; Bogousslavsky–Muravyev):** verified retail accounts with true direction; users skew sophisticated — not representative of all retail.
- **Controlled experiment (Huang et al.):** the experimenter's own trades — known broker, direction, venue; 6 brokers, one contract, calls, market orders, 1–7 DTE.
- **Bryzgalova et al. (JF 2023)** sample is equity + ETF options; **index options explicitly excluded**. Its DTE and size marginals (§4.4) are the broadest retail tables available but have no SPX applicability.

## 11. Price-improvement evidence

- Options price improvement is delivered **on-exchange via auctions** (PIM/AIM/COA) — structural difference from equities' off-exchange internalization (Hendershott et al., **VERIFIED**).
- Broker-attributed PI exists only in Huang et al. 2024: 7%–52% of NBBO, 26¢–207¢/contract, conditioned on executed one-contract call market orders, Mar–Jun 2024 (§4.2). **No broker-published options PI series was found** (ABSENCE-OF-EVIDENCE); published broker "price improvement" figures are Rule-605 equities numbers that do not transfer.
- Market-wide auction PI: ≈67% of quoted spread on average; minimum PI >45% of auctions; ≥10¢ PI 38% of auctions; <10% of auctions have multiple bidders at the winning price (Hendershott et al.).
- Autoexecution PI is thin: 5.6% of NBBO in Huang's sample; autoexecution round-trip cost ≈9%.
- Measurement caveat: Lee–Ready direction inference mis-signs 22% of experimental trades, understating PI (7% vs 27% actual) — any OPRA-based PI estimate using inferred direction is biased downward (**VERIFIED**).
- Limit-order PI across brokers: ABSENCE-OF-EVIDENCE. Limit-order PI conditioned on execution would embed fill selection — a limit PI series is not an implementation-shortfall series.

## 12. Order-size effects

- SPX retail-proxy (Beckmeyer, 0DTE, ≤10 ct): 5.4% → 5.7% → 7.4% (1 / 2–5 / 6–10 contracts) — spreads *widen* with size inside the auction mechanism; 74.2% of orders are one contract.
- SLIM (Bryzgalova): 1 ct 6.4%; 2–5 6.2%; 6–10 7.3%; 11–100 8.4%; >100 11.9%; dollar <$250 11.6% (tick-size economics on cheap options). Above $20k notional, effective > quoted — treated as institutional contamination/price impact, not retail.
- Market impact slope is tiny: +0.19¢ per 100 contracts (Muravyev–Pearson Table 7, **VERIFIED**) — the binding retail size effect is the spread width of the bins retail trades, not market impact.
- Micro-size: 42% of retail trades are ≤$250 premium, facing 23.5% average quoted spreads (Bogousslavsky–Muravyev, working paper).
- **No inspected study crosses contract/dollar size with DTE jointly** — size × DTE joint matrix is empty.

## 13. DTE effects

- **0DTE:** the only DTE with direct retail spread evidence — SPX retail-proxy (Beckmeyer, §4.1): ≤1h 10.5%, 1–3h 5.9%, 3–24h 4.5%. Barardehi: 0DTE flag +0.67pp effective spread (regression coefficient, mixed order-type sample, 2020–2022) — the only inspected 0DTE × order-type-adjacent estimate.
- **Broad retail (Bryzgalova):** DTE marginals §4.4 — <1wk 6.6%, 1–2wk 6.0%, 2–4wk 7.1%, 1–3mo 6.2%, 3–12mo 7.8%, >1yr 9.3% effective. Non-monotone; no causal reading.
- **30–45 DTE retail:** ABSENCE-OF-EVIDENCE. No inspected primary source tabulates spreads in DTE bins for retail flow at these tenors.
- **Mechanism notes:** relative spreads mechanically vary with premium; tick-binding differs across DTE (penny ticks bind on low-premium 0DTE, not on $5+ 30-DTE options); adverse-selection (price impact) falls as DTE shortens (Muravyev 2016 via thesis quote — IDENTIFIED-TRACEABLE), which is not a spread statement.

## 14. Historical-period effects

Period breaks that invalidate old estimates (VERIFIED):

| Change | Date | Effect |
|---|---|---|
| Multiple listing | 1999–2000 | NBBO spreads −38%; ≤50-contract effective −35% |
| Penny Pilot → permanent | 2007–2010 | Quoted spreads narrowed all pilot classes; pre-2007 tick-regime levels do not transfer |
| Retail auction routing (PIM/AIM) | 2004+; modern form 2010s | Pre-auction retail estimates miss the main PI channel |
| Zero-commission | Oct 2019–Jan 2020 | $4.95–6.95/trade → $0 + $0.65/contract; pre-2019 fee stacks overstate explicit costs ~7–10× per ticket |
| 0DTE regime / daily expirations | SPXW Tue/Thu 2022; growth to ~59% of SPX vol | Volume, gamma, intraday-timing regimes changed |
| ORF per-exchange regime | 2026-07-01 | Venue-dependent fees; multi-venue executions stack ORFs |
| FINRA TAF pause | Oct–Dec 2026 transactions | $0.00329 → $0.00 for Q4 2026 |
| OCC clearing fee | $0.025 from 2026-01-01; $0 Dec 2025 | Fee stacks must be re-dated |
| Timer share rise (Muravyev–Pearson) | 27.5% → 54%, 2004–2015 | All-trader average cost fell; retail (nontimer) cost did not fall as fast — a mixed average is not a retail series |

**Master rule:** a friction estimate transfers across periods only if tick regime, auction/PI mechanism, commission regime, and venue count are unchanged. In practice: ~2019+ for fees, ~2022+ for auction-structure-dependent PI.

## 15. Broker fee evidence

See §5.2–5.3. Headlines:

- Per-contract commissions ($0 base + $0.65/ct typical) dominate the explicit-fee bill; the dominant instrument-class effect is the **index-option proprietary pass-through** ($0.18–$0.75/ct by symbol/broker) — SPX friction materially higher than SPY/equity at every broker. Pass-through methodology differs for the same exchange fee (tastytrade blended $0.60 SPX vs Robinhood tiered $0.57/$0.66).
- "$0 commission means zero execution cost" is **CONTRADICTED**: Robinhood ($0/$0) had the worst measured round-trip cost (678 bps) and lowest PI (13.9%/7.2%) in the controlled experiment; regulatory and exchange pass-throughs apply regardless of advertised commission.
- Fee schedules calibrate the per-contract fixed-cost leg, not execution quality. Do not infer execution quality from fee schedules — and do not rank brokers: the experiment's results are experiment-specific (1-contract call market orders, 18 liquid symbols, Mar–Jun 2024) and do not support universal ranking.
- CAT-rate discrepancy noted: US-page $0.0003/contract vs $0.0022 on a non-US rendering — unresolved; US value used.

## 16. Exchange and regulatory evidence

- **No options equivalent of Rule 605 exists** (CONTRADICTED that one does — stated by the Huang/Schwarz authors, corroborated by 605's NMS-stock scope; Track F VERIFIED from rule text).
- OPRA provides the quote/trade tape (enables measurement); Rule 606 provides routing disclosure; **neither provides execution quality**.
- SEC April 2026 options roundtable (File 4-887) is active regulatory attention, not findings — IDENTIFIED-TRACEABLE/VERIFIED (press release) with no conclusions as of 2026-09-26.
- Exchange fee schedules (C1, Sep 15 2026) and rule filings on auction mechanisms document mechanisms and fees, not execution-quality outcomes.
- CCMR 2025 staff report on retail options: access failed (404) — IDENTIFIED-TRACEABLE citation only.
- FINRA 2025 options best-execution findings: not located (ABSENCE-OF-EVIDENCE in this track).

## 17. Rule 606 findings

**VERIFIED** from 17 CFR 242.606 text (direct read):

- 606(a) quarterly public reports: non-directed customer option orders by month; order-type mix; top-10 + ≥5% venues with routing % by order type; net PFOF/fees/rebates per venue per order type (in dollars **and per share** — no per-contract metric); material-relationship narrative.
- **606(b)(1)** customer-specific: venue identity per order (6 months) on request — invoked by Huang–Jorion–Schwarz to recover venues for their ~7,000 trades.
- 606(b)(3) detailed order-handling reports: NMS-stock-only, not options.
- **What 606 does NOT establish:** fill prices, price improvement, effective/quoted spreads, fill rates, NBBO comparison, per-contract payment accounting. Converting venue shares + PFOF rates to an effective-spread estimate is **CONTRADICTED as a method**: PI correlates −0.91 with PFOF across brokers (opposite of the naïve sign), and affiliated-DMM routing shows no worse execution in the experiment.

## 18. Dataset feasibility map

No public dataset directly combines retail/customer identity with per-trade SPX execution prices:

| Dataset | Execution prices | Customer/retail identity | Order type | DTE | Access | Gap |
|---|---|---|---|---|---|---|
| Cboe LiveVol Option Trades | Yes (per print + NBBO snapshot) | **None** | No | Reconstructable | Commercial | Identity |
| Cboe Open-Close (EOD/10-min/1-min) | Series OHLC/last only (all participants) | **Customer = retail + institutional** (origin C); size buckets by original order size | No | Direct (`days_to_expire`) | Commercial | Per-origin prices; retail split |
| Nasdaq NOTO/PHOTO | Aggregates only | Same origin taxonomy | No | Reconstructable | Commercial | Same; not SPX |
| OPRA vendors (Databento, Polygon, ThetaData…) | Yes | **None** | No | Reconstructable | Commercial | Identity |
| OptionMetrics IvyDB | Closing NBBO (no trades) | None | No | Direct | Academic/Commercial | Executions |
| Rule 606(a) reports | No | Retail-broker-level routing aggregates | Order-type mix only | No | **Public** | Prices, DTE, size |
| CAT | Full lifecycle + customer identity + order type + price | Yes | Yes | Yes | **Regulatory, nonpublic** | Access |
| Academic proprietary (Barardehi et al.) | Yes, retail, verified direction | Yes | Yes (inferred) | Yes | **Inaccessible** | Access |

SPX is the easiest instrument (Cboe-exclusive: C1 datasets = 100% market coverage); the hard cells are participant identity, order type, and costs — instrument-independent gaps. Structurally empty public cells: (1) execution prices tagged to retail/customer origin; (2) order type in public trade datasets; (3) per-trade total cost components; (4) retail vs institutional inside "customer" flow.

## 19. SPY → SPX transfer audit

**Level transfer: UNSUPPORTED (verging on CONTRADICTED as fungibility).** Structural differences (all VERIFIED from Cboe product documentation / rule filings):

| Dimension | SPY | SPX | Effect on transfer |
|---|---|---|---|
| Exercise | American (early assignment risk) | European | Mechanism differs; magnitude of spread differential unmeasured |
| Settlement | Physical (100 shares; pin/after-hours risk) | Cash | SPX writers avoid assignment-handling friction |
| Notional | ~1/10th of SPX per contract | ~10× SPY | 1 SPX ≈ 10 SPY scales notional only — tick, fee, auction structure do not scale |
| Tick | $0.01 all series | $0.05 (<$3) / $0.10 (≥$3) (Cboe Rule 6.42) | SPX cannot print penny PI increments; SPY PI distributions cannot port |
| Listing | Multi-listed, 16 exchanges | Cboe-exclusive | SPY friction is a 16-venue competitive outcome; SPX mechanism differs |
| Customer fee (Cboe) | $0.00 ≤99 contracts | $0.36/$0.45 + $0.21/$0.14 surcharges + AIM fees | All-in comparison needs the SPX fee term; SPY fee is zero at retail size |
| Strategy mix (0DTE) | Overwhelmingly simple (outright) | Balanced simple vs complex | Averaged leg spreads are not package costs |
| 0DTE composition | Retail-heavy penny flow | Retail participates; institutional-dominated notional | Retail wholesaler/auction mechanism share unmeasured for SPX |

- The one matched study (Cboe SR-CBOE-2023-019 Exhibit 3) found SPY correlates better with SPXW (PM-settled) than SPX (AM-settled) does — even Cboe rejected AM-settled SPX as the SPY comparable.
- What Exhibit 3 *does* license, at most: **PLAUSIBLE BUT UNVERIFIED** directional statement — in matched short-DTE/near-ATM cells in 2022, SPY and SPXW quoted-spread *changes* tended to move together. It does not license level transfer, longer-DTE/deeper-ITM transfer (correlations weak/near-zero), or fee-inclusive/retail-specific transfer.
- Reverse direction also blocked: Beckmeyer's SPX auction-improved retail spreads are products of Cboe's retail-attracting auction mechanism; SPY retail predominantly executes via wholesaler internalization with different PI economics. **TRANSFER UNSUPPORTED** both ways.

## 20. 0DTE → non-0DTE transfer audit

**Level transfer: UNSUPPORTED (CONTRADICTED for several dimensions).**

- Relative spreads mechanically differ with premium; tick-binding differs ($0.01 ticks bind on low-premium 0DTE, not on $5+ 30-DTE options).
- The 0DTE microstructure mechanism (gamma singularity, dealer hedging-flow dominance, intraday pin dynamics) does not operate at 30–45 DTE — **CONTRADICTED** as a mechanism transfer.
- The abundant 0DTE *volatility-impact* literature (Brogaard et al. vs Dim et al. — signs contradicted) answers "does 0DTE flow destabilize the underlying?", not "what does a 30-DTE retail put pay in spread?" — wrong object for Q0 friction.
- Direct spread-by-DTE measurement for retail flow at 30–45 DTE: ABSENCE-OF-EVIDENCE.
- Beckmeyer's 0DTE SPX numbers (10.5% ≤1h → 4.5% 3–24h) must not be silently extended to 30–45 DTE: the DTE axis is empirically empty.

## 21. Simple → complex transfer audit

**Both directions UNSUPPORTED.**

- Complex orders trade in a separate book/auction (COB/COA/AIM/SAM) with net-price increments — $0.01 most classes but **$0.05 for SPX/SPXW** (Cboe C2022032100, eff. Apr 24 2022) — and COA initiation requires pricing better than the derived net market.
- The entire L3 ladder (Barardehi, Hendershott, Muravyev–Pearson, Ernst–Spatt) is estimated on single-leg flow; Hendershott explicitly restricts to single-leg.
- Retail studies actively exclude multileg flow (Bogousslavsky–Muravyev robustness check drops same-day multiple option trades) — the retail-cost literature is single-leg by construction.
- Averaged component-leg spreads (Beckmeyer convention) are a comparability convention, **not** package-level execution cost — rejected as a package metric.
- Leg-level quoted spreads compose additively for the derived net market, but package price improvement does not compose from single-leg PI evidence — any composed estimate is INFERENCE.

## 22. Fill-model evidence ladder

Ordered by increasing empirical grounding for **retail marketable single-leg orders**. Each level: what is measured, assumed, usable for, and cannot establish.

- **L1 — Midpoint diagnostic.** Frictionless reference. Cannot establish any "retail executes at/near midpoint" claim — 67.6% of retail market orders print at NBBO; >45% of auctions yield only minimum PI. **Definitional.**
- **L2 — Midpoint + dated explicit fees.** Fee stack from §5 (commission vintage, OCC $0.025, ORF rate + venue + date, TAF/SEC/CAT status). Portable component; systematically understates friction by the full spread. **VERIFIED** (primary schedules).
- **L3 — Empirically calibrated retail execution**, three non-overlapping sub-models (do not blend without stating the blend):
  - **L3a — Retail market-order cost:** 2.44% mean / 1.33% median true effective spread; 67.6% print at NBBO (Barardehi 2026, working paper). Best-supported retail taker cell. **VERIFIED.**
  - **L3b — Auction/LOB mixture:** ~77% auto-electronic / 23% auctions; auction PI ≈67% of quoted spread; MM revenue negative in auctions, high in LOB (Hendershott et al. 2024). Retail PFOF-wholesaler execution as a mixture, not a single PI rate. **VERIFIED** (working paper).
  - **L3c — Nontimer conventional effective spread by moneyness:** OTM 12.9% / ATM 8.8% / ITM 6.1% of midpoint (Muravyev–Pearson Internet Appendix — **IDENTIFIED-TRACEABLE** for the IA tables; WP/PFS published findings VERIFIED). Retail ≈ nontimers per the authors; sample 2004–2015 — period-adjust before 2026 use.
- **L4 — Quoted-side execution (buy at ask / sell at bid).** Valid *upper bound* for marketable orders (67.6% do print at NBBO; LOB-only conditional cost); **CONTRADICTED as a central estimate** — overstates average retail taker cost ~1.3–2×.
- **L5 — Stress/illiquid execution.** Only with documented components: micro-size retail 23.5% quoted; OTM retail 29% quoted; auction minimum-PI >45% of the time; size slope +0.19¢/100 contracts (tiny). **Arbitrary multipliers ("2× spread in stress") are CONTRADICTED as a method.**

**No empirical midpoint-limit-order fill probability was found.** Do not invent one.

## 23. Strongest falsifiers

1. **One scalar across size/DTE is CONTRADICTED.** Bryzgalova Table 1: effective 1.9% ($5k–10k dollar bin) → 11.9% (>$50k); 6.0% (1–2wk) → 9.3% (>1yr). Huang: 0–700 bps across brokers on identical contracts.
2. **Quoted spread ≈ retail cost is CONTRADICTED.** Effective << quoted in every retail sample (6.7 vs 13.7; 1.07 vs 3.62; E/Q 0.38–0.74).
3. **Midpoint deviation = paid cost is CONTRADICTED as a general reading.** Timing adjustment (Muravyev–Pearson); aggressive-limit midquote adjustment (Barardehi); Lee–Ready mis-signing 22% (Huang).
4. **Lee–Ready signing adequate for retail PI is CONTRADICTED.** 22% mis-signed; PI% 7% vs 27% actual.
5. **SLIM/SLAN captures all retail is CONTRADICTED.** Only ~50% of known retail trades via PIM auctions; SLAN = 27% of journal sample.
6. **Retail = market orders only is CONTRADICTED.** ≥33.5% (Form 606: 41.2%) of retail option volume is nonmarketable limit; ignoring them overstates costs ~60%.
7. **Broker doesn't matter is CONTRADICTED.** Broker FE 16.5% R²; PI 7%–52%; PI–PFOF −0.90.
8. **Auctions are strongly competitive is CONTRADICTED.** <10% multiple bidders at winning price; final PI anchored to wholesaler-set start prices.
9. **PFOF has no execution effect (SEC 2000) vs PFOF–PI −0.91 (Huang 2024): NOT a contradiction** — regime boundary: cross-exchange 1999–2000 specialist market without retail auctions vs cross-broker wholesaler discretion over auction usage/pricing. Both VERIFIED in their regimes.
10. **"$0 commission ⇒ zero friction" is CONTRADICTED.** Robinhood: 678 bps round-trip, 13.9% improved.
11. **Midpoint fill model for marketable retail orders is CONTRADICTED** (F1, §22).
12. **Arbitrary stress multipliers are CONTRADICTED as a method.**

## 24. Empty cells

1. SPX retail effective spread at 1–45 DTE (specifically 30–60/≈45 DTE) — **the binding empty cell**.
2. SPX retail >10 contracts; SPX post-Sep 2023; SPX observed marketable vs passive limits; SPX opening vs closing.
3. Package-level complex-order execution cost (all instruments).
4. Midpoint limit-order fill probability (all instruments).
5. Limit-order opportunity cost net of non-execution (all instruments).
6. Retail limit-order price improvement across brokers.
7. Time-of-day / open-vs-close cost curves (activity patterns exist; costs unmeasured).
8. Current (2026) executable spreads for any instrument.
9. SPY/QQQ/IWM spreads by order type × size × DTE (entire sub-matrix).
10. All-in retail friction (spread + commission + exchange/clearing/regulatory) for any instrument — spreads and fees are measured in separate studies; only Huang Fig. 7 joins them (broker-level, market orders, 2024).
11. Public retail-tagged trade prices; retail vs institutional within "customer" flow; per-trade cost components.
12. GTH (overnight) SPX spreads; pre-2004 execution-level history.

## 25. Claims upgraded to VERIFIED

During Q0, direct primary-source inspection upgraded these to VERIFIED:

1. SPX retail-proxy 0DTE effective spreads (6.0% calls / 5.0% puts; size/direction/time/moneyness splits) — Beckmeyer et al., Feb 2021–Sep 2023.
2. Cross-broker PI and round-trip costs (7%–52% NBBO; 26¢–207¢; ≈0–700 bps) — Huang, Jorion & Schwarz, Mar–Jun 2024.
3. Retail true effective spreads with market/limit split (2.44%/−1.01% avg) — Barardehi et al., Nov 2025 draft.
4. SLIM retail-proxy spreads by size/DTE/moneyness/instrument — Bryzgalova et al., JF 2023.
5. Auction vs LOB PI (67% of spread; E/Q 0.38/0.74) — Hendershott et al., May 2024.
6. Timing-adjusted vs conventional ES (67%/21%) — Muravyev & Pearson (2015 WP; RFS 2020).
7. Cboe C1 Sep 2026 customer fee schedule incl. SPX tiers and surcharges.
8. Rule 606's disclosure scope and its limits (no price outcomes; per-share accounting; (b)(3) stocks-only) — 17 CFR 242.606.
9. Rule 605 does not cover options (NMS stocks only).
10. Lee–Ready mis-signs 22% of experimental trades, understating PI 7% vs 27%.
11. SPY/SPX structural differences (tick $0.01 vs $0.05/$0.10; 16 venues vs exclusive; American/physical vs European/cash; 10× notional; fee asymmetry) — Cboe product docs + rule filings.
12. Dataset feasibility: no public dataset joins retail identity with per-trade execution prices; CAT is the only complete source and is regulator-only.
13. TAF pass-through $0.00329/contract on option sells (three broker schedules).
14. PI–PFOF correlation ≈ −0.90/−0.91 (correlation, not causality).

## 26. Claims remaining IDENTIFIED-TRACEABLE

1. Garcia-Ares et al. (2026), SPX/SPXW algorithmic retail traders, May 2022–Jan 2026 — best uninspected SPX lead.
2. Cboe Aug 2026 fee schedule ETF waiver + SPX List A structure (Track B read; Track E re-verified C1 Sep 2026).
3. Post-C1 ORF venue rates (C2, BZX, EDGX, BOX, Phlx, NOM, MIAX Emerald/Pearl, NYSE American) — rule filings identified via excerpts, not directly opened.
4. OCC $0.025/contract + Dec 2025 holiday (OCC schedule/memos via excerpts).
5. SEC Section 31 $20.60/$1M from 2026-04-04; FINRA TAF Q4 2026 pause (SR-FINRA-2026-021).
6. Muravyev–Pearson Internet Appendix moneyness tables (L3c values).
7. Wei & Zheng (2010); Chan, Chung & Johnson (1995); Lee & Yi (2001) — bib-level only.
8. Ernst & Spatt (2026) retail-concentration figures (RFS advance; 403 on fetch).
9. Li–Musto–Pearson complex-order work — candidate for the complex cell (not yet inspected).
10. IWM 0DTE participation structure (Cboe 2026 report — full text read by Track B; filed here as identified-traceable pending independent re-inspection).
11. Broker schedules for Schwab, E*TRADE, IBKR, Robinhood, Webull (extracts, not directly opened).
12. The Muravyev & Pearson SPY-specific post-Penny-Pilot analysis (no legitimate copy located).

## 27. Claims remaining INFERENCE

1. The worked fee arithmetic in §5 (arithmetic on verified inputs, not measured cells).
2. Any composed package-level complex-order estimate from leg spreads (mechanism differs).
3. L2 fee-stack totals applied to a hypothetical order (fee composition is verified; the order is illustrative).
4. Fee dominance at low premiums (~$0.68/ct/side vs $0.50 premium) — arithmetic, not a measured friction cell.
5. "<100-contract customer bucket as retail proxy" in dataset merges — standard practice, not identification.
6. Transfer-direction claims marked PLAUSIBLE BUT UNVERIFIED (SPY↔SPXW short-DTE/near-ATM co-movement; single-name upper-bound for liquid ETFs).
7. Any all-in friction number combining a spread study with a fee schedule across sources.
8. The 30%-limit-fill figure applied outside Barardehi's sample window.

## 28. Claims classified ABSENCE-OF-EVIDENCE

1. Retail SPX effective spread at 30–45 DTE.
2. Midpoint limit-order fill probability (retail options).
3. Limit-order opportunity cost net of non-execution (options).
4. Current-2026 executable spreads (any instrument).
5. Broker-published options price-improvement series.
6. QQQ options execution spreads of any kind.
7. SPY/QQQ/IWM retail spreads by order type × size × DTE.
8. Open-vs-close execution cost curves.
9. PFOF-rate → per-contract retail cost mapping for ETFs.
10. Retail complex-order package spreads.
11. FINRA options best-execution examination findings (2025 report not located).
12. Exchange-published retail options execution-quality statistics (Cboe RPC is revenue, not quality).
13. Pre-Oct-2019 primary broker fee schedules.

## 29. Claims classified CONTRADICTED

1. One scalar survives across size and DTE.
2. Quoted spread ≈ paid retail cost.
3. Midpoint deviation = paid cost (general reading).
4. Lee–Ready signing adequate for retail PI.
5. SLIM/SLAN captures all retail.
6. Retail = market orders only.
7. Broker choice doesn't matter.
8. Auctions are strongly competitive.
9. SPY and SPX execution costs are fungible (levels).
10. "$0 commission ⇒ zero friction."
11. Midpoint fill model as a central case for marketable retail orders.
12. Arbitrary stress multipliers as a method.
13. 606(a) venue shares + PFOF convert to an effective-spread estimate.
14. Broker fee schedules imply execution-quality ordering.
15. Muravyev–Pearson adjusted spreads as a retail cost proxy (CONTRADICTED as retail proxy; VERIFIED as measure).
16. SEC 2000's "PFOF had no effect" transferred to the modern auction/wholesaler regime (regime boundary, not a contradiction of the original).
17. Limit orders are net cheaper all-in (unestablished — conditional −1.01% does not include opportunity cost).
18. Averaged component-leg spreads = complex-order execution cost.

## 30. What changed during Q0

Reconciliations and reversals from the eight-track integration:

1. **Track H's "no SPX retail effective spread measured" is superseded.** Track A independently found Beckmeyer et al.'s bounded 0DTE SPX retail-proxy cell. The integrated verdict is *partially filled at 0DTE only* — the 30–60 DTE cell remains the empty one. Track H's 0DTE→30–45-DTE audit conclusion stands and is strengthened.
2. **Barardehi market-order value pinned to 2.44% mean / 1.33% median** (Nov 17, 2025 draft, Table 8) vs 2.53% (Sept 6, 2025 draft text) — resolved in favor of the later draft's table; limit −1.01%/−0.68% likewise.
3. **TAF $0.00329 elevated from IDENTIFIED-TRACEABLE to VERIFIED as broker pass-through** (three independent broker schedules: tastytrade direct read, Robinhood RHF, IBKR). The underlying FINRA By-Laws rate and the Q4 2026 pause remain IDENTIFIED-TRACEABLE.
4. **OCC $0.025 effective date reconciled to 2026-01-01** (raised from $0.02; $55/trade cap removed; $0 holiday Dec 2025). Track F's "from Jan 1, 2025" is a conflicting record — the 2026 date from the OCC-memo chain is preferred; flag before use.
5. **Cboe SPX fee values updated to the Sep 15, 2026 schedule** ($0.36/$0.45 + $0.21/$0.14 surcharges), superseding Track B's 2014 figures ($0.44/$0.35). Track B's historical 2014 rows are retained only as regime history.
6. **Broker fee evidence-state correction:** Track F's headline said VERIFIED for IBKR/E*TRADE/Robinhood/Webull, but its own section notes cap them at IDENTIFIED-TRACEABLE (extracts not directly opened). This report uses the stricter labels; only tastytrade and Fidelity (BrokerageLink schedule) are VERIFIED from direct reads.
7. **ORF regime:** Track H's ORF figures (Cboe $0.0023→$0.0017) are superseded by Track E's per-exchange post-reform ledger (from 2026-07-01; C1 $0.01248 from 2026-08-13). Q0 period cells spanning 2026 must split at 2026-07-01.
8. **Huang et al. naming:** the paper is Huang–Jorion–Schwarz ("Some Anonymous Trades Are More Equal than Others"); Track E's comment-letter summary of its expanded sample (~7,000→20,000+ trades) is noted but the paper text itself (Nov 2024 version) is the VERIFIED source.

## 31. Whether calibration suffices for later preregistration

**No — not for a strategy-level preregistration.** Two independent blockers:

1. **Spread leg:** the 30–45 DTE retail SPX effective-spread cell is empty. A preregistration would have to either (a) bound the spread leg with the L3–L5 ladder (L3a 2.44% market-order or L3b auction mixture as a labeled transfer with downgrade rationale, L4 quoted-side as upper bound, L5 components as stress) — honest but structurally incomplete, with every transfer explicitly labeled INFERENCE — or (b) defer until the cell is measured. It cannot use the 0DTE SPX number (6.0%/5.0%) as a 45-DTE input.
2. **Strategy specification:** Q0's stop conditions deliberately leave the exact 45/50/21 composite specification unresolved (per the prior program's REDIRECT finding, no disclosed-friction net replication of the exact composite exists). Friction calibration alone does not authorize the later experiment even if the friction cell were filled.

What *is* preregistration-ready: the **L2 explicit-fee leg** — dated Cboe SPX fee schedule, broker pass-through tables, and the 2026 regulatory chain (with the 2026-07-01 ORF split and Q4 2026 TAF pause) can be written into a cost model verbatim, with evidence states attached.

## 32. Exact remaining blockers

1. **Primary:** no directly inspected primary estimate of retail SPX effective spread at ≈30–45/60 DTE, by observed order type, for package-level complex execution. SPY, equity-option, and 0DTE numbers cannot fill it (transfer audits §§19–21).
2. **Measurement infrastructure:** no public dataset joins retail/customer identity with per-trade execution prices (see §18); the only complete sources are regulatory (CAT, nonpublic) or academic-proprietary (inaccessible).
3. **Candidate inspections not yet done:** Garcia-Ares et al. (2026, SPX/SPXW algorithmic retail, May 2022–Jan 2026); Li–Musto–Pearson complex-order work; Huang–Jorion–Schwarz expanded sample (20,000+ trades / 9 brokers); the SEC File 4-887 comment record for industry responses.
4. **Fee minutiae:** C1 schedule footnotes and the RUT $0.30/$0.18 row conflict; index-license-surcharge customer applicability; non-C1 exchange customer transaction fees; ORF history reconstruction.
5. **No empirical midpoint-limit fill probability** — any limit-order-based cost model must either measure it or state it as an explicit assumption, never as evidence.

## 33. Recommended next research question

**Q-next: How can the 30–60 DTE retail SPX execution cell be directly measured — and if it cannot be measured from existing sources, what is the minimum primary data collection that would measure it?**

Order of operations:

1. **First, inspect the three identified leads** (§26.1–3, §26.9): Garcia-Ares et al. (2026) for SPX/SPXW small-order execution at longer tenors; Li–Musto–Pearson for complex-order execution; the Huang–Jorion–Schwarz expanded sample for any DTE stratification.
2. **If the cell remains empty:** determine which of three paths is defensible — (a) a controlled retail execution experiment in the Huang style but stratified by DTE (including 30–45 DTE) and order type on SPX/SPXW, with preregistered NBBO-timestamp and fee-inclusive methodology; (b) access to a restricted dataset (academic proprietary retail data or a broker-partnered TCA extract); or (c) a formal statement that the cell is unmeasurable from public sources and that any later net analysis must carry the spread leg as an explicit assumption range, not a calibrated input.
3. **Explicitly not recommended:** another SPY study, another 0DTE study, another single-name study, or a pooled meta-estimate — the transfer audits show these do not fill the cell.

## 34. Full evidence ledger

### Directly inspected (VERIFIED content)

| # | Source | Version / access | Inspected |
|---|---|---|---|
| V1 | Beckmeyer, Branger & Gayda, "Retail Traders Love 0DTE Options… But Should They?" | Dec 22, 2023 WP | Full paper; all Table 1 figures |
| V2 | Huang, Jorion & Schwarz, "Some Anonymous Trades Are More Equal than Others" | Nov 18, 2024 WP (westernfinance-portal n=1004920) | Abstract, §§1–7, Eqs. 1–5, Tables/Figs |
| V3 | Barardehi, Bogousslavsky & Muravyev, "Unpacking Retail Trading Costs" | Nov 17, 2025 draft | Abstract, §§1–5, Tables 1–9 |
| V4 | Bryzgalova, Pavlova & Sikorskaya, "Retail Trading in Options and the Rise of the Big Three Wholesalers" (JF 2023) | Sept 3, 2023 PDF | Table 1, Tables A49–A50, A56 |
| V5 | Hendershott, Khan & Riordan, "Option Auctions" | May 23, 2024 WP | Abstract, §§1–2, Eqs. 1–2, Tables 1–5 |
| V6 | SEC Staff, "Special Study: Payment for Order Flow and Internalization in the Options Markets" | Dec 2000 | Exec summary, §VII, App. A |
| V7 | Muravyev & Pearson, "Options Trading Costs Are Lower Than You Think" (WP 2015; RFS 2020) | WP full text + abstract | Headline findings, formulas |
| V8 | Cao & Wei (2010), JFM | Full paper | Filters, metric, main results |
| V9 | Bogousslavsky & Muravyev (Feb 8, 2025) | WP full text | Composition stats, return results |
| V10 | Cboe Options Fees Schedule | Sep 15, 2026 | Full schedule (customer rows, surcharges) |
| V11 | SR-CBOE-2026-072 Ex.5 (ORF) | Aug 2026 filing | Read |
| V12 | 17 CFR 242.606 | Cornell LII e-CFR | Full rule text |
| V13 | tastytrade commissions-and-fees page | Stamped Jul 30, 2026 | Full read |
| V14 | Fidelity BrokerageLink Commission Schedule | PDF | Full read |
| V15 | Cboe SR-CBOE-2023-019 Exhibit 3 | 2022 DiD study | Formulas, design, bins, correlations (numeric tables not cleanly parsed) |
| V16 | Cboe product suite comparison (SPX vs SPY) | 2023 PDF | Full text |
| V17 | SEC penny-pilot OEA memo (2009-07-24); NYSE Arca SR-NYSEArca-2013-95 | Filings | Verified |
| V18 | Cboe 2026 0DTE report (Xu, Mar 2026) | PDF | Full text (Track B) |
| V19 | Huang & Schwarz comment letter, File 4-887 | Apr 16, 2026 | PDF read |
| V20 | SEC press release 2026-24 (options roundtable) | Mar 2026 | Verified |
| V21 | OPRA Pillar spec v6.4b (Aug 2026); Cboe Open-Close spec v1.3; LiveVol Option Trades spec v2.0 | Provider docs | Directly inspected |
| V22 | Cboe tick/complex-order notices (C2022032100; Rule 6.42 filings 34-78885) | Exchange notices | Read |
| V23 | OCC fee memos (55624, 57379, 57719, 58530); SEC Section 31 FY2026 advisory; SR-FINRA-2026-021 materials | Regulator/clearing docs | Via excerpts (broker-schedule corroboration for TAF) |

### Identified-traceable, access failures, and gaps

- Post-C1 ORF venue filings (C2, BZX, EDGX, BOX, Phlx, NOM, MIAX Emerald/Pearl, NYSE American, Nasdaq BX/MRX interim) — filings identified via excerpts, not directly opened.
- Garcia-Ares et al. (2026); Li–Musto–Pearson complex-order work; Ernst & Spatt (2026) full text (403); Wei & Zheng (2010); Chan, Chung & Johnson (1995); Lee & Yi (2001) — bib-level only.
- CCMR 2025 retail-options staff report — 404. FINRA By-Laws TAF text — not obtained. Non-C1 customer transaction fees — not pulled. C1 footnote appendix / RUT row conflict — unresolved. Databento docs — fetch timeout. OPRA direct-subscriber fee schedule — not inspected. Tradier primary schedule; Schwab/Fidelity-retail full PDFs; IBKR US page direct open — not obtained. Huang–Jorion–Schwarz expanded sample; SEC File 4-887 industry comments; the Muravyev–Pearson SPY-specific analysis — not located/inspected.

---

Q0 STATUS: STRUCTURALLY INCOMPLETE — EVIDENCE GAP