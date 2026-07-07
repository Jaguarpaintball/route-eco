/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('lets the user clear the value before typing a new number', () => {
    const onChange = vi.fn();

    render(<NumberField label="Péage estimé / manuel" value={28} suffix="€" min={0} max={250} step={0.5} onChange={onChange} />);

    const input = screen.getByLabelText('Péage estimé / manuel') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    expect(input.value).toBe('');
    expect(onChange).not.toHaveBeenCalledWith(0);
  });

  it('lets motorway speed be typed as an exact custom value', () => {
    const onChange = vi.fn();

    render(<NumberField label="Autoroute max" value={120} suffix="km/h" min={70} max={140} onChange={onChange} />);

    const input = screen.getByLabelText('Autoroute max') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: '115' } });

    expect(input.value).toBe('115');
    expect(onChange).toHaveBeenLastCalledWith(115);
  });
});
