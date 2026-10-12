# Wheelwright capability gaps exposed by the October Income Wheel review

Date: October 12, 2026  
Status: **Non-ratified discovery and bounded reconciliation**, not Product design, API specification, trading policy, implementation authorization, or a trade recommendation.  
Canonical intake: **PL-CLI-01**, with existing domain owners mapped below.  
Reconciled baseline: `origin/main` at `5dd03671d77ae287a35d8706de77e5759b90a0af`.

## Executive assessment

Wheelwright should make this review substantially faster and more repeatable. The difficult part is not formatting a recommendation or discovering another CLI verb. It is establishing a coherent, scoped body of evidence and deterministic economic facts before an analyst compares alternatives.

The proposed direction is a governed question workflow: identify the operator's question, resolve authorized evidence and assumptions, derive the facts through shared backend capabilities, expose qualifications, and let the operator or analyst challenge the choices. The CLI presents and composes those capabilities. It must not become a second ProductionAssessor, portfolio ledger, contract interpreter, or recommendation engine.

Three distinctions determine whether this succeeds:

1. **Missing access is different from missing knowledge.** A retained snapshot may lack a public history selector; an accessible snapshot may still lack opening attribution or deliverables. A correctly denied read is neither kind of implementation gap.
2. **Premium receipts are different from economic success.** Meeting a monthly quota while eroding principal can reduce subsequent income capacity. Hypothetical redeployment income is not booked production.
3. **A reproducible answer is different from a confident answer.** Inputs, scope, temporal meanings, formulas, assumptions, versions and exclusions must be recoverable. Provider observations can be faithfully preserved while remaining methodologically uncertain.

This survey strengthens existing direction. It proposes no new Bet, engine, generalized trading framework, or duplicate PL identity. The most useful initial outcome is a trustworthy, qualified deployment review packet, rather than automatic selection of an allegedly optimal portfolio.

## Scope and evidence limits

The trigger was an adversarial review of a ChatGPT October 12 allocation, followed by the Principal's observation that `ww` should accelerate and standardize this class of work. The Principal then requested this detailed gap survey, reconciliation with `origin/main`, and GitHub persistence. That request authorizes this documentation work, not implementation or orders.

Repository observations below are grounded in the committed manual, contracts, backlog and acceptance records at the baseline. This survey did not rerun the installed CLI fitness probe, certify operational services, or inspect every backend capability for absence. A missing public workflow must not be reported as proof that the backend contains no useful implementation. The existing twelve-question probe supplies empirical CLI evidence with its original qualifications.

Financial specimens come from the preceding review of local October 12 exports. They are bounded historical observations, not fresh executable prices or independently ratified accounting. Raw brokerage files, credentials and account numbers are not included here. The production export contains assessments and presentation claims alongside source context; it is not itself the ultimate brokerage authority.

The newer cross-entry CSV and the earlier buy-write/put exports are different snapshots. Some selected contracts changed. This is essential to the gap analysis, not a rounding inconvenience. The uncommitted October 12 IV-metrics implementation in the operator checkout is in-flight work, not an accepted-main capability claimed by this survey.

### Local specimen identity

The following SHA-256 values were rechecked during survey preparation. The source bytes remain private in Downloads; a hash establishes content identity, not completeness, source truth or permission to disclose the original. The requested positions filename with `(1)` was unavailable in the preceding review; the unsuffixed October 12 export below was used. The older separate production report is not included in this identity table and its figures remain conditional context.

| Local export | SHA-256 |
|---|---|
| `wheelwright-buy-writes-2026-10-12 (1).csv` | `bfd4093962ee19c0fdaceaf4a29829c172efc2fe6219af1cb17549a2fcf3bf42` |
| `wheelwright-puts-2026-10-12.csv` | `c58d07ffa725054020f9e896594e368cba4a0ea6a08a208b2e2f04deab219dfe` |
| `wheelwright-positions-2026-10-12.csv` | `c62c44d30d322e64a25399e89419174158f02ba04a82b044598b52a42ecb0ccd` |
| `production-evidence-2026-10 (1).csv` | `5f30029793b927bd4eade87945f951679ff0e0812f71a436a60c51bfdde48b75` |
| `wheelwright-cross-entry-2026-10-12 (1).csv` | `5b880048b626a872f7c94c648b7e8d07786a84ec75c22c524ac0c6f4dc391bda` |

## Reconciliation with what already exists

| Existing home | Established direction or capability | Consequence for this survey |
|---|---|---|
| `roadmap.md`, question-driven north star | Reusable, inspectable `ww run <question>` over trustworthy primitives; answer correctly, reproducibly and quickly | Use named questions as the organizing concept. Command names are not a substitute for missing domain capabilities. No new command grammar is selected here. |
| `roadmap.md`, Trade Finder | Select underlying, familiar structure, approximate expiration neighborhood and qualifying evidence; broker shapes and executes | Inspect and compare supplied contracts without committing Wheelwright to exhaustive exact-strike optimization or brokerage replacement. |
| `PL-CLI-01`, twelve-question probe and proposed remediation | Public reads answered many inventory questions; history was the first hard surface gap; field discovery, structured contracts, context and coverage need work | Preserve that bounded proposed sequence. This financial review adds consumers and falsifiers, not permission to bypass it. |
| `PL-API-03`, Doc 77 | Common capability API; backend owns authoritative state and business logic; clients present | Shared financial derivations belong behind the backend boundary. Existing v1 browser behavior is not an architectural template for v2. |
| `PL-API-02` | Machine-readable HTTP contracts and explicit boundary semantics | New capabilities need truthful typed contracts, null/partial/error meanings and authorization; not a special agent-only API. |
| `PL-PORT-01`, accepted Account loop | Backend-retained immutable sources, processing history, account discovery and Position snapshots; broker-specific acquisition | Reuse source retention, hashes, access controls and snapshot identities. `SYNC COMPLETE` does not establish complete broker history. |
| `PL-PORT-02`, `PL-PROD-EVENTS`, `PL-PROD-NET` | Production accounting and economic events; backend ProductionAssessor; production and erosion separately visible | Assess existing accounting before proposing replacement. Scope, lifecycle attribution and public access are separate maturity questions. |
| `PL-PROD-MISSION`, `PL-PROD-FORECAST` | Monthly target exists; forecast work already identifies prospective redeployment as beyond current-position outlook | Quota feasibility and recycling refine existing work. Do not invent a new forecasting subsystem. |
| `PL-DEPLOY`, capital-state refinements in parking-lot-6/7 | Governed alternatives, WAIT, capital paths and recovery consequences | Stage/wait/recycle comparisons are existing pressure made concrete. Full utilization is not an objective. |
| `PL-DEPLOY-EXPORT` | Machine-consumable deployment evidence, population versus display semantics | Export completeness and selected-contract limitations need explicit declarations. A larger CSV alone does not provide reconciled analysis. |
| `PL-RECIPE-01` | Named, versioned lenses over governed candidate populations | An exploratory volatility lens is not an eligibility gate, a new strategy, or a ratified preference. A question recipe and a decision lens are related but not interchangeable. |
| `PL-EVID-AGE`, `PL-OPS-09`, `PL-EVID-01` | Provenance, targeted re-observation and historical evidence | Reuse held-read/acquisition separation; purpose-specific adequacy and historical reproducibility remain distinct. |
| `PL-EVID-04`, `PL-EVID-05`, `PL-EVID-MVPTA` | Market-priced risk, set enrichment and evidence-quality experiments | IV interpretation and incremental selection value require evidence; exposure enrichment has an existing home. |
| `PL-SEM-01`, `PL-CONV-01` | Semantic integration; observed inventory versus managed economic occurrence | Do not infer a managed Position, Program or lifecycle from ticker/shape/quantity alone. This survey does not start convergence Step 6. |
| `PL-DEC-BEH`, options-domain competence/reference | Governed discipline, whole-position economics, durable mechanics grounding | Quota pressure must be visible without silently relaxing policy. Reuse established options mechanics; research unresolved current facts. |

The new `research/2026-10-12-income-wheel-methodology-notes.md` is useful non-authoritative context. Its $6,000 objective remains an operator objective; feasibility criticism does not change it. Its preferred comparisons, event observations and volatility interpretation remain research, not approved policy. This survey preserves that boundary and converts the recurring analytical burden into capability questions.

## Gap survey

The identifiers G1–G14 below are local discussion labels, not new backlog identities. “Gap” means insufficiency for this end-to-end review; it does not universally mean absent software.

### G1 — Question context and explicit scope

**Question:** What exactly are we evaluating, for whom, over what period and capital pool?

The review needed Income Wheel rather than Growth or Buy-and-Hold, a monthly target, a cash constraint, a maximum DTE, a final expiration, excluded governance classes, and an explicitly assumed Monday share sale. It also needed accounts and Program membership that could not safely be inferred from filenames or authorized account access.

A candidate backend-owned context should distinguish observed account facts, operator declarations, effective policy, and scenario-only assumptions. A target is not a ranking rule; outside-allocation holdings may still affect total economic exposure. Missing quota scope should yield named alternative calculations or a focused question, not an arbitrary account merge.

**Owners:** PL-CLI-01, PL-PROD-MISSION, PL-SEM-01, PL-PORT-01. **Open:** objective/Program binding and versioning. Do not create a broad ontology merely to store this session's parameters.

### G2 — Evidence inventory, selection and coherent observation boundaries

**Question:** Which evidence supports this answer, and what is missing?

Downloads contained successive exports, similarly named files, different schemas and mixed position sections. File modification time, export time, provider observation time and brokerage effective date are different facts. “Latest” must be relative to a declared subject and observation boundary, not simply the last filename.

Reuse backend artifact retention and processing results where supported. A market-analysis bundle also needs its exact source identities, schema versions, population definition, observation intervals and qualifications. A source file can be retained successfully while semantic processing fails. Reading a held bundle should not acquire new market evidence incidentally.

**Owners:** PL-PORT-01, PL-DEPLOY-EXPORT, PL-API-03, PL-EVID-AGE. **Open:** supported analytical-export intake and coherent bundle semantics. Do not assume brokerage CSV intake already supports Wheelwright's own deployment exports.

### G3 — Reconciled period production, with drill-down

**Question:** How much qualifying October production is established, and why?

The reviewed report claimed $84.45 known cash production: $56.77 appreciation plus $27.68 Treasury discount, with SOURCE_INCOMPLETE. Existing October 16 buy-writes carried $1,477.34 of September-booked premiums. Those premiums do not become October receipts because expiration occurs in October. A separate older account report contained $123.67 net option premium; combining it requires established quota scope and overlap treatment.

The CLI should expose the backend's period result and its event/row lineage, included and excluded categories, source coverage, opening/closing debits, attribution failures and unresolved amounts. It must distinguish the operator's production definition from net strategy result: existing ratified net strategy result excludes structural income. A zero unresolved amount does not prove complete evidence.

One apparent contradiction deserves a future accounting investigation: the reviewed ARKK sale/cost facts imply $86.18 erosion while the report summary shows zero erosion. This survey records a diagnostic specimen, not a newly confirmed runtime defect or remediation. Recover source rows, scope, method and version before disposition through `docs/bugs/` if demonstrated.

**Owners:** PL-PORT-02, PL-PROD-EVENTS, PL-PROD-NET, PL-API-03. **Open:** cross-account/Program quota scope and current assessor applicability. Publishing an existing result is a different task from repairing its semantics.

### G4 — Deployable capital and future release

**Question:** What cash can be used now, and what might be reusable later?

Available cash, share notional, option collateral, net opening debit, settled funds, broker buying power and hypothetical liquidation proceeds are not interchangeable. The review used $51,900 immediately available and $36,561.55 of existing buy-write share capital; that does not establish a guaranteed $88,461.55 cash receipt on October 19.

A useful model represents encumbrances and conditional release events with their evidence, sale assumptions, erosion, assignment, fees and availability dates. Monday liquidation is an explicit scenario instruction, not proof of Monday settled cash. Premium reinvestment must be specified once. Existing shares must not appear simultaneously as released cash and retained inventory.

**Owners:** PL-DEPLOY, PL-PORT-01, PL-DEPLOY-BAL, PL-PROD-FORECAST. **Open:** broker/account-specific availability and unresolved working orders. Partial capital information must constrain feasible conclusions.

### G5 — Contract identity and corporate-action qualification

**Question:** What rights and obligations does this row actually represent?

Standard 100-share arithmetic is conditional on a standard contract. A root such as ETHA1 cannot safely be normalized into ETHA inventory or treated as a duplicate without deliverable evidence. The review encountered both roots alongside an actual reverse-split context.

Backend representations should expose established underlying/contract identity, expiration, right, strike, multiplier, deliverable, adjustment status and source. Unknown terms remain unknown. Current held-position remediation already proposes structured contract fields; do not repeat that work as another CLI parser.

**Owners:** PL-CLI-01, PL-SEM-01, PL-CONV-01, PL-PORT-01. **Open:** authoritative adjusted-contract source and occurrence linkage. Inventory identity alone does not establish economic continuity.

### G6 — Candidate population and selection provenance

**Question:** Are these all feasible choices, or merely selected examples?

The earlier buy-write export had 98 rows and no duplicate symbol/expiration pairs. That establishes one selected row per available pair in that export, not that only one exchange contract exists. The newer cross-entry export omitted expiration and open interest; DTE is an insufficient replacement for durable contract identity.

A useful capability exposes population scope, exclusions, contract-selection rule/version, snapshot identity and omitted alternatives. It distinguishes candidate discovery, governance, absolute acceptability, and comparative preference. “Best among exported rows” must never become “optimal contract.” Exact-chain search remains a separately justified capability subject to Trade Finder's broker-handoff boundary.

**Owners:** PL-DEPLOY-EXPORT, PL-DEPLOY, PL-RECIPE-01, PL-API-03. **Open:** sufficient comparison population and economic-support boundaries. No new selection policy follows from this observation.

### G7 — Shared whole-position economics

**Question:** What cash is received, what capital is exposed, and what happens in each outcome?

For a standard one-contract buy-write at stock price S, call strike K and premium p per share, gross premium is 100p, gross share outlay is 100S, net opening debit is 100(S−p), expiry breakeven is S−p, and if-called profit before costs is 100(K−S+p). For a cash-secured put, gross reserve is 100K, premium is 100p, expiry breakeven is K−p, and maximum profit is the premium. Multipliers, fees, nonstandard deliverables and execution conventions must qualify these formulas.

The initial six-name portfolio arithmetic was approximately $50,521.50 share outlay and $717.50 midpoint premium: 1.42% gross period premium yield. Its if-called economic profit was $946. A joint 5% underlying decline at expiration instead implies approximately −$1,808.58 before costs under standard-contract assumptions. Neither premium receipt nor an annualized yield describes that loss.

These are shared deterministic consequences, not AI-generated calculations. Clients may present and project them; backend capabilities own authoritative evaluation and qualifications. Every yield requires an explicit numerator, denominator and period. Prod v0, premium yield, maximum profit and expected return must not share a misleading label.

**Owners:** PL-DEPLOY, PL-API-03, PL-SEM-01; AR4/AR5. **Open:** supported structures and lifecycle boundaries, including early assignment and dividends. A terminal payoff model is not a path-risk model.

### G8 — Buy-write versus put comparability

**Question:** Which structure offers the better bargain for this mission?

Comparisons must align or explicitly vary expiration, strike, moneyness, delta convention, capital convention, execution assumptions and inventory consequences. Net buy-write delta is not the short call's delta. Different-strike CSP and buy-write premiums are not an apples-to-apples income ranking.

The snapshot's KRE $69.50 put reserved $6,950 and offered $107.50 midpoint premium, versus approximately $6,980.50 share outlay and $117 for the $70 buy-write. EWZ's $41 put offered substantially lower premium and a lower entry threshold than its $44 call buy-write. Those are different exposures, not proof that one structure is intrinsically better.

Put/call economic relationships provide a check on same-strike, same-expiration terminal outcomes under stated assumptions; cash timing, dividends, early exercise, financing, settlement and broker rules still differ. Broker trade construction remains downstream.

**Owners:** PL-DEPLOY, PL-SEM-01, options-domain competence/reference. **Open:** comparable-pair population and execution evidence.

### G9 — Execution quality and quote adequacy

**Question:** Could these displayed economics reasonably be obtained?

A midpoint is not a fill. Relative bid/ask spread is useful but incomplete without quote time, size, stock execution side, volume, open interest, market session and order-size sensitivity. An underlying metric timestamp does not refresh the option quote or Greeks. Open interest alone does not prove current depth.

Report bid/mid/ask economics and cost sensitivity where evidence permits, with separate timestamps and missing fields. Define adequacy for the question being answered: a historical comparison can tolerate evidence that cannot justify a live limit-price decision. Acquisition failure must preserve prior evidence while exposing its age and limitations.

**Owners:** PL-EVID-AGE, PL-OPS-09, PL-DEPLOY-EXPORT, PL-API-03. **Open:** purpose-specific adequacy contracts; no freshness threshold or automatic refresh policy selected.

### G10 — Volatility interpretation and incremental value

**Question:** What do these metrics mean, and do they add useful selection information?

Preserve raw rank/percentile decimals separately from displayed percentage values. HV30 and IV−HV30 may already be volatility points. Preserve nulls, provider, source variant and timestamps. Do not substitute option-specific midIv/smvVol for underlying-level IV Rank or IV Index.

The original observations put EWZ TOS rank near 67.1 and TW near 21.0; USO TOS near 20.7 and TW near 56.0. Source methodology reverses their ordering. XLU's TOS/TW difference is also large. ETHA's rank was negative and became more negative in the newer snapshot. These are evidence-quality questions; silently clamping, averaging or substituting values hides them.

Rank's range position and percentile's observation-frequency position can legitimately disagree. Exact TOS/TW histories, extrema updates, corporate-action treatment and field-specific timestamps remain unestablished. Provider IV−HV30 also does not always reproduce from independently exported index/HV values. Asynchronous measurement is a hypothesis, not a verified explanation.

Display and provenance can improve understanding now. A claim that high rank improves sustainable cashflow requires point-in-time, out-of-sample comparisons controlling for structure, moneyness, DTE, execution, concentration and erosion. Compare no-IV, absolute-IV, rank, percentile and IV/HV lenses on identical populations; account for missingness and provider-method sensitivity. Do not optimize against premium alone or introduce IV gates through this survey.

**Owners:** PL-EVID-04, PL-EVID-MVPTA, PL-DEPLOY-EXPORT, PL-RECIPE-01, PL-EVID-01. **Open:** reproducible provider methods and incremental-value evidence.

### G11 — Portfolio exposure and event context

**Question:** What risks are we adding to the risks already held?

Ticker diversity is not factor diversity. Existing DRAM, miners/uranium, ETHA and SPYI affect semiconductor, commodity, crypto and equity exposure. Proposed KRE/XLF overlap in financials; EWZ adds country/FX and financial/commodity exposure; TLT/XLU can share rate sensitivity. XLE and USO are related but differ in equity versus futures exposure.

A useful capability reports holdings-weighted exposure with explicit classification/holdings sources and dates, outside-allocation context, unknown coverage and scenario sensitivity. Qualitative factor overlap is useful without pretending to have a validated covariance model. DANGER exclusion addresses structural governance, not all economic risk; REVIEW and UNKNOWN are not safety certifications.

Event calendars and corporate actions should carry primary-source provenance and validity intervals. Friday expiration does not eliminate weekend exposure if shares persist until Monday. Future studies must validate current issuer holdings and events; this survey does not ratify the earlier research's dates as maintained Product data.

**Owners:** PL-EVID-05, PL-DEPLOY, PL-SEM-01, PL-EVID-01. **Open:** minimum useful enrichment, update responsibility and uncertainty presentation.

### G12 — Multi-window quota feasibility and capital recycling

**Question:** What would need to happen to reach the target without counting the same dollars twice?

Model October 12, 19 and 26 as deployment/release events and October 30 as the final allowed expiry. Validate each proposed trade's DTE at its actual entry date. Date availability is not evidence of a tradable chain or acceptable premium. Never count October 16 September-booked premiums again.

A transparent sensitivity model uses C = $88,461.55 total option capital, initial deployment D, initial premium P, and verified production B. If principal is unchanged, all assumed Monday proceeds are available, the initial trades expire October 23, and premiums are not reinvested, then October 19 capacity is C−D and October 26 capacity is C. A constant hypothetical future-cycle yield r gives:

`modeled October production = B + P + r × ((C−D) + C)`.

At B = $84.45, the initial ChatGPT allocation implies approximately 4.11% per future cycle to reach $6,000. Waiting with all cash implies approximately 3.34%. These are scenario requirements, not yield forecasts: future quotes were absent, cycles are shorter, and sale erosion/settlement can reduce capacity. Broader valid production scope changes the requirement. A model should expose these sensitivities directly rather than force the target through a portfolio optimizer.

**Owners:** PL-PROD-FORECAST, PL-PROD-MISSION, PL-DEPLOY, PL-PORT-02. **Open:** future opportunity estimates, uncertainty and capital-availability semantics.

### G13 — Alternatives, waiting and analytical objectives

**Question:** How do deploy, stage and wait compare under the same evidence?

The requested maximum-premium, volatility-informed, lower-risk and delayed portfolios are different objectives. None is synonymous with sustainable Income Wheel success. Each comparison should preserve its constraints, instrument support, governance, risk exposure, residual cash, premium assumptions and downside results. A mathematical maximum over exported rows can be concentrated and unexecutable; label it as such.

Waiting sacrifices an observable current premium opportunity, not guaranteed profit. The refreshed six-name comparison offered $674.50 midpoint premium rather than the earlier $717.50, and XLE's selected strike changed. That difference cannot be attributed entirely to a same-contract price move. A staged comparison should show both the forgone receipt and additional future capacity, without predicting that volatility will expand.

**Owners:** PL-DEPLOY, PL-RECIPE-01, PL-DEC-BEH. **Open:** authorized comparison objectives and supported constraints. Lower risk needs a named dimension; low premium or a defensive label does not establish lower total risk.

### G14 — Reproducible question outputs and analyst handoff

**Question:** Can another operator or agent recover the answer without repeating the investigation?

A candidate review packet should bind context, source/snapshot identities, coverage, observation times, derivation versions, economic results, scenarios, exclusions and unresolved questions. Immutable recoverable content matters more than an ID that points to changing data. Later refresh should produce distinguishable evidence, not overwrite the historical basis of a recommendation.

Machine output should retain units, temporal qualification, identities and partial/error states through composition. Human output should answer the question first and expose drill-down. Discovery should describe capabilities and field meanings so agents do not reverse-engineer CSV headers repeatedly. Read, acquire, evaluate, save an analysis and execute a trade remain distinct actions.

A question catalog can compose supported capabilities and return a qualified answer or specific missing prerequisite. It must not conceal client-owned authoritative arithmetic behind a recipe, silently widen account grants, or convert a recommendation into an order. Reuse existing replay concepts where applicable without claiming ADR-019 already covers this broader deployment packet.

**Owners:** PL-CLI-01, PL-API-02/03, PL-DEPLOY-EXPORT, PL-EVID-01; AR6/AR8. **Open:** minimum packet contract, retention and capability discovery. No new persistence technology is implied.

## Backend, CLI, analyst and outside-source responsibilities

| Responsibility | Appropriate role |
|---|---|
| Retain source facts, grants, timestamps, admitted snapshots and business semantics | Backend, grounded in external system authority |
| Reconcile period economics, capital, supported payoff/scenario calculations and governed comparisons | Shared backend capability |
| Select explicit inputs, request acquisition, render results, filter/sort/project fields and compose commands | CLI or other client; ordinary Unix tools may calculate clearly labeled exploratory subtotals of reported facts |
| Challenge assumptions, compare tradeoffs, propose falsifiers and explain a recommendation | Human/AI analyst; recommendation remains distinguishable from facts and policy |
| Supply brokerage reality, provider methodology, issuer holdings, adjusted deliverables and current event facts | Appropriate external authority; Wheelwright records source, time and limits |

The goal is bounded external research, not a prohibition on it. Durable options mechanics should not require repeated web searches. Undocumented provider methods, a new adjusted contract, issuer holdings or current event changes may require primary sources. A missing method should remain missing if research cannot establish it; a language model must not fill the gap with plausible certainty.

## Candidate acceptance and falsification specimens

These are proposed acceptance examples for later design, not tests added by this documentation work.

| Specimen | Required observable behavior |
|---|---|
| September opening, October expiration | Exclude September receipt from October; show both dates and lineage. |
| Production report SOURCE_INCOMPLETE, unresolved total zero | Preserve incompleteness; do not infer complete history or a final quota gap. |
| Two account reports and overlapping exports | Require declared quota membership, match admitted evidence appropriately, never sum presentation totals blindly. |
| Erosion summary disagrees with recoverable sale/basis facts | Surface inconsistency and dependent limitations; do not conceal it in net income. |
| Older and newer candidate snapshots, XLE strike changes | Preserve exact contract identity and separate selection change from price change. |
| Cross-entry omits expiry/OI | Report unsupported contract/liquidity conclusions; do not invent them from filename or another strike's row. |
| Standard versus adjusted ETHA1 | Withhold standard-multiplier economics unless deliverable is established. |
| TOS/TW ranking reversal and negative rank | Preserve both/raw values, qualify method and range; no silent clamp/fallback. |
| Fresh underlying IV with older option evidence | Separate timestamps and adequacy; no claim that every field refreshed. |
| High premium portfolio with negative downside economic result | Display receipts and loss separately, with capital capacity consequences. |
| Put and buy-write differ in strike/DTE | Explain mismatch and compare whole-position consequences; no raw-premium winner. |
| Monday sale assumption with uncertain settlement | Show conditional release and usable-cash boundary, not guaranteed unchanged principal. |
| Three deployment windows | Maintain one principal ledger; exclude old receipts; state premium reinvestment convention. |
| Cash waiting versus immediate deployment | Quantify foregone current premium and preserved capacity without forecasting better future prices. |
| Many tickers but common factors | Show existing plus proposed overlap and exposure coverage, including outside-allocation holdings. |
| Correctly denied Account or quote read | Preserve denial and partial answer; do not broaden grants or misclassify it as missing software. |
| Held evidence read | No incidental provider acquisition; explicit refresh has independent outcomes. |
| Replay after refresh or policy revision | Recover original inputs/versions and distinguish historical answer from current recomputation. |

## Suggested investigation sequence and stopping points

This is dependency reasoning, not a changed Principal priority or implementation plan.

1. **Finish the existing bounded feasibility questions first.** Historical Position inspection, field discovery, established contract fields, context and coverage remain the recorded CLI remediation direction. Determine what existing retained sources, account snapshots and ProductionAssessor can actually establish before inventing replacements.
2. **Demonstrate one qualified production/capital answer.** A selected Program/account scope and period should yield a recoverable production result, exclusions, uncertainty and conditional capital-release table. A truthful partial answer is useful; opening attribution need not be globally solved to expose known receipts.
3. **Demonstrate one supplied-contract comparison.** Use a frozen, declared candidate population and supported standard contracts. Compare bid/mid/ask, cash, payoff and downside under shared backend semantics. Stop before full-chain search or a generalized optimizer.
4. **Compose a bounded deployment-review question.** Reuse those results for stage/deploy/wait and target sensitivity. Show current constraints and reasons the question cannot be fully answered. Obtain operator evidence of usefulness before extending command/catalog surface.
5. **Evaluate enrichment and ranking hypotheses separately.** Factor/event context may materially improve interpretation. IV's incremental ranking value requires a research design, not immediate implementation because a column is populated.

Good enough initially means a second analyst can reproduce the qualified arithmetic and identify unsupported conclusions without inspecting raw private files or reconstructing semantic rules. It does not mean every lifecycle is resolved or the target is attainable. Measure end-to-end time, manual joins and interventions, answerability, coverage, contradiction detection and replay consistency. Set numeric performance targets only after measuring a representative workflow. Preserve correct abstentions alongside successful answers.

Revisit scope when repeated questions remain blocked by the same primitive or semantic gap. Stop adding convenience features when a shell composition works clearly and the dominant constraint is evidence or semantics. Trustworthy partial conclusions have more value than more commands over unqualified data.

## Open decisions and unresolved research

- Which Accounts/Programs and production categories are included in the monthly target? Is Treasury discount part of this operator objective while excluded from options net strategy result?
- Which existing backend production/history capabilities can be exposed directly, and which require semantic repair or new evidence? No absence claim is established by this survey alone.
- What is the smallest coherent analysis context and immutable evidence packet? How much replay can reuse existing governed-decision machinery?
- What source establishes adjusted deliverables, per-field IV timestamps and TOS/TW algorithms? Can negative ranks be explained from actual histories?
- What financial evidence suffices to establish deployable cash and Monday availability for each account regime?
- Which contract-comparison and scenario consequences belong inside the current Trade Finder boundary, and which stay in brokerage tools?
- What exposure enrichment is useful enough without creating a false quantitative risk model?
- Who may request refresh, save scoped analysis context and view a multi-account packet? Existing grants are not automatically grants for new capabilities.
- Which minimal operator question should be selected next after existing authorized work? This survey does not select a new implementation workstream.

## Reconciliation Completion Record

**Intake:** Existing PL-CLI-01; no new identity. The G-labels are local survey references only.

**Strategic disposition:** Strengthens the existing question-driven north star and Trustability direction, with existing production, deployment and capital-path consumers. No new Bet, horizon, priority, quota change or `roadmap.md` amendment is warranted by this discovery.

**Architectural disposition:** Refines existing AR1 (authoritative state), AR3/4/5 (alternatives/consequences/acceptability), AR6 (shared computation/context), AR7 (lifecycle/outcome linkage) and AR8 (reproducibility). Doc 77 already selects backend authority for v2. No new engine, database, service boundary, architecture decision or `architecture-roadmap.md` amendment is warranted.

**Parking-lot disposition/mapping:** Retain PL-CLI-01 as the question-workflow consumer; retain all existing domain owners in the mapping table. This bounded survey is reconciled; broader CLI/API, convergence, recipe and forecasting items are not declared completed or newly implementable.

**Why-state:** This survey, the October 12 methodology notes, existing twelve-question probe/remediation notes and an appended project-journal entry.

**Next authorized mode:** No implementation from this survey. Future Product design, feasibility experiments, policy studies or implementation require separate selection/authorization. The current authorized work is documentation reconciliation and GitHub persistence only. Gate Experiment 001 remains STAGED, unstarted, with no immutable candidate.

## Repository references

- [Authority map](../README.md), [idea intake](../foundations/idea-intake-reconciliation.md), [project memory](../bootstrap/project-memory-protocol.md).
- [Current strategy](../roadmap.md), [architecture pressures](../architecture-roadmap.md), [API v2 guardrails](../77-api-v2-architectural-guardrails.md).
- [CLI/API/convergence and twelve-question probe](../parking-lot-10.md), [exports and recipes](../parking-lot-8.md), [semantic integration](../parking-lot-9.md).
- [Core production/evidence/deployment identities](../parking-lot.md), [capital-path refinement](../parking-lot-6.md), [recovery/release refinement](../parking-lot-7.md), [MVPTA](../parking-lot-2.md), [evidence-age refinement](../parking-lot-3.md).
- [Working CLI manual](../cli/ww-man.txt), [Account evidence loop](../cli/ww-account-evidence.md), [October methodology research](../research/2026-10-12-income-wheel-methodology-notes.md).
- [Options competence](../foundations/options-domain-competence-contract.md), [domain reference](../foundations/options-domain-reference.md), [journal continuation](../journal/project-journal-5.md).
