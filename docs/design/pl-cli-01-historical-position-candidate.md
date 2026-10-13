# PL-CLI-01 — Accepted historical Position observation reads

**State:** Principal accepted the bounded capability and compact presentation on October 12, 2026. Broader PL-CLI-01 remains ongoing; portfolio-value-history discovery remains unresolved. PL-CONV-01 Step 6 remains unstarted and unauthorized.

## Accepted public contract

Existing operation `readAccountPositions` supports exactly:

- `GET /v2/positions` with optional `accountId`: unchanged latest selection.
- `GET /v2/positions?view=observations` with optional `accountId`: complete authorized retained observation catalog.
- `GET /v2/positions?accountId=ID&snapshotId=ID`: exactly one Account-scoped selected observation in the existing PositionCollection.

Unknown, repeated, blank, unsupported or incompatible parameters and nonempty GET bodies are 422 after applicable authentication and explicit Account authorization. Unauthorized explicit Accounts are 403. Foreign and absent snapshot IDs under an authorized Account are indistinguishable 404 responses; there is no global snapshot lookup. Known authorized Account with no observations returns 200 empty catalog. Existing correlation, Problem grammar and private/no-store headers remain.

Model A `account.positions.read:ID` grants govern both read forms. users.admin grants no financial access. Original-artifact disclosure remains separately authorized and fail-closed for unknown or mixed source scope. Reads perform no acquisition. No persistence redesign/migration, predecessor/as-of selection, lifecycle reconciliation or historical valuation is introduced.

Catalog summaries retain Account/snapshot identity, source file/hash/artifact, holding count, evidence date, recordedAt, acquisition provenance where available, observationContext and qualifications. Ordering is Account ASC, evidenceDate DESC, recordedAt DESC, snapshotId DESC: display order, not established brokerage chronology. One committed read view is returned completely; cumulative payload over 32 MiB or more than 10,000 entries causes whole-request 503, never silent truncation.

Fidelity dates are export days; tastytrade dates are UTC response-receipt days. Both have DAY precision. Acquisition, recording and evidence clocks remain qualified separately. All Position reads add observationContext and evaluationBasis INSPECTION_TIME. DTE uses inspection time. Later-retained same-day Fidelity enrichment has separate provenance. Retained inventory is not historical knowledge replay, Account NAV, managed continuity or evidence of the transactions that caused differences. Contract/custody identity, adjusted roots and signed/fractional quantities remain exact. Snapshot associations count constituents once.

## Operator surface

```
ww ls position-observations --account ACCOUNT [--table | --tsv | --jsonl] [--verbose] [--no-color]
ww show positions --account ACCOUNT [--snapshot SNAPSHOT_ID] [--verbose | --jsonl | --table] [--no-color]
```

Nicknames resolve through backend-authorized Account discovery. Discovery defaults to aligned terminal records and redirected 13-field TSV; JSONL is one complete summary per line. Full catalog IDs remain visible. Selected/default Position JSONL retains complete backend fields and qualifications. Human Position defaults are compact inventory records with Account/broker/evidence date, custody where meaningful, signed quantity, DTE(today), reported values/unknowns and past-expiry uncertainty. Additional fields, selected full snapshot IDs, constituents, provenance and qualifications are opt-in via --verbose. Sparse CONV-UX colors and all three color opt-outs remain. Usage errors exit 2, request failures 1, successful empty reads/catalogs 0. Help and ww manual document the limits.

## Acceptance, verification and rejected presentation

Original frozen candidate PL-CLI-01-history-49431da31685:
- Baseline a7702f58227d4266c8367e40cb28a4420b565ba5; patch SHA256 49431da3168544585572c2b1fa57bcc02aea5046c5b417f6b35c826a6aca4b0c.
- JAR SHA256 6c963b632a37df96fbd97e4e16466beda625a710fbbbe028abf19b125bd2a3ca.
- Author verification: full backend 816 tests, zero failures, one skip; final affected v2 152 passing; CLI 98 passing; OAS validation and public Unix composition passed.
- First Kiro review INCOMPLETE because shell execution failed; it was not counted as acceptance. Subsequent independent verification ACCEPT: all 182 package checksums, 1147 source hashes/archive files and 15 changed-file hashes/modes; independently reconstructed baseline plus patch; 33 backend tests, three reviewer falsifiers, 16 CLI tests, real HTTP/PTY checks and public ww/jq/sort/diff comparison passed. The bounded independent report is preserved beside this record.
- Principal separately authorized deployment, then REJECTED human usability: three inventory rows followed by roughly fifteen lines of repeated prose. Technical conformance had failed to expose a Product usability problem. That rejection remains historical evidence despite later acceptance.

Principal authorized presentation remediation. Candidate PL-CLI-01-history-ux-a1fc0e47b678 changes only human rendering, help/manual and affected tests. Parent backend/OAS/authorization/persistence and machine formats remain byte-identical. Presentation patch SHA256 a1fc0e47b6788991c4670ccada5d9e5ca4c57cdea6225cfd99809a0cfe3b49d1. All 100 CLI tests, real PTY default/history/verbose/catalog/empty and color-opt-out checks pass; identical backend inputs produce byte-identical JSONL/TSV. No new independent Product review of this presentation candidate is claimed. The Principal exercised the supplied acceptance commands, said the tests were fine, then explicitly accepted the bounded delivery as-is while requiring the broader gap to be reported. Future independent review must judge usability as well as correctness; preserve the standing PL-CLI-01 / CONV-UX guidance.

## Operational state and recovery

The exact verified JAR is installed on existing v2 port3101 at `~/.local/share/wheelwright/pl-cli-01-history/operational-49431da31685/candidate.jar`, using the existing database, credentials/grants and backend config. Discovery exposes PTS15, Sawdust13, tastytrade2 retained observations. Deployment rehearsed all30 exact selections, unchanged latest reads, financial-table/grant/artifact preservation and recovery with the accepted Step5 binary. An initially overstrict comparison flagged UniverseLoader's pre-existing startup imported_at refresh; this was identified and qualified, not suppressed as an inventory change. No migration or new brokerage evidence acquisition occurred. v1 Web, standalone tt and unrelated work remained protected.

Accepted compact client is now installed at `~/.local/share/wheelwright/pl-cli-01-history/operational-ux-a1fc0e47b678/client/scripts/ww`; ordinary installed discovery, historical selection and compact tt1 output passed. This client promotion used unchanged Wheelwright-only configuration and no backend restart. The parent CLI remains available at the prior historical release path. Existing operational database backup is `operational-49431da31685/pre-deployment.sqlite3`; prior accepted Step5 executable/environment and recovery rehearsal inputs remain private under their existing release. Recovery of this presentation uses the saved prior ww symlink target; it does not require restoring a database. Backend recovery requires separately authorized stop/start with the verified previous binary/environment, preserving current evidence; do not restore old copies over a running service. Credentials, private transcripts, database copies and binary releases remain outside Git.

## Unresolved gap: PTS portfolio value history

The Principal requested a text graph of PTS portfolio value history using public ww and Unix primitives. Current reads expose holdings observations, not an authoritative Account-value series; excluding cash/non-position rows prevents presenting their sum as complete portfolio value. This establishes a public-capability limitation, not absence of retained balance/value evidence elsewhere.

Discovery failed to adequately use the existing v1 Console and its CSV prototype. The inspected `wheelwright-positions-2026-10-12 (1).csv` exposes managed BW/PUT rows, capital, premium/assignment consequences, opening dates, quote/Greek freshness and unencumbered shares with quantity/current value/basis/free lots. Earlier dated exports exist. Its Capital and Current value fields are not automatically Account NAV. Historical completeness, valuation meaning, underlying retained balances and the smallest backend/public projection remain UNVERIFIED. Do not silently inherit v1 client-owned financial semantics into v2.

Proposed bounded follow-up: trace the v1 export to authoritative inputs, establish the requested value measure and historical coverage, then identify the smallest public capability. Principal accepted the delivered holdings primitive and asked that this gap be reported; closeout does not authorize new value-history implementation, a new persistence engine, another PL identity or Step6.

## Session closeout verification

Fresh isolated closeout verification passed: all 152 v2 backend tests, all 100 CLI tests and 147 Roadmap parser/integrity/freshness tests. The executable rebuilt from the accepted source is byte-identical to the independently verified/deployed JAR (SHA256 above). Canonical PL-CLI-01 state and append-only journal why-state were reconciled; the Roadmap projection was regenerated and its freshness check passed. Coming Soon required no horizon change. The accepted compact CLI was promoted and ordinary installed reads verified without backend restart. Concurrent Kiro work remained outside this isolated commit. Earlier frozen artifacts and their identities were not rewritten.
