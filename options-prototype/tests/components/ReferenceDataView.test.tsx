import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ReferenceDataView } from "../../src/components/ReferenceDataView";

describe("ReferenceDataView", () => {
  it("renders the Options Chain heading", async () => {
    render(<ReferenceDataView />);
    expect(screen.getByText("Options Chain")).toBeTruthy();
  });

  it("shows Reference Fixtures badge for mock provider", async () => {
    render(<ReferenceDataView />);
    expect(screen.getByText("Reference Fixtures")).toBeTruthy();
  });

  it("shows provider selector with Mock selected", async () => {
    render(<ReferenceDataView />);
    const elements = screen.getAllByText("Mock");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows XLE symbol in provenance after loading", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("XLE")).toBeTruthy();
    });
  });

  it("shows Fidelity source for XLE", async () => {
    render(<ReferenceDataView />);
    await waitFor(() => {
      expect(screen.getByText("Fidelity 2026-07-02")).toBeTruthy();
    });
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

  it("has a highlighted row in the tables", async () => {
    const { container } = render(<ReferenceDataView />);
    await waitFor(() => {
      const highlighted = container.querySelectorAll(".row-highlighted");
      expect(highlighted.length).toBeGreaterThanOrEqual(1);
    });
  });
});
