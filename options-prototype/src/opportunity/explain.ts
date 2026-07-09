/**
 * Opportunity evidence explanation.
 *
 * Pure function that decomposes an OpportunityRow into human-readable
 * evidence explaining why the numbers look the way they do.
 *
 * No provider calls, no side effects, independently testable.
 */

import type { OpportunityRow } from "./types";

export interface YieldExplanation {
  /** Premium received per contract (mid × 100) */
  premiumPerContract: number;
  /** Collateral used in the yield calculation */
  collateral: number;
  /** Raw yield before annualization (premium / collateral) */
  rawYield: number;
  /** Annualization multiplier (365 / DTE) */
  annualizationMultiplier: number;
  /** Final annualized yield */
  annualizedYield: number;
  /** The delta of the selected contract */
  delta: number | null;
  /** The mid price of the selected contract */
  mid: number | null;
  /** Strike of the selected contract (inferred from collateral for puts) */
  strike: number | null;
  /** IV if available */
  iv: number | null;
}

export interface OpportunityExplanation {
  symbol: string;
  price: number | null;

  /** Call-side decomposition (null if no call data) */
  call: YieldExplanation | null;

  /** Put-side decomposition (null if no put data) */
  put: YieldExplanation | null;

  /** Capital per contract explanation */
  capitalPerContract: number | null;
  capitalSource: "put_strike" | "underlying_price" | "unavailable";

  /** DTE and annualization context */
  dte: number | null;
  annualizationNote: string;

  /** IV context */
  iv: number | null;
  ivNote: string;

  /** Overall narrative */
  narrative: string[];
}

/**
 * Explain an opportunity row by decomposing its yield into contributing factors.
 * Pure function — uses only data already present in the OpportunityRow.
 */
export function explainOpportunity(row: OpportunityRow): OpportunityExplanation {
  const narrative: string[] = [];
  const dte = row.nearestDte;
  const price = row.price;

  // --- Call-side decomposition ---
  let call: YieldExplanation | null = null;
  if (row.callMid != null && price != null && price > 0 && dte != null && dte > 0) {
    const premiumPerContract = row.callMid * 100;
    const collateral = price;
    const rawYield = row.callMid / collateral;
    const annualizationMultiplier = 365 / dte;
    const annualizedYield = rawYield * annualizationMultiplier * 100;

    call = {
      premiumPerContract,
      collateral,
      rawYield,
      annualizationMultiplier,
      annualizedYield,
      delta: row.callDelta,
      mid: row.callMid,
      strike: null, // not tracked separately for calls
      iv: row.iv,
    };
  }

  // --- Put-side decomposition ---
  let put: YieldExplanation | null = null;
  if (row.putMid != null && row.capitalPerContract != null && dte != null && dte > 0) {
    const putStrike = row.capitalPerContract / 100;
    const premiumPerContract = row.putMid * 100;
    const collateral = putStrike;
    const rawYield = row.putMid / collateral;
    const annualizationMultiplier = 365 / dte;
    const annualizedYield = rawYield * annualizationMultiplier * 100;

    put = {
      premiumPerContract,
      collateral,
      rawYield,
      annualizationMultiplier,
      annualizedYield,
      delta: row.putDelta,
      mid: row.putMid,
      strike: putStrike,
      iv: row.iv,
    };
  }

  // --- Capital explanation ---
  let capitalSource: "put_strike" | "underlying_price" | "unavailable" = "unavailable";
  if (row.capitalPerContract != null) {
    // If putMid exists, capital comes from put strike; otherwise from price
    capitalSource = row.putMid != null ? "put_strike" : "underlying_price";
  }

  // --- Annualization context ---
  let annualizationNote = "";
  if (dte != null) {
    const multiplier = (365 / dte).toFixed(1);
    if (dte <= 7) {
      annualizationNote = `Very short DTE (${dte} days) produces a ${multiplier}× annualization multiplier. This amplifies even small premiums into large annualized yields. Real-world returns depend on repeatable execution.`;
    } else if (dte <= 14) {
      annualizationNote = `Short DTE (${dte} days) produces a ${multiplier}× annualization multiplier. Yields are amplified but may be achievable with consistent rolling.`;
    } else if (dte <= 45) {
      annualizationNote = `Moderate DTE (${dte} days) produces a ${multiplier}× annualization multiplier. This is a standard income-writing timeframe.`;
    } else {
      annualizationNote = `Longer DTE (${dte} days) produces a ${multiplier}× annualization multiplier. Lower time decay per day but less annualization amplification.`;
    }
  } else {
    annualizationNote = "DTE unavailable — cannot assess annualization effect.";
  }

  // --- IV context ---
  let ivNote = "";
  if (row.iv != null) {
    const ivPct = (row.iv * 100).toFixed(0);
    if (row.iv > 0.40) {
      ivNote = `High IV (${ivPct}%) means options are expensive. Premium is fat, but elevated IV may signal expected volatility or risk.`;
    } else if (row.iv > 0.25) {
      ivNote = `Moderate IV (${ivPct}%). Premium reflects normal market expectations for this underlying.`;
    } else if (row.iv > 0.10) {
      ivNote = `Low IV (${ivPct}%). Premium is thin — yield relies more on short DTE annualization than on rich options pricing.`;
    } else {
      ivNote = `Very low IV (${ivPct}%). Options are cheap — yields are likely driven primarily by annualization math.`;
    }
  } else {
    ivNote = "IV unavailable from provider.";
  }

  // --- Narrative ---
  const bestYield = Math.max(row.callYield ?? 0, row.putYield ?? 0);
  const bestSide = (row.callYield ?? 0) >= (row.putYield ?? 0) ? "call" : "put";

  if (price != null && dte != null && bestYield > 0) {
    narrative.push(
      `${row.symbol} at $${price.toFixed(2)} with ${dte} DTE.`
    );

    if (row.iv != null) {
      narrative.push(
        `IV at ${(row.iv * 100).toFixed(0)}% determines how much premium the market offers.`
      );
    }

    const bestExplanation = bestSide === "call" ? call : put;
    if (bestExplanation) {
      const rawPct = (bestExplanation.rawYield * 100).toFixed(2);
      narrative.push(
        `The ${bestSide} at the selected strike yields ${rawPct}% for ${dte} days (raw). ` +
        `Annualized (×${bestExplanation.annualizationMultiplier.toFixed(1)}), that becomes ${bestYield.toFixed(1)}%.`
      );

      if (dte <= 7) {
        narrative.push(
          `Caution: the high annualized number is heavily amplified by short DTE. ` +
          `Actual per-cycle premium is $${bestExplanation.premiumPerContract.toFixed(0)} on $${bestExplanation.collateral.toFixed(0)} collateral.`
        );
      }
    }

    if (row.capitalPerContract != null) {
      narrative.push(
        `Capital per contract: $${row.capitalPerContract.toLocaleString()}. ` +
        `This is the minimum capital unit required to participate in this opportunity.`
      );
    }
  } else if (row.status === "data_missing") {
    narrative.push(`${row.symbol}: ${row.statusReason}`);
  } else {
    narrative.push(`${row.symbol}: insufficient data for decomposition.`);
  }

  return {
    symbol: row.symbol,
    price,
    call,
    put,
    capitalPerContract: row.capitalPerContract,
    capitalSource,
    dte,
    annualizationNote,
    iv: row.iv,
    ivNote,
    narrative,
  };
}
