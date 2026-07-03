# Options Prototype — Project Charter

## Purpose

Build a lightweight options chain screening tool that helps evaluate covered-call and cash-secured-put income strategies on ETFs. The tool calculates yield, highlights contracts by target delta, and provides observability into the options income decision process.

This is not a trading system. This is not a portfolio manager. This is an evaluation and screening tool.

---

## Vision

A single-page application where a user can:

1. Select an ETF underlying.
2. Browse available expirations.
3. View calls and puts with key metrics.
4. Set a target delta to highlight contracts of interest.
5. See calculated premium, annualized yield, moneyness, and approximate assignment probability.

The tool makes the decision process observable — not automated.

---

## Guiding Principles

1. **Domain first.** Understand the problem before writing software.
2. **Working software validates the spec.** Specifications are hypotheses; working software is evidence.
3. **Mock before real.** Prove the domain model with deterministic data before introducing external dependencies.
4. **Small observable slices.** Each slice teaches us something and produces working software.
5. **No speculative engineering.** Build only what is needed for the current slice.
6. **Observability over automation.** Show the user what the system knows; don't hide decisions behind automation.
7. **Policy over prediction.** Use explicit rules (target delta, yield thresholds) rather than predictive models.

---

## Success Criteria

### Slice 1 (Minimum)

- [ ] User can select an ETF and expiration.
- [ ] Calls and puts tables render with realistic mock data.
- [ ] Target delta input highlights the nearest contract.
- [ ] Calculated metrics (mid price, premium, annualized yield, moneyness, assignment probability) are displayed.
- [ ] All calculations are traceable to documented formulas.
- [ ] No external API calls required.

### Future (Not Yet Committed)

- Delayed market data integration (15-min).
- Multiple strategy comparison.
- Portfolio-level income tracking.
- Backend persistence.

---

## Development Philosophy

Spec-driven development with three sequential actors:

1. **Domain** — Discover and document business concepts, rules, and calculations.
2. **Architect** — Design software that implements the approved domain.
3. **Implementation** — Build only the approved architecture.

Each actor completes before the next begins. No actor may exceed its responsibility.

---

## Scope

### In Scope (Slice 1)

- ETF selector (SPY, QQQ, IWM).
- Expiration selector with DTE.
- Calls table and puts table.
- Mock data provider (static JSON).
- Target delta input (default 0.30).
- Delta-based contract highlighting.
- Mid price calculation.
- Premium per contract.
- Annualized yield.
- Moneyness classification.
- Approximate assignment probability.

### Explicitly Out of Scope

- Real or delayed market data.
- Brokerage integration or order execution.
- Portfolio tracking or position management.
- Greeks beyond delta.
- Multi-leg strategies.
- Historical data or charting.
- Authentication or user accounts.
- Backend server.
- Mobile layout.
- Trading bot or automation logic.

---

## Roadmap

| Slice | Focus | Data Source |
|-------|-------|-------------|
| 1 | Options chain viewer + calculations | Mock data |
| 2 | Delayed market data integration | Yahoo Finance / Tradier |
| 3 | Portfolio-level income tracking | TBD |
| 4 | Strategy comparison & optimization | TBD |

Each slice is independently deployable working software.

---

## Technology (Slice 1)

- React
- TypeScript
- Static mock data (JSON)
- No backend required

---

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 00 | Project Charter (this document) | Root document; vision, scope, principles |
| 01 | Environment Contract | What tools exist; operational constraints |
| 02 | Domain Model | Business concepts, rules, calculations, ADRs |
| 03 | Requirements | User stories, acceptance criteria, slice scope |
| 04 | Architecture | Component design, interfaces, data flow (future) |
| 05 | Design | Detailed component design (future) |
| 06 | Tasks | Implementation task breakdown (future) |
