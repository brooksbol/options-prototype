# Options Prototype — Slice 1 Design

## Purpose

Translate the approved architecture (`04-architecture.md`) into implementation-level decisions. This document specifies concrete types, module APIs, component contracts, data shapes, and testing approach sufficient for an Implementation Engineer to produce working software without inventing requirements.

---

## Design Invariants

1. Every calculation is pure.
2. Every calculation is independently testable.
3. No React component implements business calculations. React components may call pure domain calculation functions for display derivation.
4. React components display domain objects and view models.
5. `MarketDataProvider` is the only source of option-chain data.
6. Policy logic is isolated from calculation logic.
7. Provider schemas are mapped into domain objects before reaching UI components.
8. UI state must not redefine domain rules.

---

## Frontend Folder Structure

```
options-prototype/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   │
│   ├── domain/
│   │   ├── types.ts
│   │   ├── calculations.ts
│   │   ├── delta.ts
│   │   ├── policy.ts
│   │   └── provider.ts
│   │
│   ├── providers/
│   │   ├── index.ts
│   │   └── mock/
│   │       ├── MockMarketDataProvider.ts
│   │       └── data/
│   │           ├── spy.json
│   │           ├── qqq.json
│   │           └── iwm.json
│   │
│   ├── hooks/
│   │   ├── useOptionsChain.ts
│   │   └── useTargetDelta.ts
│   │
│   └── components/
│       ├── UnderlyingSelector.tsx
│       ├── ExpirationSelector.tsx
│       ├── OptionsTable.tsx
│       ├── MetricsPanel.tsx
│       └── DeltaInput.tsx
│
└── tests/
    ├── domain/
    │   ├── calculations.test.ts
    │   ├── delta.test.ts
    │   └── policy.test.ts
    └── providers/
        └── mock.test.ts
```

**Rationale:** Tests live at the project root (`tests/`) rather than co-located, keeping `src/` focused on production code. Domain tests can run without React or DOM dependencies.

---

## Domain Type Definitions

### `src/domain/types.ts`

```typescript
export interface Underlying {
  symbol: string;
  name: string;
  price: number;
}

export interface Expiration {
  date: string;       // ISO 8601 date string: "2025-07-18"
  dte: number;        // calendar days from today
}

export type OptionType = "CALL" | "PUT";

export interface OptionContract {
  type: OptionType;
  strike: number;
  bid: number;
  ask: number;
  delta: number;      // 0 to 1 for calls, -1 to 0 for puts
  openInterest: number;
  volume: number;
}

export interface OptionsChain {
  underlying: Underlying;
  expiration: Expiration;
  calls: OptionContract[];
  puts: OptionContract[];
}

export type Moneyness = "ITM" | "ATM" | "OTM";
```

**Design notes:**
- `Expiration.date` is a string (not a Date object) for JSON serialization simplicity. Parsing happens at the provider boundary if needed.
- `delta` is stored as the raw value (positive for calls, negative for puts) as received from the provider.
- `Moneyness` is a derived value, not stored on the contract. Computed at render time.
- `OptionContract.type` is always present on the domain object. Mock JSON may omit it (inferred from array membership), but the `MarketDataProvider` must populate it during mapping. Downstream domain logic and UI must never infer type from array membership.

---

## MarketDataProvider Interface

### `src/domain/provider.ts`

```typescript
import { Underlying, Expiration, OptionsChain } from "./types";

export interface MarketDataProvider {
  getUnderlyings(): Promise<Underlying[]>;
  getExpirations(symbol: string): Promise<Expiration[]>;
  getOptionsChain(symbol: string, expirationDate: string): Promise<OptionsChain>;
}
```

**Design decisions:**
- Asynchronous from the beginning. Even the mock provider returns `Promise.resolve(...)`. This avoids a breaking interface change when real providers are introduced.
- Returns domain types directly — no vendor schemas leak into the application.
- `expirationDate` parameter is an ISO date string (e.g., "2025-07-18").
- The provider is responsible for mapping raw data into domain objects, including setting `OptionContract.type`.

---

## Calculation Module Design

### `src/domain/calculations.ts`

Each function implements exactly one business rule. No combined or "smart" functions.

```typescript
import { OptionType, Moneyness } from "./types";

/**
 * BR-1: Mid price calculation.
 * Returns the arithmetic mean of bid and ask.
 */
export function midPrice(bid: number, ask: number): number {
  return (bid + ask) / 2;
}

/**
 * BR-2: Premium per contract.
 * Total cash received for selling one contract (100 shares).
 */
export function premiumPerContract(mid: number): number {
  return mid * 100;
}

/**
 * BR-3: Annualized yield.
 * Premium as a percentage return on collateral, scaled to 365 days.
 *
 * Collateral rules:
 *   - Covered calls: collateral = underlyingPrice
 *   - Cash-secured puts: collateral = strike
 *
 * Returns a percentage (e.g., 12.5 means 12.5%).
 * Returns 0 if DTE is 0 (avoids division by zero).
 */
export function annualizedYield(mid: number, collateral: number, dte: number): number {
  if (dte === 0 || collateral === 0) return 0;
  return (mid / collateral) * (365 / dte) * 100;
}

/**
 * BR-4: Moneyness classification.
 * ATM tolerance: $0.50 absolute.
 */
export function moneyness(
  strike: number,
  underlyingPrice: number,
  type: OptionType
): Moneyness {
  const distance = Math.abs(strike - underlyingPrice);
  if (distance <= 0.50) return "ATM";

  if (type === "CALL") {
    return strike < underlyingPrice ? "ITM" : "OTM";
  } else {
    return strike > underlyingPrice ? "ITM" : "OTM";
  }
}

/**
 * BR-5: Approximate assignment probability.
 * Uses |delta| as a proxy for probability of expiring ITM.
 * Returns a value between 0 and 1.
 */
export function assignmentProbability(delta: number): number {
  return Math.abs(delta);
}
```

**Edge case handling:**
- `annualizedYield` returns 0 for DTE=0 (expiration day) and collateral=0 (degenerate case).
- All functions are pure. No exceptions thrown. Invalid inputs produce mathematically defined outputs.

---

## Policy Domain

### `src/domain/policy.ts`

Policy defines screening criteria and evaluation preferences. The evaluation engine consumes policy — it does not own it.

```typescript
import { OptionContract } from "./types";

/**
 * Delta tie-breaker strategies.
 * Determines which contract wins when two are equidistant from target delta.
 */
export type DeltaTieBreaker = "PreferOTM" | "PreferITM" | "PreferHigherStrike" | "PreferLowerStrike";

/**
 * Screening policy for Slice 1.
 * Extensible for future criteria (yield thresholds, DTE range, moneyness filters).
 */
export interface DeltaPolicy {
  targetDelta: number;          // 0.01 to 0.99, default 0.30
  tieBreaker: DeltaTieBreaker;  // default: "PreferOTM"
}

export const DEFAULT_DELTA_POLICY: DeltaPolicy = {
  targetDelta: 0.30,
  tieBreaker: "PreferOTM",
};

/**
 * Resolve a tie-breaker between two equidistant contracts.
 * Consumes the policy — does not hard-code preference.
 */
export function resolveTieBreaker(
  a: OptionContract,
  b: OptionContract,
  tieBreaker: DeltaTieBreaker
): OptionContract {
  switch (tieBreaker) {
    case "PreferOTM":
      if (a.type === "CALL") {
        return a.strike >= b.strike ? a : b;
      } else {
        return a.strike <= b.strike ? a : b;
      }
    case "PreferITM":
      if (a.type === "CALL") {
        return a.strike <= b.strike ? a : b;
      } else {
        return a.strike >= b.strike ? a : b;
      }
    case "PreferHigherStrike":
      return a.strike >= b.strike ? a : b;
    case "PreferLowerStrike":
      return a.strike <= b.strike ? a : b;
  }
}
```

**Design notes:**
- `DeltaTieBreaker` is a union type, not an enum — keeps it simple and tree-shakeable.
- Default policy is exported as a constant. UI can override individual fields.
- Future policies (yield threshold, DTE range, moneyness filter) extend `DeltaPolicy` without modifying calculation logic.

---

## Delta Matching Module

### `src/domain/delta.ts`

```typescript
import { OptionContract } from "./types";
import { DeltaTieBreaker, resolveTieBreaker } from "./policy";

/**
 * BR-6: Find the contract closest to target delta.
 *
 * Compares |contract.delta| to targetDelta for all contract types.
 * Tie-breaker is provided by policy — not hard-coded.
 *
 * Returns null if the contracts array is empty.
 */
export function findClosestToDelta(
  contracts: OptionContract[],
  targetDelta: number,
  tieBreaker: DeltaTieBreaker
): OptionContract | null {
  if (contracts.length === 0) return null;

  let closest = contracts[0];
  let minDistance = deltaDistance(closest, targetDelta);

  for (let i = 1; i < contracts.length; i++) {
    const contract = contracts[i];
    const distance = deltaDistance(contract, targetDelta);

    if (distance < minDistance) {
      closest = contract;
      minDistance = distance;
    } else if (distance === minDistance) {
      closest = resolveTieBreaker(closest, contract, tieBreaker);
    }
  }

  return closest;
}

function deltaDistance(contract: OptionContract, targetDelta: number): number {
  return Math.abs(Math.abs(contract.delta) - targetDelta);
}
```

**Key change from architecture:** The tie-breaker is no longer embedded in the matching logic. It is a policy parameter, making the evaluation engine configurable without code changes.

---

## Mock Data Shape

### JSON Structure per ETF (e.g., `src/providers/mock/data/spy.json`)

```json
{
  "underlying": {
    "symbol": "SPY",
    "name": "SPDR S&P 500 ETF Trust",
    "price": 545.20
  },
  "expirations": [
    {
      "date": "2025-07-11",
      "calls": [
        {
          "strike": 535,
          "bid": 11.20,
          "ask": 11.40,
          "delta": 0.88,
          "openInterest": 4520,
          "volume": 1230
        }
      ],
      "puts": [
        {
          "strike": 555,
          "bid": 10.80,
          "ask": 11.00,
          "delta": -0.85,
          "openInterest": 3100,
          "volume": 890
        }
      ]
    }
  ]
}
```

**Design notes:**
- `type` is not stored in the JSON — the `MockMarketDataProvider` sets it to `"CALL"` or `"PUT"` during mapping based on array membership. This is the only place array membership determines type.
- `dte` is not stored in JSON — it's computed by the provider based on the current date vs. expiration date.
- Each expiration contains 10 calls and 10 puts (centered around ATM).
- Prices, deltas, and spreads should be internally consistent (higher delta = deeper ITM = higher premium).

### Mock Data Consistency Rules

| Property | Constraint |
|----------|-----------|
| Delta (calls) | Decreases as strike increases (e.g., 0.90 → 0.05) |
| Delta (puts) | Becomes more negative as strike increases (e.g., -0.05 → -0.90) |
| Bid < Ask | Always true |
| Bid/Ask spread | $0.02–$0.20 (wider for OTM, tighter for ATM) |
| Premium | Decreases as strike moves OTM |
| Strikes | $1 intervals for ETFs in the $100–$600 range |

---

## Policy Evaluation Design

"Policy" defines the user's screening criteria. The evaluation engine consumes policy — it does not own policy decisions.

### Current Policy: Target Delta with Tie-Breaker

```typescript
interface DeltaPolicy {
  targetDelta: number;          // 0.01 to 0.99, default 0.30
  tieBreaker: DeltaTieBreaker;  // default: "PreferOTM"
}
```

**Evaluation flow:**
1. User sets `targetDelta` via DeltaInput component.
2. `useTargetDelta` hook stores the policy state.
3. For each table (calls, puts), `findClosestToDelta(contracts, targetDelta, tieBreaker)` identifies the best match.
4. The highlighted contract is passed to MetricsPanel for metric calculation.

### Future Policy Extension Seam

```typescript
// Future — not implemented in Slice 1
interface ScreeningPolicy {
  targetDelta?: number;
  tieBreaker?: DeltaTieBreaker;
  minAnnualizedYield?: number;
  maxDte?: number;
  moneynessFilter?: Moneyness[];
}
```

For Slice 1, only `DeltaPolicy` is implemented. The policy module is the designated location for all future screening logic.

---

## State Management Approach

### Hook: `useOptionsChain`

```typescript
interface OptionsChainState {
  underlyings: Underlying[];
  selectedSymbol: string;
  expirations: Expiration[];
  selectedExpiration: string;  // ISO date string
  chain: OptionsChain | null;
  loading: boolean;
}

function useOptionsChain(provider: MarketDataProvider): {
  state: OptionsChainState;
  selectUnderlying: (symbol: string) => void;
  selectExpiration: (date: string) => void;
};
```

**Behavior:**
- On mount: loads underlyings, selects first, loads its expirations, selects first, loads chain.
- `selectUnderlying`: updates symbol, reloads expirations and chain.
- `selectExpiration`: updates expiration, reloads chain.
- Provider is injected as a parameter (testable, swappable).
- `loading` state tracks async resolution. For mock provider this resolves immediately, but the UI is structured to handle it.

### Hook: `useTargetDelta`

```typescript
function useTargetDelta(defaultPolicy?: Partial<DeltaPolicy>): {
  policy: DeltaPolicy;
  setTargetDelta: (value: number) => void;
  setTieBreaker: (value: DeltaTieBreaker) => void;
};
```

**Behavior:**
- Manages the full `DeltaPolicy` state.
- Clamps targetDelta input to [0.01, 0.99].
- Default: `{ targetDelta: 0.30, tieBreaker: "PreferOTM" }`.
- Slice 1 UI only exposes targetDelta. TieBreaker uses default but is configurable for tests and future UI.

### Why not a combined hook?

Separation keeps concerns isolated:
- `useOptionsChain` deals with data fetching/selection.
- `useTargetDelta` deals with user preference/policy.
- Composition happens in `App.tsx` where both hooks are called and their outputs are wired together.

---

## Component Design

### `App.tsx`

Layout shell. Composes all hooks and distributes data to child components.

```
┌────────────────────────────────────────────────┐
│  Header: "Options Prototype"                   │
├────────────────────────────────────────────────┤
│  [UnderlyingSelector]  [ExpirationSelector]    │
│  [DeltaInput]                                  │
├────────────────────────────────────────────────┤
│  Calls Table                                   │
│  ┌────────────────────────────────────────┐    │
│  │ Strike | Bid | Ask | Mid | Δ | OI | V │    │
│  │ >>>highlighted row<<<                  │    │
│  └────────────────────────────────────────┘    │
├────────────────────────────────────────────────┤
│  Puts Table                                    │
│  ┌────────────────────────────────────────┐    │
│  │ Strike | Bid | Ask | Mid | Δ | OI | V │    │
│  │ >>>highlighted row<<<                  │    │
│  └────────────────────────────────────────┘    │
├────────────────────────────────────────────────┤
│  [MetricsPanel: Call]  [MetricsPanel: Put]     │
└────────────────────────────────────────────────┘
```

---

### `UnderlyingSelector`

```typescript
interface Props {
  underlyings: Underlying[];
  selected: string;
  onSelect: (symbol: string) => void;
}
```

Renders: `<select>` with ETF symbols. Displays selected ETF's price as adjacent text.

---

### `ExpirationSelector`

```typescript
interface Props {
  expirations: Expiration[];
  selected: string;
  onSelect: (date: string) => void;
}
```

Renders: `<select>` with expiration dates formatted as `"Jul 18 (7 DTE)"`.

---

### `DeltaInput`

```typescript
interface Props {
  value: number;
  onChange: (value: number) => void;
}
```

Renders: `<input type="number">` with step=0.01, min=0.01, max=0.99. Label: "Target Delta".

---

### `OptionsTable`

```typescript
interface Props {
  contracts: OptionContract[];
  underlyingPrice: number;
  highlightedStrike: number | null;
  sortDirection: "asc" | "desc";
  title: string;  // "Calls" or "Puts"
}
```

**Behavior:**
- Sorts contracts by strike in the specified direction.
- Computes and displays mid price and moneyness per row (using domain calculation functions).
- Applies a CSS class to the row matching `highlightedStrike`.
- Columns: Strike, Bid, Ask, Mid, Delta, OI, Volume, Moneyness.

**Formatting:**
- Prices: 2 decimal places (`$545.20`).
- Delta: 2 decimal places (`0.30` or `-0.30`).
- OI/Volume: comma-separated integers (`4,520`).
- Moneyness: badge-style label (ITM/ATM/OTM).

**Note:** OptionsTable calls domain calculation functions (`midPrice`, `moneyness`) to derive display values. It does not implement these calculations itself. This satisfies invariant #3 (no component performs business calculations) while keeping derived display values close to their rendering context.

---

### `MetricsPanel`

```typescript
interface Props {
  contract: OptionContract | null;
  underlyingPrice: number;
  dte: number;
  label: string;  // "Call" or "Put"
}
```

**Behavior:**
- If `contract` is null, displays "No contract selected" placeholder.
- Otherwise computes and displays (using domain calculation functions):
  - Mid Price: formatted as currency.
  - Premium per Contract: formatted as currency.
  - Annualized Yield: formatted as percentage with 1 decimal.
  - Moneyness: ITM/ATM/OTM label.
  - Assignment Probability: formatted as percentage with 0 decimals.
- Title indicates whether this is for the highlighted call or put.

**Collateral determination:**
- If `contract.type === "CALL"`: collateral = `underlyingPrice`
- If `contract.type === "PUT"`: collateral = `contract.strike`

**Note:** Collateral rule is derived from the contract's `type` field — not from prop naming or array position. This satisfies the invariant that downstream logic never infers type from array membership.

---

## Test Design

### Domain Calculation Tests (`tests/domain/calculations.test.ts`)

| Test Case | Input | Expected Output | Business Rule |
|-----------|-------|-----------------|---------------|
| Mid price basic | bid=1.00, ask=1.20 | 1.10 | BR-1 |
| Mid price zero spread | bid=5.00, ask=5.00 | 5.00 | BR-1 |
| Premium per contract | mid=1.10 | 110.00 | BR-2 |
| Annualized yield 30 DTE | mid=2.00, collateral=500, dte=30 | 4.867 | BR-3 |
| Annualized yield DTE=0 | mid=2.00, collateral=500, dte=0 | 0 | BR-3 edge |
| Moneyness call ITM | strike=540, price=545, type=CALL | "ITM" | BR-4 |
| Moneyness call OTM | strike=550, price=545, type=CALL | "OTM" | BR-4 |
| Moneyness call ATM | strike=545.25, price=545, type=CALL | "ATM" | BR-4 |
| Moneyness put ITM | strike=550, price=545, type=PUT | "ITM" | BR-4 |
| Moneyness put OTM | strike=540, price=545, type=PUT | "OTM" | BR-4 |
| Assignment probability | delta=-0.30 | 0.30 | BR-5 |

### Delta Matching Tests (`tests/domain/delta.test.ts`)

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| Single contract | 1 call, target=0.30 | Returns that contract |
| Exact match | Contract with delta=0.30, target=0.30 | Returns exact match |
| Closest match | Deltas [0.25, 0.35], target=0.30 | Returns either (equidistant, tiebreaker applies) |
| Tiebreaker PreferOTM calls | Two calls equidistant, strikes 540/550 | Returns strike 550 (more OTM) |
| Tiebreaker PreferOTM puts | Two puts equidistant, strikes 540/550 | Returns strike 540 (more OTM) |
| Tiebreaker PreferITM calls | Two calls equidistant, strikes 540/550 | Returns strike 540 (more ITM) |
| Empty array | No contracts | Returns null |
| Puts (absolute) | Deltas [-0.25, -0.35], target=0.30 | Closest by absolute distance |

### Policy Tests (`tests/domain/policy.test.ts`)

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| resolveTieBreaker PreferOTM call | strikes 540/550, type=CALL | Returns 550 |
| resolveTieBreaker PreferOTM put | strikes 540/550, type=PUT | Returns 540 |
| resolveTieBreaker PreferITM call | strikes 540/550, type=CALL | Returns 540 |
| resolveTieBreaker PreferITM put | strikes 540/550, type=PUT | Returns 550 |
| Default policy values | DEFAULT_DELTA_POLICY | targetDelta=0.30, tieBreaker=PreferOTM |

### Mock Provider Tests (`tests/providers/mock.test.ts`)

| Test Case | Assertion |
|-----------|-----------|
| getUnderlyings returns array | Length >= 3, each has symbol/name/price |
| getExpirations returns array | Length >= 3 per symbol, each has date/dte |
| getOptionsChain structure | Has underlying, expiration, calls[], puts[] |
| Calls have type CALL | All contracts in calls[] have type === "CALL" |
| Puts have type PUT | All contracts in puts[] have type === "PUT" |
| Calls have valid deltas | All deltas between 0 and 1 |
| Puts have valid deltas | All deltas between -1 and 0 |
| Bid < Ask | True for all contracts |
| Returns promises | All methods return Promise instances |

### Test Runner

- **Vitest** — native Vite integration, fast, TypeScript-first, Jest-compatible API.
- Domain tests require no DOM, no React — pure function assertions.
- No UI component tests in Slice 1 (manual verification acceptable per architecture doc).

---

## Known Implementation Constraints

1. **Async provider interface.** All `MarketDataProvider` methods return Promises. The mock implementation uses `Promise.resolve(...)`. Hooks manage async state with a `loading` flag.

2. **DTE computation.** DTE is computed by the mock provider at initialization time using the current date. Decision: **use relative date computation in the mock provider** (e.g., "today + 7 days") to avoid mock data becoming stale.

3. **No error boundaries.** Mock data is always available and well-formed. No error states are designed for Slice 1. When real providers are introduced, error handling will be added at the hook layer.

4. **CSS approach.** Plain CSS with a single `App.css` file for Slice 1. No CSS modules, no styled-components, no Tailwind. If the CSS grows beyond ~200 lines, component-level `.css` files will be introduced.

5. **Number precision.** All monetary values are displayed with 2 decimal places. Calculations use native JavaScript floating point. No special decimal library is needed for a screening tool (acceptable rounding errors at the cent level).

6. **Provider injection.** The mock provider is imported directly in `providers/index.ts` and consumed by hooks. No dependency injection framework. Swapping providers is a code change in `index.ts`, not a runtime configuration — acceptable for Slice 1.

7. **No hot-reload of mock data.** Changing mock JSON requires a dev server restart. Acceptable for Slice 1.

8. **Policy is not user-configurable in UI (Slice 1).** Only `targetDelta` is exposed via DeltaInput. The `tieBreaker` uses the default (`PreferOTM`). The hook accepts the full policy for testability and future UI.
