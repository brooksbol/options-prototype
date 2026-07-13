/**
 * Lightweight activity CSV parser for scenario replay.
 *
 * Reuses the existing Fidelity activity parser logic but provides
 * a simpler interface: CSV string in → ActivityRow[] out.
 *
 * This avoids coupling to the full CsvParser registry/detection system.
 */

import { parseDollar, parseQuantity } from "../csv/fidelity/numericUtils";
import { parseOptionContract, type ParsedOptionContract } from "../csv/fidelity/parseOptionContract";

// Re-export the ActivityRow type for consumers
export type { ParsedOptionContract } from "../csv/fidelity/parseOptionContract";

// --- Types ---

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
  date: string;
  eventType: ActivityEventType;
  action: string;
  symbol: string;
  description: string;
  quantity: number;
  price: number | null;
  commission: number | null;
  fees: number | null;
  amount: number | null;
  cashBalance: number | null;
  option: ParsedOptionContract | null;
}

// --- Classification ---

function classifyAction(action: string): ActivityEventType {
  const a = action.toUpperCase();

  if (a.includes("YOU BOUGHT ASSIGNED PUTS")) return "shares_bought_assignment";
  if (a.includes("YOU SOLD ASSIGNED CALLS")) return "shares_sold_assignment";
  if (a.includes("YOU SOLD OPENING TRANSACTION")) return "sell_to_open";
  if (a.includes("YOU BOUGHT CLOSING TRANSACTION")) return "buy_to_close";
  if (a.includes("ASSIGNED")) return "assigned";
  if (a.includes("EXPIRED")) return "expired";
  if (a.includes("REINVESTMENT")) return "reinvestment";
  if (a.includes("DIVIDEND")) return "dividend";
  if (a.includes("REDEMPTION PAYOUT") && a.includes("TREAS")) return "treasury";
  if (a.includes("ELECTRONIC FUNDS TRANSFER")) return "cash_movement";
  if (a.includes("WIRE TRANSFER")) return "cash_movement";

  return "other";
}

// --- Date normalization ---

function normalizeDate(value: string): string {
  if (!value) return "";
  const trimmed = value.trim().replace(/^"|"$/g, "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) return `${match[3]}-${match[1]}-${match[2]}`;
  return trimmed;
}

// --- CSV line parser ---

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

// --- Option parsing from action text ---

function parseOptionFromAction(action: string): ParsedOptionContract | null {
  const match = action.match(/(PUT|CALL)\s+\((\w+)\)\s+.+?(\w{3})\s+(\d{1,2})\s+(\d{2})\s+\$?([\d.]+)/i);
  if (!match) return null;

  const [, type, underlying, month, day, year, strike] = match;
  const monthMap: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  const mm = monthMap[month.toUpperCase()] ?? "01";

  return {
    type: type.toUpperCase() as "CALL" | "PUT",
    underlying: underlying.toUpperCase(),
    expiration: `20${year}-${mm}-${day.padStart(2, "0")}`,
    strike: parseFloat(strike),
  };
}

// --- Trailer detection ---

function isTrailerRow(fields: string[]): boolean {
  if (fields.length === 0) return true;
  const first = (fields[0] ?? "").trim();
  if (!first) return true;
  if (first.startsWith("The data and information")) return true;
  if (first.toLowerCase().startsWith("date downloaded")) return true;
  return false;
}

// --- Main parser ---

/**
 * Parse a Fidelity activity CSV string into ActivityRow[].
 * Returns rows in document order (newest first, matching Fidelity export format).
 */
export function parseActivityCsv(csvContent: string): ActivityRow[] {
  const lines = csvContent
    .replace(/^\uFEFF/, "") // strip BOM
    .split(/\r?\n/)
    .filter((l) => l.trim());

  if (lines.length < 2) return [];

  // First line is header
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  const col = (search: string): number => headers.findIndex((h) => h.includes(search));
  const dateCol = col("run date") !== -1 ? col("run date") : col("date");
  const actionCol = col("action");
  const symbolCol = col("symbol");
  const descCol = col("description");
  const priceCol = col("price");
  const quantityCol = col("quantity");
  const commissionCol = col("commission");
  const feesCol = col("fees");
  const amountCol = col("amount");
  const cashBalCol = col("cash balance");

  const rows: ActivityRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    if (isTrailerRow(fields)) break;

    const rawDate = (fields[dateCol] ?? "").trim();
    const action = (fields[actionCol] ?? "").trim();
    if (!rawDate && !action) continue;

    const date = normalizeDate(rawDate);
    const symbol = (fields[symbolCol] ?? "").trim();
    const description = (fields[descCol] ?? "").trim();
    const eventType = classifyAction(action);

    // Parse option contract
    let option: ParsedOptionContract | null = null;
    if (symbol) option = parseOptionContract(symbol);
    if (!option) option = parseOptionFromAction(action);

    rows.push({
      date,
      eventType,
      action,
      symbol,
      description,
      quantity: parseQuantity(fields[quantityCol]),
      price: parseDollar(fields[priceCol]),
      commission: parseDollar(fields[commissionCol]),
      fees: parseDollar(fields[feesCol]),
      amount: parseDollar(fields[amountCol]),
      cashBalance: parseDollar(fields[cashBalCol]),
      option,
    });
  }

  return rows;
}
