/**
 * UnencumberedInventory — Console region render tests (PL-ELIG V1; BUG-020).
 *
 * Proves the three-state presentation distinction, provenance line + fallback,
 * geometry-warning rendering, odd-lot visibility, split Fidelity-worded columns,
 * the bottom Totals row, and — post BUG-020 — that "Today's gain/loss $/%" is the
 * broker-parity daily move vs the provider PRIOR CLOSE (not Wheelwright's first
 * intraday observation), consumed identically by the table and the CSV export.
 * Canonical: docs/parking-lot-8.md §PL-ELIG; docs/bugs/BUG-020-*.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UnencumberedInventory, buildUnencumberedCsvRows } from "../../src/operator-console/UnencumberedInventory";
import type { PortfolioSnapshot, InventoryPosition, OpenShortCall, PositionEconomics } from "../../src/write-desk/types";
import type { QuoteObservation } from "../../src/evidence/observation-store";

// --- Live-evidence helpers (Last Price / gain-loss / Freshness / Current value) ---

function obsMap(
  entries: Array<{ symbol: string; price: number | null; previousClose?: number | null; observedAt: string | null }>,
): ReadonlyMap<string, QuoteObservation> {
  const m = new Map<string, QuoteObservation>();
  for (const e of entries) {
    m.set(e.symbol.toUpperCase(), {
      symbol: e.symbol.toUpperCase(),
      price: e.price,
      previousClose: e.previousClose ?? null,
      observedAt: e.observedAt,
      acquisitionStatus: "ready",
      lastAttemptAt: e.observedAt,
      failureCount: 0,
    });
  }
  return m;
}

const NO_OBS: ReadonlyMap<string, QuoteObservation> = new Map();

function renderRegion(snap: PortfolioSnapshot, observations = NO_OBS) {
  return render(<UnencumberedInventory snapshot={snap} observations={observations} />);
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

const NOW = new Date().toISOString();

describe("UnencumberedInventory region", () => {
  it("renders Fidelity-worded columns, split into $ and % (no title totals)", () => {
    renderRegion(snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }));
    expect(screen.getByText("Unencumbered Shares")).toBeTruthy();
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

  it("Today's G/L is the broker-parity move vs prior close (COPX-like: 92.66 → 94.00)", () => {
    // 100 free, prior close 92.66 → last 94.00: +$1.34/sh → +$134; +1.45%.
    // basis 40 → total +$5,400 (+135.00%); value 9,400.
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, previousClose: 92.66, observedAt: NOW }]),
    );
    const row = screen.getByText("COPX").closest("tr")!;
    const u = within(row);
    expect(u.getByText("$94.00")).toBeTruthy();       // Last Price
    expect(u.getByText("+$134")).toBeTruthy();          // Today's gain/loss $ = (94−92.66)×100
    expect(u.getByText("+1.45%")).toBeTruthy();         // Today's gain/loss %
    expect(u.getByText("+$5,400")).toBeTruthy();        // Total gain/loss $
    expect(u.getByText("+135.00%")).toBeTruthy();       // Total gain/loss %
    expect(u.getByText("$9,400")).toBeTruthy();         // Current value = 100 × 94
    expect(u.getByText("$40.00")).toBeTruthy();         // Average cost basis
  });

  it("SIGN-REVERSAL GUARD: up vs prior close renders POSITIVE even if last < some intraday sample", () => {
    // The old first-observation baseline produced a negative Today's G/L here.
    // Prior close 84.59 → last 85.89: must be positive (+$130), not negative.
    renderRegion(
      snapshot({ inventory: [inv("COPX", 100, 0, { averageCostPerShare: 94.84, costBasis: 9484, marketValue: null })] }),
      obsMap([{ symbol: "COPX", price: 85.89, previousClose: 84.59, observedAt: NOW }]),
    );
    const row = screen.getByText("COPX").closest("tr")!;
    const u = within(row);
    const cells = row.querySelectorAll("td");
    // Column order: Symbol, Last, Today $, Today %, Total $, Total %, ...
    expect(cells[2].textContent).toBe("+$130");         // Today's G/L $ = (85.89 − 84.59) × 100
    expect(cells[3].textContent).toBe("+1.54%");        // Today's G/L % = 1.30/84.59
    expect(u.getByText("+$130")).toBeTruthy();
  });

  it("Today's G/L is a dash (no fabricated 0) when previousClose is unavailable", () => {
    renderRegion(
      snapshot({ inventory: [inv("NOPREV", 100, 0, { averageCostPerShare: 10, costBasis: 1000, marketValue: null })] }),
      obsMap([{ symbol: "NOPREV", price: 20, previousClose: null, observedAt: NOW }]),
    );
    const row = screen.getByText("NOPREV").closest("tr")!;
    const u = within(row);
    // Today $ and Today % are dashes; Last Price + Total G/L still render.
    expect(u.getByText("$20.00")).toBeTruthy();
    expect(u.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("Total gain/loss is a dash when spot or basis is unavailable", () => {
    renderRegion(
      snapshot({ inventory: [inv("NOBASIS", 100, 0, null)] }),
      obsMap([{ symbol: "NOBASIS", price: 20, previousClose: 19.5, observedAt: NOW }]),
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
    renderRegion(snapshot({ inventory: [inv("FREE", 300, 0)] }), NO_OBS);
    const row = screen.getByText("FREE").closest("tr")!;
    expect(within(row).getByText("300")).toBeTruthy(); // quantity still shown
    // last price, today $ , today %, total $, total %, current value, freshness → dashes
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(6);
  });

  // --- Bottom Totals row ---

  it("renders a bottom Totals row with summed gain/loss and current value", () => {
    // COPX: 100 free, prior 92.66 → 94.00 today (+$134), basis 40 → total +$5,400, value 9,400
    // AAA:  100 free, prior 10.50 → 10.00 today (-$50),  basis 8  → total +$200,   value 1,000
    renderRegion(
      snapshot({ inventory: [
        inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null }),
        inv("AAA", 100, 0, { averageCostPerShare: 8, costBasis: 800, marketValue: null }),
      ], calls: [call("COPX", 1)] }),
      obsMap([
        { symbol: "COPX", price: 94.0, previousClose: 92.66, observedAt: NOW },
        { symbol: "AAA", price: 10.0, previousClose: 10.5, observedAt: NOW },
      ]),
    );
    const totalsRow = screen.getByText(/^Totals/).closest("tr")!;
    const u = within(totalsRow);
    // today total $ = +134 −50 = +$84
    expect(u.getByText("+$84")).toBeTruthy();
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
      obsMap([{ symbol: "COPX", price: 94.0, previousClose: 92.66, observedAt: NOW }]),
    );
    expect(screen.getByText(/^Totals \*/)).toBeTruthy();
    expect(screen.getByText(/Totals cover only rows with the required live evidence/i)).toBeTruthy();
  });
});

describe("buildUnencumberedCsvRows", () => {
  it("emits split Fidelity-worded values matching the table (prior-close Today's G/L)", () => {
    const csvRows = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, previousClose: 92.66, observedAt: NOW }]),
    );
    expect(csvRows).toHaveLength(1);
    const r = csvRows[0];
    expect(r.symbol).toBe("COPX");
    expect(r.lastPrice).toBe("$94.00");
    expect(r.todayGlDollar).toBe("+$134");     // (94 − 92.66) × 100
    expect(r.todayGlPct).toBe("+1.45%");
    expect(r.totalGlDollar).toBe("+$5,400");
    expect(r.totalGlPct).toBe("+135.00%");
    expect(r.currentValue).toBe("$9,400");
    expect(r.quantity).toBe(100);
    expect(r.freeLots).toBe(1);
    expect(r.averageCostBasis).toBe("$40.00");
  });

  it("UI/CSV AGREEMENT: CSV Today's G/L equals the rendered table cell for the same fixture", () => {
    const snap = snapshot({ inventory: [inv("SMH", 100, 0, { averageCostPerShare: 574.64, costBasis: 57464, marketValue: null })] });
    const obs = obsMap([{ symbol: "SMH", price: 551.02, previousClose: 542.11, observedAt: NOW }]);

    // Rendered table cell
    renderRegion(snap, obs);
    const row = screen.getByText("SMH").closest("tr")!;
    // Large-gap guard: +$891 (551.02 − 542.11) × 100, NOT a small negative.
    expect(within(row).getByText("+$891")).toBeTruthy();

    // CSV row for the same inputs
    const csv = buildUnencumberedCsvRows(snap, obs)[0];
    expect(csv.todayGlDollar).toBe("+$891");
    // % agreement
    const uiPct = within(row).getByText(/^\+1\.64%$/);
    expect(uiPct).toBeTruthy();
    expect(csv.todayGlPct).toBe("+1.64%");
  });

  it("FRACTIONAL-QUANTITY (SPYI): 69 free shares priced against prior close", () => {
    // Unencumbered rows are whole free shares; SPYI's fractional 0.829 is an odd-lot
    // residual. Guard the fractional path at the derivation level in today-gl.test.ts;
    // here confirm the whole-lot free-share dollar move is prior-close based.
    const csv = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("SPYI", 69, 0, { averageCostPerShare: 53.46, costBasis: 3688.74, marketValue: null })] }),
      obsMap([{ symbol: "SPYI", price: 52.855, previousClose: 52.666, observedAt: NOW }]),
    )[0];
    // (52.855 − 52.666) × 69 ≈ 13.04 → +$13
    expect(csv.todayGlDollar).toBe("+$13");
    expect(csv.todayGlPct).toBe("+0.36%");
  });

  it("emits dashes (not fabricated values) for an unobserved free-only symbol", () => {
    const csvRows = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("FREE", 300, 0, { averageCostPerShare: 12, costBasis: 3600, marketValue: null })] }),
      NO_OBS,
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

  it("CSV Today's G/L is a dash when previousClose is unavailable (has price, no prior close)", () => {
    const r = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("NOPREV", 100, 0, { averageCostPerShare: 10, costBasis: 1000, marketValue: null })] }),
      obsMap([{ symbol: "NOPREV", price: 20, previousClose: null, observedAt: NOW }]),
    )[0];
    expect(r.lastPrice).toBe("$20.00");
    expect(r.todayGlDollar).toBe("—");
    expect(r.todayGlPct).toBe("—");
  });
});
