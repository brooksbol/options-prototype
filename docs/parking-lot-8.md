# Project Parking Lot — Continuation 8

> This file is a physical continuation of `docs/parking-lot.md` through `docs/parking-lot-7.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 9, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace. Stable IDs remain global across the complete parking-lot sequence; row/file position is not priority; new material is reconciled against existing canonical concerns before a new identity is created.

---

## `PL-OPS-01` Refinement — Provider-Neutral Well-Architected Review / Render Reliability Fit

**Date:** September 9, 2026  
**State:** INTAKE refinement under existing `PL-OPS-01` Cloud Deployment / always-on; no new `PL-*` identity created  
**Related why-state:** `docs/journal/project-journal-3.md` — “Reliability classes before service boundaries”

### Intake

A reliability discussion following the September 9 observation-continuity incident asked whether Render has an equivalent of AWS Well-Architected. The useful result is not a new cloud strategy or an instruction to migrate platforms. It is a bounded architecture-review method and a concrete Render-specific failure characteristic that should be evaluated against Wheelwright's already-accepted cloud direction.

Canonical mapping:

> **Provider-neutral Well-Architected review / Render reliability fit → merged/refined into `PL-OPS-01`**

No new cloud-review `PL-*` identity is created. The concern belongs with the existing Cloud Deployment / always-on work because it asks whether the accepted Render topology satisfies Wheelwright's required operational characteristics.

### What was discovered

Render does not appear to publish one formal architecture-assessment framework directly equivalent to AWS Well-Architected. Its relevant guidance is distributed across platform documentation such as uptime best practices, shared responsibility, security/compliance, observability, deployment/recovery, and service-topology guidance.

Working hypothesis:

> **Wheelwright can use the AWS Well-Architected Framework as a provider-neutral review lens while grounding every answer in Render's actual capabilities and Wheelwright's actual failure modes.**

The AWS pillars—Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability—can function as a mature question set. AWS-specific mechanisms are not prescriptions. Each relevant question should instead resolve to one of:

- **Render-provided capability**;
- **Wheelwright-owned mechanism**;
- **explicitly accepted risk**;
- **demonstrated gap requiring experiment/design**.

This does **not** imply AWS adoption, AWS migration, AWS-specific architecture, or infrastructure complexity for its own sake.

### Concrete Render pressure against the accepted topology

Render documents that services with attached persistent disks can experience brief downtime during some infrastructure maintenance because the service must stop before its replacement starts; stateless services can remain available through that maintenance behavior.

Wheelwright's accepted Phase-1 cloud topology is deliberately simple:

```text
one Render Web Service
  └─ one Spring Boot process
       ├─ acquisition worker
       ├─ HTTP API
       └─ SQLite on attached persistent disk
```

The persistent-disk platform characteristic therefore intersects directly with the reliability why-state preserved earlier today: **Evidence Continuity may have a stronger reliability requirement than operator-facing consumption even before those concerns become separate deployed services.**

This is the first concrete platform-level pressure identified against that topology. It establishes a real failure mode worth examining. It does **not** establish that the topology is unacceptable, that SQLite should be replaced, or that acquisition/API should be split.

### Review discipline

A future bounded cloud review should:

1. start from Wheelwright's mission, accepted architecture, and observed failure modes;
2. use Well-Architected questions to expose risk rather than prescribe AWS mechanisms;
3. translate each relevant concern into Render capability, Wheelwright responsibility, accepted risk, or demonstrated gap;
4. prefer experiments/observed behavior where platform semantics or operational consequences are uncertain;
5. explicitly evaluate deployment, restart, maintenance, persistent-disk, process, provider, and recovery failure modes against time-sensitive evidence continuity;
6. preserve the Technology Quality Constitution rule that complexity must be earned;
7. change topology only if a required characteristic cannot be satisfied simply enough within the accepted topology.

### Relationship to the reliability-class exploration

The journal entry “Reliability classes before service boundaries” remains the why-state for the conceptual distinction. Its candidate characteristic was:

> **Evidence continuity isolation:** operator-facing activity and operator-facing change should not materially compromise Wheelwright's ability to maintain authoritative market evidence during time-sensitive acquisition windows.

The Render persistent-disk behavior strengthens the case for examining that characteristic because it identifies a platform-coupled failure domain shared by acquisition and operator access. It does not settle whether the correct remedy is acceptance, recovery behavior, in-process isolation, deployment scheduling, database/topology change, or eventual service extraction.

### Parking-lot disposition / mapping

**Retained as a refinement under existing `PL-OPS-01`.** `PL-OPS-08` remains distinct: it owns observation-continuity/gap detection and recovery semantics, while `PL-OPS-01` owns the cloud/always-on topology and therefore the provider-fit review. The reliability-class journal entry supplies cross-cutting why-state but does not itself become architecture authority.

### Next authorized mode

**Reconciliation / bounded architecture review only.** A future selected work session may perform the provider-neutral Well-Architected review of the accepted Render topology and produce explicit findings/experiments.

**Not authorized:** cloud migration, service extraction, database replacement, horizontal scaling, HA topology, new SLOs, infrastructure implementation, or any assumption that AWS mechanisms are the desired solution.

---

## `PL-DEPLOY` Refinement — Decision Surface: Expanded Row vs Drawer

**Date:** September 9, 2026
**State:** RECONCILED (discovery intake) under existing `PL-DEPLOY`; no new `PL-*` identity created; not authorized for implementation.
**Rich why-state:** `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`
**Observed at:** SYNC `6786c1b` (v1 consequence section live + conformance-repaired), captured against `c8f24bd`.

### Epistemic caution (carry forward to Codex review)

> **Replacement unresolved does not mean problem uncertain.** Working software *falsified* the current narrow-drawer presentation for this comparison; it has *not* selected the replacement. Challenge unsupported promotion of the expanded-row/drawer hypothesis, but do not weaken the directly observed working-software failure because the replacement remains exploratory.

### Intake

Exercising the shipped `LVT-INIT-CONSEQUENCE-RELEASE-COST` v1 in the covered-call `CallBrief` drawer surfaced interaction-surface pressure. This is **reconciled as a refinement under existing `PL-DEPLOY`**, which already owns normalized alternatives, owned-capital decision paths, cross-strategy comparison, the unified deployment-surface direction, and release/retention consequence comparison. This discovery is interaction-surface pressure within that existing concern, so no new identity is minted. `PL-SURF-01` remains related but distinct (it governs result completeness/truncation, not this comparison/inspection problem).

### Observed (working-software evidence, not hypothesis)

The v1 consequence comparison (Sell / Hold / Covered Call across a shared owned-capital block) is **cognitively unusable in the current narrow contract-detail drawer**: the operator must read alternatives serially, hold them in working memory, and reconstruct a comparison that should be visually available. The information is intrinsically **alternatives × consequence dimensions** (two-dimensional); the drawer supplies vertical inspection territory and insufficient horizontal comparison territory. Moving the section up, reordering drawer content, and making the existing presentation more prominent all **fail to solve** this. The live software also exposed a **unit-of-interaction level mismatch**: the operator selects a contract, the drawer begins as contract inspection, but Sell/Hold/CC are alternatives on the shared capital block — so the surface silently crosses from contract-level inspection to capital-block-level decision comparison.

### Derived design pressure

Comparison and inspection appear to impose materially different spatial/cognitive requirements — comparison wants horizontal, simultaneously-visible territory; inspection is well served by the drawer's vertical territory.

### Leading interaction hypothesis (not ratified)

Comparison may belong in a **horizontal expanded-row region** beneath the selected candidate row, while selected-candidate inspection **remains in the drawer**. Useful design reasoning (hypotheses/heuristics, not durable rules): Sell/Hold as stable reference alternatives vs candidate-specific CC variants; the progressive-disclosure sequence *scan → expand → compare → inspect*; the sorting heuristic *compare-alternatives vs inspect-candidate*; a Tier-2 extension path that avoids table column explosion (future pressure only). Exact expanded-row design, the drawer's ultimate subject, and any enduring interaction architecture remain **unresolved**.

### Strategic disposition

**Strengthens existing `PL-DEPLOY` direction; no roadmap change; no new Bet.** Instantiates `foundations/cognitive-role-separation.md` and `foundations/visual-design-principles.md` (progressive disclosure) for the deployment surface, serving `LVT-BET-LIFECYCLE-CHOICES` (alternatives) and `LVT-INIT-CONSEQUENCE-RELEASE-COST` (consequences) where they meet the operator.

### Architectural disposition

**Refines existing `PL-DEPLOY` interaction-surface pressure; no architectural decision or implementation authorized.** Does not decide the drawer's ultimate subject; does not authorize CapitalState, a generalized decision/state-machine or multi-leg abstraction, a Tier-2 action-set build, a drawer redesign, scoring/ranking, or any code change. Does not claim the application/drawer must become position-centric.

### Parking-lot disposition / mapping

**Retained and refined under `PL-DEPLOY`.** Cross-links: `PL-SURF-01` (adjacent, distinct table-surface completeness), `LVT-INIT-CONSEQUENCE-RELEASE-COST` (the shipped feature that produced the evidence), `foundations/cognitive-role-separation.md`, `foundations/visual-design-principles.md`, and Fidelity Tier 2 (`PL-STRAT-01`) as future pressure only. The shipped v1 consequence section is unchanged and correct.

### Why-state

Preserved in `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`, structured in explicit epistemic levels (observed failure → derived pressure → leading hypothesis → unresolved → not authorized) so the observation's strength is not softened into a placement concern.

### Next authorized mode

**Exploration / reconciliation only.** If selected, the smallest useful next step is a bounded design of the comparison surface (which facts earn horizontal comparison territory vs drawer inspection), reconciled against the open drawer-subject question, then normal decompose/authorize gates. No UI mutation until then.

---

## `PL-OPS-09` — Operator-Directed Targeted Re-Observation (Console Freshness on Demand)

**Date:** September 10, 2026  
**State:** INTAKE — new canonical identity created; bounded capability implemented, tested, and shipped under Principal direction  
**Concept home:** `foundations/evidence-appliance.md` (evidence freshness / "persist facts; derive trust"), `07-architecture-current.md`  
**Related:** `PL-OPS-08` (forced whole-cycle recovery — sibling, distinct intention), `PL-EVID-01` (monitored-position freshness overlay), `PL-ARCH-06` (recommendation-engine placement backdrop; unaffected)

### Intake

Live-software discovery on the Operator Console. A new **Freshness** column was added to the position tables (query-time evidence age derived from each position's `priceObservedAt`; nothing stored — "persist facts; derive trust"). Operator observation: clicking **"Refresh evidence now"** did not move the on-screen freshness values.

Two mechanisms were found and separated:

1. **Frontend read lag (fixed).** The console reads observations from a 30s-polling store with an ETag/304 conditional read. The forced-acquisition button never told the store to re-read, so freshness lagged up to a full poll interval and could return `304` even after the generation advanced.
2. **Provider stewardship on the whole-cycle force (root behavioral finding).** `PL-OPS-08`'s `forceAcquireOnce()` forces the **due** work queue. On-screen monitored symbols that are still fresh (within the Class A ~15 min / refresh horizon) are deliberately **excluded** from the due queue (stewardship: do not re-acquire evidence that still satisfies policy). So a whole-cycle force correctly does **nothing** for a fresh symbol, and its freshness legitimately does not move.

The operator intention here is **not** outage/gap recovery (that is `PL-OPS-08`). It is: *"re-observe the specific positions I am looking at, now, so their freshness reflects a just-now observation."* That is a distinct, narrower, bounded intention — a small explicit symbol set the operator is actively monitoring — and it is the reason a scoped exception to the freshness/due gate is defensible where a universe-wide one would not be.

### What was implemented now (bounded capability)

Under explicit Principal direction, a **targeted** variant of the existing forced-acquisition path:

- `POST /api/evidence/refresh?symbol=BNO&symbol=COPX&…` — when one or more `symbol` query params are present, re-observe **exactly** those symbols regardless of freshness; with no params, the endpoint keeps its existing `PL-OPS-08` whole-cycle behavior. Response gains a `targeted` boolean. **POST, not GET:** the operation drives provider acquisition, mutates the evidence store, and advances the snapshot generation — it is side-effecting, so a safe/cacheable GET would misrepresent it (RFC 9110 safe-method semantics). The safe, cacheable read of the result remains `GET /api/evidence/quotes`.
- `AcquisitionWorker.forceAcquireSymbols(List<String>)` — mirrors `forceAcquireOnce`'s guards (NOT_RUNNING / PROVIDER_UNAVAILABLE) and single-acquisition-thread submission, but loops the **existing** per-symbol `acquireSymbolTiered` over synthesized work items, bypassing **both** the freshness/due gate (never consults `getPrioritizedWorkQueue`) and the session gate. Registers genuinely-unknown symbols as observation-demand so acquisition is not a silent no-op; **does not** touch the monitored-position overlay (that is owned by `POST /api/evidence/observe`). Forces publication so the generation advances immediately.
- Frontend: `ForceAcquisitionButton` passes the console's portfolio underlyings; `forceEvidenceAcquisition(symbols?)` builds the `?symbol=` params; the observation store's `refreshNow()` re-reads on a bounded backoff (0/0.8/1.8/3.5s) that stops once the generation advances — closing the read-lag race without a manual browser refresh.

**Provenance / invariants preserved.** Re-observed evidence keeps its real `retrievedAt` timestamp and provider/session provenance (unchanged `setChain`/`setExpirations`). Single Acquisition Authority is preserved (runs on the one acquisition thread). Rate-limit compliance is inherited from the adapter pacer (no new sleeps/pacer). Failed refresh still preserves prior evidence. Verified live (market open): freshness reset to seconds automatically. Backend + frontend tests added (`AcquisitionWorkerTest$TargetedForcedAcquisition`, `NudgeControllerTest` targeted cases, `nudge-acquisition.test.ts`).

### Reconciliation

**Strategic:** Strengthens the existing evidence-appliance freshness/trust direction; no roadmap change, no new Bet. Serves the monitored-position operator (`PL-EVID-01`) and the Operator Console monitoring role.

**Architectural:** A **new, narrow, operator-scoped exception to the provider-stewardship / freshness-due gate**, bounded to an explicit small symbol set the operator is actively monitoring, reusing existing acquisition machinery. It does **not** ratify universe-wide freshness bypass, change the scheduler cadence, freshness horizons, cache TTLs, concurrency, provider profile, session semantics, or the ETag/snapshot contract. It does not alter the monitored-set overlay semantics.

**Parking-lot mapping:** New identity `PL-OPS-09` created and retained. **Not merged into `PL-OPS-08`:** that item owns outage/gap continuity and forces the *due* queue; this owns operator-directed *targeted* re-observation of specific fresh symbols — a different intention with a different gate-bypass scope. Cross-references `PL-OPS-08`, `PL-EVID-01`.

**Why-state:** Preserved in this record and the Sep 10 journal checkpoint. The extended HTTP-semantics reasoning (why POST-with-query-params over a side-effecting GET, and why the whole-cycle force was correctly a no-op for fresh symbols) is the durable lesson.

### Next authorized mode

- **Shipped now:** the targeted refresh capability described above.
- **Not authorized:** universe-wide freshness-gate bypass, scheduler/horizon/TTL/concurrency/provider/session changes, or any broadening of the scoped exception beyond the explicit operator-supplied symbol set without new reconciliation.

### Consumers of this capability

`PL-OPS-09` is a backend/operator contract — *operator supplies a bounded symbol set → the evidence appliance re-observes those symbols now → authoritative evidence is published → a consumer re-reads it.* Surfaces that supply the symbol set are **consumers**, not new capabilities:

1. **Operator Console** (first consumer, Sep 10) — the on-screen monitored-position underlyings. Reads evidence via the observation store (`useObservations()` / `GET /api/evidence/quotes`).
2. **Cash Deployment — Prod v0** (second consumer, Sep 10) — the underlyings of the **first 30 rows under the operator's current sort/order** in `CrossEntryStrip`, deduped, hard-capped at 30 unique symbols (`src/write-desk/refresh-top-symbols.ts`). "Top" = display-relative ("the opportunities at the head of the view I'm using"), never a canonical/best ranking. Motivated by a demonstrated operational failure: stale deployment evidence contributed to **missed morning trades**. Implemented purely as a new consumer — **zero backend change** — via a `CrossEntryRefreshButton` that calls the existing `forceEvidenceAcquisition(symbols)` and, on `ACQUIRED`, triggers the Deployment surface's own re-read.

**Cross-surface symmetry (verified expectation):** one targeted acquisition advances the single authoritative backend evidence model; each surface then reflects the fresher evidence through its **own** re-read — no second provider acquisition. The shared truth is at the backend; the consumers are independent.

### Findings preserved (not solved here) — belong to `PL-DEPLOY` / decision-surface why-state

- **Display-relative stale-suppression (sort-dependent).** A display-relative refresh window can fail to reach a candidate whose *own* stale evidence suppresses it below the window — e.g. a genuinely attractive candidate sitting at row 45 because stale evidence understates its economics is never in the top-30 refresh set, and after those rows rerank it can stay suppressed. The exposure is worse when the active sort key is itself evidence-derived (yield/delta), and negligible under evidence-independent sorts (symbol/DTE). The 30-row window **reduces but does not eliminate** this class. The complete fix would refresh a broader candidate-generation population — explicitly deferred; **not** part of this work. Cross-links `PL-ARCH-06` (browser-side ranking authority).
- **Two frontend evidence readers for one backend model.** The Operator Console reads the observation store (`GET /api/evidence/quotes`, generation-keyed) while Cash Deployment reads WriteDesk's private snapshot poll (`GET /api/evidence/snapshot`) → durable cache → `recommendPuts`/`recommendBuyWrites`. Both consume the *same* authoritative backend evidence but through independent readers on independent generation trackers, which is why each surface needs its own prompt re-read after a shared refresh. Preserved as a **finding only** — not an authorization to unify the pipelines (that pressure belongs to `PL-ARCH-06`).

### Next authorized mode (`PL-OPS-09` consumers)

- **Shipped now:** Cash Deployment "Refresh top opportunities" (first-30-current-sort → dedupe → existing targeted path → surface re-read), pending Principal working-software review.
- **Not authorized:** raising the 30-row bound, universe/population-wide refresh, ranking-aware acquisition scheduling, unifying the two frontend evidence readers, `PL-ARCH-06` resolution, or any backend/scheduler/session change. Additional consumers reuse this same contract; they do not mint new capability.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 9, 2026 | Provider-neutral Well-Architected / Render reliability-fit discovery reconciled as a refinement under existing `PL-OPS-01`. Preserves Render attached-persistent-disk maintenance downtime as concrete pressure against the accepted one-service topology while explicitly withholding any inference that service extraction, database replacement, HA, or AWS migration is required. |
| Sep 9, 2026 | Decision Surface (expanded row vs drawer) reconciled as a refinement under existing `PL-DEPLOY` from live-software discovery: the v1 consequence section falsified the narrow contract-detail drawer as the presentation for Sell/Hold/CC comparison across an owned-capital block, and exposed a contract→capital-block unit-of-interaction mismatch. Leading (unratified) hypothesis: horizontal expanded-row comparison + drawer inspection. Rich why-state: `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`. No new `PL-*` id; no UI/implementation authorized; exact design held exploratory. |
| Sep 9, 2026 | Bounded expanded-row (b)-move experiment built and reviewed in working software (under `PL-DEPLOY`). Validated: narrow drawer failed as comparison surface; horizontal in-row expansion substantially improves comparative cognition; removing consequences from the drawer improved its inspection coherence. New observation: above-the-fold availability ≠ visual accessibility — the expanded region needs stronger visual hierarchy. One reusable principle promoted to `foundations/visual-design-principles.md` (principle 11: essential decision info must be visually accessible without depending on undisclosed vertical discovery / the fold is degraded availability; presence ≠ accessibility carried as rationale, not a separate principle). Experiment retained (not reverted); next step is visual-accessibility iteration, not reconsidering existence. Exact visual design and architectural promotion still unresolved. |
| Sep 10, 2026 | `PL-OPS-09` (Operator-Directed Targeted Re-Observation) created from live console discovery: a new query-time **Freshness** column didn't move on "Refresh evidence now". Root findings: (1) frontend read-lag/ETag-304 race in the polling store, and (2) `PL-OPS-08`'s whole-cycle force correctly no-ops for still-fresh on-screen symbols (provider stewardship excludes them from the due queue). Shipped a **targeted** variant — `POST /api/evidence/refresh?symbol=...` → `AcquisitionWorker.forceAcquireSymbols()` re-observing exactly the on-screen symbols, bypassing the freshness/due + session gates via the existing per-symbol path, preserving real timestamps/provenance/Single-Acquisition-Authority/rate-limit; frontend `refreshNow()` bounded-backoff re-read. POST (not GET) affirmed on RFC 9110 safe-method grounds. Verified live (market open): freshness resets to seconds automatically. Tests added both suites. New `PL-*` id (distinct intention from `PL-OPS-08`); narrow operator-scoped stewardship exception only; no scheduler/horizon/TTL/session/contract change. |
| Sep 10, 2026 | **Cash Deployment — Prod v0** added as the **second consumer of `PL-OPS-09`** (not a new capability). A "Refresh top opportunities" control re-observes the underlyings of the **first 30 rows under the operator's current sort** (deduped, hard-capped at 30 unique symbols) via the existing `forceEvidenceAcquisition(symbols)` path, then triggers the Deployment surface's own snapshot re-read (bounded backoff) so freshness/economics recompute promptly (30s poll remains the safety net). **Zero backend change / no bounce** — the reuse gate held. Motivated by missed morning trades from stale deployment evidence. Investigation found Console and Deployment read the same backend evidence through **different** frontend readers, so each re-reads its own source; recorded as a finding, not unified. Stale-suppression limitation (display-relative window can miss candidates suppressed below it by their own stale economics; sort-key-dependent) preserved under `PL-DEPLOY`/decision-surface, explicitly deferred. New files: `CrossEntryRefreshButton.tsx`, `refresh-top-symbols.ts`; 13 tests added. No new `PL-*` id. Pending Principal working-software review. |
