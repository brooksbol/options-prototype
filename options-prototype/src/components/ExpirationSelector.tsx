/**
 * ExpirationSelector — expiration date selection dropdown with DTE display.
 *
 * Responsibility: Render expiration selection with formatted labels.
 * Must not: Compute DTE, fetch data, access hooks directly.
 *
 * Reference: docs/05-design.md (ExpirationSelector)
 * Reference: docs/05a-component-map.md (ExpirationSelector)
 */

import type { Expiration } from "../domain/types";

interface Props {
  expirations: Expiration[];
  selected: string;
  onSelect: (date: string) => void;
}

function formatExpiration(exp: Expiration): string {
  const date = new Date(exp.date + "T00:00:00");
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day} (${exp.dte} DTE)`;
}

export function ExpirationSelector({ expirations, selected, onSelect }: Props) {
  return (
    <div className="control-group">
      <label className="control-label">
        Expiration:
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="control-select"
        >
          {expirations.map((exp) => (
            <option key={exp.date} value={exp.date}>
              {formatExpiration(exp)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
