import { useEffect, useState } from 'react';

export const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export function NumberField({ label, value, suffix, min, max, step, onChange }: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  function commit(rawValue: string) {
    if (rawValue.trim() === '') {
      return;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      setDraftValue(String(value));
      return;
    }

    const clampedValue = clampNumber(numericValue, min, max);
    setDraftValue(String(clampedValue));
    onChange(clampedValue);
  }

  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-row">
        <input
          aria-label={label}
          type="number"
          inputMode="decimal"
          value={draftValue}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraftValue(nextValue);
            if (nextValue.trim() !== '') {
              const numericValue = Number(nextValue);
              if (Number.isFinite(numericValue)) {
                onChange(clampNumber(numericValue, min, max));
              }
            }
          }}
          onBlur={(event) => commit(event.target.value)}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}
