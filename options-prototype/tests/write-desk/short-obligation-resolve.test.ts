/**
 * short-obligation-resolve — shared resolver tests.
 *
 * Covers the non-lossy Activity invalidation identity (Codex correction #3):
 * two distinct guard-relevant evidence sets that yield different §14a results
 * must produce different identities, and the identity must not be compressed
 * through a lossy hash.
 */
import { describe, it, expect } from "vitest";
import { serializeActivityForGuard } from "../../src/write-desk/short-obligation-resolve";
import type { ActivityRow, ActivityEventType } from "../../src/csv/fidelity/activityParser";
import type { ParsedOptionContract } from "../../src/csv/fidelity/parseOptionContract";

function actRow(eventType: ActivityEventType, date: string, option: ParsedOptionContract | null, symbol = "XLF"): ActivityRow {
  return {
    date, eventType, action: "x", symbol, description: "", quantity: -1, price: null,
    commission: null, fees: null, amount: null, cashBalance: null, settlementDate: null, option, rawRow: [],
  };
}

describe("serializeActivityForGuard — non-lossy invalidation identity (Codex #3)", () => {
  it("two distinct guard-relevant evidence sets that yield different §14a results produce DIFFERENT identities (djb2-collision fixture)", () => {
    const xlfPut: ParsedOptionContract = { underlying: "XLF", expiration: "2026-10-16", strike: 42, type: "PUT" };
    // Codex-demonstrated djb2 collision fixture: same date + parsed XLF contract,
    // differing only by eventType/symbol. Old djb2 collided at 69d274ed.
    const setA = [actRow("sell_to_open", "2026-10-05", xlfPut, "A9OV6LOF")];
    const setB = [actRow("buy_to_close", "2026-10-05", xlfPut, "ED0NQ9GZ")];
    const idA = serializeActivityForGuard(setA);
    const idB = serializeActivityForGuard(setB);
    expect(idA).not.toEqual(idB);
    // Deterministic: identical evidence → identical identity.
    expect(serializeActivityForGuard(setA)).toEqual(idA);
  });

  it("an INTERIOR row change (same count + endpoints) changes the identity", () => {
    const xlfPut: ParsedOptionContract = { underlying: "XLF", expiration: "2026-10-16", strike: 42, type: "PUT" };
    const before = [
      actRow("shares_bought_direct", "2026-10-02", null, "XLF"),
      actRow("dividend", "2026-10-05", null, "XLF"),
      actRow("shares_bought_direct", "2026-10-09", null, "XLF"),
    ];
    const after = [
      actRow("shares_bought_direct", "2026-10-02", null, "XLF"),
      actRow("buy_to_close", "2026-10-06", xlfPut, "XLF"), // interior change
      actRow("shares_bought_direct", "2026-10-09", null, "XLF"),
    ];
    expect(serializeActivityForGuard(before)).not.toEqual(serializeActivityForGuard(after));
  });

  it("empty/absent activity has a stable identity", () => {
    expect(serializeActivityForGuard(null)).toBe("activity:none");
    expect(serializeActivityForGuard([])).toBe("activity:none");
  });
});
