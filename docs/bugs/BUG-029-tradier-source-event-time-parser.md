# BUG-029 — Tradier quote source-event timestamps can persist malformed non-time tokens

- **Status:** Open
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

The bounded review established a likely concrete parser defect in the Tradier quoted-string extraction path: the extractor can advance to a later quoted token rather than proving that the requested JSON field's own value is a quoted string/date-time.

This record preserves that diagnosis but does not authorize a parser redesign or select a remediation.

## Scope / non-goals

This defect covers malformed direct-quote source-event timestamps produced/persisted through the Tradier normalization path.

It does not:
- authorize remediation;
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

None. Filing does not authorize remediation.

## Verification

None yet.

## Related

- `docs/contracts/api-v2-subject-show-held-quote.md` — strict detail-read contract; must fail rather than conceal malformed canonical detail.
- `docs/contracts/api-v2-direct-quote-acquisition-proposal.md` — canonical direct-quote semantics.
- `docs/77-api-v2-architectural-guardrails.md` — v2 architectural guardrails.
