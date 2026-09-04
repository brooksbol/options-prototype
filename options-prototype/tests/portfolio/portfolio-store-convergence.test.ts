/**
 * Portfolio Store Convergence Tests
 *
 * Validates that Portfolio Store is the single runtime authority for
 * application-scoped portfolio state, consumed by both Console and Deployment.
 *
 * These tests prove the architectural behavior that eliminates the prior
 * dual-authority problem (Deployment-local state vs Portfolio Store).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  setPortfolio,
  selectPortfolioSource,
  getSnapshot,
  getSource,
  subscribe,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { usePortfolio } from "../../src/portfolio/use-portfolio";
import type { PortfolioSnapshot } from "../../src/write-desk/types";

// --- Helpers ---

/** Create a minimal valid PortfolioSnapshot for testing store convergence. */
function createTestSnapshot(label: string): PortfolioSnapshot {
  return {
    deployableCash: 50000,
    inventory: [
      { symbol: "XLE", sharesHeld: 200, sharesFree: 200, maxAdditionalContracts: 2, economics: null },
    ],
    existingPuts: [],
    existingCalls: [],
    provenance: { sourceLabel: `Test ${label}`, exportTimestamp: "2026-08-11T10:00:00" },
    snapshotDate: "2026-08-11",
    readiness: { status: "READY", warnings: [], blockReasons: [] },
  } as unknown as PortfolioSnapshot;
}

// --- localStorage mock ---

const localStorageData: Record<string, string> = {};

beforeEach(() => {
  _resetForTesting();
  // Clear localStorage mock
  Object.keys(localStorageData).forEach(k => delete localStorageData[k]);
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => localStorageData[key] ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => { localStorageData[key] = value; });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key: string) => { delete localStorageData[key]; });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --- Tests ---

describe("Portfolio Store — single runtime authority", () => {

  describe("setPortfolio mutations are visible to all consumers", () => {
    it("multiple usePortfolio consumers see the same snapshot after setPortfolio", () => {
      // Simulate Console and Deployment both consuming the store
      const { result: consumer1 } = renderHook(() => usePortfolio());
      const { result: consumer2 } = renderHook(() => usePortfolio());

      const fidelitySnapshot = createTestSnapshot("Fidelity");

      act(() => {
        setPortfolio("fidelity", fidelitySnapshot);
      });

      // Both consumers reflect the same updated state
      expect(consumer1.current.source).toBe("fidelity");
      expect(consumer1.current.snapshot).toBe(fidelitySnapshot);
      expect(consumer2.current.source).toBe("fidelity");
      expect(consumer2.current.snapshot).toBe(fidelitySnapshot);

      // They are reference-equal — one authority, not two copies
      expect(consumer1.current.snapshot).toBe(consumer2.current.snapshot);
    });

    it("upload in Deployment is immediately visible to Console consumer", () => {
      // Console is already mounted and observing
      const { result: consoleHook } = renderHook(() => usePortfolio());
      expect(consoleHook.current.snapshot).toBeNull(); // reset state

      // Deployment uploads a Fidelity snapshot (simulates FidelityUpload → Deployment → setPortfolio)
      const uploaded = createTestSnapshot("Fidelity");
      act(() => {
        setPortfolio("fidelity", uploaded);
      });

      // Console sees it immediately, without reload
      expect(consoleHook.current.source).toBe("fidelity");
      expect(consoleHook.current.snapshot).toBe(uploaded);
      expect(consoleHook.current.snapshot!.deployableCash).toBe(uploaded.deployableCash);
    });
  });

  describe("selectPortfolioSource", () => {
    it("selecting demo produces a demo snapshot for all consumers", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => {
        selectPortfolioSource("demo");
      });

      expect(result.current.source).toBe("demo");
      expect(result.current.snapshot).not.toBeNull();
      expect(result.current.snapshot!.provenance.sourceLabel).toContain("Demo");
    });

    it("selecting fidelity with no persisted CSV produces null snapshot", () => {
      // No localStorage data — reconstruction should gracefully produce null
      const { result } = renderHook(() => usePortfolio());

      act(() => {
        selectPortfolioSource("fidelity");
      });

      expect(result.current.source).toBe("fidelity");
      expect(result.current.snapshot).toBeNull();
    });

    it("selecting fidelity after setPortfolio does NOT preserve prior snapshot (requires localStorage)", () => {
      // This test validates that selectPortfolioSource("fidelity") reconstructs
      // from localStorage persistence, not from in-memory cache.
      const { result } = renderHook(() => usePortfolio());

      // Upload a snapshot via setPortfolio (simulates FidelityUpload → Deployment → store)
      const uploaded = createTestSnapshot("Fidelity");
      act(() => { setPortfolio("fidelity", uploaded); });
      expect(result.current.snapshot).toBe(uploaded);

      // Switch to demo
      act(() => { selectPortfolioSource("demo"); });
      expect(result.current.source).toBe("demo");

      // Switch back to fidelity — no localStorage, so reconstruction produces null
      // This proves there is no hidden in-memory cache
      act(() => { selectPortfolioSource("fidelity"); });
      expect(result.current.source).toBe("fidelity");
      expect(result.current.snapshot).toBeNull();
    });

    it("Demo → Fidelity → Demo → Fidelity: consumers always agree", () => {
      const { result: consumer1 } = renderHook(() => usePortfolio());
      const { result: consumer2 } = renderHook(() => usePortfolio());

      // Start with Fidelity via setPortfolio
      const snapshot = createTestSnapshot("Fidelity");
      act(() => { setPortfolio("fidelity", snapshot); });
      expect(consumer1.current.source).toBe("fidelity");

      // Switch to Demo
      act(() => { selectPortfolioSource("demo"); });
      expect(consumer1.current.source).toBe("demo");
      expect(consumer2.current.source).toBe("demo");
      expect(consumer1.current.snapshot).toBe(consumer2.current.snapshot);

      // Switch back to Fidelity
      act(() => { selectPortfolioSource("fidelity"); });
      expect(consumer1.current.source).toBe("fidelity");
      expect(consumer2.current.source).toBe("fidelity");
      // Both agree — whether null or reconstructed, they see the same thing
      expect(consumer1.current.snapshot).toBe(consumer2.current.snapshot);
    });
  });

  describe("subscriber notification", () => {
    it("external subscriber is notified on setPortfolio", () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);

      const snapshot = createTestSnapshot("Fidelity");
      setPortfolio("fidelity", snapshot);

      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
    });

    it("external subscriber is notified on selectPortfolioSource", () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);

      selectPortfolioSource("demo");

      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
    });

    it("snapshot reference changes on each setPortfolio call", () => {
      const snapshots: Array<PortfolioSnapshot | null> = [];
      const unsub = subscribe(() => { snapshots.push(getSnapshot()); });

      const s1 = createTestSnapshot("Fidelity");
      const s2 = createTestSnapshot("Fidelity");
      setPortfolio("fidelity", s1);
      setPortfolio("fidelity", s2);

      expect(snapshots).toHaveLength(2);
      expect(snapshots[0]).toBe(s1);
      expect(snapshots[1]).toBe(s2);
      // Different references — ensures useEffect dependencies detect changes
      expect(snapshots[0]).not.toBe(snapshots[1]);
      unsub();
    });
  });

  describe("recommendation invalidation trigger", () => {
    it("snapshot reference change from setPortfolio would trigger React effects dependent on snapshot", () => {
      // This test validates the mechanism that causes Deployment's recommendation
      // useEffect to re-run: the snapshot reference changes.
      const { result } = renderHook(() => usePortfolio());

      const firstSnapshot = createTestSnapshot("Fidelity");
      act(() => { setPortfolio("fidelity", firstSnapshot); });
      const ref1 = result.current.snapshot;

      const secondSnapshot = createTestSnapshot("Fidelity");
      act(() => { setPortfolio("fidelity", secondSnapshot); });
      const ref2 = result.current.snapshot;

      // Reference inequality ensures React's dependency array will detect the change
      expect(ref1).not.toBe(ref2);
      expect(ref1).toBe(firstSnapshot);
      expect(ref2).toBe(secondSnapshot);
    });
  });
});
