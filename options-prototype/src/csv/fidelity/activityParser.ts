/**
 * Fidelity Activity / History CSV Parser.
 *
 * Parses Fidelity's "History" or "Activity & Orders" CSV export into
 * typed ActivityRow events.
 *
 * Priority: option lifecycle events (sell-to-open, assigned, expired).
 * All other rows are preserved as typed events with raw row data.
 * Unknown actions safely become eventType: "other".
 *
 * Does NOT:
 *   - Build cumulative event stores
 *   - Deduplicate across imports
 *   - Compute analytics or P&L
 *   - Track cash balance history
 */

import type { CsvDocument } from "../reader";
import type { CsvParser, DetectionResult, ParsedDocument, ParserDiagnostic, ParseContext } from "../registry";
import { parseDollar, parseQuantity } from "./numericUtils";
import { parseOptionContract, type ParsedOptionContract } from "./parseOptionContract";

// --- Domain types ---

export type ActivityEventType =
  | "sell_to_open"
  | "buy_to_close"
  | "assigned"
  | "expired"
  | "shares_bought_assignment"
  | "shares_sold_assignment"
  | "dividend"
  | "treasury"
  | "cash_movement"
  | "reinvestment"
  | "other";

export interface ActivityRow {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Classified event type */
  eventType: ActivityEventType;
  /** Raw Fidelity action text (preserved for debugging) */
  action: string;
  /** Symbol (equity ticker or option symbol) */
  symbol: string;
  /** Fidelity description */
  description: string;
  /** Quantity (positive = bought/received, negative = sold/delivered) */
  quantity: number;
  /** Price per unit */
  price: number | null;
  /** Commission charged */
  commission: number | null;
  /** Fees charged */
  fees: number | null;
  /** Net amount (positive = credit, negative = debit) */
  amount: number | null;
  /** Running cash balance after this event */
  cashBalance: number | null;
  /** Settlement date (ISO or raw string) */
  settlementDate: string | null;
  /** Parsed option contract (populated for option-related events) */
  option: ParsedOptionContract | null;
  /** Raw CSV row */
  rawRow: string[];
}

// --- Event type classification ---

function classifyAction(action: string): ActivityEventType {
  const a = action.toUpperCase();

  // Most specific matches first

  // Share events from option assignments (must check before generic "ASSIGNED")
  if (a.includes("YOU BOUGHT ASSIGNED PUTS")) return "shares_bought_assignment";
  if (a.includes("YOU SOLD ASSIGNED CALLS")) return "shares_sold_assignment";

  // Option lifecycle
  if (a.includes("YOU SOLD OPENING TRANSACTION")) return "sell_to_open";
  if (a.includes("YOU BOUGHT CLOSING TRANSACTION")) return "buy_to_close";
  if (a.includes("ASSIGNED")) return "assigned";
  if (a.includes("EXPIRED")) return "expired";

  // Dividends and reinvestment
  if (a.includes("REINVESTMENT")) return "reinvestment";
  if (a.includes("DIVIDEND")) return "dividend";

  // Treasury activity
  if (a.includes("REDEMPTION PAYOUT") && a.includes("TREAS")) return "treasury";
  if (a.includes("YOU BOUGHT") && a.includes("TREAS")) return "treasury";
  if (a.includes("YOU SOLD") && a.includes("TREAS")) return "treasury";

  // Cash movements
  if (a.includes("ELECTRONIC FUNDS TRANSFER")) return "cash_movement";
  if (a.includes("WIRE TRANSFER")) return "cash_movement";
  if (a.includes("TRANSFER OF ASSETS")) return "cash_movement";
  if (a.includes("TRANSFERRED TO")) return "cash_movement";

  return "other";
}

// --- Date normalization ---

/**
 * Normalize Fidelity date formats to ISO.
 * Handles: "07-02-2026", "07/02/2026", "2026-07-02"
 */
function normalizeDate(value: string): string {
  if (!value || value.trim() === "" || value.trim() === '""') return "";

  const trimmed = value.trim().replace(/^"|"$/g, "");

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // MM-DD-YYYY or MM/DD/YYYY
  const match = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) return `${match[3]}-${match[1]}-${match[2]}`;

  return trimmed;
}

// --- Detection ---

const REQUIRED_HEADERS = ["run date", "action", "amount"];
const SIGNAL_HEADERS = ["cash balance", "settlement date", "commission", "fees", "accrued interest"];

// --- Footer detection ---

function isTrailerRow(row: string[]): boolean {
  if (row.length === 0) return true;
  const first = (row[0] ?? "").trim();
  if (first === "") return true;
  if (first.startsWith('"The data and information')) return true;
  if (first.startsWith('"Brokerage services')) return true;
  if (first.startsWith('"informational purposes')) return true;
  if (first.startsWith('"recommendation for')) return true;
  if (first.startsWith('"exported and')) return true;
  if (first.startsWith('"purposes.')) return true;
  if (first.startsWith('"Financial Services')) return true;
  if (first.startsWith('"Fidelity Insurance')) return true;
  if (first.toLowerCase().startsWith("date downloaded")) return true;
  // Quoted disclaimer continuation lines
  if (first.startsWith('"') && !first.match(/^\d/)) return true;
  return false;
}

// --- Parser implementation ---

export const fidelityActivityParser: CsvParser = {
  id: "fidelity_activity",
  label: "Fidelity Activity",

  detect(document: CsvDocument): DetectionResult {
    const reasons: string[] = [];
    const matchedHeaders: string[] = [];
    const missingHeaders: string[] = [];
    let confidence = 0;

    const headersLower = document.headers.map((h) => h.toLowerCase().trim());

    for (const required of REQUIRED_HEADERS) {
      if (headersLower.some((h) => h.includes(required))) {
        matchedHeaders.push(required);
        confidence += 0.2;
      } else {
        missingHeaders.push(required);
      }
    }

    for (const signal of SIGNAL_HEADERS) {
      if (headersLower.some((h) => h.includes(signal))) {
        matchedHeaders.push(signal);
        confidence += 0.05;
      }
    }

    // "Run Date" is a strong distinguisher from Positions (which has "Account Number")
    if (headersLower.some((h) => h === "run date")) {
      reasons.push("Contains 'Run Date' column (activity-specific)");
      confidence += 0.1;
    }

    // Action column with option keywords
    const actionCol = headersLower.findIndex((h) => h === "action");
    if (actionCol !== -1) {
      const actions = document.rows.slice(0, 10).map((r) => (r[actionCol] ?? "").toUpperCase());
      if (actions.some((a) => a.includes("YOU SOLD") || a.includes("ASSIGNED") || a.includes("EXPIRED") || a.includes("REDEMPTION"))) {
        reasons.push("Contains transaction action verbs");
        confidence += 0.1;
      }
    }

    confidence = Math.min(confidence, 1.0);

    if (matchedHeaders.length >= 3) {
      reasons.push(`Matched ${matchedHeaders.length} expected headers`);
    }

    return { confidence, reasons, matchedHeaders, missingHeaders };
  },

  parse(document: CsvDocument, context?: ParseContext): ParsedDocument {
    const items: ActivityRow[] = [];
    const trailerRows: string[][] = [];
    const diagnostics: ParserDiagnostic[] = [];

    const headersLower = document.headers.map((h) => h.toLowerCase().trim());

    // Map column indices
    const col = (search: string): number => headersLower.findIndex((h) => h.includes(search));
    const dateCol = col("run date");
    const actionCol = col("action");
    const symbolCol = col("symbol");
    const descCol = col("description");
    const priceCol = col("price");
    const quantityCol = col("quantity");
    const commissionCol = col("commission");
    const feesCol = col("fees");
    const amountCol = col("amount");
    const cashBalCol = col("cash balance");
    const settlementCol = col("settlement");

    let inTrailer = false;

    for (let i = 0; i < document.rows.length; i++) {
      const row = document.rows[i];

      if (inTrailer) {
        trailerRows.push(row);
        continue;
      }

      if (isTrailerRow(row)) {
        inTrailer = true;
        trailerRows.push(row);
        continue;
      }

      const rawDate = (row[dateCol] ?? "").trim();
      const action = (row[actionCol] ?? "").trim();

      if (!rawDate && !action) {
        continue; // Skip empty rows
      }

      const date = normalizeDate(rawDate);
      const symbol = (row[symbolCol] ?? "").trim();
      const description = (row[descCol] ?? "").trim();
      const eventType = classifyAction(action);

      // Parse option contract from symbol or description
      let option: ParsedOptionContract | null = null;
      if (symbol) {
        option = parseOptionContract(symbol);
      }
      if (!option && description) {
        // Try parsing from the action text which often contains the contract description
        // e.g., "PUT (XLE) SELECT SECTOR SPDR JUL 10 26 $57.5 (100 SHS)"
        const actionOptionMatch = action.match(/(PUT|CALL)\s+\((\w+)\)\s+.+?(\w{3})\s+(\d{1,2})\s+(\d{2})\s+\$?([\d.]+)/i);
        if (actionOptionMatch) {
          const [, type, underlying, month, day, year, strike] = actionOptionMatch;
          const monthMap: Record<string, string> = {
            JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
            JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
          };
          const mm = monthMap[month.toUpperCase()] ?? "01";
          option = {
            type: type.toUpperCase() as "CALL" | "PUT",
            underlying: underlying.toUpperCase(),
            expiration: `20${year}-${mm}-${day.padStart(2, "0")}`,
            strike: parseFloat(strike),
          };
        }
      }

      const quantity = parseQuantity(row[quantityCol]);
      const price = parseDollar(row[priceCol]);
      const commission = parseDollar(row[commissionCol]);
      const fees = parseDollar(row[feesCol]);
      const amount = parseDollar(row[amountCol]);
      const cashBalance = parseDollar(row[cashBalCol]);
      const settlementDate = normalizeDate(row[settlementCol] ?? "");

      items.push({
        date,
        eventType,
        action,
        symbol,
        description,
        quantity,
        price,
        commission,
        fees,
        amount,
        cashBalance,
        settlementDate: settlementDate || null,
        option,
        rawRow: row,
      });
    }

    // Compute event type breakdown for diagnostics
    const typeCounts = new Map<string, number>();
    for (const item of items) {
      typeCounts.set(item.eventType, (typeCounts.get(item.eventType) ?? 0) + 1);
    }

    const breakdown = [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ");

    diagnostics.push({
      level: "info",
      message: `Parsed ${items.length} events. Breakdown: ${breakdown}. ${trailerRows.length} trailer rows.`,
    });

    // Date range — only consider valid ISO dates (YYYY-MM-DD)
    const validDates = items.map((i) => i.date).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    const dateRange = validDates.length > 0 ? `${validDates[0]} to ${validDates[validDates.length - 1]}` : "unknown";

    // Extract download timestamp from trailer
    let downloadTimestamp: string | undefined;
    for (const row of trailerRows) {
      const joined = row.join(" ");
      const dlMatch = joined.match(/date downloaded\s+(.+)/i);
      if (dlMatch) {
        downloadTimestamp = dlMatch[1].trim();
        break;
      }
    }

    return {
      parserId: this.id,
      metadata: {
        source: "fidelity",
        documentType: "activity",
        quoteDate: dateRange,
        downloadTimestamp,
        filename: context?.filename,
      },
      payload: { type: "activity", rows: items },
      trailerRows,
      diagnostics,
    };
  },
};
