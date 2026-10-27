# BUG-051 — Cash Deployment Liq sort ignores secondary sorts

- **Status:** Resolved — filed and resolved October 27, 2026 (Principal browser acceptance)
- **Severity:** Not established (Principal has not assigned one)
- **Area:** Write Desk (Deployment, v1) / Cash Deployment — Prod v0 table sorting
- **Provenance:** Principal report in the October 27, 2026 Kiro session, after acceptance of the Liquidity grade (`17b0e60b`)

## Principal statements (exact wording)

1. "multi-sort isn't working in the cash deployment table. re-open the session and investigate. ex: i tried to : 1) sort by LIQ 2) second sort by OI"
2. "I want this to work: sort by LIQ, second sort by OI, or more generally, sort by LIQ, second sort by any other column"

## Observed failure

With Liq as the primary sort, a Shift-click secondary sort (OI, or any other column) registers in the header (`2▼`) but never changes row order.

Executable specimen (derived; temporary render probe of `CrossEntryStrip` at `17b0e60b`, then deleted). Rows: AAA L1 4% / 1,200 OI; BBB L1 2% / 1,500; CCC L1 3% / 90,000; DDD L2 8% / 500.

| Action | Rows |
|---|---|
| Click Liq | BBB, CCC, AAA, DDD |
| Then Shift-click OI | BBB, CCC, AAA, DDD (unchanged) |
| Expected | CCC, BBB, AAA, DDD |
| Control: Posture, then Shift-click OI | CCC, BBB, AAA, DDD (generic multi-sort works) |

## Intended semantics violated

Table multi-sort convention (`use-multi-column-sort.ts`): ties on the primary column fall through to the secondary column. Under the Principal's specimen, Liq must group rows by grade so that any secondary column orders rows within each grade.

## Diagnosis / root cause

Established from source and specimen. `withLiquiditySortKeys` (`src/write-desk/liquidity-grade.ts`, `17b0e60b`) baked grade → spread → OI into one ordinal per row. Rows tied only when all three were identical, so the shared comparator almost never reached a secondary column. The defect was introduced by the accepted Liquidity-grade change itself; the shared sort hook was not at fault.

Secondary finding, same code: ungraded rows got an `undefined` key. The shared comparator's null-last rule is flipped by a descending sort, so ungraded rows would have sorted *first* under the default Liq order. That contradicts the "ungraded sort last" claim in the `17b0e60b` description and the October 27 journal entry. It is practically unreachable, because candidate spread % and OI are always populated.

## Scope / non-goals

- In scope: Liq-column sort semantics in the Cash Deployment table.
- Not in scope: the shared hook, other columns, and other tables.
- Not in scope: the pre-existing limitation that every Deployment table saves only the primary sort column across reloads.
- The grade itself (cutoffs, weakest-link rule, display) is unchanged.

## Acceptance criteria

1. Liq, then Shift-click OI, orders L1 rows by OI (descending), then L2, and so on (specimen: CCC, BBB, AAA, DDD).
2. Liq, then Shift-click any other column, orders rows within each grade by that column. Toggling the secondary direction reverses only the within-grade order.
3. Liq alone groups rows by grade (L1 first) and keeps the default Prod v0 order within a grade.
4. Ungraded rows stay at the illiquid end in both sort directions.
5. Posture, Prod v0, ranking and filters remain unaffected by the grade.
6. The Principal accepts the change in the browser.

## Remediation history

October 27, 2026 (uncommitted on `main`, base `17b0e60b`):
- The Liq sort value is now the grade only, via `liquiditySortValue`: L1 = 4, L2 = 3, L3 = 2, L4 = 1, ungraded = 0.
- `withLiquiditySortKeys` and `compareLiquidity` were removed.
- The header tooltip now explains Shift-click within-grade ordering.

Verification: new `tests/write-desk/cross-entry-liquidity-multisort.render.test.tsx` fails 4/4 at `17b0e60b` and passes 4/4 with the fix. The full frontend suite passes (2,221 tests) and the build passes.

## Verification

- **Principal acceptance (October 27, 2026):** "it's working now".
- **Operator evidence:** The Principal's export after the fix is `wheelwright-cross-entry-2026-10-27 (1).csv`, sorted Liq, then Shift-click OI. Rows are grouped L1 → L2 → L3 → L4, with OI descending within each grade:
  - L1: 53,489 → 1,004
  - L2: 30,229 → 259
  - L3: 336,716 → 50
  - L4: 178,724 → 1
- **Automated:** `tests/write-desk/cross-entry-liquidity-multisort.render.test.tsx` passes 4/4 and fails 4/4 at `17b0e60b`. The full frontend suite passes (2,221 tests).

## Related

- `17b0e60b` — accepted contract Liquidity grade, where this defect was introduced.
- `docs/journal/project-journal-5.md`, October 27, 2026 entry. Its "ungraded rows sort last" statement is corrected here; the journal itself is append-only.
