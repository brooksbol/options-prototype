# BUG-053 — Talk operational Account evidence is disconnected from imports and read grants

- **Status:** Open
- **Severity:** Not established
- **Area:** SDK Talk / operational v2 Account evidence / Fidelity admission
- **Provenance:** Principal real-data trials and October27 production instruction

## Observed failure
Talk reported old Sawdust custody despite newer Downloads exports. PTS/tt1 holdings and tt1 balances were denied because corresponding backend read grants were absent. After authorized holdings access, a successful inventory tool result still failed conversational narration.

## Intended semantics violated
The real-data Product must use legitimate backend read permissions and qualified source observations. A current operator question must not silently use a disconnected October19 store when newer supplied evidence can be admitted through an existing backend path.

## Evidence
[Existing runtime receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md), [Downloads comparison](../reviews/sdk-talk-download-import-coverage-2026-10-27.json), [Sawdust original reconciliation](../reviews/sdk-talk-sawdust-import-reconciliation-2026-10-27.json), [CSV submissions](../reviews/sdk-talk-fidelity-csv-reconciliation-2026-10-27.json), [actual SDK read with narration failure](../reviews/sdk-talk-authorized-inventory-retest-2026-10-27.json). Private originals and grants are not copied here.

## Consequence
Incomplete/outdated operator answers despite available recent files; denials and model output failures can be mistaken for absent brokerage evidence. Severity is not ratified.

## Diagnosis / root cause
The preview used a separate retained store and private portfolio copy; no update flow connected new downloads. Existing CLI discovery was not invoked. Combined Accounts_History envelopes lacked row-attributed Activity admission. Distinct per-Account grants were absent. A700-token SDK output cap truncated a full inventory answer after successful reads.

## Scope / non-goals
Principal authorized the specified read grants, supplied-file/catch-up imports and production installation. Reuse existing backend financial meaning, original retention, explicit Account boundaries and SDK/MCP architecture. No trades, foreign Account grants, inferred ownership, universal financial semantics or automatic background Downloads ingestion policy.

## Acceptance criteria
- PTS/tt1 holdings and tt1 balance reads enforce approved live grants without other permission changes.
- Current supplied Sawdust security quantities/sides match backend output and retain source dates/unknowns.
- All eligible discovered Fidelity files are accounted for; unsupported/foreign scope remains explicit.
- Combined histories admit only bound Account rows, preserve originals, deny insufficiently authorized original reads and avoid new row-equivalence identities merely from envelope Account columns.
- SDK finishes the operator question with bounded adequate output capacity and truthful qualifications.
- Main source and installed runtime use operational evidence directly; v1 remains intact; no acceptance/reviewer approval invented.

## Remediation history
Ordinary corrections and operational data/grant changes authorized October27. Production delivery in progress; final revision/verification is recorded in the existing runtime receipt.

## Verification
Installed production import/grant/source reconciliation and actual SDK read verification pass; the later portfolio falsification and corrections are preserved below and in the linked runtime receipt. Final option/transaction HTTP schemas, all three Account reads, native cash-field projection and targeted SDK financial-authority specimens are author-verified. Independent review and Principal observation remain pending; record remains Open.

## Related
PL-MCP-01; ADR-024; BUG-052 covers source/Markdown presentation separately.

## Subsequent production falsification — October 27

The Principal's installed conversation finds a second gap after transport/import correction: successful holdings retrieval still omitted BIZD and inherited tt1 scope, native Fidelity `Available to trade`/`Cash and credits` labels were dropped, and absent optional quote measurements were mistaken for absent quote facts. Premium refusal based on custody alone overlooked an existing retained transaction path. This does not retroactively validate earlier completeness claims.

The [existing receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#production-portfolio-replay-correction--october-27-after-installed-conversation) records bounded backend option inventories/exact counts, native cash-label projection, bounded retained-only transaction selection/MCP, authoritative quote recovery and typed UI rows. Per-Account denial remains explicit; no grant changes. Cash-secured construction identity, current-held opening-cohort attribution and universal liquidity ranking remain unestablished. Verification receipts in that section distinguish controlled fixtures from installed real reads. Remains Open pending independent review and Principal observation; source correction is not acceptance.

## Subsequent production falsification — October 29

Principal reported transaction coverage stopping October15 despite later broker executions. The prior MCP adapter forced `mode=retained`, preventing the existing authorized backend read-through from being used. Existing retained last-success check was October19; last transaction date October15 was not a verified coverage endpoint. An authorized existing backend refresh acquired32 source records through October29 and recovered all four independently reported execution specimens. No new brokerage client, grants, background polling or email ingestion was needed.

The [October29 receipt](../reviews/sdk-talk-temporal-executions-remediation-2026-10-29.md) records bounded policy-mode transaction reads, execution-time/native-Order grouping, source coverage qualifications and the explicitly requested closed-round-trip net-P/L report. This corrects the earlier retained-only scope; it does not retroactively validate the October27 completeness claims. BUG-054 owns relative-date grounding. Generic monthly Account performance and tax-lot accounting remain separate unresolved capabilities, not bugs inferred from this new report request.

## October29 acceptance follow-up — exact report evidence drill-down

Actual installed SDK reproduction requested `view=closed-trades` with `symbol=XLF`. The shared tool schema admitted the combination, while the adapter rejected it before a backend request and returned a generic failure. This was not a403, missing source record or pagination failure in the reproduced case. The existing Account transaction item API already supported exact source IDs; MCP had not exposed it.

A bounded exact-ID MCP detail read now composes that existing item API, preserves Account/transaction identity and enforces shared time/response limits. Invalid period-symbol combinations return actionable guidance; no symbol-specific router or second financial engine is added. Actual installed SDK follow-up retrieves four XLF source records. Test5 additionally establishes Fidelity closed-report503 capability gaps rather than authorization denials; Test6 has no September closing result and no verified lower coverage bound, so it cannot establish a zero P/L. See the existing October29 receipt for precise statuses and source-original reconciliation. Remains Open pending separate review and acceptance.

## October29 independent financial/tactical integration follow-up

Independent source-original review qualifies the three TT1 closed round trips and independently accepts the quantity-scale comparison correction at `77810b0b`; it does not certify complete monthly performance. Candidate tactical integration recovers the existing Java recognition/economic pipeline behind a compact Position representation. Installed Orders/Account-market grants and read-through remain disabled; zero retained Order resources explain why source-backed multi-leg monitoring cannot yet reach tt-live parity. No broad grant or automatic acquisition is inferred. See the [new scoped receipt](../reviews/sdk-talk-tactical-integration-2026-10-29.md) and [single maintained two-axis matrix](../implementation/pl-mcp-01-capability-presentation-matrix.md). This remains Open; candidate tests are not installed/Principal acceptance.

A controlled controller falsifier after independent review additionally reproduced stale reference-selection IDs across Order-driven singleton-to-package admission. Candidate now reselects bounded current membership before market/reference enrichment. This preserves source association rather than manufacturing package economics; see the same integration receipt. Installed policies remain disabled, so this is not retroactively asserted as the earlier production root cause.

## October29 installed refresh adapter falsification

The real backend accepted and retained the explicitly requested holdings acquisition, while MCP rejected its opaque snapshot identity under an invented UUID constraint. Candidate now follows the existing string/null contract and fixtures use the actual snapshot prefix shape. No permission broadening or blind retry; the backend observation was inspected first. See the workspace-interactions receipt. Independent review and corrected installed replay remain pending.

## October29 installed bounded correction verified

Independently accepted opaque snapshot/cursor corrections installed atbf6fecea. Real SDK refresh returns ACCEPTED, natural exact Position detail succeeds, and all3authorized Accounts are included in inventory. No grant expansion. Full Order/market tactical parity and qualified opening associations remain blocked; broader defect stays Open pending acceptance.

## Principal-approved tt1 acquisition: real remaining semantic gap

Approved tt1 Order/Account-market plus global market scope and300/30request-triggered policies are active. Ordinary installed SDK requests retain real sources with no explicit Refresh tool; current4packages reconcile. Same-originals real-source replay of actual tt-live domain/v2 agrees SPY/QQQ/UNG membership, spot/source clock and remaining DTE. V2 still lacks an established held-opening occurrence; its full-short-put aggregate cash coverage propagates CONFLICT to payoff/range/progress/checkpoints even with qualified standard option terms and quotes. This is now a demonstrated backend association/dependency gap, not missing provider integration or denied permissions. Transportcold-read5second failure corrected in separately independently accepted shared40second budget. Broader defect remains Open; no fabricated CSP/margin/origin semantics or financial parity acceptance. See activation receipt/machine evidence in existing workspace-interactions review.


## Installed field dependencies and native bracket correction

Runtimeb008cbe1 (reviewed6f5ed308) fixes blanket cash-coverage suppression while retaining actual constituent/allocation guards. Native OTOCO/OCO links survive normalized evidence and are accessible through exact Order MCP reads. Independent first candidate rejection and corrected acceptance remain immutable. Installed real SDK and all4same-originals structures verify terminal geometry/spot/clocks/DTE; native client renders4SVGs without empty progress gauges. Current-origin/entry economics remain unavailable because historical linkage does not establish held lifecycle continuity. Broader defect stays Open; no Principal acceptance or full parity claimed. Large deliberate detail/context retrieval is measured, not declared solved. See [financial dependency receipt](../reviews/sdk-talk-financial-dependencies-2026-10-29.md#installed-successor-verification--october29). Grants, policies, credentials and v1 unchanged.


## Principal named-scope acceptance falsifier — October29

Shared-result Test1 operator-positive and Test3 QQQ evidence passed; Test2 compact QQQ request returned all4. Original tool trace unavailable, so exact failed invocation/root cause is not fabricated. Candidate adds existing Position underlying selector/MCP scope checks and current-turn trusted-result supersession; real retained SDK4→1→4 and cold QQQ selection pass. No financial-domain redesign or current-origin claim. [Scoped receipt](../reviews/sdk-talk-selection-2026-10-29.md). Independent review/Principal reacceptance pending; broader BUG053 remains Open.

Named-scope sourceb21404f1 independently ACCEPTed; only temporary8816 updated. Actual SDK4/1/4 and cold backend-underlying query pass with native single graphic. This is candidate scope correction, not Principal reacceptance or full origin/economic parity. Existing broader defect stays Open.


Principal now accepts bounded shared-result/scope experiment atb21404f1 (4→QQQonly→4). Broad defect remains Open for full opening/economic parity. Separate freshness inquiry establishes CURRENT≤12h even during Open; RETAINED_SESSION is a later completed-session extension. This explains39–40minute CURRENT labels as implementation behavior, not proof of live prices or separately ratified active-market policy. No freshness policy change or production deployment follows this acceptance. See selection receipt final acceptance/integration section.

Principal A promoted accepted scope correction to production8787 atreleaseeb4f15cd/reviewedb214. Installed actualSDK4→QQQonly1→4 and cold named query pass; v1/grants/policies preserved. This resolves delivered narrow-scope behavior within the broader Open defect; full opening/economic parity remains unresolved. See installed selection receipt.

## Principal general portfolio rejection — October29 after accepted tt1 deployment

Principal reports unqualified positions silently scoped to PTS, seven lifecycle-history pages, expired/opaque/unclassified records, repeated incomplete/unknown cards and commentary failure. Original failing tool trace unavailable. This reopens the broader ordinary-inventory acceptance specimen; it does not revoke bounded tt1 tactical acceptance. [Candidate receipt](../reviews/sdk-talk-portfolio-orientation-2026-10-29.md) establishes default tactical exposure predicates include historical unresolved records, recovers the existing latest-custody holdings path across all3Accounts, projects exact private source descriptions and renders compact Account inventory. Actual retained-copy SDK and browser replay pass; installation, independent review and Principal acceptance pending. Fidelity remains partial/historical; source rows are not invented live holdings or guessed structures. Record remains Open.


General-inventory successor16239e32 independently ACCEPTed after preserving b2REJECT(final-envelope bound/source-conflict visibility). Installed107caf70 actualSDK verifies all3Accounts51rows→tt1tactical4→all3/51; exact backend-selected membership and description lineage pass. Actual installed servedUI replay passes compact tables/native graphics/sourcequalification/deferredJSON/mobile. v1/grants/credentials/policies preserved. This is bounded author-installed verification, not Principal general-workflow acceptance or full grouped/current inventory semantics. Broader defect remains Open; see portfolio-orientation receipt.

## October29 universal tactical candidate — author verification

Principal rejected the generic all-Account custody table: broader scope must preserve tt1 tactical richness; old Fidelity custody remains displayable. Bounded candidate extends the existing Positions collection with a source-cut inventory view and one typed native renderer across Accounts. Actual retained-copy SDK/browser replay conserves51holdings (PTS29/Sawdust11/tt111), retains4tt1structures, groups source-compatible shares/calls without asserting lifecycle/coverage, and passes all→PTS→tt1→QQQ→evidence→all scope. Exact Fidelity source follow-up reads2selected holding refs. Source age and quote clocks remain distinct; unknown standard contract terms prevent invented monetary payoff. See [implementation/verification receipt](../reviews/sdk-talk-universal-positions-2026-10-29.md). Open: immutable independent review, Principal candidate observation and separately authorized integration/deployment. This does not change installed status or grants.


Universal candidate review update: `74efe666` independently REJECTed for false Treasury maturity attribution from an arbitrary description date; intermediate orphan heading also reproduced. Original preserved. New isolated successor enforces explicit source-date roles and generic empty-section pruning, with additional controlled falsifiers. See the universal receipt and preserved independent report. No production, grants, or defect-closure transition.
