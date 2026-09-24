/**
 * BUG-026 / ADR-020 — live account path integration.
 *
 * Proves Positions ownership authority flows through the REAL path:
 *   importIntoAccount (persist "positions" slot) → buildSnapshotForAccount (read + apply)
 * — not just the pure builder. Uses real Fidelity-shaped CSV text parsed by the registered
 * parsers, so the parser → evidence-store → snapshot wiring is all exercised.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { importIntoAccount } from "../../src/portfolio/account-import";
import { buildSnapshotForAccount } from "../../src/portfolio/account-snapshot";
import { deriveUnencumberedInventory } from "../../src/portfolio/unencumbered-inventory";
import {
  registerAccount,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import {
  readAccountCsv,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";

// Real Sep 24 URA specimen shape: two byte-identical 100-share Covered Call rows + $41/$43 calls.
const URA_OS = `Fidelity Investments - Option Summary Z39411514
Quote data as of 09/24/2026.
Symbol,Description,Strategy,Expiration & Strike,Quantity,Bid,Ask,Cost basis,Market value,Avg. cost,$ Total Gain/Loss,% Total Gain/Loss,Last,Change,% Change,Margin requirements
URA,GLOBAL X URANIUM ETF,Covered Call,Shares,100,$40.97,$40.98,$4336.50,$4097.00,$43.37,-239.50,-5.52%,$40.97,-$1.02,-2.43%,$0.00,
URA,GLOBAL X URANIUM ETF,Covered Call,URA SEP 25 2026 $41 CALL,-1,$0.35,$0.50,-$39.34,-$50.00,-$0.39,-10.66,-27.10%,$0.40,-$1.75,-81.40%,--,
URA,GLOBAL X URANIUM ETF,Covered Call,Shares,100,$40.97,$40.98,$4336.50,$4097.00,$43.37,-239.50,-5.52%,$40.97,-$1.02,-2.43%,$0.00,
URA,GLOBAL X URANIUM ETF,Covered Call,URA SEP 25 2026 $43 CALL,-1,$0.00,$0.05,-$109.34,-$5.00,-$1.09,104.34,+95.43%,$0.04,-$0.20,-83.33%,--,
`;

const URA_BAL = `Brokerage
Account Name / Account Number,PTS - Z39-411514
,Balance,Day change
Total account value,100000,
Available to trade (all settled),5000,
`;

// Positions authoritatively reports 200 URA shares (single aggregate equity line).
const URA_POSITIONS = `Account Number,Account Name,Investment Type,Symbol,Description,Quantity,Last Price,Last Price Change,Current Value,Today's Gain/Loss Dollar,Today's Gain/Loss Percent,Total Gain/Loss Dollar,Total Gain/Loss Percent,Percent Of Account,Cost Basis Total,Average Cost Basis,Type
Z39411514,PERSONAL TREASURY,ETFs,URA,GLOBAL X URANIUM ETF,200,$40.97,-$1.02,$8194.00,-$204.00,-2.43%,-$479.00,-5.52%,8.19%,$8673.00,$43.37,Cash,
`;

function blob(text: string, filename: string): StoredCsvBlob { return { text, filename }; }

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
});

function newAccount(displayName: string): string {
  const r = registerAccount({ broker: "fidelity", displayName });
  if (r.kind !== "created") throw new Error("setup");
  return r.account.brokerageAccountId;
}

describe("ADR-020 live path — Positions ownership through import → snapshot", () => {
  it("URA: OS ambiguous 2×100 + Positions 200 → snapshot ownership 200, no false warning", () => {
    const acct = newAccount("PTS");
    const r = importIntoAccount(
      {
        optionSummary: blob(URA_OS, "os.csv"),
        balances: blob(URA_BAL, "bal.csv"),
        positions: blob(URA_POSITIONS, "positions.csv"),
      },
      acct
    );
    expect(r.kind).toBe("refreshed");
    // Positions slot persisted.
    expect(readAccountCsv(acct, "positions")?.text).toBe(URA_POSITIONS);

    const snap = buildSnapshotForAccount(acct);
    expect(snap).not.toBeNull();
    const ura = snap!.inventory.find((p) => p.symbol === "URA")!;
    expect(ura.sharesOwned).toBe(200);
    expect(ura.sharesEncumbered).toBe(200);
    expect(ura.ownershipAuthority).toBe("positions");
    expect(snap!.provenance.ownershipFromPositions).toBe(true);
    expect(snap!.provenance.positionsFilename).toBe("positions.csv");

    const { geometryWarnings } = deriveUnencumberedInventory(snap!);
    expect(geometryWarnings.find((w) => w.symbol === "URA")).toBeUndefined();
  });

  it("URA: same OS but NO Positions uploaded → conservative observed 100, warning fires (degraded)", () => {
    const acct = newAccount("PTS");
    importIntoAccount(
      { optionSummary: blob(URA_OS, "os.csv"), balances: blob(URA_BAL, "bal.csv") },
      acct
    );
    expect(readAccountCsv(acct, "positions")).toBeNull();

    const snap = buildSnapshotForAccount(acct);
    const ura = snap!.inventory.find((p) => p.symbol === "URA")!;
    expect(ura.sharesOwned).toBe(100); // observed, not inferred
    expect(ura.ownershipAuthority).toBe("option-summary");
    expect(snap!.provenance.ownershipFromPositions).toBe(false);

    const { geometryWarnings } = deriveUnencumberedInventory(snap!);
    expect(geometryWarnings.find((w) => w.symbol === "URA")).toBeDefined();
  });
});
