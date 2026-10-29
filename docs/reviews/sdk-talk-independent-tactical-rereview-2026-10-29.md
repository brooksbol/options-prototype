# Independent focused tactical re-review — 2026-10-29

**Disposition: QUALIFIED.** The earlier wrong-region and null-exposure defects are resolved at immutable `f524c1bc3e0f23020358035b2ca223c9d05564ad`. Post-Order Market membership reselection is independently supported. A newly demonstrated availability gap prevents accepting claimed bull/bear vertical range/region parity. This is not a fabricated financial value; valid vertical geometry remains available while its range is unsupported.

The original e163 REJECT report remains immutable. Its local report and the copy in this new commit both retain SHA-256 `86647696b63692ce0e616226a284daddddadbc1c3abe462a0c1b44451d7f55aa`. This report does not overwrite or retrospectively accept e163. Later attachment/export work is outside this review.

## Original findings — resolved

**F1, wrong loss region:** My independent synthetic construction still produces actual `PortfolioMath.evaluate` GROSS_PL geometry with profitable outer tails and a lower central inverse-condor plateau. The new `spotRegion` returns UNAVAILABLE instead of LOSS_TAIL. Actual-evaluated ordinary condor center/tail cases return NEUTRAL_PLATEAU/ADVERSE_TAIL as appropriate, including terminal-value geometry where opening basis is absent. ADVERSE_TAIL no longer asserts actual negative P/L. Source inspection confirms the new maximum-plateau/monotonic-shape gate and flat-tail restriction preserve unsupported inverse/nonconforming outcomes.

**F2, null exposure OAS mismatch:** Independent calls to the actual `PortfolioTactical.project` now omit exposure when its entire value is null or its status is null. No exposure status or evidence is invented. Recorded textual exposure is still copied; absent exposure remains absent. Canonical details preserve the route to original representations. This resolves the specific null forms that violated the optional non-null CurrentExposureEvidence schema.

Redacted spot and foreign-currency spot remain unavailable. The independent SQL Account-scope/lookahead/continuation and missing/null/CLOSED predicate checks continue to pass. Independent bull-put recognition succeeds only with membership and compatible quantity/Account/expiration; the prior scope boundaries are unchanged.

## New finding F3 — valid vertical maximum ranges are unavailable

This is a previously unexercised generic-evaluator limitation exposed by the added vertical capability, not a new wrong financial amount.

The existing `PortfolioMath.evaluate` range selector chooses a unique interior flat, otherwise a sole flat. A bounded two-leg vertical has **two flat tails and no interior flat**, so neither branch selects its unique maximum half-line. Both added vertical shapes therefore have qualified payoff geometry but `range.status=UNSUPPORTED`, and the region classifier returns UNAVAILABLE at every spot.

Exact independent actual-evaluation fixtures in `Probe.java`:

- Bull put: LONG 90 put / SHORT 95 put, one contract each, same standard physical underlying/expiration/USD, multiplier/deliverable 100, explicit basis magnitudes 25/75. Actual geometry has a maximum half-line starting at95. Spots85,92,100 should yield adverse/transition/maximum-plateau regions if vertical range support is claimed; all currently remain unavailable.
- Bear call: SHORT105call / LONG110call with compatible same-scope terms and explicit basis magnitudes75/25. Actual geometry has a maximum half-line through105. Spots100,107,115 likewise all remain unavailable.
- Removing bull-put basis yields qualified TERMINAL_VALUE geometry, but its maximum range remains unsupported too. This is independent of whether gross P/L basis is established.

`java-checks.json` preserves the failed expected-region booleans and actual `bullRangeStatus`/`bearRangeStatus` values. They must not be described as all checks passing. No client reconstruction should fill the missing authoritative range.

Smallest bounded follow-up: extend the existing backend range owner to recognize a unique maximum flat half-line for exact supported three-segment bounded vertical geometry, preserving other existing range semantics. The meaning is a contractual maximum region, not positive profit, opening credit, governance, collateral or recommendation. Test actual evaluate output for both directions, with and without basis, and preserve unknown/nonconforming results. The implementation owner's later proposed correction is not part of this reviewed SHA.

## Post-Order membership acquisition boundary

The controller now reselects authorized bounded membership and derives sourceScope after Order synchronization/admission and before Market acquisition. It retains the existing filters, Account scope, ordering, cursor and page limit.

My separate `ControllerProbe.java` invokes the actual frozen PortfolioController with mocked service boundaries: initial page returns an old singleton ID; Order admission changes the available page to a new package ID; the Market hook captures selected IDs/scope before response expansion. It receives the **new package ID** within the same authorized Account, and the response returns that ID. This independent orchestration probe passes. It is distinct from the author's native-source regression; it does not itself verify every provider/reference acquisition path or atomic cross-provider snapshot semantics.

The earlier source-traced superseded-ID concern is addressed by this reselection ordering. No broader guarantee of complete acquisition or complete real parity is inferred.

## Evidence, reproduction and limits

Independent detached source: `/tmp/ww-independent-tactical-rereview-20261029`, exact full SHA above, clean source tree.
Evidence/harness: `/tmp/ww-tactical-independent-rereview-evidence-20261029/`.

```sh
cd /tmp/ww-independent-tactical-rereview-20261029/evidence-service-java
./gradlew classes --offline --console=plain
python3 /tmp/ww-tactical-independent-rereview-evidence-20261029/run.py
```

The build passed. `run.py` compiles the exact three changed production classes and the independent probes against the frozen build/dependencies, then runs the probes and unchanged independent renderer unit/currency/terminal-label checks. Receipts: `java-checks.json`, `controller-checks.json`, `renderer-checks.json`. The recorded local classpath is in `cp`. Mockito's JDK26 compatibility switch is confined to this local controller harness; no application behavior is changed.

No author tests were used as this focused re-review's proof. No new full-suite claim is made. The foreign-Account fixture binding correction is consistent with the earlier test-setup failure and does not alter runtime selector semantics.

No protected real records, provider requests, external models, installed services, grants or candidate source were touched. Compiler outputs and independent synthetic SQLite fixtures are local artifacts. The earlier restricted real-profile, full three-structure same-cut parity, per-component provenance/detail-link and Principal acceptance limits remain. Corrected F1/F2 and successful membership reselection do not establish the missing vertical range capability or complete Product acceptance.

CURRENT STATE: f524c1bc independently qualifies the original fixes and acquisition ordering; valid vertical range/region support remains unavailable.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the new bounded availability falsifier for implementation-owner reconciliation.
