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
