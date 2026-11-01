# Dividend Aristocrats — 45-Day Options-Chain Liquidity, Last Year

**Status: PROTOCOL + INTERIM APPENDIX — NOT a completed 45-day chain ranking**

Date: 2026-10-31 (Saturday; last trading day in window: Friday 2026-10-30)
Universe: 70 frozen Dividend Aristocrats (69 confirmed + RGLD, from Interim Report 1, 2026-10-12)

## 1. What this report is, and is not

This report does **not** contain a completed ranking of Aristocrats by 45-day
options-chain liquidity over the last year, because no Aristocrat options
history exists in this workspace to rank from.

Checked 2026-10-31:

- No Aristocrat historical options chains exist here. The only historical
  options pulls on record are XSP puts (2023-06-01 → 2026-09-28) and DIA puts
  (2023-06-01 → 2026-10-22). Neither can be transferred to Aristocrat names.
- The Aristocrat work to date has only a *cheap* liquidity screen
  (2026-10-12): underlying average daily volume and expiration counts.
  That is underlying liquidity, not options-chain liquidity, and it is a
  single snapshot, not a last-year average.
- No spreads, volumes, open interest, Greeks, correlations, or chain
  rankings are fabricated in this report. Where a number appears below, it
  is the 2026-10-12 cheap-screen value, labelled as such.

What this report does deliver, without a new data pull:

1. The coverage map against prior work (§2).
2. The liquidity criteria, chain definition, sorting rule, and validation
   checks for the requested ranking, determined here rather than asked (§3–§4).
3. The exact scale, source, and blockers for the pull that would fill it (§5).
4. An interim appendix (§6) with the existing cheap-screen ranking, clearly
   separated from the requested metric and **not** to be read as its substitute.

## 2. Coverage map

| Question | Prior coverage | This report |
|---|---|---|
| Aristocrat underlying liquidity / expiration depth (snapshot) | Covered — Interim Report 1 §11, `ic-portfolio/aristocrats/liquidity_cheap.csv`, 2026-10-12 | Reproduced as Appendix only, with its date and limits |
| Aristocrat strike-level options liquidity, any window | Not covered — strike-level Gate D for stocks was explicitly deferred to a separate market-hours run and has not run | Protocol only (§3–§5) |
| Aristocrat 45-DTE chain liquidity averaged over the last year | Not covered | Protocol only; no results claimed |
| Correlation / beta / survivability for Aristocrats | Covered — Interim Report 1 | Not repeated here, except where it constrains interpretation (§4) |

This is a supplement to Interim Report 1, not a revision of it. No earlier
finding is restated as a liquidity result.

## 3. Requested ranking: definition determined for the pull

### 3.1 Window

Last year = trading days **2025-10-31 through 2026-10-30 inclusive**
(about 252 sessions). NYSE full-closure holidays are excluded, and any
ThetaData stale holiday file is dropped, per the XSP-audit rule — not
filled forward.

### 3.2 Chain selected each day

For each trading day `d`, using **only** the chain file for date `d`
(point-in-time, no future information):

- Candidate expirations: listed expirations with 28–70 days to expiration
  as of `d`.
- Target: the expiration nearest **45 DTE** (the same nearest-45 rule as
  ETF Gate D / Phase G §4).
- If no expiration falls in 28–70 DTE on day `d`, that day is a skip for
  that name, recorded as a skip — not interpolated.

### 3.3 Strikes measured

Deltas are model-estimated, not observed: invert implied volatility from
the EOD bid/ask mid per strike (Black-Scholes, contemporaneous T-bill rate,
trailing-12-month distributions as dividend yield proxy), then compute
delta analytically. Every Greek/IV in the eventual ranking is labelled
model-estimated; the only observed inputs are bid, ask, and underlying price.

Measured strikes, per day:

- Shorts: nearest ±16Δ put and call.
- Wings: nearest ±5Δ put and call (same template grid as Gate D).
- Whole-chain depth: all strikes in the selected 45-DTE chain.

### 3.4 Liquidity metrics per name (averaged over the window)

| Metric | Definition |
|---|---|
| Primary: median relative spread, shorts | Median over quotable days of (ask − bid) / mid, pooled across the ±16Δ put and call. Lower = more liquid. |
| Quote availability, shorts | % of days in window with both shorts quotable (bid > 0 and ask > 0). |
| Quote availability, wings | % of days with both wings quotable (ask > 0; zero-bid wings flagged separately from zero-ask, which is unselectable). |
| Median dollar spread, shorts | Median (ask − bid) in dollars, pooled across ±16Δ strikes. Reported alongside the relative spread, not blended into it. |
| Median short volume | Median EOD contract volume on the ±16Δ strikes, as reported by the source. |
| Median chain depth | Median count of strikes in the selected chain with two-sided quotes (bid > 0, ask > 0). |
| Skip rate | % of window days with no 28–70 DTE expiration or no quotable shorts. |
| Earnings-overlap share (diagnostic, not an exclusion) | % of selected 45-DTE windows that would overlap a scheduled earnings date known at day `d`. The liquidity ranking itself does not drop earnings days; a later condor-eligibility pass rejects overlapping holdings, per the standing sequencing rule. |

### 3.5 Sorting rule

Sort ascending by **median relative spread on the ±16Δ shorts**,
then descending by **quote availability on the shorts**,
then descending by **median short volume**.

No hard pass/fail threshold is pre-committed in this ranking. Liquidity is
a hard eligibility gate in the wider iron-condor study, not a score to be
compensated by premium or correlation — but the gate thresholds for this
universe should be set from the observed distribution after the pull
(e.g. quartiles of the relative-spread distribution), not invented before
any spread is seen. The ranking itself is a sort, not a pass list.

### 3.6 What is NOT in this ranking

- **Open interest is not included.** On the ThetaData Free tier, historical
  OI is unavailable. Historical quote availability, spread, and volume are
  the measurable proxies, labelled as proxies. Today's OI must not be
  applied retrospectively as though it were historically known.
- **Underlying volume is not included.** It appears only in the Appendix,
  as a different metric.
- **Midpoint prices are not fills.** A mid-crossing is a reference only.
  This ranking measures spreads; it does not claim executable fills.
- **Underlying-return correlation is not condor P/L correlation.**
  Nothing in this ranking substitutes one for the other.

## 4. Interpretation constraints carried forward

- **Survivorship:** the 70-name universe is 2026-10 membership applied
  backwards over 2025–2026. Names removed before 2026-10 (e.g. WBA, MMM in
  2024 in the earlier analysis) are absent. Results will be conditional on
  survival and continuous membership, and that bias flatters, not harms,
  the ranking. It must be stated in the completed report, not solved by
  assumption, unless a point-in-time membership series is built.
- **Point-in-time earnings calendar:** still an open work item for the
  wider stock backtest (yfinance covers recent quarters only for 70 names).
  For this liquidity ranking, the earnings-overlap share is diagnostic
  only, pending that calendar.
- **Ex-dividend / early assignment:** not modelled in a liquidity ranking.
  It belongs to the later condor-construction pass, not to spread measurement.
- **Symbol handling to verify at pull time:** BF.B (class-B share) and any
  other non-plain ticker must be verified against the source's symbol
  convention before the pull, not assumed.

## 5. Data source, scale, and blockers

### 5.1 Source

ThetaData Free tier, historical EOD per-contract chains, both rights
(calls and puts — the XSP pull was puts-only; condor/chain work needs both),
via the local Theta Terminal v3. This is the route proven 2026-09-29
(XSP) and 2026-10-23/24 (DIA). Greeks/IV/OI/Quote/Bulk endpoints are not
on Free; IV is computed as in §3.3.

### 5.2 Scale for the last year only (checked arithmetic)

- Per name: ~252 trading days ÷ 5-day windows ≈ 51 windows × 2 rights
  ≈ **102 requests**.
- Full 70 names: ≈ **7,100 requests**, ≈ **4 hours** at the Free-tier
  30 requests/minute, plus throttle overhead and retries.
- Storage: ~65 KB/day/right (XSP calibration) × 252 days × 2 rights
  ≈ **33 MB per name, ~2.3 GB for 70 names**.
- A prioritised first shard (top 15 from `priority_screening.csv`) is
  ≈ 1,530 requests, ≈ 1 hour. The full pull is shardable and resumable
  (per-day parquet caches, skip existing).

This is materially smaller than the full 2023→present pull in Phase G
(~340 requests/name), because the request is for the last year only.

### 5.3 Validation before any ranking is published

Per name, before ranking: (1) no duplicate (expiration, strike, right)
rows per day; (2) holiday exclusion; (3) bid ≤ ask, bid ≥ 0, ask > 0 on
selected strikes; (4) ThetaData underlying price vs. adjusted close
within 1%, splits/dividends investigated on breach; (5) history-depth
recorded per name (KVUE, spun off in 2023, is not a depth concern for a
last-year window, but the check still runs); (6) quote-availability
proxy labelled as a proxy, never as OI.

### 5.4 Exact blockers — no other step is missing

1. **Entitlement re-verification at pull time.** Free tier was verified
   2026-09-29. A portal re-verification attempt on 2026-10-24 did not
   complete (saved-login sign-in consent timed out unapproved; nothing
   was viewed or changed). The later DIA pull functionally confirmed
   access for that pull, but that is not a completed portal plan
   re-verification. The plan must be re-confirmed at pull time.
2. **Terminal transport re-staging.** No Theta Terminal process is
   running now. The 2026-09-29 IPv4 + DNS-shim + local CONNECT-forwarder
   route must be re-staged before the pull.
3. **A fresh single-use API key, via the authorised route only.**
   The 2026-09-29 key was deleted and revoked. A new key must be
   portal-generated, single-use, used only as a process environment
   variable, never written to disk, logs, scripts, or reports, and
   revoked in the portal immediately after the pull. No key is requested
   in this report, and no subscription is to be bought or changed without
   explicit authorisation.

A historical EOD pull does not require market hours, unlike a live
strike-level Gate D run. Today being Saturday does not itself block the
pull; items 1–3 above do.

### 5.5 Next step when unblocked

Dry run on 2 names × 1 month (parse, holiday handling, 45-DTE selection,
spread computation), then the prioritised shard, then the full 70, then
the ranking table in the format of §3.4–§3.5 with the §4 caveats attached.
No live Gate D run and no ETF-study artifact is touched by this work.

## 6. Appendix — interim ranking ONLY (not the requested metric)

**Source:** `ic-portfolio/aristocrats/liquidity_cheap.csv`, 2026-10-12
snapshot. **Metric:** 60-day underlying average daily volume (ADV),
**not** options spread, volume, or open interest.
**Expiration columns:** total listed expirations and expirations in the
20–75 DTE window on that snapshot date; Strict B/C = ≥6 expirations with
≥2 in 20–75 DTE.

Read this table as "which Aristocrat underlyings traded most heavily on
2026-10-12 and had how many expirations listed then." It does **not**
answer which 45-DTE options chains were most liquid over the last year,
and the order below must not be quoted as the options-chain ranking.
In particular, high underlying ADV does not imply tight options spreads,
and the 20 names failing Strict B/C on the snapshot are not thereby
failed on historical chain liquidity — that is exactly what the §3 pull
would test.

| Rank (ADV) | Symbol | Sector | 60d ADV | Expirations | In 20–75 DTE | Strict B/C |
|---:|---|---|---:|---:|---:|:---:|
| 1 | WMT | Consumer Staples | 23,857,090 | 16 | 5 | Yes |
| 2 | KVUE | Consumer Staples | 22,009,920 | 17 | 5 | Yes |
| 3 | KO | Consumer Staples | 15,562,285 | 18 | 5 | Yes |
| 4 | MDT | Health Care | 14,376,210 | 16 | 5 | Yes |
| 5 | XOM | Energy | 13,667,088 | 17 | 5 | Yes |
| 6 | NEE | Utilities | 11,322,635 | 15 | 5 | Yes |
| 7 | ABT | Health Care | 8,852,013 | 17 | 5 | Yes |
| 8 | PG | Consumer Staples | 8,534,565 | 16 | 5 | Yes |
| 9 | CVX | Energy | 8,390,531 | 15 | 5 | Yes |
| 10 | PEP | Consumer Staples | 8,352,165 | 15 | 5 | Yes |
| 11 | FAST | Industrials | 6,966,695 | 11 | 2 | Yes |
| 12 | JNJ | Health Care | 6,799,878 | 17 | 5 | Yes |
| 13 | O | Real Estate | 6,677,061 | 9 | 2 | Yes |
| 14 | IBM | Information Technology | 6,378,990 | 19 | 5 | Yes |
| 15 | MCD | Consumer Discretionary | 5,193,440 | 15 | 5 | Yes |
| 16 | HRL | Consumer Staples | 4,869,266 | 12 | 5 | Yes |
| 17 | CL | Consumer Staples | 4,763,423 | 16 | 5 | Yes |
| 18 | ABBV | Health Care | 4,742,571 | 16 | 5 | Yes |
| 19 | BEN | Financials | 3,999,888 | 5 | 1 | No |
| 20 | TGT | Consumer Discretionary | 3,954,138 | 17 | 5 | Yes |
| 21 | KMB | Consumer Staples | 3,903,510 | 16 | 5 | Yes |
| 22 | ADM | Consumer Staples | 3,725,611 | 9 | 2 | Yes |
| 23 | SYY | Consumer Staples | 3,711,031 | 11 | 2 | Yes |
| 24 | AMCR | Materials | 3,528,766 | 6 | 1 | No |
| 25 | MKC | Consumer Staples | 3,276,921 | 9 | 2 | Yes |
| 26 | LOW | Consumer Discretionary | 3,146,036 | 15 | 5 | Yes |
| 27 | PNR | Industrials | 3,140,830 | 6 | 1 | No |
| 28 | CLX | Consumer Staples | 2,872,638 | 7 | 1 | No |
| 29 | EMR | Industrials | 2,620,836 | 15 | 5 | Yes |
| 30 | CAT | Industrials | 2,615,445 | 18 | 5 | Yes |
| 31 | ALB | Materials | 2,373,235 | 18 | 5 | Yes |
| 32 | BF.B | Consumer Staples | 2,361,071 | 6 | 2 | Yes |
| 33 | ES | Utilities | 2,321,416 | 4 | 1 | No |
| 34 | BRO | Financials | 2,271,001 | 4 | 2 | No |
| 35 | ED | Utilities | 2,222,276 | 6 | 1 | No |
| 36 | ADP | Information Technology | 2,205,430 | 17 | 5 | Yes |
| 37 | LIN | Materials | 2,078,513 | 10 | 2 | Yes |
| 38 | AFL | Financials | 2,028,306 | 16 | 5 | Yes |
| 39 | CTAS | Industrials | 1,992,608 | 15 | 4 | Yes |
| 40 | SPGI | Financials | 1,930,565 | 17 | 5 | Yes |
| 41 | CHRW | Industrials | 1,903,895 | 10 | 1 | No |
| 42 | CHD | Consumer Staples | 1,827,843 | 4 | 1 | No |
| 43 | SWK | Industrials | 1,816,583 | 9 | 1 | No |
| 44 | CAH | Health Care | 1,794,990 | 14 | 5 | Yes |
| 45 | BDX | Health Care | 1,779,073 | 8 | 2 | Yes |
| 46 | SHW | Materials | 1,766,318 | 9 | 2 | Yes |
| 47 | CB | Financials | 1,697,673 | 11 | 2 | Yes |
| 48 | PPG | Materials | 1,677,616 | 16 | 5 | Yes |
| 49 | TROW | Financials | 1,652,590 | 9 | 2 | Yes |
| 50 | AOS | Industrials | 1,514,013 | 4 | 1 | No |
| 51 | NUE | Materials | 1,361,393 | 10 | 2 | Yes |
| 52 | SJM | Consumer Staples | 1,313,456 | 6 | 1 | No |
| 53 | ITW | Industrials | 1,297,300 | 6 | 2 | Yes |
| 54 | ECL | Materials | 1,291,780 | 7 | 2 | Yes |
| 55 | DOV | Industrials | 1,208,788 | 6 | 2 | Yes |
| 56 | GD | Industrials | 1,160,291 | 16 | 5 | Yes |
| 57 | GPC | Consumer Discretionary | 1,134,706 | 8 | 2 | Yes |
| 58 | APD | Materials | 1,069,643 | 7 | 2 | Yes |
| 59 | EXPD | Industrials | 1,032,245 | 4 | 1 | No |
| 60 | ATO | Utilities | 1,031,426 | 4 | 1 | No |
| 61 | FRT | Real Estate | 869,643 | 4 | 1 | No |
| 62 | FDS | Financials | 860,156 | 7 | 2 | Yes |
| 63 | ROP | Industrials | 798,963 | 4 | 1 | No |
| 64 | RGLD | Materials | 678,953 | 6 | 2 | Yes |
| 65 | WST | Health Care | 622,836 | 7 | 2 | Yes |
| 66 | CINF | Financials | 620,486 | 4 | 2 | No |
| 67 | ESS | Real Estate | 494,310 | 4 | 1 | No |
| 68 | NDSN | Industrials | 367,541 | 4 | 2 | No |
| 69 | GWW | Industrials | 262,453 | 13 | 2 | Yes |
| 70 | ERIE | Financials | 256,460 | 4 | 2 | No |

Snapshot counts: 70/70 passed underlying Gate A; 50/70 passed Strict B/C
on 2026-10-12; 70/70 passed relaxed B/C.

## 7.1 Status update — 2026-10-31 16:04 MDT: pull route authorised, code ready

The user authorised the ThetaData pull route for this ranking. The
following preparation is complete; no data has been pulled yet, and no
key exists on this machine:

- Pull driver: `ic-portfolio/scripts/pull_history.py` — adapted from the
  proven DIA route (DNS shim + local CONNECT forwarders + plain JVM,
  no proxychains). Reads the key only from the `THETADATA_API_KEY`
  environment variable, never writes or prints it, aborts if absent.
  Supports `--probe-only` (one recent day per symbol, terminal auth +
  symbol-convention check, including BF.B) and `--symbols` shards.
  Cache: `ic-portfolio/data/chains_hist/<SYM>/thetadata_<date>.parquet`
  (does not exist yet — no Aristocrat chains pulled).
- Analyzer: `ic-portfolio/scripts/analyze_45d_liquidity.py` — implements
  §3 exactly (nearest-45-DTE in 28–70, BS IV inversion with
  r=0.04/q=0.0 stated assumption, ±16Δ/±5Δ picks, sort by median
  relative spread, then availability, then volume). No network calls,
  no key needed. No scipy dependency (erf-based normal CDF, bisection
  IV inversion).
- Regression test: `ic-portfolio/scripts/test_45d_analyzer.py` — PASS
  on mocked chains (TIGHT 2% spread/100% quotable, WIDE 10%,
  SPARSE 2% but 40% quotable; sorted TIGHT, SPARSE, WIDE as designed).
  Run with the project venv (`xsp-study/.venv/bin/python`), which has
  pyarrow; system python has scipy but no pyarrow.
- Terminal staging verified: terminal jar (59 MB, 2026-09-29), bundled
  JDK java binary, and dnsshim.so all present; no terminal process
  running; no stale `vendor/.env` key file; no key in the environment.
- Entitlement: still not portal re-verified (2026-10-24 attempt timed
  out). The built-in first step after the key handoff is
  `--probe-only`, which functionally confirms terminal authentication
  and per-symbol data presence before the ~4-hour full pull — the same
  pattern as the DIA pull, where terminal auth confirmed access.

Remaining blocker, and only blocker: a fresh single-use key via the
authorised route (portal-generated, env-only, revoked in the portal
immediately after the pull). Sequence once handed over: probe-only →
  prioritised shard if probe flags any symbol → full 70 → analyzer →
  final ranking report in §3 format with §4 caveats. No subscription
  purchase or change is included in this authorisation.

### 7.2 Probe result — 2026-10-31 16:17 MDT (updated same day)

Probe-only completed, exit 0, terminal authenticated:

- **69/70 symbols: HTTP 200** on Friday 2026-10-30 puts, row counts
  ranging from 52 (AOS) to 1,794 (CAT). Terminal authentication is
  confirmed; Free-tier access works for this pull.
- **BF.B: HTTP 472, 0 rows** under the dotted form — the only dotted
  ticker in the universe, exactly as flagged in §4.
- Variant probe (same day): BF/B → 472, BF-B → 472, **BFB → HTTP 200,
  66 rows**, BF → 472. So the pull driver maps canonical `BF.B` to
  request symbol `BFB`, cached under `BF.B`, and the full pull now
  covers all 70 names. The dotted form is not used for requests.
- Full last-year pull (both rights, 2025-10-31 → 2026-10-30) started
  after the variant probe, resumable per-day parquet, one bad symbol
  no longer aborts the run (driver now logs and continues).
- First full-pull launch failed immediately (no data pulled) with
  "port 25503 still occupied" — a stale terminal JVM lingering past
  the variant probe, the known 2026-09-29 issue. Port was free on
  recheck, the driver's port guard was hardened (10 attempts, 5 s
  apart, pgrep + fuser kill), and the pull was relaunched: terminal
  is up and responding, first symbol AOS started.
- **Runtime restart, 2026-10-31 ~17:55 MDT:** the running pull was
  killed after 1 h 35 m. Cache audit at restart: 17 symbols complete
  (251 day-files each, = 261 weekdays − 10 NYSE holidays), CB partial
  (186 files, last file 2026-07-30 CALL-only — killed mid-PUT-window),
  4,451 files total, no duplicates in checked files. Two
  source-gap days noted, not holidays: AMCR 2026-01-15 and BDX
  2026-02-10 (present in no file; their windows returned 4 days).
- **Resume bug found and fixed before relaunch:** the driver's
  missing-day check compared lower-case "call"/"put" against
  upper-case "CALL"/"PUT" in the parquet files, so a "resume" would
  have re-pulled everything. Also fixed: merge now writes only days
  that needed that right and deduplicates, and NYSE holidays no
  longer count as missing. Verified offline: AOS first window now
  reports missing = [] for both rights; CB's 2026-07-24..30 window
  reports missing = PUT side only. The resumed pull skips completed
  symbols in ~11 s each (AOS → ABT confirmed) and continues from CB.
  Pace so far (17 symbols in 95 min) implies roughly 4.5–5 h still
  to run, slower than the original ~4 h estimate.
- **Second runtime restart, 2026-10-31 ~20:05 MDT:** the resumed pull
  was killed after 2 h 07 m. Cache audit at restart: 43 symbols
  complete (251 files each, except AMCR 250 and BDX 250 for the two
  source-gap days), JNJ partial (38 files, through 2025-12-24),
  26 symbols remaining, 10,829 files total. Port free, no terminal
  process left. Pull relaunched again with the same (still live)
  key, env-only: terminal up, completed symbols scanning through
  in seconds each (AOS → ABT → ABBV confirmed), then it continues
  from JNJ. Remaining work is JNJ's 213 days plus 26 symbols —
  roughly 2.5 h at the observed pace, restart risk notwithstanding.
- **Third runtime restart, 2026-10-31 ~22:05 MDT:** that pull was
  killed after 1 h 59 m. Cache audit at restart: 61 symbols complete
  by file count (16,276 files), with three single source-gap days
  now known (AMCR 2026-01-15, BDX 2026-02-10, SPGI 2026-07-01);
  TROW partial (215 files, through 2026-09-10, last file CALL-only
  — a reminder that file presence alone does not prove both rights,
  which is why the driver re-checks rights per day on resume);
  TGT, GWW, WMT, WST, RGLD not yet started. Remaining: TROW's
  36 days plus those 5 symbols, roughly 30–40 min at the observed
  pace. Pull relaunched again, same key still live, terminal up
  and scanning completed symbols.
  **Do not revoke the key until the all-clear after pull + analysis
  + machine sweep.**

### 7.3 Pull complete — 2026-10-31 22:36 MDT, validation

The final relaunch printed "pull complete", exit 0, last symbol RGLD
through 2026-10-30. Validation over all 70 symbols:

- 17,567 day-files (70 × 251 trading days − 3 source-gap days),
  13,346,514 contract-day rows, 0 duplicates, 0 negative quotes,
  0 file-date/bar-date mismatches.
- 1 crossed quote in the whole pull (CAT, single row) — dropped by
  the analyzer, not allowed to enter a spread median as a negative.
- Source-gap days (options chain absent, underlying traded):
  AMCR 2026-01-15, BDX 2026-02-10, SPGI 2026-07-01. These count as
  skips in the analyzer, never filled forward.
- **Underlying price: null for 100% of ThetaData rows** — the same
  vendor quirk as DIA. Delta estimation therefore uses Yahoo
  Finance unadjusted closes (17,570 rows, 251 per symbol, fetched
  with no key), validated against the existing adjusted series:
  old/new close ratios tend to 1.0 at the Oct 12 download date and
  are lower earlier by cumulative dividends, confirming the old
  series is adjusted and the Yahoo series is the unadjusted spot
  delta needs. Analyzer was also optimised before running
  (two-stage delta shortlist instead of inverting every contract;
  crossed rows filtered; availability denominator is 251 trading
  days, not 261 weekdays).
- Analyzer run is in progress at the time of this note; the final
  ranking below is still pending.
- Machine sweep (interim, 2026-10-31 22:43 MDT): no `vendor/.env`
  file exists; a `td1_` pattern search over `ic-portfolio/`,
  terminal vendor logs, and `your_files/` found no files; the only
  `THETADATA_API_KEY=` hits are the variable-name usage examples
  in `pull_history.py`'s docstring, not a key value. The sweep
  result is clean as far as it goes, but the revoke all-clear is
  still withheld until the analyzer and final ranking are delivered.
  **Do not revoke the key yet.**

## 7. Open questions the evidence could not answer

- What are the actual median 45-DTE relative spreads, quote-availability
  rates, and short volumes per Aristocrat over 2025-10-31 → 2026-10-30?
- Does the options-chain ranking preserve, invert, or scramble the
  underlying-ADV order in the Appendix?
- What fraction of 45-DTE windows overlap earnings known at selection,
  per name?
- What spread-distribution thresholds would constitute a defensible
  hard liquidity gate for this universe?

All four require the §5 pull. None is answered by the Appendix.

## 8. Final results — 45-DTE chain liquidity ranking, 2025-10-31 → 2026-10-30

Analyzer run completed 2026-10-31 22:48 MDT, exit 0, in ~6 minutes
(two-stage delta shortlist; crossed rows filtered; availability
denominator 251 trading days). Every symbol had a chain on every
trading day except the three source-gap days (AMCR, BDX, SPGI —
250 days with chain each), and `days_no_underlying = 0` for all
70 after the external Yahoo spot series was applied. Duplicate
rows 0 for all; crossed rows 1 in the whole pull (CAT, filtered).

### 8.1 Headline finding — negative, and it matters

Even the best Aristocrat 45-DTE 16Δ short has a **median relative
spread of 28%** (CLX, 0.279). The top 10 run 28–39%, the median
name runs ~65%, and the bottom 10 run 100–158%. These are
far-out-of-the-money, low-premium contracts, so a wide relative
spread is expected — but a 28% best case means the spread is
the dominant cost for any short-vol construction on these
names, before fees. Under the study's own guardrail, midpoint
is a reference only: no name here demonstrates a tight,
routinely executable 45-DTE condor short leg. Wing (5Δ) spreads
are worse everywhere they are quotable at all (median 63–160%
in the top half; NaN for CHD, ATO, ERIE, which never had both
wings quotable on the same day).

### 8.2 What the ranking does and does not say

- **Chain availability is not the binding constraint.**
  `days_with_chain` is 251/251 for 67 names and 250/251 for the
  three source-gap names. What varies is *quotability*: both 16Δ
  shorts having bid > 0 and ask > 0 on the same day.
- **The sort is by median relative spread first.** Availability
  is only a tiebreaker, so a mid-table spread can hide terrible
  quotability. The clearest cases: KVUE (rank 38, spread 0.667)
  is quotable only 39/251 days (15.5%); ATO (rank 66) only
  13/251 (5.2%); FRT (rank 67) only 15/251 (6.0%). Their medians
  are computed over those few quotable days only and are not
  comparable in reliability to a 250-day median.
- **Median short volume is 0 for most names.** That is the
  median daily contract volume on the two short legs: on more
  than half of quotable days, those strikes did not trade at
  all. The exceptions are O (91), CLX (49), KMB (19), CVX
  (18), MKC (15), ADM (14), WMT (14), PG (14). Volume here is
  a proxy, not open interest — OI is unavailable on Free.
- **Dollar spread and relative spread diverge on high-price
  names.** CAT's median dollar spread is $3.48 but its
  relative spread is 0.382 (rank 9); GWW $7.20 / 0.740 (rank
  43); ROP $5.70 / 1.469 (rank 68). Rank by relative spread,
  as the protocol specifies, but a condor's dollar cost is
  what a portfolio pays — both columns are in the table.
- **Spot-check audit (2026-10-30, 49-DTE chain):** O shorts
  0.25/0.29 relative spread, close to its 0.286 median; ESS
  shorts 1.42/0.92, consistent with its rank-70 spread; KVUE
  both shorts bid = 0 that day, consistent with its 15.5%
  quotability. The analyzer's picks behave as specified.
- **No Gate threshold is applied.** None was pre-committed,
  and the distribution gives no natural break: spreads rise
  smoothly from 0.279 to 1.583. Any eligibility cut (e.g.
  relative spread < 0.50 and availability > 0.80) would be a
  post-hoc policy choice for Phase B, not a finding of this
  report. For reference, 19 names sit below 0.50 median
  relative spread, and all 19 also have availability above
  0.80: CLX, O, CVX, NUE, ADM, MCD, IBM, XOM, CAT, TGT, SWK,
  SHW, WMT, PG, ABBV, APD, TROW, KO, PEP. (SJM at 0.500 and
  LOW at 0.516 are just outside the spread cut.)
- **Caveats from §4 still apply in full:** 2026-10 membership
  applied backwards (survivorship flatters the ranking);
  deltas are model-estimated (Black-Scholes, r = 0.04, q = 0.0,
  IV inverted from EOD mid); spreads are EOD snapshots, not
  intraday execution; BF.B was pulled as BFB; earnings
  overlap is not included (calendar still open); OI is
  unavailable; midpoint is never a fill.

### 8.3 Full ranked table (70 names)

Sort: median relative spread on shorts ASC → quote availability
DESC → median short volume DESC. Spreads are fractions of mid
(0.279 = 27.9%). `q_avail` = quotable short days / 251.
`wing_rel` = median relative spread on 5Δ wings over days both
wings were quotable (NaN = never).

| rank | sym | rel_spread | q_avail | quot_days | $spread | med_vol | depth | wing_rel | wing_avail | skip_rate |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | CLX | 0.279 | 0.996 | 250 | 0.25 | 49 | 32 | 1.000 | 0.466 | 0.004 |
| 2 | O | 0.286 | 0.960 | 241 | 0.10 | 91 | 25 | 0.667 | 0.287 | 0.040 |
| 3 | CVX | 0.292 | 0.908 | 228 | 0.42 | 18 | 48 | 0.743 | 0.582 | 0.092 |
| 4 | NUE | 0.295 | 1.000 | 251 | 0.68 | 8 | 52 | 0.869 | 0.713 | 0.000 |
| 5 | ADM | 0.343 | 1.000 | 251 | 0.25 | 14 | 38 | 1.000 | 0.574 | 0.000 |
| 6 | MCD | 0.359 | 0.956 | 240 | 0.60 | 12 | 61 | 0.932 | 0.514 | 0.044 |
| 7 | IBM | 0.374 | 1.000 | 251 | 1.05 | 8 | 71 | 0.633 | 0.606 | 0.000 |
| 8 | XOM | 0.381 | 0.845 | 212 | 0.48 | 26 | 55 | 0.731 | 0.454 | 0.155 |
| 9 | CAT | 0.382 | 1.000 | 251 | 3.48 | 2 | 161 | 0.736 | 0.629 | 0.000 |
| 10 | TGT | 0.393 | 0.940 | 236 | 0.51 | 4 | 65 | 0.857 | 0.542 | 0.060 |
| 11 | SWK | 0.400 | 0.968 | 243 | 0.40 | 4 | 43 | 1.200 | 0.175 | 0.032 |
| 12 | SHW | 0.418 | 0.992 | 249 | 1.10 | 4 | 43 | 1.219 | 0.131 | 0.008 |
| 13 | WMT | 0.423 | 0.908 | 228 | 0.38 | 14 | 69 | 0.706 | 0.510 | 0.092 |
| 14 | PG | 0.453 | 0.801 | 201 | 0.41 | 14 | 48 | 0.873 | 0.363 | 0.199 |
| 15 | ABBV | 0.457 | 0.900 | 226 | 0.83 | 7 | 53 | 0.824 | 0.335 | 0.100 |
| 16 | APD | 0.480 | 0.988 | 248 | 1.05 | 4 | 41 | 1.176 | 0.143 | 0.012 |
| 17 | TROW | 0.483 | 0.928 | 233 | 0.40 | 12 | 31 | 1.038 | 0.183 | 0.072 |
| 18 | KO | 0.495 | 0.857 | 215 | 0.21 | 10 | 45 | 1.037 | 0.470 | 0.143 |
| 19 | PEP | 0.499 | 0.829 | 208 | 0.48 | 8 | 48 | 0.975 | 0.414 | 0.171 |
| 20 | SJM | 0.500 | 0.924 | 232 | 0.45 | 4 | 32 | 1.429 | 0.215 | 0.076 |
| 21 | MKC | 0.507 | 0.960 | 241 | 0.20 | 15 | 19 | 1.000 | 0.155 | 0.040 |
| 22 | LOW | 0.516 | 0.960 | 241 | 1.00 | 2 | 53 | 1.070 | 0.287 | 0.040 |
| 23 | JNJ | 0.516 | 0.845 | 212 | 0.80 | 12 | 51 | 1.313 | 0.438 | 0.155 |
| 24 | RGLD | 0.544 | 0.992 | 249 | 1.60 | 3 | 52 | 1.333 | 0.303 | 0.008 |
| 25 | CHRW | 0.567 | 0.972 | 244 | 1.00 | 0 | 45 | 1.595 | 0.175 | 0.028 |
| 26 | ABT | 0.567 | 0.602 | 151 | 0.46 | 14 | 55 | 0.955 | 0.207 | 0.398 |
| 27 | SYY | 0.571 | 0.892 | 224 | 0.30 | 3 | 34 | 1.200 | 0.171 | 0.108 |
| 28 | ITW | 0.580 | 0.928 | 233 | 0.95 | 2 | 36 | 1.364 | 0.076 | 0.072 |
| 29 | KMB | 0.584 | 0.454 | 114 | 0.45 | 19 | 55 | 1.200 | 0.120 | 0.546 |
| 30 | ALB | 0.587 | 0.988 | 248 | 1.52 | 0 | 73 | 0.932 | 0.506 | 0.012 |
| 31 | BDX | 0.594 | 0.709 | 178 | 0.85 | 2 | 41 | 1.351 | 0.088 | 0.291 |
| 32 | CB | 0.596 | 0.972 | 244 | 1.20 | 2 | 70 | 1.279 | 0.175 | 0.028 |
| 33 | MDT | 0.612 | 0.494 | 124 | 0.41 | 8 | 49 | 1.523 | 0.112 | 0.506 |
| 34 | ECL | 0.626 | 0.972 | 244 | 1.20 | 3 | 38 | 1.414 | 0.124 | 0.028 |
| 35 | FDS | 0.642 | 0.964 | 242 | 2.30 | 1 | 55 | 1.333 | 0.371 | 0.036 |
| 36 | NEE | 0.661 | 0.761 | 191 | 0.42 | 2 | 51 | 1.116 | 0.239 | 0.239 |
| 37 | FAST | 0.667 | 0.721 | 181 | 0.25 | 5 | 24 | 1.200 | 0.076 | 0.279 |
| 38 | KVUE | 0.667 | 0.155 | 39 | 0.11 | 10 | 28 | 0.873 | 0.048 | 0.845 |
| 39 | LIN | 0.667 | 0.984 | 247 | 2.35 | 3 | 100 | 1.423 | 0.215 | 0.016 |
| 40 | DOV | 0.667 | 0.964 | 242 | 1.15 | 0 | 39 | 1.288 | 0.155 | 0.036 |
| 41 | BF.B | 0.667 | 0.426 | 107 | 0.20 | 4 | 15 | 1.136 | 0.012 | 0.574 |
| 42 | GPC | 0.732 | 0.996 | 250 | 0.80 | 1 | 36 | 1.692 | 0.072 | 0.004 |
| 43 | GWW | 0.740 | 1.000 | 251 | 7.20 | 0 | 84 | 1.767 | 0.390 | 0.000 |
| 44 | AOS | 0.743 | 0.550 | 138 | 0.35 | 1 | 18 | 1.578 | 0.016 | 0.450 |
| 45 | CINF | 0.750 | 0.944 | 237 | 0.80 | 0 | 35 | 1.721 | 0.056 | 0.056 |
| 46 | EMR | 0.752 | 0.414 | 104 | 1.10 | 4 | 58 | 1.127 | 0.044 | 0.586 |
| 47 | ED | 0.769 | 0.637 | 160 | 0.45 | 3 | 27 | 1.236 | 0.056 | 0.363 |
| 48 | ES | 0.783 | 0.649 | 163 | 0.35 | 2 | 19 | 1.333 | 0.048 | 0.351 |
| 49 | CL | 0.783 | 0.498 | 125 | 0.45 | 4 | 44 | 1.333 | 0.060 | 0.502 |
| 50 | WST | 0.802 | 0.964 | 242 | 2.75 | 0 | 48 | 1.544 | 0.088 | 0.036 |
| 51 | BEN | 0.812 | 0.510 | 128 | 0.20 | 1 | 29 | 1.111 | 0.040 | 0.490 |
| 52 | AFL | 0.815 | 0.355 | 89 | 0.50 | 1 | 54 | 1.171 | 0.060 | 0.645 |
| 53 | ADP | 0.816 | 0.841 | 211 | 1.73 | 0 | 51 | 1.183 | 0.112 | 0.159 |
| 54 | CTAS | 0.817 | 0.681 | 171 | 1.25 | 0 | 44 | 1.528 | 0.052 | 0.319 |
| 55 | AMCR | 0.824 | 0.522 | 131 | 0.35 | 1 | 31 | 1.127 | 0.040 | 0.478 |
| 56 | HRL | 0.857 | 0.386 | 97 | 0.15 | 2 | 25 | 0.667 | 0.024 | 0.614 |
| 57 | PNR | 0.866 | 0.737 | 185 | 0.65 | 0 | 35 | 1.000 | 0.016 | 0.263 |
| 58 | PPG | 0.900 | 0.462 | 116 | 0.90 | 0 | 36 | 1.474 | 0.024 | 0.538 |
| 59 | CHD | 0.984 | 0.438 | 110 | 0.65 | 0 | 24 | NaN | 0.000 | 0.562 |
| 60 | CAH | 0.984 | 0.896 | 225 | 1.90 | 0 | 49 | 1.319 | 0.096 | 0.104 |
| 61 | BRO | 1.000 | 0.323 | 81 | 0.57 | 2 | 20 | 1.417 | 0.012 | 0.677 |
| 62 | GD | 1.116 | 0.809 | 203 | 2.70 | 0 | 63 | 1.247 | 0.040 | 0.191 |
| 63 | EXPD | 1.123 | 0.538 | 135 | 1.65 | 0 | 32 | 1.741 | 0.004 | 0.462 |
| 64 | NDSN | 1.167 | 0.757 | 190 | 2.60 | 0 | 37 | 1.428 | 0.004 | 0.243 |
| 65 | SPGI | 1.300 | 0.522 | 131 | 4.40 | 0 | 71 | 1.540 | 0.096 | 0.478 |
| 66 | ATO | 1.462 | 0.052 | 13 | 1.50 | 0 | 28 | NaN | 0.000 | 0.948 |
| 67 | FRT | 1.464 | 0.060 | 15 | 0.85 | 0 | 25 | 1.528 | 0.004 | 0.940 |
| 68 | ROP | 1.469 | 0.876 | 220 | 5.70 | 0 | 45 | 1.902 | 0.104 | 0.124 |
| 69 | ERIE | 1.513 | 0.649 | 163 | 4.25 | 0 | 37 | NaN | 0.000 | 0.351 |
| 70 | ESS | 1.583 | 0.295 | 74 | 3.12 | 0 | 33 | 1.271 | 0.032 | 0.705 |

Source data: `~/workspace/ic-portfolio/data/liquidity_45d.csv`
(70 rows, generated by `analyze_45d_liquidity.py`); underlying
closes: `~/workspace/ic-portfolio/data/underlying_closes.csv`
(Yahoo unadjusted closes, 17,570 rows).