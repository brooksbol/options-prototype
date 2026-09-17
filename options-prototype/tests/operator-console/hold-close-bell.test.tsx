/**
 * HoldCloseBell — row BTS attention indicator presentation tests.
 *   - actionable → RED indicator (a governed lifecycle action needs attention).
 *   - none       → renders nothing.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HoldCloseBell } from "../../src/operator-console/HoldCloseBell";

describe("HoldCloseBell", () => {
  it("actionable: renders the RED attention indicator with an action-oriented label", () => {
    const { container, getByRole } = render(<HoldCloseBell notice="actionable" />);
    const bell = container.querySelector(".hcb");
    expect(bell).not.toBeNull();
    expect(bell?.classList.contains("hcb-actionable")).toBe(true);
    expect(container.querySelector(".hcb-dot")).not.toBeNull();
    expect(getByRole("img").getAttribute("aria-label")).toMatch(/action/i);
    expect(bell?.getAttribute("data-notice")).toBe("actionable");
  });

  it("none: renders no indicator at all", () => {
    const { container } = render(<HoldCloseBell notice="none" />);
    expect(container.querySelector(".hcb")).toBeNull();
    expect(container.firstChild).toBeNull();
  });
});
