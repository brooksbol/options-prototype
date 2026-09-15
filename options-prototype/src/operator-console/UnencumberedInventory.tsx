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
import type { SpotHistoryMap } from "../evidence/use-spot-history";
import { deriveUnencumberedInventory } from "../portfolio/unencumbered-inventory";
import {
  computeTodayUnderlyingChange,
  computeTodayUnderlyingChangePercent,
  formatTodayGlCombined,
  todayGlDirection,
} from "./today-gl";

interface UnencumberedInventoryProps {
  snapshot: PortfolioSnapshot;
  /** Per-symbol live quote observations (uppercase-keyed). Empty for unobserved symbols. */
  observations: ReadonlyMap<string, QuoteObservation>;
  /** Per-underlying spot history for the Today's G/L intraday move. */
  spotHistory: SpotHistoryMap;
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

export function UnencumberedInventory({ snapshot, observations, spotHistory }: UnencumberedInventoryProps) {
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
  // Total Today's G/L = Σ (per-share underlying move × free shares) over rows that
  // HAVE a computable intraday move. Dollar-weighted by free shares — summing the
  // per-share moves directly would be meaningless across differently-priced symbols.
  // This is the underlying's dollar move on the free shares (market context), NOT a
  // position mark-to-market P/L — same honest semantics as the per-row column.
  //
  // Total % = totalGl / (Σ free-shares × start-of-day reference price) × 100 — a
  // dollar-weighted portfolio percent, NOT an average of per-row percents (which
  // would misweight differently-sized rows). The reference base is the free-share
  // value at each row's start-of-day price (latest − move), so total% is coherent
  // with total$.
  let totalGl = 0;
  let glReferenceBase = 0; // Σ free-shares × start-of-day price, over rows with a move
  let glRows = 0;
  let glMissingRows = 0;
  for (const row of rows) {
    const key = row.symbol.toUpperCase();
    const spot = observations.get(key)?.price ?? null;
    if (spot != null) {
      totalCapital += row.freeShares * spot;
      pricedRows++;
    } else {
      unpricedRows++;
    }
    const glChange = computeTodayUnderlyingChange(spotHistory.get(key));
    if (glChange != null) {
      totalGl += glChange * row.freeShares;
      glRows++;
      // Start-of-day reference price for this row = current spot − per-share move.
      // (Falls back gracefully to 0 contribution when spot is unavailable, which is
      // rare since a computable move implies ≥2 same-day observations.)
      if (spot != null) glReferenceBase += row.freeShares * (spot - glChange);
    } else {
      glMissingRows++;
    }
  }
  const totalCapitalLabel =
    pricedRows > 0
      ? `${fmtMoney(totalCapital)}${unpricedRows > 0 ? " (partial)" : ""}`
      : null;
  const totalGlPct = glReferenceBase > 0 ? (totalGl / glReferenceBase) * 100 : null;
  const totalGlLabel =
    glRows > 0
      ? `${fmtSignedMoney(totalGl)}${glMissingRows > 0 ? " (partial)" : ""}`
      : null;
  const totalGlPctLabel =
    glRows > 0 && totalGlPct != null
      ? `${fmtSignedPct(totalGlPct)}${glMissingRows > 0 ? " (partial)" : ""}`
      : null;
  const totalGlDir = totalGlLabel ? todayGlDirection(totalGl) : "flat";

  return (
    <section className="oc-region-inventory" aria-label="Unencumbered Shares">
      <div className="oc-inv-header">
        <span className="oc-inv-title">
          Unencumbered Shares
          {totalCapitalLabel && (
            <span
              className="oc-inv-title-total"
              title={
                unpricedRows > 0
                  ? `Total capital of free shares with a live quote (${pricedRows} of ${pricedRows + unpricedRows} rows priced; the rest lack a current quote)`
                  : "Total capital of free shares (free shares × live spot)"
              }
            >
              {" "}({totalCapitalLabel})
            </span>
          )}
          {totalGlLabel && (
            <span
              className={`oc-inv-title-gl oc-inv-gl-${totalGlDir}`}
              title={
                glMissingRows > 0
                  ? `Today's total G/L: Σ (underlying intraday move × free shares) and dollar-weighted percent, over rows with a computable move (${glRows} of ${glRows + glMissingRows}); market context, not a position P/L`
                  : "Today's total G/L: Σ (underlying intraday move × free shares) and dollar-weighted percent; market context, not a position P/L"
              }
            >
              {" "}{totalGlLabel}{totalGlPctLabel ? `, ${totalGlPctLabel}` : ""}
            </span>
          )}
        </span>
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
              <th className="oc-inv-th-right">Free Shares</th>
              <th className="oc-inv-th-right">Free Lots</th>
              <th className="oc-inv-th-right">Spot</th>
              <th className="oc-inv-th-right">Today&apos;s G/L</th>
              <th className="oc-inv-th-right">Capital</th>
              <th className="oc-inv-th-right" title="Symbol-level blended average cost — not specific to the free shares">Share Basis</th>
              <th className="oc-inv-th-right">Freshness</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = row.symbol.toUpperCase();
              const obs = observations.get(key);
              const spot = obs?.price ?? null;
              const moments = spotHistory.get(key);
              const glChange = computeTodayUnderlyingChange(moments);
              const glPct = computeTodayUnderlyingChangePercent(moments);
              const glDir = todayGlDirection(glChange);
              // Capital = market value of the FREE shares at the live quote.
              const capital = spot != null ? row.freeShares * spot : null;
              const economics = economicsBySymbol.get(key) ?? null;

              return (
                <tr key={row.symbol}>
                  <td className="oc-inv-td-symbol">{row.symbol}</td>
                  <td className="oc-inv-td-right">{row.freeShares.toLocaleString()}</td>
                  <td className="oc-inv-td-right">{row.freeLots}</td>
                  <td className="oc-inv-td-right">{fmtSpot(spot)}</td>
                  <td className={`oc-inv-td-right oc-inv-gl-${glDir}`}>
                    {formatTodayGlCombined(glChange, glPct)}
                  </td>
                  <td className="oc-inv-td-right">{fmtMoney(capital)}</td>
                  <td className="oc-inv-td-right oc-inv-td-basis" title="Symbol-level blended average cost (not specific to the free shares)">
                    {fmtBasis(economics)}
                  </td>
                  <td className="oc-inv-td-right oc-inv-td-freshness">{fmtFreshness(obs?.observedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        trustworthy && <div className="oc-inv-empty">No unencumbered shares.</div>
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
