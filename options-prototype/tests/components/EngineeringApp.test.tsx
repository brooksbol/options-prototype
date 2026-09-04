import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EngineeringApp } from "../../src/engineering/EngineeringApp";

describe("EngineeringApp boundary", () => {
  it("exposes exactly the three approved engineering instruments", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/engineering/universe" },
      writable: true,
    });

    render(<EngineeringApp />);

    expect(screen.getAllByRole("link").map((link) => link.textContent?.trim())).toEqual([
      "Universe Inspection",
      "CSV Diagnostics",
      "Scenario Replay",
    ]);
    expect(screen.getByText(/changes browser-local candidate state only/i)).toBeTruthy();
    expect(screen.getByText(/does not admit the symbol/i)).toBeTruthy();
  });
});
