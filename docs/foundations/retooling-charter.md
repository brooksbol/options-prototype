# Wheelwright Backend Retooling Charter

**Date:** July 2026
**Status:** Ratified

---

## Architectural Identity

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support.

The backend continuously maintains an authoritative model of the options opportunity environment. Consumers apply operator-configured policy, determine recommendation state, explain it, and support — but do not perform — execution.

The browser is currently the primary consumer.

The backend retooling changes tooling, not product identity.

---

## Durable Principles

These govern the system regardless of implementation language:

1. **Policy over prediction.** The system applies explicit, auditable policy to observed evidence. It does not predict market direction.

2. **Evidence appliance.** The backend maintains evidence continuously and independently of any connected client. The browser is a viewport, not the lifecycle owner.

3. **Persist facts; derive trust.** The database stores observations with provenance. Freshness, staleness, and validity are computed at query time from facts and session context.

4. **Failed refresh preserves successful evidence.** A failed acquisition attempt never overwrites the last successful payload.

5. **Session awareness is correctness.** Market-session semantics determine when evidence can change, when acquisition is useful, and when evidence is sealed. Acquiring during closed sessions is a modeling failure.

6. **Deterministic recommendation generation.** Same evidence + same policy = same recommendations. No hidden state, no randomness.

7. **Single acquisition authority.** One process maintains one authoritative evidence model. No split-brain.

8. **Product definition is version-controlled.** Structural knowledge, governance, descriptions, and other golden product definitions are maintained in Git. Runtime persistence is derived from these artifacts and never becomes their authority.

---

## Stable Boundaries

These survive the language change because they reflect domain separation:

| Boundary | Stable Contract |
|----------|----------------|
| Evidence Appliance → Consumer | Published evidence snapshot (conditional HTTP, ETag/304) |
| Backend → Provider | Adapter owns credential, pacing, normalization. Provider types never leak. |
| Evidence → Recommendation | Recommendation reads evidence. Never calls providers. Separate lifecycle. |
| Recommendation → Execution | System constructs intent, opens broker ticket. Broker confirms and submits. |
| Golden data → Runtime data | Git-backed catalog/descriptions vs. persistence-backed observations. |

---

## Transitional Boundaries

These represent current placement, not permanent architectural destination:

| Placement | Current | Permanent? | Note |
|-----------|---------|------------|------|
| Recommendation engine | Consumer-local (browser) | **Transitional** | Current migration boundary. Not necessarily the permanent destination. Do not combine a recommendation-location move with the backend retooling. |
| Legacy `/api/market/*` proxy | Backend | **Temporary** | Exists for browser-owned scan fallback. Removable once backend-owned acquisition is the sole path. |
| Description Library | Consumer-local (generated .ts) | **Transitional** | May move to backend publication as catalog matures. Not a retooling concern. |
| Portfolio context | Consumer-local (Fidelity CSV) | **Undetermined** | May eventually have server-side persistence for multi-device/multi-user. Not today's problem. |
| Persistence implementation | SQLite | **Durable until evidence proves otherwise** | Current persistence technology is intentionally retained. Replacement requires demonstrated need, not speculation. |

---

## Migration Constraints

**Every new technology carries an architectural burden.** A technology may be introduced only after demonstrating that the current architecture cannot satisfy a concrete requirement with reasonable simplicity.

Consequences:

- SQLite is retained. It is working. JDBC access via standard SQLite driver.
- No PostgreSQL, Redis, Kafka, event buses, or distributed caches. These are not demonstrated requirements.
- Java standard library is sufficient for pacing, scheduling, and in-process caching until a concrete limitation proves otherwise.
- Spring Boot is acceptable as the application framework (HTTP, lifecycle, configuration). It is not a license to import the entire Spring ecosystem.
- Java version is a project decision, selected deliberately before writing code.
- The consumer does not change during backend retooling. Same Vite dev server, same `/api` proxy target, same snapshot consumption. The consumer is the constant; the backend is the variable.
- No dual-permanent-backend. The transitional period may briefly run both, but the TypeScript backend must reach zero `.ts` files. It does not become a permanent parallel service.

---

## Acceptance Criteria

The retooling is complete when:

```
find <backend-folder> -type f -name "*.ts"
```

returns no output, AND:

- The consumer observes identical behavior (same snapshot shape, same ETag semantics, same conditional 304)
- Evidence acquisition operates with correct session gating
- Failed refresh preserves successful evidence
- Existing behavioral invariants hold (verified by equivalent test coverage)
- The operator's Write Desk experience is indistinguishable from today
- **The operator should not have to learn a new system**

---

## Explicitly Deferred Decisions

| Decision | Reason |
|----------|--------|
| Cloud deployment | Not today's problem. Local operation sufficient. |
| User accounts / authentication | No second user exists. |
| Recommendation engine server-side migration | Separate decision with separate drivers. Do not combine with backend retooling. |
| Provider diversification | One provider is sufficient. Adapter boundary supports future providers without pre-building abstractions. |
| Historical evidence analysis | Natural future product of appliance persistence, not a migration concern. |
| Instrument Catalog expansion | Requires human verification. Independent of language migration. |
| Lifecycle Quality engine | Requires accumulated historical evidence. Separate product evolution. |
| WebSocket/SSE push | Conditional polling is adequate for single-operator use. |
| Container/Docker packaging | Deployment concern, not retooling concern. |

---

## Sequence

```
1. Ratify architectural identity and boundaries
2. Mark current placement decisions as durable or transitional
3. Define backend behavioral invariants
4. Inventory existing backend against those invariants
5. Identify smallest retooling seam
6. Begin implementation
```

---

*Technology additions, scope expansion, and architectural experiments require explicit operator approval against this document.*
