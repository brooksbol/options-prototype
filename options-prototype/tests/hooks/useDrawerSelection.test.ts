import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawerSelection } from "../../src/hooks/useDrawerSelection";

// Lightweight stand-ins for the real types
type Put = { symbol: string; strike: number };
type Call = { symbol: string; strike: number };
type BW = { symbol: string; strike: number };
type Pos = { tablePosition: number };

function setup() {
  return renderHook(() => useDrawerSelection<Put, Call, BW, Pos>());
}

describe("useDrawerSelection — mutual exclusivity", () => {
  it("starts with all selections null", () => {
    const { result } = setup();
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
  });

  it("selecting a put clears call and buy-write", () => {
    const { result } = setup();
    // Pre-set a call selection
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));
    expect(result.current.selectedCallCandidate).not.toBeNull();

    // Select a put — should clear the call
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 3 } }));
    expect(result.current.selectedCandidate).toEqual({ symbol: "SPY", strike: 400 });
    expect(result.current.tablePosition).toEqual({ tablePosition: 3 });
    expect(result.current.selectedCallCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });

  it("selecting a call clears put and buy-write", () => {
    const { result } = setup();
    // Pre-set a buy-write selection
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "AAPL", strike: 180 } }));
    expect(result.current.selectedBuyWriteCandidate).not.toBeNull();

    // Select a call — should clear the buy-write
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));
    expect(result.current.selectedCallCandidate).toEqual({ symbol: "XLE", strike: 90 });
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
  });

  it("selecting a buy-write clears put and call", () => {
    const { result } = setup();
    // Pre-set a put selection
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 1 } }));
    expect(result.current.selectedCandidate).not.toBeNull();
    expect(result.current.tablePosition).not.toBeNull();

    // Select a buy-write — should clear put and tablePosition
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "MSFT", strike: 350 } }));
    expect(result.current.selectedBuyWriteCandidate).toEqual({ symbol: "MSFT", strike: 350 });
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
  });

  // --- Cross-surface transition scenarios (the exact defect paths reported) ---

  it("V0 BW → Put: switches drawer to Put", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "XLE", strike: 85 } }));
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 420 } }));

    expect(result.current.selectedCandidate).toEqual({ symbol: "SPY", strike: 420 });
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
  });

  it("V0 CSP → BW: switches drawer to BW", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 420 } }));
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "XLE", strike: 85 } }));

    expect(result.current.selectedBuyWriteCandidate).toEqual({ symbol: "XLE", strike: 85 });
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
  });

  it("Put → BW: switches drawer", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "AAPL", strike: 170 }, putPos: { tablePosition: 2 } }));
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "MSFT", strike: 350 } }));

    expect(result.current.selectedBuyWriteCandidate).toEqual({ symbol: "MSFT", strike: 350 });
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
  });

  it("BW → Put: switches drawer", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "MSFT", strike: 350 } }));
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "AAPL", strike: 170 }, putPos: { tablePosition: 5 } }));

    expect(result.current.selectedCandidate).toEqual({ symbol: "AAPL", strike: 170 });
    expect(result.current.tablePosition).toEqual({ tablePosition: 5 });
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });

  it("Call → Put: switches drawer", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 430 } }));

    expect(result.current.selectedCandidate).toEqual({ symbol: "SPY", strike: 430 });
    expect(result.current.selectedCallCandidate).toBeNull();
  });

  it("Call → BW: switches drawer", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "AAPL", strike: 180 } }));

    expect(result.current.selectedBuyWriteCandidate).toEqual({ symbol: "AAPL", strike: 180 });
    expect(result.current.selectedCallCandidate).toBeNull();
  });

  it("only one selection remains active after each transition (rapid sequence)", () => {
    const { result } = setup();

    // Simulate rapid cross-surface clicks
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "A", strike: 1 } }));
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "B", strike: 2 } }));
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "C", strike: 3 } }));
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "D", strike: 4 } }));
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "E", strike: 5 } }));

    // Only the last selection should be active
    expect(result.current.selectedCallCandidate).toEqual({ symbol: "E", strike: 5 });
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();

    // Count how many are non-null: must be exactly 1
    const activeCount = [
      result.current.selectedCandidate,
      result.current.selectedCallCandidate,
      result.current.selectedBuyWriteCandidate,
    ].filter(Boolean).length;
    expect(activeCount).toBe(1);
  });

  it("clearAll deactivates everything", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 1 } }));
    act(() => result.current.clearAll());

    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });

  // --- onClose: only clears the dismissed drawer ---

  it("closeCandidate only clears put selection", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 2 } }));
    act(() => result.current.closeCandidate());

    expect(result.current.selectedCandidate).toBeNull();
    // tablePosition is not cleared by closeCandidate (mirrors existing onClose behavior)
    expect(result.current.selectedCallCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });

  it("closeCallCandidate only clears call selection", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));
    act(() => result.current.closeCallCandidate());

    expect(result.current.selectedCallCandidate).toBeNull();
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });

  it("closeBuyWriteCandidate only clears buy-write selection", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "MSFT", strike: 350 } }));
    act(() => result.current.closeBuyWriteCandidate());

    expect(result.current.selectedBuyWriteCandidate).toBeNull();
    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
  });

  it("selecting 'none' clears all selections", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 1 } }));
    act(() => result.current.selectDrawerCandidate("none"));

    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
    expect(result.current.selectedCallCandidate).toBeNull();
    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });
});

describe("useDrawerSelection — conditional clear (re-recommend validity)", () => {
  it("clearCandidateIf clears put + tablePosition when predicate is true", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 3 } }));

    act(() => result.current.clearCandidateIf((prev) => prev.symbol === "SPY"));

    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
  });

  it("clearCandidateIf retains put selection when predicate is false", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("put", { put: { symbol: "SPY", strike: 400 }, putPos: { tablePosition: 3 } }));

    act(() => result.current.clearCandidateIf((prev) => prev.symbol === "AAPL"));

    expect(result.current.selectedCandidate).toEqual({ symbol: "SPY", strike: 400 });
    expect(result.current.tablePosition).toEqual({ tablePosition: 3 });
  });

  it("clearCandidateIf is a no-op when no candidate is selected", () => {
    const { result } = setup();

    act(() => result.current.clearCandidateIf(() => true));

    expect(result.current.selectedCandidate).toBeNull();
    expect(result.current.tablePosition).toBeNull();
  });

  it("clearCallCandidateIf clears call when predicate is true", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));

    act(() => result.current.clearCallCandidateIf((prev) => prev.symbol === "XLE"));

    expect(result.current.selectedCallCandidate).toBeNull();
  });

  it("clearCallCandidateIf retains call when predicate is false", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("call", { call: { symbol: "XLE", strike: 90 } }));

    act(() => result.current.clearCallCandidateIf((prev) => prev.symbol === "AAPL"));

    expect(result.current.selectedCallCandidate).toEqual({ symbol: "XLE", strike: 90 });
  });

  it("clearBuyWriteCandidateIf clears buy-write when predicate is true", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "MSFT", strike: 350 } }));

    act(() => result.current.clearBuyWriteCandidateIf((prev) => prev.strike === 350));

    expect(result.current.selectedBuyWriteCandidate).toBeNull();
  });

  it("clearBuyWriteCandidateIf retains buy-write when predicate is false", () => {
    const { result } = setup();
    act(() => result.current.selectDrawerCandidate("buywrite", { buyWrite: { symbol: "MSFT", strike: 350 } }));

    act(() => result.current.clearBuyWriteCandidateIf((prev) => prev.strike === 400));

    expect(result.current.selectedBuyWriteCandidate).toEqual({ symbol: "MSFT", strike: 350 });
  });
});
