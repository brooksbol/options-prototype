# BUG-049 — API v2 Account discovery exposes full brokerage account numbers

- **Status:** Open — filed October 22, 2026
- **Component:** API v2 Account metadata discovery
- **Authority:** Principal explicitly identified exposure as a bug and proposed file → fix → audit other PII/sensitive disclosure → fix → resume H-004 with real authorized Accounts.
- **Severity:** Significant disclosure defect; actual external exposure or cross-User access not established.
- **Relationship:** Distinct from resolved BUG-035 (CLI masking). That correction did not change API payloads. Under PL-CONV-01 full Account-number API payload capability had been deferred; the Principal now directs correction of ordinary discovery disclosure.

## Source-confirmed behavior

- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountDirectory.java`: `BrokerAssociation(String broker, String accountNumber)` and `Account(..., BrokerAssociation brokerAssociation)` are ordinary serialized records populated from `brokerage_account.broker_account`.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountsController.java`: both `GET /v2/accounts` and `GET /v2/accounts/{accountId}` serialize `AccountDirectory.Account` through `ObjectMapper.writeValueAsString`, without an API projection that excludes the full number.
- Account-grant checks protect which Account records can be read, but a mere `account.read` metadata grant does not establish a separate authority to disclose full brokerage numbers.
- `docs/77-api-v2-architectural-guardrails.md` Account confidentiality section prohibits full numbers in resource links and treats account numbers as sensitive and broker-scoped; full-number payload disclosure capability remains unresolved in earlier authority.
- Source examination establishes the serialization path, not proof that an unauthorized User obtained another User's Account or that an external LLM actually received any real Account number.

## Expected behavior / defect boundary

Ordinary authenticated Account metadata discovery must not expose full brokerage account numbers. Preserve backend Account identity, alias/nickname, broker label, per-Account grants, and legitimate trusted broker integrations. Decide the correct default API representation (omit or mask), and reserve any exceptional full-number access for an explicitly authorized separate capability and Product decision. Do not assume CLI masking or MCP projection repairs the backend defect.

## Acceptance / falsifiers for a separately assigned fix

1. Both collection and instance Account reads use the accepted no-full-number default disclosure contract.
2. A metadata-authorized User can discover the Accounts they are entitled to without receiving full brokerage account numbers.
3. Different Users, absent/invalid credentials and grant failures retain accepted authorization semantics; collection and instance paths do not leak unauthorized Account identity.
4. API contracts/examples/client compatibility and tests reflect the selected representation.
5. Regression probes cover short/missing/malformed numbers and response body, links, errors and relevant redirection/logging surfaces, without logging real numbers.
6. No regression to established internal brokerage binding/Account identity, `ww` nicknames or accepted H-001 through H-003.
7. Independent acceptance, deployment and Principal operator acceptance are separately recorded; do not infer any from author tests.

## Subsequent bounded work

After fixing this defect, **audit API v2** for additional PII or inappropriate sensitive disclosure in payloads, URLs, error responses, generated examples/specifications, logs and agent-facing boundaries. File distinct evidence-backed defects as needed and remediate them under the applicable authority. Treat financial sensitivity separately from formal PII. Do not call every exposed financial value a bug: compare against accepted Product contract and grants.

Only then resume H-004 against **real authorized Account metadata**, with a verified model-egress disclosure boundary and actual `wwt` operator observation. The earlier synthetic-fixture plan is not assumed to be the Product target. Retain synthetic/test fixtures as needed for deterministic negative testing, not as a substitute for the real operator experience.

## Operational freeze

The collided H-004 local candidate is frozen and unaccepted. Installed `wwt` points at the mixed launcher, and an earlier build rewrote classes within the running v1 backend's classpath. No build, runtime restart, mixed-tree cleanup or H-004 implementation is authorized by this filing. Remediation engineering must work in an isolated environment with explicit candidate and independent review controls.

**Current state:** BUG filed; no fix, audit or deployed correction claimed.

## Additional Principal requirement — October 22, 2026: model safety gate

The Principal added: **“oh, and figure out if the model is actually safe to use”**. This is a separate, explicit prerequisite to allowing actual authorized financial data into `wwt` inference. API disclosure repair or absence of conventional PII is **not** sufficient proof of model safety.

Before Step 4 real-data operator use, conduct a bounded, independently reviewed **provider-plus-application assessment** of the exact `wwt` model, API endpoint/features, API account/project settings, and host implementation. Document at least:

1. Provider terms applicable to this API use: default training/data-sharing policy, abuse-monitoring/application-state retention, available zero/modified-retention eligibility and actual enrollment, provider personnel access, subprocessors and transport controls. Distinguish documented generic policy from actual account-specific settings; do not assert ZDR is enabled without proof.
2. Effective `wwt` runtime: model identifier, Responses API storage configuration, tool transcript/history re-submission, logging, telemetry, secrets, process environment, output retention, external destination and error paths. Trace exactly which prompts, tool results and metadata leave the host; synthetic canary probes are allowed only in an isolated review environment.
3. Threats: prompt injection in broker/market metadata; unauthorized request expansion; cross-user Account/context mixing; leaking sensitive fields through answers, logs, model tool arguments or provider state; hallucinated claims and replay of stale observations.
4. Minimum enforceable controls: backend-authoritative grants; explicit allowlisted field projection and destination; credential non-egress; bounded model tool privileges; separation of User context; response grounding and failure behavior; observability/falsifiers and independent verification.
5. Residual risk and an explicit **GO / CONDITIONAL GO / NO-GO** for *the specific Account-metadata interaction*, separating technical safety from Principal risk acceptance. If the documented/provider settings and host code cannot establish the needed guarantees, do not send live Accounts to inference; the trusted local host can render authoritative Account discovery while the question-routing model sees no Account details pending resolution.

OpenAI currently publicly states API inputs/outputs are **not used for model training by default**, subject to explicit opt-in, but normal API abuse-monitoring retention may apply (generally up to 30 days with exceptions), and ZDR is **eligibility/configuration-dependent**. These general commitments must not be substituted for inspection of this actual deployment. References: https://openai.com/enterprise-privacy/ and https://openai.com/index/offering-zero-data-retention-for-frontier-models/ (2026 updates). This record does not claim that the local API project is ZDR-enabled, that host egress is verified, or that the model is cleared for real financial information.

**Revised sequence:** BUG-049 fix → API v2 PII/sensitive disclosure audit and necessary fixes → model/provider/host safety gate → real-data H-004 `wwt` interaction, conditional on verified authorization and Principal acceptance. The mixed H-004 candidate stays frozen until separately handled.


## Codex remediation candidate — October 22, 2026

**Standing:** implemented candidate in an isolated checkout based on `241cbabbefef996febe9f83f7f1f872cd609d19e`; author verification only. BUG remains **Open** pending independent acceptance. No commit, integration, deployment or real-data/model clearance is claimed.

**Default representation:** omit brokerage account numbers entirely, including masked numbers. Both `GET /v2/accounts` and `GET /v2/accounts/{accountId}` serialize an explicit allowlisted metadata record containing only `id`, `alias`, `displayName`, and `brokerAssociation.broker`. Internal `AccountDirectory` records and broker bindings are unchanged; there is no database migration or new full-number capability. The existing masking maximum permits withholding the number entirely.

**Compatibility:** the OAS and its two Account examples reflect the number-free representation. The `ww` discovery validator no longer requires a brokerage number, preserving nickname resolution and broker-dependent synchronization. Existing table/TSV rendering uses its established withheld-value `****` fallback; JSONL reflects the number-free response. Legacy response handling remains available for existing installations. Consumers that required the removed sensitive field must adopt the corrected contract; unchanged legacy clients are not claimed compatible with the new backend.

**Proof:** new backend tests cover both Account reads, distinct User scopes, ungranted/admin-only/empty scope, missing/invalid authentication, internal-binding preservation, and short/missing/malformed number projection. CLI tests cover number-free discovery and table/TSV/JSONL. The documentation validator permits only this exact Account schema delta while preserving other baseline wire/security checks; mutation tests reject number reintroduction and unrelated identity/broker/schema changes.

**Isolation:** `/tmp/wheelwright-bug049-codex-20261022` is a separate Git clone with its own build outputs. No compilation runs in the frozen H-004 tree, and no operational service, database, configuration, credential or installed `wwt` is changed. Documentation output is an unpublished temporary preview; release acceptance metadata is unchanged. H-001 through H-003 source is unchanged.

**Remaining boundaries:** independent review of the exact candidate; separate persistence/integration and operational authorization. The broader API sensitive-disclosure audit, model/provider/host safety gate and real-data H-004 interaction remain subsequent work and are not certified by this fix.


### Author verification results

- Full isolated Java regression: **1,018 tests, 0 failures, 0 errors, 2 optional skips**, BUILD SUCCESSFUL in **5m38s**. Final additions to the same two disclosure tests (invalid/denied response checks and capture emission) then passed a focused rerun in **8s**; production/OAS bytes were unchanged between these runs.
- Relevant CLI regression: **21 passed, 0 failed**, including Account discovery, confidentiality, sync, historical observation consumption and Position alias compatibility. The initial fresh-clone run lacked Java-generated historical captures; after the full Java suite generated them, the complete rerun passed. No mocked pass is substituted for that prerequisite.
- **4 emitted Account responses** validate against the corrected operative collection/instance schemas; **4 full-number reintroduction mutations** are rejected.
- Existing operative runtime/source/evaluator validation: **184 route representations + 5 standalone representations**, 45 route/status combinations, **0 schema violations**. These fixture counts are not live endpoint or production-security coverage.
- Existing OAS conformance **7/7**, operative integration **4/4**, and disclosure-delta guard tests **2/2** passed.
- Unpublished documentation build/validation passed: **36 internal operations / 295 examples; 32 public operations / 263 response examples**. Renderer emitted warnings; strict existing example/wire/security validation passed. No browser inspection or publication is claimed.
- Roadmap projection regenerated from canonical sources and freshness check passed. Generation also incorporates already-accepted collision/index continuations missing from the baseline projection; those source records were not altered.
- No independent review, installed operator observation, broader disclosure audit, provider assessment or live-model test was performed.

## Independent acceptance and installed delivery — October 23, 2026

The Principal supplied Kiro **ACCEPT** of revised 12-file archive SHA-256
`1e27c1f6f1c374ca8cb6e850c4583568b91156b379e313cbe27817694a346366`
and explicitly authorized final post-checks and coordinated integration/deployment.
Post-test manifest hashes and operational isolation both passed. Exact accepted
source is integrated at `dbdd6ea037a8ed8d6be57da403e95d0f569a0300`.
Corrected backend and matching ww client are installed together; ordinary installed
Account reads pass with no number fields and a nickname-first human table.
Canonical identity, grants, bindings and retained evidence were preserved; v1 and
frozen H-004 remained untouched. [Delivery/verification receipt](../reviews/bug-049-integration-deployment-2026-10-23.md).

**Status remains Open — Principal operator acceptance pending.** Earlier
candidate-only/pending-review statements describe their recorded phase; they do
not override this later delivery evidence. Explicit JSONL against an old backend
can still expose its full-number payload, reinforcing paired deployment. The
artifacts brokerAccount finding remains separate and is not remediated by BUG-049.
