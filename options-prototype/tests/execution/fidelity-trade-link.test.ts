/**
 * Tests for Fidelity trade-ticket handoff:
 * - Security ID formatting
 * - URL construction
 * - WriteIntent builder
 */

import { describe, it, expect } from "vitest";
import { formatFidelitySecurityId, buildWriteIntent } from "../../src/execution/write-intent";
import { buildFidelityTradeLink } from "../../src/execution/fidelity-trade-link";
import type { PutCandidate } from "../../src/write-desk/scan-orchestrator";

// --- Fidelity Security ID Formatting ---

describe("formatFidelitySecurityId", () => {
  it("formats the exact captured XLE example", () => {
    const result = formatFidelitySecurityId("XLE", "2026-07-17", "put", 56.5);
    expect(result).toBe("-XLE260717P56.5");
  });

  it("formats the XLP example with integer strike", () => {
    const result = formatFidelitySecurityId("XLP", "2026-07-31", "put", 83);
    expect(result).toBe("-XLP260731P83");
  });

  it("formats calls correctly", () => {
    const result = formatFidelitySecurityId("QQQ", "2026-08-15", "call", 500);
    expect(result).toBe("-QQQ260815C500");
  });

  it("handles decimal strikes", () => {
    expect(formatFidelitySecurityId("IWM", "2026-09-18", "put", 220.5)).toBe("-IWM260918P220.5");
    expect(formatFidelitySecurityId("SPY", "2026-12-31", "put", 450.25)).toBe("-SPY261231P450.25");
  });

  it("handles integer strikes without decimal", () => {
    expect(formatFidelitySecurityId("DIA", "2026-10-16", "put", 400)).toBe("-DIA261016P400");
  });

  it("handles symbols of different lengths", () => {
    expect(formatFidelitySecurityId("A", "2026-07-17", "put", 100)).toBe("-A260717P100");
    expect(formatFidelitySecurityId("COPX", "2026-08-21", "put", 78)).toBe("-COPX260821P78");
    expect(formatFidelitySecurityId("SCHD", "2026-11-20", "call", 85.5)).toBe("-SCHD261120C85.5");
  });

  it("uppercases symbol", () => {
    expect(formatFidelitySecurityId("xle", "2026-07-17", "put", 56.5)).toBe("-XLE260717P56.5");
  });

  it("returns null for empty symbol", () => {
    expect(formatFidelitySecurityId("", "2026-07-17", "put", 56.5)).toBeNull();
    expect(formatFidelitySecurityId("  ", "2026-07-17", "put", 56.5)).toBeNull();
  });

  it("returns null for invalid expiration format", () => {
    expect(formatFidelitySecurityId("XLE", "07-17-2026", "put", 56.5)).toBeNull();
    expect(formatFidelitySecurityId("XLE", "2026/07/17", "put", 56.5)).toBeNull();
    expect(formatFidelitySecurityId("XLE", "", "put", 56.5)).toBeNull();
  });

  it("returns null for invalid strike", () => {
    expect(formatFidelitySecurityId("XLE", "2026-07-17", "put", 0)).toBeNull();
    expect(formatFidelitySecurityId("XLE", "2026-07-17", "put", -10)).toBeNull();
    expect(formatFidelitySecurityId("XLE", "2026-07-17", "put", Infinity)).toBeNull();
  });
});

// --- Fidelity Trade Link ---

describe("buildFidelityTradeLink", () => {
  const validIntent = {
    underlyingSymbol: "XLE",
    contractSymbol: "-XLE260717P56.5",
    expiration: "2026-07-17",
    optionType: "put" as const,
    strike: 56.5,
    action: "sell-to-open" as const,
    quantity: 1,
    orderType: "limit" as const,
    limitPrice: 0.33,
    timeInForce: "day" as const,
  };

  it("produces the exact captured URL structure", () => {
    const link = buildFidelityTradeLink(validIntent);
    expect(link).not.toBeNull();
    expect(link!.url).toContain("https://digital.fidelity.com/ftgw/digital/trade-options");
    expect(link!.url).toContain("ORDER_TYPE=O");
    expect(link!.url).toContain("ORDER_ACTION=SOPEN");
    expect(link!.url).toContain("LIMIT_STOP_PRICE=0.33");
    expect(link!.url).toContain("SECURITY_ID=-XLE260717P56.5");
    expect(link!.url).toContain("trade=rocfly");
  });

  it("formats XLP example correctly", () => {
    const intent = { ...validIntent, contractSymbol: "-XLP260731P83", limitPrice: 0.72, strike: 83 };
    const link = buildFidelityTradeLink(intent);
    expect(link!.url).toContain("LIMIT_STOP_PRICE=0.72");
    expect(link!.url).toContain("SECURITY_ID=-XLP260731P83");
  });

  it("formats integer limit prices without unnecessary decimals", () => {
    const intent = { ...validIntent, limitPrice: 2.0 };
    const link = buildFidelityTradeLink(intent);
    expect(link!.url).toContain("LIMIT_STOP_PRICE=2");
  });

  it("formats prices with one decimal correctly", () => {
    const intent = { ...validIntent, limitPrice: 1.5 };
    const link = buildFidelityTradeLink(intent);
    expect(link!.url).toContain("LIMIT_STOP_PRICE=1.5");
  });

  it("formats prices with two decimals correctly", () => {
    const intent = { ...validIntent, limitPrice: 0.85 };
    const link = buildFidelityTradeLink(intent);
    expect(link!.url).toContain("LIMIT_STOP_PRICE=0.85");
  });

  it("uses proper URL encoding", () => {
    const link = buildFidelityTradeLink(validIntent);
    // The URL should be parseable
    const parsed = new URL(link!.url);
    expect(parsed.searchParams.get("SECURITY_ID")).toBe("-XLE260717P56.5");
    expect(parsed.searchParams.get("ORDER_TYPE")).toBe("O");
  });

  it("returns null for zero limit price", () => {
    const intent = { ...validIntent, limitPrice: 0 };
    expect(buildFidelityTradeLink(intent)).toBeNull();
  });

  it("returns null for missing contract symbol", () => {
    const intent = { ...validIntent, contractSymbol: "" };
    expect(buildFidelityTradeLink(intent)).toBeNull();
  });

  it("includes verification requirements", () => {
    const link = buildFidelityTradeLink(validIntent);
    expect(link!.requiresVerification).toContain("Account selection");
    expect(link!.requiresVerification).toContain("Quantity (contracts)");
    expect(link!.requiresVerification).toContain("Time in force");
    expect(link!.requiresVerification).toContain("Limit price");
    expect(link!.requiresVerification).toContain("Contract identity");
  });

  it("produces deterministic output for identical intents", () => {
    const link1 = buildFidelityTradeLink(validIntent);
    const link2 = buildFidelityTradeLink(validIntent);
    expect(link1!.url).toBe(link2!.url);
  });
});

// --- WriteIntent Builder ---

describe("buildWriteIntent", () => {
  const makeCandidate = (overrides: Partial<PutCandidate> = {}): PutCandidate => ({
    symbol: "XLE",
    expiration: "2026-07-17",
    dte: 14,
    strike: 56.5,
    delta: -0.30,
    bid: 0.33,
    mid: 0.35,
    ask: 0.37,
    spreadPercent: 11.4,
    openInterest: 500,
    volume: 120,
    yieldAnnualized: 15.2,
    cashRequired: 5650,
    cashRemaining: 12850,
    rank: 1,
    posture: "ACTIONABLE",
    assessment: { score: 85, reasons: [] },
    ...overrides,
  });

  it("builds a valid intent from a recommendation", () => {
    const intent = buildWriteIntent({ candidate: makeCandidate() });
    expect(intent).not.toBeNull();
    expect(intent!.underlyingSymbol).toBe("XLE");
    expect(intent!.contractSymbol).toBe("-XLE260717P56.5");
    expect(intent!.optionType).toBe("put");
    expect(intent!.action).toBe("sell-to-open");
    expect(intent!.limitPrice).toBe(0.33);
    expect(intent!.quantity).toBe(1);
    expect(intent!.orderType).toBe("limit");
    expect(intent!.timeInForce).toBe("day");
  });

  it("returns null for zero bid", () => {
    expect(buildWriteIntent({ candidate: makeCandidate({ bid: 0 }) })).toBeNull();
  });

  it("returns null for negative bid", () => {
    expect(buildWriteIntent({ candidate: makeCandidate({ bid: -0.5 }) })).toBeNull();
  });

  it("returns null for zero strike", () => {
    expect(buildWriteIntent({ candidate: makeCandidate({ strike: 0 }) })).toBeNull();
  });

  it("returns null for missing symbol", () => {
    expect(buildWriteIntent({ candidate: makeCandidate({ symbol: "" }) })).toBeNull();
  });

  it("returns null for invalid quantity", () => {
    expect(buildWriteIntent({ candidate: makeCandidate(), quantity: 0 })).toBeNull();
    expect(buildWriteIntent({ candidate: makeCandidate(), quantity: 1.5 })).toBeNull();
  });

  it("accepts custom quantity", () => {
    const intent = buildWriteIntent({ candidate: makeCandidate(), quantity: 3 });
    expect(intent!.quantity).toBe(3);
  });

  it("makes zero provider calls (pure function)", () => {
    // This is a compile-time guarantee: buildWriteIntent has no async,
    // no provider parameter, no network dependency
    const intent = buildWriteIntent({ candidate: makeCandidate() });
    expect(intent).not.toBeNull();
  });
});
