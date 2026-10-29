# Independent production-remediation source review — 2026-10-29

**Disposition: ACCEPT within the bounded remediation scope** for immutable `a904be6c0e5ce240d0b5293af7ba51211a3fef6b`. No material counterexample was established in the independently exercised contract, scope, detail-isolation or compaction paths. This is scoped source acceptance, not deployment authorization, installed-runtime verification or Principal Product acceptance.

Independent detached source: `/tmp/ww-independent-remediation-review-20261029`. The reviewed source tree remained clean. Earlier accepted/rejected reports were not modified. No protected payload, live acquisition, external model, installed service or grant operation occurred.

## Acquisition identity semantics

The existing backend response contract permits opaque nullable artifact/snapshot strings; snapshot identity is not a UUID contract. The adapter now preserves that distinction while retaining exact Account/request correlation, acquisition UUID, finite outcome checks and required nonempty references for ACCEPTED. It does not turn references into client/provider addresses.

My independent actual MCP invocation used an accepted response containing a non-UUID artifact reference and `snapshot-<uuid>`. It returns ACCEPTED after exactly one backend POST. An independently injected non-string reference is refused. The existing backend grant check and provider authentication remain outside the agent and unchanged. This accepts backend identity semantics without granting access or asserting inventory/financial completeness.

## Monitoring disclosure and pagination

My process-owned MCP/HTTP harness calls the real frozen MCP server with competing inputs. Projection=expanded, includeInactive=true and lifecycle state overrides are rejected before any backend read. An ordinary monitoring call requests exactly tactical projection, limit5 and explicit `OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED`, with no expansion or OPEN selector. The next opaque cursor is propagated with unchanged selection; a first page remains explicitly incomplete, and an end page returns null continuation.

The helper's broader implementation remains available to deliberate non-advertised callers, but the advertised tool has a strict Account/cursor schema and forces its monitoring representation. No new backend default membership semantics or Account grants are introduced. These synthetic tests establish deterministic tool request scope; they do not certify the current real Account row count, actual token budget or full portfolio completeness. The reported actual SDK replay is author evidence, not this review's independent measurement.

## Exact detail isolation

The new detail tool performs exactly discovery → one selected Position → its returned current Construction. It never requests an expanded Account collection. Independent negatives reject a foreign Position Account, foreign Construction Account, changed parent Position, external Construction link, malformed correlation header and invalid Position identity. An unknown nickname stops after discovery. Position/Construction responses correctly use header-owned request correlation; no invented response-body requestId requirement is imposed on those resource contracts.

The backend continues to authorize each item read and sanitize source-dependent fields. Canonical parent/Account/link checks establish the bounded relationship read, not economic continuity or an atomic cross-request brokerage snapshot. No new permission is inferred from a link.

## Compaction and financial meaning

I compiled the exact new PortfolioTactical class and exercised a separate synthetic sanitized representation. It preserves an exact six-place financial decimal, currency/unit/status, source clock, origin, method and assumptions for a known metric. It also preserves explicit source qualification and redaction state. Null unavailable PRICE retains value=null, units/currency/status/reason code while omitting origin/method/computation asOf/assumptions. Repeated evidence arrays do not survive the monitored representation. Canonical Position/Construction links remain available for deliberate evidence retrieval.

The production delta changes representation only; it does not modify financial calculations, fees, quantity allocation, history coverage, CSV accounting or acquisition authority. Financial metadata that is non-null or qualified/established retains the additional metadata even when another status would otherwise be unavailable. This avoids silently dropping an informative non-null source value.

Independent structural OAS checks confirm known/unavailable emitted metrics satisfy their required/allowed-field sets and conditional metadata requirement. Compact Exposure/OptionTerms retain the original semantic allOf constraints; removing repeated evidence did not remove those constraints. This is scoped schema-structure verification, not a new full emitted-DTO/OAS validation run. A standalone JSON Schema validator was unavailable in the review environment, so no independent full-schema claim is made. The author's reported conformance run remains separately attributed evidence.

## Evidence and reproduction

Independent fixtures/check-only receipts: `/tmp/ww-remediation-independent-evidence-20261029/`.

```sh
python3 /tmp/ww-remediation-independent-evidence-20261029/run_java.py
python3 /tmp/ww-remediation-independent-evidence-20261029/run_node.py
node /tmp/ww-remediation-independent-evidence-20261029/detail_probe.mjs
```

`CompactionProbe.java` invokes the exact new projection. Its local classpath records previously built unchanged support classes; no new full Java suite is claimed. `mcp_probe.mjs` runs the actual MCP server against process-owned synthetic HTTP replies and checks strict arguments, fixed scope, pagination, opaque references and exact detail reads. `detail_probe.mjs` supplies independent adversarial response/link cases. Temporary local dependency links are removed by the harness; no package installation or source edit occurs.

Receipts: `compaction-checks.json`, `mcp-checks.json`, `detail-checks.json`, `schema-structure-checks.json`. All stored checks passed. All source records, identifiers and amounts in these fixtures are invented. No author test was used as the independent oracle. Author398-Java/55-Talk/8-OAS results and the actual SDK replay were not independently rerun or promoted into full-suite/Principal acceptance.

Original financial/coverage/privacy limitations remain: incomplete history is not complete monthly performance, reported acquisitions are not governed strategy or continuous custody, source clocks are distinct from computation time, and compaction is not a full authorization audit. Unrelated v1 liquidity/BUG055 and all operational decisions remain outside this source review.

CURRENT STATE: Exact a904be6c independently accepted for bounded monitoring, opaque acquisition identity and deliberate detail/compaction remediation.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return immutable source-acceptance evidence for commissioning-actor reconciliation.
