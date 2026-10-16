# PL-API-02 Step 5 — independent review and cold-start evidence

**Status:** Separate Codex ACCEPT and corrected-candidate cold-start PASS; procedure adopted October 15, 2026. Author reconciliation distinguishes independent dispositions from author checks.

## Frozen first candidate — independent Codex REJECT

Candidate `f9ff1e6753992ebaefd7c1e5569ade4226181a6b`. Separate fresh-context Codex reviewer `step5_independent_review` received candidate identity, repository, mandatory bootstrap, procedure and integration proposal; no author answer key. Reviewer disposition:

> REJECT — one material finding. The fresh-checkout no-op route skips required tool provisioning. Section 1 creates an isolated worktree. Section 2 sends a no-op directly to section 4, whose first command requires tools/api-docs/.venv/bin/python; the build also requires checkout-local node_modules. Both are untracked and absent from a fresh worktree. Their installation appears only in section 3, which the no-op route bypasses. Existing installed dependencies in the author checkout conceal this failure. Minimum correction: make the existing installation/reuse block a common prerequisite for both no-op and accepted-update branches. Explicitly route no-op through it, without invoking release refresh or deployment. Repeat the independent fresh-checkout no-op test before adoption.

Reviewer independently verified remote704cbe54, deployment38840860205/source011defb, successful build/deploy; built with existing dependencies, validated internal19/134 examples/public15/106 response examples, and matched live HTML bytes. No additional material authority/security/workflow/integration finding. No reviewer repository/GitHub/backend mutations. Gate experiment remained staged. These probes did not replace the cold-start gate.

## Author reconciliation

New candidate explicitly makes tool provisioning common to no-op and accepted-update paths, routes no-op through that prerequisite and then directly to section4, and leaves release metadata/deployment untouched on no-op. Product acceptance is also reconciled into the parking lot, journal and cleanup delivery's latest-state annotation; older pending-review language remains historical. Separate review and fresh-context execution of the corrected candidate remain required before adoption.

## Corrected candidate — independent Codex ACCEPT

Separate reviewer re-reviewed immutable `e5a67dff92b36cc40c306a0177998304e86ee934`: **ACCEPT**, no remaining material findings. The common tool provisioning now explicitly precedes no-op section4; no-op skips identity refresh/deployment. Reviewer rechecked full procedure/integration, acceptance boundaries, exact-source run verification, reproducibility and failure/closeout sequencing. Clean candidate publication build and validation passed internal19/134/public15/106; both public files match prior verified bytes; provenance records reviewed SHA and sourceDirty:false. Tooling/workflow/contracts/public inputs are unchanged. Reviewer explicitly permits the exact proposed insertion after separate cold-start PASS, without semantic change. No reviewer repository/GitHub/backend mutations; experiment remains staged.

## Initial cold-start test — separate evidence, not the adoption gate

A separate fresh-context actor reported safe-test PASS for frozen f9ff1e6: actual no-op builds/live/archive checks, identity refusal, simulated hosting failure/nonblocking reporting and acceptance-pending branch. [Original report](pl-api-02-step5-cold-start-initial-2026-10-15.md) is preserved unchanged. It provisioned tools and ran section3 checks despite the no-op route's omission; that successful execution does not falsify the independent routing defect or override the REJECT. It also identified stale acceptance summaries, reconciled in the corrected candidate/current-state records. A new fresh-context actor tests corrected e5a67df; adoption remains pending that result.

## Corrected cold-start execution — PASS; adoption

A new fresh-context actor `step5_corrected_cold_start` tested immutable e5a67df with only mandatory bootstrap, procedure and named references. [Full report](pl-api-02-step5-cold-start-2026-10-15.md) is preserved byte-for-byte. Actual no-op followed common setup then section4 from a fresh full-history clone: locked provisioning, clean publication build, internal19/134 and public15/106 validation, local/live browser, live byte comparisons and downloaded two-file artifact all passed. Exact same public hashes as accepted site. No blocking ambiguity or missing prerequisite on exercised paths.

Disposable overview mutation actually refused publication (exit1, preview identity mismatch) with unchanged release record. Acceptance-pending and false/exit1 unavailable-hosting/nonblocking-closeout exercises passed as explicitly labeled simulations; no real publication failure, source push, dispatch, rerun, backend or brokerage action is claimed. Accepted-change refresh and actual deployment were intentionally outside this safe test; existing independently verified Step4 delivery remains their working precedent. Actor separately reported tested candidate, remote704cbe54 and deployed011defb identities.

Both gates now apply to e5a67dff92b36cc40c306a0177998304e86ee934. Author compared the procedure byte-for-byte with that candidate before changing only its adoption-status annotation, then applied the exact reviewed two-bullet insertion into parent protocol item5. It explicitly sequences pre-persistence checks, post-persistence publication observation and final trigger/SYNC recheck. No substantive procedure or integration change after gates. Issue39 can now be reconciled after durable adoption; no broader Product/domain decision is implied.

## Current-site continuity and author verification

Author independently rebuilt f9ff1e6 as clean publication candidate: sourceDirty:false, accepted identity passes; validation19/134/internal and15/106/public, live browser and local/live cmp pass. Corrected-candidate independent checks above supersede the first candidate as adoption evidence. Live API0.5.0-contract/publication date2026-10-15 retains deployed source011defb0297b679fc63161de0282b66e6a6d0c4f/run38840860205. No relevant public/contract/tooling/backend/workflow inputs changed, so Step5 is NO_UPDATE_REQUIRED and does not dispatch/redeploy or change publication date.

| Public identity | SHA-256 |
| --- | --- |
| index.html | f8c5f1b6adeff77b897dd89cfdf4fe2d9995c499d0a4fd42b9b18351d583c411 |
| LICENSES.txt | 56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377 |

Roadmap regenerated from current parking-lot state; freshness and58 integrity/freshness tests pass. Contract/tool/backend/workflow/agent-entry inputs remain byte-identical to remote704cbe54. No broader REST redesign, new Product decision, experimental activation or operational mutation. Temporary cold-test clones/reports remain private; durable reports summarize facts rather than relying only on temporary paths. Original Kiro acceptance evidence untouched. Final accepted-main SYNC is reported after persistence, separately from the deployed source above.
