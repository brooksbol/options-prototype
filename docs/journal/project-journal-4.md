# Project Journal — Continuation 4

> **Continuation notice.** This file is physical page 4 of the single logical Wheelwright project journal. It continues `docs/journal/project-journal.md`, `-2`, and `-3` with no lesser authority or durability. File boundaries are pagination only; topical retrieval and chronological reconstruction must scan the complete `docs/journal/project-journal*.md` sequence (see `docs/README.md` Project-Journal Continuation Rule and `docs/bootstrap/project-memory-protocol.md`).
>
> **Why a new page here:** page `-3` carried concurrent uncommitted why-state from a separate active thread (`PL-RECIPE-01` intake) at the time this entry was written. Per the multi-actor shared-working-state discipline (`foundations/multi-actor-repeatability-temporal-synchronization.md` §10), that unowned working state must not be absorbed, staged, or committed by another actor. Opening this continuation lets this entry be committed as owned work without disturbing the concurrent page-`-3` edits. This is coordination hygiene, not a claim that `-3` was full.

---

## 2026-09-16 — Existing Short-Obligation HOLD vs CLOSE — why-state preserved; bounded V1 design produced (three-actor reconciliation)

**Actor:** Kiro (repository-resident architecture/implementation partner), invoked in an authorized documentation-preparation + design-decomposition cycle.
**SYNC SHA at work:** `7b4a0843295bfed52584e4b5d97efd4eb7eacdd1` (remotely verified accepted `main`; advanced from the prior investigation's `0bb91c5`).
**Mode:** Design / why-state preservation. **Not** implementation authorization.
**Durable design artifact:** `docs/design/existing-short-obligation-hold-vs-close-v1-design.md`.
**This entry preserves the *why*, not the record.** Canonical strategy remains `docs/roadmap.md`; the design decomposition is the design file; ownership seam provenance is `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md`.

### What was accepted

The Principal approved the three-actor reconciliation for an **Existing single-leg short-option obligation lifecycle assessment — HOLD vs CLOSE V1**. The capability: for an existing short obligation, compare the *independent forward consequences* of **HOLD** (continue) versus **CLOSE** (buy-to-close now, retire the obligation). V1 exposes trustworthy consequence facts; **V1 does not choose the winner**. The corrected architectural question is not "when should Wheelwright buy this back" but "what are the consequences of continuing versus retiring now, and is there enough trustworthy evidence to compare them."

### Actor convergence (preserved)

Kiro, Codex, and ChatGPT independently converged on the same architecture:

- **Ownership seam is already ratified — do not create a BTC-specific architecture.** Alternatives (that HOLD/CLOSE are the applicable transitions) belong to `LVT-BET-LIFECYCLE-CHOICES` (`LVT-INIT-LIFE-COMPARE`, `LVT-INIT-LIFE-TRANSITIONS`). Independent consequence facts belong to `LVT-BET-CONSEQUENCE-ENVELOPE` (`LVT-INIT-CONSEQUENCE-RELEASE-COST`), whose shipped owned-share consequence v1 design is the direct architectural precedent. Comparative judgment/"which survives" belongs to `LVT-BET-EXPLANATION` + `LVT-BET-ACCEPTABILITY`. Governed BTC/take-profit *policy* is `LVT-BET-LIFECYCLE-POLICY` / `LVT-INIT-POLICY-TAKE-PROFIT`; BTC *mechanics* experimentation is `LVT-EXP-BTC-MECHANICS`. Lifecycle-transition/execution semantics and the non-negotiable CLOSE-vs-ROLL separation are `PL-EXEC-01`. Behavioral discipline is `PL-DEC-BEH`.
- **No new `PL-*` and no new LVT identity is justified.** The existing identities own every piece. The prior read-only reconciliation (SYNC `0bb91c5`) established that BTC is not a new durable concept; this cycle re-verified it against advanced `main` and did not disturb that conclusion.
- **Consequence evaluator consumes a supplied alternative; it must not discover/enumerate the alternative set.** Same ownership boundary the release-cost design established (`evaluateConsequences(position, suppliedAlternative) → facts`).

### The load-bearing economic distinction (why-state worth keeping)

The design must hold a strict wall between **historical economics** (opening credit, realized premium, premium-captured %, historical P/L — "what has happened so far") and **forward consequences** ("from this instant, what changes if the operator continues vs closes"). The forward comparison is the actual HOLD-vs-CLOSE question. Historical P/L, premium-captured %, sunk cost, and "getting back to even" must never masquerade as forward value. This is a direct expression of `PL-DEC-BEH` (Mechanics over Impulse; sunk-cost/reference-point effects) and ADR-014 (premium recognized once at receipt; resolving capital is not forecast production). Opening-credit attribution can be incomplete (multiple STOs, partial closes, reopenings, overlapping lots — Codex finding), so historical facts are **degradable context, never a hard dependency** for the forward comparison — mirroring the ratified precision-boundary precedent in `LVT-INIT-CONSEQUENCE-RELEASE-COST` (`exact`/`approximate`/`unavailable`).

### Synchronization delta caused by newly-accepted Greek/IV evidence

Since the prior reconciliation, accepted `main` advanced to `7b4a084` ("surface provider Greeks + IV on Deployment evidence", `PL-DEPLOY-EXPORT`). The frozen contract (`docs/contracts/evidence-snapshot-v1.md` §Secondary Greeks / §IV, additive under INV-PUB-05) now carries nullable `delta`, `gamma`, `theta`, `vega`, `rho`, `midIv`, `smvVol`, `greeksUpdatedAt`. Semantics reacquired and carried into the design as hard guardrails:

- provider **null ≠ 0**; a genuine `0` is data; only an *exact all-five-zero* vector may be treated as an unavailable placeholder (whole-vector only);
- greeks carry **no independent provenance** — their age equals the chain's acquisition age;
- `midIv` (Tradier midpoint-inverted) and `smvVol` (ORATS surface) are **distinct**, never aliased/averaged/collapsed into a generic `iv`; IV is never computed locally (no solver);
- `greeksUpdatedAt` is verbatim provider-local, zone-unspecified, distinct from chain `retrievedAt`; no ISO parse, no freshness claim beyond the raw value.

Greeks/IV **enrich** the consequence model; they never decide the action. Delta is not assignment probability; high gamma/vega is not a CLOSE trigger; theta is not guaranteed daily income; no volatility-trajectory inference without authoritative historical evidence.

### Durable architecture conclusions

1. Domain subject = a `MonitoredPosition` (ADR-013) that is an existing single-leg short obligation; supplied alternatives = `{HOLD, CLOSE}` as governed state transitions. No generalized lifecycle-episode entity, no `CapitalState` machine (consistent with ADR-016 non-decisions).
2. The V1 emits independent facts (deterministic / estimated / unavailable) — never a scalar HOLD/CLOSE score, never a recommended winner.
3. Encumbrance semantics: prefer **"nominal encumbrance removed"**; do not equate it to broker-authoritative deployable buying power (that remains account/balance evidence). For a covered call, closing releases shares from the call obligation — it does not create cash.
4. Assignment is not inherently undesirable: separate assignment *consequence* and *resolution outlook* (ADR-013 + amendment) from assignment *desirability/acceptability* (Situation/operator intent). Unknown assignment intent must **prevent** any "high assignment exposure ⇒ CLOSE" conclusion.
5. Evidence fitness inherited from ADR-015/016/017: consume backend session/admissibility authority, fail closed when pending/inadmissible, carry provenance/age, surface mismatched acquisition times, never present aged evidence as timeless. No executable BTC price exists pre-execution — midpoint close cost is explicitly indicative, never a fill/guaranteed debit.
6. CLOSE ≠ ROLL. ROLL (retire old + assume new) is out of V1 except as a future neighboring alternative; per `PL-EXEC-01` the old-leg close economics must never be hidden inside a net roll credit.

### Rejected alternatives / non-goals (preserved so they are not rediscovered)

New BTC-specific `PL-*`/architecture; scalar HOLD/CLOSE score; automatic HOLD or CLOSE recommendation; generalized BTC engine; take-profit policy implementation; ROLL/replacement-leg evaluation; multi-leg/spread/one-leg close; assignment-desirability inference; assignment-probability invention; automatic redeployment; equating nominal encumbrance with buying power; capital-path optimizer; generalized lifecycle-episode/CapitalState machinery; local option-pricing/IV solver; new provider calls; policy thresholds hidden in plumbing; mutation of Deployment recommendation semantics; direct broker execution.

### Two adjacent current-state correctness findings (verified, classified, NOT repaired here)

Investigation re-verified both against live code at SYNC `7b4a084`:

- **Finding A — BTC mis-classified in Production accounting (genuine, previously untracked as a specific defect).** `TransactionClassifier` has no `"YOU BOUGHT CLOSING TRANSACTION"` branch, so a buy-to-close falls through to `ASSET_PURCHASE` and `EconomicDecomposer` books it as `CAPITAL_DEPLOYMENT` — never netted against the recognized opening premium. The action string is already recognized in the frontend importers but absent from the backend classifier; no dedicated enum kind and no Java test. Filed as **BUG-021** (record only; remediation not authorized). Sits inside the `PL-EXEC-01` / `PL-PORT-02` deferred-maturity envelope but is a distinct latent defect.
- **Finding B — live overlay does not resolve BTC/expired (genuine; assigned subset already tracked).** `projectActivityOverlay` (the live path) handles only `shares_bought_direct` / `sell_to_open` / `shares_sold_direct` / default; `buy_to_close`, `expired`, `assigned`, `shares_sold_assignment` fall through without reducing positions → ghost short positions persist. `enrichOpenedDates` reads those events but is explicitly provenance-only. The **assigned** subset is already **BUG-001** (Open). The voluntary-**BTC** and **expiration** cases are the same class in the same switch but are not named by any BUG; the passing `projectState` scenario-replay tests exercise a *different* path and mask the live gap. Recorded as a scope observation cross-linked to BUG-001; I did **not** unilaterally widen BUG-001's ratified scope. Principal decision needed: widen BUG-001 or open a sibling BUG.

These findings are **inputs/constraints** to the HOLD-vs-CLOSE design (they explain why historical/forward accounting must be treated carefully and why live overlay state cannot be assumed authoritative for a just-closed position), but they are **not** bundled into it and are **not** repaired by this task.

### Epistemic status

The V1 **design exists and is internally coherent**; it is **not** implementation authority. Per the task's own gate and `PL-EXEC-01`/idea-intake discipline, design completeness does not authorize code. Next canonical step is a design-gate review (3AM; optional 4AM adversarial), then explicit Principal implementation authorization. The concurrent `PL-RECIPE-01` page-`-3`/`parking-lot-8` working tree was not touched.
