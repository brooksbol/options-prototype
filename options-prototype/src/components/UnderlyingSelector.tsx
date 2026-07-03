/**
 * UnderlyingSelector — ETF selection dropdown with current price display.
 *
 * Responsibility: Render ETF selection and display selected price.
 * Must not: Fetch data, perform calculations, access hooks directly.
 *
 * Reference: docs/05-design.md (UnderlyingSelector)
 * Reference: docs/05a-component-map.md (UnderlyingSelector)
 */

import type { Underlying } from "../domain/types";

interface Props {
  underlyings: Underlying[];
  selected: string;
  onSelect: (symbol: string) => void;
}

export function UnderlyingSelector({ underlyings, selected, onSelect }: Props) {
  const selectedUnderlying = underlyings.find((u) => u.symbol === selected);

  return (
    <div className="control-group">
      <label className="control-label">
        Underlying:
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="control-select"
        >
          {underlyings.map((u) => (
            <option key={u.symbol} value={u.symbol}>
              {u.symbol}
            </option>
          ))}
        </select>
      </label>
      {selectedUnderlying && (
        <span className="underlying-price">
          ${selectedUnderlying.price.toFixed(2)}
        </span>
      )}
    </div>
  );
}
