# SPY Growth Overwrite Backtest Evidence — 2026-10-02

## Purpose

Preserve the evidence and accounting learnings from the five-year SPY buy-write experiments used to investigate a Growth / Compounding covered-call overlay. This is research evidence, not a strategy recommendation or implementation authorization.

## Frozen baseline construction

Tastytrade backtests:
- SPY
- Buy 100 shares
- Sell 1 call
- approximately 45 DTE
- Wednesday entries
- active-trade limit OFF
- no early exits unless explicitly named
- five-year window approximately 2021-10-02 through 2026-10-01
- 251 trials per delta run

The six entry-delta files are 5Δ, 10Δ, 15Δ, 20Δ, 25Δ, and 30Δ.

The CSV does not contain an entry-delta field; delta is identified from the filename / configured experiment.

## CSV accounting facts

Schema:
`No., Opened, Closed, Premium, Profit/loss, Underlying Price at Open, Underlying Price at Close, Close reason, Buying power, Fees, ROI`.

For the buy-write exports:
- `Profit/loss` is whole-trial buy-write P/L, including the stock leg and fees.
- Exported `Premium` is the net stock-plus-call entry debit, not the short-call credit.
- Short-call entry credit can be recovered as:
  `100 × Underlying Price at Open + exported Premium`.
- Exit proceeds can be recovered as:
  `Profit/loss − Premium + Fees`.
- For expired rows, recovered exit proceeds equal `100 × Underlying Price at Close`.
- For exercised rows, recovered exit proceeds equal `100 × call strike`.
- These identities were reported to hold across all 1,255 rows in the 10Δ–30Δ audit; the six-file rerun preserved the same accounting model.
- The recovered exercised strikes are conventional whole or half-dollar strikes and exercised rows have underlying close above strike.
- `ROI` equals `Profit/loss ÷ Buying power` rounded to the export's precision.
- The CSV does not document how tastytrade computes `Buying power`.

Important consequence: raw tastytrade buy-write P/L already includes the economic effect of selling assigned shares at the strike. A later replacement-share purchase is a cash/inventory-restoration event and must not be subtracted a second time as an additional P/L loss.

## Overlap and reusable inventory

All 251 entries occur on Wednesdays. Trial durations range roughly 36–51 calendar days in the unmanaged sweep.

An interval sweep found a maximum of **eight simultaneous open buy-writes**. Therefore the complete scheduled-entry experiment requires eight reusable 100-share inventory slots, or 800 shares, if interpreted as a persistent inventory overlay.

The earlier seven-slot reconstruction was invalid. Pairing trade `i` to `i+7` produced 50 links per file where the supposed next entry occurred before the previous trial had closed. Those "gaps" sometimes ran backward in time.

A valid deterministic fixed mapping is:
- trades 1, 9, 17, ... → slot 1
- trades 2, 10, 18, ... → slot 2
- ...
- trades 8, 16, 24, ... → slot 8

Every next entry follows the predecessor's close under this mapping.

The exports contain no authoritative lot IDs. An alternate valid "reuse the available lot whose previous trade closed earliest" mapping changes reconstructed terminal overlay P/L by roughly $1,500–$4,200 depending on delta. Therefore exact lot history is underdetermined by the exports.

The 251 hypothetical fresh stock purchases total about **$13,162,385.70** of transaction notional. This is turnover, not independently invested capital.

The first eight share lots cost about **$364,151** at their initial entries.

Summing exported `Buying power` over simultaneously open trials produced a peak around **$611,515**, but that sum is not proven to be the actual portfolio capital requirement because tastytrade's buying-power calculation and account state are unavailable.

## Correct persistent-inventory accounting

For the stated Wednesday-repurchase policy:

- If a call expires OTM, retain the 100 shares.
- Carry the stock's price movement from that close until the next same-slot Wednesday entry.
- If a call is exercised, the raw BW P/L already reflects sale of the shares at strike.
- Repurchase at the next same-slot Wednesday entry if continuing the persistent inventory policy.
- The signed difference between strike proceeds and replacement-share cost is a cash/inventory-restoration requirement. It is useful for explaining performance relative to continuously held stock, but it is **not** another deduction from raw BW P/L.
- Favorable repurchases below strike offset unfavorable repurchases above strike.
- Terminal inventory is marked to a common date/price; do not fabricate a replacement for an assignment with no later entry.

For a valid same-slot mapping, the price-only overlay P/L at the common mark is:

`sum(raw BW P/L) + retained-share gap movement + expired-share terminal-tail movement`.

A useful relative-to-stock decomposition is:

`overlay P/L − matched stock P/L = call credits − fees − signed assignment-to-next-entry top-ups − terminal assignment opportunity cost`.

This is a price-only model. It excludes dividends, financing, taxes, authoritative assignment timestamps, actual stock/option fills, and daily account balances.

## Six-point unmanaged delta sweep

Fixed eight-slot reconstruction:

| Delta | Raw BW P/L | Retained-share gaps | Expired-share end tail | Assignment top-up, memo only | Reconstructed overlay P/L | Matched 800-share stock P/L | Overlay less stock | Assignments |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5Δ | $176,858.16 | +$63,818.70 | +$6,120.00 | $19,261 | **$246,796.86** | $252,929.00 | **−$6,132.14** | 17 |
| 10Δ | $173,559.16 | +$72,846.70 | +$6,120.00 | $28,389 | **$252,525.86** | $252,929.00 | **−$403.14** | 31 |
| 15Δ | $167,717.16 | +$66,253.70 | +$6,120.00 | $58,534 | **$240,090.86** | $252,929.00 | **−$12,838.14** | 55 |
| 20Δ | $160,537.16 | +$61,227.70 | +$6,120.00 | $91,426 | **$227,884.86** | $252,929.00 | **−$25,044.14** | 77 |
| 25Δ | $154,388.16 | +$54,685.70 | +$5,154.00 | $128,388 | **$214,227.86** | $252,929.00 | **−$38,701.14** | 91 |
| 30Δ | $148,651.16 | +$55,000.70 | +$4,724.00 | $161,520 | **$208,375.86** | $252,929.00 | **−$44,553.14** | 106 |

All six overlays trail matched continuous stock ownership in this price-only reconstruction.

The surface is not monotonic at the low end: 10Δ is materially closer to the matched stock benchmark than 5Δ.

The 10Δ result is nearly a wash in this model: $252,525.86 overlay P/L versus $252,929.00 matched stock P/L, a difference of −$403.14.

No delta should be selected from this evidence alone.

### 5Δ rerun details

5Δ source: `SPY 2021-10-02 2026-10-01 Trades-bw-5∆.csv`, modified 2026-10-02 18:10:38.118655 MDT.

It has 251 trades and the same 11-column schema. Trade-by-trade open dates, close dates, and underlying open/close prices match the other five delta files.

5Δ fixed-eight-slot calculation:
- Raw BW P/L: $176,858.16
- retained-share gap movement: +$63,818.70
- expired-share end tail: +$6,120.00
- reconstructed overlay P/L: $246,796.86
- assignments: 17
- all 17 assignments have later same-slot entries
- signed assignment-to-Wednesday top-up: $19,261 = $20,938 unfavorable top-ups offset by $1,677 favorable repurchases
- matched 800-share price-only stock benchmark: $252,929.00
- overlay less stock: −$6,132.14
- independent reconciliation: $13,500 call credits − $371.14 fees − $19,261 signed top-up = −$6,132.14

Alternate valid earliest-available-slot mapping:
- overlay P/L: $245,135.46
- matched stock benchmark: $252,954.60
- difference from fixed-slot overlay P/L: −$1,661.40

## Corrected interpretation of "assignment is expensive"

Assignment can be expensive for a Growth portfolio, but the replacement-share cash requirement is not itself a second trading loss.

The relevant Growth question is how much the overwrite policy lags continuous ownership because:
- upside is capped at strike while the call is active, and
- under a Wednesday-repurchase policy, additional stock exposure may be missed between assignment and re-entry.

Thus "assignment/rebuy top-up" is best treated as a signed explanatory component of opportunity cost relative to continuous stock ownership, not as an extra subtraction from raw BW P/L.

## p50 experiment: null / unresolved semantics

Experiment:
- same 10Δ buy-write construction
- `Take profit at % of premium = 50%`
- otherwise baseline settings frozen

Files:
- unmanaged: `SPY 2021-10-02 2026-10-01 Trades-10∆.csv`
- p50: `SPY 2021-10-02 2026-10-01 Trades-10∆-p50.csv`

Audit result:
- 251 rows
- total P/L $173,559.16
- 220 expired / 31 exercised
- same open/close ranges
- total fees $441.14
- both files SHA-256: `d1d905892fe406004d34b3ab4bd3202ddb4c5ee1358438946aff2b10d1a25679`
- same 19,483 bytes
- byte-for-byte identical
- zero parsed-field differences
- no p50 trade closes earlier than unmanaged

Therefore:
- **PROVEN:** p50 export is exactly identical to unmanaged 10Δ.
- **PROVEN:** no 50% profit-target exit is observable in the export.
- **PLAUSIBLE BUT UNPROVEN:** tastytrade evaluated 50% against the entire buy-write debit.
- **PLAUSIBLE BUT UNPROVEN:** profit-target behavior is unsupported or ineffective for this custom stock+short-call construction.
- **CONTRADICTED as a requirement:** short-call-only backtesting is not the only possible way to study call-premium capture; intratrade option-price evidence could also do so.

The exported `Premium` ranges roughly −$35,638 to −$77,140 and represents net buy-write entry debit. Inferred call credits are about $52–$1,053 per trade, $28,427 total.

Crucially, the export does **not** prove that the profit-target engine uses exported `Premium` as its target denominator. The null result alone does not establish implementation semantics.

A clean diagnostic would compare target OFF/ON for a bounded historical short call known to have crossed a 50% price-decay threshold, both as a short call alone and as stock+call, while preserving generated backtest definitions / exitConditions and execution logs.

## 10Δ exit-management experiment: 21-day limit

Source:
`SPY 2021-10-02 2026-10-01 Trades-10∆-exit-21DTE.csv`.

A duplicate uploaded copy, `SPY 2021-10-02 2026-10-01 Trades-10∆-exit-21DTE(1).csv`, was verified byte-for-byte identical to the first:
- size: 24,344 bytes
- SHA-256: `c574d34b7a43379473204d44ee15cc9d7a5c842460e8c0e203bca86ad29b17b1`

Observed result:
- 251 trades
- every trade closes with `reached days in trade limit`
- zero expirations
- zero exercises / assignments
- 248 trades close after 21 calendar days
- 3 trades close after 22 calendar days

Unlike p50, the time-exit setting materially changes the exported trials.

Reported decomposition:
- call credits collected: +$28,427.00
- cost to buy calls back: −$31,653.00
- exported fees: −$318.77
- **net call-overlay P/L: −$3,544.77**
- underlying stock-window price P/L: $95,269.00
- exported complete-BW P/L: $91,724.23
- reconciliation: $91,724.23 − $95,269.00 = −$3,544.77

Because every short call is closed before expiration and no shares are assigned, a persistent-stock interpretation is substantially simpler: retain the shares continuously and overlay the option P/L.

Using the matched 800-share price-only stock benchmark of $252,929.00:
- 21-day managed overlay: approximately $249,384.23
- overlay less stock: **−$3,544.77**

Compare unmanaged 10Δ:
- unmanaged 10Δ overlay less stock: **−$403.14**
- 21-day exit overlay less stock: **−$3,544.77**
- incremental effect of 21-day exit: **−$3,141.63**

Thus the first genuine exit-management experiment underperformed unmanaged 10Δ by about $3,142 over the five-year sample.

Interpretation: the calls brought in $28,427 of entry credit, but buying them back at the time limit cost $31,653 before the final fee reconciliation. Removing the cap after about three weeks cost more in aggregate than the calls originally paid.

With ~21-day maximum holding periods and weekly entries, concurrent short calls are much lower than in the unmanaged ~45-DTE construction; the existing 800-share benchmark inventory is sufficient. Since there are no assignments, authoritative lot mapping is not material to the option-overlay contribution.

## Evidence hierarchy / cautions

Treat these as separate evidence classes:

1. **Direct CSV facts:** row counts, dates, exported P/L, close reasons, underlying prices, fees, byte hashes.
2. **Algebraically recovered facts:** call credits and exercised strikes derived from internally verified cash-flow identities.
3. **Conditional reconstruction:** eight-slot persistent-inventory results under explicit deterministic lot mapping and Wednesday replacement.
4. **Unresolved implementation semantics:** tastytrade p50 target basis for a custom stock+short-call trial.
5. **Missing economic data:** dividends, financing, taxes, actual execution bid/ask, daily option marks, authoritative assignment timing, and actual lot IDs.

Do not collapse these categories.

## Current research conclusions

- The earlier seven-slot persistent-700 reconstruction is superseded and should not be used.
- Eight concurrent 100-share slots are required by the unmanaged trial schedule.
- Assignment replacement cash must not be double-counted as an extra P/L deduction.
- The unmanaged 10Δ policy is the closest tested baseline to matched continuous stock in the price-only reconstruction: −$403.14.
- 5Δ is worse than 10Δ in this sample: −$6,132.14.
- 15Δ through 30Δ show progressively larger drag versus matched stock.
- p50 produced a null, byte-identical export; why remains unproven.
- A 21-day time exit is a real, observable management rule in the export and produced −$3,544.77 option-overlay P/L, about $3,141.63 worse than unmanaged 10Δ.
- This evidence does not yet justify choosing an entry delta or an exit-management rule.

## Next research direction

Continue one-variable-at-a-time exit-management experiments with the 10Δ / ~45-DTE / Wednesday baseline frozen. Preserve raw exports and exact settings for every experiment. Compare each managed overlay against both unmanaged 10Δ and matched continuous stock.

Do not combine management rules until isolated effects are measured.

CURRENT STATE: Evidence preserved through the six-delta unmanaged sweep, p50 null experiment, and 10Δ 21-day exit experiment.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: NONE
