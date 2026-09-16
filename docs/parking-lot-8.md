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
2. **Cash Deployment — Prod v0** (second consumer, Sep 10) — two affordances, both **zero backend change**:
   - **Bulk "Refresh top opportunities"** — the underlyings of the **first 30 rows under the operator's current sort/order** in `CrossEntryStrip`, deduped, hard-capped at 30 unique symbols (`src/write-desk/refresh-top-symbols.ts`). "Top" = display-relative ("the opportunities at the head of the view I'm using"), never a canonical/best ranking.
   - **Per-row surgical refresh (`↻` beside each Age)** — a one-symbol set for the exact opportunity the operator is considering (final pre-execution revalidation before Open in Fidelity), so a single lagging row can be refreshed without rerunning the bulk window (`src/write-desk/RowRefreshButton.tsx`).

   Both call the existing `forceEvidenceAcquisition(symbols)` and, on `ACQUIRED`, trigger the Deployment surface's own re-read. Motivated by a demonstrated operational failure: stale deployment evidence contributed to **missed morning trades**.

   **Completion truthfulness — the hardest-won part of this feature.** Both controls now enforce the same discipline: operator-facing success corresponds to VISIBLE-STATE convergence (the requested rows' `acquiredAtMs` advancing past a click-time baseline), always bounded so it can never hang.
   - *Re-read:* runs the FULL bounded backoff, NOT an early-exit on "generation advanced" — the appliance publishes generations near-continuously, so a bump does not mean the *targeted* symbols were re-observed; the early exit merged an unrelated publication and left the age stale.
   - *Per-row `↻`:* spins through acquisition and convergence; stops when the row's `acquiredAtMs` advances; terminates into an explicit `?` after a bounded wait (8s) if it does not (e.g. a provider-cache hit inside the 90s chain-cache window); never eternal.
   - *Bulk button (Codex correction):* NO longer claims `Refreshed N` at POST return. Progression `Refreshing…` → `Updating evidence…` → `Refreshed N` only when all requested rows' visible provenance advances, else `Refreshed X of Y` / `Not confirmed fresh`. Its convergence bound (13s) intentionally EXCEEDS the re-read backoff total (~12.5s) so it never declares partial while the re-read still has attempts pending.
   - *ACQUIRED epistemics (Codex correction):* backend `ACQUIRED` is an acquisition disposition only — it can arise from a bounded-wait timeout, and `symbolsAcquired === 0` does not prove evidence was already current. The FE never translates it into `Refreshed N` / `up to date`; the number reported is the count of symbols whose VISIBLE provenance advanced.

   Durable lesson: `foundations/visual-design-principles.md` principle 12 — *completion indication tracks visible-state convergence, but always bounded.* (Arc: simple spinner → convergence spinner → proposed revert → near-miss caught → "both, bounded" → Codex extended the same discipline to the bulk control and the ACQUIRED label.)

**Cross-surface symmetry (verified expectation):** one targeted acquisition advances the single authoritative backend evidence model; each surface then reflects the fresher evidence through its **own** re-read — no second provider acquisition. The shared truth is at the backend; the consumers are independent.

### Findings preserved (not solved here) — belong to `PL-DEPLOY` / decision-surface why-state

- **Display-relative stale-suppression (sort-dependent).** A display-relative refresh window can fail to reach a candidate whose *own* stale evidence suppresses it below the window — e.g. a genuinely attractive candidate sitting at row 45 because stale evidence understates its economics is never in the top-30 refresh set, and after those rows rerank it can stay suppressed. The exposure is worse when the active sort key is itself evidence-derived (yield/delta), and negligible under evidence-independent sorts (symbol/DTE). The 30-row window **reduces but does not eliminate** this class. The complete fix would refresh a broader candidate-generation population — explicitly deferred; **not** part of this work. Cross-links `PL-ARCH-06` (browser-side ranking authority).
- **Two frontend evidence readers for one backend model.** The Operator Console reads the observation store (`GET /api/evidence/quotes`, generation-keyed) while Cash Deployment reads WriteDesk's private snapshot poll (`GET /api/evidence/snapshot`) → durable cache → `recommendPuts`/`recommendBuyWrites`. Both consume the *same* authoritative backend evidence but through independent readers on independent generation trackers, which is why each surface needs its own prompt re-read after a shared refresh. Preserved as a **finding only** — not an authorization to unify the pipelines (that pressure belongs to `PL-ARCH-06`).

### Rate-limit stewardship boundary (verified — Codex review, Sep 10)

The natural worry with two operator refresh controls (bulk + per-row) is that repeated clicking sprays the provider into HTTP 429. **Verified it does not create a rate-limit bypass.** The governing principle:

> **Force fresh bypasses freshness policy, not provider stewardship.**

Targeted refresh traverses the *same* provider protections as scheduled acquisition:
- **Same single acquisition thread** — targeted requests are submitted to the same single-threaded executor as scheduled work (Single Acquisition Authority; no split-brain, no second path).
- **Same per-symbol path** — `forceAcquireSymbols` loops the existing `acquireSymbolTiered`.
- **Same pacer** — all cache-miss provider calls go through the active authority's `RequestPacer`: single-flight, ≤119 request starts per trailing 60s.
- **Same response cache** — expirations 5m / quotes 60s / chains 90s. Rapid same-symbol re-refresh often reuses the cached chain (materially reduces burst pressure) — though a cache hit preserves the original `retrievedAt`, so the row's Age may not advance and the bounded `?` outcome is the truthful result.
- **Same 429 handling** — a provider 429 records the event, honors `Retry-After` (else 60s backoff), blocks later pacer admission until it expires, and is classified as ordinary throttling (not provider failure/failover). Already tested.

**Residual risk (real, but not a 429 spray):** overlapping operator operations — a 30-symbol bulk, several row `↻`, another bulk, atop scheduled work — serialize through the one worker and one pacer. That protects Tradier but can create an **acquisition backlog and delayed convergence**. A visible consequence (not a defect): under queued pressure a bulk refresh can honestly report `Refreshed X of Y` / `Not confirmed fresh` because the requested work did not complete within the UI's bounded observation window (13s) — the button is truthfully reporting "not confirmed in time," not failing.

**Disposition — observe first, do not throttle speculatively.** No evidence yet that real operator use crosses the pacer limit. The next appropriate step is observational: inspect recorded 429 events, pacer admission wait, targeted-operation backlog under realistic clicking, and whether bulk refresh measurably delays scheduled acquisition. **Only if real pressure appears**, the smallest response is to **coalesce/deduplicate pending refresh intentions** — explicitly **do NOT** weaken the pacer, raise its limit, or introduce a second rate-limit mechanism (that would violate Single Acquisition Authority). No code change authorized now.

### Next authorized mode (`PL-OPS-09` consumers)

- **Shipped now:** Cash Deployment "Refresh top opportunities" (first-30-current-sort → dedupe → existing targeted path → surface re-read), pending Principal working-software review.
- **Not authorized:** raising the 30-row bound, universe/population-wide refresh, ranking-aware acquisition scheduling, unifying the two frontend evidence readers, `PL-ARCH-06` resolution, any backend/scheduler/session change, or weakening the provider pacer / adding a second rate-limit mechanism. Additional consumers reuse this same contract; they do not mint new capability. If refresh burst pressure is ever observed, the only sanctioned response is coalescing/deduplicating pending refresh intentions.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 9, 2026 | Provider-neutral Well-Architected / Render reliability-fit discovery reconciled as a refinement under existing `PL-OPS-01`. Preserves Render attached-persistent-disk maintenance downtime as concrete pressure against the accepted one-service topology while explicitly withholding any inference that service extraction, database replacement, HA, or AWS migration is required. |
| Sep 9, 2026 | Decision Surface (expanded row vs drawer) reconciled as a refinement under existing `PL-DEPLOY` from live-software discovery: the v1 consequence section falsified the narrow contract-detail drawer as the presentation for Sell/Hold/CC comparison across an owned-capital block, and exposed a contract→capital-block unit-of-interaction mismatch. Leading (unratified) hypothesis: horizontal expanded-row comparison + drawer inspection. Rich why-state: `docs/discovery/decision-surface-expanded-row-vs-drawer-2026-09-09.md`. No new `PL-*` id; no UI/implementation authorized; exact design held exploratory. |
| Sep 9, 2026 | Bounded expanded-row (b)-move experiment built and reviewed in working software (under `PL-DEPLOY`). Validated: narrow drawer failed as comparison surface; horizontal in-row expansion substantially improves comparative cognition; removing consequences from the drawer improved its inspection coherence. New observation: above-the-fold availability ≠ visual accessibility — the expanded region needs stronger visual hierarchy. One reusable principle promoted to `foundations/visual-design-principles.md` (principle 11: essential decision info must be visually accessible without depending on undisclosed vertical discovery / the fold is degraded availability; presence ≠ accessibility carried as rationale, not a separate principle). Experiment retained (not reverted); next step is visual-accessibility iteration, not reconsidering existence. Exact visual design and architectural promotion still unresolved. |
| Sep 10, 2026 | `PL-OPS-09` (Operator-Directed Targeted Re-Observation) created from live console discovery: a new query-time **Freshness** column didn't move on "Refresh evidence now". Root findings: (1) frontend read-lag/ETag-304 race in the polling store, and (2) `PL-OPS-08`'s whole-cycle force correctly no-ops for still-fresh on-screen symbols (provider stewardship excludes them from the due queue). Shipped a **targeted** variant — `POST /api/evidence/refresh?symbol=...` → `AcquisitionWorker.forceAcquireSymbols()` re-observing exactly the on-screen symbols, bypassing the freshness/due + session gates via the existing per-symbol path, preserving real timestamps/provenance/Single-Acquisition-Authority/rate-limit; frontend `refreshNow()` bounded-backoff re-read. POST (not GET) affirmed on RFC 9110 safe-method grounds. Verified live (market open): freshness resets to seconds automatically. Tests added both suites. New `PL-*` id (distinct intention from `PL-OPS-08`); narrow operator-scoped stewardship exception only; no scheduler/horizon/TTL/session/contract change. |
| Sep 10, 2026 | **Cash Deployment — Prod v0** added as the **second consumer of `PL-OPS-09`** (not a new capability). A "Refresh top opportunities" control re-observes the underlyings of the **first 30 rows under the operator's current sort** (deduped, hard-capped at 30 unique symbols) via the existing `forceEvidenceAcquisition(symbols)` path, then triggers the Deployment surface's own snapshot re-read (bounded backoff) so freshness/economics recompute promptly (30s poll remains the safety net). **Zero backend change / no bounce** — the reuse gate held. Motivated by missed morning trades from stale deployment evidence. Investigation found Console and Deployment read the same backend evidence through **different** frontend readers, so each re-reads its own source; recorded as a finding, not unified. Stale-suppression limitation (display-relative window can miss candidates suppressed below it by their own stale economics; sort-key-dependent) preserved under `PL-DEPLOY`/decision-surface, explicitly deferred. New files: `CrossEntryRefreshButton.tsx`, `refresh-top-symbols.ts`; 13 tests added. No new `PL-*` id. Pending Principal working-software review. |
| Sep 10, 2026 | Working-software review of the Cash Deployment refresh surfaced two defects, both corrected. (1) **Generation early-exit bug:** the surface re-read stopped as soon as the snapshot generation advanced — but this appliance publishes generations near-continuously, so it merged an unrelated scheduler publication predating the targeted chains ("refreshed N but age unchanged"). Fixed: run the full bounded backoff, no generation-based early exit. (2) **Completion-timing lie:** added a **per-row `↻` surgical refresh** (one-symbol PL-OPS-09 consumer, `RowRefreshButton.tsx`); its spinner initially stopped when acquisition returned, seconds before the Age visibly updated. Fixed to track **visible-state convergence** (the row's `acquiredAtMs` advancing), stopping **indeterminate** if acquired-but-not-converged within the bounded wait (e.g. 90s provider-cache window). New durable principle promoted: `visual-design-principles.md` #12 (completion indication tracks visible-state convergence, not action completion). Still zero backend change; 18 FE tests total. Principal validated as high operational value. |
| Sep 10, 2026 | **Codex review** of the Cash Deployment refresh accepted; two bounded frontend truthfulness corrections applied (no backend change, no architecture reopened). (1) **Bulk button completion semantics:** it no longer claims `Refreshed N` at POST return — progression `Refreshing…` → `Updating evidence…` → success only when the requested rows' visible provenance advances, else `Refreshed X of Y` / `Not confirmed fresh`. Now enforces the same bounded visible-state convergence as the row control (bound 13s, intentionally > the ~12.5s re-read backoff so it never declares a false partial). (2) **ACQUIRED epistemics:** backend `ACQUIRED` treated as an acquisition disposition only; never translated into `Refreshed N` / `up to date`, and `symbolsAcquired === 0` never implies "already current" — the reported number is the count of symbols whose VISIBLE provenance advanced. Shared `acquiredMs`/convergence helper extracted (`refresh-convergence.ts`); the bounded-timeout closure now reads current provenance via a ref (correctness fix found while testing). Row control behavior unchanged. Principle 12 restated as *completion indication tracks visible-state convergence, but always bounded* (rejects both eternal-spin and stopped-while-stale). Full suite 1429/1430 (sole failure the pre-existing unrelated velvet-rope date-drift snapshot). Accepted Codex's two MINOR timing/`?`-visibility notes as doc/test hardening only, not scope expansion. |
| Sep 10, 2026 | **Rate-limit stewardship boundary verified (Codex).** Question: do the two operator refresh controls (bulk + per-row) risk HTTP 429? Verified NO rate-limit bypass — targeted refresh shares the same single acquisition thread, the same `acquireSymbolTiered` path, the same `RequestPacer` (single-flight, ≤119/60s), the same response cache (exp 5m/quotes 60s/chains 90s), and the same 429 backoff (Retry-After else 60s, classified as throttling not failover) as scheduled acquisition. Governing principle recorded: *force fresh bypasses freshness policy, not provider stewardship.* Residual risk is backlog/delayed-convergence (overlapping ops serialize through one worker/pacer), NOT a 429 spray; under that pressure a truthful bulk `Refreshed X of Y`/`Not confirmed fresh` can occur because work didn't finish in the 13s UI window — a consequence, not a defect. Disposition: observe first (inspect recorded 429s, pacer wait, refresh backlog); only if real pressure appears, coalesce/dedupe pending refresh intentions — never weaken the pacer or add a second rate-limit mechanism. Docs-only closeout; no code change. |
| Sep 10, 2026 | **Cold-start authority correction (roadmap-review docs reconciliation).** Corrects a drift in this file's own chronology: the Sep 9 "Bounded expanded-row (b)-move experiment … retained (not reverted)" row describes work that lives **only on branch `ui/deploy-expanded-row`** and is **NOT merged to accepted `main`**. Its "retained / next step" language describes branch state, not accepted product state; accepted `main` does not contain the expanded-row surface, and `foundations/visual-design-principles.md` principle 11 (the "presence ≠ accessibility" principle referenced by that row) is therefore intentionally absent from `main`. The v1 consequence section that *prompted* the experiment IS on `main`; the expanded-row *response* to it is not. No `PL-*` disposition changes; `PL-DEPLOY` decision-surface work remains exploratory and unauthorized. This row is the append-only correction; the Sep 9 row is left verbatim per journal/parking-lot append-only discipline. |

---

## Java Test-Suite Execution Performance / Execution-Time SLO Review

**Date:** September 13, 2026  
**State:** INTAKE — technology-quality / developer-feedback-loop review; no implementation authorized by this entry

### Intake

During defect diagnosis, the full Java test suite was observed to take long enough that it materially slows the diagnose → fix → review → retest loop.

Before optimizing or enabling concurrency, perform a measured review of where the wall-clock time is actually spent.

The review should determine:

1. per-test and per-class execution-time distribution, including the slowest tests and dominant contributors to total wall-clock time;
2. whether tests contain real sleeps, polling loops, generous timeouts, or other wall-clock waits that could be replaced by fake clocks, deterministic synchronization, or direct state control;
3. whether SQLite/database setup, teardown, fixture construction, Spring context startup, filesystem work, subprocesses, or other integration infrastructure dominates runtime;
4. whether independent tests/classes are unnecessarily serialized and could safely execute concurrently;
5. whether concurrency would compromise isolation, deterministic behavior, shared SQLite/filesystem resources, the always-on appliance, or test epistemics;
6. Gradle/JUnit configuration and lifecycle costs that may be avoidable without weakening coverage.

### Potential quality control

After establishing a reproducible baseline, consider an explicit **test-execution-time SLO / fitness control** rather than relying on a vague expectation that the suite remain fast.

The SLO should distinguish at least:

- the focused developer feedback loop for a bounded change; and
- the complete Java/backend suite used for broader verification.

Any threshold must be based on measured baseline/runtime characteristics before ratification. Consider both total wall-clock limits and visibility/limits for pathological individual tests or classes.

### Guardrails

- Do not optimize by deleting meaningful behavioral coverage or weakening assertions.
- Do not introduce unsafe parallelism merely to improve elapsed time.
- Prefer eliminating artificial waits and unnecessary lifecycle/setup cost before adding concurrency.
- Preserve deterministic tests and isolation.
- Treat execution speed as a technology-quality characteristic because excessive verification latency directly degrades development and incident-response feedback loops.

No execution-time SLO value is ratified by this intake entry. Measurement and review come first.


---

## Java Test-Suite Execution Performance / Verification Economics — September 14 Diagnostic Disposition

**Date:** September 14, 2026  
**State:** CONFIRMED DIRECTION / PRELIMINARY MEASUREMENT — retained under the existing September 13 Java Test-Suite Execution Performance / Execution-Time SLO Review; implementation deferred; no new PL identity created

### Principal concern

The Principal reported that Wheelwright automated testing is too slow and that the verification regime is consuming material elapsed time and AI-agent credits. A report-only Kiro investigation was commissioned to identify bottlenecks, statistics, and recommendations without remediation.

The investigation itself became unusually expensive: roughly an hour of actor wall-clock elapsed while Kiro repeatedly exercised a backend verification surface whose attempted broad runs consumed more than four minutes each. The investigation also continued acquiring evidence after the decision-relevant direction was already clear. This is preserved as direct process evidence of the same verification-economics problem under investigation: exhaustive verification and exhaustive diagnosis both become counterproductive when marginal confidence no longer justifies elapsed time, credits, and Principal attention.

### Findings strong enough to carry forward

1. **A real backend verification-economics problem exists.** Java verification is materially more expensive than frontend verification, and focused/bounded backend verification can complete in single-digit seconds while attempted broad runs consumed more than four minutes.
2. **A concrete long-tail bottleneck exists.** DegradedRecoveryWhileBlockedTest repeatedly required roughly 153 seconds in isolation and contains roughly 149 seconds of explicit Thread.sleep budget. This is the strongest measured bottleneck and does not depend on the contaminated full-suite measurements.
3. **Scheduler/recovery tests are coupled to real elapsed time.** Important acquisition/recovery behavior uses real scheduler cadence, so tests physically wait for asynchronous state transitions. The coverage is valuable; the testability seam, not the behavioral requirement, is the likely engineering target.
4. **Verification breadth appears over-purchased.** Repository/journal evidence supports the qualitative conclusion that broad backend/frontend/typecheck verification has been applied to increments narrower than the evidence purchased. Exact historical frequency was not reconstructed to baseline quality and is not ratified.
5. **Frontend verification is materially cheaper.** Observed frontend runs were on the order of tens of seconds and appeared primarily startup/environment-bound relative to Java. This makes backend recovery timing and verification selection the higher-return concerns.
6. **SQLite/Spring setup did not emerge as the leading bottleneck in the evidence obtained.** This is a bounded negative finding, not a claim that their cost is literally negligible.
7. **Blind Java parallelization is premature.** The dominant slow behavior is timing-sensitive real-scheduler integration work; parallelism should not be used as the first remedy without deterministic isolation evidence.

### Measurement limitations / claims explicitly NOT ratified

The diagnostic did **not** produce a decision-grade performance baseline. Concurrent Wheelwright session activity changed repository HEAD during the investigation, machine load was contaminated, and Kiro itself overlapped/backgrounded multiple Gradle invocations against the same checkout. Several long/full Gradle attempts ended during result collection with NoSuchFileException involving build/test-results/test/binary/in-progress-results-generic.bin.

Therefore the following claims are explicitly **not authority** and must not be repeated as established facts:

- no exact complete-Java-suite runtime or SLO is ratified from the ~259–266 second failed attempts;
- no exact cumulative concentration figure such as “top 5–7 classes = 87%” is ratified because that estimate mixed standalone wall-clock, static sleep budgets, JUnit self-time, and failed-task wall time;
- no “below 60 seconds” target is ratified;
- no exact “~200 seconds reclaimable” figure is ratified;
- no Gradle 9.6.1 defect is established. The transcript shows overlapping diagnostic invocations in the same checkout as a direct confounder; a Gradle defect would require clean reproduction;
- no parallelism change is authorized;
- no Java full-suite execution-time SLO is authorized;
- no claim that frontend-only file edits can *never* require backend verification is authorized. Verification follows affected behavioral surfaces and contracts, not file extensions.

The attempted broad Java runs remain useful as **operational-latency evidence under the observed conditions**, not as clean passing-suite baselines.

### Immediate verification-selection disposition

Wheelwright should use a progressive verification principle:

> **Purchase the minimum sufficient verification evidence for the claim currently being made; escalate breadth as the claim approaches acceptance.**

Working sequence:

1. **Targeted edit loop** — directly affected test/class/file.
2. **Bounded increment** — affected module/package and nearby contracts.
3. **Relevant integration checkpoint** — expensive integration/recovery/provider tests only when the changed behavioral surface warrants them.
4. **Acceptance verification** — broader applicable regression evidence when the increment is ready for acceptance.
5. **Specialized/live validation** — only when the claim requires provider/session/live evidence.

This is not a mechanical file-type rule. Cross-surface contracts can justify broader verification. Verification breadth must be justified by the claim and affected behavior rather than invoked reflexively.

### Deferred engineering target

A future bounded design investigation should determine how acquisition scheduler/recovery behavior can be tested deterministically without waiting for production-scale wall-clock cadence. Candidate approaches may include an injectable scheduling/time seam, virtual-time executor, deterministic synchronization, or another minimal mechanism, but **no implementation approach is selected here**.

Guardrails: preserve meaningful recovery/degrade/self-healing coverage; do not weaken assertions merely to make tests fast; prefer deterministic control over real sleeps where behavior permits; do not generalize new timing machinery unless the observed seam earns it; measure after remediation before considering SLOs or parallelism.

### Future baseline method, only when needed

Do **not** repeat the September 14 measurement marathon merely to improve precision. If a decision later requires an SLO-quality baseline, use a controlled experiment: one isolated checkout pinned to one SHA; exactly one Gradle process touching it at a time; no concurrent actor mutating it; successful complete-suite result required; preserve JUnit XML and extract class and individual-test timings; map every measurement to the SHA under test; repeat only enough to characterize meaningful cold/warm variance.

### Methodology ratchet

The investigation exposed a conformance lesson that belongs with the September 14 actor contract rather than a new governance framework:

> **When measurement conditions become contaminated and existing evidence is already sufficient to make the next bounded decision, stop measuring, disclose the limitation, and move forward.**

Operationally: **stop purchasing evidence when additional evidence is no longer likely to change the next decision.** This instantiates the existing contract: *Find freely. Block narrowly. Defer explicitly. Observe quickly. Ratchet what reality proves.* It does not create another framework, score, ceremony, or gate.

### Disposition / authorization

**Persist and defer implementation.** Verification economics and the real-time scheduler/recovery bottleneck are sufficiently confirmed to justify future action. Exact suite-performance baseline, SLOs, Gradle-defect attribution, and parallelism remain unestablished or unauthorized.

**No remediation is authorized by this entry tonight.** The next implementation session may first apply the verification-selection discipline and separately undertake a bounded design investigation of deterministic scheduler/recovery testing. A new exhaustive diagnostic is not a prerequisite.

---

## `PL-ELIG` — Unencumbered Shares on the Operator Console (V1 contract, accepted; implementation not yet authorized)

**Date:** September 14, 2026
**Canonical owner:** `PL-ELIG` (Deployment Eligibility / Capacity Explanation — base record in `docs/parking-lot.md`; held/encumbered/free shares, executable contracts, collateral, exclusion reasons). This is the **first direct standalone free-share inventory realization on the Operator Console** — not the first realization of `PL-ELIG` generally.
**Strategic relationship:** `LVT-INIT-CAP-AVAILABILITY` (within `LVT-BET-CAPITAL-CHOICES`, `docs/roadmap.md`).
**Accepted design authority:** Operator Console architecture (`docs/26-operator-console-architecture.md`).
**Future-only context (NOT a dependency):** `PL-DEPLOY`.
**State:** V1 **IMPLEMENTED and pushed to `main`** (Sep 14, 2026, commit `a129fe1`) under explicit overnight implementation authorization. Contract was ACCEPTED by Principal after multi-actor (Kiro/Codex) reconciliation. **No new `PL-*` identity created.** Implementation is frontend-only and additive; matches this contract. **Principal visual/product acceptance still pending** (implemented without interactive supervision — engineering visual validation only; see journal Sep 14 implementation entry).
**Observed/derived at:** SYNC `248a4692efc27ef80f2a3545c00149bbdca713fe` (contract); implemented from SYNC `af5c8404c5b4180fd4f62c1ca1aa1bd733d7ad0a`.

### Implementation record (Sep 14, 2026 — commit `a129fe1`)

Implemented exactly as specified. Files: `options-prototype/src/portfolio/unencumbered-inventory.ts` (pure projection `{ rows, geometryWarnings }`), `options-prototype/src/operator-console/UnencumberedInventory.tsx` (region component) + region CSS in `operator-console.css`, wired into `OperatorConsole.tsx` above `oc-region-ladder`; tests `tests/portfolio/unencumbered-inventory.test.ts` (18) + `tests/operator-console/unencumbered-inventory-region.test.tsx` (7). Full frontend suite 1571/1572 (sole failure = pre-existing unrelated velvet-rope date-drift snapshot, confirmed on clean `main`). No backend/ingestion/contract change; no out-of-scope functionality; `capacity-summary.ts` untouched. **Implementation choice recorded:** for a trustworthy zero (evidence usable, no free shares) the region renders a truthful "No unencumbered shares." empty state rather than collapsing silently — chosen to keep State 2 distinguishable from State 1 (evidence unavailable/incomplete) as the three-state contract requires. This is a presentation-level choice permitted by the contract; it does not alter the accepted design.

### Problem this solves

The Operator Console makes open option positions highly visible through the DTE ladder, but **unencumbered owned shares are effectively invisible** there. Free-share inventory is currently derivable only *indirectly*, as a byproduct of Deployment's covered-call candidate generation (`recommendCalls` filters `maxAdditionalContracts > 0`). A recommendation surface should not be where the operator infers what capital they already own and have free. The Console should answer, directly: *what capital do I have available right now, and what is already committed through options?*

### Accepted product direction

Unencumbered owned shares become **first-class current portfolio state on the Operator Console, above and separate from the DTE ladder**:

- **Top of Console = current portfolio state / available inventory.**
- **DTE ladder = option-encumbered capital distributed through time** (unchanged, still the encumbered option-position surface).

Shares must **not** be inserted into the DTE ladder (the ladder's semantics are temporal: expiration, DTE, strike, contracts, moneyness, Greeks, assignment consequence — none of which apply to unencumbered shares). Free-share visibility is **portfolio-state observability, not recommendation behavior**.

### Exact V1 UI

Region title: **Unencumbered Shares** (NOT "Portfolio State", "Immediately Available Capital", or any name implying a new additive capital primitive).

Columns, exactly three:

- **Symbol**
- **Free Shares**
- **Free Lots**

Plus a region-level Option Summary provenance/readiness line.

```
UNENCUMBERED SHARES
  Symbol       Free Shares       Free Lots
  COPX         100               1
  XYZ           50               0
  Fidelity Option Summary · exported <optionSummaryExportTimestamp | "Export time unavailable">
  [ evidence warning(s) if any ]
──────────────────────────────────────────
  [ existing DTE ladder — unchanged, separate ]
```

Odd lots remain visible even when Free Lots = 0 (e.g. 50 free / 0 writable lots). Deployable Cash is **omitted** from this region — it is already persistently visible in the application shell; do not duplicate it here.

### Share semantics (do NOT describe as authoritative)

> **Free Shares** = snapshot-derived free shares based on observed Fidelity Option Summary ownership and open short-call geometry.

The computation is deterministic; the underlying ownership evidence is **not** universally authoritative or complete.

Current derivation source of truth (unchanged, read-only): `deriveInventory()` in `options-prototype/src/write-desk/fidelity-snapshot.ts`, producing per-symbol `InventoryPosition { sharesOwned, sharesEncumbered, sharesFree, maxAdditionalContracts, economics }` on `PortfolioSnapshot.inventory`, where:

- `sharesEncumbered = min(Σ |shortCall.quantity| × 100, sharesOwned)` (clamped)
- `sharesFree = max(0, sharesOwned − sharesEncumbered)`
- `maxAdditionalContracts = floor(sharesFree / 100)`

### Pure projection (result shape)

A new pure presentation-layer projection over the snapshot (proposed `options-prototype/src/portfolio/unencumbered-inventory.ts`), returning conceptually:

```ts
interface UnencumberedInventoryResult {
  rows: UnencumberedInventoryRow[];
  geometryWarnings: InventoryGeometryWarning[];
}

interface UnencumberedInventoryRow {
  symbol: string;
  freeShares: number;   // = InventoryPosition.sharesFree  (NEVER sharesOwned)
  freeLots: number;     // = InventoryPosition.maxAdditionalContracts = floor(sharesFree / 100)
}

interface InventoryGeometryWarning {
  symbol: string;
  observedSharesOwned: number | null;   // null = ownership evidence unavailable
  rawCallRequiredShares: number;        // Σ |openCall.quantity| × 100 (pre-clamp)
  provenance: {
    optionSummaryFilename?: string;
    optionSummaryExportTimestamp?: string;
    optionSummaryParsedAt?: string;
  };
  explanation: string;                  // non-normative, descriptive only
}
```

Rows: one per `InventoryPosition` with `sharesFree > 0`. Geometry warnings are **independent of rows** (they are properties of the inventory evidence, not of any visible free-share row).

### Geometry analysis (union domain; nullable ownership)

Geometry analysis MUST iterate over the **union** of:

```
inventory symbols  ∪  existing open-call underlyings
```

Do **not** analyze only symbols that have an `InventoryPosition`. `observedSharesOwned` MUST be nullable.

Emit an `InventoryGeometryWarning` when either:

1. an underlying has open short calls but **no corresponding inventory ownership record** → `observedSharesOwned = null`, meaning **"ownership evidence unavailable"** — which MUST NOT be silently converted to zero shares owned; or
2. **raw call-required shares exceed observed shares owned** (`rawCallRequiredShares > observedSharesOwned`).

The existing encumbrance clamp is **safety behavior**, not proof that ownership evidence and call geometry reconcile. When geometry disagrees, the clamp still yields a safe free-share display (0/absent), but the disagreement is surfaced as a warning rather than presented as a truthful zero.

### Evidence / readiness semantics (absence of evidence ≠ evidence of absence)

The pure projection owns only `rows` + `geometryWarnings`. The Console presentation composes those with the existing `SnapshotReadiness` status, the **complete** existing snapshot readiness warnings, and Option Summary provenance. Do **not** invent fragile substring-based filtering of readiness warnings for V1 — use the overall readiness status plus the complete existing warnings.

The presentation MUST distinguish at least three states:

1. **inventory evidence unavailable / incomplete**;
2. **evidence usable and no unencumbered shares** (trustworthy zero);
3. **one or more unencumbered-share rows**.

Unavailable/incomplete evidence MUST NOT render indistinguishably from a trustworthy zero-free-share state.

Region visibility rule (conceptual):

```
show region when:
    rows exist
    OR geometryWarnings exist
    OR inventory evidence is not trustworthy
```

For trustworthy evidence with zero rows and zero warnings, whether the region collapses or shows a truthful "No unencumbered shares" state is an implementation-level presentation choice unless accepted architecture requires otherwise.

### Provenance semantics

Share-inventory provenance uses **Option Summary provenance only** (never balances provenance, never `snapshotDate` as the inventory observation/export time):

- `provenance.optionSummaryExportTimestamp`
- `provenance.optionSummaryFilename`
- `provenance.optionSummaryParsedAt`

Fallback: if the export timestamp exists, identify the Option Summary source and export time; if absent, explicitly state **"Export time unavailable"**. Parse time may be displayed as parse time but MUST NEVER be presented as broker observation/export time.

### Behavioral tests required by the eventual implementation

Every geometry test must state: observed ownership (including `null`), raw call-required shares, stored/clamped encumbrance where applicable, expected free shares, expected free lots, and expected warning state.

- projection emits exactly `InventoryPosition.sharesFree`, never `sharesOwned`;
- `sharesFree > 0` produces a row even when `freeLots = 0` (odd lot visible);
- `sharesFree === 0` produces no free-inventory row;
- consistent geometry: `rawCallRequiredShares + displayedFreeShares === observedSharesOwned`;
- inconsistent geometry (raw call-required > observed owned): do NOT assert reconciliation; emit a warning;
- open-call underlying with no inventory record: emit an **ownership-evidence-unavailable** warning (`observedSharesOwned === null`);
- standalone inventory never presents owned or encumbered quantities as free inventory;
- inventory visibility independent of call recommendations and option-chain availability;
- presentation remains visible when rows exist, geometryWarnings exist, OR inventory evidence is not trustworthy;
- incomplete/unavailable evidence cannot look like trustworthy zero inventory;
- provenance fallback never substitutes parse time for export time.

Worked examples (consistent geometry):

| Owned | Open calls (raw req) | Clamped enc | Free shares | Free lots | Row? | Warning? |
|---|---|---|---|---|---|---|
| 200 | 1 (100) | 100 | 100 | 1 | yes | no |
| 200 | 2 (200) | 200 | 0 | 0 | no | no |
| 150 | 1 (100) | 100 | 50 | 0 | yes (odd) | no |
| 250 | 1 (100) | 100 | 150 | 1 | yes | no |
| 100 | 2 (200) | 100 | 0 | 0 | no | yes (raw 200 > owned 100) |
| none | 1 (100) | — | — | — | no | yes (`observedSharesOwned = null`, ownership evidence unavailable) |

### Likely implementation files (when implementation is separately authorized)

- **New:** `options-prototype/src/portfolio/unencumbered-inventory.ts` (pure projection + geometry warnings).
- **New test:** `options-prototype/tests/portfolio/unencumbered-inventory.test.ts`.
- **Modify:** `options-prototype/src/components/OperatorConsole.tsx` (render region above `oc-region-ladder`; small `UnencumberedInventory` presentational subcomponent reading `usePortfolio()` + `SnapshotReadiness` + Option Summary provenance).
- **Modify (styling):** the Console CSS owning `oc-region-*` (add `oc-region-inventory`).
- **New/modify test:** Console render tests (visibility / three-state distinction / provenance / warning).
- **Read-only, untouched:** `write-desk/types.ts`, `write-desk/fidelity-snapshot.ts`, `write-desk/demo-snapshot.ts`, `portfolio/use-portfolio.ts`. No backend, no ETag/snapshot contract, no ingestion change.

### Explicitly out of scope for V1

Market value; basis; unrealized G/L; recommendations; Hold/Sell/Call/Collar; click-through/navigation; actions; Share Deployment; unified Capital Deployment; new accounting totals; new scoring/ranking; broker execution; a generalized capital-state machine; Deployable Cash on the Console (stays in shell); live/spot re-valuation; DTE-ladder changes; use or wholesale resurrection of `capacity-summary.ts`.

> **Authorized expansion (Sep 14, 2026, commit `5c01175`).** The Principal explicitly authorized adding columns beyond the original exclusion list: **Spot**, **Today's G/L**, **Capital**, **Share Basis**, and **Freshness**. This intentionally reverses part of the original exclusion list (market value / basis / today's-G/L / live valuation). It was accepted with the following truthfulness constraints, which remain binding: **Capital = Free Shares × live Spot** (market value of the free shares; shown only when spot exists; NOT folded into any account total or new capital primitive); **Today's G/L = the underlying's intraday move** (market context, same honest semantics as the ladder — NOT a position mark-to-market P/L); **Share Basis = `economics.averageCostPerShare`, a symbol-level BLENDED average** (Principal-accepted), labeled blended so it is never mistaken for a free-lot-specific basis (`PL-PORT-01` remains the lot-attribution concern); **Spot / Today's G/L / Capital / Freshness render "—" for a purely free-held symbol** (owned, no open option → not in the Console observation set) rather than fabricating values. The pure projection (`unencumbered-inventory.ts`) is unchanged and still owns the inventory core; live-evidence mixing is confined to the presentation component. Still out of scope: recommendations, navigation/actions, Deployable Cash duplication, new accounting totals, DTE-ladder changes, and `capacity-summary.ts`.

### `capacity-summary.ts` disposition

`options-prototype/src/portfolio/capacity-summary.ts` is **dormant** — verified at SYNC `248a469`, its only non-comment importer is its own test; no rendered surface consumes it. Its `callCapacity` gate (`sharesFree > 0 && maxAdditionalContracts > 0`) would additionally **hide odd lots**, which V1 must not do. Therefore it is **kept out of the V1 implementation path**; V1 uses a fresh, correctly-gated projection. Recommended separate Technology-Quality disposition: **candidate for delete** (with its test) pending a reverse-dependency sweep confirming no live consumer — handled as its own cleanup, not this feature. No defect is asserted beyond dormancy + odd-lot mis-gating.

### Authority attribution (corrected)

- **State-Oriented Console** (`foundations/state-oriented-console.md`) supports the **general principle**: the Console shows observable portfolio context / "what is."
- **Operator Console architecture** (`docs/26-operator-console-architecture.md`, §Capacity / Exposure Summary) is the document that **explicitly requires** "Unencumbered/available capacity (buying power, free shares)." The explicit free-share requirement is attributed here, not to State-Oriented Console.

### Doc 26 reconciliation performed alongside this record

Doc 26 §Implementation Status previously claimed the Capacity/Exposure summary + `capacity-summary.ts` sidebar were currently implemented on the Console. That is stale — the committed Console (SYNC `248a469`) renders only the DTE ladder + footer; the persistent capital surface is the AppShell triad. The narrow Category B correction is applied in the same durability commit as this record (stale-status correction + recording the accepted standalone-inventory-above-the-ladder boundary at the appropriate authority level).

### Authorization gates (four distinct; one does not imply the others)

1. **Implementation authorization** → working-tree implementation + tests + local validation only.
2. **Category B documentation amendment authorization** → the narrow Doc 26 correction is authorized as part of this durability operation; broader Category B change is not.
3. **Commit authorization** → separate; passing tests do not authorize commit.
4. **Push / accepted-`main` advancement authorization** → separate; requires re-verifying remote `main` first.

The durability operation that created this record was explicitly authorized (persist under `PL-ELIG` + narrow Doc 26 correction + journal reconciliation + commit + push). **Production implementation of the feature was NOT authorized by that operation.**

### Readiness

**READY FOR IMPLEMENTATION AUTHORIZATION** when the Principal chooses to proceed. Scope is minimal, additive, frontend-only; owned by canonical `PL-ELIG`; grounded in the Operator Console architecture's explicit free-share requirement; decoupled from recommendations/chains/Deployment; introduces no new totals or valuation; uses correct Option Summary provenance; treats snapshot inventory as deterministic-but-not-authoritative evidence; and preserves ownership-vs-call-geometry disagreement (including missing ownership records) as independent warnings rather than false reconciliation.

---

## `PL-MKT` — Provider timesales as an appliance-sourced UI data source (Markets glance + high-resolution moneyness sparklines)

**Date:** September 15, 2026
**State:** INTAKE — new canonical identity; two bounded capabilities SHIPPED under it (Markets card + timesales-backed sparklines); further use requires its own reconciliation.
**Concept home:** `07-architecture-current.md` (Evidence Appliance boundary), `26-operator-console-architecture.md` (Operator Console surfaces), `foundations/state-oriented-console.md`.
**Related:** `PL-EVID-01` (historical/observation architecture — timesales is provider-derived bars, NOT written to `spot_history`); acquisition-scheduler policy (unaffected — this is a read-through market-context fetch, not an acquisition tier).

### What this is

A durable identity for using **Tradier `/markets/timesales` intraday bars** as an appliance-sourced data source for **presentation/market-context** on operator surfaces — distinct from the options-chain acquisition pipeline that produces `spot_history`. Two capabilities were built under it:

1. **Markets header glance** (`GET /api/markets`, commit `b998bbe`): Dow (`$DJI`) / S&P 500 (`SPX`) / Nasdaq 100 (`NDX`) — real index value + provider daily change/% (quote) + intraday sparkline (timesales). Real index values, appliance-sourced, no frontend provider call.
2. **High-resolution moneyness sparklines** (`GET /api/evidence/timesales`, this work): the Operator Console position table's moneyness sparkline is now derived from the underlying's timesales intraday bars (dense, ~56 pts/session) instead of the sparse `spot_history` (one point per chain acquisition). The strike is fixed, so a dense spot series → a dense moneyness curve; only the sparkline SHAPE uses timesales — the moneyness value cell and Today's G/L remain on observed `spot_history`.

### Corrected premise (durable — do not repeat the error)

An earlier session asserted, unverified, that Tradier's plan "can't serve indices." **Wrong.** Direct probe confirmed Tradier **production** serves `SPX`/`$DJI`/`NDX` quotes AND timesales bars (and timesales for ETF underlyings like COPX/XLE/URA/GDXJ). `IXIC`/`COMPX` don't resolve — Nasdaq is served as `NDX` (Nasdaq-100). Dow is `$DJI` (no options chain — irrelevant here, since quote+timesales need no chain).

### Architecture disposition

- **Boundary preserved.** Timesales is fetched **backend-side** through the active provider authority + pacer (rate-limit compliance, credential custody), exposed via cached read endpoints (`/api/markets`, `/api/evidence/timesales`), consumed by the browser as a pure viewport. NO frontend provider calls — no exception to the ratified invariant was needed.
- **Not persisted.** Timesales bars are a live market-context read; they are NOT written to `spot_history` (keeps "persist facts; derive trust" clean — observed evidence stays observed). Provenance distinction: `spot_history` = our observations; timesales = provider-computed bars.
- **Not in the frozen snapshot contract.** Distinct market-context reads.
- **Provider stewardship.** Per-symbol short server-side TTL (60s) so many positions/clients cannot spray the provider; single-flight through the pacer; capped fan-out (`MAX_SYMBOLS`). Cost is ~1 timesales call per distinct held underlying per TTL window — far cheaper than raising acquisition cadence.
- **NOT an acquisition-scheduler change.** The "Class Omega / faster held-symbol cadence" idea was considered and **dropped** for this purpose: timesales-backfill gives the resolution cheaply without touching the A/B/C/D tiers or the rate budget. (Whether held symbols deserve a fresher *quote/greek* tier remains a separate, unraised question — not part of `PL-MKT`.)

### Epistemic / open

- **Two spot sources on one screen** (observed `spot_history` for numbers; provider timesales bars for the sparkline shape) — intentional and bounded; the numeric cells keep observed-evidence provenance.
- Bar field = `close` (so the latest point aligns with current). Off-hours → empty series → flat baseline, never fabricated.
- Future timesales UI uses should reconcile under `PL-MKT` rather than minting new identities.

---

## `PL-DEPLOY-EXPORT` — Deployment "Export Everything": complete machine-consumable Deployment evidence export (AI-advisor experiment is first consumer)

**Date:** September 16, 2026 (refined same day after Codex review of the amendment against accepted Deployment/export code)
**State:** INTAKE — new canonical identity created at this record. Strategic Reconciliation (§3) and Architectural Reconciliation (§4) NOT yet performed; not RECONCILED; not decomposed; not authorized for implementation.
**SYNC at intake:** `5d1bf40c576630c2dbe94d9e541bd8735081907b`
**Reconstruction-before-creation:** the complete `docs/parking-lot*.md` sequence was reconciled first; no existing item owns a unified Deployment evidence-export capability (no `PL-EXPORT`/`PL-DEPLOY-EXPORT` existed; `PL-DEPLOY` is the composition concept home, `PL-PROD-EXPORT` is Production-accounting export, not Deployment). A new stable identity was therefore minted, mapping — not re-owning — the intersecting items below.
**Concept home:** `PL-DEPLOY` (Deployment Opportunity / unified surface — Deployment is the canonical operator-facing name for WriteDesk). This item is the Deployment **evidence-export** capability; `PL-DEPLOY` remains the opportunity/composition concept home.

### 1. What was discovered / what this is

A concrete Wheelwright **product capability**: a single top-level Deployment action — a button labeled **Export Everything** at the top of the Deployment page — that produces **one CSV file** containing the **complete** Deployment table evidence across all Deployment row types/strategies (CSP, covered calls, buy-writes, cross-entry, and any contingent-call surface), using a **stable superset schema** with enough identity columns (at minimum row-type / table / strategy) to make heterogeneous rows unambiguous. Non-applicable fields for a given row remain **empty** (never fabricated).

For the bounded AI-advisor experiment, that unified export additionally carries the previously Principal-ratified **evidence enhancement**: the full five raw provider greeks (delta, gamma, theta, vega, rho), `midIv`, `smvVol`, separate observation-quality/classification semantics, `greeksUpdatedAt`, authoritative chain-acquisition provenance/age, and the existing candidate economics and Deployment information applicable to each exported row.

**"All table data" — meaning of "Everything" (refined after Codex review):**

- **Presentation completeness (settled at intake):** the export must NOT be limited by presentation mechanics — viewport/display limits, "Show N" counts, collapsed sections, row selection, or any other presentation-only truncation. It is the complete rows and columns belonging to the Deployment page's tables, not the lowest-common-denominator column subset of today's per-table exporters.
- **Substantive filter semantics (UNRESOLVED — do NOT decide at intake):** whether "Export Everything" also overrides *substantive* Deployment filters (search, strategy filter, DANGER visibility, and other filters that change the meaningful candidate population rather than merely its presentation) is an **open product question**, recorded in §5. Intake must not silently pick either interpretation. `BUG-017` and existing per-table export semantics bear on this and do not, by current authority, decide it. The intake explicitly distinguishes **presentation completeness** (settled) from **substantive population/filter semantics** (open).

**Multiple-population membership is evidence, not duplication (refined after Codex review):** Deployment is not a single table. One opportunity can legitimately appear in more than one population (e.g. a CSP appears in the puts table AND as a `CrossEntryRow` with `originalPut` set). One CSV does NOT mean one canonical row per opportunity, and does NOT license silent deduplication. The unified schema must carry sufficient identity/context (`tableId` / `rowType` / strategy / entry-mechanism, or equivalent) to make each heterogeneous row unambiguous and to preserve legitimate multi-membership. Contingent-call rows must retain their **originating-put context** (underlying/strike/expiration) needed to interpret an `if-assigned` row.

**Evidence coherence — export is a capture, not a refresh (refined after Codex review):** activating the export must NOT trigger provider acquisition, recommendation reevaluation, candidate-population regeneration, or the joining of newer cache observations onto older candidate rows merely because export was requested. It captures the represented table datasets while retaining available run/generation and acquisition provenance for each row/population. Export time may be captured once where an age calculation needs "now," but each row retains its own authoritative chain-acquisition provenance. **One CSV does NOT imply one common evidence generation or one shared acquisition instant across rows** — no stronger generation coherence is claimed than current evidence proves. For the later A/B experiment, both arms use the identical frozen exported population/evidence; the IV-disabled arm differs ONLY by omission of the selected IV fields/metadata and must not regenerate candidates.

### 2. What triggered it

The four-actor discussion (Principal, ChatGPT, Codex, Kiro) on enriching the AI-advisor evidence packet with greeks + provider IV. The Principal then amended the requirement **before** durable intake: rather than many per-table exports feeding an "AI packet," add one **Export Everything** capability whose unified CSV is the canonical machine-consumable artifact, with the AI experiment as its first consumer. The amendment reframed the primary durable concept from "AI-Advisor Evidence Packet" to "Deployment Evidence Export capability." Codex then reviewed the amendment against accepted Deployment/export code and surfaced four ambiguities (presentation vs substantive-filter completeness; multi-population membership vs dedup; evidence-coherence/no-refresh-on-export; verified population set) — all incorporated above and below without reopening the ratified evidence semantics.

### 2a. Deployment populations reconciled against accepted code (SYNC `5d1bf40`)

Verified from accepted `main` (not from the prompt). The Deployment page composes these distinct row/population types, each a scope obligation for "Everything":

- **CSP (puts)** — `PutCandidate[]` → puts table (`WriteDesk.tsx`), export via `table-csv-export.ts`.
- **Covered calls** — `ExecutableCallRow` (`CallCandidate[]`), calls table.
- **Contingent calls** — `ContingentCallRow` (`availability: "if-assigned"`, `write-desk/contingent-calls.ts` + `call-table-row.ts`), a live surface with its own `ContingentCallBrief`. Conditioned on an **originating short put**; carries `originatingPut` (underlying/strike/expiration) and `contingentShares`. This context MUST survive export. `CallTableRow = ExecutableCallRow | ContingentCallRow`.
- **Buy-writes** — `BuyWriteCandidate[]`, buy-write table.
- **Cross-entry** — `CrossEntryRow` (`write-desk/production-v0.ts`, `CrossEntryStrip.tsx`) mixing `entryMechanism: "csp" | "buy-write"` with `originalPut`/`originalBuyWrite` back-references. Has its own diagnostic `buildCrossEntryExport` (complete population) distinct from the display-capped `buildCrossEntryRows`.

Existing per-table exporters each emit only their own schema and only a delta greek column; the diagnostic and funnel exports have yet other schemas. Export Everything **adds a unified table-evidence artifact**; removal or replacement of existing table, diagnostic, funnel, or other exports is **outside this intake**.

### 3. Why it might matter

- Immediate product value to the human operator: one click yields the complete Deployment evidence instead of exporting each table separately and stitching heterogeneous schemas by hand.
- Enables the bounded AI-advisor experiment (A/B by IV-column omission on one frozen candidate/portfolio population) without architecting an AI-specific API or prompt artifact.
- Surfaces already-authoritative-but-currently-dropped evidence (four of five greeks are lost in the frontend candidate projection today; provider IV is discarded at backend normalization today).

### 4. Related concepts / items (mapped dependencies & intersections — reconcile, do not duplicate ownership)

- **`PL-DEPLOY`** — concept home (Deployment Opportunity / unified surface). `PL-DEPLOY-EXPORT` is a child export-capability under it; it does NOT restate `PL-DEPLOY`'s composition concern as its own authority.
- **`PL-EVID-04`** (Market-Priced Risk) — a **related** concern whose historical IV data-source limitation ("Needs IV data source (Tradier sandbox lacks IV)") requires reconciliation. The finding that Production Tradier supplies `mid_iv`/`smv_vol` via the existing `greeks=true` request bears on that limitation. **Final ownership/decomposition of the provider-IV evidence capability remains a §3 Strategic / §4 Architectural Reconciliation decision** — not pre-decided during §2 intake.
- **`PL-EVID-MVPTA`** — owns a broader deployment-quality evidence *experiment* + IV-remembered-over-time program. This item is a **bounded, point-in-time export slice**, explicitly distinct from MVPTA's broad technical-analysis program (OHLCV/ATR/realized-vol/support-resistance). Mapped to prevent competing ownership; this item does NOT create IV-history or TA machinery.
- **`PL-EVID-AGE`** — the export's authoritative `chainAcquiredAt` age/provenance columns are exactly this item's provenance concern (ADR-015 conformance; engines consume provenance, do not create it).
- **`PL-COHERE-01`** — the "classification vs presentation" consumer seam (evidence-state classification owned separately from human display) is a coherence concern; mapped as intersection.
- **`PL-ARCH-06`** — Recommendation Engine Ownership (transitional, browser-local). The greek projection / packet construction occurs in the browser recommendation path; this is pressure/evidence only and does NOT force relocation.
- **`BUG-017`** (Deployment CSV export may inherit presentation row limit) — directly on-point and bears on the unresolved filter question: it asserts that *substantive* filters (strategy, symbol/search, DANGER, other candidate-selection filters) remain authoritative for export scope while *presentation-only* row limits must not truncate. This supports the intake's presentation-vs-substantive distinction but does not by itself decide whether "Export Everything" overrides substantive filters. Cross-linked as the concrete defect; `BUG-017` remains authoritative for the defect, `PL-DEPLOY-EXPORT` authoritative for the capability. Not double-booked.
- **`BUG-016`** (funnel aggregate counts lack exportable membership — Resolved) — precedent for per-unit exportable Deployment evidence and the funnel-CSV `COMMON_COLUMNS` pattern; informs the superset-schema design.
- **`BUG-011`** (exact-zero Delta indistinguishable from absent — Open; Principal-required regular-session control) — cross-linked for context ONLY. This item is designed to preserve the raw-observation-vs-absence distinction (raw value + separate quality channel) so it does not worsen BUG-011. **This item does NOT resolve BUG-011 by implication.**
- **ADR-013** (fact-to-interpretation boundary / Epistemic Integrity) and **ADR-015/016/017** (authority-preservation spine: transformation does not create semantic authority; the frontend may compute what to display but not decide what facts are authoritative) — govern, at the principle level, the ratified raw-observation-vs-presentation decision. Whether a new ADR is warranted (provider-IV-as-evidence semantics; "evidence export is a distinct consumer preserving raw + separate classification") is an **Architectural Reconciliation (§4) determination**, not decided here.
- **Evidence Snapshot Contract v1** — five greeks already documented as additive nullable fields (no version bump). Provider IV (`midIv`/`smvVol`/`greeksUpdatedAt`) is NOT documented and would require an additive-nullable contract amendment (INV-PUB-05, no version increment) — a §4 concern.
- **September 11, 2026 journal** (secondary-greeks entry): why-state (not authority) that four secondary greeks are threaded end-to-end into snapshot/cache and that a shared Greek domain (`option-greeks.ts`) exists. Governing principle for this export: *reuse shared Greek definitions and appropriate presentation utilities where relevant; machine-consumable export values must preserve raw provider observations and bypass the zero-to-unavailable presentation sanitization.* The September 11 journal is why-state, not authority to collapse a provider zero in the export — it does not become a binding fitness constraint that would contradict the ratified raw-evidence requirement.
- **Existing Deployment export implementations:** `options-prototype/src/write-desk/table-csv-export.ts` (`downloadTableCsv`), per-table column arrays in `WriteDesk.tsx` and `CrossEntryStrip.tsx`, the diagnostic `production-v0.ts` `CrossEntryExportRow`, and the funnel `funnel-export/funnel-csv.ts` — reference implementations/precedent for the unified artifact. Their removal or replacement is outside this intake.

### 5. What is unresolved

- **Substantive-filter semantics (explicit open product question):** does "Export Everything" export everything satisfying the operator's *current substantive filters* (search / strategy / DANGER / other candidate-population filters), or literally everything regardless of those filters? Presentation-only truncation is settled (never truncate); substantive filters are undecided. Current authority (incl. `BUG-017`, which asserts substantive filters remain authoritative for export scope while presentation limits must not truncate) does not fully decide the "override substantive filters too?" question. To be resolved as a §3/§4 + Principal product decision; must not be silently chosen in implementation.
- **Multi-population membership representation:** the exact identity/context columns (`tableId`/`rowType`/strategy/entry-mechanism) and how a single opportunity's legitimate presence in multiple populations (e.g. puts table + cross-entry) is represented without silent dedup.
- The stable superset-schema column set and the row-identity columns (row-type/strategy) needed to disambiguate heterogeneous rows.
- The precise durable quality-tag vocabulary (candidate: `provider-reported` / `provider-exact-zero` / `provider-all-zero-vector` / `absent`) and its ratified epistemic ceiling. `provider-reported` (preferred over `ok` because it stays closer to observation than evaluation) means *the provider supplied a finite nonzero numeric observation; it does not certify accuracy, freshness, economic validity, or suitability*. A tag states the observed condition; it must NOT decide that a lone provider `0.0` means genuine-zero OR unavailable — that remains unresolved under BUG-011. Preserved semantics: exact provider zero stays numeric zero; `provider-exact-zero` is observation classification, not interpretation; any all-zero-vector annotation is a separate contextual/vector classification; missing/unavailable (`absent`) is classified separately; nothing here implies BUG-011 is resolved.
- Authoritative Tradier/ORATS semantics of `mid_iv` vs `smv_vol` (fixture presence/values verified: `mid_iv=1.5178`, `smv_vol=0.833` for GDXJ 129C 0-DTE; definitions require primary-source confirmation).
- Durable field name/semantics for the provider timestamp (`greeks.updated_at` preserved verbatim, zone-unspecified; do not invent timezone or append `Z`).
- Whether a new ADR is required or the existing ADR-013/015/016/017 spine already governs (a §4 decision).
- Identity/ownership boundary: where the provider-IV evidence capability finally lives (a refinement of `PL-EVID-04`, a sub-slice under this item, or another split) and whether the five-greek projection is a `PL-DEPLOY` sub-slice — all deferred to §3/§4 + Principal decision, not pre-decided here.

### 6. What is explicitly NOT authorized yet

No implementation of Export Everything, greeks projection, IV preservation/backend normalization change, snapshot-contract amendment, candidate-type change, CSV change, BUG-011 remediation, or any resolution of the substantive-filter-semantics question. No change to Wheelwright candidate selection, ranking, posture, governance, eligibility, or recommendation policy (greeks + IV are evidence/presentation only). Export must not trigger acquisition, recommendation reevaluation, or candidate regeneration. No AI-agent API, prompt interface, local IV calculation, `bid_iv`/`ask_iv`, IV Rank/Percentile/historical-vol, or news/Fed/calendar ingestion. Absolute IV must not be represented as a relative-richness measure. Detailed superset-schema design belongs to later reconciliation/decomposition, not intake. Intake does not authorize implementation.

### 7. Where the richer evidence / why-state lives

Four-actor discussion history (this pipeline); the September 11, 2026 secondary-greeks journal entry (`docs/journal/project-journal-3.md`); the snapshot contract v1 additive-greeks section; `BUG-011`, `BUG-016`, `BUG-017` records. A dedicated richer discovery document is not required at intake; if produced later it links back to this `PL-DEPLOY-EXPORT` identity and does not become a parallel registry.

### Pipeline state

**DISCOVERED → INTAKE (this record).** Next canonical stage: **§3 Strategic Reconciliation** against `docs/roadmap.md`, then **§4 Architectural Reconciliation** against `docs/architecture-roadmap.md` / ADRs / snapshot contract, culminating in a **Reconciliation Completion Record** before the item is RECONCILED. Per the amended actor instruction, intake stops here; Strategic Reconciliation is not performed in this step.
