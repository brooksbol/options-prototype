# LVT Owned-Capital / Consequence Reconciliation — 2026-09-09

**Status:** Ratified strategic reconciliation / why-state  
**Authority:** Supporting reconciliation record; canonical strategic state lives in `docs/roadmap.md`  
**Decision:** Principal ratified during a 3AM cycle (Principal + ChatGPT + Kiro) on 2026-09-09  
**Repository baseline at ratification:** `8b8d3ebc095a17642aebf473b9ff0688aafa74d4`

---

## Purpose

Preserve the reasoning that hardened three existing LVT Bets after live owned-capital evidence from BNO, COPX, GDX, and the COPX→SOXX feasible-set observation. This reconciliation does not create a new Goal or Bet and does not authorize implementation.

The core operator problem became clearer:

1. **What governed alternatives are actually available for already-deployed capital?**
2. **How does changing one capital block alter what becomes feasible elsewhere?**
3. **What does each alternative cost or leave behind in money, time, risk, compensation, retained participation, resulting state, and next decision boundary?**

The existing LVT structure already has distinct strategic homes for those questions. The reconciliation therefore strengthens the tree rather than redesigning it.

---

## Ratified strategic hardenings

### `LVT-BET-LIFECYCLE-CHOICES` — Lifecycle Alternative Comparison

Harden the Bet around comparison of the complete governed alternatives available for already-deployed capital.

The strategic concept is broader than a fixed mechanism list. Current evidence includes HOLD, SELL/CLOSE, ROLL, covered call, collar, and natural resolution, but future mechanisms may also qualify. The Bet owns **what actions are genuinely available**, not the consequence model for those actions.

### `LVT-BET-CAPITAL-CHOICES` — Capital State Determines Feasible Choices

Harden the Bet around **capital-state coupling / feasible-set optionality**.

The COPX→SOXX observation demonstrated a dynamic effect stronger than collateral bookkeeping: changing one capital position can materially alter the feasible-alternative set elsewhere in the portfolio. Releasing COPX capital could make an otherwise unaffordable SOXX deployment feasible.

No new Bet is required. This is a stronger and more specific expression of the existing capital-state hypothesis.

### `LVT-BET-CONSEQUENCE-ENVELOPE` — Consequence Envelopes

Harden the Bet beyond terminal payoff geometry. Consequence envelopes should make economically material effects explicit across:

- money;
- time;
- risk/downside envelope;
- compensation;
- retained participation / recovery room;
- resulting capital state; and
- next natural decision boundary.

This is the correct strategic home for release/retention consequence representation. The evidence arose during lifecycle reasoning, but consequence semantics belong under the Consequences Goal rather than the Choices Goal.

---

## Ratified new Initiative

### `LVT-INIT-CONSEQUENCE-RELEASE-COST` — Release / Retention Consequences

Represent release/retention consequences as independent operator-facing facts, including monetary release cost where knowable, temporal encumbrance, compensation while waiting, downside envelope, retained participation/recovery room, resulting state, and next decision boundary.

### Precision boundary

The Initiative is **not** broadly blocked on complete lot-level basis maturity.

Wheelwright can truthfully expose several consequences without lot-level basis attribution, including:

- approximate cash released from selling, using current market value;
- duration of continued encumbrance;
- approximate covered-call compensation from current option evidence;
- collar downside floor / bounded downside from strikes and option evidence;
- the next expiration/decision boundary; and
- structurally different resulting states.

Exact lot-specific basis-sensitive monetary erosion is different. That claim requires adequate basis attribution, especially for symbols with multiple lots at different acquisition prices.

Therefore:

> **`LVT-INIT-OUTCOME-BASIS` is a dependency for exact lot-specific basis-sensitive consequence claims, not a prerequisite for consequence comparison as a whole.**

Where evidence cannot support exact basis-sensitive precision, Wheelwright should mark the figure approximate/unavailable rather than suppressing the other truthful consequence facts. This is an application of the roadmap's Trustability differentiator.

---

## Strategic separation preserved

The reconciliation deliberately preserves the LVT Goal separation:

- **Choices:** `LVT-BET-LIFECYCLE-CHOICES` — what governed alternatives are available?
- **Choices:** `LVT-BET-CAPITAL-CHOICES` — how does current or changed capital state alter the feasible set?
- **Consequences:** `LVT-BET-CONSEQUENCE-ENVELOPE` — what does each alternative cost, expose, retain, or produce?
- **Consequences:** `LVT-BET-EXPLANATION` — how are meaningful tradeoffs explained comparatively?

The resulting strategic chain is:

> **available alternatives → feasible capital choices → consequences of each → comparison/explanation**

---

## Explicit non-goals

This ratification does **not** authorize or imply:

- a universal or scalar Deployment score;
- a generalized capital-state machine;
- a capital-path optimizer;
- recovery-probability or price prediction;
- automatic Sell→redeploy behavior;
- automatic trading or direct broker execution;
- a generalized multi-leg / mechanism framework derived from these cases; or
- implementation of a Share Deployment or Capital Deployment surface.

Complexity remains evidence-earned.

---

## Evidence provenance

This reconciliation builds on the existing `PL-DEPLOY` discovery sequence, especially:

- `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`;
- `docs/48-covered-call-basis-positive-optionality-discovery-2026-09-08.md`; and
- `docs/49-share-capital-release-cost-decision-discovery-2026-09-08.md`.

Those records preserve the underlying BNO/COPX/GDX and COPX→SOXX observations. This record preserves the later 3AM strategic classification and Principal ratification.

---

## Decision result

**Ratified:** harden `LVT-BET-LIFECYCLE-CHOICES`, `LVT-BET-CAPITAL-CHOICES`, and `LVT-BET-CONSEQUENCE-ENVELOPE`; add `LVT-INIT-CONSEQUENCE-RELEASE-COST`; preserve the narrow, claim-specific dependency on `LVT-INIT-OUTCOME-BASIS`; preserve the stated non-goals.

**Not decided here:** implementation sequencing, exact UI representation, architecture changes, or whether the owned-capital thread should precede `LVT-BET-EVIDENCE-PRIORITY` in execution sequencing.