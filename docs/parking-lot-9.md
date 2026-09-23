# Project Parking Lot — Continuation 9

> This file is a physical continuation of `docs/parking-lot.md` through `docs/parking-lot-8.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 17, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## `PL-ACTOR-01` — Remove the Principal as Human Clipboard While Preserving Principal Authority

**Date:** September 17, 2026  
**State:** INTAKE — new canonical identity created; discussion preserved only; not reconciled, decomposed, designed, selected for implementation, or authorized for implementation  
**Trigger:** Live multi-actor Wheelwright operation during BUG-021 exposed that the Principal is currently the physical message bus among ChatGPT, Kiro, and Codex: copying prompts, results, reviews, and responses between otherwise independent actors.

### What was discovered

The current operating model deliberately preserves Principal authority at consequential boundaries, but transport between actors is largely manual. In normal operation the Principal repeatedly performs handoffs such as:

- ChatGPT prepares a Kiro prompt → Principal pastes it into Kiro;
- Kiro executes and reports → Principal pastes Kiro's response into ChatGPT;
- ChatGPT prepares a Codex review prompt → Principal pastes it into Codex;
- Codex returns review evidence → Principal pastes Codex's response into ChatGPT.

This makes the Principal an accidental **human clipboard / physical message bus**. That transport burden is distinct from the Principal's legitimate authority role.

The desired conceptual separation discovered in discussion is:

> **The Principal owns authority. The system owns transport.**

The Principal does **not** want to surrender Product judgment or consequential authority merely to remove manual copying. The idea is to investigate whether actor-to-actor transport can become automatic while actors continue to stop at genuine authority boundaries so the Principal can exercise judgment.

### Candidate operating shape discussed — not a decision

A useful shorthand that emerged was:

> **Automatic transport, actor-directed workflow, Principal-held authority, mechanical backstop.**

This is discovery language, not accepted architecture.

The discussion distinguished two orthogonal permissions:

1. **Transport permission** — whether one actor can deliver evidence, prompts, state, or results to another actor.
2. **Execution / transition authority** — whether the receiving actor may perform a consequential transition.

Automatic delivery must not itself confer execution authority.

### Likely integration paths — topology intentionally unresolved

The likely communication graph among the three working AI actors was identified as a complete bidirectional triangle:

- ChatGPT ↔ Kiro
- ChatGPT ↔ Codex
- Kiro ↔ Codex

This records **integration paths only**. It makes no implementation commitment. It does not imply six bespoke integrations, a shared broker, a controller, direct APIs, MCP, or any other topology.

### MCP discussion — candidate technology only

Model Context Protocol (MCP) was identified as a technology worth investigating for transport and/or capability access. No decision was made to use MCP.

The important distinction preserved from the discussion is:

- MCP or another protocol could help with transport/capability access;
- Wheelwright's authority model would still determine permitted transitions;
- the Principal would still own Product/authority judgments except where authority is explicitly delegated;
- actor communication must not be mistaken for authority creation.

### Concurrency pressure discovered during the same discussion

Removing the human clipboard may expose or accelerate a separate operating-model question already visible in the current manual regime: two actors can report incompatible `NEXT AUTHORIZED ACTION`s.

Working name from the discussion:

> **Concurrent Next-Action Conflict:** two actors, operating legitimately from their available state, report different consequential `NEXT AUTHORIZED ACTION`s that cannot both be executed consistently.

Two cases must remain distinct:

1. **Stale-state conflict:** the actors reasoned from different authoritative snapshots; reacquiring current state may eliminate the apparent conflict.
2. **Same-state conflict:** incompatible proposed next actions survive after both actors reacquire the same current authoritative state. This is a genuine adjudication problem.

The unresolved question is:

> **When two actors propose incompatible next actions against the same current authoritative state, what adjudication mechanism determines the workflow head?**

### Tiebreaking / delegation discussion — explicitly unresolved

Possibilities discussed, but not selected:

- Principal acts as tiebreaker when a genuine same-state conflict reaches an authority boundary;
- ChatGPT could act as a Principal proxy for a precisely defined class of conflicts under explicit delegated authority;
- deterministic machinery could provide serialization/conflict detection/backstop behavior without replacing actor reasoning or Principal judgment.

No hierarchy such as `Principal > ChatGPT > Kiro > Codex` has been invented or accepted. In particular, actor independence — including Codex's role as independent falsifier — should not be casually collapsed into a permanent hierarchy.

If delegated Principal authority is ever explored, its scope and limits would need to be explicit so that "proxy" does not become authority leakage.

### Live evidence that motivated preserving the idea

The BUG-021 workflow supplied several concrete observations:

- repeated manual prompt/result copying made the Principal's transport burden visible;
- the Principal-facing Decision Surface discussion showed that many immediate human actions are currently variations of "paste this there";
- a fifth diagnostic actor was able to advance orthogonal durable documentation on `main` while Kiro's candidate remained frozen and Codex review was interrupted, demonstrating that actor concurrency and authoritative-state movement are real rather than hypothetical;
- Codex usage exhaustion interrupted review without changing the candidate's authority state, reinforcing that transport/execution availability and authority state are separate concerns.

These observations motivate investigation. They do not establish a solution.

### Why it might matter

If transport can be separated cleanly from authority, Wheelwright may be able to reduce low-value Principal attention spent moving messages while preserving the high-value human role: deciding Product meaning, scope, acceptance, sequencing, economic commitment, and other consequential boundaries.

A successful design should make the Principal intervene because judgment is required, not because two software actors cannot deliver messages to each other.

### Related current authority / concepts

- `docs/foundations/principal-decision-surface.md` — current Principal-facing outcome/decision surface.
- `docs/foundations/three-actor-model.md` — actor-role context.
- `docs/bootstrap/project-memory-protocol.md` — durable state and authorization discipline.
- `docs/foundations/shared-execution-contract.md` — suspended runtime-control attempt; useful warning against mistaking prose for enforcement.
- `docs/experiments/ww-gate-experiment-001.md` and its state record — capability-boundary experiment, currently distinct from this idea.
- `docs/experiments/operating-model-pending-corrections-2026-09-17.md` — narrow pending corrections learned from the current live workflow; not a substitute for this broader transport idea.

### What remains unresolved

- Whether automatic actor transport is desirable across every integration path or only selected handoffs.
- Whether transport should be direct, brokered, controller-mediated, MCP-based, or use another mechanism.
- How actor identity, message provenance, state/version identity, delivery acknowledgement, and replay/idempotency should work.
- How a receiving actor proves that a delivered message carries evidence but not authority unless durable authority independently permits the transition.
- Whether there must be one authoritative workflow head, and if so where that state lives.
- How same-state next-action conflicts are detected and adjudicated.
- Whether any Principal authority should ever be delegated to ChatGPT or another actor, and under what exact limits.
- How to preserve Codex independence if transport becomes automatic.
- What deterministic backstop is required if an actor fails to stop at an authority boundary.
- Whether MCP is useful, sufficient for any transport layer, or irrelevant after deeper investigation.

### Explicitly not authorized

This intake does **not** authorize:

- implementation of actor-to-actor transport;
- MCP adoption or integration;
- creation of a controller, broker, workflow engine, or new authority service;
- delegation of Principal authority;
- invention of a permanent actor hierarchy;
- changes to current actor roles;
- changes to Gate Experiment 001;
- changes to the active BUG-021 workflow or frozen candidate;
- automatic execution following actor-to-actor delivery;
- roadmap or architecture changes.

### Parking-lot disposition / mapping

**New canonical identity `PL-ACTOR-01` retained at INTAKE.** Repository search found no existing `PL-*` identity owning the specific concern of removing the Principal's manual actor-to-actor transport burden while preserving Principal authority. This is broader than the pending narrow Decision Surface corrections and is not a defect record.

### Why-state

The material discussion is preserved in this intake record so that the concept can survive cold start without reconstructing the conversation. No additional discovery document is required at intake unless later exploration becomes too rich for this canonical record.

### Next authorized mode

**Further exploration only.** When deliberately selected later, reacquire this item and investigate the problem before choosing protocol, topology, hierarchy, delegation, or enforcement design.

No reconciliation, design, decomposition, experiment, or implementation is authorized by this intake.


---

## `PL-DEPLOY-BAL` — Fidelity Account-Regime / Broker-Balance Semantics

**Date:** September 19, 2026  
**State:** RECONCILED — durable knowledge captured; candidate runtime/model/test consequences retained; no production implementation authorized  
**SYNC at reconciliation:** `c1e22e0e6575f70e722088aad0c2dc41ca2eb169`  
**Concept home:** `PL-DEPLOY` — Deployment Opportunity / Unified Surface  
**Evidence / why-state:** `docs/56-fidelity-account-regime-balance-semantics-2026-09-19.md`

### What was discovered

Live Fidelity definitions and two real account specimens show that Wheelwright must support two materially different broker balance regimes without collapsing their facts into one synthetic model:

- a simple non-margin/cash-style Fidelity account (Sawdust Roth); and
- a margin-enabled Fidelity account (PTS) exposing buying power, AWMI, settled cash, withdrawal-with-borrowing capacity, margin-surplus state, holding-type values, and actual financing state.

The durable architectural rule is:

> **broker-native facts → account-regime classification → Wheelwright semantic projection → policy**

The parser preserves facts. Domain projection answers explicit Wheelwright questions. Policy consumes those projections.

### Material evidence

The September 19 PTS specimen supplies the real divergence BUG-022 previously lacked:

- Available without margin impact = **$0.00**
- Settled cash = **$1,923.15**
- Non-margin buying power = **$8,621.39**
- Margin buying power = **$17,242.78**
- Margin credit/debit = **$0.00**
- no margin interest accrued

This validates the existing MARGIN-regime Deployable rule: **AWMI, not Settled cash or Non-margin buying power, is the broker-native authority for additional unlevered deployment capacity.**

The current Sawdust specimen supplies the complementary CASH branch:

- Available to trade (all settled) = **$10,510.06**
- Available to withdraw = **$710.06**

This also establishes that tradable and withdrawable liquidity are distinct even in the simpler non-margin regime.

### Reconciliation against existing identity

Complete parking-lot/repository reconciliation found `PL-DEPLOY` as the existing strategic/concept home but no stable item owning the narrower broker-account-regime/balance-semantics concern. `BUG-022` owns the historical defect and remains RESOLVED; this item must not double-book or reopen it. A bounded child/refinement identity is therefore warranted to preserve the broader capability semantics and candidate future work.

### Candidate later work — not authorized implementation

- Preserve richer Fidelity broker-native balance facts where useful rather than folding them.
- Keep unlevered Deployable regime-aware: CASH → Available to trade (all settled); MARGIN → AWMI; INDETERMINATE → null.
- Consider a distinct unlevered-withdrawable semantic projection: CASH → Available to withdraw; MARGIN → Cash only.
- Represent actual financing state independently from margin capability/holding type.
- Preserve house surplus, SMA, and exchange surplus as distinct explanatory/risk facts without inventing policy thresholds.
- Retain both account regimes as sanitized regression specimens, including the PTS falsifier: positive Settled cash + positive buying power + zero margin debt + zero AWMI.
- Do not build a synthetic Fidelity NAV/margin-requirement/reserve engine.

### Reconciliation Completion Record

- **Intake:** `PL-DEPLOY-BAL`
- **Strategic disposition:** **strengthens existing `PL-DEPLOY`; no new Bet and no `docs/roadmap.md` change.** The concern is truthful capital-state semantics beneath the already accepted Deployment Opportunity direction.
- **Architectural disposition:** **refines existing broker-fact / domain-derivation boundary and regime-aware semantic projection; no new architecture direction and no `docs/architecture-roadmap.md` change.** Do not normalize distinct broker facts at ingestion and do not create a shadow Fidelity accounting engine.
- **Parking-lot disposition/mapping:** **retained** as bounded `PL-DEPLOY-BAL` under concept home `PL-DEPLOY`; cross-linked to resolved `BUG-022` for historical defect provenance.
- **Why-state:** `docs/56-fidelity-account-regime-balance-semantics-2026-09-19.md`
- **Next authorized mode:** **design / decomposition only when separately selected by the Principal; no production implementation is authorized by this reconciliation.**

### Explicitly not authorized

No production-code, parser, DTO/schema, UI, or `deriveDeployableCash` changes; no invented Fidelity formulas; no margin-aware trading policy; no generalized broker-accounting subsystem; no automatic roadmap commitment from the candidate consequences above.

### PL-DEPLOY-BAL — Sep-2026 cash-layout Deployable fix shipped (2026-09-21)

**Date:** September 21, 2026  
**State:** Bounded implementation shipped under `PL-DEPLOY-BAL`; Principal operator-accepted; accepted-main SYNC `970f87af6f5a48de491cb579e39624fad19cb2c3`

The September 19 reconciliation authorized no production implementation. On September 21 the Principal separately authorized and accepted a bounded correction for a specific regression: Fidelity's Sep-2026 cash-account Balances export dropped the "Available to trade (all settled)" label and split "Settled cash" into its own row. The baseline parser recognized neither margin evidence nor the legacy all-settled label, so the modern cash layout classified INDETERMINATE, `deriveDeployableCash` returned null, and readiness blocked the account (real case: Sawdust Roth).

Bounded correction (smallest sufficient parser change; no UI, persistence, or capital-history coupling): `parse()` now records presence of a value-bearing "Available to trade" row (`availableToTradePresent`). The cash regime classifies on the legacy "(all settled)" label OR that value-bearing row; MARGIN still wins on presence. Cash Deployable prefers the legacy all-settled figure and falls back to the current headline "Available to trade"; "Settled cash" is never Deployable.

Real-specimen result + Principal browser acceptance:

- PTS margin (Z39411514) → MARGIN / **$849.30** (from AWMI, not the $9,547.54 Non-margin buying power)
- Sawdust Roth (262761078) → LEGACY_CASH / **$458.42** (headline "Available to trade", not the $51.06 Settled cash)
- Both accounts also produced a fully populated Production page after Activity upload (individual-upload workflow).

Verification: focused `fidelity-upload.test.ts` 27/27; `tests/portfolio` + `tests/write-desk` 903/903; `tsc` clean; Principal real-browser acceptance for both accounts.

Multi-select / "Upload All" was considered as a second bounded enhancement and **dropped by explicit Principal decision (Option 4)**: the individual-upload workflow already restores the morning workflow, and identity-gated multi-select is unsatisfiable against real Fidelity files, which carry no embedded account identity (confirmed: both Balances and Option Summary exports return no external account reference; the account number lives only in the filename, and filename-derived identity was already rejected by the ratified selection-as-identity decision at `e6e743b`).

This closes the "no production implementation authorized" line of the 2026-09-19 `PL-DEPLOY-BAL` intake **for the Sep-2026 cash-layout Deployable regression only**. The broader account-regime capability candidates listed above (richer preserved facts, unlevered-withdrawable projection, financing-state representation, regression specimens) remain open under `PL-DEPLOY-BAL`.

**Deferred (not defects, recorded for future work):**

- One-file ordering trap: `buildSnapshotForAccount` returns null until both Option Summary and Balances are present, with no operator feedback for the intermediate state — it reads as a silent failure. Not a correctness defect; not addressed here (the dropped multi-select would have masked it). Candidate small UX affordance.
- Real Fidelity files carry no embedded account identity; relevant if multi-select / content-based routing is ever revisited.
---

## `PL-PORT-01-UPLOAD-ALL` — Multi-file "Upload All" import affordance (refinement of `PL-PORT-01`)

**Date:** September 21, 2026 (intake)  
**State:** INTAKE refinement under existing `PL-PORT-01`; RECONCILED (see completion record); no implementation authorized  
**Concept home:** `PL-PORT-01` — Portfolio-State Maturity (multi-account operator UX)

### 1. What was discovered

The Fidelity upload surface (`FidelityUploadCompact`) exposes three individual slots (Option Summary, Balances, Activity) that must each be uploaded separately. During the September 21 Option A recovery, a multi-file **"Upload All"** affordance was considered — select the coherent file set once and import the whole set in one action — then **dropped by explicit Principal decision (Option 4)** because the individual-upload workflow already restores the morning workflow. The concept is preserved here as durable intake so it is not rediscovered.

### 2. What triggered it

The recovery re-examined multi-select because it was uncommitted failed-session work never present in the `e6e743b` baseline. The trigger (recovery) is distinct from the general concept (a one-action import of a coherent Fidelity file set that also removes the one-file ordering trap — see the deferred note under `PL-DEPLOY-BAL`).

### 3. Why it might matter

One-action import would (a) remove the one-file intermediate dead state where `buildSnapshotForAccount` returns null with no operator feedback until both Option Summary and Balances are present, and (b) make the coherent set (Option Summary + Balances + Activity) reach the active account together so a single action can yield a populated portfolio and Production page.

### 4. Related concepts/items

- **`PL-PORT-01`** (concept home) — multi-account operator UX and portfolio-state maturity.
- **`PL-DEPLOY-BAL`** — records the drop decision and the one-file ordering trap as a deferred finding.
- **Ratified `e6e743b` decision** — "explicit account selection is sole import identity authority."

### 5. Unresolved

- **Identity model.** The handoff's identity-gated multi-select ("unidentified Balances fails closed", "route by content identity") is **unsatisfiable against real Fidelity files**: both Balances and Option Summary exports carry no embedded external account reference (empirically confirmed — refs return null; the account number lives only in the filename). Any future multi-select must therefore honor the ratified selection-as-identity decision (route the selected set into the active account) rather than gate on file-derived identity, OR a new identity source must first exist. This tension must be resolved before implementation.
- Whether "Upload All" is worth building at all given the individual path already works.
- Classification-by-content (parser id) vs selection order for slot assignment; duplicate-role and unrecognized-file handling; fail-closed presentation.

### 6. Explicitly not authorized

No implementation. No second import pipeline. No revival of the failed-session `handleMultiFiles` code. No reopening of the ratified selection-as-identity decision.

### 7. Richer why-state

`docs/journal/project-journal-5.md` (2026-09-21, Option A recovery). Drop decision recorded in the `PL-DEPLOY-BAL` transition record above.

### Reconciliation Completion Record

- **Intake:** `PL-PORT-01-UPLOAD-ALL` (refinement; no new top-level `PL-*` identity).
- **Strategic disposition:** **No new Bet, no `docs/roadmap.md` change.** Import-UX convenience beneath `LVT-INIT-POS-STATE` (Portfolio State) within the existing multi-account direction.
- **Architectural disposition:** **No new AR, no ADR.** UI-composition affordance over the existing account-aware import path; must respect the ratified selection-as-identity decision.
- **Parking-lot disposition/mapping:** **Retained** as refinement `PL-PORT-01-UPLOAD-ALL` under concept home `PL-PORT-01`. Dropped for current recovery by Principal (Option 4); preserved as deferred future UX.
- **Why-state:** `docs/journal/project-journal-5.md` (2026-09-21); `PL-DEPLOY-BAL` transition record.
- **Next authorized mode:** **No work.** Design/decomposition only if separately selected by the Principal, and only after the identity-model tension in §5 is resolved.
---

## `PL-PORT-01-CAPGRAPH` — Portfolio capital-history graph durability / restoration (refinement of `PL-PORT-01`)

**Date:** September 21, 2026 (intake)  
**State:** INTAKE refinement under existing `PL-PORT-01`; RECONCILED (see completion record); no implementation authorized  
**Concept home:** `PL-PORT-01` — Portfolio-State Maturity (capital-history / durable portfolio state)

### 1. What was discovered

The Portfolio capital-history graph (the capital trajectory sparkline derived from `portfolio-capital-history.ts`) is empty after browser `localStorage` was cleared at the start of the September 21 recovery. The capital-history series is persisted **only** in browser localStorage, so clearing storage (or an incognito/private browser) leaves nothing to plot. "Restoring the portfolio graph" is a distinct concern from the Balances parser fix and was not captured during the recovery.

### 2. What triggered it

The Principal cleared localStorage before real-browser acceptance testing (a legitimate clean-slate action that also exercises the fresh-browser path). The trigger (a deliberate storage clear) is distinct from the general concept (whether the capital trajectory is durable authority or disposable client-local state).

### 3. Why it might matter

The capital trajectory is operator-visible portfolio state. If it exists only in one browser, it is lost on storage clear / device change and cannot be reconstructed. This is the concrete instance of the **Incognito invariant** question ("Should this state survive the incognito test?"): if the trajectory is economically meaningful portfolio state, browser-local persistence must not be its only authority; if it is disposable presentation state, its loss on clear is acceptable and no restoration is owed. That classification is unresolved.

### 4. Related concepts/items

- **`PL-PORT-01`** (concept home), specifically the **Durable Brokerage / Fidelity Evidence Persistence** refinement and the **Incognito invariant** recorded in this file.
- **The excluded capital-history attribution problem** — the legacy unattributed global 16-point trajectory with no account provenance. Restoration must NOT re-introduce attribution-by-inference (first account imported, active account, storage location, migration timing); unknown historical evidence remains epistemically unknown until explicitly attributed or retired. This intake does not reopen or authorize that attribution work.
- **Architecture-roadmap AR6** (Durable Decision Context) and **AR1** (durable authoritative state substrate) — the pressure this concern sits under.

### 5. Unresolved

- Is the capital trajectory economically meaningful portfolio state that must survive the incognito test, or disposable presentation state?
- If durable: what authority owns it (backend evidence boundary vs a rebuildable projection from durable imports), and how is it reconstructed for a fresh browser?
- Can the trajectory be re-derived from durably persisted per-account Fidelity evidence rather than stored as its own authority?
- How does restoration interact with the unresolved account-provenance problem for the legacy global series (must not attribute by inference)?
- What is owed after a deliberate storage clear vs a genuine loss/device change?

### 6. Explicitly not authorized

No implementation. No persistence migration or DB schema. No localStorage removal. No backend-service redesign. No capital-history attribution-by-inference. No reopening of the excluded failed-session attribution work.

### 7. Richer why-state

`docs/journal/project-journal-5.md` (2026-09-21, Option A recovery); the `PL-PORT-01` Durable Brokerage Evidence Persistence refinement + Incognito invariant in this file.

### Reconciliation Completion Record

- **Intake:** `PL-PORT-01-CAPGRAPH` (refinement; no new top-level `PL-*` identity).
- **Strategic disposition:** **No new Bet, no `docs/roadmap.md` change.** Trustworthy durable portfolio state beneath `LVT-INIT-POS-STATE` / the existing awareness direction.
- **Architectural disposition:** **No new AR; refines existing AR6/AR1 durable-state pressure and the PL-PORT-01 Durable Persistence refinement.** No architecture change ratified here. Not a `docs/bugs/` defect: clearing client-local storage legitimately clears disposable client-local state per the Incognito invariant carve-out; whether the trajectory should have been durable is a capability/architecture question, not a demonstrated behavior defect.
- **Parking-lot disposition/mapping:** **Retained** as refinement `PL-PORT-01-CAPGRAPH` under concept home `PL-PORT-01`; cross-linked to the Durable Persistence refinement and the excluded attribution problem (referenced, not reopened).
- **Why-state:** `docs/journal/project-journal-5.md` (2026-09-21); Durable Persistence refinement / Incognito invariant.
- **Next authorized mode:** **No work.** Strategic/architectural reconciliation and bounded design only when separately selected by the Principal, and only within the durable-persistence design that owns the Incognito invariant.
---

## `PL-ROADMAP-UI` — Roadmap Operator Surface (Projection of Canonical Strategic/Architecture/Parking-Lot Authority)

**Date:** September 20, 2026
**State:** RECONCILED — canonical identity created; strategic and architectural reconciliation complete; implementation authorized by the Principal (Option A, provisional UX) at SYNC `0d1061699ad32b86c67fb4285a64d94bd69734ef`. The interaction model and visual organization are a first implementation hypothesis, not ratified final UX.
**Trigger:** The Principal cannot see Wheelwright's current future-work landscape without reading multiple Markdown authority files (`docs/roadmap.md`, `docs/architecture-roadmap.md`, and the complete `docs/parking-lot*.md` sequence). A fifth top-level operator tab was requested so the strategic tree, the work/learning hanging from it, and the unresolved project landscape become visually comprehensible — without the visualization corrupting the epistemic or governance distinctions those files encode.

### What was discovered

The repository already distinguishes several kinds of future/project state with different authority:

- The **Lean Value Tree** in `docs/roadmap.md` (Vision → Goals → Bets/Directions → Initiatives/Experiments) is cleanly structured: semantic IDs (`LVT-VISION-*`, `LVT-GOAL-*`, `LVT-BET-*`, `LVT-DIRECTION-*`, `LVT-INIT-*`, `LVT-EXP-*`) with parentage expressed by indentation, one bullet per object.
- The **architecture roadmap** (`docs/architecture-roadmap.md`) records the full set of architectural pressures (the AR series), each with an explicit "Pressure from:" line citing LVT objects (via legacy aliases). AR records pressure, not implementation authorization.
- The **parking lot** (`docs/parking-lot*.md`, one logical backlog across nine physical files) holds 79 `PL-*` items with repository-supported section groupings and dispositions. The primary file is tabular; continuations are prose Reconciliation Completion Records.

Relationships between these three authorities are **sparse and explicit**. Only ~16 distinct LVT objects and a handful of AR pressures are explicitly referenced from parking-lot records. Most `PL-*` items have no explicitly stated LVT parent. Parking-lot row order is explicitly not priority.

### Why it might matter

Making the future-work landscape legible in one operator surface reduces the cost of the recurring question "what remains to be explored, learned, decided, reconciled, or built, and how does it relate to strategy?" It supports the Principal's next-work reasoning without becoming a second roadmap authority.

### Related concepts / items

- `PL-SHELL` — operator topology (Console → Deployment → Production within the shared Application Shell). This item adds a fifth operator surface consistent with that topology; it does not disturb the subordinate `/engineering/*` boundary.
- `PL-META-01` — project-memory / meta concerns (comprehensibility of project state).
- Canonical authorities projected: `docs/roadmap.md`, `docs/architecture-roadmap.md`, complete `docs/parking-lot*.md`.

### What is unresolved (carried forward)

- Whether the provisional interaction model (progressive disclosure, detail panel, view filters) is the right long-term information architecture — subject to Principal inspection of the rendered surface.
- Whether additional explicit relationships should later be curated into authority (this item does not add relationships to the authorities; it only projects those that already exist).
- Whether the projection should eventually be regenerated in the build vs. committed + regenerated by script (v1 uses committed + script, for auditability).

### What is explicitly NOT authorized / NOT done

- No manufactured relationships, priority, sequencing, progress, dates, owners, estimates, or authorization state.
- No mutation of `docs/roadmap.md`, `docs/architecture-roadmap.md`, or existing `docs/parking-lot*.md` item content. The Markdown remains the single authority; the projection is derived and read-only.
- The rendered page is not a competing authority and cannot edit canonical state.

### Where the richer evidence / why-state lives

- This record; the pre-implementation reconciliation report in session history; and the project-journal why-state entry dated 2026-09-20.

---

### Reconciliation Completion Record — `PL-ROADMAP-UI`

**Intake:** `PL-ROADMAP-UI` — Roadmap Operator Surface. New canonical identity in the logical parking lot (continuation 9).

**Strategic disposition (against `docs/roadmap.md`):** No new Bet and no LVT change. This is an operator-facing *projection* of existing Category C strategic authority that makes the LVT and its hanging work visible. It strengthens comprehensibility of the existing strategy rather than introducing a new hypothesis. The surface must not promote Bets into commitments, experiments into features, or exploratory items into roadmap commitments.

**Architectural disposition (against `docs/architecture-roadmap.md`, ADRs, contract):** No AR change, no new engine, and no explicit relationship asserted to any specific AR pressure (this surface projects the AR series; it does not itself hang from one). Introduces one small enabling structure: a build-time derived-data projection boundary. Canonical Markdown remains authoritative; a generator parses it into a version-controlled, read-only `roadmap-projection.json` consumed by the frontend. This respects "persist facts; derive trust," avoids fragile runtime Markdown parsing in the shipped app, and keeps the page a projection, not an authority. Consistent with the accepted operator-shell topology (`PL-SHELL`); does not disturb the `/engineering/*` subordinate boundary. **Ratified constraint (2026-09-20, ADR-018):** the Wheelwright runtime must not contain GitHub credentials and must not depend on GitHub at runtime; repository interaction is build/reconciliation-side. The projection is a build/reconciliation-side derived artifact; regenerating and verifying it is a completion criterion for every major unit of work that materially changes authoritative project state. No runtime GitHub authentication, polling, API calls, or repository retrieval; no repository credential of any kind in the runtime.

**Parking-lot disposition / mapping:** Retained as a new active item; cross-links to `PL-SHELL` and `PL-META-01` for context only (no double-booking; each remains authoritative for its own concern).

**Why-state:** Project journal entry 2026-09-20 (build-time-projection decision and explicit-only-relationship rule). This record is the durable completion record.

**Next authorized mode:** Implementation of v1 (build-time projection + `/app/roadmap` fifth operator tab + first visualization + integrity/routing/UI tests), authorized by the Principal as Option A with provisional UX. Hardening of the interaction model and information architecture awaits Principal inspection of the rendered surface.

### Pipeline state

Explore → Intake (`PL-ROADMAP-UI`) → Reconcile Strategy (done) → Reconcile Architecture (done) → Preserve Why (journal 2026-09-20) → Decompose (v1 implementation) → **Authorized/Implementing (provisional UX)**.


### `PL-ROADMAP-UI` — GIA prior-art reconciliation (2026-09-20)

The Principal directed inspection of the prior GIA implementation (`brooksbol/-kiroj1`) as **prior art, not authority**. Findings and their effect on the authorized Wheelwright design:

**What GIA did.** GIA's "Trust Production Architecture" page (`src/main/resources/static/trust.html`) is described in that repo as an "architectural learning map." It is a single static HTML file with all content hand-authored inline: domain cards with maturity badges (Operationalized / Decided / In Flight / Hypothesized), an "Assumptions Challenged" reclassification table (Candidate Domain → Projection), a "Domains V2 Coverage Analysis" with hand-counted stat cards and dispositions (Mapped / Evolved / Decomposed / Reclassified / Emerging / Gap / Outside Scope), a learning timeline, and a hand-authored JS object (`domainDetails`) driving per-item detail modals (origin / purpose / maturity / why-it-emerged / key question / relationships / next step).

**Information model & intelligence.** GIA's own reference artifacts (`.kiro/specs/_reference/domain-capability-inventory.md`, `architecture-roadmap.md`) are rich, structured Markdown authorities (status tables, invariants, capability-ownership matrix, maturation `Current → Next → Trigger`, open decisions). But the page did **not** derive from them — the knowledge was transcribed by hand into markup. The application-side implementation was therefore "dumb" in the wrong way: hard-coded rather than derived, so its hand-counted coverage numbers can silently drift from the authority.

**Comparison verdict.** The GIA precedent **strengthens** the reconciled Wheelwright direction. Wheelwright's projection is derived from canonical Markdown by a build-time generator, validated by integrity + freshness tests, restricted to explicit-only relationships, and shipped read-only with no runtime GitHub dependency (ADR-018). It preserves exactly the property GIA's page lacked: the visible surface cannot drift from authority without a build-side failure. Wheelwright's UI is "dumb" in the right way — read-only presentation of a validated projection — while the intelligence lives in the generator, not in hand-authored markup.

**Reusable patterns adopted (no GIA semantics imported).** GIA validates two presentation ideas already latent in Wheelwright's own authority:
1. **Status/maturity framing per node** — Wheelwright expresses this through its own vocabulary (LVT type + parking-lot section/disposition), not GIA's domain-maturity ladder.
2. **A "what has been reconciled / closed / learned" dimension.** GIA's reclassification and coverage views make the *resolved* landscape visible, not just open work. Wheelwright already owns this natively in the parking lot's **Graduated / Closed Index** dispositions (Implemented / Promoted / Superseded / Merged / Reframed / Dissolved / Split). The v1 projection parsed only *active* PL items; the one genuine gap GIA highlights is that the surface should also show the reconciled/closed dimension so the Principal can see what has already been decided — using only dispositions the authority actually records.

**Adjustment (within authorized scope, no scope creep).** Extend the projection to also capture Graduated/Closed dispositions and surface them as a lightweight, clearly-separated part of the existing Parking Lot view. No GIA domain concepts, no maturity ladder, no hand-counted stats, no new backend, no runtime dependency. The interaction model remains provisional pending Principal inspection.

**GIA-specific things deliberately NOT imported.** GIA's domain/bounded-context/trust-production semantics, its maturity states, its hard-coded stat counting, and its multi-service topology are prior art only and carry no authority for Wheelwright.


### `PL-ROADMAP-UI` — provisional-UX iteration (2026-09-20)

Following Principal inspection, the surface converged on a single consistent interaction model across all lenses (provisional, not ratified):

- **Uniform tree + details-pane** for every lens (Strategy, Architecture, ADRs, Parking Lot). Each is a collapsible tree on the left with a shared details pane on the right.
- **All trees default fully collapsed**; the operator expands progressively.
- **Fourth lens added — ADRs.** Ratified architecture decisions (`docs/07c-adrs.md`) are now projected as a lens (id / title / status / date / concise context excerpt). The generator extracts ADRs into the derived projection; the full decision text remains canonical in the Markdown. This keeps ADRs a read-only projection consistent with ADR-018 (no runtime GitHub, derived at build time, freshness-verified).
- **In-lens navigation only.** Architecture leaves and detail references are static context within the Architecture lens rather than silently switching the operator to another lens (which had produced a "no way back" dead-end). Cross-lens jumps were removed from the Architecture lens.
- **Resolved landscape** (graduated/closed) remains a collapsed group within the Parking Lot lens.

Projection now derives: LVT (1 vision / 7 goals / 28 bets / 1 direction / initiatives / experiments), 10 AR pressures, 18 ADRs, active PL items, and the graduated/closed resolved landscape — all from canonical authority, explicit-only relationships, freshness-verified. The interaction model remains a first hypothesis pending continued Principal use.


### `PL-ROADMAP-UI` — Priority stack + Coming Soon additions (2026-09-20)

Principal identified two material gaps in the Roadmap surface. Both were added as the smallest coherent projections, preserving the boundary (canonical Markdown → build-time projection → read-only UI; no backend, database, or runtime GitHub) and the anti-scope-creep discipline (no Jira workflow, assignees, sprints, story points, generalized dependencies, or new lifecycle machinery).

**1. Provisional Priority Stack.** New canonical authority `docs/roadmap-priority.md` (Category C) holds a manually/reconciliation-established ranked stack. Semantics: "our current working order of priority, subject to change" — not a schedule or commitment. **Priority is never inferred** from parking-lot order, document order, activity, or implementation status. The exercise has not been performed, so the file ships intentionally empty and the surface honestly reports "no authoritative priority ranking established yet." When populated, each entry may reference an existing `PL-*`/`LVT-*`/`AR*`/`ADR-*` id; the generator fails-closed on any stale reference.

**2. User-facing Coming Soon.** New canonical authority `docs/roadmap-coming-soon.md` (Category C) holds a deliberately curated list of capabilities Wheelwright is willing to communicate to users. Distinct from Priority. **No auto-inclusion**: an item does not appear merely because it is high priority, in the parking lot, in the LVT, or has an ADR. No invented delivery dates (an optional coarse honest status word is allowed). Ships empty; the surface honestly reports "nothing is currently announced as coming soon."

Both are new lenses in the existing tabbed surface. Neither was populated with invented information. Strategic disposition: no new Bet — these are operator/product-communication projections of existing intent. Architectural disposition: conforms to ADR-018 (derived, read-only, freshness-verified); no new AR pressure. Parking-lot mapping: retained under `PL-ROADMAP-UI`. Next authorized mode: populate the two authority files through explicit reconciliation when ready; no implementation change needed to do so.


### `PL-ROADMAP-UI` — enduring-purpose codification (2026-09-20)

The Roadmap's enduring *why* — **"the Roadmap is Wheelwright's self-documenting meta-state; its freshness is a side effect of doing the work"** — is now governed in the Category-A foundation `docs/foundations/roadmap-self-documenting-meta-state.md`, with the ways-of-working freshness invariant in `docs/bootstrap/project-memory-protocol.md` and the architectural boundary in ADR-018. This `PL-ROADMAP-UI` record remains reconciliation provenance only; it is no longer the home of the capability's purpose. The concept is codified independently of the current lens set (Principles / Strategy / Priority / Architecture / ADRs / Parking Lot / Coming Soon), which are its current expressions and may change without invalidating it.


### `PL-ROADMAP-UI` — Log lens intake/reconciliation (2026-09-21)

**Date:** September 21, 2026
**SYNC at reconciliation:** `90098621332539e583c7c715cab5a125153368d2` (remotely verified accepted `main`)
**Method:** `docs/foundations/idea-intake-reconciliation.md`
**Actor:** Kiro (repository-resident implementation/architecture partner), reconciliation only — no implementation authorized by this entry.

**Discovery (Principal observation).** The Roadmap surface lacks a temporal lens the Principal wants: a **Log** exposing, chronologically, *what ideas entered Wheelwright's governed meta-state and what subsequently happened to them*. Approximate intent: "look at the Roadmap and see, chronologically, what ideas entered Wheelwright's thinking and what subsequently happened to them." Explicitly **not** a Git commit log, a dev-activity feed, a full rendering of the Project Journal, a second manually maintained backlog, a second source of authority, or a Jira-style workflow/event system. Candidate semantic unit: **intake and its subsequent governed disposition**.

**Identity determination (verified against repository authority, not assumed).** This is a **refinement of the existing `PL-ROADMAP-UI` capability**, not a new canonical identity. Grounds: (a) the enduring purpose already codified in `foundations/roadmap-self-documenting-meta-state.md` explicitly says the lens set (Principles / Strategy / Priority / Architecture / ADRs / Parking Lot / Coming Soon) is *today's* expression and "any of them may be redesigned or removed — or added — without invalidating this concept"; (b) a chronological projection of governed intake/disposition is another lens over the same canonical authority `PL-ROADMAP-UI` already projects (the parking-lot sequence), under the same ADR-018 build-time boundary; (c) a repository sweep found **no existing PL-\* item contemplating an intake chronology / timeline lens** and **no prior `roadmap-log.md` or Log design**. (`PL-PROD-EVENTS` is an unrelated *economic* event ledger for a trading month, not project meta-state.) The ChatGPT suspicion that this belongs under `PL-ROADMAP-UI` is **confirmed**.

**What exact question the Log should answer (Q1).** For a governed idea: *when did it enter Wheelwright's thinking, under what canonical `PL-*` identity, what triggered it, and what has since happened to it (strategic reconciliation → architectural reconciliation → decomposition/authorization/disposition), with a pointer to richer why-state?* It is the operator-facing chronology of **governed intake/reconciliation events**, distinct from (and pointing back into) the richer Project Journal.

**Strategic disposition (against `docs/roadmap.md`).** **No new Bet and no LVT change.** The Log is an operator-facing *projection* of existing Category-C project-state authority (the parking-lot sequence) that strengthens comprehensibility of the self-documenting meta-state. It introduces no new strategic hypothesis. It must not promote intake into commitment, or manufacture priority/sequencing (that remains the separate Priority lens authority).

**Architectural disposition (against `docs/architecture-roadmap.md`, ADRs, foundations).** **No AR change, no new engine, wholly within the existing ADR-018 build-time projection boundary (Q8 = yes).** A Log lens would be one more read-only projection derived by `scripts/generate-roadmap-projection.mjs` from canonical Markdown, shipped as `roadmap-projection.json`, freshness-verified in CI — no runtime GitHub, no credentials, no new backend, no new authority. It fits the existing schema pattern; it does **not** fit the current schema *as-is* (Q4): the `PlItem` type and `parseParkingLotFile` capture **no date and no lifecycle transition**. Representing the Log cleanly would require the projection to additionally capture, *explicit-only*, per-item intake date, state, and any dated disposition/remediation transitions the canonical records already state.

**Authority gap — the load-bearing finding (Q2/Q3/Q5).** The Log is only as truthful as the temporal facts canonical authority *explicitly* records, and today those facts are **structurally uneven**:

- **Prose continuation records (`parking-lot-3.md` … `-9.md`)** — mostly reconciliation-era items — carry a structured `**Date:**` line and a `**State:**` line, frequently a `**SYNC at reconciliation:**`, and sometimes explicit dated transition notes (e.g. `**remediation closure appended 2026-09-09**`). For these, an **intake date + current state + selected dated transitions are explicit and projectable without inference.**
- **The primary `docs/parking-lot.md` table rows** (the older, foundational `PL-*` population — `PL-ARCH-06`, `PL-DEPLOY`, `PL-PORT-01/02`, `PL-EVID-*`, `PL-PROD-*`, etc.) carry **no intake-date column and no state column.** Dates appear only inconsistently, embedded free-text inside the Summary cell ("Aug 26", "August 21, 2026", "2026-09-04"), and where present they usually mark a *resolution/refinement* event, **not the original intake**. The **Graduated/Closed Index** carries disposition + destination but **no dates**.

**Consequence:** a chronology built today would be **complete and trustworthy for the reconciliation-era prose items and missing/partial for the older primary-table items.** Per the Roadmap's explicit-only rule, those gaps must render as **missing/unknown**, never as inferred dates or reconstructed transitions. This is a genuine authority gap, but it is **not a blocker** to a truthful Log — a Log that honestly shows "intake date: not recorded" for early items is faithful; it is only a blocker to a *complete* Log. Closing the gap (backfilling explicit intake dates into the primary table) is optional, separate reconciliation work — **not** a prerequisite, and must not be done speculatively.

**Journal vs Log distinction (preserved, Q per prompt).** The **Project Journal** remains rich chronological why-state / intellectual history (Category C, append-only, not authority). The **Log** is a compact operator-facing chronology of *governed intake/reconciliation events* projected from the parking-lot sequence, with references back into the Journal for richer why-state. The architecture does **not** say they are the same, and no evidence was found to collapse them. The Log projects the parking lot's temporal facts; it does not render the Journal.

**New strategic Bet? (Q6):** No. **New/refined architecture-roadmap pressure? (Q7):** No new AR; at most it *reinforces* the existing ADR-018 boundary and the projection-schema pattern. No `architecture-roadmap.md` change warranted.

**Smallest coherent implementation unit if authorized (Q9).** A **read-only "Log" lens** added to the existing Roadmap surface, fed by an *explicit-only* temporal extension of the existing projection:

1. Extend `parseParkingLotFile` (and the prose-record path) to capture, when — and only when — the canonical text states them: `intakeDate`, `state`, and a list of dated transition notes already present in the record (e.g. remediation-closure dates, "amended same day"). No date is inferred; absence → `null`.
2. Add a `LogEntry`/temporal shape to `roadmap-projection-types.ts` and emit a chronologically **sorted-where-dated** projection; undated items surface in a clearly separated "intake date not recorded" group rather than being given a fabricated position.
3. Add a `"log"` lens to `RoadmapView.tsx` rendering entry → `PL-*` identity → concise concept → trigger (when recorded) → state/disposition → journal/why-state reference, read-only.
4. Extend the projection-integrity Vitest suite: explicit-only temporal facts, no inferred dates, undated items represented as unknown, freshness verified.

No backend, no database, no runtime GitHub, no new authority file, no manufactured dates/transitions, no priority/sequencing semantics.

### Reconciliation Completion Record — `PL-ROADMAP-UI` Log lens

**Intake:** Refinement of existing `PL-ROADMAP-UI` (Roadmap Operator Surface). **No new `PL-*` identity created** (verified: no existing/absent identity contemplates an intake chronology; the enduring-purpose foundation explicitly admits new lenses).

**Strategic disposition:** No new Bet, no LVT change. Operator-facing projection strengthening comprehensibility of existing Category-C project-state authority.

**Architectural disposition:** No AR change, no new engine, wholly within the ADR-018 build-time projection boundary. Requires an explicit-only temporal extension of the existing projection schema (currently the schema captures no dates/transitions). Reinforces the existing boundary; creates no new pressure.

**Parking-lot disposition / mapping:** Retained under `PL-ROADMAP-UI`. Distinct from `PL-PROD-EVENTS` (economic ledger, not meta-state). Journal and Log kept distinct.

**Why-state:** Journal entry `docs/journal/project-journal-5.md` (2026-09-21) records the authority-gap finding (uneven temporal-fact coverage between prose continuation records and primary-table rows) so a future actor does not re-derive it. This record is the durable completion record.

**Next authorized mode:** **No implementation authorized.** Reconciliation complete; the smallest coherent implementation unit above is ready for the Principal to authorize (or decline). If authorized, implementation should stop at explicit-only temporal facts and represent all gaps as unknown.

### Pipeline state

Explore → Intake (existing `PL-ROADMAP-UI`) → Reconcile Strategy (done) → Reconcile Architecture (done) → Preserve Why (journal 2026-09-21) → Decompose (smallest unit identified) → **Awaiting Principal authorization (NOT implemented).**

---

## `PL-ARCH-07` — Authorization Platform / COTS RBAC-FGA Evaluation (Build-vs-Buy)

**Date:** September 21, 2026
**State:** INTAKE — new canonical identity created; Principal-authorized as an intake/research-and-design concern. No vendor selected, no authorization/RBAC/FGA/authentication implemented, no multi-Operator implementation work opened.
**SYNC at intake:** `90098621332539e583c7c715cab5a125153368d2` (remotely verified accepted `main`)
**Method:** `docs/foundations/idea-intake-reconciliation.md`
**Concept home:** `PL-ARCH-03` (Security and User Accounts) — `PL-ARCH-07` **informs** `PL-ARCH-03`; it is not a child of cloud deployment.
**Actor:** Kiro (repository-resident architecture partner), intake only — no implementation authorized by this record.

### Required Intake Record

**1. What was discovered?**
The multi-Operator migration-safety analysis (SYNC `9009862`) established that Wheelwright will eventually need an *authorization* layer (identity resolution, authentication, authorization/ownership enforcement, persistence isolation) to support multiple Operators, and that this layer is the genuinely deferred infrastructure distinct from the cheap now-seam (the Operator-ownership invariant). A separable, prior question therefore exists: **when that authorization layer is eventually built, should Wheelwright build RBAC / fine-grained authorization (FGA) itself, or adopt a commercial/off-the-shelf (COTS) authorization platform?** This is a **research-and-design (build-vs-buy) evaluation**, not an implementation. It is deliberately isolated as its own concern so the evaluation can proceed and inform `PL-ARCH-03` without waiting on multi-Operator implementation or cloud deployment.

**2. What triggered it?**
The migration-safety analysis's finding that auth/authorization is the expensive, safely-deferrable half of multi-Operator support (in contrast to the cheap, unrecoverable-if-deferred ownership invariant). The evaluation is the natural place to resolve *how* that eventual authorization capability should be provided (RBAC vs FGA model; build vs buy) before `PL-ARCH-03` implementation commits to a shape. Triggering example (external context, not a prerequisite): mature COTS authorization/FGA platforms exist; whether one fits Wheelwright's evidence-appliance posture, credential-custody discipline, and no-runtime-GitHub boundary (ADR-018) is an open design question. *(Evidence-gap flag: specific vendors/capabilities are external and not asserted here; vendor comparison is future evaluation work, not established repository fact.)*

**3. Why might it matter?**
The authorization model materially shapes `PL-ARCH-03`: an RBAC-vs-FGA choice and a build-vs-buy choice determine the ownership-enforcement mechanism, the persistence-isolation strategy, the deployment/credential surface, and the operational burden Wheelwright takes on. Resolving it as research/design *before* `PL-ARCH-03` implementation prevents that implementation from either inventing a bespoke authorization system by default or being blocked while the question is reopened. It also protects the "complexity must be earned" discipline: the evaluation may conclude that the simplest sufficient mechanism (or deferral) is correct.

**4. What existing concepts/items are related?**
- **`PL-ARCH-03` (Security and User Accounts)** — `PL-ARCH-07` **informs** this item. `PL-ARCH-03` owns the eventual identity/sessions/ownership-enforcement implementation; `PL-ARCH-07` supplies the authorization-model / build-vs-buy decision that shapes it.
- **`PL-PORT-01` (Portfolio-State Maturity)** — must **preserve the authorization seam** (the Operator-ownership invariant / owner-stamping identified in the migration-safety analysis) but is **NOT blocked** by COTS authorization selection or by multi-Operator implementation. Multi-BrokerageAccount work may proceed on the ownership foundation independently of `PL-ARCH-07`.
- **`PL-OPS-01` (Cloud Deployment)** — **relevant deployment context only, NOT a prerequisite.** Researching and designing the authorization model / build-vs-buy decision does not require cloud deployment. `PL-ARCH-03` *implementation* may ultimately depend on `PL-OPS-01` for real remote/multi-Operator runtime use; `PL-ARCH-07` (research/design) does not.
- **AR10 (architecture-roadmap — Access Is a Cross-Cutting Client/Operator Property)** — existing architectural pressure this evaluation serves; no new AR required.
- **ADR-018 (No Runtime GitHub Dependency)** — any COTS/authorization option must respect the runtime-credential and no-runtime-GitHub boundary; a candidate that violates it is disqualified on architecture grounds.
- **Credential-custody discipline** (`TRADIER_API_KEY` custody; development-workflow steering) — an authorization platform must not weaken credential custody.

**5. What is unresolved?**
- RBAC vs FGA (relationship-/attribute-based) as the authorization model for Wheelwright's ownership boundaries.
- Build vs buy: whether a COTS authorization platform is warranted, or whether the simplest sufficient in-house mechanism (or continued deferral) is correct.
- Evaluation criteria/weighting (fit to the Operator-ownership invariant, deployment/credential surface, operational burden, offline/local-first posture, cost, lock-in, ADR-018 compatibility).
- How an eventual choice maps onto the ownership seam that `PL-PORT-01` preserves.
- Whether any authorization decision is needed at all before a second Operator actually exists.

**6. What is explicitly NOT authorized yet?**
- No vendor selection.
- No implementation of RBAC, FGA, authentication, authorization, sessions, or identity.
- No expansion into multi-Operator implementation work.
- No cloud/deployment change.
- No new dependency, credential, or runtime integration.
- Intake does not authorize implementation (intake invariant 6).

**7. Where is the richer evidence/why-state?**
Migration-safety analysis (SYNC `9009862`) and the prior operator/brokerage-account architectural review (SYNC `37dd918`) — session artifacts referenced from the journal. Why-state entry: `docs/journal/project-journal-5.md` (2026-09-21, `PL-ARCH-07` intake). **COTS authorization investigation evidence (RBAC/ABAC/ReBAC/FGA models; Cerbos / OpenFGA / WorkOS / Permit.io / Auth0 FGA and further candidates; Render/topology/datastore/latency/audit/economics findings; build-vs-buy; owned-identity seams; open questions; external sources) is preserved with full epistemic labeling in `docs/57-cots-authorization-investigation-2026-09-21.md`** (reconciled 2026-09-21; no vendor selected, no implementation authorized).

### Reconciliation Completion Record — `PL-ARCH-07`

- **Intake:** `PL-ARCH-07` — Authorization Platform / COTS RBAC-FGA Evaluation (Build-vs-Buy). New canonical identity (verified: no existing `PL-*` owns the authorization-model / build-vs-buy evaluation; `PL-ARCH-03` owns the *user-accounts implementation*, not the build-vs-buy question).
- **Strategic disposition:** **No new Bet, no `docs/roadmap.md` change.** Enabling-infrastructure evaluation beneath the already-accepted operator/access direction (AR10); it resolves *how* an eventual authorization capability is provided, not *whether* a new outcome is pursued.
- **Architectural disposition:** **No new AR, no ADR yet.** Reinforces AR10 and must respect ADR-018 and credential custody. An ADR may become warranted **only** when a build-vs-buy / RBAC-vs-FGA direction is actually chosen; this intake does not create one.
- **Parking-lot disposition/mapping:** **Retained** as new `PL-ARCH-07` under concept home `PL-ARCH-03`. Cross-links: **informs** `PL-ARCH-03`; **seam-preserving but non-blocking** for `PL-PORT-01`; **deployment-context-only** reference to `PL-OPS-01` (explicitly not a prerequisite). No double-booking.
- **Why-state:** `docs/journal/project-journal-5.md` (2026-09-21, `PL-ARCH-07` intake).
- **Next authorized mode:** **Research / design only when separately selected by the Principal.** No vendor selection, no implementation, no multi-Operator work authorized by this record.

### Dependency wording (authoritative for this item)

- `PL-ARCH-07` **informs** `PL-ARCH-03`.
- `PL-ARCH-03` *implementation* may ultimately **depend on** `PL-OPS-01` for real remote/multi-Operator runtime use.
- `PL-ARCH-07` is **NOT** enabled-by or dependent-on `PL-OPS-01`; researching/designing the authorization model / COTS build-vs-buy decision does not require cloud deployment. `PL-OPS-01` is referenced only as relevant deployment context.
- `PL-PORT-01` **preserves the authorization seam** (Operator-ownership invariant) and is **NOT blocked** by COTS authorization selection or by multi-Operator implementation.

### Pipeline state

Explore → **Intake (`PL-ARCH-07`, created)** → Reconcile Strategy (no roadmap change) → Reconcile Architecture (no AR/ADR yet; respects ADR-018) → Preserve Why (journal 2026-09-21) → Decompose (deferred) → **Awaiting Principal selection to begin research/design (NOT implemented).**


### `PL-ROADMAP-UI` — Log lens implemented (2026-09-21)

**Date:** September 21, 2026
**SYNC at implementation:** `90098621332539e583c7c715cab5a125153368d2` (remotely verified accepted `main`)
**State:** IMPLEMENTED (uncommitted working tree) — Principal-authorized (Option A, smallest coherent unit). Awaiting Principal operator-surface acceptance before commit.

The Log lens reconciled above (2026-09-21 Log lens intake/reconciliation) was implemented as the smallest coherent capability. It answers: *what entered Wheelwright's governed thinking, when did it enter, and what governed disposition followed?*

**What shipped (build-time projection → read-only UI; wholly within ADR-018):**
- **Projection schema:** new `LogEntry` type + `log: LogEntry[]` section + `counts.logTotal` / `counts.plWithoutLogEvent` in `src/roadmap/roadmap-projection-types.ts`. Deliberately a **separate** section: `PlItem` is unchanged, preserving the existing explicit-only invariant that parking-lot items carry no date field.
- **Parser/generator:** `parseLogEvents` + `parseLeadingIsoDate` in `scripts/roadmap-projection-parsers.mjs`; wired into `scripts/generate-roadmap-projection.mjs` with fail-closed integrity checks and a deterministic chronological sort. The projection JSON was regenerated and the ADR-018 freshness `--check` passes.
- **UI:** `src/roadmap/LogView.tsx`, a compact single-column chronological timeline, added as a first-class `Log` lens in `RoadmapView.tsx` alongside the existing lenses; styles in `roadmap.css`.

**Explicit-only semantics (no inference):** one Log event per parking-lot record that states an explicit `**Date:**`. Captured verbatim: `plId` (from the heading, or null when the heading names none), `title`, `dateText`, `state` (`**State:**` / `**Reconciliation state:**`, or null), and any inline dated transition clause. `isoDate` (parsed leading `Month D, YYYY`) is used only for deterministic ordering, never displayed as authority. No date is inferred from row order, file order, Git history, journal proximity, or prose; no lifecycle transition is manufactured.

**Honest historical gap (as reconciled):** dated records live in the prose continuation files, so the Log currently shows **28 dated governed events**. The **43 of 60** parking-lot items with no explicit dated record (chiefly the primary `parking-lot.md` table rows) are **not** shown as events; the lens states this gap plainly ("Date not recorded") rather than backfilling. No historical intake-date backfill was performed (out of scope).

**Journal ≠ Log preserved:** the Log is the compact chronology of governed intake/reconciliation events; the Project Journal remains the richer why-state. The lens points back to canonical/journal material rather than reproducing it.

**Implementation discoveries (no new authority pressure):**
- A single `PL-*` identity legitimately accrues **multiple** dated records over time (e.g. `PL-STRAT-01`, `PL-DEPLOY` refinements). The Log intentionally shows each dated record as its own event — this is the chronology the lens exists to expose, not a dedup defect.
- Two dated records name no `PL-*` in their heading (the Java Test-Suite performance entries) and two state no `**State:**` line; both are shown honestly (`(no id)` / no state tag) rather than fabricated. These are pre-existing authoring shapes, not defects introduced here; **no** authority edit was made to "fix" them (would exceed this authorization).

**Verification:** full frontend suite 1898/1898 pass (roadmap suite 117); `tsc -b && vite build` clean; ADR-018 projection freshness `--check` in sync; lint clean for changed files. Operator surface served at `/app/roadmap` (HTTP 200) and the rendered Log chronology + gap treatment were inspected.

**Next authorized mode:** Principal operator-surface acceptance → commit + push to `main` per the Principal git workflow. Not committed; the interaction/visual model remains provisional pending Principal inspection, consistent with the rest of `PL-ROADMAP-UI`.


### `PL-ROADMAP-UI` — Log lens corrected after Codex review (2026-09-21)

**Date:** September 21, 2026
**SYNC at correction:** `6a99217ec8a107b333519dd60ceadd4c919b7862` (remotely verified accepted `main`)
**State:** IMPLEMENTED (uncommitted working tree) — corrected per independent Codex review; awaiting a second independent re-review, then Principal operator-surface acceptance before commit.

Codex independently reviewed the first implementation (above) and returned **NOT READY**. The findings were correct and are now corrected in place (no restart; the projection→UI structure held). This record supersedes the specific overclaims in the "Log lens implemented (2026-09-21)" record above where they conflict; that record is preserved as provenance of the first pass.

**Corrections made:**

1. **Dropped `###` records fixed (Blocking 1).** The parser recognized temporal records only at `##` boundaries, so explicitly dated `###` records were swallowed into their parent block. The corpus has **30** explicit `**Date:**` records; the first pass emitted **28** (the two nested `PL-ROADMAP-UI` Log records — this intake/reconciliation record's ancestor and the implementation record — were dropped). The parser is now **depth-aware**: a heading stack attributes each `**Date:**` to its nearest enclosing heading and closes a block at the next equal-or-shallower heading, so a dated `##` record and a dated nested `###` sub-record are **both** emitted, while an *undated* `###` subsection (e.g. `### Intake`, `### Pipeline state`) is **not**. The rule is semantic and explicit-only: *a heading block that states its own `**Date:**` is an event, regardless of depth.* Result: **30 events**. A corpus-reconciliation test independently recounts dated records from the Markdown and requires the projection to match exactly (no drop, no duplicate).

2. **Intake-date vs event-date separated (Blocking 2).** The earlier `plWithoutLogEvent` metric conflated "has any dated event" with "has a known intake date," and the UI claimed "43 of 60 … have no dated intake record" — which the implementation could not prove. Now each event carries an explicit **event kind** (`intake` / `reconciliation` / `refinement` / `implementation` / `remediation` / `unclassified`) derived only from what authority states (state leading word + heading form; a "Refinement" heading is never a new-identity intake even when its state reads "INTAKE refinement"). An identity's **original intake date is known only when an `intake`-kind event exists for it**; a later reconciliation/refinement/implementation event never establishes it. The projection now exposes `intakeDateUnknown` — the actual **53 of 60** active `PL-*` identities with no intake-kind event — and the UI lists them by identity under **"Intake date not recorded,"** rather than a misleading aggregate. Concretely, `PL-ROADMAP-UI` itself has dated reconciliation + implementation events but no intake event, so it correctly appears as intake-date-unknown.

3. **Fail-closed calendar validation.** Dates are now validated as real calendar dates (`parseLeadingCalendarDate`, with a leap-year check). Impossible dates (`February 31`, `September 31`, `February 29` in a non-leap year, unknown month) cause the generator to **exit non-zero with a visible integrity failure** rather than being silently normalized or sorted last. Verified end-to-end. Tests cover valid and impossible dates.

4. **State classification hardened.** `stateKind`'s substring scan (which could misread "not closed"/"not implemented") is replaced: a normalized badge is applied only for an **exact recognized leading token**; otherwise the **verbatim** `**State:**` text is shown with no badge. State is never overstated.

5. **`transitions[]` removed.** The earlier field scraped bolded year-containing clauses from the `**Date:**` line. With explicit event kinds, a lifecycle transition that has its own dated record is now its own event; no prose is scraped. Simpler and truthful.

6. **Why-state wording corrected.** The UI no longer claims a why-state link it does not provide. `sourceFile` is labeled provenance (which physical page), not a why-state reference. Journal (rich why-state) and Log (compact governed temporal-event chronology) remain distinct.

**Corrected schema.** `LogEntry { plId | null, title, eventKind, eventDateText, eventDateIso (validated), state | null, headingLevel, sourceFile }`; projection adds `intakeDateUnknown: string[]`; `PlItem` remains dateless (temporal facts live only in the Log). Counts: `logIntakeEvents` = 8, `plWithoutIntakeDate` = 53. The corpus had **30** dated records at the moment the parser fix was verified; **this correction record is itself a dated governed record (an implementation-kind event)**, so once it lands the Log self-consistently shows **31** events. The count is derived from authority, not asserted — the corpus-reconciliation test recomputes it from the Markdown, so it tracks the corpus automatically.

**Verification (corrected).** Roadmap suite 132 pass; full frontend suite **1913/1913**; `tsc -b && vite build` clean; ADR-018 freshness `--check` in sync; lint clean for changed files; `git diff --check` clean. Operator surface rendered and inspected: 30 chronological events with explicit kinds, exact-token-only state badges, honest `no PL-id`/`no explicit state` rows, and the named 53-identity "Intake date not recorded" group (including `PL-ROADMAP-UI`).

**Scope discipline.** No historical intake-date backfill; no authority edits to normalize the two id-less / stateless records; no new Bet; no new architecture-roadmap pressure; wholly within ADR-018 (build-time projection → read-only UI; no runtime GitHub/credentials/backend). The unrelated staged `PL-ARCH-07` working-tree changes were left untouched.

**Next authorized mode.** Second independent re-review → Principal operator-surface acceptance → commit + push to `main`. Not committed. SYNC provenance: the first pass cited `90098621…`; this correction was performed against the current accepted `main` `6a99217…`.


### `PL-ROADMAP-UI` — Log lens final bounded correction after second Codex review (2026-09-21)

**Date:** September 21, 2026
**SYNC at correction:** `1a9eafa24e6963a4266d752038fc7e6fe13fcdb9` (remotely verified accepted `main`)
**State:** IMPLEMENTED (uncommitted working tree) — final bounded correction pass; awaiting one constrained Codex verification against the frozen acceptance invariants, then Principal operator-surface acceptance before commit.

The **second** Codex review of the Log candidate identified a further finite defect set. This is the final bounded implementation pass; it supersedes the specific overclaims of the earlier correction record where they conflict, and preserves the earlier records as provenance of the failed passes (the process was iterative and is not being smoothed over).

**Corrections made (this pass):**

1. **Event classification separated from intake evidence (principal fix).** `eventKind` is now presentation-only and no longer determines intake knowledge. A new independent, explicit `establishesIntake` flag is derived per record from narrow canonical signals: (a) the `**Date:**` line marks the date as intake — `… (intake)`; or (b) the state line states the record created the identity — "canonical identity created" / "new canonical identity" (the negative "no new `PL-*` identity created" is excluded). The bare word "INTAKE" is **not** sufficient. Worked cases: `PL-DEPLOY-02-DEF01` is a **remediation** event that **also establishes intake** (its date says `(intake)`); `PL-ROADMAP-UI`'s `##` record is a **reconciliation** event that **establishes intake** ("RECONCILED — canonical identity created"), while its later implementation events do **not**; an `INTAKE refinement` (`PL-OPS-01`) does **not** establish intake.

2. **Known/unknown intake recomputed from explicit evidence, derived (not hardcoded).** `intakeDateUnknown` now lists active identities with **no** record carrying explicit intake evidence. The result — **9 identities with a recorded intake date, 51 without** — is computed from authority. All nine identities Codex named as having explicit intake evidence (`PL-OPS-08`, `PL-OPS-09`, `PL-MKT`, `PL-DEPLOY-EXPORT`, `PL-RECIPE-01`, `PL-ACTOR-01`, `PL-ARCH-07`, `PL-DEPLOY-02-DEF01`, `PL-ROADMAP-UI`) are reproduced as known; they are used as falsification cases in tests, not as the algorithm.

3. **Heading attribution made genuinely depth-generic.** The parser stack now handles heading depths **2–6** with the general rule (a temporal field belongs to its nearest enclosing heading; scope ends at the next equal-or-shallower heading), rather than special-casing `##`/`###`. A dated `####` record is attributed to itself, not its parent.

4. **True source order preserved.** Each event records a monotonic global `sourceOrder` (file order, then line order), used as the same-date tie-break so a parent precedes its nested child and adjacent records keep their order. It is internal ordering metadata and is never rendered.

5. **Event-kind substring leak removed.** Classification uses only the exact leading state token or heading form. `"V1 NOT IMPLEMENTED — pending"` no longer becomes `implementation`; it is `unclassified`. (`PL-ELIG` now renders as a neutral "Event", not "Implementation".) Prefer `unclassified` over guessing.

6. **Corpus verification strengthened to an identity/evidence oracle.** The corpus test no longer compares counts only (which could pass with one missing + one extra). An independent oracle — which does **not** import `parseLogEvents` — re-derives the canonical temporal records keyed by `sourceFile :: heading title :: authored date` and asserts exact set equality with the projected events, proving every qualifying record maps to exactly one event, no extras, nested records included, ordering preserved.

7. **Intake evidence independently tested.** Tests assert the intake/kind separation directly (remediation-that-establishes-intake, reconciliation-that-creates-identity, INTAKE-refinement-that-does-not, later-implementation-that-does-not, no-evidence-stays-unknown) with truth defined from authority, not from whatever the generator classified.

**Corrected schema.** `LogEntry { plId|null, title, eventKind, establishesIntake, eventDateText, eventDateIso (validated real date), state|null, headingLevel (2–6), sourceFile, sourceOrder }`; projection `intakeDateUnknown: string[]`; counts `logIntakeEvidenceEvents`, `plWithIntakeDate` (9), `plWithoutIntakeDate` (51). `PlItem` remains dateless.

**Event count note.** At the moment this pass was verified the corpus held **31** dated governed records. **This correction record is itself a dated `###` record (an implementation-kind event that does not establish intake)**, so once it lands the Log self-consistently shows **32** events. The count is derived and asserted by the corpus oracle, not hand-maintained.

**Verification (this pass).** Roadmap suite 149 pass; full frontend suite **1930/1930**; `tsc -b && vite build` clean; ADR-018 freshness `--check` in sync; lint clean for changed files; `git diff --check` clean. Fail-closed calendar validation reconfirmed. Operator surface rendered and inspected (text render; the environment cannot produce a screenshot): 31 chronological events, explicit kinds, per-row "establishes intake" flags independent of kind (incl. the DEF01 remediation record and the PL-ROADMAP-UI reconciliation record), `PL-ELIG` as neutral Event, and the named 51-identity "Intake date not recorded" group (excluding `PL-ROADMAP-UI`).

**Scope discipline.** No historical intake-date backfill; no authority edits to normalize heterogeneous records; no new Bet; no new architecture-roadmap pressure; wholly within ADR-018. Unrelated committed work (`PL-ARCH-07`, `PL-PORT-01`) untouched.

**Next authorized mode.** One constrained Codex verification against the eight frozen acceptance invariants → Principal operator-surface acceptance → commit + push. Not committed.


### `PL-ROADMAP-UI` — Log lens Principal UX acceptance (2026-09-21)

Two Principal acceptance findings applied during operator testing; **display-only**, no change to frozen temporal/intake semantics (still 32 events, 9 intake-known, 51 unknown; projection order and the corpus oracle unchanged):

1. **Newest-first display order.** The Log list renders event date **descending** (newest first). This is display ordering only; the projection's canonical order remains ascending date, then true `sourceOrder`. Within a same-date group, canonical source order is preserved (the day is not internally reversed).
2. **Master/detail interaction.** Log rows are selectable; the selected event's full detail (title, event date, `PL-*` identity or explicit missing-id, event kind, verbatim governed state or explicit missing-state, whether it establishes intake, source/provenance) renders in the previously-unused right pane, reusing the shared Roadmap tree+detail pattern. The newest event is selected by default. No modal, route, or new architecture.

Earlier descriptions of the Log as a "single-column chronological timeline" are superseded by this master/detail presentation. This was Principal-accepted operator behavior; no further Codex review was required for these two display changes. This note carries no `**Date:**` line and is therefore not itself a Log event.


### `PL-ROADMAP-UI` — Log lens Principal acceptance recorded (2026-09-21)

**Principal operator-acceptance testing PASSED** for the Roadmap Log UX corrections. The two acceptance findings are confirmed satisfied:

1. The Log displays newest events first while preserving deterministic canonical source order within the same date.
2. Log rows are selectable/clickable and populate the existing right-hand detail pane.

The Log lens implementation is on `main` (feat commit `6873015`, on top of accepted `main` at closeout SYNC `3570933`). This entry is the durable acceptance record; no Log design, semantics, implementation, testing, or Codex review is reopened, and no new identity/Bet/initiative/architecture item is created. Frozen semantics remain: 32 governed temporal events; intake partition 9 known / 51 unknown. This note carries no `**Date:**` line and is therefore not itself a Log event.


### `PL-PORT-01` — Durable Brokerage / Fidelity Evidence Persistence intake refinement

**Date:** September 21, 2026  
**State:** INTAKE refinement under existing `PL-PORT-01`; not reconciled; no implementation authorized

#### What was discovered

During Principal operator acceptance of multi-BrokerageAccount support, the Principal identified a separate architectural concern:

> Much of the Fidelity / brokerage portfolio information is currently stored only in the frontend/browser.

The multi-account work makes browser-local state account-safe, but account-safe frontend persistence is not the same as durable portfolio authority. If economically important brokerage evidence and derived portfolio state exist only in one browser, Wheelwright is exposed to browser/device loss, storage eviction/corruption, poor portability across machines, and an architectural boundary in which backend/server-side capabilities cannot reliably consume the current brokerage state.

This concern crossed the durability threshold because losing it would force meaningful rediscovery during later portfolio-state or agent architecture work.

#### Trigger vs broader concept

The trigger was the current Fidelity multi-account implementation and operator acceptance. The broader concern is not “replace localStorage” mechanically. It is to determine the correct durable ownership and persistence boundary for brokerage evidence and portfolio state.

A future reconciliation/design pass should inventory and classify, at minimum:

- raw imported Fidelity evidence and provenance;
- BrokerageAccount / external broker identity facts;
- normalized PortfolioSnapshots;
- balances, holdings, positions, inventory, and activity;
- capital-history and outlook observations;
- PendingIntent / WriteIntent state;
- Production lifecycle evidence;
- other account-local derived state;
- genuinely operator-local UI state;
- rebuildable/derived state versus evidence that must be durably preserved.

The future design must preserve the already-ratified separation among account-local financial evidence/state, global/shared market evidence, global strategy/policy defaults, and operator/UI-local state.

#### Why it might matter

Durable brokerage state is a prerequisite for trustworthy continuity across browser/device boundaries and is likely enabling infrastructure for future server-side recommendation / AI-agent capabilities. A recommendation agent should not depend on whichever browser happens to contain the latest Fidelity CSV-derived state.

#### Canonical mapping

**Retained as a refinement of `PL-PORT-01` (Portfolio-State Maturity).** No new `PL-*` identity is created at intake.

Related architecture may include the existing backend evidence-service boundary, but this intake does not assert that the current backend evidence service is the correct home for all brokerage state and does not authorize simply moving frontend objects into a database.

#### Unresolved

- Which brokerage facts/evidence are authoritative and must be persisted durably?
- Which normalized/derived views should be rebuildable rather than stored as authority?
- What backend boundary should own durable account-local brokerage evidence?
- What migration/provenance guarantees are required for existing browser-local state?
- What remains legitimately frontend/operator-local?
- How should durable account state be exposed to future server-side recommendation/agent capabilities without collapsing existing evidence/provenance boundaries?

#### Additional operating invariant — incognito reconstruction

The Principal identified a simple acceptance test for the durable brokerage-state boundary:

> **Incognito invariant:** A fresh browser with no Wheelwright client persistence must be able to reconstruct economically meaningful BrokerageAccount state from durable authority. Loss of client storage may reset presentation preferences, but must not destroy financial evidence, account identity, provenance, history, or durable workflow state.

This is a boundary test, not a requirement that all frontend state move to the backend. Disposable operator/UI state such as active-account selection, expanded panels, sorting, and similar presentation preferences may legitimately remain client-local. But if clearing browser storage or opening Wheelwright in an incognito/private browser destroys or materially changes Wheelwright's durable understanding of a BrokerageAccount, that state is evidence that the frontend is acting as an inappropriate durable authority.

A useful design question for future persistence work is therefore:

> **Should this state survive the incognito test?**

If yes, browser-local persistence must not be its only authority.

#### Explicitly not authorized

- No persistence migration.
- No database/schema implementation.
- No localStorage removal or cleanup.
- No backend-service redesign.
- No AI-agent implementation.
- No reopening of current PL-PORT-01 stabilization/operator acceptance.

#### Next authorized mode

**Future strategic/architectural reconciliation and bounded design only when separately selected by the Principal.**

For the current multi-account stabilization effort:

> **Record → defer → proceed.**


#### Architectural finding — import-identity attribution model (2026-09-21)

**Date:** September 21, 2026

An independent FE/BE responsibility review (Codex, at accepted-main SYNC `ddac5cad99fd706c4c28d996af35a5cf900b5e1e`) surfaced a durable architectural finding relevant to any future durable ingestion contract for brokerage evidence. It is captured here as reconciliation/bookkeeping under this existing Durable Brokerage / Fidelity Evidence Persistence refinement.

**Classification — architectural finding, NOT a defect.** The review identified latent split semantics and documentation drift between two import-identity models coexisting in the codebase, but did **not** demonstrate a current operator-visible defect caused by that coexistence. Current accepted authority is explicit operator-selected BrokerageAccount attribution, adopted precisely because real Fidelity evidence does not reliably establish account identity. No `docs/bugs/` record is created from the present evidence.

**The two coexisting models (repository fact):**

- **Accepted authority — selection-as-identity** (ratified at `e6e743b`, exercised by the September 21 recovery): the operator's explicitly selected BrokerageAccount is the sole import identity authority. A structurally valid CSV uploaded into the selected account is accepted into it, with no account-number extraction and no identity refusals (`options-prototype/src/portfolio/account-import.ts`, `importIntoAccount`).
- **Generic content-identity resolver — also present**: a path that derives an external account reference from file content, routes evidence to the identified account, and fails closed on unidentified Balances / cross-file disagreement (`options-prototype/src/portfolio/account-import.ts`, `resolveImport`). Empirically, real Fidelity Balances and Option Summary exports carry no extractable external account reference (the account number appears only in the filename, and filename identity was rejected), so this resolver's identity path does not fire for real files today.

**Constraint to preserve (load-bearing for any future ingestion contract):**

> Current accepted import authority is explicit operator-selected BrokerageAccount attribution. A generic content-identity resolver also remains in the codebase. Any future durable ingestion contract must explicitly reconcile these models and must not assume that Fidelity CSV content can establish BrokerageAccount identity.

**Epistemic distinction to preserve (honest provenance):**

- Operator selection is an **attribution fact** ("the operator directed this evidence into account X").
- It is **not** evidence that the CSV itself proved account identity.
- Future provenance should therefore record the **attribution method** honestly (e.g. `OPERATOR_SELECTED` vs `BROKER_EMBEDDED` vs `EXPLICITLY_RESOLVED` vs `LEGACY_UNKNOWN`), never conflating an operator-selected target with a content-proven identity.

**Explicitly not authorized by this finding.** No implementation, no refactoring, no removal of the generic resolver, no persistence design adoption, no ingestion-contract design, and no new governance loop. This is durable capture of an architectural finding so a future authorized reconciliation/design pass (owned by this refinement) begins from it rather than rediscovering it.

**Why-state:** the independent review is in Principal conversation context (2026-09-21) and summarized here; the recovery why-state that established the no-embedded-identity fact is `docs/journal/project-journal-5.md` (2026-09-21) and the `PL-DEPLOY-BAL` transition record earlier in this file.

**Next authorized mode:** unchanged — **Record → defer → proceed.** Future reconciliation/design only when separately selected by the Principal.

### `PL-ROADMAP-UI` — detail-pane completeness refinement (verbosity-first, 2026-09-22)

**Date:** September 22, 2026
**State:** RECONCILED — provisional-UX refinement under existing `PL-ROADMAP-UI`; no new canonical identity; Principal-accepted; no new authority mutated.

**Discovery (Principal review of the rendered surface).** Inspecting the two-pane lenses, the Principal found the detail panes for **Parking Lot** and **Architecture** showed only metadata (id, name, section, source, relationship chips) and answered neither "what is this item about?" nor "where does it stand?". The governing requirement: *the operator should never leave a detail pane still asking "wait, what is this one about?"* A follow-up review added a global preference: **err on the side of verbosity in every detail pane** (screen real estate is available; below-the-fold content is acceptable).

**What changed (presentation/projection only; no canonical authority mutated).** This refinement is entirely within the existing ADR-018 build-time projection boundary — canonical Markdown → `scripts/generate-roadmap-projection.mjs` → read-only `roadmap-projection.json` → UI. It adds no relationships, priority, dates, owners, or authorization state, and rewords nothing (faithful excerpt/verbatim discipline, mirroring the existing Domain/Bugs projections).

- **Parking Lot** — `PlItem` gained a faithful `description` (table-row items use their authored Summary cell verbatim and uncapped; prose records use their lead narrative + `**Trigger:**`, falling back to the first descriptive subsection), a verbatim `state` line, and a full sectioned `sections[]` body (every `##`/`###` subsection of a prose record, verbatim, uncapped, Bugs-style), plus `descriptionTruncated`.
- **Architecture** — `ArPressure` gained a faithful `summary` (the AR's narrative paragraphs, excluding the structured `**Pressure from:**`/`**Candidate transition:**` fields), uncapped.
- **ADRs** — `AdrRecord` gained full `decision` and `consequences` and a full (no longer first-paragraph-only) `context`. The parser handles source-format variance faithfully: plural `**Decisions:**` with `###` subsections is captured whole; inline bold fields (`**Invariant:**`, etc.) remain in-body; ADR-007 correctly carries `null` consequences because it genuinely has none (it uses "Current status").
- Shared parser helpers: `faithfulExcerpt` gained an uncapped (`Infinity`) mode; new `sliceIntoSections` factored out of `parseBugRecord` (behavior preserved).

**Strategic disposition (against `docs/roadmap.md`).** No new Bet, no LVT change. Strengthens comprehensibility of existing Category-C authority; introduces no strategic hypothesis.

**Architectural disposition (against `docs/architecture-roadmap.md`, ADRs).** No AR change, no new engine; wholly within the ADR-018 projection boundary. The projection was regenerated from authority and passes the freshness check.

**Parking-lot disposition / mapping.** Retained under `PL-ROADMAP-UI` (this capability's home). No new identity; no double-booking.

**Findings preserved (not acted on).** (a) **Strategy** and **Principles** detail panes remain thin because the *source* is thin (an LVT node is one bullet clause; a principle statement is one sentence) — richer content is a doc-authority edit to `docs/roadmap.md`/`docs/principles.md`, not a presentation fix; recorded, not padded. (b) **ADRs** would benefit from an industry-standard (Google-style) structure — that is a rewrite of the ADR *documents*, deferred as a separate concern, not a projection change. (c) **Domain** detail is unsatisfactory to the Principal; explicitly deferred to a separate Principal-initiated intake (ignored in this pass). (d) **Priority** left unchanged (Principal rethinking it).

**Explicitly not authorized.** No mutation of `docs/roadmap.md`, `docs/architecture-roadmap.md`, `docs/principles.md`, `docs/07c-adrs.md`, or the domain reference; no Domain intake created here; no new lens; no runtime/backend change.

**Verification.** Frontend suite green (2062/2062 at closeout, composed with the concurrently-landed Log-lens work), `tsc -b` clean, `check:roadmap-projection` in sync.

**Why-state.** This record is the durable provenance; the acceptance and design reasoning are in the Principal conversation (2026-09-22).

**Next authorized mode.** No further work. Strategy/Principles source enrichment, the Google-style ADR restructure, and the Domain detail concern each require separate Principal selection.


## `PL-BROKER-CAP` — Brokerage-Facing Capability Model / Incumbent Fitness Appraisal

**Date:** September 22, 2026  
**State:** INTAKE — new canonical identity; materially developed cross-cutting discovery; strategic/architectural reconciliation intentionally not completed; no implementation or vendor evaluation authorized

### What was discovered

A discussion initially triggered by Fidelity execution limitations and possible brokerage alternatives broadened beyond any one broker, API, existing parking-lot item, LVT node, or implementation seam.

Wheelwright currently obtains or exercises brokerage-facing capability through several direct mechanisms that were chosen pragmatically to get working software into operation: Tradier-backed market/options evidence, Fidelity CSV-derived portfolio state, Wheelwright/Fidelity browser handoff for execution, and Fidelity-derived evidence used for lifecycle/outcome reconstruction. These mechanisms have been productive incumbents, not mistakes. Real operation through them has exposed enough domain knowledge, operator friction, and architectural pressure that their continuing fitness should now be appraised before Wheelwright assumes that extending the same mechanisms is the correct next step.

The emerging problem-space model has **four capability surfaces**:

1. **Portfolio State** — what Wheelwright must know about brokerage accounts, positions/lots, balances/capital availability, encumbrance/open orders, activity, account regime, identity, provenance, and freshness.
2. **Market Evidence** — what Wheelwright must know about relevant markets/options: chains, quotes, Greeks, IV/volatility, expirations/strikes, liquidity and other governed evidence, including provenance/freshness/fitness.
3. **Execution** — how an operator-authorized Wheelwright decision/TradeIntent becomes an actual market action, including representation, validation/preview, multi-leg shape, handoff/staging/submission boundaries, limits, cancel/replace, and operator review.
4. **Lifecycle / Outcome** — how Wheelwright learns what actually happened after the decision: submitted/working state, fills/partial fills, expiration/assignment/exercise, close/roll, realized economics, reconciliation, and resulting portfolio state.

These surfaces describe **capabilities in the problem space**. Vendors, brokers, direct APIs, aggregators, trading platforms, hosted/drop-in components, files/CSVs, browser links, OAuth mechanisms, iframes, SDKs, FIX/OMS mechanisms, and similar technologies belong to the **solution space**. The investigation must not select a solution class before establishing the incumbent capability, actual problem/pressure, and solution-neutral meaning of “better.”

### Trigger versus broader concept

The immediate trigger was the Principal's Fidelity Tier-2 options denial and discussion of whether another brokerage or integration mechanism could remove current execution and portfolio-state friction. Earlier reconciliation correctly mapped individual concerns to existing homes such as `PL-PORT-01`, `PL-EXEC-01`, evidence work, AR1/AR6/AR7/AR10, ADR-004, and ADR-011.

Continued discussion exposed a broader concern: evaluating only those individual seams risks preserving the assumption that Wheelwright itself should own the underlying brokerage plumbing. Conversely, beginning with vendors/platforms risks “hammer shopping” — finding attractive solutions before establishing whether Wheelwright has the corresponding nails.

The broader discovery is therefore an **incumbent capability-and-fitness appraisal before solution selection**, not “replace Fidelity,” “replace Tradier,” “adopt an aggregator,” “build broker APIs,” or “use a trading platform.”

### Why it might matter

Observed operator work already crosses multiple surfaces:

- brokerage files are manually obtained and imported to establish portfolio state;
- the operator may scan/compare option-chain information manually even when Wheelwright possesses relevant evidence;
- execution can require dual-browser context switching and transfer/reverification of Wheelwright trade information in brokerage UI;
- lifecycle/outcome truth can require brokerage evidence/import/reconciliation after execution.

Much of this work appears mechanical rather than consequential operator judgment. A candidate product principle emerging from the discovery is:

> **Automate the movement of facts and intent; preserve the consequential decision.**

This is a hypothesis for appraisal, not a ratified product or architecture principle.

The discussion also identified a possible build-vs-buy/platform-boundary question: mature multi-broker trading/connectivity platforms may already provide some brokerage capabilities Wheelwright currently implements directly. If so, Wheelwright might avoid owning non-differentiating broker-specific plumbing. That possibility is deliberately **downstream** of the incumbent appraisal and decision criteria; it is not the intake conclusion.

### Appraisal method before solution research

The Principal explicitly selected the following order of inquiry:

> **incumbent appraisal → observed problem/pressure → solution-neutral “better” → decision criteria → solution-space classes → broad landscape survey → evidence/experiments → decision**

The **incumbent is the control**. “Keep” is a first-class result. Existing mechanisms must not be criticized merely because newer mechanisms exist; they earned their place by getting Wheelwright to its current operational state. Equally, past success does not grant them permanence if current evidence shows the problem has changed.

For each of the four surfaces, future appraisal should distinguish:

- required capability;
- current realization;
- demonstrated fitness / what works;
- observed friction;
- demonstrated failure mode;
- current constraint;
- trajectory pressure;
- solution-neutral meaning of “better”;
- relevant technology-quality consequences.

Do not turn every inconvenience into a requirement. Distinguish tolerable friction from constraints and failures.

### Technology-quality lens

The Principal uses six contextual quality attributes as architectural evaluation dimensions:

- **Usability**
- **Security**
- **Reliability**
- **Extensibility**
- **Maintainability**
- **Scalability**, including performance

Different applications and different Wheelwright surfaces may weight these qualities differently. No universal ordering or aggregate score is asserted. This is consistent with the ratified Technology Quality Constitution's multidimensional/evidence-driven posture.

The current discovery is substantially **usability-forward and security-supported**: eliminate clerical/operator impedance where justified (CSV handling, dual-browser trade reconstruction, unnecessary manual chain scanning, reconciliation work) while treating each integration as a new trust/attack surface and granting only authority required by the capability. Security is not the sole objective and does not automatically outrank the other qualities.

A provisional authority vocabulary emerged during discovery — `MARKET_READ`, `ACCOUNT_READ`, `ORDER_STAGE`, `ORDER_EXECUTE`, `FUNDS_MOVE` — as a way to reason about blast radius and least authority. This vocabulary is **not ratified ontology** and must not be generalized prematurely. It may be useful later when evaluating concrete solution mechanisms.

### Complete parking-lot reconciliation at intake

The complete `docs/parking-lot*.md` sequence was reviewed at current `main` SYNC `3813f8e1a609b9771e6efba646dca596f80f5499` before creating this identity.

Relevant existing homes remain valid but do not individually own the broader appraisal:

- **`PL-PORT-01`** owns Portfolio-State Maturity, multi-BrokerageAccount/account-local state, durable brokerage/Fidelity evidence persistence, and related ingestion/provenance concerns.
- **`PL-EXEC-01`** owns Trade Lifecycle Evolution and the execution/handoff lifecycle beyond the existing Fidelity URL handoff.
- **`PL-EVID-01` / evidence family** owns historical/market evidence concerns and the Evidence Appliance/provider semantics.
- **`PL-DEPLOY-BAL`** owns broker-native account-regime/balance semantics, not the cross-surface brokerage capability model.
- **`PL-STRAT-01` refinements** own broker/account execution eligibility as a strategy gate, not brokerage capability provision.
- **`PL-ARCH-07`** is a useful methodological analogue for COTS/build-vs-buy evaluation but owns authorization infrastructure, not brokerage capability.
- Existing `PL-DEPLOY`, Production, and lifecycle items own their specific decision/accounting semantics and are not replaced by this intake.

Because the discovered concern intentionally spans these established identities and asks whether the **capability-provision boundary itself** should be appraised before further local extension, merging it into any one existing item would lose the cross-cutting question. A new stable identity is therefore warranted at **INTAKE**. This does not supersede, merge, or reprioritize those existing items.

### Unresolved

- Are the four capability surfaces the right durable decomposition, or does appraisal evidence require refinement?
- What exact capabilities does Wheelwright require within each surface today and on the evidenced trajectory?
- Which incumbent mechanisms are demonstrably fit and should remain untouched?
- Which observed operator frictions are material enough to justify change?
- Which current limitations are true constraints or failure modes versus tolerable friction?
- What does “better” mean for each surface without naming a solution?
- Which of the six quality attributes materially determine fitness for each surface, and what evidence supports their relative importance?
- Which brokerage-facing responsibilities are differentiating Wheelwright capability versus enabling/non-differentiating infrastructure?
- Only after those questions: what solution classes exist, what broad market landscape supplies them, and what evidence/experiments would be required to displace an incumbent?
- Does later reconciliation strengthen/refine existing LVT/AR structure, reveal a genuinely broader strategic/architectural concern, or require no roadmap/architecture-roadmap change? **Not decided at intake.**

### Explicitly not authorized

- No vendor or product selection.
- No broad vendor/platform landscape survey yet.
- No Schwab, SnapTrade, Tradier-trading, Fidelity replacement, aggregator, trading-platform, OMS/FIX, iframe/hosted-ticket, or other solution commitment.
- No broker/API spike or experiment.
- No new direct brokerage integration.
- No replacement/removal of Tradier, Fidelity CSV ingestion, Fidelity handoff, or existing lifecycle evidence paths.
- No new generalized broker abstraction, provider interface, TradeIntent framework, capability ontology, credential model, or execution service.
- No `ORDER_EXECUTE` or funds-movement authority.
- No LVT, architecture-roadmap, ADR, foundation, or Technology Quality Constitution mutation from this intake.
- No implementation work.

### Why-state

The richer discovery is the Principal/ChatGPT brokerage-capability discussion of September 22, 2026, beginning with Fidelity Tier-2 constraints and evolving through LVT/PL and architecture/ADR reconciliation into the four-surface capability model, incumbent-control principle, six-quality-attribute lens, security/integration threat discussion, platform/build-vs-buy hypothesis, and the explicit decision to stop before further appraisal and enter durable intake.

This record intentionally preserves enough of that why-state for a cold actor to resume without reconstructing the solution-space discussion from memory. Existing related durable records remain authoritative within their narrower subjects.

### Next authorized mode

**Further exploration / problem-space appraisal only.**

The next bounded activity, when Principal-selected, is to appraise the four surfaces from incumbent evidence, starting from capabilities and fitness rather than vendors or mechanisms. Strategic and architectural reconciliation remain required before this item can become **RECONCILED**. No solution-space survey or implementation is authorized by intake.


---

## `PL-SEM-01` — Wheelwright Canonical Semantic Model / Domain Integration

**Date:** September 23, 2026  
**State:** INTAKE — new canonical identity created; bounded design draft created under explicit Principal direction; not ratified architecture and no implementation migration authorized  
**Concept home:** semantic integration across current domain/architecture submodels  
**Draft:** `docs/58-wheelwright-semantic-model-v1.md`  
**Trigger:** Options-intent/nomenclature work and independent Codex information-architecture review demonstrated that Wheelwright has mature semantic submodels but no canonical integrated ontology/domain model.

### What was discovered

Wheelwright has strong bounded models for options mechanics, evidence semantics, position monitoring, Portfolio Capital, Production, Situation/regime context, broker/account projections, lifecycle consequences, and application architecture. It does not have one canonical semantic integration layer establishing how those concepts compose.

The current `docs/02-domain.md` is an early-slice mixed artifact (domain knowledge, calculations, provider-neutral data shapes, prototype assumptions, and local decisions), not a complete Wheelwright domain model.

Concrete pressure includes:

- `strategy` is legitimate practitioner vocabulary but overloaded across construction, mechanism, program, and policy-matching uses;
- `intent` has strong negative non-inference invariants but no integrated positive identity/scope/time model;
- Position, Inventory, Capital State, Alternative, Consequence, Deployment, Recommendation, and Outcome have partial or context-local semantics;
- authority/provenance/time rules have been repeatedly established locally without a common semantic assertion grammar;
- mechanically valid and policy-admissible Alternatives may still be non-executable because of broker/account/collateral/liquidity/support constraints, exposing a capability/executability dimension;
- future DDD questions (bounded contexts, aggregates, anti-corruption layers, context maps) should follow semantic ownership/invariants rather than precede them.

### Reconciliation against existing identity

Repository and parking-lot search found no existing `PL-*` identity whose scope is the canonical integration of Wheelwright's semantic world. Existing items own narrower concerns (portfolio maturity, recommendation placement, strategy expansion, lifecycle evidence, security/authorization, etc.) and should remain distinct.

### Strategic disposition

**No roadmap change.** This work does not create a new Product Bet. It strengthens the existing trustability, choices/consequences, outcomes, learning, and continuity directions by reducing semantic ambiguity beneath them.

### Architectural disposition

**New cross-cutting semantic-integration pressure; bounded draft only.** The v1 draft proposes one eventual Wheelwright Semantic Model containing ontology and operational-domain-model concerns, with explicit treatment of identity/scope, portfolio topology, state/event/transition/program/lifecycle, semantic assertions, authority/provenance, time/history, intent/policy, Alternatives/consequences, capability/executability, decision semantics, accounting relationships, and mappings from conventional market vocabulary.

This intake does **not** ratify the draft as Category A/B architecture.

### Why-state

- Principal discussion on September 23, 2026: options nomenclature and intent semantics exposed the missing world model.
- Independent Codex review: `wheelwright-information-architecture-proposal-review.md` session artifact; durable conclusions are incorporated into `docs/58-wheelwright-semantic-model-v1.md`.
- Project journal entry dated September 23, 2026.

### Explicitly not authorized

No code/schema migration; no rename or rewrite of `02-domain.md`; no new ADR; no bounded-context, aggregate, repository, domain-service, ACL, CQRS, or event-sourcing design; no generalized runtime framework; no recommendation/UI/execution behavior change.

### Reconciliation Completion Record

- **Intake:** `PL-SEM-01`
- **Strategic disposition:** strengthens existing strategic directions; **no `docs/roadmap.md` change**
- **Architectural disposition:** new cross-cutting semantic-integration pressure represented by a bounded Category E draft; **not ratified architecture**
- **Parking-lot disposition/mapping:** retained as new `PL-SEM-01`; related to but not merged with `PL-PORT-01`, `PL-ARCH-06`, `PL-STRAT-01`, `PL-POL-01`, Situation architecture, and current evidence/accounting semantics
- **Why-state:** `docs/58-wheelwright-semantic-model-v1.md` + September 23, 2026 project-journal entry
- **Next authorized mode:** adversarial review / specimen-driven semantic reconciliation only; implementation requires separate authority



### PL-SEM-01 v1.1 semantic-core reconciliation

**Date:** September 23, 2026  
**State:** REFINEMENT — Principal selected Option B: specimen-driven semantic-core reconciliation before DDD decomposition; v1.1 persisted; second adversarial review pending

The first independent adversarial review validated the Category-E integration scaffold and found four material type collisions plus moderate/minor findings. Principal selected the recommended **Option B** rather than a narrow patch or premature DDD expansion.

#### Material distinctions reconciled in v1.1

1. **Event ≠ evidence of Event ≠ reconciled transition.** Event now means an occurrence in the economic/operational world. Event Observation / Assertion is evidence establishing/reporting it. Reconciled Transition / Outcome is accepted domain history after evidence, association, and reconciliation.
2. **Capability ≠ current feasibility/executability ≠ Wheelwright support status.** Structural broker/account/product support, performability now, and Wheelwright understanding/representation/recommendation/staging/execution/lifecycle support are separate axes with different authority and lifetime.
3. **Slash-combined “primitives” withdrawn.** The draft now calls them candidate semantic concept families and explicitly decomposes Account vs Account Regime, Instrument vs Contract, Lot vs Inventory Block, Position vs Complete Position, Capital Boundary vs Capital Pool, Mandate vs Inventory Role, Constraint vs Preference, Situation vs Regime, Action vs Order, and accounting Stock vs Flow vs Attribution.
4. **Counterfactual Consequence ≠ actual Event Effect ≠ Reconciled Outcome ≠ Economic Attribution.** Prospective decision semantics no longer share one type with realized history/accounting.

#### Moderate/minor findings reconciled

- Candidate is now explicitly defined as raw discovered possibility before normalization into an Alternative, with an explicit requirement to remove it if specimens do not justify a durable distinction.
- Position remains explicitly unresolved rather than being silently equated with Complete Position.
- The decision-to-execution ladder now carries authority boundaries from discovery through broker state, Execution, observation, association, and reconciliation.
- The draft's self-reference in Related was removed.
- `PL-BROKER-CAP` is explicitly cross-linked: it owns brokerage-facing capability-provision/incumbent appraisal; `PL-SEM-01` owns the general semantic distinctions among capability, current feasibility, and Wheelwright support.
- The prior projection separator leakage is recognized as a parser/projection-fidelity defect to be reviewed separately; semantic-model work does not silently mutate parser behavior.

#### Boundary retained

No bounded contexts, aggregates, repositories, domain services, anti-corruption layers, context maps, CQRS/event sourcing, persistence schemas, or implementation migration are authorized. Those remain downstream of semantic stability.

#### Next authorized mode

**Independent adversarial review of v1.1 plus specimen pressure.** Review should attempt to falsify the revised distinctions, especially Event/Observation/Reconciliation, Capability/Feasibility/Support, Candidate/Alternative, Position/Complete Position, and Counterfactual Consequence/Realized Outcome. No Principal decision is required to perform that review.
