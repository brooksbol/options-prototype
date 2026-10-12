# BUG-035 — ww ls accounts exposes full brokerage account numbers by default

- **Status:** Resolved
- **Severity:** Not established
- **Area:** CLI / ww Account discovery human and TSV presentation
- **Provenance:** Principal-directed filing, October 11, 2026; Codex bounded Account review under PL-CONV-01

## Observed failure
The default `ww ls accounts` human table and redirected TSV output render complete brokerage account numbers instead of masking them. Codex reproduced full-number rendering in a synthetic in-memory probe and inspected the rendering path. This record does not claim a live deployed-session reproduction.

## Intended semantics violated
Principal's October 11 Account confidentiality requirement: operator-facing Account presentations mask brokerage account numbers by default (normally exposing at most the final four characters). The operator uses Account nicknames such as `pts` and `sawdust`, never brokerage numbers or canonical GUIDs for ordinary account selection. This is a presentation-disclosure requirement distinct from canonical URI confidentiality and backend authorization.

## Evidence
- Codex October 11 read-only review reports default table and redirected TSV expose the full brokerage number; synthetic in-memory probe reproduced rendering.
- Implementation: `scripts/ww-accounts.mjs` Account presentation, around lines 43–46 in reviewed baseline.
- Source: `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountsController.java` and `docs/contracts/api-v2-account-evidence.json` currently expose `brokerAssociation.accountNumber` to authorized Account-metadata readers.
- Accepted Account operating loop: `docs/cli/ww-account-evidence.md`. Review baseline remote main `1118d732c573c71f79cdb1db1b82c8decc5dced5`.

## Consequence
Unnecessary exposure of sensitive account numbers in ordinary terminal output and redirected files. The backend's authorized payload disclosure is a distinct, unresolved question; this finding does not establish cross-user authorization bypass.

## Diagnosis / root cause
CLI projects the full `brokerAssociation.accountNumber` value without default masking. The precise rendering branch and output-mode coverage require confirmation during remediation.

## Scope / non-goals
This bug concerns ordinary CLI human/TSV presentation. Do not silently change canonical Account IDs, nickname resolution, brokerage bindings, Account authorization, API disclosure policy, raw broker evidence or machine-readable output contracts under this bug. API full-number disclosure scope remains a separate PL-CONV-01 design question. Filing does not authorize remediation.

## Acceptance criteria
- Ordinary `ww ls accounts` human presentation and redirected TSV do not disclose full brokerage account numbers; at most the last four characters are visible by default.
- Preserve nickname-based account selection and backend-authoritative resolution.
- Any explicit unmasked/machine-use behavior requires separate Product/security authority and tests; do not infer permission from the existing payload.
- Verify masking for short, absent and malformed values without leaking them.

## Remediation history
### October 11, 2026 — Authorized correction candidate

The Principal explicitly authorized BUG-035 remediation with PL-CONV-01 Step 3 and designated Codex Implementation Engineer for this bounded delivery. The accepted design preserves backend Account discovery and the existing API/explicit JSONL representation. `renderAccounts` now masks the account-number cell in default terminal tables, forced tables and default/explicit redirected TSV. Recognized references longer than four characters expose only their final four behind `****`; short, absent, malformed and non-string values expose no suffix. Nicknames, columns and control-character escaping remain usable.

Separate regression identity: `scripts/ww-account-confidentiality.test.mjs`, the three `BUG-035` tests. No full-number API policy or new unmasked output mode is selected. Candidate and review evidence: `docs/design/pl-conv-01-step3-candidate.md`.

**Independent verification: ACCEPT for the frozen correction candidate. Status remains Open pending Principal operator acceptance and applicable defect closeout.** Passing author or verifier tests does not close this defect.

## Verification
Original synthetic reproduction and source inspection establish the reported failure. Author correction verification passes the three dedicated BUG-035 tests within 14 Account/sync/Position/OAS CLI tests (including the nine accepted regressions). Actual CLI default terminal and forced tables against an isolated v2 preview show masked Fidelity and tastytrade Accounts, including Principal-selected nickname `tt1`. API payload and explicit JSONL remain unchanged. This is candidate preview evidence, not deployment or Principal acceptance. Independent verification separately ACCEPTS BUG-035: 14 frozen CLI tests and 21 additional actual CLI processes pass, including malformed/short references and actual isolated default terminal, forced-table and TSV output. The exact frozen archive hash and report are recorded in the linked candidate record. Principal acceptance and defect closure remain pending.

## Related
- `PL-CONV-01` — tt / ww v2 convergence and Account identity/disclosure reconciliation.
- `docs/77-api-v2-architectural-guardrails.md` — backend identity and authorization boundaries.
- `docs/cli/ww-account-evidence.md` — accepted Account operating loop.

## Principal acceptance disposition — October 11, 2026

**REJECTED.** The Principal requires acceptance testing without environment variables. The submitted preview procedure depended on exporting `WW_BASE_URL`; its success is technical verification, not Product acceptance. Independent correction ACCEPT remains recorded, but BUG-035 stays Open. The variable-based acceptance procedure is withdrawn. No deployment, service restart, configuration change or implementation retry follows from this rejection.

### Direct Operator output after procedure regeneration

The Principal supplied ordinary terminal default/forced Account tables and default/explicit redirected TSV. Both Fidelity Accounts are masked in all four outputs and nicknames remain visible. PTS/Sawdust Position reads and a zero-upload, zero-failure PTS sync also succeed. This is direct Operator verification evidence; no explicit BUG-035 acceptance or closure was declared. BUG-035 remains Open. The distinct Step 3 multi-broker target still fails because `tt1` is absent.


### October 11, 2026 — Operational engineering verification after authorized deployment

The separately authorized Step3 deployment retry succeeded with the frozen correction unchanged. Ordinary installed `ww ls accounts` actual default terminal, forced table, redirected default and explicit TSV all mask Fidelity and tastytrade Account references; nicknames pts/sawdust/tt1 remain visible. No connection overrides were used. This is live engineering verification, not Principal acceptance or defect closure. **Status remains Open.** Exact candidate/release evidence and recovery state: `docs/design/pl-conv-01-step3-candidate.md`.


## Resolution — October 11, 2026

**Principal acceptance: ACCEPTED.** After operational deployment, the Principal supplied ordinary installed default terminal, forced table, explicit TSV and redirected default outputs for Fidelity pts/sawdust and tastytrade tt1. All Account references were masked, nicknames remained usable, Fidelity Position reads and sync succeeded, and tt1 sync gave expected unsupported guidance. The Principal then explicitly selected A accepting Step3 and independently accepting this correction.

Separate defect verification remains the three BUG035 regression tests (including short/missing/malformed references), independent correction ACCEPT,21 independent CLI process probes and four live engineering presentation modes. These precede and are distinct from explicit Principal acceptance. Remediation is the frozen `scripts/ww-accounts.mjs` correction with dedicated `scripts/ww-account-confidentiality.test.mjs`; exact archive/release hashes and evidence are in the linked delivery record. **Status: Resolved.** API full-number disclosure policy remains deferred; no broader capability is inferred.
