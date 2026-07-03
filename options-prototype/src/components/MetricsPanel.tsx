/**
 * MetricsPanel — displays calculated income metrics for a highlighted contract.
 *
 * Responsibility: Derive collateral from contract.type, compute all 5 metrics
 *   via domain functions, display formatted results.
 * Calls: midPrice(), premiumPerContract(), annualizedYield(), moneyness(),
 *   assignmentProbability() from domain/calculations.
 * Must not: Perform delta matching, fetch data, infer type from anything
 *   other than contract.type.
 *
 * Reference: docs/05-design.md (MetricsPanel)
 * Reference: docs/05a-component-map.md (MetricsPanel)
 */

import type { OptionContract } from "../domain/types";
import {
  midPrice,
  premiumPerContract,
  annualizedYield,
  moneyness,
  assignmentProbability,
} from "../domain/calculations";

interface Props {
  contract: OptionContract | null;
  underlyingPrice: number;
  dte: number;
  label: string;
}

export function MetricsPanel({ contract, underlyingPrice, dte, label }: Props) {
  if (!contract) {
    return (
      <div className="metrics-panel metrics-panel-empty">
        <h3 className="metrics-title">{label}</h3>
        <p className="metrics-placeholder">No contract selected</p>
      </div>
    );
  }

  const mid = midPrice(contract.bid, contract.ask);
  const premium = premiumPerContract(mid);
  const collateral = contract.type === "CALL" ? underlyingPrice : contract.strike;
  const yield_ = annualizedYield(mid, collateral, dte);
  const mny = moneyness(contract.strike, underlyingPrice, contract.type);
  const assignProb = assignmentProbability(contract.delta);

  return (
    <div className="metrics-panel">
      <h3 className="metrics-title">{label}</h3>
      <dl className="metrics-list">
        <dt>Contract</dt>
        <dd>${contract.strike} {contract.type}</dd>

        <dt>Mid Price</dt>
        <dd>${mid.toFixed(2)}</dd>

        <dt>Premium / Contract</dt>
        <dd>${premium.toFixed(2)}</dd>

        <dt>Annualized Yield</dt>
        <dd className="metrics-highlight">{yield_.toFixed(1)}%</dd>

        <dt>Collateral</dt>
        <dd>${collateral.toFixed(2)}</dd>

        <dt>Moneyness</dt>
        <dd>{mny}</dd>

        <dt>Assignment Prob</dt>
        <dd>{(assignProb * 100).toFixed(0)}%</dd>
      </dl>
    </div>
  );
}
