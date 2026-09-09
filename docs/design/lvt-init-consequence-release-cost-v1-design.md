# LVT-INIT-CONSEQUENCE-RELEASE-COST — v1 Bounded Design

**Status:** Design decomposition — implementation-ready candidate, **NOT implemented, NOT authorized for implementation.**
**Authority:** Supporting design artifact (Category E). Canonical strategy is `docs/roadmap.md`; why-state is `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md`.
**Produced:** 2026-09-09, authorized 3AM execution cycle (Principal + ChatGPT + Kiro), Kiro as invoked actor. **Revised 2026-09-09** (3AM, then partial-4AM material findings) — see Revision log at end.
**Repository baseline:** SYNC SHA `feb61a8`.
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
| F3 | **Compensation while waiting** | Premium a CC/collar structure pays (midpoint), where option evidence exists. |
| F4 | **Downside envelope** | Whether a *protective floor above zero* exists (collar, from strikes + option evidence) or **no protective floor above zero** (bare Hold/CC — loss is economically bounded only by shares → 0, which is not protection). |
| F5 | **Retained participation / recovery room** | Upside/recovery the alternative keeps (e.g. room to strike for CC; capped-but-present for collar; full for Hold; none after Sell). |
| F6 | **Resulting holding / resolution outcome (of the evaluated block)** | What the operator will *hold* **for the evaluated `subjectShares` block** after each resolution branch (cash, shares retained, shares-retained-with-protection-expired/renewal-needed, etc.), with any **unaffected residual holdings explicitly outside** that outcome. A holding/outcome label — **not** a capital-state ontology. |
| F7 | **Next decision boundary** | The next natural date a decision is forced (expiration for option structures; none/now for Sell; open-ended for bare Hold). |
| F8 | **Basis-relative release effect** *(basis-gated; precision metadata)* | Erosion/appreciation on Sell relative to basis, carrying explicit precision metadata: `exact` (single-lot authoritative basis), `blended/approximate` (symbol-level blended basis), or `unavailable`. Named for what it is, not asserted as always-exact. See §5. |

**Not in v1 as a computed fact:** any scalar combining these; any ranking; any "recommended" alternative; any downstream feasible-set computation.

## 4. Semantic definitions

- **F1 Estimated gross sale value** — `subjectShares × observedSpot` (the evaluated block, not all free shares). Market-derived, pre-trade. Explicitly **not** basis-relative gain, **not** an execution/fill price, **not** actual proceeds, and **not** authoritative deployable buying power. Wheelwright already owns an authoritative deployable-capacity concept derived from Fidelity balance evidence (settled cash; see the 2026-09-08 deployable-cash reconciliation); F1 must not appropriate that semantic. Required language: *"estimates the gross value represented by selling the evaluated share block; not an execution price, actual proceeds, or a guarantee of immediately deployable buying power."* `LVT-BET-CAPITAL-CHOICES` may consume F1 as an input later but must not treat it as authoritative post-sale deployment capacity.
- **F2 Time to represented contractual boundary** — `expiration − today` (DTE) for the alternative's option leg; "until sold" for Hold; "immediate" for Sell. Communicates **exposure duration**, not guaranteed lockup: the capital is not literally inaccessible until expiration — the operator may BTC, roll, unwind a collar, or sell shares subject to closing the option position. The GDX insight is that waiting *consumes time and maintains exposure*, not that capital is frozen. A duration, not a dollar cost.
- **F3 Compensation** — CC: `mid × 100 × contracts`. Collar: net of short-call credit and long-put debit at midpoint. Uses the existing midpoint convention (`(bid+ask)/2`). Indicative, not a guaranteed fill.
- **F4 Downside envelope** — Collar: `putStrike` establishes a **protective floor above zero**; bounded downside ≈ `currentPrice − putStrike − netDebit`. Bare Hold/CC: **no protective floor above zero** — the position's loss is economically bounded only by the shares going to zero (plus any premium cushion), which is not protection. Say "no protective floor," never "unbounded/unlimited downside" (an owned-equity loss is economically bounded at share value → 0). Structural, from strikes.
- **F5 Retained participation** — for the `subjectShares` block. CC: `callStrike − currentPrice` room before capped (plus premium). Collar: bounded above by call strike, below by put strike. Hold: full. Sell: none.
- **F6 Resulting holding / resolution outcome (of the evaluated block)** — enumerated *holding* for the **`subjectShares` block** per alternative and per resolution branch (e.g. CC on 200 shares → {200 shares retained if OTM, 200 → cash if assigned}), with **residual holdings named separately and explicitly outside the outcome** (e.g. "+ 50 free shares unaffected; + any separately encumbered shares unaffected"). A holding/outcome label, not a probability, and deliberately **not** a generalized capital-state vocabulary — it answers "what will I hold next?" for the evaluated block without introducing a state ontology.
- **F7 Next decision boundary** — the option expiration date, or "now" (Sell) / "open" (Hold).
- **F8 Basis-relative release effect** — `subjectShares × (currentPrice − basisPerShare)` (the evaluated block, not all free shares), always accompanied by a **precision tag**: `exact` when lot-level basis is authoritative (and single-lot); `blended/approximate` when only symbol-level blended basis exists; `unavailable` when no basis exists. The field is *named for the question* ("what is the release effect relative to basis?"), not asserted as exact — because its dominant real-world state today is `blended/approximate`.

Every fact is **per alternative** and **per resolution branch where branches diverge** (CC and collar have assigned/expired branches; Sell does not).

## 5. Precision boundary 1 — Basis

**Rule (from ratified reconciliation):** `LVT-INIT-OUTCOME-BASIS` is a dependency for **exact lot-specific basis-sensitive claims only** (F8, and any per-lot appreciation/erosion), **not** a prerequisite for the Initiative as a whole.

- **Available today without lot-level basis:** F1 (market value released), F2, F3, F4, F5, F6, F7. None reference basis.
- **Requires stronger basis attribution:** F8 (basis-relative release effect) is `exact` only with authoritative single-lot basis; otherwise it carries a `blended/approximate` or `unavailable` precision tag — and is **wrong if presented as exact** for multi-lot symbols.
- **Current implementation truth:** `InventoryPosition.economics.averageCostPerShare` is a **blended, symbol-level** accounting basis (`candidate-types.ts` explicitly labels it "stock/accounting basis, NOT a capital-cycle basis"; `call-brief-builder.ts` already returns `null` gain when basis unavailable). For a single-lot symbol the blended average equals the lot basis and F8 is approximately correct; for **multi-lot symbols it is wrong** and F8 must be marked approximate or withheld.
- **Required v1 behavior:** when lot-level basis is unavailable or the symbol is multi-lot, F8 renders as **"≈ (blended basis)"** or **"exact erosion unavailable — needs lot-level basis"**, and F1–F7 are shown normally. Missing F8 must **never** suppress F1–F7. This is an application of the Trustability differentiator and mirrors the existing `unavailableReason` pattern in `ProjectedCalledAway`.

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
| F2 encumbrance | evidence | `expiration − today` | calendar (exact) | No | same | n/a (always known if expiration known) | observed fact | operator misjudges lockup duration |
| F3 compensation | evidence (chain) | `mid × 100 × contracts` (CC); net (collar) | chain-acquisition provenance | No | same | "—" if no chain | derived fact (indicative) | aged midpoint read as guaranteed income |
| F4 downside floor | evidence (chain) | from put strike + net debit | chain-acquisition provenance | No | same | "no structural floor" for CC/Hold | derived/structural | operator believes floor exists when it does not |
| F5 participation | evidence + price | strike − spot room | chain + spot provenance | No | same | "—" if no chain/spot | derived/structural | over/understates retained upside |
| F6 resulting holding (of block) | structural | enumerated per alternative/branch **for subjectShares**, residual named separately | n/a (structural) | No | same | always determinable | derived fact (label) | **claiming a whole-position outcome when only the block resolves** (e.g. "→ cash if assigned" while 50 free + encumbered shares remain) |
| F7 next boundary | evidence | expiration or now/open | calendar | No | same | "open" for bare Hold | observed fact | operator misses forced-decision date |
| F8 basis-relative release effect | portfolio basis | `subjectShares × (spot − basis)` + precision tag | basis provenance + spot | **Yes for `exact`** | **`blended/approximate` tag on blended; never `exact`** | precision tag = `blended/approximate` or `unavailable`; value shown with tag, never bare | derived fact (basis-sensitive) | **worst case**: presenting a `blended` figure as `exact` on a multi-lot symbol → false capital-loss belief |

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
- **F8 exact-erosion** is the only fact with an upstream dependency (`LVT-INIT-OUTCOME-BASIS` / lot-level basis, a `PL-PORT-01` concern). v1 does not implement lot-level basis; it degrades F8 gracefully.
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
3. F3 CC compensation from midpoints; "—" when chain absent; carries chain-acquisition provenance. (Collar-net compensation deferred with collar.)
4. F4 "no protective floor above zero" for CC/Hold; **never rendered as "unbounded/unlimited downside"** (owned-equity loss is economically bounded at shares → 0). Collar protective-floor test deferred with collar.
5. F5 participation room correct; sign/room per alternative.
6. F6 resulting-*holding* labels correct per alternative × resolution branch **for the subjectShares block, with residual holdings named separately and outside the outcome**; **no generalized capital-state term** (e.g. not "bounded-shares" as a state) — holding/outcome wording only. A test asserts "CC → cash if assigned" is **not** emitted as a whole-position claim when residual/encumbered shares exist.
6a. **Ownership-boundary test:** the consequence evaluator accepts a supplied alternative and does **not** enumerate the chain to discover alternatives (no strike/DTE/collar-possibility search inside this module).
7. **Precision-boundary tests (mandatory):**
   - F8 single-lot authoritative basis → precision tag `exact`;
   - F8 multi-lot symbol → precision tag `blended/approximate`, **never `exact`** (no fabricated precise number);
   - F8 no basis → precision tag `unavailable`; **F1–F7 still render** (missing F8 does not suppress others);
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
- No implementation of lot-level basis (F8 degrades gracefully instead).
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

- **F8 fabrication (worst):** presenting a precise erosion figure on a multi-lot symbol from blended basis → false capital-loss belief driving a wrong release decision. Mitigated by the mandatory multi-lot withhold/approximate rule.
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

Both classified **MATERIAL, not BLOCKING** — the architecture survives; corrections are local. The quantity finding *strengthens* the ownership boundary (a supplied alternative is now fully specified). **4AM is incomplete** — Codex did not return a final verdict; the unfinished attacks may resume against this corrected artifact if the Principal chooses.

## Principal decisions

**Resolved in 3AM (recorded above):** host surface (Write Desk first); v1 slice = Sell/Hold/existing-CC, Collar deferred; TQ baseline stays pinned at `200f022`; ArchUnit/Sonar gaps stay in the TQ program (do not preempt A).

**Remaining — one live gate:**
- **4AM is incomplete.** Codex established two MATERIAL findings (subject-quantity, F1-semantic), both now corrected in this artifact, then stopped before a final verdict. Decision: **resume 4AM against the corrected artifact** (finish the unfinished attacks) **or** accept the current 3AM+partial-4AM state and decide on implementation authorization? Kiro does not invoke Codex; this is the Principal's call.

Implementation remains **UNAUTHORIZED**. Current state: 3AM revision applied → partial 4AM (2 MATERIAL findings established + corrected) → A still not authorized → Principal decides whether to resume 4AM against the corrected design.
