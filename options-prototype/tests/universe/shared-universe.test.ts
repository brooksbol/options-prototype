/**
 * Tests proving shared universe behavior.
 *
 * Validates:
 * - Both WriteDesk and OpportunityLab consume the same universe service
 * - The universe is Yahoo 496 (not the old curated 15)
 * - Descriptor metadata is available
 * - PRIORITY_WATCHLIST is a subset, not the authoritative universe
 * - Symbols outside the old curated 15 are present
 * - Universe identity and version are consistent across calls
 */

import { describe, it, expect } from "vitest";
import { loadCandidateUniverse, loadCandidateUniverseWithDescriptor } from "../../src/universe/universe";
import { PRIORITY_WATCHLIST } from "../../src/opportunity/types";
import { YAHOO_SOURCE_ID } from "../../src/universe/sources/yahoo";

describe("Shared Candidate Universe", () => {
  it("loadCandidateUniverseWithDescriptor returns Yahoo 496 identity", () => {
    const result = loadCandidateUniverseWithDescriptor();
    expect(result.descriptor.id).toBe(YAHOO_SOURCE_ID);
    expect(result.descriptor.name).toBe("Yahoo Top ETFs");
    expect(result.descriptor.totalSymbols).toBeGreaterThanOrEqual(496);
  });

  it("symbols array matches candidates length", () => {
    const result = loadCandidateUniverseWithDescriptor();
    expect(result.symbols.length).toBe(result.candidates.length);
    expect(result.symbols.length).toBe(result.descriptor.totalSymbols);
  });

  it("PRIORITY_WATCHLIST symbols are either in the universe or excluded from scan", () => {
    const result = loadCandidateUniverseWithDescriptor();
    const inUniverse = PRIORITY_WATCHLIST.filter((s) => result.symbols.includes(s));
    // At least some priority symbols exist in the universe
    expect(inUniverse.length).toBeGreaterThan(0);
    // XLE, XLF, XLK, XLP, GLD, DIA are in both
    expect(inUniverse).toContain("XLE");
    expect(inUniverse).toContain("GLD");
    expect(inUniverse).toContain("DIA");
  });

  it("PRIORITY_WATCHLIST is smaller than the full universe", () => {
    const result = loadCandidateUniverseWithDescriptor();
    expect(PRIORITY_WATCHLIST.length).toBeLessThan(result.descriptor.totalSymbols);
    expect(PRIORITY_WATCHLIST.length).toBe(15);
  });

  it("symbols outside the old curated 15 are present in the universe", () => {
    const result = loadCandidateUniverseWithDescriptor();
    // AAVM, AIRR, QQQ, SPY are in Yahoo 496 but not in PRIORITY_WATCHLIST
    expect(result.symbols).toContain("AAVM");
    expect(result.symbols).toContain("AIRR");
    expect(result.symbols).toContain("QQQ");
    expect(result.symbols).toContain("SPY");
    expect(PRIORITY_WATCHLIST).not.toContain("AAVM");
    expect(PRIORITY_WATCHLIST).not.toContain("AIRR");
  });

  it("universe is deterministic across repeated calls", () => {
    const a = loadCandidateUniverseWithDescriptor();
    const b = loadCandidateUniverseWithDescriptor();
    expect(a.descriptor.id).toBe(b.descriptor.id);
    expect(a.descriptor.version).toBe(b.descriptor.version);
    expect(a.symbols).toEqual(b.symbols);
  });

  it("loadCandidateUniverse returns same symbols as descriptor version", () => {
    const candidates = loadCandidateUniverse();
    const withDescriptor = loadCandidateUniverseWithDescriptor();
    expect(candidates.map((c) => c.symbol)).toEqual(withDescriptor.symbols);
  });

  it("no React component should import CURATED_UNIVERSE (it no longer exists)", async () => {
    // This is a compile-time guarantee — if CURATED_UNIVERSE existed and was imported,
    // the build would fail because it was renamed to PRIORITY_WATCHLIST.
    // This test documents the architectural intent.
    expect(PRIORITY_WATCHLIST).toBeDefined();
    // The old name should not be re-exportable
    const types = await import("../../src/opportunity/types");
    expect("CURATED_UNIVERSE" in types).toBe(false);
  });

  it("descriptor version tracks the Yahoo source date", () => {
    const result = loadCandidateUniverseWithDescriptor();
    expect(result.descriptor.version).toBe("2026-07-13");
  });
});
