/**
 * OptionsTable — renders a table of option contracts with derived display values.
 *
 * Responsibility: Sort contracts, compute display values via domain functions,
 *   highlight the target-delta row, format for display.
 * Calls: midPrice(), moneyness() from domain/calculations for display derivation.
 * Must not: Own sorting state, perform delta matching, fetch data, modify contracts.
 *
 * Reference: docs/05-design.md (OptionsTable)
 * Reference: docs/05a-component-map.md (OptionsTable)
 */

import type { OptionContract } from "../domain/types";
import { midPrice, moneyness } from "../domain/calculations";

interface Props {
  contracts: OptionContract[];
  underlyingPrice: number;
  highlightedStrike: number | null;
  sortDirection: "asc" | "desc";
  title: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function OptionsTable({
  contracts,
  underlyingPrice,
  highlightedStrike,
  sortDirection,
  title,
}: Props) {
  const sorted = [...contracts].sort((a, b) =>
    sortDirection === "asc" ? a.strike - b.strike : b.strike - a.strike
  );

  return (
    <div className="options-table-container">
      <h3 className="table-title">{title}</h3>
      <table className="options-table">
        <thead>
          <tr>
            <th>Strike</th>
            <th>Bid</th>
            <th>Ask</th>
            <th>Mid</th>
            <th>Delta</th>
            <th>OI</th>
            <th>Volume</th>
            <th>Mny</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const mid = midPrice(c.bid, c.ask);
            const mny = moneyness(c.strike, underlyingPrice, c.type);
            const isHighlighted = c.strike === highlightedStrike;

            return (
              <tr
                key={c.strike}
                className={isHighlighted ? "row-highlighted" : ""}
              >
                <td>${c.strike.toFixed(0)}</td>
                <td>{c.bid.toFixed(2)}</td>
                <td>{c.ask.toFixed(2)}</td>
                <td>{mid.toFixed(2)}</td>
                <td>{c.delta.toFixed(2)}</td>
                <td>{formatNumber(c.openInterest)}</td>
                <td>{formatNumber(c.volume)}</td>
                <td>
                  <span className={`moneyness-badge moneyness-${mny.toLowerCase()}`}>
                    {mny}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
