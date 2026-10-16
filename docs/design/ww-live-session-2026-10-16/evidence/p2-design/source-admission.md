# P2 affirmative source-admission specimen

## Evidence classification and chain

Committed source `scripts/fixtures/tt-live-economic-observed.json` at7ae274c is the accepted sanitized historical19:21:15.312Z October14 capture, supported by `docs/design/tt-live-economic-story/verification.md:10`. SHA2567f6788c4fb6fb92a27c3bc4f2a61316c9718e8b2f0cf534eb7915f94784dc8e9. It is not a currently acquired v2 source or operational state. Its native holdings/instrument records are genuine recorded observations after sanitization; source account/IDs are redacted test values.

`fixtures/holdings.json` and `fixtures/instruments.json` preserve the four XLE records unchanged with exact JSON pointers to that capture. Envelopes generated for future local fake-provider tests are reconstructed, not original transport bytes. No raw production source or credential is copied. The positive association POST body below is explicitly synthetic authenticated operator intent, not a claim that the historical Wheelwright User actually authored it. Operator intent is a new authoritative Wheelwright fact created only by the proposed capability; it is not manufactured brokerage evidence.

This specimen closes the *design path* rather than claiming an operational managed Position already exists. The source-to-conclusion path is finite and no longer deferred:
1. Existing PositionAcquisition retains native holdings and admits account-isolated signed constituents.
2. New explicit contract-terms acquisition retains native instrument definitions through the existing backend client, using the same authentication custody.
3. New authenticated Position association assertion establishes exactly which observed quantities the authorized operator manages together. No geometry decides this.
4. Pure GET composes exact selected snapshot, applicable assertion and retained terms, yielding current structural facts. Economic occurrence/opening stays unknown.

Existing main alone cannot complete steps2–3. These are precise missing backend capabilities, included in the P2 API design instead of silently required from the CLI or an instrument sidecar. Demonstration uses real recorded numerical/source fields and synthetic authoring; real operator authoring/acquisition and installed Product acceptance remain later separately authorized actions.

## Field-by-field rules: standard-us-equity-v1

| Source fact | Admission and conclusion |
|---|---|
| Holdings account-number | Must equal backend Account binding; never public ID. Secret screen and exact source ownership as existing acquisition. |
| Holdings symbol, instrument-type | Existing native parser validates Equity Option and OCC identity; exact instrument record symbol must match normalized contract identity without losing adjusted root. |
| Holdings quantity/direction | Whole nonnegative source quantity plus Long/Short; normalize to signed nonzero integer. Source index preserved. |
| Option instrument-type | Exact Equity Option, not futures/index model guessed from similar spelling. |
| option-chain-type | Exact Standard; missing/nonstandard/adjusted/unknown classification is not eligible for this admission lane. |
| shares-per-contract | Explicit integer100, never sourced from holding multiplier or assumed from OCC padding. Missing or conflicting => no qualified terms. |
| option-type/strike-price | C/P and positive exact decimal, cross-checked against holding's encoded right/strike. |
| expiration-date/expires-at | Exact contract date agreement; supplied instant must agree and parse. Native expired source excluded only at evaluatedAt, not asserted executed close. |
| underlying-symbol | Must agree across all four native definitions and holding roots for this Standard lane. Unknown adjusted-root mapping is not stripped. |
| exercise consideration | Under the supported Standard100-share US equity product rule, strike×100; fixed cash0, USD. This is a versioned financial interpretation of explicitly standard terms, not a raw reported money field. |
| Association allocation | New authenticated ASSERT lists existing snapshot holding IDs and exact signed portions; Account/snapshot/kind/sign/integer/conservation/unique claims checked before admission. The backend records User identity internally and receipt time; clients cannot supply author authority. |
| Current membership | Association is applicable only to its exact selected snapshot and not withdrawn/superseded. This asserts operator-managed membership, not that a brokerage order is still intact. |
| Opening/occurrence | Always unavailable in P2. Neither updated-at, receipt time, order ID nor geometry establishes them. |

The product rule's provenance is documented native instrument semantics plus standard equity contract economics: native shares-per-contract means underlying shares deliverable, and Standard US equity options exercise at strike for100shares. This lane explicitly relies on that documented provider classification. Do not admit a source claiming index/cash settlement, a conflicting underlying definition, non-Standard classification, adjusted root, non100deliverable or evidence of a corporate adjustment. A `settlement-type` value AM/PM is timing, never evidence of physical/cash settlement. Future source falsification invalidates affected qualification; it is not waived for a plausible graph.

External primary sources (read during design, not broker API calls):
- https://developer.tastytrade.com/reference/instruments/getInstrumentsEquityOptionsSymbol/ : native symbol/right/strike/expiry/underlying/Standard classification and explicit deliverable shares.
- https://www.optionseducation.org/optionsoverview/options-basics : standard equity contract strike/share meaning, adjusted terms distinguished.
- https://www.optionseducation.org/advancedconcepts/equity-vs-index-options : physical equity settlement versus index cash settlement. This is a financial interpretation rule, not proof that every item labeled Equity by a quote provider is a physical underlying.

## Exact positive expected facts

Use the source date exactly: expiration **2026-10-16**. Evaluate at captured2026-10-14T19:21:15.312Z for this historical *design specimen*, not as current monitoring replay.

| Contract | signed quantity | right | strike | shares |
|---|---:|---|---:|---:|
| XLE 261016P00059000 | +1 | PUT |59|100|
| XLE 261016P00059500 | -1 | PUT |59.5|100|
| XLE 261016C00064500 | -1 | CALL |64.5|100|
| XLE 261016C00065000 | +1 | CALL |65|100|

After synthetic authorized ASSERT and qualified native terms: membershipESTABLISHED/EXPLICIT_ASSOCIATION; underlyingXLE; units1; IRON_CONDOR; range[59.5,64.5]; remainingDte2 by New York dates; occurrenceUNKNOWN; openingUNKNOWN. Piecewise total exercise value knots are(0,-50),(59,-50),(59.5,0),(64.5,0),(65,-50), right-tail slope0. No opening premium or market quote is consumed. This is exact gross intrinsic value, not profit/loss. At an actual current evaluation after expiry, these holdings must be excluded, so this historical specimen is never displayed as presently open.

## Paired negatives

1. Remove only shares-per-contract from one native record: membership can stay established, but terms/payoff/range areUNKNOWN. Mutation labeled synthetic; original extracted records preserved.
2. Remove only the association assertion: four matching holdings remain separate residuals, never a condor. Independently qualified per-option geometry can remain.
3. Change only chain classification to adjusted/nonstandard, or shares to50: P2 native lane isUNSUPPORTED, not a100-share curve. Generic curve model can support adjusted coefficients only after a separately reviewed complete adjusted-term admission lane.
4. Add a competing allocation exceeding an observed quantity: association POST rejects422 atomically; malformed legacy overlapping claims produce conflicting residuals in GET.
5. Use source at an evaluation after the exact expiration instant: no current row; no executed-close inference.
6. Same holdings/terms with another separately admitted package using different portions: two separate snapshot association IDs; no merge from symbol/expiry.

`verify-design.py` checks extraction lineage, native field relationships, exact arithmetic and these declared negative-rule preconditions. It is a design verification oracle outside the repository, not backend implementation or an HTTP runtime test. Future backend tests must exercise actual controllers/admission/storage against the same source records and expected conclusions.
