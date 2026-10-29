# Independent financial dependency / native group review — 2026-10-29

**Disposition: REJECT** for immutable `405d2cbf4c436ad7526451f41492e7fccab51643`, baseline `8b6857fdfca667bbba6412f196dec2bb2690bfb4`. Two independently executed counterexamples violate the intended qualified scope. No claim is made that the four reported private replay rows exhibit these defects; no private payload was inspected.

Independent source: `/tmp/ww-independent-financial-dependencies-20261029`, clean tree. All executable fixtures are invented local records. No provider/model requests, protected-data reads, installed services, grants, policies or v1 changes occurred. Earlier reports remain unchanged.

## F1 — absent OTOCO trigger becomes QUALIFIED, contradicting its contract

`PortfolioComplexOrderEvidence.admit` accepts an OTOCO group with an independently retained agreeing child but no trigger-order object. It sets triggerOrder=null without incrementing missingMemberCount or reducing qualification. Actual frozen code emits:

- type OTOCO;
- status QUALIFIED;
- triggerOrder null;
- missingMemberCount0.

The new NativeOrderGroupStructure OAS explicitly requires a non-null trigger link for qualified OTOCO. The source also claims reported bracket membership corroboration that cannot be complete without its defining trigger. This is a missing-input/qualification bug, not an instruction to invent a trigger.

Independent `GroupProbe.java` creates a synthetic same-Account ordinary instruction original and an OTOCO envelope containing that child only, then calls the actual admission owner against a local SQLite repository. `group-checks.json` preserves the result above. This tests the decoder's accepted input shape; it does not assert that the real provider returned such a partial group in this session.

Smallest correction: reject unsupported native topology or explicitly represent missing trigger as incomplete with an appropriate missing count. Check OCO/OTOCO family/role consistency rather than treating an empty trigger ID as proof of no required trigger. Missing referenced trigger-resource behavior already works: a trigger ID whose normalized resource is absent yields INCOMPLETE/count1 in my separate probe. Explicit instruction disagreement also correctly preserves reported links with CONFLICT, and a foreign native member is refused without updating the normalized Order.

## F2 — one reconciled leaf conceals another unresolved current allocation

The new coverage-only early return relies on the existing `represented` predicate: **any** reconciliation balance naming the Construction is enough. That does not establish every constituent allocation. Actual reconciliation can warn that a second allocation does not resolve at the current cut while providing a valid balance for the first leaf.

Independent `CoverageProbe.java` creates a two-option Construction whose first holding resolves in the current snapshot and whose second referenced holding exists only at a prior cut. The current Position/Construction relationship remains declared. It invokes actual PortfolioReconciliation.calculate, propagate and qualifyConstruction. Results:

- Account reconciliation is INCOMPLETE and reports that a current allocation does not resolve.
- Construction qualification marks the second leaf's globalStatus UNKNOWN.
- Position propagate nevertheless marks allocation RECONCILED and preserves current geometry and market value.

Thus the two projections disagree about current quantity authority. This is a genuine allocation-resolution gap, not merely insufficient external cash coverage. The flawed any-representation check is inherited rather than newly introduced, but it prevents this submission from establishing its promised “independently reconciled constituents” condition. Preserving mathematical rights of a historical declared package must not silently assert that package's complete quantity is current-held exposure.

Smallest correction: establish resolution/reconciliation for **every** required Construction holding/allocation at the selected Account cut before the coverage-only preservation path. Keep external coverage separate once that predicate holds. Do not substitute global completeness, which could again erase independent facts because of unrelated cash evidence; identify the actual affected Construction/leaves. The unresolved leaf must continue to fail closed even when another leaf is valid.

Positive controls passed: coverage-only insufficiency preserves an otherwise established evaluation and reports a coverage warning; explicit OVERALLOCATED and UNKNOWN balances continue to invalidate dependent market/geometry outputs. These passing controls do not cover the missing-second-leaf case.

## Other scoped conclusions

Source comparison confirms PortfolioOrderEvaluation and PortfolioPackageEvidence opening/closing guards are byte-unchanged from baseline. Native group metadata creates no new opening association in my actual admission probe. Historical links therefore do not independently fill current opening/basis/tenure slots. The qualified design's close/reopen/partial continuity boundary remains; no universal Position identity or complete-history assertion is introduced.

The finite source-revision marker gives retained complex records a new interpretation revision without a provider acquisition. Source inspection supports request-local projection and retained lineage; no independent full replay/idempotence test is claimed here. Neither group ID/type/role nor historical link visibility is a current atomic OCO/OTOCO execution guarantee.

Independent exact-Order adapter probes passed: discovery plus one item read only; foreign Account, changed self link and malformed correlation header refused. The new MCP schema and host admission add one normalized read capability, not trading, history enumeration, provider authentication or grants. Existing backend item authorization remains the authority. No raw artifact route is added. This is scoped evidence, not a full authorization audit or an actual SDK/private-data run.

Independent native renderer probes confirm an entirely unsupported evaluation produces explicit degraded text without empty cells/progress gauge; an empty progress gauge is not drawn when current/target/stop are all unknown. Existing terminal-value versus gross-P/L meaning is retained. No financial amount or current origin was created to match the CLI. Author same-original comparisons, private replay and browser/SDK results were not used as the independent oracle or promoted into financial/Principal acceptance.

## Reproduction and limits

Run `python3 /tmp/ww-financial-dependencies-independent-evidence-20261029/run.py`.

That harness compiles the exact changed ComplexOrderEvidence/ReadService/Sources against recorded unchanged supporting class/dependency paths, then executes independent GroupProbe/CoverageProbe and order_ui_probe. This is an incremental exact-source check, not a new full-suite build. Evidence: `group-checks.json`, `coverage-checks.json`, `order-ui-checks.json`; complete synthetic source and SQLite fixtures are in the same directory. Failed counterexample outcomes are intentionally preserved and must not be summarized as all checks passing.

The source-to-presentation field matrix remains qualified by F1/F2. Existing real-account source completeness, current opening/tenure, financial-parity and operational/Principal acceptance limits remain. No correction was made to the frozen target, and rejection does not itself grant retry or deployment authority.

CURRENT STATE: Frozen 405d2cbf independently rejected for missing-trigger qualification and incomplete constituent-allocation preservation.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return the immutable findings and falsifiers to the commissioned implementation owner for reconciliation.
