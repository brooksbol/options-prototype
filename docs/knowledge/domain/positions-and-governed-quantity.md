# Positions and Governed Quantity

**Maintained subject owner** for **Position** and **Governed Quantity** (ADR-023 D1).
**Category:** A, bounded to the already-established meaning of these two subjects. This page integrates and routes to the authorities below. It does not ratify candidate semantics, promote candidate URIs, supersede supported contracts, or authorize implementation.
**Established:** October 19, 2026 (4AM first knowledge-assimilation slice). The open identity question is obligation `ASSIM-0002` in [`../../assimilation-obligations.md`](../../assimilation-obligations.md).
**Related subjects:** [Accounts and Operating Regimes](accounts-and-operating-regimes.md).

---

## Short answer

- **Position** is the **default decision subject** in Wheelwright's v2 resource-design *candidate*. A decision is about a Position unless a concrete specimen shows it cannot truthfully be. There is **no ratified universal Position identity.** The word must not silently mean one thing spanning broker holdings, display rows, governance scopes, constructions and lifecycle continuity.
- **Governed Quantity** is an explicit quantity or inventory scope under authoritative governance. **Ownership, governance and availability are separate conclusions.** Owning shares does not make them governed, and governed shares are not necessarily available.

---

## Position

<a id="position"></a>


### October 20 Construction reconciliation — scoped subsequent direction

*Standing: Principal-selected working Product/ontology direction in Doc 82's October 20 addendum; independent falsification still pending, and no operative OAS or implementation authorization follows.*

The October 7 candidate above (“construction occurrence is not a separate entity”) is **historical**, and has been superseded **for the Construction resource-design candidate only**. The subsequent Principal direction distinguishes reusable declarative **Construction Models** from actual **Construction Instances** associated with a Position and Account. The latter are independently inspectable, **provisionally write-once** composition states so a Position may link to its earlier and current Construction instances; changes to held constituents can create another instance. A Position's own stable identity and transition/termination semantics remain **unresolved** under `ASSIM-0002`.

A Construction can recursively bind typed financial constituent quantities (cash, long shares and option exposures) or nested Constructions, with a finite leaf boundary and decomposition/recomposition preservation of quantity, traceability, attributable economics, history, collateral and payoff. Subconstructions are not automatically separately managed Positions. A structural match does **not** independently establish constituent membership (ADR-016). Cash/share partitions remain reconciled against actual Account inventory without double counting. Collateral is an evidence-qualified quantity relationship, not automatically an endpoint; availability cannot be inferred merely from residual quantity.

Orders remain independently meaningful brokerage **instructions** and Executions evidence realized changes. A *candidate shared structural grammar* can represent both Position-held constituent composition and an Order's proposed action composition, with any Order-to-Position/Construction association independently evidenced and qualified. No unfilled Order changes held inventory merely by existing.

Current **candidate** URI distinction: `/v2/constructions/{constructionId}` denotes an actual instance; `/v2/constructions/models/{modelId}` denotes a reusable declarative model. Instance `accountId` and `positionId` are relationships/fields, not mandatory nested URI structure. Exact model revisions, schema, algorithm and lifecycle design remain engineering work. Historical model interpretation must remain reproducible. No strategy or margin implementation is implied.

See [Doc 82 October 20 Construction addendum](../../82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md#october-20-2026--principal-directed-construction-ontology-refinement) and [checkpoint](../../discovery/construction-ontology-uri-order-composition-checkpoint-2026-10-20.md). An independent actor must still falsify this reconciliation before declaring the foundational domain accepted.

### Current meaning

*Standing: Principal-ratified v2 resource-design candidate, October 7, 2026 (Doc 82). "Resource/semantic authority for the candidate model; not implementation authority."*

> A Position is the default subject of a Wheelwright decision unless a concrete specimen demonstrates that the decision cannot truthfully use Position as its subject.

What that candidate establishes:

- A separate *Decision Subject* resource is **not** currently justified. Position carries that role.
- **Position → Contract.** A market Contract exists independently of any Account. Account-specific long/short quantity and holding/obligation meaning should preferentially be the Position's relationship to the canonical Contract, not a separate Holding/Obligation resource. Contract existence alone does not establish that an Account owns a Right or bears an Obligation.
- **Position → Economic Construction.** An authoritative association links a Position to a construction definition (for example a short iron condor). A pattern match such as "Maybe Short Iron Condor" is a presentation-qualified hypothesis. Operator confirmation may establish the association. A construction occurrence is not a separate entity.
- **Burden on identity.** v2 must test whether separately governed quantities from one broker-reported holding can be separate Wheelwright Positions **without manufacturing brokerage holdings** (the 150/100 SPY specimen below).

What is **not** established (Doc 82 "Position versus governed scope" and "Open questions deliberately preserved"):

- the exact identity and lifecycle rules for Position (open question 1);
- whether Inventory Block survives as a separate concept (question 2);
- Operating Regime representation (question 7);
- schemas, HTTP methods and persistence (question 10).

The candidate URI `/v2/accounts/{account}/positions/{position}` is a **design candidate, not an operative contract**. Later Doc 77 guidance prefers independent canonical routes with Account relationships in representations. Route shape is not settled by this page.

<a id="unresolved-position-identity"></a>

### Unresolved: Position identity

No authority defines one Position identity that spans all of these:

| Meaning | What establishes it | Is it "the Position"? |
|---|---|---|
| Broker-reported holding/obligation in an Account | Broker evidence (Positions export, snapshots) | Evidence of ownership/obligation, not Wheelwright governance |
| Row in `ww positions` output | Presentation of authorized Account inventory | Display, not canonical identity |
| Governed scope (quantity under a Program/regime) | Authoritative governance act | See [Governed Quantity](#governed-quantity) |
| Economic Construction occurrence | Constituents + authoritative association | Association, not identity |
| Lifecycle continuity (opening → close/assign/expire) | Transaction evidence under a completeness premise | Only bounded for short-option cohorts (ADR-022) |

This is tracked as **`ASSIM-0002` (PENDING)**. The resolver is the Principal (Product meaning), with independent Codex falsification of any proposed identity model. Nothing here resolves it.

### Accepted behavior versus realization

| Claim | State | Evidence |
|---|---|---|
| `ww positions`: single table of authorized Account Position inventory | **Principal-accepted installed behavior on October 15, 2026**, at the runtime recorded in that acceptance. Accepts the bounded display, *not* new financial/domain semantics or managed-Position monitoring | [`../../cli/ww-positions-command-2026-10-15.md`](../../cli/ww-positions-command-2026-10-15.md) |
| Human Positions table with POSITION/CONTRACT split, PURPOSE, STATE, COLLATERAL, allocation rows | **Accepted as a future presentation target** (Oct 17 mocks). Not implemented. Mock collateral conclusions are not backend-verified | [`../../cli/ww-positions-human-presentation-2026-10-17.md`](../../cli/ww-positions-human-presentation-2026-10-17.md) |
| Aggregate share ownership from the broker Positions export (v1) | **Accepted decision** (ADR-020); implemented in v1 | `../../07c-adrs.md` ADR-020 |
| Position monitoring: Contract State vs Decision Pressure vs Economic Consequence | **Accepted decision** (ADR-013) | `../../07c-adrs.md` ADR-013 |
| Universal SDK Talk tactical inventory, stale Fidelity custody, qualified terminal geometry and exact Account-plus-underlying scope | **Principal-accepted candidate behavior October 29, 2026** at runtime `4f67412c` (8821), after independent scope/source acceptance. Source-cut display contexts do not create Positions, governed membership, opening continuity or cash-secured status; terminal value is not P/L. No production deployment accepted by this event | [Acceptance and closeout](../../reviews/sdk-talk-account-underlying-selection-2026-10-29.md#principal-acceptance-and-end-of-session-closeout); [geometry source/review](../../reviews/sdk-talk-fidelity-share-call-geometry-2026-10-29.md) |
| What is installed or running today | **UNKNOWN.** No current installed/running witness is part of this page | — |

---

## Governed Quantity

<a id="governed-quantity"></a>

### Current meaning

A **Governed Quantity** is an explicit quantity or inventory scope placed under authoritative governance (an Operating Program/regime) by an authoritative act. It is the unit a governed decision is about.

Established rules:

1. **Membership is an authoritative association.** It is never a conclusion from economic construction, brokerage evidence, Account co-location, symbol equality, writable geometry or a strategy-like label. It does not extend to other same-symbol inventory, future inventory, other Accounts or the whole Account. *Principal-ratified* — Doc 69 "Membership semantic" (Assignment-Centric Wheel v1).
2. **The decision subject is scoped.** For MVP 1 it is *identified account + underlying + governed quantity + applicable Growth Wheel context*. Ticker, account type, owned quantity, prior Wheel activity or chain availability alone do not establish membership or the governed quantity. *Principal-ratified MVP 1 Solution Overview* — Doc 81 §27.3.
3. **Ownership, governance and availability are separate conclusions.** The ratified MVP 1 capability decomposition (Doc 81 §28) keeps these independently establishable:
   - a Program association can be known while current ownership is not established;
   - ownership can be established while governance is unresolved;
   - unencumbered **availability requires positive evidence**. Absence of an observed conflicting claim does not establish absence of conflicting claims (§27.4).
   Failure to establish one conclusion must not erase the others.
4. **Feasibility is scoped to the governed quantity.** With 99 governed shares, one ordinary covered call is not feasible. Wheelwright must not silently borrow another share elsewhere in the Account (Doc 81 §28.5, Principal-ratified).
5. **Generic cash is not automatically governed.** A capital recommendation operates only on capital legitimately within the applicable governed scope (Doc 64, Principal-accepted thin-slice contract).

### Standing specimen: 250 SPY as 150 + 100

> One account owns 250 SPY shares; 150 shares may be governed BUY AND HOLD; 100 shares may be governed GROWTH WHEEL. (Doc 81 §3, Oct 6, 2026)

**Original decision context.** The specimen arose in operator-journey discovery. The question was "How do I get the most work out of these shares?" Discovery found that the answer depends on regime, so it cannot apply "silently to every share of a symbol in the account" (Doc 81 §3, Category D discovery). Doc 82 then ratified the consequence: one Account may contain separately governed quantities under different regimes. It made the specimen the standing test for Position identity: can 100 and 150 be separate Positions without manufacturing brokerage holdings? (Doc 82, Principal-ratified candidate). The broker still reports **one** aggregate holding of 250 (consistent with ADR-020's aggregate-ownership evidence role).

Consequences:

- Owned quantity (250) can exceed any one governed quantity (100 or 150).
- A Growth Wheel call decision concerns the 100, not the 250.
- How the two scopes are *identified* is open (`ASSIM-0002`).

### Option cohorts (ADR-022)

<a id="option-cohorts"></a>

*Principal-ratified Sept 28, 2026; scope: existing short-option obligations in Assignment-Centric Wheel v1, not a universal brokerage lifecycle model.*

- An attachable short-option subject is an **opening-anchored cohort** with an explicit whole governed quantity `Q`, a brokerage Account, option-series geometry, establishment evidence and an opaque governance identity. Account plus option series identifies neither the economic occurrence nor its continuity.
- **Additional identical-series openings never inherit membership.** Full exhaustion ends current applicability. An identical reopened option cannot revive the old cohort; it is ungoverned until a new authoritative act.
- The original `Q` may remain a governed proper subset of a larger aggregate if no event can have reduced it. An ambiguous reduction after mixing fails closed. A known partial survivor's residual applicability is `POLICY_UNDEFINED`.
- Continuity requires an accepted completeness premise over the relevant history, plus reconciliation. Missing completeness fails closed.
- Partial attachment, share-block identity and the technical evidence-admission design remain open. The existing series-key `ATTACH TO…` implementation does **not** conform merely because it persists an association.

---

## Source-to-consequence mapping

| Source | Decision standing | Concern / version | Surviving meaning | Maintained destination | Changed interpretation | Dependent consequences | Open obligations |
|---|---|---|---|---|---|---|---|
| Doc 82 resource-design candidate (Oct 7, 2026) | Principal-ratified candidate; not implementation authority | v2 resources | Position = default decision subject; Position→Contract and →Construction relationships; identity open | [Position](#position) | None. Candidate standing kept visible | v2 OAS/contracts must not treat candidate URIs as operative | ASSIM-0002 |
| Doc 82 "Position versus governed scope" | Principal-ratified reconciliation | v2 ontology | No silent universal Position identity | [Unresolved: Position identity](#unresolved-position-identity) | None | `ww positions` rows ≠ canonical identity | ASSIM-0002 |
| Doc 81 §3 (Oct 6, 2026) | Category D discovery | v2 discovery | 250 = 150 B&H + 100 Growth Wheel specimen | [Standing specimen](#standing-specimen-250-spy-as-150--100) | Original discovery context preserved; consequence now ratified via Doc 82 | Accounts page short answer | ASSIM-0002 |
| Doc 81 §27–28 (Oct 7, 2026) | Principal-ratified MVP 1 Solution Overview and capability decomposition | MVP 1 | Scoped decision subject; ownership/governance/availability separate; 99-share infeasibility | [Governed Quantity](#governed-quantity) | None | — | — |
| Doc 69 "Membership semantic" (Sept 27, 2026) | Principal-ratified | Assignment-Centric Wheel v1 | Membership is authoritative association only | [Governed Quantity](#governed-quantity) | Partially refined by ADR-022 for short-option cohorts | — | — |
| ADR-022 (Sept 28, 2026) | Accepted (Principal-ratified) | Wheel v1 short-option obligations | Opening-anchored whole-`Q` cohorts; no inheritance on reopen | [Option cohorts](#option-cohorts) | None | Series-key ATTACH non-conformance stays visible | — |
| ADR-020 (Sept 24, 2026) | Accepted | v1 ownership evidence | Broker Positions export is authoritative aggregate ownership | [Accepted behavior](#accepted-behavior-versus-realization) | Scoped as ownership evidence, not governance | — | — |
| `ww positions` acceptance (Oct 15, 2026) | Principal-accepted installed behavior at a recorded runtime | v2 CLI presentation | Single-table authorized inventory display | [Accepted behavior](#accepted-behavior-versus-realization) | Display, not identity | Current install state UNKNOWN | — |

## Open questions (not settled here)

- Position identity and lifecycle; Inventory Block survival; regime representation (`ASSIM-0002`).
- Partial attachment, residual membership after reduction and share-block identity (ADR-022 boundary).
- Exact Position→Contract relationship schema (Doc 82).
- Construction inheritance versus self-contained definitions (Doc 82 question 8).


### October 29 descriptive contractual charts — Principal direction

For identical qualified contracts, quantities and market observations, contractual terminal geometry and option moneyness are independent of Operating Regime and whether assignment is desired. Principal: “it's simpler than that. it's ITM vs OTM” and “this is good. this doesn't require the regime, i.e, whether assignment is desired”. Objective contract facts/native descriptive visualization are distinct from regime objectives and future regime-aware decisions. ITM/OTM imply neither profit/loss nor desirability/assignment outcome; exact strike boundary does not establish a near-ATM tolerance. Unsupported adjusted/deliverable/spot facts remain unavailable. Terminal value is not current P/L, and opening/continuity/basis claims retain their own requirements. [Design/implementation/review standing](../../reviews/sdk-talk-tactical-moneyness-2026-10-29.md) records the bounded candidate; this direction does not accept its runtime, resolve ASSIM-0002 or grant trading/deployment authority.
