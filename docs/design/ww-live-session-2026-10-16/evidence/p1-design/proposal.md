# ww live — v2 API Change Proposal

Revision P1, 2026-10-16. **UNAPPROVED; DESIGN ONLY; IMPLEMENTATION STOP.**
Baseline: `7ae274cbb0ad0ce77f21440b0c390558913f61e8`, independently checked against advertised remote main. Committed source is exported in `baseline/`. The isolated candidate at `/Users/bollich/kiro/ww-live-first-specimen` is preserved without modification, including its earlier OAS and CLI work. This proposal does not ratify that candidate. The current user assignment supersedes prior engineering permission for this increment: design/non-mutating investigation only, no CLI work, and no implementation until API review resolves through applicable authority. Gate experiment 001 remains STAGED/inactive.

## 1. Proposed change and scope

Add one opt-in domain projection to the established Position collection:

`GET /v2/positions?view=option-structure[&accountId=<canonical Account ID>]`

This is usable by any authorized client; it has no terminal columns, glyphs, colors or layout. Preserve default inventory, observation catalog, exact historical snapshot selection, history and quotes unchanged. No new resource family, public mutation, provider framework, lifecycle engine or schema migration is proposed in P1. No implicit acquisition. The public result contains backend conclusions and scoped provenance, never original source bytes or brokerage authentication.

Deliver structural facts first: current retained nonzero, not-definitely-expired option inventory; verified current managed allocations where supported; qualified terms/underlying; actual expiration exercise-value geometry and standard short-strike ranges. Preserve every unresolved option quantity as residual inventory. Opening attribution is represented only to qualify identity/sorting; premium, current valuation, orders, management and accounting are outside P1.

**Actual-evidence limitation:** repository source proves an internal evidence path exists, not that operational sources contain every required fact. P1 can establish an actual condor only when retained associations/current allocations and complete admissible terms satisfy the predicates below. It must return unknowns otherwise. A synthetic condor is not the actual-evidence milestone. New acquisition/intake is not silently assumed necessary or authorized. If source qualification establishes a specific missing input, that missing evidence capability requires a bounded follow-on contract review; it is not remedied by broadening CLI artifact grants.

## 2. Current capabilities and genuine gaps

All implementation references below are relative to committed baseline unless marked candidate. Java prefix J = `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/`; test prefix T = `evidence-service-java/src/test/java/com/wheelwright/evidence/v2/`.

| Capability / contract | Current implementation and evidence | Exact gap |
|---|---|---|
| Authorized inventory: `/v2/positions`, PositionCollection/PositionRead/Position/Constituent | J/PositionsController.java:21; J/PositionReadService.java:43; J/PositionSnapshot.java:7. Account grants before storage, account-scoped latest/exact selection, retained reads. T/PositionsTest.java:36, :78, :95. | Inventory identity/whole-holding associations do not establish current managed occurrence, split quantities or qualified structure. |
| Observation catalog: same operation, `view=observations` | J/PositionReadService.java:73; T/HistoricalPositionsTest.java. Snapshot evidence-date/receipt semantics retained. | Catalog order is not execution chronology or continuity. |
| Explicit associations | J/PositionSnapshot.java:24; J/FidelityPositions.java:85; J/ImportPositionSnapshot.java:14. Whole holding IDs, explicit authority string, snapshot-bound persistence. | No quantity-level allocations, authenticated public association intake or lifecycle evidence in this record. Mere nonempty authority text is not external evidence verification. Do not claim it proves opening/continuity. |
| Tastytrade holdings acquisition: POST `/v2/position-acquisitions` | J/TastytradeClient.java:89; J/PositionAcquisition.java:33. Original payload retained before parsing; acquisition outcome/snapshot atomic. J/TastytradeHoldings.java:104 maps observed holdings and empty associations. | Optional raw fields are not current domain conclusions. No strategy membership or independently qualified full terms. |
| Original evidence and Fidelity rows: `/v2/artifacts` and imports | J/BrokerageArtifacts.java:205, :248; brokerage_artifact/import/evidence_row. Internal reads already enrich Positions: J/PositionMarketEvidence.java:16. | Accepted Option Summary rows are not universal membership, share-ownership or adjusted-terms authority. |
| Accepted October 15 transactions: `/v2/accounts/{accountId}/transactions` and instance | J/TransactionHistory.java:41, :124, :167, :180, :201; J/TastytradeTransactions.java:63. account_transaction/observation/history_attempt/page/state; source revisions, IDs, action, orderId, executedAt, quantity and lineage. T/TransactionHistoryTest.java:49–:139. | No managed allocation reconciliation. `complete` is not lifetime/event completeness; snapshot consistency UNVERIFIED. Tastytrade multiplier is deliberately null. Public read can acquire when enabled/stale. |
| Existing option/underlying evidence | J/PositionMarketEvidence.java:16, :65; J/MarketEvidenceSubjects.java; direct quote persistence. Separate v2 quote contracts already exist. | Underlying identification must be qualified separately from a display root. No need to add spot/quote/valuation in P1. |
| Raw disclosure authorization | J/ArtifactsController.java:37, :113 vs J/PositionsController.java:34. T/TastytradeAcquisitionTest.java:139–:164 proves Position success alongside raw-content 403. | No grant gap for internal processing. Do not expose raw fields through a supposedly structural DTO. |
| Local candidate (not current API) | Candidate OptionStructure/OptionContractTerms, `view=open-options`, associated synthetic instrument JSON, nine construction tests. Candidate investigation records 37 passed/one optional private-file skip. | Candidate assumes whole-holding membership, synthesizes display IDs from construction, supports only standard100 terms, and embeds an optional instrument file. It does not prove actual-source term coverage, residual allocation or close/reopen identity. Do not promote unchanged. |

Authoritative OAS entry: `docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml:50` references `/v2/positions` in `docs/contracts/api-v2-account-evidence.json:21`; current account component version 0.6.0. The main YAML filename contains “proposal” historically, but it is the current contract entry used by tooling. P1's off-repository draft is explicitly NOT authoritative.

The October 16 independent audit exists in prior conversation and its disposition in the Product plan, not as a fabricated committed report. Audit at 58161d2 had 238 selected Node passes and Java source inspection; subsequent candidate checks are author evidence, not independent Product acceptance. This proposal re-traces committed main rather than copying the ten-gap taxonomy.

## 3. Minimum domain semantics

### Identity and continuity

Contract identity, snapshot holding identity, managed association and Position occurrence are distinct.

* `inventoryPositionIds` links unchanged existing inventory representations.
* `subjectId` is an opaque backend-generated **snapshot-scoped projection identity**, derived from selected snapshot + association/allocation evidence + expiration partition. It permits response identification only, not lifecycle continuity.
* `identity.status=ESTABLISHED` exposes `positionId`, `occurrenceAnchorId` and `constructionBoundaryId` only when evidence proves an occurrence and its present construction boundary. Otherwise identity is UNKNOWN/CONFLICTING while independently verified membership/geometry may remain available.
* Proven occurrence identity is derived deterministically from the Account's immutable identity namespace and immutable established occurrence/construction anchors, with an opaque versioned backend key. Quantity and first-known timestamp are NOT identity inputs. A later backfill can refine the timestamp without renaming the same proven occurrence. An earlier provisional interpretation cannot become established merely because its hash is stable.
* Existing explicit Position IDs are preserved as inventory links. They are not silently promoted into occurrence IDs. No GET mints durable identity records or writes associations. If future evidence requires an identity not recoverable from immutable anchors, durable admission must be designed/reviewed explicitly rather than hidden in GET.
* Partial closure retains established occurrence/construction identity when uniquely attributable and no replacement boundary occurred; current allocated quantities change. Even a non-proportional closure may change geometry without replacing surviving constituents, so quantity ratios must not be an identity key.
* Replacement of strikes, expiration roll and full-close/reopen require a new proven construction/occurrence anchor. Returning to the same strikes later does not revive the earlier ID. A changed set alone cannot establish which event happened: if the boundary is unproved, identity becomes unknown, not guessed.
* Different expiration partitions are distinct structural subjects. A mixed-expiration explicit association may prove co-membership historically but cannot make one expiration payoff. Partition membership/quantities remain qualified; no shared lifecycle asserted. Never attach the same shares/cash to every partition.

This is a bounded evidence interpretation over existing Position snapshots/associations, not a universal Position aggregate or event lifecycle model. ADR-016 remains controlling. ADR-022's Program full-Q rule is not repurposed as an allocation policy; this work concerns structural monitoring, not Program applicability.

### Membership and conserved allocations

Precedence is settled: applicable evidence-backed explicit association, then unambiguous brokerage-derived fallback. A geometry match never establishes association. Explicit assertions are primary but contradictions with source/quantity evidence still qualify affected claims rather than silently overriding facts.

For every selected option holding h, after excluding definitely expired/zero inventory:

`sum(abs(accepted allocated quantities for h)) + abs(residual h) = abs(observed h quantity)`.

Every allocation has the observed sign, integer option-contract quantity, same Account/custody/terms, no reuse beyond observed quantity and provenance. Do not net opposite-sign gross lots out of a net holding to manufacture packages. Shared contracts may contribute distinct quantities to separately established Positions. The old invariant “holdingId appears exactly once” continues in inventory, but is NOT reused for the opt-in allocation representation.

Allocation is solved over each connected set of claims/holdings, not greedily. Unique evidence-backed allocation permits established rows plus residuals. Multiple solutions, excessive/overlapping claims or incompatible sources produce conflicting residual inventory for the affected component; unambiguous unrelated components remain useful. Claimed but rejected allocations do not consume quantities. Explicitly distinguishing two same-underlying/same-expiry condors requires separate association/occurrence evidence, not different row labels.

P1 can consume existing whole-holding explicit associations as current snapshot assertions with their provenance; verified structural grouping means the assertion is applicable and allocated inventory agrees, not independent proof of the operator's intent. It cannot infer authenticated authorship from the free-text authority field. If that authority cannot be traced sufficiently for the requested claim, retain UNKNOWN. No public association write capability is introduced here. Partial explicit claims not expressible by the existing record are not invented; broker evidence may establish them if it satisfies the same allocation proof, otherwise residuals remain unknown.

### Contract qualification, underlying and strategy

Normalize contract identity internally while preserving observed contract text and holding/custody lineage. Parsing OCC/Fidelity strings establishes encoded right/strike/expiration, not deliverables, exercise amount, settlement or membership. Underlying alias/root agreement is insufficient for adjusted contracts.

For supported one-dimensional physical settlement, establish underlying identity, price currency, expiration/date and exact expiration instant when reported, right, quoted strike, price multiplier, deliverable share units, fixed-cash deliverable, total exercise consideration, adjustment status, effective terms and provenance. Reject conflicting effective terms; do not choose latest file blindly. A multiplier of100 does not prove a100-share deliverable.

The schema supports standard and verified single-underlying adjusted terms with fixed cash. Multiple underlyings, unmodeled cash/index settlement, variable deliverables and incompatible currencies are UNSUPPORTED for this evaluator; holdings remain visible. Terms may be incomplete without losing the independently known encoded expiration or underlying.

Recognize IRON_CONDOR first, then supported credit vertical orientations and single options; expose NONSTANDARD when complete verified terms and membership yield another shape. Strategy names describe construction, not the direction/amount of opening cash. Modified ratios/asymmetric widths and adjusted exercise breakpoints use actual payoff, not a template.

## 4. API contract and concrete schema artifact

`proposed-account-evidence.openapi.json` is a complete off-repository draft of the account component. `structural-schemas.json` contains its20 new schemas. Existing schemas are copied unchanged. The change adds `option-structure` to the existing view enum and one response alternative; it does NOT alter authoritative files. Version is `0.7.0-proposal.1`.

Request semantics: same Bearer identity and exact `account.positions.read:ID`. Optional canonical accountId narrows scope; no aliases or new grants. Reject bodies, repeated/unknown queries and `snapshotId` combined with this view with422, preserving the existing incompatible-selector rule. Default/latest, observations and historical snapshot forms remain as implemented. No extra sorting/filter/pagination API or screen-specific endpoint.

Response summary (full types in draft):

```
OptionStructureCollection {
  requestId, view: "option-structure", evaluatedAt,
  evaluationBasis: "RETAINED_INSPECTION", interpretationVersion: "option-structure-v1",
  accounts: [{ accountId, availability, snapshot, evidenceSetId,
    evidenceQualification, structures: [{ subjectId, inventoryPositionIds,
      identity, membership, constituents, underlying, expiration, remainingDte,
      openingFillAt, units, strategy, payoff, range, collateral, qualifications }],
    evidence, excludedExpiredHoldingIds, refreshReasons, qualifications }]
}
```

Every separately qualified field uses a closed discriminated union:

```
ESTABLISHED: { status, value: <typed value>, evidenceIds: [nonempty], reasons: [] }
otherwise:  { status: UNKNOWN | CONFLICTING | UNSUPPORTED,
              value: null, evidenceIds: [...], reasons: [nonempty stable codes] }
```

Membership's narrower status/basis, allocation sign/conservation and cross-reference consistency have explicit schema descriptions plus semantic contract tests. No JSON Schema claim that it can prove financial truth, timestamps or cross-row arithmetic. Implement reason codes as tested stable values with documented meanings; clients can preserve unfamiliar future codes without changing interpretation of the status. All20 new schemas are closed to accidental field disclosure. Decimal values are exact strings. Coordinates are exact rational pairs (see §5), avoiding binary floating financial computation.

Every authorized Account is included in this projection. A bound Account without a snapshot returns `NO_RETAINED_SNAPSHOT`, null snapshot/evidenceSetId, no structures, UNAVAILABLE qualification; it is not an empty confirmed brokerage Account. No authorized Accounts yields accounts[]. This explicit availability behavior applies ONLY to the new view. Explicit authorized nonexistent Account404; forbidden403 before lookup, unauthenticated401 with challenge, invalid query422 with common invalidParams. Missing input/unsupported terms/conflicting evidence are200 domain qualifications; unreadable storage/capacity503, unexpected evaluator defect500, no partial body. Use common ProblemDetails, X-Request-Id and private,no-store. No retries/acquisition on a GET failure. Capacity bound16MiB serialized response; fail503, never truncate.

## 5. Backend-authoritative payoff representation

Financial definition: total gross expiration exercise value of the currently allocated option constituents and any explicitly associated verified shares, **before premiums, stock basis, fees, tax, financing or execution effects**. It is not P/L, valuation, breakeven or a guaranteed exercise/execution result. Cash collateral is a backing fact, not an additional option payout; it is excluded from this curve. Share quantities must be actually associated and never inferred from short-call coverage.

For an admitted same-underlying physical option with signed contracts q, shares a>0, fixed deliverable cash c>=0, total exercise consideration E>0, all in one currency:

* call contribution: q × max(aS + c − E, 0);
* put contribution: q × max(E − aS − c, 0);
* explicitly associated shares: nS.

The backend evaluates these terms, sums them exactly and emits all slope-change knots on S>=0, including x=0, and the right-tail slope. Knots are strictly increasing; common breakpoints combine. The entire allocated quantity is included, not a misleading unit package. No left tail outside the nonnegative price domain. Encode x, y and slope as reduced `{numerator: signed integer string, denominator: positive integer string}`; clients may decode scalar values, choose a viewport and interpolate straight segments, but never reconstruct option payoffs. This supports fractional adjusted breakpoints without rounding them into a standard template. Backend exact arithmetic remains authoritative.

Synthetic financial falsifier: 3 ordinary100-share condors, +500P/-510P/-550C/+560C. Knots (S,value): (0,-3000),(500,-3000),(510,0),(550,0),(560,-3000), right slope0, short-strike interval[510,550]. No premium needed; zero here is gross intrinsic balance, NOT zero economic profit. Adjusted option example q=1 call,a=50,c=10,E=1000: breakpoint99/5, tail slope50. Two short550 calls instead of one add an unbounded descending tail according to exact quantity, not a horizontal condor template.

Known price missing does not affect geometry. Missing/inconsistent terms for a package means no partial package curve. An unresolved residual single option can have an independently established contract payoff, explicitly attached to inventory with membership/identity unknown; that must not be represented as a verified multi-leg Position.

`range` denotes the accepted verified standard short-strike interval/half-line, never expiration breakevens. Nonstandard/adjusted shapes retain knots even when a useful standard range is UNSUPPORTED. Clients do not derive range or financial favorable/loss semantics from the plotted shape.

## 6. Evidence reconciliation and retained-only reads

Select latest accepted Position snapshots using the existing evidence_date/recorded_at/snapshot_id rule. In one query-only SQLite transaction select all authorized Account inputs and pass one evaluation instant. Account authorization is fixed before loading sources. Database-consistent does not imply broker-atomic or same-time Accounts.

For tastytrade, follow selected snapshot.artifactId/hash and its accepted acquisition/import link. Verify Account binding/hash/source-row correspondence. Do not choose most recently retained payload because it may be rejected or pending. Original optional fields can be interpreted internally with field-specific validators; holdings `order-id`, created-at, average-open-price and multiplier alone establish neither grouping nor lifecycle. Existing transaction normalization and revisions are reused, not reparsed by clients. Extract the retained loader from TransactionHistory into an internal reader accepting the caller's connection; **never call public read() from structural GET**, even when today's config disables read-through. Preserve history's existing API behavior unchanged.

Brokerage-derived membership requires either a provider association whose documented evidence actually binds current legs/quantities, or uniquely reconciled opening/closing allocations under a supported, bounded evidence interval. Same order ID is a candidate link, not the verdict. Validate opening/closing action, contract/Account, quantities, duplicates/revisions/reversals, all potentially relevant transfers/corporate actions and alignment to the selected holdings cut. A net quantity match is necessary but not sufficient. Partial-fill records must not be treated as separate Positions merely because execution IDs differ. Two overlapping compatible package assignments make the component ambiguous.

Do NOT infer complete history from successful pagination, earliest observed row, zero starting sum or absence of a close. The existing runtime does not establish economic interval completeness/delayed-posting finality. Where that premise is required and absent, opening continuity and broker-derived membership remain UNKNOWN. An explicit current snapshot association may still establish current grouping independently. It cannot establish a historical first fill without evidence. No Program applicability or blanket completeness assertion is created.

For Fidelity, reuse Position ownership and accepted source/row lineage. Option Summary strategy text and row adjacency are candidate observations, not established managed membership. Verify package boundaries/quantities against actual source semantics and authoritative holdings. Never sum repeated share presentation as ownership (ADR-020). Activity row equivalence is not broker transaction identity; date-only processing/run date cannot be silently treated as effective event time. Unknown adjusted terms remain visible.

Evidence set identity pins selected immutable snapshot, source rows/revisions, applicable assertions and interpreter version. It excludes requestId/evaluation clock; at a later evaluation expiry filtering may change with the same retained set. Each claim has evidence references and true source precision. Newer history than a holdings observation cannot silently update that snapshot's quantities. Unknown temporal alignment yields qualification. No historical knowledge-replay claim.

Definite expiration: qualified exact instant <= evaluatedAt, or prior New York expiry date where exact instant absent. Same-day unknown cutoff remains visible/qualified. Exclusion is not actual-close evidence. Unknown expiry remains visible. Fidelity refresh reason only for concrete expired retained option evidence; never quote-age or arbitrary retention age. Remaining DTE is backend calendar-day calculation with explicit evaluation instant; original DTE is not invented.

## 7. Compatibility and scope containment

* Default Position schemas/fields/IDs/selection remain unchanged; no new enum value in old identityBasis and no change to workingOrderCoverage=UNKNOWN.
* Existing WW validator prohibits repeated holding IDs. Allocation splitting is confined to the new projection; adding it to existing constituents would break the accepted client. Do not do that.
* New oneOf alternative is opt-in. Verify generated clients tolerate the expanded operation response union, distinguish the new schema without guessing, and validate all existing examples unchanged. New fields alone are not presumed compatible.
* Existing `view=observations`, exact snapshot reads and invalid selector combinations remain unchanged. P1 does not add structural historical replay.
* Grants remain Account-specific. Raw artifacts/history details remain protected under their existing separate grants; structural provenance reveals opaque references, no raw account/order IDs or original payload. Derived structural disclosures are authorized by positions.read; no need for artifacts.read or transactions.read to use those conclusions.
* Existing acquisition methods/coverage, history read-through, quote resources and installed consumers are unchanged. No claimant may infer that `ww pull` already collects full terms or management evidence.
* Backend-only domain and representation work. No CLI/TT renderer/web/client changes. No new endpoint named live, no terminal geometry or colors in API. No deployment, migration, credentials/grants or operational evidence actions under this assignment.

## 8. Falsification matrix

Existing tests prove only their actual bounded claims. New tests listed here are proposed, not claimed passing.

| Case | Positive expectation | Negative expectation / existing coverage / needed addition |
|---|---|---|
| Four-leg condor | Explicit applicable current association + complete terms + allocated q gives expected exact knots/range | Four matching unassociated contracts remain4 residuals; current PositionsTest covers no inferred grouping; candidate OptionStructureTest covers synthetic construction. Add full HTTP source-to-conclusion specimen. |
| Two condors same underlying/expiry | Distinct proven associations/anchors yield two identities | Geometry/underlying/expiry cannot merge them; new allocation/identity test needed. |
| Partial allocation | Holding -3 split as verified -2 and -1; both graph quantities exact | No unique allocation => residual -3, not arbitrary assignment. New test; existing whole-holding validator cannot express this. |
| Overlapping claims | Disjoint claims conserve holdings | -2 + -2 against -3 => entire affected component unresolved, no silent residual -1 or double use. PositionsTest overlaps rejected at intake; add projection conflict test. |
| Adjusted deliverables | Proven50shares+$10 with$1000 exercise gives threshold99/5 |100 multiplier alone, unknown basket or contradictory terms => no guessed100-share shape. Candidate currently rejects all adjusted; new evaluator/source tests needed. |
| Modified shape | Unequal verified ratios/widths give actual slope changes | Never label every four-leg package standard; candidate has nonstandard ratio test, add exact non-template adjusted coordinates. |
| Mixed expirations | Partition current association into expiry-scoped subjects | Never one terminal payoff or duplicate collateral; candidate has partition test; add retained provenance/identity tests. |
| Partial closure | Unambiguously attributable reduction preserves occurrence ID/opening time, updates quantities | Quantity-only snapshots cannot prove continuity; candidate proportional hash test insufficient. Add non-proportional closure and ambiguous pooled reduction. |
| Strike adjustment | Proven replacement boundary gives new identity | Replacing then returning to old strikes must not revive old ID; candidate construction hash insufficient. New test. |
| Expiration roll | New expiry + proven opening boundary yields new Position | No original opening time carried across roll; history-only linkage. Candidate expiry split is not roll proof. New test. |
| Missing opening fills | Current explicit membership/terms can yield shape; identity/opening unknown | No snapshot receipt/date as opening. Existing candidate only null; add mixed claim qualification. |
| Incomplete/corrected sources | Last admitted evidence retained; unrelated established components remain useful | No inference from traversal complete; reversal, transfer-out/in, delayed effective dates and contradictory endpoints block affected continuity. TransactionHistoryTest covers revision/failure retention, not lifecycle. Add source-semantic admission tests. |
| Unauthorized Account | Authorized Position projection with opaque lineage succeeds without artifact grant | Other Account403 before storage, all-Account collections filtered; original bytes403. Existing acquisition authorization test is positive precedent; add new view exact grant/denial test. |
| Pure retained read | Same inputs yield same domain values apart from evaluation/correlation; query_only tx | Instrument provider client throwing on any call + history read-through enabled/stale; zero calls and zero writes. Existing tests cover Position purity; add composed view test. |
| WW Positions compatibility | Old responses validate against old OAS and old consumer; historical selectors unchanged | Repeated allocation holding IDs never leak into default inventory. Run existing Positions/HistoricalPositions/OAS/accepted client contract tests read-only. |
| Missing snapshot/expiry/unsupported | Every authorized Account and every in-scope nonzero option quantity accounted for | Missing snapshots are not empty accounts; unknown expiry not omitted; expired exclusion not executed close. Add projection coverage assertions. |

Independent verification needs retained input artifacts or sanitized lineage-preserving equivalents; exact baseline/proposal hashes; source-specific admissibility assumptions; generated HTTP bodies; OAS validation; zero-provider/write counters and immutable failed-refresh comparison. Private operational sources are not copied into public review artifacts. Existing prior test report:37 passed/one optional private CSV skipped; no new implementation tests run for P1.

## 9. Reuse and architectural fitness

| Proposed component change | Recover/reuse/compose/extend justification | Invariant + falsifier |
|---|---|---|
| Position structural projection in PositionReadService | Reuse query-only snapshots, Account grants, existing observation context; compose retained sources. Extend only missing current allocation/qualified structure representation. | Backend authority/client independence; same response conclusions for two independent clients. Negative client-supplied strategy/quantity cannot alter result. |
| Retained history reader extraction | Reuse TransactionHistory.load and accepted revisions/lineage; move retained read into a reusable internal connection-bound function. | GET purity/temporal consistency; stale enabled history cannot call provider or write during structural GET. |
| Bounded association/quantity interpreter | Reuse existing snapshot associations and evidence IDs; add allocation validation/global ambiguity qualification. No general registry or rule engine. | ADR-016 conservation; overlap/multiple valid solutions fail to residuals. |
| Contract qualifier and piecewise payoff evaluator | Recover accepted TT financial meaning, reuse backend symbols/terms/source retention, candidate pure geometry as falsifiable laboratory reference. Extend actual terms and rational coordinates. Never import TT domain/client. | Provenance and financial correctness; adjusted threshold and nonstandard tail vs template counterexamples. |
| Provenance/qualified schema | Reuse common problems, request IDs, Account IDs, snapshot and artifact references, statuses. Add typed claim qualifications. | No source disclosure escalation; positions200/artifacts403 and cross-Account source contamination rejection. |

No new acquisition, identity persistence, framework or event bus is justified merely by a missing display column. Sonar/ArchUnit are existing fitness mechanisms with documented observational/enforcement limits, not self-approved new gates. Semantic source sufficiency and API coherence require independent judgment, not test-count approval.

## 10. Bounded sequence after review resolution

1. Freeze/review P1 against A–J below; record independent disposition. Do not implement or automatically repair review findings in this assignment.
2. Under subsequent implementation authority, extract retained-only reader and introduce opt-in projection skeleton. Verify ordinary inventory and history byte/schema behavior; no acquisition changes.
3. Qualify existing selected source evidence for one actual explicit association/iron condor: current allocations, underlying/terms and provenance. Add negative matching-contract/overlap specimens before classifying it. If actual sources lack required proof, report the specific missing input as UNKNOWN; do not fabricate operational acceptance.
4. Implement pure quantity/terms/payoff evaluation and wire complete schemas. Test synthetic adjusted/nonstandard cases even if actual initial condor is standard. No opening economics prerequisite for shape.
5. Add occurrence attribution only for evidence-supported bounded anchors/continuity; include partial reduction, replacement and reopen falsifiers. Unsupported cases remain explicitly unknown. Do not import ADR-022 Program rules as structural policy.
6. Verify all authorized Accounts, retained-only HTTP execution, API confidentiality, OAS/client compatibility and response budgets. Separate independent backend review from Principal actual-evidence acceptance and any operational delivery authorization.

Affected components: PositionReadService, PositionsController, internal TransactionHistory loading seam, bounded domain interpreter/qualifier, existing retained source parsers as justified, account OAS component/root bundling and backend fixtures/tests. No automatic changes to acquisition adapters are in P1. No migration required to read/reconcile already-retained facts; any need for persistent new operator assertions/coverage premises/contract acquisitions must be a demonstrated, separately reviewed extension, not secretly stored through GET or embedded raw instrument data in an inventory snapshot.

**Earliest actual-evidence milestone:** a backend HTTP response for actual retained authorized Account evidence, containing at least one evidence-established iron condor with reconciled allocated quantities, qualified terms and exact curve/range, plus honest residual unknown holdings. It must carry reconstructible source references and pass no-provider/no-write verification. Synthetic preview, default inventory, an approved API schema or a visually plausible plot do not meet that milestone. This proposal does not assert that available operational evidence already meets it.

## 11. Review request, readiness and open issues

Request an independent architectural/API reviewer of this frozen proposal, separate from its author. Review scope:
A Product/current membership/identity; B backend authority/guardrails; C reuse; D resource and schema consistency; E old consumer compatibility; F provenance/temporal cuts; G grants/Account isolation; H positive/negative falsification; I bounded scope; J GET purity/acquisition separation.

Return ACCEPT or REJECT with counterexamples and limitations against the exact proposal/schema hashes. Do not mutate candidate or OAS, contact brokerage, deploy, change grants or remediate findings. Review disposition is not implementation authority or Product acceptance. No self-approval.

**Readiness:** concrete public contract and falsifiers are ready for design review. Actual-source sufficiency remains unverified and is explicitly a delivery precondition. Review must challenge whether P1's honest unknowns plus existing explicit association intake form an adequate first useful subset; it must not pretend unknowns alone achieve the managed-Position milestone. Potential need for new evidence intake is deferred pending a concrete source gap, not treated as an architectural mandate.

No settled Product decision is reopened. No new Principal Product choice is requested now. The unresolved engineering question is whether retained source evidence supports the bounded predicates; source inspection/proof must answer it, not the Principal guessing a policy. An independent review rejection freezes P1; this assignment does not authorize automatic remediation or implementation.

## 12. Source index and authority

Use `baseline/` paths for committed behavior and the isolated candidate only for explicitly labeled laboratory evidence. Line references are start anchors, not assertions that one line contains the whole claim.

- `docs/design/ww-live-product-plan-2026-10-16.md:61` final Product scope and supersession; `:12` audit disposition.
- `docs/77-api-v2-architectural-guardrails.md:7` authority; `:23` OAS; section22 design review obligation.
- `docs/principles.md:81` architectural principles; ADR-015/016/020/022 at `docs/07c-adrs.md:475`, `:519`, `:774`, `:898`.
- `docs/70-bounded-option-obligation-continuity-checkpoint-2026-09-28.md:28` bounded continuity and rejected incomplete design; not universal lifecycle authority.
- `docs/cli/ww-positions-command-2026-10-15.md:3` accepted inventory; `docs/cli/tt-live-panel.md:3` and `docs/design/tt-live-economic-story/README.md:3` accepted/experimental distinction.
- `docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml:50`; `docs/contracts/api-v2-account-evidence.json` operations and schemas identified by exact JSON pointers in the accompanying draft.
- J/PositionsController.java:21; J/PositionReadService.java:43; J/PositionSnapshot.java:7; J/FidelityPositions.java:85; J/ImportPositionSnapshot.java:14.
- J/PositionAcquisition.java:33; J/TastytradeHoldings.java:104; J/TastytradeTransactions.java:63; J/TransactionHistory.java:41,:124,:167,:180,:201; J/PositionMarketEvidence.java:16,:65; J/BrokerageArtifacts.java:205,:248.
- `evidence-service-java/src/main/resources/db/migrations/019_position_acquisition.sql:1`; `020_transaction_history.sql:1`; existing artifact/snapshot tables referenced in services. No migration performed/proposed here.
- J/ArtifactsController.java:37; `scripts/ww-positions.mjs:40` old consumer validation. CLI inspected only.
- T/PositionsTest.java; T/HistoricalPositionsTest.java; T/TastytradeAcquisitionTest.java; T/TransactionHistoryTest.java; T/BrokerageArtifactsTest.java; candidate OptionStructureTest.java.
- Candidate `docs/design/ww-live-structural-specimen-2026-10-16.md`, internal-evidence correction and prior author verification. Not current API authority.
- `docs/bootstrap/codex-cold-start.md`, `docs/foundations/principal-decision-surface.md`, `docs/mandates/product-first-continuous-engineering-2026-10-13.md`, `docs/technology-quality-fitness-controls-v1.md`, `docs/reviews/pl-api-02-independent-release-review-handoff-2026-10-15.md` for separate/frozen review precedent. Staged gate state unchanged.
