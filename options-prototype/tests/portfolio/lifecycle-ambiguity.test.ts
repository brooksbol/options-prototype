/**
 * Tests for the §14a lifecycle-ambiguity guard (Existing Short-Obligation HOLD vs CLOSE V1).
 *
 * Proves the load-bearing Codex constraints (design §14a; ADR-016; ADR-017):
 *  - An exact-contract post-checkpoint buy_to_close / expired / assigned conflicting
 *    with the projected open obligation → `lifecycle state ambiguous` (REFUSE).
 *  - Exact-contract association ONLY (side/underlying/strike/expiration). A different
 *    strike/expiration/side does NOT trip the guard.
 *  - When a resolution-class option row for the same underlying cannot be associated
 *    to the exact contract (row.option is null) → REFUSE rather than associate.
 *  - No invented chronology precision: day-granularity; only strictly-later days count;
 *    a same-day-as-checkpoint event does not project.
 *  - A strictly-later exact-contract reopen (sell_to_open) clears the ambiguity.
 *  - Pure/read-only: input arrays are not mutated.
 */
import { describe, it, expect } from "vitest";
import { detectLifecycleAmbiguity, type ObligationContractKey } from "../../src/portfolio/lifecycle-ambiguity";
import type { ActivityRow, ActivityEventType } from "../../src/csv/fidelity/activityParser";
import type { ParsedOptionContract } from "../../src/csv/fidelity/parseOptionContract";

const CHECKPOINT = "2026-10-01"; // Option Summary quoteDate (day precision)

function opt(overrides: Partial<ParsedOptionContract> = {}): ParsedOptionContract {
  return { underlying: "XLF", expiration: "2026-10-16", strike: 42, type: "PUT", ...overrides };
}

function row(eventType: ActivityEventType, date: string, option: ParsedOptionContract | null, symbol = "XLF"): ActivityRow {
  return {
    date,
    eventType,
    action: `TEST ${eventType}`,
    symbol,
    description: "",
    quantity: -1,
    price: null,
    commission: null,
    fees: null,
    amount: null,
    cashBalance: null,
    settlementDate: null,
    option,
    rawRow: [],
  };
}

const PUT_KEY: ObligationContractKey = { side: "put", underlying: "XLF", strike: 42, expiration: "2026-10-16" };

describe("detectLifecycleAmbiguity — exact-contract conflicts refuse", () => {
  it("no activity → not ambiguous", () => {
    expect(detectLifecycleAmbiguity(PUT_KEY, [], CHECKPOINT).ambiguous).toBe(false);
  });

  it("exact-contract buy_to_close AFTER checkpoint → ambiguous", () => {
    const rows = [row("buy_to_close", "2026-10-05", opt())];
    const r = detectLifecycleAmbiguity(PUT_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) {
      expect(r.conflictingEvent).toBe("buy_to_close");
      expect(r.eventDate).toBe("2026-10-05");
    }
  });

  it("exact-contract expired AFTER checkpoint → ambiguous", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("expired", "2026-10-16", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.conflictingEvent).toBe("expired");
  });

  it("exact-contract assigned AFTER checkpoint → ambiguous", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("assigned", "2026-10-10", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.conflictingEvent).toBe("assigned");
  });
});

describe("detectLifecycleAmbiguity — association discipline (ADR-016)", () => {
  it("different strike does NOT trip the guard", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", opt({ strike: 40 }))], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });

  it("different expiration does NOT trip the guard", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", opt({ expiration: "2026-11-20" }))], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });

  it("different side (call vs put) does NOT trip the guard", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", opt({ type: "CALL" }))], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });

  it("a resolution-class row for the same underlying that CANNOT be exactly associated (option null) → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("assigned", "2026-10-05", null, "XLF 42 PUT")], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) {
      expect(r.note.toLowerCase()).toContain("could not be established as unrelated");
    }
  });

  it("an option-null resolution row whose symbol POSITIVELY parses to a DIFFERENT underlying does not trip the guard", () => {
    // "-SPY261218C600" positively parses to SPY (different underlying) → unrelated.
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("assigned", "2026-10-05", null, "-SPY261218C600")], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });
});

describe("detectLifecycleAmbiguity — chronology precision (no invented ordering)", () => {
  it("a resolution ON the checkpoint day does NOT project (day precision, strictly-later only)", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", CHECKPOINT, opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });

  it("a resolution BEFORE the checkpoint does NOT project", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-09-20", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });

  it("a later exact-contract reopen (sell_to_open) does NOT clear an earlier resolution (Codex #1 — no reopen inference)", () => {
    const rows = [
      row("buy_to_close", "2026-10-05", opt()),
      row("sell_to_open", "2026-10-08", opt()),
    ];
    const r = detectLifecycleAmbiguity(PUT_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.conflictingEvent).toBe("buy_to_close");
  });

  it("a same-day reopen does NOT clear the resolution", () => {
    const rows = [
      row("buy_to_close", "2026-10-05", opt()),
      row("sell_to_open", "2026-10-05", opt()),
    ];
    const r = detectLifecycleAmbiguity(PUT_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("no parseable checkpoint → all activity is post-checkpoint (fallback), exact conflict refuses", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("expired", "2026-01-01", opt())], null);
    expect(r.ambiguous).toBe(true);
  });
});

describe("detectLifecycleAmbiguity — Codex adversarial cases", () => {
  it("BTC 5 → later STO 1 → stale supplied 5-contract subject => REFUSE (no reopen clears it)", () => {
    // Quantity is irrelevant to the guard — ANY exact-contract resolution refuses.
    const rows = [
      row("buy_to_close", "2026-10-05", opt()), // closes the series
      row("sell_to_open", "2026-10-09", opt()), // reopens a (possibly different qty) series
    ];
    const r = detectLifecycleAmbiguity(PUT_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.conflictingEvent).toBe("buy_to_close");
  });

  it("partial close (exact-contract BTC of fewer contracts) still REFUSES", () => {
    // The guard does not reason about quantity; any exact-contract BTC refuses,
    // which conservatively covers a partial close.
    const partial = { ...row("buy_to_close", "2026-10-06", opt()), quantity: -2 };
    const r = detectLifecycleAmbiguity(PUT_KEY, [partial], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("assignment-derived share event (shares_sold_assignment) for the exact call REFUSES", () => {
    const CALL_KEY = { side: "call" as const, underlying: "XLE", strike: 90, expiration: "2026-10-16" };
    const rows = [row("shares_sold_assignment", "2026-10-07", opt({ underlying: "XLE", strike: 90, type: "CALL" }), "XLE")];
    const r = detectLifecycleAmbiguity(CALL_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.conflictingEvent).toBe("assigned");
  });

  it("assignment-derived share event with no parsed contract, same underlying, REFUSES", () => {
    const CALL_KEY = { side: "call" as const, underlying: "XLE", strike: 90, expiration: "2026-10-16" };
    const rows = [row("shares_sold_assignment", "2026-10-07", null, "XLE 90 CALL")];
    const r = detectLifecycleAmbiguity(CALL_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("intraday checkpoint: SAME calendar-day resolution is unorderable => REFUSE (Codex #2)", () => {
    // Intraday checkpoint on 2026-10-01; a same-day BTC cannot be ordered against it.
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-01", opt())], "Oct 1, 2026 4:00 PM ET");
    expect(r.ambiguous).toBe(true);
  });

  it("intraday checkpoint: a BEFORE-day resolution is out of scope (does not refuse)", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-09-30", opt())], "Oct 1, 2026 4:00 PM ET");
    expect(r.ambiguous).toBe(false);
  });

  it("newer authoritative checkpoint supersedes older conflict: a BTC before a later checkpoint is out of scope", () => {
    // Checkpoint advanced to 2026-10-10; a BTC on 2026-10-05 is at/before it → not in scope.
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", opt())], "2026-10-10");
    expect(r.ambiguous).toBe(false);
  });
});

describe("detectLifecycleAmbiguity — uncertainty bypasses closed (Codex correction #2)", () => {
  it("BTC with NO parsed contract AND blank symbol → cannot exclude relevance → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", null, "")], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("exact-contract BTC with a MISSING date → cannot prove pre-checkpoint → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.eventDate).toBe("(date unknown)");
  });

  it("same-underlying resolution with a MISSING date (unassociable) → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("assigned", "", null, "XLF")], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("put assignment-derived share event (shares_bought_assignment), exact contract → REFUSE", () => {
    const rows = [row("shares_bought_assignment", "2026-10-07", opt())];
    const r = detectLifecycleAmbiguity(PUT_KEY, rows, CHECKPOINT);
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.conflictingEvent).toBe("assigned");
  });

  it("put assignment-derived share event, same underlying, no parsed contract → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("shares_bought_assignment", "2026-10-07", null, "XLF")], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("CONTROL: a genuinely unrelated resolution (positively-identified different underlying) is still ignored", () => {
    // parsed contract, different underlying → authoritatively unrelated
    const r1 = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", opt({ underlying: "XLE", strike: 90 }), "XLE")], CHECKPOINT);
    expect(r1.ambiguous).toBe(false);
    // null option, but the row symbol POSITIVELY parses to a different underlying
    const r2 = detectLifecycleAmbiguity(PUT_KEY, [row("assigned", "2026-10-05", null, "-SPY261218C600")], CHECKPOINT);
    expect(r2.ambiguous).toBe(false);
  });

  it("Codex correction #1: 'UNKNOWN' / placeholder / malformed symbol on a null-option resolution → REFUSE", () => {
    const unknown = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", null, "UNKNOWN")], CHECKPOINT);
    expect(unknown.ambiguous).toBe(true);
    const malformed = detectLifecycleAmbiguity(PUT_KEY, [row("assigned", "2026-10-05", null, "A9OV6LOF")], CHECKPOINT);
    expect(malformed.ambiguous).toBe(true);
  });

  it("Codex correction #2: a nonempty MALFORMED date on a relevant resolution → REFUSE (no raw-string ordering)", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "01/not-a-date", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("Codex correction #2: an IMPOSSIBLE calendar date on a relevant resolution → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-02-30", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });

  it("Codex correction #2: a VALID earlier date on an exact contract is out of scope (ignored)", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-09-30", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(false);
  });

  it("Codex correction #2: a VALID later date on an exact contract → REFUSE", () => {
    const r = detectLifecycleAmbiguity(PUT_KEY, [row("buy_to_close", "2026-10-05", opt())], CHECKPOINT);
    expect(r.ambiguous).toBe(true);
  });
});

describe("detectLifecycleAmbiguity — purity", () => {
  it("does not mutate the input activity array", () => {
    const rows = [row("buy_to_close", "2026-10-05", opt()), row("sell_to_open", "2026-09-01", opt())];
    const before = JSON.stringify(rows);
    detectLifecycleAmbiguity(PUT_KEY, rows, CHECKPOINT);
    expect(JSON.stringify(rows)).toEqual(before);
  });
});
