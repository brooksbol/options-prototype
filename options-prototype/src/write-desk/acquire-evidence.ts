/**
 * Evidence Acquisition Service — Owns all provider communication, cache writes, and crawl state.
 *
 * SESSION GATING INVARIANT:
 * Market-sensitive acquisition (chains, quotes) is BLOCKED during:
 *   - CLOSED_CANONICAL
 *   - NON_TRADING_DAY
 *   - PREMARKET
 *   - REGULAR_OPEN_DELAY
 *
 * Market-sensitive acquisition is PERMITTED during:
 *   - REGULAR_OBSERVATION
 *   - DELAY_DRAIN
 *
 * Market-insensitive acquisition (expirations, metadata) is always permitted.
 */

import type { MarketDataProvider } from "../domain/provider";
import { getDurableCache, buildCacheKey } from "../cache/durable-cache";
import { getCrawlState } from "../cache/crawl-state";
import { buildScanPlan, type ScanPlannerConfig, DEFAULT_PLANNER_CONFIG } from "../cache/scan-planner";
import { getMarketSessionPolicy, type MarketSessionState } from "../market-session/session-policy";
import { classifyResourceSensitivity } from "../market-session/evidence-provenance";
import type { CoverageRequest } from "./recommend";

// --- Acquisition Status ---

export type AcquisitionStatus =
  | "ACQUIRED"
  | "PARTIALLY_ACQUIRED"
  | "SKIPPED_SESSION_CLOSED"
  | "SKIPPED_PREMARKET"
  | "SKIPPED_OPEN_DELAY"
  | "SKIPPED_NON_TRADING"
  | "NO_WORK_REQUIRED"
  | "FAILED";

// --- Acquisition Result ---

export interface AcquisitionResult {
  status: AcquisitionStatus;
  /** Symbols that had evidence fetched from network this pass */
  refreshedSymbols: string[];
  /** Symbols that failed during acquisition */
  errors: string[];
  /** Coverage requests that were fulfilled */
  fulfilled: CoverageRequest[];
  /** Coverage requests that could not be fulfilled (over budget, session-blocked, or failed) */
  deferred: CoverageRequest[];
  /** Session state at time of acquisition */
  sessionState: MarketSessionState;
  /** Telemetry */
  telemetry: AcquisitionTelemetry;
}

export interface AcquisitionTelemetry {
  passId: string;
  startedAt: string;
  completedAt: string;
  generation: {
    id: string | null;
    cursorBefore: number;
    cursorAfter: number;
  };
  plan: {
    totalSymbols: number;
    rankableFromCache: number;
    requiresRefresh: number;
    missing: number;
    confirmedAbsence: number;
    scheduledWork: number;
    deferredWork: number;
  };
  provider: {
    marketSensitiveRequestsPlanned: number;
    marketSensitiveRequestsExecuted: number;
    marketInsensitiveRequestsExecuted: number;
    requestsBlockedBySession: number;
    canonicalWritesAccepted: number;
    canonicalWritesRejected: number;
    failures: number;
  };
}

// --- Session Gating ---

function isMarketSensitiveAcquisitionPermitted(state: MarketSessionState): boolean {
  return state === "REGULAR_OBSERVATION" || state === "DELAY_DRAIN";
}

function skippedStatusForState(state: MarketSessionState): AcquisitionStatus {
  switch (state) {
    case "CLOSED_CANONICAL": return "SKIPPED_SESSION_CLOSED";
    case "NON_TRADING_DAY": return "SKIPPED_NON_TRADING";
    case "PREMARKET": return "SKIPPED_PREMARKET";
    case "REGULAR_OPEN_DELAY": return "SKIPPED_OPEN_DELAY";
    default: return "SKIPPED_SESSION_CLOSED";
  }
}

// --- Acquisition Service ---

export async function acquireEvidence(
  symbols: string[],
  provider: MarketDataProvider,
  plannerConfig: ScanPlannerConfig = DEFAULT_PLANNER_CONFIG,
  explicitRequests: CoverageRequest[] = [],
  onProgress?: (phase: string, done: number, total: number) => void
): Promise<AcquisitionResult> {
  const cache = getDurableCache();
  const crawl = getCrawlState();
  const sessionPolicy = getMarketSessionPolicy();
  const sessionClassification = sessionPolicy.classify(new Date());
  const passId = `acq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = new Date().toISOString();

  const marketSensitivePermitted = isMarketSensitiveAcquisitionPermitted(sessionClassification.state);

  // Telemetry
  let marketSensitivePlanned = 0;
  let marketSensitiveExecuted = 0;
  let marketInsensitiveExecuted = 0;
  let blockedBySession = 0;
  let canonicalWritesAccepted = 0;
  let canonicalWritesRejected = 0;
  let failures = 0;
  const refreshedSymbols: string[] = [];
  const errorSymbols: string[] = [];
  const fulfilled: CoverageRequest[] = [];
  const deferred: CoverageRequest[] = [];

  // 1. Ensure crawl generation
  await crawl.ensureGeneration(
    plannerConfig.provider + ":" + plannerConfig.environment,
    "yahoo-496-v1",
    symbols
  );
  const cursorBefore = crawl.current()?.cursor ?? 0;

  // 2. Build scan plan
  onProgress?.("planning", 0, symbols.length);
  const plan = await buildScanPlan(symbols, cache, crawl, plannerConfig);

  // 3. Merge explicit coverage requests
  const scheduledKeys = new Set(plan.scheduledWork.map((w) => `${w.symbol}:${w.type}:${w.expiration ?? ""}`));
  const additionalWork: typeof plan.scheduledWork = [];

  for (const req of explicitRequests) {
    const key = `${req.symbol}:${req.expiration ? "chain" : "expirations"}:${req.expiration ?? ""}`;
    if (!scheduledKeys.has(key)) {
      additionalWork.push({
        type: req.expiration ? "chain" : "expirations",
        symbol: req.symbol,
        expiration: req.expiration,
        reason: req.reason,
      });
    }
  }

  const allWork = [...additionalWork, ...plan.scheduledWork].slice(0, plannerConfig.refreshBudget);

  // 4. Execute work — applying session gate per resource type
  let completed = 0;
  for (const work of allWork) {
    onProgress?.("acquiring", completed, allWork.length);
    const sensitivity = classifyResourceSensitivity(work.type);

    if (sensitivity === "session_sensitive" && !marketSensitivePermitted) {
      // Block market-sensitive work during closed/non-trading states
      marketSensitivePlanned++;
      blockedBySession++;
      deferred.push({ symbol: work.symbol, expiration: work.expiration, reason: `Blocked: session ${sessionClassification.state}`, priority: "medium" });
      continue;
    }

    if (sensitivity === "session_sensitive") {
      marketSensitivePlanned++;
    }

    try {
      if (work.type === "expirations") {
        marketInsensitiveExecuted++;
        const expirations = await provider.getExpirations(work.symbol);
        const key = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "expirations", work.symbol);
        if (expirations.length === 0) {
          const absKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "absence", work.symbol);
          await cache.put(cache.createRecord(absKey, "absence", plannerConfig.provider, plannerConfig.environment, work.symbol, null, { reason: "no expirations" }));
        } else {
          await cache.put(cache.createRecord(key, "expirations", plannerConfig.provider, plannerConfig.environment, work.symbol, null, expirations));
        }
        canonicalWritesAccepted++;
        refreshedSymbols.push(work.symbol);

        const matchedReq = explicitRequests.find((r) => r.symbol === work.symbol && !r.expiration);
        if (matchedReq) fulfilled.push(matchedReq);

      } else if (work.type === "chain" && work.expiration) {
        marketSensitiveExecuted++;
        const chain = await provider.getOptionsChain(work.symbol, work.expiration);
        const key = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "chain", work.symbol, work.expiration);
        await cache.put(cache.createRecord(key, "chain", plannerConfig.provider, plannerConfig.environment, work.symbol, work.expiration, chain));
        canonicalWritesAccepted++;
        refreshedSymbols.push(work.symbol);

        const matchedReq = explicitRequests.find((r) => r.symbol === work.symbol && r.expiration === work.expiration);
        if (matchedReq) fulfilled.push(matchedReq);
      }
      completed++;
    } catch (err) {
      failures++;
      errorSymbols.push(work.symbol);
      const errKey = buildCacheKey(plannerConfig.provider, plannerConfig.environment, "error", work.symbol);
      await cache.put(cache.createRecord(errKey, "error", plannerConfig.provider, plannerConfig.environment, work.symbol, null, { message: String(err) }));
    }
  }

  // Defer unfulfilled explicit requests
  const deferredExplicit = explicitRequests.filter((req) => {
    return !fulfilled.some((f) => f.symbol === req.symbol && f.expiration === req.expiration);
  });
  for (const d of deferredExplicit) {
    if (!deferred.some((existing) => existing.symbol === d.symbol && existing.expiration === d.expiration)) {
      deferred.push(d);
    }
  }

  // 5. Advance crawl cursor (only if not already complete and work was done)
  if (!crawl.isComplete() && completed > 0) {
    const oldCursor = crawl.current()?.cursor ?? 0;
    crawl.advanceCursor(Math.min(oldCursor + completed, symbols.length));
  }
  await crawl.save();

  const cursorAfter = crawl.current()?.cursor ?? 0;

  // Determine status
  let status: AcquisitionStatus;
  if (!marketSensitivePermitted && marketSensitivePlanned > 0) {
    status = skippedStatusForState(sessionClassification.state);
  } else if (failures > 0 && completed === 0) {
    status = "FAILED";
  } else if (allWork.length === 0) {
    status = "NO_WORK_REQUIRED";
  } else if (blockedBySession > 0) {
    status = "PARTIALLY_ACQUIRED";
  } else {
    status = "ACQUIRED";
  }

  return {
    status,
    refreshedSymbols: [...new Set(refreshedSymbols)],
    errors: errorSymbols,
    fulfilled,
    deferred,
    sessionState: sessionClassification.state,
    telemetry: {
      passId,
      startedAt,
      completedAt: new Date().toISOString(),
      generation: { id: crawl.current()?.id ?? null, cursorBefore, cursorAfter },
      plan: {
        totalSymbols: symbols.length,
        rankableFromCache: plan.rankableFromCache,
        requiresRefresh: plan.requiresRefresh,
        missing: plan.missing,
        confirmedAbsence: plan.confirmedAbsence,
        scheduledWork: allWork.length,
        deferredWork: plan.deferredCount + deferred.length,
      },
      provider: {
        marketSensitiveRequestsPlanned: marketSensitivePlanned,
        marketSensitiveRequestsExecuted: marketSensitiveExecuted,
        marketInsensitiveRequestsExecuted: marketInsensitiveExecuted,
        requestsBlockedBySession: blockedBySession,
        canonicalWritesAccepted,
        canonicalWritesRejected,
        failures,
      },
    },
  };
}
