/**
 * Conditioned Call Surface — Shared Domain Computation
 *
 * Evaluates the covered-call landscape from a conditioned ownership state.
 * Used by both proposed-put recommendations (Projected Call Surface in drawer)
 * and existing open short puts (assignment planning evidence).
 *
 * Architecture:
 *   loadConditionedCallEvidence() — retrieves expirations + chains from cache
 *   assessConditionedCallSurface() — pure domain function, no cache access
 *
 * The output is structured evidence, not a recommendation or trade selection.
 * Measurement and policy remain distinct. No quality score or classification
 * is produced — only observable facts about the call environment.
 */

import { buildCacheKey, type DurableMarketCache } from "../cache/durable-cache";
import { selectEligibleExpirations } from "../velvet-rope/evaluate";
import { midPrice, annualizedYield } from "../domain/calculations";
import { isHardNo, type ContractEvidence } from "./execution-assessment";
import type { ExecutionPolicy } from "./execution-policy";
import type { ContractSelectionPolicy } from "./recommend";

// ═══════════════════════════════════════════════════════════════════════
// TYPES — Input
// ═══════════════════════════════════════════════════════════════════════

/**
 * Normalized conditioned-ownership input.
 * Independent of PutCandidate or OpenShortPut.
 */
export interface ConditionedOwnershipInput {
  /** Underlying symbol */
  underlying: string;
  /** Assumed effective basis per share */
  assumedBasisPerShare: number;
  /** Number of shares that would be owned (always positive) */
  shareQuantity: number;
  /** How the basis was derived */
  basisSource: "projected-mid" | "strike-only";
  /** What created this conditioned state */
  origin: "proposed-put" | "existing-put";
  /** Source position identity (for traceability) */
  sourceExpiration?: string;
  sourceStrike?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// TYPES — Evidence (from cache)
// ═══════════════════════════════════════════════════════════════════════

export interface CachedCallContract {
  strike: number;
  bid: number;
  ask: number;
  delta: number;
  openInterest: number;
  volume: number;
}

export interface ConditionedCallChainEvidence {
  expiration: string;
  dte: number;
  chainAvailable: boolean;
  underlyingPrice: number | null;
  calls: CachedCallContract[];
}

/**
 * Evidence bundle retrieved from cache. Fed to the pure domain function.
 */
export interface ConditionedCallEvidenceBundle {
  /** Whether any expiration data was found for this symbol */
  expirationsAvailable: boolean;
  /** Eligible expirations within DTE range */
  eligibleExpirations: Array<{ date: string; dte: number }>;
  /** Per-expiration chain evidence */
  chains: ConditionedCallChainEvidence[];
  /** Evidence freshness */
  freshness: "current-session" | "sealed-prior-session" | "stale" | "unavailable";
  /** Provider metadata */
  provider: string;
  /** Canonical session date from the evidence source */
  canonicalSessionDate: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// TYPES — Output
// ═══════════════════════════════════════════════════════════════════════

export interface ConditionedCallOpportunity {
  expiration: string;
  dte: number;
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  mid: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  /** Yield annualized from the conditioned basis */
  yieldFromBasis: number | null;
  /** Distance from basis: strike - assumedBasisPerShare */
  strikeDistanceFromBasis: number;
  /** Whether this strike is above the conditioned basis */
  aboveBasis: boolean;
  /** Whether this contract satisfies existing admissibility policy */
  satisfiesPolicy: boolean;
  /** All applicable failure reasons (empty if satisfies policy) */
  policyFailureReasons: string[];
}

export interface ConditionedExpirationAssessment {
  expiration: string;
  dte: number;
  chainAvailable: boolean;
  underlyingPrice: number | null;
  callsTotal: number;
  callsAboveBasis: number;
  callsQualifying: number;
  callsFailingPolicy: number;
  callsBelowBasis: number;
  /** Aggregated failure reasons across non-qualifying calls */
  failureReasons: Array<{ reason: string; count: number }>;
}

export interface ConditionedCallSurface {
  /** The conditioned input that produced this assessment */
  input: ConditionedOwnershipInput;
  /** Underlying price (from best available chain) */
  underlyingPrice: number | null;
  /** Evidence availability */
  evidenceState: "available" | "partial" | "unavailable";
  /** Why evidence is partial or unavailable (null when fully available) */
  evidenceStateReason: string | null;
  /** Evidence freshness */
  evidenceFreshness: "current-session" | "sealed-prior-session" | "stale" | "unavailable";
  /** Evidence metadata */
  evidenceMetadata: {
    provider: string;
    canonicalSessionDate: string | null;
  };
  /** Per-expiration assessment */
  expirations: ConditionedExpirationAssessment[];
  /** Aggregate counts across all eligible expirations */
  summary: {
    expirationsEvaluated: number;
    expirationsWithChains: number;
    totalCallsAboveBasis: number;
    totalCallsQualifying: number;
    totalCallsFailingPolicy: number;
    totalCallsBelowBasis: number;
  };
  /** Bounded set of representative qualifying opportunities (up to 5, sorted by delta proximity to target) */
  representativeOpportunities: ConditionedCallOpportunity[];
}

// ═══════════════════════════════════════════════════════════════════════
// LOADER — Cache Evidence Retrieval
// ═══════════════════════════════════════════════════════════════════════

/**
 * Load call chain evidence from the durable cache for conditioned assessment.
 *
 * Uses the provided DTE range to determine eligible expirations.
 * Returns a normalized evidence bundle for the pure domain function.
 */
export async function loadConditionedCallEvidence(
  underlying: string,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string },
  eligibleDteRange: { min: number; max: number },
  sessionInfo?: { acceptingCanonicalEvidence: boolean; priorSessionOperationallyValid: boolean }
): Promise<ConditionedCallEvidenceBundle> {
  const { provider, environment } = cacheEnvironment;

  // Load expirations
  const expKey = buildCacheKey(provider, environment, "expirations", underlying);
  const expRecord = await cache.get<Array<{ date: string; dte: number }>>(expKey);

  if (!expRecord) {
    return {
      expirationsAvailable: false,
      eligibleExpirations: [],
      chains: [],
      freshness: "unavailable",
      provider,
      canonicalSessionDate: null,
    };
  }

  // Determine freshness from cache record
  const freshness = determineFreshness(cache, expRecord, sessionInfo);

  const allExpirations = expRecord.payload;
  const eligible = selectEligibleExpirations(allExpirations, eligibleDteRange);

  if (eligible.length === 0) {
    return {
      expirationsAvailable: true,
      eligibleExpirations: [],
      chains: [],
      freshness,
      provider,
      canonicalSessionDate: null,
    };
  }

  // Load chains for each eligible expiration
  const chains: ConditionedCallChainEvidence[] = [];

  for (const exp of eligible) {
    const chainKey = buildCacheKey(provider, environment, "chain", underlying, exp.date);
    const chainRecord = await cache.get<{
      underlying?: { price?: number; name?: string };
      calls?: CachedCallContract[];
    }>(chainKey);

    if (!chainRecord) {
      chains.push({
        expiration: exp.date,
        dte: exp.dte,
        chainAvailable: false,
        underlyingPrice: null,
        calls: [],
      });
    } else {
      chains.push({
        expiration: exp.date,
        dte: exp.dte,
        chainAvailable: true,
        underlyingPrice: chainRecord.payload.underlying?.price ?? null,
        calls: chainRecord.payload.calls ?? [],
      });
    }
  }

  return {
    expirationsAvailable: true,
    eligibleExpirations: eligible.map(e => ({ date: e.date, dte: e.dte })),
    chains,
    freshness,
    provider,
    canonicalSessionDate: null, // Could be enriched from session classification if available
  };
}

function determineFreshness(
  cache: DurableMarketCache,
  record: unknown,
  sessionInfo?: { acceptingCanonicalEvidence: boolean; priorSessionOperationallyValid: boolean }
): "current-session" | "sealed-prior-session" | "stale" | "unavailable" {
  if (!sessionInfo) return "sealed-prior-session"; // Conservative default
  if (sessionInfo.acceptingCanonicalEvidence) return "current-session";
  if (sessionInfo.priorSessionOperationallyValid) return "sealed-prior-session";
  return "stale";
}

// ═══════════════════════════════════════════════════════════════════════
// ASSESSMENT — Pure Domain Function
// ═══════════════════════════════════════════════════════════════════════

/**
 * Assess the conditioned call surface from pre-loaded evidence.
 *
 * Pure function — no cache access, fully deterministic from inputs.
 * Uses existing admissibility policy for pass/fail classification.
 * Collects all applicable failure reasons per contract.
 */
export function assessConditionedCallSurface(
  input: ConditionedOwnershipInput,
  evidence: ConditionedCallEvidenceBundle,
  policy: { contractSelection: ContractSelectionPolicy; executionAssessment: ExecutionPolicy }
): ConditionedCallSurface {
  // Determine evidence state
  const { evidenceState, evidenceStateReason } = classifyEvidenceState(input.underlying, evidence);

  // Assess each expiration
  const expirationAssessments: ConditionedExpirationAssessment[] = [];
  const allOpportunities: ConditionedCallOpportunity[] = [];
  let underlyingPrice: number | null = null;

  for (const chain of evidence.chains) {
    const assessment = assessExpiration(chain, input, policy);
    expirationAssessments.push(assessment);

    // Capture underlying price from best available chain
    if (chain.underlyingPrice != null && underlyingPrice == null) {
      underlyingPrice = chain.underlyingPrice;
    }

    // Collect opportunities from this expiration
    const opportunities = evaluateContracts(chain, input, policy);
    allOpportunities.push(...opportunities);
  }

  // Aggregate summary
  const summary = {
    expirationsEvaluated: expirationAssessments.length,
    expirationsWithChains: expirationAssessments.filter(e => e.chainAvailable).length,
    totalCallsAboveBasis: expirationAssessments.reduce((s, e) => s + e.callsAboveBasis, 0),
    totalCallsQualifying: expirationAssessments.reduce((s, e) => s + e.callsQualifying, 0),
    totalCallsFailingPolicy: expirationAssessments.reduce((s, e) => s + e.callsFailingPolicy, 0),
    totalCallsBelowBasis: expirationAssessments.reduce((s, e) => s + e.callsBelowBasis, 0),
  };

  // Select representative opportunities: qualifying, above basis, sorted by delta proximity to target
  const qualifying = allOpportunities
    .filter(o => o.satisfiesPolicy && o.aboveBasis)
    .sort((a, b) =>
      Math.abs(a.delta - policy.contractSelection.targetDelta) -
      Math.abs(b.delta - policy.contractSelection.targetDelta)
    )
    .slice(0, 5);

  return {
    input,
    underlyingPrice,
    evidenceState,
    evidenceStateReason,
    evidenceFreshness: evidence.freshness,
    evidenceMetadata: {
      provider: evidence.provider,
      canonicalSessionDate: evidence.canonicalSessionDate,
    },
    expirations: expirationAssessments,
    summary,
    representativeOpportunities: qualifying,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNAL — Evidence State Classification
// ═══════════════════════════════════════════════════════════════════════

function classifyEvidenceState(
  underlying: string,
  evidence: ConditionedCallEvidenceBundle
): { evidenceState: "available" | "partial" | "unavailable"; evidenceStateReason: string | null } {
  if (!evidence.expirationsAvailable) {
    return { evidenceState: "unavailable", evidenceStateReason: `No expiration data available for ${underlying}` };
  }

  if (evidence.eligibleExpirations.length === 0) {
    return { evidenceState: "unavailable", evidenceStateReason: `No expirations within eligible DTE range for ${underlying}` };
  }

  const chainsWithData = evidence.chains.filter(c => c.chainAvailable);
  if (chainsWithData.length === 0) {
    return { evidenceState: "partial", evidenceStateReason: "Expiration data available but chain evidence missing" };
  }

  if (chainsWithData.length < evidence.chains.length) {
    return {
      evidenceState: "partial",
      evidenceStateReason: `Chain evidence available for ${chainsWithData.length} of ${evidence.chains.length} eligible expirations`,
    };
  }

  return { evidenceState: "available", evidenceStateReason: null };
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNAL — Per-Expiration Assessment
// ═══════════════════════════════════════════════════════════════════════

function assessExpiration(
  chain: ConditionedCallChainEvidence,
  input: ConditionedOwnershipInput,
  policy: { contractSelection: ContractSelectionPolicy; executionAssessment: ExecutionPolicy }
): ConditionedExpirationAssessment {
  if (!chain.chainAvailable) {
    return {
      expiration: chain.expiration,
      dte: chain.dte,
      chainAvailable: false,
      underlyingPrice: null,
      callsTotal: 0,
      callsAboveBasis: 0,
      callsQualifying: 0,
      callsFailingPolicy: 0,
      callsBelowBasis: 0,
      failureReasons: [],
    };
  }

  const basis = input.assumedBasisPerShare;
  const calls = chain.calls;
  const failureReasonCounts = new Map<string, number>();

  let callsAboveBasis = 0;
  let callsQualifying = 0;
  let callsFailingPolicy = 0;
  let callsBelowBasis = 0;

  for (const call of calls) {
    const aboveBasis = call.strike > basis;
    if (!aboveBasis) {
      callsBelowBasis++;
      continue;
    }

    callsAboveBasis++;
    const failures = collectPolicyFailures(call, policy);

    if (failures.length === 0) {
      callsQualifying++;
    } else {
      callsFailingPolicy++;
      for (const reason of failures) {
        failureReasonCounts.set(reason, (failureReasonCounts.get(reason) ?? 0) + 1);
      }
    }
  }

  const failureReasons = Array.from(failureReasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    expiration: chain.expiration,
    dte: chain.dte,
    chainAvailable: true,
    underlyingPrice: chain.underlyingPrice,
    callsTotal: calls.length,
    callsAboveBasis,
    callsQualifying,
    callsFailingPolicy,
    callsBelowBasis,
    failureReasons,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNAL — Per-Contract Evaluation
// ═══════════════════════════════════════════════════════════════════════

function evaluateContracts(
  chain: ConditionedCallChainEvidence,
  input: ConditionedOwnershipInput,
  policy: { contractSelection: ContractSelectionPolicy; executionAssessment: ExecutionPolicy }
): ConditionedCallOpportunity[] {
  if (!chain.chainAvailable) return [];

  const basis = input.assumedBasisPerShare;
  const opportunities: ConditionedCallOpportunity[] = [];

  for (const call of chain.calls) {
    const mid = midPrice(call.bid, call.ask);
    const spread = call.ask - call.bid;
    const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
    const aboveBasis = call.strike > basis;
    const strikeDistance = call.strike - basis;

    const failures = collectPolicyFailures(call, policy);

    // Yield from conditioned basis (not from underlying price)
    const yieldFromBasis = (call.bid > 0 && chain.dte > 0 && basis > 0 && spreadPct <= 30)
      ? annualizedYield(mid, basis, chain.dte)
      : null;

    opportunities.push({
      expiration: chain.expiration,
      dte: chain.dte,
      strike: call.strike,
      delta: call.delta,
      bid: call.bid,
      ask: call.ask,
      mid,
      spreadPercent: spreadPct,
      openInterest: call.openInterest,
      volume: call.volume,
      yieldFromBasis,
      strikeDistanceFromBasis: strikeDistance,
      aboveBasis,
      satisfiesPolicy: failures.length === 0,
      policyFailureReasons: failures,
    });
  }

  return opportunities;
}

/**
 * Collect all applicable policy failure reasons for a call contract.
 * Returns empty array if the contract satisfies all existing policy rules.
 *
 * Uses existing admissibility rules from ContractSelectionPolicy and ExecutionPolicy.
 * Preserves all applicable reasons rather than stopping at the first.
 */
function collectPolicyFailures(
  call: CachedCallContract,
  policy: { contractSelection: ContractSelectionPolicy; executionAssessment: ExecutionPolicy }
): string[] {
  const failures: string[] = [];
  const { contractSelection, executionAssessment } = policy;

  // Delta admissibility (calls use positive delta)
  if (call.delta < contractSelection.admissibleDeltaRange.min) {
    failures.push(`Delta ${call.delta.toFixed(2)} below admissible minimum ${contractSelection.admissibleDeltaRange.min}`);
  }
  if (call.delta > contractSelection.admissibleDeltaRange.max) {
    failures.push(`Delta ${call.delta.toFixed(2)} above admissible maximum ${contractSelection.admissibleDeltaRange.max}`);
  }

  // Execution policy hard exclusions
  if (contractSelection.excludeZeroBid && call.bid <= 0) {
    failures.push("Zero or invalid bid");
  }
  if (contractSelection.requireGreeks && call.delta === 0) {
    failures.push("No greek data available");
  }

  // Hard-no checks from execution policy
  const evidence: ContractEvidence = {
    bid: call.bid,
    ask: call.ask,
    spreadPercent: midPrice(call.bid, call.ask) > 0
      ? ((call.ask - call.bid) / midPrice(call.bid, call.ask)) * 100
      : 100,
    openInterest: call.openInterest,
    volume: call.volume,
    delta: call.delta,
  };

  if (executionAssessment.hardExcludeZeroOI && call.openInterest === 0) {
    failures.push("Zero open interest");
  }
  if (evidence.spreadPercent > executionAssessment.hardExcludeSpreadPercent) {
    failures.push(`Spread ${evidence.spreadPercent.toFixed(0)}% exceeds ${executionAssessment.hardExcludeSpreadPercent}% exclusion floor`);
  }

  return failures;
}
