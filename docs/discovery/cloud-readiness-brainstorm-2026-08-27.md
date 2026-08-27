# Cloud Readiness Brainstorm — 2026-08-27

> **Status:** Exploratory snapshot — candidate concerns, not requirements or accepted architecture
>
> **Context:** Principal/ChatGPT brainstorming after reviewing the current Wheelwright cloud direction and scanning `brooksbol/-kiroj1` (Gem Compass) for potentially useful architecture/design ideas.
>
> This document deliberately preserves unfinished thought. Nothing here silently supersedes `docs/24-cloud-deployment.md`, the governing architecture, ADRs, or foundations.

## Why this snapshot exists

The cloud migration discussion is not yet being worked in earnest. The Principal generated a broad set of concerns off the top of his head and explicitly cautioned that perhaps half of them are unnecessary now.

The purpose of this snapshot is therefore **recall, not scope**: preserve the candidate concerns so a future cold-start actor can resume the investigation without relying on conversation memory.

A useful eventual classification may be:

- needed for initial cloud migration
- needed soon after
- worth designing for but not implementing
- explicitly deferred
- not justified / not applicable to Wheelwright

The governing attitude is proportionality: a concern should be considered; consideration does not imply implementation.

## Principal's six high-level quality attributes

The Principal identified six top-level "-ities" as the preferred quality frame:

1. **Security**
2. **Reliability**
3. **Maintainability**
4. **Scalability** — explicitly includes performance for this framework
5. **Extensibility**
6. **Usability**

These are qualities. Specific technologies and controls below are possible mechanisms, not ends in themselves.

## Candidate concerns raised

### Engineering assurance

- Sonar / SonarQube-style code quality analysis and quality gates
- Checkmarx-style application security scanning
- CI quality/security gates before promotion
- Dependency / software-supply-chain security
- SBOM / artifact provenance as a possible consideration

### Architecture standards and governance

- Well-Architected Framework or similar established standards as an assessment rubric
- Wheelwright-specific architectural invariants and guardrails
- Evidence-based cloud readiness rather than an informal claim that the system is "cloud ready"
- Explicitly distinguish considered/deferred/N/A from required implementation

### Proxy, caching, and CDN behavior

- Reverse-proxy caching semantics
- Browser/intermediary cache behavior
- CDN use
- Static assets vs evidence/status/recommendation APIs
- Staleness and freshness semantics are especially important because stale decision-support data can be misleading
- Consider `Cache-Control`, ETags, TTLs, and `no-store` where appropriate rather than allowing platform defaults to decide correctness

### Containers

- Explicitly consider containerization rather than assuming cloud means Docker
- Reproducibility
- local/production parity
- portability
- supply-chain/base-image scanning and patching
- startup/operational overhead
- Current accepted Render direction says native Java/Gradle/JAR deployment and no Docker complexity; this brainstorm does not change that decision

### API security and user access

- API authentication and authorization
- User login
- CORS / CSRF
- TLS assumptions
- session/token lifecycle
- brute-force / abuse controls
- rate limiting
- whether the API should be publicly reachable at all

### User identity lifecycle / IAM

- identity provisioning
- password storage policy if Wheelwright ever owns passwords
- password recovery/reset
- email verification
- MFA / passkeys
- session revocation
- account lockout
- roles/authorization if multiple users emerge
- identity audit trail
- account deletion/recovery
- evaluate whether Wheelwright should own identity at all versus using a managed identity provider

### Administrative / third-party access

- Cloud console/API administrative access
- human vs machine identities
- least privilege
- MFA
- service/API tokens
- credential rotation/revocation
- audit logs
- break-glass access
- production/non-production separation

### Tradier access

Treat Tradier as a business-critical external dependency, not merely a secret:

- sandbox vs production credentials
- secure token storage/injection
- least privilege where supported
- rotation/revocation
- rate limits
- provider availability
- timeout/retry policy
- prevent credentials from leaking into logs
- environment isolation
- preserve a strong future distinction between **market-data access** and any eventual **brokerage/trading authority**; those are different risk classes

### Edge / perimeter / network

- WAF
- DDoS protection
- DNS
- TLS/certificate ownership
- CDN
- rate limiting / bot or abuse protection
- public vs private surfaces
- VPC/private networking/network isolation
- ingress and egress rules
- outbound access to Tradier
- admin access paths
- environment isolation
- whether Render's networking capabilities are sufficient
- "no VPC needed" is a valid possible outcome after evaluation

### FinOps

- Always-on compute cost
- persistent disk
- logs/telemetry cost
- egress
- object-storage backup cost
- monitoring/security tooling
- CI usage
- future managed database or identity cost
- budgets and alerts
- baseline expected spend
- identify architectural decisions that materially change cost
- keep FinOps an architectural concern rather than an after-the-fact billing exercise

### Environmental fidelity / staging

Open question: **what constitutes staging for Wheelwright? Could the laptop be a staging tier?**

Candidate environment model discussed:

- developer local — fast iteration; mocks/stubs permitted
- local production-parity — same packaged artifact/configuration contract, real SQLite, realistic provider integration where safe
- cloud pre-production — validates hosting-platform concerns the laptop cannot reproduce
- production — authoritative appliance

Production characteristics whose fidelity may matter include:

- Java/runtime version
- packaged artifact
- configuration model
- SQLite/WAL behavior
- startup/shutdown path
- acquisition scheduling
- external dependency behavior
- Render networking
- persistent-disk mount semantics
- TLS termination
- platform restart behavior
- environment-variable injection
- public ingress
- proxy/cache behavior

Working hypothesis only: the laptop may be an important staging tier but probably cannot be the **only** staging tier because it cannot validate the hosting-platform boundary.

### CI/CD and release engineering

Candidate principle: **build once, verify repeatedly, promote the same artifact.**

Possible flow, to be evaluated rather than assumed:

`commit/PR -> compile/test -> Sonar -> Checkmarx -> dependency/SBOM checks -> package -> integration/migration tests -> pre-prod -> smoke/restart/health tests -> approval/promotion -> production -> post-deploy verification`

Questions:

- Is `main` always releasable?
- automatic production deploy vs explicit approval?
- rollback semantics?
- database forward/backward compatibility?
- secret rotation without rebuild?
- version tagging and artifact provenance?
- can deployment accidentally create two acquisition authorities?

Important Wheelwright-specific concern: generic rolling or blue/green deployment can conflict with the single-acquisition-authority invariant if old and new instances overlap. A generally fashionable deployment strategy is not automatically correct for Wheelwright.

### Configuration / environment management

Candidate separate concern:

- profiles
- secrets
- environment-specific endpoints
- feature flags if justified
- seed data
- database paths
- preventing production credentials/data from leaking into non-production
- eliminate accidental localhost/workspace-relative assumptions from production contracts

### Disaster recovery

DR is a concern even if the correct implementation is intentionally small.

Distinguish **high availability** from **disaster recovery**. Current intuition: Wheelwright probably does not need HA now, and redundant active instances can conflict with single acquisition authority.

Candidate DR questions:

- Can application/runtime be reproduced from GitHub/artifacts?
- Can secrets/configuration be reconstructed independently of a failed host?
- Are SQLite backups recoverable and stored outside the failed persistent disk?
- Is restore actually tested?
- What RPO is appropriate?
- What RTO is appropriate?
- Does recovery preserve one acquisition authority?
- Which evidence/state is reconstructible through reacquisition and which is genuinely irrecoverable?

Possible Wheelwright-specific principle to investigate: protect decisions and irreproducible evidence strongly; reacquire what can safely be reacquired.

### Observability / operations visibility

Candidate technologies mentioned:

- free/cheap Splunk alternatives
- Prometheus
- Grafana
- Grafana Loki as one possible searchable-log fit
- OpenSearch as another possible option, though potentially too heavy
- first evaluate what Render provides natively

Concern is broader than products:

- structured application logging
- centralized/searchable logs
- retention/rotation
- metrics
- dashboards
- alerting
- health/readiness
- resource utilization
- error/failure rates
- external dependency health
- audit/security events
- telemetry cost
- distributed tracing only if future architecture justifies it

Wheelwright-specific/domain telemetry may matter more than generic CPU graphs, including:

- last successful acquisition
- evidence age/freshness
- scheduler state
- acquisition failures
- provider health
- recommendation freshness
- database size
- Kreature observation activity

### Notifications

Candidate notification channels:

- push / in-app
- email
- SMS

Questions include:

- what events deserve notification?
- severity
- operational alerts vs operator/domain notifications
- escalation
- deduplication/throttling
- quiet hours
- retry/delivery failure
- preferences
- cost
- privacy/security

Possible future boundary: Wheelwright emits a semantic event/notification need; delivery adapters decide push/email/SMS. This is only a design idea, not an accepted architecture.

### Live API documentation

- OpenAPI generated from running application
- Swagger-style interactive documentation where appropriate
- request/response schemas
- error contracts
- authentication requirements
- API versioning/deprecation policy
- synchronization between implementation and documentation
- production exposure is itself a security decision: public, authenticated/restricted, non-prod-only, or disabled

## How the six qualities may organize the concerns

This is an exploratory mapping, not a taxonomy decision.

### Security

Identity/authentication, authorization, secrets, administrative access, Tradier credentials, Checkmarx, supply chain, WAF/DDoS, network isolation, API security.

### Reliability

Persistence durability, restart behavior, backups, DR, provider failures, health/readiness, notifications, safe deployment/rollback, environment fidelity.

### Maintainability

Sonar, code quality, CI/CD, observability, runbooks, configuration discipline, schema migration, dependency hygiene, operational simplicity, live API docs.

### Scalability (including performance)

Response time, acquisition throughput, resource sizing, caching/proxy behavior, CDN, concurrency, rate limits, and the eventual fitness boundary of single-instance/SQLite architecture.

### Extensibility

Ports/adapters, provider abstraction, notification channels, future identity provider, backup targets, possible datastore evolution, and preserving clean responsibility boundaries without premature service decomposition.

### Usability

Morning/operator workflow, login/recovery, meaningful errors, freshness visibility, notification ergonomics, operational/admin usability, API discoverability, and keeping cloud mechanics from degrading the operator experience.

## Gem Compass observations that motivated part of the discussion

The Gem Compass prototype (`brooksbol/-kiroj1`) was scanned as an **architectural learning instrument**, not a production template. Potentially useful ideas observed included:

- ports/adapters around external infrastructure
- explicit external configuration
- versioned database migration discipline
- integration testing against real infrastructure
- observability dependencies built into the runtime
- durable outbox/retry behavior where cross-service delivery actually warrants it
- cloud-capable storage behind a port
- an architectural maturation rule: service splits should follow demonstrated domain boundaries; platform abstractions should follow duplicated patterns rather than anticipation

The important negative lesson is equally strong: do **not** copy Gem Compass topology or dependencies merely because they exist there. Wheelwright's current accepted Phase 1 direction remains a deliberately simple single Spring Boot service, single acquisition authority, and SQLite persistent store on Render.

## Working meta-principles from the brainstorm

These are provisional observations worth remembering, not ratified principles:

1. **Candidate concern does not equal requirement.**
2. **Technologies are mechanisms; the six quality attributes are outcomes.**
3. **Cloud readiness should eventually be demonstrable with evidence.**
4. **The migration should harden Wheelwright's existing appliance architecture before inventing distributed architecture.**
5. **Generic cloud best practice can be wrong when it violates a Wheelwright invariant.** Example: overlapping rolling/blue-green instances may violate single acquisition authority.
6. **A considered "not needed" or "deferred" is a successful architectural outcome.**
7. **Operational simplicity has value and should be weighed explicitly against enterprise-pattern completeness.**

## Open questions for when this work resumes

- What important concern categories are still missing from this brainstorm?
- Which external standards should be used for the systematic gap sweep (Well-Architected, OWASP, SRE/operability, FinOps, supply-chain guidance, etc.)?
- Should the eventual durable artifact be a Wheelwright Cloud Readiness Standard, an assessment, an ADR/design revision, or some combination?
- Which concerns are genuinely Phase 1 migration blockers?
- Which are post-migration hardening?
- Which should be deliberately rejected as unjustified complexity?
- Does the current Render choice remain the right platform after the systematic assessment?
- What is the minimum cloud pre-production environment needed to test risks a laptop cannot reproduce?
- What operational evidence constitutes "ready to promote"?
- How should security posture change if Wheelwright ever moves from market-data observation to brokerage execution authority?

## Resume point

When this work resumes, do **not** treat this snapshot as a requirements list. Re-bootstrap from current repository authority first, inspect the then-current cloud design and implementation, then use this document as the preserved brainstorming input for a systematic gap analysis and proportionality assessment.
