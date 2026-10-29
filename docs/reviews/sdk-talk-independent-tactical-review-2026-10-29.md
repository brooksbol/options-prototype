# Independent tactical implementation review — 2026-10-29

**Disposition: REJECT** for immutable candidate `e163a9cc80f8d83b652c61cc99c68122c5fb621b`. Two bounded defects are established below. This is independent implementation/financial-semantic review, not Principal acceptance or permission to mutate the submission. No installed services, grants, private evidence or candidate source were changed.

Reviewed against the preceding financial candidate `77810b0b22633d47635b12c98c84ea34f4f1aac0`, the prior independent tactical design report and selector clarification. The original financial reports remain separate and unchanged. Source was checked out independently at `/tmp/ww-independent-tactical-review-20261029`; the source tree remained clean. Compiler/build outputs are local generated artifacts only.

## F1 — supported profitable outer tails are classified as loss

Material financial-semantic defect in `PortfolioMath.java:133–140`, propagated by `PortfolioTactical.project` and native renderer.

The new `spotRegion` applies a credit-structure region grammar to every supported geometry. It calls any flat segment outside the selected range `LOSS_TAIL`, without establishing that the selected plateau is a maximum or that the outside segment is adverse. No validated-model binding is required. Backend generic payoff support explicitly includes unclassified compositions.

Independent actual-evaluation reproduction, using only invented synthetic records:

- Same Account, USD, same standard physical expiration/underlying, quantity 1 each, multiplier/deliverable 100.
- SHORT 90 put, LONG 95 put, LONG 105 call, SHORT 110 call.
- Explicit attributed basis magnitudes 25,75,75,25 respectively.
- Call the actual frozen `PortfolioMath.evaluate` on that complete construction, then supply a qualified USD source spot of 85 and call the actual `spotRegion`.

The generated geometry is `GROSS_PL`; outer flat gross P/L is **+400**, while the central 95–105 plateau is **−100**. The frozen code returns **LOSS_TAIL** at 85. The frontend maps this authoritative backend label to the loss class. This is not a mocked geometry or a failure of model naming: actual supported math establishes the opposite economic ordering.

Smallest correction: qualify the credit-structure region grammar by an explicit maximum-plateau/monotonic-tail invariant; unsupported/inverse/nonconforming shapes keep their geometry but receive `UNAVAILABLE` region interpretation. Prefer `ADVERSE_TAIL` for the qualitative lower contractual region. `LOSS_TAIL` additionally overclaims actual negative P/L for terminal-value geometry or a lower gross-P/L tail that is still positive; retaining that label would require a separate established negative gross result. A source spot and an attractive geometric color do not establish a trade recommendation.

The implementation owner's proposed later maximum-plateau/ADVERSE_TAIL correction is a reasonable bounded direction; it is not part of this reviewed SHA and has not been accepted here.

## F2 — newly selected null exposure forms violate TacticalPosition OAS

`UNRECORDED_NONCLOSED` explicitly selects absent/null `exposure.status`, including `exposure:null` and an exposure object with `status:null`. `PortfolioTactical.fields` copies any present exposure field without normalizing these forms. Independent calls to the actual frozen `PortfolioTactical.project` confirm both null forms survive.

The new OAS `TacticalPosition.exposure` references `CurrentExposureEvidence`: it is an object, not nullable; its `status` is a non-null finite string enum, and seven evidence fields are required. Thus the new documented search predicate can produce a compact representation outside its own contract. Missing exposure itself works because the property is optional. This is a representation mismatch, not evidence that null exposure establishes custody.

Smallest correction: omit unrecorded exposure from the compact representation while preserving the original through canonical details, or explicitly define its nullable/unrecorded compact schema. Do not mint a persisted exposure status or silently manufacture evidence fields. Test absent exposure, null exposure, null status and normal recorded exposure through the actual DTO/OAS path.

## Independently supported behavior

My own compiled Java probe exercised the actual candidate production classes and a separate synthetic SQLite database, without protected records or provider access:

- Qualified bull-put vertical recognition succeeds; absent membership, unequal quantities, foreign Account and different expiration each prevent recognition.
- Repository multi-status selection applies Account scope and OR predicates before LIMIT/lookahead. UNKNOWN, RETAINED, missing and null-status non-CLOSED rows are selected, foreign and explicit CLOSED rows are excluded. Continuation membership is consistent in the tested ordering.
- Native renderer probes preserve terminal-value versus gross-P/L labeling, render backend flat-tail knots, reject PRICE units and foreign currency as exit-progress money, and reject money units as timeline days. Valid original/remaining DAY metrics render correctly.

Source inspection supports the main reuse/permission boundary: tactical compaction starts after `read`/`expand` authorization; reference names are separately grant-checked; restricted recognition/basis/market/management retain upstream restrictions. No new brokerage client or grants are introduced. Canonical Position/Construction links remain the route to detailed provenance. This is scoped evidence, not an exhaustive authorization audit.

Catalog digest now participates in interpretation revision. Candidate model recognition precedes proof reuse; a still-valid exact binding is preserved; changed binding leads to a new immutable Construction with predecessor and binding-aware proof. This addresses the earlier design gap structurally. The supplemental existing transition test passed in this independent checkout; that is a rerun of the author's test, not an independently invented transition oracle. My independent recognizer negatives above supply separate falsification. No real-profile completeness or install claim follows.

## Remaining limits and source-traced concern

The pre-refresh membership concern is not resolved simply by observing that immutable old Constructions preserve leaves. `marketSubjects(members)` follows the old Document's construction, but `PortfolioMarketAcquisition.references` reloads selected Position IDs and follows their **current** Construction. When singletons become superseded empty interpretations and a new package gets a different ID, these two worksets can differ. I have not executed a full controller Order-refresh→reference-acquisition transition and therefore do not declare a separately proven runtime defect. It remains an explicit acquisition-selection falsifier for the next candidate; an eventual complete result must demonstrate requested reference subjects after regrouping, not merely retained old leaves or response reselection.

Compact metrics intentionally omit inline `evidence` and `dependencies`; detailed provenance is recoverable through the canonical Position link. The copied TacticalMetric `asOf` description nevertheless says actual observation times remain “in evidence,” which that compact metric does not carry. Clarify this documentation to direct clients to the details representation, and avoid claiming every component source clock is inline. Source/evaluation clocks remain distinct.

The installed restricted profile and full three-structure real parity were not exercised here. Order/Account-market grants and read-through remain separate operational boundaries. Full-grant fixtures cannot certify real access, live currentness, opening occurrence, collateral, exact production parity or Principal visual acceptance. The renderer's flat-tail support limit remains explicit. Earlier closed-report numerical acceptance is not reopened or expanded by this review.

## Verification and exact reproduction

Independent evidence and source: `/tmp/ww-tactical-independent-evidence-20261029/`.

```sh
cd /tmp/ww-independent-tactical-review-20261029/evidence-service-java
./gradlew classes --offline --console=plain
python3 /tmp/ww-tactical-independent-evidence-20261029/run.py
```

`Probe.java` contains the complete synthetic actual-evaluate counterexample, null-compaction probes, independent recognizer negatives and SQL membership test. `run.py` compiles/runs it against the frozen built classes and runs `render_probe.mjs`. The classpath file records local dependency locators. Results: `java-checks.json`, `renderer-checks.json`. All amounts in those probes are invented synthetic specimens. No private originals or credentials are present.

Compilation passed. After my independent falsifiers, I supplementally ran the author's focused suites to verify the frozen test condition:

```sh
./gradlew test --offline --console=plain --tests com.wheelwright.evidence.v2.PortfolioTacticalTest --tests com.wheelwright.evidence.v2.AccountBalancesTest
```

Observed: AccountBalancesTest 12 tests/0 failures; PortfolioTacticalTest 3 tests/1 failure. The selector fixture fails at line44 with `SQLITE_CONSTRAINT_FOREIGNKEY` before querying its unbound foreign Account. This is a test-setup defect, not proof that runtime selection leaks Accounts; my separate SQL probe passed scope checks. The catalog-only successor and restricted-projection tests pass as supplementary author-test evidence. XML receipts are under the independent worktree's `evidence-service-java/build/test-results/test/`. No full-suite green claim is made. No external model or financial provider was called.

CURRENT STATE: Frozen e163a9cc independently rejected for region semantics and nullable-exposure contract mismatch; bounded corrections require a new immutable submission.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the preserved falsifiers and report to the commissioned implementation owner.
