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


---

## 2026-09-16 — BUG-021 repair: buy-to-close no longer booked as capital deployment (Kiro)

**SYNC:** repaired against remotely-verified accepted `main` at `9f10ba3de8c40aaf87e5bc2250aace6c1456cdc8`. The BUG-021 record was originally verified at `7b4a084`; the `7b4a084..9f10ba3` range is documentation-only, so its code findings held unchanged.

**Authorized scope.** Principal selected BUG-021 as the next work item (backend Production accounting only; not adjacent lifecycle generalization). Prior why-state confirmed BTC is not a new durable concept and needs no new `PL-*`/architecture (this cycle re-verified that against `9f10ba3`).

**What was wrong (accepted code).** `TransactionClassifier` had no `"YOU BOUGHT CLOSING TRANSACTION"` branch, so a buy-to-close fell through to the generic `"YOU BOUGHT" → ASSET_PURCHASE`, and `EconomicDecomposer` booked it as `CAPITAL_DEPLOYMENT` against the OCC symbol. `CAPITAL_DEPLOYMENT` is never summed into any production/erosion total, so the closing debit silently vanished from Net Strategy Result while the gross opening premium stayed fully counted.

**The load-bearing design choice (preserved so it is not re-litigated).** The BTC closing debit is netted against recognized premium **at the `OPTION_PREMIUM` source level**, by emitting a `PRODUCTION`/`OPTION_PREMIUM` component carrying the row's *signed* (negative) net cash. This is economically correct and needs only the BTC row's own OCC identity + authoritative cash. It deliberately does **not** pair a specific STO occurrence — that STO↔BTC lifecycle-episode pairing is `LVT-BET-LIFECYCLE-OUTCOME` / `PL-EXEC-01` scope and was explicitly out of bounds. Considered and rejected: (a) representing the debit as `CAPITAL_EROSION` — wrong, erosion means realized loss on a disposition, not the cost of retiring a premium obligation, and it would corrupt the `realized_capital_erosion` headline; (b) building an STO↔BTC matcher (like `DispositionAssociator`) — unnecessary for source-level netting and would invent association the evidence does not require. ADR-014 preserved: premium is still recognized once at STO; the close reduces the net, it does not re-recognize.

**Fail-closed boundary.** A BTC with no authoritative closing debit (`amount == null`) decomposes to `UNRESOLVED`/`BASIS_UNKNOWN`, never an assumed value — consistent with the HOLD-vs-CLOSE V1 §14a exact-contract-or-refuse discipline and ADR-016.

**Observed product outcome.** Live `POST /api/production/assess` on a freshly-built backend: specimen STO EWY +150 → BTC EWY −40 (+ equity buy SPYI −3955.67, + STO GSG +112.34) ⇒ net `OPTION_PREMIUM = 222.34`, `netStrategyResult = 222.34`; BTC row = `PRODUCTION`/`OPTION_PREMIUM` `−40.0` (INCLUDED, not CAPITAL_DEPLOYMENT); SPYI stays `CAPITAL_DEPLOYMENT 3955.67`. Gross-vs-net contrast: 262.34 → 222.34 (the −$40 closing debit now shows up).

**Caveat noticed (not repaired here, not bundled).** The operator's separately-running local instance on port 3100 is a *stale* build that mis-booked both the BTC and the equity buy as `PRINCIPAL_MOVEMENT`/"External deposit" — it does not reflect accepted `main` and was not used as evidence. Also note the frontend Episode Ledger derives its own per-episode premium from the raw Activity rows (its own `buy_to_close` handling) rather than from the backend `OPTION_PREMIUM` components; BUG-021 was the backend accounting path only, and that separate presentation path was untouched.

**Epistemic status.** Implementation complete; backend 578 tests pass (1 manual skip), frontend production 53 pass, live product-path observed. Change is **uncommitted**; BUG-021 remains **Open** pending Principal acceptance (passing tests do not authorize commit or self-close). No new `PL-*`/ADR/policy invented.


---

## 2026-09-16 — BUG-021 bounded amendment after independent review (Kiro) — corrects the prior same-day entry

The earlier 2026-09-16 BUG-021 entry above overclaimed. Independent review (Codex) plus Principal correction found that the first pass implemented "the BTC debit reduces period option economics" but described it as "the BTC retired a recognized short obligation." Those are different claims, and BUG-021 exists precisely to preserve that distinction. This entry records the correction; the prior entry's *economic* direction (executed debit nets into period option premium; never CAPITAL_DEPLOYMENT; premium recognized once at STO) stands — its *lifecycle-certainty* and *frontend-complete* claims did not.

**Three-way distinction now governing (never conflate):**
1. **Known executed BTC economics** — the row's own authoritative closing debit; known whenever the row carries cash; reduces net period option premium even without a recognized opening.
2. **Recognized-lifecycle association** — whether/how much recognized short quantity the close retires (complete/partial); a *separate* determination.
3. **Unresolved lifecycle/quantity** — the residual: no recognized opening, insufficient contract identity, over-close, or missing cash.

**Corrected overclaims:** (a) OCC identity alone does NOT establish lifecycle association — it establishes fact 1 and enables quantity-level association; unmatched/over-close/insufficient-identity is surfaced as unresolved. (b) The frontend did NOT already present BTC — `episode-derivation.ts` `buildEpisodeMap` dropped `buy_to_close` entirely, so Economic Activity told only the opening story while the headline changed. (c) BUG-021 is NOT self-declared repaired — it stays Open pending Principal acceptance.

**Two real blockers the amendment fixed (both were genuine, not philosophical):**
- **Reconciliation propagation gap.** `ProductionAssessor.determineStatus` returns `FULLY_RECONCILED` when `issues.isEmpty()`, and nothing raised an issue for an unresolved BTC (missing cash / unmatched / over-close). A materially unresolved BTC could therefore report `FULLY_RECONCILED` with the debit either lost (pre-fix) or netted-but-unexplained. Added `IssueType.OPTION_CLOSE_LIFECYCLE_UNRESOLVED` + `appendOptionCloseReconciliationIssues(...)`. Executed debit is never suppressed; visibility of the unresolved association is preserved.
- **Frontend presentation.** Added `buildCloseChapter` (+ `buy_to_close` handling in `buildEpisodeMap`, target-month filter, `buildOpenChapter` full-close state, `buildConstituentEvents` close phase). Presents complete/partial/over-close/unmatched/missing-cash distinctly, shows the executed debit as known cash, and never presents a partial/unmatched/over-close as a complete retirement. CSP capital effect = "nominal encumbrance removed" (matched qty only), never cash release (HOLD-vs-CLOSE V1 discipline).

**Association is quantity-level only** for the exact OCC contract (summed BTC qty vs summed STO qty); no STO-occurrence pairing, no lot allocation, no invented STO — episode-lifecycle reconstruction remains `LVT-BET-LIFECYCLE-OUTCOME` / `PL-EXEC-01` scope.

**Observed (real Product path).** HTTP `/api/production/assess`: matched → `FULLY_RECONCILED`, no issue, BTC −40 netted; unmatched → `PRODUCTION_UNCERTAIN` + issue, debit still known; over-close → issue "excess unresolved", both debits counted; missing-cash → `PRODUCTION_UNCERTAIN` + issue, BTC `UNRESOLVED`. Economic Activity ledger (`deriveEpisodeChapters`) now renders the close chapter for every specimen with residual/excess/unmatched made explicit.

**Verification.** Backend 583 pass (1 manual skip); frontend production 59 pass; full frontend 1715 pass with 1 pre-existing unrelated velvet-rope date-snapshot failure (confirmed on clean `main`). Uncommitted; BUG-021 Open pending Principal acceptance. Stopped at BUG-021 — no adjacent lifecycle work.


---

## 2026-09-16 — BUG-021 third pass: temporal & per-event correctness (Kiro) — corrects the second-amendment entry

The second BUG-021 amendment (entry above) fixed reconciliation propagation and the Product presentation but left two genuine causal/reporting defects that a second independent review (Codex) plus Principal correction surfaced. Recorded here (append-only); the earlier entries' economic direction stands, but their *association* and *per-event* claims did not.

**Defect 1 — quantity reconciliation without temporal reconciliation.** The second-pass association summed all STO vs all BTC for a contract across the whole supplied history. That cannot establish that an obligation existed *when a particular BTC executed*: a later STO could validate an earlier close, and a prior expiration/assignment could be ignored. Fixed with a bounded **chronological exact-contract resolver** (`resolveRecognizedOutstandingBefore`): recognized outstanding short quantity is built from **strictly-prior** events only (prior STO +qty; prior BTC or prior terminal resolution −qty); future events have zero effect on an earlier close. Over-close / no-recognized-outstanding are judged per close against that temporal quantity. Same-day competing lifecycle events **fail closed** (date-only evidence cannot establish intraday order) rather than inventing a sequence.

**Defect 2 — per-event identity destroyed.** The frontend accumulated BTCs into scalar `closeDate`/`closeDebit`/`closedContracts`, collapsing multiple dated closes into one (first date, summed debit). That can move cash/lifecycle across reporting periods or make a later-month close disappear. Fixed by modelling `EpisodeRecord.closeEvents: CloseEvent[]` and emitting **one dated close chapter per executed BTC** (`buildCloseChapters`), each judged by the same chronological resolver. A cross-month later close now lands in its own month.

**Third correction — partial-close product semantics.** A partial close no longer shows `opening premium − partial debit` as realized closed-lifecycle P&L (no authoritative opening-premium allocation exists). Each close chapter shows the **executed closing debit itself** plus matched/residual/excess quantity and confidence.

**Quantity independent of cash.** A BTC with authoritative cash but missing/invalid quantity keeps its debit in period option economics yet raises a lifecycle issue and never claims deterministic retirement — cash-known and quantity-known are independent facts.

**Durable 4-way distinction now recorded in the BUG-021 record:** (1) known executed BTC cash (per-event, dated); (2) temporally-defensible recognized association (strictly-prior evidence only); (3) quantity affected; (4) unresolved/conflicting evidence (no prior opening, prior resolution consumed, insufficient identity, over-close, same-day ambiguity, missing cash, missing quantity).

**Observed (real Product path).** HTTP `/api/production/assess`: future-opening (BTC then later STO) → `PRODUCTION_UNCERTAIN`, no backfill, debit known; prior-resolution (STO/EXPIRED/BTC) → `PRODUCTION_UNCERTAIN`, obligation already consumed; cross-month (STO 2; BTC Jul; BTC Aug) → July view has the July close, August view has the August close (`OPTION_PREMIUM 70`), not absorbed. `deriveEpisodeChapters` renders one dated chapter per close.

**Verification.** Backend 589 pass (1 manual skip); BuyToCloseProductionTest 20 cases; frontend production 65 pass; full frontend 1721 pass with 1 pre-existing unrelated velvet-rope date-snapshot failure (confirmed on clean `main`). Uncommitted; BUG-021 **Open** pending Principal acceptance. Stopped at BUG-021.


---

## 2026-09-16 — BUG-021 fourth pass: uncertainty-as-state + single lifecycle authority (Kiro) — corrects the third-pass entry

A third independent review (Codex) + Principal correction found two remaining defects in the temporal (third-pass) candidate. Recorded here append-only; the executed-cash economics were never the problem.

**Defect 1 — unknown consumption was treated as zero.** The chronological resolver folded a null prior quantity as `0` consumption, so after an unknown-quantity BTC or unknown terminal event the remaining outstanding stayed a definite integer, letting a later close become falsely deterministic. Fixed by carrying recognized-outstanding-before as an inclusive integer **range** `[min,max]`: known events move both bounds; an unknown-quantity prior consumption sets `min→0` and leaves `max` unchanged (unknown ≠ zero); an unknown prior opening marks the upper bound untrusted. A close of `q` is deterministic only when `min ≥ q`, definitely over-closed when `max < q`, else UNRESOLVED. Live-confirmed: STO 2 → unknown-qty BTC → BTC 2 now reports `outstandingBefore=[0,2]`, UNRESOLVED.

**Defect 2 — two competing lifecycle authorities.** The frontend still ran its own chronological resolver over collapsed opening (openDate+contracts) and episode-level terminal evidence, so it could diverge from the backend (a later opening leaking backward; a partial terminal consuming the whole episode). Fixed by making the **backend the single authority**: a new `OptionCloseResult` per executed BTC (executed debit, closed quantity, `outstandingBefore[min,max]`, matched/residual/excess, status, reason) is produced by `ProductionAssessor` and exposed on the assessment/DTO. `episode-derivation.ts` no longer computes association — its resolver was removed; it looks up the authoritative result (by `symbol|date|action|debit|quantity`, ordinal-consumed) and renders status/residual/excess/encumbrance from it. A close with no matching result renders unresolved. A frontend divergence-guard test proves the Product renders the backend verdict even when a naive local resolver would call it complete (ADR-016).

**Durable model (now in the BUG-021 record):** (1) executed BTC cash known per dated event; (2) temporally-defensible association from strictly-prior individual dated/quantified rows; (3) quantity affected (independent of cash); (4) uncertainty preserved as a range — unknown history never becomes zero; (5) one authority (backend) decides association, Product renders it.

**Retractions:** unknown prior consumption is NOT zero; accumulated episode opening quantity is NOT sufficient temporal evidence; backend and frontend do NOT independently run the same resolver (there is now one).

**Verification.** Backend 595 pass (1 manual skip); BuyToCloseProductionTest 26 cases incl. range-model + authoritative-result assertions; frontend production 65 pass (BTC file 11, incl. divergence guard); full frontend 1720 pass with 1 pre-existing unrelated velvet-rope date-snapshot failure (confirmed on clean `main`). Live product path confirmed range preservation and partial-terminal correctness. Uncommitted; BUG-021 **Open** pending Principal acceptance. Stopped at BUG-021.


---

## 2026-09-16 — BUG-021 fifth pass: covered≠complete, same-day propagation, last frontend authority removed, real round-trip (Kiro) — corrects the fourth-pass entry

A fourth independent review (Codex) + Principal direction found three residual defects in the fourth-pass (range + single-authority) candidate. Recorded append-only; the range model and single-authority direction stand.

**Defect 1 — covered treated as complete retirement.** `buildOptionCloseResult` set `DETERMINISTIC_COMPLETE` whenever the covered close had `residualMin == 0`, which is any covered close. But outstanding `[1,3]` with a close of 1 leaves residual `[0,2]` — covered, yet the obligation is not definitely fully retired. Fixed: `DETERMINISTIC_COMPLETE` requires `residualMax == 0`; `min ≥ q` with `residualMax > 0` is `DETERMINISTIC_PARTIAL` (covered, residual uncertain). "This close is covered" is not the same claim as "the obligation is completely retired."

**Defect 2 — same-day ambiguity not propagated.** The resolver subtracted a prior known close/terminal quantity exactly even when that prior event shared its date with a competing event for the same contract, manufacturing a definite outstanding for a later close from an unestablished ordering. Fixed: a prior event on a multi-event date for the contract is treated as ambiguous — an ambiguous prior consumption widens the range (`min→0`); an ambiguous prior opening contributes to `max` only. Ambiguity is carried forward, not erased by occurrence order.

**Defect 3 — a frontend lifecycle decision remained.** `episode-derivation.ts` still had `isFullyClosed()` deciding the OPEN chapter's complete/in-flight state from raw close quantities — a second lifecycle authority. Removed. Open-chapter state now comes from `episodeFullyRetiredByBackend(...)` (true only when a backend `DETERMINISTIC_COMPLETE` result exists for the contract). `OptionCloseLookup` gained a non-consuming `byContract` index for this.

**Fix 4 — real backend→Product round-trip.** Replaced the prior "test HTTP output and hand-built frontend DTOs separately" approach: `Bug021RoundTripFixtureTest` (Java) serializes the actual `ProductionResponse` from the real controller to shared fixtures; `episode-derivation-backend-roundtrip.test.ts` drives those fixtures through the real `deriveEpisodeChapters` and asserts the Product renders the backend verdict. Both sides now consume the same backend output, so a frontend/backend divergence is a test failure.

**Verification.** Backend 598 pass (1 manual skip); BuyToCloseProductionTest 26 + 3 round-trip fixtures; frontend production 68 pass (incl. 4 round-trip); full frontend 1724 pass + 1 pre-existing unrelated velvet-rope date-snapshot failure. Uncommitted; BUG-021 **Open** pending Principal acceptance. SYNC reconciled to `e53ea4d` (docs-only advance, immaterial to code). Stopped at BUG-021.

---
## 2026-09-18 — Diagnostic funnel CSV controls hidden behind `?funnelExport=1` (Kiro)
Ratified UX refinement (Principal). The three funnel-membership CSV export controls (CSP, Covered Call, Buy-Write) introduced by BUG-016 are diagnostic/observability affordances, not normal operator workflow; their permanent presence on the Write Desk created operator noise and ambiguity with ordinary operational CSV/download controls. They are now **hidden by default** and exposed only through an intentional, non-persisted query-parameter easter egg: `?funnelExport=1`.
**Scope — UI visibility only.** This is strictly a presentation gate. BUG-016 remains resolved and its remediation is not weakened: terminal-membership collection, `DecisionExportResult` construction, funnel accounting, derived counters, reconciliation assertions (`assertReconciled`), and the CSV schema/filenames are all unchanged and remain independent of the flag. The authoritative terminal membership that underlies the displayed funnel exists whether or not its diagnostic CSV control is rendered. **Funnel membership/export remains a supported diagnostic and audit capability; only its UI controls are intentionally hidden from the normal operator surface to avoid ambiguity with operational exports.**
**Implementation.** New pure predicate `isFunnelExportEnabled(search)` in `src/write-desk/funnel-export/funnel-export-visibility.ts` with exact opt-in semantics (`funnelExport=1` → enabled; absent or any other value → disabled; parameter name case-sensitive). Mirrors the existing `?viz=` convention in `OperatorConsole.tsx`. In `WriteDesk.tsx` the flag is read once (`window.location.search`) and passed to `FunnelExportButton`, which returns `null` when not enabled — no disabled button, placeholder, explanatory text, or empty layout artifact. Not persisted: no Settings preference, storage, visible toggle, environment variable, or feature-flag framework.
**A future actor should not mistake the hidden controls for missing functionality and re-expose them.** Append `?funnelExport=1` to the Write Desk URL to surface them.
**Verification.** New `funnel-export-visibility.test.ts` (query-param semantics + BUG-016 independence) and `funnel-export-visibility.render.test.tsx` (DOM: hidden = empty container/no button; visible = working button that drives the unchanged `downloadFunnelCsv` path). Funnel-export test set 37 pass; existing `funnel-csv.test.ts` unchanged and green. `tsc -b` clean for `src`. Full frontend suite: 1755/1756 pass — the single failure is the pre-existing, date-relative `velvet-rope/multi-expiration` inline snapshot (unrelated). No new BUG record (ratified UX change, no defect uncovered). Uncommitted pending Principal acceptance and explicit commit authorization.
