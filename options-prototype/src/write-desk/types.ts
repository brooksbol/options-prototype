/**
 * Write Desk — Domain Types
 *
 * Normalized portfolio snapshot and operational types.
 * Broker-neutral: downstream pipeline consumes these regardless of source.
 */

// --- Portfolio Snapshot Source ---

export type PortfolioSourceType = "fidelity" | "demo";

export interface PortfolioSnapshotSourceDescriptor {
  type: PortfolioSourceType;
  label: string;
  /** Filenames for file-based sources */
  filenames?: string[];
}

// --- Position Economics ---

export interface PositionEconomics {
  /** Average cost per share (broker-reported) */
  averageCostPerShare: number | null;
  /** Total cost basis for the position */
  costBasis: number | null;
  /** Current market value */
  marketValue: number | null;
}

// --- Inventory ---

export interface InventoryPosition {
  symbol: string;
  sharesOwned: number;
  sharesEncumbered: number;
  sharesFree: number;
  maxAdditionalContracts: number;
  /** Position economics from brokerage (null when unavailable, e.g. demo mode) */
  economics: PositionEconomics | null;
}

// --- Existing Option Positions ---

export interface OpenShortCall {
  symbol: string;
  underlying: string;
  strike: number;
  expiration: string;
  quantity: number;
  /** Broker-reported option cost basis (negative = credit received). Null when unavailable. */
  brokerOptionBasis: number | null;
  /** Broker-reported average cost per contract (negative = credit/share). Null when unavailable. */
  brokerOptionAverageCost: number | null;
  /**
   * Entry origin when provable from transaction evidence.
   * "buy-write" = share acquisition and call STO occurred in the same transaction context
   * (same day, matching underlying and quantity).
   * null/undefined = origin unknown; position is a generic covered call.
   * This is provenance, not inference from coincident state.
   */
  origin?: "buy-write" | null;
}

export interface OpenShortPut {
  symbol: string;
  underlying: string;
  strike: number;
  expiration: string;
  quantity: number;
  /** Broker-reported option cost basis (negative = credit received). Null when unavailable. */
  brokerOptionBasis: number | null;
  /** Broker-reported average cost per contract (negative = credit/share). Null when unavailable. */
  brokerOptionAverageCost: number | null;
}

// --- Balance Context ---

export interface BalanceContext {
  availableToTrade: number;
  cashAndCredits: number;
  totalAccountValue: number;
  valueOfInvestments: number;
  availableToWithdraw: number | null;
}

// --- Provenance ---

export interface PortfolioSnapshotProvenance {
  sourceType: PortfolioSourceType;
  sourceLabel: string;
  /** ISO timestamp when the snapshot was created/loaded */
  createdAt: string;
  /** For file-based sources */
  optionSummaryFilename?: string;
  optionSummaryExportTimestamp?: string;
  optionSummaryParsedAt?: string;
  balancesFilename?: string;
  balancesExportTimestamp?: string;
  balancesParsedAt?: string;
  /** Account identifier when available */
  accountId?: string;
}

// --- Readiness ---

export type SnapshotStatus = "INCOMPLETE" | "READY" | "STALE" | "CONFLICTED" | "REFRESH_NEEDED";

export interface SnapshotReadiness {
  status: SnapshotStatus;
  optionSummaryLoaded: boolean;
  balancesLoaded: boolean;
  inventoryValid: boolean;
  cashStateValid: boolean;
  timestampsReconciled: boolean;
  timeSeparationMinutes: number | null;
  warnings: string[];
  blockReasons: string[];
}

// --- Portfolio Snapshot (normalized, broker-neutral) ---

export interface PortfolioSnapshot {
  id: string;
  source: PortfolioSnapshotSourceDescriptor;
  accountId: string | null;
  snapshotDate: string | null;
  inventory: InventoryPosition[];
  existingCalls: OpenShortCall[];
  existingPuts: OpenShortPut[];
  /**
   * Authoritative deployable cash.
   * When sourced from Fidelity balances CSV, this is "Available to trade (all settled)"
   * which already accounts for open-order commitments. Do NOT subtract open-order
   * reservations from this value — Fidelity has already done so.
   */
  deployableCash: number | null;
  balanceContext: BalanceContext | null;
  provenance: PortfolioSnapshotProvenance;
  readiness: SnapshotReadiness;
}
