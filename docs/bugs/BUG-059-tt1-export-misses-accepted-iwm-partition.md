# BUG-059 — TT1 export misses the accepted IWM partition repair

- **Status:** Open
- **Severity:** Not established
- **Area:** CLI / TT1 export release composition
- **Provenance:** Principal report, November 3, 2026: “The export still fails to separate the two IWM spreads, even though tt live was repaired.”

## Observed failure

The installed exporter release `6c573491` bundled a pre-BUG-056 `tastytrade-live-domain.mjs`. The November 3 18:05:57 export therefore represented the four same-expiry IWM legs as one unsupported structure, although ordinary tt live had the accepted opening-order partition fix.

## Intended semantics violated

The exporter reuses standalone tt recognition. Equivalent broker evidence must yield its accepted two separately evidenced IWM packages, credits, opening times and exit associations. The exporter must not reinstate a resolved recognition defect through stale release dependencies.

## Diagnosis / accepted precedent

Accepted BUG-056 implementation `0af729dc5369a7be2eef2d9f988eaef2b1ad07e5` partitions whole current holdings using validated filled opening orders, not strike proximity or shared expiry. Its 13 dedicated regressions and Principal acceptance are recorded in accepted-main `docs/bugs/BUG-056-tt-live-multiple-same-expiration-spreads.md`. That module was absent from the older exporter delivery branch. This is a new consumer/release defect; BUG-056 remains resolved.

## Scope / non-goals

Reuse the exact accepted domain module and tests; no second recognition algorithm or new Position identity. Preserve the repaired Greek stream, freshness gates, all raw brokerage evidence and calculations for other holdings. The export's legacy held-margin binder knows only underlying/expiry; after splitting positions it must withhold ambiguous aggregate BP rather than assign one full group twice. No pro-rata allocation or margin-model expansion. No orders, trading strategy, v2/Talk/service, credential or grant changes.

## Acceptance criteria

The collector, TSV and published ZIP contain two recognized IWM packages with distinct opening credits and exit associations. Four held contracts reconcile once. Replay of one identical source cut leaves QQQ and every non-IWM position deeply equal. Multiple same-scope packages cannot each inherit full aggregate group BP. Verify ordinary installed export and complete independent Greek coverage after packaging.

## Remediation history

Recovered accepted main `c87facff` and imported its domain module byte-for-byte (Git blob `7339561d71a8baa646214f653db65d86fee2a28c`) plus its 13 regressions into the existing exporter repair branch. Added collector-to-ZIP regression and a guard/test against duplicate aggregate margin attribution. No independent-review claim is made; this continues the Principal-directed exporter repair and earlier push-without-review instruction. Installed verification is pending at this source freeze.

## Verification

Replayed the exact private 18:05:57 ZIP through old and corrected modules using the original observation instant. Old output was deeply equal to the stored projection, establishing a faithful reproduction. Corrected output had six recognized structures, including two IWM packages with opening credits $0.58 and $0.65 and distinct source opening instants. The former retained its target/stop; the latter retained absent exits. All non-IWM positions were deeply equal, including QQQ's $241 opening credit and estimated gross unrealized loss of $222.50 at that source cut. These are historical snapshot figures, not a current liquidation quote or instruction.

57 focused tests passed (two unavailable private historical fixtures skipped). Coverage includes the accepted 13 partition regressions, collector/TSV/ZIP integration, distinct target identities, unchanged QQQ economics, conservative margin binding, Greek batching/deadlines, helper shutdown and large ZIP integrity. Another 234 shared credit-spread, economic-story, scan, renderer and CLI tests passed. Total: 291 passed, two unavailable private fixtures skipped.

## Related

[BUG-057](BUG-057-tt1-export-hangs-and-exceeds-package-capacity.md); [BUG-058](BUG-058-tt1-greek-subscription-message-limit.md); accepted-main BUG-056 and ADR-016 membership/association discipline. The exporter branch predates BUG-056's canonical filing; this repair does not alter its accepted-main record or standalone tt launcher.
