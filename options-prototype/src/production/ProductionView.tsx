/**
 * Production Assessment View — /app/production
 *
 * Two structurally distinct views:
 *   - Current month: operational production surface (what's happened, what's in flight,
 *     where will the month end, what capacity remains)
 *   - Historical months: reconciled actual results (what actually happened)
 *
 * Fidelity upload/snapshot management is an application-level concern
 * handled by the global header. This page consumes globally-stored Activity CSV.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useProductionAssessment } from "./use-production-assessment";
import { CurrentMonthView } from "./CurrentMonthView";
import type { ProductionAssessmentResponse, ReconciliationIssue, ErosionEvent } from "./production-types";
import { getActiveAccountActivityText } from "../portfolio/portfolio-store";
import { usePortfolio } from "../portfolio/use-portfolio";
import "./production.css";

// Legacy page-local Activity key (from a prior page-local upload) — checked as a last-resort
// fallback only. The active account's Activity is sourced through the store (Increment 7).
const LS_KEY_LEGACY = "wheelwright:production:activity-csv";

type MonthTab = "current" | string; // "current" or "YYYY-MM" for historical

export function ProductionView() {
  const { state: currentMonthState, assess: assessCurrentMonth } = useProductionAssessment();
  const { state: historicalState, assess: assessHistorical } = useProductionAssessment();
  const hydratedRef = useRef(false);

  // The active BrokerageAccount (Increment 7): when it changes, Production must re-assess
  // against the newly-active account's own Activity so it never shows another account's
  // realized production.
  const { snapshot } = usePortfolio();
  const activeAccountId = snapshot?.brokerageAccountId ?? null;
  const lastAssessedAccountRef = useRef<string | null | undefined>(undefined);

  // Derive current month
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Month navigation
  const [selectedMonth, setSelectedMonth] = useState<MonthTab>("current");

  // Derive previous months for navigation
  const prevMonths = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
  });

  // Source the ACTIVE ACCOUNT's Activity CSV (Increment 7): Production assessment must be
  // fed the active account's own realized activity so account A's activity can never be
  // assessed as account B's. Falls back to the legacy page-local key only if nothing else.
  const getCsvText = useCallback((): string | null => {
    const activeText = getActiveAccountActivityText();
    if (activeText) return activeText;
    return localStorage.getItem(LS_KEY_LEGACY);
  }, []);

  // Auto-hydrate current month on mount
  useEffect(() => {
    // Re-assess on first mount AND whenever the active account changes (so switching
    // accounts re-derives Production from the newly-active account's Activity).
    if (hydratedRef.current && lastAssessedAccountRef.current === activeAccountId) return;
    hydratedRef.current = true;
    lastAssessedAccountRef.current = activeAccountId;
    const csvText = getCsvText();
    if (csvText) {
      const file = new File([csvText], "activity-history.csv", { type: "text/csv" });
      // Guard against the account-switch race: if the operator switches accounts before this
      // assessment completes, the result is discarded rather than shown under the new account.
      assessCurrentMonth(file, currentMonthKey, { expectedAccountId: activeAccountId });
    }
  }, [assessCurrentMonth, currentMonthKey, getCsvText, activeAccountId]);

  // Assess a specific historical month
  const handleSelectMonth = useCallback((monthKey: string) => {
    setSelectedMonth(monthKey);
    const csvText = getCsvText();
    if (csvText) {
      const file = new File([csvText], "activity-history.csv", { type: "text/csv" });
      assessHistorical(file, monthKey);
    }
  }, [assessHistorical, getCsvText]);

  const handleSelectCurrent = useCallback(() => {
    setSelectedMonth("current");
    // Re-assess current month if not already loaded
    if (currentMonthState.status === "idle" || currentMonthState.status === "error") {
      const csvText = getCsvText();
      if (csvText) {
        const file = new File([csvText], "activity-history.csv", { type: "text/csv" });
        assessCurrentMonth(file, currentMonthKey);
      }
    }
  }, [assessCurrentMonth, currentMonthKey, currentMonthState.status, getCsvText]);

  const handleReassess = useCallback(() => {
    const csvText = getCsvText();
    if (!csvText) return;
    const file = new File([csvText], "activity-history.csv", { type: "text/csv" });
    if (selectedMonth === "current") {
      assessCurrentMonth(file, currentMonthKey);
    } else {
      assessHistorical(file, selectedMonth);
    }
  }, [assessCurrentMonth, assessHistorical, currentMonthKey, getCsvText, selectedMonth]);

  return (
    <div className="prod-shell">
      {/* Month Navigation */}
      <nav className="prod-month-nav">
        <button
          className={`prod-month-btn${selectedMonth === "current" ? " prod-month-active" : ""}`}
          aria-current={selectedMonth === "current" ? "page" : undefined}
          onClick={handleSelectCurrent}
        >
          {currentMonthLabel}
        </button>
        {prevMonths.map((m) => (
          <button
            key={m.key}
            className={`prod-month-btn${selectedMonth === m.key ? " prod-month-active" : ""}`}
            aria-current={selectedMonth === m.key ? "page" : undefined}
            onClick={() => handleSelectMonth(m.key)}
          >
            {m.label}
          </button>
        ))}
        <span className="prod-month-ellipsis" title="Earlier months will appear as historical data becomes available">···</span>
      </nav>

      {/* Current Month — Operational View */}
      {selectedMonth === "current" && (
        <>
          {currentMonthState.status === "idle" && (
            <div className="prod-empty">
              <p>No Activity History available. Upload a Fidelity Activity CSV via the header to assess production.</p>
            </div>
          )}
          {currentMonthState.status === "uploading" && (
            <div className="prod-loading">Assessing current month…</div>
          )}
          {currentMonthState.status === "error" && (
            <div className="prod-error">
              <p>{currentMonthState.message}</p>
              <button onClick={handleReassess} className="prod-retry-btn">Retry</button>
            </div>
          )}
          {currentMonthState.status === "result" && (
            <CurrentMonthView assessment={currentMonthState.data} />
          )}
        </>
      )}

      {/* Historical Month — Reconciled Results */}
      {selectedMonth !== "current" && (
        <>
          {historicalState.status === "idle" && (
            <div className="prod-empty">
              <p>No Activity History available for this month.</p>
            </div>
          )}
          {historicalState.status === "uploading" && (
            <div className="prod-loading">Assessing…</div>
          )}
          {historicalState.status === "error" && (
            <div className="prod-error">
              <p>{historicalState.message}</p>
              <button onClick={handleReassess} className="prod-retry-btn">Retry</button>
            </div>
          )}
          {historicalState.status === "result" && (
            <ProductionResult data={historicalState.data} onReassess={handleReassess} />
          )}
        </>
      )}
    </div>
  );
}

// --- Historical Result Display (unchanged domain semantics) ---

function ProductionResult({ data, onReassess }: { data: ProductionAssessmentResponse; onReassess: () => void }) {
  return (
    <div className="prod-result">
      <section className="prod-hero">
        <div className="prod-period">
          {data.periodDescription}
          <button className="prod-reassess-btn" onClick={onReassess} title="Re-assess from current Activity data">↻</button>
        </div>
        <div className="prod-known">
          <span className="prod-known-label">Known Cash Production</span>
          <span className="prod-known-value">${data.knownCashProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <ReconciliationBadge status={data.reconciliationStatus} />
      </section>

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
    OPTION_CLOSE_LIFECYCLE_UNRESOLVED: "Option Close Unresolved",
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
