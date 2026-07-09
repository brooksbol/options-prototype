# Options Prototype

> A spec-driven prototype exploring whether an options income strategy can be engineered as a closed-loop financial control system.

This repository serves two complementary purposes:

1. Explore a financial engineering hypothesis using working software.
2. Develop and validate a closed-loop, AI-assisted engineering methodology.

The objective is **not** to build a trading bot.

The objective is to build an observable system that continuously produces evidence.

---

# Current Status

The project is currently completing the **Reasoning Subsystem** and beginning the **Provider Subsystem**.

Completed:

- ✅ Project scaffold
- ✅ Domain model
- ✅ Calculation library
- ✅ Policy engine
- ✅ Delta matching engine
- ✅ Engineering Laboratory
- ✅ Interactive engineering fixtures
- ✅ Decision Narrative
- ✅ MarketDataProvider interface

Next:

- 🚧 Mock provider implementation
- 🚧 Mock market data
- 🚧 Provider integration into the Engineering Laboratory

---

# Engineering Philosophy

This project is built around a closed learning loop.

```
Question
    ↓
Specification
    ↓
Implementation
    ↓
Working Software
    ↓
Engineering Laboratory
    ↓
Evidence
    ↓
Learning
    ↓
Refinement
```

Working software is not the end product.

Working software is the mechanism that produces evidence.

The optimization target is **engineering learning rate**.

---

# Engineering Laboratory

The application currently boots into the **Engineering Laboratory** rather than an end-user interface.

The Laboratory is an engineering instrument.

Its purpose is to expose the behavior of the reasoning subsystem while the application is under construction.

Current capabilities include:

- Engineering fixtures
- Interactive scenario selection
- Adjustable target delta
- Configurable tie-breaker policy
- Live domain calculations
- Decision Narratives explaining why contracts are selected
- Observation of policy behavior under controlled conditions
- **Recommendation Lab** — single-symbol deep evaluation (microscope)
- **Opportunity Lab** — curated ETF universe comparison (radar)

The Laboratory derives observations from the domain engine.

It does not own domain reasoning.

As additional subsystems are completed, the Laboratory will evolve to observe them using the same approach.

---

# Closed-Loop Development

Implementation follows subsystem-oriented Learning Checkpoints.

Rather than treating implementation as a linear task list, completed subsystems are paused, observed, and evaluated before the next subsystem begins.

Typical cycle:

```
Implement subsystem
        ↓
Observe in Engineering Laboratory
        ↓
Produce evidence
        ↓
Learning Checkpoint
        ↓
Proceed / Adapt / Redirect
```

This allows working software to continuously validate both the architecture and the engineering process.

---

# Repository Structure

```
README.md

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

    journal/
        project-journal.md

scripts/

options-prototype/
    src/
    tests/
```

---

# Documentation Reading Order

Recommended reading:

1. Project Charter
2. Closed-Loop Engineering
3. Domain
4. Requirements
5. Architecture
6. Design
7. Component Map
8. Tasks
9. Project Journal

---

# Configuration

The project now includes an optional external data provider (Massive/Polygon.io) for real market data validation.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_MASSIVE_API_KEY` | For Massive provider only | API key for Massive (formerly Polygon.io) options data |
| `VITE_TRADIER_API_KEY` | For Tradier provider only | Sandbox access token for Tradier delayed options data |
| `VITE_TRADIER_API_ACCOUNT_NUMBER` | For Tradier provider only | Tradier sandbox account number |

## Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your API key:

```
VITE_MASSIVE_API_KEY=your_actual_api_key
```

## Important

- `.env.local` must **not** be committed to the repository. It is already in `.gitignore`.
- The mock provider works without any API key. External provider configuration is only needed for the real-data translation spike.
- If no API key is configured, the application runs normally using mock data.

---

# Development

Bootstrap:

```bash
./scripts/dev.sh
```

Or manually:

```bash
npm install
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

Build:

```bash
npm run build
```

---

# Current Scope

Current implementation focuses on:

- Canonical options domain model
- Financial calculations
- Policy evaluation
- Delta matching
- Engineering Laboratory
- Provider abstraction

Deferred until later slices:

- Mock provider integration
- ETF and expiration selection
- Options chain UI
- Live market data
- Brokerage integration
- Automated trading
- Portfolio management

---

# Long-Term Vision

The long-term goal is an explainable financial control system that reasons about option-writing opportunities through explicit, observable feedback loops.

Equally important, this repository serves as a living experiment in AI-assisted engineering.

The software is intended to demonstrate not only a financial model, but a methodology in which working software continuously accelerates organizational learning.