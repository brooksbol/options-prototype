/**
 * Velvet Rope — Institutional Risk Categories
 *
 * Maps criteria to institutional concerns and generates contextual
 * explanations that explain WHY a criterion matters, not just that
 * a threshold was exceeded.
 *
 * Architecture:
 *   Facts (observations) → Risk Category → Practical Consequence → Policy Interpretation → Outcome
 */

import type { CriterionResult, OptionSideEvidence } from "./types";
import type { ProductStructure } from "./product-structure";
import { hasStructuralComplexity, describeStructure } from "./product-structure";

// --- Risk Category Types ---

export type RiskCategory =
  | "execution_risk"
  | "product_structure_risk"
  | "capital_allocation_policy"
  | "opportunity_quality";

export interface CategorizedCriterion {
  category: RiskCategory;
  categoryLabel: string;
  criterion: CriterionResult;
  /** Why this matters operationally */
  consequence: string;
  /** How the institution interprets this */
  interpretation: string;
}

export interface RiskCategorySummary {
  category: RiskCategory;
  categoryLabel: string;
  /** One-sentence summary of the concern */
  summary: string;
  /** Individual criteria in this category */
  items: CategorizedCriterion[];
}

// --- Category Mapping ---

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  execution_risk: "Execution Risk",
  product_structure_risk: "Product Structure Risk",
  capital_allocation_policy: "Capital / Allocation Policy",
  opportunity_quality: "Opportunity Quality",
};

function categoryCriterion(criterion: string): RiskCategory {
  switch (criterion) {
    case "minOpenInterest":
    case "maxBidAskSpreadPercent":
    case "minOptionVolume":
    case "requireGreeks":
      return "execution_risk";
    case "structuralCaution":
      return "product_structure_risk";
    case "maxCapitalPerContract":
    case "minCapitalPerContract":
      return "capital_allocation_policy";
    case "minYieldAtTargetDelta":
      return "opportunity_quality";
    default:
      return "execution_risk";
  }
}

// --- Contextual Explanations ---

function generateConsequence(cr: CriterionResult): string {
  switch (cr.criterion) {
    case "maxBidAskSpreadPercent":
      return "The market is too wide to establish a dependable executable premium. " +
        "The midpoint-based yield may be unrealistic, a sell order may not fill near the modeled value, " +
        "and closing or rolling the position later may require a substantial price concession.";

    case "minOpenInterest":
      return "Limited market participation may affect fill reliability, " +
        "reduce available counterparties, limit exit flexibility, " +
        "and diminish resilience during fast market conditions.";

    case "minOptionVolume":
      return "Low daily volume may indicate limited current trading interest, " +
        "although this can vary by time of day and market conditions.";

    case "requireGreeks":
      return "Without Greeks, delta-based contract selection cannot function reliably. " +
        "The selected contract may not represent the intended risk exposure.";

    case "structuralCaution":
      return "Assignment would create ownership of a structurally complex instrument " +
        "rather than a conventional long-only ETF. Multi-day returns may diverge materially " +
        "from simple expectations, and passive holding may create significant value drift.";

    case "maxCapitalPerContract":
      return "The contract requires more capital per position than the institution's current deployment policy allows. " +
        "This is a capital-allocation constraint, not evidence of poor contract quality.";

    case "minCapitalPerContract":
      return "The contract quantum is smaller than the current deployment unit. " +
        "Multiple contracts could satisfy the desired allocation — " +
        "this is a capital-allocation mismatch, not evidence that the ETF or contract is low quality.";

    case "minYieldAtTargetDelta":
      return cr.status === "pass"
        ? "The contract offers sufficient modeled compensation to justify further consideration."
        : "The modeled premium does not currently meet the minimum income target for deployment.";

    default:
      return "";
  }
}

function generateInterpretation(cr: CriterionResult): string {
  switch (cr.criterion) {
    case "maxBidAskSpreadPercent":
      return "Current policy requires tighter markets before capital is deployed. " +
        "The institution cannot rely on the quoted economics when the spread exceeds the policy limit.";

    case "minOpenInterest":
      return "Current policy requires a minimum level of open interest " +
        "to ensure sufficient market depth for reliable entry and exit.";

    case "minOptionVolume":
      return "Volume is tracked observationally. It does not currently contribute to admission decisions.";

    case "requireGreeks":
      return "Delta-based evaluation requires functional Greeks from the provider.";

    case "structuralCaution":
      return "Current institutional policy treats structurally complex instruments conservatively. " +
        "Manual review is recommended before deployment.";

    case "maxCapitalPerContract":
      return "The institution limits maximum capital deployed per single contract position.";

    case "minCapitalPerContract":
      return "Current policy assumes a minimum deployment size. " +
        "This threshold is experimental and may be revised.";

    case "minYieldAtTargetDelta":
      return cr.status === "pass"
        ? "The opportunity is economically attractive, subject to execution, structure, and capital-policy review."
        : "Current policy targets a minimum annualized yield before considering deployment.";

    default:
      return "";
  }
}

// --- Main Categorization Function ---

/**
 * Categorize and explain all criteria from an evaluation.
 * Groups by risk category with contextual explanations.
 */
export function categorizeCriteria(
  callEvidence: OptionSideEvidence,
  putEvidence: OptionSideEvidence,
  aggregatedCriteria: CriterionResult[],
  productStructure: ProductStructure
): RiskCategorySummary[] {
  const allCriteria: CriterionResult[] = [
    ...callEvidence.criteria,
    ...putEvidence.criteria,
    ...aggregatedCriteria,
  ];

  // Build categorized items
  const categorized: CategorizedCriterion[] = allCriteria.map((cr) => {
    const category = categoryCriterion(cr.criterion);
    return {
      category,
      categoryLabel: CATEGORY_LABELS[category],
      criterion: cr,
      consequence: generateConsequence(cr),
      interpretation: generateInterpretation(cr),
    };
  });

  // Group by category
  const groups = new Map<RiskCategory, CategorizedCriterion[]>();
  for (const item of categorized) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category)!.push(item);
  }

  // Build summaries (only for categories that have non-passing items or structural concerns)
  const summaries: RiskCategorySummary[] = [];
  const categoryOrder: RiskCategory[] = ["execution_risk", "product_structure_risk", "capital_allocation_policy", "opportunity_quality"];

  for (const cat of categoryOrder) {
    const items = groups.get(cat);
    if (!items || items.length === 0) continue;

    // Only show categories that have failures, near-misses, or structural flags
    const hasIssues = items.some((i) => i.criterion.status !== "pass" && i.criterion.severity !== "observational");
    const hasStrengths = items.some((i) => i.criterion.status === "pass" && i.criterion.severity !== "observational");

    if (!hasIssues && !hasStrengths) continue;

    summaries.push({
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat],
      summary: generateCategorySummary(cat, items, productStructure),
      items,
    });
  }

  return summaries;
}

function generateCategorySummary(
  category: RiskCategory,
  items: CategorizedCriterion[],
  productStructure: ProductStructure
): string {
  const failures = items.filter((i) => i.criterion.status === "fail" || i.criterion.status === "near_miss");
  const passes = items.filter((i) => i.criterion.status === "pass" && i.criterion.severity !== "observational");

  switch (category) {
    case "execution_risk":
      if (failures.length === 0 && passes.length > 0) {
        return "The selected contracts appear to have adequate market depth and execution characteristics.";
      }
      if (failures.some((f) => f.criterion.criterion === "maxBidAskSpreadPercent")) {
        return "The market is too wide to establish dependable executable economics at the selected contracts.";
      }
      if (failures.some((f) => f.criterion.criterion === "minOpenInterest")) {
        return "The selected contracts have limited open interest, which may affect fill reliability.";
      }
      return "Execution-quality concerns were identified.";

    case "product_structure_risk":
      if (hasStructuralComplexity(productStructure)) {
        const desc = describeStructure(productStructure);
        return desc.length > 0 ? desc[0] : "The instrument has structural complexity beyond conventional equity ETFs.";
      }
      return "No structural concerns identified.";

    case "capital_allocation_policy":
      if (failures.length === 0) {
        return "The contract quantum fits within current deployment policy.";
      }
      if (failures.some((f) => f.criterion.criterion === "maxCapitalPerContract")) {
        return "The contract requires more capital than the current deployment limit.";
      }
      return "The contract quantum does not match the current deployment policy.";

    case "opportunity_quality":
      if (passes.length > 0) {
        return "The modeled premium meets or exceeds the minimum income target.";
      }
      return "The modeled premium does not currently meet the minimum income target.";

    default:
      return "";
  }
}
