# Velvet Rope — Design (First Slice)

## Purpose

Define the software design that satisfies the Velvet Rope requirements (`01-requirements.md`) using the domain model (`00-domain-model.md`).

This document describes module structure, data flow, evaluation logic, persistence strategy, UI architecture, and integration boundaries.

---

## Module Structure

```
src/
  velvet-rope/
    types.ts              — Domain types (entity, value objects, policy)
    policy.ts             — Default policy, policy creation/versioning
    evaluate.ts           — Evaluation pipeline (per-symbol)
    aggregate.ts          — Outcome aggregation rules
    registry.ts           — Registry operations (bootstrap, add, override)
    audit.ts              — Audit record creation, querying, derivation
    persistence.ts        — localStorage read/write (storage-agnostic interface)
    
  components/
    VelvetRope.tsx        — Page component (orchestrates sections)
    VelvetRopeRegistry.tsx    — Registry table section
    VelvetRopeAudit.tsx       — Audit history section
    VelvetRopePolicy.tsx      — Policy display and actions
    VelvetRopeDetail.tsx      — Expanded per-symbol detail panel
    VelvetRopeComparison.tsx  — Legacy vs. Velvet Rope universe diff

  tests/
    velvet-rope/
      evaluate.test.ts
      aggregate.test.ts
      registry.test.ts
      audit.test.ts
```

---

## Data Flow

```
Operator clicks "Evaluate Registry"
        │
        ▼
Create EvaluationRun (status: running)
        │
        ▼
For each symbol (sequential, progressive):
        │
        ├─► getExpirations(symbol) ─► select expiration
        │        failure → audit record (provider_failed), continue
        │
        ├─► getOptionsChain(symbol, expiration) ─► select contracts
        │        failure → audit record (provider_failed), continue
        │
        ├─► evaluatePerSideCriteria(callContract, putContract, policy)
        │
        ├─► evaluateCrossSideCriteria(putStrike, policy)
        │
        ├─► aggregateOutcome(criteria, sideRequirement)
        │
        ├─► create AdmissionAuditRecord (append-only)
        │
        ├─► update UniverseMember derived fields
        │
        └─► emit progressive UI update
        
        ▼
Complete EvaluationRun (status: completed | partial | failed)
        │
        ▼
Persist to localStorage
```

---

## Evaluation Logic Design

### evaluateSymbol(symbol, provider, policy) → AdmissionAuditRecord

Pure logic with async provider access. Returns one audit record per symbol.

```typescript
async function evaluateSymbol(
  symbol: string,
  provider: MarketDataProvider,
  policy: AdmissionPolicy,
  runId: string,
  operatorDisposition: OperatorDisposition
): Promise<AdmissionAuditRecord>
```

**Step 1: Select Expiration**

```typescript
function selectExpiration(
  expirations: Expiration[],
  dteRange: { min: number; max: number }
): ExpirationSelectionResult
```

Logic: filter to DTE range, pick longest within range (same as Opportunity Lab DTE behavior). Fall back to nearest usable if none in range.

**Step 2: Select Contract**

Reuse existing `findClosestToDelta` from `src/domain/delta.ts`. Wrap with additional filtering:
- Exclude zero-bid contracts
- Exclude contracts without meaningful greeks (when policy requires)
- Apply delta range bounds

```typescript
function selectAdmissionContract(
  contracts: OptionContract[],
  selectionPolicy: ContractSelectionPolicy
): { contract: OptionContract | null; status: ContractSelectionStatus }
```

**Step 3: Evaluate Per-Side Criteria**

```typescript
function evaluatePerSideCriteria(
  contract: ContractEvidence,
  policy: AdmissionPolicy,
  dte: number
): CriterionResult[]
```

Produces one CriterionResult per applicable criterion:
- openInterest vs minOpenInterest
- volume vs minOptionVolume (observational — always "pass" for outcome purposes)
- spreadPercent vs maxBidAskSpreadPercent
- annualizedYield vs minYieldAtTargetDelta

**Step 4: Evaluate Cross-Side Criteria**

```typescript
function evaluateCrossSideCriteria(
  putStrike: number | null,
  greeksAvailable: boolean,
  policy: AdmissionPolicy
): CriterionResult[]
```

- capitalPerContract (putStrike × 100) vs maxCapitalPerContract
- capitalPerContract vs minCapitalPerContract
- greeks availability vs requireGreeks

**Step 5: Aggregate**

```typescript
function aggregateOutcome(
  callEvidence: OptionSideEvidence,
  putEvidence: OptionSideEvidence,
  crossCriteria: CriterionResult[],
  policy: AdmissionPolicy
): AdmissionOutcome
```

Rules defined in domain model. Near-miss detection applied during aggregation.

---

## Persistence Design

### Interface (storage-agnostic)

```typescript
interface VelvetRopeStore {
  load(): VelvetRopeState | null;
  save(state: VelvetRopeState): void;
}
```

### localStorage Implementation

```typescript
const STORAGE_KEY = "options-prototype:velvet-rope";

class LocalStorageVelvetRopeStore implements VelvetRopeStore {
  load(): VelvetRopeState | null { /* JSON.parse from localStorage */ }
  save(state: VelvetRopeState): void { /* JSON.stringify to localStorage */ }
}
```

**Size management:** With 16 members and ~3KB per audit record, 100 evaluations ≈ 50KB. Well within localStorage limits for the prototype phase. No capping in the domain — only the UI may paginate display.

**Migration:** `schemaVersion` field enables future schema evolution without data loss.

---

## Default Admission Policy (First Slice)

```typescript
const DEFAULT_ADMISSION_POLICY: AdmissionPolicy = {
  version: "v1",
  createdAt: "2026-07-10",

  expirationDteRange: { min: 7, max: 45 },
  contractSelection: {
    targetDelta: 0.30,
    deltaRange: { min: 0.15, max: 0.50 },
    putDeltaAbsolute: true,
    excludeZeroBid: true,
    requireGreeks: true,
    tieBreaker: "PreferOTM",
  },
  sideRequirement: "both",

  minOpenInterest: { value: 50, severity: "hard" },
  minOptionVolume: { value: 10, severity: "observational" },
  maxBidAskSpreadPercent: { value: 15, severity: "hard" },
  requireGreeks: { value: true, severity: "hard" },

  maxCapitalPerContract: { value: 60000, severity: "hard" },
  minCapitalPerContract: { value: 2000, severity: "soft" },

  minYieldAtTargetDelta: { value: 5, severity: "soft" },

  nearMissPercent: 15,
};
```

**Rationale for threshold choices:**
- OI ≥ 50: filters truly illiquid options while passing most sector ETFs
- Spread ≤ 15%: prevents evaluation of markets where execution would be poor
- Capital $2k–$60k: excludes penny stocks and SPY-scale underlyings from institutional use
- Yield ≥ 5%: soft minimum — below this the overlay isn't generating meaningful income
- Near-miss 15%: generous tolerance to avoid false rejections on sandbox data
- Volume observational: recorded but not counted until stability is demonstrated

---

## Page Information Architecture

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ VELVET ROPE                            [Evaluate Registry]       │
│ Policy: v1 (2026-07-10) | Source: legacy_curated                │
│ Last Run: completed 2026-07-10 14:30 (16 symbols, 0 failed)    │
│ ⚠ 3 evaluations stale (policy changed since last run)           │
├───────────┬─────────────────────────────────────────────────────┤
│ Sections: │  [Registry]  [Audit]  [Policy]                      │
├───────────┴─────────────────────────────────────────────────────┤
│                                                                   │
│ << Active section content >>                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Registry Section

- Summary: X admitted, Y excluded, Z unevaluated
- Universe comparison panel (legacy vs. velvet rope diff)
- Sortable table: Symbol, Name, Effective Status, Policy Outcome, Call Summary, Put Summary, Last Evaluated, Stale?, Override
- Expandable detail per symbol showing full criteria breakdown
- Override buttons per symbol

### Audit Section

- Sortable/filterable table of all audit records
- Columns: Date, Symbol, Attempt Status, Outcome, Effective After, Reason, Policy Ver, Call, Put, Evidence Age, Override, Run
- Filters: outcome type, attempt status, symbol, date range
- No delete, no cap — full history visible

### Policy Section

- Active policy displayed as readable table
- Staleness indicator
- "Evaluate Registry" action button
- Last run summary
- Future: policy editor (not first slice — policy is code-defined initially)

---

## Integration Points

### With Existing Provider Infrastructure

- Reuses `MarketDataProvider` interface (getExpirations, getOptionsChain)
- Reuses `TradierProvider` singleton (benefits from ResponseCache TTL)
- Reuses `findClosestToDelta` from `src/domain/delta.ts`
- Reuses `midPrice`, `annualizedYield` from `src/domain/calculations.ts`
- Does NOT share Opportunity Lab's scan cache (different lifecycle)

### With Opportunity Lab

- First slice: no integration. Parallel observation only.
- Future: `CURATED_UNIVERSE` replaced by registry query where `effectiveStatus === "admitted"`
- The `UniverseSource` type models this boundary explicitly

### With App.tsx

- New tab "Velvet Rope" added to ViewMode union
- New route in the view switch
- Persists activeTab to workspace

---

## Testing Strategy

### Unit Tests (pure functions)

- `evaluate.test.ts` — pipeline steps: expiration selection, contract selection, per-side criteria, cross-side criteria
- `aggregate.test.ts` — outcome aggregation: hard fail → reject, evidence gap → insufficient, near-miss → manual_review, all pass → admit
- `registry.test.ts` — bootstrap, effective status derivation, operator override precedence
- `audit.test.ts` — record creation, latest-successful derivation, provider-failure non-overwrite semantics

### Integration Tests

- Full pipeline: CSV-shaped mock chain → evaluation → audit record → derived status
- Policy change → stale detection
- Partial run behavior (one symbol fails, others succeed)

### What NOT to test

- Tradier API behavior (tested elsewhere)
- UI rendering (manual verification for first slice)
- localStorage serialization (trivial, tested implicitly)

---

## Implementation Order

1. Types (`types.ts`) — all domain types from the model
2. Policy (`policy.ts`) — default policy constant
3. Evaluation pipeline (`evaluate.ts`) — per-symbol evaluation logic
4. Aggregation (`aggregate.ts`) — outcome determination
5. Registry (`registry.ts`) — bootstrap, derivation, override
6. Audit (`audit.ts`) — record creation, querying
7. Persistence (`persistence.ts`) — localStorage adapter
8. Tests for steps 3–6
9. Page component (`VelvetRope.tsx` + sub-components)
10. Wire into App.tsx
11. Verify: typecheck, all tests, build

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Sequential evaluation (not parallel) | Respects Tradier rate limits, same pattern as Opportunity Lab |
| Audit records append-only | Institutional memory must never be lost; rejected ETFs remain visible |
| Policy snapshot per audit record | Enables historical explanation without mutable reference |
| Provenance per symbol (not per run) | Run may mix cache and network; symbol-level provenance is truthful |
| Volume as observational | Time-of-day sensitivity makes it unreliable for admission in single-snapshot mode |
| Bootstrapped ≠ admitted | Velvet Rope must be able to reject a bootstrapped ETF to prove it works |
| No auto-evaluation on policy change | Separation of concerns; operator controls when API budget is spent |
| localStorage transitional | Domain model is storage-agnostic; cloud persistence is a separate workstream |
| Broader delta range than Opportunity Lab | Velvet Rope asks "is this market viable?" not "which exact contract?" |
| Reuse findClosestToDelta | Single interpretation of delta selection across the system |
