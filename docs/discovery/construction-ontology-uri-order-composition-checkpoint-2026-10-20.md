# Construction ontology / URI / Order-composition checkpoint — October 20, 2026

**Status:** Principal-requested **Category D checkpoint**, not independent verification, final ratification, OAS contract, schema, or implementation authorization.
**Scope:** Conversation decisions and candidate refinements since `docs/discovery/construction-domain-cash-shares-snapshot-2026-10-20.md`. Paused at Principal instruction: “let's do a checkpoint here. remember, we'll need independent verification on all of this when we reach a stopping point”.
**Baseline:** Previous snapshot `b33c390c19c3fefff3ca707722de9caf1bf97d5b`; governing Doc 82, maintained `docs/knowledge/domain/positions-and-governed-quantity.md`, ADR-016; `ASSIM-0002` PENDING. This checkpoint preserves scoped Principal statements as conversation evidence; it does not silently supersede governing text.

## Principal-established working direction

- **A Position has a Construction**, including CASH and LONG_SHARES. Position is a composite domain subject but need not own underlying facts. Exact enduring Position identity/lifecycle remains open.
- **Two distinct Construction resources**: a reusable, declarative Construction Model used for pattern matching, and an actual account-scoped Construction instance associated with a Position. The proposed canonical URI surface:
  - `/v2/constructions`: collection of **instances**, not model definitions.
  - `/v2/constructions/{constructionId}`: particular realized instance.
  - `/v2/constructions/models`: model collection.
  - `/v2/constructions/models/{modelId}` (e.g. `IRON_CONDOR`): reusable recognition/composition rules.
- **Account is a field/relationship** of an instance (`accountId`) for scope, grants and filtering, not an Account segment of the canonical Construction URI. Indexing is an implementation detail.
- **Instances are probably write-once**, the Principal's stated candidate. Material change in constituent structure would produce a new instance, permitting inspection of Construction evolution during a Position's lifetime. Do not treat an unfilled Order, passing time, or Quote tick as necessarily changing held composition. No universally ratified Position-lifecycle rule follows.
- **Model identity is through a URI**; any revision can be expressed by model URI identity if needed. Do not require both a model URI and separate `modelVersion` machinery.
- **Recursive composition**: Construction instances may comprise typed primitive leaves (cash, long shares, signed option-contract exposures) **or subordinate Constructions**. Subconstructions do not automatically become separate Positions. All decompositions and recompositions must preserve financial/semantic meaning, not only quantity.
- **Orders remain distinct financial-domain objects and lifecycles.** Principal proposed that a stop/closing Order may be describable as a composite of the **same structural vocabulary** as its held target. Candidate clarification: a held Position binds actual exposures while an Order binds instructed buy/sell/open/close actions; shared pattern rules may recognize their correspondence. An Order is not held inventory; Orders do not change exposure absent executions. Whole-Constructions, nested Constructions or leaves may be targets only where supported by actual relationship evidence.
- **Collateral** remains a rigorously defined ontology/domain relationship, not automatically its own REST collection. Quantity allocation, economic coverage, contractual protection, broker-imposed requirements and verified encumbrance are different assertions.
- **Experience boundary**: `ww positions` is comprehensive inventory; `ww live` is options-focused, compact Unicode narrative modeled on `tt live`; agentic clients inspect deeper evidence and links. Domain completeness never implies display completeness. No Strategy implementation or margin in this slice.

## Governing ontology discrepancy identified, not silently settled

`docs/82-v2-ontology-resource-semantic-coverage-reconciliation-2026-10-07.md` October 7 resource-design **candidate** says a separate Construction occurrence resource was not justified and prefers Position-to-definition. The maintained Position owner repeats that older candidate. The new proposal earns distinct identity from independent historical inspectability, write-once composition states, and a Position's evolving construction.

**Principal authorization:** Explicitly selected **Option A** to perform focused ontology reconciliation covering Construction Models, instances, recursive composition and shared Order composition. A preceding attempt was interrupted for this checkpoint. **This record does not attest that the normative ontology/owner edits have been completed.** Reconcile their older candidate language with the newer Principal direction, preserving source standing, rather than overwriting history without context. Do not close `ASSIM-0002`.

## Domain acceptance invariants carried forward

1. Model definition and bound instance identities must not be conflated.
2. A common option-leg geometry is not by itself proof of common Position membership; authoritative, provenance-bearing association controls.
3. Finite recursive decomposition to typed leaves, no cycles, no duplicate ownership or economics.
4. Recomposition preserves quantity, identity/provenance, attributable basis, market value, cash, history, collateral associations and payoff under equivalent assumptions; nonadditive DTE/risk/capacity require proper semantics.
5. Collateral and protection are relationships, not fictitious inventory constituents; allocated versus unallocated versus positively proven free states remain distinct.
6. Order structure is instructions; held construction is exposures; actual fills are evidence of resulting change.
7. Model and instance representation must be account-authorized and broker-neutral without CLI inference.

## Explicit verification requirement and stopping rule

**Independent verification is REQUIRED at the next substantive stopping/acceptance point, before claiming this foundational side of the domain is validated.** An actor independent of the authors (Codex/Kiro review separation as appropriate) must cold-bootstrap from remote main, recover current authorities without using this checkpoint as proof, falsify definitions and reconciliation through actual `tt live` and Fidelity evidence, and report contradictions, insufficiency, authority standing, and gaps. Repository existence and author's self-check are **persistence verification only**, not architectural independence or Product acceptance. Any material discrepancy returns to the Principal; engineering implementation remains outside this checkpoint's authorization.

**Resume point:** Finish the authorized **focused ontology + maintained-owner reconciliation** under the established documentation workflow, then continue semantic design of Order-to-Construction bindings one point at a time; do not broaden into universal trading engine, web UX, margin or Strategies. When a bounded stopping point is reached, commission and actually obtain the independent falsification, not merely suggest it.
