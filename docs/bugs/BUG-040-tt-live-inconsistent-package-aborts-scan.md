# BUG-040 — Inconsistent package midpoint aborts the entire tt live scan

- **Status:** Resolved
- **Severity:** Not established
- **Area:** CLI / tt live
- **Provenance:** Principal report, production reproduction and explicit “file it and fix it” instruction, October 13, 2026

## Observed failure

`tt live` returned `Live: indicative package value is inconsistent; use tt positions for broker evidence` instead of any rows. Read-only reproduction at 2026-10-13T20:39:09Z identified UNG as the trigger; EWZ and XLE were also suppressed. Installed tt resolves to this repository. Baseline main: `eac81b5fa7a10a137c6e0de80b9e9d080fd73079`.

## Intended semantics violated

Unavailable closing-price evidence must withhold dependent conclusions, not independently supported holdings and unrelated rows (options-domain competence contract §§7, 12). Preserve the accepted compact tt scan and verified opening/exit facts. Indicative midpoint never establishes execution.

## Evidence

Observed UNG November 27, 2026 quotes: one contract per leg, multiplier 100.

| Holding | Bid | Ask | Mid | Update UTC, October 13 |
|---|---:|---:|---:|---|
| Long $8.50 put | 0.00 | 0.12 | 0.060 | 20:35:27.046 |
| Short $9 put | 0.01 | 0.14 | 0.075 | 20:35:27.378 |
| Short $13 call | 0.17 | 0.45 | 0.310 | 20:35:27.377 |
| Long $13.50 call | 0.27 | 0.42 | 0.345 | 20:35:26.640 |

Derived midpoint closing debit: `0.075 + 0.310 - 0.060 - 0.345 = -0.020`. Every leg passed individual validation. EWZ/XLE closing debits in the same response were approximately 0.575/0.485. These establish triggering observations, not an upstream broker defect or executable price.

## Consequence

One unusable valuation prevented the whole Account scan, hiding unrelated rows and independently supported facts.

## Diagnosis / root cause

`quoteEconomics` threw a whole-command LiveError for a negative package midpoint, even before stale evidence could suppress dependent values. Why the broker leg quotes produced the combination is not established. The guard predates the latest presentation changes.

## Scope / non-goals

Principal authorized Codex to implement this bounded correction. Existing standalone tt projection and renderer only. No new service, Position abstraction, membership semantics, brokerage operation, acquisition change, backend migration, database change or service restart. No independent review is claimed.

## Acceptance criteria

- Keep recognized rows visible when individually valid leg quotes imply a negative package midpoint.
- Withhold affected closing debit, P/L, daily P/L and exit progress; do not fabricate zero or target crossing.
- Preserve verified opening credit, exit objective, lifespan, independent spot/payoff evidence and unrelated rows.
- Keep freshness separate from consistency; use existing amber QUOTE treatment for degraded valuation.
- Preserve canonical TSV with `valuation unavailable`; valid zero debit remains supported.
- Missing/duplicated/malformed quotes and ambiguous holdings/orders remain fail closed.

## Remediation history

October 13, 2026: inconsistent closing debit becomes null; existing unavailable-value rendering withholds dependent economics and retains rows. TSV progress explains unavailability; QUOTE uses existing amber treatment. Existing numerical tolerance for effectively zero values is unchanged. No new architecture or financial model.

## Verification

October 13, 2026: 69/69 `scripts/tastytrade*.test.mjs` tests pass. New regressions use observed UNG quotes with explicitly synthetic opening/exit/account evidence, prove identical unaffected projections, Unicode/ASCII/color output, canonical TSV, stale inconsistent quotes, valid zero debit and preserved missing/malformed quote rejection.

Installed `tt live --no-color` successfully returned UNG, EWZ and XLE. UNG retained opening-day SPAN, LIMIT objective, spot and payoff, with unavailable P/L and exit progress; EWZ/XLE retained numeric economics. Engineering-observed installed behavior is established; independent reviewer and Principal Product acceptance are not claimed. Ordinary `tt live` is available without configuration.

## Session closeout — October 13, 2026

Fix and reconciliation persisted on main as `f6e84102973c6c73bb3586f63e43d0c915a30a68`; installed tt resolves directly to the corrected checkout. Principal invoked end-of-session closeout without an explicit Product acceptance verdict. Status Resolved records demonstrated technical remediation, not inferred Principal acceptance. Independent review was not commissioned/performed. Remaining observation: ordinary `tt live` by the Principal. No additional implementation, architectural decision, horizon change or operational action follows from closeout.

## Related

- [Accepted terminal contract](../cli/tt-live-panel.md)
- [Domain competence contract](../foundations/options-domain-competence-contract.md)
- `scripts/tastytrade-live-domain.mjs`
- `scripts/tastytrade-live-render.mjs`
- `scripts/tastytrade-exit-render.test.mjs`

## October 13 follow-up — recover available broker mark valuation

The Principal reported that UNG PROFIT and P/L were still missing and explicitly instructed Codex to fix it. The initial correction preserved the scan but unnecessarily withheld available valuation evidence. Its prior completion and no-further-work statements above describe that earlier closeout, not this new instruction.

Read-only broker reproduction at approximately 21:01 UTC showed the same four midpoints (`0.060`, `0.075`, `0.310`, `0.345`) and separate marks (`0.060`, `0.075`, `0.368142454`, `0.345`). The short-call mark differs from its midpoint. The whole-package mark closing value is `0.075 + 0.368142454 - 0.060 - 0.345 = 0.038142454`. Actual opening credit is `0.09`, limit is `0.02`, quantity one and multiplier 100. Derived gross P/L is `5.1857546` dollars; progress toward the limit is about `74.0822%`.

External grounding: tastytrade's [market-data schema](https://developer.tastytrade.com/reference/market-data/getMarketDataByType/) distinguishes `mid` (bid/ask midpoint) from `mark` (price used for valuation). Neither is execution evidence. The response already supplies both; no acquisition, service, persistence or brokerage-action change is needed.

### Bounded correction and proof

- Product specimen: ordinary installed `tt live` shows UNG numeric P/L and exit progress, alongside EWZ/XLE, using available broker valuation evidence. Reuse the accepted panel, package recognition, opening fills, limit linkage and existing freshness rules.
- Capability gap: the previous implementation discarded the separate mark evidence when package midpoints were negative. Extend the existing valuation function; no new abstraction or rendering system.
- For a negative synthetic midpoint only, use all four broker marks when every mark is finite, nonnegative and within its leg's bid/ask, and their signed package sum is nonnegative within existing tolerance. Never mix midpoint and mark sources across legs. Daily P/L uses the same selected package source.
- Missing, malformed, out-of-spread or still-negative mark packages retain unavailable dependent values. Coherent midpoint valuations, valid zero, stale/retained-session rules, quantity/multiplier scaling and unrelated rows retain their prior behavior.
- The domain records the selected valuation source. Mark fallback retains amber QUOTE treatment and adds a TSV NOTE identifying `broker mark valuation; negative package midpoint`. A valuation note does not create the broker-order transition marker `T`.
- Falsifiers: observed four-leg snapshot and reported opening/limit prices; malformed/incomplete/negative mark packages; coherent midpoint priority; stale/retained marks; unchanged unrelated projections; Unicode/ASCII/color output and TSV source disclosure. These are executable regression checks, not externally enforced proof or independent review.

### Verification and disposition

All 72 `scripts/tastytrade*.test.mjs` tests pass. Installed `tt live --no-color` returned UNG `LIMIT ... +74%` and `+$5.19`; EWZ/XLE retained their numeric economics. This is engineering-observed installed behavior. Independent review and Principal Product acceptance have not been performed or inferred. BUG-040 remains technically Resolved with this supplemental correction; the earlier missing-data observation is retained above as provenance.
