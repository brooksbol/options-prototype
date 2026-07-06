/**
 * Massive (formerly Polygon.io) API client — spike quality.
 *
 * Fetches options chain snapshot for a given underlying.
 * Maps the vendor response into canonical domain types.
 *
 * This is a bounded exploration spike, not a production provider.
 * It validates the translation boundary between Massive's schema
 * and our canonical OptionContract[].
 */

import type {
  OptionContract,
  OptionsChain,
} from "../../domain/types";

// --- Massive API Response Types (partial, spike-quality) ---

interface MassiveGreeks {
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

interface MassiveDetails {
  contract_type: "call" | "put";
  expiration_date: string;
  strike_price: number;
  ticker: string;
  shares_per_contract?: number;
  underlying_ticker?: string;
}

interface MassiveQuote {
  bid?: number;
  ask?: number;
  bid_size?: number;
  ask_size?: number;
  last_updated?: number;
  midpoint?: number;
}

interface MassiveDay {
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  vwap?: number;
}

interface MassiveUnderlyingAsset {
  price?: number;
  ticker?: string;
}

interface MassiveOptionResult {
  break_even_price?: number;
  details: MassiveDetails;
  greeks?: MassiveGreeks;
  implied_volatility?: number;
  last_quote?: MassiveQuote;
  last_trade?: { price?: number };
  day?: MassiveDay;
  open_interest?: number;
  underlying_asset?: MassiveUnderlyingAsset;
}

interface MassiveChainResponse {
  status: string;
  request_id: string;
  results?: MassiveOptionResult[];
  next_url?: string;
}

// --- Configuration ---

const API_BASE = "https://api.polygon.io";

function getApiKey(): string {
  const key = import.meta.env.VITE_MASSIVE_API_KEY;
  if (!key) {
    throw new Error(
      "VITE_MASSIVE_API_KEY is not configured. Add it to .env.local"
    );
  }
  return key;
}

// --- Fetching ---

export async function fetchOptionsChainSnapshot(
  symbol: string,
  expirationDate?: string
): Promise<MassiveChainResponse> {
  const params = new URLSearchParams({
    apiKey: getApiKey(),
    limit: "250",
  });
  if (expirationDate) {
    params.set("expiration_date", expirationDate);
  }

  const url = `${API_BASE}/v3/snapshot/options/${symbol.toUpperCase()}?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Massive API error ${response.status}: ${text.slice(0, 200)}`
    );
  }

  return response.json();
}

// --- Mapping ---

function mapContract(result: MassiveOptionResult): OptionContract | null {
  const { details, greeks, last_quote, open_interest, day } = result;

  // Require delta for our domain model
  const delta = greeks?.delta;
  if (delta === undefined || delta === null) return null;

  // Use quote bid/ask if available, otherwise derive from break_even or skip
  const bid = last_quote?.bid ?? 0;
  const ask = last_quote?.ask ?? (last_quote?.midpoint ? last_quote.midpoint * 2 - bid : 0);

  // Skip contracts with no pricing info at all
  if (bid === 0 && ask === 0) return null;

  return {
    type: details.contract_type === "call" ? "CALL" : "PUT",
    strike: details.strike_price,
    bid,
    ask: Math.max(ask, bid), // Ensure ask >= bid
    delta: details.contract_type === "call" ? delta : delta, // Keep sign as-is from API
    openInterest: open_interest ?? 0,
    volume: day?.volume ?? 0,
  };
}

export function mapChainResponse(
  response: MassiveChainResponse,
  symbol: string,
  expirationDate: string,
  underlyingPrice: number
): OptionsChain {
  const results = response.results ?? [];

  const calls: OptionContract[] = [];
  const puts: OptionContract[] = [];

  for (const result of results) {
    const contract = mapContract(result);
    if (!contract) continue;

    if (contract.type === "CALL") {
      calls.push(contract);
    } else {
      puts.push(contract);
    }
  }

  // Sort for consistency
  calls.sort((a, b) => a.strike - b.strike);
  puts.sort((a, b) => a.strike - b.strike);

  // Compute DTE
  const today = new Date();
  const expDate = new Date(expirationDate + "T00:00:00");
  const dte = Math.max(
    1,
    Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    underlying: {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: underlyingPrice,
    },
    expiration: {
      date: expirationDate,
      dte,
    },
    calls,
    puts,
  };
}

// --- Convenience: fetch + map in one call ---

export async function fetchAndMapChain(
  symbol: string,
  expirationDate?: string
): Promise<{ chain: OptionsChain; rawCount: number; mappedCount: number }> {
  const response = await fetchOptionsChainSnapshot(symbol, expirationDate);
  const results = response.results ?? [];

  // Extract underlying price from first result that has it
  let underlyingPrice = 0;
  for (const r of results) {
    if (r.underlying_asset?.price) {
      underlyingPrice = r.underlying_asset.price;
      break;
    }
  }

  // Determine expiration from data if not provided
  const effectiveExpiration =
    expirationDate ?? results[0]?.details.expiration_date ?? "unknown";

  const chain = mapChainResponse(
    response,
    symbol,
    effectiveExpiration,
    underlyingPrice
  );

  return {
    chain,
    rawCount: results.length,
    mappedCount: chain.calls.length + chain.puts.length,
  };
}
