# BUG-032 — Human change-cell decoration includes padding and restores green terminal default

- **Status:** Resolved
- **Severity:** Not established
- **Area:** CLI / ww show human presentation
- **Provenance:** Principal manual acceptance at commit 4c2701ed9a03df579fec3928ef060bd37173b1ab; bounded remediation authorized October 5, 2026.

## Observed failure

The Principal reported non-change text appearing green in the complete human table at `4c2701ed9a03df579fec3928ef060bd37173b1ab`, and clarified that their default terminal foreground is green on black. Source inspection independently demonstrated change spans containing leading column padding.

## Intended semantics violated

Only semantic rendered reportedChange/reportedChangePercent values receive green/red sign coloring. Ordinary text, zero/missing, padding, separators, following cells and rows stay white. Color escapes must not contribute to visible width; explicit piped human mode keeps color while canonical machines never contain ANSI.

## Evidence

Principal-reported manual failure is distinct from independently observed source/test evidence. Before production edits, the amended regression suite produced 13 passes and 5 failures: compact clocks, semantic ANSI scopes/white baseline, and the separately requested description placement did not satisfy the corrected acceptance. After the bounded fix the query suite passed 18/18. The tests assert actual presentation and canonical values, not only absence of ANSI after stripping.

## Consequence

Human complete-table inspection fails accepted readability/color semantics. No evidence mutation or machine-value corruption is demonstrated. Severity is not established.

## Diagnosis / root cause

The table padded numeric cells before colorShowCell decorated the entire padded string. It restored SGR 39, which correctly ends explicit green/red but restores the user's green default; no explicit white baseline existed. There is no demonstrated whole-row green decoration or missing ANSI terminator. The combination violates value-only scope and fails the intended white ordinary text on this terminal. tt live already establishes white 37, scoped values and final reset 0 as the applicable repository convention.

## Scope / non-goals

Bounded display-only remediation explicitly authorized by the Principal. No acquisition, provider interpretation, temporal/session inference, public field additions, query redesign or backend/API change. The separate DESCRIPTION-after-SYMBOL direction is a governed presentation/order amendment, not a third bug.

## Acceptance criteria

Calculate widths from plain text, decorate only the semantic value, then attach plain padding. Initialize human output to white 37, restore white immediately after each signed change value and finish with reset 0. Keep NO_COLOR/TERM=dumb disabling all ANSI; machines bypass human decoration. Existing exact projection, filtering, stable ordering, magnitude ordering, limiting, partial results, strict validation, machine fidelity and terminal composition remain compatible.

## Remediation history

### Principal authorization and resolution — 2026-10-05

Principal authorized investigation, narrowly scoped remediation, canonical defect records, deterministic verification, commit and push. Calculate widths from plain text, decorate only the semantic value, then attach plain padding. Initialize human output to white 37, restore white immediately after each signed change value and finish with reset 0. Keep NO_COLOR/TERM=dumb disabling all ANSI; machines bypass human decoration. Product, Solution Design and manual are reconciled with the explicit manual correction. This record does not claim Principal rerun acceptance; the exact command remains in the acceptance evidence artifact.

## Verification

### Post-resolution validation — 2026-10-05

Final Node suite: 90/90; local deterministic fetch acceptance: 10/10. Registry/manual and syntax checks, existing detail OAS 25 specimens / 7 statuses and collection OAS 62 specimens, generated Roadmap freshness and diff checks pass. A held-only operational rerun returned 10 rows, 36 columns, compact clocks and 20 whitespace-free change spans; no market acquisition. Principal visual rerun remains outstanding.

Regression coverage in `scripts/ww-show-query.test.mjs` proves every timestamp field's compact all-fields cell, original timestamp strings in TSV/JSONL, unchanged date/missing/evidence, exact signed color spans, white padding/following cells/next rows on an inherited-green model, uncolored ordinary prices/non-change negatives, visible alignment, opt-outs, automatic machine redirection and explicit piped table. An actual PTY watch -c run verifies white headings, two scoped positive values restored to white, and subsequent red negative values. Existing query/integrity suites remain applicable; see the bounded acceptance artifact for final suite/check counts.


### Principal acceptance and closure — 2026-10-05

Following the corrected human table and ID-width continuation at runtime commit `1cd3444af40ad1ae1dafa2c9332ace30a0ba9f3d`, the Principal inspected the 10:51:17 PM screenshot and explicitly accepted the slice. This closes the prior outstanding manual visual rerun; status remains Resolved. The screenshot review showed compact clocks, DESCRIPTION after SYMBOL, shortened IDs, ordinary white text and change-only red/green under watch -c. Earlier verification/pending statements remain dated history, superseded by this explicit acceptance. End-of-session protocol and push are authorized; no unrelated defect or architecture work is authorized.

## Related

- [Current Product contract](../contracts/api-v2-subject-show-held-quote.md#14-question-driven-held-collection-inspection--october-5-2026)
- [Solution Design](../design/ww-show-held-quote-solution-design.md)
- [Acceptance evidence](../cli/ww-show-query-acceptance-2026-10-05.md)
