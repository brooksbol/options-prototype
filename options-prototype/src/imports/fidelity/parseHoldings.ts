/**
 * Fidelity Holdings CSV Import Adapter.
 *
 * Parses Fidelity's "Positions" CSV export into canonical Holding types.
 *
 * Fidelity CSV format (observed columns):
 *   Account Name/Number, Symbol, Description, Quantity, Last Price,
 *   Last Price Change, Current Value, Today's Gain/Loss Dollar,
 *   Today's Gain/Loss Percent, Total Gain/Loss Dollar,
 *   Total Gain/Loss Percent, Percent Of Account, Cost Basis,
 *   Cost Basis Per Share, Type
 *
 * This module is the ONLY place that knows about Fidelity holdings column names.
 */

import type { Holding, OptionHoldingDetails, ImportResult, ImportError } from "../../domain/portfolio";

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

function parseDollar(value: string): number {
  if (!value || value === "n/a" || value === "--") return 0;
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    return -parseFloat(cleaned.slice(1, -1));
  }
  return parseFloat(cleaned) || 0;
}

function parseQuantity(value: string): number {
  if (!value || value === "n/a") return 0;
  const cleaned = value.replace(/,/g, "").trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Attempt to parse option details from Fidelity's symbol/description.
 * Fidelity option symbols: -XLE260718C56.5
 * Descriptions: "PUT (XLE) ENERGY SELECT SECTOR JUL 18 26 $56.5"
 */
function parseOptionDetails(
  symbol: string,
  description: string
): OptionHoldingDetails | null {
  // Description-based parsing
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

  // Symbol-based parsing: -SYM260718C56.5
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
 * Parse a Fidelity Holdings/Positions CSV string into canonical Holding items.
 */
export function parseFidelityHoldings(
  csvContent: string,
  sourceName: string = "fidelity-holdings.csv"
): ImportResult<Holding> {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
  const items: Holding[] = [];
  const errors: ImportError[] = [];

  if (lines.length === 0) {
    return { items, errors, source: sourceName, importedAt: new Date().toISOString() };
  }

  // Find header row (skip preamble)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].toLowerCase().includes("symbol") && lines[i].toLowerCase().includes("description")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());

  // Map column indices
  const col = (name: string): number => headers.findIndex((h) => h.includes(name));
  const symbolCol = col("symbol");
  const descCol = col("description");
  const qtyCol = col("quantity");
  const valueCol = col("current value") !== -1 ? col("current value") : col("value");
  const costBasisCol = col("cost basis per share") !== -1 ? col("cost basis per share") : col("cost basis");

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip footer/summary lines
    if (line.toLowerCase().startsWith("total") || line.startsWith("***")) continue;
    if (line.toLowerCase().includes("pending activity")) continue;

    try {
      const fields = parseCSVLine(line);

      const symbol = fields[symbolCol] ?? "";
      const description = fields[descCol] ?? "";
      const quantity = parseQuantity(fields[qtyCol] ?? "");
      const marketValue = parseDollar(fields[valueCol] ?? "");
      const costBasis = parseDollar(fields[costBasisCol] ?? "");

      if (!symbol || symbol === "n/a") continue;

      // Skip cash positions
      if (symbol.toUpperCase().includes("CASH") || symbol.toUpperCase().includes("SPAXX")) continue;

      const optionDetails = parseOptionDetails(symbol, description);
      const isOption = optionDetails !== null;

      items.push({
        symbol: isOption ? symbol : symbol.toUpperCase(),
        description,
        quantity,
        marketValue,
        costBasis,
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
