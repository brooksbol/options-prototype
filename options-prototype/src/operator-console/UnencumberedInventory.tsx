/**
 * Unencumbered Shares — Operator Console region (PL-ELIG V1)
 *
 * Renders standalone free-share inventory ABOVE and SEPARATE FROM the DTE ladder.
 * The DTE ladder remains the temporal option-position / encumbered-capital surface;
 * shares are never inserted into it.
 *
 * This component is presentation only. It composes:
 *   - the pure projection (deriveUnencumberedInventory) → rows + geometryWarnings
 *   - snapshot readiness status + complete existing readiness warnings
 *   - Option Summary provenance (with export-timestamp fallback)
 *
 * Three states MUST be visually distinguishable (canonical: docs/parking-lot-8.md
 * §PL-ELIG):
 *   1. inventory evidence unavailable / incomplete
 *   2. evidence usable and no unencumbered shares (trustworthy zero)
 *   3. one or more unencumbered-share rows
 *
 * Visibility: render when rows exist OR geometryWarnings exist OR evidence is not
 * trustworthy. For a trustworthy zero, a truthful "No unencumbered shares" state is
 * shown (not a silent collapse), so absence-of-evidence never looks like a
 * trustworthy zero.
 */

import type { PortfolioSnapshot } from "../write-desk/types";
import { deriveUnencumberedInventory } from "../portfolio/unencumbered-inventory";

interface UnencumberedInventoryProps {
  snapshot: PortfolioSnapshot;
}

/**
 * Evidence is "trustworthy" for free-share display when the Option Summary loaded
 * and readiness is not in an incomplete/blocked state. We use the overall readiness
 * status + loaded flag — NOT fragile substring parsing of individual warnings.
 */
function inventoryEvidenceTrustworthy(snapshot: PortfolioSnapshot): boolean {
  const r = snapshot.readiness;
  if (!r) return false;
  if (!r.optionSummaryLoaded) return false;
  if (!r.inventoryValid) return false;
  return r.status !== "INCOMPLETE" && r.status !== "CONFLICTED";
}

/** Option Summary export-time line with explicit fallback; parse time never masquerades as export time. */
function provenanceLine(snapshot: PortfolioSnapshot): string {
  const p = snapshot.provenance;
  const source = p?.optionSummaryFilename ? `Fidelity Option Summary · ${p.optionSummaryFilename}` : "Fidelity Option Summary";
  if (p?.optionSummaryExportTimestamp) {
    return `${source} · exported ${formatTs(p.optionSummaryExportTimestamp)}`;
  }
  // Export timestamp unavailable — say so explicitly. Optionally show parse time,
  // clearly labeled as parse time (never as broker export/observation time).
  const parseNote = p?.optionSummaryParsedAt ? ` · parsed ${formatTs(p.optionSummaryParsedAt)}` : "";
  return `${source} · Export time unavailable${parseNote}`;
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function UnencumberedInventory({ snapshot }: UnencumberedInventoryProps) {
  const { rows, geometryWarnings } = deriveUnencumberedInventory(snapshot);
  const trustworthy = inventoryEvidenceTrustworthy(snapshot);
  const readinessWarnings = snapshot.readiness?.warnings ?? [];

  // Visibility: the contract's rule is "rows OR warnings OR untrustworthy". For a
  // trustworthy zero (no rows, no warnings, trustworthy evidence), the contract
  // leaves collapse-vs-truthful-empty to implementation UNLESS architecture requires
  // otherwise. Doc 26 makes free-share visibility a required Console region, and the
  // three-state distinction requires State 2 (trustworthy zero) to be distinguishable
  // from State 1 (evidence unavailable). We therefore render a truthful empty state
  // for the trustworthy zero rather than collapse silently — so absence-of-region can
  // never be mistaken for "no unencumbered shares." The region is thus always shown.

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
              <th className="oc-inv-th-right">Free Shares</th>
              <th className="oc-inv-th-right">Free Lots</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol}>
                <td className="oc-inv-td-symbol">{row.symbol}</td>
                <td className="oc-inv-td-right">{row.freeShares.toLocaleString()}</td>
                <td className="oc-inv-td-right">{row.freeLots}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        trustworthy && (
          <div className="oc-inv-empty">No unencumbered shares.</div>
        )
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
