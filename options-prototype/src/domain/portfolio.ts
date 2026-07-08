/**
 * Canonical types for portfolio activity and holdings.
 *
 * These types represent the instrument's view of execution reality.
 * They are independent of any brokerage (Fidelity, Schwab, etc.).
 *
 * The instrument does not execute trades.
 * It observes activity after the fact and correlates it with recommendations.
 *
 * Integration path:
 *   Fidelity CSV export → import adapter → canonical types → instrument state
 */

// --- Activity (trade history) ---

export type ActivityType =
  | "BUY_TO_OPEN"
  | "SELL_TO_OPEN"
  | "BUY_TO_CLOSE"
  | "SELL_TO_CLOSE"
  | "ASSIGNED"
  | "EXPIRED"
  | "DIVIDEND"
  | "OTHER";

export interface Activity {
  /** ISO date string of the activity */
  date: string;
  /** Type of activity */
  type: ActivityType;
  /** Underlying symbol (e.g., "XLE") */
  symbol: string;
  /** Description from source (preserved for debugging) */
  description: string;
  /** Quantity (positive = buy, negative = sell; contracts for options) */
  quantity: number;
  /** Price per share/contract */
  price: number;
  /** Total dollar amount (positive = credit, negative = debit) */
  amount: number;
  /** Whether this is an option transaction */
  isOption: boolean;
  /** Option details (populated if isOption) */
  optionDetails?: OptionActivityDetails;
}

export interface OptionActivityDetails {
  /** "CALL" or "PUT" */
  type: "CALL" | "PUT";
  /** Strike price */
  strike: number;
  /** Expiration date (ISO string) */
  expiration: string;
  /** Underlying symbol */
  underlying: string;
}

// --- Holdings (current positions) ---

export interface Holding {
  /** Symbol (equity ticker or option symbol) */
  symbol: string;
  /** Human-readable description */
  description: string;
  /** Number of shares or contracts */
  quantity: number;
  /** Current market value */
  marketValue: number;
  /** Cost basis per share/contract */
  costBasis: number;
  /** Whether this is an option position */
  isOption: boolean;
  /** Option details (populated if isOption) */
  optionDetails?: OptionHoldingDetails;
}

export interface OptionHoldingDetails {
  /** "CALL" or "PUT" */
  type: "CALL" | "PUT";
  /** Strike price */
  strike: number;
  /** Expiration date (ISO string) */
  expiration: string;
  /** Underlying symbol */
  underlying: string;
}

// --- Import result ---

export interface ImportResult<T> {
  /** Successfully parsed items */
  items: T[];
  /** Rows that could not be parsed */
  errors: ImportError[];
  /** Source file name */
  source: string;
  /** Import timestamp */
  importedAt: string;
}

export interface ImportError {
  /** Row number in the CSV (1-indexed) */
  row: number;
  /** Raw row content */
  rawContent: string;
  /** Reason for failure */
  reason: string;
}
