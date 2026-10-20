# API v2 — Kiro findings and Principal reconciliation (October 19, 2026)

**Status:** Category D reconciliation checkpoint, not ratified contract or implementation authority.  
**Scope:** Foundational financial resource model of v2 only; no v1 retrofit and no strategy/recommendation design.  
**Prior records:** `docs/discovery/api-v2-codex-five-findings-principal-reconciliation-2026-10-19.md`; `docs/discovery/4am-round6-api-reconciliation-2026-10-18.md`; `docs/knowledge/domain/`; `docs/assimilation-obligations.md` (ASSIM-0002 PENDING).  
**Provenance:** Two read-only Kiro reports supplied by the Principal in conversation; first assessed `ac95f3e`, targeted delta assessed `bf6389c`. Kiro's reports are actor evidence, not independent ratification. Subsequent Principal/ChatGPT reasoning and mock scenarios are identified below as such.

## Independent report and coverage

Kiro found that the Java/Spring/SQLite substrate can support incremental foundational resource corrections without a rewrite. It reported strong implementation limitations: observed holdings rather than lifecycle Positions; stable-looking holding-derived IDs across close/reopen; whole-holding allocation; absent canonical Contract/collateral association; v1-derived subject-selection; CLI-owned workflow selection. It also reported a concurrent duplicate-upload locking defect and filename-sensitive original-content/download and retry defects. These findings have **not** been independently reproduced by ChatGPT in this reconciliation. Route verified defects through `docs/bugs/`, not by pretending this checkpoint files them.

Kiro's second review repaired several missing bootstrap reads and recovered holistic API authority and ADR-016. It revised overly local remediation order, qualified transaction fingerprints as non-event identity, withdrew portions of its objections to Account-scoped successfully-processed `303`, stopped defending `POST /v2/quotes` as inherently correct, and recognized the Principal's mutable/empty Portfolio concept. It retained genuine concerns about source attribution, held-only Quote contract, and incomplete ledger coverage. Neither report authorized changes.

## G1 — Account attribution for CSV Uploads

**Kiro observation:** Fidelity Activity and Balances admission/current raw-source access reportedly depend on filenames for Account attribution. That is a potential implementation correctness and security boundary, not a settled Product requirement.

**Principal's actual v1 operator specimen:** “there's a dropdown. you select your Fidelity account—remember v1 only does Fidelity. that dropdown gives you 4 buttons, one for each of the four different kinds of CSVs that v1 needs to do its job. those CSVs are associated with the account that's already selected in the dropdown.” Selecting Sawdust while submitting a PTS file may corrupt the association; the old client lacks a warning that data may belong to another Account. This is **v1 Product evidence, not a mandate to retrofit v1 or a proof that any given CSV contains an Account ID**.

**Principal concern:** “the trick is that i don't think there's any provenace in the csv payload”; “this is why using CSVs sucks.”

**Reconciliation:** Selected Account is a caller's destination/attribution claim, backed by an independent Account authorization check—not proof of source identity. Filename is untrusted metadata, not independent financial authority. If file content independently establishes a different Account, fail closed before domain admission; if it cannot establish Account provenance, do not fabricate a mismatch warning or a verified identity. Preserve an explicit qualified policy for when authorized operator-selected attribution is sufficient, and distinct evidence provenance. Untrusted or missing source identifiers do not permit cross-Account leakage. CSV limitations must not dictate the canonical financial-domain taxonomy. Favor direct brokerage API evidence where it materially improves provenance, without denying supported CSV ingestion.

**Concrete negative specimen:** A PTS file is uploaded while Sawdust is selected. No misattributed PTS economics may be admitted to Sawdust. If file-origin mismatch cannot be established from evidence, report the actual uncertainty rather than claiming the server recognized PTS. Wrong-account retention, correction and authorization behavior require design.

**Open:** Which Fidelity CSV types have provable embedded Account identity; admission policy for an otherwise unidentified source; source-scope original-content authorization; parser versus submission attribution. Kiro's filename-dependent defects require canonical bug intake after verification.

## G2 — Quote GET, REST Uniform Interface, cache-control

**Kiro contradiction:** Accepted v2 `GET /v2/quotes/{symbol}` is provider-free held-evidence only, while the Principal's target domain facade can perform backend read-through acquisition. These are different contracts; neither can be silently claimed as the other.

**Principal statements:** “I want the quote, not your life story”; “cache-control”; “remember ww's place: it's a facade/cache layer between the operator and N brokerages.”

**Reconciliation:** Client requests a Quote through a uniform GET, not brokerage-specific acquisition choreography. Wheelwright may satisfy the read from retained evidence or permitted upstream revalidation, preserving observation clocks, source qualifications and unavailable states. Standard HTTP response caching and conditional semantics are useful, but **HTTP caching and the backend financial-evidence cache are distinct**. `Cache-Control: no-cache` governs HTTP cache revalidation and does not itself guarantee upstream contact, contemporaneous evidence, or permission to FORCE brokerage access. A backend mapping of request directives to source-revalidation policy must be designed explicitly. No client-requested brokerage trade/cancel or unauthorized effect is implied.

**Standing:** Read-through Quote GET is Principal-preferred *target design*, not accepted current runtime behavior. Explicit FORCE/revalidation remains a legitimate capability; its API placement remains to be justified after domain modeling. Preserve existing pure-held GET and POST contracts until authorized evolution and compatibility review.

## G3 — Wheelwright Ledger and Position evidence

**Kiro contradiction:** Transaction coverage is not known to be complete. A transaction-only ledger projection cannot establish all current quantities; source snapshots and ledger projection may disagree.

**Principal statements:** “ww position != brokerage position”; v1 forces full account-history uploads and replaces previous history; v2 should not; a useful system should be able to request a targeted missing interval (“hey, something's missing. can you give me may 5th through june 1st?”).

**Reconciliation:** Wheelwright Position identity is independent of broker holding-row identity. A ledger-centered canonical model is a *candidate*, using reconciled transactions and opening inventory observations; independent broker snapshots establish observed quantities at particular clocks. Incremental overlapping imports must extend/reconcile—not overwrite—retained Account Ledger history, as already ratified in Doc 82. Missing transactions may never be synthesized to force ledger/snapshot equality. Conflicting quantities remain qualified discrepancies. Source provenance, completeness, correction/supersession, economics and distinct evidence clocks remain binding.

**Candidate Product behavior:** When evidence justifies bounded gaps, present operator-actionable requests for the specific missing time interval rather than demanding entire history. Unknown coverage is not a known gap and no transactions is not proof of complete coverage. Gap detection need not earn an independent `/v2/gaps` resource. Historical request ranges must be supported by actual evidence.

**Open:** Precise ledger/snapshot conflict authority, event identity and correction rules, completeness inference, Position lifecycle and governed quantities (ASSIM-0002).

## Related Kiro findings deliberately kept separate

- `/v2/portfolio-capital-observations` is a bounded Account-level Fidelity financial composite, **not** a failed Portfolio implementation; preserve the distinct measure and its qualifications while a first-class mutable Portfolio is defined.
- Top-level Transactions remain a preferred candidate, but accepted nested Account routes and per-Account scope, grants, evidence clocks and coverage need a migration decision. Transaction fingerprints are not automatically universal economic-event identity.
- Retained source content includes broker-acquired JSON as well as uploaded CSV; `/v2/uploads` alone cannot erase that capability or imply all acquired evidence was uploaded.
- Kiro prefers in-process composition over internal HTTP because of atomic SQLite writes and authorization propagation. The Principal has not mandated either: independently testable boundaries are important; decide transports from present needs, not hypothetical scale or HTTP overhead.
- Kiro's concurrent Upload/filename tests are reported defects pending independent reproduction and canonical bug records, not architectural proof that ambiguous Artifact resource naming is correct.
- Shared Brokerage identity can be reference-like across Users; individual Accounts require robust grants and confidential evidence scope, without silently changing existing many-to-many User–Account authorization. Tradier production/sandbox connections are integration configuration, not automatically foundational domain resources.
- Shared brokerage adapters must not become shared Account financial authority. Gateway, token handling and service connection management are cross-cutting security pressures kept out of this foundational URI design.

## Remaining statuses / boundary

**Principal-endorsed conceptual direction:** Domain-first financial facade; Positions not broker holding identities; mutable first-class Portfolios with possible empty membership; Account-scoped Upload submissions with checksum-indexed duplicate recognition; broker-neutral Instruments/Contracts; request-oriented Quote GET; cumulative Account Ledger.

**Unresolved:** Canonical Position/event identity, Portfolio membership rules, Upload/content/processing equivalence, 303 details, source attribution sufficiency, read-through/cache contract, ledger/snapshot reconciliation, actual implementation architecture and migrations. This record is Category D; it does not overwrite maintained knowledge, OAS, ADRs, or `ASSIM-0002` without separate authorized assimilation.

No implementation, schema, brokerage, deployment or v1 changes authorized.
