/**
 * Fidelity Positions Parser.
 *
 * Detects and parses Fidelity's "Positions" CSV export into canonical HoldingRow types.
 *
 * Asset classes:
 *   - equity: ETFs and stocks
 *   - option: parsed via shared option contract utility
 *   - fixed_income: Treasury bills (maturity date extracted)
 *   - cash_equivalent: SPAXX money market
 *
 * Does NOT:
 *   - reconstruct strategy relationships (that's Option Summary's job)
 *   - compute yield-to-maturity or Treasury analytics
 *   - deduplicate positions
 *   - implement merge/reconciliation with other documents
 */

import type { CsvDocument } from "../reader";
import type { CsvParser, DetectionResult, ParsedDocument, ParserDiagnostic, ParseContext } from "../registry";
import { parseDollar, parsePercent, parseQuantity } from "./numericUtils";
import { parseOptionContract, type ParsedOptionContract } from "./parseOptionContract";

// --- Domain types ---

export type AssetClass = "equity" | "option" | "fixed_income" | "cash_equivalent";

export interface HoldingRow {
  /** Account number from the row */
  accountNumber: string;
  /** Account name from the row */
  accountName: string;
  /** Fidelity investment type classification */
  investmentType: string;
  /** Ticker symbol */
  symbol: string;
  /** Human-readable description */
  description: string;
  /** Canonical asset class */
  assetClass: AssetClass;
  /** Number of shares/contracts/face value */
  quantity: number;
  /** Last traded price */
  lastPrice: number | null;
  /** Last price change */
  lastPriceChange: number | null;
  /** Current market value */
  currentValue: number | null;
  /** Today's gain/loss in dollars */
  todayGainLoss: number | null;
  /** Today's gain/loss percent */
  todayGainLossPercent: number | null;
  /** Total gain/loss in dollars */
  totalGainLoss: number | null;
  /** Total gain/loss percent */
  totalGainLossPercent: number | null;
  /** Percent of account */
  percentOfAccount: number | null;
  /** Total cost basis */
  costBasisTotal: number | null;
  /** Average cost basis per unit */
  averageCostBasis: number | null;
  /** Option contract details (populated when assetClass === "option") */
  option: ParsedOptionContract | null;
  /** Treasury maturity date ISO string (populated when assetClass === "fixed_income") */
  maturityDate: string | null;
  /** Raw CSV row for debugging */
  rawRow: string[];
}

// --- Asset class detection ---

function classifyAssetClass(investmentType: string, symbol: string, _description: string): AssetClass {
  const typeNorm = investmentType.toLowerCase().trim();

  if (typeNorm === "cash" || symbol.toUpperCase().includes("SPAXX")) {
    return "cash_equivalent";
  }
  if (typeNorm === "bonds/fixed income" || typeNorm === "fixed income" || typeNorm === "bonds") {
    return "fixed_income";
  }
  if (typeNorm === "options" || typeNorm === "option") {
    return "option";
  }
  // ETFs, Stocks, Mutual Funds → equity
  return "equity";
}

// --- Treasury maturity extraction ---

/**
 * Extract maturity date from Treasury bill description.
 *
 * Patterns observed:
 *   "UNITED STATES TREAS BILLS ZERO CPN 0.00000% 07/09/2026"
 *   "UNITED STATES TREAS BILLS 0.00000% 09/10/2026 ZERO CPN"
 */
function extractMaturityDate(description: string): string | null {
  // Look for MM/DD/YYYY pattern in the description
  const match = description.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

// --- Detection ---

const REQUIRED_HEADERS = ["account number", "symbol", "description", "quantity", "current value"];
const SIGNAL_HEADERS = ["investment type", "last price", "cost basis total", "average cost basis"];

// --- Footer detection ---

function isTrailerRow(row: string[]): boolean {
  if (row.length === 0) return true;
  const firstCell = (row[0] ?? "").trim();
  if (firstCell === "") return true;
  if (firstCell.startsWith('"')) return true; // Quoted disclaimer blocks
  if (firstCell.toLowerCase().includes("the data and information")) return true;
  if (firstCell.toLowerCase().includes("brokerage services")) return true;
  if (firstCell.toLowerCase().includes("date downloaded")) return true;
  return false;
}

// --- Parser implementation ---

export const fidelityPositionsParser: CsvParser = {
  id: "fidelity_positions",
  label: "Fidelity Positions",

  detect(document: CsvDocument): DetectionResult {
    const reasons: string[] = [];
    const matchedHeaders: string[] = [];
    const missingHeaders: string[] = [];
    let confidence = 0;

    const headersLower = document.headers.map((h) => h.toLowerCase().trim());

    for (const required of REQUIRED_HEADERS) {
      if (headersLower.some((h) => h.includes(required))) {
        matchedHeaders.push(required);
        confidence += 0.15;
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

    // Check for investment type values that distinguish this from Option Summary
    const investTypeCol = headersLower.findIndex((h) => h.includes("investment type"));
    if (investTypeCol !== -1) {
      const types = document.rows.map((r) => (r[investTypeCol] ?? "").toLowerCase());
      if (types.some((t) => t.includes("etf") || t.includes("bonds") || t.includes("cash"))) {
        reasons.push("Contains investment type classifications (ETFs, Bonds, Cash)");
        confidence += 0.15;
      }
    }

    // Account number column is a strong positions-document signal
    if (headersLower.some((h) => h.includes("account number"))) {
      reasons.push("Contains Account Number column");
      confidence += 0.1;
    }

    confidence = Math.min(confidence, 1.0);

    if (matchedHeaders.length >= 4) {
      reasons.push(`Matched ${matchedHeaders.length} expected headers`);
    }

    return { confidence, reasons, matchedHeaders, missingHeaders };
  },

  parse(document: CsvDocument, context?: ParseContext): ParsedDocument {
    const items: HoldingRow[] = [];
    const trailerRows: string[][] = [];
    const diagnostics: ParserDiagnostic[] = [];

    const headersLower = document.headers.map((h) => h.toLowerCase().trim());

    // Map column indices
    const col = (search: string): number => headersLower.findIndex((h) => h.includes(search));
    const accountNumberCol = col("account number");
    const accountNameCol = col("account name");
    const investTypeCol = col("investment type");
    const symbolCol = col("symbol");
    const descCol = col("description");
    const quantityCol = col("quantity");
    const lastPriceCol = col("last price");
    const lastChangeCol = col("last price change");
    const currentValueCol = col("current value");
    const todayGainCol = col("today's gain/loss dollar");
    const todayGainPctCol = col("today's gain/loss percent");
    const totalGainCol = col("total gain/loss dollar");
    const totalGainPctCol = col("total gain/loss percent");
    const pctAccountCol = col("percent of account");
    const costBasisTotalCol = col("cost basis total");
    const avgCostCol = col("average cost basis");

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

      const symbol = (row[symbolCol] ?? "").trim();
      const description = (row[descCol] ?? "").trim();
      const investmentType = (row[investTypeCol] ?? "").trim();
      const accountNumber = (row[accountNumberCol] ?? "").trim();
      const accountName = (row[accountNameCol] ?? "").trim();

      if (!symbol && !description) {
        diagnostics.push({ level: "warning", row: i + 2, message: "Empty symbol and description, skipping" });
        continue;
      }

      const assetClass = classifyAssetClass(investmentType, symbol, description);

      // Parse option contract from symbol (Fidelity symbol format: -XLE260717P57)
      let option: ParsedOptionContract | null = null;
      if (assetClass === "option") {
        option = parseOptionContract(symbol);
        if (!option) {
          // Fallback: try parsing from description
          option = parseOptionContract(description);
        }
        if (!option) {
          diagnostics.push({ level: "warning", row: i + 2, message: `Could not parse option contract from "${symbol}" / "${description}"` });
        }
      }

      // Extract Treasury maturity
      let maturityDate: string | null = null;
      if (assetClass === "fixed_income") {
        maturityDate = extractMaturityDate(description);
        if (!maturityDate) {
          diagnostics.push({ level: "warning", row: i + 2, message: `Could not extract maturity date from "${description}"` });
        }
      }

      items.push({
        accountNumber,
        accountName,
        investmentType,
        symbol,
        description,
        assetClass,
        quantity: parseQuantity(row[quantityCol]),
        lastPrice: parseDollar(row[lastPriceCol]),
        lastPriceChange: parseDollar(row[lastChangeCol]),
        currentValue: parseDollar(row[currentValueCol]),
        todayGainLoss: parseDollar(row[todayGainCol]),
        todayGainLossPercent: parsePercent(row[todayGainPctCol]),
        totalGainLoss: parseDollar(row[totalGainCol]),
        totalGainLossPercent: parsePercent(row[totalGainPctCol]),
        percentOfAccount: parsePercent(row[pctAccountCol]),
        costBasisTotal: parseDollar(row[costBasisTotalCol]),
        averageCostBasis: parseDollar(row[avgCostCol]),
        option,
        maturityDate,
        rawRow: row,
      });
    }

    // Extract metadata
    const firstRow = items[0];
    const preamble = context?.preambleLines ?? [];
    let downloadTimestamp: string | undefined;
    for (const line of [...preamble, ...trailerRows.map((r) => r.join(" "))]) {
      const dlMatch = (typeof line === "string" ? line : "").match(/date downloaded\s+(.+)/i);
      if (dlMatch) {
        downloadTimestamp = dlMatch[1].trim();
        break;
      }
    }

    // Also check trailer rows for download timestamp
    if (!downloadTimestamp) {
      for (const row of trailerRows) {
        const joined = row.join(" ");
        const dlMatch = joined.match(/date downloaded\s+(.+)/i);
        if (dlMatch) {
          downloadTimestamp = dlMatch[1].trim();
          break;
        }
      }
    }

    diagnostics.push({
      level: "info",
      message: `Parsed ${items.length} holdings (${items.filter((i) => i.assetClass === "equity").length} equity, ${items.filter((i) => i.assetClass === "option").length} options, ${items.filter((i) => i.assetClass === "fixed_income").length} fixed income, ${items.filter((i) => i.assetClass === "cash_equivalent").length} cash), ${trailerRows.length} trailer rows`,
    });

    return {
      parserId: this.id,
      metadata: {
        source: "fidelity",
        documentType: "positions",
        accountNumber: firstRow?.accountNumber,
        accountName: firstRow?.accountName,
        downloadTimestamp,
        filename: context?.filename,
      },
      payload: { type: "holdings", rows: items },
      trailerRows,
      diagnostics,
    };
  },
};
