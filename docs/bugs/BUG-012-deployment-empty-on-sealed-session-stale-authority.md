# BUG-012 — Deployment (Write Desk) shows zero candidates on a sealed/non-trading session because session authority never reaches the recommendation consumer

- **Status:** Open
- **Severity:** S2
- **Area:** Write Desk (Deployment surface) / consumer-path session-authority reach
- **Provenance:** Discovered 2026-09-13 during a sealed NON_TRADING_DAY (Sunday) readiness check. No GitHub Issue (repository-native defect system, per `docs/bugs/README.md`).

## Observed failure

On the Deployment surface (Write Desk) during a sealed, non-trading session (Sunday 2026-09-13; canonical session date 2026-09-11), every candidate section renders empty:

- **Buy-Write Candidates:** "1306 incomplete", "0-list awaiting candidates", "No actionable buy-write opportunities available…"
- **Cash-Secured Put Candidates:** "0 Recommendations · 0 Wait", "1306 incomplete"
- **Covered-Call Candidates:** empty
- Recommendation Brief rail: "Select a candidate to inspect"

The "1306 incomplete" count equals the full universe: essentially every symbol is being treated as not-current/not-admissible for recommendation generation, even though the backend holds complete, admissible sealed evidence from the last close.

## Intended semantics violated

Sealed-evidence validity (a governing invariant): evidence from a completed session remains valid until superseded by the next session — "Friday's sealed close remains valid through the weekend." The Deployment surface must therefore show rows sourced from the last close during a sealed/non-trading session, not an empty board.

Consumer-path authority reach (ADR-017): an authoritative session verdict must reach the consumer that gates on it. Publishing/deriving the correct authority is not sufficient if the consumer keeps acting on a stale, pre-authority value. This is the same authority-precedence spine as ADR-015/016/017 and the direct sibling of BUG-010: authority computed but not consumed.

## Evidence

### The data is present and correctly stamped (backend is not at fault)

Direct SQLite inspection (`data/evidence.sqlite3`, read-only) and the live snapshot (`GET /api/evidence/snapshot`) on 2026-09-13:

- `evidence` table: 3,591 chain rows with usable payloads. **2,109 chain rows are from session_date 2026-09-11 (Friday's close), environment `production`**, retrieved Friday afternoon (~19:53–20:04 UTC). 941 **distinct symbols** have at least one Friday chain row. This 941 figure is a row-density measure only (a symbol carries one chain row per eligible expiration, so rows outnumber symbols); it does **not** by itself explain the 955 serialized-ready figure below and is not offered as a reconciliation of it.
- Snapshot coverage counter: `ready:957, absent:351` of `universe:1306`; nothing pending/failed. The emitted `symbols[]` array of this same snapshot contains **955** entries with `status:"ready"`. **The 2-symbol gap between `coverage.ready` (957) and the count of serialized ready symbols (955) is an OBSERVED, UNEXPLAINED discrepancy** — the cause (a coverage-counter vs symbol-serialization computation difference, a timing/generation effect, or something else) has not been established and is not asserted here. It is recorded honestly as an open observation. It is not material to this defect: where this record reasons about the recommendation population it uses the **955 serialized ready symbols** (the set the recommendation engine actually iterates), which is the number that was directly reproduced.
- Per-subject admissibility is correct: the Friday production chains at eligible 7–45 DTE expirations carry `{admissible:true, basis:"real-time", canonicalSessionDate:"2026-09-11"}`. Only genuinely stale August chains at dead/expired expirations carry `{admissible:false, basis:"unknown"}` — which is correct.
- Reproduction against the real snapshot: **all 955 serialized ready symbols have at least one eligible (7–45 DTE) chain marked `admissible:true`** (0 ready symbols lacked one). Under correct session flags the engine should produce candidates.

`GET /api/status` session block at observation time:

```
state: NON_TRADING_DAY, canonicalSessionDate: 2026-09-11,
acceptingCanonicalEvidence: false, priorSessionOperationallyValid: false,
providerDelayMinutes: 0, admissibilityBoundaryEpochMs: null
```

### Frontend root cause (traced)

`options-prototype/src/components/WriteDesk.tsx`:

1. `useSessionClassification()` starts from a `BOOTSTRAP` value with `authorityPending: true` (`options-prototype/src/hooks/useSessionClassification.ts`). `authorityPending` becomes `false` only after the first successful `/api/status` read.
2. `isSubjectAdmissible` (`options-prototype/src/write-desk/subject-admissibility.ts`) gate (0): **`if (ctx.authorityPending) return false;`** — every record (expirations and chains alike) is inadmissible while authority is pending (fail closed, by design — this is the ADR-017 startup discipline).
3. `handleNewEvidence` (the snapshot-response callback) and `handleReRecommend` read `sessionClassification.state / .admissibilityBoundaryEpochMs / .authorityPending`. Originally they read it from the **render-time closure**, capturing whatever classification existed when the callback was created — which on cold load is the `BOOTSTRAP` value (`authorityPending: true`).
4. On load during a sealed session: the first snapshot poll calls `handleNewEvidence`, which runs `recommendPuts/recommendCalls/recommendBuyWrites` with `authorityPending: true` → gate (0) rejects every record → `funnelPending == universe` → "1306 incomplete", 0 candidates across all three sections.
5. The **decisive ordering (in-flight stale callback):** a snapshot request can *begin* while authority is still `BOOTSTRAP`, and authority can resolve *before the response returns*. When the in-flight response completes, a closure-reading callback runs Decision with the stale bootstrap authority even though authority is now known — and, because subsequent polls `304` on a stable ETag, nothing re-evaluates. The board stays empty. Merely adding `sessionClassification` to callback dependency arrays does **not** repair a callback that is already in flight; the authority it consults must be current at *execution time*, not at *request-start time*.

The governing invariant this violates: **async evidence arrival may be stale in time; authority consumption may not be stale in closure.**

## Consequence

On any load of the Deployment surface during a sealed/non-trading session (every weekend, every holiday, every pre-open), the operator sees an empty board and cannot assess the last close's opportunities — exactly the situation sealed-evidence validity exists to serve. The evidence is present and admissible; the surface simply never consumes the resolved authority. Operator-facing correctness failure on a primary surface → **S2 (major)**.

## Diagnosis / root cause

Consumer-path authority-reach failure (ADR-017 class): the Deployment recommendation path consumed **stale-in-closure** session authority. The primary root cause is **execution-time authority staleness** — Decision ran with the authority captured when an async snapshot request *started*, not the authority current when the response *executed*. A secondary gap is that once the empty run had completed and polls were `304`-ing, nothing re-evaluated when authority later resolved.

The backend snapshot and per-subject admissibility verdicts are correct and are not implicated.

## Scope / non-goals

Frontend consumer-path authority-freshness + a minimal re-evaluation trigger only. No backend change (snapshot/admissibility verdicts are correct). No change to `isSubjectAdmissible` precedence, session semantics, scheduler, acquisition, freshness horizons, cache TTLs, or the snapshot contract. No reacquisition and no provider calls (existing cached Friday evidence is reused). Filing does not authorize remediation.

## Acceptance criteria

- On a sealed/non-trading session, the Deployment surface shows rows sourced from the last completed session's sealed evidence (existing cached evidence reused; no provider calls; no reacquisition).
- Whenever Decision executes it consumes the **current** `sessionClassification` at execution time — including when an in-flight snapshot callback created under bootstrap authority completes after authority has resolved.
- The board recovers without requiring a new snapshot `200`/`304` after authority resolution.
- A policy change still produces exactly one recommendation run.
- Live-session behavior, the ADR-017 authority-precedence order, and `authorityPending` fail-closed startup are all preserved (no record becomes admissible before authority arrives).
- No regression to existing Write Desk tests.

## Remediation history

Remediation implemented (not yet committed; awaiting Principal browser test) in `options-prototype/src/components/WriteDesk.tsx`:

- **Runtime-authority invariant (primary fix).** Added `sessionClassificationRef`, updated on **every render**, and a `currentAuthority()` reader. `handleNewEvidence` and `handleReRecommend` now derive `sessionClosed / admissibilityBoundaryMs / authorityPending / acceptingCanonicalEvidence / priorSessionOperationallyValid` from that ref **at execution time**, not from their render-time closure. An in-flight snapshot response created under bootstrap authority therefore runs Decision with the authority current when the response completes. The callbacks no longer depend on `sessionClassification`.
- **Minimal re-evaluation trigger (secondary).** A single `useEffect` keyed on `sessionClassification` re-runs the cache-only recommendation set when authority changes *after* evidence has already been ingested (guarded by `evidenceIngestedRef`, a ref so it does not itself add a dependency). This covers the evidence-first-then-authority ordering where the ingest callback already completed and polls are now `304`-ing. It does not fire on policy changes (those are owned by the explicit control handlers → exactly one run per policy change) and issues zero provider calls.

## Verification

- **Regression test** `options-prototype/tests/write-desk/runtime-authority-convergence.test.tsx` reproduces the in-flight stale-callback ordering: a callback created while `authorityPending:true`, authority resolving before it completes, then the callback executing. It asserts the execution-time (ref) read produces rows and — as a discriminator — that the render-time (closure) read fails closed (empty board), plus the authority-first ordering. All pass.
- Focused + relevant suites green: `runtime-authority-convergence`, `evidence-admissibility`, `mixed-authority-admissibility`, `recommend`, `recommend-funnel`, `recommend-calls`, `contingent-calls` (72 tests).
- `tsc --noEmit -p tsconfig.app.json` clean for the change.
- **Test-fidelity note:** the regression test asserts the runtime-authority *invariant* by mirroring WriteDesk's ref-at-execution-time pattern and contrasting it against the closure-capture bug; it is a pattern/invariant-level guard, not a full `Deployment` component render. A full-component render test was deliberately not added to keep this fix minimal.
- Not yet validated in the live browser (pending Principal test).

## Related

- **BUG-010** — sibling authority-boundary defect (frontend session gate); its resolution ratified **ADR-017** (Authoritative Verdict Precedence and Consumer-Path Reach), the governing lesson this defect re-expresses on the re-run/reach axis.
- **ADR-015 / ADR-016 / ADR-017** (`docs/07c-adrs.md`) — the authority-precedence spine.
- Sealed-evidence validity invariant (`docs/foundations/backend-behavioral-invariants.md`; `docs/07-architecture-current.md` — sealed evidence remains valid until superseded).
