/**
 * Funnel CSV utility tests (BUG-016).
 *
 * Covers spec test requirements:
 *  6. CSV output contains the required run metadata and strategy identifier.
 *  7. CSV escaping and spreadsheet-formula neutralization work.
 * 10. CSV encoding escapes commas, quotes, line breaks, and formula-leading values.
 * 11. Filename contains the strategy, evaluation timestamp, and/or run id.
 */

import { describe, it, expect } from "vitest";
import {
  neutralizeFormula,
  escapeCsvCell,
  buildFunnelCsv,
  buildFunnelCsvFilename,
} from "../../src/write-desk/funnel-export/funnel-csv";
import { buildDecisionExportResult } from "../../src/write-desk/funnel-export/funnel-export-types";
import type { TerminalMembershipRecord, DecisionRunMetadata } from "../../src/write-desk/funnel-export/funnel-export-types";

function meta(overrides: Partial<DecisionRunMetadata> = {}): DecisionRunMetadata {
  return {
    strategy: "csp",
    decisionRunId: "csp-gen41-2026-09-14-1700000000000-0",
    evaluatedAt: "2026-09-14T18:22:05.000Z",
    evidenceGeneration: 41,
    policyVersion: "routine-csp-v1-provisional",
    sessionState: "CLOSED_CANONICAL",
    canonicalSessionDate: "2026-09-14",
    evidenceEnvironment: "production",
    ...overrides,
  };
}

function record(overrides: Partial<TerminalMembershipRecord> = {}): TerminalMembershipRecord {
  return {
    evaluationUnitType: "universe_symbol",
    symbol: "XLE",
    holdingOrLotId: null,
    expiration: "2026-10-03",
    terminalOutcome: "actionable",
    terminalReason: "Recommended (actionable)",
    evidenceRetrievedAt: null,
    admissible: true,
    ...overrides,
  };
}

describe("neutralizeFormula", () => {
  it("prefixes formula-leading values with a single quote", () => {
    expect(neutralizeFormula("=1+1")).toBe("'=1+1");
    expect(neutralizeFormula("+SUM(A1)")).toBe("'+SUM(A1)");
    expect(neutralizeFormula("-2")).toBe("'-2");
    expect(neutralizeFormula("@cmd")).toBe("'@cmd");
  });

  it("neutralizes formula-leading values even with leading whitespace", () => {
    expect(neutralizeFormula("  =danger")).toBe("'  =danger");
  });

  it("leaves ordinary values untouched", () => {
    expect(neutralizeFormula("XLE")).toBe("XLE");
    expect(neutralizeFormula("2026-10-03")).toBe("2026-10-03");
    expect(neutralizeFormula("")).toBe("");
  });
});

describe("escapeCsvCell", () => {
  it("wraps and doubles quotes for comma/quote/newline values", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvCell("carriage\rreturn")).toBe('"carriage\rreturn"');
  });

  it("neutralizes formula BEFORE quoting (comma + formula)", () => {
    // Value begins with '=' and contains a comma → neutralized then quoted.
    expect(escapeCsvCell("=1,2")).toBe('"\'=1,2"');
  });

  it("renders null/undefined as empty", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("renders numbers and booleans", () => {
    expect(escapeCsvCell(41)).toBe("41");
    expect(escapeCsvCell(true)).toBe("true");
    expect(escapeCsvCell(false)).toBe("false");
  });
});

describe("buildFunnelCsv", () => {
  it("includes required run metadata + strategy identifier in every row (test req 6)", () => {
    const result = buildDecisionExportResult(meta(), [record()]);
    const csv = buildFunnelCsv(result);
    const [header, row] = csv.split("\n");

    // Header carries the fixed common columns.
    expect(header).toContain("strategy");
    expect(header).toContain("decision_run_id");
    expect(header).toContain("evaluated_at");
    expect(header).toContain("evidence_generation");
    expect(header).toContain("policy_version");
    expect(header).toContain("session_state");
    expect(header).toContain("canonical_session_date");
    expect(header).toContain("terminal_outcome");
    expect(header).toContain("evidence_environment");

    // Row carries the run identity.
    expect(row).toContain("csp");
    expect(row).toContain("csp-gen41-2026-09-14-1700000000000-0");
    expect(row).toContain("41");
    expect(row).toContain("routine-csp-v1-provisional");
    expect(row).toContain("CLOSED_CANONICAL");
    expect(row).toContain("production");
    expect(row).toContain("actionable");
  });

  it("emits exactly one row per membership record plus one header", () => {
    const result = buildDecisionExportResult(meta(), [
      record({ symbol: "XLE" }),
      record({ symbol: "XLF", terminalOutcome: "wait" }),
      record({ symbol: "XLK", terminalOutcome: "nonOptionable", expiration: null, admissible: null }),
    ]);
    const csv = buildFunnelCsv(result);
    expect(csv.split("\n")).toHaveLength(1 + 3);
  });

  it("neutralizes a formula-leading symbol in the body (test req 7/10)", () => {
    // A hostile symbol value beginning with '=' must be neutralized.
    const result = buildDecisionExportResult(meta(), [record({ symbol: "=CMD()" })]);
    const csv = buildFunnelCsv(result);
    expect(csv).toContain("'=CMD()");
  });

  it("appends sorted meta_ columns for strategy-specific metadata", () => {
    const result = buildDecisionExportResult(meta({ strategy: "covered_call" }), [
      record({ evaluationUnitType: "holding", holdingOrLotId: "XLE", metadata: { free_shares: 300, max_contracts: 3 } }),
    ]);
    const csv = buildFunnelCsv(result);
    const header = csv.split("\n")[0];
    expect(header).toContain("meta_free_shares");
    expect(header).toContain("meta_max_contracts");
  });
});

describe("buildFunnelCsvFilename (test req 11)", () => {
  it("contains strategy, evaluation timestamp, and run id", () => {
    const result = buildDecisionExportResult(meta(), [record()]);
    const filename = buildFunnelCsvFilename(result);
    expect(filename).toContain("csp");
    // Colons/dots in the ISO timestamp are replaced with '-' for filesystem safety.
    expect(filename).toContain("2026-09-14T18-22-05");
    expect(filename).toContain("csp-gen41-2026-09-14-1700000000000-0");
    expect(filename.endsWith(".csv")).toBe(true);
  });
});
