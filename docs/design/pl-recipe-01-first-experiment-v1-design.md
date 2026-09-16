# PL-RECIPE-01 — First Recipes Experiment V1 — Bounded Design / Decomposition

**Status:** Design decomposition — **first experiment fully specified and reviewed; implementation authorization pending.** **NOT implemented, NOT authorized for implementation, NOT authorized for execution.** This is not an `IMPLEMENTABLE` state; design completeness does not confer implementation or execution authority (see §12).
**Authority:** Supporting design artifact (Category E). Canonical identity and reconciliation are `PL-RECIPE-01` in `docs/parking-lot-8.md` (INTAKE + Reconciliation Completion Record, RECONCILED 2026-09-16). Accepted why-state: `docs/journal/project-journal-3.md` (2026-09-16 entries).
**Produced:** 2026-09-16, under Principal-authorized documentation-preparation + design/decomposition (reconciliation → completion record → experiment design → implementation-readiness review, explicitly stopping before implementation authorization).
**SYNC SHA:** `05ada5869fa0bc8b4b862887d73321a277aba882` (remotely verified accepted `main`).
**Governing homes (no new identity):** `LVT-BET-COMPENSATION` → `LVT-INIT-COMP-COMPARE` (primary); `LVT-BET-ACCEPTABILITY`/`LVT-INIT-ACCEPT-GATES`; `LVT-BET-EXPLANATION`/`LVT-INIT-EXPLAIN-TRADEOFFS`; architectural home AR5 within the Decision Engine under `PL-DEPLOY`; frozen-substrate discipline AR8. `PL-DEPLOY-EXPORT` supplies the evidence substrate.

---

## 1. Purpose and single question

The experiment answers exactly one question, and no more:

> **Does applying an explicit contract constraint (a delta fence) to selection produce materially different, explainable selections than (a) accepted Wheelwright behavior and (b) raw yield — over one identical, frozen candidate population?**

If the constrained arm does not materially and explainably differ from the accepted-Wheelwright and delta-constrained-yield behavior, **do not build a generalized recipe abstraction** (see §9 stop criterion). This experiment is a falsification instrument, not a recipe engine.

### What this experiment explicitly does NOT test (limited claim — carried from `PL-RECIPE-01` §6)

It does not test competing ranking philosophies, theta-based ordering, gamma/vega-aware ranking, Pareto selection, surface-agreement/dislocation logic, IV-based selection, or generalized Recipes as a production abstraction. A later experiment requires a **genuinely distinct ordering preference** before any evidence claim about the broader recipe concept.

---

## 2. Non-negotiable invariants (bound every downstream implementation)

1. **Winner-selection behavior does not change.** The accepted-Wheelwright arm runs the *real* `recommendPuts` selection path (posture-bucket winner selection `bestActionable ?? bestEdge ?? bestWait`, then `rankByPolicy`). No edit to `recommend.ts` selection/ranking/posture/eligibility semantics.
2. **No recipe engine.** The experiment is an offline/analysis comparison over a captured population. It introduces no runtime recipe abstraction, no `RankingPolicy` mode, no new candidate type, no UI.
3. **Capture, not refresh.** Producing the frozen population must not trigger provider acquisition, recommendation reevaluation, or candidate regeneration. It is a read/capture of already-acquired evidence (AR8; same discipline as `PL-DEPLOY-EXPORT`).
4. **Evidence semantics are owned upstream.** The experiment consumes evidence as-is: `midIv` ≠ `smvVol` (never collapsed/aliased/inverted); absence = `null`, never `0`; exact provider `0.0` preserved; absolute IV is never treated as IV richness. No local IV computation. (The first experiment uses none of the IV/secondary-Greek fields for selection; they may be *captured* for provenance but must not enter arm logic — see §4.)
5. **Authority-spine conformance (ADR-013/015/016/017).** The experiment is a consumer: it presents authoritative facts and preserves provenance; it must not re-derive admissibility/session policy, must not reconstruct provenance, must not promote interpretation into fact.
6. **Deterministic + replayable.** Same frozen input + same arm definitions ⇒ identical outputs. No wall-clock, no randomness, no `Date.now()` in arm logic.

---

## 3. Frozen input artifact (the shared population)

### 3.1 Definition

A single, immutable capture of the **post-admissibility, pre-winner-selection** contract population for the put side, as defined in the `PL-RECIPE-01` Reconciliation Completion Record. Concretely, the set of admissible put candidates that survive, in order:

- confirmed-absence check (excluded);
- admissible + eligible expirations (`isEligible` → `isSubjectAdmissible`, Issue #16 backend per-subject admissibility verdict; fail-closed while authority pending);
- eligible DTE (`selectEligibleExpirations` against `eligibleDteRange`);
- admissible chain (`isEligible`);
- contract-level admissible delta (`|delta|` within `admissibleDeltaRange`) and hard-no survival (zero-bid, zero-OI excluded; wide-spread annotated, retained).

This is the set **before** the per-symbol collapse `best = bestActionable ?? bestEdge ?? bestWait`. Every admissible `(symbol, expiration, strike)` triple is retained.

### 3.2 Why pre-collapse is mandatory

`recommendPuts` today keeps at most one contract per symbol (posture-bucket winner, then `maxContractsPerSymbol: 1`). If the experiment captured the *board* (post-collapse), arms 2 and 3 could only re-order contracts the accepted path already chose — structurally biasing the result toward "no difference" (a false negative). The whole point is that a delta fence may select a *different contract for the same symbol* than the accepted collapse. The captured population must therefore be pre-collapse.

### 3.3 Per-candidate captured fields (minimum)

For each admissible triple, capture the fields the three arms and the measurements require, plus provenance:

- Identity: `symbol`, `expiration`, `dte`, `strike`.
- Economics/selection inputs actually used by current code: `bid`, `ask`, `mid` (`(bid+ask)/2`), `delta` (raw, provider sign), `yieldAnnualized` (as computed by the existing `annualizedYield(mid, strike, dte)`), `assessment.score`, `posture`, `spreadPercent`, `openInterest`, `volume`, `cashRequired` (`strike*100`).
- Provenance (per ADR-015): the candidate's authoritative `evidenceProvenance` (`chain-acquired` acquisition instant) — copied, never synthesized.
- Optional evidence-only capture (for provenance/inspection, NOT arm inputs): the raw `exportGreeks` (`delta,gamma,theta,vega,rho,midIv,smvVol,greeksUpdatedAt`) already attached to each candidate. Capturing these is permitted; **using any of gamma/theta/vega/rho/midIv/smvVol in arm selection is out of scope for V1.**
- Capture metadata: a single capture instant, the snapshot generation, and the provider/environment — captured once for the whole artifact. One artifact does not imply one shared acquisition instant across rows; each row keeps its own `evidenceProvenance`.

### 3.4 Artifact properties

Immutable once written; self-describing (schema/version, capture instant, generation, policy version used to define admissibility); replayable (re-running any arm against the same artifact reproduces identical output). Storage form is an implementation detail (a captured JSON/CSV analysis artifact is sufficient); it is **not** durable domain evidence and must not enter any production cache.

---

## 4. The three arms (identical population; identical selection unit)

All three arms consume the **same** frozen artifact and emit the **same selection unit**: an ordered list with **at most one selected put contract per symbol**, so the arms are compared like-for-like against accepted Wheelwright's one-per-symbol output. Each arm is a pure, deterministic function `(frozenPopulation, armParams) → orderedSelection[]`.

### Arm A — Accepted Wheelwright (control; real path)

The selection and ordering **produced by the existing `recommendPuts` + `rankByPolicy` path** under the current `DEFAULT_RECOMMENDATION_POLICY` (`execution_first`), run against the frozen population's underlying evidence.

- **Requirement:** Arm A must reflect the *actual* accepted behavior — the real posture-bucket winner selection then `rankByPolicy` — **not** a re-sort of an already-collapsed board and **not** a reimplementation. The implementation obtains Arm A by running the genuine path over the same captured evidence (or by capturing the real path's per-symbol selected contract at the same instant as the population). Any reimplementation must be proven byte-equivalent to the real path on the frozen inputs.

### Arm B — Raw Yield

Over the frozen population: select, per symbol, the admissible contract with the **highest `yieldAnnualized`**; order symbols by `yieldAnnualized` descending. No delta constraint beyond the upstream `admissibleDeltaRange` already applied to the population. Ties broken deterministically (see §6).

### Arm C — Delta-Constrained Yield

Identical to Arm B, but first apply an explicit **delta fence** (a `|delta|` sub-range strictly inside the upstream `admissibleDeltaRange`; the exact fence is a declared arm parameter, e.g. the existing `preferredDeltaBand` 0.25–0.35 — the value is Principal/experimenter-declared, not invented here). Among contracts passing the fence, select per symbol the highest `yieldAnnualized`; order by `yieldAnnualized` descending. Same tie rules as Arm B.

> **There is no fourth arm.** "Delta Fence + yield ordering" is, by construction, the same treatment as Arm C when the same fence, economics measure (`yieldAnnualized`), and tie rules are used — see §5.

---

## 5. Delta-Fence ≡ Delta-Constrained-Yield equivalence check (invariant, not a result)

The experiment must include an automated check asserting that a "Delta Fence" formulation (hard `|delta|` fence, then `yieldAnnualized` ordering, same ties) yields **byte-identical selection and order** to Arm C. This is an expected invariant that guards against accidentally treating the two as independent evidence. If they ever differ, the cause is a differing post-filter ordering preference — which would make it a *different* (future) recipe, out of V1 scope. Record the check result; a mismatch is a design/implementation defect, not a finding about recipes.

---

## 6. Determinism and tie-breaking

Every arm uses one shared, total, deterministic ordering. Primary key per arm as defined in §4; then a fixed tie-break chain, e.g.: higher `yieldAnnualized` → higher `assessment.score` → nearer `targetDelta` → lower `spreadPercent` → lexicographic `symbol` → lower `strike` → `expiration`. The exact chain is declared once and reused across arms so cross-arm differences reflect the arm's primary key, not tie noise. No arm may depend on input row order.

---

## 7. Measurements

Computed over the three ordered selections from the same frozen artifact.

1. **Disagreement rate.** For top-N (declared N; report a small sweep, e.g. N ∈ {10, 25, 50}): set-membership difference and rank displacement of Arm C vs Arm A, and Arm C vs Arm B. Also Arm A vs Arm B (baseline context). Near-zero C-vs-A and C-vs-B disagreement ⇒ the constraint adds no information.
2. **Per-symbol contract-choice difference.** Fraction of symbols where Arm C selects a *different contract* (strike/expiration) than Arm A, and than Arm B. This isolates the population-boundary effect (the reason pre-collapse capture is required).
3. **Proxy-correlation.** Rank correlation (Spearman) of each arm's ordering against each of: `yieldAnnualized`, `|delta|`, `dte`, a liquidity proxy (`openInterest`/`volume`), and moneyness (`(strike−underlying)/underlying`). High correlation of Arm C with a single existing axis ⇒ the constraint is a disguised sort of that axis.
4. **Explainability audit.** For each material Arm-C-vs-A and Arm-C-vs-B disagreement, record whether the difference is explainable by the delta fence (the intended economic question). Unexplainable disagreement is noise, not signal.

All measurements are deterministic functions of the artifact + arm outputs.

---

## 8. Expected outputs

- The frozen input artifact (immutable, provenance-complete).
- Three ordered selection lists (Arms A/B/C), each ≤ one contract per symbol, each replayable.
- The §5 equivalence-check result (pass/fail).
- A measurements report (§7): disagreement rates at the N-sweep, per-symbol contract-choice differences, proxy correlations, explainability audit.
- A short written verdict against the §9 criteria. No recommendation to build anything beyond what evidence supports.

---

## 9. Success / stop (kill) criteria — declared before any run

- **Informative (supports continuing recipe exploration):** Arm C produces **materially different AND explainable** selections versus **both** Arm A (accepted Wheelwright) **and** Arm C-vs-B differences are explained by the fence rather than by proxy for a single existing axis. "Material" threshold (e.g. ≥ X% top-N membership change and/or ≥ Y% per-symbol contract-choice change) is a **declared parameter set before running**, not chosen after seeing results.
- **Kill (do NOT build a generalized recipe abstraction yet):** Arm C is not materially different from Arm A, **or** its ordering is explained almost entirely by correlation with a single existing axis (yield/delta/DTE/liquidity/moneyness) such that it merely re-expresses an existing sort. Beating raw yield (Arm B) alone is **insufficient** — the discriminating comparison is against Arm A and against the fence's *explainability*, not against unconstrained yield.
- **Anti-p-hacking:** thresholds, N-sweep, tie chain, and the fence value are all declared in the experiment parameter record before execution and are part of the replayable artifact.

---

## 10. What an implementer must NOT invent (all product semantics are fixed here)

Population boundary (§3), arm definitions (§4), selection unit (one per symbol), economics measure (`yieldAnnualized`), determinism/tie chain (§6), measurements (§7), and stop criteria (§9) are all specified. The implementer chooses only mechanical realizations (artifact file format, where the analysis harness lives, test structure). No product decision (what a recipe favors, which fence, what "material" means) is left to implementation.

---

## 11. Decomposition (implementation units — NOT authorized; for readiness review only)

1. **Frozen-population capture** — a capture path emitting the §3 artifact from already-acquired evidence, without triggering acquisition/regeneration. Reuses existing admissibility (`isSubjectAdmissible`) and `annualizedYield`; must capture pre-collapse.
2. **Arm A fidelity harness** — run/obtain the real `recommendPuts`+`rankByPolicy` selection over the frozen evidence; prove equivalence to the live path.
3. **Arms B & C** — pure deterministic selectors over the artifact (§4/§6).
4. **Equivalence check** (§5) and **measurements** (§7) as pure functions.
5. **Report generation** (§8) and the declared parameter record (§9).

Each unit is offline/analysis only. None modifies `recommend.ts` selection semantics, adds a `RankingPolicy` mode, introduces a candidate type, touches acquisition/scheduler, or adds UI.

---

## 12. Authority boundary (explicit)

This design is fully specified and reviewed, but confers **no** authority to: execute the experiment, write the harness/arms, capture the artifact against live data, change winner-selection or any recommendation policy, build a recipe engine, create a Recipes page, or introduce DSL/generalized machinery. Product-surface (Explorer page) remains a strong-but-unresolved hypothesis pending this experiment's evidence. Execution and implementation require separate explicit Principal authorization.

---

## 13. Implementation-Readiness Review

**Purpose:** reconcile the §11 decomposition back against architecture and quality, confirm the four prohibited anti-patterns are *structurally* prevented (not merely promised), and define the tests/acceptance evidence that must exist **before** any code. This review is the final documentation-preparation step; it authorizes nothing.

### 13.1 Anti-pattern prevention (structural, per decomposition unit)

Each row states the anti-pattern, why the design cannot commit it, and the structural guard an implementer must preserve.

| Anti-pattern | Why the design avoids it | Structural guard (must hold in any implementation) |
|---|---|---|
| **Creates a recipe engine** | The three arms are pure `(frozenPopulation, declaredParams) → orderedSelection[]` functions used once for analysis. No runtime abstraction, registry, `RankingPolicy` mode, or config surface. | Arm code lives in an **analysis/experiment path**, not in `recommend.ts` or the Decision runtime. No new production-consumed type. No arm is invocable from the live recommendation path. |
| **Bypasses winner-selection authority** | Arm A is defined as the *real* `recommendPuts`+`rankByPolicy` output (or a build proven byte-equivalent on the frozen inputs); Arms B/C are alternative *analysis* selections that never feed the board. | Arm A obtains its selection from the genuine path; it is never a re-sort of an already-collapsed board. Arms B/C outputs terminate in the report — they never write to any cache, snapshot, candidate list, or UI. |
| **Mutates recommendation policy** | No arm edits `DEFAULT_RECOMMENDATION_POLICY`, posture, eligibility, or ranking. Arm C's fence is a *declared experiment parameter*, not a policy change. | `recommend.ts`, policy defaults, posture thresholds, and eligibility gates are unchanged (git diff on those files empty). The fence lives only in the experiment parameter record. |
| **Turns research calcs into production semantics** | Measurements and arm selections are experiment artifacts. IV/secondary greeks are captured for provenance only and are barred from arm logic in V1. | No experiment output is read by Console/Deployment/Decision. The frozen artifact and report are analysis files; they never enter a production cache or the snapshot contract. `midIv`/`smvVol`/gamma/theta/vega/rho do not appear in any arm's selection or ordering. |

### 13.2 Architecture reconciliation of the decomposition (against §4 of the Completion Record)

- **AR5 conformance:** the experiment measures the *comparative-fitness* stage over the post-admissibility population without altering the acceptability gates or the winner-selection collapse. It observes AR5's separation; it does not yet implement a production comparative-fitness lens. Consistent.
- **Authority spine (ADR-013/015/016/017):** capture copies each candidate's authoritative `evidenceProvenance` (ADR-015) rather than reconstructing it; it consumes the Issue-#16 admissibility verdict rather than re-deriving it (ADR-017); arm outputs are interpretation over facts, kept separate from facts (ADR-013). Consistent.
- **AR8:** the frozen, capture-not-refresh artifact with a declared parameter record is the reproducible point-in-time substrate; replay yields identical outputs. Consistent. Recipe-decision-provenance remains future (not exercised).
- **Simplicity Constraint:** no new engine/service/DB/scheduler/provider traffic; analysis artifacts are disposable. Consistent.
- **Evidence semantics:** owned upstream; the experiment reuses `annualizedYield` and the existing greek/IV fields as-is (and bars IV/secondary greeks from V1 arm logic). Consistent.

### 13.3 Acceptance evidence — defined BEFORE code (tests an implementation must pass)

An eventual (separately authorized) implementation is **accepted** only when all of the following are demonstrated. These are specified now so implementation is mechanical.

**Capture (unit 1)**
- A1. Capturing the frozen artifact triggers **no** provider acquisition, recommendation reevaluation, or candidate regeneration (assert via provider/acquisition call spies = 0; generation unchanged).
- A2. The artifact is **pre-collapse**: for at least one symbol known to have ≥2 admissible contracts, all such contracts appear (not just the winner).
- A3. Each captured candidate carries its **own** `evidenceProvenance`; `null` where genuinely unavailable, never synthesized; no `Date.now()` substitution.
- A4. Absence/zero fidelity: a provider `null` greek/IV stays `null`; an exact provider `0.0` stays `0.0`; `midIv` and `smvVol` are preserved as distinct fields (no aliasing/averaging).

**Arms (units 2–3)**
- A5. **Arm A fidelity:** Arm A's per-symbol selection and order equal the real `recommendPuts`+`rankByPolicy` output on the same frozen evidence (byte-equivalent on symbol/expiration/strike/rank). This is the load-bearing test.
- A6. **Determinism:** each arm run twice on the same artifact yields identical output; shuffling input row order does not change any arm's output (tie chain is total).
- A7. **Selection unit:** every arm emits ≤ one contract per symbol.
- A8. Arm B selects, per symbol, the max-`yieldAnnualized` admissible contract; Arm C applies the declared fence first, then max-`yieldAnnualized`.

**Equivalence check (unit 4, §5)**
- A9. An independent "Delta Fence → yield ordering (same fence, same ties)" formulation produces **byte-identical** selection and order to Arm C. A mismatch fails the build (it would mean an unintended differing ordering preference).

**Measurements + report (units 4–5)**
- A10. Measurements are pure functions of (artifact, arm outputs): re-running reproduces identical numbers.
- A11. The declared parameter record (fence value, N-sweep, "material" thresholds, tie chain) is written **before** results and is part of the replayable artifact (anti-p-hacking).
- A12. The report renders the §9 verdict strictly from measurements; it makes no build recommendation beyond evidence.

**Boundary/regression (whole change set)**
- A13. `git diff` shows **no change** to `recommend.ts` selection/ranking/posture/eligibility, to `DEFAULT_RECOMMENDATION_POLICY`, to the snapshot contract, to acquisition/scheduler, or to any UI surface.
- A14. Existing backend (JUnit) and frontend (Vitest) suites remain green; the experiment adds only new, isolated analysis tests.
- A15. No experiment output path is imported by Console, Deployment, Decision, or any production module (assert by dependency direction: production code never imports the experiment module).

### 13.4 Readiness verdict

The decomposition is **fully specified, reviewed, and architecture-conformant as a design**: product semantics are fully specified (§1–§10), the units are offline/analysis-only (§11), the four anti-patterns are structurally prevented (§13.1), and acceptance evidence is defined before code (§13.3). The single load-bearing correctness risk is **Arm A fidelity** (A5) — if Arm A is a reimplementation rather than the real path, the experiment can produce a false negative; the design mandates the real path or proven byte-equivalence.

**Durable stopping-state: first experiment fully specified and reviewed; implementation authorization pending.** This is not an `IMPLEMENTABLE` state. **No implementation unit is authorized.** The next action requires an explicit Principal authorization to implement (and separately, to execute against captured data). Until then: no harness, no arms, no capture against live data, no winner-selection change, no Recipes page, no engine, no DSL.
