# Options Prototype

> A spec-driven prototype exploring whether an options income strategy can be engineered as a closed-loop financial control system.

This repository serves two purposes:

1. Explore a financial engineering hypothesis using working software.
2. Demonstrate an AI-assisted, spec-driven engineering methodology centered on organizational learning.

The objective is **not** to build a trading bot.

The objective is to build an observable system that continuously produces evidence.

---

# Project Status

| Component | Status |
|-----------|--------|
| Frontend (options-prototype) | ✅ Operational — puts and calls |
| Java backend (evidence-service-java) | ✅ Substantially implemented; final retooling acceptance pending |
| TypeScript backend (evidence-service) | ⚠️ Behavioral reference — pending retirement after Java acceptance |
| Architecture documentation | ✅ Ratified (synchronization in progress) |
| Behavioral invariants | ✅ Ratified (18 total; 16 satisfied, 2 Java-deferred) |
| Snapshot contract v1 | ✅ Frozen |
| Calls (Horizon A) | ✅ Restored — cache-based call recommendations |
| Cloud deployment | 📋 Accepted architecture — post-retooling |

---

# Local Development

## Quick Start

```bash
# Start the Java backend
cd evidence-service-java
export TRADIER_API_KEY=<your-key>
./gradlew bootRun

# In another terminal: start the frontend
cd options-prototype
npm run dev
```

| Service | Port | Purpose |
|---------|------|---------|
| evidence-service-java | 3100 | Backend evidence appliance |
| options-prototype | 5173 | Frontend (Vite dev server) |

The frontend proxies `/api/*` requests to the backend at `localhost:3100` automatically.

**Requirements:**
- JDK 21 LTS (Temurin recommended)
- Node.js (via nvm)
- `TRADIER_API_KEY` environment variable

## Alternative: TypeScript backend (behavioral reference)

The TypeScript backend at `evidence-service/` remains the behavioral reference until retooling acceptance is complete. It can be started instead of the Java backend:

```bash
cd evidence-service && npm run dev
```

Both backends serve on port 3100 with identical API contracts. Only one should run at a time.

---

# Development Philosophy

This repository intentionally follows a spec-driven engineering process.

```
Question
    ↓
Learning
    ↓
Knowledge
    ↓
Specification
    ↓
Working Software
    ↓
Evidence
    ↓
Learning
```

Working software is not the final objective.

Working software is the mechanism by which architectural hypotheses are tested and organizational learning is accelerated.

---

# Repository Structure

```
README.md                         Repository entry point

docs/
    foundations/                   Constitutional architecture documents
    contracts/                    Versioned API contracts
    journal/                      Append-only project journal
    ...                           Architecture, design, and analysis docs

evidence-service-java/            Java backend (Spring Boot, Java 21, SQLite)
    src/main/java/                Application: worker, scheduler, controllers, store
    src/test/java/                JUnit 5 tests (146 tests)
    build.gradle.kts              Gradle build (Kotlin DSL, Java 21 toolchain)
    gradlew                       Gradle Wrapper (canonical build entry point)

evidence-service/                 TypeScript backend (behavioral reference, pending retirement)
    src/                          Express server, acquisition worker, SQLite persistence
    tests/                        Vitest behavioral and contract tests (144 tests)
    data/                         SQLite database and canonical seed files

options-prototype/                React frontend (Vite, TypeScript)
    src/                          Components, recommendation engines, domain logic
    tests/                        Vitest frontend tests (968 tests)

scripts/
    dev.sh                        Starts TypeScript legacy backend + frontend (behavioral reference during Java retooling)
```

---

# Documentation Roadmap

Recommended reading order:

1. `docs/foundations/evidence-appliance.md` — System identity
2. `docs/foundations/retooling-charter.md` — Migration governance
3. `docs/07-architecture-current.md` — Current architecture
4. `docs/foundations/backend-behavioral-invariants.md` — 18 ratified invariants
5. `docs/contracts/evidence-snapshot-v1.md` — Frozen API contract
6. `docs/foundations/closed-loop-engineering.md` — Engineering methodology
7. `docs/00-project-charter.md` — Original vision

---

# Clean Laptop Bootstrap

Verified on:

- macOS 26.5.1
- Apple Silicon (arm64)

## 1. Install Xcode Command Line Tools

```bash
xcode-select --install
```

## 2. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

## 3. Install nvm and Node.js

```bash
brew install nvm
mkdir -p ~/.nvm
```

Add to `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && . "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
```

```bash
source ~/.zshrc
nvm install --lts
nvm alias default 'lts/*'
```

## 4. Install Java 21 LTS

```bash
brew install --cask temurin@21
```

Add to `~/.zshrc`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"
```

```bash
source ~/.zshrc
```

## 5. Verify Toolchain

```bash
git --version        # 2.50+
node --version       # v24.x
npm --version        # 11.x
java -version        # Temurin 21.x
./gradlew --version  # Gradle 9.x (from evidence-service-java/)
```

---

# Running Tests

```bash
# Java backend (146 tests)
cd evidence-service-java && ./gradlew test

# TypeScript backend (144 tests)
cd evidence-service && npm test

# Frontend (968 tests)
cd options-prototype && npm test
```

Total: **1,258 tests** across all three suites.

---

# Current Scope

The system currently implements:

- **Evidence Appliance** — background acquisition (self-scheduling, session-aware, tiered A/B/C/D freshness)
- **Durable SQLite persistence** — failed-refresh preservation, generation tracking, restart recovery
- **Snapshot publication** — ETag/conditional HTTP (304), coherent evidence snapshots
- **Put recommendations** (Wheelwright) — deterministic, cache-backed, zero provider calls
- **Call recommendations** (Horizon A) — inventory-driven, cache-backed, for held unencumbered shares
- **Write Desk** — collapsible put/call sections, sortable tables, policy controls
- **Recommendation Brief** — put drawer with decision summary, evidence, neighborhood, governance, Projected Call Surface
- **Broker handoff** — Fidelity trade link construction (puts)
- **Market session model** — 6-state classification, trading calendar, sealed evidence semantics
- **Instrument governance** — product structure classification, leveraged/inverse detection
- **Instrument Catalog** and Description Library (1,280 tickers)
- **Position economics** — Fidelity CSV basis data preserved in portfolio snapshot

Out of scope:

- Brokerage API integration (automated trading)
- Multi-user access
- Prediction models
- Portfolio optimization

---

# Evidence Appliance Vision

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support. The backend continuously maintains an authoritative model of the options opportunity environment. Consumers apply operator-configured policy, determine recommendation state, explain it, and support — but do not perform — execution.

The system is governed by ratified architectural principles documented in `docs/foundations/`.

---

# GitHub SSH Setup

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# Add to GitHub → Settings → SSH and GPG Keys → New SSH Key
ssh -T git@github.com
```
