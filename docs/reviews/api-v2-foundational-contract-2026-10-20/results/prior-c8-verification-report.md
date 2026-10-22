# Bounded candidate correction verification report

**Ready for independent re-review as an isolated candidate, not accepted as an implementable or operative API.** The six reported Major themes are corrected at contract level. The six Moderate themes are addressed to the Principal-supplied descriptions. Their exact original review text/probe payloads remain unavailable; no exact Kiro-probe reproduction is claimed.

## Identity and preservation

- Original candidate: `847315f1b2bf2964db20f417c9936e961eb5f750`, branch `codex/api-v2-foundational-contract-2026-10-20`, base `2f319d514960d4d69afe66302c56db3cc7c640d0`.
- Correction branch: `codex/api-v2-foundational-correction-2026-10-21`. Exact successor SHA is the commit containing this file (`git rev-parse HEAD`) and is reported in the delivery message. A commit cannot contain its own hash as file content.
- Correction worktree: `/Users/bollich/kiro/options-candidates/api-v2-foundational-correction-2026-10-21`.
- Remote main used and rechecked: `72c602f8740fcbd9c25d67a13b35d81385b6e76b`. Original candidate worktree remained clean at its original SHA; main worktree remained unchanged. No rebase, reset, push, merge or operative-file change.
- Exact changed-file inventory: [results/changed-files.json](results/changed-files.json). Every changed file is under this review directory. Artifact hashes are in [results/artifact-manifest.json](results/artifact-manifest.json); source identities in [results/source-identities.json](results/source-identities.json).

## Authority and discovery

Root AGENTS → docs/AGENTS → Codex cold start → docs/README A–F authority → maintained subject owners and ASSIM-0002 → applicable ADRs/guardrails/contracts/task-state → current candidate inputs → accepted CLI behavior → source and deterministic fixtures. See [authority-and-evidence.md](authority-and-evidence.md) for exact governing/source line witnesses, sequence indexing, state boundaries and preloaded steering disclosure. Gate001 remained staged/inactive. No authority owner or assimilation ledger was changed.

Load-bearing witnesses include `docs/README.md:35–54`, `docs/07c-adrs.md:521–546` (ADR-016 association authority), `docs/knowledge/domain/positions-and-governed-quantity.md:22–72`, `docs/assimilation-obligations.md:89–109`, `docs/cli/tt-live-panel.md:3–58`, `docs/cli/ww-positions-command-2026-10-15.md:3–35`, and new checkpoint `docs/discovery/api-v2-original-current-economics-checkpoint-2026-10-20.md:3–13` at remote main. Its pinned copy is [evidence/approved-economics-checkpoint.txt](evidence/approved-economics-checkpoint.txt). This is bounded Principal-approved candidate direction, not silent ratification of unresolved maintained meaning.

## Contract and preserved architecture

OpenAPI 3.1.1 has 31 path items: 18 candidate GET paths and 13 reused path-item references, 77 local typed schemas, zero new writes. [contract-inventory.json](contract-inventory.json) enumerates **every** route and schema; [resource-map.md](resource-map.md) provides meaning, lifecycle, scope and relationships. Modular dependencies resolve against unchanged existing contracts in this checkout. Existing Account/User/Artifacts/attempts/transactions/quote capabilities are referenced, not reimplemented.

Unique Position GUIDs, terminal CLOSED/new GUID reopening, immutable Constructions and exact immutable Model versions, predecessors, backend financial interpretation, client presentation and inspectable unclassified constituents are preserved. No Portfolio, Execution, independent-evaluation or synchronization root, securities master, tax-lot allocator, assignment selector, operator-association workflow, Strategy engine or trade submission is added. The only added resource-family reads are `/v2/holdings` and `/v2/holdings/{holdingId}`, restoring distinct custody observation inspection lost by the original candidate.

## Corrections and limitations

[correction-ledger.md](correction-ledger.md) and [results/correction-ledger.json](results/correction-ledger.json) distinguish reported finding, unavailable original input, new falsifier, observed result, correction and uncertainty. Local finding numbers are thematic groupings of the task, not invented Kiro citations. [runtime-invariants.md](runtime-invariants.md) separates enforceable local schemas from cross-resource/source/runtime obligations.

1. **Economic signs:** Account receipts positive, payments negative; basis/fees positive magnitudes; opening/estimated closing/realized/gross/net separate; explicit quantity/multiplier/price units. Debit cases cannot adopt a competing credit-only P/L interpretation. Worked credit Iron Condor, debit BWB, protective put, LEAPS and rolled covered call are checked.
2. **Conservation:** owned allocations reference one canonical broker holding observation; aggregate eligible coverage does not allocate it again or select specific shares. Account 250 versus150+150 produces residual-50 and dependent Position conflict. Two separately sufficient100-share claims cannot jointly consume100 eligible shares. Residual is not buying power.
3. **Association:** claim basis, Account, subjects and actual predicate witnesses matter. A typed holdings pointer cannot prove an opening Order or package membership. Unknown association remains unknown. Broker reservation is distinct from aggregate economic coverage.
4. **Holdings:** BrokerHolding independently retains quantity, contract, source cut, timestamps, original evidence and qualified reported MV/P&L/capital requirements. SourceInventory is a projection of that same observation, not a second store. Capital requirement is exposed only if actually reported/admitted; no universal provider field or margin computation is claimed.
5. **Authorization:** public Instruments accept reference evidence only; private source and Order-derived results require their own grants through direct reads, summaries, expansions, constituents, history and Audit. Position-only permission redacts restricted management/Order identifiers and dependent values/geometry. Runtime enforcement is not implemented or certified by these design oracles.
6. **Examples:** unknown required opening cost suppresses exact gross-payoff geometry; supported CC strike half-line is available; unclassified leaves retain generic computed geometry; allocation quantities reconcile; symmetric butterfly cannot acquire BWB recognition. Added CSP, Buy-Write and Iron Condor typed specimens. Buy-Write requires evidenced coordinated opening; CSP requires enough evidenced cash.

## Original/current/cumulative detail

`Evaluation.economicComparison` is optional and typed. [examples/economic-history.json](examples/economic-history.json) and the Position resources demonstrate original/current Constructions and predecessor links. Ten closed call occurrences document2250 total opening premiums including current call, -800 actual closing cash flow and22 fees, yielding1428 documented net option cash flow; closed calls realize1200 gross/1180 net. Original shares10000 remain separate; economic BE85.72/share is not synthetic broker tax basis10000. Current call +250/-100 estimate yields150 gross unrealized; total package also includes the specified share-value change.

Original put95/300 supports historical floor-800; replacement90/400 supports current stated-package floor-1400. Historical protection is not current and the latter excludes earlier premiums/fees. LEAPS paid2000 then sold2500 realizes500 gross/498 net; replacement3000 is separately documented. Call rights never become owned shares. Partial-history example retains valid original/current evidence while withholding lifetime totals. Continuity is explicitly supplied for these synthetic specimens; no general roll/split/recombine rule or intermediate historical inventory is fabricated.

## Verification results

| Layer | Observed result | What it proves / limit |
|---|---|---|
| Original baseline | 216 pass: original33 Python +183 Node | Independently rerun unchanged original; not Kiro's unavailable probes |
| OpenAPI structural validity | PASS inside candidate suite | OpenAPI validator resolves unchanged modular references; local schemas checked |
| Corrected Python suite | **78 pass** | Typed resources/examples, 16 NEWLY CONSTRUCTED negative probes with valid controls, identities/history, scoped association/authorization oracles, exact financial and reconciliation specimens |
| Expanded tt live replay | **8 pass** | Actual repository projectLive on offline fixtures; field meanings, exact tails/breakevens, strike range, spot, DTE, exit progress, opening/closing money, working Order terms, stale/absent/ambiguous evidence |
| Unchanged precedent suites | **180 pass** | Existing deterministic repository checks, including provisional behavior without promoting it to Product acceptance |
| Total successor | **266 pass** | Sum of distinct author checks above; no live/runtime/Product acceptance claim |
| Runtime-only invariants | Registered, selected finite counterexamples pass | No deployed enforcement, complete recognizer, tax-lot behavior or live broker truth |
| Patch hygiene | `git diff --check` pass | No whitespace patch errors |

Exact commands, environment and results: [results/validation-results.json](results/validation-results.json), raw `results/contract-validation.log`, `tt-live-equivalence.log`, `product-precedents.log`. Test dependencies were pre-existing; no installation. HTTPS-library LibreSSL warning in Python is unrelated to these offline passing checks.

## Source parity and inaccessible evidence

The 23-row [source-coverage.json](source-coverage.json) retains actual brokerage response paths, acquisition, normalization/retention, interpretation, proposed fields, missing-evidence behavior and exact repository code/test citations. Rechecked `scripts/tastytrade.mjs:197–231`, `scripts/tastytrade-live-domain.mjs:40–58,228–262,429–442`, `scripts/tastytrade-payoff-render.mjs:7–80`, Java `TastytradeHoldings.java`, `PositionReadService.java`, and the matrix's Fidelity/quote/transaction witnesses. Actual source supports bounded paths; source-code presence is not universal API availability. No live `tt`, `ww pull`, broker HTTP, database mutation or Java runtime service was run.

Expanded replay compares four sanitized fixture rows: XLF/UNG/EWZ/XLE. Standard USD100-share deliverables are explicit assumptions where the fixture does not prove them. BWB exact synthetic tails remain-700/-1700, apex300 and roots97/103. Richer clients receive affine coefficients and exact coordinates, never a glyph template. Stop trigger/limit comparisons are provisional source facts, not guaranteed exits. Manual GTD means recorded review convention only; notifications/timed closing are not established. Experimental movement arrows remain outside accepted requirements.

Unavailable: Kiro full report/original sixteen inputs; private original brokerage files; live provider behavior; complete Account/lifetime histories; comprehensive adjusted/mixed-expiry evaluation; runtime authorization; production implementation. Reported geometry-experiment results are not independently accepted here. No synthetic witness demonstrates broker truth or Product acceptance.

## Open questions and Principal involvement

[decisions.md](decisions.md) preserves Execution, Portfolio membership, full split/recombine lifecycle, Contract topology, discretionary basis, synchronization identity and future naming as open/deferred. Specific-share/operator association was explicitly excluded by the Principal; no hypothetical brokerage issue was used to reopen it. None blocks this bounded reviewable OAS. No Product decision was made for the Principal.

One Principal intervention clarified unavailable review provenance and authorized new probes. No further intervention is required to deliver this pass. Preloaded steering influenced retrieval and specimen selection, not evidence standing. Internal repository navigation sufficed for authority/source discovery; linked primary public mechanics references were re-opened as financial grounding. Exact original review payloads could not be recovered through navigation.

## Time, usage and review recommendation

Opening recorded time04:43:06 UTC; final report checkpoint 05:11:01 UTC October21,2026: **1675 seconds combined retrieval/execution/report preparation**. Separate retrieval timing was not instrumented; raw logs carry test durations. Git commit/final reporting follows. Token and credit consumption are not exposed and are not estimated.

Proceed to independent adversarial re-review of this isolated successor against the original commit. Findings are addressed at candidate level, not declared accepted. No implementation, operative specification promotion or unresolved Product ratification follows from these tests.

CURRENT STATE: Corrected isolated typed candidate passes266 bounded deterministic checks; original candidate/baseline preserved; original Kiro probes unavailable.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Inspect and compare the committed candidate package during independent re-review; no implementation or promotion is authorized.
