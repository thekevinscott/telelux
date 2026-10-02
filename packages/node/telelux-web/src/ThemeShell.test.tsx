import { act, render } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeContext } from './theme-context';
import { ThemeShell } from './ThemeShell';
import { useTheme } from './use-theme';

vi.mock('./use-theme', async () => {
  const actual = await vi.importActual<typeof import('./use-theme')>('./use-theme');
  return { ...actual, useTheme: vi.fn<typeof actual.useTheme>() };
});

vi.mock('./ThemeSelector', async () => {
  const actual = await vi.importActual<typeof import('./ThemeSelector')>('./ThemeSelector');
  const ThemeSelector: typeof actual.ThemeSelector = ({ theme, onChange }) => (
    <button type="button" data-testid="selector" onClick={() => onChange('dark')}>{theme}</button>
  );
  return { ...actual, ThemeSelector };
});

afterEach(() => {
  vi.mocked(useTheme).mockReset();
});

function ShowTheme() {
  return <output data-testid="theme">{useContext(ThemeContext)}</output>;
}

describe('ThemeShell', () => {
  it('marks its wrapper with the current theme', () => {
    vi.mocked(useTheme).mockReturnValue(['cool', vi.fn()]);
    const { container } = render(<ThemeShell><p>child</p></ThemeShell>);
    const shell = container.firstElementChild;
    expect(container.children).toHaveLength(1);
    expect(shell).toHaveClass('theme-shell');
    expect(shell).toHaveAttribute('data-theme', 'cool');
  });

  it('shows the selector with the current theme ahead of its children', () => {
    vi.mocked(useTheme).mockReturnValue(['dark', vi.fn()]);
    const { getByTestId, container } = render(<ThemeShell><p>child</p></ThemeShell>);
    expect(getByTestId('selector')).toHaveTextContent('dark');
    expect(container.firstElementChild?.lastElementChild).toHaveTextContent('child');
  });

  it('passes a choice from the selector to the hook', () => {
    const choose = vi.fn();
    vi.mocked(useTheme).mockReturnValue(['paper', choose]);
    const { getByTestId } = render(<ThemeShell><p>child</p></ThemeShell>);
    act(() => getByTestId('selector').click());
    expect(choose).toHaveBeenCalledExactlyOnceWith('dark');
  });

  it('provides the current theme to its children', () => {
    vi.mocked(useTheme).mockReturnValue(['cool', vi.fn()]);
    const { getByTestId } = render(<ThemeShell><ShowTheme /></ThemeShell>);
    expect(getByTestId('theme')).toHaveTextContent('cool');
  });

  it('does not re-render children that ignore the theme when it changes', () => {
    const renders = vi.fn();
    function Loader() {
      renders();
      return <p>loaded</p>;
    }
    const children = <><Loader /><ShowTheme /></>;
    vi.mocked(useTheme).mockReturnValue(['paper', vi.fn()]);
    const { rerender, getByTestId } = render(<ThemeShell>{children}</ThemeShell>);
    vi.mocked(useTheme).mockReturnValue(['dark', vi.fn()]);
    rerender(<ThemeShell>{children}</ThemeShell>);
    expect(getByTestId('theme')).toHaveTextContent('dark');
    expect(renders).toHaveBeenCalledOnce();
  });
});
