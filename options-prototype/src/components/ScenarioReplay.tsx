/**
 * Scenario Replay — document-driven temporal overlay laboratory.
 *
 * Allows stepping through an ordered activity CSV chain and observing:
 * - Raw activity rows recognized
 * - Canonical events produced
 * - Portfolio state before and after
 * - State transitions (diff)
 * - Overlay feasibility changes
 */

import { useState, useMemo, useCallback } from "react";
import { BOOTSTRAP_WHEEL_SCENARIO, type Scenario } from "../scenarios/bootstrap-wheel/manifest";
import { parseActivityCsv, type ActivityRow } from "../scenarios/parseActivityCsv";
import { projectState, diffStates, type StateDiff } from "../scenarios/projectState";

// --- Available scenarios ---

const SCENARIOS: Scenario[] = [BOOTSTRAP_WHEEL_SCENARIO];

// --- Component ---

export function ScenarioReplay() {
  const [scenario] = useState<Scenario>(SCENARIOS[0]);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = scenario.steps[stepIndex];
  const previousStep = stepIndex > 0 ? scenario.steps[stepIndex - 1] : null;

  // Parse current and previous step CSVs
  const currentRows = useMemo(() => parseActivityCsv(currentStep.csv), [currentStep]);
  const previousRows = useMemo(() => previousStep ? parseActivityCsv(previousStep.csv) : [], [previousStep]);

  // Project states
  const currentState = useMemo(() => projectState(currentRows), [currentRows]);
  const previousState = useMemo(() => previousRows.length > 0 ? projectState(previousRows) : null, [previousRows]);

  // Compute diff
  const diff = useMemo<StateDiff | null>(() => {
    if (!previousState) return null;
    return diffStates(previousState, currentState);
  }, [previousState, currentState]);

  // New rows in this step (rows in current that weren't in previous)
  const newRows = useMemo<ActivityRow[]>(() => {
    if (!previousStep) return currentRows;
    // In cumulative mode, new rows are those in current but not in previous
    // Simple approach: compare by length (each step adds rows at the top)
    const prevCount = previousRows.length;
    const curCount = currentRows.length;
    return currentRows.slice(0, curCount - prevCount);
  }, [currentRows, previousRows, previousStep]);

  const handleNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, scenario.steps.length - 1));
  }, [scenario.steps.length]);

  const handlePrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setStepIndex(0);
  }, []);

  return (
    <div className="scenario-replay">
      {/* Header */}
      <header className="scenario-header">
        <h2>Scenario Replay</h2>
        <span className="console-badge" style={{ background: "#2d3a4e", color: "#7ec8e3" }}>
          {scenario.name}
        </span>
        <span className="scenario-desc">{scenario.description}</span>
      </header>

      {/* Timeline */}
      <div className="scenario-timeline">
        {scenario.steps.map((step, i) => (
          <button
            key={step.id}
            className={`scenario-step-btn ${i === stepIndex ? "scenario-step-active" : ""} ${i < stepIndex ? "scenario-step-done" : ""}`}
            onClick={() => setStepIndex(i)}
          >
            <span className="scenario-step-num">{i + 1}</span>
            <span className="scenario-step-label">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="scenario-controls">
        <button onClick={handleReset} disabled={stepIndex === 0}>Reset</button>
        <button onClick={handlePrev} disabled={stepIndex === 0}>← Previous</button>
        <button onClick={handleNext} disabled={stepIndex === scenario.steps.length - 1}>Next →</button>
        <span className="scenario-step-info">Step {stepIndex + 1} of {scenario.steps.length}: <strong>{currentStep.label}</strong></span>
      </div>

      {/* Step description */}
      <div className="scenario-step-desc">
        <p>{currentStep.description}</p>
      </div>

      {/* Main content: two columns */}
      <div className="scenario-content">
        {/* Left: Events and activity */}
        <div className="scenario-left">
          {/* New events this step */}
          <section className="scenario-section">
            <h3>New Activity ({newRows.length} {newRows.length === 1 ? "row" : "rows"})</h3>
            {newRows.length === 0 ? (
              <p className="scenario-empty">No new activity in this step.</p>
            ) : (
              <table className="scenario-events-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {newRows.map((row, i) => (
                    <tr key={i} className={`scenario-event-${row.eventType}`}>
                      <td>{row.date}</td>
                      <td><span className="scenario-event-badge">{row.eventType.replace(/_/g, " ")}</span></td>
                      <td>{row.option ? `${row.option.underlying} ${row.option.type} $${row.option.strike}` : row.symbol || "—"}</td>
                      <td>{row.quantity !== 0 ? row.quantity : "—"}</td>
                      <td>{row.price != null ? `$${row.price.toFixed(2)}` : "—"}</td>
                      <td className={row.amount && row.amount > 0 ? "scenario-positive" : row.amount && row.amount < 0 ? "scenario-negative" : ""}>{row.amount != null ? `$${row.amount.toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* State transition */}
          {diff && (
            <section className="scenario-section">
              <h3>State Transition</h3>
              <div className="scenario-diff">
                {diff.cashDelta !== 0 && (
                  <div className="scenario-diff-row">
                    <span className="scenario-diff-label">Cash</span>
                    <span className={diff.cashDelta > 0 ? "scenario-positive" : "scenario-negative"}>
                      {diff.cashDelta > 0 ? "+" : ""}{diff.cashDelta.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </span>
                  </div>
                )}
                {diff.cashCommittedDelta !== 0 && (
                  <div className="scenario-diff-row">
                    <span className="scenario-diff-label">Cash Committed (puts)</span>
                    <span className={diff.cashCommittedDelta > 0 ? "scenario-negative" : "scenario-positive"}>
                      {diff.cashCommittedDelta > 0 ? "+" : ""}{diff.cashCommittedDelta.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </span>
                  </div>
                )}
                {diff.contractsOpened.length > 0 && diff.contractsOpened.map((c, i) => (
                  <div key={`opened-${i}`} className="scenario-diff-row">
                    <span className="scenario-diff-label">Contract Opened</span>
                    <span className="scenario-positive">{c.underlying} {c.type} ${c.strike} exp {c.expiration}</span>
                  </div>
                ))}
                {diff.contractsClosed.length > 0 && diff.contractsClosed.map((c, i) => (
                  <div key={`closed-${i}`} className="scenario-diff-row">
                    <span className="scenario-diff-label">Contract Closed</span>
                    <span>{c.underlying} {c.type} ${c.strike} exp {c.expiration}</span>
                  </div>
                ))}
                {diff.holdingsAdded.length > 0 && diff.holdingsAdded.map((h, i) => (
                  <div key={`added-${i}`} className="scenario-diff-row">
                    <span className="scenario-diff-label">Shares Acquired</span>
                    <span className="scenario-positive">{h.shares} {h.symbol} @ ${h.costBasis}</span>
                  </div>
                ))}
                {diff.holdingsRemoved.length > 0 && diff.holdingsRemoved.map((h, i) => (
                  <div key={`removed-${i}`} className="scenario-diff-row">
                    <span className="scenario-diff-label">Shares Removed</span>
                    <span>{h.shares} {h.symbol}</span>
                  </div>
                ))}
                {diff.premiumDelta > 0 && (
                  <div className="scenario-diff-row">
                    <span className="scenario-diff-label">Premium Collected</span>
                    <span className="scenario-positive">+${diff.premiumDelta.toFixed(2)}</span>
                  </div>
                )}
                {diff.canWriteCspChanged && (
                  <div className="scenario-diff-row">
                    <span className="scenario-diff-label">Can Write CSP</span>
                    <span>{currentState.canWriteCsp ? "Yes" : "No"}</span>
                  </div>
                )}
                {diff.canWriteCoveredCallChanged && (
                  <div className="scenario-diff-row">
                    <span className="scenario-diff-label">Can Write Covered Call</span>
                    <span>{currentState.canWriteCoveredCall ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right: Current portfolio state */}
        <div className="scenario-right">
          <section className="scenario-section">
            <h3>Portfolio State</h3>
            <table className="scenario-state-table">
              <tbody>
                <tr><td>Cash</td><td>${currentState.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                <tr><td>Committed to Puts</td><td>${currentState.cashCommittedToPuts.toLocaleString()}</td></tr>
                <tr><td>Deployable Cash</td><td className="scenario-highlight">${currentState.deployableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                <tr><td>Total Premium</td><td className="scenario-positive">${currentState.totalPremiumCollected.toFixed(2)}</td></tr>
                <tr><td>Events Processed</td><td>{currentState.eventsProcessed}</td></tr>
              </tbody>
            </table>
          </section>

          {currentState.holdings.length > 0 && (
            <section className="scenario-section">
              <h3>Holdings</h3>
              <table className="scenario-state-table">
                <thead>
                  <tr><th>Symbol</th><th>Shares</th><th>Committed</th><th>Free</th><th>Cost Basis</th></tr>
                </thead>
                <tbody>
                  {currentState.holdings.map((h) => (
                    <tr key={h.symbol}>
                      <td>{h.symbol}</td>
                      <td>{h.shares}</td>
                      <td>{h.sharesCommitted}</td>
                      <td>{h.shares - h.sharesCommitted}</td>
                      <td>${h.costBasis.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {currentState.openContracts.length > 0 && (
            <section className="scenario-section">
              <h3>Open Contracts</h3>
              <table className="scenario-state-table">
                <thead>
                  <tr><th>Type</th><th>Symbol</th><th>Strike</th><th>Exp</th><th>Qty</th><th>Premium</th></tr>
                </thead>
                <tbody>
                  {currentState.openContracts.map((c, i) => (
                    <tr key={i}>
                      <td><span className={`scenario-contract-${c.type.toLowerCase()}`}>{c.type}</span></td>
                      <td>{c.underlying}</td>
                      <td>${c.strike}</td>
                      <td>{c.expiration}</td>
                      <td>{c.quantity}</td>
                      <td>${c.premiumReceived.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="scenario-section">
            <h3>Overlay Feasibility</h3>
            <div className="scenario-feasibility">
              <div className={`scenario-feasibility-item ${currentState.canWriteCsp ? "scenario-feasible" : "scenario-infeasible"}`}>
                <span className="scenario-feasibility-label">Cash-Secured Put</span>
                <span>{currentState.canWriteCsp ? "Available" : "Unavailable"}</span>
              </div>
              <div className={`scenario-feasibility-item ${currentState.canWriteCoveredCall ? "scenario-feasible" : "scenario-infeasible"}`}>
                <span className="scenario-feasibility-label">Covered Call</span>
                <span>{currentState.canWriteCoveredCall ? "Available" : "Unavailable"}</span>
              </div>
              {currentState.freeShares.length > 0 && (
                <div className="scenario-feasibility-detail">
                  Free shares: {currentState.freeShares.map((fs) => `${fs.shares} ${fs.symbol}`).join(", ")}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
