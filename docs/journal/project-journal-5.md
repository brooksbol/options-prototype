# Project Journal — Continuation 5

> **Continuation notice.** This file is physical page 5 of the single logical Wheelwright project journal. It continues `docs/journal/project-journal.md`, `-2`, `-3`, and `-4` with no lesser authority or durability. File boundaries are pagination only; topical retrieval and chronological reconstruction must scan the complete `docs/journal/project-journal*.md` sequence (see `docs/README.md` Project-Journal Continuation Rule and `docs/bootstrap/project-memory-protocol.md`).
>
> **Why a new page here:** page `-4` carried concurrent uncommitted why-state from a separate active thread (the BUG-021 buy-to-close candidate) at the time this entry was written. Per the multi-actor shared-working-state discipline (`foundations/multi-actor-repeatability-temporal-synchronization.md` §10), that unowned working state must not be absorbed, staged, or committed by another actor. Opening this continuation lets this entry be committed as owned work without disturbing the concurrent page-`-4` edits. This is coordination hygiene, not a claim that `-4` was full.

---

## 2026-09-17 — Zero-cash Write Desk outage: known $0 deployable emptied the board (Kiro)

**Actor:** Kiro (repository-resident implementation partner).
**SYNC SHA at repair:** repair pushed at `5610f3ea5bafb20d1f323d0c19792344543b40f6` (accepted `main`; this journal entry authored at a later `main` after the unrelated Operator Console totals-alignment commit `f936879` landed).
**Mode:** Outage RCA / why-state preservation. The repair is already restored, committed, pushed, and Principal-validated. This entry only makes the RCA durable outside git history (Principal disposition: journal, **not** a numbered `BUG-*` record).
**Scope:** Independent of BUG-021 — different code paths, and the defective guards predate BUG-021 (they date to July 14/16). This entry deliberately does **not** fold in the separate operating-model / process-control finding; that remains conceptually separate.

### Operator-visible incident

On a fully-encumbered account (DEPLOYABLE **$0**, EVIDENCE = Sealed / SESSION = Closed), the Deployment / Write Desk surface showed **no** Cash-Secured Put or Buy-Write candidate rows — only "No actionable or edge put opportunities available across the evaluated universe." The board was empty when it should have shown candidates (annotated unaffordable).

### Root cause

Both Decision entry points began with `if (!snapshot || !snapshot.deployableCash) return;`. `snapshot.deployableCash` is `number | null`, where:

- `null` = **INDETERMINATE** regime (deployable cash genuinely unknown → must fail closed), and
- `0` = a **known** broker balance (a real, valid capital state).

The `!deployableCash` falsy test conflated known-`0` with unknown-`null`, so a known-$0 balance short-circuited **before the engine ran** — `recommendPuts` / `recommendBuyWrites` never executed, and in `handleNewEvidence` evidence ingestion was skipped as well. The Decision engine itself was always correct: it marks each candidate `affordable: false` rather than dropping unaffordable rows. The empty board therefore came **solely** from the premature entry-point early-return — not from any affordability filter and not from the session gate.

### Corrected invariant

- `deployableCash === 0` is a **known capital state** and must **not** suppress strategy evaluation. Explorer discovery ("what is possible?") must still run.
- `deployableCash === null` is **INDETERMINATE / unknown** and remains **fail-closed**.
- **Affordability is a candidate property, not a Deployment/Explorer evaluation gate.** A row that cannot currently be afforded is annotated `affordable: false`, never withheld.

### Repair

Both guards now gate on unknown cash only:

```
if (!snapshot || snapshot.deployableCash == null) return;   // was: !snapshot.deployableCash
```

`handleReRecommend` (~L258) and `handleNewEvidence` (~L417) in `options-prototype/src/components/WriteDesk.tsx`, each with an explanatory comment. `== null` is type-safe: it narrows `number | null` → `number` for the `recommendPuts(deployableCash: number, …)` calls. Known-$0 now proceeds; unknown-null still fails closed.

### Regression evidence

- New focused regression in `options-prototype/tests/write-desk/recommend.test.ts`: a known `deployableCash === 0` still returns the candidate, marked `affordable: false` (pinning that the engine never drops $0 rows — so emptiness could only have come from the entry-point guard).
- `tests/write-desk` suite **580/580** after the addition; `tsc --noEmit` clean.
- **Principal observed the operator-visible result: rows restored.**

### Independent diagnostic evidence (already established)

During diagnosis, an isolated replay of captured live evidence at **$0 / closed session** produced **50 actionable/edge CSP candidates plus 18 WAIT**. **Caveat:** the shared guard also blocked buy-write evaluation, so a buy-write count at $0 was **not** independently established — do **not** generalize the CSP count to buy-writes.

### Open, separate question (not a prerequisite for this fix)

Cash-balance **accuracy** is distinct from this outage: deriving $0 does not prove Fidelity reports $0, and portfolio − encumbrance does not establish tradable cash. Tracked separately if desired; it did not gate this repair.

### Commit

Repair: `5610f3ea5bafb20d1f323d0c19792344543b40f6` — `fix(write-desk): known $0 deployable cash no longer empties the board` (2 files: `WriteDesk.tsx` + the `recommend.test.ts` regression).
