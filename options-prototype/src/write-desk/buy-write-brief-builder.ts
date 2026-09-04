/**
 * Buy-Write Brief Builder
 *
 * Pure function. No provider calls. Reads from cached evidence only.
 * Produces the view model for the Buy-Write Recommendation Drawer.
 *
 * Analogous to brief-builder.ts (put drawer) and call-brief-builder.ts (call drawer).
 */

import { buildCacheKey, type DurableMarketCache } from "../cache/durable-cache";
import { midPrice, annualizedYield } from "../domain/calculations";
import { classifyDeltaFit, type DeltaFit } from "./brief-builder";
import type { BuyWriteCandidate, BuyWriteCompositeEconomics } from "./recommend-buy-writes";
import type { RecommendationPolicy } from "./recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";
import { buildPostureExplanation, type PostureExplanation } from "./posture-explanation";
import type { GovernanceAnnotation } from "./candidate-types";

// --- Neighbor Contract (for strike neighborhood) ---

export type BuyWriteNeighborTag =
  | "SELECTED"
  | "HIGH_DELTA"
  | "LOW_DELTA"
  | "OUTSIDE_TARGET"
  | "LOW_PREMIUM"
  | "WIDE_SPREAD"
  | "LOW_OI"
  | "NO_GREEKS"
  | "EXCLUDED"
  | "BELOW_PRICE"
  | "LOWER_YIELD"
  | "LOWER_EXEC";

export interface BuyWriteNeighborContract {
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  /** Premium yield (annualized) for this contract */
  premiumYieldAnnualized: number;
  /** Total return if assigned (annualized) for this contract */
  totalReturnAnnualized: number;
  /** Whether this strike is above the underlying price */
  strikeAbovePrice: boolean;
  isSelected: boolean;
  tag: BuyWriteNeighborTag;
}

export interface BuyWriteStrikeNeighborhood {
  contracts: BuyWriteNeighborContract[];
  coverageGap: boolean;
}

// --- Provenance ---

export interface BuyWriteBriefProvenance {
  provider: string;
  canonicalSessionDate: string;
  sessionState: string;
  evidenceStatus: string;
}

// --- Full View Model ---

export interface BuyWriteBriefViewModel {
  identity: {
    symbol: string;
    name: string | null;
    strike: number;
    expiration: string;
    dte: number;
    side: "buy-write";
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
    underlyingPrice: number;
    premiumPerContract: number;
    premiumYieldAnnualized: number;
    strikeAbovePrice: boolean;
  };
  economics: BuyWriteCompositeEconomics;
  deltaFit: DeltaFit;
  neighborhood: BuyWriteStrikeNeighborhood;
  postureExplanation: PostureExplanation;
  governance: GovernanceAnnotation;
  provenance: BuyWriteBriefProvenance;
  /** Fidelity quick-reference card data */
  fidelityCard: {
    symbol: string;
    sharesQty: number;
    callExpiration: string;
    callStrike: number;
    netDebitPerShare: number;
    netDebitTotal: number;
    /** URL to open Fidelity trade page with symbol pre-populated */
    url: string;
  };
}

// --- Builder ---

/**
 * Build a BuyWriteBriefViewModel from a BuyWriteCandidate and cached evidence.
 *
 * Reads the call chain from the durable cache to construct the strike neighborhood.
 * Zero provider calls. Deterministic from cache state + candidate + policy.
 */
export async function buildBuyWriteBrief(
  candidate: BuyWriteCandidate,
  policy: RecommendationPolicy,
  sessionClassification: MarketSessionClassification,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string }
): Promise<BuyWriteBriefViewModel> {
  // Delta fit (reuse shared classifier)
  const deltaFit = classifyDeltaFit(candidate.delta, policy.contractSelection);

  // Strike neighborhood + instrument name
  const { neighborhood, instrumentName } = await buildBuyWriteNeighborhood(
    candidate,
    policy,
    cache,
    cacheEnvironment
  );

  // Posture explanation
  const postureExplanation = buildPostureExplanation(
    candidate.assessment,
    deltaFit,
    candidate.governance,
    policy.executionAssessment
  );

  // Provenance
  const provenance: BuyWriteBriefProvenance = {
    provider: cacheEnvironment.provider,
    canonicalSessionDate: sessionClassification.canonicalSessionDate,
    sessionState: sessionClassification.state,
    evidenceStatus: sessionClassification.acceptingCanonicalEvidence
      ? "Current-session canonical"
      : sessionClassification.priorSessionOperationallyValid
        ? "Prior-session canonical (sealed)"
        : "Sealed canonical",
  };

  // Fidelity quick-reference card
  const fidelityUrl = `https://digital.fidelity.com/ftgw/digital/trade-options?ORDER_TYPE=O&SECURITY_ID=${candidate.symbol}&trade=rocfly`;
  const fidelityCard = {
    symbol: candidate.symbol,
    sharesQty: 100,
    callExpiration: candidate.expiration,
    callStrike: candidate.strike,
    netDebitPerShare: candidate.economics.netDebitPerShare,
    netDebitTotal: candidate.economics.netDebitTotal,
    url: fidelityUrl,
  };

  return {
    identity: {
      symbol: candidate.symbol,
      name: instrumentName,
      strike: candidate.strike,
      expiration: candidate.expiration,
      dte: candidate.dte,
      side: "buy-write",
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
      underlyingPrice: candidate.underlyingPrice,
      premiumPerContract: candidate.mid * 100,
      premiumYieldAnnualized: candidate.premiumYieldAnnualized,
      strikeAbovePrice: candidate.strikeAbovePrice,
    },
    economics: candidate.economics,
    deltaFit,
    neighborhood,
    postureExplanation,
    governance: candidate.governance,
    provenance,
    fidelityCard,
  };
}

// --- Strike Neighborhood Builder ---

async function buildBuyWriteNeighborhood(
  candidate: BuyWriteCandidate,
  policy: RecommendationPolicy,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string }
): Promise<{ neighborhood: BuyWriteStrikeNeighborhood; instrumentName: string | null }> {
  const chainKey = buildCacheKey(
    cacheEnvironment.provider,
    cacheEnvironment.environment,
    "chain",
    candidate.symbol,
    candidate.expiration
  );

  interface CachedChain {
    calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>;
    underlying?: { name?: string; symbol?: string; price?: number };
  }

  const chainRecord = await cache.get<CachedChain>(chainKey);
  if (!chainRecord) {
    return { neighborhood: { contracts: [], coverageGap: true }, instrumentName: null };
  }

  const calls = chainRecord.payload.calls ?? [];
  const underlyingPrice = chainRecord.payload.underlying?.price ?? candidate.underlyingPrice;
  const instrumentName = chainRecord.payload.underlying?.name ?? null;

  // Find contracts around the selected strike
  const sortedByStrike = [...calls].sort((a, b) => a.strike - b.strike);
  const selectedIdx = sortedByStrike.findIndex(c => c.strike === candidate.strike);

  // Show 2 strikes above and below the selected
  const windowSize = 2;
  const startIdx = Math.max(0, selectedIdx - windowSize);
  const endIdx = Math.min(sortedByStrike.length - 1, selectedIdx + windowSize);
  const window = sortedByStrike.slice(startIdx, endIdx + 1);

  const contracts: BuyWriteNeighborContract[] = window.map(c => {
    const mid = midPrice(c.bid, c.ask);
    const spread = c.ask - c.bid;
    const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
    const isSelected = c.strike === candidate.strike;
    const premiumYield = annualizedYield(mid, underlyingPrice, candidate.dte);
    const appreciation = c.strike - underlyingPrice;
    const totalGainPerShare = mid + appreciation;
    const totalReturnAnn = candidate.dte > 0 && underlyingPrice > 0
      ? (totalGainPerShare / underlyingPrice) * (365 / candidate.dte) * 100
      : 0;
    const strikeAbove = c.strike > underlyingPrice;

    // Tag assignment
    let tag: BuyWriteNeighborTag;
    if (isSelected) {
      tag = "SELECTED";
    } else if (!strikeAbove) {
      tag = "BELOW_PRICE";
    } else if (c.delta === 0) {
      tag = "NO_GREEKS";
    } else if (c.bid <= 0) {
      tag = "LOW_PREMIUM";
    } else if (spreadPct > policy.executionAssessment.hardExcludeSpreadPercent) {
      tag = "WIDE_SPREAD";
    } else if (c.openInterest < 10) {
      tag = "LOW_OI";
    } else if (c.delta > policy.contractSelection.admissibleDeltaRange.max) {
      tag = "HIGH_DELTA";
    } else if (c.delta < policy.contractSelection.admissibleDeltaRange.min) {
      tag = "LOW_DELTA";
    } else if (totalReturnAnn < candidate.totalReturnIfAssignedAnnualized) {
      tag = "LOWER_YIELD";
    } else {
      tag = "OUTSIDE_TARGET";
    }

    return {
      strike: c.strike,
      delta: c.delta,
      bid: c.bid,
      ask: c.ask,
      spreadPercent: spreadPct,
      openInterest: c.openInterest,
      volume: c.volume,
      premiumYieldAnnualized: premiumYield,
      totalReturnAnnualized: totalReturnAnn,
      strikeAbovePrice: strikeAbove,
      isSelected,
      tag,
    };
  });

  return {
    neighborhood: { contracts, coverageGap: false },
    instrumentName,
  };
}
