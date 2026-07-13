# Velvet Rope — Corrected Final Domain Model (First Slice)

## Bounded Context: Universe Management

Contains three distinct concepts:
- **Discovery** — find candidates from the broader ETF universe (DEFERRED)
- **Admission (Velvet Rope)** — evaluate candidates against explicit policy
- **Registry** — store members, their evaluation history, and admission audit

First slice: Admission + Registry. Discovery deferred.

---

## Core Entity: UniverseMember

A durable entity representing one ETF's full lifecycle within the institutional universe.

```typescript
interface UniverseMember {
  symbol: string;
  name: string;
  discoveredAt: string;                    // ISO date — when first entered registry
  discoverySource: DiscoverySource;

  // Current operator override (if any)
  operatorDisposition: OperatorDisposition;

  // Derived from audit records — NOT the source of truth
  latestSuccessfulEvaluation: AdmissionAuditRecord | null;
  latestAttempt: AdmissionAuditRecord | null;

  // Derived effective status
  effectiveStatus: EffectiveStatus;
  isStale: boolean;
}

type DiscoverySource = "bootstrap" | "manual" | "crawler";

type OperatorDisposition =
  | { type: "none" }
  | { type: "manual_admit"; reason: string; date: string }
  | { type: "manual_exclude"; reason: string; date: string };

type EffectiveStatus = "admitted" | "excluded" | "unevaluated";
```

**Key corrections:**
- `discoverySource` is provenance only — does NOT affect admission
- No "bootstrapped" disposition — bootstrapped members begin as `unevaluated`
- `latestSuccessfulEvaluation` and `latestAttempt` are derived from audit records
- `effectiveStatus` includes "unevaluated" for members never evaluated

---

## Append-Only Audit Record

The authoritative historical record. Never deleted, never capped in the domain model.

```typescript
interface AdmissionAuditRecord {
  // Identity
  id: string;                              // immutable audit ID (UUID or similar)
  runId: string;                           // which EvaluationRun produced this
  symbol: string;

  // Timestamps
  attemptedAt: string;                     // when this evaluation/attempt occurred

  // Attempt status — distinguishes completed evaluations from failures
  attemptStatus: EvaluationAttemptStatus;

  // Policy outcome (populated only when attemptStatus === "completed")
  outcome: AdmissionOutcome | null;

  // Effective status AFTER this record was created
  effectiveStatusAfter: EffectiveStatus;

  // Complete snapshots
  policySnapshot: AdmissionPolicy;
  evidenceProvenance: EvidenceProvenance;
  expirationSelection: ExpirationSelectionResult;
  callEvidence: OptionSideEvidence;
  putEvidence: OptionSideEvidence;
  aggregatedCriteria: CriterionResult[];

  // Operator state at time of record
  operatorDispositionAtTime: OperatorDisposition;

  // Explanation
  explanation: string;
}

type EvaluationAttemptStatus =
  | "completed"                // evaluation ran fully, outcome is populated
  | "evidence_incomplete"      // ran but critical evidence was unavailable
  | "provider_failed";         // could not run — provider error

type AdmissionOutcome =
  | "admit"
  | "reject"
  | "insufficient_evidence"
  | "manual_review";
```

**Key semantics:**
- Provider failures create audit records but do NOT overwrite the latest successful evaluation
- `latestSuccessfulEvaluation` = most recent record where `attemptStatus === "completed"`
- `latestAttempt` = most recent record regardless of attempt status
- Rejected ETFs remain visible in audit forever

---

## Evidence Provenance

Per-symbol, per-evaluation. NOT shared across a run.

```typescript
interface EvidenceProvenance {
  provider: string;                        // "tradier_sandbox" | "tradier_production" | "mock"
  observedAt: string | null;               // when market data was captured by the provider
  retrievedAt: string;                     // when our system obtained the data
  source: "network" | "cache";
  cacheAgeSeconds: number | null;
  delayedData: boolean;                    // true for sandbox / 15-min delayed data
}
```

---

## Expiration Selection

```typescript
interface ExpirationSelectionResult {
  status: "selected" | "no_usable_expiration";
  selectedDate: string | null;
  selectedDte: number | null;
  availableCount: number;
  searchRange: { minDte: number; maxDte: number };
}
```

---

## Option Side Evidence

```typescript
interface OptionSideEvidence {
  side: "call" | "put";
  selectedContract: ContractEvidence | null;
  selectionStatus: ContractSelectionStatus;
  criteria: CriterionResult[];
}

type ContractSelectionStatus =
  | "selected"
  | "no_contract_in_delta_range"
  | "greeks_unavailable"
  | "expiration_unavailable"
  | "no_valid_quotes";           // all contracts have zero bid

interface ContractEvidence {
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  spreadPercent: number;                   // spread / mid (guarded against zero mid)
  openInterest: number;
  volume: number;
  iv: number | null;
  annualizedYield: number;
  dte: number;
}
```

---

## Criterion Result

```typescript
interface CriterionResult {
  criterion: string;                       // e.g., "minOpenInterest"
  status: "pass" | "fail" | "unavailable" | "near_miss";
  measuredValue: number | string | null;
  threshold: number | string;
  severity: "hard" | "soft";
  explanation: string;
}
```

---

## Admission Policy

```typescript
interface AdmissionPolicy {
  version: string;
  createdAt: string;

  // Evidence selection
  expirationDteRange: { min: number; max: number };
  contractSelection: ContractSelectionPolicy;
  sideRequirement: "both" | "either" | "puts_only" | "calls_only";

  // Market quality (per-side criteria)
  minOpenInterest: PolicyCriterion;        // hard — stable, meaningful
  minOptionVolume: PolicyCriterion;        // soft/observational — see rationale below
  maxBidAskSpreadPercent: PolicyCriterion; // hard — relative spread (spread / mid)
  requireGreeks: PolicyCriterion;          // hard

  // Institutional suitability
  maxCapitalPerContract: PolicyCriterion;  // hard
  minCapitalPerContract: PolicyCriterion;  // soft

  // Income
  minYieldAtTargetDelta: PolicyCriterion;  // soft

  // Near-miss
  nearMissPercent: number;                 // e.g., 10 means within 10% of threshold
}

interface PolicyCriterion {
  value: number | boolean | null;
  severity: "hard" | "soft" | "observational";
}
```

**Volume severity rationale:** Daily option volume is strongly affected by time of day, day of week, and market regime. A zero-volume reading at 9:31am does not indicate an illiquid market. Open interest and relative spread are more stable indicators. Volume is initially `severity: "observational"` — displayed and recorded but does not contribute to admission decisions. Promote to "soft" only after repeated observations demonstrate stability.

---

## Contract Selection Policy

Reuses the same semantics as Opportunity Lab's existing contract selection to avoid conflicting interpretations of "target delta."

```typescript
interface ContractSelectionPolicy {
  targetDelta: number;
  deltaRange: { min: number; max: number };  // acceptable band around target
  putDeltaAbsolute: boolean;                 // true: compare |put.delta| against target
  excludeZeroBid: boolean;                   // true: skip contracts with bid === 0
  requireGreeks: boolean;                    // true: skip contracts with delta === 0 or null
  tieBreaker: "PreferOTM" | "PreferITM" | "PreferHigherOI";
}
```

**Intentional alignment:** Uses `findClosestToDelta` with the same `PreferOTM` tie-break logic as Opportunity Lab. No conflicting interpretation.

**Intentional difference from Opportunity Lab:** The delta range here is broader (e.g., 0.15–0.50) because Velvet Rope is asking "does a contract exist in a reasonable neighborhood?" not "which exact contract should I trade?" The Opportunity Lab targets a precise delta; the Velvet Rope validates that the market supports contract selection at all.

---

## Evaluation Run

Tracks one operator-triggered evaluation batch.

```typescript
interface EvaluationRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: "running" | "completed" | "partial" | "failed";
  policySnapshot: AdmissionPolicy;
  requestedSymbols: string[];
  completedSymbols: string[];
  failedSymbols: { symbol: string; reason: string }[];
  // Derived summary only — per-symbol provenance lives in audit records
  summaryProvenance: {
    provider: string;
    mixedSources: boolean;        // true if some from cache, some from network
    delayedData: boolean;
  };
}
```

---

## Universe Source

```typescript
type UniverseSource = "legacy_curated" | "velvet_rope";
```

First slice: fixed to `"legacy_curated"`. Cutover is a future deliberate action.

---

## Top-Level Persisted State

```typescript
interface VelvetRopeState {
  schemaVersion: 1;
  activePolicy: AdmissionPolicy;
  members: UniverseMember[];
  auditRecords: AdmissionAuditRecord[];   // append-only, never capped
  runs: EvaluationRun[];
  universeSource: UniverseSource;
  legacyCuratedUniverse: string[];
}
```

**Storage note:** localStorage is transitional prototype infrastructure. The domain model is storage-agnostic. Audit semantics must not be weakened by localStorage limitations. The future cloud/multi-user workstream will provide durable persistence.

---

## Effective Status Derivation Rules

```
effectiveStatus(member):
  if operatorDisposition.type === "manual_admit" → "admitted"
  if operatorDisposition.type === "manual_exclude" → "excluded"
  if operatorDisposition.type === "none":
    if latestSuccessfulEvaluation is null → "unevaluated"
    if latestSuccessfulEvaluation.outcome === "admit" → "admitted"
    else → "excluded"

latestSuccessfulEvaluation(member, auditRecords):
  most recent audit record for this symbol
  where attemptStatus === "completed"
  ordered by attemptedAt descending

latestAttempt(member, auditRecords):
  most recent audit record for this symbol
  regardless of attemptStatus

isStale(member, activePolicy):
  if latestSuccessfulEvaluation is null → true (never evaluated)
  if latestSuccessfulEvaluation.policySnapshot.version !== activePolicy.version → true
  else → false
```

---

## Evaluation Pipeline (Per Symbol)

```
1. Select Expiration
   Input: provider.getExpirations(symbol), policy.expirationDteRange
   Output: ExpirationSelectionResult
   Failure: status = "no_usable_expiration"
            → both sides get selectionStatus: "expiration_unavailable"
            → attemptStatus = "evidence_incomplete"

2. Fetch Chain
   Input: provider.getOptionsChain(symbol, selectedExpiration)
   Provider failure: → attemptStatus = "provider_failed", no outcome
   
3. Select Call Contract
   Input: chain.calls, policy.contractSelection
   Failure modes:
     - greeks_unavailable (all deltas are 0/null)
     - no_contract_in_delta_range (nothing within policy.contractSelection.deltaRange)
     - no_valid_quotes (all bids are 0)

4. Select Put Contract
   Input: chain.puts, policy.contractSelection
   Same failure modes as calls

5. Evaluate Per-Side Criteria
   For each side with selectionStatus === "selected":
     - openInterest vs policy.minOpenInterest
     - volume vs policy.minOptionVolume (observational)
     - spreadPercent vs policy.maxBidAskSpreadPercent
     - yield vs policy.minYieldAtTargetDelta

6. Evaluate Cross-Side Criteria
   - capitalPerContract (putStrike × 100) vs policy.maxCapitalPerContract
   - capitalPerContract vs policy.minCapitalPerContract
   - requireGreeks vs greeks availability

7. Aggregate Outcome
   Apply sideRequirement + severity rules + near-miss detection
```

---

## Aggregation Rules

```
For each CriterionResult:
  "fail" with severity "hard"  → hard_failure
  "fail" with severity "soft"  → soft_failure
  "unavailable"                → evidence_gap
  "near_miss"                  → near_miss
  "pass"                       → pass
  severity "observational"     → ignored for outcome (recorded only)

Side requirement application:
  if sideRequirement === "both":
    if either side has selectionStatus !== "selected" → insufficient_evidence
    evaluate both sides independently
  if sideRequirement === "either":
    at least one side must have selectionStatus === "selected"
    best side's criteria determine outcome
  if sideRequirement === "puts_only" / "calls_only":
    only specified side evaluated

Outcome determination:
  if any hard_failure → "reject"
  if any evidence_gap (and no hard failures) → "insufficient_evidence"
  if any near_miss or soft_failure (and no hard failures, no gaps) → "manual_review"
  else → "admit"

Near-miss detection:
  for numeric thresholds: if measured value fails but within
  (threshold × nearMissPercent / 100) → "near_miss" instead of "fail"
```

---

## Failure and Partial-Run Behavior

**Provider failure for one symbol:**
- Audit record created with `attemptStatus: "provider_failed"`
- Does NOT overwrite `latestSuccessfulEvaluation`
- Symbol added to `EvaluationRun.failedSymbols`
- Run continues with remaining symbols

**Evidence incomplete (e.g., no expiration, no contracts in range):**
- Audit record with `attemptStatus: "evidence_incomplete"`
- Outcome may be `"insufficient_evidence"` if evaluation logic ran but couldn't measure
- This IS a completed evaluation of sorts — it does update `latestSuccessfulEvaluation`

**All symbols fail:**
- Run status = `"failed"`
- Individual audit records still created for each failed attempt

**Mid-run state:**
- Run status = `"running"` while in progress
- UI shows progressive results (same pattern as Opportunity Lab scan)
- If interrupted (page navigation), run remains `"running"` — next page load can detect and display
