/**
 * PL-EVID-AGE follow-up — activity-projection deployableCash semantics under
 * shares_sold_direct.
 *
 * These tests pin an INTENTIONAL SEMANTIC CORRECTION made during the ADR-015
 * build-repair commit (9576c3e), NOT a behavior-preserving cleanup:
 *
 *   Previously `deployableCash += proceeds` ran unconditionally, so when the
 *   cash base was null (unknown — no Balances CSV) it coerced unknown cash into
 *   a concrete number. The corrected code preserves null (unknown cash + known
 *   proceeds is still unknown) and only accumulates when a numeric base exists.
 *
 * Proven here:
 *   1. deployableCash === null remains null after a direct share sale.
 *   2. numeric deployableCash increases by the sale proceeds.
 *   3. inventory/share removal is unchanged by the cash-null distinction.
 */

import { describe, it, expect } from "vitest";
import { projectActivityOverlay } from "../../src/portfolio/activity-projection";
import type { PortfolioSnapshot, InventoryPosition } from "../../src/write-desk/types";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";

const CHECKPOINT = new Date("2026-08-01T00:00:00Z"); // before the sale → projected

function inv(symbol: string, sharesOwned: number): InventoryPosition {
  return {
    symbol,
    sharesOwned,
    sharesEncumbered: 0,
    sharesFree: sharesOwned,
    maxAdditionalContracts: Math.floor(sharesOwned / 100),
    economics: null,
  } as unknown as InventoryPosition;
}

function baseSnapshot(deployableCash: number | null, inventory: InventoryPosition[]): PortfolioSnapshot {
  return {
    id: "test",
    source: { type: "fidelity", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-08-01",
    inventory,
    existingCalls: [],
    existingPuts: [],
    deployableCash,
    balanceContext: null,
    provenance: { sourceType: "fidelity", sourceLabel: "Test", createdAt: "2026-08-01T00:00:00Z" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
  } as unknown as PortfolioSnapshot;
}

function sharesSoldDirect(symbol: string, shares: number, proceeds: number): ActivityRow {
  return {
    date: "2026-08-15",
    eventType: "shares_sold_direct",
    action: "YOU SOLD",
    symbol,
    description: `YOU SOLD ${symbol}`,
    quantity: -shares,
    price: proceeds / shares,
    commission: null,
    fees: null,
    amount: proceeds,
    cashBalance: null,
    settlementDate: null,
    option: null,
    rawRow: [],
  };
}

describe("activity-projection deployableCash under shares_sold_direct", () => {
  it("preserves null deployableCash (unknown cash + known proceeds is still unknown)", () => {
    const base = baseSnapshot(null, [inv("XLE", 200)]);
    const { snapshot } = projectActivityOverlay(base, [sharesSoldDirect("XLE", 100, 5000)], CHECKPOINT);
    expect(snapshot.deployableCash).toBeNull();
  });

  it("increases numeric deployableCash by the sale proceeds", () => {
    const base = baseSnapshot(10000, [inv("XLE", 200)]);
    const { snapshot } = projectActivityOverlay(base, [sharesSoldDirect("XLE", 100, 5000)], CHECKPOINT);
    expect(snapshot.deployableCash).toBe(15000);
  });

  it("removes/decrements inventory shares regardless of cash-null distinction", () => {
    // Sell the entire lot → position removed. Same outcome whether cash is known or unknown.
    for (const cash of [null, 10000] as const) {
      const base = baseSnapshot(cash, [inv("XLE", 100)]);
      const { snapshot } = projectActivityOverlay(base, [sharesSoldDirect("XLE", 100, 5000)], CHECKPOINT);
      expect(snapshot.inventory.find((p) => p.symbol === "XLE")).toBeUndefined();
    }
    // Partial sale → shares decremented, position retained.
    const base = baseSnapshot(10000, [inv("XLE", 200)]);
    const { snapshot } = projectActivityOverlay(base, [sharesSoldDirect("XLE", 100, 5000)], CHECKPOINT);
    const pos = snapshot.inventory.find((p) => p.symbol === "XLE");
    expect(pos?.sharesOwned).toBe(100);
  });
});
