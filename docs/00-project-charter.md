# Options Prototype — Project Charter

## Purpose

Build a lightweight options chain screening tool that helps evaluate covered-call and cash-secured-put income strategies on ETFs. The tool calculates yield, highlights contracts by target delta, and provides observability into the options income decision process.

This is not a trading system. This is not a portfolio manager. This is an evaluation and screening tool.

---

## Vision

An options income decision support tool that helps evaluate covered-call and cash-secured-put strategies on ETFs. The system:

1. Connects to live delayed market data (Tradier Sandbox).
2. Displays option chains with visual moneyness regions.
3. Recommends contracts based on configurable delta policy.
4. Explains why each recommendation was made.
5. Imports Fidelity CSV exports as evidence (positions, strategies, activity).
6. Provides an Engineering Laboratory for observing and testing domain logic.

The tool makes the decision process observable and explainable — not automated.

The system is evolving toward a layered decision pipeline where each stage (from underlying selection to contract evaluation) reduces uncertainty using different evidence and policy. This direction is under exploration but not yet committed as architecture.

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

- Brokerage integration or order execution.
- Portfolio optimization or wealth management.
- Trading bot or automation logic.
- Prediction models.
- Authentication or user accounts.
- Mobile layout.
- Multi-leg strategies.
- Treasury analytics (maturity dates parsed but not analyzed).
- Generic investment platform (domain remains options income).

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| Foundation | Domain model, calculations, policy, delta matching | Complete |
| Live Data | Tradier provider, CORS validation, cache | Complete |
| Engineering Lab | Interactive probes, decision narrative, visual regions | Complete |
| Evidence Layer | Fidelity CSV parsers (Option Summary, Positions, Activity) | Complete |
| Recommendation | Recommendation Lab with separate call/put delta, evidence window | Complete |
| Evidence Integration | Connect portfolio evidence to contract evaluation (constraints) | Next |
| Opportunity Scanner | Multi-symbol daily screening | Future (hypothesis) |
| Upstream Evaluation | Eligibility, suitability layers | Future (hypothesis) |

Each phase produces independently deployable working software.

---

## Planned Future Capabilities

### Engineering Laboratory

A self-documenting engineering laboratory exposed from inside the running application. Evolved from the GIA prototype's introspection capability.

**Purpose:** Produce evidence through controlled experiments. Make the system's reasoning, implementation state, and decision behavior observable without requiring external documentation review.

**Should expose:**
- Laboratory experiments (interactive probes against engineering fixtures)
- Domain modules and their implementation status
- Decision traces (why the system reached a conclusion)
- Calculations with live inputs and observable outputs
- Policies (active, configurable, planned)
- Providers (active, planned)
- Test coverage summary
- Current slice status and planned future work
- References to relevant spec documents

**Partially implemented in Slice 1** as an interactive delta probe with engineering fixtures. The laboratory is expected to evolve with each slice, producing progressively richer observations.

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
