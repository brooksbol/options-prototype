# PL-CLI-01 — Accepted PTS Portfolio Capital history graph

**State:** Principal accepted the displayed real-evidence Unicode graph on October 13, 2026: “that's good enough for now. accepted. execute end of session protocol”. Acceptance covers the bounded isolated delivery and its explicit gaps. **Not operationally deployed.** Installed `ww`, running services, operational evidence and grants remain unchanged. No independent review of this candidate was commissioned or performed; author verification and Principal acceptance are distinct evidence. PL-CONV-01 Step 6 remains unstarted and unauthorized.

## Working operator result

The accepted graph uses the existing ratified [Portfolio Capital definition](../foundations/portfolio-capital.md):

```
Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM
```

Actual retained PTS evidence contains **73 accepted Balances artifacts across 38 export days, July 10–October 11, 2026**, and **74 accepted Option Summaries**. The graph calculates **44 two-source composites across 28 dates, July 27–September 28**, and displays the other **29 Balance observations as explicit unknown/unmatched gaps**. Both source types are retained in the existing backend; no new financial persistence model or acquisition was needed.

A computed row requires exactly one Balances artifact and one Option Summary with the identical reported export minute. This deliberately conservative bounded pairing is **not an assertion of an atomic brokerage observation**. Different-minute sources are not paired by nearest time, calendar day, latest import, or filename suffix. Multiple artifacts of either type in the same minute yield `AMBIGUOUS_EXPORT_MINUTE`; every Balance artifact retains its row. Missing or malformed totals, quantity, short-option MTM or unrecognized option geometry produce no capital value. Zero requires a complete parsed Summary establishing no short-option liability, never missing evidence. Historical times come from the source export footer with New York timezone and MINUTE precision. Quote date and receipt time remain separate.

The two-column terminal result is 41 lines at 100 columns, with dates, dollar values, one Unicode glyph per computed observation and explicit gaps. It contains no interpolation, daily collapse, synthetic current point, hardcoded seed or explanatory footer. The final sparkline is observation-ordered, with a dot for each uncomputed Balance observation; it is not an evenly sampled trading-day series. This is Portfolio Capital, **not broker NAV, investment return, or an explanation of contributions/withdrawals/appreciation/erosion**.

## Public primitive and Unix composition

The existing public Position observation catalog lacks both Account Total and aggregate short-option MTM. Its holdings omit non-position/cash rows; their market-value sum cannot establish Portfolio Capital. The smallest added read is:

```
GET /v2/portfolio-capital-observations?accountId=CANONICAL_ID
ww ls portfolio-capital-observations --account pts [--tsv | --table | --jsonl]
```

Backend computes the ratified measure from accepted, hash-verified retained originals in a committed inventory read. Existing `account.artifacts.read:ID` authority governs the financial read; CLI nickname discovery additionally uses existing `account.read:ID`. Original source-scope protections are reused. Unknown/mixed source scope fails closed; this bounded projection requires a single requested Account source. No grant is added or broadened. Required canonical REST `accountId`, correlation, private/no-store, common Problem responses, strict GET validation, known authorized empty collection and complete-response capacity failure inherit current v2 conventions. OAS is updated additively.

Redirected default TSV fields: `exportMinute`, `portfolioCapital`, `status`, `totalAccountValue`, `shortOptionMtm`, `balancesArtifactId`, `optionSummaryArtifactIds`. Missing numbers are `?`. Explicit JSONL preserves request correlation, measure/formula/pairing/coverage, both source IDs/hashes/row numbers, export/quote/receipt dates, precision and qualifications. Reads contact no brokerage and do not write evidence. The generic awk file only formats timestamp/numeric TSV; it performs no financial calculation or source selection.

From the already-arranged candidate directory:

```sh
set -o pipefail
./bin/ww ls portfolio-capital-observations --account pts |
  LC_ALL=C sort -k1,1 |
  awk -v columns=2 -v title='PTS — Portfolio Capital History' -f source/scripts/unicode-observations.awk
```

**Ordinary runnable acceptance entry point, no manual configuration:**

```sh
/Users/bollich/kiro/options-candidates/pl-cli-01-capital-history/demo.sh
```

That harness arranges only the private retained-copy preview and candidate configuration, then runs the pipeline. It never falls back to the operational database. Its `bin/ww` adapter prevents inherited connection overrides from accidentally selecting the operational service. The installed `ww` does **not** yet expose this command: acceptance and source persistence do not authorize service restart, deployment or installed-client promotion.

## Verification and frozen identity

Frozen candidate: **PL-CLI-01-capital-c32edbd248a0**, source baseline `f3943c3d11647ff88eaa223e85f5d1be60eddebb`.

- Patch SHA-256: `c32edbd248a01c2338a45fed3b239cd50d09ba6e95eda133e9b4b1f06616b66e`.
- JAR SHA-256: `f2e21a15fc96f47106adce1ff312ece9963e10553862c0132a08b5453cee211f`.
- Source archive SHA-256: `c5298d83a0c971d80c46351581c5d5b47b3fb44523267c457a5bd94f4d85b43e`.
- Actual PTY text capture SHA-256: `3ff1b76e72ea03d56b09674ca6ad4c700c3f82e68b290a2ae8222922e2c57938`.

Author verification: 32 focused backend tests and all 175 CLI tests passed. New tests cover exact decimals, source dates, missing/unmatched evidence, duplicate-minute ambiguity, complete no-short-option zero, unrecognized geometry, Account grants, no administrator bypass and original-source fail-closed behavior. All 44 computed real values match the **actual v1 parsers and derivePortfolioCapital** to the cent, with 117 component hash checks. All 147 originals were hash-verified by the backend read. Both OAS documents validate, and the actual 73-row response conforms to the new schema. Existing Account and Position-history reads match the operational installation. Ordinary sort/cut/awk/tee/head/redirection compositions pass.

The terminal capture is a genuine UTF-8 PTY capture at 100×45, exit 0, two aligned columns and byte-equivalent redirected output. Native Terminal UI capture was unavailable; no native-window screenshot is claimed. Principal inspected the displayed capture in conversation before acceptance.

Patch reconstruction from the frozen baseline matches all 1166 source hashes; shipped main classes match final compilation. Operational and preview-copy financial tables, identities and grants matched their pre-work snapshot. Installed `ww` symlink/target hash were unchanged. The preview imports only retained-store and Account/Position/Capital controller dependencies; it has no acquisition-worker or brokerage-client beans.

Frozen artifacts, complete structured observations, captures, manifests and verification logs remain under `/Users/bollich/kiro/options-candidates/pl-cli-01-capital-history/`. Private retained database, originals and ephemeral preview credentials remain outside Git and outside the source archive. The frozen package is not rewritten during closeout. Accepted implementation source, contracts and documentation are persisted separately on current accepted main.

## Reconciliation and remaining boundary

This closes the bounded requested **working text graph** under existing PL-CLI-01. It does not close the broader CLI stream, establish complete daily capital history, resolve the 29 different/missing-minute pairings, restore/migrate the v1 browser trajectory, attribute its legacy seed, change Portfolio Capital accounting, or authorize PL-CONV-01 Step 6. Existing PL-PROD-VALUE owns the ratified measure; PL-PORT-01 and its CAPGRAPH refinement retain their broader durability concerns. No new PL identity, Bet, horizon, principle, architecture decision or engine is created.

The prior [historical Position closeout](pl-cli-01-historical-position-candidate.md#unresolved-gap-pts-portfolio-value-history) remains provenance for the earlier unmet request and discovery omission. Its retention-unverified conclusion is superseded only by this verified bounded result. Coming Soon remains truthful: this analytical graph does not complete Position reassessment/attention or governed WAIT. Operational deployment remains unperformed and separately governed.

## Session closeout verification — October 13, 2026

Closeout was isolated on remotely verified `9a92421aff4f1b2967df3d764db9389b88a5b083`, preserving its unrelated managed-Position visual specimen and all pre-existing research files. All 14 frozen implementation files remained byte-identical. Fresh verification passed **163 v2 backend tests, 175 CLI tests and 147 Roadmap parser/integrity/freshness tests**. The rebuilt backend JAR is byte-identical to the frozen accepted binary above. Canonical PL-CLI-01 state and append-only journal why-state were reconciled; the checked-in Roadmap projection was regenerated and its freshness check passed. Coming Soon required no horizon change. The closeout carries source/documentation persistence and accepted-main synchronization only; operational installation, services, evidence and grants remain protected.
