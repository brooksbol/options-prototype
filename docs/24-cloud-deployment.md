# Cloud Deployment Architecture

**Status:** Accepted direction — implementation sequenced after retooling acceptance
**Date:** July 2026

---

## Overview

The Evidence Appliance will be deployed as a single always-on service on Render with persistent disk storage. This document records the accepted architectural direction for cloud deployment.

---

## Accepted Constraints (Phase 1)

| Constraint | Value |
|-----------|-------|
| Platform | Render (Web Service) |
| Runtime | Spring Boot JAR (Java 21) |
| Persistence | SQLite on persistent disk |
| Instances | Single (no horizontal scaling) |
| Acquisition | Always-on worker within the same process |
| Cost target | < $20/month |
| Complexity target | Minimal operational overhead |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  Render Web Service                           │
│                                              │
│  Spring Boot Application                      │
│    · Acquisition Worker (background thread)   │
│    · HTTP API (snapshot, status, nudge)       │
│    · SQLite on persistent disk                │
│                                              │
│  Persistent Disk (/data)                      │
│    · evidence.sqlite3                         │
│    · evidence.sqlite3-wal                     │
│    · evidence.sqlite3-shm                     │
└──────────────────────────────────────────────┘
          │
          │ HTTPS (TLS managed by Render)
          │
┌─────────▼────────────────────────────────────┐
│  Browser (operator workstation)               │
│                                              │
│  Vite dev server OR static build              │
│  Proxy to Render service                      │
└──────────────────────────────────────────────┘
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite (not Postgres) | Single-writer workload. No concurrent access. Persistent disk sufficient. Zero admin. |
| Single instance | Single acquisition authority invariant (INV-ACQ-01). No split-brain. |
| Render persistent disk | SQLite requires filesystem. Render provides persistent disk on paid plans. |
| No container | Render native build from Gradle; no Docker complexity. |
| Always-on (not serverless) | Worker must run continuously during market hours. Serverless would require external scheduler. |
| TLS via Render | ACM equivalent. No certificate management. |

---

## Deployment Configuration

| Setting | Value |
|---------|-------|
| Build command | `./gradlew build` |
| Start command | `java -jar build/libs/evidence-service-*.jar` |
| Health check | `GET /api/health` |
| Port | `$PORT` (Render assigns) |
| Environment variables | `TRADIER_API_KEY`, `EVIDENCE_DB_PATH=/data/evidence.sqlite3`, `UNIVERSE_SEED_PATH` |

---

## Operational Model

- **Startup:** Worker begins acquisition after universe load. Existing evidence on disk provides immediate recommendations.
- **Shutdown:** Graceful. SQLite WAL mode ensures crash safety.
- **Backup:** Periodic copy of SQLite file to object storage (future).
- **Upgrade:** Deploy new version → Render restarts → worker resumes from durable evidence.
- **Monitoring:** `/api/status` exposes scheduler telemetry. External uptime monitoring via health check.

---

## Not Addressed in Phase 1

- Multiple users / authentication
- CDN for frontend static assets
- Automated backup to S3
- Log aggregation
- Alerting on acquisition failures
- Blue-green or canary deployment
- Horizontal scaling
- Database migration tooling for production

These are intentionally deferred. Single-user, single-instance operation is sufficient for the current milestone.

---

## Sequencing

```
1. ✅ Java backend substantially implemented
2. ⬜ Final retooling acceptance (operator smoke test)
3. ⬜ TypeScript backend retirement
4. ⬜ Render deployment configuration
5. ⬜ DNS / TLS setup
6. ⬜ Frontend deployment (static or dev server)
7. ⬜ Operational validation
```
