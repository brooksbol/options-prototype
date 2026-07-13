# Options Prototype — Slice 1 Architecture

## Purpose

Define the software architecture that implements the approved domain model (`02-domain.md`) and satisfies the requirements (`03-requirements.md`) for Slice 1.

This document describes component boundaries, data flow, interfaces, folder structure, and extension seams. It does not introduce new domain concepts or business rules.

---

## Architecture Principles

1. **Domain independence.** Domain types and calculations exist in a standalone layer with no UI or provider dependencies.
2. **Adapter pattern.** Data providers are adapters that conform to a domain-defined interface.
3. **Unidirectional data flow.** Data flows: Provider → Domain Types → UI Components.
4. **Composition over inheritance.** Components are small, composable, and focused.
5. **Testability by default.** Domain logic is pure functions. UI components accept data via props.
6. **Observation without ownership.** The Engineering Laboratory derives observations from domain inputs and outputs. It does not own reasoning, gate decisions, or store state that influences domain behavior. If the Laboratory were removed, the system would behave identically.

---

## System Boundary Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React Application                  │
│                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────┐ │
│  │  Selectors  │   │   Tables    │   │ Metrics  │ │
│  │  (ETF, Exp) │   │ (Calls/Puts)│   │  Panel   │ │
│  └──────┬──────┘   └──────┬──────┘   └────┬─────┘ │
│         │                  │               │        │
│         └──────────┬───────┴───────────────┘        │
│                    │                                 │
│         ┌──────────▼──────────┐                     │
│         │   Application State │                     │
│         │  (React state/hooks)│                     │
│         └──────────┬──────────┘                     │
│                    │                                 │
│         ┌──────────▼──────────┐                     │
│         │  Domain Calculations│                     │
│         │  (pure functions)   │                     │
│         └──────────┬──────────┘                     │
│                    │                                 │
│         ┌──────────▼──────────┐                     │
│         │ MarketDataProvider  │                     │
│         │    (interface)      │                     │
│         └──────────┬──────────┘                     │
│                    │                                 │
│         ┌──────────▼──────────┐                     │
│         │MockMarketDataProvider│                     │
│         │   (static JSON)     │                     │
│         └─────────────────────┘                     │
└─────────────────────────────────────────────────────┘
```

---

## Layer Definitions

### Layer 1: Domain

Pure TypeScript types and functions. No React imports. No side effects.

**Contains:**
- Domain type definitions (Underlying, Expiration, OptionContract, OptionsChain)
- Calculation functions (midPrice, premiumPerContract, annualizedYield, moneyness, assignmentProbability)
- Delta matching logic (findClosestToDelta)
- MarketDataProvider interface definition

**Depends on:** Nothing.

---

### Layer 2: Data Providers

Implementations of the MarketDataProvider interface.

**Contains:**
- MockMarketDataProvider (Slice 1)
- Static mock data (JSON)

**Depends on:** Domain types only.

---

### Layer 3: Application State

React hooks that compose domain logic with provider data.

**Contains:**
- `useOptionsChain` hook — manages selected underlying, expiration, and chain data
- `useTargetDelta` hook — manages target delta state and highlighted contract selection

**Depends on:** Domain layer, Data provider layer.

---

### Layer 4: UI Components

React components that render data. Receive everything via props or hooks.

**Contains:**
- `App` — layout shell
- `UnderlyingSelector` — ETF dropdown with price display
- `ExpirationSelector` — expiration dropdown with DTE
- `OptionsTable` — reusable table for calls or puts
- `MetricsPanel` — calculated metrics for highlighted contracts
- `DeltaInput` — numeric input for target delta

**Depends on:** Application state layer, Domain types (for prop typing).

---

## MarketDataProvider Interface

Defined in the domain layer. All providers must conform to this contract.

```typescript
interface MarketDataProvider {
  getUnderlyings(): Underlying[];
  getExpirations(symbol: string): Expiration[];
  getOptionsChain(symbol: string, expiration: string): OptionsChain;
}
```

**Design decisions:**
- Synchronous for Slice 1 (mock data is static). Will become `Promise`-based when real providers are introduced.
- Returns domain types directly — no vendor schemas leak into the application.
- `expiration` parameter is an ISO date string (e.g., "2025-07-18").

---

## Domain Calculation Functions

All calculations are pure functions. No side effects. No React dependencies. Independently testable.

```typescript
function midPrice(bid: number, ask: number): number;
function premiumPerContract(mid: number): number;
function annualizedYield(mid: number, collateral: number, dte: number): number;
function moneyness(strike: number, underlyingPrice: number, type: "call" | "put"): "ITM" | "ATM" | "OTM";
function assignmentProbability(delta: number): number;
function findClosestToDelta(contracts: OptionContract[], targetDelta: number): OptionContract | null;
```

---

## Folder Structure

```
src/
├── domain/
│   ├── types.ts              # Underlying, Expiration, OptionContract, OptionsChain
│   ├── calculations.ts       # midPrice, annualizedYield, moneyness, etc.
│   ├── delta.ts              # findClosestToDelta
│   └── provider.ts           # MarketDataProvider interface
│
├── providers/
│   ├── mock/
│   │   ├── MockMarketDataProvider.ts
│   │   └── data/
│   │       ├── spy.json
│   │       ├── qqq.json
│   │       └── iwm.json
│   └── index.ts              # re-exports active provider
│
├── hooks/
│   ├── useOptionsChain.ts
│   └── useTargetDelta.ts
│
├── components/
│   ├── App.tsx
│   ├── UnderlyingSelector.tsx
│   ├── ExpirationSelector.tsx
│   ├── OptionsTable.tsx
│   ├── MetricsPanel.tsx
│   └── DeltaInput.tsx
│
└── main.tsx                  # entry point
```

---

## Data Flow

```
1. App mounts
   → MockMarketDataProvider.getUnderlyings()
   → Display ETF selector with first ETF selected

2. User selects ETF (or default loads)
   → MockMarketDataProvider.getExpirations(symbol)
   → Display expiration selector with first expiration selected

3. User selects expiration (or default loads)
   → MockMarketDataProvider.getOptionsChain(symbol, expiration)
   → Domain calculations applied to each contract (mid, moneyness)
   → Calls table rendered (strike ascending)
   → Puts table rendered (strike descending)

4. Target delta applied (default 0.30)
   → findClosestToDelta(calls, targetDelta) → highlight row
   → findClosestToDelta(puts, targetDelta) → highlight row
   → MetricsPanel receives highlighted contracts
   → Displays: mid, premium, yield, moneyness, assignment probability

5. User changes delta / ETF / expiration
   → Repeat from relevant step
```

---

## Extension Seams

These are the points where future slices will extend the system without modifying existing domain logic:

| Seam | Future Use | Current Implementation |
|------|-----------|----------------------|
| `MarketDataProvider` interface | Swap mock for Yahoo/Tradier | MockMarketDataProvider |
| Provider `index.ts` | Toggle providers via config/env | Exports mock directly |
| `OptionsTable` component | Add columns (theta, gamma) | 8 columns per spec |
| `MetricsPanel` component | Add strategy-level metrics | Single contract metrics |
| Application state hooks | Add portfolio state, position tracking | Chain + delta only |

---

## Technology Choices (Slice 1)

| Choice | Rationale |
|--------|-----------|
| Vite | Fast dev server, zero-config for React/TS, lightweight |
| React 18+ | Standard, well-supported, hooks-based |
| TypeScript (strict) | Type safety for domain model enforcement |
| No CSS framework initially | Plain CSS or CSS modules; avoid premature abstraction |
| No state management library | React useState/useReducer sufficient for Slice 1 |
| No router | Single page, no navigation needed |

---

## Test Strategy

| Layer | Approach | Priority |
|-------|----------|----------|
| Domain calculations | Unit tests (pure functions, known inputs/outputs) | High |
| Delta matching | Unit tests (edge cases: equidistant, empty arrays) | High |
| Mock provider | Smoke test (returns valid domain types) | Medium |
| UI components | Manual verification for Slice 1; component tests later | Low |

Domain calculation tests can be written and run before any UI exists. This validates the spec independently.

---

## Constraints

- No backend. No server. No API calls.
- All data flows are synchronous in Slice 1.
- No global state management (Redux, Zustand, etc.) until complexity requires it.
- Components must not import from `providers/` directly — only through hooks.
- Domain layer must have zero React imports.

---

## Traceability

| Requirement | Architecture Component |
|------------|----------------------|
| US-1 (ETF selector) | UnderlyingSelector, useOptionsChain, MarketDataProvider.getUnderlyings() |
| US-2 (Expiration selector) | ExpirationSelector, useOptionsChain, MarketDataProvider.getExpirations() |
| US-3 (Calls table) | OptionsTable, calculations.ts, MarketDataProvider.getOptionsChain() |
| US-4 (Puts table) | OptionsTable, calculations.ts, MarketDataProvider.getOptionsChain() |
| US-5 (Target delta) | DeltaInput, useTargetDelta, delta.ts |
| US-6 (Metrics) | MetricsPanel, calculations.ts |


---

## Architecture Evolution (Post-Slice 1)

The sections above describe the original Slice 1 architecture. The system has evolved significantly. This section documents the current architectural state.

---

### Current System Overview

The application now consists of multiple instruments (pages), multiple data providers, and an evidence import layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Application                           │
│                                                                 │
│  ┌──────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────┐ │
│  │Laboratory│ │Options Chain │ │Recommendation │ │CSV Import│ │
│  │  (probe) │ │  (accordion) │ │    Lab        │ │   Lab    │ │
│  └────┬─────┘ └──────┬───────┘ └──────┬────────┘ └────┬─────┘ │
│       │               │                │               │        │
│       └───────────────┼────────────────┘               │        │
│                       │                                │        │
│         ┌─────────────▼─────────────┐    ┌────────────▼──────┐ │
│         │   Market Data Providers    │    │  CSV Parser Layer  │ │
│         │  (Mock, Tradier, Massive)  │    │  (Fidelity x3)    │ │
│         └─────────────┬─────────────┘    └────────────────────┘ │
│                       │                                         │
│         ┌─────────────▼─────────────┐                          │
│         │     Domain Layer           │                          │
│         │  types, calculations,      │                          │
│         │  policy, delta matching    │                          │
│         └───────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### Market Data Providers

| Provider | Status | Data | Cache |
|----------|--------|------|-------|
| MockMarketDataProvider | Active | Static JSON (SPY, QQQ, IWM, XLE) | N/A |
| TradierProvider | Active | Live 15-min delayed (sandbox) | 60s TTL, keyed by request |
| MassiveProvider | Spike only | Blocked by plan entitlement | N/A |

All providers implement the async `MarketDataProvider` interface and return canonical domain types. Provider instances are module-level singletons so cache survives navigation.

---

### Evidence Layer (CSV Parsers)

CSV parsers are understood as **evidence providers** — they contribute facts about portfolio state that will eventually inform the recommendation engine.

| Parser | Status | Output Type |
|--------|--------|-------------|
| Fidelity Option Summary | Complete | `OptionSummaryRow[]` (strategy-oriented) |
| Fidelity Positions | Complete | `HoldingRow[]` (holdings-oriented) |
| Fidelity Activity | Complete | `ActivityRow[]` (event-oriented) |
| Fidelity Balances | Stub (detection only) | — |
| Fidelity Orders | Stub (detection only) | — |

Architecture: Generic CSV Reader → Document Classifier → Export-Specific Parser → Typed Payload + Metadata

---

### Data Quality Awareness

The `OptionsChain` type includes optional `DataQuality` metadata:

```typescript
interface DataQuality {
  greeksAvailable: boolean;
  limitations?: string;
  dataSource?: "api" | "cache";
  cacheAgeSeconds?: number;
}
```

When Greeks are unavailable (e.g., Tradier sandbox during certain conditions), the recommendation engine suppresses delta-based highlighting and displays a warning. The system does not silently produce meaningless recommendations.

---

### Workspace Persistence

User policy decisions (provider, underlying, target deltas, tie-breaker, strikes count, max DTE) persist to localStorage via a workspace abstraction (`src/workspace/workspace.ts`). The application restores the user's laboratory configuration on browser restart.

---

### Architectural Direction (Hypothesis — Not Committed)

Recent design discussions suggest the system may evolve toward a layered evaluation pipeline where each stage reduces uncertainty using different evidence and policy. The existing Contract Evaluation (Recommendation Lab) would become one specialized stage.

The preferred near-term engineering strategy is **consumer before producer**: teach the existing contract evaluation to consume richer evidence (portfolio constraints from Fidelity imports) before building upstream evaluation stages.

This direction is documented in the Project Journal as an architectural hypothesis. It has not been committed as architecture because no implementation validates it yet.


---

## Bounded Contexts (Updated July 2026)

The system has evolved beyond a single-context architecture. The following bounded contexts are now recognized:

### 1. Options Evaluation (Original Slice 1)

The original domain: option chain analysis, delta matching, yield calculation, policy evaluation.

**Contains:** domain types, calculations, delta matching, MarketDataProvider interface, Engineering Laboratory, Recommendation Lab.

**Owns:** OptionContract, OptionsChain, Underlying, Expiration.

### 2. Opportunity Analysis

Broad comparative evaluation of ETF underlyings under configurable policy.

**Contains:** Opportunity Lab, evaluation/derivation logic, policy sweep, delta sweep, sparklines.

**Owns:** OpportunityRow, OpportunityPolicy, policy response curves.

**Consumes:** MarketDataProvider, domain calculations, delta matching.

### 3. Universe Management (Velvet Rope)

Determines which ETFs are admitted into the institutional universe for further evaluation.

**Contains:** Admission policy, evaluation pipeline, registry, append-only audit, operator overrides.

**Owns:** UniverseMember, AdmissionAuditRecord, AdmissionPolicy, EvaluationRun.

**Consumes:** MarketDataProvider, delta matching (contract selection reuses findClosestToDelta).

**Documentation:** `docs/velvet-rope/`

**Status:** Requirements and design complete. First slice ready for implementation.

**Architectural note (July 2026):** Discovery (future) will consume a canonical ETF reference catalog from external providers rather than owning ETF identity. Reference Data may eventually emerge as a distinct bounded context. See `docs/discovery/00-design-notes.md`.

### 4. Scenario Replay (State Transition Laboratory)

Document-driven temporal overlay laboratory. Exercises the causal chain from activity documents to portfolio state to overlay feasibility.

**Contains:** Activity parsing, state projection, scenario manifests, replay UI.

**Owns:** ActivityRow, PortfolioState, ScenarioStep, EvaluationRun (replay).

**Consumes:** CSV parsing infrastructure, domain calculations.

### 5. CSV Import / Document Classification

Classifies and parses brokerage documents (positions, activity, balances).

**Contains:** Parser registry, Fidelity-specific parsers, document detection.

**Owns:** CsvDocument, ParsedDocument, parser detection results.

---

## Context Relationships

```
Universe Management (Velvet Rope)
        │
        │ approved registry (future: supplies universe)
        ▼
Opportunity Analysis (Opportunity Lab)
        │
        │ selected symbol + policy
        ▼
Options Evaluation (Recommendation Lab / Contract Workbench)

CSV Import ──► Scenario Replay ──► Portfolio State ──► Overlay Feasibility
```

---

## Storage Note

All bounded contexts currently use localStorage for prototype persistence. The domain models are storage-agnostic. A future cloud/multi-user workstream will provide durable persistence without requiring domain model changes.
