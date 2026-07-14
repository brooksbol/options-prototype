/**
 * TradingCalendar — US equity/options market calendar for 2026.
 *
 * Determines trading days, holidays, early-close days, and session boundaries.
 * Used by MarketSessionPolicy to classify the current temporal state.
 *
 * Authoritative basis:
 * - NYSE/NASDAQ 2026 holiday schedule
 * - Eligible-options early close: 1:15 PM ET (not equity 1:00 PM ET)
 * - Standard session: 9:30 AM – 4:00 PM ET
 * - Early-close session: 9:30 AM – 1:15 PM ET (for option products)
 */

// --- Calendar Data (2026, versioned) ---

export interface CalendarYear {
  version: string;
  year: number;
  /** Full market holidays (exchange closed all day) */
  holidays: string[];
  /** Early-close dates (options close at 1:15 PM ET) */
  earlyCloseDates: string[];
}

export const CALENDAR_2026: CalendarYear = {
  version: "2026-v1",
  year: 2026,

  holidays: [
    "2026-01-01",  // New Year's Day (Thursday)
    "2026-01-19",  // Martin Luther King Jr. Day (Monday)
    "2026-02-16",  // Presidents' Day (Monday)
    "2026-04-03",  // Good Friday (Friday)
    "2026-05-25",  // Memorial Day (Monday)
    "2026-06-19",  // Juneteenth (Friday)
    "2026-07-03",  // Independence Day observed (Friday; Jul 4 is Saturday)
    "2026-09-07",  // Labor Day (Monday)
    "2026-11-26",  // Thanksgiving Day (Thursday)
    "2026-12-25",  // Christmas Day (Friday)
  ],

  earlyCloseDates: [
    "2026-11-27",  // Day after Thanksgiving (Friday)
    "2026-12-24",  // Christmas Eve (Thursday)
  ],
};

// --- Market Session Profile ---

export interface MarketSessionProfile {
  id: string;
  version: string;
  /** Exchange timezone for session boundary computation */
  exchangeTimezone: string;
  /** Regular session open (HH:MM in exchange timezone) */
  regularOpen: string;
  /** Standard full-day close for this product (HH:MM in exchange timezone) */
  standardClose: string;
  /** Early-close time for this product (HH:MM in exchange timezone) */
  earlyClose: string;
  /** Provider delay in minutes (e.g., 15 for Tradier sandbox) */
  providerDelayMinutes: number;
}

/**
 * Standard ETF options session profile for Tradier sandbox.
 *
 * Uses eligible-options close (1:15 PM ET) on early-close days,
 * not the equity-market close (1:00 PM ET).
 */
export const ETF_OPTIONS_TRADIER_SANDBOX: MarketSessionProfile = {
  id: "standard-etf-options-tradier-sandbox-v1",
  version: "v1",
  exchangeTimezone: "America/New_York",
  regularOpen: "09:30",
  standardClose: "16:00",
  earlyClose: "13:15",
  providerDelayMinutes: 15,
};

// --- TradingCalendar Interface ---

export interface TradingCalendar {
  /** Is this date a trading day? (not weekend, not holiday) */
  isTradingDay(date: string): boolean;
  /** The most recent trading day on or before this date (walks backward) */
  previousTradingDay(date: string): string;
  /** The next trading day after this date (walks forward) */
  nextTradingDay(date: string): string;
  /** Session open timestamp in exchange timezone for this trading day */
  sessionOpen(date: string): Date;
  /** Session close timestamp in exchange timezone for this trading day (product-appropriate) */
  sessionClose(date: string): Date;
  /** Whether this is an early-close day */
  isEarlyClose(date: string): boolean;
}

// --- Implementation ---

export class USMarketCalendar implements TradingCalendar {
  private profile: MarketSessionProfile;
  private holidaySet: Set<string>;
  private earlyCloseSet: Set<string>;

  constructor(
    calendarYear: CalendarYear = CALENDAR_2026,
    profile: MarketSessionProfile = ETF_OPTIONS_TRADIER_SANDBOX
  ) {
    this.profile = profile;
    this.holidaySet = new Set(calendarYear.holidays);
    this.earlyCloseSet = new Set(calendarYear.earlyCloseDates);
  }

  isTradingDay(date: string): boolean {
    // Weekend check
    const d = new Date(date + "T12:00:00");
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) return false;

    // Holiday check
    if (this.holidaySet.has(date)) return false;

    return true;
  }

  previousTradingDay(date: string): string {
    let current = date;
    for (let i = 0; i < 10; i++) { // safety limit
      current = this.addDays(current, -1);
      if (this.isTradingDay(current)) return current;
    }
    // Fallback (should not happen with reasonable calendar)
    return current;
  }

  nextTradingDay(date: string): string {
    let current = date;
    for (let i = 0; i < 10; i++) {
      current = this.addDays(current, 1);
      if (this.isTradingDay(current)) return current;
    }
    return current;
  }

  sessionOpen(date: string): Date {
    return this.timeOnDate(date, this.profile.regularOpen);
  }

  sessionClose(date: string): Date {
    const closeTime = this.isEarlyClose(date)
      ? this.profile.earlyClose
      : this.profile.standardClose;
    return this.timeOnDate(date, closeTime);
  }

  isEarlyClose(date: string): boolean {
    return this.earlyCloseSet.has(date);
  }

  // --- Helpers ---

  private addDays(date: string, days: number): string {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split("T")[0];
  }

  /**
   * Construct a Date for HH:MM on a given date in the exchange timezone.
   * Uses Intl to determine the UTC offset for America/New_York on that date.
   */
  private timeOnDate(date: string, hhmm: string): Date {
    const [hours, minutes] = hhmm.split(":").map(Number);
    const offset = this.getETOffset(date);
    const utcMs = Date.UTC(
      parseInt(date.slice(0, 4)),
      parseInt(date.slice(5, 7)) - 1,
      parseInt(date.slice(8, 10)),
      hours + offset,
      minutes
    );
    return new Date(utcMs);
  }

  /**
   * Get the UTC offset for America/New_York on a given date.
   * Returns hours ahead of UTC (e.g., -4 for EDT, -5 for EST).
   * We return the magnitude to subtract: 4 for EDT, 5 for EST.
   *
   * 2026 DST: begins Sun Mar 8, ends Sun Nov 1.
   */
  private getETOffset(date: string): number {
    const month = parseInt(date.slice(5, 7));
    const day = parseInt(date.slice(8, 10));

    // Simple determination for 2026:
    // EDT (UTC-4): Mar 8 through Nov 1
    // EST (UTC-5): Jan 1 – Mar 7, Nov 1 onward
    if (month < 3) return 5;           // Jan, Feb → EST
    if (month > 11) return 5;          // Dec → EST
    if (month > 3 && month < 11) return 4; // Apr–Oct → EDT
    if (month === 3) {
      // DST starts Sun Mar 8 at 2:00 AM
      return day >= 8 ? 4 : 5;
    }
    if (month === 11) {
      // DST ends Sun Nov 1 at 2:00 AM
      return day >= 1 ? 5 : 4;
    }
    return 5; // fallback EST
  }
}

// --- Singleton ---

let calendarInstance: USMarketCalendar | null = null;

export function getTradingCalendar(): USMarketCalendar {
  if (!calendarInstance) {
    calendarInstance = new USMarketCalendar();
  }
  return calendarInstance;
}
