/**
 * Call Brief Builder
 *
 * Pure function. No provider calls. Reads from cached evidence only.
 * Produces the view model for the Call Inspection Drawer.
 *
 * Analogous to brief-builder.ts (put drawer) but for covered-call candidates.
 * Reads call chains from the durable cache to build strike neighborhood.
 */

import { buildCacheKey, type DurableMarketCache } from "../cache/durable-cache";
import { midPrice, annualizedYield } from "../domain/calculations";
import { classifyDeltaFit, type DeltaFit } from "./brief-builder";
import type { CallCandidate } from "./scan-orchestrator";
import type { PositionEconomics } from "./types";
import type { ContractSelectionPolicy, RecommendationPolicy } from "./recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";
import { buildPostureExplanation, type PostureExplanation } from "./posture-explanation";

// --- Call Neighbor Tag ---

export type CallNeighborTag =
  | "SELECTED"
  | "HIGH_DELTA"
  | "LOW_DELTA"
  | "OUTSIDE_TARGET"
  | "LOW_PREMIUM"
  | "WIDE_SPREAD"
  | "LOW_OI"
  | "NO_GREEKS"
  | "EXCLUDED"
  | "LOWER_YIELD"
  | "LOWER_EXEC";

// --- Call Neighbor Contract ---

export interface CallNeighborContract {
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  yieldAnnualized: number | null;
  isSelected: boolean;
  tag: CallNeighborTag;
}

// --- Call Strike Neighborhood ---

export interface CallStrikeNeighborhood {
  contracts: CallNeighborContract[];
  coverageGap: boolean;
}

// --- Position Context ---

export interface CallPositionContext {
  /** Shares available for this call */
  freeShares: number;
  /** Maximum contracts that can be written */
  maxContracts: number;
  /** Average cost per share (null when unavailable) */
  averageCostPerShare: number | null;
  /** Current underlying price */
  underlyingPrice: number;
  /** Unrealized gain/loss per share (null when basis unavailable) */
  unrealizedPerShare: number | null;
  /** Total unrealized gain/loss for free shares (null when basis unavailable) */
  unrealizedTotal: number | null;
  /** Projected called-away economics (conditional on execution + assignment) */
  projectedCalledAway: ProjectedCalledAway | null;
}

// --- Projected Called-Away Economics ---

/**
 * Projected economics if the call is written at modeled premium and shares are called away.
 * Conditional on both execution and assignment. Not a realized outcome.
 */
export interface ProjectedCalledAway {
  /** The premium assumption used */
  premiumAssumption: "midpoint";
  /** Modeled premium per share (mid) */
  modeledPremiumPerShare: number;
  /** Modeled premium per contract (mid × 100) */
  modeledPremiumPerContract: number;
  /** Strike + modeled premium per share */
  projectedEffectiveSalePricePerShare: number;
  /** Broker-reported cost basis per share (null when unavailable) */
  costBasisPerShare: number | null;
  /** Projected gain/loss per share relative to basis (null when basis unavailable) */
  projectedGainPerShare: number | null;
  /** Contracts represented by this deployment */
  maximumContracts: number;
  /** Shares covered at maximum deployment */
  coveredSharesAtMaximumDeployment: number;
  /** Total projected gain/loss at maximum deployment (null when basis unavailable) */
  projectedTotalGainAtMaximumDeployment: number | null;
  /** Why gain/loss cannot be calculated (null when it can) */
  unavailableReason: string | null;
}

// --- Provenance ---

export interface CallBriefProvenance {
  provider: string;
  canonicalSessionDate: string;
  sessionState: string;
  evidenceStatus: string;
}

// --- Full View Model ---

export interface CallBriefViewModel {
  identity: {
    symbol: string;
    name: string | null;
    strike: number;
    expiration: string;
    dte: number;
    side: "call";
    rank: number;
    posture: string;
  };
  decision: {
    bid: number;
    mid: number;
    ask: number;
    absoluteSpread: number;
    spreadPercent: number;
    delta: number;
    openInterest: number;
    volume: number;
    premiumPerContract: number;
    yieldAnnualized: number | null;
    maxContracts: number;
    strikeAbovePrice: boolean;
  };
  deltaFit: DeltaFit;
  neighborhood: CallStrikeNeighborhood;
  positionContext: CallPositionContext;
  postureExplanation: PostureExplanation;
  provenance: CallBriefProvenance;
}

// --- Builder ---

/**
 * Build a CallBriefViewModel from a CallCandidate and cached evidence.
 *
 * Reads the call chain from the durable cache to construct the strike neighborhood.
 * Zero provider calls. Deterministic from cache state + candidate + policy.
 */
export async function buildCallBrief(
  candidate: CallCandidate,
  policy: RecommendationPolicy,
  sessionClassification: MarketSessionClassification,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string }
): Promise<CallBriefViewModel> {
  // Delta fit (reuse shared classifier)
  const deltaFit = classifyDeltaFit(candidate.delta, policy.contractSelection);

  // Strike neighborhood + instrument name
  const { neighborhood, instrumentName } = await buildCallNeighborhood(
    candidate,
    policy,
    cache,
    cacheEnvironment
  );

  // Position context
  const economics = candidate.economics;
  const averageCost = economics?.averageCostPerShare ?? null;
  const unrealizedPerShare = averageCost != null
    ? candidate.underlyingPrice - averageCost
    : null;
  const unrealizedTotal = unrealizedPerShare != null
    ? unrealizedPerShare * candidate.freeShares
    : null;

  const positionContext: CallPositionContext = {
    freeShares: candidate.freeShares,
    maxContracts: candidate.maxContracts,
    averageCostPerShare: averageCost,
    underlyingPrice: candidate.underlyingPrice,
    unrealizedPerShare,
    unrealizedTotal,
    projectedCalledAway: buildProjectedCalledAway(candidate, averageCost),
  };

  // Posture explanation — reuses shared model; governance not applicable for held-inventory calls
  const postureExplanation = buildPostureExplanation(
    candidate.assessment,
    deltaFit,
    null, // Governance is not part of the call recommendation path
    policy.executionAssessment
  );

  // Provenance — derived from session classification (available data only)
  const evidenceStatus = sessionClassification.acceptingCanonicalEvidence
    ? "Current-session canonical"
    : sessionClassification.priorSessionOperationallyValid
      ? "Prior-session canonical (sealed)"
      : "Sealed canonical";

  const provenance: CallBriefProvenance = {
    provider: cacheEnvironment.provider,
    canonicalSessionDate: sessionClassification.canonicalSessionDate,
    sessionState: sessionClassification.state,
    evidenceStatus,
  };

  return {
    identity: {
      symbol: candidate.symbol,
      name: instrumentName,
      strike: candidate.strike,
      expiration: candidate.expiration,
      dte: candidate.dte,
      side: "call",
      rank: candidate.rank,
      posture: candidate.posture,
    },
    decision: {
      bid: candidate.bid,
      mid: candidate.mid,
      ask: candidate.ask,
      absoluteSpread: candidate.ask - candidate.bid,
      spreadPercent: candidate.spreadPercent,
      delta: candidate.delta,
      openInterest: candidate.openInterest,
      volume: candidate.volume,
      premiumPerContract: candidate.premiumPerContract,
      yieldAnnualized: candidate.yieldAnnualized,
      maxContracts: candidate.maxContracts,
      strikeAbovePrice: candidate.strikeAbovePrice,
    },
    deltaFit,
    neighborhood,
    positionContext,
    postureExplanation,
    provenance,
  };
}

// --- Projected Called-Away Economics Builder ---

function buildProjectedCalledAway(
  candidate: CallCandidate,
  averageCost: number | null
): ProjectedCalledAway | null {
  // Cannot project without a valid modeled premium
  if (candidate.mid <= 0) return null;

  const modeledPremiumPerShare = candidate.mid;
  const projectedEffectiveSalePricePerShare = candidate.strike + modeledPremiumPerShare;
  const maximumContracts = candidate.maxContracts;
  const coveredSharesAtMaximumDeployment = maximumContracts * 100;

  let projectedGainPerShare: number | null = null;
  let projectedTotalGainAtMaximumDeployment: number | null = null;
  let unavailableReason: string | null = null;

  if (averageCost != null) {
    projectedGainPerShare = projectedEffectiveSalePricePerShare - averageCost;
    projectedTotalGainAtMaximumDeployment = projectedGainPerShare * coveredSharesAtMaximumDeployment;
  } else {
    unavailableReason = "Position cost basis not available";
  }

  return {
    premiumAssumption: "midpoint",
    modeledPremiumPerShare,
    modeledPremiumPerContract: modeledPremiumPerShare * 100,
    projectedEffectiveSalePricePerShare,
    costBasisPerShare: averageCost,
    projectedGainPerShare,
    maximumContracts,
    coveredSharesAtMaximumDeployment,
    projectedTotalGainAtMaximumDeployment,
    unavailableReason,
  };
}

// --- Call Neighborhood Builder ---

interface CallNeighborhoodResult {
  neighborhood: CallStrikeNeighborhood;
  instrumentName: string | null;
}

async function buildCallNeighborhood(
  candidate: CallCandidate,
  policy: RecommendationPolicy,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string }
): Promise<CallNeighborhoodResult> {
  interface CachedCall { strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }
  interface CachedChain { underlying?: { name?: string; price?: number }; calls?: CachedCall[] }

  const chainKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "chain", candidate.symbol, candidate.expiration);
  const chainRecord = await cache.get<CachedChain>(chainKey);

  if (!chainRecord) {
    return { neighborhood: { contracts: [], coverageGap: true }, instrumentName: null };
  }

  // Extract instrument name
  const instrumentName = chainRecord.payload.underlying?.name ?? null;
  const isJustSymbol = instrumentName === candidate.symbol.toUpperCase() || instrumentName === candidate.symbol;
  const resolvedName = isJustSymbol ? null : instrumentName;

  const calls = chainRecord.payload.calls ?? [];
  if (calls.length === 0) {
    return { neighborhood: { contracts: [], coverageGap: false }, instrumentName: resolvedName };
  }

  // Sort by strike ascending
  const sorted = [...calls].sort((a, b) => a.strike - b.strike);

  // Find the selected strike's index
  const selectedIdx = sorted.findIndex((c) => c.strike === candidate.strike);
  if (selectedIdx === -1) {
    // Selected strike not in chain — show nearest 5
    const nearest = sorted.slice(0, 5);
    return {
      neighborhood: {
        contracts: nearest.map((c) => buildCallNeighbor(c, candidate, policy, false)),
        coverageGap: false,
      },
      instrumentName: resolvedName,
    };
  }

  // Show 2 below, selected, 2 above (5 total)
  const start = Math.max(0, selectedIdx - 2);
  const end = Math.min(sorted.length, selectedIdx + 3);
  const window = sorted.slice(start, end);

  const contracts: CallNeighborContract[] = window.map((c) =>
    buildCallNeighbor(c, candidate, policy, c.strike === candidate.strike)
  );

  return { neighborhood: { contracts, coverageGap: false }, instrumentName: resolvedName };
}

// --- Individual Neighbor Builder ---

function buildCallNeighbor(
  call: { strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number },
  selected: CallCandidate,
  policy: RecommendationPolicy,
  isSelected: boolean
): CallNeighborContract {
  const mid = midPrice(call.bid, call.ask);
  const spread = call.ask - call.bid;
  const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
  const yld = spreadPct <= 30 && call.bid > 0 && selected.dte > 0
    ? annualizedYield(mid, selected.underlyingPrice, selected.dte)
    : null;

  let tag: CallNeighborTag;

  if (isSelected) {
    tag = "SELECTED";
  } else if (call.bid <= 0) {
    tag = "LOW_PREMIUM";
  } else if (call.delta === 0) {
    tag = "NO_GREEKS";
  } else if (call.delta < policy.contractSelection.admissibleDeltaRange.min) {
    tag = "LOW_DELTA";
  } else if (call.delta > policy.contractSelection.admissibleDeltaRange.max) {
    tag = "HIGH_DELTA";
  } else if (call.openInterest === 0) {
    tag = "LOW_OI";
  } else if (spreadPct > 80) {
    tag = "EXCLUDED";
  } else {
    // Valid alternative — determine primary reason it scored lower
    const deltaDev = Math.abs(call.delta - policy.contractSelection.targetDelta);
    const selectedDev = Math.abs(selected.delta - policy.contractSelection.targetDelta);
    if (deltaDev > selectedDev) {
      tag = "OUTSIDE_TARGET";
    } else if (spreadPct > selected.spreadPercent * 1.5) {
      tag = "WIDE_SPREAD";
    } else if (call.openInterest < selected.openInterest * 0.5) {
      tag = "LOW_OI";
    } else if (yld != null && selected.yieldAnnualized != null && yld < selected.yieldAnnualized) {
      tag = "LOWER_YIELD";
    } else {
      tag = "LOWER_EXEC";
    }
  }

  return {
    strike: call.strike,
    delta: call.delta,
    bid: call.bid,
    ask: call.ask,
    spreadPercent: spreadPct,
    openInterest: call.openInterest,
    volume: call.volume,
    yieldAnnualized: yld,
    isSelected,
    tag,
  };
}
