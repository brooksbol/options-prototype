# Independent tactical design challenge — 2026-10-29

**Design disposition: QUALIFIED — proceed within the proposed reuse boundary after resolving the catalog-refresh consequence below and making the projection contract explicit.** This is design review, not implementation or Product acceptance. No source, private evidence, grants or services were modified.

Inspected current PortfolioController/Repository/ReadService/Authorization, CurrentExposure, Recognition, Math, PackageEvidence, Sources, the construction-model catalog and foundational portfolio OAS. The inspected main checkout is `4ffd79653f6e4efd29034ca6ccf33f1bfdec9486`; the subsequent quantity-scale correction does not affect these modules.

The proposed reuse is appropriate: existing backend evaluation and sanitization own qualified financial meaning; tactical is a representation on the existing Position collection. OBSERVED/UNKNOWN/RETAINED is a better tactical selection than OPEN lifecycle. Vertical role definitions can reuse the existing finite recognizer and signed constituent valuation. Existing recognition already enforces equal package counts through the role ratios, so keep both vertical role ratios at 1. LP < SP for the put vertical and SC < LC for the call vertical are the appropriate narrowed strike ordering. Naming alone must not establish credit receipt, opening date, continuity, reserved collateral or guaranteed maximum-loss applicability.

## Material design consequence: catalog additions alone will not rename existing packages

`PortfolioSources.refresh` admits changed catalog bytes separately, then skips Account interpretation when `sourceRevision` is already admitted. That revision includes source inputs/shared instrument definitions but not the model catalog. Even if interpretation runs for another reason, `PortfolioPackageEvidence.admit` returns early on an unchanged source proof **before** matching the newly available models.

Therefore two new declarative versions can work on fresh fixtures yet leave existing valid retained vertical packages unclassified indefinitely. This is an observable capability gap in the proposed catalog-only extension, not a reason for a new recognition engine.

Smallest correction: explicitly make the applicable interpretation/model version participate in reconsideration and preserve existing write-once Construction semantics by producing a successor only when the interpreted result changes. Do not force a brokerage refresh, mutate old model versions/instances or turn “latest catalog” into an implicit historical reinterpretation. Alternatively, explicitly limit this delivery's naming claim to newly interpreted inputs and retain honest unclassified rows. Required falsifier: admit an evidenced valid vertical under the old catalog, add only the models with unchanged source records, then prove the stated behavior, historical preservation and repeat-read idempotence.

## Contract constraints needed before implementation is called conformant

1. **Compact must retain authority.** Build solely from already sanitized `expand` output; never refill a missing name, source link, timeline or metric from raw repository documents. Carry each copied metric's value, unit/currency, status, method, material clocks/freshness and relevant qualifications/dependencies. Preserve allocation/exposure/association state and immutable model/version links with their standing. Remap warning pointers when changing DTO paths. Missing/unclassified/REDACTED rows stay visible.

2. **Geometry meaning is essential.** Preserve payoff status, `geometry.valueKind`, horizon, units, assumptions and compatible source clocks. `PortfolioAuthorization` deliberately permits terminal contractual value geometry when opening cost is inaccessible; that geometry is not gross-profit geometry. The renderer must label/scale it accordingly, or show an explicit unavailable P/L graphic. No synthetic opening basis, original-days timeline, target/stop, maximum-profit/loss or break-even may be reconstructed. SVG coordinate transforms of returned geometry are presentation; inventing payoff geometry or source conclusions is not. A reported stop threshold remains an instruction-derived threshold, not an executed or secured outcome.

3. **Selection stays explicit and bounded.** Define comma-separated exposure statuses as a finite OR set, applied in SQL before limit/lookahead and expansion. Reject empty/unknown tokens; preserve single-value compatibility, existing explicit CLOSED exclusion and cursor binding to the full selector/grants/projection. Tactical is valid only for the Position collection. Default collection semantics remain unchanged. Verify UNKNOWN and RETAINED rows survive; explicitly handle/document any missing/null exposure status rather than claiming that a literal UNKNOWN filter necessarily includes those records. Do not silently convert retained exposure to current-held certainty.

4. **Keep the existing access and failure boundary.** Tactical must not imply order/reference/market access. Full-grant synthetic examples and permitted real partial reads are distinct evidence classes. Include denied order-derived basis/management, denied market data, stale/current-session observations, conflicting allocation, unclassified composition, and empty/unknown exposures. An inaccessible dependency must remain inaccessible after compaction. Do not add provider calls, grants, source-graph expansion or stronger completeness promises to obtain visual parity.

Update the existing OAS selector/schema and centralized client/adapter contract together, including tactical field semantics and exposure-array serialization. Existing links remain canonical; a projection must not create another routing authority. These are bounded contract details and falsifiers, not a speculative new abstraction or an additional Principal approval ceremony.

CURRENT STATE: Tactical design is conditionally supported; catalog reinterpretation behavior and projection meaning require the bounded clarifications above.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this design challenge to the commissioned implementation owner for reconciliation within existing scope.
