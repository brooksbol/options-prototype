/**
 * MarketSessionPolicy — 6-state classification of the current market temporal state.
 *
 * States:
 *   PREMARKET            — Trading day, before regular open
 *   REGULAR_OPEN_DELAY   — Market open, but delayed feed hasn't delivered regular-session observations yet
 *   REGULAR_OBSERVATION  — Delayed data represents regular-session market state
 *   DELAY_DRAIN          — Exchange closed, final regular-session observations still arriving via delay
 *   CLOSED_CANONICAL     — Canonical snapshot sealed; no new regular evidence accepted
 *   NON_TRADING_DAY      — Weekend or holiday; no session active
 *
 * Authoritative basis:
 * - Tradier sandbox data is delayed approximately 15 minutes
 * - Canonical acceptance is based on effectiveObservedAt falling inside the configured product session
 * - Retrieval time alone is not sufficient for canonical determination
 * - Post-session retrievals must not overwrite trustworthy regular-session canonical records
 */

import { type TradingCalendar, type MarketSessionProfile, getTradingCalendar, ETF_OPTIONS_TRADIER_SANDBOX } from "./trading-calendar";

// --- Types ---

export type MarketSessionState =
  | "PREMARKET"
  | "REGULAR_OPEN_DELAY"
  | "REGULAR_OBSERVATION"
  | "DELAY_DRAIN"
  | "CLOSED_CANONICAL"
  | "NON_TRADING_DAY";

export interface MarketSessionClassification {
  /** Current state */
  state: MarketSessionState;

  /** The trading session date whose evidence is currently canonical */
  canonicalSessionDate: string;

  /** Today's trading date (null if today is not a trading day) */
  currentTradingSessionDate: string | null;

  /** Whether the system should accept new provider evidence as current-session canonical */
  acceptingCanonicalEvidence: boolean;

  /** Whether prior-session canonical evidence remains operationally valid
      (true when no current-session evidence has been accepted yet) */
  priorSessionOperationallyValid: boolean;

  /** The session profile used for this classification */
  profileId: string;
}

// --- effectiveObservedAt ---

/**
 * Compute the effective observation time for a provider response.
 *
 * For delayed providers (e.g., Tradier sandbox 15 min):
 *   effectiveObservedAt = retrievedAt - providerDelayMs
 *
 * If the provider supplies an explicit observedAt, use that instead.
 */
export function computeEffectiveObservedAt(
  retrievedAt: Date,
  providerObservedAt: Date | null,
  providerDelayMs: number
): Date {
  if (providerObservedAt) return providerObservedAt;
  return new Date(retrievedAt.getTime() - providerDelayMs);
}

/**
 * Determine whether an evidence response should be accepted as canonical
 * for the given trading session.
 *
 * Rule: effectiveObservedAt must fall within [sessionOpen, sessionClose]
 */
export function isCanonicalEvidence(
  effectiveObservedAt: Date,
  sessionOpen: Date,
  sessionClose: Date
): boolean {
  return effectiveObservedAt >= sessionOpen && effectiveObservedAt <= sessionClose;
}

// --- Session Classification ---

export class MarketSessionPolicy {
  private calendar: TradingCalendar;
  private profile: MarketSessionProfile;
  private providerDelayMs: number;

  constructor(
    calendar: TradingCalendar = getTradingCalendar(),
    profile: MarketSessionProfile = ETF_OPTIONS_TRADIER_SANDBOX
  ) {
    this.calendar = calendar;
    this.profile = profile;
    this.providerDelayMs = profile.providerDelayMinutes * 60 * 1000;
  }

  /**
   * Classify the market session state at a given moment.
   */
  classify(now: Date = new Date()): MarketSessionClassification {
    const todayDate = this.toDateString(now);

    // Is today a trading day?
    if (!this.calendar.isTradingDay(todayDate)) {
      // Non-trading day: canonical is from most recent completed session
      const canonicalDate = this.calendar.previousTradingDay(todayDate);
      return {
        state: "NON_TRADING_DAY",
        canonicalSessionDate: canonicalDate,
        currentTradingSessionDate: null,
        acceptingCanonicalEvidence: false,
        priorSessionOperationallyValid: true,
        profileId: this.profile.id,
      };
    }

    // Today is a trading day — determine which state we're in
    const sessionOpen = this.calendar.sessionOpen(todayDate);
    const sessionClose = this.calendar.sessionClose(todayDate);
    const openPlusDelay = new Date(sessionOpen.getTime() + this.providerDelayMs);
    const closePlusDelay = new Date(sessionClose.getTime() + this.providerDelayMs);

    const nowMs = now.getTime();

    if (nowMs < sessionOpen.getTime()) {
      // Before market open → PREMARKET
      const canonicalDate = this.calendar.previousTradingDay(todayDate);
      return {
        state: "PREMARKET",
        canonicalSessionDate: canonicalDate,
        currentTradingSessionDate: todayDate,
        acceptingCanonicalEvidence: false,
        priorSessionOperationallyValid: true,
        profileId: this.profile.id,
      };
    }

    if (nowMs < openPlusDelay.getTime()) {
      // Market open but delayed feed hasn't reached regular-session yet
      const canonicalDate = this.calendar.previousTradingDay(todayDate);
      return {
        state: "REGULAR_OPEN_DELAY",
        canonicalSessionDate: canonicalDate,
        currentTradingSessionDate: todayDate,
        acceptingCanonicalEvidence: false,
        priorSessionOperationallyValid: true,
        profileId: this.profile.id,
      };
    }

    if (nowMs < sessionClose.getTime()) {
      // Delayed feed is delivering regular-session observations
      return {
        state: "REGULAR_OBSERVATION",
        canonicalSessionDate: todayDate,
        currentTradingSessionDate: todayDate,
        acceptingCanonicalEvidence: true,
        priorSessionOperationallyValid: false,
        profileId: this.profile.id,
      };
    }

    if (nowMs < closePlusDelay.getTime()) {
      // Exchange closed, but delayed feed still draining final regular-session observations
      return {
        state: "DELAY_DRAIN",
        canonicalSessionDate: todayDate,
        currentTradingSessionDate: todayDate,
        acceptingCanonicalEvidence: true,
        priorSessionOperationallyValid: false,
        profileId: this.profile.id,
      };
    }

    // Past close + delay → canonical snapshot sealed
    return {
      state: "CLOSED_CANONICAL",
      canonicalSessionDate: todayDate,
      currentTradingSessionDate: todayDate,
      acceptingCanonicalEvidence: false,
      priorSessionOperationallyValid: false,
      profileId: this.profile.id,
    };
  }

  /**
   * Determine whether a specific retrieval should be accepted as canonical.
   * Uses the effectiveObservedAt rule against the canonical session boundaries.
   */
  shouldAcceptAsCanonical(retrievedAt: Date, providerObservedAt: Date | null = null): boolean {
    const classification = this.classify(retrievedAt);

    // Only accept during REGULAR_OBSERVATION or DELAY_DRAIN
    if (!classification.acceptingCanonicalEvidence) return false;

    const sessionDate = classification.canonicalSessionDate;
    const sessionOpen = this.calendar.sessionOpen(sessionDate);
    const sessionClose = this.calendar.sessionClose(sessionDate);

    const effectiveObserved = computeEffectiveObservedAt(retrievedAt, providerObservedAt, this.providerDelayMs);
    return isCanonicalEvidence(effectiveObserved, sessionOpen, sessionClose);
  }

  /** Get the provider delay in milliseconds */
  get delayMs(): number {
    return this.providerDelayMs;
  }

  /** Get the profile */
  get sessionProfile(): MarketSessionProfile {
    return this.profile;
  }

  /** Convert a Date to ISO date string in exchange timezone (approximation using UTC) */
  private toDateString(date: Date): string {
    // Convert UTC timestamp to ET local date
    const etOffsetHours = this.getETOffsetForTimestamp(date);
    // offset is negative (e.g., -4 for EDT), so adding it gives local time
    const localMs = date.getTime() + (etOffsetHours * 60 * 60 * 1000);
    const local = new Date(localMs);
    return local.toISOString().split("T")[0];
  }

  /**
   * Determine ET offset for a given timestamp.
   * EDT (UTC-4): Mar 8 – Nov 1, 2026
   * EST (UTC-5): remainder
   */
  private getETOffsetForTimestamp(date: Date): number {
    const month = date.getUTCMonth() + 1; // 1-indexed
    const day = date.getUTCDate();

    if (month < 3) return -5;
    if (month > 11) return -5;
    if (month > 3 && month < 11) return -4;
    if (month === 3) return day >= 8 ? -4 : -5;
    if (month === 11) return day >= 1 ? -5 : -4;
    return -5;
  }
}

// --- Singleton ---

let policyInstance: MarketSessionPolicy | null = null;

export function getMarketSessionPolicy(): MarketSessionPolicy {
  if (!policyInstance) {
    policyInstance = new MarketSessionPolicy();
  }
  return policyInstance;
}
