# Fidelity Activity History — Evidence Gate Findings

**Date:** August 6, 2026
**Status:** Evidence gate satisfied — data supports production accounting
**Drives:** PL-PORT-02 (Portfolio Production Accounting)
**Related:** `discovery/01-temporal-capability-vocabulary.md`, `discovery/02-prior-art-findings.md`

---

## Purpose

This document records the empirical findings from inspecting a real Fidelity Activity History CSV export. The purpose was to determine whether this data source contains sufficient evidence to answer:

> How much cash did the portfolio produce last month?

The answer is: **yes, with documented limitations**.

---

## Export Characteristics

| Attribute | Observed Value |
|---|---|
| Source | Fidelity.com → Accounts & Trade → Activity & Orders → History → Download |
| Format | CSV with header row |
| Column count | 13 |
| Ordering | Newest first (reverse chronological) |
| Date range | Configurable (observed: ~5 months in a single export) |
| Footer | 3 disclaimer paragraphs + download timestamp (non-data rows) |
| Encoding | UTF-8 with BOM |

### Column Structure

| Column | Content | Nullable |
|---|---|---|
| Run Date | Transaction posting date (MM/DD/YYYY) | No |
| Action | Natural-language event description | No |
| Symbol | Ticker, OCC option symbol (leading space), or CUSIP | Yes (empty for EFTs) |
| Description | Instrument/fund name | Yes |
| Type | Account type ("Cash") | No |
| Price ($) | Per-unit price | Yes |
| Quantity | Signed (negative = sold/removed) | No |
| Commission ($) | Per-transaction commission | Yes |
| Fees ($) | Regulatory fees | Yes |
| Accrued Interest ($) | Bond accrued interest | Yes (always empty in sample) |
| Amount ($) | Net cash impact (positive = inflow) | No |
| Cash Balance ($) | Running balance after transaction | Yes |
| Settlement Date | T+1/T+2 settlement (MM/DD/YYYY) | Yes |

---

## Observed Action Patterns

Every action pattern found in the real export, classified by economic meaning:

### Production Events

| Pattern | Example | Cash Impact | Notes |
|---|---|---|---|
| `YOU SOLD OPENING TRANSACTION PUT (...)` | Premium received | Amount column is net of commissions/fees | ~$0.65/contract commission + regulatory fee |
| `YOU SOLD OPENING TRANSACTION CALL (...)` | Premium received | Same as puts | Same fee structure |
| `DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)` | Money-market income | Positive amount | Monthly posting |
| `DIVIDEND RECEIVED [other fund] (...)` | Fund distribution | Positive amount | Character (income vs ROC) not determinable from this source |
| `REDEMPTION PAYOUT UNITED STATES TREAS BILLS (...)` | T-bill maturity | Par value returned | Contains both principal and discount income — must decompose |

### Principal Movements

| Pattern | Cash Impact | Notes |
|---|---|---|
| `Electronic Funds Transfer Received` | Deposit | Symbol and Description empty |
| `Electronic Funds Transfer Paid` | Withdrawal | Symbol and Description empty |
| `WIRE TRANSFER FROM BANK` | Deposit | Symbol and Description empty |
| `TRANSFERRED TO VS Z33-...` | Internal transfer out | Between accounts |
| `TRANSFER OF ASSETS ACAT RECEIVE` | Account transfer in | Market value at transfer; not necessarily cost basis |
| `TRANSFER OF ASSETS ACAT RES.CREDIT` | Residual cash credit | Small amount accompanying ACAT |

### Capital Deployment

| Pattern | Cash Impact | Notes |
|---|---|---|
| `YOU BOUGHT [equity/ETF]` | Purchase | Negative amount |
| `YOU BOUGHT UNITED STATES TREAS BILLS (...)` | T-bill purchase | Price per $100 face × quantity/1000 |
| `YOU BOUGHT ASSIGNED PUTS AS OF [date] (...)` | Share acquisition via put assignment | Strike × quantity |

### Capital Return / Disposition

| Pattern | Cash Impact | Notes |
|---|---|---|
| `YOU SOLD ASSIGNED CALLS AS OF [date] (...)` | Share disposition via call assignment | Strike × quantity + fees |
| `YOU SOLD [equity/ETF]` | Equity sale | May contain gain/loss relative to basis |

### Lifecycle Events ($0 cash impact)

| Pattern | Notes |
|---|---|
| `ASSIGNED as of [date] CALL/PUT (...)` | Option assignment notification |
| `EXPIRED PUT/CALL (...) as of [date]` | Option expiration notification |

### Reinvestment

| Pattern | Notes |
|---|---|
| `REINVESTMENT FIDELITY GOVERNMENT MONEY MARKET (SPAXX)` | Auto-reinvestment of SPAXX dividend (negative amount — cash redeployed) |

---

## Treasury Bill Conventions

### Purchase

```
Price: 99.72        ← per $100 face value
Quantity: 1000      ← face value in dollars
Amount: -$997.19   ← actual cash paid (= price/100 × quantity, subject to rounding)
```

### Redemption

```
Price: 1            ← per $1 face (redemption at par)
Quantity: -2000     ← face value redeemed (negative = leaving portfolio)
Amount: $2000      ← cash received (= par)
```

### Discount Income Derivation

```
Income = Redemption Amount − Sum(Purchase Amounts for same CUSIP)
```

Use the Amount column directly rather than computing from price × quantity — avoids rounding discrepancies.

### Multi-Lot Handling

The same CUSIP may be purchased multiple times at different prices:
```
05/28/2026: 912797UR6, qty 1000, amount -$994.38
06/25/2026: 912797UR6, qty 1000, amount -$997.19
07/28/2026: REDEMPTION 912797UR6, qty -2000, amount $2000.00
```

Total cost: $994.38 + $997.19 = $1,991.57
Discount income: $2,000.00 − $1,991.57 = $8.43

### Transferred Treasury Basis

ACAT-transferred T-bills show a transfer value but this may not equal cost basis. Example:
```
03/09/2026: TRANSFER OF ASSETS 912797TP2, qty 9000, implied value $8,879.58
07/23/2026: REDEMPTION 912797TP2, qty -9000, amount $9,000.00
```

The $120.42 difference is probably discount income but the basis is unconfirmed. This must be surfaced as unresolved rather than assumed.

---

## Production Semantic Decisions

The following decisions were established through three-actor architectural review:

### Cash-Basis Accounting

Production is measured at the point cash is received or posted (Run Date). Not accrual. Not mark-to-market. The operational question: "How much cash did the portfolio produce last month that can be withdrawn without consuming principal?"

### Asymmetric Realization

- **Realized appreciation** (disposition above basis) → counts as Cash Production
- **Realized loss** (disposition below basis) → tracked separately as Realized Capital Erosion
- Losses do NOT reduce Cash Production; they are a parallel fact about capital destruction
- Both dimensions are non-negative

### Distribution Character

- SPAXX: structurally money-market income (HIGH_CONFIDENCE / DETERMINISTIC)
- Other fund distributions (SPYI, JEPI, SCHD, XLF): character uncertain from Activity History alone (may contain return of capital)
- Uncertain distributions contribute to `unresolvedPotentialProduction`, not `knownCashProduction`

### Equity Dispositions

- Slice 1 computes gain/loss where basis is determinable from the CSV
- Gain above basis → PRODUCTION / REALIZED_APPRECIATION
- Loss below basis → CAPITAL_EROSION
- Unknown basis → UNRESOLVED

### Period Attribution

- Uses Run Date (the date Fidelity posts the transaction)
- Matches operator's mental model and Fidelity's own activity view
- Settlement Date is nullable and can cross month boundaries; not used for period assignment

---

## What This Source Cannot Provide

1. **Distribution character decomposition** — no 1099-DIV data in Activity History
2. **Cost basis for pre-history or transferred assets** — ACAT transfer values are not confirmed basis
3. **Option premium for contracts opened before the export window** — if a put was sold in February and the export starts in March, only the closing/expiration event is visible
4. **Tax-lot identification** — no explicit lot linking for equity positions with multiple acquisition dates
5. **Unrealized gains/losses** — no mark-to-market positions in this export
6. **Intraday timestamps** — dates only, no time of day

---

## What This Source CAN Provide (Sufficient for Slice 1)

1. Option premium (net of commissions/fees) — directly from Amount column
2. Money-market income — SPAXX dividends
3. Treasury discount income — where purchase history exists in the data
4. Fund distributions — amount known; character uncertain
5. Deposit/withdrawal identification — unambiguous action patterns
6. Assignment events — explicitly labeled with option identity
7. Expiration events — explicitly labeled
8. Period coverage determination — date range of transactions is observable
9. Realized gain/loss on dispositions — where basis is determinable from prior purchases/assignments in the data

---

## Conclusion

The Fidelity Activity History CSV is sufficient for a first production accounting implementation. The data is richer and more explicit about lifecycle events than anticipated. The main limitations (distribution character, transferred-asset basis) are known and can be surfaced transparently rather than requiring speculative resolution.

The evidence gate is open.

---

## Implementation Validation (August 2026)

The production assessor (`com.wheelwright.evidence.production`) was built and validated against the complete original 183-row Fidelity Activity History export (March 5 – August 3, 2026).

**Results:**
- 183 rows parsed without error
- Zero unclassified actions in the July period (all 19 observed patterns recognized)
- July 2026 known cash production: $3,686.93
- Complete export produced identical result to the sanitized test fixture

**Additional findings from implementation:**
- Treasury CUSIP 912797TN7 exposed a partial-lot scenario: two lots purchased, one sold before maturity. The resolver correctly identified that chronology uniquely determines the remaining basis (the sale occurred when only one lot existed). No lot-selection policy assumption was needed.
- Treasury CUSIP 912797UP0 had an additional early purchase + pre-maturity sale not in the initial fixture. After adding both to the fixture and running against the complete file, the July result was unchanged because the sale chronologically consumed the earliest lot unambiguously.
- The `YOU SOLD EX-DIV DATE...` pattern (03/31 VCSH) classifies correctly as ASSET_SALE. The ex-div annotation is structural metadata in the action text that future lifecycle analysis might use but is not needed for production accounting.

The evidence gate is not merely theoretically open — the production mechanism has been validated against the full unedited broker export.
