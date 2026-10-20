# V2 Ontology / Resource Semantic-Coverage Reconciliation

**Date:** October 7, 2026  
**Status:** Principal-ratified Product/architecture reconciliation; not implementation authority  
**Scope:** Operating-regime scope and ontology-to-v2-resource audit discipline

## Operating-regime scope — v2 reconciliation

> **An operating regime applies to the explicitly governed capital/inventory scope for which it is authoritative. Account identity or account accounting/execution context does not establish that operating regime. One account may contain separately governed quantities under different operating regimes. The canonical identity of those scopes remains subject to Position/Inventory reconciliation.**

This preserves the distinct account accounting/execution context recognized in Doc 80 while incorporating the separately governed quantity specimens in Doc 81. Operating-regime scope is not shares-only; the wording deliberately preserves cash-side governed capital.

## Semantic-coverage audit rule

> **Every Product-relevant meaning required by a supported capability must have a faithful v2 representation. Independent resource identity is earned, not automatic.**

Operator capabilities establish why independent access is useful; identity, authority, provenance, and temporal semantics establish whether the proposed resource is sound.

The ontology itself remains falsifiable. An audit can expose an incorrect ontology distinction as well as an incorrect resource representation.

Therefore absence of a root endpoint does not by itself establish a semantic gap. An embedded relationship, assertion, governed context, observation, or derived finding can be a faithful representation where independent identity is unnecessary. An ontology noun does not automatically imply a REST collection, and a descriptive URI does not repair ambiguous identity.

## Audit questions

For each Product-relevant meaning implicated by a supported capability, ask:

1. Is the meaning faithfully represented anywhere? — semantic coverage.
2. Is independent identity necessary? — resource candidacy.
3. Who establishes or changes it? — authority boundary.
4. What operator question or capability requires independent access? — capability justification.
5. Is it a definition, occurrence, relationship, assertion, observation, or derived view? — representation meaning.
6. What provenance and temporal semantics make it truthful? — evidence/authority fitness.

These questions are an audit discipline, not an endpoint-generation algorithm.

## Identity-conflation falsifiers

### Contract versus account relationship

A Contract can exist independently of any account holding it. An account's evidenced long or short quantity establishes an account-specific economic relationship to that Contract. Contract existence alone does not establish that an account owns a Right or bears an Obligation. Canonical Contract identity must not be silently conflated with an account-specific holding/obligation record.

### Construction definition versus realized construction

A definition such as **IRON_CONDOR** may merit independent inspectable identity if supported capability needs justify it. Recognition of a particular account-specific iron-condor occurrence requires established constituent Contracts, sides, quantities, and relationships. The definition does not itself establish an occurrence. Recognition of the occurrence does not imply linked execution or automatic joint disappearance of all constituents.

### Position versus governed scope

Conventional Product vocabulary may use **Position**, but that name must not silently establish one universal semantic identity spanning brokerage holding/obligation record, governed inventory, Economic Construction, Decision Subject, and lifecycle continuity. Before expanding a Position resource hierarchy, v2 discovery must state what that identity denotes and what preserves or terminates it through change.

## Non-implications

This reconciliation does not ratify a v2 resource taxonomy or candidate URI, define Contract canonical identity, resolve Position versus Inventory identity, define operating-regime policy, select schemas/persistence/HTTP methods, or authorize implementation.


## Principal-ratified v2 resource-design candidate — October 7, 2026

The Principal ratifies the following as the current **resource-design candidate** for continued v2 Product discovery. This is resource/semantic authority for the candidate model; it is **not implementation authority**, does not freeze schemas or HTTP methods, and does not convert the explicitly open reconciliations below into settled answers.

### Resource discipline

The Wheelwright ontology may contain substantially more concepts than the REST resource model.

> **An ontology distinction earns an independent REST resource only when clients/operators need stable independent identity, addressability, retrieval, mutation/association, or navigation for that meaning. Internal reasoning distinctions and derived evaluation findings do not automatically earn URIs.**

The current candidate resource surface is:

| Resource meaning | Candidate URI pattern | Current status / unresolved pressure |
|---|---|---|
| Broker | `/v2/brokers`, `/v2/brokers/{broker}` | Strong candidate. |
| Account | `/v2/accounts`, `/v2/accounts/{account}` | Strong candidate. |
| Account Snapshot | `/v2/accounts/{account}/snapshots`, `/v2/accounts/{account}/snapshots/{snapshot}` | Broker state observation at a point/boundary in time; exact snapshot semantics remain to be designed. |
| Account Ledger | `/v2/accounts/{account}/ledger`, `/v2/accounts/{account}/ledger/{entry}` | Durable accumulation of broker evidence/history. Entry identity and exact schema remain design work. |
| Symbol / Instrument | `/v2/symbols`, `/v2/symbols/{symbol}` | Candidate; Symbol-versus-Instrument semantics remain to be reconciled. |
| Option Chain | `/v2/symbols/{symbol}/chains`, `/v2/symbols/{symbol}/chains/{chain}` | Candidate; enduring resource versus temporal observed view remains open. |
| Contract | `/v2/contracts`, `/v2/contracts/{contract}` | Contract is already an established ontology concept. Canonical v2 URI/identifier remains design work. |
| Position | `/v2/accounts/{account}/positions`, `/v2/accounts/{account}/positions/{position}` | Candidate and default decision subject; exact identity must survive the split-governance specimens before implementation. |
| Inventory Block | candidate only if Position cannot faithfully carry the required governed-quantity semantics; possible `/v2/accounts/{account}/inventory/{block}` | Must justify additional meaning rather than duplicate Position. |
| Operating Program | `/v2/programs`, `/v2/programs/{program}` | Strong candidate; e.g. Growth Wheel. |
| Operating Regime | linked/applied to the explicitly governed Position/inventory scope | Representation waits on Position/Inventory reconciliation. Account identity does not establish operating regime. |
| Economic Construction | `/v2/constructions`, `/v2/constructions/{construction}` | Definition resource candidate. Inheritance/specialization versus complete self-contained definitions remains deliberately open pending more specimens. |
| Quote / Market Observation | existing `/v2/quotes`, `/v2/quotes/{symbol}` | Existing v2 surface requires reconciliation with Symbol/Instrument/Contract observation semantics; existence does not freeze the final model. |

### Account ledger and incremental broker evidence

For account history, the working semantic thesis is:

> **Broker evidence is the Account Ledger.**

The broker remains the source authority for brokerage activity it reports. Wheelwright backend durably retains the provenance-bearing broker evidence it has admitted and uses that accumulated evidence as the account ledger for history and lifecycle reasoning.

V2 MUST NOT require an operator to re-upload complete account history on every refresh. A recent overlapping activity export — ordinarily a practical window such as the last 30 days — must be sufficient when Wheelwright already retains older ledger history.

Newly admitted account-history evidence therefore **merges/reconciles with the existing ledger; it does not wholesale replace prior ledger history**. Overlap may contain already-known entries, genuinely new entries, or corrected broker evidence. Exact deduplication, correction, supersession, stable-entry identity, and reconciliation algorithms remain later design work, but the Product requirement is fixed: a partial recent-history upload must extend/reconcile retained history rather than truncate it.

Snapshots and Ledger have distinct jobs:

- a **Snapshot** represents broker-reported account state at an observation boundary;
- the **Ledger** accumulates broker-reported account activity/history over time.

Both are backend-retained broker evidence. Neither requires the client to remain the durable store.

### Position as the default decision subject

> **A Position is the default subject of a Wheelwright decision unless a concrete specimen demonstrates that the decision cannot truthfully use Position as its subject.**

A separate Decision Subject resource is not currently justified. The semantic phrase may remain useful in reasoning, but it does not earn independent REST identity without a falsifier.

This raises the burden on Position identity rather than creating a parallel abstraction. In particular, v2 must test whether separately governed quantities from one broker-reported holding can be represented as separate Wheelwright Positions without manufacturing brokerage holdings. The standing specimen is 250 SPY shares reported by the broker, with 100 governed under Growth Wheel and 150 governed under Buy & Hold.

Inventory Block remains only a candidate escape hatch if Position cannot faithfully represent that case.

### Contract relationships and Position

Contract is not an ontology gap. A market Contract exists independently of an account relationship to it and retains canonical identity whether it appears in a chain, market evidence, or an account Position.

For the current resource candidate, account-specific long/short quantity and obligation/holding meaning should preferentially be represented as the Position's relationship to the canonical Contract rather than by inventing an additional first-class Holding/Obligation Record resource.

A Position may therefore link to one or more canonical Contracts, with relationship data carrying the account-specific semantics required by the specimen. Exact relationship schema remains open.

### Economic Construction occurrence

A separate Realized Construction / Construction Occurrence resource is not currently justified.

Where a Position is authoritatively associated with a recognized Economic Construction, the preferred candidate is a relationship/hyperlink from the Position to the applicable construction definition, for example conceptually a Position representation linking to `/v2/constructions/SHORT_IRON_CONDOR`.

Wheelwright may pattern-match and present an operator-friendly hypothesis such as **Maybe Short Iron Condor** before authoritative association. Operator confirmation may establish the Position-to-construction association. No separate occurrence entity is required merely to record that association.

Inheritance/specialization versus independent self-contained construction definitions remains explicitly unresolved.

### Concepts that do not currently earn independent resources

The following meanings may remain useful ontology/domain vocabulary or representation fields, but they do **not** currently justify independent REST resource families:

- Holding / Obligation Record — prefer Position-to-Contract relationship semantics.
- Decision Subject — Position is the default decision subject.
- Purpose / Constraint / Preference — represent as Program/Regime/Position/evaluation semantics as specimens require; enums, strings, or structured fields are possible later representations.
- Construction constituent role — scoped relationship data, not a root resource.
- Pattern-recognition hypothesis such as `Maybe X` — derived/presentation-qualified finding, not a new domain identity.
- Broker/compliance operational-treatment taxonomy — out of current resource scope; operator confirmation is sufficient for the current Product need.
- Event / Event Observation / Event Assertion endpoint families — broker-history needs are represented through the Account Ledger; internal provenance/reconciliation distinctions need not become endpoint families.
- Recommendation / Preference Status — evaluation result, not independently resource-worthy.
- Realized Construction / occurrence — prefer Position-to-Construction association unless a later specimen earns separate identity.

### Open questions deliberately preserved

This ratification does **not** settle:

1. the exact identity/lifecycle rules for Position;
2. whether Inventory Block survives after Position specimens;
3. Symbol versus Instrument semantics;
4. whether Option Chain is an enduring resource or temporal observed view;
5. final Contract URI encoding/identifier;
6. final Quote/Market Observation placement;
7. Operating Regime representation after Position/Inventory reconciliation;
8. construction inheritance/specialization versus complete independent definition resources;
9. ledger entry schema, deduplication, correction/supersession, or persistence implementation;
10. request/response schemas, HTTP methods, OAS, persistence technology, or implementation decomposition.

## Next authorized action — superseding prior Doc 82 next action

> **Move from the ratified resource-design candidate to Wheelwright command discovery. Use the candidate resources as the semantic basis for operator-friendly command specimens, and allow command discovery to falsify or refine the candidate resource model before implementation design.**


---

## October 20, 2026 — Principal-directed Construction ontology refinement

**Standing:** Subsequent Principal-selected Product/ontology direction, superseding **only** this document's October 7 **candidate preference against separately identifiable Construction occurrences**. This is conceptual/resource-design reconciliation, **not** authorization for OAS, schema, code or operational changes. See `docs/discovery/construction-domain-cash-shares-snapshot-2026-10-20.md` and `docs/discovery/construction-ontology-uri-order-composition-checkpoint-2026-10-20.md` for the bounded Principal conversation and status; independently verified acceptance remains outstanding.

**Construction Model versus Construction Instance.** A Construction Model is a reusable, broker-neutral, declarative financial pattern: it specifies roles, relationships, constraints, supported recognition and financial composition. A Construction Instance is a particular account-scoped arrangement of actual financial constituents recognized against a model, associated with a particular Position. A model's structural match alone does not establish that distinct holdings belong to one Position: association is a separately justified, provenance-bearing domain claim (ADR-016). Operator-supplied structure labels are **not required**; a brokerage's labels/grouping can provide qualified evidence but cannot replace backend interpretation.

**Candidate independent instances now justified for continued design.** A Position may be associated with successive independently inspectable, **provisionally write-once** Construction Instances as its actual constituent composition evolves. Each instance has a canonical identity distinct from the reusable model and a related Account (`accountId`) and Position (`positionId`). Its model reference may identify the applicable definition URI without duplicative mandatory `modelVersion` state. Instance continuity does **not** silently determine Position continuity, lifecycle, inventory governance or source authority. Construction reassessment follows actual exposure changes; a Quote movement, passage of time or unfilled Order does not itself change held constituent composition.

**Recursive composition.** A Construction may bind primitive constituent quantities (cash, owned shares, signed option-contract exposure) or constituent subconstructions. Finite decomposition terminates at typed financial leaves; nested subconstructions are not automatically independent Positions. Binding quantities and relationships must preserve the Principal's **decomposition–recomposition invariant**: under equivalent assumptions, reconstituting the structure preserves quantity, source identity, attributable basis, consistent value, cash, history, collateral and payoff without manufacturing or double counting inventory/economics. Nonadditive measurements such as DTE or capital requirements retain their appropriate semantic aggregation rules. Cash and shares may be partitioned into separately meaningful Position quantities, reconciled to one underlying Account inventory.

**Collateral, protection and availability.** Collateral is a quantity-qualified, temporal, evidence-backed relationship between financial inventory and an obligation, not automatically an independent REST resource. Economic coverage, contractual protection, broker-enforced encumbrance and capital requirements are distinct. Unallocated is not automatically demonstrably unencumbered; availability requires positive evidence.

**Orders and the shared structural grammar.** Brokerage Orders are instructions, not held exposure; Executions evidence actual changes. The same reusable constituent-role and relationship grammar may describe an **Order's instructed composition** and a **Position's held Construction**. An Order can target a whole recognized Construction, a subconstruction or an exact constituent quantity **only when evidence justifies the association**. Actions (buy/sell/open/close), requested quantities, triggers, limits and order states retain Order semantics; they do not become held leaf quantities. This shared grammar is a **candidate generalization**, not yet independently falsified or a mandate for Order-specific Construction instance resources.

**Candidate REST distinction (not operative OAS):** `/v2/constructions` enumerates instances; `/v2/constructions/{constructionId}` represents an instance; `/v2/constructions/models` and `/v2/constructions/models/{modelId}` represent reusable definitions. Account is an explicit instance relationship and authorization/filtering scope, not necessarily a canonical URI segment. Exact verbs, payloads, model revision mechanics and persistence are left to subsequent engineering design.

**Historical reconciliation:** The prior “no separate occurrence justified” statement in the October 7 section above remains as a dated candidate precedent, **not the current design preference**. This October 20 refinement does not amend Doc 82's other open questions or replace ratified Operating Regime and semantic-coverage rules. `ASSIM-0002` remains PENDING; canonical Position identity/lifecycle remains unresolved. Strategy implementation and margin remain outside this scoped Construction exercise. Independent architectural verification is required at the next substantive acceptance/stopping point and has not occurred through this document edit.
