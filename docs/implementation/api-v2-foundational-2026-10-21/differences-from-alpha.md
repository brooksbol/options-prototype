# Operative engineering contract differences

Comparison boundary: implementation base remote main `76bdb903458a4226f73ef5ead591e7d1cdaa0916` versus this isolated implementation. Architectural target: Principal-accepted candidate `a32c7c79a059cc58d5262cf3e30c520d2e087825` with its mandatory corrections. Alpha compatibility is not an obligation to retain incorrect semantics.

| Area | Result | Classification |
|---|---|---|
| Position reads | Independent GUID, mutable qualified state, terminal CLOSED, current immutable Construction and retained source identifiers. Custody observations have their own holdings resource and snapshot discovery. | Accepted domain replacement of alpha custody-as-Position semantics |
| Constructions and Models | New collection/instance reads, exact immutable Model-version reads, predecessor navigation, typed recursive composition, unclassified retention and source-predicate recognition. | Accepted foundational capability |
| Orders | GET-only normalized instructions/fills, qualified associations, dimensional prices, known peer navigation and optional `brokerGroupAuthority` corroboration. The latter reuses AssociationAuthority and does not create a group root or Position membership. | Accepted capability plus bounded compatible engineering extension |
| Financial representations | Qualified money/price/quantity, exact common-expiration geometry, original/current/cumulative terms, source clocks, current-cut reconciliation and structured incompleteness. | Accepted domain behavior |
| Accounts and Users | Existing token-root User/Account resources retained. Independent holdings/orders/audit/market Account flags are explicit and denied by default. | Compatible capability extension; no IAM subsystem |
| Imports and originals | Existing Artifact/import owners retained. API_BALANCES, API_ORDERS and supported market/reference processing kinds are metadata only; public uploads retain the existing CSV allowlist. | Compatible evidence extension; no duplicate holdings ledger or synchronization-job root |
| Quotes | Legitimate quote acquisition, held reads and transport preserved. New qualified market-observation resources complement them. | Reuse plus accepted extension |
| Existing ancillary operations | `/v2/market-evidence-subjects`, `/v2/position-acquisitions` and `/v2/portfolio-capital-observations` retained. | Legitimate existing capabilities, not new Product scope |
| HTTP and projections | Existing standard problem identities, status/correlation/cache conventions reused. Authorized URI/summary/expanded collections retain financial qualifications; Orders support exact brokerGroupId filtering. | Engineering contract decisions |
| Audit | Selective immutable Position state/Construction-reference history. | Accepted retained Wheelwright history, not brokerage accounting history |
| Deferred domains | No Portfolio membership, Execution root, trading submission, margin, Strategy/Regime engine, tax-lot allocator or universal securities master. | Deliberately open/out of scope |

The resolved operative package has36 operations:33 across the candidate's31 accepted paths plus the3 retained ancillary operations. Eighteen foundational GET handlers are introduced, replacing one alpha GET operation; the original19-operation baseline therefore becomes36. All80 foundational schemas and547 direct properties are inventoried in contract-properties.json. Successful payload/schema counts are kept separate from behavior, source truth and authorization evidence.

The operative source files are the common OAS entry and its Account, held-quote and foundational modules. Publication fingerprints, release.json, Pages workflow/settings, production configuration and deployed documentation were not updated. No publication/installation/migration completion is claimed. Existing WW CLI migration, beginning with ww live, remains a distinct post-backend acceptance phase; no v1 web UI retrofit is included.
