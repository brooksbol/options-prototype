# Options Prototype — Domain Model

## Purpose

This document defines the business domain for the Options Prototype. It is the authoritative source for terminology, concepts, calculations, assumptions, and architectural decisions.

This document is independent of UI frameworks, programming languages, and data providers. The software exists to implement this domain — not define it.

---

## Domain Glossary

| Term | Definition |
|------|-----------|
| Underlying | The ETF whose options are displayed (e.g., SPY, QQQ, IWM). |
| Expiration | The date on which an options contract expires. |
| Strike | The price at which the option holder may buy (call) or sell (put) the underlying. |
| Call | An option giving the holder the right to buy the underlying at the strike price. |
| Put | An option giving the holder the right to sell the underlying at the strike price. |
| Delta | Rate of change of the option price relative to a $1 move in the underlying. Ranges 0–1 for calls (shown positive), 0 to –1 for puts (shown negative). Approximates probability of expiring in-the-money. |
| Bid | Highest price a buyer is willing to pay. |
| Ask | Lowest price a seller is willing to accept. |
| Mid Price | (Bid + Ask) / 2. Used as the estimated fill price. |
| Premium | The income received (per share) when selling an option. Equals mid price for this prototype. |
| Moneyness | Relationship of strike to underlying price: ITM (in-the-money), ATM (at-the-money), OTM (out-of-the-money). |
| Annualized Yield | The premium expressed as an annualized percentage return on collateral. |
| DTE | Days to expiration. Calendar days from today to expiration date. |
| Contract Multiplier | 100 shares per contract (US equity options standard). |
| Collateral | Capital required to back the position. For covered calls: cost of 100 shares. For cash-secured puts: strike × 100. |
| Target Delta | The user-specified delta value used to identify contracts of interest. |

---

## Domain Objects

### Underlying

```
Underlying {
  symbol: string        // e.g., "SPY"
  name: string          // e.g., "SPDR S&P 500 ETF Trust"
  price: number         // current price per share
}
```

### Expiration

```
Expiration {
  date: date            // expiration date
  dte: number           // calendar days from today to expiration
}
```

### OptionContract

```
OptionContract {
  type: "CALL" | "PUT"
  strike: number
  bid: number
  ask: number
  delta: number         // 0 to 1 for calls, -1 to 0 for puts
  openInterest: number
  volume: number
}
```

### OptionsChain

```
OptionsChain {
  underlying: Underlying
  expiration: Expiration
  calls: OptionContract[]
  puts: OptionContract[]
}
```

---

## Business Rules

### BR-1: Mid Price Calculation

Mid price is always the arithmetic mean of bid and ask.

```
mid = (bid + ask) / 2
```

No other pricing model is used in Slice 1.

---

### BR-2: Premium per Contract

Premium represents the total cash received for selling one contract (100 shares).

```
premiumPerContract = mid × 100
```

---

### BR-3: Annualized Yield

Annualized yield expresses the premium as a percentage return on collateral, scaled to a full year.

```
annualizedYield = (mid / collateral) × (365 / DTE) × 100
```

**Collateral rules:**
- For covered calls: `collateral = underlyingPrice`
- For cash-secured puts: `collateral = strike`

---

### BR-4: Moneyness Classification

```
For calls:
  ITM  → strike < underlyingPrice
  ATM  → |strike - underlyingPrice| ≤ $0.50
  OTM  → strike > underlyingPrice

For puts:
  ITM  → strike > underlyingPrice
  ATM  → |strike - underlyingPrice| ≤ $0.50
  OTM  → strike < underlyingPrice
```

ATM tolerance is $0.50 (absolute). This is a simplification suitable for ETFs with $1 strike intervals.

---

### BR-5: Approximate Assignment Probability

```
assignmentProbability ≈ |delta|
```

Delta is used as a rough proxy for the probability that the option expires in-the-money.

---

### BR-6: Target Delta Matching

The "closest to target delta" contract is determined by minimum absolute distance:

```
For calls:  min(|contract.delta - targetDelta|)
For puts:   min(|contract.delta| - targetDelta|)  // compare absolute values
```

If two contracts are equidistant, prefer the one closer to OTM (higher strike for calls, lower strike for puts).

---

## Assumptions

| # | Assumption | Rationale | Risk |
|---|-----------|-----------|------|
| A-1 | Mid price is a reasonable fill estimate | Liquid ETF options have tight spreads | May overestimate fills in illiquid contracts |
| A-2 | Simple annualization (no compounding) | Sufficient for screening/comparison | Overstates true annualized return |
| A-3 | Delta ≈ assignment probability | Standard approximation in options education | Ignores skew, dividends, early exercise |
| A-4 | No transaction costs | Prototype is for evaluation, not P&L tracking | Real yields are lower |
| A-5 | Position held to expiration | Simplifies yield calculation | Does not model early close or roll |
| A-6 | $0.50 ATM tolerance | ETFs typically have $1 strike intervals | May misclassify for non-standard intervals |

---

## Architecture Decision Records

### ADR-001: Domain First

**Status:** Accepted

**Context:** The project is being developed using spec-driven development. Implementation should follow an explicit domain model rather than allowing UI or data providers to define system behavior.

**Decision:** The domain model is the authoritative representation of the system. The UI, calculations, market data providers, and future integrations are adapters around the domain.

**Consequences:**
- Business rules remain independent of UI implementation.
- Market data providers can be replaced without affecting the domain.
- Future portfolio and control-system capabilities can reuse the existing domain model.

---

### ADR-002: Slice 1 Uses Mock Data Only

**Status:** Accepted

**Context:** The prototype needs a data source for options chain information. Real market data introduces licensing costs, API complexity, and rate limits before the domain model is validated.

**Decision:** Slice 1 uses a static mock data provider. No network calls. No external dependencies.

**Consequences:** Fast iteration, deterministic test data, no cost. Calculations can be validated against known inputs before introducing variable real-world data.

---

### ADR-003: First Real-Data Target Is 15-Minute Delayed Data

**Status:** Accepted

**Context:** This is an observability and evaluation tool, not a trading or execution system. 15-minute delayed data is sufficient for screening contracts, validating calculations, and comparing expirations/deltas. Real-time OPRA data adds licensing, cost, and integration complexity before the domain model is validated.

**Decision:** When the project moves beyond mock data, the first integration target is 15-minute delayed option-chain data.

**Preferred adapter sequence:**

| Phase | Provider | Purpose |
|-------|----------|---------|
| 1 | `MockMarketDataProvider` | Deterministic development & testing |
| 2 | `YahooFinanceProvider` (or yfinance-backed local service) | Informal prototype validation with real-ish data |
| 3 | `TradierDelayedProvider` | Cleaner API-based 15-min delayed data |
| 4 | Real-time provider | Only if the project later requires execution-quality data |

**Invariant:** The domain model must not depend on any vendor schema. All providers implement a common `MarketDataProvider` interface and map vendor responses into domain types.

**Consequences:** The system can swap data sources without touching domain logic or UI components. Vendor lock-in is avoided. Each provider can be introduced incrementally as the project matures.

---

### ADR-004: MarketDataProvider Interface

**Status:** Proposed

**Context:** Multiple data sources will be integrated over time (mock, Yahoo, Tradier, potentially real-time). Each has different schemas, rate limits, and authentication requirements.

**Decision:** Every external data source shall implement a common `MarketDataProvider` interface. The interface exposes domain objects rather than vendor-specific schemas. No UI component may depend directly on a vendor API.

**Rationale:**
- Prevents vendor lock-in.
- Enables mock providers, delayed providers, and future real-time providers to coexist.
- Keeps the domain independent of infrastructure.

**Consequences:** New data sources require only a new adapter implementation. Existing domain logic, calculations, and UI remain untouched.

---

## Mock Data Contract

- Mock data is static JSON (no API calls).
- Each ETF has a current price and at least 3 expirations.
- Each expiration has 8–12 strikes for both calls and puts.
- Delta values should be realistic (decreasing from ~0.90 near deep ITM to ~0.05 for far OTM).
- Bid/ask spreads should be realistic (e.g., $0.02–$0.20 spread for liquid ETFs).
- Open interest and volume are present but can be arbitrary positive integers.
- Mock data conforms to the domain objects defined above — not to any vendor schema.

---

## Open Questions

1. **ATM tolerance:** $0.50 absolute is assumed. Would a percentage-based threshold (e.g., within 0.1% of underlying) be more appropriate?

2. **Default delta:** 0.30 is documented as the default. User initially mentioned 0.33. Awaiting confirmation.

3. **Puts table sort order:** Strike descending (highest first) is specified. Awaiting confirmation.

4. **Highlighted contract display:** Separate metrics card vs. inline in the highlighted row. Awaiting direction.

5. **Multiple expirations:** Single expiration view for Slice 1, or consolidated? Awaiting confirmation.
