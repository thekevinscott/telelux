import './themes.css';

import type { ReactNode } from 'react';

import { ThemeContext } from './theme-context';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from './use-theme';

export function ThemeShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useTheme();
  return (
    <div className="theme-shell" data-theme={theme}>
      <ThemeSelector theme={theme} onChange={setTheme} />
      <ThemeContext value={theme}>{children}</ThemeContext>
    </div>
  );
}
