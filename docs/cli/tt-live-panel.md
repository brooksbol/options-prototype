# tt live position scan

Principal acceptance **PASSED** on October 11, 2026 for implementation `dba303c150e1fc27d119f1ee811bd88737f4b16c` (accepted on main). Baseline main `4e99899`; PRs #35, #36, #37 and #38 verified merged. This standalone tastytrade companion does not modify Wheelwright v2 Position, schemas, REST resources, broker orders or management rules. Principal's no-task-branches workflow remains in effect; unrelated work stays untouched.

## Architectural reuse boundary

`tt live` is an accepted standalone UX prototype, not an authoritative v2 Position client. Its local financial computations are transitional implementation details. Reuse its accepted terminal presentation, not its authority allocation. Under ratified `PRIN-ARCH-BACKEND-AUTHORITY` (`docs/principles.md`), production `ww show positions` must consume backend-established membership, contract terms and financial conclusions; the CLI owns presentation and must preserve unknowns instead of inventing domain facts. This clarification does not require migrating the standalone prototype.

## Human display contract

`SYMBOL | PAYOFF | RANGE | SPOT | SPAN | EXIT PROFIT | P/L | QUOTE`

One row per recognized position, no blank rows between positions and no bottom legend. Masked account remains in the heading; broker position ordering is preserved. Group spacing separates underlying context, lifespan, exit management and dollars. EXP, QTY, DTE, OPEN, NOW, TARGET and EXIT DTE no longer occupy separate scan columns. Quantity still scales gross P/L. The unchanged `tt live --tsv` projection retains the actual opening credit, estimated closing debit, target price, quantity, expiration/DTE and legacy day-P/L/direction evidence. `tt positions` retains held-leg and broker target/stop-order details.

| Field | Meaning and authoritative evidence | Unavailable behavior |
|---|---|---|
| SYMBOL | Broker underlying identity from recognized holdings | Unsupported strategy / ambiguous holdings / malformed scoped evidence remain explicit unavailable rows with diagnostics; unrelated rows remain visible |
| PAYOFF | Verified standard-contract expiration outline, with the same broker midpoint shown in SPOT | Unknown terms: `IC [?terms]`; inadequate resolution: `IC [compressed]` |
| RANGE | Exact short-put to short-call strikes of the verified maximum-profit plateau at expiration; **not breakevens** | `—` when payoff economics/deliverables are unverified |
| SPOT | Broker equity midpoint, validated against bid/ask and quote-update timestamp | `—` if missing, duplicated or invalid; yellow if a valid price lacks reliable comparison evidence |
| SPAN | New York calendar-day progress from verified final opening fill to expiration, plus remaining DTE on the right | Defensive unknown track if lifespan cannot be established; missing/malformed opening fills withhold lifespan and entry-dependent economics with an explicit diagnostic |
| EXIT PROFIT | Each row's exact recognizable Pxx objective, or LIMIT, and signed progress to the verified broker limit | Verified objective survives stale options, but its progress track is unavailable; no target shows `—`; ambiguous linkage withholds management and is diagnosed |
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

The accepted non-GTD SPAN remains unchanged. The October 14 Principal-approved GTD convention below adds a manual M checkpoint only from verified profit-target + GTD evidence; stop-limit orders and option expiration never manufacture one. Other configured time-exit policies remain unsupported. This iteration adds no persistence, automatic exits or trading capability.

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


## October 14, 2026 — BUG-041 credit verticals and scoped unavailable evidence

Supported constructions: **Iron Condor**, **Bull Put Credit Spread** (long lower put, short higher put; tastytrade short put vertical), **Bear Call Credit Spread** (short lower call, long higher call). Each group requires matching underlying/expiration and contract identity, equal positive integer quantities, compatible positive multipliers, distinct strikes and correct rights/orientation. Verified weighted opening fills must establish positive credit; debit spreads are never classified as supported credit packages. Grouping remains conservative: multiple same-expiry packages are not decomposed speculatively.

The opening-fill, quote valuation, freshness, broker-mark fallback and gross P/L algorithms are reused. Verified standard 100-share deliverables authorize expiration economics: maximum profit = credit × 100 × quantity; vertical maximum loss = (width − credit) × 100 × quantity; bull put breakeven = short put − credit; bear call = short call + credit. Positive credit below width is required for standard vertical assertions. Unknown/adjusted terms withhold geometry and expiration conclusions. Numeric net delta is available in the domain projection only when each delta and its timestamp validate. Existing TSV columns/semantics are retained; no new financial columns are added.

The same 31-cell Unicode payoff uses `___╱‾‾‾` for bull puts and `‾‾‾╲___` for bear calls, preserving linear strike placement, amber transitions, dim red loss plateau, green profit plateau and cyan spot/overflow indicator. The initial vertical strike-only viewport was replaced by the entry-reference policy below after Principal visual feedback. The single diagonal/shoulders are an outline cue, not a dollar-height scale. ASCII uses `/`, `\`, `-`, `<`, `>` and `v`. IC geometry is unchanged. Unknown vertical terms use BP/BC `[?terms]`.

**RANGE for a vertical is the verified maximum-profit half-line at expiration:** `≥52.5` for the observed XLF bull put, or `≤52` for the corresponding bear call example; ASCII `>=`/`<=`. It is neither an IC interval nor a breakeven. No half-line is displayed without verified standard payoff evidence.

Recognizable current management: one debit Limit target only (standalone or reconciled complex component), a reconciled OCO/OTOCO target plus Stop Limit, or no current closing orders. No stop is required for target-only management; absence of a target produces `—`, no progress and no invented objective. Current partial/duplicate orders, unsupported statuses, missing corroborating complex evidence and contradictory prices/stop triggers/group identities withhold management with a diagnostic. They do not erase independent holding, opening or quote evidence. Stop-only and other configurations are explicitly unavailable rather than interpreted as an invented target. A limit without verified opening credit remains LIMIT, never P0.

Unsupported strategies, ambiguous group membership and malformed scoped broker evidence display explicit unavailable rows. Recognized holdings with missing opening/quote evidence retain independently supported fields while dependent values remain `—`. Explanatory lines identify the affected symbol and failure category, including when PAYOFF is omitted in a narrow view; TSV uses its existing optional NOTE. This supersedes historical statements above that scoped holding, opening, quote or management failures abort the entire scan. Malformed global acquisition, wrong-account evidence and incomplete paginated acquisition still fail closed. No unknown membership/economics is converted into a valid financial claim.

Observed XLF: November 27, long $52/short $52.50 put, one contract, verified $0.09 fill credit, $0.04 target and $0.10 stop/trigger. Actual capture is 55.56%, so the panel correctly shows LIMIT, while unchanged TSV rounds its description to 56%. Installed Unicode/ASCII/TSV runs show XLF alongside UNG/EWZ/XLE. See [BUG-041](../bugs/BUG-041-tt-live-credit-vertical-aborts-scan.md) for sanitized observations, financial invariants and regression evidence. This remains standalone transitional tt logic; Wheelwright v2 authority and admission are unchanged. Principal final acceptance and independent review are not claimed.


## Principal Product decision — October 14, 2026: Pxx + GTD = Manual xDTE Exit

The Principal explicitly approved this **automatic, general TT Live management convention** for every supported credit strategy. It requires no per-position confirmation or configuration. A verified profit-target Debit Limit with time-in-force GTD establishes both profit capture `(opening credit − limit) / opening credit` and a **manual** checkpoint at `option expiration date − GTD date`. Existing Pxx/LIMIT precision rules apply; arbitrary limits are never rounded into a misleading exact Pxx.

Observed tastytrade fields are `id`, `account-number`, `legs` (symbol/action/quantity), `status`, `order-type`, `price`, `price-effect`, `time-in-force`, **`gtc-date`** (the date-only GTD expiration despite its field name), `size`, and `complex-order-id`. Broad/complex evidence must agree on target identity, legs, type, effect, price, status, time-in-force and GTD date. Account mismatch fails closed. Target-only limits do not need a stop; existing OCO/OTOCO behavior remains supported.

**Pxx** is the verified profit objective; **GTD** is the broker order-expiration date; **M** is the Principal's manual-close checkpoint; **xDTE** is remaining option lifetime at M. **Option expiration** is independent contract expiration. The intended rule is profit-target execution before the checkpoint, otherwise evaluate and manually close. **GTD expiration does not execute a trade.** The Principal uses this convention because a DTE/time-based broker exit is unavailable for this workflow. The hoped-for broker expiration alert is an intended reminder; alert delivery has **not** been observed/verified. Design documentation about actual alert behavior will be updated only after that observation, per Principal direction.

SPAN retains eleven logical time slots. M is placed at `(GTD date − opening-fill New York date) / (option-expiration New York date − opening-fill New York date)`, rounded by the existing algorithm. Date-only `gtc-date` is a New York calendar date; it is not shifted backward by converting midnight UTC. Current age ● and option-expiration ◆ remain on the same axis. The exact checkpoint is appended compactly in the same SPAN field:

| State | Display | Meaning |
|---|---|---|
| Upcoming | green `M21` | Manual checkpoint is at 21 DTE, not yet due |
| Due | green `M21!` | Observation New York date equals GTD date |
| Past due | red `M21>` | Still held after the checkpoint |
| Expired target | `M21>e` (or due `M21!e`) | Reliably linked GTD target is expired/inactive; manual checkpoint remains relevant |

Principal color clarification, October 14: both M and its MxDTE label are green through the GTD checkpoint date, including when due, and red after it while still held. Due/past/expired suffixes remain independently readable without color.

Within a quantized timeline slot, collisions concatenate in current/M/expiration order: `●M`, `M◆` or `●M◆`; ASCII `oM`, `M*`, `oM*`. These are **co-cell** markers, not relocated dates. Only colliding slots grow by one/two characters; existing dynamic column padding keeps rows aligned. Non-GTD IC SPAN remains byte-identical. No separate column/timeline is added; exact MxDTE compensates for finite terminal resolution. Monochrome/ASCII preserve due/past/expired state suffixes.

Expired targets never appear as active EXIT PROFIT objectives or drive active exit progress. Historical M requires an exact held-leg/quantity match, verified opening credit, valid dates, unique linkage to the current opening via the opening complex group or post-fill order chronology, and corroborating historical complex evidence when present. A later target cancellation/replacement/filled close prevents resurrection of uncertain older intent. Cancelled targets alone establish no checkpoint. A verified replacement establishes its own Pxx/GTD; a current non-GTD replacement supersedes old GTD intent. Duplicate/contradictory current or historical linkage withholds the affected interpretation. A surviving uniquely verified stop may remain independently recognized after its target expires. A filled target with no held position naturally disappears from the scan.

Observed XLF: $0.58 short fill − $0.49 long fill = **$0.09 credit**; $0.04 closing target gives **55.555…% capture**, correctly LIMIT. `time-in-force: GTD`, `gtc-date: 2026-11-06`, option expiration November 27 → **M21**. This is observed target/stop OTOCO evidence; standalone GTD behavior is independently covered with deterministic fixtures.

## Vertical viewport — entry reference versus current spot (October 14, 2026)

Principal observation: a just-opened XLF spread should normally show spot near the center. Its $52/$52.50 strikes previously produced a $51.925–$52.575 viewport, so the reported $54.265 spot overflowed immediately. **Payoff geometry** establishes the expiration rails/transition; the **viewport** is only the horizontal display interval. IC continues to visualize its defended range using the unchanged four-strike scale. Verticals visualize the distance to the adverse boundary using a separate policy.

The observed opening-order/complex-order responses contain no underlying execution price. Option fills do not establish it. Existing TT Live had no retained entry-price history; v1 Spot History samples are a separate coarse maintained facility, not TT broker entry evidence. The Principal explicitly approved a bounded, read-only DXLink historical candle lookup using the existing quote-token/WebSocket pattern, with no persistence/service/trading addition. It requests only recognized vertical opening references, at most100 requests, one five-second stream snapshot, no retry; IC-only and TSV runs make no historical reads.

**Entry reference:** the completed one-minute trade candle immediately before the final verified opening fill. The minute containing the fill is excluded because its close can occur after entry. Require exact underlying and opening timestamp, expected minute interval, complete snapshot/transaction flags, positive coherent OHLC/trade count, observed field layout and source provenance. Old historical evidence is validated relative to entry, not wall-clock freshness. Missing/stale/unverified/duplicate references never become entry prices. This is a near-entry aggregate trade price, **not the exact price at the option fill**, and never substitutes for current broker-midpoint SPOT or financial valuation.

**Viewport rule (30 plot cells plus one indicator cell):** center the verified near-entry reference; radius is the greater distance to either strike divided by `(1 − 4/29)`, leaving at least two adverse-side cells outside the far strike. Both strikes and current spot use the same linear scale. XLF's observed 18:11–18:12 UTC candle closed at **$54.215**, 29.664 seconds before fills; its fixed viewport is **$51.6456–$56.7844**, with the $0.50 strike interval spanning about2.82 cells. Current spot near $54.3 now occupies the center profit plateau. New quotes move the cyan indicator; they do not change the anchor or viewport. No current observation is passed off as entry evidence.

**Resolution trade-off:** total viewport span is capped at29 spread widths so the transition retains at least one full price cell. If entry is too distant to center while meeting that condition, keep the adverse strike transition visible with two loss-tail cells and mark the compromised centering with `~` in the reserved indicator cell. Spot may then overflow even at entry; this is an explicit finite-resolution exception. Negative price ranges are clipped at zero. Never stretch a narrow spread aesthetically or move the marker off the price scale.

**No entry reference:** use a deterministic strike-based anchor: short put + four spread widths; for calls, max(short call /2, short call − four widths). Prefix **`?`** identifies a strike fallback, not a measured entry price. Current spot never recenters it. The same proportional/resolution rules and overflow arrows apply. This is a display fallback region, not an expected-price forecast or an invented financial conclusion.

Unicode/ASCII and semantic colors remain: red loss plateau, amber transition, green expiration-profit plateau, cyan current spot. Spot in the green region does not imply current unrealized profit. Visual progression goldens are `scripts/fixtures/tt-live-vertical-viewport-golden.json`; they are engineering regression specimens, **not Principal-accepted scaled Product goldens**. Final scaled payoff and M-span visual acceptance remains pending the Principal's review of an actual terminal specimen.
