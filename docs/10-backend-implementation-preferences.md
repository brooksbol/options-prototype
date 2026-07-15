# Backend Implementation Preferences

**Date:** July 2026
**Status:** Working assumptions — open to revision
**Nature:** Implementation preferences, not architectural decisions

These preferences should influence future design discussions but remain revisable as the system evolves. They are recorded here to preserve intent and reasoning while context is fresh.

---

## 1. Java / Spring Boot

**Preference:** Implement the Evidence Service using Java and Spring Boot.

**Reasons:**
- Mature ecosystem with excellent library support
- First-class scheduling and background worker support (Spring Scheduler, @Async)
- Strong HTTP API framework (Spring Web, Spring WebFlux)
- First-class persistence support (Spring Data, JPA, JDBC)
- Familiar operational model
- Long-term maintainability and hiring pool
- Robust security framework (Spring Security)
- Well-understood deployment model (JAR, container, cloud)

**Caveat:** This is an implementation preference, not an architectural requirement. The Evidence Service's API contract (snapshot endpoint, conditional GETs) is language-agnostic. If a materially better option emerges later, the boundary is clean enough to revisit.

---

## 2. Lightweight Persistence

**Preference:** Use a lightweight embedded relational database.

**Candidates:**
- SQLite (via JDBC)
- H2 (embedded mode)
- Another database in that class

**Selection criteria:**
- Zero or near-zero administration
- Transactional (ACID)
- Reliable under single-process workloads
- Inexpensive (no licensing, no managed instance)
- Easy backup (copy file, or simple dump)
- Small operational footprint
- Sufficient for ~500 instruments × ~10 expirations × ~50 chains

**Expectation:** Data volume will remain relatively small even after introducing historical analytics. The entire evidence store for 496 ETFs fits comfortably in a single-file database.

**Boundary:** Avoid introducing PostgreSQL, MySQL, or other heavier infrastructure until real scale (multi-user, high write concurrency, or data volume) justifies the operational cost.

---

## 3. Cloud Platform

**Preference:** AWS, due to existing familiarity.

**Selection criteria:**
- Low operational overhead
- Low monthly cost (target: < $20/month for single-user prototype)
- Straightforward deployment (single instance or container)
- Managed TLS (ACM or equivalent)
- Good monitoring (CloudWatch or equivalent)
- Easy backups (S3 for DB snapshots)
- No vendor lock-in in the domain model

**Caveat:** Cloud choice is intentionally an implementation concern, not an architectural concern. If another provider (Railway, Fly.io, Hetzner, DigitalOcean) materially improves simplicity or cost without sacrificing future flexibility, evaluate it.

**Principle:** The Evidence Service should be deployable anywhere that runs a JVM. Cloud-specific concerns (secrets management, TLS termination, health checks) are infrastructure concerns, not domain concerns.

---

## 4. Primary Responsibility: Evidence Service, Not Recommendation Service

**This is the most important preference.**

The backend is being introduced to become an **Evidence Service**.

It is **not** being introduced to become a Recommendation Service.

### Backend answers:

> "What is true about the market right now?"

### Frontend answers:

> "Given my portfolio, my policy, and the current market, what should I write today?"

### Backend responsibilities (initial):

- Continuously acquiring provider evidence
- Respecting provider rate limits (Tradier: 60 req/min)
- Maintaining canonical evidence per session
- Publishing coherent evidence snapshots
- Managing evidence freshness and staleness
- Retry and recovery for failed acquisitions
- Provider abstraction (Tradier today, others later)
- Session-aware acquisition policy (6-state model)
- Evidence generation tracking
- Snapshot publication with ETag

### Frontend responsibilities (retained):

- Portfolio context (Fidelity CSV, demo)
- Recommendation Policy controls
- Wheelwright recomputation (instant, local, zero-latency)
- Recommendation ranking
- Recommendation Brief
- Pending Intents (duplicate-symbol governance)
- Write Intent construction
- Fidelity broker handoff
- Operator preferences and UI state

### Rationale for this boundary:

- Policy changes are instant when Wheelwright is local (no server round-trip)
- The operator can experiment freely with delta, DTE, and ranking mode
- Recommendation rank remains independent of evidence refresh timing
- Deterministic replay: same snapshot + same policy = same recommendations
- The Brief reads from a local snapshot, not a server API per-symbol

### Future: Wheelwright may move server-side later for:

- Multi-user governance (shared recommendation audit)
- Historical recommendation replay
- Policy A/B comparison across users
- Regulatory or compliance requirements

But it should not move in the first extraction. The boundary is clean as-is.

---

## 5. Security and User Accounts

**Status:** Working assumption for near-term product direction.

### Requirement

The backend will require authentication and authorization, even for single-user deployment. A near-term product goal is to support creating user accounts.

### Initial security model

Start with baby steps:

- Application-managed users (not OAuth/SSO initially)
- Email/username plus password
- Strong password hashing (bcrypt or Argon2 via Spring Security)
- Secure HTTP-only session cookies
- CSRF protection where applicable
- TLS in deployed environments
- No credentials stored in frontend code
- No Tradier or broker secrets exposed to the browser
- No custom cryptography — use Spring Security mechanisms

### Features (first iteration):

- User registration (or administrator-created accounts)
- Login and logout
- Authenticated API access
- Basic account ownership boundaries
- Session management
- Account disablement
- Password reset (later)

### Authorization boundary

Even if the Evidence Service initially serves shared market evidence, user-specific data must be isolated from day one.

**Potentially shared (market-level):**
- Market evidence (chains, expirations, quotes)
- Instrument metadata
- Evidence snapshots
- Universe definitions
- Confirmed absences

**User-owned (must carry ownership boundary):**
- Portfolio imports (Fidelity CSVs)
- Balances
- Positions
- Pending intents
- Recommendation Policy preferences
- Write Intents
- Broker handoff history
- Future journals or analytics
- Account settings

Every user-owned record should carry a user/account ownership boundary from the beginning, even if there is only one user initially.

### Role model

Minimal:
- `USER` — standard operator
- `ADMIN` — can create accounts, view system diagnostics, manage universe

Do not introduce complex RBAC until a real use case demands it.

### Account creation model (to be decided later):

| Option | Use case |
|--------|----------|
| Open self-registration | Public product |
| Invitation-only | Private beta, controlled growth |
| Administrator-created | Early private deployment |

For an early private deployment, invitation-only or administrator-created accounts is the safer default.

### Security principle

> Build enough security that adding a second real user does not require redesigning the data model.

Do not build enterprise IAM before it is needed, but do not assume single-user forever.

---

## Summary of Preferences

| Concern | Preference | Revisable? |
|---------|-----------|-----------|
| Language/Framework | Java / Spring Boot | Yes — API contract is language-agnostic |
| Persistence | SQLite or H2 (embedded, lightweight) | Yes — upgrade to Postgres when scale requires |
| Cloud | AWS (familiarity) | Yes — any JVM host works |
| Service boundary | Evidence Service only (not recommendations) | Revisable if multi-user governance requires server-side Wheelwright |
| Security | Spring Security, application-managed users, user-ownership boundaries from day one | Model will evolve with product |

---

## Relationship to Prior Documents

These preferences refine the technology choices in `09-backend-evidence-service-design.md` Section 3, which proposed TypeScript/Node/SQLite. The architectural boundary (Evidence Service vs. Write Desk) remains identical. The technology choice shifts from TypeScript to Java/Spring Boot based on operator familiarity, ecosystem maturity, and long-term maintainability preferences.

The design document's SQLite schema sketch, acquisition model, snapshot API, and migration path remain valid regardless of implementation language. The shared type contracts will need a cross-language representation (likely the JSON snapshot schema serves this purpose — TypeScript frontend consumes JSON, Java backend produces JSON).
