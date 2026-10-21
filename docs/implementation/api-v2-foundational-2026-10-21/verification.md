# Implementation milestone verification — not full delivery

## Authority and discovery

Repository navigation began at root AGENTS.md, docs/AGENTS.md and docs/README.md's A–F model, followed by Codex cold start, the Product-first mandate/fitness controls, API guardrails, current maintained Position/Account owners and ASSIM-0002. The Principal's full implementation handoff supersedes the earlier checkpoint's slice-first sequence; acceptance of a32 was conditional on three entry corrections, not runtime acceptance. Gate001 remains staged. The proposed backend/CLI project plan added at main76bdb90 was retrieved; it does not authorize ww live, an MCP, a v1 web migration or operational deployment. Complete main/parking-lot/journal continuation sets were indexed earlier; unrelated entries were not exhaustively read.

The preloaded conversation supplied routing, asserted candidate/review histories and explicit Principal decisions. Repository contents, SHAs, fixture/code behavior and test outputs were checked separately. Kiro's reported review and original sixteen unavailable probes have not become independently reproduced evidence. This is author verification, not an independent review.

## Entry corrections

- Own-constituent economics/payoff and evaluation clocks corrected in six review examples; no copied USD123.45/September1 claims. Source history still unknown where unavailable. The idempotent review generator calls apply-entry-corrections.py.
- REDACTED Metric variants require null value **and null asOf**. Backend tests exercise Position summary/expanded/direct reads, dependent geometry and historical detail. Restricted Order clocks do not survive as independent Position facts merely because a link was hidden.
- The 100-owned-share/two-call conflict is represented in Account reconciliation and both dependent Position evaluations with precise affected pointers. Runtime tests use actual retained synthetic CSV custody plus explicitly synthetic compatible option/coverage assertions. Owned allocation, fungible economic support and broker reservation remain separate. No share selection or operator association workflow exists.

## Commands and observed results

Run from the implementation worktree root unless noted. Existing Python environment:
`/Users/bollich/kiro/options-candidates/pl-cli-01-capital-history/private/verify-env/bin/python`.

- `./evidence-service-java/gradlew -p evidence-service-java test --console=plain`: milestone **870 tests, 0 failures/errors, 2 skipped**, 5m21s. Machine results: results/backend-milestone-01.json. This includes existing service regression and new portfolio tests, not870 independent Product scenarios. Earlier full run865 had one observer-completion race; its exact failed result is retained in results/backend-regression-01.json. The original earlier run858 had three migration fixture failures; their fixture corrections passed targeted verification before the next full run.
- `.../python docs/reviews/api-v2-foundational-contract-2026-10-20/verify.py`:78 specification checks pass.
- `.../python docs/reviews/api-v2-foundational-contract-2026-10-20/final-targeted-tests.py`:17 checks pass.
- `.../python docs/implementation/api-v2-foundational-2026-10-21/entry-corrections-test.py`:3 checks pass.
- `.../python docs/implementation/api-v2-foundational-2026-10-21/validate-runtime-responses.py`: actual Java output is schema-validated, including projected Constructions, holdings snapshot discovery, Account coverage and Audit. The current count is recorded in results/runtime-schema-milestone-01.txt after clearing prior generated captures. Payload count is not unique route coverage. Financial truth, source association and permissions are not established by JSON Schema.
- Accepted Node Product/specimen run:199 pass in the earlier implementation investigation (`/tmp/ww-product-regression.log`); no application source in those scripts has changed. These exercise accepted tt behavior and candidate replay, not the complete new Java runtime. Exact replay commands remain in the copied review README.
- In options-prototype: `npm run generate:roadmap-projection`, then `npm run check:roadmap-projection`; derived projection refreshed for the appended canonical task delegation. This is a derived artifact update, no CLI or web behavior change.

## What the new backend tests prove

PortfolioContractIntegrationTest/PortfolioHttpTest use temporary SQLite, real persisted grants, real Fidelity parser input, MockMvc and a loopback Tomcat server. They check direct/collection/history/snapshot concealment, opaque scoped cursors, authorization of expanded resources, metric clock redaction, immutable resources, immediate predecessors and terminal resource writes. The test-only legacy PositionsController preserves old standalone historical tests; it is profile-gated and does not ship as a production compatibility route.

PortfolioFinancialTest compares production piecewise segments to an independent leg-by-leg formula at more than1500 spots over the finite accepted synthetic constructions. It checks unequal BWB tails, symmetric-wing rejection, numeric signs, NY calendar DTE, incompatible multipliers/deliverables, mixed currencies/expirations and the equity-mid SPOT source clock. It does not ratify a Model or establish source availability.

PortfolioOrderEvaluationTest checks prior-admitted, scoped association assertions against subjects, actions, quantities, complete reported fills, final fill time, price units and signs. Missing/wrong-scope/ambiguous assertions and working instructions do not create opening events. It does not prove that actual brokerage content establishes those relationship predicates; source producers retain that obligation.

PortfolioOrderEvidenceTest normalizes the explicitly synthetic captured-shape tt Order fixture through retained Account-owned source bytes. PortfolioOrderAcquisitionTest drives actual backend OAuth/GET over loopback, two-page traversal, exact original retention, reuse, failed-scan rollback, foreign-Account rejection, secret exclusion and retained-prior warnings. A complete supported scan is neither lifetime history nor an atomic brokerage snapshot. Order submission is absent.

PortfolioReconciliationTest verifies actual100-share/2-call source quantities, owned conservation, distinct obligation sums and conflict propagation into both Positions/summary projections. Incompatible deliverable quantities produce UNKNOWN coverage. No tax-lot assignment is implied. PortfolioEconomicHistoryTest independently sums the three documented original/current/cumulative specimens, distinguishes expired protection and LEAPS rights, and leaves unsupported realized/tax attribution unknown.

## Narrow regression fixture corrections

The new migration adds denied-by-default fixed permissions and portfolio foreign keys. Existing migration tests now remove the new dependent tables when constructing their legacy database fixture, compare all preexisting User bytes by explicit old columns, and independently assert each new permission defaultfalse. This preserves the migration assertions instead of weakening them.

ObserverRealPacerIntegrationTest raced the dispatcher's final observer event: RequestPacer completes its future before its finally block records OPERATION_COMPLETED. Full run and targeted rerun observed2 rather than3 events. An unchanged-main detached probe passed once; that is not a claim of independently reproducing failure on main. The test now waits at most2seconds for the actual completion count before shutdown; exact401/401/200 assertions remain. Provider production behavior is unchanged.

## Limits and remaining work

Coverage.json remains explicitly PARTIAL. No whole-application installed backend, live broker, operator acceptance or independent Kiro result is claimed. Operative OAS/docs publication remains pending full target completion and independent acceptance; release identity/publication metadata is untouched. Broker holdings raw observations and GUID-based economic resources remain separate. Current admission of successive snapshots still needs the stable, evidence-qualified resource treatment recorded in the coverage inventory; generated IDs per source cut are not the final lifecycle implementation. Full split/recombine, Portfolio membership, first-class Execution and discretionary basis attribution remain unresolved/deferred, not silently selected.

Official tastytrade documentation was consulted read-only for holdings/reference field meanings. Its positions example contains order-id but does not establish the required opening-Order/Position lifecycle predicate; that field is not promoted into proof. See https://developer.tastytrade.com/reference/balances-and-positions/getAccountsAccountNumberPositions/ . No live account calls were made. Repository navigation supplied task/domain authority and working precedent; external source documentation supplies only broker interface context.

No new Principal Product judgment has been required. Status interruptions did not cancel the assignment; no background work is claimed after a final chat response. Full test durations are measurable above; exact total retrieval duration and token/credit consumption are not exposed, so no totals are invented.
