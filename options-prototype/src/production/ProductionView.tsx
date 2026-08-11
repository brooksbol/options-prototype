/**
 * Production Assessment View — /app/production
 *
 * Operator workflow:
 *   1. Upload Fidelity Activity History CSV
 *   2. Backend assesses requested/default month
 *   3. Wheelwright presents the authoritative answer
 *
 * No accounting logic in this component. The backend response is truth.
 */

import { useCallback, useRef, useEffect } from "react";
import { useProductionAssessment } from "./use-production-assessment";
import type { ProductionAssessmentResponse, ReconciliationIssue, ErosionEvent } from "./production-types";
import "./production.css";

const LS_KEY = "wheelwright:production:activity-csv";

export function ProductionView() {
  const { state, assess, reset } = useProductionAssessment();
  const fileRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const file = new File([stored], "activity-history.csv", { type: "text/csv" });
      assess(file);
    }
  }, [assess]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Persist raw CSV text for route-navigation survival
    const text = await file.text();
    localStorage.setItem(LS_KEY, text);
    assess(file);
  }, [assess]);

  const handleReset = useCallback(() => {
    reset();
    localStorage.removeItem(LS_KEY);
    if (fileRef.current) fileRef.current.value = "";
  }, [reset]);

  return (
    <div className="prod-shell">
      <section className="prod-upload">
        <label className="prod-upload-label">
          Fidelity Activity History CSV
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={state.status === "uploading"}
            className="prod-file-input"
          />
        </label>
        {state.status === "result" && !fileRef.current?.value && (
          <span className="prod-restored-note">restored from prior upload</span>
        )}
        {state.status !== "idle" && (
          <button onClick={handleReset} className="prod-reset-btn">Clear</button>
        )}
      </section>

      {state.status === "uploading" && (
        <div className="prod-loading">Assessing…</div>
      )}

      {state.status === "error" && (
        <div className="prod-error">{state.message}</div>
      )}

      {state.status === "result" && (
        <ProductionResult data={state.data} />
      )}
    </div>
  );
}

// --- Result Display ---

function ProductionResult({ data }: { data: ProductionAssessmentResponse }) {
  return (
    <div className="prod-result">
      {/* Hero: Period + Known Production + Status */}
      <section className="prod-hero">
        <div className="prod-period">{data.periodDescription}</div>
        <div className="prod-known">
          <span className="prod-known-label">Known Cash Production</span>
          <span className="prod-known-value">${data.knownCashProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <ReconciliationBadge status={data.reconciliationStatus} />
      </section>

      {/* Unresolved + Erosion */}
      <section className="prod-dimensions">
        {data.unresolvedPotentialProduction > 0 && (
          <div className="prod-unresolved">
            <span className="prod-dim-label">Unresolved Potential</span>
            <span className="prod-dim-value">+${data.unresolvedPotentialProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="prod-erosion">
          <span className="prod-dim-label">Realized Capital Erosion</span>
          <span className="prod-dim-value">${data.realizedCapitalErosion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </section>

      {/* Source Breakdown */}
      <section className="prod-breakdown">
        <h3 className="prod-section-title">Known Production Sources</h3>
        <table className="prod-breakdown-table">
          <tbody>
            {Object.entries(data.productionBreakdown).map(([source, amount]) => (
              <tr key={source}>
                <td className="prod-source-name">{formatSource(source)}</td>
                <td className="prod-source-amount">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Unresolved Potential Sources */}
      {(() => {
        const unresolvedItems = data.reconciliationIssues.filter(i => i.potentialImpact != null && i.potentialImpact > 0);
        if (unresolvedItems.length === 0) return null;
        return (
          <section className="prod-breakdown prod-unresolved-section">
            <h3 className="prod-section-title">Unresolved Potential</h3>
            <table className="prod-breakdown-table">
              <tbody>
                {unresolvedItems.map((issue, i) => (
                  <tr key={i} className="prod-unresolved-row">
                    <td className="prod-source-name prod-unresolved-name">
                      {formatIssueLabel(issue.type)}
                      <span className="prod-unresolved-detail" title={issue.description}>{issue.description}</span>
                    </td>
                    <td className="prod-source-amount prod-unresolved-amount">${issue.potentialImpact!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr className="prod-unresolved-total">
                  <td className="prod-source-name">Unresolved total</td>
                  <td className="prod-source-amount">${data.unresolvedPotentialProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </section>
        );
      })()}

      {/* Reconciliation Issues (if any) */}
      {data.reconciliationIssues.length > 0 && (
        <section className="prod-issues">
          <h3 className="prod-section-title">Reconciliation Issues</h3>
          <ul className="prod-issues-list">
            {data.reconciliationIssues.map((issue, i) => (
              <IssueRow key={i} issue={issue} />
            ))}
          </ul>
        </section>
      )}

      {/* Erosion Events (if any) */}
      {data.erosionEvents.length > 0 && (
        <section className="prod-erosion-events">
          <h3 className="prod-section-title">Capital Erosion Events</h3>
          <ul className="prod-issues-list">
            {data.erosionEvents.map((event, i) => (
              <ErosionRow key={i} event={event} />
            ))}
          </ul>
        </section>
      )}

      {/* Transaction Summary */}
      <section className="prod-summary">
        <h3 className="prod-section-title">Transaction Summary</h3>
        <div className="prod-summary-grid">
          <span className="prod-summary-label">Included</span>
          <span className="prod-summary-value">{data.transactionSummary.included}</span>
          <span className="prod-summary-label">Excluded</span>
          <span className="prod-summary-value">{data.transactionSummary.excluded}</span>
          <span className="prod-summary-label">Uncertain</span>
          <span className="prod-summary-value">{data.transactionSummary.uncertain}</span>
          <span className="prod-summary-label">Not Applicable</span>
          <span className="prod-summary-value">{data.transactionSummary.notApplicable}</span>
        </div>
      </section>
    </div>
  );
}

// --- Sub-components ---

function ReconciliationBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    FULLY_RECONCILED: "Fully Reconciled",
    PRODUCTION_UNCERTAIN: "Production Uncertain",
    SOURCE_INCOMPLETE: "Source Incomplete",
  };
  const className = `prod-badge prod-badge-${status.toLowerCase().replace("_", "-")}`;
  return <span className={className}>{labels[status] || status}</span>;
}

function IssueRow({ issue }: { issue: ReconciliationIssue }) {
  return (
    <li className="prod-issue">
      <span className="prod-issue-type">{formatIssueType(issue.type)}</span>
      <span className="prod-issue-desc">{issue.description}</span>
      {issue.potentialImpact != null && (
        <span className="prod-issue-impact">${issue.potentialImpact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      )}
    </li>
  );
}

function ErosionRow({ event }: { event: ErosionEvent }) {
  return (
    <li className="prod-issue">
      <span className="prod-issue-type">{event.date} · {event.symbol}</span>
      <span className="prod-issue-desc">{event.description}</span>
      <span className="prod-issue-impact">${event.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </li>
  );
}

// --- Formatters ---

function formatSource(source: string): string {
  const labels: Record<string, string> = {
    OPTION_PREMIUM: "Option Premium",
    MONEY_MARKET_INCOME: "Money Market Income",
    TREASURY_DISCOUNT: "Treasury Discount",
    DIVIDEND: "Dividends",
    REALIZED_APPRECIATION: "Realized Appreciation",
  };
  return labels[source] || source.replace(/_/g, " ");
}

function formatIssueType(type: string): string {
  const labels: Record<string, string> = {
    BASIS_UNKNOWN: "Basis Unknown",
    DISTRIBUTION_CHARACTER_UNKNOWN: "Distribution Character",
    UNCLASSIFIED_ACTION: "Unclassified",
    INCOMPLETE_PERIOD_COVERAGE: "Incomplete Coverage",
    INSUFFICIENT_HISTORY: "Insufficient History",
  };
  return labels[type] || type.replace(/_/g, " ");
}

function formatIssueLabel(type: string): string {
  const labels: Record<string, string> = {
    DISTRIBUTION_CHARACTER_UNKNOWN: "Distribution — character unconfirmed",
    BASIS_UNKNOWN: "Basis unconfirmed",
    UNCLASSIFIED_ACTION: "Unclassified transaction",
    INCOMPLETE_PERIOD_COVERAGE: "Incomplete coverage",
    INSUFFICIENT_HISTORY: "Insufficient history",
  };
  return labels[type] || type.replace(/_/g, " ").toLowerCase();
}
