/**
 * Fidelity Activity CSV Import Adapter.
 *
 * Parses Fidelity's "Activity & Orders" CSV export into canonical Activity types.
 *
 * Fidelity CSV format (observed columns):
 *   Run Date, Account, Action, Symbol, Security Description, Security Type,
 *   Quantity, Price ($), Commission ($), Fees ($), Accrued Interest ($),
 *   Amount ($), Settlement Date
 *
 * This module is the ONLY place that knows about Fidelity column names.
 * Nothing outside this file should reference Fidelity-specific field names.
 */

import type { Activity, ActivityType, OptionActivityDetails, ImportResult, ImportError } from "../../domain/portfolio";

// --- CSV Parsing ---

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

// --- Fidelity-specific mapping ---

function mapAction(action: string): ActivityType {
  const normalized = action.toUpperCase().trim();

  if (normalized.includes("BOUGHT") || normalized === "BUY") return "BUY_TO_OPEN";
  if (normalized.includes("SOLD") || normalized === "SELL") return "SELL_TO_OPEN";
  if (normalized.includes("YOU BOUGHT") && normalized.includes("CLOSING")) return "BUY_TO_CLOSE";
  if (normalized.includes("YOU SOLD") && normalized.includes("OPENING")) return "SELL_TO_OPEN";
  if (normalized.includes("YOU SOLD") && normalized.includes("CLOSING")) return "SELL_TO_CLOSE";
  if (normalized.includes("YOU BOUGHT") && normalized.includes("OPENING")) return "BUY_TO_OPEN";
  if (normalized.includes("ASSIGNED")) return "ASSIGNED";
  if (normalized.includes("EXPIRED")) return "EXPIRED";
  if (normalized.includes("DIVIDEND")) return "DIVIDEND";
  if (normalized.includes("REINVESTMENT")) return "DIVIDEND";

  return "OTHER";
}

function parseDollar(value: string): number {
  if (!value) return 0;
  // Remove $, commas, parentheses (negative)
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    return -parseFloat(cleaned.slice(1, -1));
  }
  return parseFloat(cleaned) || 0;
}

function parseQuantity(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Attempt to parse option details from Fidelity's symbol/description.
 * Fidelity option symbols follow patterns like:
 *   -XLE260718C56.5  (PUT/CALL with strike and date)
 *   Description: "PUT (XLE) ENERGY SELECT SECTOR JUL 18 26 $56.5"
 */
function parseOptionDetails(
  symbol: string,
  description: string
): OptionActivityDetails | null {
  // Try description-based parsing first (more reliable)
  // Pattern: "PUT (SYM) ... MON DD YY $STRIKE" or "CALL (SYM) ..."
  const descMatch = description.match(
    /^(PUT|CALL)\s+\((\w+)\)\s+.*?(\w{3})\s+(\d{1,2})\s+(\d{2})\s+\$?([\d.]+)/i
  );

  if (descMatch) {
    const [, typeStr, underlying, month, day, year, strike] = descMatch;
    const monthMap: Record<string, string> = {
      JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
      JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
    };
    const mm = monthMap[month.toUpperCase()] ?? "01";
    const expiration = `20${year}-${mm}-${day.padStart(2, "0")}`;

    return {
      type: typeStr.toUpperCase() as "CALL" | "PUT",
      strike: parseFloat(strike),
      expiration,
      underlying: underlying.toUpperCase(),
    };
  }

  // Fallback: try symbol-based parsing
  // Pattern: -SYM260718C56.5 or -SYM260718P56.5
  const symMatch = symbol.match(/-?(\w+?)(\d{6})([CP])([\d.]+)/i);
  if (symMatch) {
    const [, underlying, dateStr, typeChar, strike] = symMatch;
    const year = `20${dateStr.slice(0, 2)}`;
    const month = dateStr.slice(2, 4);
    const day = dateStr.slice(4, 6);
    const expiration = `${year}-${month}-${day}`;

    return {
      type: typeChar.toUpperCase() === "C" ? "CALL" : "PUT",
      strike: parseFloat(strike),
      expiration,
      underlying: underlying.toUpperCase(),
    };
  }

  return null;
}

// --- Main export ---

/**
 * Parse a Fidelity Activity CSV string into canonical Activity items.
 */
export function parseFidelityActivity(
  csvContent: string,
  sourceName: string = "fidelity-activity.csv"
): ImportResult<Activity> {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
  const items: Activity[] = [];
  const errors: ImportError[] = [];

  if (lines.length === 0) {
    return { items, errors, source: sourceName, importedAt: new Date().toISOString() };
  }

  // Find header row (skip any preamble lines Fidelity adds)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].toLowerCase().includes("run date") || lines[i].toLowerCase().includes("date")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // Assume first line is header
    headerIndex = 0;
  }

  const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());

  // Map column indices
  const col = (name: string): number => headers.findIndex((h) => h.includes(name));
  const dateCol = col("run date") !== -1 ? col("run date") : col("date");
  const actionCol = col("action");
  const symbolCol = col("symbol");
  const descCol = col("description") !== -1 ? col("description") : col("security description");
  const qtyCol = col("quantity");
  const priceCol = col("price");
  const amountCol = col("amount");

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip footer/summary lines
    if (line.toLowerCase().startsWith("total") || line.startsWith("***")) continue;

    try {
      const fields = parseCSVLine(line);

      const date = fields[dateCol] ?? "";
      const action = fields[actionCol] ?? "";
      const symbol = fields[symbolCol] ?? "";
      const description = fields[descCol] ?? "";
      const quantity = parseQuantity(fields[qtyCol] ?? "");
      const price = parseDollar(fields[priceCol] ?? "");
      const amount = parseDollar(fields[amountCol] ?? "");

      if (!date || !action) {
        errors.push({ row: i + 1, rawContent: line, reason: "Missing date or action" });
        continue;
      }

      // Normalize date to ISO format (Fidelity uses MM/DD/YYYY)
      const dateParts = date.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const isoDate = dateParts
        ? `${dateParts[3]}-${dateParts[1].padStart(2, "0")}-${dateParts[2].padStart(2, "0")}`
        : date;

      const optionDetails = parseOptionDetails(symbol, description);
      const isOption = optionDetails !== null;

      items.push({
        date: isoDate,
        type: mapAction(action),
        symbol: isOption ? (optionDetails?.underlying ?? symbol) : symbol,
        description,
        quantity,
        price,
        amount,
        isOption,
        optionDetails: optionDetails ?? undefined,
      });
    } catch (err) {
      errors.push({
        row: i + 1,
        rawContent: line,
        reason: err instanceof Error ? err.message : "Parse error",
      });
    }
  }

  return {
    items,
    errors,
    source: sourceName,
    importedAt: new Date().toISOString(),
  };
}
