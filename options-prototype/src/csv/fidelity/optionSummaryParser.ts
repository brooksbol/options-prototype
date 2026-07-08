/**
 * Fidelity Option Summary Parser.
 *
 * Detects and parses Fidelity's "Option Summary" CSV export.
 *
 * Detection signals:
 *   - Title line contains "Option Summary"
 *   - Header row contains: Symbol, Description, Strategy, Expiration & Strike
 *   - Quote data line present
 *
 * Key behaviors:
 *   - Does NOT deduplicate share rows (Fidelity repeats shares per strategy view)
 *   - Detects and separates footer/trailer rows (disclaimers)
 *   - Normalizes all numeric fields via shared utils
 *   - Parses option contract strings via shared utility
 */

import type { CsvDocument } from "../reader";
import type { CsvParser, DetectionResult, ParsedDocument, ParserDiagnostic, ParseContext } from "../registry";
import { parseDollar, parsePercent, parseQuantity } from "./numericUtils";
import { parseOptionContract, type ParsedOptionContract } from "./parseOptionContract";

// --- Domain types for Option Summary ---

export type StrategyType = "CoveredCall" | "CashCoveredPut" | "UnpairedShares" | "Unknown";

export interface OptionSummaryRow {
  symbol: string;
  description: string;
  strategy: StrategyType;
  positionType: "share" | "option";
  quantity: number;
  bid: number | null;
  ask: number | null;
  costBasis: number | null;
  marketValue: number | null;
  averageCost: number | null;
  totalGainLoss: number | null;
  totalGainLossPercent: number | null;
  last: number | null;
  change: number | null;
  changePercent: number | null;
  marginRequirement: number | null;
  option: ParsedOptionContract | null;
  rawRow: string[];
}

// --- Strategy mapping ---

function mapStrategy(value: string): StrategyType {
  const normalized = value.trim().toLowerCase();
  if (normalized === "covered call") return "CoveredCall";
  if (normalized === "cash covered put" || normalized === "cash-covered put") return "CashCoveredPut";
  if (normalized === "unpaired shares") return "UnpairedShares";
  return "Unknown";
}

// --- Expected headers ---

const REQUIRED_HEADERS = ["symbol", "description", "strategy", "expiration & strike"];

// --- Footer detection ---

function isTrailerRow(row: string[]): boolean {
  if (row.length === 0) return true;
  const firstCell = (row[0] ?? "").trim().toLowerCase();

  // Common Fidelity footer patterns
  if (firstCell === "") return true;
  if (firstCell.startsWith("the data and information")) return true;
  if (firstCell.startsWith("fidelity brokerage")) return true;
  if (firstCell.startsWith("*")) return true;
  if (firstCell.startsWith("views and opinions")) return true;
  if (firstCell.includes("not a recommendation")) return true;
  if (firstCell.includes("copyright")) return true;
  if (firstCell.includes("fidelity investments")) return true;

  return false;
}

// --- Parser implementation ---

export const fidelityOptionSummaryParser: CsvParser = {
  id: "fidelity_option_summary",
  label: "Fidelity Option Summary",

  detect(document: CsvDocument): DetectionResult {
    const reasons: string[] = [];
    const matchedHeaders: string[] = [];
    const missingHeaders: string[] = [];
    let confidence = 0;

    // Check headers
    const headersLower = document.headers.map((h) => h.toLowerCase().trim());

    for (const required of REQUIRED_HEADERS) {
      if (headersLower.some((h) => h.includes(required))) {
        matchedHeaders.push(required);
        confidence += 0.2;
      } else {
        missingHeaders.push(required);
      }
    }

    // Check for "Option Summary" in the raw content (often in a preamble row)
    // We can check if any row before the headers contains "option summary"
    const allContent = document.rows.map((r) => r.join(" ")).join(" ").toLowerCase();
    const headerContent = document.headers.join(" ").toLowerCase();

    if (headerContent.includes("option summary") || allContent.includes("option summary")) {
      reasons.push("Document contains 'Option Summary' identifier");
      confidence += 0.1;
    }

    // Check for strategy column values
    const strategyColIdx = headersLower.findIndex((h) => h.includes("strategy"));
    if (strategyColIdx !== -1) {
      const strategies = document.rows.map((r) => (r[strategyColIdx] ?? "").toLowerCase());
      if (strategies.some((s) => s.includes("covered call") || s.includes("cash covered put"))) {
        reasons.push("Contains strategy types (Covered Call / Cash Covered Put)");
        confidence += 0.1;
      }
    }

    // Cap at 1.0
    confidence = Math.min(confidence, 1.0);

    if (matchedHeaders.length >= 3) {
      reasons.push(`Matched ${matchedHeaders.length}/${REQUIRED_HEADERS.length} required headers`);
    }

    return { confidence, reasons, matchedHeaders, missingHeaders };
  },

  parse(document: CsvDocument, context?: ParseContext): ParsedDocument {
    const items: OptionSummaryRow[] = [];
    const trailerRows: string[][] = [];
    const diagnostics: ParserDiagnostic[] = [];

    const headersLower = document.headers.map((h) => h.toLowerCase().trim());

    // Map column indices
    const col = (search: string): number => headersLower.findIndex((h) => h.includes(search));
    const symbolCol = col("symbol");
    const descCol = col("description");
    const strategyCol = col("strategy");
    const expirationCol = col("expiration");
    const quantityCol = col("quantity");
    const bidCol = col("bid");
    const askCol = col("ask");
    const costBasisCol = col("cost basis");
    const marketValueCol = col("market value");
    const avgCostCol = col("avg");
    const gainLossCol = col("$ total gain");
    const gainLossPctCol = col("% total gain");
    const lastCol = col("last");
    const changeCol = headersLower.findIndex((h) => h === "change" || h === "$ change");
    const changePctCol = col("% change");
    const marginCol = col("margin");

    let inTrailer = false;

    for (let i = 0; i < document.rows.length; i++) {
      const row = document.rows[i];

      // Once we hit trailer, all remaining rows are trailer
      if (inTrailer) {
        trailerRows.push(row);
        continue;
      }

      // Check if this is a trailer row
      if (isTrailerRow(row)) {
        inTrailer = true;
        trailerRows.push(row);
        continue;
      }

      const symbol = (row[symbolCol] ?? "").trim();
      if (!symbol) {
        diagnostics.push({ level: "warning", row: i + 2, message: "Empty symbol, skipping row" });
        continue;
      }

      const expirationStr = (row[expirationCol] ?? "").trim();
      const option = parseOptionContract(expirationStr);
      const positionType = option ? "option" : "share";
      const strategy = mapStrategy(row[strategyCol] ?? "");

      if (strategy === "Unknown" && row[strategyCol]?.trim()) {
        diagnostics.push({
          level: "warning",
          row: i + 2,
          message: `Unknown strategy: "${row[strategyCol]?.trim()}"`,
        });
      }

      items.push({
        symbol,
        description: (row[descCol] ?? "").trim(),
        strategy,
        positionType,
        quantity: parseQuantity(row[quantityCol]),
        bid: parseDollar(row[bidCol]),
        ask: parseDollar(row[askCol]),
        costBasis: parseDollar(row[costBasisCol]),
        marketValue: parseDollar(row[marketValueCol]),
        averageCost: parseDollar(row[avgCostCol]),
        totalGainLoss: parseDollar(row[gainLossCol]),
        totalGainLossPercent: parsePercent(row[gainLossPctCol]),
        last: parseDollar(row[lastCol]),
        change: parseDollar(changeCol !== -1 ? row[changeCol] : undefined),
        changePercent: parsePercent(row[changePctCol]),
        marginRequirement: parseDollar(row[marginCol]),
        option,
        rawRow: row,
      });
    }

    diagnostics.push({
      level: "info",
      message: `Parsed ${items.length} position rows, ${trailerRows.length} trailer rows`,
    });

    // Extract metadata from context (preamble)
    const preamble = context?.preambleLines ?? [];
    let quoteDate: string | undefined;
    let accountNumber: string | undefined;
    for (const line of preamble) {
      const dateMatch = line.match(/quote data as of (.+)/i);
      if (dateMatch) quoteDate = dateMatch[1].trim().replace(/\.$/, "");
      const acctMatch = line.match(/option summary\s+(\w+)/i);
      if (acctMatch) accountNumber = acctMatch[1];
    }

    return {
      parserId: this.id,
      metadata: {
        source: "fidelity",
        documentType: "option_summary",
        accountNumber,
        quoteDate,
        filename: context?.filename,
      },
      payload: { type: "option_summary", rows: items },
      trailerRows,
      diagnostics,
    };
  },
};
