# Retained holdings catalog pagination — regression correction and Kiro handoff

## Scope and frozen identities

Principal explicitly authorizes this regression correction only. Kiro reportedly resolved F1/F2/F4–F6 but REJECTED the frozen candidate for a newly introduced catalog continuation defect. That report is review input, not a new Product rule. Full original Kiro probe artifacts were not available; all tests/traces here are **newly constructed independent author reproductions**, not claimed copies of Kiro's original probes.

- Frozen candidate: `5377610c004b35a0653011813068309eab42bf1e`, implementation `de3605e1bd8fb15278b29e4969d4bcfb2d3eec9a`, preserved unchanged in its clean original worktree/branch.
- Successor: `codex/api-v2-catalog-pagination-correction-2026-10-22`, isolated worktree `/Users/bollich/kiro/options-candidates/api-v2-catalog-pagination-correction-2026-10-22`. Exact submitted commit is the commit containing this report; resolve with `git rev-parse HEAD` and the final handoff.
- Remote main independently observed `65604784ee4ea6141cab66f7bb482a437cbe6e7b`, newer than Kiro's reported0f0da265. Unrelated MCP/config/project-state advancement from8bd75f5 is not integrated into this successor. Main/root and all frozen candidates are protected. No merge, push, runtime/service/data/config/grant changes, deployment, publication, broker acquisition or client work.
- Authority/task bootstrap and preloaded-context disclosure: [STATE.md](STATE.md). Prior author claims are not an oracle. Gate001 remains STAGED, not activated. Explicit Principal task authorizes isolated correction/commit, not operations. No new Principal question or intervention required.

## Governing requirement and complete cursor path

`docs/README.md:33–64` supplies A–F authority precedence; `docs/77-api-v2-architectural-guardrails.md:188–207` requires coherent bounded collection/filter/order/projection semantics. Maintained Account owner (`docs/knowledge/domain/accounts-and-operating-regimes.md:26–46`) preserves Account identity/grants; Position owner and ASSIM-0002 impose no new lifecycle decision for this task. Shared execution contract is suspended, not permission. Existing Product-first/fitness controls require actual observable behavior, not an implementation's claim of conformance.

The frozen operative `/v2/holdings` GET contract (`docs/contracts/api-v2-foundational-portfolio.json:23429–23528`) defines default latest admitted cut per authorized Account, explicit retained `snapshotId` and `view=observations`. Its typed collection/schema and limit/cursor/sort semantics require retained observations remain reachable until `next=null`. No contract change is needed to excuse missing historical evidence. Existing retained snapshot owner and signed HTTP cursor are reused; no new resource, cursor version or pagination framework.

| Stage | Source / exact supporting lines in successor | Meaning |
|---|---|---|
| Validate selection/scope, limit, sort, cursor | `PortfolioController.java:30–57` | Token User/Account grants and scoped signature checked; default limit50/max200, id/-id. Current-holdings cut fingerprint remains separate from catalog selection |
| Authoritative snapshot page | `PortfolioSnapshots.java:36–39` | Authorized Account IN selection; same canonical comparison expression for WHERE and ORDER BY; limit+1 lookahead |
| Summaries and lookahead | `PortfolioReadService.java:172–175`; `PortfolioSnapshots.java:44–45` | Same Account and immutable snapshot identity preserved, including partial/empty observations and original provenance |
| Java sorting, after-filter, continuation | `PortfolioController.java:81–82,92` | Canonical key used for comparison, final returned key becomes continuation; extra row only establishes more |
| Scope serialization and authentication | `PortfolioController.java:97–101` | Scope digest covers User/grants/route/query; payload base64url(scope+newline+last), HMAC checked before decoding/comparison |
| Canonical catalog key | `PortfolioSnapshots.java:11–13` | `/v2/accounts/{account}:{snapshotId}`; controller delegates to owner helper. Ordinary resource self-URI ordering remains unchanged |

Paths above are under `evidence-service-java/src/main/java/com/wheelwright/evidence/v2/portfolio/`. Supporting executable source: `evidence-service-java/src/test/java/com/wheelwright/evidence/v2/PortfolioSnapshotCatalogPaginationTest.java:24–77`.

### Root cause and smallest correction

Frozen SQL used `account||':'||snapshot_id` while the controller signed `/v2/accounts/` + Account + `:` + snapshot ID. Relative order inside an initial page happened to agree, but continuation comparisons did not. In ascending order SQL reselected the initial lookahead window, then Java discarded prior keys and silently terminated early. Descending SQL found no subsequent rows. HTTP200/schema validity did not detect missing membership.

Only two production files change. PortfolioSnapshots uses one Account URI prefix for summary Account links and the SQL key, and supplies `orderingKey` to the controller. The controller keeps its existing signed payload, query/scope binding, HMAC, Account authorization, limit and ordering semantics. There is no new public cursor format; existing generated catalog keys already contain the prefix and are now compared correctly. The SQL order and after-predicate use exactly the same expression in both directions.

The prior997 suite tested snapshot discovery on a single page; it did not walk catalog continuations. This correction adds a complete membership/order invariant rather than merely changing the expected item count for one sample.

## Actual observed before/after walks

[results/before/](results/before/) retains actual frozen-code request URLs, signed next links, canonical returned keys and full reference keys. [results/after/](results/after/) retains corrected walks. Each trace includes the SHA256 of its full generated capture; reviewer reruns regenerate full HTTP body captures in `evidence-service-java/build/catalog-pagination/`. Keys contain synthetic Account GUIDs and snapshot IDs generated by normal source admission. Different isolated runs generate different GUIDs, so the table uses **rank in that run's own ordered reference**; raw canonical identities remain in the traces. This is not a claim that copied expected files establish correctness.

| Fixture / request | Frozen observed ranks | Corrected observed ranks |
|---|---|---|
| Seven cuts, ascending limit1 |1,2 (2/7) |1,2,3,4,5,6,7 (7/7) |
| Seven cuts, ascending limit2 |1,2,3 (3/7) |1,2,3,4,5,6,7 (7/7) |
| Seven cuts, ascending limit3 |1,2,3,4 (4/7) |1,2,3,4,5,6,7 (7/7) |
| Seven cuts, descending limit1 |1 (1/7 in descending reference) |1,2,3,4,5,6,7 (7/7 in descending reference) |
| One Account, five cuts, limit2 |1,2,3 (3/5) |1,2,3,4,5 (5/5) |

Both one-Account and two-Account seven-cut grids run at limits1,2,3 and omitted/default50, id and -id. The two-Account fixture has5+2 cuts, so ascending limit2 and either-direction limit3 cross an Account boundary within a page. Reverse limit2 aligns the2+5 boundary exactly with a page boundary; an initial fixture assertion incorrectly demanded a mixed page there. It was corrected to match that arithmetic, without changing the complete ordered walk assertion or application. The first corrected targeted run had only that fixture assertion failing; the complete cursor walk itself already returned all seven. Baseline19 tests had14 observed failures; corrected targeted31 tests passed, including19 new catalog cases and12 existing F1/F2 collection/acquisition cases.

All cut source dates are the same synthetic Oct05,2026; quantities1…7 distinguish immutable source/cut identities. Tests compare exact JSON concatenation with an unpaginated limit200 reference, independently assert seven distinct cuts and both lexical sort orders, replay first/continuation pages for stability, decode each private continuation's last key, prohibit duplicates/cycles and require final next=null. Default50 is exercised as a single complete seven-cut page; small limits exercise continuations. Restricted grants expose only the allowed Account's five cuts; other User/changed Account-filter cursors fail closed. Every catalog link is followed to its exact historical holdings while default current holdings still select one latest cut per Account.

`verify-walks.py` separately validates25 emitted walks /85 page bodies against operative `/v2/holdings` schemas, exact sorted concatenation and canonical continuation keys. These are source-admission/MockMvc HTTP tests, not live brokerage or installed runtime acceptance. Existing runtime authorization/redaction and real-loopback HTTP tests remain part of full regression; schemas alone do not prove access control.

## Reproduce independently

From a clean successor worktree, run one Gradle process at a time. Do not target deployed port3101 or copy private data. `python` below is an existing environment with the pinned documentation/test dependencies; author reused `/Users/bollich/kiro/options-candidates/api-v2-integration-deployment-2026-10-22/tools/api-docs/.venv/bin/python`. Pinned documentation npm dependencies were installed locally with `npm ci --prefix tools/api-docs --ignore-scripts`; no runtime dependencies or configuration changed.

```sh
./evidence-service-java/gradlew -p evidence-service-java test --tests '*PortfolioSnapshotCatalogPaginationTest' --tests '*PortfolioCollectionCorrectionTest' --tests '*PortfolioPageAcquisitionTest' --console=plain
./evidence-service-java/gradlew -p evidence-service-java test --console=plain
python docs/implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/catalog-pagination-regression/verify-walks.py
python scripts/v2-oas-conformance-test.py
python docs/implementation/api-v2-foundational-2026-10-21/validate-runtime-responses.py
python docs/implementation/api-v2-foundational-2026-10-21/operative-contract-test.py
python docs/implementation/api-v2-foundational-2026-10-21/entry-corrections-test.py
python docs/implementation/api-v2-foundational-2026-10-21/r1-r2/verify-contract.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/verify.py
python docs/reviews/api-v2-foundational-contract-2026-10-20/final-targeted-tests.py
python docs/implementation/api-v2-foundational-2026-10-21/product-conformance-2026-10-22/verify-corrections.py
node docs/implementation/api-v2-foundational-2026-10-21/verify-mark-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-session-parity.mjs
node docs/implementation/api-v2-foundational-2026-10-21/verify-management-parity.mjs
python tools/api-docs/build.py
python tools/api-docs/validate.py
node tools/api-docs/human-specimen.mjs
```

To independently reproduce the original failure, use another disposable worktree at frozen5377610c, add only the new test class (no production source changes), and run its `everyRetainedCutIsReachable`/`fiveCutsWithPageTwoRemainReachable` cases. Do not alter the frozen worktree. Original Kiro payloads are unavailable; these are new equivalent falsifiers. The final test class also contains more cursor-stability assertions than the first baseline probe; baseline trace files are the actually executed initial probe results, not retroactive claims.

## Preserved boundaries / next step

OAS, all36 mappings, public description/example inputs, error/grant metadata and documentation pipeline are unchanged. F1 latest cut, history access, F2 page-bounded expansion/global reconciliation, F4–F6, financial meaning, evidence qualification and security remain required regression checks. F3 lifecycle state/EXPOSURE_CHANGE policy, CSP recognition and ASSIM0002 are untouched. No new opening, closure, continuity or financial fact is inferred.

Kiro should review only this successor delta against5377610c, replay the catalog grids and source-to-cursor path, then check the preserved conformance evidence. No full architecture redesign or new Product determination is requested. Implementer tests do not independently accept the candidate. Stop after producing this isolated verified successor; targeted independent Kiro re-verification is required before controlled integration/redeployment, which is not performed here.

## Final verification ledger

| Check | Actual observed result |
|---|---|
| Targeted catalog + original F1/F2 collection/acquisition |31 passed,0 failures,19s;19 new catalog cases +12 existing |
| Complete backend `gradlew test --console=plain` |**1016 tests,0 failures,0 errors,2 optional private-file skips**,5m37s; prior997+19, not a substituted baseline |
| OAS/controller conformance |7 groups passed, all36 operations; no OAS/controller mapping removed or added |
| Operative generator |4 passed; isolated byte-idempotent regeneration of unchanged OAS |
| Entry corrections / R1R2 / candidate / final specification suites |8 /6 /78 /17 passed |
| Prior F1/F2/F4–F6 verification |6 groups passed, including original complexity and example/grant metadata checks |
| Fresh main runtime captures |184 route representations +5 standalone;45 route/status combinations,0 schema violations |
| New complete catalog walks |25 source-admission/HTTP walks,85 schema-valid page bodies, all exact ordered concatenations/unique IDs/final next=null |
| Financial parity |Java/projectLive mark/geometry/DTE/SPOT/RANGE parity;9 session/freshness cases; normalized-Order management/EXIT PROGRESS parity passed. Declared synthetic source/terms, not live validation |
| Documentation build/validate |36 internal operations/295 typed examples;32 public operations/263 response examples; unchanged wire/security except already-accepted F6 delta |
| Native browser |All32 public operations, cURL/search/errors/mobile; no unexpected requests/private instructions |
| Repeat documentation build |Byte-identical to frozen candidate preview: index caab89ce5e35f1c9c6c2ae38b759099a3933d5cc1e647966b4590b6cc011e75c; license d49296fc22d15683bf0608962baec5337440a9a93537d7bf135d4a87be3dd5b8 |

Logs and per-suite counts are in results (transcript line-ending whitespace normalized only); contract logs0–5 map to OAS, operative generator, entry corrections, R1R2,78-case specification and17-case final specification. Complete-suite source/financial/authorization/redaction cases are reported by name in java-final.json; passing counts are finite author evidence, not Product or independent acceptance. Existing optional private-file skips and LibreSSL/JDK/vendor lint notices are retained, not invented failures or claims of live coverage.

At 2026-10-23T00:45:35.282544+00:00, final remote main remained65604784ee4ea6141cab66f7bb482a437cbe6e7b, frozen5377610c worktree remained clean, and unrelated root MCP work was untouched. Measured task-state-to-verification interval 11.3minutes; earlier bootstrap not separately timed; tokens/credits unavailable; no Principal follow-up intervention. No request to the operational backend, service/database/configuration/grant mutation, merge/push, deployment/publication or client work.

**Acceptance recommendation:** ready for narrow independent Kiro re-verification against the successor commit. F3 is untouched; no additional Product decision is needed. Verify the actual before/after traces and canonical cursor path, not merely the1016 count. Independent review and controlled integration/redeployment remain separate future actions.
