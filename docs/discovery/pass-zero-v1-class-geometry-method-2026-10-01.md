# Pass 0 v1 — Class-specific option-geometry census

**Status:** Principal-adopted research methodology (2026-10-01; Category B within this bounded research program); ancillary reference-evidence refinement adopted after the first bounded pilot.

**Canonical intake:** `PL-RESEARCH-01` Universe Discovery.

**Input:** [Pass −1 v0](pass-minus-one-v0-occ-tradier-identity-snapshot-2026-10-01.md), frozen at `74ab143d73313cd664fa30760b09bb7173217671`.

**Execution state at adoption:** Method adopted; no full-population Pass 0 acquisition had been run or authorized as the next action. The next research action was a bounded specimen-selection pilot. Its later evidence is recorded [separately](pass-one-specimen-selection-bounded-pilot-2026-10-01.md).

## Decision and stage boundary

Pass 0 v1 is a **dated, class-specific option-geometry census** over the complete frozen Pass −1 denominator. It records the option geometry and evidence state that Tradier exposes at observation time. It does not determine eligibility, rank markets, or select a unique risk-comparable specimen.

Every one of the **6,381 OCC ordinary option-class rows** remains in the Pass 0 input, with its OCC underlying and class identities intact. The **6,072 distinct underlying** denominator remains separately reportable. The 101 class rows without a resolved Tradier class root at Pass −1 are still census members; they begin with an identity-unresolved evidence state rather than disappearing. A later identity observation can add evidence without rewriting Pass −1.

For each class whose provider root is explicitly resolved, the observation preserves the exact provider root and the future put contracts it exposes, grouped by actual expiration and strike. It records whether a same-class, same-expiration put strike pair exists. Observed DTE, expiration type where supplied, strike spacing, and candidate DTE-window availability are **attributes**, not eligibility decisions. Multiple roots under one underlying remain distinct. A provider expiration union across roots must not be treated as proof that a particular class has that expiration.

Each row needs a class-level outcome and provenance sufficient to distinguish at least: identity unresolved; acquisition/evidence incomplete; exact class observed but no future put contracts; future puts but no same-expiration strike pair; and same-expiration pair observed. These states must not be inferred from a partial or failed acquisition. Preserve raw provider responses and request/response timing, hashes, queried symbol, observed root, contract identity, put/call, expiration, strike, and any source fields needed to replay the classification. Retain contract-term or deliverable uncertainty as an orthogonal evidence flag; `contract_size` alone does not establish a standard 100-share deliverable.

No Pass 0 **class-geometry state** depends on bid/ask spreads, quote sizes or ages, open interest, volume, Greek presence or freshness, broker liquidity labels, or whether a candidate seems like a good ETF. Those belong to later work. The raw record may retain provider fields beyond geometry so long as they do not choose or suppress census rows.

## Ancillary reference evidence for downstream replay

Alongside each dated geometry observation, capture a timestamped Tradier underlying quote and the underlying price history specified by the **declared** downstream Pass 1 replay protocol. Preserve the raw bodies, provider symbol and explicit alias edge where relevant, request/response UTC times, provider-supplied timestamps or bar dates, and hashes. A single underlying reference bundle may be linked to multiple option-class rows, but those rows retain their distinct class roots and geometry. Record temporal separation between quote, history, and chain acquisitions rather than asserting simultaneity.

Reference evidence is **ancillary**. Only identity and class-specific option geometry determine the Pass 0 class state. Missing, incomplete, or not-yet-interpretable quote/history evidence receives a separate reference-evidence state; it does not convert observed geometry into a failure or remove a class from either frozen denominator. An unresolved provider identity remains unresolved for reference acquisition too; no similar ticker is silently substituted. Pass 1 may withhold a specimen conclusion that depends on insufficient reference evidence.

The historical lookback, price-adjustment convention, reference-price field, freshness semantics, and risk coordinate are not selected by this decision. Declare the history acquisition window and replay provenance before a full-population run so the captured bars actually cover the later selector. Do not calculate a preferred specimen, volatility-based eligibility, or market-quality verdict in Pass 0. Adjusted-class deliverables and any class-specific reference-price transformation still require applicable contract authority beyond Tradier's `contract_size` field.

## Why a narrow DTE gate was rejected

An offline sensitivity check decoded the option-symbol strings in the frozen Pass −1 Tradier lookup bodies. Of 6,280 class-root-resolved rows, 6,038 had at least two put strikes at one exact-root expiration in a 40–50 calendar-DTE window as of 2026-10-01. Holding the **same frozen option listings** fixed while moving only the hypothetical observation date yielded 13 rows on 2026-10-15 and zero on 2026-10-22. This is a calendar-phase counterfactual, not a later live market observation. It falsifies 40–50 DTE availability as a stable structural pass/fail gate: the result can change sharply without any change in the listings.

The frozen lookup strings are sufficient for this sensitivity test, but they do not constitute a fresh Pass 0 chain census or establish contract deliverables, contemporaneous reference prices, or Greek freshness. The earlier 30-root panel was an instrumentation fixture and carries no representativeness claim.

## Subsequent stage and next bounded experiment

Pass 1 asks whether a unique risk-comparable specimen can be selected from recorded geometry **and its paired reference evidence**, without using the liquidity or quote-quality features that later stages will measure. Its rule is not frozen here. The first bounded pilot tested a provisional coordinate and exposed reference-provenance and adjusted-deliverable needs; the [pilot record](pass-one-specimen-selection-bounded-pilot-2026-10-01.md) preserves its evidence and limits. Further bounded selector work must resolve expiration phase, risk coordinate, strike-grid tolerance, nonstandard deliverables, and unmatched behavior before a full-population Pass 0 crawl.

Later passes may observe raw market quality, longitudinal stability and fitness drift, and eventually actual complex execution evidence. None of these later conclusions follows from structural geometry alone. A future census is a new dated observation, not a mutation of Pass −1 or a rewrite of a previous Pass 0 observation.

## Scope of adoption

This decision establishes the research methodology and evidence boundary, including ancillary raw reference capture for replay. It does not authorize Wheelwright maintained-universe admission, provider-backed production acquisition, a full 6,381-row crawl, quality screening, an Exit Reliability score, or a specimen-selection rule. The next research work remains bounded selector and reference-protocol resolution.
