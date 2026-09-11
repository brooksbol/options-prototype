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

interface ChainContract {
  strike: number;
  bid?: number;
  delta: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
}

/**
 * Whether a contract's provider greeks are trustworthy enough to display.
 *
 * Tradier returns greeks for EVERY strike including untradeable ones, and on
 * those (zero bid, no real market) its model emits non-physical values — e.g.
 * delta of 2.0 or gamma of 9.8 were observed in production data. We suppress
 * greeks (render as unavailable) rather than show nonsense when:
 *   - the contract has no real market (bid missing or <= 0), or
 *   - delta is outside its physical range [-1, 1] (a proxy for a bad greek set).
 *
 * This is a presentation-level trust gate, not a change to stored evidence.
 * Persisted facts are untouched; trust is derived here at read time.
 */
/**
 * Delta trust gate: the contract has a real market and a physically valid delta.
 * Deep ITM contracts (delta ~0.99) are legitimate and pass, even if their
 * secondary greeks happen to be degenerate.
 */
function deltaTrustworthy(c: ChainContract): boolean {
  if (c.bid == null || c.bid <= 0) return false;                 // no real market
  if (!Number.isFinite(c.delta) || Math.abs(c.delta) > 1) return false; // non-physical delta
  return true;
}

/**
 * Whether the contract has a real, tradeable market. Below this line the
 * provider's greek model degenerates entirely (delta 2.0, gamma 9.8), so we
 * publish nothing.
 */
function hasRealMarket(c: ChainContract): boolean {
  return c.bid != null && c.bid > 0;
}

/**
 * Per-greek physical ceilings. Tradier occasionally emits a single off value on
 * an otherwise-real contract (e.g. QQQ 520P: bid 0.11, delta -0.004, but gamma
 * 1.1 — theta/vega/rho all sane). Rather than discard the WHOLE greek set on one
 * odd field (which would blank legitimate data), we validate each greek on its
 * own bound and null only the individual value that is non-physical. The truly
 * degenerate rows (gamma ~1.9/3/9.8) still fail these ceilings and null out,
 * while marginally-noisy-but-real values pass. Bounds are generous — meant to
 * catch garbage, not to police model quality.
 */
const GREEK_CEILINGS = { gamma: 2, theta: 5, vega: 5, rho: 5 } as const;

function sanitizeGreek(value: number | undefined, ceiling: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) > ceiling) return null;
  return value;
}

/**
 * Whether a contract's ENTIRE greek vector is exactly zero (delta and all four
 * secondary greeks == 0). Tradier returns this placeholder set for contracts it
 * has not actually computed greeks for — including some real-bid contracts (the
 * DBO row). A genuine deep-OTM contract has tiny-but-nonzero values, never an
 * all-exact-zero vector, so an all-zero vector is an uncomputed placeholder, not
 * data. Treat it as unavailable rather than displaying a wall of 0.0000.
 */
function greekVectorAllZero(c: ChainContract): boolean {
  return c.delta === 0
    && (c.gamma ?? 0) === 0
    && (c.theta ?? 0) === 0
    && (c.vega ?? 0) === 0
    && (c.rho ?? 0) === 0;
}

interface ChainPayload {
  puts?: ChainContract[];
  calls?: ChainContract[];
}

/**
 * The four secondary greeks for a position, as reported by the provider.
 * All fields are null when the contract is not found in cached evidence, or
 * when the cached chain predates greek acquisition (older snapshots omit them).
 *
 * Sign convention: values are reported AS-IS from the provider (unlike delta,
 * which use-position-deltas returns as an absolute value for coloring). Theta
 * is typically negative (time decay); gamma/vega/rho follow provider sign.
 */
export interface PositionGreeks {
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  rho: number | null;
}

export type PositionGreeksMap = ReadonlyMap<string, PositionGreeks>;

const EMPTY_GREEKS_MAP: PositionGreeksMap = new Map();

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

  // Stable key: only re-run when the position SET changes (not reference)
  const positionKey = positions.map(p => p.id).join(",");

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
        if (!match || match.delta === 0 || !deltaTrustworthy(match)) {
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
  }, [positionKey, generation]);

  return deltas;
}

/**
 * usePositionGreeks — looks up the secondary greeks (gamma, theta, vega, rho)
 * for monitored positions from cached chain evidence.
 *
 * Mirrors usePositionDeltas' lookup mechanics (same cache key, same strike
 * matching) but returns the four secondary greeks rather than delta. Values are
 * returned AS-IS from the provider (no sign normalization). A missing chain,
 * unmatched strike, or older greek-free snapshot yields all-null greeks.
 *
 * @param positions - current monitored positions
 * @param generation - evidence generation (triggers re-lookup when evidence advances)
 */
export function usePositionGreeks(
  positions: MonitoredPosition[],
  generation: number | null,
): PositionGreeksMap {
  const [greeks, setGreeks] = useState<PositionGreeksMap>(EMPTY_GREEKS_MAP);

  const positionKey = positions.map(p => p.id).join(",");

  useEffect(() => {
    if (positions.length === 0) {
      setGreeks(EMPTY_GREEKS_MAP);
      return;
    }

    let cancelled = false;

    async function lookup() {
      const cache = getDurableCache();
      const result = new Map<string, PositionGreeks>();
      const NONE: PositionGreeks = { gamma: null, theta: null, vega: null, rho: null };

      for (const pos of positions) {
        const key = buildCacheKey("tradier", "sandbox", "chain", pos.underlying, pos.expiration);
        const record = await cache.get(key);

        if (!record || !record.payload) {
          result.set(pos.id, NONE);
          continue;
        }

        const chain = record.payload as ChainPayload;
        const contracts = pos.type === "put" ? chain.puts : chain.calls;

        if (!contracts || contracts.length === 0) {
          result.set(pos.id, NONE);
          continue;
        }

        const match = contracts.find(c => c.strike === pos.strike);
        if (!match || !hasRealMarket(match) || greekVectorAllZero(match)) {
          // No match; or no real market (Tradier's greek model degenerates on
          // zero-bid strikes); or an all-exact-zero greek vector, which is an
          // uncomputed provider placeholder even when a bid exists (DBO row) —
          // not real data. Suppress the whole set rather than show 0.0000 walls.
          result.set(pos.id, NONE);
          continue;
        }

        // Real market: publish each greek that is individually physical; null
        // only the specific value that is out of range (don't blank the row for
        // one odd field).
        result.set(pos.id, {
          gamma: sanitizeGreek(match.gamma, GREEK_CEILINGS.gamma),
          theta: sanitizeGreek(match.theta, GREEK_CEILINGS.theta),
          vega: sanitizeGreek(match.vega, GREEK_CEILINGS.vega),
          rho: sanitizeGreek(match.rho, GREEK_CEILINGS.rho),
        });
      }

      if (!cancelled) {
        setGreeks(result);
      }
    }

    lookup();

    return () => { cancelled = true; };
  }, [positionKey, generation]);

  return greeks;
}
