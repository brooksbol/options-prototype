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
