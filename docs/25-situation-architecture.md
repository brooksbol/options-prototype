# Situation-Based Operation

**Status:** Architecture direction accepted; Bridge Income is the first implementation target
**Date:** August 2026

---

## Core Idea

Wheelwright already embodies an implicit operating situation. The current system expresses a philosophy — generate quality option income, preserve capital, prefer favorable assignment, optimize premium quality, provide evidence-backed explanations — without naming it as a situation.

Rather than replacing this, we make it explicit.

A **situation** is the operator's declared context that shapes how Wheelwright reasons about recommendations, explanations, and portfolio health. It adds context, constraints, and optimization priorities to existing capabilities. It does not replace the evidence acquisition, portfolio model, recommendation engine, or operator surfaces.

### Architectural Role

Situation operates as **cross-cutting context within the Application Shell**, not as a peer to the Four Engines or as a page-level input to one surface. It shapes how all operational surfaces behave:

- The **Console** renders portfolio state through the lens of the active situation (e.g., decision pressure thresholds may be situation-informed).
- The **Deployment surface** prioritizes recommendations against the mission (e.g., mission gap drives urgency).
- **Production** assesses output against situation-defined targets (e.g., monthly $6,000 for Bridge Income).
- **Explanation** frames recommendations in situational terms rather than generic metrics.

This cross-cutting nature is why situation belongs in the Application Shell (shared operating context) rather than owned by any individual surface.

---

## What a Situation Is

A situation contributes:

- **Context** — why the operator is doing this
- **Constraints** — what boundaries must be respected
- **Optimization priorities** — what the operator values most
- **Explanation framing** — how recommendations are justified to the operator

A situation is NOT:

- A set of option-screening parameters
- A replacement for existing recommendation mechanics
- A framework requiring speculative abstraction
- A market prediction or forecast

---

## The Reasoning Direction

Situations introduce top-down recommendation logic:

```
Situation
    ↓
Mission (what must be accomplished)
    ↓
Desired Outcomes (what success looks like)
    ↓
Operating Envelope (acceptable boundaries)
    ↓
Greek Profile (implementation parameters)
    ↓
Candidate Selection (specific contracts)
```

This means delta, DTE, premium, assignment probability, and spread quality are tools used intelligently in service of an outcome. They are not optimization goals themselves.

The same contract can be a strong fit under one situation and a poor fit under another — not because the evidence changed, but because the situation changed.

### Concrete example

A covered call on XLE at the $57.50 strike may have attractive premium ($0.63, 19% annualized). Under a situation that prioritizes cash flow above all else, this is a strong candidate.

But if the operator's cost basis is $55.93 and the effective exit (strike + premium = $58.13) represents only $2.20 of gain while surrendering future upside, a situation that also values NAV preservation would assess this differently. The same evidence, different conclusion — because the reasoning starts from the situation's objectives, not from the premium alone.

---

## Situation 0: Current Implementation

The existing Wheelwright implementation is Situation 0. It operates with implicit assumptions:

- Maximize execution quality and yield
- Prefer admissible delta range (0.15–0.50)
- Require minimum liquidity
- Shared policy for puts and calls
- No explicit cash-flow target
- No explicit time horizon
- No explicit assignment-economics optimization

Making this explicit means the current behavior is preserved as the default operating mode. Nothing is lost; the implicit becomes named.

---

## Bridge Income: First Explicit Situation

Bridge Income is the first named situation because it reflects a real operating context today.

**Purpose:**

> Produce required monthly cash flow over a finite horizon while minimizing avoidable NAV erosion and preserving future portfolio capacity.

**Concepts introduced by Bridge Income:**

- Monthly cash-flow target (e.g., $6,000/month)
- Bridge horizon (e.g., 18 months)
- Liquidity floor (minimum available capital preserved)
- Assignment economics (effective exit relative to cost basis)
- Mission gap (shortfall between current production and target)
- Eligible AUM (capital available for deployment)

**What Bridge Income changes about recommendations:**

- Recommendations become mission-aware: "Is this a good covered call *for Bridge Income*?"
- The drawer explains fit in situational terms: "This contract contributes $630 toward the monthly $6,000 target. Effective exit is $2.20 above basis."
- A contract with excellent premium but poor assignment economics may be classified differently than under Situation 0
- The operator sees how each action serves the mission, not just how it scores on execution quality

**What Bridge Income does NOT change:**

- Evidence acquisition
- Market session model
- Provider integration
- Chain data structure
- Execution assessment mechanics (spread, OI, volume scoring)
- Portfolio snapshot model
- CSV parsing

---

## Unified Recommendation Surface

Under situation-based operation, the primary recommendation table contains portfolio actions that fit the current situation:

- Sell Covered Call
- Sell Cash-Secured Put
- Buy-Write (purchase shares + sell covered call simultaneously)

The table answers: "What actions belong in today's work queue?"

Puts and calls are both portfolio actions in service of the mission. The current implementation split (separate puts and calls sections) is an artifact of the recommendation engine's structure, not an inherent operator-model requirement. Whether the unified table replaces the current split or supplements it is an implementation decision that should emerge from use.

---

## Explainability

Every recommendation drawer should contain a structured explanation tied to the current situation:

- Why this fits the current situation
- Assignment economics (effective exit relative to basis)
- Cash-flow contribution (toward monthly target)
- Portfolio impact
- Alternatives considered (why this contract instead of nearby strikes)

The explanation always references the operator's declared objectives rather than presenting context-free metrics.

---

## Principles

**The operator defines the situation.** Wheelwright does not require the operator to predict the market. It adapts to observed conditions within the operator's declared context. The operator sets objectives and constraints; the system identifies opportunities that serve them.

**Wheelwright is an active portfolio-operations tool.** It is not trying to replace passive investing or become a general financial planner. It serves operators who consciously trade time and cognitive effort for a particular portfolio outcome. Its job is to reduce unnecessary cognitive load while preserving operator agency.

**Build one situation, then extract.** The architecture should emerge from implementation rather than precede it:

1. Make today's implicit situation explicit (Situation 0)
2. Implement Bridge Income
3. Operate it with real portfolio
4. Learn from operational experience
5. Implement the next situation when a real need arises
6. Extract reusable abstractions only after multiple situations demonstrate commonality

Do not build a situation framework, registry, or configuration system until at least two concrete situations exist and their shared structure is observable rather than speculated.

---

## Future Situations (Illustrative, Not Specified)

These represent potential future operating contexts. They are not designed, specified, or committed:

- **Liquidity Repair** — portfolio has suffered a drawdown; objective shifts from income production to capital recovery with reduced deployment risk
- **Capital Recovery** — similar to Liquidity Repair but with a longer horizon and more aggressive posture
- **Durable Retirement Income** — indefinite horizon; sustainability and NAV preservation dominate over production rate

Each would introduce its own context, constraints, optimization priorities, and explanation framing while reusing the same underlying evidence and recommendation machinery.

---

## Relationship to Existing Architecture

| Existing Capability | Relationship to Situations |
|--------------------|-----------------------------|
| Evidence acquisition | Situation-agnostic. Market data doesn't change based on operator intent. |
| Portfolio snapshot | Situation-agnostic. Positions and balances are factual regardless of context. |
| Recommendation engine | Situation-informed. Mechanics are reusable; optimization target becomes situation-derived. |
| Execution assessment | Reusable. Spread, OI, volume scoring doesn't change per situation. |
| Policy configuration | Becomes situation-derived rather than manually tuned. Delta/DTE targets may vary per situation. |
| Operator Console (DTE ladder) | Renders the portfolio under any situation. Health classification may become situation-aware. |
| Production surface | Situation-informed. Monthly production assessed against situation-defined targets. Bridge Income's cash-flow requirement gives Production its mission-relative dimension. |
| Drawers and explainability | Explanation framing becomes situation-contextual. |
| Epistemic Integrity | Unchanged. The system must never imply more certainty than evidence supports, regardless of situation. |

---

## What This Document Does NOT Specify

- Situation switching UI or navigation
- Configuration schema or persistence model
- Framework, registry, or plugin architecture
- How situations compose or conflict
- Implementation timeline for future situations beyond Bridge Income
- Changes to existing code (Situation 0 = current behavior, unchanged)

These will emerge from building and operating Bridge Income.
