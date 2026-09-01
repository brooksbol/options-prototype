/**
 * PL-EVID-AGE — Age column appears in CSV downloads.
 *
 * Proves the Age column is present in exported CSV for Deployment tables and is
 * formatted as chain-acquisition age at a captured instant (static snapshot,
 * not a live ticker), with `unavailable` rendered as an em dash.
 */

import { describe, it, expect } from "vitest";
import { buildCsv } from "../../src/write-desk/table-csv-export";
import { formatAcquisitionAge, type EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const now = 1_000_000_000_000;

const rows: Record<string, unknown>[] = [
  { symbol: "XLE", evidenceProvenance: { kind: "chain-acquired", acquiredAtMs: now - 120_000 } as EvidenceProvenance },
  { symbol: "XLF", evidenceProvenance: { kind: "unavailable" } as EvidenceProvenance },
];

const columns = [
  { key: "symbol", label: "Symbol" },
  { key: "age", label: "Age", format: (r: Record<string, unknown>) => formatAcquisitionAge(r.evidenceProvenance as EvidenceProvenance | undefined, now) },
];

describe("Age in CSV export", () => {
  it("includes an Age header", () => {
    const csv = buildCsv(rows, columns);
    const header = csv.split("\n")[0];
    expect(header.split(",")).toContain("Age");
  });

  it("emits chain-acquisition age for chain-acquired rows", () => {
    const csv = buildCsv(rows, columns);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("XLE,2m");
  });

  it("emits em dash for unavailable provenance", () => {
    const csv = buildCsv(rows, columns);
    const lines = csv.split("\n");
    expect(lines[2]).toBe("XLF,—");
  });
});
