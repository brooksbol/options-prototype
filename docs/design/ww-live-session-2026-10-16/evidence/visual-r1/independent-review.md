# Independent visual-parity engineering review — R1

**ACCEPT for the bounded visual-parity increment.** No blocking defect was found. The delta restores shared TT column preferences, makes unavailable SPOT/QUOTE neutral, and removes the ordinary explanatory stderr footer without changing backend semantics or shared plotting. This is engineering acceptance of the frozen identity, not Principal visual/Product acceptance or operational authority.

## Identity and method

Packet `/tmp/ww-live-visual-r1/source`; manifest SHA256 `5cff48b256e06af0e305647a6782fc0a95cc851dbcd9b5e5eeff9782a3e1d9c9`; all 1,355 file hashes verified before and after review. Compared every file against independently accepted `/tmp/ww-live-integrated-r1/source`: exactly five files differ, matching the submitted scope. All 272 files comprising backend/Java tests/build, contracts and the two shared TT renderers are byte-identical to that predecessor.

The review follows the Principal-authorized bounded visual-parity task, final Product-plan supersession, accepted TT presentation precedent and existing P2 disposition. It carries forward the predecessor's API, authorization, retained-only purity, preview-isolation and compatibility review for unchanged source. Both P2 semantic findings remain deferred with their accepted containment requirements.

All execution used a new `review-run/source` copy. No frozen source, candidate worktree, operational configuration/database/provider, grant, service, commit or push was changed. Tests used disposable synthetic backend evidence. Source references below are relative to this packet's `source/`.

## Reviewed outcomes

- **Shared proportions and stable unknowns:** `scripts/ww-live.mjs:110–116` no longer overrides DTE/EXIT minimum widths. The unchanged shared renderer determines 31-cell shape, 18-cell DTE and 29-cell EXIT preferences (`scripts/tastytrade-live-render.mjs:146`, `:159–161`), with content growth and normal header centering. Tests verify that removing geometry and remaining DTE does not shrink or shift headers. Remaining DTE is displayed without inventing original duration, opening time or checkpoints.
- **Neutral evidence presentation:** `scripts/ww-live.mjs:103–105` explicitly uses SGR39 for unavailable SPOT/QUOTE and retains null spot, unavailable economics and neutral gross geometry. Categorical broker/account accents remain separate. The renderer's unchanged default-foreground mapping avoids a bright-white neutral foreground and never sets a background (`scripts/tastytrade-live-render.mjs:193–197`). Tests verify the actual graph-region SGR state, allowed color sequences and palette-independent output. No spot marker, P/L region, exit track or no-stop skull is inferred from unavailable evidence.
- **Geometry and glyph reuse:** Both shared TT renderers are unchanged. WW continues plotting backend coordinates through the accepted piecewise path, including modified shapes and explicit compression, without parsing legs or using a strategy template. Underlying price and financial conclusions remain backend-owned. The tests retain shape when units/membership are qualified and reject tempting uncontracted spot fields as a source of markers (`scripts/ww-live-visual.test.mjs:38–40`, `:62–64`).
- **Width and ASCII semantics:** The unchanged reduction order is TRADE SHAPE, RANGE, then SPOT, followed by an explicit count/JSONL fallback when rows cannot fit (`scripts/tastytrade-live-render.mjs:164–169`). Independent execution of the new visual tests covers every width20–250, full seven-row counts whenever a table fits, reserved final cell, ASCII, TERM=dumb, NO_COLOR and no-color. ASCII remains independent of color selection. No partial Position list is silently emitted.
- **Normal output and qualifications:** `scripts/wheelwright.mjs:767–778` emits the completed table or machine collection without the ordinary explanatory stderr footer. The executable test verifies empty stderr for ordinary `live --table`; the preview still emits its explicit SYNTHETIC label. Concrete missing-snapshot coverage remains in `scripts/ww-live.mjs:116`. Complete machine evidence and detailed help retain the gross-payoff basis and limitations; no new P/L claim was added.
- **Scope/API/compatibility:** Account discovery, authorized nickname resolution, one structural GET, complete JSONL, validation-before-output and all backend boundaries are unchanged. Existing TT and WW Position compatibility tests pass. The Fidelity test change selects by broker context rather than assuming opaque Account-ID sort order (`scripts/ww-live.test.mjs:52`); it does not weaken the coverage assertion or change runtime behavior.

## Independent verification

- **31 Java tests passed**, zero failures/errors/skips: actual integrated HTTP fixture, retained structural behavior, existing Position/historical Position and native acquisition tests.
- **288 Node tests passed**, zero failures/skips at test concurrency2: new visual tests, live integration, shared TT behavior, WW Positions and Account confidentiality.
- Actual generated structural and Account HTTP responses validate against unchanged authoritative OAS.
- The direct executable `./scripts/ww-live-preview.mjs --width 190 --no-color` succeeded from the review copy without operator target/port wiring. This shell's TERM=dumb produced the expected ASCII form. Separately inspected Unicode, neutral-color/palette, narrow and tiny captures generated by the visual tests. The preview's only stderr was the synthetic-evidence label.

Evidence is outside frozen source: `independent-java.log`, `independent-node.log`, `independent-oas.log`, `independent-terminal.txt`, `independent-terminal-stderr.txt`, and `independent-evidence/` with Java XML, actual API responses and visual captures. The reviewer did not independently rerun the complete 396-test Node suite or all190 v2 tests; those remain author verification evidence.

## Preserved verification limitation

The submitted complete Node run initially recorded 395 passes and one failure in the unchanged broken-pipe test, `scripts/wheelwright.test.mjs:183`/`:196`. I inspected the preserved logs: the same assertion failed in the untouched accepted integrated predecessor; it passed in the candidate's isolated rerun and the full concurrency2 rerun passed396. This supports treating it as a pre-existing intermittent verification limitation, not a regression introduced by the reviewed visual delta. Its root cause is not established or fixed by this review. No related assertion or runtime behavior was weakened. Evidence: `evidence/ww-live-visual-node.log`, `evidence/ww-live-visual-predecessor-wheelwright.log`, `evidence/ww-live-visual-wheelwright-rerun.log`, `evidence/ww-live-visual-node-bounded.log`.

## Acceptance boundary

The palette checks prove emitted SGR independence, not physical contrast on every terminal or Principal aesthetic acceptance. All examples remain synthetic. Qualified spot/current-location markers, economic colors, opening-duration/checkpoint timelines and EXIT progress remain unavailable because the accepted backend does not supply those facts. No new backend capability gap was created or resolved. The two P2 semantic findings remain deferred; complete Product/actual-Account readiness and operational actions retain their separate boundaries. No new comprehensive API design cycle is requested.

CURRENT STATE: Visual R1 independently ACCEPTED for the bounded engineering increment; Principal visual/Product acceptance remains outstanding.
DECISION REQUIRED: NO
NEXT AUTHORIZED ACTION: Engineering owner may reconcile this review and present the isolated specimen under the existing delegation; no commit, push or operational action is granted by this review.
