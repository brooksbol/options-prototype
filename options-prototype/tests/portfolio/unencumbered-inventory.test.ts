/**
 * Unencumbered Inventory — Unit Tests (PL-ELIG V1)
 *
 * Validates the pure projection of standalone free-share inventory + geometry
 * warnings from a PortfolioSnapshot. Behavioral cases trace directly to the
 * persisted contract (docs/parking-lot-8.md §PL-ELIG — Unencumbered Shares on
 * the Operator Console).
 *
 * Each geometry case documents: observed ownership (incl. null), raw call-required
 * shares, stored/clamped encumbrance where relevant, expected free shares/lots,
 * and expected warning state.
 */

import { describe, it, expect } from "vitest";
import { deriveUnencumberedInventory } from "../../src/portfolio/unencumbered-inventory";
import type { PortfolioSnapshot, InventoryPosition, OpenShortCall } from "../../src/write-desk/types";

// --- Helpers ---

function inv(
  symbol: string,
  sharesOwned: number,
  sharesEncumbered: number,
): InventoryPosition {
  // Mirror deriveInventory clamp semantics so fixtures stay honest:
  //   sharesEncumbered clamped to owned; sharesFree = max(0, owned - clamped);
  //   maxAdditionalContracts = floor(sharesFree / 100).
  const clampedEnc = Math.min(sharesEncumbered, sharesOwned);
  const sharesFree = Math.max(0, sharesOwned - clampedEnc);
  return {
    symbol,
    sharesOwned,
    sharesEncumbered: clampedEnc,
    sharesFree,
    maxAdditionalContracts: Math.floor(sharesFree / 100),
    economics: null,
  };
}

function call(underlying: string, quantity: number, strike = 100): OpenShortCall {
  return {
    symbol: `-${underlying}C${strike}`,
    underlying,
    strike,
    expiration: "2026-10-16",
    quantity,
    brokerOptionBasis: null,
    brokerOptionAverageCost: null,
  };
}

function snapshot(opts?: {
  inventory?: InventoryPosition[];
  calls?: OpenShortCall[];
  provenance?: Partial<PortfolioSnapshot["provenance"]>;
  readiness?: Partial<PortfolioSnapshot["readiness"]>;
}): PortfolioSnapshot {
  return {
    id: "test-unenc",
    source: { type: "demo", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-09-14",
    inventory: opts?.inventory ?? [],
    existingPuts: [],
    existingCalls: opts?.calls ?? [],
    deployableCash: 10000,
    aggregateShortOptionMTM: null,
    balanceContext: null,
    provenance: {
      sourceType: "fidelity",
      sourceLabel: "Fidelity",
      createdAt: "2026-09-14T21:00:00Z",
      optionSummaryFilename: "Option_Summary.csv",
      optionSummaryExportTimestamp: "2026-09-14T20:45:00Z",
      optionSummaryParsedAt: "2026-09-14T20:46:00Z",
      accountId: "TEST",
      ...opts?.provenance,
    },
    readiness: {
      status: "READY",
      optionSummaryLoaded: true,
      balancesLoaded: true,
      inventoryValid: true,
      cashStateValid: true,
      timestampsReconciled: true,
      timeSeparationMinutes: 0,
      warnings: [],
      blockReasons: [],
      ...opts?.readiness,
    },
  } as PortfolioSnapshot;
}

// --- Row derivation ---

describe("deriveUnencumberedInventory — rows", () => {
  it("200 owned / 1 call (100 req): 100 free / 1 lot → row, no warning", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] }));
    expect(r.rows).toEqual([{ symbol: "COPX", freeShares: 100, freeLots: 1 }]);
    expect(r.geometryWarnings).toEqual([]);
  });

  it("200 owned / 2 calls (200 req): 0 free → no row, no warning", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("COPX", 200, 200)], calls: [call("COPX", 2)] }));
    expect(r.rows).toEqual([]);
    expect(r.geometryWarnings).toEqual([]);
  });

  it("150 owned / 1 call (100 req): 50 free / 0 lots → ODD-LOT row visible, no warning", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("XYZ", 150, 100)], calls: [call("XYZ", 1)] }));
    expect(r.rows).toEqual([{ symbol: "XYZ", freeShares: 50, freeLots: 0 }]);
    expect(r.geometryWarnings).toEqual([]);
  });

  it("250 owned / 1 call (100 req): 150 free / 1 lot (residual 50) → row, no warning", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("XLE", 250, 100)], calls: [call("XLE", 1)] }));
    expect(r.rows).toEqual([{ symbol: "XLE", freeShares: 150, freeLots: 1 }]);
    expect(r.geometryWarnings).toEqual([]);
  });

  it("sharesFree === 0 (fully encumbered, no calls fixture) produces no row", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("ABC", 100, 100)] }));
    expect(r.rows).toEqual([]);
  });

  it("emits exactly sharesFree, never sharesOwned", () => {
    // Owned 500, encumbered 100 → free 400. Row must show 400, never 500.
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("BIG", 500, 100)], calls: [call("BIG", 1)] }));
    expect(r.rows[0].freeShares).toBe(400);
    expect(r.rows[0].freeShares).not.toBe(500);
    expect(r.rows[0].freeLots).toBe(4);
  });

  it("rows are sorted by symbol", () => {
    const r = deriveUnencumberedInventory(snapshot({
      inventory: [inv("ZZZ", 100, 0), inv("AAA", 100, 0), inv("MMM", 100, 0)],
    }));
    expect(r.rows.map(x => x.symbol)).toEqual(["AAA", "MMM", "ZZZ"]);
  });

  it("standalone rows never carry owned or encumbered quantities as free inventory", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("XLE", 250, 100)], calls: [call("XLE", 1)] }));
    const row = r.rows[0] as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(["freeLots", "freeShares", "symbol"]);
    expect(row.freeShares).not.toBe(250); // not owned
    expect(row.freeShares).not.toBe(100); // not encumbered
  });
});

// --- Consistent geometry invariant ---

describe("deriveUnencumberedInventory — consistent geometry", () => {
  it("rawCallRequiredShares + displayedFreeShares === observedSharesOwned", () => {
    // 200 owned, 1 call (100 req), 100 free → 100 + 100 === 200.
    const s = snapshot({ inventory: [inv("COPX", 200, 100)], calls: [call("COPX", 1)] });
    const r = deriveUnencumberedInventory(s);
    const owned = s.inventory[0].sharesOwned;
    const raw = 100;
    const displayedFree = r.rows.find(x => x.symbol === "COPX")!.freeShares;
    expect(raw + displayedFree).toBe(owned);
    expect(r.geometryWarnings).toEqual([]);
  });
});

// --- Inconsistent geometry (do NOT assert reconciliation) ---

describe("deriveUnencumberedInventory — inconsistent geometry", () => {
  it("raw call-required (200) > observed owned (100): warning, no fabricated free row", () => {
    // Clamp forces sharesFree = 0 (safe display); disagreement surfaces as a warning.
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("COPX", 100, 200)], calls: [call("COPX", 2)] }));
    expect(r.rows).toEqual([]); // no fabricated free inventory
    expect(r.geometryWarnings).toHaveLength(1);
    const w = r.geometryWarnings[0];
    expect(w.symbol).toBe("COPX");
    expect(w.observedSharesOwned).toBe(100);
    expect(w.rawCallRequiredShares).toBe(200);
    expect(w.explanation).toMatch(/do not reconcile/i);
  });

  it("open-call underlying with NO inventory record: ownership-evidence-unavailable warning (owned = null)", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [], calls: [call("ABC", 1)] }));
    expect(r.rows).toEqual([]);
    expect(r.geometryWarnings).toHaveLength(1);
    const w = r.geometryWarnings[0];
    expect(w.symbol).toBe("ABC");
    expect(w.observedSharesOwned).toBeNull(); // NOT zero
    expect(w.rawCallRequiredShares).toBe(100);
    expect(w.explanation).toMatch(/ownership evidence is unavailable/i);
  });

  it("missing inventory evidence is not converted to zero shares owned", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [], calls: [call("ABC", 2)] }));
    expect(r.geometryWarnings[0].observedSharesOwned).not.toBe(0);
    expect(r.geometryWarnings[0].observedSharesOwned).toBeNull();
  });

  it("geometry analysis covers the UNION of inventory symbols and open-call underlyings", () => {
    // DEF has inventory but no calls (no warning); GHI has calls but no inventory (warning).
    const r = deriveUnencumberedInventory(snapshot({
      inventory: [inv("DEF", 100, 0)],
      calls: [call("GHI", 1)],
    }));
    expect(r.rows.map(x => x.symbol)).toEqual(["DEF"]); // DEF free row
    expect(r.geometryWarnings.map(w => w.symbol)).toEqual(["GHI"]); // GHI evidence-unavailable
    expect(r.geometryWarnings[0].observedSharesOwned).toBeNull();
  });

  it("warnings are independent of free-share rows (both can coexist)", () => {
    const r = deriveUnencumberedInventory(snapshot({
      inventory: [inv("FREE", 200, 0)],          // 200 free → row
      calls: [call("FREE", 0), call("GONE", 1)], // GONE has calls, no inventory → warning
    }));
    expect(r.rows.map(x => x.symbol)).toEqual(["FREE"]);
    expect(r.geometryWarnings.map(w => w.symbol)).toEqual(["GONE"]);
  });

  it("consistent case with calls == owned emits no warning", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("XLF", 200, 200)], calls: [call("XLF", 2)] }));
    expect(r.geometryWarnings).toEqual([]);
  });
});

// --- Provenance ---

describe("deriveUnencumberedInventory — provenance", () => {
  it("warning carries Option Summary provenance only", () => {
    const r = deriveUnencumberedInventory(snapshot({ inventory: [], calls: [call("ABC", 1)] }));
    const p = r.geometryWarnings[0].provenance;
    expect(p.optionSummaryFilename).toBe("Option_Summary.csv");
    expect(p.optionSummaryExportTimestamp).toBe("2026-09-14T20:45:00Z");
    expect(p.optionSummaryParsedAt).toBe("2026-09-14T20:46:00Z");
    // never balances provenance
    expect(Object.keys(p).sort()).toEqual([
      "optionSummaryExportTimestamp",
      "optionSummaryFilename",
      "optionSummaryParsedAt",
    ]);
  });

  it("warning provenance leaves export timestamp undefined when absent (no substitution)", () => {
    const r = deriveUnencumberedInventory(snapshot({
      inventory: [],
      calls: [call("ABC", 1)],
      provenance: { optionSummaryExportTimestamp: undefined, optionSummaryParsedAt: "2026-09-14T20:46:00Z" },
    }));
    const p = r.geometryWarnings[0].provenance;
    // export timestamp genuinely absent; parse time NOT promoted into export field
    expect(p.optionSummaryExportTimestamp).toBeUndefined();
    expect(p.optionSummaryParsedAt).toBe("2026-09-14T20:46:00Z");
  });
});

// --- Independence from recommendation / chain availability ---

describe("deriveUnencumberedInventory — independence", () => {
  it("depends only on snapshot inventory + calls, not on any recommendation/chain input", () => {
    // The function signature takes only a PortfolioSnapshot; there is no cache,
    // policy, or chain parameter. Free-share rows appear regardless of whether a
    // qualifying covered call or option chain exists.
    const r = deriveUnencumberedInventory(snapshot({ inventory: [inv("NOCHAIN", 300, 0)] }));
    expect(r.rows).toEqual([{ symbol: "NOCHAIN", freeShares: 300, freeLots: 3 }]);
    expect(deriveUnencumberedInventory.length).toBe(1); // arity: snapshot only
  });
});
