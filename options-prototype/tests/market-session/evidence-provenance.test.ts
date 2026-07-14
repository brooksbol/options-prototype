/**
 * Tests for evidence provenance and canonical write gating.
 */

import { describe, it, expect } from "vitest";
import {
  buildEvidenceProvenance,
  shouldWriteCanonical,
  classifyResourceSensitivity,
  type EvidenceProvenance,
} from "../../src/market-session/evidence-provenance";
import { MarketSessionPolicy } from "../../src/market-session/session-policy";
import { USMarketCalendar, CALENDAR_2026, ETF_OPTIONS_TRADIER_SANDBOX } from "../../src/market-session/trading-calendar";

const calendar = new USMarketCalendar(CALENDAR_2026, ETF_OPTIONS_TRADIER_SANDBOX);
const policy = new MarketSessionPolicy(calendar, ETF_OPTIONS_TRADIER_SANDBOX);

// Helper: create UTC from ET time
function etToUtc(date: string, hours: number, minutes: number, offset: number): Date {
  return new Date(Date.UTC(
    parseInt(date.slice(0, 4)),
    parseInt(date.slice(5, 7)) - 1,
    parseInt(date.slice(8, 10)),
    hours + offset,
    minutes
  ));
}

// --- Resource Classification ---

describe("classifyResourceSensitivity", () => {
  it("chains are session-sensitive", () => {
    expect(classifyResourceSensitivity("chain")).toBe("session_sensitive");
  });

  it("quotes are session-sensitive", () => {
    expect(classifyResourceSensitivity("quote")).toBe("session_sensitive");
  });

  it("expirations are not session-sensitive", () => {
    expect(classifyResourceSensitivity("expirations")).toBe("non_session_sensitive");
  });

  it("metadata is not session-sensitive", () => {
    expect(classifyResourceSensitivity("metadata")).toBe("non_session_sensitive");
  });

  it("absence is not session-sensitive", () => {
    expect(classifyResourceSensitivity("absence")).toBe("non_session_sensitive");
  });
});

// --- buildEvidenceProvenance ---

describe("buildEvidenceProvenance", () => {
  it("chain during REGULAR_OBSERVATION: canonical", () => {
    // Mon Jul 13 2026, 10:00 AM ET (EDT, UTC-4) → effectiveObs = 9:45 AM ET ≥ 9:30 open
    const retrieved = etToUtc("2026-07-13", 10, 0, 4);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(true);
    expect(prov.evidenceSessionDate).toBe("2026-07-13");
    expect(prov.retrievalSessionState).toBe("REGULAR_OBSERVATION");
  });

  it("chain during REGULAR_OPEN_DELAY: not canonical", () => {
    // Mon Jul 13, 9:35 AM ET → effectiveObs = 9:20 AM < 9:30 open
    const retrieved = etToUtc("2026-07-13", 9, 35, 4);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(false);
    expect(prov.retrievalSessionState).toBe("REGULAR_OPEN_DELAY");
  });

  it("chain during DELAY_DRAIN: canonical (effectiveObs still within session)", () => {
    // Mon Jul 13, 4:05 PM ET → effectiveObs = 3:50 PM ET < 4:00 close
    const retrieved = etToUtc("2026-07-13", 16, 5, 4);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(true);
    expect(prov.evidenceSessionDate).toBe("2026-07-13");
    expect(prov.retrievalSessionState).toBe("DELAY_DRAIN");
  });

  it("chain during CLOSED_CANONICAL: not canonical", () => {
    // Mon Jul 13, 4:20 PM ET → effectiveObs = 4:05 PM > 4:00 close
    const retrieved = etToUtc("2026-07-13", 16, 20, 4);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(false);
    expect(prov.retrievalSessionState).toBe("CLOSED_CANONICAL");
  });

  it("chain on weekend: not canonical", () => {
    const retrieved = etToUtc("2026-07-11", 10, 0, 4); // Saturday
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(false);
    expect(prov.retrievalSessionState).toBe("NON_TRADING_DAY");
    expect(prov.evidenceSessionDate).toBe("2026-07-10"); // Friday canonical
  });

  it("expirations on weekend: canonical (non-session-sensitive)", () => {
    const retrieved = etToUtc("2026-07-11", 10, 0, 4); // Saturday
    const prov = buildEvidenceProvenance(retrieved, null, "expirations", policy, calendar);

    expect(prov.isCanonical).toBe(true); // structural data always canonical
    expect(prov.retrievalSessionState).toBe("NON_TRADING_DAY");
  });

  it("expirations during PREMARKET: canonical (non-session-sensitive)", () => {
    const retrieved = etToUtc("2026-07-13", 9, 0, 4);
    const prov = buildEvidenceProvenance(retrieved, null, "expirations", policy, calendar);

    expect(prov.isCanonical).toBe(true);
  });

  it("chain on early-close day during drain: canonical", () => {
    // Nov 27, 1:20 PM ET (EST) → effectiveObs = 1:05 PM < 1:15 close
    const retrieved = etToUtc("2026-11-27", 13, 20, 5);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(true);
    expect(prov.evidenceSessionDate).toBe("2026-11-27");
  });

  it("chain on early-close day after drain: not canonical", () => {
    // Nov 27, 1:35 PM ET (EST) → effectiveObs = 1:20 PM > 1:15 close
    const retrieved = etToUtc("2026-11-27", 13, 35, 5);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.isCanonical).toBe(false);
  });

  it("records providerDelayMs and profileId", () => {
    const retrieved = etToUtc("2026-07-13", 10, 0, 4);
    const prov = buildEvidenceProvenance(retrieved, null, "chain", policy, calendar);

    expect(prov.providerDelayMs).toBe(15 * 60 * 1000);
    expect(prov.profileId).toBe("standard-etf-options-tradier-sandbox-v1");
  });
});

// --- shouldWriteCanonical ---

describe("shouldWriteCanonical", () => {
  const canonicalProv: EvidenceProvenance = {
    retrievedAt: "2026-07-13T14:00:00Z",
    effectiveObservedAt: "2026-07-13T13:45:00Z",
    evidenceSessionDate: "2026-07-13",
    retrievalSessionState: "REGULAR_OBSERVATION",
    isCanonical: true,
    providerDelayMs: 900000,
    profileId: "standard-etf-options-tradier-sandbox-v1",
  };

  it("non-session-sensitive data: always writable", () => {
    const newProv: EvidenceProvenance = { ...canonicalProv, isCanonical: false };
    expect(shouldWriteCanonical(newProv, null, "expirations")).toBe(true);
  });

  it("session-sensitive, canonical=true, no existing: write", () => {
    expect(shouldWriteCanonical(canonicalProv, null, "chain")).toBe(true);
  });

  it("session-sensitive, canonical=false: do NOT write", () => {
    const nonCanonical: EvidenceProvenance = { ...canonicalProv, isCanonical: false };
    expect(shouldWriteCanonical(nonCanonical, null, "chain")).toBe(false);
  });

  it("existing canonical for same session, new has later effectiveObservedAt: overwrite", () => {
    const newer: EvidenceProvenance = {
      ...canonicalProv,
      effectiveObservedAt: "2026-07-13T15:00:00Z", // later observation
    };
    expect(shouldWriteCanonical(newer, canonicalProv, "chain")).toBe(true);
  });

  it("existing canonical for same session, new has earlier effectiveObservedAt: do NOT overwrite", () => {
    const older: EvidenceProvenance = {
      ...canonicalProv,
      effectiveObservedAt: "2026-07-13T12:00:00Z", // earlier observation
    };
    expect(shouldWriteCanonical(older, canonicalProv, "chain")).toBe(false);
  });

  it("existing is from a different session: overwrite", () => {
    const fridayProv: EvidenceProvenance = { ...canonicalProv, evidenceSessionDate: "2026-07-10" };
    const mondayProv: EvidenceProvenance = { ...canonicalProv, evidenceSessionDate: "2026-07-13" };
    expect(shouldWriteCanonical(mondayProv, fridayProv, "chain")).toBe(true);
  });

  it("existing is not canonical: overwrite with canonical", () => {
    const nonCanonicalExisting: EvidenceProvenance = { ...canonicalProv, isCanonical: false };
    expect(shouldWriteCanonical(canonicalProv, nonCanonicalExisting, "chain")).toBe(true);
  });

  it("after-hours chain must not overwrite regular-session canonical", () => {
    // Existing: canonical from 3:50 PM regular session
    const existing: EvidenceProvenance = {
      ...canonicalProv,
      effectiveObservedAt: "2026-07-13T19:50:00Z", // 3:50 PM ET in UTC (EDT)
    };
    // New: after-hours retrieval → not canonical
    const afterHours: EvidenceProvenance = {
      ...canonicalProv,
      isCanonical: false,
      effectiveObservedAt: "2026-07-13T20:30:00Z",
    };
    expect(shouldWriteCanonical(afterHours, existing, "chain")).toBe(false);
  });
});
