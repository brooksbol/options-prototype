/**
 * CrossEntryRefreshButton — "Refresh top opportunities" behavior (PL-OPS-09 consumer).
 *
 * Proves:
 * 1. Clicking sends the given (top-N, current-sort) symbols through the EXISTING
 *    forceEvidenceAcquisition path — no new acquisition mechanism.
 * 2. On a genuine ACQUIRED disposition it triggers the surface's own re-read (onRefreshComplete).
 * 3. On non-ACQUIRED dispositions (provider unavailable, failure) it does NOT re-read — evidence
 *    is unchanged by design, so a re-read would be misleading.
 * 4. Disabled when there are no symbols.
 * 5. A single click issues exactly ONE acquisition request (guards against a second acquisition).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";

// Mock the shipped PL-OPS-09 client so we assert reuse without hitting the network.
vi.mock("../../src/evidence/nudge-acquisition", () => ({
  forceEvidenceAcquisition: vi.fn(),
}));

import { CrossEntryRefreshButton } from "../../src/write-desk/CrossEntryRefreshButton";
import { forceEvidenceAcquisition } from "../../src/evidence/nudge-acquisition";

const mockForce = vi.mocked(forceEvidenceAcquisition);

afterEach(() => {
  vi.clearAllMocks();
});

function acquired(symbolsAcquired: number) {
  return {
    ok: true as const, outcome: "ACQUIRED" as const, symbolsAcquired, workQueueDepth: 0,
    generation: 10, sessionPosture: "REGULAR_OBSERVATION", recoversHistory: false, targeted: true,
  };
}

describe("CrossEntryRefreshButton", () => {
  it("sends the given symbols through forceEvidenceAcquisition (reuses PL-OPS-09)", async () => {
    mockForce.mockResolvedValue(acquired(2));
    const { container } = render(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} onRefreshComplete={vi.fn()} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(mockForce).toHaveBeenCalledTimes(1));
    expect(mockForce).toHaveBeenCalledWith(["BNO", "COPX"]);
  });

  it("re-reads the surface (onRefreshComplete) on ACQUIRED", async () => {
    mockForce.mockResolvedValue(acquired(3));
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <CrossEntryRefreshButton symbols={["SPY"]} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(onRefreshComplete).toHaveBeenCalledTimes(1));
  });

  it("does NOT re-read when the provider is unavailable (evidence unchanged)", async () => {
    mockForce.mockResolvedValue({
      ok: true, outcome: "PROVIDER_UNAVAILABLE", symbolsAcquired: 0, workQueueDepth: 0,
      generation: 10, sessionPosture: "provider_unverified", recoversHistory: false, targeted: true,
    });
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <CrossEntryRefreshButton symbols={["SPY"]} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(container.textContent).toMatch(/provider unavailable/i));
    expect(onRefreshComplete).not.toHaveBeenCalled();
  });

  it("does NOT re-read on transport failure", async () => {
    mockForce.mockResolvedValue({ ok: false, error: "network down" });
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <CrossEntryRefreshButton symbols={["SPY"]} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(container.textContent).toMatch(/refresh failed/i));
    expect(onRefreshComplete).not.toHaveBeenCalled();
  });

  it("is disabled when there are no symbols", () => {
    const { container } = render(
      <CrossEntryRefreshButton symbols={[]} onRefreshComplete={vi.fn()} />,
    );
    expect(container.querySelector("button")!.disabled).toBe(true);
  });

  it("issues exactly one acquisition request per click (no second acquisition)", async () => {
    mockForce.mockResolvedValue(acquired(1));
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <CrossEntryRefreshButton symbols={["SPY", "QQQ"]} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(onRefreshComplete).toHaveBeenCalled());
    // The re-read is the surface's OWN snapshot poll, NOT another acquisition.
    expect(mockForce).toHaveBeenCalledTimes(1);
  });
});
