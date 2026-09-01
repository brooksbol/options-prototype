/**
 * PL-EVID-AGE — evidence-provenance unit tests.
 *
 * Proves the operator-facing Age semantics:
 * - chainAcquiredProvenance only accepts an authoritative timestamp
 * - formatAcquisitionAge = chain acquisition age (now − acquiredAt), truthful
 * - unavailable → em dash
 * - compareAge sorts by AGE (inverse of timestamp) with unavailable pinned to
 *   the end under BOTH directions (oldest-first / newest-first).
 */

import { describe, it, expect } from "vitest";
import {
  chainAcquiredProvenance,
  provenanceFromPublished,
  formatAcquisitionAge,
  compareAge,
  PROVENANCE_UNAVAILABLE,
  type EvidenceProvenance,
} from "../../src/write-desk/evidence-provenance";

describe("chainAcquiredProvenance", () => {
  it("accepts a valid ISO string as chain-acquired", () => {
    const iso = "2026-09-01T14:30:00.000Z";
    const p = chainAcquiredProvenance(iso);
    expect(p.kind).toBe("chain-acquired");
    if (p.kind === "chain-acquired") expect(p.acquiredAtMs).toBe(new Date(iso).getTime());
  });

  it("accepts a valid epoch-ms number", () => {
    const p = chainAcquiredProvenance(1_756_744_200_000);
    expect(p).toEqual({ kind: "chain-acquired", acquiredAtMs: 1_756_744_200_000 });
  });

  it("returns unavailable for null/undefined/empty/invalid", () => {
    expect(chainAcquiredProvenance(null).kind).toBe("unavailable");
    expect(chainAcquiredProvenance(undefined).kind).toBe("unavailable");
    expect(chainAcquiredProvenance("").kind).toBe("unavailable");
    expect(chainAcquiredProvenance("not-a-date").kind).toBe("unavailable");
    expect(chainAcquiredProvenance(0).kind).toBe("unavailable");
    expect(chainAcquiredProvenance(-5).kind).toBe("unavailable");
  });
});

describe("provenanceFromPublished — consume upstream authority (ADR-015)", () => {
  it("maps a published chain-acquired object", () => {
    const iso = "2026-09-01T14:30:00.000Z";
    const p = provenanceFromPublished({ kind: "chain-acquired", acquiredAt: iso });
    expect(p.kind).toBe("chain-acquired");
    if (p.kind === "chain-acquired") expect(p.acquiredAtMs).toBe(new Date(iso).getTime());
  });

  it("maps a published unavailable object", () => {
    expect(provenanceFromPublished({ kind: "unavailable" }).kind).toBe("unavailable");
  });

  // Consumer compatibility: an older snapshot lacking the provenance field is
  // treated as unavailable — NEVER reconstructed from a weaker timestamp.
  it("treats missing/malformed published provenance as unavailable", () => {
    expect(provenanceFromPublished(undefined).kind).toBe("unavailable");
    expect(provenanceFromPublished(null).kind).toBe("unavailable");
    expect(provenanceFromPublished({}).kind).toBe("unavailable");
    expect(provenanceFromPublished({ kind: "something-else" }).kind).toBe("unavailable");
    // A bare symbol-level timestamp string is not a valid provenance object.
    expect(provenanceFromPublished("2026-09-01T14:30:00.000Z").kind).toBe("unavailable");
  });

  it("chain-acquired with a malformed acquiredAt degrades to unavailable", () => {
    expect(provenanceFromPublished({ kind: "chain-acquired", acquiredAt: "not-a-date" }).kind).toBe("unavailable");
    expect(provenanceFromPublished({ kind: "chain-acquired" }).kind).toBe("unavailable");
  });
});

describe("formatAcquisitionAge (chain acquisition age)", () => {
  const now = 1_000_000_000_000;

  it("formats seconds under a minute", () => {
    expect(formatAcquisitionAge({ kind: "chain-acquired", acquiredAtMs: now - 5_000 }, now)).toBe("5s");
    expect(formatAcquisitionAge({ kind: "chain-acquired", acquiredAtMs: now - 59_000 }, now)).toBe("59s");
  });

  it("formats minutes and hours", () => {
    expect(formatAcquisitionAge({ kind: "chain-acquired", acquiredAtMs: now - 120_000 }, now)).toBe("2m");
    expect(formatAcquisitionAge({ kind: "chain-acquired", acquiredAtMs: now - 2 * 3600_000 }, now)).toBe("2h");
  });

  it("advances with wall clock for unchanged provenance", () => {
    const prov: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: now - 10_000 };
    expect(formatAcquisitionAge(prov, now)).toBe("10s");
    // Same provenance object, later clock → larger age. Age is derived, not frozen.
    expect(formatAcquisitionAge(prov, now + 50_000)).toBe("1m");
  });

  it("renders an em dash for unavailable provenance", () => {
    expect(formatAcquisitionAge(PROVENANCE_UNAVAILABLE, now)).toBe("—");
    expect(formatAcquisitionAge(undefined, now)).toBe("—");
    expect(formatAcquisitionAge(null, now)).toBe("—");
  });

  it("never renders negative age (clamps to 0s)", () => {
    expect(formatAcquisitionAge({ kind: "chain-acquired", acquiredAtMs: now + 5_000 }, now)).toBe("0s");
  });
});

describe("compareAge — sort semantics (inverse of timestamp)", () => {
  const now = 1_000_000_000_000;
  const young: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: now - 10_000 };  // 10s old
  const old: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: now - 600_000 };   // 10m old
  const missing: EvidenceProvenance = PROVENANCE_UNAVAILABLE;

  it("asc = youngest first", () => {
    const arr = [old, young];
    arr.sort((a, b) => compareAge(a, b, "asc", now));
    expect(arr).toEqual([young, old]);
  });

  it("desc = oldest first", () => {
    const arr = [young, old];
    arr.sort((a, b) => compareAge(a, b, "desc", now));
    expect(arr).toEqual([old, young]);
  });

  it("pins unavailable to the end under ASC", () => {
    const arr = [missing, old, young];
    arr.sort((a, b) => compareAge(a, b, "asc", now));
    expect(arr[arr.length - 1]).toBe(missing);
    expect(arr.slice(0, 2)).toEqual([young, old]);
  });

  it("pins unavailable to the end under DESC (not the front)", () => {
    const arr = [missing, young, old];
    arr.sort((a, b) => compareAge(a, b, "desc", now));
    expect(arr[arr.length - 1]).toBe(missing);
    expect(arr.slice(0, 2)).toEqual([old, young]);
  });
});
