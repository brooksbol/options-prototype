/**
 * OptionsTable — renders a table of option contracts as a visual landscape.
 *
 * UX experiment: moneyness regions
 *   - Rows are styled by region (deep-ITM, ITM, ATM, OTM, deep-OTM)
 *   - An ATM boundary separator marks where ITM transitions to OTM
 *   - The recommendation highlight remains the dominant visual element
 *   - Regional styling provides peripheral orientation without reading
 *
 * Calls: midPrice(), moneyness() from domain/calculations for display derivation.
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

function formatStrike(strike: number): string {
  return strike % 1 === 0 ? `$${strike}` : `$${strike.toFixed(1)}`;
}

/**
 * Determine visual region for a contract.
 * Goes beyond ITM/ATM/OTM to include depth for richer visual treatment.
 */
function getRegion(
  strike: number,
  underlyingPrice: number,
  type: "CALL" | "PUT"
): "deep-itm" | "itm" | "atm" | "otm" | "deep-otm" {
  const distance = strike - underlyingPrice;
  const absDistance = Math.abs(distance);
  const pctDistance = absDistance / underlyingPrice;

  // ATM: within $0.50 (existing tolerance)
  if (absDistance <= 0.5) return "atm";

  // For calls: strike < underlying = ITM, strike > underlying = OTM
  // For puts: strike > underlying = ITM, strike < underlying = OTM
  const isITM = type === "CALL" ? distance < 0 : distance > 0;

  // Deep: more than ~3% away from underlying
  const isDeep = pctDistance > 0.03;

  if (isITM) return isDeep ? "deep-itm" : "itm";
  return isDeep ? "deep-otm" : "otm";
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

  // Determine where the ATM boundary falls for inserting a separator
  // Find the transition point between ITM and OTM in the sorted list
  let atmBoundaryIndex = -1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const thisRegion = getRegion(sorted[i].strike, underlyingPrice, sorted[i].type);
    const nextRegion = getRegion(sorted[i + 1].strike, underlyingPrice, sorted[i + 1].type);

    const thisIsITMSide = thisRegion === "deep-itm" || thisRegion === "itm" || thisRegion === "atm";
    const nextIsOTMSide = nextRegion === "otm" || nextRegion === "deep-otm";

    if (thisIsITMSide && nextIsOTMSide) {
      atmBoundaryIndex = i;
      break;
    }
  }

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
          {sorted.map((c, i) => {
            const mid = midPrice(c.bid, c.ask);
            const mny = moneyness(c.strike, underlyingPrice, c.type);
            const region = getRegion(c.strike, underlyingPrice, c.type);
            const isHighlighted = c.strike === highlightedStrike;
            const isAtmBoundary = i === atmBoundaryIndex;

            return (
              <tr
                key={c.strike}
                className={[
                  `region-${region}`,
                  isHighlighted ? "row-highlighted" : "",
                  isAtmBoundary ? "atm-boundary-row" : "",
                ].filter(Boolean).join(" ")}
              >
                <td>{formatStrike(c.strike)}</td>
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
