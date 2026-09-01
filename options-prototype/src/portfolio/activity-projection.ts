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
import type { InventoryPosition, OpenShortCall, OpenShortPut, CallAcquisitionBasis } from "../write-desk/types";

// --- Temporal Boundary ---

// --- Checkpoint Provenance ---

/**
 * Checkpoint precision level.
 *
 * Provenance-precision policy for reconciling Activity against a snapshot:
 *   - "day": snapshot provenance has calendar-day granularity only. The snapshot
 *     is authoritative for that entire date. Activity from the same or earlier
 *     calendar day must NOT project (it's already incorporated or cannot be ordered).
 *     Only activity from a strictly later calendar day advances the snapshot.
 *   - "intraday": snapshot has a specific time. Activity occurring after that
 *     timestamp may project (normal timestamp ordering).
 *   - "none": no parseable provenance. Project everything (fallback).
 */
export type CheckpointPrecision = "day" | "intraday" | "none";

export interface Checkpoint {
  timestamp: Date;
  precision: CheckpointPrecision;
}

/**
 * Parse the Option Summary quoteDate into a Checkpoint with precision metadata.
 *
 * Fidelity provides export timestamps in several forms:
 *   - Date only: "08/14/2026" → day precision
 *   - Date + time: "Aug 12, 2026 4:00 PM ET" → intraday precision
 *   - Absent/null → no checkpoint, project everything
 */
export function parseCheckpointTimestamp(quoteDate: string | null | undefined): Date {
  const checkpoint = parseCheckpoint(quoteDate);
  return checkpoint.timestamp;
}

export function parseCheckpoint(quoteDate: string | null | undefined): Checkpoint {
  if (!quoteDate) return { timestamp: new Date(0), precision: "none" };

  const hasTime = /\d{1,2}:\d{2}/.test(quoteDate);

  // Try native Date parse (handles many formats)
  const parsed = new Date(quoteDate);
  if (!isNaN(parsed.getTime())) {
    return {
      timestamp: parsed,
      precision: hasTime ? "intraday" : "day",
    };
  }

  // Try extracting date portion: "Aug 12, 2026" or "Aug 12, 2026 4:00 PM ET"
  const dateMatch = quoteDate.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (dateMatch) {
    const monthNames: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = monthNames[dateMatch[1].toLowerCase().slice(0, 3)] ?? 0;
    const day = parseInt(dateMatch[2]);
    const year = parseInt(dateMatch[3]);

    const timeMatch = quoteDate.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      if (timeMatch[3]?.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (timeMatch[3]?.toUpperCase() === "AM" && hours === 12) hours = 0;
      return {
        timestamp: new Date(year, month, day, hours, minutes),
        precision: "intraday",
      };
    }

    return {
      timestamp: new Date(year, month, day),
      precision: "day",
    };
  }

  return { timestamp: new Date(0), precision: "none" };
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

/** Extract the calendar date (YYYY-MM-DD) from a Date object in local time. */
function calendarDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Determine if an Activity row should be projected (occurred after the checkpoint).
 *
 * Provenance-precision policy:
 *   - "day" precision: the snapshot is authoritative for that calendar date.
 *     Only activity from a strictly later calendar day projects.
 *   - "intraday" precision: normal timestamp comparison. Activity after the
 *     checkpoint timestamp projects.
 *   - "none" precision: no checkpoint — project everything.
 */
function isAfterCheckpoint(row: ActivityRow, checkpoint: Date, precision: CheckpointPrecision = "intraday"): boolean {
  if (precision === "none") return true;

  if (precision === "day") {
    // Calendar-day authority: only strictly later dates project
    if (!row.date) return false;
    const checkpointDate = calendarDate(checkpoint);
    return row.date > checkpointDate;
  }

  // Intraday: normal timestamp ordering
  const eventTime = activityTimestamp(row);
  return eventTime.getTime() > checkpoint.getTime();
}

// --- Projection ---

// --- BW Origin Enrichment ---

/**
 * Enrich existing short calls with buy-write origin provenance AND acquisition basis
 * from Activity evidence.
 *
 * Scans ALL activity rows (regardless of temporal checkpoint) to detect same-day
 * share purchase + call STO pairs. When evidence matches an existing call that
 * lacks origin, it tags the call with origin: "buy-write" and attaches the
 * Activity-derived acquisition basis with confidence classification.
 *
 * Attribution confidence tiers:
 * - "unique": one-to-one mapping — the purchase evidence uniquely attributes to this call
 *   (single purchase event, or all same-day fills at same price, or only one call on this day)
 * - "batch": same-day purchase quantity supports multiple BW calls but individual
 *   fill-to-call pairing is not provable — basis is batch-level VWAP
 *
 * This does not mutate position state (quantity, economics, etc.) — it only
 * adds provenance metadata and acquisition basis that the Option Summary cannot provide.
 */
function enrichBuyWriteOrigin(existingCalls: OpenShortCall[], activityRows: ActivityRow[]): void {
  if (activityRows.length === 0) return;

  // Build detailed lookup of same-day share purchases across ALL activity.
  // Key: "DATE|SYMBOL", Value: array of individual purchase events (preserving per-row price).
  interface PurchaseEvent { quantity: number; price: number | null; }
  const sameDayPurchaseDetails = new Map<string, PurchaseEvent[]>();
  for (const row of activityRows) {
    if (row.eventType === "shares_bought_direct") {
      const sym = (row.symbol || "").toUpperCase();
      if (!sym) continue;
      const key = `${row.date}|${sym}`;
      const events = sameDayPurchaseDetails.get(key) ?? [];
      events.push({ quantity: Math.abs(row.quantity), price: row.price });
      sameDayPurchaseDetails.set(key, events);
    }
  }

  if (sameDayPurchaseDetails.size === 0) return;

  // Build lookup of sell-to-open CALL events by underlying+strike+expiration.
  // We need the STO date to correlate with the purchase date.
  const stoDateByPosition = new Map<string, string>();
  for (const row of activityRows) {
    if (row.eventType === "sell_to_open" && row.option?.type === "CALL") {
      const underlying = row.option.underlying.toUpperCase();
      const key = `${underlying}|${row.option.strike}|${row.option.expiration}`;
      // Use the earliest STO date for this position (in case of multiple fills)
      const existing = stoDateByPosition.get(key);
      if (!existing || row.date < existing) {
        stoDateByPosition.set(key, row.date);
      }
    }
  }

  // Count how many BW-eligible calls share the same STO date + underlying.
  // This is needed to determine unique vs batch attribution.
  // First pass: tag origin. Second pass: determine confidence.

  // Phase 1: Determine BW origin for each call (same logic as before).
  const bwCandidates: { call: OpenShortCall; stoDate: string; purchaseKey: string }[] = [];

  for (const call of existingCalls) {
    if (call.origin === "buy-write" && call.acquisitionBasis) continue; // Already fully enriched

    const posKey = `${call.underlying}|${call.strike}|${call.expiration}`;
    const stoDate = stoDateByPosition.get(posKey);
    if (!stoDate) continue;

    const purchaseKey = `${stoDate}|${call.underlying}`;
    const purchaseEvents = sameDayPurchaseDetails.get(purchaseKey);
    if (!purchaseEvents) continue;

    const totalSharesBought = purchaseEvents.reduce((sum, e) => sum + e.quantity, 0);
    const sharesNeeded = call.quantity * 100;

    if (totalSharesBought >= sharesNeeded) {
      call.origin = "buy-write";
      bwCandidates.push({ call, stoDate, purchaseKey });
    }
  }

  // Phase 2: Determine attribution confidence and attach acquisition basis.
  // Group BW candidates by their purchase key (stoDate|symbol) to detect batch scenarios.
  const candidatesByPurchaseKey = new Map<string, typeof bwCandidates>();
  for (const candidate of bwCandidates) {
    const group = candidatesByPurchaseKey.get(candidate.purchaseKey) ?? [];
    group.push(candidate);
    candidatesByPurchaseKey.set(candidate.purchaseKey, group);
  }

  for (const [purchaseKey, candidates] of candidatesByPurchaseKey) {
    const purchaseEvents = sameDayPurchaseDetails.get(purchaseKey)!;
    const totalSharesBought = purchaseEvents.reduce((sum, e) => sum + e.quantity, 0);

    // Compute VWAP from purchase events (only events with non-null price)
    const pricedEvents = purchaseEvents.filter(e => e.price != null && e.price > 0);
    if (pricedEvents.length === 0) continue; // No price evidence — cannot attribute

    const vwap = pricedEvents.reduce((sum, e) => sum + e.price! * e.quantity, 0)
      / pricedEvents.reduce((sum, e) => sum + e.quantity, 0);

    // Determine if all prices are effectively the same (uniform fill)
    const allSamePrice = pricedEvents.length === 1
      || pricedEvents.every(e => Math.abs(e.price! - pricedEvents[0].price!) < 0.001);

    // Total BW call coverage on this day for this symbol
    const totalCallCoverage = candidates.reduce((sum, c) => sum + c.call.quantity * 100, 0);

    for (const candidate of candidates) {
      const sharesForThisCall = candidate.call.quantity * 100;
      const stoDate = candidate.stoDate;

      // Unique attribution conditions:
      // 1. Only one BW call on this day for this symbol, OR
      // 2. All purchase fills have the same price (uniform execution), OR
      // 3. Exactly one purchase event with quantity matching this single call's coverage
      const isUnique =
        candidates.length === 1 ||
        allSamePrice ||
        (pricedEvents.length === 1 && totalCallCoverage <= totalSharesBought);

      const basis: CallAcquisitionBasis = {
        pricePerShare: vwap,
        shares: sharesForThisCall,
        date: stoDate,
        confidence: isUnique ? "unique" : "batch",
      };

      candidate.call.acquisitionBasis = basis;
    }
  }
}

export interface ProjectionResult {
  snapshot: PortfolioSnapshot;
  projectedEventCount: number;
  projectedSymbols: string[];
}

/**
 * Enrich all existing positions with their opened date (sell-to-open date).
 *
 * Replays activity chronologically to find the STO event(s) that account for
 * the currently open quantity. This correctly handles the open-close-reopen case:
 * if a contract was opened, closed, and reopened at the same strike/expiration,
 * OPENED reflects the reopening date, not the original historical open.
 *
 * For positions opened in a single fill, this returns that fill date.
 * For positions built across multiple fills (without intervening closures),
 * this returns the earliest contributing fill date.
 *
 * This is provenance enrichment — it does not mutate position state.
 */
function enrichOpenedDates(existingCalls: OpenShortCall[], existingPuts: OpenShortPut[], activityRows: ActivityRow[]): void {
  if (activityRows.length === 0) return;

  // Sort activity chronologically (Activity CSV is typically newest-first)
  const chronological = [...activityRows].sort((a, b) => a.date.localeCompare(b.date));

  // For each position identity, replay the STO/BTC/expired/assigned history
  // to determine which STO events contribute to the currently open quantity.
  // Key: "TYPE|UNDERLYING|STRIKE|EXPIRATION"
  // Value: array of { date, quantity } for each STO contributing to the current open lot
  const currentOpenStosByKey = new Map<string, string[]>();

  // Track running net quantity per position key
  const runningQty = new Map<string, number>();

  for (const row of chronological) {
    if (!row.option) continue;
    const underlying = row.option.underlying.toUpperCase();
    const type = row.option.type; // "CALL" or "PUT"
    const key = `${type}|${underlying}|${row.option.strike}|${row.option.expiration}`;

    if (row.eventType === "sell_to_open") {
      const qty = Math.abs(row.quantity);
      const current = runningQty.get(key) ?? 0;

      if (current === 0) {
        // Fresh open — reset the STO dates list
        currentOpenStosByKey.set(key, [row.date]);
      } else {
        // Adding to an existing position — append this fill date
        const dates = currentOpenStosByKey.get(key) ?? [];
        dates.push(row.date);
        currentOpenStosByKey.set(key, dates);
      }
      runningQty.set(key, current + qty);

    } else if (row.eventType === "buy_to_close" || row.eventType === "expired" || row.eventType === "assigned") {
      const qty = Math.abs(row.quantity);
      const current = runningQty.get(key) ?? 0;
      const newQty = Math.max(0, current - qty);
      runningQty.set(key, newQty);

      if (newQty === 0) {
        // Position fully closed — clear the STO dates (next STO starts fresh)
        currentOpenStosByKey.delete(key);
      }
    }
  }

  if (currentOpenStosByKey.size === 0) return;

  // Apply to calls: use the earliest STO date from the current open lot
  for (const call of existingCalls) {
    if (call.openedDate) continue;
    const key = `CALL|${call.underlying.toUpperCase()}|${call.strike}|${call.expiration}`;
    const dates = currentOpenStosByKey.get(key);
    if (dates && dates.length > 0) {
      call.openedDate = dates[0]; // earliest fill in the current open batch
    }
  }

  // Apply to puts
  for (const put of existingPuts) {
    if (put.openedDate) continue;
    const key = `PUT|${put.underlying.toUpperCase()}|${put.strike}|${put.expiration}`;
    const dates = currentOpenStosByKey.get(key);
    if (dates && dates.length > 0) {
      put.openedDate = dates[0]; // earliest fill in the current open batch
    }
  }
}

/**
 * Project Activity events onto an existing PortfolioSnapshot.
 *
 * Only events AFTER the checkpoint are applied. The checkpoint's precision
 * determines the reconciliation policy:
 *   - "day": activity from the same or earlier calendar day is excluded.
 *   - "intraday": normal timestamp comparison.
 *   - "none": project everything.
 */
export function projectActivityOverlay(
  baseSnapshot: PortfolioSnapshot,
  activityRows: ActivityRow[],
  checkpointTimestamp: Date,
  precision: CheckpointPrecision = "intraday",
): ProjectionResult {
  // Filter to post-checkpoint events only
  const postCheckpoint = activityRows.filter(row => isAfterCheckpoint(row, checkpointTimestamp, precision));

  // Clone mutable state from snapshot
  const inventory: InventoryPosition[] = baseSnapshot.inventory.map(p => ({ ...p }));
  const existingCalls: OpenShortCall[] = baseSnapshot.existingCalls.map(c => ({ ...c }));
  const existingPuts: OpenShortPut[] = baseSnapshot.existingPuts.map(p => ({ ...p }));
  let deployableCash = baseSnapshot.deployableCash;

  const projectedSymbols = new Set<string>();

  // === BW Origin Enrichment ===
  // Scan ALL activity (regardless of checkpoint) for provenance evidence.
  // Origin tagging does not mutate position state — it adds metadata that the
  // Option Summary cannot provide. This is separate from the projection logic below
  // which correctly applies only post-checkpoint mutations.
  enrichBuyWriteOrigin(existingCalls, activityRows);

  // === Opened Date Enrichment ===
  // Scan ALL activity for STO events to populate authoritative opened dates.
  enrichOpenedDates(existingCalls, existingPuts, activityRows);

  if (postCheckpoint.length === 0) {
    // Even with no post-checkpoint events, the enrichment may have tagged origins/dates.
    const enrichedSnapshot: PortfolioSnapshot = {
      ...baseSnapshot,
      existingCalls,
      existingPuts,
    };
    return { snapshot: enrichedSnapshot, projectedEventCount: 0, projectedSymbols: [] };
  }

  // Sort chronologically (Activity CSV is newest-first)
  const chronological = [...postCheckpoint].sort((a, b) => a.date.localeCompare(b.date));

  // Build a lookup of same-day share purchases for BW origin detection (post-checkpoint only).
  // Key: "DATE|SYMBOL", Value: array of purchase events (preserving per-row price).
  interface PostCheckpointPurchase { quantity: number; price: number | null; }
  const sameDayPurchases = new Map<string, number>();
  const sameDayPurchaseDetails = new Map<string, PostCheckpointPurchase[]>();
  for (const row of chronological) {
    if (row.eventType === "shares_bought_direct") {
      const sym = (row.symbol || "").toUpperCase();
      if (!sym) continue;
      const key = `${row.date}|${sym}`;
      sameDayPurchases.set(key, (sameDayPurchases.get(key) ?? 0) + Math.abs(row.quantity));
      const events = sameDayPurchaseDetails.get(key) ?? [];
      events.push({ quantity: Math.abs(row.quantity), price: row.price });
      sameDayPurchaseDetails.set(key, events);
    }
  }

  // Track newly projected BW calls for batch/unique confidence determination.
  const projectedBwCalls: { call: OpenShortCall; purchaseKey: string; stoDate: string }[] = [];

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
            // Detect buy-write origin: same-day share purchase for this underlying
            // with quantity matching or exceeding the call contract coverage.
            const purchaseKey = `${row.date}|${underlying}`;
            const sharesBoughtSameDay = sameDayPurchases.get(purchaseKey) ?? 0;
            const sharesNeeded = Math.abs(row.quantity) * 100;
            const isBuyWriteOrigin = sharesBoughtSameDay >= sharesNeeded;

            const newCall: OpenShortCall = {
              symbol: row.symbol,
              underlying,
              strike: row.option.strike,
              expiration: row.option.expiration,
              quantity: Math.abs(row.quantity),
              brokerOptionBasis: null,
              brokerOptionAverageCost: null,
              origin: isBuyWriteOrigin ? "buy-write" : null,
            };
            existingCalls.push(newCall);

            if (isBuyWriteOrigin) {
              projectedBwCalls.push({ call: newCall, purchaseKey, stoDate: row.date });
            }
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
              // Broker cost basis unknown for a projected open (mirrors the
              // sell_to_open CALL branch above). Required OpenShortPut fields.
              brokerOptionBasis: null,
              brokerOptionAverageCost: null,
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

        // Preserve unknown-cash passthrough: only accumulate when a cash base
        // exists. Coercing null→0 would fabricate a concrete deployable figure.
        if (deployableCash != null) {
          deployableCash += proceeds;
        }
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

  // === Phase 2: Attach acquisition basis to projected BW calls ===
  // Group by purchase key to determine unique vs batch confidence.
  const projBwByKey = new Map<string, typeof projectedBwCalls>();
  for (const candidate of projectedBwCalls) {
    const group = projBwByKey.get(candidate.purchaseKey) ?? [];
    group.push(candidate);
    projBwByKey.set(candidate.purchaseKey, group);
  }

  for (const [purchaseKey, candidates] of projBwByKey) {
    const purchaseEvents = sameDayPurchaseDetails.get(purchaseKey);
    if (!purchaseEvents || purchaseEvents.length === 0) continue;

    const pricedEvents = purchaseEvents.filter(e => e.price != null && e.price > 0);
    if (pricedEvents.length === 0) continue;

    const vwap = pricedEvents.reduce((sum, e) => sum + e.price! * e.quantity, 0)
      / pricedEvents.reduce((sum, e) => sum + e.quantity, 0);

    const allSamePrice = pricedEvents.length === 1
      || pricedEvents.every(e => Math.abs(e.price! - pricedEvents[0].price!) < 0.001);

    const totalSharesBought = purchaseEvents.reduce((sum, e) => sum + e.quantity, 0);
    const totalCallCoverage = candidates.reduce((sum, c) => sum + c.call.quantity * 100, 0);

    for (const candidate of candidates) {
      const isUnique =
        candidates.length === 1 ||
        allSamePrice ||
        (pricedEvents.length === 1 && totalCallCoverage <= totalSharesBought);

      candidate.call.acquisitionBasis = {
        pricePerShare: vwap,
        shares: candidate.call.quantity * 100,
        date: candidate.stoDate,
        confidence: isUnique ? "unique" : "batch",
      };
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
