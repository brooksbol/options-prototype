/**
 * Fidelity Trade Link Builder
 *
 * Accepts a WriteIntent and returns a pre-populated Fidelity trade-ticket URL.
 * Uses URL + URLSearchParams. No manual query-string assembly.
 *
 * The system may construct and open the link.
 * The system must NOT submit, automate, or assume the order was accepted.
 * Fidelity remains responsible for preview, validation, confirmation, and submission.
 */

import type { WriteIntent } from "./write-intent";

const FIDELITY_TRADE_OPTIONS_BASE = "https://digital.fidelity.com/ftgw/digital/trade-options";

export interface FidelityTradeLink {
  url: string;
  /** Fields the operator must verify in Fidelity before submitting */
  requiresVerification: string[];
}

/**
 * Build a Fidelity pre-populated trade-ticket URL from a WriteIntent.
 *
 * Returns null if the intent cannot be safely converted to a valid URL.
 *
 * Known parameter mapping (empirically observed):
 *   ORDER_TYPE=O           → Options order
 *   ORDER_ACTION=SOPEN     → Sell to Open
 *   LIMIT_STOP_PRICE=x.xx  → Limit price
 *   SECURITY_ID=-SYM...    → Fidelity option security ID
 *   trade=rocfly           → Routing/flow identifier (constant)
 */
export function buildFidelityTradeLink(intent: WriteIntent): FidelityTradeLink | null {
  if (!intent.contractSymbol || !intent.limitPrice || intent.limitPrice <= 0) {
    return null;
  }

  if (intent.action !== "sell-to-open") {
    return null;
  }

  const url = new URL(FIDELITY_TRADE_OPTIONS_BASE);

  url.searchParams.set("ORDER_TYPE", "O");
  url.searchParams.set("ORDER_ACTION", "SOPEN");
  url.searchParams.set("LIMIT_STOP_PRICE", formatLimitPrice(intent.limitPrice));
  url.searchParams.set("SECURITY_ID", intent.contractSymbol);
  url.searchParams.set("trade", "rocfly");

  return {
    url: url.toString(),
    requiresVerification: [
      "Account selection",
      "Quantity (contracts)",
      "Time in force",
      "Limit price",
      "Contract identity",
    ],
  };
}

/**
 * Format limit price for Fidelity URL.
 * Use minimal decimal places: $0.33 → "0.33", $1.50 → "1.5", $2.00 → "2"
 */
function formatLimitPrice(price: number): string {
  // Round to 2 decimal places
  const rounded = Math.round(price * 100) / 100;

  // If integer, show without decimals
  if (rounded === Math.floor(rounded)) {
    return String(rounded);
  }

  // If one decimal is sufficient (e.g., 1.50 → 1.5)
  const oneDecimal = Math.round(rounded * 10) / 10;
  if (oneDecimal === rounded) {
    return rounded.toFixed(1);
  }

  return rounded.toFixed(2);
}
