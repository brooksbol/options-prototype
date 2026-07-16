/**
 * Tests for the Tradier adapter — normalization and error handling.
 * Uses real cache and pacer singletons (fast, in-process).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TradierAdapter, ProviderError } from "../src/providers/tradier.js";

const mockConfig = {
  tradierApiKey: "test-key-123",
  tradierBaseUrl: "https://sandbox.tradier.com/v1",
  port: 3100,
};

describe("TradierAdapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getExpirations", () => {
    it("normalizes Tradier expiration response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          expirations: { date: ["2026-07-24", "2026-08-21", "2026-09-19"] },
        }),
      }));

      const adapter = new TradierAdapter(mockConfig);
      const result = await adapter.getExpirations("XLE");

      expect(result.expirations).toHaveLength(3);
      expect(result.expirations[0].date).toBe("2026-07-24");
      expect(result.cacheHit).toBe(false);
      expect(result.retrievedAt).toBeTruthy();
    });

    it("returns empty array for null expirations", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ expirations: null }),
      }));

      const adapter = new TradierAdapter(mockConfig);
      const result = await adapter.getExpirations("AAVM");
      expect(result.expirations).toEqual([]);
    });

    it("throws ProviderError when API key is missing", async () => {
      const noKeyConfig = { ...mockConfig, tradierApiKey: "" };
      const adapter = new TradierAdapter(noKeyConfig);
      await expect(adapter.getExpirations("NOKEY_TEST")).rejects.toThrow("not configured");
    });
  });

  describe("getOptionsChain", () => {
    it("normalizes chain with puts and calls", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
        if (url.includes("chains")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              options: {
                option: [
                  { strike: 55, bid: 0.80, ask: 0.95, option_type: "put", greeks: { delta: -0.30 }, open_interest: 500, volume: 120 },
                  { strike: 60, bid: 1.20, ask: 1.35, option_type: "call", greeks: { delta: 0.35 }, open_interest: 400, volume: 200 },
                ],
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            quotes: { quote: { symbol: "XLE", description: "Energy Select Sector SPDR Fund", last: 57.50 } },
          }),
        });
      }));

      const adapter = new TradierAdapter(mockConfig);
      const result = await adapter.getOptionsChain("XLE", "2026-08-21");

      expect(result.chain.symbol).toBe("XLE");
      expect(result.chain.underlying.name).toBe("Energy Select Sector SPDR Fund");
      expect(result.chain.underlying.price).toBe(57.50);
      expect(result.chain.puts).toHaveLength(1);
      expect(result.chain.calls).toHaveLength(1);
      expect(result.cacheHit).toBe(false);
    });
  });
});
