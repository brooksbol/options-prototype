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

1. **`docs/39-constraint-identification-restart-plan.md`** — governing TOC discipline and original restart prescription.
2. **`docs/40-provider-admission-controller-findings-2026-08-31.md`** — latest measured evidence and Kiro handoff.

Current governing position: **Herbie has not yet been identified.** August 31 measurement established that the old provider path materially underutilized Tradier's documented Production market-data allowance while due WIP persisted. A bounded after-hours experiment then demonstrated a strictly single-flight, 119-entry trailing-60-second controller operating without fixed inter-request sleep at 119.72 actual HTTP starts/minute for one hour: 7,200/7,200 HTTP 200, zero 429s, stable provider latency, and no durable-state interference.

This is a machine-level finding, not a system-constraint declaration. The next discriminating work is a regular-session evaluation of what the new admission behavior does to WIP age/depth, Decision coverage, evidence freshness, publication cadence, quota waits, and scheduler handoff behavior.

Kiro steering points to the same active evidence checkpoint via `.kiro/steering/current-investigation.md`.

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

For current active work after completing the authority reading order, read `docs/39-constraint-identification-restart-plan.md` followed by `docs/40-provider-admission-controller-findings-2026-08-31.md` before proposing optimization changes.

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
```

## 3. Install Java 21

```bash
brew install --cask temurin@21
```

## 4. Install Node.js

```bash
brew install nvm
mkdir -p ~/.nvm
```

Add to `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"
```

Then:

```bash
nvm install --lts
nvm use --lts
```

## 5. Clone Repository

```bash
git clone https://github.com/brooksbol/options-prototype.git
cd options-prototype
```

## 6. Run Tests

```bash
cd evidence-service-java
./gradlew test

cd ../options-prototype
npm install
npm test
```

## 7. Start Services

```bash
cd scripts
./dev.sh
```

---

# Branch and Commit Discipline

`main` is the authoritative branch.

Before starting work:

```bash
git checkout main
git pull --ff-only
```

After completing a coherent unit of work:

```bash
git add <files>
git commit -m "<meaningful message>"
git push origin main
```

Do not leave authoritative state only in chat history or a local working tree.
