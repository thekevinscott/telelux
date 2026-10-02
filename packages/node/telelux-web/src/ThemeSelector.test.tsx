import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeSelector } from './ThemeSelector';

describe('ThemeSelector', () => {
  it('offers paper, cool and dark under a Theme label', () => {
    const { getByLabelText, getAllByRole } = render(<ThemeSelector theme="paper" onChange={vi.fn()} />);
    expect(getByLabelText('Theme')).toBeInstanceOf(HTMLSelectElement);
    expect(getAllByRole('option').map((option) => [option.getAttribute('value'), option.textContent])).toStrictEqual([
      ['paper', 'Paper'],
      ['cool', 'Cool'],
      ['dark', 'Dark'],
    ]);
  });

  it.each(['paper', 'cool', 'dark'] as const)('shows %s as selected', (theme) => {
    const { getByLabelText } = render(<ThemeSelector theme={theme} onChange={vi.fn()} />);
    expect(getByLabelText('Theme')).toHaveValue(theme);
  });

  it('reports the chosen theme', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<ThemeSelector theme="paper" onChange={onChange} />);
    fireEvent.change(getByLabelText('Theme'), { target: { value: 'cool' } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith('cool');
  });

  it('sits in a toolbar of its own', () => {
    const { container } = render(<ThemeSelector theme="dark" onChange={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass('theme-selector');
  });
});
