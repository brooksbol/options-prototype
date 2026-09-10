/**
 * CrossEntryRefreshButton — bulk "Refresh top opportunities" with BOUNDED VISIBLE-STATE
 * CONVERGENCE completion semantics (visual-design-principles #12; Codex truthfulness corrections).
 *
 * Proves:
 * 1. Clicking sends the top-N symbols through the EXISTING forceEvidenceAcquisition path.
 * 2. It does NOT claim success ("Refreshed N") at POST return — it enters "Updating evidence…".
 * 3. It stays pending through the surface re-read until the requested rows' VISIBLE provenance
 *    advances past the click-time baseline; only then claims "Refreshed N".
 * 4. A backend ACQUIRED with symbolsAcquired === 0 never renders "up to date" or any confirmed-
 *    fresh claim on its own.
 * 5. If convergence does not establish within the bounded window, it ends in an explicit partial
 *    / "Not confirmed fresh" state — never a blanket success, never eternal.
 * 6. Non-ACQUIRED dispositions do not trigger a re-read and report honestly.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";

vi.mock("../../src/evidence/nudge-acquisition", () => ({
  forceEvidenceAcquisition: vi.fn(),
}));

import { CrossEntryRefreshButton } from "../../src/write-desk/CrossEntryRefreshButton";
import { forceEvidenceAcquisition } from "../../src/evidence/nudge-acquisition";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const mockForce = vi.mocked(forceEvidenceAcquisition);

afterEach(() => vi.clearAllMocks());

function acquired(n: number) {
  return {
    ok: true as const, outcome: "ACQUIRED" as const, symbolsAcquired: n, workQueueDepth: 0,
    generation: 10, sessionPosture: "REGULAR_OBSERVATION", recoversHistory: false, targeted: true,
  };
}
function prov(ms: number): EvidenceProvenance { return { kind: "chain-acquired", acquiredAtMs: ms }; }
function map(entries: Record<string, number>): Map<string, EvidenceProvenance> {
  return new Map(Object.entries(entries).map(([s, ms]) => [s, prov(ms)]));
}

describe("CrossEntryRefreshButton", () => {
  it("sends the top-N symbols through forceEvidenceAcquisition", async () => {
    mockForce.mockResolvedValue(acquired(2));
    const { container } = render(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} provenanceBySymbol={map({ BNO: 1000, COPX: 1000 })} onRefreshComplete={vi.fn()} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(mockForce).toHaveBeenCalledTimes(1));
    expect(mockForce).toHaveBeenCalledWith(["BNO", "COPX"]);
  });

  it("does NOT claim success at POST return — enters 'Updating evidence…' and stays pending", async () => {
    mockForce.mockResolvedValue(acquired(2));
    const onRefreshComplete = vi.fn();
    // Provenance never advances (stays at baseline) → must NOT declare success.
    const { container } = render(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} provenanceBySymbol={map({ BNO: 1000, COPX: 1000 })} onRefreshComplete={onRefreshComplete} convergenceTimeoutMs={10_000} />,
    );
    const btn = () => container.querySelector("button")!;
    fireEvent.click(btn());

    // Re-read kicked off, but success not yet claimed — pending "Updating evidence…".
    await waitFor(() => expect(btn().textContent).toMatch(/updating evidence/i));
    expect(btn().textContent).not.toMatch(/refreshed/i);
    expect(btn().getAttribute("aria-busy")).toBe("true");
    expect(onRefreshComplete).toHaveBeenCalledTimes(1);
  });

  it("claims 'Refreshed N' only after the requested rows' visible provenance advances", async () => {
    mockForce.mockResolvedValue(acquired(2));
    const base = map({ BNO: 1000, COPX: 1000 });
    const { container, rerender } = render(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} provenanceBySymbol={base} onRefreshComplete={vi.fn()} convergenceTimeoutMs={10_000} />,
    );
    const btn = () => container.querySelector("button")!;
    fireEvent.click(btn());
    await waitFor(() => expect(btn().textContent).toMatch(/updating evidence/i));

    // Both requested rows advance → convergence → success.
    rerender(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} provenanceBySymbol={map({ BNO: 2000, COPX: 2000 })} onRefreshComplete={vi.fn()} convergenceTimeoutMs={10_000} />,
    );
    await waitFor(() => expect(btn().textContent).toBe("Refreshed 2"));
    expect(btn().getAttribute("aria-busy")).toBe("false");
  });

  it("symbolsAcquired === 0 never renders 'up to date' or a confirmed-fresh claim on its own", async () => {
    mockForce.mockResolvedValue(acquired(0));
    // Provenance never advances → within the bound it stays pending, then ends partial/unresolved.
    const { container } = render(
      <CrossEntryRefreshButton symbols={["SPY"]} provenanceBySymbol={map({ SPY: 1000 })} onRefreshComplete={vi.fn()} convergenceTimeoutMs={30} />,
    );
    const btn = () => container.querySelector("button")!;
    fireEvent.click(btn());

    await waitFor(() => expect(btn().textContent).toMatch(/not confirmed fresh/i));
    expect(btn().textContent).not.toMatch(/up to date/i);
    expect(btn().textContent).not.toMatch(/refreshed \d/i);
  });

  it("bounded: partial convergence within the window ends in an explicit 'Refreshed X of Y'", async () => {
    mockForce.mockResolvedValue(acquired(2));
    const base = map({ BNO: 1000, COPX: 1000 });
    const { container, rerender } = render(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} provenanceBySymbol={base} onRefreshComplete={vi.fn()} convergenceTimeoutMs={40} />,
    );
    const btn = () => container.querySelector("button")!;
    fireEvent.click(btn());

    // Only ONE of two advances before the bound fires.
    rerender(
      <CrossEntryRefreshButton symbols={["BNO", "COPX"]} provenanceBySymbol={map({ BNO: 2000, COPX: 1000 })} onRefreshComplete={vi.fn()} convergenceTimeoutMs={40} />,
    );
    await waitFor(() => expect(btn().textContent).toBe("Refreshed 1 of 2"));
    expect(btn().getAttribute("aria-busy")).toBe("false");
  });

  it("does not re-read and reports honestly on a non-ACQUIRED disposition", async () => {
    mockForce.mockResolvedValue({
      ok: true, outcome: "PROVIDER_UNAVAILABLE", symbolsAcquired: 0, workQueueDepth: 0,
      generation: 10, sessionPosture: "provider_unverified", recoversHistory: false, targeted: true,
    });
    const onRefreshComplete = vi.fn();
    const { container } = render(
      <CrossEntryRefreshButton symbols={["SPY"]} provenanceBySymbol={map({ SPY: 1000 })} onRefreshComplete={onRefreshComplete} />,
    );
    fireEvent.click(container.querySelector("button")!);

    await waitFor(() => expect(container.querySelector("button")!.textContent).toMatch(/provider unavailable/i));
    expect(onRefreshComplete).not.toHaveBeenCalled();
  });

  it("is disabled when there are no symbols", () => {
    const { container } = render(
      <CrossEntryRefreshButton symbols={[]} provenanceBySymbol={new Map()} onRefreshComplete={vi.fn()} />,
    );
    expect(container.querySelector("button")!.disabled).toBe(true);
  });
});
