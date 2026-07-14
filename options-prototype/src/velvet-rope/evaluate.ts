/**
 * Velvet Rope — Evaluation Pipeline (Multi-Expiration)
 *
 * Evaluates a single symbol against the admission policy by examining
 * ALL eligible expirations within the DTE range, selecting call/put
 * pairs independently per expiration, and determining admission from
 * the best operational rung.
 *
 * Pipeline:
 *   1. Enumerate all expirations within policy DTE range
 *   2. For each expiration: fetch chain, select call, select put
 *   3. Evaluate per-side criteria for each pair
 *   4. Evaluate cross-side criteria for each pair
 *   5. Determine per-expiration outcome
 *   6. Determine instrument admission from best expiration
 *   7. Produce AdmissionAuditRecord with full expiration evidence
 */

import type { MarketDataProvider } from "../domain/provider";
import type { OptionContract, Expiration } from "../domain/types";
import { findClosestToDelta } from "../domain/delta";
import { midPrice, annualizedYield } from "../domain/calculations";
import type {
  AdmissionPolicy,
  AdmissionAuditRecord,
  EvidenceProvenance,
  ExpirationSelectionResult,
  OptionSideEvidence,
  ContractEvidence,
  ContractSelectionStatus,
  CriterionResult,
  EvaluationAttemptStatus,
  ExpirationEvaluation,
  ExpirationOutcome,
} from "./types";
import { aggregateOutcome } from "./aggregate";
import { inferProductStructure, hasStructuralComplexity, type ProductStructure, CONVENTIONAL_STRUCTURE } from "./product-structure";

// --- ID generation ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Expiration Selection ---

/**
 * Legacy single-expiration selector (preserved for backward compat in tests).
 * Picks the longest DTE within range.
 */
export function selectExpiration(
  expirations: Expiration[],
  dteRange: { min: number; max: number }
): ExpirationSelectionResult {
  const inRange = expirations.filter((e) => e.dte >= dteRange.min && e.dte <= dteRange.max);

  if (inRange.length > 0) {
    const selected = inRange[inRange.length - 1];
    return {
      status: "selected",
      selectedDate: selected.date,
      selectedDte: selected.dte,
      availableCount: expirations.length,
      searchRange: dteRange,
    };
  }

  return {
    status: "no_usable_expiration",
    selectedDate: null,
    selectedDte: null,
    availableCount: expirations.length,
    searchRange: dteRange,
  };
}

/**
 * Returns all expirations within the policy DTE range, sorted ascending by DTE.
 */
export function selectEligibleExpirations(
  expirations: Expiration[],
  dteRange: { min: number; max: number }
): Expiration[] {
  return expirations
    .filter((e) => e.dte >= dteRange.min && e.dte <= dteRange.max)
    .sort((a, b) => a.dte - b.dte);
}

// --- Contract Selection ---

export function selectAdmissionContract(
  contracts: OptionContract[],
  policy: AdmissionPolicy,
  side: "call" | "put"
): { contract: OptionContract | null; status: ContractSelectionStatus } {
  const { contractSelection } = policy;

  // Check greeks availability
  if (contractSelection.requireGreeks) {
    const hasGreeks = contracts.some((c) => c.delta !== 0);
    if (!hasGreeks) {
      return { contract: null, status: "greeks_unavailable" };
    }
  }

  // Filter: exclude zero-bid
  let eligible = contractSelection.excludeZeroBid
    ? contracts.filter((c) => c.bid > 0)
    : contracts;

  // Filter: exclude contracts without meaningful greeks
  if (contractSelection.requireGreeks) {
    eligible = eligible.filter((c) => c.delta !== 0);
  }

  if (eligible.length === 0) {
    return { contract: null, status: "no_valid_quotes" };
  }

  // Filter by delta range
  const { deltaRange, putDeltaAbsolute } = contractSelection;
  const inRange = eligible.filter((c) => {
    const d = (side === "put" && putDeltaAbsolute) ? Math.abs(c.delta) : c.delta;
    return d >= deltaRange.min && d <= deltaRange.max;
  });

  if (inRange.length === 0) {
    return { contract: null, status: "no_contract_in_delta_range" };
  }

  // Use canonical delta selection
  const selected = findClosestToDelta(
    inRange,
    contractSelection.targetDelta,
    contractSelection.tieBreaker
  );

  return { contract: selected, status: "selected" };
}

// --- Per-Side Criteria Evaluation ---

export function evaluatePerSideCriteria(
  contract: ContractEvidence,
  policy: AdmissionPolicy
): CriterionResult[] {
  const results: CriterionResult[] = [];

  // Open Interest
  const oiThreshold = policy.minOpenInterest.value as number;
  results.push(evaluateNumericCriterion(
    "minOpenInterest",
    contract.openInterest,
    oiThreshold,
    policy.minOpenInterest.severity,
    ">=",
    policy.nearMissPercent,
    `Open interest: ${contract.openInterest}`
  ));

  // Volume (observational) — truthful status
  const volThreshold = policy.minOptionVolume.value as number;
  const volPasses = contract.volume >= volThreshold;
  results.push({
    criterion: "minOptionVolume",
    status: volPasses ? "pass" : "observed_below",
    measuredValue: contract.volume,
    threshold: String(volThreshold),
    severity: "observational",
    explanation: volPasses
      ? `Volume: ${contract.volume} (observational)`
      : `Volume: ${contract.volume} — below observational threshold of ${volThreshold} (non-gating)`,
  });

  // Bid/Ask Spread
  const spreadThreshold = policy.maxBidAskSpreadPercent.value as number;
  results.push(evaluateNumericCriterion(
    "maxBidAskSpreadPercent",
    contract.spreadPercent,
    spreadThreshold,
    policy.maxBidAskSpreadPercent.severity,
    "<=",
    policy.nearMissPercent,
    `Spread: ${contract.spreadPercent.toFixed(1)}% of mid`
  ));

  // Yield — suppress midpoint yield when spread fails hard criterion
  if (policy.minYieldAtTargetDelta.value != null) {
    const yieldThreshold = policy.minYieldAtTargetDelta.value as number;
    const spreadFails = contract.spreadPercent > spreadThreshold;

    if (spreadFails) {
      // Spread failed hard criterion — midpoint yield is unreliable
      results.push({
        criterion: "minYieldAtTargetDelta",
        status: "unavailable",
        measuredValue: null,
        threshold: String(yieldThreshold),
        severity: policy.minYieldAtTargetDelta.severity,
        explanation: `Yield suppressed — bid/ask spread (${contract.spreadPercent.toFixed(1)}%) exceeds policy limit; midpoint is unreliable for yield calculation.`,
      });
    } else {
      results.push(evaluateNumericCriterion(
        "minYieldAtTargetDelta",
        contract.annualizedYield,
        yieldThreshold,
        policy.minYieldAtTargetDelta.severity,
        ">=",
        policy.nearMissPercent,
        `Annualized yield: ${contract.annualizedYield.toFixed(1)}%`
      ));
    }
  }

  return results;
}

// --- Cross-Side Criteria ---

export function evaluateCrossSideCriteria(
  putStrike: number | null,
  policy: AdmissionPolicy
): CriterionResult[] {
  const results: CriterionResult[] = [];

  if (putStrike == null) {
    if (policy.maxCapitalPerContract.value != null) {
      results.push({
        criterion: "maxCapitalPerContract",
        status: "unavailable",
        measuredValue: null,
        threshold: String(policy.maxCapitalPerContract.value),
        severity: policy.maxCapitalPerContract.severity,
        explanation: "Capital cannot be evaluated — no put contract selected",
      });
    }
    return results;
  }

  const capital = putStrike * 100;

  // Max capital
  if (policy.maxCapitalPerContract.value != null) {
    const maxCap = policy.maxCapitalPerContract.value as number;
    results.push(evaluateNumericCriterion(
      "maxCapitalPerContract",
      capital,
      maxCap,
      policy.maxCapitalPerContract.severity,
      "<=",
      policy.nearMissPercent,
      `Capital per contract: $${capital.toLocaleString()} (strike $${putStrike} × 100)`
    ));
  }

  // Min capital
  if (policy.minCapitalPerContract.value != null) {
    const minCap = policy.minCapitalPerContract.value as number;
    results.push(evaluateNumericCriterion(
      "minCapitalPerContract",
      capital,
      minCap,
      policy.minCapitalPerContract.severity,
      ">=",
      policy.nearMissPercent,
      `Capital per contract: $${capital.toLocaleString()}`
    ));
  }

  return results;
}

// --- Structural Criteria ---

export function evaluateStructuralCriteria(
  structure: ProductStructure,
  policy: AdmissionPolicy
): CriterionResult[] {
  if (!policy.structuralCaution.value) return [];
  if (!hasStructuralComplexity(structure)) return [];

  const complexities: string[] = [];
  if (structure.leveraged) complexities.push(`leveraged${structure.leverageMultiple ? ` (${structure.leverageMultiple}x)` : ""}`);
  if (structure.inverse) complexities.push("inverse");
  if (structure.dailyReset) complexities.push("daily-reset");
  if (structure.singleStock) complexities.push("single-stock");

  const explanation = `Structural complexity detected: ${complexities.join(", ")}. ` +
    `Current policy treats structurally complex instruments conservatively. ` +
    `Inference: ${structure.inferenceSource} (${structure.confidence} confidence).`;

  return [{
    criterion: "structuralCaution",
    status: "fail",
    measuredValue: complexities.join(", "),
    threshold: "conventional structure",
    severity: policy.structuralCaution.severity,
    explanation,
  }];
}

// --- Numeric Criterion Helper ---

function evaluateNumericCriterion(
  criterion: string,
  measured: number,
  threshold: number,
  severity: "hard" | "soft" | "observational",
  direction: ">=" | "<=",
  nearMissPercent: number,
  explanation: string
): CriterionResult {
  const passes = direction === ">="
    ? measured >= threshold
    : measured <= threshold;

  if (passes) {
    return { criterion, status: "pass", measuredValue: measured, threshold: String(threshold), severity, explanation };
  }

  // Check near-miss
  const distance = Math.abs(measured - threshold);
  const tolerance = threshold * (nearMissPercent / 100);
  if (distance <= tolerance && severity !== "observational") {
    return {
      criterion,
      status: "near_miss",
      measuredValue: measured,
      threshold: String(threshold),
      severity,
      explanation: `${explanation} — near miss (within ${nearMissPercent}% of threshold)`,
    };
  }

  return { criterion, status: "fail", measuredValue: measured, threshold: String(threshold), severity, explanation };
}

// --- Build Contract Evidence ---

function buildContractEvidence(contract: OptionContract, underlyingPrice: number, dte: number): ContractEvidence {
  const mid = midPrice(contract.bid, contract.ask);
  const spread = contract.ask - contract.bid;
  const spreadPercent = mid > 0 ? (spread / mid) * 100 : 100;
  const collateral = contract.type === "PUT" ? contract.strike : underlyingPrice;
  const yield_ = annualizedYield(mid, collateral, dte);

  return {
    strike: contract.strike,
    delta: contract.delta,
    bid: contract.bid,
    ask: contract.ask,
    mid,
    spread,
    spreadPercent,
    openInterest: contract.openInterest,
    volume: contract.volume,
    iv: contract.iv ?? null,
    annualizedYield: yield_,
    dte,
  };
}

// --- Per-Expiration Evaluation ---

/**
 * Determine outcome for a single expiration's call/put pair.
 * "pass" = all hard criteria satisfied on both required sides.
 * "fail" = at least one hard criterion failed.
 * "incomplete" = evidence gaps prevent conclusive evaluation.
 */
function determineExpirationOutcome(
  callEvidence: OptionSideEvidence,
  putEvidence: OptionSideEvidence,
  crossCriteria: CriterionResult[],
  policy: AdmissionPolicy
): ExpirationOutcome {
  // Side requirement check
  if (policy.sideRequirement === "both") {
    if (callEvidence.selectionStatus !== "selected" || putEvidence.selectionStatus !== "selected") {
      return "incomplete";
    }
  } else if (policy.sideRequirement === "either") {
    if (callEvidence.selectionStatus !== "selected" && putEvidence.selectionStatus !== "selected") {
      return "incomplete";
    }
  }

  const allCriteria: CriterionResult[] = [
    ...callEvidence.criteria,
    ...putEvidence.criteria,
    ...crossCriteria,
  ];

  for (const cr of allCriteria) {
    if (cr.severity === "observational") continue;
    if (cr.status === "fail" && cr.severity === "hard") return "fail";
    if (cr.status === "unavailable") return "incomplete";
  }

  return "pass";
}

/**
 * Rank expiration evaluations for selection.
 * Prioritizes: 1) hard-policy compliance, 2) distance from target delta,
 * 3) market quality (lower spread), 4) DTE ascending as tie-breaker.
 */
function rankExpirationEvaluations(evaluations: ExpirationEvaluation[]): ExpirationEvaluation[] {
  return [...evaluations].sort((a, b) => {
    // Passing expirations first
    const outcomeOrder = { pass: 0, incomplete: 1, fail: 2 };
    const oa = outcomeOrder[a.outcome];
    const ob = outcomeOrder[b.outcome];
    if (oa !== ob) return oa - ob;

    // Among same-outcome: prefer lower average spread
    const spreadA = avgSpread(a);
    const spreadB = avgSpread(b);
    if (Math.abs(spreadA - spreadB) > 0.5) return spreadA - spreadB;

    // Tie-break: lower DTE first (shorter expirations tend to have better liquidity)
    return a.dte - b.dte;
  });
}

function avgSpread(ev: ExpirationEvaluation): number {
  let total = 0;
  let count = 0;
  if (ev.callEvidence.selectedContract) {
    total += ev.callEvidence.selectedContract.spreadPercent;
    count++;
  }
  if (ev.putEvidence.selectedContract) {
    total += ev.putEvidence.selectedContract.spreadPercent;
    count++;
  }
  return count > 0 ? total / count : 999;
}

// --- Main Evaluation Function ---

export async function evaluateSymbolAdmission(
  symbol: string,
  provider: MarketDataProvider,
  policy: AdmissionPolicy
): Promise<AdmissionAuditRecord> {
  const attemptedAt = new Date().toISOString();
  const id = generateId();

  const provenance: EvidenceProvenance = {
    provider: "tradier_sandbox",
    observedAt: null,
    retrievedAt: attemptedAt,
    source: "network",
    cacheAgeSeconds: null,
    delayedData: true,
  };

  const emptyCallEvidence: OptionSideEvidence = { side: "call", selectedContract: null, selectionStatus: "expiration_unavailable", criteria: [] };
  const emptyPutEvidence: OptionSideEvidence = { side: "put", selectedContract: null, selectionStatus: "expiration_unavailable", criteria: [] };

  // Step 1: Get expirations
  let expirations: Expiration[];
  try {
    expirations = await provider.getExpirations(symbol);
  } catch (err) {
    return {
      id, symbol, attemptedAt,
      attemptStatus: "provider_failed",
      outcome: null,
      policySnapshot: policy,
      evidenceProvenance: provenance,
      expirationSelection: { status: "no_usable_expiration", selectedDate: null, selectedDte: null, availableCount: 0, searchRange: policy.expirationDteRange },
      callEvidence: emptyCallEvidence,
      putEvidence: emptyPutEvidence,
      aggregatedCriteria: [],
      productStructure: CONVENTIONAL_STRUCTURE,
      explanation: `Provider failed: ${err instanceof Error ? err.message : "unknown error"}`,
      expirationEvaluations: [],
      winningExpiration: null,
    };
  }

  // Step 2: Find all eligible expirations
  const eligible = selectEligibleExpirations(expirations, policy.expirationDteRange);

  const expSelection: ExpirationSelectionResult = eligible.length > 0
    ? { status: "selected", selectedDate: eligible[0].date, selectedDte: eligible[0].dte, availableCount: expirations.length, searchRange: policy.expirationDteRange }
    : { status: "no_usable_expiration", selectedDate: null, selectedDte: null, availableCount: expirations.length, searchRange: policy.expirationDteRange };

  if (eligible.length === 0) {
    return {
      id, symbol, attemptedAt,
      attemptStatus: "evidence_incomplete",
      outcome: "insufficient_evidence",
      policySnapshot: policy,
      evidenceProvenance: provenance,
      expirationSelection: expSelection,
      callEvidence: emptyCallEvidence,
      putEvidence: emptyPutEvidence,
      aggregatedCriteria: [],
      productStructure: CONVENTIONAL_STRUCTURE,
      explanation: `No usable expiration found. ${expirations.length} expirations available, none within DTE ${policy.expirationDteRange.min}–${policy.expirationDteRange.max}.`,
      expirationEvaluations: [],
      winningExpiration: null,
    };
  }

  // Step 3: Product Structure (instrument-level, evaluated once)
  let productStructure: ProductStructure = CONVENTIONAL_STRUCTURE;

  // Step 4: Evaluate each eligible expiration
  const expirationEvaluations: ExpirationEvaluation[] = [];

  for (const exp of eligible) {
    let chain;
    try {
      chain = await provider.getOptionsChain(symbol, exp.date);
    } catch (_err) {
      expirationEvaluations.push({
        date: exp.date,
        dte: exp.dte,
        outcome: "incomplete",
        callEvidence: { side: "call", selectedContract: null, selectionStatus: "expiration_unavailable", criteria: [] },
        putEvidence: { side: "put", selectedContract: null, selectionStatus: "expiration_unavailable", criteria: [] },
        crossCriteria: [],
        explanation: `Provider failed for ${exp.date}`,
      });
      continue;
    }

    // Update provenance from first successful chain
    if (chain.dataQuality && expirationEvaluations.length === 0) {
      provenance.source = chain.dataQuality.dataSource === "cache" ? "cache" : "network";
      provenance.cacheAgeSeconds = chain.dataQuality.cacheAgeSeconds ?? null;
    }

    // Infer product structure from first chain (instrument-level)
    if (expirationEvaluations.length === 0) {
      productStructure = inferProductStructure(symbol, chain.underlying.name);
    }

    const underlyingPrice = chain.underlying.price;
    const dte = exp.dte;

    // Select contracts
    const callSelection = selectAdmissionContract(chain.calls, policy, "call");
    const putSelection = selectAdmissionContract(chain.puts, policy, "put");

    // Build call evidence
    let callEv: OptionSideEvidence;
    if (callSelection.status === "selected" && callSelection.contract) {
      const ce = buildContractEvidence(callSelection.contract, underlyingPrice, dte);
      const criteria = evaluatePerSideCriteria(ce, policy);
      callEv = { side: "call", selectedContract: ce, selectionStatus: "selected", criteria };
    } else {
      callEv = { side: "call", selectedContract: null, selectionStatus: callSelection.status, criteria: [] };
    }

    // Build put evidence
    let putEv: OptionSideEvidence;
    if (putSelection.status === "selected" && putSelection.contract) {
      const pe = buildContractEvidence(putSelection.contract, underlyingPrice, dte);
      const criteria = evaluatePerSideCriteria(pe, policy);
      putEv = { side: "put", selectedContract: pe, selectionStatus: "selected", criteria };
    } else {
      putEv = { side: "put", selectedContract: null, selectionStatus: putSelection.status, criteria: [] };
    }

    // Cross-side criteria
    const putStrike = putSelection.contract?.strike ?? null;
    const crossCriteria = evaluateCrossSideCriteria(putStrike, policy);

    // Determine expiration-level outcome
    const expOutcome = determineExpirationOutcome(callEv, putEv, crossCriteria, policy);

    // Build explanation
    const failReasons: string[] = [];
    for (const cr of [...callEv.criteria, ...putEv.criteria, ...crossCriteria]) {
      if (cr.status === "fail" && cr.severity === "hard") {
        failReasons.push(cr.explanation);
      }
    }
    const expExplanation = expOutcome === "pass"
      ? `${exp.date} (${dte} DTE): all hard criteria satisfied.`
      : expOutcome === "fail"
        ? `${exp.date} (${dte} DTE): ${failReasons.join("; ")}`
        : `${exp.date} (${dte} DTE): evidence incomplete.`;

    expirationEvaluations.push({
      date: exp.date,
      dte: exp.dte,
      outcome: expOutcome,
      callEvidence: callEv,
      putEvidence: putEv,
      crossCriteria,
      explanation: expExplanation,
    });
  }

  // Step 5: Rank evaluations and determine instrument admission
  const ranked = rankExpirationEvaluations(expirationEvaluations);
  const passing = ranked.filter((e) => e.outcome === "pass");
  const winner = passing.length > 0 ? passing[0] : null;

  // Structural criteria (instrument-level, applied to final decision)
  const structuralCriteria = evaluateStructuralCriteria(productStructure, policy);

  // Determine the best expiration to use for the record's top-level evidence
  const bestExp = winner ?? ranked[0];

  // Build expiration selection result pointing to winning expiration
  const finalExpSelection: ExpirationSelectionResult = {
    status: "selected",
    selectedDate: bestExp.date,
    selectedDte: bestExp.dte,
    availableCount: expirations.length,
    searchRange: policy.expirationDteRange,
  };

  // Top-level criteria = best expiration's cross-side + structural
  const allCrossCriteria = [...bestExp.crossCriteria, ...structuralCriteria];

  // Determine instrument outcome
  let outcome: AdmissionAuditRecord["outcome"];
  let explanation: string;

  if (winner) {
    // At least one expiration passes all hard criteria
    // Still need to check structural soft criteria
    const { outcome: aggOutcome, explanation: aggExplanation } = aggregateOutcome(
      winner.callEvidence,
      winner.putEvidence,
      allCrossCriteria,
      policy
    );
    outcome = aggOutcome;
    explanation = `Admitted using ${winner.date} (${winner.dte} DTE). ` +
      `${expirationEvaluations.length} expiration${expirationEvaluations.length > 1 ? "s" : ""} evaluated` +
      (expirationEvaluations.length > passing.length
        ? `; ${expirationEvaluations.length - passing.length} failed liquidity policy.`
        : ".");
    if (aggOutcome === "manual_review") {
      explanation += ` ${aggExplanation}`;
    }
  } else {
    // No expiration passes — reject
    const incompleteCount = expirationEvaluations.filter((e) => e.outcome === "incomplete").length;
    if (incompleteCount === expirationEvaluations.length) {
      outcome = "insufficient_evidence";
      explanation = `No admissible call/put pair found. ${expirationEvaluations.length} expiration${expirationEvaluations.length > 1 ? "s" : ""} evaluated; all had incomplete evidence.`;
    } else {
      outcome = "reject";
      explanation = `No admissible call/put pair found across ${expirationEvaluations.length} expiration${expirationEvaluations.length > 1 ? "s" : ""} from ${policy.expirationDteRange.min}–${policy.expirationDteRange.max} DTE.`;
    }
  }

  // Attempt status
  const hasEvidenceGaps = bestExp.callEvidence.selectionStatus !== "selected" || bestExp.putEvidence.selectionStatus !== "selected";
  const attemptStatus: EvaluationAttemptStatus = hasEvidenceGaps && outcome === "insufficient_evidence"
    ? "evidence_incomplete"
    : "completed";

  return {
    id, symbol, attemptedAt,
    attemptStatus,
    outcome,
    policySnapshot: policy,
    evidenceProvenance: provenance,
    expirationSelection: finalExpSelection,
    callEvidence: bestExp.callEvidence,
    putEvidence: bestExp.putEvidence,
    aggregatedCriteria: allCrossCriteria,
    productStructure,
    explanation,
    expirationEvaluations: ranked,
    winningExpiration: winner ? { date: winner.date, dte: winner.dte } : null,
  };
}
