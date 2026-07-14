/**
 * Wheelwright Brief Builder
 *
 * Pure function. No provider calls. Reads from cached evidence and runtime state only.
 * Produces the view model for the Wheelwright Recommendation Brief drawer.
 *
 * Domain concept: "Wheelwright" represents the recommendation craftsmanship layer —
 * the final inspection bench before committing capital.
 */

import { buildCacheKey, type DurableMarketCache } from "../cache/durable-cache";
import { midPrice, annualizedYield } from "../domain/calculations";
import type { PutCandidate } from "./scan-orchestrator";
import type { PortfolioSnapshot } from "./types";
import type { ContractSelectionPolicy, RecommendationPolicy } from "./recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";

// --- Delta Fit ---

export type DeltaFitCategory = "preferred_band" | "admissible_range" | "extended_fallback";

export interface DeltaFit {
  targetDelta: number;
  selectedDelta: number;
  deviation: number;
  category: DeltaFitCategory;
  label: string;
}

export function classifyDeltaFit(
  selectedDelta: number,
  policy: ContractSelectionPolicy
): DeltaFit {
  const absDelta = Math.abs(selectedDelta);
  const deviation = absDelta - policy.targetDelta;

  let category: DeltaFitCategory;
  let label: string;

  if (absDelta >= policy.preferredDeltaBand.min && absDelta <= policy.preferredDeltaBand.max) {
    category = "preferred_band";
    label = "Preferred";
  } else if (absDelta >= policy.admissibleDeltaRange.min && absDelta <= policy.admissibleDeltaRange.max) {
    category = "admissible_range";
    label = "Admissible";
  } else {
    category = "extended_fallback";
    label = "Extended";
  }

  return {
    targetDelta: policy.targetDelta,
    selectedDelta: absDelta,
    deviation: Math.round(deviation * 100) / 100,
    category,
    label,
  };
}

// --- Neighborhood Policy Tags ---

export type NeighborTag =
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

export interface NeighborContract {
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  yieldAnnualized: number | null;
  isSelected: boolean;
  tag: NeighborTag;
}

export interface StrikeNeighborhood {
  contracts: NeighborContract[];
  coverageGap: boolean;
}

// --- Position Impact ---

export interface PutPositionImpact {
  cashRequired: number;
  deployableCashBefore: number;
  cashRemainingAfter: number;
  sharesIfAssigned: number;
  effectiveCostBasis: number;
  resultingCallCapacity: number;
  existingExposure: { symbol: string; type: string; quantity: number }[];
}

// --- Evidence Provenance ---

export interface WheelwrightProvenance {
  provider: string;
  canonicalSessionDate: string;
  sessionState: string;
  evidenceStatus: string;
  cacheSource: string;
}

// --- Table Position Context ---

export interface TablePositionContext {
  tablePosition: number;
  sortedBy: string;
  sortLabel: string;
}

// --- Full View Model ---

export interface WheelwrightBriefViewModel {
  identity: {
    symbol: string;
    name: string | null;
    strike: number;
    expiration: string;
    dte: number;
    side: "put" | "call";
    rank: number;
    posture: string;
    rankingObjective: string;
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
    premiumAtBid: number;
    yieldAnnualized: number | null;
    cashRequired: number;
    cashRemaining: number;
    effectiveCostBasis: number;
  };
  deltaFit: DeltaFit;
  neighborhood: StrikeNeighborhood;
  positionImpact: PutPositionImpact;
  provenance: WheelwrightProvenance;
  tablePosition: TablePositionContext | null;
}

// Legacy alias for backward compatibility
export type RecommendationBriefViewModel = WheelwrightBriefViewModel;

// --- Wheelwright Brief Builder ---

export async function buildWheelwrightBrief(
  candidate: PutCandidate,
  policy: RecommendationPolicy,
  portfolio: PortfolioSnapshot,
  sessionClassification: MarketSessionClassification,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string },
  tablePosition: TablePositionContext | null = null
): Promise<WheelwrightBriefViewModel> {
  // Delta fit
  const deltaFit = classifyDeltaFit(candidate.delta, policy.contractSelection);

  // Strike neighborhood (also extracts ETF name)
  const { neighborhood, instrumentName } = await buildStrikeNeighborhoodWithName(
    candidate,
    policy,
    cache,
    cacheEnvironment
  );

  // Position impact
  const premiumPerShare = candidate.bid;
  const effectiveCostBasis = candidate.strike - premiumPerShare;
  const positionImpact: PutPositionImpact = {
    cashRequired: candidate.cashRequired,
    deployableCashBefore: portfolio.deployableCash ?? 0,
    cashRemainingAfter: (portfolio.deployableCash ?? 0) - candidate.cashRequired,
    sharesIfAssigned: 100,
    effectiveCostBasis,
    resultingCallCapacity: 1,
    existingExposure: findExistingExposure(candidate.symbol, portfolio),
  };

  // Provenance
  const provenance: WheelwrightProvenance = {
    provider: cacheEnvironment.provider,
    canonicalSessionDate: sessionClassification.canonicalSessionDate,
    sessionState: sessionClassification.state,
    evidenceStatus: sessionClassification.acceptingCanonicalEvidence
      ? "Current-session canonical"
      : sessionClassification.priorSessionOperationallyValid
        ? "Prior-session canonical (sealed)"
        : "Sealed canonical",
    cacheSource: "IndexedDB",
  };

  // Ranking objective label
  const objectiveLabels: Record<string, string> = {
    execution_first: "Execution First",
    balanced: "Balanced",
    yield_first: "Yield First",
    capital_efficiency: "Capital Efficiency",
  };

  return {
    identity: {
      symbol: candidate.symbol,
      name: instrumentName,
      strike: candidate.strike,
      expiration: candidate.expiration,
      dte: candidate.dte,
      side: "put",
      rank: candidate.rank,
      posture: candidate.posture,
      rankingObjective: objectiveLabels[policy.ranking.mode] ?? policy.ranking.mode,
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
      premiumAtBid: candidate.bid * 100,
      yieldAnnualized: candidate.yieldAnnualized,
      cashRequired: candidate.cashRequired,
      cashRemaining: candidate.cashRemaining,
      effectiveCostBasis,
    },
    deltaFit,
    neighborhood,
    positionImpact,
    provenance,
    tablePosition,
  };
}

/** @deprecated Use buildWheelwrightBrief */
export const buildRecommendationBrief = buildWheelwrightBrief;

// --- Strike Neighborhood Builder (with instrument name extraction) ---

interface NeighborhoodResult {
  neighborhood: StrikeNeighborhood;
  instrumentName: string | null;
}

async function buildStrikeNeighborhoodWithName(
  candidate: PutCandidate,
  policy: RecommendationPolicy,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string }
): Promise<NeighborhoodResult> {
  interface CachedPut { strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }
  interface CachedChain { underlying?: { name?: string }; puts?: CachedPut[] }

  const chainKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "chain", candidate.symbol, candidate.expiration);
  const chainRecord = await cache.get<CachedChain>(chainKey);

  if (!chainRecord) {
    return { neighborhood: { contracts: [], coverageGap: true }, instrumentName: null };
  }

  // Extract instrument name from cached chain data
  const instrumentName = chainRecord.payload.underlying?.name ?? null;
  const isJustSymbol = instrumentName === candidate.symbol.toUpperCase() || instrumentName === candidate.symbol;
  const resolvedName = isJustSymbol ? null : instrumentName;

  const puts = chainRecord.payload.puts ?? [];
  if (puts.length === 0) {
    return { neighborhood: { contracts: [], coverageGap: false }, instrumentName: resolvedName };
  }

  // Sort by strike ascending
  const sorted = [...puts].sort((a, b) => a.strike - b.strike);

  // Find the selected strike's index
  const selectedIdx = sorted.findIndex((p) => p.strike === candidate.strike);
  if (selectedIdx === -1) {
    const nearest = sorted.slice(0, 5);
    return {
      neighborhood: {
        contracts: nearest.map((p) => buildNeighbor(p, candidate, policy, false)),
        coverageGap: false,
      },
      instrumentName: resolvedName,
    };
  }

  // Show 2 below, selected, 2 above (5 total)
  const start = Math.max(0, selectedIdx - 2);
  const end = Math.min(sorted.length, selectedIdx + 3);
  const window = sorted.slice(start, end);

  const contracts: NeighborContract[] = window.map((p) =>
    buildNeighbor(p, candidate, policy, p.strike === candidate.strike)
  );

  return { neighborhood: { contracts, coverageGap: false }, instrumentName: resolvedName };
}

function buildNeighbor(
  put: { strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number },
  selected: PutCandidate,
  policy: RecommendationPolicy,
  isSelected: boolean
): NeighborContract {
  const mid = midPrice(put.bid, put.ask);
  const spread = put.ask - put.bid;
  const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
  const yld = spreadPct <= 30 && put.bid > 0 && selected.dte > 0
    ? annualizedYield(put.bid, put.strike, selected.dte)
    : null;

  let tag: NeighborTag;

  if (isSelected) {
    tag = "SELECTED";
  } else if (put.bid <= 0) {
    tag = "LOW_PREMIUM";
  } else if (put.delta === 0) {
    tag = "NO_GREEKS";
  } else if (Math.abs(put.delta) < policy.contractSelection.admissibleDeltaRange.min) {
    tag = "LOW_DELTA";
  } else if (Math.abs(put.delta) > policy.contractSelection.admissibleDeltaRange.max) {
    tag = "HIGH_DELTA";
  } else if (put.openInterest === 0) {
    tag = "LOW_OI";
  } else if (spreadPct > 80) {
    tag = "EXCLUDED";
  } else {
    // Valid alternative that scored lower — determine primary reason
    const absDeltaDev = Math.abs(Math.abs(put.delta) - policy.contractSelection.targetDelta);
    const selectedDev = Math.abs(Math.abs(selected.delta) - policy.contractSelection.targetDelta);
    if (absDeltaDev > selectedDev) {
      tag = "OUTSIDE_TARGET";
    } else if (spreadPct > selected.spreadPercent * 1.5) {
      tag = "WIDE_SPREAD";
    } else if (put.openInterest < selected.openInterest * 0.5) {
      tag = "LOW_OI";
    } else if (yld != null && selected.yieldAnnualized != null && yld < selected.yieldAnnualized) {
      tag = "LOWER_YIELD";
    } else {
      tag = "LOWER_EXEC";
    }
  }

  return {
    strike: put.strike,
    delta: put.delta,
    bid: put.bid,
    ask: put.ask,
    spreadPercent: spreadPct,
    openInterest: put.openInterest,
    volume: put.volume,
    yieldAnnualized: yld,
    isSelected,
    tag,
  };
}

// --- Existing Exposure ---

function findExistingExposure(symbol: string, portfolio: PortfolioSnapshot): { symbol: string; type: string; quantity: number }[] {
  const exposure: { symbol: string; type: string; quantity: number }[] = [];

  for (const put of portfolio.existingPuts) {
    if (put.underlying.toUpperCase() === symbol.toUpperCase()) {
      exposure.push({ symbol: put.underlying, type: `Short put $${put.strike} ${put.expiration}`, quantity: put.quantity });
    }
  }

  for (const call of portfolio.existingCalls) {
    if (call.underlying.toUpperCase() === symbol.toUpperCase()) {
      exposure.push({ symbol: call.underlying, type: `Short call $${call.strike} ${call.expiration}`, quantity: call.quantity });
    }
  }

  for (const pos of portfolio.inventory) {
    if (pos.symbol.toUpperCase() === symbol.toUpperCase()) {
      exposure.push({ symbol: pos.symbol, type: `${pos.sharesOwned} shares owned`, quantity: pos.sharesOwned });
    }
  }

  return exposure;
}
