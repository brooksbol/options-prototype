# ww live — v2 API Change Proposal

**P2, 2026-10-16 — UNAPPROVED DESIGN; NO IMPLEMENTATION.**

Base: remotely verified main `7ae274cbb0ad0ce77f21440b0c390558913f61e8`. Principal explicitly selected A authorizing P2 design remediation and independent review only. P1 stays frozen at SHA256f72c0aeefbe9b346f3ed2335ee9edda655c877ffe042290b7fb20affffbdf374; its OAS0ece216c1a6c2735940b8f203918298d3bffc22d69b940cb8a4e65095e0ad03e and rejection history are preserved. Gate001 remainsSTAGED/inactive. P2 files live outside the repository; neither the isolated candidate nor authoritative source/OAS is edited. No CLI, operational service/DB/grant/credential, deployment, restart, migration or brokerage operation occurs.

## 1. Outcome and materially changed design

P2 delivers a reviewable **current-snapshot managed option construction** capability. It makes an affirmative path possible by specifying two bounded missing evidence capabilities: authenticated current membership assertions and explicit native contract-definition retention. P1 assumed those facts could be found later; current main lacks their complete public admission paths. An opt-in Position projection remains the read resource. Payoff remains backend-calculated and independent of terminal rendering.

**Occurrence identity and opening attribution are explicitly unavailable in P2.** This uses the review's stated alternative of bounding the first affirmative lane to current structure. It does not redefine Product identity or claim Product completion: automatic partial-close continuity, strike replacements, rolls, full-close/reopen and first-opening chronology remain a subsequent separately reviewed increment. No hash of a symbol, timestamp, quantity ratio or observed fill set is presented as occurrence identity. Current association IDs are snapshot-scoped claims, not economic occurrences.

P2 addresses the six findings as follows:

| P1 finding | P2 disposition |
|---|---|
| No affirmative source path | `source-admission.md` provides exact observed native records, source hashes/pointers, field rules, positive curve and paired negatives. New APIs admit the missing operator intent and contract definitions; no client finance or raw-artifact grant assumption. |
| Unspecified occurrence anchors | Remove affirmative branch from P2's schema; identity/opening can only beUNKNOWN. Map Doc70's accepted actual implementation explicitly; do not generalize its Program/full-Q semantics. |
| Fidelity load misses imported ledger | Read brokerage_ledger_observation + source rows directly and normalize in memory. No dependency on account_transaction materialization/public history. |
| Undefined units | GCD of absolute integer option quantities, with primitive signed ratios; normal/ratio/asymmetric reduction examples below. |
| Machine-expressible contradictions | Closed membership alternatives, integer nonzero quantities, positive terms, standard-term constants, availability-discriminated Account alternatives and executable mutation probes. |
| Contradictory operation prose | Rewrite the expanded operation description to scope old inventory guarantees to old forms. |

## 2. Recovered authority and existing implementation

Authority root docs/README.md; final Product supersession docs/design/ww-live-product-plan-2026-10-16.md:54. Applicable principles: backend authority, persist facts/derive trust, failed refresh preserves evidence, epistemic precision. Governing v2 OAS/root and guardrails unchanged; mandatory Product-first/fitness documents recovered. Complete parking-lot/journal continuation sets indexed in P1 and re-reconciled; accepted installed Positions task remains closed, older recovery authority does not authorize P2 implementation. Current user A is design/review authority only.

J=`evidence-service-java/src/main/java/com/wheelwright/evidence/`; T=`evidence-service-java/src/test/java/com/wheelwright/evidence/`.

| Reused component | Actual current implementation | Extension gap |
|---|---|---|
| v2/PositionsController.java:21; PositionReadService.java:50; PositionSnapshot.java:7 | Pure authorized latest/exact retained inventory, Account context, existing observation/catalog resource | Separate structural representation with conserved partial allocations and explicit availability |
| v2/FidelityPositions.java:85; ImportPositionSnapshot.java:18 | Snapshot-bound whole-holding assertions; free-text authority and overlap rejection | Authenticated provenance, partial quantities, immutable assertion/revocation, exact current applicability |
| v2/PositionAcquisition.java:33; TastytradeClient.java:89 | Working backend OAuth/holdings acquisition, raw source retention, last-valid preservation | Native contract definitions are not currently acquired/retained through this capability |
| v2/BrokerageArtifacts.java:205,:248; PositionMarketEvidence.java:16,:65 | Immutable original bytes, accepted imports/row lineage, existing internal qualified facts | Retain request-to-contract/source binding; strategy text alone is not association authority |
| v2/TransactionHistory.java:41,:52,:180; FidelityTransactions.java:11; TastytradeTransactions.java:63 | Accepted retained transaction observations/revisions; Fidelity public read normalizes and writes before loading | Pure retained Fidelity row reader; do not call public history on structural GET |
| continuity/ContinuityEngine.java:13,:55; ContinuityInputs.java:20; ContinuityController.java | Actual pure bounded whole-Q assessment plus premise/input boundary and retained assessments | Its semantic admission/quiet-day discipline can guide future continuity; it does not establish multi-leg or partial structural membership |
| Current OAS docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml:50 → api-v2-account-evidence.json:14 | Position operation and common Account/security/problem grammar | Opt-in view, explicit association resource, explicit contract-terms acquisition mode |
| Accepted WW/TT contracts | docs/cli/ww-positions-command-2026-10-15.md:3; docs/design/tt-live-economic-story/README.md:3 | Financial/display meanings recovered; TT brokerage/domain implementation not imported |

The October16 audit is prior conversation plus Product-plan disposition, not a fabricated committed report. Existing candidate is unaccepted laboratory implementation and stays untouched. P1's positive-looking synthetic construction was not actual-source qualification. P2 specifically distinguishes recorded source facts, synthetic tests and current operational truth.

## 3. Finite affirmative source path

See `source-admission.md` for exact field rules and lineage. Source capture SHA2567f6788c4fb6fb92a27c3bc4f2a61316c9718e8b2f0cf534eb7915f94784dc8e9, `scripts/fixtures/tt-live-economic-observed.json` at7ae274c, supported by accepted capture provenance `docs/design/tt-live-economic-story/verification.md:10`. Four XLE holdings and four native instrument records are extracted unchanged with original JSON pointers. They are sanitized historical broker observations, not native v2 operational acquisitions. Association authoring in the design specimen is SYNTHETIC, explicitly labeled, never described as a historically authored real Wheelwright association.

Positive path:
1. Existing v2 holdings intake creates a retained snapshot from native Account-isolated holdings.
2. Proposed explicit contract-terms mode retains definitions through the existing TastytradeClient and links each response to selected snapshot/holding/request identity.
3. Proposed authenticated association POST records the operator's actual management intent with exact current quantities and server-controlled authority/time. A client selects intent, not a strategy or calculated payoff.
4. Structural GET uses the same immutable inputs to return XLE one-unit IC, exact curve and range; opening/occurrence remainUNKNOWN.

At specimen evaluation2026-10-14T19:21:15.312Z: +59P/-59.5P/-64.5C/+65C, shares100 each => knots(0,-50),(59,-50),(59.5,0),(64.5,0),(65,-50), rightSlope0, range[59.5,64.5], units1, remainingDte2. No premiums, quotes, orders or history completeness are needed for this current assertion-backed construction. At a current evaluation after expiry it must be excluded; a historical design calculation is not an API replay feature.

This is an affirmative *design proof using recorded facts plus proposed authoring*, not proof that a current operational Account already has this assertion or qualified terms. Real operator source admission and actual installed monitoring acceptance remain separately authorized future actions. Current-main evidence alone is insufficient for this full path, which justifies the bounded additions. No missing financial field is invented to manufacture a passing result.

## 4. Public contract changes

Concrete complete draft: `proposed-account-evidence.openapi.json`; new26 schemas: `structural-schemas.json`. Every pre-existing component schema is unchanged. All changes are unapproved off-repository artifacts.

### 4.1 GET /v2/positions?view=option-structure

Same existing `account.positions.read:<ID>`, exact immutable Account IDs, optional accountId narrows collection. One query-only SQLite read transaction and evaluation instant across authorized Accounts; no implicit acquisition/writes/materialization. No aliases, GET body or repeated/unknown parameters. snapshotId+view remains422; structural historical replay is not introduced.

Response OptionStructureCollection exposes Account availability, selected snapshot and true evidence precision, evidence-set/version, structures, exact constituent portions, association ID, separately qualified terms/underlying/strategy/units/payoff/range/collateral, exclusions and reasons. Every authorized Account appears, including NO_RETAINED_SNAPSHOT; no-authorized-Accounts yields empty collection. Missing retained inventory is not confirmed empty brokerage state. Freshness of holdings is not quote age. P2 includes no market-price/economic/management evaluation.

Current membership is established only by an applicable P2 authenticated explicit assertion; existing free-text legacy associations remain in unchanged inventory but cannot be silently promoted to authenticated economic facts. Brokerage fallback is deliberately not affirmed in P2 without a separately specified unambiguous source lane. Mere order ID or matching contracts never groups holdings. Unassociated Options remain individual residuals with membershipUNKNOWN and possibly independently qualified contract geometry.

Definite expiry uses qualified exact expires-at, otherwise prior New York expiry date. Unknown/same-day cutoff remains explicit. Excluding expired evidence is not proof of close execution. Different expirations are separate subjects; new multi-expiry assertions rejected rather than constructing one incompatible payoff. Legacy mixed-expiry facts never cause shared collateral to be duplicated.

All successful responses private,no-store with X-Request-Id.401/403 authorization precedes private source interpretation; explicit authorized missing Account404; invalid selectors/bodies422 with common invalidParams. Domain missing/unsupported/conflicting facts200 with qualifications; storage or serialized16MiB capacity503, never partial truncation; unexpected defect500. No retries/contact on GET failure.

### 4.2 POST /v2/position-associations

This extends the existing domain concept of an explicit snapshot association into authenticated, immutable quantity-aware evidence. A new resource is justified because the current sidecar-only record cannot retain authenticated author, partial allocation, supersession or retry identity. It does not create a universal Position aggregate, lifecycle registry or generic event bus.

Required new capability `account.positions.associate:<ID>`; deny by default. Monitoring remains positions.read only. New write-grant design is not permission to change any operational grants. Authenticate, parse body, authorize exact body Account before snapshot/claim lookup. Invalid JSON400, unsupported media415, valid-but-invalid body422. Common Problem grammar reused. IDs convey no permission.

ASSERT body: accountId, snapshotId, submissionId(UUID dedup key), actionASSERT, nullable supersedesAssociationId, allocations[{holdingId,signedQuantity}], fixed declarationTHESE_ALLOCATIONS_FORM_ONE_CURRENT_MANAGED_OPTION_POSITION. WITHDRAW references a prior assertion with zero allocations and fixed withdrawal declaration. No client author/authority, strategy, payoff, opening time or broker identifier fields accepted.

Admission: selected snapshot must be latest at transaction time; holding IDs belong to Account/snapshot; nonzero whole Options; same expiration/qualified underlying; signs agree; no quantity exceeds observation. Solve all active claims over connected holdings; validate total claimed portions, not pairwise IDs. Partial use by two packages is legal if distinct authored claims and conserved portions exist. Contradictory/overlapping claims fail422 atomically. An exact snapshot precondition prevents applying stale claims. Same underlying/expiry alone cannot deduplicate distinct packages.

Server generates opaque association UUID; stores User ID internally, backend recordedAt, input snapshot/hash, quantities, source holding references and supersession. Public record exposes authorityAUTHENTICATED_OPERATOR_ASSERTION and opaque IDs, not User-directory details or raw financial source. Asserted management intent is authoritative because an authorized User established it; backend validates evidence binding/quantity consistency. It does not claim independent brokerage verification of the operator's intent.

Immutable new assertion201 with Location `/v2/position-associations/{associationId}`. Exact retry of submissionId within same Account+User and identical normalized body returns200 same record; conflicting reuse422. X-Request-Id remains correlation only. Supersession/withdrawal targets active same-Account/snapshot assertion, atomically retires its applicability and admits successor if conservation passes; no source deletion or financial-close assertion. Failed replacement preserves prior valid assertion.

Snapshot assertions apply only to their exact snapshot. A new pull observation does not inherit them automatically. This first increment can therefore require fresh explicit current assertion after changed/current snapshot; it is an admitted limitation, not a new Product policy. Automatic revalidation/continuity is deferred. This avoids false continuity after unnoticed close/reopen.

GET /v2/position-associations/{associationId} is pure immutable record inspection with owning Account positions.read. Unknown404, known unauthorized403; no administrator bypass, query or body. Instance data describes historical authored assertion, not current applicability; applicability is evaluated in Position projection. No collection/list CRUD framework is added.

### 4.3 POST /v2/position-acquisitions?accountId=ID&mode=contract-terms&snapshotId=ID

Existing absent-mode holdings operation and PositionAcquisition schema stay unchanged. New explicit mode reads native contract definitions for exact retained snapshot Options; it does not acquire holdings/orders or follow public history. Same `account.positions.acquire:<ID>`; both Fidelity and tastytrade holding subjects can use backend-held public instrument definitions with qualified canonical contract mapping. Provider authentication remains existing backend OAuth/client; no standalone brokerage client/new credentials/raw-client access.

Source requests use existing TastytradeClient security boundaries (fixed authority, no redirects, credential exclusion, bounded bytes/deadline), extended with native `/instruments/equity-options/{symbol}` lookup. URL-encode native spaces inside backend. Lookup every eligible distinct contract, bind source/request to each held identity, and return every subject including unsupported/budget/unavailable results. A single10s acquisition budget and16MiB aggregate retained response budget reuse existing limits; at most100 distinct definitions per attempt is a provisional engineering cap. Exhaustion produces NOT_ATTEMPTED entries and INCOMPLETE, never truncated COMPLETE. No automatic retry or scheduler added.

Each successful response is retained as original bytes before semantic qualification; rejected response retained where existing secret safety allows. Admission rule standard-us-equity-v1 checks native fields/cross-source identities as `source-admission.md` states. Source failure does not delete/overwrite previously admitted valid evidence. No implicit action added to ww pull or current holdings acquisition; existing pull coverage remains honestly limited until separate client integration authority.

New result ContractEvidenceAcquisition: correlation/Account/attempt/mode/snapshot, startedAt/completedAt, one result per nonzero option holding (statusADMITTED/UNAVAILABLE/UNSUPPORTED/CONFLICTING/NOT_ATTEMPTED, artifact/reason), coverageCOMPLETE only if every subject admitted. Empty Options permits COMPLETE empty. Neither COMPLETE nor admission claims broker atomicity/current option prices/history completeness. Structural GET may compose retained terms across attempts only with compatible normalized identity/version/source qualification; conflicting newer effective terms block rather than blindly choose latest. Acquisition is explicit and partial failure is represented200, storage503; invalid/repeated/incompatible selectors/body422; unauthorized403; missing selected snapshot404; unconfigured existing provider503.

Original artifact disclosure screen remains fail-closed for new native definition envelopes until separately justified; this capability does not expand artifact grants or raw-source access. Opaque provenance references remain available in Position conclusions without original-byte disclosure.

## 5. Domain and financial semantics

For each retained nonzero, non-definitely-expired option holding, accepted signed allocations plus residual must conserve observed signed quantity. Same sign only; no gross long/short lot inference from net inventory. Solve component-wide. Existing inventory invariant each holding once stays confined to old view; new projection may reference same holding with distinct portions. Invalid legacy/source claims never silently consume quantities or disappear.

Strategy quantity: units=GCD(abs(q_i)) for integer allocated option quantities; primitive ratios=q_i/units, computed by backend. Single -3 =>3 units; +3/-3/-3/+3 =>3; +2/-2/-4/+2 =>2; after asymmetric reduction to+2/-1/-2/+2 =>1. These are primitive structural units, not count of managed Positions or original trades. Actual curve always uses total quantities. Unknown terms do not necessarily make integer units unavailable. No ratio changes are identity events in P2 because occurrence is unavailable.

Current subjectId is snapshotId+associationId (or residual holding identity), opaque backend projection key. It carries no lifecycle semantics and need not survive a new snapshot. Distinct assertion IDs preserve two same-underlying/expiry packages; expiration partitions remain separate. P2 StructuralIdentity and StructuralOpening are machine-constrained UNKNOWN/null only. No unchanged hash or preserved first-known source timestamp can promote identity/opening.

Payoff basis and rational coordinates reuse P1's independently checked financial meaning. For admitted physical one-underlying terms q,a,c,E: call q*max(aS+c-E,0), put q*max(E-aS-c,0). Shares contribute actual associated nS only when independently proven; hypothetical coverage and cash backing do not enter the option payout. P2 new assertions are option-only; it makes no associated-share/cash claim. Expose collateralUNKNOWN for that lane; curve scope is verified option constituents (includesAssociatedShares=false), not a false total-net-wealth/covered-call claim. Existing complete actual collateral evidence can be a separately reviewed admission extension; no margin calculations.

Standard native lane admits explicit Standard/100-share Equity Option evidence under documented provider product interpretation; a multiplier alone is insufficient. The generic curve representation supports verified adjusted single-underlying/fixed-cash terms, but P2 has no new adjusted-source admission lane: adjusted/unsupported terms remain visible and suppress a complete package curve. Ratios/asymmetric widths/nonstandard constructions built from qualified standard contracts yield actual curves now. Native settlement-typeAM/PM is not physical/cash evidence.

Backend emits all nonnegative slope-change knots includingS=0, exact values and right-tail slope in reduced rational pairs. No negative-underlying tail. Clients select viewport/glyphs; they do not compute financial shape, package quantity, strategy, range or qualification. Premiums, stock basis, fees, tax/funding and execution excluded; no P/L/breakeven/profit guarantee. Missing quote does not suppress independent geometry. Missing one package term does suppress complete package geometry. Range is ordinary verified short-strike interval/half-line, not breakeven; NONSTANDARD geometry can remain with unsupported conventional range.

## 6. Retained readers and Doc70 reuse map

**Tastytrade:** existing account_transaction/current_observation loading SQL is a useful read seam. Extract connection-bound loading, preserve source IDs/revisions/lineage, and never call public TransactionHistory.read. No acquisition/write in reader even when config enables read-through/stale. No affirmative grouping or occurrence inference from this history in P2.

**Fidelity:** structural GET reads brokerage_ledger_observation joined to original brokerage_artifact and brokerage_evidence_row for source lineage. Apply the existing FidelityTransactions.normalize **pure function in memory**, preserving row-equivalence identity `(row_hash,occurrence)` as observation identity only. Missing source-row match remains qualification/storage-integrity failure as appropriate. Do not call admitOne, allocate persistent transaction UUIDs, write account_transaction, call public readFidelity, or require a prior history invocation. Coalesce exact admitted ledger observations as existing import semantics, not broker-event deduplication. Keep both observation interpretation and raw source ref for future semantic admission; no current lifecycle claim.

Mandatory integration falsifier: fresh disposable DB→import Fidelity ACTIVITY→assert account_transaction count0→structural GET→verify corresponding retained ledger observation in consumed evidence/qualification→assert count0 and unchanged all-table contents, zero provider calls. Repeat before/after public history materialization: equivalent structural domain conclusions/evidence references modulo correlation/evaluation time; no dependency on newly minted transaction IDs. Test both incomplete/unsupported raw action and valid source rows. Existing history endpoint behavior remains untouched.

| Accepted Doc70 mechanism | Concrete implementation | P2 disposition / future boundary |
|---|---|---|
| All potentially option-affecting rows semantically admitted or block | ContinuityEngine.assess exhaustive classifier branch; TransactionClassifier/FidelityActivityRow | Recover as discipline. P2 reads raw/normalized evidence but makes no occurrence affirmative. A future continuity lane must consume every relevant raw action, not only net known trades. |
| Explicit opening anchor and scoped completeness premise | ContinuityInputs openingQuantity/openingDate/historyCompleteThroughQuietDay | Do not fabricate from pagination or snapshot dates. P2 identity/opening remainUNKNOWN. |
| Quiet endpoint P and conservative economic envelopes | ContinuityEngine economicDay/quiet-day checks; Doc70:61–:65 | Future mapping must establish compatible snapshot cut; source update/receipt time is not event time. P2 current snapshot assertion needs no claim that history is complete. |
| Pure deterministic assessment and evidence pinning | ContinuityEngine/EvidenceHash/ContinuityAssessment | Reuse versioned/pinned input design and pure computation seam; no new universal event engine. |
| Whole-Q Program applicability and POLICY_UNDEFINED survivor | ADR022/ContinuityVerdict; governed cohort records | Not reused for multi-leg allocation or residual structural policy. Partial allocation is current authored quantities, not Program membership. |

This closes R2 through explicit deferral and schema exclusion, not by pretending the accepted engine can solve a broader model. Future design must specify admitted immutable occurrence record, correction/backfill stability, partial-fill event set, closed/reopened replacement and partial reduction under complete interval assumptions. P2 deliberately cannot certify them.

## 7. Schema enforcement versus semantic verification

Local contradictions rejected by JSON Schema:
- ESTABLISHED membership must basisEXPLICIT_ASSOCIATION, nonempty evidence IDs and empty reasons; unassociated cannot beESTABLISHED.
- Option signed quantities are nonzero integer strings (no0.5, zero, sign mismatches deferred semantic).
- Established shares/strike/exercise/multiplier strictly positive, fixed cash nonnegative. Standard terms enforce shares100/multiplier100/cash0.
- NO_RETAINED_SNAPSHOT requires null snapshot/evidenceSetId, unavailable qualification and empty structures/evidence/exclusions/refreshReasons.
- Established membership requires nonnull associationId; unknown/conflicting residuals have null associationId and one constituent.
- Opening/occurrence cannot beESTABLISHED in P2.
- ASSERT has nonempty bounded allocations; WITHDRAW empty allocations and nonnull predecessor; no clientsupplied author/strategy/payoff.

Semantic tests still enforce evidence ownership/hash/ref resolution, cross-leg same expiry/underlying, signs/conservation, active supersession, physical product admissibility, exercise consistency, unitGCD, rational normalization/ordering/curve continuity, expiry timing and source failure preservation. JSON Schema cannot prove financial truth, but machine-expressible local constraints must not be left to prose.

## 8. Compatibility, persistence and acquisition boundaries

Default Position/Constituent/PositionRead schemas, IDs, selection, workingOrderCoverageUNKNOWN and accepted inventory behavior unchanged. No holding split in old representation. Existing quote schemas/operations, history behavior and current acquisition mode are unchanged. New response alternatives are opt-in; generate/validate old consumers against baseline and draft and test rejection/discrimination of new shapes. Additive OAS unions are not presumed automatically safe.

Proposed persistence is required only for the two genuinely new facts: immutable authenticated snapshot associations (including internal author/submission/supersession and exact quantities) and retained contract request/admission bindings (Account,snapshot,holding,original artifact,request identity,times,version/status). Reuse original artifact BLOB/import machinery. Existing free-text whole-holding snapshots cannot retain these facts, and GET must not create them. A deny-default association capability requires a bounded authority-store addition. No table DDL/migration is written or executed here; exact storage layout is implementation detail subject to subsequent approval. No generalized event store or Position aggregate is needed.

No grant changes are necessary for reading conclusions. Future authoring uses a separately designed scoped write capability, not broadening artifact reads. New explicit term acquisition reuses existing credentials/integration; no new provider framework, order acquisition, brokerage management or trading. Operator ww pull currently does not invoke the new mode; no CLI changes are included or claimed. No deployment/installation follows design or reviewer ACCEPT automatically.

## 9. Executable falsification plan

`verify-design.py` verifies source-record extraction/hash/pointers, exact ordinary and ratio payoff arithmetic, scalar/union contradictions, new input shapes and full draft OAS/reference compatibility. These are design probes, not an implementation or claimed backend runtime test.

| Case | Positive | Negative / implementation verification still required |
|---|---|---|
| Actual recorded XLE structure | Recorded holdings+native terms+synthetic authorized assertion gives stated curve/range | Missing shares or assertion gives unavailable curve or4 residuals; no current-operational truth claimed |
| Matching unassociated contracts | Individually visible known quantities | Never infercondor fromroot/expiry/strikes |
| Two same-underlying/expiry packages | Separate authenticated allocation records with disjoint portions | No merge fromgeometry; test aggregate allocation across shared holding |
| Partial allocation | -3 split -2/-1 with exact source/claim refs | Excess -2/-2 rejected atomically; residual preserved |
| Adjusted deliverables | Exact rational model independently checked50shares+$10/$1000 =>99/5 threshold | Native first lane rejectsadjusted; cannot substitute100 |
| Modified structure | +2/-2/-4/+2 gives units2 and descending calltail | No flat standardcondor tail forced |
| Mixed expirations | Separate valid assertions/subjects | One mixed-expiry ASSERT422; legacy ambiguity residual |
| Partial close | Current quantities/new assertion graph are correct | P2 does notclaim sameoccurrence; no ratiohashcontinuity |
| Strike adjustment | New current assertedcontractset gives actualnewgeometry | No reuse of oldoccurrence; unavailable until lateroccurrencedesign |
| Expiration roll | New expirationscope/currentassertion | No carried opening date |
| Missing opening | Current shape remains available | opening/identity schema cannotestablish |
| Contradictory source | Conflict qualifiers blockaffectedterm/curve | No source field overwrite or guessedadjustedroot |
| Fidelity freshly imported Activity | Ledger consumed without publichistory | Zero writes/provider calls and account_transaction remains0 |
| Accountisolation | positionsread200 with artifactsread403 | wrongAccount403 beforeloading; guessing IDs noauthority |
| Pure structural GET | Immutableinputdeterministic, clockexplicit | Enabled/stalehistory cannotcontactprovider; all-tablehashunchanged |
| OldWWbehavior | Baseline responses validate and clienttestsunchanged | No repeatedholdings allocationleakintoinventory |
| Failure preservation | Valid prior snapshot/terms/assertion remain | Badnewsource/replacement cannot erase lastvalidfacts |
| Machineconstraints | P2positivefullresponse validates | Allfour independentmutations nowreject plus malformedassertions |

Backend tests after authorization: existing PositionsTest, HistoricalPositionsTest, TastytradeAcquisitionTest, TransactionHistoryTest, BrokerageArtifactsTest plus new snapshot-association/contract-evidence/retained-reader HTTP specimens and evaluator/property checks. Existing isolated candidate tests are reference only. No passing implementation test/Product acceptance inferred from design probes.

## 10. Sequence after review and readiness

1. Freeze P2/review exact hashes against A–J, specifically source classification, new admission-resource necessity, explicit identity deferral, Fidelity purity and local constraints.
2. Stop after review. No automatic implementation/remediation authorized by this assignment.
3. If later implementation is authorized, build immutable association admission and explicit native-term retention in disposable fixtures first; keep old modes unchanged.
4. Compose structural read, pure Fidelity/Tastytrade readers and financial evaluator; verify full source-to-HTTP positive/negative specimens, no provider/write duringGET, and accepted consumer compatibility.
5. Under separate operational evidence/delivery authority, demonstrate an actual current Account condor with real admitted intent/terms, inspectable provenance and honest remaining residuals. Historicalcapture+syntheticassertion, green tests or API approval alone do not meet that operational milestone.
6. Occurrence/opening/automatic continuation require a later bounded design using recovered Doc70 disciplines; economics/orders/management remain outside.

No unsettled Product decision is escalated. New evidence-authoring/acquisition capabilities and a narrower first identity lane are proposed engineering choices for API review, not permission to provision or perform them. Principal's29 decisions remain governing eventualProduct. Review may reject P2 if source-admission or current managed-membership meaning is insufficient; do not replace that judgment with schema passes.

## 11. Source/review index

Full baseline available unchanged `/tmp/ww-live-api-proposal.bDAtaf/baseline`.
- docs/77-api-v2-architectural-guardrails.md:9,:323 (authority/design review); docs/principles.md; Productfinalscope:docs/design/ww-live-product-plan-2026-10-16.md:54,:67.
- docs/70-bounded-option-obligation-continuity-checkpoint-2026-09-28.md:53–:74 accepted replacement design; docs/07c-adrs.md:519,:774,:898.
- J/v2/TransactionHistory.java:52–:82 exactFidelity materialization; :180 readseam. J/v2/FidelityTransactions.java:11 pure normalizer. J/continuity/ContinuityEngine.java:13,:55 and ContinuityInputs.java:20.
- J/v2/PositionSnapshot.java:17–:22 existing recordlimits; FidelityPositions.java:85–:93; ImportPositionSnapshot.java:18–:29; TastytradeHoldings.java:119–:139.
- J/v2/PositionAcquisitionController.java:19; PositionAcquisition.java:33; TastytradeClient.java:89; PositionMarketEvidence.java:16,:65; ArtifactsController.java:37,:113.
- Native observedfixture/provenance and officialsource URLs in source-admission.md; exactextractionpointers in fixtures/*.json. Negative mutations explicitlysynthetic.
- P1 independentreview plus supplied second review and mutationprobe `/tmp/ww-live-adversarial.DV1zMl/probe.py` are preserved rejectionevidence. P2 mustrun the same mutations, not weaken them.
- docs/bootstrap/codex-cold-start.md; Product-first mandate/fitnesscontrols and Principaldecision surface govern distinctauthor/reviewer and authority. Sonar/ArchUnit observationalstatus not promoted to self-approvedgates.
