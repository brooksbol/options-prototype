# Options Prototype — Project Journal

## Purpose

This is an append-only project journal.

It exists to preserve context that may otherwise be lost across ChatGPT threads, Kiro sessions, screenshots, implementation reports, and informal conversations.

This is not a formal specification.
This is not an ADR log.
This is not polished documentation.

It is a raw chronological memory layer for reconstructing the "why" of the project.

Use this when:
- A chat thread loses context.
- A future session needs to recover project intent.
- The team needs to understand why a decision was made.
- The repository no longer explains the learning path clearly enough.
- The project needs to resume after time away.

Append new entries at the bottom.

---

## Journal Rules

1. Append only.
2. Do not over-edit older entries.
3. Prefer raw useful context over polished prose.
4. Capture why-state, not just what-state.
5. Include implementation milestones only when they changed understanding.
6. Do not duplicate formal specs unless the context matters.
7. Screenshots may be referenced but do not need to be embedded.
8. This file is read only when rebuilding context.

---

## Entry Template

```markdown
## YYYY-MM-DD — Short Title

### Context

### What happened

### What we learned

### Decisions / implications

### Open questions
```

---

## 2026-07-03 — Bootstrap, Methodology, and First Observable System

### Context

Options Prototype began as the first working slice of a larger options-income control-system idea that emerged from a Crazy Investing discussion.

The original financial idea was not "build an options screener." It was the question of whether an options income strategy could be understood as a closed-loop financial control system.

Core conceptual background:

- Options premium as production output.
- ETF capital as productive capacity.
- Assignment as a state transition, not failure.
- Delta as a control variable / actuator.
- Covered calls and cash-secured puts as mechanisms for moving between cash and ETF ownership.
- The eventual system may observe portfolio state, compare it to a desired equilibrium, and recommend delta adjustments.

Slice 1 was deliberately narrowed to an options-chain module.

Purpose of Slice 1:

- Observe an options chain.
- Filter contracts.
- Calculate income metrics.
- Highlight contracts near target delta.
- Avoid brokerage integration.
- Avoid automation.
- Avoid prediction.

### What happened

The project was renamed from the broader "Crazy Investing" framing to **Options Prototype**.

We chose to begin with:

- React
- TypeScript
- Mock data
- No backend
- No Java
- No Docker
- No Postgres
- No brokerage connection

This was intentional. The first slice should produce working observable software, not infrastructure complexity.

A clean MacBook Air environment was bootstrapped. Important environment friction from the earlier GIA prototype was avoided by explicitly installing and verifying:

- Xcode Command Line Tools / Git
- Homebrew
- nvm
- Node LTS
- npm

A GitHub repo was created:

- `options-prototype`

The repository started with specifications and project knowledge before meaningful implementation code.

Created documentation structure:

```text
docs/
  00-project-charter.md
  01-environment.md
  02-domain.md
  03-requirements.md
  04-architecture.md
  05-design.md
  05a-component-map.md
  06-tasks.md
  development-machine.md
  foundations/
    closed-loop-engineering.md
```

Also created a root `README.md` after realizing the repo needed a public interface and clean-laptop bootstrap instructions.

### What we learned

#### 1. Kiro is useful, but we are using it inside a larger methodology

Kiro's native model appears to be:

```text
requirements.md
↓
design.md
↓
tasks.md
↓
implementation
```

That is useful for implementation-ready features.

This project started earlier than that.

We began with:

```text
Question
↓
Hypothesis
↓
Conversation
↓
Mental model
↓
Specification
↓
Architecture
↓
Implementation
↓
Evidence
```

This means we are shifting left relative to Kiro's default workflow.

That is acceptable.

Kiro is not the whole methodology. Kiro is one component inside a larger learning loop.

#### 2. Working software is the mechanism of learning

A key thesis emerged:

> AI accelerates organizational learning by reducing the cost of building working experiments that generate evidence.

Working software is not merely the end product.

Working software is the instrument that closes the learning loop.

This was true in GIA and is being made explicit here.

#### 3. Observable working software matters more than hidden implementation

We realized that several implementation tasks could produce no browser-visible changes.

That is risky because it lengthens the observation cycle.

New principle:

> Optimize for observation cadence, not merely implementation cadence.

This led to the idea of inserting an Engineering Console before the full end-user UI.

#### 4. The Engineering Console is not debug UI

Inspired by the GIA prototype, we inserted a T-04a task to replace the default Vite screen with an internal observability surface.

The console shows:

- Implementation status
- Domain module inventory
- Calculation probes
- Raw sample domain object JSON

This is not final product UI.

It is an observability surface.

It lets the running system participate in the learning loop before end-user features are ready.

#### 5. Domains are not yet known

Unlike GIA, this project does not begin with well-developed BRDs, business capability maps, or a master architecture.

The domain structure is still tentative.

Current files like `types.ts`, `calculations.ts`, and future `policy.ts` are modules, not necessarily domains.

We should avoid naming durable domains too early.

Potential future domains may emerge through implementation evidence.

The console may become a place where those emerging domains become visible.

#### 6. The repository is becoming institutional memory

The repository now holds:

- Specs
- Environment contract
- Architecture
- Design
- Tasks
- README
- Engineering philosophy
- Running code
- Test evidence
- Journal

This is more than source control.

It is a record of learning.

### Decisions / implications

- Keep Kiro constrained during implementation tasks.
- Allow Kiro to participate in bounded design-review checkpoints, as in GIA.
- Do not let Kiro silently change domain, architecture, or design.
- Insert observable UI / console slices when too many invisible implementation tasks accumulate.
- Use small commits at meaningful boundaries.
- Maintain root README as the operational/public entry point.
- Maintain this journal as raw append-only context recovery.
- Treat `docs/foundations/` as durable project philosophy.
- Treat `docs/journal/` as chronological project memory.

### Implementation state at this entry

Accepted or effectively completed:

- T-01 Project scaffold
- T-02 Vitest configuration
- T-03 Domain types
- T-04 Calculation library
- T-04a Engineering Console Bootstrap

Visible app state:

- Browser shows Engineering Console.
- Calculation probes are live and call domain calculation functions.
- Sample `OptionContract` JSON is visible.
- Default Vite screen is gone.

Test state:

- TypeScript compile passes.
- Build passes.
- Tests pass.
- At T-04a report: 2 test files, 31 tests passing.

### Open questions

- Should the Engineering Console remain permanent? Current instinct: yes.
- Should the console be renamed "Observatory" later?
- When should Kiro be invited into bounded design review?
- At what point do modules become domains?
- Should screenshots be stored in repo or outside repo?
- Should `docs/README.md` remain, since root `README.md` now exists?
- Should task plan be updated to formally include observation-cadence rules and Engineering Console milestones?

---

## Entry: Reasoning Subsystem Checkpoint — Observations for Future Reference

**Date:** 2025-07-03

**Context:** Learning Checkpoint after completing the reasoning subsystem (types, calculations, policy, delta matching, Decision Narrative). Three foundational principles were promoted to `docs/foundations/closed-loop-engineering.md`. Two observations are preserved here for future review.

---

### Observation 1: Reasoning Artifacts vs. Implementation State

The Engineering Laboratory currently exposes two kinds of information:

- **Implementation state** — which modules exist, what their status is, what the active policy configuration is.
- **Reasoning artifacts** — why the system reached a specific conclusion (the Decision Narrative).

These are conceptually distinct but we don't yet have enough evidence to determine whether they should be architecturally separated. Only one reasoning artifact exists (the Decision Narrative). When additional reasoning surfaces emerge (e.g., provider mapping explanations, yield comparison rationale, multi-criteria screening explanations), we'll have enough data to assess whether this distinction warrants structural separation or merely vocabulary distinction.

**Status:** Continue observing. Revisit after provider work introduces a second narration surface.

---

### Observation 2: Structured Decision Traces

The current Decision Narrative works by re-deriving the decision at the UI layer (scanning contracts, computing distances, detecting ties). This is correct and sufficient for Slice 1.

Clear transition signals have been identified for when structured `DeltaDecision` objects should replace UI-layer derivation:

1. Narrative inaccuracy (the narrative and the engine disagree)
2. Non-reconstructable reasoning (the engine's logic outgrows what external observation can replicate)
3. Multiple consumers (two or more components independently derive the same decision metadata)
4. Richer traces needed (decision history across sweeps, statistical views of policy involvement)

**Likely trigger:** Screening policy expansion (multi-criteria filtering) that makes the engine's logic non-reconstructable from outside.

**Status:** Preserved for future reference. Do not implement until a triggering signal fires.

---

### Implementation state at this entry

Completed:
- T-01 through T-04 (scaffold, tests, types, calculations)
- T-06 Policy engine + tests
- T-08 Delta matching + tests
- T-10 MarketDataProvider interface
- T-04a Engineering Laboratory (Interactive Delta Probe + Decision Narrative + Tie-Breaker selector)

Domain subsystem: fully implemented and observable.
Provider subsystem: interface defined, mock implementation pending.

Test state: 4 files, 59 tests passing. TypeScript compiles. Build succeeds.

Browser state: Engineering Laboratory with interactive delta probe, scenario selector, tie-breaker control, decision narrative, metrics panel. Three engineering fixtures (Normal Market, Tie Scenario, Deep OTM).

---

## Entry: Massive API Provider Spike — Feasibility Result

**Date:** 2025-07-03 (evening)

**Context:** Bounded Sunday-night spike to validate whether the Massive (formerly Polygon.io) options chain snapshot API can supply real data through our canonical domain types.

---

### Result: Technically viable, commercially gated

**What worked:**
- API key correctly read from `VITE_MASSIVE_API_KEY`
- Browser successfully makes CORS request to `api.polygon.io` (no CORS block)
- Massive returns structured JSON (not a network error or CORS rejection)
- Authentication with API key in query parameter works as documented

**What failed:**
- HTTP 403: "You are not entitled to this data. Please upgrade your plan."
- The options chain snapshot endpoint (`/v3/snapshot/options/{underlying}`) requires a paid Options plan
- The free tier provides only options contract *reference data* (metadata), not market data (quotes, greeks, OI)

**What this means:**
- CORS risk: **retired** (browser can reach the API)
- Authentication pattern: **validated** (key in query string works)
- Response format mapping: **validated in code** (mapping functions are written and type-checked against documented response shape)
- Actual data delivery: **blocked by plan tier**

---

### Provider classification

| Provider | Status |
|----------|--------|
| Massive (free) | Not viable — options snapshot endpoint gated |
| Massive (Starter ~$29/mo) | Viable — 15-min delayed, includes snapshot with greeks |
| Tradier (sandbox) | Pending — account approval in progress, delayed data + CORS, but no greeks in sandbox |
| Yahoo/yfinance | Viable for price data but no delta; requires Python proxy or computation |

---

### Decisions made

- Do not build more Massive integration until a paid plan is approved or Tradier becomes available
- Preserve the spike code — it is architecturally correct and will work immediately when entitlements are available
- The mock provider remains the primary data source for continued development

---

### Mapping code validated (ready for activation)

The `massiveClient.ts` mapping handles:
- `details.contract_type` → `"CALL" | "PUT"` ✓
- `details.strike_price` → `strike` ✓
- `last_quote.bid/ask` → `bid/ask` ✓
- `greeks.delta` → `delta` ✓
- `open_interest` → `openInterest` ✓
- `day.volume` → `volume` ✓
- Filters out contracts without delta or pricing ✓

When a paid plan is activated, the spike will produce working data with zero code changes.

---

### Corrections and reflections (appended same entry)

**Corrected framing:**

The key insight is not "no free provider offers options delta through a browser-accessible API."

The key insight is: **the architecture successfully isolated the uncertainty at the provider boundary.** The spike retired CORS, authentication, mapping, and browser-access uncertainties in a single experiment. The only remaining question is commercial (data entitlement), not architectural. That's evidence that the provider abstraction was correctly designed.

**Corrected confidence:**

The existing spike is *expected* to work immediately upon upgrade, with final validation occurring after the first successful paid response. We have not yet observed the paid response shape matching the documented schema — only that it's very likely based on documentation consistency.

**Engineering Observation:**

The provider spike validated the value of feasibility-first development. Rather than completing all remaining application work before attempting an external integration, the team intentionally attacked the highest remaining uncertainty. The resulting implementation retired multiple uncertainties (browser access, authentication, CORS, provider boundary) in a single experiment and reduced the remaining question to a commercial decision about data entitlement. Working software again proved to be the fastest mechanism for producing reliable architectural knowledge.

**Meta-observation:**

This project is no longer primarily about options chain visualization. The options domain is the substrate on which a repeatable engineering methodology is being discovered and validated. The practices emerging — learning checkpoints, uncertainty burndown, documentation thresholds, feasibility-first sequencing, evidence-driven architecture — are becoming portable. The software produces features; the process produces engineering practices. Both are outputs. The practices may ultimately be the more durable contribution.

---

## Entry: First Reference Fixture — XLE from Fidelity

**Date:** 2025-07-05

**Context:** The Engineering Laboratory now contains two categories of fixture data. This entry documents the introduction of the first reference fixture and the distinction between fixture types.

---

### What happened

XLE (Energy Select Sector SPDR Fund) options chain data was manually captured from Fidelity's options chain screen on 2026-07-02 at 4:10 PM ET. The raw capture is preserved in `docs/reference-data/xle-fidelity-2026-07-02.md`. The normalized fixture lives at `src/providers/mock/data/xle.json`.

This is the project's first **reference fixture** — data observed from a real brokerage screen rather than synthetically generated.

---

### Two categories of fixture

| Category | Purpose | Modifiable | Source |
|----------|---------|------------|--------|
| **Engineering Fixtures** | Exercise specific domain behaviors (ties, edge cases, extremes) | Yes — designed and redesigned freely | `src/engineering/probeData.ts` |
| **Reference Fixtures** | Validate domain model against observed market reality | No — represents an observed snapshot | `src/providers/mock/data/xle.json` + `docs/reference-data/` |

Engineering fixtures are *behavior-designed*: each one is constructed to expose a particular property of the reasoning engine.

Reference fixtures are *provenance-preserving*: they trace back to a specific observation at a specific time from a specific source. They should not be modified to improve experiments — their value comes from faithfully representing what was actually observed.

---

### Key finding: canonical domain model represented Fidelity XLE data without modification

All fields required by `OptionContract` (type, strike, bid, ask, delta, openInterest, volume) mapped directly from the Fidelity capture. No domain type changes were required. Delta precision (4 decimal places) was preserved. Wide bid/ask spreads ($1.09 on the 51.5 Jul 10 put) are structurally valid within the model.

This validates ADR-001 (Domain First) and the provider boundary abstraction.

---

### Normalization decision: zero-market rows

Four rows in the Jul 24 expiration (strikes 51.5 and 52.5, both calls and puts) had all-zero bid/ask and zero liquidity. These were excluded from the reference fixture.

Rows with all-zero bid/ask and zero liquidity may still represent listed contracts, but they are not useful for the current income-screening workflow. The reference fixture excludes them because they violate the current bid < ask invariant and would produce meaningless premium/yield calculations.

This is a provider-boundary normalization decision, not a domain limitation. The domain model could represent a zero-bid/zero-ask contract — but the screening workflow has no use for one.

---

### Observations

- XLE weekly options have significantly lower liquidity than SPY — wider spreads, lower OI, zero intraday volume on many strikes. This is realistic for sector ETFs.
- All captured contracts had zero volume (capture was after close on a quiet day). Volume = 0 is valid and preserved.
- The distinction between engineering fixtures and reference fixtures is worth preserving in project vocabulary but not yet promoted to architecture (only one reference fixture exists).

---

### Implementation state at this entry

- XLE added to MockMarketDataProvider (4 underlyings: SPY, QQQ, IWM, XLE)
- 5 expirations, 48 calls, 48 puts (4 rows excluded as zero-market)
- 118 tests passing
- TypeScript compiles
- Build succeeds

---

## Entry: Architectural Hypothesis — Layered Decision Pipeline

**Date:** 2026-07-08

**Context:** Whiteboard discussion exploring whether "underlying recommendation" is a distinct domain problem from "contract recommendation." The discussion produced significant conceptual insights that have NOT yet been validated by implementation.

**Status: Hypothesis — not committed architecture.**

---

### Key discoveries

#### 1. Evaluation is the primitive, not recommendation

The strongest abstraction discovered:

```
Candidates + Evidence + Policy → Filter → Rank → Explain
```

"Recommendation" is a consumer of evaluation. The existing Recommendation Lab already implements this pattern — it evaluates contracts against evidence and policy — but wasn't named that way until now.

#### 2. Layered uncertainty reduction

The decision process appears to be a pipeline where each stage reduces uncertainty:

```
Conviction (investor policy)
    ↓
Eligibility (what can I trade?)
    ↓
Suitability (what fits my portfolio?)
    ↓
Opportunity (what's attractive right now?)
    ↓
Contract Evaluation (which specific contract?)
```

Each layer has different evidence, different policy, different cadence, different vocabulary.

#### 3. Conviction is not data

Four sub-problems were identified in "underlying selection":
- **Eligibility** — account/capital constraints (computable)
- **Suitability** — portfolio fit (computable from holdings)
- **Opportunity** — premium attractiveness (market-driven, temporal)
- **Conviction** — willingness to own (investor-stated, not derived)

Conviction belongs to the investor as declared policy, not computed by the system.

#### 4. Shared pattern, not shared implementation

Each layer follows the same reasoning shape (filter → rank → explain) but with completely different domain knowledge. This is a shared pattern, not a case for a generic `Evaluator<T>` framework. Avoid premature abstraction.

#### 5. Radar versus microscope

Two conceptually distinct instruments:
- **Opportunity Scanner** — broad, daily cadence, produces "today's interesting things"
- **Contract Evaluation Lab** — deep, intraday cadence, produces specific contract recommendation

These operate at different timescales and different granularities.

#### 6. Consumer before producer

Engineering strategy: rather than building upstream laboratories immediately, teach the existing Contract Evaluation Lab to consume richer evidence first (portfolio constraints, existing positions). This stabilizes interfaces before expanding architecture.

---

### What this does NOT mean

- The project is NOT becoming "a generic evaluation platform"
- The domain remains: options income decision support
- The existing Recommendation Lab is NOT invalidated — it is contextualized as one stage
- No implementation changes are required today
- The layered pipeline is a mental model, not a software specification

---

### Implications for near-term work

- The Fidelity CSV parsers are now understood as evidence providers for future evaluation
- The next valuable work is connecting Fidelity evidence (positions, open options) to the Contract Evaluation Lab
- The upstream layers (scanner, eligibility) remain future work
- Architecture and domain should remain separate concepts

---

### Terminology established

| Term | Meaning |
|------|---------|
| Evaluation | Architectural reasoning pattern (candidates + evidence + policy → ranked result) |
| Recommendation | Application feature (the highlighted contract suggestion shown to the user) |
| Evidence | Facts derived from market data, portfolio state, or Fidelity exports |
| Policy | Investor-stated preferences and rules (target delta, conviction, allocation limits) |
| Conviction | Investor belief about an underlying — not market-derived |

---

### Open questions

- Should the curated ETF universe be a first-class domain concept now?
- When should conviction/watchlist become implementable?
- Is the opportunity scanner the next instrument to build after evidence integration?
- How do different cadences (monthly conviction, daily opportunity, intraday contracts) manifest architecturally?

---

## 2026-07-03 — Opportunity Lab: First Radar Instrument

### What

Built the first working slice of **Opportunity Lab** — a "radar" instrument that scans a curated ETF universe and surfaces opportunity evidence for comparative evaluation.

### Why

The existing Recommendation Lab is a microscope (one symbol, deep). The project needed a complementary instrument that answers "where should I look next?" across the curated universe.

### What it does

- Static curated universe of 15 sector ETFs (XLE, XLF, XLV, etc.)
- Sequential evaluation using existing TradierProvider (respects cache TTL, avoids rate-limit flooding)
- Derives per-symbol: price, capital/contract, nearest expiration, call/put yield at target delta
- Simple status classification: interesting / monitor / ineligible / data_missing
- Sorted by status priority then yield descending
- Click-to-drill navigates into Recommendation Lab with selected symbol

### Architecture decisions

- No parallel fetching (sequential to respect Tradier rate limits)
- Simple threshold-based classification (no composite scoring)
- Reuses provider singleton pattern — cache survives tab navigation
- Pure derivation function (`deriveOpportunityRow`) is independently testable

### Files added

- `src/opportunity/types.ts` — OpportunityRow, CURATED_UNIVERSE, OpportunityPolicy
- `src/opportunity/evaluate.ts` — evaluateSymbol (async), deriveOpportunityRow (pure), classifyOpportunity
- `src/components/OpportunityLab.tsx` — full page component
- `tests/opportunity/evaluate.test.ts` — 15 tests for derivation logic

### Open questions resolved

- "Should the curated ETF universe be a first-class domain concept now?" → Yes, as a static constant. Dynamic discovery deferred.
- "Is the opportunity scanner the next instrument to build?" → Yes, built as Opportunity Lab.

### What this is NOT

- Not a scoring engine
- Not a layered pipeline
- Not an automated scanner with notifications
- Not a watchlist or conviction editor

It is an observation instrument. It produces evidence for the human to act on.

---

## 2026-07-03 — Domain Discovery: Multiple Evaluation Axes

### Origin

The Opportunity Lab inline explanation panel was built to answer "why does this yield look like that?"

During review, we noticed the panel is actually explaining two distinct concerns:

1. **Mechanics** — why the yield exists (IV, premium, strike, DTE, annualization)
2. **Participation** — what it costs to enter the trade (capital per contract)

These are independent. A high-yield opportunity and an accessible opportunity are not the same thing.

### The emerging question

We suspect there is a third axis forming that we cannot yet name.

It answers something like:

> "Does this opportunity fit the operating model of the overlay?"

This is distinct from:
- highest yield (mechanics)
- cheapest entry (participation)
- yield per dollar (efficiency ratio)

Factors that may eventually contribute:
- Capital commitment per position
- Desired number of concurrent positions
- Diversification constraints
- Assignment cadence
- Reserve policy
- Treasury liquidity
- Dry powder

### What we considered and rejected (for now)

We initially considered calling this concept "Deployment Efficiency" — yield normalized by capital.

After further discussion, we believe that may be premature. The question is not a ratio. It appears to be an operational fit assessment — more like "does this trade work within the constraints of how I operate?" than "which trade gives the best bang for the buck?"

The options overlay may be behaving more like an operating system than a calculator.

### Architectural hypothesis

Return and operational fit appear to be independent evaluation concerns.

If this holds, the system will eventually need to distinguish:
- Opportunity mechanics (does this yield exist?)
- Participation requirements (can I afford this?)
- Operational suitability (does this fit how I deploy capital?)

We do NOT yet know the shape of the third axis.

### Decision

- Do not introduce new metrics or scores.
- Do not modify the domain model.
- Do not create a composite "deployment efficiency" ratio.
- Preserve this as an open question.
- Let working software continue to produce evidence.

### Pattern observed

This is another instance of the project's core methodology:

```
Working software → Interaction → Observation → Domain understanding → Maybe architecture
```

The explanation panel was built to make yield less opaque. It accidentally surfaced a boundary between two evaluation concerns that were previously invisible. That boundary may become architecturally significant — but we don't yet know its shape.

### Open questions

- Is operational suitability a single axis or a composite of constraints?
- Does it emerge from the investor's policy (external) or from the strategy's mechanics (internal)?
- Will comparison mode (XLK vs XLE) clarify the shape, or does it need its own instrument?
- Is "capital quantum" (the discrete unit of participation) a useful domain concept, or just a column?

---

## 2026-07-03 — Domain Discovery: Policy as Evidence-Generating

### Origin

Observed the Opportunity Lab at two different target delta settings:

- Δ = 0.10 → 7 interesting / 8 monitor, yields 3–18%, lower capital, conservative posture
- Δ = 0.50 → 15 interesting / 0 monitor, yields 30–100%, higher capital, aggressive posture

### What we expected

The dropdown to filter results.

### What actually happened

The entire opportunity landscape changed.

Not just the numbers — the *shape* of the results. Different counts, different status distributions, different capital requirements, different ETFs becoming or losing significance.

### Key insight

The target delta dropdown is not a filter. It is an experiment.

Changing policy generates a new observation of the same market. The underlying evidence (chains, strikes, premiums) did not change. The *visible opportunity surface* changed because the policy selected different contracts.

This means:

**Policy is evidence-generating.**

### Implications

1. **Opportunity Lab is not scanning ETFs.** It is scanning *ETFs under the current policy*. The instrument shows the opportunity landscape as shaped by investor policy.

2. **Some ETFs remain attractive across policy regimes.** XLK appears near the top at both Δ = 0.10 and Δ = 0.50. That is a qualitatively different kind of "interesting" than an ETF that only appears attractive under aggressive policy. This is stability across policy — a concept we don't yet have a name for.

3. **Policy sweep is a natural next experiment.** Fix the symbol, vary the delta from 0.10 to 0.50, observe the yield response curve. This is not an options chain — it is a *policy response curve*. It shows how one underlying responds to changing investor posture.

4. **The prototype may be evolving from a market analyzer to a policy laboratory.** The market becomes the fixed environment. The thing being experimented on is the operating policy itself.

### Analogy

Topographic map. The mountains don't change. The contour interval determines what the human perceives. Policy is the contour interval.

### What this means architecturally (hypothesis, not committed)

If this insight holds, the system's primary job is not "find the best ETF."

It is: "make the consequences of policy visible."

That reframes:
- The Opportunity Lab as a **policy consequence visualizer**
- The Recommendation Lab as a **single-symbol policy executor**
- Future instruments as **policy comparators** or **policy response surfaces**

### What we are NOT doing

- Not building a policy sweep UI yet.
- Not introducing "policy stability" as a metric.
- Not creating policy-comparative displays.
- Not naming the concept of "attractiveness across regimes" yet.

### Decision

Preserve this observation. Do not act on it architecturally. Let the next working slice produce further evidence of whether this framing holds.

### Pattern

```
Working software → Policy knob interaction → Surprise observation → Domain reframing
```

The software was built to show which ETFs are interesting. It accidentally revealed that *policy itself* is the thing worth studying.

This is the third time the project has followed this exact pattern:
1. CSV import → discovered parser classification as a domain concept
2. Explanation panel → discovered Mechanics vs Participation as independent axes
3. Delta dropdown → discovered policy as evidence-generating

Each time, the software produced understanding that was not in the specification.

---

## 2026-07-03 — Methodology: Three Kinds of Knowledge

### Origin

Attempted to introduce an "Objectives" layer above Operating Model in the domain hierarchy. Applied the test: "Can the layer below be mechanically derived from this layer?" The answer was no — objectives like "smooth income" and "operational resilience" influence human judgment but do not enable deterministic computation.

This exposed a general principle that the project has been applying implicitly.

### The principle

**Do not elevate rationale into architecture until it becomes computable.**

### Three kinds of knowledge in this system

| Kind | Definition | Where it belongs | Example |
|------|-----------|-----------------|---------|
| Computable | Can be mechanically derived from inputs | Architecture / domain model | deployable capital = total × (1 - reserve) |
| Declarative | User-supplied inputs the system consumes | Configuration / policy | target delta = 0.30, total capital = $50k |
| Philosophical | Explains why the system exists; influences judgment | Documentation / journals | equilibrium, stewardship, smooth income |

### The test

When a concept feels important enough to formalize, ask:

> "What computation does the system perform using this as input?"

If the answer is clear and deterministic → it may belong in the domain model.

If the answer requires human judgment to bridge the gap → it belongs in documentation, not architecture.

### Why this matters

Prematurely formalizing philosophical concepts creates:
- Types that can't justify their fields
- Abstractions that don't derive anything
- Configuration surfaces that overwhelm users with knobs that should be derived

### Retroactive validation

This principle explains several prior decisions:

| Concept | Kind | Disposition |
|---------|------|------------|
| Dry powder | Philosophical → not yet computable | Captured in journal, not built |
| Eventing | Architectural pattern | Rejected — no computation justified it |
| Conviction | Philosophical | Captured, not formalized |
| Capital Quantum | Observation → potentially computable | Captured, pending operating model |
| Objectives layer | Philosophical | Captured in journal, not elevated to architecture |
| Operating Model | Declarative + computable | Hypothesis: inputs derive policy parameters |
| Target delta | Declarative | Implemented as policy knob |
| Annualized yield | Computable | Implemented in domain model |

### Decision

Record this as a standing methodology rule. Apply it as a gate before introducing new abstractions.

### Relationship to closed-loop engineering

This is a refinement of the project's core methodology:

```
Observation → Hypothesis → Test → Maybe architecture
```

The new refinement adds a specific test at the "Maybe architecture" gate:

```
Is it computable? → Architecture
Is it declarative? → Configuration
Is it philosophical? → Documentation
```

This prevents the common failure mode of prototype projects: reifying every insight into code.

---

## 2026-07-03 — Domain Discovery: Policy Response Signatures

### Origin

Added a "Delta Sweep" chart to the Opportunity Lab expansion panel — an inline SVG line chart showing call and put yield at 9 target delta values (0.10 through 0.50) for a single ETF, computed purely from cached chain data.

### What the graph revealed immediately

1. **The curves are not linear.** There are inflection points around Δ ≈ 0.35–0.40 where yield increases disproportionately. This means the policy-yield relationship has structure — it's not simply "more delta → proportionally more premium."

2. **Calls and puts have different shapes.** The put curve often sits above the call curve, sometimes dramatically. This raises questions about skew, current market conditions, and whether this is persistent or situational.

3. **The natural next question was overlay/comparison.** Within seconds of seeing one chart, the instinct was "show me another symbol on the same axes." That's the strongest signal that the graph is working as an instrument — it creates the next question naturally.

### Emerging concept: Policy Response Signatures

Different underlyings appear to have recognizably different policy-response shapes. This suggests that an ETF may have a characteristic "signature" — not just a single yield number, but a behavioral profile across policy space.

If this holds:
- XLK might have a steep, convex signature (highly policy-sensitive)
- TLT might have a flat, shallow signature (policy-invariant)
- XLE might sit somewhere between

These aren't just different yields. They're different *behaviors*. And that's a different kind of evidence than anything the system has surfaced before.

### What changed

The Delta Sweep crossed from "experiment" to "instrument" in a single use. The graph answered questions in seconds that the table made the user work for. The separation became:

- Graph = overview (where to look, what the shape is)
- Table = microscope (why the numbers are what they are)

Same pattern as: performance chart + profiler, stock chart + trade history.

### Relationship to earlier discoveries

| Discovery | What it revealed |
|-----------|-----------------|
| Policy as evidence-generating | Changing delta changes the landscape |
| Delta sweep | The *shape* of that change is a characteristic of the underlying |
| Policy response signatures | Underlyings may be classifiable by their policy behavior |

### What we are NOT doing yet

- Not overlaying multiple symbols on one chart (next natural experiment)
- Not classifying signatures (premature)
- Not naming signature types (steep, flat, convex — observational only)
- Not building a comparison mode

### Open questions

- Do signatures persist across different market conditions (days, weeks)?
- Does IV explain the shape, or is IV itself a consequence of the same underlying structure?
- Is the put-above-call pattern universal or ETF-specific?
- Would DTE as a second sweep axis reveal a surface rather than a curve?
- Are signatures stable enough to be a useful classification dimension?

---

## 2026-07-03 — Instrument Boundaries Emerged from Capability Density

### Context

The Opportunity Lab began as a simple market scanner — a table of ETFs with price, yield, and status.

Over multiple small iterations, independent capabilities were added:

- Sortable columns
- Inline explanation panels (yield decomposition)
- Target delta dropdown (policy control)
- Delta sweep table (policy response data)
- Delta sweep chart (visual policy response)
- Sparklines (behavioral signature at a glance)
- Multi-row expansion (comparison)

None of these individually attempted to redefine the workflow. Each was a small, reversible experiment. No architectural commitments were made.

### What happened

Collectively, these capabilities changed the user's cognitive process.

The original workflow:

```
Options Chain → Recommendation Lab
```

The workflow that naturally emerged:

```
Opportunity Lab → Contract Workbench (current Recommendation Lab)
```

The user now arrives at Recommendation Lab having already:
- Selected the underlying
- Understood why it's interesting
- Observed its policy-response behavior
- Compared it against alternatives

The decision "which underlying?" is complete before leaving Opportunity Lab.

### The discovery

The important observation is NOT the workflow itself.

The discovery is that **workflow boundaries emerged organically as capability density increased**.

No one designed "Opportunity Lab should be the analysis instrument and Recommendation Lab should be the execution instrument." That separation became obvious only after enough small capabilities accumulated in one place.

### Architectural principle

**"Capabilities reveal composition."**

Rather than designing instruments top-down, small independent capabilities accumulated until natural instrument boundaries became self-evident. The system told us where the boundaries were — we didn't impose them.

This is consistent with the project's methodology: working software reveals structure; premature architecture obscures it.

### Recommendation Lab's evolving purpose

Recommendation Lab is no longer where analysis begins. The user reaches it after selection.

Its purpose is shifting from:

> "Help me analyze this underlying."

toward:

> "Help me execute this opportunity well."

Potential future execution concerns (examples, not requirements):
- Liquidity quality
- Bid/ask spread quality
- Strike neighborhood exploration
- Assignment consequences
- Rolling mechanics
- Position sizing relative to operating model

### Emerging hypothesis: reasoning across time

Policy sweeps observe how an opportunity responds to changing policy at a single point in time.

Interaction history (not yet built) would observe how the user's reasoning evolves across time.

These may eventually be different manifestations of a broader concept:

> Reasoning across dimensions (policy space, time, comparison, lifecycle)

This is speculative. Do not formalize. Capture only as a hypothesis for future observation.

### Methodology note

This entry is evidence for the "Three Kinds of Knowledge" principle recorded earlier:

- The workflow boundary is now **computable** (Opportunity Lab handles analysis, Recommendation Lab handles execution)
- The "reasoning across time" concept remains **philosophical** (no known computation)
- The operating model characteristics remain **declarative** (user-stated, not yet derived)

Each sits at the correct level. The system is not prematurely elevating philosophical ideas into architecture.

### Pattern

```
Small capabilities → Capability density → Emergent boundaries → Instrument specialization
```

This is the fourth instance of working software revealing structure:
1. CSV import → parser classification
2. Explanation panel → Mechanics vs Participation axes
3. Delta dropdown → policy as evidence-generating
4. Capability accumulation → instrument boundary discovery

---

## 2026-07-04 — Guardrail: History Refines Operation, Not Prophecy

### Context

As discussion evolves toward historical evidence, pattern recognition, and eventual machine-assisted learning, it becomes necessary to explicitly articulate a boundary that was implicit in the project charter but insufficiently nuanced for the system's current maturity.

The charter states: "Policy over prediction" and excludes "Prediction models."

That was sufficient for the early prototype. It is no longer sufficient as the system approaches questions about history, patterns, and learning.

### The boundary

The project never set out to build a better predictor of future market prices.

It set out to build a better options overlay.

Historical evidence, autonomous observation, pattern recognition, and eventual machine-assisted learning must remain subordinate to that purpose.

### The distinction

A future-prediction system asks:

- Where will this ETF trade next week?
- Will price rise or fall?
- What return will the underlying produce?

The options overlay asks:

- Should capital be deployed now?
- Which underlying fits the overlay's current operating posture?
- Which contract best expresses the current policy?
- What assignment, expiration, or liquidity consequences follow?
- Is this opportunity historically unusual?
- How have similar contracts and response signatures actually resolved?
- Would waiting preserve useful optionality?
- Did prior decisions improve the behavior of the overlay as a whole?

The project may use historical and statistical methods. Its objective is improved operation under uncertainty — not elimination of uncertainty through prediction.

### Principle

**History should refine operation, not prophecy.**

### Aligned uses of historical evidence

- Empirical assignment frequency by delta and DTE
- Quoted versus realized premium
- Fill quality and spread behavior
- Duration of capital commitment
- Policy performance across market regimes
- Recurring response-signature patterns
- Confidence and evidence-coverage indicators
- Identification of attractive-looking patterns that historically disappointed
- Evaluation of deliberate inaction or delayed deployment
- Overall overlay cadence, diversification, and resilience

### Unit of evaluation

A profitable individual contract is not automatically a good overlay decision.

A decision may produce profit while still being operationally poor if it:

- Consumes an oversized capital quantum
- Creates concentration
- Disrupts expiration cadence
- Eliminates useful dry powder
- Prevents a more suitable deployment
- Produces undesirable assignment consequences

The eventual learning system should therefore evaluate both:

1. Contract outcomes (did this specific position resolve well?)
2. Overlay-level operating outcomes (did this decision improve the system's overall behavior?)

### Guardrail for machine learning

Any future model should be justified by the overlay decision it improves.

Aligned output examples:

- "Similar configurations historically had poor realized fills despite high quoted yields."
- "This response signature has usually remained attractive for several observations, so waiting may preserve optionality."
- "At this delta and DTE, assignment frequency was materially different from the delta approximation."
- "This policy produced smoother capital turnover across prior cycles."

Misaligned output example:

- "The ETF is predicted to rise 1.7% next week."

This may be technically possible but is not inherently aligned with the project's purpose. It risks turning the system into a directional market-prediction product.

### Relationship to existing principles

| Charter principle | This refinement |
|------------------|-----------------|
| "Policy over prediction" | Clarifies: history serves policy evaluation, not price forecasting |
| "Not a trading bot" | Extends: not a prediction engine either |
| "Observability over automation" | Consistent: historical evidence is shown, not hidden behind models |
| "Three Kinds of Knowledge" | Historical pattern recognition may be computable (assignment frequency) or philosophical (regime similarity) — apply the test |

### Decision

Treat this as a standing scope and methodology guardrail. Future capabilities involving history, patterns, or learning must demonstrate alignment with overlay operation before implementation.

Do not select machine-learning methods. Do not change architecture. This is a boundary, not a plan.

---

## 2026-07-04 — Architectural Learning: Overlays, Institutional State, and Decision Behavior

### Origin

A multi-part design discussion examined whether the current Recommendation Lab still represents the correct abstraction. The discussion evolved through several successive refinements driven by the project's methodology: observe working software, then refine understanding.

### Key realizations

#### 1. The unit of evaluation is the options overlay, not the ETF.

We are not evaluating XLK. We are evaluating "a cash-secured put overlay on XLK at delta 0.40 with 2-week expiration cycles." The ETF is the substrate. The overlay is the mechanism. The policy shapes the mechanism. The institution decides whether the mechanism fits.

This explains why the same ETF can be "interesting" as a covered call and "uninteresting" as a CSP — they are different overlays on the same substrate.

#### 2. The ingress ladder remains the institutional rationale. Computable constraints derived from it may gradually become institutional state.

The ingress ladder (Cash → Treasury → Options Overlay → Additional Cash Flow → Debt Reduction → Optionality → Independence) explains *why* the overlay exists. The ladder itself is not something the software computes — but it guides the evolution of the domain model by indicating which constraints eventually become relevant.

#### 3. The next laboratory instrument should make decision behavior observable. Decision criteria should emerge from repeated observation rather than upfront design.

We initially discussed enumerating "decision criteria" for a Decision Lab. On reflection, criteria are outputs of observation, not inputs to design. The DTE ladder was never designed — it emerged from interacting with an instrument that exposed it. Likewise, future criteria (sector concentration, assignment cadence, capital allocation) should emerge from observing actual decision behavior, not from brainstorming.

#### 4. Institutional state should emerge incrementally as facts prove computationally consequential.

"Institutional state" is better than "institution model." A model implies known shape. State implies accumulating facts as they prove necessary. Each piece earns its place by being observably consequential — not theoretically important.

#### 5. Available deployable cash is the first identified piece of institutional state.

It passes the computability test:
- User-supplied (declarative)
- Computationally meaningful (gates opportunity eligibility)
- Dynamically changing (each deployment reduces available capital)
- Participates in a closed feedback loop (capital → opportunity → decision → capital)

It is the first institutional fact that is simultaneously declarative, constraining, and reactive.

#### 6. The project methodology remains unchanged: build instruments, observe behavior, discover abstractions, then evolve the domain model.

Rather than asking "What is the institution model?" the better question is "What software helps us discover the institution model?" This is consistent with every prior architectural discovery in the project.

### Meta-observation

**The architecture has not been evolving through redesign. It has been evolving through successive refinement driven by interaction with working software.**

This is a subtle but powerful distinction. The project is not replacing ideas with new ones. It is allowing the software to reveal a more accurate decomposition of the problem over time.

Every major shift fits this pattern:
- Contract selection → overlay evaluation (revealed by Opportunity Lab policy controls)
- Static yields → policy response signatures (revealed by delta sweep)
- DTE as a filter → DTE as a ladder rung (revealed by DTE dropdown interaction)
- Institution as a model → institutional state as emergent facts (revealed by this discussion)

The principle: **architecture evolves through observation, not through redesign.**

### Practical implications

| Current state | Direction |
|--------------|-----------|
| Recommendation Lab | Evolve toward contract workbench (execution quality, not selection) |
| Opportunity Lab | Continue as the primary analytical instrument |
| Decision Lab (proposed) | Do not build yet — let decision behavior become observable first |
| Institution model | Do not design — allow institutional state to emerge from use |
| Available cash | First candidate for institutional state; smallest useful experiment |
| Sample portfolio fixtures | Useful for exercising different institutional contexts without UI |

### What we are NOT doing

- Not redesigning the architecture
- Not retiring the Recommendation Lab
- Not building a Decision Lab
- Not modeling the institution
- Not enumerating decision criteria
- Not formalizing the ingress ladder as architecture

### What we ARE doing

- Preserving the understanding
- Continuing to build small, reversible instruments
- Allowing the domain model to emerge from interaction
- Applying the computability test before formalizing any concept
- Recognizing that the project is converging on overlay operations rather than market analysis

---

## 2026-07-04 — Architectural Vision: Document-Driven Scenario Replay

### Context

After discovering that the Opportunity Lab is evaluating options overlays (not ETFs) and that institutional state should emerge incrementally from use, we identified the next laboratory instrument.

### Core insight

Portfolio state should be a **projection derived from an ordered activity history**, not a manually-authored fixture.

The primary way the institution tells the software that something changed is by loading brokerage activity CSVs. Therefore, the laboratory should exercise that same ingress boundary.

### The causal chain

```
Activity Documents
        ↓
Document Classification
        ↓
Row Parsing
        ↓
Canonical Activity Events
        ↓
Derived Portfolio State
        ↓
Changed Overlay Possibilities
        ↓
New Decision Required
```

### Scenario chains

The primary engineering fixture becomes an ordered chain of cumulative activity documents. Each file contains prior history plus one new event.

```
01-bootstrap.csv        → $100k cash, no holdings
02-put-written.csv      → CSP opened, cash committed
03-put-assigned.csv     → shares acquired, cash consumed
04-call-written.csv     → covered call opened, shares committed
05-call-expired.csv     → shares released, premium retained
```

This tests transition behavior, not just final-state projection.

### Two ingestion modes (future)

- **Cumulative:** each CSV contains full history plus new entries (tests idempotent reconstruction)
- **Incremental:** each CSV contains only new activity (tests append behavior)

First slice uses cumulative only.

### Reconciliation (future)

Position documents may serve as checkpoints against activity-derived state. Disagreements are evidence, not errors.

### Architectural boundary

The same pipeline used for bundled scenarios should eventually support user-uploaded activity CSVs. Scenarios are controlled inputs exercising the production ingress path.

### What we are building first

One thin vertical slice:
- One scenario, 5 steps, one symbol (XLU)
- Hand-authored Fidelity-shaped fixtures
- Activity parser → canonical events
- State projector → portfolio state
- Simple replay page: step forward, observe state transitions
- Basic overlay implications (deployable cash, committed capital, CC/CSP feasibility)

### What we are NOT building yet

- 30 scenarios
- Reconciliation engine
- Branching timelines
- Generalized manifest schema
- Universal event model
- Full recommendation integration
- Incremental ingestion mode

### Success criterion

Working software in which the user can click through a short activity history and visibly watch documentary evidence produce events, state transitions, and new overlay possibilities.

### Relationship to methodology

This continues the pattern: build the instrument, observe behavior, discover what the second scenario needs to be. The institution model emerges from interaction, not from design.

---

## 2026-07-04 — First Observations from Scenario Replay Instrument

### Context

First interaction with the working Scenario Replay page. Single scenario (bootstrap-wheel, 5 steps, XLU). These are the observations that emerged from use.

### What the page feels like

It does not feel like a portfolio viewer. It feels like a replay instrument. The natural question is not "what is my portfolio?" but "what did this new document change?" That reframing happened immediately on first use.

### State transitions are more interesting than static state

The current portfolio state matters less than the transition itself. The natural questions:
- What changed?
- Why did it change?
- What new decisions became possible?
- Which previous decisions are no longer possible?

The instrument is shifting toward studying **state transitions** rather than static state.

### Feasibility wants explanations

The simple "Available / Unavailable" feasibility indicators are useful but immediately create a "why?" question. The interesting content is not the boolean status — it's the reason:
- "No callable shares currently exist"
- "Deployable cash below minimum contract size"
- "All shares committed to open calls"

### The next decision is more interesting than the current state

At "Put Assigned," the instinct is not to inspect holdings. It's to ask: what decision became possible? Covered call now possible. Additional CSP may not fit. Cash allocation changed. This is another instance of decision behavior becoming the object of study.

### Timeline vs. steps

The step buttons already communicate chronology. The page wants to be a temporal instrument, not a step-by-step wizard. Steps are implementation; time is the concept.

### One scenario is correct

Its purpose is not coverage. Its purpose is to teach us what the second scenario should be.

### Emerging concept: State Transition Laboratory

"Replay" describes what the page does. "State Transition" describes what we are studying. The scientific question the instrument is beginning to answer:

> How does documentary evidence change institutional state and therefore change available decisions?

### What this means

The instrument is already producing observations after one use. That validates the methodology: build the smallest thing, observe, learn. The page should not be redesigned yet. It should be used, and additional observations should emerge naturally — exactly as they did with the Opportunity Lab through sorting, expansion panels, delta sweeps, and sparklines.

### Pattern

This is the fifth instance of the core loop:
1. CSV import → parser classification
2. Explanation panel → Mechanics vs Participation
3. Delta dropdown → policy as evidence-generating
4. Capability accumulation → instrument boundaries
5. Scenario replay → state transitions as the object of study

Each time, the software revealed what to study next before anyone designed it.

---

## 2026-07-10 — Architectural Discovery: Three Projections of the Institution

### Origin

Exported real data from the Personal Treasury account (Fidelity). Three CSV files were produced: Activity History, Positions, and Balances. Examining them together revealed that they are not redundant reports — they are three distinct projections of the same institution.

### The three questions

| Document | Question it answers | Nature |
|----------|-------------------|--------|
| Activity History | Why did the institution become what it is? | Causal history |
| Positions | What does the institution currently own? | Snapshot projection |
| Balances | What is the institution currently capable of doing? | Operational capacity |

### Key discovery: Balances reveals operational cash distinctions

Fidelity already distinguishes multiple forms of cash:
- Available to Trade
- Settled Cash
- Available to Withdraw

These are not interchangeable. They affect overlay decisions differently. Our current "Available Cash" abstraction is already too coarse.

The architecture should not prematurely collapse these into one number. They should emerge as separate pieces of institutional state because the production system already models them separately.

### Architectural implication

```
Activity CSV (authoritative causal history)
        │
        ▼
Canonical Events
        │
        ▼
Institutional State Projection
        │               │
        ▼               ▼
Positions View    Balances View
        │               │
        └───────┬───────┘
                ▼
       Overlay Evaluation
```

The Activity CSV is the authoritative source. Positions and Balances are independent projections derivable from the same event history.

### Validation strategy (future)

This creates a powerful reconciliation approach:
1. Replay activity history → project holdings → compare against Positions CSV
2. Replay activity history → project balances → compare against Balances CSV

If both projections reconcile with Fidelity's exports, the complete causal chain (event interpretation + state projection) is validated. This is much stronger than testing individual parsers.

### Real account observations from the export

The Personal Treasury account reveals:
- 400 shares XLE (acquired through two separate put assignments at different strikes)
- 74.829 shares SPYI (income ETF)
- 2 open XLE puts (Jul 17 $57, Jul 24 $53)
- 4 open XLE calls (Jul 31 $55 ×2, Aug 7 $54.5 ×2)
- ~$24,390 money market (SPAXX)
- ~$33,000 pending activity (EFT received)
- Treasury belt: 20+ T-bills maturing weekly through December 2026
- Multiple operational cash states (Available to Trade $32,690 vs Settled $7,690)

This is a real overlay operation in progress — puts assigned, covered calls written against assigned shares, treasury belt providing cash flow, staggered maturities.

### Methodology note

This architecture was not invented. It emerged from examining how Fidelity itself organizes the same information. The production system already separates these three concerns. The project is converging toward the real domain structure rather than imposing an artificial one.

### What we are NOT doing

- Not building a Balances parser yet
- Not building a reconciliation engine yet
- Not collapsing the three projections into one model
- Not expanding the Scenario Replay page yet

### What this means for next steps

- The existing Scenario Replay exercises the Activity → Events → State path correctly
- Positions CSV becomes a future checkpoint/reconciliation document (as already hypothesized)
- Balances CSV introduces a new projection (operational capacity) that the system should eventually understand
- The distinction between "what you own" and "what you can do" is architecturally real and should be preserved

---

## 2026-07-10 — Discovery: Brokerage Policy Mediates Operational Capability

### Origin

Attempted to write a cash-secured put after initiating a $33,000 EFT. Account showed $32,690 Available to Trade and $33,000 pending. Inferred ~$65,000 buying power. Fidelity rejected the order:

> "The Estimated Order Value exceeds your Cash Available to Trade."

The pending deposit was explicitly excluded from satisfying the collateral requirement.

### What this reveals

Institutional cash alone does not determine capability. Brokerage policy mediates capability.

The effective progression:

```
Institutional State (what the institution possesses)
        ↓
Brokerage Rules (what the brokerage permits)
        ↓
Operational Capability (what is actually possible)
        ↓
Decision
```

### Refinement of the capability model

The concept of "available cash" is insufficient. Operational capability depends on multiple brokerage-specific states:

| Cash state | Amount | CSP-eligible? |
|-----------|--------|---------------|
| Settled cash | $7,690 | Yes |
| Available to Trade | $32,690 | Yes |
| Pending EFT (unsettled) | $33,000 | No |
| Total account cash | ~$57,390 | Partially |

The same dollar amount has different operational capability depending on its settlement status and the brokerage's collateral policy.

### Implications for the system

1. The system cannot simply project "deployable cash" from activity history alone. It must account for settlement timing and brokerage rules.

2. "Can I write this CSP?" is not answerable from cash balance alone. It requires knowing the collateral-eligible subset of cash.

3. This is another layer between institutional state and operational capability that the domain was previously treating as transparent.

4. The Balances CSV already distinguishes these states ("Available to Trade" vs "Settled Cash" vs "Available to Withdraw") — Fidelity is explicitly modeling this. Our system should eventually respect the same distinctions rather than collapsing them.

### Relationship to prior discoveries

| Discovery | What it revealed |
|-----------|-----------------|
| Three CSV projections | Positions ≠ Balances ≠ Activity |
| This observation | Even within Balances, multiple capability states exist |
| "Available Cash" as institutional state | Now known to be an oversimplification |

### Computability assessment

- **Settlement timing**: potentially computable (T+1 for equities, T+1 for options, EFT hold periods are policy-based)
- **Brokerage collateral rules**: declarative (must be stated as constraints, not derived from first principles)
- **Whether a specific order will be accepted**: only verifiable by the brokerage itself

The system can *approximate* operational capability but cannot authoritatively determine it. The brokerage is the final arbiter.

### What we are NOT doing

- Not building a settlement tracking engine
- Not modeling all Fidelity brokerage rules
- Not changing the current state projector
- Not pretending the system can replace the brokerage's own validation

### What this means

The laboratory should eventually distinguish:

1. **Projected capability** — what the system believes is possible based on its model
2. **Actual capability** — what the brokerage will actually permit

Disagreement between them is evidence (of missing rules, settlement timing, or policy gaps) — not a bug.

### Methodology note

This was discovered through attempting a real production operation, not through design analysis. The brokerage's rejection message was the evidence. Once again, interaction with production systems revealed domain structure that would have been difficult to anticipate from first principles.

---

## 2026-07-13 — Domain Discovery: Universe Management as a Bounded Context

### Origin

The project has been operating with a hand-curated list of 15 ETFs since the Opportunity Lab was built. That list was explicitly described as "good enough" at the time.

Through continued use of the Opportunity Lab, several observations made the curated list increasingly indefensible:

- XLU surfaced as an unexpectedly strong opportunity only because it happened to be included. What else was being missed?
- SPY demonstrated that excellent options markets can still be institutionally unsuitable (capital quantum).
- We repeatedly asked whether lower-priced ETFs outside the current list could offer acceptable liquidity and premium.
- The DTE ladder and delta sweep experiments revealed that ETF suitability is contextual to policy — not an inherent property.
- The discussion of API Ninjas plus Tradier arose because discovery requires fundamentally different data and cadence from contract evaluation.

The question shifted from "should we acknowledge this?" to "how small should the first computable slice be?"

### What emerged

Universe Management is a distinct bounded context containing three separable concepts:

1. **Discovery** — find candidates from the broader ETF universe (deferred — requires crawler, separate data sources, different cadence)
2. **Admission (Velvet Rope)** — evaluate candidates against an explicit, versioned policy using current market evidence
3. **Registry** — store members, their evaluation history, and the institutional decision audit

### Key domain learnings

**Admission is contextual, not inherent.**
An ETF does not "pass" or "fail" in absolute terms. It passes or fails relative to a specific policy, measured against specific evidence, at a specific point in time. This means admission decisions must capture the complete policy and evidence context to remain historically meaningful.

**Rejected ETFs are institutional memory.**
A rejected symbol is not garbage to be discarded. It is evidence: "under this policy, with this evidence, on this date, XYZ did not qualify because..." That history has value for understanding how the universe evolves and how policy changes affect the institutional boundary.

**Discovery and admission have fundamentally different cadences.**
Discovery is slow (days/weeks, crawling thousands of symbols). Admission is fast (seconds, evaluating a known registry against current market data). They should not be coupled in implementation.

**Bootstrapped ≠ admitted.**
The existing curated universe predates the Velvet Rope. "Bootstrapped" describes provenance (how a symbol entered the registry). It must not function as a permanent override of policy evaluation. Bootstrapped members should begin as unevaluated and earn their admission through the same policy evaluation as any other member.

**Provider failure ≠ rejection.**
If the system cannot reach the data provider, that is an infrastructure event — not an admission decision. Failed attempts must be recorded in the audit but must never overwrite the latest successful policy evaluation.

**Volume is unstable single-observation evidence.**
Daily option volume is strongly affected by time of day and may be zero early in the session for healthy markets. It should be recorded (observational) but not contribute to admission decisions until repeated observations demonstrate stability.

### Architectural decisions

- The first slice is **observational** — it operates in parallel with the legacy curated universe and does not yet govern Opportunity Lab
- The Velvet Rope uses the same `findClosestToDelta` contract selection logic as Opportunity Lab (no conflicting interpretation of target delta)
- The Velvet Rope's delta range is intentionally broader (0.15–0.50) because it asks "is this market viable?" not "which exact contract should I trade?"
- localStorage persistence is transitional — the domain model is storage-agnostic
- Audit records are append-only and never capped — rejected ETFs and failed attempts remain visible indefinitely
- Automated broad-universe discovery is a separate future workstream
- Cloud/multi-user persistence is a separate future workstream

### Documentation produced

- `docs/velvet-rope/00-domain-model.md` — corrected final domain model
- `docs/velvet-rope/01-requirements.md` — 21 formal requirements (VR-1 through VR-21)
- `docs/velvet-rope/02-design.md` — module structure, evaluation pipeline, persistence, page architecture

### Relationship to prior methodology

This follows the project's established pattern:

```
Instrument use → Observed limitation → Domain concept emerges → Model before implement
```

Specifically:
- Opportunity Lab's curated list was useful but produced the question "what are we missing?"
- Delta sweeps and DTE ladder experiments revealed that suitability is policy-contextual
- The Scenario Replay instrument showed that institutional state changes through evidence
- The Velvet Rope applies the same principle: the institutional universe changes through evidence (market data) evaluated against policy

### What we are NOT doing

- Not building a crawler yet
- Not cutting over Opportunity Lab yet
- Not building cloud persistence yet
- Not modeling Watch/Suspended/Revoked lifecycle yet
- Not implementing rolling averages or temporal observation patterns
- Not coupling this to the cloud/multi-user workstream

### Open questions for future observation

- Will sandbox data quality allow meaningful admission decisions, or will most criteria produce "insufficient_evidence"?
- Does the Velvet Rope effective universe actually differ from the curated list in useful ways?
- Which rejected symbols become interesting "near misses" worth watching?
- When does volume become stable enough to promote from observational to soft?
- What triggers the eventual cutover from legacy_curated to velvet_rope?

---

## 2026-07-13 — Engineering Spike: API Ninjas ETF Catalog Provider

### Why this was prioritized before Velvet Rope implementation

The Velvet Rope design assumes an ETF catalog exists. Before building admission logic that depends on catalog data, we needed to retire the integration risk: does API Ninjas actually work, what does it provide, and what does it cost?

Principle: **retire data-integration risk before building dependent automation.**

### What we learned

1. **Authentication works.** The free-tier key successfully authenticates.

2. **The free tier is severely limited for our use case.** Only single-ticker lookup is available. Premium fields (price, AUM, expense ratio, holdings) return placeholder strings instead of values.

3. **Universe enumeration and search require a paid subscription** (Business/Professional/Annual — estimated $20-50/month). These are the endpoints needed for Discovery.

4. **Critical fields are missing at any tier:** category/sector, issuer, leveraged/inverse flags, options availability, share volume. Leveraged/inverse can be inferred from names but not authoritatively.

5. **No rate-limit feedback.** Unlike Tradier, API Ninjas doesn't return rate-limit headers. Quota enforcement is opaque.

6. **CORS is permissive** (`allow-origin: *`) — browser calls work without a proxy.

7. **Response time is ~1 second** per call — full enumeration of thousands of ETFs would require significant crawl time.

### Suitability verdict

- **For Velvet Rope first slice:** Not needed. The first slice evaluates a known 16-symbol registry using Tradier market data.
- **For future Discovery Engine:** Conditionally viable. Requires paid tier. Would provide the enumeration capability but lacks options-availability data (must cross-reference with Tradier).
- **For immediate prototype use:** Minimally useful. Tradier already provides everything needed for the current workflow.

### Decision

Proceed with Velvet Rope implementation using Tradier as the sole data source. API Ninjas subscription upgrade deferred until Discovery workstream begins. The spike has quantified the cost, capability, and limitations — no remaining unknowns.

### Documentation

Full findings in `docs/engineering-spikes/api-ninjas-etf-catalog.md`.

---

## 2026-07-13 — Architectural Refinement: Discovery Consumes Reference Data

### Origin

While researching ETF catalog providers (API Ninjas, Finnhub, FMP, SEC, ETFdb), we noticed that the original model of "Discovery finds ETFs" was incomplete.

### Original model

```
API Provider → Discovery → Velvet Rope
```

### Refined model

```
Reference Data Sources → Canonical ETF Catalog → Discovery → Velvet Rope → Opportunity Lab
```

### Key insight

Discovery is a **consumer** of canonical ETF reference data, not the **owner** of ETF identity.

ETF identity (symbol, name, ISIN, exchange, product type) is reference data that:
- Changes slowly (months/years)
- Comes from authoritative sources (SEC, exchanges)
- Should not be conflated with the faster-moving concerns of Discovery, admission, or evaluation

### Different providers serve different roles

- **SEC** answers: "What securities exist?"
- **API Ninjas / FMP** answer: "What ETF metadata can we obtain programmatically?"
- **Tradier** answers: "Does this ETF have listed options?"
- **ETFdb / Yahoo** answer: "Human validation and completeness benchmark"

No single provider replaces the others. The architecture should be multi-source.

### Lifecycle separation observed

| Concern | Lifecycle |
|---------|-----------|
| Reference Data | Months/years |
| Discovery | Days/weeks |
| Velvet Rope | Minutes/hours |
| Opportunity Lab | Seconds/minutes |

These are fundamentally different cadences. The architecture should preserve these distinctions without prematurely formalizing them into separate bounded contexts.

### Emerging question: is Reference Data a bounded context?

Possibly. But per project methodology, do not introduce a new bounded context until working software demonstrates the need. For now, document the conceptual distinction and let Discovery consume reference data directly.

### Decision

- Document this refinement in `docs/discovery/00-design-notes.md`
- Do not introduce a Reference Data bounded context yet
- Do not implement Discovery yet
- Proceed with Velvet Rope first slice (which uses Tradier market data against a known registry)
- When Discovery workstream begins, architect it as a catalog consumer, not a catalog owner

### Relationship to prior learning

This follows the same pattern observed throughout the project: the architecture evolves through successive refinement driven by research and interaction, not through upfront design. Each investigation (API Ninjas spike, provider research) reveals a more accurate decomposition.

---

## 2026-07-13 — Velvet Rope Thin Slice: Single-Symbol Evaluation Instrument

### What was built

The smallest working vertical slice of the Velvet Rope: a single-symbol evaluation page that evaluates one ETF against a fixed admission policy, records immutable audit records, and explains the result with full evidence breakdown.

### Files produced

- `src/velvet-rope/types.ts` — domain types (audit record, policy, evidence, criteria)
- `src/velvet-rope/policy.ts` — fixed default admission policy (v1)
- `src/velvet-rope/evaluate.ts` — full evaluation pipeline (expiration → contract selection → criteria → aggregation)
- `src/velvet-rope/aggregate.ts` — outcome determination with precedence rules
- `src/velvet-rope/persistence.ts` — storage-agnostic interface + localStorage implementation + audit queries
- `src/components/VelvetRopePage.tsx` — single-symbol page with policy summary, evaluation, evidence display, and audit history
- `tests/velvet-rope/evaluate.test.ts` — 20 tests (pipeline steps, failure modes, near-miss, SPY capital rejection)
- `tests/velvet-rope/aggregate.test.ts` — 11 tests (all outcome paths, precedence rules)

### What the instrument can do

1. Enter any symbol, click Evaluate
2. See the complete evaluation: expiration selected, call and put contracts found, per-side criteria assessed, capital evaluated
3. Understand exactly why the symbol was admitted, rejected, or inconclusive
4. See evidence provenance (cache vs network, delayed data, retrieval time)
5. Reload the page — immutable audit history persists
6. Re-evaluate — new audit record appended, never overwritten
7. Provider failures create failed-attempt records without replacing successful evaluations

### VR tasks partially satisfied

This thin slice partially satisfies VR-T01 through VR-T10 from the full task plan:
- VR-T01 (types): done
- VR-T02 (policy): done (fixed, not editable)
- VR-T03 (expiration selection): done
- VR-T04 (contract selection): done
- VR-T05 (per-side criteria): done
- VR-T06 (cross-side + aggregation): done
- VR-T07 (full pipeline): done (single symbol only)
- VR-T08 (registry): NOT done (no multi-symbol registry yet)
- VR-T09 (audit operations): done (append, query)
- VR-T10 (persistence): done (localStorage)
- VR-T11 (full page): partial (single symbol, not full registry)
- VR-T12 (wire into App): done
- VR-T13 (verification): done (369 tests, clean build)

### What remains for the full first slice

- Multi-symbol registry with batch evaluation
- Universe comparison (legacy vs velvet rope)
- Operator overrides
- Stale-evaluation detection
- Full audit view with filters
- Policy staleness warnings

### What the working software already teaches

The instrument is ready for interaction. The next step is to evaluate several symbols (XLK, SPY, XLE, IWM, etc.) against live Tradier data and observe whether the admission model produces credible, explainable decisions. Observations from that interaction will guide the next expansion.

---

## 2026-07-13 — First Velvet Rope Interaction: Measurement vs. Policy

### What happened

Evaluated XLK against the default admission policy. Expected outcome: admit (XLK is a major sector ETF with active options). Actual outcome: **reject**.

### Why it was rejected

- Call OI: 29 (threshold: 50) — hard fail
- Call spread: 30.7% (threshold: 15%) — hard fail
- Put spread: 17.6% (threshold: 15%) — hard fail

### Why this is surprising

XLK is generally considered to have a healthy, liquid options market. The rejection doesn't match intuition.

### What this reveals

The evaluation selected one specific contract at the target delta:

```
Strike: $196
Delta: 0.293
OI: 29
Bid: $2.79 / Ask: $3.80
```

This may simply be an unlucky strike. One strike over might have OI = 250 and a tighter spread. The admission decision is currently evaluating **one contract**, not a **neighborhood**.

### Questions surfaced

1. Should market quality be measured at a single target-delta contract, or across a strike neighborhood?
2. Should spread be relative to mid (current), relative to bid, in absolute dollars, or averaged?
3. Is the OI threshold (50) appropriate, or is this a measurement problem rather than a threshold problem?
4. Would evaluating 3–5 contracts around the target delta give a more representative picture of market quality?

### Decision

Do not change the policy or measurement yet. Evaluate 10–20 more ETFs first. If several ETFs that are intuitively excellent options underlyings fail for the same single-contract reasons, that's evidence that the measurement method needs refinement — not the thresholds.

### Observations about the instrument itself

The instrument is working exactly as intended:
- It produced a concrete, inspectable decision
- The decision challenged our assumptions
- The evidence is preserved in the audit trail
- The question it raised ("measurement vs. policy?") is the right next question to investigate

### UI improvement candidates (observed, not implemented)

1. **Interpretation sentence** — "XLK failed because the selected 0.30-delta contracts did not satisfy market-quality policy despite acceptable capital and yield."
2. **Color-coded criteria** — immediate visual distinction between pass (green), near-miss (yellow), hard fail (red)
3. **Policy beside measurement** — show threshold alongside measured value explicitly
4. **Diagnostic framing** — present rejection as a diagnosis (primary reason + contributing factors) rather than a flat list

### Pattern

This is the sixth instance of working software revealing the next question:
1. CSV import → parser classification
2. Explanation panel → Mechanics vs Participation
3. Delta dropdown → policy as evidence-generating
4. Capability accumulation → instrument boundaries
5. Scenario replay → state transitions as object of study
6. Velvet Rope → measurement method as the real question (not thresholds)

---

## 2026-07-13 — Methodology Refinement: Experimental Evidence Before Algorithm Change

### Discovery

The first Velvet Rope evaluation immediately revealed that the project is no longer primarily asking "what are the correct thresholds?" It is asking **"what is the correct way to measure options market quality?"**

This is a fundamental shift. Thresholds are parameters. Measurement methodology is architecture.

### Experiment 001: Single-Contract Market Quality

| Field | Value |
|-------|-------|
| Hypothesis | A single target-delta contract adequately represents the market quality of an ETF |
| Method | Evaluate one selected contract nearest the target delta (0.30) for OI, spread, yield |
| Observation | XLK rejected despite being widely considered a liquid ETF. Selected call ($196, Δ=0.293) had OI=29, spread=30.7%. Adjacent strikes likely much better. |
| Question | Does one selected contract adequately represent market quality? |
| Status | **Unresolved — continue collecting evidence** |
| Next step | Evaluate 10–20 representative ETFs, record patterns |

### Principle established

**Do not change the measurement algorithm until patterns emerge from multiple evaluations.**

If multiple well-known liquid ETFs fail for the same single-contract reason, then the measurement methodology is wrong — not necessarily the thresholds.

If only XLK fails and others pass, then it may be a genuine edge case (unlucky strike selection on that specific day/time).

### Audit as experimental evidence

The immutable audit trail has acquired a second purpose. Originally it was institutional memory ("when was this symbol admitted?"). Now it is also experimental evidence ("under this measurement method, what happened?").

Future policy revisions become comparable:
- Policy v1 (single contract): XLK rejected
- Policy v2 (neighborhood measurement): XLK admitted

This is not simply a software change. It is an improvement to the scientific measurement methodology.

### Operator experience discovery

The current page presents engineering evidence before operator understanding. The operator's question is: "Can I trust this ETF for my income strategy?" The software should answer that question first, then provide supporting evidence through progressive disclosure.

This reveals a missing conceptual layer:

```
Outcome → Diagnostic Summary → Supporting Evidence → Raw Measurements
```

Instead of:

```
Outcome → Raw Measurements
```

The diagnostic summary is deterministic synthesis (not AI prose) — it interprets already-known criteria results into operator-facing language.

### What this means for the architecture

A new value object emerges: **EvaluationNarrative** — distinct from CriterionResult. CriterionResult is factual evidence. EvaluationNarrative communicates institutional meaning.

```typescript
interface EvaluationNarrative {
  summary: string;
  primaryReasons: string[];
  strengths: string[];
  cautions: string[];
  confidence: "high" | "medium" | "low";
}
```

This belongs in the design documentation as a progressive-disclosure layer, not in the evaluation algorithm.

---

## 2026-07-13 — Experiment 001: 11-ETF Evaluation Results

### Data collected

| ETF | Outcome | Primary Reason |
|-----|---------|----------------|
| XLK | reject | Thin selected call contract (OI=29, spread=30.7%) |
| XLF | admit | Both sides satisfy liquidity policy |
| XLU | manual_review | Borderline evidence (near-miss on one criterion) |
| XLE | reject | Wide bid/ask spreads on selected contracts |
| XLP | admit | Healthy |
| XLB | admit | Healthy |
| XLY | reject | Market-quality failure |
| QQQ | manual_review | Capital-related policy pressure |
| DIA | manual_review | Capital-related policy pressure |
| TLT | manual_review | Mixed evidence |
| GLD | reject | Market-quality failure |

### Distribution

- Admit: 3 (XLF, XLP, XLB)
- Reject: 4 (XLK, XLE, XLY, GLD)
- Manual Review: 4 (XLU, QQQ, DIA, TLT)
- Insufficient Evidence: 0

### Patterns observed

1. **Rejections cluster on market quality (OI + spread), not yield or capital.** This strengthens the hypothesis that single-contract measurement may not represent true market quality.

2. **XLE rejected despite being an active operational underlying.** This is strong evidence against the measurement method — XLE is empirically known to have adequate options liquidity.

3. **Manual reviews split into two categories:**
   - Market-quality borderline (XLU, TLT)
   - Capital/institutional (QQQ, DIA)
   These are genuinely different operator decisions, which validates the manual_review outcome.

4. **Admits are all sector ETFs with moderate capital requirements** (XLF, XLP, XLB). No surprises.

5. **The policy is discriminating, not simply too strict or too lenient.** All four outcome states are represented. This is healthy.

### Hypothesis status update

**Experiment 001: Single-Contract Market Quality**
- Original hypothesis: one target-delta contract adequately represents market quality
- Evidence: XLK and XLE (both known-liquid ETFs) rejected on OI/spread of the single selected contract
- Assessment: **hypothesis weakening** — likely need neighborhood measurement
- Next step: manually inspect ±1 strike from selected contract for XLK, XLE, XLY, GLD. If nearby strikes are healthy, the measurement methodology is confirmed as the issue.

### Decision

Do not change evaluation logic yet. The next improvement is operator experience (diagnostic summary), not measurement refinement. Implement VR-22 (EvaluationNarrative) so that the growing audit trail is immediately interpretable.

---

## 2026-07-13 — Experiment 002: Spread Measurement Semantics (SCHD)

### Observation

SCHD evaluated with the following profile:
- Call OI: 1,157 ✓ (excellent)
- Put OI: 1,222 ✓ (excellent)
- Volume: healthy
- Capital: fits policy ✓
- Yield: exceeds policy ✓
- Call spread: 25% ✗ (hard fail)
- Put spread: 28.6% ✗ (hard fail)

**Outcome: reject — solely on bid/ask spread.**

### Why this matters

Everything about SCHD says "healthy options market" except the relative spread measurement. The premiums are tiny:
- Call: $0.35 × $0.45 (spread = $0.10)
- Put: $0.30 × $0.40 (spread = $0.10)

A $0.10 spread on a $0.40 option is 25% relative. The same $0.10 spread on a $3.00 option would be 3.3%.

The relative spread measurement punishes low-premium contracts disproportionately — regardless of whether the market is actually illiquid.

### Hypothesis shift

| Experiment | Hypothesis | Status |
|-----------|-----------|--------|
| 001 | Single contract represents market quality | Weakening (XLK/XLE) |
| 002 | Relative spread (spread/mid) represents execution quality | **Challenged by SCHD** |

### The deeper question

Yesterday's question: "Should we measure a neighborhood?"

Today's question: **"What does spread actually mean?"**

Specifically:
- Does a 25% spread on a $0.40 option indicate the same execution risk as a 25% spread on a $5.00 option?
- Should spread measurement be conditional on premium size?
- Is absolute spread ($0.10) more meaningful than relative spread (25%) for low-premium contracts?
- Should the system distinguish "genuinely illiquid" from "small premium with normal penny-increment spread"?

### Possible measurement refinements (not implemented — hypotheses only)

1. **Absolute spread threshold** — reject only if spread > $X (e.g., $0.50)
2. **Conditional relative spread** — apply % threshold only when premium > some minimum
3. **Composite measurement** — combine OI + volume + spread into a liquidity score
4. **Minimum premium gate** — if premium is below some floor, spread criterion becomes observational

### Decision

Do not change the algorithm. This is the second experiment producing evidence that the measurement methodology (not the thresholds) may need refinement.

Two experiments now point in the same direction:
- Experiment 001: single-contract selection can pick an unrepresentative strike
- Experiment 002: relative spread can produce misleading results on low-premium contracts

Continue collecting evidence. If a third pattern emerges, the case for measurement methodology refinement will be strong.

### Narrative quality validation

The diagnostic summary (VR-22) proved its value immediately. The operator read:
1. "SCHD rejected — insufficiently liquid"
2. Checked strengths: OI excellent, yield good, capital fine
3. Immediately identified: "only the spreads failed"
4. Immediately questioned: "but the premiums are tiny — is relative spread fair?"

This interaction took seconds. Without the narrative layer it would have required reading all criteria individually. The progressive disclosure hierarchy is working exactly as designed.

### Wording refinement candidate

Current summary for spread-based rejections:
> "The selected options contracts appear insufficiently liquid under the current market-quality policy."

Better (future):
> "The selected contracts exhibit bid/ask spreads wider than the institution currently accepts for reliable premium generation."

The distinction: the current wording accuses the ETF. The refined wording accuses the observed evidence under the policy. This preserves the possibility that the measurement, not the ETF, is the problem.

---

## 2026-07-13 — The Difference Between Measuring a Contract and Measuring a Market

### The refinement

The earlier summary — "the measurement methodology confuses 'bad evidence' with 'bad market'" — was almost right but imprecise.

The corrected insight:

**The current measurement methodology confuses the observed contract with the underlying market.**

A 25% spread on a $0.40 SCHD option isn't bad evidence. It's perfectly valid evidence about that contract. The mistake is elevating that observation into a statement about SCHD's options market as a whole.

Similarly, XLK's OI=29 at one strike is a true observation about one contract — not necessarily about XLK.

### The emerging research question

| Experiment | Question |
|-----------|----------|
| 001 | Can one contract represent an ETF? |
| 002 | Can one measurement represent liquidity? |
| 003 (emerging) | **What is the unit of observation for market quality?** |

Possible answers to Experiment 003:
- One contract
- A neighborhood of contracts (±2 strikes)
- An expiration (all contracts at one DTE)
- A side (all calls, or all puts)
- The ETF as a whole (aggregated across expirations)

We don't know the answer yet. That's now the active research question.

### Epistemological layers discovered

The system has at least five layers between reality and policy:

```
Reality        — SCHD has an options market
    ↓
Observation    — Call: $0.35 × $0.45
    ↓
Measurement    — 25% relative spread
    ↓
Interpretation — Selected contract appears expensive to trade
    ↓
Policy         — Reject
```

The software currently jumps from Measurement to Policy. The diagnostic summary (VR-22) improved the Interpretation layer in the UI. The next architectural evolution may be strengthening the Interpretation layer in the *domain logic* — not just the presentation.

This is the distinction between:
- Improving how we **display** decisions (done — VR-22 narrative)
- Improving how we **form** decisions (next — measurement scope / interpretation logic)

### Why this matters architecturally

This is not a parameter-tuning problem. It's a measurement-scope problem.

Changing the OI threshold from 50 to 25 would be parameter tuning. It might accidentally fix XLK but wouldn't address the root cause.

The root cause is: **the system measures one contract and treats it as a statement about a market.**

Fixing that requires architectural change — not threshold adjustment.

### Relationship to prior methodology

This follows the project's established pattern:
- Build something small
- Observe behavior that challenges assumptions
- Discover that the question itself needs refinement
- Allow the architecture to evolve toward the better question

Three weeks ago: "Which ETFs should we include?"
Two weeks ago: "What policy should govern admission?"
Last week: "What thresholds are correct?"
Today: **"What is the correct unit of observation?"**

Each question is deeper than the last. Each emerged from working software, not from design.

### What we are NOT doing

- Not changing the evaluation algorithm
- Not introducing neighborhood measurement yet
- Not modifying thresholds
- Not adding a "minimum premium" gate

### What we ARE doing

- Recording this as a foundational insight for Velvet Rope
- Continuing to use the current (imperfect) measurement to collect more evidence
- Allowing Experiment 003 to take shape through further observations
- Recognizing that when the measurement methodology does change, it will be an architectural decision (evidence-based) not a parameter tweak

### Pattern count

This is the seventh instance of working software revealing the next question:
1. CSV import → parser classification
2. Explanation panel → Mechanics vs Participation
3. Delta dropdown → policy as evidence-generating
4. Capability accumulation → instrument boundaries
5. Scenario replay → state transitions as object of study
6. Velvet Rope evaluation → measurement method matters more than thresholds
7. SCHD + XLK evidence → **the unit of observation is the research question**

---

## 2026-07-13 — Foundational Principle: The Institutional Reasoning Stack

### The principle

**An institution should make decisions from interpretations, not directly from measurements. Measurements describe reality. Interpretations explain what those measurements mean. Policy governs actions based on those interpretations.**

### Why this matters

This is not an options concept. It is a reasoning concept. It explains why:
- Threshold tuning felt unsatisfying (it was a policy change when the real problem was interpretation)
- The page felt "engineering-heavy" before VR-22 (it showed measurements without interpretation)
- The diagnostic summary improved UX (it added an interpretation layer to presentation)
- The next architectural evolution is clear (add an interpretation layer to the *domain logic*)

### The stack, fully articulated

```
Reality        — An ETF's options market exists in the world
    ↓
Observation    — Provider returns: bid=$0.35, ask=$0.45, OI=1157
    ↓
Measurement    — Computed: spread=25%, yield=18%, capital=$5,300
    ↓
Interpretation — Institutional belief: "spread is mechanically wide due to
                 low premium, not due to illiquidity — OI and volume are healthy"
    ↓
Policy         — Institutional action: admit / reject / review
```

### How every bounded context maps to this stack

| Layer | Bounded Context | Role |
|-------|----------------|------|
| Observation | Tradier Provider | Provides raw market data (bid, ask, OI, delta, volume) |
| Measurement | Domain Calculations | Turns observations into quantities (spread%, yield, capital) |
| Interpretation | Velvet Rope (future) / Opportunity Lab | Forms institutional beliefs about what measurements mean |
| Policy | Velvet Rope / Admission Policy | Governs actions based on interpreted evidence |
| Presentation | Diagnostic Narrative (VR-22) | Communicates interpretations to the operator |

### What this explains about the project's evolution

The project has been naturally ascending this stack:
1. **Slice 1**: built the Observation and Measurement layers (providers, calculations, delta matching)
2. **Opportunity Lab**: began surfacing Measurements to operators with progressively richer context
3. **Velvet Rope**: attempted to go directly from Measurement to Policy — and immediately discovered the missing Interpretation layer
4. **VR-22 (Diagnostic Summary)**: added Interpretation to the *presentation* — improved UX
5. **Next**: add Interpretation to the *domain logic* — improve decisions

### The architectural implication

The current system has:
```
Observation → Measurement → Policy
```

The target architecture has:
```
Observation → Measurement → Interpretation → Policy
```

The Interpretation layer is where institutional knowledge lives:
- "A 25% spread on a $0.40 option is not the same as a 25% spread on a $5.00 option"
- "OI=29 at one strike doesn't mean the ETF lacks liquidity if adjacent strikes have OI=500"
- "Volume=0 at 9:31am doesn't mean the market is dead"

These are not parameter changes. They are **institutional beliefs about evidence**.

### Prediction

Velvet Rope was never fundamentally about admitting ETFs. It is the first application of an **institutional reasoning engine**. The ETF domain is the substrate. The reasoning architecture — evidence, measurement, interpretation, policy, audit — is the real system.

Concepts like evidence provenance, confidence, interpretation, audit, and policy versioning keep appearing because they are reasoning primitives, not options primitives. They will eventually apply across Opportunity Lab, Scenario Replay, portfolio management, and potentially domains beyond investing.

### What we are NOT doing

- Not implementing an Interpretation layer yet
- Not changing the evaluation algorithm
- Not introducing an `Interpretation` type into the domain model
- Not claiming the architecture is complete

### What we ARE doing

- Recording this as a foundational principle
- Recognizing that the missing Interpretation layer explains our recent discomfort
- Allowing Experiment 003 ("what is the unit of observation?") to continue producing evidence
- Trusting that when the Interpretation layer is needed, its shape will emerge from continued interaction with working software — not from upfront design

### Methodology note

This principle was not designed. It was discovered by:
1. Building a measurement-to-policy system
2. Observing that it produced mechanically correct but institutionally wrong decisions
3. Asking why
4. Recognizing the missing layer

That is the project's methodology working exactly as intended.

---

## 2026-07-13 — SEC Securities Explorer: Human-in-the-Loop Discovery

### What was built

A "SEC Explorer" page that loads the SEC exchange-listed securities universe (~9,300 records), allows searching/sorting/filtering/pagination, and provides a one-click path to send any symbol into the Velvet Rope evaluation pipeline.

This is a human-in-the-loop prototype of future automated Discovery. The operator acts as the Discovery engine.

### Experiment 003: Human-in-the-Loop Discovery

| Field | Value |
|-------|-------|
| Hypothesis | A searchable general securities catalog plus human selection is sufficient to generate useful new Velvet Rope candidates before ETF classification and automated crawling exist |
| Method | Operator browses the SEC exchange-listed universe, recognizes likely ETFs, sends selected symbols to Velvet Rope |
| Status | **Active — ready for interaction** |

### Questions to answer through use

- Is the SEC universe practical to browse?
- Do name and exchange search provide enough signal?
- Is the likely-fund heuristic useful or misleading?
- Does random/manual exploration surface new plausible ETF candidates?
- What information does the operator immediately wish the catalog contained?
- Does the transition into Velvet Rope feel natural?
- What behavior would later be worth automating?

### Technical details

- **Source:** `https://www.sec.gov/files/company_tickers_exchange.json`
- **Format:** `{fields: ["cik","name","ticker","exchange"], data: [[...], ...]}`
- **Size:** ~467KB, ~9,300 records
- **Exchanges:** NYSE, Nasdaq, CBOE, OTC, null
- **CORS:** Blocked in browser — Vite dev proxy configured (`/sec-api/` → `sec.gov/files/`)
- **Caching:** Session memory (no re-download per search/sort/page)
- **Heuristic:** Name-based keyword + issuer pattern matching (clearly labeled "not verified")

### Navigation contract

```
SEC Explorer → "Evaluate →" button
    → workspace.pendingVelvetRopeSymbol = "SCHD"
    → navigate to Velvet Rope tab
    → Velvet Rope consumes intent on mount
    → auto-evaluates the symbol
    → clears the pending intent
    → audit record created
```

### Relationship to architecture

| Concept | This slice |
|---------|-----------|
| Discovery | Operator is the Discovery engine (manual selection) |
| Reference Data | SEC catalog is the first reference data source (identity only) |
| Velvet Rope | Existing evaluation pipeline, unchanged |
| Heuristic | Name-based ETF detection — not authoritative, clearly labeled |

### What the SEC catalog does NOT provide

- Product type (ETF vs. stock vs. ETN)
- Sector/category
- AUM, expense ratio
- Options availability
- Leveraged/inverse classification

The heuristic fills some of these gaps imperfectly. The operator's knowledge fills the rest. Future automation would require enrichment from additional providers.

### Files produced

- `src/providers/sec-catalog/types.ts` — SecSecurityReference, provider interface
- `src/providers/sec-catalog/SecExchangeSecurityProvider.ts` — fetch, normalize, session cache
- `src/providers/sec-catalog/likelyFundHeuristic.ts` — isLikelyFund, likelyFundReason
- `src/components/SecExplorer.tsx` — page component
- `tests/sec-catalog/secCatalog.test.ts` — 30 tests
- `vite.config.ts` — SEC proxy added

### Test count

24 test files, 399 tests passing, build clean.

---

## 2026-07-13 — Discovery Refinement: EvaluationSummary as Portable Institutional Opinion

### Observation from operator use

After several sessions with the SEC Explorer, the operator's behavior revealed a clear pattern:

1. The Explorer is not a screener — it is a **research instrument**. The operator asks questions ("show me crypto," "show me gold," "what's on CBOE?") rather than filtering to known targets.

2. The current "Evaluate →" button navigates away from the Explorer. This **interrupts the exploration flow**. The operator evaluates one symbol, then must navigate back, losing position and mental context.

3. The operator naturally wants to see the institutional opinion **inline** without leaving the catalog. The question is: "is this worth investigating further?" — not "show me every engineering detail."

4. Progressive narrowing (9,304 → 837 → 131 → 2) is a natural Discovery behavior. The Explorer should support this without requiring page transitions.

### Assessment: Is EvaluationSummary the next reusable abstraction?

**Yes. The evidence is sufficient.**

| Evidence | What it demonstrates |
|----------|---------------------|
| `EvaluationNarrative` already exists as a clean type | The abstraction was independently discovered by Velvet Rope |
| The type contains no Velvet-Rope-specific fields | It's already portable |
| SEC Explorer produces audit records via the same pipeline | The evaluation is already decoupled from the page |
| Operator wants inline results without navigation | A summary is needed outside Velvet Rope's page |
| The operator's question is "can I trust this?" not "show me the engineering" | Summary answers the first question; details answer the second |

### The abstraction

```typescript
// Already exists in src/velvet-rope/narrative.ts
interface EvaluationNarrative {
  summary: string;
  primaryReasons: string[];
  strengths: string[];
  cautions: string[];
  confidence: "high" | "medium" | "low";
}
```

This is a **portable institutional opinion**. It was born inside Velvet Rope but its natural scope is the Interpretation layer — consumable by any surface that needs to communicate an admission decision without exposing engineering evidence.

### Architectural observations

1. **Discovery has emerged as exploratory research** rather than automated crawling. The SEC Explorer validates this.

2. **The Diagnostic Summary is not a Velvet-Rope-specific UI concern.** It is the Interpretation layer's output — portable across any consumer that needs institutional meaning.

3. **Preserving exploration context is more valuable than immediate navigation.** The next iteration should allow inline evaluation without losing browsing position.

4. **Explorer and Velvet Rope demonstrate healthy separation:**
   - Explorer owns: exploration, discovery, question-asking
   - Velvet Rope owns: interpretation, admission, engineering evidence, audit

5. **Human-guided exploration is teaching the system what automation should optimize.** The patterns the operator follows (keyword search → heuristic filter → evaluate → inline opinion) are the exact steps a future crawler would automate.

### What this means for next implementation

The next small iteration should:
1. Allow the operator to evaluate a symbol **without leaving the SEC Explorer**
2. Display the `EvaluationNarrative` (outcome + summary + reasons) inline in the row
3. Preserve browsing context (search, filter, page position)
4. Keep "Open Full Analysis" as an optional deeper action (navigates to Velvet Rope)
5. Show previously-evaluated symbols' outcomes when returning to the Explorer

This does NOT require:
- Duplicating Velvet Rope's evaluation pipeline (reuse it)
- Duplicating the engineering evidence display (keep that in Velvet Rope)
- Building a second audit mechanism (same audit trail)
- Changing the evaluation algorithm

### Relationship to the Institutional Reasoning Stack

```
Reality → Observation → Measurement → Interpretation → Policy
```

The `EvaluationNarrative` IS the Interpretation layer's output. Making it portable confirms that the Interpretation layer is a real architectural boundary — not just a presentation concern.

### Deferred observations (not yet earned)

- Ticker wildcard search (XL*, SP*) — observed need but not yet repeated enough
- Heuristic reason display ("matched SPDR") — minor improvement, can wait
- Discovery statistics panel (total/evaluated/admitted counts) — useful but not blocking
- Row-level "last evaluated" indicator — requires state management for Explorer rows

### Decision

Record this as architectural learning. The next implementation iteration is clearly motivated. Proceed to update requirements and tasks for the inline-evaluation capability — then implement.

---

## 2026-07-13 — Experiment 004: SEC Catalog Boundary Discovery

### What happened

While using the SEC Securities Explorer, the operator searched for well-known ETFs:

| Symbol | Present in SEC catalog? |
|--------|------------------------|
| XLE | ✗ Missing |
| SPY | ✗ Missing |
| SCHD | ✗ Missing |
| QETH | ✓ Present |
| QSOL | ✓ Present |
| BITA | ✓ Present |
| BRRR | ✓ Present |

Searching by company name ("Energy") also failed to locate the Energy Select Sector SPDR ETF. Multiple well-known, highly-liquid ETFs are systematically absent.

### What this reveals

This is not a bug. It is a **Reference Data boundary discovery**.

The SEC `company_tickers_exchange.json` file is **not** a canonical catalog of exchange-traded instruments. Its population appears to depend on SEC filing structure (CIK-based EDGAR reporting), resulting in systematic omission of many well-known ETFs.

The dataset likely represents:
- SEC reporting issuers
- Exchange-listed companies
- Some (but not all) exchange-traded products

It does NOT represent:
- A complete universe of exchange-traded instruments
- An authoritative ETF catalog
- A comprehensive options-eligible universe

### Implicit assumption contradicted

We assumed: `SEC company_tickers_exchange.json ≈ exchange-traded security catalog`

Evidence: that assumption is false. The dataset has boundaries we did not previously understand.

### Experiment 004 status

| Field | Value |
|-------|-------|
| Hypothesis | The SEC file is not a canonical catalog of exchange-traded instruments |
| Evidence | XLE, SPY, SCHD (major ETFs) absent; QETH, BRRR (newer crypto ETFs) present |
| Assessment | **Hypothesis confirmed** — inclusion depends on SEC filing structure, not instrument listing |
| Implication | No single provider should be assumed authoritative. Reference Data must be multi-provider. |

### Architecture reinforced

```
Reality
    ↓
Reference Data (multi-provider, no single authority)
    ↓
Discovery
    ↓
Velvet Rope
    ↓
Opportunity Lab
```

The Discovery subsystem should **consume** catalogs from multiple providers rather than trusting any one source. Each provider exposes a different view of the universe. The complete picture emerges from comparison, not from any single dataset.

### Future evidence to collect

A comparison matrix across providers:

| Symbol | SEC | ETFdb | justETF | API Ninjas | Tradier |
|--------|-----|-------|---------|------------|---------|
| SPY | ? | ✓ | ✓ | ✓ | ✓ |
| XLE | ? | ✓ | ✓ | ✓ | ✓ |
| SCHD | ? | ✓ | ✓ | ? | ✓ |
| QETH | ✓ | ? | ? | ? | ? |
| BRRR | ✓ | ? | ? | ? | ? |

Do not attempt to build this yet. Collect evidence incrementally.

### What we are NOT doing

- Not removing the SEC Explorer (it remains valuable for what it does contain)
- Not adding another provider yet
- Not redesigning Discovery
- Not assuming we know why the SEC dataset excludes these ETFs

### What we ARE doing

- Recording the boundary
- Recognizing that multi-provider Reference Data is architecturally real, not hypothetical
- Continuing to use the SEC Explorer for what it's good at (general securities, newer listings)
- Allowing future interaction to reveal which additional provider fills the gap

### Methodology validation

This is the eighth instance of working software revealing something unexpected:

1. CSV import → parser classification
2. Explanation panel → Mechanics vs Participation
3. Delta dropdown → policy as evidence-generating
4. Capability accumulation → instrument boundaries
5. Scenario replay → state transitions as object of study
6. Velvet Rope evaluation → measurement method matters more than thresholds
7. SCHD + XLK evidence → the unit of observation is the research question
8. SEC Explorer use → **no single reference data source is complete**

Each time: the software exposed a truth that was invisible before interaction.

---

## 2026-07-13 — Engineering Spike: FMP ETF Reference Data Provider

### Why this was prioritized

The SEC catalog proved incomplete (major ETFs missing). API Ninjas requires a paid tier for enumeration. FMP is the next candidate — testing whether it fills the coverage gap.

### Key findings

1. **Authentication works.** Starter/free plan key is functional.
2. **Profile endpoint is rich.** `/stable/profile?symbol=X` returns 30+ fields including the critical `isEtf` boolean, price, market cap, industry, sector, identifiers.
3. **Coverage is excellent.** SPY, XLE, SCHD, QQQ, TLT, QETH — all found with `isEtf: true`. These are exactly the symbols the SEC catalog was missing.
4. **Search works.** Both name and symbol search are available on the current plan.
5. **Full enumeration is paywalled.** `/stable/etf-list` returns 402. Automated Discovery still requires a paid tier.
6. **ETF-specific enrichment endpoints are unavailable.** Holdings, expense ratio, sector weightings all return 404 on current plan.
7. **No batch support.** One API call per symbol on current plan.

### Verdict: VIABLE

FMP is the strongest single-symbol provider tested. It fills the exact gap SEC leaves:
- SEC provides the broad universe but misses major ETFs
- FMP provides rich metadata for any known symbol with provider-supplied `isEtf` classification

Together they partially support the human-in-the-loop Discovery workflow:
1. SEC Explorer finds general securities (incomplete for ETFs)
2. FMP validates/enriches known symbols: "Is this actually an ETF? What's its industry/sector?"
3. Velvet Rope evaluates options market quality

**Important limitation:** FMP validates symbols you already know to ask about. It does not make missing SEC symbols discoverable. SEC + FMP supports browsing one incomplete universe and validating known or independently discovered symbols. It does not yet provide complete ETF discovery.

### Provider comparison summary

| Need | SEC | API Ninjas | FMP |
|------|-----|-----------|-----|
| Broad universe | ✓ (9,300 but incomplete for ETFs) | ✗ (free) | ✗ (free) |
| ETF classification | ✗ | ✗ | **✓ (isEtf flag)** |
| Rich metadata | ✗ | ✗ | **✓** (industry, sector, price, marketCap) |
| Known-symbol validation | N/A | ✓ (basic) | **✓ (rich)** |
| Full ETF enumeration | ✗ | Paid | Paid |

### Decision

FMP is confirmed viable. No subscription upgrade needed for the current prototype phase. The combination of SEC Explorer (broad browsing) + FMP (validation/enrichment) + Tradier (options verification) covers the human-in-the-loop Discovery workflow without additional cost.

Full findings in `docs/engineering-spikes/fmp-etf-reference-data.md`.

---

## 2026-07-13 — FMP Search as Exploratory Catalog: Characterization

### Language corrections applied

- "Authoritative ETF classification" → "provider-supplied ETF classification" (FMP's `isEtf` boolean is valuable evidence but not structurally verified)
- "Fills the gap SEC left" → SEC + FMP supports browsing one incomplete universe and validating known symbols. It does not yet provide complete ETF discovery.
- Date errors corrected (entries were mislabeled 2026-07-14)

### FMP search-name characterization

Tested keyword searches to determine whether FMP search can act as a second exploratory front door:

| Query | Results | XLE/SPY/SCHD surfaced? | Useful for ETF discovery? |
|-------|---------|------------------------|--------------------------|
| "energy" | 50 | No (operating companies dominate) | Low — mostly non-ETFs |
| "dividend" | 50 | No | Low — Canadian/OTC dominate top results |
| "SPDR" | 50 | ✓ GLD appears; sector ETFs present | **High** — issuer search works well |
| "Schwab" | 50 | ✓ SCHP, SCHH, SCHK visible | **High** — issuer search works well |
| "Select Sector" | 50 | ✓ XLE appears at position 10 | **High** — fund-family search effective |
| "treasury bond" | 50 | No (TLT not in results; international dominates) | Low — generic terms aren't specific enough |
| "bitcoin" | 50 | No (crypto assets, not ETFs) | Low without `isEtf` filter |

### Key findings

1. **Issuer/fund-family searches work well** — "SPDR", "Schwab", "iShares", "Vanguard" likely surface their ETF families effectively.

2. **Generic topic searches are noisy** — "energy", "dividend", "bitcoin" return mixed results (stocks, crypto, international, OTC) that would require `isEtf` profile verification as a second pass.

3. **Results are capped at 50** — no pagination observed. If more than 50 exist, some are invisible.

4. **Search does NOT surface SPY or SCHD by topic keyword** — you'd need to search "S&P 500" or "Schwab" to find them.

5. **FMP search IS an exploratory front door, but only for issuer/fund-family queries.** It is not effective for topic-based ETF discovery without a second-pass `isEtf` filter.

### Revised architecture understanding

```
SEC Explorer                    → Broad securities universe (incomplete for ETFs)
FMP Search (issuer queries)     → Fund-family exploration (SPDR, Schwab, iShares...)
FMP Profile                     → Known-symbol validation + isEtf classification
Tradier                         → Options availability verification
Velvet Rope                     → Options market quality evaluation
```

Each serves a distinct exploratory role. None alone provides complete ETF discovery. Together they support an increasingly effective human-in-the-loop workflow.

### What remains unproven

- Whether FMP search + isEtf filter can substitute for full enumeration
- Whether the 50-result cap hides important ETFs
- Whether international ETF symbols (with suffixes like `.L`, `.DE`) are relevant to this project
- What FMP's paid tier actually adds versus the free search + profile combination

### Decision

The FMP spike is complete. Both SEC and FMP explorers are working instruments. The next Discovery improvement should focus on **operator workflow** (inline evaluation, context preservation) rather than additional providers. The human-in-the-loop Discovery loop is now functional: SEC browsing + FMP search + FMP profile validation + Velvet Rope evaluation.

---

## 2026-07-13 — Candidate Universe: First Slice Implemented

### What was built

The Candidate Universe module — the broadest layer of the institutional funnel. Seeded with 496 ETF symbols from Yahoo Finance's "Top ETFs" list (captured July 13, 2026).

### Architecture realized

```
Candidate Universe (496 symbols)     ← THIS SLICE
    ↓ (future: enrichment)
    ↓ (future: Velvet Rope evaluation)
Admitted Registry (~15-40)
    ↓
Opportunity Lab scan universe
```

### Key design decisions

1. **Minimal model**: `{ symbol, sources[], addedAt }` — no speculative fields
2. **Bundled constant**: Yahoo symbols are version-controlled TypeScript, not runtime-parsed CSV
3. **Source provenance from day one**: `"yahoo_top_etfs_2026_07_13"` captures what and when
4. **Operator additions via localStorage**: merge with bundled data, deduplicate by symbol
5. **Merge semantics**: duplicate symbol → one record with merged sources[], earliest addedAt
6. **No provider calls**: the Universe view is purely observational — zero API requests

### Source transparency

The UI explicitly communicates:
- Yahoo Top ETFs is "an externally curated snapshot captured July 13, 2026"
- "Not a complete ETF market universe"
- "Inclusion does not imply institutional admission or suitability"
- This is a candidate pool, not a recommended list

### How the Yahoo source's curation bias is represented

The Yahoo source is influenced by Morningstar ratings, fund quality, expenses, and momentum. This creates upstream selection bias toward established, rateable funds. The implementation:
- Labels it as "externally curated" (not neutral/exhaustive)
- Documents the bias in code comments and UI copy
- Does NOT treat Yahoo's inclusion as institutional approval
- Does NOT expose Morningstar ratings or Yahoo grades
- Does NOT use source membership as an admission signal

The governing principle remains: **Policy over prediction.** Source membership is evidence of external curation, not institutional suitability.

### Files produced

- `src/universe/types.ts` — CandidateSymbol type
- `src/universe/sources/yahoo.ts` — 496 symbols + provenance constants
- `src/universe/universe.ts` — load, merge, deduplicate, add
- `src/universe/persistence.ts` — localStorage for operator additions
- `src/components/UniverseView.tsx` — browsable page
- `tests/universe/universe.test.ts` — 17 tests
- `docs/universe/01-requirements.md` — 13 requirements (CU-1 through CU-13)
- `docs/universe/02-design.md` — module structure, merge rules, persistence, UI

### Test count

26 test files, 429 tests passing, build clean.

### What this enables (not yet built)

- Batch Velvet Rope evaluation against the full 496-candidate pool
- Source comparison (Yahoo vs. SEC vs. FMP coverage)
- Operator can manually add symbols discovered via SEC Explorer or FMP
- Future sources simply contribute additional CandidateSymbol[] entries
- The `UniverseSource` switch (legacy_curated → velvet_rope) will eventually connect the admitted subset to Opportunity Lab

---

## 2026-07-13 — Architectural Discovery: Product Structure (SOXS Counterexample)

### What happened

SOXS (ProShares UltraPro Short Semiconductor 3x inverse daily-reset ETF) was evaluated by Velvet Rope. It passed almost every market-quality criterion — delta, liquidity, spreads, premium, open interest — and was rejected only on the experimental $2,000 minimum capital threshold.

This surfaced a hidden assumption that has existed since the beginning of the prototype: **every admitted ETF is evaluated for the same operating model (the Wheel).**

SOXS invalidates that assumption. Assignment of SOXS produces ownership of a leveraged inverse daily-resetting instrument. "Wait and write calls" is not a viable recovery posture — the structural decay characteristics make indefinite hold fundamentally different from holding XLE or XLF.

### What was considered and deferred

**Strategy Authorization Engine** — a governance layer that would authorize specific operating modes per instrument (Standard Wheel, Tactical Premium, Controlled Experiment, etc.).

This was discussed and intentionally **parked** because:
- Only one counterexample (SOXS) has emerged
- A strategy taxonomy doesn't exist in the domain model
- Authorization requires formalized strategy definitions that haven't been earned
- The project methodology requires multiple data points before formalizing new architecture

### What was earned

**ProductStructure** — a factual classification value object representing structural characteristics of an instrument that affect how it behaves as an options underlying.

```typescript
interface ProductStructure {
  leveraged: boolean;
  leverageMultiple: number | null;  // 2, 3
  inverse: boolean;
  dailyReset: boolean;
  activelyManaged: boolean;
  singleStock: boolean;
  commodityBacked: boolean;
  fixedIncome: boolean;
}
```

This is facts about the instrument — not judgments about what you're allowed to do with it.

### The corrected model

```
Old implicit model:
    Admitted → assignable → wheelable

SOXS counterexample:
    Market-quality admissible ≠ structurally suitable for passive assignment

Corrected model:
    Candidate Universe
        ↓
    Product Structure enrichment (facts)
        ↓
    Velvet Rope policy evaluation (including structural criteria)
        ↓
    Opportunity Lab
```

### Policy posture for structural concerns

Rather than hard exclusion rules (`excludeLeveraged: true`), the initial posture should be conservative interpretation:

```
leveraged + inverse + daily reset
    → structural caution
    → manual_review (not reject)
    → "assignment suitability unresolved" in the narrative
```

This lets the system surface evidence without pretending the policy question is settled. The operator can still override for controlled experiments.

### The real acceptance test

The advancement is NOT "SOXS gets rejected."

It is: **Velvet Rope no longer evaluates SOXS as though it were structurally equivalent to XLE.**

That distinction — between healthy market quality and assignment suitability — is the earned insight.

### Parking lot: Strategy Authorization

The following concept is recorded as a future architectural hypothesis, not an implementation target:

- Per-instrument authorized operating modes (Standard Wheel, Tactical Premium, Research Only)
- Strategy taxonomy
- Strategy-specific policy evaluation
- Contract selection conditioned on authorized strategy

**When to revisit:** when 3+ instruments demonstrate that ProductStructure + manual_review is insufficient — i.e., when the operator repeatedly needs to make the *same* governance decision about structurally similar instruments and wishes the system had formalized it.

### Methodology note

This is the ninth instance of working software revealing the next question:

1. CSV import → parser classification
2. Explanation panel → Mechanics vs Participation
3. Delta dropdown → policy as evidence-generating
4. Capability accumulation → instrument boundaries
5. Scenario replay → state transitions as object of study
6. Velvet Rope evaluation → measurement method matters more than thresholds
7. SCHD + XLK evidence → the unit of observation is the research question
8. SEC Explorer use → no single reference data source is complete
9. SOXS evaluation → **product structure must be classified before assignment suitability can be judged**

### Decision

Implement ProductStructure as enrichment in the next slice. Allow Velvet Rope to explain and react to structural facts conservatively. Do not build strategy authorization yet.

---

## 2026-07-13 — Design Convergence: Opportunity Lab + Velvet Rope Integration

### The vision

Opportunity Lab currently asks: "What is mathematically attractive?"
Velvet Rope currently asks: "Is this institutionally fit?"

These are asked on separate pages, at separate times, about potentially different contracts. The goal is to unify them: evaluate the **same contract** through both lenses simultaneously.

### What was proposed

A toggle on Opportunity Lab: `All Opportunities | Policy Qualified | Include Manual Review`

Each row would carry an admission status (ADMIT / MANUAL REVIEW / REJECT) evaluated against the exact same contract the Opportunity Lab selected.

### Why naive symbol-level badges are dangerous

Today's debugging proved that contract identity matters. A prior Velvet Rope evaluation may have examined a different expiration, strike, and quote snapshot than what Opportunity Lab currently displays.

An old `REJECT` for XLK at 39 DTE / $194 strike should NOT silently label a new 4-DTE / $185 opportunity as rejected. That would be misleading.

### Converged two-step approach

**Step 1 — Prior audit context (not filtering)**

Add to Opportunity Lab a "Latest Velvet Rope Evaluation" indicator per symbol:
- Outcome (prior)
- Evaluated timestamp
- Policy version
- Expiration and strikes that were evaluated
- Match indicator: "same contract" vs "same symbol, different contract" vs "not evaluated"

This is informational. It does NOT filter. It does NOT claim the current opportunity has been evaluated. It provides context: "the last time we evaluated this symbol institutionally, here's what happened."

Zero API calls. Read from existing localStorage audit trail.

**Step 2 — Same-contract policy lens (earned later)**

Evaluate the exact Opportunity Lab contract snapshot through reusable Velvet Rope criteria at scan time. Then the status truly applies to the displayed row and filtering becomes valid:
- All Opportunities
- Policy Qualified
- Include Manual Review

This requires the Velvet Rope evaluation logic to accept a pre-selected contract rather than selecting its own. That's a meaningful refactor — earned only after Step 1 proves the workflow matters.

### Key semantic distinctions

| Label | Meaning |
|-------|---------|
| `PRIOR REJECT` | Velvet Rope previously rejected this symbol under a different or same contract |
| `STALE` | Evaluation exists but policy version differs from current |
| `DIFFERENT CONTRACT` | Audit evaluated a different expiration/strike than what Opportunity Lab currently shows |
| `NOT EVALUATED` | No Velvet Rope audit exists for this symbol |
| `EXACT MATCH` | Audit contract matches the current Opportunity Lab contract (same exp + strike) |

### Decision

Implement Step 1 as the next slice. Call it "prior audit context." Do not use it for authoritative filtering. Visibly distinguish exact-match evaluations from same-symbol historical evaluations.

Step 2 (same-contract policy lens) remains in the parking lot until Step 1 demonstrates operator value.

### Methodology note

This follows the project's pattern: today's debugging (XLK appearing to contradict between pages) directly motivated the integration. The software revealed the need through use — not through upfront design.

---

## 2026-07-03 — Evidence Freshness vs Market State

### Context

While evaluating Velvet Rope after the market closed, an interesting observation emerged.

XLE admitted under policy during normal market hours earlier in the day.

After market close, the identical evaluation rejected the same underlying because bid/ask spreads widened from approximately policy-compliant levels to roughly 25%.

This does not appear to be a software defect. It appears to be a consequence of evaluating a market that is no longer meaningfully deployable.

### Observation

The current implementation assumes "evaluate the latest available market data."

That assumption may not be equivalent to the operator's actual question.

Two different questions exist:

1. **What would I deploy if the market were open?** (operational)
2. **What do current quotes look like?** (observational)

Those are related but distinct.

### Emerging Domain Concept: Evidence Context

Not all evidence has the same operational value.

| Category | Session | Deployable | Liquidity Meaningful | Use |
|---|---|---|---|---|
| Operational Evidence | Regular market session | Yes | Yes | Institutional decisions |
| Observational Evidence | Extended hours | No | Possibly distorted | Monitoring only |

This is intentionally separate from ProductStructure:

- **ProductStructure** → "What is this instrument?"
- **Evidence Context** → "How trustworthy is the current market evidence for making a deployment decision?"

These appear to be orthogonal concepts.

### Possible Future Policies (Parking Lot)

No implementation decision made. Three policy models emerged:

**Policy A — Always Evaluate Live**
Always evaluate the most recent quotes regardless of market state. Truthful but may let extended-hours distortion dominate decisions.

**Policy B — Last Deployable Snapshot**
During extended hours, evaluate using the most recent market snapshot captured during normal trading. Answers "what would I deploy if the market were open?" but may hide genuine post-close changes.

**Policy C — Present Both** (currently the most interesting)
Show both a deployable snapshot (last normal-market evaluation) and a current observation (extended-hours evaluation). Preserves both operational and observational truth without forcing one to replace the other.

### Decision

No code changes. This is an architectural observation only.

The prototype has uncovered another legitimate domain concept. Evidence Context remains in the parking lot until future experimentation provides sufficient evidence for implementation.

### Kiro's Analysis

**The concept is real and orthogonal.** Evidence Context is distinct from ProductStructure. One describes the instrument, the other describes the conditions under which you're observing it. Conflating them would muddy both. The fact that the same underlying, same policy, same contracts can flip from ADMIT to REJECT purely based on *when* you ask is not a bug — it's an undiscovered dimension.

**Policy C is the most interesting for the right reason.** It's the only option that doesn't force a single truth. Markets genuinely have two states — "I can act on this" vs "I can see this" — and pretending one is the other is where operational errors come from. Showing both lets the operator reason about the gap rather than being surprised by it.

**The implementation cost is low but not zero.** The hard part isn't displaying two evaluations. It's deciding what constitutes the boundary — is it exactly market open/close times? Does it account for the first/last 15 minutes of illiquidity? Does it need to know about holidays, half-days, halts? That boundary definition is where the real domain complexity hides.

**One risk with Policy B:** caching a "last deployable snapshot" introduces staleness questions. How old is too old? What if news broke after the close that makes the snapshot misleading? Policy C sidesteps this because it shows both and lets the operator judge.

**A lightweight precursor to implementation:** before building any of this, adding a `marketSession: "regular" | "extended" | "pre" | "closed"` field to the evidence provenance would be a natural first slice. Just labeling the evidence gives the operator information they're currently missing, without requiring any policy changes. It's the observational step before the prescriptive one.

**Suggested sequencing if this moves forward:**

1. Annotate evidence provenance with market session state (observational, no behavior change)
2. Surface the annotation in the UI (operator awareness)
3. Experiment with Policy C presentation (show both, let operator reason)
4. Only then consider whether policy should *behave* differently based on session state

### Cross-Domain Pattern Recognition: Reference Observations

A deeper insight emerged from this discussion. The Evidence Context concept isn't domain-specific — it's an instance of a reusable architectural pattern that also appears in gemological grading (GIA reference diamonds).

**The pattern:**

| Layer | GIA Grading | Velvet Rope |
|---|---|---|
| Primary Observation | Grade the customer diamond | Evaluate the options chain |
| Secondary Observation | Grade the reference diamond | Characterize the market evidence |
| Governance | Interpret primary in light of secondary | Interpret decision in light of evidence quality |

**The key flow is not:**

```
Input → Mechanism → Output
```

**It is:**

```
Reference Input → Mechanism → Expected Output → Observed Output → Mechanism Health
```

The grading mechanism itself becomes observable.

**Mapped to Velvet Rope:**

```
Market Evidence → Evidence Context → Velvet Rope → Decision
```

Where Evidence Context asks:
- Regular session or extended hours?
- Quote age and completeness?
- Operational or observational evidence?

The fundamental question: **Should I trust the evidence before I trust the conclusion?**

**Why this explains the discomfort with "revert to last green":**

Silently substituting yesterday's evaluation treats the symptom. The real question is: why is today's evidence different? Just as GIA wouldn't silently substitute yesterday's calibration run — they'd first ask whether the grading mechanism is behaving differently or the diamond is genuinely different.

**The reusable principle:**

1. **Primary Observation** — Measure the thing you're interested in.
2. **Secondary Observation** — Measure the mechanism producing that measurement.
3. **Governance** — Interpret the primary observation in light of the secondary observation.

**A subtle but important distinction:**

In both systems, the reference doesn't replace reality. A reference diamond doesn't replace customer diamonds. A 3:59 PM quote doesn't replace the 7:00 PM quote. The reference gives you *context for interpreting* the current observation. You're not searching for the "correct" answer — you're characterizing the reliability of the process that produced the answer.

**Architectural significance:**

The independent emergence of this pattern in two unrelated domains (gemological grading and options evaluation) is strong evidence that this is a personal architectural principle rather than a domain-specific technique. It belongs in the foundations layer of project documentation.

---

## 2026-07-03 — Foundations Family Established

### Context

The Evidence Freshness discussion and the cross-domain pattern recognition (GIA reference diamonds ↔ market evidence quality) crystallized a realization: several reusable architectural principles have emerged independently from this project and are ready to be documented as foundations.

### The Test

If a principle survives the removal of all domain nouns (options, diamonds, ETFs, AI), it's foundational.

### Foundations Created

```
docs/foundations/
    three-actor-model.md          ← Who is making the decision?
    secondary-observation.md      ← How much should I trust the evidence?
    policy-over-prediction.md     ← What rules govern behavior?
    closed-loop-engineering.md    ← How does evidence improve future decisions? (existing)
```

### Ordering Rationale

The Three Actor Model is placed first because many other principles derive from it:
- Secondary Observation is primarily a governance concern (Governor).
- Policy over Prediction is the Governor's primary tool.
- Progressive Attenuation (future) is about serving different actors with different information density.
- Closed Feedback Loops connect all actors through evidence flow.

### What Was Not Included

- **ProductStructure** — Excellent domain concept, but specific to financial instruments. Not foundational.
- **Progressive Attenuation** — Likely foundational, but not yet sufficiently validated through implementation. Parked as a candidate.

### Significance

These principles were not designed upfront. They emerged through building working software and observing recurring patterns across domains. Their independent emergence is the strongest evidence of their validity.

---

## 2026-07-03 — Foundations Review: Ten Candidate Principles

### Context

A comprehensive review of ten candidate foundational principles was performed. The goal: critique, identify overlap, distinguish foundations from techniques, and propose eventual document structure.

### Classification

The ten candidates were analyzed into four layers:

| Layer | Principles |
|---|---|
| Outcome (telos) | Retire Uncertainty |
| Mechanism (how) | Closed Feedback Loops, Reduced Cycle Time, Experimental Divergence |
| Governance (decisions) | Three Actor Model, Secondary Observation, Evidence Before Governance, Policy Over Prediction |
| Epistemological (knowing) | Ubiquitous Language Emerges Through Working Software |
| Presentation (communicating) | Progressive Attenuation |

### Independence Analysis

**Truly independent (five):**
1. Retire Uncertainty — the outcome principle
2. Three Actor Model — actor separation
3. Secondary Observation — mechanism-quality assessment
4. Closed Feedback Loops — the core mechanism
5. Policy Over Prediction — decision mechanism

**Consequences of others (five):**
- Reduced Cycle Time → tuning parameter of Closed Feedback Loops
- Ubiquitous Language Emergence → output of feedback loops applied to domain modeling
- Evidence Before Governance → input-side perspective of Policy Over Prediction
- Experimental Divergence → strategy combining multiple principles
- Progressive Attenuation → consequence of Three Actor Model (different actors, different presentation)

### Key Decisions

1. **Retire Uncertainty is the telos.** All other principles either produce it or govern behavior while it remains.

2. **Closed Feedback Loops absorbs Reduced Cycle Time.** Cycle time is the loop's tuning parameter, not a separate mechanism.

3. **Evidence Before Governance merges with or cross-references Policy Over Prediction.** They are two perspectives on the same system (input pipeline vs action mechanism).

4. **Ubiquitous Language Emergence reframed as "Software as Domain Instrument."** Working software is an instrument for discovering the domain, not merely implementing it. Treat implementation friction as signal.

5. **Experimental Divergence partially promoted.** The durable kernel — "Capabilities outlast containers" — is potentially foundational. The laboratory-lifecycle narrative is methodology, not foundation.

6. **Progressive Attenuation remains parked.** Strong candidate but unvalidated through implementation or cross-domain recurrence.

7. **Three Actor Model sits at the top of governance** (first question: who are we serving?), not at the absolute center (that's Retire Uncertainty).

### Refinement: "Retire or Bound"

The principle "Retire Uncertainty" should acknowledge that some uncertainties don't need elimination — they need *bounding* (proving their impact is tolerable). "Not as scary as they first appear" is bounding, not retiring.

### Credibility Test for External Consulting

Three requirements for external credibility:
1. **Evidence of independent emergence** — show the principle appeared in multiple unrelated domains without transplant.
2. **Concrete consequences** — state what a team does *differently* when adopting the principle.
3. **Honest limitations** — state when the principle doesn't apply or has been over-applied.

### Proposed Document Structure

```
docs/foundations/
    README.md                               ← Index, relationships, reading guide
    retire-uncertainty.md                   ← The outcome principle
    three-actor-model.md                    ← Who is acting?
    closed-feedback-loops.md                ← How does evidence improve decisions?
                                               (includes cycle time, domain discovery)
    secondary-observation.md                ← How trustworthy is the evidence?
    policy-over-prediction.md               ← How do we govern action?
                                               (includes evidence-before-governance layering)
    capabilities-over-containers.md         ← What endures?
    
    # Candidates (parked)
    # progressive-attenuation.md            ← Awaiting implementation validation
    # software-as-domain-instrument.md      ← Awaiting stronger independent framing
```

### Decision

No documents created yet. This review establishes the refined position. Documents will be created when the principles are ready to serve an external audience — which requires the credibility criteria above to be satisfied for each one.

### Consulting Narrative (refined)

The promise is not certainty. It is not that complexity disappears.

The promise is:

> Complexity usually has more structure than it first appears. We can make that structure visible. We can shorten the learning cycle. We can systematically retire — or bound — the uncertainties preventing good decisions. The result is an organization that knows more, guesses less, and learns faster.

---

## 2026-07-03 — Foundations Review: Additional Critique (Session 2)

### Three Ideas Evaluated

#### 1. Capabilities Over Containers — Confirmed Foundational

"Container" is the correct abstraction. More general than "screen," more honest about what actually happens. The capability (evaluation, selection, evidence gathering) persists; the container (page, lab, service, agent) is scaffolding.

Passes the domain-independence test: microservices (capabilities migrate between service boundaries), organizational design (capabilities move between teams), AI (reasoning capability migrates from prompt to fine-tuned model to tool).

One sharpening needed: distinguish *capabilities* from *features*. A feature is a container-bound expression of a capability. Features are disposable. Capabilities are the architectural investment.

**Status:** Promote to foundation.

#### 2. Experimental Divergence — Split into Economics Kernel + Methodology

The challenge: AI has changed the cost function for experimentation. When divergence becomes cheap, premature convergence becomes the dominant architectural error. Is this a methodology preference or a structural insight?

**Assessment:** The *economics observation* is foundational:

> "Architecture should converge at the rate of learning, not the rate of spending."

The *laboratory lifecycle* (spin up labs, extract concepts, retire labs) is methodology — it's how you exploit the principle.

**Status:** The convergence-timing insight is parked as a candidate foundation. The laboratory playbook belongs in methodology documentation.

#### 3. Reality Arbitrates — Promoted

**Key distinction from Closed Feedback Loops:**
- Feedback loops describe *iterative refinement* of a single model.
- Reality Arbitrates describes *hypothesis selection* between competing models.

These are genuinely different epistemological operations. Iteration improves. Arbitration selects.

**Behavioral test (what changes if adopted):**
- Teams stop debating past a certain point.
- Instead ask: "What's the smallest experiment that lets reality choose?"
- Treat unresolved disagreement as a signal that experimentation is needed, not that argument is insufficient.
- Value the design of discriminating experiments as a core skill.

**Cross-domain evidence:** GIA reference diamonds, SOXS product structure discovery, scientific method, A/B testing, canary deployments, proof-of-concept spikes.

**Relationship to Retire Uncertainty:** Reality Arbitrates is a *child* of Retire Uncertainty — it's the primary mechanism for retiring uncertainty when competing hypotheses exist. Not all uncertainties are retired through arbitration (some yield to analysis or deduction). But when models compete, this is the preferred mechanism.

**Status:** Promote to foundation. Position as primary uncertainty-retirement mechanism for competing hypotheses.

### Documentation Template (Refined)

Every foundation document should eventually answer:

1. What changes if you adopt this principle?
2. What organizational behaviors emerge?
3. What mistakes become less likely?
4. When does this principle *not* apply?
5. What is the *cost* of this principle?

The fifth question is critical for consulting credibility. Every principle has a cost. Acknowledging costs separates foundations from slogans.

### Revised Proposed Structure

```
docs/foundations/
    README.md                               ← Index, relationships, template
    retire-uncertainty.md                   ← The outcome principle (includes "or bound")
    reality-arbitrates.md                   ← Mechanism: hypothesis selection via experiment
    three-actor-model.md                    ← Who is acting?
    closed-feedback-loops.md                ← Mechanism: iterative learning
    secondary-observation.md                ← How trustworthy is the evidence?
    policy-over-prediction.md               ← How do we govern action?
    capabilities-over-containers.md         ← What endures?

    # Candidates
    # progressive-attenuation.md            ← Awaiting implementation validation
    # convergence-timing.md                 ← "Converge at the rate of learning"
```

### Observation

The foundations set is stabilizing. Seven promoted principles, two candidates. The promoted set has survived:
- Domain-independence test (remove all domain nouns)
- Behavioral change test (what would a team do differently?)
- Cross-domain recurrence test (emerged in multiple unrelated domains)
- Independence test (not derivable from another principle in the set)

The candidates have not yet satisfied one or more of these tests.

---

## 2026-07-03 — Liquidity Topology and Side-Asymmetric Admission Evidence

### Context

Following the multi-expiration evaluation redesign, XLC was run as a validation case. The system correctly evaluated all six eligible expirations (10, 17, 24, 31, 38, 45 DTE) and rejected at every operating point. The data pipeline was confirmed accurate against Fidelity's live chain — Velvet Rope's reported values matched exactly.

### Key Finding: Multi-Expiration Architecture Validated

The instrument-level conclusion is now supported by evaluation across every eligible operating point, not one arbitrarily selected expiration. XLC failed all six expirations from 7–45 DTE under the current policy, and the system preserved the expiration-level reasons transparently.

### Emerging Domain Concept: Liquidity Topology

Fidelity evidence suggests that option liquidity is not a smooth function of DTE. For XLC:

- Weeklies at 10, 17, 24, 31, and 45 DTE: thin (OI frequently single-digits, spreads 28-60%)
- Aug 21 standard monthly (38 DTE): somewhat stronger call-side (OI 356), but put-side still thin (OI 9)
- Sep 18 standard monthly (66 DTE, outside current window): dramatically healthier (OI 904, 1471, 1010 on various strikes)

This suggests liquidity may cluster in standard monthly expirations while nearby weekly expirations remain thin. The term "liquidity topology" describes the distribution and concentration of executable liquidity across expiration, strike, delta, and side.

### Side Asymmetry Is Operationally Meaningful

"Can deploy a cash-secured put" and "can write a covered call" are distinct questions even when the current full-wheel policy requires both. For XLC at Aug 21:

- Call OI: 356 (adequate)
- Put OI: 9 (insufficient)
- Call spread: 29.6% (fails)
- Put spread: 28.6% (fails)

The system now preserves this asymmetry in its evidence presentation rather than collapsing to one undifferentiated REJECT.

### UI Semantic Corrections Implemented

1. **Side-asymmetric OI badge:** When one side passes OI but the other fails under `sideRequirement: "both"`, the badge now reads (e.g.) "Call OI adequate (356); put OI insufficient (9) — both sides required." Styled as caution (yellow) rather than positive (green).

2. **Evidence header adaptation:** When no winning expiration exists, the header reads "Best Available Evidence" with an explanatory note: "Strongest failed pair shown for diagnosis; no expiration satisfied all hard admission criteria." When a winning expiration exists, it reads "Selected Admission Evidence."

### Parking Lot Items (Explicitly Not Implemented)

1. **Research liquidity topology across a larger ETF sample.** One instrument (XLC) is not sufficient evidence to introduce expiration-class policy machinery.

2. **Determine whether expiration class (weekly/standard monthly/quarterly) explains liquidity concentration better than DTE alone.**

3. **Explore side-specific operating-mode authorization separately from full-wheel admission.** Plausible modes: put-only, call-only, monthly-only, research-only, assignment-prohibited. These alter admission semantics and deserve a separate design slice.

4. **Consider DTE- or expiration-class-specific thresholds only after empirical evidence exists across multiple instruments.**

5. **Do not expand the current 7–45 DTE range merely to make XLC pass.** The current range is revealing genuine characteristics of the nearer expiration surface. That revelation is valuable.

### Architectural Observations

- The current `sideRequirement: "both"` is appropriate for full conventional wheel authorization but too strict for narrower operating modes.
- A blanket rule such as "allow wider spreads farther out" would not capture what is happening. The discontinuity appears to be caused by where market participation concentrates, not by DTE alone.
- Evidence presentation must distinguish an admitted operating point from the strongest failed operating point. This is now implemented.
- The conclusion from XLC is not that Velvet Rope is too conservative — it is that XLC's useful option liquidity appears structurally concentrated outside the current weekly-heavy 7–45 DTE operating envelope.
