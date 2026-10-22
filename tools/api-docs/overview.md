Wheelwright maintains provenance-bearing evidence for options-income decision support. API v2 exposes domain resources independently of any browser or CLI.

**Last publication:** not published — local preview. **Preview date:** 2026-10-15.

# Getting started

1. Choose a resource from the navigation. Each operation shows its method, stable operation ID, parameters, schemas, status codes and examples.
2. Inspect the request and the response together. A completed HTTP request does not establish fresh evidence, successful processing, or complete brokerage history.
3. Use the copyable cURL example as a request-shape template. Every example uses invented data and the reserved, nonworking `api.example.invalid` origin. This reference never sends API requests.

A published capability describes the API; operational actions require a separately commissioned task. Reading examples does not start an operation.

Account and User IDs are opaque backend identities; Account aliases are display/discovery metadata. Copy existing resource identities rather than constructing them from broker account numbers. Empty collections are meaningful results, distinct from unavailable evidence.

# Reading evidence correctly

- **Acquire or revalidate:** `POST /v2/quotes` evaluates reuse or performs bounded acquisition. HTTP 200 contains independent per-subject outcomes; a retained prior observation does not fulfill a failed acquisition. FORCE may cause another upstream attempt and correlation does not deduplicate it.
- **Read held quotes:** both quote GET operations return retained committed evidence without provider contact or freshness/reuse evaluation. They do not turn old evidence into current evidence. Discovery is complete per committed item, without a collection-wide atomic instant.
- **Read Positions:** GET reads independently identified economic Positions, their current Construction and evidence-qualified evaluation. Each Position has its own Wheelwright GUID; CLOSED is terminal and a subsequent opening requires a new GUID. A repeated holdings observation does not prove uninterrupted economic continuity, an opening date or opening economics. Broker custody observations remain separately inspectable through Holdings and retained snapshots. Missing values remain unknown; date-only exports do not establish executable prices. Split/recombine policy remains unresolved.
- **Read history:** Account transaction GET may use policy-bounded backend read-through. A complete delivered collection, a complete source traversal, a coherent upstream snapshot and lifetime coverage are different claims. Lifetime coverage remains UNKNOWN; provider snapshot consistency is UNVERIFIED.
- **Retain sources:** CSV upload commits original bytes before processing. Processing REJECTED may accompany HTTP 200; inspect status and preserve earlier admitted evidence. Retry uses retained CSV bytes and does not replay brokerage acquisition.
- **Select subjects:** the backend combines holdings underlyings with configured monitoring subjects. Coverage qualifications remain explicit. Selection itself acquires nothing.
- **Portfolio Capital:** the reported value is a qualified two-source composite, not Account NAV or an atomic brokerage observation. Unmatched or ambiguous evidence remains null.

# HTTP conventions

`X-Request-Id` correlates a request and its response; it is never an idempotency key. Receipt, commit, observation, import and evaluation clocks have different meanings. Reused or retained observations preserve original provenance and clocks.

Held v2 quote reads ignore `If-None-Match`, return 200 on success, and expose no ETag or 304. Private financial reads use `Cache-Control: private, no-store`. Quote acquisition's POST response does not promise that header. Resource-specific response headers are shown with each operation.

Errors use `application/problem+json`. The HTTP status agrees with the body status, stable code, type and title. Validation failures include nonempty `invalidParams`; header/body request IDs agree. Error samples are invented, not captured from an account.

# Glossary

| Term | Meaning |
| --- | --- |
| Account | Stable Wheelwright identity associated with broker-scoped external evidence. |
| Position | Independently identified Wheelwright economic resource with its own GUID, current Construction, qualified lifecycle state and financial evaluation; distinct from broker custody. |
| Holding | Account-scoped broker custody observation retained with source snapshot identity and provenance, independently of Construction recognition. |
| Artifact | Immutable original source bytes with a hash and retained processing-attempt metadata. |
| Observation | An accepted piece of evidence with its own stable identity, source and clocks. |
| Held evidence | Evidence already retained by Wheelwright, regardless of age or current reuse eligibility. |
| Provenance | Where evidence came from and when Wheelwright received and committed it. |
| Complete | A scope-specific claim; full delivery does not establish lifetime brokerage coverage. |
| Retained prior | Last successful evidence preserved after an unsuccessful reacquisition. |
| Admission | Acceptance of interpreted evidence into authoritative held state; separate from source retention. |

# Selected Product and architecture references

- [Evidence Appliance](https://github.com/brooksbol/options-prototype/blob/main/docs/foundations/evidence-appliance.md)
- [API v2 guardrails](https://github.com/brooksbol/options-prototype/blob/main/docs/77-api-v2-architectural-guardrails.md)
- [Quote acquisition contract](https://github.com/brooksbol/options-prototype/blob/main/docs/contracts/api-v2-direct-quote-acquisition-proposal.md)
- [Held quote contract](https://github.com/brooksbol/options-prototype/blob/main/docs/contracts/api-v2-held-quotes-read.md)
- [Approved history semantics](https://github.com/brooksbol/options-prototype/blob/main/docs/design/ww-history-approved-checkpoint-2026-10-15.md)

These links provide context. The static preview requires no backend service. No v2 operation is marked deprecated; no breaking-change migration is asserted by this documentation release.
