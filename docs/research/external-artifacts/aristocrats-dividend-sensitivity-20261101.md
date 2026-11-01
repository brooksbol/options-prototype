# Dividend-aware sensitivity check — Aristocrat covered-call deltas

A sensitivity check run **before** any assignment-exposure
comparison across deltas, as instructed. It is not itself an
assignment comparison: no assignment outcomes, probabilities, or
early-exercise events are modelled here. Its job is to measure
how much the prior analyses' q = 0.0 assumption distorts the
delta labels and the execution figures, and to state what the
assignment comparison must therefore do differently.

Baseline (both prior analyses): Black-Scholes, r = 0.04,
q = 0.0, IV inverted from the EOD mid, deltas model-estimated.
Sensitivity: same r, but q = trailing-12-month dividend yield
on that day, point-in-time — sum of Yahoo dividend events in
the prior 365 days divided by that day's spot — with IV
re-inverted under the same q, so the q-aware delta is
internally consistent. Yahoo dividend event dates are taken as
ex-dates, as Yahoo reports them; amounts are as reported. That
date convention is a stated assumption, not a verified filing
check, and the assignment model should verify ex-dates from an
exchange/issuer source before use.

## 1. Yields in the subset

Median trailing yield by name ranges from 0.77% (CAT) and 0.82%
(WMT) to 5.28% (O), 4.92% (TROW), and 4.89% (CLX). The median
name sits at 2.75%. Seven names are at or above 3.6%: O, TROW,
CLX, SWK, PEP, CVX, TGT. If dividend sensitivity matters
anywhere, it matters there first — and the results below
confirm that ordering.

## 2. Label bias: the q = 0 pick's true q-aware delta

For each baseline pick, its delta was recomputed with q-aware
IV. Pooled over both-quotable days:

| target | median true q-aware delta | median bias (points) | p10–p90 of true delta |
|---:|---:|---:|---:|
| 10Δ | 0.098 | −0.002 | 0.077–0.118 |
| 15Δ | 0.146 | −0.004 | 0.117–0.174 |
| 20Δ | 0.194 | −0.006 | 0.158–0.227 |

The median bias is small — a "20Δ" call in the prior reports
behaves like a ~19Δ call on a typical day. But the median hides
the high-yield tail. At 20Δ, the median bias is −0.032 for O
(true delta 0.168), −0.023 for TROW (0.177), and −0.017 for CLX
(0.183); at 10Δ, O's bias is −0.014 (true 0.086). Direction is
as theory predicts: with q > 0, a given strike's call delta is
lower, so the q = 0 pick sits further out-of-the-money than its
label claims. For assignment purposes that means the prior
labels **understate** the strike closeness a true 20Δ (or 10Δ)
would require, and therefore understate the assignment
exposure of a true-delta arm — most for O, TROW, and CLX, least
for CAT, WMT, SHW, and NUE (q ≤ 1.0%).

The p10–p90 spread is not pure q bias: it also contains strike-
grid error. Strikes are discrete ($2.50 steps for O, $5 for many
others), so the nearest available strike is often the only
candidate near a target, and its delta can sit several points
from the target even before dividends enter. The assignment
comparison must therefore report the actual q-aware delta
distribution, not just the target label.

## 3. Pick changes: rare, but large when they happen

Across both-quotable days (12,870 day-delta rows), the q-aware
pick differs from the baseline pick on only **5.1%** of days:
3.2% at 10Δ (median across names), 5.6% at 15Δ, 6.0% at 20Δ.
Quotability is essentially unchanged (10Δ: 3,836 baseline vs
3,829 q-aware quotable days; 15Δ: 4,458 vs 4,461; 20Δ: 4,651
vs 4,660).

Conditional on a change (650 days), the effect is large:

- Strike shift: median −2.5% of spot (down one grid step in
  the usual case), mean −2.4%, range −10.1% to +5.3%.
  88% of changes move the strike down, as dividend theory
  predicts; 12% move it up. The up moves are not a dividend
  effect — they arise when re-inverting IV under q changes the
  shortlist on a coarse grid — and are reported, not hidden.
- Annualised bid yield ratio (q-aware / baseline): median
  1.72×, mean 2.75×. A one-step-lower strike carries a much
  larger premium, especially for low-premium 10Δ calls.
- Relative spread change: median −12.6 points, mean −18.0
  points (the lower strike is more liquid).

Because >94% of days are unchanged, the **median paired**
difference is zero at every delta — that is the correct paired
reading, and it is not "no effect". The mean paired
differences are +0.04 points (10Δ), +0.12 points (15Δ), and
+0.20 points (20Δ) of annualised bid yield. And the O 10Δ case
shows why differences of medians must not be used here:
O's median relative spread moves from 0.667 (baseline) to
0.500 (q-aware) on only 12 changed days, because spread values
are discrete and the median sits on a bin edge. Paired
differences, not differences of medians, are the sensitivity
metric throughout this report.

## 4. Aggregate execution conclusions are unchanged

Cross-name medians of per-name medians, baseline vs q-aware
(both-quotable days):

| delta | ann bid, baseline | ann bid, q-aware | rel spread, baseline | rel spread, q-aware |
|---:|---:|---:|---:|---:|
| 10Δ | 0.022 | 0.023 | 0.667 | 0.667 |
| 15Δ | 0.041 | 0.041 | 0.504 | 0.500 |
| 20Δ | 0.061 | 0.061 | 0.378 | 0.376 |

The prior execution comparison — 15Δ capturing ~65% of the
20Δ premium rate, 10Δ roughly a third — survives dividend
adjustment at the aggregate level to within 0.1 points of
annualised yield. Dividend sensitivity is a labelling and
per-name problem, not a reason to revise the aggregate
execution ranking. Per-name arms for high-yield names are
where it bites.

## 5. Discrete ex-div exposure: the channel q does not capture

A continuous yield smooths dividends over the year. Early
exercise does not work that way: an American call holder
exercises just before an ex-div date if the dividend exceeds
the call's remaining time value and the call is in-the-money
at that moment. Whether that condition holds is unmeasured
here — moneyness at the ex-div date is a future price path —
but the size and frequency of the dividend at stake can be
measured, and both are large enough that the assignment model
cannot ignore the calendar:

- Holdings spanning at least one ex-div: median **46%** of
  45-DTE holding windows for quarterly payers (range 37% for
  IBM to 57% for TROW). Quarterly holdings never span two
  ex-divs (mean 0.46 ex-divs per holding); the holding is
  shorter than the dividend cycle.
- **O is categorically different: 99.6% of holdings span an
  ex-div** (250 of 251 entry days), mean 1.31 ex-divs per
  holding — 172 holdings span one, 78 span two, 1 spans none.
  Monthly dividends mean the early-exercise check fires
  roughly monthly, not quarterly.
- Dividend size inside the holding, vs the 20Δ entry bid
  premium, on spanning holdings only: median ratio **1.02**,
  and the ratio exceeds 1 on **50.5%** of spanning holdings.
  Highest: TROW 2.31×, PEP 1.81×, KO 1.43×, O 1.36× (in-window
  dividend sum), CLX 1.31×, PG 1.30×, CVX 1.28×. Lowest: CAT
  0.19×, NUE 0.25×, WMT 0.26×, SHW 0.33×. In other words, for
  about half of dividend-spanning holdings the dividend(s)
  at stake exceed the entire premium collected at entry —
  and remaining time value at the ex-div date will be smaller
  than entry premium, so this comparison, if anything,
  understates the incentive at the decision date. It does
  not establish that exercise happens: that also requires
  the call to be in-the-money at that date, which this check
  does not model.

Median days from entry to the next ex-div (42–47 days for
quarterly payers, 15.5 days for O) simply reflects the
dividend cycle and is a sanity check, not a finding.

## 6. What the assignment comparison must do (requirements)

1. **Label with q-aware deltas.** Use trailing-12m yield,
   point-in-time, IV re-inverted under the same q, for every
   arm. Do not reuse the q = 0 labels and do not compare
   assignment across names on q = 0 labels: O's "20Δ" is
   16.8Δ, CAT's is 19.8Δ, and that gap is a labelling
   artefact, not an economic difference.
2. **Model early exercise discretely, per ex-div date.**
   At each ex-div inside a holding, test dividend vs
   remaining extrinsic value with the call's moneyness on
   that date. Continuous q must not be presented as the
   early-exercise model — it captures delta drift, not the
   jump at the ex-date.
3. **Split by ex-div exposure.** Report assignment exposure
   separately for holdings spanning an ex-div vs not, and
   for O separately from quarterly payers. With ~46% of
   quarterly holdings and ~100% of O holdings spanning, an
   unsplit average mixes two different regimes.
4. **Report actual deltas, not just targets.** Include the
   q-aware delta distribution per arm (median, p10–p90),
   because grid error alone moves a label by several points.
5. **Keep the execution baseline, but re-run arms with
   q-aware picks.** Aggregate execution medians will barely
   move (§4); per-name assignment arms for O, TROW, CLX,
   SWK, PEP, CVX, and TGT will, because their picks change
   most and their dividends are largest relative to premium.
6. **Verify ex-dates before any assignment claim.** Yahoo
   event dates are used here for sensitivity only. The
   assignment model should confirm ex-dates and amounts
   against an exchange or issuer source, particularly for O's
   monthly schedule.

## 7. Caveats

- Sensitivity uses one q per day (trailing yield). A forward
  yield (next announced dividend annualised) would differ
  slightly where dividends were raised during the window;
  the direction and ordering of the results would not change,
  but per-name q values would shift by tenths of a point.
- Dividend events are cash dividends as reported by Yahoo.
  Splits, special dividends, and return-of-capital treatment
  are not separated here; none of the 19 shows a dividend
  pattern suggesting a special payout in the window (all
  quarterly payers show exactly 4 events, O shows 13 monthly
  events), but issuer verification remains a requirement
  under §6.6.
- This check covers the 19-name conditional subset only, as
  in the prior reports. It does not generalise to all
  Aristocrats, and it makes no assignment, return, or
  strategy claim.

## 8. Per-name table (summary)

`q` = median trailing yield. `changed` = share of
both-quotable days where the q-aware pick differs.
`trueΔ` = median q-aware delta of the baseline pick.
`bias` = trueΔ − target. `annΔ` = mean paired annualised
bid-yield difference (q-aware − baseline), in points.
`span` = share of holdings spanning ≥1 ex-div.
`div/bid` = median in-window dividend sum / 20Δ entry bid,
on spanning holdings only.

| sym | q | delta | changed | trueΔ | bias | annΔ | span | div/bid |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ABBV | 0.029 | 10Δ | 0.022 | 0.097 | -0.003 | +0.0004 | 0.526 | 1.01 |
| ABBV | 0.029 | 15Δ | 0.063 | 0.143 | -0.007 | +0.0014 | 0.526 | 1.01 |
| ABBV | 0.029 | 20Δ | 0.060 | 0.193 | -0.007 | +0.0023 | 0.526 | 1.01 |
| ADM | 0.028 | 10Δ | 0.008 | 0.096 | -0.004 | +0.0001 | 0.454 | 0.80 |
| ADM | 0.028 | 15Δ | 0.032 | 0.144 | -0.006 | +0.0009 | 0.454 | 0.80 |
| ADM | 0.028 | 20Δ | 0.060 | 0.194 | -0.006 | +0.0026 | 0.454 | 0.80 |
| APD | 0.025 | 10Δ | 0.032 | 0.100 | -0.000 | +0.0002 | 0.466 | 0.95 |
| APD | 0.025 | 15Δ | 0.024 | 0.147 | -0.003 | +0.0009 | 0.466 | 0.95 |
| APD | 0.025 | 20Δ | 0.036 | 0.189 | -0.011 | +0.0015 | 0.466 | 0.95 |
| CAT | 0.008 | 10Δ | 0.056 | 0.098 | -0.002 | -0.0003 | 0.458 | 0.19 |
| CAT | 0.008 | 15Δ | 0.064 | 0.147 | -0.003 | +0.0002 | 0.458 | 0.19 |
| CAT | 0.008 | 20Δ | 0.040 | 0.198 | -0.002 | +0.0001 | 0.458 | 0.19 |
| CLX | 0.049 | 10Δ | 0.039 | 0.097 | -0.003 | +0.0011 | 0.438 | 1.31 |
| CLX | 0.049 | 15Δ | 0.052 | 0.142 | -0.008 | +0.0019 | 0.438 | 1.31 |
| CLX | 0.049 | 20Δ | 0.040 | 0.183 | -0.017 | +0.0025 | 0.438 | 1.31 |
| CVX | 0.037 | 10Δ | 0.038 | 0.099 | -0.001 | +0.0006 | 0.426 | 1.28 |
| CVX | 0.037 | 15Δ | 0.070 | 0.146 | -0.004 | +0.0018 | 0.426 | 1.28 |
| CVX | 0.037 | 20Δ | 0.095 | 0.191 | -0.009 | +0.0033 | 0.426 | 1.28 |
| IBM | 0.027 | 10Δ | 0.073 | 0.101 | +0.001 | -0.0002 | 0.371 | 0.60 |
| IBM | 0.027 | 15Δ | 0.056 | 0.150 | +0.000 | +0.0005 | 0.371 | 0.60 |
| IBM | 0.027 | 20Δ | 0.060 | 0.197 | -0.003 | +0.0016 | 0.371 | 0.60 |
| KO | 0.026 | 10Δ | 0.053 | 0.099 | -0.001 | +0.0004 | 0.458 | 1.43 |
| KO | 0.026 | 15Δ | 0.089 | 0.148 | -0.002 | +0.0011 | 0.458 | 1.43 |
| KO | 0.026 | 20Δ | 0.078 | 0.191 | -0.009 | +0.0020 | 0.458 | 1.43 |
| MCD | 0.026 | 10Δ | 0.050 | 0.099 | -0.001 | +0.0006 | 0.406 | 1.15 |
| MCD | 0.026 | 15Δ | 0.092 | 0.145 | -0.005 | +0.0016 | 0.406 | 1.15 |
| MCD | 0.026 | 20Δ | 0.108 | 0.195 | -0.005 | +0.0028 | 0.406 | 1.15 |
| NUE | 0.010 | 10Δ | 0.000 | 0.098 | -0.002 | +0.0000 | 0.466 | 0.25 |
| NUE | 0.010 | 15Δ | 0.012 | 0.147 | -0.003 | +0.0003 | 0.466 | 0.25 |
| NUE | 0.010 | 20Δ | 0.024 | 0.199 | -0.001 | +0.0013 | 0.466 | 0.25 |
| O | 0.053 | 10Δ | 0.063 | 0.086 | -0.014 | +0.0013 | 0.996 | 1.36 |
| O | 0.053 | 15Δ | 0.046 | 0.131 | -0.019 | +0.0017 | 0.996 | 1.36 |
| O | 0.053 | 20Δ | 0.044 | 0.168 | -0.032 | +0.0024 | 0.996 | 1.36 |
| PEP | 0.039 | 10Δ | 0.061 | 0.102 | +0.002 | +0.0003 | 0.458 | 1.81 |
| PEP | 0.039 | 15Δ | 0.100 | 0.146 | -0.004 | +0.0021 | 0.458 | 1.81 |
| PEP | 0.039 | 20Δ | 0.073 | 0.191 | -0.009 | +0.0021 | 0.458 | 1.81 |
| PG | 0.029 | 10Δ | 0.057 | 0.099 | -0.001 | +0.0006 | 0.514 | 1.30 |
| PG | 0.029 | 15Δ | 0.055 | 0.141 | -0.009 | +0.0015 | 0.514 | 1.30 |
| PG | 0.029 | 20Δ | 0.053 | 0.195 | -0.005 | +0.0014 | 0.514 | 1.30 |
| SHW | 0.010 | 10Δ | 0.015 | 0.098 | -0.002 | +0.0002 | 0.422 | 0.33 |
| SHW | 0.010 | 15Δ | 0.020 | 0.145 | -0.005 | +0.0005 | 0.422 | 0.33 |
| SHW | 0.010 | 20Δ | 0.016 | 0.192 | -0.008 | +0.0007 | 0.422 | 0.33 |
| SWK | 0.040 | 10Δ | 0.029 | 0.098 | -0.002 | +0.0006 | 0.486 | 0.98 |
| SWK | 0.040 | 15Δ | 0.071 | 0.145 | -0.005 | +0.0021 | 0.486 | 0.98 |
| SWK | 0.040 | 20Δ | 0.080 | 0.197 | -0.003 | +0.0042 | 0.486 | 0.98 |
| TGT | 0.037 | 10Δ | 0.030 | 0.100 | +0.000 | +0.0005 | 0.386 | 0.90 |
| TGT | 0.037 | 15Δ | 0.078 | 0.148 | -0.002 | +0.0014 | 0.386 | 0.90 |
| TGT | 0.037 | 20Δ | 0.105 | 0.197 | -0.003 | +0.0022 | 0.386 | 0.90 |
| TROW | 0.049 | 10Δ | 0.027 | 0.093 | -0.007 | +0.0004 | 0.574 | 2.31 |
| TROW | 0.049 | 15Δ | 0.062 | 0.140 | -0.010 | +0.0025 | 0.574 | 2.31 |
| TROW | 0.049 | 20Δ | 0.045 | 0.177 | -0.023 | +0.0028 | 0.574 | 2.31 |
| WMT | 0.008 | 10Δ | 0.028 | 0.100 | +0.000 | +0.0001 | 0.522 | 0.26 |
| WMT | 0.008 | 15Δ | 0.026 | 0.151 | +0.001 | +0.0003 | 0.522 | 0.26 |
| WMT | 0.008 | 20Δ | 0.017 | 0.198 | -0.002 | +0.0004 | 0.522 | 0.26 |
| XOM | 0.027 | 10Δ | 0.028 | 0.098 | -0.002 | +0.0002 | 0.414 | 0.88 |
| XOM | 0.027 | 15Δ | 0.043 | 0.146 | -0.004 | +0.0003 | 0.414 | 0.88 |
| XOM | 0.027 | 20Δ | 0.061 | 0.195 | -0.005 | +0.0017 | 0.414 | 0.88 |

## 9. Files

- Dividends: `~/workspace/ic-portfolio/data/dividends_19.csv` (169 rows)
- Per-day sensitivity: `~/workspace/ic-portfolio/data/div_sensitivity_perday.csv` (14,307 rows)
- Summary: `~/workspace/ic-portfolio/data/div_sensitivity_summary.csv` (57 rows)
- Analyzer: `~/workspace/ic-portfolio/scripts/analyze_div_sensitivity.py`
- Dividend fetch: `~/workspace/ic-portfolio/scripts/fetch_dividends.py`
- Prior reports: `~/workspace/your_files/aristocrats-covered-call-execution-20261101.md`,
  `~/workspace/your_files/aristocrats-45d-options-liquidity-20261031.md` (§8)