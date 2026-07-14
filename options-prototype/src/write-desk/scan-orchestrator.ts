/**
 * Write Desk — Scan Orchestrator
 *
 * Executes the operational pipeline:
 *   Portfolio → Candidates → Market Data → Contract Selection →
 *   Execution Assessment → Constraints → Posture → Ranking → Output
 *
 * Reuses existing infrastructure:
 *   - Candidate Universe for put symbols
 *   - TradierProvider for market data
 *   - selectEligibleExpirations and selectAdmissionContract from Velvet Rope
 *   - midPrice and annualizedYield from domain calculations
 */

import type { MarketDataProvider } from "../domain/provider";
import type { OptionContract } from "../domain/types";
import { findClosestToDelta } from "../domain/delta";
import { midPrice, annualizedYield } from "../domain/calculations";
import { selectEligibleExpirations } from "../velvet-rope/evaluate";
import { inferProductStructure, hasStructuralComplexity } from "../velvet-rope/product-structure";
import { assessExecution, isHardNo, type ExecutionAssessment, type ActionPosture, type ContractEvidence } from "./execution-assessment";
import { DEFAULT_EXECUTION_POLICY, type ExecutionPolicy } from "./execution-policy";
import type { InventoryPosition } from "./types";

// --- Scan Configuration ---

export interface ScanConfig {
  /** Target delta for contract selection */
  targetDelta: number;
  /** DTE range for expiration selection */
  dteRange: { min: number; max: number };
  /** Delta range filter */
  deltaRange: { min: number; max: number };
  /** Execution policy */
  executionPolicy: ExecutionPolicy;
  /** Maximum candidates to evaluate (rate-limit protection) */
  maxCandidates: number;
}

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  targetDelta: 0.30,
  dteRange: { min: 7, max: 45 },
  deltaRange: { min: 0.15, max: 0.50 },
  executionPolicy: DEFAULT_EXECUTION_POLICY,
  maxCandidates: 20,
};

// --- Put Candidate ---

export interface PutCandidate {
  rank: number;
  symbol: string;
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
  cashRequired: number;
  cashRemaining: number;
  yieldAnnualized: number | null;  // null if suppressed (unreliable spread)
  assessment: ExecutionAssessment;
  posture: ActionPosture;
}

// --- Call Candidate ---

export interface CallCandidate {
  rank: number;
  symbol: string;
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
  freeShares: number;
  maxContracts: number;
  premiumPerContract: number;
  yieldAnnualized: number | null;
  assessment: ExecutionAssessment;
  posture: ActionPosture;
  /** Whether strike is above current price */
  strikeAbovePrice: boolean;
  underlyingPrice: number;
}

// --- Call Inventory Result ---

export interface CallInventoryItem {
  symbol: string;
  sharesOwned: number;
  sharesEncumbered: number;
  sharesFree: number;
  maxContracts: number;
  reason: string | null;
  candidates: CallCandidate[];
}

// --- Scan Result ---

export interface ScanResult {
  id: string;
  scannedAt: string;
  portfolioSnapshotId: string;
  config: ScanConfig;
  puts: {
    candidates: PutCandidate[];
    excluded: { symbol: string; reason: string }[];
    totalScanned: number;
  };
  calls: {
    inventory: CallInventoryItem[];
    candidates: CallCandidate[];
    excluded: { symbol: string; reason: string }[];
  };
  marketProvenance: {
    provider: string;
    retrievedAt: string;
    delayedData: boolean;
  };
}

// --- Per-Symbol Search Evidence ---

export interface ExpirationSearchEvidence {
  date: string;
  dte: number;
  contractsTotal: number;
  contractsInDeltaRange: number;
  contractsZeroBid: number;
  contractsMissingGreeks: number;
  contractsHardExcluded: number;
  contractsUnaffordable: number;
  contractsEvaluated: number;
  bestScore: number | null;
}

export interface SymbolPutSearchResult {
  symbol: string;
  expirationsEvaluated: number;
  contractsConsidered: number;
  contractsValid: number;
  bestActionable: PutCandidate | null;
  bestEdge: PutCandidate | null;
  bestWait: PutCandidate | null;
  selectedCandidate: PutCandidate | null;
  selectedPosture: ActionPosture | null;
  exclusionReason: string | null;
  evidence: ExpirationSearchEvidence[];
}

// --- Put Scan Result ---

export interface PutScanResult {
  candidates: PutCandidate[];
  waitCandidates: PutCandidate[];
  searchResults: SymbolPutSearchResult[];
  excluded: { symbol: string; reason: string }[];
  universeSize: number;
  symbolsEvaluated: number;
  symbolsDeferred: number;
}

// --- Put Scan ---

export async function scanPuts(
  symbols: string[],
  deployableCash: number,
  provider: MarketDataProvider,
  config: ScanConfig = DEFAULT_SCAN_CONFIG,
  onProgress?: (scanned: number, total: number) => void
): Promise<PutScanResult> {
  const searchResults: SymbolPutSearchResult[] = [];
  const excluded: { symbol: string; reason: string }[] = [];

  const symbolsToScan = symbols.slice(0, config.maxCandidates);
  const symbolsDeferred = Math.max(0, symbols.length - config.maxCandidates);

  for (let i = 0; i < symbolsToScan.length; i++) {
    const symbol = symbolsToScan[i];
    onProgress?.(i + 1, symbolsToScan.length);

    try {
      // Check product structure
      const structure = inferProductStructure(symbol, "");
      if (hasStructuralComplexity(structure)) {
        excluded.push({ symbol, reason: "Product structure disallowed (leveraged/inverse)" });
        continue;
      }

      // Get expirations
      const expirations = await provider.getExpirations(symbol);
      const eligible = selectEligibleExpirations(expirations, config.dteRange);
      if (eligible.length === 0) {
        excluded.push({ symbol, reason: `No eligible expiration in ${config.dteRange.min}–${config.dteRange.max} DTE` });
        continue;
      }

      // Exhaustive search across all expirations and all contracts
      const result = await searchPutCandidates(symbol, eligible, deployableCash, provider, config);
      searchResults.push(result);

      if (!result.selectedCandidate) {
        excluded.push({ symbol, reason: result.exclusionReason ?? "No qualifying put contract found" });
      }
    } catch (err) {
      excluded.push({ symbol, reason: `Provider error: ${err instanceof Error ? err.message.slice(0, 60) : "unknown"}` });
    }
  }

  // Separate candidates by tier
  const actionableAndEdge: PutCandidate[] = [];
  const waitCandidates: PutCandidate[] = [];

  for (const result of searchResults) {
    if (result.bestActionable) {
      actionableAndEdge.push(result.bestActionable);
    } else if (result.bestEdge) {
      actionableAndEdge.push(result.bestEdge);
    } else if (result.bestWait) {
      waitCandidates.push(result.bestWait);
    }
  }

  // Rank ACTIONABLE and EDGE candidates
  const ranked = rankPutCandidates(actionableAndEdge);

  return {
    candidates: ranked,
    waitCandidates: rankPutCandidates(waitCandidates),
    searchResults,
    excluded,
    universeSize: symbols.length,
    symbolsEvaluated: symbolsToScan.length,
    symbolsDeferred,
  };
}

// --- Exhaustive Per-Symbol Put Search ---

async function searchPutCandidates(
  symbol: string,
  eligibleExpirations: { date: string; dte: number }[],
  deployableCash: number,
  provider: MarketDataProvider,
  config: ScanConfig
): Promise<SymbolPutSearchResult> {
  let bestActionable: PutCandidate | null = null;
  let bestEdge: PutCandidate | null = null;
  let bestWait: PutCandidate | null = null;
  const evidence: ExpirationSearchEvidence[] = [];
  let totalContractsConsidered = 0;
  let totalContractsValid = 0;

  for (const exp of eligibleExpirations) {
    let chain;
    try {
      chain = await provider.getOptionsChain(symbol, exp.date);
    } catch {
      evidence.push({ date: exp.date, dte: exp.dte, contractsTotal: 0, contractsInDeltaRange: 0, contractsZeroBid: 0, contractsMissingGreeks: 0, contractsHardExcluded: 0, contractsUnaffordable: 0, contractsEvaluated: 0, bestScore: null });
      continue;
    }

    if (chain.puts.length === 0) {
      evidence.push({ date: exp.date, dte: exp.dte, contractsTotal: 0, contractsInDeltaRange: 0, contractsZeroBid: 0, contractsMissingGreeks: 0, contractsHardExcluded: 0, contractsUnaffordable: 0, contractsEvaluated: 0, bestScore: null });
      continue;
    }

    // Evaluate ALL puts in the chain within the delta range
    const expEvidence: ExpirationSearchEvidence = {
      date: exp.date,
      dte: exp.dte,
      contractsTotal: chain.puts.length,
      contractsInDeltaRange: 0,
      contractsZeroBid: 0,
      contractsMissingGreeks: 0,
      contractsHardExcluded: 0,
      contractsUnaffordable: 0,
      contractsEvaluated: 0,
      bestScore: null,
    };

    // Filter and count
    const zeroBid = chain.puts.filter((c) => c.bid <= 0);
    const missingGreeks = chain.puts.filter((c) => c.delta === 0 && c.bid > 0);
    expEvidence.contractsZeroBid = zeroBid.length;
    expEvidence.contractsMissingGreeks = missingGreeks.length;

    // Eligible: nonzero bid, has greeks, within delta range
    const inDeltaRange = chain.puts.filter((c) =>
      c.bid > 0 &&
      c.delta !== 0 &&
      Math.abs(c.delta) >= config.deltaRange.min &&
      Math.abs(c.delta) <= config.deltaRange.max
    );
    expEvidence.contractsInDeltaRange = inDeltaRange.length;
    totalContractsConsidered += chain.puts.length;

    // Sort by distance from target delta (closest first)
    const sorted = [...inDeltaRange].sort((a, b) =>
      Math.abs(Math.abs(a.delta) - config.targetDelta) - Math.abs(Math.abs(b.delta) - config.targetDelta)
    );

    // Evaluate each eligible contract
    for (const contract of sorted) {
      const mid = midPrice(contract.bid, contract.ask);
      const spread = contract.ask - contract.bid;
      const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
      const cashRequired = contract.strike * 100;

      // Affordability
      if (cashRequired > deployableCash) {
        expEvidence.contractsUnaffordable++;
        continue;
      }

      // Build evidence
      const contractEvidence: ContractEvidence = {
        bid: contract.bid,
        ask: contract.ask,
        spreadPercent: spreadPct,
        openInterest: contract.openInterest,
        volume: contract.volume,
        delta: contract.delta,
      };

      // Hard-no check
      const hardNo = isHardNo(contractEvidence, config.executionPolicy);
      if (hardNo) {
        expEvidence.contractsHardExcluded++;
        continue;
      }

      // Assess execution
      const assessment = assessExecution(contractEvidence, config.executionPolicy);
      expEvidence.contractsEvaluated++;
      totalContractsValid++;

      if (expEvidence.bestScore === null || assessment.score > expEvidence.bestScore) {
        expEvidence.bestScore = assessment.score;
      }

      // Yield — suppress when spread makes midpoint unreliable
      const yieldAnnualized = spreadPct <= config.executionPolicy.preferredSpreadPercent * 2
        ? annualizedYield(contract.bid, contract.strike, exp.dte)
        : null;

      const candidate: PutCandidate = {
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
        cashRequired,
        cashRemaining: deployableCash - cashRequired,
        yieldAnnualized,
        assessment,
        posture: assessment.posture,
      };

      // Place in the correct tier, keeping best per tier
      switch (assessment.posture) {
        case "ACTIONABLE":
          if (!bestActionable || assessment.score > bestActionable.assessment.score) {
            bestActionable = candidate;
          }
          break;
        case "EDGE":
          if (!bestEdge || assessment.score > bestEdge.assessment.score) {
            bestEdge = candidate;
          }
          break;
        case "WAIT":
          if (!bestWait || assessment.score > bestWait.assessment.score) {
            bestWait = candidate;
          }
          break;
        // UNAVAILABLE and DATA_INCOMPLETE are not retained
      }
    }

    evidence.push(expEvidence);
  }

  // Build exclusion reason from evidence
  const selectedCandidate = bestActionable ?? bestEdge ?? bestWait ?? null;
  const selectedPosture: ActionPosture | null = bestActionable ? "ACTIONABLE"
    : bestEdge ? "EDGE"
    : bestWait ? "WAIT"
    : null;

  let exclusionReason: string | null = null;
  if (!selectedCandidate) {
    exclusionReason = buildExclusionReason(evidence, totalContractsConsidered, config);
  }

  return {
    symbol,
    expirationsEvaluated: evidence.length,
    contractsConsidered: totalContractsConsidered,
    contractsValid: totalContractsValid,
    bestActionable,
    bestEdge,
    bestWait,
    selectedCandidate,
    selectedPosture,
    exclusionReason,
    evidence,
  };
}

function buildExclusionReason(evidence: ExpirationSearchEvidence[], totalContracts: number, config: ScanConfig): string {
  if (evidence.length === 0) return "No chain data available";

  const totalInRange = evidence.reduce((s, e) => s + e.contractsInDeltaRange, 0);
  const totalZeroBid = evidence.reduce((s, e) => s + e.contractsZeroBid, 0);
  const totalMissingGreeks = evidence.reduce((s, e) => s + e.contractsMissingGreeks, 0);
  const totalHardExcluded = evidence.reduce((s, e) => s + e.contractsHardExcluded, 0);
  const totalUnaffordable = evidence.reduce((s, e) => s + e.contractsUnaffordable, 0);
  const totalEvaluated = evidence.reduce((s, e) => s + e.contractsEvaluated, 0);

  const parts: string[] = [];
  parts.push(`${evidence.length} expiration${evidence.length > 1 ? "s" : ""}, ${totalContracts} puts`);

  if (totalInRange === 0 && totalContracts > 0) {
    return `No put in delta range ${config.deltaRange.min}–${config.deltaRange.max} across ${parts[0]}`;
  }

  const reasons: string[] = [];
  if (totalZeroBid > 0) reasons.push(`${totalZeroBid} zero bid`);
  if (totalMissingGreeks > 0) reasons.push(`${totalMissingGreeks} missing Greeks`);
  if (totalHardExcluded > 0) reasons.push(`${totalHardExcluded} beyond execution floor`);
  if (totalUnaffordable > 0) reasons.push(`${totalUnaffordable} unaffordable`);
  if (totalEvaluated === 0 && totalInRange > 0) reasons.push(`${totalInRange} in range but all excluded`);

  return `Exhausted ${parts[0]}: ${reasons.join(", ")}`;
}


// --- Call Scan ---

export async function scanCalls(
  inventory: InventoryPosition[],
  provider: MarketDataProvider,
  config: ScanConfig = DEFAULT_SCAN_CONFIG,
  onProgress?: (scanned: number, total: number) => void
): Promise<{ inventory: CallInventoryItem[]; candidates: CallCandidate[]; excluded: { symbol: string; reason: string }[] }> {
  const allItems: CallInventoryItem[] = [];
  const allCandidates: CallCandidate[] = [];
  const excluded: { symbol: string; reason: string }[] = [];

  const eligible = inventory.filter((p) => p.maxAdditionalContracts > 0);
  const ineligible = inventory.filter((p) => p.maxAdditionalContracts === 0);

  // Record ineligible items
  for (const pos of ineligible) {
    const reason = pos.sharesEncumbered >= pos.sharesOwned
      ? "Fully encumbered"
      : pos.sharesFree < 100
        ? `${pos.sharesFree} shares — below 1 lot`
        : "No capacity";
    allItems.push({ symbol: pos.symbol, sharesOwned: pos.sharesOwned, sharesEncumbered: pos.sharesEncumbered, sharesFree: pos.sharesFree, maxContracts: pos.maxAdditionalContracts, reason, candidates: [] });
  }

  // Scan eligible
  for (let i = 0; i < eligible.length; i++) {
    const pos = eligible[i];
    onProgress?.(i + 1, eligible.length);

    try {
      const expirations = await provider.getExpirations(pos.symbol);
      const eligibleExps = selectEligibleExpirations(expirations, config.dteRange);

      if (eligibleExps.length === 0) {
        allItems.push({ symbol: pos.symbol, sharesOwned: pos.sharesOwned, sharesEncumbered: pos.sharesEncumbered, sharesFree: pos.sharesFree, maxContracts: pos.maxAdditionalContracts, reason: "No eligible expiration", candidates: [] });
        excluded.push({ symbol: pos.symbol, reason: "No eligible expiration in DTE range" });
        continue;
      }

      let bestCandidate: CallCandidate | null = null;

      for (const exp of eligibleExps) {
        const chain = await provider.getOptionsChain(pos.symbol, exp.date);
        if (chain.calls.length === 0) continue;

        const contract = selectCallContract(chain.calls, config);
        if (!contract) continue;

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

        const hardNo = isHardNo(evidence, config.executionPolicy);
        if (hardNo) continue;

        const assessment = assessExecution(evidence, config.executionPolicy);
        const underlyingPrice = chain.underlying.price;

        const yieldAnnualized = spreadPct <= config.executionPolicy.preferredSpreadPercent * 2
          ? annualizedYield(contract.bid, underlyingPrice, exp.dte)
          : null;

        const candidate: CallCandidate = {
          rank: 0,
          symbol: pos.symbol,
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
          premiumPerContract: contract.bid * 100,
          yieldAnnualized,
          assessment,
          posture: assessment.posture,
          strikeAbovePrice: contract.strike > underlyingPrice,
          underlyingPrice,
        };

        if (!bestCandidate || assessment.score > bestCandidate.assessment.score) {
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        allCandidates.push(bestCandidate);
        allItems.push({ symbol: pos.symbol, sharesOwned: pos.sharesOwned, sharesEncumbered: pos.sharesEncumbered, sharesFree: pos.sharesFree, maxContracts: pos.maxAdditionalContracts, reason: null, candidates: [bestCandidate] });
      } else {
        allItems.push({ symbol: pos.symbol, sharesOwned: pos.sharesOwned, sharesEncumbered: pos.sharesEncumbered, sharesFree: pos.sharesFree, maxContracts: pos.maxAdditionalContracts, reason: "No qualifying call contract found", candidates: [] });
        excluded.push({ symbol: pos.symbol, reason: "No qualifying call contract" });
      }
    } catch (err) {
      allItems.push({ symbol: pos.symbol, sharesOwned: pos.sharesOwned, sharesEncumbered: pos.sharesEncumbered, sharesFree: pos.sharesFree, maxContracts: pos.maxAdditionalContracts, reason: `Provider error`, candidates: [] });
      excluded.push({ symbol: pos.symbol, reason: `Provider error: ${err instanceof Error ? err.message.slice(0, 60) : "unknown"}` });
    }
  }

  // Rank call candidates
  const ranked = rankCallCandidates(allCandidates);
  return { inventory: allItems, candidates: ranked, excluded };
}

// --- Contract Selection Helpers ---

function selectCallContract(calls: OptionContract[], config: ScanConfig): OptionContract | null {
  const eligible = calls.filter((c) =>
    c.bid > 0 &&
    c.delta !== 0 &&
    c.delta >= config.deltaRange.min &&
    c.delta <= config.deltaRange.max
  );
  if (eligible.length === 0) return null;
  return findClosestToDelta(eligible, config.targetDelta, "PreferOTM");
}

// --- Ranking ---

const POSTURE_ORDER: Record<ActionPosture, number> = {
  ACTIONABLE: 0,
  EDGE: 1,
  WAIT: 2,
  UNAVAILABLE: 3,
  DATA_INCOMPLETE: 4,
};

function rankPutCandidates(candidates: PutCandidate[]): PutCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    // 1. Posture tier
    const pa = POSTURE_ORDER[a.posture];
    const pb = POSTURE_ORDER[b.posture];
    if (pa !== pb) return pa - pb;
    // 2. Execution score (higher first)
    if (a.assessment.score !== b.assessment.score) return b.assessment.score - a.assessment.score;
    // 3. Yield (higher first, null last)
    const ya = a.yieldAnnualized ?? -1;
    const yb = b.yieldAnnualized ?? -1;
    if (ya !== yb) return yb - ya;
    // 4. Symbol (deterministic)
    return a.symbol.localeCompare(b.symbol);
  });
  return sorted.map((c, i) => ({ ...c, rank: i + 1 }));
}

function rankCallCandidates(candidates: CallCandidate[]): CallCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    const pa = POSTURE_ORDER[a.posture];
    const pb = POSTURE_ORDER[b.posture];
    if (pa !== pb) return pa - pb;
    if (a.assessment.score !== b.assessment.score) return b.assessment.score - a.assessment.score;
    const ya = a.yieldAnnualized ?? -1;
    const yb = b.yieldAnnualized ?? -1;
    if (ya !== yb) return yb - ya;
    return a.symbol.localeCompare(b.symbol);
  });
  return sorted.map((c, i) => ({ ...c, rank: i + 1 }));
}
