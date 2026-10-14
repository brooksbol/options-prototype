# ww show positions — bounded v2 architectural proposal

**October14 cleanup disposition:** retained unaccepted design evidence; Principal architectural review remains pending. The orphaned runnable source draft is now preserved as [inactive recovery material](ww-position-scan-draft-recovery-2026-10-14/README.md). Statements below about the uncommitted draft or its runtime/tests describe the October13 observation, not current installed behavior. No implementation or Product acceptance follows from cleanup.

**Disposition: REVISED PROPOSAL — for Principal architectural review.** October 13, 2026; synchronized to **`6f5d7064be20102c99708923cc6931a48ae61bf9`**. Incorporates ratified [v2 facade/REST guardrails](../77-api-v2-architectural-guardrails.md) §§1, 19–20 and their [reconciliation trace](api-v2-domain-facade-rest-reconciliation-2026-10-13.md). The architectural direction is ratified; this proposal's contracts and D1–D3 remain unaccepted. No implementation, operational change, brokerage acquisition or grant change is authorized by this revision.

Product objective, unchanged: **“I want ww show positions to look like tt live, with one additional column: ACCOUNT.”**

## 1. Existing versus proposed URI patterns

| URI / method | Existing contract | Revised proposal |
|---|---|---|
| GET `/v2/accounts`, `/v2/accounts/{accountId}` | Authorized Account collection / identified instance | Reuse unchanged. Account metadata identifies the same canonical domain owner regardless of brokerage source. |
| GET `/v2/positions` | Authorized retained-inventory collection; optional Account and exact retained-snapshot selection | Preserve old requests, shapes and pure-held semantics. Add an opt-in `view=monitoring` representation of canonical Position facts, with bounded backend read-through. |
| GET `/v2/positions?view=monitoring` | Not implemented | Compose reusable Position association, construction, payoff, lifecycle, objectives, valuation and quote assessments. Add bounded search/filter/projection selectors described below; no provider/workflow selectors. |
| GET `/v2/positions?view=observations` | Retained inventory-observation catalog | Reuse unchanged; not a command to refresh a broker. |
| GET `/v2/positions/{positionId}` | No current instance route | Do not invent a globally stable economic-occurrence identity or add an unnecessary route for this collection scan. Existing member identity is Account/snapshot-scoped; exact member selection uses the collection filters below. A future independently needed instance route must respect that identity contract. |
| GET `/v2/quotes`, `/v2/quotes/{symbol}` | Held canonical underlying quote collection / identified subject observation | Reuse unchanged, including pure-held contract, codec and grants. Backend may reuse the underlying domain services internally without changing these routes. |
| POST `/v2/position-acquisitions?accountId=ID` and existing quote-acquisition routes | Existing explicit acquisition operations with their own contracts | Preserve unchanged. They are not part of the ordinary `ww show positions` Product path. No monitoring acquisition selector, replacement endpoint or deprecation is proposed. |
| Existing `/v2/artifacts` collection and instance/processing/content routes | Explicit retained source resources and operations | Preserve unchanged; source handling remains behind ordinary Position reads. No client upload/refresh orchestration is required merely to inspect Positions. |

No new public domain resource is needed for this Product objective. POST collection-create semantics therefore do not require a new POST: no Position is created by asking to read it. Existing operation-style POST contracts are implementation reality and remain compatible; this revision does not use them as precedents for new workflow URIs. Future domain creation would use a justified domain collection and 201/Location when creation actually completes; this read path introduces no creation or asynchronous-job resource.

## 2. Canonical domain concepts and relationships

Wheelwright's organizing architecture is its **brokerage-agnostic domain model**, not a terminal table or an upstream request sequence. Brokers and imported CSVs supply heterogeneous evidence. Backend adapters normalize identities, vocabulary, units and clocks; domain interpretation reconciles those observations into qualified Wheelwright facts without erasing material differences. Many tools consume the same model through REST. Ratifying this direction does not ratify the entire Doc58 draft or require a universal ontology/framework.

| Domain concept / relationship | Reusable meaning, independent of a client |
|---|---|
| Account → observed Holdings / Positions | Canonical Account identity and granted ownership scope; native brokerage identifiers remain adapter metadata. |
| Position ↔ constituents and supporting coverage | An evidenced association over explicit quantities; distinct from geometric similarity, Program membership and opening occurrence. |
| Instrument / Contract semantics → Construction | Actual rights, deliverables, quotation/exercise factors, strikes and horizons establish what the complete economic position is. |
| Construction + horizon + attributed basis → Payoff | Financial geometry and meaningful bounds; directional shape is explicitly different from absolute P/L when basis is absent. |
| Position + observed prices + attributed basis → Valuation | Typed scope, method, monetary result and admissibility; source broker openPl is retained evidence, not automatically the same metric. |
| Position + brokerage lifecycle evidence → opening/lifespan/continuity assessment | Evidence-bound temporal assertions, not events inferred from a price, DTE, repeated hash or order intent. |
| Position ↔ broker instruction / governed objective | Source-qualified instruction and objective scopes; neither creates an execution fact or a Wheelwright policy. |
| Price observations + session/source policy → Quote assessment | Selected primitive, comparison basis, coverage, clocks and admissibility, independent of whether a client draws a marker. |

These domain capabilities live under the existing backend evidence/domain responsibilities and compose the existing four concerns; they are not owned by the `monitoring` projection or implemented as nine column calculators. No new runtime engine, datastore, generic relationship registry or client-specific financial model is proposed. A projection selects and presents canonical facts; it cannot alter their meaning or authority. IDs retain their demonstrated scope: current Position references identify observed inventory or admitted associations, not an automatically durable lifecycle occurrence.

`ww show positions` issues only v2 GETs. The server may incidentally retrieve and persist evidence while satisfying the domain read; the CLI does not know or orchestrate that process, call brokers/v1, or calculate financial facts. Preserve accepted nine-column UX, independent unknowns, constituent fallback and rich evidence inspection. The shared tt renderer contributes terminal drawing only.

## 3. Existing versus missing backend capabilities — decision summary

**Already present:** Account discovery/authorization, retained inventory/catalogs/explicit associations, immutable source retention, SQLite durability, backend session/pacing, ordinary quote reuse/admission and failed-refresh preservation. A self-scheduling worker maintains market evidence independently of clients. These are useful building blocks, not an already implemented Position read-through facade.

**Requires extension:** backend brokerage adapters/admission for orders, fills/transactions, terms and option quotes; bounded policy-driven read-through/coalescing; source-to-domain normalization; qualified current association, coverage, opening attribution, complete-position valuation, objectives and quote assessment; opt-in v2 publication. Existing realized-production and ADR022 continuity functions are reusable only where their actual premises match, not wholesale wrappers for this domain.

**Not guaranteed obtainable:** a broker-defined managed economic Position relationship, exclusive share/cash allocation, durable occurrence identity, atomic multi-source snapshot, complete/correction-aware lifecycle history, or an absent source clock. Available API data must not be promoted into these guarantees. The detailed source/capability inventory below distinguishes documented provider reads from backend integration and genuinely unsupported assertions.

## 4. Read-through acquisition and cache behavior — decision summary

The backend first authorizes and resolves canonical Account/Position scope, then consults retained evidence and independently owned domain/source reuse policies. It may serve adequate retained facts, join/coalesce already permitted acquisition, or make bounded authorized provider reads and admit observations internally. It then evaluates domain facts and returns their provenance, status and unknowns. Clients never prepare an acquisition bundle or receive a requirement to POST before GET.

Internal evidence caching is not HTTP response caching. Persist observations with original clocks; derive admissibility/age at evaluation. Use existing provider/session/pacing authority rather than a second acquirer. Add only missing per-source coordination and admission behavior. No refresh-on-every-GET rule, blanket application of quote TTLs to orders/holdings, new provider permissions or live calls is implied by this design.

Initial monitoring HTTP responses remain **`Cache-Control: private, no-store`**. Backend evidence can still be retained/reused. Standard conditional/private HTTP caching may be added only with a representation-correct validator that includes caller scope, projection, evidence and time-dependent assessments; raw artifact equality alone cannot justify 304 for changing quote age/status. Existing v1/v2 caching contracts remain untouched.

## 5. Genuine unresolved Product decisions

**D1 remains open:** evidence sufficient for a managed association and the initial whole-quantity/partial-allocation boundary. **D2 remains open:** covered-call P/L versus option-only objective/lifespan scope and the necessary compact scope cue. **D3 remains open:** RANGE as maximum-profit plateau versus the proposed CC fixture's share-retention-like bound. Recommendations and falsifiers are retained in §15; none is accepted by this facade clarification. D4 exact CC/CSP scaled placement/label/palette remains a later concrete terminal specimen, not a new review process.

Latency budgets, source-specific reuse parameters, code seams and adapter mechanics are bounded engineering choices to establish with measurements and contract review, not additional Product decisions or a reason to create a framework.

## 6. Recovery and authority index

Repository/SYNC: **`6f5d7064be20102c99708923cc6931a48ae61bf9`**, remotely verified main and fast-forwarded with all pre-existing uncommitted changes preserved. This revises the first proposal based on b4fdf755d07d1f6373382223651fe54ff0260534. Earlier presentation draft changes remain uncommitted and are not part of this design's acceptance claim. No implementation changes were made during this assignment.

| Authority / precedent | Recovered consequence |
|---|---|
| [Documentation authority](../README.md), [agent routing](../AGENTS.md), [Codex role](../bootstrap/codex-cold-start.md) | A–F precedence; Principal owns consequential decisions; current assignment is design only. |
| [Evidence Appliance](../foundations/evidence-appliance.md), [current architecture](../07-architecture-current.md), [principles](../principles.md), [v2 guardrails](../77-api-v2-architectural-guardrails.md) | Backend owns maintained state and business logic; clients present; preserve accepted transitional v1/tt behavior; v2 has independent authentication/Account authority and common OAS/errors. |
| [Facade/REST reconciliation](api-v2-domain-facade-rest-reconciliation-2026-10-13.md) | Ratified layered domain facade and read-through default; ordinary clients do not orchestrate acquisition. Specific contracts/implementation and D1–D3 remain under review. |
| [Product-first mandate](../mandates/product-first-continuous-engineering-2026-10-13.md) | RECOVER → REUSE → COMPOSE → EXTEND → INVENT; every addition below has a gap and falsifier. A prose declaration is not enforcement. |
| [ADRs](../07c-adrs.md) 004, 007, 013–017, 019–022 | Handoff is not execution; sealed evidence; independent fact/interpretation/economic layers; provenance, association and verdict authority; temporal replay; ownership from Positions; explicit unresolved predicates; bounded whole-quantity opening continuity. |
| [Doc 70](../70-bounded-option-obligation-continuity-checkpoint-2026-09-28.md), [Doc 69](../69-assignment-centric-wheel-v1-operating-program.md) | Reuse the bounded continuity model only where its premises hold. Neither establishes generic multi-leg occurrence, cash allocation, current brokerage management or Program membership. |
| [Doc 58](../58-wheelwright-semantic-model-v1.md), [Doc 80](../80-v2-question-driven-lifecycle-product-architecture-milestone-2026-10-06.md) | Supporting draft/checkpoint distinctions: construction, association, observation, governance and lifecycle are separate. Not new execution authority or a ratified universal ontology. |
| [v2 common OAS](../contracts/api-v2-direct-quote-acquisition-proposal.yaml), [Account/Position OAS](../contracts/api-v2-account-evidence.json) | Reuse actual existing resources; proposed wire changes below are prose only and do not amend these contracts. |
| [tt live Product specification](../cli/tt-live-panel.md), [managed visual specimen](pl-conv-01-managed-position-visual-acceptance-specimen.md) | Compact one-row scan, semantic colors, no default explanatory footer; nine columns with ACCOUNT; verbose/machine evidence preserved; Product acceptance requires actual terminal output. |
| [Position Payoff Visual Contract](position-payoff-visual-contract/README.md), [exact fixture scope](position-payoff-visual-contract/golden/README.md), [original image](position-payoff-visual-contract/tastytrade-strategy-reference.png) | x = underlying price, y = payoff at a declared horizon. CC/CSP rising-then-flat shapes accepted; exact 31-cell fixtures, strike/spot placement and palette remain proposed. Color cannot be the only structure identifier. |
| [Domain competence](../foundations/options-domain-competence-contract.md), [domain reference](../foundations/options-domain-reference.md) | Complete-position reasoning; actual deliverables/factors; short put does not establish cash security; nominal collateral, broker reserve and deployability differ. |
| [Backend invariants](../foundations/backend-behavioral-invariants.md), [fitness controls](../technology-quality-fitness-controls-v1.md) | Persist facts, derive trust; preserve successful evidence; compatible publication; structural checks plus independent semantic review. Sonar/ArchUnit approval does not make every check a hard gate. |

Implementation inspected: `v2/AccountsController`, `AccountDirectory`, `PositionsController`, `PositionReadService`, `PositionSnapshot`, `PositionMarketEvidence`, `FidelityPositions`, `ImportPositionSnapshot`, `BrokerageArtifacts`, `PositionAcquisition`, `TastytradeClient`, held/direct-quote classes; existing `ContinuityController`/`ContinuityEngine`, `GovernedContextController`, and `production/ProductionController`/`DispositionAssociator`. Source paths are under `evidence-service-java/src/main/java/com/wheelwright/evidence/`.

Parking-lot and journal continuation sets were indexed completely during bootstrap. Current owning intake remains PL-CONV-01 / PL-CLI-01, with PL-API-02/03 for contract/capability consequences. The abandoned Increment A/R3 source is not reused. Its retained independent rejection evidence supplies permanent malformed-reference and incoming-terminal-order falsifiers, not a new implementation authority.

## 7. Existing capabilities reusable without modification

| Existing capability | Reuse and limit |
|---|---|
| GET `/v2/accounts`, GET `/v2/accounts/{accountId}` | Backend canonical Account identity, aliases and broker association; exact Account grants. ACCOUNT uses the nickname. No raw broker number, client-local alias authority or GUID typing. |
| GET `/v2/positions` with optional canonical `accountId` | Complete authorized latest retained inventory; explicit associations and exactly-once constituents; backend openPl, marketValue, DTE and qualifications. Preserve default body/meaning exactly. These are inventory facts, not package lifecycle/valuation. |
| GET `/v2/positions?view=observations` and existing `accountId` + `snapshotId` selection | Retained observation discovery and exact evidence inspection. Preserve selection/order/unknown semantics; inspection time is not historical knowledge replay. |
| GET/POST `/v2/artifacts` and exact original/processing capabilities | Immutable source retention before interpretation, hashes, original import names, source scope, accepted/rejected processing and Account-qualified disclosure. Do not expose originals through the monitoring view. |
| POST `/v2/position-acquisitions?accountId=ID` | Existing explicit backend-owned tastytrade **holdings-only** acquisition, OAuth isolation, deadlines, outcome recording and failed-refresh preservation. Preserve this exact existing contract; no new acquisition selector is proposed. |
| Existing direct-quote acquisition and GET `/v2/quotes`, `/v2/quotes/{symbol}` | Held **underlying** facts, canonical subject identity and provenance. Reuse retained quotes; no second market-data store. Options are explicitly excluded from the current subject contract. |
| Existing evidence/session/persistence infrastructure | Java/SQLite facts, backend clocks/session semantics, durable snapshots and source lineage. Reuse services internally with their actual premises; bounded monitoring read-through is a proposed extension, not an implemented feature. |
| Existing explicit `PositionSnapshot.Association` | Whole-holding, exclusive, snapshot-bound association, already rendered by PositionReadService. Reuse when present. The engineering admission utility is not a supported v2 operator grouping workflow. No partial quantity allocation or cross-snapshot inheritance is implied. |

## 8. Gaps, classified by what is missing

**E** = existing backend functionality without the required v2 exposure/integration; **D** = missing backend domain capability; **B** = missing brokerage/source evidence or acquisition/admission capability; **P** = presentation only. A row can have several classes; exposing old code alone does not discharge evidence or semantic gaps.

| Capability | Class | Existing evidence and actual gap |
|---|---|---|
| Account-bound current managed association | E, D, B | Explicit snapshot association exists, but normal v2 import/acquisition does not establish new broker-package association. Need a qualified source relationship, exact constituents/quantities, exclusivity and temporal applicability. Four matching strikes or an OCO order alone is insufficient. No generic lifecycle entity is needed. |
| Stock ownership and coverage | E, D, B | Positions supplies ownership and ADR-020 precedence; v1 browser ownership/capacity calculations are transitional, **not existing backend functionality**. Need backend-owned coverage/encumbrance association and quantity conservation. Co-located stock/call or Option Summary strategy labels do not establish exclusive coverage. |
| Cash-secured classification | D, B | BALANCES/OPTION_SUMMARY artifacts/rows can be retained, and broker requirements can be exposed. No current v2 capability establishes specific cash backing across competing obligations. Cash balance, margin requirement and strike notional are not interchangeable. |
| Contract terms and expiration payoff | D, B | Contract text/expiration and some broker multipliers exist, but no v2 verified deliverable/quotation/exercise-factor result or complete-position payoff calculation. Terms lookup/retention and contradiction handling are missing. Dropdown icons are UX evidence only. |
| Opening attribution and lifespan | E, D, B | Production parsers/associations and ADR-022 ContinuityEngine exist behind `/api/...`, without v2 Account-authorized integration for this capability. They do not implement general IC/CC/CSP opening attribution. v2 ledger admits exact rows with coverage UNKNOWN; tastytrade acquisition obtains no fills/history. Need supported attribution or explicit unavailability. |
| Working brokerage instructions and exit objective | D, B | Existing v2 `workingOrderCoverage` is constant UNKNOWN. No order/fill acquisition, coverage admission or qualified replacement/cancel graph. Broker orders are instructions, not execution or Wheelwright governance. |
| Position valuation and exit progress | E, D, B | Production computes realized monthly cash economics, not current whole-position close valuation. Existing openPl is broker-reported and a different basis. Need backend option marks/midpoints, valuation admissibility, opening cash-flow/basis binding, objective applicability and progress. Prototype JavaScript arithmetic is not backend functionality. |
| Underlying spot and movement | E, D, B | Existing underlying quote facts are reusable. Need backend Position-to-underlying association, selected midpoint and a same-primitive, temporally coherent comparison result. Current `previousClose` fact alone does not provide a dated comparison witness; do not substitute last-trade reported change for midpoint movement. |
| Option quote coverage and row QUOTE | D, B | No option-contract v2 direct-quote subject capability or Position quote assessment. Need backend-owned exact-contract observations, source clocks, row-level oldest relevant quote age and independent validity/retained/stale status. Holdings receipt age is not quote age. |
| Terminal geometry, alignment, glyphs, widths and opt-outs | P | Reuse accepted renderer mechanics; add ACCOUNT; preserve nine columns, narrow fallback, ANSI/no-color/ASCII and verbose/machine paths. Do not move business decisions into a renderer under the name of formatting. |

Existing v1 backend continuity/governance/production routes are **not** proposed new CLI dependencies. MarketMetricsController is also a v1 route despite its Java `v2` package; its GET may acquire provider data. Package names do not establish v2 authority or safe reuse. None of those routes should be mechanically wrapped or exposed wholesale to fill this scan.

## 9. HTTP resource contract and bounded backend read-through

### 9.1 Collection, member identity, filters and projections

Propose GET **`/v2/positions?view=monitoring`**. This adds a named representation of the canonical collection, not a new resource/entity. Existing absent-view and `view=observations` behavior, permitted parameters and shapes remain unchanged. The new selectors below are accepted only for the new view; unknown/repeated/blank selectors and GET bodies remain invalid. No arbitrary as-of, client policy, calculated inputs, provider, refresh/force or rendering-width parameter is added.

| Selector | Proposed exact semantics |
|---|---|
| `accountId=ID` | Canonical Account filter, narrowing caller scope; never a native broker number or nickname in REST. |
| `snapshotId=ID` | Exact retained inventory version; requires `accountId`. No latest-broker refresh is performed for a historical selection. Only temporally bound supplementary evidence may support that assessment; absence is explicit. Existing unqualified snapshot reads remain unchanged. |
| `positionId=ID` | Exact observed-member selection; requires `accountId`, optionally an exact snapshot. Otherwise select within that Account's current evidence. No match is 200 empty, not an instance 404. A generated association with no existing Position ID cannot be guessed into this filter; select its canonical constituent references. |
| `symbol=SYMBOL` | Exact canonical underlying subject search, resolved by the backend, not a broker symbol or client OCC parsing. |
| `construction=IRON_CONDOR\|COVERED_CALL\|CASH_SECURED_PUT` | Exact known construction filter after domain evaluation. Unknown construction is not a positive match; incomplete evidence produces an explicit indeterminate-search qualification. |
| `fields=association,construction,...` | Nonempty unique comma-list of named domain groups in the response below; omit unselected groups. Identity, selection, evaluation metadata and necessary provenance remain. Filters evaluate before projection; omitting a field cannot change its underlying domain meaning. No expression language or arbitrary calculations. |

Selectors combine with AND, with deterministic Account/member ordering; no pagination/truncation is introduced for this bounded complete collection. `selection` echoes normalized filters and selected groups, with `matchState=DETERMINATE|INDETERMINATE` and authorized unresolved-candidate count where requested evidence cannot establish search completeness. Zero known matches under insufficient evidence is not a claim of zero real Positions. Operational capacity limits fail explicitly rather than silently cutting the set. The default complete view keeps unknowns and all inventory fallbacks visible.

**Collection/member identity:** `/v2/positions` is the resource collection. Current `positionId` values denote observed contract/custody inventory or explicit snapshot associations; they do not prove globally unique economic occurrence across accounts/observations. The canonical member reference in this proposal is **Account ID + inventory snapshot ID + existing Position ID**, with constituent holding references for derived association claims. Exact collection selection provides a dereferenceable scoped representation without inventing a new identity registry. `/v2/positions/{positionId}` is deliberately not added for this scan because the existing scope does not support an unqualified universal instance lookup. If an independently useful instance API is subsequently required, its identity semantics must be reconciled first; merely adding a path would conceal the gap.

Authorization reuses canonical Account selection, `account.read:ID` for metadata and `account.positions.read:ID` for Position representations. No new screen-specific read/acquisition grant is proposed. The expanded domain interpretation and any supplementary private-source access must have an explicit reviewed permission mapping before implementation; existing production permissions are not silently broadened by this document. Missing required Account grants excludes the Account from unfiltered discovery and returns 403 for explicit selection, before private evidence access or provider contact. Canonical shared underlying quote facts additionally respect existing `quote.read`; without it, affected groups are unavailable without denied facts/references. Internal read-through is separately constrained by backend service/provider policy, not by manufacturing caller acquisition authority.

A derived result cannot bypass a denied input capability: for example, publishing covered-call whole-position P/L must not indirectly reveal a canonical underlying quote denied to that caller. Withhold affected results as well as raw values; preserve independent option-only facts where their own authority is sufficient. No broader access follows from possessing an Account ID or administrator identity.

Response 200: a complete collection of authorized Account results, using one backend `evaluatedAt` and a final committed evidence read boundary after any permitted read-through. Unfiltered scope accounts for all authorized Accounts, including `NO_OBSERVATION`; filtered results preserve selection/completeness qualifications. SQL/read failure yields the existing 503 Problem response, not a fictitious empty collection. Existing 401/403/404/422/500/503 Problem grammar, X-Request-Id, Bearer challenge and private/no-store publication are reused. Authorized missing explicit snapshot is 404 without global lookup. Unsupported/missing domain evidence is a normal qualified 200 result, not a transport error.

Draft response shape (schematic, **not an OAS edit**):

```text
requestId, evaluatedAt, evaluationBasis = ADMITTED_EVIDENCE_AT_INSPECTION
selection: { filters, fields, matchState, unresolvedCandidateCount }
accounts[]:
  account: { id, alias, displayName }                # no native number
  observationState: AVAILABLE | NO_OBSERVATION
  inventory: existing PositionRead | null           # unchanged evidence representation
  monitoring:
    evidenceSet: { sourceRefs[], ruleVersions, selectionBasis }
    positions[]:                                   # qualified existing Position projection
      inventoryPositionIds[], constituentHoldingIds[]
      association: Result<AssociationClaim>
      construction: Result<ConstructionAndCoverage>
      contractState: Result<ContractState>           # expiration/DTE independent of opening
      payoff: Result<PayoffGeometry>
      spot: Result<SpotAssessment>
      lifespan: Result<LifespanAssessment>
      exit:
        instruction: Result<QualifiedInstruction>
        objective: Result<ExitObjective>
        progress: Result<ExitProgress>
      valuation: Result<PositionValuation>
      quote: Result<QuoteAssessment>
    unassociatedInventoryPositionIds[]
```

`inventory` always preserves constituents; `positions` contains only groups whose association the backend can establish. Unassociated/unsupported inventory remains available for fallback display. Every holding is accounted for exactly once in the monitoring grouping or fallback, with references back to unchanged inventory; do not sum both projections as separate assets. No cross-Account association is permitted. The initial bound is **whole held quantities** using existing exclusive associations; partial share/cash allocation is not smuggled into the holding-ID list. Excess shares or partial quantities require a supported broader construction or remain fallback, not a falsely fully covered call.

The Account-grouped envelope reuses existing snapshot publication structure; its logical members remain canonical Positions, not acquisition runs or terminal rows. `monitoring` names a representation. Reusable domain capabilities establish the facts before projection, so another tool or representation must obtain equivalent conclusions from equivalent evidence and governance. No column-specific evaluator or duplicate financial authority is introduced.

`Result<T>` is a **local response convention**, not a generic assertion ontology or workflow engine:

```text
{ state: AVAILABLE | UNAVAILABLE | CONFLICTING | NOT_APPLICABLE,
  value: T | null, reasonCodes: string[], evidenceRefs: string[],
  calculationVersion: string | null }
```

All keys are explicit. AVAILABLE requires a validated typed value; other states require null and a reason. Numeric zero is known zero, never missing. Known negative coverage is an available negative fact, not unknown or negative Program membership. UNAVAILABLE reasons distinguish absent source, insufficient coverage, unresolved association, unverified terms, policy/basis undefined and denied optional capability. Do not indiscriminately reuse ADR-021's governed Recommendation predicate states for these market/inventory facts.

The backend validates all dependencies before publishing a conclusion; the client cannot promote unknowns by combining individually true but unrelated facts. Conflicting references are retained as conflict evidence. Structural corruption fails the representation; ordinary evidence insufficiency leaves independently supported groups readable.

### 9.2 Canonical financial facts and presentation mapping inputs

| Group / proposed typed fields | Backend obligation | Client allowance |
|---|---|---|
| association: source authority, Account, snapshot/observation applicability, member IDs/quantities, basis | Establish the specific relationship; no geometry-only grouping or inherited occurrence | Render one row per qualified association, otherwise constituents. |
| construction: kind, underlying subject, contracts, coverage, deliverable, premium multiplier, exercise amount factor, horizon | Verify actual terms and complete-position coverage; short put alone is not CSP | Display a non-color-only IC/CC/CSP identifier within PAYOFF. |
| payoff: horizon, valueBasis, units, vertices/segments, tails, strike breakpoints, plateauBounds, bounded/unbounded flags | Calculate the financial curve/shape and meaningful bounds. Distinguish absolute gross P/L from directional shape without basis | Map supplied segments to terminal cells; clip/round graphic coordinates, place the supplied spot on the same x scale, use compressed fallback. No option pricing or payout calculation. |
| spot: value, primitive, observationRef, comparisonRef, movement, admissibility | Select validated midpoint; establish comparison using the same primitive and coherent dated reference; publish up/down/unchanged/unknown | Decimal formatting and mapping supplied movement to accepted colors. No midpoint, change or session calculation. |
| contractState: expirationDate, remainingDte; lifespan: openedDate, progress, endpointState, openingBasis/scope | Publish contract DTE independently of supported opening attribution and New York calendar lifespan; do not treat receipt/export date as open | Round supplied progress to a marker cell, format supplied DTE. No calendar arithmetic. |
| exit.instruction: scope, instructionRefs, transitionState; exit.objective: kind, label, targetValue/unit, scope; exit.progress: fraction, signal | Qualify current instruction graph and coverage; compute exact Pxx versus LIMIT, progress and threshold state independently. A known limit survives an unavailable opening-relative Pxx/progress result | Print supplied label/progress; map signal/transition enum to glyph/color. No credit-capture or near-target rule. |
| valuation: scope, currency, openingValue/basis, currentValue, grossPnl, method, admissibility, qualifications | Complete valuation under the declared scope; no unsupported mixed sources, partial totals or broker-openPl relabeling | Currency/sign/precision formatting only. |
| quote: oldestRelevantObservationAt, ageMsAtEvaluation, includedObservationRefs, status | Select exact relevant leg/spot observations, compute aggregate age and independent validity status at evaluatedAt | Convert supplied elapsed age to s/m/h text; map status to color. No local clock, oldest-source selection or freshness inference. |

Money and prices retain existing v2 JSON-number conventions, emitted from exact backend decimal arithmetic. Units/currency and scope accompany values. Machine output preserves complete values and provenance; display rounding does not alter authoritative results. No duplicated financial formula belongs in `ww`.

Proposed valuation convention: use complete, exact-contract admissible midpoint observations with their declared source primitive; any bid/ask-derived midpoint is a backend calculation labeled as such, not a fabricated provider fact. For the supported credit IC and short-put specimens, gross option P/L is attributed opening credit less indicative close debit, extended by verified quantity and premium factor. Whole covered-call P/L additionally includes its explicitly pinned share basis and current share valuation. These results exclude fees/dividends/financing unless the declared basis explicitly includes them. No option-premium capture ratio substitutes for whole-position P/L. Reuse the accepted tt mark-recovery behavior only as an explicitly reviewed backend method: every leg must have a valid same-response broker mark within its bid/ask, the complete signed package must be nonnegative, and the entire package switches source together. Otherwise negative/incomplete package valuation remains unavailable; never clamp a negative package to an invented free close. Publish method/status separately and retain the accepted amber fallback treatment.

**Renderer reuse needs a boundary correction:** existing `tastytrade-live-render.mjs` calculates Pxx labels from credit capture and selects row quote age from option/spot ages; it also classifies near/at-target progress. Those paths cannot become v2 business authority merely because they sit in a file called “render.” Reuse terminal drawing, not those decisions: v2 must provide objectiveLabel, aggregate age/status and exit signal. Coordinate interpolation of an already supplied curve is presentation; evaluating instrument cash flows to generate that curve is backend work.

### 9.3 Internal read-through — no new public acquisition operation

The proposed public monitoring acquisition extension is **withdrawn**. There is no replacement acquisition URI, selector, POST, request-instance resource or requirement for `ww` to orchestrate refresh. The existing acquisition endpoints remain unchanged for their separately documented uses.

A canonical Position GET may cause authorized **server-side evidence maintenance**, including provider reads and immutable observation persistence, while retaining safe client-requested semantics. It does not create a Position, broker instruction, policy, trade, cancellation or lifecycle event merely by being read. Audit/observation records created incidentally are not the resource the client asked to create. No `201` or `202` is returned merely because internal evidence changed or a provider was contacted.

**Current implementation versus extension:**

| Backend mechanism | Already supported | Extension required for this Product |
|---|---|---|
| AcquisitionWorker / SessionGate / ProviderAuthorityManager | Independently maintained market evidence, active authority/session controls, scheduling and worker single-flight | Compose with monitoring dependency needs under existing authority; no direct second provider path from a controller. Worker-maintained chain/snapshot evidence is not automatically a canonical exact-contract observation. |
| RequestPacer / ResponseCache | Provider pacing and per-type process-local response TTLs | Reuse the actual provider authority's limiter/cache. Existing TTLs are transport optimization, not a holdings/order validity policy or durable history. Missing brokerage-specific pacing/coalescing must be added locally, not claimed present. |
| DirectQuoteService / QuoteAcquisitionPolicy | Backend ordinary reuse, environment/session identity, admission, authority fencing and retained-prior failure truth for underlying quotes | Invoke reusable domain/source behavior through authorized service composition under a reviewed internal read-through policy. Existing public held-quote GETs stay pure-held; no controller bypass or caller acquisition-grant escalation. |
| PositionAcquisition / TastytradeClient | Explicit holdings capture with backend OAuth, one bounded exchange deadline and immutable retention/admission | No existing Position GET invokes it. Add internal retained-first coordination and the missing read-only source families; do not mechanically invoke the public acquisition route or repeat OAuth/network work per terminal column. |
| MarketMetricsController | An implemented **v1** GET performs backend provider reads, uses a short process-local cache and retains cached facts after a failed refresh | Feasibility precedent for internal request-time reads, not the target contract: it lacks this Position domain integration, durable observation admission and v2 Account boundary. Reuse applicable source-client primitives, not the route or transient cache as domain authority. |
| PositionReadService / PositionMarketEvidence | Query-only retained snapshot projection and same-export-day Fidelity summary enrichment | Extend domain interpretation and introduce read-through coordination **before** opening the final committed read view. Do not hold a SQLite read transaction while waiting on providers. |
| Artifact and observation retention | Original bytes before parsing, source hashes, observed intervals, accepted/rejected outcomes and original-source disclosure protection | Add only required source-specific admission/coverage fields for terms/orders/fills/option quotes; retain normalized domain semantics and original source differences. No second datastore or generalized event log. |

**Proposed execution path:**

1. Authenticate; apply canonical Account/object grants and server provider-contact policy before any upstream work. Derive needed evidence only from authorized Position subjects and selected domain facts. A query cannot smuggle arbitrary native accounts, URLs or unheld contracts into provider work.
2. Resolve reusable retained facts. Treat immutable instrument terms, variable holdings/orders, market observations and history coverage according to their distinct source semantics. Existing direct-quote policy applies only to its own subjects. A cache hit is not proof of admissibility or completeness.
3. Where policy permits, coalesce compatible outstanding source reads and acquire only unresolved dependencies using the owning adapter, authority and pacer. This is bounded per-Account/source coordination within existing backend services, not a new public workflow engine. Apply total request and per-source deadlines, pagination/body/subject budgets, cancellation and failure retry suppression. Reconcile concurrent legacy worker/explicit acquisition work; multiple GETs must not create competing acquisition authorities or an upstream request herd.
4. Retain and admit complete supported observations with their original scopes/clocks; reject malformed/partial evidence without rewriting successful prior observations. Then open a coherent committed read view and evaluate reusable domain capabilities. Do not claim an atomic brokerage cut across non-atomic upstream calls.
5. Return facts and typed unavailable/conflicting results. No response tells the client to issue an acquisition POST merely to complete its Position read. Source policy denies or upstream failures can leave retained/unknown results; they never authorize a trade, credential expansion or client fallback to a broker.

**Authorization distinction:** an authorized domain read plus separately configured backend service/provider permissions may permit incidental maintenance under the ratified facade policy. It does not give the caller `quote.acquire`, `quote.force`, `account.positions.acquire` or trading authority. Existing public grant meanings stay intact. New internal contact/admission paths require explicit reviewed backend policy and adequate source credentials; the current code/grants do not already enforce this proposed path. This revision changes none of them.

**Bounded latency and failure:** existing holdings acquisition bounds one OAuth/holdings exchange, not a multi-Account monitoring GET. A whole-query latency/resource budget and source-family reuse policies must therefore be established empirically before implementation acceptance. Verify warm retained reads, permitted cold source reads, many Accounts, upstream throttle, incomplete pagination, stalled body/cancellation and concurrent GET/worker/POST scenarios. The total deadline cannot be the sum of unbounded per-Account retries. At the bound, preserve admitted partial facts and prior observations with safe reasons; unsupported history searches do not block forever. This is an acceptance proof obligation, not a claim that a new timer, cache coordinator or service is implemented.

### 9.4 Provider feasibility and hard evidence limits

| Needed evidence | Obtainable inputs / repository support | What still cannot be claimed |
|---|---|---|
| tastytrade holdings, current/orders and complex instructions | Backend holdings capture exists. Official [Position](https://developer.tastytrade.com/reference/balances-and-positions/getAccountsAccountNumberPositions/) and [Order](https://developer.tastytrade.com/reference/orders/) references document source reads. Standalone tt exercises related read paths, which is feasibility evidence only. | Current backend does not retain/admit those order families for this view. Endpoint existence does not establish managed membership, complete incoming replacement links or a coherent multi-source cut. |
| tastytrade transactions/fills and contract terms | [Transaction](https://developer.tastytrade.com/reference/transactions/getAccountsAccountNumberTransactions/) and [Instrument](https://developer.tastytrade.com/reference/instruments/) references document inputs; backend integration/coverage admission remains missing. | A bounded history page or instrument symbol is not complete lifecycle history or occurrence identity; actual requested permissions, coverage and terms must be verified. |
| Exact option and equity quotes | Official [instrument-type market data](https://developer.tastytrade.com/reference/market-data/getMarketDataByType/) documents equity-option and equity quotes with provider availability restrictions. Current v2 canonical underlying observations also exist. | Option-quote normalization/admission is missing in the backend capability. Market entitlement, exact term binding and reference-clock coherence cannot be assumed from successful holdings access. Do not publicly expand the underlying-only Quote resource just for this projection. |
| Fidelity holdings, history, summary and balances | Current backend admits retained CSV evidence. Existing [Fidelity evidence research](../research/fidelity-brokerage-evidence-capabilities-option-obligation-continuity-2026-09-28.md) documents limitations and third-party access alternatives. | No currently configured direct Fidelity source can make a GET obtain a new retail CSV or missing live orders. The supported CSV schema lacks durable obligation identity/complete event-time guarantees. Read-through can use already admitted evidence; it cannot automate operator downloads or invent missing files. New partner connectivity is outside this revision. |
| Explicit managed relationship, exclusive cash/share coverage, absent source times and complete corrected history | Some source facts can support bounded domain assertions under D1 and ADR022 premises. | The inspected contracts do not establish universal provider guarantees for these claims. Mark **unestablished/not supported by current sources**, not “provider will return it after one more call.” No matching hash, aggregate balance or order ID fills the semantic gap. |

Provider documentation was inspected read-only; no brokerage-account request, evidence acquisition or entitlement change was performed. Source availability is not universal across brokers. Normalize equivalent facts into the domain model; preserve non-equivalent source scopes, missing capabilities, dates and semantics explicitly.

### 9.5 Backend evidence cache versus HTTP caching and outcomes

Backend reuse keeps recoverable immutable observations and derives current trust/status; process-local ResponseCache is a different optimization. A fresh transport entry can be inadmissible, and a sealed prior-session observation can remain usable despite wall-clock age. Failed read-through retains prior evidence with original clocks, never a newly stamped stale payload. Missing-source and retained-after-failure reasons are published without leaking credentials or unauthorized Accounts.

Start the new private financial view with `Cache-Control: private, no-store`; no shared cache or client-owned domain persistence. No ETag/304 behavior is promised initially. If conditional/private HTTP caching is later justified, authenticate/authorize before validation, key the representation by canonical selectors, projection and caller visibility, and use a validator covering the complete selected facts **and** their time-dependent assessments. Since `ageMsAtEvaluation` changes over time, an unchanged source hash alone cannot make that representation unchanged. Return 304 only when the selected representation genuinely matches. Use standard Vary for representation-negotiation inputs where appropriate; it is not a substitute for authorization or protection from shared caching. Existing endpoints' Cache-Control/ETag behavior remains unchanged.

| HTTP outcome | Monitoring semantics |
|---|---|
| 200 | Authorized canonical collection/projection, including a genuinely empty collection, retained qualified facts, or explicit unavailable evidence. Missing evidence must not masquerade as an authoritative empty Position set. Unknowns are normal domain results, not invented current truth. |
| 304 | Not part of the initial no-store design; only with a future explicitly documented, authorized, representation-correct conditional cache contract. |
| 401 / 403 | Existing unauthenticated / explicitly unauthorized Account semantics, before any private evidence access or provider contact. |
| 404 | Authorized requested exact retained snapshot does not exist under its documented selection contract; no cross-Account lookup. Collection/member search with no matches instead returns 200. No new instance route is promised. |
| 422 | Existing common invalid-selector/body/filter/projection semantics; no upstream request. |
| 500 | Unexpected normalization/domain/representation failure, using the common sanitized Problem contract; never fake unknowns to hide software corruption. |
| 503 | The requested domain representation cannot be served safely because required infrastructure/source access is unavailable and neither qualified retained data nor a truthful unavailable representation can be produced. Optional source failure with independently usable retained facts does not fail the entire collection. Use standard Retry-After only when a justified retry time is known. |

No 201/202 creation/job response is added to GET. Where an existing POST already has documented operation semantics, preserve it; this proposal neither recasts it as a Position-creation collection nor removes it.

## 10. Evidence, temporal semantics and association qualification

Each source reference contains recoverable artifact/observation identity, Account and source type, source hash, source row/JSON location, provider/environment where applicable, source event/quote/as-of time **when actually supplied**, request/receipt/recorded bounds, coverage and interpretation version. Unknown source event time remains unknown. Source IDs in output never grant original-byte access; existing multi-Account/unknown-scope disclosure rules remain authoritative. Credentials, OAuth responses, native Account URLs and raw broker numbers do not appear in monitoring payloads.

Complete quote-age aggregation requires every observation the backend says is relevant to the displayed valuation/spot. Missing required timestamps makes that aggregate unavailable rather than presenting a partial subset as complete; individual known clocks remain in provenance. A known contract DTE survives missing opening evidence. A qualified broker limit may remain LIMIT while Pxx classification or progress is unavailable. These are separate groups, not a first-blocker failure.

A monitoring response describes admitted knowledge at its evidence selection boundary, whether previously retained or just admitted by permitted internal read-through. Separate reads are not a fictional atomic brokerage instant. Identical holdings before/after a capture or a matching content hash cannot prove that no intervening close/reopen occurred. Each repeated successful acquisition has a new observation boundary even when the raw artifact is reused. Historical snapshot selection pins inventory and performs no latest-broker refresh; supplementary references must establish their temporal binding and disclose later recorded times where applicable. Current facts cannot be silently projected backward. The response is inspection-time assessment, not as-of historical replay. No backdated evidence may masquerade as contemporaneous knowledge (ADR-019).

Proposed qualification rules, subject to review:

1. Existing admitted explicit snapshot associations remain valid within their declared whole-quantity scope. Their authority string alone does not prove contract terms, current broker instruction, opening occurrence or Program membership.
2. New broker-derived management association requires a source-supported **explicit relationship**, exact Account/contract/direction/whole quantity matching, adequate source coverage, unique non-overlapping ownership of constituents, and temporally admissible observations without unresolved contradictions. An intent to close a geometric package is not by itself proof of a current managed Position. Broker IDs are used only within their documented relationship guarantees.
3. All potentially relevant replacement/cancel references must be typed and resolved, including incoming links from terminal orders. Malformed references never become absent; terminal status never licenses ignoring a link. Partial fills, quantity changes, duplicate/overlapping packages and unresolved transitions block dependent association/exit conclusions. Opening attribution remains a separate assertion even if current association succeeds.
4. For covered calls, broker-authoritative ownership plus supported exclusive coverage association must account for the actual deliverable and all competing encumbrances. For CSP, require supported cash-security/encumbrance evidence with non-overlapping allocation; neither settled cash nor an option margin figure alone establishes it. No general allocation framework is introduced.
5. Construction can remain verified when opening basis is missing: publish only a **directional-shape** curve with no absolute dollars or financial gain/loss coloring. Absolute payoff/P&L requires attributed basis/cash flows. Unsupported adjusted terms or mixed horizons withhold unsupported geometry, not the underlying holdings.
6. Quote selection/admissibility and numerical formulas reside in the backend. Failed capture preserves last successful evidence with original clocks; stale/retained status is derived at read time. No client session heuristic may override the backend verdict.

## 11. Representative semantic specimens

All numbers below are **synthetic design fixtures**, not actual Account facts, Product goldens, live acquisition or policy. USD, ordinary verified 100-share physical-delivery terms and a verified premium multiplier of 100 apply only to these specimens. Backend arithmetic is shown to make the contract falsifiable, not to prescribe CLI calculations. Options mechanics are grounded in the domain reference and the [OIC covered-call](https://www.optionseducation.org/strategies/all-strategies/covered-call-buy-write), [cash-secured-put](https://www.optionseducation.org/strategies/all-strategies/cash-secured-put) and [condor](https://www.optionseducation.org/strategies/all-strategies/short-condor) references; names never substitute for the exact legs.

### A. Iron condor — all dependent facts available

Account `tt1`; explicit qualified current association over +1 put59, −1 put59.5, −1 call64.5, +1 call65, one expiration. Admitted occurrence evidence establishes 0.20/share opening credit; valid complete option midpoints establish 0.12/share close debit; a uniquely linked current debit limit is 0.10/share. Verified underlying midpoint 62.00 exceeds a coherent dated prior midpoint-reference close of 61.80. Verified opening day to expiry spans 20 NY calendar days; 10 remain. Oldest relevant quote age at evaluation is 120,000ms.

Backend publishes: construction IC; four strike breakpoints; expiration maximum-profit interval [59.5,64.5]; absolute plateau +$20 and tails −$30; spot62/up; lifespan progress0.5 and remainingDte10; exit P50, progress0.8/TRACKING; gross package P/L+$8; aggregate quote age120,000ms/usable. No execution or impending assignment is inferred.

Terminal semantic row: `tt1 | XLE | accepted IC outline+spot | 59.5–64.5 | 62.00 | midpoint ruler+10d | P50 ruler+80% | +$8 | 2m`. This is a field-level specimen, not an exact accepted terminal string.

Falsifiers: incoming unresolved terminal predecessor, malformed replacement ref, mismatched fourth-leg quantity or overlapping management package prevents affirmative broker-derived association and preserves four inventory fallbacks. Missing opening attribution keeps independently verified construction/shape/spot/quote but withholds absolute P/L, lifespan and opening-relative progress. Conflicting multiplier withholds verified construction/payoff independently of any established association.

### B. Covered call — complete position and option objective are different scopes

Account `pts`; admitted explicit association/coverage binds +100 URA shares and −1 call43 with a common supported horizon, exclusive coverage and verified standard terms. Pinned share basis40, opening call credit1, spot41 and current call close debit0.60. A current call-only target debit0.50 is properly linked. The call opening interval is20 NY days with10 remaining; oldest relevant quote60,000ms. Shape rises below43 and is flat above43.

Under proposed whole-Position P/L semantics: backend whole-Position gross result = `100×(41−40) + 100×(1−0.60) = +$140`. The independently scoped call objective is P50 with progress `(1−0.60)/(1−0.50)=0.8`; it is **not** 80% of the entire covered-call maximum profit. Absolute expiration plateau is+$400; DTE/lifespan refer to the short-call episode, not the age of the shares. The response declares both scopes; choice of which scope appears by default needs D2 below.

Proposed row: `pts | URA | CC rising→flat+spot | ≥43 (D3 pending) | 41.00 | 10d ruler | P50 +80% (CALL_ONLY) | +$140 (WHOLE_POSITION) | 1m`.

Falsifiers: same shares allocated to another call, 99 shares for a100-share obligation, or unsupported partial/excess-share allocation cannot produce the standard fully-covered silhouette. Missing share basis permits directional CC shape but no whole-Position dollar P/L; it must not silently substitute the known +$40 call-only result. Closing the call does not claim the shares were sold or a broker order executed.

### C. Cash-secured put — collateral is established separately

Account `pts`; −1 ARKK put90 is associated with independently established, non-overlapping $9,000 cash security under a supported Account collateral treatment. Verified opening credit2/share and current option close debit1.20/share; supported current target1/share. Spot93 with coherent movement reference. Twenty-day verified short-put lifespan,10 remaining; relevant quote age180,000ms. No stock is owned merely because the put might be assigned.

Backend publishes CSP construction, secured amount/authority, rising-then-flat expiration shape with plateau above90, gross short-put P/L+$80, P50 exit progress0.8, 10d lifespan, quote3m. Cash backing is not added a second time to P/L, interpreted as deployable capital or claimed released. Proposed row: `pts | ARKK | CSP rising→flat+spot | ≥90 | 93.00 | 10d ruler | P50 +80% | +$80 | 3m`.

Falsifier: replace the specific security/allocation evidence with only a$9,000 cash balance or margin requirement. The backend retains an observed short put and any independently known option economics, but does not label it CSP or draw a confirmed CSP instrument. Assignment/expiration is never inferred from spot or DTE.

### D. Unrecognized or incompletely evidenced Position

Four observed options resemble an IC but have no admitted association, or one deliverable is unverified. The backend returns unchanged inventory, explicit group/fallback references and typed reasons such as `ASSOCIATION_UNESTABLISHED`, `TERMS_UNVERIFIED` or `HORIZON_UNSUPPORTED`. The CLI renders constituent rows under the same nine-column layout, with contract identity and independently supplied DTE/spot where supported; unsupported instruments are `—`. Quantity/custody/broker-openPl/provenance remain inspectable in verbose/machine output. The canonical gross P/L cell remains unknown if its basis is unavailable.

Never draw a synthetic IC to make the table attractive. For an already established association with missing terms, retain that association row and withhold only the dependent curve; do not erase a known relationship. For mixed-expiration calendars, withhold an exact expiration curve without an accepted horizon/valuation model. Such a model is outside this extension.

## 12. Exact mapping to the nine-column Product surface

Order: **ACCOUNT | SYMBOL | PAYOFF | RANGE | SPOT | SPAN | EXIT PROFIT | P/L | QUOTE**. No tenth column or default diagnostic footer. Rich explanations remain opt-in. Machine data keeps full precision, basis and evidence.

| Column | Backend field(s) | Presentation and unknown rule |
|---|---|---|
| ACCOUNT | `account.alias` | Friendly nickname on every row; never native number/GUID. Missing required metadata is an Account capability failure, not a fabricated alias. |
| SYMBOL | verified `construction.value.underlying` or backend-supplied inventory label | No CLI OCC parsing or symbol-based grouping. Unsupported constituent retains exact backend contract identity. |
| PAYOFF | `construction.kind`, `payoff.value.{horizon,valueBasis,segments,tails,breakpoints}` plus supplied spot | IC preserves accepted31-cell geometry. CC/CSP use accepted rising→flat shape with readable type label and restrained accent; exact scaled layout/palette pending. Unverified geometry is `—`; inadequate resolution is compressed, not enlarged wings. |
| RANGE | `payoff.value.plateauBounds` and bound inclusivity | IC short-strike plateau, never breakevens. CC/CSP one-sided bound recommendation needs D3. Client formats bounds only. |
| SPOT | `spot.value.{value,movement}` | Same backend-selected midpoint used for marker; backend movement chooses semantic color. Unknown comparison remains yellow; unknown price `—`. |
| SPAN | `lifespan.value.{progress,endpointState}` and `contractState.value.remainingDte` | Accepted11-cell ruler and supplied DTE. Unknown opening means unknown track; independently known DTE may remain. No configured DTE-exit tick is introduced. |
| EXIT PROFIT | `exit.objective.value.{label,scope}`, `exit.progress.value.{fraction,signal}`, `exit.instruction.value.transitionState` | Backend Pxx/LIMIT, signed unbounded percentage and status. Indicative threshold `~` does not imply execution. Missing objective/progress remains unavailable independently. |
| P/L | `valuation.value.grossPnl`, declared scope/basis | Signed dollar formatting; D2 must fix default heterogeneous scope. Do not relabel existing `inventory.positions[].openPl` as this field. Zero is neutral; positive/negative colors preserved. |
| QUOTE | `quote.value.{ageMsAtEvaluation,status}` | Format seconds/minutes/hours and backend status. No client Date.now, min/max source age, holdings-clock substitution or age-based validity rule. |

ANSI/no-color/ASCII, display-cell measurement, proportional strike/spot placement, no truncation of financial numbers and narrow-column omissions follow the accepted tt specification. CC/CSP type cannot rely on color alone. Backend carries semantic numeric geometry, not ANSI, terminal width or preformatted financial strings. Five-column CC/CSP proposal fixtures do not replace this nine-column requirement.

## 13. Architecture fitness functions and falsifiers

These are proposed checks in the existing three-layer quality program, not implemented controls or new hard gates. Reuse strict Sonar for structural trend, ArchUnit only for independently defensible/ratified boundaries, and independent design/domain review for judgment. Do not claim WW-GATE-001 is active. Existing draft tests from before this assignment are not proof of these future backend capabilities.

| Fitness function | Observable falsifier / required proof |
|---|---|
| Backend owns semantics and calculations | Perturb published membership, terms, P/L, objective label, progress, movement and admissibility independently of raw client inputs. Every displayed conclusion follows backend values. Instrument client dependencies: no recognition, midpoint, opening cash-flow, P/L, calendar, collateral, objective classification or session rules. Only geometry/formatting remains. |
| CLI talks exclusively to v2 | Execute ordinary installed candidate commands in a network-isolated harness allowing only the selected v2 origin. Fail every v1/provider attempt; reject redirects to brokers; remove all broker credentials. Inspect transitive imports and process launches, including optional branches. Log actual client GET requests; no client acquisition orchestration, local domain DB access or broker side channel. Backend read-through is separately traced and authorized. |
| Association/quantity conservation | Two same-symbol positions, overlapping packages, excess shares, changed quantities, partial fills and contradictory sources must not produce duplicate ownership or guessed grouping. Every held quantity appears in one qualified grouping or fallback. IDs/hashes/geometry alone cannot establish the relationship. |
| No fabricated lifecycle | Same series fully closes/reopens; fills/history are incomplete; endpoint time is unknown; holdings repeat identically; DTE reaches0. No inherited opening credit/date, assignment, expiration or execution is asserted without admissible brokerage evidence. ADR-022 premises cannot be inferred. |
| Working-instruction integrity | Include incoming links from terminal orders, missing reciprocals, malformed object/array refs, cancellation/replacement ambiguity, duplicate IDs and broad/narrow response disagreement. Dependent conclusions remain unresolved; no invalid reference becomes absent. Preserve R1/R2 rejection falsifiers permanently. |
| Terms and payoff correctness | Backend fixtures for exact IC/CC/CSP quantities and horizons; adjusted/unknown multipliers, unsupported cash settlement, unbounded tails, same-shape different structure, mismatched expiry. Compare signed economic regions with independent domain expectations. Basis absence preserves only qualified directional shape. |
| Valuation and independent unknowns | Missing one leg prevents a partial total; complete valid zero remains zero; negative synthetic package midpoint cannot invent a profitable zero-cost close. Any mark fallback requires an explicit backend method/admissibility rule over complete source-consistent marks. Change share basis: CC whole P/L changes, call-only exit progress does not. |
| Temporal/evidence authority | Friday sealed/retained versus live stale, unknown source clock, future quote, mixed-source observations, failed refresh and restart. Original clocks persist; quote age/validity remain distinct; no newly recorded evidence becomes historical contemporaneous knowledge. Monitoring GET may perform only policy-authorized bounded provider reads/admission; it performs no client-requested unsafe domain action. Existing pure-held routes retain their no-contact/no-write guarantees. |
| Safe, bounded read-through and cache correctness | Warm GET reuses adequate retained observations; authorized cold GET admits only permitted read evidence; concurrent GET/worker/legacy POST uses the owning authority/pacer without a herd. Provider throttle/stall/incomplete pagination reaches total deadline with retained/unknown results, not unlimited retries or a request to POST. No GET creates/modifies/cancels an order or governance. Identical raw hashes cannot justify 304 when age/status or caller visibility changes; no cross-User shared cache. Historical selection never refreshes current holdings into an old snapshot. |
| Account isolation and source disclosure | Explicit/unfiltered reads, unknown or other-Account snapshots, aliases masquerading as IDs, missing supplementary grants, partial original-source scope. No Account/financial data or raw numbers leak. Compare grants/IDs/artifact hashes before/after any eventual rehearsal. |
| Existing accepted behavior intact | Characterize old GET responses/default selectors, snapshot/catalog selection, holdings acquisition defaults, Problem/OAS shapes, quote API, Fidelity custody/inventory, tt live human/TSV and v1 Web. Old requests remain compatible. Verify on immutable candidate/disposable copies before any promotion. |
| Product visual fidelity | Actual nine-column native-terminal specimens at supported widths, Unicode/ANSI/no-color/ASCII, CC/CSP type distinction, whole-Position versus objective scope, unknowns and constituent fallback. Compare accepted IC reference; never modify proposed goldens merely to pass a renderer. |

Independent review must challenge evidence owners, temporal claims and consumer paths, not merely source schemas or self-authored tests. Submission requires immutable candidate identity, executable results and source-linked proof index. Approval of this proposal does not itself authorize implementation, deployment or evidence acquisition.

## 14. Additions justified; alternatives rejected

| Addition | Why existing composition is insufficient | Smallest bounded choice / falsifier |
|---|---|---|
| Monitoring view | Inventory lacks independent domain qualifications, whole-position metrics and coverage; a client join would manufacture semantics | Opt-in existing Positions representation. If unchanged existing responses already supply those conclusions with authority, drop the corresponding addition. |
| Qualified result/provenance fields | Null alone cannot distinguish unavailable evidence, conflict, inapplicability and a known zero; free-text qualifications cannot drive truthful clients reliably | Local typed groups referencing retained observations; no general assertion or dependency framework. |
| Internal retained-first read-through coordination | The appliance has useful acquisition/admission primitives but no existing bounded Position GET integration for missing source families | Compose under owning backend authority, with source policy/deadlines/coalescing and retained fallback. No new public workflow resource or acquisition selector; no change to existing operation endpoints. |
| Backend monitoring calculations | Existing monthly realized production and bounded single-obligation continuity do not answer current complete-position monitoring questions | Compose existing parsers/math where semantics match; bounded functions under existing Java service/domain boundary. No fourth engine or provider-specific finance in controllers. |
| Additional source admission records | Existing inventory snapshot and direct underlying QuoteObservation cannot represent authoritative order coverage, terms or exact option-quote provenance | Reuse artifacts/observation patterns, with only source-specific fields required by the claims. No second datastore or generalized event sourcing. |

Do not use a new `/positions-dashboard`, `/tt-live`, `/strategies` or `/sparklines` resource. Do not expand the frozen v1 snapshot, call existing v1 endpoints from ww, reuse prototype business authority, require a universal lifecycle engine, migrate accepted standalone tt or turn a terminal golden into financial authority.

## 15. Consequential Product decisions for Principal review

These cannot be resolved by calling the prototype “accepted.” The IC Product precedent and CC/CSP shape acceptance do not settle heterogeneous financial meaning.

**D1 — What establishes a managed row, and initial quantity scope?** Recommend reusing explicit admitted snapshot associations and permitting new broker-derived associations only under the explicit-relationship/coverage/exclusivity contract in §10. Mere geometry, co-location or a matching exit order is insufficient. Initial whole-held-quantity scope avoids inventing partial allocations; Accounts needing partial coverage remain truthful fallback. Confirm this scope before implementing automatic association or widening the allocation model.

**D2 — Meaning of P/L, EXIT PROFIT and SPAN for a covered call.** Recommend P/L = whole associated stock-plus-call gross mark-to-market under a pinned basis; EXIT PROFIT may remain a separately declared call-only broker objective, and SPAN refers to that short-call episode. This preserves complete-position economics but mixes scopes in a compact row. Alternative: explicitly choose call-cycle P/L as the default while keeping whole-position P/L separately available. The API must preserve both scopes; it must not silently select broker-openPl, stock tax basis, recent share cost or call premium capture as interchangeable. Principal must choose the default meaning and its necessary compact scope cue.

**D3 — RANGE semantics for CC/CSP.** Accepted IC RANGE is the maximum-profit expiration plateau, not breakevens. Both fully covered CC and CSP plateau at/above their strike. The proposed CC fixture's `≤43` therefore cannot be interpreted as that plateau; it could instead mean a share-retention preference, which is separate policy. Recommend retaining the plateau meaning and displaying `≥strike` for both, distinguishing structures with text/ restrained color. The fixture is proposed, so this is a review finding, not permission to edit it or claim a new accepted golden.

**D4 — Exact CC/CSP terminal label/palette/scale.** Shape and restrained differentiation are accepted; precise ANSI palette, spot placement and full nine-column layout are not. Recommend a short CC/CSP text identifier within PAYOFF plus a restrained structure accent, preserving established spot/P&L/unknown colors and no-color readability. Approve through a future actual-terminal specimen, not this prose or schematic fixtures. No added column is proposed.

The literal below-strike CC/CSP proposal fixtures place their marker after the transition glyph; they therefore cannot serve as calibrated strike/spot goldens for a real rising-then-flat curve. Their declared proposed/schematic status matters. Preserve the accepted common-x-scale invariant and obtain a corrected, actual scaled specimen rather than reproducing this mismatch or changing reference files during this review.

Other engineering choices—typed mapping, internal class seams, transaction mechanics, test harness and bounded provisioning—remain engineering work after the required review/authorization. Provider capability limitations or absent required source semantics must be reported, not bypassed in the CLI. No new governed exit rule, autonomous action, capital-deployability decision or Step6 shared reconsideration is requested.

## 16. Architectural conflicts found and resolved by this revision

1. **Old proposal versus ratified facade:** the old rule forbidding provider contact/persistence in every monitoring GET and the proposed public monitoring acquisition workflow contradicted the new ratified direction. Both are removed. Internal safe read-through now serves ordinary domain GET; it is proposed behavior, not implemented capability.
2. **New default versus existing published contracts:** current Positions and held-quote GETs explicitly promise pure-held/no-contact behavior. The clarification explicitly forbids silently changing those latency/failure/source contracts. The opt-in monitoring projection is the compatible extension; existing reads and acquisition routes remain unchanged. A broader default migration is not part of this revision.
3. **Canonical instance aspiration versus existing IDs:** inventory/association IDs currently have bounded demonstrated scope, not guaranteed universal economic-occurrence identity. The proposal makes that scope explicit and avoids an unjustified instance endpoint or identity framework. This is an implementation/domain-identity limitation, not a reason to invent lifecycle continuity.
4. **Facade transparency versus provider evidence limits:** a coherent domain API can hide transport without concealing missing facts, permissions, source-specific coverage or inability to establish a relationship. Read-through cannot manufacture D1 evidence, D2 basis or broker guarantees. Those limitations remain explicit domain results and review questions.

With these revisions, no remaining contradiction with the ratified facade/REST clarification is asserted. D1–D3 remain genuine Product decisions; bounded latency/source feasibility and permission mapping remain implementation obligations. Neither is resolved by declaring compliance.

## 17. Review and next boundary

Principal review should assess the canonical domain capabilities, Positions projection and identity/filter semantics, bounded internal read-through/source authorization and compatibility, independent unknowns, D1–D3 semantic choices, and the nine-column mapping. D4 remains a later concrete terminal specimen boundary. An accepted proposal would still require explicit implementation authorization; API/OAS changes, migrations, installation, live provider requests and brokerage evidence mutation are not authorized by this submission.

Verification for this revision: remote synchronization and inspection of ratified facade/REST changes, repository/source/contract and official provider-document inspection, proposal consistency/link/arithmetic checks and protection of pre-existing source drafts. Existing visual-reference tests and prior domain grounding remain relevant reference evidence, not proof of implemented read-through. No new fitness harness, OAS, backend code or operational change was implemented. No independent actor review or Product acceptance is claimed.
