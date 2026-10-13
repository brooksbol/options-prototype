/**
 * use-market-metrics — read-only per-underlying volatility metrics for the
 * Deployment tables (tastytrade /market-metrics via the backend).
 *
 * Fetches `GET /api/evidence/market-metrics?symbol=...` for the given underlying
 * symbols and returns a symbol → MarketMetrics map.
 *
 * BOUNDARIES (deliberate, interim v1):
 *   - OBSERVATIONAL ONLY. These metrics are attached to candidates for display
 *     and CSV export; they are NEVER inputs to recommendation eligibility,
 *     posture, ranking, capital, or execution. The Decision Engine does not read
 *     them.
 *   - Read/capture, not refresh of chain evidence. This path is independent of
 *     Tradier acquisition and the frozen snapshot-v1 contract.
 *   - Symbols with no provider coverage are simply absent from the map; the
 *     consumer renders "—" (honest unavailability), never a fabricated value.
 *   - Freshness the operator sees is governed by each metric's `ivUpdatedAt`
 *     provider timestamp, not by request success. The backend holds a short cache
 *     and preserves prior observations on a failed upstream refresh.
 *
 * Metrics change on a slow (daily-ish) cadence, so this polls infrequently and
 * relies on the backend cache to suppress upstream traffic.
 */

import { useEffect, useState } from "react";
import { indexBySymbol, parseMarketMetrics, type MarketMetrics } from "./market-metrics";

export type MarketMetricsMap = ReadonlyMap<string, MarketMetrics>;

const CHUNK_SIZE = 100;
const POLL_MS = 5 * 60_000; // slow metric; backend caches ~10 min

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchMetricsChunk(symbols: string[], signal: AbortSignal): Promise<Map<string, MarketMetrics>> {
  const params = symbols.map((s) => `symbol=${encodeURIComponent(s)}`).join("&");
  const res = await fetch(`/api/evidence/market-metrics?${params}`, { signal });
  const out = new Map<string, MarketMetrics>();
  if (!res.ok) return out;
  const data = await res.json();
  const metrics: MarketMetrics[] = (data.metrics ?? []).map((m: Record<string, unknown>) => parseMarketMetrics(m));
  for (const [k, v] of indexBySymbol(metrics)) out.set(k, v);
  return out;
}

/**
 * Poll read-only market metrics for `symbols`. Returns a map keyed by uppercase
 * symbol. `enabled=false` (e.g. demo mode) yields an empty map and makes no
 * requests. Keeps the last good map on transient errors.
 */
export function useMarketMetrics(symbols: readonly string[], enabled = true): MarketMetricsMap {
  const [metrics, setMetrics] = useState<MarketMetricsMap>(() => new Map());

  // Content-stable key: only re-run when the (sorted, de-duped) symbol SET changes.
  const symbolKey = Array.from(new Set(symbols.map((s) => s.toUpperCase()))).sort().join(",");

  useEffect(() => {
    if (!enabled || symbolKey.length === 0) {
      setMetrics(new Map());
      return;
    }
    const uniqueSymbols = symbolKey.split(",");
    const controller = new AbortController();
    let cancelled = false;

    async function pollAll() {
      try {
        const chunks = chunk(uniqueSymbols, CHUNK_SIZE);
        const results = await Promise.all(
          chunks.map((c) => fetchMetricsChunk(c, controller.signal).catch(() => new Map<string, MarketMetrics>())),
        );
        if (cancelled) return;
        const merged = new Map<string, MarketMetrics>();
        for (const r of results) for (const [k, v] of r) merged.set(k, v);
        setMetrics(merged);
      } catch {
        // keep last good map
      }
    }

    void pollAll();
    const id = setInterval(() => void pollAll(), POLL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey, enabled]);

  return metrics;
}
