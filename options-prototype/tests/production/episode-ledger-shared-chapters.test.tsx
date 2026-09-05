/**
 * PL-PROD-EXPORT-01 trust correction #1 — single shared EpisodeChapter derivation.
 *
 * The EpisodeLedger no longer derives chapters itself; it renders the SAME collection its parent
 * (CurrentMonthView) derives once and also feeds to the CSV export. This test proves the ledger
 * consumes the supplied instance verbatim (it renders exactly the chapters given, and derives
 * nothing on its own — it has no activityRows/assessment inputs to derive from).
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EpisodeLedger } from "../../src/production/EpisodeLedger";
import type { EpisodeChapter } from "../../src/production/episode-derivation";

function chapter(overrides: Partial<EpisodeChapter>): EpisodeChapter {
  return {
    date: "2026-09-08", primitive: "CC", underlying: "BNO", strike: 54,
    whatHappened: "Called away · shares sold",
    productionLabel: "+$799.77 episode", productionAmount: 799.77,
    capitalLabel: "$5,099.89 net sale proceeds", capitalAmount: 5099.89,
    linkDate: "2026-09-01", linkDirection: "opened", state: "complete",
    episodeId: "-BNO260904C54", confidence: "deterministic",
    constituentEvents: [], rawSymbol: "-BNO260904C54", contracts: 2, conditionalLabel: null,
    ...overrides,
  };
}

describe("EpisodeLedger consumes the supplied chapter collection (single derivation)", () => {
  it("renders exactly the chapters passed in — no independent derivation", () => {
    const chapters = [
      chapter({ whatHappened: "Called away · shares sold", underlying: "BNO" }),
      chapter({ episodeId: "-XYZ260904C10", rawSymbol: "-XYZ260904C10", underlying: "XYZ", whatHappened: "Sold put" }),
    ];
    const { container } = render(<EpisodeLedger chapters={chapters} />);
    const rows = container.querySelectorAll("tr.ep-row");
    expect(rows.length).toBe(2); // exactly the supplied chapters, nothing derived/added
    expect(container.textContent).toContain("BNO");
    expect(container.textContent).toContain("XYZ");
  });

  it("renders nothing for an empty collection (no fallback derivation)", () => {
    const { container } = render(<EpisodeLedger chapters={[]} />);
    expect(container.querySelector("section.ep-ledger")).toBeNull();
  });
});
