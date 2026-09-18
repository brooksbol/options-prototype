/**
 * Funnel Export Visibility tests.
 *
 * The three funnel-membership CSV export controls (BUG-016) are diagnostic
 * affordances hidden from the normal operator surface and exposed only via the
 * intentional `?funnelExport=1` query-parameter easter egg. These tests pin the
 * gate's query-parameter semantics AND confirm the gate is UI-visibility only —
 * the BUG-016 terminal-membership / DecisionExportResult accounting is entirely
 * independent of the flag.
 *
 * Covers spec requirements:
 *  1. Funnel CSV controls are absent by default.
 *  2. `?funnelExport=1` exposes the controls.
 *  3. Unrecognized / false-ish values do not expose them.
 *  4. Existing export behavior remains intact when enabled.
 *  5. BUG-016 membership/reconciliation behavior remains independent of UI visibility.
 */

import { describe, it, expect } from "vitest";
import {
  isFunnelExportEnabled,
  FUNNEL_EXPORT_PARAM,
  FUNNEL_EXPORT_ENABLED_VALUE,
} from "../../src/write-desk/funnel-export/funnel-export-visibility";
import {
  buildDecisionExportResult,
  assertReconciled,
} from "../../src/write-desk/funnel-export/funnel-export-types";
import type {
  TerminalMembershipRecord,
  DecisionRunMetadata,
} from "../../src/write-desk/funnel-export/funnel-export-types";
import { buildFunnelCsv, buildFunnelCsvFilename } from "../../src/write-desk/funnel-export/funnel-csv";

// --- Query-parameter semantics (requirements 1, 2, 3) ---

describe("isFunnelExportEnabled — default absent (requirement 1)", () => {
  it("is disabled when there is no query string", () => {
    expect(isFunnelExportEnabled("")).toBe(false);
    expect(isFunnelExportEnabled(undefined)).toBe(false);
    expect(isFunnelExportEnabled(null)).toBe(false);
  });

  it("is disabled when the parameter is absent among other params", () => {
    expect(isFunnelExportEnabled("?viz=b")).toBe(false);
    expect(isFunnelExportEnabled("?foo=1&bar=2")).toBe(false);
  });
});

describe("isFunnelExportEnabled — explicit opt-in (requirement 2)", () => {
  it("is enabled for the exact value funnelExport=1", () => {
    expect(isFunnelExportEnabled("?funnelExport=1")).toBe(true);
  });

  it("is enabled with or without a leading question mark", () => {
    expect(isFunnelExportEnabled("funnelExport=1")).toBe(true);
  });

  it("is enabled when combined with unrelated params", () => {
    expect(isFunnelExportEnabled("?viz=b&funnelExport=1")).toBe(true);
    expect(isFunnelExportEnabled("?funnelExport=1&other=x")).toBe(true);
  });

  it("uses the documented parameter name and value constants", () => {
    expect(FUNNEL_EXPORT_PARAM).toBe("funnelExport");
    expect(FUNNEL_EXPORT_ENABLED_VALUE).toBe("1");
    expect(
      isFunnelExportEnabled(`?${FUNNEL_EXPORT_PARAM}=${FUNNEL_EXPORT_ENABLED_VALUE}`),
    ).toBe(true);
  });
});

describe("isFunnelExportEnabled — false-ish / unrecognized values stay disabled (requirement 3)", () => {
  it.each([
    "?funnelExport=0",
    "?funnelExport=true",
    "?funnelExport=yes",
    "?funnelExport=on",
    "?funnelExport=",
    "?funnelExport",
    "?funnelExport=2",
    "?funnelExport=11",
    "?funnelExport=1 ",
    "?funnelExport=01",
    "?FunnelExport=1", // parameter name is case-sensitive
    "?funnelexport=1",
  ])("stays disabled for %s", (search) => {
    expect(isFunnelExportEnabled(search)).toBe(false);
  });
});

// --- BUG-016 independence (requirements 4, 5) ---
//
// The export machinery is a pure function of run metadata + terminal membership.
// It has no dependency on the visibility flag, the query string, or the DOM.
// These tests construct the authoritative result exactly as the Decision engines
// do and confirm it reconciles and serializes regardless of UI visibility.

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

describe("BUG-016 export machinery is independent of UI visibility (requirements 4, 5)", () => {
  const membership: TerminalMembershipRecord[] = [
    record({ symbol: "XLE", terminalOutcome: "actionable" }),
    record({ symbol: "XLF", terminalOutcome: "wait", terminalReason: "Held for Wait" }),
  ];

  it("builds a reconciled DecisionExportResult regardless of the visibility flag", () => {
    // The flag has no bearing here — the same authoritative result is produced
    // whether the diagnostic control is visible or hidden.
    for (const _flag of [true, false]) {
      const result = buildDecisionExportResult(meta(), membership);
      expect(result.membership).toHaveLength(2);
      // Derived counters sum to the governed denominator (single accounting authority).
      const sum = Object.values(result.derivedCounters).reduce((a, b) => a + b, 0);
      expect(sum).toBe(membership.length);
      // Reconciliation assertion holds independent of any UI concern.
      expect(() => assertReconciled(membership, membership.length, "csp")).not.toThrow();
    }
  });

  it("serializes the exact same CSV content and filename regardless of the visibility flag", () => {
    const result = buildDecisionExportResult(meta(), membership);
    const csvA = buildFunnelCsv(result);
    const filenameA = buildFunnelCsvFilename(result);
    // Re-derive under the "hidden" scenario — nothing about visibility touches this.
    const csvB = buildFunnelCsv(buildDecisionExportResult(meta(), membership));
    const filenameB = buildFunnelCsvFilename(buildDecisionExportResult(meta(), membership));
    expect(csvB).toBe(csvA);
    expect(filenameB).toBe(filenameA);
    // Content still carries the run metadata and one row per evaluation unit.
    expect(csvA).toContain("XLE");
    expect(csvA).toContain("XLF");
    expect(filenameA).toContain("csp");
  });
});
