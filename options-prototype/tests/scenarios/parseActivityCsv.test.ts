/**
 * Tests for the scenario activity CSV parser.
 *
 * Verifies that Fidelity-shaped activity CSVs are correctly classified
 * into canonical event types with option contract details parsed.
 */

import { describe, it, expect } from "vitest";
import { parseActivityCsv } from "../../src/scenarios/parseActivityCsv";

// --- Fixture CSV content (inline for clarity) ---

const BOOTSTRAP_CSV = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

const PUT_WRITTEN_CSV = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
06-10-2026,YOU SOLD OPENING TRANSACTION PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,0.85,-1,0.65,0.02,"",84.33,50084.33,06-11-2026
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

const PUT_ASSIGNED_CSV = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
07-11-2026,YOU BOUGHT ASSIGNED PUTS AS OF 07-10-26 UTILITIES SELECT SECTOR SPDR TRUST... (XLU) (Cash),XLU,UTILITIES SELECT SECTOR SPDR TRUST UTILITIES SELECT SECTOR SPDR ETF,Cash,44.5,100,"","","",-4450,45634.33,07-11-2026
07-11-2026,ASSIGNED as of 2026-07-10 PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,"",1,"","","",0.00,50084.33,""
06-10-2026,YOU SOLD OPENING TRANSACTION PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,0.85,-1,0.65,0.02,"",84.33,50084.33,06-11-2026
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

// --- Tests ---

describe("parseActivityCsv", () => {
  describe("bootstrap step", () => {
    it("parses a single cash deposit", () => {
      const rows = parseActivityCsv(BOOTSTRAP_CSV);
      expect(rows).toHaveLength(1);
      expect(rows[0].eventType).toBe("cash_movement");
      expect(rows[0].amount).toBe(50000);
      expect(rows[0].date).toBe("2026-06-01");
    });
  });

  describe("put written step", () => {
    it("parses cumulative history with new sell_to_open event", () => {
      const rows = parseActivityCsv(PUT_WRITTEN_CSV);
      expect(rows).toHaveLength(2);
    });

    it("classifies sell-to-open correctly", () => {
      const rows = parseActivityCsv(PUT_WRITTEN_CSV);
      const sellRow = rows.find((r) => r.eventType === "sell_to_open");
      expect(sellRow).toBeDefined();
      expect(sellRow!.amount).toBeCloseTo(84.33);
      expect(sellRow!.quantity).toBe(-1);
    });

    it("parses option contract details from symbol", () => {
      const rows = parseActivityCsv(PUT_WRITTEN_CSV);
      const sellRow = rows.find((r) => r.eventType === "sell_to_open");
      expect(sellRow!.option).not.toBeNull();
      expect(sellRow!.option!.type).toBe("PUT");
      expect(sellRow!.option!.underlying).toBe("XLU");
      expect(sellRow!.option!.strike).toBe(44.5);
      expect(sellRow!.option!.expiration).toBe("2026-07-10");
    });
  });

  describe("put assigned step", () => {
    it("classifies assignment events correctly", () => {
      const rows = parseActivityCsv(PUT_ASSIGNED_CSV);
      const assigned = rows.find((r) => r.eventType === "assigned");
      const sharesBought = rows.find((r) => r.eventType === "shares_bought_assignment");

      expect(assigned).toBeDefined();
      expect(sharesBought).toBeDefined();
    });

    it("captures share acquisition details", () => {
      const rows = parseActivityCsv(PUT_ASSIGNED_CSV);
      const sharesBought = rows.find((r) => r.eventType === "shares_bought_assignment");
      expect(sharesBought!.symbol).toBe("XLU");
      expect(sharesBought!.quantity).toBe(100);
      expect(sharesBought!.price).toBe(44.5);
      expect(sharesBought!.amount).toBe(-4450);
    });

    it("parses option details from the assigned event action text", () => {
      const rows = parseActivityCsv(PUT_ASSIGNED_CSV);
      const assigned = rows.find((r) => r.eventType === "assigned");
      expect(assigned!.option).not.toBeNull();
      expect(assigned!.option!.type).toBe("PUT");
      expect(assigned!.option!.underlying).toBe("XLU");
      expect(assigned!.option!.strike).toBe(44.5);
    });
  });

  describe("date normalization", () => {
    it("normalizes MM-DD-YYYY to ISO format", () => {
      const rows = parseActivityCsv(BOOTSTRAP_CSV);
      expect(rows[0].date).toBe("2026-06-01");
    });
  });

  describe("document order", () => {
    it("preserves Fidelity document order (newest first)", () => {
      const rows = parseActivityCsv(PUT_ASSIGNED_CSV);
      // First row should be the newest (07-11)
      expect(rows[0].date).toBe("2026-07-11");
      // Last row should be the oldest (06-01)
      expect(rows[rows.length - 1].date).toBe("2026-06-01");
    });
  });
});
