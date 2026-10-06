# BUG-029 — Tradier quote source-event timestamps can persist malformed non-time tokens

- **Status:** Resolved
- **Severity:** Not established
- **Area:** Backend / Tradier direct-quote normalization and canonical persistence
- **Provenance:** Bounded `ww show` contract review, October 5, 2026, against accepted main `3ac333e7fea79ccd249015cda9f552994c30184b`

## Observed failure

Read-only inspection during the October 5 `ww show` contract review demonstrated malformed present `sourceEventAt` values in persisted canonical direct-quote holdings. The review reported 204 holdings and 590 malformed present last/bid/ask event-time values at inspection.

The SPY specimen included:

    last.sourceEventAt = "prevclose"
    bid.sourceEventAt  = "asksize"
    ask.sourceEventAt  = "root_symbols"

These values are not date-time values and contradict the canonical event-time contract.

## Intended semantics violated

Canonical direct-quote event times are optional source-market event timestamps. A present event time must be a valid canonical date-time value. Absence must remain absence; an unrelated provider field name must never be persisted as a timestamp.

The accepted evidence model requires truthful facts/provenance and prohibits fabrication or semantic substitution.

## Evidence

The bounded review traced the behavior to the Tradier adapter's quoted-string extraction path used by quote-date parsing. The reported diagnosis is that `extractQuotedString` searches for a later quotation mark after the colon without first requiring the field value itself to be a quoted string. When the intended field value is not quoted/present in the expected form, parsing can capture a later JSON key token.

Repository locations identified by the review:

- `evidence-service-java/src/main/java/com/wheelwright/evidence/provider/TradierAdapter.java` around the quoted-string extractor and quote-date parsing.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/DirectQuoteService.java` around canonical observation mapping.
- Existing anomaly provenance in `docs/journal/project-journal-5.md`.

The review was read-only. No remediation or evidence reacquisition occurred.

## Consequence

Persisted canonical observations may contain malformed source-event timestamps while otherwise containing useful quote facts. A strict singular held-evidence reader must reject such an observation rather than launder the malformed representation into an apparently valid canonical observation.

The newly ratified `ww show` contract therefore requires strict full-observation decoding before projection. For an affected current holding, even a projection that excludes the malformed timestamp must fail until valid canonical evidence replaces the malformed holding.

Severity is **Not established**. Filing this defect does not assign remediation priority.

## Diagnosis / root cause

Confirmed by a failing production-parser regression on October 5, 2026, before production changes: `trade_date: 1757948508561` followed by `prevclose` returned `"prevclose"` instead of `2025-09-15T15:01:48.561Z`. The same mechanism returned `asksize` for numeric `bid_date` and `root_symbols` for numeric `ask_date`.

`extractQuotedString` found the requested token with `indexOf`, found a subsequent colon, then searched anywhere after it for a quote. It never checked the intended value's type or boundary. Numeric/null/container values could therefore capture adjacent keys, and quoted values could be mistaken for keys. Escape handling and brace counting were also textual rather than JSON-aware.

The [official Tradier quote example](https://docs.tradier.com/docs/quotes) retrieved during investigation supplies integral epoch-millisecond `trade_date`, `bid_date` and `ask_date` values. These are valid provider time evidence requiring normalization, not missing timestamps. The original direct-quote path had no timestamp normalization: it mapped extracted strings directly into canonical facts and checked only the positive-price predicate before persistence.

The shared string helper also served quote descriptions (legacy quote and index glance), direct-quote symbol/type/exchange/venues, unmatched symbols, option type, intraday bar time and Greek `updated_at` text. Its field-boundary defect therefore was not timestamp-specific. The direct-quote object slicer separately counted braces inside strings, and nested namesakes could be read as top-level facts; structural parsing removes those manifestations within the same producer boundary.

## Scope / non-goals

This defect covers malformed direct-quote source-event timestamps produced/persisted through the Tradier normalization path.

It does not:
- grant continuing remediation authority by its existence;
- authorize mutation/repair of persisted rows;
- authorize automatic substitution of receipt/commit/other timestamps;
- redefine direct-quote acquisition semantics;
- redefine `ww show`;
- authorize provider fallback or provider abstraction work;
- assert that all persisted observations are otherwise invalid.

Already-persisted malformed evidence must not be silently repaired by a read path. Whether affected observations are replaced through ordinary reacquisition after parser remediation is a separate execution/remediation decision.

## Acceptance criteria

An eventual authorized remediation must demonstrate at minimum:

1. Provider fields that are absent, null, numeric, object/array, malformed, or otherwise not valid source-event date-times cannot cause a later JSON key/value token to be captured as the timestamp.
2. Valid supported source-event timestamps continue to normalize correctly.
3. Missing source-event time remains absent; no fallback clock is fabricated.
4. Canonical persistence cannot accept malformed present source-event timestamps through this path.
5. Focused regression specimens include the observed token shapes such as `prevclose`, `asksize`, and `root_symbols`.
6. Existing acquisition truth, provenance, and missing-value semantics remain unchanged.
7. Any treatment of already-persisted malformed observations is explicit and does not silently rewrite evidence history.

## Remediation history

### 2026-10-05 — Bounded producer remediation (Codex)

Principal explicitly authorized BUG-029 investigation, implementation, focused acceptance, canonical lifecycle update and commit/push from synchronized accepted `d47c3e3b6364ed8e5d12d70dc5faa851b819b2aa`. This authorization does not extend to persisted-row repair, market acquisition, BUG-028 or BUG-030.

Only production `TradierAdapter.java` changes:

- Parse the direct-quote envelope/object/array and exact members structurally with existing Jackson; remove textual object slicing and quoted/numeric field scans from this path. Duplicate keys, trailing tokens and malformed JSON fail parsing.
- Normalize each own `trade_date`, `bid_date` and `ask_date`: integral JSON epoch milliseconds or an explicit ISO offset-date-time string become canonical UTC. Zero epoch remains a real timestamp. Absent/null remains absent. No receipt, commit, bundle or neighboring timestamp fallback exists.
- Reject malformed present timestamps (including non-time strings, timezone-free strings, invalid calendars, fractional numeric values, containers, booleans, overflow and dates outside the canonical four-digit year range). The existing source exception handling reports `UPSTREAM_FAILED`; malformed refresh does not overwrite prior successful evidence. No new status/contract is introduced.
- Replace the remaining shared string extractor with structural streaming lookup of actual string members in a flat object or the known single-quote envelope. Wrong-type/missing strings remain absent; escaped strings decode correctly and nested namesakes/value tokens cannot supply the member. Streaming preserves the independent legacy numeric scanner, including its existing tested malformed-exponent mantissa salvage; no unrelated chain/Greek numeric rewrite occurs.

Canonical models/mapping, strict decoder, `ww show`, codec, HTTP/OAS contracts and database code are unchanged. **Existing malformed persisted observations, including SPY, were NOT repaired, rewritten, migrated or deleted.** No runtime service restart or market acquisition occurred. Resolution is for future observations only; Principal manual normal reacquisition/acceptance remains separate. After deploying/loading this implementation, normal `ww fetch SPY --force` can replace the holding through existing acquisition semantics; until then strict `ww show SPY` must continue rejecting the malformed holding.

## Verification

The original one-test reproduction failed before production edits with expected canonical timestamp versus actual `prevclose`. The remediated suite passes.

New focused coverage: `TradierSourceEventTimeTest` and `TradierTimestampAcquisitionTest` (11 tests). They cover independent last/bid/ask numeric and string times, epoch zero, absent/null times, reordered fields, nested namesakes, escaped quotes/braces, object/array provider shapes, adjacent observed keys, all shared string-field callers, ordinary quote facts and zero/absence, malformed present timestamps/JSON/duplicate keys, real source-to-canonical mapping and in-memory durable acceptance, malformed refresh retaining prior fixture evidence, and strict rejection of all three bad tokens on all three sides. Fixture adapters override HTTP acquisition with pure parser calls; tests never contact a market provider or open the live evidence database.

Focused Java acceptance: **161 tests, zero failures/errors/skips**, 25 suites, Java 21:

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 21) evidence-service-java/gradlew -p evidence-service-java test \
  --tests '*TradierTimestampAcquisitionTest' --tests '*TradierSourceEventTimeTest' \
  --tests '*TradierAdapterTest' --tests '*IntradayBarsParsingTest' --tests '*IndexMarketParsingTest' \
  --tests '*DirectQuote*Test' --tests '*StrictHeldQuoteDecoderTest' \
  --tests '*HeldQuoteDetail*Test' --tests '*HeldQuotesControllerTest' \
  --tests '*HeldDirectQuoteStoreTest' --tests '*V2QuotesControllerTest' \
  --tests '*HeldQuoteCodecTransportTest' --tests '*PathSymbolCodecTest' --console=plain
```

This covers acquisition/subject verification/contact/correlation/reuse, strict held detail, collection/instance GET and real-container codec preservation, existing POST and stores. BUG-030's intentionally failing rejected-design task is excluded by the existing build configuration; neither it nor BUG-028 was remediated. The existing unrelated deprecated-annotation compiler warning remains.

CLI: **48/48** Node tests; deterministic fetch shell/terminal acceptance **10/10**, zero legacy/chain requests:

```sh
node --test scripts/ww-show.test.mjs scripts/ww-ls.test.mjs scripts/ww-fetch.test.mjs scripts/wheelwright.test.mjs
node scripts/ww-fetch.acceptance.mjs
node scripts/ww-show-man.mjs --check
python scripts/ww-show-oas-validation.py
python scripts/ww-ls-oas-validation.py
npm --prefix options-prototype run generate:roadmap-projection
npm --prefix options-prototype run check:roadmap-projection
git diff --check
```

OAS checks use an isolated temporary Python environment with PyYAML/jsonschema/openapi-spec-validator. Documentation links/status/index consistency and generated projection freshness checked. No new Product/architecture decision or strategy/horizon change arises. Existing implementation acceptance documents remain dated provenance of their own earlier scopes; their historical BUG-029-open statements are superseded by this canonical resolution.

### 2026-10-05 — Principal normal reacquisition and live strict-read confirmation

After remediation commit `4fd3ad1ed8eae4e7e9fa79fbdcdf32ae404b5caa`, Principal supplied the successful transcript of:

```sh
ww ls quotes | cut -f1 | xargs -n 30 ww fetch --force
```

Six 30-subject batches and one 24-subject batch reported **204/204 NEWLY_ACQUIRED, zero reused, zero failed**. This was Principal-performed normal acquisition, not an agent repair/migration or automated acceptance acquisition.

Codex then performed provider-free read verification only. `ww show SPY --jsonl` returned exit 0 and observation `62b3011e-3f90-41f9-9ece-9c39e779bcec`, with `last.sourceEventAt = 2026-10-06T00:00:00.004Z` and independent bid/ask event times `2026-10-05T23:59:58Z`. A fresh `ww ls quotes` inventory followed by `ww show --jsonl` for all inventoried symbols returned **204/204 complete strict-read successes**, exit 0, empty stderr and exact inventory order/identity.

The previously malformed current holdings have therefore been replaced through ordinary acquisition and the newly held observations pass strict reads. This does not claim that historical evidence was rewritten or repaired. Codex performed no market acquisition, database mutation or runtime restart. These are Principal-reported reacquisition results plus independently observed read verification; no additional Product acceptance declaration is inferred.

## Related

- `docs/contracts/api-v2-subject-show-held-quote.md` — strict detail-read contract; must fail rather than conceal malformed canonical detail.
- `docs/contracts/api-v2-direct-quote-acquisition-proposal.md` — canonical direct-quote semantics.
- `docs/77-api-v2-architectural-guardrails.md` — v2 architectural guardrails.
