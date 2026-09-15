/**
 * UnencumberedInventory — Console region render tests (PL-ELIG V1).
 *
 * Proves the three-state presentation distinction, provenance line + fallback,
 * geometry-warning rendering, odd-lot visibility, split Fidelity-worded columns,
 * and the bottom Totals row.
 * Canonical: docs/parking-lot-8.md §PL-ELIG — Unencumbered Shares on the Operator Console.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UnencumberedInventory, buildUnencumberedCsvRows } from "../../src/operator-console/UnencumberedInventory";
import type { PortfolioSnapshot, InventoryPosition, OpenShortCall, PositionEconomics } from "../../src/write-desk/types";
import type { QuoteObservation } from "../../src/evidence/observation-store";
import type { SpotHistoryMap, SpotObservation } from "../../src/evidence/use-spot-history";

// --- Live-evidence helpers (Last Price / gain-loss / Freshness / Current value) ---

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

/** History with a same-day move from `from` → `to` (3h earlier → now). */
function move(symbol: string, from: number, to: number) {
  const now = new Date().toISOString();
  const earlier = new Date(Date.now() - 3 * 3600_000).toISOString();
  return { symbol, moments: [{ price: from, observedAt: earlier }, { price: to, observedAt: now }] };
}

const NOW = new Date().toISOString();

describe("UnencumberedInventory region", () => {
  it("renders Fidelity-worded columns, split into $ and % (no title totals)", () => {
    renderRegion(snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }));
    expect(screen.getByText("Unencumbered Shares")).toBeTruthy();
    // Title carries NO totals parenthetical anymore.
    const title = screen.getByText("Unencumbered Shares").closest("span")!;
    expect(title.textContent).toBe("Unencumbered Shares");

    const headerText = screen.getAllByRole("columnheader").map(h => h.textContent ?? "").join(" | ");
    for (const label of [
      "Last Price", "Today's gain/loss $", "Today's gain/loss %",
      "Total gain/loss $", "Total gain/loss %", "Current value",
      "Quantity", "Free Lots", "Average cost basis", "Freshness",
    ]) {
      expect(headerText).toContain(label);
    }
  });

  it("splits Today's and Total gain/loss into separate $ and % cells (dollar figures)", () => {
    // COPX: 100 free, 92 → 94 today (+$2/sh → +$200; +2.17%); basis 40 → total +$5,400 (+135.00%)
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: NOW }]),
      historyMap([move("COPX", 92.0, 94.0)]),
    );
    const row = screen.getByText("COPX").closest("tr")!;
    const u = within(row);
    expect(u.getByText("$94.00")).toBeTruthy();       // Last Price
    expect(u.getByText("+$200")).toBeTruthy();          // Today's gain/loss $ (dollar figure)
    expect(u.getByText("+2.17%")).toBeTruthy();         // Today's gain/loss %
    expect(u.getByText("+$5,400")).toBeTruthy();        // Total gain/loss $
    expect(u.getByText("+135.00%")).toBeTruthy();       // Total gain/loss %
    expect(u.getByText("$9,400")).toBeTruthy();         // Current value = 100 × 94
    expect(u.getByText("$40.00")).toBeTruthy();         // Average cost basis
    expect(u.getByText("100")).toBeTruthy();            // Quantity
  });

  it("Total gain/loss is a dash when spot or basis is unavailable", () => {
    renderRegion(
      snapshot({ inventory: [inv("NOBASIS", 100, 0, null)] }),
      obsMap([{ symbol: "NOBASIS", price: 20, observedAt: NOW }]),
    );
    const row = screen.getByText("NOBASIS").closest("tr")!;
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("odd lot (50 free / 0 lots) is visible and not erroneous", () => {
    renderRegion(snapshot({ inventory: [inv("XYZ", 150, 100)], calls: [call("XYZ", 1)] }));
    const row = screen.getByText("XYZ").closest("tr")!;
    const u = within(row);
    expect(u.getByText("50")).toBeTruthy();  // quantity (free shares)
    expect(u.getByText("0")).toBeTruthy();    // free lots
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

  it("free-only symbol with NO observation renders dashes for live columns (no fabrication)", () => {
    renderRegion(snapshot({ inventory: [inv("FREE", 300, 0)] }), NO_OBS, NO_HISTORY);
    const row = screen.getByText("FREE").closest("tr")!;
    expect(within(row).getByText("300")).toBeTruthy(); // quantity still shown
    // last price, today $ , today %, total $, total %, current value, freshness → dashes
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(6);
  });

  // --- Bottom Totals row ---

  it("renders a bottom Totals row with summed gain/loss and current value", () => {
    // COPX: 100 free, 92→94 today (+$200), basis 40 → total +$5,400, value 9,400
    // AAA:  100 free, 10.5→10 today (-$50), basis 8 → total +$200, value 1,000
    renderRegion(
      snapshot({ inventory: [
        inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null }),
        inv("AAA", 100, 0, { averageCostPerShare: 8, costBasis: 800, marketValue: null }),
      ], calls: [call("COPX", 1)] }),
      obsMap([
        { symbol: "COPX", price: 94.0, observedAt: NOW },
        { symbol: "AAA", price: 10.0, observedAt: NOW },
      ]),
      historyMap([move("COPX", 92.0, 94.0), move("AAA", 10.5, 10.0)]),
    );
    const totalsRow = screen.getByText(/^Totals/).closest("tr")!;
    const u = within(totalsRow);
    // today total $ = +200 −50 = +$150
    expect(u.getByText("+$150")).toBeTruthy();
    // total gain/loss $ = 5,400 + 200 = +$5,600
    expect(u.getByText("+$5,600")).toBeTruthy();
    // current value total = 9,400 + 1,000 = $10,400
    expect(u.getByText("$10,400")).toBeTruthy();
    // quantity total = 200
    expect(u.getByText("200")).toBeTruthy();
  });

  it("Totals row marks partial and shows a note when a row lacks live evidence", () => {
    renderRegion(
      snapshot({ inventory: [
        inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null }),
        inv("FREE", 300, 0, { averageCostPerShare: 12, costBasis: 3600, marketValue: null }),
      ], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: NOW }]),
      historyMap([move("COPX", 92.0, 94.0)]),
    );
    expect(screen.getByText(/^Totals \*/)).toBeTruthy();
    expect(screen.getByText(/Totals cover only rows with the required live evidence/i)).toBeTruthy();
  });
});

describe("buildUnencumberedCsvRows", () => {
  it("emits split Fidelity-worded values matching the table", () => {
    const csvRows = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: NOW }]),
      historyMap([move("COPX", 92.0, 94.0)]),
    );
    expect(csvRows).toHaveLength(1);
    const r = csvRows[0];
    expect(r.symbol).toBe("COPX");
    expect(r.lastPrice).toBe("$94.00");
    expect(r.todayGlDollar).toBe("+$200");     // dollar figure (per-share × free shares)
    expect(r.todayGlPct).toBe("+2.17%");
    expect(r.totalGlDollar).toBe("+$5,400");
    expect(r.totalGlPct).toBe("+135.00%");
    expect(r.currentValue).toBe("$9,400");
    expect(r.quantity).toBe(100);
    expect(r.freeLots).toBe(1);
    expect(r.averageCostBasis).toBe("$40.00");
  });

  it("emits dashes (not fabricated values) for an unobserved free-only symbol", () => {
    const csvRows = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("FREE", 300, 0, { averageCostPerShare: 12, costBasis: 3600, marketValue: null })] }),
      NO_OBS,
      NO_HISTORY,
    );
    const r = csvRows[0];
    expect(r.symbol).toBe("FREE");
    expect(r.quantity).toBe(300);
    expect(r.lastPrice).toBe("—");
    expect(r.todayGlDollar).toBe("—");
    expect(r.todayGlPct).toBe("—");
    expect(r.totalGlDollar).toBe("—");
    expect(r.totalGlPct).toBe("—");
    expect(r.currentValue).toBe("—");
    expect(r.averageCostBasis).toBe("$12.00"); // basis is snapshot-derived, still present
    expect(r.freshness).toBe("—");
  });
});
