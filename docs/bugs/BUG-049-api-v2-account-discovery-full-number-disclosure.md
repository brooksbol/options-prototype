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
