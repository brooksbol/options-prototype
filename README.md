# Options Prototype

> A spec-driven prototype exploring whether an options income strategy can be engineered as a closed-loop financial control system.

This repository serves two purposes:

1. Explore a financial engineering hypothesis using working software.
2. Demonstrate an AI-assisted, spec-driven engineering methodology centered on organizational learning.

The objective is **not** to build a trading bot.

The objective is to build an observable system that produces evidence.

---

# Project Status

| Component | Status |
|-----------|--------|
| Frontend (options-prototype) | ✅ Operational |
| TypeScript backend (evidence-service) | ✅ Operational (behavioral reference) |
| Java backend (evidence-service-java) | 🚧 Scaffold — migration in progress |
| Architecture documentation | ✅ Ratified |
| Behavioral invariants | ✅ Ratified (18 total; 16 satisfied by TypeScript, 2 deferred to Java) |
| Snapshot contract v1 | ✅ Frozen |
| Retooling preparation | ✅ Complete |

---

# Local Development

## Quick Start

From the workspace root:

```bash
./scripts/dev.sh
```

This starts the complete development environment:

| Service | Port | Purpose |
|---------|------|---------|
| evidence-service (TypeScript) | 3100 | Backend evidence appliance (active) |
| options-prototype | 5173 | Frontend (Vite dev server) |

The frontend proxies `/api/*` requests to the backend automatically.

**Requirements:**
- Node.js (via nvm)
- `evidence-service/.env` must contain `TRADIER_API_KEY`

**Press Ctrl+C** to stop both services.

## Starting services independently

```bash
# Backend only (TypeScript — current active implementation)
cd evidence-service && npm run dev

# Frontend only (requires backend running on :3100)
cd options-prototype && npm run dev
```

## Java Backend (Migration Target)

The Java backend at `evidence-service-java/` is the migration target for the TypeScript evidence service. It is currently a scaffold — the TypeScript backend remains the active behavioral reference.

**Requirements:**
- JDK 21 LTS (Temurin recommended)
- Gradle Wrapper included (no global Gradle install required)

```bash
# Build and test (from evidence-service-java/)
./gradlew build

# Run (will conflict with TypeScript backend if both use port 3100)
./gradlew bootRun
```

The Java backend declares its Java requirement via toolchain:

```kotlin
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}
```

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

evidence-service/                 TypeScript backend (active behavioral reference)
    src/                          Express server, acquisition worker, SQLite persistence
    tests/                        Vitest behavioral and contract tests
    data/                         SQLite database and seed files

evidence-service-java/            Java backend (migration target — scaffold)
    src/main/java/                Spring Boot application
    src/test/java/                JUnit 5 tests
    build.gradle.kts              Gradle build (Kotlin DSL, Java 21 toolchain)
    gradlew                       Gradle Wrapper (canonical build entry point)

options-prototype/                React frontend (Vite, TypeScript)
    src/                          Components, hooks, domain logic, recommendation engine
    tests/                        Vitest frontend tests

scripts/
    dev.sh                        Starts both backend and frontend for local dev
```

---

# Documentation Roadmap

Recommended reading order:

1. Project Charter
2. Closed-Loop Engineering
3. Domain
4. Requirements
5. Architecture
6. Design
7. Component Map
8. Tasks

---

# Clean Laptop Bootstrap

Verified on:

- macOS 26.5.1
- Apple Silicon (arm64)

## 1. Install Xcode Command Line Tools

```bash
xcode-select --install
```

Verify:

```bash
git --version
xcode-select -p
```

---

## 2. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

For zsh:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verify:

```bash
brew --version
```

---

## 3. Install nvm

```bash
brew install nvm
mkdir -p ~/.nvm
```

Add to `~/.zshrc`

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && . "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
```

Reload:

```bash
source ~/.zshrc
```

---

## 4. Install Node.js

```bash
nvm install --lts
nvm alias default 'lts/*'
nvm use default
```

---

## 5. Install Java 21 LTS (for Java backend)

```bash
brew install --cask temurin@21
```

Add to `~/.zshrc`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"
```

Reload:

```bash
source ~/.zshrc
```

Verify:

```bash
java -version
javac -version
```

Expected: Temurin OpenJDK 21.x LTS.

Note: The Java backend uses a Gradle Wrapper (`./gradlew`) so no global Gradle install is required.

---

## 6. Verify Toolchain

```bash
git --version
brew --version
nvm --version
node --version
npm --version
java -version
```

Verified versions:

- Git 2.50.1
- Homebrew 6.0.6
- nvm 0.40.5
- Node v24.18.0
- npm 11.16.0
- Java: Temurin 21.0.11 LTS

---

# GitHub SSH Setup

Generate a key:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Start the agent:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Copy the public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

Add the key to GitHub:

- Settings
- SSH and GPG Keys
- New SSH Key

Verify:

```bash
ssh -T git@github.com
```

---

# Running the Project

## Full stack (recommended)

```bash
./scripts/dev.sh
```

## Individual components

```bash
# TypeScript backend tests
cd evidence-service && npm test

# Java backend tests
cd evidence-service-java && ./gradlew test

# Frontend tests
cd options-prototype && npm test
```

---

# Current Scope

The system currently implements:

- Background evidence acquisition (self-scheduling, session-aware)
- Durable SQLite persistence with failed-refresh preservation
- Snapshot publication with ETag/conditional HTTP
- Recommendation engine (Wheelwright) — deterministic, cache-backed, zero provider calls
- Write Desk operator workbench with recommendation table and drawer
- Broker handoff (Fidelity trade link construction)
- Market session model (6-state, trading calendar, sealed evidence)
- Instrument Catalog (10 governed records) and Description Library (1,280 tickers)
- Engineering Laboratory for domain observation

Out of scope:

- Brokerage integration (API trading)
- Automated order execution
- Portfolio management
- Prediction models
- Multi-user access

---

# Evidence Appliance Vision

Wheelwright is an always-on evidence appliance for policy-governed options-income decision support. The backend continuously maintains an authoritative model of the options opportunity environment. Consumers apply operator-configured policy, determine recommendation state, explain it, and support — but do not perform — execution.

Working software is the primary mechanism for producing evidence that guides future architectural decisions. The system is governed by ratified architectural principles documented in `docs/foundations/`.