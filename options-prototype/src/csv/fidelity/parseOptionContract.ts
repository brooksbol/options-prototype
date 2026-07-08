/**
 * Fidelity Option Contract Parser Utility.
 *
 * Parses option contracts from two Fidelity representations:
 *
 * 1. Description format (Option Summary "Expiration & Strike" column):
 *    "XLE JUL 31 2026 $55 CALL"
 *
 * 2. Symbol format (Holdings/Activity symbol column):
 *    "-XLE260717P57"
 *    "-XLE260717C54.5"
 *
 * Both normalize into the same canonical ParsedOptionContract.
 * This utility is reusable across all Fidelity export types.
 */

export interface ParsedOptionContract {
  underlying: string;
  expiration: string; // ISO date: "2026-07-31"
  strike: number;
  type: "CALL" | "PUT";
}

const MONTH_MAP: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04",
  MAY: "05", JUN: "06", JUL: "07", AUG: "08",
  SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

/**
 * Parse a Fidelity option contract from either description or symbol format.
 * Returns null if the value represents shares or is not recognizable as an option.
 *
 * Tries description format first, then symbol format.
 */
export function parseOptionContract(value: string): ParsedOptionContract | null {
  if (!value) return null;
  const trimmed = value.trim();

  // "Shares" means equity position
  if (trimmed.toLowerCase() === "shares") return null;

  // Try description format first
  const descResult = parseDescriptionFormat(trimmed);
  if (descResult) return descResult;

  // Try symbol format
  const symResult = parseSymbolFormat(trimmed);
  if (symResult) return symResult;

  return null;
}

/**
 * Parse description format: "XLE JUL 31 2026 $55 CALL"
 */
export function parseDescriptionFormat(value: string): ParsedOptionContract | null {
  const match = value.match(
    /^(\w+)\s+(\w{3})\s+(\d{1,2})\s+(\d{4})\s+\$?([\d.]+)\s+(CALL|PUT)$/i
  );

  if (!match) return null;

  const [, underlying, monthStr, day, year, strike, type] = match;
  const month = MONTH_MAP[monthStr.toUpperCase()];
  if (!month) return null;

  return {
    underlying: underlying.toUpperCase(),
    expiration: `${year}-${month}-${day.padStart(2, "0")}`,
    strike: parseFloat(strike),
    type: type.toUpperCase() as "CALL" | "PUT",
  };
}

/**
 * Parse Fidelity symbol format: "-XLE260717P57" or "-XLE260717C54.5"
 *
 * Pattern: optional leading dash + underlying + YYMMDD + C/P + strike
 * Examples:
 *   -XLE260717P57     → XLE, 2026-07-17, PUT, $57
 *   -XLE260717C54.5   → XLE, 2026-07-17, CALL, $54.50
 *   -SPY261218C600    → SPY, 2026-12-18, CALL, $600
 */
export function parseSymbolFormat(value: string): ParsedOptionContract | null {
  // Remove leading dash if present
  const cleaned = value.startsWith("-") ? value.slice(1) : value;

  // Pattern: UNDERLYING (letters) + DATE (6 digits) + TYPE (C/P) + STRIKE (digits/decimal)
  const match = cleaned.match(/^([A-Z]+)(\d{6})([CP])([\d.]+)$/i);
  if (!match) return null;

  const [, underlying, dateStr, typeChar, strikeStr] = match;

  // Parse date: YYMMDD
  const year = `20${dateStr.slice(0, 2)}`;
  const month = dateStr.slice(2, 4);
  const day = dateStr.slice(4, 6);

  // Validate month/day
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;

  return {
    underlying: underlying.toUpperCase(),
    expiration: `${year}-${month}-${day}`,
    strike: parseFloat(strikeStr),
    type: typeChar.toUpperCase() === "C" ? "CALL" : "PUT",
  };
}
