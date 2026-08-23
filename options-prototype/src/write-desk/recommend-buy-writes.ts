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
  // --- Strike Selection Diagnostics ---
  /** Premium share of total-if-called (premium / totalGainPerShare, 0-1) */
  premiumShare: number;
  /** Appreciation share of total-if-called (appreciation / totalGainPerShare, 0-1) */
  appreciationShare: number;
  /** Number of eligible strikes that passed execution + fitness filters */
  eligibleStrikeCount: number;
  /** Minimum delta among evaluated strikes */
  evaluatedDeltaMin: number;
  /** Maximum delta among evaluated strikes */
  evaluatedDeltaMax: number;
  /** Production v0 for this strike (monthly rate %) */
  selectionPv0: number;
  /** Full-cycle harvest: δ × total-if-called per share (diagnostic) */
  fullCycleHarvest: number;
  /** Maximum FCH across all evaluated strikes (diagnostic) */
  maxFCH: number;
  /** Percent sacrifice from maximum FCH (0 = selected IS the maximum) */
  fchSacrificePercent: number;
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
  /** Symbols with executable contracts but no positive-appreciation strike */
  strategyUnfit: number;
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
  options?: { sessionClosed?: boolean; admissibilityBoundaryMs?: number | null }
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
  let outcomeStrategyUnfit = 0;

  const effectiveCash = deployableCash - policy.deployment.reserveAmount;
  const useSessionValidity = options?.sessionClosed ?? false;
  const admissibilityBoundaryMs = options?.admissibilityBoundaryMs ?? null;

  function isEligible(record: unknown): boolean {
    if (!record) return false;
    if (useSessionValidity) return true;
    // Admissibility gate: reject evidence retrieved before the boundary
    if (admissibilityBoundaryMs != null) {
      const rec = record as { retrievedAt?: number };
      if (rec.retrievedAt != null && rec.retrievedAt < admissibilityBoundaryMs) {
        return false;
      }
    }
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

    // Evaluate call chains — one best candidate per eligible expiration
    let instrumentName: string | null = null;
    let symbolFoundChain = false;
    let symbolHadContractsInRange = false;
    let symbolAllHardNo = true;
    let symbolHardNoType: "zeroBid" | "zeroOI" | "wideSpread" | null = null;
    let symbolHadEligibleButNoFit = false;
    let symbolProducedCandidate = false;

    // Collect per-expiration candidates before governance (applied once per symbol)
    const symbolCandidates: BuyWriteCandidate[] = [];
    const symbolWaitCandidates: BuyWriteCandidate[] = [];
    const symbolWideSpreadCandidates: BuyWriteCandidate[] = [];

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

      // Filter calls: market quality only (no delta range restriction for BW).
      // Delta participates in Production v0 as an economic input, not as an eligibility gate.
      // Strategy fitness (positive appreciation) is applied downstream.
      const { excludeZeroBid, requireGreeks } = policy.contractSelection;
      const inRange = calls.filter((c) =>
        (!excludeZeroBid || c.bid > 0) &&
        (!requireGreeks || c.delta !== 0) &&
        c.delta <= 1.0 && // Data quality: reject corrupt greeks (delta cannot exceed 1.0 for calls)
        !(c.strike > underlyingPrice && c.delta > 0.95) // Evidence validity: OTM call with delta > 0.95 is corrupt provider data
      );

      if (inRange.length === 0) continue;
      symbolHadContractsInRange = true;

      // --- Premature-elimination fix ---
      // Evaluate hard-no eligibility for ALL admissible contracts BEFORE selecting
      // by delta. This prevents a single hard-no contract at target delta from
      // hiding viable contracts at adjacent deltas within the same expiration.
      const targetDelta = policy.contractSelection.targetDelta;

      // Partition: separate eligible contracts from hard-no contracts
      const eligible: typeof inRange = [];
      const hardNoContracts: Array<{ contract: typeof inRange[0]; reason: string; spreadPct: number; mid: number }> = [];

      for (const c of inRange) {
        const cMid = midPrice(c.bid, c.ask);
        const cSpread = c.ask - c.bid;
        const cSpreadPct = cMid > 0 ? (cSpread / cMid) * 100 : 100;
        const cEvidence: ContractEvidence = {
          bid: c.bid,
          ask: c.ask,
          spreadPercent: cSpreadPct,
          openInterest: c.openInterest,
          volume: c.volume,
          delta: c.delta,
        };
        const reason = isHardNo(cEvidence, policy.executionAssessment);
        if (reason) {
          hardNoContracts.push({ contract: c, reason, spreadPct: cSpreadPct, mid: cMid });
        } else {
          eligible.push(c);
        }
      }

      // If no eligible contracts survive, handle hard-no/wide-spread collection
      if (eligible.length === 0) {
        // Track hard-no type from the contract closest to target delta (preserves existing diagnostics)
        const closestHardNo = [...hardNoContracts].sort((a, b) =>
          Math.abs(a.contract.delta - targetDelta) - Math.abs(b.contract.delta - targetDelta)
        )[0];
        if (closestHardNo) {
          if (closestHardNo.contract.bid <= 0) {
            symbolHardNoType = "zeroBid";
          } else if (closestHardNo.contract.openInterest === 0) {
            symbolHardNoType = "zeroOI";
          } else {
            symbolHardNoType = "wideSpread";
          }
        }
        // Collect best wide-spread candidate for this expiration (spread-only hard-no, bid > 0 and OI > 0)
        const wsCandidatesForExp = hardNoContracts
          .filter(hn => hn.contract.bid > 0 && hn.contract.openInterest > 0)
          .sort((a, b) => a.spreadPct - b.spreadPct);
        if (wsCandidatesForExp.length > 0) {
          const hn = wsCandidatesForExp[0];
          const wsEconomics = computeBuyWriteEconomics(underlyingPrice, hn.contract.strike, hn.mid, exp.dte);
          const wsCandidate: BuyWriteCandidate = {
            rank: 0,
            symbol,
            expiration: exp.date,
            dte: exp.dte,
            strike: hn.contract.strike,
            delta: hn.contract.delta,
            bid: hn.contract.bid,
            ask: hn.contract.ask,
            mid: hn.mid,
            spreadPercent: hn.spreadPct,
            openInterest: hn.contract.openInterest,
            volume: hn.contract.volume,
            underlyingPrice,
            capitalRequired,
            cashRemaining,
            premiumYieldAnnualized: wsEconomics.premiumYieldAnnualized,
            totalReturnIfAssignedAnnualized: wsEconomics.totalReturnIfAssignedAnnualized,
            totalReturnIfCalledPercent: wsEconomics.totalReturnIfCalledPercent,
            strikeAbovePrice: wsEconomics.strikeAbovePrice,
            appreciationPerShare: wsEconomics.appreciationPerShare,
            economics: wsEconomics,
            assessment: { score: 0, posture: "WIDE_SPREAD", components: [], hardNoReason: hn.reason, policyVersion: policy.executionAssessment.version },
            posture: "WIDE_SPREAD" as any,
            affordable,
            governance: { status: "authorized", reason: "" },
            premiumShare: 0,
            appreciationShare: 0,
            eligibleStrikeCount: 0,
            evaluatedDeltaMin: 0,
            evaluatedDeltaMax: 0,
            selectionPv0: 0,
            fullCycleHarvest: 0,
            maxFCH: 0,
            fchSacrificePercent: 0,
          };
          symbolWideSpreadCandidates.push(wsCandidate);
        }
        continue;
      }

      // Eligible contracts exist — evaluate ALL strikes for strategy fitness + Pareto selection
      symbolAllHardNo = false;

      // --- Strategy Fitness: require positive appreciation (strike > underlyingPrice) ---
      const fitStrikes = eligible.filter((c) => c.strike > underlyingPrice);

      if (fitStrikes.length === 0) {
        // Executable contracts exist but none have positive appreciation.
        // This expiration offers no valid Buy-Write for this symbol.
        // (We still mark symbolAllHardNo = false because contracts existed.)
        symbolHadEligibleButNoFit = true;
        continue;
      }

      // --- Evaluate ALL fit strikes: compute economics + execution for each ---
      interface EvaluatedStrike {
        contract: typeof eligible[0];
        mid: number;
        spreadPct: number;
        economics: BuyWriteCompositeEconomics;
        assessment: import("./execution-assessment").ExecutionAssessment;
        pv0: number;
        premiumShare: number;
        appreciationShare: number;
        fullCycleHarvest: number;
      }

      const evaluated: EvaluatedStrike[] = [];
      for (const c of fitStrikes) {
        const cMid = midPrice(c.bid, c.ask);
        const cSpread = c.ask - c.bid;
        const cSpreadPct = cMid > 0 ? (cSpread / cMid) * 100 : 100;

        const cEvidence: ContractEvidence = {
          bid: c.bid,
          ask: c.ask,
          spreadPercent: cSpreadPct,
          openInterest: c.openInterest,
          volume: c.volume,
          delta: c.delta,
        };

        const cAssessment = assessExecution(cEvidence, policy.executionAssessment);
        const cEconomics = computeBuyWriteEconomics(underlyingPrice, c.strike, cMid, exp.dte);

        // Production v0 for this strike (same formula as production-v0.ts)
        const premiumDollars = cMid * 100;
        const appreciationDollars = (c.strike - underlyingPrice) * 100;
        const conditionalAppreciation = c.delta * appreciationDollars;
        const cycleProduction = premiumDollars + conditionalAppreciation;
        const cPv0 = capitalRequired > 0 && exp.dte > 0
          ? (cycleProduction / capitalRequired) * (30 / exp.dte) * 100
          : 0;

        // Composition: premium and appreciation shares of total-if-called
        const totalGain = cEconomics.totalGainPerShareIfAssigned;
        const premShare = totalGain > 0 ? cEconomics.callPremiumPerShare / totalGain : 0;
        const apShare = totalGain > 0 ? cEconomics.appreciationPerShare / totalGain : 0;

        // Full-cycle harvest: delta × total-if-called per share
        // Measures the assignment-weighted complete-cycle outcome.
        // Distinct from Pv0: Pv0 treats premium as certain (correct for expected value);
        // fullCycleHarvest weights the entire harvest by assignment likelihood (correct
        // for selecting the strike that best combines outcome size with completion probability).
        const fullCycleHarvest = c.delta * totalGain;

        evaluated.push({
          contract: c,
          mid: cMid,
          spreadPct: cSpreadPct,
          economics: cEconomics,
          assessment: cAssessment,
          pv0: cPv0,
          premiumShare: premShare,
          appreciationShare: apShare,
          fullCycleHarvest,
        });
      }

      // --- Strike Selection: highest Production v0 among executable, valid strikes ---
      // Within strategically valid Buy-Writes (positive appreciation, acceptable execution),
      // Production v0 (premium + δ × appreciation) is the strike-selection objective.
      // Higher Pv0 naturally favors: stronger premium, higher delta (assignment probability),
      // and meaningful appreciation. FCH retained as diagnostic only.
      const eligibleStrikeCount = evaluated.length;
      const maxFCH = evaluated.length > 0 ? Math.max(...evaluated.map(e => e.fullCycleHarvest)) : 0;
      const evaluatedDeltaMin = evaluated.length > 0 ? Math.min(...evaluated.map(e => e.contract.delta)) : 0;
      const evaluatedDeltaMax = evaluated.length > 0 ? Math.max(...evaluated.map(e => e.contract.delta)) : 0;

      let expWinner: EvaluatedStrike | null = null;

      // Prefer ACTIONABLE (highest Pv0); fallback to EDGE; then WAIT.
      const actionable = evaluated.filter(e => e.assessment.posture === "ACTIONABLE");
      if (actionable.length > 0) {
        expWinner = actionable.reduce((best, e) => e.pv0 > best.pv0 ? e : best);
      } else {
        const edge = evaluated.filter(e => e.assessment.posture === "EDGE");
        if (edge.length > 0) {
          expWinner = edge.reduce((best, e) => e.pv0 > best.pv0 ? e : best);
        } else {
          const wait = evaluated.filter(e => e.assessment.posture === "WAIT");
          if (wait.length > 0) {
            expWinner = wait.reduce((best, e) => e.pv0 > best.pv0 ? e : best);
          }
        }
      }

      if (!expWinner) continue;

      // Build candidate from winner
      const contract = expWinner.contract;
      const mid = expWinner.mid;
      const spreadPct = expWinner.spreadPct;
      const assessment = expWinner.assessment;
      const economics = expWinner.economics;

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
        premiumShare: expWinner.premiumShare,
        appreciationShare: expWinner.appreciationShare,
        eligibleStrikeCount,
        evaluatedDeltaMin,
        evaluatedDeltaMax,
        selectionPv0: expWinner.pv0,
        fullCycleHarvest: expWinner.fullCycleHarvest,
        maxFCH,
        fchSacrificePercent: maxFCH > 0 ? ((maxFCH - expWinner.fullCycleHarvest) / maxFCH) * 100 : 0,
      };

      // Emit the best candidate for this expiration directly (no cross-expiration collapse)
      if (assessment.posture === "ACTIONABLE" || assessment.posture === "EDGE") {
        symbolCandidates.push(candidate);
      } else if (assessment.posture === "WAIT") {
        symbolWaitCandidates.push(candidate);
      }
      symbolProducedCandidate = true;
    }

    // Resolve governance (same pattern as puts) — applied once per symbol
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

    // Emit all per-expiration candidates with governance applied
    if (symbolCandidates.length > 0 || symbolWaitCandidates.length > 0) {
      for (const c of symbolCandidates) {
        c.governance = governance;
        allCandidates.push(c);
      }
      for (const c of symbolWaitCandidates) {
        c.governance = governance;
        allWait.push(c);
      }
      // Outcome counters: per-symbol (for distribution bar funnel)
      // A symbol counts once in the highest-posture tier it achieved
      const hasActionable = symbolCandidates.some(c => c.posture === "ACTIONABLE");
      const hasEdge = symbolCandidates.some(c => c.posture === "EDGE");
      if (hasActionable) outcomeActionable++;
      else if (hasEdge) outcomeEdge++;
      else outcomeWait++;
    } else if (symbolWideSpreadCandidates.length > 0) {
      // No normal candidate at any expiration but wide-spread candidates exist
      for (const c of symbolWideSpreadCandidates) {
        c.governance = governance;
        allWideSpread.push(c);
      }
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
      } else if (symbolHadEligibleButNoFit) {
        // Executable contracts existed but all had strike <= underlyingPrice
        outcomeStrategyUnfit++;
      } else {
        outcomeNoDeltaMatch++; // fallback
      }
      excluded.push({ symbol, reason: symbolHadEligibleButNoFit
        ? "No positive-appreciation call available (strategy unfit)"
        : "No qualifying call contract for buy-write" });
    }
  }

  // Rank
  const ranked = rankBuyWriteCandidates(allCandidates, policy.ranking.mode);
  const rankedWait = rankBuyWriteCandidates(allWait, policy.ranking.mode);

  // Count unique symbols that contributed at least one candidate
  const symbolsWithCands = new Set([
    ...ranked.map(c => c.symbol),
    ...rankedWait.map(c => c.symbol),
  ]).size;

  return {
    candidates: ranked,
    waitCandidates: rankedWait,
    wideSpreadCandidates: allWideSpread,
    excluded,
    universeSize: symbols.length,
    symbolsWithCandidates: symbolsWithCands,
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
      strategyUnfit: outcomeStrategyUnfit,
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
