# Options Prototype — Slice 1 Requirements

## Slice Definition

**Slice 1: Options Chain Viewer with Mock Data**

A single-page React/TypeScript application that displays mock options chain data for ETFs, highlights contracts near a target delta, and calculates income metrics.

**Data source:** `MockMarketDataProvider` only.

**Traceability:** All requirements reference business rules and domain objects defined in `02-domain.md`.

---

## User Stories

### US-1: Select an Underlying ETF

As a user, I can select an underlying ETF from a predefined list so that I can view its options chain.

**Acceptance Criteria:**
- A selector displays at least 3 ETFs (SPY, QQQ, IWM).
- Selecting an ETF updates the displayed chain immediately.
- The current underlying price is displayed alongside the selector.

**Domain references:** Underlying

---

### US-2: Select an Expiration Date

As a user, I can select an expiration date so that I can view contracts for that expiry.

**Acceptance Criteria:**
- Expirations are shown for the selected ETF.
- At least 3 expiration dates are available per ETF (e.g., weekly intervals).
- DTE is shown next to each expiration date.
- Selecting an expiration updates the calls and puts tables.

**Domain references:** Expiration, DTE

---

### US-3: View Calls Table

As a user, I can view a table of call options for the selected ETF and expiration.

**Acceptance Criteria:**
- Columns: Strike, Bid, Ask, Mid, Delta, Open Interest, Volume, Moneyness.
- Rows are sorted by strike ascending.
- At least 8–12 strikes are shown, centered around ATM.
- Mid price is calculated per BR-1.
- Moneyness is classified per BR-4.

**Domain references:** OptionContract, BR-1, BR-4

---

### US-4: View Puts Table

As a user, I can view a table of put options for the selected ETF and expiration.

**Acceptance Criteria:**
- Columns: Strike, Bid, Ask, Mid, Delta, Open Interest, Volume, Moneyness.
- Rows are sorted by strike descending (highest strike first).
- At least 8–12 strikes are shown, centered around ATM.
- Mid price is calculated per BR-1.
- Moneyness is classified per BR-4.

**Domain references:** OptionContract, BR-1, BR-4

---

### US-5: Set Target Delta

As a user, I can set a target delta value so that the system highlights the contracts closest to that delta.

**Acceptance Criteria:**
- A numeric input with default value 0.30.
- Valid range: 0.01 to 0.99 (absolute value).
- The row closest to the target delta is visually highlighted in each table.
- Matching logic follows BR-6.

**Domain references:** Target Delta, BR-6

---

### US-6: View Calculated Metrics for Highlighted Contract

As a user, I can see income-related metrics for the highlighted (target-delta) contract.

**Acceptance Criteria:**
- Displayed metrics for each highlighted contract (calls and puts):
  - Mid Price (BR-1)
  - Premium per Contract (BR-2)
  - Annualized Yield (BR-3)
  - Moneyness (BR-4)
  - Approximate Assignment Probability (BR-5)
- Metrics update when target delta, underlying, or expiration changes.

**Domain references:** BR-1, BR-2, BR-3, BR-4, BR-5

---

## Scope

### In Scope

- ETF selector (minimum: SPY, QQQ, IWM).
- Expiration selector with DTE display.
- Calls table (strike ascending).
- Puts table (strike descending).
- Target delta numeric input (default 0.30).
- Delta-based row highlighting.
- Metrics display for highlighted contracts.
- All data from `MockMarketDataProvider`.
- Desktop-first layout.

### Out of Scope

See `00-project-charter.md` — Explicitly Out of Scope section.

---

## Constraints

- Frontend only — no backend, no server.
- No external network calls.
- No authentication.
- Mock data must conform to domain objects in `02-domain.md`.
- All calculations must be traceable to business rules in `02-domain.md`.

---

## Success Criteria

Slice 1 is complete when:

1. A user can select an ETF and see its price.
2. A user can select an expiration and see DTE.
3. Calls and puts tables render with correct data.
4. Target delta input highlights the correct row in each table.
5. Metrics panel shows all five calculated values for highlighted contracts.
6. All displayed calculations produce correct results for known mock inputs.
7. The application builds and runs with `npm start` (or equivalent) — no errors.
