import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricsPanel } from "../../src/components/MetricsPanel";
import type { OptionContract } from "../../src/domain/types";

const mockCall: OptionContract = {
  type: "CALL",
  strike: 547,
  bid: 1.95,
  ask: 2.15,
  delta: 0.32,
  openInterest: 9800,
  volume: 2300,
};

const mockPut: OptionContract = {
  type: "PUT",
  strike: 543,
  bid: 3.05,
  ask: 3.25,
  delta: -0.43,
  openInterest: 11500,
  volume: 2700,
};

describe("MetricsPanel", () => {
  it("shows placeholder when contract is null", () => {
    render(
      <MetricsPanel
        contract={null}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    expect(screen.getByText("No contract selected")).toBeTruthy();
  });

  it("displays the label", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Highlighted Call"
      />
    );
    expect(screen.getByText("Highlighted Call")).toBeTruthy();
  });

  it("displays contract strike and type", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    expect(screen.getByText("$547 CALL")).toBeTruthy();
  });

  it("displays computed mid price", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    // mid = (1.95 + 2.15) / 2 = 2.05
    expect(screen.getByText("$2.05")).toBeTruthy();
  });

  it("displays premium per contract", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    // premium = 2.05 * 100 = 205.00
    expect(screen.getByText("$205.00")).toBeTruthy();
  });

  it("displays annualized yield for calls (collateral = underlying price)", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    // yield = (2.05 / 545.2) * (365 / 14) * 100 = 9.8%
    expect(screen.getByText("9.8%")).toBeTruthy();
  });

  it("displays annualized yield for puts (collateral = strike)", () => {
    render(
      <MetricsPanel
        contract={mockPut}
        underlyingPrice={545.2}
        dte={14}
        label="Put"
      />
    );
    // mid = (3.05 + 3.25) / 2 = 3.15
    // yield = (3.15 / 543) * (365 / 14) * 100 = 15.1%
    expect(screen.getByText("15.1%")).toBeTruthy();
  });

  it("displays moneyness", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    // strike 547 > 545.2 → OTM for call
    expect(screen.getByText("OTM")).toBeTruthy();
  });

  it("displays assignment probability", () => {
    render(
      <MetricsPanel
        contract={mockCall}
        underlyingPrice={545.2}
        dte={14}
        label="Call"
      />
    );
    // |0.32| * 100 = 32%
    expect(screen.getByText("32%")).toBeTruthy();
  });
});
