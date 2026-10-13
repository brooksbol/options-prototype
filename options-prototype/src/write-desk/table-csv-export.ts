/**
 * Table CSV Export — utility for downloading deployment table data as CSV.
 */

export interface CsvColumn {
  key: string;
  label: string;
  /**
   * Optional per-column formatter. Used e.g. by the PL-EVID-AGE Age column to
   * format the row's `evidenceProvenance` object into a compact acquisition-age
   * string at a captured instant (CSV is a static snapshot, not a live ticker).
   */
  format?: (row: Record<string, unknown>) => string;
}

/**
 * Machine-consumable RAW greek/IV/provider-timestamp export columns
 * (PL-DEPLOY-EXPORT). Reads each row's `exportGreeks` (a RawExportGreeks carried
 * on the candidate) and emits the RAW provider value: a finite number (including
 * an exact provider 0) is emitted verbatim; absence (null/undefined) is emitted
 * as empty — NEVER fabricated as 0, and NEVER run through the presentation
 * zero→null sanitizer. IV magnitude is unconstrained (values > 1 emitted as-is).
 * `midIv` and `smvVol` are distinct columns; `greeksUpdatedAt` is the verbatim
 * provider string. Uniform across every candidate/table export in scope.
 */
export const RAW_GREEK_IV_COLUMNS: CsvColumn[] = [
  { key: "raw_delta", label: "Delta (raw)", format: (r) => rawGreekCell(r, "delta") },
  { key: "raw_gamma", label: "Gamma (raw)", format: (r) => rawGreekCell(r, "gamma") },
  { key: "raw_theta", label: "Theta (raw)", format: (r) => rawGreekCell(r, "theta") },
  { key: "raw_vega", label: "Vega (raw)", format: (r) => rawGreekCell(r, "vega") },
  { key: "raw_rho", label: "Rho (raw)", format: (r) => rawGreekCell(r, "rho") },
  { key: "raw_midIv", label: "midIv", format: (r) => rawGreekCell(r, "midIv") },
  { key: "raw_smvVol", label: "smvVol", format: (r) => rawGreekCell(r, "smvVol") },
  { key: "raw_greeksUpdatedAt", label: "greeksUpdatedAt", format: (r) => rawTimestampCell(r) },
];

/**
 * INTERIM v1 per-underlying volatility metrics (tastytrade /market-metrics) CSV
 * columns. Reads each row's `marketMetrics` (a MarketMetrics attached to the
 * candidate for display/export only). RAW provider values are emitted VERBATIM:
 * the 0..1 IV-rank/percentile scale is NOT converted here (presentation layer
 * does ×100 for the screen; the CSV preserves the provider scale). Absence →
 * empty, never 0; a provider exact 0 is emitted as "0". The two methodologies
 * (tos/tw) are DISTINCT columns and are never averaged or substituted.
 * OBSERVATIONAL ONLY — never a recommendation input.
 */
export const MARKET_METRICS_COLUMNS: CsvColumn[] = [
  { key: "mm_ivRank", label: "ivRank", format: (r) => metricNumCell(r, "ivRank") },
  { key: "mm_ivRankSource", label: "ivRankSource", format: (r) => metricStrCell(r, "ivRankSource") },
  { key: "mm_ivRankTos", label: "ivRankTos", format: (r) => metricNumCell(r, "ivRankTos") },
  { key: "mm_ivRankTw", label: "ivRankTw", format: (r) => metricNumCell(r, "ivRankTw") },
  { key: "mm_ivPercentile", label: "ivPercentile", format: (r) => metricNumCell(r, "ivPercentile") },
  { key: "mm_ivIndex", label: "ivIndex", format: (r) => metricNumCell(r, "ivIndex") },
  { key: "mm_hv30", label: "historicalVolatility30", format: (r) => metricNumCell(r, "historicalVolatility30") },
  { key: "mm_ivHv30Diff", label: "ivHv30Difference", format: (r) => metricNumCell(r, "ivHv30Difference") },
  { key: "mm_ivUpdatedAt", label: "ivUpdatedAt", format: (r) => metricStrCell(r, "ivUpdatedAt") },
];

function metricNumCell(row: Record<string, unknown>, field: string): string {
  const m = row["marketMetrics"] as Record<string, unknown> | undefined;
  if (!m) return "";
  const v = m[field];
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}

function metricStrCell(row: Record<string, unknown>, field: string): string {
  const m = row["marketMetrics"] as Record<string, unknown> | undefined;
  if (!m) return "";
  const v = m[field];
  return typeof v === "string" ? v : "";
}

function rawGreekCell(row: Record<string, unknown>, field: string): string {
  const g = row["exportGreeks"] as Record<string, unknown> | undefined;
  if (!g) return "";
  const v = g[field];
  // Raw preservation: finite number (incl. exact 0) verbatim; absence → empty.
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}

function rawTimestampCell(row: Record<string, unknown>): string {
  const g = row["exportGreeks"] as Record<string, unknown> | undefined;
  if (!g) return "";
  const v = g["greeksUpdatedAt"];
  return typeof v === "string" ? v : "";
}

/**
 * Build CSV text from rows + columns. Pure and testable (no DOM).
 */
export function buildCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
): string {
  const header = columns.map(c => c.label).join(",");
  const body = rows.map(row =>
    columns.map(c => {
      const raw: unknown = c.format ? c.format(row) : row[c.key];
      const val = raw;
      if (val == null) return "";
      if (typeof val === "object" && "score" in (val as Record<string, unknown>)) {
        return String((val as { score: number }).score);
      }
      const str = String(val);
      // Escape commas and quotes
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  ).join("\n");
  return header + "\n" + body;
}

/**
 * Convert an array of objects to CSV and trigger a browser download.
 */
export function downloadTableCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
  filename: string,
): void {
  if (rows.length === 0) return;

  const csv = buildCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
