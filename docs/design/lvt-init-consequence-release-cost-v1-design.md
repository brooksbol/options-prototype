# LVT-INIT-CONSEQUENCE-RELEASE-COST — v1 Bounded Design

**Status:** Design decomposition — implementation-ready candidate, **NOT implemented, NOT authorized for implementation.**
**Authority:** Supporting design artifact (Category E). Canonical strategy is `docs/roadmap.md`; why-state is `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md`.
**Produced:** 2026-09-09, authorized 3AM execution cycle (Principal + ChatGPT + Kiro), Kiro as invoked actor. **Revised 2026-09-09** (3AM → partial-4AM findings → completed-4AM verdict *AUTHORIZED AFTER BOUNDED DESIGN CORRECTIONS* + this bounded correction pass) — see Revision log at end.
**Repository baseline:** SYNC SHA `67e091f`.
**LVT home:** `LVT-INIT-CONSEQUENCE-RELEASE-COST` under `LVT-BET-CONSEQUENCE-ENVELOPE` (legacy `K1`), `LVT-GOAL-CONSEQUENCES`.
**Review path:** returns to 3AM (Principal + ChatGPT). A 4AM (add Codex) adversarial pass may follow **after** this design exists, only if the Principal authorizes escalation. This document does not request one.

---

## 1. Operator question

> **"For capital I already have deployed in this owned-share position, what does releasing it or retaining it cost me — in money, time, and risk — what compensation and participation do I keep, what will I own next, and when is my next decision?"**

This is a *consequence* question about already-deployed capital. It is not "what should I do" (that is comparison/explanation, `LVT-BET-EXPLANATION`), not "what alternatives exist" (`LVT-BET-LIFECYCLE-CHOICES`), and not "what becomes feasible elsewhere" (`LVT-BET-CAPITAL-CHOICES`). Those Bets *consume* this consequence representation; this Initiative *produces* it.

### Ownership boundary (governing constraint — added 2026-09-09 3AM revision)

> **The consequence model consumes an already-known governed alternative and emits its independent consequence facts. Alternative discovery/enumeration remains outside this Initiative — it belongs to `LVT-BET-LIFECYCLE-CHOICES`. An existing surface may compose several already-evaluated alternatives side by side, but this Initiative must not become the mechanism that discovers the alternative set.**

Concretely: the v1 unit of work is `evaluateConsequences(position, suppliedAlternative) → consequence facts`, where **the supplied alternative includes an explicit subject quantity / capital block** (see next subsection). It takes one governed alternative as input. It does **not** iterate the option chain to *find* which alternatives (which strikes, which DTEs, whether a collar is possible) exist — that enumeration is `LVT-BET-LIFECYCLE-CHOICES`'s responsibility. This single boundary prevents the first implementation from silently becoming a lifecycle-alternative engine (the Goal separation preserved at ratification).

### Subject quantity — every alternative names its own capital block (added 2026-09-09 3AM revision, 4AM quantity finding)

**Material finding (Codex 4AM, verified against accepted code at `feb61a8`):** the covered-call engine quantizes capacity. A `CallCandidate` carries both `freeShares` and `maxContracts` (= `maxAdditionalContracts` = `Math.floor(sharesFree / 100)`), and `coveredSharesAtMaximumDeployment = maxContracts × 100`. So a position with **250 free shares** produces a CC that acts on **200 shares** (2 contracts), leaving 50 uncovered. If F1 (Sell) evaluates all 250 free shares while the CC alternative acts on 200, side-by-side presentation compares **unlike capital blocks** — a false comparison. It also breaks F6: "CC → cash if assigned" is false for the whole position (assignment converts the 200 covered shares; 50 free shares — and any separately encumbered shares — remain).

**Correction (missing concept, not new architecture):** every supplied alternative carries an explicit **subject quantity** (the capital block it acts on). For a Write-Desk CC row of `N` contracts, `subjectShares = N × 100`. All alternatives compared on that row evaluate the **same** block:

- **Sell:** the same `subjectShares` (not all free shares).
- **Hold:** retain those `subjectShares`.
- **CC:** write `N` calls against those `subjectShares`.
- **Residual** free shares (e.g. the 50) and any separately encumbered shares are **outside the evaluated block** and shown as residual position inventory where useful, never folded into the compared alternative.

Signature becomes conceptually `evaluateConsequences(position, suppliedAlternative, subjectQuantity) → facts`, or preferably **`subjectQuantity` is a field of the supplied alternative**. This keeps the ownership seam intact: `LVT-BET-LIFECYCLE-CHOICES` supplies *what + how much*; this Initiative *describes* that supplied, fully-specified alternative. It does not choose the quantity. (The finding actually *strengthens* the ownership boundary: a supplied alternative is now specified enough to evaluate without this Initiative inventing anything.)

## 2. Concrete evidence motivating it

Live owned-share cases preserved in `docs/47/48/49` and the ratified reconciliation:

- **BNO** — short call assigned → shares called away → capital returned directly to cash, immediately redeployed. (Release was automatic and free.)
- **COPX** — call expired OTM → shares retained → weekend appreciation carried through basis → operator sold at a small profit and redeployed. (Voluntary, low-cost release.)
- **GDX** — call expired OTM → shares retained **below basis** (~100 sh @ ~$103.77 basis, ~$99.2–99.3 spot, ~$450 underwater). Releasing now realizes erosion; retaining encumbers ~$9.9k for a bounded recovery attempt while accepting risk. Real Fidelity examples: 3-DTE $104 CC (~$45), 3-DTE $95/$104 collar (~$5 debit, ~$95 floor), 10-DTE $104 CC (~$144), near-zero-cost 10-DTE $95/$104 collar.
- **COPX → SOXX feasible-set** — releasing ~$9,066 of COPX flips an otherwise ~$4,938-short SOXX buy-write into affordable. (This is `LVT-BET-CAPITAL-CHOICES`'s concern; this Initiative only needs to expose the *released amount* as a fact, not compute the downstream feasibility — see §8.)

The GDX case is the sharpest: it exposes **two distinct release costs** — monetary (realize erosion now) vs temporal (encumber capital + accept risk for a bounded recovery attempt) — that premium-centric presentation hides.

## 3. Exact v1 facts (smallest coherent truthful slice)

v1 represents, **per owned-share position, per candidate retention/release alternative**, the following consequence facts. Each is an independent fact with its own precision/provenance (see §6/§7). The set is deliberately small; several tempting facts are deferred (§12).

| # | Fact | One-line meaning |
|---|------|------------------|
| F1 | **Estimated gross sale value** | `subjectShares × observed spot` — estimated gross value represented by selling the evaluated block. **Not** an execution price, actual proceeds, or a guarantee of immediately deployable buying power (that authoritative capacity comes from Fidelity balance evidence, not this estimate). |
| F2 | **Time to represented contractual boundary** | For a retention alternative, time (DTE) until the *currently represented* contractual decision point. This is exposure-over-time, **not** guaranteed capital lockup: the operator may BTC, roll, unwind, or sell shares subject to closing the option. |
| F3 | **Estimated gross opening premium** | Estimated gross opening credit a CC/collar structure would pay at current midpoint, where option evidence exists. **Not** retained net compensation: excludes commissions/fees and any later BTC/roll/unwind economics. Net retained compensation is unknown until closing/outcome evidence exists. |
| F4 | **Downside envelope** | Whether a *protective floor above zero* exists (collar, from strikes + option evidence) or **no protective floor above zero** (bare Hold/CC — loss is economically bounded only by shares → 0, which is not protection). |
| F5 | **Retained participation / recovery room** | Upside/recovery the alternative keeps (e.g. room to strike for CC; capped-but-present for collar; full for Hold; none after Sell). |
| F6 | **Resulting holding / resolution outcome (of the evaluated block)** | What the operator will *hold* **for the evaluated `subjectShares` block**, scoped **"if held through expiration"** (OTM → shares remain; assigned → shares called away / cash). Structurally-possible **earlier exits** (BTC → shares remain; roll → shares remain with replacement short-call obligation; close-then-sell → cash) are acknowledged as simple consequence descriptions, **not** exhaustive lifecycle outcomes. Unaffected residual holdings are **explicitly outside** the outcome. A holding/outcome label — **not** a capital-state ontology or transition system. |
| F7 | **Next decision boundary** | The next natural date a decision is forced (expiration for option structures; none/now for Sell; open-ended for bare Hold). |
| F8 | **Basis-relative release effect** *(basis-gated; precision metadata)* | Erosion/appreciation on Sell relative to basis. **In v1, current evidence can emit only `blended/approximate`** (symbol-level average basis present — evidence cannot prove it came from a single lot) **or `unavailable`** (no basis). `exact` is **reserved** as an admissible future precision state, only when separately authoritative lot attribution exists. Named for what it is, never asserted as exact from current evidence. See §5. |

**Not in v1 as a computed fact:** any scalar combining these; any ranking; any "recommended" alternative; any downstream feasible-set computation.

## 4. Semantic definitions

- **F1 Estimated gross sale value** — `subjectShares × observedSpot` (the evaluated block, not all free shares). Market-derived, pre-trade. Explicitly **not** basis-relative gain, **not** an execution/fill price, **not** actual proceeds, and **not** authoritative deployable buying power. Wheelwright already owns an authoritative deployable-capacity concept derived from Fidelity balance evidence (settled cash; see the 2026-09-08 deployable-cash reconciliation); F1 must not appropriate that semantic. Required language: *"estimates the gross value represented by selling the evaluated share block; not an execution price, actual proceeds, or a guarantee of immediately deployable buying power."* `LVT-BET-CAPITAL-CHOICES` may consume F1 as an input later but must not treat it as authoritative post-sale deployment capacity.
- **F2 Time to represented contractual boundary** — `expiration − today` (DTE) for the alternative's option leg; "until sold" for Hold; "immediate" for Sell. Communicates **exposure duration**, not guaranteed lockup: the capital is not literally inaccessible until expiration — the operator may BTC, roll, unwind a collar, or sell shares subject to closing the option position. The GDX insight is that waiting *consumes time and maintains exposure*, not that capital is frozen. A duration, not a dollar cost.
- **F3 Estimated gross opening premium** — CC: `mid × 100 × contracts`. Collar: net of short-call credit and long-put debit at midpoint. Uses the existing midpoint convention (`(bid+ask)/2`). Its contract states explicitly: derived from current option evidence; **indicative, not a guaranteed execution**; represents estimated **gross opening credit only**; **excludes** commissions/fees where applicable; **excludes** any later BTC debit/credit; **excludes** any later roll debit/credit; **excludes** unwind economics; and is **NOT a claim about ultimately retained net compensation**. If a later exit occurs, net retained compensation requires closing/outcome evidence and may remain unknown/unavailable until such evidence exists. No lifecycle-accounting machinery is introduced to compute this — F3 is the opening-credit estimate only.
- **F4 Downside envelope** — Collar: `putStrike` establishes a **protective floor above zero**; bounded downside ≈ `currentPrice − putStrike − netDebit`. Bare Hold/CC: **no protective floor above zero** — the position's loss is economically bounded only by the shares going to zero (plus any premium cushion), which is not protection. Say "no protective floor," never "unbounded/unlimited downside" (an owned-equity loss is economically bounded at share value → 0). Structural, from strikes.
- **F5 Retained participation** — for the `subjectShares` block. CC: `callStrike − currentPrice` room before capped (plus premium). Collar: bounded above by call strike, below by put strike. Hold: full. Sell: none.
- **F6 Resulting holding / resolution outcome (of the evaluated block)** — enumerated *holding* for the **`subjectShares` block**, with expiration-resolution branches **explicitly scoped "if held through expiration"** so they are not mistaken for the only possible paths:
  - *if held through expiration:* OTM → the evaluated shares remain held; assigned → the evaluated shares are called away / corresponding cash outcome as supported by evidence.
  - *structurally possible earlier exits (acknowledged, not modeled):* BTC → shares remain held; roll → shares remain held with a replacement short-call obligation; close call then sell the evaluated shares → resulting holding/cash consequence per evidence available at that time.
  These remain **simple consequence descriptions**. They do **not** introduce a `CapitalState`, a lifecycle state machine, a transition graph, a generalized path model, or an optimizer. Residual free shares and separately encumbered shares are named separately and remain **outside** the evaluated block's outcome (e.g. "+ 50 free shares unaffected"). A holding/outcome label, not a probability, and deliberately not a generalized capital-state vocabulary.
- **F7 Next decision boundary** — the option expiration date, or "now" (Sell) / "open" (Hold).
- **F8 Basis-relative release effect** — `subjectShares × (currentPrice − basisPerShare)` (the evaluated block, not all free shares), always accompanied by a **precision tag**. **v1 emits only two states from current evidence:**
  - `blended/approximate` — authoritative symbol-level average basis is present. Current `InventoryPosition` evidence preserves a symbol-level average but **no authoritative lot count, lot identity, or subject-share attribution**, so evidence *cannot establish* whether that average came from a single lot or multiple blended lots. Therefore v1 must **not** emit `exact` merely because basis exists.
  - `unavailable` — no basis.
  - `exact` is **reserved** as an admissible *future* precision state, achievable only when separately authoritative lot attribution exists (`LVT-INIT-OUTCOME-BASIS`). This preserves the ratified rule — exact lot-specific basis-sensitive claims require authoritative basis attribution — **without** making `LVT-INIT-OUTCOME-BASIS` a prerequisite for F1–F7 or approximate F8. **Do not invent precision.**

Every fact is **per alternative** and **per resolution branch where branches diverge** (CC and collar have assigned/expired branches; Sell does not).

## 5. Precision boundary 1 — Basis

**Rule (from ratified reconciliation):** `LVT-INIT-OUTCOME-BASIS` is a dependency for **exact lot-specific basis-sensitive claims only** (F8, and any per-lot appreciation/erosion), **not** a prerequisite for the Initiative as a whole.

- **Available today without lot-level basis:** F1 (estimated gross sale value), F2, F3, F4, F5, F6, F7. None reference basis.
- **Requires stronger basis attribution:** F8 (basis-relative release effect). **v1 cannot emit `exact` from current evidence at all** — see below. It emits `blended/approximate` (basis present) or `unavailable` (no basis).
- **Current implementation truth (sharpened by the 4AM finding):** `InventoryPosition.economics.averageCostPerShare` is a **blended, symbol-level** accounting basis (`candidate-types.ts` labels it "stock/accounting basis, NOT a capital-cycle basis"; `call-brief-builder.ts` already returns `null` gain when basis unavailable). Crucially, the evidence preserves **no lot count or lot identity**, so Wheelwright *cannot determine* whether a given average came from one lot or several blended lots. Therefore the earlier "single-lot → exact" assumption is **withdrawn**: v1 has no evidentiary basis to ever claim `exact`, even when the symbol happens to be single-lot, because it cannot *prove* single-lot from current evidence.
- **Required v1 behavior:** basis present → F8 = **`blended/approximate`**; no basis → **`unavailable`**; **`exact` is never emitted in v1** (reserved for a future state gated on authoritative lot attribution, `LVT-INIT-OUTCOME-BASIS`). F1–F7 are shown normally regardless; missing/approximate F8 must **never** suppress F1–F7. Mirrors the existing `unavailableReason` pattern in `ProjectedCalledAway`. This preserves the ratified rule (exact needs authoritative attribution) without making `LVT-INIT-OUTCOME-BASIS` a prerequisite for shipping F1–F7 or approximate F8.

## 6. Precision boundary 2 — Evidence freshness / provenance

**Rule (from ratified reconciliation):** option/quote/market-derived figures must preserve the freshness/provenance Wheelwright actually knows; do **not** manufacture quote authority; do **not** solve PL-EVID-AGE, quote-provenance architecture, or `LVT-BET-EVIDENCE-PRIORITY` inside this Initiative.

- **Current implementation truth:** `CallCandidate.evidenceProvenance` already carries **chain-acquisition provenance** (`chainAcquisitionProvenance`, per ADR-015, subject-scoped). Underlying spot for calls/buy-writes may come from a cached quote acquired up to ~60s before the chain, and its independent acquisition provenance is **not** retained in the composite chain representation (documented ADR-015 known gap). No provider/exchange observation timestamp exists (Tradier ~15-min delayed).
- **Required v1 behavior:** every market-derived fact (F1 uses spot; F3/F4/F5 use option midpoints) carries the provenance Wheelwright has:
  - option-derived facts → chain-acquisition age/provenance (available today);
  - spot-derived F1 → underlying provenance where known, else **"quote freshness unknown at quote level"**;
  - never present an aged midpoint as timeless truth; unknown precision stays visibly unknown.
- **Explicit non-import:** v1 does **not** add quote-acquisition provenance, does **not** add an Age acquisition tier, does **not** touch the scheduler. It *consumes and displays* existing provenance and honestly marks the known gap.

## 7. Per-fact specification table

For each fact: source, computation, provenance available today, precision/uncertainty, basis-required, multi-lot behavior, missing-data behavior, epistemic class, failure mode if wrong.

| Fact | Source | Computation | Provenance today | Basis req'd | Multi-lot | Missing-data behavior | Class | Failure mode if misrepresented |
|------|--------|-------------|------------------|-------------|-----------|-----------------------|-------|-------------------------------|
| F1 est. gross sale value | portfolio + evidence | `subjectShares × spot` | spot/underlying provenance (partial; quote-level may be unknown) | No | same | show "—" if no spot | derived fact (pre-trade estimate) | **presenting an estimate as authoritative deployable buying power** (Fidelity balance evidence owns that); or evaluating all free shares instead of the block |
| F2 time to contractual boundary | evidence | `expiration − today` | calendar (exact) | No | same | n/a (always known if expiration known) | observed fact | **implying capital is locked/inaccessible until expiration** (BTC/roll/unwind/sell-subject-to-close remain available) |
| F3 est. gross opening premium | evidence (chain) | `mid × 100 × contracts` (CC); net (collar) | chain-acquisition provenance | No | same | "—" if no chain | derived fact (indicative, opening only) | **presenting opening credit as retained net compensation** (ignores later BTC/roll/unwind, fees); aged midpoint read as guaranteed |
| F4 downside floor | evidence (chain) | from put strike + net debit | chain-acquisition provenance | No | same | "no structural floor" for CC/Hold | derived/structural | operator believes floor exists when it does not |
| F5 participation | evidence + price | strike − spot room | chain + spot provenance | No | same | "—" if no chain/spot | derived/structural | over/understates retained upside |
| F6 resulting holding (of block) | structural | enumerated per alternative/branch **for subjectShares**, residual named separately | n/a (structural) | No | same | always determinable | derived fact (label) | **claiming a whole-position outcome when only the block resolves** (e.g. "→ cash if assigned" while 50 free + encumbered shares remain) |
| F7 next boundary | evidence | expiration or now/open | calendar | No | same | "open" for bare Hold | observed fact | operator misses forced-decision date |
| F8 basis-relative release effect | portfolio basis | `subjectShares × (spot − basis)` + precision tag | basis provenance + spot | `exact` reserved for future authoritative lot attribution | **v1 cannot prove single-lot → never `exact`** | precision tag = `blended/approximate` (basis present) or `unavailable` (no basis); value shown with tag, never bare | derived fact (basis-sensitive) | **worst case**: emitting `exact` (or an unlabeled figure) from blended basis → false capital-loss belief |

## 8. Comparison behavior

An existing surface may place the consequence facts of **several already-evaluated alternatives** side by side for one position (e.g. GDX: Sell vs Hold vs an existing-CC candidate) so the operator can compare. Critically, per the §1 ownership boundary: **the alternatives being compared are supplied by `LVT-BET-LIFECYCLE-CHOICES` (alternative enumeration); this Initiative evaluates each supplied alternative's consequences and the surface composes them.** This Initiative does not discover the alternative set. It does **not**:

- enumerate/discover which alternatives exist (that is `LVT-BET-LIFECYCLE-CHOICES`);
- combine facts into a scalar or rank alternatives;
- declare a winner or "recommended" alternative;
- compute the downstream feasible-set effect (that is `LVT-BET-CAPITAL-CHOICES`; v1 only exposes F1 released-amount as an input another surface may consume — it does not reach into SOXX affordability itself).

Comparison is *presentational adjacency of independently-evaluated alternatives*, consistent with `LVT-BET-CONSEQUENCE-ENVELOPE`'s "make effects visible" and `LVT-BET-ACCEPTABILITY`/`LVT-BET-EXPLANATION` owning any actual judgment.

## 9. UI placement hypothesis

**Do not build a new page for v1.** The owned-share consequences belong to a position the operator already holds, and two existing surfaces already reason about owned shares:

1. **Covered-Call Candidates surface (Write Desk)** — already computes per-position free shares, basis, projected called-away economics, and (shipped) basis-positive selection. This is the strongest candidate host: release/retention consequence facts extend the existing per-position/per-expiration rows.
2. **Operator Console position-detail modal (ADR-013)** — already shows Contract State, Decision Pressure, Economic Consequence per monitored position. F1–F7 map naturally onto the Economic Consequence dimension for owned shares.

**DECIDED (3AM, 2026-09-09): Covered-Call Candidates surface (Write Desk) first — not both surfaces.** It already owns the evidence and operator context for reasoning about owned shares. A Console position-detail entry point **may follow if actual workflow pressure appears**, but duplicating the representation across two surfaces immediately would create synchronization / semantic-drift risk for no demonstrated benefit. A dedicated "Share Deployment / Capital Deployment" surface remains a **non-goal** (§12), justified only by demonstrated cognitive-role pressure, never conceptual neatness.

## 10. Architecture / data-flow impact

- **Zero new provider calls** (consumes cached evidence; ADR-001 preserved).
- **Zero backend/domain change required for F1–F7** — all derivable in the existing frontend Decision/brief layer from cached chains + portfolio snapshot, exactly where `call-brief-builder.ts` already computes projected called-away economics.
- **F8** ships in v1 as `blended/approximate` (or `unavailable`) with **no upstream dependency**. Only the future **`exact`** precision state depends on authoritative lot attribution (`LVT-INIT-OUTCOME-BASIS` / lot-level basis, a `PL-PORT-01` concern). v1 does not implement lot-level basis and never emits `exact`; it degrades F8 gracefully.
- **No schema change, no new persistence, no scheduler/acquisition change.**
- **ADR-015 conformance:** consumes subject-scoped provenance; does not manufacture authority. Honors the documented quote-provenance gap by labeling it, not closing it.
- **Distinction preserved (required by authorization):**
  - *economic position shape* (e.g. "collar = long put + short call over 100 shares") ≠
  - *broker order shape* (what Fidelity shows/accepts; e.g. a collar order may display "Max Loss Unlimited" pre-existing-shares) ≠
  - *resulting portfolio consequence* (F4/F6: with the shares already owned, the collar bounds downside). v1 represents the **resulting portfolio consequence**, and must not blindly surface broker order-risk labels as portfolio risk.

## 11. Tests required before implementation (design-level)

0. **Subject-quantity test (from 4AM):** for a 250-free-share position evaluated as a 2-contract CC row, `subjectShares = 200`; **all** compared alternatives (Sell, Hold, CC) evaluate the **same 200-share block**; the 50 residual shares are reported as residual inventory, never inside a compared alternative. A test with free shares not a multiple of 100 must not silently evaluate Sell on the remainder.
1. F1 = `subjectShares × spot` (the block, not all free shares); renders "—" when spot absent; **F1 labeled "estimated gross sale value," never "cash released" or "deployable buying power"** — a test asserts the disclaimer text and that F1 is not surfaced as authoritative deployable capacity.
2. F2/F7 correct from expiration; "open"/"now" for Hold/Sell. **F2 labeled as exposure-duration/time-to-contractual-boundary, never "capital locked/inaccessible until expiration."**
3. F3 CC **estimated gross opening premium** from midpoints; "—" when chain absent; carries chain-acquisition provenance. **A test asserts F3 is labeled opening-premium/estimated-gross, never "retained compensation," and that its contract excludes later BTC/roll/unwind and fees.** (Collar-net premium deferred with collar.)
4. F4 "no protective floor above zero" for CC/Hold; **never rendered as "unbounded/unlimited downside"** (owned-equity loss is economically bounded at shares → 0). Collar protective-floor test deferred with collar.
5. F5 participation room correct; sign/room per alternative.
6. F6 resulting-*holding* labels correct per alternative × resolution branch **for the subjectShares block, with residual holdings named separately and outside the outcome**; **no generalized capital-state term** (e.g. not "bounded-shares" as a state) — holding/outcome wording only. A test asserts "CC → cash if assigned" is **not** emitted as a whole-position claim when residual/encumbered shares exist. **A test asserts the expiration branches are scoped "if held through expiration" (not presented as the only possible paths) and that acknowledged early exits (BTC/roll/close-then-sell) are simple holding descriptions with no state-machine/transition-graph construct.**
6a. **Ownership-boundary test:** the consequence evaluator accepts a supplied alternative and does **not** enumerate the chain to discover alternatives (no strike/DTE/collar-possibility search inside this module).
7. **Precision-boundary tests (mandatory):**
   - F8 basis present → precision tag `blended/approximate` (**v1 never emits `exact`** — current evidence cannot prove single-lot; a test asserts `exact` is never produced regardless of symbol);
   - F8 no basis → precision tag `unavailable`; **F1–F7 still render** (missing/approximate F8 does not suppress others);
   - F8 value never shown bare (always with its precision tag);
   - option-derived facts carry chain-acquisition provenance; spot-derived F1 marks quote-level freshness unknown where it is;
   - no fact presents an aged midpoint as timeless.
8. Determinism: same cache + portfolio + policy → same facts (ADR-001/deterministic).
9. GDX/COPX/BNO fixtures reproduce the documented consequence facts (regression against real cases).

## 12. Explicit non-goals (v1)

- No scalar/composite Deployment score; no ranking; no "recommended" alternative.
- No generalized capital-state machine, path optimizer, or recovery-probability/price prediction.
- No automatic Sell→redeploy; no direct broker execution.
- No generalized multi-leg DSL/framework (collar is enumerated concretely, not via a leg engine).
- No new Share Deployment / Capital Deployment product surface merely because the cases suggest one.
- No weakening of policy/acceptability constraints.
- No use of `Prod v0` as a universal economic value function.
- No implementation of lot-level basis (F8 ships as `blended/approximate`; `exact` reserved for a future authoritative-lot-attribution state).
- No lifecycle-accounting machinery in F3 (opening-premium estimate only; net retained compensation is out of scope until closing/outcome evidence exists).
- No solving of PL-EVID-AGE / quote-provenance / `LVT-BET-EVIDENCE-PRIORITY`.
- **No alternative discovery/enumeration** — this Initiative evaluates a supplied alternative; enumeration is `LVT-BET-LIFECYCLE-CHOICES` (§1 ownership boundary).
- **No collar candidate-construction in the first slice** — collar is in the design contract but deferred; the first slice uses Sell / Hold / existing-CC evidence (§13.2).
- **No generalized capital-state vocabulary** — F6 is a holding/outcome label, not a state ontology (§4).
- **No cross-block comparison** — compared alternatives on a row must share one `subjectShares` block; never compare Sell-on-all-free-shares against CC-on-covered-shares (4AM quantity finding, §1).
- **No appropriation of authoritative deployable capacity** — F1 is a pre-trade estimate; authoritative deployable buying power remains owned by Fidelity balance evidence, not this Initiative.

## 13. Decisions resolved (3AM 2026-09-09) and remaining questions

**Resolved this revision:**

1. **Host surface — DECIDED:** Covered-Call Candidates surface (Write Desk) **first, not both**. Console entry point may follow on demonstrated workflow pressure. (§9)
2. **Alternative set for v1 — DECIDED:** first implementation slice proves the consequence representation with **Sell / Hold / existing-CC evidence**. **Collar is in the design contract but deferred from the first slice.** Implementation-truth basis for deferral: a repository check confirmed **no collar / protective-put candidate construction exists today** (the only `netDebit` machinery is buy-write share-cost−premium, not a short-call-credit−long-put-debit collar). Collar therefore is *not* available "essentially for free" — it needs a new long-put-leg selection + net-leg pricing path. It is valuable precisely because it exercises F4 (protective floor), so it is **earned after the basic representation works**, not built speculatively in the first slice.

**Remaining (genuinely open) design questions:**

3. **F8 degraded-state prominence** — inline precision tag vs a small provenance affordance? (Trustability presentation choice; can be settled during implementation design.)
4. **Confirm F1↔feasible-set separation is acceptable for v1** — exposing F1 (released amount) may create pull toward showing the `LVT-BET-CAPITAL-CHOICES` feasible-set effect; the design deliberately keeps them separate. (Believed settled by the ownership boundary; flagged only for confirmation.)

## 14. Failure modes

- **F8 false precision (worst):** presenting a blended-basis figure as exact → false capital-loss belief driving a wrong release decision. Mitigated by the v1 rule that `exact` is **never** emitted (current evidence cannot prove single-lot); F8 is always `blended/approximate` or `unavailable` with its tag shown.
- **Stale-midpoint laundering:** F3/F4/F5 from an aged chain shown as current income/floor → over-confident retention. Mitigated by carrying chain-acquisition provenance.
- **Quote-level over-claim:** F1 spot treated as live when it is a ~60s-old cached quote. Mitigated by marking quote-level freshness unknown.
- **Broker-order-risk confusion:** surfacing a broker "Max Loss Unlimited" collar label as portfolio risk when shares are owned. Mitigated by representing resulting *portfolio* consequence, not order-shape.
- **Scope creep into scoring/optimization:** the moment facts are combined into one number, v1 has violated its non-goals. Mitigated by keeping facts independent and comparison presentational.

## 15. Smallest coherent implementation boundary

**v1 = per-position, read-only consequence facts F1–F7 + precision-tagged F8, each evaluated on an explicit `subjectShares` block carried by the supplied alternative, evaluating supplied governed alternatives (NOT discovering them), for {Sell, Hold, existing-CC} in the first slice (Collar in the contract but deferred), composed as adjacent independently-evaluated alternatives sharing one capital block on the existing Covered-Call Candidates surface (Write Desk), consuming cached evidence and existing provenance, with the ownership boundary, the subject-quantity rule, F1's estimate-not-capacity semantic, and both precision boundaries enforced by test.**

- No backend change, no schema, no provider calls, no scheduler change, no new page.
- One frontend computation module (extending the pattern in `call-brief-builder.ts`) + presentational adjacency in an existing surface.
- Ships truthful value immediately; F8 exactness and any feasible-set coupling are later, separately-owned refinements (`LVT-INIT-OUTCOME-BASIS` / `LVT-BET-CAPITAL-CHOICES`).

---

## Revision log

**2026-09-09 3AM revision (Principal + ChatGPT + Kiro):** applied six conceptual corrections before any 4AM/implementation:
1. **Ownership boundary made explicit** (§1) — this Initiative *evaluates* a supplied alternative; enumeration stays in `LVT-BET-LIFECYCLE-CHOICES`. Prevents an accidental lifecycle-alternative engine.
2. **F6** relabeled "resulting holding / resolution outcome" — no capital-state ontology ("bounded-shares" removed as a state).
3. **F2** reframed as time-to-represented-contractual-boundary / exposure duration — not guaranteed capital lockup (BTC/roll/unwind/sell-subject-to-close remain available).
4. **F4** downside wording fixed — "no protective floor above zero," never "unbounded/unlimited downside."
5. **F8** renamed "basis-relative release effect" with an explicit precision tag (`exact` / `blended/approximate` / `unavailable`) — no "Exact…" field whose dominant behavior is not exact.
6. **Host = Write Desk first** (not both); **Collar deferred** from the first slice (grounded: no collar candidate-construction exists today).

**2026-09-09 4AM revision (partial — Codex did not complete; two MATERIAL findings established and verified against accepted code at `feb61a8`):**
7. **Subject-quantity finding (MATERIAL):** the CC engine quantizes capacity (`maxContracts = floor(freeShares/100)`; covered shares = `maxContracts × 100`), so comparing Sell-on-all-free-shares vs CC-on-covered-shares compares unlike capital blocks and breaks F6's whole-position branch labels. Correction: every supplied alternative carries an explicit `subjectShares` block; all compared alternatives on a row share it; residual shares are named outside the block (§1 "Subject quantity", F5/F6/F8 scoped, tests #0/#6).
8. **F1 semantic finding (MATERIAL):** "capital released ≈ market value" appropriated Wheelwright's authoritative deployable-capacity semantic (owned by Fidelity balance evidence). Correction: F1 renamed **"estimated gross sale value"** = `subjectShares × spot`, pre-trade, with explicit disclaimer that it is not fill/proceeds/deployable buying power (§3/§4/§7, test #1).

Both classified **MATERIAL, not BLOCKING** — the architecture survives; corrections are local. The quantity finding *strengthens* the ownership boundary (a supplied alternative is now fully specified).

**2026-09-09 completed-4AM verdict + bounded correction pass (Principal-conveyed; Codex review completed at `67e091f`):** Codex returned **AUTHORIZED AFTER BOUNDED DESIGN CORRECTIONS** — no BLOCKING findings, no architectural failure, no architectural expansion; two MATERIAL semantic findings and one MINOR terminology finding. This pass applied them (design-only):
- **MATERIAL A — F8 basis precision:** current evidence cannot prove single-lot, so **v1 never emits `exact`**; it emits `blended/approximate` (basis present) or `unavailable` (no basis). `exact` reserved for a future authoritative-lot-attribution state (`LVT-INIT-OUTCOME-BASIS`), which is *not* a prerequisite for shipping F1–F7 or approximate F8. Withdrew the earlier "single-lot → exact" assumption. (§3/§4/§5/§7/§10/§14, tests #7)
- **MATERIAL B — F3 opening-premium semantics:** F3 renamed **"estimated gross opening premium"** — gross opening credit only, excludes fees and any later BTC/roll/unwind; explicitly **not** retained net compensation (unknown until closing/outcome evidence). No lifecycle-accounting machinery introduced. (§3/§4/§7, test #3)
- **MATERIAL C — F6 expiration vs early-exit:** expiration branches scoped **"if held through expiration"**; structurally-possible early exits (BTC/roll/close-then-sell) acknowledged as simple holding descriptions — **no** `CapitalState`, state machine, transition graph, path model, or optimizer. (§3/§4, test #6)
- **MINOR — F2 terminology:** removed stale "encumbrance/lockup" wording from the spec table; canonical wording = time to represented contractual boundary / exposure duration, acknowledging BTC/roll/unwind can change the boundary. (§7)

Prior accepted corrections preserved intact: subject-quantity (`subjectShares`; one shared block per comparison row; residual outside outcome) and F1 (estimated gross sale value, not deployable capacity). Provenance boundary and all hard non-goals preserved. **No architectural expansion; documentation/design only.**

## Principal decisions

**Resolved:** completed-4AM verdict = AUTHORIZED AFTER BOUNDED DESIGN CORRECTIONS (now applied); host surface (Write Desk first); v1 slice = Sell/Hold/existing-CC, Collar deferred; TQ baseline stays pinned at `200f022`; ArchUnit/Sonar gaps stay in the TQ program (do not preempt A).

**Remaining:**
- Optional **very narrow Codex verification** ("confirm findings 9/10 corrected and no architectural expansion occurred") — Principal's call; a full re-review is not needed.
- **Authorize A implementation** — pending Principal acceptance of this corrected design. Implementation remains **UNAUTHORIZED** until that explicit acceptance.

Open design-time (non-blocking) choices remain: F8 degraded-state presentation prominence (§13.3) and confirmation of F1↔feasible-set separation (§13.4).

Implementation remains **UNAUTHORIZED**. Current state: 3AM revision applied → partial 4AM (2 MATERIAL findings established + corrected) → A still not authorized → Principal decides whether to resume 4AM against the corrected design.
