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
