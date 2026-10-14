# Historical economic-story design iterations

**Historical record; superseded by [the current contract](README.md).** Iteration-specific pending/accepted statements below describe their own point in time, not current authority. Final qualified Principal acceptance is recorded in the current contract.

# TT Live center-anchored economic story — review candidate

Status: **Implemented engineering candidate; Principal visual acceptance pending**. October 14, 2026. Base: `bfe3073467c1d993ec283706d68e0427d78a6c06` (remotely verified current main). No candidate commit, installation, promotion, independent-review disposition or Product acceptance is claimed.

The Principal commissioned the bounded redesign, implementation, deterministic tests, read-only evidence investigation and terminal specimens in the October 14 task. Scope ends at Principal review. Brokerage writes/automation, backend migration and production WW CLI implementation are excluded. The operational main checkout has unrelated in-flight work in the renderer, journal, parking lot, WW CLI and Roadmap projection. A detached checkout was technically necessary to bootstrap exact current main without altering that work; no task branch or PR was created. Installed `tt` continues to resolve to the original main checkout. Candidate persistence/promotion remains subject to the existing Principal Git workflow.

## Product rationale and precedent

Preserve the Principal's direction:

> “An operator-facing visualization should communicate the correct qualitative conclusion before requiring the operator to interpret its quantitative details.”

> “TT Live answers questions on the operator's mind simply and concisely.”

> “It doesn't show a bunch of 'correct' data; it tells a quick story.”

TT Live is Wheelwright's flagship interaction prototype for the production WW CLI. This iteration addresses: Where did I start? Where am I? Profit or loss? How close to an exit objective? Improving or deteriorating since the comparison session?

Recovered precedents: accepted compact one-row scan, cyan observed markers, semantic red/green, independent human/TSV projections, conservative evidence validity, existing weighted opening fills, exact held membership/quantity, reconciled working orders, whole-package midpoint/mark valuation, retained-session freshness, SPAN co-cell markers, stable entry-referenced vertical PAYOFF viewport and strike-centered IC viewport. See `docs/cli/tt-live-panel.md`, BUG-034/040/041, `docs/design/position-payoff-visual-contract/`, `docs/principles.md`, ADR-007/015/016/017/022 and the Product-first mandate. No accepted PAYOFF or SPAN decision is reopened.

Capability gaps: the old renderer accepts one signed favorable-progress scalar; it cannot represent an independent adverse management denominator or reliable comparison provenance. The existing daily-P/L scalar uses undated holding close prices; it cannot prove same-session, same-position comparability. Bounded additive domain projections and a terminal-only track replace those gaps. Existing acquisition already returns the dated quote fields; no new history acquisition/cache/persistence is needed. Applicable proof is deterministic Node domain/terminal tests and baseline preservation fixtures, plus actual Product observation. Java Sonar/ArchUnit policies are not claimed as automated enforcement of this transitional JS surface. Implementer testing is not independent review.

## Root cause

Old EXIT PROFIT used `(opening credit − current debit)/(opening credit − target debit)`. It pinned all negative values to the leftmost cell, added an alarming signed percentage, and colored the adverse marker red. Entry, loss and distance to a verified loss objective were conflated visually. XLF's −$2 divided by its $5 profit objective is −40%, but says nothing about its own loss-management threshold. The mathematical calculation remains available as `position.progress`; existing TSV PROGRESS retains its original descriptive semantics, not a new numeric schema.

A consequential finding: **XLF's verified stop-trigger loss objective is only $1.** A −$2 mark must therefore render at the adverse endpoint under the requested scale. Moving that snapshot near center would conceal the position's actual relationship to its broker instruction. A stop trigger is indicative activation evidence; a quote beyond it does not prove it triggered, filled, or ceased working. Stop-limit execution is not guaranteed. No reassuring boundary or theoretical maximum loss is substituted.

## Actual read-only broker evidence

Captured October 14, 2026, `19:21:15.312Z`; this is a historical captured snapshot, never a current quote claim. Fixture: `scripts/fixtures/tt-live-economic-observed.json`. It whitelists evidence fields, masks account identity, replaces order/group IDs with synthetic consistent IDs and retains only financial/provenance fields. The accepted near-entry XLF candle reference is reused from the existing sanitized fixture. The normal read-only TT acquisition path was exercised; no orders changed.

| Position | Opening credit | Profit debit | Stop trigger / limit | Gross profit objective | Adverse loss objective | Captured gross P/L |
|---|---:|---:|---:|---:|---:|---:|
| XLF | .09 | .04 | .10 / .10 | $5 | $1 | −$2 |
| UNG | .09 | .02 | .06 / .06 | $7 | unavailable | +$1 |
| EWZ | .42 | .21 | .53 / .53 | $21 | $11 | −$21 |
| XLE | .18 | .09 | .24 / .24 | $9 | $6 | −$30.50 |

All quantities are one with multiplier100. These are reconciled current OCO/OTOCO Debit Limit and Stop Limit components. XLF's target is GTD November6; M21 remains unchanged. The components encode absolute debit prices and stop triggers. Complex evidence reports `ratio-price-is-threshold-based-on-notional: false` and `ratio-price-threshold: 0.0`; no verified mapping from those group fields to a position-specific adverse percentage is established or used. There is no inferred operator stop-loss percentage. UNG's stop debit is below entry credit: it protects a gross gain, so it cannot define the loss half. Maximum theoretical expiration loss is separate evidence and never used as a fallback denominator.

Verified trigger, not execution limit, defines the activation threshold. Require reconciled existing order identity, legs/actions, quantity, account, status and broad/complex consistency. This iteration additionally compares stop-trigger evidence for surviving single stop components. A finite trigger above entry and limit at/above trigger establish the supported adverse boundary. Missing/invalid trigger, a gain-protecting stop, or a limit below trigger leaves that boundary unavailable. Standalone/operator objectives not already established by the domain are not invented.

## Normalization and terminal grammar

Gross current P/L = `(opening credit − current closing debit) × quantity × multiplier`.

- Center: zero gross P/L, closing debit equals opening credit. This is **not** underlying expiration breakeven.
- Favorable denominator: `(credit − verified profit-limit debit) × quantity × multiplier`.
- Adverse denominator: `(verified stop-trigger debit − credit) × quantity × multiplier`, positive only.
- Normalize independently on the corresponding half. Financial values remain unbounded; only marker placement clamps.

The track reserves nine economic slots of three terminal cells each, plus a fixed two-cell status suffix:29 cells total. Left/center/right landmark cells are fixed at offsets0/12/24. Each slot can contain track/landmark, cyan diamond, then subordinate movement arrow; the diamond and landmark coexist at zero/endpoints. The right endpoint reserves two cells for a coincident diamond/arrow. Four discrete steps per half are an explicit resolution tradeoff. Nonzero values occupy at least one step on their correct side; interior fractions round to a slot, capped at three steps until the objective is actually reached (floating arithmetic tolerance1e−8). Endpoint placement does not distinguish exact reach from exceed; TSV/details retain the unbounded economics. This finite-resolution grammar is proposed for review, not accepted Product law.

| Element | Unicode | ASCII | ANSI |
|---|---|---|---|
| Verified adverse boundary/track | `│`, `─` | `|`, `-` | bright red91 |
| Opening breakeven | `│` | `|` | bright white97 |
| Verified favorable track/boundary | `─`, `│` | `-`, `|` | bright green92 |
| Current observation | `◆` | `*` | cyan96 regardless of P/L |
| Improvement / deterioration | `→` / `←` | `>` / `<` | green92 / red91 |
| Unverified half | `?` endpoint, `.` track | same | neutral gray37 |
| Retained comparison | suffix `r` | same | neutral |
| Missing current valuation | no diamond; suffix `?` | same | neutral gray37 |

Unknown adverse boundary: dotted left half and `?` replace the asserted red boundary. Negative current P/L remains one sign-only slot left of center, explicitly unscaled. Unknown profit target uses the same treatment on the right; no false Pxx label. Missing both objectives still preserves zero and the sign-only current observation. An unavailable current valuation preserves verified objectives and center but omits diamond/arrow. Invalid/zero/negative/infinite denominators are unavailable, never divided. These degraded treatments require Principal visual acceptance. Gain-protecting stops remain inspectable in `tt positions`; this iteration does not introduce a second favorable objective.

Official provider references: [quote fields and dated close qualifiers](https://developer.tastytrade.com/reference/market-data/getMarketDataByType/) and [stop-trigger activation field](https://developer.tastytrade.com/reference/orders/getAccountsAccountNumberOrdersId/). The observed wire format is hyphenated; the generated reference uses camelCase field names. Accepting a dated Regular prior close for this indicative comparison is a bounded engineering choice, not a final-settlement assertion.

## Recent movement evidence

Use the already acquired **option** quote's `prev-close`, `prev-close-date`, `prev-close-price-type` and `summary-date`. The observed option type is `Regular`, unlike equity comparison's existing `Final` requirement. Here Regular means a broker-reported regular-session reference; no official-final-settlement claim is made. Both Regular and Final are admitted; Indicative/unknown/missing types are withheld. Existing `market.dayGain`/TSV daily P/L remain unchanged and are not repurposed as verified movement evidence.

Change = sum over current held legs of `(current value − prior close) × signed quantity × multiplier`, Long positive, Short negative. This equals current gross P/L minus comparable prior gross P/L when the opening basis/membership is unchanged. Opening credit cancels. Source is whole-package midpoint, or whole-package broker mark when existing fallback authorizes it; never mix sources or infer direction from underlying movement.

Require unique per-leg quotes, all prior dates equal and valid, same summary session, usable quote timestamps in that summary date at/after its session open, valid bid/ask/current value, opening completed before reference close, and no intervening Filled closing legs. Existing opening recognition already requires unique exact full-quantity opening fills; quantity/composition changes that invalidate that linkage withhold dependent evidence. Uncertain closing-fill chronology also withholds comparison. No snapshot-history or partial-close reconstruction is added.

Open market: require broker Open context and observation within broker session times; reference date must equal the broker previous-session close date. Closed market: require the latest completed session from the existing freshness model and quotes stamped in that session. When an exact reference-session close timestamp is unavailable, require opening on a strictly earlier New York date. Overnight restamped quotes are conservatively omitted, rather than asserted as completed-session movement. Missing/contradictory session, missing prior close, new positions, stale quotes or incompatible snapshots omit the arrow. Retained reliable comparisons carry `r`, including immediately after close. Existing QUOTE behavior is unchanged.

**Deadband:** sum each leg's current half bid/ask spread × quantity × multiplier. This is the current package's conservative midpoint uncertainty envelope, not an arbitrary dollar/percentage risk rule. It scales with size and suppresses directions whose value change does not exceed the current quotation uncertainty. Mark fallback uses the same envelope. It may suppress real modest movements; it is not statistical confidence or proof that price is unchanged, and does not incorporate unreported uncertainty in the historical close. Exact comparison, denominator, mode and source remain in the projection for diagnostics. A persistent flicker/hysteresis model is intentionally not added.

Observed comparison results: XLF unavailable (opened today; one missing prior reference); UNG +$13 versus $29 deadband; EWZ −$2 versus $5; XLE −$13.50 versus $18.50. Thus **all observed arrows are omitted**. Synthetic states explicitly exercise significant improvement/deterioration, all four profitability/direction combinations, flat/noise and retained comparisons. None are claimed as observed broker states.

## Product specimens and review

Run from this checkout; no environment/configuration/credentials required:

```sh
node scripts/tastytrade-economic-specimens.mjs --color
node scripts/tastytrade-economic-specimens.mjs --color --with-pnl
node scripts/tastytrade-economic-specimens.mjs --color --scenarios
node scripts/tastytrade-economic-specimens.mjs --ascii --scenarios --with-pnl
```

The first two replay exactly the same four-position read-only captured evidence. Scenario grid is explicitly hypothetical, using XLF's verified $5 profit/$1 adverse scale. The renderer emitted observed A/B and scenario panels through a PTY. Persisted specimens in `specimens/` cover all16 combinations of observed/scenario, A/B, Unicode/ASCII, ANSI/plain. `--write` regenerates them deterministically. `.ansi` files contain actual ANSI, not escaped descriptions; e.g. `cat docs/design/tt-live-economic-story/specimens/observed-B-without-pnl-unicode.ansi`.

A retains right-aligned exact gross P/L. B removes that numeric distraction and saves13 columns; it is the **candidate default**, as requested. `tt live --with-pnl` restores A. Both preserve the same economic track, PAYOFF, RANGE, SPOT, SPAN and QUOTE. Exact P/L/calculations remain in positions, unchanged TSV, domain projections and diagnostics. No canonical TSV schema change.

Review must determine whether B communicates enough economic consequence when losses exceed tight stops, whether sign-only dotted unknown halves are clear, whether four-step/co-cell resolution is sufficiently intuitive, and whether uncertainty deadband/retained `r` communicate the intended recent movement. A is a useful comparison if B conceals dollar severity at clamped endpoints. Do not claim that passing tests proves the glance test. Principal can accept B, retain A, or request specific visual/semantic changes before promotion.

## Engineering proof and limitations

`node --test scripts/tastytrade*.test.mjs docs/design/position-payoff-visual-contract/tests/*.test.mjs`:235/235 passed before three additional boundary tests. `git diff --check` passed. Baseline TSV bytes and PAYOFF/SPAN fixtures were generated with **unmodified bfe3073**, not the candidate renderer, from the same sanitized observation. Existing domain signed progress stays exact; existing mark fallback, partial evidence, management ambiguity, manual checkpoint, IC/vertical viewport, Unicode/ASCII/color, twenty-row alignment,157/189-column and narrow-width tests remain covered. Legacy human assertions were updated only for the intentionally replaced EXIT/P/L presentation; retained-P/L assertions exercise A. The new tests cover all requested boundary and movement cases without brokerage access.

Broader scripts suite initially passed335/338; three unrelated WW HTTP observation tests require generated Java build fixtures missing in a fresh checkout. This is a test-prerequisite failure, not a claimed regression or pass. Final verification is recorded in [verification.md](verification.md) after fixture generation.

Files: new `scripts/tastytrade-economic-story.mjs` (domain objectives/comparison), `scripts/tastytrade-economic-story.test.mjs`, `scripts/tastytrade-economic-specimens.mjs`, sanitized observed/baseline/preserved fixtures; changed domain integration, terminal renderer, CLI help/flag and affected presentation regression tests. Documentation: this contract/specimens, TT panel candidate amendment, existing CONV-UX intake refinement and journal. No new backend/WW client implementation, orders, automation, service/database/schema or credential changes.

WW reuse: transfer the operator questions, semantic grammar, evidence-validity distinctions and accepted presentation tests only after Product acceptance. Production WW backend must supply authoritative membership, recognition, terms, gross P/L, management objectives and comparison provenance/mode; WW CLI projects those conclusions. **Do not import this transitional tt financial module into WW.**

End-of-workstream memory check: why-state, observed/synthetic distinction, candidate status, proof, unknowns and rejected tempting substitutions (maximum theoretical loss, undated daily P/L, underlying movement and reassuring rescaling of XLF) are preserved here and linked from canonical project memory. Accepted main and operational installation remain unchanged; Product review is the outstanding boundary. No new principle ratification, roadmap horizon/priority change, architecture migration or independent-review acceptance is inferred.

## Acceptance-path rejection and correction — October 14, 2026

Principal acceptance **FAILED**: the Principal ran ordinary `tt live` and supplied a screenshot showing the old signed-percentage renderer. The isolated replay command was not an adequate ordinary-command acceptance path. This was an installation/routing failure, not a visual disposition on the unseen candidate.

Under the Principal's ongoing request to implement and expose the redesign for review, the local installed `~/.local/bin/tt` symlink now targets `~/.local/lib/tt-economic-review/tt`. This reversible adapter routes **only `tt live`** to the isolated candidate and reads the existing original `.env` through a local Node adapter; credentials are not copied or modified. Other commands forward to the original installed launcher. The original source checkout, including its in-flight renderer/WW/documentation edits, is unchanged. The previous symlink target is recorded in `~/.local/lib/tt-economic-review/recovery.json`. This supersedes earlier statements that installed `tt live` remains unchanged; no commit, accepted-main promotion or Product acceptance occurred.

Actual installed `tt live --no-color --width 166` succeeded against current read-only broker evidence and displayed the centered three-landmark tracks with no human progress percentages or default P/L column. Installed help and original `tt positions` forwarding were also verified. Principal now reviews ordinary `tt live`, with `tt live --with-pnl` for A. Product visual acceptance remains pending.

## Current revision — independent stop landmark, October 14, 2026

**Principal design steering:** UNG falsifies the assumption that a stop must be on the loss side. Entry, profit target and stop threshold are independent economic landmarks. Preserve the center-anchored economic direction and cyan observation; place `S` at the stop's actual economic P/L, including profitable and zero stops. This revises the initial candidate's unknown-half glyph/stop omission and29-cell grammar described above. Product visual acceptance of the revised implementation is pending.

A new read-only broker observation confirms UNG's current Live Debit Stop Limit has **`stop-trigger: 0.06` and `price: 0.06`**, matching in broad orders and complex components; profit Limit remains0.02. With opening credit0.09, the stop-threshold gross P/L is+$3 and profit target+$7 per100-share contract. `S` uses **trigger**, not execution limit, even when those prices differ. It communicates an activation threshold, never guaranteed execution, realized gain or order fulfillment. The earlier captured +$1 current P/L sits **left of S**, not beyond it; do not turn the Principal's conceptual sketch into an invented current observation.

Additive domain `economicObjectives.stopThreshold` preserves `grossPnl`, `closingDebit` (trigger), `limitDebit`, source and existing reconciled order identity. Existing `adverseExitLoss` remains a scaling objective only when the verified stop lies below zero P/L; lack of that denominator does not mean lack of management. Positive S shares the verified profit target's scale. A zero S shares the entry slot; a negative S uses the verified adverse scale. No symmetric loss denominator or maximum theoretical loss is invented. A stop outside the profit viewport is clamped with explicit `>` overflow suffix; its exact value remains in domain/order evidence.

Unknown-scale halves now use **open dots without a `?` endpoint**, colored red/green according to economic direction. They imply no established endpoint and no normalized dollar distance. A current observation or stop on an unscaled side occupies a sign-only slot, as before; a verified S on the scaled green side remains proportional to the profit objective. Missing stop means no S, independently of whether current P/L or target is known. Missing current valuation still omits the diamond and uses its unavailable suffix. Missing/invalid trigger does not become a stop-limit-price marker.

The fixed track now reserves one additional stop cell at each of the three landmark slots:30 track cells plus2 status cells. Left/zero/right reference offsets are0/13/26. At ordinary slots S, diamond and arrow can coexist as `S◆→`; at references `│S◆→` preserves every landmark and the subordinate arrow. Red S means a negative-P/L threshold, green S a positive-P/L threshold, bright-white S a zero threshold. S remains legible in Unicode/ASCII/monochrome. This is a3-cell width increase; the layout regression suite verifies both A/B and accepted display widths. PAYOFF/SPAN/QUOTE and TSV remain unchanged.

Regenerated observed/scenario A/B specimens include positive S with current below/above/coincident, along with negative/zero/endpoint and missing-stop tests. Independent financial-landmark semantics are the WW reuse lesson; no transitional TT domain logic is transferred. Principal can inspect this revision using ordinary installed `tt live` or `tt live --with-pnl`. No commit, final Product acceptance or brokerage write follows.

## Current label revision — X / inline Pxx, October 14, 2026

Principal requested red S→red X, green S→green Pxx and removal of the separate LIMIT/P50 prefix. This supersedes the preceding S-glyph grammar only; economic threshold evidence, trigger semantics and entry/PAYOFF/SPAN/QUOTE remain unchanged. Ordinary installed `tt live` uses this revision for visual review.

Negative-P/L stops use red **X**; exactly-zero stops use bright-white X at entry. Gain-side stops use green **Pxx**, their gross profit divided by verified opening gross credit. The right profit-target landmark carries its own green Pxx, so removing the prefix retains the actual objective. These are management-landmark capture labels, **not current progress percentages**. UNG's stop is `P33~` and target `P78~`; XLF's target is `P56~`; EWZ/XLE targets remain exact `P50`. `~` explicitly identifies whole-percent rounding; exact prices/capture fractions and canonical TSV are unchanged. XLF has not silently become exact P50. Missing opening evidence yields no invented target capture; an otherwise verified gain threshold with unavailable capture is P?.

The terminal allocates label cells once per panel, reserving the maximum needed at each of the nine economic slots. All rows share slot/reference columns, including current/label/arrow collisions. Labels consume track cells before each slot's dedicated cyan diamond and arrow; accepted row density, Unicode/ASCII and color semantics remain. Actual four-position track is38 terminal cells versus the preceding32, but removing the6-cell prefix leaves net EXIT width unchanged for this portfolio. Other label combinations derive their own common widths and use the established narrow policy. Quantization is still four logical steps per half; labels are annotations, not extra economic distance. Identical stop/target labels coincident at the right endpoint coalesce; distinct out-of-view thresholds are slash-separated with the existing overflow suffix, retaining target first.

Specimens now include X/Pxx in actual A/B scans and synthetic movement/gain-stop grids. Updated regression tests distinguish inline management capture from numeric current progress, verify explicit rounding/precision preservation, common column alignment, colors and coincident labels. No accepted visual disposition, commit, brokerage change or WW migration is inferred.

## Current compact-label amendment — no tildes

Principal direction, October14: remove tilde rounding indicators because terminal space is precious. Pxx labels are now rounded whole-percent capture without a suffix: XLF target P56, UNG stop P33/target P78, EWZ/XLE targets P50. This supersedes tilde requirements in the preceding label revision. Exact capture fractions, prices and TSV remain unchanged; Pxx is a compact rounded presentation, not evidence of exact integer capture. Regenerated specimens, CLI help and presentation tests use this convention. The observed portfolio saves two track cells; all shared reference/marker/arrow alignment and previous semantics remain. Product visual acceptance and commit remain pending.

## Current dollar landmarks — exit versus maximum, October 14, 2026

Principal clarified the desired dollar story: XLF's profit-taking threshold is **X$5**, while the green endpoint itself is **$9 maximum gross profit**. This supersedes the previous target-endpoint/Pxx grammar. The favorable half is now normalized to the existing **verified maximum gross expiration profit**; the profit-taking exit is an interior landmark. XLF's0.09 opening credit/.04 closing target gives+$5 at exit versus+$9 if worthless at expiration. All prices and derived financial conclusions remain unchanged. Dollar labels round to the nearest dollar only for display; placement uses exact amounts. No Pxx, tilde, separate LIMIT prefix or green terminal bar remains.

Principal then asked whether UNG has two profit exits and whether both belong in green. Distinguish role from economic location: the0.06 Stop Limit trigger is a **gain-protecting stop at+$3**, and the0.02 Limit is a **profit-taking target at+$7**; both are positive P/L locations on a+$9 maximum scale. To avoid implying two profit-taking targets, candidate uses **green S$3** for the gain stop and **green X$7** for the profit-taking exit. A negative stop remains red X; a zero stop remains bright-white X. Thus S is deliberately reintroduced only for a profitable stop, correcting the ambiguity exposed by using X for both roles. Neither threshold guarantees execution or secured gain; the current mark may already be below the stop without establishing brokerage execution state.

The right-end maximum dollar amount replaces its bar. Only validated existing domain `maximumProfit` authorizes the favorable scale; no number is inferred from incomplete/unknown contract terms. Missing maximum evidence leaves the favorable half open/dotted and independently verified positive exits/current observations sign-only and explicitly unscaled. The adverse half retains its separate verified loss threshold denominator; maximum theoretical loss is still never substituted. Target/stop absence is independent of maximum-profit evidence. Existing TSV and signed progress remain unchanged, including their legacy target-reference semantics.

Shared economic slots continue to reserve annotation/current/arrow cells across the panel. Within a co-cell slot, labels and cyan diamond sort by **exact economic value**, with existing1e−8 floating tolerance for equality; movement arrow stays adjacent to the diamond. This prevents the four-step terminal quantization from suggesting that a+$1 current observation is beyond UNG's+$3 stop. Distinct stop/target roles remain separate even at exactly equal thresholds; rounded text equality never collapses different economics. Above-maximum annotations/observations clamp visually, retaining exact domain values and stop-overflow indication. No independent reviewer or Principal visual ACCEPT is inferred from regression tests.

Regenerated A/B specimens: XLF X$5/$9; UNG S$3/X$7/$9; EWZ X$21/$42; XLE X$9/$18. Hypothetical cases distinguish reaching the profit target from reaching maximum profit, missing maximum evidence, role collisions, fractional rounding and full-size quantities. The ordinary installed local review adapter exposes the revision through `tt live`; no original main edits, credentials, brokerage instructions, backend/WW implementation or commit changed.

### Current stop-glyph amendment

Principal requested a red octagon instead of X for the stop. Loss-side/zero stop markers now use red **⯄** (U+2BC4 BLACK OCTAGON), a single-cell monochrome Unicode glyph colored with ANSI91, preserving compact alignment and no-color recognition. ASCII retains X. The gain-side S$dollars and profit-taking X$dollars labels remain distinct and unchanged. This supersedes bare-X stop glyph details above. Regenerated specimens and242 passing TT tests verify the revised renderer; visual acceptance remains pending.

### Current gain-stop label/color amendment

Principal reported the S still visible on UNG and explicitly requested removing S, coloring the stop dollar amount red, and removing P as well. The gain-side stop now displays bare **red $3**, without S/P; all stop annotations use red for their management role even when located at positive P/L. This supersedes the prior green S$dollars convention. Loss-side ⯄/ASCII X stays unchanged. Profit-taking X$7 and maximum $9 stay green, and no Pxx labels remain in the economic track. Geometry still reflects exact signed economics; stop color identifies adverse-management direction, not a claim of current loss. Existing role/rounding/ordering/ASCII/ANSI tests and specimens were updated. Ordinary installed candidate exposes the change; visual acceptance remains pending.

### Current font-compatibility correction — standard stop sign

Principal supplied an actual Terminal screenshot showing U+2BC4 as a missing-character box. This **rejects that glyph's font compatibility** despite passing width/color tests; those tests did not establish glyph availability. Replace it with the standard **🛑** U+1F6D1 OCTAGONAL SIGN, preserving the requested octagon shape. It occupies two terminal cells, and shared label allocation now reserves that width; ASCII retains X. Gain-stop red dollar labels and all financial/management semantics remain unchanged. A single-cell square was briefly considered as a fallback but was not retained because it would not preserve the requested octagon shape.

Automated Unicode/ASCII/ANSI/no-color/column tests verify the revised cell allocation. Native Terminal visual inspection through Computer Use was denied by the tool's app safety restriction, so no direct font-appearance verification is claimed. Principal's actual Terminal remains the final font-rendering evidence. No font installation/configuration change is requested or performed; no workaround bypasses the app restriction. Standard emoji rendering can retain its intrinsic red appearance even when ANSI is disabled; ASCII X remains the plain-character mode.

### Current prefix-free dollar amendment

Principal requested removing the Xs. Profit-taking labels now show plain **green dollars** ($5 for XLF, $7 for UNG, $21 for EWZ and $9 for XLE), without X/S/P prefixes. Maximum profit remains green dollars at the endpoint; gain-protecting stop remains red dollars at its actual economic location. Loss-side standard 🛑 and ASCII stop fallback are unchanged. This supersedes X$dollars wording above, preserves exact-value co-cell ordering and financial semantics, and regenerates the compact A/B specimens. Visual acceptance remains pending.

### Conditional reversal-glyph proposal — evidence does not qualify

Principal proposed ↶ (U+21B6) as a more intuitive protective-stop marker, expressly conditional on verified arming semantics that make a reversal interpretation accurate. Investigation leaves this **proposed, not implemented**.

Latest read-only UNG broad/complex evidence agrees on ordinary Debit Stop Limit, trigger0.06/limit0.06, currently **Received** (earlier intraday observations reported Live). Its group is OTOCO with a Filled opening Limit trigger order. Returned current order fields include status, stop-trigger, price, linkage and timestamps, but establish no profit-threshold arming or observed-reversal condition. Do not promote Received, prior Live, opening Filled or quote movement into proof of reversal-dependent activation.

Official provider [order semantics](https://developer.tastytrade.com/docs/concepts/orders-and-order-types/) distinguish a stop-price trigger from OTOCO linkage: the bracket's exits route after its opening trigger order fills, not after a profitable excursion/reversal. Existing evidence therefore supports an ordinary threshold instruction, not the stronger story that the trade must first become profitable and then reverse before activation. The glyph could express operator intent, but TT Live currently presents verified broker management evidence; using it here would silently strengthen that claim. Retain existing stop markers. Future use requires explicit authoritative reversal/arming semantics plus supporting evidence, not merely a stop located at positive P/L. No new acquisition capability, stored history, brokerage action or code change is introduced.

### Stop economics versus effective protection — explanation correction

Principal asked to reconcile UNG's mathematically positive threshold with its questionable initial bracket. A0.06 trigger and0.06 buy-to-close limit are distinct instructions: activation at a broker stop condition, followed by buying only at0.06 or better. Even if activation occurred, the limit can prevent execution while the executable debit exceeds0.06; an indicative0.10 mark does not itself prove either activation or an executable closing price. $3 is conditional gross result at the configured threshold, not protected/secured profit. Calling this actual initial configuration a gain-protecting stop without qualification overstates what evidence establishes. CLI help now says positive-P/L stop threshold, not proven protection. No financial/order/renderer behavior changed.

The initial loss-limiting rule requires an adverse closing-debit threshold relative to entry, plus execution-limit behavior consistent with the intended policy. No particular replacement level is selected here. A gain-side stop may be deliberately introduced later when appropriately situated, but this order's configuration does not prove that history or intent. Possible UI default/user-entry cause remains speculation; broker acceptance, exact option-complex trigger basis and actual activation remain unresolved. [Provider limit-order explanation](https://support.tastytrade.com/support/s/solutions/articles/43000504164) confirms that a buy limit cannot fill above its cap and may remain unfilled. Keep displayed location separate from operational effectiveness, and do not infer filled/armed/secured state from threshold arithmetic alone.

## Current compact management summary and economic colors

Principal replaced the three monetary landmarks with an uninterrupted center-anchored track and the management summary at its right. Subsequent steering restored green/red to **profit/loss** and prepended **↩︎** to the stop amount. Current candidate examples: UNG **$7(↩︎$3)**, both positive amounts green; XLF **$5(↩︎−$1)**, target green and stop result red; EWZ **$21(↩︎−$11)**; XLE **$9(↩︎−$6)**. Parentheses remain neutral; zero stop results are bright white. A minus sign preserves loss meaning without ANSI. Dollar rounding stays display-only.

This supersedes the previous internal dollar/stop glyphs, maximum-profit endpoint and red-by-stop-role labeling. The favorable half once again normalizes to **verified targetGrossProfit**, the right endpoint is a green bar, and no dollars/stop markers interrupt the track. Center is opening economic zero; current diamond and evidence-qualified recent arrow remain. A verified loss-limiting stop still supplies the adverse denominator; a positive-P/L stop supplies no fabricated loss scale, leaving the red side open/dotted. Maximum expiration profit is preserved in domain/detail evidence but omitted from the compact scan.

↩︎ is an explicit **stop-threshold label identifier**, not a claim that the broker waits for a reversal, that the order is armed, or that the result is secured/guaranteed. This differs from the previously declined ↶ proposal's conditional reversal-dependent interpretation. The user now explicitly requested the hook with economic colors. Parenthesized result is still computed from the verified trigger, not execution limit; order provenance and execution caveats remain unchanged. No new broker interpretation, automation or order modification follows.

The instrument uses nine fixed three-cell slots (27 cells) plus its existing two-cell retained/unavailable status area, then the compact summary. Fixed left/center/right references are0/12/24; label collision logic is eliminated because all financial labels are outside the track. Internal markers retain dedicated cyan/arrow cells. A reached/exceeded target clamps at the right reference slot; it no longer waits for maximum expiration profit. Unknown target leaves an open favorable half and unknown summary label; verified stop result may still appear. Missing stop omits parentheses rather than inventing a threshold. Structured signed progress, canonical TSV, PAYOFF/SPAN/QUOTE and opening/quantity/source validations remain unchanged.

The hook uses U+21A9 plus VS15 text presentation to request a compact **one-cell text glyph**, avoiding emoji presentation. Width measurement now honors VS15; existing two-cell emoji and wide-grapheme behavior remain tested. ASCII uses `<- ` before the signed stop amount, e.g. `$5(<- -$1)`. All A/B/color/ASCII specimens are regenerated. Actual Terminal font appearance and Principal Product acceptance remain review boundaries; no commit is claimed.


## Shape markers and compact headings — October 14 refinement

Implemented candidate, pending Principal visual acceptance: PAYOFF is renamed TRADE SHAPE; SPAN is renamed DTE; EXIT PROFIT is renamed EXIT PROGRESS in the human scan/help. Cyan ▲ replaces an upper ‾ cell, cyan ▼ replaces a lower _ cell, and cyan ◆ replaces either diagonal. ASCII uses ^, v and *. Marker coordinates, strike spacing, IC strike-centered and vertical entry-referenced viewport policies remain unchanged. Overflow retains outward arrows.

The management summary now touches the final boundary: `│$5(↩︎−$1)`, without padding. The final three-cell slot ends in its boundary, leaving current/arrow cells immediately before it at target so both markers and the bar survive. Track width and center alignment remain fixed; unavailable `?` and retained-session `r` move after the summary. Target/stop financial arithmetic, conditional-order caveats, TSV schema and exact values, SPAN/manual-checkpoint behavior and quote semantics remain unchanged. This presentation amendment supersedes earlier header names and five-space summary gap, not the financial contract. Regenerated terminal specimens cover A/B, ASCII, Unicode, ANSI and no-color.


October14 SPOT-color refinement: Principal corrected RANGE to SPOT. RANGE remains neutral. SPOT now takes the original occupied TRADE SHAPE cell's economic-region color before its glyph is replaced by cyan: green plateau, yellow transition, red loss tail. Off-chart observations inherit the corresponding tail color. Unavailable/compressed shape leaves SPOT neutral white; missing spot remains unavailable. This supersedes prior-close movement as the human SPOT color contract, while the validated comparison projection stays intact. QUOTE continues to communicate freshness. The shape marker remains cyan regardless of region. No financial conclusions or TSV changes. Candidate remains pending actual terminal visual acceptance.


October14 header alignment: DTE and EXIT PROGRESS now center over their full dynamically measured columns, alongside the centered TRADE SHAPE header. Row/track positions remain unchanged. Unicode/ASCII, ANSI/plain and optional P/L views share this alignment. Principal visual acceptance remains pending.


October14 compact DTE labels: Principal requested remaining/original days, e.g.37/45d when original verified duration is45. Human labels now use existing lifespan.openingDte derived from actual opening fills (not assumed45-day tenor), with —/ASCII -- for unavailable values and width expansion for longer durations. Deterministic observed EWZ evidence is37/51d, UNG44/45d, XLF44/44d, XLE2/16d. Principal then removed trailing M21 to save space: embedded M remains, red when past due; standalone MxDTE/!/e suffix is omitted. Exact checkpoint, active/expired status, and original lifespan calculations remain in domain/diagnostic evidence. Time-track geometry and co-cell markers remain unchanged. Prior label/status prose above is superseded; no brokerage changes or Product acceptance inferred.


October14 stop-overflow correction: Principal's broker screenshot exposed that endpoint clamping concealed XLE's below-stop economics (closing midpoint0.45 versus stop trigger0.24, opening credit0.18: indicative gross−$27 versus threshold−$6). Screenshot values are an observation, not guaranteed executable prices or evidence the order filled/activated. Candidate now reserves two cells outside the adverse boundary: beyond a verified adverse loss threshold, the cyan diamond appears to its left, with a separately colored recent-P/L arrow only when supported. Exactly reached stays at the endpoint; missing/invalid adverse thresholds never manufacture an overflow. Center, boundaries and dollar-summary positions remain aligned across breached/nonbreached rows. Two former inter-column gap cells fund this gutter so scan width stays bounded. Financial calculations, exact TSV, positive-stop caveats and all other tracks remain unchanged. Regenerated specimens include XLE's observed breach. This supersedes the indistinguishable loss-endpoint clamp presentation; Principal visual acceptance remains pending.


October14 left-boundary labeling: Principal explicitly accepted the beyond-stop diamond grammar (“yes! that's the visualization”), then requested negative stop amounts at their red left boundaries. Implemented candidate now reads `−$6 ◆ │…│$9` for breached XLE: negative amount red, current diamond cyan, diamond between amount and boundary. Nonbreached positions retain the same aligned label/boundary/center positions via a portfolio-wide label width. Negative stop parentheticals disappear from the right; UNG's positive stop remains `$7(↩︎$3)`. Exact stop trigger economics, independent movement evidence, no guaranteed execution meaning and TSV remain unchanged. The overflow visual grammar has Principal acceptance; this newest label arrangement awaits terminal review and remains uncommitted.


October14 inline positive-stop refinement: Principal removed UNG's `(↩︎$3)` summary. Verified nonnegative stop thresholds now use a green ↩︎ (VS15 text presentation; ASCII r) on the positive economic half at their actual fraction of the verified profit objective. UNG's+$3 versus+$7 places the hook approximately3/7 along that half; only$7 remains outside the right boundary. Zero stop is white. Slot/cell quantization preserves white center/green endpoint, cyan current diamond and independent movement arrow; where a collision occurs, nearest free cell respects strict current-versus-stop economic ordering, with equal values adjacent. Negative stop labels and beyond-stop diamonds remain unchanged. Missing/invalid target or a positive stop beyond the displayed target span cannot establish proportional placement, so no fabricated hook is rendered; exact evidence remains in domain/details. Hook is a verified order threshold, not a claim of reversal-dependent arming or guaranteed execution. This supersedes the positive-stop parenthetical experiment; newest candidate remains pending terminal review, without commit or broker writes.


## Provisional stop-limit legend semantics

**↩︎ — Stop-limit threshold (provisional).** Principal directed this interpretation to remain provisional until tastytrade's actual complex-order stop behavior is verified. Broker-reported stop-trigger/limit fields and their arithmetic economic locations are available; the marker does not establish activation, execution, reversal-dependent arming, or effective gain/loss protection. Verify the broker's trigger reference, activation conditions, and stop-limit execution behavior before treating this as an accepted operational interpretation.

This qualification applies to the documentation only. The existing UI, glyph, placement, colors and calculations remain unchanged. Prior wording calling the hook a verified operational threshold is superseded by this provisional interpretation; verification of reported fields is distinct from verification of broker behavior.
