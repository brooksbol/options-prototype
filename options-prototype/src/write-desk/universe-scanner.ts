/**
 * Universe Scanner — Complete-universe top-20 ranking via plan→hydrate→refresh→evaluate→rank.
 *
 * Implements the acceptance criterion:
 * "Show me the top 20 cash-secured put recommendations from the entire Yahoo 496 universe."
 *
 * Pipeline:
 *   1. Load universe (496 symbols)
 *   2. Build scan plan (classify cache state for every symbol)
 *   3. Hydrate cached evidence (L1/L2)
 *   4. Refresh only stale/missing within budget
 *   5. Evaluate all symbols with current-enough evidence locally
 *   6. Rank across complete coverage → top 20
 *   7. Update crawl state durably
 *
 * Key invariant:
 *   Cached evidence participates in ranking. Network calls refresh selectively.
 *   A full-coverage ranking does NOT require 496 fresh network calls.
 */

import type { MarketDataProvider } from "../domain/provider";
import type { Expiration } from "../domain/types";
import { selectEligibleExpirations } from "../velvet-rope/evaluate";
import { inferProductStructure, hasStructuralComplexity } from "../velvet-rope/product-structure";
import { midPrice, annualizedYield } from "../domain/calculations";
import { assessExecution, isHardNo, type ContractEvidence } from "./execution-assessment";
import { getDurableCache, buildCacheKey, type DurableMarketCache } from "../cache/durable-cache";
import { getCrawlState, type SymbolResultClass } from "../cache/crawl-state";
import { buildScanPlan, type ScanPlannerConfig, DEFAULT_PLANNER_CONFIG } from "../cache/scan-planner";
import { DEFAULT_SCAN_CONFIG, type ScanConfig, type PutCandidate } from "./scan-orchestrator";
import type { ActionPosture } from "./execution-assessment";

// --- Universe Scan Result ---

export type CoverageStatus = "COMPLETE" | "BUILDING" | "REFRESHING" | "INCOMPLETE";

// --- Scan Telemetry (runtime observability) ---

export interface ScanTelemetry {
  passId: string;
  startedAt: string;
  completedAt: string | null;
  universe: {
    id: string;
    version: string;
    totalSymbols: number;
  };
  generation: {
    id: string | null;
    cursorBefore: number;
    cursorAfter: number;
    coveredBefore: number;
    coveredAfter: number;
    remaining: number;
    status: string;
  };
  pass: {
    selectedSymbols: string[];
    completedSymbols: string[];
    deferredSymbols: string[];
    errors: string[];
  };
  cache: {
    l1MemoryHits: number;
    l2IndexedDBHits: number;
    networkFetches: number;
    staleHits: number;
    indexedDBWrites: number;
  };
  provider: {
    expirationCalls: number;
    chainCalls: number;
    quoteCalls: number;
    failures: number;
    rateLimitDeferrals: number;
  };
}

export interface UniverseScanResult {
  /** Top candidates (ACTIONABLE + EDGE only, max 20) */
  top20: PutCandidate[];
  /** All WAIT candidates (not in top 20) */
  waitCandidates: PutCandidate[];
  /** Coverage metadata */
  coverage: {
    status: CoverageStatus;
    universeSize: number;
    covered: number;
    fresh: number;
    staleUsable: number;
    missing: number;
    confirmedAbsence: number;
    refreshedThisPass: number;
    deferredThisPass: number;
  };
  /** Crawl state */
  generation: {
    id: string | null;
    cursor: number;
    evaluated: number;
    actionableCount: number;
    edgeCount: number;
    waitCount: number;
    isComplete: boolean;
  };
  /** Whether the top-20 list is provisional or from complete coverage */
  isProvisional: boolean;
  /** Scan plan summary */
  planSummary: {
    estimatedCalls: { quotes: number; expirations: number; chains: number };
    scheduledWork: number;
    totalRefreshNeeded: number;
  };
  /** Runtime telemetry for observability */
  telemetry: ScanTelemetry;
}

// --- Universe Scanner ---

export async function scanUniversePuts(
  symbols: string[],
  deployableCash: number,
  provider: MarketDataProvider,
  scanConfig: ScanConfig = DEFAULT_SCAN_CONFIG,
  plannerConfig: ScanPlannerConfig = DEFAULT_PLANNER_CONFIG,
  onProgress?: (phase: string, done: number, total: number) => void
): Promise<UniverseScanResult> {
  const cache = getDurableCache();
  const crawl = getCrawlState();
  const passId = `pass-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = new Date().toISOString();

  // Snapshot provider counters at start (for delta calculation)
  const providerAny = provider as { durableHits?: number; memoryHits?: number; networkCalls?: number; getCacheStats?: () => { apiCalls: number } };
  const baselineDurable = providerAny.durableHits ?? 0;
  const baselineMemory = providerAny.memoryHits ?? 0;
  const baselineNetwork = providerAny.networkCalls ?? 0;

  // Telemetry accumulators
  let expirationCalls = 0;
  let chainCalls = 0;
  let quoteCalls = 0;
  let providerFailures = 0;
  let indexedDBWrites = 0;
  const completedSymbols: string[] = [];
  const errorSymbols: string[] = [];

  // 1. Ensure crawl generation
  await crawl.ensureGeneration(
    plannerConfig.provider + ":" + plannerConfig.environment,
    "yahoo-496-v1",
    symbols
  );

  // 2. Build scan plan
  const cursorBefore = crawl.current()?.cursor ?? 0;
  const statsBefore = crawl.getStats();
  onProgress?.("planning", 0, symbols.length);
  const plan = await buildScanPlan(symbols, cache, crawl, plannerConfig);

  // 3. Refresh scheduled work items (network calls)
  let refreshed = 0;
  for (const work of plan.scheduledWork) {
    onProgress?.("refreshing", refreshed, plan.scheduledWork.length);
    try {
      if (work.type === "expirations") {
        expirationCalls++;
        const expirations = await provider.getExpirations(work.symbol);
        const key = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "expirations", work.symbol);
        if (expirations.length === 0) {
          // Confirmed absence
          const absKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "absence", work.symbol);
          await cache.put(cache.createRecord(absKey, "absence", plannerConfig.provider, plannerConfig.environment, work.symbol, null, { reason: "no expirations" }));
          indexedDBWrites++;
        } else {
          await cache.put(cache.createRecord(key, "expirations", plannerConfig.provider, plannerConfig.environment, work.symbol, null, expirations));
          indexedDBWrites++;
        }
        completedSymbols.push(work.symbol);
      } else if (work.type === "chain" && work.expiration) {
        chainCalls++;
        const chain = await provider.getOptionsChain(work.symbol, work.expiration);
        const key = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "chain", work.symbol, work.expiration);
        await cache.put(cache.createRecord(key, "chain", plannerConfig.provider, plannerConfig.environment, work.symbol, work.expiration, chain));
        indexedDBWrites++;
        completedSymbols.push(work.symbol);
      }
      refreshed++;
    } catch (err) {
      providerFailures++;
      errorSymbols.push(work.symbol);
      // Cache the error with short TTL
      const errKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "error", work.symbol);
      await cache.put(cache.createRecord(errKey, "error", plannerConfig.provider, plannerConfig.environment, work.symbol, null, { message: String(err) }));
    }
  }

  // 4. Evaluate all symbols with available evidence
  onProgress?.("evaluating", 0, symbols.length);
  const allCandidates: PutCandidate[] = [];
  const allWait: PutCandidate[] = [];
  let coveredCount = 0;
  let freshCount = 0;
  let staleUsableCount = 0;
  let missingCount = 0;
  let absenceCount = 0;

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    if (i % 50 === 0) onProgress?.("evaluating", i, symbols.length);

    const symbolPlan = plan.symbolPlans.get(symbol);
    if (!symbolPlan) { missingCount++; continue; }

    // Skip confirmed absence
    if (symbolPlan.status === "CONFIRMED_ABSENCE") {
      absenceCount++;
      await crawl.markEvaluated(symbol, "HARD_NO", null);
      continue;
    }

    // Skip symbols with no evidence at all
    if (symbolPlan.status === "MISSING" || symbolPlan.status === "ERROR_RETRY_DUE") {
      // Check if we just refreshed it
      const expKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "expirations", symbol);
      const freshRecord = await cache.get(expKey);
      if (!freshRecord || cache.freshness(freshRecord) === "expired" || cache.freshness(freshRecord) === "missing") {
        missingCount++;
        continue;
      }
    }

    // Attempt evaluation from cache
    const candidate = await evaluateSymbolFromCache(symbol, deployableCash, cache, plannerConfig, scanConfig);

    if (candidate) {
      coveredCount++;
      if (candidate.status === "fresh") freshCount++;
      else staleUsableCount++;

      const resultClass = candidate.bestCandidate?.posture === "ACTIONABLE" ? "ACTIONABLE"
        : candidate.bestCandidate?.posture === "EDGE" ? "EDGE"
        : candidate.bestCandidate?.posture === "WAIT" ? "WAIT"
        : "HARD_NO";

      await crawl.markEvaluated(symbol, resultClass as SymbolResultClass, candidate.bestCandidate?.assessment.score ?? null);

      if (candidate.bestCandidate) {
        if (candidate.bestCandidate.posture === "ACTIONABLE" || candidate.bestCandidate.posture === "EDGE") {
          allCandidates.push(candidate.bestCandidate);
        } else if (candidate.bestCandidate.posture === "WAIT") {
          allWait.push(candidate.bestCandidate);
        }
      }
    } else {
      // No usable evidence
      if (symbolPlan.status === "FRESH" || symbolPlan.status === "STALE_USABLE") {
        coveredCount++;
        await crawl.markEvaluated(symbol, "HARD_NO", null);
      } else {
        missingCount++;
      }
    }
  }

  // 5. Advance crawl cursor (only if generation not already complete)
  if (!crawl.isComplete()) {
    const oldCursor = crawl.current()?.cursor ?? 0;
    crawl.advanceCursor(Math.min(oldCursor + plan.scheduledWork.length, symbols.length));
  }
  await crawl.save();

  // 6. Rank across complete coverage
  const ranked = rankCandidates(allCandidates);
  const top20 = ranked.slice(0, 20);
  const waitRanked = rankCandidates(allWait);

  // 7. Coverage status
  const totalCoverable = symbols.length;
  const totalCovered = coveredCount + absenceCount;
  const isComplete = totalCovered >= totalCoverable;
  const coverageStatus: CoverageStatus = isComplete ? "COMPLETE"
    : totalCovered > 0 ? "BUILDING"
    : "INCOMPLETE";

  const crawlStats = crawl.getStats();

  return {
    top20,
    waitCandidates: waitRanked.slice(0, 5),
    coverage: {
      status: coverageStatus,
      universeSize: totalCoverable,
      covered: totalCovered,
      fresh: freshCount,
      staleUsable: staleUsableCount,
      missing: missingCount,
      confirmedAbsence: absenceCount,
      refreshedThisPass: refreshed,
      deferredThisPass: plan.deferredCount,
    },
    generation: {
      id: crawl.current()?.id ?? null,
      cursor: crawl.current()?.cursor ?? 0,
      evaluated: crawlStats.evaluated,
      actionableCount: crawlStats.actionable,
      edgeCount: crawlStats.edge,
      waitCount: crawlStats.wait,
      isComplete: crawl.isComplete(),
    },
    isProvisional: !isComplete,
    planSummary: {
      estimatedCalls: plan.estimatedCalls,
      scheduledWork: plan.scheduledWork.length,
      totalRefreshNeeded: plan.totalRefreshWork,
    },
    telemetry: {
      passId,
      startedAt,
      completedAt: new Date().toISOString(),
      universe: {
        id: plannerConfig.provider + ":" + plannerConfig.environment,
        version: "yahoo-496-v1",
        totalSymbols: symbols.length,
      },
      generation: {
        id: crawl.current()?.id ?? null,
        cursorBefore,
        cursorAfter: crawl.current()?.cursor ?? 0,
        coveredBefore: statsBefore.evaluated,
        coveredAfter: crawlStats.evaluated,
        remaining: symbols.length - totalCovered,
        status: coverageStatus,
      },
      pass: {
        selectedSymbols: plan.scheduledWork.map((w) => w.symbol),
        completedSymbols: [...new Set(completedSymbols)],
        deferredSymbols: symbols.filter((s) => {
          const p = plan.symbolPlans.get(s);
          return p && (p.status === "MISSING" || p.status === "STALE_REQUIRES_REFRESH") && !completedSymbols.includes(s);
        }).slice(0, 20),
        errors: errorSymbols,
      },
      cache: {
        l1MemoryHits: (providerAny.memoryHits ?? 0) - baselineMemory,
        l2IndexedDBHits: (providerAny.durableHits ?? 0) - baselineDurable,
        networkFetches: (providerAny.networkCalls ?? 0) - baselineNetwork,
        staleHits: staleUsableCount,
        indexedDBWrites,
      },
      provider: {
        expirationCalls,
        chainCalls,
        quoteCalls,
        failures: providerFailures,
        rateLimitDeferrals: 0,
      },
    },
  };
}

// --- Per-Symbol Evaluation from Cache ---

interface CachedEvalResult {
  bestCandidate: PutCandidate | null;
  status: "fresh" | "stale";
}

async function evaluateSymbolFromCache(
  symbol: string,
  deployableCash: number,
  cache: DurableMarketCache,
  plannerConfig: ScanPlannerConfig,
  scanConfig: ScanConfig
): Promise<CachedEvalResult | null> {
  // Check product structure
  const structure = inferProductStructure(symbol, "");
  if (hasStructuralComplexity(structure)) return { bestCandidate: null, status: "fresh" };

  // Get expirations from cache
  const expKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "expirations", symbol);
  const expRecord = await cache.get<Expiration[]>(expKey);
  if (!expRecord) return null;

  const freshness = cache.freshness(expRecord);
  if (freshness === "expired" || freshness === "missing") return null;

  const expirations = expRecord.payload;
  const eligible = selectEligibleExpirations(expirations, scanConfig.dteRange);
  if (eligible.length === 0) return { bestCandidate: null, status: freshness === "fresh" ? "fresh" : "stale" };

  // Evaluate chains from cache
  let bestActionable: PutCandidate | null = null;
  let bestEdge: PutCandidate | null = null;
  let bestWait: PutCandidate | null = null;

  for (const exp of eligible) {
    interface CachedPut { type: string; strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }
    const chainKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "chain", symbol, exp.date);
    const chainRecord = await cache.get<{ puts: CachedPut[] }>(chainKey);
    if (!chainRecord) continue;

    const chainFreshness = cache.freshness(chainRecord);
    if (chainFreshness === "expired" || chainFreshness === "missing") continue;

    const puts: CachedPut[] = chainRecord.payload.puts ?? [];

    // Evaluate all puts in delta range
    const inRange = puts.filter((c) =>
      c.bid > 0 &&
      c.delta !== 0 &&
      Math.abs(c.delta) >= scanConfig.deltaRange.min &&
      Math.abs(c.delta) <= scanConfig.deltaRange.max
    );

    for (const contract of inRange) {
      const mid = midPrice(contract.bid, contract.ask);
      const spread = contract.ask - contract.bid;
      const spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
      const cashRequired = contract.strike * 100;

      if (cashRequired > deployableCash) continue;

      const evidence: ContractEvidence = {
        bid: contract.bid,
        ask: contract.ask,
        spreadPercent: spreadPct,
        openInterest: contract.openInterest,
        volume: contract.volume,
        delta: contract.delta,
      };

      if (isHardNo(evidence, scanConfig.executionPolicy)) continue;

      const assessment = assessExecution(evidence, scanConfig.executionPolicy);
      const yieldAnnualized = spreadPct <= scanConfig.executionPolicy.preferredSpreadPercent * 2
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
        affordable: cashRequired <= deployableCash,
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
  }

  const best = bestActionable ?? bestEdge ?? bestWait ?? null;
  return { bestCandidate: best, status: freshness === "fresh" ? "fresh" : "stale" };
}

// --- Ranking ---

const POSTURE_ORDER: Record<ActionPosture, number> = {
  ACTIONABLE: 0,
  EDGE: 1,
  WAIT: 2,
  UNAVAILABLE: 3,
  DATA_INCOMPLETE: 4,
};

function rankCandidates(candidates: PutCandidate[]): PutCandidate[] {
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
