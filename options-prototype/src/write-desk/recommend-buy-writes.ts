/**
 * Buy-Write Recommendation Engine — Pure cache-based evaluation.
 *
 * INVARIANT: This module NEVER makes provider calls.
 * It operates entirely on the IndexedDB durable cache.
 *
 * Strategy: Buy 100 shares + Sell 1 covered call simultaneously.
 * Universe: Same eligible universe as puts (cash-constrained, not inventory-constrained).
 * Capital requirement: underlyingPrice × 100 (share purchase cost).
 *
 * Responsibilities:
 * - Scan the universe for call opportunities against shares not yet owned
 * - Select call contracts from cached chains (same data as puts engine reads)
 * - Compute composite economics (premium + appreciation/erosion)
 * - Execution assessment (shared, strategy-agnostic)
 * - Governance filtering (shared)
 * - Posture assignment
 * - Ranking
 * - Affordability check against deployable cash
 */

import type { Expiration } from "../domain/types";
import { selectEligibleExpirations } from "../velvet-rope/evaluate";
import { inferProductStructure, hasStructuralComplexity } from "../velvet-rope/product-structure";
import { lookupCatalog, governanceFromCatalog } from "../instrument-catalog/catalog";
import { midPrice, annualizedYield } from "../domain/calculations";
import { assessExecution, isHardNo, type ContractEvidence, type ActionPosture } from "./execution-assessment";
import { type DurableMarketCache, buildCacheKey } from "../cache/durable-cache";
import type { ExecutionPolicy } from "./execution-policy";
import type { RecommendationPolicy } from "./recommend";
import type { GovernanceAnnotation } from "./scan-orchestrator";

// --- Buy-Write Candidate ---

export interface BuyWriteCompositeEconomics {
  /** Share acquisition price */
  underlyingPrice: number;
  /** Total capital to buy 100 shares */
  capitalRequired: number;
  /** Call strike price */
  callStrike: number;
  /** Call premium midpoint per share */
  callPremiumPerShare: number;
  /** Call premium per contract (mid × 100) */
  callPremiumPerContract: number;
  /** Net debit per share (underlyingPrice − callPremium) */
  netDebitPerShare: number;
  /** Net debit total (netDebitPerShare × 100) */
  netDebitTotal: number;
  /** Premium yield: annualized (callMid / underlyingPrice × 365/DTE × 100) */
  premiumYieldAnnualized: number;
  /** Appreciation per share if assigned (strike − underlyingPrice) */
  appreciationPerShare: number;
  /** Appreciation as percent of acquisition price */
  appreciationPercent: number;
  /** Total gain per share if assigned (premium + appreciation) */
  totalGainPerShareIfAssigned: number;
  /** Total gain if assigned (per contract, × 100) */
  totalGainIfAssigned: number;
  /** Total return if assigned, annualized percent */
  totalReturnIfAssignedAnnualized: number;
  /** Total return if assigned, raw cycle percent (not annualized) */
  totalReturnIfCalledPercent: number;
  /** Effective basis after premium (underlyingPrice − callPremium) */
  effectiveBasis: number;
  /** Breakeven price (same as effectiveBasis for buy-write) */
  breakeven: number;
  /** Whether call strike is above acquisition price */
  strikeAbovePrice: boolean;
  /** Maximum loss exposure per share (underlyingPrice − callPremium, if shares go to zero) */
  maxLossPerShare: number;
}

export interface BuyWriteCandidate {
  rank: number;
  symbol: string;
  expiration: string;
  dte: number;
  /** Call strike */
  strike: number;
  /** Call delta */
  delta: number;
  /** Call bid */
  bid: number;
  /** Call ask */
  ask: number;
  /** Call mid */
  mid: number;
  /** Call spread percent */
  spreadPercent: number;
  /** Call open interest */
  openInterest: number;
  /** Call volume */
  volume: number;
  /** Underlying share price */
  underlyingPrice: number;
  /** Capital required (underlyingPrice × 100) */
  capitalRequired: number;
  /** Cash remaining after deployment */
  cashRemaining: number;
  /** Annualized premium yield (premium / underlyingPrice) */
  premiumYieldAnnualized: number;
  /** Total return if assigned, annualized */
  totalReturnIfAssignedAnnualized: number;
  /** Total return if called, raw cycle percent (not annualized) */
  totalReturnIfCalledPercent: number;
  /** Whether strike is above underlying price */
  strikeAbovePrice: boolean;
  /** Appreciation per share (strike − price), negative means planned capital loss */
  appreciationPerShare: number;
  /** Composite economics — full breakdown */
  economics: BuyWriteCompositeEconomics;
  /** Execution quality assessment */
  assessment: import("./execution-assessment").ExecutionAssessment;
  /** Derived posture from assessment */
  posture: ActionPosture;
  /** Whether operator can afford this deployment */
  affordable: boolean;
  /** Governance annotation */
  governance: GovernanceAnnotation;
}

// --- Result ---

export interface BuyWriteOutcomes {
  actionable: number;
  edge: number;
  wait: number;
  hardNoZeroBid: number;
  hardNoZeroOI: number;
  hardNoWideSpread: number;
  noDeltaMatch: number;
  noDteMatch: number;
  nonOptionable: number;
  incomplete: number;
}

export interface BuyWriteRecommendationResult {
  candidates: BuyWriteCandidate[];
  waitCandidates: BuyWriteCandidate[];
  /** Candidates where spread was the only hard-no — inspectable but not recommended */
  wideSpreadCandidates: BuyWriteCandidate[];
  /** Symbols evaluated but excluded */
  excluded: { symbol: string; reason: string }[];
  /** Total symbols in universe */
  universeSize: number;
  /** Symbols with qualifying candidates */
  symbolsWithCandidates: number;
  /** Terminal outcome breakdown */
  outcomes: BuyWriteOutcomes;
  /** Timestamp */
  computedAt: string;
}

// --- Engine ---

/**
 * Recommend buy-write deployments from cached evidence.
 *
 * Scans the same universe as puts, reads the CALL side of cached chains,
 * applies shared policy (delta, DTE, execution quality), computes composite
 * economics, and produces ranked BuyWriteCandidate[].
 *
 * NEVER makes provider calls. Reads from DurableMarketCache only.
 */
export async function recommendBuyWrites(
  symbols: string[],
  deployableCash: number,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string },
  policy: RecommendationPolicy,
  options?: { sessionClosed?: boolean }
): Promise<BuyWriteRecommendationResult> {
  const allCandidates: BuyWriteCandidate[] = [];
  const allWait: BuyWriteCandidate[] = [];
  const allWideSpread: BuyWriteCandidate[] = [];
  const excluded: { symbol: string; reason: string }[] = [];

  // Outcome tracking
  let outcomeActionable = 0;
  let outcomeEdge = 0;
  let outcomeWait = 0;
  let outcomeHardNoZeroBid = 0;
  let outcomeHardNoZeroOI = 0;
  let outcomeHardNoWideSpread = 0;
  let outcomeNoDeltaMatch = 0;
  let outcomeNoDteMatch = 0;
  let outcomeNonOptionable = 0;
  let outcomeIncomplete = 0;

  const effectiveCash = deployableCash - policy.deployment.reserveAmount;
  const useSessionValidity = options?.sessionClosed ?? false;

  function isEligible(record: unknown): boolean {
    if (!record) return false;
    if (useSessionValidity) return true;
    const freshness = cache.freshness(record as Parameters<typeof cache.freshness>[0]);
    return freshness === "fresh" || freshness === "stale_usable";
  }

  for (const symbol of symbols) {
    // Check confirmed absence
    const absKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "absence", symbol);
    const absRecord = await cache.get(absKey);
    if (absRecord && (cache.freshness(absRecord) === "fresh" || cache.freshness(absRecord) === "stale_usable")) {
      outcomeNonOptionable++;
      continue; // non-optionable
    }

    // Get expirations from cache
    const expKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "expirations", symbol);
    const expRecord = await cache.get<Expiration[]>(expKey);
    if (!expRecord || !isEligible(expRecord)) {
      outcomeIncomplete++;
      continue; // no evidence yet
    }

    const expirations = expRecord.payload;
    const eligibleExps = selectEligibleExpirations(expirations, policy.contractSelection.eligibleDteRange);
    if (eligibleExps.length === 0) {
      outcomeNoDteMatch++;
      excluded.push({ symbol, reason: "No eligible expiration in DTE range" });
      continue;
    }

    // Evaluate call chains
    let bestCandidate: BuyWriteCandidate | null = null;
    let bestWait: BuyWriteCandidate | null = null;
    let instrumentName: string | null = null;
    let symbolFoundChain = false;
    let symbolHadContractsInRange = false;
    let symbolAllHardNo = true;
    let symbolHardNoType: "zeroBid" | "zeroOI" | "wideSpread" | null = null;
    let bestWideSpread: BuyWriteCandidate | null = null;

    for (const exp of eligibleExps) {
      interface CachedChain {
        calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>;
        underlying?: { name?: string; symbol?: string; price?: number };
      }
      const chainKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "chain", symbol, exp.date);
      const chainRecord = await cache.get<CachedChain>(chainKey);
      if (!chainRecord || !isEligible(chainRecord)) continue;

      symbolFoundChain = true;
      const calls = chainRecord.payload.calls ?? [];
      const underlyingPrice = chainRecord.payload.underlying?.price ?? 0;
      if (underlyingPrice <= 0) continue;

      if (!instrumentName && chainRecord.payload.underlying?.name) {
        instrumentName = chainRecord.payload.underlying.name;
      }

      // Capital required for 100 shares
      const capitalRequired = underlyingPrice * 100;

      // Affordability check
      const affordable = capitalRequired <= effectiveCash;
      const cashRemaining = effectiveCash - capitalRequired;

      // Filter calls by admissible delta range (calls use positive delta)
      const { admissibleDeltaRange, excludeZeroBid, requireGreeks } = policy.contractSelection;
      const inRange = calls.filter((c) =>
        (!excludeZeroBid || c.bid > 0) &&
        (!requireGreeks || c.delta !== 0) &&
        c.delta >= admissibleDeltaRange.min &&
        c.delta <= admissibleDeltaRange.max
      );

      if (inRange.length === 0) continue;
      symbolHadContractsInRange = true;

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
        if (evidence.bid <= 0) {
          symbolHardNoType = "zeroBid";
        } else if (evidence.openInterest === 0) {
          symbolHardNoType = "zeroOI";
        } else {
          // Wide spread is the only hard-no — collect as inspectable wide-spread candidate
          symbolHardNoType = "wideSpread";
          const wsEconomics = computeBuyWriteEconomics(underlyingPrice, contract.strike, mid, exp.dte);
          const wsCandidate: BuyWriteCandidate = {
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
            underlyingPrice,
            capitalRequired,
            cashRemaining,
            premiumYieldAnnualized: wsEconomics.premiumYieldAnnualized,
            totalReturnIfAssignedAnnualized: wsEconomics.totalReturnIfAssignedAnnualized,
            totalReturnIfCalledPercent: wsEconomics.totalReturnIfCalledPercent,
            strikeAbovePrice: wsEconomics.strikeAbovePrice,
            appreciationPerShare: wsEconomics.appreciationPerShare,
            economics: wsEconomics,
            assessment: { score: 0, posture: "WIDE_SPREAD", components: [], hardNoReason, policyVersion: policy.executionAssessment.version },
            posture: "WIDE_SPREAD" as any,
            affordable,
            governance: { status: "authorized", reason: "" },
          };
          if (!bestWideSpread || spreadPct < bestWideSpread.spreadPercent) {
            bestWideSpread = wsCandidate;
          }
        }
        continue;
      }
      symbolAllHardNo = false;

      const assessment = assessExecution(evidence, policy.executionAssessment);

      // Composite economics
      const economics = computeBuyWriteEconomics(underlyingPrice, contract.strike, mid, exp.dte);

      const candidate: BuyWriteCandidate = {
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
        underlyingPrice,
        capitalRequired,
        cashRemaining,
        premiumYieldAnnualized: economics.premiumYieldAnnualized,
        totalReturnIfAssignedAnnualized: economics.totalReturnIfAssignedAnnualized,
        totalReturnIfCalledPercent: economics.totalReturnIfCalledPercent,
        strikeAbovePrice: economics.strikeAbovePrice,
        appreciationPerShare: economics.appreciationPerShare,
        economics,
        assessment,
        posture: assessment.posture,
        affordable,
        governance: { status: "authorized", reason: "" }, // resolved below
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

    // Resolve governance (same pattern as puts)
    const catalogRecord = lookupCatalog(symbol);
    let governance: GovernanceAnnotation;

    if (catalogRecord) {
      governance = governanceFromCatalog(catalogRecord);
    } else {
      const structure = inferProductStructure(symbol, instrumentName);
      if (hasStructuralComplexity(structure)) {
        governance = {
          status: "danger",
          reason: `Structural complexity: ${[structure.leveraged && `leveraged ${structure.leverageMultiple ?? ""}x`, structure.inverse && "inverse", structure.dailyReset && "daily-reset", structure.singleStock && "single-stock"].filter(Boolean).join(", ")}`,
          classification: { leveraged: structure.leveraged, inverse: structure.inverse, dailyReset: structure.dailyReset, confidence: structure.confidence, source: structure.inferenceSource },
        };
      } else if (structure.confidence === "low" && structure.inferenceSource === "unknown") {
        governance = {
          status: "unknown",
          reason: "Instrument classification could not be determined from available evidence",
          classification: { leveraged: false, inverse: false, dailyReset: false, confidence: structure.confidence, source: structure.inferenceSource },
        };
      } else {
        governance = { status: "authorized", reason: "Conventional structure confirmed" };
      }
    }

    const best = bestCandidate ?? bestWait;
    if (best) {
      best.governance = governance;
      if (best.posture === "ACTIONABLE" || best.posture === "EDGE") {
        allCandidates.push(best);
        if (best.posture === "ACTIONABLE") outcomeActionable++;
        else outcomeEdge++;
      } else {
        allWait.push(best);
        outcomeWait++;
      }
    } else if (bestWideSpread) {
      // No normal candidate but a wide-spread candidate exists — preserve for inspection
      bestWideSpread.governance = governance;
      allWideSpread.push(bestWideSpread);
      outcomeHardNoWideSpread++;
    } else {
      // Determine why no candidate was produced
      if (!symbolFoundChain) {
        outcomeIncomplete++;
      } else if (!symbolHadContractsInRange) {
        outcomeNoDeltaMatch++;
      } else if (symbolAllHardNo) {
        switch (symbolHardNoType) {
          case "zeroBid": outcomeHardNoZeroBid++; break;
          case "zeroOI": outcomeHardNoZeroOI++; break;
          case "wideSpread": outcomeHardNoWideSpread++; break;
          default: outcomeHardNoWideSpread++; break;
        }
      } else {
        outcomeNoDeltaMatch++; // fallback
      }
      excluded.push({ symbol, reason: "No qualifying call contract for buy-write" });
    }
  }

  // Rank
  const ranked = rankBuyWriteCandidates(allCandidates, policy.ranking.mode);
  const rankedWait = rankBuyWriteCandidates(allWait, policy.ranking.mode);

  return {
    candidates: ranked,
    waitCandidates: rankedWait,
    wideSpreadCandidates: allWideSpread,
    excluded,
    universeSize: symbols.length,
    symbolsWithCandidates: ranked.length + rankedWait.length,
    outcomes: {
      actionable: outcomeActionable,
      edge: outcomeEdge,
      wait: outcomeWait,
      hardNoZeroBid: outcomeHardNoZeroBid,
      hardNoZeroOI: outcomeHardNoZeroOI,
      hardNoWideSpread: outcomeHardNoWideSpread,
      noDeltaMatch: outcomeNoDeltaMatch,
      noDteMatch: outcomeNoDteMatch,
      nonOptionable: outcomeNonOptionable,
      incomplete: outcomeIncomplete,
    },
    computedAt: new Date().toISOString(),
  };
}

// --- Composite Economics ---

/**
 * Compute buy-write composite economics.
 *
 * All values are per-share unless otherwise noted.
 * The buy-write deploys capital = underlyingPrice × 100.
 * The call premium partially offsets the share purchase.
 */
export function computeBuyWriteEconomics(
  underlyingPrice: number,
  callStrike: number,
  callMid: number,
  dte: number
): BuyWriteCompositeEconomics {
  const capitalRequired = underlyingPrice * 100;
  const callPremiumPerShare = callMid;
  const callPremiumPerContract = callMid * 100;

  // Net debit = share cost minus premium received
  const netDebitPerShare = underlyingPrice - callPremiumPerShare;
  const netDebitTotal = netDebitPerShare * 100;

  // Premium yield: annualized return from premium alone
  const premiumYieldAnnualized = annualizedYield(callMid, underlyingPrice, dte);

  // Appreciation: gain/loss from stock movement to strike
  const appreciationPerShare = callStrike - underlyingPrice;
  const appreciationPercent = underlyingPrice > 0
    ? (appreciationPerShare / underlyingPrice) * 100
    : 0;

  // Total gain if assigned = premium + appreciation
  const totalGainPerShareIfAssigned = callPremiumPerShare + appreciationPerShare;
  const totalGainIfAssigned = totalGainPerShareIfAssigned * 100;

  // Total return if assigned (annualized)
  const totalReturnIfAssignedAnnualized = dte > 0 && underlyingPrice > 0
    ? (totalGainPerShareIfAssigned / underlyingPrice) * (365 / dte) * 100
    : 0;

  // Total return if called, raw cycle percent (not annualized)
  const totalReturnIfCalledPercent = underlyingPrice > 0
    ? (totalGainPerShareIfAssigned / underlyingPrice) * 100
    : 0;

  // Effective basis / breakeven
  const effectiveBasis = underlyingPrice - callPremiumPerShare;
  const breakeven = effectiveBasis;

  // Strike above price?
  const strikeAbovePrice = callStrike > underlyingPrice;

  // Max loss per share (if shares go to zero, minus premium received)
  const maxLossPerShare = underlyingPrice - callPremiumPerShare;

  return {
    underlyingPrice,
    capitalRequired,
    callStrike,
    callPremiumPerShare,
    callPremiumPerContract,
    netDebitPerShare,
    netDebitTotal,
    premiumYieldAnnualized,
    appreciationPerShare,
    appreciationPercent,
    totalGainPerShareIfAssigned,
    totalGainIfAssigned,
    totalReturnIfAssignedAnnualized,
    totalReturnIfCalledPercent,
    effectiveBasis,
    breakeven,
    strikeAbovePrice,
    maxLossPerShare,
  };
}

// --- Ranking ---

const POSTURE_ORDER: Record<ActionPosture, number> = {
  ACTIONABLE: 0,
  EDGE: 1,
  WAIT: 2,
  UNAVAILABLE: 3,
  DATA_INCOMPLETE: 4,
  WIDE_SPREAD: 5,
};

function rankBuyWriteCandidates(
  candidates: BuyWriteCandidate[],
  mode: RecommendationPolicy["ranking"]["mode"]
): BuyWriteCandidate[] {
  const ranked = [...candidates].sort((a, b) => {
    // 1. Posture tier
    const pa = POSTURE_ORDER[a.posture] ?? 5;
    const pb = POSTURE_ORDER[b.posture] ?? 5;
    if (pa !== pb) return pa - pb;

    // 2. Mode-dependent secondary sort
    switch (mode) {
      case "execution_first":
        if (a.assessment.score !== b.assessment.score) return b.assessment.score - a.assessment.score;
        return b.premiumYieldAnnualized - a.premiumYieldAnnualized;

      case "yield_first":
        // For buy-write: optimize immediate premium production (directly comparable to put board)
        if (a.premiumYieldAnnualized !== b.premiumYieldAnnualized) {
          return b.premiumYieldAnnualized - a.premiumYieldAnnualized;
        }
        return b.assessment.score - a.assessment.score;

      case "capital_efficiency": {
        // For buy-write: "If Called" — optimize raw cycle total economic return
        if (a.totalReturnIfCalledPercent !== b.totalReturnIfCalledPercent) {
          return b.totalReturnIfCalledPercent - a.totalReturnIfCalledPercent;
        }
        return b.assessment.score - a.assessment.score;
      }

      case "balanced":
      default: {
        // Blend execution score with premium yield
        const scoreA = a.assessment.score + a.premiumYieldAnnualized;
        const scoreB = b.assessment.score + b.premiumYieldAnnualized;
        return scoreB - scoreA;
      }
    }
  });

  return ranked.map((c, i) => ({ ...c, rank: i + 1 }));
}
