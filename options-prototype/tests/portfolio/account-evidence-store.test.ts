/**
 * Increment 2 — Account-keyed Fidelity evidence persistence + safe singleton migration.
 *
 * Establishes: two independent accounts coexisting; independent per-account evidence;
 * reload/round-trip; idempotent + non-destructive legacy singleton migration; auto-create
 * from unambiguous identity; missing/conflicting identity never invented (legacy-unknown);
 * margin vs non-margin isolation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  readAccountCsv,
  writeAccountCsv,
  externalRefFromBalancesBlob,
  migrateLegacySingletonEvidence,
  readLegacyUnknown,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";
import {
  loadAccounts,
  resolveAccountByExternalRef,
  saveAccounts,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import {
  createBrokerageAccount,
  _resetIdCounterForTesting,
} from "../../src/portfolio/brokerage-account";
import { buildFidelitySnapshot } from "../../src/write-desk/fidelity-snapshot";
import type { ParsedBalances } from "../../src/csv/fidelity/balancesParser";

const LEGACY_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LEGACY_KEY_BAL = "wheelwright:fidelity-csv:balances";
const LEGACY_KEY_ACTIVITY = "wheelwright:fidelity-csv:activity";

// --- Balances CSV fixtures with resolvable (hyphenated) external account references ---
// The extractor targets the documented "XXXX-1234" hyphenated account-number format.

const PTS_MARGIN_BALANCES = `Brokerage
Account Name / Account Number,PTS - Z12-345678
,Balance,Day change
Total account value,113842.91,2244.36
Account equity percentage,100.00%,
AVAILABLE TO TRADE,,
Margin buying power,13468.74,13366.24
Non-margin buying power,6734.37,6683.12
Available without margin impact,4200,-51.25
Cash reserved for options strategies,900,
MARGIN STATUS,,
House surplus,7393.18,7341.93
`;

const SAWDUST_ROTH_BALANCES = `Brokerage
Account Name / Account Number,Sawdust Roth - Z98-765432
Description,Amount,Day Change
Available to trade (all settled),510.28,
Available to withdraw,510.28,
Total account value,23736.47,67.64
`;

// A balances export with no resolvable hyphenated account number (identity absent).
const NO_IDENTITY_BALANCES = `Brokerage
Account Name / Account Number,Individual - Z39411514
Description,Amount,Day Change
Available to trade (all settled),7690.00,
Total Account Value,145200.00,
`;

function blob(text: string, filename: string): StoredCsvBlob {
  return { text, filename };
}

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
});

describe("external-ref extraction from a Balances blob", () => {
  it("extracts a normalized hyphenated account reference", () => {
    expect(externalRefFromBalancesBlob(blob(PTS_MARGIN_BALANCES, "pts.csv"))).toBe("Z12-345678");
    expect(externalRefFromBalancesBlob(blob(SAWDUST_ROTH_BALANCES, "roth.csv"))).toBe("Z98-765432");
  });

  it("returns null when identity is absent or the blob is missing/unparseable", () => {
    expect(externalRefFromBalancesBlob(blob(NO_IDENTITY_BALANCES, "x.csv"))).toBeNull();
    expect(externalRefFromBalancesBlob(null)).toBeNull();
    expect(externalRefFromBalancesBlob(blob("not,a,balances,csv", "x.csv"))).toBeNull();
  });
});

describe("per-account evidence read/write isolation", () => {
  it("two accounts hold independent evidence keyed by brokerageAccountId", () => {
    writeAccountCsv("ba-pts", "balances", blob(PTS_MARGIN_BALANCES, "pts.csv"));
    writeAccountCsv("ba-roth", "balances", blob(SAWDUST_ROTH_BALANCES, "roth.csv"));

    expect(readAccountCsv("ba-pts", "balances")?.filename).toBe("pts.csv");
    expect(readAccountCsv("ba-roth", "balances")?.filename).toBe("roth.csv");
    // Writing PTS must not affect Roth.
    expect(readAccountCsv("ba-roth", "balances")?.text).toBe(SAWDUST_ROTH_BALANCES);
    // Absent slot is null.
    expect(readAccountCsv("ba-pts", "activity")).toBeNull();
  });

  it("round-trips per-account evidence across a simulated reload", () => {
    writeAccountCsv("ba-pts", "option-summary", blob("os", "os.csv"));
    // Fresh read (no in-memory cache) mirrors localStorage.
    expect(readAccountCsv("ba-pts", "option-summary")).toEqual(blob("os", "os.csv"));
  });
});

describe("legacy singleton migration — unambiguous identity", () => {
  it("auto-creates a BrokerageAccount and copies legacy blobs into its per-account slot", () => {
    localStorage.setItem(LEGACY_KEY_OS, JSON.stringify(blob("os-text", "os.csv")));
    localStorage.setItem(LEGACY_KEY_BAL, JSON.stringify(blob(PTS_MARGIN_BALANCES, "bal.csv")));
    localStorage.setItem(LEGACY_KEY_ACTIVITY, JSON.stringify(blob("act-text", "act.csv")));

    const result = migrateLegacySingletonEvidence();
    expect(result.kind).toBe("migrated");
    if (result.kind !== "migrated") return;
    expect(result.externalAccountRef).toBe("Z12-345678");

    // Account registered under the external ref.
    const accounts = loadAccounts();
    expect(accounts).toHaveLength(1);
    const resolved = resolveAccountByExternalRef("Z12-345678");
    expect(resolved.kind).toBe("resolved");

    // Evidence copied into the account's per-account slots.
    const baId = result.brokerageAccountId;
    expect(readAccountCsv(baId, "option-summary")).toEqual(blob("os-text", "os.csv"));
    expect(readAccountCsv(baId, "balances")?.text).toBe(PTS_MARGIN_BALANCES);
    expect(readAccountCsv(baId, "activity")).toEqual(blob("act-text", "act.csv"));
  });

  it("is non-destructive: legacy keys remain after migration", () => {
    localStorage.setItem(LEGACY_KEY_BAL, JSON.stringify(blob(PTS_MARGIN_BALANCES, "bal.csv")));
    migrateLegacySingletonEvidence();
    expect(localStorage.getItem(LEGACY_KEY_BAL)).not.toBeNull();
  });

  it("is idempotent: repeat migration does not create a second account or duplicate", () => {
    localStorage.setItem(LEGACY_KEY_BAL, JSON.stringify(blob(PTS_MARGIN_BALANCES, "bal.csv")));
    const first = migrateLegacySingletonEvidence();
    const second = migrateLegacySingletonEvidence();
    expect(first.kind).toBe("migrated");
    expect(second.kind).toBe("already-migrated");
    expect(loadAccounts()).toHaveLength(1);
  });
});

describe("legacy singleton migration — identity not invented", () => {
  it("records legacy-unknown (missing-identity) when no external ref is present", () => {
    localStorage.setItem(LEGACY_KEY_BAL, JSON.stringify(blob(NO_IDENTITY_BALANCES, "bal.csv")));
    const result = migrateLegacySingletonEvidence();
    expect(result.kind).toBe("legacy-unknown");
    if (result.kind === "legacy-unknown") expect(result.reason).toBe("missing-identity");
    // No account fabricated.
    expect(loadAccounts()).toHaveLength(0);
    expect(readLegacyUnknown()?.reason).toBe("missing-identity");
  });

  it("records legacy-unknown (ambiguous-identity) when the ref already maps to >1 account", () => {
    // Pre-seed a corrupted/legacy registry with two accounts sharing the same ref.
    saveAccounts([
      createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-345678", idOverride: "ba-a" }),
      createBrokerageAccount({ broker: "fidelity", externalAccountRef: "Z12-345678", idOverride: "ba-b" }),
    ]);
    localStorage.setItem(LEGACY_KEY_BAL, JSON.stringify(blob(PTS_MARGIN_BALANCES, "bal.csv")));

    const result = migrateLegacySingletonEvidence();
    expect(result.kind).toBe("legacy-unknown");
    if (result.kind === "legacy-unknown") expect(result.reason).toBe("ambiguous-identity");
    // No third account created; existing two untouched.
    expect(loadAccounts()).toHaveLength(2);
  });

  it("is a no-op when there is no legacy evidence at all", () => {
    expect(migrateLegacySingletonEvidence().kind).toBe("no-legacy-evidence");
    expect(loadAccounts()).toHaveLength(0);
  });
});

describe("margin vs non-margin isolation across accounts", () => {
  it("migrating one account never sets another account's evidence/regime", () => {
    // First migrate PTS (margin).
    localStorage.setItem(LEGACY_KEY_BAL, JSON.stringify(blob(PTS_MARGIN_BALANCES, "pts.csv")));
    const pts = migrateLegacySingletonEvidence();
    expect(pts.kind).toBe("migrated");
    if (pts.kind !== "migrated") return;

    // Independently register + attach a Roth (legacy/non-margin) account's evidence.
    writeAccountCsv("ba-roth", "balances", blob(SAWDUST_ROTH_BALANCES, "roth.csv"));

    // PTS balances remain the margin export; Roth remains the legacy export. No crossover.
    expect(readAccountCsv(pts.brokerageAccountId, "balances")?.text).toBe(PTS_MARGIN_BALANCES);
    expect(readAccountCsv("ba-roth", "balances")?.text).toBe(SAWDUST_ROTH_BALANCES);
    expect(readAccountCsv(pts.brokerageAccountId, "balances")?.text).not.toContain("all settled");
    expect(readAccountCsv("ba-roth", "balances")?.text).toContain("all settled");
  });
});

describe("snapshot carries the authoritative brokerageAccountId (not just the external ref)", () => {
  function makeBalances(overrides: Partial<ParsedBalances> = {}): ParsedBalances {
    return {
      availableToTrade: 20000,
      availableToTradeAllSettled: 20000,
      cashAndCredits: 20000,
      totalAccountValue: 40000,
      valueOfInvestments: 20000,
      availableToWithdraw: 20000,
      settledCash: null,
      availableWithoutMarginImpact: null,
      nonMarginBuyingPower: null,
      marginBuyingPower: null,
      cashReservedForOptions: null,
      regimeEvidence: { marginFormatPresent: false, legacyAllSettledPresent: true },
      accountName: "PTS",
      accountNumber: "Z12-345678",
      allRows: [{ label: "Available to trade (all settled)", amount: 20000, dayChange: null, isSubItem: false, rawRow: [] }],
      ...overrides,
    } as ParsedBalances;
  }

  it("stamps the resolved brokerageAccountId while preserving accountId as the external ref", () => {
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: [],
      optionSummaryFilename: "os.csv",
      optionSummaryExportTimestamp: null,
      balances: makeBalances(),
      balancesFilename: "bal.csv",
      balancesExportTimestamp: null,
      brokerageAccountId: "ba-resolved-123",
    });
    expect(snapshot.brokerageAccountId).toBe("ba-resolved-123");
    expect(snapshot.accountId).toBe("Z12-345678");
    expect(snapshot.provenance.brokerageAccountId).toBe("ba-resolved-123");
  });

  it("leaves brokerageAccountId null when the caller does not resolve one (never guessed)", () => {
    const snapshot = buildFidelitySnapshot({
      optionSummaryRows: [],
      optionSummaryFilename: "os.csv",
      optionSummaryExportTimestamp: null,
      balances: makeBalances(),
      balancesFilename: "bal.csv",
      balancesExportTimestamp: null,
    });
    expect(snapshot.brokerageAccountId).toBeNull();
    expect(snapshot.accountId).toBe("Z12-345678");
  });
});
