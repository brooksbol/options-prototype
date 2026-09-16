/**
 * Unencumbered Shares — Operator Console region (PL-ELIG V1 + column expansion)
 *
 * Renders standalone free-share inventory ABOVE and SEPARATE FROM the DTE ladder.
 * The DTE ladder remains the temporal option-position / encumbered-capital surface;
 * shares are never inserted into it.
 *
 * COLUMNS (Principal-authorized expansion Sep 14, 2026 — see docs/parking-lot-8.md
 * §PL-ELIG implementation record; this expansion is beyond the original V1
 * exclusion list and was explicitly authorized):
 *   Symbol · Free Shares · Free Lots · Spot · Today's G/L · Capital · Share Basis · Freshness
 *
 * Truthfulness rules (unchanged core + expansion honesty):
 *   - Free Shares / Free Lots come from the pure projection (deriveUnencumberedInventory):
 *     snapshot-derived from observed Option Summary ownership + open short-call geometry;
 *     deterministic but NOT universally authoritative/complete.
 *   - Spot / Today's G/L / Capital / Freshness are LIVE-evidence derivations. A purely
 *     free-held symbol (owned, no open option) is NOT in the Console observation set, so
 *     these render "—" honestly rather than fabricating a value.
 *   - Today's G/L is the UNDERLYING's intraday move (market context) — NOT a position
 *     mark-to-market P/L (same honest semantics as the ladder's Today's G/L column).
 *   - Capital = Free Shares × Spot (market value of the free shares at the live quote).
 *     Shown only when spot is available; not folded into any account total.
 *   - Share Basis = economics.averageCostPerShare, which is a SYMBOL-LEVEL BLENDED
 *     average (Principal-accepted). It is NOT lot-specific to the free shares; labeled
 *     "blended" so it is never mistaken for a free-lot-specific basis (PL-PORT-01).
 *   - Freshness is the age of the underlying PRICE observation; "—" when unobserved.
 *
 * Three states MUST remain visually distinguishable (canonical contract):
 *   1. inventory evidence unavailable / incomplete
 *   2. evidence usable and no unencumbered shares (trustworthy zero)
 *   3. one or more unencumbered-share rows
 */

import type { PortfolioSnapshot, PositionEconomics } from "../write-desk/types";
import type { QuoteObservation } from "../evidence/observation-store";
import { deriveUnencumberedInventory } from "../portfolio/unencumbered-inventory";
import {
  computeTodayGlPerShare,
  computeTodayGlPercent,
  formatTodayGlPercent,
  todayGlDirection,
} from "./today-gl";

interface UnencumberedInventoryProps {
  snapshot: PortfolioSnapshot;
  /** Per-symbol live quote observations (uppercase-keyed). Empty for unobserved symbols. */
  observations: ReadonlyMap<string, QuoteObservation>;
}

function inventoryEvidenceTrustworthy(snapshot: PortfolioSnapshot): boolean {
  const r = snapshot.readiness;
  if (!r) return false;
  if (!r.optionSummaryLoaded) return false;
  if (!r.inventoryValid) return false;
  return r.status !== "INCOMPLETE" && r.status !== "CONFLICTED";
}

function provenanceLine(snapshot: PortfolioSnapshot): string {
  const p = snapshot.provenance;
  const source = p?.optionSummaryFilename ? `Fidelity Option Summary · ${p.optionSummaryFilename}` : "Fidelity Option Summary";
  if (p?.optionSummaryExportTimestamp) {
    return `${source} · exported ${formatTs(p.optionSummaryExportTimestamp)}`;
  }
  const parseNote = p?.optionSummaryParsedAt ? ` · parsed ${formatTs(p.optionSummaryParsedAt)}` : "";
  return `${source} · Export time unavailable${parseNote}`;
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Coarse age string ("42s"/"3m"/"5h"/"2d"), matching the ladder's convention. */
function formatDataAge(ageMs: number): string {
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

const DASH = "—";

function fmtSpot(price: number | null | undefined): string {
  return price != null ? `$${price.toFixed(2)}` : DASH;
}

function fmtMoney(v: number | null): string {
  return v != null ? `$${Math.round(v).toLocaleString()}` : DASH;
}

/** Signed whole-dollar total: "+$1,240" / "-$310" / "$0". */
function fmtSignedMoney(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}$${Math.round(Math.abs(v)).toLocaleString()}`;
}

/** Signed percent: "+1.24%" / "-0.83%". */
function fmtSignedPct(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}${Math.abs(v).toFixed(2)}%`;
}



function fmtBasis(economics: PositionEconomics | null): string {
  const b = economics?.averageCostPerShare;
  return b != null ? `$${b.toFixed(2)}` : DASH;
}

function fmtFreshness(observedAt: string | null | undefined): string {
  if (!observedAt) return DASH;
  const ms = Date.parse(observedAt);
  if (Number.isNaN(ms)) return DASH;
  return formatDataAge(Math.max(0, Date.now() - ms));
}

export function UnencumberedInventory({ snapshot, observations }: UnencumberedInventoryProps) {
  const { rows, geometryWarnings } = deriveUnencumberedInventory(snapshot);
  const trustworthy = inventoryEvidenceTrustworthy(snapshot);
  const readinessWarnings = snapshot.readiness?.warnings ?? [];

  // Region always renders (rows OR warnings OR untrustworthy; and a trustworthy zero
  // shows a truthful empty state) so absence-of-region can never be mistaken for
  // "no unencumbered shares" and State 2 stays distinct from State 1.

  const economicsBySymbol = new Map(
    snapshot.inventory.map((inv) => [inv.symbol.toUpperCase(), inv.economics]),
  );

  // Total Capital = Σ (free shares × live spot) over rows that HAVE a live spot.
  // Rows without a spot (unobserved / not-in-universe) contribute nothing and are
  // counted as "unpriced" so the total is honestly labeled partial rather than
  // silently understating. Not a new account primitive — just the sum of the
  // Capital column's priced cells.
  let totalCapital = 0;
  let pricedRows = 0;
  let unpricedRows = 0;
  // Total Today's G/L = Σ ((last − previousClose) × free shares) over rows that
  // HAVE a prior close. Broker-parity daily G/L on the free shares (BUG-020),
  // dollar-weighted by free shares — summing per-share moves directly would be
  // meaningless across differently-priced symbols.
  //
  // Total % = totalGl / (Σ free-shares × previousClose) × 100 — a dollar-weighted
  // portfolio percent, NOT an average of per-row percents (which would misweight
  // differently-sized rows). The reference base is the free-share value at each
  // row's prior close, so total% is coherent with total$ (and with the broker).
  let totalGl = 0;
  let glReferenceBase = 0; // Σ free-shares × previousClose, over rows with a prior close
  let glRows = 0;
  let glMissingRows = 0;
  // Lifetime (Total) G/L accumulators.
  let totalTotalGl = 0;         // Σ (spot − basis) × free shares
  let totalGlCostBase = 0;      // Σ basis × free shares (for dollar-weighted %)
  let totalGlValueRows = 0;
  let totalGlValueMissingRows = 0;
  for (const row of rows) {
    const key = row.symbol.toUpperCase();
    const obs = observations.get(key);
    const spot = obs?.price ?? null;
    const previousClose = obs?.previousClose ?? null;
    if (spot != null) {
      totalCapital += row.freeShares * spot;
      pricedRows++;
    } else {
      unpricedRows++;
    }
    const glChange = computeTodayGlPerShare({ last: spot, previousClose });
    if (glChange != null && previousClose != null) {
      totalGl += glChange * row.freeShares;
      glRows++;
      // Reference base for this row = free shares × prior close (broker baseline).
      glReferenceBase += row.freeShares * previousClose;
    } else {
      glMissingRows++;
    }

    // Lifetime (Total) G/L accumulation — Σ (spot − basis) × free shares, with a
    // cost base of Σ free-shares × basis, so the total % is dollar-weighted and
    // coherent with the total $. Requires both a live spot and a (blended) basis.
    const basis = economicsBySymbol.get(key)?.averageCostPerShare ?? null;
    if (spot != null && basis != null) {
      totalTotalGl += (spot - basis) * row.freeShares;
      totalGlCostBase += basis * row.freeShares;
      totalGlValueRows++;
    } else {
      totalGlValueMissingRows++;
    }
  }

  // Totals-row values (rendered as a bottom "Totals" line, not next to the title).
  const totalTodayPct = glReferenceBase > 0 ? (totalGl / glReferenceBase) * 100 : null;
  const totalTotalGlPct = totalGlCostBase > 0 ? (totalTotalGl / totalGlCostBase) * 100 : null;
  const totalFreeShares = rows.reduce((s, r) => s + r.freeShares, 0);
  const totalFreeLots = rows.reduce((s, r) => s + r.freeLots, 0);
  // "Partial" when any total omits rows that lacked the required live evidence.
  const anyPartial = unpricedRows > 0 || glMissingRows > 0 || totalGlValueMissingRows > 0;

  return (
    <section className="oc-region-inventory" aria-label="Unencumbered Shares">
      <div className="oc-inv-header">
        <span className="oc-inv-title">Unencumbered Shares</span>
        <span className="oc-inv-provenance">{provenanceLine(snapshot)}</span>
      </div>

      {!trustworthy && (
        <div className="oc-inv-evidence-unavailable" role="status">
          Inventory evidence is incomplete or unavailable — free-share inventory below
          may be partial. This is not a confirmation that no unencumbered shares exist.
          {readinessWarnings.length > 0 && (
            <ul className="oc-inv-readiness-warnings">
              {readinessWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>
      )}

      {rows.length > 0 ? (
        <table className="oc-inv-table">
          <thead>
            <tr>
              <th className="oc-inv-th-left">Symbol</th>
              <th className="oc-inv-th-right">Last Price</th>
              <th className="oc-inv-th-right">Today&apos;s gain/loss $</th>
              <th className="oc-inv-th-right">Today&apos;s gain/loss %</th>
              <th className="oc-inv-th-right" title="Lifetime gain/loss on the free shares vs blended average cost basis: (last price − average cost basis) × quantity">Total gain/loss $</th>
              <th className="oc-inv-th-right" title="Lifetime gain/loss percent vs blended average cost basis">Total gain/loss %</th>
              <th className="oc-inv-th-right">Current value</th>
              <th className="oc-inv-th-right">Quantity</th>
              <th className="oc-inv-th-right">Free Lots</th>
              <th className="oc-inv-th-right" title="Symbol-level blended average cost — not specific to the free shares">Average cost basis</th>
              <th className="oc-inv-th-right">Freshness</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = row.symbol.toUpperCase();
              const obs = observations.get(key);
              const spot = obs?.price ?? null;
              const previousClose = obs?.previousClose ?? null;
              // Today's G/L = broker-parity daily move vs prior close (BUG-020):
              // per-share (last − previousClose), scaled by free shares for $.
              const glInputs = { last: spot, previousClose };
              const glChange = computeTodayGlPerShare(glInputs);
              const glPct = computeTodayGlPercent(glInputs);
              const glDir = todayGlDirection(glChange);
              // Capital = market value of the FREE shares at the live quote.
              const capital = spot != null ? row.freeShares * spot : null;
              const economics = economicsBySymbol.get(key) ?? null;

              // Total G/L = lifetime gain/loss on the free shares vs the (blended)
              // cost basis. Change-since-acquisition, distinct from Today's move.
              // Reflects the symbol-level blended average basis (not free-lot-specific).
              const basis = economics?.averageCostPerShare ?? null;
              const totalGlDollar =
                spot != null && basis != null ? (spot - basis) * row.freeShares : null;
              const totalGlPct =
                spot != null && basis != null && basis > 0 ? ((spot - basis) / basis) * 100 : null;
              const rowTotalGlDir = todayGlDirection(totalGlDollar);

              return (
                <tr key={row.symbol}>
                  <td className="oc-inv-td-symbol">{row.symbol}</td>
                  <td className="oc-inv-td-right">{fmtSpot(spot)}</td>
                  <td className={`oc-inv-td-right oc-inv-gl-${glDir}`}>
                    {glChange != null ? fmtSignedMoney(glChange * row.freeShares) : DASH}
                  </td>
                  <td className={`oc-inv-td-right oc-inv-gl-${glDir}`}>{formatTodayGlPercent(glPct)}</td>
                  <td
                    className={`oc-inv-td-right oc-inv-gl-${rowTotalGlDir}`}
                    title="Symbol-level blended average cost — not specific to the free shares"
                  >
                    {totalGlDollar != null ? fmtSignedMoney(totalGlDollar) : DASH}
                  </td>
                  <td className={`oc-inv-td-right oc-inv-gl-${rowTotalGlDir}`}>
                    {totalGlPct != null ? fmtSignedPct(totalGlPct) : DASH}
                  </td>
                  <td className="oc-inv-td-right">{fmtMoney(capital)}</td>
                  <td className="oc-inv-td-right">{row.freeShares.toLocaleString()}</td>
                  <td className="oc-inv-td-right">{row.freeLots}</td>
                  <td className="oc-inv-td-right oc-inv-td-basis" title="Symbol-level blended average cost (not specific to the free shares)">
                    {fmtBasis(economics)}
                  </td>
                  <td className="oc-inv-td-right oc-inv-td-freshness">{fmtFreshness(obs?.observedAt)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="oc-inv-totals-row">
              <td className="oc-inv-td-symbol">Totals{anyPartial ? " *" : ""}</td>
              <td className="oc-inv-td-right" />
              <td className={`oc-inv-td-right oc-inv-gl-${todayGlDirection(glRows > 0 ? totalGl : null)}`}>
                {glRows > 0 ? fmtSignedMoney(totalGl) : DASH}
              </td>
              <td className={`oc-inv-td-right oc-inv-gl-${todayGlDirection(glRows > 0 ? totalGl : null)}`}>
                {totalTodayPct != null ? fmtSignedPct(totalTodayPct) : DASH}
              </td>
              <td className={`oc-inv-td-right oc-inv-gl-${todayGlDirection(totalGlValueRows > 0 ? totalTotalGl : null)}`}>
                {totalGlValueRows > 0 ? fmtSignedMoney(totalTotalGl) : DASH}
              </td>
              <td className={`oc-inv-td-right oc-inv-gl-${todayGlDirection(totalGlValueRows > 0 ? totalTotalGl : null)}`}>
                {totalTotalGlPct != null ? fmtSignedPct(totalTotalGlPct) : DASH}
              </td>
              <td className="oc-inv-td-right">{pricedRows > 0 ? fmtMoney(totalCapital) : DASH}</td>
              <td className="oc-inv-td-right">{totalFreeShares.toLocaleString()}</td>
              <td className="oc-inv-td-right">{totalFreeLots}</td>
              <td className="oc-inv-td-right" />
              <td className="oc-inv-td-right" />
            </tr>
          </tfoot>
        </table>
      ) : (
        trustworthy && <div className="oc-inv-empty">No unencumbered shares.</div>
      )}
      {anyPartial && rows.length > 0 && (
        <div className="oc-inv-totals-note">
          * Totals cover only rows with the required live evidence; some rows lacked a quote or computable move.
        </div>
      )}

      {geometryWarnings.length > 0 && (
        <div className="oc-inv-geometry-warnings">
          {geometryWarnings.map((w) => (
            <div key={w.symbol} className="oc-inv-warning" role="status">
              <span className="oc-inv-warning-symbol">{w.symbol}</span>
              <span className="oc-inv-warning-text">{w.explanation}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// --- CSV export ---

/** One Unencumbered Shares row rendered for CSV (same truthful values as the table). */
export interface UnencumberedCsvRow {
  symbol: string;
  lastPrice: string;      // "$94.00" | "—"
  todayGlDollar: string;  // "+$200" | "—"
  todayGlPct: string;     // "+2.17%" | "—"
  totalGlDollar: string;  // "+$5,400" | "—"
  totalGlPct: string;     // "+135.00%" | "—"
  currentValue: string;   // "$9,400" | "—"
  quantity: number;
  freeLots: number;
  averageCostBasis: string; // "$40.00" | "—"
  freshness: string;      // "1m" | "—"
}

/** CSV header labels for the Unencumbered Shares section (Fidelity wording; order matches UnencumberedCsvRow). */
export const UNENCUMBERED_CSV_HEADER = [
  "Symbol",
  "Last Price",
  "Today's gain/loss $",
  "Today's gain/loss %",
  "Total gain/loss $",
  "Total gain/loss %",
  "Current value",
  "Quantity",
  "Free Lots",
  "Average cost basis",
  "Freshness",
] as const;

/**
 * Build the Unencumbered Shares rows for CSV export, reusing the exact same
 * projection and per-row derivation as the rendered region (single source of
 * truth for values and their honesty rules). Returns "—" where the table shows
 * a dash, so the CSV never fabricates values the UI does not have.
 */
export function buildUnencumberedCsvRows(
  snapshot: PortfolioSnapshot,
  observations: ReadonlyMap<string, QuoteObservation>,
): UnencumberedCsvRow[] {
  const { rows } = deriveUnencumberedInventory(snapshot);
  const economicsBySymbol = new Map(
    snapshot.inventory.map((inv) => [inv.symbol.toUpperCase(), inv.economics]),
  );

  return rows.map((row) => {
    const key = row.symbol.toUpperCase();
    const obs = observations.get(key);
    const spot = obs?.price ?? null;
    const previousClose = obs?.previousClose ?? null;
    // Same canonical broker-parity derivation as the on-screen table (BUG-020).
    const glInputs = { last: spot, previousClose };
    const glChange = computeTodayGlPerShare(glInputs);
    const glPct = computeTodayGlPercent(glInputs);
    const capital = spot != null ? row.freeShares * spot : null;
    const basis = economicsBySymbol.get(key)?.averageCostPerShare ?? null;
    const totalGlDollar = spot != null && basis != null ? (spot - basis) * row.freeShares : null;
    const totalGlPct = spot != null && basis != null && basis > 0 ? ((spot - basis) / basis) * 100 : null;

    return {
      symbol: row.symbol,
      lastPrice: fmtSpot(spot),
      todayGlDollar: glChange != null ? fmtSignedMoney(glChange * row.freeShares) : DASH,
      todayGlPct: formatTodayGlPercent(glPct),
      totalGlDollar: totalGlDollar != null ? fmtSignedMoney(totalGlDollar) : DASH,
      totalGlPct: totalGlPct != null ? fmtSignedPct(totalGlPct) : DASH,
      currentValue: fmtMoney(capital),
      quantity: row.freeShares,
      freeLots: row.freeLots,
      averageCostBasis: fmtBasis(economicsBySymbol.get(key) ?? null),
      freshness: fmtFreshness(obs?.observedAt),
    };
  });
}
