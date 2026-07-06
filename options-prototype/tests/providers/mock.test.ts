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

    it("includes SPY, QQQ, IWM, and XLE", async () => {
      const underlyings = await provider.getUnderlyings();
      const symbols = underlyings.map((u) => u.symbol);
      expect(symbols).toContain("SPY");
      expect(symbols).toContain("QQQ");
      expect(symbols).toContain("IWM");
      expect(symbols).toContain("XLE");
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

    it("works for all underlyings", async () => {
      for (const symbol of ["SPY", "QQQ", "IWM", "XLE"]) {
        const expirations = await provider.getExpirations(symbol);
        expect(expirations.length).toBeGreaterThanOrEqual(3);
        const chain = await provider.getOptionsChain(symbol, expirations[0].date);
        expect(chain.calls.length).toBeGreaterThanOrEqual(8);
        expect(chain.puts.length).toBeGreaterThanOrEqual(8);
      }
    });
  });
});

describe("XLE reference fixture", () => {
  it("has 5 expirations", async () => {
    const expirations = await provider.getExpirations("XLE");
    expect(expirations.length).toBe(5);
  });

  it("underlying price is 53.22", async () => {
    const expirations = await provider.getExpirations("XLE");
    const chain = await provider.getOptionsChain("XLE", expirations[0].date);
    expect(chain.underlying.price).toBe(53.22);
  });

  it("first expiration has 10 calls and 10 puts", async () => {
    const expirations = await provider.getExpirations("XLE");
    const chain = await provider.getOptionsChain("XLE", expirations[0].date);
    expect(chain.calls.length).toBe(10);
    expect(chain.puts.length).toBe(10);
  });

  it("Jul 24 expiration has 8 calls (two zero-market rows excluded from source)", async () => {
    const expirations = await provider.getExpirations("XLE");
    // Jul 24 is the 3rd expiration (index 2)
    const chain = await provider.getOptionsChain("XLE", expirations[2].date);
    expect(chain.calls.length).toBe(8);
    expect(chain.puts.length).toBe(8);
  });

  it("preserves realistic delta values from Fidelity capture", async () => {
    const expirations = await provider.getExpirations("XLE");
    const chain = await provider.getOptionsChain("XLE", expirations[0].date);
    // First call (strike 51, deep ITM) should have high delta
    const deepItm = chain.calls.find((c) => c.strike === 51.0);
    expect(deepItm).toBeDefined();
    expect(deepItm!.delta).toBeCloseTo(0.932, 3);
    // ATM call (strike 53) should have ~0.57 delta
    const atm = chain.calls.find((c) => c.strike === 53.0);
    expect(atm).toBeDefined();
    expect(atm!.delta).toBeCloseTo(0.5681, 3);
  });

  it("has wider bid/ask spreads than synthetic fixtures (realistic for lower-liquidity ETF)", async () => {
    const expirations = await provider.getExpirations("XLE");
    const chain = await provider.getOptionsChain("XLE", expirations[0].date);
    // XLE is less liquid than SPY — expect some spreads > $0.20
    const wideSpread = chain.calls.some((c) => (c.ask - c.bid) > 0.20);
    expect(wideSpread).toBe(true);
  });
});
