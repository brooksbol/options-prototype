/**
 * Tests for useSessionClassification (Issue #16).
 *
 * The hook now CONSUMES the backend-authoritative session classification published on
 * `GET /api/status` under the `session` key. It must NOT re-derive session state from a
 * local wall-clock + provider-delay profile (that was the defect: a hardcoded Sandbox
 * 15-min delay produced a phantom 09:30–09:45 ET "Open Delay" on the real-time Production
 * feed). These tests prove the hook renders whatever the backend says and does not invent
 * session/admissibility semantics locally.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSessionClassification } from "../../src/hooks/useSessionClassification";

function mockStatus(session: Record<string, unknown> | undefined) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => (session === undefined ? {} : { session }),
  }) as unknown as Response);
}

describe("useSessionClassification — consumes backend authority (Issue #16)", () => {
  // NOTE: real timers. The hook deliberately IGNORES the local wall-clock (that is the
  // authority the defect misused); it reads the backend on mount. We assert on the async
  // fetch result, not on any local clock-driven transition.
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the backend session state (Production real-time -> REGULAR_OBSERVATION at 09:41, no Open Delay)", async () => {
    vi.stubGlobal("fetch", mockStatus({
      state: "REGULAR_OBSERVATION",
      canonicalSessionDate: "2026-09-10",
      currentTradingSessionDate: "2026-09-10",
      acceptingCanonicalEvidence: true,
      priorSessionOperationallyValid: false,
      providerDelayMinutes: 0,
      admissibilityBoundaryEpochMs: 1757509800000,
    }));
    const { result } = renderHook(() => useSessionClassification());
    // Wait for the backend value to land (distinguished from the bootstrap by its boundary).
    await waitFor(() => expect(result.current.admissibilityBoundaryEpochMs).toBe(1757509800000));
    expect(result.current.state).toBe("REGULAR_OBSERVATION");
    // The FE did NOT manufacture REGULAR_OPEN_DELAY from the local clock.
    expect(result.current.state).not.toBe("REGULAR_OPEN_DELAY");
    expect(result.current.acceptingCanonicalEvidence).toBe(true);
  });

  it("renders REGULAR_OPEN_DELAY only because the BACKEND says so (Sandbox authority)", async () => {
    vi.stubGlobal("fetch", mockStatus({
      state: "REGULAR_OPEN_DELAY",
      canonicalSessionDate: "2026-09-09",
      currentTradingSessionDate: "2026-09-10",
      acceptingCanonicalEvidence: false,
      priorSessionOperationallyValid: true,
      providerDelayMinutes: 15,
      admissibilityBoundaryEpochMs: 1757510700000,
    }));
    const { result } = renderHook(() => useSessionClassification());
    await waitFor(() => expect(result.current.state).toBe("REGULAR_OPEN_DELAY"));
    expect(result.current.acceptingCanonicalEvidence).toBe(false);
  });

  it("carries the backend admissibility boundary verbatim (FE does not recompute it)", async () => {
    vi.stubGlobal("fetch", mockStatus({
      state: "REGULAR_OBSERVATION",
      canonicalSessionDate: "2026-09-10",
      currentTradingSessionDate: "2026-09-10",
      acceptingCanonicalEvidence: true,
      priorSessionOperationallyValid: false,
      providerDelayMinutes: 0,
      admissibilityBoundaryEpochMs: 424242,
    }));
    const { result } = renderHook(() => useSessionClassification());
    await waitFor(() => expect(result.current.admissibilityBoundaryEpochMs).toBe(424242));
  });

  it("retains last known classification when the backend read fails (never falls back to local derivation)", async () => {
    // First poll succeeds with a distinctive state; then fetch starts failing.
    const failing = vi.fn(async () => { throw new Error("network down"); });
    const ok = mockStatus({
      state: "CLOSED_CANONICAL",
      canonicalSessionDate: "2026-09-10",
      currentTradingSessionDate: "2026-09-10",
      acceptingCanonicalEvidence: false,
      priorSessionOperationallyValid: false,
      providerDelayMinutes: 0,
      admissibilityBoundaryEpochMs: null,
    });
    vi.stubGlobal("fetch", ok);
    const { result } = renderHook(() => useSessionClassification());
    await waitFor(() => expect(result.current.state).toBe("CLOSED_CANONICAL"));

    // Now fail subsequent reads; the hook must keep the last backend verdict rather than
    // re-derive a state locally. Give it time; assert the state never changes away.
    vi.stubGlobal("fetch", failing);
    await new Promise((r) => setTimeout(r, 100));
    expect(result.current.state).toBe("CLOSED_CANONICAL");
  });

  it("ignores a status payload with no session block (does not invent a state; stays authority-pending)", async () => {
    vi.stubGlobal("fetch", mockStatus(undefined));
    const { result } = renderHook(() => useSessionClassification());
    // No backend session -> remains the conservative bootstrap (not accepting canonical),
    // and CRUCIALLY still authority-pending so evidence consumers fail closed.
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.acceptingCanonicalEvidence).toBe(false);
    expect(result.current.authorityPending).toBe(true);
  });

  it("bootstrap is authority-pending; a successful backend read clears it (blocker #1)", async () => {
    vi.stubGlobal("fetch", mockStatus({
      state: "REGULAR_OBSERVATION",
      canonicalSessionDate: "2026-09-10",
      currentTradingSessionDate: "2026-09-10",
      acceptingCanonicalEvidence: true,
      priorSessionOperationallyValid: false,
      providerDelayMinutes: 0,
      admissibilityBoundaryEpochMs: 111,
    }));
    const { result } = renderHook(() => useSessionClassification());
    // Once the backend responds, authority is no longer pending.
    await waitFor(() => expect(result.current.authorityPending).toBe(false));
    expect(result.current.admissibilityBoundaryEpochMs).toBe(111);
  });
});
