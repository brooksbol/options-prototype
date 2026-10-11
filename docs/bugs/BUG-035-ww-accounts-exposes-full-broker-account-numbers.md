# BUG-035 — ww ls accounts exposes full brokerage account numbers by default

- **Status:** Open
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
None; Open.

## Verification
Codex synthetic reproduction and source inspection establish the reported failure; no remediation verification.

## Related
- `PL-CONV-01` — tt / ww v2 convergence and Account identity/disclosure reconciliation.
- `docs/77-api-v2-architectural-guardrails.md` — backend identity and authorization boundaries.
- `docs/cli/ww-account-evidence.md` — accepted Account operating loop.
