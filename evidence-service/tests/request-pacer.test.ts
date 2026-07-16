/**
 * Tests for RequestPacer — queued request execution with rate pacing.
 */

import { describe, it, expect } from "vitest";
import { RequestPacer } from "../src/request-pacer.js";

describe("RequestPacer", () => {
  it("executes a single request immediately", async () => {
    const pacer = new RequestPacer(100, 10); // fast for testing
    const result = await pacer.submit(async () => "hello");
    expect(result).toBe("hello");
  });

  it("executes multiple requests sequentially", async () => {
    const pacer = new RequestPacer(100, 10);
    const order: number[] = [];

    const p1 = pacer.submit(async () => { order.push(1); return 1; });
    const p2 = pacer.submit(async () => { order.push(2); return 2; });
    const p3 = pacer.submit(async () => { order.push(3); return 3; });

    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("rejects when queue is full", async () => {
    const pacer = new RequestPacer(0.1, 2); // very slow, max 2 in queue
    // Fill the queue
    pacer.submit(async () => { await new Promise(r => setTimeout(r, 5000)); return 1; });
    pacer.submit(async () => 2);
    pacer.submit(async () => 3);

    // 4th should reject
    await expect(pacer.submit(async () => 4)).rejects.toThrow("queue full");
  });

  it("reports state correctly", async () => {
    const pacer = new RequestPacer(100, 10);
    await pacer.submit(async () => "done");

    const state = pacer.getState();
    expect(state.dispatched).toBe(1);
    expect(state.queued).toBe(1);
    expect(state.queueDepth).toBe(0); // drained
    expect(state.rejected).toBe(0);
  });

  it("propagates errors from executed functions", async () => {
    const pacer = new RequestPacer(100, 10);
    await expect(pacer.submit(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });
});
