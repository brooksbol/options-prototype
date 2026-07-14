/**
 * Velvet Rope — Evaluation Narrative (VR-22)
 *
 * Deterministic synthesis of evaluation results into operator-facing language.
 * Presents the institutional meaning of a decision before engineering evidence.
 *
 * This is interpretation, not generation. It reads existing CriterionResults
 * and produces structured operator communication.
 */

import type { AdmissionAuditRecord, CriterionResult, EvidenceProvenance } from "./types";
import { hasStructuralComplexity, describeStructure, type ProductStructure } from "./product-structure";

export interface EvaluationNarrative {
  /** One-sentence plain-English summary of the decision */
  summary: string;
  /** 1-3 primary reasons for the outcome */
  primaryReasons: string[];
  /** Criteria that passed clearly (strengths) */
  strengths: string[];
  /** Near-misses, soft failures, observational concerns */
  cautions: string[];
  /** Confidence in the evidence quality */
  confidence: "high" | "medium" | "low";
}

/**
 * Synthesize an operator-facing narrative from an evaluation audit record.
 */
export function synthesizeNarrative(record: AdmissionAuditRecord): EvaluationNarrative {
  // Handle non-completed attempts
  if (record.attemptStatus === "provider_failed") {
    return {
      summary: `${record.symbol} could not be evaluated — the data provider failed to respond.`,
      primaryReasons: ["Provider connection failed. No admission decision was made."],
      strengths: [],
      cautions: ["Previous evaluation result (if any) remains in effect."],
      confidence: "low",
    };
  }

  const allCriteria: CriterionResult[] = [
    ...record.callEvidence.criteria,
    ...record.putEvidence.criteria,
    ...record.aggregatedCriteria,
  ];

  // Classify criteria
  const hardFails = allCriteria.filter((c) => c.status === "fail" && c.severity === "hard");
  const softFails = allCriteria.filter((c) => c.status === "fail" && c.severity === "soft");
  const nearMisses = allCriteria.filter((c) => c.status === "near_miss");
  const passes = allCriteria.filter((c) => c.status === "pass" && c.severity !== "observational");
  const unavailable = allCriteria.filter((c) => c.status === "unavailable");

  // Build summary
  const summary = buildSummary(record, hardFails, softFails, nearMisses, unavailable);

  // Primary reasons (max 3)
  const primaryReasons = buildPrimaryReasons(record, hardFails, softFails, nearMisses, unavailable);

  // Strengths
  const strengths = buildStrengths(record, passes);

  // Cautions
  const cautions = buildCautions(nearMisses, softFails, record);

  // Confidence
  const confidence = deriveConfidence(record.evidenceProvenance);

  return { summary, primaryReasons, strengths, cautions, confidence };
}

// --- Summary ---

function buildSummary(
  record: AdmissionAuditRecord,
  hardFails: CriterionResult[],
  softFails: CriterionResult[],
  nearMisses: CriterionResult[],
  unavailable: CriterionResult[]
): string {
  const { symbol, outcome } = record;

  switch (outcome) {
    case "admit":
      return `${symbol} satisfies the current admission policy. Both call and put markets meet liquidity, spread, and yield requirements.`;

    case "reject": {
      // Identify the category of failure
      const hasOiFail = hardFails.some((f) => f.criterion === "minOpenInterest");
      const hasSpreadFail = hardFails.some((f) => f.criterion === "maxBidAskSpreadPercent");
      const hasCapitalFail = hardFails.some((f) => f.criterion === "maxCapitalPerContract");

      if (hasCapitalFail && !hasOiFail && !hasSpreadFail) {
        return `${symbol} rejected — capital per contract exceeds the institutional policy limit.`;
      }
      if ((hasOiFail || hasSpreadFail) && !hasCapitalFail) {
        return `${symbol} rejected — the selected options contracts appear insufficiently liquid under the current market-quality policy.`;
      }
      return `${symbol} rejected — multiple policy criteria were not satisfied.`;
    }

    case "insufficient_evidence": {
      if (record.callEvidence.selectionStatus !== "selected" || record.putEvidence.selectionStatus !== "selected") {
        return `${symbol} could not be fully evaluated — unable to select usable contracts on one or both sides.`;
      }
      if (unavailable.length > 0) {
        return `${symbol} evaluation incomplete — some required evidence was unavailable.`;
      }
      return `${symbol} could not be evaluated due to insufficient market evidence.`;
    }

    case "manual_review": {
      // Check if structural complexity is the primary driver
      const hasStructural = hasStructuralComplexity(record.productStructure);
      if (hasStructural && softFails.some((f) => f.criterion === "structuralCaution")) {
        return `${symbol} has a structurally complex product profile (${describeStructureShort(record.productStructure)}). Manual review recommended.`;
      }
      if (nearMisses.length > 0 && softFails.length === 0) {
        return `${symbol} is borderline — one or more criteria are near the policy threshold and require operator review.`;
      }
      if (softFails.length > 0) {
        return `${symbol} has acceptable market quality but does not fully satisfy the current income or institutional policy.`;
      }
      return `${symbol} requires operator review — the evidence is mixed.`;
    }

    default:
      return `${symbol} — evaluation complete.`;
  }
}

// --- Primary Reasons ---

function buildPrimaryReasons(
  record: AdmissionAuditRecord,
  hardFails: CriterionResult[],
  softFails: CriterionResult[],
  nearMisses: CriterionResult[],
  unavailable: CriterionResult[]
): string[] {
  const reasons: string[] = [];

  // Hard failures first
  for (const f of hardFails.slice(0, 3)) {
    reasons.push(describeCriterionFailure(f, record));
  }

  // Then evidence gaps
  for (const u of unavailable.slice(0, Math.max(0, 3 - reasons.length))) {
    reasons.push(`${humanCriterionName(u.criterion)}: evidence unavailable.`);
  }

  // Then near-misses / soft fails
  for (const nm of [...nearMisses, ...softFails].slice(0, Math.max(0, 3 - reasons.length))) {
    reasons.push(describeCriterionFailure(nm, record));
  }

  // Side selection failures
  if (record.callEvidence.selectionStatus !== "selected" && reasons.length < 3) {
    reasons.push(`Call side: ${record.callEvidence.selectionStatus.replace(/_/g, " ")}.`);
  }
  if (record.putEvidence.selectionStatus !== "selected" && reasons.length < 3) {
    reasons.push(`Put side: ${record.putEvidence.selectionStatus.replace(/_/g, " ")}.`);
  }

  return reasons.slice(0, 3);
}

// --- Strengths ---

function buildStrengths(record: AdmissionAuditRecord, passes: CriterionResult[]): string[] {
  const strengths: string[] = [];

  // Capital passing is notable
  const capitalPass = passes.find((p) => p.criterion === "maxCapitalPerContract");
  if (capitalPass) {
    strengths.push(`Capital requirement fits policy ($${Number(capitalPass.measuredValue).toLocaleString()}).`);
  }

  // Yield passing
  const yieldPasses = passes.filter((p) => p.criterion === "minYieldAtTargetDelta");
  if (yieldPasses.length > 0) {
    strengths.push("Premium yield exceeds the required minimum.");
  }

  // OI — side-aware messaging
  const callOi = record.callEvidence.criteria.find((c) => c.criterion === "minOpenInterest");
  const putOi = record.putEvidence.criteria.find((c) => c.criterion === "minOpenInterest");
  const callOiPasses = callOi?.status === "pass";
  const putOiPasses = putOi?.status === "pass";

  if (callOiPasses && putOiPasses) {
    strengths.push("Both call and put open interest above threshold.");
  } else if (callOiPasses && !putOiPasses) {
    const callVal = callOi?.measuredValue ?? "—";
    const putVal = putOi?.measuredValue ?? "—";
    if (record.policySnapshot.sideRequirement === "both") {
      strengths.push(`Call OI adequate (${callVal}); put OI insufficient (${putVal}) — both sides required.`);
    } else {
      strengths.push(`Call-side open interest adequate (${callVal}).`);
    }
  } else if (!callOiPasses && putOiPasses) {
    const callVal = callOi?.measuredValue ?? "—";
    const putVal = putOi?.measuredValue ?? "—";
    if (record.policySnapshot.sideRequirement === "both") {
      strengths.push(`Put OI adequate (${putVal}); call OI insufficient (${callVal}) — both sides required.`);
    } else {
      strengths.push(`Put-side open interest adequate (${putVal}).`);
    }
  }

  // Spread passing
  const spreadPasses = passes.filter((p) => p.criterion === "maxBidAskSpreadPercent");
  if (spreadPasses.length === 2) {
    strengths.push("Bid/ask spreads within policy on both sides.");
  }

  return strengths;
}

// --- Cautions ---

function buildCautions(nearMisses: CriterionResult[], softFails: CriterionResult[], record: AdmissionAuditRecord): string[] {
  const cautions: string[] = [];

  // Structural observations (prioritized — most important context)
  if (hasStructuralComplexity(record.productStructure)) {
    const observations = describeStructure(record.productStructure);
    cautions.push(...observations);
    cautions.push("Current institutional policy treats structurally complex instruments conservatively.");
  }

  for (const nm of nearMisses) {
    if (nm.criterion === "structuralCaution") continue; // already handled above
    cautions.push(`${humanCriterionName(nm.criterion)} is near the policy threshold (${nm.measuredValue} vs ${nm.threshold}).`);
  }

  for (const sf of softFails) {
    if (sf.criterion === "structuralCaution") continue; // already handled above
    cautions.push(`${humanCriterionName(sf.criterion)} below target (${sf.measuredValue} vs ${sf.threshold}).`);
  }

  if (record.evidenceProvenance.source === "cache" && record.evidenceProvenance.cacheAgeSeconds && record.evidenceProvenance.cacheAgeSeconds > 30) {
    cautions.push("Evidence from cache — may not reflect current market state.");
  }

  return cautions;
}

// --- Confidence ---

function deriveConfidence(provenance: EvidenceProvenance): "high" | "medium" | "low" {
  if (provenance.source === "network") return "high";
  if (provenance.source === "cache" && provenance.cacheAgeSeconds != null) {
    if (provenance.cacheAgeSeconds <= 30) return "high";
    if (provenance.cacheAgeSeconds <= 120) return "medium";
  }
  return "low";
}

// --- Helpers ---

function humanCriterionName(criterion: string): string {
  const map: Record<string, string> = {
    minOpenInterest: "Open interest",
    minOptionVolume: "Option volume",
    maxBidAskSpreadPercent: "Bid/ask spread",
    maxCapitalPerContract: "Capital per contract",
    minCapitalPerContract: "Minimum capital",
    minYieldAtTargetDelta: "Annualized yield",
    requireGreeks: "Greeks availability",
    structuralCaution: "Product structure",
  };
  return map[criterion] ?? criterion;
}

function describeCriterionFailure(cr: CriterionResult, record: AdmissionAuditRecord): string {
  const name = humanCriterionName(cr.criterion);

  // Determine which side(s) this applies to
  const inCall = record.callEvidence.criteria.includes(cr);
  const inPut = record.putEvidence.criteria.includes(cr);
  const side = inCall && inPut ? "" : inCall ? " (call side)" : inPut ? " (put side)" : "";

  switch (cr.criterion) {
    case "minOpenInterest":
      return `${name}${side} is ${cr.measuredValue} — below the required minimum of ${cr.threshold}.`;
    case "maxBidAskSpreadPercent":
      return `${name}${side} is ${Number(cr.measuredValue).toFixed(1)}% — exceeds the ${cr.threshold}% policy limit.`;
    case "maxCapitalPerContract":
      return `${name} is $${Number(cr.measuredValue).toLocaleString()} — exceeds the $${Number(cr.threshold).toLocaleString()} institutional limit.`;
    case "minCapitalPerContract":
      return `${name} is $${Number(cr.measuredValue).toLocaleString()} — below the $${Number(cr.threshold).toLocaleString()} minimum.`;
    case "minYieldAtTargetDelta":
      return `${name}${side} is ${Number(cr.measuredValue).toFixed(1)}% — below the ${cr.threshold}% target.`;
    default:
      return `${name}${side}: ${cr.measuredValue} vs threshold ${cr.threshold}.`;
  }
}

// --- Structural short description ---

function describeStructureShort(structure: ProductStructure): string {
  const parts: string[] = [];
  if (structure.leveraged) parts.push(`${structure.leverageMultiple ?? ""}x leveraged`.trim());
  if (structure.inverse) parts.push("inverse");
  if (structure.dailyReset) parts.push("daily-reset");
  if (structure.singleStock) parts.push("single-stock");
  return parts.join(", ") || "complex structure";
}
