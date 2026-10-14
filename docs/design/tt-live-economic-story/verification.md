# Candidate verification — October 14, 2026

Status: engineering evidence only; Principal visual acceptance and independent review are pending. Base SHA: `bfe3073467c1d993ec283706d68e0427d78a6c06`. Candidate is uncommitted in `/Users/bollich/tt-live-economic-review`; installed `tt` still resolves to `/Users/bollich/kiro/options/scripts/tt`. Existing operational working-tree modifications were not changed. No commit SHA exists for the candidate.

- Final `node --test scripts/*.test.mjs docs/design/position-payoff-visual-contract/tests/*.test.mjs`: **346/346 passed**, zero skipped/cancelled/failed; includes233 TT tests and5 payoff visual-contract tests.
- Java fixture prerequisites: `./gradlew test --tests com.wheelwright.evidence.v2.PositionsTest --tests com.wheelwright.evidence.v2.HistoricalPositionsTest --tests com.wheelwright.evidence.v2.TastytradeAcquisitionTest`: **BUILD SUCCESSFUL,18 tests**. Synthetic in-process evidence only. The first broad Node run's three missing-build-fixture errors were resolved by running these existing generators; no production service/database changes or copies from operational build outputs.
- `npm run generate:roadmap-projection` then `npm run check:roadmap-projection`: **passed** after canonical parking-lot refinement. Projection generated in the isolated candidate only; the original dirty projection is untouched.
- `git diff --check`: **passed**.
- Unmodified base archive generated `scripts/fixtures/tt-live-economic-baseline.tsv` and `tt-live-economic-preserved.json`; tests verify byte-identical TSV and identical PAYOFF/SPAN from the same sanitized broker snapshot.
- Actual read-only acquisition succeeded, normal TT main/quote/session path exercised, account and IDs sanitized. Captured values at19:21:15.312Z are historical observations, not current live claims. Accepted XLF near-entry reference reused from the existing verified fixture.
- Real PTY emissions: observed A with P/L; observed B without P/L; Unicode ANSI hypothetical scenario grid. Persisted16 deterministic specimens additionally cover ASCII and monochrome for both layouts. No Product or screenshot acceptance inferred from PTY output.

Implementation files: `scripts/tastytrade-economic-story.mjs`, `scripts/tastytrade-live-domain.mjs`, `scripts/tastytrade-live-render.mjs`, `scripts/tastytrade.mjs`.

Verification/review files: `scripts/tastytrade-economic-story.test.mjs`, `scripts/tastytrade-economic-specimens.mjs`, changed exit-render/live-render/manual-exit/scan/tastytrade regression tests, three economic fixture files, this contract/verification and16 specimens.

Project-memory files: TT Live panel candidate amendment, parking-lot-10 existing CONV-UX refinement, project-journal-5 and generated Roadmap projection. No acceptance marker in earlier workstreams was changed.

Pending Principal decisions: A versus B; fixed co-cell track resolution; dotted sign-only unavailable halves; Regular dated prior-close comparison/deadband/retained r; handling the truthful but visually severe XLF endpoint under its $1 broker stop-trigger threshold. No extra adverse objective or reassuring scale is authorized or fabricated. Pending promotion must reconcile the unrelated in-flight renderer/docs changes in operational main before any accepted-main integration.

## Installed acceptance-path correction

The Principal rejected the first acceptance path after ordinary `tt live` showed the old implementation. A local reversible live-only adapter now connects that command to this candidate; all original source edits remain untouched. `tt live --no-color --width 166` ran successfully against current broker evidence and emitted the new three-landmark track for XLF/UNG/EWZ/XLE, without old progress percentages/default P/L. Candidate help and forwarding of `positions --help` to the original launcher were verified. Recovery target is retained in `~/.local/lib/tt-economic-review/recovery.json`. No application code changed during this correction, so the346 passing regression tests remain applicable. No Product acceptance is inferred.

## Independent-stop revision verification

Final revision: **349/349** Node/script/visual-contract tests passed, zero failed/skipped. Additional tests cover UNG's+$3 trigger against+$7 target, current below/above/coincident with S, S/diamond/arrow collisions at zero and endpoints, trigger versus differing execution-limit prices, absent trigger, and explicit positive-stop overflow. Existing width/ASCII/ANSI/monochrome and exact TSV/PAYOFF/SPAN preservation tests pass with the32-cell instrument. Roadmap regeneration/freshness and diff whitespace checks passed.

Current broad and complex broker evidence independently agreed on UNG Live Debit Stop Limit trigger0.06, limit0.06 and profit Limit0.02. Actual installed `tt live --no-color --width 166` succeeded and showed `LIMIT .............│────◆─S─────│` for UNG. Thus ordinary installed command exposes the revision; no uninstalled replay assumption. The dotted red side is unscaled, not a missing-stop claim. No execution/secured-gain inference, commit or visual acceptance is claimed.

## X / inline Pxx label revision verification

Final revision: **352/352** script/visual-contract tests passed, zero failed/skipped. Coverage adds rounded inline captures versus unchanged exact fractions, absence of standalone LIMIT/Pxx prefixes, red X/green stop-and-target capture colors, identical/overflow coincident annotations and shared label-slot alignment. Existing TSV/PAYOFF/SPAN preservation, quantity/source/session evidence, A/B, ASCII/ANSI/monochrome,157/189 widths and narrow fallbacks remain passing. Roadmap freshness and whitespace checks passed.

Actual installed `tt live --no-color --width 166` succeeded and showed XLF's inline red-X/target P56~, UNG's gain-side P33~ and target P78~, and EWZ/XLE targets P50. Current observed diamond movement was allowed to differ from the retained specimen; no historical current P/L was substituted. No standalone LIMIT/P50 prefix remains. No commit or Principal visual acceptance is claimed.

No-tilde amendment:352/352 tests passed, Roadmap freshness/whitespace checks passed, and actual installed `tt live --no-color --width 166` verified P56/P33/P78 with no rounding suffixes. Exact financial/TSV preservation tests remain passing. No commit or final visual acceptance inferred.

## Dollar exit/maximum landmark revision

Final355/355 script/visual-contract tests passed, zero failed/skipped. Tests verify interior XLF X$5 versus maximum $9, UNG S$3/X$7/$9 roles, exact-value ordering within quantized slots, nearest-dollar rounding without financial mutation, quantity scaling, coincident roles, missing maximum, and existing source/session/ASCII/ANSI/alignment/TSV/PAYOFF/SPAN preservation. Roadmap freshness and whitespace checks passed.

Actual installed `tt live --no-color --width 166` verified XLF `│◆─X─────────│────────X$5────────$9` and UNG `..........◆..│───S$3────────X$7──$9` against current read-only evidence. The ordinary command uses the revision; captured current economic states can differ from stored specimens. Dollar endpoint replaces the green bar; no Pxx or tilde remains. No commit, independent review or Principal visual acceptance is claimed.

Stop-octagon amendment:242/242 scoped TT tests passed, including red ⯄ color, Unicode/ASCII/no-color widths and collision/financial-preservation coverage. Glyph is U+2BC4 BLACK OCTAGON (one cell), not the two-cell emoji; ASCII retains X. Canonical journal is not a Roadmap generator input; this amendment changes no Roadmap inputs, so regeneration is not required.

Gain-stop prefix/color amendment:242/242 TT tests passed. Actual installed ordinary CLI output was captured with ANSI enabled and asserted to contain red $3 (`91`), green X$7 (`92`), and no S$/Pxx on UNG. Shared width/collision and exact TSV/PAYOFF/SPAN preservation tests remain passing; whitespace check passed. No Roadmap inputs changed in this amendment. Visual acceptance and commit remain pending.

Font-compatibility correction:242/242 TT tests passed with the standard two-cell 🛑 stop sign and ASCII X fallback; whitespace check passed and specimens regenerated. PTY emission verified, but native Terminal font appearance was not inspected: Computer Use denied Terminal access. Principal screenshot establishes U+2BC4 failure; new glyph appearance remains pending actual Terminal review.

Prefix-free profit-dollar amendment:242/242 scoped TT tests passed and whitespace check passed. Regenerated specimens assert no X$/S$/Pxx prefixes in the economic scan, while exact financial/TSV/PAYOFF/SPAN preservation and shared width/collision tests remain passing. No Roadmap inputs changed. Ordinary installed `tt live` uses the revised renderer; font appearance and final visual acceptance remain Principal review concerns.

Compact-summary/hook revision:354/354 script/visual-contract tests passed, zero failed/skipped. Tests verify green target/positive stop, red negative stop with explicit minus, white zero, missing target/stop, target-relative endpoint clamp, fixed reference positions, adjacent movement/retained r, VS15 one-cell hook, ASCII signed fallback, quantity/rounding and exact TSV/PAYOFF/SPAN preservation. Roadmap regeneration/freshness and whitespace checks passed.

Ordinary installed `tt live --no-color --width 166` succeeded with XLF $5(↩︎−$1), UNG $7(↩︎$3), EWZ $21(↩︎−$11), XLE $9(↩︎−$6) outside uninterrupted tracks. ANSI colors are asserted in deterministic regression tests. Native font appearance remains Principal review; no independent review, commit or final visual acceptance is claimed.


## Shape/header/spacing/color refinement verification

Final full script/visual-contract rerun:357/357 passed, zero failed/skipped. The immediately preceding full run had one unrelated wheelwright broken-pipe test fail (356/357); its standalone5/5 rerun and subsequent full357/357 rerun passed without code changes. Coverage now sweeps every plotted cell for iron condors and both vertical orientations, verifying ▲/▼/◆ and ^/v/*, original region colors, unchanged coordinates/geometry, cyan ANSI markers and cell widths. SPOT tests verify plateau/transition/tail colors independent of preserved prior-close evidence, neutral unavailable shapes and unchanged RANGE. DTE/EXIT PROGRESS centering is asserted in Unicode/ASCII, ANSI/plain and optional P/L views. Exact TSV and SPAN preservation remain passing.

Regenerated actual renderer specimens; installed read-only `tt live` confirms TRADE SHAPE/DTE/EXIT PROGRESS, centered headers and gap-free `│$5(↩︎−$1)` summaries. ANSI execution verified corresponding green/yellow/red SPOT codes. Native Terminal font appearance remains subject to Principal review. Whitespace and Roadmap freshness checks passed. No brokerage mutation, commit or Principal visual acceptance inferred.


Compact DTE refinement:358/358 script/visual-contract tests passed, zero failed/skipped. Coverage includes remaining/original days across opening/midlife/expiry, same-day0/0, missing/invalid denominator, ASCII/ANSI, long durations, embedded M/co-cell behavior with no trailing MxDTE, width/alignment and unchanged exact TSV. Original baseline time-track geometry remains matched after intentionally normalizing the changed labels. Regenerated specimens and actual installed read-only166-column run confirm XLF44/44d, UNG44/45d, EWZ37/51d and XLE2/16d without trailing M21. Whitespace/Roadmap freshness checks pass. Principal visual acceptance remains pending; no commit or brokerage changes.


Adverse-boundary overflow correction:359/359 full script/visual-contract tests passed, zero failed/skipped. Tests distinguish exactly at versus beyond verified stop, align fixed center/endpoints across both, preserve cyan diamond and independently green/red movement arrows including retained suffix, and withhold overflow for missing/invalid denominators. ASCII/plain/ANSI and exact financial/TSV preservation pass. Specimens regenerated. Actual installed read-only166-column output shows XLE's cyan diamond left of the adverse bar (also XLF when its observed P/L exceeds its own threshold), while nonbreached rows keep aligned references. Whitespace/Roadmap freshness checks pass. This is threshold economics, not evidence of broker activation/fill. No commit or Principal visual acceptance claimed.


Left-boundary dollar labels:360/360 full script/visual-contract tests passed, zero failed/skipped. Deterministic checks verify red negative stop dollars left of the boundary, cyan breached diamond between amount/bar, portfolio-wide reference alignment, green UNG positive-stop parenthetical, missing values, rounding, Unicode/ASCII, ANSI/plain and bounded widths. Exact TSV/financial evidence and unaffected tracks remain passing. Regenerated specimens and actual installed read-only166-column run confirm XLE `−$6 ◆ │…│$9`, XLF `−$1 ◆ │…│$5` and EWZ `−$11   │…│$21`; no red right-side stop parentheticals. Whitespace and Roadmap freshness pass. Principal accepted the preceding overflow visualization; newest dollar-label placement remains reviewable/uncommitted.


Inline positive-stop hook:361/361 full script/visual-contract tests passed, zero failed/skipped. New deterministic checks verify proportional1/7,3/7,5/7 and endpoint hook placement, current/stop ordering around shared cells, cyan diamond and independent movement preservation, fixed reference/width/ANSI semantics, ASCII r, and no invented placement for invalid target denominators. Existing negative-stop/overflow, exact TSV, DTE and shape preservation checks remain passing. Regenerated specimens and actual installed read-only166-column run show UNG `│─────↩︎───────│$7` without parenthetical/dollar stop label; loss-side amount/diamond/bar arrangement remains intact. Whitespace and Roadmap freshness pass. Candidate awaits Principal review; no commit or brokerage mutation.


## Qualified Principal acceptance and session closeout — October 14, 2026

The Principal accepted the current economic-state grammar as the prototype baseline and invoked end-of-session protocol. Accepted: center scale, cyan observation, red/green regions, adverse overflow, target annotation and removal of default P/L. Entire EXIT PROGRESS completion, recent-movement usefulness/deadband and tastytrade stop-order/↩︎ operational semantics are explicitly excluded. They remain experimental/provisional under existing CONV-UX, with no arbitrary tuning or new scope authorized.

Current contract/panel/help and specimen headings reconciled; chronological versions archived as historical. Final closeout Node suite:361/361 passed, zero failed/skipped. Sanitized fixtures, exact baseline TSV, preserved viewport and DTE track geometry, and current presentation boundaries remain covered. Roadmap regenerated from canonical CONV-UX and passes freshness; whitespace check passes. Test execution is implementer verification, not independent review. Principal screenshots supply actual Terminal appearance evidence. No new broker calls are needed to repeat deterministic verification; no brokerage writes, service/database changes or production WW implementation.

Durable persistence follows the explicit Principal closeout authorization. Original-main unrelated tracked/untracked work is snapshotted and preserved; only this isolated workstream is committed. Accepted main SYNC and operational checkout restoration are verified/reported at the end of the protocol. Local review adapter is reversible; the accepted source is ordinary main. No stale current-market claim is created from historical fixtures.


Post-acceptance skull refinement candidate:364/364 full script/visual-contract tests passed, zero failed/skipped. Added cancellation/profit-only absence, gain-side stop presence, Cancel Requested presence, ambiguous/missing evidence suppression, one-cell VS15 skull/ASCII !, red ANSI, fixed center/current position/width and unchanged canonical TSV checks. Regenerated historical/synthetic specimens including no-exits A/B variants. Actual read-only installed166-column live candidate shows XLE `☠︎.........◆.│..............—` after Principal cancellation, while UNG remains without skull. No invented profit/loss scale, no broker writes, no commit or new visual acceptance claimed. Whitespace and regenerated Roadmap freshness pass. Reversible live-only adapter reactivated against accepted base94e08ad to protect unrelated operational-main work; other tt commands retain main. Font appearance remains Principal review.


Skull refinement Principal disposition: visually accepted on October14 (“looks good”), with explicit push authorization. The glyph's evidence-based absence semantics join the qualified economic-state baseline; broker stop effectiveness/trigger interpretation and movement remain excluded. Current verification, canonical Roadmap regeneration/freshness and clean diff checks precede persistence. Existing unrelated original-main work stays uncommitted and preserved; only this bounded refinement is committed.


Orphaned-session cleanup verification: the inactive gzip recovery patch reconstructs all five original WW code/test files byte-for-byte at its manifest base. The two original proposal documents and all journal/intake additions are retained as review-pending evidence; no runtime WW draft is accepted. TT targeted suite251/251 and standalone existing wheelwright suite5/5 pass. Full-suite execution had previously passed364/364 for the skull candidate; final cleanup runs were363/364 due the existing intermittent wheelwright broken-pipe exit check (also seen in prior baseline closeout), which passed standalone without source changes. No failed check is represented as a green full run. Archive/docs do not enter runtime test discovery. Roadmap regenerated/freshness and staged whitespace checks pass. Principal authorized both skull push and no-stash dirty-tree cleanup; no pending acceptance is inferred for the WW proposal.
