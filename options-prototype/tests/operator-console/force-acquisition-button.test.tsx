/**
 * ForceAcquisitionButton — component render/interaction tests (PL-OPS-08).
 *
 * Proves:
 * 1. Renders the recovery label at rest
 * 2. Clicking invokes the EXISTING endpoint (POST /api/evidence/refresh)
 * 3. Reports the honest forced-acquisition outcome (acquired count)
 * 4. Reports provider-unavailable / offline / failure states honestly
 * 5. Never claims to have recovered missed history (doctrine guard)
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ForceAcquisitionButton } from "../../src/operator-console/ForceAcquisitionButton";

function stubForce(body: Record<string, unknown>, ok = true, status = 200) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, status, json: async () => body })));
}

describe("ForceAcquisitionButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the recovery label at rest", () => {
    render(<ForceAcquisitionButton />);
    expect(screen.getByRole("button", { name: /refresh evidence now/i })).toBeTruthy();
  });

  it("invokes the existing endpoint on click and reports the acquired count", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ outcome: "ACQUIRED", symbolsAcquired: 4, workQueueDepth: 2, generation: 9, sessionPosture: "BLOCKED", recoversHistory: false }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ForceAcquisitionButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/evidence/refresh");
    expect(opts.method).toBe("POST");

    await waitFor(() => {
      expect(screen.getByRole("button").textContent).toMatch(/acquired 4/i);
    });
  });

  it("reports 'up to date' when a forced cycle acquired nothing due", async () => {
    stubForce({ outcome: "ACQUIRED", symbolsAcquired: 0, workQueueDepth: 0, generation: 9, sessionPosture: "BLOCKED", recoversHistory: false });

    render(<ForceAcquisitionButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button").textContent).toMatch(/up to date/i);
    });
  });

  it("reports provider-unavailable honestly", async () => {
    stubForce({ outcome: "PROVIDER_UNAVAILABLE", symbolsAcquired: 0, workQueueDepth: 5, generation: 7, sessionPosture: "provider_unverified", recoversHistory: false });

    render(<ForceAcquisitionButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button").textContent).toMatch(/provider unavailable/i);
    });
  });

  it("reports a failure state when the request fails", async () => {
    stubForce({}, false, 500);

    render(<ForceAcquisitionButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button").textContent).toMatch(/acquisition failed/i);
    });
  });

  it("never claims to have recovered missed history (doctrine guard)", async () => {
    stubForce({ outcome: "ACQUIRED", symbolsAcquired: 4, workQueueDepth: 2, generation: 9, sessionPosture: "BLOCKED", recoversHistory: false });

    render(<ForceAcquisitionButton />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(btn.textContent).toMatch(/acquired 4/i);
    });
    // Forward acquisition only — must never imply historical reconstruction/backfill.
    expect(btn.textContent).not.toMatch(/backfill|recovered history|historical|restored the gap/i);
  });
});
