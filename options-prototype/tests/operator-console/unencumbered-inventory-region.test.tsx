/**
 * UnencumberedInventory — Console region render tests (PL-ELIG V1).
 *
 * Proves the three-state presentation distinction, provenance line + fallback,
 * geometry-warning rendering, and odd-lot visibility at the presentation boundary.
 * Canonical: docs/parking-lot-8.md §PL-ELIG — Unencumbered Shares on the Operator Console.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnencumberedInventory } from "../../src/operator-console/UnencumberedInventory";
import type { PortfolioSnapshot, InventoryPosition, OpenShortCall } from "../../src/write-desk/types";

function inv(symbol: string, sharesOwned: number, sharesEncumbered: number): InventoryPosition {
  const clampedEnc = Math.min(sharesEncumbered, sharesOwned);
  const sharesFree = Math.max(0, sharesOwned - clampedEnc);
  return { symbol, sharesOwned, sharesEncumbered: clampedEnc, sharesFree, maxAdditionalContracts: Math.floor(sharesFree / 100), economics: null };
}

function call(underlying: string, quantity: number): OpenShortCall {
  return { symbol: `-${underlying}C100`, underlying, strike: 100, expiration: "2026-10-16", quantity, brokerOptionBasis: null, brokerOptionAverageCost: null };
}

function snapshot(opts?: {
  inventory?: InventoryPosition[];
  calls?: OpenShortCall[];
  provenance?: Partial<PortfolioSnapshot["provenance"]>;
  readiness?: Partial<PortfolioSnapshot["readiness"]>;
}): PortfolioSnapshot {
  return {
    id: "t", source: { type: "fidelity", label: "Fidelity" }, accountId: "T",
    snapshotDate: "2026-09-14",
    inventory: opts?.inventory ?? [],
    existingPuts: [], existingCalls: opts?.calls ?? [],
    deployableCash: 10000, aggregateShortOptionMTM: null, balanceContext: null,
    provenance: {
      sourceType: "fidelity", sourceLabel: "Fidelity", createdAt: "2026-09-14T21:00:00Z",
      optionSummaryFilename: "Option_Summary.csv",
      optionSummaryExportTimestamp: "2026-09-14T20:45:00Z",
      optionSummaryParsedAt: "2026-09-14T20:46:00Z",
      accountId: "T", ...opts?.provenance,
    },
    readiness: {
      status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true,
      cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0,
      warnings: [], blockReasons: [], ...opts?.readiness,
    },
  } as PortfolioSnapshot;
}

describe("UnencumberedInventory region", () => {
  it("State 3: renders rows with Symbol / Free Shares / Free Lots", () => {
    render(<UnencumberedInventory snapshot={snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] })} />);
    expect(screen.getByText("Unencumbered Shares")).toBeTruthy();
    expect(screen.getByText("COPX")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy(); // free shares
    expect(screen.getByRole("columnheader", { name: /free shares/i })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /free lots/i })).toBeTruthy();
  });

  it("State 3: odd lot (50 free / 0 lots) is visible and not erroneous", () => {
    render(<UnencumberedInventory snapshot={snapshot({ inventory: [inv("XYZ", 150, 100)], calls: [call("XYZ", 1)] })} />);
    expect(screen.getByText("XYZ")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    // free lots cell shows 0
    const cells = screen.getAllByRole("cell").map(c => c.textContent);
    expect(cells).toContain("0");
  });

  it("State 2: trustworthy evidence + zero free shares shows a truthful empty state", () => {
    render(<UnencumberedInventory snapshot={snapshot({ inventory: [inv("XLF", 200, 200)], calls: [call("XLF", 2)] })} />);
    expect(screen.getByText("No unencumbered shares.")).toBeTruthy();
    // It must NOT show the evidence-unavailable banner (that would conflate the states).
    expect(screen.queryByText(/incomplete or unavailable/i)).toBeNull();
  });

  it("State 1: untrustworthy evidence renders distinctly from a trustworthy zero", () => {
    render(<UnencumberedInventory snapshot={snapshot({
      inventory: [],
      readiness: { status: "INCOMPLETE", optionSummaryLoaded: false, inventoryValid: false, warnings: ["Option Summary not loaded or empty."] },
    })} />);
    expect(screen.getByText(/incomplete or unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Option Summary not loaded or empty/i)).toBeTruthy();
    // Must not present a trustworthy "No unencumbered shares." zero (exact empty-state text).
    expect(screen.queryByText("No unencumbered shares.")).toBeNull();
  });

  it("renders geometry warning for open-call underlying with no inventory record", () => {
    render(<UnencumberedInventory snapshot={snapshot({ inventory: [], calls: [call("ABC", 1)] })} />);
    expect(screen.getByText("ABC")).toBeTruthy();
    expect(screen.getByText(/ownership evidence is unavailable/i)).toBeTruthy();
  });

  it("provenance line shows Option Summary export time", () => {
    render(<UnencumberedInventory snapshot={snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] })} />);
    expect(screen.getByText(/Fidelity Option Summary/i)).toBeTruthy();
    expect(screen.getByText(/exported/i)).toBeTruthy();
  });

  it("provenance fallback states 'Export time unavailable' and never promotes parse time to export", () => {
    render(<UnencumberedInventory snapshot={snapshot({
      inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)],
      provenance: { optionSummaryExportTimestamp: undefined, optionSummaryParsedAt: "2026-09-14T20:46:00Z" },
    })} />);
    expect(screen.getByText(/Export time unavailable/i)).toBeTruthy();
    // 'exported' must not appear (parse time not relabeled as export)
    expect(screen.queryByText(/· exported /i)).toBeNull();
  });
});
