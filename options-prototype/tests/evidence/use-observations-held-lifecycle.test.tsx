/**
 * use-observations held-expiration lifecycle (PR #19 review blocker).
 *
 * Proves the frontend half of the held-expiration lifecycle contract:
 *  - a portfolio with held option positions POSTs those held (symbol, expiration) pairs;
 *  - when the portfolio transitions to EMPTY, the hook still POSTs an explicit
 *    empty declaration ({ symbols: [], heldExpirations: [] }) so the backend can
 *    clear held demand — rather than skipping the call and leaving stale demand.
 *
 * The Portfolio store is mocked at the usePortfolio seam so the test targets ONLY
 * the observe/held POST behavior (not the store's capital/projection side effects).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mutable portfolio state the mocked hook returns.
let mockState: { source: string; snapshot: unknown; importStatus: unknown };
vi.mock("../../src/portfolio/use-portfolio", () => ({
  usePortfolio: () => mockState,
}));

import { useObservations } from "../../src/evidence/use-observations";

function snapshotWith(
  puts: { underlying: string; expiration: string }[],
  calls: { underlying: string; expiration: string }[] = [],
) {
  return { existingPuts: puts, existingCalls: calls, inventory: [] };
}

function observeBodies(fetchMock: ReturnType<typeof vi.fn>): any[] {
  return fetchMock.mock.calls
    .filter(([url]) => url === "/api/evidence/observe")
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));
}

describe("useObservations — held-expiration lifecycle", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response));
    vi.stubGlobal("fetch", fetchMock);
    mockState = { source: "fidelity", snapshot: null, importStatus: {} };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs held pairs when positions are held, then an explicit empty declaration when the portfolio empties", async () => {
    mockState = {
      source: "fidelity",
      snapshot: snapshotWith(
        [{ underlying: "GDXJ", expiration: "2026-09-11" }],
        [{ underlying: "SMH", expiration: "2026-09-15" }],
      ),
      importStatus: {},
    };

    const { rerender } = renderHook(() => useObservations());

    // First: held pairs are declared.
    await waitFor(() => {
      const bodies = observeBodies(fetchMock);
      expect(bodies.length).toBeGreaterThanOrEqual(1);
      const held = bodies[bodies.length - 1].heldExpirations;
      expect(held).toEqual(
        expect.arrayContaining([
          { symbol: "GDXJ", expiration: "2026-09-11" },
          { symbol: "SMH", expiration: "2026-09-15" },
        ]),
      );
    });

    // Portfolio empties.
    mockState = { source: "fidelity", snapshot: snapshotWith([], []), importStatus: {} };
    rerender();

    // An explicit empty clear declaration must be POSTed.
    await waitFor(() => {
      const bodies = observeBodies(fetchMock);
      const last = bodies[bodies.length - 1];
      expect(last.symbols).toEqual([]);
      expect(last.heldExpirations).toEqual([]);
    });
  });

  it("retries a declaration that FAILED (does not permanently suppress after a transient error)", async () => {
    // Unique declaration so its dedup key cannot collide with a prior successful send.
    const snap = snapshotWith([{ underlying: "RETRY", expiration: "2026-12-19" }]);

    // First attempt: fetch rejects (transient network failure).
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    mockState = { source: "fidelity", snapshot: snap, importStatus: {} };
    const first = renderHook(() => useObservations());

    // The failed attempt was made.
    await waitFor(() => {
      expect(observeBodies(fetchMock).some(b => b.symbols.includes("RETRY"))).toBe(true);
    });
    const afterFail = observeBodies(fetchMock).filter(b => b.symbols.includes("RETRY")).length;
    first.unmount();

    // Second attempt (same declaration): the effect re-runs on remount. Because the
    // failed attempt did NOT record the dedup key, the identical declaration is re-sent.
    renderHook(() => useObservations());

    await waitFor(() => {
      const retries = observeBodies(fetchMock).filter(b => b.symbols.includes("RETRY")).length;
      expect(retries).toBeGreaterThan(afterFail);
    });
  });
});
