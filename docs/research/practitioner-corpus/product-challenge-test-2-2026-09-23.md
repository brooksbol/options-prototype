# Practitioner Corpus Product Challenge — Test 2

**Date:** September 23, 2026  
**Status:** Research artifact / experimental result  
**Authority:** None over Wheelwright Product, policy, semantics, architecture, roadmap, or implementation  
**Corpus basis:** `docs/research/practitioner-corpus/practitioner-corpus-v1.md`  
**Method basis:** `docs/research/practitioner-corpus/practitioner-corpus-v1-charter.md`

## Purpose

Test whether the completed Practitioner Corpus v1 can independently generate useful product-capability hypotheses and meaningful pressure against existing Wheelwright capabilities.

The experiment deliberately separated corpus-first discovery from later Wheelwright reconciliation:

1. inspect the completed corpus without first inspecting Wheelwright product/implementation authority;
2. derive and freeze ten capability hypotheses from practitioner evidence;
3. only then bootstrap Wheelwright;
4. reconcile the frozen hypotheses against the actual product;
5. challenge ten existing Wheelwright capabilities using corpus evidence;
6. assess what the exercise says about the corpus as a product-discovery and product-falsification instrument.

This artifact preserves the Test 2 result as research evidence. It is not a requirements document and does not authorize implementation.

## Provenance note

The experiment was performed in a separate ChatGPT thread. This durable record preserves the substantive output available at session closeout. It is a research-result reconstruction rather than a byte-for-byte transcript of that actor's response. The frozen hypothesis identities, reconciliation counts, principal challenge themes, and experimental conclusions are preserved; wording below must not be treated as verbatim source quotation where the original actor transcript is not present in-repository.

## Phase 1 — frozen corpus-first capability hypotheses

The actor derived and froze these ten hypotheses before Wheelwright bootstrap:

| ID | Corpus-derived capability hypothesis | Practitioner pressure represented |
|---|---|---|
| HYP-01 | **Multi-dimensional qualification** | Applicability is not one scalar: direction/magnitude, volatility, time, economics, risk and structure jointly condition whether a construction fits. |
| HYP-02 | **Planned-loss / invalidation support** | Structural maximum loss and the practitioner's planned loss tolerance are distinct; practitioners also use predeclared conditions that invalidate a thesis or trigger management. |
| HYP-03 | **Multi-path consequence projection** | Practitioners reason across alternative future paths, not only one terminal payoff picture. |
| HYP-04 | **Lifecycle navigator** | Entry is only one decision; practitioners reason through hold, close, roll, assignment, exercise, expiration, defense and subsequent state. |
| HYP-05 | **Assignment / exercise consequence support** | Assignment and exercise are state transitions with inventory, obligation and capital consequences, not merely option outcomes. |
| HYP-06 | **Volatility-aware qualification** | Volatility is used as a qualification/input dimension, while mechanical volatility exposure must remain distinct from claims of exploitable edge. |
| HYP-07 | **Capital-aware sizing / capacity** | Position selection and sizing depend on capital committed, capital at risk, capacity and portfolio constraints rather than contract attractiveness alone. |
| HYP-08 | **Covered-call opportunity-cost support** | Covered-call decisions trade premium against foregone upside, call-away consequences and the value of continuing to own the shares. |
| HYP-09 | **Cross-expiry residual-leg management** | Calendar/diagonal-like structures create surviving-leg and cross-expiry management jobs that cannot be represented as a single terminal payoff or one resolved position. |
| HYP-10 | **Probability / payoff comparison** | High probability of profit is not expected value; practitioners compare probability with payoff asymmetry and consequence magnitude. |

**PHASE 1 HYPOTHESES FROZEN.**

## Phase 2/3 — reconciliation against Wheelwright

After freezing the hypotheses, the actor bootstrapped Wheelwright and classified the product intersection.

Result:

- **ALREADY EXISTS:** 0
- **PARTIALLY EXISTS:** 9
- **NOT FOUND:** 1
- **SUPERSEDED BY A DIFFERENT WW APPROACH:** 0
- **UNRESOLVED:** 0

The single clear **NOT FOUND** was **HYP-09 — Cross-expiry residual-leg management**.

The nine partial intersections are important experimental evidence. The purpose of the corpus-first pass was not to maximize novelty. Independent rediscovery of capabilities or pressures already present in Wheelwright is useful corroboration that the corpus is describing practitioner decision work that Wheelwright has independently encountered.

The partial classifications also matter: the actor did not collapse conceptual overlap into a claim that Wheelwright fully serves the practitioner job.

## Phase 4 — challenge to existing Wheelwright capabilities

The actor then challenged ten existing Wheelwright capabilities against the corpus. The challenge set included the core recommendation surfaces and the strongest lifecycle/capacity/consequence intersections: put recommendation, covered-call recommendation, buy-write recommendation, Recommendation Brief, Position Monitoring, Assignment Consequence, HOLD/close lifecycle reasoning, Unencumbered Shares/capacity semantics, and related consequence/qualification behavior.

The strongest **corroboration** was reported for:

- **Assignment Consequence** — the corpus strongly supports treating assignment as a consequential lifecycle transition rather than a cosmetic option status.
- **Recommendation Brief** — practitioner reasoning repeatedly needs construction, economics, evidence, consequence and rationale to remain legible at the decision point.
- **Unencumbered Shares / capacity semantics** — practitioner construction and lifecycle reasoning depend on what inventory is actually available for another obligation.

The strongest **material pressure / possible gaps** were:

- **Covered-call opportunity cost** — premium alone is insufficient; the decision also contains foregone upside, call-away consequence and continued-ownership alternatives.
- **Predeclared invalidation / planned-loss semantics** — structural max loss is not the same as the operator's planned loss tolerance or thesis-invalidating condition.
- **Monitoring beyond state display** — practitioners use monitoring to support a next lifecycle decision, not merely to observe that a position exists.
- **Volatility as qualification** — volatility is a recurring decision input, but must not be promoted mechanically into an edge claim.
- **Single-leg lifecycle boundary** — cross-expiry/residual-leg cases pressure any lifecycle model that assumes the original structure resolves as one unit.
- **Probability/payoff comparison** — a high-probability framing is incomplete without payoff asymmetry and consequence magnitude.

The actor's challenge classifications were evidence about product pressure, not feature verdicts. Existing capability surviving a challenge was treated as positive evidence; pressure did not automatically become a feature requirement.

## Cross-cutting findings

### 1. Corpus and Wheelwright show substantial independent convergence

The strongest alignment appeared around:

- assignment as a transition with consequences;
- recommendation explanation;
- position monitoring/lifecycle state;
- capacity/inventory constraints;
- consequence decomposition.

This is useful even where it does not produce a novel feature. The corpus was created without rewriting practitioner evidence to fit Wheelwright, so later convergence is a meaningful research observation.

### 2. The corpus exposes jobs that are only partially served

The most visible underserved practitioner jobs were:

- explicit invalidation / planned-loss handling;
- covered-call opportunity-cost comparison;
- exercise/assignment edge cases;
- volatility-aware qualification;
- residual-leg/cross-expiry management;
- probability-versus-payoff comparison.

These are **candidate product-discovery pressures**, not accepted requirements.

### 3. Payoff geometry is necessary but insufficient

The practitioner evidence repeatedly uses payoff diagrams, but the challenge reinforced that a terminal diagram is only one projection of consequence. Time, volatility, assignment, residual legs, management decisions and capital state can remain material after the diagram stops being sufficient.

### 4. Lifecycle is a stronger organizing pressure than strategy labels

Practitioner labels are useful vocabulary, but actual decision work repeatedly crosses entry, monitoring, adjustment, assignment/exercise, close/roll and subsequent state. This supports testing product capabilities against lifecycle decision jobs rather than assuming a strategy label fully defines the job.

### 5. Mechanical properties and edge claims must stay separate

Theta behavior, volatility sensitivity, probability and structural payoff facts may be mechanically describable. Claims that those properties produce an exploitable advantage require separate evidence. The corpus is useful partly because it preserves both practitioner mechanics and practitioner heuristics without forcing them into one epistemic class.

## Experimental assessment

**Test 2 supports continuing to use the Practitioner Corpus as both a product-discovery instrument and a falsification/sounding-board instrument.**

The useful result was not “ten brand-new features.” Nine of ten blind hypotheses intersected existing Wheelwright capability, which is itself evidence of convergence between independently mined practitioner decision work and Wheelwright's evolved product model. The one clear missing capability family — cross-expiry residual-leg management — demonstrates that the method can also expose a genuinely absent area.

At the same time, the partial intersections and existing-feature challenges exposed pressure that a binary feature inventory would miss. A capability can exist while still failing to cover an important practitioner decision job.

This was a **useful pilot, not a pristine double-blind validation**. The corpus itself was built in the broader Wheelwright project environment, and the experiment should not be represented as proof of statistical or epistemic independence. The important procedural control was narrower: the Test 2 actor derived and froze its ten capability hypotheses from the completed corpus before inspecting current Wheelwright product/implementation authority.

## Research implications

Future corpus/product challenge experiments should preserve the same ordering:

> **practitioner evidence → corpus → blind hypotheses/challenges → freeze → Wheelwright bootstrap → reconciliation**

Do not optimize future corpus content to reproduce Wheelwright. Do not score an experiment by novelty alone. Record rediscovery, partial intersection, absence, contradiction and survival under challenge as distinct useful outcomes.

## Non-decisions

This experiment does **not**:

- add any feature to the roadmap;
- establish Product requirements;
- ratify a semantic entity;
- change options-domain mechanics;
- authorize architecture or implementation;
- establish that any practitioner heuristic is correct;
- establish that any challenged Wheelwright feature is defective.

Those transitions, if ever warranted, remain downstream governed decisions.
