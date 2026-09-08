/**
 * Write Intent — Broker-neutral representation of a proposed option order.
 *
 * Constructed deterministically from Wheelwright recommendation + cached evidence.
 * Does NOT imply an order was placed.
 * Does NOT require provider calls.
 */

import type { PutCandidate, CallCandidate } from "../write-desk/candidate-types";

// --- Domain Type ---

export interface WriteIntent {
  underlyingSymbol: string;
  contractSymbol: string;
  expiration: string;
  optionType: "put" | "call";
  strike: number;
  action: "sell-to-open";
  quantity: number;
  orderType: "limit";
  limitPrice: number;
  timeInForce: "day";
}

// --- Builder ---

export interface WriteIntentInput {
  candidate: PutCandidate;
  quantity?: number;
}

/**
 * Build a WriteIntent from a Wheelwright recommendation.
 *
 * Uses the candidate's bid as the limit price (the operator must verify).
 * Default quantity is 1 contract.
 * Returns null if required fields are missing or invalid.
 */
export function buildWriteIntent(input: WriteIntentInput): WriteIntent | null {
  const { candidate, quantity = 1 } = input;

  if (!candidate.symbol || !candidate.expiration || candidate.strike <= 0) {
    return null;
  }

  if (candidate.bid <= 0) {
    return null;
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    return null;
  }

  // Build canonical contract symbol: -UNDERLYING YYMMDD P|C STRIKE
  const contractSymbol = formatFidelitySecurityId(
    candidate.symbol,
    candidate.expiration,
    "put",
    candidate.strike
  );

  if (!contractSymbol) {
    return null;
  }

  return {
    underlyingSymbol: candidate.symbol.toUpperCase(),
    contractSymbol,
    expiration: candidate.expiration,
    optionType: "put",
    strike: candidate.strike,
    action: "sell-to-open",
    quantity,
    orderType: "limit",
    limitPrice: candidate.bid,
    timeInForce: "day",
  };
}

export interface CallWriteIntentInput {
  candidate: CallCandidate;
  quantity?: number;
}

/**
 * Build a covered-call WriteIntent from a Wheelwright call recommendation.
 *
 * A covered call is SELL-to-open: the operator writes a call against held,
 * unencumbered shares to collect premium. The Fidelity action is therefore
 * SOPEN (the same sell-to-open mechanism as puts), differing only in the
 * contract side (C) encoded in the SECURITY_ID.
 *
 * Uses the candidate's bid as the limit price (the operator must verify).
 * Default quantity is 1 contract. Returns null if required fields are missing
 * or invalid, or if the candidate has no covered-call capacity.
 */
export function buildCallWriteIntent(input: CallWriteIntentInput): WriteIntent | null {
  const { candidate, quantity = 1 } = input;

  if (!candidate.symbol || !candidate.expiration || candidate.strike <= 0) {
    return null;
  }

  if (candidate.bid <= 0) {
    return null;
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    return null;
  }

  // Cannot write a covered call without capacity (held, unencumbered shares).
  if (candidate.maxContracts < 1) {
    return null;
  }

  const contractSymbol = formatFidelitySecurityId(
    candidate.symbol,
    candidate.expiration,
    "call",
    candidate.strike
  );

  if (!contractSymbol) {
    return null;
  }

  return {
    underlyingSymbol: candidate.symbol.toUpperCase(),
    contractSymbol,
    expiration: candidate.expiration,
    optionType: "call",
    strike: candidate.strike,
    action: "sell-to-open",
    quantity,
    orderType: "limit",
    limitPrice: candidate.bid,
    timeInForce: "day",
  };
}

// --- Fidelity Security ID Formatting ---

/**
 * Format a Fidelity option SECURITY_ID.
 *
 * Format: -<UNDERLYING><YYMMDD><P|C><STRIKE>
 *
 * Examples:
 *   -XLE260717P56.5
 *   -XLP260731P83
 *
 * Returns null if inputs are invalid.
 */
export function formatFidelitySecurityId(
  underlying: string,
  expiration: string,
  optionType: "put" | "call",
  strike: number
): string | null {
  if (!underlying || underlying.trim().length === 0) return null;
  if (!expiration || !/^\d{4}-\d{2}-\d{2}$/.test(expiration)) return null;
  if (strike <= 0 || !isFinite(strike)) return null;

  const symbol = underlying.toUpperCase().trim();
  const [yearStr, month, day] = expiration.split("-");
  const yy = yearStr.slice(2); // "2026" → "26"
  const side = optionType === "put" ? "P" : "C";

  // Format strike: use integer when possible, decimal otherwise
  const strikeStr = strike === Math.floor(strike)
    ? String(strike)
    : String(strike);

  return `-${symbol}${yy}${month}${day}${side}${strikeStr}`;
}
