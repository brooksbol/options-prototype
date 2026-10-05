# Proposed first common v2 direct-quote acquisition contract

**Status: PROPOSED for Principal ratification; not implementation authority.** OAS source: [`api-v2-direct-quote-acquisition-proposal.yaml`](api-v2-direct-quote-acquisition-proposal.yaml). Product authority is `PL-API-03` and Doc 76 §§21–23; cross-cutting authority is Doc 77. This selects one HTTP slice only. The Principal has selected the semantic capability boundary, including unenrolled named subjects and held visibility after synchronous `NEWLY_ACQUIRED` completion.

## Contract proposal

`POST /api/v2/quote-acquisitions` synchronizes canonical direct-quote evidence for **1–30 distinct named symbols**. Request JSON is exactly `{"subjects":[{"symbol":"SPY"}],"mode":"ORDINARY"}`. `mode` is optional and defaults to `ORDINARY`; `FORCE` is the only override. A subject is a US-listed underlying symbol, not an OCC contract or a provider-native request. Symbol case is canonicalized to uppercase before duplicate detection; duplicate canonical symbols invalidate the whole request. No implicit subject selector exists here. No quote-field projection parameter changes acquisition scope. The 30-subject cap is a proposed operational bound, not a domain or provider limit; larger sets can be divided by clients into separate operations.

The response is one completed operation with one ordered result per requested subject. `200` does **not** mean every subject was fulfilled. `NEWLY_ACQUIRED` and `REUSED` alone have `fulfilled: true` and a non-null `observation`. All other outcomes have `fulfilled: false`; `observation` is the selected retained prior canonical direct quote if one exists, or null. `priorRetained` is true exactly for a failed result with such held evidence. A retained prior observation never fulfills the failed request. The result's `failure` is required for unfulfilled outcomes and absent for success. No provider batch status can substitute for these per-subject results.

The proposed terminal outcome vocabulary is `NEWLY_ACQUIRED`, `REUSED`, `UNMATCHED`, `UNSUPPORTED_SUBJECT`, `UPSTREAM_UNAVAILABLE`, `CONTACT_NOT_PERMITTED`, `ADMISSION_REJECTED`, `UPSTREAM_FAILED`, `INVALID_UPSTREAM_EVIDENCE`, `AUTHORITY_SUPERSEDED`, and `ACCEPTANCE_FAILED`. `UNMATCHED` means the provider did not return a matching subject in an otherwise completed response; it does not mean the symbol is known invalid. `UNSUPPORTED_SUBJECT` means the requested identity is outside this capability or cannot be served by the selected provider. `ADMISSION_REJECTED` means no upstream call was admitted; an ordinary admission wait that eventually succeeds remains `NEWLY_ACQUIRED`. A batch-wide provider failure maps independently to each affected unresolved subject. Per-subject `failure.code` equals its terminal outcome and `retryable` describes whether another attempt might change that operational condition; it does not promise success. The backend must not manufacture an upstream attempt for `FORCE` when contact is forbidden: it reports `CONTACT_NOT_PERMITTED` or `UPSTREAM_UNAVAILABLE` truthfully.

## Observation and clocks

The canonical observation contains a stable Wheelwright `observationId`, resolved underlying `subject` (`symbol`, `securityType`), optional provider-reported identity context, optional price/activity facts, and separate provenance. It is successful price-bearing evidence only if at least one of `last`, `bid`, `ask`, `open`, `high`, `low`, or `close` is present as a valid **strictly positive** price. A source-reported zero may be preserved as a fact but cannot alone certify successful price-bearing acquisition. `previousClose` alone, metadata alone, and reported change alone are insufficient. Each absent fact is omitted, never null or zero by substitution. `close` is never renamed `last` or represented as a closing-bell measurement. `bid`, `ask`, and `last` each carry their own optional provider event time, size, and venue where returned. No generic quote market timestamp exists. Numeric prices and percentages are decimal JSON numbers; clients needing exact financial arithmetic must parse them as decimal rather than binary floating point.

`provenance.provider` and `environment` identify the source. `acquisitionId` correlates the accepted provider attempt, and `authorityEpoch` is an opaque Wheelwright fencing identifier. `acquisitionPhase` classifies the contact context; optional `regularSessionDate` and `feedIdentity` preserve applicable session/feed context without asserting a market-event time. `receivedAt` is when Wheelwright received the successful upstream subject payload; `committedAt` is when it became authoritative held evidence. Both are RFC 3339 UTC instants. A reused or retained observation keeps its original provenance and clocks. Operation `startedAt` and `completedAt` describe this request, not market events or observation age. The backend may store richer source material, but the canonical contract does not expose provider incidental fields as Wheelwright facts.

## Completion, repetition, and publication

A normal `200` response is emitted only after every requested subject has a terminal result. `NEWLY_ACQUIRED` requires subject/type verification, canonical normalization, successful authority fence, durable acceptance into authoritative held quote state, and immediate visibility to the common held-quote read boundary. That read boundary is a separate capability; this proposal does not design its endpoint. Quote-visible publication may accompany acceptance; full Decision publication, observation-demand enrollment, expiration discovery, chains, position updates, and Decision recomputation do not. V1 targeted refresh and Decision's chain-bound spot contract remain intact.

The server does not return a fabricated completion after an application wait threshold. If a connection ends before a `200` or request-level error is received, the client has an **indeterminate transport outcome**; the operation might have accepted evidence. Repeating `ORDINARY` re-evaluates reuse under current policy. Repeating `FORCE` may cause another real upstream attempt. This POST has no network-idempotency promise or idempotency key in the initial slice. `X-Request-Id` is an optional client-supplied UUID echoed in response/error; otherwise Wheelwright creates it. It is correlation only, not deduplication. Provider attempt and acceptance events must be traceable internally to this request and per-subject outcome. A future inspectable long-running operation would require a separate ratified contract if infrastructure cannot sustain honest synchronous completion; this proposal does not silently recreate the v1 20-second `NOT_COMPLETED` behavior.

## HTTP, error, security, and configuration

A syntactically and semantically valid operation returns `200`, including mixed or all-failed per-subject outcomes. Request-wide errors are RFC 9457 problem JSON with stable `code`, `requestId`, and optional `invalidParams`: `400` malformed JSON, `401` missing/invalid credential, `403` insufficient acquisition/force authority, `415` wrong media type, `422` invalid subject/mode/cardinality/duplicate, `503` operation cannot start because the backend capability is unavailable, and `500` unclassifiable request-wide server failure. An accepted operation's per-subject upstream, admission, provider, or fence failure remains in `200` results. Failure before any trustworthy per-subject reconciliation can be returned is request-wide `500`/`503`, and must not claim subject fulfillment. No `207` or upstream HTTP status passthrough.

Request-wide code/status pairs are fixed: `MALFORMED_REQUEST`/400, `UNAUTHENTICATED`/401, `FORBIDDEN`/403, `UNSUPPORTED_MEDIA_TYPE`/415, `INVALID_REQUEST`/422, `CAPABILITY_UNAVAILABLE`/503, and `INTERNAL_ERROR`/500. An invalid `X-Request-Id` is `INVALID_REQUEST`/422. The server echoes a valid supplied correlation UUID; for invalid or absent IDs it generates a valid response/error UUID. The backend authenticates before authorization and does no provider work on 4xx failures. A request rejected before operation start is `503`; inability to contact the provider after start is a per-subject result. Each problem `type` is the stable URI `urn:wheelwright:problem:{lowercase-code}`; `title` is stable text, while `detail` may vary and must be safe to expose. No provider credentials or raw payloads appear in errors.

The initial proposed security mechanism is TLS-protected HTTP Bearer credentials, validated before the capability, mapped by backend configuration to a principal with `quote.acquire` and, separately, `quote.force` grant. All subjects in a request share the caller's authority. Missing credential is `401`; authenticated caller lacking the needed grant is `403` before provider work. Deployed startup fails closed when no approved authenticator/grant configuration exists. No anonymous production mode. Local use can present a Bearer credential. If trusted-local authentication is later enabled, it must establish a principal and pass the same authorization checks; this first OAS does not advertise a bypass. Credential material and raw authority secrets are not returned in observations, errors, or logs. The selected production identity provider remains a deployment decision; the Bearer-to-principal boundary is the proposed initial mechanism, not a claim that a particular cloud identity provider is ratified.

The backend owns policy. Active-session ordinary reuse uses the configured maximum successful-upstream-contact age (Product default **60 seconds**) and the usable-session/feed boundary. Completed-session ordinary reuse defaults **enabled**. Explicit ordinary off-hours contact defaults **enabled** when reuse does not qualify. `FORCE` bypasses reuse and requires actual contact if permitted. No request field changes age, session policy, provider, or batch size. Disabling off-hours contact applies to explicit `FORCE` too unless an independently ratified contact override exists; no such override is in this slice. Provider availability does not change reuse eligibility. These policy settings change fulfillment decisions, never observation facts or downstream admissibility. Backend evaluates per-subject reuse first, then SHOULD batch compatible unresolved provider work under Doc 77; grouping and count are not exposed.

Wire evolution for this slice: clients must ignore unknown response object properties; adding optional response facts is compatible. Removing or changing a field's meaning, making an optional response field mandatory for client interpretation, adding outcome or problem codes, changing the price-bearing predicate, or changing completion/security semantics requires an explicit contract revision and client compatibility review. Requests reject unknown fields so clients cannot accidentally assume a new policy override. A new optional request field requires a ratified additive contract revision. This proposal defines no separate discovery or health endpoint; deployment readiness and provider availability remain distinct internally and in the result/error distinctions above.

## Acceptance specimens

| Specimen | Required observable result |
|---|---|
| One new subject | `200`, one `NEWLY_ACQUIRED`, `fulfilled=true`, accepted observation visible to held-quote read before response. |
| One eligible held subject | `200`, `REUSED`; same observation ID/provenance/clocks, no upstream contact. |
| Multiple compatible new subjects | `200`, independently `NEWLY_ACQUIRED`; adapter batches when compatible; no public request-count promise. |
| Mixed held and upstream | Held subject `REUSED` and omitted upstream; unresolved subject independently `NEWLY_ACQUIRED`. |
| Provider partial batch | Returned valid subjects `NEWLY_ACQUIRED`; missing subject `UNMATCHED` with retained prior or null; upstream HTTP 200 never implies blanket success. |
| Upstream failure, no prior | `UPSTREAM_FAILED`, `fulfilled=false`, `observation=null`, `priorRetained=false`. |
| Upstream failure, prior | `UPSTREAM_FAILED`, `fulfilled=false`, prior observation unchanged, `priorRetained=true`. |
| Force succeeds | Real upstream attempt; `NEWLY_ACQUIRED`, even when prior was young. |
| Force fails with prior | Real attempt; failure result and unchanged retained prior, never `REUSED`. |
| Closed period | Latest completed regular-session selected quote may `REUSED` through overnight/weekend/holiday under default, without claiming closing-bell time. |
| Explicit off-hours miss | Under default contact policy, attempt upstream and return new evidence or truthful failure; never label it active regular-session evidence. |
| Active age boundary | At age ≤ configured 60 s and same usable phase, eligible observation may `REUSED`; just over must attempt upstream if permitted. |
| New regular/feed boundary | Prior quote cannot reuse even if <60 s old; attempt upstream or truthful block/failure. |
| Malformed request | `400` problem; no provider work. Invalid subject shape/cardinality/mode is `422`. |
| Unauthenticated | `401` problem; no provider work. |
| Unauthorized | `403` problem, including force without `quote.force`; no provider work. |
| Fencing transition | No `NEWLY_ACQUIRED` from superseded authority; `AUTHORITY_SUPERSEDED` and retained prior/null. |
| Duplicate canonical subject | `422` after case normalization; no provider work or duplicate result. |
| Unsupported subject | Well-formed symbol outside supported underlying class yields per-subject `UNSUPPORTED_SUBJECT`; malformed symbol is request-wide `422`. |
| Read after completion | Immediate authoritative held-quote read returns the `NEWLY_ACQUIRED` observation ID and provenance. |
| Bid only, no last | Strictly positive subject-verified bid is valid `NEWLY_ACQUIRED`; `last` remains absent. |
| Previous close or metadata only | `INVALID_UPSTREAM_EVIDENCE`; no new observation; any prior remains separately held. |
| Legacy chain spot only | No canonical direct-quote reuse; ordinary acquisition seeks upstream or reports truthful non-fulfillment. |
| Provider returns zero bid only | Preserve source fact only if independently retained as diagnostic material; it does not create a successful canonical price-bearing observation. |

## Kiro ambiguity audit and ratification surface

No Product/architecture choice is delegated to Kiro for this slice. Kiro must implement the OAS, selected semantics, and these specimens. The implementation will still select internal storage, class decomposition, token storage format, provider batch sizing, and operational timeouts subject to the contract; those are engineering choices. **Principal ratification is needed for the proposed HTTP/OAS details**, especially synchronous-only transport behavior, the 30-subject cap, price-bearing field predicate, and proposed Bearer security mechanism. These are explicit proposals, not claimed prior decisions. If the deployed gateway cannot sustain a synchronous connection long enough for legitimate admission waits, that is a concrete pre-implementation contradiction requiring a new completion design rather than a hidden `NOT_COMPLETED` substitute.

CURRENT STATE: Subject-scoped direct-quote semantics are selected. This first HTTP/OAS contract and its acceptance specimens are proposed only; no runtime work is authorized.

DECISION REQUIRED: YES

OPTIONS:
A — Ratify this first direct-quote HTTP/OAS slice for subsequent Kiro handoff.
B — Revise a specified wire, security, or completion choice before ratification.
C — Defer this slice.

RECOMMENDED DEFAULT: A
