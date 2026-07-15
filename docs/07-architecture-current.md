# Options Prototype — Current Architecture

**Status:** Authoritative as of July 2026
**Supersedes:** The "Architecture Evolution" appendix in `04-architecture.md`

---

## System Identity

The Options Prototype is an operator console for same-day options contract writing decisions.

It is not:
- A screener
- A portfolio dashboard
- An automated trading system
- A brokerage integration

It is:
- A decision-support workbench that acquires evidence, produces recommendations, and hands off execution to a broker

---

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Portfolio Context                                         │
│   (Fidelity CSV import, Demo snapshot, progressive disclosure)│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Evidence Acquisition                                      │
│   (Provider calls, session gating, crawl planning,          │
│    generation tracking, IndexedDB persistence)              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Evidence Store                                            │
│   (Durable IndexedDB cache, TTL management,                 │
│    canonical session evidence, provenance metadata)          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Recommendation Engine (Wheelwright)                        │
│   (Contract selection, execution assessment, ranking,       │
│    deployment policy — zero provider calls)                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Write Desk (Operator Workbench)                           │
│   (Compact operational header, recommendation board,        │
│    recommendation brief, policy controls)                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Broker Handoff                                            │
│   (WriteIntent, broker adapter, Fidelity trade link,        │
│    operator verification, external tab handoff)              │
│                                                             │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│                                                             │
│   Broker Execution (External — Fidelity)                    │
│   (Preview, validation, confirmation, submission)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Portfolio Context

**Owns:** Portfolio snapshot, deployable cash, inventory, existing positions, readiness assessment.

**Sources:**
- Demo snapshot (simulated portfolio for development)
- Fidelity CSV upload (positions + activity)

**Provides to downstream:** `PortfolioSnapshot` with deployable cash, call capacity, existing puts, readiness status, provenance.

**Must not:** Make market data calls. Produce recommendations.

---

### 2. Evidence Acquisition

**Owns:** Market evidence collection, provider communication, session-aware scheduling.

**Key modules:**
- `acquire-evidence.ts` — orchestrates evidence collection
- `scan-planner.ts` — determines which symbols need fresh data
- `crawl-state.ts` — durable generation and cursor tracking
- `universe-scanner.ts` — traverses the candidate universe

**Responsibilities:**
- Session-aware acquisition (blocks during closed sessions)
- Crawl planning with cache-first strategy
- Refresh scheduling via PrimaryExpirationPolicy
- Provider abstraction (Tradier, Mock)
- Network telemetry and rate-limit awareness
- Generation tracking across page reloads

**Must not:** Produce recommendations. Make ranking decisions. Interact with UI directly.

**Provider:** TradierProvider (sandbox, 15-min delayed, 60 req/min rate limit).

---

### 3. Evidence Store

**Owns:** Cached market evidence with freshness semantics.

**Key modules:**
- `durable-cache.ts` — IndexedDB-backed cache with TTL tiers
- `evidence-provenance.ts` — canonical write gate logic (defined, not yet enforced in write path)
- `coverage-semantics.ts` — multi-level coverage tracking

**Data types cached:**
- `quote` — underlying price, description
- `expirations` — available expiration dates
- `chain` — full option chain (puts, calls, underlying metadata)
- `metadata` — instrument-level data
- `absence` — confirmed no-options-available

**TTL policy:**
- Chain: 5 min fresh, 30 min stale (overridden by session validity during closed sessions)
- Expirations: 6 hours fresh, 24 hours stale
- Quote: 1 min fresh, 5 min stale

**Session validity rule:** When the market session is closed, cached evidence from the canonical session date remains operationally valid regardless of wall-clock TTL.

**Technical debt:** Canonical evidence provenance is defined but not yet enforced in the provider write path. A `sessionClosed: boolean` shortcut is used instead of full `evidenceSessionDate === canonicalSessionDate` verification.

---

### 4. Recommendation Engine (Wheelwright)

**Owns:** Recommendation generation as a deterministic function of cached evidence + policy + portfolio state.

**Key modules:**
- `recommend.ts` — core recommendation engine
- `brief-builder.ts` — Wheelwright Brief view model builder

**Inputs (all from cache or runtime state):**
- Cached chain evidence (from Evidence Store)
- Portfolio snapshot (deployable cash, existing exposure)
- Recommendation policy (contract selection, ranking, deployment)
- Session classification (for eligibility gating)

**Outputs:**
- Ranked `PutCandidate[]` — top 20 recommendations
- `WheelwrightBriefViewModel` — decision-support artifact

**Invariant:** Zero provider calls. Recommendations are deterministic functions of their inputs.

**Domain concept:** "Wheelwright" represents the recommendation craftsmanship layer — the final inspection bench before committing capital.

---

### 5. Write Desk (Operator Workbench)

**Owns:** Operator workflow, UI composition, interaction model.

**Key modules:**
- `WriteDesk.tsx` — main component (3-band header + candidate board)
- `RecommendationBrief.tsx` — right-side drawer
- `FidelityUpload.tsx` — portfolio import

**Structure (3 compact bands + board):**
1. **Band 1:** Title, source selector, deployable cash, readiness, session state
2. **Band 2:** Portfolio summary (chips) + disclosure for full detail
3. **Band 3:** Scan button, policy controls, scan telemetry
4. **Candidate Board:** Recommendation table (sortable, selectable)
5. **Recommendation Brief:** Right-side drawer (decision summary, evidence, neighborhood, impact, provenance, broker handoff)

**Responsibilities:**
- Operator workflow orchestration
- Recommendation inspection (table + drawer)
- Policy controls (delta, DTE, ranking mode)
- Portfolio context (progressive disclosure)
- Row selection, keyboard navigation
- Broker handoff surface

**Must not:** Acquire evidence. Execute trades. Own recommendation logic.

---

### 6. Broker Handoff

**Owns:** Order intent construction and broker-specific URL generation.

**Key modules:**
- `write-intent.ts` — broker-neutral WriteIntent domain type
- `fidelity-trade-link.ts` — Fidelity adapter

**WriteIntent shape:**
```typescript
interface WriteIntent {
  underlyingSymbol: string;
  contractSymbol: string;       // Fidelity format: -XLE260717P56.5
  expiration: string;
  optionType: "put" | "call";
  strike: number;
  action: "sell-to-open";
  quantity: number;
  orderType: "limit";
  limitPrice: number;
  timeInForce: "day";
}
```

**Fidelity URL parameters (empirically verified):**
- `ORDER_TYPE=O`
- `ORDER_ACTION=SOPEN`
- `LIMIT_STOP_PRICE=<price>`
- `SECURITY_ID=<Fidelity option symbol>`
- `trade=rocfly`

**Execution boundary:** The system constructs the proposed order and opens Fidelity's pre-populated trade ticket. Fidelity is responsible for preview, validation, confirmation, and submission. The system must not submit orders, interact with credentials, or mutate portfolio state based on opening the link.

**Operator verification required:** Account, quantity, time in force, limit price, contract identity.

---

## Recommendation Policy (First-Class Domain Object)

```typescript
interface RecommendationPolicy {
  version: string;
  contractSelection: ContractSelectionPolicy;
  ranking: RankingPolicy;
}
```

**Contract Selection:**
- Target delta (default 0.30)
- Preferred delta band (0.25–0.35)
- Admissible delta range (0.15–0.50)
- Target DTE (21)
- Eligible DTE range (7–45)
- Execution exclusions (zero bid, extreme spread, zero OI)

**Ranking modes:**
- Execution First — prioritizes liquidity and tight spreads
- Balanced — composite of execution quality and yield
- Capital Efficiency — maximizes premium per dollar of collateral
- Yield First — maximizes annualized return

**Invariant:** Recommendation Rank and Presentation Sort are independent concepts. Changing column sort does not affect recommendation order.

---

## Market Session Model

**States (6):**
1. `PREMARKET` — before market open
2. `REGULAR_OPEN_DELAY` — market open but delayed data not yet meaningful
3. `REGULAR_OBSERVATION` — active session, accepting evidence
4. `DELAY_DRAIN` — session closing, draining delayed quotes
5. `CLOSED_CANONICAL` — session closed, evidence sealed
6. `NON_TRADING_DAY` — weekend/holiday

**Session gating:** Evidence acquisition is blocked during closed sessions. Recommendations use sealed canonical evidence.

**Trading calendar:** US market 2026 holidays and early-close days (1:15 PM ET for options).

---

## Candidate Universe

**Authoritative source:** Yahoo 496 ETFs (captured July 13, 2026).

**Supplementary:** PRIORITY_WATCHLIST (operator additions, non-authoritative).

**Universe management:** The Yahoo 496 is the production put universe. Velvet Rope (admission gating) remains a future bounded context.

---

## Design Principles

1. **Policy over prediction.** The system applies configurable policy rather than predicting market direction.
2. **Cache-backed recommendations.** Wheelwright never calls providers. All recommendations derive from cached evidence.
3. **Deterministic recommendation generation.** Same inputs → same outputs. No randomness, no hidden state.
4. **Recommendation rank independent of presentation sort.** The operator controls view order without affecting recommendation quality.
5. **Progressive disclosure.** Essential context visible; full detail one interaction away.
6. **Evidence before execution.** The system presents evidence and recommendations. The human decides.
7. **Human confirmation before broker submission.** The system opens a pre-populated ticket. The broker confirms and submits.
8. **Numbers are the product.** Numeric values dominate their labels visually. The operator's eye lands on values first.

---

## Technology Stack

| Component | Choice |
|-----------|--------|
| Framework | React 18+ with TypeScript (strict) |
| Build | Vite |
| Tests | Vitest (843+ tests across 57 files) |
| Storage | IndexedDB (durable cache), localStorage (workspace) |
| Provider | Tradier (sandbox, REST API, 15-min delayed) |
| Styling | CSS custom properties (centralized theme tokens) |
| State | React useState/useCallback/useMemo (no external library) |
| Routing | Lightweight pathname router (no library) |

---

## Test Coverage

| Layer | Tests | Approach |
|-------|-------|----------|
| Domain calculations | Unit | Pure functions, known inputs/outputs |
| Recommendation engine | Unit | Deterministic policy evaluation |
| Brief builder | Unit | View model construction, delta fit classification |
| Fidelity adapter | Unit | URL construction, symbol formatting, edge cases |
| Evidence provenance | Unit | Session gating, canonical write logic |
| Market session | Unit | 6-state classification, calendar, holidays |
| CSV parsers | Unit | Document detection, field extraction, edge cases |
| Scan orchestrator | Integration | Cache reads, candidate ranking |

---

## Relationship to Prior Architecture

The original Slice 1 architecture (`04-architecture.md`) described a simple options-chain viewer with mock data. That architecture remains historically accurate for the bootstrapping phase.

This document describes the system that now exists: an operational write desk with evidence acquisition, cache-backed recommendations, and broker handoff.

The following Slice 1 concepts have evolved:
- `MarketDataProvider` → Evidence Acquisition + Evidence Store
- `OptionsTable` → Recommendation Board (sortable, selectable, policy-aware)
- `MetricsPanel` → Recommendation Brief (drawer with 5 sections + broker handoff)
- `useOptionsChain` → `acquireEvidence` + `recommendPuts` (separated concerns)
- `DeltaInput` → Policy Strip (multi-parameter control)

The following concepts are new (no Slice 1 equivalent):
- Wheelwright (recommendation engine as named domain concept)
- WriteIntent / Broker Handoff
- Market Session Model (6-state)
- Evidence Provenance
- Progressive Disclosure layout
- Compact 3-band operational header
