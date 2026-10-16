# Independent P2 architectural/API review

**Disposition: REJECT.** P2 materially resolves most P1 findings. Two bounded semantic gaps remain: the positive physical-equity admission boundary and canonical quantity handling within one association. This is not a rejection of the resource architecture or a request to reopen settled Product decisions.

Reviewed proposal SHA256 `021980d236b973ccde5d86004a6382482328e11fa6b185d79c1235f6ed6af7f0`, account OAS `6f5121481beefc79096a0e44c13962951a2862f3457e0e545e6903a66a4269f2`, and every entry of `frozen-manifest.json`; all hashes independently matched. Advertised remote main independently remains `7ae274cbb0ad0ce77f21440b0c390558913f61e8`. Baseline references below resolve inside `/tmp/ww-live-api-proposal.bDAtaf/baseline`; P2 references resolve inside `/tmp/ww-live-api-p2`.

Authority remains design remediation/review only; Gate 001 remains staged. No frozen packet, repository or candidate was edited; no provider API, operational service/database, credentials or grant action was performed. Public documentation browsing was read-only. Only this report was written.

## Blocking findings

### R1 — High: physical-equity classification still lacks a complete admission predicate

`source-admission.md:24`–`:35` derives a physical 100-share, zero-cash, USD contract from Equity Option + Standard + shares-per-contract=100 and matching symbols. It says to reject index/cash settlement or a conflicting underlying definition, but the finite acquisition path fetches only option definitions (`proposal.md:93`–`:99`); no retained positive underlying-product qualification or source for that rejection test is specified. The fixture contains no such underlying definition.

I independently checked the cited [native option documentation](https://developer.tastytrade.com/reference/instruments/getInstrumentsEquityOptionsSymbol/). It does describe shares-per-contract as deliverable shares, which supports P2 more strongly than an ordinary multiplier. But provider taxonomy is broader than physical stock: [the provider's equity definition](https://developer.tastytrade.com/reference/instruments/getInstrumentsEquitiesSymbol/) explicitly covers stock, ETF **or index** and supplies `is-index`. The provider's [published SPX order example](https://www.postman.com/tastytradeapi/tastytrade-api/request/m7jly7j/otoco-equity-option-market-entry) labels SPX contracts `Equity Option`. Thus that discriminator is not itself the physical-product boundary. [OIC distinguishes cash settlement of index options](https://www.optionseducation.org/advancedconcepts/equity-vs-index-options).

**Precisely what is and is not established:** the evidence proves the label alone is insufficient. This review did not acquire a live SPX native definition and does not claim to have observed a real SPX record with all three P2 predicates. The remaining design gap is that P2 neither proves that the full predicate excludes index contracts nor positively qualifies the underlying before claiming physical settlement. Its own caveat at `source-admission.md:40` recognizes this distinction. The local oracle (`verify-design.py:26`–`:29`) tests positive XLE fields and missing/non100 shares, not the index/unknown-underlying boundary.

**Closure evidence:** provide a documented product distinction that makes the admitted composite predicate sufficient, or include a bounded provenance-bearing positive underlying/product qualification in the retained source path. Add cash-index, missing classification and contradictory product-definition negatives alongside the unchanged XLE positive. State exact failure qualification and request/retention scope. No live brokerage call is required to establish this design boundary, and a ticker blacklist is not a general proof. The XLE arithmetic itself is not disputed.

### R2 — Medium: units depend on input partitioning unless allocations are canonicalized

`proposal.md:81` validates total claimed quantities, permitting partial allocations; `:107` defines units as GCD of allocated option quantities. Neither defines one canonical entry per holding within a single assertion, rejection of repeated holding IDs, or coalescing equivalent same-contract portions before GCD/classification. `proposed-account-evidence.openapi.json:5660` and `:5678` allow repeated holding allocations. An independent schema probe confirmed duplicate entries validate; this finding concerns the missing semantic rule, not a claim JSON Schema can enforce arbitrary key uniqueness.

**Concrete falsifier:** observe four condor holdings `+2/-2/-2/+2`. One assertion lists four allocations and yields units=2. The same assertion can list two `+1` entries for the first holding and `-2/-2/+2` for the others. Signs and total consumption still agree; GCD over entries becomes1 and there are five apparent constituents despite identical financial exposure and one management assertion. Across custody holdings, the same issue needs an explicit domain decision about when equivalent contracts form one primitive ratio leg.

**Closure evidence:** define canonicalization before unit/strategy calculation (or reject duplicate holding entries), preserving per-holding provenance and conservation. Test both encodings and custody-separated equivalent contracts. Same exposure within one asserted construction must either yield identical units/strategy/payoff or have a documented, domain-relevant reason for differing. Distinct association IDs must remain distinct Positions.

## Closed P1 findings and independent evidence

- **Finite source path:** exact XLE native records now have hash/pointer lineage; synthetic authoring is honestly distinguished from historical source facts and current operational state. I independently compared the extracted records with the baseline capture. New authenticated association intake and explicit definition retention address demonstrated missing capabilities; R1 is the remaining admission boundary.
- **Occurrence/opening:** accepted P1 alternative is used correctly. Schema permits only UNKNOWN/null; the actual accepted Doc70 replacement and ContinuityEngine are recovered at `proposal.md:125`–`:133`. No full-Q Program policy is imported. Eventual partial-close/roll/reopen Product remains deferred, not silently redefined.
- **Fidelity coverage/purity:** `proposal.md:121`–`:123` now directly reads ledger observations and source rows, normalizes in memory, and explicitly prohibits materialization/public history. This closes the design omission. Baseline `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/TransactionHistory.java:52`–`:82` demonstrates why calling public Fidelity history would write first. The before/after-history and unchanged-table integration falsifiers are appropriate; they remain future implementation tests.
- **Four user-supplied schema contradictions:** independently reran the four mutations against the P2 draft—established unassociated membership, fractional option quantity, negative deliverable shares and inconsistent missing-snapshot Account. All rejected. Positive response and draft OAS/reference validation passed. Affirmative identity/opening probes also rejected. Every pre-existing component schema compared unchanged.
- **Quantity meaning/prose:** GCD primitive structural units resolves P1's ambiguous definition, subject to R2. Expanded Position operation prose now separates old inventory from new projection.

I did not run `verify-design.py` itself because it writes frozen packet files. Independent checks used read-only schema validation against staged contracts whose bytes were verified against the frozen drafts. No backend/HTTP/Product success is inferred.

## Nonblocking review notes and A–J disposition

**A Product/domain:** current-snapshot construction is an honest bounded subset; no occurrence, collateral or operational-completion claim. R1/R2 block acceptance. Reassertion after each new snapshot is a conspicuous limitation for later Product observation, not continuity.

**B architecture / C reuse:** backend authority, current Position projection, existing client/artifact custody and small association resource are justified. The new persistent facts have demonstrated gaps; no universal registry or event engine is proposed.

**D public API:** collection-create assertion and immutable instance inspection are coherent. One cleanup remains: new association routes use `format: uuid` alone for X-Request-Id (`proposed-account-evidence.openapi.json:1994`, `:2121`) while established v2 accepts blank/padded UUIDs and specifies generated correlation on invalid input. Reuse the common correlation contract rather than making this operation subtly different. Clarify exact-retry precedence over the latest-snapshot precondition so a committed request retried after a pull still returns the original record.

**E compatibility:** old schemas are unchanged; opt-in alternatives preserve default intent. Generated-client and actual installed consumer verification still belongs to implementation review.

**F provenance/time:** immutable snapshot-bound intent and unavailable occurrence are truthful. Native definition provenance and effective-term conflict handling remain essential; R1 concerns source admission, not curve arithmetic.

**G authorization:** separate deny-default association grant and existing acquisition/read grants are reasonable. Lookup scope, concurrent authorizations, failed supersession preservation and exact-retry identity require HTTP/storage tests. Review does not authorize provisioning grants.

**H testability:** useful positive and negative design specimens now exist; the two findings above add bounded falsifiers. Do not claim design-oracle success as runtime evidence.

**I scope/minimality:** new association facts and explicit contract definitions are justified. P2 makes no history-derived affirmative conclusion, so avoid making unrelated history parsing/integrity a prerequisite for a valid current asserted curve. The pure Fidelity seam is correct if consumed, but unnecessary history traversal should not enlarge the structural read's failure surface. Also consider the provider's existing [batch option-definition lookup](https://developer.tastytrade.com/reference/instruments/getInstrumentsEquityOptions/) under the current batching guardrail rather than committing to avoidable serial single-contract calls; preserve per-subject outcomes and the declared budget.

**J purity:** structural GET remains query-only; new writes/acquisitions are explicit POST capabilities. Fidelity materialization dependency is removed in design. Runtime zero-provider/zero-write tests remain required.

A successor review needs the R1 admission proof/negative cases and R2 canonical allocation rule/tests, with frozen successor identities and preserved P1/P2 history. No broad model redesign or new Principal Product decision is required. This REJECT grants no remediation or implementation authority. Even a later design ACCEPT would not establish implementation authority, operational evidence admission or Principal Product acceptance.

CURRENT STATE: P2 independently REJECTED for two bounded semantic gaps; design-only implementation stop remains in force.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return this independent review to the commissioning actor.
