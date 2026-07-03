import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OptionsTable } from "../../src/components/OptionsTable";
import type { OptionContract } from "../../src/domain/types";

const mockCalls: OptionContract[] = [
  { type: "CALL", strike: 545, bid: 3.60, ask: 3.80, delta: 0.42, openInterest: 15200, volume: 4100 },
  { type: "CALL", strike: 543, bid: 4.30, ask: 4.50, delta: 0.53, openInterest: 10500, volume: 2600 },
  { type: "CALL", strike: 547, bid: 1.95, ask: 2.15, delta: 0.32, openInterest: 9800, volume: 2300 },
];

describe("OptionsTable", () => {
  it("renders the title", () => {
    render(
      <OptionsTable
        contracts={mockCalls}
        underlyingPrice={545.2}
        highlightedStrike={null}
        sortDirection="asc"
        title="Calls"
      />
    );
    expect(screen.getByText("Calls")).toBeTruthy();
  });

  it("renders all contracts", () => {
    render(
      <OptionsTable
        contracts={mockCalls}
        underlyingPrice={545.2}
        highlightedStrike={null}
        sortDirection="asc"
        title="Calls"
      />
    );
    expect(screen.getByText("$543")).toBeTruthy();
    expect(screen.getByText("$545")).toBeTruthy();
    expect(screen.getByText("$547")).toBeTruthy();
  });

  it("sorts ascending when sortDirection is asc", () => {
    const { container } = render(
      <OptionsTable
        contracts={mockCalls}
        underlyingPrice={545.2}
        highlightedStrike={null}
        sortDirection="asc"
        title="Calls"
      />
    );
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0].textContent).toContain("$543");
    expect(rows[1].textContent).toContain("$545");
    expect(rows[2].textContent).toContain("$547");
  });

  it("sorts descending when sortDirection is desc", () => {
    const { container } = render(
      <OptionsTable
        contracts={mockCalls}
        underlyingPrice={545.2}
        highlightedStrike={null}
        sortDirection="desc"
        title="Puts"
      />
    );
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0].textContent).toContain("$547");
    expect(rows[1].textContent).toContain("$545");
    expect(rows[2].textContent).toContain("$543");
  });

  it("highlights the row matching highlightedStrike", () => {
    const { container } = render(
      <OptionsTable
        contracts={mockCalls}
        underlyingPrice={545.2}
        highlightedStrike={545}
        sortDirection="asc"
        title="Calls"
      />
    );
    const highlighted = container.querySelectorAll(".row-highlighted");
    expect(highlighted.length).toBe(1);
    expect(highlighted[0].textContent).toContain("$545");
  });

  it("displays computed mid price", () => {
    render(
      <OptionsTable
        contracts={[mockCalls[0]]}
        underlyingPrice={545.2}
        highlightedStrike={null}
        sortDirection="asc"
        title="Calls"
      />
    );
    // mid of bid=3.60, ask=3.80 is 3.70
    expect(screen.getByText("3.70")).toBeTruthy();
  });

  it("displays moneyness classification", () => {
    render(
      <OptionsTable
        contracts={mockCalls}
        underlyingPrice={545.2}
        highlightedStrike={null}
        sortDirection="asc"
        title="Calls"
      />
    );
    // strike 543 < 545.2 → ITM for calls
    expect(screen.getByText("ITM")).toBeTruthy();
    // strike 547 > 545.2 → OTM for calls
    expect(screen.getByText("OTM")).toBeTruthy();
  });
});
