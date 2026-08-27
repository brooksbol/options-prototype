/**
 * Kreature Observation Derivation — dedup raw spot_history into observation moments
 * and derive contract-relative moneyness.
 *
 * EPISTEMIC STATUS:
 *   The 30-second clustering rule is a PROVISIONAL DEDUP HEURISTIC, not authoritative
 *   observation provenance. spot_history records "evidence encountered during chain
 *   acquisition" — one INSERT per setChain/setChainForExpiration call. Multi-expiration
 *   acquisition produces multiple rows per acquisition cycle with identical prices.
 *   This module collapses those into representative observation moments using a
 *   time-proximity heuristic. If the heuristic ever produces incorrect groupings,
 *   that is evidence that PL-EVID-01 should resolve observation identity at the
 *   persistence layer.
 *
 * Moneyness formula (canonical, matches position-monitoring.ts):
 *   Put:  (strike - spot) / strike
 *   Call: (spot - strike) / strike
 *   Positive = ITM, Negative = OTM
 */

import type { SpotObservation } from "../evidence/use-spot-history";
import type { MonitoredPosition } from "../portfolio/position-monitoring";

// --- Types ---

/** A single deduplicated observation moment for one underlying */
export interface ObservationMoment {
  /** Underlying symbol */
  symbol: string;
  /** Observed spot price (from first row in the cluster) */
  price: number;
  /** Timestamp of the observation moment (earliest in cluster) */
  observedAt: string;
  /** Contract contexts derived from this observation */
  contracts: ContractContext[];
}

/** Contract-relative interpretation of one underlying observation */
export interface ContractContext {
  /** Position identifier */
  positionId: string;
  /** Strike price */
  strike: number;
  /** Option type */
  type: "put" | "call" | "buy-write";
  /** Expiration date */
  expiration: string;
  /** Signed moneyness: positive = ITM, negative = OTM */
  moneyness: number;
  /** Formatted moneyness string (e.g., "3.7% OTM") */
  moneynessLabel: string;
}

/** Accumulated envelope for The Notebook — one per position */
export interface PositionEnvelope {
  /** Position identifier */
  positionId: string;
  /** Underlying symbol */
  underlying: string;
  /** Strike price */
  strike: number;
  /** Option type */
  type: "put" | "call" | "buy-write";
  /** Expiration date */
  expiration: string;
  /** Number of distinct observation moments */
  momentCount: number;
  /** Timestamp of first observation moment */
  firstObservedAt: string | null;
  /** Timestamp of latest observation moment */
  latestObservedAt: string | null;
  /** Moneyness at first observation */
  firstMoneyness: number | null;
  /** Moneyness at latest observation */
  latestMoneyness: number | null;
  /** Minimum moneyness observed (closest to or deepest ITM) */
  minMoneyness: number | null;
  /** Maximum moneyness observed (farthest OTM) */
  maxMoneyness: number | null;
  /** Formatted range label */
  rangeLabel: string;
  /** Formatted latest moneyness */
  latestLabel: string;
}

// --- Constants ---

/**
 * PROVISIONAL HEURISTIC: observations within this window (ms) for the same symbol
 * are considered part of the same acquisition cycle. 30 seconds is generous —
 * typical multi-expiration writes complete in <10 seconds.
 */
const DEDUP_WINDOW_MS = 30_000;

// --- Public API ---

/**
 * Collapse raw spot observations into deduplicated observation moments,
 * enriched with contract-relative moneyness for all matching positions.
 *
 * Returns moments in chronological order (oldest first).
 */
export function deriveObservationMoments(
  spotHistory: ReadonlyMap<string, SpotObservation[]>,
  positions: MonitoredPosition[]
): ObservationMoment[] {
  const moments: ObservationMoment[] = [];

  // Build lookup: underlying → positions on that underlying
  const positionsByUnderlying = new Map<string, MonitoredPosition[]>();
  for (const pos of positions) {
    const key = pos.underlying.toUpperCase();
    const list = positionsByUnderlying.get(key) || [];
    list.push(pos);
    positionsByUnderlying.set(key, list);
  }

  for (const [symbol, observations] of spotHistory) {
    const relatedPositions = positionsByUnderlying.get(symbol.toUpperCase());
    if (!relatedPositions || relatedPositions.length === 0) continue;

    // Dedup into moments
    const dedupedObs = deduplicateObservations(observations);

    for (const obs of dedupedObs) {
      const contracts: ContractContext[] = relatedPositions.map(pos => {
        const moneyness = computeMoneyness(obs.price, pos.strike, pos.type);
        return {
          positionId: pos.id,
          strike: pos.strike,
          type: pos.type,
          expiration: pos.expiration,
          moneyness,
          moneynessLabel: formatMoneyness(moneyness),
        };
      });

      moments.push({
        symbol: symbol.toUpperCase(),
        price: obs.price,
        observedAt: obs.observedAt,
        contracts,
      });
    }
  }

  // Sort chronologically
  moments.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  return moments;
}

/**
 * Derive per-position observation envelopes for The Notebook.
 * One envelope per monitored position showing the observed moneyness range.
 */
export function derivePositionEnvelopes(
  spotHistory: ReadonlyMap<string, SpotObservation[]>,
  positions: MonitoredPosition[]
): PositionEnvelope[] {
  return positions.map(pos => {
    const observations = spotHistory.get(pos.underlying.toUpperCase()) || [];
    const dedupedObs = deduplicateObservations(observations);

    if (dedupedObs.length === 0) {
      return {
        positionId: pos.id,
        underlying: pos.underlying,
        strike: pos.strike,
        type: pos.type,
        expiration: pos.expiration,
        momentCount: 0,
        firstObservedAt: null,
        latestObservedAt: null,
        firstMoneyness: null,
        latestMoneyness: null,
        minMoneyness: null,
        maxMoneyness: null,
        rangeLabel: "—",
        latestLabel: "—",
      };
    }

    const moneynesses = dedupedObs.map(o => computeMoneyness(o.price, pos.strike, pos.type));
    const firstMoneyness = moneynesses[0];
    const latestMoneyness = moneynesses[moneynesses.length - 1];
    const minMoneyness = Math.min(...moneynesses);
    const maxMoneyness = Math.max(...moneynesses);

    return {
      positionId: pos.id,
      underlying: pos.underlying,
      strike: pos.strike,
      type: pos.type,
      expiration: pos.expiration,
      momentCount: dedupedObs.length,
      firstObservedAt: dedupedObs[0].observedAt,
      latestObservedAt: dedupedObs[dedupedObs.length - 1].observedAt,
      firstMoneyness,
      latestMoneyness,
      minMoneyness,
      maxMoneyness,
      rangeLabel: formatMoneynessRange(minMoneyness, maxMoneyness),
      latestLabel: formatMoneyness(latestMoneyness),
    };
  });
}

// --- Internal ---

/**
 * PROVISIONAL HEURISTIC: collapse observations within DEDUP_WINDOW_MS
 * into a single representative observation (first in cluster).
 *
 * Assumes input is sorted chronologically ascending (as returned by the history API).
 *
 * Exported so the Operator Console sparkline path reasons in genuine observation
 * moments rather than raw spot_history rows (multi-expiration acquisition writes
 * one identical row per eligible expiration per cycle). Shared with Kreature so
 * both consumers apply identical temporal dedup semantics.
 */
export function deduplicateObservations(observations: SpotObservation[]): SpotObservation[] {
  if (observations.length === 0) return [];

  const result: SpotObservation[] = [];
  let clusterStart = observations[0];
  result.push(clusterStart);

  for (let i = 1; i < observations.length; i++) {
    const obs = observations[i];
    const gap = new Date(obs.observedAt).getTime() - new Date(clusterStart.observedAt).getTime();

    if (gap > DEDUP_WINDOW_MS) {
      // New cluster
      clusterStart = obs;
      result.push(obs);
    }
    // Otherwise: same cluster, skip (multi-expiration duplicate)
  }

  return result;
}

/**
 * Canonical moneyness formula (matches position-monitoring.ts).
 * Put:  (strike - spot) / strike  → positive = ITM
 * Call: (spot - strike) / strike  → positive = ITM
 */
function computeMoneyness(spot: number, strike: number, type: "put" | "call" | "buy-write"): number {
  if (strike <= 0) return 0;
  if (type === "put") {
    return (strike - spot) / strike;
  }
  // Call and buy-write use call convention
  return (spot - strike) / strike;
}

/**
 * Format moneyness as a human-readable label.
 * Examples: "3.7% OTM", "1.2% ITM", "ATM"
 */
function formatMoneyness(moneyness: number): string {
  const pct = Math.abs(moneyness * 100);
  if (pct < 0.05) return "ATM";
  const direction = moneyness > 0 ? "ITM" : "OTM";
  return `${pct.toFixed(1)}% ${direction}`;
}

/**
 * Format a moneyness range as a compact label.
 * Shows the range from closest-to-strike to farthest-from-strike in moneyness terms.
 */
function formatMoneynessRange(min: number, max: number): string {
  if (min === max) return formatMoneyness(min);

  // Both on same side of strike
  if (min >= 0 && max >= 0) {
    // Both ITM (or ATM)
    const lowPct = Math.abs(min * 100);
    const highPct = Math.abs(max * 100);
    if (lowPct < 0.05 && highPct < 0.05) return "ATM";
    return `${lowPct.toFixed(1)}–${highPct.toFixed(1)}% ITM`;
  }
  if (min <= 0 && max <= 0) {
    // Both OTM
    const nearPct = Math.abs(max * 100); // max is closer to 0 = closer to strike
    const farPct = Math.abs(min * 100);  // min is more negative = farther OTM
    return `${nearPct.toFixed(1)}–${farPct.toFixed(1)}% OTM`;
  }

  // Crosses strike: min is most OTM, max is most ITM
  const otmPct = Math.abs(min * 100);
  const itmPct = Math.abs(max * 100);
  return `${otmPct.toFixed(1)}% OTM – ${itmPct.toFixed(1)}% ITM`;
}

/**
 * Format an ISO timestamp to local ET time (HH:MM).
 * Uses the same ET approximation as the rest of Wheelwright.
 */
export function formatTimeET(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  // Convert UTC to approximate ET (EDT = UTC-4)
  const etMs = date.getTime() - 4 * 60 * 60 * 1000;
  const etDate = new Date(etMs);
  const hours = etDate.getUTCHours();
  const minutes = etDate.getUTCMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Format an ISO timestamp to ET time with seconds (HH:MM:SS).
 */
export function formatTimeETWithSeconds(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const etMs = date.getTime() - 4 * 60 * 60 * 1000;
  const etDate = new Date(etMs);
  const hours = etDate.getUTCHours();
  const minutes = etDate.getUTCMinutes();
  const seconds = etDate.getUTCSeconds();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format observation window as compact provenance string.
 * Example: "18 · 09:47–13:55 ET"
 */
export function formatObservationWindow(
  momentCount: number,
  firstObservedAt: string | null,
  latestObservedAt: string | null
): string {
  if (momentCount === 0 || !firstObservedAt || !latestObservedAt) {
    return "—";
  }
  const first = formatTimeET(firstObservedAt);
  const latest = formatTimeET(latestObservedAt);
  if (first === latest) {
    return `${momentCount} · ${first} ET`;
  }
  return `${momentCount} · ${first}–${latest} ET`;
}
