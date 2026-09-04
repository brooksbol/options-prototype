/**
 * Tests proving shared universe behavior.
 *
 * Validates:
 * - The universe is Yahoo 496 (not the old curated 15)
 * - Descriptor metadata is available
 * - Symbols outside the old curated 15 are present
 * - Universe identity and version are consistent across calls
 */

import { describe, it, expect } from "vitest";
import { loadCandidateUniverse, loadCandidateUniverseWithDescriptor } from "../../src/universe/universe";
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

  it("symbols outside the old curated 15 are present in the universe", () => {
    const result = loadCandidateUniverseWithDescriptor();
    // AAVM, AIRR, QQQ, SPY are in Yahoo 496 (a broader universe than the old curated 15)
    expect(result.symbols).toContain("AAVM");
    expect(result.symbols).toContain("AIRR");
    expect(result.symbols).toContain("QQQ");
    expect(result.symbols).toContain("SPY");
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

  it("descriptor version tracks the Yahoo source date", () => {
    const result = loadCandidateUniverseWithDescriptor();
    expect(result.descriptor.version).toBe("2026-07-13");
  });
});
