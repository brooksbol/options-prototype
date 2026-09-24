/**
 * Fidelity Portfolio Snapshot Builder.
 *
 * Converts parsed Option Summary rows + Balances into a normalized PortfolioSnapshot.
 *
 * Derives:
 *   - Inventory (owned shares, encumbered, free, max contracts)
 *   - Existing short calls and puts
 *   - Deployable cash (regime-aware; see deriveDeployableCash in balancesParser)
 *   - Readiness and warnings
 */

import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../csv/fidelity/balancesParser";
import { deriveDeployableCash } from "../csv/fidelity/balancesParser";
import type {
  PortfolioSnapshot,
  InventoryPosition,
  OpenShortCall,
  OpenShortPut,
  BalanceContext,
  SnapshotReadiness,
  SnapshotStatus,
  PortfolioSnapshotProvenance,
} from "./types";

// --- Snapshot Input ---

export interface FidelitySnapshotInput {
  optionSummaryRows: OptionSummaryRow[];
  optionSummaryFilename: string;
  optionSummaryExportTimestamp: string | null;
  balances: ParsedBalances;
  balancesFilename: string;
  balancesExportTimestamp: string | null;
  /**
   * Stable Wheelwright BrokerageAccount identity that owns this snapshot (Increment 2).
   * Resolved by the caller from the BrokerageAccount registry using the broker external
   * reference. Null/omitted for legacy/unresolved state — the snapshot is then not yet
   * attributed to an account (never guessed here).
   */
  brokerageAccountId?: string | null;
  /**
   * Authoritative aggregate share ownership per (uppercased) symbol from the Fidelity
   * Positions export (ADR-020). When present, it is the source of truth for `sharesOwned`
   * and resolves the additive-lot-vs-repeated-strategy ambiguity that the Option Summary
   * alone cannot (BUG-026). When absent, inventory falls back to the conservative observed
   * Option Summary value; ownership is never inferred from short-call geometry.
   */
  authoritativeOwnership?: Map<string, number> | null;
  positionsFilename?: string | null;
  positionsExportTimestamp?: string | null;
}

// --- Builder ---

export function buildFidelitySnapshot(input: FidelitySnapshotInput): PortfolioSnapshot {
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // Derive inventory from Option Summary, using Positions as the authoritative ownership
  // source when available (ADR-020).
  const inventory = deriveInventory(input.optionSummaryRows, input.authoritativeOwnership ?? null);

  // Derive existing short options
  const existingCalls = deriveExistingShortCalls(input.optionSummaryRows);
  const existingPuts = deriveExistingShortPuts(input.optionSummaryRows);

  // Aggregate short-option mark-to-market: sum of marketValue for all short option rows.
  // This is negative (representing the cost-to-close / liability).
  // Used by Portfolio Capital: PC = totalAccountValue − aggregateShortOptionMTM.
  const shortOptionRows = input.optionSummaryRows.filter(
    (r) => r.positionType === "option" && r.quantity < 0 && r.marketValue != null
  );
  const aggregateShortOptionMTM = shortOptionRows.length > 0
    ? shortOptionRows.reduce((sum, r) => sum + r.marketValue!, 0)
    : null;

  // Cash authority — regime-aware unlevered Deployable (BUG-022).
  // LEGACY_CASH → "Available to trade (all settled)"; MARGIN → "Available without
  // margin impact"; INDETERMINATE → null (readiness fails closed). "Non-margin buying
  // power" is never used as Deployable. No independent reserve-netting is applied.
  const deployableCash = deriveDeployableCash(input.balances);

  // Balance context
  const balanceContext: BalanceContext | null = input.balances.totalAccountValue != null ? {
    availableToTrade: input.balances.availableToTrade ?? 0,
    cashAndCredits: input.balances.cashAndCredits ?? 0,
    totalAccountValue: input.balances.totalAccountValue ?? 0,
    valueOfInvestments: input.balances.valueOfInvestments ?? 0,
    availableToWithdraw: input.balances.availableToWithdraw,
  } : null;

  // Account reconciliation.
  // `accountId` is the raw EXTERNAL broker reference (evidence). `brokerageAccountId` is
  // the stable Wheelwright identity resolved by the caller — the authoritative partition
  // key. It is never inferred from broker data here.
  const accountId = input.balances.accountNumber ?? null;
  const brokerageAccountId = input.brokerageAccountId ?? null;

  // Readiness
  const readiness = evaluateReadiness(input, inventory, deployableCash);

  // Provenance
  const provenance: PortfolioSnapshotProvenance = {
    sourceType: "fidelity",
    sourceLabel: "Fidelity Snapshot",
    createdAt: now,
    optionSummaryFilename: input.optionSummaryFilename,
    optionSummaryExportTimestamp: input.optionSummaryExportTimestamp ?? undefined,
    optionSummaryParsedAt: now,
    balancesFilename: input.balancesFilename,
    balancesExportTimestamp: input.balancesExportTimestamp ?? undefined,
    balancesParsedAt: now,
    positionsFilename: input.positionsFilename ?? undefined,
    positionsExportTimestamp: input.positionsExportTimestamp ?? undefined,
    positionsParsedAt: input.authoritativeOwnership ? now : undefined,
    ownershipFromPositions: input.authoritativeOwnership != null,
    accountId: accountId ?? undefined,
    brokerageAccountId: brokerageAccountId ?? undefined,
  };

  return {
    id: `fidelity-${Date.now()}`,
    source: {
      type: "fidelity",
      label: "Fidelity Snapshot",
      filenames: [input.optionSummaryFilename, input.balancesFilename],
    },
    brokerageAccountId,
    accountId,
    snapshotDate: today,
    inventory,
    existingCalls,
    existingPuts,
    deployableCash,
    aggregateShortOptionMTM,
    balanceContext,
    provenance,
    readiness,
  };
}

// --- Inventory Derivation ---

function deriveInventory(
  rows: OptionSummaryRow[],
  authoritativeOwnership: Map<string, number> | null,
): InventoryPosition[] {
  // Find share positions from Option Summary
  const shareRows = rows.filter((r) => r.positionType === "share" && r.quantity > 0);

  // Group by symbol.
  //
  // OWNERSHIP AUTHORITY (ADR-020):
  //   - When the Positions export supplies authoritative aggregate ownership for a symbol,
  //     that value is the source of truth for `owned` (it correctly reflects genuinely
  //     additive lots — BUG-026). `observedOs` is retained only to select the economics row.
  //   - When Positions is absent for a symbol, fall back to the conservative observed
  //     Option Summary value: MAX across repeated strategy-view rows (NOT sum, since those
  //     rows may represent the same shares viewed from different strategies). This can
  //     undercount genuinely-additive lots, but ownership is never inferred from call
  //     geometry — undercount is preferred to manufactured certainty.
  const symbolMap = new Map<string, {
    owned: number;
    ownedFromPositions: boolean;
    observedOs: number;
    encumbered: number;
    avgCost: number | null;
    costBasis: number | null;
    marketValue: number | null;
  }>();

  for (const row of shareRows) {
    const symbol = row.symbol.toUpperCase();
    const existing = symbolMap.get(symbol);
    if (!existing) {
      symbolMap.set(symbol, {
        owned: row.quantity,
        ownedFromPositions: false,
        observedOs: row.quantity,
        encumbered: 0,
        avgCost: row.averageCost,
        costBasis: row.costBasis,
        marketValue: row.marketValue,
      });
    } else if (row.quantity > existing.observedOs) {
      // Track the largest observed Option Summary row for economics selection (canonical
      // view) and for the degraded-fallback owned value.
      existing.observedOs = row.quantity;
      existing.avgCost = row.averageCost;
      existing.costBasis = row.costBasis;
      existing.marketValue = row.marketValue;
    }
  }

  // Apply the authoritative Positions ownership where available (ADR-020). This overrides
  // the observed Option Summary value for symbols Positions reports.
  if (authoritativeOwnership) {
    for (const [symbol, data] of symbolMap) {
      const authoritative = authoritativeOwnership.get(symbol);
      if (authoritative != null) {
        data.owned = authoritative;
        data.ownedFromPositions = true;
      } else {
        data.owned = data.observedOs;
      }
    }
    // A symbol can be owned (Positions) and carry short calls without ever appearing as an
    // Option Summary "share" row. Seed those symbols from authoritative ownership so their
    // covered geometry reconciles instead of falsely warning.
    for (const [symbol, shares] of authoritativeOwnership) {
      if (!symbolMap.has(symbol) && shares > 0) {
        symbolMap.set(symbol, {
          owned: shares,
          ownedFromPositions: true,
          observedOs: 0,
          encumbered: 0,
          avgCost: null,
          costBasis: null,
          marketValue: null,
        });
      }
    }
  } else {
    // Degraded (no Positions): conservative observed Option Summary value.
    for (const [, data] of symbolMap) {
      data.owned = data.observedOs;
    }
  }

  // Count encumbered shares from short call option positions
  const shortCalls = rows.filter((r) =>
    r.positionType === "option" &&
    r.option &&
    r.option.type === "CALL" &&
    r.quantity < 0 // short position
  );

  for (const call of shortCalls) {
    if (!call.option) continue;
    const underlying = call.option.underlying.toUpperCase();
    const existing = symbolMap.get(underlying);
    if (existing) {
      // Each short call contract encumbers 100 shares
      existing.encumbered += Math.abs(call.quantity) * 100;
    }
  }

  // Build inventory positions
  const inventory: InventoryPosition[] = [];
  for (const [symbol, data] of symbolMap) {
    const sharesFree = Math.max(0, data.owned - data.encumbered);
    inventory.push({
      symbol,
      sharesOwned: data.owned,
      sharesEncumbered: Math.min(data.encumbered, data.owned),
      sharesFree,
      maxAdditionalContracts: Math.floor(sharesFree / 100),
      economics: data.avgCost != null || data.costBasis != null || data.marketValue != null
        ? { averageCostPerShare: data.avgCost, costBasis: data.costBasis, marketValue: data.marketValue }
        : null,
      ownershipAuthority: data.ownedFromPositions ? "positions" : "option-summary",
    });
  }

  return inventory.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

// --- Existing Short Calls ---

function deriveExistingShortCalls(rows: OptionSummaryRow[]): OpenShortCall[] {
  return rows
    .filter((r) => r.positionType === "option" && r.option && r.option.type === "CALL" && r.quantity < 0)
    .map((r) => ({
      symbol: r.symbol,
      underlying: r.option!.underlying.toUpperCase(),
      strike: r.option!.strike,
      expiration: r.option!.expiration,
      quantity: Math.abs(r.quantity),
      brokerOptionBasis: r.costBasis,
      brokerOptionAverageCost: r.averageCost,
    }));
}

// --- Existing Short Puts ---

function deriveExistingShortPuts(rows: OptionSummaryRow[]): OpenShortPut[] {
  return rows
    .filter((r) => r.positionType === "option" && r.option && r.option.type === "PUT" && r.quantity < 0)
    .map((r) => ({
      symbol: r.symbol,
      underlying: r.option!.underlying.toUpperCase(),
      strike: r.option!.strike,
      expiration: r.option!.expiration,
      quantity: Math.abs(r.quantity),
      brokerOptionBasis: r.costBasis,
      brokerOptionAverageCost: r.averageCost,
    }));
}

// --- Readiness Evaluation ---

function evaluateReadiness(
  input: FidelitySnapshotInput,
  inventory: InventoryPosition[],
  deployableCash: number | null
): SnapshotReadiness {
  const warnings: string[] = [];
  const blockReasons: string[] = [];

  const optionSummaryLoaded = input.optionSummaryRows.length > 0;
  const balancesLoaded = input.balances.allRows.length > 0;
  const inventoryValid = inventory.length > 0 || optionSummaryLoaded;
  const cashStateValid = deployableCash != null;

  if (!optionSummaryLoaded) blockReasons.push("Option Summary not loaded or empty.");
  if (!balancesLoaded) blockReasons.push("Balances not loaded or empty.");
  if (!cashStateValid) blockReasons.push("Could not extract deployable cash from Balances.");

  // Timestamp reconciliation
  let timestampsReconciled = true;
  let timeSeparationMinutes: number | null = null;

  if (input.optionSummaryExportTimestamp && input.balancesExportTimestamp) {
    const osTime = new Date(input.optionSummaryExportTimestamp).getTime();
    const balTime = new Date(input.balancesExportTimestamp).getTime();
    if (!isNaN(osTime) && !isNaN(balTime)) {
      timeSeparationMinutes = Math.abs(osTime - balTime) / (1000 * 60);
      if (timeSeparationMinutes > 30) {
        warnings.push(`Portfolio exports are ${Math.round(timeSeparationMinutes)} minutes apart and may reflect intervening activity.`);
      }
    }
  } else {
    timestampsReconciled = false;
    warnings.push("Export timestamps not available from both files. Cannot verify synchronization.");
  }

  // Determine status
  let status: SnapshotStatus;
  if (blockReasons.length > 0) {
    status = "INCOMPLETE";
  } else if (warnings.some((w) => w.includes("different account"))) {
    status = "CONFLICTED";
  } else {
    status = "READY";
  }

  return {
    status,
    optionSummaryLoaded,
    balancesLoaded,
    inventoryValid,
    cashStateValid,
    timestampsReconciled,
    timeSeparationMinutes,
    warnings,
    blockReasons,
  };
}
