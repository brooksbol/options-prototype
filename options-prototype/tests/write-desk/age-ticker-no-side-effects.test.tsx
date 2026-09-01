/**
 * PL-EVID-AGE — the Age wall-clock ticker has NO semantic side effects.
 *
 * The invariant we care about is not React render internals; it is that
 * advancing the Age clock:
 *   - does not fetch snapshots or make any network/provider call;
 *   - does not mutate/replace the provenance it was given;
 *   - only changes the rendered age string for unchanged provenance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { AgeCell, AGE_TICK_MS } from "../../src/write-desk/AgeCell";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

describe("Age ticker — no semantic side effects", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("advances rendered age over time without any network/provider activity", () => {
    // Any fetch during a tick would be a side effect. Fail loudly if called.
    const fetchSpy = vi.fn(() => { throw new Error("ticker must not fetch"); });
    vi.stubGlobal("fetch", fetchSpy);

    // Freeze a base time so age is deterministic.
    const base = 1_000_000_000_000;
    vi.setSystemTime(base);

    // Provenance object is frozen so we can prove the ticker never mutates it.
    const provenance: EvidenceProvenance = Object.freeze({ kind: "chain-acquired", acquiredAtMs: base - 10_000 });

    render(<AgeCell provenance={provenance} />);

    // Initial: 10s old.
    expect(screen.getByText("10s")).toBeTruthy();

    // Advance wall clock and fire the shared ticker.
    act(() => {
      vi.setSystemTime(base + 60_000);
      vi.advanceTimersByTime(AGE_TICK_MS);
    });

    // Age advanced to ~1m purely from the clock; provenance unchanged.
    expect(screen.getByText("1m")).toBeTruthy();
    expect(provenance).toEqual({ kind: "chain-acquired", acquiredAtMs: base - 10_000 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders an em dash for unavailable provenance and never throws on tick", () => {
    const base = 1_000_000_000_000;
    vi.setSystemTime(base);
    render(<AgeCell provenance={{ kind: "unavailable" }} />);
    expect(screen.getByText("—")).toBeTruthy();
    act(() => {
      vi.setSystemTime(base + 3 * AGE_TICK_MS);
      vi.advanceTimersByTime(3 * AGE_TICK_MS);
    });
    expect(screen.getByText("—")).toBeTruthy();
  });
});
