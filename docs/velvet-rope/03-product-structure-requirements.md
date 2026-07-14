# ProductStructure — Requirements

## Purpose

Add factual product-structure classification to the enrichment boundary so that Velvet Rope can distinguish structurally complex instruments (leveraged, inverse, daily-reset) from conventional ETFs, and communicate those distinctions in its evaluation.

## Scope

### In Scope

- ProductStructure value object (factual characteristics)
- Name-based inference logic for structural classification
- Integration into Velvet Rope evaluation pipeline
- Structural cautions in diagnostic narrative
- Conservative policy posture (manual_review, not hard rejection)

### Out of Scope

- Strategy Authorization / Operating Modes
- Instrument Governance layer
- Hard exclusion rules for leveraged/inverse
- New data providers
- Capital policy redesign
- Assignment policy

---

## Requirements

### PS-1: ProductStructure Type

Define a value object representing factual structural characteristics:
```typescript
interface ProductStructure {
  leveraged: boolean;
  leverageMultiple: number | null;
  inverse: boolean;
  dailyReset: boolean;
  singleStock: boolean;
  commodityBacked: boolean;
  fixedIncome: boolean;
  activelyManaged: boolean;
  inferenceSource: "name_heuristic" | "provider_metadata" | "operator" | "unknown";
  confidence: "high" | "medium" | "low";
}
```

Unknown characteristics shall default to `false` with `confidence: "low"` rather than guessing.

### PS-2: Name-Based Inference

The system shall infer structural characteristics from ETF names using deterministic pattern matching. Patterns include but are not limited to:
- "UltraPro", "Ultra", "2X", "3X", "2x", "3x" → leveraged
- "Short", "Inverse", "Bear" → inverse
- "Daily" → dailyReset (when combined with leveraged or inverse)
- "Single Stock" → singleStock
- "Gold", "Silver", "Commodity", "Oil", "Natural Gas" → commodityBacked
- "Bond", "Treasury", "Fixed Income", "TIPS" → fixedIncome
- "Active", "Actively Managed" → activelyManaged

The inference must NOT claim high confidence from name matching alone.

### PS-3: Inference for Known Symbols

For well-known leveraged/inverse issuers (ProShares, Direxion), the system may infer `dailyReset: true` when both leveraged and inverse patterns match.

### PS-4: Velvet Rope Integration

ProductStructure shall be computed for each symbol during Velvet Rope evaluation and included in the AdmissionAuditRecord.

### PS-5: Structural Policy Criteria

The admission policy shall include structural awareness:
- `structuralCaution`: when leveraged OR inverse OR dailyReset is true, add a caution/manual_review signal
- Severity: `"soft"` (contributes to manual_review, not rejection)

This is intentionally conservative. Hard exclusion may be added later through policy evolution.

### PS-6: Diagnostic Narrative

The EvaluationNarrative shall include structural observations when present:
- "Observed Structure" section listing factual characteristics
- "Policy Interpretation" explaining how structure affects the outcome
- Prefer institutional language over sensational language

### PS-7: Audit Preservation

ProductStructure shall be preserved in the AdmissionAuditRecord so structural classification is available for historical review.

### PS-8: Conventional ETF Handling

Conventional ETFs (all structural flags false) shall produce no structural cautions. Their evaluation remains unchanged from the current behavior.

---

## Acceptance Criteria

1. SOXS is classified as leveraged + inverse + dailyReset
2. XLE is classified as conventional (no structural flags)
3. Velvet Rope evaluation of SOXS produces manual_review with structural rationale
4. Velvet Rope evaluation of XLE is unaffected by this change
5. Diagnostic narrative explains structural characteristics in institutional language
6. ProductStructure is preserved in the audit record
7. Existing tests continue passing
8. New tests cover inference, classification, and structural policy behavior
