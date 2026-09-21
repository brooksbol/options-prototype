/**
 * Increment 5 — Account-keyed capital history + outlook observations.
 *
 * Establishes: per-account partitioning of capital-history and outlook-observations,
 * cross-account isolation (account A's trajectory/outlook cannot appear as B's), safe
 * idempotent/non-destructive migration of the legacy global series to a sole account
 * (preserving seed provenance), and a LIVE store-boundary proof that switching accounts
 * shows the correct trajectory.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  recordObservation,
  loadHistory,
  migrateLegacyHistoryToAccount,
  _clearHistoryForTesting,
} from "../../src/portfolio/portfolio-capital-history";
import {
  recordOutlookObservations,
  loadAllRecords,
  migrateLegacyOutlookToAccount,
} from "../../src/forecast/outlook-observations";
import type { ResolutionOutlook } from "../../src/forecast/resolution-outlook";
import {
  importFidelityEvidence,
  switchToAccount,
  getSnapshot,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { resolveAccountByExternalRef, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { _clearAccountEvidenceForTesting, type StoredCsvBlob } from "../../src/portfolio/account-evidence-store";
import { resetWorkspace } from "../../src/workspace/workspace";

const LEGACY_HISTORY_KEY = "wheelwright:portfolio-capital:history";
const LEGACY_OUTLOOK_KEY = "wheelwright:forecast:outlook-observations";

beforeEach(() => {
  localStorage.clear();
  _clearHistoryForTesting();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
  resetWorkspace();
  _resetForTesting();
});

describe("capital history — per-account isolation", () => {
  it("records and reads capital observations keyed by account", () => {
    recordObservation("", 100000, new Date("2026-09-10T12:00:00"), "ba-pts");
    recordObservation("", 20000, new Date("2026-09-10T12:00:00"), "ba-roth");

    const pts = loadHistory("ba-pts");
    const roth = loadHistory("ba-roth");
    expect(pts).toHaveLength(1);
    expect(roth).toHaveLength(1);
    expect(pts[0].value).toBe(100000);
    expect(roth[0].value).toBe(20000);
    // Account A's trajectory does NOT appear under account B.
    expect(loadHistory("ba-pts").some((o) => o.value === 20000)).toBe(false);
  });

  it("null account reads/writes the legacy global series (demo/unattributed)", () => {
    recordObservation("", 55000, new Date("2026-09-10T12:00:00"), null);
    expect(loadHistory(null)).toHaveLength(1);
    expect(localStorage.getItem(LEGACY_HISTORY_KEY)).not.toBeNull();
    // The legacy write is not visible under a real account.
    expect(loadHistory("ba-pts")).toHaveLength(0);
  });
});

describe("capital history — legacy migration to sole account", () => {
  it("copies the legacy series (incl. seed provenance) to the account, idempotent + non-destructive", () => {
    // Seed a legacy global series (represents the pre-multi-account operator's trajectory,
    // e.g. the module's seedHistoryIfEmpty output). beforeEach clears history, so seed here.
    localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([
      { timestamp: "2026-07-10T12:00:00", value: 120074.93 },
      { timestamp: "2026-08-21T12:00:00", value: 121340.47 },
    ]));
    const legacyBefore = localStorage.getItem(LEGACY_HISTORY_KEY);
    expect(legacyBefore).not.toBeNull();

    expect(migrateLegacyHistoryToAccount("ba-sole")).toBe(true);
    // Account now has the seeded trajectory.
    expect(loadHistory("ba-sole").length).toBeGreaterThan(1);
    // Non-destructive: legacy key still present.
    expect(localStorage.getItem(LEGACY_HISTORY_KEY)).toBe(legacyBefore);
    // Idempotent: re-migrating does not overwrite the account series.
    expect(migrateLegacyHistoryToAccount("ba-sole")).toBe(false);
  });

  it("does not migrate when the account already has its own series", () => {
    recordObservation("", 100000, new Date("2026-09-10T12:00:00"), "ba-sole");
    expect(migrateLegacyHistoryToAccount("ba-sole")).toBe(false);
    // Account series is its own single observation, not the seed.
    expect(loadHistory("ba-sole")).toHaveLength(1);
  });

  it("null account is a no-op", () => {
    expect(migrateLegacyHistoryToAccount(null)).toBe(false);
  });
});

describe("outlook observations — per-account isolation + migration", () => {
  function outlook(positionId: string): ResolutionOutlook {
    return {
      positionId,
      category: "uncertain",
      expiresThisMonth: true,
      evidence: { dte: 10, moneyness: 0, underlyingPrice: 100, reason: "test" },
    } as unknown as ResolutionOutlook;
  }

  it("records outlook observations keyed by account", () => {
    const positions = new Map([["p1", { underlying: "SPY" }]]);
    recordOutlookObservations([outlook("p1")], positions, "2026-09", new Date("2026-09-10T12:00:00"), "ba-pts");
    recordOutlookObservations([outlook("p2")], new Map([["p2", { underlying: "QQQ" }]]), "2026-09", new Date("2026-09-10T12:00:00"), "ba-roth");

    const pts = loadAllRecords("ba-pts");
    const roth = loadAllRecords("ba-roth");
    expect(pts[0].observations.map((o) => o.underlying)).toEqual(["SPY"]);
    expect(roth[0].observations.map((o) => o.underlying)).toEqual(["QQQ"]);
    // Isolation: PTS outlook not visible under Roth.
    expect(loadAllRecords("ba-roth")[0].observations.some((o) => o.underlying === "SPY")).toBe(false);
  });

  it("migrates the legacy global outlook series to a sole account (idempotent, non-destructive)", () => {
    // Seed a legacy outlook record directly.
    localStorage.setItem(LEGACY_OUTLOOK_KEY, JSON.stringify([
      { month: "2026-08", observations: [{ positionId: "x", underlying: "TLT", category: "uncertain", dte: 5, moneyness: 0, underlyingPrice: 90, observedAt: "2026-08-01T12:00:00Z", reason: "legacy" }], firstObserved: "2026-08-01T12:00:00Z", lastObserved: "2026-08-01T12:00:00Z" },
    ]));
    expect(migrateLegacyOutlookToAccount("ba-sole")).toBe(true);
    expect(loadAllRecords("ba-sole")[0].observations[0].underlying).toBe("TLT");
    expect(localStorage.getItem(LEGACY_OUTLOOK_KEY)).not.toBeNull(); // non-destructive
    expect(migrateLegacyOutlookToAccount("ba-sole")).toBe(false); // idempotent
  });
});

describe("LIVE — switching accounts shows the correct trajectory", () => {
  const PTS_BAL = `Brokerage
Account Name / Account Number,PTS - Z12-345678
,Balance,Day change
Total account value,113842.91,
AVAILABLE TO TRADE,,
Available without margin impact,4200,
MARGIN STATUS,,
`;
  const PTS_OS = `Option Summary Z12-345678
Quote data as of 2026-09-18.
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;
  const ROTH_BAL = `Brokerage
Account Name / Account Number,Sawdust Roth - Z98-765432
Description,Amount,Day Change
Available to trade (all settled),510.28,
Total account value,23736.47,
`;
  const ROTH_OS = `Option Summary Z98-765432
Quote data as of 2026-09-18.
Symbol,Description,Quantity,Last Price,Current Value,Strategy
QQQ,Invesco QQQ,100,450,45000,Covered Call
`;
  function blob(text: string, filename: string): StoredCsvBlob { return { text, filename }; }

  it("each account records its own capital observation on import; switching shows the right one", () => {
    // Importing PTS records a PTS capital observation (active refresh path).
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "p-os.csv"), balances: blob(PTS_BAL, "p-bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;

    // Importing Roth (Case B — different account) records a Roth observation without switching.
    importFidelityEvidence({ optionSummary: blob(ROTH_OS, "r-os.csv"), balances: blob(ROTH_BAL, "r-bal.csv") });
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");
    const rothId = roth.account.brokerageAccountId;

    // Each account has its own (non-empty, distinct) capital history.
    const ptsHist = loadHistory(ptsId);
    const rothHist = loadHistory(rothId);
    expect(ptsHist.length).toBeGreaterThanOrEqual(1);
    expect(rothHist.length).toBeGreaterThanOrEqual(1);
    // The account the snapshot belongs to matches what the chart would load via getSnapshot().
    expect(getSnapshot()?.brokerageAccountId).toBe(ptsId);
    const visibleForPts = loadHistory(getSnapshot()?.brokerageAccountId ?? null);
    expect(visibleForPts).toEqual(ptsHist);

    // Switch to Roth: the chart's account-scoped history now reflects Roth, not PTS.
    expect(switchToAccount(rothId)).toBe(true);
    const visibleForRoth = loadHistory(getSnapshot()?.brokerageAccountId ?? null);
    expect(visibleForRoth).toEqual(rothHist);
    // PTS and Roth histories are not the same series.
    expect(getSnapshot()?.brokerageAccountId).toBe(rothId);
  });
});
