# LVT-INIT-CONSEQUENCE-RELEASE-COST — v1 Bounded Design

**Status:** Design decomposition — implementation-ready candidate, **NOT implemented, NOT authorized for implementation.**
**Authority:** Supporting design artifact (Category E). Canonical strategy is `docs/roadmap.md`; why-state is `docs/discovery/lvt-owned-capital-consequence-reconciliation-2026-09-09.md`.
**Produced:** 2026-09-09, authorized 3AM execution cycle (Principal + ChatGPT + Kiro), Kiro as invoked actor.
**Repository baseline:** SYNC SHA `addd498` (+ local truth-preflight commit `2d4928c`).
**LVT home:** `LVT-INIT-CONSEQUENCE-RELEASE-COST` under `LVT-BET-CONSEQUENCE-ENVELOPE` (legacy `K1`), `LVT-GOAL-CONSEQUENCES`.
**Review path:** returns to 3AM (Principal + ChatGPT). A 4AM (add Codex) adversarial pass may follow **after** this design exists, only if the Principal authorizes escalation. This document does not request one.

---

## 1. Operator question

> **"For capital I already have deployed in this owned-share position, what does releasing it or retaining it cost me — in money, time, and risk — what compensation and participation do I keep, what will I own next, and when is my next decision?"**

This is a *consequence* question about already-deployed capital. It is not "what should I do" (that is comparison/explanation, `LVT-BET-EXPLANATION`), not "what alternatives exist" (`LVT-BET-LIFECYCLE-CHOICES`), and not "what becomes feasible elsewhere" (`LVT-BET-CAPITAL-CHOICES`). Those Bets *consume* this consequence representation; this Initiative *produces* it.

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
| F1 | **Capital released (approx)** | Cash a Sell/CLOSE would return now ≈ current market value of the shares. |
| F2 | **Temporal encumbrance** | For a retention alternative (Hold/CC/Collar), how long capital stays committed until the next decision boundary (DTE). |
| F3 | **Compensation while waiting** | Premium a CC/collar structure pays (midpoint), where option evidence exists. |
| F4 | **Downside envelope** | Structural floor/bounded downside a collar creates (from strikes + option evidence); "unbounded below" where a bare Hold/CC provides none. |
| F5 | **Retained participation / recovery room** | Upside/recovery the alternative keeps (e.g. room to strike for CC; capped-but-present for collar; full for Hold; none after Sell). |
| F6 | **Resulting capital state** | What the operator owns after resolution: cash / shares / bounded-shares. Structurally different per alternative. |
| F7 | **Next decision boundary** | The next natural date a decision is forced (expiration for option structures; none/now for Sell; open-ended for bare Hold). |
| F8 | **Exact monetary release cost** *(basis-gated)* | Realized erosion/appreciation on Sell relative to basis. **Precision-bounded** — see §5. Marked approximate/unavailable when lot-level basis is absent. |

**Not in v1 as a computed fact:** any scalar combining these; any ranking; any "recommended" alternative; any downstream feasible-set computation.

## 4. Semantic definitions

- **F1 Capital released** — `sharesFree × currentUnderlyingPrice`. Market-derived. This is *release value*, explicitly **not** basis-relative gain. It is what returns to cash, not what was made/lost.
- **F2 Temporal encumbrance** — `expiration − today` (DTE) for the alternative's option leg; "until sold" for Hold; "immediate" for Sell. A duration, not a cost in dollars.
- **F3 Compensation** — CC: `mid × 100 × contracts`. Collar: net of short-call credit and long-put debit at midpoint. Uses the existing midpoint convention (`(bid+ask)/2`). Indicative, not a guaranteed fill.
- **F4 Downside envelope** — Collar: `putStrike` establishes a floor; bounded downside ≈ `currentPrice − putStrike − netDebit`. Bare Hold/CC: no structural floor ("downside unbounded below current price except for premium cushion"). Structural, from strikes.
- **F5 Retained participation** — CC: `callStrike − currentPrice` room before capped (plus premium). Collar: bounded above by call strike, below by put strike. Hold: full. Sell: none.
- **F6 Resulting state** — enumerated structural outcome per alternative and per resolution branch (e.g. CC → {shares retained if OTM, cash if assigned}). A label, not a probability.
- **F7 Next decision boundary** — the option expiration date, or "now" (Sell) / "open" (Hold).
- **F8 Exact monetary release cost** — `sharesFree × (currentPrice − lotBasisPerShare)` **only when lot-level basis is authoritative**; otherwise approximate (blended basis, clearly labeled) or unavailable.

Every fact is **per alternative** and **per resolution branch where branches diverge** (CC and collar have assigned/expired branches; Sell does not).

## 5. Precision boundary 1 — Basis

**Rule (from ratified reconciliation):** `LVT-INIT-OUTCOME-BASIS` is a dependency for **exact lot-specific basis-sensitive claims only** (F8, and any per-lot appreciation/erosion), **not** a prerequisite for the Initiative as a whole.

- **Available today without lot-level basis:** F1 (market value released), F2, F3, F4, F5, F6, F7. None reference basis.
- **Requires stronger basis attribution:** F8 (exact realized erosion/appreciation on sale), and correct per-lot figures for **multi-lot symbols**.
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
| F1 released | portfolio + evidence | `sharesFree × spot` | spot/underlying provenance (partial; quote-level may be unknown) | No | same | show "—" if no spot | derived fact | operator over/understates fungible cash available now |
| F2 encumbrance | evidence | `expiration − today` | calendar (exact) | No | same | n/a (always known if expiration known) | observed fact | operator misjudges lockup duration |
| F3 compensation | evidence (chain) | `mid × 100 × contracts` (CC); net (collar) | chain-acquisition provenance | No | same | "—" if no chain | derived fact (indicative) | aged midpoint read as guaranteed income |
| F4 downside floor | evidence (chain) | from put strike + net debit | chain-acquisition provenance | No | same | "no structural floor" for CC/Hold | derived/structural | operator believes floor exists when it does not |
| F5 participation | evidence + price | strike − spot room | chain + spot provenance | No | same | "—" if no chain/spot | derived/structural | over/understates retained upside |
| F6 resulting state | structural | enumerated per alternative/branch | n/a (structural) | No | same | always determinable | derived fact (label) | operator surprised by post-resolution holding |
| F7 next boundary | evidence | expiration or now/open | calendar | No | same | "open" for bare Hold | observed fact | operator misses forced-decision date |
| F8 exact release cost | portfolio basis | `sharesFree × (spot − lotBasis)` | basis provenance + spot | **Yes** | **wrong on blended; approx/withhold** | "≈ blended" or "unavailable — needs lot basis" | derived fact (basis-sensitive) | **worst case**: fabricated precise erosion figure on multi-lot symbol → false capital-loss belief |

## 8. Comparison behavior

v1 presents facts **side by side across alternatives for one position** so the operator can compare (e.g. GDX: Sell vs 3-DTE $104 CC vs 3-DTE collar vs 10-DTE CC vs 10-DTE collar). It does **not**:

- combine facts into a scalar or rank alternatives;
- declare a winner or "recommended" alternative;
- compute the downstream feasible-set effect (that is `LVT-BET-CAPITAL-CHOICES`; v1 only exposes F1 released-amount as an input another surface may consume — it does not reach into SOXX affordability itself).

Comparison is *presentational adjacency of independent facts*, consistent with `LVT-BET-CONSEQUENCE-ENVELOPE`'s "make effects visible" and `LVT-BET-ACCEPTABILITY`/`LVT-BET-EXPLANATION` owning any actual judgment.

## 9. UI placement hypothesis

**Do not build a new page for v1.** The owned-share consequences belong to a position the operator already holds, and two existing surfaces already reason about owned shares:

1. **Covered-Call Candidates surface (Write Desk)** — already computes per-position free shares, basis, projected called-away economics, and (shipped) basis-positive selection. This is the strongest candidate host: release/retention consequence facts extend the existing per-position/per-expiration rows.
2. **Operator Console position-detail modal (ADR-013)** — already shows Contract State, Decision Pressure, Economic Consequence per monitored position. F1–F7 map naturally onto the Economic Consequence dimension for owned shares.

**Hypothesis:** v1 fits as an extension of the **Covered-Call Candidates surface** (where the operator is already reasoning about what to do with owned shares), possibly surfaced from the Console position-detail modal as the entry point. A dedicated "Share Deployment / Capital Deployment" surface is a **non-goal** (§12) and must be justified by demonstrated cognitive-role pressure, not conceptual neatness. This is a hypothesis for 3AM/Principal, not a decided placement.

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

1. F1 = `sharesFree × spot`; renders "—" when spot absent.
2. F2/F7 correct from expiration; "open"/"now" for Hold/Sell.
3. F3 CC and collar compensation from midpoints; "—" when chain absent; carries chain-acquisition provenance.
4. F4 collar floor from put strike; "no structural floor" for CC/Hold.
5. F5 participation room correct; sign/room per alternative.
6. F6 resulting-state labels correct per alternative × resolution branch.
7. **Precision-boundary tests (mandatory):**
   - F8 single-lot symbol with basis → approximate figure with clear "≈" label;
   - F8 multi-lot symbol → **withheld or explicitly-approximate**, never a fabricated precise number;
   - F8 no basis → "unavailable — needs lot-level basis"; **F1–F7 still render** (missing F8 does not suppress others);
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

## 13. Unresolved questions (for 3AM / Principal)

1. **Host surface:** extend Covered-Call Candidates, or the Console position-detail modal, or both (entry from Console → detail in Write Desk)? (§9 hypothesis; needs Principal/cognitive-role judgment.)
2. **Alternative set for v1:** minimum is {Sell, Hold, CC}. Is **Collar** in v1, or v1.1? Collar adds F4 richness and matches the GDX evidence, but doubles the branch/consequence surface. Recommendation: include Collar because the sharpest evidence (GDX floor decision) needs it — but this is a scope call.
3. **How prominent should F8's degraded state be** — inline "≈"/"unavailable", or a small provenance affordance? (Trustability presentation choice.)
4. **Does exposing F1 (released amount) here create pressure to show the feasible-set effect** (`LVT-BET-CAPITAL-CHOICES`) immediately? Design keeps them separate; confirm that is acceptable for v1.

## 14. Failure modes

- **F8 fabrication (worst):** presenting a precise erosion figure on a multi-lot symbol from blended basis → false capital-loss belief driving a wrong release decision. Mitigated by the mandatory multi-lot withhold/approximate rule.
- **Stale-midpoint laundering:** F3/F4/F5 from an aged chain shown as current income/floor → over-confident retention. Mitigated by carrying chain-acquisition provenance.
- **Quote-level over-claim:** F1 spot treated as live when it is a ~60s-old cached quote. Mitigated by marking quote-level freshness unknown.
- **Broker-order-risk confusion:** surfacing a broker "Max Loss Unlimited" collar label as portfolio risk when shares are owned. Mitigated by representing resulting *portfolio* consequence, not order-shape.
- **Scope creep into scoring/optimization:** the moment facts are combined into one number, v1 has violated its non-goals. Mitigated by keeping facts independent and comparison presentational.

## 15. Smallest coherent implementation boundary

**v1 = per-position, read-only consequence facts F1–F7 + graceful-degraded F8, rendered as adjacent independent facts across {Sell, Hold, CC (+ Collar, pending Q2)} on an existing owned-share surface, consuming cached evidence and existing provenance, with both precision boundaries enforced by test.**

- No backend change, no schema, no provider calls, no scheduler change, no new page.
- One frontend computation module (extending the pattern in `call-brief-builder.ts`) + presentational adjacency in an existing surface.
- Ships truthful value immediately; F8 exactness and any feasible-set coupling are later, separately-owned refinements (`LVT-INIT-OUTCOME-BASIS` / `LVT-BET-CAPITAL-CHOICES`).

---

## Principal decisions requested (only genuine unresolved design choices)

1. **Host surface** (Q13.1): Covered-Call Candidates vs Console detail modal vs both.
2. **Collar in v1?** (Q13.2): include (matches GDX evidence, larger surface) or defer to v1.1.
3. **Escalate this design to 4AM** (add Codex adversarial review of evidence claims, precision boundaries, and accidental-generalization risk) **before** any implementation authorization?

Implementation remains **unauthorized**. This artifact is the A deliverable; it returns to 3AM review.
