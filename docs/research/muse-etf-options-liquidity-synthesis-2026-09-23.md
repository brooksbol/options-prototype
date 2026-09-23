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

The principal contradiction is equally useful. Wheelwright retained **84 historical keepers** at normal cadence despite poor current observations because they had retained historical usefulness. Muse's original full-universe classifier placed **81 of those 84 in Tier D**, **2 in Tier F**, and only **1 in Tier B**. The Tier B case is leveraged `LABD`.

Muse then researched those 84 as a blind cohort: it received the ticker list but not the Wheelwright reason for selection. That follow-up materially narrows one possible explanation. Muse found **83 of 84 structurally thin today**, with `LABD` the current structural exception. It recovered clear evidence that today's snapshot understates materially stronger historical conditions for only **four** names: `EUO`, `DJP`, `SLX`, and `RETL`. For roughly 75 names it found no dated public evidence of materially stronger historical options markets, while explicitly grading much of the historical record as **indeterminate** because public per-symbol historical options data is sparse.

The resulting contradiction is sharper than the original one: **Wheelwright records demonstrated historical strategy usefulness for 84 symbols, while provenance-independent public-market research generally cannot recover structural-liquidity history sufficient to explain that usefulness.** This does not establish that either classifier is ground truth, and absence of recoverable public evidence is not evidence that a stronger historical market never existed.

The stronger emerging research question is now:

> What exactly did Wheelwright observe when each historical keeper was useful, and does structural liquidity predict Wheelwright usefulness, acquisition yield, neither, or only under particular temporal/strategy conditions?

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

Muse did not receive these disposition labels before producing the frozen full-universe artifacts. The crosswalk is subsequent synthesis.

### D — Muse blind 84-symbol historical-liquidity follow-up

Muse received only the 84 ticker symbols after asking for the missing cohort list; it was not told that Wheelwright classified them as historical keepers or why they were selected. It independently researched current and historical options-market conditions.

Preserved unchanged:
- `docs/research/external-artifacts/muse-cohort-84-options-liquidity-research-2026-09-23.md`
- `docs/research/external-artifacts/muse-cohort-84-options-evidence-table-2026-09-23.csv`

Key external findings:
- 83/84 are structurally thin today; `LABD` is the current structural outlier.
- Four names have recovered evidence that the current snapshot materially understates past conditions: `EUO`, `DJP`, `SLX`, `RETL`.
- For roughly 75 names, Muse found no dated evidence that their options markets were ever materially more usable.
- Historical negatives remain evidence-limited: Muse found no public annual per-ETF options-volume ranking for 2018–2025 and labels many symbol histories indeterminate.

## Patterns and convergences

### 1. Complete convergence on REMOVE

| Wheelwright cohort | S | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|
| REMOVE (340) | 0 | 0 | 0 | 0 | 0 | **340** |

Two independently produced classifications with no Wheelwright disposition-label leakage place the same 340 symbols at the structurally weakest end.

### 2. Complete convergence on WEEKLY_REFRESH

| Wheelwright cohort | S | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|
| WEEKLY_REFRESH (487) | 0 | 0 | 0 | 0 | **362** | **125** |

No Muse S-C symbol appears in Wheelwright's weekly-refresh cohort.

### 3. Muse S-C entirely avoids WW demotion

Muse has 106 S-C symbols (3 S, 18 A, 48 B, 37 C). None occur in WW REMOVE or WEEKLY_REFRESH.

This is stronger than agreement on famous ETFs. The entire structurally stronger population avoids both frozen demotion cohorts.

## Central contradiction — the 84 historical keepers

| Muse original tier | WW historical keepers |
|---|---:|
| B | 1 |
| D | 81 |
| F | 2 |
| Total | 84 |

The B symbol is `LABD`, flagged by Muse as leveraged. The F symbols are `HYMB` and `VTIP`.

The blind historical follow-up changes the interpretation of this cohort. The 84 are **not, as a population, explained by recoverable evidence of formerly strong options markets**.

### Three observed populations

1. **Current structural exception — `LABD`.** Muse finds a genuinely live current options market with weeklies, roughly 3,000 contracts/day and approximately 28k–46k total OI.
2. **Recovered historical/episodic exceptions — `EUO`, `DJP`, `SLX`, `RETL`.** These have dated evidence that today's structural snapshot understates materially stronger or episodically active past conditions.
3. **Unexplained/indeterminate remainder.** For the large majority, Muse did not recover dated public evidence sufficient to explain Wheelwright's retained historical usefulness through broad structural liquidity.

The third population must not be relabeled "historically thin." Muse explicitly reports that public historical ETF-options data is sparse and that many negative searches remain indeterminate. "Not recovered" is not "never existed."

The cohort therefore establishes a narrower claim:

> **Current Muse D/F status does not by itself establish absence of historical or episodic Wheelwright usefulness.**

This defeats current structural weakness as a sufficient standalone rule for permanent candidate-universe removal. It does **not** establish that historical usefulness warrants indefinite retention.

### JNK specimen

Muse explicitly investigated `JNK`. Its current market remains thin (three expirations, roughly 46 contracts/day and ~2,377 OI in the external research). A spectacular-looking 2019 historical datapoint appears duplicated with SPY and is treated by Muse as likely scrape contamination. Muse therefore recovered no credible evidence that JNK once had a materially stronger broad options market.

JNK now raises the more forensic question: **what exact Wheelwright observation caused it to be retained as historically useful?**

Possible explanations to preserve rather than choose among:
- a strategy-specific strike/expiration was useful despite a structurally thin aggregate market;
- usefulness was transient and left little public historical trace;
- provider/snapshot differences were material;
- retained history is stale;
- historical evidence or classification was erroneous.

The contradiction should be investigated from Wheelwright's actual retained observations, not reconciled by choosing a preferred source.

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

The blind 84-symbol follow-up makes the distinction more important: broad historical structural liquidity explains only a small minority of the retained historical-keeper cohort. A Wheelwright-useful surface may therefore be much narrower than a generally liquid options market, or some retained historical evidence may fail reconstruction. Both remain hypotheses.

### Servicing priority is a different question from universe membership

The strongest agreement is between Muse structural weakness and WW servicing demotion. The historical-keeper contradiction warns against translating that agreement directly into canonical deletion.

This makes structural liquidity a promising **research candidate for predicting expected acquisition yield or servicing priority**, not an authorized admission rule. The research question is now whether it predicts Wheelwright usefulness, acquisition efficiency, both, or neither after strategy and time are controlled.

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

### 6. Underlying liquidity/AUM is not an options-liquidity surrogate

The blind 84-symbol study finds very large funds with minimal options activity and much smaller funds with materially greater OI. Structural options liquidity must therefore be observed directly rather than inferred from AUM or share liquidity.

### 7. "Optionable" metadata is not ground truth

Muse found issuer/vendor flags such as "Options Available: No" or "Optionable: N/A" that conflict with observable listed chains. Research should preserve optionability as a provenance-bearing observation state, not silently treat a single vendor boolean as truth.

### 8. Historical continuity is not symbol continuity

Ticker renames, benchmark/strategy changes, ETN events, splits, and reverse splits can break economic and options-market continuity. Preserve the distinction:

> **symbol continuity ≠ economic-product continuity ≠ options-market continuity**

Historical usefulness should eventually be evaluated against the economic instrument and options structure that existed when the observation occurred.

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

### H2a — episodic structural-market hypothesis
Some WW historical usefulness resulted from temporary periods of materially stronger options-market activity. `EUO`, `DJP`, `SLX`, and `RETL` are observed examples consistent with this mechanism.

**Falsifier:** reconstruction shows the relevant WW useful observations occurred outside the recovered stronger periods or did not depend on stronger market structure.

### H2b — local-surface hypothesis
A strategy-specific strike/expiration may satisfy Wheelwright evidence and policy requirements even when the symbol never develops broadly strong structural liquidity.

**Falsifier:** reconstruction shows WW useful observations required broadly strong market conditions or were not realistically executable.

### H2c — retained-evidence-quality hypothesis
Some historical usefulness may reflect provider artifacts, stale observations, or classifications that would not survive reconstruction.

**Falsifier:** retained observations reconstruct cleanly with contemporaneous executable evidence and intended policy behavior.

### H3 — some retained history is stale
Some of the 84 may no longer justify normal servicing because market structure durably deteriorated.

**Falsifier:** recent observations continue to show periodic evaluable/useful surfaces.

### H4 — broad membership and servicing frequency should remain separate
Broad membership may preserve discovery while a structural prior controls acquisition cost.

**Falsifier:** broad membership itself creates material cost independent of acquisition frequency, or demoted symbols provide no rediscovery value over a meaningful horizon.

### H5 — strong structural markets can expose acquisition/policy anomalies
A structurally deep symbol that repeatedly fails to yield evaluable surfaces may reveal acquisition defects, policy incompatibility, or legitimate strategy mismatch.

**Falsifier:** failures are fully explained by intended policy and evidence behavior.

## Research segmentation — longitudinal 2×2 falsification frame

The next research pass should treat both contradiction quadrants symmetrically:

| | WW useful history | No WW useful history |
|---|---|---|
| **Structurally strong** | convergence/control | **strong-but-unproductive falsifier** |
| **Structurally weak** | **historical/episodic-usefulness falsifier** | expected low-yield servicing population |

The 84 historical keepers occupy the lower-left research problem. The mirror-image upper-right population is equally important: structurally strong symbols that have produced little or no Wheelwright usefulness.

Measure longitudinally, where retained evidence permits:
- frequency/count of evaluable and useful surfaces;
- date/recency of last useful surface;
- CSP vs buy-write strategy provenance;
- acquisition cost;
- contemporaneous option volume and OI;
- expiration and strike depth;
- spread/executability at the useful observation;
- structural trajectory and instrument continuity.

This design can distinguish whether structural liquidity is predictive of Wheelwright usefulness, merely an acquisition-efficiency variable, necessary-ish but insufficient, or largely orthogonal after policy is applied.

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

1. Muse structural evidence and WW disposition show exact weak-end classification convergence: **340/340 REMOVE are F; 487/487 WEEKLY are D/F; 0 Muse S-C symbols fall into either cohort**.
2. This is **provenance-independent classification agreement**, not proof of statistically independent underlying evidence.
3. The blind 84-symbol follow-up materially weakens the simple explanation that WW historical keepers were broadly liquid options markets in the past.
4. `LABD` is the current structural exception; `EUO`, `DJP`, `SLX`, and `RETL` have recovered evidence of materially stronger/episodic past conditions.
5. The large remaining historical-keeper population is **unexplained/indeterminate**, not proven historically thin. Public historical ETF-options evidence is too sparse for that negative conclusion.
6. Current D/F status therefore does not establish absence of historical/episodic Wheelwright usefulness, but historical usefulness also does not establish indefinite retention.
7. The next critical evidence source is Wheelwright's own retained history: what exact observation, date, strategy, strike/DTE, evidence state, and executability produced each keeper classification?
8. The mirror-image falsifier population—structurally strong names with little or no WW usefulness—must be studied alongside the 84.
9. Underlying AUM/share liquidity is not a reliable options-liquidity proxy in this cohort; optionability metadata also requires provenance because vendor/issuer flags conflict with observable chains.
10. Structural market quality, Wheelwright strategy usefulness/suitability, and exposure substitutability are separate propositions and should remain separately testable.
11. The research program is now best framed as a longitudinal 2×2 falsification study, not a path toward an admission rule.

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

CURRENT STATE: Frozen Muse research and Wheelwright gen-29066 evidence now establish a sharper unresolved contradiction. Current structural weakness does not explain most of Wheelwright's 84 historical-keeper classifications: blind external research recovered clear evidence of materially stronger historical options-market conditions for only a small minority, while public historical options evidence remains incomplete. Provenance-independent classifications therefore remain unreconciled.

DECISION REQUIRED: NO

NEXT AUTHORIZED ACTION: Build the longitudinal 2×2 research crosswalk from Wheelwright's actual retained evidence, beginning with the exact historical-usefulness observations for the 84 weak-structure keepers and the mirror-image strong-structure/no-usefulness cohort. Preserve usefulness frequency, recency, strategy provenance, acquisition cost, contemporaneous executability, instrument continuity, and temporal market structure separately from any future policy conclusion.
