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
