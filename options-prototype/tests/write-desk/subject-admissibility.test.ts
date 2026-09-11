/**
 * isSubjectAdmissible — Deployment CONSUMES the backend per-subject admissibility verdict,
 * with correct AUTHORITY PRECEDENCE (Issue #16; Codex re-review blockers 1 & 2).
 *
 * Rules proven here:
 *   - Authority pending (pre-/api/status) => fail closed; nothing eligible.
 *   - A backend verdict is checked BEFORE the sealed-session shortcut: admissible:false
 *     stays inadmissible even in a sealed session (no legacy override of authority).
 *   - Sealed-session validity is a FALLBACK, used only when no backend verdict exists.
 */
import { describe, it, expect } from "vitest";
import { isSubjectAdmissible } from "../../src/write-desk/subject-admissibility";
import type { CacheRecord, SubjectAdmissibility, DurableMarketCache } from "../../src/cache/durable-cache";

function cacheWithFreshness(freshness: "fresh" | "stale_usable" | "expired" | "missing") {
  return { freshness: () => freshness } as unknown as DurableMarketCache;
}

function chainRecord(admissibility?: SubjectAdmissibility, retrievedAt = 1_000): CacheRecord {
  return {
    key: "market:tradier:sandbox:chain:SPY:2026-09-18:v1",
    dataType: "chain",
    provider: "tradier",
    environment: "sandbox",
    symbol: "SPY",
    expiration: "2026-09-18",
    schemaVersion: "v1",
    retrievedAt,
    freshUntil: retrievedAt + 1,
    staleUntil: retrievedAt + 2,
    admissibility,
    payload: {},
  };
}

const FRESH = cacheWithFreshness("fresh");
const READY = { authorityPending: false, useSessionValidity: false, admissibilityBoundaryMs: null, cache: FRESH };

describe("isSubjectAdmissible — authority precedence (Issue #16)", () => {
  it("blocker 1: authority pending => nothing eligible, even a fresh admissible-looking record", () => {
    const rec = chainRecord({ admissible: true, basis: "real-time", canonicalSessionDate: "2026-09-10" });
    expect(isSubjectAdmissible(rec, { ...READY, authorityPending: true })).toBe(false);
  });

  it("blocker 1: authority pending => a record with NO verdict is not sealed-session eligible", () => {
    // The exact defect: fabricated closed session must not admit prior cached evidence.
    const rec = chainRecord(undefined);
    expect(isSubjectAdmissible(rec, {
      authorityPending: true, useSessionValidity: true, admissibilityBoundaryMs: null, cache: FRESH,
    })).toBe(false);
  });

  it("blocker 2: backend admissible:false OUTRANKS sealed-session validity", () => {
    const rec = chainRecord({ admissible: false, basis: "delayed", canonicalSessionDate: null });
    // Sealed session active, but the backend verdict is inadmissible → must stay inadmissible.
    expect(isSubjectAdmissible(rec, {
      authorityPending: false, useSessionValidity: true, admissibilityBoundaryMs: null,
      cache: cacheWithFreshness("expired"),
    })).toBe(false);
  });

  it("backend admissible:false is inadmissible in open sessions too (no boundary escape)", () => {
    const rec = chainRecord({ admissible: false, basis: "delayed", canonicalSessionDate: null });
    expect(isSubjectAdmissible(rec, { ...READY, admissibilityBoundaryMs: 0 })).toBe(false);
  });

  it("backend admissible:true (LIVE session, fresh) => eligible", () => {
    const rec = chainRecord({ admissible: true, basis: "real-time", canonicalSessionDate: "2026-09-10" });
    expect(isSubjectAdmissible(rec, READY)).toBe(true);
  });

  it("blocker 3: admissible:true in a LIVE session but expired live cache => NOT usable", () => {
    // In a live session, transport freshness still gates: expired live TTL is not usable.
    const rec = chainRecord({ admissible: true, basis: "real-time", canonicalSessionDate: "2026-09-10" });
    expect(isSubjectAdmissible(rec, { ...READY, cache: cacheWithFreshness("expired") })).toBe(false);
  });

  it("blocker 3 (REGRESSION): admissible:true + sealed session + EXPIRED live cache => ELIGIBLE", () => {
    // The precise regression: once the backend has authoritatively sealed this subject as
    // admissible for the sealed session, expiry of the LIVE-session transport TTL must NOT
    // invalidate it. This is the whole point of sealed evidence (Friday's close through the
    // weekend). Applying live-cache freshness here would destroy sealed-evidence semantics.
    const rec = chainRecord({ admissible: true, basis: "delayed", canonicalSessionDate: "2026-09-10" });
    expect(isSubjectAdmissible(rec, {
      authorityPending: false, useSessionValidity: true, admissibilityBoundaryMs: null,
      cache: cacheWithFreshness("expired"),
    })).toBe(true);
  });

  it("FALLBACK: sealed session with NO backend verdict => valid (legacy behavior preserved)", () => {
    const rec = chainRecord(undefined);
    expect(isSubjectAdmissible(rec, {
      authorityPending: false, useSessionValidity: true, admissibilityBoundaryMs: null,
      cache: cacheWithFreshness("expired"),
    })).toBe(true);
  });

  it("FALLBACK: no verdict, before backend-sourced boundary => rejected", () => {
    const rec = chainRecord(undefined, /*retrievedAt*/ 500);
    expect(isSubjectAdmissible(rec, { ...READY, admissibilityBoundaryMs: 1_000 })).toBe(false);
  });

  it("FALLBACK: no verdict, past boundary, fresh => eligible", () => {
    const rec = chainRecord(undefined, /*retrievedAt*/ 2_000);
    expect(isSubjectAdmissible(rec, { ...READY, admissibilityBoundaryMs: 1_000 })).toBe(true);
  });

  it("null record => not eligible", () => {
    expect(isSubjectAdmissible(null, READY)).toBe(false);
  });
});
