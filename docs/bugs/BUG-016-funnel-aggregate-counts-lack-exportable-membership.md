# BUG-016 — Deployment funnels expose aggregate counts without preserving/exporting the exact evaluation-unit membership that produced them

- **Status:** Resolved
- **Severity:** S3 (observability/audit gap; displayed numeric counts are correct — the defect is that the membership behind them is not preserved or exportable)
- **Area:** Write Desk / Decision funnels (CSP, Covered Call, Buy-Write) — observability
- **Provenance:** Discovered 2026-09-14 (Principal-directed observability work). Filed per `docs/bugs/README.md`.

## Observed failure

Each Deployment strategy surface (Cash-Secured Puts, Covered Calls, Buy-Writes) displays a Decision funnel as aggregate counts (e.g. Actionable, Edge, Wait, Zero OI, Wide Spread, No Delta Match, No Options, Incomplete). The engines computed each evaluation unit's terminal classification and then incremented an aggregate counter and **discarded the per-unit verdict**:

- `recommendPuts` (CSP) accumulated `funnel*` / `excl*` integer counters; the per-symbol terminal decision was not retained in the result.
- `recommendBuyWrites` (BW) accumulated `outcome*` counters (`BuyWriteOutcomes`); the per-symbol verdict was not retained.
- `recommendCalls` (Covered Call) had **no funnel/terminal taxonomy at all** — only ranked candidate rows plus a coarse free-text `excluded[]` for holdings that produced nothing.

Consequently there was no way to obtain the exact evaluation-unit membership (which specific symbols/holdings landed in which terminal state) behind a visible funnel count.

## Intended semantics violated

- **Persist facts; derive trust / observability.** The system should be able to expose the concrete facts behind a summary, not only the summary. An aggregate count that cannot be decomposed into its contributing units is not auditable.
- **Deterministic recommendation generation.** Determinism is only verifiable if the exact membership that produced a run's counts can be captured and compared. Aggregate counters alone do not permit reproduction or diff of a specific Decision run.
- **Governed-universe analysis.** Answering "which symbols are Zero OI / Wide Spread / No Delta Match right now?" requires membership, which was unavailable.

## Evidence

Implementation truth on `main` at discovery (frontend `options-prototype/src/write-desk/`):

- `recommend.ts`: the symbol loop computed a terminal classification at each exit (`nonOptionable`, `pending`, `noDteMatch`, posture `ACTIONABLE/EDGE/WAIT`, wide-spread, `noDeltaMatch`, hard-no zero-bid/zero-OI, missing chain) and executed `counter++` with no retained per-symbol record. `RecommendationFunnel.outcomes` (`TerminalOutcomes`) held only integer counts.
- `recommend-buy-writes.ts`: parallel `outcome*` counters (`BuyWriteOutcomes`, including the buy-write-specific `strategyUnfit`), per-symbol verdict discarded.
- `recommend-calls.ts`: `CallRecommendationResult` had `candidates`, `waitCandidates`, `excluded[]`, `eligiblePositions`, `symbolsWithCandidates` — no terminal taxonomy; hard-no contracts were silently dropped.
- `FunnelInfographic.tsx` rendered the CSP funnel from `TerminalOutcomes`; the Buy-Write distribution bar rendered `BuyWriteOutcomes`; covered calls had no funnel display. None of the displayed counts was backed by an exportable membership collection.

## Consequence

Without exportable membership the operator (and engineering) cannot:

- audit which governed evaluation units produced a funnel count;
- diagnose why a specific symbol/holding landed in a terminal state;
- reproduce or diff a specific Decision run's membership;
- perform governed-universe analysis (e.g. enumerate all Zero-OI or No-Delta-Match symbols).

No incorrect operator-facing number is displayed; the counts themselves are correct. The gap is the absence of the underlying evidence behind them — hence S3.

## Diagnosis / root cause

The engines treated the funnel as a set of running integer tallies rather than as a derivation over a retained per-unit terminal-membership collection. The membership existed transiently inside the evaluation loop and was thrown away after counting, so the visible counts and the (absent) membership could not be reconciled or exported.

## Scope / non-goals

This record covers observability and export of Decision-funnel membership only. It explicitly does **not** cover, and remediation must not change:

- recommendation semantics, admissibility rules, ranking, or policy thresholds;
- acquisition, renewal, or provider behavior;
- universe membership, strategy eligibility, or portfolio/inventory governance;
- the ETag/snapshot contract.

No drill-down UI, lifecycle architecture, universe-removal behavior, or unrelated cleanup is in scope.

## Acceptance criteria

1. Every governed evaluation unit appears exactly once in its strategy's exportable membership.
2. Every exported unit carries exactly one terminal outcome.
3. Grouping membership by terminal outcome reproduces every visible funnel count for that strategy exactly.
4. The sum of all terminal-outcome groups (named categories plus any residual) equals the strategy's displayed governed denominator — CSP: monitored universe symbols; Covered Call: eligible holdings; Buy-Write: evaluated universe symbols.
5. Covered-call and buy-write exports preserve their actual terminal taxonomies (not forced into the CSP taxonomy).
6. A new Decision run atomically replaces that strategy's exportable result; export never mixes rows from different runs.
7. Export causes zero provider calls, zero evidence mutation, and zero Decision reruns.
8. Export is disabled when no complete displayed Decision result is available; an empty/incomplete result cannot be exported as if complete.
9. CSV encoding escapes commas, quotes, and line breaks, and neutralizes spreadsheet formula-leading values (`=`, `+`, `-`, `@`).

## Remediation history

Remediation implemented and accepted (frontend only; `options-prototype`):

- Added a shared, immutable per-strategy export contract: `options-prototype/src/write-desk/funnel-export/funnel-export-types.ts` (`DecisionExportResult` = run metadata + terminal membership + derived counters; `deriveCounters`, `buildDecisionExportResult`, `createDecisionRunId`). Counters are **derived from** the membership so displayed counts and exported membership cannot diverge.
- Added a shared CSV utility `funnel-export/funnel-csv.ts` with RFC-4180 escaping and formula-injection neutralization, plus filename and guarded download helpers.
- Extended each engine to record exactly one terminal-membership record per governed evaluation unit at its single terminal exit, using each strategy's native taxonomy (CSP `TerminalOutcomes`; Buy-Write `BuyWriteOutcomes` incl. `strategyUnfit`; a new Covered-Call taxonomy over eligible holdings). Membership recording is additive and gated behind an optional `exportContext`, so Decision behavior is byte-identical when no context is supplied.
- **Single accounting authority (correction pass):** the visible funnel/outcomes are derived from the SAME `terminalMembership` collection that is exported, via `deriveTypedCounters`, not from separate legacy tallies. CSP `funnel.outcomes` and Buy-Write `outcomes` are membership-derived; the Buy-Write per-outcome counters were removed entirely (the membership is the sole terminal accounting). Covered-Call's displayed governed denominator (`eligiblePositions`) is derived from membership length. Legacy CSP counters survive only for genuinely separate, non-terminal-outcome metrics (coverage/hydration/ranking and the legacy-compat scalars/exclusion narrative) and no longer populate the terminal taxonomy.
- **Runtime reconciliation invariants:** each engine calls `assertReconciled(membership, governedDenominator, strategy)` — asserting `membership.length === denominator` and `sum(derived counters) === denominator` — and `deriveTypedCounters` throws on any terminal outcome outside the strategy taxonomy. These fail loudly (throw) on drift rather than silently repairing, dropping, or exporting inconsistent membership.
- **Exact per-unit provenance:** the chain-acquisition instant already established on the evidence is copied into the terminal record's `evidenceRetrievedAt` for every terminal branch that inspected chain evidence — the recommended cohorts (Actionable/Edge/Wait, wide-spread) via the winning candidate, AND the hard-no / no-delta / strategy-unfit / no-qualifying-call cohorts (Zero OI, Zero Bid, No Delta Match, etc.) via the per-symbol/per-holding chain provenance observed during evaluation. Branches that never reached chain evidence (confirmed-absence → `nonOptionable`, missing expirations → `incomplete`, no eligible DTE → `noDteMatch`) legitimately leave `evidenceRetrievedAt` blank. No provenance is synthesized from generic runtime state; run-level facts (environment) remain in run metadata. No new acquisition, provider call, SQLite/snapshot reconstruction, or provenance subsystem.
- Wired `WriteDesk.tsx` to hold one immutable exportable result per strategy, replaced atomically on each Decision run, and added three labeled export buttons (Export CSP / Covered Calls / Buy-Write Funnel CSV) disabled when no complete result is available.

## Verification

- Frontend `tsc --noEmit`: passes.
- Focused tests in `options-prototype/tests/write-desk/`: `funnel-csv.test.ts`, `funnel-export-csp.test.ts`, `funnel-export-covered-call.test.ts`, `funnel-export-buy-write.test.ts`, `funnel-reconciliation.test.ts`: pass. They assert one record per governed unit; that visible funnel/outcomes equal `deriveCounters(membership)` (single accounting authority) for CSP and Buy-Write; grouping-reproduces-counters; `membership.length === denominator` and `sum(counters) === denominator` per strategy; Zero OI / Wide Spread / No Delta Match membership completeness; exact provenance copied on recommended cohorts AND on the Zero OI / No Delta Match cohorts (which inspected chain evidence), and left blank where genuinely unavailable; taxonomy-drift and reconciliation assertions fail loudly; CSV escaping/formula neutralization; no cache mutation on export; distinct-run atomicity; and the incomplete/reconciliation-invalid export guard.
- Full `options-prototype` Vitest suite: 1,531 pass; 1 pre-existing, unrelated failure in `tests/velvet-rope/multi-expiration.test.ts` (a date-relative `toMatchInlineSnapshot` drifting with the current date — confirmed failing on clean `main` `a1028a0` via `git stash`). Not caused by and not addressed in this work.
- **Browser acceptance (2026-09-14):** operator exported all three funnel CSVs from the live Write Desk (frozen Decision run, evidence generation 29066, evaluated ~2026-09-14T17:13:55Z) and an independent review reconciled them against the displayed funnels:
  - CSP: 1,306 rows = 1,306 unique symbols (governed denominator = monitored universe); grouped `terminal_outcome` reproduced the visible funnel (incl. 183 Zero OI, 73 Wide Spread, 526 No Delta Match).
  - Buy-Write: 1,306 rows = 1,306 unique symbols; grouped outcomes reconciled (e.g. 513 Zero OI, 76 Wide Spread, 6 No Delta Match).
  - Covered Call: 4 rows = 4 eligible holdings (governed denominator = eligible inventory positions), not forced into CSP semantics.
  - Each CSV carried the run-identifying filename/metadata for one Decision run; no cross-run mixing.
- Provenance completeness on the chain-inspecting cohorts (Zero OI / Zero Bid / No Delta Match) is present in the accepted tree (see Remediation, "Exact per-unit provenance"). CSVs exported before that follow-up reached the running dev server showed blank `evidence_retrieved_at` on those cohorts; the accepted code populates them from the participating chain record.

## Related

- `docs/17-recommendation-funnel-analysis.md`, `docs/19-funnel-architecture.md` (funnel behavior/stage documentation).
- `PL-GOV-02` (Universe Candidate Evaluation / Admission Workflow) — governed-universe analysis consumer that benefits from exportable membership; cross-reference, not double-booked.
- ADR-017 (consumer-path authority precedence) — funnel counts are now derived from the same membership that is exported (single owner of the fact).
