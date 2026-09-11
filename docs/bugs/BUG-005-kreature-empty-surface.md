# BUG-005 — Kreature nav advertises a route that renders an empty surface

- **Status:** Open
- **Severity:** S3
- **Area:** Application Shell / navigation
- **Provenance:** GitHub Issue #10 (https://github.com/brooksbol/options-prototype/issues/10) — historical, non-authoritative. Created 2026-09-04. Labels: `defect`, `S3`.

> The original record noted no dedicated `area:` label existed for Application Shell / navigation; the area was named in the Issue body per the Sep 4 defect convention rather than bulk-creating a label. Severity `S3` — moderate consequence: an advertised operator surface is unreachable; no data/accounting corruption. Severity is evidence of consequence only, not a remediation priority or sequencing signal.

## Observed failure

`AppShell` renders a **Kreature** nav button that navigates to `/app/kreature`. `router.ts` resolves that path to the route `kreature`. But `Root.tsx` has **no `route === "kreature"` render branch**: it handles `labs` and `sparkline-gallery` explicitly, then renders `<AppShell>` whose children match only `operator-console`, `write-desk`, and `production`.

Result: navigating to Kreature produces the shell chrome with an **empty body**. `KreaturePage.tsx` — which exists specifically to communicate an intentional "temporarily disabled during market hours" state — is never reached (it is imported by nothing in `Root.tsx`).

So this is not "Kreature is intentionally disabled" (that would be handled by rendering `KreaturePage`). It is a navigation/render-wiring gap: the nav advertises a surface that renders nothing.

## Intended semantics violated

An advertised navigation target must render its intended surface. The nav promises a Kreature surface; the router resolves it; but no render branch exists, so the operator reaches an empty body instead of the intentional `KreaturePage` state.

## Evidence (verified at SYNC `693445a`)

- `options-prototype/src/components/AppShell.tsx` (~lines 71–77) — Kreature nav button → `navigateTo("/app/kreature")`.
- `options-prototype/src/router.ts` (~lines 15, 23–27) — `AppRoute` includes `kreature`; `resolveRoute()` returns `kreature` for `/app/kreature`.
- `options-prototype/src/Root.tsx` — branches for `labs` and `sparkline-gallery`; `AppShell` children match only `operator-console` / `write-desk` / `production`. No `kreature` branch. `KreaturePage` not imported.
- `options-prototype/src/kreature/KreaturePage.tsx` — exists; renders an intentional "Temporarily disabled" message; currently unreachable.

## Consequence

An advertised operator surface is unreachable (empty body). No data or accounting corruption. Severity S3 (moderate).

## Diagnosis / root cause

Missing `route === "kreature"` render branch in `Root.tsx`; `KreaturePage` is imported by nothing.

## Scope / non-goals

Filing this defect does **not** authorize remediation. Candidate fixes (wire the missing branch to `KreaturePage`, or remove the nav button while the surface is disabled) are a separate Principal decision.

Kept **outside** the PL-CLEANUP re-baseline scope deliberately: independent evidence with independent authority. It should not distort cleanup scope.

## Acceptance criteria

Not separately enumerated in the historical record (candidate fixes noted under Scope, not authorized).

## Remediation history

None.

## Verification

None.

## Related

- `PL-SHELL` (Application Coherence / Shell) — context only; not double-booked as the same authoritative item.
