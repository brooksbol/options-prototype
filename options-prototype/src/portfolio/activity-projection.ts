/**
 * Activity Projection — applies post-checkpoint Activity events onto a PortfolioSnapshot.
 *
 * Architecture: authoritative Option Summary checkpoint + subsequent executed Activity = current state.
 *
 * The Option Summary represents what Fidelity knew at its quoteDate.
 * Activity events that occurred AFTER that quoteDate are projected on top to produce
 * the operator's current portfolio state — even for unsettled same-day executions.
 *
 * Reconciliation: when a newer Option Summary incorporates previously projected events,
 * it becomes the new checkpoint and those events are no longer projected (no double-counting).
 */

import type { PortfolioSnapshot } from "../write-desk/types";
import type { ActivityRow } from "../csv/fidelity/activityParser";
import type { InventoryPosition, OpenShortCall, OpenShortPut } from "../write-desk/types";

// --- Temporal Boundary ---

/**
 * Parse the Option Summary quoteDate into a comparable timestamp.
 * Fidelity format: "Aug 12, 2026 4:00 PM ET" or similar.
 * Falls back to start-of-day if time cannot be parsed.
 */
export function parseCheckpointTimestamp(quoteDate: string | null | undefined): Date {
  if (!quoteDate) return new Date(0); // No checkpoint — project everything

  // Try native Date parse (handles many formats)
  const parsed = new Date(quoteDate);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try extracting date portion
  const dateMatch = quoteDate.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (dateMatch) {
    const monthNames: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = monthNames[dateMatch[1].toLowerCase().slice(0, 3)] ?? 0;
    const day = parseInt(dateMatch[2]);
    const year = parseInt(dateMatch[3]);

    // Try to extract time
    const timeMatch = quoteDate.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    let hours = 0;
    let minutes = 0;
    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = parseInt(timeMatch[2]);
      if (timeMatch[3]?.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (timeMatch[3]?.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    return new Date(year, month, day, hours, minutes);
  }

  return new Date(0); // Cannot parse — project everything
}

/**
 * Parse an Activity row's date into a comparable timestamp.
 * Activity dates are ISO (YYYY-MM-DD) without intraday time.
 * We treat activity as occurring at end-of-day for comparison with intraday checkpoints.
 */
function activityTimestamp(row: ActivityRow): Date {
  if (!row.date) return new Date(0);
  // ISO date — treat as end of trading day (4 PM ET = 20:00 UTC roughly)
  const d = new Date(row.date + "T16:00:00");
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Determine if an Activity row should be projected (occurred after the checkpoint).
 *
 * Same-day logic: if Activity date equals checkpoint date AND we have intraday
 * checkpoint time, Activity rows are assumed to have occurred after market close
 * (conservative: they project). If the checkpoint is end-of-day, same-day activity
 * is NOT projected (it's already in the snapshot).
 */
function isAfterCheckpoint(row: ActivityRow, checkpoint: Date): boolean {
  const eventTime = activityTimestamp(row);
  // Strict: event must be after checkpoint
  return eventTime.getTime() > checkpoint.getTime();
}

// --- Projection ---

export interface ProjectionResult {
  snapshot: PortfolioSnapshot;
  projectedEventCount: number;
  projectedSymbols: string[];
}

/**
 * Project Activity events onto an existing PortfolioSnapshot.
 *
 * Only events AFTER the checkpoint timestamp are applied.
 * Produces a new snapshot with additional inventory, calls, puts, and cash adjustments.
 */
export function projectActivityOverlay(
  baseSnapshot: PortfolioSnapshot,
  activityRows: ActivityRow[],
  checkpointTimestamp: Date,
): ProjectionResult {
  // Filter to post-checkpoint events only
  const postCheckpoint = activityRows.filter(row => isAfterCheckpoint(row, checkpointTimestamp));

  if (postCheckpoint.length === 0) {
    return { snapshot: baseSnapshot, projectedEventCount: 0, projectedSymbols: [] };
  }

  // Sort chronologically (Activity CSV is newest-first)
  const chronological = [...postCheckpoint].sort((a, b) => a.date.localeCompare(b.date));

  // Clone mutable state from snapshot
  const inventory: InventoryPosition[] = baseSnapshot.inventory.map(p => ({ ...p }));
  const existingCalls: OpenShortCall[] = [...baseSnapshot.existingCalls];
  const existingPuts: OpenShortPut[] = [...baseSnapshot.existingPuts];
  let deployableCash = baseSnapshot.deployableCash;

  const projectedSymbols = new Set<string>();

  for (const row of chronological) {
    switch (row.eventType) {
      case "shares_bought_direct": {
        // Direct share purchase — add to inventory.
        // NOTE: Do NOT deduct cash here. The Balances CSV ("Available to Trade, All Settled")
        // already reflects same-day purchases because Fidelity deducts immediately.
        // Deducting again would double-count.
        const symbol = (row.symbol || "").toUpperCase();
        if (!symbol) break;
        const shares = Math.abs(row.quantity);
        const costPerShare = row.price ?? 0;
        const totalCost = Math.abs(row.amount ?? (shares * costPerShare));

        const existing = inventory.find(p => p.symbol === symbol);
        if (existing) {
          existing.sharesOwned += shares;
          existing.sharesFree += shares;
          existing.maxAdditionalContracts = Math.floor(existing.sharesFree / 100);
        } else {
          inventory.push({
            symbol,
            sharesOwned: shares,
            sharesEncumbered: 0,
            sharesFree: shares,
            maxAdditionalContracts: Math.floor(shares / 100),
            economics: { averageCostPerShare: costPerShare, costBasis: totalCost, marketValue: null },
          });
        }

        projectedSymbols.add(symbol);
        break;
      }

      case "sell_to_open": {
        // Option sold to open — do NOT add premium to cash (Balances already reflects it).
        if (!row.option) break;

        if (row.option.type === "CALL") {
          const underlying = row.option.underlying.toUpperCase();

          // Check if this call already exists (from Option Summary) — avoid duplicates
          const alreadyExists = existingCalls.some(c =>
            c.underlying === underlying &&
            c.strike === row.option!.strike &&
            c.expiration === row.option!.expiration
          );

          if (!alreadyExists) {
            existingCalls.push({
              symbol: row.symbol,
              underlying,
              strike: row.option.strike,
              expiration: row.option.expiration,
              quantity: Math.abs(row.quantity),
              brokerOptionBasis: null,
              brokerOptionAverageCost: null,
            });
          }

          // Encumber shares
          const holding = inventory.find(p => p.symbol === underlying);
          if (holding) {
            const encumber = Math.abs(row.quantity) * 100;
            holding.sharesEncumbered += encumber;
            holding.sharesFree = Math.max(0, holding.sharesOwned - holding.sharesEncumbered);
            holding.maxAdditionalContracts = Math.floor(holding.sharesFree / 100);
          }
          projectedSymbols.add(underlying);
        } else if (row.option.type === "PUT") {
          const underlying = row.option.underlying.toUpperCase();

          // Check if this put already exists — avoid duplicates
          const alreadyExists = existingPuts.some(p =>
            p.underlying === underlying &&
            p.strike === row.option!.strike &&
            p.expiration === row.option!.expiration
          );

          if (!alreadyExists) {
            existingPuts.push({
              symbol: row.symbol,
              underlying,
              strike: row.option.strike,
              expiration: row.option.expiration,
              quantity: Math.abs(row.quantity),
            });
          }

          projectedSymbols.add(underlying);
        }
        break;
      }

      case "shares_sold_direct": {
        // Direct share sale — remove from inventory
        const symbol = (row.symbol || "").toUpperCase();
        if (!symbol) break;
        const shares = Math.abs(row.quantity);
        const proceeds = Math.abs(row.amount ?? 0);

        const existing = inventory.find(p => p.symbol === symbol);
        if (existing) {
          existing.sharesOwned -= shares;
          existing.sharesFree = Math.max(0, existing.sharesOwned - existing.sharesEncumbered);
          existing.maxAdditionalContracts = Math.floor(existing.sharesFree / 100);
          if (existing.sharesOwned <= 0) {
            inventory.splice(inventory.indexOf(existing), 1);
          }
        }

        deployableCash += proceeds;
        projectedSymbols.add(symbol);
        break;
      }

      case "cash_movement":
      default:
        // Cash movements and other events: do NOT adjust deployableCash.
        // The Balances CSV already reflects all same-day cash impacts.
        break;
    }
  }

  // Build projected snapshot
  const projected: PortfolioSnapshot = {
    ...baseSnapshot,
    inventory,
    existingCalls,
    existingPuts,
    deployableCash,
    // Update readiness to indicate projection is active
    readiness: {
      ...baseSnapshot.readiness,
      warnings: [
        ...baseSnapshot.readiness.warnings,
        `${chronological.length} activity event(s) projected since checkpoint`,
      ],
    },
  };

  return {
    snapshot: projected,
    projectedEventCount: chronological.length,
    projectedSymbols: [...projectedSymbols],
  };
}
