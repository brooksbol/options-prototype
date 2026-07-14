/**
 * Fidelity Balances Parser.
 *
 * Parses Fidelity's "Balances" CSV export into structured balance data.
 *
 * Fidelity Balances CSV format:
 *   - Key-value oriented (label, amount, day change)
 *   - Preamble: "Brokerage" header, account name/number line
 *   - Headers row: typically "Description", "Amount", "Day Change" (or similar)
 *   - Balance rows: indented sub-items under parent categories
 *   - Footer: Fidelity disclaimers
 *
 * Extracts:
 *   - Available to Trade (top-level)
 *   - All Settled (sub-item of Available to Trade)
 *   - Cash and Credits
 *   - Total Account Value
 *   - Available to Withdraw
 *   - Value of Investments (stocks, bonds, etc.)
 *
 * The authoritative deployable cash is "Available to Trade" with the "All Settled" sub-value.
 */

import type { CsvDocument } from "../reader";
import type { CsvParser, DetectionResult, ParsedDocument, ParserDiagnostic, ParseContext } from "../registry";
import { parseDollar } from "./numericUtils";

// --- Domain types ---

export interface BalancesRow {
  label: string;
  amount: number | null;
  dayChange: number | null;
  isSubItem: boolean;
  rawRow: string[];
}

export interface ParsedBalances {
  availableToTrade: number | null;
  availableToTradeAllSettled: number | null;
  cashAndCredits: number | null;
  totalAccountValue: number | null;
  valueOfInvestments: number | null;
  availableToWithdraw: number | null;
  accountName: string | null;
  accountNumber: string | null;
  allRows: BalancesRow[];
}

// --- Detection ---

const HEADER_SIGNALS = ["description", "amount"];
const CONTENT_SIGNALS = ["available to trade", "cash and credits", "total account value"];

// --- Footer detection ---

function isTrailerRow(row: string[]): boolean {
  if (row.length === 0) return true;
  const firstCell = (row[0] ?? "").trim().toLowerCase();
  if (firstCell === "") return true;
  if (firstCell.startsWith("the data and information")) return true;
  if (firstCell.startsWith("fidelity brokerage")) return true;
  if (firstCell.includes("not a recommendation")) return true;
  if (firstCell.includes("views and opinions")) return true;
  if (firstCell.includes("copyright")) return true;
  if (firstCell.includes("fidelity investments")) return true;
  return false;
}

// --- Account extraction ---

function extractAccountInfo(document: CsvDocument): { accountName: string | null; accountNumber: string | null } {
  // Look for account number pattern in first few rows
  for (const row of document.rows.slice(0, 5)) {
    for (const cell of row) {
      // Fidelity account numbers: "XXXX-1234" or similar
      const acctMatch = cell.match(/([A-Z0-9]{3,4}-[A-Z0-9]{3,6})/);
      if (acctMatch) {
        // First cell is usually account name
        const name = row[0]?.trim() || null;
        return { accountName: name, accountNumber: acctMatch[1] };
      }
    }
  }
  return { accountName: null, accountNumber: null };
}

// --- Parser ---

export const fidelityBalancesParser: CsvParser = {
  id: "fidelity_balances",
  label: "Fidelity Balances",

  detect(document: CsvDocument): DetectionResult {
    const headersLower = document.headers.map((h) => h.toLowerCase().trim());
    const matchedHeaders: string[] = [];
    const missingHeaders: string[] = [];
    const reasons: string[] = [];
    let confidence = 0;

    // Check header signals
    for (const signal of HEADER_SIGNALS) {
      if (headersLower.some((h) => h.includes(signal))) {
        matchedHeaders.push(signal);
        confidence += 0.15;
      } else {
        missingHeaders.push(signal);
      }
    }

    // Check content signals (look for balance-specific labels in the data)
    const allContent = document.rows.map((r) => r.join(" ")).join(" ").toLowerCase();
    let contentMatches = 0;
    for (const signal of CONTENT_SIGNALS) {
      if (allContent.includes(signal)) {
        contentMatches++;
        confidence += 0.15;
      }
    }
    if (contentMatches > 0) {
      reasons.push(`Contains ${contentMatches} balance-specific labels`);
    }

    // Check for "Brokerage" identifier often in preamble
    if (allContent.includes("brokerage") || headersLower.some((h) => h.includes("brokerage"))) {
      reasons.push("Contains brokerage identifier");
      confidence += 0.05;
    }

    // Distinguish from other Fidelity exports — balances should NOT have "strategy" or "expiration & strike"
    if (headersLower.some((h) => h.includes("strategy") || h.includes("expiration"))) {
      confidence -= 0.3; // This is likely Option Summary, not Balances
    }

    confidence = Math.max(0, Math.min(confidence, 1.0));

    if (matchedHeaders.length > 0) {
      reasons.push(`Matched ${matchedHeaders.length} header signals`);
    }

    return { confidence, reasons, matchedHeaders, missingHeaders };
  },

  parse(document: CsvDocument, context?: ParseContext): ParsedDocument {
    const diagnostics: ParserDiagnostic[] = [];
    const trailerRows: string[][] = [];
    const allRows: BalancesRow[] = [];

    const { accountName, accountNumber } = extractAccountInfo(document);

    // Parse balance rows
    let availableToTrade: number | null = null;
    let availableToTradeAllSettled: number | null = null;
    let cashAndCredits: number | null = null;
    let totalAccountValue: number | null = null;
    let valueOfInvestments: number | null = null;
    let availableToWithdraw: number | null = null;

    let lastParentLabel = "";

    for (let i = 0; i < document.rows.length; i++) {
      const row = document.rows[i];

      if (isTrailerRow(row)) {
        trailerRows.push(row);
        continue;
      }

      const label = (row[0] ?? "").trim();
      const amountStr = row[1] ?? "";
      const dayChangeStr = row[2] ?? "";

      if (!label) continue;

      const isSubItem = label.startsWith(" ") || label.startsWith("\t");
      const normalizedLabel = label.replace(/^\s+/, "").toLowerCase();
      const amount = parseDollar(amountStr);
      const dayChange = parseDollar(dayChangeStr);

      allRows.push({ label: label.trim(), amount, dayChange, isSubItem, rawRow: row });

      // Match known balance fields
      if (normalizedLabel.includes("available to trade") && !isSubItem) {
        availableToTrade = amount;
        lastParentLabel = "available_to_trade";
      } else if (normalizedLabel.includes("all settled") && (isSubItem || lastParentLabel === "available_to_trade")) {
        availableToTradeAllSettled = amount;
      } else if (normalizedLabel.includes("cash and credits") || normalizedLabel.includes("cash & credits")) {
        cashAndCredits = amount;
        lastParentLabel = "cash_and_credits";
      } else if (normalizedLabel.includes("total account value")) {
        totalAccountValue = amount;
        lastParentLabel = "total_account_value";
      } else if (normalizedLabel.includes("value of investments") || normalizedLabel.includes("investments")) {
        if (!normalizedLabel.includes("total") && lastParentLabel !== "total_account_value") {
          // Skip if this is a generic row
        }
        if (normalizedLabel.startsWith("value of") || (isSubItem && lastParentLabel === "total_account_value")) {
          valueOfInvestments = amount;
        }
      } else if (normalizedLabel.includes("available to withdraw")) {
        availableToWithdraw = amount;
        lastParentLabel = "available_to_withdraw";
      } else {
        lastParentLabel = normalizedLabel;
      }
    }

    // Diagnostics
    if (availableToTrade == null && availableToTradeAllSettled == null) {
      diagnostics.push({ level: "error", message: "Could not extract 'Available to Trade' from balances." });
    }
    if (accountNumber) {
      diagnostics.push({ level: "info", message: `Account: ${accountNumber}` });
    }

    // Use "All Settled" preferentially; fall back to top-level "Available to Trade"
    const authoritative = availableToTradeAllSettled ?? availableToTrade;
    if (authoritative != null) {
      diagnostics.push({ level: "info", message: `Authoritative deployable cash: $${authoritative.toLocaleString()}` });
    }

    const balances: ParsedBalances = {
      availableToTrade,
      availableToTradeAllSettled,
      cashAndCredits,
      totalAccountValue,
      valueOfInvestments,
      availableToWithdraw,
      accountName,
      accountNumber,
      allRows,
    };

    return {
      parserId: "fidelity_balances",
      metadata: {
        source: "fidelity",
        documentType: "fidelity_balances",
        accountNumber: accountNumber ?? undefined,
        accountName: accountName ?? undefined,
        filename: context?.filename,
      },
      payload: { type: "balances", rows: [balances] as unknown[] },
      trailerRows,
      diagnostics,
    };
  },
};
