/**
 * Portfolio State Projector.
 *
 * Pure function that reduces an ordered list of ActivityRows into
 * a PortfolioState — the current institutional state derived from
 * the activity history.
 *
 * No side effects, no provider calls, independently testable.
 *
 * The projection handles:
 *   - Cash balance (deposits, premium received, share purchases)
 *   - Open option contracts (puts and calls)
 *   - Share holdings (from assignment)
 *   - Capital committed to open puts
 *   - Shares committed to open calls
 *   - Accumulated premium
 *   - Overlay feasibility (can write CSP? can write CC?)
 */

import type { ActivityRow } from "./parseActivityCsv";

// --- Portfolio State ---

export interface OpenContract {
  type: "CALL" | "PUT";
  underlying: string;
  strike: number;
  expiration: string;
  quantity: number;
  premiumReceived: number;
  openedDate: string;
}

export interface Holding {
  symbol: string;
  shares: number;
  /** Shares committed to open covered calls */
  sharesCommitted: number;
  /** Cost basis per share (from assignment price) */
  costBasis: number;
  acquiredDate: string;
}

export interface PortfolioState {
  /** Available cash (not committed to puts) */
  cash: number;
  /** Cash committed to securing open put contracts */
  cashCommittedToPuts: number;
  /** Total deployable cash = cash - cashCommittedToPuts */
  deployableCash: number;
  /** Share holdings by symbol */
  holdings: Holding[];
  /** Open option contracts */
  openContracts: OpenContract[];
  /** Total premium collected across all activity */
  totalPremiumCollected: number;
  /** Number of events processed */
  eventsProcessed: number;
  /** Can write a new CSP (has deployable cash)? */
  canWriteCsp: boolean;
  /** Can write a covered call (has uncommitted shares)? */
  canWriteCoveredCall: boolean;
  /** Free shares available for covered calls */
  freeShares: { symbol: string; shares: number }[];
}

// --- Projector ---

/**
 * Project portfolio state from an ordered activity history.
 *
 * Fidelity activity is ordered newest-first in CSV exports.
 * This function reverses to chronological order before processing.
 *
 * For cumulative scenario replay, pass the full ActivityRow[] from each step.
 * The projector is deterministic: same input → same output.
 */
export function projectState(activities: ActivityRow[]): PortfolioState {
  // Reverse to chronological order (Fidelity exports newest-first)
  const chronological = [...activities].reverse();

  let cash = 0;
  const openContracts: OpenContract[] = [];
  const holdings: Holding[] = [];
  let totalPremiumCollected = 0;

  for (const row of chronological) {
    switch (row.eventType) {
      case "cash_movement": {
        // Cash deposit/withdrawal
        const amt = row.amount ?? 0;
        cash += amt;
        break;
      }

      case "sell_to_open": {
        // Option sold to open — premium received, contract opened
        const premium = row.amount ?? 0;
        cash += premium;
        totalPremiumCollected += premium;

        if (row.option) {
          openContracts.push({
            type: row.option.type,
            underlying: row.option.underlying,
            strike: row.option.strike,
            expiration: row.option.expiration,
            quantity: Math.abs(row.quantity),
            premiumReceived: premium,
            openedDate: row.date,
          });
        }
        break;
      }

      case "assigned": {
        // Option assigned — remove from open contracts
        if (row.option) {
          const idx = openContracts.findIndex(
            (c) => c.type === row.option!.type &&
              c.underlying === row.option!.underlying &&
              c.strike === row.option!.strike &&
              c.expiration === row.option!.expiration
          );
          if (idx !== -1) {
            openContracts.splice(idx, 1);
          }
        }
        break;
      }

      case "shares_bought_assignment": {
        // Shares acquired from put assignment — cash consumed, shares gained
        const cost = row.amount ?? 0; // negative number
        cash += cost;

        const symbol = row.symbol || row.option?.underlying || "";
        const shares = Math.abs(row.quantity);
        const costBasis = row.price ?? 0;

        const existing = holdings.find((h) => h.symbol === symbol);
        if (existing) {
          existing.shares += shares;
        } else {
          holdings.push({
            symbol,
            shares,
            sharesCommitted: 0,
            costBasis,
            acquiredDate: row.date,
          });
        }
        break;
      }

      case "shares_sold_assignment": {
        // Shares sold from call assignment — cash received, shares removed
        const proceeds = row.amount ?? 0;
        cash += proceeds;

        const symbol = row.symbol || row.option?.underlying || "";
        const sharesSold = Math.abs(row.quantity);

        const existing = holdings.find((h) => h.symbol === symbol);
        if (existing) {
          existing.shares -= sharesSold;
          existing.sharesCommitted = Math.max(0, existing.sharesCommitted - sharesSold);
          if (existing.shares <= 0) {
            holdings.splice(holdings.indexOf(existing), 1);
          }
        }
        break;
      }

      case "expired": {
        // Option expired — remove from open contracts, free committed resources
        if (row.option) {
          const idx = openContracts.findIndex(
            (c) => c.type === row.option!.type &&
              c.underlying === row.option!.underlying &&
              c.strike === row.option!.strike &&
              c.expiration === row.option!.expiration
          );
          if (idx !== -1) {
            const contract = openContracts[idx];
            // If it was a call, release committed shares
            if (contract.type === "CALL") {
              const holding = holdings.find((h) => h.symbol === contract.underlying);
              if (holding) {
                holding.sharesCommitted = Math.max(0, holding.sharesCommitted - contract.quantity * 100);
              }
            }
            openContracts.splice(idx, 1);
          }
        }
        break;
      }

      case "dividend":
      case "reinvestment":
      case "treasury": {
        // Cash-affecting events
        const amt = row.amount ?? 0;
        if (amt !== 0) cash += amt;
        break;
      }

      default:
        // Other events — capture cash impact if any
        if (row.amount && row.amount !== 0) {
          cash += row.amount;
        }
        break;
    }
  }

  // Mark shares committed to open calls
  for (const contract of openContracts) {
    if (contract.type === "CALL") {
      const holding = holdings.find((h) => h.symbol === contract.underlying);
      if (holding) {
        holding.sharesCommitted += contract.quantity * 100;
      }
    }
  }

  // Compute committed cash (put contracts secure strike × 100 × quantity)
  const cashCommittedToPuts = openContracts
    .filter((c) => c.type === "PUT")
    .reduce((sum, c) => sum + c.strike * 100 * c.quantity, 0);

  const deployableCash = cash - cashCommittedToPuts;

  // Free shares (not committed to calls)
  const freeShares = holdings
    .filter((h) => h.shares - h.sharesCommitted > 0)
    .map((h) => ({ symbol: h.symbol, shares: h.shares - h.sharesCommitted }));

  return {
    cash,
    cashCommittedToPuts,
    deployableCash,
    holdings,
    openContracts,
    totalPremiumCollected,
    eventsProcessed: chronological.length,
    canWriteCsp: deployableCash >= 1000, // rough minimum for any ETF put
    canWriteCoveredCall: freeShares.some((fs) => fs.shares >= 100),
    freeShares,
  };
}

/**
 * Compute the difference between two portfolio states for display.
 */
export interface StateDiff {
  cashDelta: number;
  cashCommittedDelta: number;
  deployableCashDelta: number;
  holdingsAdded: Holding[];
  holdingsRemoved: Holding[];
  contractsOpened: OpenContract[];
  contractsClosed: OpenContract[];
  premiumDelta: number;
  canWriteCspChanged: boolean;
  canWriteCoveredCallChanged: boolean;
}

export function diffStates(before: PortfolioState, after: PortfolioState): StateDiff {
  // Find contracts that exist in after but not before (opened)
  const contractsOpened = after.openContracts.filter(
    (ac) => !before.openContracts.some(
      (bc) => bc.type === ac.type && bc.underlying === ac.underlying &&
        bc.strike === ac.strike && bc.expiration === ac.expiration
    )
  );

  // Find contracts that existed in before but not after (closed/expired/assigned)
  const contractsClosed = before.openContracts.filter(
    (bc) => !after.openContracts.some(
      (ac) => ac.type === bc.type && ac.underlying === bc.underlying &&
        ac.strike === bc.strike && ac.expiration === bc.expiration
    )
  );

  // Holdings added
  const holdingsAdded = after.holdings.filter(
    (ah) => !before.holdings.some((bh) => bh.symbol === ah.symbol)
  );
  const holdingsRemoved = before.holdings.filter(
    (bh) => !after.holdings.some((ah) => ah.symbol === bh.symbol)
  );

  return {
    cashDelta: after.cash - before.cash,
    cashCommittedDelta: after.cashCommittedToPuts - before.cashCommittedToPuts,
    deployableCashDelta: after.deployableCash - before.deployableCash,
    holdingsAdded,
    holdingsRemoved,
    contractsOpened,
    contractsClosed,
    premiumDelta: after.totalPremiumCollected - before.totalPremiumCollected,
    canWriteCspChanged: before.canWriteCsp !== after.canWriteCsp,
    canWriteCoveredCallChanged: before.canWriteCoveredCall !== after.canWriteCoveredCall,
  };
}
