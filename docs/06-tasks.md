# Options Prototype — Slice 1 Implementation Tasks

## Purpose

Ordered implementation tasks for Slice 1. Each task produces a verifiable artifact. Tasks are sequenced so that each builds on the previous, and the domain is validated before UI work begins.

---

## Task Sequence

### Phase 1: Project Scaffolding

#### T-01: Initialize Vite + React + TypeScript project

**Produces:** Working `npm run dev` with default Vite template.

**Steps:**
1. Run `npm create vite@latest` with React + TypeScript template.
2. Verify `npm install` completes.
3. Verify `npm run dev` starts and serves the default page.
4. Add `.nvmrc` with current Node LTS version.

**Verification:** `npm run dev` serves a page on localhost.

**Traceability:** Environment Contract (READY FOR FRONTEND gate).

---

#### T-02: Configure Vitest

**Produces:** Working test runner with a passing placeholder test.

**Steps:**
1. Install `vitest` as a dev dependency.
2. Add `test` script to `package.json`.
3. Create `tests/domain/placeholder.test.ts` with a trivial assertion.
4. Verify `npm test` passes.

**Verification:** `npm test` runs and reports 1 passing test.

**Traceability:** 04-architecture.md (Test Strategy), 05-design.md (Test Runner).

---

### Phase 2: Domain Layer

#### T-03: Implement domain types

**Produces:** `src/domain/types.ts`

**Steps:**
1. Create `src/domain/types.ts` with all type definitions from 05-design.md (Domain Type Definitions section).
2. Verify TypeScript compiles without errors.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 02-domain.md (Domain Objects), 05-design.md (Domain Type Definitions).

---

#### T-04: Implement calculation functions

**Produces:** `src/domain/calculations.ts`

**Steps:**
1. Create `src/domain/calculations.ts` implementing BR-1 through BR-5 as specified in 05-design.md.
2. Each function has a JSDoc comment referencing its business rule.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 02-domain.md (BR-1 through BR-5), 05-design.md (Calculation Module Design).

---

#### T-05: Implement calculation tests

**Produces:** `tests/domain/calculations.test.ts`

**Steps:**
1. Write tests for all cases in 05-design.md (Domain Calculation Tests table).
2. Verify all tests pass.

**Verification:** `npm test` — all calculation tests green.

**Traceability:** 05-design.md (Test Design — Domain Calculation Tests).

---

#### T-06: Implement policy module

**Produces:** `src/domain/policy.ts`

**Steps:**
1. Create `src/domain/policy.ts` with `DeltaTieBreaker` type, `DeltaPolicy` interface, `DEFAULT_DELTA_POLICY` constant, and `resolveTieBreaker` function as specified in 05-design.md.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 05-design.md (Policy Domain section).

---

#### T-07: Implement policy tests

**Produces:** `tests/domain/policy.test.ts`

**Steps:**
1. Write tests for all cases in 05-design.md (Policy Tests table).
2. Verify all tests pass.

**Verification:** `npm test` — all policy tests green.

**Traceability:** 05-design.md (Test Design — Policy Tests).

---

#### T-08: Implement delta matching module

**Produces:** `src/domain/delta.ts`

**Steps:**
1. Create `src/domain/delta.ts` with `findClosestToDelta` function as specified in 05-design.md.
2. Uses `resolveTieBreaker` from policy module — does not hard-code preference.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 02-domain.md (BR-6), 05-design.md (Delta Matching Module).

---

#### T-09: Implement delta matching tests

**Produces:** `tests/domain/delta.test.ts`

**Steps:**
1. Write tests for all cases in 05-design.md (Delta Matching Tests table).
2. Include tie-breaker policy variation tests.
3. Verify all tests pass.

**Verification:** `npm test` — all delta tests green.

**Traceability:** 05-design.md (Test Design — Delta Matching Tests).

---

#### T-10: Implement MarketDataProvider interface

**Produces:** `src/domain/provider.ts`

**Steps:**
1. Create `src/domain/provider.ts` with async `MarketDataProvider` interface as specified in 05-design.md.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 04-architecture.md (MarketDataProvider Interface), 05-design.md (MarketDataProvider Interface).

---

### Phase 3: Mock Data Provider

#### T-11: Create mock data JSON files

**Produces:** `src/providers/mock/data/spy.json`, `qqq.json`, `iwm.json`

**Steps:**
1. Create JSON files conforming to the mock data shape in 05-design.md.
2. Each file has 3 expirations with 10 calls and 10 puts each.
3. Verify data consistency rules (delta ordering, bid < ask, spread ranges).
4. Use realistic prices: SPY ~$545, QQQ ~$475, IWM ~$205.

**Verification:** Manual review of JSON structure and consistency.

**Traceability:** 02-domain.md (Mock Data Contract), 05-design.md (Mock Data Shape).

---

#### T-12: Implement MockMarketDataProvider

**Produces:** `src/providers/mock/MockMarketDataProvider.ts`, `src/providers/index.ts`

**Steps:**
1. Implement `MockMarketDataProvider` class conforming to `MarketDataProvider` interface.
2. Maps raw JSON into domain types (sets `type` to `"CALL"` / `"PUT"`).
3. Computes DTE dynamically from current date.
4. All methods return `Promise.resolve(...)`.
5. Create `src/providers/index.ts` exporting the mock provider instance.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 05-design.md (MarketDataProvider Interface), 05a-component-map.md (MockMarketDataProvider).

---

#### T-13: Implement mock provider tests

**Produces:** `tests/providers/mock.test.ts`

**Steps:**
1. Write tests for all cases in 05-design.md (Mock Provider Tests table).
2. Verify type field is populated, deltas are in range, bid < ask, promises resolve.

**Verification:** `npm test` — all provider tests green.

**Traceability:** 05-design.md (Test Design — Mock Provider Tests).

---

### Phase 4: Hooks

#### T-14: Implement useOptionsChain hook

**Produces:** `src/hooks/useOptionsChain.ts`

**Steps:**
1. Implement hook as specified in 05-design.md (State Management — useOptionsChain).
2. Accepts `MarketDataProvider` as parameter.
3. Manages async loading state.
4. Auto-selects first underlying and first expiration on mount.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 05-design.md (State Management Approach), 05a-component-map.md (useOptionsChain).

---

#### T-15: Implement useTargetDelta hook

**Produces:** `src/hooks/useTargetDelta.ts`

**Steps:**
1. Implement hook as specified in 05-design.md (State Management — useTargetDelta).
2. Manages `DeltaPolicy` state.
3. Clamps targetDelta to [0.01, 0.99].
4. Defaults to `DEFAULT_DELTA_POLICY`.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** 05-design.md (State Management Approach), 05a-component-map.md (useTargetDelta).

---

### Phase 5: UI Components

#### T-16: Implement UnderlyingSelector component

**Produces:** `src/components/UnderlyingSelector.tsx`

**Steps:**
1. Implement as specified in 05-design.md and 05a-component-map.md.
2. Renders select with ETF symbols and displays current price.

**Verification:** Component renders without errors (visual check via dev server).

**Traceability:** US-1, 05a-component-map.md (UnderlyingSelector).

---

#### T-17: Implement ExpirationSelector component

**Produces:** `src/components/ExpirationSelector.tsx`

**Steps:**
1. Implement as specified in 05-design.md and 05a-component-map.md.
2. Renders select with formatted labels ("Jul 18 (7 DTE)").

**Verification:** Component renders without errors.

**Traceability:** US-2, 05a-component-map.md (ExpirationSelector).

---

#### T-18: Implement DeltaInput component

**Produces:** `src/components/DeltaInput.tsx`

**Steps:**
1. Implement as specified in 05-design.md and 05a-component-map.md.
2. Number input with step=0.01, min=0.01, max=0.99, label "Target Delta".

**Verification:** Component renders without errors.

**Traceability:** US-5, 05a-component-map.md (DeltaInput).

---

#### T-19: Implement OptionsTable component

**Produces:** `src/components/OptionsTable.tsx`

**Steps:**
1. Implement as specified in 05-design.md and 05a-component-map.md.
2. Calls `midPrice()` and `moneyness()` from domain/calculations for display.
3. Sorts by strike in specified direction.
4. Highlights row matching `highlightedStrike`.
5. Formats prices (2dp), delta (2dp), OI/volume (comma-separated).

**Verification:** Component renders without errors. Highlighted row visually distinct.

**Traceability:** US-3, US-4, 05a-component-map.md (OptionsTable).

---

#### T-20: Implement MetricsPanel component

**Produces:** `src/components/MetricsPanel.tsx`

**Steps:**
1. Implement as specified in 05-design.md and 05a-component-map.md.
2. Calls domain calculation functions for all 5 metrics.
3. Determines collateral from `contract.type`.
4. Shows placeholder when contract is null.

**Verification:** Component renders without errors. Metrics display correct values for known inputs.

**Traceability:** US-6, 05a-component-map.md (MetricsPanel).

---

### Phase 6: Integration

#### T-21: Implement App.tsx (composition)

**Produces:** `src/App.tsx`, `src/App.css`

**Steps:**
1. Compose `useOptionsChain` and `useTargetDelta` hooks.
2. Wire `findClosestToDelta` to derive highlighted contracts.
3. Distribute state and callbacks to all child components.
4. Layout per wireframe in 05-design.md.
5. Basic CSS for layout, table styling, and row highlighting.

**Verification:** Full application renders. All interactions work (select ETF, select expiration, change delta, see highlighting and metrics).

**Traceability:** All user stories (US-1 through US-6).

---

#### T-22: End-to-end manual validation

**Produces:** Verified working application.

**Steps:**
1. Run `npm run dev`.
2. Verify US-1: Select each ETF, price updates.
3. Verify US-2: Select each expiration, DTE shown, tables update.
4. Verify US-3: Calls table renders with correct columns, sorted ascending.
5. Verify US-4: Puts table renders with correct columns, sorted descending.
6. Verify US-5: Change target delta, highlighted row changes.
7. Verify US-6: Metrics panel shows correct values for highlighted contracts.
8. Spot-check one calculation against hand-computed expected value.

**Verification:** All 6 user stories satisfied. No console errors.

**Traceability:** 03-requirements.md (Success Criteria).

---

## Task Dependency Graph

```
T-01 → T-02 → T-03 → T-04 → T-05
                 │       │
                 │       ├→ T-06 → T-07
                 │       │
                 │       └→ T-08 → T-09
                 │
                 └→ T-10 → T-11 → T-12 → T-13
                                     │
                                     ├→ T-14 ─┐
                                     │         │
                                     └→ T-15 ─┤
                                               │
                              T-16 ─┐          │
                              T-17 ─┤          │
                              T-18 ─┼──→ T-21 → T-22
                              T-19 ─┤
                              T-20 ─┘
```

**Critical path:** T-01 → T-02 → T-03 → T-10 → T-11 → T-12 → T-14 → T-21 → T-22

---

## Completion Criteria

All tasks complete when:
- `npm test` passes with all domain and provider tests green.
- `npm run dev` serves the application without errors.
- All 6 user stories are manually verifiable.
- No TypeScript compilation errors (`npx tsc --noEmit`).


---

## Velvet Rope — First Slice Tasks

### Status: Ready for implementation

Requirements: `docs/velvet-rope/01-requirements.md`
Design: `docs/velvet-rope/02-design.md`
Domain model: `docs/velvet-rope/00-domain-model.md`

---

### Phase VR-1: Domain Types and Policy

#### VR-T01: Implement Velvet Rope domain types

**Produces:** `src/velvet-rope/types.ts`

**Steps:**
1. Implement all types from `00-domain-model.md`: UniverseMember, AdmissionAuditRecord, EvaluationAttemptStatus, AdmissionOutcome, OperatorDisposition, EffectiveStatus, EvidenceProvenance, ExpirationSelectionResult, OptionSideEvidence, ContractEvidence, ContractSelectionStatus, CriterionResult, AdmissionPolicy, PolicyCriterion, ContractSelectionPolicy, EvaluationRun, VelvetRopeState.
2. Verify TypeScript compiles.

**Verification:** `npx tsc --noEmit` passes.

**Traceability:** VR-1, VR-2, VR-10, VR-11, VR-12.

---

#### VR-T02: Implement default admission policy

**Produces:** `src/velvet-rope/policy.ts`

**Steps:**
1. Define DEFAULT_ADMISSION_POLICY constant per design doc.
2. Export policy creation utility (version stamping).

**Verification:** TypeScript compiles. Policy importable.

**Traceability:** VR-2, VR-3, VR-19.

---

### Phase VR-2: Evaluation Pipeline

#### VR-T03: Implement expiration selection

**Produces:** `selectExpiration()` in `src/velvet-rope/evaluate.ts`

**Steps:**
1. Filter expirations by policy DTE range.
2. Pick longest within range (same logic as Opportunity Lab DTE behavior).
3. Return ExpirationSelectionResult.

**Verification:** Unit tests with various expiration lists.

**Traceability:** VR-5 (step 1).

---

#### VR-T04: Implement contract selection for admission

**Produces:** `selectAdmissionContract()` in `src/velvet-rope/evaluate.ts`

**Steps:**
1. Filter contracts: exclude zero-bid, exclude no-greeks (when policy requires).
2. Apply delta range bounds from ContractSelectionPolicy.
3. Reuse `findClosestToDelta` with policy tie-breaker.
4. Return selected contract or appropriate selection status.

**Verification:** Unit tests for each failure mode (no_contract_in_delta_range, greeks_unavailable, no_valid_quotes).

**Traceability:** VR-5 (steps 3-4), VR-6.

---

#### VR-T05: Implement per-side criteria evaluation

**Produces:** `evaluatePerSideCriteria()` in `src/velvet-rope/evaluate.ts`

**Steps:**
1. Evaluate OI, volume (observational), spread, yield against policy thresholds.
2. Apply near-miss detection.
3. Return CriterionResult[].

**Verification:** Unit tests for pass, fail, near-miss, and observational outcomes.

**Traceability:** VR-5 (step 5), VR-7, VR-8, VR-19.

---

#### VR-T06: Implement cross-side criteria and aggregation

**Produces:** `evaluateCrossSideCriteria()` and `aggregateOutcome()` in `src/velvet-rope/aggregate.ts`

**Steps:**
1. Evaluate capital and greeks criteria.
2. Implement aggregation rules: hard fail → reject, evidence gap → insufficient, near-miss → manual_review, all pass → admit.
3. Apply sideRequirement logic.

**Verification:** Unit tests for each outcome path. SPY fixture (passes market quality, fails capital).

**Traceability:** VR-5 (steps 6-7), VR-7, VR-8.

---

#### VR-T07: Implement full evaluateSymbol pipeline

**Produces:** `evaluateSymbol()` in `src/velvet-rope/evaluate.ts`

**Steps:**
1. Compose expiration selection → chain fetch → contract selection → criteria → aggregation.
2. Create AdmissionAuditRecord with complete snapshots.
3. Handle provider failure: return audit record with attemptStatus "provider_failed".
4. Handle evidence gaps: return audit record with attemptStatus "evidence_incomplete".

**Verification:** Integration tests using mock provider. Test provider failure non-overwrite semantics.

**Traceability:** VR-4, VR-5, VR-9, VR-10, VR-11.

---

### Phase VR-3: Registry and Audit

#### VR-T08: Implement registry operations

**Produces:** `src/velvet-rope/registry.ts`

**Steps:**
1. Bootstrap: create 16 UniverseMembers from curated list + SPY.
2. Effective status derivation from audit records + operator disposition.
3. Stale detection (policy version comparison).
4. Operator override application.
5. Universe comparison (legacy vs. velvet rope).

**Verification:** Unit tests for derivation rules, override precedence, stale detection.

**Traceability:** VR-1, VR-12, VR-13, VR-14, VR-15.

---

#### VR-T09: Implement audit operations

**Produces:** `src/velvet-rope/audit.ts`

**Steps:**
1. Create audit record (append to history).
2. Query: latest successful evaluation per symbol.
3. Query: latest attempt per symbol.
4. Query: all records for a symbol (for audit view).
5. Query: all records (filterable by outcome, status, symbol).

**Verification:** Unit tests for query correctness, especially provider_failed non-overwrite.

**Traceability:** VR-10, VR-11, VR-21.

---

#### VR-T10: Implement persistence

**Produces:** `src/velvet-rope/persistence.ts`

**Steps:**
1. Implement VelvetRopeStore interface.
2. LocalStorageVelvetRopeStore: load/save with schema version.
3. Initialize from persisted state or bootstrap fresh.

**Verification:** Unit test: save → load roundtrip preserves state.

**Traceability:** VR-18.

---

### Phase VR-4: Page and Integration

#### VR-T11: Build Velvet Rope page component

**Produces:** `src/components/VelvetRope.tsx` and sub-components

**Steps:**
1. Registry section: member table, status badges, universe comparison.
2. Audit section: filterable history table.
3. Policy section: policy display, staleness, evaluate button.
4. Expanded detail per symbol: full criteria breakdown, call/put evidence.
5. Progressive evaluation display.
6. Operator override UI.

**Verification:** Manual interaction verification. Meets page information architecture from design doc.

**Traceability:** VR-20, VR-21, VR-4, VR-13, VR-15.

---

#### VR-T12: Wire into App.tsx

**Produces:** "Velvet Rope" tab in navigation.

**Steps:**
1. Add "velvetrope" to ViewMode union.
2. Add tab button.
3. Add view switch rendering.
4. Persist activeTab to workspace.

**Verification:** Tab navigable, persists across reloads.

**Traceability:** VR-16 (parallel observation, not cutover).

---

#### VR-T13: Final verification

**Produces:** Clean build.

**Steps:**
1. TypeScript passes (`npx tsc --noEmit`).
2. All existing tests pass (338+).
3. All new Velvet Rope tests pass.
4. Production build succeeds (`npm run build`).
5. Manual walkthrough of acceptance criteria.

**Verification:** All 13 acceptance criteria from requirements doc satisfied.

**Traceability:** All VR requirements.

---

## Deferred Workstreams

### Universe Discovery (Crawler)

- Automated ETF universe scanning via API Ninjas or similar
- Incremental crawl strategy with rate-limit budget
- Re-evaluation scheduling
- Candidate notification ("new ETF passed the Velvet Rope")
- Watch/Suspended/Revoked lifecycle states
- Rolling-average observation criteria

**Prerequisite:** Velvet Rope first slice proven useful through operator interaction.

---

### Opportunity Lab Cutover

- Replace `CURATED_UNIVERSE` constant with registry query
- UniverseSource switch from "legacy_curated" to "velvet_rope"
- Reversible cutover mechanism
- Validation: Opportunity Lab behavior unchanged for admitted symbols

**Prerequisite:** Velvet Rope effective universe demonstrates credible behavior over multiple evaluation cycles.

---

### Cloud / Multi-User Persistence

- Workspace ownership model
- Durable audit storage (not localStorage)
- Multi-device access
- Conflict resolution for concurrent edits
- Authentication and authorization

**Prerequisite:** Domain model stable. Separate architectural design required.

---

### Scenario Replay — Second Slice

- Additional scenario chains (full ladder, simultaneous assignments, etc.)
- Incremental ingestion mode
- Position checkpoint reconciliation
- Real user activity CSV upload through production pipeline
- Recommendation integration with projected state

**Prerequisite:** First scenario replay slice validated through use.
