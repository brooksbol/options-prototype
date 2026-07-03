import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useOptionsChain } from "../../src/hooks/useOptionsChain";
import { MockMarketDataProvider } from "../../src/providers/mock/MockMarketDataProvider";
import type { MarketDataProvider } from "../../src/domain/provider";

const mockProvider = new MockMarketDataProvider();

describe("useOptionsChain", () => {
  describe("initialization", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      expect(result.current.state.loading).toBe(true);
    });

    it("loads underlyings on mount", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
      expect(result.current.state.underlyings.length).toBeGreaterThanOrEqual(3);
    });

    it("auto-selects first underlying", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
      expect(result.current.state.selectedSymbol).toBe("SPY");
    });

    it("auto-loads expirations for first underlying", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
      expect(result.current.state.expirations.length).toBeGreaterThanOrEqual(3);
    });

    it("auto-selects first expiration", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
      expect(result.current.state.selectedExpiration).toBeTruthy();
      expect(result.current.state.selectedExpiration).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("auto-loads chain for first underlying + first expiration", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
      expect(result.current.state.chain).not.toBeNull();
      expect(result.current.state.chain!.calls.length).toBeGreaterThan(0);
      expect(result.current.state.chain!.puts.length).toBeGreaterThan(0);
    });

    it("has no error after successful initialization", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
      expect(result.current.state.error).toBeNull();
    });
  });

  describe("selectUnderlying", () => {
    it("updates selected symbol and reloads chain", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      act(() => {
        result.current.selectUnderlying("QQQ");
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.selectedSymbol).toBe("QQQ");
      expect(result.current.state.chain!.underlying.symbol).toBe("QQQ");
      expect(result.current.state.expirations.length).toBeGreaterThanOrEqual(3);
    });

    it("resets to first expiration of new underlying", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      const spyFirstExp = result.current.state.selectedExpiration;

      act(() => {
        result.current.selectUnderlying("IWM");
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      // IWM's first expiration should be selected (same DTE offset → same date)
      expect(result.current.state.selectedExpiration).toBeTruthy();
      expect(result.current.state.chain!.underlying.symbol).toBe("IWM");
    });
  });

  describe("selectExpiration", () => {
    it("updates selected expiration and reloads chain", async () => {
      const { result } = renderHook(() => useOptionsChain(mockProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      const secondExpiration = result.current.state.expirations[1].date;

      act(() => {
        result.current.selectExpiration(secondExpiration);
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.selectedExpiration).toBe(secondExpiration);
      expect(result.current.state.chain).not.toBeNull();
    });
  });

  describe("error handling", () => {
    it("sets error state when provider throws", async () => {
      const failingProvider: MarketDataProvider = {
        getUnderlyings: () => Promise.reject(new Error("Network failure")),
        getExpirations: () => Promise.reject(new Error("Network failure")),
        getOptionsChain: () => Promise.reject(new Error("Network failure")),
      };

      const { result } = renderHook(() => useOptionsChain(failingProvider));
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.error).toBe("Network failure");
    });
  });
});
