import { useState } from "react";
import {
  midPrice,
  premiumPerContract,
  annualizedYield,
  moneyness,
  assignmentProbability,
} from "./domain/calculations";
import { findClosestToDelta } from "./domain/delta";
import { DEFAULT_DELTA_POLICY, type DeltaTieBreaker } from "./domain/policy";
import type { OptionContract } from "./domain/types";
import { ALL_SCENARIOS } from "./engineering/probeData";
import { MassiveChainView } from "./components/MassiveChainView";
import { ReferenceDataView } from "./components/ReferenceDataView";
import { RecommendationLab } from "./components/RecommendationLab";
import { CsvImportLab } from "./components/CsvImportLab";
import { loadWorkspace, updateWorkspace } from "./workspace/workspace";
import "./App.css";

/**
 * Engineering Laboratory — Interactive Delta Probe + Provider Views
 *
 * Tab-based navigation:
 *   - Laboratory: engineering fixtures + interactive probe
 *   - Reference Data: observed market fixtures (Fidelity XLE)
 *   - Massive API: real provider data spike
 */

type ViewMode = "laboratory" | "reference" | "recommendation" | "csvimport" | "massive";

const TIE_BREAKER_OPTIONS: DeltaTieBreaker[] = [
  "PreferOTM",
  "PreferITM",
  "PreferHigherStrike",
  "PreferLowerStrike",
];

function App() {
  const [view, setView] = useState<ViewMode>(() => {
    const ws = loadWorkspace();
    const saved = ws.activeTab as ViewMode;
    if (["laboratory", "reference", "recommendation", "csvimport", "massive"].includes(saved)) return saved;
    return "recommendation";
  });

  const changeView = (v: ViewMode) => {
    setView(v);
    updateWorkspace({ activeTab: v });
  };
  const [targetDelta, setTargetDelta] = useState(DEFAULT_DELTA_POLICY.targetDelta);
  const [tieBreaker, setTieBreaker] = useState<DeltaTieBreaker>(DEFAULT_DELTA_POLICY.tieBreaker);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const scenario = ALL_SCENARIOS[scenarioIndex];
  const highlighted = findClosestToDelta(
    scenario.contracts,
    targetDelta,
    tieBreaker
  );

  return (
    <div className="console">
      <header className="console-header">
        <h1>Options Prototype</h1>
        <nav className="console-tabs">
          <button
            className={`tab-btn ${view === "laboratory" ? "tab-active" : ""}`}
            onClick={() => changeView("laboratory")}
          >
            Laboratory
          </button>
          <button
            className={`tab-btn ${view === "reference" ? "tab-active" : ""}`}
            onClick={() => changeView("reference")}
          >
            Options Chain
          </button>
          <button
            className={`tab-btn ${view === "recommendation" ? "tab-active" : ""}`}
            onClick={() => changeView("recommendation")}
          >
            Recommendation Lab
          </button>
          <button
            className={`tab-btn ${view === "csvimport" ? "tab-active" : ""}`}
            onClick={() => changeView("csvimport")}
          >
            CSV Import Lab
          </button>
          <button
            className={`tab-btn ${view === "massive" ? "tab-active" : ""}`}
            onClick={() => changeView("massive")}
          >
            Massive API
          </button>
        </nav>
      </header>

      {view === "massive" ? (
        <MassiveChainView />
      ) : view === "reference" ? (
        <ReferenceDataView />
      ) : view === "recommendation" ? (
        <RecommendationLab />
      ) : view === "csvimport" ? (
        <CsvImportLab />
      ) : (
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
              <dd className={tieBreaker !== DEFAULT_DELTA_POLICY.tieBreaker ? "policy-override" : ""}>
                {tieBreaker}
                {tieBreaker !== DEFAULT_DELTA_POLICY.tieBreaker && (
                  <span className="policy-default-hint"> (default: {DEFAULT_DELTA_POLICY.tieBreaker})</span>
                )}
              </dd>
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
                <label className="probe-label">
                  Tie-Breaker:
                  <select
                    value={tieBreaker}
                    onChange={(e) => setTieBreaker(e.target.value as DeltaTieBreaker)}
                  >
                    {TIE_BREAKER_OPTIONS.map((tb) => (
                      <option key={tb} value={tb}>{tb}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <p className="probe-context">
              {scenario.description} | Underlying: ${scenario.underlyingPrice} | DTE: {scenario.dte}
            </p>

            <DecisionNarrative
              contracts={scenario.contracts}
              targetDelta={targetDelta}
              tieBreaker={tieBreaker}
              selected={highlighted}
            />

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
      )}
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

function DecisionNarrative({
  contracts,
  targetDelta,
  tieBreaker,
  selected,
}: {
  contracts: OptionContract[];
  targetDelta: number;
  tieBreaker: DeltaTieBreaker;
  selected: OptionContract | null;
}) {
  if (!selected || contracts.length === 0) {
    return <p className="decision-narrative">No contracts available.</p>;
  }

  // Derive distances for all contracts
  const distances = contracts.map((c) => ({
    contract: c,
    distance: Math.abs(Math.abs(c.delta) - targetDelta),
  }));

  // Find minimum distance
  const minDistance = Math.min(...distances.map((d) => d.distance));

  // Find all contracts at minimum distance (candidates)
  const candidates = distances.filter((d) => Math.abs(d.distance - minDistance) < 1e-10);

  let narrative: string;

  if (candidates.length === 1) {
    // Clear winner — no tie
    const winner = candidates[0];
    narrative = `Selected $${winner.contract.strike} ${winner.contract.type} — closest to target delta ${targetDelta.toFixed(2)} with distance ${winner.distance.toFixed(4)}. No tie detected.`;
  } else {
    // Tie detected
    const candidateList = candidates
      .map((c) => `$${c.contract.strike} ${c.contract.type}`)
      .join(" and ");

    let reason: string;
    switch (tieBreaker) {
      case "PreferOTM":
        reason = selected.type === "CALL"
          ? "it has the higher strike (more OTM for calls)"
          : "it has the lower strike (more OTM for puts)";
        break;
      case "PreferITM":
        reason = selected.type === "CALL"
          ? "it has the lower strike (more ITM for calls)"
          : "it has the higher strike (more ITM for puts)";
        break;
      case "PreferHigherStrike":
        reason = "it has the higher strike";
        break;
      case "PreferLowerStrike":
        reason = "it has the lower strike";
        break;
    }

    narrative = `Tie detected: ${candidateList} both distance ${minDistance.toFixed(4)} from target delta ${targetDelta.toFixed(2)}. Policy ${tieBreaker} selected $${selected.strike} ${selected.type} because ${reason}.`;
  }

  return (
    <p className={`decision-narrative ${candidates.length > 1 ? "narrative-tie" : "narrative-clear"}`}>
      {narrative}
    </p>
  );
}

export default App;
