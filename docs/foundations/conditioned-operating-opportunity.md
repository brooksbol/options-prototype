# Conditioned Operating Opportunity and Lifecycle Quality

**Date:** July 2026
**Status:** Design concept — not yet implemented
**Nature:** Domain concept definition. No implementation plan or scoring formula.

---

## Core Idea

A put recommendation does more than identify an attractive contract.

If assigned, it creates a specific hypothetical ownership state.

That ownership state is deterministic from the recommendation:

```
effective basis = strike - premium
shares = contract quantity × 100
instrument = underlying
assignment horizon = put expiration
```

The system can then evaluate the current covered-call operating environment conditioned on that basis.

This is not a prediction of what the call chain will look like at assignment.

It is an evidence-backed assessment of:

> "If this recommendation created ownership at this basis, what operating opportunities are visible from that state using currently available evidence?"

---

## Domain Sequence

```
Instrument Structure
        ↓
Contract Opportunity
        ↓
Hypothetical Ownership State
        ↓
Conditioned Operating Opportunity
        ↓
Lifecycle Quality
```

---

## Domain Distinctions

### Instrument Structure

Slow-moving characteristics of the underlying:

- Option availability (listed, tradeable)
- Expiration frequency (weekly, monthly, quarterly)
- Strike spacing ($0.50, $1, $2, $5)
- Call and put liquidity (open interest depth, volume)
- Typical spread regime (tight, moderate, wide)
- Structural product characteristics (plain ETF, leveraged, inverse, income-oriented)

These change infrequently. An instrument's structural profile is approximately stable across sessions.

### Contract Opportunity

The specific put recommendation evaluated today:

- Strike
- Expiration
- Delta
- Bid
- Yield
- Execution quality
- Policy fit
- Posture (ACTIONABLE, EDGE, WAIT)

This is today's Wheelwright output — the `PutCandidate`.

### Hypothetical Ownership State

The state created if the put is assigned:

- Underlying symbol
- Share quantity (100 per contract)
- Strike price (the price paid for shares)
- Premium received (reduces effective basis)
- Effective cost basis (strike - premium per share)
- Assignment horizon (put expiration date)

This should be treated as a **domain input** — a first-class object that conditions downstream evaluation — not merely a display value in the Position Impact section.

### Conditioned Operating Opportunity

The covered-call environment visible from that hypothetical basis using current cached evidence.

Potential observations include:

- Number of call strikes above basis
- Number within preferred delta and DTE bands
- Nearest acceptable call strike above basis
- Premium available at that strike
- Yield calculated from ownership basis (not from current price)
- Spread and liquidity quality for those calls
- Strike spacing around the basis
- Whether acceptable calls require selling below basis (forced to sell at a loss)
- Whether no viable call opportunity is currently visible at all
- Open interest and volume on the relevant call strikes

### Lifecycle Quality

An emergent assessment of the full path:

```
Put opportunity → resulting ownership state → call operating opportunity
```

Lifecycle Quality is **not solely a property of the instrument**.

The same underlying can have materially different lifecycle quality for different put strikes because each strike produces a different ownership basis.

---

## Example

Two URA put recommendations share the same instrument structure but create different ownership states:

**URA $31 Put (Δ 0.18):**
- Effective basis: ~$30.50
- Current price: ~$34
- Call strikes above basis: many ($31, $32, $33, $34, $35...)
- Covered-call operating environment: excellent
- Lifecycle quality: strong

**URA $35 Put (Δ 0.42):**
- Effective basis: ~$33.50
- Current price: ~$34
- Call strikes above basis: few ($34, $35)
- Covered-call operating environment: constrained
- Lifecycle quality: weaker (thin margin, limited strike selection)

The instrument didn't change. The ownership state did. The operating opportunity followed.

---

## Architectural Fit

This concept is consistent with:

| Principle | Connection |
|-----------|-----------|
| **Policy over prediction** | Evaluates structural opportunity from current evidence, not future price forecasts |
| **Cached evidence** | Call chain data already exists in the evidence store (Tradier returns both puts and calls) |
| **Deterministic Wheelwright** | Hypothetical basis is deterministic. Call assessment is a pure function of cached data + basis |
| **Recommendation Brief** | Natural home for displaying "if assigned" analysis |
| **Zero provider calls** | Consumes existing cached chain data — no new acquisition required |
| **Velvet Rope / structural suitability** | Instrument Structure layer maps directly to admission criteria |
| **Recommendation Policy** | Policy could eventually express preferences about lifecycle quality |

### Evidence consumption (not acquisition)

Tradier chain evidence already contains both puts and calls. Conditioned Operating Opportunity requires new consumption logic (reading the call side of an already-cached chain) rather than new provider acquisition. This is architecturally clean — it adds no network calls, no new cache types, and no acquisition complexity.

---

## Recommendation Brief Implication

The Brief could eventually include a section such as:

```
IF ASSIGNED

Effective basis: $53.97

Current call environment from this basis:

  3 acceptable strikes above basis
  Nearest: $54.50 Call · 23 DTE · Δ 0.32
  Bid: $0.85
  Annualized from basis: 28.9%

  Lifecycle: Symmetric
```

This must be clearly labeled as based on **current evidence**, not a forecast of future availability. The call chain at the time of actual assignment may differ.

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| `07-architecture-current.md` — Wheelwright | Lifecycle Quality extends Wheelwright's evaluation scope from put-only to full Wheel path |
| `07-architecture-current.md` — Recommendation Brief | The Brief gains an "If Assigned" evidence section |
| `docs/velvet-rope/` | Instrument Structure maps to Velvet Rope admission criteria. Structural suitability for the Wheel lifecycle could become an admission requirement. |
| `07c-adrs.md` — ADR-002 (Wheelwright) | Lifecycle Quality is a Wheelwright concept — it represents the craftsmanship of evaluating the full operating path, not just the entry |
| `07c-adrs.md` — ADR-001 (Evidence/Recommendation separation) | Call-side assessment reads from the same cached evidence; no new provider dependency |
| `10-backend-implementation-preferences.md` | The backend Evidence Service would supply both put and call chain data in its snapshots |

---

## Open Design Questions

These are recorded for future resolution. Do not resolve prematurely.

1. **Score, classification, or evidence summary?** Should Lifecycle Quality be a numeric score (0-100), a classification (SYMMETRIC / INGRESS_BIASED / CONSTRAINED), or an evidence summary presented directly to the operator?

2. **Which call DTE window?** Should the assessment examine calls expiring 7-45 DTE from the put assignment date? From today? From a policy-defined window?

3. **Which delta policy for hypothetical calls?** Should the same target delta (0.30) apply to call assessment? Or should calls use a different preferred delta band?

4. **Must calls be above basis?** Is selling below effective cost basis always unacceptable? Or is it acceptable under certain yield/premium conditions?

5. **Dividend income?** Should the ownership-state assessment include expected dividend income for the assignment period (observable from instrument metadata)?

6. **Liquidity vs premium tradeoff?** How should poor call liquidity be weighted against high premium availability? A $2 call bid with 40% spread is different from a $0.50 bid with 8% spread.

7. **Temporal mismatch?** How should the analysis handle cases where the call expiration window overlaps with or precedes the put assignment date?

8. **Historical supplementation?** Should structural history (e.g., "this instrument has consistently offered tradeable calls for the past 6 months") supplement or replace current-session chain data?

9. **Leveraged/inverse products?** How should daily-reset, leveraged, or inverse products be treated? Their NAV decay makes covered-call operating environments structurally different.

10. **Ranking vs context?** Should Lifecycle Quality influence recommendation rank, or only appear as operator context in the Brief initially?

---

## Initial Posture

Treat Conditioned Operating Opportunity as **explanatory evidence first**.

Do not immediately incorporate it into recommendation ranking.

The first useful experiment is likely:

1. Calculate hypothetical basis for top put recommendations
2. Inspect current call opportunities from that basis (from already-cached chain data)
3. Present the result in the Recommendation Brief
4. Observe whether it changes operator decisions

Only after live use should we decide whether Lifecycle Quality belongs in ranking or governance.

---

## Concept Maturity

| Aspect | Status |
|--------|--------|
| Core domain concept | Defined |
| Domain sequence | Defined |
| Architectural fit | Confirmed (no new acquisition, reads existing cache) |
| Brief integration | Sketched |
| Policy implications | Identified but unresolved |
| Scoring/classification model | Open |
| Implementation plan | Not started — intentionally deferred |
| Evidence requirements | Met (existing chain data includes calls) |
