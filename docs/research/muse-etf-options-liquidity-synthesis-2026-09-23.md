# Muse ETF Options Research — Wheelwright Synthesis

**Date:** 2026-09-23  
**Status:** Research synthesis; non-authoritative for Product policy  
**Scope:** Frozen 1,306-symbol universe and gen-29066 disposition evidence  
**External actor:** Muse

## Executive narrative

Muse was first asked to independently identify options-friendly ETFs. It was later given the complete frozen 1,306-symbol Wheelwright universe and asked to rank it, suggest eliminations, and explain why the first pass had not surfaced apparent keepers. The resulting artifacts are preserved verbatim beside this synthesis.

The second scan changes the framing of the problem. Muse's current structural-liquidity classifier and Wheelwright's independently produced gen-29066 servicing/disposition evidence show unusually strong convergence at the weak end:

- all **340** Wheelwright `REMOVE` symbols are Muse **Tier F**;
- all **487** Wheelwright `WEEKLY_REFRESH` symbols are Muse **Tier D or F**;
- **0** of Muse's **106 Tier S-C** symbols fall into either Wheelwright demotion cohort.

The principal contradiction is equally useful. Wheelwright retained **84 historical keepers** at normal cadence despite poor current observations because they had retained historical usefulness. Muse currently classifies **81 of those 84 as Tier D**, **2 as Tier F**, and only **1 as Tier B**. The Tier B case is leveraged `LABD`.

This does not establish that either classifier is ground truth. It shows that they observe different properties: Muse measures current/persistent structural options-market quality; Wheelwright includes longitudinal strategy-specific evidence. The 84-name cohort is therefore a high-value falsifier set for any proposal that turns a current structural-liquidity score directly into canonical-universe admission/removal.

The stronger emerging research question is:

> Is the broad candidate universe itself the problem, or is the higher-value opportunity to allocate observation effort intelligently across a deliberately broad universe while preserving rediscovery of episodically useful surfaces?

No Product decision is made by this document.

## Source set

### A — Muse initial options-friendly ETF report

External discovery research defining options friendliness through volume/open interest, ATM spread quality, chain depth, structural suitability, and underlying liquidity.

Preserved unchanged:
- `docs/research/external-artifacts/muse-options-friendly-etfs-report-2026-09-23.md`

### B — Muse full-universe ranking and elimination report

Muse scanned the supplied frozen universe and assigned:

| Tier | Count |
|---|---:|
| S | 3 |
| A | 18 |
| B | 48 |
| C | 37 |
| D | 699 |
| F | 501 |

Preserved unchanged:
- `docs/research/external-artifacts/muse-wheelwright-universe-options-report-2026-09-23.md`
- `docs/research/external-artifacts/muse-wheelwright-universe-options-ranking-2026-09-23.csv`

### C — Wheelwright gen-29066 disposition

Canonical internal evidence:
- `REMOVE`: 340
- `WEEKLY_REFRESH`: 487
- retain at normal cadence despite current Zero OI because of historical usefulness: 84

Source:
- `docs/universe/disposition/wheelwright-universe-disposition-gen29066.md`

Muse did not receive these disposition labels before producing the frozen external artifacts. The crosswalk is subsequent synthesis.

## Patterns and convergences

### 1. Complete convergence on REMOVE

| Wheelwright cohort | S | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|
| REMOVE (340) | 0 | 0 | 0 | 0 | 0 | **340** |

Two independent evidence paths place the same 340 symbols at the structurally weakest end.

### 2. Complete convergence on WEEKLY_REFRESH

| Wheelwright cohort | S | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|
| WEEKLY_REFRESH (487) | 0 | 0 | 0 | 0 | **362** | **125** |

No Muse S-C symbol appears in Wheelwright's weekly-refresh cohort.

### 3. Muse S-C entirely avoids WW demotion

Muse has 106 S-C symbols (3 S, 18 A, 48 B, 37 C). None occur in WW REMOVE or WEEKLY_REFRESH.

This is stronger than agreement on famous ETFs. The entire structurally stronger population avoids both frozen demotion cohorts.

## Central contradiction — the 84 historical keepers

| Muse tier | WW historical keepers |
|---|---:|
| B | 1 |
| D | 81 |
| F | 2 |
| Total | 84 |

The B symbol is `LABD`, flagged by Muse as leveraged. The F symbols are `HYMB` and `VTIP`.

This cohort directly falsifies any unsupported shortcut:

> Muse D/F ⇒ remove from candidate universe.

Wheelwright has retained evidence that these names previously produced useful CSP and/or buy-write outcomes, while Muse's current snapshot says almost all are structurally thin or absent.

### JNK specimen

Muse explicitly identifies `JNK` as currently having only three expirations and recommends `HYG` as the more usable high-yield options venue. JNK is nevertheless a WW historical keeper.

Questions raised:
- Was JNK materially deeper when WW observed usefulness?
- Was usefulness episodic at particular strikes/expirations?
- Can aggregate chain metrics miss a strategy-specific useful surface?
- Is WW's retained history now stale?
- Are provider/snapshot differences material?

The contradiction should be investigated, not reconciled by choosing a preferred source.

## Insights

### Structural liquidity and strategy usefulness are separate dimensions

Muse measures structural market characteristics such as:
- volume;
- aggregate open interest;
- expiration density;
- weekly availability;
- strike/chain depth;
- observed spread quality;
- underlying liquidity.

Wheelwright observes strategy-specific outcomes under its policy/evidence model and retains longitudinal evidence.

Structural depth may increase the probability of finding executable useful surfaces. It does not itself imply Actionable/Edge/Wait or desirability. Structural thinness likewise does not prove that a useful surface can never occur.

### Servicing priority is a different question from universe membership

The strongest agreement is between Muse structural weakness and WW servicing demotion. The historical-keeper contradiction warns against translating that agreement directly into canonical deletion.

This makes structural liquidity a promising **research candidate for an acquisition/servicing prior**, not an authorized admission rule.

## Red flags in the Muse evidence

### 1. Tier F conflates absence with observation failure

The companion CSV contains **97 Tier F rows with a non-empty `err` field**. Muse's prose also acknowledges roughly 90 low-priority symbols remained Yahoo rate-limited after repeated passes.

Therefore “501 symbols have no listed options” is stronger than the row-level artifact supports. Operational use would need separate states such as:
- `NO_OPTIONS_OBSERVED`
- `OBSERVATION_FAILED_OR_UNKNOWN`

### 2. Keep-list prose count is inconsistent

Muse calls its post-cut list “~45 non-leveraged names in Tiers S-C,” while the CSV contains **106 S-C rows**, of which **89** are non-leveraged/non-ETN under the CSV flags. The prose count should not be used without reconciliation against row-level data.

### 3. Spread denominator is questionable for execution quality

The initial Muse methodology expresses ATM option bid/ask width as a percentage of **underlying price**. Spread relative to option midpoint/premium and tick size is often more directly relevant to option execution quality. The spreads are also explicitly single after-hours snapshots.

### 4. Market quality and strategy suitability are mixed

Muse demotes leveraged/inverse/volatility products partly for assignment/path-risk reasons. Those may matter for Wheelwright strategy eligibility, but they are not the same as options-market liquidity. Keep mechanics, evidence, and policy separate.

### 5. Some language exceeds the evidence layer

Claims such as “higher IV — better for premium sellers” mix market observations with strategy conclusions. They should not be imported as Wheelwright policy.

## Contradictions and tensions to preserve

1. **Current D/F vs historical usefulness:** 83/84 historical keepers are currently D/F.
2. **Broad universe vs Muse consolidation:** Muse proposes aggressive reduction; WW requirements separate candidate inclusion from admission/suitability.
3. **Duplicate exposure vs independent optionality:** one liquid proxy per exposure may reduce acquisition cost but can discard distinct price/volatility/distribution/transient-surface behavior.
4. **Leveraged/inverse liquidity vs strategy suitability:** deep options markets do not settle assignment-tolerant strategy eligibility.
5. **Current snapshot vs longitudinal evidence:** Muse is primarily a current structural census; WW retains history.

## Evidence gaps

This synthesis does not yet establish:
- when each historical keeper last produced a useful outcome;
- frequency of historical usefulness;
- CSP vs buy-write provenance;
- strike/DTE/premium characteristics of useful observations;
- contemporaneous chain liquidity at those times;
- whether those surfaces were realistically executable;
- whether retained usefulness has become stale;
- whether D/F status is persistent or episodic;
- acquisition cost per useful observation by structural tier;
- whether S-C predicts Actionable/Edge/Wait frequency after controlling for policy;
- behavior of post-gen-29066 seed additions.

## Hypotheses and falsifiers

### H1 — structural liquidity is a servicing prior
S-C symbols may have higher expected acquisition yield and justify more frequent observation.

**Falsifier:** persistent D/F symbols repeatedly produce useful WW outcomes at rates comparable to S-C.

### H2 — historical keepers capture episodic usefulness
Some currently thin symbols may periodically develop usable strike/expiration-specific surfaces.

**Falsifier:** reconstruction shows historical usefulness was not executable or arose from stale/bad evidence.

### H3 — some retained history is stale
Some of the 84 may no longer justify normal servicing because market structure durably deteriorated.

**Falsifier:** recent observations continue to show periodic evaluable/useful surfaces.

### H4 — broad membership and servicing frequency should remain separate
Broad membership may preserve discovery while a structural prior controls acquisition cost.

**Falsifier:** broad membership itself creates material cost independent of acquisition frequency, or demoted symbols provide no rediscovery value over a meaningful horizon.

### H5 — strong structural markets can expose acquisition/policy anomalies
A structurally deep symbol that repeatedly fails to yield evaluable surfaces may reveal acquisition defects, policy incompatibility, or legitimate strategy mismatch.

**Falsifier:** failures are fully explained by intended policy and evidence behavior.

## Research segmentation

| Historical WW usefulness | Structural quality | Research interpretation |
|---|---|---|
| demonstrated | strong | expected convergence |
| demonstrated | weak | episodic/stale-history falsifier set |
| not demonstrated | strong | policy-fit/acquisition anomaly investigation |
| not demonstrated | weak | strongest servicing-demotion candidate |
| unknown/new | strong | high-priority discovery candidate |
| unknown/new | weak | low-priority discovery candidate |

Neither axis is ground truth.

## Consulting-style synthesis frame

Subsequent interviews, external AI runs, datasets, and WW artifacts should be analyzed for:

1. Patterns
2. Insights
3. Red flags
4. Contradictions
5. Convergences
6. Outliers/anomalies
7. Evidence gaps
8. Source limitations/biases
9. Hypotheses
10. Falsifiers
11. Segmentation
12. Causal candidates
13. Temporal effects
14. Terminology conflicts
15. Unexpected findings
16. Decision implications
17. No-regret actions
18. Open questions
19. Confidence/evidence strength
20. Executive narrative

Preserve the chain:

> **Observation → Pattern → Insight → Hypothesis → Implication → Recommendation → Decision**

## Research-process lesson — preserve actor independence

Muse's reports are valuable partly because they were produced without WW's 340/487/84 labels. Preserve those artifacts as frozen evidence.

If Muse or another external actor is used for follow-up work, prefer blind/minimally revealing prompts. A selected ticker cohort can be supplied for historical options-market research without disclosing why it was selected.

Once an actor receives WW labels and rationale, its subsequent work becomes **reconciliation evidence**, not independent discovery evidence. Both are useful; they must be labeled differently.

## Take-aways

1. Muse structural evidence strongly converges with WW servicing/disposition evidence.
2. The convergence is exact at the frozen weak-end cohorts: **340/340 REMOVE are F; 487/487 WEEKLY are D/F**.
3. Muse S-C has **zero overlap** with WW REMOVE/WEEKLY.
4. The 84 historical keepers block the leap from “currently structurally weak” to “remove from candidate universe.”
5. Structural market evidence is therefore a promising **acquisition-prior research direction**, but no policy is authorized here.
6. The 84-name cohort is the highest-value falsifier set for distinguishing low expected acquisition yield, episodic usefulness, and stale retained history.
7. Muse's row-level artifact is stronger than several prose aggregates; error-state separation and count reconciliation are prerequisites to operational use.
8. The original “which ETFs are missing?” question has evolved into a potentially more important systems question: **how should Wheelwright allocate observation effort across a broad discovery universe?**

## Authority boundary

This document is research synthesis. It does not:
- change the canonical universe;
- change scheduler/acquisition cadence;
- define admission/suitability policy;
- define strategy eligibility;
- alter recommendation logic;
- establish a Product outcome.

Any such change requires the appropriate Wheelwright authority and Principal decision path.

---

CURRENT STATE: Independent Muse structural-liquidity research and frozen Wheelwright gen-29066 disposition evidence are preserved and reconciled as research. Strong convergence exists on REMOVE/WEEKLY cohorts, while the 84 historical keepers remain the principal falsifier set.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Continue bounded research on the 84 historical keepers without changing canonical universe, servicing policy, or strategy eligibility.
