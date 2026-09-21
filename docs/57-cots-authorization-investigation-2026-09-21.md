# COTS Authorization Investigation — Evidence Record (`PL-ARCH-07`)

**Date:** September 21, 2026
**Status:** Current Specialized Reference (Category E) — bounded investigation evidence
**Authority:** Supporting evidence and why-state; **not** Wheelwright policy or ratified architecture
**Canonical identity:** `PL-ARCH-07` — Authorization Platform / COTS RBAC-FGA Evaluation (Build-vs-Buy)
**Concept home:** `PL-ARCH-03` (Security and User Accounts) — `PL-ARCH-07` **informs** `PL-ARCH-03`
**Research baseline SYNC:** `90098621332539e583c7c715cab5a125153368d2`
**PL-ARCH-07 intake commit:** `be128ee21545482f1a0d6bbe58480b431b0e5024`
**Reconciled into durable authority at SYNC:** `be128ee21545482f1a0d6bbe58480b431b0e5024`

---

## Purpose and scope

This document preserves the substantive evidence from a dedicated COTS authorization research session so that a future cold-start actor discovering `PL-ARCH-07` can recover the investigation from GitHub **without** the original conversation and **without repeating the research**.

It is an **evidence record**, not a decision. Nothing here selects a vendor, ratifies an architectural hypothesis, or authorizes implementation. The `PL-ARCH-07` parking-lot record remains the durable backlog identity; this document is the linked research artifact; the project journal carries why-state.

### Epistemic labels (preserved from the investigation)

- **[EXT]** External evidence (third-party docs/pricing/market material; point-in-time)
- **[FIND]** Finding / analysis produced by the investigation
- **[HYP]** Architectural hypothesis (candidate, not ratified)
- **[RATIFIED]** Principal-ratified decision
- **[OPEN]** Unresolved question

> **Discipline:** `[FIND]` and `[HYP]` must not be read as architecture. Only `[RATIFIED]` items are decisions, and the only ratified items here are relationship decisions (see final section), not authorization design.

---

## Existing authority discovered

- **[EXT]** `PL-ARCH-03` owns application-managed users, sessions, and ownership boundaries; its concept home proposes minimal `USER`/`ADMIN` roles and explicitly says not to introduce complex RBAC until a real use case demands it.
- **[EXT]** `PL-PORT-01` contains multi-account maturity work and historically stated a dependency on `PL-ARCH-03`.
- **[EXT]** `PL-OPS-01` owns cloud deployment and historically described itself as prerequisite context for `PL-ARCH-03`.
- **[EXT]** `LVT-INIT-REMOTE-AUTH` and AR10 already recognize authentication/authorization as a future remote-access / access-control concern.
- **[FIND]** No existing PL previously owned COTS authorization-platform evaluation or fine-grained resource authorization across Operators, BrokerageAccounts, and service actors.

## Why a distinct PL was warranted

- **[FIND]** `PL-ARCH-03` covers identity/session/basic ownership concerns.
- **[FIND]** Authorization-model selection and authorization-platform build-vs-buy are materially distinct concerns.
- **[FIND]** Folding this investigation into `PL-ARCH-03` would broaden its scope and lose the explicit build-vs-buy question.
- **[FIND]** The investigation was sufficiently developed that losing it would force meaningful rediscovery.

---

## Authorization model findings

- **[EXT/FIND] RBAC:** simple coarse application roles; weak where permissions differ per resource instance.
- **[EXT/FIND] ABAC:** flexible attribute-based decisions; reverse-query/auditability can be more difficult.
- **[EXT] ReBAC:** relationship-graph authorization; strong fit for per-resource relationships and reverse queries.
- **[EXT] FGA:** fine-grained authorization umbrella spanning relationship- and policy-based approaches.
- **[FIND]** Operator × BrokerageAccount permissions are naturally expressible as fine-grained per-resource grants.
- **[HYP]** ReBAC/FGA or policy+attributes may fit that future shape better than application-wide RBAC alone.

## Identity / BrokerageAccount implications

- **[FIND]** Authorization may eventually differ by actor and BrokerageAccount.
- **[FIND]** Illustrative capabilities discussed included `view`, `analyze`, `create_intent`, `broker_handoff`, `manage_policy`, and `administer`.
- **[OPEN]** Those names are **not** a ratified Wheelwright permission vocabulary.

## Authentication versus authorization

- **[FIND]** Keep authentication and authorization conceptually separable.
- **[HYP]** Authentication resolves a verified actor identity; authorization answers whether that actor may perform a capability against a Wheelwright-owned resource.
- **[HYP]** Authentication and authorization need not use the same provider.

## Human and service actors

- **[FIND]** Human Operators and service/AI identities can be modeled as principals with different grants.
- **[FIND]** Product-runtime authorization must not be conflated with Wheelwright's internal Kiro/Gate actor-governance system.

---

## Candidate platforms evaluated

### Cerbos

- **[EXT]** Policy/attribute authorization engine using principal/resource/request attributes and derived roles.
- **[EXT]** Self-hosted PDP can run as a small service without a separate application-data relationship database.
- **[EXT]** Policy may be version-controlled and decision logs can be produced.
- **[FIND]** Attractive for Wheelwright's deterministic, Git-versioned, appliance-like posture.
- **[HYP]** Strong candidate for deeper evaluation; **not selected**.

### OpenFGA

- **[EXT]** Zanzibar-style ReBAC engine with relationship tuples and reverse-query capabilities such as `ListObjects`/`ListUsers`.
- **[EXT]** Self-hosting requires a datastore such as PostgreSQL/MySQL/SQLite.
- **[FIND]** Strong when the relationship graph itself should be authoritative.
- **[FIND]** Adds tuple synchronization and datastore operational burden.
- **[HYP]** Strong candidate for deeper evaluation; **not selected**.

### WorkOS

- **[EXT]** Managed FGA/auth ecosystem.
- **[FIND]** Low operational burden and quick adoption.
- **[FIND]** External authorization requests introduce network/vendor availability dependency.
- **[FIND]** Combining authn/authz in one ecosystem should not force Wheelwright to couple them.

### Permit.io

- **[EXT]** Hybrid managed-control-plane + PDP approach supporting RBAC/ABAC/ReBAC-style models.
- **[FIND]** Relevant where managed policy administration is valuable while keeping decision evaluation local.

### Auth0 FGA

- **[EXT]** Managed ReBAC/FGA service with OpenFGA lineage.
- **[FIND]** External API dependency and managed log-retention characteristics are relevant to an audit-conscious appliance.

### Additional candidates

- **[EXT]** Amazon Verified Permissions / Cedar, OPA, SpiceDB/AuthZed, Oso, Aserto, PlainID and others surfaced.
- **[OPEN]** These were **not** deeply evaluated during this investigation.

---

## Deployment and topology findings

### Render deployment

- **[FIND] Cerbos private service:** strong Render fit; Docker/private service; no dedicated authorization datastore required for core decisions.
- **[FIND] OpenFGA private service:** feasible, but adds a relationship datastore, likely managed PostgreSQL, backups/migrations, and another availability dependency.
- **[FIND] Managed SaaS:** trivially reachable over HTTPS but creates an external per-decision network and availability dependency.
- **[FIND]** "Runs in Docker" alone is **not** a sufficient deployment criterion.

### Deployment model

- **[FIND] Managed SaaS:** low operational burden, higher external dependency and lock-in.
- **[FIND] Hybrid:** managed authoring/control with local decision point.
- **[FIND] Self-hosted/open-source:** more operational ownership, better local determinism and escape path.
- **[HYP]** Self-hosted/open-core deserves particular consideration because of Wheelwright's self-contained/deterministic posture.

### Datastore implications

- **[EXT/FIND]** Cerbos PDP can avoid a second domain relationship datastore.
- **[EXT/FIND]** OpenFGA requires a relationship datastore and synchronization of authorization tuples.
- **[FIND]** Datastore burden is therefore a material differentiator.

### Latency / availability / failure behavior

- **[FIND]** Embedded/sidecar authorization minimizes external failure modes.
- **[FIND]** Separate private authorization service introduces an internal dependency.
- **[FIND]** Managed SaaS introduces network and vendor availability dependencies.
- **[FIND]** Consequential/capital-path authorization must **fail closed**.
- **[HYP]** Wheelwright's fail-closed / Authority-Before-Consumers posture favors evaluating local/self-hosted decision points.

### Auditability

- **[FIND]** Authorization decision evidence should fit Wheelwright's provenance posture.
- **[EXT]** Cerbos supports structured decision logging and Git-managed policies.
- **[FIND]** Managed retention windows and provider-specific audit semantics must be evaluated rather than assumed sufficient.

### Local development / determinism

- **[FIND]** OSS/self-hosted engines permit deterministic local/offline development more naturally than SaaS-only authorization.

---

## Economics

**Point-in-time pricing observed during the research on September 21, 2026:**

- **[EXT]** Cerbos PDP: OSS/free; Cerbos Hub had a small free tier and paid plans.
- **[EXT]** OpenFGA: OSS/free; infrastructure/datastore cost remains.
- **[EXT]** WorkOS: free/usage tiers and paid scale pricing.
- **[EXT]** Amazon Verified Permissions: usage-priced.
- **[FIND]** At Wheelwright's likely near-term actor count, economics alone do not force paid authorization infrastructure.
- **[OPEN]** **Reverify all vendor pricing before making any economic decision.**

## Vendor lock-in / escape paths

- **[FIND]** OSS/open-core solutions generally provide stronger escape paths than managed-only services.
- **[HYP]** Keeping Wheelwright's domain identities and authorization seam internal reduces migration cost.

## Build versus buy

- **[FIND]** Building minimal RBAC/basic ownership is straightforward.
- **[FIND]** Building correct fine-grained relationship authorization becomes substantially more complex.
- **[FIND]** COTS engines can reduce authorization-engine/security burden but add infrastructure or vendor dependencies.
- **[HYP]** A plausible near-term posture is minimal app-owned ownership/RBAC plus a clean authorization seam, deferring COTS adoption until justified. **This is not a ratified direction.**

---

## What Wheelwright should probably own regardless of provider

*All items below remain architectural hypotheses unless already independently ratified elsewhere.*

- **[HYP]** Wheelwright-owned `operatorId`.
- **[HYP]** Wheelwright-owned `brokerageAccountId`.
- **[HYP]** Ownership/account provenance on durable account-local records.
- **[HYP]** A centralized authorization seam conceptually equivalent to `may(actor, capability, resource)`.
- **[HYP]** An actor abstraction capable of representing human and service principals.
- **[HYP]** Fail-closed behavior for consequential gated operations.

## What the investigation does NOT justify implementing

- **[FIND]** No authorization platform.
- **[FIND]** No RBAC engine.
- **[FIND]** No ReBAC/FGA relationship graph.
- **[FIND]** No authorization policy DSL.
- **[FIND]** No new authorization database.
- **[FIND]** No authentication implementation.
- **[FIND]** No multi-Operator implementation.
- **[FIND]** No vendor procurement.
- **[FIND]** No coupling of multi-BrokerageAccount support to authorization-platform selection.

## Open questions

- **[OPEN]** RBAC versus fine-grained/relationship authorization.
- **[OPEN]** Build versus buy.
- **[OPEN]** Evaluation criteria and weighting.
- **[OPEN]** Final permission vocabulary.
- **[OPEN]** Whether COTS authorization is needed before a second Operator exists.
- **[OPEN]** How authorization relationships should be persisted or derived.
- **[OPEN]** Whether deeper evaluation of Cedar/AVP, SpiceDB, Oso, Aserto, PlainID, etc. is warranted.

---

## Principal-ratified relationship decisions

*These are the only ratified items in this record. They are relationship decisions, not authorization design.*

- **[RATIFIED]** `PL-ARCH-07` **informs** `PL-ARCH-03`.
- **[RATIFIED]** `PL-ARCH-07` does **not** depend on / is **not** enabled by `PL-OPS-01` for research/design.
- **[RATIFIED]** `PL-OPS-01` is **deployment context** for eventual runtime multi-Operator authorization.
- **[RATIFIED]** `PL-PORT-01` is **not blocked** by COTS authorization selection or multi-Operator implementation.
- **[RATIFIED]** Near-term multi-BrokerageAccount work may proceed with one implicit Operator **while preserving an authorization seam**.

---

## External sources used in the investigation

Treat third-party market comparisons as supporting evidence, not primary authority. Content was rephrased for compliance with licensing restrictions.

- WorkOS FGA docs — `https://workos.com/docs/fga`
- WorkOS FGA guide — `https://workos.com/guide/the-developers-guide-to-fine-grained-authorization`
- WorkOS authorization-platform material — `https://workos.com/blog/best-authorization-platforms-ai-agent-permissions-2026`
- WorkOS pricing — `https://workos.com/pricing`
- Cerbos vs OpenFGA — `https://www.cerbos.dev/cerbos-vs-openfga`
- Cerbos pricing — `https://www.cerbos.dev/pricing`
- Cerbos OSS vs paid — `https://cerbos.dev/blog/open-source-vs-paid-cerbos`
- OpenFGA production guidance — `https://openfga.dev/docs/best-practices/running-in-production`
- OpenFGA Docker setup — `https://openfga.dev/docs/getting-started/setup-openfga/docker`
- Permit.io ReBAC/OpenFGA comparison — `https://www.permit.io/blog/rebac-in-practice-permitio-vs-openfga`

---

## Content deliberately not persisted

- **Conversational back-and-forth** and prompt scaffolding from the research session — not evidence; would bloat the record.
- **Deep per-vendor feature matrices** for candidates marked `[OPEN]` / not deeply evaluated (Cedar/AVP, SpiceDB, Oso, Aserto, PlainID) — the investigation did not produce them; recording placeholders would fabricate depth.
- **Any pricing beyond the point-in-time September 21, 2026 snapshot** — must be reverified, not cached as fact.

## Provenance / why-state

- Parking-lot identity and dependency wording: `docs/parking-lot-9.md` → `PL-ARCH-07` (committed `be128ee`).
- Why-state entries: `docs/journal/project-journal-5.md` (2026-09-21 `PL-ARCH-07` intake; 2026-09-21 COTS reconciliation).
- Research baseline SYNC `90098621332539e583c7c715cab5a125153368d2`; intake commit `be128ee`.
