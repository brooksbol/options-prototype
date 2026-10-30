# Independent Fidelity share-call public-reference geometry review — 2026-10-29

**Disposition: REJECT** for immutable `e961190a66beb22754a7ae01e0e06da8ad62954a`, baseline a465f76f. The independently tested terminal-only financial profile and permission controls work; the new one-day reference reuse gate can falsely renew stale series using an unrelated newer same-underlying acquisition. No Principal/Product/deployment acceptance is implied.

Clean detached checkout: `/tmp/ww-independent-fidelity-geometry-20261029`. Synthetic CSV/SQLite and mocked public client only; no protected records/pixels, real provider/external-model requests, installed services, credentials/grants/policies/v1 or frozen-source changes. Author receipt read for scope/limits, not as the oracle.

## F1 — same underlying refresh renews an uncorroborated stale series

PortfolioFidelityReferences.fresh checks that each requested Instrument has some historical definition and chain URNs, then selects the newest accepted chain imported_at by underlying filename globally. It does not tie that timestamp to the requested series or its required definition/chain observations.

Independent actual owner reproduction:

1. Admit invented Account A custody with ABC shares and call10. Mock public definition and compact-chain originals are admitted October29; terminal geometry qualifies. A repeated read reuses those references.
2. Two days later admit invented Account B with the same underlying but call20. Its new accepted definition and chain corroborate call20 only; the new chain symbols contain no call10.
3. Read A at the later clock. Public acquisition count remains two total batches/two chains rather than reacquiring A. A’s call10 references are48hours old, but B’s accepted same-underlying import makes fresh return true.

This violates the bounded one-day exact-series reference reuse premise. It does not show actual BDRY presently has incorrect terms. A recent observation for some series of an underlying is not proof of a recent observation for every historically known series.

Smallest correction: qualify every requested series against recent accepted definition and corroborating chain observations that actually admitted that exact normalized series and bind to their source artifact/hash/time. Financially identical observations may be recorded as bounded admission receipts without forcing current-resource provenance churn. Failed, future, foreign, malformed or requested-but-unadmitted subsets cannot renew other subjects. Legacy records may conservatively reacquire. Never replace this with a root-only timestamp.

Evidence: AcquisitionProbe.java, actual synthetic source.sqlite3, acquisition-checks.json flag unrelatedNewChainRenewsOldSubject:true. That flag records a failure, not a conformance success.

## Independent financial/source controls that passed

Actual synthetic Fidelity CSV→source owner→mock public definitions/chain→reference enrichment→aggregate emits rising/flat TERMINAL_VALUE geometry. Quote multiplier remains null, full option terms INCOMPLETE and legacy applicability UNKNOWN. Exact Standard/American/100 single-share-delivery profile supplies the separate exercise predicate, not a premium-scale substitution.

Using the actually admitted synthetic profile in PortfolioMath:

- known attributed basis still cannot activate GROSS_PL or economic break-even through the new predicate;
- supplying known source quotes does not create option market value or gross P/L while multiplier is unknown;
- merge is idempotent; later conflicting deliverable revokes the profile;
- cash/non100, missing strike-unit/specification/definition, currency/underlying conflict, adjusted terms and missing expiry fail closed;
- existing fully specified non100 D50 case remains supported.

Actual direct definition admission rejects root, currency, strike, expiration and right mismatches atomically, preserving prior public terms. Removing reference.read after warm caching strips the predicate before evaluation and removes it from the resulting projection, with no additional public acquisition. Normal warm reuse works; it is the unrelated-root renewal counterexample that fails.

The narrow profile is consistent with the previously examined [OCC equity specifications](https://www.theocc.com/clearance-and-settlement/clearing/equity-options-product-specifications) and [ETF specifications](https://www.theocc.com/clearance-and-settlement/clearing/etf-options), which distinguish standard100-share contracts and physical delivery from adjusted products. Public definition identity is checked against OCC symbology supported by the [provider instrument documentation](https://developer.tastytrade.com/reference/instruments/getInstrumentsEquityOptionsSymbol/). This review accepts no arbitrary count→multiplier rule or universal legal-equivalence claim. The code deliberately admits less than the general premium convention and leaves quote scale unknown.

## Privacy, acquisition and native chain

Source inspection confirms public definition/compact-chain methods only; Account-market and Order acquisition are not added by this path. Existing source/global/Account grants and enablement gate acquisition. Subject caps are100series/10underlyings, the request has a shared reference deadline and bounded transport fallbacks, and originals stay in backend retention. Shared provenance uses source hashes/public URNs and OCC reference rather than private Account artifact locators. No live timing/failure-bound certification is claimed from source inspection alone.

Independent native render of actual synthetic owner output rises and then flattens, with no fictitious profit-zero line or default technical JSON. Exact holding contractTerms detail performs discovery, selected holding and its linked shared Instrument only; foreign private Instrument scope or denied reference read fails closed without history fallback. Uniquely case-insensitive nickname resolution stays bound to discovered canonical Account.

The frozen opt-in private verification harness was inspected, not executed: its alternate reference-copy input requires the exact approval marker, distinct source file and0600 permissions; it backs up to a verification DB and uses live User grants rather than creating grants. This is source-level admission-guard evidence, not independent attestation that author operational commands or provider credentials were handled correctly. No protected harness input was read.

Existing TT1 default mapping stays separate from explicit Fidelity URI bindings. Full source conservation and TT1 real DTO/SVG equality are author observations for this target; they were not independently repeated with protected data. Existing synthetic prior conservation results carry only where source remains unchanged; new term enrichment is covered by the controlled owner tests here.

## Reproduction and limits

Run `python3 /tmp/ww-independent-fidelity-geometry-evidence-20261029/run.py`. Directory contains independent AcquisitionProbe/FinancialProbe/AdmissionProbe/ShareCallProbe, native-detail-probe, invented SQLite/JSON, classpaths, check results and SHA256SUMS. Exact changed relevant Java is incrementally compiled against recorded unchanged supports/resources; Mockito needs its newer-JVM compatibility flag. These are my own fixtures, not author tests. No independent full-suite/OAS or comprehensive API/security audit is claimed.

Author220-Java/78-Talk/24-MCP/OAS, real BDRY timing,14 Fidelity/4TT1 geometries,51-row conservation, corrected actual SDK/browser and production preservation evidence are not independently certified here. Original uppercase scope failure remains author evidence, not rewritten as a pass. Terminal contractual value is not P/L, current custody, opening continuity, covered-call governance or collateral availability. Prior immutable reviews remain unchanged.

CURRENT STATE: Frozene961190a independently rejected for exact-series reference reuse violation; bounded terminal-only financial/permission/source/native controls pass.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable finding and independent counterexample for commissioning-actor reconciliation; review a successor under its own frozen identity.
