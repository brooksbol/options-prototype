/**
 * Funnel Export Visibility — DOM acceptance (render) tests.
 *
 * Operator-surface acceptance for the diagnostic funnel CSV control gate. These
 * exercise the REAL FunnelExportButton component (as wired in the Write Desk) in
 * both states, at the DOM level:
 *
 *   Default (enabled=false, i.e. no ?funnelExport=1): the control is completely
 *     absent — no button, no disabled placeholder, no layout artifact.
 *   Diagnostic (enabled=true, i.e. ?funnelExport=1): the control renders and its
 *     click serializes the current DecisionExportResult via downloadFunnelCsv.
 *
 * Covers spec requirements 1, 2, and 4 at the rendered-surface level.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FunnelExportButton } from "../../src/components/WriteDesk";
import { buildDecisionExportResult } from "../../src/write-desk/funnel-export/funnel-export-types";
import type {
  TerminalMembershipRecord,
  DecisionRunMetadata,
} from "../../src/write-desk/funnel-export/funnel-export-types";

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FunnelExportButton — default (hidden) surface (requirement 1)", () => {
  it("renders nothing when not enabled — no button, no artifact", () => {
    const result = buildDecisionExportResult(meta(), [record()]);
    const { container } = render(
      <FunnelExportButton label="Export CSP Funnel CSV" result={result} enabled={false} />,
    );
    // No button element at all.
    expect(screen.queryByRole("button")).toBeNull();
    // No residual DOM (no placeholder / empty wrapper).
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing even when a complete result is available but disabled", () => {
    const result = buildDecisionExportResult(meta(), [record(), record({ symbol: "XLF" })]);
    render(<FunnelExportButton label="Export CSP Funnel CSV" result={result} enabled={false} />);
    expect(screen.queryByText(/Export CSP Funnel CSV/)).toBeNull();
  });
});

describe("FunnelExportButton — diagnostic (visible) surface (requirements 2, 4)", () => {
  it("renders the labeled control when enabled", () => {
    const result = buildDecisionExportResult(meta(), [record()]);
    render(<FunnelExportButton label="Export CSP Funnel CSV" result={result} enabled={true} />);
    const btn = screen.getByRole("button", { name: /Export CSP Funnel CSV/ });
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("is present but disabled when enabled with no complete result (no export possible)", () => {
    render(<FunnelExportButton label="Export CSP Funnel CSV" result={null} enabled={true} />);
    const btn = screen.getByRole("button", { name: /Export CSP Funnel CSV/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("clicking triggers a CSV download of the current result", () => {
    // jsdom lacks URL.createObjectURL / anchor download; stub the DOM egress.
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const result = buildDecisionExportResult(meta(), [record(), record({ symbol: "XLF", terminalOutcome: "wait", terminalReason: "Wait" })]);
    render(<FunnelExportButton label="Export CSP Funnel CSV" result={result} enabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Export CSP Funnel CSV/ }));

    // The existing BUG-016 export path executed: a blob URL was created and the
    // synthetic download anchor was clicked. CSV contents/filenames are proven
    // unchanged by funnel-csv.test.ts; here we confirm the control still drives it.
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
