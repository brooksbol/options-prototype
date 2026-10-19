# SWIT — Implementation and operational witnesses (time-qualified)

Classification: internal, redacted, non-normative survey evidence. Not authority.

- Prepared by: Kiro, directly. This replaces the lost "C" code ledger from the earlier session.
- Source baseline: main `d03d8d1`. Runtime observations were taken at **2026-10-18T23:32Z**.
- Each fact is tagged with an evidence type: `[source]`, `[db]` (applied database state, queried read-only), `[fs]` (installed filesystem), `[proc]` (running process), `[http]` (live health endpoint), `[doc]` (claim in a document).
- Home paths are written as `~`.

## A. Capability → component (source)

| Capability | Component | Evidence | Notes |
|---|---|---|---|
| v1 evidence appliance (acquisition, session gate, snapshot) | `evidence-service-java/src/main/java/com/wheelwright/evidence/` (`AcquisitionWorker`, `SessionGate`, `SessionClassifier`, `RequestPacer`, `SnapshotController`, `StatusController`) | [source] | `RequestPacer` uses the 119-starts-per-trailing-60s single-flight controller (`RequestPacer.java:12-13`, per SN1). Steering still says 0.9 req/sec. |
| v1 governed decision / context (ADR-019/021) | `GovernedDecisionController`, `GovernedContextController`; migrations 010, 011 | [source] | The Disposition role is "defined-but-unused" (ADR-019 implementation note, [doc]). |
| Option obligation continuity (ADR-022) | `/api/continuity/*`; migrations 012, 013 | [source] | |
| v2 API | package `…/evidence/v2/`. 13 distinct `/v2/*` paths: accounts, account transactions (list and item), artifacts, market-evidence-subjects, me, portfolio-capital-observations, position-acquisitions, positions, quotes, quotes/{symbol}, users, users/{userId} | [source] | Introduced by `afcb13e` on 2026-10-05 (POST /v2/quotes). Bearer authentication; Users/Accounts grants (Doc 77 Model A). |
| v2 OAS / wire contracts | `docs/contracts/api-v2-account-evidence.json`, `api-v2-market-evidence-subjects.json`, `api-v2-direct-quote-acquisition-proposal.yaml/.md` | [source] | The only CI is `.github/workflows/api-v2-pages.yml` (added `3ae78b8`, 2026-10-15). It publishes docs and enforces nothing on the build. |
| v1 frozen snapshot contract | `docs/contracts/evidence-snapshot-v1.md` | [doc] | ETag `"gen-<N>"`. |
| Decision engines (browser-placed, PL-ARCH-06) | `options-prototype/src/` (`write-desk`, `operator-console`, `governed-decision`, `velvet-rope`, `production`, `forecast`, `kreature` …) | [source] | Velvet Rope code exists in source and is consumed by Deployment (SJ2, SPL1). Steering says it is "designed, not live". |
| `tt` CLI | `scripts/tt` → `scripts/tastytrade*.mjs` (Node) | [source][fs] | Runs from the working tree, not from a release. Transitional UX prototype, not a v2 authority precedent ([doc] journal-5:1919). |
| `ww` CLI | Installed client `client/scripts/ww` inside a release lineage | [fs] | Node. The language gate was reopened and never visibly closed (SPL3, SN2). |

## B. Compatibility surfaces

- v1 HTTP is under `/api/*`:
  - 35 mappings in source, including snapshot, quotes, history, market-metrics, monitored, timesales, status, health, refresh, observe, governed-context/decision, continuity, opportunity-history, production/assess, measurement, and the artifacts/imports mappings.
  - `POST /api/evidence/refresh` forces a one-shot acquisition that bypasses the session gate (PL-OPS-08/09). Steering still calls it a "Nudge".
- v2 HTTP: 16 mappings over 13 paths. OAS JSON is in `docs/contracts/`.
- CLI surfaces (from SJ5/SPL3/SN2 [doc]):
  - `ww fetch`: exit codes 0/1/2. Bare `ww fetch` was a usage error on 10-05 and became the backend default-subject union on 10-15.
  - `ww ls quotes`: TSV with no header when redirected; `--tsv` does nothing.
  - `ww show --sort-by` and `--where`.
  - `ww refresh` was retired with no alias.
  - `ww positions` keeps a compatibility alias.
  - Acceptance gate: `ww pull && ww history`.
- Input formats: Fidelity Option Summary, Positions and Activity CSV imports (`/{artifact}/imports`), and tastytrade JSON. These are compatibility surfaces in the D2 sense. No versioned input-format contract was found.

## C. Data and migrations

- Source migrations: `evidence-service-java/src/main/resources/db/migrations/001…020` [source]. Migration 001 was added in `22870b7` (2026-07-20). The ledger table is `_migrations(id, applied_at)` (`DatabaseManager.java:46`).
- v1 `data/evidence.sqlite3` (1,758,580,736 bytes) [db] has **21 applied ids**: 001–020 plus **`002_priorities.sql`, applied 2026-07-20T19:15:55Z**.
  - `git log --all -- '**/002_priorities.sql'` returns nothing. That applied migration has **no source in Git history**, so its schema effect is "version unknown".
- v2 `data/positions-v2.sqlite3` (22,671,360 bytes) [db] has 001–020 applied between 2026-10-11 and 2026-10-15 (020 at 2026-10-15T21:37Z).
- v1 applied 015–019 on 2026-10-12 and 020 on 2026-10-16. Both databases share one migration chain, so v2-era schema (accounts, users, transactions) is also present in the v1 database. Whether that is intended is not established.
- Untracked backups in `data/`, by name and size only: `positions-v2-before-scoped-import` (15.7 MB), `positions-v2.before-canonical` (13.4 MB), `positions-v2.before-user` (15.7 MB).

## D. Installed / operational landscape (observed 2026-10-18T23:32Z)

- `:3100` v1 [proc]: pid 76244, started Fri Oct 16 11:12. It is `gradlew bootRun` from the **working tree**, `build/classes`. Its source version is whatever the tree was at Oct 16 11:12, with no recorded SHA, so **version unknown**. `GET /api/health` returns `{"status":"up"}` [http].
- `:3101` v2 [proc]: pid 78967, started Thu Oct 15 15:41. It is `java -jar ~/.local/share/wheelwright/pl-cli-01-update/operational-20261015-r2/candidate.jar` with `--server.port=3101`, `--evidence.db.path=~/kiro/options/data/positions-v2.sqlite3`, a universe seed under `~/.local/share/wheelwright/…` and history read-through enabled. Health is `{"status":"up"}` [http].
- `:5173` Vite dev server [proc]: pid 76241, started Oct 16.
- `ww` resolves to `~/.local/share/wheelwright/pl-cli-01-positions/operational-20261015-3de8dce/client/scripts/ww` [fs]. `tt` resolves to `~/kiro/options/scripts/tt` (working tree) [fs].
- Release lineages in `~/.local/share/wheelwright/` [fs]:
  - `pl-cli-01-history` (2 operational dirs)
  - `pl-cli-01-positions` (1dec8ab, 3de8dce, 9843296)
  - `pl-cli-01-update` (r1, r2)
  - `pl-conv-01-step3`
  - `pl-conv-01-step5`
  - `proposal-revisions`
  - `workspace-reset-20261013`
- Deploy and recovery tooling outside Git [fs], in `pl-conv-01-step3/`:
  - `deploy.py` (plus `.before-wal-correction`), `DeploymentOps.java`, `integrity.py` (plus `.before-wal-correction`)
  - `backup-harness-rehearsal.py`, `candidate-rehearsal.py`, `candidate.jar`
  - deployment event, incident and result JSON
  - `failed-final-backup-incomplete.sqlite3`
  - `independent-verification.md`
- No version or build-info endpoint exists in source [source]. A grep for `/version` and `BuildProperties` finds only an unrelated hit in `GovernedContextController`.

## E. Verification witnesses

- Test-annotation counts [source], not executed:
  - Java: 844 `@Test` occurrences. Steering says "173+", and BUG-042 reports a v2 suite of 177.
  - Frontend: 2,173 `it(`/`test(` occurrences. Steering says "1112+".
- CI: only the API v2 Pages publication workflow. ArchUnit was approved but is not installed (SFND2 E037).
- Invariant-to-test mapping was not performed this session (deferred).

## F. Known limitations and transitional states

- **2026-only calendars:**
  - `v2/TradingCalendar.java:35` has `KNOWN_YEARS = Set.of(2026)`.
  - 2026 holiday tables are duplicated by value in `SessionGate.java:37-44`, `SessionClassifier.java:59` (used at 112, 187, 353), `v2/TradingCalendar.java:37-43` and `options-prototype/src/market-session/trading-calendar.ts:25-46`.
  - Behavior in 2027 (inference from the code):
    - v1 `SessionGate` will not block 2027 weekday holidays.
    - `SessionClassifier` will treat those holidays as trading days.
    - v2 fails closed for every 2027 instant (`AcquisitionPhase.UNKNOWN`).
  - Draft (not filed): `../../BUG-043-DRAFT-trading-calendar-2026-only.md`.
- **Early-close times differ** [source]:
  - v1 `SessionGate`: 13:30 ET including delay.
  - v2 `TradingCalendar`: 13:00, the equity close.
  - Frontend: 13:15, the options close.
  - Whether the differences are intentional is not established.
- **Policy literals:** delta 0.15–0.50 with a 0.30 target for covered calls, and 7–45 DTE acquisition. These are in v1 code and have no ratified policy authority (SFND2 E054; SN0 E049: "target DTE 21 was never policy"). Exact file:line inventory was deferred.
- **Gitignored but load-bearing:** `evidence-service-java/build/start-position-slice.mjs` (from the prior session; not re-verified this session).
- **v1 runs unversioned** from the working tree, while v2 runs from a versioned release directory. Source state and installed state can diverge silently for v1.
