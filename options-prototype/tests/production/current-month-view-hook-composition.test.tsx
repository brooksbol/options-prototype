/**
 * PL-PROD-EXPORT-01 trust correction — blocker #1 (hook ordering / TDZ).
 *
 * Renders the REAL CurrentMonthView far enough to exercise the actual hook composition
 * (summary, episodeChapters, handleDownloadCsv, outlook, prospective, effects). If
 * handleDownloadCsv's dependency array referenced episodeChapters before initialization,
 * the component would fail on mount — this test proves the page mounts and the export
 * callback closes over an initialized chapters binding.
 *
 * This is an integration-level test of the composition, NOT an isolated EpisodeLedger test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { CurrentMonthView } from "../../src/production/CurrentMonthView";
import type { ProductionAssessmentResponse } from "../../src/production/production-types";

function assessment(): ProductionAssessmentResponse {
  return {
    period: "2026-09",
    periodDescription: "September 2026",
    reconciliationStatus: "PRODUCTION_UNCERTAIN",
    reconciliationIssues: [],
    knownCashProduction: 1234.56,
    unresolvedPotentialProduction: 0,
    realizedCapitalErosion: 0,
    netStrategyResult: 2034.33,
    productionBreakdown: { OPTION_PREMIUM: 1234.56 },
    erosionEvents: [],
    transactionSummary: { included: 1, excluded: 0, uncertain: 0, notApplicable: 0 },
    transactions: [],
    dispositionResults: [],
  };
}

describe("CurrentMonthView hook composition (blocker #1: no TDZ / hook-order failure)", () => {
  beforeEach(() => {
    // Fresh portfolio/observation module stores; no activity CSV loaded.
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("mounts with a null assessment without throwing (real hook composition exercised)", () => {
    expect(() => render(<CurrentMonthView assessment={null} />)).not.toThrow();
  });

  it("mounts with an assessment and the Download Production CSV action invokes the export without error", () => {
    // Stub URL/anchor plumbing so the click path runs headlessly.
    const createURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const { getByLabelText } = render(<CurrentMonthView assessment={assessment()} />);
    const btn = getByLabelText("Download Production CSV");
    // If episodeChapters were in the TDZ when handleDownloadCsv was created, this would throw.
    expect(() => fireEvent.click(btn)).not.toThrow();
    expect(createURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeURL).toHaveBeenCalledTimes(1);
  });
});
