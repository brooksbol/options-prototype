/**
 * Session Gate Tests
 *
 * Proves:
 * 1. Regular session hours permit acquisition
 * 2. Weekends block acquisition
 * 3. Full holidays block acquisition
 * 4. Early-close days block acquisition after 13:30 ET
 * 5. Early-close days permit acquisition before 13:30 ET
 * 6. Pre-market blocks acquisition
 * 7. Post-market blocks acquisition on standard days
 */

import { describe, it, expect } from "vitest";
import { isAcquisitionPermitted } from "../src/acquisition-worker.js";

/** Create a Date at a specific ET time on a given date.
 *  Uses the same DST approximation as the session gate:
 *  EDT (UTC-4) for months Apr–Oct, EST (UTC-5) otherwise. */
function etDate(dateStr: string, hours: number, minutes: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Match the gate's DST logic: (month > 3 && month < 11) → EDT, else EST
  const isEDT = (month > 3 && month < 11) || (month === 3 && day >= 8) || (month === 11 && day < 1);
  const utcOffset = isEDT ? 4 : 5; // hours to add to ET to get UTC
  return new Date(Date.UTC(year, month - 1, day, hours + utcOffset, minutes, 0));
}

describe("session gate — regular session", () => {
  it("permits acquisition at 10:00 ET on a trading day", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-15", 10, 0)); // Wednesday
    expect(result.permitted).toBe(true);
    expect(result.reason).toBe("Regular session");
  });

  it("permits acquisition at 15:00 ET on a trading day", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-15", 15, 0));
    expect(result.permitted).toBe(true);
  });

  it("permits acquisition at 16:14 ET (within delay drain)", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-15", 16, 14));
    expect(result.permitted).toBe(true);
  });
});

describe("session gate — weekends", () => {
  it("blocks acquisition on Saturday", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-18", 12, 0)); // Saturday
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Weekend");
  });

  it("blocks acquisition on Sunday", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-19", 12, 0)); // Sunday
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Weekend");
  });
});

describe("session gate — holidays", () => {
  it("blocks acquisition on July 4 observed (July 3, 2026)", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-03", 12, 0)); // Thursday
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Exchange holiday");
  });

  it("blocks acquisition on Thanksgiving", () => {
    const result = isAcquisitionPermitted(etDate("2026-11-26", 12, 0)); // Thursday
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Exchange holiday");
  });
});

describe("session gate — early-close days", () => {
  it("permits acquisition at 12:00 ET on day after Thanksgiving", () => {
    const result = isAcquisitionPermitted(etDate("2026-11-27", 12, 0)); // Friday
    expect(result.permitted).toBe(true);
    expect(result.reason).toBe("Regular session");
  });

  it("permits acquisition at 13:29 ET on day after Thanksgiving (within early window)", () => {
    const result = isAcquisitionPermitted(etDate("2026-11-27", 13, 29));
    expect(result.permitted).toBe(true);
  });

  it("blocks acquisition at 13:31 ET on day after Thanksgiving (past early close + delay)", () => {
    const result = isAcquisitionPermitted(etDate("2026-11-27", 13, 31));
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Early close");
  });

  it("blocks acquisition at 14:00 ET on day after Thanksgiving", () => {
    const result = isAcquisitionPermitted(etDate("2026-11-27", 14, 0));
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Early close");
  });

  it("permits acquisition at 10:00 ET on Christmas Eve", () => {
    const result = isAcquisitionPermitted(etDate("2026-12-24", 10, 0)); // Thursday
    expect(result.permitted).toBe(true);
  });

  it("blocks acquisition at 14:00 ET on Christmas Eve", () => {
    const result = isAcquisitionPermitted(etDate("2026-12-24", 14, 0));
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Early close");
  });
});

describe("session gate — off-hours", () => {
  it("blocks acquisition at 09:00 ET (pre-market)", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-15", 9, 0));
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Pre-market");
  });

  it("blocks acquisition at 16:30 ET (post-market)", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-15", 16, 30));
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("Market closed");
  });

  it("blocks acquisition at 20:00 ET (evening)", () => {
    const result = isAcquisitionPermitted(etDate("2026-07-15", 20, 0));
    expect(result.permitted).toBe(false);
  });
});
