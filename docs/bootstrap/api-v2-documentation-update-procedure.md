# API v2 documentation — end-of-session update procedure

**Status:** Adopted October 15, 2026 after separate Codex ACCEPT and fresh-context cold-start PASS on e5a67df; [gate evidence](../reviews/pl-api-02-step5-review-and-test-2026-10-15.md).
**Authority:** [PL-API-02 plan](../design/pl-api-02-v2-documentation-requirements-plan-2026-10-15.md), Principal Product acceptance and Step 5 authorization, October 15, 2026.  
**Parent:** [End-of-Session Protocol](end-of-session-protocol.md). This procedure supplies its documentation check, not a second closeout process or new execution grant.

## 1. Scope, prerequisites and safety

Run this check during every authorized session closeout. The accepted baseline is **15 public operations / 19 authoritative internal operations**, OpenAPI 3.1.1, API version `0.5.0-contract`. A future count change needs accepted Product evidence; do not change count assertions merely to get green tests. The authoritative entry is `docs/api-v2/README.md`; OAS files are the three `docs/contracts/api-v2-*.{yaml,json}` files. Linked domain contracts remain authoritative; public HTML is derived.

Reuse `tools/api-docs/README.md`, `release.json`, `build.py`, `validate.py`, `human-specimen.mjs`, `scripts/v2-oas-conformance-test.py` and `.github/workflows/api-v2-pages.yml`. Do not change backend behavior, contracts to hide a runtime defect, Pages settings, environment protections or workflow permissions during ordinary closeout. No v1 expansion, custom documentation infrastructure, live API execution, credentials, real financial examples, source artifacts or advertised OAS download. Public authentication/grant instructions remain excluded; internal security semantics remain intact.

Commands below run in **zsh or bash at the repository root**, unless explicitly changing directory. Require Git, authenticated `gh` with repository/Actions read access (and existing main push/workflow-dispatch authority when those steps apply), Python, and the pinned Node **24.18.0** / npm **11.16.0**. Do not print tokens or change account credentials. Exact versions are in `tools/api-docs/package.json`; CI uses CPython **3.12.15**, Ubuntu 24.04. Local CPython 3.9.6 has also reproduced the artifacts. Another interpreter/platform is provisional until byte comparison and CI pass. Missing tools are a capability limitation: use the existing governed capable-actor handoff; do not invent a new installation platform or call the docs synchronized.

Before any mutation, complete standard agent bootstrap, recover the closing workstream's authorization/acceptance evidence, and inspect state:

```sh
git status --short --branch
git diff --stat
git diff --cached --stat
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
```

Never stash, reset, clean, stage or commit unrelated work. Use an isolated worktree for verified remote main if the current checkout is dirty, divergent or belongs to another task. Keep authorized uncommitted work in its existing owner checkout; inspect its diff separately and persist it deliberately under the parent protocol before final freshness verification. A clean main clone cannot prove that pending work is documented. Example isolation (the directory is newly created; no existing tree is removed):

```sh
DOCS_PARENT=$(mktemp -d /tmp/ww-api-closeout.XXXXXX)
git worktree add --detach "$DOCS_PARENT/repo" origin/main
cd "$DOCS_PARENT/repo"
DOCS_EVIDENCE=$(mktemp -d /tmp/ww-api-evidence.XXXXXX)
DOCS_SOURCE=$(git rev-parse HEAD)
printf '%s\n' "$DOCS_SOURCE" > "$DOCS_EVIDENCE/source-sha.txt"
```

For an already clean, correctly targeted checkout, create only `DOCS_EVIDENCE` and set `DOCS_SOURCE` as above. Keep temporary reports/private outputs outside the public site. Never publish from a dirty candidate or a candidate not reachable from remote main.

## 2. Establish the deployed baseline and classify the session

Do not equate latest main, a successful preview, an accepted preview or a queued deployment with live publication. Obtain runs for the existing workflow:

```sh
gh run list --repo brooksbol/options-prototype --workflow api-v2-pages.yml --branch main --limit 100 --json databaseId,headSha,event,status,conclusion,createdAt,url > "$DOCS_EVIDENCE/runs.json"
python3 - "$DOCS_EVIDENCE" <<'PY'
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
runs = [r for r in json.loads((p/'runs.json').read_text()) if r['event'] != 'pull_request']
runs.sort(key=lambda r: r['createdAt'], reverse=True)
for r in runs: print(r['databaseId'], r['headSha'], r['status'], r['conclusion'], r['url'])
success = next((r for r in runs if r['status']=='completed' and r['conclusion']=='success'), None)
if success is None: raise SystemExit('BASELINE_UNVERIFIED: no successful publication run in retrieved history')
(p/'baseline-run.json').write_text(json.dumps(success, indent=2)+'\n')
PY
DOCS_BASE_RUN=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["databaseId"])' "$DOCS_EVIDENCE/baseline-run.json")
DOCS_DEPLOYED=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["headSha"])' "$DOCS_EVIDENCE/baseline-run.json")
gh run view "$DOCS_BASE_RUN" --repo brooksbol/options-prototype --json headSha,status,conclusion,jobs,url > "$DOCS_EVIDENCE/baseline-jobs.json"
python3 - "$DOCS_EVIDENCE/baseline-jobs.json" "$DOCS_DEPLOYED" <<'PY'
import json, sys
r=json.load(open(sys.argv[1]))
assert r['headSha']==sys.argv[2] and r['conclusion']=='success'
assert any(j['name']=='deploy' and j['conclusion']=='success' for j in r['jobs']), 'No successful deploy job'
PY
git merge-base --is-ancestor "$DOCS_DEPLOYED" HEAD
git diff --name-status "$DOCS_DEPLOYED" HEAD > "$DOCS_EVIDENCE/changed-paths.txt"
cat "$DOCS_EVIDENCE/changed-paths.txt"
```

A nonzero command, absent history/ancestor or failed/in-progress newer run is not a successful no-op. Read `runs.json`: a newer failed/cancelled/in-progress run is an outstanding publication attempt, even if old live bytes match. Preserve its ID/state; inspect its scoped diff before deciding whether content is stale. If no successful run is available in 100 results, obtain the documented deployment source/run from the latest durable publication evidence and verify its deploy job with the same commands; otherwise `BASELINE_UNVERIFIED`, section 6. Do not infer a baseline from a PR build. Read-only GitHub queries and fetching the two public files are permitted; no API operations or brokerage calls are involved.

**Trigger set:** Any changes since `DOCS_DEPLOYED`, or pending closing-workstream changes, to:

- Workflow `.github/workflows/api-v2-pages.yml`; all `tools/api-docs/**` tracked files, including release metadata/locks/assets/overview; `scripts/v2_oas.py`, `scripts/v2-oas-conformance-test.py`.
- `docs/contracts/api-v2-*`, `docs/api-v2/**`, `docs/cli/ww-account-evidence.md`.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/**` (even a behavior-preserving change requires checking fidelity).
- Any other closing-workstream change that affects accepted v2 parameters, requests, schemas, errors, security, HTTP headers/caching, provenance or completeness. Inspect the workstream's accepted scope and linked contracts (including `docs/contracts/evidence-snapshot-v1.md` when applicable). These semantic dependencies are not all Actions path filters; manually dispatch only after the acceptance/build gates below pass if an accepted change needs publication and no push run was triggered.

Read the entire changed-path list and relevant pending diffs; a filename filter alone cannot establish semantic no-op. Pure journal, parking-lot, review evidence or unrelated Product work with **no v2 semantic/build impact** is excluded. Record which paths and acceptance records support that conclusion. Do not treat a merged implementation, OAS inclusion or release hash as Product acceptance.

**Branches:**

- **No relevant change, no outstanding attempt:** first execute section 3's common tool provisioning, then skip its accepted-change-only checks/identity refresh and proceed to section 4. Section 4 builds the current publication candidate and compares it with live bytes. If green, record `NO_UPDATE_REQUIRED`, old deployed source/run and current source/final SYNC separately; do not refresh dates/hashes, create an empty commit or dispatch a redundant deployment. If that build fails or bytes differ, section 6 applies; it was not a verified no-op.
- **Relevant and accepted:** verify OAS matches runtime, reuse workstream conformance evidence and run section 3. A backend-only correction may reproduce identical public bytes, but still run the affected fidelity checks; existing push CI may deploy identical bytes. Do not rewrite release metadata if the existing identity gate passes.
- **Acceptance pending or ambiguous:** record `ACCEPTANCE_PENDING`, exact affected paths and missing authority. Do not refresh `release.json`, dispatch or claim current docs. Preserve authorized work under parent closeout; this procedure does not forbid an otherwise authorized source push, but warn that its existing automatic publication build must fail closed if accepted identity differs. If unchanged artifact bytes would allow automatic publication yet acceptance is unresolved, do not push that publication-triggering candidate until its workstream authority resolves the ambiguity. No change to workflow permissions/guards to evade the boundary.

## 3. Common tool provisioning; accepted-change verification and identity refresh

**Common prerequisite for BOTH no-op and accepted-update paths:** Install/reuse the pinned tools in the isolated checkout (network is for locked package/browser downloads, not operational API access). Verify `node --version` and `npm --version` equal the versions above; provision through existing environment tooling or delegate if unavailable. From root:

```sh
python3 -m venv tools/api-docs/.venv
tools/api-docs/.venv/bin/python -m pip install -r tools/api-docs/requirements.txt
npm ci --prefix tools/api-docs --ignore-scripts
tools/api-docs/node_modules/.bin/playwright install chromium
```

After provisioning, the no-op path goes directly to section 4; it must not refresh release metadata or dispatch. The remaining section 3 checks and identity refresh apply only to accepted changes.

On Linux, use the CI command `playwright install --with-deps chromium` through the existing authorized environment, not an unreviewed sudo script. Missing browser/OS prerequisites are capability failures; hand off rather than skip browser checks. The following blocks require **every command exit 0**. Execute sequentially; on the first failure stop that block and use section 6 (do not paste a multiline block and assume the last exit code proves all commands passed).

```sh
tools/api-docs/.venv/bin/python scripts/v2-oas-conformance-test.py
tools/api-docs/.venv/bin/python tools/api-docs/build.py "$DOCS_EVIDENCE/preview-a"
tools/api-docs/.venv/bin/python tools/api-docs/validate.py "$DOCS_EVIDENCE/preview-a"
node tools/api-docs/human-specimen.mjs "$DOCS_EVIDENCE/preview-a"
tools/api-docs/.venv/bin/python tools/api-docs/build.py "$DOCS_EVIDENCE/preview-b"
cmp "$DOCS_EVIDENCE/preview-a/site/index.html" "$DOCS_EVIDENCE/preview-b/site/index.html"
cmp "$DOCS_EVIDENCE/preview-a/site/LICENSES.txt" "$DOCS_EVIDENCE/preview-b/site/LICENSES.txt"
```

Expected: seven conformance groups; internal 19 operations / 134 examples; public 15 operations; private agent/human reports; native navigation/search/mobile/examples; zero page errors and unexpected HTTP requests; exact two-file site. Changed behavior needs the workstream's applicable actual synthetic HTTP/backend fidelity checks as well; schema-valid examples do not prove runtime truth. No live mutations. A new materially changed candidate must retain the plan's independent review/security gates; author verification is not independent acceptance. Do not automatically re-review unchanged accepted bytes, or claim old acceptance covers a changed wire contract.

If `build.py --publish` below already passes, preserve `release.json`. If it fails specifically on accepted identity, first persist the accepted source/content in an authorized deliberate commit, record the immutable accepted source SHA and linked acceptance/security/independent evidence in the plan or its delivery record, and reproduce the preview at that source. Do not select a source solely because it is main. Recover or obtain missing review before refreshing identity. For an already accepted change, perform this exact refresh, substituting **only** the evidence-backed SHA and actual intended ISO publication date in the two assignments:

```sh
DOCS_ACCEPTED_SOURCE='<full accepted source SHA from the workstream evidence>'
DOCS_PUBLICATION_DATE='<YYYY-MM-DD intended publication date>'
```

Those are required input values, not literal shell-ready defaults. Never invent them. Set `previewDate` only if the accepted preview intentionally changes its dated content; then rebuild/review that preview before using its hash. Run from the clean accepted source checkout with `preview-a` from that exact source:

```sh
python3 - "$DOCS_EVIDENCE/preview-a/private/provenance.json" "$DOCS_ACCEPTED_SOURCE" "$DOCS_PUBLICATION_DATE" <<'PY'
import datetime, hashlib, json, pathlib, subprocess, sys
m=json.load(open(sys.argv[1])); sha=sys.argv[2]; date=sys.argv[3]
assert len(sha)==40 and m['sourceCommit']==sha and not m['sourceDirty']
assert datetime.date.fromisoformat(date).isoformat()==date
subprocess.run(['git','merge-base','--is-ancestor',sha,'HEAD'],check=True)
p=pathlib.Path('tools/api-docs/release.json'); r=json.loads(p.read_text())
# Preserve the existing record's semantics/provenance fields; do not manufacture review approval.
r.update(acceptedSource=sha, publicationDate=date,
         acceptedPreviewSha256=m['publicFiles']['index.html'],
         acceptedLicensesSha256=m['publicFiles']['LICENSES.txt'])
paths=sorted(pathlib.Path('docs/contracts').glob('api-v2-*'))
paths += [pathlib.Path('docs/api-v2/README.md'), pathlib.Path('docs/cli/ww-account-evidence.md')]
r['acceptedContractInputs']={str(q):hashlib.sha256(q.read_bytes()).hexdigest() for q in paths}
p.write_text(json.dumps(r,indent=2)+'\n')
PY
```

If accepted-source evidence had to be added after that source commit, reproduce at a new clean source commit including the record and use that SHA; do not bypass `sourceDirty`. Commit only the authorized release metadata and evidence after reviewing their diff. Its commit becomes the publication candidate source; accepted-source ancestry and preview identity must still pass. Never include generated/private output in Git. The preview's recent-contract-changelog depends on Git history: reproduce from full history, not an exported source directory/shallow clone. A history-induced hash difference still needs examination, not a blind acceptance refresh.

## 4. Build and observe a publication candidate

At the clean candidate source (or clean unchanged main for no-op), re-set `DOCS_SOURCE=$(git rev-parse HEAD)`; use installed pinned tools. On every command failure go to section 6:

```sh
tools/api-docs/.venv/bin/python tools/api-docs/build.py "$DOCS_EVIDENCE/publication" --publish
tools/api-docs/.venv/bin/python tools/api-docs/validate.py "$DOCS_EVIDENCE/publication"
node tools/api-docs/human-specimen.mjs "$DOCS_EVIDENCE/publication"
shasum -a 256 "$DOCS_EVIDENCE/publication/site/index.html" "$DOCS_EVIDENCE/publication/site/LICENSES.txt"
```

`private/provenance.json` must record `sourceCommit=DOCS_SOURCE`, `sourceDirty=false`, `publication=PUBLICATION_CANDIDATE`, explicit publication date, accepted preview identity and `publicFiles` containing exactly index.html/LICENSES.txt. `--publish` checks accepted-source ancestry, accepted input hashes, preview/license hashes; it changes only the publication-date labels. It does **not** prove deployment. Inspect the bundled/public projection and HTML disclosure before a changed publication: synthetic only, no private paths/SHA UI/auth instructions/execution/download controls; validate the two-file allowlist and compare repeat builds. Existing browser specimen tests all 15 public operations, excluded routes, schemas, errors, native search, responsive layout and no unintended requests. Review public bytes, not just the private source OAS.

For no-op, skip section 5 and execute this live comparison now. For an update, execute it **after** section 5. Fetch only the exact static files with bounded timeouts; no operational APIs:

```sh
curl --fail --silent --show-error --connect-timeout 10 --max-time 30 "https://brooksbol.github.io/options-prototype/index.html?source=$DOCS_SOURCE" -o "$DOCS_EVIDENCE/live-index.html"
curl --fail --silent --show-error --connect-timeout 10 --max-time 30 "https://brooksbol.github.io/options-prototype/LICENSES.txt?source=$DOCS_SOURCE" -o "$DOCS_EVIDENCE/live-LICENSES.txt"
cmp "$DOCS_EVIDENCE/publication/site/index.html" "$DOCS_EVIDENCE/live-index.html"
cmp "$DOCS_EVIDENCE/publication/site/LICENSES.txt" "$DOCS_EVIDENCE/live-LICENSES.txt"
node tools/api-docs/human-specimen.mjs "$DOCS_EVIDENCE/publication" https://brooksbol.github.io/options-prototype/
```

All exit 0 plus successful deploy job establish `LIVE_VERIFIED` (or `NO_UPDATE_REQUIRED` when no relevant change). Record both SHA-256 values from provenance, version/date from the generated projection, current/deployed source, run URL, and private live report. An unavailable site or mismatching bytes is `LIVE_UNVERIFIED` / `STALE`, never success, even if Actions says success. Browser visibility alone is not byte identity. Public SHA display is unnecessary.

## 5. Persist, publish and verify the exact run

Only for an accepted update, using existing authorized persistence and CI. Inspect `git diff`, stage only explicit owned paths, commit the scoped work (skip if already committed), fetch current main, and preserve concurrent changes using the repository synchronization protocol. No force push/reset. If another actor advanced main, reconcile in isolation, rerun affected checks and rebuild from the resulting clean source; changed hashes invalidate the prior candidate identity. Then push authorized candidate commits using the established repository path (`git push origin HEAD:main` only when that is a fast-forward). If main requires PRs, use its existing governed PR process; do not change branch protections. Recheck:

```sh
git fetch origin main
git ls-remote origin refs/heads/main
git merge-base --is-ancestor "$DOCS_SOURCE" origin/main
gh run list --repo brooksbol/options-prototype --workflow api-v2-pages.yml --commit "$DOCS_SOURCE" --branch main --limit 20 --json databaseId,headSha,event,status,conclusion,url
```

Select the run whose full `headSha` is the exact candidate and event is push or workflow_dispatch; never a PR or another SHA. If none appears, repeat listing **once after 30 seconds**. If accepted input has no path-filter trigger, or the verified run history confirms no push run, dispatch the existing main workflow once **only if** `git ls-remote` still equals the verified candidate SHA:

```sh
gh workflow run api-v2-pages.yml --repo brooksbol/options-prototype --ref main
```

Record this dispatch; list again after 30 seconds and verify exact SHA. If main moved, return to reconciliation; do not dispatch an unverified newer candidate. More than one eligible run: inspect all statuses and use the newest successful run for that SHA, recording failed attempts. Set `DOCS_RUN` to the numeric ID just obtained (not a historical constant). Observe up to **30 minutes** with `gh run view "$DOCS_RUN" --repo brooksbol/options-prototype --json headSha,status,conclusion,jobs,url`, at intervals of at most 30 seconds, saving the final JSON in `DOCS_EVIDENCE`. Continue user progress updates while waiting. Require completed/success and successful build AND deploy jobs. Non-success: capture `gh run view "$DOCS_RUN" --repo brooksbol/options-prototype --log-failed` privately; apply section 6. A still-running run after 30 minutes is `DEPLOYMENT_PENDING`, not failure or success; ordinary closeout may finish with explicit unresolved status.

CI stages exactly index.html/LICENSES.txt; build permissions contents:read; deploy only pages:write/id-token:write, main-only github-pages environment, no PR deployment. Do not weaken these gates. To inspect the uploaded artifact while its one-day retention lasts:

```sh
gh run download "$DOCS_RUN" --repo brooksbol/options-prototype --name github-pages --dir "$DOCS_EVIDENCE/upload"
tar -tvf "$DOCS_EVIDENCE/upload/artifact.tar"
```

Require only two regular files (optional `./` directory entry), no symlinks or extra paths. Extract only those two named regular members to a fresh private directory after inspection and compare their hashes with local publication files. Artifact expiration is not a failed deployment: use the successful run's recorded identities, current reproducible candidate and live byte comparison; state that the historical archive was unavailable. Run section 4's live comparison/browser checks. Record a deployment as success only after this observation.

## 6. Failure handling, safe retries and final closeout

Preserve the failing command, exit/status, source/run SHA, relevant paths, logs and existing deployed identity in private temporary evidence; summarize durable facts in the existing workstream record/journal, not secrets or enormous logs. Continue all safely authorized project-memory/derived-artifact/persistence/SYNC steps. **Documentation validation, deployment or hosting failures are nonblocking for ordinary session closeout; publication remains unresolved/withheld.** Missing Product authority or provenance collisions still stop only the affected consequential action under the parent protocol.

| Condition | Required action and retry bound |
|---|---|
| Missing tools/GitHub read access or no verified baseline | `BASELINE_UNVERIFIED`; hand off bounded capability if available, otherwise record limitation. Never assert freshness. Do not change credentials/settings. |
| API-relevant acceptance ambiguous | `ACCEPTANCE_PENDING`; preserve exact missing evidence. No release hash refresh, dispatch or unaccepted publication. Escalate only the missing consequential decision, not routine closeout. |
| OAS/runtime, examples, security, allowlist, browser or reproducibility failure | `VALIDATION_FAILED`; withhold publication. Correct only within existing workstream delegation; otherwise record exact defect and next authority. Do not weaken tests/OAS or edit backend during this procedure. |
| Preview identity differs | Investigate input/history/tool changes. Refresh only by section 3 after accepted-source/review evidence; never copy hashes solely to make CI green. |
| Live differs from validated accepted bytes | `STALE`; inspect exact run and relevant source diff; use section 5 only if accepted candidate is verified and not already deploying. Never change accepted identity to match unexplained live bytes. |
| Deploy failed/cancelled, or site unavailable after successful deploy | `DEPLOYMENT_FAILED` or `LIVE_UNVERIFIED`; preserve run/logs and report nonblocking failure. No Pages/settings/permission change. Retry once only for a demonstrated transient error on the same still-current accepted SHA using `gh run rerun "$DOCS_RUN" --repo brooksbol/options-prototype --failed`, then repeat run/live checks; no blind retry loop. |
| Run pending beyond observation bound | `DEPLOYMENT_PENDING`; record run URL and latest status, final SYNC and next verification action. Do not queue another deployment. |
| Concurrent main advance | Refetch, compare paths/accepted identities and rerun affected checks from resulting clean source; preserve other actors. Stop on actual ownership/meaning collision, not mere divergence. |

Build/check steps are repeatable; choose a fresh `DOCS_EVIDENCE` directory per attempt. A deploy is not claimed idempotent by its date alone: reuse the existing exact-source run, avoid duplicate dispatch, and retain failure history. Never roll back a site or edit permissions under an ordinary freshness check.

Persist concise evidence in the closing workstream's existing delivery record/plan and journal as required by Project-Memory; update indexes/Roadmap only when their source changes require it. Include: checked source SHA and deployed SHA; acceptance reference; trigger/no-op paths and pending-work disposition; tool versions; validations/reproducibility/browser results; preview/public/license hashes; version/publication date; exact run URL/status; observed live result/time; defects/limitations and next authorized action. Temporary absolute paths alone are not durable evidence. Summarize reports before deleting temporary worktrees; do not delete anyone else's state.

After evidence-only commits/push, fetch main and verify final SYNC. Compare any intervening changes against the trigger set again. Evidence/protocol/index/journal changes alone do not require new dates or a recursive redeployment. If relevant inputs changed, rerun the affected path; if main is advancing beyond a bounded check, report last verified source and unresolved newer state rather than claim final freshness. Final report separates final accepted-main SYNC from deployed source and says `NO_UPDATE_REQUIRED`, `LIVE_VERIFIED`, or the exact unresolved status. Follow the parent's fixed Principal decision footer. A deployment failure must not be hidden by a clean Git SYNC.

## 7. Cold-start acceptance test (safe simulation before adoption)

A separate fresh-context actor receives only the immutable candidate SHA, repository location, this procedure and normal mandatory bootstrap. It may read references named here. No author transcript, expected answers, live mutation, workflow dispatch/rerun/push, issue changes, production/backend execution or secret access. Temporary worktrees/output and public/GitHub read-only queries are allowed.

Execute sections 1–4 on current accepted main/candidate, deriving versions/run/source/hashes without author-provided constants. Complete and report the no-op path. Then in a **separate disposable worktree**, add a synthetic line to `tools/api-docs/overview.md`, observe the trigger and reproduce the publication identity refusal with unchanged release metadata; do not refresh hashes or publish. Simulate unavailable hosting with a supplied local failing command (`false`, exit 1) in place of the curl command; take the section 6 failure path, write a temporary closeout summary with unresolved state, and demonstrate that ordinary evidence/SYNC reporting remains possible without claiming publication success. These are simulations, not real deployment-failure evidence. Also walk the acceptance-pending branch without dispatch. Report ambiguity/missing prerequisites and exact commands/results. An independently reviewed procedure and a successful cold-start test precede adoption; neither is a substitute for Principal authority.
