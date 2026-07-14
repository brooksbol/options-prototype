/**
 * Demo Portfolio Snapshot Source.
 *
 * Produces a complete, deterministic PortfolioSnapshot without requiring
 * any file uploads. Exercises both put and call paths:
 *
 * - XLE: 200 shares, 100 encumbered (1 short call), 100 free → 1 contract available
 * - QQQ: 300 shares, 300 encumbered (3 short calls), 0 free
 * - IWM: 75 shares, 0 encumbered → below 1 lot
 * - SPYI: 50 shares, 0 encumbered → below 1 lot
 *
 * Existing short puts: XLF $42 Aug 15, XLU $70 Aug 22
 * Deployable cash: $18,500 (constrains put candidates meaningfully)
 *
 * This fixture is intentionally designed so that:
 * - One symbol has free call capacity (XLE)
 * - One symbol is fully encumbered (QQQ)
 * - Two positions are below 100 shares
 * - Existing puts are visible as exposure context
 * - Cash constrains some but not all affordable put candidates
 */

import type { PortfolioSnapshot } from "./types";

const DEMO_ID = "demo-portfolio-v1";

export function createDemoSnapshot(): PortfolioSnapshot {
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  return {
    id: DEMO_ID,
    source: {
      type: "demo",
      label: "Demo Portfolio",
    },
    accountId: "DEMO-001",
    snapshotDate: today,

    inventory: [
      {
        symbol: "XLE",
        sharesOwned: 200,
        sharesEncumbered: 100,
        sharesFree: 100,
        maxAdditionalContracts: 1,
      },
      {
        symbol: "QQQ",
        sharesOwned: 300,
        sharesEncumbered: 300,
        sharesFree: 0,
        maxAdditionalContracts: 0,
      },
      {
        symbol: "IWM",
        sharesOwned: 75,
        sharesEncumbered: 0,
        sharesFree: 75,
        maxAdditionalContracts: 0, // below 100
      },
      {
        symbol: "SPYI",
        sharesOwned: 50,
        sharesEncumbered: 0,
        sharesFree: 50,
        maxAdditionalContracts: 0, // below 100
      },
    ],

    existingCalls: [
      {
        symbol: "-XLE260815C95",
        underlying: "XLE",
        strike: 95,
        expiration: "2026-08-15",
        quantity: 1,
      },
      {
        symbol: "-QQQ260815C520",
        underlying: "QQQ",
        strike: 520,
        expiration: "2026-08-15",
        quantity: 3,
      },
    ],

    existingPuts: [
      {
        symbol: "-XLF260815P42",
        underlying: "XLF",
        strike: 42,
        expiration: "2026-08-15",
        quantity: 1,
      },
      {
        symbol: "-XLU260822P70",
        underlying: "XLU",
        strike: 70,
        expiration: "2026-08-22",
        quantity: 1,
      },
    ],

    deployableCash: 18500,

    balanceContext: {
      availableToTrade: 18500,
      cashAndCredits: 22340,
      totalAccountValue: 145200,
      valueOfInvestments: 122860,
      availableToWithdraw: 18500,
    },

    provenance: {
      sourceType: "demo",
      sourceLabel: "Demo Portfolio",
      createdAt: now,
      accountId: "DEMO-001",
    },

    readiness: {
      status: "READY",
      optionSummaryLoaded: true,
      balancesLoaded: true,
      inventoryValid: true,
      cashStateValid: true,
      timestampsReconciled: true,
      timeSeparationMinutes: 0,
      warnings: [],
      blockReasons: [],
    },
  };
}
