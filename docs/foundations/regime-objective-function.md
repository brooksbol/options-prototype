# Cash-Flow Operating Regime

## Status: Documented (2026-08-10)

Emerged from the Buy-Write Recommendation Board architectural discussion. Records the operating regime, mission, operational objectives, constraints, evidence architecture, and the path from observation to learned optimization.

---

## Operating Regime

Wheelwright currently operates in a **cash-flow production regime**: the system exists to convert available capital into sustainable realized income through options strategies.

This is a regime, not a permanent identity. The governing principles (Preserve Optionality, Earn Proportional Compensation, Policy over Prediction, etc.) survive across regimes. In a capital-preservation regime, or a growth regime, the operational objectives would change while the principles remain intact.

---

## Mission

**Sustain target monthly realized production from available capital while preserving the productive capacity of that capital.**

The final clause is essential. Capital is not preserved for its own sake — it is preserved because it is the machine that generates future production. A dollar of NAV is valuable not because it is a dollar, but because next month it can produce another dollar of premium or appreciation.

---

## Operational Objectives

What the system is trying to achieve within this regime:

1. **Maximize expected realized production per deployment cycle per dollar of capital deployed.** Realized production includes all sources: option premium, realized appreciation from assignment, and any other realized cash-producing events.

2. **Maintain capital velocity.** Capital that cycles efficiently through deployment and return produces more over time than capital that remains deployed for long periods with uncertain outcomes.

3. **Avoid consuming the capital base.** Production that comes at the cost of permanent NAV erosion is unsustainable. Temporary unrealized drawdown is not the same as realized capital destruction.

---

## Constraints

Boundaries that cannot be violated in pursuit of the objectives:

- **NAV erosion must remain bounded.** Capital consumed faster than it produces is structurally unsustainable.
- **Governance.** Only conventional instruments with understood structural characteristics.
- **Execution quality.** Only tradeable markets with adequate liquidity and reasonable spreads.
- **Concentration.** Bounded exposure per instrument and per sector.
- **Operator agency.** The system recommends; the operator decides. No action without human confirmation.

---

## Evidence Architecture — Three Levels of Maturity

There are three levels of maturity for a recommendation metric. Contributors must not skip from Level 1 to Level 3. Level 3 is earned by operating the system.

### Level 1 — Evidence

Observable facts. No interpretation.

- Yield (annualized premium / capital)
- If Called (raw cycle total return assuming assignment)
- Delta
- DTE
- Spread, OI, Volume
- Underlying price
- Appreciation to strike
- Premium per share

These are displayed to the operator as independent dimensions.

### Level 2 — Policy

Transparent human rules. Explainable. Auditable. Adjustable.

- Target delta range
- Eligible DTE window
- Minimum execution quality threshold
- Governance filters (leveraged, inverse, daily-reset exclusion)
- Concentration limits
- Affordable-only filtering
- Reserve amount

These are the operator's declared operating envelope.

### Level 3 — Learned Operating Model

Not hard-coded. Built from observed outcomes. Requires operating history.

- Preferred buy-write delta (which delta maximizes expected production?)
- Preferred CSP delta (which delta produces sustainable cash flow?)
- Preferred DTE by regime and strategy
- Expected production model (empirical assignment rates × appreciation)
- Learned deployment ranking (which strategy + delta + DTE combinations actually produce the best outcomes?)
- Seasonal/regime patterns

**Guardrail:** A learned model must remain transparent, explainable, and revisable by the operator. The path is always:

```
historical learning → better evidence / calibrated policy → transparent recommendation
```

Never:

```
historical learning → black-box forecast → trade
```

---

## Entry Mechanisms

The regime currently supports two cash-entry mechanisms:

| Mechanism | Capital Model | Production Sources | Assignment Outcome |
|---|---|---|---|
| Cash-Secured Put | strike × 100 secured | Premium (immediate) | Shares acquired at effective basis |
| Buy-Write | price × 100 invested | Premium (immediate) + Appreciation (conditional on assignment) | Capital returned + appreciation realized |

Both serve the same mission through different production mechanics. Both generate evidence about what works. The system learns over time which deployment patterns produce sustainable cash at acceptable NAV risk.

**Both should optimize against the same mission, while exposing different evidence.**

### Why multiple entry mechanisms matter

Buy-write is valuable not merely because it is another way to deploy cash. It gives Wheelwright **a second observable entry mechanism into the same operating lifecycle**, enabling comparisons that cannot be made from a single strategy:

- Premium generation rates by strategy
- Realized appreciation frequency
- Assignment dynamics
- Deployment velocity (capital turnover)
- NAV preservation by strategy
- Realized monthly production rate by entry mechanism

---

## Policy Architecture Implications

### Shared concepts, independent calibration

Shared policy *concepts* remain correct across all entry mechanisms:

- Execution quality assessment
- Governance filtering
- DTE eligibility
- Posture assignment
- Ranking framework

**Independently calibrated parameters may be necessary:**

- CSP entry may prefer lower delta (more OTM = lower assignment probability = capital preservation)
- Buy-write entry may prefer moderate-to-higher delta (more premium + reasonable appreciation room; delta also controls the premium/appreciation tradeoff)
- These are not contradictions — they serve the same mission through different mechanics

The architecture supports entry-mechanism-specific calibration without requiring it. Shared policy concepts; potentially different default values.

### Delta as tradeoff control

For buy-writes specifically, delta is not merely a risk parameter. It simultaneously controls:

1. Premium amount (higher delta → more premium)
2. Assignment probability (higher delta → more likely to be called)
3. Appreciation room (higher delta → lower strike → less appreciation)

These interact. Moving from 0.30Δ to 0.50Δ may increase premium by $1.50 but reduce the strike by $3.00 — total if-called return actually *falls* even though premium rises.

The optimal buy-write delta is therefore a tradeoff that should be *discovered through operation*, not assumed from the put-side experience.

---

## Current Implementation Posture

The current Buy-Write implementation is intentionally explanatory rather than prescriptive. It exposes Yield, If Called, Delta, DTE, Execution, and other economic dimensions independently so that operator experience and accumulated evidence can reveal which dimensions best predict sustainable production. The implementation is therefore an instrument for learning as much as a recommendation engine.

The ranking modes available today — Yield, If Called, Execution, Balanced — are Level 1 evidence exposures and Level 2 policy choices. No Level 3 learned model exists yet, and none should be built until sufficient operating history justifies it.

---

## Open Questions (deferred, not resolved)

1. When is enough operating history sufficient to justify an Expected Production ranking mode? (~50 deployments? ~100?)
2. Should delta target eventually differ by entry mechanism by default? (Likely yes, but learn first)
3. Should the Cash Production accounting explicitly distinguish premium-production from appreciation-production to enable strategy-comparative learning?
4. Does "deployment velocity" (how quickly capital cycles) matter as a ranking signal for capital-constrained operators?
5. Should Wheelwright eventually present a unified "Where should this capital go?" surface rather than separate strategy boards? (See PL-DEPLOY-01)
6. What evidence collection is needed from day one to enable Level 3 learning later? (deployment records with: strategy, delta, DTE, premium received, assignment outcome, appreciation realized, days held, capital returned)

### Production Score Architecture (unresolved, from 2026-08-10 design review)

The following emerged from the Three-Actor architectural review of where a Production Score belongs in the Epistemic Pipeline. These are preserved as active architectural questions, not resolved decisions.

**7. Is execution quality a constraint or a score component?**

Two models were proposed simultaneously:

- Model A (gate): Execution policy → admissible opportunity → Production Score. Strong production economics cannot compensate for unacceptable execution. Execution disappears from the score once admitted.
- Model B (contribution): Production economics + execution quality → Production Score. Some execution weakness can potentially be compensated by stronger economics.

These are architecturally different. The same question applies to governance, concentration, affordability, and NAV-erosion boundaries: which are gates (binary admission), which are score dimensions (graded contribution), and why?

**8. What exactly is the object being scored?**

Production Score is placed at Operational Interpretation, before Recommendation, and described as feeding Recommendation ordering. But at the point where scoring would occur, an object already exists containing: underlying, contract, strike, expiration, premium, derived economics, execution assessment, governance, affordability.

Is there a first-class "Deployment Opportunity" between Derived Facts and Recommendation? Does our difficulty placing Production Score reveal a missing concept in the object model, or merely imprecise vocabulary? Do not invent a new abstraction merely to satisfy the pipeline — but test whether the pipeline predicts one.

**9. Production Score is NOT "forward-looking."**

It should be framed as a *pre-deployment interpretation of the current opportunity surface*, not a forecast. This keeps it firmly inside Policy over Prediction. The score interprets what is currently observable, not what will happen.

**10. Decomposition contract (candidate invariant).**

Any future Production Score must decompose to constituent Derived Facts through explicit, adjustable weights. Progressive disclosure from Score → Contributing Dimensions → Evidence must work without mystery at every stage.

---

## Relationship to Governing Principles

| Principle | Alignment |
|---|---|
| Preserve Optionality | Multiple entry mechanisms = preserved optionality; don't declare one canonical |
| Earn Proportional Compensation | "Expected realized production per unit capital deployed" is the regime's operationalization |
| Policy over Prediction | Expose evidence independently; learn before optimizing; explicit auditable policy |
| Closed-Loop Engineering | Buy-write exposing "premium ≠ production" is the observation loop working correctly |
| Conditioned Operating Opportunity | Same discipline: evidence first, don't prematurely incorporate into ranking |
| Evidence Appliance | Buy-write consumes same cached call chains with a different deterministic interpretation |
| State-Oriented Console | Eventually: "CSP surface weak / buy-write surface strong" as decision-space compression |
| Sustain Institutional Behavior | Optimize institutional outcomes over long horizons, not individual transactions |

**No governing principle needs to be overturned.** The existing principles naturally accommodate multiple cash-entry mechanisms and evidence-based learning about their applicability. One implementation-level assumption (shared numeric policy configuration) needs to become more flexible; the principles themselves are confirmed.
