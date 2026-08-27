/**
 * Regression tests for useSpotHistory — Console remount / effect-churn resilience.
 *
 * Guards the bug where sparklines vanished on navigating back to the Console:
 * a rapid effect re-run (new `symbols` array reference every render + generation
 * bumping via polling) cancelled the in-flight fetch, and because the "already
 * fetched" refs were advanced BEFORE the fetch completed, the next run early-returned
 * without fetching — leaving history stuck at the empty map.
 *
 * Acceptance: once data is available, a churny sequence of renders must still end
 * with populated history.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSpotHistory } from "../../src/evidence/use-spot-history";

function historyPayload() {
  return {
    histories: {
      SLV: [
        { price: 61.6, observedAt: "2026-08-27T13:46:24Z" },
        { price: 61.7, observedAt: "2026-08-27T15:46:49Z" },
        { price: 61.8, observedAt: "2026-08-27T16:48:59Z" },
      ],
    },
  };
}

describe("useSpotHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("populates history for the requested symbols on mount", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => historyPayload(),
    }) as unknown as Response));

    const { result } = renderHook(
      ({ syms, gen }) => useSpotHistory(syms, true, gen),
      { initialProps: { syms: ["SLV"], gen: 100 } },
    );

    await waitFor(() => {
      expect(result.current.get("SLV")?.length).toBe(3);
    });
  });

  it("does not get stuck empty when the effect re-runs rapidly (remount/churn regression)", async () => {
    // fetch resolves on a microtask so a rapid re-render can cancel the first run.
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => historyPayload(),
    }) as unknown as Response));

    // Every rerender passes a NEW array reference (as OperatorConsole did before the
    // content-stable fix) and an advancing generation (as polling does).
    const { result, rerender } = renderHook(
      ({ n }) => useSpotHistory(["SLV"], true, 100 + n),
      { initialProps: { n: 0 } },
    );

    // Churn: several quick re-renders, each a new symbols array + new generation.
    rerender({ n: 1 });
    rerender({ n: 2 });
    rerender({ n: 3 });

    // After the churn settles, history MUST be populated — not stuck at empty.
    await waitFor(() => {
      expect(result.current.get("SLV")?.length).toBe(3);
    });
  });

  it("returns empty and does not fetch when disabled (Demo mode)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpotHistory(["SLV"], false, 100));

    expect(result.current.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves last known history on a failed fetch rather than clearing", async () => {
    // First fetch succeeds, second (after generation bump) fails.
    let call = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return { ok: true, json: async () => historyPayload() } as unknown as Response;
      }
      return { ok: false, json: async () => ({}) } as unknown as Response;
    }));

    const { result, rerender } = renderHook(
      ({ gen }) => useSpotHistory(["SLV"], true, gen),
      { initialProps: { gen: 100 } },
    );

    await waitFor(() => {
      expect(result.current.get("SLV")?.length).toBe(3);
    });

    // Generation advances; fetch now fails — prior history must remain visible.
    rerender({ gen: 101 });
    await waitFor(() => {
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    expect(result.current.get("SLV")?.length).toBe(3);
  });
});
