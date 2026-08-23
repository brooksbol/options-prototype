/**
 * Economic Events Panel — PL-PROD-EVENTS thin-slice experiment
 *
 * Operator-facing chronological ledger of economically meaningful events
 * explaining how the month became its current economic state.
 *
 * Design constraints:
 *   - Derives from existing AssessedTransaction[] (no new backend work)
 *   - Presents individual event semantics, not lifecycle groupings
 *   - Broker transactions are provenance, not the primary display
 *   - Preserves epistemic distinctions (confidence badges for uncertain items)
 *   - Numbers-first, compact presentation
 *   - Table format matching In-Flight Positions for visual consistency
 *   - Operator-facing instrument identity (underlying + strike + Put/Call),
 *     not raw OCC/Fidelity symbols
 *
 * Inclusion criteria:
 *   - role === "INCLUDED" (has PRODUCTION or CAPITAL_EROSION components)
 *   - role === "UNCERTAIN" (unresolved economic potential — but NOT gross
 *     proceeds from dispositions where the economic meaning is gain/loss)
 *   - LIFECYCLE_NOTIFICATION (expiration, assignment) — economically meaningful
 *     state transitions regardless of whether the symbol produced in this period.
 *     Production recognition is period-scoped; economic events are not.
 *
 * Excluded:
 *   - PRINCIPAL_MOVEMENT-only (deposits, withdrawals, capital form changes)
 *   - CAPITAL_DEPLOYMENT-only (purchases)
 *   - REINVESTMENT (automated consequence, not separate economic event)
 *   - Gross disposition proceeds where gain/loss is unresolved (provenance only)
 *
 * Lifecycle event discovery (recorded, not solved):
 *   The inability to show compound-cycle results (e.g., "WEAT called away,
 *   cycle +$84.28") is observed evidence supporting PL-PORT-02 lifecycle
 *   reconstruction. Individual events are correct but disconnected.
 */

import { useState, useMemo, Fragment } from "react";
import type { AssessedTransaction, EconomicComponent } from "./production-types";

interface Props {
  transactions: AssessedTransaction[];
}

/** An economic event derived from one or more components of an AssessedTransaction */
interface EconomicEvent {
  id: string;
  date: string;
  /** Operator-facing instrument identity: "WEAT \u00B7 $25 Call" */
  instrumentLabel: string;
  label: string;
  amount: number | null;
  sign: "+" | "\u2212" | "\u25CB"; // production, erosion (−), or lifecycle/neutral (○)
  category: "production" | "erosion" | "uncertain" | "lifecycle";
  confidence: string;
  /** The raw broker action for provenance drill-down */
  brokerAction: string;
  /** Raw symbol for provenance */
  rawSymbol: string;
  /** Human-readable derivation from the backend (auditability) */
  derivation: string;
}

/** Group of events sharing the same date */
interface DateGroup {
  date: string;
  /** Formatted for display: "Aug 5" style */
  dateLabel: string;
  events: EconomicEvent[];
}

export function EconomicEventsPanel({ transactions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dateGroups = useMemo(() => deriveEconomicEvents(transactions), [transactions]);

  if (dateGroups.length === 0) {
    return null;
  }

  const totalEvents = dateGroups.reduce((sum, g) => sum + g.events.length, 0);

  return (
    <section className="prod-events" aria-label="Economic Events">
      <h3 className="prod-section-title">
        Economic Events
        <span className="prod-events-count">{totalEvents}</span>
      </h3>

      <table className="prod-events-table">
        <colgroup>
          <col className="col-sign" />
          <col className="col-amount" />
          <col className="col-event" />
          <col className="col-instrument" />
          <col className="col-confidence" />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Amount</th>
            <th>Event</th>
            <th>Instrument</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {dateGroups.map((group) => (
            <Fragment key={group.date}>
              {/* Date separator row */}
              <tr className="prod-events-date-row">
                <td colSpan={5}>
                  {group.dateLabel}
                </td>
              </tr>

              {/* Event rows */}
              {group.events.map((event) => (
                <Fragment key={event.id}>
                  <tr
                    className="prod-event-clickable"
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    aria-expanded={expandedId === event.id}
                  >
                    <td>
                      <span className={`prod-event-cell-sign prod-event-cell-sign-${event.category}`}>
                        {event.sign}
                      </span>
                    </td>
                    <td className="prod-event-cell-amount">
                      {event.amount != null
                        ? `$${Math.abs(event.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "\u2014"}
                    </td>
                    <td className="prod-event-cell-label">{event.label}</td>
                    <td className="prod-event-cell-symbol">{event.instrumentLabel}</td>
                    <td>
                      {event.confidence !== "DETERMINISTIC" && event.confidence !== "HIGH_CONFIDENCE" && (
                        <span className="prod-event-confidence" title={`Confidence: ${event.confidence.replace(/_/g, " ").toLowerCase()}`}>
                          ?
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded provenance */}
                  {expandedId === event.id && (
                    <tr className="prod-event-provenance-row">
                      <td colSpan={5}>
                        <div className="prod-event-provenance-content">
                          <div className="prod-event-provenance-line">
                            <span className="prod-event-provenance-key">Provenance</span>
                            <span className="prod-event-provenance-val">{event.brokerAction}</span>
                          </div>
                          <div className="prod-event-provenance-line">
                            <span className="prod-event-provenance-key">Symbol</span>
                            <span className="prod-event-provenance-val">{event.rawSymbol}</span>
                          </div>
                          <div className="prod-event-provenance-line">
                            <span className="prod-event-provenance-key">Derivation</span>
                            <span className="prod-event-provenance-val">{event.derivation}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// --- Derivation logic ---

/**
 * Transform AssessedTransaction[] into operator-facing economic events.
 *
 * This is a pure presentation derivation — no new domain logic.
 * The backend has already done the hard work of classification and decomposition.
 */
function deriveEconomicEvents(transactions: AssessedTransaction[]): DateGroup[] {
  const events: EconomicEvent[] = [];

  for (const tx of transactions) {
    if (tx.role === "INCLUDED") {
      // Extract economically meaningful components
      const meaningfulComponents = tx.components.filter(
        (c) => c.type === "PRODUCTION" || c.type === "CAPITAL_EROSION"
      );

      // Each meaningful component becomes an event
      for (const comp of meaningfulComponents) {
        events.push({
          id: `${tx.id}-${comp.type}-${comp.source ?? "none"}`,
          date: tx.date,
          instrumentLabel: deriveInstrumentLabel(tx.symbol),
          label: deriveEventLabel(comp),
          amount: comp.amount,
          sign: comp.type === "CAPITAL_EROSION" ? "\u2212" : "+",
          category: deriveCategoryFromComponent(comp),
          confidence: comp.confidence,
          brokerAction: tx.action,
          rawSymbol: tx.symbol,
          derivation: comp.derivation,
        });
      }
    } else if (tx.role === "UNCERTAIN") {
      // Uncertain transactions: only include if they represent genuine uncertain
      // economic character (e.g., distributions). Do NOT include gross disposition
      // proceeds where the economic meaning is gain/loss — the amount column
      // should show economic impact, not gross cash movement.
      const hasUncertainProduction = tx.components.some(
        (c) => c.type === "PRODUCTION" && (c.confidence === "CHARACTER_UNCERTAIN" || c.confidence === "BASIS_UNKNOWN")
      );

      if (hasUncertainProduction) {
        // Genuine uncertain production (e.g., distribution character unknown)
        const uncertainComp = tx.components.find(
          (c) => c.type === "PRODUCTION" && (c.confidence === "CHARACTER_UNCERTAIN" || c.confidence === "BASIS_UNKNOWN")
        )!;
        events.push({
          id: tx.id,
          date: tx.date,
          instrumentLabel: deriveInstrumentLabel(tx.symbol),
          label: deriveEventLabel(uncertainComp),
          amount: uncertainComp.amount,
          sign: "+",
          category: "uncertain",
          confidence: uncertainComp.confidence,
          brokerAction: tx.action,
          rawSymbol: tx.symbol,
          derivation: uncertainComp.derivation,
        });
      } else {
        // Gross proceeds with unresolved economics (e.g., disposition with unknown basis)
        // Show as amountless "economics unresolved" — gross proceeds in provenance only
        events.push({
          id: tx.id,
          date: tx.date,
          instrumentLabel: deriveInstrumentLabel(tx.symbol),
          label: "Disposition \u2014 economics unresolved",
          amount: null,
          sign: "\u25CB",
          category: "uncertain",
          confidence: tx.components[0]?.confidence ?? "BASIS_UNKNOWN",
          brokerAction: tx.action,
          rawSymbol: tx.symbol,
          derivation: tx.components[0]?.derivation ?? "Economic character undetermined",
        });
      }
    } else if (tx.role === "NOT_APPLICABLE") {
      // Lifecycle notifications — expirations and assignments are economically
      // meaningful state transitions (obligation resolved, collateral released)
      // regardless of whether this symbol generated Production in the same period.
      // Production recognition is period-scoped; economic events are not.
      const isLifecycle = tx.components.some((c) => c.type === "LIFECYCLE_NOTIFICATION");
      if (isLifecycle) {
        events.push({
          id: tx.id,
          date: tx.date,
          instrumentLabel: deriveInstrumentLabel(tx.symbol),
          label: deriveLifecycleLabel(tx.action, tx.symbol),
          amount: null,
          sign: "\u25CB",
          category: "lifecycle",
          confidence: "DETERMINISTIC",
          brokerAction: tx.action,
          rawSymbol: tx.symbol,
          derivation: tx.components[0]?.derivation ?? "Lifecycle event",
        });
      }
    }
  }

  // Sort newest first
  events.sort((a, b) => b.date.localeCompare(a.date));

  // Group by date
  const groupMap = new Map<string, EconomicEvent[]>();
  for (const event of events) {
    const existing = groupMap.get(event.date);
    if (existing) {
      existing.push(event);
    } else {
      groupMap.set(event.date, [event]);
    }
  }

  // Convert to DateGroup[] preserving sort order
  const groups: DateGroup[] = [];
  for (const [date, dateEvents] of groupMap) {
    groups.push({
      date,
      dateLabel: formatEventDate(date),
      events: dateEvents,
    });
  }

  return groups;
}

// --- Instrument identity ---

/**
 * Parse a Fidelity/OCC option symbol into operator-facing instrument identity.
 *
 * OCC format: -WEAT260821C25 → "WEAT · $25 Call"
 * Plain equity: WEAT → "WEAT"
 * Unparseable: return as-is (trimmed)
 */
function deriveInstrumentLabel(symbol: string): string {
  const trimmed = symbol.trim();

  // OCC option symbol: starts with - followed by underlying, 6-digit date, C/P, strike
  const match = trimmed.match(/^-([A-Z]+)(\d{6})([CP])(\d+(?:\.\d+)?)$/);
  if (match) {
    const [, underlying, , typeChar, strike] = match;
    const typeName = typeChar === "C" ? "Call" : "Put";
    return `${underlying} \u00B7 $${strike} ${typeName}`;
  }

  // Some Fidelity symbols may have leading dash without full OCC format
  if (trimmed.startsWith("-")) {
    return trimmed.slice(1);
  }

  return trimmed;
}

/**
 * Derive the option type (put/call) from an OCC symbol.
 * Returns null if not parseable as an option.
 */
function parseOptionType(symbol: string): "put" | "call" | null {
  const match = symbol.trim().match(/^-[A-Z]+\d{6}([CP])\d+/);
  if (!match) return null;
  return match[1] === "P" ? "put" : "call";
}

// --- Event labels ---

function deriveEventLabel(comp: EconomicComponent): string {
  const labels: Record<string, string> = {
    OPTION_PREMIUM: "Premium Received",
    MONEY_MARKET_INCOME: "Money Market",
    TREASURY_DISCOUNT: "Treasury Discount",
    DIVIDEND: "Distribution",
    REALIZED_APPRECIATION: "Realized Appreciation",
  };

  if (comp.type === "CAPITAL_EROSION") {
    return "Capital Erosion";
  }

  return labels[comp.source ?? ""] ?? "Production";
}

function deriveCategoryFromComponent(comp: EconomicComponent): EconomicEvent["category"] {
  if (comp.type === "CAPITAL_EROSION") return "erosion";
  if (comp.confidence === "CHARACTER_UNCERTAIN" || comp.confidence === "BASIS_UNKNOWN") {
    return "uncertain";
  }
  return "production";
}

/**
 * Derive operator-meaningful lifecycle event language.
 *
 * Rather than generic "Assigned" / "Expired", use:
 *   - short put assignment → "Put Assigned"
 *   - short call assignment → "Called Away"
 *   - put expiration → "Put Expired"
 *   - call expiration → "Call Expired"
 *
 * The OCC symbol's C/P indicator distinguishes put from call
 * without requiring lifecycle reconstruction.
 */
function deriveLifecycleLabel(action: string, symbol: string): string {
  const optionType = parseOptionType(symbol);
  const lower = action.toLowerCase();

  if (lower.includes("expir")) {
    if (optionType === "put") return "Put Expired";
    if (optionType === "call") return "Call Expired";
    return "Expired";
  }

  if (lower.includes("assign")) {
    if (optionType === "call") return "Called Away";
    if (optionType === "put") return "Put Assigned";
    return "Assigned";
  }

  return "Lifecycle";
}

function formatEventDate(dateStr: string): string {
  // Input: "2026-08-05" → "Aug 5"
  const [, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIdx = parseInt(month, 10) - 1;
  return `${months[monthIdx]} ${parseInt(day, 10)}`;
}
