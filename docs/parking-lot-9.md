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
