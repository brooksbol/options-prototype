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

/**
 * Activity-derived acquisition basis for shares associated with a specific BW call.
 *
 * This is separately provenanced evidence — NOT a rewrite of InventoryPosition.economics.
 * It represents the actual fill price from the Activity History purchase event that was
 * temporally correlated with this call's sell-to-open.
 *
 * Confidence tiers:
 * - "unique": one-to-one mapping from Activity evidence. The acquisition price is
 *   unambiguously attributable to the shares backing this specific call.
 * - "batch": same-day purchase quantity supports multiple BW calls, but individual
 *   fill-to-call pairing is not provable. Price is the batch-level VWAP.
 */
export interface CallAcquisitionBasis {
  /** Per-share acquisition cost (from Activity purchase evidence) */
  pricePerShare: number;
  /** Total shares in this attribution scope */
  shares: number;
  /** The correlation date (STO date = purchase date) */
  date: string;
  /** Attribution confidence */
  confidence: "unique" | "batch";
}

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
  /**
   * Activity-derived acquisition basis for the shares associated with this call.
   * Present only when Activity evidence proves BW origin AND captures the purchase price.
   * This is per-call evidence, NOT the symbol-level blended average from Option Summary.
   */
  acquisitionBasis?: CallAcquisitionBasis | null;
  /**
   * Authoritative date when this position was opened (sell-to-open).
   * Derived from Activity evidence Run Date. ISO date string (YYYY-MM-DD).
   * Null when Activity evidence is unavailable or does not contain a matching STO event.
   */
  openedDate?: string | null;
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
  /**
   * Authoritative date when this position was opened (sell-to-open).
   * Derived from Activity evidence Run Date. ISO date string (YYYY-MM-DD).
   * Null when Activity evidence is unavailable or does not contain a matching STO event.
   */
  openedDate?: string | null;
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
  /** External broker account reference when available (evidence, not identity). */
  accountId?: string;
  /** Stable Wheelwright BrokerageAccount identity that owns this snapshot, when resolved. */
  brokerageAccountId?: string;
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
  /**
   * Stable Wheelwright BrokerageAccount identity that owns this snapshot (Increment 2).
   *
   * This is the AUTHORITATIVE account-local partition key (PL-PORT-01 account-locality
   * invariant). It is minted/resolved by the BrokerageAccount registry, never derived
   * from broker data. Null only for demo snapshots or legacy/unknown-account state that
   * has not yet been resolved to an account.
   *
   * Distinct from `accountId` below, which is the raw EXTERNAL broker account reference
   * (evidence, not identity). A broker renumbering the external reference never changes
   * `brokerageAccountId`.
   */
  brokerageAccountId: string | null;
  /**
   * External broker account reference (e.g. Fidelity "XXXX-1234") as reported by broker
   * evidence, or null. EVIDENCE / provenance only — never used as a partition key. Used
   * to RESOLVE a `brokerageAccountId`; the resolved identity is what state is keyed by.
   */
  accountId: string | null;
  snapshotDate: string | null;
  inventory: InventoryPosition[];
  existingCalls: OpenShortCall[];
  existingPuts: OpenShortPut[];
  /**
   * Authoritative unlevered deployable cash (Wheelwright put-writing capacity).
   *
   * When sourced from a Fidelity Balances CSV this is derived regime-aware by
   * `deriveDeployableCash` (see `csv/fidelity/balancesParser`), NOT read from a single
   * fixed field (BUG-022):
   *   - Legacy / non-margin export → "Available to trade (all settled)"
   *   - Margin-enabled export      → "Available without margin impact"
   *   - Indeterminate regime       → null (readiness fails closed)
   *
   * "Non-margin buying power" is never used here — on a margin account it reflects
   * margin-inclusive capacity, not unlevered deployable cash. Consumers must not
   * independently subtract "Cash reserved for options strategies" from this value; no
   * authoritative evidence establishes that Fidelity's availability figures are
   * pre-reserve, and re-subtracting would double-net.
   */
  deployableCash: number | null;
  /**
   * Aggregate mark-to-market value of all open short option positions (negative).
   * From Fidelity Option Summary CSV: sum of marketValue for all option rows with quantity < 0.
   * Used in Portfolio Capital derivation: PC = totalAccountValue − aggregateShortOptionMTM.
   * Null when Option Summary data is unavailable or no short options exist.
   */
  aggregateShortOptionMTM: number | null;
  balanceContext: BalanceContext | null;
  provenance: PortfolioSnapshotProvenance;
  readiness: SnapshotReadiness;
}
