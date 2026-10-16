# ww live — bounded backend construction candidate

Base: remote main `7ae274cbb0ad0ce77f21440b0c390558913f61e8`. Governing Product:
[complete October 16 handoff](ww-live-product-plan-2026-10-16.md), including final
supersession. All Product decisions remain settled. This candidate supersedes the
48-row inventory display. It is local, uncommitted, not independently reviewed,
not installed or deployed, and not Principal-accepted.

## Runnable result

```sh
/Users/bollich/kiro/ww-live-first-specimen/scripts/ww-live-preview.mjs
```

The harness starts the **actual candidate Java controllers, domain projection and
SQLite persistence** with explicitly synthetic retained evidence in a disposable
directory. It imports no operational configuration or brokerage beans, binds an
ephemeral loopback port, supplies the candidate CLI's configuration itself, and
stops/removes its own backend/data afterward. No operator variables, ports or IDs.
Optional `--width 180`, `--ascii`, `--no-color` and `--jsonl` apply to the candidate
command. This demonstrates implementation, not actual brokerage Position truth.

The table has the finalized columns, in order: BROKER, ACCOUNT, CONTRACT,
COLLATERAL, TRADE SHAPE, RANGE, SPOT, DTE, EXIT PROGRESS, QUOTE. CONTRACT is
underlying × quantity; individual legs and orders are not human rows. All broker
Accounts share one table. Neutral foreground uses the terminal default, including
green; no background is set. Existing WW Account colors and TT layout/width/ASCII
behavior are reused. Geometry has no profit/loss color implication when premium
and cost basis are unknown.

The preview demonstrates an explicit three-unit iron condor, a modified ratio
construction with a different actual payoff, a put vertical, an explicitly
associated 100-share covered-call construction, and an incomplete adjusted option.
Standalone shares, a Treasury and an expired option are excluded by the backend.
The Fidelity Account refresh indicator is emitted because of the expired retained
option, not because an arbitrary age threshold elapsed. Prices/economics remain —.

## Bounded backend extension and reuse

- `GET /v2/positions?view=open-options` is a semantic projection of the existing
  Position resource. It uses existing authentication, exact Account Position
  grants, collection scoping, correlation and private/no-store semantics. It is
  pure retained-state reading, with no history read-through or provider dependency.
- Ordinary `/v2/positions` and `ww positions` keep their accepted comprehensive
  inventory contract. No database schema/migration, universal Position aggregate,
  event bus, new provider framework or operational configuration is introduced.
- Existing whole-holding explicit associations establish **snapshot-bound**
  membership. Existing overlap rejection remains. Matching geometry cannot group
  holdings. Unassociated options remain individually visible. Distinct expirations
  split displayed constructions; unknown expiry never establishes common expiry.
- An optional original instrument response is retained within the existing
  immutable snapshot JSON. The bounded backend import utility accepts it alongside
  the existing explicit association file. Its hash, filename and one-based source
  items qualify derived geometry. The format interpreter checks contract identity,
  expiration, strike/right, underlying, Standard chain classification and 100-share
  deliverables. Missing, conflicting, duplicate or adjusted terms fail closed.
  This is operator-supplied source evidence, not proof of authenticated brokerage
  acquisition. **No new REST instrument intake/acquisition capability exists.**
- Backend `OptionStructure` computes exact BigDecimal piecewise-linear terminal
  intrinsic value from verified terms, signed quantities and actual explicitly
  associated shares. It publishes knots and tail slopes. Nonstandard ratios retain
  their actual graph; they are not forced into a condor template. Geometry is
  independent of current prices and opening economics. It excludes premiums,
  share basis, fees and execution effects: it is not current P/L, breakeven,
  maximum net profit/loss, or an executable valuation.
- The CLI plots the supplied graph and formats backend conclusions. It neither
  parses contracts nor derives membership, quantities, collateral, expiry scope,
  strategy, payoff or a refresh verdict. Existing exact-number formatting expands
  scientific notation without dropping strike precision.
- Display identity incorporates Account, explicit source Position identity,
  normalized contract identity and signed ratios. Proportional quantity reductions
  preserve it; strike, expiration or ratio changes do not. **This is not automatic
  occurrence reconciliation:** a close/reopen still needs a new established source
  occurrence. No opening date is inferred from receipt or snapshot date.
- Backend complexity and optional verified opening timestamp drive presentation
  sorting; this increment publishes no opening timestamp, so alphabetical fallback
  applies within category. Public schemas state that limitation.

## Actual-evidence boundary and remaining work

The actual-Account milestone has **not** been achieved by the synthetic preview.
The earlier retained `/v2/positions` reads established inventory, not managed
membership and complete instrument terms. The artifact-inspection **403** concerned
original-source disclosure only. It does not establish a brokerage acquisition,
credential, or backend-internal evidence-access failure. The Principal confirmed
working tastytrade acquisition through `ww sync account tt1` and `ww positions`.
The earlier request to expand the User's artifact grant is **withdrawn**. No grant
change, alternate credential or operational database inspection was performed.
CLI access to raw artifacts is not a prerequisite for backend Position processing.

Still missing or bounded: qualified term composition, unambiguous brokerage
membership fallback, partial allocations across managed packages, verified opening
occurrences/timestamps, automatic closed/reopened and roll reconciliation, adjusted
deliverable interpretation, cash collateral admission, qualified last-known spot,
Position-wide quote age, valuation and management. The existing explicit intake
allocates whole holdings only; this is not a ratification of a universal allocation
rule. Current open means nonzero retained unexpired option evidence, not independently
confirmed current brokerage state. Exact expiration time is used when qualified
instrument evidence supplies it; otherwise only prior New York dates are definitely
expired, and same-day cutoff remains unknown.

Before using the candidate with actual Accounts, engineering must compose the
existing internal retained-evidence paths and qualify which evidence establishes
membership and terms, then review the exact candidate and arrange separately
authorized delivery. A new source-intake API or import is not assumed necessary.
No operational backend was
upgraded, no source was acquired or admitted operationally, and no service restart,
database/grant change or trade was performed. The configured normal `ww` is unchanged.
The original `.ww.env` remains ignored/private; the preview overrides it with its
own test configuration and cannot silently fall back to the operational backend.

## Proof index

Recovered precedents: Doc 77 v2 guardrails, Product-first mandate, technology-quality
fitness controls, Doc 58's non-authoritative association vocabulary, Doc 70/ADR-022's
bounded continuity evidence requirements, accepted October 15 WW Positions and
October 14 TT presentation. No rejected October 13 candidate was resumed. Gate 001
remains STAGED. No independent-review or acceptance claim follows from author tests.

Backend falsifiers: explicit versus merely matching contracts; overlap rejection;
proportional reduction versus strike/expiry change; separately established reopen;
nonstandard ratio and tail slope; missing/adjusted/duplicate/bad-hash terms; exact
intraday expiry; expired/non-option exclusion; concrete Fidelity refresh reasons;
actual partial share collateral; cross-Account denial and original inventory
compatibility. These are in `OptionStructureTest`; prior `PositionsTest`,
`HistoricalPositionsTest`, `TastytradeAcquisitionTest`, `BrokerageArtifactsTest` and
`MarketEvidenceSubjectsTest` cover affected retained-evidence paths.

Client falsifiers: backend graph changes independently of prices; same-symbol
rows stay separate; unknowns and refresh reasons follow backend facts; no leg/order
details; exact JSONL; global backend-rank/date sorting; correct ASCII/default
foreground/width fallbacks; actual executable makes only the expected v2 GETs;
denied/malformed responses produce no partial table. Accepted WW/TT/history/update
checks remain in the focused suite. The resolved OAS and a Java-generated HTTP
construction response validate using the existing `v2_oas.py` tooling.

Recorded author verification: **39 Java checks and 51 Node checks pass**, with no
skips in the selected Java run. Resolved OAS structure, the new query value and
the generated Java HTTP response validate. Manual consistency and scoped whitespace
checks pass. These checks are not independent review or Product acceptance.

## Internal evidence-path investigation — Principal correction

Repository synchronization reverified against remote main
`7ae274cbb0ad0ce77f21440b0c390558913f61e8`; local candidate changes remain isolated.
The following are implementation findings, not observations of the operational
database's complete contents:

| Existing path | Verified reuse | Remaining qualification |
|---|---|---|
| `PositionAcquisition.java:33`–`:87` | Existing backend client acquires holdings, commits exact original bytes in `brokerage_artifact`, records an `API_POSITIONS` import, then atomically admits the snapshot/outcome. Snapshot carries artifact identity/hash and acquisition lineage. Failed/rejected acquisition preserves the previous admitted snapshot. | Retention is not managed membership. Any internal source interpreter must select the accepted source tied to the selected Account/snapshot, not merely the newest retained artifact (which may be rejected). |
| `TastytradeHoldings.java:104`–`:139` | Account, contract, direction, quantity, expiration and source-item indices are already interpreted. Original optional fields remain in retained bytes even when absent from the canonical constituent. | Parser constructs an empty association list. `created-at`, average opening price, or a holding's `order-id` alone do not establish opening occurrence or current multi-leg allocation. The current projection also discards exact `expires-at`, although it validates its calendar date. |
| `TastytradeTransactions.java:63`–`:88`; `TransactionHistory.java:124`–`:199` | Existing history acquisition retains original pages and normalized source transaction identity, order ID, executed timestamp, action, symbol, quantity and money fields, with observation revisions and artifact/row provenance. Internal SQL is already Account-scoped. | No Position membership/quantity-allocation reconciliation exists here. Missing optional fields stay null; multiplier is expressly not supplied. Changed observations/reversal links and partial histories require qualification before using fills. |
| `TransactionHistory.java:41`–`:49`, `:201`–`:224` | Existing retained-history loader and representation can be reused inside v2. | Public `read` can acquire when enabled and stale; it is unsuitable as the `ww live` read dependency. Extract/compose retained-only reading in the caller's consistent read view. Provider traversal is not lifetime coverage; the code emits `lifetimeCoverage=UNKNOWN` and `providerSnapshotConsistency=UNVERIFIED`. |
| `PositionMarketEvidence.java:16`–`:62` | Accepted precedent: backend Position reads already interpret retained Fidelity source/rows internally and expose qualified facts with lineage. No client raw-artifact round trip. | Strategy labels in Option Summary do not currently establish managed membership or adjusted deliverables. Current date-matching and conflict rules are quote-specific, not a universal association policy. |
| `PositionsController.java:34`; `ArtifactsController.java:37` | Position reads and original-artifact reads enforce separate Account grants. | Derived Position disclosure must remain within authorized Account scope. Internal processing does not authorize disclosing original bytes, source account numbers, or transaction-history detail to the CLI. |

Existing executable falsifier:
`TastytradeAcquisitionTest.modelAReadWriteQuoteAndOtherAccountDoNotImplyAcquisitionAndReadNeverAcquires`
already proves Position read success and original-content 403 for the same User,
with no extra provider request during reads. Its later grant change is confined
to the disposable test database; it is not an operator prerequisite.

**Engineering disposition:** extend existing backend evidence interpretation and
reconciliation first. The candidate's optional instrument-file import demonstrates
geometry on synthetic input; it is not the selected actual-Account evidence path
and does not prove a new public intake is needed. Preserve known unknowns until
retained evidence proves membership, terms and current quantities. Merely sharing
an order ID or matching four contracts is insufficient. Actual retained optional
field coverage remains unverified through the inspected public representation;
that uncertainty does not justify increasing artifact-disclosure grants. No new
tastytrade credentials or parallel brokerage integration is proposed.

Verification for this investigation: offline Gradle selected
`TastytradeAcquisitionTest`, `TransactionHistoryTest`, `OptionStructureTest`,
`PositionsTest` and `BrokerageArtifactsTest`: **37 passed, 0 failed, 1 skipped**.
The skipped test requires an explicitly provided private CSV (`realFilePath`);
no private file was supplied or sought. Tests used disposable databases and local
fake providers, not brokerage acquisition. This is author verification, not
independent review, actual-Account source-coverage verification or Product acceptance.
