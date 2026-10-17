# ww accounts — Discovery, mockups and capability gaps — October 17, 2026

**Status: PARKED DISCOVERY / PRESENTATION EXPLORATION; command NOT implemented.**
**Principal direction:** “persist all of this, the mockups, the gap analysis,
everything. we'll come back to it later. this is ww accounts”.
**Owner:** existing PL-CLI-01; related PL-DEPLOY-BAL and PL-API-03. This is a named
ww accounts workstream under those existing identities, not a new parallel registry.
**Verified remote main before persistence:** `b16af0911eb206d0634834c32c857bea07fd7851`.

## Recovery summary

The proposed command is **`ww accounts`**: one operator-facing table of Accounts
associated with the authenticated User, with Account identity, balances, financing
and buying-power facts. It is not holdings inventory or transaction history.
The Principal explicitly excluded transaction history and evidence-status columns.
The Principal rejected three tables in favor of ONE table, with pruning later,
and removed WW ID as meaningless to the operator. The wide table remains a deliberate
exploration, not a final narrow-terminal contract or an accepted implementation.

No code, OAS, database, operations or new brokerage calls are authorized here.
Do not resume automatically. No new API design/review or implementation occurred.
The separately stopped ww live workstream remains stopped. The accepted ww positions
human reference is separately persisted in b16af09; do not confuse its acceptance
with acceptance of a final ww accounts layout.

## Operator observations and settled presentation choices

1. The opening question was “how much margin debt do i have in pts account?
   can the existing ww tools show that?” The retained PTS Balances source reports
   `Margin debit = -2157.01`: $2,157.01 owed as of October17 1:47PM ET.
2. `ww show account pts` interpreted ACCOUNT and PTS as quote subjects and returned
   two quote.read authorization errors. That is unsupported command grammar, not
   evidence that Account access or brokerage credentials are broken.
3. `ww ls portfolio-capital-observations --account pts` works, but exposes historical
   export-pairing diagnostics rather than answering the human Account question.
   An unmatched composite does not mean its Balances source is absent.
4. Holdings custody Cash/Margin does not answer asset purpose, actual borrowing or
   option encumbrance. That led to the separately accepted
   [ww positions reference](../../cli/ww-positions-human-presentation-2026-10-17.md).
5. For ww accounts, list every Account visible to the authenticated User. Account
   membership/access must be backend-established, not selected from local assumptions.
6. One table, not three. Remove internal WW ID from human output. Keep nickname,
   display name, brokerage and masked brokerage Account number. Column pruning remains
   deferred until the Principal resumes observation.
7. Blank cells mean the displayed value is unavailable; do not silently replace
   them with zero. Detailed evidence must still distinguish absent, not applicable,
   unknown, unsupported, stale and unauthorized. No evidence-status column requested.
8. The Principal requires real values from ww commands preferably, otherwise v2 API,
   rather than invented numbers. Earlier synthetic specimens are preserved only as
   layout history below. Their blanks and permissions are not capability evidence.
9. PTS is a margin Account; sawdust is not. Account-type context matters. It is distinct
   from whether debt exists today and from the custody classification of a holding.
   tt1's Account regime was not verified in this inquiry.

## Desired information inventory (excluding holdings, transactions and evidence status)

- Account nickname/display name; brokerage and brokerage Account number.
- User's Account permissions (human shorthand remains provisional).
- Reported total Account value; qualified Portfolio Capital observations.
- Account regime/type (margin versus cash where established).
- Margin debt; margin/non-margin buying power.
- Available cash; withdrawal capacity including margin borrowing.
- Settled cash; core cash; cash reserved for option strategies; cash credit/debit.
- Margin interest rate, reported daily accrual, month-to-date accrual.

Not every broker supplies every field under the same meaning. “Available cash” in
the real mock means cash WITHDRAWABLE without margin borrowing, not cash available
to trade or policy deployable cash. This header is provisional and needs clearer
wording before implementation. Do not collapse distinct facts because today's
numbers coincide. Original-source observations also contained PTS AWMI/house surplus/
SMA/exchange surplus/equity percentage and sawdust available-to-trade/cash-and-credits;
these selected facts are retained in the extracted evidence, without adding all of
them to the mock by actor decision.

## Mock A — Initial synthetic three-table draft (REJECTED layout)

All money/access entries below were invented for layout exploration. In particular,
synthetic tt1 blanks, zero debt and interest rates are NOT verified facts. Interest
headings below use daily and month-to-date meanings; no forecast is intended.

```text
ACCOUNT  NAME               BROKER      BROKER ACCOUNT  WW ID  ACCESS
───────  ─────────────────  ──────────  ──────────────  ─────  ───────────
pts      PERSONAL TREASURY  Fidelity    ****1514        …3394  Read / Sync
sawdust  sawdust            Fidelity    ****1078        …da88  Read / Sync
tt1      tt1                tastytrade  ****0059        …e0b0  Read / Sync
```

```text
ACCOUNT  ACCT VALUE  PORTFOLIO CAPITAL  MARGIN DEBT  MARGIN BP  NON-MARGIN BP  AVAILABLE CASH  CASH + BORROWING
───────  ──────────  ─────────────────  ───────────  ─────────  ─────────────  ──────────────  ────────────────
pts         $98,000           $100,000       $2,000    $22,000        $11,000              $0           $10,500
sawdust     $25,000            $25,300           $0         $0         $3,000          $3,000            $3,000
tt1         $15,000                              $0    $20,000        $10,000          $8,000           $10,000
```

```text
ACCOUNT  SETTLED CASH  CORE CASH  OPTION CASH RESERVED  CASH CREDIT/DEBIT  MARGIN RATE  DAILY INTEREST  ACCRUED THIS MONTH
───────  ────────────  ─────────  ────────────────────  ─────────────────  ───────────  ──────────────  ──────────────────
pts               $50    $24,000               $23,950                 $0      12.075%           $0.70              $12.00
sawdust        $3,000    $18,250               $15,250                 $0      12.075%           $0.00               $0.00
tt1            $8,000                                                  $0       11.00%           $0.00               $0.00
```

The Principal rejected the three-table approach: “not 3 tables. 1 table. we'll
prune it if we need to”.

## Mock B — Synthetic single table with WW ID (historical, ID REJECTED)

```text
$ ww accounts

ACCOUNT  NAME               BROKER      BROKER ACCOUNT  WW ID  ACCESS       ACCT VALUE  PORTFOLIO CAPITAL  MARGIN DEBT  MARGIN BP  NON-MARGIN BP  AVAILABLE CASH  CASH + BORROWING  SETTLED CASH  CORE CASH  OPTION CASH RESERVED  CASH CREDIT/DEBIT  MARGIN RATE  DAILY INTEREST  ACCRUED THIS MONTH
───────  ─────────────────  ──────────  ──────────────  ─────  ───────────  ──────────  ─────────────────  ───────────  ─────────  ─────────────  ──────────────  ────────────────  ────────────  ─────────  ────────────────────  ─────────────────  ───────────  ──────────────  ──────────────────
pts      PERSONAL TREASURY  Fidelity    ****1514        …3394  Read / Sync     $98,000           $100,000       $2,000    $22,000        $11,000              $0           $10,500           $50    $24,000               $23,950                 $0      12.075%           $0.70              $12.00
sawdust  sawdust            Fidelity    ****1078        …da88  Read / Sync     $25,000            $25,300           $0         $0         $3,000          $3,000            $3,000        $3,000    $18,250               $15,250                 $0      12.075%           $0.00               $0.00
tt1      tt1                tastytrade  ****0059        …e0b0  Read / Sync     $15,000                              $0    $20,000        $10,000          $8,000           $10,000        $8,000                                                  $0       11.00%           $0.00               $0.00
```

The Principal removed WW ID: “it's meaningless to the operator”. Internal canonical
IDs still matter to backend identity/authorization; this is a human presentation decision.

## Mock C — Synthetic single table without WW ID (superseded as data evidence)

```text
$ ww accounts

ACCOUNT  NAME               BROKER      BROKER ACCOUNT  ACCESS       ACCT VALUE  PORTFOLIO CAPITAL  MARGIN DEBT  MARGIN BP  NON-MARGIN BP  AVAILABLE CASH  CASH + BORROWING  SETTLED CASH  CORE CASH  OPTION CASH RESERVED  CASH CREDIT/DEBIT  MARGIN RATE  DAILY INTEREST  ACCRUED THIS MONTH
───────  ─────────────────  ──────────  ──────────────  ───────────  ──────────  ─────────────────  ───────────  ─────────  ─────────────  ──────────────  ────────────────  ────────────  ─────────  ────────────────────  ─────────────────  ───────────  ──────────────  ──────────────────
pts      PERSONAL TREASURY  Fidelity    ****1514        Read / Sync     $98,000           $100,000       $2,000    $22,000        $11,000              $0           $10,500           $50    $24,000               $23,950                 $0      12.075%           $0.70              $12.00
sawdust  sawdust            Fidelity    ****1078        Read / Sync     $25,000            $25,300           $0         $0         $3,000          $3,000            $3,000        $3,000    $18,250               $15,250                 $0      12.075%           $0.00               $0.00
tt1      tt1                tastytrade  ****0059        Read / Sync     $15,000                              $0    $20,000        $10,000          $8,000           $10,000        $8,000                                                  $0       11.00%           $0.00               $0.00
```

The actor initially left synthetic tt1 fields blank without evidence, then corrected
that explanation. The mock did not establish a bug. The Principal subsequently
required regeneration using actual ww/v2 values, producing Mock D.

## Mock D — Actual retained API values, proposed command (NOT installed)

Account metadata/permissions are actual v2 responses. Financial values are from
latest retained Balances content read through the authorized v2 original-content
endpoint, with Portfolio Capital qualification from its existing v2 read. This
engineering inquiry is NOT a design to make the eventual CLI read/interpret raw
brokerage artifacts; the production command must consume backend domain results.

```text
$ ww accounts

ACCOUNT  NAME               BROKER      BROKER ACCOUNT  ACCESS          ACCT VALUE  PORTFOLIO CAPITAL  MARGIN DEBT   MARGIN BP  NON-MARGIN BP  AVAILABLE CASH  CASH + BORROWING  SETTLED CASH   CORE CASH  OPTION CASH RESERVED  CASH CREDIT/DEBIT  MARGIN RATE  DAILY INTEREST  ACCRUED THIS MONTH
───────  ─────────────────  ──────────  ──────────────  ──────────────  ──────────  ─────────────────  ───────────  ──────────  ─────────────  ──────────────  ────────────────  ────────────  ──────────  ────────────────────  ─────────────────  ───────────  ──────────────  ──────────────────
pts      PERSONAL TREASURY  Fidelity    ****1514        Read / Import   $97,790.51                       $2,157.01  $21,517.32     $10,758.66           $0.00        $10,451.63        $40.86  $23,990.86            $23,950.00              $0.00      12.075%           $0.72              $11.51
sawdust  sawdust            Fidelity    ****1078        Read / Import   $24,228.73                                                                  $2,075.73
tt1      tt1                tastytrade  ****0059        Read / Acquire
```

**Source clocks:** PTS October17 2026 13:47 ET; sawdust 13:48 ET. These are retained
export observations, not a simultaneous live Account view or a NAV certification.
Latest Portfolio Capital is unavailable for both because no unique matching
export-minute Option Summary establishes that composite. Do not fill those cells
with an older composite without a separate explicit time qualification.

ACCESS is provisional shorthand: Fidelity `Read / Import` summarizes actual metadata,
Position/history/original read and artifact-write grants; it does not imply brokerage
acquisition authority. tt1 `Read / Acquire` summarizes metadata/Position/history reads
and positionsAcquire; it does NOT imply original-artifact read/write. No grants were
changed. A displayed permission is not instruction or authorization to operate now.

### Account-type clarification (candidate column, verified precedent)

```text
ACCOUNT  NAME               BROKER      BROKER ACCOUNT  ACCOUNT TYPE
───────  ─────────────────  ──────────  ──────────────  ────────────
pts      PERSONAL TREASURY  Fidelity    ****1514        Margin
sawdust  sawdust            Fidelity    ****1078        Cash
tt1      tt1                tastytrade  ****0059
```

The actor wrongly suggested this rested only on Principal clarification. Existing
Fidelity parsing/domain projection ALREADY classifies `MARGIN`, `LEGACY_CASH` and
`INDETERMINATE` from source field/section presence. Margin signals win even when
values are blank; a margin Account may have 100% equity and no borrowing. The
existing classifier and BUG-022 specimens must be recovered before inventing one.
The Account-type column is a suggested refinement, not a final reordered full-table
specimen accepted by the Principal. tt1 regime remains UNKNOWN in this inquiry.

## Verified evidence and source-to-cell rules

[Selected verified facts](verified-facts.json) preserve masked identity, actual grant
booleans, source labels/decimal text, CSV record numbers, clocks and source hashes/Artifact IDs.
Both fetched Fidelity content hashes match the retained metadata. The capital
sourceRows field identifies its Total account value row only; reportedBalanceRows
separately identifies the other extracted facts. They
exclude credentials, full brokerage numbers, opaque Account/User IDs and original
source bytes. No raw brokerage artifacts are committed. This is an investigation
specimen, not a newly authoritative API representation.

| Mock cell | Actual source / qualification |
|---|---|
| Identity | `ww ls accounts --jsonl` and `GET /v2/accounts` |
| Access | `GET /v2/me` Account access booleans; shorthand is a presentation choice |
| Account value | latest `GET /v2/portfolio-capital-observations?accountId=…` totalAccountValue, corroborated by authorized original Balances content |
| Portfolio Capital | latest composite is null/UNMATCHED_EXPORT_MINUTE for both Fidelity Accounts; not filled with historical values |
| Margin debt | PTS source Margin debit `-2157.01`, shown as positive amount owed `$2,157.01`; sign handling is an explicit mock presentation convention, not a new financial engine |
| Margin/non-margin BP | distinct exact Fidelity source rows; not cash or unlevered deployable capacity |
| Available cash | PTS Cash only `$0.00`; sawdust Available to withdraw `$2,075.73` |
| Cash + borrowing | PTS Cash and borrowing on margin `$10,451.63`; withdrawal capacity, not owned cash |
| Settled/core/reserved/credit | distinct PTS source rows, no conflation or derived allocation |
| Interest | PTS rate12.075%, reported daily$0.72, month-to-date$11.51; not recomputed from rate/debt |
| Sawdust blanks | margin fields absent in cash-layout source; missing interest/debt cannot automatically be represented as numeric zero |
| Sawdust Cash and credits | source$17,325.73; NOT relabeled core cash or allocated reserve |
| Sawdust Available to trade (all settled) | source$2,075.73; not interchangeable with withdrawal merely because today's values match |
| tt1 financial blanks | no Account balance representation or acquisition path in the inspected v2 implementation; not evidence of zero balances, expired credentials or upstream provider inability |

Sources read successfully: `GET /v2/accounts`, `GET /v2/me`, existing Fidelity
Portfolio Capital GETs and `GET /v2/artifacts/{artifactId}/content` for each selected
Fidelity source. All financial reads were retained-only. No history facade invoked,
no sync/pull/fetch/acquisition POST, no provider or trading calls. tt1 original
artifact read permission is false; no original read was attempted for tt1 and no
new grants requested. It is not a prerequisite for a backend Account-balance view.

## Bounded gap analysis — current implementation, not a new API proposal

| Capability | What exists | Exact gap / status |
|---|---|---|
| Authorized Account inventory | v2 Account directory, IDs/aliases/names/broker association and authorized filtering; installed `ww ls accounts` | Reusable; `ww accounts` new human command/combined projection remains unimplemented |
| User permissions | committed Account capability booleans exposed via v2/me | Reusable; truthful human summary needs care because grants differ, not universal Read/Sync |
| Fidelity source retention | admitted Balances originals and original confidentiality protections | Already supported; do not duplicate ingestion or require client raw artifacts |
| Fidelity balance facts | raw source fields present; old application parser preserves distinct broker-native facts | Current v2 Account metadata does not expose a qualified balance domain representation. PortfolioCapital reader only extracts the total it needs; this is not absence of source evidence |
| Fidelity regime | existing tested `classifyBalanceRegime`, related BUG-022 and PL-DEPLOY-BAL precedent | Implemented outside v2; v2 Account representation lacks regime. Reuse semantics in backend, not import browser authority into CLI |
| Portfolio Capital | existing pure retained composite history with source provenance/statuses | Already supported, but latest two-source composites unavailable here. Historical existence does not justify a current value |
| Tastytrade balances | backend OAuth and authenticated positions/transactions (plus unrelated market metrics); authorized directory metadata | Inspected TastytradeClient has no Account balances acquisition method; no v2 balance domain/public representation found. Source acquisition, reconciliation and representation are missing for this Product capability |
| Tastytrade Account regime | no type in canonical Account brokerAssociation/metadata | UNKNOWN for actual tt1. Provider field/API sufficiency and retained alternatives not demonstrated; don't infer margin status from positionsAcquire or broker name |
| Tastytrade provider coverage | existing credentials/acquisition work for shipped purposes | Which desired balance fields the provider supplies, under what definitions/clocks/permissions, is UNKNOWN. No external API requests or provider-document sufficiency review in this inquiry |
| Cross-broker common meanings | existing canonical Account identity and backend-authority guardrails | Need qualified comparable meanings without treating Fidelity core cash as universally applicable, buying power as cash, or missing/not-applicable as zero |
| Time/failure/unknowns | existing source clocks, provenance, retained reads and authorization | Future balance representation must preserve observation age, source qualification and per-Account absence/failure; this checkpoint has not designed that contract |
| Human presentation | one-table, no-WW-ID exploration and real evidence mock | Column pruning, header precision, width adaptation, balance freshness presentation and final operator acceptance remain pending, not implemented |

These are capability findings, not proof of a bug. No backend defect has been established
by a synthetic blank. No new credentials or duplicate brokerage integration is justified.
Do not reconstruct total Account value/debt from Position market values or transactions.
The three Account rows must not become an apparent same-time comparison without
appropriate backend temporal qualification.

## Reuse and resume direction (not current implementation authority)

1. Recover this record and existing PL-CLI-01 / PL-DEPLOY-BAL, Doc56 and BUG-022.
2. Start with the real human Account questions and one-table specimen; prune with
   the Principal when work resumes, rather than presuming every internal field belongs.
3. Reuse v2 Account/User authorization and existing retained evidence; recover the
   accepted Fidelity parser/regime/semantic distinctions. Move required authoritative
   capability into the backend rather than repeating it in a CLI.
4. Verify tastytrade balance and Account-classification evidence support through the
   established backend integration before selecting API extensions or claiming actual
   source sufficiency. Operational acquisition remains separately authorized.
5. Design any necessary bounded v2 changes through applicable API authority/review;
   no endpoint/schema/framework or new Account aggregate selected here.
6. Retained monitoring must not silently acquire. Preserve original-artifact confidentiality,
   per-Account isolation, distinct unknown/not-applicable/conflicting states and clocks.
7. Keep ww accounts separate from ww positions and stopped ww live. No runtime changes now.

## Source index and verification limits

Inspected source in the original clean checkout `2c7d18eaa617ee893117def830977f0154597aac`;
persistence baseline remote main b16af09. The cited implementation files are checked
against that persistence baseline. Installed ww is the accepted October15 client
`~/.local/share/wheelwright/pl-cli-01-positions/operational-20261015-3de8dce/client/scripts/ww`.
No operational backend release SHA was independently established; successful reads
establish only the observed API behavior. No new runtime tests or independent engineering
acceptance are claimed. Source inspection and actual read-only responses are the evidence.

- `docs/contracts/api-v2-account-evidence.json`: Account, UserAccountAccess, User,
  CapitalObservationCollection; Account/User/artifact/Portfolio Capital operations.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountDirectory.java:12`:
  BrokerAssociation and Account records carry identity, not balances/regime.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/AccountsController.java:28`:
  committed authorized Account filtering, private/no-store responses.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/UsersController.java:22`:
  authenticated v2/me and committed capability metadata.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/PortfolioCapitalHistory.java:90`:
  retained source parsing; BALANCES branch extracts Total account value only.
- `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/TastytradeClient.java`:
  transactions, holdings and marketMetrics methods; no balances method in inspected class.
- `scripts/ww-accounts.mjs`: discovery, nickname resolution and existing masked listing.
- `scripts/ww-capital.mjs`: existing qualified retained composite consumer.
- `options-prototype/src/csv/fidelity/balancesParser.ts:135`: existing regime classifier;
  `:184` regime-aware deployable semantics, not authorization to reuse browser runtime in v2.
- `options-prototype/tests/write-desk/fidelity-upload.test.ts:420`: existing margin/cash
  and divergent-field regression specimens; not rerun for this documentation task.
- `docs/56-fidelity-account-regime-balance-semantics-2026-09-19.md` and `docs/bugs/BUG-022-deployable-cash-regime-unaware-folds-margin-buying-power.md`:
  prior broker facts, distinctions, remediation/acceptance scope and remaining concerns.
- [ww positions reference](../../cli/ww-positions-human-presentation-2026-10-17.md): separately
  accepted table, not ww accounts acceptance.
- [ww live stopping point](../ww-live-session-2026-10-16/README.md): unaffected.

## Stopping point

**ww accounts is parked.** This record preserves exploration and actual evidence,
not final Product acceptance or implementation authorization. Next authorized action
after persistence: **NONE — resume only upon subsequent Principal direction.**
No code/OAS changes, installation, deployment, migration, restart, acquisition,
credentials/grants or trading; no accepted candidate or unrelated in-flight work altered.
