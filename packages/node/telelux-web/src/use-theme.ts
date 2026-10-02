import { useCallback, useState } from 'react';

export type ThemeName = 'paper' | 'cool' | 'dark';

export function useTheme(): [ThemeName, (theme: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      const stored = window.localStorage.getItem('telelux-theme');
      return stored === 'cool' || stored === 'dark' ? stored : 'paper';
    } catch {
      return 'paper';
    }
  });
  const choose = useCallback((next: ThemeName) => {
    setTheme(next);
    try {
      window.localStorage.setItem('telelux-theme', next);
    } catch {
      return;
    }
  }, []);
  return [theme, choose];
}
