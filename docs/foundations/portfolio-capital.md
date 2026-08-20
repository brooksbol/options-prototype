# Portfolio Capital

**Date:** August 2026
**Status:** V1 derivation ratified (August 20, 2026); persistence and trajectory chart pending

---

## Definition

> Portfolio Capital is the current marked value of assets inside the Wheelwright capital boundary.

It answers: **How much capital does this operating portfolio contain?**

Portfolio Capital is a stock quantity — it measures what exists at a point in time, not what flows through the system.

---

## V1 Derivation (Ratified)

**Status: Ratified — empirically verified August 20, 2026.**

```
Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM
```

Because short-option MTM is negative (a liability), this effectively adds back the liability:

```
Portfolio Capital = Fidelity Total Account Value + |open short-option liability|
```

**Empirical verification (Aug 20, 2026):**
- Fidelity Total Account Value: $116,300.23
- Aggregate short-option MTM: −$2,660.00 (12 positions)
- **V1 Portfolio Capital: $118,960.23**
- Fidelity accounting identity (Cash + Investments = Total): verified, $0 delta

**Why this works:**

Fidelity's Total Account Value already includes cash, SPAXX/money-market, equities, Treasury bills, pending activity, and short-option MTM (as a negative liability reducing the total). Wheelwright applies one transparent semantic adjustment: removing the option liability because open short-option obligations do not reduce the capital-stock quantity under Wheelwright's accounting semantics. Premium received is already represented as cash within Fidelity's total and is not double-counted.

**Evidence sources (existing three-CSV workflow):**

| Component | Source | Already Available |
|-----------|--------|-------------------|
| Fidelity Total Account Value | Balances CSV → `BalanceContext.totalAccountValue` | ✅ |
| Aggregate short-option MTM | Option Summary CSV → `Σ(marketValue)` for short positions | ✅ |

No additional CSV inputs required. The Fidelity Positions/Holdings export was used during investigation as independent validation evidence but is NOT a production dependency.

**Components:**

| Component | Source | Meaning |
|-----------|--------|---------|
| Fidelity Total Account Value | `BalanceContext.totalAccountValue` (from Fidelity Balances CSV) | Broker's comprehensive account total: cash, money-market, equities, T-bills, pending activity, and short-option MTM liability |
| Aggregate short-option MTM | `PortfolioSnapshot.aggregateShortOptionMTM` (from Fidelity Option Summary CSV) | Sum of marketValue for all short option positions (negative = liability) |

**What is explicitly excluded:** Open short-option mark-to-market. Short options are obligations, not assets. They constrain capital through encumbrance and may produce consequences (assignment, erosion, appreciation) — but they do not reduce the capital stock quantity.

**What is included via Fidelity's aggregate:** Cash/SPAXX, all equity holdings, Treasury bill securities, pending activity — without requiring Wheelwright to reconstruct these individually from per-asset evidence.

---

## Ratified Accounting Semantics

### What changes Portfolio Capital

| Event | Effect | Mechanism |
|-------|--------|-----------|
| Premium received (STO) | Increases | Premium becomes cash; cash is inside the boundary |
| Contribution (deposit) | Increases | New capital crosses the system boundary inward |
| Withdrawal | Decreases | Capital crosses the system boundary outward |
| Market appreciation of owned shares | Increases | Share market values rise |
| Market erosion of owned shares | Decreases | Share market values fall |
| Assignment of short put (shares acquired) | Neutral | Cash decreases, share value increases by acquisition cost — net effect depends on market price vs strike |
| Call assignment (shares called away) | Neutral-to-changed | Shares leave, cash arrives at strike × 100; any realized appreciation/erosion is genuine economic change |
| Dividend receipt | Increases | Cash received |
| Money-market/T-bill interest | Increases | Cash received |

### What does NOT change Portfolio Capital

| Event | Why excluded |
|-------|-------------|
| Writing a new short option | Obligation created, not a capital-stock change. Premium adds to cash (increase) but the option MTM liability is excluded — net: premium is the only Portfolio Capital effect. |
| Short-option MTM fluctuation | Obligation mark, not asset change. Represented separately through position state and consequence. |
| Encumbrance state change (free → encumbered) | Capital still exists inside the boundary in the same form; its availability for deployment changes, but its existence does not. |

### Critical invariants

1. **Premium is recognized once.** When premium is received as cash, it increases Portfolio Capital. It must not be offset by open short-option MTM, and it must not be counted again at assignment or expiry.

2. **State-transition stability.** Capital moving between included forms (cash ↔ shares, cash ↔ T-bills, free ↔ encumbered) does not manufacture trajectory jumps. Only genuine economic change (market movement, realized gains/losses, flows across the boundary) moves the number.

3. **Appreciation and erosion remain separately observable.** Both are reflected in the aggregate Portfolio Capital number, but the system preserves the ability to decompose them (via Production/Consequence accounting) rather than collapsing them into an opaque total-change.

4. **Assignment does not double-count.** When shares are called away: cash arrives (strike × 100), shares depart (at their current market value). The difference is realized appreciation or erosion. Premium was already counted when received. The assignment event itself only transforms asset form — any economic change comes from the market price vs strike relationship, not from the assignment mechanism.

---

## Conceptual Separation

```
Production         → adds capital (premium receipts, dividends, interest)
Appreciation       → changes capital (share values rise)
Erosion            → changes capital (share values fall)
Contributions      → moves capital IN across the system boundary
Withdrawals        → moves capital OUT across the system boundary
Obligations        → constrain capital (encumbrance, commitment)
                     but do not reduce the capital stock through MTM
```

---

## Fidelity Reconciliation

The relationship between Wheelwright's Portfolio Capital and Fidelity's Total Account Value is simple and transparent:

```
Wheelwright Portfolio Capital  = Fidelity Total Account Value − short-option MTM
                               = Fidelity Total Account Value + |option liability|

Difference                     = Portfolio Capital − Fidelity Total
                               = |aggregate short-option MTM|
                               = the option liability Wheelwright excludes
```

This is always a positive difference: Wheelwright's number exceeds Fidelity's by exactly the cost-to-close of open short options. The difference is fully explainable from a single, named quantity.

Fidelity does the complicated holdings aggregation (cash, SPAXX, equities, T-bills, pending activity). Wheelwright applies one semantic correction that reflects its own accounting: obligations do not erode the capital stock.

---

## What Portfolio Capital Is NOT

| Concept | Distinction |
|---------|------------|
| Production | Production is a flow (income over time). Portfolio Capital is a stock (value at a point). Production *adds to* Portfolio Capital when received as cash. |
| Deployable Capital | Deployable is a capacity/state concept — how much of Portfolio Capital is currently available for new deployment. Portfolio Capital includes encumbered capital that is not deployable. |
| Encumbered Capital | Encumbered is a commitment/state concept — what portion of Portfolio Capital is committed to existing positions. Encumbrance does not reduce Portfolio Capital. |
| Fidelity Account Value | Fidelity's total includes short-option MTM as a liability. Wheelwright's Portfolio Capital excludes it. The difference is the reconciliation residual. |
| NAV (broker) | "NAV" carries broker-specific accounting conventions. Portfolio Capital is Wheelwright's native quantity with explicitly chosen semantics. |
| Eligible AUM (Situation) | Eligible AUM is a Situation/policy concept — what portion of Portfolio Capital is eligible for deployment under the active situation's constraints. A future Situation concept, not Portfolio Capital itself. |

---

## Denominators

Portfolio Capital must NOT automatically become the denominator for every percentage or efficiency metric.

Different questions use different denominators:

- **Whole-portfolio productivity:** Production / Portfolio Capital
- **Deployed-capital efficiency:** Production / capital actually deployed in positions
- **Participating-capital productivity:** Production / capital committed to strategy (excludes reserve)
- **Production growth rate:** Change in production over time — this is a different concept entirely and should not be conflated with production ÷ Portfolio Capital

---

## Historical Trajectory

Portfolio Capital observed over time produces the trajectory displayed in the Console top-region chart.

**Governing invariant:** The chart's rightmost/current point equals the Portfolio Capital headline number. Point-in-time computation and historical observations use identical accounting definitions. They are the same primitive viewed at a single point versus as a time series.

Historical accumulation mechanism: TBD (pending V1 reconciliation verification).

---

## Open Implementation Questions

1. **Persistence:** How are historical Portfolio Capital observations stored? (localStorage, backend SQLite, or both)
2. **T-bill securities:** If the operator holds individual T-bills (not SPAXX/money-market), do they appear in `cashAndCredits` or in `valueOfInvestments`? This affects whether the V1 formula captures them automatically. Empirical evidence (Aug 20, 2026): T-bills are individual securities in "Bonds/Fixed income" and appear in Fidelity's "Value of Investments" — they are NOT in `cashAndCredits`. This means the candidate V1 formula does not currently capture T-bill value. Resolution pending.
3. **Inventory completeness:** The Fidelity Option Summary is a strategy-allocation view, not an authoritative holdings ledger. It may undercount shares when Fidelity partitions lots across strategy groups. A defensive invariant (`owned >= call-encumbered`) corrects the most common failure mode (implemented Aug 2026). Other potential coverage gaps remain possible.
4. **Live vs stale:** V1 is stale (point-in-time from CSV export). Future versions may derive a live estimate using current market observations for shares and stale cash.
5. **Contributions/withdrawals:** Currently no automated detection. Manual observation or future Activity CSV parsing could identify system-boundary crossings.
6. **Evidence authority model:** Fidelity Option Summary owns strategy pairing and encumbrance. For authoritative "what do I own?" the Positions/Holdings export is more reliable. Current Wheelwright input model does not ingest Positions; the Option Summary + defensive invariant is the working approach. If a required quantity cannot be derived from current inputs, adding Positions evidence would be a future consideration.

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| `parking-lot.md` §PL-PROD-VALUE | Tracks implementation status and remaining work |
| `26-operator-console-architecture.md` §Portfolio Trajectory Region | Console display: chart + headline |
| `25-situation-architecture.md` | Eligible AUM is a Situation-level policy constraint on Portfolio Capital |
| `foundations/epistemic-precision.md` | Display precision must match evidence freshness |
| ADR-014 | Production accounting — flow quantities that add to the stock |
| `portfolio/capacity-summary.ts` | Encumbered Capital derivation — a state view of Portfolio Capital |
| `portfolio/consequence-summary.ts` | Mechanical consequence — conditional future changes to Portfolio Capital |
