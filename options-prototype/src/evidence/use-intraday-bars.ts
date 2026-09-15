/**
 * useIntradayBars — fetches intraday timesales bars (close + time) for a set of
 * underlyings from the evidence appliance (GET /api/evidence/timesales).
 *
 * These drive HIGH-RESOLUTION moneyness sparklines on the Operator Console: the
 * strike is fixed, so the only time-varying input is spot, and one timesales call
 * returns a full session of 5-min bars (a dense curve) instead of the sparse
 * spot_history accumulated one point per chain acquisition.
 *
 * Evidence-appliance-sourced: the browser makes NO provider calls; the backend
 * fetches through the active provider authority + pacer with a short server-side
 * cache. This hook only reads the backend endpoint. Returns an empty series for a
 * symbol with no data (off-hours / provider) — never fabricated.
 *
 * Lifecycle mirrors useSpotHistory: fetch on symbol-set change and when the
 * evidence generation advances; preserve last-known bars on network error.
 */

import { useState, useEffect, useRef } from "react";

export interface IntradayBar {
  close: number;
  time: string; // ISO
}

export type IntradayBarsMap = ReadonlyMap<string, IntradayBar[]>;

const EMPTY_MAP: IntradayBarsMap = new Map();

export function useIntradayBars(symbols: string[], enabled: boolean, generation: number | null): IntradayBarsMap {
  const [bars, setBars] = useState<IntradayBarsMap>(EMPTY_MAP);
  const lastGenRef = useRef<number | null>(null);
  const lastSymbolKeyRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setBars(EMPTY_MAP);
      return;
    }

    const symbolKey = symbols.join(",");
    const genChanged = generation !== lastGenRef.current;
    const symbolsChanged = symbolKey !== lastSymbolKeyRef.current;
    if (!genChanged && !symbolsChanged) return;

    let cancelled = false;

    async function fetchBars() {
      try {
        const params = symbols.map((s) => `symbol=${encodeURIComponent(s)}`).join("&");
        const res = await fetch(`/api/evidence/timesales?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        const map = new Map<string, IntradayBar[]>();
        if (data.series) {
          for (const [sym, arr] of Object.entries(data.series)) {
            map.set(sym, arr as IntradayBar[]);
          }
        }
        setBars(map);
        // Advance refs only AFTER a successful fetch (same cancellation-safety
        // rationale as useSpotHistory: a cancelled run must not suppress the next).
        lastGenRef.current = generation;
        lastSymbolKeyRef.current = symbolKey;
      } catch {
        // Network error — preserve last known bars rather than clearing.
      }
    }

    fetchBars();
    return () => { cancelled = true; };
  }, [symbols, enabled, generation]);

  return bars;
}
