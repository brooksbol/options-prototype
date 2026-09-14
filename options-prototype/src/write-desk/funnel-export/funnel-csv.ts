/**
 * Funnel CSV — pure, DOM-free serialization of a DecisionExportResult into the
 * common funnel-export CSV format, plus a browser download helper.
 *
 * ENCODING SAFETY (invariant 10)
 * ------------------------------
 * - RFC-4180 escaping: fields containing comma, double-quote, CR, or LF are
 *   wrapped in double quotes with internal quotes doubled.
 * - Spreadsheet formula-injection neutralization: any field whose value begins
 *   with `=`, `+`, `-`, or `@` (after optional leading whitespace) is prefixed
 *   with a single quote (`'`) so spreadsheet apps treat it as text, not a
 *   formula. Neutralization happens BEFORE RFC-4180 escaping.
 *
 * This module performs NO acquisition, NO evidence mutation, and NO Decision
 * reruns — it serializes an already-produced in-memory result.
 */

import type { DecisionExportResult, TerminalMembershipRecord } from "./funnel-export-types";

/** The fixed common columns, in output order. */
const COMMON_COLUMNS = [
  "strategy",
  "decision_run_id",
  "evaluated_at",
  "evidence_generation",
  "policy_version",
  "session_state",
  "canonical_session_date",
  "evaluation_unit_type",
  "symbol",
  "holding_or_lot_id",
  "expiration",
  "terminal_outcome",
  "terminal_reason",
  "evidence_retrieved_at",
  "evidence_environment",
  "admissible",
] as const;

/**
 * Neutralize a spreadsheet formula-leading value. Values beginning with
 * `=`, `+`, `-`, or `@` (ignoring leading whitespace) are prefixed with `'`.
 */
export function neutralizeFormula(value: string): string {
  // Inspect the first non-whitespace character.
  const firstNonWs = value.replace(/^\s+/, "");
  if (firstNonWs.length === 0) return value;
  const c = firstNonWs[0];
  if (c === "=" || c === "+" || c === "-" || c === "@") {
    return `'${value}`;
  }
  return value;
}

/**
 * Escape a single cell: neutralize formulas first, then apply RFC-4180 quoting.
 */
export function escapeCsvCell(raw: string | number | boolean | null | undefined): string {
  if (raw == null) return "";
  const str = neutralizeFormula(String(raw));
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Collect the sorted union of metadata keys across all membership records so
 * strategy-specific metadata columns are stable and complete.
 */
function collectMetadataKeys(membership: readonly TerminalMembershipRecord[]): string[] {
  const keys = new Set<string>();
  for (const record of membership) {
    if (record.metadata) {
      for (const k of Object.keys(record.metadata)) keys.add(k);
    }
  }
  return [...keys].sort();
}

/**
 * Build the CSV text for a DecisionExportResult. Common columns first, then any
 * strategy-specific metadata columns (sorted, prefixed `meta_`). One row per
 * governed evaluation unit.
 */
export function buildFunnelCsv(result: DecisionExportResult): string {
  const { metadata, membership } = result;
  const metaKeys = collectMetadataKeys(membership);

  const header = [...COMMON_COLUMNS, ...metaKeys.map((k) => `meta_${k}`)]
    .map(escapeCsvCell)
    .join(",");

  const rows = membership.map((record) => {
    const common: (string | number | boolean | null)[] = [
      metadata.strategy,
      metadata.decisionRunId,
      metadata.evaluatedAt,
      metadata.evidenceGeneration,
      metadata.policyVersion,
      metadata.sessionState,
      metadata.canonicalSessionDate,
      record.evaluationUnitType,
      record.symbol,
      record.holdingOrLotId,
      record.expiration,
      record.terminalOutcome,
      record.terminalReason,
      record.evidenceRetrievedAt,
      metadata.evidenceEnvironment,
      record.admissible,
    ];
    const metaCells = metaKeys.map((k) => record.metadata?.[k] ?? null);
    return [...common, ...metaCells].map(escapeCsvCell).join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Build a filename containing strategy, evaluation timestamp, and run id.
 * Example: `wheelwright-funnel-csp-2026-09-14T18-22-05Z-csp-gen41-2026-09-11-...csv`
 */
export function buildFunnelCsvFilename(result: DecisionExportResult): string {
  const tsSafe = result.metadata.evaluatedAt.replace(/[:.]/g, "-");
  const idSafe = result.metadata.decisionRunId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `wheelwright-funnel-${result.metadata.strategy}-${tsSafe}-${idSafe}.csv`;
}

/**
 * Serialize and trigger a browser download. Guarded: an incomplete/empty result
 * (no membership) is NOT downloaded (invariant 9/11 — cannot export an
 * incomplete result as if complete).
 */
export function downloadFunnelCsv(result: DecisionExportResult | null): void {
  if (!result || result.membership.length === 0) return;
  const csv = buildFunnelCsv(result);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFunnelCsvFilename(result);
  a.click();
  URL.revokeObjectURL(url);
}
