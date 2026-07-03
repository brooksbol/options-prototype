import { describe, it, expect } from "vitest";
import { MockMarketDataProvider } from "../../src/providers/mock/MockMarketDataProvider";

const provider = new MockMarketDataProvider();

describe("MockMarketDataProvider", () => {
  describe("getUnderlyings", () => {
    it("returns a promise", () => {
      const result = provider.getUnderlyings();
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns at least 3 underlyings", async () => {
      const underlyings = await provider.getUnderlyings();
      expect(underlyings.length).toBeGreaterThanOrEqual(3);
    });

    it("each underlying has symbol, name, and price", async () => {
      const underlyings = await provider.getUnderlyings();
      for (const u of underlyings) {
        expect(u.symbol).toBeTruthy();
        expect(u.name).toBeTruthy();
        expect(u.price).toBeGreaterThan(0);
      }
    });

    it("includes SPY, QQQ, and IWM", async () => {
      const underlyings = await provider.getUnderlyings();
      const symbols = underlyings.map((u) => u.symbol);
      expect(symbols).toContain("SPY");
      expect(symbols).toContain("QQQ");
      expect(symbols).toContain("IWM");
    });
  });

  describe("getExpirations", () => {
    it("returns a promise", () => {
      const result = provider.getExpirations("SPY");
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns at least 3 expirations per symbol", async () => {
      const expirations = await provider.getExpirations("SPY");
      expect(expirations.length).toBeGreaterThanOrEqual(3);
    });

    it("each expiration has date and dte", async () => {
      const expirations = await provider.getExpirations("SPY");
      for (const exp of expirations) {
        expect(exp.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(exp.dte).toBeGreaterThan(0);
      }
    });

    it("returns empty array for unknown symbol", async () => {
      const expirations = await provider.getExpirations("UNKNOWN");
      expect(expirations).toEqual([]);
    });

    it("is case-insensitive", async () => {
      const upper = await provider.getExpirations("SPY");
      const lower = await provider.getExpirations("spy");
      expect(upper).toEqual(lower);
    });
  });

  describe("getOptionsChain", () => {
    it("returns a promise", async () => {
      const expirations = await provider.getExpirations("SPY");
      const result = provider.getOptionsChain("SPY", expirations[0].date);
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns correct structure", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      expect(chain.underlying).toBeDefined();
      expect(chain.expiration).toBeDefined();
      expect(chain.calls).toBeInstanceOf(Array);
      expect(chain.puts).toBeInstanceOf(Array);
    });

    it("calls have type CALL", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      for (const call of chain.calls) {
        expect(call.type).toBe("CALL");
      }
    });

    it("puts have type PUT", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      for (const put of chain.puts) {
        expect(put.type).toBe("PUT");
      }
    });

    it("calls have valid deltas (0 to 1)", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      for (const call of chain.calls) {
        expect(call.delta).toBeGreaterThan(0);
        expect(call.delta).toBeLessThanOrEqual(1);
      }
    });

    it("puts have valid deltas (-1 to 0)", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      for (const put of chain.puts) {
        expect(put.delta).toBeLessThan(0);
        expect(put.delta).toBeGreaterThanOrEqual(-1);
      }
    });

    it("bid < ask for all contracts", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      for (const contract of [...chain.calls, ...chain.puts]) {
        expect(contract.bid).toBeLessThan(contract.ask);
      }
    });

    it("has at least 8 calls and 8 puts", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      expect(chain.calls.length).toBeGreaterThanOrEqual(8);
      expect(chain.puts.length).toBeGreaterThanOrEqual(8);
    });

    it("underlying has correct symbol and positive price", async () => {
      const expirations = await provider.getExpirations("SPY");
      const chain = await provider.getOptionsChain("SPY", expirations[0].date);
      expect(chain.underlying.symbol).toBe("SPY");
      expect(chain.underlying.price).toBeGreaterThan(0);
    });

    it("works for all three underlyings", async () => {
      for (const symbol of ["SPY", "QQQ", "IWM"]) {
        const expirations = await provider.getExpirations(symbol);
        expect(expirations.length).toBeGreaterThanOrEqual(3);
        const chain = await provider.getOptionsChain(symbol, expirations[0].date);
        expect(chain.calls.length).toBeGreaterThanOrEqual(8);
        expect(chain.puts.length).toBeGreaterThanOrEqual(8);
      }
    });
  });
});
