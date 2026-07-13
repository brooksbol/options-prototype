/**
 * Likely-Fund Heuristic.
 *
 * Simple deterministic name-matching to flag securities that are
 * likely ETFs, mutual funds, or similar investment products.
 *
 * IMPORTANT: This is a heuristic only — not verified product classification.
 * It may produce false positives (operating companies with "Trust" in name)
 * and false negatives (funds with unusual naming conventions).
 *
 * Do not store the result as authoritative ETF identity.
 */

// --- Keywords that suggest a fund/ETF ---

const FUND_KEYWORDS = [
  "ETF",
  "FUND",
  "TRUST",
  "PORTFOLIO",
  "INDEX",
  "SHARES",
];

const FUND_ISSUER_PATTERNS = [
  "SPDR",
  "ISHARES",
  "VANGUARD",
  "INVESCO",
  "PROSHARES",
  "DIREXION",
  "VANECK",
  "WISDOMTREE",
  "SCHWAB",
  "SELECT SECTOR",
  "FIRST TRUST",
  "GLOBAL X",
  "ARK ",
  "NEOS ",
  "JPMORGAN",
  "FIDELITY",
  "STATE STREET",
  "PIMCO",
  "AMPLIFY",
];

/**
 * Returns true if the security name heuristically looks like a fund/ETF.
 * This is NOT authoritative classification.
 */
export function isLikelyFund(name: string): boolean {
  if (!name) return false;
  const upper = name.toUpperCase();

  // Check keywords
  for (const keyword of FUND_KEYWORDS) {
    if (upper.includes(keyword)) return true;
  }

  // Check issuer patterns
  for (const pattern of FUND_ISSUER_PATTERNS) {
    if (upper.includes(pattern)) return true;
  }

  return false;
}

/**
 * Returns the matched reason (for display), or null if not a likely fund.
 */
export function likelyFundReason(name: string): string | null {
  if (!name) return null;
  const upper = name.toUpperCase();

  for (const keyword of FUND_KEYWORDS) {
    if (upper.includes(keyword)) return `Name contains "${keyword}"`;
  }

  for (const pattern of FUND_ISSUER_PATTERNS) {
    if (upper.includes(pattern)) return `Matches issuer pattern "${pattern}"`;
  }

  return null;
}
