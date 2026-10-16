# Wheelwright API v2 — Independent Black-Box Documentation Acceptance

**Actor:** Kiro (independent reader)
**Nature:** Black-box acceptance of a static documentation surface. Paper-only reconstruction. No API contact, no command execution, no file/client changes. No repository code, tests, internal design records, prior conversations, or source OpenAPI outside the supplied surface were consulted.

---

## 1. Supplied entry-point identity

| Attribute | Observed value |
| --- | --- |
| Entry point consumed | The published static documentation site `dist/site/index.html` (self-contained ReDoc render). |
| Rendered API title | **Wheelwright API v2** |
| Spec version | `0.5.0-contract` |
| OpenAPI version | `3.1.1` |
| Declared servers | A single server with `url: "/"` (no absolute origin). |
| Publication state | Documentation self-describes as **"not published — local preview"**, preview date **2026-10-15**. |
| Example origin | All examples use the reserved, nonworking origin `api.example.invalid`; the reference states it never sends requests. |

**Evidence used:** The OpenAPI document embedded in the rendered site (`__redoc_state.spec.data`) — the operations list, the `info.description` narrative, operation descriptions, parameter and schema definitions, the shared `components/schemas` and `components/responses`, and the per-operation examples. These are exactly what the static site renders to a reader; nothing was read from the `dist/private/*` artifacts or any repository source.

---

## 2. Discovered operations (methods, routes, stable operation IDs)

> Observed facts. Tags are the doc's grouping.

| Method | Route | Operation ID | Tag | Summary |
| --- | --- | --- | --- | --- |
| GET | `/v2/market-evidence-subjects` | `listRelevantMarketEvidenceSubjects` | Market evidence | Select relevant market-evidence subjects |
| GET | `/v2/accounts/{accountId}/transactions` | `readAccountTransactions` | Transactions | Read Account transaction history |
| GET | `/v2/accounts/{accountId}/transactions/{transactionId}` | `readAccountTransaction` | Transactions | Read an Account transaction |
| GET | `/v2/users` | `listUsers` | Users | List Users |
| GET | `/v2/users/{userId}` | `readUser` | Users | Read a User |
| GET | `/v2/me` | `readCurrentUser` | Users | Read the current User |
| POST | `/v2/position-acquisitions` | `acquireAccountPositions` | Positions | Acquire a holdings observation |
| GET | `/v2/portfolio-capital-observations` | `readPortfolioCapitalObservations` | Portfolio capital | Read Portfolio Capital observations |
| GET | `/v2/positions` | `readAccountPositions` | Positions | Read retained Position snapshots |
| GET | `/v2/artifacts` | `listAccountArtifacts` | Artifacts | List retained Artifacts |
| **POST** | `/v2/artifacts` | `retainAndProcessAccountArtifact` | Artifacts | Retain and process a CSV Artifact |
| GET | `/v2/artifacts/{artifactId}` | `readAccountArtifact` | Artifacts | Read Artifact metadata |
| GET | `/v2/artifacts/{artifactId}/content` | `retrieveAccountArtifactBytes` | Artifacts | Retrieve original source bytes |
| POST | `/v2/artifacts/{artifactId}/imports` | `retryRetainedArtifactProcessing` | Artifacts | Retry retained CSV processing |
| GET | `/v2/accounts` | `listAccounts` | Accounts | List Accounts |
| GET | `/v2/accounts/{accountId}` | `readAccount` | Accounts | Read an Account |
| **GET** | `/v2/quotes` | `listHeldDirectQuotes` | Quotes | List held direct quotes |
| **POST** | `/v2/quotes` | `acquireDirectQuotes` | Quotes | Acquire or revalidate direct quotes |
| **GET** | `/v2/quotes/{symbol}` | `readHeldDirectQuote` | Quotes | Read a held direct quote |

No operation is marked deprecated; the doc asserts no breaking-change migration for this release.

---

## 3. Representative shapes and meaningful domain constraints

> Observed facts from the schemas.

**Held quote read (`GET /v2/quotes/{symbol}` → `QuoteObservation`)**
- Required: `observationId` (uuid), `subject` (`ResolvedSubject`), `facts` (`QuoteFacts`), `provenance` (`QuoteProvenance`).
- `ResolvedSubject`: `symbol` (canonical uppercase), `securityType ∈ {EQUITY, ETF, INDEX, OTHER_UNDERLYING}` (option contracts excluded).
- `QuoteFacts`: `anyOf` requires at least one price-bearing fact among `last/bid/ask/open/high/low/close`; prices use `exclusiveMinimum: 0`; missing facts are omitted, never null/synthesized. `previousClose` and metadata alone do **not** constitute price-bearing direct-quote evidence.
- `QuoteProvenance` required fields: `provider`, `environment ∈ {PRODUCTION, SANDBOX}`, `acquisitionId` (uuid), `authorityEpoch`, `acquisitionPhase ∈ {REGULAR_USABLE, PRE_MARKET, POST_MARKET, CLOSED, UNKNOWN}`, `receivedAt`, `committedAt` (RFC 3339 UTC). `acquisitionPhase` is a Wheelwright classification, not a provider event time or admissibility verdict.

**Held list (`GET /v2/quotes` → `HeldQuotesReadResponse`)**
- Required: `requestId` (uuid, equals `X-Request-Id`), `items` (array, `minItems: 0`, no `maxItems`, no POST 30-cap, no pagination/truncation/history).
- Each `HeldQuoteDiscoveryItem` (bounded discovery summary): `observationId`, `subject`, `provenance` — all required and non-null, **no quote facts**.
- Ordering: one item per canonical symbol, uppercase symbol ascending.

**Acquisition (`POST /v2/quotes`)**
- `AcquireQuotesRequest`: `additionalProperties: false`; required `subjects` (array `minItems 1`, `maxItems 30`, canonical duplicates ⇒ whole request `422`); optional `mode ∈ {ORDINARY, FORCE}` default `ORDINARY`.
- `RequestedSubject`: `symbol` `minLength 1`, `maxLength 32`, pattern `^[A-Za-z^][A-Za-z0-9.^/_-]*$`.
- `AcquireQuotesResponse`: required `requestId`, `mode`, `startedAt`, `completedAt`, `results` (one terminal result per subject, in request order).
- `SubjectAcquisitionResult`: required `subject`, `outcome`, `fulfilled`, `observation` (nullable), `priorRetained`; `failure` required for unfulfilled, absent for fulfilled (enforced via `oneOf`). `fulfilled` is true **exactly** for `NEWLY_ACQUIRED` or `REUSED`. Full outcome enum: `NEWLY_ACQUIRED, REUSED, UNMATCHED, UNSUPPORTED_SUBJECT, UPSTREAM_UNAVAILABLE, CONTACT_NOT_PERMITTED, ADMISSION_REJECTED, UPSTREAM_FAILED, INVALID_UPSTREAM_EVIDENCE, AUTHORITY_SUPERSEDED, ACCEPTANCE_FAILED`.
- `SubjectFailure.code` must equal the enclosing `outcome`; `retryable` carries no success promise.

**Source submission (`POST /v2/artifacts`)**
- Query `accountId` **required**, pattern `^acct_[a-f0-9]{32}$` (opaque backend ID; aliases rejected).
- Header `Content-Disposition` **required**, must carry a parseable `filename`/`filename*`; decoded filename nonblank, ≤255 chars, no slash/backslash/C0/DEL.
- Header `X-Brokerage-File-Type` **required**, enum `{POSITIONS, BALANCES, ACTIVITY, OPTION_SUMMARY}`. `API_POSITIONS`/`API_TRANSACTIONS` are **not** upload types.
- Body media type `text/csv` (compatible parameters allowed); body is exact UTF-8 CSV bytes, 1..16 MiB.
- Response `ProcessedArtifact`: required `requestId`, `artifactId`, `importId`, `newlyPersisted`, `status ∈ {ACCEPTED, REJECTED}`, `result` (string).

**Problem (RFC 7807 `application/problem+json`)**
- Required: `type` (uri-reference), `title`, `status ∈ {400,401,403,415,422,500,503}`, `code ∈ {MALFORMED_REQUEST, UNAUTHENTICATED, FORBIDDEN, UNSUPPORTED_MEDIA_TYPE, INVALID_REQUEST, CAPABILITY_UNAVAILABLE, INTERNAL_ERROR}`, `requestId` (uuid). `oneOf` binds each `status` to its exact `code/title/type`. `422` requires nonempty `invalidParams` (each `{name, reason}`).

---

## 4. Reconstructed synthetic request templates (paper only, invented data)

> Hand-built from the schemas and the doc's own examples. Origin is the reserved `api.example.invalid`. These are request-shape templates, not transmissions.

### 4a. Held read — `GET /v2/quotes/{symbol}` (`readHeldDirectQuote`)
```
GET /v2/quotes/SPY HTTP/1.1
Host: api.example.invalid
Accept: application/json
X-Request-Id: 11111111-1111-4111-8111-111111111111
```
Notes: path token is the canonical transport codec (`EncodedQuoteSymbol`), e.g. `SPY → SPY`, `BRK/B → BRK_2FB`, `^SPX → _5ESPX`. Any query parameter or nonempty body ⇒ `422`. `If-None-Match` is ignored (no ETag/304). Success returns `QuoteObservation` with `Cache-Control: private, no-store`.

### 4b. Acquisition — `POST /v2/quotes` (`acquireDirectQuotes`)
```
POST /v2/quotes HTTP/1.1
Host: api.example.invalid
Content-Type: application/json
Accept: application/json
X-Request-Id: 11111111-1111-4111-8111-111111111111

{
  "subjects": [ { "symbol": "SPY" } ],
  "mode": "ORDINARY"
}
```
Notes: 1–30 distinct subjects; canonical-duplicate symbols invalidate the whole request (`422`). HTTP 200 means the operation completed with one terminal result per subject — **not** that every subject was fulfilled.

### 4c. Source submission — `POST /v2/artifacts` (`retainAndProcessAccountArtifact`)
```
POST /v2/artifacts?accountId=acct_0123456789abcdef0123456789abcdef HTTP/1.1
Host: api.example.invalid
Content-Type: text/csv
Content-Disposition: attachment; filename="activity-demo.csv"
X-Brokerage-File-Type: ACTIVITY
Accept: application/json

Run Date,Action,Symbol,Amount ($)
10/15/2026,DIVIDEND,DEMO,1.00
```
Notes: missing/invalid `accountId`, `Content-Disposition` filename, `X-Brokerage-File-Type`, or wrong media type ⇒ `422` **before** bytes are retained. A successful HTTP 200 can carry `status: REJECTED`; retained source and earlier admitted evidence survive. To re-run processing of already-retained bytes, use `POST /v2/artifacts/{artifactId}/imports` with no body/query/reupload.

---

## 5. HTTP status / header / caching semantics (observed)

- **Correlation:** `X-Request-Id` correlates a request and its response and is echoed; it is explicitly **never an idempotency key**. Absent/blank ⇒ the server generates one. Request pattern allows the 8-4-4-4-12 UUID (case-insensitive) with trimmed surrounding whitespace; response header is `format: uuid`.
- **Caching on held/financial reads:** Held v2 quote reads **ignore `If-None-Match`**, always return `200` on success, and expose **no ETag and no 304**. Private financial reads carry `Cache-Control: private, no-store`. The acquisition POST response does **not** promise that header.
- **Status/body agreement:** HTTP status equals `Problem.status`, and `code/type/title` are bound to the status via `oneOf`. `422` always includes nonempty `invalidParams`; header and body request IDs agree.
- **Auth-related statuses:** `401` carries `WWW-Authenticate: Bearer`; `403` is `FORBIDDEN`. (The auth mechanism itself is not described — see gaps.)
- **`503` scope:** Documented as "Provider outage alone does not cause this error" — it signals capability unavailability, not upstream market-data failure.

---

## 6. Acquisition vs held reads; provenance; completeness limits (observed)

- **Acquisition (`POST /v2/quotes`)** evaluates reuse or performs bounded upstream acquisition. `ORDINARY` may reuse eligible held evidence; `FORCE` bypasses reuse and may cause another upstream attempt. A retained prior observation does **not** fulfill a failed acquisition (`fulfilled=false`, `priorRetained` may be true). Correlation does not deduplicate attempts.
- **Held reads (`GET /v2/quotes`, `GET /v2/quotes/{symbol}`)** return retained committed evidence with **no provider contact, no acquisition, no freshness/reuse evaluation, no Decision traversal**. They do not convert old evidence into current evidence. Discovery is complete per committed item, with **no collection-wide single-instant snapshot** guarantee.
- **Provenance** records source `provider`/`environment`, the accepted upstream `acquisitionId`, `authorityEpoch`, a Wheelwright `acquisitionPhase` classification, and separate `receivedAt`/`committedAt` clocks. Reused/retained observations preserve original identity and clocks.
- **Completeness limits:** "Complete" is scope-specific. For transaction history, a complete delivered collection, a complete source traversal, a coherent upstream snapshot, and lifetime coverage are distinct claims; the doc states **lifetime coverage is UNKNOWN** and **provider snapshot consistency is UNVERIFIED**. Empty collections are meaningful (distinct from unavailable evidence). For artifacts, history coverage, corrections, and lifecycle reconciliation are explicitly **not established**. Portfolio Capital is a qualified two-source composite (not Account NAV / atomic observation); unmatched/ambiguous evidence stays null.

---

## 7. Does a documented capability permit operational execution?

**No.** The documentation states plainly that a published capability *describes* the API and that **operational actions require a separately commissioned task**; reading examples does not start an operation, and this reference never sends requests. A completed HTTP request does not establish fresh evidence, successful per-subject processing, or complete brokerage history. This report therefore does **not** certify publication and does **not** imply any permission to execute operations.

---

## 8. Documentation usability gaps (ambiguous or missing facts)

> Reported as documentation gaps only; **not** filled from implementation knowledge.

1. **Authentication mechanism undocumented.** `401 UNAUTHENTICATED` with `WWW-Authenticate: Bearer` and `403 FORBIDDEN` appear across operations, but the surface declares **no `securitySchemes` and no `security`** requirement. How to authenticate (token type, scheme, scopes, how to obtain a credential) is not described. A reader cannot construct an authenticated request from the docs alone.
2. **No usable base URL / server.** The only server is `url: "/"`, and all examples use the nonworking `api.example.invalid`. The real deployment origin and whether a version/host prefix beyond `/v2` applies are not stated.
3. **Error-response bodies for the write operations are not shown inline in the operation views.** `POST /v2/quotes` and `POST /v2/artifacts` reference shared problem responses (`Problem400`, `Problem401-2`, etc.), but concrete example error bodies are surfaced mainly on the held-read GETs. A reader must infer each write operation's exact error example from the shared `Problem` schema.
4. **No request example for `POST /v2/artifacts/{artifactId}/imports`.** The operation states "no body/query/reupload," which is clear, but there is no explicit minimal request template, and the exact `importId` vs `artifactId` relationship on retry is only implied.
5. **`authorityEpoch` meaning is undocumented.** The field is required in `QuoteProvenance` but its description is empty; its format, comparability, or how a consumer should interpret it is unspecified.
6. **Symbol codec round-trip is only partially exampled.** `EncodedQuoteSymbol` gives rules and a few mappings (`BRK/B → BRK_2FB`, literal `BRK_2FB → BRK_5F2FB`, `^SPX → _5ESPX`), but there is no exhaustive table or validator, and the interaction between the request `RequestedSubject` pattern (which allows `/`, `^`, `_`) and the path-token encoding is left for the reader to reconcile.
7. **`mode: FORCE` operational preconditions are vague.** It "requires actual permitted upstream contact," but what grants permission, and what distinguishes `CONTACT_NOT_PERMITTED` from `UPSTREAM_UNAVAILABLE`, is not defined in consumer terms.
8. **Rate limits / size caps beyond the stated ones are absent.** Only the 30-subject acquisition cap and the 1..16 MiB CSV size are given; request rate limits, concurrency limits, or throttling status codes are not documented.
9. **`X-Brokerage-File-Type` semantics per type are not detailed.** The enum is given, but what row shapes each type expects (and which columns are mandatory) is not in the surface, so a reader cannot build a conformant non-trivial CSV from the docs alone.
10. **Pagination strategy for large collections is unspecified.** `GET /v2/quotes` explicitly has none; for other GET collections (accounts, users, transactions, artifacts) the presence/absence of pagination is not stated here.

---

## 9. Separation of observation and inference

- **Sections 1–6** are observed documentation facts (verbatim constraints, enums, headers, descriptions).
- **Section 4 templates** are *reconstructions*: field names, types, and constraints are observed; the specific invented values (symbols, UUIDs, account ID, filename, CSV rows) are synthetic and chosen to satisfy the documented shapes.
- **Section 7** restates the doc's own non-execution stance.
- **Section 8** lists gaps as inference about *documentation usability only*; no gap is resolved using outside knowledge.

**Preserve this result unchanged for Principal assessment and subsequent independent conformance comparison. This report does not certify publication and confers no permission to execute operations.**