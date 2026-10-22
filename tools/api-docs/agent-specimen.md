# Current accepted scope — October22

The foundational Holdings integration has36 authoritative/32public operations. Current machine reconstruction is validate.py and its private agent-specimen.json; accepted wire comparison is b48e3c6. Full expanded API source and source-evidence boundaries are in docs/api-v2/README.md and the deployment record. The following19-operation answer table is historical October15 evidence, not current API inventory.

# Read-only agent consumption specimen — PL-API-02 Step 2

This is author verification evidence and a repeatable review exercise, not another API contract, an execution interface, or independent Step 3 approval. Start at `docs/api-v2/README.md`; use repository OAS and linked Product/domain contracts. Do not use the CLI, generated public projection or rendered HTML as inventory authority. Do not invoke any API.

**Subsequent Principal black-box decision (remote main 65bbd48):** This internal author specimen is not Kiro's acceptance test input. Kiro receives only fresh test instructions and the supplied public static entry point; do not give Kiro this answer table, private reports, repository source, internal OAS or internal contracts. Kiro reports gaps without reverse-engineering. Separate Codex review may compare results with authoritative internal contracts only after the isolated test. Kiro's test remains pending; the coequal repository-OAS verification here does not replace it.

Run `python tools/api-docs/validate.py` after building. Its private `agent-specimen.json` records each operation, source, parameters, request schemas, responses, headers, security requirements and linked semantic source. It validates the actual examples against those schemas and compares wire constraints/security with accepted main `450106a`. The existing source inventory checks the operation set independently.

## Reconstruction observed from repository sources

| Question | Recovered answer and evidence |
| --- | --- |
| What exists? | The common OpenAPI 3.1.1 entry resolves two local fragments into 19 operations / 17 paths. Each has a unique stable operation ID; tags and names aid discovery without replacing those IDs. |
| How is quote acquisition requested? | `acquireDirectQuotes`, POST `/v2/quotes`: JSON subjects, 1–30 distinct canonical symbols, optional ORDINARY/FORCE mode. `AcquireQuotesRequest` supplies constraints; its synthetic example validates. Request correlation is optional and is not deduplication. |
| What does its success mean? | `AcquireQuotesResponse` reconciles individual terminal outcomes. HTTP 200 means completion, not universal fulfillment. NEWLY_ACQUIRED/REUSED carry fulfilled evidence; retained prior evidence does not fulfill a failed request. See the linked direct-quote Product contract. |
| How are held reads different? | `listHeldDirectQuotes` and `readHeldDirectQuote` are GET, no query/nonempty body, independent quote.read authority, no provider contact/revalidation/freshness evaluation. Discovery returns bounded summaries; detail returns the full committed observation. If-None-Match is ignored; no ETag/304. See both linked held contracts. |
| How is a CSV submitted? | `retainAndProcessAccountArtifact`: required canonical Account selector, text/csv bytes, filename-bearing Content-Disposition and one supported CSV X-Brokerage-File-Type. API_POSITIONS/API_TRANSACTIONS are retained source metadata types, not uploads. HTTP 200 processing REJECTED preserves the source and earlier admitted evidence. |
| How are errors/headers recovered? | Each response lists media type, schema and header map. HTTP status agrees with Problem status/code/type/title; 422 requires invalidParams. Header/body request IDs agree. Financial reads use private,no-store; quote POST does not promise that header or WWW-Authenticate. Original content is an attachment. |
| What provenance/coverage limits matter? | Quote receipt/commit/source-event clocks differ. Position export dates do not establish intraday execution or lifecycle continuity. Account history lifetimeCoverage is UNKNOWN and providerSnapshotConsistency UNVERIFIED; full response delivery is not lifetime coverage. Fidelity row equivalence is not broker transaction identity. Portfolio Capital is a qualified composite with explicit gaps. Refer to the linked contracts/accepted-delivery records. |
| Does an advertised API permit an agent to act? | No. Standard OAS security and x-required-grants describe caller requirements; IDs and users.admin do not grant financial authority. Current Principal/task authority separately governs operational acquisition, persistence, service/deployment and consequential actions. The repository entry and Doc 77 preserve this boundary. |

Author outcome: reconstruction succeeds using source OAS and linked contracts, with no HTTP/provider calls or operational mutation. The human projection strips internal instructions for presentation; agents use the full authoritative OAS. An independent reviewer must repeat this exercise from the exact candidate and challenge the answers, not accept this table as proof by itself.
