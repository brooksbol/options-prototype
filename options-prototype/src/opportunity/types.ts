/**
 * Opportunity Lab domain types.
 *
 * These represent the "radar view" — broad, comparative evidence
 * across a curated ETF universe to help answer "where should I look next?"
 */

// --- Curated Universe ---

/**
 * Priority Watchlist — high-priority symbols for Quick Radar scans.
 *
 * These are NOT the authoritative candidate universe. The authoritative
 * universe is loaded via loadCandidateUniverseWithDescriptor() from the
 * universe service (currently Yahoo 496 + operator additions).
 *
 * This list serves as:
 * - a priority seed for Quick Radar scans in Opportunity Lab
 * - a regression-test fixture
 * - a demo fixture
 *
 * It must not be used as a replacement for the shared candidate universe.
 */
export const PRIORITY_WATCHLIST: string[] = [
  "XLE", "XLF", "XLV", "XLU", "XLI",
  "XLP", "XLY", "XLK", "XLB", "XLRE",
  "XLC", "IWM", "DIA", "TLT", "GLD",
];

/** Human-readable ETF descriptions for tooltips. */
export const ETF_DESCRIPTIONS: Record<string, string> = {
  XLE: "Energy Select Sector SPDR Fund",
  XLF: "Financial Select Sector SPDR Fund",
  XLV: "Health Care Select Sector SPDR Fund",
  XLU: "Utilities Select Sector SPDR Fund",
  XLI: "Industrial Select Sector SPDR Fund",
  XLP: "Consumer Staples Select Sector SPDR Fund",
  XLY: "Consumer Discretionary Select Sector SPDR Fund",
  XLK: "Technology Select Sector SPDR Fund",
  XLB: "Materials Select Sector SPDR Fund",
  XLRE: "Real Estate Select Sector SPDR Fund",
  XLC: "Communication Services Select Sector SPDR Fund",
  IWM: "iShares Russell 2000 ETF",
  DIA: "SPDR Dow Jones Industrial Average ETF",
  TLT: "iShares 20+ Year Treasury Bond ETF",
  GLD: "SPDR Gold Shares",
};

// --- Opportunity Status ---

export type OpportunityStatus =
  | "interesting"    // good premium + usable liquidity
  | "monitor"       // below threshold but has data
  | "ineligible"    // capital too high or other constraint
  | "data_missing"; // cannot evaluate (no options data, no greeks, etc.)

// --- Opportunity Row ---

export interface OpportunityRow {
  /** ETF symbol */
  symbol: string;
  /** Current underlying price (null if quote unavailable) */
  price: number | null;
  /** Capital required per CSP contract (strike × 100, using nearest ATM) */
  capitalPerContract: number | null;
  /** Whether usable options data was available */
  optionsAvailable: boolean;
  /** Nearest expiration date (ISO string) */
  nearestExpiration: string | null;
  /** DTE of nearest expiration */
  nearestDte: number | null;
  /** Delta of the contract closest to target delta (call side) */
  callDelta: number | null;
  /** Strike of the selected call contract */
  callStrike: number | null;
  /** Estimated mid price at target delta (call side) */
  callMid: number | null;
  /** Estimated annualized yield at target delta (call side) */
  callYield: number | null;
  /** Delta of the contract closest to target delta (put side) */
  putDelta: number | null;
  /** Strike of the selected put contract */
  putStrike: number | null;
  /** Estimated mid price at target delta (put side) */
  putMid: number | null;
  /** Estimated annualized yield at target delta (put side) */
  putYield: number | null;
  /** Simple opportunity status */
  status: OpportunityStatus;
  /** Human-readable reason for the status */
  statusReason: string;
  /** Whether greeks were available */
  greeksAvailable: boolean;
  /** Implied volatility at target delta (average of call + put if both available) */
  iv: number | null;
  /** Volume of the selected target-delta contracts (call + put combined) */
  volume: number | null;
  /** Data source for this row */
  dataSource: "api" | "cache" | "unavailable";
}

// --- Opportunity Policy (simple for first slice) ---

export interface OpportunityPolicy {
  /** Target delta for opportunity scanning */
  targetDelta: number;
  /** Minimum annualized yield to be "interesting" */
  minYieldThreshold: number;
  /** Maximum capital per contract (eligibility gate) */
  maxCapitalPerContract: number | null;
  /** Minimum DTE for expiration selection */
  minDte: number;
  /** Maximum DTE for expiration selection (null = no upper bound) */
  maxDte: number | null;
}

export const DEFAULT_OPPORTUNITY_POLICY: OpportunityPolicy = {
  targetDelta: 0.30,
  minYieldThreshold: 8.0, // 8% annualized minimum to be "interesting"
  maxCapitalPerContract: null, // no cap by default
  minDte: 3,
  maxDte: null, // no upper bound by default — picks nearest available
};
