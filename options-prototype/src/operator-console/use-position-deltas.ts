/**
 * usePositionDeltas — looks up current delta for monitored positions from cached chain evidence.
 *
 * Delta is extracted from the DurableMarketCache chain records by matching
 * each position's symbol + expiration + strike against the cached chain's
 * puts/calls array.
 *
 * Returns a Map<positionId, number | null> where null means delta is unavailable
 * (no cached chain, contract not found, or chain too old).
 *
 * Sign convention:
 *   - Puts: delta is negative from provider (e.g., -0.30). We store absolute value.
 *   - Calls: delta is positive from provider (e.g., 0.30). Stored as-is.
 *   The returned value is always the ABSOLUTE delta (0.00–1.00).
 */

import { useState, useEffect } from "react";
import { getDurableCache, buildCacheKey } from "../cache/durable-cache";
import type { MonitoredPosition } from "../portfolio/position-monitoring";

export type PositionDeltaMap = ReadonlyMap<string, number | null>;

const EMPTY_MAP: PositionDeltaMap = new Map();

interface ChainPayload {
  puts?: Array<{ strike: number; delta: number }>;
  calls?: Array<{ strike: number; delta: number }>;
}

/**
 * Look up current delta for each monitored position from cached chain evidence.
 *
 * @param positions - current monitored positions
 * @param generation - evidence generation (triggers re-lookup when evidence advances)
 */
export function usePositionDeltas(
  positions: MonitoredPosition[],
  generation: number | null,
): PositionDeltaMap {
  const [deltas, setDeltas] = useState<PositionDeltaMap>(EMPTY_MAP);

  useEffect(() => {
    if (positions.length === 0) {
      setDeltas(EMPTY_MAP);
      return;
    }

    let cancelled = false;

    async function lookup() {
      const cache = getDurableCache();
      const result = new Map<string, number | null>();

      for (const pos of positions) {
        const key = buildCacheKey("tradier", "sandbox", "chain", pos.underlying, pos.expiration);
        const record = await cache.get(key);

        if (!record || !record.payload) {
          result.set(pos.id, null);
          continue;
        }

        const chain = record.payload as ChainPayload;
        const contracts = pos.type === "put" ? chain.puts : chain.calls;

        if (!contracts || contracts.length === 0) {
          result.set(pos.id, null);
          continue;
        }

        // Find the contract matching this position's strike
        const match = contracts.find(c => c.strike === pos.strike);
        if (!match || match.delta === 0) {
          result.set(pos.id, null);
          continue;
        }

        // Return absolute delta
        result.set(pos.id, Math.abs(match.delta));
      }

      if (!cancelled) {
        setDeltas(result);
      }
    }

    lookup();

    return () => { cancelled = true; };
  }, [positions, generation]);

  return deltas;
}
