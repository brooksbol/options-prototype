/**
 * Policy Response Curve — sweep target delta across a cached chain.
 *
 * Pure function. No provider calls. No side effects.
 * Repeatedly evaluates the same chain evidence under different policy values
 * to observe how an underlying responds to changing target delta.
 */

import type { OptionsChain } from "../domain/types";
import { findClosestToDelta } from "../domain/delta";
import { midPrice, annualizedYield } from "../domain/calculations";

/** A single point on the policy response curve. */
export interface PolicyResponsePoint {
  targetDelta: number;
  /** Call side */
  callStrike: number | null;
  callActualDelta: number | null;
  callMid: number | null;
  callYield: number | null;
  /** Put side */
  putStrike: number | null;
  putActualDelta: number | null;
  putMid: number | null;
  putYield: number | null;
  /** Capital per contract (from put strike) */
  capitalPerContract: number | null;
}

/** Standard delta sweep values. */
export const SWEEP_DELTAS = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50];

/**
 * Sweep a cached chain across multiple target deltas.
 * Returns one PolicyResponsePoint per delta value.
 *
 * Requirements:
 *   - Chain must have greeks available (otherwise delta selection is meaningless)
 *   - DTE must be > 0 for yield computation
 */
export function sweepDelta(chain: OptionsChain, dte: number): PolicyResponsePoint[] {
  const price = chain.underlying.price;
  const greeksAvailable = chain.dataQuality?.greeksAvailable ?? true;

  if (!greeksAvailable || price <= 0 || dte <= 0) {
    return SWEEP_DELTAS.map((targetDelta) => ({
      targetDelta,
      callStrike: null,
      callActualDelta: null,
      callMid: null,
      callYield: null,
      putStrike: null,
      putActualDelta: null,
      putMid: null,
      putYield: null,
      capitalPerContract: null,
    }));
  }

  return SWEEP_DELTAS.map((targetDelta) => {
    const bestCall = findClosestToDelta(chain.calls, targetDelta, "PreferOTM");
    const bestPut = findClosestToDelta(chain.puts, targetDelta, "PreferOTM");

    const callMid = bestCall ? midPrice(bestCall.bid, bestCall.ask) : null;
    const putMid = bestPut ? midPrice(bestPut.bid, bestPut.ask) : null;

    const callYield = (callMid && price > 0)
      ? annualizedYield(callMid, price, dte)
      : null;
    const putYield = (putMid && bestPut)
      ? annualizedYield(putMid, bestPut.strike, dte)
      : null;

    const capitalPerContract = bestPut ? bestPut.strike * 100 : null;

    return {
      targetDelta,
      callStrike: bestCall?.strike ?? null,
      callActualDelta: bestCall?.delta ?? null,
      callMid,
      callYield,
      putStrike: bestPut?.strike ?? null,
      putActualDelta: bestPut ? Math.abs(bestPut.delta) : null,
      putMid,
      putYield,
      capitalPerContract,
    };
  });
}
