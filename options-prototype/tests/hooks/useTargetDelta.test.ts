import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTargetDelta } from "../../src/hooks/useTargetDelta";

describe("useTargetDelta", () => {
  it("returns default policy when no override provided", () => {
    const { result } = renderHook(() => useTargetDelta());
    expect(result.current.policy.targetDelta).toBe(0.3);
    expect(result.current.policy.tieBreaker).toBe("PreferOTM");
  });

  it("accepts partial default overrides", () => {
    const { result } = renderHook(() =>
      useTargetDelta({ targetDelta: 0.25 })
    );
    expect(result.current.policy.targetDelta).toBe(0.25);
    expect(result.current.policy.tieBreaker).toBe("PreferOTM");
  });

  it("setTargetDelta updates the target delta", () => {
    const { result } = renderHook(() => useTargetDelta());
    act(() => {
      result.current.setTargetDelta(0.45);
    });
    expect(result.current.policy.targetDelta).toBe(0.45);
  });

  it("setTargetDelta clamps to minimum 0.01", () => {
    const { result } = renderHook(() => useTargetDelta());
    act(() => {
      result.current.setTargetDelta(0);
    });
    expect(result.current.policy.targetDelta).toBe(0.01);
  });

  it("setTargetDelta clamps to maximum 0.99", () => {
    const { result } = renderHook(() => useTargetDelta());
    act(() => {
      result.current.setTargetDelta(1.5);
    });
    expect(result.current.policy.targetDelta).toBe(0.99);
  });

  it("setTieBreaker updates the tie-breaker policy", () => {
    const { result } = renderHook(() => useTargetDelta());
    act(() => {
      result.current.setTieBreaker("PreferITM");
    });
    expect(result.current.policy.tieBreaker).toBe("PreferITM");
  });

  it("setTargetDelta preserves tieBreaker", () => {
    const { result } = renderHook(() =>
      useTargetDelta({ tieBreaker: "PreferITM" })
    );
    act(() => {
      result.current.setTargetDelta(0.40);
    });
    expect(result.current.policy.tieBreaker).toBe("PreferITM");
    expect(result.current.policy.targetDelta).toBe(0.40);
  });
});
