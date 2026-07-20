/**
 * Snapshot Contract Tests
 *
 * Proves the published snapshot shape satisfies the v1 contract.
 * These tests lock the consumer-facing structure without overconstraining
 * incidental ordering or internal implementation details.
 *
 * Breaking any of these tests indicates a contract-breaking change
 * that requires explicit versioning per INV-PUB-05.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import type { EvidenceSnapshot } from "../src/evidence-store.js";
import type { MarketExpiration, MarketChain } from "../src/providers/tradier.js";

// --- Fixtures ---

const EXPIRATIONS: MarketExpiration[] = [
  { date: "2026-08-03", dte: 21 },
];

const CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 92.50 },
  puts: [{ strike: 88, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 95, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

const NOW = "2026-07-16T14:30:00Z";

// --- Contract Tests ---

describe("snapshot contract v1", () => {
  let store: SqliteEvidenceStore;

  beforeEach(() => {
    store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE", "NOOPT"]);
    store.setExpirations("XLE", EXPIRATIONS, NOW);
    store.setChain("XLE", CHAIN, NOW);
    store.setExpirations("NOOPT", [], NOW);
    store.publishSnapshot();
  });

  afterEach(() => {
    store.close();
  });

  it("includes apiVersion field with value '1'", () => {
    const snap = store.buildSnapshot();
    expect(snap.apiVersion).toBe("1");
  });

  it("has required top-level fields", () => {
    const snap = store.buildSnapshot();
    expect(snap).toHaveProperty("apiVersion");
    expect(snap).toHaveProperty("generation");
    expect(snap).toHaveProperty("generatedAt");
    expect(snap).toHaveProperty("universe");
    expect(snap).toHaveProperty("coverage");
    expect(snap).toHaveProperty("symbols");
    expect(snap).toHaveProperty("telemetry");
  });

  it("generation is a positive integer after publication", () => {
    const snap = store.buildSnapshot();
    expect(snap.generation).toBeGreaterThan(0);
    expect(Number.isInteger(snap.generation)).toBe(true);
  });

  it("generatedAt is an ISO-8601 string", () => {
    const snap = store.buildSnapshot();
    expect(snap.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("universe is a non-negative integer", () => {
    const snap = store.buildSnapshot();
    expect(snap.universe).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(snap.universe)).toBe(true);
  });

  it("coverage has required fields with integer values", () => {
    const snap = store.buildSnapshot();
    const { coverage } = snap;
    expect(coverage).toHaveProperty("ready");
    expect(coverage).toHaveProperty("absent");
    expect(coverage).toHaveProperty("expirationsKnown");
    expect(coverage).toHaveProperty("pending");
    expect(coverage).toHaveProperty("failed");
    for (const val of Object.values(coverage)) {
      expect(typeof val).toBe("number");
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it("symbols is an array of SymbolEvidence objects", () => {
    const snap = store.buildSnapshot();
    expect(Array.isArray(snap.symbols)).toBe(true);
    expect(snap.symbols.length).toBe(2);
  });

  it("each symbol evidence has required fields", () => {
    const snap = store.buildSnapshot();
    for (const sym of snap.symbols) {
      expect(sym).toHaveProperty("symbol");
      expect(sym).toHaveProperty("status");
      expect(typeof sym.symbol).toBe("string");
      expect(["pending", "expirations_known", "ready", "absent", "failed"]).toContain(sym.status);
    }
  });

  it("ready symbol has chain with application-owned structure", () => {
    const snap = store.buildSnapshot();
    const xle = snap.symbols.find(s => s.symbol === "XLE");
    expect(xle).toBeDefined();
    expect(xle!.status).toBe("ready");
    expect(xle!.chain).not.toBeNull();
    expect(xle!.chain!.underlying).toHaveProperty("symbol");
    expect(xle!.chain!.underlying).toHaveProperty("name");
    expect(xle!.chain!.underlying).toHaveProperty("price");
    expect(xle!.chain!.puts[0]).toHaveProperty("strike");
    expect(xle!.chain!.puts[0]).toHaveProperty("bid");
    expect(xle!.chain!.puts[0]).toHaveProperty("ask");
    expect(xle!.chain!.puts[0]).toHaveProperty("delta");
    expect(xle!.chain!.puts[0]).toHaveProperty("openInterest");
    expect(xle!.chain!.puts[0]).toHaveProperty("volume");
  });

  it("absent symbol has null chain and empty expirations", () => {
    const snap = store.buildSnapshot();
    const noopt = snap.symbols.find(s => s.symbol === "NOOPT");
    expect(noopt).toBeDefined();
    expect(noopt!.status).toBe("absent");
    expect(noopt!.chain).toBeNull();
  });

  it("telemetry has required fields", () => {
    const snap = store.buildSnapshot();
    expect(snap.telemetry).toHaveProperty("symbolsChangedThisGeneration");
    expect(snap.telemetry).toHaveProperty("upstreamCalls");
    expect(snap.telemetry).toHaveProperty("cacheHits");
  });

  it("ETag format includes generation", () => {
    const etag = store.getETag();
    expect(etag).toMatch(/^"gen-\d+"$/);
  });
});
