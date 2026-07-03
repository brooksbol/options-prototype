/**
 * DeltaInput — numeric input for target delta.
 *
 * Responsibility: Render input with min/max/step constraints.
 * Must not: Perform delta matching, know about contracts, own policy state.
 *
 * Reference: docs/05-design.md (DeltaInput)
 * Reference: docs/05a-component-map.md (DeltaInput)
 */

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function DeltaInput({ value, onChange }: Props) {
  return (
    <div className="control-group">
      <label className="control-label">
        Target Delta:
        <input
          type="number"
          min={0.01}
          max={0.99}
          step={0.01}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="control-input"
        />
      </label>
    </div>
  );
}
