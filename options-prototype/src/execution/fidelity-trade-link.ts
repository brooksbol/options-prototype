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
 *   SECURITY_ID=-SYM...    → Fidelity option security ID (C side for calls)
 *   trade=rocfly|rocask    → Routing/flow token (puts: rocfly, calls: rocask)
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
  // Routing/flow token (empirically observed): puts use "rocfly", calls use "rocask".
  url.searchParams.set("trade", intent.optionType === "call" ? "rocask" : "rocfly");

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
 * Account-safe broker handoff (Increment 4).
 *
 * Fails CLOSED when the intent belongs to a different account than the one currently
 * active: an intent generated under account A must not be handed off while account B is
 * active without explicit safe context correction. This is the sharpest capital-path guard
 * in the multi-account model — a wrong-account order is a material safety failure.
 *
 * When the intent carries no account (null, legacy/demo) it is treated as unattributed and
 * only permitted when there is likewise no active real account; otherwise it fails closed
 * (an unattributed intent must not silently ride the active real account).
 *
 * On success, delegates to buildFidelityTradeLink, preserving Fidelity's existing operator
 * verification (including the operator's own "Account selection" confirmation step).
 */
export type AccountSafeHandoff =
  | { kind: "ok"; link: FidelityTradeLink }
  | { kind: "account-mismatch"; intentAccountId: string | null; activeAccountId: string | null }
  | { kind: "invalid-intent" };

export function buildAccountSafeTradeLink(
  intent: WriteIntent,
  activeBrokerageAccountId: string | null
): AccountSafeHandoff {
  const intentAccountId = intent.brokerageAccountId ?? null;

  // Fail closed on any account discrepancy (including unattributed intent vs active account).
  if (intentAccountId !== activeBrokerageAccountId) {
    return { kind: "account-mismatch", intentAccountId, activeAccountId: activeBrokerageAccountId };
  }

  const link = buildFidelityTradeLink(intent);
  if (!link) return { kind: "invalid-intent" };
  return { kind: "ok", link };
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
