/**
 * Roadmap surface component tests.
 *
 * Verify the surface renders the strategic tree with progressive disclosure,
 * surfaces explicit relationships in the detail panel, and — critically — states
 * absence of a relationship rather than inventing one.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RoadmapView } from "../../src/roadmap/RoadmapView";

describe("RoadmapView", () => {
  it("renders the strategy lens by default with only the Vision root visible (collapsed)", () => {
    render(<RoadmapView />);
    // Vision root is visible.
    expect(screen.getByText("Wheelwright Vision")).toBeTruthy();
    // Trees start fully collapsed, so goals are NOT visible until the root is expanded.
    expect(screen.queryByText("Understand the Choices")).toBeNull();
  });

  it("progressively discloses: trees are collapsed by default; expanding reveals children", () => {
    render(<RoadmapView />);
    // Expand the Vision root to reveal goals.
    const visionRow = screen.getByText("Wheelwright Vision").closest(".rm-row") as HTMLElement;
    const visionTwisty = within(visionRow).getByRole("button", { name: /expand|collapse/i });
    fireEvent.click(visionTwisty);
    expect(screen.queryByText("Understand the Choices")).toBeTruthy();
    // A bet is still hidden until its goal is expanded.
    expect(screen.queryByText("WAIT as a Genuine Alternative")).toBeNull();

    // Expand the goal to reveal its bets.
    const goalRow = screen.getByText("Understand the Choices").closest(".rm-row") as HTMLElement;
    const goalTwisty = within(goalRow).getByRole("button", { name: /expand|collapse/i });
    fireEvent.click(goalTwisty);
    expect(screen.queryByText("WAIT as a Genuine Alternative")).toBeTruthy();
  });

  it("shows explicit relationships in the detail panel and states absence otherwise", () => {
    render(<RoadmapView />);
    // Select the Vision root — it has no explicit AR/PL relationship, so the panel
    // must say so rather than inventing one.
    fireEvent.click(screen.getByText("Wheelwright Vision"));
    expect(
      screen.getByText(/No architectural pressure explicitly cites this node/i)
    ).toBeTruthy();
  });

  it("switches to the Architecture lens and lists AR pressures as a collapsed tree", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Architecture" }));
    // AR rows are rendered (id visible in the row).
    expect(screen.getByText("AR1")).toBeTruthy();
    // Expanding an AR reveals its explicit "pressure from" children.
    const arRow = screen.getByText("AR3").closest(".rm-row") as HTMLElement;
    const twisty = within(arRow).getByRole("button", { name: /expand|collapse/i });
    fireEvent.click(twisty);
    expect(screen.getAllByText(/pressure from/i).length).toBeGreaterThan(0);
  });

  it("shows an AR pressure's detail when selected in the tree", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Architecture" }));
    fireEvent.click(screen.getByText("AR3"));
    // Detail pane shows the explicit pressure-from section.
    expect(screen.getByText(/Pressure from \(explicit\)/i)).toBeTruthy();
  });

  it("switches to the Principles lens and shows a principle's statement when selected", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Principles" }));
    // Family groups render, collapsed by default; expand the Architectural group.
    const groupRow = screen.getByText(/Architectural \/ build/i).closest(".rm-row") as HTMLElement;
    fireEvent.click(within(groupRow).getByRole("button", { name: /expand|collapse/i }));
    // Select a known ratified principle.
    fireEvent.click(screen.getByText("Evidence appliance"));
    expect(screen.getByText("Statement")).toBeTruthy();
  });

  it("Priority lens shows the ratified stack in rank order", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Priority" }));
    // Established ranking renders (not the honest-empty message).
    expect(screen.queryByText(/No authoritative priority ranking established yet/i)).toBeNull();
    // Rank 1 references the awareness/trustworthy-state goal.
    expect(screen.getByText("LVT-GOAL-AWARENESS")).toBeTruthy();
  });

  it("Coming Soon lens honestly reports nothing curated (no auto-inclusion)", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Coming Soon" }));
    expect(screen.getByText(/Nothing is currently announced as coming soon/i)).toBeTruthy();
  });

  it("switches to the ADRs lens and shows a decision's detail when selected", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "ADRs" }));
    // ADR rows render (id visible).
    expect(screen.getByText("ADR-001")).toBeTruthy();
    expect(screen.getByText("ADR-018")).toBeTruthy();
    // Selecting one shows its Context section in the detail pane.
    fireEvent.click(screen.getByText("ADR-018"));
    expect(screen.getByText("Context")).toBeTruthy();
    expect(screen.getAllByText(/docs\/07c-adrs\.md/i).length).toBeGreaterThan(0);
  });

  it("switches to the Parking Lot lens and groups items by section (collapsed by default)", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Parking Lot" }));
    // Groups start collapsed, so items are hidden until a section is expanded.
    expect(screen.queryByText("PL-ROADMAP-UI")).toBeNull();
    // A known section group row is present.
    const groupRow = screen
      .getByText(/Reconciliation \/ continuation record/i)
      .closest(".rm-row") as HTMLElement;
    const twisty = within(groupRow).getByRole("button", { name: /expand|collapse/i });
    fireEvent.click(twisty);
    // Now the item is visible.
    expect(screen.getByText("PL-ROADMAP-UI")).toBeTruthy();
  });

  it("surfaces the resolved landscape (graduated/closed) as a collapsed tree group", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Parking Lot" }));
    // The resolved-landscape group row exists, collapsed by default.
    const resolvedRow = screen.getByText(/Resolved landscape/i).closest(".rm-row") as HTMLElement;
    const resolvedTwisty = within(resolvedRow).getByRole("button", { name: /Expand|Collapse/i });
    expect(resolvedTwisty.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(resolvedTwisty);
    expect(resolvedTwisty.getAttribute("aria-expanded")).toBe("true");
    // A known graduated disposition word appears once expanded.
    expect(screen.getAllByText(/Superseded|Promoted|Implemented/i).length).toBeGreaterThan(0);
  });

  it("shows a parking-lot item's detail when selected in the tree", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Parking Lot" }));
    // Expand the item's section group first (trees start collapsed).
    const groupRow = screen
      .getByText(/Reconciliation \/ continuation record/i)
      .closest(".rm-row") as HTMLElement;
    fireEvent.click(within(groupRow).getByRole("button", { name: /expand|collapse/i }));
    // Select the item.
    fireEvent.click(screen.getByText("PL-ROADMAP-UI"));
    // Detail pane shows the Section heading.
    expect(screen.getByText("Section")).toBeTruthy();
    expect(screen.getByText(/Related strategy \(explicit\)/i)).toBeTruthy();
  });
});
