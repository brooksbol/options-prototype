# BUG-025 — Deployment overlapping snapshot responses can regress evidence state / ETag (no latest-generation ordering or stale-response rejection)

- **Status:** Open
- **Severity:** Not established (defect mechanism demonstrated from current implementation; no operator-visible manifestation observed)
- **Area:** Deployment / Write Desk evidence snapshot concurrency
- **Provenance:** Discovered during independent review (Codex) of `options-prototype/src/components/WriteDesk.tsx`; mechanism confirmed by Kiro against accepted `main`. No GitHub Issue (repository-native defect system, per `docs/bugs/README.md`). Filing does not authorize remediation.

## Observed failure

On the Deployment (Write Desk) surface, two independent readers of the same backend evidence snapshot — the normal 30-second poll (`pollSnapshot`) and the targeted "Refresh top opportunities" path (`refreshDeploymentEvidence`) — can have responses in flight at the same time and both asynchronously mutate the same client-side evidence state and the shared conditional-request ETag, with no coordination that guarantees the most recently generated evidence wins.

Because response-completion order is not guaranteed to equal evidence-generation order, an older snapshot response completing later can overwrite a newer already-accepted snapshot and regress the stored ETag to the older generation.

Epistemic status: this is a **demonstrated mechanism defect** established by reading and modeling the current implementation. An actual operator-visible occurrence (stale recommendations or a regressed board shown to the operator) has **not** been observed. Severity and concrete live consequence are therefore not established. This record must not be read as reporting an observed field failure.

## Intended semantics violated

Proposed invariant this defect violates:

> A snapshot response older than the latest already-accepted evidence generation must not be able to mutate client evidence state or regress the accepted ETag. When responses can complete out of order, the client must accept results in evidence-generation order (latest-generation wins) and reject or ignore a response that is older than what has already been accepted.

This is the client-consumer expression of generation monotonicity: the backend publishes monotonically increasing generations (ETag `"gen-<N>"`), and a consumer that maintains a single view of "current evidence" must not let a late-arriving older generation regress that view.

## Evidence

Traced implementation on accepted `main` (SYNC `1962a9ed8a6495ab15f90eec04f05b8bf0130d72`), `options-prototype/src/components/WriteDesk.tsx`:

1. **Two independent readers with separate, non-shared in-flight guards.**
   - `pollSnapshot` is guarded by `pollingRef` (guards only its own overlap).
   - `refreshDeploymentEvidence` is guarded by its own `refreshInFlightRef`.
   - The two guards are independent, so a poll response and a targeted-refresh response can be in flight and complete concurrently. `refreshDeploymentEvidence` runs a multi-step backoff schedule of unconditional snapshot reads, widening the window in which its responses overlap the 30-second poller.

2. **Both paths asynchronously mutate the same evidence state and the shared ETag.**
   - Both call the same `handleNewEvidence(...)` consumer, which awaits IndexedDB writes and awaited recommendation computation (`recommendPuts` / `recommendCalls` / `recommendBuyWrites`) and then writes shared recommendation state (`setPutCandidates`, `setBuyWriteCandidates`, `setCallCandidates`, `setEvidenceMeta`, …).
   - Both paths write the shared `etagRef.current` from their response's `etag` header (the refresh path comments this as keeping "the normal poller's ETag in sync").

3. **No generation ordering / stale-response guard anywhere in the path.** There is no run-id, sequence number, latest-accepted-generation comparison, `AbortController`, or equivalent that would cause a response carrying an older generation to be ignored once a newer generation has been accepted. The recommendation-state writes in `handleNewEvidence` are unconditional.

4. **Completion order is not guaranteed to equal generation order.** `handleNewEvidence` performs variable-latency async work (IndexedDB + per-symbol cache reads across the universe). Two invocations started for different generations can therefore finish in either order; whichever finishes last publishes last, regardless of which generation it carries.

Modeled reproduction (investigation only; not committed): a self-contained harness in the project's accepted invariant-modeling style reproduced, each with a discriminating control, (a) the guard being released while processing is still running, (b) an older generation finishing last overwriting a newer generation's published state when no latest-wins guard is present (control: a latest-wins guard preserves the newer generation), and (c) the ETag advancing/regressing independently of which generation's processing last completed. The control variants (with a latest-generation guard) did not exhibit the regression, confirming the harness discriminates the defect rather than trivially passing.

## Consequence

If two snapshot responses overlap and the older one completes last, the Deployment surface can be left displaying an older evidence generation's recommendations and can regress the accepted ETag to that older generation. Because Deployment is a primary decision-support surface, a regression to stale recommendations is a correctness/legibility concern.

The concrete operator-visible consequence and its frequency have not been observed, so severity is recorded as **Not established**. The dominant real-world overlap trigger is a targeted-refresh response overlapping a normal poll response (or vice versa); back-to-back 30-second polls are individually serialized by `pollingRef` for their fetch, but their downstream processing is not serialized against the independently guarded refresh path.

## Diagnosis / root cause

Client-side consumer concurrency without generation-ordered acceptance. The evidence-snapshot consumer treats every successful response as authoritative-now and publishes its results unconditionally, while two independently guarded readers can produce concurrently completing responses. The missing element is a single, shared notion of "latest accepted evidence generation" that gates both state mutation and ETag advancement so that a response older than the latest accepted generation cannot regress the view. Root cause is established at the mechanism level; the specific runtime conditions under which it manifests to an operator are not established.

## Scope / non-goals

This record covers **only** the demonstrated concurrency defect: overlapping normal-poll and targeted-refresh snapshot responses in Deployment mutating shared evidence state / ETag without generation ordering or stale-response rejection.

Explicitly excluded from BUG-025:

- Backend acquisition overlap or backend scheduler concurrency.
- Provider rate limiting.
- The already-remediated refresh / `304` behavior (the dedicated refresh path's deliberate unconditional-`200` design and the earlier "clicked, nothing changed" symptom).
- Any generalized concurrency redesign beyond what is required to describe this demonstrated defect.
- Session-authority freshness in the consumer path (that is BUG-012, a distinct invariant about which authority value Decision reads at execution time, not about generation-ordered acceptance of overlapping responses).

Filing does not authorize remediation, and this record deliberately does **not** prescribe a remediation architecture.

## Acceptance direction

A response older than the latest accepted evidence generation cannot mutate client evidence state or regress the accepted ETag. When snapshot responses can complete out of order, acceptance is ordered by evidence generation (latest-generation wins), and a response carrying an older generation than the one already accepted is ignored for both state mutation and ETag advancement. (Direction only; a specific mechanism is not prescribed by this filing.)

## Remediation history

Empty (Open). No remediation performed or authorized.

## Verification

Empty (Open). No fix to verify. The defect mechanism was demonstrated by tracing the current implementation and by a non-committed modeling harness (see Evidence); no production behavior was changed.

## Related

- **BUG-012** (`docs/bugs/BUG-012-deployment-empty-on-sealed-session-stale-authority.md`) — same surface (Deployment / Write Desk consumer path) but a distinct invariant: BUG-012 concerns consuming the *current session authority value* at execution time (fixed via `sessionClassificationRef`). It does not address generation-ordered acceptance of overlapping snapshot responses, ETag regression, or stale-response rejection. Not a duplicate.
- **Snapshot contract v1** (`docs/contracts/evidence-snapshot-v1.md`) and generation monotonicity (`docs/foundations/backend-behavioral-invariants.md`) — the backend-side monotonic-generation semantics whose client-consumer counterpart this invariant expresses.
