/**
 * Tests for the portfolio state projector.
 *
 * Verifies the complete causal chain:
 *   Activity CSV → Parser → ActivityRow[] → Projector → PortfolioState
 *
 * Tests each step of the bootstrap-wheel scenario to verify
 * state transitions are correct.
 */

import { describe, it, expect } from "vitest";
import { parseActivityCsv } from "../../src/scenarios/parseActivityCsv";
import { projectState, diffStates } from "../../src/scenarios/projectState";

// --- Step CSVs (inline for clarity and independence from file loading) ---

const STEP_01 = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

const STEP_02 = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
06-10-2026,YOU SOLD OPENING TRANSACTION PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,0.85,-1,0.65,0.02,"",84.33,50084.33,06-11-2026
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

const STEP_03 = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
07-11-2026,YOU BOUGHT ASSIGNED PUTS AS OF 07-10-26 UTILITIES SELECT SECTOR SPDR TRUST... (XLU) (Cash),XLU,UTILITIES SELECT SECTOR SPDR TRUST UTILITIES SELECT SECTOR SPDR ETF,Cash,44.5,100,"","","",-4450,45634.33,07-11-2026
07-11-2026,ASSIGNED as of 2026-07-10 PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,"",1,"","","",0.00,50084.33,""
06-10-2026,YOU SOLD OPENING TRANSACTION PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,0.85,-1,0.65,0.02,"",84.33,50084.33,06-11-2026
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

const STEP_04 = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
07-14-2026,YOU SOLD OPENING TRANSACTION CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 (100 SHS) (Cash), -XLU260814C46,CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 (100 SHS),Cash,0.72,-1,0.65,0.02,"",71.33,45705.66,07-15-2026
07-11-2026,YOU BOUGHT ASSIGNED PUTS AS OF 07-10-26 UTILITIES SELECT SECTOR SPDR TRUST... (XLU) (Cash),XLU,UTILITIES SELECT SECTOR SPDR TRUST UTILITIES SELECT SECTOR SPDR ETF,Cash,44.5,100,"","","",-4450,45634.33,07-11-2026
07-11-2026,ASSIGNED as of 2026-07-10 PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,"",1,"","","",0.00,50084.33,""
06-10-2026,YOU SOLD OPENING TRANSACTION PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,0.85,-1,0.65,0.02,"",84.33,50084.33,06-11-2026
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

const STEP_05 = `Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
08-15-2026,EXPIRED CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 as of 2026-08-14 CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 (100 SHS) (Cash),XLU260814C46,CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 (100 SHS),Cash,"",1,"","","",0.00,45705.66,""
07-14-2026,YOU SOLD OPENING TRANSACTION CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 (100 SHS) (Cash), -XLU260814C46,CALL (XLU) UTILITIES SELECT SECTOR SPDR AUG 14 26 $46 (100 SHS),Cash,0.72,-1,0.65,0.02,"",71.33,45705.66,07-15-2026
07-11-2026,YOU BOUGHT ASSIGNED PUTS AS OF 07-10-26 UTILITIES SELECT SECTOR SPDR TRUST... (XLU) (Cash),XLU,UTILITIES SELECT SECTOR SPDR TRUST UTILITIES SELECT SECTOR SPDR ETF,Cash,44.5,100,"","","",-4450,45634.33,07-11-2026
07-11-2026,ASSIGNED as of 2026-07-10 PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,"",1,"","","",0.00,50084.33,""
06-10-2026,YOU SOLD OPENING TRANSACTION PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS) (Cash), -XLU260710P44.5,PUT (XLU) UTILITIES SELECT SECTOR SPDR JUL 10 26 $44.5 (100 SHS),Cash,0.85,-1,0.65,0.02,"",84.33,50084.33,06-11-2026
06-01-2026,Electronic Funds Transfer Received (Cash),,No Description,Cash,"",0,"","","",50000,50000,""
`;

// --- Tests ---

describe("projectState — bootstrap wheel scenario", () => {
  describe("Step 1: Bootstrap", () => {
    it("shows $50,000 cash after deposit", () => {
      const state = projectState(parseActivityCsv(STEP_01));
      expect(state.cash).toBe(50000);
      expect(state.deployableCash).toBe(50000);
      expect(state.holdings).toHaveLength(0);
      expect(state.openContracts).toHaveLength(0);
      expect(state.canWriteCsp).toBe(true);
      expect(state.canWriteCoveredCall).toBe(false);
    });
  });

  describe("Step 2: Put Written", () => {
    it("shows premium added to cash", () => {
      const state = projectState(parseActivityCsv(STEP_02));
      expect(state.cash).toBeCloseTo(50084.33, 0);
      expect(state.totalPremiumCollected).toBeCloseTo(84.33, 0);
    });

    it("has one open put contract", () => {
      const state = projectState(parseActivityCsv(STEP_02));
      expect(state.openContracts).toHaveLength(1);
      expect(state.openContracts[0].type).toBe("PUT");
      expect(state.openContracts[0].underlying).toBe("XLU");
      expect(state.openContracts[0].strike).toBe(44.5);
    });

    it("commits cash to the open put", () => {
      const state = projectState(parseActivityCsv(STEP_02));
      // 44.5 strike × 100 shares × 1 contract = $4,450
      expect(state.cashCommittedToPuts).toBe(4450);
      expect(state.deployableCash).toBeCloseTo(50084.33 - 4450, 0);
    });

    it("can still write CSPs (has deployable cash)", () => {
      const state = projectState(parseActivityCsv(STEP_02));
      expect(state.canWriteCsp).toBe(true);
    });
  });

  describe("Step 3: Put Assigned", () => {
    it("removes the put from open contracts", () => {
      const state = projectState(parseActivityCsv(STEP_03));
      expect(state.openContracts).toHaveLength(0);
    });

    it("acquires 100 XLU shares", () => {
      const state = projectState(parseActivityCsv(STEP_03));
      expect(state.holdings).toHaveLength(1);
      expect(state.holdings[0].symbol).toBe("XLU");
      expect(state.holdings[0].shares).toBe(100);
      expect(state.holdings[0].costBasis).toBe(44.5);
    });

    it("cash decreases by share purchase amount", () => {
      const state = projectState(parseActivityCsv(STEP_03));
      // $50,000 + $84.33 premium - $4,450 shares = $45,634.33
      expect(state.cash).toBeCloseTo(45634.33, 0);
    });

    it("no cash is committed (put is closed)", () => {
      const state = projectState(parseActivityCsv(STEP_03));
      expect(state.cashCommittedToPuts).toBe(0);
    });

    it("can now write a covered call (has shares)", () => {
      const state = projectState(parseActivityCsv(STEP_03));
      expect(state.canWriteCoveredCall).toBe(true);
      expect(state.freeShares).toHaveLength(1);
      expect(state.freeShares[0].symbol).toBe("XLU");
      expect(state.freeShares[0].shares).toBe(100);
    });
  });

  describe("Step 4: Call Written", () => {
    it("has one open call contract", () => {
      const state = projectState(parseActivityCsv(STEP_04));
      expect(state.openContracts).toHaveLength(1);
      expect(state.openContracts[0].type).toBe("CALL");
      expect(state.openContracts[0].underlying).toBe("XLU");
      expect(state.openContracts[0].strike).toBe(46);
    });

    it("premium increases", () => {
      const state = projectState(parseActivityCsv(STEP_04));
      // $84.33 + $71.33 = $155.66
      expect(state.totalPremiumCollected).toBeCloseTo(155.66, 0);
    });

    it("shares are committed to the call", () => {
      const state = projectState(parseActivityCsv(STEP_04));
      expect(state.holdings[0].sharesCommitted).toBe(100);
      expect(state.freeShares).toHaveLength(0);
      expect(state.canWriteCoveredCall).toBe(false);
    });

    it("cash is not committed (calls don't require cash collateral)", () => {
      const state = projectState(parseActivityCsv(STEP_04));
      expect(state.cashCommittedToPuts).toBe(0);
    });
  });

  describe("Step 5: Call Expired", () => {
    it("removes the call from open contracts", () => {
      const state = projectState(parseActivityCsv(STEP_05));
      expect(state.openContracts).toHaveLength(0);
    });

    it("releases shares (no longer committed)", () => {
      const state = projectState(parseActivityCsv(STEP_05));
      expect(state.holdings[0].sharesCommitted).toBe(0);
      expect(state.freeShares).toHaveLength(1);
      expect(state.freeShares[0].shares).toBe(100);
    });

    it("can write a covered call again", () => {
      const state = projectState(parseActivityCsv(STEP_05));
      expect(state.canWriteCoveredCall).toBe(true);
    });

    it("premium total unchanged by expiration (already collected)", () => {
      const state = projectState(parseActivityCsv(STEP_05));
      expect(state.totalPremiumCollected).toBeCloseTo(155.66, 0);
    });

    it("still owns 100 shares", () => {
      const state = projectState(parseActivityCsv(STEP_05));
      expect(state.holdings[0].shares).toBe(100);
    });
  });

  describe("deterministic replay", () => {
    it("same CSV produces same state", () => {
      const state1 = projectState(parseActivityCsv(STEP_05));
      const state2 = projectState(parseActivityCsv(STEP_05));
      expect(state1.cash).toBe(state2.cash);
      expect(state1.openContracts.length).toBe(state2.openContracts.length);
      expect(state1.holdings.length).toBe(state2.holdings.length);
    });
  });
});

describe("diffStates", () => {
  it("detects cash change from deposit to put-written", () => {
    const before = projectState(parseActivityCsv(STEP_01));
    const after = projectState(parseActivityCsv(STEP_02));
    const diff = diffStates(before, after);

    expect(diff.cashDelta).toBeCloseTo(84.33, 0);
    expect(diff.contractsOpened).toHaveLength(1);
    expect(diff.contractsOpened[0].type).toBe("PUT");
    expect(diff.premiumDelta).toBeCloseTo(84.33, 0);
  });

  it("detects holdings added after put assignment", () => {
    const before = projectState(parseActivityCsv(STEP_02));
    const after = projectState(parseActivityCsv(STEP_03));
    const diff = diffStates(before, after);

    expect(diff.holdingsAdded).toHaveLength(1);
    expect(diff.holdingsAdded[0].symbol).toBe("XLU");
    expect(diff.contractsClosed).toHaveLength(1);
    expect(diff.contractsClosed[0].type).toBe("PUT");
    expect(diff.canWriteCoveredCallChanged).toBe(true);
  });

  it("detects call opened after call-written", () => {
    const before = projectState(parseActivityCsv(STEP_03));
    const after = projectState(parseActivityCsv(STEP_04));
    const diff = diffStates(before, after);

    expect(diff.contractsOpened).toHaveLength(1);
    expect(diff.contractsOpened[0].type).toBe("CALL");
    expect(diff.canWriteCoveredCallChanged).toBe(true);
  });

  it("detects call closed after expiration", () => {
    const before = projectState(parseActivityCsv(STEP_04));
    const after = projectState(parseActivityCsv(STEP_05));
    const diff = diffStates(before, after);

    expect(diff.contractsClosed).toHaveLength(1);
    expect(diff.contractsClosed[0].type).toBe("CALL");
    expect(diff.canWriteCoveredCallChanged).toBe(true);
  });
});
