# WW update workflow — Principal Product clarification

Date: October 15, 2026. Owner: existing PL-CLI-01.
Status: Principal-decided Product contracts; implementation status is separate.
This records the Principal's supplied clarification and subsequent default-symbol decision. It does not authorize deployment, operational migrations, live acquisition or unrelated implementation.

**ww pull — Update WW with everything so I can start doing stuff.**

Wheelwright is the destination. The routine workflow is `ww pull`, then `ww show ...`, `ww ls ...`, and `ww history ...`. Explicit acquisition and bounded backend read-through coexist.

## Command contracts

| Command | Intended behavior |
|---|---|
| `ww sync` | Synchronize all applicable authorized Accounts. |
| `ww sync account tt1` | Synchronize the selected Account. |
| `ww fetch` | Acquire market evidence for backend-selected default subjects. |
| `ww fetch XLE EWZ` | Preserve explicit targeted acquisition. |
| `ww history` | Present history across authorized Accounts. |
| `ww history --account tt1` | Present the selected Account's history. |
| `ww pull` | Coordinate the overall authorized update and report its outcome. |

Omitted optional selectors use the natural authorized default; explicit selectors narrow the operation. Operators select Account nicknames, never GUIDs. These are Product contracts, not assertions of installed support.

## Default subjects — approved decision

The backend selects **authorized holdings' underlyings UNION explicitly configured monitoring subjects**. Deduplicate by canonical instrument identity, within authenticated User authority. Use latest admitted holdings after SYNC. Exclude closed holdings unless monitoring independently retains relevance. Failed synchronization does not mean retained holdings disappeared. Preserve monitoring subjects even when not held. Report missing/incomplete source coverage; do not silently omit either source. Empty selection is a legitimate no-op. Explicit symbols preserve their existing targeted semantics. Watchlists, strategy candidates and additional sources require a separate Product decision.

## Composition and reporting

`SYNC → DISCOVER → FETCH → REPORT` is intentional. Complete synchronization attempts before backend discovery so a newly admitted holding is eligible during the same pull. Continue independent authorized work after individual failures while preserving retained evidence and each source's clocks. Do not manufacture an atomic portfolio snapshot.

Compose existing public capabilities, preferably command-level composition. No SQLite/provider access, duplicate authorization, client symbol-selection rules, hard-coded Accounts/symbols, second ledger or provider-specific orchestration framework. Preserve the October 11 Unix-composability falsifiers: missing primitives are gaps, not permission to bury domain behavior in the composer.

Normal pull output is a concise Git-style change report: updated/reused/unchanged sources when established, failures, incomplete coverage and retained evidence. No dashboard, listing, quote dump or internal trace. Positions added/removed or new transactions require authoritative deltas; incomplete snapshot differences are insufficient. Preserve verbose inspection and meaningful partial-failure exit status. Successful acquisition does not establish complete history or universal freshness.

## History and authority

Keep `GET /v2/accounts/{accountId}/transactions` and its transaction instance. User identity comes from authentication; Account capability grants enforce many-to-many access with no financial administrator bypass. CLI aggregation does not introduce an unscoped backend collection. Each result retains Account identity, provenance, exact amounts, correction/reversal information, coverage and independent timestamps.

Tastytrade history may acquire/persist through authorized backend policy; a separate `ww fetch` is not a prerequisite. Fidelity history reads available imported CSV evidence; ordinary history does not run CSV discovery/import. Freshness and historical completeness remain independent.

## Bounded sanity check and current gaps

Checked against Doc 77, including October 11 identity/isolation and October 13 domain-facade/read-through clarifications, PL-CLI-01's October 11 pull proposal, current sync/fetch implementation and the approved history checkpoint. No architectural conflict found. Product contracts supersede the older proposal's unresolved/default-selection and unratified-command statements; its composition falsifiers remain applicable.

| Check | Reuse and specific gap |
|---|---|
| A — bare sync | `/v2/accounts` supplies authorized metadata; existing selected-Account sync handles Fidelity CSV submission and backend tastytrade holdings acquisition. Bare sync is not implemented. Metadata visibility alone is not acquisition permission; use backend capability discovery/checks and preserve per-Account failures. |
| B — bare fetch | Existing v2 quote acquisition remains reusable for explicit subjects. Current request requires 1–30 explicit subjects. Historical monitored-membership storage exists, but does not establish an authenticated User-scoped v2 monitoring source. Missing: backend selection facade joining latest authorized holdings with appropriately scoped monitoring evidence, canonical deduplication and coverage/no-op reporting. Do not copy the historical experimental CLI seed/union. |
| C — pull order | Thin composition can enforce sync-before-discovery/fetch. Pull is unimplemented and must await adequate lower-level public primitives. A failed Account leaves its last admitted holdings available, with failure/staleness qualified. |
| D — partial failures | Existing sync/acquisition status, retained snapshots and history provenance are reusable. Aggregate results must preserve each source failure and coverage rather than collapse to one success flag. |
| E — change report | Existing import/acquisition/result counts can support bounded source reports. No verified general position/transaction delta report; omit unsupported counts. Quote acquisition uses its existing fulfillment/reuse/failure evidence. |
| F — bare history | Current authorized history work adds CLI composition of authorized Account discovery and nested reads. Each backend request independently enforces history grants; denied/unavailable Accounts remain explicit failures. One CSV header; records retain Account IDs and per-Account context. No global route. |
| G — explicit forms | Preserve selected sync, explicit-symbol fetch, selected history and established output/color conventions. No broader primitive changes are authorized by this record. |

Current authorized source work remains transaction history, including the clarified no-argument form and Fidelity retained evidence. Bare sync, default-selection/backend capability, bare fetch and pull require separately scoped implementation authorization. Their Product policy is settled; no new exploratory design cycle is needed. No operational changes or live provider calls were made for this check. Author checks do not constitute independent or Principal acceptance.


## Principal acceptance gate — subsequent October 15 clarification

The required acceptance command is exactly **`ww pull && ww history`**, on the normal installed Wheelwright CLI/backend, using real retained/newly acquired brokerage evidence and persistence. No synthetic acceptance data, preview launcher, Account arguments/GUIDs, manual sync commands, environment configuration or special wiring. Engineering fixtures remain useful tests, never substitutes for this gate. The Principal rejected the isolated preview as an acceptance procedure, not as evidence that its component checks failed.

Pull must synchronize applicable authorized Account evidence before backend discovery and relevant market acquisition, produce the agreed Git-style report, and return a truthful status. A partial failure returns nonzero and intentionally prevents history via `&&`; retained evidence and source limitations remain reported. Successful pull permits no-argument history across authorized Accounts. Fidelity remains constrained to available supported CSV evidence; no unsupported automatic brokerage download or fresh/lifetime coverage promise is inferred.

Current dc19cdd does not satisfy the gate: pull execution and its missing lower-level capabilities remain absent. Remaining engineering: all-applicable authorized Account sync composition, supported transaction-evidence update integration (holdings acquisition alone does not refresh tastytrade history), backend default-subject selection/authorized monitoring source, bare fetch using that selection and existing acquisition, ordered pull composition and truthful source report/status. Then integrate/review the combined release and validate the installed real-evidence workflow under separately authorized operational promotion/acquisition.

This acceptance clarification does not silently expand prior transaction-history-only implementation permission. A bounded engineering scope extension for the missing update workflow is required; no further Product design cycle is needed. Deployment, operational migration/configuration/grant changes and real source acquisition remain reserved until a concrete release/action is ready for authorization. No such operational action occurred during reconciliation.


## October 15 accepted delivery — supersedes earlier implementation-gap status

Principal later authorized integrated engineering and necessary operational changes, then reported **acceptance PASSED** for installed `ww pull && ww history` from any directory. The earlier sanity-check/gap passages remain dated provenance, not current claims that pull or default selection is absent or unauthorized. [Accepted delivery and bounded limits](../design/ww-integrated-update-candidate-2026-10-15/README.md) records implementation e6e3b55, actual evidence, recovery and verification. Product policy and Doc 77 authority boundaries remain unchanged. Explicitly authorized end-of-session reconciliation/push closes this slice; broader PL-CLI-01 remains open.
