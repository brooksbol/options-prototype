# PL-API-02 — Principal live-site Product review (October 15, 2026)

**State:** Principal review complete; Product acceptance **pending bounded public-documentation cleanup and Principal reinspection**. Technical independent acceptance and initial Pages publication already passed. This record preserves observations and hypotheses, not permission to change backend contracts. **Do not turn deferred domain redesign into a PL-API-02 release blocker.**

**Site:** https://brooksbol.github.io/options-prototype/  
**Governing plan:** `docs/design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md`  
**Architectural authority:** `docs/77-api-v2-architectural-guardrails.md`

## Near-term public-documentation cleanup (bounded)

| ID | Observation / Principal disposition | Action and boundary |
| --- | --- | --- |
| UX-01 | Introductory content leaves an empty dark right pane; endpoint examples use that pane well. | Nonblocking COTS layout limitation. No custom layout system. |
| UX-02 | Error `oneOf` buttons render as repeated `object` for Account operations and repeated `HeldQuotesReadProblem` for Quotes. | Try native OAS `title` metadata to give distinct, meaningful error variants; verify in pinned Redoc. Do not change schema semantics or invent custom UI. If native rendering cannot solve, record limitation. |
| UX-03 | Administrative User discovery is internal. `GET /v2/users` and `GET /v2/users/{userId}` should not appear in public reference. | Exclude both from **public projection only**, with regression guard. Preserve internal OAS and runtime. Retain `GET /v2/me` as authenticated self-inspection; controller verified to resolve identity from caller credential, not client-selected ID. Public categorization may use Identity instead of Users if achievable natively. |
| UX-04 | `POST /v2/position-acquisitions` is a transitional acquisition mechanism, not desired external domain resource. | Exclude from public projection; preserve backend/internal contract and `ww pull` consumers. Redesign deferred. |
| UX-05 | Portfolio Capital introduction is dense. | Small editorial readability pass only; retain all accounting/provenance caveats. Nonblocking. |
| UX-08 | `GET /v2/market-evidence-subjects` exposes backend subject-selection for `ww pull`, not an established public domain resource. | Exclude from public projection; preserve internal contract and callers. |
| REST-01 | HTTP semantics discussion identified possible missing/misused codes. | **Review only** 400/406/409/415/422/429 and creation/redirect/conditional 201/202/303/304 against implemented contracts. No speculative status additions or behavior changes in documentation cleanup. |

**Expected public projection after four exclusions:** 15 operations; authoritative internal OAS remains 19. Recalculate against actual accepted main before changing. **Artifact endpoints remain unchanged in the public reference for this release**, by Principal instruction; do not infer approval of their long-term resource model.

**Release gate:** Verify all remaining public operations/examples are correct, removed operations and orphaned sensitive schemas are absent from rendered public HTML, internal OAS retains all accepted contracts, human and agent consumption still work, static security/offline/COTS/CI gates remain green, and deployed artifact identity is verified. If published content changes, do not claim it is byte-identical to the previous accepted HTML. Principal re-reviews updated live site before Product acceptance.

## Deferred REST/domain-model reconciliation — NOT a current acceptance blocker

**Core heuristic:** Domain concepts drive resource design. URI gymnastics are a red flag: if a URI needs implementation explanations to justify it, investigate the model. This applies Doc 77; it is not a new principle.

- **Portfolio and Positions:** Principal questions Account-centric `/v2/portfolio-capital-observations`. Candidate User-scoped `GET /v2/portfolio` and `GET /v2/positions`, retaining Account filtering/selection. **Portfolio + Positions = Console.** This is about domain identity, not removing filters or the accepted Portfolio Capital calculation. Revisit with v2 Web Console migration and existing PL-PORT-01 / PL-PROD-VALUE authority.
- **Evidence:** Candidate `GET /v2/evidence` as a User-authorized discovery resource returning typed evidence or URIs to categorized, independently addressable evidence instances; query filters select subjects/types/Accounts. Evidence = observations/sources supporting representations. Avoid imposing one arbitrary universal payload or storage-driven taxonomy.
- **Audit:** Candidate `GET /v2/audit` for immutable events: *this happened at this time*. Could filter by resource/type and point to individual events. Audit is not a command or a processing-retry endpoint.
- **Artifacts:** Principal questions whether Artifact is a domain resource or merely retained file/download packaging. `GET /v2/artifacts` and `GET /v2/artifacts/{artifactId}` have plausible inventory/provenance value due to Fidelity CSV workflows. `GET /v2/artifacts/{artifactId}/content` appears redundant and raises exposure concerns. `POST /v2/artifacts/{artifactId}/imports` exposes reprocessing machinery and is a REST-model red flag. `POST /v2/artifacts` remains undecided because Fidelity CSV submission is real but content/security/attribution need scrutiny. **Principal explicitly chose to leave the Artifact public documentation as-is for now.**
- **Identity and lifecycle:** Durable evidence identity, processing attempts, and audit events are distinct internally, but need not all be public resources. Do not confuse content deduplication with HTTP idempotency. Principal favors conventional semantics: 201 for completed resource creation, 202 for accepted/incomplete work with progress resource, and possibly 303 for duplicate submission pointing to an existing resource—only if actual identity and semantics justify it. 304 conditional reads, 406 response negotiation, 409 state conflicts, 415 request media type, 422 semantic validation, 429 rate limits must be based on implemented policy, not invented for completeness.
- **Public versus internal:** Not every accepted internal HTTP capability belongs in the public documentation. Public documentation projection and authoritative internal OAS remain separate. No endpoint deletion, renaming, grants change, runtime change, or migration authorized by this review.

## Product acceptance and handoff

Principal finished initial site walkthrough and asked to persist observations, perform only the leftover minor/bounded public-documentation work, and defer substantial API/domain redesign. **Do not close PL-API-02 or start Step 5 protocol integration until Principal accepts the revised live reference.**

Codex handoff: investigate and implement only the bounded public projection/editorial/rendering adjustments above; independently verify and deploy through the approved controlled publication process; return live URL, exact operation count, hashes, tests, exceptions, and final SYNC. Defer the domain-model backlog. No custom documentation platform.
