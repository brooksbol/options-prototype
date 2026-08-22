/**
 * Table CSV Export — utility for downloading deployment table data as CSV.
 */

/**
 * Convert an array of objects to CSV and trigger a browser download.
 */
export function downloadTableCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  filename: string,
): void {
  if (rows.length === 0) return;

  const header = columns.map(c => c.label).join(",");
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c.key];
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

  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
