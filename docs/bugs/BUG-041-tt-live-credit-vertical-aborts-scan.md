# BUG-041 — Credit vertical holding aborts the entire tt live scan

- **Status:** Resolved
- **Severity:** Not established
- **Area:** CLI / tt live
- **Provenance:** Principal incident report and explicit investigation, implementation, read-only verification and closeout authorization, October 14, 2026

## Observed failure

Immediately after opening an XLF short put vertical, installed `tt live` returned:

```text
Live: unsupported or ambiguous held trade; use tt positions for broker evidence
```

Read-only reproduction confirmed the failure on October 14, 2026 around 18:16 UTC. Installed `/Users/bollich/.local/bin/tt` resolves to this checkout's `scripts/tt`, invoking `scripts/tastytrade.mjs`. Baseline main and fetched origin/main were `6f5d7064be20102c99708923cc6931a48ae61bf9`. Existing unrelated working-tree changes were preserved; no task branch was created.

## Intended semantics violated

A recognized bull put credit spread must appear alongside existing iron condors in the accepted compact scan. Unsupported membership, unavailable financial evidence and ambiguous management must remain explicit without suppressing unrelated independently supported holdings. Missing evidence cannot establish financial or execution conclusions.

## Evidence

Observed XLF November 27, 2026 expiry (`expires-at` 18:15 UTC), quantity one per leg, holding multiplier 100:

| Leg | Opening action | Fill | Fill time UTC |
|---|---|---:|---|
| $52 put | Buy to Open | $0.49 | October 14, 18:12:29.664 |
| $52.50 put | Sell to Open | $0.58 | October 14, 18:12:29.664 |

The filled trigger belongs to an OTOCO; exact held contract/action/quantity linkage independently matches the filled order. The submitted trigger limit was $0.08 Credit; verified fills establish **$0.09 credit**, not $0.08. Broker instrument reads verify Standard equity options, 100 shares per contract, matching root, right, strikes and expiration.

Actual current management is **both** a live $0.04 Debit Limit (GTD November 6) and a live $0.10 Debit Stop Limit, trigger $0.10 (GTC). Broad-order and complex-order reads reconcile. The earlier cancelled OTOCO ($0.11 opening limit, $0.05 target, $0.17 stop limit/$0.13 trigger) is not current management. Neither broker order is changed by this work.

Allowlisted, account-sanitized observed fixture: `scripts/tastytrade-xlf-fixture.json`. Opening/order prices, legs, fill times, quotes and contract terms are observed; account and order identities are synthetic. At 18:16:05 UTC, short-put bid/ask/mid were $0.53/$0.63/$0.58; long-put $0.48/$0.50/$0.49. Closing debit was $0.09, gross unrealized P/L $0, net delta approximately +4.0773 share equivalents. Subsequent market observations changed, as expected.

## Consequence

The new two-leg holding hid all four positions, including the three previously supported iron condors (UNG, EWZ, XLE).

## Diagnosis / root cause

Pipeline inspection:

| Stage | Existing capability / failure | Correction |
|---|---|---|
| Broker acquisition | Existing read-only complete holdings and paginated orders; instrument/spot reads and freshness fallback | Reused read-only allowlist; option quote/instrument reads exclude unsupported non-option symbols |
| Grouping | One underlying/expiration group; no unique decomposition of overlapping packages | Preserved conservative grouping; explicit ambiguous row rather than guessed membership |
| `recognizeHeldTrade` | Four-leg guard rejected XLF before recognition; call/put pairing and uniqueness assumed four | Validated two-leg put/call credit orientations and existing four-leg IC; cross-check contract identity against holding root/expiry |
| Opening linkage / `openingCredit` | Exact leg/action/quantity matching and weighted fills already generic | Reused; negative/zero opening credit never labeled a credit spread; incomplete evidence withholds dependent claims |
| `matchingExit` | Required exactly one current OCO/OTOCO target-and-stop pair | Added target-only and no-current-order cases; retained strict reconciliation, rejects partial/duplicate/contradictory linkage |
| `quoteEconomics` / delta | Generic leg loops, freshness and whole-package mark fallback | Reused; scoped missing/malformed valuation cannot hide other positions; exposed numeric net delta |
| `payoffProfile` | Four ordered strikes and two wing widths assumed IC | Added verified standard vertical width, breakeven and tail economics |
| `projectLive` | Any recognition/financial/order exception aborted the scan | Scoped known evidence failures; distinguishes unsupported strategy, ambiguous holdings, malformed broker evidence and recognized holdings with unavailable financial/management claims |
| Renderer | Four-strike IC silhouette and finite RANGE assumed | Extended existing Unicode/ASCII line grammar for rising/falling verticals; RANGE becomes a maximum-profit half-line; explicit scoped diagnostics survive narrow views |

`sameLegs`, opening-fill weighting, midpoint validation, broker-mark fallback, calendar/freshness logic and lifespan/profit tracks need no separate vertical algorithm. The IC's four strikes remain strategy-specific, not a general cardinality requirement.

## Scope / non-goals

Standalone transitional tastytrade companion only. No Wheelwright v2 Position authority/admission changes, backend migration, database/service change, deployment or brokerage execution capability. No order submission, cancellation, replacement or alteration. Existing renderer work for a separate ww workstream remains uncommitted and is excluded from this commit.

## Acceptance criteria

- IC, bull put credit and bear call credit recognized only with compatible quantities/multipliers, valid matching identities/expiry/root, distinct strikes and correct rights/orientation.
- Debit/reversed packages, overlapping identities and uncertain group decomposition never gain valid credit-spread claims.
- Opening credit comes from verified fills. Gross P/L uses credit minus indicative closing debit, times quantity/multiplier.
- Standard expiration assertions require Standard 100-share instrument evidence and multiplier 100. Vertical credit must be positive and less than width. Max profit = credit × 100 × quantity; max loss = (width − credit) × 100 × quantity. Bull put breakeven = short put − credit; bear call breakeven = short call + credit.
- Target-only, verified target/stop and no orders supported. No target, stop or time-exit objective is invented. Ambiguous management cannot drive a target/progress display.
- Existing IC geometry, valid IC TSV values/column meanings, ANSI/ASCII, account masking, terminal widths and quote/mark freshness behavior preserved.
- Unsupported or ambiguous holdings are visible as unavailable rows plus explanatory diagnostics; scoped missing/malformed financial evidence withholds dependent fields. Account mismatch or globally malformed acquisition still fails closed.

## Remediation history

October 14, 2026: bounded extension of existing recognition, projection and Unicode renderer. XLF shows `___╱‾‾‾` orientation with the existing cyan price indicator; bear calls reverse it. RANGE is `≥52.5` for XLF, not an invented condor interval or breakeven. Actual $0.04 target renders LIMIT because capture is 55.56%, not exact P50. Existing TSV conservatively retains its rounded `56% @ 0.04` wording/semantics. Missing credit with an actual limit renders LIMIT, never invented P0.

## Verification

195/195 deterministic tastytrade tests pass: `node --test scripts/tastytrade*.test.mjs`. Fixtures require no live broker access. Coverage includes both verticals, unchanged ICs, IC/IC/vertical/IC ordering, fill weighting, quantity scaling, P/L, standard max profit/loss/breakevens, delta, target-only/target-stop/no orders, duplicate/partial/contradictory exits, malformed holdings/identities/expiries/multipliers, reversed/debit packages, incomplete/stale/duplicated/malformed quotes, negative midpoint with and without broker marks, nonstandard deliverables, Unicode/ASCII strike geometry/spot/colors, terminal widths, unavailable representations, account masking and unchanged TSV headers/IC values. Prior tests asserting whole-command failure for scoped evidence were revised to assert withheld dependent claims and unchanged unrelated rows; malformed acquisition/account checks remain fail closed.

Installed read-only Unicode, ASCII and TSV runs succeeded around 18:23 UTC, displaying **XLF, UNG, EWZ, XLE**. Representative Unicode scan (account fully redacted here; normal output retains established masking):

```text
Account [masked]
SYMBOL              PAYOFF               RANGE             SPOT    SPAN               EXIT PROFIT                       P/L   QUOTE
XLF      _______________╱‾‾‾‾‾‾‾‾‾‾‾‾‾→  ≥52.5           54.245    ◆────────── 44d    LIMIT ◆──────────   −60%          −$3      4s
UNG      ____╱‾‾‾‾‾‾‾‾‾▼‾‾‾‾‾‾‾‾‾‾╲____  9–13            10.995    ●────────── 44d    LIMIT ─●─────────   +14%          +$1     25s
EWZ      ____╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾▼____  32–42           42.575    ───●─────── 37d    P50   ◆──────────  −110%         −$23     12s
XLE      ____╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲___→  59.5–64.5       67.595    ─────────●─  2d    P50   ◆──────────   −94%       −$8.50     14s
```

At a contemporaneous TSV observation, XLF closing debit $0.12 gave `($0.09 − $0.12) × 100 = −$3`; progress `($0.09 − $0.12) / ($0.09 − $0.04) = −60%`. Standard expiration maximum profit/loss are $9/$41; breakeven $52.41. These are gross expiration invariants, not the current P/L or a guarantee of stop execution. Quote-dependent observations vary across separate broker calls.

Principal acknowledged the bull-put interpretation and `___╱‾‾‾` reference and directed continuation. Engineering live verification is established; final Principal Product acceptance and independent reviewer disposition are not inferred.

## Remaining limitations

Grouping remains conservative by underlying/expiration. Multiple same-expiry packages, ratios, partial closes and adjusted contracts are not reconstructed into invented trades. Standard payoff economics are unavailable without validated deliverables. A uniquely reconciled surviving Stop Limit is independently reportable without a profit target; other unsupported exit structures remain management-unavailable. The approved manual GTD convention below is supported; other configured time-exit policies remain unavailable. Midpoints/marks remain indicative, freshness scoped, fees excluded. Existing TSV does not add max-profit/loss/breakeven columns; these remain verified domain projections and documented invariants. Unsupported non-option holdings without option expiration remain explicit; they are not submitted to equity-option quote routes. Structured diagnostics appear in the optional existing NOTE column and below the compact panel only when needed.

## Related

- [TT Live panel contract](../cli/tt-live-panel.md)
- [BUG-040 valuation isolation/fallback](BUG-040-tt-live-inconsistent-package-aborts-scan.md)
- [Options domain competence contract](../foundations/options-domain-competence-contract.md)
- [Product-first mandate](../mandates/product-first-continuous-engineering-2026-10-13.md)


## Principal amendments — October 14, 2026

**Explicit Product decision: Pxx + GTD = Manual xDTE Exit.** Automatically apply to every supported strategy using verified opening fills/current profit-target limit and broker `time-in-force`/`gtc-date`; no per-position confirmation. XLF's actual order has size1, exact closing legs, Live Debit Limit $0.04, GTD `2026-11-06`, linked OTOCO. Observed opening credit $0.09 implies55.555…% (LIMIT); November27−November6=21 New York calendar days (M21). GTD expires the target order; it does not execute a DTE/time-based exit. The Principal hopes its expiration notification will prompt manual evaluation/closing; **alert delivery is unverified**. The Principal directed that design docs about actual broker alert behavior be updated only after observation. No automated close or persistent rule was added.

SPAN adds M on the existing opening/current/expiration axis and exact MxDTE in the same field: upcoming M21, due M21!, past M21>, expired/inactive target M21>e. Current●/M/expiration◆ collisions concatenate in one logical slot, never erase M or relocate dates. Expired targets cannot drive active EXIT PROFIT; historical checkpoint requires unique current-opening linkage and corroborating complex evidence/chronology. Cancelled targets alone confer no intent; replacements supersede older instructions. Non-GTD spans remain unchanged. Full definitions/state/unknown rules live in [TT Live](../cli/tt-live-panel.md).

**Principal viewport feedback:** the first XLF sparkline used $51.925–$52.575 (outer strikes±15%); reported spot $54.265 immediately overflowed. IC must preserve the defended-range strike policy; credit verticals must show distance to adverse boundary on an entry-referenced, stable scale. Opening/order/fill observations had no underlying entry price; no option-premium inference was used. The Principal explicitly approved a bounded read-only historical candle lookup, no storage/service/automation. Recovered existing `tastytrade-greeks.mjs` DXLink transport pattern and official [tastytrade streaming](https://developer.tastytrade.com/docs/concepts/streaming/) / [dxFeed Candle](https://docs.dxfeed.com/dxfeed/api/com/dxfeed/event/candle/Candle.html) semantics. Existing v1 Spot History is coarse sampled evidence outside standalone tt, not reliable broker-linked entry evidence.

Live lookup observed XLF completed18:11–18:12 UTC one-minute candle:23 trades, open54.23, high54.235, low/close54.215, completed29.664 seconds before option fills. It is explicitly a **near-entry trade-candle reference**, not exact underlying execution spot. Validated field configuration, snapshot/transaction/remove flags, root, target minute and OHLC; incomplete/missing/unverified data falls back safely. There is no persistence/retry or historical acquisition for TSV/IC-only portfolios. Under the approved centered policy, XLF viewport is51.6456–56.7844; actual strike width uses2.82167 price cells. Current spot moves within that fixed landscape rather than recentering it.

Priorities: correct linear geometry and visible transition outrank centering; cap total span at29 spread widths to retain one-cell transition. Deep-OTM/resolution compromise uses `~`. Missing entry reference uses a deterministic strike anchor and visible `?`, never a live-price anchor. The design documents the finite-width trade-off. IC rendering is unchanged. Regression progression goldens are engineering specimens only; **Principal scaled visual acceptance is pending**, including M-span collision/state presentation.

Verification now includes195/195 tastytrade tests: all original spread/IC/valuation tests plus P50/P75/arbitrary exact Pxx/noninteger LIMIT, non-GTD/nonprofit orders, actual GTD schema, New York/DST dates, due/past/expired/cancelled/replaced intent, co-cell markers, inactive target suppression, standalone and OCO/OTOCO management, wrong-account/ambiguous/malformed evidence, completed historical snapshot selection and fail-closed reference validation, near-entry centering, stable quote movement, both overflow directions, narrow/wide/deep-OTM trade-offs, fallback labels, proportional strikes, Unicode/ASCII/ANSI/no-color/width and visual progression goldens. Tests do not prove visual acceptance or actual notification delivery.


## Final engineering verification and closeout — October 14, 2026

Exact scoped candidate: **303/303 scripts tests passed**, including195/195 tastytrade tests. Existing sanitized generated Java specimens were supplied to the isolated candidate's tests; no Java/backend changes were needed.24 baseline/current IC output comparisons were byte-identical across terminal/TSV, Unicode/ASCII, color/no-color, ordinary/stale/empty scenarios. Existing non-GTD IC scale and SPAN remained unchanged.

The broader dirty working tree returned304/308, with four preserved ww-draft failures: bare-fetch missing credentials, private ww.env fetch, ls credential/grammar fixtures (missing renderer dependencies in their isolated copies), and backend-facts scan expectation under ASCII environment. These same failures were demonstrated in the preserved pre-fix tree. An earlier broader run also observed a pre-existing broken-pipe test failure that passed subsequently. None is swept into this standalone repair; no unrelated ww code/test is changed. This is not a claim that the entire dirty workspace is green.

Revised read-only installed terminal specimen, with current quotes distinct from the earlier screenshot:

```text
Account [masked]
SYMBOL              PAYOFF               RANGE             SPOT    SPAN                   EXIT PROFIT                       P/L   QUOTE
XLF      ___╱‾‾‾‾‾‾‾‾‾‾‾▼‾‾‾‾‾‾‾‾‾‾‾‾‾‾  ≥52.5           54.285    ●────M────◆ 44d M21    LIMIT ◆──────────   −40%          −$2      9s
UNG      ____╱‾‾‾‾‾‾‾‾‾▼‾‾‾‾‾‾‾‾‾‾╲____  9–13            10.985    ●────────── 44d        LIMIT ─●─────────    +7%       +$0.50      6s
EWZ      ____╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾▼____  32–42           42.545    ───●─────── 37d        P50   ◆──────────  −112%      −$23.50     11s
XLE      ____╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲___→  59.5–64.5       67.555    ─────────●─  2d        P50   ◆──────────  −283%      −$25.50     13s
```

The marker now lies inside the green expiration-profit plateau on an entry-reference scale; current P/L remains a separate option-valuation observation. The31-cell graphic and all columns fit157-column output. Installed ANSI execution also verified cyan indicator/semantic colors; ASCII and no-color preserve the same meanings. GTD alert delivery and final Principal scaled visual acceptance remain pending; no brokerage orders were altered.

Files changed: `scripts/tastytrade.mjs`, `scripts/tastytrade-live-domain.mjs`, `scripts/tastytrade-live-render.mjs`, `scripts/tastytrade-payoff-render.mjs`, new `scripts/tastytrade-entry-reference.mjs`; existing `scripts/tastytrade.test.mjs`, `scripts/tastytrade-exit-render.test.mjs`, `scripts/tastytrade-scan.test.mjs`; new credit-spreads/manual-exit/entry-reference/viewport test modules, sanitized XLF fixture and viewport progression golden; this BUG record, bug index, TT Live docs, scoped journal entry and derived Roadmap.19 files total. Shared renderer/journal/projection changes are deliberately staged only for this workstream, preserving pre-existing unrelated changes. Main/no-task-branch workflow is retained. Canonical bug metadata requires Roadmap regeneration/freshness verification for both the full working tree and exact scoped commit; no new principle, ADR, PL identity or horizon is introduced.


## Principal acceptance / closure — October 14, 2026

The Principal explicitly stated **“perfect. acceptance passed. execute end of session protocol”** after the requested M color adjustment. This establishes Product acceptance of the completed standalone TT Live credit-spread workstream, including the scaled vertical viewport, manual GTD checkpoint and green-through-GTD/red-after marker behavior. Accepted implementation: `11112e03a29fa2cf306b6aaf74d51e6e6cf4a8fb`, with accepted color refinement `4088d03b81a227dcfb737c9da49d4f9608f452cc`, both pushed to main. This supersedes earlier acceptance-pending statements as current state while preserving their historical provenance. Independent reviewer disposition is not inferred.

BUG-041 is Resolved and this workstream is closed. No additional implementation or brokerage operation is pending. Actual broker expiration-alert delivery remains unverified; the Principal's instruction to update design documentation after observing that behavior remains a future observation, not new implementation or scheduling authority. Existing unsupported/ambiguous packages, adjusted-contract uncertainty, finite-width compromises and read-only boundaries remain as documented.

The End-of-Workstream Memory Check found no new principle, ADR, backlog identity, Product horizon, v2 authority/admission change, database/service/deployment or trading capability change. Durable decisions and acceptance are reconciled here and in TT Live docs/journal; engineering progression fixtures remain test specimens, not independent authority. Closeout verifies the accepted scoped code and regenerates/checks the bug-derived Roadmap on both scoped accepted-main and the complete working tree. Unrelated ww, architecture, parking-lot, shared-renderer and journal drafts are preserved and excluded from this closeout commit. No task branch or PR is created; deliberate main commit/push and final remote SHA verification complete the handoff.

Closeout results: **303/303 scoped scripts tests passed** after the accepted color refinement, including195/195 tastytrade regressions. Accepted-main and complete working-tree Roadmap regeneration/freshness checks passed. No live broker reread or code behavior change was required for this acceptance-only closeout.
