/**
 * Call Recommendation Engine — Pure cache-based covered-call evaluation.
 *
 * INVARIANT: This module NEVER makes provider calls.
 * It operates entirely on the IndexedDB durable cache, same as recommendPuts().
 *
 * Responsibilities:
 * - Identify inventory positions with free shares (≥ 100, quantized)
 * - Select call contracts from cached chains
 * - Execution assessment (same as puts: spread, OI, delta)
 * - Posture assignment
 * - Ranking
 *
 * Input: InventoryPosition[] from PortfolioSnapshot
 * Output: CallCandidate[] ranked by execution quality and yield
 */

import type { Expiration } from "../domain/types";
import { selectEligibleExpirations } from "../velvet-rope/evaluate";
import { midPrice, annualizedYield } from "../domain/calculations";
import { assessExecution, isHardNo, type ContractEvidence, type ActionPosture } from "./execution-assessment";
import { type DurableMarketCache, buildCacheKey } from "../cache/durable-cache";
import type { ExecutionPolicy } from "./execution-policy";
import type { CallCandidate } from "./scan-orchestrator";
import type { InventoryPosition } from "./types";
import type { RecommendationPolicy } from "./recommend";

// --- Result ---

export interface CallRecommendationResult {
  candidates: CallCandidate[];
  waitCandidates: CallCandidate[];
  /** Inventory items that were evaluated but produced no candidate */
  excluded: { symbol: string; reason: string }[];
  /** Symbols with call capacity */
  eligiblePositions: number;
  /** Symbols that produced at least one candidate */
  symbolsWithCandidates: number;
}

// --- Engine ---

/**
 * Recommend covered calls for held inventory positions.
 *
 * Reads chain evidence from the durable cache (IndexedDB).
 * Zero provider calls. Deterministic from cache state + policy.
 */
export async function recommendCalls(
  inventory: InventoryPosition[],
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string },
  policy: RecommendationPolicy,
  options?: { sessionClosed?: boolean }
): Promise<CallRecommendationResult> {
  const allCandidates: CallCandidate[] = [];
  const allWait: CallCandidate[] = [];
  const excluded: { symbol: string; reason: string }[] = [];

  // Only positions with free shares that can cover at least 1 contract
  const eligible = inventory.filter((p) => p.maxAdditionalContracts > 0);
  const useSessionValidity = options?.sessionClosed ?? false;

  function isEligible(record: unknown): boolean {
    if (!record) return false;
    if (useSessionValidity) return true;
    const freshness = cache.freshness(record as Parameters<typeof cache.freshness>[0]);
    return freshness === "fresh" || freshness === "stale_usable";
  }

  for (const pos of eligible) {
    const symbol = pos.symbol;

    // Get expirations from cache
    const expKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "expirations", symbol);
    const expRecord = await cache.get<Expiration[]>(expKey);
    if (!expRecord || !isEligible(expRecord)) {
      excluded.push({ symbol, reason: "No cached expirations" });
      continue;
    }

    const expirations = expRecord.payload;
    const eligibleExps = selectEligibleExpirations(expirations, policy.contractSelection.eligibleDteRange);
    if (eligibleExps.length === 0) {
      excluded.push({ symbol, reason: "No eligible expiration in DTE range" });
      continue;
    }

    // Evaluate call chains
    let bestCandidate: CallCandidate | null = null;
    let bestWait: CallCandidate | null = null;

    for (const exp of eligibleExps) {
      interface CachedChain {
        calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>;
        underlying?: { name?: string; symbol?: string; price?: number };
      }
      const chainKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "chain", symbol, exp.date);
      const chainRecord = await cache.get<CachedChain>(chainKey);
      if (!chainRecord || !isEligible(chainRecord)) continue;

      const calls = chainRecord.payload.calls ?? [];
      const underlyingPrice = chainRecord.payload.underlying?.price ?? 0;
      if (underlyingPrice <= 0) continue;

      // Filter by admissible delta range (calls use positive delta)
      const { admissibleDeltaRange, excludeZeroBid, requireGreeks } = policy.contractSelection;
      const inRange = calls.filter((c) =>
        (!excludeZeroBid || c.bid > 0) &&
        (!requireGreeks || c.delta !== 0) &&
        c.delta >= admissibleDeltaRange.min &&
        c.delta <= admissibleDeltaRange.max
      );

      if (inRange.length === 0) continue;

      // Find contract closest to target delta
      const targetDelta = policy.contractSelection.targetDelta;
      const sorted = [...inRange].sort((a, b) =>
        Math.abs(a.delta - targetDelta) - Math.abs(b.delta - targetDelta)
      );
      const contract = sorted[0];

      const mid = midPrice(contract.bid, contract.ask);
      const spread = contract.ask - contract.bid;
      const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;

      const evidence: ContractEvidence = {
        bid: contract.bid,
        ask: contract.ask,
        spreadPercent: spreadPct,
        openInterest: contract.openInterest,
        volume: contract.volume,
        delta: contract.delta,
      };

      // Hard-no check
      const hardNoReason = isHardNo(evidence, policy.executionAssessment);
      if (hardNoReason) {
        if (evidence.bid <= 0 || evidence.openInterest === 0) continue;
        // Wide spread: skip for calls (don't produce WIDE_SPREAD candidates yet)
        continue;
      }

      const assessment = assessExecution(evidence, policy.executionAssessment);

      // Yield: premium / underlying price (annualized)
      const yieldAnnualized = spreadPct <= policy.executionAssessment.preferredSpreadPercent * 2
        ? annualizedYield(mid, underlyingPrice, exp.dte)
        : null;

      const candidate: CallCandidate = {
        rank: 0,
        symbol,
        expiration: exp.date,
        dte: exp.dte,
        strike: contract.strike,
        delta: contract.delta,
        bid: contract.bid,
        ask: contract.ask,
        mid,
        spreadPercent: spreadPct,
        openInterest: contract.openInterest,
        volume: contract.volume,
        freeShares: pos.sharesFree,
        maxContracts: pos.maxAdditionalContracts,
        premiumPerContract: mid * 100,
        yieldAnnualized,
        assessment,
        posture: assessment.posture,
        strikeAbovePrice: contract.strike > underlyingPrice,
        underlyingPrice,
      };

      if (assessment.posture === "ACTIONABLE" || assessment.posture === "EDGE") {
        if (!bestCandidate || assessment.score > bestCandidate.assessment.score) {
          bestCandidate = candidate;
        }
      } else if (assessment.posture === "WAIT") {
        if (!bestWait || assessment.score > bestWait.assessment.score) {
          bestWait = candidate;
        }
      }
    }

    if (bestCandidate) {
      allCandidates.push(bestCandidate);
    } else if (bestWait) {
      allWait.push(bestWait);
    } else {
      excluded.push({ symbol, reason: "No qualifying call contract" });
    }
  }

  // Rank candidates
  const ranked = rankCallCandidates(allCandidates, policy.ranking.mode);
  const rankedWait = rankCallCandidates(allWait, policy.ranking.mode);

  return {
    candidates: ranked,
    waitCandidates: rankedWait,
    excluded,
    eligiblePositions: eligible.length,
    symbolsWithCandidates: ranked.length + rankedWait.length,
  };
}

// --- Ranking ---

function rankCallCandidates(
  candidates: CallCandidate[],
  mode: RecommendationPolicy["ranking"]["mode"]
): CallCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    switch (mode) {
      case "execution_first":
        if (a.assessment.score !== b.assessment.score) return b.assessment.score - a.assessment.score;
        return (b.yieldAnnualized ?? -1) - (a.yieldAnnualized ?? -1);

      case "yield_first":
        if ((a.yieldAnnualized ?? -1) !== (b.yieldAnnualized ?? -1))
          return (b.yieldAnnualized ?? -1) - (a.yieldAnnualized ?? -1);
        return b.assessment.score - a.assessment.score;

      case "balanced": {
        const scoreA = a.assessment.score + (a.yieldAnnualized ?? 0) * 0.5;
        const scoreB = b.assessment.score + (b.yieldAnnualized ?? 0) * 0.5;
        return scoreB - scoreA;
      }

      case "capital_efficiency":
        // For calls: higher yield per share price = more efficient
        const effA = (a.yieldAnnualized ?? 0) / (a.underlyingPrice || 1);
        const effB = (b.yieldAnnualized ?? 0) / (b.underlyingPrice || 1);
        if (effA !== effB) return effB - effA;
        return b.assessment.score - a.assessment.score;

      default:
        return b.assessment.score - a.assessment.score;
    }
  });

  return sorted.map((c, i) => ({ ...c, rank: i + 1 }));
}
