import {
  midPrice,
  premiumPerContract,
  annualizedYield,
  moneyness,
  assignmentProbability,
} from "./domain/calculations";
import { DEFAULT_DELTA_POLICY } from "./domain/policy";
import type { OptionContract } from "./domain/types";
import "./App.css";

/**
 * Engineering Console — T-04a (updated T-06)
 *
 * Temporary observability surface. Replaced by end-user UI in later tasks.
 * Shows implementation status, domain modules, calculation probes,
 * active policy configuration, and sample domain objects.
 */

const SAMPLE_CONTRACT: OptionContract = {
  type: "CALL",
  strike: 550,
  bid: 3.40,
  ask: 3.60,
  delta: 0.32,
  openInterest: 8420,
  volume: 2150,
};

const SAMPLE_UNDERLYING_PRICE = 545.2;
const SAMPLE_DTE = 14;

function App() {
  // Calculation probes using domain functions
  const mid = midPrice(SAMPLE_CONTRACT.bid, SAMPLE_CONTRACT.ask);
  const premium = premiumPerContract(mid);
  const yield_ = annualizedYield(mid, SAMPLE_UNDERLYING_PRICE, SAMPLE_DTE);
  const mny = moneyness(SAMPLE_CONTRACT.strike, SAMPLE_UNDERLYING_PRICE, SAMPLE_CONTRACT.type);
  const assignProb = assignmentProbability(SAMPLE_CONTRACT.delta);

  return (
    <div className="console">
      <header className="console-header">
        <h1>Options Prototype</h1>
        <span className="console-badge">Engineering Console</span>
      </header>

      <section className="console-section">
        <h2>Implementation Status</h2>
        <table className="status-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="status-complete">
              <td>T-01</td>
              <td>Project scaffold</td>
              <td>complete</td>
            </tr>
            <tr className="status-complete">
              <td>T-02</td>
              <td>Test framework</td>
              <td>complete</td>
            </tr>
            <tr className="status-complete">
              <td>T-03</td>
              <td>Domain types</td>
              <td>complete</td>
            </tr>
            <tr className="status-complete">
              <td>T-04</td>
              <td>Calculation library + tests</td>
              <td>complete</td>
            </tr>
            <tr className="status-complete">
              <td>T-06</td>
              <td>Policy engine + tests</td>
              <td>complete</td>
            </tr>
            <tr className="status-complete">
              <td>T-08</td>
              <td>Delta matching + tests</td>
              <td>complete</td>
            </tr>
            <tr className="status-pending">
              <td>T-10</td>
              <td>MarketDataProvider interface</td>
              <td>pending</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="console-section">
        <h2>Domain Modules</h2>
        <table className="module-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Path</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>types</td>
              <td><code>src/domain/types.ts</code></td>
              <td>implemented</td>
            </tr>
            <tr>
              <td>calculations</td>
              <td><code>src/domain/calculations.ts</code></td>
              <td>implemented</td>
            </tr>
            <tr>
              <td>policy</td>
              <td><code>src/domain/policy.ts</code></td>
              <td>implemented</td>
            </tr>
            <tr>
              <td>delta</td>
              <td><code>src/domain/delta.ts</code></td>
              <td>implemented</td>
            </tr>
            <tr>
              <td>provider</td>
              <td><code>src/domain/provider.ts</code></td>
              <td>planned</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="console-section">
        <h2>Active Policy</h2>
        <table className="probe-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Target Delta</td>
              <td>{DEFAULT_DELTA_POLICY.targetDelta}</td>
              <td>DEFAULT_DELTA_POLICY</td>
            </tr>
            <tr>
              <td>Tie-Breaker</td>
              <td>{DEFAULT_DELTA_POLICY.tieBreaker}</td>
              <td>DEFAULT_DELTA_POLICY</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="console-section">
        <h2>Calculation Probes</h2>
        <p className="probe-context">
          Sample: {SAMPLE_CONTRACT.type} strike ${SAMPLE_CONTRACT.strike}, underlying ${SAMPLE_UNDERLYING_PRICE}, {SAMPLE_DTE} DTE
        </p>
        <table className="probe-table">
          <thead>
            <tr>
              <th>Calculation</th>
              <th>Business Rule</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mid Price</td>
              <td>BR-1</td>
              <td>${mid.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Premium per Contract</td>
              <td>BR-2</td>
              <td>${premium.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Annualized Yield</td>
              <td>BR-3</td>
              <td>{yield_.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Moneyness</td>
              <td>BR-4</td>
              <td>{mny}</td>
            </tr>
            <tr>
              <td>Assignment Probability</td>
              <td>BR-5</td>
              <td>{(assignProb * 100).toFixed(0)}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="console-section">
        <h2>Sample Domain Object</h2>
        <pre className="json-display">
          {JSON.stringify(SAMPLE_CONTRACT, null, 2)}
        </pre>
      </section>
    </div>
  );
}

export default App;
