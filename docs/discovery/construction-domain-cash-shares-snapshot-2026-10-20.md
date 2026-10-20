# Construction domain — Cash and Long Shares checkpoint (October 20, 2026)

**Status:** Principal-requested bounded **Category D snapshot** of the current conversation's accepted working Product model and still-candidate generalization. Not an ADR, implementation contract, API change, or universal Position-lifecycle ratification.  
**Snapshot boundary:** Captures learning **through Cash and Long Shares**, before the four single-option Constructions. No margin; Strategy implementation outside scope.  
**Recover by subject:** Construction; Position; Cash; Long Shares; Collateral; decomposition/recomposition. Governed Position identity remains unresolved in maintained knowledge (`docs/knowledge/domain/positions-and-governed-quantity.md`, `ASSIM-0002`).  
**Existing precedents:** Doc 82 ontology resource candidate; accepted `docs/cli/tt-live-panel.md` experience and `docs/design/ww-live-product-plan-2026-10-16.md`; `docs/design/position-payoff-visual-contract/README.md` strategy-dropdown vocabulary. This checkpoint does not revise those sources or promote unratified candidate URIs.

## Principal framing and scope

The Principal's stated goal is to **define the domain concepts, ontology guardrails and independently meaningful composable resources**; Codex and Kiro are responsible for selecting algorithms, implementation, persistence, contract representation and tests. Working architecture: **Experience → WW Client → v2 API → backend domain logic → data sources**. Brokerage-specific normalization preserves original evidence; broker-neutral domain interpretation recognizes constructions and composes Positions. Existing WW v1 and `tt live` are feasibility precedents, not universal proof of each supported brokerage or case.

Principal framing: “if you can tell the right story in unicode, you can tell that same story anywhere else.” CLI-first `ww live` is deliberately low-data/high-storytelling and options-focused, with brokerage-neutral v2 backend authority; `ww positions` depicts complete inventory; agentic clients need richer qualified facts and relationships. **Domain completeness does not mandate rendering every fact in any one client.**

Strategy and Operating Regime relationships remain in the ontology, while Strategy implementation is excluded. **Margin is explicitly deferred** to make simple cash-and-fully-owned-share cases tractable without margin borrowing/coverage rules.

## Agreed working ontology

- **“Every Position has a Construction,” including Cash and Long Shares.** A Position is an Account-specific compositional economic subject, not automatically a brokerage holdings row or a CLI display row. The exact globally enduring Position identity and lifecycle are still unresolved under `ASSIM-0002`; this agreement does **not** silently close it.
- A **Construction definition** is reusable, broker-independent and declarative: it identifies constituent roles, constraints, relationships and the financial derivations that can be supported. A Position binds its actual constituents and qualified evidence. Constructions may be simple (Cash, Long Shares) or composite (options and associated inventory). No generic rules-engine technology is mandated.
- **Collateral** is strictly an ontology/domain relationship between a quantity of inventory and an obligation it secures. Identify quantity, sources, obligation, Account, applicability, provenance, and coverage/encumbrance separately. Collateral does **not** automatically earn a top-level `/v2/collateral` resource. Contractual risk protection, inventory collateral, and broker capital requirement are distinct concepts.
- Origination matters: a coordinated Buy-Write is not simply equivalent in history/formation to an overwrite covered call, even with identical current legs. Roll continuity, original share cost basis, per-contract basis and cumulative option economics are distinct historical questions; their presence in domain model does not require their display in `ww live`.

### CASH — approved working specimen

Principal endorsed the following partition of a **single** $20,000 Account USD cash inventory into **three separately meaningful Cash Positions**, not three brokerage balances:

| Cash Position | Construction and supported role | Amount |
|---|---|---:|
| Cash A | `CASH`; verified unencumbered | $12,000 |
| Cash B | `CASH`; allocated collateral securing CSP #1 | $5,000 |
| Cash C | `CASH`; allocated collateral securing CSP #2 | $3,000 |
| **Recomposed Account cash** | | **$20,000** |

Cash B/C have explicit relationships to the relevant short-put obligation Positions. “Unencumbered” for A is an **assumption of affirmative evidence in this specimen**; a residual $12,000 lacking proof of availability must be labeled unallocated/unknown instead. Allocation conserves inventory; it does not manufacture deposits.

### LONG_SHARES — approved analogous specimen

Principal stated that the 300-share example is a **confirmation of the model's meaning**, not an invitation to invent extra Position semantics:

| Share Position | Construction and supported role | Quantity |
|---|---|---:|
| Shares A | `LONG_SHARES`; 100 shares securing Covered Call #1 | 100 |
| Shares B | `LONG_SHARES`; 100 shares securing Covered Call #2 | 100 |
| Shares C | `LONG_SHARES`; verified unencumbered | 100 |
| **Recomposed brokerage inventory** | | **300 shares** |

One brokerage holding observation may support three different Wheelwright Position quantities without creating three brokerage holdings. Collateral relationships don't create or remove shares. Actual free status needs affirmative evidence; absence of observed allocation doesn't prove freedom.

## Principal-selected core invariant: decomposition AND recomposition

Principal: “the real test is once a structure is decomposed, it should be recomposed and the math still works”; “the math is just one dimension. that list of other attributes/dimensions is good to go with for now.”

**Construction Decomposition–Recomposition Invariant (accepted working scope):** Decompose a Construction into constituents, allocations, relationships and attributable financial effects; recomposing under the *same source evidence, attribution and valuation assumptions* must preserve semantic and financial meaning. No created/lost/duplicated inventory, silently reassigned economics, or broken provenance.

Initial dimensions accepted as sufficient **for now**:

| Dimension | Preservation criterion |
|---|---|
| Quantity | Allocations + residual reconcile to original inventory |
| Identity | Source constituents remain traceable |
| Cost basis | Attributable allocated and residual basis reconcile when known |
| Market value | Consistent aggregate under identical valuation conventions and observation time |
| Cash | Account cash totals survive partition/recomposition |
| History | Source Transactions, Orders, Executions and continuity relations are neither lost nor duplicated |
| Collateral | Encumbrance/association and exact allocated quantities survive without double-counting |
| Payoff | Reconstructed aggregate economic/payoff function is equivalent for compatible terms and horizon |

Not all properties are additive: DTE, risk and capacity may require their own construction-qualified aggregation logic.

## Recognition guardrails and still-open design pressures

- Structural compatibility (option rights, direction, strikes, expiration, quantities) is different from evidence-supported **common managed Position membership**. No automatic grouping from a nice geometric match.
- Broker grouping and labels can be useful evidence; backend recognizer must work with normalized evidence when labels are absent, and qualify conflict, incomplete coverage, ambiguity or unsupported cases.
- Cash/share allocation requires exact quantity conservation. **Unallocated ≠ proven unencumbered**. Economic coverage ≠ broker-enforced encumbrance.
- Reusable construction-recognition rules and Position composite details are candidates; exact rule language, identity/versioning, algorithm, data storage, HTTP shapes and migration belong to the subsequent technical design. `/v2/constructions` is a candidate resource family, not operative OAS.
- The broader dropdown inventory previously recovered: Option, Covered, Vertical, Calendar, Butterfly, Ratio Spread, Strangle, Straddle, Iron Condor, Jade Lizard, Stock; plus Cash and concrete variants (CSP, Buy-Write, Protective Put). The screenshot is taxonomy/visual reference only, not financial definition authority.
- This checkpoint stops **before** the rigorous `LONG_CALL`, `LONG_PUT`, `SHORT_CALL`, `SHORT_PUT` specifications.
- Don't silently ratify globally unique Position occurrence/lifecycle, collateral treatment for margin Accounts, source incompleteness resolution, or strategy behavior.

## Explicit standing / handoff

**Principal-confirmed working meanings:** every Position has a Construction; Cash and Long Shares can be separately allocated into multiple Positions against a single underlying Account inventory; quantity conservation and **recomposition** are central; collateral must be rigorously defined; margin deferred; strategies conceptually related but implementation excluded; domain depth is independent of CLI presentation.

**Candidate to be evaluated before API ratification:** general Construction-definition representation and `/v2/constructions`; generalized recognition predicate taxonomy; exact Position instance resource/lifecycle, rich agentic representations.

**Assimilation status:** Construction and Collateral do not currently have separate maintained subject owners listed in `docs/knowledge/README.md`. This checkpoint intentionally preserves provisional Product direction in the established Category D discovery route, **not** by depositing it into Doc 77 or pretending an unsourced `ASSIM-*` obligation has been formally created. Later sanctioned ontology/owner reconciliation is required before considering the topic canonically assimilated. Existing `ASSIM-0002` remains PENDING.

**Next topic:** Four single-option Constructions, simplest first; first resolve their necessary identifying characteristics and how coverage/collateral qualifiers relate without designing margin.
