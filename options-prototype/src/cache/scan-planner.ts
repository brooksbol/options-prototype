/**
 * Scan Planner — Cache-first evidence planning for complete-universe ranking.
 *
 * Before making any provider calls, the planner inspects cached evidence
 * for every universe symbol and classifies what's needed:
 *
 * 1. FRESH — evidence within fresh TTL, rankable immediately
 * 2. STALE_USABLE — evidence past fresh but within stale TTL, provisionally rankable
 * 3. STALE_REQUIRES_REFRESH — evidence expired, needs network refresh
 * 4. MISSING — no cached evidence at all
 * 5. ERROR_RETRY_DUE — prior error whose retry window has elapsed
 * 6. CONFIRMED_ABSENCE — confirmed "no options" still within validity
 *
 * The planner produces a refresh work queue prioritized by:
 * - uncovered symbols (MISSING)
 * - stale leaders/challengers near top-20 cutoff
 * - portfolio-held symbols
 * - remaining stale symbols
 *
 * Provider calls are only made for items in the refresh queue.
 */

import { type DurableMarketCache, buildCacheKey } from "./durable-cache";
import type { CrawlStateService, PerSymbolState } from "./crawl-state";
import { selectPrimaryExpiration, DEFAULT_PRIMARY_EXPIRATION_POLICY } from "../market-session/primary-expiration-policy";
import type { Expiration } from "../domain/types";

// --- Planner Types ---

export type SymbolEvidenceStatus =
  | "FRESH"
  | "STALE_USABLE"
  | "STALE_REQUIRES_REFRESH"
  | "MISSING"
  | "ERROR_RETRY_DUE"
  | "CONFIRMED_ABSENCE";

export interface SymbolPlan {
  symbol: string;
  status: SymbolEvidenceStatus;
  /** Whether this symbol can contribute to ranking without a network call */
  rankableNow: boolean;
  /** What needs to be refreshed (empty if rankable from cache) */
  refreshNeeded: RefreshWork[];
  /** Priority reason if scheduled for this pass */
  priorityReason: string | null;
  /** Crawl state for this symbol */
  crawlState: PerSymbolState | null;
}

export type RefreshWorkType = "quote" | "expirations" | "chain";

export interface RefreshWork {
  type: RefreshWorkType;
  symbol: string;
  expiration: string | null;
  reason: string;
}

export interface ScanPlan {
  universeSize: number;
  /** Symbols rankable from cache (no network needed) */
  rankableFromCache: number;
  /** Symbols provisionally rankable from stale cache */
  provisionallyRankable: number;
  /** Symbols requiring refresh */
  requiresRefresh: number;
  /** Symbols with no evidence */
  missing: number;
  /** Symbols with confirmed absence */
  confirmedAbsence: number;
  /** Total refresh work items needed for full coverage */
  totalRefreshWork: number;
  /** Work items scheduled for this pass (within budget) */
  scheduledWork: RefreshWork[];
  /** Symbols deferred (over budget) */
  deferredCount: number;
  /** Per-symbol plan */
  symbolPlans: Map<string, SymbolPlan>;
  /** Coverage classification */
  coverageStatus: "COMPLETE" | "BUILDING" | "INCOMPLETE";
  /** Estimated provider calls for scheduled work */
  estimatedCalls: { quotes: number; expirations: number; chains: number };
}

// --- Planner Config ---

export interface ScanPlannerConfig {
  provider: string;
  environment: string;
  /** Max refresh work items per pass */
  refreshBudget: number;
  /** DTE range for chain relevance */
  dteRange: { min: number; max: number };
  /** Symbols that get priority (portfolio-held, prior leaders) */
  prioritySymbols: string[];
  /** Max batch size for quote requests */
  quoteBatchSize: number;
}

export const DEFAULT_PLANNER_CONFIG: ScanPlannerConfig = {
  provider: "tradier",
  environment: "sandbox",
  refreshBudget: 40,
  dteRange: { min: 7, max: 45 },
  prioritySymbols: [],
  quoteBatchSize: 20,
};

// --- Plan Builder ---

export async function buildScanPlan(
  symbols: string[],
  cache: DurableMarketCache,
  crawlState: CrawlStateService,
  config: ScanPlannerConfig = DEFAULT_PLANNER_CONFIG
): Promise<ScanPlan> {
  const symbolPlans = new Map<string, SymbolPlan>();
  const allRefreshWork: RefreshWork[] = [];
  let rankableFromCache = 0;
  let provisionallyRankable = 0;
  let requiresRefresh = 0;
  let missing = 0;
  let confirmedAbsence = 0;

  const gen = crawlState.current();

  for (const symbol of symbols) {
    const plan = await classifySymbol(symbol, cache, config, gen?.perSymbol[symbol] ?? null);
    symbolPlans.set(symbol, plan);

    switch (plan.status) {
      case "FRESH":
        if (plan.rankableNow) {
          rankableFromCache++;
        } else {
          // Has expirations but needs chain → count as requiring refresh
          requiresRefresh++;
          allRefreshWork.push(...plan.refreshNeeded);
        }
        break;
      case "STALE_USABLE":
        provisionallyRankable++;
        break;
      case "STALE_REQUIRES_REFRESH":
        requiresRefresh++;
        allRefreshWork.push(...plan.refreshNeeded);
        break;
      case "MISSING":
      case "ERROR_RETRY_DUE":
        missing++;
        allRefreshWork.push(...plan.refreshNeeded);
        break;
      case "CONFIRMED_ABSENCE":
        confirmedAbsence++;
        break;
    }
  }

  // Prioritize refresh work
  const prioritized = prioritizeWork(allRefreshWork, config.prioritySymbols, symbolPlans);

  // Apply budget
  const scheduledWork = prioritized.slice(0, config.refreshBudget);
  const deferredCount = Math.max(0, prioritized.length - config.refreshBudget);

  // Estimate calls
  const scheduledQuotes = new Set(scheduledWork.filter((w) => w.type === "quote").map((w) => w.symbol));
  const scheduledExpirations = scheduledWork.filter((w) => w.type === "expirations").length;
  const scheduledChains = scheduledWork.filter((w) => w.type === "chain").length;
  const quoteBatches = Math.ceil(scheduledQuotes.size / config.quoteBatchSize);

  // Coverage status
  const totalRankable = rankableFromCache + provisionallyRankable + confirmedAbsence;
  let coverageStatus: ScanPlan["coverageStatus"];
  if (totalRankable + confirmedAbsence >= symbols.length) {
    coverageStatus = "COMPLETE";
  } else if (totalRankable > 0) {
    coverageStatus = "BUILDING";
  } else {
    coverageStatus = "INCOMPLETE";
  }

  return {
    universeSize: symbols.length,
    rankableFromCache,
    provisionallyRankable,
    requiresRefresh,
    missing,
    confirmedAbsence,
    totalRefreshWork: allRefreshWork.length,
    scheduledWork,
    deferredCount,
    symbolPlans,
    coverageStatus,
    estimatedCalls: {
      quotes: quoteBatches,
      expirations: scheduledExpirations,
      chains: scheduledChains,
    },
  };
}

// --- Symbol Classification ---

async function classifySymbol(
  symbol: string,
  cache: DurableMarketCache,
  config: ScanPlannerConfig,
  crawlSymbolState: PerSymbolState | null
): Promise<SymbolPlan> {
  const expKey = buildCacheKey(config.provider, config.environment, "expirations", symbol);
  const absenceKey = buildCacheKey(config.provider, config.environment, "absence", symbol);

  // Check confirmed absence
  const absenceRecord = await cache.get(absenceKey);
  const absenceFreshness = cache.freshness(absenceRecord);
  if (absenceFreshness === "fresh" || absenceFreshness === "stale_usable") {
    return {
      symbol,
      status: "CONFIRMED_ABSENCE",
      rankableNow: false,
      refreshNeeded: [],
      priorityReason: null,
      crawlState: crawlSymbolState,
    };
  }

  // Check expirations cache
  const expRecord = await cache.get(expKey);
  const expFreshness = cache.freshness(expRecord);

  if (expFreshness === "missing" || expFreshness === "expired") {
    // Check if this is an error retry
    const errorKey = buildCacheKey(config.provider, config.environment, "error", symbol);
    const errorRecord = await cache.get(errorKey);
    const errorFreshness = cache.freshness(errorRecord);

    if (errorFreshness === "fresh") {
      // Error still within negative-cache TTL — don't retry yet
      return {
        symbol,
        status: "ERROR_RETRY_DUE",
        rankableNow: false,
        refreshNeeded: [],
        priorityReason: null,
        crawlState: crawlSymbolState,
      };
    }

    // Need expirations from network
    return {
      symbol,
      status: "MISSING",
      rankableNow: false,
      refreshNeeded: [{ type: "expirations", symbol, expiration: null, reason: "No cached expirations" }],
      priorityReason: null,
      crawlState: crawlSymbolState,
    };
  }

  // Expirations exist — check if we have chains for eligible dates
  // For planning purposes, assume at least one chain is needed
  // (detailed chain-level planning happens during execution)
  if (expFreshness === "stale_usable") {
    return {
      symbol,
      status: "STALE_USABLE",
      rankableNow: true,
      refreshNeeded: [{ type: "expirations", symbol, expiration: null, reason: "Stale expiration list" }],
      priorityReason: null,
      crawlState: crawlSymbolState,
    };
  }

  // Expirations are fresh — check if primary chain is cached
  const expPayload = expRecord!.payload as Expiration[];
  const primarySelection = selectPrimaryExpiration(expPayload, DEFAULT_PRIMARY_EXPIRATION_POLICY);

  if (primarySelection.selected) {
    const primaryChainKey = buildCacheKey(config.provider, config.environment, "chain", symbol, primarySelection.selected.date);
    const chainRecord = await cache.get(primaryChainKey);
    const chainFreshness = cache.freshness(chainRecord);

    if (chainFreshness === "missing" || chainFreshness === "expired") {
      // Has expirations but no primary chain → needs chain fetch
      return {
        symbol,
        status: "FRESH", // expirations are fresh
        rankableNow: false, // but can't rank without chain
        refreshNeeded: [{ type: "chain", symbol, expiration: primarySelection.selected.date, reason: `Primary chain needed (${primarySelection.selected.dte} DTE)` }],
        priorityReason: null,
        crawlState: crawlSymbolState,
      };
    }
  }

  // Expirations fresh AND primary chain cached → fully rankable
  return {
    symbol,
    status: "FRESH",
    rankableNow: true,
    refreshNeeded: [],
    priorityReason: null,
    crawlState: crawlSymbolState,
  };
}

// --- Priority Scheduling ---

function prioritizeWork(
  work: RefreshWork[],
  prioritySymbols: string[],
  symbolPlans: Map<string, SymbolPlan>
): RefreshWork[] {
  const prioritySet = new Set(prioritySymbols.map((s) => s.toUpperCase()));

  return [...work].sort((a, b) => {
    // 1. Priority symbols first
    const aPriority = prioritySet.has(a.symbol.toUpperCase());
    const bPriority = prioritySet.has(b.symbol.toUpperCase());
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    // 2. Missing before stale (uncovered symbols need evidence)
    const aPlan = symbolPlans.get(a.symbol);
    const bPlan = symbolPlans.get(b.symbol);
    const aIsMissing = aPlan?.status === "MISSING";
    const bIsMissing = bPlan?.status === "MISSING";
    if (aIsMissing && !bIsMissing) return -1;
    if (!aIsMissing && bIsMissing) return 1;

    // 3. Expirations before chains (cheaper, unlocks more work)
    if (a.type === "expirations" && b.type !== "expirations") return -1;
    if (a.type !== "expirations" && b.type === "expirations") return 1;

    // 4. Alphabetical deterministic tie-break
    return a.symbol.localeCompare(b.symbol);
  });
}
