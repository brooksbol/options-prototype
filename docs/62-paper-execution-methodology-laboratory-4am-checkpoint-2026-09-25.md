# Paper Execution / Methodology Laboratory — 4AM Reconciliation Checkpoint

**Date:** 2026-09-25  
**Status:** Reconciliation / checkpoint artifact — snapshot of current reasoning, not implementation authority  
**Authority:** Category D — Reconciliation / Checkpoint Artifact  
**Accepted-main baseline:** `063c4d0cb6ab3ea878cc3c1963b1c3c519d25a2f`  
**4AM evidence baseline:** Codex and Kiro independently analyzed accepted `4ff54ce756a9621a84b4171ff58cddfb782e7aeb`; the subsequent accepted-main advancement to `063c4d0` was one journal-only commit and does not alter the findings below.

## Purpose

Preserve the materially developed paper-execution / methodology-laboratory discovery and the completed Four Actor Model (4AM) evidence cycle before further brokerage-capability appraisal or canonical intake disposition.

This artifact records what was discovered, what the independent actors converged on, what was falsified, and what remains unresolved. It does **not** create a new `PL-*` identity, strategic Bet, architecture-roadmap item, ADR, experiment authorization, broker-submission authority, or implementation authorization.

## 1. Product discovery

The working Product hypothesis is more specific than conventional "paper trading":

> External simulated execution may provide a laboratory for testing methodology adherence.

The primary evaluation question is:

> Given the information available at the decision boundary, how faithfully did the operator's actions adhere to the selected methodology/regime?

Economic outcome remains evidence, but it must not retrospectively substitute for decision quality. A profitable departure from methodology can still be poor process; an unprofitable methodology-faithful decision can still be good process.

This hypothesis creates pressure to make supported methodologies/regimes explicit enough to evaluate adherence. The current technical Wheel definition in `docs/61-inner-game-governed-prescriptive-decision-discipline-2026-09-24.md` §29 is a rigorous specimen, not proof that the Wheel is a complete or universally accepted machine rubric.

## 2. Three concepts that must remain distinct

### Live execution
Real/live market evidence, real brokerage/account, real capital, and real execution.

### External paper execution
Real/live market evidence, an external simulated brokerage/account, and actual simulated orders submitted to that external venue.

### Counterfactual observation
Wheelwright records what it would recommend or decide, but submits nothing to a brokerage venue.

These are not economically or evidentially equivalent. In particular, counterfactual observation can evaluate Recommendation behavior but cannot by itself establish what an operator actually submitted to a venue.

## 3. Boundary: do not build a paper brokerage

The current hypothesis does **not** call for Wheelwright to build its own fake exchange, fake fills, assignment simulator, fictional brokerage account, or simulated order-lifecycle engine.

An external paper venue is the candidate owner of simulated execution mechanics. Wheelwright's prospective responsibility is the methodology/decision side: decision-time evidence, Recommendation, operator disposition/choice, Action, linkage to external paper execution, later observation, and eventual methodology-adherence evaluation.

Tradier sandbox is a candidate venue because Tradier is already present in Wheelwright's market-evidence architecture. Its actual trading/lifecycle behavior remains an external empirical unknown.

## 4. 4AM evidence cycle

The Principal supplied the Product discovery and constraints. ChatGPT reconstructed the governing context and commissioned independent read-only passes from:

- **Codex — Architect / adversarial reviewer**
- **Kiro — Implementation Engineer / repository-reality reviewer**

Both independently synchronized to accepted `4ff54ce756a9621a84b4171ff58cddfb782e7aeb` and returned substantive evidence.

### Convergence

Both actors independently concluded:

1. The methodology-laboratory hypothesis is coherent and materially useful.
2. The discovery overlaps existing durable concepts rather than obviously establishing one indivisible new capability.
3. Strong existing homes include:
   - `PL-DEC-BEH` — methodology adherence / process versus outcome;
   - `PL-TRAIN-01` — Live Simulation / behavioral laboratory;
   - `PL-EXEC-01` — submission and execution/lifecycle semantics;
   - `PL-BROKER-CAP` — brokerage-facing capability appraisal.
4. `PL-SEM-01`, AR7/AR8, ADR-019, and the lifecycle/outcome learning Bets provide additional semantic/architectural context.
5. No new strategic Bet is presently earned.
6. No new architecture-roadmap item is presently earned.
7. No new `PL-*` identity is presently established; the discovery may prove to be a cross-cutting refinement of existing identities.
8. Decision-time evidence must remain uncontaminated by later execution or outcome.
9. Live execution, paper execution, and counterfactual observation must remain semantically distinct.
10. Browser-local state cannot become authoritative paper-execution state.

## 5. Important falsification: sandbox submission is still submission

The strongest 4AM finding is that the attractive first experiment cannot be treated as an ordinary API spike.

Current ADR-004 establishes a broker-handoff boundary in which Wheelwright constructs broker-neutral intent / handoff but does not itself submit brokerage orders. An order sent programmatically to an external simulated venue is still an external order submission even when no real capital is at risk.

Therefore a backend Tradier-sandbox submission path crosses an existing accepted execution boundary.

This does **not** falsify the methodology-laboratory Product hypothesis. It falsifies the assumption that "paper" makes programmatic submission architecturally neutral.

No sandbox-order experiment or ORDER_EXECUTE capability is authorized by this checkpoint.

## 6. Production evidence + sandbox execution hypothesis

A candidate architectural direction survived adversarial review:

> Production versus sandbox should not be a global Wheelwright application mode. Provider environment should be bound to a particular capability invocation and account/provenance context.

A useful conceptual discriminator is:

`provider × capability × environment/account`

For example:

- Tradier / market evidence / production
- Tradier / degraded market evidence / sandbox
- Tradier / paper execution / sandbox

This is a **hypothesis**, not ratified architecture.

### Implementation evidence

Kiro found that current accepted code already has useful isolation machinery for market evidence:

- distinct production and sandbox provider authorities;
- independent adapters;
- independent credentials/configuration;
- independent response caches;
- independent request pacers;
- explicit environment/provenance.

However, the existing sandbox concept is an **evidence failover authority**, not a concurrently active execution capability. `ProviderAuthorityManager` exposes one active acquisition authority. Existing Tradier code is read-only market-data code and has no order preview/submit/status implementation.

Therefore the existing isolation substrate is encouraging evidence but does not itself solve the paper-execution problem.

## 7. Semantic chain

The 4AM reconciliation supports preserving at least these distinctions:

```text
Decision-time evidence / governed context
        ↓
Decision evaluation
        ↓
Recommendation
        ↓
Operator Disposition / choice
        ↓
Action / handoff intent
        ↓
External paper Order
        ↓
External order identity
        ↓
Simulated fill / execution evidence
        ↓
Lifecycle evidence
        ↓
Reconciled paper outcome
        ↓
Methodology-adherence observation
```

A paper Order must not be treated as proof that Recommendation, operator choice, Action, and execution were identical.

ADR-019 remains the appropriate upstream governed-Decision architecture. Paper execution must not manufacture a second Decision model merely because the current implementation has not fully realized the intended durable Decision substrate.

## 8. Browser-disposable persistence invariant

The following candidate acceptance invariant survived both passes and is strongly supported by existing backend-authority principles:

> The browser is disposable. Destroying browser state and reopening Wheelwright must neither destroy authoritative paper-execution state nor invent/reconstruct authoritative state from browser storage.

Kiro found that current implementation would fail this test for execution/account state:

- pending intents are browser-local;
- brokerage-account identity is browser-local;
- no backend paper-order identity exists;
- no backend Decision→external-order association exists.

The backend currently has no appropriate paper-order/account persistence concept.

If Wheelwright later claims durable knowledge of an external paper order, at minimum the durable correlation needed to re-observe that order cannot exist only in browser storage.

## 9. Candidate bounded experiment — preserved, not authorized

If architecture and brokerage-capability reconciliation later authorize an experiment, the smallest meaningful specimen currently hypothesized is:

1. Existing production evidence acquisition remains unchanged.
2. One explicitly sandbox-bound backend execution capability exists independently of production evidence authority.
3. Select one exact option contract associated with a replayable governed Decision.
4. Preserve the operator Action/submission semantics without collapsing them into Recommendation.
5. Preview one sandbox order if the provider supports preview.
6. Submit one one-contract limit order.
7. Capture environment, sandbox account identity, external order ID, timestamps, and status.
8. Durably associate the external execution identity with the originating governed Decision/Action.
9. Destroy browser state and restart.
10. Recover the association from backend persistence and re-observe external state.
11. Verify that real portfolio, Production, and real lifecycle truth remain unchanged.
12. Stop.

Success would mean **isolation + provenance + durable reconstruction**, not fill, profit, methodology score, or UX completeness.

### Falsifiers / false-positive forms

The experiment would fail its architectural purpose if:

- it requires a global production/sandbox mode;
- sandbox execution can redirect or relabel production evidence;
- credentials/endpoints/accounts can cross capability boundaries;
- paper facts enter real portfolio/lifecycle truth;
- Decision, Recommendation, Action, and external Order identities collapse;
- authoritative order correlation exists only in browser storage;
- restart loses authoritative correlation;
- same-process API success is presented as proof of durable architecture;
- a standalone Tradier script is presented as proof of Wheelwright isolation;
- retry after uncertain submission can silently create duplicate orders.

## 10. Explicitly out of scope

This checkpoint does not authorize or imply:

- adherence scoring;
- a generic methodology/regime engine;
- declaring the Wheel canonical;
- historical/accelerated simulation;
- counterfactual replay engine;
- paper P&L system;
- complete trade ledger;
- Wheelwright-owned fill or assignment simulation;
- full Training Mode implementation;
- autonomous trading;
- real-order submission;
- generic trading terminal;
- multi-leg/generalized execution;
- generalized provider-capability framework;
- strategy/policy changes based on paper outcomes.

## 11. External Tradier unknowns

Repository evidence does not establish:

- supported sandbox option order types/durations;
- preview semantics;
- sandbox account provisioning and stable account identity;
- trading-endpoint authentication/entitlements;
- trading-endpoint rate limits;
- external order-id durability;
- order-status vocabulary/transitions;
- timeout/retry/idempotency behavior;
- partial fills or cancel/replace behavior;
- fill-generation realism;
- expiration/exercise/assignment simulation;
- order/fill retention;
- timestamp semantics;
- whether sandbox execution operates against delayed, synthetic, or other price inputs;
- whether sandbox behavior is adequate evidence for real execution quality.

These require provider evidence and/or empirical appraisal before claims are promoted.

## 12. Current intake / governance interpretation

The discovery is materially developed enough that losing it would create reconstruction risk; this checkpoint preserves it.

The 4AM evidence currently favors **cross-cutting refinement of existing durable concerns** rather than a new strategic Bet, AR, or standalone identity. That is not yet a canonical intake disposition.

Codex identified `PL-BROKER-CAP` as currently **INTAKE — further exploration / problem-space appraisal only**, with no broker/API experiment, ORDER_EXECUTE authority, or implementation authorization. Its reported next authorized action is to appraise the four brokerage-facing capability surfaces from incumbent evidence.

This checkpoint preserves that state rather than skipping it.

## 13. Accepted-main advancement reconciliation

The independent Codex/Kiro passes used accepted `4ff54ce756a9621a84b4171ff58cddfb782e7aeb`.

Before this checkpoint was written, accepted `main` advanced by one commit to `063c4d0cb6ab3ea878cc3c1963b1c3c519d25a2f`.

The intervening commit modifies only `docs/journal/project-journal-5.md` and records BUG-026/BUG-027 Principal acceptance, the `PL-OPS-CSV-01` operator-cost signal, Roadmap Log BUG-tag legibility work, and an unrelated duplicate-AR1 test defect. It does not alter the paper-execution/methodology-laboratory authority, provider architecture, ADR-004 boundary, or the 4AM findings preserved here.

Therefore this checkpoint is written against accepted `063c4d0cb6ab3ea878cc3c1963b1c3c519d25a2f` while retaining the actors' exact `4ff54ce` evidence provenance.

## 14. Snapshot state

At this checkpoint:

- Product hypothesis: **preserved; survived 4AM attack**
- 4AM independent evidence: **complete**
- New strategic Bet: **not established**
- New AR: **not established**
- New `PL-*`: **not established**
- Canonical intake/reconciliation completion record: **not established by this artifact**
- ADR-004 amendment/exception: **not established**
- Sandbox-order experiment: **not authorized**
- ORDER_EXECUTE: **not authorized**
- Implementation: **not authorized**
- Candidate next work: **incumbent brokerage-facing capability appraisal under current `PL-BROKER-CAP` authority**

---

CURRENT STATE: PAPER-EXECUTION / METHODOLOGY-LABORATORY 4AM CHECKPOINT PRESERVED; PRODUCT HYPOTHESIS SURVIVES; ADR-004 SUBMISSION BOUNDARY AND PL-BROKER-CAP INTAKE LIMIT REMAIN; NO EXPERIMENT OR IMPLEMENTATION AUTHORIZED

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: APPRAISE THE FOUR BROKERAGE-FACING CAPABILITY SURFACES FROM INCUMBENT EVIDENCE
