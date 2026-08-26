/**
 * The Notebook — compressed accumulated temporal evidence into scannable geometry.
 *
 * Shows:
 *   - Observation Coverage strip (provenance: how much was Kreature actually watching?)
 *   - Per-position table: observed moneyness envelope, observation window, latest state
 *
 * Purpose: comprehension after evidence has accumulated,
 * including when the operator was not staring at the live stream.
 */

import type { PositionEnvelope } from "./observation-derivation";
import { formatObservationWindow, formatTimeET } from "./observation-derivation";

interface TheNotebookProps {
  /** Per-position envelopes (one per monitored contract) */
  envelopes: PositionEnvelope[];
  /** Total number of distinct monitored underlyings */
  monitoredUnderlyingCount: number;
  /** Number of underlyings with at least one observation today */
  observedUnderlyingCount: number;
  /** Earliest observation across all positions */
  earliestObservation: string | null;
  /** Latest observation across all positions */
  latestObservation: string | null;
}

export function TheNotebook({
  envelopes,
  monitoredUnderlyingCount,
  observedUnderlyingCount,
  earliestObservation,
  latestObservation,
}: TheNotebookProps) {
  if (envelopes.length === 0) {
    return (
      <div className="kr-notebook kr-notebook--empty">
        <p className="kr-notebook-empty-state">
          Load a portfolio to see what Kreature has been watching.
        </p>
      </div>
    );
  }

  // Identify unobserved positions
  const unobserved = envelopes.filter(e => e.momentCount === 0);

  return (
    <div className="kr-notebook">
      {/* Observation Coverage Strip */}
      <CoverageStrip
        monitoredCount={monitoredUnderlyingCount}
        observedCount={observedUnderlyingCount}
        earliest={earliestObservation}
        latest={latestObservation}
        unobservedSymbols={unobserved.map(e => e.underlying)}
      />

      {/* Position Envelope Table */}
      <div className="kr-notebook-section">
        <h3 className="kr-notebook-section-title">Open Positions — Today</h3>
        <table className="kr-notebook-table">
          <thead>
            <tr>
              <th className="kr-th-position">Position</th>
              <th className="kr-th-observed">Observed</th>
              <th className="kr-th-range">Moneyness Range</th>
              <th className="kr-th-latest">Latest</th>
            </tr>
          </thead>
          <tbody>
            {envelopes.map(envelope => (
              <EnvelopeRow key={envelope.positionId} envelope={envelope} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Coverage Strip ---

interface CoverageStripProps {
  monitoredCount: number;
  observedCount: number;
  earliest: string | null;
  latest: string | null;
  unobservedSymbols: string[];
}

function CoverageStrip({
  monitoredCount,
  observedCount,
  earliest,
  latest,
  unobservedSymbols,
}: CoverageStripProps) {
  const coverageText = `${observedCount}/${monitoredCount} monitored underlyings observed today`;

  let windowText = "";
  if (earliest && latest) {
    const earliestET = formatTimeET(earliest);
    const latestET = formatTimeET(latest);
    windowText = earliestET === latestET
      ? `Earliest observation ${earliestET} ET`
      : `Earliest observation ${earliestET} ET \u00b7 Latest ${latestET} ET`;
  }

  return (
    <div className="kr-coverage">
      <span className="kr-coverage-count">{coverageText}</span>
      {windowText && <span className="kr-coverage-window">{windowText}</span>}
      {unobservedSymbols.length > 0 && (
        <span className="kr-coverage-unobserved">
          Unobserved: {unobservedSymbols.join(", ")}
        </span>
      )}
    </div>
  );
}

// --- Envelope Row ---

interface EnvelopeRowProps {
  envelope: PositionEnvelope;
}

function EnvelopeRow({ envelope }: EnvelopeRowProps) {
  const typeLabel = envelope.type === "put" ? "P" : "C";
  const positionLabel = `${envelope.underlying} \u00b7 $${envelope.strike} ${typeLabel === "P" ? "Put" : "Call"} \u00b7 ${formatExpiration(envelope.expiration)}`;

  const observedWindow = formatObservationWindow(
    envelope.momentCount,
    envelope.firstObservedAt,
    envelope.latestObservedAt
  );

  const hasData = envelope.momentCount > 0;

  return (
    <tr className={`kr-envelope-row ${!hasData ? "kr-envelope-row--empty" : ""}`}>
      <td className="kr-td-position">{positionLabel}</td>
      <td className="kr-td-observed">{observedWindow}</td>
      <td className="kr-td-range">{envelope.rangeLabel}</td>
      <td className="kr-td-latest">{envelope.latestLabel}</td>
    </tr>
  );
}

// --- Helpers ---

/** Format expiration date as "Mon DD" (e.g., "Sep 18") */
function formatExpiration(isoDate: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = isoDate.split("-");
  if (parts.length < 3) return isoDate;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${months[monthIdx] || parts[1]} ${day}`;
}
