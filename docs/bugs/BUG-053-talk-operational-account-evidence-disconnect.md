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
