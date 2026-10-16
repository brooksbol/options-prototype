# PL-API-02 Step 5 cold-start execution test

Result: **PASS — safe execution test**, with discoverability ambiguities below. This is test evidence, not adoption, independent procedure review or Principal authority.

Reviewed immutable candidate: `f9ff1e6753992ebaefd7c1e5569ade4226181a6b`, resolved from f9ff1e6 in `/tmp/wheelwright-api-step2`. Own full-history clone `/tmp/ww-step5-cold-f9ff1e6`; separate disposable mutation worktree `/tmp/ww-step5-cold-mutation`. No author transcript or answer key consulted. Used repository mandatory bootstrap, candidate procedure and its references. No shared checkout mutation, push, dispatch, rerun, issue/settings edit, backend or brokerage execution.

## Bootstrap and synchronization

Authority root: docs/README.md A–F model. Recovered Codex independent falsification role, Product-first mandate, fitness controls, Evidence Appliance, relevant architecture/ADRs, principles and API-v2 guardrails; indexed all ten parking-lot continuations and five journal continuations and searched PL-API-02 history. Gate Experiment 001 durable state is STAGED / experiment_started:false / mutation_permission:INACTIVE; no activated enforcement claim.

Actual remotely observed main: `704cbe54cb0c9ae9d9cb0f8724d1bb4eae451fab`, same on initial and final checks. Candidate is not an ancestor of that main (`git merge-base --is-ancestor HEAD origin/main` exit 1). Section 7 permits current accepted main/candidate; tested candidate without promoting it or falsely calling it synchronized. The private clone is clean. Remote main was observed, not rewritten or built under the candidate identity.

Latest eligible workflow run recovered using gh run list, not supplied constants: **38840860205**, push source **011defb0297b679fc63161de0282b66e6a6d0c4f**, completed/success. gh run view confirmed exact head SHA and successful deploy job. Earlier eligible run 38832531141 was also successful; no outstanding newer attempt was returned. Deployed source is an ancestor of candidate (exit 0).

## Actual no-op path

Full diff from deployed source to candidate has seven paths: procedure and proposed integration; existing plan, journal, parking lot and cleanup review updates; derived Roadmap JSON. Inspected diffs: these are workflow/evidence/state documentation and unrelated derived Product projection, with no authoritative v2 semantics or static-site build input changes. No pending closing-workstream changes in clean candidate. No trigger inputs changed. Existing acceptance comes from latest plan § Principal Product acceptance and Step 5 authorization.

Tools: Node v24.18.0, npm 11.16.0, CPython 3.9.6 macOS; pinned requirements/npm lock installed in private clone and Chromium installed, all exit 0. Installation commands and logs are preserved. Seven conformance groups passed; internal 19 operations/134 examples, public 15 operations/106 response examples. Preview-a validation/browser pass. Preview-b HTML and licenses compare exactly with preview-a. Publication build --publish, validation and browser pass.

Provenance: sourceCommit is exact candidate; sourceDirty:false; PUBLICATION_CANDIDATE; explicit publicationDate 2026-10-15; acceptedSource c2f44a38ab3bc2b8ef974ca3a08bb328a2cdd451; accepted preview SHA256 6d26b9bc44b80f45a26336d387643959ef45fd1624ea4e977693fa05f2c56821. Public version 0.5.0-contract, OpenAPI 3.1.1. Two-file allowlist:

- index.html SHA256 `f8c5f1b6adeff77b897dd89cfdf4fe2d9995c499d0a4fd42b9b18351d583c411`
- LICENSES.txt SHA256 `56872a8c6112765251a061ad17fd179d42dae5c9eae53b28eab4ed187ea4f377`

Actual bounded curl fetches for exact index/license returned 0; both cmp commands returned 0. Live human specimen passed all public operations/search/responsive/cURL/errors/schema with no unintended requests/execution UI. Downloaded existing github-pages archive read-only: only ./ directory and two regular named files; no symlinks/extra paths. Safely read only the two verified members; both match local publication exactly. Actual candidate freshness status **NO_UPDATE_REQUIRED**. No metadata/date/hash refresh, empty commit or redundant deployment performed.

## Required simulations

1. Separate worktree: append exactly one synthetic line to tools/api-docs/overview.md. git diff identifies the trigger path; release.json unchanged. --publish returns **exit 1**, `Publication blocked: generated preview differs from accepted artifact; reconcile acceptance record first`. PASS: actual identity refusal. No metadata refresh.
2. Hosting unavailable simulation: executed exact substituted command **false**, **exit 1**. Section 6 path recorded **LIVE_UNVERIFIED (SIMULATED)** and withheld publication. Wrote simulated-closeout.txt and successfully performed final read-only fetch/status/SHA/SYNC reporting afterward. PASS: failure does not prevent ordinary safe closeout. This is not evidence of a real hosting/deployment failure.
3. Acceptance pending simulation: exact overview path and missing Product/review/immutable-source authority recorded in acceptance-pending-simulation.txt; **ACCEPTANCE_PENDING**, unchanged release metadata, no dispatch or publication-triggering push. PASS: branch recoverable without author instructions.

## Ambiguities, limitations and unexecuted steps

- Candidate plan latest entry explicitly says Product acceptance PASSED/Step 5 authorized, but canonical PL-API-02 top block, cleanup delivery current-status line and historical tool README still say Product pending/Step 5 deferred. Normal bootstrap exposes stale current summaries. I used the later explicit, linked plan acceptance record for this read-only test, preserving the discrepancy rather than inventing permission. Reconcile these summaries before adoption to improve fresh-actor recovery.
- Section 7's permitted candidate may be outside accepted main, as here, while section 1/4 ordinary publication instructions target clean main/reachable main. Safe test locally reproduced candidate without publishing; this distinction should remain explicit in any report.
- Section 6 nonblocking closeout and acceptance-pending branches are human operating instructions; this test demonstrates compliance, not mechanical enforcement.
- Parent protocol durable commit/push, changed accepted-source refresh, actual deployment, manual dispatch/rerun/retry, real hosting failure and actual pending-workstream acceptance were deliberately not executed under section 7 safety. The required branches are labeled simulations. Report outside repo is authorized test output; no claim of real full project session closeout.
- No missing tool/browser/GitHub-read prerequisite. Known Redocly schema-name/deprecation and urllib3 LibreSSL warnings occurred but checks exited 0; exact logs retained. No tests or gates weakened.

## Evidence and exact commands

`execution.log` records exact commands, working directories, UTC timestamps, outputs and exit codes for conformance/build/validate/browser/comparisons, baseline validation, simulations, archive and final synchronization. Individual logs and raw runs.json/baseline-jobs.json, preview-a/preview-b/publication private reports/provenance/screenshots, live files, archive, and simulation summaries remain in this directory.

Initial prelude commands (before command logger creation), all successful unless explicitly noted above:

```sh
git rev-parse f9ff1e6
git status --short
git clone --no-hardlinks --no-checkout /tmp/wheelwright-api-step2 /tmp/ww-step5-cold-f9ff1e6
git -C /tmp/ww-step5-cold-f9ff1e6 checkout --detach f9ff1e6753992ebaefd7c1e5569ade4226181a6b
git remote set-url origin https://github.com/brooksbol/options-prototype.git
git status --short --branch
git diff --stat
git diff --cached --stat
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
gh run list --repo brooksbol/options-prototype --workflow api-v2-pages.yml --branch main --limit 100 --json databaseId,headSha,event,status,conclusion,createdAt,url > /tmp/ww-step5-cold-evidence/runs.json
node --version
npm --version
python3 --version
python3 -m venv tools/api-docs/.venv
tools/api-docs/.venv/bin/python -m pip install -r tools/api-docs/requirements.txt > /tmp/ww-step5-cold-evidence/pip.log 2>&1
npm ci --prefix tools/api-docs --ignore-scripts > /tmp/ww-step5-cold-evidence/npm-ci.log 2>&1
tools/api-docs/node_modules/.bin/playwright install chromium > /tmp/ww-step5-cold-evidence/browser-install.log 2>&1
```

CURRENT STATE: Immutable candidate cold-start safe execution PASS; procedure not adopted; actual publication bytes verified unchanged; simulations preserved.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Return independent cold-start evidence to the coordinating actor.
