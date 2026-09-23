# Wheelwright Universe: Options-Liquidity Ranking & Elimination Report

**Compiled:** September 23, 2026 · **Universe:** 1,306 symbols from `wheelwright-universe-1306.md`
**Method:** Every symbol's live options chain pulled from Yahoo Finance (expirations, weeklies, open interest, ATM spreads) and cross-referenced against CBOE 2026 year-to-date average daily options volume (top-100 ETFs).

**Headline numbers:** 805 of 1,306 symbols have listed options. Only **69** (Tiers S+A+B) have options markets I'd call genuinely liquid. Another 37 (Tier C) are situational. The remaining ~1,200 are dead weight for options purposes.

## Tier definitions

| Tier | Meaning | Count |
|------|---------|-------|
| **S** | Elite: >400k contracts/day, ~30 expirations, expiries nearly every trading day, penny-wide spreads | 3 |
| **A** | Excellent: 15k+ contracts/day or 20+ expirations with weeklies; every common strategy works | 18 |
| **B** | Solid: real volume or 12+ expirations or 100k+ open interest; minor limitations, check spreads | 48 |
| **C** | Situational: 6–11 expirations, usually monthly-only; tradeable in size with limit orders, or for buy-and-hold hedging | 37 |
| **D** | Thin: listed options but 1–5 expirations, no weeklies, negligible open interest — effectively untradeable | 699 |
| **F** | No listed options at all (includes delisted and foreign symbols) | 501 |

The full 1,306-symbol ranked table is in the companion CSV: `wheelwright-universe-options-ranking.csv` (rank, tier, volume, expirations, weeklies, spreads, open interest, leveraged/ETN flags).

---

## 1) The ranking

### Tier S — the elite three
1. **SPY** — 2.76M contracts/day, 31 expirations, 14 expiries in the next 45 days. The deepest options market on earth.
2. **QQQ** — 1.53M/day, 30 expirations. Same structure, Nasdaq-100 exposure, higher IV.
3. **IWM** — 420k/day, 31 expirations. The small-cap volatility playground.

### Tier A — excellent (18)
**SLV** (217k/day, 26 exp) · **GLD** (124k/day, 28 exp) · **USO** (61k/day, 21 exp) · **SMH** (60k/day, 27 exp) · **GDX** (54k/day, 442k OI) · **HYG** (42k/day, 20 exp, **2.18M open interest** — the credit market's hedging vehicle) · **XLE** (41k/day, 24 exp) · **EEM** (39k/day, 23 exp) · **XLF** (37k/day, 27 exp) · **KWEB** (37k/day, 468k OI) · **IGV** (25k/day) · **EWZ** (23k/day, 467k OI) · **EWY** (22k/day) · **EFA** (21k/day) · **FXI** (17k/day, 23 exp) · **ARKK** (16k/day, 212k OI)
— plus **TQQQ** and **SOXL** (flagged leveraged; liquid but structurally unsuitable for income strategies — see eliminations).

### Tier B — solid (48)
**XLP · KRE** (14k/day, 20 exp — the best regional-bank options market) **· DIA · XLI · XLB · UNG · XLU · LQD** (9k/day but 771k OI) **· XBI · SOXX · AMLP · BNO · XLK · VOO · IEF** (4.7k/day, 473k OI) **· XLY · XOP · COPX · URA · RSP · XLV · XRT · IAU · IYR · GBTC · GDXJ · MTUM · EWT · WEAT** (1.8k/day but 174k OI) **· SCHD · EWC** (144k OI despite no top-100 volume) **· CORN** (127k OI) **· VGT · FEZ · EWJ · XHB · XLC · IVV**
— plus leveraged **TNA, BOIL, UCO, UPRO, SPXL, NAIL, FAS, DPST, SSO, LABD** (liquid chains, wrong structure for the wheel — see eliminations).

### Tier C — situational (37)
Best of the rest: **XME** (96k OI) · **CPER** (70k OI) · **UUP** (56k OI — the only dollar vehicle with a pulse) · **IBB** · **KIE** · **OIH** · **MDY** · **VNQ** · **VXUS** · **VTI** · **ITB** · **KBE** · **SPYM** · **SPMO** · **INDA** · **IHI** · **CIBR** · **ITA** · **BKLN** · **UGA** · **KBWB** · **CANE** · **VUG** · **DGRO** · **IWD** · **DBA** · **EWW** · **SOYB** · **CRAK** · **ARGT** · **MUB** · **SHY**
— plus leveraged **TECL, SVXY, GUSH, TBT, QLD**.

### Tier D — thin (699) and Tier F — no options (501)
Summarized in the CSV. The D tier is where most of the universe lives: 1–5 expirations, no weeklies, negligible open interest. The F tier includes never-optioned funds, delisted symbols (LEAD, KRMA), and foreign ordinaries (DAGXF, OLOXF, BWVTF, JJETF).

---

## 2) Suggested eliminations

### Cut 1 — Tier F (501 symbols): no options market
Eliminate from any options strategy, period. Notable members: **FNGU, AMUB, USOI, AGG, BSV** (no chains returned), all 70+ JPMorgan/buffered defined-outcome ETFs (BJAN, PJUL, UOCT…), all the thematic micro-funds, plus dead tickers (**LEAD, KRMA, PY, SSPY, SPXV**).

### Cut 2 — Tier D (699 symbols): listed but untradeable
If your system needs to open *and close* positions at fair prices, these fail. Notable traps — names that *look* optionable but measured terribly:
- **JNK** — 3 expirations. The #2 high-yield bond ETF has no usable options chain; use **HYG**.
- **PFF** — 4 expirations. Preferreds have no real options market.
- **TIP** — 5 expirations. No usable inflation-bond options market exists in your universe.
- **FDN, EZA, PPA, HACK, VBK, VEU, SCHP** — 2–4 expirations each.
- **QYLD** — 4 expirations. Ironic: a covered-call fund whose own options are untradeable.
- **VOO, IVV** — chains exist (14–15 expirations) but open interest is ~28k and ~2k respectively vs. **SPY's** millions. Same S&P 500 exposure at ~100x the friction.
- **VTI** — 9 expirations, 1 in the next 45 days, no measurable OI. Use SPY/IWM.
- **SCHX** — 4 expirations.
- **BOTZ, DRIV, CLOU, ARKG** — thematic names with listed-but-dead chains.

### Cut 3 — leveraged / inverse / volatility products (for wheel & income strategies)
71 leveraged symbols in the universe; 17 sit in Tiers A–C on volume alone: **TQQQ, SOXL, TNA, BOIL, UCO, UPRO, SPXL, NAIL, FAS, DPST, SSO, LABD, TECL, SVXY, GUSH, TBT, QLD** — plus **VXX** (ETN with credit risk) and the D-tier leveraged crowd (**UDOW, ERX, UYG, DIG, DDM, DRN, ROM, USD, RETL, MIDU, UWM, DUSL, SPUU, YANG, EUO, YCS, PST, DZZ**).
Why: daily-reset decay destroys buy-and-hold premium strategies, spreads are wide relative to price, and assignment on a 3x fund is a portfolio event, not a position. Keep them **only** for short-horizon directional trades — never for cash-secured puts, covered calls, or wheels.

### Cut 4 — duplicate exposures: keep the most liquid vehicle
Your universe holds 4–6 ETFs per exposure. For options, keep one:

| Exposure | Keep | Eliminate for options |
|---|---|---|
| US large cap | **SPY** | VOO, IVV, SPYM, SCHX |
| Small cap | **IWM** | VTWO, SCHA, VIOO |
| Gold | **GLD** | IAU, DZZ |
| Oil (WTI) | **USO** | DBO, OILK, USL |
| Nat gas | **UNG** | UNL |
| Brent | **BNO** | — |
| Energy sector | **XLE** | VDE, FENY, IEO, IXC, PXE |
| Regional banks | **KRE** | KBE, KBWB, IAT, KCE |
| Financials | **XLF** | VFH, IYF, FNCL |
| Tech | **XLK** | VGT, IYW, FTEC |
| Semiconductors | **SMH** | SOXX, XSD, PSI |
| Biotech | **XBI** | IBB, BBH |
| REITs | **IYR** | VNQ, SCHH, RWR, REZ |
| Homebuilders | **XHB** | ITB |
| Health care | **XLV** | VHT, IYH, FHLC |
| Staples | **XLP** | VDC, FSTA |
| Utilities | **XLU** | VPU, FUTY, IDU |
| Industrials | **XLI** | VIS, IYJ |
| Materials | **XLB** | VAW |
| Comm. services | **XLC** | VOX, FCOM |
| Cons. disc. | **XLY** | VCR, FDIS |
| EAFE | **EFA** | VEA, IEFA, SCHF, VXUS |
| Emerging mkts | **EEM** | SPEM |
| Japan | **EWJ** | DXJ |
| Europe | **FEZ** | VGK, EZU |
| High yield | **HYG** | JNK, SHYG |
| Inv. grade | **LQD** | VCSH |
| 7–10y Treasury | **IEF** | VGIT, SCHR |
| Short Treasury | **SHY** | SHV, BIL, VGSH |
| Muni | **MUB** | VTEB |
| Dividends | **SCHD** | DVY, VYM, VIG, DGRO, NOBL, HDV, SDY |
| Equal-weight S&P | **RSP** | EQL |
| Momentum | **MTUM** | SPMO, PDP |
| Bitcoin | **GBTC** | BITO |
| Gold miners | **GDX** | GDXJ, RING |
| Oil services | **OIH** | XES |
| E&P | **XOP** | — |
| MLPs | **AMLP** | MLPA, MLPX, AMZA |
| Copper miners | **COPX** | — |
| Uranium | **URA** | NLR |
| Aerospace/defense | **ITA** | PPA |
| Cybersecurity | **CIBR** | HACK |

### The keep list (what survives all four cuts)
~45 non-leveraged names in Tiers S–C: **SPY, QQQ, IWM, SLV, GLD, USO, SMH, GDX, HYG, XLE, EEM, XLF, KWEB, IGV, EWZ, EWY, EFA, FXI, ARKK, XLP, KRE, DIA, XLI, XLB, UNG, XLU, LQD, XBI, SOXX, BNO, XLK, IEF, XLY, XOP, COPX, URA, RSP, XLV, XRT, IAU, IYR, GBTC, GDXJ, MTUM, EWT, WEAT, SCHD, EWC, CORN, VGT, FEZ, EWJ, XHB, XLC, XME, CPER, UUP, IBB, KIE, OIH, MDY, VNQ, VXUS, ITB, KBE, SPMO, INDA, IHI, CIBR, ITA, BKLN, UGA, KBWB, CANE, VUG, DGRO, IWD, DBA, EWW, SOYB, CRAK, ARGT, MUB, SHY.**
That is a 1,306 → ~70 reduction before you even apply strategy filters.

---

## 3) Why didn't Muse find the "keepers" in your list?

Three separate reasons, and they matter differently:

**(a) Thirteen of the most liquid options ETFs in existence aren't in your universe at all.** My first report's top names by 2026 options volume that return zero hits in your 1,306 symbols: **TLT** (#6), **IBIT** (#5), **SOXS** (#22), **TMF** (#62), **SCO** (#63), **AGQ** (#70), **ZSL** (#72), **YINN** (#86), **KOLD** (#83), **ASHR** (#55), **MAGS** (#35), **QQQM**, and **UVXY**. I couldn't "find" them because there was nothing to find — if you want the rates hedge (TLT), the bitcoin vehicle (IBIT), or the Mag-7 proxy (MAGS) in your system, the universe itself needs expanding.

**(b) The keepers that ARE in your universe but missed my first report were below its cut line, not judged and rejected.** Report #1 was deliberately a "best of the best" — roughly the top 40 names by options volume, with 61 tickers deep-scanned for chain quality. It was a starting XI, not a census. Your universe's keepers that fell below that editorial cut: **KRE** (#32 by volume), **TNA, BOIL, BNO, COPX, UCO, MTUM, EWT, WEAT, EWC** — plus the sub-top-100 names that needed per-ticker verification to confirm: **OIH, MDY, IBB, VNQ, EWJ, FEZ, VGT, XHB, XLC, FAS, SSO, XME, KIE, CPER, UUP, CORN**. This scan is that verification, and they're all ranked above.

**(c) Some apparent keepers measured poorly — the scan corrected my priors too.** I would have guessed JNK, PFF, and TIP were fine. They're not: **JNK has 3 expirations, PFF 4, TIP 5.** And **VOO/IVV** look like SPY substitutes until you see the open interest: 28k and 2k vs. SPY's millions. The data, not my memory, should decide — which is why the full-universe scan was worth doing.

**Caveats:** spread widths are single after-hours snapshots (indicative only); ~90 low-priority symbols remained Yahoo rate-limited after three passes (none in Tiers S–C); volume figures are 2026 YTD CBOE averages. Rankings rest primarily on volume, open interest, and chain structure, which are stable.