/**
 * UnencumberedInventory — Console region render tests (PL-ELIG V1).
 *
 * Proves the three-state presentation distinction, provenance line + fallback,
 * geometry-warning rendering, and odd-lot visibility at the presentation boundary.
 * Canonical: docs/parking-lot-8.md §PL-ELIG — Unencumbered Shares on the Operator Console.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UnencumberedInventory } from "../../src/operator-console/UnencumberedInventory";
import type { PortfolioSnapshot, InventoryPosition, OpenShortCall, PositionEconomics } from "../../src/write-desk/types";
import type { QuoteObservation } from "../../src/evidence/observation-store";
import type { SpotHistoryMap, SpotObservation } from "../../src/evidence/use-spot-history";

// --- Live-evidence helpers (Spot / Today's G/L / Freshness / Capital) ---

function obsMap(entries: Array<{ symbol: string; price: number | null; observedAt: string | null }>): ReadonlyMap<string, QuoteObservation> {
  const m = new Map<string, QuoteObservation>();
  for (const e of entries) {
    m.set(e.symbol.toUpperCase(), {
      symbol: e.symbol.toUpperCase(),
      price: e.price,
      observedAt: e.observedAt,
      acquisitionStatus: "ready",
      lastAttemptAt: e.observedAt,
      failureCount: 0,
    } as QuoteObservation);
  }
  return m;
}

function historyMap(entries: Array<{ symbol: string; moments: SpotObservation[] }>): SpotHistoryMap {
  const m = new Map<string, SpotObservation[]>();
  for (const e of entries) m.set(e.symbol.toUpperCase(), e.moments);
  return m;
}

const NO_OBS: ReadonlyMap<string, QuoteObservation> = new Map();
const NO_HISTORY: SpotHistoryMap = new Map();

function renderRegion(snap: PortfolioSnapshot, observations = NO_OBS, spotHistory = NO_HISTORY) {
  return render(<UnencumberedInventory snapshot={snap} observations={observations} spotHistory={spotHistory} />);
}

function inv(symbol: string, sharesOwned: number, sharesEncumbered: number, economics: PositionEconomics | null = null): InventoryPosition {
  const clampedEnc = Math.min(sharesEncumbered, sharesOwned);
  const sharesFree = Math.max(0, sharesOwned - clampedEnc);
  return { symbol, sharesOwned, sharesEncumbered: clampedEnc, sharesFree, maxAdditionalContracts: Math.floor(sharesFree / 100), economics };
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
  it("State 3: renders rows with all columns present", () => {
    renderRegion(snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }));
    expect(screen.getByText("Unencumbered Shares")).toBeTruthy();
    expect(screen.getByText("COPX")).toBeTruthy();
    for (const name of [/free shares/i, /free lots/i, /^spot$/i, /today's g\/l/i, /^capital$/i, /share basis/i, /freshness/i]) {
      expect(screen.getByRole("columnheader", { name })).toBeTruthy();
    }
  });

  it("State 3: odd lot (50 free / 0 lots) is visible and not erroneous", () => {
    renderRegion(snapshot({ inventory: [inv("XYZ", 150, 100)], calls: [call("XYZ", 1)] }));
    expect(screen.getByText("XYZ")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    const cells = screen.getAllByRole("cell").map(c => c.textContent);
    expect(cells).toContain("0");
  });

  it("State 2: trustworthy evidence + zero free shares shows a truthful empty state", () => {
    renderRegion(snapshot({ inventory: [inv("XLF", 200, 200)], calls: [call("XLF", 2)] }));
    expect(screen.getByText("No unencumbered shares.")).toBeTruthy();
    expect(screen.queryByText(/incomplete or unavailable/i)).toBeNull();
  });

  it("State 1: untrustworthy evidence renders distinctly from a trustworthy zero", () => {
    renderRegion(snapshot({
      inventory: [],
      readiness: { status: "INCOMPLETE", optionSummaryLoaded: false, inventoryValid: false, warnings: ["Option Summary not loaded or empty."] },
    }));
    expect(screen.getByText(/incomplete or unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Option Summary not loaded or empty/i)).toBeTruthy();
    expect(screen.queryByText("No unencumbered shares.")).toBeNull();
  });

  it("renders geometry warning for open-call underlying with no inventory record", () => {
    renderRegion(snapshot({ inventory: [], calls: [call("ABC", 1)] }));
    expect(screen.getByText("ABC")).toBeTruthy();
    expect(screen.getByText(/ownership evidence is unavailable/i)).toBeTruthy();
  });

  it("provenance line shows Option Summary export time", () => {
    renderRegion(snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }));
    expect(screen.getByText(/Fidelity Option Summary/i)).toBeTruthy();
    expect(screen.getByText(/exported/i)).toBeTruthy();
  });

  it("provenance fallback states 'Export time unavailable' and never promotes parse time to export", () => {
    renderRegion(snapshot({
      inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)],
      provenance: { optionSummaryExportTimestamp: undefined, optionSummaryParsedAt: "2026-09-14T20:46:00Z" },
    }));
    expect(screen.getByText(/Export time unavailable/i)).toBeTruthy();
    expect(screen.queryByText(/· exported /i)).toBeNull();
  });

  // --- Expanded columns: Spot / Today's G/L / Capital / Share Basis / Freshness ---

  it("shows spot, capital (freeShares × spot), and blended basis when evidence is present", () => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40.5, costBasis: 8100, marketValue: 9400 })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]),
      historyMap([{ symbol: "COPX", moments: [
        { price: 92.0, observedAt: new Date(nowMs - 3 * 3600_000).toISOString() },
        { price: 94.0, observedAt: now },
      ] }]),
    );
    const row = screen.getByText("COPX").closest("tr")!;
    const u = within(row);
    expect(u.getByText("$94.00")).toBeTruthy();     // spot
    expect(u.getByText("$9,400")).toBeTruthy();      // capital = 100 free × $94
    expect(u.getByText("$40.50")).toBeTruthy();      // blended basis
    // Today's G/L: +$2.00 (+2.17%) — same-day move from 92 → 94
    expect(u.getByText(/\+\$2\.00/)).toBeTruthy();
  });

  it("free-only symbol with NO observation renders dashes for spot/capital/freshness (no fabrication)", () => {
    // FREE is owned with no open call → not in observation set. Honest "—".
    renderRegion(snapshot({ inventory: [inv("FREE", 300, 0)] }), NO_OBS, NO_HISTORY);
    const row = screen.getByText("FREE").closest("tr")!;
    const u = within(row);
    expect(u.getByText("300")).toBeTruthy();          // free shares still shown
    // spot, today's g/l, capital, basis, freshness all dash
    const dashes = within(row).getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("basis column shows a dash when economics are unavailable", () => {
    renderRegion(snapshot({ inventory: [inv("NOECON", 100, 0, null)] }));
    const row = screen.getByText("NOECON").closest("tr")!;
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
