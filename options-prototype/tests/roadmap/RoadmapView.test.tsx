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
    // Log is the default lens; its intro is visible on mount without clicking a tab.
    expect(screen.getByRole("tab", { name: "Log" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Strategy" }).getAttribute("aria-selected")).toBe("false");
    // The strategy tree renders when the Strategy lens is selected.
    fireEvent.click(screen.getByRole("tab", { name: "Strategy" }));
    // Vision root is visible.
    expect(screen.getByText("Wheelwright Vision")).toBeTruthy();
    // Trees start fully collapsed, so goals are NOT visible until the root is expanded.
    expect(screen.queryByText("Understand the Choices")).toBeNull();
  });

  it("progressively discloses: trees are collapsed by default; expanding reveals children", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Strategy" }));
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
    fireEvent.click(screen.getByRole("tab", { name: "Strategy" }));
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

  it("switches to the Log lens and shows explicit governed events NEWEST-FIRST", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // Lens intro states the governed-temporal-event purpose.
    expect(screen.getByText(/Explicit governed temporal events/i)).toBeTruthy();
    // A known event's PL id is rendered.
    expect(screen.getAllByText("PL-OPS-08").length).toBeGreaterThan(0);
    // Event dates render in DESCENDING (newest-first) order.
    const isos = Array.from(document.querySelectorAll(".rm-log-date-iso")).map(
      (el) => el.textContent ?? ""
    );
    expect(isos.length).toBeGreaterThan(1);
    expect([...isos]).toEqual([...isos].sort().reverse());
    // Newest overall date is first; oldest is last. Per the ratified cross-authority
    // Log semantic, canonical governed events across authorities are in scope; the
    // newest governed events in the corpus are dated 2026-09-24 (PL-SEM-01 / PL-DEC-BEH
    // refinements and the BUG-026 / BUG-027 filings).
    expect(isos[0]).toBe("2026-09-24");
    expect(isos[isos.length - 1]).toBe("2026-09-01");
    // A canonical governed BUG event is projected into the Log (cross-authority),
    // preserving its BUG-NNN identity rather than being given a PL-* identity.
    expect(screen.getAllByText(/^BUG-\d+$/).length).toBeGreaterThan(0);
  });

  it("Log lens marks bug-corpus events with a BUG source tag (distinct from parking-lot events)", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));

    // Every bug-sourced Log row carries a "BUG" source tag; a bug row is otherwise
    // styled identically to a parking-lot row and reads as a generic kind (e.g.
    // "Remediation / closure" / "Reconciliation") without it.
    const bugTags = document.querySelectorAll(".rm-log-source-bug");
    expect(bugTags.length).toBeGreaterThan(0);
    for (const t of Array.from(bugTags)) {
      expect(t.textContent).toBe("BUG");
    }

    // The number of BUG source tags in the list matches the number of BUG-NNN id
    // chips in the list (every bug row is tagged; no PL row is falsely tagged).
    const listBugTags = document.querySelectorAll(".rm-log-list .rm-log-source-bug").length;
    const listBugIds = Array.from(document.querySelectorAll(".rm-log-list .rm-node-id"))
      .filter((el) => /^BUG-\d+$/.test(el.textContent ?? "")).length;
    expect(listBugTags).toBe(listBugIds);
  });

  it("preserves canonical source order WITHIN a same-date group (day not reversed)", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // The four 2026-09-21 events must keep their authored source order even though
    // the overall list runs newest-first. Their titles, in canonical source order,
    // begin: Log lens intake/reconciliation, PL-ARCH-07, Log lens implemented,
    // Log lens ... corrected. We assert the first-of-day precedes the later ones.
    const titles = Array.from(document.querySelectorAll(".rm-log-item .rm-log-title")).map(
      (el) => el.textContent ?? ""
    );
    const idxIntakeRecon = titles.findIndex((t) => /Log lens intake\/reconciliation/i.test(t));
    const idxImplemented = titles.findIndex((t) => /Log lens implemented/i.test(t));
    const idxCorrected = titles.findIndex((t) => /Log lens .*corrected/i.test(t));
    expect(idxIntakeRecon).toBeGreaterThanOrEqual(0);
    expect(idxIntakeRecon).toBeLessThan(idxImplemented);
    expect(idxImplemented).toBeLessThan(idxCorrected);
  });

  it("selects the newest event by default and shows it in the detail pane", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // First (newest) row is selected by default.
    const items = document.querySelectorAll(".rm-log-item");
    expect(items[0].getAttribute("aria-selected")).toBe("true");
    // Detail pane shows the event's fields (Event date / Event kind / Source headings).
    const detail = document.querySelector(".rm-detail-pane") as HTMLElement;
    expect(within(detail).getByText("Event date")).toBeTruthy();
    expect(within(detail).getByText("Event kind")).toBeTruthy();
    expect(within(detail).getByText("Governed state")).toBeTruthy();
    expect(within(detail).getByText("Source")).toBeTruthy();
  });

  it("clicking a Log row changes selection and updates the detail pane", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    const items = Array.from(document.querySelectorAll(".rm-log-item"));
    // Click a later row (not the default newest one).
    const target = items[5];
    fireEvent.click(target);
    expect(target.getAttribute("aria-selected")).toBe("true");
    expect(items[0].getAttribute("aria-selected")).toBe("false");
    // The detail pane reflects the clicked row's title.
    const clickedTitle = target.querySelector(".rm-log-title")?.textContent ?? "";
    const detail = document.querySelector(".rm-detail-pane") as HTMLElement;
    expect(within(detail).getByText(clickedTitle)).toBeTruthy();
  });

  it("detail pane reports intake establishment truthfully for the selected event", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // Select the DEF01 remediation record (establishes intake via '(intake)' date).
    const rows = Array.from(document.querySelectorAll(".rm-log-item"));
    const def = rows.find((r) => /PL-DEPLOY-02-DEF01/.test(r.textContent ?? "")) as HTMLElement;
    fireEvent.click(def);
    const detail = document.querySelector(".rm-detail-pane") as HTMLElement;
    expect(within(detail).getByText(/explicitly establishes the identity's original intake date/i)).toBeTruthy();
  });

  it("renders explicit event kinds (intake, reconciliation, refinement, implementation)", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    const kinds = Array.from(document.querySelectorAll(".rm-log-kind")).map((el) => el.textContent);
    expect(kinds).toContain("Intake");
    expect(kinds).toContain("Reconciliation");
    expect(kinds).toContain("Refinement");
  });

  it("shows the previously-dropped nested Log records (implementation event)", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // Both PL-ROADMAP-UI Log ### records now render (multiple PL-ROADMAP-UI rows).
    expect(screen.getAllByText("PL-ROADMAP-UI").length).toBeGreaterThan(1);
  });

  it("surfaces 'Intake date not recorded' as a NAMED identity list, not a bare count", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    expect(screen.getByText(/Intake date not recorded/i)).toBeTruthy();
    // The group names actual PL identities. PL-OPS-01 is a refinement with no
    // explicit intake evidence, so it must appear here.
    const unknownList = document.querySelector(".rm-log-unknown-ids") as HTMLElement;
    expect(unknownList).toBeTruthy();
    expect(within(unknownList).getAllByText("PL-OPS-01").length).toBeGreaterThan(0);
  });

  it("does NOT list an identity with explicit intake evidence as unknown", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // PL-ROADMAP-UI's reconciliation record states it created the identity, so it
    // is known-intake and must NOT appear in the unknown list.
    const unknownList = document.querySelector(".rm-log-unknown-ids") as HTMLElement;
    expect(within(unknownList).queryByText("PL-ROADMAP-UI")).toBeNull();
  });

  it("marks events that explicitly establish intake, independent of kind", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    // At least one 'establishes intake' flag renders (e.g. the DEF01 remediation
    // record whose date is marked '(intake)').
    expect(screen.getAllByText(/establishes intake/i).length).toBeGreaterThan(0);
  });

  it("uses honest wording: intake unknown unless explicitly established", () => {
    render(<RoadmapView />);
    fireEvent.click(screen.getByRole("tab", { name: "Log" }));
    expect(screen.getByText(/original intake date is unknown/i)).toBeTruthy();
    expect(screen.getByText(/Event classification does not establish intake/i)).toBeTruthy();
  });
});
