/**
 * Tests for MarketSessionPolicy — 6-state classification.
 *
 * All timestamps are verified against the 2026 calendar.
 * Tests cover all state transitions including early-close days.
 */

import { describe, it, expect } from "vitest";
import { MarketSessionPolicy, computeEffectiveObservedAt, isCanonicalEvidence } from "../../src/market-session/session-policy";
import { USMarketCalendar, CALENDAR_2026, ETF_OPTIONS_TRADIER_SANDBOX } from "../../src/market-session/trading-calendar";

const calendar = new USMarketCalendar(CALENDAR_2026, ETF_OPTIONS_TRADIER_SANDBOX);
const policy = new MarketSessionPolicy(calendar, ETF_OPTIONS_TRADIER_SANDBOX);

// Helper: create a UTC date from ET time on a given date
// offset: 4 for EDT, 5 for EST
function etToUtc(date: string, hours: number, minutes: number, offset: number): Date {
  return new Date(Date.UTC(
    parseInt(date.slice(0, 4)),
    parseInt(date.slice(5, 7)) - 1,
    parseInt(date.slice(8, 10)),
    hours + offset,
    minutes
  ));
}

describe("MarketSessionPolicy — state classification", () => {
  // --- Standard full-day (EDT, summer) ---
  // Monday 2026-07-13: standard trading day in EDT (UTC-4)

  it("Example A: Friday 2026-07-10, 4:30 PM ET → CLOSED_CANONICAL", () => {
    const now = etToUtc("2026-07-10", 16, 30, 4); // EDT
    const result = policy.classify(now);
    expect(result.state).toBe("CLOSED_CANONICAL");
    expect(result.canonicalSessionDate).toBe("2026-07-10");
    expect(result.currentTradingSessionDate).toBe("2026-07-10");
    expect(result.acceptingCanonicalEvidence).toBe(false);
    expect(result.priorSessionOperationallyValid).toBe(false);
  });

  it("Example B: Saturday 2026-07-11, 9:00 AM ET → NON_TRADING_DAY", () => {
    const now = etToUtc("2026-07-11", 9, 0, 4); // EDT
    const result = policy.classify(now);
    expect(result.state).toBe("NON_TRADING_DAY");
    expect(result.canonicalSessionDate).toBe("2026-07-10"); // Friday
    expect(result.currentTradingSessionDate).toBeNull();
    expect(result.acceptingCanonicalEvidence).toBe(false);
    expect(result.priorSessionOperationallyValid).toBe(true);
  });

  it("Example C: Sunday 2026-07-12, 7:00 PM ET → NON_TRADING_DAY", () => {
    const now = etToUtc("2026-07-12", 19, 0, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("NON_TRADING_DAY");
    expect(result.canonicalSessionDate).toBe("2026-07-10"); // Friday
    expect(result.priorSessionOperationallyValid).toBe(true);
  });

  it("Example D: Monday 2026-07-13, 9:00 AM ET → PREMARKET", () => {
    const now = etToUtc("2026-07-13", 9, 0, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("PREMARKET");
    expect(result.canonicalSessionDate).toBe("2026-07-10"); // Friday (prior session)
    expect(result.currentTradingSessionDate).toBe("2026-07-13");
    expect(result.acceptingCanonicalEvidence).toBe(false);
    expect(result.priorSessionOperationallyValid).toBe(true);
  });

  it("Example E: Monday 2026-07-13, 9:35 AM ET → REGULAR_OPEN_DELAY", () => {
    const now = etToUtc("2026-07-13", 9, 35, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("REGULAR_OPEN_DELAY");
    expect(result.canonicalSessionDate).toBe("2026-07-10"); // prior session still canonical
    expect(result.currentTradingSessionDate).toBe("2026-07-13");
    expect(result.acceptingCanonicalEvidence).toBe(false);
    expect(result.priorSessionOperationallyValid).toBe(true);
  });

  it("Example F: Monday 2026-07-13, 9:50 AM ET → REGULAR_OBSERVATION", () => {
    const now = etToUtc("2026-07-13", 9, 50, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("REGULAR_OBSERVATION");
    expect(result.canonicalSessionDate).toBe("2026-07-13"); // today is now canonical
    expect(result.currentTradingSessionDate).toBe("2026-07-13");
    expect(result.acceptingCanonicalEvidence).toBe(true);
    expect(result.priorSessionOperationallyValid).toBe(false);
  });

  it("Example G: Monday 2026-07-13, 4:05 PM ET → DELAY_DRAIN", () => {
    const now = etToUtc("2026-07-13", 16, 5, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("DELAY_DRAIN");
    expect(result.canonicalSessionDate).toBe("2026-07-13");
    expect(result.acceptingCanonicalEvidence).toBe(true);
  });

  it("Example H: Monday 2026-07-13, 4:20 PM ET → CLOSED_CANONICAL", () => {
    const now = etToUtc("2026-07-13", 16, 20, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("CLOSED_CANONICAL");
    expect(result.canonicalSessionDate).toBe("2026-07-13");
    expect(result.acceptingCanonicalEvidence).toBe(false);
  });

  // --- Holiday ---

  it("Example I: Friday 2026-07-03 (Independence Day observed), 10 AM ET → NON_TRADING_DAY", () => {
    const now = etToUtc("2026-07-03", 10, 0, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("NON_TRADING_DAY");
    expect(result.canonicalSessionDate).toBe("2026-07-02"); // Thursday
    expect(result.currentTradingSessionDate).toBeNull();
  });

  it("Example J: Monday 2026-07-06 (after holiday weekend), 9:00 AM ET → PREMARKET", () => {
    const now = etToUtc("2026-07-06", 9, 0, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("PREMARKET");
    expect(result.canonicalSessionDate).toBe("2026-07-02"); // Thursday (last trading day)
    expect(result.currentTradingSessionDate).toBe("2026-07-06");
  });

  // --- Early-close day: Friday Nov 27 2026 (options close 1:15 PM ET, in EST) ---

  it("Example K: Nov 27, 11:00 AM ET → REGULAR_OBSERVATION", () => {
    const now = etToUtc("2026-11-27", 11, 0, 5); // EST
    const result = policy.classify(now);
    expect(result.state).toBe("REGULAR_OBSERVATION");
    expect(result.canonicalSessionDate).toBe("2026-11-27");
    expect(result.acceptingCanonicalEvidence).toBe(true);
  });

  it("Example L: Nov 27, 1:20 PM ET → DELAY_DRAIN (options closed at 1:15, drain window)", () => {
    const now = etToUtc("2026-11-27", 13, 20, 5); // EST
    const result = policy.classify(now);
    expect(result.state).toBe("DELAY_DRAIN");
    expect(result.canonicalSessionDate).toBe("2026-11-27");
    expect(result.acceptingCanonicalEvidence).toBe(true);
  });

  it("Example M: Nov 27, 1:35 PM ET → CLOSED_CANONICAL (past close + 15min delay)", () => {
    const now = etToUtc("2026-11-27", 13, 35, 5); // EST
    const result = policy.classify(now);
    expect(result.state).toBe("CLOSED_CANONICAL");
    expect(result.canonicalSessionDate).toBe("2026-11-27");
    expect(result.acceptingCanonicalEvidence).toBe(false);
  });

  // --- Early-close day: Thursday Dec 24 2026 (options close 1:15 PM ET, EST) ---

  it("Dec 24, 12:00 PM ET → REGULAR_OBSERVATION", () => {
    const now = etToUtc("2026-12-24", 12, 0, 5);
    const result = policy.classify(now);
    expect(result.state).toBe("REGULAR_OBSERVATION");
    expect(result.acceptingCanonicalEvidence).toBe(true);
  });

  it("Dec 24, 1:20 PM ET → DELAY_DRAIN", () => {
    const now = etToUtc("2026-12-24", 13, 20, 5);
    const result = policy.classify(now);
    expect(result.state).toBe("DELAY_DRAIN");
  });

  it("Dec 24, 1:35 PM ET → CLOSED_CANONICAL", () => {
    const now = etToUtc("2026-12-24", 13, 35, 5);
    const result = policy.classify(now);
    expect(result.state).toBe("CLOSED_CANONICAL");
    expect(result.acceptingCanonicalEvidence).toBe(false);
  });

  // --- Boundary precision ---

  it("exactly at session open → REGULAR_OPEN_DELAY (not PREMARKET)", () => {
    const now = etToUtc("2026-07-14", 9, 30, 4); // exactly open
    const result = policy.classify(now);
    expect(result.state).toBe("REGULAR_OPEN_DELAY");
  });

  it("exactly at open + 15min → REGULAR_OBSERVATION", () => {
    const now = etToUtc("2026-07-14", 9, 45, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("REGULAR_OBSERVATION");
  });

  it("exactly at session close → DELAY_DRAIN (not REGULAR_OBSERVATION)", () => {
    const now = etToUtc("2026-07-14", 16, 0, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("DELAY_DRAIN");
  });

  it("exactly at close + 15min → CLOSED_CANONICAL", () => {
    const now = etToUtc("2026-07-14", 16, 15, 4);
    const result = policy.classify(now);
    expect(result.state).toBe("CLOSED_CANONICAL");
  });
});

// --- effectiveObservedAt ---

describe("computeEffectiveObservedAt", () => {
  it("subtracts provider delay from retrievedAt when no observedAt provided", () => {
    const retrieved = new Date("2026-07-13T17:50:00Z"); // 1:50 PM ET
    const result = computeEffectiveObservedAt(retrieved, null, 15 * 60 * 1000);
    // 17:50 - 15min = 17:35 UTC = 1:35 PM ET
    expect(result.getTime()).toBe(new Date("2026-07-13T17:35:00Z").getTime());
  });

  it("uses provider observedAt when available", () => {
    const retrieved = new Date("2026-07-13T17:50:00Z");
    const observed = new Date("2026-07-13T17:33:00Z");
    const result = computeEffectiveObservedAt(retrieved, observed, 15 * 60 * 1000);
    expect(result.getTime()).toBe(observed.getTime());
  });
});

// --- isCanonicalEvidence ---

describe("isCanonicalEvidence", () => {
  const sessionOpen = new Date("2026-07-13T13:30:00Z");  // 9:30 AM ET (EDT)
  const sessionClose = new Date("2026-07-13T20:00:00Z"); // 4:00 PM ET (EDT)

  it("evidence within session is canonical", () => {
    const observed = new Date("2026-07-13T15:00:00Z"); // 11:00 AM ET
    expect(isCanonicalEvidence(observed, sessionOpen, sessionClose)).toBe(true);
  });

  it("evidence before session open is not canonical", () => {
    const observed = new Date("2026-07-13T13:20:00Z"); // 9:20 AM ET
    expect(isCanonicalEvidence(observed, sessionOpen, sessionClose)).toBe(false);
  });

  it("evidence after session close is not canonical", () => {
    const observed = new Date("2026-07-13T20:05:00Z"); // 4:05 PM ET
    expect(isCanonicalEvidence(observed, sessionOpen, sessionClose)).toBe(false);
  });

  it("evidence exactly at open is canonical", () => {
    expect(isCanonicalEvidence(sessionOpen, sessionOpen, sessionClose)).toBe(true);
  });

  it("evidence exactly at close is canonical", () => {
    expect(isCanonicalEvidence(sessionClose, sessionOpen, sessionClose)).toBe(true);
  });
});

// --- shouldAcceptAsCanonical ---

describe("MarketSessionPolicy — shouldAcceptAsCanonical", () => {
  it("retrieval during REGULAR_OBSERVATION with valid effectiveObservedAt → accept", () => {
    // 9:50 AM ET on Mon Jul 13 → effectiveObserved = 9:35 AM ET ≥ 9:30 open → canonical
    const retrieved = etToUtc("2026-07-13", 9, 50, 4);
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(true);
  });

  it("retrieval during REGULAR_OPEN_DELAY → reject (effectiveObservedAt before open)", () => {
    // 9:35 AM ET → effectiveObserved = 9:20 AM ET < 9:30 open → not canonical
    const retrieved = etToUtc("2026-07-13", 9, 35, 4);
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(false);
  });

  it("retrieval during DELAY_DRAIN with valid effectiveObservedAt → accept", () => {
    // 4:05 PM ET → effectiveObserved = 3:50 PM ET < 4:00 close → canonical
    const retrieved = etToUtc("2026-07-13", 16, 5, 4);
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(true);
  });

  it("retrieval during CLOSED_CANONICAL → reject", () => {
    // 4:20 PM ET → effectiveObserved = 4:05 PM ET > 4:00 close → not canonical
    const retrieved = etToUtc("2026-07-13", 16, 20, 4);
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(false);
  });

  it("retrieval on weekend → reject", () => {
    const retrieved = etToUtc("2026-07-11", 10, 0, 4); // Saturday
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(false);
  });

  it("early-close day: retrieval at 1:20 PM ET → accept (drain window, effectiveObs = 1:05 PM < 1:15 close)", () => {
    const retrieved = etToUtc("2026-11-27", 13, 20, 5); // EST
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(true);
  });

  it("early-close day: retrieval at 1:35 PM ET → reject (past drain, effectiveObs = 1:20 PM > 1:15 close)", () => {
    const retrieved = etToUtc("2026-11-27", 13, 35, 5);
    expect(policy.shouldAcceptAsCanonical(retrieved)).toBe(false);
  });
});
