# Independent implementation/API review — P2 backend R1

**Disposition: REJECT.** The submitted implementation has a reproducible physical-deliverable containment bypass, plus three bounded availability/API/functionality defects. These are implementation corrections; no comprehensive design restart is requested. The Principal's two deferred design findings remain deferred, not declared resolved.

## Reviewed identity and authority

Baseline: `5d6c1c017c9bd3271188addac0f611bd32749913`. Frozen manifest SHA256: `2a199d351f59825783934a0917b3653a6da09d470413f9be45ee765dc6991253`. All 1,346 manifest file hashes independently verified before and after review. Source references below are under `/tmp/ww-live-p2-implementation-r1/source/`.

The controlling implementation authorization is `docs/design/ww-live-p2-principal-disposition-2026-10-16.md:3`: the Principal approved P2 with containment of the two deferred findings. This review applies that disposition and does not reinstate the previous design-review stop or demand universal physical eligibility/occurrence architecture. Operational acquisition, deployment, migration, grants and trading remain unauthorized by this review.

## Reproduced findings

### R1 — High: integer narrowing admits a non-100-share definition as standard 100-share terms

Location: `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/ContractEvidence.java:75`–`:78`.

The eligibility check calls `shares-per-contract.intValue() != 100`. Jackson narrows an integral JSON value larger than 32 bits: `4294967396` becomes `100`. With otherwise valid synthetic non-index US equity classification, the acquisition returns `coverage=COMPLETE` and admits the definitions as standard 100-share terms. The public terms hard-code deliverableShares=100 and the evaluator then uses100 in the curve.

Independent probe `review-tests/com/wheelwright/evidence/v2/ReviewAdversarialTest.java:9` changes only the captured native shares-per-contract value. Expected INCOMPLETE; actual COMPLETE. This violates the Principal's explicit no-fabricated-payoff containment and the OAS's exact100 eligibility requirement (`docs/contracts/api-v2-account-evidence.json:4697`). It is not a reopening of the deferred classification-design question.

Required successor evidence: exact arbitrary-precision equality or bounded exact conversion before admission; negative values, very large integers congruent to100 modulo2^32, nonintegral values, missing values and ordinary100 all exercised through the HTTP acquisition/read path. No unsupported deliverable may become an established physical100 curve.

### R2 — Medium: a retained Fidelity option quantity can make the entire structural collection fail500

Locations: `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/StructuralPositions.java:77`, `:85`; existing admission behavior in `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/FidelityPositions.java:52`–`:66`.

The established Fidelity importer accepts a Positions option row with quantity `0.5`. Structural projection unconditionally calls `toBigIntegerExact()` even for unassociated residual inventory. The exception becomes HTTP500 for the whole collection. Unsupported/inconsistent retained option observations should stay visible and qualified; an integer-only package-allocation model must not crash a multi-Account inventory read.

Independent probe at `ReviewAdversarialTest.java:24` imports that CSV through the real artifact service, verifies ACCEPTED, then calls the structural controller: expected qualified200, actual500.

Required successor evidence: retain the exact observed quantity and an explicit unsupported qualification without asserting an integer allocation, unit count, strategy or payoff. Keep association inputs integer-only and preserve existing ordinary Position behavior. Verify a fractional/otherwise unsupported holding beside valid holdings and across multiple Accounts; valid independent rows must remain useful. A bounded qualified representation adjustment is sufficient; no broad model redesign is required.

### R3 — Medium: supported credit verticals omit the established short-strike range

Locations: `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/StructuralPositions.java:88`–`:105`; `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/StructuralModel.java:31`; OAS `docs/contracts/api-v2-account-evidence.json:5096` and `:5169`.

The implementation recognizes PUT_CREDIT_VERTICAL and CALL_CREDIT_VERTICAL but assigns range only for IRON_CONDOR. A verified two-leg put credit vertical therefore returns strategy ESTABLISHED and range UNKNOWN despite known short strike and terms. The current Range record only supports lower/upper interval fields, while the OAS already supports a SHORT_STRIKE_HALF_LINE with boundary/direction.

Independent probe at `ReviewAdversarialTest.java:19` admits the recorded XLE put pair and confirms PUT_CREDIT_VERTICAL, then fails because range.status is UNKNOWN.

Required successor evidence: put credit range AT_OR_ABOVE its short put strike; call credit range AT_OR_BELOW its short call strike. Use the established half-line meaning, not a new breakeven or strike-to-strike interval. Validate both actual controller responses against OAS and preserve condor behavior.

### R4 — Medium: POST accepts an input rejected by its authoritative required-field schema

Locations: `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/PositionAssociationsController.java:32`–`:36`; `docs/contracts/api-v2-account-evidence.json:5693`.

For ASSERT, `supersedesAssociationId` is required and nullable. The controller checks other fields but does not check this field's presence; Jackson maps omission to null. Removing it from an otherwise valid request creates an assertion with201, although the OAS requires422. Closed-object/type checking alone does not enforce required nullable members.

Independent probe at `ReviewAdversarialTest.java:16`: expected422, actual201.

Required successor evidence: distinguish absent, explicit null and valid UUID; reject wrong type/malformed UUID/unknown fields without persistence. Keep the already implemented exact-retry-before-latest-snapshot behavior.

## Independent checks and evidence

- Supplied `StructuralPositionsTest` and `TastytradeAcquisitionTest` passed in an isolated copy of the exact frozen source, including the fake-provider HTTP path. No broker or operational service was contacted.
- All four independent targeted adversarial tests failed with the outcomes above. JUnit evidence: `independent-evidence/adversarial-results.xml`; external review tests: `review-tests/com/wheelwright/evidence/v2/ReviewAdversarialTest.java`; Gradle source-set hook: `review-tests.gradle`. The tested implementation was unchanged.
- Frozen authoritative OAS/reference validation passed. The independently generated MockMvc response validated against it; preserved at `independent-evidence/independent-structural-position-specimen.json`.
- All old component schemas compared unchanged against `evidence/baseline-api-v2-account-evidence.json`. All four original P1 contradictory-state schema mutations still rejected. This does not substitute for controller request validation, as R4 demonstrates.
- Reproduction: in `review-run/source/evidence-service-java`, run `./gradlew --offline --no-daemon -I /tmp/ww-live-p2-implementation-r1/review-tests.gradle test --tests '*ReviewAdversarialTest.oversizedNativeDeliverableMustNotBecomeStandard100' --tests '*ReviewAdversarialTest.requiredNullableSupersedesMustBePresent' --tests '*ReviewAdversarialTest.supportedCreditVerticalMustExposeShortStrikeRange' --tests '*ReviewAdversarialTest.admittedFractionalFidelityOptionMustNotFailWholeCollection'`.

Harness incident: the first Gradle invocation accidentally used the frozen export directory after its review copy had been made. I stopped only that wrapper/daemon, verified every manifest file unchanged, and preserved the generated build/.gradle artifacts separately in `accidental-gradle-artifacts/`. Subsequent tests ran only in `review-run/`. No submitted source file changed; the frozen file set was restored. This is disclosed as a review-method correction, not hidden as a successful isolated run.

## Containment, API and architecture assessment

**Product/domain:** current snapshot assertion meaning, integer allocated portions, residual rows, unknown occurrence/opening, option-only scope and separately unknown collateral are explicit. R1–R3 violate bounded implemented behavior, not eventual Product deferrals.

**Deferred physical classification:** positive underlying definitions, explicit is-index=false, supported MIC and contradiction checks now implement a bounded lane. Missing/index/conflicting classification tests withhold terms. Do not promote this to proof of universal eligibility. R1 bypasses that lane's own exact share-count requirement.

**Deferred allocation encoding:** duplicate holding IDs are rejected at intake; equivalent normalized contracts within one construction withhold units/classification while retaining exact quantities/payoff. This is useful containment. I do not infer a global conflict merely because equivalent holdings occur in separately asserted Positions or separate residual rows: distinct management claims can legitimately separate quantities. Future counterexamples must show that equivalence changes the particular claimed construction, rather than demanding global merging.

**Backend/resource/auth boundaries:** backend owns financial interpretation; clients receive DTOs. New scoped association grant is deny-default; source reads are Account-bound; raw artifacts remain separately protected. Immutable assertion resources, atomic overlap/supersession validation, retry ordering and query-only structural connections are coherent. No raw-artifact grant expansion or client brokerage code was observed.

**GET purity/Fidelity:** supplied whole-database and provider-counter tests pass. The Fidelity reader does not invoke public history or materialize transactions. However `RetainedStructuralHistory.java:13`–`:19` only counts/normalizes ledger rows and adds qualification strings; it does not recover source-row/artifact lineage into the response or pin those rows in evidenceSetId. `StructuralPositions.java:68` makes the whole structural read depend on this unrelated history scan/capacity despite no history-derived affirmative conclusion. Treat that as a bounded follow-up/minimality concern: either keep it nonblocking diagnostics or remove unnecessary traversal; do not claim complete lineage-bearing history composition. The original source-read design obligation is only partly realized.

**Compatibility/provenance:** ordinary schemas are unchanged; opt-in shape is segregated. Native term and assertion references remain backend-owned. Synthetic fixture provenance is labeled accurately. Historical evaluation time combined with synthetic run-time receipt/assertion times proves composition/arithmetic only; because there is no production as-of structural selector and no historical replay claim, that limitation is nonblocking. A coherent injected-clock fixture would improve temporal testing.

**Testability/scope:** early positive backend HTTP specimen exists and has real recorded numerical option inputs plus explicitly synthetic classification/intent. It does not prove actual current Account eligibility or Principal acceptance. New persistence is exercised only in disposable test stores. No CLI changes or deployment were reviewed/authorized.

A successor may correct these bounded defects under the existing Principal delegation, preserve this failed identity/report and obtain fresh independent review. REJECT is evidence, not a new authorization. Operational installation/migration/acquisition/grants and Product acceptance remain separate.

CURRENT STATE: Frozen P2 backend R1 independently REJECTED; Principal-authorized bounded engineering remains distinct from operational authority; the two design findings remain deferred.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this report to the implementation owner for bounded corrections under the recorded delegation.
