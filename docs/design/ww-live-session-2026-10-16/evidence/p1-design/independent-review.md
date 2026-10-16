# Independent architectural/API review — P1

**Disposition: REJECT as a complete implementation-ready design.** The proposed resource placement, backend ownership and retained-only boundary are sound. The blocking issue is the absence of a reviewable affirmative evidence path for the promised structural result, together with an unspecified affirmative occurrence-identity contract. This is a design-evidence rejection, not proof that retained operational evidence can never support a condor.

## Identity, scope and authority

Independently verified advertised remote main: `7ae274cbb0ad0ce77f21440b0c390558913f61e8`. Reviewed its exported `baseline/`; references below to repository files resolve within that baseline.

Frozen proposal SHA256: `f72c0aeefbe9b346f3ed2335ee9edda655c877ffe042290b7fb20affffbdf374`.

Frozen complete account OAS SHA256: `0ece216c1a6c2735940b8f203918298d3bffc22d69b940cb8a4e65095e0ad03e`.

Structural schemas SHA256: `c66782a7dcc4104cadda97b27dedf36a6a1d523e3145406792c3bfa3f0168604`.

Authority root: `docs/README.md`; applicable final Product supersession: `docs/design/ww-live-product-plan-2026-10-16.md:53`. Gate state remains STAGED, experiment_started false, mutation_permission INACTIVE (`docs/experiments/ww-gate-experiment-001-state.yaml:3`). This assignment is independent design review only. No implementation, source remediation, brokerage request, operational evidence/DB/service access, credentials/config or grant action was performed. Only this report was written. The isolated laboratory candidate was not changed or treated as accepted Product.

## Findings

### R1 — High / blocking: no concrete admissible source-to-condor path has been specified

P1 requires all of verified current association, conserved allocations and complete effective physical terms before a positive payoff; it expressly rejects symbol encoding and multiplier=100 as proof of deliverables (`proposal.md:57`, `:67`, `:71`, `:73`). Those are good constraints. But the design defers determining whether any named source can satisfy them until after the projection skeleton is implemented (`proposal.md:195`–`:196`) and leaves actual-source sufficiency unverified (`:212`). Its milestone nevertheless requires an actual retained evidence-established condor (`:203`).

The recovered code demonstrates storage and ingestion paths, not that affirmative path:

- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/PositionSnapshot.java:17`–`:22` stores observed holdings and associations of holding IDs, label, program and free-text authority; it has no deliverable/exercise terms or recorded authenticated assertion-authority provenance.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/FidelityPositions.java:85`–`:93` validates IDs, nonblank text and nonoverlap. This does not decide which historical assertions meet P1's new “traced sufficiently” admission test.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/ImportPositionSnapshot.java:18`–`:29` accepts a local association file and persists an associated snapshot after import. That is a genuine reusable intake, but P1 does not specify which preserved facts establish the authority it now requires; the file's authenticated authorship is not retained by this record.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/TastytradeHoldings.java:119`–`:139` parses encoded option expiry and signed quantity, then constructs a snapshot with empty associations. Optional raw fields are recoverable, but neither this parser nor P1 supplies a source-specific complete-terms admission rule.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/PositionMarketEvidence.java:33`–`:40` recovers bid/ask, margin and quantity from Option Summary; `:74`–`:79` recovers explicit root-to-share identity. Those are useful bounded facts, not full deliverable/exercise or current managed-allocation proof.

**Concrete falsifier:** give the interpreter an accepted whole-holding four-leg association, ordinary-looking OCC symbols and multiplier=100, with no independently evidenced deliverables/exercise consideration. Correct P1 behavior is UNKNOWN terms and no curve. The same holds for a matching unassociated tastytrade inventory. The proposal supplies no lineage-preserving positive input that differs in the decisive evidence. Consequently an implementation that returns only unknowns can obey its safety clauses while missing its named first useful outcome.

**Evidence required to close:** before handing the affirmative interpreter to implementation, identify one admissible source form and field-by-field semantic rule, with an inspectable sanitized lineage-preserving positive source specimen and its expected domain/HTTP result; include the near-identical negative specimen missing the decisive evidence. Explain which current association records are admissible and why. Actual operational confirmation can remain a later acceptance condition; no live acquisition is required for this design proof. If no existing source form suffices, report the precise gap and the bounded next contract needed, rather than approving an unspecified future evidence path. This follows the early continuous proof obligation at `docs/mandates/product-first-continuous-engineering-2026-10-13.md:16`–`:20`.

### R2 — High / blocking for the affirmative identity/continuity branch: anchors and temporal admission are requirements, not a bounded algorithm/contract

P1 describes occurrence/construction anchors and promises timestamp backfill without identity change, attributable partial closure, new identity on replacement and no old-ID revival (`proposal.md:45`–`:50`). It does not identify the admissible anchor representation, anchor selection/canonicalization, evidence boundary for a multi-fill opening, or the supported interval/endpoint rule that can establish those claims. It correctly concedes ordinary history has no completeness/finality premise (`:135`–`:137`), so “use evidence-supported bounded anchors” at `:198` is not yet an affirmative technical contract.

**Concrete falsifier:** one opening is initially represented by fill B; an earlier fill A from the same opening is later retained. Hashing the earliest fill or the full opening-fill set changes the proposed identity; hashing a provider order alone silently assumes occurrence/placement semantics the design has not admitted. P1 rules out the bad results but does not specify a supported stable anchor that produces the good result. A separate case—an indistinguishable reduction after two same-series openings—likewise needs a declared allocation/ordering proof, not endpoint net equality.

A closer accepted precedent was not carried through the reuse proof. Doc 70 contains a **later accepted replacement Solution Design**, `docs/70-bounded-option-obligation-continuity-checkpoint-2026-09-28.md:53`–`:74`, following the rejected candidate. It specifies exhaustive row admission, conservative time envelopes, a quiet endpoint cut and an explicit completeness premise. There is existing backend implementation: `evidence-service-java/src/main/java/com/wheelwright/evidence/continuity/ContinuityEngine.java:13`–`:47`, `:55`–`:75`; scoped premise and endpoint inputs are in `evidence-service-java/src/main/java/com/wheelwright/evidence/continuity/ContinuityInputs.java:20`–`:49`. P1's component reuse table (`proposal.md:182`–`:188`) does not recover these components or explain their reuse/extension limits; its source index points to Doc 70's rejected-design discussion (`:223`).

**Evidence required to close:** map the existing accepted admission/cut/anchor mechanisms to the new purpose, explicitly separating reusable evidence discipline from ADR-022's nonreusable Program/full-Q applicability policy. Then define and falsify one supported affirmative anchor/continuity lane, including correction/backfill, partial reduction, replacement and close/reopen. Alternatively bound P1 to current snapshot structure with occurrence/opening explicitly unavailable and defer affirmative occurrence interpretation through a separately reviewed extension. This is not a demand for a universal lifecycle engine or for importing whole-Q policy.

### R3 — Medium: strategy quantity is an undefined domain value

The Product requires quantity inside CONTRACT (`docs/design/ww-live-product-plan-2026-10-16.md:62`, `:68`) while retaining nonstandard actual construction (`:71`). The draft's `StructuralUnits` (`proposed-account-evidence.openapi.json:4324`–`:4399`) supplies a qualified positive integer but no unit definition. P1's exact total payoff correctly uses allocated leg quantities, yet neither the prose nor schema defines the displayed package unit for unequal ratios, asymmetric partial closure or a single residual.

**Concrete falsifier:** for verified leg quantities `+2/-2/-4/+2`, a service could return units=1 (one managed construction), units=2 (two primitive ratio packages) or UNKNOWN. All fit the written field contract and imply different `SYMBOL ×n` conclusions. Define the semantic unit and when it is unavailable, and provide normal, ratio and partial-close examples. This is backend domain meaning, not client arithmetic.

### R4 — Low / contract cleanup: operation prose contradicts its new view

`proposed-account-evidence.openapi.json:30` retains unconditional “Three request forms only,” “Constituents appear exactly once,” and “allocation ... remain unknown,” then appends the new option-structure alternative. These statements describe old inventory but now appear to govern the expanded operation. Scope them explicitly to inventory/catalog views when preparing a successor contract. No old schema needs changing to correct this prose.

## A–J assessment and positive findings

- **A Product/domain:** current open-option scope, residual visibility, actual collateral distinction and expiration qualification track final Product decisions. R1–R3 prevent full design acceptance.
- **B architecture:** backend-owned membership/terms/payoff and presentation-free projection conform to v2 authority. No new universal aggregate/framework is justified or proposed.
- **C reuse:** existing Position selection, grants, retained artifacts and normalized transactions are appropriate; R2 identifies a missing concrete accepted continuity precedent.
- **D API/resource consistency:** `/v2/positions?view=option-structure` is a defensible opt-in projection. Qualified unions and exact rational payoff coordinates are useful. R3/R4 remain.
- **E compatibility:** I independently compared every pre-existing component schema with the baseline: unchanged. Other paths are unchanged. This is promising source-level evidence, not generated-client or runtime compatibility proof; those remain implementation verification.
- **F provenance/time:** one read transaction/evaluation instant, accepted-source selection and honest source precision are sound. R1/R2 concern the unresolved affirmative admission rules, not those safeguards.
- **G authorization:** Account positions grant before source loading and opaque provenance without raw disclosure are coherent. No need to broaden artifact/history grants was demonstrated. Runtime denial/isolation tests remain required.
- **H testability:** the proposed matrix covers meaningful counterexamples, but future tests and synthetic geometry do not supply the missing positive source admission contract.
- **I scope:** no CLI changes, migration or acquisition expansion is a sound boundary. Do not smuggle the missing evidence capability through a GET or a local instrument file.
- **J retained-only purity:** the connection-bound retained-reader extraction is necessary and well chosen. Existing `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/TransactionHistory.java:41`–`:48` can acquire; Fidelity's public path also writes at `:75` and commits at `:82`. P1 correctly prohibits calling it. Existing `load` at `:180`–`:199` is the read seam; extraction must preserve source normalization/revision semantics. No new implementation was run to verify purity.

The ordinary/adjusted payoff formula is internally consistent for the stated single-underlying, fixed-cash physical model; exact rational breakpoints avoid template rounding. I found no reason to reject that representation itself. Incomplete terms must continue to block a complete package curve.

The author's separately reported schema-tool validation is author evidence, not this review's independent execution result. This review performed source inspection, frozen-hash verification, remote-SHA verification and structural old-schema comparison. It did not execute a new backend, generated clients or operational artifacts; it does not certify Product acceptance.

No settled Principal Product choice needs reopening. The missing evidence concerns engineering/source admission. REJECT freezes P1; it grants neither remediation nor implementation. A later design ACCEPT would still be separate from implementation authority, independent backend verification, Principal Product acceptance and operational delivery permission.

CURRENT STATE: Frozen P1 independently REJECTED as an implementation-ready design; design-only implementation stop remains in force; Gate Experiment 001 remains STAGED.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this independent review to the commissioning actor.
