# tt live position scan

**Current baseline: qualified Principal Product acceptance, October 14, 2026.** The economic-state visual-design workstream is closed. Recent-movement indicators remain experimental; tastytrade stop-limit interpretation and ↩︎ remain provisional, excluded from acceptance. See the [current visual contract](../design/tt-live-economic-story/README.md) for evidence, scaling, limitations and exact acceptance scope. [Earlier panel contracts](tt-live-panel-history.md) are historical.

## Human display contract

`SYMBOL | TRADE SHAPE | RANGE | SPOT | DTE | EXIT PROGRESS | QUOTE`

One row per recognized position, masked account, broker ordering, no blank inter-row spacing or bottom legend. Default P/L removal is accepted; `--with-pnl` retains it. All P/L/objective dollars are gross before fees. Exact accounting, quantities, prices, dates and legacy day-P/L/direction remain in domain/diagnostics, `tt positions` and unchanged canonical `tt live --tsv`.

| Field | Current meaning | Unavailable behavior |
|---|---|---|
| SYMBOL | Recognized underlying | Unsupported/ambiguous/scoped failures remain explicit diagnostic rows |
| TRADE SHAPE | Verified expiration outline, same spot as SPOT; cyan ▲ upper rail, ▼ lower rail, ◆ diagonal; ASCII ^/v/* | Unknown contract terms/compressed geometry labeled explicitly |
| RANGE | Neutral verified short-strike plateau or vertical half-line; full strike precision, not breakevens | — when unverified |
| SPOT | Validated broker equity midpoint, shape-region color: green plateau, yellow transition, red loss tail | — if missing/invalid; white when shape unavailable |
| DTE | Opening-fill-to-expiration timeline, remaining/original days; verified GTD manual M embedded | Missing duration —/ASCII --; no invented45-day tenure |
| EXIT PROGRESS | White economic entry center, green profit target, red reported adverse threshold when established, cyan current indicative P/L, visible beyond-loss-boundary overflow | Open dotted unscaled halves; sign-only placement; missing valuation omits diamond |
| QUOTE | Oldest applicable option/spot observation age, existing freshness/amber degradation | — when unavailable |

TRADE SHAPE preserves strike-centered condors and stable verified entry-referenced vertical viewports. Red/green economic halves may represent different dollar distances. Negative stop amount labels the left boundary; a beyond-threshold diamond lies between dollars and bar. Profit dollars touch the right boundary. No human progress percentage. Maximum theoretical expiration loss never substitutes for a missing stop.

## DTE and checkpoints

Days use the existing New York calendar convention and verified final opening-fill timestamp; the eleven-slot timeline retains co-cell age/M/expiration markers. Example37/51d means37 days remaining from actual51-day opening duration. No trailing M21 label. M is green through the checkpoint, red when past due. Verified profit target + GTD supplies manual checkpoint; GTD expiration does not execute a close. Exact checkpoint, due/expired/active states remain detailed evidence. Other configured time-exit policies remain unsupported.

## Provisional stop interpretation

**↩︎ — Stop-limit threshold (provisional)** until tastytrade's actual complex-order behavior is verified. Nonnegative stop inside a verified target span appears proportionally on the favorable track (ASCII r); no stop dollar parenthetical remains. Trigger and execution-limit prices are separate. Current P/L beyond reported threshold economics does not prove activation, executable closing price, secured profit or execution. This qualification also limits operational interpretation of red adverse boundaries.

## Experimental movement and SPOT evidence

Adjacent green → / red ← reflects comparable position-P/L change from dated option prior closes, not underlying movement. Missing/incompatible/noisy comparison omits arrow; absence does not mean unchanged. Retained completed-session movement carries suffix r and implies no live action while closed. Existing spread-derived deadband is preserved for further evaluation; UNG's observed$29 deadband versus$7 target demonstrates why usefulness is not yet accepted. No arbitrary tuning or historical acquisition is included.

Underlying dated prior-close evidence remains available in the domain. It no longer determines SPOT color; freshness remains independently visible in QUOTE.

## Rendering, acquisition and verification

TRADE SHAPE, DTE and EXIT PROGRESS headers are centered. References align across mixed portfolios including outside-stop observations. Terminal width comes from stdout, COLUMNS, then157; `--width 20..1000` overrides. Reserve final terminal cell. Narrow views omit TRADE SHAPE/RANGE/SPOT in order; impossible widths disclose omitted positions and direct to TSV. Unicode/ASCII (`--ascii` or TERM=dumb), ANSI/monochrome (`--no-color`, NO_COLOR, TERM=dumb), fractional values and dynamic widths remain supported. No whole-row color/blinking/backgrounds.

Existing read-only acquisition, pagination/account/membership validation, quote freshness and whole-package midpoint/authorized broker-mark fallback remain. Unsupported strategies or malformed scoped evidence stay explicit; global/account/incomplete acquisition fails closed. Do not silently drop invalid positions or convert unknowns into conclusions. No broker writes/automation are introduced.

Run `node --test scripts/*.test.mjs docs/design/position-payoff-visual-contract/tests/*.test.mjs`. Deterministic specimens require no broker access; see [verification](../design/tt-live-economic-story/verification.md). Principal Terminal screenshots establish appearance; tests establish behavior, not independent review.

## Architectural reuse boundary

TT Live is the flagship standalone interaction prototype. Reuse its accepted presentation and evidence-validity distinctions in WW, while production backend authority remains responsible for recognition, membership, terms, financial conclusions and management evidence. Do not transfer TT's transitional financial calculations or promote experimental/provisional features as accepted WW semantics. This work authorizes no backend migration or production WW implementation.


## Accepted no-protective-exit marker — October 14 follow-up

Principal reported cancelling XLE exit orders and proposed a bright-red skull because dots alone did not communicate “position still open, no active protective exit.” Principal-accepted refinement: **☠︎** (U+2620 + FE0E, single-cell text presentation; ASCII **!**) replaces the leftmost dotted cell only when current reconciled broker closing-order evidence confirms **no active protective stop order**. The open held position, cyan economic observation, white zero reference, valid profit target and dotted unscaled halves remain. No stop/loss denominator is fabricated.

An active profit-taking limit alone does not establish a protective stop. A gain-side Stop Limit such as UNG's remains a present stop and does not get a skull merely because no adverse-loss denominator exists. Cancel Requested/Replace Requested retain present/transition evidence until cancellation is confirmed. Ambiguous, inconsistent or unavailable management evidence does **not** establish absence and keeps the existing unknown rendering/diagnostic. This is an additive domain evidence distinction, not inference from a null normalization denominator.

The skull means absent protective-stop order in the supported reconciled evidence, not unlimited loss, inevitable loss, trade invalidity or evidence of broker trigger/activation behavior. Present orders still do not guarantee protection or execution. −∞ was explicitly rejected as an incorrect mathematical claim for a defined-risk spread. Existing experimental movement and provisional stop/↩︎ semantics remain unchanged.

The Principal visually accepted this glyph (“looks good”) and explicitly authorized its push on October 14. It extends the qualified economic-state baseline; experimental movement and provisional broker stop/↩︎ semantics remain excluded. Text selector requests terminal text presentation; tests establish one-cell measurement and Principal Terminal observation establishes the reviewed appearance. New deterministic no-exits specimens simulate cancellation on sanitized historical XLE evidence; they are not current brokerage facts. No orders are modified by implementation or tests.

## Accepted concurrent same-underlying spreads — October 30, 2026

Each independently evidenced opening package renders separately, including multiple spreads on the same underlying and expiration. Exact filled-opening leg/action/whole-quantity membership must cover every held contract once; overlapping or incomplete evidence remains explicitly ambiguous rather than pairing by strike proximity. Each package retains its own opening credit/time, DTE, valuation and current exit-order reconciliation. Cancelled management for one spread cannot inherit another spread's working orders. Shared-contract quantity allocations remain unsupported. The Principal accepted ordinary installed output with both December 11 IWM put verticals, QQQ, SPY and UNG; see [BUG-056 acceptance and verification](../bugs/BUG-056-tt-live-multiple-same-expiration-spreads.md#principal-acceptance--closure--october-30-2026). No order/strategy changes or universal Position-identity semantics follow.
