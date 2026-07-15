/**
 * Tests for Pending Intent — lightweight order awareness for duplicate-symbol governance.
 *
 * Pending Intents do NOT compute cash. Fidelity's "Available to trade (all settled)"
 * is authoritative for deployable cash.
 */

import { describe, it, expect } from "vitest";
import {
  createPendingIntent,
  resolvePendingIntent,
  hasWorkingIntent,
  getWorkingIntentsForSymbol,
  type PendingIntent,
} from "../../src/execution/pending-intent";
import type { WriteIntent } from "../../src/execution/write-intent";

// --- Fixtures ---

const validIntent: WriteIntent = {
  underlyingSymbol: "URA",
  contractSymbol: "-URA260807P40",
  expiration: "2026-08-07",
  optionType: "put",
  strike: 40,
  action: "sell-to-open",
  quantity: 1,
  orderType: "limit",
  limitPrice: 1.75,
  timeInForce: "day",
};

function makeIntent(overrides: Partial<PendingIntent> = {}): PendingIntent {
  return {
    id: "pi-test-1",
    symbol: "URA",
    contractSymbol: "-URA260807P40",
    expiration: "2026-08-07",
    optionType: "put",
    strike: 40,
    quantity: 1,
    limitPrice: 1.75,
    status: "working",
    submittedAt: "2026-07-15T14:31:00Z",
    updatedAt: "2026-07-15T14:31:00Z",
    ...overrides,
  };
}

// --- Create ---

describe("createPendingIntent", () => {
  it("creates a working intent from WriteIntent", () => {
    const pi = createPendingIntent(validIntent);
    expect(pi.symbol).toBe("URA");
    expect(pi.contractSymbol).toBe("-URA260807P40");
    expect(pi.strike).toBe(40);
    expect(pi.quantity).toBe(1);
    expect(pi.limitPrice).toBe(1.75);
    expect(pi.status).toBe("working");
    expect(pi.optionType).toBe("put");
  });

  it("generates unique IDs", () => {
    const p1 = createPendingIntent(validIntent);
    const p2 = createPendingIntent(validIntent);
    expect(p1.id).not.toBe(p2.id);
  });

  it("does NOT compute cash reservation", () => {
    const pi = createPendingIntent(validIntent);
    // PendingIntent has no reservedCash field — it's purely for awareness
    expect("reservedCash" in pi).toBe(false);
  });
});

// --- Resolve ---

describe("resolvePendingIntent", () => {
  it("filled → status changes, immutable", () => {
    const pi = makeIntent();
    const resolved = resolvePendingIntent(pi, "filled");
    expect(resolved.status).toBe("filled");
    expect(pi.status).toBe("working"); // original unchanged
  });

  it("cancelled → status changes", () => {
    const resolved = resolvePendingIntent(makeIntent(), "cancelled");
    expect(resolved.status).toBe("cancelled");
  });

  it("expired → status changes", () => {
    const resolved = resolvePendingIntent(makeIntent(), "expired");
    expect(resolved.status).toBe("expired");
  });
});

// --- Duplicate Detection ---

describe("hasWorkingIntent", () => {
  it("detects working intent for symbol", () => {
    const intents = [makeIntent({ symbol: "URA", status: "working" })];
    expect(hasWorkingIntent("URA", intents)).toBe(true);
  });

  it("case-insensitive", () => {
    const intents = [makeIntent({ symbol: "URA", status: "working" })];
    expect(hasWorkingIntent("ura", intents)).toBe(true);
  });

  it("ignores filled intents", () => {
    const intents = [makeIntent({ symbol: "URA", status: "filled" })];
    expect(hasWorkingIntent("URA", intents)).toBe(false);
  });

  it("ignores cancelled intents", () => {
    const intents = [makeIntent({ symbol: "URA", status: "cancelled" })];
    expect(hasWorkingIntent("URA", intents)).toBe(false);
  });

  it("returns false for unrelated symbols", () => {
    const intents = [makeIntent({ symbol: "URA", status: "working" })];
    expect(hasWorkingIntent("XLE", intents)).toBe(false);
  });

  it("returns false for empty intents", () => {
    expect(hasWorkingIntent("URA", [])).toBe(false);
  });
});

describe("getWorkingIntentsForSymbol", () => {
  it("returns working intents for symbol only", () => {
    const intents = [
      makeIntent({ id: "a", symbol: "URA", status: "working" }),
      makeIntent({ id: "b", symbol: "URA", status: "filled" }),
      makeIntent({ id: "c", symbol: "XLE", status: "working" }),
    ];
    const result = getWorkingIntentsForSymbol("URA", intents);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

// --- Cash model invariant ---

describe("cash model correctness", () => {
  it("PendingIntent does not affect deployable cash computation", () => {
    // This test documents the architectural decision:
    // Fidelity's "Available to trade (all settled)" is authoritative.
    // Pending intents exist for governance (duplicate symbol detection)
    // NOT for cash subtraction.
    const fidelityDeployableCash = 7122.31;
    const pendingIntents = [
      makeIntent({ symbol: "URA", strike: 40, quantity: 1 }),
    ];

    // The system uses fidelityDeployableCash directly — no subtraction
    const cashForRecommendations = fidelityDeployableCash;
    expect(cashForRecommendations).toBe(7122.31);

    // NOT: fidelityDeployableCash - (strike × 100)
    // That would double-count since Fidelity already subtracted the commitment
    expect(cashForRecommendations).not.toBe(7122.31 - 4000);
  });
});
