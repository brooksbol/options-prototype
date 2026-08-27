/**
 * useSpotHistory — fetches underlying-level historical spot observations from the Evidence Service.
 *
 * Returns a Map<symbol, SpotObservation[]> where each entry is the truthful
 * persisted price history for that underlying. Consumers derive per-contract
 * moneyness from this shared series using strike + option type.
 *
 * Lifecycle:
 * - Fetches on mount and when the symbol set changes.
 * - Re-fetches when evidence generation advances (piggybacks on observation-store polling).
 * - Returns empty map when no symbols are provided or source is Demo.
 * - Does not interpolate, fabricate, or cache beyond the current component lifecycle.
 */

import { useState, useEffect, useRef } from "react";

export interface SpotObservation {
  price: number;
  observedAt: string;
}

export type SpotHistoryMap = ReadonlyMap<string, SpotObservation[]>;

const EMPTY_MAP: SpotHistoryMap = new Map();

/**
 * Fetch historical spot observations for the given symbols.
 *
 * @param symbols - uppercase underlying tickers to fetch history for
 * @param enabled - set to false to skip fetching (e.g., Demo mode)
 * @param generation - evidence generation number; triggers re-fetch when it changes
 */
export function useSpotHistory(symbols: string[], enabled: boolean, generation: number | null): SpotHistoryMap {
  const [history, setHistory] = useState<SpotHistoryMap>(EMPTY_MAP);
  const lastGenRef = useRef<number | null>(null);
  const lastSymbolKeyRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setHistory(EMPTY_MAP);
      return;
    }

    const symbolKey = symbols.join(",");
    const genChanged = generation !== lastGenRef.current;
    const symbolsChanged = symbolKey !== lastSymbolKeyRef.current;

    // Only fetch if symbols changed or generation advanced.
    if (!genChanged && !symbolsChanged) return;

    // IMPORTANT: do NOT update lastGenRef / lastSymbolKeyRef here (before the fetch).
    // Doing so caused sparklines to vanish on Console remount: if this effect run was
    // cancelled by a rapid re-run (generation bumps every few seconds via polling, or a
    // new symbols array reference), the in-flight fetch was discarded — but the refs had
    // already been advanced, so the next run saw "no change" and early-returned without
    // ever completing a fetch, leaving history stuck at EMPTY_MAP. The refs are only
    // advanced AFTER a fetch actually completes, so a cancelled run never suppresses the
    // next one. (Route navigation must not make an existing sparkline disappear.)

    let cancelled = false;

    async function fetchHistory() {
      try {
        const params = symbols.map(s => `symbol=${encodeURIComponent(s)}`).join("&");
        const res = await fetch(`/api/evidence/history?${params}`);
        if (!res.ok || cancelled) return;

        const data = await res.json();
        if (cancelled) return;

        const map = new Map<string, SpotObservation[]>();
        if (data.histories) {
          for (const [sym, obs] of Object.entries(data.histories)) {
            map.set(sym, obs as SpotObservation[]);
          }
        }
        setHistory(map);
        // Mark this (symbols, generation) as satisfied only now that data is applied.
        lastGenRef.current = generation;
        lastSymbolKeyRef.current = symbolKey;
      } catch {
        // Network error — preserve last known history rather than clearing.
        // Refs intentionally left unadvanced so a later run retries this fetch.
      }
    }

    fetchHistory();

    return () => { cancelled = true; };
  }, [symbols, enabled, generation]);

  return history;
}
