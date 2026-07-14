/**
 * CSV Preprocessing — Preamble Detection
 *
 * Fidelity CSV exports often have preamble lines before the actual header row.
 * This utility identifies where the real CSV data begins.
 *
 * Returns the content starting from the detected header row,
 * plus any preamble lines for metadata extraction.
 */

/**
 * Detect where the actual CSV header row starts.
 * Returns the index of the header row (0-based line number).
 *
 * Heuristics:
 * - Option Summary: "symbol" + "description" in the same line
 * - Activity: "run date" + "action" in the same line
 * - Balances: "description" + "amount" in the same line
 * - Positions: "account number" + "symbol" in the same line
 * - Default: 0 (no preamble detected)
 */
export function findHeaderRowIndex(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("symbol") && lower.includes("description")) return i;
    if (lower.includes("run date") && lower.includes("action")) return i;
    if (lower.includes("description") && lower.includes("amount")) return i;
    if (lower.includes("account number") && lower.includes("symbol")) return i;
  }
  return 0;
}

/**
 * Preprocess a raw CSV string: extract preamble and return the content
 * starting from the detected header row.
 */
export function preprocessCsv(content: string): { csvContent: string; preambleLines: string[] } {
  const lines = content.split(/\r?\n/);
  const headerIdx = findHeaderRowIndex(lines);
  const preambleLines = lines.slice(0, headerIdx).filter((l) => l.trim());
  const csvContent = lines.slice(headerIdx).join("\n");
  return { csvContent, preambleLines };
}
