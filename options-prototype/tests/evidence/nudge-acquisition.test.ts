/**
 * force-acquisition — operator-forced one-shot acquisition client tests.
 *
 * Proves the client:
 * 1. POSTs to the EXISTING backend endpoint /api/evidence/refresh
 * 2. Maps the backend forced-acquisition disposition (outcome/counts/provenance)
 * 3. Defaults sensibly when fields are absent
 * 4. Reports failure (never throws) on non-2xx
 * 5. Reports failure (never throws) on network/abort error
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { forceEvidenceAcquisition } from "../../src/evidence/nudge-acquisition";

describe("forceEvidenceAcquisition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to the existing /api/evidence/refresh endpoint", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ outcome: "ACQUIRED", symbolsAcquired: 3, workQueueDepth: 10, generation: 42, sessionPosture: "BLOCKED", recoversHistory: false }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await forceEvidenceAcquisition();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/evidence/refresh");
    expect(opts.method).toBe("POST");
  });

  it("maps the backend forced-acquisition disposition on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ outcome: "ACQUIRED", symbolsAcquired: 3, workQueueDepth: 10, generation: 42, sessionPosture: "BLOCKED", recoversHistory: false }),
    })));

    const result = await forceEvidenceAcquisition();

    expect(result).toEqual({
      ok: true,
      outcome: "ACQUIRED",
      symbolsAcquired: 3,
      workQueueDepth: 10,
      generation: 42,
      sessionPosture: "BLOCKED",
      recoversHistory: false,
      targeted: false,
    });
  });

  it("carries PROVIDER_UNAVAILABLE through honestly", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ outcome: "PROVIDER_UNAVAILABLE", symbolsAcquired: 0, workQueueDepth: 5, generation: 7, sessionPosture: "provider_unverified", recoversHistory: false }),
    })));

    const result = await forceEvidenceAcquisition();

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.outcome).toBe("PROVIDER_UNAVAILABLE");
  });

  it("defaults sensibly when fields are absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })));

    const result = await forceEvidenceAcquisition();

    expect(result).toEqual({
      ok: true,
      outcome: "ACQUIRED",
      symbolsAcquired: 0,
      workQueueDepth: -1,
      generation: -1,
      sessionPosture: "unknown",
      recoversHistory: false,
      targeted: false,
    });
  });

  it("scopes the refresh to the given symbols via repeated ?symbol= query params", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ outcome: "ACQUIRED", symbolsAcquired: 2, generation: 8, sessionPosture: "REGULAR_OBSERVATION", targeted: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await forceEvidenceAcquisition(["bno", "COPX", "bno"]);

    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    // Uppercased + deduped, still a POST (side-effecting acquisition, not a GET).
    expect(url).toBe("/api/evidence/refresh?symbol=BNO&symbol=COPX");
    expect(opts.method).toBe("POST");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.targeted).toBe(true);
  });

  it("omits the query string when the symbol list is empty (whole-cycle behavior)", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    vi.stubGlobal("fetch", fetchMock);

    await forceEvidenceAcquisition([]);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/evidence/refresh");
  });

  it("reports failure (does not throw) on non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));

    const result = await forceEvidenceAcquisition();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("503");
  });

  it("reports failure (does not throw) on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));

    const result = await forceEvidenceAcquisition();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("network down");
  });
});
