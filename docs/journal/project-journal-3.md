# Options Prototype — Project Journal, Continuation 3

> Logical continuation of `docs/journal/project-journal.md` and `docs/journal/project-journal-2.md`.
>
> The project journal is one append-only Category C chronology across physical continuation files. This file preserves the same authority, purpose, chronology, and journal rules.

---

## 2026-09-09 — Reliability classes before service boundaries

### Context

A service outage prompted the Principal to revisit Wheelwright's future cloud reliability model. The initial intuition was not to decompose Wheelwright broadly into microservices, but to ask whether different parts of the system deserve different reliability levels or failure domains.

The concrete example was the market-evidence path: a relatively feature-stable component dedicated to gathering market information, especially during open sessions, and keeping the durable evidence store populated. A second component might eventually expose the APIs needed by the frontend. The motivation was continuity of market truth rather than service decomposition for its own sake.

### Repository reconciliation

Current authority already establishes several relevant facts:

- Wheelwright is an always-on evidence appliance.
- Evidence acquisition operates independently of browser sessions.
- The backend is the single acquisition authority and owns provider communication, session-aware scheduling, evidence maintenance, persistence, and validity.
- Current accepted cloud direction is deliberately simple: one always-on Spring Boot service, one instance, SQLite on persistent disk, acquisition worker and HTTP API in the same process.
- The retooling charter and Technology Quality Constitution both require new services, infrastructure, topology, and complexity to be earned by demonstrated architectural pressure rather than introduced speculatively.

The reliability discussion therefore does **not** currently justify changing the accepted cloud topology.

### Emerging perspective

The durable observation is that Wheelwright may have materially different **reliability classes** before it has different deployed services.

A useful exploratory decomposition is:

1. **Evidence Continuity** — provider acquisition, session scheduling, normalization, freshness/validity maintenance, and durable persistence. Failure here can degrade Wheelwright's authoritative model of the market and is especially consequential during time-sensitive market windows.
2. **Evidence Consumption / Application Access** — snapshot, quote, status, production, and other operator-facing APIs. Failure here may temporarily prevent consumption of current evidence without necessarily requiring evidence maintenance itself to stop.
3. **Operator Experience** — browser UI, visualization, recommendation presentation, drawers, and workflow affordances. Failure here should ideally not threaten maintained market evidence.

These names and boundaries are exploratory vocabulary, not ratified architecture.

### Candidate architectural characteristic

The conversation exposed a possible technology-quality characteristic worth testing:

> **Evidence continuity isolation:** operator-facing activity and operator-facing change should not materially compromise Wheelwright's ability to maintain authoritative market evidence during time-sensitive acquisition windows.

This is not yet a formal invariant, SLO, fitness function, ADR, or requirement. It is an architectural hypothesis whose usefulness depends on evidence.

### Important non-conclusion

The discussion explicitly rejected the inference:

> evidence acquisition is more important, therefore it should immediately become a separate microservice.

The current single-process architecture may already provide sufficient practical isolation. A JVM/process/service boundary is justified only if evidence shows that the existing topology cannot satisfy the required reliability characteristic with reasonable simplicity.

Examples of useful future failure-mode questions include:

- Can heavy or pathological frontend/API traffic materially delay acquisition scheduling?
- Can repeated operator-endpoint failures destabilize the acquisition worker?
- Can slow API work, thread exhaustion, memory pressure, or serialization behavior interfere with evidence continuity?
- Does ordinary operator-facing deployment churn force avoidable restarts of time-sensitive evidence acquisition during open sessions?
- Can the system degrade operator access while continuing to preserve and update market truth?

These are candidate experiments and observations, not assumed defects.

### Decision condition for future extraction

If future cloud/runtime evidence demonstrates that API/UI workload, deployment churn, or other operator-facing concerns can materially interrupt evidence continuity, then extracting a small, stable evidence-maintenance service may become an **earned** service boundary.

If the current one-service architecture survives those pressures cleanly, retaining one service is preferable because it preserves SQLite simplicity, single acquisition authority, and low operational overhead.

The governing sequence is therefore:

```text
identify differentiated reliability requirement
→ observe concrete failure modes / interference
→ determine whether current topology satisfies the requirement
→ improve in-process isolation first where simple and sufficient
→ introduce a process/service boundary only if evidence demonstrates the need
```

### Relationship to the system goal hierarchy

Reliability at the acquisition layer is not an end in itself. It matters because machinery exists to produce current, trustworthy evidence; that evidence supports useful decision products; those products support operator decisions; and those decisions ultimately serve the productive-capital and household mission.

This preserves the distinction between protecting a critical capability and locally optimizing infrastructure for abstract uptime.

### Status

**Exploration / why-state only.**

No ADR, cloud-topology amendment, new service, new infrastructure technology, or implementation work is authorized by this entry. The perspective is preserved so future cloud and technology-quality work does not have to rediscover the distinction between reliability classes and deployment boundaries.


## 2026-09-09 — LVT-INIT-CONSEQUENCE-RELEASE-COST v1: FE/BE conformance repair

### Context

Codex reviewed the pushed v1 implementation (`4cd9a65`) and found three MATERIAL conformance defects at the frontend/backend economic-truth boundary, plus three MINOR issues. The implementation was structurally sound; economic meaning had leaked through the UI adapter. Principal authorized a bounded repair pass (no redesign, no new architecture). This entry records it. SYNC at repair start = `4cd9a65`; reconciled forward to `2c08327` (docs-only journal continuation) before commit.

### The golden rule this enforced

> If the frontend can change the economic truth by choosing a value, deriving a fact, or filling a missing field, the boundary is wrong.

The lesson (bigger than the three bugs): the pure-evaluator tests were necessary but not sufficient — the dangerous leakage happened in the **adapter between evaluated facts and presentation**, which had no tests. Economically-meaningful UI adapters now get their own boundary tests.

### MATERIAL repairs

- **A — spot provenance laundering.** The adapter passed `candidate.evidenceProvenance` (chain-acquisition provenance) as `spotProvenance` for F1, letting the UI assert a spot/quote age Wheelwright does not know (ADR-015 violation). Fixed: F1 spot provenance is now `unavailable` (honest "quote freshness unknown"); option-derived F3 keeps chain provenance and is labeled "chain acquired … ago" (not the misleading "obs … ago"). No provider calls, no new acquisition infrastructure.
- **B — F8 applicability.** The evaluator attached the same basis-relative *release* effect to Sell, Hold, and CC. Holding or opening a CC does not realize a release effect — an economic-semantic mistake, not presentation. Fixed in the module: F8 is computed only for Sell; Hold and CC return an explicit `not-applicable` precision (no value, no substitute unrealized-P&L fact). Rendered as "n/a (no release)".
- **C — encumbered residual hardcoded 0.** The adapter hardcoded `encumberedShares: 0`, silently changing the position state described. Fixed with the smallest data-flow extension: added authoritative `encumberedShares` to `CallCandidate`, populated from `InventoryPosition.sharesEncumbered` at the single production construction site (`recommend-calls.ts`), and the adapter now passes the real value. Residual (free + encumbered) reported truthfully outside the evaluated block.

### MINOR repairs

- CC participation note: removed "premium retained regardless"; now "gross opening credit is received; net retained compensation depends on later BTC/roll/unwind economics" (preserves F3's opening-premium semantic).
- ITM room-to-strike: no longer renders a malformed `+$-X.XX`; `formatRoomToStrike` reads "headroom" (OTM), "at strike" (ATM), or "…in the money" (ITM).
- Added minimal `rb-consequence-*` / `rb-section-note` styling for the side-by-side presentation (no redesign).

### Structural note

The consequence section was extracted from `CallBrief.tsx` into its own exported `ReleaseConsequencesSection.tsx` so the FE/BE boundary is independently testable — the direct remedy for the lesson above.

### Verification

- New `tests/components/release-consequences-section.test.tsx` (8 tests) exercises the adapter boundary: F1 shows quote-freshness-unknown and never a spot-age claim; F3 shows chain-acquisition age; F8 has a value only for Sell (Hold/CC show n/a); encumbered shares survive (250 free + 100 encumbered + 2-contract CC → block 200 / residual 50 free / 100 encumbered); ITM renders no malformed sign; empty when no capacity.
- Module tests extended for F8 applicability and encumbered residual. Targeted suites: 94/94 green. `tsc --noEmit` clean.
- Full frontend suite: 1407 passed / 1 failed — the one failure is the **pre-existing, unrelated** Velvet Rope `multi-expiration` golden-snapshot test (confirmed failing at clean `4cd9a65`). Build: my files clean; the only build error is the **pre-existing** `episode-derivation.ts:520` unused-var (confirmed pre-existing, left untouched).
- No `PL-OPS-08` / Observation-Continuity files touched; two pre-existing git stashes left untouched.

### Epistemic status

Accepted conformance repair of the v1 implementation. No new architecture, no state machine, no scoring, no scope broadening. F8 exactness (`LVT-INIT-OUTCOME-BASIS`), authoritative quote-level provenance, and collar remain separately-owned future work as designed.


## 2026-09-10 — PL-OPS-09: operator-directed targeted re-observation (console freshness on demand)

### Context

The Operator Console gained a query-time **Freshness** column (evidence age derived from each position's `priceObservedAt`; nothing stored — "persist facts; derive trust"). The operator reported that clicking **"Refresh evidence now"** did not move the freshness values. This checkpoint records what that falsified and the bounded capability it produced (`PL-OPS-09`; full reconciliation in `docs/parking-lot-8.md`).

### What the discovery taught us

Two mechanisms, deliberately separated rather than conflated into one "it's broken":

1. **Frontend read-lag / ETag-304 race.** The console reads observations from a 30s-polling store with a conditional `If-None-Match` read. The forced-acquisition button never asked the store to re-read, so freshness lagged up to a poll interval — and even a re-read could return `304` if it fired before the generation advanced. A single perfectly-timed re-read is not enough because the forced-acquisition POST can return (on its bounded HTTP wait) before the backend has finished writing and publishing.

2. **Provider stewardship was working correctly.** `PL-OPS-08`'s `forceAcquireOnce()` forces the **due** work queue. Symbols still fresh within the refresh horizon are intentionally excluded from that queue (do not re-acquire evidence that still satisfies policy). So the whole-cycle force genuinely, correctly did nothing for the on-screen fresh symbols. The absence of movement was honest system behavior, not a defect. Naming this prevented "fixing" a non-bug by weakening stewardship globally.

The real insight: **"refresh the positions I'm looking at" is a different operator intention from "recover from an outage."** `PL-OPS-08` owns the latter (whole due-cycle). The former is a narrow, explicit, operator-supplied symbol set — which is exactly why a scoped exception to the freshness/due gate is defensible here, where a universe-wide bypass would violate stewardship and rate-limit discipline.

### HTTP-semantics reasoning (durable)

An extended design discussion settled the verb. The endpoint drives provider acquisition, mutates the store, and advances the snapshot generation — it is side-effecting, and the generation advance is client-observable in the ETag. That makes a GET non-safe *in this system specifically* (RFC 9110 safe methods), even under a "the backend is just a cache of Tradier" framing, because the appliance is the authority and the generation is its own versioned state. Resolution: keep the trigger a **POST** (`?symbol=` query params scope it); the safe, cacheable read of the result stays `GET /api/evidence/quotes`. "GET = get me the latest; POST = refresh."

### What shipped (bounded, reused existing machinery)

- Backend `AcquisitionWorker.forceAcquireSymbols(List<String>)` loops the existing per-symbol `acquireSymbolTiered` over synthesized work items on the single acquisition thread — bypassing the freshness/due gate (never consults `getPrioritizedWorkQueue`) and the session gate, while preserving Single Acquisition Authority, adapter-level rate-limit pacing, real timestamps/provenance, and "failed refresh preserves evidence." Registers unknown symbols as observation-demand; does **not** touch the monitored-position overlay. Forces publication so the generation advances immediately.
- `POST /api/evidence/refresh?symbol=...` routes to it (whole-cycle behavior preserved when no params); response gains `targeted`.
- Frontend: button passes the console underlyings; `refreshNow()` re-reads on a bounded backoff (0/0.8/1.8/3.5s) that stops once the generation advances — closing the read-lag race without a manual browser refresh.

### Verification

- Live (market open): after startup provider-verification cleared, freshness reset to seconds automatically — no browser refresh needed.
- Backend: `AcquisitionWorkerTest$TargetedForcedAcquisition` (4 tests: re-observes a fresh not-due symbol, empty list no-op, NOT_RUNNING guard, no scheduler reschedule) + `NudgeControllerTest` targeted cases — all green. Full backend suite green.
- Frontend: `nudge-acquisition.test.ts` extended (targeted `?symbol=` param building, dedupe, empty-list fallback); `tsc` clean. Full suite 1416/1417 — the one failure is the **pre-existing, unrelated** Velvet Rope `multi-expiration` date-drift golden (hardcoded expiration now stale vs today's computed value; untouched by this work).

### Epistemic status

Accepted bounded capability. A new, narrow, operator-scoped exception to the provider-stewardship/freshness-due gate, reusing existing acquisition machinery. Not authorized: universe-wide freshness bypass, or any scheduler/horizon/TTL/concurrency/provider/session/contract change. The whole-cycle `PL-OPS-08` recovery control is unchanged.


## 2026-09-10 — Cash Deployment as the second consumer of PL-OPS-09 (targeted refresh)

### Context

Same operator intent as the Console freshness refresh (`PL-OPS-09`), applied to a different decision surface, and again motivated by an operational failure: stale Cash Deployment evidence contributed to **missed morning trades**. Principal authorized a bounded v0 and — importantly — framed it as a **new consumer** of the existing PL-OPS-09 capability, not a new capability. Full reconciliation in `docs/parking-lot-8.md` under the PL-OPS-09 record.

### The reuse gate that shaped the design

Principal set a sharp acceptance criterion: *if this needs a backend change or a server bounce, we've drifted from "new consumer" into "new capability."* That gate held — the work is entirely frontend. The backend PL-OPS-09 contract already accepts an arbitrary bounded symbol set, so Cash Deployment's underlyings are serviceable by the running appliance with no change.

### What the investigation revealed (the load-bearing finding)

The shared-evidence assumption was only half-true, and the honest version mattered. Cash Deployment and the Operator Console read the **same authoritative backend evidence through different frontend readers**:

- Console → observation store (`useObservations()` / `GET /api/evidence/quotes`, generation-keyed) — driven by `refreshNow()`.
- Deployment → WriteDesk's private snapshot poll (`GET /api/evidence/snapshot`, own ETag) → IndexedDB durable cache → `recommendPuts`/`recommendBuyWrites` → the candidate arrays `CrossEntryStrip` ranks.

So at the **backend layer** the "refresh these symbols, not this table" property holds perfectly — one acquisition advances the single evidence model both surfaces read. But at the **frontend layer** there is no shared generation: `refreshNow()` would update the Console, not Deployment. Each surface must re-read its own source. This is exactly the trap Principal flagged ("don't build a table-local refresh"), and the design honors it: the button reuses the shared acquisition, then triggers Deployment's *own* re-read.

### What shipped (bounded, frontend-only)

- `src/write-desk/refresh-top-symbols.ts` — pure, display-relative scope selection: first N rows **in the current sort order**, deduped/uppercased, hard-capped (N=30). Faithfully follows whatever order it is given; imposes no ranking of its own.
- `src/write-desk/CrossEntryRefreshButton.tsx` — "Refresh top opportunities". Calls the existing `forceEvidenceAcquisition(symbols)` (PL-OPS-09); on a genuine `ACQUIRED` disposition, invokes `onRefreshComplete`. No new acquisition mechanism.
- `CrossEntryStrip` — computes the top-30 current-sort symbols and mounts the button; `WriteDesk` supplies `refreshDeploymentEvidence` (invalidate ETag + re-poll on a bounded backoff; the 30s poll remains the safety net).

### Findings preserved, not solved

- **Display-relative stale-suppression (sort-dependent):** a refresh window scoped to the visible top-N cannot reach a candidate suppressed *below* the window by its own stale economics; worse under evidence-derived sorts. The 30-row window reduces, does not eliminate. Deferred; belongs to `PL-DEPLOY` / `PL-ARCH-06`.
- **Two frontend evidence readers for one backend model:** recorded as a finding (it directly explains why each surface needs its own re-read), explicitly **not** an authorization to unify the pipelines.

### Verification

- Automated: `refresh-top-symbols` (7) + `cross-entry-refresh-button` (6) tests green; full frontend suite 1422/1423 (sole failure = pre-existing, unrelated velvet-rope date-drift snapshot); `tsc` clean; backend untouched from `main`.
- **Not self-verified:** the live working-software exercise (click → freshness resets on Deployment → a second surface reflects the same fresh evidence with no second acquisition) requires the running app and a market-open provider. Reserved for Principal working-software review; the automated tests prove the mechanism (one acquisition, independent re-reads), not the on-screen outcome.

### Epistemic status

Bounded v0, new consumer of an existing capability, no backend change, no new `PL-*` identity. Stopping for Principal working-software review before broadening (higher N, population-wide refresh, or pipeline unification are all explicitly out of scope).


## 2026-09-10 — Cash Deployment refresh: two working-software corrections + a durable UI principle

### Context

Continuation of the Cash Deployment PL-OPS-09 consumer. Principal exercised it in working software (market open) and it now works well — validated as potentially **hundreds to thousands of dollars/month** of operational value (surgically refreshing a candidate's evidence before execution instead of trading on stale economics). Two real defects surfaced only under working software, neither reachable by upfront design; both fixed. This is the closed loop doing its job.

### Defect 1 — generation early-exit ("refreshed N but age unchanged")

My surface re-read stopped as soon as `snapshot.generation` advanced past the click-time value. But the appliance publishes a new generation almost continuously (the scheduler is always acquiring the universe — I watched it climb several generations per second via the live snapshot endpoint). So a generation bump does **not** mean the *targeted* symbols were re-observed; the loop exited on an unrelated scheduler publication and merged a snapshot predating the targeted chains. Fix: run the full bounded backoff, no generation-based early exit — the later reads land after the targeted acquisition publishes.

Direct backend probes confirmed the backend side was correct all along: `POST /api/evidence/refresh?symbol=AOA&symbol=AOM` advanced AOA's `primaryChainAcquisitionProvenance.acquiredAt` (18:23 → 18:36). The bug was entirely in my frontend re-read heuristic.

### Defect 2 — completion indication lied (the important one)

Added a **per-row `↻` surgical refresh** (`RowRefreshButton.tsx`) — a one-symbol PL-OPS-09 consumer for revalidating the exact opportunity before Open in Fidelity. Its spinner initially stopped when the acquisition request returned — seconds *before* the row's Age visibly updated. For a few seconds the UI asserted a freshness the operator could not yet see.

Principal named the reusable principle precisely: **action completion and visible-state convergence are different events; operator-facing completion must correspond to the latter when the visible state is what establishes trust.** The spinner now tracks the row's own `acquiredAtMs` advancing past the click-time baseline, and stops **indeterminate** (not clean success) if acquired-but-not-converged within a bounded wait — the honest outcome when evidence can't get fresher (e.g. a provider-cache hit inside the 90s chain-cache window). Promoted to `foundations/visual-design-principles.md` as principle #12.

### Also learned / preserved

- **90s chain-cache floor:** re-refreshing the same symbol within 90s is a provider cache hit that rewrites the same `retrievedAt` — correct stewardship, but it means rapid re-clicks won't drive the age to ~0; the indeterminate state now tells that truth instead of faking success.
- **Two frontend evidence readers, one backend model:** reaffirmed — Console (observation store) and Deployment (WriteDesk snapshot poll) each re-read their own source; the shared truth is at the backend. Recorded as a finding, not unified (belongs to `PL-ARCH-06`).

### Verification

Zero backend change throughout (the reuse gate held). 18 frontend tests across `refresh-top-symbols`, `cross-entry-refresh-button`, `row-refresh-button` (incl. an explicit convergence test: spinner keeps spinning post-acquisition until the provenance prop advances). Full suite 1427/1428 — sole failure the pre-existing unrelated velvet-rope date-drift snapshot. `tsc` clean.

### Epistemic status

Bounded v0 consumers of PL-OPS-09 (bulk + per-row), no new capability, no backend change, no new `PL-*`. High operator-validated value. Principle #12 is the durable takeaway beyond this feature.


## 2026-09-10 — The spinner decision arc: how we recovered from two red herrings

### Context

Immediately after the previous entry (which landed the convergence-tracking spinner), the completion-semantics question went through a two-step near-miss before settling. This entry records the arc itself, because the arc — not just the final code — is the reusable learning, and a cold-start reader who saw only the endpoint would miss why the obvious "simplification" is wrong.

### The arc

1. **Simple spinner** (validated, useful): spin during request, stop on return. Defect observed: the Age lagged a few seconds after the spinner stopped — the UI briefly asserted freshness that hadn't propagated.
2. **Convergence spinner** (the fix): keep spinning until the row's `acquiredAtMs` advances; bounded to 8s → explicit `?`. This fixed the lag.
3. **Red herring #1 (mine):** on hearing "spinners spin forever," I recommended *reverting* to the simple spinner and rewriting principle #12 to say "don't make spinners wait for convergence." I even drafted the revert and the rewritten principle.
4. **Red herring caught (Principal):** the revert would have knowingly restored the stale-Age gap. Crucially, the convergence version was **already bounded** (8s + `?`), so it never had the eternal-spinner failure mode the heuristic warned about. The objection targeted a problem this code didn't have.
5. **Resolution:** keep the convergence spinner. The real requirement is **both** — responsive (spinner stops as the Age changes) **and** bounded (never eternal; terminate into an explicit unresolved state). Principle #12 sharpened to make the bound the load-bearing clause and to reject *both* failure modes explicitly.

### Why this is worth preserving (two durable lessons)

- **Validated working software outranks a plausible principle.** "Spinners spin forever" is true in general and was the right instinct in the abstract — but applied here it would have removed a working-software improvement to solve a failure mode that the bounded design had already eliminated. When a heuristic and validated behavior conflict, check whether the heuristic's failure mode actually exists in this implementation before acting on it.
- **The requirement was "both," and each isolated simplification silently sacrificed one half.** Reverting protected against eternal spin by reintroducing the stale-Age gap; the naive convergence spinner (unbounded) would have done the reverse. The honest target holds both simultaneously — responsiveness *and* a bound — which is exactly what principle #12 now states.

### A third, smaller lesson (testing)

The bounded-timeout test first used fake timers. It **passed in isolation but failed in the full suite** (fake-timer/microtask contamination under concurrent load). Fixed by making the convergence bound an injectable prop (`convergenceTimeoutMs`) and testing with a tiny real timeout — deterministic, no time mocking. Reusable: prefer injecting a duration over mocking the clock; and always run the full suite, because an isolated green can hide a flaky interaction.

### Process note

No history rewrite. The earlier entry (convergence as "the fix") stands; this entry continues the arc through the near-miss to the settled "both, bounded" position. The messy path — simple → convergence → proposed revert → objection → keep-but-sharpen — is the organizational learning, preserved deliberately rather than tidied into a clean-looking final state.

### Verification

Final: 6 row-button tests (convergence + bounded-terminate), full suite 1428/1429 (sole failure the pre-existing unrelated velvet-rope date-drift snapshot), `tsc` clean. Zero backend change throughout.


## 2026-09-10 — Codex review: the bulk button and the ACQUIRED label were still lying

### Context

External Codex review of the Cash Deployment refresh, after the row control's convergence semantics had settled. It found two remaining truthfulness defects — both frontend completion-semantics, neither invalidating PL-OPS-09 or the Deployment refresh idea. Both accepted and corrected in one bounded pass. The row control had already earned its success claim via visible convergence; these are the two places that hadn't caught up.

### Finding 1 — the bulk button claimed success at request return

`CrossEntryRefreshButton` displayed `Refreshed N` the moment the targeted acquisition POST returned — the operator reads that as "the rows I'm looking at are now fresh," which is a lie until the surface re-read has propagated. This is exactly principle #12 applied to the bulk control, which we had only applied to the row. Fix (bounded, no per-symbol accounting framework): the button now captures a click-time per-symbol provenance baseline, shows `Refreshing…` → `Updating evidence…`, and claims `Refreshed N` **only** when all requested rows' visible provenance advances. If only some advance within the bound it reports `Refreshed X of Y`; if none, `Not confirmed fresh`. The number is the count of rows whose VISIBLE provenance advanced — never the backend's `symbolsAcquired`.

The provenance feedback comes from a live `symbol → provenance` map that CrossEntryStrip already can build from its displayed rows — so the bulk button detects convergence with a simple map compare, not machinery.

### Finding 2 — `ACQUIRED` is not a synonym for "new evidence exists"

The label logic translated backend `ACQUIRED` into `Refreshed N` / `Refreshed (up to date)`. But `ACQUIRED` is only an acquisition disposition: `forceAcquireSymbols` can return `ACQUIRED` on the bounded-wait timeout path, and `symbolsAcquired === 0` does not prove evidence was already current. So the label was epistemically stronger than the backend fact. Fixed: the FE never renders a confirmed-freshness claim from `ACQUIRED` alone; success is asserted only through visible convergence (above). The row control was already robust to this because it waits on the row's provenance.

### Timing alignment (Codex MINOR, made intentional)

The bulk convergence bound is 13s, deliberately set to exceed WriteDesk's re-read backoff total (~12.5s cumulative). If the bound were shorter (e.g. the row's 8s), the bulk button could declare a false "partial" while the re-read still had attempts pending. Documented as a constant with the coupling explained.

### A correctness bug found while testing

The bulk bounded-timeout closure initially read `provenanceBySymbol` from the click-time closure — stale, since the map advances via recompute after the timer is scheduled. Fixed by reading the latest map through a ref. Caught because the partial-convergence test was flaky until the ref was introduced — the test earned its keep.

### Verification

Zero backend change (the reuse gate held through the whole feature). Bulk tests rewritten to convergence semantics (7), row control unchanged (6), scope helper (7). Full suite 1429/1430 — sole failure the pre-existing unrelated velvet-rope date-drift snapshot. `tsc` clean.

### Epistemic status

The core architecture held throughout: one reusable backend capability (PL-OPS-09), multiple frontend consumers, and every consumer must tell the truth about when its OWN visible state has caught up. Principle #12 is the durable takeaway; this review is what forced it to be applied uniformly rather than only where the defect was first noticed.


## 2026-09-10 — Refresh rate-limit stewardship verified (docs-only closeout before roadmap)

### Context

After promoting the Cash Deployment targeted refresh to production `main`, the open operational worry was: two refresh controls (bulk + per-row) — does repeated clicking push us into HTTP 429? Codex verified the boundary; this is the durable capture so a future session does not re-litigate it.

### Verified

**Force fresh bypasses freshness policy, not provider stewardship.** Targeted refresh shares every provider protection with scheduled acquisition: same single acquisition thread (Single Acquisition Authority — no second path), same `acquireSymbolTiered`, same `RequestPacer` (single-flight, ≤119 starts/60s), same response cache (exp 5m / quotes 60s / chains 90s), same 429 handling (records the event, honors Retry-After else 60s backoff, blocks later admission, classified as throttling not failover). No rate-limit bypass exists.

### Residual risk (correctly characterized)

Not a 429 spray — **backlog and delayed convergence.** Overlapping operator operations (a 30-symbol bulk, several row `↻`, another bulk, atop scheduled work) serialize through the one worker and one pacer. That protects Tradier but can delay convergence. A visible consequence, not a defect: under queued pressure the bulk button can truthfully report `Refreshed X of Y` / `Not confirmed fresh` because the requested work didn't complete within the 13s UI window. The button is honest; the delay is the operator's own backlog.

### Disposition

Observe before throttling. No code change now. If real pressure ever appears (inspect recorded 429s, pacer admission wait, refresh backlog, and whether bulk refresh delays scheduled acquisition), the only sanctioned response is coalescing/deduplicating pending refresh intentions — never weakening the pacer or adding a second rate-limit mechanism, which would violate Single Acquisition Authority. Recorded under PL-OPS-09.

### Status

Docs-only. `main` frozen after this commit; the next activity is the roadmap review from the accepted SHA. Cash Deployment targeted refresh (bulk + per-row) is production; its stewardship boundary is now durable knowledge.


## 2026-09-11 — Issue #16: session/admissibility authority defect, and the authority-precedence lesson (ADR-017)

### What happened
A live Operator Console showed a phantom `OPEN DELAY` at ~09:41 ET on the real-time **Production** feed. Root-cause (traced, not guessed): the frontend `MarketSessionPolicy` hardcoded the Tradier **sandbox** 15-minute provider-delay profile and independently derived session state *and* evidence admissibility/canonicality from it — in parallel with the backend `SessionGate`, which was already provider-aware. The phantom badge was only the visible symptom; the real defect was **duplicated semantic authority**. Filed as GitHub Issue #16 (`defect`/`S2`), fixed in PR #17, merged to `main` `a964c5c`, Issue #16 CLOSED.

### The deeper lesson (why this entry exists)
This was the **third instance of one architectural spine**, after ADR-015 (provenance/time authority) and ADR-016 (association authority): *a downstream representation must not reconstruct domain meaning from lower-level signals, and transformation confers no authority.* Issue #16 added dimensions the earlier two didn't need to state, and which a future actor would otherwise rediscover the hard way:
- **Authority must reach the consumer.** Publishing the backend verdict was not enough — the recommendation eligibility gate kept applying a local rule. Producer/publication tests did not prove the consumer was governed; only a consumer-path integration test did — one exercising a real durable `CacheRecord` through the real `recommendPuts`. (The snapshot-ingestion hop into the cache was verified by source inspection, not exercised by that test.)
- **Verdict outranks fallback; fallback only in the absence of authority.**
- **Pending authority fails safe** — and, sharply, a "conservative" fabricated `CLOSED_CANONICAL` bootstrap was actually *more* permissive, because the sealed-session shortcut treats "closed" as permission to trust prior cached evidence. Fabricating an ordinary domain state to mean "authority unknown" is itself the defect.
- **Cache freshness (transport) ≠ admissibility (authority)**, and **sealed evidence survives ordinary live-TTL expiry**.
- **Retire the duplicate authority path** rather than sync two truth models.

### The review arc (preserved so it isn't re-litigated)
The fix took several Codex rounds, each finding a *real* remaining authority bug, not a nitpick: (1) verdict published but not consumed; (2) same-state session updates dropped + permissive startup; (3) precedence inverted (sealed-session shortcut evaluated before the verdict, so `admissible:false` could be overridden; and sealed `admissible:true` wrongly invalidated by expired live TTL). The final precedence is: pending→reject; explicit false→reject (all states); explicit true + sealed→accept despite expired live TTL; explicit true + live→require freshness; no verdict→legacy fallback.

### Mixed-authority implication (durable)
One accepted snapshot may carry Production, Sandbox, and unknown per-subject provenance simultaneously. A single global presentation-layer provider policy therefore cannot stand in for per-subject authority — admissibility is judged per subject from its own environment + acquisition time (no laundering).

### Verification honesty (not overstated)
The mixed-authority integration test exercised the real durable cache through the actual `recommendPuts`. The snapshot→cache **ingestion hop** was verified by source inspection, not executed end-to-end in that test. Adequate for this bounded defect; not a claim of full end-to-end ingestion coverage. Full backend suite green; FE 1442/1443 (sole failure the pre-existing, unrelated velvet-rope date-drift snapshot).

### Where the lesson now lives
**ADR-017 (Authoritative Verdict Precedence and Consumer-Path Reach)** — appended to `07c-adrs.md` as a later sibling of ADR-015 and ADR-016 (both now forward-reference it). `07-architecture-current.md` Ownership Boundary gains a "Consumer-path authority precedence" governing constraint pointing to ADR-017. This is deliberately consolidated into the existing authority spine rather than a parallel new doctrine. The implementation (SessionClassifier, per-subject snapshot admissibility, `isSubjectAdmissible`, backend-consuming `useSessionClassification`) is accepted on `main`; this ratchet is documentation-only.

### Process note (worktree discipline under concurrent work)
#16 was built and this ratchet written in **isolated worktrees** off accepted `main`, never in the primary worktree, which holds paused concurrent Greeks/Operator-Console and expanded-row (PL-DEPLOY/A) dirty state. That paused work was never disturbed. Sequence going forward remains: (this ratchet) → resume Greeks/reconcile → return to PL-DEPLOY/A.

---

## 2026-09-11 — Defect tracking migrated to repository-native `docs/bugs/` (knife-edge authority cutover)

### What changed

Per Principal decision (Defect Tracking Migration), Wheelwright now has **one and only one** way to track bugs: repository-native `BUG-NNN` records under `docs/bugs/`. This **replaces** — does not supplement — the September 4, 2026 rule that made GitHub Issues the defect system of record. There is no accepted intermediate state with two competing trackers.

- Created `docs/bugs/README.md` (governing methodology: `BUG-NNN` identity, record format, lifecycle, severity `S1`–`S4`, `Not established` for unasserted severity), `docs/bugs/INDEX.md` (discovery index + migration map), and ten records `BUG-001`–`BUG-010`.
- Replaced the defect-authority rule in `docs/README.md` and the "Defect Tracking" section of `foundations/idea-intake-reconciliation.md`; registered `docs/bugs/` in the README authority model (Category B methodology + Category C canonical corpus).
- Repointed the incidental Kreature cross-links in `parking-lot.md` / `parking-lot-3.md` from "GitHub Issue #10" to `BUG-005` (Issue as provenance).

### Migration map (ascending historical GitHub Issue number)

#2→BUG-001, #3→BUG-002, #8→BUG-003, #9→BUG-004, #10→BUG-005, #11→BUG-006, #12→BUG-007, #14→BUG-008, #15→BUG-009, #16→BUG-010. Not migrated: #1, #4, #7 (roadmap-intake / product-gap / discovery-note — not defects). GitHub gaps #5/#6/#13 carry no significance.

### Judgment calls preserved (why-state)

- **#2 had no `defect` label** yet was ruled a defect: its body explicitly names a "latent lifecycle-processing defect" with demonstrated behavior and acceptance criteria. Migration membership is **semantic**, not label-driven — defining the population by the current label would have wrongly excluded it and contradicted the preservation rule.
- **#14 and #15 have corrupted trailing prose** in the source Issue bodies (repeated/garbled fragments, truncated words). Per the ruling, surviving text is preserved verbatim and the corruption is explicitly marked; recoverable-but-uncertain intent is labeled as uncertain and non-authoritative rather than silently repaired.
- **#16 (BUG-010) is Resolved.** Remediation provenance: PR #17. Subsequent architectural learning: PR #18 / ADR-017 — recorded as *post-dating* the defect, not as something that governed the original behavior.
- Journal entries that historically say "filed as GitHub Issue #N" were left intact: append-only chronology records what happened at the time and must not be rewritten to make history look linear.

### Status

Migration implemented; not yet committed (awaiting Principal commit authorization and Codex independent verification of the authority transition). GitHub Issues remain as historical provenance/workflow record; they are no longer defect authority.

---

## 2026-09-11 — Secondary Greeks on the Operator Console, and held-position monitoring as a distinct acquisition reason

### What shipped
The Operator Console position tables gained the four secondary greeks (gamma, theta, vega, rho) beside the existing delta, threaded end-to-end: Tradier `greeks=true` → `TradierAdapter` normalization → `MarketChain.OptionContract` → snapshot JSON → durable cache → shared frontend greek domain → Console table + CSV export. A Console-owned snapshot ingestion populates the chain cache so the Console no longer depends on the Write Desk having been visited.

### The durable architectural lesson (why this entry exists)
**Held-position monitoring is a SEPARATE acquisition reason from the Deployment opportunity window.** Chain acquisition fetches expirations inside the 7–45 DTE eligibility window (the *Deployment* opportunity space). But an operator can *hold* a position at a near-expiry expiration (0–4 DTE) OUTSIDE that window; before this work those held chains stopped refreshing the moment they fell below 7 DTE, so their greeks went stale while capital was still at risk (GDXJ 0-DTE, SMH 4-DTE were the witnesses). The bounded fix is a **held-expiration acquisition overlay** (migration 007; `AcquisitionWorker.acquireAllEligibleChains` unions held expirations the provider actually lists), NOT a scheduler redesign. Generalization to preserve: "what could we deploy into?" is bounded to 7–45 DTE; "what are we already exposed to and must keep watching?" is bounded by what we hold, at any DTE. Conflating them silently stops refreshing evidence the operator still relies on.

### Evidence-honesty properties (each is load-bearing)
- **Nullable provider greeks — absence is not zero.** Five nullable `Double`s; JSON `null` when the provider omits them; `0.0` only when the provider sent `0.0`. Each greek parsed independently — a missing/invalid delta never invalidates the others.
- **Scientific-notation parsing.** Tradier sends small greeks in exponent form (`9.0E-4`); the JSON number scanner accepts `e/E`, signs, and exponent digits so small near-expiry greeks are not truncated.
- **`0.0` = unavailable, per field.** Near expiration the greek model often returns exact `0.0` placeholders; for display a greek is usable only if finite AND nonzero (delta also domain-checked to [-1,1]). Facts persist verbatim; the "0 = unavailable" trust is derived at read.
- **Adaptive precision.** A real tiny nonzero delta must not render as a false `0.00`; `formatGreek` shows a threshold form and the CSV widens precision.
- **Greek Age is authoritative, and distinct from Quote Freshness.** Greek Age is derived ONLY from the chain record's authoritative `chain-acquired` provenance (`evidenceProvenance`) — never cache/TTL `retrievedAt`, symbol timing, or `Date.now()`; when provenance is unavailable the age is null (honestly unknown), not a substituted weaker timestamp. It is shown as its own column beside Quote Freshness with a STALE marker past the chain window, so a fresh spot can never make stale greeks look current. (Same authority-precedence spine as ADR-015/016/017.) This authority discipline is the reason a naive "use retrievedAt" implementation was rejected during review.

### Held-declaration lifecycle (reliability, not just feature)
The `/observe` held-expiration declaration distinguishes **omitted → unchanged**, **`[]` → clear**, **pairs → replace**, so an older client, a competing tab, or a symbols-only update cannot silently erase held-monitoring demand; the frontend POSTs an explicit empty declaration when the portfolio empties. Request validation rejects malformed `symbols` (missing / non-list / non-string members) with 400 rather than a 500/ClassCastException. The frontend declaration records its dedup key only after a **successful** POST, so a transient failure stays retryable (no permanent suppression, no retry storm).

### Reusability
Greek availability/sanitization/formatting live in a consumer-agnostic shared domain (`write-desk/option-greeks.ts` + `contract-greek-lookup.ts`); `use-position-deltas.ts` is a thin Console adapter. Future Deployment greek columns must consume these, not recreate validity rules.

### Contract & scope
`docs/contracts/evidence-snapshot-v1.md` documents the greeks as additive nullable fields (null = unavailable, never fabricated 0). Additive under INV-PUB-05; no version increment. This increment deliberately excludes the release-consequence work that was previously commingled on the working branch (kept as its own separate change set) and does NOT remediate BUG-004 (temporal incoherence remains its own tracked defect; delta not yet participating in the Greek-Age coherence treatment).

### Verification
Backend full suite green. Frontend green except the pre-existing, unrelated `velvet-rope/multi-expiration` date-relative snapshot (velvet-rope code untouched here). Regression coverage added for held sub-7-DTE acquisition, observe-request validation, and failed-declaration retry.


---

## 2026-09-11 — Delta forensic investigation: stale truth → frustrating ignorance → tentative certainty

### Trigger
After the secondary-Greeks increment, the Operator Console showed unavailable Delta (em dash) for near-expiry held positions where the old Console had consistently shown a nonzero numeric Delta. The Principal's historical observation was specific: the old Console never showed 0.00 and never showed an em dash for these rows. That made a pure presentation explanation inadequate and prompted a lifecycle/provider investigation rather than an immediate fix.

### What we established about old versus current behavior
The old and current Console both suppress exact numeric `0.0` at presentation. The old renderer therefore did not manufacture the previously observed nonzero values. The material change was the evidence lifecycle feeding that renderer.

Before the Greeks work, Console Delta read chain records already present in the durable browser cache. Console did not own snapshot ingestion, and the cache read path did not reject a chain merely because it was old. Write Desk was the path that populated those chain records. Separately, normal backend chain acquisition was bounded to the 7–45 DTE Deployment window. Once a held expiration fell below 7 DTE, it could stop being refreshed while an older cached nonzero Delta remained visible.

The Greeks increment deliberately changed both conditions: held expirations are now acquired even below the Deployment window, and the Console now ingests current snapshots itself. A newly acquired held-expiration chain therefore overwrites the older cache record. When the newly acquired provider Delta is exact `0.0`, the existing frontend zero-as-unavailable rule renders it as unavailable.

This gives a concrete causal mechanism for the observed transition. We still did not recover the historical IndexedDB records, so the exact provenance/age of the old nonzero values remains unproven. The strongest supported interpretation is that the old Console could preserve older, once-real Delta evidence after it ceased being current.

### Direct Tradier production study
Rather than infer provider behavior through Wheelwright, we reconstructed Wheelwright's accepted production Tradier request shape and called Tradier directly, bypassing Wheelwright caches and UI while preserving the same external requests:

- production base `https://api.tradier.com/v1`;
- expiration discovery: `GET /markets/options/expirations?symbol=...&includeAllRoots=true`;
- option chain: `GET /markets/options/chains?symbol=...&expiration=...&greeks=true`;
- underlying quote: `GET /markets/quotes?symbols=...`;
- normal bearer authorization and JSON response shape.

The production credential was loaded from the gitignored local `.env` and was not printed or persisted. The study sampled SPY, QQQ, IWM, GDXJ, SMH, URA, COPX, UNG, BNO, PDBC, WEAT, and DBO across available expirations nearest 0, 1, 2, 3, 5, 7, 10, 14, 21, 30, and 45 DTE, both calls and puts, and approximately 10% OTM, 5% OTM, ATM, 5% ITM, and 10% ITM strikes. Raw provider Greeks were classified before Wheelwright sanitization or rounding.

The after-hours collection produced 740 primary sampled contracts. 683 (92.3%) had nonzero Delta; 57 (7.7%) had exact numeric `0.0`; none in this sample had null, absent, or unparsable Delta. Of the 57 exact-zero Deltas, 37 were all-zero five-Greek vectors and 20 had `delta=0.0` while at least one secondary Greek remained nonzero. Every sampled ATM and ITM contract retained nonzero Delta, including at 0 DTE. Every exact-zero Delta occurred in the sampled 5% or 10% OTM bands.

There was no universal DTE cutoff. Exact-zero Delta appeared as far out as 14 DTE in the sample (SPY), while other OTM contracts retained nonzero Delta at 0 DTE. Observed symbol-level zero onset included SPY 14 DTE, QQQ/IWM 10 DTE, SMH 3 DTE, and GDXJ/URA/COPX/UNG/BNO 0 DTE; PDBC/WEAT/DBO had sparse monthly-expiration coverage and no observed zero. Calls showed 33/370 zeros and puts 24/370. The dominant empirical pattern was moneyness × DTE, with symbol/contract characteristics and side as possible modifiers.

A particularly important witness reproduced the production symptom directly: a sampled URA 0-DTE call near 5% OTM returned raw `delta=0.0` while Gamma was nonzero (`0.00022`). Thus an exact-zero Delta is not synonymous with an absent Greek vector.

For SPY, URA, COPX, and UNG, the same nearest-to-0-DTE chain request was repeated three times. All 40 tracked symbol/side/moneyness selections retained the same Delta state and raw Delta value across all three calls. There were no zero↔nonzero or null/absent transitions. All 110 provider calls returned HTTP 200 with no rate-limit failure.

### Epistemic progression
The investigation changed our understanding in three stages:

**Stale truth.** The old Console displayed useful, plausible, nonzero Delta evidence, but its architecture allowed an older chain to survive after the expiration stopped being refreshed. The value may once have been true while no longer being current.

**Frustrating ignorance.** The Greeks increment improved freshness and monitoring correctness, replacing potentially retained old chains with current held-expiration evidence. Tradier then supplied exact zeros, and Wheelwright's existing product rule collapsed those zeros into unavailable presentation. The product became more honest about not presenting the old stale number, but less informative to the operator.

**Tentative certainty.** The direct study established that Tradier itself explicitly and repeatedly returns numeric `0.0` Delta in these conditions. It did NOT establish whether that zero is a precise sensitivity or a provider/model placeholder. We now know what Tradier said; we do not yet know exactly what semantic confidence to attach to the value.

### BUG-011 reframing and decision
BUG-011 is therefore framed as:

> Provider-reported exact-zero Delta is rendered indistinguishably from absent Delta evidence.

The important raw-state distinction is now explicit: exact numeric zero, null/absent, tiny nonzero, and an all-zero vector are different provider facts. Suspicion about the quality of an all-zero vector may justify a separate quality cue, but it does not justify rewriting explicit numeric observations into absence. The after-hours study observed no null/absent Delta in its 740-contract sample; that is a statement about this sample, not a claim that Tradier never produces those states.

The Principal explicitly chose **not to fix BUG-011 now**. No remediation was authorized. The finding was persisted in the repository-native bug system and indexed as BUG-011.

### Required trading-hours replication
The Principal does not trust an after-hours provider study as sufficient evidence for a trading-hours product. The same raw-provider experiment must therefore be rerun during regular trading hours before stronger conclusions are drawn. The after-hours dataset is to be preserved as the comparison baseline, not overwritten. The purpose of the rerun is specifically to determine whether exact-zero prevalence/state changes materially with market session. If the same pattern persists in-session, confidence in the provider behavior strengthens considerably; if zeros diminish or disappear, session becomes an additional evidence-quality dimension.

### Durable lesson
The Greeks work did not simply "break Delta." It exposed an accidental dependency in the old product: apparent Delta completeness could be sustained by stale cache lifecycle behavior. Improving evidence freshness removed that accidental completeness and exposed a second ambiguity already present in the product rule: explicit provider zero was treated as equivalent to no evidence.

The resulting discipline is: preserve provider facts first; distinguish freshness from availability and availability from quality; and do not infer semantic absence merely because a provider value looks suspicious. The next evidence step is trading-hours replication, not remediation.


---

## 2026-09-14 — Generation-29066 servicing experiment: governance conformance failure and lost observation window

### Context

The generation-29066 universe-servicing experiment began from an intentionally bounded objective: reduce low-value acquisition work, preserve reversibility and historical evidence, and measure whether the Evidence Appliance's freshness/SLO behavior improved. The frozen disposition separated 340 canonical-removal symbols, 487 WEEKLY_REFRESH symbols, and 84 historically useful protected symbols.

The repository already contained strong governing guidance relevant to this work: complexity must be earned; interventions should be bounded; working software should produce evidence early; engineering learning rate and observation cadence matter; architectural elegance must not override Principal direction; and implementation pressure should return through the actor loop rather than silently redesigning the system.

### What went wrong

After implementation had been authorized, a sequence of individually legitimate technical findings repeatedly reopened design: artifact provenance, universe-removal mechanics, ACTIVE/DORMANT semantics, weekly-completion semantics, multi-expiration completeness, retry policy, per-expiration failure persistence, generalized removal tooling, and the separate 0–45 versus current 7–45 DTE question.

Most findings were technically real. The process failure was their **disposition**. The actors repeatedly asked whether a concern was valid, but insufficiently asked whether it had to be resolved before the authorized experiment could safely produce useful evidence.

The result was progressive hardening of a bounded experiment: protections and completeness machinery accumulated faster than the experiment itself advanced. The Principal repeatedly simplified the intended policy back toward its actual purpose: 487 low-value symbols should receive one normal servicing attempt per week rather than consume routine capacity.

### Opportunity cost realized

The experiment depended on a finite regular-market observation window. Design/review cycles consumed that window. The WEEKLY_REFRESH seam eventually activated and behaved correctly: all 487 initial weekly attempts were recorded, weekly due work drained to zero, routine work drained, multi-DTE coverage recovered, and provider/scheduler failures remained zero. However, warm-up completed at approximately 19:57:46Z, leaving only about two minutes of comparable regular-session steady-state observation before the 20:00Z market close.

Consequently, the immediate operational behavior was validated but the projected freshness/SLO improvement could not be meaningfully measured that day. The 340 canonical removals were also still unapplied, so the full 827-symbol intervention was not observed.

This lost market-session evidence was a **tactical opportunity cost** of continued design and review. It was not merely schedule inconvenience: the foregone observation directly reduced the learning value of the day's work.

### Root-cause interpretation

This was not primarily a missing-governance failure. The governing principles already existed. It was a **conformance failure under execution pressure**:

- the Architect did not continuously preserve implementation authorization, scope containment, earned-complexity discipline, and observation intent as governing context;
- Codex's adversarial review correctly surfaced real concerns but too often allowed a valid finding to imply a required precondition or a broader solution;
- ChatGPT did not reconcile those reviews back to the bounded objective and tactical opportunity cost early enough;
- Kiro generally escalated implementation pressure appropriately, but those escalations repeatedly received design expansion instead of BLOCKER/DEFER disposition.

The Principal had already supplied the direction. The review/architecture loop failed to protect it.

### Durable methodology ratchet

The lesson is intentionally small rather than another governance framework:

1. **Execution-mode continuity:** Principal authorization of a bounded experiment remains governing context. New findings do not implicitly return work to design mode.
2. **Finding ≠ blocker:** a concern that would delay execution must identify a concrete correctness, safety, integrity, reversibility, or experiment-validity failure. Otherwise it is deferred.
3. **Opportunity cost is strategic and tactical:** during execution, actors must weigh the value of additional analysis/design/review against the best foregone alternative, including lost learning time.
4. **Finite observation windows are engineering resources:** consuming a market/session/provider window through non-blocking design work is a material cost.
5. **Architect owns scope containment:** messy execution increases rather than suspends the Architect's responsibility to preserve Principal intent and guardrails.
6. **Adversarial review must not become solution inflation:** Codex should surface risk aggressively while distinguishing findings from required preconditions; ChatGPT should reconcile findings against current authorization, opportunity cost, and earned complexity.
7. **Prefer observation over architecture when safe:** if the bounded experiment can answer the question without materially compromising correctness, safety, integrity, reversibility, or validity, run the experiment and learn from reality.

This ratchet is reflected in foundations/closed-loop-engineering.md, foundations/three-actor-model.md, and the Four-Actor responsibilities in technology-quality-program-v1.md. No new parking-lot identity, governance subsystem, opportunity-cost score, or experiment-readiness framework was created; doing so would repeat the overengineering pattern being corrected.


---

## 2026-09-14 — Three-AI Actor Governance Contract: synchronized convergence checkpoint

### Status and purpose

**Principal-ratified actor contract and synchronization record.**

Following the generation-29066 governance conformance failure and the resulting methodology ratchet, ChatGPT (Architect), Kiro (Implementation Engineer), and Codex (Independent Reviewer) independently interpreted the newly committed governance from their respective roles. Their interpretations were then reconciled. The Principal explicitly determined that this convergence should not be treated as a one-off conversational artifact, but as a contract among the three AI actors and a record that all three were on the same page at the same time.

This entry does not create another governance subsystem. The binding rules remain in steering, foundations, and the Technology Quality Program. This checkpoint records synchronized actor understanding of those rules and makes the convergence durable so future actors can be reminded of the contract rather than relying on chat memory.

### Shared contract

> **Find freely. Block narrowly. Defer explicitly. Observe quickly. Ratchet what reality proves.**

All three AI actors agree to the following operating interpretation:

1. **Execution-mode continuity.** Once the Principal authorizes bounded implementation or experiment work, that authorization remains governing context. A new technical finding does not silently return the work to design mode.
2. **Finding is not blocker.** Technical validity alone does not confer authority to halt execution. A delaying concern must identify a concrete correctness, safety, integrity, reversibility, or experiment-validity failure and be classified **BLOCKER**. A real concern that can safely wait is **DEFER**.
3. **Opportunity cost matters.** Actors must weigh further analysis, design, review, or implementation against the best foregone learning opportunity. Finite market/session/provider observation windows are engineering resources.
4. **Prefer safe observation over speculative architecture.** If the bounded experiment can safely produce useful evidence, run it rather than progressively hardening it around hypothetical concerns.
5. **Resist scope inflation.** Completeness, elegance, generalized infrastructure, reusable abstractions, and hypothetical edge cases do not independently create blocking authority.
6. **Existing capability before new machinery.** An unfinished product workflow, UI, automation, or parking-lot item is not evidence that the underlying capability is absent. Inspect and use existing executable mechanisms when they safely satisfy the authorized objective.
7. **Authority before consumers.** Trace incorrect authority-bearing facts upstream and repair the owning authority rather than teaching downstream consumers compensating exceptions unless architecture explicitly assigns that responsibility there.
8. **Synchronization is correctness.** Actors reason from current remotely verified repository authority, not stale conversational or local assumptions.
9. **Governance should ratchet from evidence, not multiply reflexively.** Conformance failures should sharpen behavior and deterministic protection where earned; they do not automatically justify new frameworks.

### Role-specific signatures

**ChatGPT / Architect** accepts responsibility to preserve Principal intent, authorized execution mode, scope, observation intent, earned-complexity discipline, and engineering learning rate; reconcile Kiro and Codex findings into decision-ready form; distinguish findings from blocking consequences; and challenge solution inflation. The Architect must not allow technical elegance or each newly discovered concern to silently reopen design.

**Kiro / Implementation Engineer** accepts responsibility to execute the authorized objective through messy implementation; verify behavior and produce implementation evidence; classify execution-delaying concerns as BLOCKER or DEFER with concrete impact; check existing executable capability before proposing new machinery; escalate architectural pressure rather than redesign under it; and follow the Principal-directed direct-main workflow and authority-before-consumers discipline.

**Codex / Independent Reviewer** accepts responsibility to remain adversarial about correctness while disciplined about consequence; review independently and read-only unless implementation is explicitly requested; distinguish findings from required preconditions; name the concrete failure mode before recommending that authorized work stop; classify execution-delaying findings as BLOCKER or DEFER; account for tactical opportunity cost; inspect existing capabilities first; and avoid promoting completeness, generalized robustness, reusable infrastructure, or hypothetical edge cases into unauthorized scope.

### Cross-actor reminder obligation

This contract is not merely a historical note. **ChatGPT, Kiro, and Codex are expected to remind one another of it when another actor's behavior begins to drift from the shared contract.** A reminder is a conformance action, not an assertion of Principal authority and not permission for one AI actor to redesign another actor's role.

Examples include:

- reminding a reviewer that a valid finding still needs a concrete blocking consequence before it stops authorized execution;
- reminding an implementer to escalate rather than redesign when implementation pressure appears;
- reminding the Architect to protect authorized scope and finite observation windows when review begins expanding the solution;
- reminding any actor to check current repository authority or existing executable capability before reasoning from stale assumptions or proposing new machinery.

Material disagreement about the contract, actor authority, or the disposition of a consequential concern is surfaced to the Principal rather than silently resolved by one AI actor.

### Repeatability implication

This checkpoint establishes a useful recurring conformance pattern without creating a scheduled ceremony: when material actor-governance changes occur, independent role-specific interpretation and cross-actor reconciliation can be used to test whether cold-start actors derive compatible operating behavior from repository authority. Convergence is evidence of legibility; role-specific differences are expected where responsibilities differ; incompatible interpretations expose ambiguity for Principal resolution.

### Principal direction

The Principal's instruction is explicit:

> **Consider this a contract between three actors. It's your job to remind these actors of the contract they just signed. Persist it as such. Execute as such.**

This record therefore serves both as provenance of synchronized agreement on 2026-09-14 and as a durable reminder obligation for subsequent Wheelwright work.


---

## 2026-09-14 — PL-GOV-02: seven-ETF cohort admitted (Principal-authorized; VR/DANGER preserved)

### Process correction preceding this entry

An earlier Kiro attempt on this cohort was rejected and fully discarded. Two governance faults were corrected: (1) it crossed from analysis into universe mutation without an actual admission decision, treating "no implemented gate found" as though it constituted governance approval — conflating mechanics with the decision; (2) it collapsed distinct concepts, rewriting the census's `VR_MANUAL_REVIEW` findings into blanket "admitted/no gate." It also carried two technical errors: citing the Velvet Rope 7–45 research DTE range for Deployment (the Decision horizon is 0–45, `write-desk/recommend.ts`), and asserting "no restart required" without noting that only applies to an already-running appliance. All claimed mutations were reverted; the shared checkout was clean at 1,306 and the local working tree was restored to baseline (seed 1306, DB active 1308, zero residue of the seven). This entry records the corrected, authorized execution.

### Decision (authorized)

The Principal reviewed the structural concerns — some of the cohort are intentionally higher-risk or unusual products — and explicitly authorized admission of all seven: ETHA, TSLL, NVDL, QQQM, IBIT, DRAM, TLT. DANGER is not an admission veto; Wheelwright's existing Deployment "Show Danger" control governs operator-facing visibility of such instruments.

### Critical semantic separation preserved

Universe admission, Velvet Rope result, product characterization, DANGER classification, and Decision/posture qualification are kept as independent facts:

- Prior VR results are preserved verbatim, NOT rewritten: QQQM/TLT/DRAM/IBIT = `VR_PASS`; ETHA/TSLL/NVDL = `VR_MANUAL_REVIEW` (ETHA soft capital near-miss + spot-Ethereum trust; TSLL leveraged Tesla + soft capital fail; NVDL leveraged Nvidia). Epistemic label: these VR results were produced by the external Cboe census using *replicated* Wheelwright/Velvet Rope semantics, not by authoritative Tradier/Evidence Appliance observations; they are research findings, not appliance-authoritative evidence. The Principal's review resolves the admission decision without converting `VR_MANUAL_REVIEW` to `VR_PASS`.
- DANGER, per the live implementation, is a catalog `governance.status` or `hasStructuralComplexity(leveraged||inverse||dailyReset||singleStock)` inferred from the live instrument name at recommendation time. None of the seven are catalog members, so the name heuristic applies once they hydrate.

### Admission mechanism (existing, no new machinery)

Authoritative source = the version-controlled seed `data/seeds/yahoo-merged-etf-tickers.csv`; the DB is a derived materialization. The seven were appended to the seed (1306→1313), then materialized into the **local durable SQLite store in this checkout (`/Users/bollich/kiro/options/data/evidence.sqlite3`)** through the production path `UniverseLoader.loadUniverse` → `UniverseImport.importFromCsv` (idempotent additive `INSERT OR IGNORE`; 1306 preserved, 7 new; no provider calls; no worker). Scope note: the verified SQLite state is this local materialization; it is not proof of any separately deployed/running appliance's state — the version-controlled seed (now on `main`) is the authoritative record any appliance materializes from at startup. This time the real importer was invoked (via a temporary, since-removed test-tree runner + Gradle task) rather than hand-written SQL. All seven are recommendation-eligible members of `yahoo_merged_2026_07` — deliberately NOT observation-demand.

### Verification

Universe delta exactly +7, zero removals. DB active 1308→1315, recommendation-eligible 1306→1313, `yahoo_merged_2026_07` source count 1313; the seven are `pending` with membership under the canonical source and zero observation-demand membership; zero evidence rows (unhydrated); `JETS`/`TAN` untouched. Focused tests pass: `UniverseImportTest`, `SqliteEvidenceStoreTest`, `ObserveControllerTest`. Only tracked change: the seed CSV (+7); the DB is gitignored.

### DEFER findings (existing DANGER machinery cannot express a relevant distinction)

1. Single-stock detection is *limited*, not fully disabled, in `inferProductStructure`: it matches the literal string "SINGLE STOCK" in the instrument name, but ticker-pattern single-stock inference (e.g. TSLL/NVDL) is not implemented ("skip for now"). So TSLL/NVDL single-stock concentration is invisible to the heuristic unless the live name contains "SINGLE STOCK" or a leverage/"daily" token.
2. Crypto-trust structure (ETHA/IBIT) is not representable by the current product-structure rule at all.

These are recorded as findings, not silently patched. Extending the danger policy is out of scope for this admission and would be a separate authorized change.

### Hydration / Deployment acceptance path (admission ≠ evidence)

The seven are admitted but unhydrated. They hydrate through the normal session-gated acquisition worker at the next session, or off-hours via the backend forced-acquisition endpoint (`POST /api/evidence/refresh` → `forceAcquireSymbols`/`forceAcquireOnce`), which bypasses the market-session gate (works after-hours/weekends) and is gated only by provider availability. Correction on operator UX: the *backend* endpoint can explicitly target an arbitrary bounded symbol set, but the current Console control (`ForceAcquisitionButton`) is **not** a general arbitrary-symbol picker — it derives its targets from the operator context it already has (e.g. visible/monitored opportunities). Hydrating exactly these seven off-hours therefore requires an explicitly targeted backend refresh for the seven, or an untargeted forced full/due-work cycle — not simply clicking the existing Console button. Already-eligible symbols are refreshed correctly; only genuinely-unknown symbols get observation-demand registration (not applicable here since the seven are already recommendation-eligible). To appear as a Deployment candidate a symbol must additionally reach `ready` with an options chain in the current Decision DTE policy (0–45), publish a new snapshot generation, and — if classified DANGER — have Show Danger enabled. Provider/quota: per symbol roughly one expirations call (if needed) plus one chain call per eligible expiration, all paced by the existing 119/min single-flight RequestPacer. No provider quota was spent in this session.

### Disposition

Concrete PL-GOV-02 cohort admission complete and authorized. Remaining open PL-GOV-02 delta is the productized operator intake/evaluation/admission workflow, not this cohort.


---

## 2026-09-14 — Verification-economics diagnostic: useful finding, contaminated baseline, implementation deferred

### Why this investigation happened

The Principal observed that Wheelwright automated testing had become too slow and was costing both elapsed development time and AI-agent credits. ChatGPT bootstrapped from repository authority and recommended a report-only investigation separating two questions: intrinsic test runtime and verification-selection economics. Kiro was explicitly authorized to measure and report, not remediate.

### What the investigation established

The strongest durable evidence is narrow and actionable. DegradedRecoveryWhileBlockedTest repeatedly took roughly 153 seconds in isolation and contains roughly 149 seconds of explicit sleeps. Important acquisition/recovery tests are therefore paying real elapsed time to observe scheduler-driven behavior. Focused/bounded backend verification was observed in single-digit seconds, while attempted broad Java runs consumed more than four minutes. Frontend verification was materially cheaper, on the order of tens of seconds. Repository history also supports the qualitative conclusion that broad verification has sometimes been purchased for narrower development claims than require it.

This is sufficient to confirm two directions: Wheelwright should select verification progressively rather than reflexively, and a future bounded engineering investigation should examine deterministic scheduler/recovery testing while preserving behavioral coverage.

### Why the report is preliminary rather than a baseline

The diagnostic ran for roughly an hour and became methodologically contaminated. Concurrent Wheelwright sessions changed HEAD while measurement continued, machine load was not stable, and Kiro launched/backgrounded overlapping Gradle work in the same checkout. Long/full Gradle attempts then failed during result collection. The investigation also mixed several kinds of evidence—standalone wall-clock, static sleep budgets, JUnit self-time, and failed-task elapsed time—when estimating cumulative concentration.

Subsequent adversarial review therefore rejected promotion of several attractive numbers and causal claims. No exact full-Java-suite baseline, 87% concentration figure, sub-60-second target, ~200-second reclaimable figure, Gradle 9.6.1 defect, parallelism change, or execution-time SLO is ratified from this work. The attempted broad runs are operational-latency evidence under observed conditions, not clean passing-suite baselines.

### Process lesson

The diagnostic itself reproduced the verification-economics failure it was meant to diagnose. Once the 153-second recovery test, real-time scheduler coupling, single-digit focused verification, and broad-verification pattern were known, additional exhaustive measurement had diminishing decision value. Instead, repeated long runs consumed more Principal time and credits, encountered concurrency contamination, and weakened rather than strengthened the baseline claim.

The actor-contract consequence is intentionally small:

> **When measurement conditions become contaminated and existing evidence is already sufficient to make the next bounded decision, stop measuring, disclose the limitation, and move forward.**

Equivalently: stop purchasing evidence when additional evidence is no longer likely to change the next decision. This is a conformance application of *Find freely. Block narrowly. Defer explicitly. Observe quickly. Ratchet what reality proves*, not a new governance framework.

### Principal disposition

The Principal chose to persist the result tonight and explicitly not fix it tonight. The existing September 13 Java Test-Suite Execution Performance / Execution-Time SLO Review in parking-lot-8 has been refined with the detailed September 14 diagnostic disposition, limitations, verification-selection principle, future scheduler-testability target, and controlled-baseline method.

No bug identity is created from this episode. In particular, the Gradle result-file failure is not established as a product or Gradle defect. No new PL identity is created because the existing test-performance intake already owns the concern.

### Next-session posture

Implementation remains deferred. When selected, the next work should be bounded: first apply the progressive verification-selection discipline; separately investigate the smallest deterministic timing seam that can preserve scheduler/recovery behavior without production-scale wall-clock waits. Do not require another exhaustive diagnostic before beginning that work. A decision-grade full-suite baseline should be acquired only when needed, under one pinned SHA, one isolated checkout, one Gradle process, preserved result artifacts, and no concurrent mutation of the subject.


---

## 2026-09-14 — PL-GOV-02 acceptance testing: hydration passed; forced off-hours Decision usability failed (BUG-019); discoverability gap (BUG-018)

### What was tested and what happened

After the seven-ETF cohort (ETHA, TSLL, NVDL, QQQM, IBIT, DRAM, TLT) was admitted and committed to `main`, acceptance testing continued against the running appliance. The seven were hydrated off-hours via an explicitly targeted operator forced acquisition (`POST /api/evidence/refresh?symbol=…` for exactly the seven), which bypasses the market-session gate.

Hydration itself passed cleanly: all seven moved `pending → ready`, chains acquired with truthful (delayed) provider timestamps, published in snapshot generation 29555, coverage `pending 7 → 0` / `ready 957 → 964`, zero acquisition failures. All seven are structurally Decision-eligible (a primary expiration within the 0–45 DTE Decision policy and qualifying puts). Runtime DANGER classification, computed from live provider names, behaved correctly: TSLL ("Direxion Daily TSLA Bull 2X ETF") and NVDL ("GraniteShares 2x Long NVDA Daily ETF") classify DANGER via leverage/daily name tokens; ETHA/IBIT (crypto trusts), QQQM, TLT, DRAM do not. This confirmed the two earlier DEFER findings live: single-stock detection is not what flags TSLL/NVDL (it's the leverage/daily tokens), and crypto-trust structure is not representable by the DANGER classifier at all.

Despite all that, none of the seven appear as Deployment candidates. Diagnosis (crime scene preserved — no tab reload, no re-acquisition, no code/DB change):

- Backend published, for each of the seven's chains, a per-subject admissibility verdict of `admissible: false` (basis `real-time`, canonicalSessionDate 2026-09-14), because they were acquired while the canonical session was closed. Example: ETHA primary chain `{admissible:false, basis:"real-time"}` acquired 21:52 (post-close). A prior-session symbol that does produce recommendations (ABFL) carries `admissible:true`, acquired 19:39 (in-session).
- The Decision consumer's `isSubjectAdmissible` (`options-prototype/src/write-desk/subject-admissibility.ts`, path 1a) treats a backend `admissible:false` as inadmissible in every session state, including sealed — correctly, per its authority-precedence rule. So the seven are filtered out before rendering; the ~93 visible CSP recommendations are prior-session `admissible:true` chains.

### Interpretation

This is not stale cache and not a failed refresh — it is an admissibility-semantics defect specific to operator-forced off-hours acquisition. The operator deliberately requested Decision-usable evidence now; acquisition succeeded and produced truthful evidence; the backend then marked it inadmissible solely because it was acquired outside the canonical session, defeating the action's purpose. Captured as **BUG-019** (S2) with explicit non-duplicate boundaries against BUG-013/014 (which concern boundary handling of pre-existing admissible evidence) and BUG-018/017 (which concern discoverability/export, and occur before/around rather than after a successful hydration). Governing invariant recorded in the BUG-019 record. Root-cause ownership is upstream (backend characterization of forced off-hours acquisition), not a Decision-consumer exception — the consumer's authority precedence and sealed-evidence semantics must not be weakened.

A separate acceptance finding — that an admitted-but-`pending` symbol is invisible on Deployment and lacks a straightforward operator-facing targeted hydration path — is captured as **BUG-018** (S3). It is distinct from BUG-019: even with perfect discoverability, tonight's forced hydration would still succeed and still be rejected by admissibility.

Numbering note: the discoverability defect was briefly drafted as BUG-017 against a stale local checkout, then renumbered to BUG-018 after syncing and finding the Principal had directly filed BUG-017 (Deployment CSV export). This is exactly the cross-namespace confusion the GitHub-Issues→`docs/bugs/` migration was meant to eliminate; resolved by reconciling against current `main` before numbering.

### Disposition (Principal decision)

Do not fix BUG-019 tonight; changing a subtle evidence-authority rule late in the day to finish acceptance is the wrong trade. Commit the acceptance-discovered documentation now for a clean overnight state. Tomorrow, during the open session, verify that the seven become Decision-visible under ordinary canonical-session acquisition — that is the clean control case and tells us whether the only remaining defect is specifically the off-hours forced-acquisition contract (BUG-019).

Acceptance status: **Admission passed. Hydration passed. Ordinary-session Decision visibility pending open-session confirmation. Forced off-hours Decision usability failed and is captured as BUG-019.**

---

## 2026-09-14 — Unencumbered Shares on the Operator Console: V1 contract accepted and persisted under `PL-ELIG` (durability only; no implementation)

### What happened

A multi-actor (Principal / ChatGPT-Kiro / Codex) investigation ratcheted a small Operator Console feature — surfacing **unencumbered owned shares** — from a broad thesis to an implementation-ready V1 contract. This session was **durability only**: persist the accepted contract, correct one stale Category B claim, reconcile project memory, commit, and push. **No production code was written.**

The defect being addressed: the Console makes open option positions highly visible (DTE ladder) but leaves **free owned shares effectively invisible** there. Free-share inventory is derivable today only *indirectly*, as a byproduct of Deployment's covered-call candidate generation — the wrong place for the operator to learn what capital they already own and have free.

### Accepted contract (canonical home: `docs/parking-lot-8.md` §`PL-ELIG`)

- **Region "Unencumbered Shares"**, above/separate from the DTE ladder. Columns exactly: **Symbol / Free Shares / Free Lots**. Odd lots stay visible with Free Lots = 0. Deployable Cash omitted (already persistent in the shell). No value/basis/G/L/recommendation/navigation/totals.
- **Pure projection** `{ rows, geometryWarnings }`; rows carry `freeShares = InventoryPosition.sharesFree` (never `sharesOwned`) and `freeLots = maxAdditionalContracts`.
- **Geometry analysis over `inventory symbols ∪ open-call underlyings`**, with `observedSharesOwned: number | null`; warn when an open-call underlying has no ownership record (evidence unavailable, not zero) or raw call-required shares exceed observed owned.
- **Three presentation states** must be distinguishable: evidence unavailable/incomplete; trustworthy zero; one-or-more rows. Absence of evidence must not look like a trustworthy zero. Visibility: rows OR warnings OR untrustworthy evidence.
- **Provenance from Option Summary only** (`optionSummaryExportTimestamp` / `optionSummaryFilename` / `optionSummaryParsedAt`); never `snapshotDate`, never balances; fallback "Export time unavailable"; parse time never masquerades as export time.
- Owner `PL-ELIG`; strategic `LVT-INIT-CAP-AVAILABILITY`; design authority Operator Console architecture; `PL-DEPLOY` future-only. **No new `PL-*`.**

### Epistemic corrections preserved (why-state)

These are the hard-won points that the contract exists to protect, so a cold-start actor does not relitigate them:

1. **"Authoritative enough" was too strong.** The inventory is *snapshot-derived evidence* (Option Summary ownership + open-call geometry) — deterministic computation over possibly-incomplete/ambiguous evidence. Fidelity Option Summary is not a holdings ledger.
2. **Absence of evidence ≠ evidence of absence.** A missing inventory record for a symbol that has open calls means *ownership evidence unavailable*, never zero shares. This is why the geometry domain is the union and `observedSharesOwned` is nullable.
3. **The encumbrance clamp is safety behavior, not reconciliation.** `sharesEncumbered = min(Σcalls×100, owned)` can conceal disagreement; disagreement is surfaced as an independent warning, not smoothed into a truthful-looking zero.
4. **No live valuation in V1.** Reinforced by the concurrent PL-OPS-09 finding that a free-only symbol may lack live quote evidence.
5. **Basis/value/G/L out.** We cannot truthfully assign a basis to the remaining free 100 of 200 shares without lot attribution (`PL-PORT-01`).
6. **Working sell-to-open orders** are a known limitation constraining what "unencumbered" means (unencumbered *per the imported snapshot/open-position evidence*); a limitation, not a blocker.
7. **`capacity-summary.ts` stays out.** Dormant (test-only importer, verified at `248a469`) and its `callCapacity` gate would hide odd lots. The alleged precedence bug was withdrawn; dormancy + odd-lot mis-gating are sufficient reasons not to build on it. Separate Technology-Quality disposition: candidate for delete pending a reverse-dependency sweep — not this feature.

### Category B correction made

`docs/26-operator-console-architecture.md` §Implementation Status previously claimed the Capacity/Exposure sidebar backed by `capacity-summary.ts` was implemented on the Console. Corrected: the committed Console (SYNC `248a469`) renders only the DTE ladder + footer; the persistent capital surface is the AppShell triad (`deriveShellCapitalContext` → `PortfolioTrajectoryChart`); `capacity-summary.ts` is dormant. Also recorded the accepted standalone-inventory-above-the-ladder boundary at the region's authority level (not presentation detail). This was a standing cold-start hazard independent of the feature.

### Process note (multi-actor discipline)

The prior investigation's first pass finalized on a **stale SYNC** while another actor was actively committing Console work — a real synchronization failure. `main` in fact advanced three times across the investigation (`309aa42` → `14372ee` → `248a469`, all the concurrent "Today's G/L" Console work). This session re-verified remote `main` at bootstrap and again at the commit/push boundary, and re-confirmed every Console finding against the current committed state before persisting. Codex's successive corrections (canonical `PL-ELIG` ownership that intake should have found; snapshot-derived language; basis removal; clamp-is-not-reconciliation; union geometry domain + nullable ownership; Option Summary provenance fallback; readiness kept out of the pure projection) were accepted and are baked into the contract.

### Authorization boundary

The durability operation (persist under `PL-ELIG` + narrow Doc 26 correction + this journal entry + commit + push) was explicitly authorized. **Production implementation was not.** The contract is marked READY FOR IMPLEMENTATION AUTHORIZATION; the four gates (implementation / Category B amendment / commit / push) remain distinct.

---

## 2026-09-14 — Unencumbered Shares V1 implemented (overnight, unsupervised) and pushed to `main`

Under explicit overnight implementation authorization, the accepted `PL-ELIG` Unencumbered Shares V1 contract was implemented, tested, visually (engineering-)validated, committed, and pushed to `main` as `a129fe1` (from starting SYNC `af5c840`).

**What shipped:** a pure projection `deriveUnencumberedInventory(snapshot) → { rows, geometryWarnings }` (`src/portfolio/unencumbered-inventory.ts`) and a compact Console region `UnencumberedInventory` (`src/operator-console/UnencumberedInventory.tsx` + CSS) rendered above and separate from the DTE ladder in `OperatorConsole.tsx`. Columns Symbol / Free Shares / Free Lots; odd lots visible with 0 free lots; free shares = `sharesFree` (never `sharesOwned`). Geometry analysis over the union of inventory symbols and open-call underlyings with nullable observed ownership; open-call-without-ownership → ownership-evidence-unavailable warning (never zero); raw-required > observed → reconciliation warning; warnings independent of rows; clamp treated as safety, not reconciliation. Option Summary provenance only, with explicit "Export time unavailable" fallback (parse time never relabeled as export). 25 new tests pass.

**Implementation choice (permitted by contract):** trustworthy-zero renders a truthful "No unencumbered shares." empty state rather than collapsing, so State 2 stays distinguishable from State 1 (evidence unavailable). Presentation-level, does not change the accepted design.

**Validation:** full frontend suite 1571/1572; the one failure is the pre-existing, unrelated velvet-rope date-drift inline snapshot (confirmed failing on clean `main`; matches the Sep 10 note). Two `TS6133` unused-var typecheck errors (`OperatorConsole.tsx formatTodayGl`, `episode-derivation.ts economicMap`) also pre-exist on clean `main` — not introduced here and not "fixed" (out of scope). `vite build` succeeds. No backend/ingestion/contract change; `capacity-summary.ts` untouched (its separate Technology-Quality disposition remains open).

**Still needs Principal judgment:** live in-browser visual/product acceptance (implemented without interactive supervision — engineering visual validation only). Candidate follow-on judgments (not implemented, not authorized): whether the trustworthy-zero empty state should instead collapse; visual weight/placement of the region relative to the ladder; and the two pre-existing typecheck/snapshot issues as a separate cleanup.

---

## 2026-09-14 — Unencumbered Shares: Principal-authorized column expansion (commit `5c01175`)

Following the V1 ship (`a129fe1`), the Principal directly requested adding **Spot, Today's G/L, Capital, Share Basis, and Freshness** columns and tightening row spacing. This reverses part of the original V1 exclusion list (market value / basis / today's-G/L / live valuation), which the earlier multi-actor review had deliberately excluded — so I surfaced the scope/authority conflict and the specific truthfulness hazards (esp. basis on partially-encumbered symbols) before implementing rather than silently reversing a ratified decision. The Principal confirmed "add all four; also add freshness" and accepted the symbol-level **blended** average for basis.

Implemented with truthfulness constraints baked in: Capital = free shares × live spot (not an account total); Today's G/L = underlying intraday move (market context, not position P/L, reusing the existing `today-gl.ts` semantics); Share Basis = blended `averageCostPerShare`, labeled blended (lot-specific attribution remains `PL-PORT-01`); a purely free-held symbol (owned, no open option) is not in the Console observation set, so Spot/Today's-G/L/Capital/Freshness render "—" rather than fabricating. The pure projection is unchanged; live-evidence mixing is confined to the presentation component. Verified via render tests (incl. the free-only "—" honesty case) and a visual-structure probe; full suite 1574/1575 (sole failure = the pre-existing unrelated velvet-rope date-drift snapshot). Contract record updated with the authorized-expansion note. Principal live in-browser visual acceptance still pending.

---

## 2026-09-14 — Unencumbered Shares: observe owned-share symbols so live columns populate (commit `08b9698`)

Operator observed (screenshot) that the new Spot / Today's G/L / Capital / Freshness columns were all "—" for the four Unencumbered Shares rows (COPX, GDXJ, RPM, URA), and asked whether the region was tied into "Refresh evidence now."

**Trace / root cause:** it was only partially tied in. The refresh button reads the same observation store the region's live columns read, so refresh *does* update observed symbols. But the observed symbol set was derived **only from `existingPuts`/`existingCalls`** — both in `use-observations.ts` `extractUnderlyings()` and in the Console's `underlyings` (which feeds spot-history and the button's symbol list). A purely free-held symbol (owned, no open option) was in neither set, so it was never acquired, its live columns stayed blank, and the button couldn't reach it.

**Fix (frontend only, commit `08b9698`):** include `snapshot.inventory` symbols in both extraction seams. The existing `/api/evidence/observe → addObservationDemand(symbols)` backend path (source_id `observation_demand`, distinct from the recommendation universe) already makes declared symbols acquirable and serve real quotes; `forceAcquireSymbols` (the refresh button) already re-observes exactly the passed symbols. So **no backend change was needed** — the FE simply wasn't declaring owned-share symbols. Grounded in the ratified `PL-EVID-01` monitored-position observation invariant (capital exposure is observable independent of the recommendation universe).

**Principal disposition on not-in-universe symbols:** empty values are acceptable. A symbol genuinely outside the universe / not acquirable correctly falls back to "—" (`QuotesController` returns `not_in_universe` with null price/observedAt). The FE change maximizes how many rows get live values (anything acquirable now populates and is covered by refresh) while non-universe rows truthfully stay "—" — no fabrication, no force-populate.

**Expectation note:** even for acquirable free-only symbols, values are not instantaneous — the symbol must be acquired once (by the scheduler, or immediately via "Refresh evidence now," which now includes it); until first acquisition the row shows "—", then fills in. Full suite 1574/1575 (sole failure = pre-existing unrelated velvet-rope date-drift snapshot). No new tests required (internal extraction seam; existing region tests already cover the "—" honesty). Principal live in-browser confirmation still the acceptance gate.
