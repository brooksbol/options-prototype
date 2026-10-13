import { describe, it, expect } from "vitest";
import {
  parseMarketMetrics,
  indexBySymbol,
  presentIvRank,
  ivRankSortValue,
  rawMetricCsvCell,
  rawMetricStringCsvCell,
  type MarketMetrics,
} from "../../src/write-desk/market-metrics";

describe("market-metrics (interim v1, observational)", () => {
  it("parses provider fields preserving nullability and distinct methodologies", () => {
    const m = parseMarketMetrics({
      symbol: "eem",
      ivRank: 0.316503391,
      ivRankSource: "tos",
      ivRankTos: 0.316503391,
      ivRankTw: 0.280560062,
      ivPercentile: 0.384341138,
      ivIndex: 0.235869601,
      historicalVolatility30: 21.83,
      ivHv30Difference: 1.81,
      ivUpdatedAt: "2026-10-12T16:23:35.773Z",
    });
    expect(m.symbol).toBe("EEM");
    expect(m.ivRank).toBe(0.316503391);
    expect(m.ivRankSource).toBe("tos");
    // Distinct methodologies are preserved, never collapsed.
    expect(m.ivRankTos).not.toBe(m.ivRankTw);
    expect(m.ivUpdatedAt).toBe("2026-10-12T16:23:35.773Z");
  });

  it("maps absence to null (never 0) and preserves provider exact 0", () => {
    const m = parseMarketMetrics({ symbol: "XLE", ivRank: 0, ivRankSource: "tw" });
    expect(m.ivRank).toBe(0); // provider exact zero preserved
    expect(m.ivRankTos).toBeNull(); // absent → null, not 0
    expect(m.ivPercentile).toBeNull();
    expect(m.ivUpdatedAt).toBeNull();
  });

  it("presents the 0..1 provider scale on the operator 0..100 scale; absence → em dash", () => {
    expect(presentIvRank(0.3165)).toBe((0.3165 * 100).toFixed(1)); // scaled ×100, one dp
    expect(presentIvRank(0)).toBe("0.0"); // real zero shows, not dash
    expect(presentIvRank(null)).toBe("—");
    expect(presentIvRank(undefined)).toBe("—");
  });

  it("sort value scales to 0..100 and keeps null for unknowns-last ordering", () => {
    expect(ivRankSortValue(0.5)).toBe(50);
    expect(ivRankSortValue(null)).toBeNull();
  });

  it("CSV cells emit raw provider scale verbatim; absence → empty", () => {
    // 0..1 scale preserved in CSV (NOT multiplied), exact 0 emitted, null → empty.
    expect(rawMetricCsvCell(0.3165)).toBe("0.3165");
    expect(rawMetricCsvCell(0)).toBe("0");
    expect(rawMetricCsvCell(null)).toBe("");
    expect(rawMetricStringCsvCell("tos")).toBe("tos");
    expect(rawMetricStringCsvCell(null)).toBe("");
  });

  it("indexes by uppercase symbol", () => {
    const metrics: MarketMetrics[] = [
      parseMarketMetrics({ symbol: "spy", ivRank: 0.4 }),
      parseMarketMetrics({ symbol: "qqq", ivRank: 0.5 }),
    ];
    const map = indexBySymbol(metrics);
    expect(map.get("SPY")?.ivRank).toBe(0.4);
    expect(map.get("QQQ")?.ivRank).toBe(0.5);
  });
});
