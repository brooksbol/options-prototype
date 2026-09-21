# Lifecycle Forward-Transition Comparison (HOLD vs BTC) — V1 — Bounded Design

**Status:** Design decomposition — exploration/design artifact. **NOT implemented, NOT authorized for implementation.** Design completeness does not confer implementation authority (§16). Produced under an explicit Principal Option-B design authorization (2026-09-21); that authorization is design authority only.
**Authority:** Supporting design artifact (Category E — Current Specialized Reference). Non-governing outside its bounded subject. Canonical strategy is `docs/roadmap.md`; the direct architectural precedent is `docs/design/existing-short-obligation-hold-vs-close-v1-design.md` (the "HOLD/CLOSE V1" consequence design). Accepted why-state for the motivating specimen: `docs/journal/project-journal-5.md` (2026-09-21 TSLL entry).
**Produced:** 2026-09-21, Kiro as invoked repository-resident actor, under Principal Option-B authorization.
**SYNC SHA:** `848daf055197615f2a2fd6d3ea9e0333c6a6300c` (remotely verified accepted `main` at commit time; authored against `37dd918` and reconciled onto `848daf0` — the intervening commit `848daf0` is a Deployment Show-filter UI change, immaterial to this design's authority, references, and assumptions).
**LVT homes (no new identity created):**
- Governed BTC/take-profit lifecycle policy: `LVT-BET-LIFECYCLE-POLICY` → `LVT-INIT-POLICY-TAKE-PROFIT`; empirical mechanics `LVT-EXP-BTC-MECHANICS`.
- Alternatives that {HOLD, BTC} are the applicable transitions: `LVT-BET-LIFECYCLE-CHOICES` → `LVT-INIT-LIFE-COMPARE`, `LVT-INIT-LIFE-TRANSITIONS`.
- Independent consequence facts consumed here: `LVT-BET-CONSEQUENCE-ENVELOPE` → `LVT-INIT-CONSEQUENCE-RELEASE-COST` (produced by the HOLD/CLOSE V1 design).
- Capital-state coupling / feasible-set / opportunity cost: `LVT-BET-CAPITAL-CHOICES` → `LVT-INIT-CAP-AVAILABILITY`, `LVT-INIT-CAP-ALTERNATIVES` (roadmap priority #2).
- Comparative judgment / acceptability: `LVT-BET-EXPLANATION`, `LVT-BET-ACCEPTABILITY`.
- Execution/lifecycle-transition semantics + CLOSE-vs-ROLL separation: `PL-EXEC-01`. Behavioral discipline (sunk-cost/reference-point): `PL-DEC-BEH`.
**Governing domain authority:** `foundations/options-domain-reference.md` D5 (Delta is local sensitivity, not probability), D1 (delta is not allocation probability); `foundations/options-domain-competence-contract.md`; `foundations/policy-over-prediction.md`; `foundations/epistemic-precision.md`; ADR-013/014/015/016/017; the Fidelity balance-regime authority `docs/56-fidelity-account-regime-balance-semantics-2026-09-19.md` (BUG-022 deployable-cash derivation).
**Review path:** returns to the Principal. A four-actor (add Codex) adversarial pass may follow only if the Principal authorizes escalation. This document does not request one and does not authorize code.

---

## 0. What this design is and is not

**Is:** the smallest coherent generalized architecture for evaluating **HOLD vs BTC as competing forward transitions** for an already-held single-leg short option obligation, using legitimate forward economics and capital consequences, so a governed lifecycle disposition can be reached without (a) treating Delta as probability, (b) confusing nominal encumbrance with deployable capital, or (c) introducing sunk-cost reasoning.

**Is not:** an implementation; a threshold-tuning exercise; a premium-captured take-profit rule; a redefinition of the historical/forward wall; a symbol-specific rule; a new provider integration; a capital-path optimizer; or a mutation of `LVT-BET-CAPITAL-CHOICES`'s ownership of feasible-set reasoning.

This design **extends** the HOLD/CLOSE V1 consequence design (which produces per-alternative facts but deliberately renders **no verdict**) with the **verdict/judgment layer** that a governed lifecycle disposition requires — the layer that the shipped `decideShortObligationLifecycle` currently occupies in a narrow DTE+moneyness form.

---

## 1. The problem this design addresses (established, from the TSLL reconciliation)

The shipped governed lifecycle DECIDE layer (`short-obligation-decision.ts`, unchanged since commit `eae8305`, reverified at `37dd918`) reaches BTC only via:

```
nearDte (dte ≤ 5) AND m < 0 AND |m| ≥ negligibleRiskOtmMagnitude (0.15)
```

It consumes only `{ side, dte, moneyness, candidate, closePriceSupported }`. It is a **static, volatility-blind risk classification**. Everything below is available in the evidence path (some already in the sibling EVALUATE layer, `short-obligation-consequences.ts`; deployable cash in `PortfolioSnapshot`) yet excluded from the decision:

- current close/BTC debit (EVALUATE has it; DECIDE sees only a boolean),
- residual option value / residual reward,
- residual directional sensitivity (Delta) — present as display-only enrichment, explicitly excluded from DECIDE,
- nominal encumbrance,
- authoritative regime-aware **deployable cash** (`PortfolioSnapshot.deployableCash`, consumed by the deployment engines, **not** by lifecycle DECIDE).

**Motivating specimen (TSLL, see journal 2026-09-21 and §12 here):** a near-DTE short put ~12.7% OTM with displayed Delta <0.01 received governed **HOLD** because 12.7% < 15%, while the actual economics — ~$5 to retire a $900-encumbering obligation with almost all opening premium already decayed out — were never in the decision. The specimen is **evidence that the model is structurally under-expressed**, not a target the policy should be fitted to reproduce.

---

## 2. The four legitimate forward inputs (and one forbidden framing)

The design distinguishes four **forward-legitimate** economic/risk dimensions and one **forbidden** historical framing.

### Forward-legitimate (may inform a forward verdict)

1. **Residual obligation risk / sensitivity** — how much the short obligation can still move against the operator from here. Inputs: moneyness (spatial), remaining DTE (temporal), and — as *corroborating* evidence only — trustworthy Delta and near-expiry gamma context (§6). This is what the current 15% rule tries, crudely, to express.
2. **Residual reward** — how much economic reward remains available by *continuing* to carry the obligation. Inputs: current residual option value / current BTC debit (forward, from the current market), residual-reward-per-remaining-day. **Not** opening premium (that is historical — §5).
3. **Cost to retire (BTC economics)** — current close debit, quote/evidence quality, obligation-retirement consequence. Forward and admissible.
4. **Capital consequence** — nominal encumbrance that would be removed, and — where and only where authoritative — the deployable-capital change and its opportunity cost. This is the newly sharpened dimension and is **owned by `LVT-BET-CAPITAL-CHOICES`**, not by lifecycle policy (§7).

### Forbidden framing (must remain excluded unless separately authorized)

5. **Premium-captured-% take-profit against opening premium.** "We already captured 85.77%, therefore close" is sunk-cost/reference-point reasoning. It crosses the HOLD/CLOSE V1 historical/forward wall (§8 of that design; `PL-DEC-BEH`; ADR-014). It is a *deliberate take-profit policy* that lives at `LVT-INIT-POLICY-TAKE-PROFIT` and requires its own Principal authority. **This design does not introduce it** and forbids smuggling opening premium into the forward verdict (§5).

Note the sharp line inside "reward": residual **absolute** option value / BTC debit is *forward* (what remains from here); premium-captured **percentage** against the opening credit is *historical* (what already happened). The former is admissible; the latter is not, absent separate authority.

---

## 3. Selected architectural seam

Four candidate seams were considered (as posed in the authorization):

1. an enriched lifecycle DECIDE layer (feed richer inputs into today's single function);
2. HOLD and BTC as forward **consequence vectors** followed by a **separate governed judgment layer**;
3. lifecycle consequences exposed to `LVT-BET-CAPITAL-CHOICES`, opportunity cost determined there;
4. some smaller composition.

**Selected: a bounded composition of (2) + (3), realized incrementally on top of the existing HOLD/CLOSE V1 seam.**

Rationale (smallest coherent, not most comprehensive):

- The HOLD/CLOSE V1 design **already** produces per-alternative independent consequence facts and **already** anticipates this exact extension in its §18 ("Future extensibility": each transition is "another supplied alternative … with judgment by `LVT-BET-EXPLANATION`/`LVT-BET-ACCEPTABILITY`"). Choosing seam (2) reuses a ratified seam rather than inventing one.
- A pure "enriched DECIDE" (seam 1) would repeat the shipped failure mode: it collapses consequence, judgment, and attention into one function and tempts an opaque multi-factor score. The Sep-16 BTS closeout journal records exactly this collapse as the defect that had to be undone. Rejected as the primary structure.
- **Capital/opportunity cost must not live inside lifecycle DECIDE.** Feasible-set and capital-state coupling are already owned by `LVT-BET-CAPITAL-CHOICES` (COPX→SOXX precedent). Lifecycle emits a capital *consequence* fact; the *opportunity-cost judgment* is made where the feasible set is known (seam 3). This preserves the ownership boundary and avoids a cross-domain coupling invented merely because it is economically attractive.

### The layered shape (extends the existing five-layer model)

```
NOTICE (candidate)                     — unchanged (btc-review-candidate.ts)
  → EVALUATE (per-alternative facts)   — HOLD/CLOSE V1 consequence vectors (extended, §4)
    → JUDGE (governed disposition)     — NEW/generalized: forward-transition comparison → HOLD | BTC | DEFER | RECONCILE | NO-ACTION
      → ATTENTION (actionRequiresOperator) — unchanged (red = ACT, not "evaluated")
        → EXPLAIN (answer-first)        — unchanged shape; richer reason set
```

JUDGE is the generalization of today's `decideShortObligationLifecycle`. It consumes the **consequence vectors** (not raw snapshot fields), applies governed policy, and emits one disposition plus a smallest-useful reason set. It does **not** compute the consequence facts itself and does **not** own capital opportunity cost.

---

## 4. Forward-transition consequence vectors (what JUDGE consumes)

Each alternative is represented as an independent, precision-tagged consequence vector (extending HOLD/CLOSE V1 §7 facts). Every field carries `known | approximate | unavailable` precision and provenance/age (HOLD/CLOSE V1 §10). JUDGE consumes vectors; it never reads raw provider fields.

### HOLD vector (continue the obligation)
- **remaining DTE** (exposure duration; not guaranteed lockup; early assignment possible — HOLD/CLOSE V1 §5).
- **moneyness** (signed, from a supported underlying observation).
- **residual reward** = current residual option value (indicative midpoint × 100 × contracts), forward.
- **residual-reward-per-day** = residual reward / remaining DTE (derived; degradable).
- **residual sensitivity** = trustworthy Delta (corroborating, §6) + near-expiry gamma context; degradable/absent-safe.
- **continued nominal encumbrance** (the obligation-specific nominal encumbrance that *remains*).
- **resolution branches** (assignment/expiration consequences; never a probability).

### BTC vector (retire the obligation now)
- **current close debit** (indicative midpoint; C1 quote geometry preserved — HOLD/CLOSE V1 §11; never a fill price).
- **quote/evidence quality** (usable/weak/unavailable; wide-spread and indistinct-zero surfaced).
- **obligation retirement** (exposure removed).
- **nominal encumbrance removed** (CSP: strike×100×contracts; CC: shares no longer encumbered — never a cash claim; HOLD/CLOSE V1 §13).
- **capital consequence handle** (§7): a *reference* to authoritative deployable-cash evidence + a bounded statement, **not** a synthesized released-cash figure.

### JUDGE's governed comparison (conceptual, deterministic)

The governed disposition expresses a single economic intent:

> **Continue carrying the obligation only when the residual reward still available justifies the residual obligation risk and the continued capital consequence; otherwise the operator may retire it now.**

Concretely, JUDGE reaches **BTC-eligible** when *both*:
- **residual obligation risk is governed low** (the risk arm — today's DTE+moneyness condition, optionally corroborated by trustworthy Delta per §6), **and**
- **residual reward is governed small relative to the cost/consequence of continuing** (the reward/cost arm — residual reward vs BTC debit vs continued encumbrance).

and **HOLD** otherwise. Capital *opportunity cost* is an **input from `LVT-BET-CAPITAL-CHOICES`**, not computed in JUDGE (§7): when a qualified alternative exists, it can *strengthen* BTC-eligibility; its absence must never *force* BTC.

This is a governed decision rule, not a score. It must be expressible as an auditable set of named conditions with their supporting evidence (the existing `GovernedReason { text, evidence }` shape generalizes cleanly). **No opaque weighted scalar** (epistemic-precision; explainability).

Whether the risk arm and reward arm are **conjunctive** (both required) or admit an **alternate route** (very-low-residual-reward alone, well inside the wall) is an open calibration question routed to `LVT-EXP-BTC-MECHANICS` (§13), not decided here.

---

## 5. Historical vs forward boundary (preserved; one flagged tension)

**Preserved unchanged:** the HOLD/CLOSE V1 §8 wall. Opening premium, premium-captured %, mark-to-market, and "getting back to even" are **historical context (X1–X4)** and must never masquerade as forward value or enter the JUDGE verdict. `PL-DEC-BEH` and ADR-014 continue to govern.

**Flagged tension (requires separate Principal authority if pursued):** a *take-profit* policy keyed to opening premium (Shape 3 in the reconciliation) is economically intuitive but **crosses this wall**. This design **explicitly declines** to introduce it and records that any such rule is `LVT-INIT-POLICY-TAKE-PROFIT` scope requiring its own authorization. The design's "residual reward" input (§2.2, §4) uses **forward** residual value, not the historical captured fraction — this is the deliberate, wall-preserving choice.

No change to the historical/forward boundary is proposed by this design.

---

## 6. Delta role (domain-authority-bound)

Governing authority (`options-domain-reference.md` D5/D1): **Delta is local directional sensitivity, not assignment probability.** The superseded BR-5/A-3 delta≈probability shorthand must not be revived (see §11).

**Selected role: corroborating residual-sensitivity evidence only.** Delta may *support* the risk arm's "residual obligation risk is low" conclusion; it may not be relabeled as probability, and it may not be a standalone `Delta < X → BTC` trigger (that merely swaps one magic number for another and was explicitly forbidden by the authorization).

Admissibility requirements when Delta participates:
- **Freshness:** Greek age *equals chain age* (HOLD/CLOSE V1 §12; no independent provenance); a stale chain makes Delta inadmissible for the decision.
- **Zero-placeholder handling:** `null ≠ 0`; only the exact **all-five-zero** greek vector is an unavailable placeholder (whole-vector rule). A displayed `<0.01` is a *rounding presentation*, not evidence of exact zero — JUDGE must consume the underlying value's precision, not the rounded label.
- **Missing evidence:** per-greek independence; a missing Delta makes the *corroboration* unavailable, never fabricated. The risk arm must remain able to reach a conclusion from DTE+moneyness alone (graceful degradation).
- **Gamma / near-expiry limitation:** low Delta with non-trivial gamma near expiry is explicitly *not* "safe"; near-expiry Delta can be unstable. Gamma context must be carried so a low Delta cannot override contradictory evidence.
- **Chain admissibility / session:** Delta is chain-quote-dependent → unavailable when inadmissible; fail-closed.
- **Fail-closed:** if Delta is stale/placeholder/missing/inadmissible, the decision proceeds on the non-Delta arm; Delta never *forces* a disposition on thin evidence.

Delta is therefore, at most, evidence that *strengthens* an already-supportable low-risk conclusion. It is never the sole basis, never a probability, and never load-bearing alone.

---

## 7. Lifecycle ↔ `LVT-BET-CAPITAL-CHOICES` boundary (the sharpened seam)

**Established fact:** `PortfolioSnapshot.deployableCash` exists as authoritative, regime-aware unlevered deployable cash (`deriveDeployableCash`, BUG-022): CASH regime → "Available to trade (all settled)"; MARGIN regime → "Available without margin impact" (AWMI); INDETERMINATE → `null`/fail-closed (`docs/56-…`). It is consumed by the deployment engines (`recommendPuts`, `recommendBuyWrites`, `brief-builder`) and **excluded from lifecycle DECIDE**.

**The `$900` nominal / `$849` observed deployable specimen proves the load-bearing distinction:** nominal encumbrance removed ≠ deployable capital created. Doc `56` invariant 3 forbids treating buying power / borrowing capacity as owned liquidity, and invariant 5 forbids inferring unlevered capacity from settled cash on a margin account.

### What can be known BEFORE BTC vs only AFTER

| Fact | Knowable before BTC? |
|---|---|
| Nominal encumbrance that would be removed (strike×100×contracts for CSP) | **Yes** — deterministic from the obligation |
| Current authoritative `deployableCash` (regime-aware) | **Yes, when a Balances CSV is loaded**; else `null`/fail-closed |
| The *exact* post-action deployable figure ($849) | **No** — this is post-action; the $900→$849 gap is precisely what doc `56` forbids synthesizing |
| Whether ~$50 was "absorbed by margin deficit" | **No** — Principal interpretation; not provenance-established (§12) |

**Truthful pre-BTC statement Wheelwright can make:** "Closing removes **$900 nominal encumbrance**; current authoritative unlevered deployable capital is `deployableCash` (regime-aware) or unknown/fail-closed; the resulting change to deployable capacity is not exactly pre-computable and will be established by authoritative post-action balance evidence." It must **not** state "closing frees $900 of deployable cash."

### Three distinctions the design must keep separate (per authorization)
1. **Restored capital flexibility** — qualitative: the obligation no longer ties up nominal collateral. Always truthfully statable.
2. **Actual opportunity cost** — only real against an *actual alternative use* of the capital.
3. **A known qualified alternative deployment opportunity** — an admissible Deployment candidate the encumbered capital currently blocks (the COPX→SOXX shape).

**Ownership rule:** lifecycle JUDGE emits the *capital consequence fact* (nominal removed; deployable-evidence handle). The *opportunity-cost judgment* — does that released capacity matter, and is there a qualified alternative — is made by `LVT-BET-CAPITAL-CHOICES` where the feasible set is known. Opportunity value is **never assigned merely because capital could become available** (authorization constraint). Absence of a qualified alternative must never force BTC.

**Post-action balance changes** ($900→$849) are legitimate **empirical calibration/learning** evidence (they were observed *after* the action) — useful to `LVT-EXP-BTC-MECHANICS` and capital-choice learning, never inputs that were known before the action.

---

## 8. Evidence-admissibility rules (fail-closed, inherited + extended)

Inherited from ADR-015/016/017 and HOLD/CLOSE V1 §14/§14a; extended for the capital dimension:

- **Consume backend-owned session/admissibility authority**; never reconstruct competing authority (ADR-017).
- **Subject-level fail-closed:** lifecycle ambiguity (§14a exact-contract conflict) → RECONCILE; authority pending → refuse. No verdict fabricated on a possibly-ghost obligation.
- **Chain inadmissibility/closure is NOT a subject-level blocker** (BTS-CLOSURE-INDEPENDENCE): it degrades chain-quote-dependent facts (close debit, Delta, quote geometry) to `unavailable`; the risk arm may still reach a disposition from DTE+moneyness.
- **Capital fail-closed:** when `deployableCash` is `null` (INDETERMINATE regime or Balances not loaded), the capital consequence is stated as **nominal-only** with deployable unknown; opportunity cost is not asserted.
- **Provenance/age carried; aged evidence never presented as timeless.**
- **Determinism:** same vectors + same policy → same disposition (ADR-001; policy-over-prediction).

---

## 9. Required design properties (all preserved)

Deterministic; explainable (named conditions + supporting evidence, no opaque score); auditable; provenance-aware; evidence-admissibility-aware; fail-closed; degrades gracefully when Greeks/quotes/capital evidence are absent. CSP and covered-call semantics remain distinct (the `m<0` economic-protection guard: an ITM short call being called away is an *intended* outcome and must never receive a put-style BTC — journal Sep-16 economic-protection specimen).

---

## 10. Failure-mode pressure test

Each row states the required behavior (truthful fact / explicit degradation / refusal / fail-closed).

| Case | Required behavior |
|---|---|
| Stale/missing Greeks | Delta corroboration unavailable; risk arm proceeds on DTE+moneyness; never fabricated. |
| Zero-placeholder Greeks (all-five-zero) | Treated as unavailable (whole-vector); a single 0 is data; displayed `<0.01` ≠ exact 0. |
| Stale/wide/illiquid quotes | BTC debit weak/`unavailable` with quote geometry; residual reward degrades; no confident dollar figure. |
| High gamma near expiry | Low Delta not treated as "safe"; gamma context carried; Delta cannot override contradictory evidence. |
| Event / overnight discontinuity | Not predicted; residual-risk arm never claims safety a static snapshot can't support; HOLD is a valid fail-safe. |
| Expensive BTC despite low sensitivity | Reward/cost arm blocks BTC-eligibility even when risk arm is satisfied (both arms required). |
| Fees / slippage | Surfaced as execution uncertainty; BTC debit is indicative, never a fill. |
| Margin-account interactions | Regime-aware deployable via doc `56`; MARGIN→AWMI; no synthetic cash. |
| Nominal ≠ deployable disagreement | Nominal-only statement; deployable from authoritative evidence or unknown; never equated. |
| No qualified alternative deployment | Opportunity cost not asserted; capital release stated as flexibility only; must not force BTC. |
| Highly attractive qualified alternative | Opportunity cost enters via `LVT-BET-CAPITAL-CHOICES`; may strengthen BTC-eligibility; still requires the risk+reward arms. |
| Multiple contracts | Facts scale by contract count; block evaluated as one obligation (no partial close in V1). |
| Partial fills | Execution-time concern; pre-execution the design states indicative facts only. |
| CSP vs covered call | Distinct semantics; `m<0` guard preserved; CC assignment/call-away is intended. |
| Early assignment | Acknowledged as possible (American-style); never predicted; HOLD never asserts survival to expiration. |
| Unavailable authoritative account/balance evidence | Capital dimension fails closed to nominal-only; disposition still reachable on non-capital arms. |

---

## 11. Related findings — kept explicitly separate (NOT authorized for code change here)

- **Inaccurate `"near strike"` HOLD wording** (`short-obligation-decision.ts`): any `0 > m > −0.15` prints "near strike," mislabeling e.g. 12.7% OTM. This is a **presentation/semantic defect**, repairable independently of this design. Reverified present at `37dd918`. Relationship to this design: the JUDGE reason set should use accurate moneyness vocabulary, but **this artifact does not authorize the code fix**. Candidate BUG; Principal disposition required.
- **`assignmentProbability(delta) = |delta|` / BR-5 drift** (`src/domain/calculations.ts`): survives with a live "BR-5" label that `options-domain-reference.md` marks **superseded**; dead outside its own test; reverified present at `37dd918`. Classification: **documentation/implementation drift**, and precisely the Delta-as-probability trap §6 forbids. Relationship: this design must not depend on or resemble it. **Removal not authorized here.**

Neither is silently bundled into this design's scope.

---

## 12. TSLL empirical specimen (evidence to pressure-test against — NOT a target)

Preserved as evidence, with strict epistemic labeling. **The design must not be fitted to reproduce a BTC verdict for TSLL.** TSLL is a *falsification specimen* exposing whether a general weakness exists; no TSLL-specific number is a policy constant.

| Fact | Value | Epistemic status |
|---|---|---|
| Contract | `-TSLL260925P9`, 1 contract, $9 strike, exp 2026-09-25 | Production evidence |
| Opening premium | +$35.34 (2026-09-15, included) | Production evidence |
| Nominal encumbrance established | $900.00 | Production evidence |
| Pre-close contract state | ~5 DTE, spot ≈$10.14, ~12.7% OTM, displayed Delta <0.01, gamma ≈0.039, bid/ask ≈$0.05/$0.06 | Principal-observed Product/runtime evidence (not repo-verifiable) |
| Governed pre-close result | **HOLD** ("near strike — … no governed close condition met") | Repository fact (policy output) |
| Actual BTC | 2026-09-21, `YOU BOUGHT CLOSING TRANSACTION … −$5.01`, deterministic, included | Production evidence |
| Obligation retired; $900 nominal encumbrance removed | — | Production evidence |
| Retained premium | $30.33 | Derived arithmetic ($35.34 − $5.01) |
| Retained fraction | ≈85.77% | Derived arithmetic |
| Close debit as fraction of premium | ≈14.18% | Derived arithmetic |
| Post-update Product state | Deployable $849 | Principal-observed Product/runtime evidence |
| ~$50 absorbed by margin deficit | — | Principal interpretation (NOT provenance-established; do not upgrade to fact) |
| Close-debit / observed-deployable | ≈0.59% | Derived arithmetic (conceptual only; NOT a threshold) |

**What HOLD ignored (the finding):** residual reward (~$5 remaining), current BTC debit (~$5.01), nominal encumbrance ($900), residual sensitivity (Delta corroboration), and the capital consequence (deployable-capital effect). All were available or derivable; none reached the DTE+moneyness verdict. TSLL passes the risk arm (near-DTE, low residual sensitivity) but the *reward/cost + capital* arms — the ones this design adds — are what the current model cannot express.

---

## 13. Experiments / evidence required before implementation

This design does **not** invent thresholds. The following must be established (routed to existing homes) before any implementation:

1. **Risk-arm generalization** (`LVT-BET-LIFECYCLE-POLICY` / `LVT-INIT-POLICY-TAKE-PROFIT`): whether the residual-risk arm should remain fixed-moneyness, become volatility-aware, or be corroborated by Delta — and whether the arms are conjunctive or admit an alternate route. Empirical: `LVT-EXP-BTC-MECHANICS`.
2. **Residual-reward calibration** (`LVT-EXP-BTC-MECHANICS`): what "residual reward small relative to cost of continuing" means operationally (absolute value, reward-per-day, reward-vs-obligation) — replayed against lifecycle specimens (TSLL specimen #1), never fitted to it.
3. **Capital opportunity-cost integration** (`LVT-BET-CAPITAL-CHOICES` → `LVT-INIT-CAP-AVAILABILITY`, `LVT-INIT-CAP-ALTERNATIVES`): the seam by which a known qualified alternative strengthens BTC-eligibility; what bounded pre-action statement is truthful; how post-action balance evidence calibrates.
4. **15% threshold provenance disposition:** confirm it is provisional (established) and decide whether it survives, is recalibrated, or is subsumed by a volatility-aware risk arm — via experiment, not ad-hoc tuning.
5. **Delta admissibility harness:** freshness=chain-age, whole-vector-zero, per-greek independence, near-expiry gamma, fail-closed — validated before Delta participates.

---

## 14. Smallest coherent implementation boundary (for a future, separately authorized pass)

**V1 (when authorized) = generalize the existing `decideShortObligationLifecycle` (JUDGE) to consume HOLD and BTC forward-consequence vectors (extending the HOLD/CLOSE V1 evaluator) and apply a governed two-arm disposition (residual-risk arm + residual-reward/cost arm), with the capital *consequence fact* emitted for `LVT-BET-CAPITAL-CHOICES` to weigh opportunity cost — deterministic, explainable via named reasons, fail-closed, no opaque score, no opening-premium take-profit, Delta corroborating-only, nominal ≠ deployable, on the existing Operator Console position-detail surface, no new page, no provider calls, no backend schema change.**

- Reuses the ratified NOTICE→EVALUATE→ATTENTION→EXPLAIN layers; changes only JUDGE's inputs and rule.
- Capital opportunity cost is a *consumed input from* `LVT-BET-CAPITAL-CHOICES`, not new lifecycle machinery.
- Related findings (§11) remain separately governed.

---

## 15. Unresolved questions

1. Conjunctive vs alternate-route arms (§4, §13.1).
2. The operational definition of "residual reward small relative to cost of continuing" (§13.2).
3. Whether opportunity cost is a lifecycle *input* only, or whether lifecycle and capital-choice integrate into a single feasible-set comparison at maturity (Shape 9 endpoint) — deferred; V1 keeps them separated.
4. Whether the 15% risk-arm threshold survives volatility-aware generalization (§13.4).
5. Recoverability of provenance-bound evidence for the TSLL $900→$849 transition (§7, §12).

---

## 16. Implementation-authorization gate

Implementation is **UNAUTHORIZED**. This is a bounded design artifact produced under Principal Option-B design authority. It becomes eligible for implementation only after: (a) Principal acceptance of this design; (b) the §13 calibration questions being resolved or explicitly deferred with a bounded first increment; (c) explicit Principal implementation authorization. Design completeness does not authorize code (`PL-EXEC-01` / idea-intake-reconciliation discipline). No production code is changed by this artifact.

---

## Provenance

- Direct architectural precedent: `docs/design/existing-short-obligation-hold-vs-close-v1-design.md` (§18 anticipates this extension).
- Motivating specimen why-state: `docs/journal/project-journal-5.md` (2026-09-21 TSLL entry).
- Capital evidence authority: `docs/56-fidelity-account-regime-balance-semantics-2026-09-19.md` (BUG-022 deployable-cash derivation).
- Domain authority: `foundations/options-domain-reference.md` D1/D5; `foundations/options-domain-competence-contract.md`.
- Governing decisions: ADR-013/014/015/016/017; `foundations/policy-over-prediction.md`; `foundations/epistemic-precision.md`.
- Canonical strategy: `docs/roadmap.md` (`LVT-BET-LIFECYCLE-POLICY`, `LVT-INIT-POLICY-TAKE-PROFIT`, `LVT-EXP-BTC-MECHANICS`, `LVT-BET-CAPITAL-CHOICES`, `LVT-INIT-CAP-AVAILABILITY`, `LVT-INIT-CAP-ALTERNATIVES`, `LVT-BET-LIFECYCLE-CHOICES`, `LVT-BET-CONSEQUENCE-ENVELOPE`); `docs/roadmap-priority.md` (#2 capital-choices).
- Related findings: "near strike" wording (`short-obligation-decision.ts`); `assignmentProbability`/BR-5 drift (`src/domain/calculations.ts`).

---

## Revision log

**2026-09-21 — Created** under Principal Option-B design authorization, authored against `37dd918`, committed onto reconciled accepted `main` `848daf0`. Design authority only; no code changed; no new `PL-*`/LVT/ADR identity created (existing lifecycle-policy, take-profit, BTC-mechanics, and capital-choice identities own the homes). Extends the HOLD/CLOSE V1 consequence design with the forward-transition JUDGE layer; preserves the historical/forward wall; binds Delta to corroborating-only per domain authority; keeps opportunity cost owned by `LVT-BET-CAPITAL-CHOICES`; preserves the TSLL specimen as pressure-test evidence, not a target.
