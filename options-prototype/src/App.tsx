import { useState } from "react";
import {
  midPrice,
  premiumPerContract,
  annualizedYield,
  moneyness,
  assignmentProbability,
} from "./domain/calculations";
import { findClosestToDelta } from "./domain/delta";
import { DEFAULT_DELTA_POLICY } from "./domain/policy";
import type { OptionContract } from "./domain/types";
import { ALL_SCENARIOS } from "./engineering/probeData";
import "./App.css";

/**
 * Engineering Laboratory — Interactive Delta Probe
 *
 * Desktop-first two-column layout:
 *   Left sidebar: status, modules, policy (always visible)
 *   Main area: interactive probe table + metrics
 */

function App() {
  const [targetDelta, setTargetDelta] = useState(DEFAULT_DELTA_POLICY.targetDelta);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const scenario = ALL_SCENARIOS[scenarioIndex];
  const highlighted = findClosestToDelta(
    scenario.contracts,
    targetDelta,
    DEFAULT_DELTA_POLICY.tieBreaker
  );

  return (
    <div className="console">
      <header className="console-header">
        <h1>Options Prototype</h1>
        <span className="console-badge">Engineering Laboratory</span>
      </header>

      <div className="console-layout">
        <aside className="console-sidebar">
          <section className="sidebar-section">
            <h2>Implementation Status</h2>
            <table className="compact-table status-table">
              <tbody>
                <tr className="status-complete"><td>T-01</td><td>Scaffold</td><td>done</td></tr>
                <tr className="status-complete"><td>T-02</td><td>Tests</td><td>done</td></tr>
                <tr className="status-complete"><td>T-03</td><td>Types</td><td>done</td></tr>
                <tr className="status-complete"><td>T-04</td><td>Calculations</td><td>done</td></tr>
                <tr className="status-complete"><td>T-06</td><td>Policy</td><td>done</td></tr>
                <tr className="status-complete"><td>T-08</td><td>Delta matching</td><td>done</td></tr>
                <tr className="status-pending"><td>T-10</td><td>Provider interface</td><td>next</td></tr>
              </tbody>
            </table>
          </section>

          <section className="sidebar-section">
            <h2>Domain Modules</h2>
            <table className="compact-table module-table">
              <tbody>
                <tr><td>types</td><td>implemented</td></tr>
                <tr><td>calculations</td><td>implemented</td></tr>
                <tr><td>policy</td><td>implemented</td></tr>
                <tr><td>delta</td><td>implemented</td></tr>
                <tr><td>provider</td><td>planned</td></tr>
              </tbody>
            </table>
          </section>

          <section className="sidebar-section">
            <h2>Active Policy</h2>
            <dl className="policy-list">
              <dt>Target Δ</dt>
              <dd>{targetDelta.toFixed(2)}</dd>
              <dt>Tie-Breaker</dt>
              <dd>{DEFAULT_DELTA_POLICY.tieBreaker}</dd>
            </dl>
          </section>
        </aside>

        <main className="console-main">
          <section className="main-section">
            <div className="probe-header">
              <h2>Interactive Delta Probe</h2>
              <div className="probe-controls">
                <label className="probe-label">
                  Scenario:
                  <select
                    value={scenarioIndex}
                    onChange={(e) => setScenarioIndex(Number(e.target.value))}
                  >
                    {ALL_SCENARIOS.map((s, i) => (
                      <option key={s.name} value={i}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="probe-label">
                  Target Δ:
                  <input
                    type="number"
                    min={0.01}
                    max={0.99}
                    step={0.01}
                    value={targetDelta}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v >= 0.01 && v <= 0.99) setTargetDelta(v);
                    }}
                  />
                </label>
              </div>
            </div>

            <p className="probe-context">
              {scenario.description} | Underlying: ${scenario.underlyingPrice} | DTE: {scenario.dte}
            </p>

            <div className="probe-content">
              <div className="probe-table-container">
                <ContractTable
                  contracts={scenario.contracts}
                  underlyingPrice={scenario.underlyingPrice}
                  targetDelta={targetDelta}
                  highlighted={highlighted}
                />
              </div>

              {highlighted && (
                <div className="probe-metrics-container">
                  <h3>Selected Contract</h3>
                  <MetricsDisplay
                    contract={highlighted}
                    underlyingPrice={scenario.underlyingPrice}
                    dte={scenario.dte}
                  />
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ContractTable({
  contracts,
  underlyingPrice,
  targetDelta,
  highlighted,
}: {
  contracts: OptionContract[];
  underlyingPrice: number;
  targetDelta: number;
  highlighted: OptionContract | null;
}) {
  return (
    <table className="probe-table contract-table">
      <thead>
        <tr>
          <th>Strike</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Mid</th>
          <th>Delta</th>
          <th>|Δ| Dist</th>
          <th>Mny</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {contracts.map((c) => {
          const mid = midPrice(c.bid, c.ask);
          const mny = moneyness(c.strike, underlyingPrice, c.type);
          const distance = Math.abs(Math.abs(c.delta) - targetDelta);
          const isHighlighted = highlighted === c;

          return (
            <tr
              key={c.strike}
              className={isHighlighted ? "row-highlighted" : ""}
            >
              <td>${c.strike}</td>
              <td>{c.bid.toFixed(2)}</td>
              <td>{c.ask.toFixed(2)}</td>
              <td>{mid.toFixed(2)}</td>
              <td>{c.delta.toFixed(2)}</td>
              <td>{distance.toFixed(3)}</td>
              <td><span className={`moneyness moneyness-${mny.toLowerCase()}`}>{mny}</span></td>
              <td>{isHighlighted ? "←" : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MetricsDisplay({
  contract,
  underlyingPrice,
  dte,
}: {
  contract: OptionContract;
  underlyingPrice: number;
  dte: number;
}) {
  const mid = midPrice(contract.bid, contract.ask);
  const premium = premiumPerContract(mid);
  const collateral = contract.type === "CALL" ? underlyingPrice : contract.strike;
  const yield_ = annualizedYield(mid, collateral, dte);
  const mny = moneyness(contract.strike, underlyingPrice, contract.type);
  const assignProb = assignmentProbability(contract.delta);

  return (
    <table className="metrics-table">
      <tbody>
        <tr>
          <td className="metric-label">Contract</td>
          <td className="metric-value">${contract.strike} {contract.type}</td>
        </tr>
        <tr>
          <td className="metric-label">Mid Price</td>
          <td className="metric-value">${mid.toFixed(2)}</td>
        </tr>
        <tr>
          <td className="metric-label">Premium / Contract</td>
          <td className="metric-value">${premium.toFixed(2)}</td>
        </tr>
        <tr>
          <td className="metric-label">Annualized Yield</td>
          <td className="metric-value highlight-value">{yield_.toFixed(2)}%</td>
        </tr>
        <tr>
          <td className="metric-label">Collateral</td>
          <td className="metric-value">${collateral.toFixed(2)}</td>
        </tr>
        <tr>
          <td className="metric-label">Moneyness</td>
          <td className="metric-value">{mny}</td>
        </tr>
        <tr>
          <td className="metric-label">Assignment Prob</td>
          <td className="metric-value">{(assignProb * 100).toFixed(0)}%</td>
        </tr>
      </tbody>
    </table>
  );
}

export default App;
