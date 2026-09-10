/**
 * RowRefreshButton — per-row surgical re-observation (PL-OPS-09 consumer) with
 * VISIBLE-STATE CONVERGENCE completion semantics.
 *
 * Proves:
 * 1. Clicking sends exactly the row's single symbol through the EXISTING forceEvidenceAcquisition
 *    path (one-symbol set) — no new acquisition mechanism.
 * 2. On ACQUIRED it triggers the surface re-read (onRefreshComplete).
 * 3. The spinner keeps spinning AFTER acquisition returns, until the row's provenance advances
 *    (visible-state convergence) — it does not declare "done" on request completion.
 * 4. When the provenance prop advances, the spinner stops (success, idle glyph).
 * 5. On a non-ACQUIRED disposition it does NOT re-read and shows a non-silent failed state.
 * 6. The click does not propagate to the row (stopPropagation).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor, fireEvent, act } from "@testing-library/react";

vi.mock("../../src/evidence/nudge-acquisition", () => ({
  forceEvidenceAcquisition: vi.fn(),
}));

import { RowRefreshButton } from "../../src/write-desk/RowRefreshButton";
import { forceEvidenceAcquisition } from "../../src/evidence/nudge-acquisition";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const mockForce = vi.mocked(forceEvidenceAcquisition);

afterEach(() => vi.clearAllMocks());

function acquired() {
  return {
    ok: true as const, outcome: "ACQUIRED" as const, symbolsAcquired: 1, workQueueDepth: 0,
    generation: 10, sessionPosture: "REGULAR_OBSERVATION", recoversHistory: false, targeted: true,
  };
}

function prov(acquiredAtMs: number): EvidenceProvenance {
  return { kind: "chain-acquired", acquiredAtMs };
}

describe("RowRefreshButton", () => {
  it("sends exactly the row's single symbol through forceEvidenceAcquisition", async () => {
    mockForce.mockResolvedValue(acquired());
    const { container } = render(
      <RowRefreshButton symbol="GLD" provenance={prov(1000)} onRefreshComplete={vi.fn()} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(mockForce).toHaveBeenCalledTimes(1));
    expect(mockForce).toHaveBeenCalledWith(["GLD"]);
  });

  it("triggers the surface re-read on ACQUIRED", async () => {
    mockForce.mockResolvedValue(acquired());
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <RowRefreshButton symbol="SPY" provenance={prov(1000)} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(onRefreshComplete).toHaveBeenCalledTimes(1));
  });

  it("keeps spinning after acquisition until the row provenance advances (convergence)", async () => {
    mockForce.mockResolvedValue(acquired());
    const { container, rerender } = render(
      <RowRefreshButton symbol="SPY" provenance={prov(1000)} onRefreshComplete={vi.fn()} />,
    );
    const btn = () => container.querySelector("button")!;
    fireEvent.click(btn());

    // After acquisition returns, still busy (awaiting convergence) — NOT done.
    await waitFor(() => expect(btn().getAttribute("aria-busy")).toBe("true"));
    expect(btn().disabled).toBe(true);

    // Provenance has NOT advanced yet (same baseline) → still spinning.
    rerender(<RowRefreshButton symbol="SPY" provenance={prov(1000)} onRefreshComplete={vi.fn()} />);
    expect(btn().getAttribute("aria-busy")).toBe("true");

    // Now the row's provenance advances (recompute landed) → spinner stops (success).
    act(() => {
      rerender(<RowRefreshButton symbol="SPY" provenance={prov(2000)} onRefreshComplete={vi.fn()} />);
    });
    await waitFor(() => expect(btn().getAttribute("aria-busy")).toBe("false"));
    expect(btn().textContent).toBe("↻");
  });

  it("does NOT re-read and shows a failed state on a non-ACQUIRED disposition", async () => {
    mockForce.mockResolvedValue({
      ok: true, outcome: "PROVIDER_UNAVAILABLE", symbolsAcquired: 0, workQueueDepth: 0,
      generation: 10, sessionPosture: "provider_unverified", recoversHistory: false, targeted: true,
    });
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <RowRefreshButton symbol="SPY" provenance={prov(1000)} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(container.querySelector("button")!.textContent).toBe("⚠"));
    expect(onRefreshComplete).not.toHaveBeenCalled();
  });

  it("stops click propagation so it does not also select the row", async () => {
    mockForce.mockResolvedValue(acquired());
    const rowClick = vi.fn();
    const { container } = render(
      <tr onClick={rowClick}>
        <td><RowRefreshButton symbol="SPY" provenance={prov(1000)} onRefreshComplete={vi.fn()} /></td>
      </tr>,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(mockForce).toHaveBeenCalled());
    expect(rowClick).not.toHaveBeenCalled();
  });

  it("is bounded: if the row never converges, the spinner terminates into indeterminate (never eternal)", async () => {
    mockForce.mockResolvedValue(acquired());
    // Inject a tiny convergence bound so the test uses real timers deterministically (no
    // fake-timer/microtask contamination). Provenance is never advanced, so convergence
    // cannot happen — the bound must fire.
    const { container } = render(
      <RowRefreshButton
        symbol="SPY"
        provenance={prov(1000)}
        onRefreshComplete={vi.fn()}
        convergenceTimeoutMs={20}
      />,
    );
    const btn = () => container.querySelector("button")!;
    fireEvent.click(btn());

    // The spinner must STOP (never eternal) into an explicit indeterminate "?" — not a clean
    // success while the value is still stale.
    await waitFor(() => expect(btn().textContent).toBe("?"));
    expect(btn().getAttribute("aria-busy")).toBe("false");
  });
});
