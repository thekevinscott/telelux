import type { ThemeName } from './use-theme';

export interface ThemeSelectorProps {
  theme: ThemeName;
  onChange: (theme: ThemeName) => void;
}

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  return (
    <div className="theme-selector">
      <label>
        Theme{' '}
        <select value={theme} onChange={(event) => onChange(event.target.value as ThemeName)}>
          <option value="paper">Paper</option>
          <option value="cool">Cool</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  );
}
