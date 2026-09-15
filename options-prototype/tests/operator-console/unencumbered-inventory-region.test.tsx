/**
 * UnencumberedInventory — Console region render tests (PL-ELIG V1).
 *
 * Proves the three-state presentation distinction, provenance line + fallback,
 * geometry-warning rendering, and odd-lot visibility at the presentation boundary.
 * Canonical: docs/parking-lot-8.md §PL-ELIG — Unencumbered Shares on the Operator Console.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UnencumberedInventory, buildUnencumberedCsvRows } from "../../src/operator-console/UnencumberedInventory";
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
    const headerText = screen.getAllByRole("columnheader").map(h => h.textContent ?? "").join(" | ");
    for (const label of ["Free Shares", "Free Lots", "Spot", "Today's G/L", "Total G/L", "Capital", "Share Basis", "Freshness"]) {
      expect(headerText).toContain(label);
    }
    // No separate percent column.
    expect(headerText).not.toContain("Today's G/L %");
  });

  it("Total G/L column = (spot − blended basis) × free shares, combined $ (%)", () => {
    const now = new Date().toISOString();
    // 100 free × (spot 94 − basis 40) = +$5,400; % = (94−40)/40 = +135.00%
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]),
    );
    const row = screen.getByText("COPX").closest("tr")!;
    expect(within(row).getByText("+$5,400 (+135.00%)")).toBeTruthy();
  });

  it("Total G/L is a dash when spot or basis is unavailable", () => {
    // Spot present, basis null → total G/L unavailable.
    const now = new Date().toISOString();
    renderRegion(
      snapshot({ inventory: [inv("NOBASIS", 100, 0, null)] }),
      obsMap([{ symbol: "NOBASIS", price: 20, observedAt: now }]),
    );
    const row = screen.getByText("NOBASIS").closest("tr")!;
    // Total G/L cell dash (basis missing) — at least one dash present in the row.
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("Today's G/L is a single combined $ (%) column", () => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]),
      historyMap([{ symbol: "COPX", moments: [
        { price: 92.0, observedAt: new Date(nowMs - 3 * 3600_000).toISOString() },
        { price: 94.0, observedAt: now },
      ] }]),
    );
    const row = screen.getByText("COPX").closest("tr")!;
    // Combined single cell: "+$2.00 (+2.17%)"
    expect(within(row).getByText("+$2.00 (+2.17%)")).toBeTruthy();
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
    // Today's G/L combined cell — same-day move from 92 → 94
    expect(u.getByText("+$2.00 (+2.17%)")).toBeTruthy();
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

  it("title shows a total-capital parenthetical = sum of priced rows' capital", () => {
    const now = new Date().toISOString();
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100), inv("AAA", 100, 0)] }),
      obsMap([
        { symbol: "COPX", price: 94.0, observedAt: now }, // 100 free × 94 = 9,400
        { symbol: "AAA", price: 10.0, observedAt: now },  // 100 free × 10 = 1,000
      ]),
    );
    const title = screen.getByText("Unencumbered Shares").closest("span")!;
    expect(title.textContent).toMatch(/\(\$10,400\)/); // 9,400 + 1,000, no "partial"
    expect(title.textContent).not.toMatch(/partial/);
  });

  it("title total is marked (partial) when some rows lack a live quote", () => {
    const now = new Date().toISOString();
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100), inv("FREE", 300, 0)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]), // FREE unpriced
    );
    const title = screen.getByText("Unencumbered Shares").closest("span")!;
    expect(title.textContent).toMatch(/\(\$9,400 \(partial\)\)/);
  });

  it("no total parenthetical when no row has a live quote", () => {
    renderRegion(snapshot({ inventory: [inv("FREE", 300, 0)] }), NO_OBS, NO_HISTORY);
    const title = screen.getByText("Unencumbered Shares").closest("span")!;
    // Only the label, no "($...)" total.
    expect(title.textContent).not.toMatch(/\$/);
  });

  function titleSpan(): HTMLElement {
    return screen.getByText("Unencumbered Shares").closest("span")!;
  }

  it("title shows total G/L $ and % next to the capital total (dollar-weighted)", () => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const earlier = new Date(nowMs - 3 * 3600_000).toISOString();
    // COPX: 100 free, 92 → 94 (+$200, ref base 100×92 = 9,200)
    // AAA:  100 free, 10.5 → 10.0 (-$50, ref base 100×10.5 = 1,050)
    // total $ = +150; ref base = 10,250; total % = 150/10,250 = +1.46%
    // total capital = 100×94 + 100×10 = 10,400
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100), inv("AAA", 100, 0)] }),
      obsMap([
        { symbol: "COPX", price: 94.0, observedAt: now },
        { symbol: "AAA", price: 10.0, observedAt: now },
      ]),
      historyMap([
        { symbol: "COPX", moments: [{ price: 92.0, observedAt: earlier }, { price: 94.0, observedAt: now }] },
        { symbol: "AAA", moments: [{ price: 10.5, observedAt: earlier }, { price: 10.0, observedAt: now }] },
      ]),
    );
    const t = titleSpan().textContent ?? "";
    expect(t).toMatch(/\(\$10,400\)/);      // capital total
    expect(t).toMatch(/\+\$150/);            // total G/L $
    expect(t).toMatch(/\+1\.46%/);           // total G/L % (dollar-weighted)
    expect(t).not.toMatch(/partial/);
  });

  it("title G/L totals are (partial) when a row lacks a computable move", () => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const earlier = new Date(nowMs - 3 * 3600_000).toISOString();
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100), inv("FREE", 300, 0)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]),
      historyMap([{ symbol: "COPX", moments: [{ price: 92.0, observedAt: earlier }, { price: 94.0, observedAt: now }] }]),
    );
    const t = titleSpan().textContent ?? "";
    expect(t).toMatch(/\+\$200 \(partial\)/);
    expect(t).toMatch(/partial/);
  });

  it("no title G/L total when no row has a computable move", () => {
    renderRegion(snapshot({ inventory: [inv("FREE", 300, 0)] }), NO_OBS, NO_HISTORY);
    const t = titleSpan().textContent ?? "";
    // No dollar/percent totals at all (no priced rows, no moves).
    expect(t).not.toMatch(/\$/);
    expect(t).not.toMatch(/%/);
  });

  it("Today's G/L column header carries no inline total (totals live in the title)", () => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    renderRegion(
      snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]),
      historyMap([{ symbol: "COPX", moments: [{ price: 92.0, observedAt: new Date(nowMs - 3 * 3600_000).toISOString() }, { price: 94.0, observedAt: now }] }]),
    );
    const glHeader = screen.getAllByRole("columnheader").find(h => /Today's G\/L/.test(h.textContent ?? ""))!;
    expect(glHeader.textContent).toBe("Today's G/L");
  });
});

describe("buildUnencumberedCsvRows", () => {
  it("emits the same truthful values as the table (Today's G/L, Total G/L, capital, basis)", () => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const earlier = new Date(nowMs - 3 * 3600_000).toISOString();
    const csvRows = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("COPX", 200, 100, { averageCostPerShare: 40, costBasis: 8000, marketValue: null })], calls: [call("COPX", 1)] }),
      obsMap([{ symbol: "COPX", price: 94.0, observedAt: now }]),
      historyMap([{ symbol: "COPX", moments: [{ price: 92.0, observedAt: earlier }, { price: 94.0, observedAt: now }] }]),
    );
    expect(csvRows).toHaveLength(1);
    const r = csvRows[0];
    expect(r.symbol).toBe("COPX");
    expect(r.freeShares).toBe(100);
    expect(r.freeLots).toBe(1);
    expect(r.spot).toBe("$94.00");
    expect(r.todayGl).toBe("+$2.00 (+2.17%)");
    expect(r.totalGl).toBe("+$5,400 (+135.00%)"); // (94−40)×100 ; (94−40)/40
    expect(r.capital).toBe("$9,400");
    expect(r.shareBasis).toBe("$40.00");
  });

  it("emits dashes (not fabricated values) for an unobserved free-only symbol", () => {
    const csvRows = buildUnencumberedCsvRows(
      snapshot({ inventory: [inv("FREE", 300, 0, { averageCostPerShare: 12, costBasis: 3600, marketValue: null })] }),
      NO_OBS,
      NO_HISTORY,
    );
    const r = csvRows[0];
    expect(r.symbol).toBe("FREE");
    expect(r.freeShares).toBe(300);
    expect(r.spot).toBe("—");
    expect(r.todayGl).toBe("—");
    expect(r.totalGl).toBe("—");   // no spot → no total G/L
    expect(r.capital).toBe("—");
    expect(r.shareBasis).toBe("$12.00"); // basis is snapshot-derived, still present
    expect(r.freshness).toBe("—");
  });
});
