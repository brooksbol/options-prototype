/**
 * Tests for useSessionClassification hook.
 *
 * Verifies that session state transitions are driven by wall-clock time,
 * not by evidence arrival or other external events.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionClassification } from "../../src/hooks/useSessionClassification";

describe("useSessionClassification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("classifies as REGULAR_OBSERVATION when mounted during regular session", () => {
    // 10:00 AM ET on a trading day (Aug 11, 2026 is Tuesday)
    vi.setSystemTime(new Date("2026-08-11T14:00:00Z")); // UTC = ET + 4 during EDT
    const { result } = renderHook(() => useSessionClassification());
    expect(result.current.state).toBe("REGULAR_OBSERVATION");
  });

  it("transitions from REGULAR_OBSERVATION to DELAY_DRAIN at exchange close", () => {
    // Start at 3:59 PM ET (one minute before exchange close)
    vi.setSystemTime(new Date("2026-08-11T19:59:00Z"));
    const { result } = renderHook(() => useSessionClassification());
    expect(result.current.state).toBe("REGULAR_OBSERVATION");

    // Advance clock to 4:01 PM ET — exchange closed, but within 15-min delay drain
    vi.setSystemTime(new Date("2026-08-11T20:01:00Z"));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.state).toBe("DELAY_DRAIN");
  });

  it("transitions from DELAY_DRAIN to CLOSED_CANONICAL after delay drain completes", () => {
    // Start at 4:10 PM ET (during delay drain: between close and close+15min)
    vi.setSystemTime(new Date("2026-08-11T20:10:00Z"));
    const { result } = renderHook(() => useSessionClassification());
    expect(result.current.state).toBe("DELAY_DRAIN");

    // Advance clock past 4:15 PM ET (delay drain complete → sealed)
    vi.setSystemTime(new Date("2026-08-11T20:16:00Z"));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.state).toBe("CLOSED_CANONICAL");
  });

  it("renders CLOSED_CANONICAL immediately when mounted after close + delay", () => {
    // 5:00 PM ET — well past close + delay drain
    vi.setSystemTime(new Date("2026-08-11T21:00:00Z"));
    const { result } = renderHook(() => useSessionClassification());
    expect(result.current.state).toBe("CLOSED_CANONICAL");
  });

  it("renders NON_TRADING_DAY when mounted on a weekend", () => {
    // Saturday Aug 15, 2026 at noon ET
    vi.setSystemTime(new Date("2026-08-15T16:00:00Z"));
    const { result } = renderHook(() => useSessionClassification());
    expect(result.current.state).toBe("NON_TRADING_DAY");
  });

  it("does not cause unnecessary re-renders when state has not changed", () => {
    // 10:00 AM ET — regular session
    vi.setSystemTime(new Date("2026-08-11T14:00:00Z"));
    const { result } = renderHook(() => useSessionClassification());
    const firstRef = result.current;

    // Advance 30s but still well within regular session
    vi.setSystemTime(new Date("2026-08-11T14:00:30Z"));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // Should be reference-equal (same state, no update triggered)
    expect(result.current).toBe(firstRef);
    expect(result.current.state).toBe("REGULAR_OBSERVATION");
  });

  it("transitions across REGULAR → DELAY_DRAIN → CLOSED without reload", () => {
    // Start at 3:55 PM ET
    vi.setSystemTime(new Date("2026-08-11T19:55:00Z"));
    const { result } = renderHook(() => useSessionClassification());
    expect(result.current.state).toBe("REGULAR_OBSERVATION");

    // 4:01 PM ET → DELAY_DRAIN
    vi.setSystemTime(new Date("2026-08-11T20:01:00Z"));
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(result.current.state).toBe("DELAY_DRAIN");

    // 4:16 PM ET → CLOSED_CANONICAL
    vi.setSystemTime(new Date("2026-08-11T20:16:00Z"));
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(result.current.state).toBe("CLOSED_CANONICAL");
  });
});
