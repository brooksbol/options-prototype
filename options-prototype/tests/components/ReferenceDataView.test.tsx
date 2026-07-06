import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ReferenceDataView } from "../../src/components/ReferenceDataView";

describe("ReferenceDataView", () => {
  it("renders the Reference Data heading", async () => {
    render(<ReferenceDataView />);
    expect(screen.getByText("Reference Data")).toBeTruthy();
  });

  it("shows Fidelity Capture badge", async () => {
    render(<ReferenceDataView />);
    expect(screen.getByText("Fidelity Capture")).toBeTruthy();
  });

  it("displays XLE provenance information", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("XLE — Energy Select Sector SPDR Fund")).toBeTruthy();
    });
  });

  it("displays source as Fidelity Investments", async () => {
    render(<ReferenceDataView />);
    expect(screen.getByText("Fidelity Investments")).toBeTruthy();
  });

  it("displays quote time", async () => {
    render(<ReferenceDataView />);
    expect(screen.getByText("2026-07-02 4:10 PM ET")).toBeTruthy();
  });

  it("loads XLE and displays underlying price", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      const elements = screen.getAllByText("$53.22");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders Calls table", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("Calls")).toBeTruthy();
    });
  });

  it("renders Puts table", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("Puts")).toBeTruthy();
    });
  });

  it("renders highlighted call metrics panel", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("Highlighted Call")).toBeTruthy();
    });
  });

  it("renders highlighted put metrics panel", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("Highlighted Put")).toBeTruthy();
    });
  });

  it("has a highlighted row in calls table", async () => {
    const { container } = render(<ReferenceDataView />);
    await waitFor(() => {
      const highlighted = container.querySelectorAll(".row-highlighted");
      expect(highlighted.length).toBeGreaterThanOrEqual(1);
    });
  });
});
