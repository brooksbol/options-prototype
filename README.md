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
| Frontend (options-prototype) | ✅ Operational — puts, calls, buy-writes |
| Java backend (evidence-service-java) | ✅ Operational — live-market acceptance recorded August 3, 2026 |
| Migration status | Complete — Java is the sole evidence backend |
| Architecture documentation | ✅ Ratified |
| Behavioral invariants | ✅ Ratified (18 total) |
| Snapshot contract v1 | ✅ Frozen |
| Calls (Horizon A) | ✅ Restored — cache-based call recommendations |
| Multi-expiration evidence | ✅ Full eligible 7–45 DTE acquisition |
| Cloud deployment | 📋 Accepted architecture — post-retooling |

## Active Investigation — Constraint Identification

Before doing new optimization work, read:

**`docs/39-constraint-identification-restart-plan.md`**

Current governing position: **Herbie has not yet been identified.** The leading machine-level hypothesis is that Tradier is materially underutilized while eligible WIP waits. The next work is direct factory-floor measurement, not implementation. `docs/38-herbie-evidence-renewal-constraint.md` remains historical context; Doc 39 supplies the current epistemic correction and exact Kiro/Codex restart protocol.

Kiro steering also points to this active investigation via `.kiro/steering/current-investigation.md`.

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

## Host Execution Requirement

A Wheelwright evidence-service host must remain continuously executing during time-sensitive acquisition windows.

The evidence service is an always-on appliance, not a tool invoked on demand. Its scheduler performs session-aware acquisition (Phase 1 expiration preparation, Phase 2 delay-window work, Phase 3 opening burst) according to market-session time boundaries. If the host suspends during these windows, scheduled work cannot fire and the operator arrives to find an unprepared board rather than mature evidence.

**Local appliance (development laptop):**
- System sleep during acquisition windows is not acceptable. Display sleep is fine.
- macOS: enable "Prevent automatic sleeping on power adapter when the display is off" in System Settings → Energy. Alternatively, `caffeinate -s` provides process-bound sleep prevention.
- Other hosts: equivalent mechanism to prevent OS suspension while the JVM is running.

**Cloud appliance:**
- Same invariant applies. Avoid scale-to-zero or platform suspension across acquisition windows.
- The evidence service must execute continuously from at least 09:00 ET through 16:15 ET on trading days.

**Diagnostic rule:** A running Wheelwright process does not prove continuous acquisition execution. If unexplained scheduler gaps are observed (e.g., expected work not performed on time), check host sleep/suspension history (`pmset -g log` on macOS) before diagnosing an application scheduling defect. Monday August 24, 2026 established this rule empirically: a 13-minute Phase 3 delay was caused entirely by macOS Maintenance Sleep, not by any Wheelwright defect.

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
    src/test/java/                JUnit 5 tests
    build.gradle.kts              Gradle build (Kotlin DSL, Java 21 toolchain)
    gradlew                       Gradle Wrapper (canonical build entry point)

data/                             Wheelwright-owned durable assets
    seeds/                        Canonical universe seed CSV
    evidence.sqlite3              Runtime evidence store (not tracked in Git)

options-prototype/                React frontend (Vite, TypeScript)
    src/                          Components, recommendation engines, domain logic
    tests/                        Vitest frontend tests

scripts/
    dev.sh                        Starts Java Evidence Appliance + Vite frontend
```

---

# Documentation Roadmap

Recommended reading order:

1. `docs/foundations/evidence-appliance.md` — System identity
2. `docs/foundations/system-goal-hierarchy.md` — Goal hierarchy; machinery → widgets → decision quality → productive capital → household mission
3. `docs/foundations/retooling-charter.md` — Migration governance
4. `docs/07-architecture-current.md` — Current architecture
5. `docs/foundations/backend-behavioral-invariants.md` — 18 ratified invariants
6. `docs/contracts/evidence-snapshot-v1.md` — Frozen API contract
7. `docs/foundations/closed-loop-engineering.md` — Engineering methodology
8. `docs/00-project-charter.md` — Original vision

`docs/foundations/system-goal-hierarchy.md` is a recurring orientation document, not merely bootstrap material. Revisit it before major new initiatives or local optimization work to restore the relationship between the immediate technical problem and the higher-level system goal.

For current active work after completing the authority reading order, read `docs/39-constraint-identification-restart-plan.md` before proposing optimization changes.

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
eval "$(brew --prefix homebrew shellenv)"
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
# Java backend
cd evidence-service-java && ./gradlew clean test

# Frontend
cd options-prototype && npx vitest run
```

Both suites must pass before merging to main.

---

# Current Scope

The system currently implements:

- **Evidence Appliance** — background acquisition (self-scheduling, session-aware, tiered A/B/C/D freshness, bounded recovery probes for prior-epoch failures, full 7–45 DTE multi-expiration acquisition)
- **Durable SQLite persistence** — failed-refresh preservation, generation tracking, restart recovery
- **Snapshot publication** — ETag/conditional HTTP (304), coherent evidence snapshots
- **Selective quote observations** — `GET /api/evidence/quotes?symbol=...` for lightweight per-symbol price projection
- **Operator Console** (home surface) — expiration-native DTE ladder with d3-hierarchy treemap, moneyness visualization (OTM/ATM/ITM + signed %), position-detail modal with progressive learning
- **Position Monitoring** — Portfolio + Evidence composition producing moneyness, DTE, capital, and full observation provenance
- **Put recommendations** (Wheelwright) — deterministic, cache-backed, zero provider calls
- **Call recommendations** (Horizon A) — inventory-driven, cache-backed, for held unencumbered shares
- **Buy-write recommendations** — share-acquisition + covered-call composite candidates, affordability-gated
- **Write Desk** — collapsible put/call/buy-write sections, sortable tables, policy controls, cross-entry composition
- **Recommendation Brief** — put and buy-write drawers with decision summary, evidence, neighborhood, governance, Projected Call Surface
- **Broker handoff** — Fidelity trade link construction (puts)
- **Production accounting** — backend-authoritative monthly reconciliation from Fidelity Activity History
- **Market session model** — 6-state classification, trading calendar, sealed evidence semantics
- **Instrument governance** — product structure classification, leveraged/inverse detection
- **Instrument Catalog** and Description Library (1,280 tickers with domain-specific descriptions)
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
