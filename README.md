# Options Prototype

> A spec-driven prototype exploring whether an options income strategy can be engineered as a closed-loop financial control system.

This repository serves two purposes:

1. Explore a financial engineering hypothesis using working software.
2. Demonstrate an AI-assisted, spec-driven engineering methodology centered on organizational learning.

The objective is **not** to build a trading bot.

The objective is to build an observable system that produces evidence.

---

# Project Status

| Phase | Status |
|--------|--------|
| Project Charter | ✅ Complete |
| Environment | ✅ Complete |
| Domain Model | ✅ Complete |
| Requirements | ✅ Complete |
| Architecture | ✅ Complete |
| Design | ✅ Complete |
| Component Map | ✅ Complete |
| Tasks | ✅ Complete |
| Implementation | 🚧 Slice 1 |

Current implementation task:

- ✅ T-01 Project Scaffold
- ⏳ T-02 Domain Layer

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
| evidence-service | 3100 | Backend evidence proxy (owns Tradier credential) |
| options-prototype | 5173 | Frontend (Vite dev server) |

The frontend proxies `/api/*` requests to the backend automatically.

**Requirements:**
- Node.js (via nvm)
- `evidence-service/.env` must contain `TRADIER_API_KEY`

**Press Ctrl+C** to stop both services.

## Starting services independently

```bash
# Backend only
cd evidence-service && npm run dev

# Frontend only (requires backend running on :3100)
cd options-prototype && npm run dev
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
README.md                     Repository entry point

docs/
    00-project-charter.md
    01-environment.md
    02-domain.md
    03-requirements.md
    04-architecture.md
    05-design.md
    05a-component-map.md
    06-tasks.md

    foundations/
        closed-loop-engineering.md

.kiro/
    specs/

src/
    (implementation)

tests/
    (implementation)
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

## 5. Verify Toolchain

```bash
git --version
brew --version
nvm --version
node --version
npm --version
```

Verified versions:

- Git 2.50.1
- Homebrew 6.0.6
- nvm 0.40.5
- Node v24.18.0
- npm 11.16.0

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

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Type check:

```bash
npx tsc --noEmit
```

---

# Current Scope

Slice 1 implements:

- Mock option chain
- ETF selector
- Expiration selector
- Calls table
- Puts table
- Delta policy highlighting
- Premium calculations
- Annualized yield calculations

Out of scope:

- Brokerage integration
- Automated trading
- Portfolio management
- Prediction models
- Real-time market data

---

# Future Direction

The long-term vision is an autonomous, explainable financial control system capable of observing portfolio state, measuring equilibrium, and recommending policy adjustments through explicit closed-loop feedback rather than market prediction.

Working software is the primary mechanism for producing evidence that guides future architectural decisions.