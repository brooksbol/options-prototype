# PL-CONV-01 Step 3 — Accepted multi-broker Account delivery

October 11, 2026. **Current disposition: Principal ACCEPTED Step 3 and separately accepted the BUG-035 correction after ordinary installed CLI testing. BUG-035 is Resolved.** The accepted frozen implementation is operationally deployed. Earlier preview rejection, abort, correction and retry records below remain historical provenance. Codex acted as authorized Implementation Engineer; a separate Codex actor independently verified the candidate. The Principal selected actual tastytrade nickname `tt1`.

## Authority and candidate identity

Bootstrap followed `AGENTS.md` → `docs/README.md` → current Codex bootstrap, failure modes, project-memory protocol, execution contract and Principal Decision Surface. Relevant principles, API v2 guardrails, Account/OAS/authorization contracts, roadmaps, canonical parking-lot/journal and both defect records were acquired. Gate Experiment 001 remains STAGED, `experiment_started: false`, mutation permission INACTIVE; no activated experimental gate is asserted. BUG-036's durable resolved record and accepted baseline were verified, not inferred from the assignment.

- Implementation baseline: `ebbbf8d398fdfc43fe1a39ece83411bc525590fa`.
- Candidate-era verified/synchronized main: `a5ff4da71e650f93cb9a2944abf77f73422b0eee` (including earlier `83d8bd32e99fc4d3d0eb304e7d130485c4bb62ea`). Intervening changes are CONV-WEB planning/intake documentation only; they do not change candidate source or authorize web implementation. Concurrent canonical text and this candidate's appended reconciliation were both preserved without stash or branch creation.
- Frozen 13-file source/API/test overlay: `evidence-service-java/build/step3/source-candidate.tar.gz`.
- Archive SHA256: `c8f277b4dcf3e3dc2d7888449d73493a2e9d8baf6e337791d3be58d07f370fc9`.
- Exact file hashes: adjacent `source-manifest.json`. Independent verification checked the archive and every overlay hash, then materialized baseline plus overlay in a disposable copy.
- Original submission was uncommitted and undeployed; subsequent deployment and explicit acceptance are recorded below. Closeout preserves the frozen source identity and unrelated local research.

Governing authority: `docs/principles.md` (including ratified `PRIN-ARCH-BACKEND-AUTHORITY`), `docs/77-api-v2-architectural-guardrails.md`, `docs/parking-lot-10.md` (`PL-CONV-01`), `docs/foundations/technology-quality-constitution-v1.md`, `docs/foundations/principal-decision-surface.md`, and canonical BUG-035/BUG-036 records. This delivery creates no new architectural principle or roadmap Bet.

## Implemented capability

The backend persists one brokerage per Account, initially `FIDELITY` or `TASTYTRADE`. Canonical `acct_` IDs, identity namespaces, backend nicknames, display metadata and Account-specific grants remain authoritative. Native references remain exact strings, including leading zeros and case. Identity lookup is `(broker, broker_account)`; identical references across brokerages are distinct. Re-registering a pair is idempotent; a nickname cannot rebind to another pair; stale bootstrap aliases do not undo a persisted rename. Legacy private `alias=reference` means Fidelity; explicit `alias=TASTYTRADE:reference` supports the second brokerage. There is no public registration endpoint or client registry.

Migration 018 runs through DatabaseManager's existing transaction mechanism. It replaces global reference uniqueness with broker-scoped uniqueness, backfills old Accounts as Fidelity, and preserves Account/grant rows while rebuilding the constrained tables. Evidence, snapshots, Position identities and originals are not rewritten. An injected failure after removing the grant table rolls back successfully.

Existing `/v2/accounts` collection/instance resources expose persisted brokerage association; the OAS broker enum admits both values. Existing response envelopes, correlation/errors, grant filtering, object authorization and private/no-store behavior are reused. No `/v2/brokerages` is introduced.

Fidelity source resolution is explicitly brokerage-qualified. Original disclosure still requires established complete scope and grants for every represented Account; unknown scope fails closed. Fidelity processing rejects tastytrade targets after retaining originals, without erasing previously admitted evidence. No tastytrade Position support is claimed.

CLI discovery uses backend nicknames and displays the correct brokerage. Missing-nickname guidance suggests `ww ls accounts`. Tastytrade sync reports unsupported capability before Downloads inventory. **BUG-035 separately:** default terminal table, forced table and redirected/default/explicit TSV mask account numbers; valid references longer than four expose only the final four behind `****`, while short/missing/malformed/non-string values expose no suffix. Existing columns and nicknames remain usable. Existing explicit JSONL and API payload disclosure policy are unchanged; no new unmasked mode is introduced.

## Changed-file inventory

Frozen source/API/test files (paths under repository root):

| Area | Files |
|---|---|
| Domain / attribution | `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountDirectory.java`, `BrokerageArtifacts.java` in the same directory |
| Persistence | `evidence-service-java/src/main/java/com/wheelwright/evidence/db/DatabaseManager.java`; `evidence-service-java/src/main/resources/db/migrations/018_broker_scoped_accounts.sql` |
| API | `docs/contracts/api-v2-account-evidence.json` |
| CLI | `scripts/ww-accounts.mjs`, `scripts/ww-sync.mjs` |
| Backend verification | `evidence-service-java/src/test/java/com/wheelwright/evidence/v2/AccountsTest.java`, `TestAuthentication.java`, `BrokerScopedMigrationTest.java`, `MultiBrokerAccountsTest.java` |
| CLI verification | `scripts/ww-accounts.test.mjs`, `scripts/ww-account-confidentiality.test.mjs` |

Candidate reconciliation additionally updates this record, `docs/README.md`, `docs/cli/ww-account-evidence.md`, canonical BUG-035, `docs/parking-lot-10.md`, `docs/journal/project-journal-5.md` and their generated roadmap projection. Those documentation changes are outside the frozen 13-file overlay.

## Verification evidence

| Verification | Actual result |
|---|---|
| Author backend v2 + database suites | 258 tests, zero failures/errors/skips |
| Independent frozen backend plus two adversarial probes | 260 tests, zero failures/errors/skips |
| Account/sync/Position/OAS/confidentiality CLI suites | 14 passed, zero failed; includes nine accepted regressions and three separate BUG-035 tests |
| Independent actual CLI masking processes | 21 passed, zero failed |
| Spring Boot executable packaging | `bootJar` succeeded |
| Retained original hashes / foreign keys | 315 originals; zero mismatches; zero FK violations in original and migrated copy |

Author commands:

```sh
cd evidence-service-java
./gradlew test --tests 'com.wheelwright.evidence.v2.*' --tests 'com.wheelwright.evidence.db.*'
./gradlew bootJar
cd ..
node --test scripts/ww-accounts.test.mjs scripts/ww-sync.test.mjs scripts/ww-positions.test.mjs scripts/ww-account-confidentiality.test.mjs
```

An early focused run failed seven fixture-dependent tests because a shared test fixture inserted five unnamed columns into the new six-column Account table. The fixture was corrected; all final counts above pass. No remaining test failure is suppressed.

Independent challenges covered pair collisions, exact native case/zeros, restart/rename/stale bootstrap, rename collision atomicity, authorization including administrator non-bypass, Fidelity-only attribution, mixed/single source disclosure grants, BUG-036 padded/unknown scope, trailing sections and invalid UTF-8, unsupported processing retention, migration rollback, and malformed disclosure. Both Step 3 and the separate BUG-035 correction received **ACCEPT** for the exact frozen candidate. Review report: `evidence-service-java/build/step3/independent-verification.md` (local ignored verification artifact). Principal acceptance and defect closure are not inferred.

## Retained compatibility and operational boundary

The operational database was inspected read-only and copied for migration/runtime verification. Independent comparison confirms all existing 315 originals, 317 imports, 19,160 evidence rows, 1,177 ledger observations and 28 Position snapshots identical; existing Users, Account metadata/IDs/namespaces and grants remain intact. Actual candidate-code scope survey: 311 established scopes, four fail-closed scopes, zero wrong-broker scopes and zero established scopes missing their owner. The same four originals were already unmapped; the migration does not invent authorization. Originals were neither reprocessed nor mutated.

A loopback-only preview at `http://127.0.0.1:3102` uses the migrated copy, actual v2 controllers and existing authentication. It has no acquisition worker. The privately verified actual tastytrade reference was registered as `tt1` **only in that copy**, with an explicit metadata-read grant. Operational database, Account registration, grants, private configuration and service remain unchanged. Preview discovery shows authorized PTS/Sawdust Fidelity and `tt1` tastytrade, all masked. Existing CLI Position reads return 25 PTS and seven Sawdust Positions. Actual Fidelity synchronization was not invoked against retained evidence; its accepted path is covered by regression tests.

Local verification artifacts are under `evidence-service-java/build/step3/`, including `retained-compatibility.json`, `migration-compatibility.json`, `independent-compatibility.json` and masked CLI captures. Private helper inputs, tokens and full references are excluded from Git and this record. These results distinguish disposable migration/runtime evidence from live deployment verification.

## Operator acceptance — regenerated without environment setup

The Principal rejected the previous procedure because it required an exported backend URL. This replacement uses only the installed `ww` command and its ordinary existing configuration. **No exports, inline environment assignments, alternate endpoints, private configuration edits, test wrappers or GUID entry are part of acceptance.** Preparing a deployment is separate from running this plan and is not authorized by this document.

**Readiness observed October 11:** ordinary `ww ls accounts --table` succeeded with masked Fidelity `pts` and `sawdust`, but **no `tt1`**. Therefore the multi-broker milestone is currently **NOT READY for acceptance on the normal connection**. The isolated preview is technical evidence only. Do not substitute its results for a missing normal-backend Account.

### 1. Normal discovery and default human presentation

Run in the ordinary terminal:

```sh
ww ls accounts
```

PASS: authorized `pts` and `sawdust` show Fidelity; Principal-selected `tt1` shows tastytrade (backend code `TASTYTRADE` is acceptable). Nicknames are usable without resolving/copying an ID. Each Account number is masked, exposing at most its final four characters. No full number appears. Other legitimate authorized Accounts may appear; unrelated unauthorized Accounts must not appear. Missing `tt1`, wrong brokerage, duplicate identity or any full number is FAIL. Stop acceptance if this readiness check fails.

### 2. Forced table — separate BUG-035 check

```sh
ww ls accounts --table
```

PASS: the same authorized Accounts and correct brokerages appear; all number cells are masked. Nicknames and ordinary columns remain legible.

### 3. Redirected default and explicit TSV — separate BUG-035 checks

```sh
ww ls accounts > /tmp/wheelwright-step3-default.tsv
cat /tmp/wheelwright-step3-default.tsv
ww ls accounts --tsv > /tmp/wheelwright-step3-explicit.tsv
cat /tmp/wheelwright-step3-explicit.tsv
```

PASS: both files contain authorized nicknames and correct brokerages, with masked Account-number cells. Neither contains full native references. Do not use JSONL for this human-presentation acceptance; its existing disclosure policy is outside BUG-035 remediation. Short/missing/malformed-reference behavior is established separately by dedicated regression/independent process evidence; the Operator need not create fake Accounts.

### 4. Existing Fidelity Position inspection

```sh
ww show positions --account pts
ww show positions --account sawdust
```

PASS: both resolve through nicknames and show existing backend Positions and provenance without permission errors or missing prior evidence. The last verified retained baseline was 25 PTS and seven Sawdust Positions; compare against the actual pre-delivery state if legitimate later observations changed it. Do not treat an expected count as proof of evidence preservation.

### 5. Tastytrade capability boundary

```sh
ww sync account tt1
```

PASS: an intentional nonzero exit with clear Fidelity-only/unsupported tastytrade CSV synchronization guidance. It must resolve `tt1`, then stop before Downloads scanning/upload/processing. “Unknown account” is FAIL, not unsupported-capability success. No tastytrade Position support is implied.

### 6. Unavailable nickname guidance

```sh
ww show positions --account __step3_unavailable__
```

PASS: a nonzero exit with useful unavailable-nickname guidance suggesting `ww ls accounts`, without asking for a GUID. This string is only a negative selection specimen, never a registration instruction.

### 7. Accepted Fidelity synchronization loop

Using the Operator's ordinary Downloads and intended existing Fidelity synchronization workflow:

```sh
ww sync account pts
ww show positions --account pts
```

PASS: Fidelity discovery/retention/processing still works, repeat content is not duplicated, prior successful evidence remains available, and Position inspection still resolves `pts`. This is the normal mutating synchronization operation, not a read-only compatibility survey. If genuinely new files are present, record the expected processing outcome; do not demand unchanged Position counts or zero uploads. In an unchanged, already processed Downloads set, expect no new uploads/processing and successful completion. Do not rerun historical retained evidence merely for acceptance.

### 8. Principal disposition

Record Step 3 and BUG-035 outcomes separately, with the ordinary command outputs and any failure. Both require Principal acceptance; independent technical ACCEPT does not supply it. A failed prerequisite or command leaves the applicable outcome unaccepted. Source-level collision, grants, migration rollback, malformed-value and BUG-036 security evidence remain linked above; the Operator is not required to inspect databases, create users or enter canonical IDs to repeat those engineering checks.

No operational deployment/restart, registration, grant/configuration change or implementation retry was performed while regenerating this plan.

## Principal-supplied ordinary-command results

The Principal subsequently supplied terminal results using ordinary installed commands, without environment setup:

- Default and forced tables: `pts` and `sawdust`, correct Fidelity brokerage, masked Account numbers; `tt1` absent.
- Redirected default and explicit TSV: same two nicknames with masked number cells.
- Position reads: 25 PTS and seven Sawdust Positions, with retained snapshot/artifact provenance.
- PTS sync: 513 CSVs found, 244 supported, 244 already processed; zero pending, uploads, processing or failures; `SYNC COMPLETE`.
- Subsequent PTS inspection: still 25 Positions and the same reported snapshot/artifact provenance.

These are direct Operator observations supporting BUG-035 presentation and Fidelity continuity, not an explicit acceptance/defect-closeout instruction. Step 3 multi-broker discovery still fails because `tt1` is missing. No tastytrade unsupported-sync result was supplied. Candidate registration/migration remains confined to the isolated preview; the normal backend was not deployed by this workstream. Operational deployment/restart and actual backend registration require the separate authority excluded from automatic implementation authorization.

## Disposition and next boundary

**Acceptance REJECTED:** the submitted preview procedure requires environment setup. **BLOCKER:** normal installed CLI acceptance has not been established; the operational backend remains unchanged. Independent technical ACCEPT does not override this Product disposition. **DEFER:** API full-number disclosure capability, automatic brokerage enumeration, tastytrade Position admission (Step 5), XLE reconciliation (Step 4), later governed reconsideration and Web/CLI convergence. No architectural Principal decision is outstanding. BUG-035 remains Open until separate Principal acceptance and applicable defect closeout. The overall PL-CONV-01 intake and Step 3 are not declared complete by author/verifier success.

Further operational migration, registration, deployment/restart, commit/push promotion and defect closure have not been performed. Return this frozen candidate and its evidence for Principal acceptance; preserve the six-step sequence and protected trading clients.

CURRENT STATE: Principal acceptance REJECTED; no environment variables permitted in acceptance testing; BUG-035 Open; not deployed.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: NONE


## Authorized operational deployment — aborted; recovery verified

The Principal separately authorized the previously reconciled deployment/recovery plan, retaining acceptance-before-commit and explicit abort conditions. Candidate archive/all13 hashes were reverified. Candidate and accepted pre-Step-3 recovery JARs built in isolated copies; full-application disposable rehearsals verified recovery Fidelity discovery/25-and-seven Position reads and candidate migration/tt1 metadata access. Effective runtime configuration and the real native tastytrade reference were privately verified and preserved. No candidate implementation changed.

After stopping only operational v2 PID3559, the final post-shutdown SQLite backup failed with `OperationalError: unable to open database file`. **Deployment aborted before migration018, tt1 registration or grant changes.** The incomplete zero-byte backup is explicitly quarantined as invalid. An automatic recovery guard initially saw the failed deploy script's own open database connection; after that script exited, no holder remained. No live database was overwritten and no schema reversal was attempted.

The verified accepted pre-Step-3 recovery executable was started as PID95678 on the normal v2 connection with the prior effective configuration. This is a recovery restart, not a successful Step3 deployment. The operational database remained at017 with two Accounts and existing grants. No final-backup restore was needed because migration/registration had not begun. The original running JVM's byte identity was not claimed: recovery uses the separately built and rehearsed accepted baseline.

Recovery Fidelity synchronization found and admitted one genuinely new History download:244 previous processed inputs became245, one upload/process and zero failures. **All315 previous originals and all prior retained rows remain unchanged; current originals316**, zero hash mismatches/FK violations, unchanged Account identities/namespaces/User grants and Position snapshots, PTS25/Sawdustseven. Four unknown-scope originals deny retrieval; known authorized original retrieval passes its hash check. Recovery status reports NON_TRADING_DAY/session_blocked, zero acquisition cycles and zero symbols acquired. V1 backend PID86196 and Vite PID86213 remain unchanged; tt live was not modified. Temporary rehearsal servers are stopped.

Frozen candidate SHA256 remains `c8f277b4dcf3e3dc2d7888449d73493a2e9d8baf6e337791d3be58d07f370fc9`. Built candidate JAR SHA256: `9f61545b1184c04758c7d5b84761001567384b01682f48e0e5d99ad2248f9463`; operational recovery JAR SHA256: `843b1e13d87f96408dd9957caf7214889382bead34a9c8e1981a2ed7c6144ad3`. Protected recovery inputs, preflight backup and incident evidence reside locally under `/Users/bollich/.local/share/wheelwright/pl-conv-01-step3/`; private configuration is excluded from Git. No deployment retry, source modification, commit, push, BUG035 closure or Step4 work followed the abort. Step3 remains unaccepted and ordinary tt1 discovery remains unavailable. Final-backup handling requires diagnosis/rehearsal before any separately authorized retry; this record does not authorize it.


## October 11, 2026 — Authorized deployment retry succeeds; Operator acceptance pending

The Principal accepted the bounded WAL backup-harness correction and explicitly selected Option A for one operational deployment retry. This supersedes the prior aborted/undeployed state, without changing the frozen implementation or authorizing commit/push, defect closure or Step4.

Fresh preflight verified the frozen archive/all13 source hashes, candidate/recovery JARs, effective running configuration, all eight existing Account capabilities, actual native tastytrade reference privately, exclusive v2 database holder, protected service topology and zero pending Fidelity Downloads. A fresh live recovery copy and disposable restoration both passed integrity, FK and316-original hash/data comparisons. Only v2 PID95678 stopped; the corrected final backup succeeded. Migration018 applied exactly once; `tt1` registered with the verified native reference and only its intended Account-read capability. All previous Account IDs, aliases, identity namespaces, User grants, retained rows and snapshots remain unchanged.

The exact verified candidate JAR now runs operationally as PID8198 through the ordinary installed `ww` connection. Candidate archive SHA256 remains `c8f277b4dcf3e3dc2d7888449d73493a2e9d8baf6e337791d3be58d07f370fc9`; deployed JAR SHA256 `9f61545b1184c04758c7d5b84761001567384b01682f48e0e5d99ad2248f9463`. Recovery JAR SHA256 remains `843b1e13d87f96408dd9957caf7214889382bead34a9c8e1981a2ed7c6144ad3`; verified final pre-migration backup and complete previous configuration remain protected in the local release directory.

Engineering exercised ordinary installed `ww ls accounts` (actual terminal default), `--table`, `--tsv`, redirected default, PTS/Sawdust Position reads, PTS sync and tt1 sync without connection overrides. All passed: pts/sawdust/tt1 discoverable with correct brokerage and masked references;25/seven Fidelity Positions; PTS sync zero uploads/processes/failures; tt1 unsupported before Downloads scanning. All316 original hashes match, zero FK violations, integrity ok. Source scopes312 established/four fail-closed, zero wrong brokerage; all four unknown originals deny disclosure and known authorized original retrieval matches its retained hash. TT Position/artifact reads without those grants deny access; unauthenticated Account collection denies access; Account responses retain private/no-store.

No abort, rollback or implementation deviation occurred. V1 backend PID86196 and Vite PID86213 unchanged; tt live unchanged. Acquisition remains NON_TRADING_DAY/session_blocked with zero cycles and zero symbols acquired. Local evidence: `/Users/bollich/.local/share/wheelwright/pl-conv-01-step3/deployment-result.json`, `post-smoke-integrity.json`, `operational-scopes.json`, `retry-preflight.json`, protected CLI outputs and final backup. No full application regression campaign repeated.

**Current state: operational candidate deployed; Principal Operator acceptance pending; BUG-035 Open.** No commit/push/Step4. Acceptance uses only ordinary installed commands and nicknames, with no environment variables, internal service selection, credential or GUID entry.


## October 11, 2026 — Principal acceptance and bounded closeout

The Principal ran the ordinary installed acceptance commands without environment setup and supplied all outputs. Default/forced tables and explicit/default redirected TSV show Fidelity pts/sawdust plus tastytrade tt1 with masked Account references. PTS/Sawdust retain25/seven Positions and the same reported snapshot/artifact provenance. PTS sync found515 CSVs,245 supported/already processed,270 unrelated, zero pending/uploaded/processed/failed and SYNC COMPLETE. TT sync gave the expected unsupported capability guidance before scanning. These are direct Operator observations, separate from engineering and independent verification.

The Principal explicitly selected **A — Accept Step3 and the BUG035 correction**. Step3 is accepted and its bounded milestone complete; BUG035 is independently Resolved in its canonical record/index. BUG036 remains Resolved/protected. The larger PL-CONV-01 intake remains ongoing; Step4 XLE is next in the approved sequence but is not implemented or newly authorized by acceptance. Tastytrade Position evidence remains unsupported.

Closeout persists only the accepted source/API/tests and scope-preserving documentation/projection. Accepted source files remain identical to the independently reviewed archive; no operational restart or data mutation is required for this closeout. Complete private recovery configuration, final backup and release hashes remain outside Git. Full original Account references and credentials are excluded from reports/commits.
