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
import { assessExecution, isHardNo, type ContractEvidence } from "./execution-assessment";
import { type DurableMarketCache, buildCacheKey } from "../cache/durable-cache";
import type { CallCandidate } from "./candidate-types";
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
  options?: { sessionClosed?: boolean; admissibilityBoundaryMs?: number | null }
): Promise<CallRecommendationResult> {
  const allCandidates: CallCandidate[] = [];
  const allWait: CallCandidate[] = [];
  const excluded: { symbol: string; reason: string }[] = [];

  // Only positions with free shares that can cover at least 1 contract
  const eligible = inventory.filter((p) => p.maxAdditionalContracts > 0);
  const useSessionValidity = options?.sessionClosed ?? false;
  const admissibilityBoundaryMs = options?.admissibilityBoundaryMs ?? null;

  function isEligible(record: unknown): boolean {
    if (!record) return false;
    if (useSessionValidity) return true;
    if (admissibilityBoundaryMs != null) {
      const rec = record as { retrievedAt?: number };
      if (rec.retrievedAt != null && rec.retrievedAt < admissibilityBoundaryMs) {
        return false;
      }
    }
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

    // Evaluate call chains.
    // Emit one candidate PER eligible expiration (one strike per expiration:
    // the contract closest to target delta). This surfaces the full DTE ladder
    // for an owned symbol rather than collapsing to a single best row.
    const symbolCandidates: CallCandidate[] = [];
    const symbolWait: CallCandidate[] = [];

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

      const basisPerShare = pos.economics?.averageCostPerShare ?? null;

      type RawCall = { strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number };

      // Build an assessed candidate for a chosen contract, or null if it fails
      // hard-no (zero bid / zero OI / wide spread — skipped for calls today).
      const buildCandidate = (
        contract: RawCall,
        selectionBasis: CallCandidate["selectionBasis"],
      ): CallCandidate | null => {
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

        const hardNoReason = isHardNo(evidence, policy.executionAssessment);
        if (hardNoReason) {
          // zero bid / zero OI / wide spread — not surfaced as a call row today.
          return null;
        }

        const assessment = assessExecution(evidence, policy.executionAssessment);
        const yieldAnnualized = annualizedYield(mid, underlyingPrice, exp.dte);

        return {
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
          encumberedShares: pos.sharesEncumbered,
          premiumPerContract: mid * 100,
          yieldAnnualized,
          assessment,
          posture: assessment.posture,
          strikeAbovePrice: contract.strike > underlyingPrice,
          underlyingPrice,
          economics: pos.economics ?? null,
          basisPerShare,
          selectionBasis,
          // PL-EVID-AGE: copy chain-acquisition provenance from the cache record.
          evidenceProvenance: chainRecord.evidenceProvenance,
        };
      };

      const fileCandidate = (candidate: CallCandidate | null) => {
        if (!candidate) return;
        if (candidate.posture === "ACTIONABLE" || candidate.posture === "EDGE") {
          symbolCandidates.push(candidate);
        } else if (candidate.posture === "WAIT") {
          symbolWait.push(candidate);
        }
      };

      // 1) Ordinary pick: contract closest to target delta.
      const targetDelta = policy.contractSelection.targetDelta;
      const byTargetDelta = [...inRange].sort((a, b) =>
        Math.abs(a.delta - targetDelta) - Math.abs(b.delta - targetDelta)
      );
      const targetContract = byTargetDelta[0];
      fileCandidate(buildCandidate(targetContract, "target-delta"));

      // 2) Capital-state optionality (exploratory): lowest admissible strike at or
      //    above cost basis, so a call-away would not sell shares below basis
      //    (before premium). Only when basis is known and it is a DIFFERENT strike
      //    than the target-delta pick (otherwise it is the same row).
      if (basisPerShare != null) {
        const basisPositive = [...inRange]
          .filter((c) => c.strike >= basisPerShare)
          .sort((a, b) => a.strike - b.strike)[0];
        if (basisPositive && basisPositive.strike !== targetContract.strike) {
          fileCandidate(buildCandidate(basisPositive, "basis-positive"));
        }
      }
    }

    // Surface every actionable/edge expiration for this symbol as its own row.
    // Only fall back to WAIT rows when the symbol produced no actionable row at all,
    // preserving the prior "actionable wins over wait" behavior per symbol.
    if (symbolCandidates.length > 0) {
      allCandidates.push(...symbolCandidates);
    } else if (symbolWait.length > 0) {
      allWait.push(...symbolWait);
    } else {
      excluded.push({ symbol, reason: "No qualifying call contract" });
    }
  }

  // Rank candidates
  const ranked = rankCallCandidates(allCandidates, policy.ranking.mode);
  const rankedWait = rankCallCandidates(allWait, policy.ranking.mode);

  // Distinct symbols represented across actionable + wait rows.
  // (Rows are now one-per-expiration, so count unique symbols, not rows.)
  const distinctSymbols = new Set<string>();
  for (const c of ranked) distinctSymbols.add(c.symbol);
  for (const c of rankedWait) distinctSymbols.add(c.symbol);

  return {
    candidates: ranked,
    waitCandidates: rankedWait,
    excluded,
    eligiblePositions: eligible.length,
    symbolsWithCandidates: distinctSymbols.size,
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
        return b.yieldAnnualized - a.yieldAnnualized;

      case "yield_first":
        if (a.yieldAnnualized !== b.yieldAnnualized)
          return b.yieldAnnualized - a.yieldAnnualized;
        return b.assessment.score - a.assessment.score;

      case "balanced": {
        const scoreA = a.assessment.score + a.yieldAnnualized * 0.5;
        const scoreB = b.assessment.score + b.yieldAnnualized * 0.5;
        return scoreB - scoreA;
      }

      case "capital_efficiency":
        // For calls: higher yield per share price = more efficient
        const effA = a.yieldAnnualized / (a.underlyingPrice || 1);
        const effB = b.yieldAnnualized / (b.underlyingPrice || 1);
        if (effA !== effB) return effB - effA;
        return b.assessment.score - a.assessment.score;

      default:
        return b.assessment.score - a.assessment.score;
    }
  });

  return sorted.map((c, i) => ({ ...c, rank: i + 1 }));
}
