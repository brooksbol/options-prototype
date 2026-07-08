/**
 * Shared numeric parsing utilities for Fidelity CSV exports.
 *
 * Handles Fidelity's formatting conventions:
 *   $53.15    → 53.15
 *   -$390.00  → -390
 *   +$0.96    → 0.96
 *   58.96%    → 58.96
 *   -24.00%   → -24
 *   --        → null
 *   blank     → null
 *   n/a       → null
 *
 * These utilities are shared by all Fidelity parsers.
 */

/**
 * Parse a Fidelity dollar value string into a number or null.
 * Handles $, +/-, commas, parentheses for negatives.
 */
export function parseDollar(value: string | undefined | null): number | null {
  if (!value || value.trim() === "" || value.trim() === "--" || value.trim().toLowerCase() === "n/a") {
    return null;
  }

  let cleaned = value.trim();

  // Handle parenthetical negatives: ($123.45)
  const parenMatch = cleaned.match(/^\((.+)\)$/);
  if (parenMatch) {
    cleaned = `-${parenMatch[1]}`;
  }

  // Remove $, commas, plus sign
  cleaned = cleaned.replace(/[$,]/g, "").replace(/^\+/, "");

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a Fidelity percentage string into a number or null.
 * Returns the numeric value (e.g., "58.96%" → 58.96).
 */
export function parsePercent(value: string | undefined | null): number | null {
  if (!value || value.trim() === "" || value.trim() === "--" || value.trim().toLowerCase() === "n/a") {
    return null;
  }

  let cleaned = value.trim();

  // Remove % sign
  cleaned = cleaned.replace(/%/g, "");

  // Handle +/- prefixes
  cleaned = cleaned.replace(/^\+/, "");

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a quantity value (may be integer or decimal, may have commas).
 */
export function parseQuantity(value: string | undefined | null): number {
  if (!value || value.trim() === "" || value.trim() === "--") return 0;
  const cleaned = value.trim().replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
