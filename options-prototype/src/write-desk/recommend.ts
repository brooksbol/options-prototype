/**
 * Recommendation Engine — Pure cache-based contract evaluation and ranking.
 *
 * INVARIANT: This module NEVER makes provider calls.
 * It operates entirely on the Universe Evidence Store (durable cache).
 *
 * Responsibilities:
 * - Contract selection from cached chains
 * - Execution assessment
 * - Posture assignment
 * - Ranking
 * - Portfolio affordability
 * - Coverage gap identification
 *
 * The recommendation engine receives policy objects explicitly and includes
 * the policy snapshot in its output for reproducibility.
 */

import type { Expiration } from "../domain/types";
import { selectEligibleExpirations } from "../velvet-rope/evaluate";
import { inferProductStructure, hasStructuralComplexity } from "../velvet-rope/product-structure";
import type { ProductStructure } from "../velvet-rope/product-structure";
import { lookupCatalog, governanceFromCatalog } from "../instrument-catalog/catalog";
import { midPrice, annualizedYield } from "../domain/calculations";
import { assessExecution, isHardNo, type ContractEvidence, type ActionPosture } from "./execution-assessment";
import { type DurableMarketCache, buildCacheKey } from "../cache/durable-cache";
import { type ExecutionPolicy, DEFAULT_EXECUTION_POLICY } from "./execution-policy";
import type { PutCandidate } from "./scan-orchestrator";

// --- Policy Types ---

export interface ContractSelectionPolicy {
  targetDelta: number;
  preferredDeltaBand: { min: number; max: number };
  admissibleDeltaRange: { min: number; max: number };
  targetDte: number;
  eligibleDteRange: { min: number; max: number };
  side: "puts" | "calls" | "both";
  excludeZeroBid: boolean;
  requireGreeks: boolean;
}

export interface RankingPolicy {
  mode: "execution_first" | "balanced" | "yield_first" | "capital_efficiency";
  maxResults: number;
  includeEdge: boolean;
  includeWait: boolean;
}

export interface DeploymentPolicy {
  reserveAmount: number;
  maxContractsPerSymbol: number;
  maxConcentrationPercent: number;
}

export interface RecommendationPolicy {
  version: string;
  contractSelection: ContractSelectionPolicy;
  executionAssessment: ExecutionPolicy;
  ranking: RankingPolicy;
  deployment: DeploymentPolicy;
}

// --- Default Policy ---

export const DEFAULT_RECOMMENDATION_POLICY: RecommendationPolicy = {
  version: "routine-csp-v1-provisional",
  contractSelection: {
    targetDelta: 0.30,
    preferredDeltaBand: { min: 0.25, max: 0.35 },
    admissibleDeltaRange: { min: 0.15, max: 0.50 },
    targetDte: 21,
    eligibleDteRange: { min: 7, max: 45 },
    side: "puts",
    excludeZeroBid: true,
    requireGreeks: true,
  },
  executionAssessment: DEFAULT_EXECUTION_POLICY,
  ranking: {
    mode: "execution_first",
    maxResults: 2000,
    includeEdge: true,
    includeWait: false,
  },
  deployment: {
    reserveAmount: 0,
    maxContractsPerSymbol: 1,
    maxConcentrationPercent: 100,
  },
};

// --- Coverage Request ---

export interface CoverageRequest {
  symbol: string;
  expiration: string | null;
  reason: string;
  priority: "high" | "medium" | "low";
}

// --- Recommendation Result ---

/**
 * Terminal Outcome — every symbol in the monitored universe belongs to
 * exactly one of these mutually exclusive categories.
 * All counts must sum to `monitored`.
 */
export interface TerminalOutcomes {
  /** Score ≥ actionableFloor — recommended, execution quality supports acting */
  actionable: number;
  /** Score ≥ edgeFloor — recommended, marginal but plausible */
  edge: number;
  /** Score ≥ waitFloor but < edgeFloor — evaluated but below recommendation threshold */
  wait: number;
  /** All contracts had zero bid — dead/delisted market */
  hardNoZeroBid: number;
  /** All contracts had zero open interest — no market participation */
  hardNoZeroOI: number;
  /** All contracts had spread exceeding exclusion floor — unusable market structure */
  hardNoWideSpread: number;
  /** Has chain but no contract within admissible delta range */
  noDeltaMatch: number;
  /** Has expirations but none within eligible DTE range */
  noDteMatch: number;
  /** Confirmed no listed options */
  nonOptionable: number;
  /** Evidence incomplete or not yet resolved */
  incomplete: number;
  /** Instrument classification unknown — required evidence unavailable, fail closed */
  classificationUnknown: number;
}

export interface RecommendationFunnel {
  /** Total symbols in the monitored universe */
  monitored: number;
  /** Terminal outcomes — every symbol maps to exactly one */
  outcomes: TerminalOutcomes;
  /** Symbols evaluated with evidence (had chain data) */
  evaluable: number;
  /** Total recommendations (actionable + edge) */
  eligible: number;
  /** Candidates after ranking cap */
  ranked: number;

  // Legacy compatibility (remove in future)
  resolved: number;
  optionable: number;
  nonOptionable: number;
  pending: number;
  actionable: number;
  edge: number;
  waitPosture: number;
  displayed: number;
  exclusions: FunnelExclusion[];
}

export interface FunnelExclusion {
  reason: string;
  count: number;
}

export interface RecommendationResult {
  /** Ranked candidates (ACTIONABLE + optionally EDGE, capped at maxResults) */
  candidates: PutCandidate[];
  /** WAIT candidates (for explanatory display, not recommendations) */
  waitCandidates: PutCandidate[];
  /** Wide-spread candidates (visible for monitoring, not recommended) */
  wideSpreadCandidates: PutCandidate[];
  /** Evidence gaps the engine could not resolve locally */
  coverageRequests: CoverageRequest[];
  /** Coverage statistics from this recommendation pass */
  coverage: {
    symbolsEvaluated: number;
    symbolsWithEvidence: number;
    symbolsMissingChain: number;
    symbolsExcluded: number;
    confirmedAbsence: number;
  };
  /** Full recommendation funnel with exact counts */
  funnel: RecommendationFunnel;
  /** The exact policy used (for audit/reproducibility) */
  policySnapshot: RecommendationPolicy;
  /** Recommendation timestamp */
  computedAt: string;
}

// --- Recommendation Engine ---

/**
 * Produce ranked put recommendations from cached evidence.
 *
 * NEVER makes provider calls. Reads from DurableMarketCache only.
 * Returns coverage requests for missing evidence it cannot resolve locally.
 *
 * Evidence eligibility:
 * - During closed/non-trading sessions, any cached evidence is eligible
 *   (canonical evidence from the last session doesn't expire on a clock)
 * - During active sessions, only non-expired evidence counts
 */
export async function recommendPuts(
  symbols: string[],
  deployableCash: number,
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string },
  policy: RecommendationPolicy = DEFAULT_RECOMMENDATION_POLICY,
  options?: { sessionClosed?: boolean }
): Promise<RecommendationResult> {
  const allCandidates: PutCandidate[] = [];
  const allWait: PutCandidate[] = [];
  const allWideSpread: PutCandidate[] = [];
  const coverageRequests: CoverageRequest[] = [];
  let symbolsEvaluated = 0;
  let symbolsWithEvidence = 0;
  let symbolsMissingChain = 0;
  let symbolsExcluded = 0;
  let confirmedAbsence = 0;

  // Funnel tracking
  let funnelOptionable = 0;
  let funnelEvaluable = 0;
  let funnelPending = 0;
  let funnelWaitPosture = 0;
  let funnelActionable = 0;
  let funnelEdge = 0;
  let exclNoEligibleDte = 0;
  let exclNoChain = 0;
  let exclNoDeltaInRange = 0;
  let exclHardNoZeroBid = 0;
  let exclHardNoZeroOI = 0;
  let exclHardNoWideSpread = 0;
  let exclNoContracts = 0;

  const effectiveCash = deployableCash - policy.deployment.reserveAmount;
  // When session is closed, canonical evidence remains valid regardless of TTL.
  // This implements sealed-evidence semantics: Friday's close remains valid through Monday.
  const useSessionValidity = options?.sessionClosed ?? false;

  /**
   * Check if a cache record is eligible for recommendation.
   *
   * Two modes:
   *   - Active session: TTL-based freshness (fresh or stale_usable)
   *   - Closed session: any record accepted (sealed evidence validity)
   *
   * LIMITATION (transitional): Closed-session mode accepts any cached record.
   * It does not verify canonical session provenance because IndexedDB records
   * currently lack session-date identity. This means a record from an older,
   * non-canonical session could participate if it remains in the cache.
   *
   * This is acceptable transitionally because:
   *   - IndexedDB is browser-local (single operator)
   *   - Chain TTLs naturally expire old data during active sessions
   *   - The intended fix is persistence with explicit seal/session metadata (Phase 5)
   *
   * Minimum provenance: record must exist.
   */
  function isEligible(record: unknown): boolean {
    if (!record) return false;
    if (useSessionValidity) return true; // sealed evidence valid during closed session
    const freshness = cache.freshness(record as Parameters<typeof cache.freshness>[0]);
    return freshness === "fresh" || freshness === "stale_usable";
  }

  for (const symbol of symbols) {
    symbolsEvaluated++;

    // Check confirmed absence
    const absKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "absence", symbol);
    const absRecord = await cache.get(absKey);
    if (absRecord && (cache.freshness(absRecord) === "fresh" || cache.freshness(absRecord) === "stale_usable")) {
      confirmedAbsence++;
      continue;
    }

    // NOTE: Product-structure check is deferred until chain evidence is available
    // so that underlying.name can be supplied. See governance invariant:
    // "Unknown evidence may restrict a decision, but it must never silently authorize one."

    // Get expirations from cache
    const expKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "expirations", symbol);
    const expRecord = await cache.get<Expiration[]>(expKey);
    if (!expRecord || !isEligible(expRecord)) {
      // No expiration evidence — emit coverage request (pending/unresolved)
      coverageRequests.push({ symbol, expiration: null, reason: "No cached expirations", priority: "medium" });
      funnelPending++;
      continue;
    }

    // Symbol is optionable (has expirations in cache)
    funnelOptionable++;

    const expirations = expRecord.payload;
    const eligible = selectEligibleExpirations(expirations, policy.contractSelection.eligibleDteRange);
    if (eligible.length === 0) {
      symbolsWithEvidence++;
      symbolsExcluded++;
      exclNoEligibleDte++;
      continue;
    }

    // Evaluate chains from cache
    let foundChain = false;
    let instrumentName: string | null = null;
    let bestActionable: PutCandidate | null = null;
    let bestEdge: PutCandidate | null = null;
    let bestWait: PutCandidate | null = null;
    let bestWideSpread: PutCandidate | null = null;
    let symbolHadContractsInRange = false;
    let symbolHadHardNoOnly = false;
    let symbolHardNoReason: "zeroBid" | "zeroOI" | "wideSpread" | null = null;

    for (const exp of eligible) {
      interface CachedChain { puts: Array<{ type: string; strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>; underlying?: { name?: string; symbol?: string; price?: number } }
      const chainKey = buildCacheKey(cacheEnvironment.provider, cacheEnvironment.environment, "chain", symbol, exp.date);
      const chainRecord = await cache.get<CachedChain>(chainKey);
      if (!chainRecord || !isEligible(chainRecord)) {
        // Missing chain — emit coverage request for this specific expiration
        if (!foundChain) {
          coverageRequests.push({ symbol, expiration: exp.date, reason: `Missing chain for ${exp.date} (${exp.dte} DTE)`, priority: "medium" });
        }
        continue;
      }

      foundChain = true;

      // Extract instrument name from chain underlying (first available wins)
      if (!instrumentName && chainRecord.payload.underlying?.name) {
        instrumentName = chainRecord.payload.underlying.name;
      }

      const puts = chainRecord.payload.puts ?? [];

      // Filter by admissible delta range
      const { admissibleDeltaRange, excludeZeroBid, requireGreeks } = policy.contractSelection;
      const inRange = puts.filter((c) =>
        (!excludeZeroBid || c.bid > 0) &&
        (!requireGreeks || c.delta !== 0) &&
        Math.abs(c.delta) >= admissibleDeltaRange.min &&
        Math.abs(c.delta) <= admissibleDeltaRange.max
      );

      if (inRange.length > 0) symbolHadContractsInRange = true;

      let allHardNo = inRange.length > 0;
      for (const contract of inRange) {
        const mid = midPrice(contract.bid, contract.ask);
        const spread = contract.ask - contract.bid;
        const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
        const cashRequired = contract.strike * 100;
        const affordable = cashRequired <= effectiveCash;

        const evidence: ContractEvidence = {
          bid: contract.bid,
          ask: contract.ask,
          spreadPercent: spreadPct,
          openInterest: contract.openInterest,
          volume: contract.volume,
          delta: contract.delta,
        };

        // Hard-no check: zero bid and zero OI are true exclusions.
        // Wide spread is annotated but not excluded (visibility principle).
        const hardNoReason = isHardNo(evidence, policy.executionAssessment);
        if (hardNoReason) {
          if (evidence.bid <= 0) {
            if (!symbolHardNoReason) symbolHardNoReason = "zeroBid";
            continue;
          }
          if (evidence.openInterest === 0) {
            if (!symbolHardNoReason) symbolHardNoReason = "zeroOI";
            continue;
          }
          // Wide spread: let through as WIDE_SPREAD posture instead of excluding
          const wideSpreadCandidate: PutCandidate = {
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
            cashRemaining: effectiveCash - cashRequired,
            yieldAnnualized: null, // suppressed — spread unreliable
            assessment: { score: 0, posture: "UNAVAILABLE", components: [], hardNoReason: hardNoReason, policyVersion: policy.executionAssessment.version },
            posture: "WIDE_SPREAD" as any,
            affordable,
            governance: { status: "authorized", reason: "" },
          };
          if (!bestWideSpread || spreadPct < bestWideSpread.spreadPercent) {
            bestWideSpread = wideSpreadCandidate;
          }
          continue;
        }
        allHardNo = false;

        const assessment = assessExecution(evidence, policy.executionAssessment);
        const yieldAnnualized = spreadPct <= policy.executionAssessment.preferredSpreadPercent * 2
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
          cashRemaining: effectiveCash - cashRequired,
          yieldAnnualized,
          assessment,
          posture: assessment.posture,
          affordable,
          governance: { status: "authorized", reason: "" }, // resolved after chain loop
        };

        switch (assessment.posture) {
          case "ACTIONABLE":
            if (!bestActionable || assessment.score > bestActionable.assessment.score) bestActionable = candidate;
            break;
          case "EDGE":
            if (!bestEdge || assessment.score > bestEdge.assessment.score) bestEdge = candidate;
            break;
          case "WAIT":
            if (!bestWait || assessment.score > bestWait.assessment.score) bestWait = candidate;
            break;
        }
      }

      if (allHardNo && inRange.length > 0) symbolHadHardNoOnly = true;
    }

    if (foundChain) {
      symbolsWithEvidence++;
      funnelEvaluable++;

      // GOVERNANCE: Classification resolution with precedence:
      //   1. Canonical catalog record (highest confidence)
      //   2. Deterministic name heuristic (fallback)
      //   3. Unknown classification (no evidence available)
      const catalogRecord = lookupCatalog(symbol);
      let governance: GovernanceAnnotation;

      if (catalogRecord) {
        // Catalog takes precedence — canonical evidence
        governance = governanceFromCatalog(catalogRecord);
      } else {
        // Fallback: name heuristic from chain evidence
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

      const best = bestActionable ?? bestEdge ?? bestWait;
      if (best) {
        // Attach governance to the candidate
        best.governance = governance;
        if (best.posture === "ACTIONABLE" || best.posture === "EDGE") {
          allCandidates.push(best);
          if (best.posture === "ACTIONABLE") funnelActionable++;
          else funnelEdge++;
        } else {
          allWait.push(best);
          funnelWaitPosture++;
        }
      } else if (bestWideSpread) {
        // No normal candidate but has a wide-spread contract — include for visibility
        bestWideSpread.governance = governance;
        allWideSpread.push(bestWideSpread);
      } else {
        // Had chain but no qualifying candidate at all
        if (!symbolHadContractsInRange) {
          exclNoDeltaInRange++;
        } else if (symbolHadHardNoOnly) {
          switch (symbolHardNoReason) {
            case "zeroBid": exclHardNoZeroBid++; break;
            case "zeroOI": exclHardNoZeroOI++; break;
            case "wideSpread": exclHardNoWideSpread++; break;
            default: exclHardNoWideSpread++; break; // fallback
          }
        } else {
          exclNoContracts++;
        }
      }
    } else {
      symbolsMissingChain++;
      exclNoChain++;
    }
  }

  // Rank
  const ranked = rankByPolicy(allCandidates, policy.ranking);
  const waitRanked = rankByPolicy(allWait, policy.ranking);

  // Build exclusions list
  const exclusions: FunnelExclusion[] = [];
  if (confirmedAbsence > 0) exclusions.push({ reason: "Non-optionable (no listed options)", count: confirmedAbsence });
  if (exclNoEligibleDte > 0) exclusions.push({ reason: "No expiration in DTE range", count: exclNoEligibleDte });
  if (exclNoChain > 0) exclusions.push({ reason: "Missing chain data", count: exclNoChain });
  if (exclNoDeltaInRange > 0) exclusions.push({ reason: "No contract in delta range", count: exclNoDeltaInRange });
  if (exclHardNoZeroBid > 0) exclusions.push({ reason: "Hard-no: zero bid", count: exclHardNoZeroBid });
  if (exclHardNoZeroOI > 0) exclusions.push({ reason: "Hard-no: zero open interest", count: exclHardNoZeroOI });
  if (exclHardNoWideSpread > 0) exclusions.push({ reason: "Hard-no: spread exceeds floor", count: exclHardNoWideSpread });
  if (funnelWaitPosture > 0) exclusions.push({ reason: "Wait posture (below EDGE threshold)", count: funnelWaitPosture });
  if (exclNoContracts > 0) exclusions.push({ reason: "No qualifying contract", count: exclNoContracts });
  if (funnelPending > 0) exclusions.push({ reason: "Pending (not yet resolved)", count: funnelPending });

  const funnel: RecommendationFunnel = {
    monitored: symbols.length,
    outcomes: {
      actionable: funnelActionable,
      edge: funnelEdge,
      wait: funnelWaitPosture,
      hardNoZeroBid: exclHardNoZeroBid,
      hardNoZeroOI: exclHardNoZeroOI,
      hardNoWideSpread: exclHardNoWideSpread + allWideSpread.length,
      noDeltaMatch: exclNoDeltaInRange + exclNoContracts,
      noDteMatch: exclNoEligibleDte,
      nonOptionable: confirmedAbsence,
      incomplete: funnelPending + exclNoChain,
      classificationUnknown: 0, // No longer a terminal exclusion — visible with governance annotation
    },
    evaluable: funnelEvaluable,
    eligible: allCandidates.length,
    ranked: ranked.length,
    // Legacy compatibility
    resolved: symbols.length - funnelPending,
    optionable: funnelOptionable,
    nonOptionable: confirmedAbsence,
    pending: funnelPending,
    actionable: funnelActionable,
    edge: funnelEdge,
    waitPosture: funnelWaitPosture,
    displayed: ranked.length,
    exclusions,
  };

  return {
    candidates: ranked,
    waitCandidates: waitRanked,
    wideSpreadCandidates: allWideSpread,
    coverageRequests,
    coverage: {
      symbolsEvaluated,
      symbolsWithEvidence,
      symbolsMissingChain,
      symbolsExcluded,
      confirmedAbsence,
    },
    funnel,
    policySnapshot: policy,
    computedAt: new Date().toISOString(),
  };
}

// --- Ranking by Policy ---

const POSTURE_ORDER: Record<ActionPosture, number> = {
  ACTIONABLE: 0,
  EDGE: 1,
  WAIT: 2,
  UNAVAILABLE: 3,
  DATA_INCOMPLETE: 4,
};

function rankByPolicy(candidates: PutCandidate[], ranking: RankingPolicy): PutCandidate[] {
  const ranked = [...candidates].sort((a, b) => {
    // 1. Posture tier
    const pa = POSTURE_ORDER[a.posture];
    const pb = POSTURE_ORDER[b.posture];
    if (pa !== pb) return pa - pb;

    // 2. Mode-dependent secondary sort
    switch (ranking.mode) {
      case "execution_first":
        if (a.assessment.score !== b.assessment.score) return b.assessment.score - a.assessment.score;
        return (b.yieldAnnualized ?? -1) - (a.yieldAnnualized ?? -1);

      case "yield_first": {
        const ya = a.yieldAnnualized ?? -1;
        const yb = b.yieldAnnualized ?? -1;
        if (ya !== yb) return yb - ya;
        return b.assessment.score - a.assessment.score;
      }

      case "capital_efficiency": {
        const effA = a.yieldAnnualized != null ? a.yieldAnnualized / (a.cashRequired / 1000) : -1;
        const effB = b.yieldAnnualized != null ? b.yieldAnnualized / (b.cashRequired / 1000) : -1;
        if (effA !== effB) return effB - effA;
        return b.assessment.score - a.assessment.score;
      }

      case "balanced":
      default: {
        const scoreA = a.assessment.score + (a.yieldAnnualized ?? 0);
        const scoreB = b.assessment.score + (b.yieldAnnualized ?? 0);
        return scoreB - scoreA;
      }
    }
  });

  return ranked.map((c, i) => ({ ...c, rank: i + 1 }));
}
