/**
 * Opportunity evaluation logic.
 *
 * Derives an OpportunityRow for a single symbol given provider data.
 * Pure function — no side effects, independently testable.
 *
 * Strategy:
 *   1. Fetch quote (price)
 *   2. Fetch nearest expiration
 *   3. Fetch chain for nearest expiration
 *   4. Find contract closest to target delta (call + put)
 *   5. Compute yield
 *   6. Classify opportunity status
 */

import type { MarketDataProvider } from "../domain/provider";
import type { OptionsChain } from "../domain/types";
import { findClosestToDelta } from "../domain/delta";
import { midPrice, annualizedYield } from "../domain/calculations";
import type { OpportunityRow, OpportunityPolicy, OpportunityStatus } from "./types";

/**
 * Evaluate a single symbol and produce an OpportunityRow.
 * Gracefully handles missing data (returns data_missing status).
 */
export async function evaluateSymbol(
  symbol: string,
  provider: MarketDataProvider,
  policy: OpportunityPolicy
): Promise<OpportunityRow> {
  const baseRow: OpportunityRow = {
    symbol,
    price: null,
    capitalPerContract: null,
    optionsAvailable: false,
    nearestExpiration: null,
    nearestDte: null,
    callDelta: null,
    callStrike: null,
    callMid: null,
    callYield: null,
    putDelta: null,
    putStrike: null,
    putMid: null,
    putYield: null,
    status: "data_missing",
    statusReason: "Awaiting data",
    greeksAvailable: false,
    iv: null,
    volume: null,
    dataSource: "unavailable",
  };

  try {
    // Get expirations
    const expirations = await provider.getExpirations(symbol);
    if (expirations.length === 0) {
      return { ...baseRow, statusReason: "No expirations available" };
    }

    // Select the best expiration for the policy's DTE preference.
    // If maxDte is set, find the expiration closest to it (targeting that timeframe).
    // If maxDte is null (Any), pick the nearest usable expiration.
    const usable = expirations.filter((e) => e.dte >= policy.minDte);
    let nearest: typeof expirations[0];

    if (policy.maxDte != null && usable.length > 0) {
      // Find the expiration closest to maxDte (prefer within range, but allow nearest if none in range)
      const inRange = usable.filter((e) => e.dte <= policy.maxDte!);
      if (inRange.length > 0) {
        // Pick the one closest to maxDte (i.e., the longest within range — most time value)
        nearest = inRange[inRange.length - 1];
      } else {
        // No expiration within range — fall back to the nearest usable
        nearest = usable[0];
      }
    } else {
      nearest = usable[0] ?? expirations[0];
    }

    // Get chain
    const chain = await provider.getOptionsChain(symbol, nearest.date);

    if (chain.calls.length === 0 && chain.puts.length === 0) {
      return { ...baseRow, nearestExpiration: nearest.date, nearestDte: nearest.dte, statusReason: "Empty chain returned" };
    }

    // Derive opportunity metrics
    const row = deriveOpportunityRow(symbol, chain, nearest.date, nearest.dte, policy);
    return row;
  } catch (err) {
    return { ...baseRow, statusReason: `Provider error: ${err instanceof Error ? err.message.slice(0, 80) : "unknown"}` };
  }
}

/**
 * Derive opportunity metrics from an already-fetched chain.
 * Pure function — no async, no provider calls.
 */
export function deriveOpportunityRow(
  symbol: string,
  chain: OptionsChain,
  expirationDate: string,
  dte: number,
  policy: OpportunityPolicy
): OpportunityRow {
  const price = chain.underlying.price;
  const greeksAvailable = chain.dataQuality?.greeksAvailable ?? true;
  const dataSource = chain.dataQuality?.dataSource ?? "api";

  // Find contracts closest to target delta
  const bestCall = greeksAvailable
    ? findClosestToDelta(chain.calls, policy.targetDelta, "PreferOTM")
    : null;
  const bestPut = greeksAvailable
    ? findClosestToDelta(chain.puts, policy.targetDelta, "PreferOTM")
    : null;

  // Compute metrics
  const callMid = bestCall ? midPrice(bestCall.bid, bestCall.ask) : null;
  const putMid = bestPut ? midPrice(bestPut.bid, bestPut.ask) : null;

  // Yield: call uses underlying price as collateral, put uses strike
  const callYield = (callMid && price > 0 && dte > 0)
    ? annualizedYield(callMid, price, dte)
    : null;
  const putYield = (putMid && bestPut && dte > 0)
    ? annualizedYield(putMid, bestPut.strike, dte)
    : null;

  // Capital per contract (CSP: strike × 100)
  const capitalPerContract = bestPut ? bestPut.strike * 100 : (price > 0 ? price * 100 : null);

  // Implied volatility from the target-delta contracts
  const callIv = bestCall?.iv ?? null;
  const putIv = bestPut?.iv ?? null;
  const iv = (callIv != null && putIv != null)
    ? (callIv + putIv) / 2
    : callIv ?? putIv;

  // Volume of the selected contracts
  const callVol = bestCall?.volume ?? 0;
  const putVol = bestPut?.volume ?? 0;
  const volume = (callVol + putVol) > 0 ? callVol + putVol : null;

  // Classify status
  const { status, reason } = classifyOpportunity(
    price, callYield, putYield, greeksAvailable, capitalPerContract, chain.calls.length + chain.puts.length, policy
  );

  return {
    symbol,
    price,
    capitalPerContract,
    optionsAvailable: chain.calls.length > 0 || chain.puts.length > 0,
    nearestExpiration: expirationDate,
    nearestDte: dte,
    callDelta: bestCall?.delta ?? null,
    callStrike: bestCall?.strike ?? null,
    callMid,
    callYield,
    putDelta: bestPut ? Math.abs(bestPut.delta) : null,
    putStrike: bestPut?.strike ?? null,
    putMid,
    putYield,
    status,
    statusReason: reason,
    greeksAvailable,
    iv,
    volume,
    dataSource: dataSource as "api" | "cache" | "unavailable",
  };
}

/**
 * Classify opportunity status based on available evidence and policy.
 */
function classifyOpportunity(
  price: number | null,
  callYield: number | null,
  putYield: number | null,
  greeksAvailable: boolean,
  capitalPerContract: number | null,
  contractCount: number,
  policy: OpportunityPolicy
): { status: OpportunityStatus; reason: string } {
  // No data
  if (!price || price === 0) {
    return { status: "data_missing", reason: "Price unavailable" };
  }
  if (contractCount === 0) {
    return { status: "data_missing", reason: "No options contracts available" };
  }
  if (!greeksAvailable) {
    return { status: "data_missing", reason: "Greeks unavailable — cannot evaluate delta" };
  }

  // Eligibility: capital gate
  if (policy.maxCapitalPerContract && capitalPerContract && capitalPerContract > policy.maxCapitalPerContract) {
    return { status: "ineligible", reason: `Capital per contract $${capitalPerContract.toLocaleString()} exceeds limit` };
  }

  // Opportunity assessment
  const bestYield = Math.max(callYield ?? 0, putYield ?? 0);

  if (bestYield >= policy.minYieldThreshold) {
    return { status: "interesting", reason: `Best yield ${bestYield.toFixed(1)}% exceeds ${policy.minYieldThreshold}% threshold` };
  }

  if (bestYield > 0) {
    return { status: "monitor", reason: `Best yield ${bestYield.toFixed(1)}% below ${policy.minYieldThreshold}% threshold` };
  }

  return { status: "monitor", reason: "Yield data inconclusive" };
}
