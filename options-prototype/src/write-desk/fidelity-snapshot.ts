/**
 * Fidelity Portfolio Snapshot Builder.
 *
 * Converts parsed Option Summary rows + Balances into a normalized PortfolioSnapshot.
 *
 * Derives:
 *   - Inventory (owned shares, encumbered, free, max contracts)
 *   - Existing short calls and puts
 *   - Deployable cash (direct from Balances "Available to Trade, All Settled")
 *   - Readiness and warnings
 */

import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../csv/fidelity/balancesParser";
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
}

// --- Builder ---

export function buildFidelitySnapshot(input: FidelitySnapshotInput): PortfolioSnapshot {
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // Derive inventory from Option Summary
  const inventory = deriveInventory(input.optionSummaryRows);

  // Derive existing short options
  const existingCalls = deriveExistingShortCalls(input.optionSummaryRows);
  const existingPuts = deriveExistingShortPuts(input.optionSummaryRows);

  // Cash authority — direct assignment
  const deployableCash = input.balances.availableToTradeAllSettled
    ?? input.balances.availableToTrade;

  // Balance context
  const balanceContext: BalanceContext | null = input.balances.totalAccountValue != null ? {
    availableToTrade: input.balances.availableToTrade ?? 0,
    cashAndCredits: input.balances.cashAndCredits ?? 0,
    totalAccountValue: input.balances.totalAccountValue ?? 0,
    valueOfInvestments: input.balances.valueOfInvestments ?? 0,
    availableToWithdraw: input.balances.availableToWithdraw,
  } : null;

  // Account reconciliation
  const accountId = input.balances.accountNumber ?? null;

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
    accountId: accountId ?? undefined,
  };

  return {
    id: `fidelity-${Date.now()}`,
    source: {
      type: "fidelity",
      label: "Fidelity Snapshot",
      filenames: [input.optionSummaryFilename, input.balancesFilename],
    },
    accountId,
    snapshotDate: today,
    inventory,
    existingCalls,
    existingPuts,
    deployableCash,
    balanceContext,
    provenance,
    readiness,
  };
}

// --- Inventory Derivation ---

function deriveInventory(rows: OptionSummaryRow[]): InventoryPosition[] {
  // Find share positions from Option Summary
  const shareRows = rows.filter((r) => r.positionType === "share" && r.quantity > 0);

  // Group by symbol (Fidelity may repeat shares across strategy views)
  const symbolMap = new Map<string, { owned: number; encumbered: number }>();

  for (const row of shareRows) {
    const symbol = row.symbol.toUpperCase();
    const existing = symbolMap.get(symbol);
    if (!existing) {
      symbolMap.set(symbol, { owned: row.quantity, encumbered: 0 });
    }
    // Fidelity repeats share rows per strategy — use the maximum seen quantity
    // (not sum, since they represent the same shares viewed from different strategies)
    if (existing && row.quantity > existing.owned) {
      existing.owned = row.quantity;
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
