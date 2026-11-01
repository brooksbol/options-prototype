# Aristocrat covered-call execution economics — 10Δ / 15Δ / 20Δ calls at ~45 DTE

Second analysis on the retained Aristocrat chains. No new data pull.
Window: trading days 2025-10-31 → 2026-10-30 (251 trading days).
Chains: ThetaData EOD, same pull as the 45-DTE liquidity ranking
(17,567 day-files, 13,346,514 rows). Spot: Yahoo unadjusted closes
(ThetaData underlying_close is null for 100% of rows).

## 1. Scope — execution only, by design

This study measures the executable premium available at different
deltas **before** attempting to model strategy profitability. It
computes no returns, no assignment outcomes, no rolls, and no P/L.
It does not compare Aristocrats with SPY, and it does not promote
anything into Wheelwright policy. The question it answers is the
one posed for this experiment: how steep is the liquidity and
premium penalty for preserving additional upside?

## 2. Candidate set — mechanical, and conditional

Candidates are derived from the first ranking, not hand-picked:
median relative spread on 16Δ shorts < 0.50 **and** quote
availability on shorts > 0.80. That gives 19 names: CLX, O, CVX,
NUE, ADM, MCD, IBM, XOM, CAT, TGT, SWK, SHW, WMT, PG, ABBV, APD,
TROW, KO, PEP.

Qualification, carried forward explicitly: these 19 are a
liquidity-screened subset, not an independently established
investable universe. The cutoff was selected after observing the
first study, so this second study describes **this conditional
subset only**. Nothing here generalises to all 70 Aristocrats, to
Aristocrats as a class, or to SPY. A name outside the 19 was not
measured here and, from the first ranking, would be wider.

## 3. Method

- Chain each day, point-in-time only: expiration nearest 45 DTE
  within 28–70 DTE. Median selected DTE across the results is
  43–45 days, confirming the rule behaves as intended.
- Deltas are model-estimated exactly as in the first analysis:
  Black-Scholes, r = 0.04, q = 0.0, IV inverted from the EOD mid,
  two-stage picker (ATM-IV shortlist, then full inversion).
- A day counts as quotable for a delta only if the picked call
  has bid > 0 and ask > 0. Crossed quotes are excluded.
- **Primary execution price is the natural bid** — what a seller
  taking liquidity receives in the snapshot. Midpoint is a
  reference only, never a fill.
- **Annualised yield denominator, as specified:** premium
  received at the bid divided by the underlying's market value —
  bid / S per share, identical to (100 × bid) / (100 × S) —
  annualised over the option's **actual DTE that day**:
  (bid/S) × (365/DTE), medianed over quotable days. This is a
  **premium rate, not a realised investment return**: it includes
  no underlying price move, no assignment, no dividend, and no
  roll. A bid > 0 is also not proof of an executable fill at
  size; median volume is reported alongside so a zero-volume bid
  is visible.

## 4. The matched-date qualification — and why it does not change the answer

The unmatched medians in §5 are each computed over that delta's
own quotable days, which differ across deltas (O: 10Δ quotable
193 days, 20Δ 249 days). A premium difference could therefore
partly reflect different days or volatility regimes. §6 repeats
the comparison **only on days where all three deltas are
quotable for that symbol on that day** (the matched set), with
paired per-day differences. The matched set is smaller (median
201 of 251 days per name; range 141 for ABBV to 251 for CAT),
and because it conditions on all three being quotable it
flatters absolute spread levels slightly relative to the
unmatched medians. But the paired differences — the quantity
that answers the steepness question — are clean of the
different-days problem, and they confirm the unmatched story.

## 5. Unmatched results (each delta over its own quotable days)

Cross-name medians (median of the 19 name medians):

| delta | median rel spread | haircut vs mid | median ann bid yield | median ann mid yield | median availability | median volume |
|---:|---:|---:|---:|---:|---:|---:|
| 10Δ | 0.667 | 0.333 | 0.022 | 0.036 | 0.805 | 5 |
| 15Δ | 0.504 | 0.252 | 0.041 | 0.057 | 0.948 | 7 |
| 20Δ | 0.378 | 0.189 | 0.061 | 0.079 | 0.992 | 13 |

Reading: moving from 10Δ to 20Δ roughly triples the annualised
bid premium rate (2.2% → 6.1% on these medians) while cutting
the haircut from a third of the mid premium to under a fifth,
and lifting median availability from 81% to 99%. Every name
individually shows relative spread falling and annualised bid
yield rising monotonically from 10Δ to 20Δ — no exceptions in
the 19.

The Realty Income (O) example, which motivated this study, is
confirmed in the full run and matches the single-symbol result
exactly on the unmatched basis:

| O | 10Δ call | 20Δ call |
|---|---:|---:|
| Quote availability | 77% (193/251) | 99% (249/251) |
| Natural-bid haircut vs midpoint | 33% | 14% |
| Annualised bid premium yield | 1.2% | 3.5% |

O is, however, near the bottom of the 19 on premium level at
every delta (20Δ annualised bid yield 3.5%, vs 9.2% for CAT) —
a reminder that the steepness of the delta trade-off and the
level of premium are different things.

### 5.1 Full unmatched table (19 names × 3 deltas)

Sort within each delta: relative spread ASC → availability DESC
→ median volume DESC. `rel` = median (ask−bid)/mid.
`hair` = median (mid−bid)/mid. `ann_bid` / `ann_mid` = median
annualised premium rates at bid / mid. `avail` = quotable days
/ 251. `vol` = median daily volume on the picked call.

| delta | rank | sym | rel | hair | ann_bid | ann_mid | avail | quot_days | $spread | vol | med_DTE |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 10Δ | 1 | IBM | 0.506 | 0.253 | 0.034 | 0.049 | 0.821 | 206 | 0.77 | 5 | 43 |
| 10Δ | 2 | XOM | 0.512 | 0.256 | 0.027 | 0.038 | 0.721 | 181 | 0.39 | 29 | 44 |
| 10Δ | 3 | CLX | 0.526 | 0.263 | 0.029 | 0.041 | 0.932 | 234 | 0.25 | 20 | 45 |
| 10Δ | 4 | CVX | 0.553 | 0.276 | 0.025 | 0.037 | 0.865 | 217 | 0.43 | 10 | 44 |
| 10Δ | 5 | NUE | 0.571 | 0.286 | 0.030 | 0.045 | 0.976 | 245 | 0.60 | 2 | 45 |
| 10Δ | 6 | MCD | 0.578 | 0.289 | 0.018 | 0.027 | 0.801 | 201 | 0.53 | 6 | 43 |
| 10Δ | 7 | ABBV | 0.604 | 0.302 | 0.022 | 0.033 | 0.590 | 148 | 0.54 | 17 | 44 |
| 10Δ | 8 | TGT | 0.627 | 0.313 | 0.031 | 0.048 | 0.805 | 202 | 0.47 | 1 | 43 |
| 10Δ | 9 | ADM | 0.667 | 0.333 | 0.026 | 0.040 | 0.972 | 244 | 0.20 | 4 | 45 |
| 10Δ | 10 | O | 0.667 | 0.333 | 0.012 | 0.019 | 0.769 | 193 | 0.05 | 61 | 44 |
| 10Δ | 11 | WMT | 0.692 | 0.346 | 0.022 | 0.036 | 0.857 | 215 | 0.37 | 12 | 43 |
| 10Δ | 12 | PG | 0.693 | 0.347 | 0.016 | 0.028 | 0.713 | 179 | 0.34 | 12 | 44 |
| 10Δ | 13 | CAT | 0.772 | 0.386 | 0.028 | 0.048 | 1.000 | 251 | 3.37 | 0 | 43 |
| 10Δ | 14 | KO | 0.792 | 0.396 | 0.014 | 0.026 | 0.713 | 179 | 0.18 | 4 | 43 |
| 10Δ | 15 | PEP | 0.805 | 0.402 | 0.017 | 0.033 | 0.721 | 181 | 0.42 | 6 | 44 |
| 10Δ | 16 | SWK | 0.857 | 0.429 | 0.027 | 0.047 | 0.837 | 210 | 0.40 | 1 | 44 |
| 10Δ | 17 | TROW | 0.923 | 0.462 | 0.014 | 0.030 | 0.633 | 159 | 0.35 | 4 | 45 |
| 10Δ | 18 | SHW | 1.000 | 0.500 | 0.014 | 0.033 | 0.809 | 203 | 1.30 | 1 | 45 |
| 10Δ | 19 | APD | 1.030 | 0.515 | 0.016 | 0.036 | 0.749 | 188 | 1.30 | 2 | 45 |
| 15Δ | 1 | CVX | 0.341 | 0.170 | 0.043 | 0.057 | 0.916 | 230 | 0.42 | 17 | 43 |
| 15Δ | 2 | CLX | 0.354 | 0.177 | 0.052 | 0.063 | 0.996 | 250 | 0.30 | 42 | 45 |
| 15Δ | 3 | NUE | 0.364 | 0.182 | 0.058 | 0.073 | 1.000 | 251 | 0.70 | 6 | 45 |
| 15Δ | 4 | O | 0.400 | 0.200 | 0.025 | 0.031 | 0.960 | 241 | 0.10 | 121 | 45 |
| 15Δ | 5 | ADM | 0.400 | 0.200 | 0.049 | 0.063 | 1.000 | 251 | 0.25 | 12 | 45 |
| 15Δ | 6 | MCD | 0.420 | 0.210 | 0.033 | 0.044 | 0.948 | 238 | 0.65 | 8 | 43 |
| 15Δ | 7 | IBM | 0.421 | 0.211 | 0.060 | 0.077 | 0.996 | 250 | 1.01 | 5 | 43 |
| 15Δ | 8 | XOM | 0.423 | 0.211 | 0.046 | 0.060 | 0.845 | 212 | 0.45 | 24 | 43 |
| 15Δ | 9 | TGT | 0.448 | 0.224 | 0.055 | 0.075 | 0.920 | 231 | 0.48 | 3 | 43 |
| 15Δ | 10 | WMT | 0.504 | 0.252 | 0.041 | 0.058 | 0.920 | 231 | 0.38 | 15 | 43 |
| 15Δ | 11 | SWK | 0.514 | 0.257 | 0.054 | 0.075 | 0.960 | 241 | 0.40 | 3 | 45 |
| 15Δ | 12 | CAT | 0.527 | 0.264 | 0.060 | 0.078 | 1.000 | 251 | 3.70 | 1 | 43 |
| 15Δ | 13 | SHW | 0.557 | 0.279 | 0.037 | 0.052 | 0.992 | 249 | 1.20 | 4 | 45 |
| 15Δ | 14 | PG | 0.560 | 0.280 | 0.028 | 0.044 | 0.809 | 203 | 0.39 | 15 | 43 |
| 15Δ | 15 | APD | 0.566 | 0.283 | 0.039 | 0.057 | 0.984 | 247 | 1.10 | 5 | 44 |
| 15Δ | 16 | ABBV | 0.589 | 0.295 | 0.036 | 0.056 | 0.880 | 221 | 0.77 | 7 | 43 |
| 15Δ | 17 | PEP | 0.597 | 0.299 | 0.031 | 0.049 | 0.873 | 219 | 0.46 | 6 | 43 |
| 15Δ | 18 | TROW | 0.600 | 0.300 | 0.030 | 0.049 | 0.896 | 225 | 0.35 | 13 | 44 |
| 15Δ | 19 | KO | 0.667 | 0.333 | 0.026 | 0.041 | 0.865 | 217 | 0.26 | 6 | 43 |
| 20Δ | 1 | CLX | 0.256 | 0.128 | 0.076 | 0.088 | 1.000 | 251 | 0.30 | 68 | 45 |
| 20Δ | 2 | NUE | 0.280 | 0.140 | 0.090 | 0.104 | 1.000 | 251 | 0.70 | 11 | 45 |
| 20Δ | 3 | CVX | 0.281 | 0.141 | 0.064 | 0.078 | 0.968 | 243 | 0.41 | 39 | 43 |
| 20Δ | 4 | O | 0.286 | 0.143 | 0.035 | 0.042 | 0.992 | 249 | 0.10 | 179 | 44 |
| 20Δ | 5 | ADM | 0.303 | 0.152 | 0.076 | 0.090 | 1.000 | 251 | 0.25 | 22 | 45 |
| 20Δ | 6 | MCD | 0.319 | 0.160 | 0.051 | 0.063 | 0.992 | 249 | 0.60 | 10 | 43 |
| 20Δ | 7 | SWK | 0.359 | 0.179 | 0.087 | 0.109 | 1.000 | 251 | 0.40 | 6 | 45 |
| 20Δ | 8 | IBM | 0.371 | 0.185 | 0.087 | 0.108 | 1.000 | 251 | 1.28 | 10 | 43 |
| 20Δ | 9 | CAT | 0.376 | 0.188 | 0.092 | 0.114 | 1.000 | 251 | 3.85 | 2 | 43 |
| 20Δ | 10 | XOM | 0.378 | 0.189 | 0.068 | 0.086 | 0.920 | 231 | 0.54 | 28 | 43 |
| 20Δ | 11 | WMT | 0.392 | 0.196 | 0.061 | 0.081 | 0.944 | 237 | 0.41 | 21 | 43 |
| 20Δ | 12 | SHW | 0.407 | 0.203 | 0.057 | 0.074 | 1.000 | 251 | 1.20 | 6 | 45 |
| 20Δ | 13 | TGT | 0.408 | 0.204 | 0.082 | 0.106 | 0.988 | 248 | 0.61 | 3 | 43 |
| 20Δ | 14 | APD | 0.444 | 0.222 | 0.055 | 0.074 | 1.000 | 251 | 1.10 | 8 | 44 |
| 20Δ | 15 | KO | 0.463 | 0.231 | 0.039 | 0.056 | 0.916 | 230 | 0.25 | 16 | 43 |
| 20Δ | 16 | PG | 0.465 | 0.232 | 0.047 | 0.064 | 0.904 | 227 | 0.48 | 23 | 43 |
| 20Δ | 17 | PEP | 0.468 | 0.234 | 0.049 | 0.068 | 0.936 | 235 | 0.57 | 13 | 43 |
| 20Δ | 18 | ABBV | 0.488 | 0.244 | 0.057 | 0.079 | 0.992 | 249 | 1.04 | 7 | 43 |
| 20Δ | 19 | TROW | 0.533 | 0.267 | 0.045 | 0.065 | 0.976 | 245 | 0.40 | 17 | 45 |

## 6. Matched-date results (same days for all three deltas)

Cross-name medians on the matched set:

| delta | median rel spread | haircut vs mid | median ann bid yield | median ann mid yield | median volume |
|---:|---:|---:|---:|---:|---:|
| 10Δ | 0.667 | 0.333 | 0.023 | 0.036 | 5 |
| 15Δ | 0.410 | 0.205 | 0.042 | 0.057 | 14 |
| 20Δ | 0.321 | 0.161 | 0.062 | 0.079 | 22 |

Paired per-day differences, median across the 19 names:
20Δ minus 10Δ annualised bid yield **+4.12 percentage points**;
15Δ minus 10Δ **+2.25 points**; 20Δ minus 15Δ **+2.07 points**.
Median paired ratio 20Δ / 10Δ annualised bid yield: **2.83×**,
range across names **2.50× (CLX, CVX) to 3.88× (SHW)**. No name
is below 2.5×. The steepness is therefore not an artefact of
different quotable days, and it is not driven by one or two
outliers — it is present for every name in the subset.

The quotability penalty itself, in days: on a median of **48
days per name** (range 0 for CAT to 102 for ABBV) the 20Δ call
was quotable while the 10Δ call was not. Preserving upside
does not only pay less on the days it is quoted; on roughly
a fifth of trading days it cannot be quoted at all at a
positive bid.

### 6.1 Full matched table

`m_days` = days all three deltas quotable for that name.
`rel_*` / `ann_*` = medians on those days only.
`ratio` = median per-day 20Δ / 10Δ annualised bid yield.
`20only` = days 20Δ quotable while 10Δ was not.

| sym | m_days | rel_10 | rel_15 | rel_20 | ann_10 | ann_15 | ann_20 | paired_20-10 | ratio | 20only |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ABBV | 141 | 0.575 | 0.370 | 0.286 | 0.022 | 0.039 | 0.062 | 0.039 | 2.86 | 102 |
| ADM | 244 | 0.667 | 0.400 | 0.303 | 0.026 | 0.049 | 0.077 | 0.050 | 2.80 | 7 |
| APD | 186 | 1.030 | 0.553 | 0.427 | 0.016 | 0.040 | 0.055 | 0.041 | 3.76 | 63 |
| CAT | 251 | 0.772 | 0.527 | 0.376 | 0.028 | 0.060 | 0.092 | 0.063 | 3.15 | 0 |
| CLX | 234 | 0.526 | 0.343 | 0.252 | 0.029 | 0.053 | 0.077 | 0.046 | 2.50 | 17 |
| CVX | 210 | 0.532 | 0.315 | 0.243 | 0.025 | 0.043 | 0.065 | 0.041 | 2.50 | 28 |
| IBM | 206 | 0.506 | 0.360 | 0.289 | 0.034 | 0.063 | 0.090 | 0.059 | 2.64 | 45 |
| KO | 177 | 0.750 | 0.557 | 0.321 | 0.015 | 0.027 | 0.043 | 0.028 | 2.75 | 53 |
| MCD | 201 | 0.578 | 0.372 | 0.244 | 0.018 | 0.035 | 0.055 | 0.035 | 2.80 | 48 |
| NUE | 245 | 0.571 | 0.364 | 0.279 | 0.030 | 0.058 | 0.090 | 0.058 | 2.88 | 6 |
| O | 192 | 0.667 | 0.400 | 0.286 | 0.012 | 0.024 | 0.035 | 0.025 | 3.33 | 56 |
| PEP | 177 | 0.795 | 0.485 | 0.359 | 0.017 | 0.033 | 0.050 | 0.030 | 2.70 | 56 |
| PG | 166 | 0.677 | 0.472 | 0.351 | 0.016 | 0.029 | 0.048 | 0.032 | 2.89 | 54 |
| SHW | 203 | 1.000 | 0.545 | 0.400 | 0.014 | 0.037 | 0.057 | 0.041 | 3.88 | 48 |
| SWK | 204 | 0.857 | 0.485 | 0.351 | 0.027 | 0.055 | 0.087 | 0.058 | 3.25 | 41 |
| TGT | 197 | 0.626 | 0.410 | 0.326 | 0.031 | 0.055 | 0.085 | 0.055 | 2.77 | 47 |
| TROW | 147 | 0.880 | 0.667 | 0.512 | 0.013 | 0.027 | 0.046 | 0.033 | 3.75 | 90 |
| WMT | 206 | 0.660 | 0.467 | 0.332 | 0.023 | 0.042 | 0.061 | 0.039 | 2.58 | 25 |
| XOM | 175 | 0.485 | 0.326 | 0.271 | 0.027 | 0.049 | 0.073 | 0.047 | 2.83 | 50 |

## 7. Answer: how steep is the penalty for preserving upside?

Steep, consistent, and larger on liquidity than on premium
alone suggests:

- **Premium:** giving up the move from 20Δ to 10Δ forfeits
  about two-thirds of the annualised bid premium rate (matched
  medians 6.2% → 2.3%; 10Δ is a median 34% of 20Δ, range
  25–38% across names). The paired ratio is 2.5×–3.9× for every
  name. This is a premium-rate statement, not a return
  statement: the 10Δ seller keeps more upside by construction,
  and that upside is unmeasured here.
- **Liquidity:** the 10Δ haircut is about double the 20Δ
  haircut (33% vs 16% of mid premium on the matched set), and
  10Δ is unquotable on a median 48 extra days per name. The
  10Δ market is thinner in every dimension measured — spread,
  haircut, availability, and volume (median 5 vs 22 contracts).
- **15Δ as a compromise:** on the matched set, 15Δ captures a
  median **65% of the 20Δ annualised bid yield** (range 59–72%
  across names — the tightest range in the study), at a 20%
  haircut vs 16% for 20Δ and 33% for 10Δ. If far-OTM
  overwriting is pursued at all in this subset, 15Δ is the
  more reasonable compromise on execution grounds alone. That
  is an execution statement, not a strategy recommendation:
  assignment exposure at 15Δ vs 20Δ remains unmeasured, and
  no return or risk comparison has been made.
- **Variation across underlyings is in level, not in
  steepness.** Premium levels at 20Δ range from 3.5% (O) to
  9.2% (CAT); 10Δ relative spreads range from 0.49 (XOM) to
  1.03 (APD). But the 20Δ/10Δ ratio is ≥2.5× for every name.
  So 10Δ is economically unattractive on execution grounds
  for most names in this subset — the weakest cases are
  APD (10Δ rel 1.03, ann 1.6%), SHW (1.00, 1.4%), TROW
  (0.88–0.92, 1.3–1.4%), KO (0.75–0.79, 1.4–1.5%) — while the
  least unattractive 10Δ cases, IBM (rel 0.51, ann 3.4%) and
  XOM (0.49–0.51, 2.7%), are still paying a ~33% / ~25%
  haircut respectively and giving up roughly two-thirds of
  the 20Δ premium rate. Whether any of this deserves a place
  alongside SPY in a tactical layer cannot be decided from
  execution alone; it needs the profitability and assignment
  modelling this study deliberately does not do.

## 8. Caveats (all still apply)

- Survivorship: 2026-10 membership applied backwards, as in
  the first ranking; removed names are absent and the subset
  is flattered accordingly.
- Deltas are model-estimated (Black-Scholes, r = 0.04,
  q = 0.0, IV from EOD mid). Delta is a target, not a
  measured assignment rate; increased assignment exposure at
  higher delta is real and unmeasured here.
- Spreads and bids are EOD snapshots. Intraday execution,
  size, and the staleness of a positive bid on a zero-volume
  day are not established. Median volume is 0 for CAT's 10Δ
  call and low (5) at the 10Δ median — a positive bid with
  no trades behind it should not be read as a firm market.
- Earnings overlap is not excluded: a 45-DTE call will often
  span an earnings date, and that exposure is not separated
  here. Open interest is unavailable on ThetaData Free, so
  volume is a proxy only.
- BF.B is not in the 19-name subset (it failed the first
  ranking's availability screen); the BFB pull variant is
  therefore not a factor in this analysis.
- No midpoint fills are assumed anywhere. Every premium
  figure quoted as "bid" is the natural-bid snapshot; every
  "mid" figure is a reference only.

## 9. Files

- Unmatched summary: `~/workspace/ic-portfolio/data/covered_call_45d.csv` (57 rows)
- Per-day rows: `~/workspace/ic-portfolio/data/covered_call_45d_perday.csv` (12,945 rows)
- Matched summary: `~/workspace/ic-portfolio/data/covered_call_45d_matched.csv` (19 rows)
- Analyzers: `~/workspace/ic-portfolio/scripts/analyze_cc.py`,
  `~/workspace/ic-portfolio/scripts/analyze_cc_matched.py`
- Prior ranking: `~/workspace/your_files/aristocrats-45d-options-liquidity-20261031.md` (§8)