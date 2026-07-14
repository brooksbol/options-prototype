/**
 * Tests for durable crawl state.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { CrawlStateService } from "../../src/cache/crawl-state";

describe("CrawlStateService", () => {
  let crawl: CrawlStateService;
  const UNIVERSE_ID = "yahoo_top_etfs_2026_07_13";
  const UNIVERSE_VERSION = "2026-07-13";
  const SYMBOLS = ["AAVM", "ABFL", "ACWI", "AIA", "AIRR", "XLE", "XLF", "GLD"];

  beforeEach(() => {
    crawl = new CrawlStateService();
  });

  it("starts with no generation", async () => {
    const gen = await crawl.load();
    expect(gen).toBeNull();
  });

  it("ensureGeneration creates a new generation", async () => {
    const gen = await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    expect(gen.universeId).toBe(UNIVERSE_ID);
    expect(gen.universeVersion).toBe(UNIVERSE_VERSION);
    expect(gen.totalSymbols).toBe(8);
    expect(gen.cursor).toBe(0);
    expect(gen.completedAt).toBeNull();
  });

  it("all symbols start as NOT_EVALUATED", async () => {
    const gen = await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    for (const sym of SYMBOLS) {
      expect(gen.perSymbol[sym].resultClass).toBe("NOT_EVALUATED");
    }
  });

  it("markEvaluated updates symbol state", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    await crawl.markEvaluated("XLE", "ACTIONABLE", 85);
    const gen = crawl.current()!;
    expect(gen.perSymbol["XLE"].resultClass).toBe("ACTIONABLE");
    expect(gen.perSymbol["XLE"].evaluationScore).toBe(85);
    expect(gen.perSymbol["XLE"].lastAttemptedAt).not.toBeNull();
  });

  it("getNextBatch returns unseen symbols from cursor", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    const batch = crawl.getNextBatch(3);
    expect(batch).toEqual(["AAVM", "ABFL", "ACWI"]);
  });

  it("getNextBatch with priority symbols evaluates them first", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    const batch = crawl.getNextBatch(3, ["XLE", "GLD"]);
    expect(batch[0]).toBe("XLE");
    expect(batch[1]).toBe("GLD");
    expect(batch[2]).toBe("AAVM"); // fills from cursor
  });

  it("advanceCursor moves forward", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    crawl.advanceCursor(3);
    const gen = crawl.current()!;
    expect(gen.cursor).toBe(3);
  });

  it("cursor advancement skips already-evaluated symbols in getNextBatch", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    await crawl.markEvaluated("AAVM", "WAIT", 20);
    await crawl.markEvaluated("ABFL", "HARD_NO", 0);
    crawl.advanceCursor(2);
    const batch = crawl.getNextBatch(3);
    // Should skip evaluated AAVM and ABFL, start from cursor 2
    expect(batch).toEqual(["ACWI", "AIA", "AIRR"]);
  });

  it("getStats counts correctly", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    await crawl.markEvaluated("XLE", "ACTIONABLE", 85);
    await crawl.markEvaluated("AAVM", "WAIT", 20);
    await crawl.markEvaluated("ABFL", "HARD_NO", 0);
    const stats = crawl.getStats();
    expect(stats.evaluated).toBe(3);
    expect(stats.actionable).toBe(1);
    expect(stats.wait).toBe(1);
    expect(stats.hardNo).toBe(1);
    expect(stats.notEvaluated).toBe(5);
  });

  it("generation completes when all symbols evaluated", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    for (const sym of SYMBOLS) {
      await crawl.markEvaluated(sym, "WAIT", 20);
    }
    crawl.advanceCursor(SYMBOLS.length);
    expect(crawl.isComplete()).toBe(true);
    expect(crawl.current()!.completedAt).not.toBeNull();
  });

  it("ensureGeneration continues existing matching generation", async () => {
    const gen1 = await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    await crawl.markEvaluated("XLE", "ACTIONABLE", 85);
    crawl.advanceCursor(3);

    // Re-ensure same universe — should continue
    const gen2 = await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    expect(gen2.cursor).toBe(3);
    expect(gen2.perSymbol["XLE"].resultClass).toBe("ACTIONABLE");
  });

  it("ensureGeneration resets on universe version change", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    await crawl.markEvaluated("XLE", "ACTIONABLE", 85);
    crawl.advanceCursor(5);

    // New version → fresh generation
    const gen2 = await crawl.ensureGeneration(UNIVERSE_ID, "2026-08-01", SYMBOLS);
    expect(gen2.cursor).toBe(0);
    expect(gen2.perSymbol["XLE"].resultClass).toBe("NOT_EVALUATED");
  });

  it("save and reload preserves state", async () => {
    await crawl.ensureGeneration(UNIVERSE_ID, UNIVERSE_VERSION, SYMBOLS);
    await crawl.markEvaluated("XLE", "ACTIONABLE", 85);
    crawl.advanceCursor(4);
    await crawl.save();

    // Simulate reload — new service instance
    const crawl2 = new CrawlStateService();
    const gen = await crawl2.load();
    expect(gen).not.toBeNull();
    expect(gen!.cursor).toBe(4);
    expect(gen!.perSymbol["XLE"].resultClass).toBe("ACTIONABLE");
  });
});
