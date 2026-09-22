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
  /**
   * Legacy/non-margin export field: "Available to trade (all settled)".
   * Present only in the legacy (cash-account) Balances layout. This is a DISTINCT
   * broker fact — it is NOT a normalized target into which current-format margin
   * fields are folded. See deriveDeployableCash() for regime-aware Deployable.
   */
  availableToTradeAllSettled: number | null;
  cashAndCredits: number | null;
  totalAccountValue: number | null;
  valueOfInvestments: number | null;
  availableToWithdraw: number | null;
  // --- Distinct broker facts (current margin-format export). Preserved verbatim;
  //     never collapsed into one another or into availableToTradeAllSettled. ---
  /** Current-format field: settled cash available to trade. Distinct broker fact. */
  settledCash?: number | null;
  /** Current-format field: non-margin buying power. Distinct broker fact — NOT unlevered Deployable. */
  nonMarginBuyingPower?: number | null;
  /** Current-format field: margin buying power. Distinct broker fact — leveraged capacity, never Deployable. */
  marginBuyingPower?: number | null;
  /** Current-format field: available without margin impact. Distinct broker fact — the unlevered Deployable source in the MARGIN regime. */
  availableWithoutMarginImpact?: number | null;
  /** Current-format field: cash reserved for open options strategies. Distinct broker fact. */
  cashReservedForOptions?: number | null;
  /**
   * Structural regime evidence, captured by LABEL/SECTION PRESENCE — independent of
   * whether a numeric amount parsed. BUG-022: regime is determined by presence of
   * margin-format vs legacy evidence, NOT by any field being numerically non-null. A
   * present-but-blank margin field must still mark the margin regime so a margin export
   * never falls through to legacy-cash Deployable semantics.
   */
  regimeEvidence: BalanceRegimeEvidence;
  accountName: string | null;
  accountNumber: string | null;
  allRows: BalancesRow[];
}

/**
 * Presence-of-evidence flags used to classify the account/export regime. These record
 * that a row/section characteristic of a format appeared in the export, regardless of
 * whether it carried a numeric value.
 */
export interface BalanceRegimeEvidence {
  /**
   * A margin-format capacity label or the "MARGIN STATUS" section appeared — e.g.
   * "Margin buying power", "Non-margin buying power", "Available without margin impact",
   * or a "MARGIN STATUS" section header. Presence alone (even blank amounts) marks margin.
   */
  marginFormatPresent: boolean;
  /**
   * A legacy "all settled" row appeared, in either real shape: the combined single row
   * "Available to trade (all settled)", or a separated "Available to Trade" header with
   * an indented "All Settled" sub-row. Presence is independent of its numeric value.
   */
  legacyAllSettledPresent: boolean;
  /**
   * An "Available to trade" row carrying a value appeared — the current non-margin cash
   * layout's headline tradable figure (e.g. "Available to trade,458.42"). This is the CASH
   * regime's Deployable source. Optional for backward compatibility with older constructed
   * fixtures; absent is treated as false. Presence is independent of the legacy
   * "(all settled)" label: Fidelity's Sep-2026 cash-account export dropped that suffix and
   * broke "Settled cash" out into a separate row.
   */
  availableToTradePresent?: boolean;
}

/**
 * Account/export regime, classified from the PRESENCE of broker balance fields
 * (not from equity percentage — a margin account can report 100% equity, and the
 * legacy cash export omits equity percentage entirely).
 *
 * - LEGACY_CASH: non-margin (cash) layout — an "Available to trade" row present in EITHER
 *   the legacy "(all settled)" form or the current plain form, and no margin-format
 *   evidence. (Named LEGACY_CASH for contract stability; it means "cash regime.")
 * - MARGIN: current margin-format layout — margin-format evidence present
 *   (Non-margin buying power / Margin buying power / Available without margin impact /
 *   MARGIN STATUS section), by presence alone even when values are blank.
 * - INDETERMINATE: regime cannot be established from the parsed fields.
 */
export type BalanceRegime = "LEGACY_CASH" | "MARGIN" | "INDETERMINATE";

/**
 * Classify the account/export regime from structural field/section PRESENCE
 * (BUG-022) — NOT from any field being numerically non-null.
 *
 * - MARGIN wins on presence: if margin-format evidence appeared at all (including a
 *   present-but-blank "Available without margin impact", or a "MARGIN STATUS" section),
 *   the regime is MARGIN. This prevents a margin export with blank capacity values from
 *   falling through to LEGACY_CASH and reporting legacy-cash Deployable.
 * - LEGACY_CASH: the legacy "Available to trade (all settled)" label appeared and no
 *   margin-format evidence appeared.
 * - INDETERMINATE: neither presence signal is available (fail-closed).
 *
 * Account equity percentage is intentionally NOT used (a margin account can report 100%
 * equity; the legacy export omits the field entirely).
 */
export function classifyBalanceRegime(b: ParsedBalances): BalanceRegime {
  if (b.regimeEvidence.marginFormatPresent) return "MARGIN";
  // Non-margin (cash) regime, in either export shape:
  //   - legacy label "Available to trade (all settled)" (pre-Sep-2026 cash export), OR
  //   - current label "Available to trade" with "Settled cash" broken out separately
  //     (Fidelity's Sep-2026 cash-account export format change).
  // Both are the same broker concept (the account's headline tradable figure) and both are
  // NON-margin, so they classify as the same LEGACY_CASH (cash) regime. Margin wins on
  // presence above, so this can never capture a margin export.
  if (b.regimeEvidence.legacyAllSettledPresent || b.regimeEvidence.availableToTradePresent) return "LEGACY_CASH";
  return "INDETERMINATE";
}

/**
 * Regime-aware Wheelwright unlevered Deployable cash (BUG-022).
 *
 * Deployable is Wheelwright's unlevered put-writing capacity. It is derived from the
 * appropriate broker fact for the account regime — never by folding distinct fields:
 *
 *   - LEGACY_CASH  → "Available to trade (all settled)" (legacy) or "Available to trade"
 *                    (current Sep-2026 cash layout) — the non-margin account's headline
 *                    tradable figure. Prefers the settled figure when both are present.
 *   - MARGIN       → "Available without margin impact"      (broker's no-margin tradable figure)
 *   - INDETERMINATE→ null                                   (fail-closed; readiness blocks)
 *
 * Cash-regime label history: the pre-Sep-2026 cash export used a single "Available to trade
 * (all settled)" row; the Sep-2026 format split it into "Available to trade" (headline
 * tradable) plus a separate "Settled cash" row. Both headline forms are the same Deployable
 * concept, so CASH Deployable prefers availableToTradeAllSettled and falls back to
 * availableToTrade. "Settled cash" is a settlement/withdrawal-oriented figure and is NOT
 * Deployable (docs/56-fidelity-account-regime-balance-semantics-2026-09-19.md).
 *
 * "Non-margin buying power" is NEVER used as unlevered Deployable: on a real margin
 * account it exceeds both settled cash and available-without-margin-impact and reflects
 * margin-inclusive capacity (BUG-022, PTS specimen: NMBP $6,734.37 while AWMI/settled $0).
 *
 * A present-but-blank margin field yields null here (the MARGIN regime is established by
 * presence, but the Deployable value is absent) — i.e. fail-closed, not a fall-through to
 * legacy semantics.
 *
 * Reserve-netting discipline (epistemically bounded):
 *   - "Available without margin impact" is the current reasoned broker-authoritative
 *     Deployable field for the MARGIN regime.
 *   - This function does NOT independently recompute or subtract "Cash reserved for
 *     options strategies"; the reserve is preserved only as a distinct broker fact.
 *   - Fidelity's internal reserve-netting formula is NOT proven from the available
 *     specimens. We deliberately do not double-adjust for the reserve absent authoritative
 *     evidence — this is a chosen discipline, NOT a claim that Fidelity has already netted it.
 */
export function deriveDeployableCash(b: ParsedBalances): number | null {
  switch (classifyBalanceRegime(b)) {
    case "LEGACY_CASH":
      // Prefer the legacy "(all settled)" settled figure when present (pre-Sep-2026 layout
      // may expose BOTH a larger headline "Available to trade" and the smaller settled
      // "(all settled)" row; the settled figure is the ratified Deployable authority). Fall
      // back to "Available to trade" when there is no all-settled row — the Sep-2026 one-row
      // cash layout, where "Available to trade" IS the tradable figure (with "Settled cash"
      // broken out as a separate withdrawal-oriented row that is NOT Deployable).
      return b.availableToTradeAllSettled ?? b.availableToTrade ?? null;
    case "MARGIN":
      return b.availableWithoutMarginImpact ?? null;
    case "INDETERMINATE":
    default:
      return null;
  }
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

const ACCOUNT_NUMBER_PATTERN = /([A-Z0-9]{3,4}-[A-Z0-9]{3,6})/;

function extractAccountInfo(
  document: CsvDocument,
  context?: ParseContext
): { accountName: string | null; accountNumber: string | null } {
  // Fidelity's account identity ("Account Name / Account Number,<Name> - <XXXX-1234>")
  // can land in DIFFERENT places depending on export layout: for the margin layout it
  // survives into document.rows, but for the legacy layout preprocessCsv strips it into
  // the preamble (the header row appears after it). Search both, plus the header row, so
  // ParsedBalances.accountNumber is correct for every layout — the account reference is
  // authoritative account-resolution evidence downstream and must not be layout-fragile.

  // 1) Preamble lines (legacy layout). Preserve the whole line as the "name" context.
  for (const line of context?.preambleLines ?? []) {
    const acctMatch = line.match(ACCOUNT_NUMBER_PATTERN);
    if (acctMatch) {
      return { accountName: line.trim() || null, accountNumber: acctMatch[1] };
    }
  }

  // 2) Header row (in case the account cell became a header cell).
  for (const cell of document.headers) {
    const acctMatch = cell.match(ACCOUNT_NUMBER_PATTERN);
    if (acctMatch) {
      return { accountName: null, accountNumber: acctMatch[1] };
    }
  }

  // 3) First few data rows (margin layout).
  for (const row of document.rows.slice(0, 5)) {
    for (const cell of row) {
      const acctMatch = cell.match(ACCOUNT_NUMBER_PATTERN);
      if (acctMatch) {
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

    const { accountName, accountNumber } = extractAccountInfo(document, context);

    // Parse balance rows
    let availableToTrade: number | null = null;
    let availableToTradeAllSettled: number | null = null;
    let cashAndCredits: number | null = null;
    let totalAccountValue: number | null = null;
    let valueOfInvestments: number | null = null;
    let availableToWithdraw: number | null = null;
    let settledCash: number | null = null;
    let nonMarginBuyingPower: number | null = null;
    let marginBuyingPower: number | null = null;
    let availableWithoutMarginImpact: number | null = null;
    let cashReservedForOptions: number | null = null;

    // BUG-022: structural regime evidence by LABEL/SECTION presence, independent of
    // whether the row carried a numeric amount. A present-but-blank margin field must
    // still mark the margin regime.
    let marginFormatPresent = false;
    let legacyAllSettledPresent = false;
    let availableToTradePresent = false;

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

      // --- Structural regime presence (BUG-022) ---
      // Recorded by label/section presence alone, regardless of numeric value or which
      // value-matching branch (if any) handles the row below.
      if (
        normalizedLabel.includes("margin buying power") ||          // incl. "non-margin buying power"
        normalizedLabel.includes("available without margin impact") ||
        normalizedLabel.includes("margin status")                  // section header, typically blank amount
      ) {
        marginFormatPresent = true;
      }
      if (normalizedLabel.includes("all settled")) {
        // Legacy "all settled" evidence, in either real shape:
        //   - combined single row: "Available to trade (all settled)" (e.g. Roth IRA)
        //   - separated: "Available to Trade" header + indented "All Settled" sub-row
        legacyAllSettledPresent = true;
      }

      // Match known balance fields
      if (normalizedLabel.includes("available to trade") && normalizedLabel.includes("all settled")) {
        // Legacy single-row form: "Available to trade (all settled)" carries the settled
        // figure directly (real non-margin export, e.g. Roth IRA). This IS the legacy
        // all-settled value, not the section header.
        if (amount != null) availableToTradeAllSettled = amount;
        lastParentLabel = "available_to_trade";
      } else if (normalizedLabel.includes("available to trade") && !isSubItem) {
        // Legacy format: this row carried the amount. Current format: this is a
        // section header with a blank amount (value lives in sub-rows below).
        if (amount != null) {
          availableToTrade = amount;
          // A VALUE-bearing "Available to trade" row is the Sep-2026 cash layout's headline
          // tradable figure. Record its presence so the cash regime classifies even when the
          // legacy "(all settled)" label is absent. The blank margin-format "AVAILABLE TO
          // TRADE" section header carries no amount and so never sets this flag; MARGIN also
          // wins on presence in classifyBalanceRegime regardless.
          availableToTradePresent = true;
        }
        lastParentLabel = "available_to_trade";
      } else if (normalizedLabel.includes("all settled") && (isSubItem || lastParentLabel === "available_to_trade")) {
        availableToTradeAllSettled = amount;
      } else if (normalizedLabel === "settled cash" || normalizedLabel.startsWith("settled cash")) {
        // Current format: "Settled cash" appears under both AVAILABLE TO TRADE and
        // AVAILABLE TO WITHDRAW. Keep the first occurrence (AVAILABLE TO TRADE section).
        if (settledCash == null) settledCash = amount;
      } else if (normalizedLabel.includes("non-margin buying power")) {
        if (nonMarginBuyingPower == null) nonMarginBuyingPower = amount;
      } else if (normalizedLabel.includes("margin buying power")) {
        // Note: "non-margin buying power" is matched by the branch above, so this
        // branch only catches the true "Margin buying power" row.
        if (marginBuyingPower == null) marginBuyingPower = amount;
      } else if (normalizedLabel.includes("available without margin impact")) {
        if (availableWithoutMarginImpact == null) availableWithoutMarginImpact = amount;
      } else if (normalizedLabel.includes("cash reserved for options")) {
        cashReservedForOptions = amount;
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

    // BUG-022: the parser preserves distinct broker facts and makes NO deployable-cash
    // decision. It does NOT fold "Non-margin buying power" or "Available without margin
    // impact" into the legacy "Available to trade (all settled)" slot. Regime-aware
    // Deployable is derived downstream via deriveDeployableCash().

    const balances: ParsedBalances = {
      availableToTrade,
      availableToTradeAllSettled,
      cashAndCredits,
      totalAccountValue,
      valueOfInvestments,
      availableToWithdraw,
      settledCash,
      nonMarginBuyingPower,
      marginBuyingPower,
      availableWithoutMarginImpact,
      cashReservedForOptions,
      regimeEvidence: { marginFormatPresent, legacyAllSettledPresent, availableToTradePresent },
      accountName,
      accountNumber,
      allRows,
    };

    // Diagnostics (regime-aware; the parser reports, it does not decide Deployable).
    if (accountNumber) {
      diagnostics.push({ level: "info", message: `Account: ${accountNumber}` });
    }
    const regime = classifyBalanceRegime(balances);
    const derivedDeployable = deriveDeployableCash(balances);
    if (regime === "INDETERMINATE" || derivedDeployable == null) {
      diagnostics.push({
        level: "error",
        message: "Could not derive deployable cash from balances (indeterminate regime or missing regime-appropriate field).",
      });
    } else {
      diagnostics.push({
        level: "info",
        message: `Regime: ${regime}. Deployable cash: $${derivedDeployable.toLocaleString()}`,
      });
    }

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
