# ProductStructure — Design

## Module Location

```
src/velvet-rope/
  product-structure.ts    — ProductStructure type + inference logic
  types.ts                — extended with ProductStructure in audit record
  evaluate.ts             — extended to compute and include structure
  aggregate.ts            — extended with structural caution logic
  narrative.ts            — extended with structural observation section
  policy.ts              — extended with structural policy criterion
```

No new module directory. ProductStructure is an enrichment concern consumed by Velvet Rope, colocated for simplicity.

## Inference Logic

```typescript
function inferProductStructure(symbol: string, name: string | null): ProductStructure
```

Input: symbol + name (from provider profile or Tradier underlying name).

Strategy:
1. Check name patterns for leveraged/inverse/daily-reset indicators
2. Check known issuer patterns (ProShares, Direxion → likely daily-reset if leveraged)
3. Check commodity/bond/fixed-income patterns
4. Return with `inferenceSource: "name_heuristic"` and appropriate confidence

Confidence rules:
- Multiple matching patterns → "medium"
- Single pattern match → "low"
- No patterns match → all false, confidence "low" (conventional assumption)
- Provider-confirmed (future FMP isEtf + industry) → "high"

## Velvet Rope Pipeline Extension

Current pipeline:
```
selectExpiration → fetchChain → selectContracts → evaluateCriteria → aggregate
```

Extended pipeline:
```
inferProductStructure → selectExpiration → fetchChain → selectContracts → evaluateCriteria → evaluateStructure → aggregate
```

`evaluateStructure` produces additional CriterionResult[] with structural cautions.

## Policy Extension

```typescript
// Added to AdmissionPolicy
structuralCaution: PolicyCriterion;  // { value: true, severity: "soft" }
```

When `structuralCaution.value === true` and the symbol is leveraged OR inverse OR dailyReset:
- Produce a CriterionResult with status "fail", severity "soft"
- This contributes to `manual_review` outcome per existing aggregation rules
- Never produces `reject` on its own (soft severity)

## Audit Record Extension

```typescript
// Added to AdmissionAuditRecord
productStructure: ProductStructure;
```

## Narrative Extension

When structural characteristics are present, add to EvaluationNarrative:
- `structuralObservations: string[]` — factual observations
- Include in `cautions[]` — structural warnings

Example for SOXS:
```
cautions: [
  "Leveraged ETF (3x) — structurally different from conventional underlyings",
  "Inverse product — assignment produces short-exposure position",
  "Daily-reset mechanism — value decay over time makes long-term hold hazardous",
  "Current policy treats structurally complex instruments conservatively"
]
```

## Implementation Order

1. `product-structure.ts` — type + inference function
2. `types.ts` — add ProductStructure to audit record, add structuralCaution to policy
3. `policy.ts` — add structuralCaution to default policy
4. `evaluate.ts` — compute ProductStructure, evaluate structural criteria
5. `aggregate.ts` — no change needed (existing soft-fail → manual_review works)
6. `narrative.ts` — add structural observations to narrative
7. Tests
8. Verify
