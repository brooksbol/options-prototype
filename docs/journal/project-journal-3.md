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
