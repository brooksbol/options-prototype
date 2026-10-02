/**
 * use-iron-condor-quotes — read-only live underlying quotes for the Iron Condors
 * table's frozen symbol set.
 *
 * Fetches `GET /api/evidence/quotes?symbol=...` for the given symbols and exposes
 * each symbol's observed underlying price + prior close. SPOT, daily CHG, and
 * CHG% are derived by the consumer from these (same math as today-gl.ts).
 *
 * BOUNDARIES (deliberate):
 *   - This is the READ-ONLY quotes path. It does NOT POST /api/evidence/observe,
 *     so it never adds acquisition demand or triggers provider calls. The Iron
 *     Condors surface is a presentation over frozen research evidence; it must
 *     not drive the appliance.
 *   - Symbols the appliance does not maintain return `not_in_universe` / null
 *     price; the consumer renders those as "—" (honest unavailability), never a
 *     fabricated value.
 *   - The underlying bid/ask (and thus underlying $ spread) and IV rank are NOT
 *     served by the appliance; they are not fetched here and remain placeholders
 *     in the table.
 *
 * The frozen symbol set is large (~1,641). The quotes endpoint accepts repeated
 * `symbol=` params; a single URL for all symbols would be ~20 KB and risk URL
 * length limits, so requests are chunked and merged.
 */

import { useEffect, useState } from "react";

export interface IronCondorQuote {
  /** Last observed underlying price. null when unobserved / not maintained. */
  price: number | null;
  /** Provider prior-session official close. null when absent. */
  previousClose: number | null;
}

export type IronCondorQuoteMap = ReadonlyMap<string, IronCondorQuote>;

const CHUNK_SIZE = 100;
const POLL_MS = 30_000;

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchQuotesChunk(symbols: string[], signal: AbortSignal): Promise<Map<string, IronCondorQuote>> {
  const params = symbols.map((s) => `symbol=${encodeURIComponent(s)}`).join("&");
  const res = await fetch(`/api/evidence/quotes?${params}`, { signal });
  const out = new Map<string, IronCondorQuote>();
  if (!res.ok) return out; // non-200 (incl. 304 for an unchanged chunk): keep prior data
  const data = await res.json();
  for (const q of data.quotes ?? []) {
    out.set(q.symbol, {
      price: q.observation?.price ?? null,
      previousClose: q.observation?.previousClose ?? null,
    });
  }
  return out;
}

/**
 * Poll read-only underlying quotes for `symbols`. Returns a map keyed by
 * uppercase symbol. `enabled=false` (e.g. demo mode) yields an empty map and
 * makes no requests.
 */
export function useIronCondorQuotes(symbols: readonly string[], enabled = true): IronCondorQuoteMap {
  const [quotes, setQuotes] = useState<IronCondorQuoteMap>(() => new Map());

  // Content-stable key so the effect only re-runs when the symbol SET changes.
  const symbolKey = symbols.join(",");

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setQuotes(new Map());
      return;
    }
    const controller = new AbortController();
    let cancelled = false;

    async function pollAll() {
      try {
        const chunks = chunk(symbols, CHUNK_SIZE);
        const results = await Promise.all(
          chunks.map((c) => fetchQuotesChunk(c, controller.signal).catch(() => new Map<string, IronCondorQuote>())),
        );
        if (cancelled) return;
        const merged = new Map<string, IronCondorQuote>();
        for (const r of results) for (const [k, v] of r) merged.set(k, v);
        // Only surface symbols that actually have an observed price; absence stays "—".
        setQuotes(merged);
      } catch {
        // Network error / abort — keep the last good map.
      }
    }

    void pollAll();
    const id = setInterval(() => void pollAll(), POLL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
    // symbolKey is the content-stable dependency for `symbols`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey, enabled]);

  return quotes;
}
