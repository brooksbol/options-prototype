# Environment Contract — Options Prototype

## Purpose

Prevent wasted Kiro credits by ensuring all required tools are verified before use. Do not assume tools exist. Do not retry missing commands.

---

## Credit Optimization

The purpose of this contract is to minimize unnecessary agent work.

The implementation agent shall not:
- Search repeatedly for missing tools.
- Attempt alternative build systems.
- Attempt fallback implementations.
- Retry failed commands without a change in environment.

If an environment prerequisite is missing, stop immediately and report the blocker.

---

## Machine

| Property | Value |
|----------|-------|
| OS | macOS 26.5.1 |
| Architecture | arm64 (Apple Silicon) |
| Shell | zsh |

---

## Required Tools for Slice 1

| Tool | Verification Command | Status |
|------|---------------------|--------|
| Git | `git --version` | **INSTALLED** — 2.50.1 |
| Node.js | `node --version` | **INSTALLED** — v24.18.0 (via nvm) |
| npm | `npm --version` | **INSTALLED** — 11.16.0 |

---

## Explicitly NOT Required for Slice 1

These tools must not be used or assumed available:

- Java (any version)
- Maven / Gradle
- Docker / Docker Compose
- PostgreSQL (server or client)
- Spring Boot / any JVM framework
- Python / pip / uvx
- Any backend runtime

---

## Installed Versions

As of 2025-07-03: **all required tools for Slice 1 are installed.**

```
Git:       2.50.1
Homebrew:  6.0.6
nvm:       0.40.5
Node:      v24.18.0
npm:       11.16.0
```

---

## Missing Tools — Install Sequence

1. **Xcode Command Line Tools** (provides Git):
   ```zsh
   xcode-select --install
   ```

2. **Homebrew** (package manager):
   ```zsh
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **nvm** (Node version manager):
   ```zsh
   brew install nvm
   mkdir ~/.nvm
   ```
   Add to `~/.zshrc`:
   ```zsh
   export NVM_DIR="$HOME/.nvm"
   [ -s "$(brew --prefix nvm)/nvm.sh" ] && \. "$(brew --prefix nvm)/nvm.sh"
   [ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && \. "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
   ```

4. **Node.js LTS** (via nvm):
   ```zsh
   nvm install --lts
   nvm use --lts
   nvm alias default 'lts/*'
   ```

---

## Verification (run after install)

```zsh
git --version && node --version && npm --version
```

Expected output pattern:
```
git version 2.x.x
v22.x.x
10.x.x
```

---

## Rules

1. **Do not attempt to use any tool not listed in "Required Tools for Slice 1."**
2. **Before running any command, verify the command exists.**
3. **If a required tool is missing, stop and report it. Do not retry.**
4. **Do not scaffold the application until Git, Node, and npm are verified as installed.**
5. **Do not use Java, Docker, Postgres, Maven, Gradle, or any backend tooling for Slice 1.**

---

## Environment State

```
BOOTSTRAPPING  ← current
↓
READY FOR FRONTEND
↓
READY FOR BACKEND
↓
READY FOR INTEGRATION
```

### State Definitions

| State | Meaning | Required Tools |
|-------|---------|----------------|
| BOOTSTRAPPING | Installing OS-level tools | None verified yet |
| READY FOR FRONTEND | Can scaffold and build the React/TS app | Git, Node.js LTS, npm |
| READY FOR BACKEND | Can scaffold Java/Spring Boot services | + Java 21, Docker, Postgres |
| READY FOR INTEGRATION | External services and APIs available | + API keys, network access |

**Current state: BOOTSTRAPPING**

---

## Gate

Scaffolding cannot proceed until state reaches **READY FOR FRONTEND**.

Transition requires:
- [ ] Git is installed and verified
- [ ] Node.js LTS is installed and verified
- [ ] npm is installed and verified
