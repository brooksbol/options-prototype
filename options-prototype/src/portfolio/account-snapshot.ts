/**
 * Build a PortfolioSnapshot from a BrokerageAccount's per-account evidence (Increment 3).
 *
 * This is the "switch account → load that account's state" mechanism (Case E). It reads the
 * account's own Fidelity evidence slots and builds a snapshot stamped with the authoritative
 * brokerageAccountId. No import occurs; no other account is touched. Returns null when the
 * account has insufficient evidence to build a snapshot.
 */

import type { PortfolioSnapshot } from "../write-desk/types";
import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../csv/fidelity/balancesParser";
import { buildFidelitySnapshot } from "../write-desk/fidelity-snapshot";
import { preprocessCsv } from "../csv/preprocess";
import { detectDelimiter, parseCsv } from "../csv/reader";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity";
import { readAccountCsv } from "./account-evidence-store";
import type { HoldingRow } from "../csv/fidelity/positionsParser";
import { deriveOwnershipFromPositions } from "./positions-ownership";

/**
 * Parse a Positions CSV into authoritative aggregate ownership (ADR-020). Returns the
 * ownership map plus export timestamp, or null when the blob is missing/unparseable.
 * Never throws.
 */
function parsePositionsText(
  text: string
): { ownership: Map<string, number>; exportTimestamp: string | null } | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const doc = parseCsv(csvContent, detectDelimiter(csvContent));
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_positions") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "holdings") return null;
    const rows = parsed.payload.rows as HoldingRow[];
    const ownership = deriveOwnershipFromPositions(rows);
    if (ownership.size === 0) return null;
    const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;
    return { ownership, exportTimestamp };
  } catch {
    return null;
  }
}

function parseOptionSummaryText(
  text: string
): { rows: OptionSummaryRow[]; exportTimestamp: string | null } | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const doc = parseCsv(csvContent, detectDelimiter(csvContent));
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_option_summary") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "option_summary") return null;
    const rows = parsed.payload.rows as OptionSummaryRow[];
    const exportTimestamp = parsed.metadata.quoteDate ?? parsed.metadata.downloadTimestamp ?? null;
    return { rows, exportTimestamp };
  } catch {
    return null;
  }
}

function parseBalancesText(
  text: string
): { balances: ParsedBalances; exportTimestamp: string | null } | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const doc = parseCsv(csvContent, detectDelimiter(csvContent));
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_balances") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) return null;
    const balances = parsed.payload.rows[0] as unknown as ParsedBalances;
    const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;
    return { balances, exportTimestamp };
  } catch {
    return null;
  }
}

/**
 * Load and build the snapshot for a specific account from its per-account evidence.
 * Requires both Option Summary and Balances evidence to be present (matching the legacy
 * READY requirement). Returns null otherwise. The snapshot is stamped with the account id
 * so downstream account-local state is correctly attributed.
 */
export function buildSnapshotForAccount(brokerageAccountId: string): PortfolioSnapshot | null {
  const osBlob = readAccountCsv(brokerageAccountId, "option-summary");
  const balBlob = readAccountCsv(brokerageAccountId, "balances");
  if (!osBlob || !balBlob) return null;

  const osParsed = parseOptionSummaryText(osBlob.text);
  const balParsed = parseBalancesText(balBlob.text);
  if (!osParsed || !balParsed) return null;

  // Positions is authoritative for aggregate share ownership WHEN AVAILABLE (ADR-020).
  // Absent Positions, ownership falls back to the conservative observed Option Summary
  // value inside buildFidelitySnapshot; ownership is never inferred from call geometry.
  const posBlob = readAccountCsv(brokerageAccountId, "positions");
  const posParsed = posBlob ? parsePositionsText(posBlob.text) : null;

  return buildFidelitySnapshot({
    optionSummaryRows: osParsed.rows,
    optionSummaryFilename: osBlob.filename,
    optionSummaryExportTimestamp: osParsed.exportTimestamp,
    balances: balParsed.balances,
    balancesFilename: balBlob.filename,
    balancesExportTimestamp: balParsed.exportTimestamp,
    brokerageAccountId,
    authoritativeOwnership: posParsed?.ownership ?? null,
    positionsFilename: posParsed ? posBlob!.filename : null,
    positionsExportTimestamp: posParsed?.exportTimestamp ?? null,
  });
}
