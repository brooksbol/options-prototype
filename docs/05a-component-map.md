# Options Prototype — Slice 1 Component Map

## Purpose

For every component and module in the system, document its responsibility, inputs, outputs, and constraints. This map ensures each piece has a single, well-defined role and makes boundary violations detectable during implementation review.

---

## Domain Layer

### `domain/types.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Define the canonical domain type system. Single source of truth for all type definitions used across the application. |
| **Inputs** | None (definition-only module). |
| **Outputs** | `Underlying`, `Expiration`, `OptionType`, `OptionContract`, `OptionsChain`, `Moneyness` |
| **Must not** | Import from any other module. Contain logic. Reference React, providers, or UI concepts. |

---

### `domain/calculations.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Implement business rules BR-1 through BR-5 as pure functions. One function per rule. |
| **Inputs** | Primitive values and domain types (numbers, `OptionType`). |
| **Outputs** | `midPrice(bid, ask) → number`, `premiumPerContract(mid) → number`, `annualizedYield(mid, collateral, dte) → number`, `moneyness(strike, underlyingPrice, type) → Moneyness`, `assignmentProbability(delta) → number` |
| **Must not** | Import React. Import providers. Access state. Perform side effects. Combine multiple business rules into a single function. Throw exceptions. |

---

### `domain/delta.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Implement BR-6 (target delta matching). Find the contract closest to a target delta, using a policy-provided tie-breaker. |
| **Inputs** | `contracts: OptionContract[]`, `targetDelta: number`, `tieBreaker: DeltaTieBreaker` |
| **Outputs** | `findClosestToDelta(...) → OptionContract | null` |
| **Must not** | Hard-code tie-breaker preference. Import React. Access state. Own policy decisions. |

---

### `domain/policy.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Define screening policies and policy resolution logic. Own tie-breaker preferences and future screening criteria. |
| **Inputs** | `OptionContract` pairs and `DeltaTieBreaker` strategy for resolution. |
| **Outputs** | `DeltaPolicy` interface, `DEFAULT_DELTA_POLICY` constant, `DeltaTieBreaker` type, `resolveTieBreaker(a, b, strategy) → OptionContract` |
| **Must not** | Import React. Perform calculations (BR-1 through BR-5). Access providers. Depend on UI state. |

---

### `domain/provider.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Define the `MarketDataProvider` interface contract. All data sources must conform to this interface. |
| **Inputs** | None (interface-only module). |
| **Outputs** | `MarketDataProvider` interface with async methods returning domain types. |
| **Must not** | Contain implementation logic. Import React. Reference specific providers. |

---

## Provider Layer

### `providers/mock/MockMarketDataProvider.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Implement `MarketDataProvider` using static JSON data. Map raw JSON into domain objects. Compute DTE dynamically. Set `OptionContract.type` during mapping. |
| **Inputs** | Static JSON files (`spy.json`, `qqq.json`, `iwm.json`). |
| **Outputs** | `Promise<Underlying[]>`, `Promise<Expiration[]>`, `Promise<OptionsChain>` — all conforming to domain types. |
| **Must not** | Make network calls. Expose raw JSON shapes outside the provider. Allow contracts without `type` to escape the mapping boundary. Import React. |

---

### `providers/index.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Export the active `MarketDataProvider` instance. Single point of provider selection. |
| **Inputs** | Imports `MockMarketDataProvider`. |
| **Outputs** | A `MarketDataProvider` instance. |
| **Must not** | Contain business logic. Import React. Export multiple providers simultaneously (one active provider at a time). |

---

## Hook Layer

### `hooks/useOptionsChain.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Manage application state for underlying selection, expiration selection, and chain data. Coordinate async calls to the provider. |
| **Inputs** | `provider: MarketDataProvider` (injected). |
| **Outputs** | `state: OptionsChainState` (underlyings, selectedSymbol, expirations, selectedExpiration, chain, loading), `selectUnderlying(symbol)`, `selectExpiration(date)`. |
| **Must not** | Perform business calculations. Own policy logic. Import components. Access DOM. Directly import provider implementations (receives via parameter). |

---

### `hooks/useTargetDelta.ts`

| Property | Value |
|----------|-------|
| **Responsibility** | Manage the user's delta policy state. Clamp values to valid range. Provide default policy. |
| **Inputs** | Optional `Partial<DeltaPolicy>` for overriding defaults. |
| **Outputs** | `policy: DeltaPolicy`, `setTargetDelta(value)`, `setTieBreaker(value)`. |
| **Must not** | Perform delta matching. Access provider data. Import components. Perform business calculations. |

---

## Component Layer

### `components/App.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Layout shell. Compose hooks. Distribute data to child components. Wire user actions to hook methods. |
| **Inputs** | None (root component). Internally uses `useOptionsChain` and `useTargetDelta`. |
| **Outputs** | Renders the full page layout with all child components. |
| **Must not** | Perform business calculations. Own state beyond what hooks provide. Directly call provider methods. Contain domain logic. |

---

### `components/UnderlyingSelector.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Render ETF selection dropdown. Display selected ETF's current price. |
| **Inputs** | `underlyings: Underlying[]`, `selected: string`, `onSelect: (symbol: string) => void` |
| **Outputs** | Renders `<select>` element. Calls `onSelect` on change. Displays price text. |
| **Must not** | Fetch data. Perform calculations. Access hooks directly. Know about expirations or chains. |

---

### `components/ExpirationSelector.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Render expiration date selection dropdown with DTE display. |
| **Inputs** | `expirations: Expiration[]`, `selected: string`, `onSelect: (date: string) => void` |
| **Outputs** | Renders `<select>` element with formatted labels ("Jul 18 (7 DTE)"). Calls `onSelect` on change. |
| **Must not** | Compute DTE (already provided in Expiration object). Fetch data. Access hooks directly. Know about contracts. |

---

### `components/DeltaInput.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Render a numeric input for target delta. Enforce min/max range at the UI level. |
| **Inputs** | `value: number`, `onChange: (value: number) => void` |
| **Outputs** | Renders `<input type="number">` with label. Calls `onChange` with new value. |
| **Must not** | Perform delta matching. Know about contracts. Access hooks directly. Own policy state. |

---

### `components/OptionsTable.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Render a table of option contracts with derived display values (mid price, moneyness). Highlight the target-delta row. |
| **Inputs** | `contracts: OptionContract[]`, `underlyingPrice: number`, `highlightedStrike: number | null`, `sortDirection: "asc" | "desc"`, `title: string` |
| **Outputs** | Renders `<table>` with sorted rows. Applies highlight CSS class. Displays formatted values. |
| **Must not** | Own sorting state (receives direction as prop). Perform delta matching. Fetch data. Modify contracts. Own highlight logic (receives strike to highlight). |
| **Calls** | `midPrice()` and `moneyness()` from domain/calculations for display derivation. |

---

### `components/MetricsPanel.tsx`

| Property | Value |
|----------|-------|
| **Responsibility** | Display calculated income metrics for a highlighted contract. Derive collateral from contract type. |
| **Inputs** | `contract: OptionContract | null`, `underlyingPrice: number`, `dte: number`, `label: string` |
| **Outputs** | Renders a panel showing: mid price, premium per contract, annualized yield, moneyness, assignment probability. Shows placeholder when contract is null. |
| **Must not** | Perform delta matching. Fetch data. Own contract selection logic. Infer contract type from anything other than `contract.type`. |
| **Calls** | `midPrice()`, `premiumPerContract()`, `annualizedYield()`, `moneyness()`, `assignmentProbability()` from domain/calculations. |

---

## Dependency Rules Summary

```
components/  → hooks/, domain/calculations.ts, domain/types.ts
hooks/       → domain/types.ts, domain/provider.ts, domain/policy.ts, domain/delta.ts
providers/   → domain/types.ts, domain/provider.ts
domain/      → nothing (self-contained)
```

**Forbidden imports:**
- `domain/*` must never import from `hooks/`, `components/`, or `providers/`.
- `providers/*` must never import from `hooks/` or `components/`.
- `hooks/*` must never import from `components/`.
- `components/*` must never import from `providers/` (only through hooks).
