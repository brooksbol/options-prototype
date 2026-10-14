# TT Live economic-state visual contract

**Status: qualified Principal Product acceptance, October 14, 2026.** The current economic-state visual grammar is the flagship TT Live prototype baseline. The visual-design workstream is closed. The entire EXIT PROGRESS feature is **not** declared finished: recent-movement indicators remain experimental; tastytrade stop-order interpretation and ↩︎ remain provisional and are excluded from acceptance.

The Principal accepted: center-anchored scale, cyan current-position diamond, red/green economic regions, beyond-boundary overflow, profit-target annotation, and removal of default human P/L. Existing TRADE SHAPE/SPOT/DTE refinements form the reviewed terminal baseline. Passing engineering tests are not independent review. Acceptance does not authorize order changes, trading automation, backend migration or production WW CLI implementation.

## Product rationale

> “An operator-facing visualization should communicate the correct qualitative conclusion before requiring the operator to interpret its quantitative details.”

> “TT Live answers questions on the operator's mind simply and concisely.”

> “It doesn't show a bunch of 'correct' data; it tells a quick story.”

TT Live is Wheelwright's flagship interaction prototype. The accepted result answers entry/current economics, favorable/adverse direction and relationship to management objectives at a glance. XLF/XLE exposed indicative valuations beyond unusually small adverse thresholds; EWZ demonstrated an interior adverse state; UNG falsified the assumption that every stop belongs below economic breakeven. Observations expose configurations for investigation, not conclusions about broker activation or trade quality.

## Current scan

`SYMBOL | TRADE SHAPE | RANGE | SPOT | DTE | EXIT PROGRESS | QUOTE`

`--with-pnl` retains the optional human P/L column. Exact financial calculations remain in domain projections/diagnostics, `tt positions`, and unchanged `tt live --tsv`. Human dollars are gross before fees and rounded to the nearest dollar for objective labels. Current gross P/L remains exact internally; no human progress percentage is required.

TRADE SHAPE preserves strike-centered iron-condor and verified stable entry-referenced vertical viewports. Cyan ▲ occupies the upper ‾ rail, ▼ the lower _ rail, ◆ a diagonal; ASCII ^/v/*. Outward arrows mark off-chart spot. RANGE remains neutral and reports verified short-strike geometry, not expiration breakevens. SPOT uses the occupied shape region's green plateau/yellow transition/red loss-tail color, with neutral white when geometry is unavailable. Underlying prior-close comparison evidence remains in the domain, not the human SPOT color contract.

DTE preserves the opening-fill-to-expiration timeline and embedded manual M checkpoint from verified profit-target + GTD evidence. Labels are remaining/original days, e.g.37/51d; unknowns use — (ASCII --). Opening duration is verified actual tenure, never an assumed45 days. No trailing M21 label. The M is green through checkpoint, red when past due; exact checkpoint/expired-order state remains detailed evidence. GTD expires an order; it does not execute a time exit. DTE and EXIT PROGRESS headers are centered over their columns.

## Economic scale and evidence

Gross P/L = `(opening credit − current closing debit) × quantity × multiplier`.

- Bright-white center │: zero gross unrealized P/L, closing debit equals actual opening credit. This is not underlying-price expiration breakeven.
- Green right │: verified profit-taking objective. Favorable fraction = current gross P/L / target gross profit.
- Red left │ when established: economic value of the verified reported adverse stop trigger. Adverse fraction = absolute gross loss / adverse threshold loss.
- Red/green halves intentionally represent potentially unequal dollar magnitudes. Never substitute maximum theoretical loss for missing management evidence.
- Cyan ◆: current indicative economic observation, regardless of sign. Negative stop dollar amount labels the left boundary in red; profit objective dollars touch the right boundary in green.
- When estimated P/L exceeds the adverse threshold, ◆ appears between the negative amount and left bar: `−$6 ◆ │…│$9`. Exactly at the threshold stays at the endpoint. Beyond-profit values clamp at the right endpoint; exact calculations never clamp.

The core track uses nine three-cell slots, with fixed center at core offset12 and final boundary26. Four economic steps per half trade resolution for compactness; nonzero current values occupy their correct side, interior values remain interior until objective reach. A fixed two-cell overflow gutter precedes the track. A portfolio-wide negative-dollar label width aligns all rows. The right boundary is last in its slot, preserving marker/arrow/reference coexistence and gap-free target annotation. The scale is a qualitative management-relative view, not a dollar ruler.

Broker evidence is reconciled through existing account, order identity, legs/actions, position quantity, status and broad/complex consistency checks. Trigger price and stop-limit execution price remain separate. Quote valuation uses the whole-package midpoint or established whole-package broker-mark fallback, never mixed sources. Comparison with a trigger's economic value does not establish executable value, actual trigger state or a fill.

## Provisional positive-stop glyph

**↩︎ — Stop-limit threshold (provisional).** Actual tastytrade complex-order activation/reference/execution behavior remains unverified. Reported price fields and arithmetic can be verified independently of operational behavior. The hook does not imply reversal-dependent arming, guaranteed execution, protected profit or an effective loss cap.

For a verified nonnegative stop inside the verified profit-target span, green ↩︎ sits at its proportional economic location; zero is white; ASCII uses r. UNG's+$3 versus+$7 is approximately3/7 along the favorable half. No dollar stop label or parenthetical remains. Collisions preserve references, current diamond and movement arrow; nearest free cell preserves current/stop order, equal values adjacent. Missing/invalid favorable scale or a stop beyond its displayed span omits the hook rather than inventing placement. Exact threshold stays detailed evidence. This glyph/interpretation is excluded from Product acceptance.

## Missing evidence and experimental movement

Unverified halves are open/dotted without asserted endpoint, with current sign-only placement. UNG has management orders but no verified adverse-loss denominator. Missing current valuation omits diamond/arrow and retains an unavailable suffix. Invalid/zero denominators are unavailable, never divided. QUOTE retains existing age/freshness semantics and amber degradation. No reassuring threshold is fabricated.

Recent arrows are **experimental**: green → improvement, red ← deterioration in position P/L, never stock-price movement. Unicode/ASCII >/< are secondary to the diamond. Dated option prior closes must share a session and comparable membership/quantity/multiplier/opening basis, with no intervening closing fills, usable timestamps and a consistent midpoint/authorized mark source. Missing/incompatible evidence omits the arrow. A retained completed-session direction carries a trailing r; it does not imply live movement while closed.

The existing deadband is sum of per-leg half quoted bid/ask widths × quantity × multiplier. Preserve it without arbitrary tuning. In the deterministic October14 observation, UNG calculated+$13 change, $29 deadband and $7 target. EWZ−$2 versus$5 deadband; XLE−$13.50 versus$18.50. Those observations demonstrate conservative suppression, not effective operator movement communication. XLF had no comparable prior position. An absent arrow does not mean unchanged. Further observations and evidence-method evaluation remain open; no new acquisition/history is authorized by closeout.

## Observed evidence and verification

Sanitized deterministic snapshot: `2026-10-14T19:21:15.312Z`, in `scripts/fixtures/tt-live-economic-observed.json`. Historical observation only, not current broker facts. One package each, multiplier100:

| Symbol | Opening credit | Profit debit | Stop trigger / limit | Gross target | Stop gross result |
|---|---:|---:|---:|---:|---:|
| XLF | .09 | .04 | .10/.10 | $5 | −$1 |
| UNG | .09 | .02 | .06/.06 | $7 | +$3 |
| EWZ | .42 | .21 | .53/.53 | $21 | −$11 |
| XLE | .18 | .09 | .24/.24 | $9 | −$6 |

XLF actual fills .58−.49=.09 differ from opening order limit .08; use fills. Group ratio fields false/0.0 do not establish a loss percentage. UNG's ordinary Stop Limit has no verified reversal gate. No particular replacement stop or broker-default cause is inferred.

[Terminal specimens](specimens/) contain A/B with and without P/L, observed and hypothetical scenarios, Unicode/ASCII and ANSI/plain. Generate without credentials: `node scripts/tastytrade-economic-specimens.mjs --write`. [Verification history and closeout](verification.md) records tests, live read-only checks and limitations. Original-main TSV and geometry fixtures remain provenance baselines; only intentional label/glyph changes are normalized when testing geometry preservation. The Principal's actual Terminal screenshot establishes glyph appearance; no automated font inspection is claimed.

## Durable handoff and WW reuse

The completed scope is the visual-design baseline and its documentation reconciliation. Preserve movement evidence/deadband evaluation and broker stop activation/reference/limit execution questions under the existing CONV-UX concern; do not declare CONV-UX or the entire EXIT PROGRESS feature complete. No new PL item, architecture decision or Product horizon is manufactured.

WW may inherit the accepted grammar, operator questions, unknown/evidence distinctions and tested presentation semantics. Its authoritative backend retains position recognition/membership, contract terms, financial conclusions, management objectives and provenance. TT's transitional financial calculations are not a production authority precedent. Experimental arrows and provisional stop semantics carry their exclusions forward.

Implementation was isolated at base main `bfe3073467c1d993ec283706d68e0427d78a6c06` to preserve unrelated in-flight work. Principal explicitly accepted this qualified baseline and invoked end-of-session persistence on October14. No task branch/PR is introduced. Operational handoff and final main SYNC are reported at closeout; source remains ordinary main-authorized work.

[Historical design iterations](design-history.md) preserve rejected glyphs, earlier semantics, font failures and why-state; they are not current contracts. [Historical panel revisions](../../cli/tt-live-panel-history.md) preserve prior accepted precedents.


## Accepted no-protective-exit marker — October 14 follow-up

Principal reported cancelling XLE exit orders and proposed a bright-red skull because dots alone did not communicate “position still open, no active protective exit.” Principal-accepted refinement: **☠︎** (U+2620 + FE0E, single-cell text presentation; ASCII **!**) replaces the leftmost dotted cell only when current reconciled broker closing-order evidence confirms **no active protective stop order**. The open held position, cyan economic observation, white zero reference, valid profit target and dotted unscaled halves remain. No stop/loss denominator is fabricated.

An active profit-taking limit alone does not establish a protective stop. A gain-side Stop Limit such as UNG's remains a present stop and does not get a skull merely because no adverse-loss denominator exists. Cancel Requested/Replace Requested retain present/transition evidence until cancellation is confirmed. Ambiguous, inconsistent or unavailable management evidence does **not** establish absence and keeps the existing unknown rendering/diagnostic. This is an additive domain evidence distinction, not inference from a null normalization denominator.

The skull means absent protective-stop order in the supported reconciled evidence, not unlimited loss, inevitable loss, trade invalidity or evidence of broker trigger/activation behavior. Present orders still do not guarantee protection or execution. −∞ was explicitly rejected as an incorrect mathematical claim for a defined-risk spread. Existing experimental movement and provisional stop/↩︎ semantics remain unchanged.

The Principal visually accepted this glyph (“looks good”) and explicitly authorized its push on October 14. It extends the qualified economic-state baseline; experimental movement and provisional broker stop/↩︎ semantics remain excluded. Text selector requests terminal text presentation; tests establish one-cell measurement and Principal Terminal observation establishes the reviewed appearance. New deterministic no-exits specimens simulate cancellation on sanitized historical XLE evidence; they are not current brokerage facts. No orders are modified by implementation or tests.
