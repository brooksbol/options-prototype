# Resource reconciliation and complete URI map

Candidate, not operative contract. Original base `2f319d514960d4d69afe66302c56db3cc7c640d0`; correction authority main `72c602f8740fcbd9c25d67a13b35d81385b6e76b`. All names, grants and URI syntax introduced here remain reviewable engineering choices unless explicitly attributed.

| Resource | Independent meaning | Identity / lifecycle | Authority or working evidence | Relationships / boundary | Authorization | Foundational disposition | Standing |
|---|---|---|---|---|---|---|---|
| User | Token-root principal, independent of credentials/ownership | Existing immutable User ID; token rotation preserves identity | Doc 77:84–96; current UserController/OAS | Explicit User–Account capability grants; /me and administrator inspection | Own User or users.admin; no financial bypass | REUSED: existing users/me, no management CRUD | Existing accepted meaning |
| Account | Stable custody and evidence scope | Existing backend opaque ID; alias/broker-number changes do not redefine identity; unprefixed UUID intention remains deferred | Maintained Accounts owner:30–47; Doc 77:53–96 | Broker association, authorized Positions, source originals, transactions, reconciliation subview | Explicit capability grants on exact Account; never raw account number in canonical links | REUSED, plus justified allocation view | Established meaning; view is candidate |
| Position | Independently identified economic occurrence with mutable current representation | Unique UUID; CLOSED terminal; reopen creates new UUID; resource rule separate from evidence of transition | Candidate resource contract identity section; dispositions Major 1; ASSIM-0002 remains PENDING | One Account, current immutable Construction, qualified evaluation, sourced Orders, optional Audit | account.positions.read; audit additionally account.positions.audit.read | FOUNDATIONAL: replace observed-inventory identity; no compatibility scaffolding | Principal-selected working rule for candidate; split/recombine not ratified |
| Construction | Immutable bound composition assertion, not quote-time evaluation | UUID; new instance for actual material composition or explicitly marked evidence reinterpretation; predecessor cannot cycle or cross Position/Account | Doc 82:166–182; dispositions historical reproducibility | Position/Account, finite typed leaves/groups, source inventory, qualified relationships, exact Model version if validated | Same Account Position-read grant; source links require their own applicable capability | FOUNDATIONAL | Principal-selected candidate; correction vocabulary provisional engineering |
| Construction Model family/version | Reusable declarative recognition/composition pattern | Family name stable; exact version URI write-once; no mutable latest redirect | Doc 82:170–180; dispositions Moderate historical reproducibility | Typed roles, nested exact Model references, explicit compatibility/order/coverage constraints, signed primitive sum | reference.read; shared, no User financial ownership | FOUNDATIONAL: versions separately resolvable | Working immutable rule; finite typed grammar is provisional engineering, not ratified algorithm |
| Order | Brokerage instruction initiated by trader and observed by Wheelwright | Wheelwright UUID plus broker/environment/account-scoped source ID; broker state mutable; fills retain reported source IDs or null | ADR-016; tt matchingExit and openingCredit; current Java has no Order admission | Account, Instrument legs/actions, reported fills, related broker groups, evidence-qualified Position/Construction target | account.orders.read; related Position/source access separately checked | FOUNDATIONAL read-only; no trade submission/amend/cancel endpoint | Broker evidence demonstrates value; public schema remains candidate |
| Instrument / derivative Contract | Financial subject independent of held occurrence | Provisional GUID plus broker-qualified aliases; OPTION subtype carries terms, adjustments and deliverable. Alias equality is not cross-broker equivalence | Doc 82 Position→Contract; Doc 77 stable identity; tt instrument validation | Underlying Instrument, held leaves, Orders and market observations; no duplicate Contract identity | reference.read for shared reference data; no private broker Account data exposed | FOUNDATIONAL unified Instrument family; separate /contracts deferred | Topology provisional; terms and no fabricated equivalence established requirements |
| Market observation / Quote | Sourced observation distinct from derived value | New immutable observation UUID for quote evidence; current direct Quote family retained for useful acquisition/held reads | ADR-015; tt quoteEconomics/spotEvidence; OAS direct quote excludes options | Instrument; optional Account; component source time, receipt, session validity, original evidence | market.read; Account-linked observation also account.market.read and source capability | FOUNDATIONAL option/underlying observations; existing Quotes reused | New public family is provisional justified evidence identity; no historic availability promise |
| Transaction | Broker financial activity observation and minimal normalized interpretation | Existing Account-scoped transaction UUID, source identity/revision/reversal qualifications; Fidelity row equivalence is not broker-event identity | Current nested transaction OAS; TastytradeTransactions/FidelityTransactions; accepted pull/history | Account, source Artifact/row, optional reported orderId; no unsupported Position join | account.transactions.read; no authority from symbol equality | REUSED Account-nested family; root aggregation not needed | Existing useful capability; not brokerage tax/ledger system |
| Artifact / processing attempt / import | Retained original source versus processing attempt and admission outcome | Immutable artifact ID/content hash; repeated imports retain separate attempt identity/filename; source retention precedes parsing | Doc 77:53–61,90–96; current Artifact OAS and source admission | Account and all represented source Accounts; exact bytes, attempts, rejected/PENDING outcomes | Existing artifact grants; original bytes require every represented source Account and fail closed on unknown scope | REUSED existing upload/reprocessing; no duplicate /imports or /uploads | Useful accepted capability; parser is internal; retained source ≠ complete financial truth |
| Audit | Selective retained Wheelwright assertions for mutable Position | Immutable record UUID; optional availability, not complete brokerage chronology | Candidate audit direction; ADR-015/016/019 retained provenance discipline | Position/Account and before/after state/Construction; source evidence | account.positions.audit.read plus applicable linked-resource capabilities | CANDIDATE optional Position navigation; no universal asOf framework | Provisional engineering surface, no broker-history promise |
| Portfolio | Potential saved selection, separate from custody and governance | No identity selected | Candidate explicitly exploratory; Portfolio Capital owner is a measure, not Portfolio entity proof | Future Account or Position membership requires use case; no regime/capital availability inference | If later User-owned, still enforce all selected Account grants | DEFERRED; authorized collections suffice for current proof | Open, not ratified |
| Execution | Potential independently addressable reported fill | No universal source execution identity demonstrated | tt legs.fills; Tastytrade transaction timestamps/orderId partial; Fidelity unavailable IDs | Reported nested fills retained under Orders; transactions can explain supported activity | Account scope if later introduced | DEFERRED root; no invented event from snapshots | Open; omission does not discard nested source fills |
| Independent evaluation | Possible separately identified replay/comparison result | No independent identity selected | Candidate preference for embedded current Position evaluations; provenance/replay ADRs do not demand a universal new endpoint | Current Position evaluations preserve methods, assumptions, source cut and exact geometry | Position scope; future replay must preserve exact evidence authority | DEFERRED root | Open; embedded representation is provisional |
| Brokerage catalog / synchronization operation | Broker association is necessary; standalone catalog/job identity must earn independent value | No new identity selected | Accepted ww pull/sync compose source-specific supported paths; Doc 77 completion/correlation | Account source, existing Artifact/attempt/acquisition result | Existing acquisition grants remain separate from reads; no broadened credentials | DEFERRED new root/service; reused contracts remain reference dependencies | Open; no new live acquisition permitted |

## Broker Holding and evidence boundaries — correction

BrokerHolding is an immutable observation of custody at one source snapshot, distinct from the mutable economic Position. Its independent collection/instance read preserves quantity, Account, source identity, timestamps, original Artifact provenance and reported MV/P&L/capital requirement where available. Cash has kind CASH and no false equity instrument link. SourceInventory is a projection of this canonical observation, not a duplicated authoritative inventory store. No recognition/name is required to read it. The GET topology is a provisional engineering choice preserving ww pull/positions evidence capabilities.

SourceRef is Account-scoped and declares required capability. Shared Instrument/Model reference data uses ReferenceEvidence only. Redacted evidence has no Account, artifact URI, locator or record key. Position summaries and included resources preserve qualification and independently apply all target grants.

## Exact route inventory

No new write operation. Existing referenced POST definitions are dependencies, not authority to execute brokerage/acquisition operations.

| URI | Standing | Definition |
|---|---|---|
| `/v2/positions` | CANDIDATE | `#/components/schemas/PositionCollection` |
| `/v2/positions/{positionId}` | CANDIDATE | `#/components/schemas/Position` |
| `/v2/constructions` | CANDIDATE | `#/components/schemas/ConstructionCollection` |
| `/v2/constructions/{constructionId}` | CANDIDATE | `#/components/schemas/Construction` |
| `/v2/orders` | CANDIDATE | `#/components/schemas/OrderCollection` |
| `/v2/orders/{orderId}` | CANDIDATE | `#/components/schemas/Order` |
| `/v2/instruments` | CANDIDATE | `#/components/schemas/InstrumentCollection` |
| `/v2/instruments/{instrumentId}` | CANDIDATE | `#/components/schemas/Instrument` |
| `/v2/market-observations` | CANDIDATE | `#/components/schemas/MarketObservationCollection` |
| `/v2/market-observations/{observationId}` | CANDIDATE | `#/components/schemas/MarketObservation` |
| `/v2/constructions/models` | CANDIDATE | `#/components/schemas/ModelFamilyCollection` |
| `/v2/constructions/models/{modelId}` | CANDIDATE | `#/components/schemas/ModelFamily` |
| `/v2/constructions/models/{modelId}/versions/{versionId}` | CANDIDATE | `#/components/schemas/ModelVersion` |
| `/v2/positions/{positionId}/audit` | CANDIDATE | `#/components/schemas/AuditRecordCollection` |
| `/v2/positions/{positionId}/audit/{auditId}` | CANDIDATE | `#/components/schemas/AuditRecord` |
| `/v2/accounts/{accountId}/inventory-reconciliation` | CANDIDATE | `#/components/schemas/InventoryReconciliation` |
| `/v2/users` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1users` |
| `/v2/users/{userId}` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1users~1{userId}` |
| `/v2/me` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1me` |
| `/v2/accounts` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1accounts` |
| `/v2/accounts/{accountId}` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1accounts~1{accountId}` |
| `/v2/artifacts` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1artifacts` |
| `/v2/artifacts/{artifactId}` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1artifacts~1{artifactId}` |
| `/v2/artifacts/{artifactId}/content` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1artifacts~1{artifactId}~1content` |
| `/v2/artifacts/{artifactId}/imports` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1artifacts~1{artifactId}~1imports` |
| `/v2/accounts/{accountId}/transactions` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1accounts~1{accountId}~1transactions` |
| `/v2/accounts/{accountId}/transactions/{transactionId}` | REUSED_EXISTING | `../../contracts/api-v2-account-evidence.json#/paths/~1v2~1accounts~1{accountId}~1transactions~1{transactionId}` |
| `/v2/quotes` | REUSED_EXISTING | `../../contracts/api-v2-direct-quote-acquisition-proposal.yaml#/paths/~1v2~1quotes` |
| `/v2/quotes/{symbol}` | REUSED_EXISTING | `../../contracts/api-v2-direct-quote-acquisition-proposal.yaml#/paths/~1v2~1quotes~1{symbol}` |
| `/v2/holdings` | CANDIDATE | `#/components/schemas/BrokerHoldingCollection` |
| `/v2/holdings/{holdingId}` | CANDIDATE | `#/components/schemas/BrokerHolding` |

All 77 local typed schemas are listed in `contract-inventory.json`. Portfolio, Execution and independent evaluation roots remain deliberately deferred.

## Final delta against c8ddbffc

No new route is added. `/v2/holdings?view=observations` discovers retained snapshots, returns `HoldingSnapshotCollection`, and links exact Account+snapshot selection through the same collection. This reuses the retained-observation behavior of operative `docs/contracts/api-v2-account-evidence.json:29–30`; it does not revive observed-inventory Position identity. `ModelVersionLink` enforces bound immutable addresses. There are now 80 local schemas; the current exact inventory is `contract-inventory.json`.
