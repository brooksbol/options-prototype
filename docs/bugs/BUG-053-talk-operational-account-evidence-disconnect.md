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
Targeted admission/security/row-equivalence checks pass at development source. Actual grant reads and Sawdust reconciliation pass. Output-cap diagnosis and real-model correction pass. Combined/main/installed checks pending; record remains Open.

## Related
PL-MCP-01; ADR-024; BUG-052 covers source/Markdown presentation separately.

## Subsequent production falsification — October 27

The Principal's installed conversation finds a second gap after transport/import correction: successful holdings retrieval still omitted BIZD and inherited tt1 scope, native Fidelity `Available to trade`/`Cash and credits` labels were dropped, and absent optional quote measurements were mistaken for absent quote facts. Premium refusal based on custody alone overlooked an existing retained transaction path. This does not retroactively validate earlier completeness claims.

The [existing receipt](../reviews/sdk-talk-real-read-profile-2026-10-27.md#production-portfolio-replay-correction--october-27-after-installed-conversation) records bounded backend option inventories/exact counts, native cash-label projection, bounded retained-only transaction selection/MCP, authoritative quote recovery and typed UI rows. Per-Account denial remains explicit; no grant changes. Cash-secured construction identity, current-held opening-cohort attribution and universal liquidity ranking remain unestablished. Verification receipts in that section distinguish controlled fixtures from installed real reads. Remains Open pending independent review and Principal observation; source correction is not acceptance.
