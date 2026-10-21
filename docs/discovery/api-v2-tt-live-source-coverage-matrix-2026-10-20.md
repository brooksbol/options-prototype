# API v2 ↔ accepted tt live: bounded evidence/field coverage matrix

**Standing:** Candidate engineering handoff, not verified live-source coverage, operative OAS, authorized acquisition or implementation. Based on `docs/cli/tt-live-panel.md`, `docs/design/tt-live-economic-story/README.md`, `docs/api-v2/README.md`, and Principal-supplied Codex adversarial review. Review the actual current source modules (`scripts/tastytrade.mjs`, `scripts/tastytrade-live-domain.mjs`, `scripts/tastytrade-payoff-render.mjs`; Java v2 holdings/quotes/read services) to confirm each row. This matrix distinguishes Product acceptance, prior actor findings and unverified current delivery.

## Source class legend

- **ACCEPTED PROTOTYPE** = actual `tt live` behavior is accepted in its bounded visual contract; not proof v2 already provides it.
- **OPERATIVE V2** = documented current v2 source/capability at October 20 report; may be partial.
- **REPORTED GAP** = Codex-reported actual module/field difference, not re-executed against private broker data in this artifact.
- **PROVISIONAL/EXPERIMENTAL** = explicitly outside accepted behavior.

| Story need / field | Accepted `tt live` interpretation / source | Operative v2 or reported gap | Candidate v2 destination and qualified unknown |
|---|---|---|---|
| Account/broker scope | API Account selection; reported live holdings | Existing v2 Accounts, User grants and holdings acquisition | Account-scope all source observations; fail closed on unauthorized/ambiguous scope |
| Constituent contracts/quantities | Holdings and options legs; source symbols, strikes, expiry, side, quantities | Existing retained holdings, but no comprehensive independent Construction identity (REPORTED GAP) | Position→immutable Construction constituent refs; no fabricated named recognition; warnings if terms ambiguous |
| Recognized trade topology / symbol | Validated package membership, instrument terms, payoff class | Construction model/recognition not operative; experimental model repairs pending | Versioned declarative model and instance; `UNCLASSIFIED` fallback; never disappear from `ww positions` |
| TRADE SHAPE | Strike-based terminal payoff geometry; spot-marked one-row Unicode/ASCII | No generic v2 exact geometry accepted (REPORTED GAP) | Exact horizon/units/segments in API; CLI draws lossy glyph, richer clients draw faithful scale |
| RANGE | Verified plateau/short strikes or vertical half-line; **not** break-even | Existing holdings lack evaluated range | Geometry plus verified strike boundaries; missing terms → unavailable rather than guessed |
| SPOT | Underlying validated broker-equity midpoint, placement in verified geometry | Existing direct underlying quote capability; subject coverage incomplete for contracts | Dated sourced underlying observation + region relationship; unknown if quote missing/invalid |
| Option quotes | Per-option current market evidence for package valuation | Standalone tastytrade acquires option quotes; current v2 direct quotes do **not** establish full option-contract coverage (REPORTED GAP) | Broker-sourced option observation with timestamp, bid/ask/mark and validation; missing → close-value/P&L incomplete |
| Whole-package close value | Whole-package midpoint or authorized whole-package broker-mark fallback; do not mix arbitrary legs/marks | Separate `tt live` math; v2 holdings projection incomplete (REPORTED GAP) | Backend evaluation with methodology and source evidence; prohibit false executable-price claims |
| Opening economics | Validated opening leg fills/credit, multiplier, quantity and source association | tastytrade standalone uses fills; some broker histories incomplete; v2 transaction normalization only partial | Source-qualified Order/fill or transaction evidence; unknown opening credit if insufficient, no invented Executions |
| Current gross P/L | `(opening credit − current closing debit) × quantity × multiplier`, before fees | Some broker-reported values available (Fidelity); current tastytrade normalized holdings fields null per Codex | Qualified Position evaluation with source/method split; absent valid entry or mark → `INCOMPLETE` |
| DTE current days | New York calendar days until verified expiry | Expiry known from contracts where parsed | Backend dates/time zone convention and qualified clock, no guessed expiry |
| Opening duration | Actual verified final opening fill → expiration, reported as remaining/original days | No complete v2 opening/fill coverage established | Position timeline when opening evidence valid; else unknown, never assume 45 days |
| Manual M checkpoint | Verified profit-taking target + GTD close-order expiry; *not an actual timed exit* | Working complex Orders missing in current v2 Position read (REPORTED GAP) | Order terms + derived calendar checkpoint, with qualified interpretation; GTD notification tactic UNTESTED |
| EXIT PROGRESS center | Zero gross P/L baseline, not expiration underlying break-even | Not yet general v2 evaluation | Backend economics: verified opening credit and package close; unknown when evidence missing |
| EXIT PROGRESS target | Verified profit-taking close-order threshold, green target economics | Order acquisition/normalization gap (REPORTED GAP) | Evidence-backed Order goal and threshold; don't infer Order relationship from same symbol alone |
| EXIT PROGRESS adverse | Broker-reported stop trigger valuation, limit distinct from trigger | Standalone reported stop interpretation PROVISIONAL; v2 not established | Preserve broker terms, withhold claim of actual activation, guaranteed fill or secured loss |
| Profit diamond & overflow | Current indicative gross P/L relative to zero/target/adverse thresholds | No backend complete story demonstrated | Numeric qualified evaluation, client derives geometry; no clamping of exact value by terminal viewport |
| QUOTE age / freshness | Oldest applicable spot/option evidence age; amber degraded state | Existing v2 evidence freshness concepts; exact cross-component stitching not demonstrated | Component-level source and as-of timestamps; stale/unknown warning, retained evidence survives failed refresh |
| Movement arrows | Prior comparable option closing observations | EXPERIMENTAL, not accepted Product scope | Do not make required v2 proof field |
| Stop-limit ↩︎ | Special indicator for reported positive trigger | PROVISIONAL, not accepted behavior | Expose exact trigger/limit evidence if available; do not assert broker stop execution semantics |
| Multiple accounts / portfolio scan | `tt live` account ordering, no hidden invalid positions; `ww positions` full inventory | Existing Accounts + current Position snapshots; candidate identity different | Client selects authorized Positions with projection; explicit diagnostic or warning on unknown rows |
| Source completeness / operator remedy | Missing option marks, entry, Order association, contract terms require explicit unknowns | Existing evidence gaps vary by provider; broker originals/processing attempts retained | Field-level `INCOMPLETE`, structured warnings: missing evidence, affected calculation, retained fact and possible import/refresh |

## Broker-specific qualifications to verify in code and tests

**tastytrade:** Working standalone prototype acquires holdings, Orders (including complex closing Orders), option quotes, underlying quotes, instrument contract terms and some leg fills. Codex reported the v2 holdings adapter nulls various financial values and current Position read cannot assert working-Order coverage. Verify sample response values, identifier semantics and the fallback chain in current code; do not claim all data is generally available at every date.

**Fidelity:** CSV/Account evidence establishes reported inventory and sometimes market values, open P/L, dates and transactions. Do not infer full execution history, Order IDs, intraday fill timestamps, option-leg entry or universal mark comparability. Preserve original bytes, import attempts, source temporal coverage and missing provenance. Source availability is not verified here.

## Required engineering outputs before full OAS acceptance

1. For every table row: actual broker input field/path, representative *sanitized* fixture, service normalization field/path, resulting API representation, explicit unknown and quality status; mark missing/nonexistent sources.
2. Run a known multi-leg sample through `tt live` and target v2 evaluation with equivalent input. Compare exact intermediate economics (not only terminal glyph). Scope acceptance to accepted fields, not provisional movement/stop behavior.
3. Demonstrate unmatched structure fallback, contract incompatibility refusal, nonduplicated Account allocations, and inability to conflate source quote time with requested historical time.
4. Demonstrate access filtering, missing-data warnings in summary/expanded projection, and no synthetic fill event or false close inference.
5. Classify every uncovered field: existing supported / provider-available normalization gap / derivable backend / unavailable. Escalate **only** missing domain expressivity to Principal; routine acquisition/validation issues stay engineering.

## Status

This is a source-coverage *plan*, not a verified source-by-source executable mapping. Its gap claims reflect the Codex adversarial report and the accepted `tt live` contract. Final authoritative mappings require reading current implementations, actual representative source payloads and tests. No live broker request or API code was changed.
