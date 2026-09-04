# Project Parking Lot — Continuation 3

> This file is a physical continuation of `docs/parking-lot.md` and `docs/parking-lot-2.md`. Together, all `docs/parking-lot*.md` files constitute **one logical Wheelwright parking lot**.

**Started:** September 1, 2026  
**Status:** Canonical Project / Operational State (Category C), same authority and governance as the preceding parking-lot files  
**Governing intake method:** `docs/foundations/idea-intake-reconciliation.md`

---

## Continuation Invariant

This is not a new backlog or namespace.

- All stable IDs are globally unique across the complete `docs/parking-lot*.md` sequence.
- New material ideas enter through the standard pipeline in `docs/foundations/idea-intake-reconciliation.md`.
- New intake is recorded in the latest continuation after checking the complete parking-lot sequence for an existing concept.
- Row order is not priority.
- Merge, split, supersession, promotion, rejection, and resolution preserve explicit disposition/mapping.
- A Principal decision to work on an item next changes sequencing, not its reconciliation/design state.

---

## Active Items — Continuation

### Evidence / Operator-Usefulness Family

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-EVID-AGE` | Deployment Evidence Age / Operator-Intent Acquisition Feedback | **Principal-selected next workstream; intake complete, strategic/architectural reconciliation required before implementation.** Add an operator-visible **Age** column to each Deployment table so a row answers: **“How old are the market observations from which this displayed row was calculated?”** Age must not mean UI render age or merely decision-object recomputation age. Working conservative semantic for 3AM validation: `now - oldest observation timestamp among market evidence actually used to produce the row`. Initial exposure is observational only: Age does not become a ranking/quality factor and does not itself change acquisition priority. The purpose is to create real-world operator feedback about whether finite provider capacity is being spent on information the operator actually values. The broader capability thesis is that acquisition should eventually return to tiers parameterized by probabilistic operator demand / decision relevance: **information-product quality → probable operator interest → acquisition tier/priority → achieved freshness**. Age is ideally an outcome of that allocation; a separate maximum-age validity boundary may still be required. This work appears to strengthen roadmap G6/N1 Decision-value-aware evidence acquisition and Trustability rather than presume a new Bet. Rich discovery/intake record: `docs/41-operator-intent-evidence-age-intake.md`. GitHub Issue #1 is supporting workflow only, not canonical intake identity. **Authorization boundary:** 3AM design/reconciliation is next; no scheduler-policy change, demand-aware prioritization implementation, new tier parameters, scalar utility score, or Age-as-ranking input is authorized yet. | `docs/41-operator-intent-evidence-age-intake.md`; `docs/roadmap.md` G6/N1; `docs/architecture-roadmap.md`; `PL-DEPLOY`; complete acquisition/evidence family; `docs/foundations/idea-intake-reconciliation.md` |

---

## Reconciliation Completion Record — `PL-EVID-AGE` (Deployment Evidence Age, first slice)

**Date:** September 1, 2026  
**Method:** `docs/foundations/idea-intake-reconciliation.md`  
**Reconciliation state:** RECONCILED (first slice). Produced across a 3AM design session with three independent review rounds that each falsified part of an earlier model and were corrected before commitment.

### Intake

Canonical identity: `PL-EVID-AGE` (this file). Rich discovery record: `docs/41-operator-intent-evidence-age-intake.md`. GitHub Issue #1 is supporting workflow only, not canonical intake identity.

### Strategic disposition

**Strengthens existing Bets; no new Bet; no roadmap change required.** `PL-EVID-AGE` is the observational precursor to roadmap **G6/N1 — Decision-value-aware evidence acquisition**: it provides operator-visible instrumentation to gather the operator-value evidence N1's Bet needs *before* any scheduler change. It also concretizes the cross-cutting **Trustability** differentiator by putting per-row evidence freshness/provenance on the primary decision surface. The N1 constraint (no scheduler change during Constraint Identification) is respected because this slice is observational only. Differentiation lens: the Age display is *enabling instrumentation*, not itself the differentiator; it enables future differentiating allocation. "Good enough" for this first slice = truthful per-row chain-acquisition age, compact + sortable, advancing with wall-clock, observational only. (An optional one-line "N1 precursor instrumentation" note in `roadmap.md` remains deferred to Principal; not made here.)

### Architectural disposition (corrected — see ADR-015)

**New cross-cutting architecture constraint discovered; a new ADR was required and has been ratified as ADR-015 (Evidence Provenance Authority and Preservation).** The earlier "no architecture change / frontend-internal" disposition is **withdrawn**.

Ruling: **authoritative evidence provenance is established upstream, at the evidence/publication boundary. Downstream consumers may preserve, compose, and present provenance, but may not infer or manufacture its authority from normalization shape, fallback timestamps, cache timestamps, or synthesized clocks. Provenance claims are subject-scoped.** Concise boundary: *the frontend may calculate what to display from authoritative facts; it must not decide what facts are authoritative.*

First-slice semantic: **Age = option-chain acquisition age = `now − acquiredAt` of the option-chain record that supported the row.** Provenance is an explicit, subject-scoped state (`chain-acquired` | `unavailable`) **established by the publisher** and carried additively in the snapshot (`chains[].chainAcquisitionProvenance`; `primaryChainAcquisitionProvenance` for the legacy primary chain — see `docs/contracts/evidence-snapshot-v1.md`). The frontend consumes the explicit provenance; the browser does **not** decide authority. The provisional frontend `sym.chains`-vs-`sym.chain` heuristic is therefore superseded and must be removed. Symbol-level `symbols[].retrievedAt`, cache TTL timestamps, and `Date.now()` carry **no operator-facing Age provenance authority**.

Relationship to existing decisions: conforms to ADR-001 (recommendation reads cache, zero provider calls), ADR-003 (Age is sortable presentation, not a rank input), ADR-013 (generalized by ADR-015), AR9 (no acquisition/scheduler change). Relates to AR6 / PL-ARCH-06 as pressure/evidence only; **recommendation engines are not relocated** in this slice — they may continue transitionally where they live, provided they *consume* authoritative provenance rather than *create* it.

Snapshot change: additive, subject-scoped provenance fields under INV-PUB-05 (no version increment, documented, compatibility-tested). This is a **real published-contract change**, not "frontend-internal." Legacy primary chain **inherits** authoritative provenance from its per-expiration record (verified in `SqliteEvidenceStore.getEvidence`, which already reads the primary chain's `retrieved_at`); `unavailable` is reserved for an existing chain subject whose authority genuinely cannot be established.

### Governing epistemic rule (now ADR-015, clause 4/6)

> **Internal freshness/cache timestamps and operator-facing evidence provenance are distinct semantics. A synthesized or fallback timestamp used for cache/freshness mechanics must never silently become operator-facing evidence provenance. Provenance has a subject: a claim must name what was acquired, not merely when.**

Ratified as **ADR-015** (the earlier "open ADR question" is decided).

### Known provenance limitation (durable — do not lose)

- **Desired future semantic:** age of the *oldest economically material evidence* actually used by the row.
- **Current implementable semantic (this slice):** option-chain acquisition age.
- **Why the gap exists:** for calls and buy-writes the underlying spot may come from a **cached quote acquired up to approximately 60 seconds *before* the option chain** (backend `QUOTE` TTL 60s); its independent acquisition provenance is not retained in the current composite chain representation. No provider/exchange observation timestamp exists anywhere (Tradier is ~15-min delayed; a delay-subtracted "observed" time would be an estimate, not evidence). `chainAcquisitionProvenance` therefore **cannot** support the stronger "oldest economically material evidence age." Closing the gap requires separately preserving quote-acquisition provenance — out of scope for this slice, retained under this ID.

### Process-gate and experiment disclosures (durable)

- **Process-gate violation:** implementation of the first slice was performed after reconciliation but **before Principal authorization**, crossing the commitment gate. The resulting working tree is retained as **provisional implementation evidence only**; it is not accepted project state and was not committed. Durable authority (this ADR-015 + records) was established first; implementation is separately authorized afterward.
- **Live-experiment repository-state discontinuity:** during the September 1 capture, the shared checkout was pulled `9c352c3 → 8fc0594` despite a no-touch instruction. The intervening diff was documentation-only and the running backend/observer processes remained on `9c352c3`-loaded code, so runtime behavior was unaffected; repository-state continuity was nonetheless broken and is disclosed here and in the final experiment record rather than rationalized away.

### Parking-lot disposition / mapping

`PL-EVID-AGE` **retained**. First implementation scope narrowed to the observational Deployment Age column (strict chain-acquisition age). The broader operator-intent acquisition-tier thesis and the stronger-provenance ("oldest material evidence") work remain **deferred / unauthorized** under this same ID.

### Why-state

Durable why-state preserved in the journal entry dated 2026-09-01 (Deployment Evidence Age reconciliation), including: the provider-bound-regime motivation, the three review corrections, the timestamp/provenance-separation rule, and the live-experiment repository-state discontinuity disclosure.

### Next authorized mode

**Durable authority first, then separate implementation authorization.** ADR-015 and this corrected record are persisted into durable project authority; the resulting durable-state diff is reported to the Principal for review. Implementation of the reworked slice (backend publication of subject-scoped provenance; frontend consumption; presentation; CSV) is **not** authorized by this record — it requires a separate, explicit Principal authorization after the durable state is reviewed. The prior uncommitted working tree remains provisional evidence only and is not to be committed as implementation. When authorized, the slice is observational only (no effect on ranking, quality, governance, tiers, scheduler priority, or acquisition policy) and commit remains separately gated.

---

## Active Items — Colored-Line / Surface / Scheduler Audit (Sep 1, 2026)

Three distinct durable discoveries from the post-Age colored-line/surface/scheduler audit. Established from repository evidence. **Chronology note (corrected Sep 2, 2026):** A/B/C/D dispatch was already measured in the 2026-08-27 Production experiment (A=443, B=1907, C=0, D=0), and the 2026-08-27 3AM ruling already interpreted that evidence and selected opportunity-history as the next instrument. Earlier wording here that treated an A/B/C/D measurement as unrun or as the first/next discriminating measurement following D1–D3 was a chronology error; it is corrected in place. Any A/B/C/D-class observation now would be a **new corrected/opening-session capture under the current runtime/evidence regime**, not the first such experiment. Kept as three separate items deliberately — they arose in one exploration but are different concerns. Rich why-state: journal entry 2026-09-01 "Colored-line / result-surface / scheduler audit" and its Sep 2 correction note.

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-POSTURE-01` | Colored-Line / Posture Semantic + CSS Drift | **Discovery; implementation-inconsistency + documentation-drift.** The live Deployment "colored line" is `ActionPosture` (execution-quality band of one contract), NOT Velvet Rope (dormant) and NOT operator interest. Observed drift: (1) `write-desk.css` defines posture colors three conflicting times, rendered result depends on CSS last-wins; (2) vocabulary drift — `WIDE_SPREAD` rendered for puts/buy-writes, `UNAVAILABLE`/`DATA_INCOMPLETE` never rendered (`DATA_INCOMPLETE` assigned nowhere), while `domain-vocabulary` claims only ACTIONABLE/EDGE/WAIT; (3) cross-strategy divergence — puts/buy-writes surface a spread-only hard-no as `WIDE_SPREAD`, calls silently drop it, so the palette is not a uniform semantic contract across the four tables; (4) instrument admission on Deployment is a *separate* mechanism (`GovernanceAnnotation` on the symbol cell), not the posture line and not Velvet Rope. Do NOT characterize the live colored line as Velvet Rope. Disposition unresolved: reconcile against existing docs before deciding remediation vs doc-only. | `PL-CLEANUP`; `PL-DEPLOY`; `docs/cognitive-role-separation.md`; `docs/velvet-rope/*` (dormant); `write-desk.css`; `execution-assessment.ts` |
| `PL-SURF-01` | Deployment Result-Surface Completeness / Truncation | **Discovery; result-surface completeness/truncation + control-asymmetry.** Kept separate from `PL-POSTURE-01`. Observed: Buy Writes hard-caps the `Show` control at a literal 200 while puts use a universe-sized cap (asymmetric, undocumented); the "Showing 200 of 771" denominator (`allBW.length`) counts candidate **rows, not symbols**; Buy Writes preserves candidates per **(symbol × eligible expiration)** (no cross-expiration collapse) whereas puts collapse to best-per-symbol; the 771 is ACTIONABLE+EDGE+WAIT (+WIDE_SPREAD when toggled) *before* affordability/danger filtering, so the 200 slice truncates a post-funnel candidate population, not the universe. Consequence (wording tightened Sep 2, 2026): a buy-write symbol's underlying/chain evidence is **not wholly invisible** to A/B classification (a ready symbol with a qualifying put is still classified, and its chains are still acquired). What A/B does **not** represent is **buy-write relevance, per-expiration candidate cardinality, buy-write economics/posture, affordability, and the resulting operator-facing decision population** (buy-writes across expirations). So A/B is not a proxy for that decision population — the concrete counterexample to "Class A = decision frontier." Disposition unresolved: reconcile against unified-surface work before deciding remediation. | `PL-DEPLOY`; `PL-SHELL`; `WriteDesk.tsx`; `recommend-buy-writes.ts` |
| `PL-SCHED-DRIFT` | Scheduler Policy vs Code Breadth-First Ordering Drift | **Discovery; documentation-drift with strategic weight.** `foundations/acquisition-scheduler-policy.md` documents a strict cascade ("Overdue Class A always precedes over-age Class B"). The implemented `getPrioritizedWorkQueue` (Aug-2026 "breadth-first freshness" experiment) orders **oldest-chain-age first across A+B together, with Class A only a tiebreaker at equal age**. Hypothesis (NOT a conclusion): Age appearing independent of operator-visible candidate quality may be the *expected output* of a currently-implemented uniform-breadth-freshness objective, i.e. a clash between an older breadth-freshness objective and an emerging operator-decision-value objective — not a malfunction. Which objective is correct is the reconciliation question; do not conclude either is wrong. Also recorded: Class A is only a put-relevance service-class proxy (bid>0, |δ|∈[0.15,0.50], OI>0), blind to Execution Score, spread quality, affordability, calls, buy-writes, portfolio state, and operator attention — it may overlap one portion of a decision frontier but is not "the frontier." **Prior measurement + corrected chronology (Sep 2, 2026):** A/B/C/D dispatch distribution was already measured in the 2026-08-27 Production experiment (A=443, B=1907, C=0, D=0) and interpreted by the 2026-08-27 3AM ruling, which then chose the opportunity-history fact plane as the next instrument. Any further A/B/C/D-class observation would be a **new corrected/opening-session capture under the current runtime/evidence regime**, not a first/next discriminating experiment; A/B/C/D measure existing scheduler classes only, not operator value. No acquisition-priority design; no runtime change. | `PL-EVID-AGE`; `roadmap.md` G6/N1; `architecture-roadmap.md` AR2; `PL-EVID-01` (freshness-from-obligation invariant); `foundations/acquisition-scheduler-policy.md` (stale); `SqliteEvidenceStore.getPrioritizedWorkQueue` |

---

## Active Items — Opportunity-History Instrument (Sep 1, 2026)

One durable intake item recording an **established defect** in the shipped opportunity-history fact plane. This is not a new concept: the opportunity-surface observation capability is `PL-DEPLOY-02` and the durable-history architecture is `PL-EVID-01`. `PL-DEPLOY-02-DEF01` is a child of `PL-DEPLOY-02` recording that the plane's shipped HTTP boundary silently fails to preserve winner economics. Rich why-state: journal entry 2026-09-01 "Opportunity-history economics-preservation defect (PL-DEPLOY-02-DEF01)."

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-DEPLOY-02-DEF01` | Opportunity-History Winner-Economics Preservation Defect | **Established defect (independently verified by Kiro + Codex); implementation defect violating the opportunity-history evidence-preservation contract/invariant — NOT a new architectural concept.** **(1) What was discovered:** The shipped opportunity-history fact plane (`PL-DEPLOY-02`'s realization, "Piece 1", live since 2026-08-28) preserves state/evaluation facts but persists **all winner-economics fields as NULL** across the entire `surface_observation` table (62,404 rows at inspection, including all 13,448 `QUALIFIED_ACTIONABLE` surfaces where the schema states winner economics MUST be present). **(2) What triggered it:** During the read-only assessment of whether accumulated history is sufficient to enter the ratified `analyze` step, direct read-only DB inspection (`sqlite3 -readonly`) showed `best_delta/best_strike/best_mid/best_spread_pct/best_open_interest/best_volume/best_yield_annual/best_posture` all NULL/empty; end-to-end code trace found the cause; Codex independently reproduced the same DB state and wire-path failure. **Root cause:** the frontend emits winner economics as a **nested `winner` object** (`accumulator.ts` → `emit-client.ts` `JSON.stringify`), but the backend `OpportunityHistoryController.SurfaceObs` DTO expects **flat sibling fields** (`bestDelta`…`bestPosture`). Jackson finds no matching keys, discards the nested object, and stores NULL. `evaluation_state` and `chain_retrieved_at` survive only because those key names happen to match. Best-effort, error-swallowing emit (returns 2xx; row stored economics-empty) hid the failure. The consequence is **silent corruption by omission** of fields later intended to support analysis — not merely malformed transport. **(3) Why it matters:** The 2026-08-27 3AM ruling made membership/usefulness governance depend on **retained raw governed economics** (delta, midpoint premium, spread, collateral-normalized yield). The ratified economics-based hypotheses (qualification/yield-floor persistence, spread stability, winner delta/premium usefulness) are therefore **blocked** until the contract is repaired and validated end-to-end. Continuing to accumulate under the current implementation is **invalid for the intended economics hypotheses** — it only creates more economics-empty rows. **(4) Related concepts/items:** parent `PL-DEPLOY-02` (opportunity-surface observation — concept home, retained); `PL-EVID-01` (historical evidence/observation architecture — durable-history ownership; "Decision/recommendation history, ownership unresolved per D-04"); `PL-ARCH-06` (recommendation ownership — governs the browser-emitter transition); adjacency to ADR-015 by **principle only** (evidence facts that are supposed to survive a boundary cannot be silently lost — ADR-015 governs provenance authority, not economics, but the same architectural principle applies). **(5) Unresolved:** the exact remediation mechanism (see candidate invariant below); whether/where a diagnostic surface for contract-invalid observations lives; the precise timestamp of the first validated post-fix emission (the economics-analysis provenance boundary), established only after repair. **(6) Not authorized yet:** no implementation, no schema change, no runtime change, no re-emission, no backfill; documentation only until separate Principal authorization. **(7) Rich why-state:** journal 2026-09-01 "Opportunity-history economics-preservation defect (PL-DEPLOY-02-DEF01)." **Partial-validity of existing history (durable):** the pre-fix rows are **partially valid, not corrupted wholesale.** Usable: `evaluation_state`, evaluated-vs-not-evaluated distinction, chain identity (`chain_retrieved_at`), `policy_version`, `session_posture`, `strategy`, `symbol`, `expiration`, `dte`. Not usable: winner delta, strike, midpoint, spread, OI, volume, yield, posture. Qualification-frequency / state-transition analysis must be **scoped to explicit browser-observation windows.** Acquisition burden must **not** be inferred from this plane alone. **Candidate ingestion invariant (semantic, mechanism-neutral):** *an observation state whose semantics require winner economics must not be durably accepted as a valid complete observation when those economics are absent.* The remediation may later choose rejection, explicit invalid-state persistence, diagnostics, or another governed mechanism; that implementation choice is **not** frozen here. **Remediation shape (design, not authorized):** prefer an explicit HTTP-boundary contract that preserves the frontend's nested `winner` and teaches the backend to accept a nested `WinnerDto`, mapping into the existing flat DB columns (DB stays flat internally); validate end-to-end (real frontend-shaped JSON through the controller; qualifying/wait/wide-spread rows persist economics; non-winner states persist null economics; idempotent behavior unchanged; diagnostic visibility for contract-invalid observations). **Provenance boundary:** no backfill (exact historical winners are not reliably reconstructable — raw chain economics at those historical `chain_retrieved_at` instants are gone); after repair, establish a clear timestamped "good data begins here" epoch and never blur pre-fix and post-fix history for economics analysis. | `PL-DEPLOY-02` (parent, concept home); `PL-EVID-01`; `PL-ARCH-06` (browser-emitter transition); ADR-015 (principle only); `options-prototype/src/opportunity-history/{accumulator,emit-client,opportunity-fact}.ts`; `OpportunityHistoryController.SurfaceObs`; `db/migrations/004_opportunity_history.sql` |

### Browser-only emission — separate known continuity limitation (not part of this defect)

Recorded distinctly so it is not conflated with `PL-DEPLOY-02-DEF01`: at inspection, all 988 epochs carry `emitter = browser` and none `backend`. The plane therefore accumulates only while a browser tab is running Decision, so history continuity is bounded by tab presence, not by the trading session. This is **architecturally expected under B-1** (the schema/ADR explicitly mark emitter=browser transitional until Decision migrates server-side per `PL-ARCH-06`), so it is a **known observation-continuity limitation, not a defect.** It independently reinforces the "scope state-based analysis to explicit browser-observation windows" rule above. Home: `PL-EVID-01` + `PL-ARCH-06`.

---

## Reconciliation Completion Record — `PL-DEPLOY-02-DEF01` (Opportunity-History Winner-Economics Preservation Defect)

**Date:** September 1, 2026
**Method:** `docs/foundations/idea-intake-reconciliation.md`
**Reconciliation state:** RECONCILED (defect intake + disposition). Discovered during the read-only assessment of opportunity-history sufficiency; independently verified by Codex.

### Intake

Canonical identity: `PL-DEPLOY-02-DEF01` (this file), a child of `PL-DEPLOY-02` (Opportunity Surface Observation). The underlying capability/concept is **not** new — `PL-DEPLOY-02` owns opportunity-surface observation and `PL-EVID-01` owns the durable-history architecture. This ID exists to give the **defect** its own durable, trackable identity without implying a new concept.

### Strategic disposition

**No new Bet; no roadmap change.** The defect blocks the ratified `accumulate → analyze → govern` sequence (2026-08-27 ruling) and thereby the G6/N1 decision-value-aware acquisition direction, because economics-based membership/usefulness analysis depends on the economics the instrument silently drops. Repairing it **restores an instrument the existing strategy already depends on** rather than proposing new direction. "Good enough" for this instrument = winner economics for winner-required states are durably preserved and truthfully retrievable end-to-end, with a clean provenance boundary separating pre-fix from post-fix history.

### Architectural disposition

**Implementation defect violating the opportunity-history evidence-preservation contract/invariant — not a new architectural concept and not an architectural gap.** The consequence is silent corruption by omission of evidence fields intended to support later analysis, at a frontend→backend HTTP boundary. Refines `PL-DEPLOY-02` / `PL-EVID-01`; does not relocate recommendation engines (`PL-ARCH-06` unaffected as a decision). Relates to **ADR-015 by principle only**: evidence facts that are supposed to survive a system boundary cannot be silently lost — ADR-015 governs *provenance authority* (not economics), but the same architectural principle applies here to *economic evidence preservation*. Introduces a **candidate ingestion invariant** (semantic, mechanism-neutral): *an observation state whose semantics require winner economics must not be durably accepted as a valid complete observation when those economics are absent.* Whether this candidate invariant is later ratified (and by what mechanism it is enforced) is deferred to remediation design; it is recorded here as architectural pressure, not ratified truth.

### Parking-lot disposition / mapping

`PL-DEPLOY-02` **retained** as concept-home (unchanged semantics: the opportunity-surface observation capability). `PL-DEPLOY-02-DEF01` **created** as its child recording the shipped-instrument defect. `PL-EVID-01` cross-referenced (durable-history ownership). Browser-only emission recorded as a **separate** known continuity limitation under `PL-EVID-01` + `PL-ARCH-06`, explicitly **not** folded into this defect.

### Why-state

Durable why-state preserved in the journal entry dated 2026-09-01 "Opportunity-history economics-preservation defect (PL-DEPLOY-02-DEF01)": the read-only sufficiency assessment, the two-actor (Kiro + Codex) confirmation, the nested-vs-flat wire-path root cause, the partial-validity semantics, the "further economics accumulation is invalid under current code" conclusion, the mechanism-neutral ingestion invariant, and the first-validated-post-fix-emission provenance boundary.

### Evidence-state conclusion (durable)

**The project cannot enter economics-based `analyze` because the shipped accumulation instrument silently fails to preserve the economics required by the ratified analysis questions. State-based history remains usable within observed browser windows.** This is the real stopping point before remediation design turns into implementation.

### Next authorized mode

**Documentation only (this record + intake + journal). No implementation, schema change, runtime change, re-emission, or backfill is authorized.** Remediation design (explicit HTTP-boundary contract; end-to-end validation; provenance boundary) may be proposed for separate Principal authorization; commit remains separately gated.

---

## Active Items — Provider Availability / Degraded-Mode Failover (Sep 2, 2026)

One durable capability/architecture finding, refined (Sep 2, 2026) into an **automatic self-healing failover/failback design**. This is a capability finding + design with architectural consequences, NOT implementation authorization. No automatic switching is implemented or authorized; state names and thresholds below are **working, non-ratified** vocabulary.

| ID | Name | Summary | Concept Home |
|---|---|---|---|
| `PL-PROV-FAILOVER` | Provider Availability / Degraded-Mode Auto-Failover & Failback | **Observed capability + self-healing design (documentation/reconciliation; NOT implementation authorization).** **Observed (2026-09-02):** Tradier production and sandbox entitlements fail independently — a one-shot isolated read-only probe saw production HTTP 401 (unfunded/inactive account) and sandbox HTTP 200 usable market data at the same time. **Intent (Principal):** automatic `production → degraded → production` with no operator intervention and no server restart — on confirmed production-provider *unusability*, continue against sandbox as an explicitly degraded evidence regime; while degraded, periodically probe production; on sufficiently-demonstrated recovery, fail back automatically. **Trigger:** *confirmed production-provider unusability* decided by a governed failure taxonomy — confirmed 401 entitlement/auth is the first demonstrated candidate only; 429 stays ordinary throttling; timeouts/5xx/stale/malformed/market-closure are not automatically equivalent and enter the predicate only via explicit reconciliation. **Governing separation of concerns (current answer):** provider/environment/regime identity is a **provider-control + provenance/storage** concern (Layer 1 control plane; Layer 2 provenance boundary); **Wheelwright domain and operator policy consume evidence *semantic fitness*, never provider identity** (Layer 3). Durable semantic requirements (field names deliberately provisional — see Reconciliation Record "Final architecture" + canonical invariants I1–I13): backend-owned **subject-scoped current evidence selection**; **truthful backend-established provenance for all evidence** (production and degraded alike); freshness/age where relevant; **purpose-appropriate evidence fitness/usability only where implementation actually requires it** (no premature capability ontology); operator-legible **degraded status**; **no Decision/operational branching on provider identity** (provider provenance remains available for display, audit, export, validation, incident reconstruction, opportunity-history provenance, and explicitly governed analysis). **Mixed historical provenance is valid:** a current representation may contain subjects whose selected evidence came from different authority periods; each subject's selection must be unambiguous and provenance-bearing. **Control-plane invariants (Layer 1):** single acquisition authority (multiple provider bindings may exist; one is authority); provider-wide failure must not be projected into per-symbol lifecycle; recovery is established by usable normalized evidence, not by generation/publication/liveness; recovery probes run in an isolated lane (no lifecycle mutation, no ordinary publication, not a second authority); authority transitions are atomic/fenced with in-flight fencing; independent credential custody (selecting a provider must not mutate a shared credential slot); provider availability is orthogonal to the Market Session Model. **Caching:** provider-local caching is server-side and isolated per provider authority (cached responses must not cross provider-authority boundaries ambiguously; mechanism deferred); frontend caching is ordinary HTTP (ETag/If-None-Match/304/Cache-Control) and the frontend is not a shadow evidence database (migration target, not permission to remove IndexedDB while consumers still depend on it). **Health:** no health/status representation may let process liveness or publication activity be mistaken for authoritative evidence availability. **ADR-015 lineage:** extends provenance-authority + no-silent-promotion to provider transitions, without making provider identity pervasive domain state. **Not authorized:** automatic switching, provider-selection implementation, runtime-swappable binding, session-model change, or any runtime change; a future ADR is warranted before implementation (ratify responsibilities/invariants, not premature vocabulary). **Evolution/why-state:** the 2026-09-02 PL-PROV-FAILOVER journal entries. **Failback predicate** is to be informed by an observed production-recovery trace (a live production-recovery observation is running; its status is tracked in the observation artifact/journal, not in this canonical row). | `07-architecture-current.md` (provider boundary, credential custody); `foundations/evidence-appliance.md` (single acquisition authority, session awareness); Market Session Model (orthogonal); **ADR-015** (provenance-authority, extended to provider/environment/regime); `PL-EVID-01`; `PL-DEPLOY-02-DEF01` (authority boundary = hard boundary); `RequestPacer`/`ResponseCache`/`TradierAdapter` and durable structures (`evidence`/`symbol_resolution`/`snapshot_state`/`spot_history`) + `evaluation_epoch` (implementation-truth touchpoints, per Reconciliation Record) |

---

## Reconciliation Completion Record — `PL-PROV-FAILOVER` (Provider Availability Tiers / Degraded-Mode Failover)

**Date:** September 2, 2026 (amended same day: self-healing failover/failback design; then again with Codex read-only implementation-reality findings)
**Method:** `docs/foundations/idea-intake-reconciliation.md`
**Reconciliation state:** RECONCILED (observed capability + self-healing design + implementation-reality-grounded refinement + disposition). Established by contemporaneous read-only evidence; no implementation. Working state/threshold vocabulary is non-ratified.

### Intake

New canonical identity `PL-PROV-FAILOVER`. Reconciled against the complete `docs/parking-lot*.md` sequence: no existing item covers provider failover, degraded mode, or environment-entitlement separation (nearest touchpoints are architectural, not backlog items). Promoted from the earlier "sandbox may work while production is inactive" hypothesis, which is now **observed**, not speculative. **Amended (Sep 2)** — before first commit, to incorporate the Principal's automatic self-healing intent — so the durable record captures the developed formulation rather than the earlier static-capability version (avoids committing-then-superseding churn).

### Strategic disposition

**No new Bet; strengthens resilience/Trustability of the evidence appliance.** A degraded mode lets the always-on appliance keep functioning through a production entitlement/provider outage without misrepresenting evidence quality — directly serving the Trustability differentiator and the appliance identity ("represent the environment, not the machinery"). It also has operational diagnostic value (failure separation). "Good enough" for a first expression = the appliance can continue operating on an explicitly-labeled non-production provider, with an operator-legible degraded status, truthful provenance **retained and made available where it has legitimate diagnostic/evidentiary/analytical/historical/operator value** (not necessarily displayed on every surface — ordinary operator surfaces need not show provider/environment/regime merely because provenance exists), and no silent promotion. Whether/when to build it is a sequencing decision for the Principal; not made here.

### Architectural disposition

**New architectural pressure with a governing invariant set and a three-concept self-healing model; warrants a future ADR — not ratified here.** Codex's read-only implementation-reality review materially enlarged this from the earlier two-axis framing. The emerging architecture is best described as **three related but non-collapsed concepts**: (1) **Provider Availability Lifecycle** (which provider may become authority); (2) **Evidence Regime** — a first-class, uniquely-identifiable interval of evidence authority established by an atomic provider transition (A production → B sandbox/degraded → C production-after-recovery; A and C are distinct authority periods); (3) **Evidence Availability** (operator-facing `NORMAL`/`DEGRADED`/`UNAVAILABLE`). The decisive architectural finding is that **failover must not be modeled as merely swapping an adapter or changing an `environment` string** — it establishes a new regime that scopes caches, durable evidence, and provenance **at the control/storage layer**. Crucially (Principal correction, see "Separation of concerns" below), that regime identity stays a **provider-control + provenance** concern; it must **not** become pervasive domain state. The domain consumes **minimal, purpose-appropriate evidence semantics** (see "Final architecture" below; candidate names remain provisional and unratified), never `production` vs `sandbox`. Current architecture lacks this: the Market Session Model has 6 *session* states but no provider-availability state (I12: orthogonal); `TradierAdapter` binds `baseUrl`/`apiKey` at construction (**OBSERVED**) so switching without restart needs a runtime-swappable, independently-custodied binding; backend `ResponseCache` keys and durable structures (`evidence`/`symbol_resolution`/`snapshot_state`/`spot_history`) carry no regime identity (**OBSERVED**), so a naïve switch could collide/overwrite across authorities; provider-wide failures are currently projected into per-symbol lifecycle (**OBSERVED**: 124 symbols `failed`, 1,920 worker failures during today's provider-wide 401); generation advances on failure with `symbolsAcquiredTotal=0` (**OBSERVED**), so generation is not a recovery predicate. Invariants I1–I13, the Evidence Regime concept, and the confirmed-production-provider-unusability trigger (governed taxonomy, 401 first candidate only) are recorded as **pressure** to be ratified as an ADR — most naturally an extension of **ADR-015's** provenance-authority principle from *timestamp authority* to *provider/environment/regime authority* — **before** any implementation. A DEGRADED mode requires regime/environment provenance to reach the snapshot + durable plane + operator surface; the snapshot contract is frozen (v1), so additive subject-scoped regime provenance may fit, but any change to generation/ETag/supersession/cache-identity semantics is a deliberate **contract-versioning** decision, not an implementation detail.

**Failure-taxonomy discipline (Principal refinement, durable):** the conceptual trigger is *confirmed production-provider unusability*, not `401`. `401` is the first demonstrated candidate because it is the only observed mode. `429` is ordinary throttling (pacer backoff) unless future evidence reclassifies it. Timeouts, 5xx, stale/malformed payloads, and market closure are **not** automatically equivalent and enter the predicate only through explicit reconciliation/evidence. This prevents today's particular outage from being hard-coded into the conceptual architecture.

**Health-representation discipline (Principal refinement, durable):** I6 is *not* "`/health` must go unhealthy when degraded." A DEGRADED appliance may be operationally healthy **as a degraded appliance**. The deeper invariant is representational: *no health/status representation may allow process liveness to be mistaken for authoritative evidence availability.* This likely implies distinguishing multiple health dimensions — process/runtime health, provider/acquisition health, and evidence-authority/availability state — rather than overloading one boolean. Reconcile the representation; do not assume a single flag carries all meanings. Directly addresses the 2026-09-02 hazard (backend "healthy" + advancing generations while `symbolsAcquiredTotal=0`).

### Separation of concerns (Principal correction, Sep 2 — governs how the findings below are applied)

The Codex findings correctly identify hazards, but the *remedy* must not let provider/environment/**regime identity become pervasive application state**. That would be architectural debt: every domain consumer coupled to provider topology, branching on `production` vs `sandbox`. Governing correction:

> **Provider/environment/regime identity is a provider-control and provenance concern. Wheelwright domain state consumes evidence *semantics/capabilities* — it must not branch on production vs sandbox.**

**Three layers, with a hard interface between them:**

- **Layer 1 — Provider control plane (owns regime identity).** Acquisition authority, provider bindings, availability lifecycle, atomic transitions, in-flight fencing, credential custody, recovery probes. "Production vs sandbox" is a first-class *branching* fact **only here**.
- **Layer 2 — Provenance + capability interface.** When Layer 1 produces evidence it stamps (a) **provenance** metadata (regime/environment/timestamps — carried ADR-015-style for audit and to prevent silent promotion; a *ride-along* fact, not a branch input) and (b) a small **evidence-capability/trust** vocabulary that the domain actually consumes: `authority` (authoritative vs superseded), `trustClass`/availability (`NORMAL`/`DEGRADED`/`UNAVAILABLE`), `executable` (may back a broker/executable action — sandbox ⇒ false), and freshness/age. The regime tag rides along as opaque provenance; the capability attributes are the semantic contract.
- **Layer 3 — Wheelwright domain (consumes capability, never source).** Decision/recommendation, Console, Production, opportunity-history *content* logic. Branch on capability/trust, never on `production`/`sandbox`. Example: broker handoff disables when the evidence is *not eligible to support execution*, **not** when `environment == "sandbox"`. Narrowed invariant (Principal, supersedes any absolute "domain never learns why"): **Decision and operational *policy* must not branch directly on provider identity; provider provenance remains available for display, audit, export, validation, incident reconstruction, opportunity-history provenance, and explicitly governed analytical segmentation.**

**Re-triage of source-identity need (which components truly require it):**

| Concern | Needs source/regime identity? | Home |
|---|---|---|
| Availability lifecycle, transitions, fencing, credential custody, probes | Yes — this *is* the control plane | Layer 1 |
| No-silent-promotion / provenance for audit | Yes, as ride-along **provenance metadata** | Layer 2 |
| Cache non-collision across a switch (I6) | As a **storage-partition/invalidate** discriminator owned by L1/L2 — *not* domain branching | L1/L2 mechanism |
| Durable evidence not overwritten/ambiguous (I7) | As **provenance for segmentation/audit** + "failed refresh preserves successful evidence"; domain reads by authority/subject, not by environment | L2 provenance; L3 reads by authority |
| Provider-wide failure not projected into symbol lifecycle (I2) | **No source-branching** — the separation itself | L1 keeps failure; L3 symbol state unaffected |
| Generation ≠ recovery (I3) | No — control decision on usable evidence | L1 |
| Broker/executable gating (workflow constraints) | **No source-branching** — gate on `executable`/`trustClass` | L3 consumes capability |
| Opportunity-history environment label authoritative (I5) | **Provenance only** — analysis segments by it; emission/Decision does not branch on it | L2 provenance on durable record |
| Operator legibility (DEGRADED banner/badge) | **Trust projection, not source** — provider name is at most a diagnostic | L3 consumes `trustClass` |
| Multi-dimensional health (I11) | Yes at L1 (provider availability/lifecycle), projected to L3 as evidence-availability | L1 → projection |

**Consequences for the invariants/model:** the **Evidence Regime** remains a real concept but is **scoped down** — it is a Layer-1 control identity + Layer-2 provenance/partition discriminator, **not** a domain-pervasive field. Invariants I6/I7 are restated as *storage-partition/authority* concerns (evidence must not cross an authority boundary ambiguously) rather than "thread regime through the domain." The frontend fix (#7) becomes *simpler*: the browser should **stop branching on hardcoded `"sandbox"` at all** and consume the published HTTP representation + minimal semantic status; environment on the durable record is authoritative backend provenance used for segmentation/audit, not Decision branching. `DEGRADED` stays the operator-facing **trust** state. **[DESIGN correction — supersedes any earlier wording in this record that implied regime should be pervasive application state.]**

### Final architecture (Principal reconciliation, Sep 2 — authoritative; supersedes provisional wording above where they differ)

**A. Do not overload `authority`; use subject-scoped current selection.** A single boolean/enum must not collapse distinct questions (currently-selected-for-subject? fresh? normal/degraded? usable for observation? usable for decision support? execution-eligible? source? superseded?). These are not the same property: fresh degraded evidence may be the current selected observation for a subject; retained production evidence may be older but historically valuable; production provenance implies neither freshness nor execution-eligibility; degraded evidence may remain useful for observation/experimentation/ranking/UI-continuity/analysis; being selected does not mean valid for every purpose. Where the distinction matters, use **subject-scoped current selection**, not an overloaded generic "authoritative" flag. **Field names are NOT ratified.**

**B. Subject scope — no snapshot-wide lie.** After a transition the population is legitimately mixed: symbol A newly-acquired degraded; B retained pre-transition; C no currently-usable evidence; D different age/capability. A single snapshot-wide flag must not imply every subject has identical status. **The backend resolves currently-selected evidence per relevant subject** according to governed evidence semantics; **the frontend must not reconstruct this selection.**

**C. Capability vocabulary stays provisional.** Candidate distinctions (observation-usable / decision-usable / execution-eligible) and candidate names (`authority`/`trustClass`/`executable`/freshness) remain **hypotheses** until implementation pressure establishes which distinctions Wheelwright actually needs. Do not create a generalized evidence-capability ontology prematurely. Governing requirement: **domain behavior depends on semantic fitness for the intended use, not on provider identity.** Let design/implementation earn the minimum vocabulary.

**D. DEGRADED is legitimate operator-facing state.** The UI may show `DEGRADED` without knowing or branching on the mechanics that caused it. Distinguish provider-control state vs evidence semantics vs operator-facing projection. Provider/source may additionally appear in diagnostic/evidence detail; it must not become the semantic basis for ordinary Decision behavior.

**E. Caching architecture (durable constraint).** *Provider-local caching belongs server-side; frontend caching is ordinary HTTP, not a shadow evidence database.* Server-side: each provider authority has its **own isolated cache** (Tradier production and sandbox must not share cached responses merely because request shape matches). Invariant: **cached provider responses must never cross provider-authority boundaries ambiguously.** This does **not** mandate adding `regimeId` to every cache key — acceptable mechanisms include physically separate per-provider caches, provider-instance-local cache ownership, explicit partitioning, invalidation/replacement at an atomic transition, or eventually an upstream/proxy cache with correct isolation; choose the simplest that preserves the invariant. Frontend: use ordinary HTTP semantics (`ETag` / `If-None-Match` / `304` / `Cache-Control`); the FE should care only that the HTTP representation changed, never *why* (production failed / sandbox active / production recovered / regime transitioned / provider cache replaced — all backend/control-plane concerns).

**F. No frontend shadow database.** Do not respond to the observed browser env-qualified persistence by making its keys more elaborate. First ask why it exists at all and what requirement it serves that backend durable evidence + HTTP caching cannot. For each FE persisted/cache structure, a future design review determines: (1) what requirement it serves; (2) whether that requirement is genuinely FE-local; (3) whether HTTP caching/revalidation satisfies it; (4) whether backend durable state should own it; (5) whether it can be deleted. **Default is deletion/reduction, not expansion.** A structure whose purpose is merely "avoid refetching the same representation" is an HTTP-caching concern.

**G. Backend owns current evidence selection.** The FE receives the resolved current representation + the legitimately-required semantic/provenance envelope. The FE does not reconcile production/degraded/historical-regime/retained-stale populations to decide what the operator sees — that is an evidence-authority responsibility upstream of the UI. Durable stores may contain multiple providers/regimes; that does not force the current HTTP representation to make the FE reconstruct authority from history.

**H. ETags and transitions.** Do not use generation advancement as a proxy for evidence success or provider recovery. The FE needs no provider/regime-qualified ETag logic. The backend ensures that when the authoritative/current representation materially changes, the HTTP validator changes appropriately — an authority transition may change the representation/ETag even if some domain values are numerically identical, because meaningful provenance/trust semantics changed. Solve by publishing a correct representation + validator, not by teaching the FE about regime identity.

**I. Cache-finding reframe (supersedes I6 wording).** Codex's cache finding is valid but its conclusion is **not** "thread regime identity through application caching everywhere." Corrected: *the existing cache is scoped more broadly than the provider authority it represents; correct the ownership/isolation boundary server-side.* Repair mechanism (one cache per adapter / partitioning / invalidation-on-transition / proxy) is a later implementation choice.

**J. Provenance remains mandatory (ADR-015).** This correction does not reduce provenance — it increases it. Evidence must retain enough **backend-established** provenance to answer: where did this come from, when acquired, under what provider authority/regime, what superseded it, what was current at a historical point, what evidence supported an operator-visible conclusion. The only narrowing: *carrying provenance does not imply branching on provenance throughout the domain.* Opportunity-history/governed analysis may segment by provenance (analytical use of metadata), which is not Decision policy branching on provider topology; and opportunity-history provider/environment provenance must originate from backend-established authority, not browser assertion.

**Canonical invariant set (named; authoritative — supersedes any earlier `I#` numbering that differs).** The names are canonical; the numbers are a stable index into them:

- **I1 No silent promotion.** Degraded/non-production evidence must never be silently promoted to production authority; provenance survives acquisition → transform → publish → present → durable (ADR-015 extended to provider/environment/regime authority).
- **I2 Provider-failure ≠ symbol-failure.** Provider-wide unavailability must not be projected into symbol-specific evidence/lifecycle state; provider availability and symbol evidence state are separate concerns.
- **I3 Generation ≠ evidence-success.** Publication/generation advancement is not evidence-success or recovery; recovery predicates require usable normalized production evidence (fresh chains).
- **I4 Single acquisition authority.** Exactly one provider is the acquisition authority at any instant; multiple provider *bindings* may exist (bindings ≠ authorities).
- **I5 Symmetric, authoritative provenance.** Backend-established provenance truthfully identifies origin and authority boundaries for **all** evidence (production and degraded); it must originate from authoritative runtime/provider state, not downstream assertion. Carrying provenance ≠ branching on it.
- **I6 Provider-authority cache isolation.** Cached provider responses must never cross provider-authority boundaries ambiguously (ownership/isolation server-side; mechanism deferred, not `regimeId`-everywhere).
- **I7 Durable non-ambiguity.** Durable evidence must not cross an authority boundary ambiguously; rows carry provenance sufficient for segmentation/audit; domain reads select by subject/authority, not by environment string.
- **I8 Probe isolation.** Recovery probes are bounded availability tests in an isolated lane: no lifecycle mutation, no active-cache population, no ordinary generation, no durable writes, not counted as acquisition, not a second authority.
- **I9 In-flight fencing.** Old-regime in-flight results are not committed as new-authority evidence, or remain explicitly tagged to the prior regime; a transition does not merely replace a pointer while old requests complete.
- **I10 Atomic/fenced transitions + subject-scoped selection.** Authority transitions are atomic or safely fenced; a current representation may contain subjects with different historical provenance, but each subject's selected evidence must be unambiguous and truthfully provenance-bearing.
- **I11 Health honesty.** No health/status representation may allow process liveness or publication activity to be mistaken for authoritative evidence availability; multiple health dimensions are permitted without one boolean carrying all meanings.
- **I12 Orthogonal to Market Session.** Provider availability composes with, and does not merge into, the Market Session Model; it is not a session state.
- **I13 Credential-custody independence.** Selecting provider authority must never require mutating shared credential identity; production and sandbox profiles are independently, simultaneously addressable and custodial.

### Codex implementation-reality findings (OBSERVED, 2026-09-02; grounds the invariants — read through the separation-of-concerns layering above)

Read-only review while the live production-reactivation experiment continued (recovery had NOT occurred: still 401, PID 51965, `c5df959`, no non-401, no usable acquisition, no fresh-chain advancement as of 16:32:27Z). Each finding maps to an invariant above:

1. **Provider-wide outage contaminates symbol lifecycle** (→ I2). Provider errors record as per-symbol failures; 3 failures mark a symbol `failed`. Today: Ready 831 / Failed 124 / Absent 351 / worker failures 1,920 — a provider-wide failure represented as many independent symbol failures. Consequence: recovery probing **cannot** rely on the ordinary symbol queue stumbling back into production requests, because the outage itself ages symbols out of that queue.
2. **Generation is not evidence-success identity** (→ I3). Failures publish snapshots and advance generation while `symbolsAcquiredTotal=0`. Recovery predicate must be usable normalized production evidence (fresh chains), not publication activity.
3. **Provider transition needs explicit regime identity** (→ Evidence Regime concept). Snapshot v1 / quote responses identify state via global generation/ETag, not the provider authority that produced the data. Recommendation: first-class Provider Authority / Evidence Regime identity (candidate attributes: active provider, environment, credential profile, regime ID, provider-lifecycle state, effective/transition timestamp, transition reason — exact shape NOT ratified).
4. **Backend caches not regime-scoped** (→ I6). `ResponseCache` keys are type/symbol/expiration with no provider/environment/regime and no obvious clear/invalidate; a naïve switch could serve sandbox as production for the TTL.
5. **Durable evidence not regime-scoped** (→ I7). `evidence`/`symbol_resolution`/`snapshot_state`/`spot_history` carry no regime identity; a naïve switch could overwrite production rows with sandbox, append sandbox spot-history indistinguishably, reuse timestamps across authorities.
6. **Opportunity-history partially prepared** (→ I5). `evaluation_epoch` already stores provider + environment in epoch identity (preserve, don't replace casually) — but the backend trusts browser-supplied environment labels and surface identity relies on epoch relationship; provenance must originate from authoritative runtime/provider state (ADR-015 authority rule).
7. **Frontend environment handling inconsistent** (→ I5/I7). Durable browser cache supports env-qualified keys, but Write Desk fetches env once at mount, hardcodes `"sandbox"` for some snapshot cache writes/recommendation reads, labels epochs from a separately-fetched env, and deletes obsolete chain records across all environments — a transition could produce a production-labelled epoch with evidence stored under sandbox namespace and cleanup deleting another regime's evidence.
8. **Independent credential custody** (→ I13). One active `TRADIER_API_KEY`/`TRADIER_BASE_URL`; sandbox is a commented alternate under the same names. Automatic failover needs both simultaneously addressable without rewriting a shared mutable slot; separately named/custodied profiles and separately constructed provider paths.
9. **Single authority ≠ single adapter instance** (→ I4). One startup-bound adapter/cache/pacer/worker today (why switching implies restart). Preserve one active *authority* while allowing multiple provider *bindings* to exist.
10. **Probes need an isolated lane** (→ I8). A probe answers only "is production capable of usable normalized evidence again?" — no lifecycle mutation, no active-cache population, no ordinary generation, no durable write, not counted as acquisition, not a second authority.
11. **Atomic transitions need in-flight fencing** (→ I9). Queued/in-flight old-regime requests must not persist as authoritative after the new regime becomes active; commit only if the acquisition's origin regime is still valid at its commit boundary, or keep the result explicitly tagged to the prior regime.
12. **Status health needs multiple dimensions** (→ I11). `/api/status` can look operational while production acquisition is fully unavailable; distinguish runtime/process, provider availability/lifecycle, active regime, evidence availability/authority, recovery-probe state, redacted credential readiness — without forcing one boolean.

### Single-authority, atomicity, and probe-isolation (design, working vocabulary)

- **Single acquisition authority (I4):** exactly one provider is the acquisition authority at any instant, preserving the evidence-appliance single-authority principle (multiple provider *bindings* may exist; only one is *authority*). Production-recovery probes in `DEGRADED_SANDBOX`/`PRODUCTION_PROBING` are bounded availability tests, not a second authority, and do not write authoritative evidence.
- **Atomic / fenced transitions (I10 + I9):** acquisition-authority transitions and in-flight-result handling are atomic or safely fenced. A published current representation **may** contain subjects whose selected evidence has different historical provenance; each subject's selected evidence must remain unambiguous and truthfully provenance-bearing. (Superseded: the earlier "no snapshot straddles two authorities.") Transition-boundary details (generation vs cycle) remain an open design question.
- **Probe isolation (I8):** production probes use a separate admission lane from the active sandbox workload (the pacer already owns an authoritative-backoff mechanism, currently 429-only — **OBSERVED** — a conceptual hook, not a reuse mandate). Probes must not consume sandbox budget, and sandbox/production request counts must not be conflated.
- **Hysteresis / anti-flapping (structural; thresholds experimental):** `PRODUCTION_PROBING` exists so a single successful production request does not cause immediate failback and oscillation. Anti-flap is structurally required on both entry and failback; numeric streak length/duration remains experimental/configurable and should be informed by real recovery evidence (see below), not fixed here.

### Relationship to today's live recovery observation (evidence provenance)

Codex is currently running a read-only production-reactivation observer against the live runtime. Its recovery trace (continued 401 → first non-401 → first usable acquisition → advancing fresh chains → sustained) is the **natural experiment** that may inform the failback predicate and its hysteresis thresholds. Implementation is deliberately deferred until that evidence lands, and this design must not disturb that observation.

### Parking-lot disposition / mapping

`PL-PROV-FAILOVER` **created**. Cross-referenced to `07-architecture-current.md` (provider boundary), `foundations/evidence-appliance.md` (session awareness / single acquisition authority), the Market Session Model, `ADR-015` (provenance principle), `PL-EVID-01`, and `PL-DEPLOY-02-DEF01` (the failure that surfaced it). The sandbox-separation hypothesis is now **resolved to an observed capability** under this ID. The browser-emitter failure (Blocker B) remains a **separate** unresolved concern (see journal 2026-09-02), explicitly NOT diagnosable from sandbox success.

### Eventual implementation decomposition (NOT authorized; for future sequencing)

Dependency/decomposition guidance (Principal, point 19 — NOT implementation authorization; exact numbering is not a work order). Follows the corrected architecture (control-plane isolation + backend-owned selection + HTTP-oriented FE), not regime propagation. **Hard prerequisite (overrides the ordering below):** the provider lifecycle/transition *state model* (step 4) may be designed first, but **no runtime provider-authority transition may be enabled/activated until in-flight fencing (step 9, invariant I9) is implemented and verified.** Designing the state machine before fencing is acceptable; *activating* a live transition before fencing is not.
1. **Separate provider-wide failure from symbol lifecycle** (I2): provider-wide unavailability must not mark symbols `failed`. Prerequisite — otherwise the outage ages symbols out of the queue and corrupts recovery.
2. **Independently configured provider instances/profiles** (I13): production and sandbox separately represented; selecting a provider must not mutate one shared credential slot; multiple bindings, one authority (I4).
3. **Provider-local cache isolation** (I/E reframe): each provider authority owns its cache; cached responses never cross provider-authority boundaries ambiguously. Simplest mechanism that preserves the invariant (separate caches / partition / invalidate-on-transition / proxy) — NOT `regimeId` on every domain cache key.
4. **Backend-owned provider control / authority-transition semantics**: the Provider Availability Lifecycle state machine, single authority, atomic transitions.
5. **Recovery-probe isolation** (I8): isolated lane; no lifecycle mutation, no ordinary evidence publication, not a second authority.
6. **Evidence provenance at the acquisition boundary** (Layer 2 / ADR-015): truthful backend-established provenance (source, time, provider authority/regime, supersession) as ride-along metadata.
7. **Subject-scoped current evidence selection** (B): backend resolves currently-selected evidence per relevant subject under governed semantics; mixed transitional populations represented truthfully; FE does not reconstruct selection.
8. **Derive only the minimum downstream evidence semantics/capabilities actually required** (C): purpose-specific fitness (e.g. observation- / decision- / execution-appropriate) earned by implementation pressure; no premature generalized capability ontology; names unratified.
9. **Safe in-flight fencing / transition behavior** (I9): old-regime in-flight results not committed as new-authority evidence, or kept explicitly tagged to the prior regime.
10. **Publish correct HTTP representations and validators** (H): representation/ETag changes when meaningful current-representation semantics change; generation advancement is not evidence-success; FE needs no regime-qualified ETag logic.
11. **Remove/reduce frontend evidence caching that duplicates backend state** (F): apply the five-question review; default to deletion/reduction; do not expand env-qualified keys into a shadow evidence DB.
12. **FE consumes HTTP representations + semantic evidence status, not provider identity** (L3): remove hardcoded `"sandbox"`; Decision/operational policy branch on fitness, never on source.
13. **Preserve provenance for diagnostics/history/export/analysis** (J): display, audit, export, incident reconstruction, opportunity-history provenance (backend-authoritative), governed analytical segmentation — not Decision branching.
14. **Truthful multi-dimensional health / operator DEGRADED presentation** (I11/D): process vs provider availability vs evidence availability vs probe state; liveness/publication never mistaken for authoritative-evidence availability; UI shows DEGRADED without branching on mechanics.
15. **Then** implement automatic `production → degraded → production` lifecycle behavior.

**Tests (eventual):** failover on confirmed production-unusability; failback only on sustained usable-production recovery; no-flap; provenance survives all boundaries; provider-failure does not mark symbols failed; cached responses never cross provider-authority boundaries; in-flight fencing; subject-scoped selection truthful under mixed populations; health/status honesty; FE holds no shadow evidence DB and branches on no provider identity.

### Why-state

Durable why-state across three same-day 2026-09-02 journal entries: (a) "Provider availability tiers / degraded-mode failover" (incident + isolated probe evidence, prod 401 + sandbox 200 concurrently, conservative interpretation); (b) the self-healing-design amendment (state model, confirmed-production-unusability trigger + governed taxonomy with 401 first candidate only, no-silent-promotion extended to provider/environment, health-representation refinement, single-authority/atomicity/probe-isolation/hysteresis); (c) the Codex implementation-reality amendment (the twelve OBSERVED findings; upgrade to the three-concept model with a first-class Evidence Regime; expanded invariants I1–I13); (d) the final Principal reconciliation (three-layer separation authoritative; de-overload `authority` → subject-scoped current selection; capability vocabulary provisional; provider-local cache isolation server-side; no frontend shadow evidence DB, HTTP-oriented FE; backend-owned current selection; ETag/validator correctness without FE regime logic; narrowed "policy must not branch on provider identity" invariant; provenance mandatory and increased). Today's live Codex recovery observation remains the failback-predicate experiment.

### Next authorized mode

**Documentation only (this record + intake + journal).** No automatic switching, provider-selection implementation, runtime-swappable provider binding, session-model change, or runtime change is authorized. Design of "what DEGRADED is allowed to do and how it must announce itself," and any provider-availability ADR, may be proposed for separate Principal authorization; commit remains separately gated. Codex retains execution ownership of the live production-recovery observation, which must not be disturbed.

---

## Continuation History

| Date | Event |
|---|---|
| Sep 1, 2026 | `docs/parking-lot-3.md` created. `PL-EVID-AGE` established as the canonical stable intake identity for Deployment evidence Age and the related operator-intent acquisition-tier investigation. This normalizes the earlier standalone Doc 41 / GitHub Issue #1 intake into the standard parking-lot-first pipeline. |
| Sep 1, 2026 | `PL-EVID-AGE` Reconciliation Completion Record added (first slice = observational Deployment Age). Strengthens G6/N1 + Trustability; no new Bet; no roadmap change; no architecture-roadmap change; no new architecture ratification. Whether the timestamp/provenance-separation rule warrants its own ADR is an open Principal decision. Next authorized mode: implementation (single owner Kiro), observational only, commit gated. |
| Sep 1, 2026 | `PL-EVID-AGE` Reconciliation Completion Record **corrected** after Principal review. Architectural disposition revised from "no change" to **ADR-015 ratified** (Evidence Provenance Authority and Preservation): provenance authority is upstream at publication; downstream preserves/composes/presents but does not establish it; provenance is subject-scoped. Snapshot gains additive subject-scoped fields (`chains[].chainAcquisitionProvenance`, `primaryChainAcquisitionProvenance`) under INV-PUB-05 — a real contract change. Recorded the process-gate violation (implementation occurred before authorization; retained as provisional evidence only) and the live-experiment repository-state discontinuity. Next authorized mode: durable authority first, then a separate implementation authorization. |
| Sep 1, 2026 | `PL-EVID-AGE` shipped to production (Age live, backend-published subject-scoped provenance; regime boundary 13:24:23 MDT). Post-release review correction pass added focused tests and a publisher timestamp-validation fix (no-silent-promotion). **Bounded follow-up recorded under `PL-EVID-AGE` (deferred, not a defect):** make `evidenceProvenance` **required** on chain-derived types (chain-derived cache records, Deployment candidates, conditioned-call evidence/opportunities; non-chain cache records exempt). Currently optional → missing degrades safely to `unavailable`; tightening is material (~7 interfaces, ~100 test/fixture refs) so it is a separate future increment. Also still deferred under this ID: quote-acquisition provenance and the stronger "oldest economically material evidence age" semantic. |
| Sep 1, 2026 | Colored-line/surface/scheduler audit (post-Age) recorded three distinct new intake items: `PL-POSTURE-01` (posture/colored-line semantic + CSS drift), `PL-SURF-01` (Deployment result-surface completeness/truncation), `PL-SCHED-DRIFT` (scheduler policy-vs-code breadth-first ordering drift). Reconciled against the complete `parking-lot*.md` sequence first: no existing item covered these; recorded as new, cross-referenced to adjacencies (`PL-CLEANUP`, `PL-DEPLOY`, `PL-SHELL`, `PL-EVID-AGE`, `PL-EVID-01`, G6/N1, AR2). The A/B/C/D provider-capacity measurement was framed here as "the next discriminating experiment"; that framing was chronologically wrong and is corrected in the Sep 2, 2026 continuation-history row below — A/B/C/D was already measured 2026-08-27 and superseded by the opportunity-history instrument. Exploration only; no coding, no runtime change. Rich why-state: journal 2026-09-01. |
| Sep 1, 2026 | Read-only assessment of whether the shipped opportunity-history plane has accumulated enough to enter the ratified `analyze` step. Corrected an earlier handoff assumption: the A/B/C/D measurement was substantially already run, interpreted (2026-08-27 ruling), and superseded by the opportunity-history fact plane (shipped 2026-08-28). Inspection (live backend + `sqlite3 -readonly`) found the plane preserves state/evaluation facts but persists **all winner economics as NULL** (62,404 surface rows) due to a silent frontend(nested `winner`)↔backend(flat `bestX` DTO) HTTP-boundary contract mismatch; Codex independently reproduced the same DB state and wire-path failure. Recorded as new child intake `PL-DEPLOY-02-DEF01` under `PL-DEPLOY-02` (concept-home), cross-referenced `PL-EVID-01` and `PL-ARCH-06`, related to ADR-015 by principle only. Classified as an implementation defect violating the opportunity-history evidence-preservation contract/invariant (not a new concept). Durable evidence-state conclusion: **cannot enter economics-based `analyze`; state-based history usable only within observed browser windows; further economics accumulation under current code is invalid for the intended hypotheses; no backfill; first validated post-fix emission is the economics-analysis provenance boundary.** Browser-only emission recorded separately as a known continuity limitation (`PL-EVID-01`/`PL-ARCH-06`), not part of the defect. Candidate ingestion invariant recorded mechanism-neutrally. Documentation only; no implementation, no runtime change, no commit. Rich why-state: journal 2026-09-01. |
| Sep 2, 2026 | **`PL-PROV-FAILOVER` established (provider availability tiers / degraded-mode failover).** During the 2026-09-02 production-entitlement outage (opening-bell capture failed on two independent blockers: production 401 + browser emitter not operating), an authorized one-shot isolated read-only sandbox probe demonstrated **contemporaneous** production HTTP 401 + sandbox HTTP 200 usable market data — production and sandbox entitlements fail independently, enabling explicit degraded-mode failover. Recorded as a capability/architecture finding (not implementation): candidate NORMAL/DEGRADED/UNAVAILABLE tiers; governing invariant "failover may preserve operation but must never silently promote degraded evidence to production evidence" (ADR-015 provenance principle extended to environment). Sandbox success = access/entitlement separation ONLY; not evidence equivalence and NOT usable to diagnose the browser emitter (running appliance stays on production, confounded by the outage). No provider switch/restart/config change; Codex's recovery observer undisturbed. Documentation only; no automatic switching authorized. Rich why-state: journal 2026-09-02. |
| Sep 2, 2026 | **Chronology correction (Codex review).** Corrected a historical inconsistency in the D1–D3 audit text of commit `3ae5413`: it narrated the A/B/C/D measurement as unrun / the next-or-first discriminating experiment. A/B/C/D was already measured in the 2026-08-27 Production experiment (A=443, B=1907, C=0, D=0) and interpreted by the 2026-08-27 3AM ruling, which selected opportunity-history as the next instrument. Corrected `docs/parking-lot-3.md` in place (audit intro, `PL-SCHED-DRIFT` clause, prior audit continuation-history row) and the journal via inline correction notes + a 2026-09-02 correction entry (append-only; `3ae5413` not rewritten, no force-push). Also tightened D2/`PL-SURF-01` wording (buy-write evidence is not wholly invisible to A/B; A/B does not represent buy-write relevance, per-expiration cardinality, buy-write economics/posture, affordability, or the operator-facing decision population) and removed two duplicate `---` separators + a missing final newline while in the file. Corrected canonical chronology: Aug 27 A/B/C/D experiment → ruling selects opportunity-history → Aug 28 instrument ships → Sep 1 Age + D1–D3 sharpen breadth-vs-decision → cold start recovers prior experiment → inspection finds opportunity-history instrument defect (`PL-DEPLOY-02-DEF01`) → repair / corrected accumulation next. No substantive change to D1/D2/D3, the ruling, or `PL-DEPLOY-02-DEF01`. |
| Sep 4, 2026 | **Final PL-CLEANUP reconciliation (one-time authoritative rewrite).** Baseline SYNC `edcbfb2`. `PL-SHELL` residual boundary recorded as **RESOLVED/RATIFIED** (Console → Deployment → Production within the shared shell; subordinate engineering area outside operator navigation; import-direction rule as target boundary with known current violations; per-Lab migrate/preserve/delete; Deployment canonical name; `/engineering/*` vocabulary direction only; Kreature out of scope, Issue #10 separate). `PL-CLEANUP` rewritten once against the ratified target under the governing phase "reduction of accidental change surface before the next product-learning expansion," decomposed into four bounded packages with execution order **P2 (preserve 3 engineering capabilities behind one subordinate boundary) → P3 (separate governance judgment from acquisition; sever dead `/api/market`/proxy/factory) → P1 (delete 8 superseded Lab/spike surfaces after survivors relocated) → P4 (vocabulary/coherence; no mechanical `wd-*` campaign)**. Explicit exclusions, exit criterion (Sonar-zero/aesthetics are NOT exit criteria), key implementation evidence, and Reconciliation Completion Record added. Row rewrites in `docs/parking-lot.md`; full decomposition here. Documentation only; no production code; no cleanup implementation. Next authorized mode: read-only per-Lab disposition pass. Why-state: journal 2026-09-04 (`edcbfb2`). |


---

## Final PL-CLEANUP Reconciliation (2026-09-04)

**Method:** `docs/foundations/idea-intake-reconciliation.md`
**Baseline:** accepted `main` at SYNC `edcbfb2e8f71b124ace28a00d5e58393d2600bd0` (remotely verified).
**Mode:** Decision + Documentation. No production-code implementation. No cleanup execution.
**Provenance:** cleanup re-baseline + ratified residual `PL-SHELL` boundary in journal 2026-09-04 (commit `edcbfb2`).

This is the **one-time authoritative rewrite** of `PL-CLEANUP`, deferred until the residual `PL-SHELL` boundary was ratified and Codex completed the current-code Lab retirement trace. It replaces the stale "holistic cleanup" scope with a bounded, dependency-ordered decomposition.

### PL-SHELL final status — RESOLVED / RATIFIED

The residual boundary is ratified (see the `PL-SHELL` row and journal `edcbfb2`). Summary of the resolved boundary:

- Operator topology is **Console → Deployment → Production** within the shared Application Shell.
- A **subordinate engineering area** exists outside operator navigation; engineering instruments are **not** operator surfaces.
- **Operator application code must not depend on engineering-only behavior or surface implementations.** Capabilities shared with the operator application must graduate into an appropriate shared/domain boundary. Historical file location does not determine architectural status.
- The **import-direction rule is a target boundary with known current violations** that cleanup reconciles.
- Every historical Lab capability receives exactly one disposition: **migrate / preserve as subordinate engineering instrument / delete**.
- **Deployment** is the canonical operator-facing name for the current WriteDesk surface.
- `/engineering/*` is the ratified **vocabulary/topology direction**; `/labs/*` is transitional. **No `/engineering/*` route implementation has occurred.**
- **Kreature is explicitly outside this decision** and separately governed; its navigation inconsistency remains **GitHub Issue #10**.

### Governing phase

> **Reduction of accidental change surface before the next product-learning expansion.**

This is not a generic technical-cleanup campaign. Every intervention must name the future Wheelwright change it makes easier, safer, or cheaper.

### PL-CLEANUP decomposition — four bounded packages

**Execution order (dependency safety): P2 → P3 → P1 → P4.** The package numbers preserve investigation/decomposition history; the arrows are the execution order.

**Package state (updated 2026-09-04):**

| Package | State | Note |
|---|---|---|
| **P2** — Minimal Engineering Capability Preservation | **COMPLETE / ACCEPTED** | Implementation commit `41d3239`. `/engineering/*` established with exactly the three preserved instruments; historical `/labs/*` host retained transitionally. See journal 2026-09-04 P2 completion record. |
| **P3** — Governance Extraction + Legacy Provider Severance | **COMPLETE / ACCEPTED** | Implementation commit `d8905fa`. `evaluateSymbolAdmission` now accepts explicit `AdmissionEvidence` (no provider, no network/clock/identity/provenance side effects); governance semantics preserved. Velvet Rope Lab UI retired (capability preserved); dead provider/acquisition path severed (`ProxyMarketDataProvider`, `providers/index.ts`, `acquire-evidence.ts`, `pendingVelvetRopeSymbol`). Deployment identity `"tradier"` and `"sandbox"` env unchanged. See journal 2026-09-04 P3 completion record. |
| **P1** — Historical Lab / Spike Deletion | **NEXT** | Owns final deletion/collapse of the eight remaining historical Lab surfaces + `App.tsx` Lab host; Velvet Rope no longer among them. |
| **P4** — Vocabulary / Coherence | pending P1 | — |

The ratified execution order (**P2 → P3 → P1 → P4**), package definitions, exclusions, and exit criterion below are unchanged by this state update.

#### Package 2 — Minimal Engineering Capability Preservation (execute first)

Establish **one** subordinate engineering boundary/host. Preserve exactly these three ratified engineering capabilities:

1. Universe inspection / local candidate maintenance.
2. CSV parsing/classification diagnostics.
3. Scenario Replay research capability (`PL-RESEARCH-03`).

Constraints:

- Browser-local universe candidate additions are **not** authoritative backend universe admission.
- Preserve the production/shared `universe/*` capability used by Deployment.
- Preserve production CSV readers, registry, Fidelity parsers, preprocessing, fixtures, integrations, and tests.
- CSV diagnostics must **not** become a competing production-ingestion path.
- Preserve Scenario Replay pure parser/projector/diff logic, fixtures, and deterministic tests. Scenario-specific CSV parsing stays research/fixture parsing, not production ingestion.
- `/engineering/*` is the intended direction; `/labs/*` is transitional. Do **not** preserve the historical twelve-tab Lab application merely to host three instruments.

#### Package 3 — Governance Extraction + Legacy Provider Severance (execute second)

Architectural objective: **separate governance judgment from evidence acquisition.**

- Preserve Velvet Rope policy, criteria, product-structure, audit/narrative semantics, and other domain capabilities still used by live Wheelwright code.
- Admission judgment should accept explicit evidence and provenance rather than acquiring market data itself; ultimately feed governance evaluation from Wheelwright's supported published evidence contract rather than `/api/market`.
- Preserve/add golden or parity tests proving equivalent judgments for fixed evidence.
- Remove the historical `pendingVelvetRopeSymbol` Lab handoff when the Lab UI retires.
- After no legitimate consumers remain, retire the obsolete browser acquisition/provider path where proven safe: `/api/market`, `ProxyMarketDataProvider`, provider factory, mock provider abstraction, zero-caller acquisition scaffolding.
- Preserve Deployment cache/recommendation/provenance semantics. Do **not** casually replace the current stable provider identity while deleting the obsolete factory.
- The provider deletion is a **consequence** of separating judgment from acquisition, not the primary objective.

#### Package 1 — Historical Lab / Spike Deletion (execute third)

After P2/P3 relocate/preserve survivors, delete the superseded historical surfaces: Laboratory / Delta Probe, ReferenceDataView / Options Chain, RecommendationLab, OpportunityLab, EtfCatalogExplorer, SecExplorer, FmpExplorer, MassiveChainView — plus their exclusive supporting code, provider spikes, obsolete tests, and configuration — **only after reverse-dependency evidence establishes that no surviving capability requires them.**

- `App.tsx` historical Lab topology must not collapse until P2/P3 have moved/preserved its legitimate survivors.
- Do **not** confuse RecommendationLab with the live Deployment recommendation engines.
- Do **not** preserve research modules merely because obsolete tests reference them.
- Do **not** delete shared CSS based only on historical section headings.

#### Package 4 — Vocabulary / Coherence (execute last)

After structural deletion establishes what remains genuinely live:

- Reconcile WriteDesk / `write-desk` toward canonical **Deployment** terminology where it reduces semantic ambiguity.
- Move live types out of the misleading `scan-orchestrator.ts` naming.
- Prune obsolete Lab/workspace state; remove remaining `/labs` terminology.
- Reconcile `PL-POSTURE-01` semantic CSS duplication.
- Reduce obsolete global CSS where structural deletion proves it dead.
- **Explicitly avoid** a mechanical `wd-*` rename campaign unless a particular rename reduces ambiguity or fragility.

### Explicit exclusions (PL-CLEANUP must not absorb)

- GitHub Issues/defects, including Issue #10 and existing S2/S3 defects.
- Sonar findings as an automatic task queue.
- `AcquisitionWorker` / provider-admission restructuring while the current constraint investigation constrains it.
- Dependency upgrades; cloud work; scheduler/backend feature work; feature redesign; generalized refactoring; aesthetic cleanup.
- Documentation/authority reconciliation outside this specific PL-SHELL/PL-CLEANUP update remains governed by the Technology Quality Program.

### Cleanup exit criterion (governing stopping rule)

> The cleanup increment ends when:
> - only the three approved engineering capabilities remain deliberately behind the engineering boundary;
> - governance evaluation no longer depends on legacy browser acquisition;
> - the eight superseded Lab/spike surfaces and their exclusive dependencies are gone;
> - `/api/market` and obsolete direct-provider coupling no longer enlarge ordinary change scope;
> - operator behavior remains stable.

> **Zero Sonar findings and aesthetic perfection are NOT exit criteria.**

At that point Wheelwright reassesses readiness for product/infrastructure expansion.

### Key implementation evidence (why these packages and this ordering)

- `App.tsx` currently hosts the historical Lab topology (legacy view-switcher, reachable at `/labs/*`).
- Operator surfaces do not legitimately use `ProxyMarketDataProvider`.
- `WriteDesk` currently retains only the configuration/helper identity (`isTradierConfigured`) rather than using the proxy provider itself.
- Velvet Rope domain functions are consumed by live recommendation code and therefore cannot be deleted alongside `VelvetRopePage`.
- Universe candidate additions are browser/localStorage behavior, not backend universe admission.
- CSV and Scenario pure infrastructure retain production/research value independent of historical Lab presentation.
- The `/api/market` proxy pipeline is dead at the backend-contract level (backend serves no `/api/market` route), yet retired Labs keep it imported — accidental change surface.
- Therefore **Packages 2 and 3 must precede Package 1 deletion.**

---

## Reconciliation Completion Record — `PL-CLEANUP` (Accidental-Change-Surface Reduction) + `PL-SHELL` resolution

**Date:** September 4, 2026
**Method:** `docs/foundations/idea-intake-reconciliation.md`
**Reconciliation state:** RECONCILED. `PL-SHELL` residual boundary RESOLVED/RATIFIED; `PL-CLEANUP` rewritten once against the ratified target and decomposed into four dependency-ordered packages.

### Intake

Canonical identities retained: `PL-SHELL` (now resolved) and `PL-CLEANUP` (rewritten). No new IDs created. Absorbs former `PL-OPS-02`, `PL-OPS-05`, `PL-OPS-06` (scan functions already retired — verified), `PL-OPS-07`. Cross-references `PL-POSTURE-01`, `PL-SURF-01`, `PL-RESEARCH-03`, `PL-DEPLOY-02-DEF01`, `PL-PROV-FAILOVER`, `PL-ARCH-06`.

### Strategic disposition

**No new Bet; no roadmap change.** This is a consolidation/recovery phase (accidental-change-surface reduction) that precedes and de-risks the next product/infrastructure expansion. It strengthens the Trustability differentiator and reduces cost-of-change; it does not create new product direction.

### Architectural disposition

**Conforms to ratified architecture; no new architectural direction.** The residual `PL-SHELL` boundary is the faithful closure of docs 31/32 (three operational surfaces + shared shell + subordinate engineering area; capability-migration Lab retirement). The import-direction rule is the load-bearing invariant. `/engineering/*` is ratified vocabulary/topology direction only — no route/build separation is authorized; a build-system boundary is not authorized absent demonstrated evidence that the logical/import boundary is insufficient. Provider deletion is a consequence of separating governance judgment from acquisition.

### Parking-lot disposition / mapping

`PL-SHELL` **resolved** (row updated in `docs/parking-lot.md`). `PL-CLEANUP` **rewritten** (row updated in `docs/parking-lot.md`; full decomposition here). Documentation/authority leg **ceded** to the Technology Quality Program. Defects (Issue #10, S2/S3) remain in GitHub Issues, not double-booked.

### Why-state

Durable why-state: journal 2026-09-04 (`edcbfb2`) — cleanup re-baseline verified findings + ratified residual PL-SHELL boundary + withdrawn "PL-CLEANUP cannot lead" framing. This reconciliation record is the observable completion evidence.

### Next authorized mode

**Current-code per-Lab disposition pass** (read-only investigation) to assign each `/labs/*` capability migrate/preserve/delete under the ratified rule and gather reverse-dependency evidence — the input to bounded execution. **No cleanup implementation is authorized by this record.** Each package's execution requires separate Principal authorization; commit remains separately gated.
