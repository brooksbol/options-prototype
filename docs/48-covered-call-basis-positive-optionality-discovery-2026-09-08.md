# Covered-Call Basis-Positive Optionality — Discovery Snapshot

**Date:** September 8, 2026 (late-night exploratory session preceding the 4am capital-state discussion)
**Status:** Discovery / reconciled exploration under existing `PL-DEPLOY`, with secondary pressure on `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, and the Cash-Flow Operating Regime; NOT implementation authorization or Share Deployment design
**Trigger:** Live operator reasoning over an exploratory change to the Covered-Call Candidates surface, using the real COPX residual position and a stale (81h) sealed evidence snapshot
**Related:** `docs/47-capital-state-management-deployment-paths-discovery-2026-09-07.md`, `docs/23-calls-architecture.md`, `docs/foundations/regime-objective-function.md`, `docs/foundations/conditioned-operating-opportunity.md`, `PL-DEPLOY`, `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`
**Artifact:** `docs/experiments/2026-09-08-covered-call-basis-positive-exploration/wheelwright-calls-2026-09-08-basis-positive.csv`

---

## Why this snapshot exists

Doc 47 established that Wheelwright is evolving from option primitives, through strategy comparison, toward **capital-state management**, and that the residual 100 COPX shares are ordinary lifecycle output rather than a failure. This snapshot records a concrete, empirical continuation of that thread produced by exploratory instrumentation the same night.

The exploration was explicitly framed as **optionality for capital-state management** and as **talking points for the 4am discussion** — not as an authorized design step. It nonetheless produced a finding sharp enough to preserve for cold-start reconstruction.

> **Central finding: cost basis, introduced as a candidate-*discovery* axis rather than a *veto*, surfaces materially different economic bargains against the same shares that single-objective (target-delta) selection structurally discarded.**

This is offered as evidence feeding `PL-DEPLOY`. It does not authorize Share Deployment, a merged Capital Deployment surface, or any strike-selection policy change beyond the exploratory instrumentation described here.

---

## 1. What the exploratory instrumentation did

The Covered-Call Candidates surface was changed, over several small increments, to:

1. Emit **one row per eligible expiration** for an owned symbol (the full DTE ladder), rather than collapsing to a single best covered call per symbol (the ratified `docs/23-calls-architecture.md` behavior).
2. Add a **Basis** column (broker-reported average cost per share, flattened onto the candidate for display/sort). This is the stock/accounting basis — NOT the capital-cycle basis distinguished in doc 47.
3. For each expiration, in addition to the closest-to-target-delta contract, emit the **lowest admissible strike at or above cost basis** (`strike >= basis`), tagged `basis-positive`, when it differs from the target-delta pick.
4. Add Mid (between Bid/Ask), rename `Cts` → `Contracts`, and expose the selection reason in a **Select** column and the CSV export.

All of this is display/selection instrumentation on cache-only evidence. No provider calls, no policy promotion, no engine authority change. The `basis-positive` strike is a *second surfaced candidate*, not a recommendation ranking.

---

## 2. The COPX picture (stale 81h snapshot, basis $94.93)

Selection reason drove eight COPX rows across the 7–42 DTE ladder. The two 14-DTE candidates are the sharpest illustration:

| Selection | DTE | Strike | Δ | Mid | Yield% | Spread% | OI | Exec | Posture |
|---|---|---|---|---|---|---|---|---|---|
| target-delta | 14 | $93 | 0.393 | $1.975 | 56.8 | 22.8 | 528 | 86 | ACTIONABLE |
| basis-positive | 14 | $95 | 0.296 | $1.325 | 38.1 | 11.3 | 4120 | 100 | ACTIONABLE |

The $95 call:

- gives up ~$0.65/share of immediate premium versus the $93,
- buys ~$2/share of additional call-away price,
- sits just above the displayed $94.93 basis (a call-away would not sell below basis before premium), and
- **has the materially better market in this snapshot** (11.3% spread vs 22.8%; OI 4,120 vs 528; Exec 100 vs 86).

Target-delta selection discarded the $95 purely because 0.296 is marginally further from the 0.30 target than 0.393 — even though the $95 is the higher-quality, higher-exit contract. Delta proximity was actively hiding a superior contract.

GDX (basis $103.77) shows the same structure: `basis-positive` rows (e.g. 14-DTE $104, OI 2,092) appear alongside target-delta picks that all sit below basis.

---

## 3. Why this matters: basis as discovery, not veto

The important epistemic point is *how* basis was used:

> **Basis did not filter anything out. It pulled in a candidate a single-objective selector could not see.**

This exposes a **third bargain** against the same COPX capital, none dominating the others:

- **Sell now** → recover ~$9,066 of liquid capital immediately (asset acceptability ≠ current best allocation, per doc 47).
- **14-DTE $95 CC** → ~$132.50 midpoint now, preserve a near-term $95 exit, commit shares for ~2 weeks.
- **42-DTE $96 CC** → ~$327.50 midpoint now and another dollar of exit price, but commit shares for ~6 weeks.

These are not rankings of one bargain. They are **different capital-state commitments** differing in premium, preserved exit price, and lockup duration.

> **Emerging hypothesis (for `PL-DEPLOY`): there may be no single "best covered call." There are materially different bargains available against the same capital, and the future surface may need to express that plurality rather than collapse it.**

This directly corroborates doc 47's Share Deployment / Capital Deployment direction with concrete empirical evidence, produced before that surface has been designed.

---

## 4. Deliberate limits and caveats (for the 4am discussion)

These are the seams to interrogate tomorrow, not settled positions:

1. **"Cost-basis positive" definition is strict.** Instrumentation uses `strike >= stock-basis`. The alternative **effective-sale** definition (`strike + premium >= basis`) would qualify more target-delta rows (e.g. COPX 28-DTE $94.5 + $2.75 mid = $97.25 effective already clears $94.93). Choosing between them is exactly the stock-vs-capital-cycle-basis question doc 47 parked.
2. **Basis shown is the raw broker $94.93**, not the ~$91.51 capital-cycle basis (which nets prior premium). The `basis-positive` line is therefore *conservative* relative to true cycle economics.
3. **Delta drift.** The basis-positive strike sits at lower delta as DTE shrinks (less time = less premium for the same strike distance); the yield column makes this visible.
4. **Evidence is stale (81h, sealed).** These are not live economics. Tomorrow's regular-session quotes will re-price every row; the *structure* of the finding (basis-as-discovery) is what is durable, not the specific numbers.
5. **This departs from ratified `docs/23-calls-architecture.md`** ("held executable inventory only … one best per symbol"). It is exploration under a Principal sequencing instruction, not an authorized architecture change. Any promotion goes through the doc 47 / idea-intake reconciliation gates.

---

## 5. Disposition

- **Canonical identity:** `PL-DEPLOY` (no new `PL-*` ID). Secondary pressure: `PL-STRAT-01`, `PL-POL-01`, `PL-PORT-01`, `PL-DEC-BEH`.
- **Strategic disposition:** Strengthens existing capital-state-management direction with empirical evidence; no roadmap change.
- **Architectural disposition:** Corroborates the multi-bargain / plural-alternatives pressure on the future Deployment surface; authorizes nothing.
- **Next authorized mode:** Further exploration / design only. Useful next work is deciding the basis definition (strict vs effective-sale), whether basis-positive is a discovery axis or a policy input, and how plurality is expressed without confusing discovery with recommendation.
- **Not authorized:** Share Deployment implementation, Capital Deployment implementation, Prod v0 changes, strike-selection policy promotion, automatic selling/redeployment, broker execution, or roadmap reprioritization.

Durable why-state for the underlying capital-state model remains in doc 47; this record adds the concrete basis-as-discovery empirical finding and preserves the artifact that produced it.

---

## 6. Pre-game framing for the 4am roadmap review (Principal)

The exploratory work prompted a structural "what would Share Deployment + Collar require?" analysis. That analysis is useful **only** as something to poke holes in — none of its proposals are commitments. The Principal's pre-game framing corrects a key flaw in it and sets better questions:

**The correction: UI symmetry is probably real before economic symmetry is.** "Cash Deployment" and "Share Deployment" feel like twins from the operator's chair, which is promising. But that must not be taken to mean the scoring model, row semantics, or lifecycle logic should mirror each other one-for-one. The cross-entry surface is a **rendering template, not a semantics template.** Economic symmetry has to be earned, not assumed from layout symmetry.

**On Prod v0's role:** it is useful but may be **too narrow to be the universal comparator** once Share Deployment includes Sell, Hold, CC, and Collar:

- A CC has obvious current production.
- A Collar can have negative net premium but improved downside consequences.
- Sell releases liquidity that may immediately become productive somewhere else.
- Hold preserves pure participation.

These are not naturally comparable by forcing each into one monthly-production number. Three of the four have primary value *outside* the production numerator (downside consequence, liquidity redeployment, retained upside). This is the same failure mode as tonight's target-delta collapse, one level up: a single objective hiding the dimensions that actually distinguish the bargains.

**On Sell being more architecturally provocative than Collar:** Collar is mechanically more complex (two legs) but conceptually stays within "modify this share position" — bounded. **Sell blows the boundary open** because the interesting question is usually not "sell or don't sell" but "**sell, then what?**" That is where Share Deployment naturally leans into the bigger **Capital Deployment / capital-state paths** idea (share → cash → another symbol's CSP/BW). Mechanical complexity and architectural provocativeness are orthogonal here.

**On candidate generation:** tonight's changes showed that more data (DTE + spot + basis + basis-positive selection) did **not** just produce clutter — it exposed different bargains the target-delta collapse was hiding. A future design should therefore be **very careful about prematurely recompressing the opportunity set into a single "best" answer.**

### Four live hypotheses to carry into 4am (not ratified)

1. **Share Deployment probably deserves its own operator surface.**
2. **One row should probably mean one materially distinct bargain, not one symbol.**
3. **Cross-mechanism comparison likely needs more than Prod v0** (candidate shape: a consequence vector — current production, downside floor, liquidity released, participation retained, lockup duration — where different mechanisms populate different components and some are null; ties to doc 47's "consequence envelope / compensation relative to consequence").
4. **Sell is likely the bridge from Share Deployment into the bigger Capital Deployment idea.**

None of this needs ratification tonight. It is a better set of questions for the roadmap review, and it explicitly supersedes any one-for-one "mirror Cash Deployment" assumption in the structural analysis.

---

## 7. Second empirical finding — strategy-siloed generation hides cross-state bargains

**Artifact:** `docs/experiments/2026-09-08-covered-call-basis-positive-exploration/wheelwright-cross-entry-2026-09-08.csv` (Cash Deployment — Prod v0 export)

The Cash Deployment surface surfaced a **covered-call bargain the Calls surface did not**.

The top-ranked cross-entry row is a COPX buy-write at **42 DTE, strike ~$91 (Δ0.5305), mid $5.70, capital $9,066**. Given the operator already holds 100 COPX, that buy-write is **economically equivalent to simply selling one COPX Oct 16 $91 call against the shares already owned** (the redundant sell-shares / rebuy-shares path is not the point and is not narrated here). Same option leg, same ~$5.70/share premium, same resulting position.

The Calls recommender never surfaced this contract, and the reason is now mechanical and clear from tonight's work:

- The Calls engine selects around **target delta 0.30** within an admissible band of **0.15–0.50** (plus the exploratory basis-positive strike).
- The $91 call is **Δ0.53 — deep in the money, outside the admissible band** — so the Calls surface structurally cannot emit it.
- The **BW engine generates it happily** because, from a fresh-cash lens, a deep-ITM buy-write is an attractive shape: large premium, tiny appreciation-to-strike, strong production, likely near-term call-away.

**Two strategy-specific engines discovered different bargains over the same underlying capital**, because they apply different admissibility to the same option leg.

### The finding

> **The bargain a contract represents depends on the capital state you view it from.** A deep-ITM call is inadmissible as a "covered call around 0.30 delta" but is exactly a "trade participation for production and likely disposition" bargain against owned shares. Strategy-siloed generation cannot see across that boundary.

From the shares-owned view, the $91 / 42-DTE is a legitimate, disposition-leaning Share Deployment alternative: take ~$570 now, surrender essentially all upside above $91, and accept that call-away is likely. That is a different bargain from the income-leaning near-0.30-delta covered call — and a delta-banded covered-call generator will always hide it.

### Why it matters (exploration/design input only — NOT ratified)

This is distinct from the basis-positive finding (§2–§5) and sharpens hypothesis #3/#4:

> **Candidate generation may need to become capital-state-aware rather than strategy-siloed.** The admissibility band itself (e.g. delta 0.15–0.50) may be a **capital-state-dependent** parameter, not a global policy constant — an income lens and a disposition lens over the same owned shares admit different regions of the same chain.

Governance unchanged: this remains exploratory evidence feeding `PL-DEPLOY`. It authorizes no cross-engine merge, no admissibility-policy change, and no Share Deployment implementation. It is a better question for the 4am roadmap review.

---

## 8. Third empirical finding — capital state changes the feasible set (SOXX affordability frontier)

**Artifact:** `docs/experiments/2026-09-08-covered-call-basis-positive-exploration/wheelwright-cross-entry-2026-09-08.csv` (same Cash Deployment — Prod v0 export)

SOXX makes a **threshold effect** obvious. The SOXX buy-write requires ~$51,989 capital; deployable cash is ~$47.1k; the Remaining column reads **−$4,937.81**. Wheelwright is saying: this opportunity exists and looks attractive (~7.6%/mo Prod v0), but you are ~$4,938 short of being able to take it.

Now introduce the owned COPX shares. Selling 100 COPX at ~$90.66 releases ~$9,066. Pooled with cash:

```text
~$47.1k cash + ~$9.1k released  ≈  ~$56.2k deployable
```

SOXX flips from **unaffordable by ~$4.9k** to **affordable with ~$4.1k remaining**.

### The finding

> **Negative Remaining is not a rejection — it is a measured capital gap to a currently-inaccessible opportunity.** Existing share inventory is therefore not only "a $9k position I could sell"; it is also **"a $9k source of releasable capital capable of closing specific affordability gaps elsewhere."**

The consequence of Sell is not:

```text
Sell COPX -> 0 production
```

It is:

```text
Sell COPX -> +$9,066 deployable liquidity -> affordability frontier moves ->
previously inaccessible opportunities enter the feasible set
```

### Why it matters (exploration/design input only — NOT ratified)

This is a **third distinct kind of optionality**, separate from §2–§5 and §7:

- §2–§5 (basis-positive): a hidden bargain *within* a mechanism.
- §7 (strategy-siloed): the *same* option leg judged differently by two engines over the same shares.
- §8 (this): capital state changing the **feasible set itself** — choice *created by pooling* released capital with cash already available, not choice *among uses* of released capital.

It is the strongest evidence yet that:

1. **Scoring Sell as `Prod v0 = 0` would be badly misleading.** Selling COPX produces no premium, yet that transition can convert an inaccessible ~7.6%/mo SOXX opportunity into an accessible one. The consequence lives entirely outside the production numerator (reinforces hypothesis #3).
2. **Sell is the bridge to Capital Deployment** (reinforces hypothesis #4): its value is realized only when release + existing cash + a downstream opportunity are reasoned about together.

**Beyond tonight (explicitly not for design now):** the eventual question could become *what is the smallest / most appropriate capital release required to unlock a materially better opportunity?* — i.e. inventory as a tunable liquidity source against an affordability frontier, not an all-or-nothing sell. Recorded as a phenomenon SOXX exposed, not a proposal.

Governance unchanged: exploratory evidence under `PL-DEPLOY`. Authorizes no affordability-frontier feature, no automatic selling/redeployment, no Prod v0 change, and no Share/Capital Deployment implementation.
