# BUG-056 — TT Live merges concurrent same-underlying, same-expiration spreads

- **Status:** Resolved
- **Severity:** Not established
- **Area:** CLI / tt live
- **Provenance:** Principal bounded engineering repair assignment, October 30, 2026; priority High

## Observed failure

Installed `tt live --tsv` reported IWM as `unsupported strategy` with `unsupported strategy orientation or rights` after the second IWM fill. QQQ, SPY and UNG remained recognizable. Baseline fetched/local main: `9fbd6918829c9fe76a24b75f6dfce4d6d0f35082`, clean tree after fast-forward from `a4733817`. Installed `/Users/bollich/.local/bin/tt` is a symlink to this checkout's `scripts/tt`, which invokes `scripts/tastytrade.mjs`.

## Intended semantics violated

Report two independently evidenced vertical spreads separately without changing holdings, orders or strategy. Preserve each opening credit/time, DTE, P/L, exit objectives/progress and quote evidence. No held leg, opening fill or exit order may be counted twice. Missing or conflicting membership must remain explicit; shared underlying/expiration or strike proximity alone cannot establish membership.

## Evidence and verified root cause

`projectLive` grouped Equity Option holdings by underlying **and expiration**, then passed the whole group to `recognizeHeldTrade`. Four IWM puts therefore entered the four-leg iron-condor branch, which requires two puts and two calls. The recognizer failed before opening-fill or exit-order linkage ran. This verifies the reported hypothesis with the refinement that the grouping key also contains expiration. The preceding documentation update did not change this code.

Read-only production holdings/orders corroborated quantity one per leg, December 11 expiration, multiplier 100:

| Opening | Opening order | Short / long puts | Actual fill credit | Current target / stop |
|---|---|---|---:|---|
| October 29 | 519887647 | 272.5 / 269 | $0.65 | None active in observed broad/complex evidence |
| October 30 | 520298010 | 268 / 265 | $0.58 | Limit #520298011 at $0.30 Debit; Stop Limit #520298012 at $0.75 trigger/limit, both Live |

October 29's former $0.30 target #519887648 and $0.81 stop #519887649 were **Cancelled**, not working profit/protective exits. The repair does not transfer October 30 management to October 29. Cancelled October 30 predecessor opening #520285725 and its contingent exits likewise confer no current management.

## Scope / authorization / reuse

The Principal explicitly assigned Codex this bounded repair, regression tests, installed read-only TT1 verification, and commit/runtime reporting. Only standalone `tt` recognition and directly related tests change. No order submission/modification/cancellation, position change, trading strategy, v1 liquidity calculation, API v2 or Talk change is authorized or performed. WW-GATE-001 remains STAGED with `experiment_started: false`; no experimental execution claim is made.

Recovered the accepted TT Live baseline, BUG-041's generic two/four-leg recognition and evidence-degradation behavior, maintained Position/Governed Quantity owner and open ASSIM-0002, ADR-016 association/uncertainty rules and ADR-022's bounded opening/series distinction. This reporting repair creates no universal Position identity or governed membership. Existing transitional TT calculations are reused without promoting them to v2 authority. Existing fitness controls do not provide a new enforced gate for this JavaScript repair.

## Remediation

Candidate `0af729dc`: extend the existing grouping stage with a bounded filled-opening partition. A filled opening order must match exact constituent symbols, actions and whole current quantities; fill quantities/times must validate. Every holding must be covered once. Overlap, incomplete coverage, malformed/future fills or unsupported quantity allocation fail explicitly as ambiguous holdings. No quantity slicing or strike-nearest matching is introduced. Existing supported single-package geometry fallback remains; same-right multi-leg holdings without opening evidence explicitly lack membership.

Reuse `sameLegs`, `openingCredit`, recognizer, quotes, payoff, lifespan, exit linkage and renderers independently for each established package. Preserve broker holding order and all existing account checks. A cross-package/partial exit remains management-ambiguous, never duplicated. Only `scripts/tastytrade-live-domain.mjs` and new `scripts/tastytrade-multiple-spreads.test.mjs` are runtime/test changes.

## Verification

- New focused regressions: **13/13 passed**. Independent credits, opening times, DTE, P/L, progress and unique target/stop associations; cancelled prior exits; missing/overlapping openings, duplicate holdings, quantity mismatch, malformed/future fills; misleading strike adjacency; separate put/call wings that must not merge into an IC.
- Existing credit-spread/scan focused tests: **59/59 passed**.
- Full prescribed `node --test scripts/*.test.mjs docs/design/position-payoff-visual-contract/tests/*.test.mjs`: **399/399 passed**.
- Replayed one unchanged read-only broker snapshot through baseline and candidate. QQQ, SPY and UNG position projections **and TSV rows were deeply equal**. IWM became exactly two recognized structures with no projection issues; four distinct held contract symbols reconcile once across those packages. Actual opening credits/times and active/cancelled order identities corroborate the table above.
- Installed human `tt live --no-color --with-pnl` and TSV both succeeded with five structures. Numeric quotes/P/L change between observations.
- Independent reviewer **ACCEPT** of immutable `0af729dc5369a7be2eef2d9f988eaef2b1ad07e5`: 83 focused tests passed; an additional three-IWM-spread probe with reversed/interleaved evidence preserved six distinct legs and three distinct targets. No blocking counterexample found. Reviewer did not repeat brokerage reads; installed observations remain the implementing engineer's evidence. Principal Product acceptance is not inferred.
- Runtime resolves directly to the committed checkout; no installer, service restart or broker-write path is involved. Subsequent defect-record/projection persistence changes no runtime module. The implementation commit is `0af729dc`; final checkout/remote SHA is reported at delivery.
- End-of-workstream memory check: no new Product semantics, principle, ADR, PL item, horizon or assimilation resolution. Existing ASSIM-0002 remains open. The sole new defect identity is BUG-056; generated Roadmap metadata is refreshed from this record, without v1 financial calculation changes. No API v2, Talk, transport, credentials, services or databases are changed.

Actual installed human output from the engineering observation (October 30; transient quotes):

```text

Account XXXX0059
SYMBOL            TRADE SHAPE            RANGE             SPOT           DTE                      EXIT PROGRESS                       P/L   QUOTE
IWM      ___╱‾‾‾‾‾‾‾‾‾‾‾▲‾‾‾‾‾‾‾‾‾‾‾‾‾‾  ≥268            279.15    ◆────────── 42/42d  −$17   │───────────│───◆─────────│$28        +$0.50      3s
IWM      ____╱‾‾‾‾‾‾▲‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾  ≥272.5          279.15    ●────────── 42/43d         ☠︎.........◆←│..............—         −$22.50      3s
QQQ      ___▼╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾  ≥700            692.03    ●─────M───◆ 49/51d  −$60 ◆←│───────────│─────────────│$130     −$181.50      4s
SPY      _____╱‾‾‾▲‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾  ≥755           757.195    ●─────M───◆ 49/51d  −$71 ◆←│───────────│─────────────│$167     −$136.50      4s
UNG      ____╱‾▲‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲____  9–13             9.035    ────●────── 28/45d         ..........◆.│─────↩︎───────│$7        −$17.50     55s

```

## Remaining ambiguity / limits

No membership ambiguity was observed for the two current IWM spreads. Shared-contract aggregate holdings, partial allocations, overlapping historical opening evidence and incomplete opening coverage remain explicitly ambiguous; this is not a general lifecycle reconstruction engine. October 29's missing active management is observed broker evidence, not an order repair performed here. Existing quote freshness, valuation qualifications, provisional stop execution semantics and experimental movement indicators remain unchanged.

## Related

- [BUG-041](BUG-041-tt-live-credit-vertical-aborts-scan.md)
- [TT Live contract](../cli/tt-live-panel.md)
- [Maintained Position meaning](../knowledge/domain/positions-and-governed-quantity.md)
