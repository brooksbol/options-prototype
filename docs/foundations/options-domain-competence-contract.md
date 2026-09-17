# Wheelwright Options Domain Competence Contract

**Ratified:** September 16, 2026  
**Status:** Principal-ratified domain competence contract  
**Authority:** Category B — Ratified Decision / Accepted Methodology  
**Applies to:** Principal + ChatGPT + Kiro + Codex when performing outcome-bearing options work  
**Composes with:** Wheelwright's Category A authority, later explicit Principal direction, and `shared-execution-contract.md`

---

## 1. Purpose

Wheelwright SHALL NOT design, implement, review, or accept outcome-bearing options behavior from software requirements alone.

Before dependent work proceeds, the actor SHALL establish enough of the applicable options economics to reason correctly about the **complete economic position and its relevant lifecycle**.

The repository, implementation, tests, prior accepted behavior, or UI behavior SHALL NOT be treated as self-validating evidence that the underlying options economics are correct.

This contract governs domain competence required to enter dependent options work. Once that economic model has been established and outcome-bearing execution proceeds, the Shared Execution Contract remains the primary shared execution contract governing observation, verification, and acceptance.

## 2. Entry Condition

This contract applies when work creates, changes, reviews, or accepts behavior materially dependent on what an option position economically **is or does**.

Grounding SHALL occur before substantive dependent implementation reasoning.

Previously established grounding MAY be reused when it is applicable, sufficiently current, and supported by appropriate authority.

This contract does not require exhaustive options research for every change. Grounding SHALL be proportional to the economic claims on which the work depends.

## 3. Core Obligation

Actors SHALL reason from the **complete economic position and relevant lifecycle**, not solely from an isolated option leg, Greek, quote, heuristic, UI state, implementation artifact, or lifecycle label.

Where relevant to the dependent behavior, the actor SHALL establish:

1. assets and instruments owned or owed;
2. applicable contract identity, settlement form, and deliverable;
3. long and short rights and obligations;
4. quantities, including partially closed, exercised, or assigned quantities;
5. supporting or encumbered assets, cash, collateral, or capacity;
6. the economic transition caused by BTO, STO, BTC, STC, exercise, assignment, expiration, or other relevant lifecycle event;
7. resulting assets, liabilities, rights, and obligations;
8. residual economic exposure;
9. relevant valuation primitives, including intrinsic and extrinsic value where applicable;
10. position-level exposure rather than an isolated-leg metric where the conclusion concerns the position;
11. material lifecycle mechanics, including early exercise or assignment, distributions, expiration uncertainty, settlement, and adjusted deliverables where applicable; and
12. the evidence and policy required for the conclusion being made.

Purchase, delivery, share-count, multiplier, and settlement assumptions SHALL NOT be generalized across contracts without establishing the applicable contract terms. Physical-settlement descriptions apply only when physical settlement has been established.

## 4. Independent Domain Grounding

Wheelwright SHALL NOT use its own implementation, tests, documentation, or historical behavior as the sole proof of an economically load-bearing options mechanic.

When a required mechanic is missing, ambiguous, contradictory, or materially uncertain, the actor SHALL independently seek claim-appropriate external authority before dependent work proceeds.

User- or Principal-supplied sources are evidence inputs, not boundaries on discovery.

Authority SHALL be appropriate to the claim, for example:

- clearing, exchange, regulatory, or applicable contract authority for contractual and lifecycle mechanics;
- broker documentation and authoritative account evidence for broker/account treatment;
- established financial theory for payoff, valuation, exposure, Greeks, and synthetic relationships;
- empirical research for empirical claims; and
- practitioner material for attributed conventions, heuristics, and hypotheses.

Practitioner convention SHALL NOT silently become contractual fact, empirical fact, strategy intent, or Wheelwright policy.

Where credible authority qualifies or contradicts supplied material or existing Wheelwright assumptions, the qualification or contradiction SHALL be preserved and reconciled rather than silently normalized.

## 5. Mechanics, Evidence, and Policy

Actors SHALL distinguish:

**Mechanics** — What economically happens?

**Evidence** — What admissible facts establish that the mechanic, state, execution, or condition applies to this position?

**Policy** — Given established mechanics and evidence, what does authoritative Wheelwright policy prefer?

These categories SHALL NOT substitute for one another.

A mechanically possible outcome does not establish that Wheelwright prefers it.

A preferred policy does not permit mechanics or evidence to be invented.

Evidence unavailable for one conclusion SHALL NOT erase another conclusion whose dependencies are independently satisfied.

Unresolved policy SHALL NOT be represented as missing domain knowledge.

## 6. Complete-Position Invariant

No economically load-bearing conclusion SHALL be derived solely from an isolated option leg when the complete position materially changes its meaning.

The actor SHALL include relevant underlying assets, cash, other option legs, resulting holdings, obligations, and residual exposure.

Different lifecycle forms SHALL NOT automatically be treated as different terminal economics, nor SHALL terminal-payoff similarity erase material lifecycle, financing, execution, settlement, capital, or exposure differences.

For example, BTC of a short put and BTC of a covered call both retire an established quantity of a short-option obligation, but they do not create the same residual economic position. Closing the covered call does not itself dispose of the underlying shares or eliminate their downside exposure.

## 7. Capital and Closure Invariant

Actors SHALL distinguish:

- mechanical notional;
- contractual obligation;
- collateral or encumbrance;
- margin requirement;
- broker reserve;
- broker buying power;
- settled cash; and
- deployable capital.

One SHALL NOT be represented as another without appropriate evidence.

A short put alone does not establish that the position is cash-secured.

Closing an option obligation removes the obligation and attributable encumbrance for the quantity authoritatively closed, subject to the remaining complete position. It does not by itself establish that supporting assets or cash are otherwise unencumbered or deployable.

BTC ordinarily requires a cash debit. Before execution, an indicative quote, midpoint, model value, or proposed price is not authoritative evidence of the executed closing debit. Once execution is authoritative, actual execution evidence governs the debit, fees, and resulting state.

Unavailable closing-price evidence SHALL withhold conclusions that depend on that price. It SHALL NOT suppress independently supported conclusions that do not depend on it.

Closure SHALL NOT be inferred merely from economically offsetting exposure elsewhere. BTC SHALL NOT be represented as undoing an assignment already effected.

## 8. Lifecycle and Quantity Invariant

Lifecycle reasoning SHALL preserve the quantity actually affected by an event.

Exercise, assignment, closing, or expiration MAY resolve only part of a multi-contract position. Residual contracts and their obligations SHALL remain represented until authoritative evidence establishes their resolution.

Expiration moneyness alone SHALL NOT establish the final resulting position where exercise-by-exception, contrary instructions, after-hours movement, allocation, notification timing, or applicable broker procedures can leave the lifecycle outcome unresolved.

Adjusted contracts SHALL be interpreted from applicable contract authority. Deliverable quantity, premium or strike dollar-extension factors, contract-count adjustments, and other contract-specific scaling concepts SHALL NOT be collapsed into an assumed universal “100 shares at strike” model.

## 9. Exposure, Probability, and Roll Invariant

A local option metric SHALL NOT be substituted for complete-position or lifecycle analysis.

Delta is a sensitivity measure. Model-dependent probability interpretations MAY be valid when their event, horizon, measure, model, and assumptions are established. Delta alone SHALL NOT establish assignment probability, probability of touching, intent, or the complete position's economic risk.

A roll MAY be entered operationally as a combined order, but economically it contains a closing transaction and a new opening transaction. A net roll credit or debit SHALL NOT by itself establish profit, recovery of a prior loss, improved risk, or preferable economics.

## 10. Intent Invariant

Moneyness, DTE, delta, premium captured, exercise economics, assignment possibility, expiration geometry, or closing cost SHALL NOT by themselves establish the desirability of:

- assignment;
- exercise;
- expiration;
- BTC;
- STC;
- rolling;
- acquisition;
- disposition; or
- continued ownership.

Desirability SHALL come from authoritative Wheelwright policy or explicit Principal direction.

Economic incentives affecting a holder's exercise decision SHALL NOT be represented as proof that exercise or writer assignment will occur. Distribution-sensitive early exercise, for example, may depend on continuation value, financing, feasible alternatives, and applicable contract terms—not merely a single dividend-versus-extrinsic comparison.

## 11. Support Status

Domain understanding and Wheelwright support status SHALL remain distinct.

A concept or behavior may be:

- **understood and operationalized;**
- **understood and explicitly unsupported;** or
- **not established / unresolved.**

Where appropriate, Wheelwright MAY state:

> Mechanics established; implementation absent; support decision not established.

Nonimplementation SHALL NOT establish rejection.

Likewise, understood industry concepts or practitioner practices SHALL NOT become Wheelwright strategy or policy merely because they are documented.

## 12. Diagnostic Routing

Uncertainty SHALL be classified before dependent work proceeds.

**Unresolved mechanics or contradictory domain authority**

> **STOP DOMAIN — NOT SPECIFIED**

Use when the economic mechanic required for the dependent behavior cannot presently be established or authoritative sources materially conflict.

**Required current evidence unavailable**

Fail closed only for conclusions dependent on the missing evidence. Preserve independent conclusions whose dependencies remain satisfied.

**Mechanics and evidence established, preference unresolved**

Record an unresolved policy boundary. Do not invent the preference and do not misclassify it as missing domain knowledge.

**Implemented intended behavior but required outcome genuinely cannot presently be observed**

Use **NOT VERIFIED** under the Shared Execution Contract only when the applicable observation path is genuinely unreachable. If an observation path exists, use it.

**Established contradiction involving safety, correctness, integrity, reversibility, authority, or execution**

Use Wheelwright's existing BLOCKER/contradiction authority.

Only dependent work SHALL stop. Investigation, retrieval, research, and independent work MAY continue.

A `STOP DOMAIN — NOT SPECIFIED` report SHALL identify:

- unresolved economic question;
- dependent behavior;
- economic significance;
- grounding attempted;
- concrete ambiguity or error that proceeding would introduce; and
- diagnostic classification.

Actors SHALL NOT bridge the gap using implementation convenience, an existing test, UI assumptions, symmetric rules borrowed from another structure, remembered general knowledge represented as Wheelwright authority, or invented policy.

## 13. Verification and Acceptance

Tests MAY verify that implementation conforms to a specification. They do not establish that the specification is financially or economically correct.

For economically load-bearing behavior, verification SHALL be capable of tracing:

**before-state → contemplated action or lifecycle event → resulting assets and obligations → resulting exposure → evidence dependencies → governed policy result**

When behavior is claimed to generalize across materially different economic structures, a contrasting semantic specimen SHALL be used unless current verified evidence already covers that distinction.

Handoff and acceptance SHALL identify, where material:

- complete economic position;
- relevant mechanics;
- evidence dependencies;
- governing intent or policy;
- specimen or economic trace used;
- contrasting structure used where required; and
- remaining domain uncertainty.

The Shared Execution Contract governs subsequent observation and outcome verification.

## 14. Effectiveness and Falsification

This contract does not assume that missing domain competence is the sole cause of Wheelwright defects.

Its purpose is to prevent economically incorrect assumptions from becoming expensive implementation work without first being exposed.

Repeated reconstruction of the same domain primitive is evidence that durable reference authority or retrieval may be preferable to repeated rediscovery.

If actors satisfy this contract yet continue to produce economically incorrect options behavior, the adequacy of this contract and the underlying causal hypothesis SHALL be reconsidered.

Success is not measured by the number of stops, citations, documents, or ceremonies. Success is economically correct work reaching implementation without avoidable domain errors.

## 15. Scope

This contract:

- does not prescribe Wheelwright trading strategy;
- does not require implementation of every understood options concept;
- does not convert practitioner convention into policy;
- does not resolve unsettled Principal preferences;
- does not require exhaustive research for every change;
- does not replace existing architecture, evidence, accounting, policy, or execution authority; and
- does not establish that every options concept documented by Wheelwright is supported by the product.

Its requirement is narrower:

> **Before Wheelwright spends implementation effort on economically load-bearing options behavior, the actors must know what the position actually is, what the contemplated action actually does, what evidence supports that conclusion, and where Wheelwright policy begins.**
