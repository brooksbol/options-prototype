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


---

## 2026-09-16 — HOLD vs CLOSE V1 design gate: ACCEPT WITH REQUIRED AMENDMENTS (applied)

**Actor:** Kiro, invoked to apply a bounded documentation/design correction pass.
**SYNC SHA:** `8125cc802f523dedc4eb4d9b0a644e3c1e8f1298` (accepted `main`; advanced from `05ada58` via the `PL-RECIPE-01` reconciliation `8125cc8`, verified immaterial to this design — it touched only the recipe design/journal-3/parking-lot-8).
**Mode:** Design correction. **Not** implementation authorization.
**Artifact amended:** `docs/design/existing-short-obligation-hold-vs-close-v1-design.md` (Revision log records the 10 corrections).

### Gate outcome (preserved why-state)

ChatGPT (with the Principal) returned **ACCEPT WITH REQUIRED AMENDMENTS** on the HOLD-vs-CLOSE V1 design. The core architecture was accepted without reversal: the ownership seam (`LVT-BET-LIFECYCLE-CHOICES` alternatives / `LVT-BET-CONSEQUENCE-ENVELOPE` consequences / `LVT-BET-EXPLANATION`+`LVT-BET-ACCEPTABILITY` judgment / `PL-EXEC-01` transitions), the HOLD/CLOSE state-transition model, the historical-vs-forward separation, the no-verdict V1, the CLOSE≠ROLL wall, and reuse of existing durable identities. No new discovery cycle, no new `PL-*`/LVT/ADR. The corrections are substantive **trustability** fixes, not architectural changes, and they make the design *smaller* (fewer implicit claims, fewer hard dependencies, a safer boundary around current lifecycle-state defects).

### The load-bearing correction (why it matters)

The most important amendment is the **§14a lifecycle-ambiguity fail-closed guard**. The live `projectActivityOverlay` can retain a ghost obligation after BTC/expiration/assignment (Finding B / BUG-001 sibling). Rather than depend on BUG-001 remediation first, V1 now **refuses** (classifies `lifecycle state ambiguous`) when authoritative post-checkpoint Activity contains an exact-contract resolution event conflicting with the projected open obligation — associating only on exact contract, never by inference (ADR-016 preserved), and never repairing overlay state inside the evaluator. This is what makes the accepted sequencing safe: **BUG-001 need not precede V1 only because this guard exists**; without it, V1 would be blocked. This is the cleanest expression of the capability's purpose — it must not confidently offer HOLD/CLOSE on a position that may no longer exist.

### Other durable conclusions from the gate

- CSP CLOSE must never say "collateral freed to cash"; nominal-encumbrance removal is not a cash/buying-power claim (unknown until broker/account evidence). Covered-call CLOSE frees shares from the call, not cash.
- Greeks/IV are **optional enrichment**, not hard dependencies; the forward comparison must function with them entirely absent.
- "Historical P/L" was smuggling an estimated close into accounting truth; renamed to an explicit gross mark-to-market estimate vs attributable opening credit (X2), with X3's gross/net basis made explicit.
- The close estimate (C1) must always carry its quote geometry (bid/ask/spread + provenance) and degrade to weak/`unavailable` on a structurally weak market — no precise-looking false confidence, no invented execution-quality threshold.
- HOLD must not imply survival to expiration (American-style early assignment); expiration is the *scheduled* boundary only. No early-assignment probability invented.
- Assignment intent stays externally authoritative; the evaluator never infers desirability from moneyness/delta/basis/P/L.
- Taxes explicitly declared a non-goal (evidence does not support reliable tax-specific lifecycle claims).

### Settled design questions

Host = **Operator Console position-detail** (subject is a held obligation; ADR-013 already owns Economic Consequence there; keeps prospective Deployment and existing-obligation management distinct; no new page). Host may supply the fixed `{HOLD, CLOSE}` pair while the evaluator remains one-alternative-at-a-time (enumeration stays `LVT-INIT-LIFE-COMPARE`). **Resolution Outlook is not a dependency** — displayable as separately-labeled adjacent context if it exists independently, never required/recomputed. Only degraded-fact visual prominence remains an implementation-design detail, bounded by the invariant that degraded evidence cannot masquerade as known.

### Epistemic status

Design gate is closed pending Principal acceptance of the amended design. **Implementation remains UNAUTHORIZED**; a 4AM Codex pass on the design is not required (Codex already supplied the accepted-code adversarial audit) unless the Principal escalates. Next decision is an explicit authorization to implement the bounded Console V1. The concurrent `PL-RECIPE-01` work (`8125cc8`) was not touched.


---

## 2026-09-16 — Brokerage lifecycle-evidence authority: final pre-implementation reconciliation (clarification absorbed)

**Actor:** Kiro, bounded authority-reconciliation pass before HOLD-vs-CLOSE V1 implementation.
**SYNC SHA:** `87884ea36fa53c745cd74872eb67e86f4dbd9d6f` (accepted `main`; working tree clean).
**Mode:** Authority reconciliation / clarification. **Not** implementation.

### Question closed

Does current authority establish that *a trade/lifecycle transition may become portfolio/history fact only from authoritative brokerage evidence — never from intent, broker handoff, recommendations, market observations, forecasts, or unsupported inference — and that brokerage evidence wins conflicts with projections?*

### Finding — PARTIALLY codified (fragmented), now consolidated

The rule existed in pieces but **not in one governing A/B artifact**:
- **ADR-004** — broker handoff opens a ticket, does not submit, does not assume acceptance, does not mutate portfolio state.
- **ADR-011** — Fidelity CSV as application-scoped portfolio state with shared provenance.
- **ADR-015/016/017** — the authority spine: downstream must not manufacture provenance authority, must not infer competing associations, must not let local/projected fallback outrank an authoritative verdict; fail closed while authority pending.
- **`07-architecture-current.md`** — Fidelity Activity History CSV is the current mechanism for importing realized trade data.
- **BUG-001** — states the operational contract verbatim ("authoritative Option Summary checkpoint + subsequent executed Activity = current state") — but this lived in a **defect record**, forcing cold-start reconstruction from a bug + code.
- **`foundations/portfolio-capital.md` §Open Q6** — Option Summary owns strategy pairing/encumbrance; a Holdings export would be stronger for pure ownership (evidence-ownership fragment).

The generalized *source-of-the-event* rule and the *projection-loses-to-brokerage-evidence* precedence were not stated together in governing authority. That is a genuine cold-start reconstruction hole.

### Disposition — smallest clarification, no new principle/ADR

Absorbed the rule as **one governing bullet** in `07-architecture-current.md` §Ownership and Authority Boundary (Category A), placed in the ADR-004/011/015/016/017 sibling cluster. It **introduces no new principle** — it consolidates existing authority so a cold actor need not rebuild it from a defect record + `activity-projection.ts`.

### Refinement adopted (important)

The earlier wording ("projections never establish current state") was **too strong** and was corrected. Wheelwright legitimately **projects broker-observed subsequent Activity over an older broker checkpoint** — that overlay contract is valid. The real boundary is the **source of the event**: a non-brokerage signal may never *originate* a lifecycle fact, and a projection may never *outrank* newer brokerage evidence. Fidelity is named as the *current supported instance*, not the timeless concept (broker modularity, `PL-EXEC-01`).

### Relationship to HOLD-vs-CLOSE V1

This is the authority basis for the §14a lifecycle-ambiguity guard: the guard refuses (`lifecycle state ambiguous`) when brokerage Activity contradicts the projected obligation, and never lets intent/handoff/projection assert a transition occurred. The BTC case the Principal flagged is exactly covered — Wheelwright may say "CLOSE would do X" and may know an intent/handoff happened, but cannot say "this option was bought-to-close" until Fidelity evidence says so. Cross-linked from the design §14a.

### Epistemic status

Clarification absorbed into governing authority; why-state preserved here. **Implementation remains UNAUTHORIZED.** With this hole closed, the reconciliation boundary is complete: the next step is an explicit Principal authorization to implement the bounded Console V1 at the then-current accepted `main`.


---

## 2026-09-16 — BTS/HOLD-CLOSE product-outcome execution failure: accepted machinery displaced the operator answer

### Context

The Principal exercised the in-progress existing-short-obligation HOLD/CLOSE work against the concrete DBO Sep 18 $21 short put. The operator-visible result failed the actual product intent: the DBO row still had no red BTS attention indicator, and the position-detail modal presented a large HOLD/CLOSE consequence wall rather than a concise lifecycle decision. Earlier iterations were worse: chain inadmissibility produced a blanket "comparison refused," effectively allowing a market/session evidence boundary to erase an otherwise conspicuous BTC-review opportunity.

The concrete specimen was:

- DBO Sep 18 $21 short PUT;
- approximately 2 DTE;
- underlying approximately $25.47;
- deeply OTM;
- displayed delta approximately 0.0001;
- obligation still open.

The Principal's clarified expected operator outcome is intentionally simple:

> **DBO must show a red BTS indicator and, when governed lifecycle policy supports the conclusion, Wheelwright should directly say "BTC THIS PUT."**

Unavailable current close-price evidence may be shown beneath that answer. It must not turn the primary product answer into "comparison refused," nor force the operator to reconstruct the decision from a wall of consequence facts.

### What went wrong

This was primarily an **execution/conformance failure, not absence of governing process**.

The accepted HOLD-vs-CLOSE design was a consequence-analysis slice. During implementation and review, that supporting slice was allowed to become the product surface. Candidate detection/attention, consequence evaluation, and governed lifecycle decision were progressively conflated. The row bell was initially wired to consequence-evaluator completeness, so downstream chain admissibility could suppress the attention signal. Subsequent design/review passes became increasingly rigorous about the intermediate abstraction while the original operator question — "what do I need to do with this position?" — was not kept as the acceptance anchor.

The failure was expensive: substantial Kiro/Codex/Principal effort was spent hardening a technically careful interpretation that still failed the obvious working-software outcome.

The repository already contained the conceptual homes we needed: AR2/ADR-013 attention/Decision Pressure, lifecycle choices, consequence evaluation, AR5/policy, explanation, and the Technology Quality / architectural-fitness-function program. The actors failed to connect and execute those authorities around a concrete Principal-visible outcome.

### Product correction

The governing product decomposition is:

1. **NOTICE** — identify a supported lifecycle candidate / attention condition.
2. **EVALUATE** — establish each supported consequence independently; unavailable evidence degrades dependent facts rather than unrelated facts.
3. **DECIDE** — apply governed lifecycle policy and state the operator action directly when supported.
4. **EXPLAIN** — provide the smallest useful reason set and material caveats beneath the answer.

A recommendation such as **BTC THIS PUT** is a governed policy result with operator-controlled execution; it is not an automatic trade and not a prediction.

Market/session closure or option-chain inadmissibility must not, by itself, erase independently supported BTS candidacy or independently supported consequences. Whether missing close-price evidence prevents a decision depends on the governed policy's actual evidence requirements.

### Hard-earned process correction

The Principal identified two lessons behind the failure:

1. Acceptance criteria must be **stupid simple and specimen-first**.
2. New operator learning — here, the recently learned BTC technique for retiring a largely completed obligation early so capital can be reused — must first be translated into the **decision Wheelwright should support**, before evidence plumbing, architecture, or UI is designed around it.

The process ratchet is therefore:

- **Specimen-first acceptance:** name a real case that must work.
- **Explicit trigger:** state why Wheelwright should notice it.
- **Product-before-conformance:** state the literal operator-visible result before architecture review.
- **Principal-outcome confirmation:** actors propose 2–4 concrete outcomes early; the Principal confirms/replaces them in plain language. The Principal is not responsible for discovering missing acceptance criteria after implementation.
- **Implementation-handoff repetition:** every implementation/review handoff repeats the confirmed acceptance sentence so supporting architecture cannot silently replace the objective.
- **Fitness-function ratchet:** after outcome confirmation and design reconciliation, identify mechanically observable load-bearing properties; propose executable protection, positive and negative specimens, and an explicit enforcement mode. Preserve approved protection across future implementations.
- **Working-software acceptance first:** final handoff begins with `Principal-visible outcome delivered: YES / NO`, the specimen, expected behavior, and observed behavior. Test counts and architectural conformance follow; they cannot turn a visible NO into acceptance.

For this capability the acceptance specimen must be frozen in evaluation time/evidence so Sep 18 does not become a wall-clock-dependent test. At minimum, protection should cover: DBO-positive red/action case; routine-obligation negative case; close-pricing-inadmissible independence; and contradictory brokerage-lifecycle authority preventing an unsupported current-obligation decision.

### Relationship to the previous execution failure

This is thematically the same class as the **2026-09-14 generation-29066 servicing experiment governance conformance failure** recorded in `project-journal-3.md`.

That earlier failure also did **not** arise because governance was missing. The Principal had already supplied a bounded objective and the repository already required bounded intervention, earned complexity, rapid working-software evidence, and preservation of observation cadence. During execution, individually legitimate technical findings repeatedly reopened design and accumulated completeness machinery until the finite regular-market observation window was largely consumed. The journal's root-cause statement was explicit: **"This was not primarily a missing-governance failure. The governing principles already existed. It was a conformance failure under execution pressure."**

The shared pattern is:

> **The Principal supplied the direction and governing process already existed; actors failed to preserve the simple objective while technically legitimate intermediate concerns became dominant.**

Generation-29066 lost a market observation window by over-hardening before observing. BTS/HOLD-CLOSE lost the operator outcome by over-hardening the consequence abstraction before anchoring and continuously testing the actual decision surface. In both cases, architecture/review quality locally improved while execution drifted from the Principal's intended result.

The Sep 14 actor contract — **"Find freely. Block narrowly. Defer explicitly. Observe quickly. Ratchet what reality proves."** — therefore applies directly here. The additional BTS lesson is that "observe quickly" must include the **Principal-visible product outcome**, not merely implementation/runtime evidence.

### Fitness-function loop that was not closed

The project already had `PL-ARCH-FITNESS-01` and Technology Quality authority for promoting mechanically observable architectural truths into executable protection. That loop was not closed here. Once the DBO outcome became explicit, the project should have asked whether it was a load-bearing executable invariant and protected it across the real consumer path.

The required loop is:

> **real specimen → confirmed outcome → reconciled architecture → executable protection → implementation → continuous protection**

Deterministic protection cannot discover that the wrong product outcome was confirmed. Therefore Principal-visible outcome confirmation must precede the fitness-function ratchet.

### Epistemic status

**Failure/why-state recorded; process ratchet identified.** This entry does not itself authorize implementation, invent policy thresholds, or promote `PL-ARCH-FITNESS-01` from INTAKE. The current in-progress BTS/HOLD-CLOSE working-tree work must be judged against the Principal-visible specimen, not accepted merely because intermediate architecture or tests conform.

---
## 2026-09-16 — BTS/HOLD-CLOSE closeout: Principal-visible acceptance reached after a second-order economic-collapse defect
**Actor:** Kiro (implementation), authorized bounded closeout of the BTS red-indicator / operator-answer work.
**SYNC SHA at work:** `1a12d1cc210407765268a2b5c898c294a5ffd271` (accepted `main`; the in-progress work was reconciled onto it — the advancement was docs-only and non-conflicting).
**Mode:** Implementation closeout + why-state preservation. Not new design authority.
### What was delivered (Principal-visually verified)
- DBO Sep 18 $21 short PUT: red BTS indicator present; opened modal LEADS with `BTC THIS PUT`; reason line `2 DTE · deeply OTM (…% from strike) · remaining obligation risk governed negligible — BTC policy condition met`; unavailable close pricing is a subordinate execution caveat, not a suppression.
- DBO $26 BUY-WRITE (HOLD) and PDBC BUY-WRITE (ITM) do NOT receive the red indicator.
- The layered model is now expressed in code as five distinct concerns: NOTICE (candidate) → DECIDE (BTC/HOLD/RECONCILE/DEFER/NO-ACTION) → **ATTENTION** (`actionRequiresOperator`, the sole red driver) → EXPLAIN (modal answer-first) → EVALUATE detail (collapsed).
### The second-order failure (the durable lesson of this closeout)
The first correction fixed the *displacement* defect (machinery led the modal instead of the answer) but introduced a NEW defect: it set `attention: true` on **every** governed decision, including routine HOLD. That collapsed ATTENTION into DECIDE — "a decision exists" became "red" — and lit every near-expiry position. Worse, it collapsed economically distinct short-option structures into a single `near-expiry + OTM = red` abstraction, which is economically backwards for a covered call whose assignment/call-away is an *intended* lifecycle outcome (the PDBC case). The fix required separating ATTENTION as a pure function of the *action* (`BTC`/`RECONCILE`/`DEFER` require the operator to act; `HOLD`/`NO-ACTION` do not) — not of decision existence, strategy type, DTE, or moneyness sign alone.
### Why it kept happening / what finally caught it
Each intermediate pass preserved engineering and architectural conformance while the Principal-visible outcome remained wrong, so the Principal had to serve as the end-to-end acceptance test twice. What finally exposed the defect was an **explicit positive + negative specimen pair** stated in operator terms ("DBO $21 PUT red + BTC; DBO $26 BUY-WRITE not red when HOLD"), plus a required pre-implementation contradiction check ("does the proposed trigger path mechanically produce BOTH sides?"). This is further concrete evidence for the pending outcome-alignment / fitness-function discussion (`PL-ARCH-FITNESS-01`, INTAKE) — it is NOT authorization to invent process now.
### Durable protection added (deterministic)
Locked as tests so the verified specimens cannot silently regress:
- qualifying near-DTE deeply-OTM short PUT → `BTC` + attention (red);
- HOLD / NO-ACTION → no attention (no red), even at 2 DTE / while evaluated;
- ITM short CALL (PDBC-style buy-write) → HOLD + no red, never a put-style BTC (economic-protection specimen);
- unavailable/inadmissible close pricing → PUT decision still `BTC`, degraded only to the execution caveat (BTS-CLOSURE-INDEPENDENCE);
- §14a lifecycle ambiguity → `RECONCILE-LIFECYCLE`, never an invented BTC/HOLD;
- the row indicator is driven solely by the governed decision's `attention`, not by consequence completeness (the original "facts→actionable" classifier was removed as the root NOTICE defect).
### Explicitly deferred (not pursued in this closeout)
Absence of current option/BTC prices in the tables is noticed and deferred by Principal instruction. Whether a *deeply*-OTM short call should be BTC or HOLD is a separate economic-semantics question (not present in this frozen specimen — WEAT $27C is near-strike, ~0.45 delta, so it correctly resolves to HOLD today); not decided here.
### Epistemic status
Implementation complete and Principal-visually accepted; reconciled onto accepted `main`; committed under the direct-`main` routine workflow. No new `PL-*`/ADR/policy invented. The two next topics (always-on outcome-alignment mechanism; whether the actors understand options mechanics well enough / a durable options-trading domain treatise) are separate four-actor discussions and were NOT started.
