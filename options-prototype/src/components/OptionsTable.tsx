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
            <th title="The price at which the option holder may buy (call) or sell (put) the underlying">Strike</th>
            <th title="Highest price a buyer is willing to pay for this contract">Bid</th>
            <th title="Lowest price a seller is willing to accept for this contract">Ask</th>
            <th title="Mid price: (Bid + Ask) / 2 — estimated fill price (BR-1)">Mid</th>
            <th title="Rate of change of option price per $1 move in underlying. Approximates probability of expiring in-the-money.">Delta</th>
            <th title="Open Interest: total number of outstanding contracts not yet settled">OI</th>
            <th title="Number of contracts traded during the current session">Volume</th>
            <th title="Moneyness: ITM (in-the-money), ATM (at-the-money), OTM (out-of-the-money) relative to underlying price (BR-4)">Mny</th>
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
