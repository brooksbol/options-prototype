/**
 * Observation Store — Lifecycle & Concurrency Tests
 *
 * Validates the subscriber-driven polling lifecycle, symbol-set management,
 * ETag invalidation, stale-response rejection, error preservation,
 * no overlapping requests, and stable state identity.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  subscribe,
  getObservations,
  setSymbols,
  _resetForTesting,
} from "../../src/evidence/observation-store";

// --- Mock fetch ---

let fetchMock: ReturnType<typeof vi.fn>;
let fetchCalls: Array<{ url: string; headers: Record<string, string>; signal?: AbortSignal }>;
let fetchResolvers: Array<(value: any) => void>;

function mockFetchResponse(status: number, body: any, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return headers?.[name.toLowerCase()] ?? null;
      },
    },
    json: async () => body,
  };
}

function setupFetch() {
  fetchCalls = [];
  fetchResolvers = [];
  fetchMock = vi.fn((...args: any[]) => {
    const url = args[0] as string;
    const opts = (args[1] ?? {}) as { headers?: Record<string, string>; signal?: AbortSignal };
    fetchCalls.push({ url, headers: opts.headers ?? {}, signal: opts.signal });
    return new Promise((resolve) => {
      fetchResolvers.push(resolve);
    });
  });
  vi.stubGlobal("fetch", fetchMock);
}

function resolveLatestFetch(status: number, body: any, headers?: Record<string, string>) {
  const resolver = fetchResolvers.shift();
  if (resolver) resolver(mockFetchResponse(status, body, headers));
}

function rejectLatestFetch(error: Error) {
  const resolver = fetchResolvers.shift();
  if (resolver) resolver(Promise.reject(error));
}

// --- Setup/Teardown ---

beforeEach(() => {
  _resetForTesting();
  setupFetch();
  vi.useFakeTimers();
});

afterEach(() => {
  _resetForTesting();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// --- Helpers ---

const QUOTES_RESPONSE = {
  generation: 5000,
  generatedAt: "2026-08-04T16:00:00Z",
  quotes: [
    {
      symbol: "XLE",
      observation: { price: 58.99, observedAt: "2026-08-04T16:00:00Z" },
      acquisition: { status: "ready", lastAttemptAt: "2026-08-04T16:00:00Z", failureCount: 0 },
    },
    {
      symbol: "QQQ",
      observation: { price: 698.41, observedAt: "2026-08-03T16:38:55Z" },
      acquisition: { status: "failed", lastAttemptAt: "2026-08-03T17:06:40Z", failureCount: 3 },
    },
  ],
};

// --- Tests ---

describe("observation-store lifecycle", () => {
  it("does not poll before any subscriber joins", async () => {
    setSymbols(["XLE", "QQQ"]);
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchCalls.length).toBe(0);
  });

  it("starts polling when first subscriber joins with non-empty symbols", async () => {
    setSymbols(["XLE", "QQQ"]);
    subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].url).toContain("/api/evidence/quotes");
    expect(fetchCalls[0].url).toContain("symbol=XLE");
    expect(fetchCalls[0].url).toContain("symbol=QQQ");
  });

  it("does not poll when subscriber joins with empty symbols", async () => {
    setSymbols([]);
    subscribe(() => {});
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchCalls.length).toBe(0);
  });

  it("stops polling when last subscriber departs", async () => {
    setSymbols(["XLE"]);
    const unsub1 = subscribe(() => {});
    const unsub2 = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    unsub1();
    // Still has one subscriber — interval should continue
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchCalls.length).toBe(2); // initial + one interval

    unsub2();
    // No subscribers — no more polls
    const countBefore = fetchCalls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchCalls.length).toBe(countBefore);
  });
});

describe("symbol set management", () => {
  it("unchanged symbol set is a no-op (no extra poll)", async () => {
    setSymbols(["XLE", "QQQ"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1);

    // Set same symbols again (different order, but normalized to same)
    setSymbols(["QQQ", "XLE"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1); // No new poll

    unsub();
  });

  it("changed symbol set triggers immediate poll", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    // Change symbols
    setSymbols(["GDX", "IWM"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(2);
    expect(fetchCalls[1].url).toContain("symbol=GDX");
    expect(fetchCalls[1].url).toContain("symbol=IWM");

    unsub();
  });

  it("changed symbol set clears ETag (no If-None-Match on next poll)", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    // First poll used no ETag (initial)
    expect(fetchCalls[0].headers["If-None-Match"]).toBeUndefined();

    // Change symbols — should clear ETag
    setSymbols(["GDX"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls[1].headers["If-None-Match"]).toBeUndefined();

    unsub();
  });
});

describe("stale in-flight response rejection", () => {
  it("symbol set change starts new poll and AbortSignal is passed to fetch", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].url).toContain("symbol=XLE");
    // AbortSignal is passed to fetch
    expect(fetchCalls[0].signal).toBeDefined();

    // Change symbols — old request should be abandoned, new poll starts
    setSymbols(["GDX"]);
    await vi.advanceTimersByTimeAsync(0);

    // New poll started for GDX
    expect(fetchCalls.length).toBe(2);
    expect(fetchCalls[1].url).toContain("symbol=GDX");

    // Resolve the GDX poll (shift old XLE resolver first)
    fetchResolvers.shift(); // discard old XLE resolver
    resolveLatestFetch(200, {
      generation: 5001,
      generatedAt: "2026-08-04T16:01:00Z",
      quotes: [{ symbol: "GDX", observation: { price: 78.0, observedAt: "2026-08-04T16:01:00Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-04T16:01:00Z", failureCount: 0 } }],
    }, { etag: '"quotes-gdx-gen-5001"' });
    await vi.advanceTimersByTimeAsync(0);

    const state = getObservations();
    expect(state.observations.has("GDX")).toBe(true);
    expect(state.generation).toBe(5001);

    unsub();
  });

  it("completed old response is replaced when symbol set changes and new poll resolves", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);

    // Resolve XLE immediately
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-xle-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);
    expect(getObservations().observations.has("XLE")).toBe(true);

    // Change to GDX — new poll
    setSymbols(["GDX"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(2);

    // Resolve GDX
    resolveLatestFetch(200, {
      generation: 5001,
      generatedAt: "2026-08-04T16:01:00Z",
      quotes: [{ symbol: "GDX", observation: { price: 78.0, observedAt: "2026-08-04T16:01:00Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-04T16:01:00Z", failureCount: 0 } }],
    }, { etag: '"quotes-gdx-gen-5001"' });
    await vi.advanceTimersByTimeAsync(0);

    // GDX replaced XLE
    const state = getObservations();
    expect(state.observations.has("GDX")).toBe(true);
    expect(state.generation).toBe(5001);

    unsub();
  });
});

describe("304 and error preservation", () => {
  it("304 preserves existing observations unchanged", async () => {
    setSymbols(["XLE", "QQQ"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    const stateBefore = getObservations();
    expect(stateBefore.observations.size).toBe(2);

    // Advance to next poll interval
    await vi.advanceTimersByTimeAsync(30_000);
    // This poll sends If-None-Match
    expect(fetchCalls[1].headers["If-None-Match"]).toBe('"quotes-abc-gen-5000"');
    // Respond 304
    resolveLatestFetch(304, null);
    await vi.advanceTimersByTimeAsync(0);

    const stateAfter = getObservations();
    expect(stateAfter.observations.size).toBe(2);
    expect(stateAfter.lastPollResult).toBe("304");
    expect(stateAfter.generation).toBe(5000); // Unchanged

    unsub();
  });

  it("network error preserves last successful observations", async () => {
    setSymbols(["XLE", "QQQ"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    const stateBefore = getObservations();
    expect(stateBefore.observations.size).toBe(2);
    expect(stateBefore.generation).toBe(5000);

    // Advance to next poll — simulate network failure
    await vi.advanceTimersByTimeAsync(30_000);
    rejectLatestFetch(new TypeError("Failed to fetch"));
    await vi.advanceTimersByTimeAsync(0);

    const stateAfter = getObservations();
    expect(stateAfter.observations.size).toBe(2); // Preserved
    expect(stateAfter.generation).toBe(5000); // Preserved
    expect(stateAfter.lastPollResult).toBe("error");

    unsub();
  });

  it("HTTP 500 preserves last successful observations", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(30_000);
    resolveLatestFetch(500, { error: "Internal server error" });
    await vi.advanceTimersByTimeAsync(0);

    const state = getObservations();
    expect(state.observations.size).toBe(2); // Preserved from initial success
    expect(state.lastPollResult).toBe("error");

    unsub();
  });
});

describe("no overlapping requests", () => {
  it("does not start a second request while one is in-flight", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1);

    // Advance past poll interval without resolving first request
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchCalls.length).toBe(1); // Still only one — no overlap

    // Resolve first, then next interval should fire
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchCalls.length).toBe(2); // Now the second fires

    unsub();
  });
});

describe("stable state identity", () => {
  it("getObservations returns same reference when nothing changes", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});

    const ref1 = getObservations();
    const ref2 = getObservations();
    expect(ref1).toBe(ref2); // Same object identity

    unsub();
  });

  it("getObservations returns new reference after successful poll", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    const refBefore = getObservations();

    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    const refAfter = getObservations();
    expect(refAfter).not.toBe(refBefore); // New object

    unsub();
  });

  it("getObservations returns new reference after 304 (lastPollResult changes)", async () => {
    setSymbols(["XLE"]);
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, QUOTES_RESPONSE, { etag: '"quotes-abc-gen-5000"' });
    await vi.advanceTimersByTimeAsync(0);

    const refAfter200 = getObservations();

    await vi.advanceTimersByTimeAsync(30_000);
    resolveLatestFetch(304, null);
    await vi.advanceTimersByTimeAsync(0);

    const refAfter304 = getObservations();
    // Reference changes because lastPollResult and polling changed
    expect(refAfter304).not.toBe(refAfter200);
    // But observations Map content is preserved
    expect(refAfter304.observations).toBe(refAfter200.observations);

    unsub();
  });
});

describe("hard-refresh sequence (subscribe before symbols)", () => {
  it("polls immediately when setSymbols is called after subscribe", async () => {
    // This is the browser hard-refresh sequence:
    // 1. Component renders → subscribe fires (symbols still empty)
    // 2. useEffect fires → setSymbols populates symbols
    const unsub = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(0); // No symbols yet — no poll

    // Symbols arrive (simulates useEffect firing after render)
    setSymbols(["PSI", "XLE"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1); // Immediate poll
    expect(fetchCalls[0].url).toContain("symbol=PSI");
    expect(fetchCalls[0].url).toContain("symbol=XLE");

    unsub();
  });

  it("establishes polling interval when setSymbols is called after subscribe", async () => {
    // The interval must be established even when subscribe ran before symbols were set
    const unsub = subscribe(() => {});
    setSymbols(["PSI"]);
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, {
      generation: 100,
      generatedAt: "2026-08-17T16:00:00Z",
      quotes: [{ symbol: "PSI", observation: { price: 145.86, observedAt: "2026-08-17T16:00:00Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-17T16:00:00Z", failureCount: 0 } }],
    }, { etag: '"gen-100"' });
    await vi.advanceTimersByTimeAsync(0);

    // Verify interval fires at 30s
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchCalls.length).toBe(2); // Initial + interval poll

    unsub();
  });

  it("retries after initial poll failure when interval is established", async () => {
    const unsub = subscribe(() => {});
    setSymbols(["PSI"]);
    await vi.advanceTimersByTimeAsync(0);

    // First poll fails
    rejectLatestFetch(new TypeError("Failed to fetch"));
    await vi.advanceTimersByTimeAsync(0);

    expect(getObservations().lastPollResult).toBe("error");
    expect(getObservations().observations.size).toBe(0);

    // Interval should retry after 30s
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchCalls.length).toBe(2); // Retry fired

    // Retry succeeds
    resolveLatestFetch(200, {
      generation: 101,
      generatedAt: "2026-08-17T16:00:30Z",
      quotes: [{ symbol: "PSI", observation: { price: 145.86, observedAt: "2026-08-17T16:00:30Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-17T16:00:30Z", failureCount: 0 } }],
    }, { etag: '"gen-101"' });
    await vi.advanceTimersByTimeAsync(0);

    expect(getObservations().observations.size).toBe(1);
    expect(getObservations().observations.get("PSI")?.price).toBe(145.86);

    unsub();
  });

  it("does not double-poll when setSymbols triggers poll and maybeStartPolling would also poll", async () => {
    // Ensure the fix doesn't cause two simultaneous polls
    const unsub = subscribe(() => {});
    setSymbols(["PSI"]);
    await vi.advanceTimersByTimeAsync(0);

    // Only one fetch should have been made, not two
    expect(fetchCalls.length).toBe(1);

    unsub();
  });
});

describe("React StrictMode resilience (subscribe/unsubscribe/resubscribe)", () => {
  it("in-flight poll survives unsubscribe+resubscribe cycle", async () => {
    // Simulates React StrictMode: mount → unmount → remount
    // The first mount triggers a poll. The unmount unsubscribes (clearing interval).
    // The remount resubscribes. The in-flight poll must NOT be aborted.
    setSymbols(["PSI", "XLE"]);

    // First mount — subscribe triggers poll
    const unsub1 = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchCalls.length).toBe(1); // Poll started

    // StrictMode unmount — unsubscribe
    unsub1();
    // Poll should still be in-flight (not aborted)

    // StrictMode remount — resubscribe
    const unsub2 = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);

    // The in-flight poll should still resolve successfully
    resolveLatestFetch(200, {
      generation: 200,
      generatedAt: "2026-08-18T19:09:06Z",
      quotes: [
        { symbol: "PSI", observation: { price: 145.37, observedAt: "2026-08-18T19:09:06Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-18T19:09:06Z", failureCount: 0 } },
        { symbol: "XLE", observation: { price: 58.99, observedAt: "2026-08-18T19:09:06Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-18T19:09:06Z", failureCount: 0 } },
      ],
    }, { etag: '"gen-200"' });
    await vi.advanceTimersByTimeAsync(0);

    // Observations should be ingested
    const state = getObservations();
    expect(state.observations.size).toBe(2);
    expect(state.observations.get("PSI")?.price).toBe(145.37);
    expect(state.lastPollResult).toBe("200");

    unsub2();
  });

  it("interval is re-established after StrictMode cycle", async () => {
    setSymbols(["PSI"]);

    const unsub1 = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    resolveLatestFetch(200, {
      generation: 200,
      generatedAt: "2026-08-18T19:09:06Z",
      quotes: [{ symbol: "PSI", observation: { price: 145.37, observedAt: "2026-08-18T19:09:06Z" }, acquisition: { status: "ready", lastAttemptAt: "2026-08-18T19:09:06Z", failureCount: 0 } }],
    }, { etag: '"gen-200"' });
    await vi.advanceTimersByTimeAsync(0);

    // StrictMode unmount clears interval
    unsub1();

    // StrictMode remount re-establishes interval
    const unsub2 = subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    // The remount's maybeStartPolling should establish the interval

    // Advance 30s — interval should fire
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchCalls.length).toBe(2); // Initial + interval

    unsub2();
  });
});
