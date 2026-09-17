/**
 * Adapter tests — buildShortObligationEvidence (the real evidence-assembly seam).
 *
 * Exercises the ACTUAL adapter (not only the pure evaluator), using a fake
 * DurableMarketCache, to prove the Codex-review corrections:
 *  - refusal-reason fidelity: missing record → missing-evidence; explicit backend
 *    admissible:false → backend-inadmissible; authority pending → authority-pending;
 *    present-but-unusable + no verdict → cache-unusable (Codex #7);
 *  - RAW greek path preserves provider exact 0 and null (§12 whole-vector), and
 *    does NOT apply the display sanitizer (Codex #6);
 *  - blended opening-credit attribution passes through (Codex #4);
 *  - §14a lifecycle-ambiguity wiring refuses on an exact-contract post-checkpoint
 *    resolution (Codex #1/#2);
 *  - read-only: the cache is never written.
 */
import { describe, it, expect } from "vitest";
import { buildShortObligationEvidence } from "../../src/write-desk/short-obligation-evidence";
import type { ShortObligation } from "../../src/write-desk/short-obligation-consequences";
import { evaluateShortObligationConsequences } from "../../src/write-desk/short-obligation-consequences";
import type { CacheRecord, CacheFreshness, SubjectAdmissibility } from "../../src/cache/durable-cache";
import { buildCacheKey } from "../../src/cache/durable-cache";
import type { MarketSessionClassification } from "../../src/market-session/session-policy";
import type { ActivityRow, ActivityEventType } from "../../src/csv/fidelity/activityParser";
import type { ParsedOptionContract } from "../../src/csv/fidelity/parseOptionContract";

const PUT: ShortObligation = { symbol: "XLF", side: "put", strike: 42, expiration: "2026-10-16", contracts: 1, dte: 21 };

const OPEN_SESSION = {
  state: "REGULAR_OBSERVATION",
  authorityPending: false,
  admissibilityBoundaryEpochMs: null,
} as unknown as MarketSessionClassification;

const PENDING_SESSION = {
  state: "CLOSED_CANONICAL",
  authorityPending: true,
  admissibilityBoundaryEpochMs: null,
} as unknown as MarketSessionClassification;

/** Minimal fake cache implementing only what the adapter uses (get + freshness). */
function fakeCache(records: Record<string, CacheRecord>, freshness: CacheFreshness = "fresh") {
  return {
    async get<T>(key: string): Promise<CacheRecord<T> | null> {
      return (records[key] as CacheRecord<T>) ?? null;
    },
    freshness(_record: CacheRecord | null): CacheFreshness {
      return freshness;
    },
  } as any;
}

function chainKey(o: ShortObligation): string {
  return buildCacheKey("tradier", "sandbox", "chain", o.symbol, o.expiration);
}

function chainRecord(opts: {
  puts?: any[];
  admissibility?: SubjectAdmissibility;
  provenanceMs?: number;
  underlyingPrice?: number;
}): CacheRecord {
  return {
    key: chainKey(PUT),
    dataType: "chain",
    provider: "tradier",
    environment: "sandbox",
    symbol: "XLF",
    expiration: "2026-10-16",
    schemaVersion: "v1",
    retrievedAt: opts.provenanceMs ?? Date.now(),
    freshUntil: Date.now() + 60000,
    staleUntil: Date.now() + 120000,
    evidenceProvenance: opts.provenanceMs != null ? { kind: "chain-acquired", acquiredAtMs: opts.provenanceMs } : { kind: "unavailable" },
    admissibility: opts.admissibility,
    payload: { puts: opts.puts ?? [], underlying: { price: opts.underlyingPrice ?? 43.5 } },
  } as unknown as CacheRecord;
}

describe("buildShortObligationEvidence — refusal-reason fidelity (Codex #7)", () => {
  it("no cached record → missing-evidence", async () => {
    const cache = fakeCache({});
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION);
    expect(ev.admissible).toBe(false);
    expect(ev.admissibilityDiagnosis).toBe("missing-evidence");
    // missing-evidence is NOT a subject-level blocker (BTS-CLOSURE-INDEPENDENCE):
    // it degrades the quote-dependent close debit per-fact, not a wholesale refusal.
    const r = evaluateShortObligationConsequences(PUT, "close", ev);
    expect(r.kind).toBe("facts");
    if (r.kind === "facts" && r.close) {
      expect(r.close.estimatedCloseDebit.precision).toBe("unavailable");
    }
  });

  it("explicit backend admissible:false → backend-inadmissible", async () => {
    const rec = chainRecord({
      admissibility: { admissible: false, basis: "real-time", canonicalSessionDate: "2026-10-01" },
      provenanceMs: Date.now(),
    });
    const cache = fakeCache({ [chainKey(PUT)]: rec });
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION);
    expect(ev.admissible).toBe(false);
    expect(ev.admissibilityDiagnosis).toBe("backend-inadmissible");
  });

  it("authority pending → authority-pending", async () => {
    const rec = chainRecord({ provenanceMs: Date.now() });
    const cache = fakeCache({ [chainKey(PUT)]: rec });
    const ev = await buildShortObligationEvidence(PUT, cache, PENDING_SESSION);
    expect(ev.admissible).toBe(false);
    expect(ev.admissibilityDiagnosis).toBe("authority-pending");
  });

  it("present record, no verdict, not cache-usable → cache-unusable", async () => {
    const rec = chainRecord({ provenanceMs: Date.now() }); // no admissibility verdict
    const cache = fakeCache({ [chainKey(PUT)]: rec }, "expired");
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION);
    expect(ev.admissible).toBe(false);
    expect(ev.admissibilityDiagnosis).toBe("cache-unusable");
  });
});

describe("buildShortObligationEvidence — RAW greek path (Codex #6, §12)", () => {
  it("preserves provider exact 0 and null verbatim (no display sanitizer)", async () => {
    const rec = chainRecord({
      admissibility: { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-01" },
      provenanceMs: Date.now(),
      puts: [
        { strike: 42, bid: 1.2, ask: 1.4, delta: 0, gamma: 0.02, theta: null, vega: 0.1, rho: 0, midIv: 0.55, smvVol: 0.4, greeksUpdatedAt: "raw-ts" },
      ],
    });
    const cache = fakeCache({ [chainKey(PUT)]: rec });
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION);
    expect(ev.enrichment).not.toBeNull();
    // exact provider 0 preserved (NOT nulled by a display sanitizer)
    expect(ev.enrichment!.greeks.delta).toBe(0);
    expect(ev.enrichment!.greeks.rho).toBe(0);
    // provider null preserved
    expect(ev.enrichment!.greeks.theta).toBeNull();
    // midIv / smvVol distinct
    expect(ev.enrichment!.greeks.midIv).toBe(0.55);
    expect(ev.enrichment!.greeks.smvVol).toBe(0.4);
    // raw greeksUpdatedAt verbatim
    expect(ev.enrichment!.greeks.greeksUpdatedAt).toBe("raw-ts");
    // NOT flagged all-zero (has nonzero fields)
    expect(ev.enrichment!.allFiveZeroPlaceholder).toBe(false);
  });

  it("flags the exact all-five-zero greek vector as a placeholder (IV independent)", async () => {
    const rec = chainRecord({
      admissibility: { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-01" },
      provenanceMs: Date.now(),
      puts: [{ strike: 42, bid: 1.2, ask: 1.4, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, midIv: 0.55, smvVol: 0.4, greeksUpdatedAt: "raw-ts" }],
    });
    const cache = fakeCache({ [chainKey(PUT)]: rec });
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION);
    expect(ev.enrichment!.allFiveZeroPlaceholder).toBe(true);
    // IV survives independently of the greek vector.
    expect(ev.enrichment!.greeks.midIv).toBe(0.55);
    expect(ev.enrichment!.greeks.smvVol).toBe(0.4);
  });
});

describe("buildShortObligationEvidence — opening-credit attribution (Codex #4)", () => {
  it("passes through blended attribution and never marks it authoritative", async () => {
    const rec = chainRecord({
      admissibility: { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-01" },
      provenanceMs: Date.now(),
      puts: [{ strike: 42, bid: 1.2, ask: 1.4 }],
    });
    const cache = fakeCache({ [chainKey(PUT)]: rec });
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION, {
      openingCredit: 200,
      openingCreditAttribution: "blended",
    });
    expect(ev.openingCredit).toBe(200);
    expect(ev.openingCreditAttribution).toBe("blended");
    const r = evaluateShortObligationConsequences(PUT, "hold", ev);
    if (r.kind === "facts") expect(r.historical.openingCredit.precision).toBe("approximate");
  });
});

describe("buildShortObligationEvidence — §14a wiring (Codex #1/#2)", () => {
  function activityRow(eventType: ActivityEventType, date: string, option: ParsedOptionContract | null): ActivityRow {
    return {
      date, eventType, action: "x", symbol: "XLF", description: "", quantity: -1, price: null,
      commission: null, fees: null, amount: null, cashBalance: null, settlementDate: null, option, rawRow: [],
    };
  }

  it("refuses (lifecycle-state-ambiguous) on an exact-contract post-checkpoint BTC", async () => {
    const rec = chainRecord({
      admissibility: { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-01" },
      provenanceMs: Date.now(),
      puts: [{ strike: 42, bid: 1.2, ask: 1.4 }],
    });
    const cache = fakeCache({ [chainKey(PUT)]: rec });
    const ev = await buildShortObligationEvidence(PUT, cache, OPEN_SESSION, {
      checkpointQuoteDate: "2026-10-01",
      activityRows: [activityRow("buy_to_close", "2026-10-05", { underlying: "XLF", expiration: "2026-10-16", strike: 42, type: "PUT" })],
    });
    expect(ev.lifecycle.ambiguous).toBe(true);
    const r = evaluateShortObligationConsequences(PUT, "close", ev);
    expect(r.kind === "refused" && r.reason).toBe("lifecycle-state-ambiguous");
  });
});
