/**
 * Velvet Rope — Evaluation Pipeline
 *
 * Evaluates a single symbol against the admission policy using
 * the existing MarketDataProvider infrastructure.
 *
 * Pipeline:
 *   1. Select expiration within policy DTE range
 *   2. Fetch chain
 *   3. Select call contract (reuses findClosestToDelta)
 *   4. Select put contract
 *   5. Evaluate per-side criteria
 *   6. Evaluate cross-side criteria (capital)
 *   7. Aggregate outcome
 *   8. Produce AdmissionAuditRecord
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
} from "./types";
import { aggregateOutcome } from "./aggregate";

// --- ID generation ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Expiration Selection ---

export function selectExpiration(
  expirations: Expiration[],
  dteRange: { min: number; max: number }
): ExpirationSelectionResult {
  const usable = expirations.filter((e) => e.dte >= dteRange.min);
  const inRange = usable.filter((e) => e.dte <= dteRange.max);

  if (inRange.length > 0) {
    // Pick longest within range (most time value, same as Opportunity Lab)
    const selected = inRange[inRange.length - 1];
    return {
      status: "selected",
      selectedDate: selected.date,
      selectedDte: selected.dte,
      availableCount: expirations.length,
      searchRange: dteRange,
    };
  }

  if (usable.length > 0) {
    // Fall back to nearest usable
    const selected = usable[0];
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

  // Volume (observational)
  const volThreshold = policy.minOptionVolume.value as number;
  results.push({
    criterion: "minOptionVolume",
    status: contract.volume >= volThreshold ? "pass" : "pass", // always pass — observational
    measuredValue: contract.volume,
    threshold: String(volThreshold),
    severity: "observational",
    explanation: `Volume: ${contract.volume} (observational — not counted for admission)`,
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

  // Yield
  if (policy.minYieldAtTargetDelta.value != null) {
    const yieldThreshold = policy.minYieldAtTargetDelta.value as number;
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

  return results;
}

// --- Cross-Side Criteria ---

export function evaluateCrossSideCriteria(
  putStrike: number | null,
  policy: AdmissionPolicy
): CriterionResult[] {
  const results: CriterionResult[] = [];

  if (putStrike == null) {
    // Cannot evaluate capital without a put strike
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

// --- Main Evaluation Function ---

export async function evaluateSymbolAdmission(
  symbol: string,
  provider: MarketDataProvider,
  policy: AdmissionPolicy
): Promise<AdmissionAuditRecord> {
  const attemptedAt = new Date().toISOString();
  const id = generateId();

  // Base provenance (will be updated with actual retrieval info)
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
      explanation: `Provider failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  // Step 2: Select expiration
  const expResult = selectExpiration(expirations, policy.expirationDteRange);
  if (expResult.status === "no_usable_expiration") {
    return {
      id, symbol, attemptedAt,
      attemptStatus: "evidence_incomplete",
      outcome: "insufficient_evidence",
      policySnapshot: policy,
      evidenceProvenance: provenance,
      expirationSelection: expResult,
      callEvidence: emptyCallEvidence,
      putEvidence: emptyPutEvidence,
      aggregatedCriteria: [],
      explanation: `No usable expiration found. ${expResult.availableCount} expirations available, none within DTE ${policy.expirationDteRange.min}–${policy.expirationDteRange.max}.`,
    };
  }

  // Step 3: Fetch chain
  let chain;
  try {
    chain = await provider.getOptionsChain(symbol, expResult.selectedDate!);
  } catch (err) {
    return {
      id, symbol, attemptedAt,
      attemptStatus: "provider_failed",
      outcome: null,
      policySnapshot: policy,
      evidenceProvenance: provenance,
      expirationSelection: expResult,
      callEvidence: emptyCallEvidence,
      putEvidence: emptyPutEvidence,
      aggregatedCriteria: [],
      explanation: `Provider failed fetching chain: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  // Update provenance from chain data quality
  if (chain.dataQuality) {
    provenance.source = chain.dataQuality.dataSource === "cache" ? "cache" : "network";
    provenance.cacheAgeSeconds = chain.dataQuality.cacheAgeSeconds ?? null;
  }

  const underlyingPrice = chain.underlying.price;
  const dte = expResult.selectedDte!;

  // Step 4: Select contracts
  const callSelection = selectAdmissionContract(chain.calls, policy, "call");
  const putSelection = selectAdmissionContract(chain.puts, policy, "put");

  // Step 5: Build side evidence
  let callEvidence: OptionSideEvidence;
  if (callSelection.status === "selected" && callSelection.contract) {
    const ce = buildContractEvidence(callSelection.contract, underlyingPrice, dte);
    const criteria = evaluatePerSideCriteria(ce, policy);
    callEvidence = { side: "call", selectedContract: ce, selectionStatus: "selected", criteria };
  } else {
    callEvidence = { side: "call", selectedContract: null, selectionStatus: callSelection.status, criteria: [] };
  }

  let putEvidence: OptionSideEvidence;
  if (putSelection.status === "selected" && putSelection.contract) {
    const pe = buildContractEvidence(putSelection.contract, underlyingPrice, dte);
    const criteria = evaluatePerSideCriteria(pe, policy);
    putEvidence = { side: "put", selectedContract: pe, selectionStatus: "selected", criteria };
  } else {
    putEvidence = { side: "put", selectedContract: null, selectionStatus: putSelection.status, criteria: [] };
  }

  // Step 6: Cross-side criteria (capital)
  const putStrike = putSelection.contract?.strike ?? null;
  const crossCriteria = evaluateCrossSideCriteria(putStrike, policy);

  // Step 7: Aggregate
  const { outcome, explanation } = aggregateOutcome(callEvidence, putEvidence, crossCriteria, policy);

  // Determine attempt status
  const hasEvidenceGaps = callEvidence.selectionStatus !== "selected" || putEvidence.selectionStatus !== "selected";
  const attemptStatus: EvaluationAttemptStatus = hasEvidenceGaps && outcome === "insufficient_evidence"
    ? "evidence_incomplete"
    : "completed";

  return {
    id, symbol, attemptedAt,
    attemptStatus,
    outcome,
    policySnapshot: policy,
    evidenceProvenance: provenance,
    expirationSelection: expResult,
    callEvidence,
    putEvidence,
    aggregatedCriteria: crossCriteria,
    explanation,
  };
}
