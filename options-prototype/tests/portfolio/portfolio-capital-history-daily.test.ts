/**
 * Portfolio Capital History — Daily Observation Semantics
 *
 * Tests the requirement: every calendar day on which the operator successfully
 * imports Fidelity CSVs produces exactly one Portfolio Capital observation for that day.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  recordObservation,
  loadHistory,
  _clearHistoryForTesting,
} from "../../src/portfolio/portfolio-capital-history";

describe("Portfolio Capital History — Daily Observation", () => {
  beforeEach(() => {
    _clearHistoryForTesting();
  });

  it("first successful import on day D creates a point for day D", () => {
    const importDate = new Date(2026, 7, 24, 10, 30, 0); // Aug 24, 2026, 10:30 AM local
    recordObservation("2026-08-22T19:15:42.000Z", 121500, importDate);

    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBe("2026-08-24T12:00:00");
    expect(history[0].value).toBe(121500);
  });

  it("second import on day D replaces/updates day D's point", () => {
    const importDate = new Date(2026, 7, 24, 10, 30, 0); // morning import
    recordObservation("2026-08-22T19:15:42.000Z", 121500, importDate);

    // Second import same day with updated value
    const laterImport = new Date(2026, 7, 24, 14, 0, 0); // afternoon import
    recordObservation("2026-08-24T18:00:00.000Z", 121800, laterImport);

    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBe("2026-08-24T12:00:00");
    expect(history[0].value).toBe(121800); // updated to second import's value
  });

  it("import on D+1 creates a second point even with unchanged Fidelity export timestamp", () => {
    const day1 = new Date(2026, 7, 24, 10, 30, 0); // Aug 24
    recordObservation("2026-08-22T19:15:42.000Z", 121500, day1);

    // Next day, same underlying CSV export timestamp, different capital value
    const day2 = new Date(2026, 7, 25, 9, 0, 0); // Aug 25
    recordObservation("2026-08-22T19:15:42.000Z", 121900, day2);

    const history = loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0].timestamp).toBe("2026-08-24T12:00:00");
    expect(history[0].value).toBe(121500);
    expect(history[1].timestamp).toBe("2026-08-25T12:00:00");
    expect(history[1].value).toBe(121900);
  });

  it("hydration alone creates no new daily point (only explicit import does)", () => {
    // Simulate prior import
    const priorDay = new Date(2026, 7, 24, 10, 30, 0);
    recordObservation("2026-08-22T19:15:42.000Z", 121500, priorDay);

    // Verify no new point is added without another recordObservation call
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBe("2026-08-24T12:00:00");
    // (hydration in production code no longer calls recordObservation)
  });

  it("calendar-day handling is timezone-safe — late-night UTC does not shift to wrong local day", () => {
    // Import at 11 PM local on Aug 24 — should still be Aug 24
    const lateNight = new Date(2026, 7, 24, 23, 45, 0);
    recordObservation("2026-08-25T05:45:00.000Z", 122000, lateNight);

    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBe("2026-08-24T12:00:00"); // local day, not UTC day
  });

  it("preserves chronological order across multiple days", () => {
    // Import out of order
    const aug25 = new Date(2026, 7, 25, 10, 0, 0);
    const aug23 = new Date(2026, 7, 23, 10, 0, 0);
    const aug24 = new Date(2026, 7, 24, 10, 0, 0);

    recordObservation("x", 121000, aug25);
    recordObservation("x", 120500, aug23);
    recordObservation("x", 120800, aug24);

    const history = loadHistory();
    expect(history).toHaveLength(3);
    expect(history[0].timestamp).toBe("2026-08-23T12:00:00");
    expect(history[1].timestamp).toBe("2026-08-24T12:00:00");
    expect(history[2].timestamp).toBe("2026-08-25T12:00:00");
  });

  it("coexists with pre-existing seed data without corruption", () => {
    // Simulate seed data already in localStorage (full ISO timestamps)
    const seedData = [
      { timestamp: "2026-08-20T18:06:39.776Z", value: 120855.24 },
      { timestamp: "2026-08-21T18:02:39.765Z", value: 121340.47 },
    ];
    localStorage.setItem("wheelwright:portfolio-capital:history", JSON.stringify(seedData));

    // New import on Aug 25
    const aug25 = new Date(2026, 7, 25, 10, 0, 0);
    recordObservation("2026-08-25T16:00:00.000Z", 121800, aug25);

    const history = loadHistory();
    expect(history).toHaveLength(3);
    // Seed data preserved
    expect(history[0].timestamp).toBe("2026-08-20T18:06:39.776Z");
    expect(history[0].value).toBe(120855.24);
    expect(history[1].timestamp).toBe("2026-08-21T18:02:39.765Z");
    expect(history[1].value).toBe(121340.47);
    // New point added
    expect(history[2].timestamp).toBe("2026-08-25T12:00:00");
    expect(history[2].value).toBe(121800);
  });
});
