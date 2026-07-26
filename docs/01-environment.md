# Environment Contract

## Purpose

Prevent wasted effort by ensuring all required tools are verified before use. Do not assume tools exist. Do not retry missing commands.

If an environment prerequisite is missing, stop immediately and report the blocker.

---

## Machine

| Property | Value |
|----------|-------|
| OS | macOS 26.5.1 |
| Architecture | arm64 (Apple Silicon) |
| Shell | zsh |

---

## Required Tools

| Tool | Verification Command | Status |
|------|---------------------|--------|
| Git | `git --version` | **INSTALLED** — 2.50.1 |
| Node.js | `node --version` | **INSTALLED** — v24.18.0 (via nvm) |
| npm | `npm --version` | **INSTALLED** — 11.16.0 |
| Java 21 LTS | `java -version` | **INSTALLED** — Temurin 21.0.11 |
| Gradle Wrapper | `./gradlew --version` (from evidence-service-java/) | **INSTALLED** — 9.6.1 |

---

## Not Required

These tools must not be used or assumed available:

- Docker / Docker Compose
- PostgreSQL (server or client)
- Python / pip / uvx
- Maven (Gradle Wrapper is used instead)
- Any cloud CLI (AWS, Render, etc.)

---

## Installed Versions

```
Git:       2.50.1
Homebrew:  6.0.6
nvm:       0.40.5
Node:      v24.18.0
npm:       11.16.0
Java:      Temurin 21.0.11+9 (arm64)
Gradle:    9.6.1 (via wrapper)
```

---

## Environment Variables

| Variable | Required By | Purpose |
|----------|-------------|---------|
| `TRADIER_API_KEY` | Java backend | Tradier sandbox API credential |
| `EVIDENCE_DB_PATH` | Java backend (optional) | SQLite database location (default: `./data/evidence.sqlite3`) |
| `UNIVERSE_SEED_PATH` | Java backend (optional) | Universe seed CSV (default: canonical repo location) |

---

## History

This document was originally written for Slice 1 (July 2026) when only Node.js was required. Java 21 was added during the backend retooling (July 2026). The "Explicitly NOT Required" section previously listed Java — that constraint was correct for Slice 1 but is superseded by the current architecture.
