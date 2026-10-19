=== Context Gathering Summary ===
FOUND: All 42 BUG records (intended semantics + diagnosis), bug governance README/INDEX, Velvet Rope status/derivation rules, gen-29066 disposition and DTE discrepancy, research executive conclusions for ~15 docs, partial-collar and EVA-001 dispositions, review verdicts, spike recommendations, ops-model corrections, tracking/size facts
NOT FOUND: No "technically correct"/"worst kind of correct" hits. Practitioner-corpus bodies, muse-raw, external-artifacts, reference-data XLE fixture, velvet-rope 02–04 bodies, and review bodies were not read in depth. Canonical integration was checked by grep only (absence is inferred).
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
S2 SURVEY (read-only, HEAD bcbc291). The phrases "technically correct" and "worst kind of correct" do not appear anywhere in scope (grep across all S2 .md files, 0 hits, verified). "Integrated?" means I grepped docs/foundations, 07-architecture-current.md and 07c-adrs.md for the key concept. NOT FOUND is a grep-negative result, not a proof.

## 1. COVERAGE LEDGER
- docs/bugs/: 44 files, 4,396 lines. INDEX.md and README.md read FULL. All 42 BUG records PARTIAL: header/status, "Intended semantics violated", "Diagnosis/root cause", Principal sections. BUG-033 Diagnosis read FULL. BUG-011 lines 1–30.
- docs/research/ (md only): 62 files, 17,744 lines.
  - FULL: partial-collar README, PRINCIPAL-REVIEW, REPORT; eva-001 README, ROUND-1/2, DATA-AUDIT, CONVERSATION-RECOVERY.
  - PARTIAL (exec-conclusion sections): covered-call-delta-band memo, fidelity continuity, q0-friction-analysis, q0-rabbit-hole, spy-growth-overwrite, wheel-family, income-wheel notes, program-design, primary-evidence-upgrade, growth-capital-protection, conversation-record, sosnoff, academic-register.
  - HEADER-ONLY: practitioner-corpus/* (≈7,000 lines), external-artifacts/*, muse-raw/*, METHOD/DATA/PROTOCOL, reorientation memo/analysis, next-wave, comparative landscape, growth-overwrite-taxonomy, muse-liquidity-synthesis, kiro-op-model.
- docs/reviews/: 11 files, 685 lines. HEADER-ONLY plus verdict lines.
- docs/velvet-rope/: 5 files, 1,377 lines. PARTIAL: 01-req scope/VR-7–16 and 00-domain status derivation; 02/03/04 headers.
- docs/universe/: 7 files, 1,778 lines. PARTIAL: disposition summary, DTE-DISCREPANCY FULL; requirements/design headers.
- docs/engineering-spikes/: 3 files, 599 lines. PARTIAL (Conclusion/Recommendation).
- docs/experiments/: 5 files, 623 lines. PARTIAL: ops-model-corrections §§0–2; others header.
- docs/supplementary/: 1 file, 183 lines. PARTIAL (pattern lines).
- docs/historical/: 1 file, 10 lines. FULL.
- docs/reference-data/: 3 files, 938 lines. HEADER-ONLY.
- docs/technology-quality/: 1 file, 69 lines. PARTIAL (§4–5).

Partial-collar git-tracking (verified):
- `git ls-files docs/research/partial-collar-test1 | wc -l` = 54 tracked files: code/*.py, data/*.json manifests, requirements-lock.txt, .gitignore, 5 md files.
- .venv: 0 tracked. It is gitignored (`.gitignore:1:.venv/`) but occupies 126M locally.
- results/: 33 tracked files totaling 8.6M on disk. The local results/ is 120M, so about 111M is untracked.
- data/raw: 0 tracked.
- Whole directory: 250M locally.

## 2. KNOWLEDGE ITEMS
Format: ID | title | path:line | verbatim | authority | type | status | scope | integrated? | subject | Principal?

- S2-001 | docs/bugs is sole defect system | bugs/README.md:~10 | [D] "`docs/bugs/` is the one and only authoritative defect-tracking mechanism" | Principal decision 2026-09-11 | DECISION | Ratified Cat B | governance | foundations/idea-intake-reconciliation.md:259 refs BUG | Defect governance | N
- S2-002 | Defect definition | bugs/README.md:~25 | [D] "A defect is a demonstrated failure of Wheelwright to behave according to its intended semantics" | Ratified | DOMAIN-DEFINITION | Ratified | governance | partial (idea-intake) | Defect governance | N
- S2-003 | Filing ≠ remediation authorization; severity ≠ priority | bugs/README.md Lifecycle Rules 1–2 | [D] "Filing does not authorize remediation." | Ratified | METHODOLOGY | Ratified | governance | principal-decision-surface.md (inferred) | Authorization | N
- S2-004 | Membership is semantic, not label-driven | bugs/INDEX.md migration notes | [P-ruling] BUG-001 "the Principal ruled it is a defect based on its authoritative body" | Principal | DECISION | Settled | governance | NOT FOUND | Defect governance | N
- S2-005 | Overlay contract | BUG-001:20 | [D] "authoritative Option Summary checkpoint + subsequent executed Activity = current state." | Ratified (overlay) | ARCH-INVARIANT | BUG-001 Open | Portfolio | 07-architecture-current.md:440 refs BUG-001 | Portfolio projection | N
- S2-006 | "Subsequent" must mean not-already-reflected (cross-export temporal reconciliation) | BUG-023 Intended | [D] "where 'subsequent' must mean *not already reflected in the authoritative broker evidence being projected onto*" | D | DOMAIN-LESSON-FROM-DEFECT | Open | Portfolio cash | 07c-adrs ADR-020 refs BUG-023 (ownership side only) | Broker evidence reconciliation | Y
- S2-007 | Notional ≠ realized claim | BUG-006:14 | [D] "A valid mechanical/notional quantity is promoted into an operator-visible realized economic claim" | D | DOMAIN-LESSON-FROM-DEFECT | Resolved | Production | NOT FOUND (as general rule) | Production accounting semantics | N
- S2-008 | Unknown economics must not look reconciled | BUG-007:14 | [D] "Unknown realized economics must not silently coexist with a presentation that implies the lifecycle is fully reconciled." | D | ARCH-INVARIANT | Resolved | Production/presentation | NOT FOUND | Honest incompleteness | N
- S2-009 | Basis resolution must consider all acquisition paths (assigned put, direct, buy-write) | BUG-002 Diagnosis | [D] | D | DOMAIN-LESSON-FROM-DEFECT | Resolved | Production | NOT FOUND | Lot/basis lineage | N
- S2-010 | BTC is an option-close event, netted against recognized premium | BUG-021 Principal boundary ~75 | [P-confirmed] "A Fidelity buy-to-close is an option-close event, never generic ASSET_PURCHASE / CAPITAL_DEPLOYMENT." | Principal 2026-09-17 | PRODUCT-REQUIREMENT | Resolved | Production | YES: options-domain-reference.md:187,193,260,314 | Obligation lifecycle accounting | N
- S2-011 | One-attempt authorization; a REJECT does not self-authorize retry | BUG-021:~67–73 | [P] "exactly ONE bounded implementation attempt"; "Retry does not self-authorize" | Principal 2026-09-17 | DECISION/METHODOLOGY | Historical | execution governance | shared-execution-contract.md:5,38; principal-decision-surface.md:103 | Authorization | N
- S2-012 | Deployable = unlevered capacity; distinct broker balance fields are distinct facts | BUG-022 Intended | [D] "'Deployable' is Wheelwright's unlevered, put-writing capacity" | Principal-accepted 2026-09-17 | DOMAIN-DEFINITION | Resolved | Capital | YES: options-domain-reference.md:350,368 | Capital regime | N
- S2-013 | Parsers extract facts and must not decide domain meaning (ingestion layering) | BUG-022 Diagnosis | [D] "A layering violation at ingestion" | D | LESSON-FROM-FAILURE | Resolved | Ingestion | partial (Authority Before Consumers steering) | Ingestion boundary | N
- S2-014 | Backend owns session semantics; frontend must not derive them from provider identity | BUG-010:59 | [D] "Backend owns provider/session/admissibility/canonicality semantics. Frontend renders/composes backend authority and must not derive those semantics from provider identity." | Ratified via ADR-017 | ARCH-INVARIANT | Resolved | Session | YES: ADR-017 | Authority boundary | N
- S2-015 | Consumer-path authority reach (stale-in-closure authority) | BUG-012 Diagnosis | [D] "Publishing/deriving the correct authority is not sufficient if the consumer keeps acting on a stale, pre-authority" verdict | ADR-017 | ARCH-INVARIANT | Open (browser acceptance pending) | Write Desk | YES: 07c-adrs ADR-017, 07-architecture-current | Authority reach | N
- S2-016 | Per-subject admissibility must agree with session-level canonical state in PREMARKET | BUG-013 Diagnosis | [D] | D | DOMAIN-LESSON-FROM-DEFECT | Open (fix implemented) | Session | NOT FOUND | Session semantics | N
- S2-017 | Sealed-session completeness is a durable fact, not derived from mutable state | BUG-014 Intended | [D] "Prior-session operational validity is a durable fact about a completed session… Once true, it must remain true until superseded" | D | ARCH-INVARIANT | Open (fix implemented) | Persistence | NOT FOUND (grep) | Persist facts / sealed evidence | Y
- S2-018 | Forced acquisition must produce Decision-usable evidence | BUG-019 Intended | [D] "Explicit forced acquisition must produce Decision-usable current evidence when usable provider evidence is available, regardless of canonical-session posture" | proposed | UNRESOLVED-QUESTION (proposed invariant) | Open | Admissibility | NOT FOUND | Admissibility vs canonicality | Y
- S2-019 | Temporal incoherence must be visible (retention and eligibility are not the defect) | BUG-004 Intended | [D] "presenting temporally incompatible evidence together… without making the lack of temporal coherence apparent" | D | ARCH-INVARIANT | Open | Console | NOT FOUND (grep "temporal coherence/co-temporal") | Evidence composition | Y
- S2-020 | Held-expiration age should independently trigger scheduler admission | BUG-033:87 | [D] "A held (symbol, expiration)'s own chain age should be able to make a symbol due for service during an open session" | D, Principal stop decision 2026-10-07 | ARCH-INVARIANT (gap established) | Open | Scheduler | NOT FOUND | Active-position freshness | Y
- S2-021 | Separate established gap from incident causality; claims retracted | BUG-033 INDEX row | [D] "Earlier internal-Greek-incoherence / normalization-validation / co-temporality … claims retracted" | D | LESSON-FROM-FAILURE | Open | epistemics | NOT FOUND | Diagnosis discipline | N
- S2-022 | Forced refresh success does not identify the mechanism | BUG-033 Diagnosis §8 | [D] "Forced refresh does not identify the cause." | D | METHODOLOGY | Open | diagnosis | NOT FOUND | Diagnosis discipline | N
- S2-023 | Exact-zero Delta ≠ absent Delta | BUG-011:~10 | [D] "Raw provider delta=0.0 is semantically distinct from null or an absent Delta field." | D (740-contract study 2026-09-11) | DOMAIN-LESSON-FROM-DEFECT | Open | Greeks | NOT FOUND | Evidence absence vs value | N
- S2-024 | Today's G/L = vs prior close (broker-comparison figure) | BUG-020:28 | [P-stated] "Today's G/L $ = (current price − previous close) × quantity" | Principal 2026-09-16 | PRODUCT-REQUIREMENT | Resolved | Console | NOT FOUND (grep "previous close") | Market reference semantics | N
- S2-025 | Moneyness color = contract state (dim 1), not economic intent (dim 3) | BUG-024 Intended | [D] "answers ONLY 'Where is the underlying relative to this option's strike?'" | ADR-013, Principal visual pass 2026-09-17 | DOMAIN-LESSON-FROM-DEFECT | Resolved | Console | YES: ADR-013 | Position monitoring | N
- S2-026 | Sparkline x-axis follows real chronology | BUG-015 Intended | [D] | D, Principal deferred | ARCH-INVARIANT | Open (deliberately unfixed) | Console | NOT FOUND | Visualization truth | N
- S2-027 | Aggregate counts need retained membership (auditability, determinism) | BUG-016 Intended | [D] "An aggregate count that cannot be decomposed into its contributing units is not auditable" | D | ARCH-INVARIANT | Resolved | Decision funnels | NOT FOUND (as rule) | Observability | N
- S2-028 | Presentation row limit ≠ export scope | BUG-017 Intended | [D] "A presentation-only row limit and CSV export scope are separate concerns." | D | ARCH-INVARIANT | Open | Write Desk | NOT FOUND | Export semantics | N
- S2-029 | Admit → visible state → hydrate mental model; a single universe count hides distinct states | BUG-018 Intended | [D] | D | PRODUCT-REQUIREMENT | Open | Write Desk | NOT FOUND | Universe state legibility | Y
- S2-030 | Client-side generation monotonicity | BUG-025:20 | [D] "A snapshot response older than the latest already-accepted evidence generation must not be able to mutate client evidence state or regress the accepted ETag." | proposed (Codex review) | ARCH-INVARIANT | Open | Frontend | NOT FOUND (contract covers server only) | Publication | N
- S2-031 | Repeated identical rows ≠ additive lots; Positions are ownership authority | BUG-026 Diagnosis | [D] "the two additive lots are byte-identical… neither MAX nor naive value-based de-duplication" works | ADR-020 | DOMAIN-LESSON-FROM-DEFECT | Resolved | Inventory | YES: ADR-020 | Ownership authority | N
- S2-032 | Loaded state must be reconstructed from durable provenance, not ephemeral UI state | BUG-027 Diagnosis | [D] | D | LESSON-FROM-FAILURE | Resolved | Shell | NOT FOUND | UI truthfulness | N
- S2-033 | Absence stays absence; no semantic substitution of provider fields | BUG-029 Intended | [D] "Absence must remain absence; an unrelated provider field name must never be persisted" | D | ARCH-INVARIANT | Resolved | Tradier normalization | partial (invariants: provenance) | Evidence truthfulness | N
- S2-034 | Price↔chain binding coherence guard missing | BUG-039 Intended | [D] "composes an underlying price with an option chain without establishing that the chain's contracts describe the same instrument/price" | Principal observation 2026-10-12 | DOMAIN-LESSON-FROM-DEFECT | Open | Buy-write | NOT FOUND | Evidence coherence | Y
- S2-035 | Arithmetic can be faithful while the candidate is economically impossible | BUG-039 Intended | [D] "Not the defect: the economics arithmetic. The derived numbers are faithful computations" | D | REPEATED-CONFUSION (correct computation, wrong semantics) | Open | Decision | NOT FOUND | Domain competence | N
- S2-036 | Unavailable evidence withholds dependent conclusions, not unrelated rows | BUG-040 Intended | [D] "Unavailable closing-price evidence must withhold dependent conclusions, not independently supported holdings and unrelated rows" | D, cites competence contract §§7,12 | ARCH-INVARIANT | Resolved | tt live | partial (options-domain-competence-contract) | Fail-closed scope | N
- S2-037 | Closed-market use of last-session values | BUG-034 Intended | [P-confirmed] "tt live should remain useful on Sundays using Friday's available session evidence… Latest quotes are not promoted into official closing prints." | Principal 2026-10-11 | PRODUCT-REQUIREMENT | Resolved | CLI | partial (sealed evidence invariant) | Sealed evidence | N
- S2-038 | Account numbers masked by default; acceptance without env vars | BUG-035 | [P] "The Principal requires acceptance testing without environment variables… its success is technical verification, not Product acceptance." | Principal 2026-10-11 | PRINCIPAL-STATEMENT | Resolved | CLI/security | NOT FOUND | Acceptance discipline | N
- S2-039 | Unknown scope ≠ owner-only scope | BUG-036 Diagnosis | [D] "conflating scope not established with known single-owner source" | Doc 77 | ARCH-INVARIANT | Resolved | v2 authz | Doc 77 (outside canonical set checked) | Authorization fail-closed | N
- S2-040 | Pxx + GTD = Manual xDTE Exit | BUG-041 Principal amendments | [P] "Explicit Product decision: Pxx + GTD = Manual xDTE Exit." | Principal 2026-10-14 | DECISION | Accepted | TT Live | NOT FOUND in canonical set (TT Live docs) | Position management | N
- S2-041 | 60s clean-test SLO | BUG-028 | [D] "a multi-minute clean suite degrades the engineering learning rate" | SLO-BUILD-01 | METHODOLOGY | Open | Engineering | technology-quality docs | Feedback loop | N
- S2-042 | Velvet Rope first slice is observational, not governing | velvet-rope/01-requirements.md:~8 | [D] "The first slice is observational… does not yet govern downstream behavior." | design | PRODUCT-REQUIREMENT | Designed, not live | Admission | partial (Velvet Rope named in policy-over-prediction etc.) | Admission governance | Y
- S2-043 | Non-binary admission outcomes | velvet-rope/01:103 | [D] "admit, reject, insufficient_evidence, or manual_review" | design | DOMAIN-DEFINITION | Designed | Admission | NOT FOUND | Admission | N
- S2-044 | Attempt status ≠ policy outcome; provider failure never overwrites last success | velvet-rope/01:157 | [D] "Provider failures shall NOT overwrite or replace the latest successful policy evaluation." | design | ARCH-INVARIANT | Designed | Admission | YES (failed refresh preserves evidence) | Evidence integrity | N
- S2-045 | Effective status derivation; overrides precede policy; staleness by policy version | velvet-rope/00:307; 01:178–190 | [D] | design | DECISION | Designed | Admission | NOT FOUND | Admission | N
- S2-046 | Cutover is a deliberate, reversible operator action | velvet-rope/01 VR-16 | [D] "The future cutover will be a deliberate, reversible operator action." | design | DECISION | Designed | Universe | NOT FOUND | Universe governance | Y
- S2-047 | gen-29066 disposition rules: Wide Spread / No Delta Match alone don't demote | universe/disposition/wheelwright-universe-disposition-gen29066.md:5–14 | [D] "Wide Spread and No Delta Match alone do not trigger demotion." | Cat C | DECISION | Executed (340 removed, 487 weekly, 84 retained) | Universe | 07-architecture-current (inferred) | Universe servicing | N
- S2-048 | DTE window 7–45 vs Principal belief 0–45 is unresolved | universe/disposition/DTE-DISCREPANCY-followup.md:5 | [D] "the Principal believes the intended governed window may be 0–45 DTE" | D | UNRESOLVED-QUESTION | Open | Decision/acquisition | NOT FOUND | DTE policy | Y
- S2-049 | 7–45 is duplicated across ≥7 call sites | DTE-DISCREPANCY:~10 | [D] list of call sites | D | FINDING (coherence risk) | Open | Backend | NOT FOUND | DTE policy | N
- S2-050 | Fidelity cannot establish cross-observation continuity of option obligations | research/fidelity-brokerage-evidence…:9–20 | [D] "CURRENTLY ACCESSIBLE EVIDENCE CANNOT ESTABLISH CROSS-OBSERVATION CONTINUITY" | research | FINDING-THAT-CHANGED-ASSUMPTION | Research | Lifecycle | NOT FOUND (ADR-022 cohort continuity is related, inferred) | Broker evidence limits | Y
- S2-051 | Fidelity Activity sufficient for production accounting | engineering-spikes/fidelity-activity-history.md:218 | [D] "The evidence gate is open." (183 rows, 0 unclassified) | spike | RESEARCH-FINDING | Validated Aug 2026 | Production | ADR-014 (inferred) | Broker evidence | N
- S2-052 | Delta-rail CC management not demonstrated; delta = prompt to re-underwrite | research/covered-call-delta-band…:15–30 | [D] "NOT DEMONSTRATED — not 'demonstrated not to work.'" | research | RESEARCH-FINDING | Research | CC policy | NOT FOUND | Covered-call management | Y
- S2-053 | Generic slippage number = false precision; SPX 30–45 DTE cell empty | q0-executable-retail-friction-analysis…:18 | [D] "a single generic options 'slippage' or friction number would be false precision" | research | RESEARCH-FINDING | Parked | Execution cost | NOT FOUND | Execution friction | N
- S2-054 | Q0 parked as a rabbit hole | q0-rabbit-hole-parked:8 | [P] "Record Q0 as locally inconclusive/public-evidence-limited, park direct data collection, and continue the broader research program." | Principal 2026-09-27 | DECISION | Parked | Research | NOT FOUND | Research program | N
- S2-055 | Prior research premises falsified (canon baseline, correlation sign, SEBI "goldmine") | primary-evidence-upgrade…:21–34 | [D] "Three claims that anchored the program's prior foundation were falsified or materially narrowed" | research | FINDING-THAT-CHANGED-ASSUMPTION | Research | Research program | NOT FOUND | Research epistemics | N
- S2-056 | Govern a versioned Operating Program; "Wheel" is a family label | wheel-family-research-analysis…:246 | [D] "Wheelwright should govern and replay an explicitly identified/versioned Operating Program." | research | RESEARCH-FINDING (durable conclusion) | Research | Product model | NOT FOUND ("Operating Program" grep) | Program governance | Y
- S2-057 | Capital consequence ≠ max loss | academic-paper-register.md:~218 | [D] "Strategy admission should reason about what capital becomes after an adverse outcome, not merely the scalar maximum loss." | research | RESEARCH-FINDING | Research | Strategy admission | partial (policy-over-prediction, system-goal-hierarchy) | Admission economics | Y
- S2-058 | Compensation must survive execution | academic-paper-register.md:~214 | [D] "quoted or modeled economics are not sufficient" | research | RESEARCH-FINDING | Research | Economics | partial (midpoint ≠ fill vocabulary) | Execution | N
- S2-059 | Partial Collar Test 1 FAIL; broader strategy unproven | partial-collar-test1/PRINCIPAL-REVIEW.md:~4 | [P] "Principal accepts FAIL for the tested tactical state-machine candidate… Broader Partial Collar Protected Growth strategy remains unproven." | Principal 2026-10-08 | DECISION | Closed | PL-STRAT-01 | NOT FOUND | Strategy research | N
- S2-060 | Don't tune thresholds to rescue a deficit | partial-collar REPORT ~line 43 of file | [D] "do not tune fast thresholds to rescue the observed deficit" | research | METHODOLOGY | Closed | Research | partial (research-program-control) | Falsification discipline | N
- S2-061 | EVA-001: forecasting is acceptable; directional intuition is not | eva-001/CONVERSATION-RECOVERY…:~20 | [D-paraphrasing P] "Forecasting is acceptable; directional intuition is not." | Principal objectives (recovered) | PRINCIPAL-STATEMENT (recovered) | Proposed research | EVA | NOT FOUND (tension with policy-over-prediction) | Prediction boundary | Y
- S2-062 | Forecast, economic and tail falsifiers stay separate | eva-001/ROUND-2-VERIFICATION.md:~15 | [D] "Negative realized strategy P/L does not reject accurate forecasts" | Codex review | METHODOLOGY | Draft 0.2 | EVA | NOT FOUND | Research epistemics | N
- S2-063 | EVA data sufficiency UNRESOLVED; no 4-leg historical panel | eva-001/README.md | [D] "Data sufficiency is UNRESOLVED, current options subscription access is UNVERIFIED" | research | UNRESOLVED-QUESTION | Open | EVA | NOT FOUND | Research data | N
- S2-064 | SPY overwrite: unmanaged 10Δ closest to stock; no entry/exit rule justified | spy-growth-overwrite…:238 | [D] "This evidence does not yet justify choosing an entry delta or an exit-management rule." | research | RESEARCH-FINDING | Research | Growth overwrite | NOT FOUND | CC strategy | N
- S2-065 | NEXT AUTHORIZED ACTION must be Principal-facing | experiments/operating-model-pending-corrections-2026-09-17.md:~12 | [P-approved] "`Do not execute now` is not equivalent to `no Principal decision exists`." | Principal 2026-09-17 | METHODOLOGY | Approved for codification | governance | likely principal-decision-surface.md (unverified) | Decision surface | N
- S2-066 | Authorization does not imply permission to disturb in-flight work | ops-model-corrections §2 | [D] "Authorization for a next transition does not imply permission to discard, stage, commit, reset…" | Principal-approved | METHODOLOGY | Approved | git/workspace | partial (git safety) | Execution safety | N
- S2-067 | The largest cost is forfeited learning | supplementary/ai-assisted…:20 | [D] "Often the largest cost is not the work the AI did, but the learning the project forfeited while it was doing it." | non-governing | METHODOLOGY | Supplementary | actors | partial (engineering-methodology opportunity cost) | AI governance | N
- S2-068 | API v2 public reference: 15 public / 19 internal ops; Principal accepted | reviews/pl-api-02-public-cleanup-delivery…:3 | [D] "Product acceptance PASSED for this revised 15-public/19-internal reference." | Principal 2026-10-15 | DECISION | Accepted | API docs | NOT FOUND in canonical set | API publication | N
- S2-069 | Approved ≠ implemented (ArchUnit) | technology-quality/baseline-context-2026-09-09.md:45 | [D] "This is approved ≠ implemented" | Cat C | FINDING | Recorded | quality | NOT FOUND | Fitness controls | N
- S2-070 | Sonar profile as delta, not dump | reference-data/sonar/wheelwright-clean-code-profile-delta-v1.md:~6 | [D] "The delta is the reviewable, defensible policy." | Cat C | DECISION | Active | quality | technology-quality-fitness-controls-v1 | Quality policy | N

## 3. DEFECT-TAUGHT LESSONS
| BUG | Lesson | Generalized where? |
|---|---|---|
| 001/023 | Checkpoint + subsequent Activity = state; "subsequent" means not already reflected in the cash source | ADR-020 (ownership only); cash side NOT FOUND |
| 002 | Basis lineage spans all acquisition paths | NOT FOUND |
| 003 | Surface the composite answer ("where did it come from") without operator arithmetic | NOT FOUND |
| 004 | Mixed-age evidence composition must signal incoherence | NOT FOUND |
| 006 | Notional ≠ realized claim | NOT FOUND |
| 007 | Unknown ≠ reconciled | NOT FOUND |
| 008/009 | Corrupted source text preserved verbatim, not reconstructed (provenance honesty) | bugs/INDEX only |
| 010 | Frontend must not derive session semantics | ADR-017 |
| 012 | Consumer-path authority reach | ADR-017, 07-arch |
| 013/014 | Per-subject admissibility must agree with session state; sealed completeness is a durable fact | NOT FOUND |
| 011 | Zero ≠ null | NOT FOUND |
| 015 | Chronology-true axes | NOT FOUND |
| 016 | Retain membership behind counts | NOT FOUND |
| 017 | Presentation limit ≠ export scope | NOT FOUND |
| 018 | Admission → visible state → hydration | NOT FOUND |
| 019 | Forced acquisition vs canonical admissibility | NOT FOUND (open question) |
| 020 | Daily G/L vs prior close | NOT FOUND |
| 021 | BTC is an obligation close | options-domain-reference, shared-execution-contract |
| 022 | Unlevered deployable; parsers don't decide | options-domain-reference |
| 024 | Moneyness = contract state | ADR-013 |
| 025 | Client generation monotonicity | NOT FOUND |
| 026 | Positions own aggregate shares | ADR-020 |
| 027 | Reconstruct UI status from durable provenance | NOT FOUND |
| 029 | Absence is absence; no field substitution | partial (provenance invariants) |
| 033 | Held-expiration freshness obligation; gap ≠ cause | NOT FOUND |
| 034 | Closed-market last-session usefulness | partial (sealed evidence) |
| 036/037 | Unknown scope fails closed | Doc 77 |
| 038 | Whole-body deadline preserves prior evidence | partial |
| 039 | Price↔chain binding; correct math ≠ admissible candidate | NOT FOUND |
| 040/041 | Withhold dependent conclusions only | competence contract (partial) |
| 042 | Contract-test coverage must include each 422 branch | NOT FOUND |

## 4. BURIED KNOWLEDGE (top 10)
1. BUG-014: sealed-session completeness must be persisted as a fact (S2-017).
2. BUG-004 + BUG-033: the temporal-coherence presentation invariant and the held-expiration admission gap (S2-019, S2-020). Highly relevant to the current Herbie investigation; scheduler admission ignores held-expiration age.
3. BUG-039: no price↔chain binding guard (S2-034).
4. BUG-025: client-side generation monotonicity (S2-030).
5. BUG-011: zero vs absent Greek (S2-023).
6. Fidelity continuity verdict: same-series close and reopen are indistinguishable (S2-050).
7. The DTE 7–45 vs 0–45 question, with the bound duplicated across call sites (S2-048/049).
8. "Operating Program" as the governed unit (S2-056).
9. Capital consequence ≠ max loss (S2-057).
10. EVA's "forecasting acceptable" vs policy-over-prediction (S2-061).

## 5. VERBATIM PRINCIPAL STATEMENTS
- Q0 Option A: "Record Q0 as locally inconclusive/public-evidence-limited, park direct data collection, and continue the broader research program." (options-trading-research-state-transition-q0-rabbit-hole-parked-2026-09-27.md:~11, 2026-09-27)
- BUG-041 closure: "perfect. acceptance passed. execute end of session protocol" (BUG-041 Principal acceptance section, 2026-10-14)
- BUG-036 renewal: "reopen the session. address the remaining issues and close bug 36" (BUG-036 Principal acceptance section, 2026-10-11)
- BUG-032: Principal said "proceed" (BUG-032:64, 2026-10-05)
- Principal-stated G/L formula (BUG-020:28–31, 2026-09-16)
- BUG-041 decision: "Explicit Product decision: Pxx + GTD = Manual xDTE Exit." (2026-10-14; actor-recorded)
- BUG-035 rejection, recorded by an actor: "The Principal requires acceptance testing without environment variables." (2026-10-11)
- Partial Collar disposition, recorded by an actor (PRINCIPAL-REVIEW.md, 2026-10-08)
- Principal preliminary interpretation: "selling during declines and repurchasing during recovery may be substantially harder to make profitable than stylized examples implied" (PRINCIPAL-REVIEW.md, explicitly not settled)

Most other "[P]" items are actor-recorded paraphrases (inferred), not direct quotes.

## 6. RESEARCH: CONCLUSIONS vs HYPOTHESES
Conclusions (evidence-backed, non-authoritative):
- Fidelity continuity is not establishable.
- Fidelity Activity is sufficient for production accounting.
- A delta-rail covered call is NOT DEMONSTRATED.
- No generic slippage number exists; the SPX 30–45 DTE cell is empty.
- Three prior premises were falsified (index VRP survived).
- SPY 10Δ unmanaged is closest to stock, and the 21-day exit is worse.
- Partial Collar Test 1 FAIL (Principal-accepted).
- API Ninjas: conditionally viable; FMP: viable for single-symbol lookups.

Hypotheses / unresolved:
- EVA-001: draft 0.2, data UNRESOLVED.
- Broader partial-collar strategy unproven, with three candidate explanations: parameterization, state-transition policy, or a fundamental weakness in recycling shares.
- XSP strategy: explicit non-conclusions (conversation-record:422).
- Growth/capital-protection taxonomy: "Non-decision".
- Income-wheel notes: "requiring further validation".
- The p50 null export is unexplained.

## 7. CLUSTERS / CROSS-CUTTING
A. Authority and session: 010, 012, 013, 014, 019, 033, 034; ADR-017.
B. Evidence truthfulness: absence vs value, provenance, coherence (004, 011, 029, 039, 025).
C. Broker-evidence reconciliation and production accounting: 001, 002, 006, 007, 008, 009, 021, 022, 023, 026; Fidelity spikes and continuity research.
D. Presentation and cognitive correctness: 003, 005, 015, 017, 018, 024, 027, 031, 032.
E. v2 security fail-closed: 035–038, 042.
F. Universe governance: Velvet Rope, Candidate Universe, gen-29066, DTE window.
G. Strategy research epistemics: falsification, separating forecast from economics, execution friction.
H. Actor governance: one-attempt authorization, decision surface, supplementary smells, historical contract.

Cross-cutting themes:
- "Retention ≠ eligibility ≠ presentation".
- "Correct computation over wrong composition" (004, 039, 006).
- Fail-closed narrowly: withhold only dependents (040/041).
- Unknown ≠ known-safe (007, 036).

## 8. DUPLICATION / CONTRADICTION
- BUG-033 retracted its co-temporality claim while BUG-004 still asserts the temporal-incoherence defect. These are distinct, but a reader can conflate them.
- 7–45 DTE (code, domain-vocabulary steering) vs the Principal's possible 0–45 (S2-048).
- Velvet Rope design specifies localStorage and frontend modules (02-design). That conflicts with "No browser shadow evidence store" and backend authority (inferred; flagged "transitional" in the doc). Steering says "designed, not live."
- EVA "forecasting is acceptable" vs the policy-over-prediction principle: needs Principal reconciliation.
- architecture.md steering says "Tradier sandbox 60 req/min" and "RequestPacer 0.9 req/sec." BUG-010 and Doc 40 show Production profile and 120/min, so the steering is stale (inferred).
- The practitioner-corpus v1, v1.1 and reconciliation files duplicate sections (same headings at different lines) by design (revisions).
- The INDEX.md BUG-033 row embeds a whole narrative, duplicating the record.

RELEVANT FILES (ranked by importance):
  1. docs/bugs/INDEX.md — Canonical defect index with status/area/provenance for all 42 bugs plus audit checkpoint
  2. docs/bugs/BUG-033-active-position-greeks-stale-during-open-session.md — Held-expiration scheduler gap, the clearest unintegrated architectural lesson; relevant to the active investigation
  3. docs/velvet-rope/01-requirements.md — Velvet Rope governance rules (non-binary outcomes, attempt vs outcome, overrides, staleness, cutover)
  4. docs/universe/disposition/DTE-DISCREPANCY-followup.md — Unresolved 7–45 vs 0–45 DTE policy question needing Principal judgment
  5. docs/research/fidelity-brokerage-evidence-capabilities-option-obligation-continuity-2026-09-28.md — Assumption-changing verdict on broker evidence limits for obligation continuity

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.