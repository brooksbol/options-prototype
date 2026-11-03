# Candidate change report — NOT ACCEPTED / NOT PUBLISHED

Frozen PR45 source: `d0f2f10699e811ef9286c843f9896a39336d8afc`. PR base: `c87facff6179ddb1abf4a36fa38f2a4ea0ae5151`. Accepted publication source recorded in unchanged release.json: `dbdd6ea037a8ed8d6be57da403e95d0f569a0300` (36 internal /32 public operations). Candidate:39/35.

The three operations added since the accepted publication inventory are GET account-balance-observations, GET option-inventory and GET quotes/{symbol}/liquidity. All three already exist on the PR base. PR45 adds no operation or operationId.

PR-base → candidate changes:

- Positions inventory gains optional expiration selection and returned expiration/marketAcquisition; selection retains complete matching position contexts and companions.
- Metric, PriceMetric and TacticalMetric gain optional receivedAt, separate from source observation time.
- Inventory constituents gain optional separately sourced reportedOpenPl. This does not establish current mark-to-market P/L.
- Balance collections gain optional acquisition status/receivedAt. Unpinned latest-source behavior may acquire or reuse a provider balance; retained, pinned and lower-bound reads remain distinct.
- Latest-source balance scanning removes the200-artifact ceiling while retaining32MiB; all-history retains its200-artifact ceiling.
- Liquidity documents inherited405. Source links, tags and five examples are corrected. Existing global quote contract remains unchanged.
- Preview validation now verifies current39/35source/bundle/public fidelity; accepted publication hashes and guard remain unchanged.

Compatibility: additive optional fields can break consumers using old closed response schemas. Balance latest-source behavior changes materially; do not treat it as merely an optional response field. Independent market and custody clocks remain separate.

Known acceptance blockers: balance OAS still says provider-free although eligible latest reads can acquire; capacity prose is not mode-specific. Constructed unpinned latest CSV can acquire before export/hash rejection, contrary to the pinned export contract. Inventory orchestration prose needs clarification. These are preserved findings, not repaired or waived by this bundle.

Detailed old → proposed → reason → compatibility table and controlled evidence are in the existing [PAT record](https://github.com/brooksbol/options-prototype/blob/b299b863b7d7640b531e43e1d1cf4d8cdd195c56/docs/reviews/sdk-talk-architectural-recovery-2026-11-02.md#semantic-change-report-old-contract--proposed-contract--reason--compatibility).

Review the complete contract, not only this change summary. For earlier accepted-publication → PR-base evolution, compare the linked accepted source and candidate sources directly; this report does not imply every intervening change belongs to PR45.
