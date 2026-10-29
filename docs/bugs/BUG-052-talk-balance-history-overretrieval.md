# BUG-052 — Talk balance answer retrieves and displays retained history

- **Status:** Open
- **Severity:** Not established
- **Area:** API v2 balance evidence / MCP / SDK Talk
- **Provenance:** Principal report, October 27, 2026; real retained-read preview at 46835d68

## Observed failure
Principal reported nearly 2,000 lines of historical records/raw JSON preceding a short PTS margin answer. The persisted real SDK probe independently records 82 returned balance observations and 34,260 input tokens for the original question. The line count is operator-reported, not independently measured.

## Intended semantics violated
ADR-024 leaves authoritative evidence selection in the backend and conversation in SDK Talk. Evidence must support a qualified operator answer without indiscriminate disclosure or source records dominating the answer. Latest retained evidence does not establish current buying power.

## Evidence
[Original real probe](../reviews/sdk-talk-real-read-profile-2026-10-27-probe.json), [bounded retest](../reviews/sdk-talk-bounded-balances-2026-10-27.json), and [implementation receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md). No protected financial amounts are included in this record.

## Consequence
Unnecessary private history crosses the model boundary, increases context consumption, and obscures the useful historical facts. Principal requested high-priority correction; that sequencing is distinct from severity, which has not been ratified.

## Diagnosis / root cause
The balance API's collection read was reused without a source-time selector. MCP forwarded all observations; Talk rendered all fields plus raw JSON. Collapsing the old JSON alone would not address model disclosure.

## Scope / non-goals
Authorized bounded candidate engineering under PL-MCP-01. No new Account grants, acquisition, trades, production installation, v1 changes, financial engine in MCP/Talk, or new Product capital-allocation policy.

## Acceptance criteria
- Backend selection returns at most one qualified source-time observation; receipt order never establishes source order or currentness. Ties and unorderable clocks are explicit.
- MCP defaults to that selection and preserves source facts, missingness, authorization and chronology qualifications.
- Original question reaches the model with no historical collection; demonstrate bounded bytes and observation count.
- Compact card emphasizes relevant reported facts and historical date. Provenance requires deliberate interaction; balance raw JSON is not rendered.
- A request for a missing later session returns no selected amount and explains known source coverage.
- Principal can inspect the preview; author verification must not be labeled independent approval or Product acceptance.

## Remediation history
October 27 candidate adds API v2 `selection=latest-source`, optional `sourceAtOrAfter`, selection metadata and source display lexemes. MCP defaults to the bounded read. Talk renders a compact typed card and lazy provenance details. Existing API collection behavior remains compatible for explicit callers.

## Verification
Author evidence: 11 Java balance tests; 8 MCP tests; 8 OAS contract groups (38 operations); 19 Talk tests including actual Java HTTP/MCP and lazy provenance DOM assertions. Real authorized SDK question selects one October 19 source, 2,882 bytes, 6,634 input tokens. Follow-up naturally selects the source-time bound and returns zero observations for October 26. Browser visual verification is unavailable because this session has no browser provider. Record remains Open pending that final presentation check; no Principal acceptance claimed.

## Related
ADR-024; PL-MCP-01; October 26 real-world case study; BUG-022 governs a separate Regime/capital issue. BUG-051 belongs to concurrent v1 work and is untouched.

### Principal rendering rejection — October 27, 12:39 screenshot

Principal: “there's a rendering failure. I still see a large green box of noise and i see raw, unrendered md in the answer”. Inspection of the requested latest Desktop screenshot confirms that the remaining expanded card is the **holdings** result, not the bounded balance card. The answer contains literal heading/table/list markup. Protected screenshot pixels and holdings are not copied into repository evidence.

The prior candidate's presentation correction was incomplete: only balances received a compact view; all other tools still eagerly displayed every typed source row and qualification. The conversation renderer recognized bold text alone. Passing balance tests did not establish general conversational rendering coverage.

Bounded successor correction: non-balance sources become neutral, closed, lazily populated disclosures **after** the answer. Account access denials remain visible outside the disclosure. Additional qualifications and typed facts are available on expansion; raw JSON requires a second deliberate disclosure. Balance summary behavior is preserved. A pinned local markdown-it browser bundle renders answer headings, tables, lists, code and emphasis; HTML, images and active links are disabled. No prompt suppression, question routing, backend semantics or retrieval change is used for this presentation correction.

Additional acceptance specimens: headings/tables/lists render semantically; a 60-row invented holdings source produces zero source-row DOM nodes before expansion; denials remain visible; expansion preserves all rows and qualifications; raw response remains deferred. Injection text must not introduce active HTML, scripts, images or links.

Author verification: 22 Talk tests pass, including Java/MCP integration and the new renderer/security/lazy-DOM specimens. npm production audit reports zero known vulnerabilities for the pinned dependency set at verification time. Native Chrome was available despite no browser connector being registered: the synthetic specimen's accessibility tree confirms heading/table/list elements and a closed Holdings sources disclosure; expanding exposes FIXTURE59 and Raw source response, collapsing removes them from the accessible view. The native screenshot API returned stale welcome pixels, so this is verified browser interaction/accessibility evidence, not a claimed pixel-perfect screenshot review. No new model requests, protected-data disclosure or grants were required. Open pending Principal observation of the updated preview; no independent review or Principal acceptance claimed.

## Subsequent portfolio presentation / retrieval specimen — October 27

Principal's installed replay shows expanded Position graphs still repeating unavailable metrics and a model-generated inventory table omitting a source row. The [existing production replay receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#production-portfolio-replay-correction--october-27-after-installed-conversation) adds a reusable backend-filtered option query with exact backend counts, direct typed-table presentation of every selected row, explicit scope/unknown CSP status and lazy provenance. Repeated unavailable metrics are grouped in deliberate graph details; raw responses remain nested and lazy. Transaction selection is independently bounded before crossing the model boundary. Native available-to-trade cash labels are rendered without inventing AWMI or governed deployable-capital semantics. This is an extension of the existing specimen, not a new presentation registry. Remains Open pending independent review and Principal observation.

Final installed verification: the linked production replay receipt records39 passing JavaScript tests, bounded backend source reads, exact typed option rows and targeted financial-authority replays. This supersedes preview-only delivery standing; independent review and Principal observation remain pending.

## October29 outcome-first report direction

Principal: **“no disclaimer noise. hide any of that under accordion links”**, following the closed-trades report requirement **“with totals.”** The report renders backend trade outcomes, net total and winners/losers first. Matching, estimated-fee details, source identifiers, coverage and Talk analysis use closed accordions. The exact metric label retains `Estimated net P/L` when source fee finality is not established. Workspace access/privacy text and balance/inventory qualifications are also deliberate disclosures. Unknown values remain dashes; presentation never manufactures a result. UI regression tests verify closed-by-default disclosures and lazy source creation. See the October29 receipt linked from BUG-053.

## October29 acceptance follow-up — empty analysis and currency precision

Principal reports three passes and one failed XLF drill-down among four exercised tests, plus a five-row empty analysis table and three-decimal USD values. This is narrower UX/functional acceptance, not financial Product acceptance. A controlled placeholder-only Markdown table reproduces the rendering defect; the original incident Markdown was not recovered. Empty tables are removed before rendering, empty analysis has no accordion, and an empty period report creates no empty typed table. Meaningful unavailable rows and actual zero values remain visible.

Closed-report USD display rounds exact decimal strings to two places; source accounting/total values remain unchanged and are available in the evidence accordion. The backend total is not recomputed from rounded rows; display-rounding differences are explained only in details. Estimated status remains in the primary metric label. Source-original reconciliation and the updated installed replay are in the existing October29 receipt. This does not retroactively turn the earlier author rendering checks into coverage of this operator failure.

## October29 tactical presentation independent falsification

Independent review rejected frozen tactical candidate e163a9cc: inverse-condor profitable tails could get a loss-region color, and null legacy exposure failed the compact schema. The [integration receipt](../reviews/sdk-talk-tactical-integration-2026-10-29.md#independent-implementation-falsification-and-bounded-correction) preserves failure/review and new bounded corrections. A maximum-plateau geometry qualification and ADVERSE_TAIL avoid claiming actual losses; unsupported color interpretation remains unavailable while geometry survives. Source/presentation acceptance remains separate. No installed fix or Principal acceptance is claimed.

## October29 installed Position over-retrieval

Installed real SDK replay at74493 selected expanded inactive Account history for an ordinary all-positions request:486,497 response bytes,499,374 input tokens in that turn. This extends the existing minimum-necessary retrieval defect beyond balances. Candidate strict monitoring schema and compact backend DTO address the actual layer; one-Position evidence-on-demand stays available. See the workspace-interactions receipt for scope, tests and pending review. Remains Open; no synthetic success substitutes for installed verification.

## October29 installed bounded correction verified

Independently accepted bounded monitoring is now installed atbf6fecea. Actual real SDK reads all selected pages without expanded history; natural selected-row detail succeeds. Monitoring turn input usage499,374→36,710; same-membership backend tactical bytes63,179→44,459. Existing broader defect remains Open pending Principal acceptance; see final workspace receipt.


October29 shared-result candidate: exact Position tactical projection and selected MCP view avoid expanded Position/Construction unless evidence requested. Same private cut6705byte DTO versus72225byte expanded pair; actual compact SDK wrapper8086bytes. This is selected Position overretrieval evidence, not a new balance fix or installed acceptance. [Receipt](../reviews/sdk-talk-shared-tactical-result-2026-10-29.md).


Principal reports another empty six-column analysis table in shared-result Test2. Original Markdown unavailable; decoded whitespace-entity/format-only tables independently reproduce the raw-content filtering gap. Candidate token-tree suppression and empty rendered-analysis handling preserve meaningful text/zero/unavailable/code. Browser actual-result replay with controlled empty table passes. Same receipt links scope, source retention and review boundaries; no blanket claim every unknown Markdown format is fixed.

Selection token correctionb21404f1 independently ACCEPTed after preserving rejected379 and nonempty-code falsifier. Decoded entity/format-empty tables suppress while quoted code/zeros/nonempty content survive. Temporary8816 updated; production unchanged; Principal empty-analysis retest pending.


## Residual after bounded scope acceptance — October29

Principal accepts4→1→4 scope behavior but still reports empty analysis tables/headings/bullets. Controlled current-source whitespace-entity-only list plus Analysis heading reproduces surviving empty block structures. Original session Markdown unavailable; exact table recurrence cause not established. Previous table/token fixes were incomplete, not full presentation acceptance. Remains Open; next cleanup should prune structurally empty block trees while preserving meaningful values/code/errors, rather than another question/format-specific patch. Scope acceptance is recorded separately in the selection receipt.
