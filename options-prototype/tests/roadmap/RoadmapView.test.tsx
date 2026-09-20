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

  it("Domain lens projects the reference with a policy boundary and selectable entries", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Domain" }));
    // Lens-level boundary is visible.
    expect(screen.getByText(/does not establish Wheelwright policy/i)).toBeTruthy();
    // A canonical Part heading renders; expand it and select an entry.
    const partRow = screen.getByText(/Options Economic Model/i).closest(".rm-row") as HTMLElement;
    fireEvent.click(within(partRow).getByRole("button", { name: /expand|collapse/i }));
    fireEvent.click(screen.getByText(/An option is a contract with two asymmetric sides/i));
    // Detail pane shows the Domain type tag.
    expect(screen.getAllByText("Domain").length).toBeGreaterThan(0);
  });

  it("Bugs lens groups defects by status with the severity-not-priority boundary", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Bugs" }));
    // Boundary is visible.
    expect(screen.getByText(/not remediation/i)).toBeTruthy();
    // Status group present (Open); expand it and select a defect.
    const openRow = screen.getByText("Open").closest(".rm-row") as HTMLElement;
    fireEvent.click(within(openRow).getByRole("button", { name: /expand|collapse/i }));
    // A known bug id renders once expanded, and selecting it shows its canonical
    // record detail (a section heading) plus the record reference.
    fireEvent.click(screen.getByText("BUG-018"));
    expect(screen.getByRole("heading", { name: /Observed failure/i })).toBeTruthy();
    expect(screen.getAllByText(/docs\/bugs\/BUG-018/i).length).toBeGreaterThan(0);
  });

  it("Coming Soon lens renders Now / Next / Later horizons", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Coming Soon" }));
    expect(screen.getByRole("heading", { name: "Now" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Next" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Later" })).toBeTruthy();
    // A ratified capability appears in its horizon.
    expect(screen.getByText(/Genuine WAIT \/ governed alternatives/i)).toBeTruthy();
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
