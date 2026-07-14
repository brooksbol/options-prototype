/**
 * Tests for TradingCalendar — US market calendar for 2026.
 *
 * All date fixtures are verified against the 2026 calendar.
 * Weekday assertions confirm date correctness.
 */

import { describe, it, expect } from "vitest";
import { USMarketCalendar, CALENDAR_2026, ETF_OPTIONS_TRADIER_SANDBOX } from "../../src/market-session/trading-calendar";

const calendar = new USMarketCalendar(CALENDAR_2026, ETF_OPTIONS_TRADIER_SANDBOX);

// --- Helper: verify day of week ---
function assertDayOfWeek(date: string, expectedDay: string) {
  const d = new Date(date + "T12:00:00Z");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  expect(days[d.getUTCDay()]).toBe(expectedDay);
}

// --- Trading Day Classification ---

describe("TradingCalendar — isTradingDay", () => {
  it("normal Monday is a trading day", () => {
    assertDayOfWeek("2026-07-13", "Monday");
    expect(calendar.isTradingDay("2026-07-13")).toBe(true);
  });

  it("normal Tuesday is a trading day", () => {
    assertDayOfWeek("2026-07-14", "Tuesday");
    expect(calendar.isTradingDay("2026-07-14")).toBe(true);
  });

  it("normal Friday is a trading day", () => {
    assertDayOfWeek("2026-07-10", "Friday");
    expect(calendar.isTradingDay("2026-07-10")).toBe(true);
  });

  it("Saturday is not a trading day", () => {
    assertDayOfWeek("2026-07-11", "Saturday");
    expect(calendar.isTradingDay("2026-07-11")).toBe(false);
  });

  it("Sunday is not a trading day", () => {
    assertDayOfWeek("2026-07-12", "Sunday");
    expect(calendar.isTradingDay("2026-07-12")).toBe(false);
  });

  // --- Holidays ---

  it("New Year's Day 2026 (Thursday) is a holiday", () => {
    assertDayOfWeek("2026-01-01", "Thursday");
    expect(calendar.isTradingDay("2026-01-01")).toBe(false);
  });

  it("MLK Day 2026 (Monday) is a holiday", () => {
    assertDayOfWeek("2026-01-19", "Monday");
    expect(calendar.isTradingDay("2026-01-19")).toBe(false);
  });

  it("Presidents' Day 2026 (Monday) is a holiday", () => {
    assertDayOfWeek("2026-02-16", "Monday");
    expect(calendar.isTradingDay("2026-02-16")).toBe(false);
  });

  it("Good Friday 2026 (Friday) is a holiday", () => {
    assertDayOfWeek("2026-04-03", "Friday");
    expect(calendar.isTradingDay("2026-04-03")).toBe(false);
  });

  it("Memorial Day 2026 (Monday) is a holiday", () => {
    assertDayOfWeek("2026-05-25", "Monday");
    expect(calendar.isTradingDay("2026-05-25")).toBe(false);
  });

  it("Juneteenth 2026 (Friday) is a holiday", () => {
    assertDayOfWeek("2026-06-19", "Friday");
    expect(calendar.isTradingDay("2026-06-19")).toBe(false);
  });

  it("Independence Day observed 2026 (Friday Jul 3; Jul 4 is Saturday)", () => {
    assertDayOfWeek("2026-07-03", "Friday");
    expect(calendar.isTradingDay("2026-07-03")).toBe(false);
    // Jul 4 itself is Saturday — also not trading
    assertDayOfWeek("2026-07-04", "Saturday");
    expect(calendar.isTradingDay("2026-07-04")).toBe(false);
  });

  it("Labor Day 2026 (Monday) is a holiday", () => {
    assertDayOfWeek("2026-09-07", "Monday");
    expect(calendar.isTradingDay("2026-09-07")).toBe(false);
  });

  it("Thanksgiving 2026 (Thursday) is a holiday", () => {
    assertDayOfWeek("2026-11-26", "Thursday");
    expect(calendar.isTradingDay("2026-11-26")).toBe(false);
  });

  it("Christmas 2026 (Friday) is a holiday", () => {
    assertDayOfWeek("2026-12-25", "Friday");
    expect(calendar.isTradingDay("2026-12-25")).toBe(false);
  });

  // --- Early-close days ARE trading days ---

  it("day after Thanksgiving (Friday Nov 27) is a trading day (early close)", () => {
    assertDayOfWeek("2026-11-27", "Friday");
    expect(calendar.isTradingDay("2026-11-27")).toBe(true);
  });

  it("Christmas Eve 2026 (Thursday Dec 24) is a trading day (early close)", () => {
    assertDayOfWeek("2026-12-24", "Thursday");
    expect(calendar.isTradingDay("2026-12-24")).toBe(true);
  });

  // --- Adjacent to holidays ---

  it("day before Independence Day observed (Thu Jul 2) is a trading day", () => {
    assertDayOfWeek("2026-07-02", "Thursday");
    expect(calendar.isTradingDay("2026-07-02")).toBe(true);
  });

  it("Monday after Independence Day weekend (Mon Jul 6) is a trading day", () => {
    assertDayOfWeek("2026-07-06", "Monday");
    expect(calendar.isTradingDay("2026-07-06")).toBe(true);
  });

  it("Tuesday after Labor Day (Tue Sep 8) is a trading day", () => {
    assertDayOfWeek("2026-09-08", "Tuesday");
    expect(calendar.isTradingDay("2026-09-08")).toBe(true);
  });
});

// --- previousTradingDay ---

describe("TradingCalendar — previousTradingDay", () => {
  it("Saturday → previous Friday", () => {
    assertDayOfWeek("2026-07-11", "Saturday");
    expect(calendar.previousTradingDay("2026-07-11")).toBe("2026-07-10");
  });

  it("Sunday → previous Friday", () => {
    assertDayOfWeek("2026-07-12", "Sunday");
    expect(calendar.previousTradingDay("2026-07-12")).toBe("2026-07-10");
  });

  it("Monday → previous Friday", () => {
    assertDayOfWeek("2026-07-13", "Monday");
    expect(calendar.previousTradingDay("2026-07-13")).toBe("2026-07-10");
  });

  it("across holiday: Mon Jul 6 → previous trading day is Thu Jul 2 (Fri Jul 3 is holiday)", () => {
    assertDayOfWeek("2026-07-06", "Monday");
    expect(calendar.previousTradingDay("2026-07-06")).toBe("2026-07-02");
  });

  it("across Thanksgiving weekend: Mon Nov 30 → Wed Nov 25", () => {
    // Nov 26 Thu = holiday, Nov 27 Fri = early close (trading day), Nov 28 Sat, Nov 29 Sun
    assertDayOfWeek("2026-11-30", "Monday");
    expect(calendar.previousTradingDay("2026-11-30")).toBe("2026-11-27");
  });

  it("Thanksgiving day itself: Thu Nov 26 → Wed Nov 25", () => {
    expect(calendar.previousTradingDay("2026-11-26")).toBe("2026-11-25");
  });
});

// --- nextTradingDay ---

describe("TradingCalendar — nextTradingDay", () => {
  it("Friday → next Monday", () => {
    assertDayOfWeek("2026-07-10", "Friday");
    expect(calendar.nextTradingDay("2026-07-10")).toBe("2026-07-13");
  });

  it("across holiday: Thu Jul 2 → next trading day is Mon Jul 6", () => {
    assertDayOfWeek("2026-07-02", "Thursday");
    expect(calendar.nextTradingDay("2026-07-02")).toBe("2026-07-06");
  });
});

// --- Early Close ---

describe("TradingCalendar — isEarlyClose", () => {
  it("Nov 27 2026 is early close", () => {
    expect(calendar.isEarlyClose("2026-11-27")).toBe(true);
  });

  it("Dec 24 2026 is early close", () => {
    expect(calendar.isEarlyClose("2026-12-24")).toBe(true);
  });

  it("normal Friday is not early close", () => {
    expect(calendar.isEarlyClose("2026-07-10")).toBe(false);
  });
});

// --- Session Boundaries ---

describe("TradingCalendar — session boundaries", () => {
  it("standard day opens at 9:30 AM ET", () => {
    const open = calendar.sessionOpen("2026-07-13"); // Monday in EDT (UTC-4)
    expect(open.getUTCHours()).toBe(13); // 9:30 AM ET = 13:30 UTC in summer
    expect(open.getUTCMinutes()).toBe(30);
  });

  it("standard day closes at 4:00 PM ET", () => {
    const close = calendar.sessionClose("2026-07-13"); // Monday in EDT
    expect(close.getUTCHours()).toBe(20); // 4:00 PM ET = 20:00 UTC in summer
    expect(close.getUTCMinutes()).toBe(0);
  });

  it("early-close day (Nov 27) closes at 1:15 PM ET (eligible options)", () => {
    // Nov 27 is in EST (UTC-5) — DST ends Nov 1
    const close = calendar.sessionClose("2026-11-27");
    expect(close.getUTCHours()).toBe(18); // 1:15 PM ET = 18:15 UTC in winter
    expect(close.getUTCMinutes()).toBe(15);
  });

  it("early-close day (Dec 24) closes at 1:15 PM ET", () => {
    // Dec 24 is in EST (UTC-5)
    const close = calendar.sessionClose("2026-12-24");
    expect(close.getUTCHours()).toBe(18); // 1:15 PM ET = 18:15 UTC
    expect(close.getUTCMinutes()).toBe(15);
  });

  it("standard day in EST (Jan) opens at 9:30 AM ET = 14:30 UTC", () => {
    const open = calendar.sessionOpen("2026-01-02"); // Friday, EST
    expect(open.getUTCHours()).toBe(14);
    expect(open.getUTCMinutes()).toBe(30);
  });

  it("standard day in EST (Jan) closes at 4:00 PM ET = 21:00 UTC", () => {
    const close = calendar.sessionClose("2026-01-02");
    expect(close.getUTCHours()).toBe(21);
    expect(close.getUTCMinutes()).toBe(0);
  });
});
