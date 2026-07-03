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
