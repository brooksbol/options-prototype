# tt live position scan

Principal acceptance **PASSED** on October 11, 2026 for implementation `dba303c150e1fc27d119f1ee811bd88737f4b16c` (accepted on main). Baseline main `4e99899`; PRs #35, #36, #37 and #38 verified merged. This standalone tastytrade companion does not modify Wheelwright v2 Position, schemas, REST resources, broker orders or management rules. Principal's no-task-branches workflow remains in effect; unrelated work stays untouched.

## Human display contract

`SYMBOL | PAYOFF | RANGE | SPOT | SPAN | EXIT PROFIT | P/L | QUOTE`

One row per recognized position, no blank rows between positions and no bottom legend. Masked account remains in the heading; broker position ordering is preserved. Group spacing separates underlying context, lifespan, exit management and dollars. EXP, QTY, DTE, OPEN, NOW, TARGET and EXIT DTE no longer occupy separate scan columns. Quantity still scales gross P/L. The unchanged `tt live --tsv` projection retains the actual opening credit, estimated closing debit, target price, quantity, expiration/DTE and legacy day-P/L/direction evidence. `tt positions` retains held-leg and broker target/stop-order details.

| Field | Meaning and authoritative evidence | Unavailable behavior |
|---|---|---|
| SYMBOL | Broker underlying identity from recognized holdings | Unsupported/ambiguous holdings fail the whole command closed |
| PAYOFF | Verified standard-contract expiration outline, with the same broker midpoint shown in SPOT | Unknown terms: `IC [?terms]`; inadequate resolution: `IC [compressed]` |
| RANGE | Exact short-put to short-call strikes of the verified maximum-profit plateau at expiration; **not breakevens** | `—` when payoff economics/deliverables are unverified |
| SPOT | Broker equity midpoint, validated against bid/ask and quote-update timestamp | `—` if missing, duplicated or invalid; yellow if a valid price lacks reliable comparison evidence |
| SPAN | New York calendar-day progress from verified final opening fill to expiration, plus remaining DTE on the right | Defensive unknown track if lifespan cannot be established; missing/malformed opening fills continue to fail recognition closed |
| EXIT PROFIT | Each row's exact recognizable Pxx objective, or LIMIT, and signed progress to the verified broker limit | Verified objective survives stale options, but its progress track is unavailable; missing target linkage still fails closed |
| P/L | Gross `(opening credit - closing debit) × quantity × multiplier`, before fees; complete valid broker marks recover a negative package midpoint (see follow-up below) | `—` when valuation is unusable |
| QUOTE | Oldest age among option-leg quotes and the displayed underlying observation, plain seconds/minutes/hours | `—` if no timestamp; degraded evidence retains the existing amber treatment |

RANGE uses compact full strike precision (`32–42`, `59.5–64.5`, `125.125–137.5`). It remains available when valid geometry is compressed, but is withheld for unsupported or unverified deliverables. Prices and financial values are never silently truncated. P/L rounds to cents for display and uses neutral zero, green positive and red negative; domain accounting is unchanged.

## SPOT movement evidence

No acquisition change is required. The existing equity quote response contains `prev-close`, `prev-close-date`, `prev-close-price-type` and `summary-date` alongside the midpoint and its `updated-at`. Reference: [tastytrade market-data schema](https://developer.tastytrade.com/reference/market-data/getMarketDataByType/).

The domain projects movement against the **same snapshot's dated final previous close**. Require a positive reference, price type Final, valid ordered dates (`prev-close-date < summary-date`) and session/date consistency. The summary date must equal the quote's New York observation date, or match the broker-confirmed latest completed session for a subsequent closed-session refresh before the next opening. Missing, malformed, nonfinal, future or unrelated dates yield unknown direction. No option delta, last, mark or substituted spot is used.

SPOT is green when midpoint is above that reference, red below, white unchanged and yellow when comparison is unknown. Freshness and market closure do not choose this color: a retained Friday observation keeps its up/down color on Sunday, and a stale observation with a coherent dated reference may still have a known direction. This is a midpoint-versus-previous-close comparison, not a last-trade change or an official closing price. Comparison price, dates, primitive and change remain in the domain projection.

## SPAN

The existing `openedAt` is the latest verified fill timestamp across the supported opening package. Opening DTE is expiration date minus opening-fill date, using the established New York calendar-date convention. Remaining DTE preserves the existing zero floor. Domain lifespan progress is `(opening DTE - remaining DTE) / opening DTE`; rendering does no calendar arithmetic.

An eleven-cell neutral timeline uses ◆ on opening day, ● during the holding lifespan and ◆ at expiration. Remaining DTE is right-aligned immediately after the track, e.g. `──●──────── 40d`. The marker rounds to the nearest track cell. A near-expiration ● may occupy the final cell before the expiration ◆ appears; the embedded days distinguish those states. Same-day opening/expiration has zero duration and explicitly shows the expiration endpoint with `0d`, without division by zero. A position still in broker holdings remains visible at/past expiration.

There is no authoritative configured DTE exit objective in current tt evidence. SPAN therefore has no │ tick; broker stop-limit orders and expiration never manufacture one. Configured-threshold/approaching/due/exception behavior is deferred until a provenance-bearing position management objective exists. This iteration adds no persistence, automatic exits or trading capability.

## EXIT PROFIT

The heading is always EXIT PROFIT; every row labels its own verified objective, including homogeneous portfolios. P20/P50/P80 require actual corresponding gross credit capture. Exact integer percentages use Pxx; other limits use LIMIT rather than an invented rounded objective. The numeric broker target remains available in TSV; it is not appended to the scan track.

Progress remains `(OPEN - NOW) / (OPEN - TARGET)`. At P50, capturing 25% of opening credit means 50% progress to the target. Eleven-cell tracks use the established visual grammar: red left ◆ for negative progress, cyan ● for ordinary progress, amber near the target and green right ◆ at the observed target. Above 100%, the existing outward marker and explicit unbounded percentage distinguish exceeded progress. `~` means indicative midpoint at/below target while still held; it never establishes execution. `T` preserves an existing broker-order transition. Neither threshold observation nor time passage removes a broker holding.

## PAYOFF (geometry preserved)

Broker instrument terms must verify every leg: Standard chain, 100 shares, 100 holding multiplier, underlying, right, strike and expiration. Adjusted/unknown terms withhold geometry. Acquisition preserves the existing batch instrument request and bounded four-concurrent single-contract fallback. TSV makes neither instrument nor underlying reads.

The fixed 31-cell allocation reserves one indicator cell and uses a 30-cell linear plot from the long-put strike minus 15% of outer strike range to the long-call strike plus 15%. All strike/spot locations use that axis, rounded to the nearest cell. Sub-cell or collapsed wings/plateau yield compressed geometry instead of enlarged wings. Unequal wings retain their proportional intervals and ≠ prefix (ASCII U).

Tails use `_`, one rising/falling diagonal at each wing's proportional midpoint uses ╱/╲, and upper rails use ‾. Amber shoulders connect each single diagonal across its actual wing interval; only the true maximum-profit interval is green. Monochrome shoulders visually join the tails/plateau, so precise boundaries and dollar loss remain contract evidence. No block or sampled-height rendering is used.

Latest approved color contract: dim red maximum-loss tails, amber transition strokes, green expiration plateau, cyan spot marker **regardless of freshness**. The plateau does not imply current profitability. Spot uses exactly the validated observation shown in SPOT, including stale observations; missing/invalid spot has no marker. Beyond the plotting interval, existing arrows indicate overflow; within it, spot beyond a long strike stays proportionally on the tail. Equal marker cells across positions are legitimate terminal quantization.

## Terminal and compatibility

Apple Terminal's ambiguous-width line glyphs count as one cell. ANSI is excluded from widths; combining sequences and wide graphemes are measured. PAYOFF is centered above its fixed-width graphic; RANGE/SPOT align as adjacent numerical context. SPAN and profit tracks stay vertically aligned across positions, with DTE and signed percentages independently padded. Dollar amounts and SPOT are right-aligned. Normal output uses semantic ANSI colors on the existing bright white baseline, with dim red tails as explicitly directed in this iteration. No whole-row coloring, blinking or backgrounds.

Width comes from stdout, then COLUMNS, then 157; `--width 20..1000` overrides it and each refresh re-evaluates width. The full normal scan fits 157/189 columns with the final terminal cell reserved. Narrow fallback omits PAYOFF, RANGE, then SPOT as needed, preserving SYMBOL, SPAN, EXIT PROFIT, P/L and QUOTE. An impossibly narrow terminal explicitly reports how many positions were not displayed and directs the operator to TSV. Values can expand column widths instead of being truncated. `--no-color`, NO_COLOR or TERM=dumb disables ANSI; `--ascii`/TERM=dumb supplies ASCII glyphs. Normal output preserves ANSI through pipes for watch -c.

Trading recognition, fill reconstruction, quantity/multiplier, valuation, target/stop reconciliation, fail-closed completeness and weekend evidence eligibility remain unchanged. No opening/target premium calculations move into the renderer. Option and spot freshness remain independent internally; one conservative QUOTE age remains intentionally compact. Session lookup failure preserves the existing age-only fallback. No leg timestamp-skew bound, partial-close reconstruction or persistence fallback is added.

## Verification

Relevant Node suite: 67 tests. Added coverage includes fractional/unequal RANGE, unknown terms, movement references and invalid dates, retained-Friday/Sunday color invariance, overnight snapshot linkage, lifespan opening/midlife/near-expiry/expiry/same-day/missing/DST cases, mixed P20/P50/P80/LIMIT targets, gross P/L and neutral displayed zero, and twenty varied lifespans/objectives at 157/189 columns in Unicode/ANSI/monochrome/ASCII. Existing narrow, weekend, PAYOFF and acquisition regressions remain. Configured DTE-policy scenarios remain explicitly unsupported and are not claimed as passing capabilities.

## Accepted closeout — October 11, 2026

The Principal explicitly reported “acceptance PASSED” after the revised panel was presented and directed end-of-session closeout. This is Product acceptance of the bounded tt live iteration, separate from automated verification; no independent-review disposition is inferred. All 67 relevant Node tests pass. Normal, retained-weekend, stale, empty and broker-order-transition TSV scenarios were compared byte-for-byte against baseline `4e99899` and are identical. No new task branch or PR was created. The implementation is on main; unrelated research files remain untouched.

Remaining domain limitation: configured DTE-exit objectives are unsupported, so SPAN has no threshold tick. Adding that capability requires separate authority and evidence; acceptance does not authorize new management rules or automatic trading. No further tt live implementation is pending under this workstream.


## October 13, 2026 — BUG-040 valuation isolation

Individually valid option quotes whose summed midpoint implies a negative package closing debit no longer abort the scan. The affected row retains independent fields and its verified exit objective; closing debit, P/L, daily P/L and exit progress are unavailable. QUOTE uses existing amber treatment; TSV progress says `valuation unavailable`. Unrelated rows remain visible, zero is not invented, and existing missing/malformed quote and holding/order ambiguity checks remain fail closed. This amends the earlier whole-command valuation rejection behavior only. See the canonical BUG-040 record for evidence and verification; independent review and Principal acceptance are not inferred.

### October 13 follow-up — available broker marks restore numbers

When a package midpoint is negative, the same response's broker marks now recover valuation if every leg's mark is finite, nonnegative and inside its bid/ask, and the resulting signed package value is nonnegative within existing tolerance. The entire package switches source together, including daily P/L. Coherent midpoint packages retain their accepted behavior. Missing or unusable marks still withhold dependent values; stale/retained-session rules still apply. This is indicative valuation, never a fill or execution claim.

The compact panel is unchanged; QUOTE remains amber for this fallback. TSV NOTE identifies `broker mark valuation; negative package midpoint`; the NOTE is independent of the broker-transition `T`. At the observed UNG snapshot, `0.09` opening credit, `0.02` limit and `0.038142454` mark closing value produce `+74%` progress and `+$5.19` gross P/L. Ordinary installed `tt live` was verified with those values; 72 tastytrade tests pass. See BUG-040 for evidence, authority and limitations. The historical isolation-only behavior above is superseded by this bounded recovery.
