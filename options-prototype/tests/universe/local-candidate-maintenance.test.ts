import { beforeEach, describe, expect, it, vi } from "vitest";
import { addOperatorCandidate } from "../../src/universe/universe";
import { loadOperatorAdditions } from "../../src/universe/persistence";

describe("browser-local candidate maintenance", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
  });

  it("normalizes and persists a browser-local candidate", () => {
    addOperatorCandidate("  xyz  ");

    expect(loadOperatorAdditions()).toEqual([
      { symbol: "XYZ", sources: ["operator_manual"], addedAt: "2026-09-04" },
    ]);
  });

  it("does not duplicate a repeated local addition", () => {
    addOperatorCandidate("xyz");
    addOperatorCandidate(" XYZ ");

    expect(loadOperatorAdditions()).toHaveLength(1);
  });
});
