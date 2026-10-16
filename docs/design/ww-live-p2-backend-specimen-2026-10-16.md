# ww live P2 — isolated backend specimen

Engineering candidate based on remote main `5d6c1c017c9bd3271188addac0f611bd32749913`, branch `codex/ww-live-p2-backend`. No installed Product, deployment, real-Account acquisition or Principal acceptance is claimed. P1/P2 packets remain frozen off-repository. Principal disposition `ww-live-p2-principal-disposition-2026-10-16.md` authorizes bounded backend implementation and contains both deferred semantic findings.

## Runnable result

From this checkout:

```sh
./evidence-service-java/gradlew -p evidence-service-java --offline --no-daemon test --tests '*StructuralPositionsTest'
python3 scripts/verify_ww_live_structure.py
```

The second command requires the existing API-validation Python dependencies. This is an engineer test harness, not Principal acceptance instructions. Disposable SQLite databases and fake providers are arranged by the harness. No operational database or provider is contacted. The affirmative test writes the actual MockMvc controller response to `evidence-service-java/build/structural-position-specimen.json`.

The specimen follows explicit holdings acquisition → native option/underlying definition acquisition → authenticated snapshot association → retained structural GET. Its four XLE holdings and native option definitions are copied with exact capture/pointer lineage from the existing historical capture; its underlying classification, operator assertion, authorization and run timestamps are synthetic. It proves implemented backend composition, not that actual Account evidence currently satisfies admission. Curve coordinates are `(0,-50), (59,-50), (59.5,0), (64.5,0), (65,-50)`, with zero right-tail slope, for total allocated quantities before premium, basis and fees. It is not current P/L or opening-attributed expiration P/L.

## Public capability changes

- Opt-in `GET /v2/positions?view=option-structure`; optional canonical Account filter. Existing default inventory, historical selection and catalog remain intact.
- `POST /v2/position-associations` and `GET /v2/position-associations/{associationId}`. Exact-snapshot operator assertions establish current membership; allocation conservation is validated. New deny-default `account.positions.associate:{accountId}` capability; immutable instance reads use existing Position-read authority. No operational grant was changed.
- Existing `POST /v2/position-acquisitions` gains explicit `mode=contract-terms` with exact Account and snapshot selectors. Backend native option AND underlying definitions use existing tastytrade OAuth custody. Existing absent-mode holdings acquisition remains unchanged. No implicit addition to `ww pull`.

Domain results retain source relationships, qualify contract terms, reconcile whole signed quantities, recognize admitted iron condors, credit verticals and single options, and produce exact rational piecewise geometry independently of prices. Nonstandard quantities use actual additive geometry rather than a template. Unsupported/unknown holdings remain represented. Expired options are excluded from this projection, with concrete Fidelity refresh reasons only. New source migration is included for disposable engineering databases; no operational migration has been applied.

## Containment and limitations

Only bounded standard 100-share US physical-equity terms pass the explicit native classification predicates. Index, missing/conflicting classification and adjusted deliverables do not receive physical-share geometry. This is containment of the deferred classification finding, not proof of universal eligibility. Equivalent contract holdings or conflicting allocations withhold units and classification; duplicate holding IDs in an assertion are rejected. No arbitrary GCD is established across equivalent holdings.

Associations identify current snapshot claims. They are not occurrence identities and never silently inherit into a later snapshot. Occurrence/opening attribution, close/reopen continuity, brokerage-derived fallback membership, spot/quotes, collateral, orders, valuation and management remain unavailable in this bounded increment. Opening timestamps are never fabricated from snapshot receipt. Real-Account capability is unverified. No CLI source was modified.

## Verification and review boundary

`StructuralPositionsTest` supplies affirmative condor, unassociated options, two same-series claims, partial allocation, overlap/duplicate rejection, equivalent holdings withholding, classification failures, failed acquisition preservation, Account isolation, artifact confidentiality, immutable withdrawal/retry, and pure Fidelity Activity import → structural read without public history. Whole-database content equality and provider counters verify retained GET purity. Native definition HTTP behavior is exercised against a loopback fake provider by `TastytradeAcquisitionTest`.

`verify_ww_live_structure.py` checks the generated response against authoritative OAS, retained existing schemas and the four original contradictory-state probes. Existing backend suites verify accepted consumers; tests are not Product acceptance. Independent implementation/API conformance review is required before engineering acceptance. Operational installation, migration, acquisition, grants and release remain separately authorized boundaries.

## R1 correction history

Frozen `/tmp/ww-live-p2-implementation-r1/` remains independently REJECTED. Successor corrections use exact arbitrary-precision deliverable equality, enforce required nullable supersession, supply the existing short-strike half-line range for credit verticals, and preserve fractional retained option observations without admitting whole-contract allocation or financial conclusions. The latter adds explicit `observedHoldingQuantity` and `quantityReasons` and permits null `signedQuantity` only with a withholding reason; fractional numeric allocation strings remain forbidden. Existing inventory representations are unchanged. Fidelity Activity inspection is now a count-only availability diagnostic, explicitly not history lineage or opening/occurrence evidence; no normalization traversal or history-capacity failure is required for geometry.

Full R1 backend run: 852 tests, one legacy-database reconstruction failure, two skips. The legacy rewind fixture needed to remove the new dependent tables/migration marker before reconstructing its pre-canonical schema. The production foreign keys remain intact. Successor verification includes that legacy migration/identity-preservation test.
